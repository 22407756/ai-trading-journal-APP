import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Trade, SubscriptionTier } from './types/trade';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/views/DashboardView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { LogTradeView } from './components/views/LogTradeView';
import { AiInsightsView } from './components/views/AiInsightsView';
import { RiskProfileView } from './components/views/RiskProfileView';
import { ExportModal } from './components/modals/ExportModal';
import { NeuralDebriefModal } from './components/modals/NeuralDebriefModal';
import { ReadmeModal } from './components/modals/ReadmeModal';
import { MarketIntelModal } from './components/modals/MarketIntelModal';
import { GeminiChatModal } from './components/modals/GeminiChatModal';
import { SubscriptionModal } from './components/modals/SubscriptionModal';
import { ChartVisionModal } from './components/modals/ChartVisionModal';
import { AlertsHistoryModal } from './components/modals/AlertsHistoryModal';
import { Crown } from 'lucide-react';

export default function App() {
  const { trades, addTrade, user, subscription, tradesRemainingForFree, isProOrHigher } = useAuth();
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);
  const [isReadmeOpen, setIsReadmeOpen] = useState(false);
  const [isMarketIntelOpen, setIsMarketIntelOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChartVisionOpen, setIsChartVisionOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [prefilledTrade, setPrefilledTrade] = useState<Partial<Trade> | null>(null);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [subscriptionInitialTier, setSubscriptionInitialTier] = useState<SubscriptionTier>('pro');
  const [subscriptionReason, setSubscriptionReason] = useState<string | undefined>(undefined);

  const handleOpenSubscription = (tier: SubscriptionTier = 'pro', reason?: string) => {
    setSubscriptionInitialTier(tier);
    setSubscriptionReason(reason);
    setIsSubscriptionOpen(true);
  };

  const handleSaveTrade = async (newTrade: Trade) => {
    await addTrade(newTrade);
    setPrefilledTrade(null);
    setCurrentView('dashboard');
  };

  const handleLogTradeFromAnalysis = (tradeData: {
    symbol: string;
    side: 'Long' | 'Short';
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    notes: string;
    screenshotUrl?: string;
  }) => {
    setPrefilledTrade({
      symbol: tradeData.symbol,
      side: tradeData.side.toUpperCase() as any,
      entryPrice: tradeData.entryPrice,
      stopLoss: tradeData.stopLoss,
      targetPrice: tradeData.takeProfit,
      exitPrice: tradeData.takeProfit,
      preEntryBias: tradeData.notes,
      screenshotUrl: tradeData.screenshotUrl,
    });
    setCurrentView('log-trade');
  };

  return (
    <div className="min-h-screen bg-[#020912] text-on-surface flex justify-center font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Mobile App Container: 100% width on phone, max-w-md centered with sleek framing on desktop */}
      <div className="w-full max-w-md min-h-screen flex flex-col bg-surface relative shadow-2xl border-x border-surface-container-highest/20">
        
        {/* Mobile App Header */}
        <Header
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          onOpenReadme={() => setIsReadmeOpen(true)}
          onOpenMarketIntel={() => setIsMarketIntelOpen(true)}
          onOpenGeminiChat={() => setIsChatOpen(true)}
          onOpenChartVision={() => setIsChartVisionOpen(true)}
          onOpenAlerts={() => setIsAlertsOpen(true)}
          onOpenSubscription={handleOpenSubscription}
        />

        {/* Mobile Plan Status Bar (subtle, below fixed header with safe-area spacing) */}
        <div className="pt-[calc(3.75rem+env(safe-area-inset-top,0px))] sm:pt-[calc(4.25rem+env(safe-area-inset-top,0px))] px-3 sm:px-4 pb-1">
          <div className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-surface-container/60 border border-surface-container-highest/30 text-[10px] font-tag-mono">
            <div className="flex items-center gap-1.5 truncate">
              <span className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-slate-400 truncate">
                {user ? user.email : 'Local Session'}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="font-semibold text-primary uppercase">
                {subscription.planName}
              </span>
              {!isProOrHigher && (
                <button
                  onClick={() => handleOpenSubscription('pro', 'Unlock unlimited trade logging and behavioral analysis.')}
                  className="text-amber-400 hover:text-amber-300 font-bold ml-1 flex items-center gap-0.5"
                >
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>({tradesRemainingForFree} free left)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 w-full pb-24 px-3 sm:px-4">
          {currentView === 'dashboard' && (
            <DashboardView
              trades={trades}
              onOpenLogTrade={() => setCurrentView('log-trade')}
              onSelectTrade={() => setCurrentView('analytics')}
              onOpenAlerts={() => setIsAlertsOpen(true)}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView onTriggerExport={() => setIsExportOpen(true)} />
          )}

          {currentView === 'log-trade' && (
            <LogTradeView
              onSaveTrade={handleSaveTrade}
              onCancel={() => {
                setPrefilledTrade(null);
                setCurrentView('dashboard');
              }}
              onOpenSubscription={handleOpenSubscription}
              onOpenChartVision={() => setIsChartVisionOpen(true)}
              initialValues={prefilledTrade}
            />
          )}

          {currentView === 'ai-insights' && (
            <AiInsightsView onRunDebrief={() => setIsDebriefOpen(true)} />
          )}

          {currentView === 'risk-profile' && (
            <RiskProfileView onOpenSubscription={handleOpenSubscription} />
          )}

          {/* Educational Compliance Footer */}
          <footer className="mt-8 mb-2 px-2 text-center">
            <p className="font-tag-mono text-[10px] text-outline/80">
              For educational &amp; journaling purposes only. Not financial advice.
            </p>
          </footer>
        </main>

        {/* Mobile Bottom Navigation Bar */}
        <BottomNav currentView={currentView} onNavigate={(view) => setCurrentView(view)} />
      </div>

      {/* Institutional Export Audit Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        trades={trades}
        onOpenSubscription={handleOpenSubscription}
      />

      {/* Deep Neural Behavioral Debrief Modal */}
      <NeuralDebriefModal
        isOpen={isDebriefOpen}
        onClose={() => setIsDebriefOpen(false)}
        trades={trades}
      />

      {/* In-App Readme Documentation Modal */}
      <ReadmeModal
        isOpen={isReadmeOpen}
        onClose={() => setIsReadmeOpen(false)}
      />

      {/* Google Search Grounded Market Intel Modal */}
      <MarketIntelModal
        isOpen={isMarketIntelOpen}
        onClose={() => setIsMarketIntelOpen(false)}
        onOpenSubscription={handleOpenSubscription}
      />

      {/* Gemini Cognitive Chatbot Modal */}
      <GeminiChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />

      {/* Membership & Subscription Checkout Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
        initialSelectedTier={subscriptionInitialTier}
        upgradeReason={subscriptionReason}
      />

      {/* AI Chart Vision Analyzer Modal (Predict UP or DOWN from Chart Image) */}
      <ChartVisionModal
        isOpen={isChartVisionOpen}
        onClose={() => setIsChartVisionOpen(false)}
        onOpenSubscription={handleOpenSubscription}
        onLogTradeFromAnalysis={handleLogTradeFromAnalysis}
      />

      {/* Quantitative Signal Audits & Push Notifications Modal */}
      <AlertsHistoryModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
      />
    </div>
  );
}
