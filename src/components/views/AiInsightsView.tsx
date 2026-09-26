import React from 'react';

interface AiInsightsViewProps {
  onRunDebrief: () => void;
}

export const AiInsightsView: React.FC<AiInsightsViewProps> = ({ onRunDebrief }) => {
  return (
    <div className="flex flex-col w-full pb-16 space-y-4 max-w-md mx-auto select-none">
      {/* AI Radar Card */}
      <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md flex flex-col gap-space-md relative overflow-hidden border border-surface-container-highest/40">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-space-xs">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-[22px] text-primary">psychology</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Behavioral AI Radar
            </span>
          </div>
          <span className="px-space-xs py-0.5 rounded-full bg-primary/10 text-primary font-tag-mono text-tag-mono font-bold">
            NEURAL v4.2
          </span>
        </div>

        {/* Critical Risk Indicators Grid */}
        <div className="grid grid-cols-1 gap-space-sm">
          {/* Overtrading Metric */}
          <div className="p-space-md rounded-lg bg-surface-container flex items-center justify-between border border-surface-container-highest/30">
            <div className="flex flex-col">
              <span className="font-body-md text-body-md text-on-surface font-medium">
                Overtrading Propensity
              </span>
              <span className="font-tag-mono text-tag-mono text-on-surface-variant">
                Pacing: 2.1 trades / session
              </span>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span className="font-tag-mono text-tag-mono text-secondary font-semibold">
                LOW RISK
              </span>
            </div>
          </div>

          {/* Revenge Trading Metric */}
          <div className="p-space-md rounded-lg bg-surface-container flex items-center justify-between border border-surface-container-highest/30">
            <div className="flex flex-col">
              <span className="font-body-md text-body-md text-on-surface font-medium">
                Revenge Impulses
              </span>
              <span className="font-tag-mono text-tag-mono text-on-surface-variant">
                0 anomalies in past 30 days
              </span>
            </div>
            <div className="px-space-sm py-0.5 rounded-full bg-secondary/10 text-secondary font-tag-mono text-tag-mono font-semibold">
              PRISTINE
            </div>
          </div>

          {/* Early Profit Taking Alert (HIGH SEVERITY) */}
          <div className="p-space-md rounded-lg bg-tertiary-container/10 border-l-2 border-tertiary flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm text-tertiary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">warning</span> Early Profit Taking
              </span>
              <span className="font-tag-mono text-tag-mono text-tertiary px-space-xs py-0.5 rounded bg-tertiary/10 font-bold uppercase">
                ALERT
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Systematic premature exits detected. Average winner exited at{' '}
              <strong className="text-tertiary font-tag-mono text-tag-mono">1.4R</strong> vs intended
              playbook target <strong className="text-secondary font-tag-mono text-tag-mono">2.5R</strong>
              . Left ~$8,400 unrealized value on table.
            </p>
          </div>
        </div>

        {/* Weekly AI Diagnosis Structured Report */}
        <div className="flex flex-col gap-space-sm pt-space-xs">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
            Weekly Cognitive Audit
          </span>

          <div className="space-y-space-xs">
            {/* Strength */}
            <div className="p-space-sm rounded-lg bg-surface-container flex items-start gap-space-sm border border-surface-container-highest/20">
              <span className="mt-1 w-2 h-2 rounded-full bg-secondary shrink-0" />
              <div className="flex flex-col">
                <span className="font-tag-mono text-tag-mono text-secondary font-semibold uppercase">
                  Strength: Capital Preservation
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Stop-loss breaches were 0% over 38 executions. Sizing matches Kelly-criterion limits.
                </span>
              </div>
            </div>

            {/* Observation */}
            <div className="p-space-sm rounded-lg bg-surface-container flex items-start gap-space-sm border border-surface-container-highest/20">
              <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
              <div className="flex flex-col">
                <span className="font-tag-mono text-tag-mono text-primary font-semibold uppercase">
                  Observation: Morning vs Afternoon
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Win-rate drops from 74% (09:30-11:30 EST) to 48% post 14:00 EST. Consider hard daily cutoff.
                </span>
              </div>
            </div>

            {/* Behavioral Warning */}
            <div className="p-space-sm rounded-lg bg-surface-container flex items-start gap-space-sm border border-surface-container-highest/20">
              <span className="mt-1 w-2 h-2 rounded-full bg-tertiary shrink-0" />
              <div className="flex flex-col">
                <span className="font-tag-mono text-tag-mono text-tertiary font-semibold uppercase">
                  Warning: Tilt Vulnerability
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                  Contract scaling jumped 1.5x after two consecutive scratch trades on Wednesday session.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations Action Button */}
        <button
          type="button"
          onClick={onRunDebrief}
          className="w-full py-3 px-4 rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-space-sm shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <span>Run Deep Neural Debrief</span>
          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </div>

      {/* Behavioral Scorecard Snapshot */}
      <div className="bg-surface-container-low rounded-xl p-space-md border border-surface-container-highest/30 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-label-caps text-label-caps text-outline uppercase">
            Psychological Baseline
          </span>
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold mt-0.5">
            Composure Score: 92/100
          </span>
          <span className="font-body-sm text-body-sm text-secondary">
            Low emotional volatility detected
          </span>
        </div>
        <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center text-secondary">
          <span className="material-symbols-outlined text-[24px]">verified</span>
        </div>
      </div>
    </div>
  );
};
