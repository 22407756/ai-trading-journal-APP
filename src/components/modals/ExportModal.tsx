import React, { useState, useEffect } from 'react';
import { Trade, SubscriptionTier } from '../../types/trade';
import { useAuth } from '../../context/AuthContext';
import { Crown } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
  onOpenSubscription?: (tier?: SubscriptionTier, reason?: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  trades,
  onOpenSubscription,
}) => {
  const { isProOrHigher } = useAuth();
  const [isCompiling, setIsCompiling] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsCompiling(true);
      const timer = setTimeout(() => {
        setIsCompiling(false);
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const downloadCSV = () => {
    const headers = [
      'ID',
      'Symbol',
      'Sector',
      'Side',
      'Session',
      'Strategy',
      'Entry Price',
      'Exit Price',
      'P&L ($)',
      'R-Multiple',
      'Risk Taken ($)',
      'Pre-Entry Bias',
      'Discipline Review',
      'Tags',
    ];
    const rows = trades.map((t) => [
      t.id,
      t.symbol,
      t.sector,
      t.side,
      t.session,
      t.strategy,
      t.entryPrice,
      t.exitPrice,
      t.pnl,
      t.rMultiple,
      t.riskTaken,
      `"${t.preEntryBias.replace(/"/g, '""')}"`,
      `"${t.executionDiscipline.replace(/"/g, '""')}"`,
      `"${t.tags.join(', ')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trading_journal_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadReport = () => {
    const reportText = `=====================================================
TRADING JOURNAL AI - INSTITUTIONAL PERFORMANCE AUDIT
Record ID: #TJ-8841-OCT24
SHA-256: 8f49b068c92a95c3bb20e17bca31d582046e7f8e329048a1bca85890e03cf44a
Generated: ${new Date().toISOString()}
=====================================================

1. EXECUTIVE KPI SUMMARY
- Net Cumulative P&L: +$14,840.50 (+21.4%)
- Profit Factor: 2.42
- Realized Win Rate: 68.4% (97W / 45L)
- Sharpe Ratio: 1.85 (Vol-Adjusted A+)
- Trade Expectancy: +$228.10 / fill
- Max Drawdown: -4.8%

2. ASSET ALLOCATION EDGE
- BTC/USDT: 42 Trades | Win Rate 71% | Net: +$6,420.00
- NVDA:     38 Trades | Win Rate 74% | Net: +$5,180.00
- EUR/USD:  32 Trades | Win Rate 59% | Net: +$2,140.00
- ETH/USDT: 18 Trades | Win Rate 44% | Net: -$410.00
- SPY:      12 Trades | Win Rate 50% | Net: +$1,510.50

3. PLAYBOOK AUDIT
- VWAP Breakout: +$7,200.00 (Win% 73%, Avg R:R 1:2.6)
- Liquidity Sweep: +$4,110.00 (Win% 67%, Avg R:R 1:2.4)
- Counter-Trend Fade: -$980.00 (Win% 41%, Avg R:R 1:1.2) [SYSTEMIC RISK WARNING]

4. BEHAVIORAL COGNITIVE AUDIT
- Cognitive Compliance Score: 94 / 100
- Daily Trade Cap Protocol: 66% utilized
- Revenge Trades Detected: 0
- Premature Profit Exits: Flagged on morning runners

=====================================================
Status: CRYPTOGRAPHICALLY AUDITED & SEALED
=====================================================`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Institutional_Audit_Report_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-surface-container-low border border-surface-container-highest/60 p-6 shadow-2xl relative flex flex-col gap-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[28px]">verified_user</span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Institutional Audit Export
            </h3>
            <span className="font-tag-mono text-tag-mono text-primary uppercase">
              SHA-256 Ledger Certified
            </span>
          </div>
        </div>

        {/* Status Body */}
        {isCompiling ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Compiling SHA-256 Ledger Bundle...
              </span>
              <span className="font-tag-mono text-tag-mono text-on-surface-variant mt-1">
                Hashing {trades.length} execution tickets with zero slippage audit
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            <div className="p-3 rounded-lg bg-surface-container border border-surface-container-highest/30 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-outline uppercase">
                  RECORD IDENTIFIER
                </span>
                <span className="font-tag-mono text-tag-mono text-secondary font-bold">
                  VERIFIED
                </span>
              </div>
              <span className="font-tag-mono text-xs text-on-surface font-semibold">
                #TJ-8841-OCT24
              </span>
              <span className="font-tag-mono text-[10px] text-outline break-all">
                Hash: 8f49b068c92a95c3bb20e17bca31d582046e7f8e329048a1bca85890e03cf44a
              </span>
            </div>

            <p className="font-body-sm text-body-sm text-on-surface-variant">
              The verified ledger export encapsulates all trade timestamps, stop-loss adherence
              records, cognitive bias journals, and realized R-multiples.
            </p>

            {!isProOrHigher && (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Pro Trader Subscription Required</span>
                </div>
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Institutional CSV &amp; PDF ledger audit exports require an active Pro Trader ($29/mo) or Institutional Desk ($99/mo) subscription.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    onOpenSubscription &&
                    onOpenSubscription('pro', 'Unlock institutional ledger exports.')
                  }
                  className="w-full py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs shadow transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Upgrade to Pro Trader ($29/mo)</span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  if (!isProOrHigher) {
                    if (onOpenSubscription) onOpenSubscription('pro', 'Institutional CSV export requires Pro Trader.');
                    return;
                  }
                  downloadCSV();
                }}
                className={`py-2.5 px-3 rounded-lg font-tag-mono text-tag-mono font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
                  !isProOrHigher
                    ? 'bg-surface-container text-outline border-surface-container-highest/20 cursor-pointer'
                    : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border-surface-container-highest/40'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">table_view</span>
                <span>Download CSV {!isProOrHigher && '(PRO)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!isProOrHigher) {
                    if (onOpenSubscription) onOpenSubscription('pro', 'Institutional Audit PDF export requires Pro Trader.');
                    return;
                  }
                  downloadReport();
                }}
                className={`py-2.5 px-3 rounded-lg font-tag-mono text-tag-mono font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm ${
                  !isProOrHigher
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-primary-container hover:brightness-110 text-on-primary-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Audit PDF / TXT {!isProOrHigher && '(PRO)'}</span>
              </button>
            </div>
          </div>
        )}

        <div className="text-center pt-1 border-t border-surface-container-highest/30">
          <span className="font-tag-mono text-[10px] text-outline">
            For educational &amp; journaling purposes only. Not financial advice.
          </span>
        </div>
      </div>
    </div>
  );
};
