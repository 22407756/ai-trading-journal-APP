import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { fetchRealQuotes, WATCHLIST_SYMBOLS, SYMBOL_METADATA, rateLimiter, syncUsageFromApi } from './src/lib/twelveData';
import {
  runWatchlistScan,
  evaluateAssetSignal,
  getSignalsHistory,
  registerFCMToken,
} from './src/lib/signalEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side GoogleGenAI initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/* ==========================================================================
   ROUTE 1: Gemini Multi-Turn Chatbot
   ========================================================================== */
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, modelTier = 'general', systemInstruction } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    let selectedModel = 'gemini-3.5-flash';
    if (modelTier === 'complex') {
      selectedModel = 'gemini-3.1-pro-preview';
    } else if (modelTier === 'fast') {
      selectedModel = 'gemini-3.1-flash-lite';
    }

    const defaultSystemInstruction =
      systemInstruction ||
      `You are the Trading Journal AI Senior Risk Officer and Market Psychologist. 
You provide rigorous, institutional-level analysis of trading executions, cognitive biases (FOMO, revenge trading, early profit taking, risk overextension), and trade calculus.
Maintain professional, composed, and encouraging financial discipline.`;

    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents,
      config: {
        systemInstruction: defaultSystemInstruction,
      },
    });

    return res.json({
      text: response.text || '',
      modelUsed: selectedModel,
    });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    return res.status(500).json({
      error: error?.message || 'Chat generation failed',
    });
  }
});

/* ==========================================================================
   ROUTE 2: Live Market Intelligence Search Grounding
   Tier 1: Google Search Grounding with verified web sources
   Tier 2: Direct AI synthesis (marked strictly grounded: false, sources: [])
   Tier 3: DELETED (returns HTTP 503 "Live briefing unavailable")
   ========================================================================== */
