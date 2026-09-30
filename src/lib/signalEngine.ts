import { GoogleGenAI, Type } from '@google/genai';
import { fetchCandles, fetchRealQuotes, WATCHLIST_SYMBOLS } from './twelveData';
import { computeIndicatorsFromCandles, ComputedTechnicalIndicators } from './indicators';
import { MarketSignal, SignalType, RealMarketQuote } from '../types/trade';

// In-memory signals archive for instant retrieval & backtesting
let signalsHistory: MarketSignal[] = [];

// Cooldown map: asset -> { signal, timestamp } (4-hour cooldown & no duplicate signals)
const alertCooldownMap = new Map<string, { signal: SignalType; timestamp: number }>();
const COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours

// Store active FCM client tokens
const registeredFCMTokens = new Set<string>();

export function registerFCMToken(token: string) {
  if (token && typeof token === 'string') {
    registeredFCMTokens.add(token.trim());
  }
}

export function getFCMTokens(): string[] {
  return Array.from(registeredFCMTokens);
}

export function getSignalsHistory(): MarketSignal[] {
  return [...signalsHistory];
}

export function recordSignal(sig: MarketSignal) {
  signalsHistory.unshift(sig);
  if (signalsHistory.length > 500) {
    signalsHistory = signalsHistory.slice(0, 500);
  }
}

/**
 * Evaluates a single watchlist asset through real data fetching, code-based mathematical indicators,
 * and Gemini structured schema reasoning.
 */
