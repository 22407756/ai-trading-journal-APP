import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
  Target,
  Copy,
  Check,
  Zap,
  Lock,
  Coins,
  Sliders,
  RotateCcw,
  Search,
  Eye,
  Info,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionTier, PICTURE_PACKS } from '../../types/trade';
import { PayPalButtonComponent } from '../common/PayPalButtonComponent';

interface ChartVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubscription?: (tier?: SubscriptionTier, reason?: string) => void;
  onLogTradeFromAnalysis?: (tradeData: {
    symbol: string;
    side: 'Long' | 'Short';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    notes: string;
    screenshotUrl?: string;
  }) => void;
}

export interface LevelDetail {
  price: string;
  reasoning: string;
  confidence: number;
}

export interface StructuralPoint {
  label: string;
  price: string;
  type: string;
  reasoning: string;
  confidence: number;
}

export interface ChartAnnotation {
  type: string;
  label: string;
  reasoning: string;
  y_percent?: number;
  x_percent?: number;
  x_start_percent?: number;
  x_end_percent?: number;
  y_start_percent?: number;
  y_end_percent?: number;
  confidence?: number;
}

interface AnalysisResult {
  direction: 'UP' | 'DOWN';
  confidence: number;
  trend: string;
  summary: string;
  pattern: string;
  levelsError?: string;
  support: string;
  resistance: string;
  suggestedEntry: string;
  stopLoss: string;
  takeProfit: string;
  takeProfit2?: string;
  takeProfit3?: string;
  entryPriceNumeric?: number;
  stopLossNumeric?: number;
  takeProfitNumeric?: number;
  riskReward: string;
  keyFactors: string[];
  detailedAnalysis: string;
  detectedAsset: string;
  assetConfidence: number;
  assetSource: 'IMAGE_DETECTED' | 'MANUAL_OVERRIDE' | 'NOT_VISIBLE';
  detectedTimeframe: string;
  timeframeConfidence: number;
  timeframeSource: 'IMAGE_DETECTED' | 'MANUAL_OVERRIDE' | 'NOT_VISIBLE';
  effectiveSymbol?: string | null;
  effectiveTimeframe?: string;
  isLiveQuoted?: boolean;
  supportDetail?: LevelDetail;
  resistanceDetail?: LevelDetail;
  entryDetail?: LevelDetail;
  stopLossDetail?: LevelDetail;
  takeProfitDetail?: LevelDetail;
  structuralPoints?: StructuralPoint[];
  annotatedLevels?: StructuralPoint[];
  chartAnnotations?: ChartAnnotation[];
  modelUsed?: string;
  currency?: string;
  decimals?: number;
  sector?: string;
}

export const QUICK_ASSETS = [
  { symbol: 'BTC/USD', label: 'BTC', tf: '15m' },
  { symbol: 'ETH/USD', label: 'ETH', tf: '15m' },
  { symbol: 'SOL/USD', label: 'SOL', tf: '15m' },
  { symbol: 'EUR/USD', label: 'EUR/USD', tf: '1H' },
  { symbol: 'GBP/USD', label: 'GBP/USD', tf: '1H' },
  { symbol: 'USD/JPY', label: 'USD/JPY', tf: '1H' },
  { symbol: 'XAU/USD', label: 'Gold (XAU)', tf: '1H' },
  { symbol: 'SPY', label: 'SPY', tf: '1D' },
  { symbol: 'NVDA', label: 'NVDA', tf: '15m' },
  { symbol: 'AAPL', label: 'AAPL', tf: '15m' },
  { symbol: 'TSLA', label: 'TSLA', tf: '15m' },
];