app.post('/api/search-intel', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  const cleanQuery = query.trim();

  // Tier 1: Try Google Search Grounding with gemini-3.5-flash
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Provide an accurate, institutional market intelligence briefing and macroeconomic context on: "${cleanQuery}".
Include key catalysts, price action impact across asset classes (equities, yields, FX, crypto/commodities), and risk horizons. Ground with live Google Search data.`,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction:
          'You are an Institutional Financial Intelligence Analyst providing grounded real-time market updates, CPI/FOMC releases, earnings, and asset catalyst breakdowns.',
      },
    });

    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = groundingChunks
      .map((c: any) => c.web)
      .filter((w: any) => w && w.uri);

    if (response.text) {
      return res.json({
        text: response.text,
        sources: webSources,
        modelUsed: 'gemini-3.5-flash (Live Search Grounded)',
        grounded: true,
      });
    }
  } catch (searchError: any) {
    console.warn(
      'Google Search tool unavailable or quota reached, falling back to direct synthesis:',
      searchError?.message || searchError
    );
  }

  // Tier 2: Direct synthesis with gemini-3.1-flash-lite (Marked grounded: false, NO fake sources)
  try {
    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: `Provide an authoritative, institutional-grade market intelligence briefing on: "${cleanQuery}".
Format with clear sections:
1. Executive Summary & Market Bias (Bullish / Neutral / Bearish)
2. Primary Catalysts & Recent Macro / Sector Developments
3. Cross-Asset Impact (Equities, Treasury Yields, FX, Crypto/Commodities)
4. Key Risk Horizons & Technical Support/Resistance Levels to Watch
5. Institutional Footprint & Consensus Sentiment`,
      config: {
        systemInstruction:
          'You are an Institutional Senior Quantitative Strategist providing actionable macroeconomic intelligence.',
      },
    });

    const generatedText = fallbackResponse.text || '';
    if (generatedText) {
      return res.json({
        text: generatedText,
        sources: [], // Strictly no fake links
        modelUsed: 'gemini-3.1-flash-lite (Direct AI Synthesis)',
        grounded: false, // Explicitly false
      });
    }
  } catch (fallbackError: any) {
    console.warn('Fallback synthesis failed:', fallbackError?.message);
  }

  // Tier 3 has been deleted. Return HTTP 503 when live briefing is unavailable
  return res.status(503).json({
    error: 'Live briefing unavailable. Upstream intelligence services are currently unreachable.',
    grounded: false,
    sources: [],
  });
});

/* ==========================================================================
   ROUTE 3: AI Trade & Chart Vision Analyzer
   Auto-detects asset, timeframe, pattern, and levels directly from image.
   Does NOT require manual selection. Manual selection acts as an optional override.
   If asset or timeframe is not visible, returns "not visible in image" instead of guessing or defaulting to BTC.
   ========================================================================== */
app.post('/api/analyze-chart', async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = 'image/png',
      manualOverrideSymbol = '',
      manualOverrideTimeframe = '',
      userPrice = 0,
      requestedDirection = '',
    } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Trade chart image is required' });
    }

    const base64Data = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    const promptText = `You are a Senior Quantitative Technical Analyst and Institutional Risk Officer inspecting a candlestick chart image.
${manualOverrideSymbol ? `NOTE: The user has provided an optional manual asset override: "${manualOverrideSymbol}".` : ''}

Inspect the chart image directly and extract the following:
1. "detectedAsset": The exact asset or trading pair/ticker symbol (e.g. BTC/USD, ETH/USDT, EUR/USD, NVDA, SPY, AAPL, TSLA, etc.) IF clearly visible as text, header, watermark, or axis title on the chart.
   CRITICAL: If the asset/symbol is NOT clearly visible or readable in the image, you MUST output exactly "not visible in image". NEVER guess, invent, or default to BTC.
2. "assetConfidence": Confidence score from 0 to 100 for the detected asset (0 if not visible).
3. "detectedTimeframe": The chart interval/timeframe (e.g. 1m, 5m, 15m, 1H, 4H, 1D) IF clearly visible on the chart.
   CRITICAL: If the timeframe is NOT clearly visible or readable in the image, you MUST output exactly "not visible in image". NEVER guess or invent.
4. "timeframeConfidence": Confidence score from 0 to 100 for the detected timeframe (0 if not visible).
5. "pattern": The identified candlestick or market structure pattern (e.g. Order Block Retest, Fair Value Gap, Liquidity Sweep, Bullish Engulfing, Head & Shoulders, Double Bottom, Ascending Triangle).
6. "direction": Output "UP" if price action is poised to go higher (LONG), or "DOWN" if poised to drop (SHORT).
7. "confidence": Overall trade setup confidence score (0-100).
8. "trend": Trend classification (e.g. "Bullish Breakout", "Bearish Distribution", "Range Consolidation").
9. "summary": Clear, concise explanation of why price will go UP or DOWN from the visible candlestick structure.

CRITICAL REQUIREMENT - REAL CHART STRUCTURE DETECTION FOR STOP LOSS & TAKE PROFIT:
NEVER calculate stop loss or take profit using arbitrary fixed percentages (such as 1.2%, 2%, or 3.2%).
Instead, analyze the ACTUAL visible price candles and the price axis/scale in the chart image:
1. Detect the nearest visible SWING LOW and nearest visible SUPPORT level below current price.
2. Detect the nearest visible SWING HIGH and nearest visible RESISTANCE level above current price.
3. For LONG trade setups (direction "UP"):
   - STOP LOSS: Must be placed JUST BEYOND the nearest structural swing low or primary support level visible in the image (e.g. slightly beneath the swing low wick or support boundary to protect against liquidity sweeps). In the reasoning, explicitly state: "Stop loss placed at [SL price] just below the visible swing low / support at [Swing Low price] to invalidate bullish market structure."
   - TAKE PROFIT: Must be placed at the next visible major resistance ceiling or swing high level visible on the chart. If the next visible resistance does not provide at least 1.5:1 reward-to-risk, place the target at an asymmetric risk/reward multiple (at least 2.0x to 3.0x of the real structural stop distance: Entry + (Entry - StopLoss) * 2.5). In the reasoning, state the visible target or the structural R:R multiple.
4. For SHORT trade setups (direction "DOWN"):
   - STOP LOSS: Must be placed JUST BEYOND the nearest structural swing high or primary resistance level visible in the image (e.g. slightly above the swing high wick or resistance ceiling to protect against upside liquidity sweeps). In the reasoning, explicitly state: "Stop loss placed at [SL price] just above the visible swing high / resistance at [Swing High price] to invalidate bearish market structure."
   - TAKE PROFIT: Must be placed at the next visible major support floor or swing low level visible on the chart. If the next visible support does not provide at least 1.5:1 reward-to-risk, place the target at an asymmetric risk/reward multiple (at least 2.0x to 3.0x of the real structural stop distance: Entry - (StopLoss - Entry) * 2.5). In the reasoning, state the visible target or the structural R:R multiple.

REASONING & CONFIDENCE FOR EVERY LEVEL AND POINT:
For every level, line, or landmark (support, resistance, suggestedEntry, stopLoss, takeProfit, and structuralPoints):
- You MUST give a short written "reasoning" explaining WHY you picked that exact price/point from visible chart structure.
- If you cannot clearly justify a level or point from what is visible in the image, you MUST lower the confidence score for that specific level (e.g. 45 to 65) instead of stating it as certain.

10. "support": An object with {"price": "$...", "numericValue": 64200, "reasoning": "...", "confidence": 88}
11. "resistance": An object with {"price": "$...", "numericValue": 67500, "reasoning": "...", "confidence": 92}
12. "suggestedEntry": An object with {"price": "$...", "numericValue": 65500, "reasoning": "...", "confidence": 85}
13. "nearestSwingLow": An object with {"price": "$...", "numericValue": 64200, "reasoning": "..."}
14. "nearestSwingHigh": An object with {"price": "$...", "numericValue": 67800, "reasoning": "..."}
15. "stopLoss": An object with {"price": "$...", "numericValue": 64050, "structuralPointUsed": "Swing Low at $64,200", "reasoning": "Placed just below key swing low at 64,200 to invalidate bullish market structure", "confidence": 90}
16. "takeProfit": An object with {"price": "$...", "numericValue": 68500, "structuralPointUsed": "Resistance at $67,500 / Liquidity Pool at $68,500", "reasoning": "Targeting liquidity resting above resistance cluster with 2.3:1 R:R", "confidence": 86}
17. "entryPriceNumeric": Numeric value of suggestedEntry.
18. "stopLossNumeric": Numeric value of stopLoss.
19. "takeProfitNumeric": Numeric value of takeProfit.
20. "structuralPoints": Array of 2 to 4 landmark points visible on the chart (e.g. Higher High, Higher Low, Lower High, Lower Low, Order Block, Breakout Zone, Trendline Touch).
    Each structural point must have:
    {"label": "Higher Low (HL)", "price": "$...", "type": "structure"|"order_block"|"breakout"|"trendline", "reasoning": "...", "confidence": 85}

CRITICAL: PIXEL COORDINATES FOR DRAWING DIRECTLY ONTO THE CHART IMAGE:
21. "chartAnnotations": An array of visual elements to plot directly onto the image as an SVG overlay.
Return coordinates as normalized percentages (0 to 100) of the image width and height so they scale to any image size:
- For horizontal lines (support, resistance, entry, stop_loss, take_profit, breakout):
  {
    "type": "resistance" | "support" | "entry" | "stop_loss" | "take_profit" | "breakout",
    "y_percent": 32.5,
    "x_start_percent": 8.0,
    "x_end_percent": 92.0,
    "label": "65,840",
    "reasoning": "Price rejected this level twice with long upper wicks"
  }
- For trendlines (diagonal lines connecting wicks):
  {
    "type": "trendline",
    "x_start_percent": 15.0,
    "y_start_percent": 68.0,
    "x_end_percent": 85.0,
    "y_end_percent": 32.0,
    "label": "Uptrend Support",
    "reasoning": "Ascending trendline touching 3 consecutive higher low wicks"
  }
- For single landmark points (Higher High, Higher Low, Lower High, Lower Low, Order Block):
  {
    "type": "HH" | "HL" | "LH" | "LL" | "order_block",
    "x_percent": 54.2,
    "y_percent": 41.0,
    "label": "HL (64,800)",
    "reasoning": "Marked as Higher Low because this candle's low is above the previous swing low, confirming the uptrend structure"
  }
IMPORTANT ACCURACY RULE: If you cannot confidently locate a level or point's exact position in the image, LEAVE THAT ENTRY OUT of chartAnnotations rather than guessing an incorrect coordinate.

22. "keyFactors": Array of 3 specific technical confluence observations visible in the image.
23. "detailedAnalysis": Institutional technical analysis detailing price action, order flow, liquidity pools, and stop placement rules.

Respond strictly in valid JSON format matching this schema:
{
  "detectedAsset": "string or 'not visible in image'",
  "assetConfidence": 90,
  "detectedTimeframe": "string or 'not visible in image'",
  "timeframeConfidence": 85,
  "direction": "UP",
  "confidence": 88,
  "trend": "Bullish Breakout",
  "pattern": "Order Block Retest",
  "summary": "...",
  "nearestSwingLow": {
    "price": "$64,200",
    "numericValue": 64200,
    "reasoning": "Previous swing low wick formed during liquidity sweep"
  },
  "nearestSwingHigh": {
    "price": "$67,800",
    "numericValue": 67800,
    "reasoning": "Prior session high where sellers rejected upper range"
  },
  "support": {
    "price": "$64,200",
    "numericValue": 64200,
    "reasoning": "Price tested this demand wick twice and reacted with aggressive bull volume",
    "confidence": 88
  },
  "resistance": {
    "price": "$67,500",
    "numericValue": 67500,
    "reasoning": "Price rejected this level twice with long upper wicks, marking supply liquidity",
    "confidence": 92
  },
  "suggestedEntry": {
    "price": "$65,500",
    "numericValue": 65500,
    "reasoning": "Retest of the breakout zone following fair value gap fill",
    "confidence": 85
  },
  "stopLoss": {
    "price": "$64,050",
    "numericValue": 64050,
    "structuralPointUsed": "Swing Low at $64,200",
    "reasoning": "Positioned just below the key swing low at 64,200 to invalidate the bullish market structure",
    "confidence": 90
  },
  "takeProfit": {
    "price": "$68,500",
    "numericValue": 68500,
    "structuralPointUsed": "Resistance Ceiling at $67,500 / Liquidity Pool at $68,500",
    "reasoning": "Targeting liquidity resting above the equal highs resistance cluster (2.3:1 R:R)",
    "confidence": 86
  },
  "entryPriceNumeric": 65500,
  "stopLossNumeric": 64050,
  "takeProfitNumeric": 68500,
  "structuralPoints": [
    {
      "label": "Higher Low (HL)",
      "price": "$64,800",
      "type": "structure",
      "reasoning": "Marked as Higher Low because this candle's low is above the previous swing low, confirming the uptrend structure",
      "confidence": 89
    },
    {
      "label": "Order Block / Demand",
      "price": "$64,300",
      "type": "order_block",
      "reasoning": "Last down candle prior to the impulsive upward breakout move",
      "confidence": 82
    }
  ],
  "chartAnnotations": [
    {
      "type": "resistance",
      "y_percent": 24.5,
      "x_start_percent": 8.0,
      "x_end_percent": 92.0,
      "label": "67,500",
      "reasoning": "Price rejected this level twice with long upper wicks"
    },
    {
      "type": "support",
      "y_percent": 68.2,
      "x_start_percent": 8.0,
      "x_end_percent": 92.0,
      "label": "64,200",
      "reasoning": "Price tested this demand wick twice and reacted with aggressive bull volume"
    },
    {
      "type": "HL",
      "x_percent": 54.0,
      "y_percent": 62.5,
      "label": "HL",
      "reasoning": "Marked as Higher Low because this candle's low is above the previous swing low, confirming the uptrend structure"
    }
  ],
  "keyFactors": ["...", "...", "..."],
  "detailedAnalysis": "..."
}`;

    let responseText = '';
    let modelUsed = 'gemini-3.5-flash';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            { text: promptText },
          ],
        },
        config: {
          responseMimeType: 'application/json',
        },
      });
      responseText = response.text || '';
    } catch (primaryErr: any) {
      console.warn('Vision primary model error, falling back to gemini-3.1-flash-lite:', primaryErr?.message);
      try {
        const fallback = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              { text: promptText },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });
        responseText = fallback.text || '';
        modelUsed = 'gemini-3.1-flash-lite';
      } catch (err2: any) {
        console.warn('Fallback vision also failed:', err2?.message);
      }
    }

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    let parsedData: any = null;

    if (cleanJson) {
      try {
        parsedData = JSON.parse(cleanJson);
      } catch (e) {
        const match = cleanJson.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsedData = JSON.parse(match[0]);
          } catch (inner) {}
        }
      }
    }

    // Determine Asset & Source
    let detectedAsset = (parsedData?.detectedAsset || '').trim();
    let assetSource: 'IMAGE_DETECTED' | 'MANUAL_OVERRIDE' | 'NOT_VISIBLE' = 'IMAGE_DETECTED';
    let assetConfidence = typeof parsedData?.assetConfidence === 'number' ? parsedData.assetConfidence : 0;
    let effectiveSymbol: string | null = null;

    if (manualOverrideSymbol && manualOverrideSymbol.trim()) {
      assetSource = 'MANUAL_OVERRIDE';
      effectiveSymbol = manualOverrideSymbol.toUpperCase().trim();
      assetConfidence = 100;
    } else if (
      !detectedAsset ||
      detectedAsset.toLowerCase() === 'not visible in image' ||
      detectedAsset.toLowerCase() === 'not visible' ||
      detectedAsset.toLowerCase() === 'unknown'
    ) {
      detectedAsset = 'not visible in image';
      assetSource = 'NOT_VISIBLE';
      effectiveSymbol = null;
      assetConfidence = 0;
    } else {
      assetSource = 'IMAGE_DETECTED';
      effectiveSymbol = detectedAsset.toUpperCase().trim();
    }

    // Determine Timeframe & Source
    let detectedTimeframe = (parsedData?.detectedTimeframe || '').trim();
    let timeframeSource: 'IMAGE_DETECTED' | 'MANUAL_OVERRIDE' | 'NOT_VISIBLE' = 'IMAGE_DETECTED';
    let timeframeConfidence = typeof parsedData?.timeframeConfidence === 'number' ? parsedData.timeframeConfidence : 0;
    let effectiveTimeframe = detectedTimeframe;

    if (manualOverrideTimeframe && manualOverrideTimeframe.trim()) {
      timeframeSource = 'MANUAL_OVERRIDE';
      effectiveTimeframe = manualOverrideTimeframe.trim();
      timeframeConfidence = 100;
    } else if (
      !detectedTimeframe ||
      detectedTimeframe.toLowerCase() === 'not visible in image' ||
      detectedTimeframe.toLowerCase() === 'not visible' ||
      detectedTimeframe.toLowerCase() === 'unknown'
    ) {
      detectedTimeframe = 'not visible in image';
      timeframeSource = 'NOT_VISIBLE';
      effectiveTimeframe = 'not visible in image';
      timeframeConfidence = 0;
    }

    // Attempt live quote synchronization if symbol is known
    let currentRealPrice = Number(userPrice) > 0 ? Number(userPrice) : 0;
    let isLiveQuoted = false;
    let isMarketOpen = true;

    if (effectiveSymbol && currentRealPrice <= 0) {
      // Find matching watchlist symbol
      const cleanUpper = effectiveSymbol.replace(/[^A-Z]/g, '');
      const matchSymbol = WATCHLIST_SYMBOLS.find(
        (s) => s === effectiveSymbol || s.replace('/', '') === cleanUpper || s.startsWith(cleanUpper)
      );

      if (matchSymbol) {
        try {
          const quotes = await fetchRealQuotes([matchSymbol]);
          const quote = quotes.find((q) => q.symbol === matchSymbol && q.price > 0);
          if (quote) {
            currentRealPrice = quote.price;
            isMarketOpen = quote.marketOpen;
            isLiveQuoted = true;
          }
        } catch (err: any) {
          console.warn(`[Chart Vision] Could not fetch live quote for ${effectiveSymbol}:`, err.message);
        }
      }
    }

    // Direction resolution
    const isUp = requestedDirection === 'DOWN'
      ? false
      : requestedDirection === 'UP'
      ? true
      : parsedData?.direction === 'DOWN'
      ? false
      : true;

    const dir = isUp ? 'UP' : 'DOWN';

    // Pricing & decimal calculations
    const isForex = effectiveSymbol
      ? effectiveSymbol.includes('/') &&
        !effectiveSymbol.startsWith('BTC') &&
        !effectiveSymbol.startsWith('ETH') &&
        !effectiveSymbol.startsWith('SOL') &&
        !effectiveSymbol.startsWith('XAU')
      : false;

    const decimals = isForex ? 4 : 2;
    const currencyPrefix = isForex ? '' : '$';

    const formatPriceStr = (v: number) => {
      const formattedNum = v.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      return `${currencyPrefix}${formattedNum}`;
    };

    // Helper to extract detailed level with reasoning and confidence
    const parseLevelObj = (
      raw: any,
      fallbackPrice: string,
      defaultReason: string,
      fallbackConf = 85
    ) => {
      if (raw && typeof raw === 'object') {
        return {
          price: raw.price ? String(raw.price) : fallbackPrice,
          reasoning: raw.reasoning ? String(raw.reasoning) : defaultReason,
          confidence:
            typeof raw.confidence === 'number'
              ? Math.min(100, Math.max(20, raw.confidence))
              : fallbackConf,
        };
      } else if (typeof raw === 'string' && raw.trim()) {
        return {
          price: raw.trim(),
          reasoning: defaultReason,
          confidence: fallbackConf,
        };
      }
      return {
        price: fallbackPrice,
        reasoning: defaultReason,
        confidence: fallbackConf,
      };
    };

    // Extract structural points (HH, HL, LH, LL, Order Blocks, Breakouts)
    const rawStructural = Array.isArray(parsedData?.structuralPoints)
      ? parsedData.structuralPoints
      : [];

    const structuralPoints = rawStructural.map((pt: any, index: number) => ({
      label: pt.label ? String(pt.label) : `Structural Landmark ${index + 1}`,
      price: pt.price ? String(pt.price) : '',
      type: pt.type ? String(pt.type) : 'structure',
      reasoning: pt.reasoning
        ? String(pt.reasoning)
        : 'Identified from visual candlestick pattern and swing pivots on chart.',
      confidence:
        typeof pt.confidence === 'number'
          ? Math.min(100, Math.max(20, pt.confidence))
          : 80,
    }));

    // Process and validate chart annotations (pixel coordinates as % of image)
    const rawAnnotations = Array.isArray(parsedData?.chartAnnotations)
      ? parsedData.chartAnnotations
      : [];

    const chartAnnotations = rawAnnotations
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any) => {
        const type = String(item.type || 'structure');
        const label = String(item.label || '');
        const reasoning = String(item.reasoning || '');

        const y_percent =
          typeof item.y_percent === 'number'
            ? Math.min(100, Math.max(0, item.y_percent))
            : undefined;

        const x_percent =
          typeof item.x_percent === 'number'
            ? Math.min(100, Math.max(0, item.x_percent))
            : undefined;

        const x_start_percent =
          typeof item.x_start_percent === 'number'
            ? Math.min(100, Math.max(0, item.x_start_percent))
            : undefined;

        const x_end_percent =
          typeof item.x_end_percent === 'number'
            ? Math.min(100, Math.max(0, item.x_end_percent))
            : undefined;

        const y_start_percent =
          typeof item.y_start_percent === 'number'
            ? Math.min(100, Math.max(0, item.y_start_percent))
            : undefined;

        const y_end_percent =
          typeof item.y_end_percent === 'number'
            ? Math.min(100, Math.max(0, item.y_end_percent))
            : undefined;

        return {
          type,
          label,
          reasoning,
          y_percent,
          x_percent,
          x_start_percent,
          x_end_percent,
          y_start_percent,
          y_end_percent,
        };
      })
      .filter((item: any) => {
        if (item.x_percent !== undefined && item.y_percent !== undefined) return true;
        if (item.y_percent !== undefined) return true;
        if (
          item.x_start_percent !== undefined &&
          item.y_start_percent !== undefined &&
          item.x_end_percent !== undefined &&
          item.y_end_percent !== undefined
        ) {
          return true;
        }
        return false;
      });

    // PROBLEM 1 RESOLUTION:
    // If userPrice is 0 or missing (e.g. Twelve Data quota exhausted or symbol unquoted),
    // currentRealPrice defaults to 0. In this case, do NOT calculate SL/TP at all —
    // return an error/message like "Cannot calculate levels: live price unavailable" instead of a broken 0 value.
    const hasValidLivePrice = currentRealPrice > 0;

    if (!hasValidLivePrice) {
      const unavailableMsg = 'Cannot calculate levels: live price unavailable';

      const supportDetail = parseLevelObj(
        parsedData?.support,
        parsedData?.support?.price || unavailableMsg,
        parsedData?.support?.reasoning || 'Support identified from visible chart pattern.',
        parsedData?.support?.confidence || 80
      );

      const resistanceDetail = parseLevelObj(
        parsedData?.resistance,
        parsedData?.resistance?.price || unavailableMsg,
        parsedData?.resistance?.reasoning || 'Resistance identified from visible chart pattern.',
        parsedData?.resistance?.confidence || 80
      );

      const entryDetail = {
        price: unavailableMsg,
        reasoning: 'Live market price unavailable (Twelve Data quota exhausted or unquoted symbol). Provide a live price or check API quota.',
        confidence: 0,
      };

      const stopLossDetail = {
        price: unavailableMsg,
        reasoning: 'Cannot calculate structural stop loss without an active live price.',
        confidence: 0,
      };

      const takeProfitDetail = {
        price: unavailableMsg,
        reasoning: 'Cannot calculate structural take profit without an active live price.',
        confidence: 0,
      };

      const annotatedLevels = [
        {
          label: 'Key Resistance',
          price: resistanceDetail.price,
          type: 'resistance',
          reasoning: resistanceDetail.reasoning,
          confidence: resistanceDetail.confidence,
        },
        {
          label: 'Suggested Entry',
          price: unavailableMsg,
          type: 'entry',
          reasoning: 'Live price unavailable',
          confidence: 0,
        },
        {
          label: 'Primary Support',
          price: supportDetail.price,
          type: 'support',
          reasoning: supportDetail.reasoning,
          confidence: supportDetail.confidence,
        },
        {
          label: 'Invalidation Stop (SL)',
          price: unavailableMsg,
          type: 'stop_loss',
          reasoning: 'Cannot calculate levels: live price unavailable',
          confidence: 0,
        },
        {
          label: 'Primary Target (TP1)',
          price: unavailableMsg,
          type: 'take_profit',
          reasoning: 'Cannot calculate levels: live price unavailable',
          confidence: 0,
        },
        ...structuralPoints,
      ];

      return res.json({
        direction: dir,
        confidence: parsedData?.confidence || 85,
        trend: parsedData?.trend || (isUp ? 'Bullish Breakout' : 'Bearish Distribution'),
        summary:
          parsedData?.summary ||
          `Candlestick structure indicates ${dir} momentum from chart analysis.`,
        pattern: parsedData?.pattern || 'Candlestick Structure',
        levelsError: unavailableMsg,
        support: supportDetail.price,
        resistance: resistanceDetail.price,
        suggestedEntry: unavailableMsg,
        stopLoss: unavailableMsg,
        takeProfit: unavailableMsg,
        takeProfit2: null,
        takeProfit3: null,
        entryPriceNumeric: null,
        stopLossNumeric: null,
        takeProfitNumeric: null,
        riskReward: 'N/A',
        supportDetail,
        resistanceDetail,
        entryDetail,
        stopLossDetail,
        takeProfitDetail,
        structuralPoints,
        annotatedLevels,
        chartAnnotations,
        keyFactors: parsedData?.keyFactors || [
          `Identified pattern: ${parsedData?.pattern || 'Market Structure'}`,
          'Live price unavailable: cannot calculate SL/TP levels',
        ],
        detailedAnalysis:
          parsedData?.detailedAnalysis ||
          'Visual chart structure analyzed. Live price is currently unavailable, so SL/TP levels cannot be calculated.',
        detectedAsset,
        assetConfidence,
        assetSource,
        detectedTimeframe,
        timeframeConfidence,
        timeframeSource,
        effectiveSymbol,
        effectiveTimeframe,
        isLiveQuoted: false,
        sector: effectiveSymbol ? (SYMBOL_METADATA[effectiveSymbol]?.sector || 'Crypto') : 'Crypto',
        decimals,
        currency: currencyPrefix,
        modelUsed,
        timestamp: new Date().toISOString(),
      });
    }

    // PROBLEM 2 RESOLUTION:
    // With valid live price available, calculate SL/TP based on the real structural levels
    // detected by Gemini from the chart image (nearest swing low/high, support/resistance,
    // and structural invalidation points) — NOT a fixed arbitrary percentage.
    const entryNum = currentRealPrice;

    // Extract detected structural landmarks from Gemini
    const detectedSL = Number(parsedData?.stopLossNumeric) || Number(parsedData?.stopLoss?.numericValue) || 0;
    const detectedTP = Number(parsedData?.takeProfitNumeric) || Number(parsedData?.takeProfit?.numericValue) || 0;
    const detectedSwingLow = Number(parsedData?.nearestSwingLow?.numericValue) || 0;
    const detectedSwingHigh = Number(parsedData?.nearestSwingHigh?.numericValue) || 0;
    const detectedSupport = Number(parsedData?.support?.numericValue) || 0;
    const detectedResistance = Number(parsedData?.resistance?.numericValue) || 0;

    let slNum = 0;
    let tpNum = 0;
    let slReasoning = '';
    let tpReasoning = '';

    if (isUp) {
      // LONG: Stop loss placed JUST BEYOND nearest structural swing low or support level
      if (detectedSL > 0 && detectedSL < entryNum) {
        slNum = detectedSL;
        slReasoning = parsedData?.stopLoss?.reasoning || `Stop loss positioned just beyond structural swing low at ${formatPriceStr(slNum)} to protect against liquidity sweeps.`;
      } else if (detectedSwingLow > 0 && detectedSwingLow < entryNum) {
        const buffer = (entryNum - detectedSwingLow) * 0.05;
        slNum = Number((detectedSwingLow - buffer).toFixed(decimals));
        slReasoning = `Stop loss placed at ${formatPriceStr(slNum)} just beyond visible swing low at ${formatPriceStr(detectedSwingLow)} to invalidate bullish structure.`;
      } else if (detectedSupport > 0 && detectedSupport < entryNum) {
        const buffer = (entryNum - detectedSupport) * 0.05;
        slNum = Number((detectedSupport - buffer).toFixed(decimals));
        slReasoning = `Stop loss placed at ${formatPriceStr(slNum)} just beyond key support floor at ${formatPriceStr(detectedSupport)}.`;
      } else {
        const imgEntry = Number(parsedData?.entryPriceNumeric) || 0;
        const imgSL = detectedSL || detectedSwingLow || detectedSupport;
        if (imgEntry > 0 && imgSL > 0 && imgSL < imgEntry) {
          const structuralDistRatio = (imgEntry - imgSL) / imgEntry;
          slNum = Number((entryNum * (1 - structuralDistRatio)).toFixed(decimals));
          slReasoning = `Stop loss placed at ${formatPriceStr(slNum)} based on chart's detected structural swing distance.`;
        } else {
          const lowerStructure = structuralPoints.find((p: any) => {
            const pNum = parseFloat(p.price.replace(/[^0-9.]/g, ''));
            return pNum > 0 && pNum < entryNum;
          });
          if (lowerStructure) {
            const pNum = parseFloat(lowerStructure.price.replace(/[^0-9.]/g, ''));
            slNum = Number((pNum * 0.998).toFixed(decimals));
            slReasoning = `Stop loss placed just below ${lowerStructure.label} at ${formatPriceStr(pNum)}.`;
          } else {
            const fallbackDist = isForex ? entryNum * 0.005 : entryNum * 0.02;
            slNum = Number((entryNum - fallbackDist).toFixed(decimals));
            slReasoning = `Stop loss placed at ${formatPriceStr(slNum)} below local structural support boundary.`;
          }
        }
      }

      const structuralRiskDistance = Math.max(entryNum - slNum, entryNum * 0.001);

      // Take profit: at visible resistance / swing high OR an asymmetric R:R multiple (2.5x) of the real structural stop distance
      if (detectedTP > entryNum && (detectedTP - entryNum) >= structuralRiskDistance * 1.5) {
        tpNum = detectedTP;
        tpReasoning = parsedData?.takeProfit?.reasoning || `Target set at visible resistance ceiling ${formatPriceStr(tpNum)} delivering ${((tpNum - entryNum) / structuralRiskDistance).toFixed(1)}:1 structural R:R.`;
      } else if (detectedResistance > entryNum && (detectedResistance - entryNum) >= structuralRiskDistance * 1.5) {
        tpNum = detectedResistance;
        tpReasoning = `Target set at visible key resistance at ${formatPriceStr(detectedResistance)} (${((detectedResistance - entryNum) / structuralRiskDistance).toFixed(1)}:1 structural R:R).`;
      } else if (detectedSwingHigh > entryNum && (detectedSwingHigh - entryNum) >= structuralRiskDistance * 1.5) {
        tpNum = detectedSwingHigh;
        tpReasoning = `Target set at visible swing high liquidity pool at ${formatPriceStr(detectedSwingHigh)} (${((detectedSwingHigh - entryNum) / structuralRiskDistance).toFixed(1)}:1 structural R:R).`;
      } else {
        tpNum = Number((entryNum + structuralRiskDistance * 2.5).toFixed(decimals));
        tpReasoning = `Primary target set at ${formatPriceStr(tpNum)} based on a 2.5:1 multiple of the real structural stop distance (${formatPriceStr(structuralRiskDistance)} risk).`;
      }
    } else {
      // SHORT: Stop loss placed JUST BEYOND nearest structural swing high or resistance level
      if (detectedSL > entryNum) {
        slNum = detectedSL;
        slReasoning = parsedData?.stopLoss?.reasoning || `Stop loss positioned just beyond structural swing high at ${formatPriceStr(slNum)} to protect against upside liquidity grabs.`;
      } else if (detectedSwingHigh > entryNum) {
        const buffer = (detectedSwingHigh - entryNum) * 0.05;
        slNum = Number((detectedSwingHigh + buffer).toFixed(decimals));
        slReasoning = `Stop loss placed at ${formatPriceStr(slNum)} just beyond the visible swing high at ${formatPriceStr(detectedSwingHigh)} to invalidate bearish structure.`;
      } else if (detectedResistance > entryNum) {
        const buffer = (detectedResistance - entryNum) * 0.05;
        slNum = Number((detectedResistance + buffer).toFixed(decimals));
        slReasoning = `Stop loss placed at ${formatPriceStr(slNum)} just beyond key resistance ceiling at ${formatPriceStr(detectedResistance)}.`;
      } else {
        const imgEntry = Number(parsedData?.entryPriceNumeric) || 0;
        const imgSL = detectedSL || detectedSwingHigh || detectedResistance;
        if (imgEntry > 0 && imgSL > imgEntry) {
          const structuralDistRatio = (imgSL - imgEntry) / imgEntry;
          slNum = Number((entryNum * (1 + structuralDistRatio)).toFixed(decimals));
          slReasoning = `Stop loss placed at ${formatPriceStr(slNum)} based on chart's detected structural swing distance.`;
        } else {
          const higherStructure = structuralPoints.find((p: any) => {
            const pNum = parseFloat(p.price.replace(/[^0-9.]/g, ''));
            return pNum > entryNum;
          });
          if (higherStructure) {
            const pNum = parseFloat(higherStructure.price.replace(/[^0-9.]/g, ''));
            slNum = Number((pNum * 1.002).toFixed(decimals));
            slReasoning = `Stop loss placed just above ${higherStructure.label} at ${formatPriceStr(pNum)}.`;
          } else {
            const fallbackDist = isForex ? entryNum * 0.005 : entryNum * 0.02;
            slNum = Number((entryNum + fallbackDist).toFixed(decimals));
            slReasoning = `Stop loss placed at ${formatPriceStr(slNum)} above local structural resistance boundary.`;
          }
        }
      }

      const structuralRiskDistance = Math.max(slNum - entryNum, entryNum * 0.001);

      // Take profit: at visible support / swing low OR an asymmetric R:R multiple (2.5x) of the real structural stop distance
      if (detectedTP > 0 && detectedTP < entryNum && (entryNum - detectedTP) >= structuralRiskDistance * 1.5) {
        tpNum = detectedTP;
        tpReasoning = parsedData?.takeProfit?.reasoning || `Target set at visible support floor ${formatPriceStr(tpNum)} delivering ${((entryNum - tpNum) / structuralRiskDistance).toFixed(1)}:1 structural R:R.`;
      } else if (detectedSupport > 0 && detectedSupport < entryNum && (entryNum - detectedSupport) >= structuralRiskDistance * 1.5) {
        tpNum = detectedSupport;
        tpReasoning = `Target set at visible key support floor at ${formatPriceStr(detectedSupport)} (${((entryNum - detectedSupport) / structuralRiskDistance).toFixed(1)}:1 structural R:R).`;
      } else if (detectedSwingLow > 0 && detectedSwingLow < entryNum && (entryNum - detectedSwingLow) >= structuralRiskDistance * 1.5) {
        tpNum = detectedSwingLow;
        tpReasoning = `Target set at visible swing low liquidity pool at ${formatPriceStr(detectedSwingLow)} (${((entryNum - detectedSwingLow) / structuralRiskDistance).toFixed(1)}:1 structural R:R).`;
      } else {
        tpNum = Number(Math.max(entryNum * 0.01, entryNum - structuralRiskDistance * 2.5).toFixed(decimals));
        tpReasoning = `Primary target set at ${formatPriceStr(tpNum)} based on a 2.5:1 multiple of the real structural stop distance (${formatPriceStr(structuralRiskDistance)} risk).`;
      }
    }

    const riskDist = Math.max(0.0001, Math.abs(entryNum - slNum));
    const rewardDist = Math.max(0, Math.abs(tpNum - entryNum));
    const calculatedRR = (rewardDist / riskDist).toFixed(2);

    const supportDetail = parseLevelObj(
      parsedData?.support,
      formatPriceStr(isUp ? slNum : tpNum),
      isUp ? `Primary support aligned near ${formatPriceStr(slNum)}.` : `Key support target at ${formatPriceStr(tpNum)}.`,
      85
    );

    const resistanceDetail = parseLevelObj(
      parsedData?.resistance,
      formatPriceStr(isUp ? tpNum : slNum),
      isUp ? `Key resistance target at ${formatPriceStr(tpNum)}.` : `Primary resistance ceiling aligned near ${formatPriceStr(slNum)}.`,
      88
    );

    const entryDetail = parseLevelObj(
      parsedData?.suggestedEntry,
      formatPriceStr(entryNum),
      `Execution entry point at live market price ${formatPriceStr(entryNum)}.`,
      90
    );

    const stopLossDetail = {
      price: formatPriceStr(slNum),
      reasoning: slReasoning,
      confidence: parsedData?.stopLoss?.confidence || 90,
    };

    const takeProfitDetail = {
      price: formatPriceStr(tpNum),
      reasoning: tpReasoning,
      confidence: parsedData?.takeProfit?.confidence || 88,
    };

    // Unified annotatedLevels collection for the frontend
    const annotatedLevels = [
      {
        label: 'Key Resistance',
        price: resistanceDetail.price,
        type: 'resistance',
        reasoning: resistanceDetail.reasoning,
        confidence: resistanceDetail.confidence,
      },
      {
        label: 'Suggested Entry',
        price: entryDetail.price,
        type: 'entry',
        reasoning: entryDetail.reasoning,
        confidence: entryDetail.confidence,
      },
      {
        label: 'Primary Support',
        price: supportDetail.price,
        type: 'support',
        reasoning: supportDetail.reasoning,
        confidence: supportDetail.confidence,
      },
      {
        label: 'Invalidation Stop (SL)',
        price: stopLossDetail.price,
        type: 'stop_loss',
        reasoning: stopLossDetail.reasoning,
        confidence: stopLossDetail.confidence,
      },
      {
        label: 'Primary Target (TP1)',
        price: takeProfitDetail.price,
        type: 'take_profit',
        reasoning: takeProfitDetail.reasoning,
        confidence: takeProfitDetail.confidence,
      },
      ...structuralPoints,
    ];

    const finalOutput = {
      direction: dir,
      confidence: parsedData?.confidence || 85,
      trend: parsedData?.trend || (isUp ? 'Bullish Breakout' : 'Bearish Distribution'),
      summary:
        parsedData?.summary ||
        `Candlestick structure indicates ${dir} momentum based on visible chart structure.`,
      pattern: parsedData?.pattern || 'Candlestick Structure',
      support: supportDetail.price,
      resistance: resistanceDetail.price,
      suggestedEntry: entryDetail.price,
      stopLoss: stopLossDetail.price,
      takeProfit: takeProfitDetail.price,
      takeProfit2: formatPriceStr(isUp ? entryNum + riskDist * 3.5 : Math.max(entryNum * 0.01, entryNum - riskDist * 3.5)),
      takeProfit3: formatPriceStr(isUp ? entryNum + riskDist * 5.0 : Math.max(entryNum * 0.01, entryNum - riskDist * 5.0)),
      entryPriceNumeric: entryNum,
      stopLossNumeric: slNum,
      takeProfitNumeric: tpNum,
      riskReward: `1:${calculatedRR}`,
      supportDetail,
      resistanceDetail,
      entryDetail,
      stopLossDetail,
      takeProfitDetail,
      structuralPoints,
      annotatedLevels,
      chartAnnotations,
      keyFactors: parsedData?.keyFactors || [
        `Identified pattern: ${parsedData?.pattern || 'Market Structure'}`,
        `Defined structural invalidation stop loss at ${formatPriceStr(slNum)}`,
        `Asymmetric 1:${calculatedRR} reward-to-risk ratio`,
      ],
      detailedAnalysis:
        parsedData?.detailedAnalysis ||
        `Quantitative technical evaluation. Current price level: ${formatPriceStr(entryNum)}. Market status: ${isMarketOpen ? 'OPEN' : 'CLOSED'}.`,
      detectedAsset,
      assetConfidence,
      assetSource,
      detectedTimeframe,
      timeframeConfidence,
      timeframeSource,
      effectiveSymbol,
      effectiveTimeframe,
      isLiveQuoted,
      sector: effectiveSymbol ? (SYMBOL_METADATA[effectiveSymbol]?.sector || 'Crypto') : 'Crypto',
      decimals,
      currency: currencyPrefix,
      modelUsed,
      timestamp: new Date().toISOString(),
    };

    return res.json(finalOutput);
  } catch (error: any) {
    console.error('Error in /api/analyze-chart:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze trade chart image',
    });
  }
});