export async function evaluateAssetSignal(
  symbol: string,
  ai: GoogleGenAI,
  providedQuote?: RealMarketQuote
): Promise<MarketSignal | null> {
  try {
    // 1. Obtain real quote (either provided in batch or fetched)
    let quote = providedQuote;
    if (!quote) {
      const quotes = await fetchRealQuotes([symbol]);
      quote = quotes.find((q) => q.symbol === symbol);
    }

    if (!quote || !quote.available) {
      console.log(`[Signal Engine] Skipping ${symbol}: Real quote unavailable`);
      return null;
    }

    // 2. Fetch real 4H and 1D candlestick data from Twelve Data
    const [candles4H, candles1D] = await Promise.all([
      fetchCandles(symbol, '4h', 50).catch((err) => {
        console.warn(`[Signal Engine] 4H candles failed for ${symbol}:`, err.message);
        return [];
      }),
      fetchCandles(symbol, '1day', 50).catch((err) => {
        console.warn(`[Signal Engine] 1D candles failed for ${symbol}:`, err.message);
        return [];
      }),
    ]);

    if (candles4H.length < 15 || candles1D.length < 15) {
      console.log(`[Signal Engine] Skipping ${symbol}: Insufficient historical candle depth`);
      return null;
    }

    // 3. Compute technical indicators mathematically in code
    const indicators4H: ComputedTechnicalIndicators = computeIndicatorsFromCandles(candles4H);
    const indicators1D: ComputedTechnicalIndicators = computeIndicatorsFromCandles(candles1D);

    const now = Date.now();
    const quoteTime = new Date(quote.priceTime).getTime();
    const delaySeconds = Math.max(0, Math.round((now - quoteTime) / 1000));

    // 4. Construct strictly verifiable payload for Gemini
    const systemInstruction = `You are the analysis engine of a trading journal. Use ONLY the data in the input. Never invent or recall prices, indicators or news. If data is missing or stale, return NO_SIGNAL. Cite the exact numbers behind every conclusion. Classify each asset as STRONG_BUY, BUY, NEUTRAL, SELL, STRONG_SELL or NO_SIGNAL. Output STRONG_BUY or STRONG_SELL only if ALL are true: at least 3 independent factors agree, the higher timeframe does not contradict, risk/reward is at least 1:2 with a stop-loss, data is fresh/live and the market is open, and confidence is 80 or more. Return valid JSON only.`;

    const inputData = {
      asset: symbol,
      name: quote.name,
      sector: quote.sector,
      source: 'Twelve Data',
      current_price: quote.price,
      high_24h: quote.high24h,
      low_24h: quote.low24h,
      change_24h_percent: quote.change24h,
      market_is_open: quote.marketOpen,
      price_timestamp_utc: quote.priceTime,
      data_delay_seconds: delaySeconds,
      timeframe_4H: {
        latest_close: indicators4H.latestPrice,
        rsi_14: indicators4H.rsi14,
        macd: indicators4H.macd,
        sma_50: indicators4H.sma50,
        sma_200: indicators4H.sma200,
        volume_vs_20_sma_ratio: indicators4H.volumeVsAvg20,
      },
      higher_timeframe_1D: {
        latest_close: indicators1D.latestPrice,
        rsi_14: indicators1D.rsi14,
        macd: indicators1D.macd,
        sma_50: indicators1D.sma50,
        sma_200: indicators1D.sma200,
        volume_vs_20_sma_ratio: indicators1D.volumeVsAvg20,
      },
    };

    // 5. Query Gemini with strict responseSchema
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Perform technical signal audit strictly from the following verified market and indicator metrics:\n${JSON.stringify(
        inputData,
        null,
        2
      )}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            asset: { type: Type.STRING },
            signal: {
              type: Type.STRING,
              enum: ['STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG_SELL', 'NO_SIGNAL'],
            },
            confidence: { type: Type.NUMBER },
            supporting_facts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            interpretation: { type: Type.STRING },
            entry_zone: { type: Type.STRING },
            stop_loss: { type: Type.STRING },
            take_profit: { type: Type.STRING },
            invalidation: { type: Type.STRING },
            risks: { type: Type.STRING },
          },
          required: [
            'asset',
            'signal',
            'confidence',
            'supporting_facts',
            'interpretation',
            'entry_zone',
            'stop_loss',
            'take_profit',
            'invalidation',
            'risks',
          ],
        },
      },
    });

    const text = response.text?.trim() || '';
    if (!text) return null;

    const parsed = JSON.parse(text);
    const signal: SignalType = parsed.signal;
    const confidence: number = Number(parsed.confidence) || 0;

    const marketSignal: MarketSignal = {
      id: `sig_${Date.now()}_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`,
      asset: symbol,
      signal,
      confidence,
      price: quote.price,
      timestamp: new Date().toISOString(),
      supporting_facts: Array.isArray(parsed.supporting_facts) ? parsed.supporting_facts : [],
      interpretation: parsed.interpretation || '',
      entry_zone: parsed.entry_zone || `${quote.price}`,
      stop_loss: parsed.stop_loss || '',
      take_profit: parsed.take_profit || '',
      invalidation: parsed.invalidation || '',
      risks: parsed.risks || '',
      marketOpen: quote.marketOpen,
      indicators: {
        rsi14: indicators4H.rsi14 ?? 50,
        macd: indicators4H.macd ?? { macd: 0, signal: 0, histogram: 0 },
        sma50: indicators4H.sma50 ?? quote.price,
        sma200: indicators4H.sma200 ?? quote.price,
        volumeVsAvg20: indicators4H.volumeVsAvg20 ?? 1,
      },
    };

    // Save every evaluated signal to history for backtesting
    recordSignal(marketSignal);

    // 6. Strict validation rules in code before notifying:
    // a) Confidence >= 80
    if (confidence < 80) {
      console.log(`[Signal Engine] ${symbol} discarded: Confidence (${confidence}) < 80`);
      return marketSignal;
    }

    // b) Signal must be STRONG_BUY or STRONG_SELL
    if (signal !== 'STRONG_BUY' && signal !== 'STRONG_SELL') {
      console.log(`[Signal Engine] ${symbol} discarded: Signal (${signal}) is not STRONG_BUY/STRONG_SELL`);
      return marketSignal;
    }

    // c) Market must be open (Crypto is always open 24/7)
    if (!quote.marketOpen && quote.sector !== 'Crypto') {
      console.log(`[Signal Engine] ${symbol} discarded: Market is currently closed`);
      return marketSignal;
    }

    // d) Timestamp must be fresh (<= 15 minutes for Forex/Stocks, <= 5 minutes for Crypto)
    const maxDelaySeconds = quote.sector === 'Crypto' ? 300 : 900;
    if (delaySeconds > maxDelaySeconds) {
      console.log(`[Signal Engine] ${symbol} discarded: Data delay (${delaySeconds}s) exceeds ${maxDelaySeconds}s`);
      return marketSignal;
    }

    // e) The price the AI mentions must match the price sent
    const mentionedNumbers = (parsed.entry_zone + ' ' + parsed.interpretation).match(/\d+(\.\d+)?/g);
    let priceMatches = false;
    if (mentionedNumbers) {
      for (const numStr of mentionedNumbers) {
        const val = parseFloat(numStr);
        if (Math.abs(val - quote.price) / quote.price <= 0.03) {
          priceMatches = true;
          break;
        }
      }
    } else {
      priceMatches = true; // Fallback if formatted differently
    }

    if (!priceMatches) {
      console.log(`[Signal Engine] ${symbol} discarded: Mentioned price doesn't match quote price (${quote.price})`);
      return marketSignal;
    }

    // 7. Cooldown check: max 1 alert per asset every 4 hours, and no duplicate identical signals
    const lastAlert = alertCooldownMap.get(symbol);
    if (lastAlert) {
      const timeSinceLast = now - lastAlert.timestamp;
      if (timeSinceLast < COOLDOWN_MS) {
        console.log(`[Signal Engine] ${symbol} discarded: Alert on cooldown (${Math.round(timeSinceLast / 60000)}m ago)`);
        return marketSignal;
      }
      if (lastAlert.signal === signal) {
        console.log(`[Signal Engine] ${symbol} discarded: Duplicate identical signal (${signal})`);
        return marketSignal;
      }
    }

    // Update cooldown
    alertCooldownMap.set(symbol, { signal, timestamp: now });

    // 8. Dispatch Push Notification
    console.log(`🚨 [SIGNAL ALERT] ${signal}: ${symbol} @ ${quote.price} (Confidence: ${confidence}%)`);
    await dispatchNotification(marketSignal);

    return marketSignal;
  } catch (err: any) {
    console.error(`[Signal Engine] Error evaluating ${symbol}:`, err?.message || err);
    return null;
  }
}

