/**
 * Technical Indicator Calculation Engine (Code-Executed Math)
 * Computes RSI(14), MACD(12,26,9), SMA50, SMA200, and Volume vs 20-period SMA
 * Strictly in mathematical code without external estimation.
 */

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

export interface ComputedTechnicalIndicators {
  rsi14: number | null;
  macd: MACDResult | null;
  sma50: number | null;
  sma200: number | null;
  volumeVsAvg20: number | null;
  latestPrice: number;
  priceTime: string;
}

export interface Candle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(values: number[], period: number): number | null {
  if (!values || values.length < period || period <= 0) return null;
  const slice = values.slice(-period);
  const sum = slice.reduce((acc, v) => acc + v, 0);
  return Number((sum / period).toFixed(4));
}

/**
 * Exponential Moving Average (EMA) Series
 */
export function calculateEMASeries(values: number[], period: number): number[] {
  if (!values || values.length === 0 || period <= 0) return [];
  if (values.length < period) return [];

  const k = 2 / (period + 1);
  const emaArray: number[] = [];

  // Initialize first EMA with SMA of first `period` elements
  const initialSMA = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  emaArray.push(initialSMA);

  for (let i = period; i < values.length; i++) {
    const currentPrice = values[i];
    const prevEMA = emaArray[emaArray.length - 1];
    const currentEMA = currentPrice * k + prevEMA * (1 - k);
    emaArray.push(currentEMA);
  }

  return emaArray;
}

/**
 * Relative Strength Index (RSI - 14 period Wilder standard)
 */
export function calculateRSI(closes: number[], period: number = 14): number | null {
  if (!closes || closes.length < period + 1) return null;

  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  let gains = 0;
  let losses = 0;

  // First period average
  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) {
      gains += changes[i];
    } else {
      losses += Math.abs(changes[i]);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smoothed averages (Wilder's Smoothing)
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change >= 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);
  return Number(rsi.toFixed(2));
}

/**
 * Moving Average Convergence Divergence (MACD 12, 26, 9)
 */
export function calculateMACD(
  closes: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDResult | null {
  if (!closes || closes.length < slowPeriod + signalPeriod) return null;

  const fastEMA = calculateEMASeries(closes, fastPeriod);
  const slowEMA = calculateEMASeries(closes, slowPeriod);

  // Align slow and fast EMA series
  // slowEMA has (closes.length - slowPeriod + 1) elements
  // fastEMA has (closes.length - fastPeriod + 1) elements
  const offset = slowPeriod - fastPeriod;
  const macdLine: number[] = [];

  for (let i = 0; i < slowEMA.length; i++) {
    macdLine.push(fastEMA[i + offset] - slowEMA[i]);
  }

  if (macdLine.length < signalPeriod) return null;

  const signalLine = calculateEMASeries(macdLine, signalPeriod);
  if (signalLine.length === 0) return null;

  const latestMACD = macdLine[macdLine.length - 1];
  const latestSignal = signalLine[signalLine.length - 1];
  const histogram = latestMACD - latestSignal;

  return {
    macd: Number(latestMACD.toFixed(4)),
    signal: Number(latestSignal.toFixed(4)),
    histogram: Number(histogram.toFixed(4)),
  };
}

/**
 * Volume vs 20-period SMA Ratio
 */
export function calculateVolumeRatio(volumes: number[], period: number = 20): number | null {
  if (!volumes || volumes.length < 2) return null;
  const currentVol = volumes[volumes.length - 1];
  const samplePeriod = Math.min(volumes.length - 1, period);
  if (samplePeriod <= 0) return null;

  const pastSlice = volumes.slice(-(samplePeriod + 1), -1);
  const avg = pastSlice.reduce((a, b) => a + b, 0) / samplePeriod;
  if (avg === 0) return 1;

  return Number((currentVol / avg).toFixed(2));
}

/**
 * Aggregate all indicators from chronological candle records (oldest -> newest)
 */
export function computeIndicatorsFromCandles(candles: Candle[]): ComputedTechnicalIndicators {
  if (!candles || candles.length === 0) {
    return {
      rsi14: null,
      macd: null,
      sma50: null,
      sma200: null,
      volumeVsAvg20: null,
      latestPrice: 0,
      priceTime: new Date().toISOString(),
    };
  }

  // Ensure chronological order
  const sorted = [...candles].sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );

  const closes = sorted.map((c) => c.close);
  const volumes = sorted.map((c) => c.volume);
  const latest = sorted[sorted.length - 1];

  return {
    rsi14: calculateRSI(closes, 14),
    macd: calculateMACD(closes, 12, 26, 9),
    sma50: calculateSMA(closes, 50),
    sma200: calculateSMA(closes, 200),
    volumeVsAvg20: calculateVolumeRatio(volumes, 20),
    latestPrice: latest.close,
    priceTime: latest.datetime,
  };
}