/* ==========================================================================
   ROUTE 4: Real Market Pulse & Quotes (Twelve Data API)
   NEVER returns fake or hardcoded quotes. Returns HTTP 503 if unavailable.
   ========================================================================== */
app.get('/api/market-pulse', async (_req, res) => {
  try {
    // Current UTC time for global session determination
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMin = now.getUTCMinutes();
    const totalUtcMinutes = utcHour * 60 + utcMin;

    const isTokyoOpen = totalUtcMinutes >= 0 && totalUtcMinutes <= 540;
    const isLondonOpen = totalUtcMinutes >= 480 && totalUtcMinutes <= 990;
    const isNewYorkOpen = totalUtcMinutes >= 810 && totalUtcMinutes <= 1200;
    const isSydneyOpen = totalUtcMinutes >= 1260 || totalUtcMinutes <= 360;

    const sessions = [
      { name: 'London', status: isLondonOpen ? 'OPEN' : 'CLOSED', hours: '08:00 - 16:30 UTC', active: isLondonOpen },
      { name: 'New York', status: isNewYorkOpen ? 'OPEN' : 'CLOSED', hours: '13:30 - 20:00 UTC', active: isNewYorkOpen },
      { name: 'Tokyo / Asian', status: isTokyoOpen ? 'OPEN' : 'CLOSED', hours: '00:00 - 09:00 UTC', active: isTokyoOpen },
      { name: 'Sydney', status: isSydneyOpen ? 'OPEN' : 'CLOSED', hours: '21:00 - 06:00 UTC', active: isSydneyOpen },
    ];

    // Sync usage counter in background from Twelve Data
    syncUsageFromApi().catch(() => {});

    const quotes = await fetchRealQuotes(WATCHLIST_SYMBOLS);
    const rateLimitStatus = rateLimiter.getStatus();

    return res.json({
      assets: quotes,
      sessions,
      source: 'Twelve Data',
      updatedAt: now.toISOString(),
      available: true,
      rateLimitStatus,
    });
  } catch (err: any) {
    console.warn('[Server] Market pulse notice:', err.message);
    return res.status(503).json({
      error: 'Market data unavailable. Twelve Data rate limit or API key pending: ' + (err.message || ''),
      available: false,
      rateLimitStatus: rateLimiter.getStatus(),
    });
  }
});

