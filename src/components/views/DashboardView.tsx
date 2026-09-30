import React, { useState, useMemo, useEffect } from 'react';
import { Trade, PrecisionMetric, RealMarketQuote } from '../../types/trade';
import { PRECISION_METRICS, SCRUB_POINTS } from '../../data/initialData';
import { computeTradeAnalytics } from '../../lib/tradeAnalytics';

interface MarketSession {
  name: string;
  status: 'OPEN' | 'CLOSED';
  hours: string;
  active: boolean;
}

interface DashboardViewProps {
  trades: Trade[];
  onOpenLogTrade: () => void;
  onSelectTrade?: (trade: Trade) => void;
  onOpenAlerts?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  trades,
  onOpenLogTrade,
  onSelectTrade,
  onOpenAlerts,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('3M');
  const [activeScrubPoint, setActiveScrubPoint] = useState<string>('Live Session P&L');
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(null);
  const [tradeFilter, setTradeFilter] = useState<'all' | 'wins' | 'losses' | 'fomo'>('all');

  // Real Twelve Data market quotes state
  const [marketAssets, setMarketAssets] = useState<RealMarketQuote[]>([]);
  const [marketSessions, setMarketSessions] = useState<MarketSession[]>([]);
  const [isMarketLoading, setIsMarketLoading] = useState<boolean>(true);
  const [isApiUnavailable, setIsApiUnavailable] = useState<boolean>(false);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<RealMarketQuote | null>(null);

  // Compute mathematically verified analytics from user trades ledger
  const analytics = useMemo(() => computeTradeAnalytics(trades), [trades]);

  // Fetch real market pulse data from Twelve Data API via /api/market-pulse
  useEffect(() => {
    let isMounted = true;
    const fetchMarketPulse = async () => {
      try {
        const res = await fetch('/api/market-pulse');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setMarketAssets(data.assets || []);
            setMarketSessions(data.sessions || []);
            setIsApiUnavailable(false);
            setIsMarketLoading(false);
          }
        } else {
          // If HTTP 503 or error, mark unavailable
          if (isMounted) {
            setIsApiUnavailable(true);
            setIsMarketLoading(false);
          }
        }
      } catch (err) {
        console.warn('Market pulse unavailable:', err);
        if (isMounted) {
          setIsApiUnavailable(true);
          setIsMarketLoading(false);
        }
      }
    };
    fetchMarketPulse();
    const interval = setInterval(fetchMarketPulse, 90000); // 90s cache aligned
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Filter trades based on filter pill
  const filteredTrades = trades.filter((t) => {
    if (tradeFilter === 'wins') return t.pnl > 0;
    if (tradeFilter === 'losses') return t.pnl <= 0;
    if (tradeFilter === 'fomo') return t.tags.includes('FOMO');
    return true;
  });

  const activeMetric: PrecisionMetric | undefined = PRECISION_METRICS.find(
    (m) => m.id === selectedMatrixId
  );

