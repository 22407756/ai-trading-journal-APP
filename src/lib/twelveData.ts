import { Candle } from './indicators';
import { RealMarketQuote } from '../types/trade';

/**
 * Core Watchlist: Exactly 6 primary symbols spanning all 4 sectors.
 * In Twelve Data, 1 batch of 6 symbols costs exactly 6 credits (1 credit/symbol).
 * This strictly guarantees usage stays <= 6 credits per batch, safely below the 8 credits/min limit.
 */
export const WATCHLIST_SYMBOLS = [
  'BTC/USD', // Crypto
  'ETH/USD', // Crypto
  'SOL/USD', // Crypto
  'EUR/USD', // Forex
  'XAU/USD', // Commodities
  'SPY',     // Stocks (S&P 500)
] as const;

export interface SymbolMeta {
  symbol: string;
  name: string;
  sector: 'Crypto' | 'Forex' | 'Commodities' | 'Stocks';
}

export const SYMBOL_METADATA: Record<string, SymbolMeta> = {
  'BTC/USD': { symbol: 'BTC/USD', name: 'Bitcoin', sector: 'Crypto' },
  'ETH/USD': { symbol: 'ETH/USD', name: 'Ethereum', sector: 'Crypto' },
  'SOL/USD': { symbol: 'SOL/USD', name: 'Solana', sector: 'Crypto' },
  'EUR/USD': { symbol: 'EUR/USD', name: 'Euro / US Dollar', sector: 'Forex' },
  'GBP/USD': { symbol: 'GBP/USD', name: 'British Pound / USD', sector: 'Forex' },
  'USD/JPY': { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', sector: 'Forex' },
  'XAU/USD': { symbol: 'XAU/USD', name: 'Gold Spot', sector: 'Commodities' },
  'SPY': { symbol: 'SPY', name: 'S&P 500 ETF', sector: 'Stocks' },
  'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corp', sector: 'Stocks' },
  'AAPL': { symbol: 'AAPL', name: 'Apple Inc', sector: 'Stocks' },
  'TSLA': { symbol: 'TSLA', name: 'Tesla Inc', sector: 'Stocks' },
  'MSFT': { symbol: 'MSFT', name: 'Microsoft Corp', sector: 'Stocks' },
};

/* ==========================================================================
   RATE LIMITER: Strict 8 credits/min & 800 credits/day Hard Guard
   ========================================================================== */
class TwelveDataRateLimiter {
  private windowStart = Date.now();
  private creditsUsedThisMinute = 0;
  private readonly MAX_CREDITS_PER_MINUTE = 8;

  private dayStart = Date.now();
  private creditsUsedToday = 0;
  private readonly MAX_CREDITS_PER_DAY = 750; // Safety cap safely below 800

  public canAfford(cost: number): boolean {
    const now = Date.now();

    // Reset minute window if 60 seconds elapsed
    if (now - this.windowStart >= 60_000) {
      this.windowStart = now;
      this.creditsUsedThisMinute = 0;
    }

    // Reset day window if 24 hours elapsed
    if (now - this.dayStart >= 24 * 60 * 60 * 1000) {
      this.dayStart = now;
      this.creditsUsedToday = 0;
    }

    if (this.creditsUsedToday + cost > this.MAX_CREDITS_PER_DAY) {
      console.warn(
        `[RateLimiter] BLOCKED: Daily credit limit safety threshold reached (${this.creditsUsedToday}/${this.MAX_CREDITS_PER_DAY})`
      );
      return false;
    }

    if (this.creditsUsedThisMinute + cost > this.MAX_CREDITS_PER_MINUTE) {
      console.warn(
        `[RateLimiter] BLOCKED: Minute rate limit reached (${this.creditsUsedThisMinute}/${this.MAX_CREDITS_PER_MINUTE} used). Cooling down.`
      );
      return false;
    }

    return true;
  }

