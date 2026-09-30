import React, { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Loader2,
  X,
  FileText,
  AlertCircle,
  Clock,
  ShieldCheck,
  Crown,
  Copy,
  Check,
  RefreshCw,
  Share2,
  Radio,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SubscriptionTier } from '../../types/trade';

interface MarketIntelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSubscription?: (tier?: SubscriptionTier, reason?: string) => void;
}

interface WebSource {
  title?: string;
  uri: string;
}

const SEARCH_PRESETS = [
  'US Federal Reserve latest interest rate expectations and CPI inflation data',
  'NVIDIA Q3 revenue outlook, Blackwell GPU shipments, and institutional order books',
  'Bitcoin spot ETF net institutional capital flows and crypto market sentiment',
  'Crude oil OPEC+ production quotas and Middle East geopolitical supply risk',
  'EUR/USD & US Dollar Index (DXY) macroeconomic interest rate differentials',
  'Gold (XAU/USD) safe-haven demand & global central bank reserves',
];

export const MarketIntelModal: React.FC<MarketIntelModalProps> = ({
  isOpen,
  onClose,
  onOpenSubscription,
}) => {
  const { subscription, isProOrHigher } = useAuth();
  const [query, setQuery] = useState(SEARCH_PRESETS[0]);
  const [intelResult, setIntelResult] = useState<string | null>(null);
  const [sources, setSources] = useState<WebSource[]>([]);
  const [isGrounded, setIsGrounded] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.8-flash');
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [livePulseQuotes, setLivePulseQuotes] = useState<any[]>([]);

  // Fetch real market pulse quotes for the top ticker bar
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/market-pulse')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.assets)) {
          setLivePulseQuotes(d.assets.filter((a: any) => a.available));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const handleSearch = async (targetQuery?: string) => {
    const q = targetQuery !== undefined ? targetQuery : query;
    if (!q || !q.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Live briefing unavailable');
      }

      setIntelResult(data.text || '');
      setSources(data.sources || []);
      setIsGrounded(Boolean(data.grounded));
      if (data.modelUsed) setModelUsed(data.modelUsed);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error('Search grounding error:', err);
      setError(err?.message || 'Error executing Google Search grounded query');
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically execute the initial live search on mount/open so nothing is blank!
  useEffect(() => {
    if (isOpen && !intelResult && !isLoading) {
      handleSearch(SEARCH_PRESETS[0]);
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (!intelResult) return;
    navigator.clipboard.writeText(intelResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col rounded-xl sm:rounded-2xl bg-[#07111c] border border-blue-500/25 shadow-2xl shadow-blue-950/70 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-4 border-b border-blue-900/30 bg-[#050c14] gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-semibold tracking-wide text-white truncate">
                  Market Intel Grounding
                </h2>
                {isGrounded ? (
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
                    Live Search Grounded
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
                    Not live-sourced
                  </span>
                )}
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 hidden sm:inline">
                  {modelUsed}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Real-time macro catalysts, FOMC transcripts, and verified web citations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {intelResult && (
              <button
                type="button"
                onClick={handleCopy}
                title="Copy Briefing"
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1 text-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
              aria-label="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Market Tickers Banner (Real Twelve Data Quotes) */}
        {livePulseQuotes.length > 0 && (
          <div className="px-4 sm:px-6 py-2 bg-[#04090f] border-b border-blue-900/20 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-4 text-xs font-mono min-w-max">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Twelve Data:
              </span>
              {livePulseQuotes.slice(0, 6).map((quote, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800/60">
                  <span className="text-slate-400 font-medium">{quote.symbol}</span>
                  <span className="text-white font-bold">
                    {quote.sector === 'Forex' ? quote.price.toFixed(4) : `$${quote.price.toLocaleString('en-US')}`}
                  </span>
                  <span className={quote.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {quote.change24h >= 0 ? '+' : ''}{quote.change24h}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Query Input */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 bg-[#06101c] space-y-3">
          {/* Trial / Tier Status Banner */}
          {!isProOrHigher ? (
            <div className="p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-blue-950/30 to-purple-950/20 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-200 text-xs">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Trial Tier:</strong> Live Search Market Intelligence is active! Upgrade to <strong>Pro Trader</strong> for unlimited search runs and institutional deep debriefs.
                </span>
              </div>
              {onOpenSubscription && (
                <button
                  type="button"
                  onClick={() => onOpenSubscription('pro', 'Unlock unlimited live search market intelligence.')}
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-mono font-bold text-xs shrink-0 shadow transition active:scale-95"
                >
                  Upgrade ($29/mo)
                </button>
              )}
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <strong>Pro Access:</strong> Unlimited Live Google Search Grounded Briefings Enabled.
              </span>
              <span className="font-mono text-[11px] text-slate-400">Low-Latency Synthesis</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Query market catalysts, CPI data, earnings, regulatory decisions..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0c1827] border border-blue-900/40 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition transform active:scale-95 text-black bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Search Market</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              Trending Catalysts:
            </span>
            {SEARCH_PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQuery(p);
                  handleSearch(p);
                }}
                disabled={isLoading}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#0b1726] border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-300 transition truncate max-w-[260px] sm:max-w-[340px]"
                title={p}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Content & Results */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {isLoading && (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-9 h-9 animate-spin text-emerald-400" />
              <p className="text-sm font-mono text-emerald-300 font-semibold">
                Grounding with live Google Search & financial wires...
              </p>
              <p className="text-xs text-slate-400 max-w-md">
                Synthesizing latest macroeconomic releases, FOMC interest rate trajectories, and verified institutional citations
              </p>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start justify-between gap-3 text-red-300 text-xs">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <div>
                  <p className="font-semibold text-red-200">Search Retrieval Notice</p>
                  <p className="text-red-300/80 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleSearch()}
                className="px-3 py-1 rounded bg-red-900/40 hover:bg-red-900/60 border border-red-500/40 text-white font-mono text-xs flex items-center gap-1 shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {intelResult && !isLoading && (
            <div className="space-y-6">
              {/* Intelligence Analysis Body */}
              <div className="p-5 sm:p-6 rounded-xl bg-[#081320] border border-blue-900/30 space-y-4 shadow-inner">
                <div className="flex items-center justify-between pb-3 border-b border-blue-900/40 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Verified Market Intelligence Briefing
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      {lastUpdated ? `Live at ${lastUpdated}` : 'Updated Live'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSearch()}
                      title="Re-run Grounded Search"
                      className="text-xs px-2 py-0.5 rounded bg-blue-950/50 hover:bg-blue-900/50 border border-blue-700/30 text-blue-300 flex items-center gap-1 transition"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-emerald-500/30 selection:text-white">
                  {intelResult}
                </div>
              </div>

              {/* Grounded Web Sources Chunks */}
              {sources.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-mono text-slate-300 uppercase tracking-wider flex items-center gap-2 font-semibold">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    Google Search Grounding & Institutional Citations ({sources.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {sources.map((source, index) => {
                      let hostname = '';
                      try {
                        hostname = new URL(source.uri).hostname;
                      } catch (e) {
                        hostname = source.uri;
                      }

                      return (
                        <a
                          key={index}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-3.5 rounded-xl bg-[#08121d] border border-slate-800 hover:border-emerald-500/50 hover:bg-[#0c1a29] transition group shadow-sm"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-mono text-emerald-400 shrink-0 font-bold">
                              {index + 1}
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-medium text-slate-200 group-hover:text-emerald-300 transition truncate">
                                {source.title || hostname}
                              </p>
                              <p className="text-[11px] font-mono text-slate-500 truncate">
                                {hostname}
                              </p>
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0 ml-2" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {!intelResult && !isLoading && !error && (
            <div className="p-12 text-center space-y-3 rounded-xl border border-dashed border-slate-800 bg-[#07111c]/50">
              <TrendingUp className="w-9 h-9 mx-auto text-emerald-400 animate-pulse" />
              <p className="text-sm font-semibold text-slate-200">
                Institutional Macro Catalyst Research
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Type any asset, central bank meeting, or macroeconomic theme above to generate an authentic grounded brief with direct web source links.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
