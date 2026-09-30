import React, { useState } from 'react';
import { AppLogoIcon } from '../common/AppLogo';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'architecture'>('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-2xl rounded-2xl bg-surface-container-low border border-surface-container-highest/60 p-6 shadow-2xl relative flex flex-col gap-4 max-h-[88vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <AppLogoIcon size={42} className="shadow-lg shadow-cyan-950/40 shrink-0" />
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface font-semibold flex items-center gap-2">
              Trading Journal <span className="px-1.5 py-0.2 rounded text-[10px] font-black tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">AI</span>
            </h3>
            <span className="font-tag-mono text-tag-mono text-primary uppercase font-bold">
              README.md · Institutional Terminal Edition
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-surface-container-highest/40 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-tag-mono text-tag-mono uppercase transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Overview &amp; Design
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-3 py-1.5 rounded-lg font-tag-mono text-tag-mono uppercase transition-colors ${
              activeTab === 'features'
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Core Modules
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-3 py-1.5 rounded-lg font-tag-mono text-tag-mono uppercase transition-colors ${
              activeTab === 'architecture'
                ? 'bg-primary-container text-on-primary-container font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Tech &amp; Calculus
          </button>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-highest/40">
              <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">
                Institutional Behavioral Terminal
              </h4>
              <p>
                Trading Journal AI combines quantitative algorithmic performance metrics with
                deep psychological analysis. Engineered for disciplined traders, it prevents
                emotional anomalies (revenge trading, early exits, sizing deviations) through real-time
                audits.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest/30">
                <span className="font-label-caps text-outline uppercase block mb-1">Color System</span>
                <span className="text-secondary font-tag-mono text-tag-mono block">● Positive: Emerald (#4edea3)</span>
                <span className="text-error font-tag-mono text-tag-mono block">● Loss/Risk: Carmine (#ffb4ab)</span>
                <span className="text-primary font-tag-mono text-tag-mono block">● Action: Light Blue (#adc6ff)</span>
                <span className="text-on-surface-variant font-tag-mono text-tag-mono block">● Surface: Slate (#051424)</span>
              </div>
              <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest/30">
                <span className="font-label-caps text-outline uppercase block mb-1">Typography</span>
                <span className="text-on-surface font-body-sm block">Inter for UI layout &amp; narrative</span>
                <span className="text-secondary font-tag-mono text-tag-mono block">JetBrains Mono for prices, P&amp;L, times &amp; Sharpe ratios</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Core Modules */}
        {activeTab === 'features' && (
          <div className="flex flex-col gap-2.5 font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest/30">
              <strong className="text-on-surface block font-medium">1. Terminal / Executive Dashboard</strong>
              <span>Interactive Equity Trajectory with scrub points, Cognitive Compliance Index (94/100), and 2x3 Precision Matrix with tap-to-inspect audit logic.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest/30">
              <strong className="text-on-surface block font-medium">2. Performance Analytics Engine</strong>
              <span>October &amp; November P&amp;L heatmaps, Asset Allocation Edge (BTC, NVDA, EURUSD, ETH, SPY), Strategy Playbook (VWAP, Liquidity Sweep), and Day-of-Week Rhythm analysis.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest/30">
              <strong className="text-on-surface block font-medium">3. Real-Time Trade Calculus &amp; 3-Stage Journal</strong>
              <span>Calculates Projected P&amp;L, R-Multiple, Risk Taken, and R:R automatically from entry, stop loss, and exit prices before, during, and after executions.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest/30">
              <strong className="text-on-surface block font-medium">4. Behavioral AI Radar (Neural v4.2)</strong>
              <span>Overtrading pacing, revenge impulse tracking, early profit-taking alerts, and deep neural debriefs.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest/30">
              <strong className="text-on-surface block font-medium">5. 🔥 Firebase Auth &amp; Firestore Real-Time Persistence</strong>
              <span>Google Sign-In integration with Firebase Authentication and persistent Firestore cloud storage for user trades and profiles.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest/30">
              <strong className="text-on-surface block font-medium">6. 📷 AI Chart Vision Analyzer (UP or DOWN Prediction)</strong>
              <span>Multimodal neural vision inspecting uploaded or pasted candlestick charts, detecting patterns (breakouts, order blocks, wicks), calculating R:R levels, and giving a definitive UP or DOWN verdict.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest/30">
              <strong className="text-on-surface block font-medium">7. 🌐 Google Search Grounded Market Intel &amp; Multi-Turn Chatbot</strong>
              <span>Real-time macro catalysts with verified web citations powered by Gemini 3.5 Flash Search Grounding, plus a multi-model psychological risk chatbot (Gemini 3.1 Pro / 3.5 Flash / 3.1 Flash-Lite).</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-container border border-surface-container-highest/30">
              <strong className="text-on-surface block font-medium">8. 💳 Institutional Monetization &amp; Paywall Engine (Non-Free Suite)</strong>
              <span>Tiered subscription model (Free Trial 3-trade limit, Pro Trader $29/mo, Institutional Desk $99/mo). Complete with Stripe-style checkout, promo code discounting, cryptographic license provisioning, and feature gating.</span>
            </div>
          </div>
        )}

        {/* Tab 3: Tech & Calculus */}
        {activeTab === 'architecture' && (
          <div className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-highest/30 font-tag-mono text-xs">
              <span className="text-primary font-bold block mb-1">TRADE CALCULUS FORMULAS:</span>
              <span className="block">• Risk per unit = |Entry Price - Stop Loss|</span>
              <span className="block">• Total Risk ($) = Risk per unit × Position Size</span>
              <span className="block">• Projected P&amp;L = (Exit - Entry) × Position Size</span>
              <span className="block">• R-Multiple = Projected P&amp;L / Total Risk</span>
              <span className="block">• Risk/Reward (R:R) = |Target - Entry| / Risk per unit</span>
            </div>
            <div className="p-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest/30">
              <span className="text-on-surface font-semibold block mb-1">Cryptographic Export Seal</span>
              <span>Exports verified audit CSVs and plain text reports hashed with unique SHA-256 signatures for prop desk evaluation.</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-container-highest/30">
          <span className="font-tag-mono text-[10px] text-outline">
            Stored in root /README.md · Version 1.0.0
          </span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-primary-container text-on-primary-container font-tag-mono text-tag-mono font-semibold hover:brightness-110 active:scale-95 transition-all"
          >
            Close Documentation
          </button>
        </div>
      </div>
    </div>
  );
};