  public recordUsage(cost: number) {
    this.creditsUsedThisMinute += cost;
    this.creditsUsedToday += cost;
    console.log(
      `[Twelve Data RateLimiter] +${cost} credit(s). Minute: ${this.creditsUsedThisMinute}/${this.MAX_CREDITS_PER_MINUTE} | Today: ${this.creditsUsedToday}/${this.MAX_CREDITS_PER_DAY}`
    );
  }

  public syncUsage(used: number, limit: number = 800) {
    if (used > this.creditsUsedToday) {
      this.creditsUsedToday = used;
      console.log(`[Twelve Data RateLimiter] Synced daily credit counter from Twelve Data: ${used}/${limit}`);
    }
  }

  public getStatus() {
    const now = Date.now();
    if (now - this.windowStart >= 60_000) {
      this.windowStart = now;
      this.creditsUsedThisMinute = 0;
    }
    return {
      minuteCreditsUsed: this.creditsUsedThisMinute,
      maxPerMinute: this.MAX_CREDITS_PER_MINUTE,
      dayCreditsUsed: this.creditsUsedToday,
      maxPerDay: 800,
    };
  }
}

export const rateLimiter = new TwelveDataRateLimiter();

let lastUsageCheckTime = 0;
/**
 * Query Twelve Data api_usage endpoint to sync real server credit counter.
 * Throttled to at most once per 60 seconds to avoid wasting credits.
 */
export async function syncUsageFromApi(): Promise<void> {
  const now = Date.now();
  if (now - lastUsageCheckTime < 60_000) {
    return;
  }
  lastUsageCheckTime = now;

  const apiKey = process.env.TWELVE_DATA_KEY;
  if (!apiKey || apiKey === 'MY_TWELVE_DATA_KEY') return;

  try {
    const res = await fetch(`https://api.twelvedata.com/api_usage?apikey=${apiKey}`, {
      headers: { 'User-Agent': 'TradingJournalAI/1.0' },
    });
    const json = await res.json();
    if (json.current_usage !== undefined) {
      rateLimiter.syncUsage(Number(json.current_usage), Number(json.plan_limit) || 800);
    } else if (typeof json.message === 'string') {
      const match = json.message.match(/(\d+)\s+API credits were used/i);
      if (match && match[1]) {
        rateLimiter.syncUsage(parseInt(match[1], 10), 800);
      }
    }
  } catch (err: any) {
    console.warn('[Twelve Data] Could not sync api_usage:', err?.message || err);
  }
}

/* ==========================================================================
   SHARED IN-MEMORY CACHE
   Serves Market Pulse, Chart Vision, and Signal Engine seamlessly.
   ========================================================================== */
const quotesCache = new Map<string, { quote: RealMarketQuote; timestamp: number }>();
export const QUOTE_CACHE_TTL_MS = 90 * 1000; // 90 seconds shared TTL

// Single-flight in-progress fetch promise to coalesce simultaneous requests
let inFlightFetchPromise: Promise<boolean> | null = null;
let lastSuccessfulBatchTime = 0;

// Candle cache (4 hours TTL)
const candleCache = new Map<string, { data: Candle[]; timestamp: number }>();
const CANDLE_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Fetch a single comma-separated batch of quotes from Twelve Data.
 * Enforces strict rate limits before making the call.
 */
