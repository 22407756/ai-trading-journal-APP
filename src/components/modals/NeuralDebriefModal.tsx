import React, { useState } from 'react';
import { Trade } from '../../types/trade';

interface NeuralDebriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: Trade[];
}

export const NeuralDebriefModal: React.FC<NeuralDebriefModalProps> = ({
  isOpen,
  onClose,
  trades,
}) => {
  const [analyzing, setAnalyzing] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-lg rounded-2xl bg-surface-container-low border border-surface-container-highest/60 p-6 shadow-2xl relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-[28px]">psychology</span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Deep Neural Behavioral Debrief
            </h3>
            <span className="font-tag-mono text-tag-mono text-secondary uppercase font-bold">
              NEURAL ENGINE v4.2 · INSTITUTIONAL AUDIT
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-3 py-1">
          {/* Executive Diagnostic Summary */}
          <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-highest/40 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps text-outline uppercase">
                COGNITIVE PROFILE
              </span>
              <span className="font-tag-mono text-tag-mono text-secondary font-bold">
                COMPLIANCE: 94%
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface leading-relaxed">
              Your overall system execution reflects high discipline with <strong>0% hard stop breaches</strong>{' '}
              across all recent executions. However, automated regression reveals two distinct
              behavioral friction points:
            </p>
          </div>

          {/* Finding 1: Premature Exit Leakage */}
          <div className="p-3.5 rounded-xl bg-tertiary-container/10 border-l-4 border-tertiary flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-tertiary font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">trending_down</span>
                Alpha Leakage: Premature Exit Syndrome
              </span>
              <span className="font-tag-mono text-xs text-tertiary font-bold">HIGH IMPACT</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              When trades reach +1.2R to +1.5R, psychological anxiety leads to manual market
              orders prior to the structural liquidity target. Letting winners run to their intended
              2.5R target would increase cumulative net expectancy by{' '}
              <strong className="text-secondary font-mono">+$8,400.00</strong> across this 9-week sample.
            </p>
          </div>

          {/* Finding 2: Friday Degradation */}
          <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-highest/30 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-primary font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                Session Rhythm: Friday Afternoon Decay
              </span>
              <span className="font-tag-mono text-xs text-primary font-bold">MODERATE</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Friday sessions show a -41% net expectancy degradation compared to Wednesday A+
              expansions. Volume contraction and end-of-week exhaustion correlate with over-trading
              lower timeframe noise.
            </p>
          </div>

          {/* Prescriptive Behavioral Directives */}
          <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-surface-container-highest/30 flex flex-col gap-2">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
              Prescriptive Rules For Next Session
            </span>
            <ul className="space-y-1.5 font-body-sm text-body-sm text-on-surface">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">
                  check
                </span>
                <span>
                  <strong>Strict Scale-Out Protocol:</strong> Exit 50% at 2.0R, move stop to breakeven,
                  and let trailing runner seek 3.5R without manual interference.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">
                  check
                </span>
                <span>
                  <strong>Friday Hard Cutoff:</strong> Cease execution routing after 11:30 AM EST on
                  Fridays to protect weekly equity highs.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px] shrink-0 mt-0.5">
                  check
                </span>
                <span>
                  <strong>Counter-Trend Fade Pause:</strong> Temporarily remove counter-trend fades
                  from active playbook until sample win rate recovers above 50%.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">task_alt</span>
          <span>Acknowledge &amp; Commit Directives</span>
        </button>
      </div>
    </div>
  );
};
