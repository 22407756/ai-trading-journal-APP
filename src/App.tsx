import React, { useState } from 'react';
import { INITIAL_TRADES } from './data/initialData';
import { Trade } from './types/trade';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/views/DashboardView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { LogTradeView } from './components/views/LogTradeView';
import { AiInsightsView } from './components/views/AiInsightsView';
import { RiskProfileView } from './components/views/RiskProfileView';
import { DesktopTerminalView } from './components/views/DesktopTerminalView';
import { ExportModal } from './components/modals/ExportModal';
import { NeuralDebriefModal } from './components/modals/NeuralDebriefModal';

export default function App() {
  const [trades, setTrades] = useState<Trade[]>(INITIAL_TRADES);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [deviceMode, setDeviceMode] = useState<'mobile' | 'desktop'>('mobile');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);

  const handleSaveTrade = (newTrade: Trade) => {
    setTrades([newTrade, ...trades]);
    setCurrentView('dashboard');
  };

  const handleToggleDeviceMode = () => {
    setDeviceMode((prev) => (prev === 'mobile' ? 'desktop' : 'mobile'));
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-body-md antialiased selection:bg-primary-container selection:text-on-primary-container">
      {/* Device Mode Switcher Banner (Subtle top helper) */}
      <div className="w-full bg-surface-container-lowest border-b border-surface-container-highest/30 py-1 px-4 text-center">
        <div className="max-w-md mx-auto flex items-center justify-between text-[11px] font-tag-mono text-outline">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span>INSTITUTIONAL SUITE ACTIVE</span>
          </span>
          <button
            onClick={handleToggleDeviceMode}
            className="text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <span>Switch to {deviceMode === 'mobile' ? 'Desktop Terminal' : 'Mobile Screens'}</span>
            <span className="material-symbols-outlined text-[13px]">swap_horiz</span>
          </button>
        </div>
      </div>

      {deviceMode === 'desktop' ? (
        // Desktop Institutional Terminal Mode (Image 12 & HTML 5)
        <DesktopTerminalView
          trades={trades}
          onOpenLogTrade={() => {
            setDeviceMode('mobile');
            setCurrentView('log-trade');
          }}
          onNavigateView={(view) => {
            setDeviceMode('mobile');
            setCurrentView(view);
          }}
          onRunDebrief={() => setIsDebriefOpen(true)}
        />
      ) : (
        // Mobile Tab & Stack Mode (Images 4, 6, 8, 10 & HTML 1, 2, 3, 4)
        <div className="flex flex-col min-h-screen">
          <Header
            currentView={currentView}
            onNavigate={(view) => setCurrentView(view)}
            deviceMode={deviceMode}
            onToggleDeviceMode={handleToggleDeviceMode}
          />

          <main className="flex-1 w-full pt-20 pb-28 px-4 max-w-md mx-auto">
            {currentView === 'dashboard' && (
              <DashboardView
                trades={trades}
                onOpenLogTrade={() => setCurrentView('log-trade')}
                onSelectTrade={() => setCurrentView('analytics')}
              />
            )}

            {currentView === 'analytics' && (
              <AnalyticsView onTriggerExport={() => setIsExportOpen(true)} />
            )}

            {currentView === 'log-trade' && (
              <LogTradeView
                onSaveTrade={handleSaveTrade}
                onCancel={() => setCurrentView('dashboard')}
              />
            )}

            {currentView === 'ai-insights' && (
              <AiInsightsView onRunDebrief={() => setIsDebriefOpen(true)} />
            )}

            {currentView === 'risk-profile' && <RiskProfileView />}
          </main>

          {/* Educational Compliance Disclaimer Floating Bar */}
          <div className="fixed bottom-20 left-0 right-0 w-full z-40 pointer-events-none px-4">
            <div className="max-w-md mx-auto py-1 px-3 rounded-lg bg-surface-container-lowest/85 backdrop-blur-md text-center shadow-[0_1px_8px_rgba(0,0,0,0.25)] border border-surface-container-highest/20 pointer-events-auto">
              <p className="font-tag-mono text-[10px] text-outline">
                For educational &amp; journaling purposes only. Not financial advice.
              </p>
            </div>
          </div>

          {/* Bottom Navigation Bar */}
          <BottomNav currentView={currentView} onNavigate={(view) => setCurrentView(view)} />
        </div>
      )}

      {/* Institutional Export Audit Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        trades={trades}
      />

      {/* Deep Neural Behavioral Debrief Modal */}
      <NeuralDebriefModal
        isOpen={isDebriefOpen}
        onClose={() => setIsDebriefOpen(false)}
        trades={trades}
      />
    </div>
  );
}