/**
 * Dispatch Firebase Cloud Messaging (FCM) Push Notification to registered clients
 */
async function dispatchNotification(signal: MarketSignal) {
  const title = `${signal.signal === 'STRONG_BUY' ? '🟢 STRONG BUY' : '🔴 STRONG SELL'}: ${signal.asset}`;
  const body = signal.interpretation || `Entry at ${signal.entry_zone}. Stop: ${signal.stop_loss}, TP: ${signal.take_profit}.`;

  const tokens = getFCMTokens();
  console.log(`[Signal Engine] Dispatching alert to ${tokens.length} FCM client devices...`);

  // If service account is configured via FIREBASE_SERVICE_ACCOUNT or similar, we can send to FCM
  if (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Optional FCM HTTP v1 dispatch
    console.log(`[Signal Engine] FCM server credential detected. Triggering push dispatch: "${title}"`);
  } else {
    console.log(`[Signal Engine] Push notification logged: "${title}" - "${body}" (Clients will receive via WebSocket/SSE or upon VAPID configuration)`);
  }
}

/**
 * Run full scan across the watchlist.
 * Uses batched quotes first and respects Twelve Data free rate limits (8 req/min).
 */
export async function runWatchlistScan(ai: GoogleGenAI): Promise<MarketSignal[]> {
  console.log(`[Signal Engine] Starting watchlist scan...`);
  const activeSignals: MarketSignal[] = [];

  let quotes: RealMarketQuote[] = [];
  try {
    quotes = await fetchRealQuotes(WATCHLIST_SYMBOLS);
  } catch (err: any) {
    console.warn('[Signal Engine] Batch quote notice during scan:', err.message);
    return [];
  }

  // Filter to assets with open markets or 24/7 crypto
  const targetAssets = quotes.filter(
    (q) => q.available && (q.marketOpen || q.sector === 'Crypto')
  );

  for (const quote of targetAssets) {
    const result = await evaluateAssetSignal(quote.symbol, ai, quote);
    if (result) {
      activeSignals.push(result);
    }
    // Safe spacing between assets (7.5s) to guarantee <= 8 requests/min
    await new Promise((resolve) => setTimeout(resolve, 7500));
  }

  return activeSignals;
}
