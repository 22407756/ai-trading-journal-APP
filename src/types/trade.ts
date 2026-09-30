export type AppCurrency = 'EUR' | 'USD';

export const FREE_CHART_SCANS_LIMIT = 4;
export const OWNER_NAME = 'Sara Oussoussou';
export const OWNER_PAYOUT_EMAIL = 'saraoussoussou2006@gmail.com';
export const OWNER_COUNTRY = 'Morocco';
export const OWNER_DEFAULT_CURRENCY: AppCurrency = 'USD'; // International default

export interface PicturePack {
  id: string;
  name: string;
  scansCount: number;
  priceEUR: number; // in Euros
  priceUSD: number; // in US Dollars
  popular?: boolean;
  badge?: string;
  description: string;
}

export const PICTURE_PACKS: PicturePack[] = [
  {
    id: 'pack_10',
    name: '+10 Picture Analyses',
    scansCount: 10,
    priceEUR: 5,
    priceUSD: 5,
    popular: true,
    badge: 'Popular Choice',
    description: 'Add 10 more chart screenshot analyses to your account (5 € / $5)',
  },
  {
    id: 'pack_25',
    name: '+25 Picture Analyses',
    scansCount: 25,
    priceEUR: 10,
    priceUSD: 10,
    badge: 'Best Value (+5 Free)',
    description: 'Add 25 chart screenshot analyses to your account (10 € / $10)',
  },
  {
    id: 'pack_60',
    name: '+60 Picture Analyses',
    scansCount: 60,
    priceEUR: 20,
    priceUSD: 20,
    badge: 'Pro Volume',
    description: 'Add 60 chart screenshot analyses to your account (20 € / $20)',
  },
];

export interface PaymentRecord {
  id: string;
  userId: string;
  payerEmail: string;
  amount: number;
  currency: string;
  scansAdded?: number;
  packId?: string;
  plan?: SubscriptionTier;
  billingCycle?: BillingCycle;
  recipientEmail: string;
  recipientName: string;
  paymentMethod: 'paypal' | 'card' | 'crypto';
  transactionId: string;
  status: 'completed' | 'pending';
  createdAt: string;
}

export type MarketSector = 'Crypto' | 'Stocks' | 'Forex' | 'Futures';
export type TradeSide = 'LONG' | 'SHORT';
export type TradeStatus = 'Closed' | 'Open';
export type SessionName = 'Asian' | 'London' | 'New York' | 'Overlap';

export interface Trade {
  id: string;
  symbol: string;
  exchange?: string;
  sector: MarketSector;
  side: TradeSide;
  status: TradeStatus;
  entryPrice: number;
  stopLoss: number;
  targetPrice: number;
  exitPrice: number;
  positionSize: string;
  shares?: number;
  leverage: string;
  session: SessionName;
  strategy: string;
  pnl: number;
  pnlPercent: number;
  rMultiple: number;
  riskReward: string;
  riskTaken: number;
  riskPercent: number;
  date: string;
  time: string;
  preEntryBias: string;
  executionDiscipline: string;
  postTradeReview: string;
  tags: string[];
  screenshotUrl?: string;
  detectedConfluence?: string;
  executionQuality: 'Clean Execution' | 'Plan Respected' | 'Re-entry Caution' | 'Broke Rules' | 'Early Exit';
}

export interface CalendarDay {
  dayNumber: string;
  dateStr: string;
  pnl: number;
  pnlFormatted: string;
  tradesCount: number;
  details: string;
  type: 'win' | 'loss' | 'neutral';
  isHighlighted?: boolean;
}

export interface AssetPerformance {
  symbol: string;
  tradesCount: number;
  winRate: number;
  pnl: number;
  label: string;
  statusColor: 'secondary' | 'error' | 'primary';
}

export interface StrategyPerformance {
  name: string;
  pnl: number;
  sampleTrades: number;
  winRate: number;
  avgRR: string;
  warning?: string;
}

export interface SessionPerformance {
  name: SessionName;
  icon: string;
  pnl: number;
  winRate: number;
  color: string;
}

export interface PrecisionMetric {
  id: string;
  label: string;
  value: string;
  sub: string;
  detail: string;
  type: 'win' | 'loss' | 'neutral' | 'ratio';
}

export type SubscriptionTier = 'free' | 'pro' | 'institutional' | 'pack_10' | 'pack_25' | 'pack_60';
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled';
export type BillingCycle = 'monthly' | 'yearly';

export interface UserSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  expiresAt: string;
  planPrice: number;
  planName: string;
}

export interface RateLimitStatus {
  minuteCreditsUsed: number;
  maxPerMinute: number;
  dayCreditsUsed: number;
  maxPerDay: number;
}

export interface RealMarketQuote {
  symbol: string;
  name: string;
  sector: 'Crypto' | 'Forex' | 'Commodities' | 'Stocks';
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  marketOpen: boolean;
  priceTime: string; // ISO UTC
  source: 'Twelve Data';
  available: boolean;
}

export type SignalType = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL' | 'NO_SIGNAL';

export interface MarketSignal {
  id: string;
  asset: string;
  signal: SignalType;
  confidence: number;
  price: number;
  timestamp: string; // ISO UTC
  supporting_facts: string[];
  interpretation: string;
  entry_zone: string;
  stop_loss: string;
  take_profit: string;
  invalidation: string;
  risks: string;
  marketOpen: boolean;
  indicators?: {
    rsi14: number;
    macd: { macd: number; signal: number; histogram: number };
    sma50: number;
    sma200: number;
    volumeVsAvg20: number;
  };
}