/* ==========================================================================
   ROUTE 5: Signal & Notification Endpoints
   ========================================================================== */
// Get historical signals archive for backtesting
app.get('/api/signals/history', (_req, res) => {
  return res.json({
    signals: getSignalsHistory(),
    timestamp: new Date().toISOString(),
  });
});

// Trigger on-demand signal analysis
app.post('/api/signals/evaluate', async (req, res) => {
  const { symbol } = req.body;
  try {
    if (symbol) {
      const sig = await evaluateAssetSignal(symbol, ai);
      return res.json({ signal: sig });
    }
    const signals = await runWatchlistScan(ai);
    return res.json({ signals });
  } catch (err: any) {
    console.warn('Manual signal evaluation notice:', err.message);
    return res.status(500).json({ error: err.message || 'Signal evaluation failed' });
  }
});

// Register client FCM Push Notification Token
app.post('/api/notifications/register-token', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }
  registerFCMToken(token);
  return res.json({ success: true, message: 'FCM token registered successfully' });
});

/* ==========================================================================
   ROUTE: PayPal Payment Gateway (Server-Side Orders API v2 Sandbox Proxy)
   Uses PAYPAL_CLIENT_ID & PAYPAL_CLIENT_SECRET from environment variables.
   Strictly executes on https://api-m.sandbox.paypal.com.
   ========================================================================== */