export const ChartVisionModal: React.FC<ChartVisionModalProps> = ({
  isOpen,
  onClose,
  onOpenSubscription,
  onLogTradeFromAnalysis,
}) => {
  const {
    chartScansRemaining,
    totalScansAllowed,
    canScanChart,
    incrementChartScans,
  } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Core state: Clean initial empty state with NO fake demo charts
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [manualOverrideSymbol, setManualOverrideSymbol] = useState<string | null>(null);
  const [manualOverrideTimeframe, setManualOverrideTimeframe] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [accountBalance, setAccountBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1.0);

  // SVG Visual Annotation Overlay State
  const [hoveredAnnotation, setHoveredAnnotation] = useState<ChartAnnotation | null>(null);
  const [showAnnotationsOverlay, setShowAnnotationsOverlay] = useState<boolean>(true);

  // Interactive Live Price & Levels Fine-Tuning State
  const [customEntry, setCustomEntry] = useState<number>(0);
  const [customStopLoss, setCustomStopLoss] = useState<number>(0);
  const [customTakeProfit, setCustomTakeProfit] = useState<number>(0);
  const [activeDirection, setActiveDirection] = useState<'UP' | 'DOWN'>('UP');

  // Synchronize custom editable levels whenever analysis changes
  useEffect(() => {
    if (analysis) {
      const hasLivePrice = typeof analysis.entryPriceNumeric === 'number' && analysis.entryPriceNumeric > 0;
      const e = hasLivePrice ? analysis.entryPriceNumeric! : 0;
      const s = typeof analysis.stopLossNumeric === 'number' && analysis.stopLossNumeric > 0 ? analysis.stopLossNumeric : 0;
      const t = typeof analysis.takeProfitNumeric === 'number' && analysis.takeProfitNumeric > 0 ? analysis.takeProfitNumeric : 0;
      setCustomEntry(e);
      setCustomStopLoss(s);
      setCustomTakeProfit(t);
      setActiveDirection(analysis.direction === 'DOWN' ? 'DOWN' : 'UP');
    }
  }, [analysis]);

  // Support paste from clipboard anywhere while modal is open
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  // Process uploaded or pasted file: triggers analysis IMMEDIATELY without waiting for asset selection
  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please provide an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setError(null);
      setAnalysis(null);
      setManualOverrideSymbol(null);
      setManualOverrideTimeframe(null);
      // Trigger instant automatic analysis directly from the image
      analyzeImage(result, null, null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Optional manual override handler: user can click AFTER the automatic result
  const handleSelectQuickAsset = (item: (typeof QUICK_ASSETS)[0]) => {
    setManualOverrideSymbol(item.symbol);
    setManualOverrideTimeframe(item.tf);
    if (imagePreview) {
      analyzeImage(imagePreview, item.symbol, item.tf);
    }
  };

  const analyzeImage = async (
    dataUrl: string,
    overrideSym?: string | null,
    overrideTf?: string | null
  ) => {
    if (!canScanChart) {
      setError(`Picture Limit Reached: You have 0 picture scans remaining. Add +10 pictures for 5 € (55 MAD) to continue.`);
      if (onOpenSubscription) {
        onOpenSubscription('pack_10', `You have reached your picture analysis limit. Add +10 pictures for 5 € (55 MAD) to continue.`);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      let mimeType = 'image/png';
      let imageBase64 = dataUrl;
      if (match) {
        mimeType = match[1];
        imageBase64 = match[2];
      }

      const response = await fetch('/api/analyze-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType,
          manualOverrideSymbol: overrideSym || undefined,
          manualOverrideTimeframe: overrideTf || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze trade chart image');
      }

      setAnalysis(data);
      await incrementChartScans();
    } catch (err: any) {
      console.error('Chart vision analysis failed:', err);
      setError(err?.message || 'Error communicating with Chart Vision AI');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculus & Live R:R calculations from editable inputs
  const isUp = activeDirection === 'UP';
  const isDown = activeDirection === 'DOWN';
  const decimals = analysis?.decimals ?? (customEntry < 2 ? 4 : 2);
  const currencyPrefix = analysis?.currency ?? '$';

  // Live distances and validation
  const riskDistance = isUp ? customEntry - customStopLoss : customStopLoss - customEntry;
  const rewardDistance = isUp ? customTakeProfit - customEntry : customEntry - customTakeProfit;
  const isRiskValid = riskDistance > 0 && customStopLoss > 0;
  const isRewardValid = rewardDistance > 0 && customTakeProfit > 0;
  const liveRRRatio = isRiskValid && isRewardValid ? (rewardDistance / riskDistance).toFixed(2) : 'Invalid';
  const riskPctString = customEntry > 0 && isRiskValid ? ((riskDistance / customEntry) * 100).toFixed(2) : '0.00';
  const rewardPctString = customEntry > 0 && isRewardValid ? ((rewardDistance / customEntry) * 100).toFixed(2) : '0.00';

  const fmt = (val: number) => {
    return `${currencyPrefix}${val.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  // Direction Switcher
  const handleToggleDirection = () => {
    const nextDir = activeDirection === 'UP' ? 'DOWN' : 'UP';
    setActiveDirection(nextDir);
    const risk = Math.max(customEntry * 0.015, Math.abs(customEntry - customStopLoss));
    if (nextDir === 'UP') {
      const newSl = Number((customEntry - risk).toFixed(decimals));
      const newTp = Number((customEntry + risk * 2.5).toFixed(decimals));
      setCustomStopLoss(newSl);
      setCustomTakeProfit(newTp);
    } else {
      const newSl = Number((customEntry + risk).toFixed(decimals));
      const newTp = Number(Math.max(customEntry * 0.05, customEntry - risk * 2.5).toFixed(decimals));
      setCustomStopLoss(newSl);
      setCustomTakeProfit(newTp);
    }
  };

  // 1-Click Auto-Fix SL & TP
  const handleAutoFixLevels = () => {
    const riskRatio = customEntry < 2 ? 0.0035 : 0.015;
    if (isUp) {
      const newSl = Number((customEntry * (1 - riskRatio)).toFixed(decimals));
      const risk = customEntry - newSl;
      const newTp = Number((customEntry + risk * 2.5).toFixed(decimals));
      setCustomStopLoss(newSl);
      setCustomTakeProfit(newTp);
    } else {
      const newSl = Number((customEntry * (1 + riskRatio)).toFixed(decimals));
      const risk = newSl - customEntry;
      const newTp = Number(Math.max(customEntry * 0.05, customEntry - risk * 2.5).toFixed(decimals));
      setCustomStopLoss(newSl);
      setCustomTakeProfit(newTp);
    }
  };

  // 1-Click Set R:R Multiple
  const handleSetRRMultiple = (multiplier: number) => {
    const risk = Math.abs(isUp ? customEntry - customStopLoss : customStopLoss - customEntry);
    if (risk <= 0) return;
    if (isUp) {
      const newTp = Number((customEntry + risk * multiplier).toFixed(decimals));
      setCustomTakeProfit(newTp);
    } else {
      const newTp = Number(Math.max(customEntry * 0.05, customEntry - risk * multiplier).toFixed(decimals));
      setCustomTakeProfit(newTp);
    }
  };

  const handleCopyVerdict = () => {
    if (!analysis) return;
    const activeSym = analysis.effectiveSymbol || analysis.detectedAsset || 'Unknown Asset';
    const text = `🎯 [Chart Vision AI Verdict: ${activeDirection}]
Asset: ${activeSym} (${analysis.effectiveTimeframe || analysis.detectedTimeframe}) [${analysis.assetSource}]
Direction: ${activeDirection} (${analysis.confidence}% Confidence)
Entry: ${fmt(customEntry)}
Stop Loss: ${fmt(customStopLoss)} (${riskPctString}% Risk)
Target (TP1): ${fmt(customTakeProfit)} (${rewardPctString}% Gain)
Risk / Reward: 1:${liveRRRatio}

Pattern: ${analysis.pattern}
Summary: ${analysis.summary}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogTrade = () => {
    if (!analysis) return;
    const activeSym = analysis.effectiveSymbol || analysis.detectedAsset || 'CHART_TRADE';
    const side = isDown ? 'Short' : 'Long';
    if (onLogTradeFromAnalysis) {
      onLogTradeFromAnalysis({
        symbol: activeSym,
        side,
        entryPrice: customEntry,
        stopLoss: customStopLoss,
        takeProfit: customTakeProfit,
        notes: `[Chart Vision AI: ${activeDirection} @ ${analysis.confidence}% Confidence | ${analysis.assetSource}]\nPattern: ${analysis.pattern}\nEntry: ${fmt(customEntry)} | SL: ${fmt(customStopLoss)} | Target: ${fmt(customTakeProfit)} (1:${liveRRRatio} R:R)\n${analysis.summary}`,
        screenshotUrl: imagePreview || undefined,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[96vh] sm:max-h-[94vh] flex flex-col rounded-xl sm:rounded-2xl bg-[#07111c] border border-blue-500/25 shadow-2xl shadow-blue-950/80 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3.5 border-b border-blue-900/30 bg-[#050c14] gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-400 shrink-0">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-semibold tracking-wide text-white truncate">
                  AI Chart Vision
                </h2>
                <span className="hidden xs:inline-flex px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-wider rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 items-center gap-1 shrink-0">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                  Auto-Detects
                </span>
                {/* Picture scans quota badge */}
                <button
                  type="button"
                  onClick={() => onOpenSubscription?.('pack_10', `Add +10 picture analyses for 5 € (55 MAD)`)}
                  className={`px-2 py-0.5 text-[10px] font-mono rounded-full border flex items-center gap-1 font-medium transition shrink-0 ${
                    canScanChart
                      ? 'bg-slate-800 text-slate-300 border-slate-700 hover:border-cyan-500/50'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                  }`}
                >
                  <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400" />
                  <span>{chartScansRemaining} Pics</span>
                  <span className={canScanChart ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    ({canScanChart ? 'left' : '+10'})
                  </span>
                </button>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-sans mt-0.5 hidden sm:block truncate">
                Upload or paste any candlestick chart. The AI reads ticker, timeframe, and key levels directly from image.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Optional Manual Asset Override Bar */}
        <div className="px-3 sm:px-5 py-1.5 sm:py-2 bg-[#050e18] border-b border-blue-900/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs py-0.5 flex-nowrap w-full">
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 shrink-0 flex items-center gap-1 mr-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              Anchor:
            </span>
            {QUICK_ASSETS.map((item) => {
              const isSelected =
                manualOverrideSymbol?.toUpperCase() === item.symbol.toUpperCase() ||
                (!manualOverrideSymbol && analysis?.effectiveSymbol?.toUpperCase() === item.symbol.toUpperCase());

              return (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => handleSelectQuickAsset(item)}
                  className={`px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-mono transition shrink-0 border ${
                    isSelected
                      ? 'bg-purple-500/25 text-purple-300 border-purple-400 font-bold shadow-sm'
                      : 'bg-[#0b1726] hover:bg-[#122338] text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                  title="Click to override or anchor real quotes"
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <span className="text-[10px] font-mono text-slate-500 hidden md:inline shrink-0">
            Auto-detection active
          </span>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Left Column: Image Upload & Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Dropzone & Interactive Annotated Image Container */}
            {imagePreview ? (
              <div className="relative flex flex-col space-y-2">
                {/* Image Toolbar */}
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-cyan-300 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      Visual Chart Annotations
                    </span>
                    {analysis?.chartAnnotations && analysis.chartAnnotations.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                        {analysis.chartAnnotations.length} Plotted
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {analysis?.chartAnnotations && analysis.chartAnnotations.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAnnotationsOverlay(!showAnnotationsOverlay)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition border ${
                          showAnnotationsOverlay
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {showAnnotationsOverlay ? 'Hide Visual Lines' : 'Show Visual Lines'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#0b1726] border border-slate-800 hover:border-cyan-500/40 text-slate-400 hover:text-slate-200 transition"
                    >
                      Change Image
                    </button>
                  </div>
                </div>

                {/* Image + SVG Overlay Container */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`relative flex items-center justify-center p-2 rounded-xl border border-slate-800 bg-[#06101c] overflow-hidden ${
                    isDragOver ? 'border-cyan-400 bg-cyan-950/20' : ''
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div className="relative inline-block max-w-full rounded-lg overflow-hidden shadow-2xl bg-black">
                    <img
                      src={imagePreview}
                      alt="Trade Chart Preview"
                      className="max-h-[220px] sm:max-h-[340px] w-auto max-w-full block object-contain select-none mx-auto"
                    />

                    {/* SVG Canvas Overlay */}
                    {showAnnotationsOverlay &&
                      analysis?.chartAnnotations &&
                      analysis.chartAnnotations.length > 0 && (
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-auto"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodColor="#f43f5e" floodOpacity="0.9" />
                            </filter>
                            <filter id="glow-emerald" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodColor="#10b981" floodOpacity="0.9" />
                            </filter>
                            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                              <feDropShadow dx="0" dy="0" stdDeviation="0.6" floodColor="#06b6d4" floodOpacity="0.9" />
                            </filter>
                          </defs>

                          {analysis.chartAnnotations.map((ann, idx) => {
                            const isHovered = hoveredAnnotation === ann;
                            const type = (ann.type || '').toLowerCase();

                            // Color coding
                            let strokeColor = '#06b6d4'; // default cyan
                            let filterId = 'glow-cyan';
                            if (type.includes('resist') || type === 'lh' || type === 'll' || type === 'stop_loss') {
                              strokeColor = '#f43f5e'; // rose/red
                              filterId = 'glow-rose';
                            } else if (type.includes('support') || type === 'hh' || type === 'hl' || type === 'take_profit') {
                              strokeColor = '#10b981'; // emerald
                              filterId = 'glow-emerald';
                            } else if (type.includes('breakout') || type.includes('order')) {
                              strokeColor = '#c084fc'; // purple
                            } else if (type.includes('trend')) {
                              strokeColor = '#38bdf8'; // sky
                            }

                            // Case 1: Trendline (diagonal)
                            if (
                              ann.x_start_percent !== undefined &&
                              ann.y_start_percent !== undefined &&
                              ann.x_end_percent !== undefined &&
                              ann.y_end_percent !== undefined
                            ) {
                              return (
                                <g
                                  key={idx}
                                  className="cursor-pointer transition-opacity"
                                  onMouseEnter={() => setHoveredAnnotation(ann)}
                                  onMouseLeave={() => setHoveredAnnotation(null)}
                                  onClick={() => setHoveredAnnotation(ann)}
                                >
                                  {/* Wide invisible hit area */}
                                  <line
                                    x1={ann.x_start_percent}
                                    y1={ann.y_start_percent}
                                    x2={ann.x_end_percent}
                                    y2={ann.y_end_percent}
                                    stroke="transparent"
                                    strokeWidth="4"
                                  />
                                  <line
                                    x1={ann.x_start_percent}
                                    y1={ann.y_start_percent}
                                    x2={ann.x_end_percent}
                                    y2={ann.y_end_percent}
                                    stroke={strokeColor}
                                    strokeWidth={isHovered ? '1.4' : '0.8'}
                                    strokeDasharray="2,2"
                                    filter={isHovered ? `url(#${filterId})` : undefined}
                                  />
                                  <circle cx={ann.x_start_percent} cy={ann.y_start_percent} r={isHovered ? '1.8' : '1.2'} fill={strokeColor} />
                                  <circle cx={ann.x_end_percent} cy={ann.y_end_percent} r={isHovered ? '1.8' : '1.2'} fill={strokeColor} />
                                </g>
                              );
                            }

                            // Case 2: Point Marker (HH, HL, LH, LL, Order Block dot)
                            if (ann.x_percent !== undefined && ann.y_percent !== undefined) {
                              const cx = ann.x_percent;
                              const cy = ann.y_percent;
                              const labelText = ann.label || ann.type.toUpperCase();

                              return (
                                <g
                                  key={idx}
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredAnnotation(ann)}
                                  onMouseLeave={() => setHoveredAnnotation(null)}
                                  onClick={() => setHoveredAnnotation(ann)}
                                >
                                  <circle cx={cx} cy={cy} r="6" fill="transparent" />
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={isHovered ? '2.4' : '1.6'}
                                    fill={strokeColor}
                                    stroke="#ffffff"
                                    strokeWidth="0.5"
                                    filter={isHovered ? `url(#${filterId})` : undefined}
                                  />
                                  <rect
                                    x={cx - 6}
                                    y={cy - 6.5}
                                    width="12"
                                    height="3.8"
                                    rx="1"
                                    fill="#050e1a"
                                    stroke={strokeColor}
                                    strokeWidth="0.4"
                                  />
                                  <text
                                    x={cx}
                                    y={cy - 3.8}
                                    fill="#ffffff"
                                    fontSize="2.4"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                  >
                                    {labelText}
                                  </text>
                                </g>
                              );
                            }

                            // Case 3: Horizontal Price Level
                            if (ann.y_percent !== undefined) {
                              const y = ann.y_percent;
                              const x1 = ann.x_start_percent ?? 5;
                              const x2 = ann.x_end_percent ?? 95;
                              const labelText = ann.label || ann.type;

                              return (
                                <g
                                  key={idx}
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredAnnotation(ann)}
                                  onMouseLeave={() => setHoveredAnnotation(null)}
                                  onClick={() => setHoveredAnnotation(ann)}
                                >
                                  <line x1={x1} y1={y} x2={x2} y2={y} stroke="transparent" strokeWidth="4" />
                                  <line
                                    x1={x1}
                                    y1={y}
                                    x2={x2}
                                    y2={y}
                                    stroke={strokeColor}
                                    strokeWidth={isHovered ? '1.4' : '0.8'}
                                    strokeDasharray={type.includes('support') || type.includes('resist') ? 'none' : '2,2'}
                                    filter={isHovered ? `url(#${filterId})` : undefined}
                                  />
                                  <rect
                                    x={x2 - 16}
                                    y={y - 2.4}
                                    width="15"
                                    height="4.8"
                                    rx="1"
                                    fill="#050e1a"
                                    stroke={strokeColor}
                                    strokeWidth="0.4"
                                  />
                                  <text
                                    x={x2 - 8.5}
                                    y={y + 1.0}
                                    fill={strokeColor}
                                    fontSize="2.4"
                                    fontWeight="bold"
                                    textAnchor="middle"
                                  >
                                    {labelText}
                                  </text>
                                  {/* Info indicator circle */}
                                  <circle cx={x2 - 1.8} cy={y} r="0.9" fill={strokeColor} />
                                </g>
                              );
                            }

                            return null;
                          })}
                        </svg>
                      )}
                  </div>
                </div>

                {/* Floating Tooltip Box when user hovers or taps any plotted line/point */}
                {hoveredAnnotation ? (
                  <div className="p-3 rounded-xl bg-[#09182a] border border-cyan-500/50 text-xs font-mono shadow-2xl animate-in fade-in zoom-in-95 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-cyan-400" />
                        Plotted: {hoveredAnnotation.label || hoveredAnnotation.type.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {hoveredAnnotation.y_percent !== undefined
                          ? `Visual Position: ${hoveredAnnotation.y_percent.toFixed(1)}%`
                          : 'Chart Landmark'}
                      </span>
                    </div>
                    <p className="text-slate-200 text-xs font-sans leading-relaxed">
                      {hoveredAnnotation.reasoning}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 text-center font-mono">
                    💡 Hover or tap any plotted line or marker on the chart to read Gemini's visual reasoning
                  </p>
                )}
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative min-h-[260px] sm:min-h-[320px] flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed cursor-pointer transition overflow-hidden group ${
                  isDragOver
                    ? 'border-cyan-400 bg-cyan-950/20'
                    : 'border-slate-800 hover:border-cyan-500/60 bg-[#06101c]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="text-center space-y-3 p-6">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 group-hover:scale-110 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-200">
                      Drop candlestick chart screenshot here or click to browse
                    </p>
                    <p className="text-xs text-slate-400 font-sans">
                      Paste anytime with <span className="font-mono text-cyan-300 font-bold bg-slate-800/80 px-1.5 py-0.5 rounded">Ctrl+V</span> / <span className="font-mono text-cyan-300 font-bold bg-slate-800/80 px-1.5 py-0.5 rounded">Cmd+V</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2">
                      Supports PNG, JPG, WebP. Gemini automatically plots support, resistance, trendlines &amp; swing points onto the image with pixel coordinates.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-[#0e1d2e] hover:bg-[#14283f] border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold transition"
                  >
                    Select Chart Image
                  </button>
                </div>
              </div>
            )}

            {/* Paywall Banner if 0 Scans Remaining */}
            {!canScanChart && (
              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/60 via-slate-900 to-[#07111c] border border-cyan-500/50 text-cyan-200 text-xs space-y-3 shadow-xl animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-cyan-300">
                  <div className="p-1 rounded bg-cyan-500/20">
                    <Lock className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-sm">Picture Analyses Limit Reached (0 Left)</span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  To analyze this candlestick screenshot and receive UP/DOWN institutional predictions, recharge with the official PayPal payment button below:
                </p>

                {/* Official PayPal JS SDK Button */}
                <div className="pt-1">
                  <PayPalButtonComponent
                    pack={PICTURE_PACKS[0]}
                    customTitle="Pay As You Go: 5€ for 10 Pictures"
                    buttonLabel="pay"
                    onSuccess={() => {
                      // Once payment is captured & COMPLETED by backend, re-trigger analysis
                      if (imagePreview) {
                        analyzeImage(imagePreview, manualOverrideSymbol, manualOverrideTimeframe);
                      }
                    }}
                  />
                </div>

                {onOpenSubscription && (
                  <button
                    type="button"
                    onClick={() => onOpenSubscription('pack_10', `Add +10 pictures for 5 € (55 MAD) to continue.`)}
                    className="w-full py-1.5 px-3 rounded-lg bg-black/40 hover:bg-black/60 text-slate-400 hover:text-slate-200 font-mono text-[11px] flex items-center justify-center gap-1.5 border border-slate-800 transition"
                  >
                    <span>Voir tous les packs photos (30 ou 100 scans) via PayPal &amp; Carte →</span>
                  </button>
                )}
              </div>
            )}

            {/* Re-analyze Button */}
            {imagePreview && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    if (imagePreview) {
                      analyzeImage(imagePreview, manualOverrideSymbol, manualOverrideTimeframe);
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl font-medium text-sm transition transform active:scale-95 flex items-center justify-center gap-2 font-bold shadow-lg text-black bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>Inspecting Candlestick Patterns...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-black" />
                      <span>Re-Analyze Image</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Browse another image"
                  className="p-2.5 rounded-xl bg-[#0b1726] border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Up/Down Prediction & Institutional Analysis (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            {/* Empty state prompt before any image is uploaded */}
            {!imagePreview && !isLoading && !analysis && (
              <div className="flex-1 p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4 rounded-xl border border-dashed border-slate-800 bg-[#06101c]">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400">
                  <Eye className="w-8 h-8" />
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="text-base font-semibold text-white font-mono">
                    Awaiting Chart Image Upload
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    Drop a trade screenshot on the left or paste directly from your clipboard (<span className="text-cyan-300 font-mono">Ctrl+V</span>).
                  </p>
                  <div className="p-3 rounded-xl bg-[#081525] border border-cyan-500/20 text-[11px] text-slate-300 font-mono text-left space-y-1 mt-3">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Fully Automatic Vision:</span>
                    </div>
                    <p className="text-slate-400 font-sans">
                      • Ticker &amp; Timeframe auto-detected from visible chart text
                    </p>
                    <p className="text-slate-400 font-sans">
                      • Candlestick patterns &amp; support/resistance mapped automatically
                    </p>
                    <p className="text-slate-400 font-sans">
                      • Strict 1:2.0+ Risk/Reward calculation with verified stops
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="flex-1 p-12 flex flex-col items-center justify-center text-center space-y-4 rounded-xl border border-dashed border-cyan-500/30 bg-[#06121f]">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
                <div>
                  <p className="text-base font-semibold text-white font-mono">
                    Deep Vision Neural Engine Inspecting Price Action...
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Reading ticker symbol, timeframe, candlestick patterns, support/resistance, and directional momentum directly from image.
                  </p>
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start gap-3 text-red-300 text-xs">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-200">Vision Analysis Error</p>
                  <p className="text-red-300/80 mt-1">{error}</p>
                  <button
                    type="button"
                    onClick={() => imagePreview && analyzeImage(imagePreview, manualOverrideSymbol, manualOverrideTimeframe)}
                    className="mt-2 px-3 py-1 rounded bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 text-white font-mono text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Retry Analysis
                  </button>
                </div>
              </div>
            )}

            {analysis && !isLoading && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {/* DETECTION PROVENANCE BAR: Clearly labels Detected from Image vs Manual Override */}
                <div className="p-3 rounded-xl bg-[#050e1a] border border-blue-900/40 flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Asset Detection Badge */}
                    {analysis.assetSource === 'IMAGE_DETECTED' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold flex items-center gap-1.5 shadow-sm">
                        <Search className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Asset: {analysis.detectedAsset}</span>
                        <span className="text-[10px] text-emerald-400/80 font-normal">
                          ({analysis.assetConfidence}% cert.)
                        </span>
                      </span>
                    ) : analysis.assetSource === 'MANUAL_OVERRIDE' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 font-semibold flex items-center gap-1.5 shadow-sm">
                        <Sliders className="w-3.5 h-3.5 text-purple-400" />
                        <span>Manual Override: {analysis.effectiveSymbol}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Asset: Not visible in image</span>
                      </span>
                    )}

                    {/* Timeframe Detection Badge */}
                    {analysis.timeframeSource === 'IMAGE_DETECTED' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-1.5">
                        <span>TF: {analysis.detectedTimeframe}</span>
                        <span className="text-[10px] text-cyan-400/80 font-normal">
                          ({analysis.timeframeConfidence}% cert.)
                        </span>
                      </span>
                    ) : analysis.timeframeSource === 'MANUAL_OVERRIDE' ? (
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-300 font-medium flex items-center gap-1">
                        <span>TF Override: {analysis.effectiveTimeframe}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1">
                        <span>TF: Not visible</span>
                      </span>
                    )}

                    {/* Live Quote Status Badge */}
                    {analysis.isLiveQuoted ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Twelve Data Live Quote</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 border border-slate-700 text-slate-400 flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-400" />
                        <span>Chart Axis Price Scale</span>
                      </span>
                    )}
                  </div>

                  {/* Clear override button if override was applied */}
                  {analysis.assetSource === 'MANUAL_OVERRIDE' && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualOverrideSymbol(null);
                        setManualOverrideTimeframe(null);
                        if (imagePreview) analyzeImage(imagePreview, null, null);
                      }}
                      className="text-[10px] text-slate-400 hover:text-white underline font-mono"
                    >
                      Reset to Auto-Detection
                    </button>
                  )}
                </div>

                {/* If Asset Not Visible, show helpful calibration note */}
                {analysis.assetSource === 'NOT_VISIBLE' && (
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Asset symbol was not visible in the image. You can click an <strong>Asset Anchor</strong> above to bind live Twelve Data quotes.
                      </span>
                    </div>
                  </div>
                )}

                {/* HERO DIRECTION BANNER: UP or DOWN + Direction Switcher */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border shadow-xl flex items-center justify-between gap-4 transition-all ${
                    isUp
                      ? 'bg-gradient-to-r from-emerald-950/70 via-[#062418] to-[#041a12] border-emerald-500/50 shadow-emerald-950/50'
                      : 'bg-gradient-to-r from-rose-950/70 via-[#270911] to-[#1d070c] border-rose-500/50 shadow-rose-950/50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      type="button"
                      onClick={handleToggleDirection}
                      title="Click to Switch Direction (UP / DOWN)"
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                        isUp
                          ? 'bg-emerald-500 text-black shadow-emerald-500/30'
                          : 'bg-rose-500 text-white shadow-rose-500/30'
                      }`}
                    >
                      {isUp ? (
                        <ArrowUpRight className="w-8 h-8 stroke-[3]" />
                      ) : (
                        <ArrowDownRight className="w-8 h-8 stroke-[3]" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                          Direction Verdict:
                        </span>
                        <button
                          type="button"
                          onClick={handleToggleDirection}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase transition flex items-center gap-1 ${
                            isUp
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                          }`}
                        >
                          <span>{activeDirection} ({isUp ? 'LONG' : 'SHORT'})</span>
                          <span className="text-[9px] text-slate-400 underline font-normal">(Click to switch)</span>
                        </button>
                      </div>
                      <h3
                        className={`text-2xl sm:text-3xl font-black tracking-tight font-headline flex items-center gap-2 mt-0.5 ${
                          isUp ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isUp ? 'PRICE POISED: UP ↗' : 'PRICE POISED: DOWN ↘'}
                      </h3>
                      <p className="text-xs text-slate-300 font-sans mt-0.5 max-w-md line-clamp-2">
                        {analysis.summary}
                      </p>
                    </div>
                  </div>

                  {/* Confidence Badge */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      AI Confidence
                    </span>
                    <div className="text-2xl font-black font-mono text-white">
                      {analysis.confidence}%
                    </div>
                    <div className="w-20 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        style={{ width: `${Math.min(100, analysis.confidence)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mathematical Invalidation & Direction Warning Banner */}
                {(!isRiskValid || !isRewardValid) && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3 animate-pulse">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        {!isRiskValid
                          ? isUp
                            ? 'Invalid Stop Loss: For a LONG trade, Stop Loss must be BELOW Entry.'
                            : 'Invalid Stop Loss: For a SHORT trade, Stop Loss must be ABOVE Entry.'
                          : 'Invalid Take Profit: Take Profit is on the losing side of Entry.'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoFixLevels}
                      className="px-2.5 py-1 rounded bg-amber-500 text-black font-mono font-bold text-[11px] shrink-0 hover:bg-amber-400 transition"
                    >
                      Auto-Correct Levels
                    </button>
                  </div>
                )}

                {/* Key Execution Levels: Interactive Editable Cards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-300 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                      Key Trade Levels (Directly Editable)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400">R:R Presets:</span>
                      {[2.0, 2.5, 3.0].map((ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => handleSetRRMultiple(ratio)}
                          className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#09182a] hover:bg-cyan-950/50 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition"
                        >
                          1:{ratio}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleAutoFixLevels}
                        title="Reset to recommended levels"
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#09182a] text-slate-400 border border-slate-800 hover:text-white transition flex items-center gap-0.5"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {(analysis.levelsError || analysis.stopLoss === 'Cannot calculate levels: live price unavailable') && (
                    <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{analysis.levelsError || 'Cannot calculate levels: live price unavailable. Please input live entry price or trade levels manually below.'}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    {/* Entry Price Input Card */}
                    <div className="p-3 rounded-xl bg-[#091524] border border-blue-900/40 flex flex-col justify-between">
                      <div>
                        <span className="text-slate-400 uppercase text-[10px] block font-semibold">Entry Price</span>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-slate-400 text-sm font-bold">{currencyPrefix}</span>
                          <input
                            type="number"
                            step="any"
                            value={customEntry || ''}
                            onChange={(e) => setCustomEntry(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#050e18] border border-slate-700 focus:border-cyan-400 rounded px-1.5 py-0.5 text-white font-bold text-sm focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">Order Execution Base</span>
                      </div>

                      {/* Attached Reasoning for Entry */}
                      {analysis.entryDetail?.reasoning && (
                        <div className="mt-2 pt-1.5 border-t border-blue-900/30 text-[10px]">
                          <div className="flex items-center justify-between mb-0.5 text-[9px] font-mono">
                            <span className="text-slate-400">Why this entry:</span>
                            <span
                              className={`px-1 py-0.2 rounded font-bold ${
                                (analysis.entryDetail.confidence ?? 85) >= 80
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-amber-400 bg-amber-500/10'
                              }`}
                            >
                              {analysis.entryDetail.confidence}% Conf.
                            </span>
                          </div>
                          <p className="text-slate-300 font-sans leading-tight italic">
                            "{analysis.entryDetail.reasoning}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Stop Loss Input Card */}
                    <div className={`p-3 rounded-xl border flex flex-col justify-between ${!isRiskValid ? 'bg-rose-950/40 border-rose-500' : 'bg-[#091524] border-rose-900/40 bg-rose-950/10'}`}>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-rose-400 uppercase text-[10px] font-semibold">Stop Loss (SL)</span>
                          <span className="text-[9px] text-rose-400 font-bold">
                            {isRiskValid ? `-${riskPctString}%` : 'Invalid'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-slate-400 text-sm font-bold">{currencyPrefix}</span>
                          <input
                            type="number"
                            step="any"
                            value={customStopLoss || ''}
                            onChange={(e) => setCustomStopLoss(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#050e18] border border-rose-800/60 focus:border-rose-400 rounded px-1.5 py-0.5 text-rose-300 font-bold text-sm focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {isRiskValid ? `${riskDistance.toFixed(decimals)} pts risk` : 'Must be invalidation side'}
                        </span>
                      </div>

                      {/* Attached Reasoning for Stop Loss */}
                      {analysis.stopLossDetail?.reasoning && (
                        <div className="mt-2 pt-1.5 border-t border-rose-900/30 text-[10px]">
                          <div className="flex items-center justify-between mb-0.5 text-[9px] font-mono">
                            <span className="text-rose-400">Why this stop:</span>
                            <span
                              className={`px-1 py-0.2 rounded font-bold ${
                                (analysis.stopLossDetail.confidence ?? 85) >= 80
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-amber-400 bg-amber-500/10'
                              }`}
                            >
                              {analysis.stopLossDetail.confidence}% Conf.
                            </span>
                          </div>
                          <p className="text-slate-300 font-sans leading-tight italic">
                            "{analysis.stopLossDetail.reasoning}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Target 1 (TP1) Input Card */}
                    <div className={`p-3 rounded-xl border flex flex-col justify-between ${!isRewardValid ? 'bg-rose-950/40 border-rose-500' : 'bg-[#091524] border-emerald-900/40 bg-emerald-950/10'}`}>
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 uppercase text-[10px] font-semibold">Target (TP1)</span>
                          <span className="text-[9px] text-emerald-400 font-bold">
                            {isRewardValid ? `+${rewardPctString}%` : 'Invalid'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-slate-400 text-sm font-bold">{currencyPrefix}</span>
                          <input
                            type="number"
                            step="any"
                            value={customTakeProfit || ''}
                            onChange={(e) => setCustomTakeProfit(parseFloat(e.target.value) || 0)}
                            className="w-full bg-[#050e18] border border-emerald-800/60 focus:border-emerald-400 rounded px-1.5 py-0.5 text-emerald-300 font-bold text-sm focus:outline-none"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {isRewardValid ? `+${rewardDistance.toFixed(decimals)} pts gain` : 'Target floor'}
                        </span>
                      </div>

                      {/* Attached Reasoning for Take Profit */}
                      {analysis.takeProfitDetail?.reasoning && (
                        <div className="mt-2 pt-1.5 border-t border-emerald-900/30 text-[10px]">
                          <div className="flex items-center justify-between mb-0.5 text-[9px] font-mono">
                            <span className="text-emerald-400">Why this target:</span>
                            <span
                              className={`px-1 py-0.2 rounded font-bold ${
                                (analysis.takeProfitDetail.confidence ?? 85) >= 80
                                  ? 'text-emerald-400 bg-emerald-500/10'
                                  : 'text-amber-400 bg-amber-500/10'
                              }`}
                            >
                              {analysis.takeProfitDetail.confidence}% Conf.
                            </span>
                          </div>
                          <p className="text-slate-300 font-sans leading-tight italic">
                            "{analysis.takeProfitDetail.reasoning}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Live R:R Card */}
                    <div className="p-3 rounded-xl bg-[#091524] border border-cyan-900/40 flex flex-col justify-between">
                      <div>
                        <span className="text-cyan-400 uppercase text-[10px] font-semibold">Live Risk / Reward</span>
                        <div className="text-lg font-bold text-cyan-300 mt-1">
                          {isRiskValid && isRewardValid ? `1:${liveRRRatio}` : 'Fix SL/TP'}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {isRiskValid && isRewardValid && parseFloat(liveRRRatio) >= 2.0
                            ? '✓ Institutional Standard'
                            : 'Minimum 1:2.0 recommended'}
                        </span>
                      </div>

                      <div className="mt-2 pt-1.5 border-t border-cyan-900/30 text-[10px]">
                        <div className="flex items-center justify-between mb-0.5 text-[9px] font-mono">
                          <span className="text-cyan-400">Sizing Rule:</span>
                          <span className="text-cyan-300 font-bold">Asymmetric R:R</span>
                        </div>
                        <p className="text-slate-300 font-sans leading-tight italic">
                          Reward strictly exceeds risk to guarantee positive mathematical expectancy.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-Target Take-Profit Expansion Drawer */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-[#071322] border border-slate-800 flex flex-col">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      TP1 (Conservative)
                    </span>
                    <span className="text-emerald-300 font-bold text-xs mt-0.5">{fmt(customTakeProfit)}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Scale out 50% &amp; move SL to BE</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#071322] border border-slate-800 flex flex-col">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      TP2 (Primary Target)
                    </span>
                    <span className="text-cyan-300 font-bold text-xs mt-0.5">
                      {fmt(Number((isUp ? customEntry + rewardDistance * 1.4 : customEntry - rewardDistance * 1.4).toFixed(decimals)))}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Primary liquidity target</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#071322] border border-slate-800 flex flex-col">
                    <span className="text-slate-400 text-[10px] uppercase font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      TP3 (Extended Runner)
                    </span>
                    <span className="text-purple-300 font-bold text-xs mt-0.5">
                      {fmt(Number((isUp ? customEntry + rewardDistance * 2.0 : Math.max(customEntry * 0.01, customEntry - rewardDistance * 2.0)).toFixed(decimals)))}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">Leave runner for expansion</span>
                  </div>
                </div>

                {/* Interactive Position Sizing & Capital Risk Calculus */}
                <div className="p-3.5 rounded-xl bg-[#071424] border border-cyan-500/25 space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Position Size &amp; Capital Risk Calculator
                    </span>
                    <span className="text-[10px] text-slate-400">Institutional Guardrail</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-1">ACCOUNT BALANCE ($)</span>
                      <div className="flex items-center gap-1">
                        {[2000, 5000, 10000, 25000].map((bal) => (
                          <button
                            key={bal}
                            type="button"
                            onClick={() => setAccountBalance(bal)}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              accountBalance === bal
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold'
                                : 'bg-[#09182a] text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            ${bal >= 1000 ? `${bal / 1000}k` : bal}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] block mb-1">RISK PER EXECUTION</span>
                      <div className="flex items-center gap-1">
                        {[0.5, 1.0, 1.5, 2.0].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setRiskPercent(pct)}
                            className={`px-2 py-0.5 rounded text-[10px] border transition ${
                              riskPercent === pct
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 font-bold'
                                : 'bg-[#09182a] text-slate-400 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const validRiskDist = Math.max(0.0001, Math.abs(customEntry - customStopLoss));
                    const validRewardDist = Math.max(0.0001, Math.abs(customTakeProfit - customEntry));
                    const maxRiskDollars = accountBalance * (riskPercent / 100);
                    const units = maxRiskDollars / validRiskDist;
                    const expectedProfitTP1 = units * validRewardDist;

                    return (
                      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#050e1a] border border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-slate-500 text-[9px] uppercase block">Risk Budget</span>
                          <span className="text-rose-400 font-bold">-${maxRiskDollars.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] uppercase block">Projected Win (TP1)</span>
                          <span className="text-emerald-400 font-bold">+${expectedProfitTP1.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[9px] uppercase block">Max Sizing</span>
                          <span className="text-cyan-300 font-bold">{units >= 10 ? Math.round(units) : units.toFixed(2)} units</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* ANNOTATED CHART LEVELS & VISUAL EVIDENCE */}
                <div className="p-4 rounded-xl bg-[#071322] border border-cyan-500/25 space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Annotated Chart Levels &amp; Visual Evidence
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Reasoning attached to every marked level &amp; point
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {(analysis.annotatedLevels && analysis.annotatedLevels.length > 0
                      ? analysis.annotatedLevels
                      : [
                          {
                            label: 'Key Resistance',
                            price: analysis.resistance,
                            type: 'resistance',
                            reasoning:
                              analysis.resistanceDetail?.reasoning ||
                              'Ceiling formed by upper candle wicks rejecting higher price discovery.',
                            confidence: analysis.resistanceDetail?.confidence ?? 88,
                          },
                          {
                            label: 'Suggested Entry',
                            price: analysis.suggestedEntry,
                            type: 'entry',
                            reasoning:
                              analysis.entryDetail?.reasoning ||
                              'Current structural price level offering favorable order execution.',
                            confidence: analysis.entryDetail?.confidence ?? 85,
                          },
                          {
                            label: 'Primary Support',
                            price: analysis.support,
                            type: 'support',
                            reasoning:
                              analysis.supportDetail?.reasoning ||
                              'Floor established where buying volume absorbed prior downside impulse.',
                            confidence: analysis.supportDetail?.confidence ?? 85,
                          },
                          {
                            label: isUp ? 'Invalidation Stop Loss (SL)' : 'Invalidation Stop Loss (SL)',
                            price: analysis.stopLoss,
                            type: 'stop_loss',
                            reasoning:
                              analysis.stopLossDetail?.reasoning ||
                              'Structural invalidation boundary safeguarding against liquidity sweeps.',
                            confidence: analysis.stopLossDetail?.confidence ?? 90,
                          },
                          {
                            label: 'Primary Target (TP1)',
                            price: analysis.takeProfit,
                            type: 'take_profit',
                            reasoning:
                              analysis.takeProfitDetail?.reasoning ||
                              'Target positioned directly into the nearest resting liquidity pool.',
                            confidence: analysis.takeProfitDetail?.confidence ?? 85,
                          },
                          ...(analysis.structuralPoints || []),
                        ]
                    ).map((lvl, idx) => {
                      const isHighConf = lvl.confidence >= 80;
                      const isLowConf = lvl.confidence < 75;

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-[#050e18] border border-slate-800/90 hover:border-cyan-500/40 transition space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  lvl.type === 'resistance'
                                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                    : lvl.type === 'support'
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : lvl.type === 'stop_loss'
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : lvl.type === 'take_profit'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                }`}
                              >
                                {lvl.label}
                              </span>
                              {lvl.price && (
                                <span className="text-white font-bold text-xs bg-slate-800/80 px-2 py-0.5 rounded">
                                  {lvl.price}
                                </span>
                              )}
                            </div>

                            {/* Level-specific Confidence Pill */}
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-bold ${
                                isHighConf
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                  : isLowConf
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 animate-pulse'
                                  : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                              }`}
                            >
                              {isHighConf ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              ) : isLowConf ? (
                                <AlertCircle className="w-3 h-3 text-amber-400" />
                              ) : (
                                <Info className="w-3 h-3 text-cyan-400" />
                              )}
                              <span>
                                {isLowConf
                                  ? `${lvl.confidence}% Lower Confidence (Unconfirmed in image)`
                                  : `${lvl.confidence}% Confidence`}
                              </span>
                            </span>
                          </div>

                          {/* Full Written Reason Right Next to Level */}
                          <div className="pt-1 text-slate-200 text-xs font-sans leading-relaxed">
                            <span className="font-semibold text-slate-400 font-mono text-[11px] mr-1.5">
                              Why this exact point:
                            </span>
                            {lvl.reasoning}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Identified Pattern & Confluence Factors */}
                <div className="p-4 rounded-xl bg-[#081320] border border-blue-900/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      <Target className="w-3.5 h-3.5 text-cyan-400" />
                      Pattern: {analysis.pattern}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      S: {analysis.support} | R: {analysis.resistance}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    {analysis.keyFactors?.map((factor, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>

                  {analysis.detailedAnalysis && (
                    <div className="pt-2 border-t border-blue-900/30 text-xs text-slate-400 font-sans leading-relaxed">
                      {analysis.detailedAnalysis}
                    </div>
                  )}
                </div>

                {/* Actions Bar: Log Trade + Copy */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleLogTrade}
                    disabled={!isRiskValid}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isUp
                        ? 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-emerald-500/20'
                        : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                    }`}
                  >
                    <span>Log Trade as {isUp ? 'LONG (UP)' : 'SHORT (DOWN)'} in Journal</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyVerdict}
                    className="px-4 py-2.5 rounded-xl bg-[#0b1726] border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