async function fetchBatchDirect(symbols: readonly string[]): Promise<boolean> {
  const apiKey = process.env.TWELVE_DATA_KEY;
  if (!apiKey || apiKey === 'MY_TWELVE_DATA_KEY') {
    throw new Error('TWELVE_DATA_KEY is not configured in environment variables');
  }

  const creditCost = symbols.length;
  if (!rateLimiter.canAfford(creditCost)) {
    return false;
  }

  const symbolsParam = encodeURIComponent(symbols.join(','));
  const url = `https://api.twelvedata.com/quote?symbol=${symbolsParam}&apikey=${apiKey}`;

  console.log(`[Twelve Data] Requesting batch quotes (${creditCost} credits) for: ${symbols.join(', ')}...`);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'TradingJournalAI/1.0',
      },
    });
  } catch (networkErr: any) {
    console.warn('[Twelve Data] Network request failed:', networkErr.message);
    return false;
  }

  // Record credit usage immediately after response arrives
  rateLimiter.recordUsage(creditCost);

  if (!response.ok) {
    if (response.status === 429) {
      try {
        const errJson = await response.json();
        console.warn('[Twelve Data] HTTP 429 encountered from Twelve Data:', errJson?.message);
        if (typeof errJson?.message === 'string') {
          const match = errJson.message.match(/(\d+)\s+API credits were used/i);
          if (match && match[1]) {
            rateLimiter.syncUsage(parseInt(match[1], 10), 800);
          }
        }
      } catch (_) {}
      return false;
    }
    throw new Error(`Twelve Data API HTTP error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();

  if (json.status === 'error') {
    console.warn('[Twelve Data] API notice:', json.message);
    if (typeof json.message === 'string') {
      const match = json.message.match(/(\d+)\s+API credits were used/i);
      if (match && match[1]) {
        rateLimiter.syncUsage(parseInt(match[1], 10), 800);
      }
    }
    return false;
  }

  const now = Date.now();
  let parsedCount = 0;

  for (const sym of symbols) {
    const meta = SYMBOL_METADATA[sym] || {
      symbol: sym,
      name: sym,
      sector: sym.includes('/') ? (sym.startsWith('XAU') ? 'Commodities' : 'Forex') : 'Stocks',
    };

    const rawQuote = json[sym] || (json.symbol === sym ? json : null);
    if (!rawQuote || rawQuote.status === 'error' || rawQuote.close === undefined) {
      continue;
    }

    const price = parseFloat(rawQuote.close) || parseFloat(rawQuote.previous_close) || 0;
    const change24h = parseFloat(rawQuote.percent_change) || 0;
    const high24h = parseFloat(rawQuote.high) || (price > 0 ? price : 0);
    const low24h = parseFloat(rawQuote.low) || (price > 0 ? price : 0);

    // Crypto markets are open 24/7/365. Market hours only apply to Forex/Stocks.
    const isCrypto = meta.sector === 'Crypto';
    const marketOpen = isCrypto ? true : Boolean(rawQuote.is_market_open);

    // Never accept 0 or invalid prices as available
    if (!price || isNaN(price) || price <= 0) {
      continue;
    }

    let priceTime = new Date().toISOString();
    if (rawQuote.timestamp) {
      priceTime = new Date(rawQuote.timestamp * 1000).toISOString();
    } else if (rawQuote.datetime) {
      priceTime = new Date(rawQuote.datetime.replace(' ', 'T') + 'Z').toISOString();
    }

    quotesCache.set(sym, {
      quote: {
        symbol: sym,
        name: rawQuote.name || meta.name,
        sector: meta.sector,
        price: Number(price.toFixed(meta.sector === 'Forex' ? 4 : 2)),
        change24h: Number(change24h.toFixed(2)),
        high24h: Number(high24h.toFixed(meta.sector === 'Forex' ? 4 : 2)),
        low24h: Number(low24h.toFixed(meta.sector === 'Forex' ? 4 : 2)),
        marketOpen,
        priceTime,
        source: 'Twelve Data',
        available: true,
      },
      timestamp: now,
    });
    parsedCount++;
  }

  if (parsedCount > 0) {
    lastSuccessfulBatchTime = now;
  }

  return parsedCount > 0;
}

/**
 * Fetch real quotes for a list of symbols from Twelve Data API.
 * Uses shared in-memory caching (90s TTL), request coalescing, and credit rate-limiting.
 * Used by Market Pulse, Chart Vision, and Signal Engine.
 */
export async function fetchRealQuotes(
  symbols: readonly string[] = WATCHLIST_SYMBOLS,
  forceRefresh = false
): Promise<RealMarketQuote[]> {
  const now = Date.now();

  // 1. Check if all requested symbols are already fresh in memory
  const needsRefresh = forceRefresh || symbols.some((sym) => {
    const cached = quotesCache.get(sym);
    return !cached || now - cached.timestamp >= QUOTE_CACHE_TTL_MS;
  });

  // 2. If fresh data is needed and no fetch is in flight, execute or coalesce
  if (needsRefresh) {
    if (!inFlightFetchPromise) {
      inFlightFetchPromise = (async () => {
        try {
          // If the requested symbols are part of the core watchlist, fetch the core 6 symbols together in 1 single call
          const symbolsToFetch = symbols.every((s) => (WATCHLIST_SYMBOLS as readonly string[]).includes(s))
            ? WATCHLIST_SYMBOLS
            : symbols;

          await fetchBatchDirect(symbolsToFetch);
        } catch (err: any) {
          console.warn('[Twelve Data] Coalesced batch fetch notice:', err.message);
        } finally {
          inFlightFetchPromise = null;
        }
        return true;
      })();
    }

    // Wait for the single-flight request to settle
    await inFlightFetchPromise;
  }

  // 3. Assemble response from the shared cache
  const results: RealMarketQuote[] = [];
  for (const sym of symbols) {
    const cached = quotesCache.get(sym);
    if (cached) {
      results.push(cached.quote);
    } else {
      const meta = SYMBOL_METADATA[sym] || {
        symbol: sym,
        name: sym,
        sector: sym.includes('/') ? (sym.startsWith('XAU') ? 'Commodities' : 'Forex') : 'Stocks',
      };
      const isCrypto = meta.sector === 'Crypto';

      results.push({
        symbol: sym,
        name: meta.name,
        sector: meta.sector,
        price: 0,
        change24h: 0,
        high24h: 0,
        low24h: 0,
        marketOpen: isCrypto ? true : false,
        priceTime: new Date().toISOString(),
        source: 'Twelve Data',
        available: false,
      });
    }
  }

  return results;
}

/**
 * Fetch real historical candlestick data for an asset across specified interval (4h or 1day).
 * Implements 4-hour in-memory caching and rate-limiter protection.
 */
export async function fetchCandles(
  symbol: string,
  interval: '4h' | '1day',
  outputsize = 50
): Promise<Candle[]> {
  const cacheKey = `${symbol}_${interval}`;
  const now = Date.now();
  const cached = candleCache.get(cacheKey);

  // Return from 4-hour cache if fresh
  if (cached && now - cached.timestamp < CANDLE_CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = process.env.TWELVE_DATA_KEY;
  if (!apiKey || apiKey === 'MY_TWELVE_DATA_KEY') {
    throw new Error('TWELVE_DATA_KEY is not configured in environment variables');
  }

  // Guard: Each candle request costs 1 credit. Only proceed if budget permits.
  if (!rateLimiter.canAfford(1)) {
    if (cached) return cached.data;
    console.warn(`[Twelve Data Candles] Blocked ${symbol} (${interval}) to preserve credit budget.`);
    return [];
  }

  const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(
    symbol
  )}&interval=${interval}&outputsize=${outputsize}&apikey=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'TradingJournalAI/1.0',
      },
    });
  } catch (err: any) {
    if (cached) return cached.data;
    throw err;
  }

  rateLimiter.recordUsage(1);

  if (response.status === 429) {
    console.warn(`[Twelve Data] Rate limit (429) fetching candles for ${symbol} (${interval}).`);
    if (cached) return cached.data;
    return [];
  }

  if (!response.ok) {
    if (cached) return cached.data;
    throw new Error(`Twelve Data Candles HTTP ${response.status}: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.status === 'error' || !Array.isArray(json.values)) {
    if (cached) return cached.data;
    return [];
  }

  const candles: Candle[] = json.values.map((v: any) => ({
    datetime: v.datetime,
    open: parseFloat(v.open) || 0,
    high: parseFloat(v.high) || 0,
    low: parseFloat(v.low) || 0,
    close: parseFloat(v.close) || 0,
    volume: parseFloat(v.volume) || 0,
  }));

  const sorted = candles.sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  candleCache.set(cacheKey, {
    data: sorted,
    timestamp: now,
  });

  return sorted;
}
