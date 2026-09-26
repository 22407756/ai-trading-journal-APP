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