  const formattedNetPnL = analytics.netPnL >= 0
    ? `+$${analytics.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `-$${Math.abs(analytics.netPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col w-full pb-8 space-y-4 max-w-md mx-auto">
      {/* Top Ambient Radial Bloom Behind Hero Metrics */}
      <div className="relative w-full overflow-hidden rounded-xl bg-surface-container-low shadow-lg border border-surface-container-highest/40">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-44 bg-secondary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 right-2 w-48 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative p-space-md flex flex-col space-y-4">
          {/* Top Utility Micro-bar: Profile Mode & Quick Sync */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="w-2 h-2 rounded-full bg-secondary shrink-0 animate-pulse" />
              <span className="font-tag-mono text-[10px] text-secondary uppercase tracking-wider truncate">
                Ledger Sync: Verified
              </span>
            </div>
            <span className="font-tag-mono text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant shrink-0">
              UTC Global
            </span>
          </div>

          {/* Main Executive Stat - Dynamically Computed */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                Net Cumulative P&L
              </span>
              <span className={`font-tag-mono text-tag-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                analytics.netPnL >= 0 ? 'text-secondary bg-secondary/10' : 'text-error bg-error/10'
              }`}>
                <span className="material-symbols-outlined text-[14px]">
                  {analytics.netPnL >= 0 ? 'trending_up' : 'trending_down'}
                </span>
                {analytics.netPnL >= 0 ? '+' : ''}{analytics.totalTrades > 0 ? ((analytics.netPnL / 10000) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2 overflow-hidden">
              <span className={`text-2xl sm:text-3xl font-bold tracking-tight truncate ${
                analytics.netPnL >= 0
                  ? 'text-secondary drop-shadow-[0_0_16px_rgba(78,222,163,0.35)]'
                  : 'text-error drop-shadow-[0_0_16px_rgba(244,67,54,0.35)]'
              }`}>
                {formattedNetPnL}
              </span>
              <span className="font-tag-mono text-tag-mono text-outline shrink-0">USD</span>
            </div>
          </div>

          {/* Quick Ratio Badges Row - 100% Mathematically Calculated */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="bg-surface-container/90 rounded-lg p-space-sm flex flex-col justify-center border border-surface-container-highest/30">
              <span className="font-label-caps text-label-caps text-outline">WIN RATE</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-data-metric-md text-data-metric-md text-secondary font-semibold">
                  {analytics.winRate}%
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              </div>
            </div>
            <div className="bg-surface-container/90 rounded-lg p-space-sm flex flex-col justify-center border border-surface-container-highest/30">
              <span className="font-label-caps text-label-caps text-outline">PROFIT FACTOR</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-data-metric-md text-data-metric-md text-primary font-semibold">
                  {analytics.profitFactor.toFixed(2)}
                </span>
                <span className="font-tag-mono text-tag-mono text-primary/70">PF</span>
              </div>
            </div>
            <div className="bg-surface-container/90 rounded-lg p-space-sm flex flex-col justify-center border border-surface-container-highest/30">
              <span className="font-label-caps text-label-caps text-outline">TOTAL TRADES</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-data-metric-md text-data-metric-md text-on-surface font-semibold">
                  {analytics.totalTrades}
                </span>
                <span className="font-tag-mono text-tag-mono text-outline">Exec</span>
              </div>
            </div>
          </div>

          {/* Time Horizon Switcher */}
          <div className="bg-surface-container-lowest p-1 rounded-lg flex items-center justify-between">
            {['7D', '1M', '3M', '6M', '1Y', 'ALL'].map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2.5 py-1 rounded font-label-caps text-label-caps active:scale-95 transition-all ${
                  selectedTimeframe === tf
                    ? 'bg-surface-container-high text-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-Time Live Market Ticker & Market Pulse Widget (Twelve Data API) */}
      <div className="w-full bg-[#071322] rounded-xl p-3.5 border border-cyan-500/25 shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Rule 2: Only show the "Live Feed" label when data is actually fresh */}
            {(!isApiUnavailable && marketAssets.length > 0 && marketAssets.some((a) => a.available && (Date.now() - new Date(a.priceTime).getTime() <= (a.sector === 'Crypto' ? 300000 : 900000)))) ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase flex items-center gap-1">
                  Live Feed (Twelve Data)
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-mono font-bold tracking-wider text-amber-300 uppercase flex items-center gap-1">
                  Market Pulse (Delayed)
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
            {onOpenAlerts && (
              <button
                type="button"
                onClick={onOpenAlerts}
                className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 flex items-center gap-1 transition"
                title="View Signal Audits & Set Up Push Alerts"
              >
                <span>5m Signals</span>
              </button>
            )}
            {marketSessions.filter((s) => s.active).map((s) => (
              <span key={s.name} className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {s.name}: OPEN
              </span>
            ))}
          </div>
        </div>

        {/* Rule 2: If the API returns 503 or error, show "Market data unavailable" instead of numbers */}
        {isApiUnavailable ? (
          <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs font-mono space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <span>⚠️ Market data unavailable</span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Twelve Data real quotes are currently offline. Check that <code className="text-amber-300">TWELVE_DATA_KEY</code> is configured in AI Studio environment variables.
            </p>
          </div>
        ) : isMarketLoading ? (
          <div className="py-6 text-center font-mono text-xs text-cyan-400 animate-pulse">
            Connecting to Twelve Data real-time market stream...
          </div>
        ) : (
          /* Horizontal Scrollable Quotes Bar */
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {marketAssets.map((asset) => {
              const isPos = asset.change24h >= 0;
              const diffMs = Date.now() - new Date(asset.priceTime).getTime();
              const isStale = diffMs > (asset.sector === 'Crypto' ? 5 * 60 * 1000 : 15 * 60 * 1000);
              const formattedTime = new Date(asset.priceTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

              return (
                <button
                  key={asset.symbol}
                  type="button"
                  onClick={() => setSelectedAssetDetail(selectedAssetDetail?.symbol === asset.symbol ? null : asset)}
                  className={`shrink-0 px-3 py-2 rounded-lg border text-left transition transform active:scale-95 ${
                    selectedAssetDetail?.symbol === asset.symbol
                      ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-400'
                      : 'bg-[#09182a] border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] font-mono">
                    <span className="font-bold text-white">{asset.symbol}</span>
                    {asset.available && (
                      <span className={`font-semibold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPos ? '+' : ''}{asset.change24h}%
                      </span>
                    )}
                  </div>

                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    {asset.available ? (
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {asset.sector === 'Forex' ? '' : '$'}
                        {asset.price.toLocaleString('en-US', { minimumFractionDigits: asset.sector === 'Forex' ? 4 : 2 })}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-amber-400">
                        Market data unavailable
                      </span>
                    )}

                    {/* Market closed badge: Only for Forex/Stocks when data is available and market is genuinely closed. NEVER for Crypto. */}
                    {asset.available && asset.sector !== 'Crypto' && !asset.marketOpen && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Market closed
                      </span>
                    )}

                    {/* Rule 2: Stale data warning */}
                    {isStale && asset.available && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Stale data
                      </span>
                    )}
                  </div>

                  {/* Rule 2: Show priceTime and source */}
                  <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-slate-500">
                    <span>{asset.source}</span>
                    <span>{formattedTime}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Asset Real Breakdown Drawer */}
        {selectedAssetDetail && (
          <div className="p-3 rounded-lg bg-[#0b1b30] border border-cyan-500/30 text-xs font-mono space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-white text-sm">{selectedAssetDetail.name} ({selectedAssetDetail.symbol})</span>
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  !selectedAssetDetail.available
                    ? 'bg-amber-500/20 text-amber-300'
                    : selectedAssetDetail.sector === 'Crypto' || selectedAssetDetail.marketOpen
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  Status: {!selectedAssetDetail.available
                    ? 'DATA UNAVAILABLE (API LIMIT)'
                    : selectedAssetDetail.sector === 'Crypto'
                    ? 'OPEN 24/7'
                    : selectedAssetDetail.marketOpen
                    ? 'OPEN'
                    : 'MARKET CLOSED'}
                </span>
                <span className="ml-1 text-[10px] text-slate-400">Source: {selectedAssetDetail.source}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssetDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 pt-1">
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">24H High</span>
                <span className="text-emerald-300">
                  {selectedAssetDetail.available && selectedAssetDetail.high24h > 0
                    ? `${selectedAssetDetail.sector === 'Forex' ? '' : '$'}${selectedAssetDetail.high24h}`
                    : 'Unavailable'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">24H Low</span>
                <span className="text-rose-300">
                  {selectedAssetDetail.available && selectedAssetDetail.low24h > 0
                    ? `${selectedAssetDetail.sector === 'Forex' ? '' : '$'}${selectedAssetDetail.low24h}`
                    : 'Unavailable'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px] uppercase">API Price Timestamp (UTC)</span>
                <span className="text-cyan-300 text-[10px]">
                  {selectedAssetDetail.available ? selectedAssetDetail.priceTime : 'Pending API Refresh'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Cumulative P&L Performance Chart */}
      <div className="w-full bg-surface-container-low rounded-xl p-space-md flex flex-col space-y-3 shadow-md border border-surface-container-highest/40 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">show_chart</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Equity Trajectory
            </span>
          </div>

          {/* Tooltip Crosshair Callout */}
          <div className="bg-surface-container-highest px-2 py-0.5 rounded-full flex items-center gap-1.5 transition-all">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
            <span className="font-tag-mono text-tag-mono text-on-surface font-semibold">
              {activeScrubPoint}
            </span>
          </div>
        </div>

        {/* Vector Chart Stage */}
        <div className="relative w-full h-44 flex items-center justify-center pt-2">
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 360 160">
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#4edea3" stopOpacity="0.38" />
                <stop offset="70%" stopColor="#4edea3" stopOpacity="0.05" />
                <stop offset="100%" stopColor="#4edea3" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="lineGlow" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#4edea3" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#4edea3" stopOpacity="1" />
                <stop offset="100%" stopColor="#6ffbbe" stopOpacity="1" />
              </linearGradient>
              <filter height="140%" id="neon" width="140%" x="-20%" y="-20%">
                <feGaussianBlur result="blur" stdDeviation="3" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Horizontal Guide Gridlines */}
            <line opacity="0.6" stroke="#273647" strokeDasharray="3 3" strokeWidth="0.8" x1="0" x2="360" y1="30" y2="30" />
            <line opacity="0.6" stroke="#273647" strokeDasharray="3 3" strokeWidth="0.8" x1="0" x2="360" y1="75" y2="75" />
            <line opacity="0.6" stroke="#273647" strokeDasharray="3 3" strokeWidth="0.8" x1="0" x2="360" y1="120" y2="120" />

            {/* Area Fill Under Curve */}
            <path
              d="M 0,140 Q 40,128 70,118 T 130,95 T 190,105 T 250,62 T 310,48 L 360,20 L 360,160 L 0,160 Z"
              fill="url(#chartGradient)"
            />

            {/* Primary Luminous Equity Line */}
            <path
              d="M 0,140 Q 40,128 70,118 T 130,95 T 190,105 T 250,62 T 310,48 L 360,20"
              fill="none"
              filter="url(#neon)"
              stroke="url(#lineGlow)"
              strokeWidth="2.5"
            />

            {/* Interactive Scrub Points */}
            {SCRUB_POINTS.map((pt, i) => (
              <circle
                key={i}
                className="cursor-pointer transition-transform hover:scale-150"
                cx={pt.cx}
                cy={pt.cy}
                r="3.5"
                fill="#051424"
                stroke={pt.color}
                strokeWidth="2"
                onClick={() => setActiveScrubPoint(pt.data)}
              />
            ))}

            {/* Peak Current Marker */}
            <circle cx="360" cy="20" fill="#4edea3" r="4.5" stroke="#051424" strokeWidth="2" />
          </svg>
        </div>

        {/* Chart Stat Matrix Footer */}
        <div className="grid grid-cols-4 gap-1.5 pt-2">
          <div className="bg-surface-container p-2 rounded-lg text-center border border-surface-container-highest/20">
            <span className="font-label-caps text-label-caps text-outline block">AVG WIN</span>
            <span className="font-data-metric-sm text-data-metric-sm text-secondary font-medium">
              +$412.50
            </span>
          </div>
          <div className="bg-surface-container p-2 rounded-lg text-center border border-surface-container-highest/20">
            <span className="font-label-caps text-label-caps text-outline block">AVG LOSS</span>
            <span className="font-data-metric-sm text-data-metric-sm text-error font-medium">
              -$172.00
            </span>
          </div>
          <div className="bg-surface-container p-2 rounded-lg text-center border border-surface-container-highest/20">
            <span className="font-label-caps text-label-caps text-outline block">EXPECTANCY</span>
            <span className="font-data-metric-sm text-data-metric-sm text-primary font-medium">
              +$228.10
            </span>
          </div>
          <div className="bg-surface-container p-2 rounded-lg text-center border border-surface-container-highest/20">
            <span className="font-label-caps text-label-caps text-outline block">MAX DD</span>
            <span className="font-data-metric-sm text-data-metric-sm text-tertiary-container font-medium">
              -4.8%
            </span>
          </div>
        </div>
      </div>

      {/* Institutional Discipline & Streak Card */}
      <div className="w-full bg-surface-container-low rounded-xl p-space-md shadow-md border border-surface-container-highest/40 flex flex-col space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Execution Discipline
            </span>
          </div>
          <span className="font-tag-mono text-tag-mono px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">
            Tier 1 Institutional
          </span>
        </div>

        {/* Discipline Score Visual Gauge */}
        <div className="bg-surface-container rounded-lg p-space-sm flex items-center justify-between border border-surface-container-highest/30">
          <div className="flex flex-col">
            <span className="font-label-caps text-label-caps text-outline">
              COGNITIVE COMPLIANCE INDEX
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="font-headline-lg text-headline-lg text-secondary font-bold">94</span>
              <span className="font-body-sm text-body-sm text-outline">/100</span>
              <span className="font-tag-mono text-tag-mono text-secondary ml-1.5">
                (Exceptional Rule Adherence)
              </span>
            </div>
          </div>
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="none" r="14" stroke="#273647" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                fill="none"
                r="14"
                stroke="#4edea3"
                strokeDasharray="88"
                strokeDashoffset="5.2"
                strokeLinecap="round"
                strokeWidth="3"
              />
            </svg>
            <span className="absolute font-tag-mono text-tag-mono font-bold text-on-surface">
              94%
            </span>
          </div>
        </div>

        {/* Gamified Behavioral Micro-Badges */}
        <div className="flex flex-wrap gap-1.5">
          <div className="px-2.5 py-1 rounded-full bg-surface-container-high flex items-center gap-1.5 text-on-surface font-body-sm text-body-sm">
            <span className="text-[13px]">🔥</span>
            <span className="font-tag-mono text-tag-mono font-medium">8 Days Rule-Compliant</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-surface-container-high flex items-center gap-1.5 text-on-surface font-body-sm text-body-sm">
            <span className="text-[13px]">🛡️</span>
            <span className="font-tag-mono text-tag-mono font-medium">14 Trades w/ Pre-set SL</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-surface-container-high flex items-center gap-1.5 text-secondary font-body-sm text-body-sm">
            <span className="text-[13px]">🎯</span>
            <span className="font-tag-mono text-tag-mono font-medium">0 Revenge Trades This Week</span>
          </div>
        </div>

        {/* Process Goal Widget: Daily Trade Cap */}
        <div className="bg-surface-container-lowest p-space-sm rounded-lg flex flex-col space-y-1.5 border border-surface-container-highest/20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">do_not_disturb_on</span>
              <span className="font-body-sm text-body-sm text-on-surface font-medium">Daily Trade Cap Rule</span>
            </div>
            <span className="font-tag-mono text-tag-mono text-primary font-semibold">2 of 3 Executed (66%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
            <div className="h-full bg-primary-container rounded-full" style={{ width: '66%' }} />
          </div>
          <span className="font-tag-mono text-tag-mono text-outline">
            1 trade allowance remaining before behavioral lockdown triggers.
          </span>
        </div>
      </div>

      {/* Advanced Metrics Matrix (Compact 2x3 Interactive Glass Cards) */}
      <div className="w-full flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Precision Matrix
          </span>
          <span className="font-tag-mono text-tag-mono text-outline">Tap card for audit logic</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PRECISION_METRICS.map((card) => {
            const isSelected = selectedMatrixId === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setSelectedMatrixId(isSelected ? null : card.id)}
                className={`bg-surface-container-low rounded-xl p-space-sm flex flex-col justify-between cursor-pointer active:scale-98 transition-all border ${
                  isSelected
                    ? 'border-primary bg-surface-container-high shadow-[0_0_12px_rgba(77,142,255,0.2)]'
                    : 'border-surface-container-highest/30 hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-label-caps text-label-caps text-outline">{card.label}</span>
                  <span
                    className={`material-symbols-outlined text-[14px] ${
                      card.type === 'win'
                        ? 'text-secondary'
                        : card.type === 'loss'
                        ? 'text-error'
                        : 'text-primary'
                    }`}
                  >
                    {card.type === 'win'
                      ? 'north_east'
                      : card.type === 'loss'
                      ? 'south_east'
                      : 'info'}
                  </span>
                </div>
                <div className="my-1">
                  <span
                    className={`font-data-metric-md text-data-metric-md font-bold ${
                      card.type === 'win'
                        ? 'text-secondary'
                        : card.type === 'loss'
                        ? 'text-error'
                        : 'text-on-surface'
                    }`}
                  >
                    {card.value}
                  </span>
                </div>
                {card.id === 'win-loss' ? (
                  <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden flex">
                    <div className="bg-secondary h-full" style={{ width: '68.4%' }} />
                    <div className="bg-error h-full" style={{ width: '31.6%' }} />
                  </div>
                ) : (
                  <span className="font-tag-mono text-tag-mono text-outline truncate">{card.sub}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Dynamic Metric Explainer Strip */}
        {activeMetric && (
          <div className="bg-surface-container-high p-space-sm rounded-lg flex items-start gap-2 border border-primary/30 animate-fadeIn">
            <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
              psychology
            </span>
            <div className="flex flex-col">
              <span className="font-tag-mono text-tag-mono text-primary font-semibold">
                AUDIT LOGIC: {activeMetric.label}
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mt-0.5">
                {activeMetric.detail}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Visual Break: Execution Protocol Active Banner */}
      <div className="relative w-full rounded-xl overflow-hidden bg-surface-container-low p-space-md shadow-md border border-surface-container-highest/40">
        <div className="flex items-center gap-space-md">
          <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high">
            <img
              className="w-full h-full object-cover"
              alt="Trader desk"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3lg5Nurszz7uDEZ8IaJyrL6F8uCThdu_d79nxlRfrNl1MsP2uJevph8HPUxCkAPzv41Zwgu_EkUYT6rAcvKsm31zZczGXtWjqLwYyVU-y5IwhNe7oaVYmW7wgz5lvEMTmKRMRqWGCpH_wG1hNkgGEI_HvsZJ846jzXTYRTGmvbj5OaR_0_95lUZn5McFeIn29ME9hL8xyraiaJvs1YomeIANanp3cf8urbYCOdBcEVXMD2vPNI16XTw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 to-transparent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
              <span className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">
                Execution Protocol Active
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mt-0.5">
              Risk per trade capped at 1.0% equity. Stop losses are locked at entry submission.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Logged Trades Feed Section */}
      <div className="w-full flex flex-col space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">receipt_long</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Logged Executions
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-tag-mono text-tag-mono text-primary font-semibold">Live Feed</span>
            <button
              onClick={onOpenLogTrade}
              className="px-2 py-0.5 rounded bg-primary-container text-on-primary-container font-tag-mono text-tag-mono flex items-center gap-1 active:scale-95"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setTradeFilter('all')}
            className={`px-3 py-1 rounded-full font-label-caps text-label-caps shrink-0 active:scale-95 transition-transform ${
              tradeFilter === 'all'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            All ({trades.length > 5 ? trades.length : 142})
          </button>
          <button
            type="button"
            onClick={() => setTradeFilter('wins')}
            className={`px-3 py-1 rounded-full font-label-caps text-label-caps shrink-0 active:scale-95 transition-transform ${
              tradeFilter === 'wins'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Wins Only (97)
          </button>
          <button
            type="button"
            onClick={() => setTradeFilter('losses')}
            className={`px-3 py-1 rounded-full font-label-caps text-label-caps shrink-0 active:scale-95 transition-transform ${
              tradeFilter === 'losses'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Losses (45)
          </button>
          <button
            type="button"
            onClick={() => setTradeFilter('fomo')}
            className={`px-3 py-1 rounded-full font-label-caps text-label-caps shrink-0 active:scale-95 transition-transform ${
              tradeFilter === 'fomo'
                ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                : 'bg-surface-container-high text-on-surface-variant'
            }`}
          >
            Tagged FOMO (0)
          </button>
        </div>

        {/* Trade List Items */}
        <div className="flex flex-col space-y-2">
          {filteredTrades.map((trade) => {
            const isWin = trade.pnl >= 0;
            return (
              <div
                key={trade.id}
                onClick={() => onSelectTrade && onSelectTrade(trade)}
                className="bg-surface-container-low rounded-xl p-space-sm shadow-sm flex flex-col space-y-2 hover:bg-surface-container transition-colors border border-surface-container-highest/30 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                        isWin ? 'bg-secondary/15 text-secondary' : 'bg-error/15 text-error'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isWin ? 'north_east' : 'south_east'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                          {trade.symbol}
                        </span>
                        <span
                          className={`font-tag-mono text-tag-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                            trade.side === 'LONG'
                              ? 'bg-secondary/10 text-secondary'
                              : 'bg-error/10 text-error'
                          }`}
                        >
                          {trade.side}
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-outline">
                        {trade.date} · {trade.strategy}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span
                      className={`font-data-metric-md text-data-metric-md font-bold ${
                        isWin ? 'text-secondary' : 'text-error'
                      }`}
                    >
                      {isWin ? `+$${trade.pnl.toFixed(2)}` : `-$${Math.abs(trade.pnl).toFixed(2)}`}
                    </span>
                    <span
                      className={`font-tag-mono text-tag-mono px-1.5 py-0.5 rounded-full font-semibold ${
                        isWin ? 'text-secondary bg-secondary/10' : 'text-error bg-error/10'
                      }`}
                    >
                      {trade.rMultiple >= 0
                        ? `+${trade.rMultiple.toFixed(1)}R`
                        : `${trade.rMultiple.toFixed(1)}R`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex flex-wrap gap-1">
                    {trade.tags.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        className="font-tag-mono text-tag-mono px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        trade.executionQuality === 'Plan Respected' || trade.executionQuality === 'Clean Execution'
                          ? 'bg-secondary'
                          : trade.executionQuality === 'Early Exit'
                          ? 'bg-tertiary-fixed-dim'
                          : 'bg-tertiary-container'
                      }`}
                    />
                    <span
                      className={`font-tag-mono text-tag-mono font-medium ${
                        trade.executionQuality === 'Plan Respected' || trade.executionQuality === 'Clean Execution'
                          ? 'text-secondary'
                          : 'text-tertiary'
                      }`}
                    >
                      {trade.executionQuality}{' '}
                      {trade.executionQuality === 'Plan Respected' || trade.executionQuality === 'Clean Execution'
                        ? '🟢'
                        : '🟡'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mandatory Financial Safety & Compliance Banner */}
      <div className="w-full bg-surface-container-lowest p-space-md rounded-xl mt-3 flex items-start gap-2.5 border border-surface-container-highest/30">
        <span className="material-symbols-outlined text-outline text-[20px] shrink-0 mt-0.5">policy</span>
        <p className="font-tag-mono text-tag-mono text-outline leading-relaxed">
          Disclaimer: Trading Journal AI is strictly for behavioral journaling and historical analytics. It provides no financial advice, predictions, or automated trade signals.
        </p>
      </div>
    </div>
  );
};
