import React from 'react';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  deviceMode: 'mobile' | 'desktop';
  onToggleDeviceMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  deviceMode,
  onToggleDeviceMode,
}) => {
  const isBackAllowed = currentView === 'log-trade';

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 pt-safe bg-[#051424]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.35)] border-b border-surface-container-highest/40">
      <div className="h-16 px-4 max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left branding */}
        <div className="flex items-center gap-2 min-w-0">
          {isBackAllowed ? (
            <button
              aria-label="Back"
              onClick={() => onNavigate('dashboard')}
              className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          ) : null}

          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => onNavigate('dashboard')}
          >
            <img
              alt="Trading Journal AI Logo"
              className="h-8 w-auto object-contain flex-shrink-0"
              src="https://lh3.googleusercontent.com/aida/AEtjO1VfFGV_cIPgAyJmFPieg_RgXHtP0PwM1ENiRaokZPljE-6DQHm6hxNsO6oTEX0LU25TX9Et4L_QNDIti0wfRdIyQLI85gVYB7QTBEk1HuOtF8bV-GYgsHHs8ddjLMbCET_TqZJJjjdipII6dbLxxi5pSTV0hzgzCrLuni0KVxPCJjyGuqx5gvJkWbVnfI6ZTRKDWQem5HJIgWaWNu63zK0FQ4ELxBotypQzi7VMK7Dhq57rDb2_UE5sYroo"
            />
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">
                {currentView === 'log-trade' ? 'Log Trade' : 'Trading Journal AI'}
              </span>
              {currentView !== 'log-trade' && (
                <span className="font-tag-mono text-tag-mono uppercase px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-semibold tracking-wider flex-shrink-0">
                  INSTITUTIONAL
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right tools and profile */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Device mode toggle: Switch between Mobile Shell and Desktop Institutional Terminal */}
          <button
            onClick={onToggleDeviceMode}
            title={deviceMode === 'mobile' ? 'Switch to Desktop Terminal' : 'Switch to Mobile App View'}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface font-tag-mono text-[11px] transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-[15px] text-primary">
              {deviceMode === 'mobile' ? 'desktop_windows' : 'smartphone'}
            </span>
            <span className="hidden sm:inline">
              {deviceMode === 'mobile' ? 'Desktop View' : 'Mobile View'}
            </span>
          </button>

          {/* User profile avatar with live indicator */}
          <div
            className="relative flex items-center justify-center cursor-pointer"
            onClick={() => onNavigate('risk-profile')}
            title="Alex Vance (Prop-Desk #882)"
          >
            <img
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/40"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1sS9GPJ9pn9Qcx18J8zUkLlNOsra-IS6Jmt6iJ05aCyIikLubcaOOS1cyzLxH_GD1q4jqAuHBGaCfIQa_soUVvHBe92ho3t0m4co1CtamyAPDwo6kHmfpVI00O0lVJjHvj8dCpLpAtEcsejlNQ_zzxEYVe1mnio_p8E6PGdicK_2XTcHrFRDSxj3t4WmYvICVKqrs-ElcpjITaR-R8a7ukcUr5S70uh9bXcy43vW8KFZ37L7eyQd4zA"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-secondary ring-2 ring-surface"></span>
          </div>
        </div>
      </div>
    </header>
  );
};
