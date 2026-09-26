import React, { useState, useMemo } from 'react';
import { MarketSector, TradeSide, SessionName, Trade } from '../../types/trade';

interface LogTradeViewProps {
  onSaveTrade: (trade: Trade) => void;
  onCancel: () => void;
}

export const LogTradeView: React.FC<LogTradeViewProps> = ({ onSaveTrade, onCancel }) => {
  const [sector, setSector] = useState<MarketSector>('Stocks');
  const [symbol, setSymbol] = useState<string>('NVDA');
  const [exchange, setExchange] = useState<string>('NASDAQ');
  const [side, setSide] = useState<TradeSide>('LONG');
  
  // Numerical values for real-time calculus
  const [entryPrice, setEntryPrice] = useState<number>(142.5);
  const [stopLoss, setStopLoss] = useState<number>(139.5);
  const [targetPrice, setTargetPrice] = useState<number>(150.9);
  const [exitPrice, setExitPrice] = useState<number>(150.9);
  const [positionSize, setPositionSize] = useState<string>('100 shares');
  const [sharesCount, setSharesCount] = useState<number>(100);
  const [leverage, setLeverage] = useState<string>('1x (Spot / Cash)');
  const [session, setSession] = useState<SessionName>('New York');
  const [strategy, setStrategy] = useState<string>('Liquidity Sweep Breakout');

  // Psychological & Cognitive Audit
  const [preEntryBias, setPreEntryBias] = useState<string>(
    'Waited for 15m liquidity sweep below 140 support, 200 EMA confluence.'
  );
  const [executionDiscipline, setExecutionDiscipline] = useState<string>(
    "Composed, didn't move stop loss."
  );
  const [postTradeReview, setPostTradeReview] = useState<string>(
    'Exit target hit cleanly. Patience paid off on entry.'
  );

  // Tags
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Followed Plan',
    'Clean Exit',
  ]);

  // Detected confluence
  const [isEditingConfluence, setIsEditingConfluence] = useState(false);
  const [confluenceText, setConfluenceText] = useState(
    '15-min Bullish Hammer at Support with high volume liquidity absorption.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Real-Time Trade Calculus computation
  const calculus = useMemo(() => {
    const isLong = side === 'LONG';
    const riskPerUnit = isLong
      ? Math.max(0.01, entryPrice - stopLoss)
      : Math.max(0.01, stopLoss - entryPrice);

    const gainPerUnit = isLong ? exitPrice - entryPrice : entryPrice - exitPrice;
    const targetGainPerUnit = isLong ? targetPrice - entryPrice : entryPrice - targetPrice;

    const totalRisk = riskPerUnit * sharesCount;
    const projectedPnl = gainPerUnit * sharesCount;
    const projectedPercent = entryPrice > 0 ? (gainPerUnit / entryPrice) * 100 : 0;
    const rMultiple = totalRisk > 0 ? projectedPnl / totalRisk : 0;
    const rrRatio = riskPerUnit > 0 ? targetGainPerUnit / riskPerUnit : 0;

    return {
      pnl: projectedPnl,
      pnlPercent: projectedPercent,
      rMultiple: rMultiple,
      rrRatio: rrRatio,
      riskTaken: totalRisk,
      riskPercent: 1.5, // 1.5% portfolio equity
    };
  }, [entryPrice, stopLoss, targetPrice, exitPrice, sharesCount, side]);

  const presetSymbols = [
    { sym: 'BTC/USDT', ex: 'BINANCE', sec: 'Crypto' as MarketSector },
    { sym: 'ETH/USDT', ex: 'BINANCE', sec: 'Crypto' as MarketSector },
    { sym: 'NVDA', ex: 'NASDAQ', sec: 'Stocks' as MarketSector },
    { sym: 'SPY', ex: 'NYSE', sec: 'Stocks' as MarketSector },
    { sym: 'EUR/USD', ex: 'FXCM', sec: 'Forex' as MarketSector },
    { sym: 'NQ', ex: 'CME', sec: 'Futures' as MarketSector },
  ];

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  };

  const handlePresetSelect = (item: (typeof presetSymbols)[0]) => {
    setSymbol(item.sym);
    setExchange(item.ex);
    setSector(item.sec);
    if (item.sec === 'Crypto') {
      setEntryPrice(67850);
      setStopLoss(67200);
      setTargetPrice(69500);
      setExitPrice(69500);
      setSharesCount(0.5);
      setPositionSize('0.5 BTC');
    } else if (item.sec === 'Forex') {
      setEntryPrice(1.085);
      setStopLoss(1.0825);
      setTargetPrice(1.091);
      setExitPrice(1.091);
      setSharesCount(100000);
      setPositionSize('1.0 Lot');
    } else if (item.sec === 'Futures') {
      setEntryPrice(20850);
      setStopLoss(20800);
      setTargetPrice(20980);
      setExitPrice(20980);
      setSharesCount(2);
      setPositionSize('2 Contracts');
    } else {
      setEntryPrice(142.5);
      setStopLoss(139.5);
      setTargetPrice(150.9);
      setExitPrice(150.9);
      setSharesCount(100);
      setPositionSize('100 shares');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newTrade: Trade = {
      id: `TR-${Date.now().toString().slice(-6)}`,
      symbol: symbol.toUpperCase(),
      exchange,
      sector,
      side,
      status: 'Closed',
      entryPrice,
      stopLoss,
      targetPrice,
      exitPrice,
      positionSize,
      shares: sharesCount,
      leverage,
      session,
      strategy,
      pnl: calculus.pnl,
      pnlPercent: calculus.pnlPercent,
      rMultiple: calculus.rMultiple,
      riskReward: `1 : ${calculus.rrRatio.toFixed(2)}`,
      riskTaken: calculus.riskTaken,
      riskPercent: calculus.riskPercent,
      date: 'Live Today · Just Now',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      preEntryBias,
      executionDiscipline,
      postTradeReview,
      tags: selectedTags,
      executionQuality: selectedTags.includes('Followed Plan')
        ? 'Plan Respected'
        : selectedTags.includes('Broke Rules')
        ? 'Broke Rules'
        : 'Clean Execution',
      detectedConfluence: confluenceText,
      screenshotUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAdbmMnPxIL5nFL0q-08KArbG3w0XW7egW5sMo26TlEh16ntbQ8GTw9fW3F6pHM8XU2bxvVYJUQTkY3wi27GbHR3j68zDc_6JCYB3PvDaq5NbM8PRrzNRzY5-tlAIbHl5MfX_C101FGwwWcrYTkDhECiCqKZPC8hRl8hGf_K0rQ-PXrIq5TD-pqKEIWaAeJFNsgSF4GiHfST9uPxkoM2dXEAMMOoD8GmN6YZeRCTqVrOCfG4yJnrokwmQ',
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessToast(true);
      setTimeout(() => {
        onSaveTrade(newTrade);
      }, 700);
    }, 800);
  };

  return (
    <div className="flex flex-col w-full pb-24 max-w-md mx-auto">
      {/* Toast */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-secondary text-on-secondary px-4 py-2 rounded-lg font-tag-mono text-tag-mono shadow-xl flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>Trade Saved to Journal Ledger!</span>
        </div>
      )}

      {/* Subtitle & Cognitive Intent */}
      <div className="flex items-center justify-between mb-4">
        <div className="min-w-0">
          <span className="font-tag-mono text-tag-mono uppercase tracking-wider text-primary">
            Execution Ledger
          </span>
          <h2 className="font-headline-md text-headline-md text-on-surface truncate font-semibold">
            Log New Execution &amp; Psychological Bias
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-body-sm font-body-sm">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span>Auto-Sync</span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Asset Selector & Market Segment Presets */}
        <section className="flex flex-col gap-3 mb-5">
          {/* Market Sector Toggle */}
          <div className="grid grid-cols-4 p-1 rounded-xl bg-surface-container-lowest gap-1 border border-surface-container-highest/30">
            {(['Crypto', 'Stocks', 'Forex', 'Futures'] as MarketSector[]).map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setSector(sec)}
                className={`py-1.5 text-center rounded-lg font-tag-mono text-tag-mono transition-all ${
                  sector === sec
                    ? 'bg-surface-container-highest text-on-surface shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>

          {/* Symbol Input Field */}
          <div className="relative flex items-center">
            <div className="absolute left-3 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </div>
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-full bg-surface-container-low text-on-surface font-headline-sm text-headline-sm pl-9 pr-24 py-2.5 rounded-xl uppercase tracking-wider focus:outline-none focus:bg-surface-container border border-surface-container-highest/30"
              placeholder="SYMBOL..."
            />
            <span className="absolute right-3 font-tag-mono text-tag-mono px-2 py-0.5 rounded bg-surface-container-high text-primary font-semibold">
              {exchange}
            </span>
          </div>

          {/* Quick Pill Presets */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-2 px-2">
            {presetSymbols.map((item) => {
              const isSelected = symbol === item.sym;
              return (
                <button
                  key={item.sym}
                  type="button"
                  onClick={() => handlePresetSelect(item)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full font-tag-mono text-tag-mono transition-all ${
                    isSelected
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  {item.sym}
                </button>
              );
            })}
          </div>

          {/* Direction Bias Toggle: LONG vs SHORT */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setSide('LONG')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-[0.98] ${
                side === 'LONG'
                  ? 'bg-secondary-container text-on-secondary-container shadow-md font-semibold'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
              <span className="font-headline-sm text-headline-sm uppercase tracking-wide">
                LONG / BUY
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSide('SHORT')}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl transition-all active:scale-[0.98] ${
                side === 'SHORT'
                  ? 'bg-error-container text-on-error-container shadow-md font-semibold'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">trending_down</span>
              <span className="font-headline-sm text-headline-sm uppercase tracking-wide">
                SHORT / SELL
              </span>
            </button>
          </div>
        </section>

        {/* Live Automated Calculus Summary Card (Glassmorphic) */}
        <section className="relative mb-5 p-4 rounded-xl bg-surface-container-low shadow-xl overflow-hidden border border-surface-container-highest/40">
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-secondary/10 blur-2xl pointer-events-none" />

          <div className="relative flex flex-col gap-3">
            {/* Calculus Card Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">calculate</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Real-Time Trade Calculus
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-tag-mono text-tag-mono font-bold">
                LIVE PREVIEW
              </span>
            </div>

            {/* Main Metric Projection & R-Multiple */}
            <div className="flex items-end justify-between py-1">
              <div>
                <span className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-0.5">
                  Projected P&amp;L
                </span>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`font-data-metric-lg text-data-metric-lg font-bold ${
                      calculus.pnl >= 0 ? 'text-secondary' : 'text-error'
                    }`}
                  >
                    {calculus.pnl >= 0
                      ? `+$${calculus.pnl.toFixed(2)}`
                      : `-$${Math.abs(calculus.pnl).toFixed(2)}`}
                  </span>
                  <span
                    className={`font-data-metric-sm text-data-metric-sm font-semibold ${
                      calculus.pnlPercent >= 0 ? 'text-secondary' : 'text-error'
                    }`}
                  >
                    ({calculus.pnlPercent >= 0 ? '+' : ''}
                    {calculus.pnlPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="block font-label-caps text-label-caps uppercase text-on-surface-variant mb-0.5">
                  R-Multiple
                </span>
                <span
                  className={`font-data-metric-lg text-data-metric-lg font-bold ${
                    calculus.rMultiple >= 0 ? 'text-primary' : 'text-error'
                  }`}
                >
                  {calculus.rMultiple >= 0
                    ? `+${calculus.rMultiple.toFixed(1)}R`
                    : `${calculus.rMultiple.toFixed(1)}R`}
                </span>
              </div>
            </div>

            {/* Calculus Secondary Parameters Grid */}
            <div className="grid grid-cols-2 gap-2 pt-2 bg-surface-container-lowest/60 p-2.5 rounded-lg border border-surface-container-highest/20">
              <div>
                <span className="block font-body-sm text-body-sm text-on-surface-variant">
                  Risk/Reward (R:R)
                </span>
                <span className="font-data-metric-md text-data-metric-md text-on-surface font-semibold">
                  1 : {Math.abs(calculus.rrRatio).toFixed(2)}
                </span>
              </div>
              <div>
                <span className="block font-body-sm text-body-sm text-on-surface-variant">
                  Risk Taken ($ / Eq)
                </span>
                <span className="font-data-metric-md text-data-metric-md text-tertiary font-medium">
                  ${calculus.riskTaken.toFixed(2)}{' '}
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    ({calculus.riskPercent.toFixed(2)}%)
                  </span>
                </span>
              </div>
            </div>

            {/* Automated Calculation Notification */}
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px] text-primary">info</span>
              <p className="font-body-sm text-body-sm leading-tight">
                Calculated automatically based on your entry, stop loss, and exit.
              </p>
            </div>
          </div>
        </section>

        {/* Numerical Execution Parameters Grid */}
        <section className="mb-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Numerical Parameters
            </h3>
            <span className="font-tag-mono text-tag-mono text-on-surface-variant uppercase">
              Status: Closed
            </span>
          </div>

          {/* Parameter Inputs Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Entry Price */}
            <div className="p-3 rounded-xl bg-surface-container border border-surface-container-highest/30">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">
                Entry Price
              </label>
              <div className="flex items-center">
                <span className="text-outline mr-1">$</span>
                <input
                  type="number"
                  step="any"
                  value={entryPrice}
                  onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-data-metric-md text-data-metric-md text-on-surface focus:outline-none"
                />
              </div>
            </div>

            {/* Stop Loss */}
            <div className="p-3 rounded-xl bg-surface-container border border-surface-container-highest/30">
              <label className="block font-label-caps text-label-caps text-error uppercase mb-1">
                Stop Loss (Risk)
              </label>
              <div className="flex items-center">
                <span className="text-error mr-1">$</span>
                <input
                  type="number"
                  step="any"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-data-metric-md text-data-metric-md text-tertiary focus:outline-none"
                />
              </div>
            </div>

            {/* Take Profit Target */}
            <div className="p-3 rounded-xl bg-surface-container border border-surface-container-highest/30">
              <label className="block font-label-caps text-label-caps text-secondary uppercase mb-1">
                Take Profit Target
              </label>
              <div className="flex items-center">
                <span className="text-secondary mr-1">$</span>
                <input
                  type="number"
                  step="any"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-data-metric-md text-data-metric-md text-secondary focus:outline-none"
                />
              </div>
            </div>

            {/* Actual Exit Price */}
            <div className="p-3 rounded-xl bg-surface-container border border-surface-container-highest/30">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">
                Actual Exit Price
              </label>
              <div className="flex items-center">
                <span className="text-outline mr-1">$</span>
                <input
                  type="number"
                  step="any"
                  value={exitPrice}
                  onChange={(e) => setExitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent font-data-metric-md text-data-metric-md text-on-surface focus:outline-none"
                />
              </div>
            </div>

            {/* Position Size */}
            <div className="p-3 rounded-xl bg-surface-container border border-surface-container-highest/30">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">
                Position Size
              </label>
              <input
                type="text"
                value={positionSize}
                onChange={(e) => {
                  setPositionSize(e.target.value);
                  const parsed = parseFloat(e.target.value);
                  if (!isNaN(parsed)) setSharesCount(parsed);
                }}
                className="w-full bg-transparent font-data-metric-md text-data-metric-md text-on-surface focus:outline-none"
              />
            </div>

            {/* Leverage */}
            <div className="p-3 rounded-xl bg-surface-container border border-surface-container-highest/30">
              <label className="block font-label-caps text-label-caps text-on-surface-variant uppercase mb-1">
                Leverage Type
              </label>
              <input
                type="text"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className="w-full bg-transparent font-data-metric-md text-data-metric-md text-on-surface focus:outline-none"
              />
            </div>
          </div>

          {/* Execution Session Horizontal Chips */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Market Session
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {(['Asian', 'London', 'New York', 'Overlap'] as SessionName[]).map((sess) => (
                <button
                  key={sess}
                  type="button"
                  onClick={() => setSession(sess)}
                  className={`py-1.5 text-center rounded-lg font-tag-mono text-tag-mono transition-all ${
                    session === sess
                      ? 'bg-primary-container text-on-primary-container shadow-sm font-semibold'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {sess}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Selection Dropdown Style Display */}
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
              Setup Strategy
            </span>
            <div className="relative">
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="w-full p-3 rounded-xl bg-surface-container text-on-surface font-body-md text-body-md font-medium border border-surface-container-highest/30 appearance-none focus:outline-none"
              >
                <option value="Liquidity Sweep Breakout">Liquidity Sweep Breakout</option>
                <option value="VWAP Breakout">VWAP Breakout</option>
                <option value="FVG Retest">Fair Value Gap (FVG) Retest</option>
                <option value="Break & Retest">Break &amp; Retest</option>
                <option value="Counter-Trend Fade">Counter-Trend Fade</option>
                <option value="Session Open Drive">Session Open Drive</option>
                <option value="Range Fade">Range Fade</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">
                <span className="material-symbols-outlined text-[18px]">unfold_more</span>
              </div>
            </div>
          </div>
        </section>

        {/* Behavioral & Psychological Journaling Sections */}
        <section className="mb-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Cognitive &amp; Emotional Audit
              </h3>
            </div>
            <span className="font-tag-mono text-tag-mono text-secondary font-bold">3/3 LOGGED</span>
          </div>

          {/* Before Trade */}
          <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1.5 border border-surface-container-highest/30">
            <div className="flex items-center justify-between">
              <label className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                1. Setup &amp; Pre-Entry Bias
              </label>
              <span className="font-tag-mono text-tag-mono text-on-surface-variant">BEFORE</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Why did I enter? What was my setup &amp; bias?
            </p>
            <textarea
              rows={2}
              value={preEntryBias}
              onChange={(e) => setPreEntryBias(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none resize-none border border-surface-container-highest/20"
            />
          </div>

          {/* During Trade */}
          <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1.5 border border-surface-container-highest/30">
            <div className="flex items-center justify-between">
              <label className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                2. Execution Discipline &amp; Emotion
              </label>
              <span className="font-tag-mono text-tag-mono text-on-surface-variant">DURING</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Did I follow my plan? Emotional state?
            </p>
            <textarea
              rows={2}
              value={executionDiscipline}
              onChange={(e) => setExecutionDiscipline(e.target.value)}
              className="w-full mt-1 p-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none resize-none border border-surface-container-highest/20"
            />
          </div>

          {/* After Trade */}
          <div className="p-3 rounded-xl bg-surface-container flex flex-col gap-1.5 border border-surface-container-highest/30">
            <div className="flex items-center justify-between">
              <label className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                3. Post-Trade Review &amp; Learning
              </label>
              <span className="font-tag-mono text-tag-mono text-on-surface-variant">AFTER</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              What went well? What would I adjust next time?
            </p>
            <textarea
              rows={2}
              value={postTradeReview}
              onChange={(e) => setPostTradeReview(e.target.value)}
              placeholder="e.g. Exit target hit cleanly. Patience paid off on entry..."
              className="w-full mt-1 p-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none resize-none border border-surface-container-highest/20"
            />
          </div>

          {/* Interactive Behavioral Tag Cloud */}
          <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-2.5 border border-surface-container-highest/30">
            <div className="flex items-center justify-between">
              <span className="font-label-caps text-label-caps uppercase text-on-surface-variant">
                Discipline &amp; Bias Tags
              </span>
              <span className="font-body-sm text-body-sm text-outline">Tap to toggle</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[
                { tag: 'Followed Plan', type: 'positive' },
                { tag: 'Clean Exit', type: 'positive' },
                { tag: 'FOMO', type: 'warning' },
                { tag: 'Revenge Trade', type: 'danger' },
                { tag: 'Overtrading', type: 'warning' },
                { tag: 'Broke Rules', type: 'danger' },
                { tag: 'Moved Stop Loss', type: 'warning' },
                { tag: 'Took Profit Early', type: 'warning' },
                { tag: 'Held Too Long', type: 'warning' },
              ].map(({ tag, type }) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-tag-mono text-tag-mono font-medium transition-all active:scale-95 ${
                      isSelected
                        ? type === 'positive'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : type === 'danger'
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-primary-container text-on-primary-container'
                        : 'bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span>{tag}</span>
                    {isSelected && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Chart Screenshot & AI Vision Module */}
        <section className="mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Chart Screenshot &amp; AI Vision
              </h3>
            </div>
            <span className="font-tag-mono text-tag-mono text-primary font-semibold">READY</span>
          </div>

          {/* Screenshot Preview Card */}
          <div className="relative overflow-hidden rounded-xl bg-surface-container border border-surface-container-highest/30">
            <div className="relative w-full h-40">
              <img
                className="w-full h-full object-cover opacity-85"
                alt="15M NVDA candlestick chart"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdbmMnPxIL5nFL0q-08KArbG3w0XW7egW5sMo26TlEh16ntbQ8GTw9fW3F6pHM8XU2bxvVYJUQTkY3wi27GbHR3j68zDc_6JCYB3PvDaq5NbM8PRrzNRzY5-tlAIbHl5MfX_C101FGwwWcrYTkDhECiCqKZPC8hRl8hGf_K0rQ-PXrIq5TD-pqKEIWaAeJFNsgSF4GiHfST9uPxkoM2dXEAMMOoD8GmN6YZeRCTqVrOCfG4yJnrokwmQ"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-transparent" />
              <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-dim/80 backdrop-blur-md text-on-surface font-tag-mono text-tag-mono border border-surface-container-highest/40">
                <span className="material-symbols-outlined text-[14px] text-secondary">verified</span>
                <span>15M {symbol}</span>
              </div>
              <button
                type="button"
                title="Camera Snap or Attach Chart"
                className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-surface-container-highest/90 text-on-surface hover:bg-surface-bright backdrop-blur-sm"
              >
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              </button>
            </div>

            {/* Detected Visual Confluence Banner */}
            <div className="p-3 bg-surface-container flex flex-col gap-1.5 border-t border-surface-container-highest/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[18px]">neurology</span>
                  <span className="font-tag-mono text-tag-mono uppercase text-primary font-semibold">
                    Detected Visual Confluence
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingConfluence(!isEditingConfluence)}
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface flex items-center gap-0.5"
                >
                  <span>{isEditingConfluence ? 'Done' : 'Edit'}</span>
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                </button>
              </div>

              {isEditingConfluence ? (
                <input
                  type="text"
                  value={confluenceText}
                  onChange={(e) => setConfluenceText(e.target.value)}
                  className="w-full p-2 rounded bg-surface-container-lowest text-on-surface font-body-sm text-body-sm border border-primary focus:outline-none"
                />
              ) : (
                <div className="p-2.5 rounded-lg bg-surface-container-lowest text-on-surface font-body-sm text-body-sm leading-relaxed border border-surface-container-highest/20">
                  AI detected:{' '}
                  <strong className="text-secondary font-medium">{confluenceText}</strong> (Verify or
                  edit manually).
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Big Action CTA Button */}
        <div className="w-full sticky bottom-4 z-20">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-headline-sm flex items-center justify-center gap-2.5 shadow-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined text-[22px] animate-spin">
                  progress_activity
                </span>
                <span>Auditing &amp; Saving Entry...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
                <span>Analyze &amp; Save to Trading Journal</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
