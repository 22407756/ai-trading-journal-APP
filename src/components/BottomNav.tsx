import React from 'react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const navItems = [
    { id: 'dashboard', label: 'Terminal', icon: 'dashboard' },
    { id: 'analytics', label: 'Analytics', icon: 'query_stats' },
    { id: 'log-trade', label: 'Log', icon: 'add', isCenter: true },
    { id: 'ai-insights', label: 'AI Audit', icon: 'psychology' },
    { id: 'risk-profile', label: 'Risk/ID', icon: 'shield_person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full z-50 pb-safe bg-[#051424]/95 backdrop-blur-xl border-t border-surface-container-highest/60 shadow-[0_-2px_12px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center h-16 sm:h-18 max-w-md mx-auto px-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="relative flex flex-col items-center justify-center flex-1 max-w-[72px] h-full group active:scale-95 transition-transform"
                aria-label="Log New Trade"
              >
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shadow-[0_0_16px_rgba(77,142,255,0.45)] transition-all ${
                    isActive
                      ? 'bg-secondary text-on-secondary'
                      : 'bg-primary-container text-on-primary-container group-hover:brightness-110'
                  }`}
                >
                  <span className="material-symbols-outlined text-[22px] sm:text-[24px]">add</span>
                </div>
                <span
                  className={`font-label-caps text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 transition-colors whitespace-nowrap ${
                    isActive ? 'text-secondary font-semibold' : 'text-on-surface-variant'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 max-w-[72px] h-full transition-colors ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {/* Active top glow indicator */}
              <span
                className={`indicator absolute top-0 w-6 h-0.5 rounded-full bg-primary shadow-[0_0_8px_rgba(173,198,255,0.85)] transition-opacity duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-0'
                }`}
              />

              <div className="relative flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px] sm:text-[22px]">{item.icon}</span>
                {item.id === 'ai-insights' && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_6px_rgba(78,222,163,0.8)]" />
                )}
              </div>
              <span className="font-label-caps text-[10px] sm:text-[11px] mt-0.5 whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
