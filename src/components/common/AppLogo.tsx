import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  subtitle?: string;
}

export const AppLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
    >
      <defs>
        {/* Deep ambient background */}
        <linearGradient id="tj-bg-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0a2540" />
          <stop offset="100%" stopColor="#040e1a" />
        </linearGradient>

        {/* Outer border gradient */}
        <linearGradient id="tj-border-grad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
        </linearGradient>

        {/* Breakout surge line */}
        <linearGradient id="tj-breakout-grad" x1="12" y1="36" x2="38" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#00f0ff" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Bullish candle gradient */}
        <linearGradient id="tj-bull-candle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        {/* Secondary candle gradient */}
        <linearGradient id="tj-sec-candle" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        {/* Soft neon glow */}
        <filter id="tj-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Hex/Squircle Base Tile */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="url(#tj-bg-grad)"
        stroke="url(#tj-border-grad)"
        strokeWidth="1.5"
      />

      {/* Subtle Quant Grid Marks */}
      <path
        d="M 12 16 H 36 M 12 24 H 36 M 12 32 H 36"
        stroke="#1e3a5f"
        strokeWidth="0.75"
        strokeDasharray="2 3"
        strokeOpacity="0.4"
      />

      {/* Candle 1 (Left Base Accumulation) */}
      <line x1="16" y1="23" x2="16" y2="35" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.6" />
      <rect x="14" y="26" width="4" height="6" rx="1" fill="url(#tj-sec-candle)" />

      {/* Candle 2 (Center Pivot / Institutional HL) */}
      <line x1="24" y1="18" x2="24" y2="32" stroke="#60a5fa" strokeWidth="1" strokeOpacity="0.8" />
      <rect x="22" y="21" width="4" height="8" rx="1" fill="url(#tj-sec-candle)" />

      {/* Candle 3 (Right Breakout Impulse) */}
      <line x1="32" y1="12" x2="32" y2="28" stroke="#34d399" strokeWidth="1.25" />
      <rect x="30" y="15" width="4" height="9" rx="1" fill="url(#tj-bull-candle)" />

      {/* Dynamic Breakout Trajectory Curve */}
      <path
        d="M 12 33 C 18 33, 21 27, 28 20 L 35 13"
        stroke="url(#tj-breakout-grad)"
        strokeWidth="2.25"
        strokeLinecap="round"
        filter="url(#tj-glow)"
      />

      {/* Breakout Arrowhead / Vector Peak */}
      <path
        d="M 31 12.5 H 35.5 V 17"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* AI Spark / Intelligence Star in Upper Right */}
      <path
        d="M 36 9 L 37.2 12.2 L 40.5 13.5 L 37.2 14.8 L 36 18 L 34.8 14.8 L 31.5 13.5 L 34.8 12.2 Z"
        fill="#00f0ff"
        filter="url(#tj-glow)"
      />
      <circle cx="36" cy="13.5" r="1" fill="#ffffff" />
    </svg>
  );
};

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 32,
  showText = true,
  subtitle,
}) => {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <AppLogoIcon size={size} />
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-bold tracking-tight text-white text-sm sm:text-base">
              TRADING<span className="text-cyan-400 ml-1">JOURNAL</span>
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30">
              AI
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-slate-400 tracking-tight font-medium mt-0.5 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