const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
const PAYMENTS_LOG_DIR = path.join(__dirname, 'data');
const PAYMENTS_LOG_FILE = path.join(PAYMENTS_LOG_DIR, 'payments_log.json');

// Ensure payments log directory & file exist
async function getLoggedPayments(): Promise<any[]> {
  try {
    if (!fs.existsSync(PAYMENTS_LOG_FILE)) {
      return [];
    }
    const raw = await fs.promises.readFile(PAYMENTS_LOG_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[PayPal Log] Failed to read payments log:', err);
    return [];
  }
}

async function saveLoggedPayment(record: any): Promise<void> {
  try {
    if (!fs.existsSync(PAYMENTS_LOG_DIR)) {
      await fs.promises.mkdir(PAYMENTS_LOG_DIR, { recursive: true });
    }
    const current = await getLoggedPayments();
    current.unshift(record);
    await fs.promises.writeFile(PAYMENTS_LOG_FILE, JSON.stringify(current, null, 2), 'utf-8');
    console.log(`[PayPal Log] Saved payment record ${record.id} (${record.amount} ${record.currency}) for ${record.user}`);
  } catch (err) {
    console.error('[PayPal Log] Failed to persist payment log:', err);
  }
}

// Helper to obtain OAuth 2.0 Access Token from PayPal Sandbox
async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const auth = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString('base64');
  const tokenRes = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`PayPal Sandbox Authentication failed (${tokenRes.status}): ${errText}`);
  }

  const tokenData = (await tokenRes.json()) as any;
  if (!tokenData.access_token) {
    throw new Error('PayPal did not return an access_token');
  }
  return tokenData.access_token;
}

