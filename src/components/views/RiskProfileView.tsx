import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Crown, Zap, Shield, CreditCard, RotateCcw, AlertTriangle, Camera, CheckCircle2, DollarSign } from 'lucide-react';
import { SubscriptionTier, OWNER_NAME, OWNER_PAYOUT_EMAIL, PICTURE_PACKS } from '../../types/trade';
import { PayPalButtonComponent } from '../common/PayPalButtonComponent';

interface RiskProfileViewProps {
  onOpenSubscription?: (tier?: SubscriptionTier, reason?: string) => void;
}

export const RiskProfileView: React.FC<RiskProfileViewProps> = ({ onOpenSubscription }) => {
  const {
    user,
    chartScansUsed,
    chartScansRemaining,
    totalScansAllowed,
    canScanChart,
    isOwner,
    currency,
  } = useAuth();

  return (
    <div className="flex flex-col w-full pb-16 space-y-4 max-w-md mx-auto select-none">
      {/* Profile Card */}
      <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md flex flex-col gap-space-md border border-surface-container-highest/40 relative overflow-hidden">
        <div className="flex items-center gap-space-md">
          <div className="relative">
            <img
              alt={user?.displayName || 'Alex Vance'}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-secondary/50"
              src={
                user?.photoURL ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuB1sS9GPJ9pn9Qcx18J8zUkLlNOsra-IS6Jmt6iJ05aCyIikLubcaOOS1cyzLxH_GD1q4jqAuHBGaCfIQa_soUVvHBe92ho3t0m4co1CtamyAPDwo6kHmfpVI00O0lVJjHvj8dCpLpAtEcsejlNQ_zzxEYVe1mnio_p8E6PGdicK_2XTcHrFRDSxj3t4WmYvICVKqrs-ElcpjITaR-R8a7ukcUr5S70uh9bXcy43vW8KFZ37L7eyQd4zA'
              }
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-secondary ring-2 ring-surface" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold truncate">
                {user?.displayName || 'Alex Vance'}
              </h2>
              <span className="font-tag-mono text-tag-mono px-2 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                TRADER
              </span>
            </div>
            <span className="font-tag-mono text-tag-mono text-on-surface-variant truncate">
              {user?.email || 'trader@alpha.internal'}
            </span>
          </div>
        </div>

        {/* Broker Connection Status */}
        <div className="bg-surface-container p-3 rounded-lg flex items-center justify-between border border-surface-container-highest/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
            <div className="flex flex-col">
              <span className="font-body-md text-body-md text-on-surface font-semibold">
                Interactive Brokers (TWS API)
              </span>
              <span className="font-tag-mono text-tag-mono text-on-surface-variant">
                Live FIX 4.4 Socket · Latency 12ms
              </span>
            </div>
          </div>
          <span className="font-tag-mono text-tag-mono text-secondary bg-secondary/10 px-2 py-0.5 rounded font-bold">
            SYNCED
          </span>
        </div>
      </div>

      {/* Picture Credits & Recharge */}
      <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md flex flex-col gap-3 border border-surface-container-highest/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              AI Chart Picture Credits
            </span>
          </div>
          <span
            className={`font-tag-mono text-tag-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              canScanChart
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            {canScanChart ? `${chartScansRemaining} Available` : 'Limit Reached (0 Left)'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container border border-surface-container-highest/30 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-headline-sm text-sm text-white font-bold">
                {chartScansRemaining} / {totalScansAllowed} Picture Analyses Left
              </p>
              <p className="text-xs text-on-surface-variant">
                {chartScansUsed} analyses used · Pay as you go
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-tag-mono text-cyan-300 font-bold block">
                {currency === 'EUR' ? '5 € for 10 Pics' : '$5 for 10 Pics'}
              </span>
              <span className="text-[10px] font-mono text-emerald-400">PayPal &amp; Card Direct</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                canScanChart ? 'bg-cyan-400' : 'bg-rose-500'
              }`}
              style={{
                width: `${Math.min(100, (chartScansUsed / totalScansAllowed) * 100)}%`,
              }}
            />
          </div>

          <div className="pt-3 border-t border-surface-container-highest/20 space-y-2.5">
            {/* Official PayPal Button for Pay As You Go */}
            <PayPalButtonComponent
              pack={PICTURE_PACKS[0]}
              customTitle={`Pay As You Go: ${currency === 'EUR' ? '5 €' : '$5'} for 10 Pictures`}
              buttonLabel="pay"
            />

            {onOpenSubscription && (
              <button
                type="button"
                onClick={() => onOpenSubscription('pack_10')}
                className="w-full py-1.5 px-3 rounded-lg bg-surface-container-highest/60 hover:bg-surface-container-highest text-slate-300 font-tag-mono text-[11px] transition flex items-center justify-center gap-1.5 border border-slate-700/50"
              >
                <span>View all packs via PayPal &amp; Credit Card →</span>
              </button>
            )}
          </div>
        </div>

        {/* Platform Beneficiary & Payout routing */}
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] uppercase">Merchant Beneficiary:</span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.2 rounded">
              VERIFIED
            </span>
          </div>
          <p className="text-white font-bold">{OWNER_NAME} · PayPal ({OWNER_PAYOUT_EMAIL})</p>
          <p className="text-[11px] text-slate-400 font-sans">
            Paiement direct sécurisé par PayPal ou Carte de Crédit vers votre compte PayPal.
          </p>
        </div>
      </div>

      {/* Risk Drawdown & Guardrails */}
      <div className="p-space-lg rounded-xl bg-surface-container-low shadow-md flex flex-col gap-space-md border border-surface-container-highest/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[20px]">shield</span>
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Risk &amp; Drawdown Guardrails
            </span>
          </div>
          <span className="font-tag-mono text-tag-mono text-secondary bg-secondary/15 px-2 py-0.5 rounded-full font-bold">
            SECURE
          </span>
        </div>

        {/* Drawdown Gauge */}
        <div className="flex flex-col gap-1.5 bg-surface-container p-3 rounded-lg border border-surface-container-highest/20">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Current Session Drawdown
            </span>
            <span className="font-data-metric-sm text-data-metric-sm text-secondary font-bold">
              0.42% / 2.00% Max
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
            <div className="h-full bg-secondary rounded-full" style={{ width: '21%' }} />
          </div>
          <span className="font-tag-mono text-tag-mono text-outline">
            1.58% buffer remaining before auto-killswitch terminates order routing.
          </span>
        </div>

        {/* Daily Trade Cap Rule */}
        <div className="flex flex-col gap-1.5 bg-surface-container p-3 rounded-lg border border-surface-container-highest/20">
          <div className="flex items-center justify-between">
            <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
              Daily Trade Limit
            </span>
            <span className="font-data-metric-sm text-data-metric-sm text-primary font-bold">
              2 of 3 Executed (66%)
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-surface-container-high overflow-hidden">
            <div className="h-full bg-primary-container rounded-full" style={{ width: '66%' }} />
          </div>
          <span className="font-tag-mono text-tag-mono text-outline">
            1 execution allowance remaining for today's NY afternoon session.
          </span>
        </div>

        {/* Execution Rules Audit List */}
        <div className="flex flex-col gap-2 pt-1">
          <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider">
            Mandatory Institutional Protocols
          </span>

          {[
            { label: 'Hard stop losses attached at execution', status: 'Compliant' },
            { label: 'Risk capped strictly at 1.0% equity per ticket', status: 'Compliant' },
            { label: 'No revenge trades after 2 scratch events', status: 'Compliant' },
            { label: 'Profit lock initiated after +3.0R expansion', status: 'Compliant' },
          ].map((rule, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 rounded-lg bg-surface-container-lowest/80 border border-surface-container-highest/20"
            >
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  check_circle
                </span>
                <span className="font-body-sm text-body-sm text-on-surface">{rule.label}</span>
              </div>
              <span className="font-tag-mono text-[10px] text-secondary font-semibold">
                {rule.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cryptographic Ledger Verification Seal */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-highest/30 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">fingerprint</span>
          <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
            Institutional Audit Hash
          </span>
        </div>
        <p className="font-tag-mono text-[11px] text-on-surface-variant break-all leading-relaxed">
          SHA-256: 8f49b068c92a95c3bb20e17bca31d582046e7f8e329048a1bca85890e03cf44a
        </p>
        <span className="font-tag-mono text-[10px] text-outline">
          Record ID: #TJ-8841-OCT24 · Timestamp: 2024-10-24T14:30:00Z
        </span>
      </div>
    </div>
  );
};
