import React, { useState } from 'react';
import { OCTOBER_DAYS, ASSET_PERFORMANCE, STRATEGY_PERFORMANCE, SESSIONS } from '../../data/initialData';
import { CalendarDay } from '../../types/trade';

interface AnalyticsViewProps {
  onTriggerExport: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ onTriggerExport }) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [inspectedDay, setInspectedDay] = useState<{
    date: string;
    pnl: string;
    desc: string;
    type: 'win' | 'loss' | 'neutral';
  }>({
    date: 'Oct 06',
    pnl: '+$1,100.00',
    desc: '4 trades (All VWAP extensions executed)',
    type: 'win',
  });

  const handleDayClick = (day: CalendarDay) => {
    setInspectedDay({
      date: day.dateStr,
      pnl: day.pnlFormatted,
      desc: day.details,
      type: day.type,
    });
  };

  const filterTabs = [
    { id: 'all', label: 'All Dimensions' },
    { id: 'asset', label: 'By Asset' },
    { id: 'strategy', label: 'By Strategy' },
    { id: 'session', label: 'By Session' },
    { id: 'rhythm', label: 'Day of Week' },
    { id: 'direction', label: 'Long vs Short' },
    { id: 'calendar', label: 'Calendar' },
  ];

  const shouldShow = (section: string) => {
    return activeFilter === 'all' || activeFilter === section;
  };

  return (
    <div className="flex flex-col w-full gap-space-lg select-none max-w-md mx-auto pb-12">
      {/* Dimension Switcher Segmented Carousel */}
      <section className="w-full -mx-4 px-4 overflow-x-auto no-scrollbar py-space-xs">
        <div className="flex items-center gap-space-xs min-w-max bg-surface-container-lowest p-1 rounded-full shadow-inner border border-surface-container-highest/40">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-full font-label-caps text-label-caps uppercase tracking-wider transition-all duration-200 ${
                activeFilter === tab.id
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                  : 'bg-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Primary Metric Summary Bento Header */}
      <section className="grid grid-cols-3 gap-space-xs relative overflow-hidden rounded-xl bg-surface-container-low p-space-md shadow-md border border-surface-container-highest/40">
        <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        {/* Profit Factor */}
        <div className="flex flex-col bg-surface-container rounded-lg p-space-sm relative z-10 border border-surface-container-highest/20">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              PF Factor
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
          </div>
          <span className="font-data-metric-lg text-data-metric-lg text-secondary font-bold">
            2.42
          </span>
          <span className="font-tag-mono text-tag-mono text-on-surface-variant mt-0.5">
            Bench: &gt;1.80
          </span>
        </div>

        {/* Expectancy */}
        <div className="flex flex-col bg-surface-container rounded-lg p-space-sm relative z-10 border border-surface-container-highest/20">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Expectancy
            </span>
            <span className="material-symbols-outlined text-[14px] text-primary">ssid_chart</span>
          </div>
          <span className="font-data-metric-md text-data-metric-md text-primary font-semibold truncate">
            +$228.10
          </span>
          <span className="font-tag-mono text-tag-mono text-on-surface-variant mt-0.5">
            Per Exec
          </span>
        </div>

        {/* Sharpe Ratio */}
        <div className="flex flex-col bg-surface-container rounded-lg p-space-sm relative z-10 border border-surface-container-highest/20">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Sharpe
            </span>
            <span className="font-tag-mono text-tag-mono text-secondary px-1 rounded bg-secondary/15 font-bold">
              A+
            </span>
          </div>
          <span className="font-data-metric-lg text-data-metric-lg text-on-surface font-bold">
            1.85
          </span>
          <span className="font-tag-mono text-tag-mono text-on-surface-variant mt-0.5">
            Vol-Adjusted
          </span>
        </div>
      </section>

      {/* Interactive Monthly Performance Calendar */}
      {shouldShow('calendar') && (
        <section className="flex flex-col gap-space-sm bg-surface-container-low rounded-xl p-space-md shadow-md border border-surface-container-highest/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Monthly P&amp;L Matrix
              </h2>
            </div>
            <span className="font-tag-mono text-tag-mono text-secondary bg-secondary/15 px-2 py-0.5 rounded-full font-semibold">
              OCTOBER 2024
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 pt-space-xs text-center">
            <div className="font-label-caps text-label-caps text-outline pb-1">MON</div>
            <div className="font-label-caps text-label-caps text-outline pb-1">TUE</div>
            <div className="font-label-caps text-label-caps text-outline pb-1">WED</div>
            <div className="font-label-caps text-label-caps text-outline pb-1">THU</div>
            <div className="font-label-caps text-label-caps text-outline pb-1">FRI</div>

            {OCTOBER_DAYS.map((day) => {
              const isSelected = inspectedDay.date === day.dateStr;
              const isLoss = day.type === 'loss';
              return (
                <button
                  key={day.dayNumber}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-transform active:scale-95 text-left border ${
                    isSelected
                      ? 'border-primary ring-1 ring-primary/60 bg-surface-container-high'
                      : day.isHighlighted
                      ? 'bg-secondary/20 hover:bg-secondary/30 border-secondary/30'
                      : isLoss
                      ? 'bg-error-container/30 hover:bg-error-container/50 border-error/20'
                      : 'bg-surface-container hover:bg-surface-container-high border-surface-container-highest/30'
                  }`}
                >
                  <span
                    className={`font-tag-mono self-start text-[10px] ${
                      isLoss
                        ? 'text-error'
                        : day.isHighlighted
                        ? 'text-secondary font-bold'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                  <span
                    className={`font-data-metric-sm text-data-metric-sm font-semibold mt-1 ${
                      isLoss ? 'text-error' : 'text-secondary'
                    }`}
                  >
                    {day.pnlFormatted}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Inspector drawer snippet */}
          <div className="flex items-center justify-between p-space-sm bg-surface-container rounded-lg mt-space-xs border border-surface-container-highest/40">
            <div className="flex items-center gap-space-sm min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  inspectedDay.type === 'loss'
                    ? 'bg-error-container/40 text-error'
                    : 'bg-secondary/20 text-secondary'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {inspectedDay.type === 'loss' ? 'priority_high' : 'verified'}
                </span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-body-md text-body-md text-on-surface font-semibold truncate">
                  {inspectedDay.date} • {inspectedDay.pnl}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {inspectedDay.desc}
                </span>
              </div>
            </div>
            <span className="font-tag-mono text-tag-mono text-primary flex-shrink-0 pl-1 uppercase font-semibold">
              TAP DAY
            </span>
          </div>
        </section>
      )}

      {/* Asset Performance Breakdown */}
      {shouldShow('asset') && (
        <section className="flex flex-col gap-space-md bg-surface-container-low rounded-xl p-space-md shadow-md border border-surface-container-highest/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[20px]">
                candlestick_chart
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Asset Allocation Edge
              </h2>
            </div>
            <span className="font-tag-mono text-tag-mono text-on-surface-variant">5 INSTRUMENTS</span>
          </div>

          <div className="flex flex-col gap-space-sm">
            {ASSET_PERFORMANCE.map((asset) => {
              const isProfit = asset.pnl > 0;
              return (
                <div
                  key={asset.symbol}
                  className="flex flex-col p-space-sm bg-surface-container rounded-lg gap-space-xs border border-surface-container-highest/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        {asset.symbol}
                      </span>
                      <span className="font-tag-mono text-tag-mono text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5 rounded">
                        {asset.tradesCount} TRADES
                      </span>
                    </div>
                    <span
                      className={`font-data-metric-md text-data-metric-md font-bold ${
                        isProfit ? 'text-secondary' : 'text-error'
                      }`}
                    >
                      {isProfit
                        ? `+$${asset.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : `-$${Math.abs(asset.pnl).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span className={isProfit ? '' : 'text-error'}>Win Rate {asset.winRate}%</span>
                    <span
                      className={`font-tag-mono text-tag-mono ${
                        asset.statusColor === 'secondary'
                          ? 'text-secondary'
                          : asset.statusColor === 'error'
                          ? 'text-error'
                          : 'text-primary'
                      }`}
                    >
                      {asset.label}
                    </span>
                  </div>
                  {/* Proportional Bar Track */}
                  <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        asset.statusColor === 'secondary'
                          ? 'bg-secondary'
                          : asset.statusColor === 'error'
                          ? 'bg-error'
                          : 'bg-primary-container'
                      }`}
                      style={{ width: `${asset.winRate}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Strategy Matrix Table/Cards */}
      {shouldShow('strategy') && (
        <section className="flex flex-col gap-space-md bg-surface-container-low rounded-xl p-space-md shadow-md border border-surface-container-highest/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Playbook Edge Matrix
              </h2>
            </div>
            <span className="font-tag-mono text-tag-mono text-primary bg-primary-container/20 px-2 py-0.5 rounded-full font-semibold">
              AUDITED
            </span>
          </div>

          <div className="flex flex-col gap-space-sm">
            {STRATEGY_PERFORMANCE.map((strat) => {
              const isWin = strat.pnl >= 0;
              return (
                <div
                  key={strat.name}
                  className="flex flex-col p-space-sm bg-surface-container rounded-lg gap-space-xs border border-surface-container-highest/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      {strat.name}
                    </span>
                    <span
                      className={`font-data-metric-md text-data-metric-md font-bold ${
                        isWin ? 'text-secondary' : 'text-error'
                      }`}
                    >
                      {isWin
                        ? `+$${strat.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                        : `-$${Math.abs(strat.pnl).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-space-xs pt-1">
                    <div className="flex flex-col bg-surface-container-high p-1.5 rounded text-center">
                      <span className="font-tag-mono text-tag-mono text-on-surface-variant">
                        SAMPLE
                      </span>
                      <span className="font-data-metric-sm text-data-metric-sm text-on-surface font-semibold">
                        {strat.sampleTrades} trades
                      </span>
                    </div>
                    <div className="flex flex-col bg-surface-container-high p-1.5 rounded text-center">
                      <span className="font-tag-mono text-tag-mono text-on-surface-variant">WIN %</span>
                      <span
                        className={`font-data-metric-sm text-data-metric-sm font-semibold ${
                          isWin ? 'text-secondary' : 'text-error'
                        }`}
                      >
                        {strat.winRate}%
                      </span>
                    </div>
                    <div className="flex flex-col bg-surface-container-high p-1.5 rounded text-center">
                      <span className="font-tag-mono text-tag-mono text-on-surface-variant">
                        AVG R:R
                      </span>
                      <span className="font-data-metric-sm text-data-metric-sm text-primary font-semibold">
                        {strat.avgRR}
                      </span>
                    </div>
                  </div>

                  {strat.warning && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-error-container/30 text-error mt-1 border border-error/20">
                      <span className="material-symbols-outlined text-[14px]">warning</span>
                      <span className="font-tag-mono text-tag-mono font-semibold">
                        {strat.warning}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Trading Session Comparison */}
      {shouldShow('session') && (
        <section className="flex flex-col gap-space-md bg-surface-container-low rounded-xl p-space-md shadow-md border border-surface-container-highest/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">
                schedule
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Execution Sessions
              </h2>
            </div>
            <span className="font-tag-mono text-tag-mono text-on-surface-variant">UTC LIQUIDITY</span>
          </div>

          <div className="grid grid-cols-3 gap-space-xs">
            {SESSIONS.map((sess) => {
              const isProfit = sess.pnl >= 0;
              return (
                <div
                  key={sess.name}
                  className="flex flex-col p-space-sm bg-surface-container rounded-lg items-center text-center border border-surface-container-highest/30"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                      isProfit
                        ? 'bg-secondary/15 text-secondary'
                        : 'bg-error/15 text-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{sess.icon}</span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    {sess.name}
                  </span>
                  <span
                    className={`font-data-metric-sm text-data-metric-sm font-bold mt-1 ${
                      isProfit ? 'text-secondary' : 'text-error'
                    }`}
                  >
                    {isProfit ? `+$${sess.pnl.toLocaleString()}` : `-$${Math.abs(sess.pnl)}`}
                  </span>
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isProfit ? 'bg-secondary' : 'bg-error'}`}
                    />
                    <span className="font-tag-mono text-tag-mono text-on-surface-variant">
                      {sess.winRate}% WR
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Day of Week Rhythm Bar Chart */}
      {shouldShow('rhythm') && (
        <section className="flex flex-col gap-space-sm bg-surface-container-low rounded-xl p-space-md shadow-md border border-surface-container-highest/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[20px]">bar_chart</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Day of Week Rhythm
              </h2>
            </div>
            <span className="font-tag-mono text-tag-mono text-on-surface-variant">NET ALPHA</span>
          </div>

          <div className="w-full bg-surface-container rounded-lg p-space-sm flex flex-col gap-space-sm border border-surface-container-highest/30">
            <div className="flex justify-between items-end h-32 px-2 pt-2">
              {/* Monday */}
              <div className="flex flex-col items-center gap-1 w-1/5 group cursor-pointer">
                <span className="font-tag-mono text-tag-mono text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  +$1.8k
                </span>
                <div
                  className="w-7 rounded-t bg-secondary transition-all group-hover:scale-y-105 origin-bottom"
                  style={{ height: '44px' }}
                />
                <span className="font-label-caps text-label-caps text-on-surface font-semibold mt-1">
                  MON
                </span>
              </div>
              {/* Tuesday */}
              <div className="flex flex-col items-center gap-1 w-1/5 group cursor-pointer">
                <span className="font-tag-mono text-tag-mono text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  +$3.4k
                </span>
                <div
                  className="w-7 rounded-t bg-secondary transition-all group-hover:scale-y-105 origin-bottom"
                  style={{ height: '76px' }}
                />
                <span className="font-label-caps text-label-caps text-on-surface font-semibold mt-1">
                  TUE
                </span>
              </div>
              {/* Wednesday */}
              <div className="flex flex-col items-center gap-1 w-1/5 group cursor-pointer">
                <span className="font-tag-mono text-tag-mono text-secondary opacity-100 font-semibold">
                  +$4.2k
                </span>
                <div
                  className="w-7 rounded-t bg-secondary-container transition-all group-hover:scale-y-105 origin-bottom shadow-[0_0_12px_rgba(78,222,163,0.4)]"
                  style={{ height: '98px' }}
                />
                <span className="font-label-caps text-label-caps text-secondary font-bold mt-1">
                  WED
                </span>
              </div>
              {/* Thursday */}
              <div className="flex flex-col items-center gap-1 w-1/5 group cursor-pointer">
                <span className="font-tag-mono text-tag-mono text-secondary opacity-0 group-hover:opacity-100 transition-opacity">
                  +$2.1k
                </span>
                <div
                  className="w-7 rounded-t bg-secondary transition-all group-hover:scale-y-105 origin-bottom"
                  style={{ height: '52px' }}
                />
                <span className="font-label-caps text-label-caps text-on-surface font-semibold mt-1">
                  THU
                </span>
              </div>
              {/* Friday */}
              <div className="flex flex-col items-center gap-1 w-1/5 group cursor-pointer">
                <span className="font-tag-mono text-tag-mono text-error opacity-100 font-semibold">
                  -$680
                </span>
                <div
                  className="w-7 rounded-b bg-error transition-all group-hover:scale-y-105 origin-top mt-auto mb-5"
                  style={{ height: '22px' }}
                />
                <span className="font-label-caps text-label-caps text-error font-bold mt-1">
                  FRI
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-error-container/30 text-error border border-error/20">
              <span className="material-symbols-outlined text-[15px]">report_problem</span>
              <span className="font-tag-mono text-tag-mono">
                CAUTION: Persistent Friday performance degradation detected across 9 weeks.
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Direction Comparison: Long vs Short */}
      {shouldShow('direction') && (
        <section className="flex flex-col gap-space-md bg-surface-container-low rounded-xl p-space-md shadow-md border border-surface-container-highest/40 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-primary text-[20px]">swap_vert</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Direction Asymmetry
              </h2>
            </div>
            <span className="font-tag-mono text-tag-mono text-on-surface-variant">TOTAL: 142 TRADES</span>
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            {/* Long Trades */}
            <div className="flex flex-col p-space-sm bg-surface-container rounded-lg gap-space-xs border border-surface-container-highest/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-secondary">trending_up</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Long
                  </span>
                </div>
                <span className="font-tag-mono text-tag-mono text-secondary bg-secondary/15 px-1.5 py-0.5 rounded font-semibold">
                  68% WR
                </span>
              </div>
              <span className="font-data-metric-lg text-data-metric-lg text-secondary font-bold mt-1">
                +$10,240
              </span>
              <span className="font-tag-mono text-tag-mono text-on-surface-variant">84 Executions</span>
            </div>

            {/* Short Trades */}
            <div className="flex flex-col p-space-sm bg-surface-container rounded-lg gap-space-xs border border-surface-container-highest/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-primary">trending_down</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Short
                  </span>
                </div>
                <span className="font-tag-mono text-tag-mono text-primary bg-primary-container/20 px-1.5 py-0.5 rounded font-semibold">
                  64% WR
                </span>
              </div>
              <span className="font-data-metric-lg text-data-metric-lg text-secondary font-bold mt-1">
                +$4,600
              </span>
              <span className="font-tag-mono text-tag-mono text-on-surface-variant">58 Executions</span>
            </div>
          </div>
        </section>
      )}

      {/* Export & Share Institutional Seal Action */}
      <section className="flex flex-col items-center gap-space-xs pt-space-xs pb-space-sm">
        <button
          onClick={onTriggerExport}
          className="w-full flex items-center justify-between p-space-md rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-headline-sm shadow-[0_0_16px_rgba(77,142,255,0.4)] active:scale-[0.98] transition-transform hover:brightness-110"
        >
          <div className="flex items-center gap-space-sm min-w-0 text-left">
            <div className="w-10 h-10 rounded-full bg-on-primary-container/15 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <div className="flex flex-col truncate">
              <span className="font-headline-sm text-headline-sm font-semibold truncate">
                Export Performance Audit
              </span>
              <span className="font-tag-mono text-tag-mono opacity-80 uppercase tracking-wide text-[10px]">
                CSV • Verified Institutional PDF
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[20px] flex-shrink-0 ml-1">download</span>
        </button>

        <div className="flex items-center gap-1.5 text-on-surface-variant/70 mt-1">
          <span className="material-symbols-outlined text-[13px]">lock</span>
          <span className="font-tag-mono text-tag-mono text-[10px]">
            Cryptographically hashed record ID: #TJ-8841-OCT24
          </span>
        </div>
      </section>
    </div>
  );
};