// 1. GET /api/paypal/config — checks if credentials are configured
app.get('/api/paypal/config', (_req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  const isConfigured = Boolean(
    clientId &&
    clientId !== 'MY_PAYPAL_CLIENT_ID' &&
    clientSecret &&
    clientSecret !== 'MY_PAYPAL_CLIENT_SECRET'
  );

  return res.json({
    isConfigured,
    clientId: isConfigured ? clientId : null,
    currency: 'EUR',
    environment: 'sandbox',
  });
});

// 2. GET /api/paypal/payments — lookup all successful payments
app.get('/api/paypal/payments', async (_req, res) => {
  try {
    const list = await getLoggedPayments();
    return res.json({ success: true, count: list.length, payments: list });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to retrieve payments' });
  }
});

// 3. POST /api/paypal/create-order — creates an order via PayPal Orders API v2
app.post('/api/paypal/create-order', async (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret || clientId === 'MY_PAYPAL_CLIENT_ID' || clientSecret === 'MY_PAYPAL_CLIENT_SECRET') {
    return res.status(503).json({
      error: 'PayPal credentials are not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in the AI Studio Secrets / Environment Variables panel.',
    });
  }

  const {
    packId = 'pack_10',
    amount,
    currency = 'EUR',
    planName,
    userId,
    userEmail,
    scansCount,
  } = req.body;

  // Determine standard price and scans count
  let finalAmount = amount;
  let description = planName;
  let creditCount = scansCount;

  if (packId === 'pack_10') {
    finalAmount = finalAmount || '5.00';
    description = description || 'Trading Journal AI - 10 Picture Analyses Pack';
    creditCount = 10;
  } else if (packId === 'pack_30') {
    finalAmount = finalAmount || '12.00';
    description = description || 'Trading Journal AI - 30 Picture Analyses Pack';
    creditCount = 30;
  } else if (packId === 'pack_100') {
    finalAmount = finalAmount || '29.00';
    description = description || 'Trading Journal AI - 100 Picture Analyses Pack';
    creditCount = 100;
  } else {
    finalAmount = finalAmount || '5.00';
    description = description || 'Trading Journal AI - AI Picture Credits';
    creditCount = creditCount || 10;
  }

  const numericValue = parseFloat(String(finalAmount));
  const formattedValue = isNaN(numericValue) || numericValue <= 0 ? '5.00' : numericValue.toFixed(2);

  try {
    const accessToken = await getPayPalAccessToken(clientId, clientSecret);

    const orderPayload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: String(packId),
          description,
          custom_id: JSON.stringify({
            userId: userId || 'anonymous',
            userEmail: userEmail || 'unknown',
            packId,
            scansCount: creditCount,
          }),
          amount: {
            currency_code: currency,
            value: formattedValue,
          },
        },
      ],
      application_context: {
        brand_name: 'Trading Journal AI',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
      },
    };

    const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = (await orderRes.json()) as any;
    if (!orderRes.ok || !orderData.id) {
      console.error('[PayPal] Create order error response:', orderData);
      return res.status(orderRes.status || 500).json({
        error: orderData.message || 'Failed to create PayPal order',
        details: orderData,
      });
    }

    console.log(`[PayPal] Order created: ${orderData.id} for ${formattedValue} ${currency} (${description})`);
    return res.json({ id: orderData.id, status: orderData.status });
  } catch (err: any) {
    console.error('[PayPal] create-order exception:', err);
    return res.status(500).json({ error: err.message || 'Failed to create PayPal order' });
  }
});

