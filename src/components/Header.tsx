import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Globe,
  MessageSquare,
  LogOut,
  LogIn,
  CheckCircle,
  Database,
  Crown,
  Zap,
  Camera,
  Bell,
  Menu,
  X,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { SubscriptionTier } from '../types/trade';
import { AppLogoIcon } from './common/AppLogo';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenReadme?: () => void;
  onOpenMarketIntel?: () => void;
  onOpenGeminiChat?: () => void;
  onOpenChartVision?: () => void;
  onOpenAlerts?: () => void;
  onOpenSubscription?: (tier?: SubscriptionTier, reason?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenReadme,
  onOpenMarketIntel,
  onOpenGeminiChat,
  onOpenChartVision,
  onOpenAlerts,
  onOpenSubscription,
}) => {
  const {
    user,
    signInWithGoogle,
    logout,
    subscription,
    chartScansRemaining,
    totalScansAllowed,
    canScanChart,
    currency,
    setCurrency,
  } = useAuth();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const isBackAllowed = currentView === 'log-trade';

  const closeAllMenus = () => {
    setShowUserDropdown(false);
    setShowMobileMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 pt-safe bg-[#051424]/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-b border-surface-container-highest/40">
      <div className="h-14 sm:h-16 px-3 sm:px-4 max-w-md mx-auto flex items-center justify-between gap-2">
        {/* Left branding */}
        <div className="flex items-center gap-2 min-w-0">
          {isBackAllowed ? (
            <button
              aria-label="Back to dashboard"
              onClick={() => {
                closeAllMenus();
                onNavigate('dashboard');
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 -ml-1 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          ) : null}

          <div
            className="flex items-center gap-2 cursor-pointer select-none min-w-0"
            onClick={() => {
              closeAllMenus();
              onNavigate('dashboard');
            }}
          >
            <AppLogoIcon size={32} className="shadow-md shadow-cyan-950/40" />
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm sm:text-base font-bold text-white truncate tracking-tight">
                {currentView === 'log-trade' ? 'Log Trade' : 'Trading Journal'}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                AI
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse ml-0.5" />
            </div>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* International Currency Switcher Toggle */}
          <div className="flex items-center bg-[#071322] border border-cyan-500/30 rounded-lg p-0.5 shadow-inner">
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                currency === 'USD'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="International Currency: USD ($)"
            >
              $ USD
            </button>
            <button
              type="button"
              onClick={() => setCurrency('EUR')}
              className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                currency === 'EUR'
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="International Currency: Euro (€)"
            >
              € EUR
            </button>
          </div>

          {/* Chart Vision AI Primary Button (Compact on mobile) */}
          {onOpenChartVision && (
            <button
              onClick={() => {
                closeAllMenus();
                onOpenChartVision();
              }}
              title={`AI Chart Vision: Upload Trade Screenshot (${chartScansRemaining} picture scans remaining)`}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full font-tag-mono text-[11px] transition-all active:scale-95 shadow-sm border ${
                !canScanChart
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border-rose-500/40'
                  : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border-cyan-500/40'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden xs:inline font-semibold">Vision</span>
              <span
                className={`text-[10px] font-bold ${
                  canScanChart ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                ({chartScansRemaining})
              </span>
            </button>
          )}

          {/* Quick Menu Toggle (Mobile Tools Drawer) */}
          <button
            onClick={() => {
              setShowUserDropdown(false);
              setShowMobileMenu((prev) => !prev);
            }}
            aria-label="Open Tools Menu"
            className={`p-1.5 sm:p-2 rounded-full transition-colors relative flex items-center justify-center ${
              showMobileMenu
                ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant'
            }`}
          >
            {showMobileMenu ? (
              <X className="w-4 h-4 sm:w-4 sm:h-4 text-cyan-400" />
            ) : (
              <Menu className="w-4 h-4 sm:w-4 sm:h-4 text-on-surface" />
            )}
          </button>

          {/* User Profile Avatar / Sign In */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  setShowUserDropdown((prev) => !prev);
                }}
                className="flex items-center p-0.5 rounded-full hover:bg-surface-container transition shrink-0 relative"
                title={`${user.displayName || user.email} (${subscription.planName})`}
              >
                {user.photoURL ? (
                  <img
                    alt={user.displayName || 'User Profile'}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 ring-emerald-500/60"
                    src={user.photoURL}
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-xs ring-1 ring-emerald-500/60">
                    {(user.displayName || user.email || 'T').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute bottom-0 right-0 ring-1 ring-[#051424]" />
              </button>

              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#091522] border border-blue-900/50 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-slate-800">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-base">
                        {(user.displayName || user.email || 'T').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-white truncate">
                        {user.displayName || 'Institutional Trader'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Picture Credits:</span>
                      <span className="text-cyan-400 font-bold">{chartScansRemaining} / {totalScansAllowed} left</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">Currency:</span>
                      <span className="text-emerald-400 font-bold">{currency === 'EUR' ? 'EUR (€)' : 'USD ($)'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
                      <Database className="w-3.5 h-3.5" />
                      <span>Firestore Sync Active</span>
                    </div>
                  </div>

                  {onOpenSubscription && (
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenSubscription('pack_10');
                      }}
                      className="w-full mb-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold transition border border-cyan-500/40"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Recharge Pictures (+10 for {currency === 'EUR' ? '5 €' : '$5'})</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setShowUserDropdown(false);
                    }}
                    className="w-full mt-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              title="Sign in with Google"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-tag-mono text-[11px] font-semibold transition active:scale-95 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xs:inline">Sign in</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Tools Drawer (Slide-down sleek action menu) */}
      {showMobileMenu && (
        <div className="max-w-md mx-auto px-3 pb-3 pt-1 border-t border-surface-container-highest/30 bg-[#071322]/98 backdrop-blur-2xl animate-in slide-in-from-top-2 duration-150">
          {/* Currency Switcher in Drawer */}
          <div className="mb-2 p-2 rounded-xl bg-surface-container-low border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span className="text-[11px] font-mono text-slate-300 font-medium">App Currency</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`px-2 py-0.8 rounded-lg font-bold transition flex items-center gap-1 border ${
                  currency === 'USD'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                    : 'bg-black/30 text-slate-300 border-slate-700/60 hover:border-slate-500'
                }`}
              >
                <span>🇺🇸</span>
                <span>USD ($)</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrency('EUR')}
                className={`px-2 py-0.8 rounded-lg font-bold transition flex items-center gap-1 border ${
                  currency === 'EUR'
                    ? 'bg-cyan-500 text-black border-cyan-400 shadow-sm'
                    : 'bg-black/30 text-slate-300 border-slate-700/60 hover:border-slate-500'
                }`}
              >
                <span>🇪🇺</span>
                <span>EUR (€)</span>
              </button>
            </div>
          </div>

          {/* Quick Balance Banner */}
          <div className="mb-2 p-2.5 rounded-xl bg-surface-container-low border border-cyan-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-[11px] font-mono text-slate-300 block font-medium">Chart Picture Balance</span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {chartScansRemaining} of {totalScansAllowed} Left
                </span>
              </div>
            </div>
            {onOpenSubscription && (
              <button
                type="button"
                onClick={() => {
                  closeAllMenus();
                  onOpenSubscription('pack_10', `Add +10 picture scans for ${currency === 'EUR' ? '5 €' : '$5'}`);
                }}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-mono text-[10px] font-bold transition active:scale-95"
              >
                +10 Pics ({currency === 'EUR' ? '5 €' : '$5'})
              </button>
            )}
          </div>

          {/* Tool Navigation Grid */}
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            {/* Chart Vision AI */}
            {onOpenChartVision && (
              <button
                type="button"
                onClick={() => {
                  closeAllMenus();
                  onOpenChartVision();
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container/70 hover:bg-surface-container-high border border-surface-container-highest/40 text-left transition active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 block text-[11px]">Chart Vision</span>
                    <span className="text-[9px] text-slate-400 font-sans">Predict UP/DOWN</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}

            {/* AI Copilot Chat */}
            {onOpenGeminiChat && (
              <button
                type="button"
                onClick={() => {
                  closeAllMenus();
                  onOpenGeminiChat();
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container/70 hover:bg-surface-container-high border border-surface-container-highest/40 text-left transition active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 block text-[11px]">AI Copilot</span>
                    <span className="text-[9px] text-slate-400 font-sans">Risk Psychologist</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}

            {/* Live Search Intel */}
            {onOpenMarketIntel && (
              <button
                type="button"
                onClick={() => {
                  closeAllMenus();
                  onOpenMarketIntel();
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container/70 hover:bg-surface-container-high border border-surface-container-highest/40 text-left transition active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 block text-[11px]">Search Intel</span>
                    <span className="text-[9px] text-slate-400 font-sans">Google Grounding</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}

            {/* Quantitative Signals */}
            {onOpenAlerts && (
              <button
                type="button"
                onClick={() => {
                  closeAllMenus();
                  onOpenAlerts();
                }}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container/70 hover:bg-surface-container-high border border-surface-container-highest/40 text-left transition active:scale-98"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 block text-[11px]">5m Signals</span>
                    <span className="text-[9px] text-slate-400 font-sans">RSI, MACD, Alerts</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
              </button>
            )}
          </div>

          {/* Secondary Footer in Drawer: Documentation & Account */}
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            {onOpenReadme && (
              <button
                type="button"
                onClick={() => {
                  closeAllMenus();
                  onOpenReadme();
                }}
                className="flex items-center gap-1 hover:text-slate-200 py-1 transition"
              >
                <FileText className="w-3 h-3 text-primary" />
                <span>Architecture Guide &amp; Docs</span>
              </button>
            )}
            {user ? (
              <span className="text-[10px] text-emerald-400 font-mono">
                ● Signed In ({subscription.planName})
              </span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeAllMenus();
                  signInWithGoogle();
                }}
                className="text-emerald-400 font-semibold text-[10px]"
              >
                Sign In with Google
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
