# Trading Journal AI - Institutional Behavioral Terminal

An institutional trading journal and behavioral audit platform built with React, TypeScript, and Tailwind CSS. The platform synthesizes quantitative performance metrics with cognitive and psychological reflection, engineered specifically for disciplined performance traders.

---

## 📸 Key Screens & Features

### 1. Terminal / Executive Dashboard
- **Cumulative P&L Ribbon**: Real-time portfolio overview with net returns, profit factor, win rate, and broker status (Interactive Brokers FIX 4.4 sync).
- **Interactive Equity Trajectory**: High-precision SVG equity curve with interactive scrub points that dynamically display date and trade P&L crosshairs.
- **Cognitive Compliance Index**: 0-100 visual gauge measuring execution discipline, rule compliance streaks, preset stop-loss adherence, and zero-revenge milestones.
- **Process Goal Widget**: Daily trade cap rule tracker to prevent overtrading and behavioral lockdown triggers.
- **2x3 Precision Matrix**: Interactive glassmorphic cards (Win/Loss Ratio, Avg Realized R:R, Largest Win, Largest Loss, Best Day, Worst Day) with tap-to-inspect audit logic explanations.
- **Logged Executions Live Feed**: Filterable by All, Wins Only, Losses, and Tagged FOMO with plan adherence flags (`Plan Respected 🟢`, `Re-entry Caution 🟡`).

### 2. Performance Analytics Engine
- **Multi-Dimension Switcher**: Filter views across *All Dimensions*, *By Asset*, *By Strategy*, *By Session*, *Day of Week Rhythm*, *Long vs Short*, and *Calendar*.
- **Interactive Monthly P&L Matrix**: 5-column institutional weekday calendar (October & November) with tap-to-inspect daily trade drawers.
- **Asset Allocation Edge**: Visual alpha tracks across BTC/USDT, NVDA, EUR/USD, ETH/USDT, and SPY.
- **Playbook Edge Matrix**: Sample trade sizes, win percentages, and average realized R:R for setups like *VWAP Breakout*, *Liquidity Sweep*, and *Counter-Trend Fade* (with systemic risk warnings).
- **Day of Week Rhythm**: Visual bar graphic illustrating peak Wednesday alpha and Friday performance decay.
- **Direction Asymmetry**: Long vs. Short execution comparison and win rate variance.
- **Cryptographic Audit Export**: Generate and download verified CSV and institutional PDF/TXT audit bundles hashed with SHA-256 signatures.

### 3. Log Trade Execution & Psychological Bias
- **Asset & Sector Selectors**: Quick switches for Crypto, Stocks, Forex, and Futures, with fast symbol presets (NVDA, BTC/USDT, ETH/USDT, SPY, EUR/USD, NQ).
- **Long / Short Directional Bias**: One-click toggling with real-time semantic styling.
- **Real-Time Trade Calculus**: Dynamic live calculation of:
  - Projected P&L ($ and %)
  - Realized R-Multiple (e.g. `+2.8R`)
  - Risk/Reward ratio (`1 : 2.80`)
  - Risk taken ($ and % of portfolio equity)
- **3-Stage Cognitive & Emotional Audit**:
  1. *Before Trade*: Setup & Pre-Entry Bias
  2. *During Trade*: Execution Discipline & Emotion
  3. *After Trade*: Post-Trade Review & Learning
- **Discipline & Bias Tag Cloud**: Interactive toggle chips (*Followed Plan*, *Clean Exit*, *FOMO*, *Revenge Trade*, *Overtrading*, *Broke Rules*, *Moved Stop Loss*, etc.).
- **Chart Screenshot & AI Vision Confluence**: Candlestick chart preview with detected technical confluence patterns (e.g., 15-min Bullish Hammer with liquidity absorption) and editable notes.

### 4. Behavioral AI Radar (Neural v4.2)
- **Overtrading Propensity**: Pacing detection per session.
- **Revenge Trading Impulse Tracker**: Anomaly monitoring across 30-day lookback windows.
- **Early Profit Taking Alert**: Detects premature exits (e.g. exiting at 1.4R instead of 2.5R target) and calculates unrealized alpha left on the table.
- **Weekly Cognitive Audit**: Structured diagnostics on capital preservation strengths, morning vs. afternoon win-rate decay, and contract scaling tilt vulnerabilities.
- **Deep Neural Debrief Modal**: Actionable directives for trailing scale-out rules, Friday cutoffs, and risk boundary compliance.

### 5. Risk / ID Guardrails
- **Alex Vance (Prop-Desk Seat #882)** institutional profile.
- **Session Drawdown Gauge**: Real-time tracking against the 2.0% max loss threshold.
- **Cryptographic Record Verification**: Immutable SHA-256 ledger record ID (`#TJ-8841-OCT24`).

### 6. Dual Viewport Experience
- **Mobile App Shell**: Faithful reproduction of the mobile tab and stack layouts.
- **Desktop Institutional Terminal**: Full-width multi-column desktop layout with sticky navigation, live session clocks (Asia, London, New York), benchmark overlays (S&P 500, BTC/USD), and active ledger tables.
- Seamless toggle button in the top navigation bar to switch between Mobile and Desktop views at any time.

---

## 🎨 Design System

- **Background Canvas**: Deep Oceanic Slate (`#051424`)
- **Card Surfaces**: Layered container slates (`#0d1c2d`, `#122131`, `#1c2b3c`, `#273647`)
- **Accent Primary**: Electric Light Blue (`#adc6ff` / `#4d8eff`)
- **Success / Positive Alpha**: Luminous Emerald (`#4edea3` / `#00a572`)
- **Loss / Risk / Warning**: Precision Carmine & Coral (`#ffb4ab` / `#ff5451` / `#93000a`)
- **Typography**: 
  - `Inter` for interfaces, headers, labels, and narrative copy
  - `JetBrains Mono` for tabular numerals, prices, timestamps, R-multiples, and financial metrics

---

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Google Material Symbols Outlined
- **Bundler**: Vite 8
- **Fonts**: Google Fonts (`Inter`, `JetBrains Mono`)

---

## 🚀 Getting Started

### Install Dependencies
```bash
npm install
```

### Run Local Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

---

## ⚖️ Compliance Disclaimer

*Trading Journal AI is strictly for behavioral journaling and historical performance analytics. It does not provide financial advice, broker execution, or trade signals. Past execution consistency does not guarantee future market returns.*