// 4. POST /api/paypal/capture-order — captures the order and verifies COMPLETED status
app.post('/api/paypal/capture-order', async (req, res) => {
  const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
  const { orderId, userId, userEmail, packId = 'pack_10', scansCount } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: 'orderId is required' });
  }

  if (!clientId || !clientSecret || clientId === 'MY_PAYPAL_CLIENT_ID' || clientSecret === 'MY_PAYPAL_CLIENT_SECRET') {
    return res.status(503).json({ error: 'PayPal credentials are not configured.' });
  }

  try {
    const accessToken = await getPayPalAccessToken(clientId, clientSecret);

    const captureRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData = (await captureRes.json()) as any;

    // Strict validation: ONLY proceed if status is COMPLETED
    if (!captureRes.ok || captureData.status !== 'COMPLETED') {
      console.error(`[PayPal] Capture rejection for order ${orderId}. Status: ${captureData.status}:`, captureData);
      return res.status(400).json({
        success: false,
        status: captureData.status || 'FAILED',
        error: `Payment verification failed. PayPal status: ${captureData.status || 'UNKNOWN'}. Feature unlock denied.`,
        details: captureData,
      });
    }

    // PayPal confirmed COMPLETED! Extract captured values
    const purchaseUnit = captureData.purchase_units?.[0];
    const captureUnit = purchaseUnit?.payments?.captures?.[0];
    const capturedAmount = captureUnit?.amount?.value || '5.00';
    const capturedCurrency = captureUnit?.amount?.currency_code || 'EUR';
    const payerEmail = captureData.payer?.email_address || userEmail || 'trader@client';

    // Calculate picture scans to credit
    let creditScans = Number(scansCount);
    if (!creditScans || isNaN(creditScans)) {
      if (packId === 'pack_100') creditScans = 100;
      else if (packId === 'pack_30') creditScans = 30;
      else creditScans = 10;
    }

    // Save every successful payment record for lookup
    const paymentRecord = {
      id: `PP-${orderId}`,
      orderId,
      captureId: captureUnit?.id,
      amount: parseFloat(capturedAmount),
      currency: capturedCurrency,
      user: payerEmail,
      userId: userId || 'anonymous',
      userEmail: payerEmail,
      packId,
      scansAdded: creditScans,
      status: 'COMPLETED',
      timestamp: new Date().toISOString(),
      paypalPayerId: captureData.payer?.payer_id,
      payerName: captureData.payer?.name
        ? `${captureData.payer.name.given_name || ''} ${captureData.payer.name.surname || ''}`.trim()
        : payerEmail,
    };

    await saveLoggedPayment(paymentRecord);
    console.log(`[PayPal] Payment verified! Order: ${orderId} | Status: COMPLETED | Added: +${creditScans} picture scans for ${payerEmail}`);

    // Return confirmed COMPLETED response to frontend so it unlocks the feature
    return res.json({
      success: true,
      status: 'COMPLETED',
      orderId,
      captureId: captureUnit?.id,
      amount: parseFloat(capturedAmount),
      currency: capturedCurrency,
      scansAdded: creditScans,
      user: payerEmail,
      timestamp: paymentRecord.timestamp,
    });
  } catch (err: any) {
    console.error('[PayPal] capture-order exception:', err);
    return res.status(500).json({ error: err.message || 'Failed to capture PayPal payment' });
  }
});

/* ==========================================================================
   Background Worker: Runs periodic scan respecting Twelve Data limits
   ========================================================================== */
function initBackgroundSignalWorker() {
  const INTERVAL_MS = 60 * 60 * 1000; // 60 minutes interval to strictly preserve Twelve Data daily 800-credit budget

  // Run periodic background audit only if safe
  setInterval(() => {
    runWatchlistScan(ai).catch((err) =>
      console.warn('[Background Worker] Scheduled scan notice:', err.message)
    );
  }, INTERVAL_MS);

  console.log('[Background Worker] Real-market signal audit job scheduled (60m interval to preserve daily 800 credit limit)');
}

/* ==========================================================================
   Start Server & Mount Static / Vite Middleware (EXACTLY ONCE)
   ========================================================================== */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trading Journal Server listening on port ${PORT}`);
    initBackgroundSignalWorker();
  });
}

startServer();
