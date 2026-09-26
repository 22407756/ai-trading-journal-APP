import React, { useState } from 'react';
import { Trade } from '../../types/trade';
import { NOVEMBER_DAYS } from '../../data/initialData';

interface DesktopTerminalViewProps {
  trades: Trade[];
  onOpenLogTrade: () => void;
  onNavigateView: (view: string) => void;
  onRunDebrief: () => void;
  onOpenReadme?: () => void;
}

export const DesktopTerminalView: React.FC<DesktopTerminalViewProps> = ({
  trades,
  onOpenLogTrade,
  onNavigateView,
  onRunDebrief,
  onOpenReadme,
}) => {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedTf, setSelectedTf] = useState('3M');
  const [ledgerFilter, setLedgerFilter] = useState('ALL');
  const [overlaySPX, setOverlaySPX] = useState(true);
  const [overlayBTC, setOverlayBTC] = useState(false);

  return (
    <div className="flex w-full min-h-screen bg-background text-on-surface">
      {/* Left Institutional Sidebar */}
      <aside className="w-72 bg-surface-container-low/95 backdrop-blur-xl border-r border-surface-container-highest/40 flex flex-col justify-between flex-shrink-0 z-20">
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo */}
          <div className="h-16 px-space-lg flex items-center gap-space-md border-b border-surface-container-highest/30">
            <img
              alt="Trading Journal AI Logo"
              className="h-8 w-auto object-contain"
              src="https://lh3.googleusercontent.com/aida/AEtjO1VfFGV_cIPgAyJmFPieg_RgXHtP0PwM1ENiRaokZPljE-6DQHm6hxNsO6oTEX0LU25TX9Et4L_QNDIti0wfRdIyQLI85gVYB7QTBEk1HuOtF8bV-GYgsHHs8ddjLMbCET_TqZJJjjdipII6dbLxxi5pSTV0hzgzCrLuni0KVxPCJjyGuqx5gvJkWbVnfI6ZTRKDWQem5HJIgWaWNu63zK0FQ4ELxBotypQzi7VMK7Dhq57rDb2_UE5sYroo"
            />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight leading-none font-semibold">
                Trading Journal
              </span>
              <span className="font-label-caps text-label-caps text-primary tracking-wider uppercase mt-1 font-bold">
                AI Institutional
              </span>
            </div>
          </div>

          <div className="px-space-md py-space-xs mt-2">
            <div className="px-space-md py-space-xs text-on-surface-variant font-label-caps text-label-caps uppercase tracking-wider">
              Terminal Navigation
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-space-md flex-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
              { id: 'log-trade', label: 'Live Journal & Entry', icon: 'edit_square' },
              { id: 'analytics', label: 'Performance Analytics', icon: 'monitoring' },
              { id: 'ai-insights', label: 'Behavioral AI Insights', icon: 'psychology' },
              { id: 'strategy-benchmarking', label: 'Strategy Benchmarking', icon: 'balance' },
              { id: 'discipline-streaks', label: 'Discipline & Streaks', icon: 'verified' },
              { id: 'user-settings', label: 'User Settings', icon: 'tune' },
            ].map((nav) => {
              const isActive = activeNav === nav.id;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(nav.id);
                    if (nav.id === 'log-trade') {
                      onOpenLogTrade();
                    } else if (nav.id === 'analytics') {
                      onNavigateView('analytics');
                    } else if (nav.id === 'ai-insights') {
                      onNavigateView('ai-insights');
                    } else if (nav.id === 'discipline-streaks' || nav.id === 'user-settings') {
                      onNavigateView('risk-profile');
                    }
                  }}
                  className={`flex items-center gap-space-md px-space-md py-2.5 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{nav.icon}</span>
                  <span className="font-body-md text-body-md">{nav.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Risk Guardrail Box */}
        <div className="p-space-md m-space-md rounded-xl bg-surface-container/60 backdrop-blur-md border border-surface-container-highest/40 flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Risk Drawdown
            </span>
            <span className="font-data-metric-sm text-data-metric-sm text-secondary font-bold">
              0.42% / 2.0%
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="bg-secondary h-full rounded-full" style={{ width: '21%' }} />
          </div>
          <div className="flex items-center justify-between text-on-surface-variant font-tag-mono text-tag-mono mt-1">
            <span>Max DD Protection</span>
            <span className="text-secondary font-semibold">Secure</span>
          </div>
        </div>
      </aside>

      {/* Main Desktop Stage */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-surface/85 backdrop-blur-xl border-b border-surface-container-highest/40 flex items-center justify-between px-space-lg flex-shrink-0">
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-1.5 rounded-full border border-surface-container-highest/30">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                Net Day:
              </span>
              <span className="font-data-metric-sm text-data-metric-sm text-secondary font-bold">
                +$3,480.50
              </span>
              <span className="px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-tag-mono text-tag-mono font-semibold">
                +1.82%
              </span>
            </div>

            <div className="flex items-center gap-space-md">
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                Sessions:
              </span>
              <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container border border-surface-container-highest/30">
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                <span className="font-tag-mono text-tag-mono text-on-surface-variant">ASIA</span>
              </div>
              <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container border border-surface-container-highest/30">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="font-tag-mono text-tag-mono text-on-surface font-semibold">LDN</span>
              </div>
              <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-surface-container border border-surface-container-highest/30">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="font-tag-mono text-tag-mono text-on-surface font-semibold">NYC</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-space-md">
            {onOpenReadme && (
              <button
                type="button"
                onClick={onOpenReadme}
                className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary hover:text-on-surface font-tag-mono text-xs font-semibold flex items-center gap-1.5 transition-colors border border-surface-container-highest/40"
              >
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                <span>Docs / README</span>
              </button>
            )}

            <button
              onClick={onOpenLogTrade}
              className="px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-sm font-semibold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Log Trade</span>
            </button>

            <button
              type="button"
              className="w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors relative border border-surface-container-highest/30"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
            </button>

            <button
              type="button"
              className="w-9 h-9 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors border border-surface-container-highest/30"
            >
              <span className="material-symbols-outlined text-[20px]">sync_alt</span>
            </button>

            <div
              className="flex items-center gap-space-sm pl-space-sm cursor-pointer"
              onClick={() => onNavigateView('risk-profile')}
            >
              <div className="flex flex-col text-right">
                <span className="font-headline-sm text-headline-sm text-on-surface leading-none font-semibold">
                  Alex Vance
                </span>
                <span className="font-tag-mono text-tag-mono text-on-surface-variant mt-1">
                  PROP-DESK #882
                </span>
              </div>
              <img
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-secondary/40"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1sS9GPJ9pn9Qcx18J8zUkLlNOsra-IS6Jmt6iJ05aCyIikLubcaOOS1cyzLxH_GD1q4jqAuHBGaCfIQa_soUVvHBe92ho3t0m4co1CtamyAPDwo6kHmfpVI00O0lVJjHvj8dCpLpAtEcsejlNQ_zzxEYVe1mnio_p8E6PGdicK_2XTcHrFRDSxj3t4WmYvICVKqrs-ElcpjITaR-R8a7ukcUr5S70uh9bXcy43vW8KFZ37L7eyQd4zA"
              />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-space-lg flex flex-col gap-space-lg overflow-y-auto">
          {/* Top 7-Column Stats Ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-space-sm w-full">
            {/* Cum. Net P&L */}
            <div className="relative p-space-md rounded-xl bg-surface-container-low backdrop-blur-md overflow-hidden flex flex-col justify-between shadow-sm border border-surface-container-highest/30 hover:bg-surface-container transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary/80 to-transparent" />
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Cum. Net P&amp;L
                </span>
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  trending_up
                </span>
              </div>
              <div className="mt-space-xs flex flex-col">
                <span className="font-data-metric-lg text-data-metric-lg text-secondary tracking-tight font-bold">
                  +$24,650.00
                </span>
                <div className="flex items-center gap-space-xs mt-0.5">
                  <span className="px-space-xs py-0.5 rounded bg-secondary/10 text-secondary font-tag-mono text-tag-mono font-semibold">
                    +18.4% YTD
                  </span>
                  <span className="font-tag-mono text-tag-mono text-on-surface-variant">vs SPX</span>
                </div>
              </div>
            </div>

            {/* Win Rate */}
            <div className="p-space-md rounded-xl bg-surface-container-low backdrop-blur-md flex flex-col justify-between shadow-sm border border-surface-container-highest/30 hover:bg-surface-container transition-all">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Win Rate
                </span>
                <span className="font-tag-mono text-tag-mono text-primary font-medium">L30D</span>
              </div>
              <div className="mt-space-xs">
                <div className="flex items-baseline gap-space-xs">
                  <span className="font-data-metric-lg text-data-metric-lg text-on-surface tracking-tight font-bold">
                    68.4%
                  </span>
                  <span className="font-tag-mono text-tag-mono text-secondary">▲ 2.1%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-1 rounded-full mt-space-sm overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '68.4%' }} />
                </div>
              </div>
            </div>

            {/* Profit Factor */}
            <div className="p-space-md rounded-xl bg-surface-container-low backdrop-blur-md flex flex-col justify-between shadow-sm border border-surface-container-highest/30 hover:bg-surface-container transition-all">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Profit Factor
                </span>
                <span className="px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-tag-mono text-tag-mono">
                  Benchmark: 1.8
                </span>
              </div>
              <div className="mt-space-xs">
                <span className="font-data-metric-lg text-data-metric-lg text-primary tracking-tight font-bold">
                  2.45
                </span>
                <span className="block font-tag-mono text-tag-mono text-on-surface-variant mt-0.5">
                  Gross W/L: 3.12x
                </span>
              </div>
            </div>

            {/* Total Trades */}
            <div className="p-space-md rounded-xl bg-surface-container-low backdrop-blur-md flex flex-col justify-between shadow-sm border border-surface-container-highest/30 hover:bg-surface-container transition-all">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Total Executions
                </span>
                <span className="font-tag-mono text-tag-mono text-on-surface-variant">284 Fills</span>
              </div>
              <div className="mt-space-xs">
                <span className="font-data-metric-lg text-data-metric-lg text-on-surface tracking-tight font-bold">
                  284
                </span>
                <div className="flex items-center gap-space-xs mt-0.5 font-tag-mono text-tag-mono">
                  <span className="text-secondary font-medium">194W</span>
                  <span className="text-outline">/</span>
                  <span className="text-tertiary font-medium">90L</span>
                </div>
              </div>
            </div>

            {/* Trade Expectancy */}
            <div className="p-space-md rounded-xl bg-surface-container-low backdrop-blur-md flex flex-col justify-between shadow-sm border border-surface-container-highest/30 hover:bg-surface-container transition-all">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Expectancy
                </span>
                <span className="material-symbols-outlined text-[16px] text-primary">equalizer</span>
              </div>
              <div className="mt-space-xs">
                <span className="font-data-metric-lg text-data-metric-lg text-primary tracking-tight font-bold">
                  +$86.80
                </span>
                <span className="block font-tag-mono text-tag-mono text-on-surface-variant mt-0.5">
                  Avg per Ticket
                </span>
              </div>
            </div>

            {/* Max Drawdown */}
            <div className="p-space-md rounded-xl bg-surface-container-low backdrop-blur-md flex flex-col justify-between shadow-sm border border-surface-container-highest/30 hover:bg-surface-container transition-all">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                  Max Drawdown
                </span>
                <span className="px-space-xs py-0.5 rounded bg-secondary/10 text-secondary font-tag-mono text-tag-mono">
                  Low Risk
                </span>
              </div>
              <div className="mt-space-xs">
                <span className="font-data-metric-lg text-data-metric-lg text-tertiary tracking-tight font-bold">
                  -5.1%
                </span>
                <span className="block font-tag-mono text-tag-mono text-on-surface-variant mt-0.5">
                  Peak: Oct 14 ($1,290)
                </span>
              </div>
            </div>

            {/* Discipline Streak */}
            <div className="p-space-md rounded-xl bg-surface-container-high backdrop-blur-md flex flex-col justify-between shadow-sm relative overflow-hidden border border-surface-container-highest/40">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-primary uppercase tracking-wider flex items-center gap-1">
                  <span className="text-secondary">●</span> Protocol Streak
                </span>
                <span className="text-sm">🔥</span>
              </div>
              <div className="mt-space-xs">
                <span className="font-data-metric-lg text-data-metric-lg text-secondary tracking-tight font-bold">
                  14 Trades
                </span>
                <span className="block font-tag-mono text-tag-mono text-on-surface-variant mt-0.5 truncate">
                  Strict SL compliance
                </span>
              </div>
            </div>
          </div>

          {/* 12-Column Grid: Portfolio Valuation + AI Radar */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg w-full items-start">
            {/* Left 8 Cols: Chart */}
            <div className="xl:col-span-8 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-low backdrop-blur-xl shadow-md border border-surface-container-highest/40 flex flex-col gap-space-md">
                {/* Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-md">
                    <div>
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest block">
                        Portfolio Valuation
                      </span>
                      <div className="flex items-baseline gap-space-sm mt-0.5">
                        <span className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">
                          $158,420.50
                        </span>
                        <span className="font-tag-mono text-tag-mono text-secondary font-semibold">
                          +18.42% (+$24,650)
                        </span>
                      </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-space-xs pl-space-md border-l border-surface-container-highest">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mr-1">
                        Overlays:
                      </span>
                      <button
                        type="button"
                        onClick={() => setOverlaySPX(!overlaySPX)}
                        className={`px-space-sm py-1 rounded font-tag-mono text-tag-mono flex items-center gap-1 transition-colors ${
                          overlaySPX
                            ? 'bg-surface-container-high text-primary font-semibold'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        <span className="w-2 h-0.5 bg-primary rounded-full" /> S&amp;P 500 (+9.2%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOverlayBTC(!overlayBTC)}
                        className={`px-space-sm py-1 rounded font-tag-mono text-tag-mono flex items-center gap-1 transition-colors ${
                          overlayBTC
                            ? 'bg-surface-container-high text-secondary font-semibold'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        <span className="w-2 h-0.5 bg-secondary rounded-full" /> BTC/USD (+31.4%)
                      </button>
                    </div>
                  </div>

                  {/* Time Horizon Pills */}
                  <div className="flex items-center bg-surface-container p-1 rounded-lg">
                    {['7D', '1M', '3M', '6M', '1Y', 'ALL'].map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setSelectedTf(tf)}
                        className={`px-space-sm py-1 rounded font-tag-mono text-tag-mono transition-colors ${
                          selectedTf === tf
                            ? 'bg-surface-container-highest text-on-surface font-semibold shadow-xs'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Chart */}
                <div className="relative w-full h-80 bg-surface-container-lowest/60 rounded-xl p-space-md flex flex-col justify-between overflow-hidden border border-surface-container-highest/20">
                  <div className="absolute inset-0 flex flex-col justify-between p-space-md pointer-events-none opacity-20">
                    <div className="w-full border-b border-outline-variant" />
                    <div className="w-full border-b border-outline-variant" />
                    <div className="w-full border-b border-outline-variant" />
                    <div className="w-full border-b border-outline-variant" />
                  </div>

                  <svg
                    className="w-full h-full overflow-visible z-10"
                    preserveAspectRatio="none"
                    viewBox="0 0 800 240"
                  >
                    <defs>
                      <linearGradient id="deskEquityGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#4edea3" stopOpacity="0.35" />
                        <stop offset="70%" stopColor="#4edea3" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#4edea3" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="spxGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stopColor="#adc6ff" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#adc6ff" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>

                    {/* S&P 500 Overlay */}
                    {overlaySPX && (
                      <path
                        d="M 0,200 Q 200,180 400,150 T 800,110"
                        fill="none"
                        stroke="url(#spxGrad)"
                        strokeDasharray="4,4"
                        strokeWidth="2"
                      />
                    )}

                    {/* Trader Cumulative Equity Curve Area */}
                    <path
                      d="M 0,220 L 0,190 L 70,175 L 140,185 L 210,140 L 280,148 L 350,110 L 420,125 L 490,85 L 560,95 L 630,55 L 700,42 L 750,48 L 800,22 L 800,240 L 0,240 Z"
                      fill="url(#deskEquityGrad)"
                    />

                    {/* Stroke */}
                    <path
                      d="M 0,190 L 70,175 L 140,185 L 210,140 L 280,148 L 350,110 L 420,125 L 490,85 L 560,95 L 630,55 L 700,42 L 750,48 L 800,22"
                      fill="none"
                      stroke="#4edea3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />

                    {/* High Water Beacon */}
                    <circle cx="800" cy="22" r="5" fill="#4edea3" />
                    <circle cx="800" cy="22" r="10" fill="#4edea3" opacity="0.25" />

                    {/* Trade Pins */}
                    <g transform="translate(490, 85)">
                      <circle cx="0" cy="0" r="4" fill="#4edea3" />
                      <text
                        x="0"
                        y="-10"
                        textAnchor="middle"
                        fill="#d4e4fa"
                        fontFamily="JetBrains Mono"
                        fontSize="10"
                        fontWeight="600"
                      >
                        +4.2R NQ
                      </text>
                    </g>

                    <g transform="translate(280, 148)">
                      <circle cx="0" cy="0" r="4" fill="#ff5451" />
                      <text
                        x="0"
                        y="16"
                        textAnchor="middle"
                        fill="#ffb4ab"
                        fontFamily="JetBrains Mono"
                        fontSize="10"
                        fontWeight="600"
                      >
                        -1.0R Cut
                      </text>
                    </g>
                  </svg>

                  {/* SVG Labels */}
                  <div className="flex justify-between items-center text-on-surface-variant font-tag-mono text-tag-mono pt-space-xs z-10">
                    <span>OCT 01</span>
                    <span>OCT 10</span>
                    <span>OCT 20</span>
                    <span>NOV 01</span>
                    <span>NOV 12</span>
                    <span className="text-secondary font-semibold">LIVE TODAY</span>
                  </div>
                </div>

                {/* Trade Volume & Session Yield Sub-bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md pt-space-xs">
                  {/* Volume Histogram */}
                  <div className="md:col-span-5 bg-surface-container p-space-md rounded-lg flex flex-col justify-between border border-surface-container-highest/30">
                    <div className="flex items-center justify-between mb-space-xs">
                      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                        Daily Trade Volume
                      </span>
                      <span className="font-tag-mono text-tag-mono text-on-surface">
                        Avg: 5.4 trades/day
                      </span>
                    </div>
                    <div className="flex items-end gap-1.5 h-10 w-full pt-1">
                      <div className="flex-1 bg-surface-container-highest rounded-t-sm h-3" />
                      <div className="flex-1 bg-surface-container-highest rounded-t-sm h-6" />
                      <div className="flex-1 bg-primary/70 rounded-t-sm h-8" />
                      <div className="flex-1 bg-surface-container-highest rounded-t-sm h-4" />
                      <div className="flex-1 bg-secondary rounded-t-sm h-9" />
                      <div className="flex-1 bg-surface-container-highest rounded-t-sm h-5" />
                      <div className="flex-1 bg-primary/70 rounded-t-sm h-7" />
                      <div className="flex-1 bg-surface-container-highest rounded-t-sm h-2" />
                      <div className="flex-1 bg-secondary rounded-t-sm h-10" />
                      <div className="flex-1 bg-secondary rounded-t-sm h-7" />
                      <div className="flex-1 bg-primary/70 rounded-t-sm h-6" />
                      <div className="flex-1 bg-secondary rounded-t-sm h-8" />
                    </div>
                  </div>

                  {/* Active Sessions Tracker */}
                  <div className="md:col-span-7 bg-surface-container p-space-md rounded-lg flex flex-col justify-between border border-surface-container-highest/30">
                    <span className="font-label-caps text-label-caps text-on-surface-variant uppercase mb-space-xs">
                      Session Performance Yield
                    </span>
                    <div className="grid grid-cols-3 gap-space-sm text-center">
                      <div className="p-space-xs rounded bg-surface-container-low flex flex-col items-center">
                        <span className="font-tag-mono text-tag-mono text-on-surface-variant">
                          ASIA (TYO)
                        </span>
                        <span className="font-data-metric-sm text-data-metric-sm text-on-surface-variant mt-0.5">
                          $0.00
                        </span>
                        <span className="font-tag-mono text-tag-mono text-outline text-[10px]">
                          Flat (No trades)
                        </span>
                      </div>
                      <div className="p-space-xs rounded bg-surface-container-low flex flex-col items-center">
                        <span className="font-tag-mono text-tag-mono text-on-surface-variant">
                          LONDON (LDN)
                        </span>
                        <span className="font-data-metric-sm text-data-metric-sm text-secondary mt-0.5 font-bold">
                          +$1,200.00
                        </span>
                        <span className="font-tag-mono text-tag-mono text-secondary text-[10px]">
                          3W / 0L
                        </span>
                      </div>
                      <div className="p-space-xs rounded bg-surface-container-low flex flex-col items-center">
                        <span className="font-tag-mono text-tag-mono text-on-surface-variant">
                          NEW YORK (NYC)
                        </span>
                        <span className="font-data-metric-sm text-data-metric-sm text-secondary mt-0.5 font-bold">
                          +$3,450.00
                        </span>
                        <span className="font-tag-mono text-tag-mono text-secondary text-[10px]">
                          4W / 1L
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Behavioral AI Radar */}
            <div className="xl:col-span-4 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-low backdrop-blur-xl shadow-md border border-surface-container-highest/40 flex flex-col gap-space-md relative overflow-hidden">
                <div className="flex items-center justify-between pb-space-xs">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      psychology
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Behavioral AI Radar
                    </span>
                  </div>
                  <span className="px-space-xs py-0.5 rounded-full bg-primary/10 text-primary font-tag-mono text-tag-mono font-bold">
                    NEURAL v4.2
                  </span>
                </div>

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

                  {/* Revenge Metric */}
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

                  {/* Early Profit Taking Alert */}
                  <div className="p-space-md rounded-lg bg-tertiary-container/10 border-l-2 border-tertiary flex flex-col gap-space-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-headline-sm text-tertiary font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[18px]">warning</span> Early
                        Profit Taking
                      </span>
                      <span className="font-tag-mono text-tag-mono text-tertiary px-space-xs py-0.5 rounded bg-tertiary/10 font-bold uppercase">
                        ALERT
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Systematic premature exits detected. Average winner exited at{' '}
                      <strong className="text-tertiary font-tag-mono text-tag-mono">1.4R</strong> vs
                      intended playbook target{' '}
                      <strong className="text-secondary font-tag-mono text-tag-mono">2.5R</strong>. Left
                      ~$8,400 unrealized value on table.
                    </p>
                  </div>
                </div>

                {/* Cognitive Audit Findings */}
                <div className="flex flex-col gap-space-sm pt-space-xs">
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
                    Weekly Cognitive Audit
                  </span>

                  <div className="space-y-space-xs">
                    <div className="p-space-sm rounded-lg bg-surface-container flex items-start gap-space-sm border border-surface-container-highest/20">
                      <span className="mt-1 w-2 h-2 rounded-full bg-secondary shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-tag-mono text-tag-mono text-secondary font-semibold uppercase">
                          Strength: Capital Preservation
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Stop-loss breaches were 0% over 38 executions. Sizing matches Kelly limits.
                        </span>
                      </div>
                    </div>

                    <div className="p-space-sm rounded-lg bg-surface-container flex items-start gap-space-sm border border-surface-container-highest/20">
                      <span className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-tag-mono text-tag-mono text-primary font-semibold uppercase">
                          Observation: Morning vs Afternoon
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Win-rate drops from 74% (09:30-11:30) to 48% post 14:00.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onRunDebrief}
                  className="w-full py-2.5 px-space-md rounded-lg bg-primary-container text-on-primary-container font-headline-sm text-headline-sm font-semibold flex items-center justify-center gap-space-sm hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  <span>Run Deep Neural Debrief</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Split: November Execution Calendar + Active Execution Ledger Table */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg w-full items-start">
            {/* Left 6 Cols: November P&L Calendar */}
            <div className="xl:col-span-6 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-low backdrop-blur-xl shadow-md border border-surface-container-highest/40 flex flex-col gap-space-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      calendar_month
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Execution P&amp;L Matrix
                    </span>
                    <span className="font-tag-mono text-tag-mono text-on-surface-variant">
                      November 2024
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded bg-surface-container text-on-surface hover:bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                    </button>
                    <button className="w-7 h-7 rounded bg-surface-container text-on-surface hover:bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-space-xs text-center pb-space-xs font-label-caps text-label-caps text-on-surface-variant uppercase">
                  <span>MON</span>
                  <span>TUE</span>
                  <span>WED</span>
                  <span>THU</span>
                  <span>FRI</span>
                </div>

                <div className="grid grid-cols-5 gap-space-xs">
                  {NOVEMBER_DAYS.map((day) => {
                    const isLoss = day.type === 'loss';
                    return (
                      <div
                        key={day.dayNumber}
                        className={`h-20 p-1.5 rounded-lg flex flex-col justify-between border ${
                          day.isHighlighted
                            ? 'bg-surface-container-highest border-secondary/50 shadow-sm relative overflow-hidden'
                            : isLoss
                            ? 'bg-surface-container border-error/20'
                            : 'bg-surface-container border-surface-container-highest/20'
                        }`}
                      >
                        {day.isHighlighted && (
                          <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-secondary m-1" />
                        )}
                        <span
                          className={`font-tag-mono text-tag-mono text-[10px] ${
                            day.isHighlighted ? 'text-on-surface font-bold' : 'text-on-surface-variant'
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                        <div className="flex flex-col items-center">
                          <span
                            className={`px-1.5 py-0.5 rounded font-data-metric-sm text-data-metric-sm font-semibold ${
                              isLoss
                                ? 'bg-tertiary-container/20 text-tertiary'
                                : day.pnl === 0
                                ? 'bg-surface-container-highest text-on-surface-variant'
                                : 'bg-secondary/15 text-secondary'
                            }`}
                          >
                            {day.pnlFormatted}
                          </span>
                          <span className="font-tag-mono text-tag-mono text-on-surface-variant text-[9px] mt-0.5">
                            {day.tradesCount} {day.tradesCount === 1 ? 'trade' : 'trades'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container font-tag-mono text-tag-mono border border-surface-container-highest/30">
                  <div className="flex items-center gap-space-md">
                    <span className="text-on-surface-variant">W46 Net Gain:</span>
                    <span className="text-secondary font-semibold">+$6,240.00</span>
                  </div>
                  <div className="flex items-center gap-space-md">
                    <span className="text-on-surface-variant">Discipline Score:</span>
                    <span className="text-primary font-semibold">96/100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 6 Cols: Active Execution Ledger Table */}
            <div className="xl:col-span-6 flex flex-col gap-space-md">
              <div className="p-space-lg rounded-xl bg-surface-container-low backdrop-blur-xl shadow-md border border-surface-container-highest/40 flex flex-col gap-space-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      receipt_long
                    </span>
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Active Execution Ledger
                    </span>
                  </div>

                  <div className="flex items-center gap-space-xs overflow-x-auto">
                    {['ALL', 'NQ', 'ES', 'EURUSD'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setLedgerFilter(f)}
                        className={`px-space-xs py-0.5 rounded font-tag-mono text-tag-mono transition-colors ${
                          ledgerFilter === f
                            ? 'bg-surface-container-highest text-on-surface font-semibold shadow-xs'
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="font-label-caps text-label-caps text-on-surface-variant uppercase border-b border-surface-container-highest">
                        <th className="py-space-xs px-space-xs">Asset/Side</th>
                        <th className="py-space-xs px-space-xs">Setup/Sess</th>
                        <th className="py-space-xs px-space-xs text-right">P&amp;L ($)</th>
                        <th className="py-space-xs px-space-xs text-right">R:R</th>
                        <th className="py-space-xs px-space-xs text-right">Behavior</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-highest/60 font-body-sm text-body-sm">
                      {trades.map((t) => {
                        const isWin = t.pnl >= 0;
                        return (
                          <tr key={t.id} className="hover:bg-surface-container/60 transition-colors">
                            <td className="py-space-sm px-space-xs">
                              <div className="flex items-center gap-space-xs">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isWin ? 'bg-secondary' : 'bg-tertiary'
                                  }`}
                                />
                                <span className="font-tag-mono text-tag-mono text-on-surface font-semibold">
                                  {t.symbol}
                                </span>
                                <span
                                  className={`px-1 rounded font-tag-mono text-[10px] ${
                                    t.side === 'LONG'
                                      ? 'bg-secondary/15 text-secondary'
                                      : 'bg-tertiary/15 text-tertiary'
                                  }`}
                                >
                                  {t.side}
                                </span>
                              </div>
                              <span className="font-tag-mono text-tag-mono text-on-surface-variant text-[10px] block mt-0.5">
                                {t.time} • {t.entryPrice.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-space-sm px-space-xs">
                              <span className="text-on-surface font-medium block">{t.strategy}</span>
                              <span className="font-tag-mono text-tag-mono text-on-surface-variant text-[10px]">
                                {t.session} Session
                              </span>
                            </td>
                            <td
                              className={`py-space-sm px-space-xs text-right font-data-metric-sm text-data-metric-sm font-semibold ${
                                isWin ? 'text-secondary' : 'text-tertiary'
                              }`}
                            >
                              {isWin ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`}
                            </td>
                            <td
                              className={`py-space-sm px-space-xs text-right font-tag-mono text-tag-mono ${
                                isWin ? 'text-secondary' : 'text-tertiary'
                              }`}
                            >
                              {t.rMultiple >= 0 ? `+${t.rMultiple.toFixed(1)}R` : `${t.rMultiple.toFixed(1)}R`}
                            </td>
                            <td className="py-space-sm px-space-xs text-right">
                              <span
                                className={`px-space-xs py-0.5 rounded-full font-tag-mono text-tag-mono font-medium ${
                                  t.executionQuality === 'Plan Respected' ||
                                  t.executionQuality === 'Clean Execution'
                                    ? 'bg-secondary/10 text-secondary'
                                    : 'bg-tertiary-container/15 text-tertiary'
                                }`}
                              >
                                {t.executionQuality}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-space-xs border-t border-surface-container-highest/60">
                  <span className="font-tag-mono text-tag-mono text-on-surface-variant">
                    Showing {trades.length} of 284 executions
                  </span>
                  <button
                    onClick={() => onNavigateView('analytics')}
                    className="font-tag-mono text-tag-mono text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>View Full Filtered Journal</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Compliance & Educational Banner */}
          <footer className="w-full mt-space-sm p-space-md rounded-xl bg-surface-container-lowest/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant border border-surface-container-highest/30">
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[18px] text-primary">verified_user</span>
              <p className="font-body-sm text-body-sm">
                <strong className="text-on-surface font-medium">Institutional Compliance:</strong> Educational
                trading journal platform. Does not provide financial advice, broker execution, or asset
                custody. Past performance is not indicative of future returns.
              </p>
            </div>
            <div className="flex items-center gap-space-md font-tag-mono text-tag-mono shrink-0">
              <span>SERVER: US-EAST-1</span>
              <span>LATENCY: 12ms</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary" /> FEED: SYNCHRONIZED
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
