import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  X,
  Zap,
  Filter,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { MarketSignal, SignalType } from '../../types/trade';
import { useAuth } from '../../context/AuthContext';
import { requestFCMToken } from '../../lib/fcm';

interface AlertsHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSignalTrade?: (signal: MarketSignal) => void;
}

export const AlertsHistoryModal: React.FC<AlertsHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectSignalTrade,
}) => {
  const { user } = useAuth();
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'STRONG_BUY' | 'STRONG_SELL'>('ALL');
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [fcmMessage, setFcmMessage] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<MarketSignal | null>(null);

  const fetchSignals = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/signals/history');
      if (res.ok) {
        const data = await res.json();
        setSignals(data.signals || []);
      }
    } catch (e) {
      console.warn('Failed to load signals:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSignals();
    }
  }, [isOpen]);

  const handleRunManualScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/signals/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        await fetchSignals();
      }
    } catch (err: any) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleEnableNotifications = async () => {
    setFcmMessage('Requesting push notification permission...');
    const result = await requestFCMToken(user?.uid);
    setNotificationPermission(result.permission);
    if (result.permission === 'granted') {
      setFcmMessage('Push notifications enabled! You will receive verified STRONG BUY/SELL alerts.');
    } else {
      setFcmMessage(result.error || 'Notification permission was denied or not supported.');
    }
    setTimeout(() => setFcmMessage(null), 5000);
  };

  if (!isOpen) return null;

  const filteredSignals = signals.filter((s) => {
    if (activeFilter === 'STRONG_BUY') return s.signal === 'STRONG_BUY';
    if (activeFilter === 'STRONG_SELL') return s.signal === 'STRONG_SELL';
    return true;
  });

  const strongBuyCount = signals.filter((s) => s.signal === 'STRONG_BUY').length;
  const strongSellCount = signals.filter((s) => s.signal === 'STRONG_SELL').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-[#071322] border border-cyan-500/30 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-900/40 bg-[#050e18]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <BellRing className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-wide text-white">
                  Quantitative Signal Audit &amp; Alerts
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  5m Real-Market Scan
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Mathematical indicators (RSI, MACD, SMA) + Gemini institutional validation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunManualScan}
              disabled={isScanning}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
              title="Run 5m Watchlist Audit Now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isScanning ? 'Auditing...' : 'Scan Now'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Push Notification Banner */}
        <div className="px-5 py-2.5 bg-[#091b2e] border-b border-cyan-900/30 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Bell className="w-3.5 h-3.5 text-cyan-400" />
            <span>Browser Push Notifications:</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {notificationPermission}
            </span>
          </div>
          {notificationPermission !== 'granted' && (
            <button
              type="button"
              onClick={handleEnableNotifications}
              className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-semibold text-xs transition"
            >
              Enable Push Alerts
            </button>
          )}
        </div>

        {fcmMessage && (
          <div className="px-5 py-2 bg-cyan-950/80 text-cyan-300 text-xs border-b border-cyan-800/40 font-mono animate-in fade-in">
            {fcmMessage}
          </div>
        )}

        {/* Filter Pills & Stats */}
        <div className="px-5 py-3 border-b border-cyan-950 flex items-center justify-between flex-wrap gap-2 bg-[#06111d]">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                activeFilter === 'ALL'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-[#081829] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Records ({signals.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('STRONG_BUY')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                activeFilter === 'STRONG_BUY'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                  : 'bg-[#081829] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Strong Buy ({strongBuyCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('STRONG_SELL')}
              className={`px-2.5 py-1 rounded-lg border transition ${
                activeFilter === 'STRONG_SELL'
                  ? 'bg-rose-500/20 border-rose-400 text-rose-300 font-bold'
                  : 'bg-[#081829] border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Strong Sell ({strongSellCount})
            </button>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Backed by strict 1:2 R:R + 4H/1D Confluence
          </span>
        </div>

        {/* Signals List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {isLoading && signals.length === 0 && (
            <div className="p-12 text-center font-mono text-xs text-cyan-300 animate-pulse">
              Loading signal audit history from real Twelve Data feeds...
            </div>
          )}

          {!isLoading && filteredSignals.length === 0 && (
            <div className="p-10 text-center space-y-3 rounded-xl border border-dashed border-slate-800 bg-[#081524]/40">
              <ShieldCheck className="w-10 h-10 mx-auto text-cyan-400/60" />
              <p className="text-sm font-semibold text-slate-200">
                No Triggered Alerts Under Strict Quality Guardrails
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto font-sans leading-relaxed">
                Signals are emitted strictly when at least 3 independent factors agree (RSI, MACD, SMAs, Volume), 
                higher timeframe confirms, risk/reward is ≥ 1:2 with stop-loss, and confidence is ≥ 80%.
              </p>
              <button
                type="button"
                onClick={handleRunManualScan}
                disabled={isScanning}
                className="mt-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-black font-mono font-bold text-xs transition inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                Audit Current Watchlist Now
              </button>
            </div>
          )}

          {filteredSignals.map((sig) => {
            const isBuy = sig.signal.includes('BUY');
            const isStrong = sig.signal.startsWith('STRONG');
            const isSelected = selectedSignal?.id === sig.id;

            return (
              <div
                key={sig.id}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#091f38] border-cyan-400 ring-1 ring-cyan-400'
                    : 'bg-[#09192c] border-slate-800/80 hover:border-cyan-500/40'
                }`}
                onClick={() => setSelectedSignal(isSelected ? null : sig)}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 ${
                        isBuy
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {isBuy ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                      {sig.signal.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-white text-sm font-mono">{sig.asset}</span>
                    <span className="text-xs text-slate-300 font-mono">
                      @ ${sig.price.toLocaleString('en-US', { minimumFractionDigits: sig.price < 2 ? 4 : 2 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                      Confidence: {sig.confidence}%
                    </span>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(sig.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2 font-sans leading-relaxed">
                  {sig.interpretation}
                </p>

                {/* Level details drawer */}
                <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="bg-[#06111e] p-2 rounded border border-slate-800/60">
                    <span className="text-slate-500 block text-[9px] uppercase">Entry Zone</span>
                    <span className="text-white font-semibold">{sig.entry_zone}</span>
                  </div>
                  <div className="bg-[#06111e] p-2 rounded border border-slate-800/60">
                    <span className="text-slate-500 block text-[9px] uppercase">Stop Loss</span>
                    <span className="text-rose-400 font-semibold">{sig.stop_loss}</span>
                  </div>
                  <div className="bg-[#06111e] p-2 rounded border border-slate-800/60">
                    <span className="text-slate-500 block text-[9px] uppercase">Take Profit (≥1:2)</span>
                    <span className="text-emerald-400 font-semibold">{sig.take_profit}</span>
                  </div>
                  <div className="bg-[#06111e] p-2 rounded border border-slate-800/60">
                    <span className="text-slate-500 block text-[9px] uppercase">Market State</span>
                    <span className={`font-semibold ${sig.marketOpen ? 'text-emerald-300' : 'text-amber-400'}`}>
                      {sig.marketOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                </div>

                {/* Supporting Facts Pill List */}
                {sig.supporting_facts && sig.supporting_facts.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {sig.supporting_facts.map((fact, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/40"
                      >
                        ✓ {fact}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
