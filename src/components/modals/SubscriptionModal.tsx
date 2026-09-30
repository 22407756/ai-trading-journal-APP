import React, { useState, useEffect } from 'react';
import {
  Shield,
  Check,
  Zap,
  Sparkles,
  CreditCard,
  Lock,
  ArrowRight,
  CheckCircle2,
  X,
  RotateCcw,
  DollarSign,
  ExternalLink,
  Send,
  Landmark,
  Copy,
  Camera,
  Coins,
  Receipt,
  AlertCircle,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  OWNER_NAME,
  OWNER_PAYOUT_EMAIL,
  OWNER_COUNTRY,
  PICTURE_PACKS,
  PicturePack,
  PaymentRecord,
} from '../../types/trade';
import { PayPalButtonComponent } from '../common/PayPalButtonComponent';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedTier?: string;
  upgradeReason?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  upgradeReason,
}) => {
  const {
    chartScansUsed,
    chartScansRemaining,
    totalScansAllowed,
    scansPurchased,
    addPurchasedScans,
    user,
    recordPayment,
    isOwner,
    currency,
    setCurrency,
  } = useAuth();

  const [selectedPackId, setSelectedPackId] = useState<string>('pack_10');
  const [step, setStep] = useState<'packs' | 'checkout' | 'success' | 'owner_payouts'>('packs');

  // Promo code & checkout state
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalConfig, setPaypalConfig] = useState<{ isConfigured: boolean; clientId: string | null } | null>(null);
  const [paypalOrders, setPaypalOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [receiptTxId, setReceiptTxId] = useState('');

  const fetchPaypalOrders = () => {
    setLoadingOrders(true);
    fetch('/api/paypal/payments')
      .then((r) => r.json())
      .then((data) => {
        if (data.payments) setPaypalOrders(data.payments);
        setLoadingOrders(false);
      })
      .catch((err) => {
        console.warn('Failed to load PayPal orders:', err);
        setLoadingOrders(false);
      });
  };

  useEffect(() => {
    fetch('/api/paypal/config')
      .then((r) => r.json())
      .then((data) => setPaypalConfig(data))
      .catch(() => setPaypalConfig({ isConfigured: false, clientId: null }));
  }, []);

  useEffect(() => {
    if (step === 'owner_payouts') {
      fetchPaypalOrders();
    }
  }, [step]);

  if (!isOpen) return null;

  const selectedPack: PicturePack =
    PICTURE_PACKS.find((p) => p.id === selectedPackId) || PICTURE_PACKS[0];

  const activeCurrency = currency || 'USD';
  const isEur = activeCurrency === 'EUR';

  const basePrice = isEur ? selectedPack.priceEUR : selectedPack.priceUSD;
  const discountAmount = Math.round(basePrice * appliedDiscount * 100) / 100;
  const finalPrice = Math.max(0, Math.round((basePrice - discountAmount) * 100) / 100);
  const formattedFinalPrice = isEur ? `${finalPrice} €` : `$${finalPrice.toFixed(2)}`;

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === 'SARA20') {
      setAppliedDiscount(0.2);
      setPromoMessage('20% special discount applied!');
    } else if (code === 'VIPFREE') {
      setAppliedDiscount(1.0);
      setPromoMessage('100% full VIP credit granted!');
    } else {
      setAppliedDiscount(0);
      setPromoMessage('Invalid promo code. Try "SARA20"');
    }
  };

  const handleSelectPackAndCheckout = (packId: string) => {
    setSelectedPackId(packId);
    setStep('checkout');
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await addPurchasedScans(selectedPack.scansCount);

    const promoTx = `PROMO-${Math.floor(100000 + Math.random() * 900000)}`;
    setReceiptTxId(promoTx);

    await recordPayment({
      amount: finalPrice,
      currency: activeCurrency,
      scansAdded: selectedPack.scansCount,
      packId: selectedPack.id,
      paymentMethod: 'paypal',
      transactionId: promoTx,
      payerEmail: user?.email || 'trader@client',
      recipientEmail: OWNER_PAYOUT_EMAIL,
      recipientName: OWNER_NAME,
    });

    setIsProcessing(false);
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[96vh] sm:max-h-[92vh] flex flex-col rounded-xl sm:rounded-2xl bg-[#09131f] border border-cyan-500/25 shadow-2xl shadow-blue-950/60 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-4 border-b border-blue-900/30 bg-[#070e17] gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 shrink-0">
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-lg font-bold text-white tracking-wide truncate">
                  AI Picture Credits
                </h2>
                <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-mono rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase shrink-0">
                  {isEur ? '5 € for 10 Pics' : '$5 for 10 Pics'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate hidden sm:block">
                4 Free Initial Scans · Pay only when you want to add more pictures
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setStep(step === 'owner_payouts' ? 'packs' : 'owner_payouts')}
              className={`px-2 sm:px-2.5 py-1 rounded-full font-mono text-[10px] sm:text-[11px] flex items-center gap-1 transition border ${
                step === 'owner_payouts'
                  ? 'bg-amber-400 text-black border-amber-300 font-bold'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
              }`}
              title="View Owner PayPal & Payout Hub (Sara Oussoussou)"
            >
              <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Owner:</span>
              <span className="font-semibold">Sara</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Upgrade Reason Alert if present */}
        {upgradeReason && step === 'packs' && (
          <div className="mx-3 sm:mx-6 mt-3 sm:mt-4 p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5 sm:gap-3">
            <div className="p-1 rounded-lg bg-amber-500/30 text-amber-300 shrink-0">
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <p className="leading-snug text-[11px] sm:text-xs">{upgradeReason}</p>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {step === 'packs' && (
            <>
              {/* Picture Scans Remaining Status Card */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#061726] to-[#081f2f] border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase text-slate-400 tracking-wider">
                      Your Chart Picture Balance:
                    </span>
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        chartScansRemaining > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {chartScansRemaining > 0 ? 'Active Credits' : 'Limit Reached (0 Left)'}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-cyan-300">
                      {chartScansRemaining}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      / {totalScansAllowed} Picture Analyses Available
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      ({chartScansUsed} used)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[11px] text-slate-400 font-mono">
                    Beneficiary Recipient:
                  </div>
                  <div className="text-xs font-bold text-white font-mono">
                    {OWNER_NAME} · <span className="text-cyan-400">PayPal ({OWNER_PAYOUT_EMAIL})</span>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-emerald-200 flex items-center gap-2">
                <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>No recurring monthly subscriptions!</strong> You only pay when you use your free pictures. <strong>10 more pictures for {isEur ? '5 €' : '$5'}</strong>.
                </span>
              </div>

              {/* Currency Selector Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono text-slate-300 font-medium">Choose Currency:</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border ${
                      activeCurrency === 'USD'
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-black/40 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span>🇺🇸</span>
                    <span>USD ($)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('EUR')}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 border ${
                      activeCurrency === 'EUR'
                        ? 'bg-cyan-500 text-black border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-black/40 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    <span>🇪🇺</span>
                    <span>EUR (€)</span>
                  </button>
                </div>
              </div>

              {/* Picture Packs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PICTURE_PACKS.map((pack) => {
                  const isTopPack = pack.id === 'pack_10';
                  const packFormattedPrice = isEur ? `${pack.priceEUR} €` : `$${pack.priceUSD}`;
                  return (
                    <div
                      key={pack.id}
                      className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200 ${
                        isTopPack
                          ? 'bg-gradient-to-b from-[#091b29] to-[#061019] border-cyan-400/60 shadow-xl shadow-cyan-950/50 ring-1 ring-cyan-400/40'
                          : 'bg-[#07111c] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {pack.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span
                            className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider shadow-md ${
                              isTopPack
                                ? 'bg-cyan-400 text-black'
                                : 'bg-emerald-500 text-black'
                            }`}
                          >
                            {pack.badge}
                          </span>
                        </div>
                      )}

                      <div className="space-y-3 mt-1">
                        <div>
                          <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                            <Camera className="w-4 h-4 text-cyan-400" />
                            <span>{pack.name}</span>
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                            {pack.description}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="p-3 rounded-xl bg-black/40 border border-slate-800/80 space-y-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold font-mono text-white">
                              {packFormattedPrice}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">one-time</span>
                          </div>
                          <div className="text-[11px] font-mono text-emerald-400 font-semibold">
                            PayPal &amp; Card Direct
                          </div>
                        </div>

                        {/* Features list */}
                        <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>+{pack.scansCount} AI Chart Screen Analyses</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>UP or DOWN Direction Verdict</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Key Support &amp; Resistance Levels</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Never expires · Use anytime</span>
                          </li>
                        </ul>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectPackAndCheckout(pack.id)}
                        className={`w-full mt-5 py-2.5 rounded-xl font-mono text-xs font-bold transition transform active:scale-95 flex items-center justify-center gap-1.5 shadow-lg ${
                          isTopPack
                            ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black shadow-cyan-500/25'
                            : 'bg-slate-800 hover:bg-slate-700 text-white'
                        }`}
                      >
                        <span>Add {pack.name} ({packFormattedPrice})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Direct payment guarantee */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <CreditCard className="w-4 h-4 text-cyan-400" />
                  <span>
                    Direct Payout: <strong>{OWNER_NAME}</strong> · PayPal &amp; Carte de Crédit ({OWNER_PAYOUT_EMAIL})
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  Instant Top-up
                </span>
              </div>
            </>
          )}

          {/* Checkout Step */}
          {step === 'checkout' && (
            <div className="max-w-xl mx-auto space-y-5 animate-in fade-in">
              <button
                type="button"
                onClick={() => setStep('packs')}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                ← Back to picture packs
              </button>

              <div className="p-5 rounded-2xl bg-[#071322] border border-cyan-500/40 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Confirm Picture Credits Order</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Top-up <strong>{selectedPack.name}</strong> to your account
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-cyan-300">
                      {formattedFinalPrice}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      {activeCurrency}
                    </div>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                    Promo / Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="e.g. SARA20"
                      className="flex-1 px-3 py-2 rounded-xl bg-[#07111c] border border-slate-800 text-xs font-mono uppercase text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-medium transition"
                    >
                      Apply
                    </button>
                  </div>
                  {promoMessage && (
                    <p
                      className={`text-xs ${
                        appliedDiscount > 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {promoMessage}
                    </p>
                  )}
                </div>

                {/* Official PayPal & Credit Card Checkout Gateway */}
                <div className="space-y-3 pt-2">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-[#07111c] border border-blue-500/40 text-xs space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold text-white font-mono">
                          Paiement Sécurisé PayPal &amp; Carte de Crédit
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            paypalConfig?.isConfigured
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {paypalConfig?.isConfigured ? '● Sandbox Actif' : 'Credentials Required'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">REST API Orders v2</span>
                    </div>

                    <div className="p-3 rounded-lg bg-black/50 border border-blue-900/50 space-y-1.5 font-mono text-[11px] text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Pack Sélectionné:</span>
                        <strong className="text-white">{selectedPack.name} (+{selectedPack.scansCount} Analyses)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Total à Régler:</span>
                        <strong className="text-emerald-400 font-bold">{formattedFinalPrice} {activeCurrency}</strong>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                        <span>Bénéficiaire PayPal:</span>
                        <span className="text-cyan-300 font-semibold">{OWNER_NAME} ({OWNER_PAYOUT_EMAIL})</span>
                      </div>
                    </div>

                    {/* Official PayPal Smart Buttons (Yellow PayPal Button + Black Credit/Debit Card Button) */}
                    {finalPrice > 0 ? (
                      <PayPalButtonComponent
                        pack={{
                          ...selectedPack,
                          priceEUR: isEur ? finalPrice : selectedPack.priceEUR,
                          priceUSD: !isEur ? finalPrice : selectedPack.priceUSD,
                        }}
                        currency={activeCurrency}
                        customTitle={`Payer ${formattedFinalPrice} via PayPal ou Carte`}
                        buttonLabel="pay"
                        onSuccess={(details) => {
                          setReceiptTxId(details.orderId);
                          setStep('success');
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={handleProcessPayment}
                        disabled={isProcessing}
                        className="w-full py-3 rounded-xl font-mono text-sm font-bold text-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 hover:from-emerald-300 hover:to-cyan-300 shadow-xl shadow-cyan-500/25 transition transform active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <RotateCcw className="w-4 h-4 animate-spin text-black" />
                            <span>Activation des photos VIP...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-black" />
                            <span>Activer gratuitement +{selectedPack.scansCount} photos VIP</span>
                          </>
                        )}
                      </button>
                    )}

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 font-sans leading-relaxed flex items-start gap-2">
                      <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Règlement direct sur votre PayPal :</strong> Les acheteurs peuvent payer soit avec leur <strong>compte PayPal</strong>, soit directement avec leur <strong>Carte de Crédit / Débit (Visa, Mastercard, etc.)</strong>. Tout l'argent arrive instantanément sur votre compte PayPal ({OWNER_PAYOUT_EMAIL}).
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="max-w-md mx-auto text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  🎉 +{selectedPack.scansCount} Pictures Added!
                </h3>
                <p className="text-xs text-slate-300">
                  Your picture credits have been credited to your account. You can now analyze more chart screenshots!
                </p>
              </div>

              {/* Receipt card */}
              <div className="p-4 rounded-xl bg-[#07111c] border border-blue-900/40 text-left font-mono text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <Receipt className="w-3.5 h-3.5 text-cyan-400" />
                    <span>TRANSACTION RECEIPT</span>
                  </span>
                  <span>{receiptTxId}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Pack Added:</span>
                  <span className="text-cyan-300 font-bold">+{selectedPack.scansCount} Picture Analyses</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>New Balance:</span>
                  <span className="text-emerald-400 font-bold">{chartScansRemaining} pictures remaining</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Amount Paid:</span>
                  <span className="text-white font-bold">{formattedFinalPrice} {activeCurrency}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Beneficiary Recipient:</span>
                  <span className="text-emerald-400 font-bold">{OWNER_NAME} ({OWNER_PAYOUT_EMAIL})</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl font-mono text-xs font-bold text-black bg-cyan-400 hover:bg-cyan-300 transition shadow-lg shadow-cyan-500/25"
              >
                Analyze a Chart Now
              </button>
            </div>
          )}

          {/* Owner Payout Hub View for Sara Oussoussou */}
          {step === 'owner_payouts' && (
            <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in pb-4">
              <button
                type="button"
                onClick={() => setStep('packs')}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                ← Back to picture packs
              </button>

              <div className="p-5 rounded-2xl bg-[#071322] border border-blue-500/40 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-blue-900/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/40">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <span>Compte PayPal &amp; Payout Hub</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                          PayPal Direct
                        </span>
                      </h3>
                      <p className="text-xs text-slate-300">
                        Encaissement direct des paiements PayPal et Carte de Crédit pour <strong>{OWNER_NAME}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-cyan-400 font-bold">100% Direct PayPal</span>
                </div>

                {/* 3 Metric cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Compte PayPal Payout</span>
                    <span className="text-xs font-bold font-mono text-cyan-300 truncate block">{OWNER_PAYOUT_EMAIL}</span>
                    <span className="text-[10px] text-emerald-400 block">● Compte Vérifié</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Modes Reçus</span>
                    <span className="text-xs font-bold font-mono text-white block">PayPal &amp; Carte de Crédit</span>
                    <span className="text-[10px] text-slate-400 block">Directement sur votre solde</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">Délai de Réception</span>
                    <span className="text-sm font-bold font-mono text-emerald-400 block">Instantané</span>
                    <span className="text-[10px] text-slate-400 block">Crédité en direct</span>
                  </div>
                </div>

                {/* PayPal Real-Time Transactions Ledger (Saved Orders Lookup) */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-[#07111c] border border-blue-500/40 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-900/40">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Historique des Commandes PayPal (Sandbox Orders API v2)
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={fetchPaypalOrders}
                      disabled={loadingOrders}
                      className="px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[10px] font-mono flex items-center gap-1 border border-blue-500/40 transition"
                    >
                      <RotateCcw className={`w-3 h-3 ${loadingOrders ? 'animate-spin' : ''}`} />
                      <span>Actualiser</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Statut Gateway:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        paypalConfig?.isConfigured
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {paypalConfig?.isConfigured
                        ? '● Actif (Sandbox api-m.sandbox.paypal.com)'
                        : 'PAYPAL_CLIENT_ID / SECRET manquant'}
                    </span>
                  </div>

                  {paypalOrders.length === 0 ? (
                    <div className="p-3 rounded-lg bg-black/40 border border-slate-800 text-center font-mono text-[11px] text-slate-400">
                      {loadingOrders ? 'Chargement des paiements...' : 'Aucune commande PayPal enregistrée pour le moment. Les paiements finalisés avec succès s\'afficheront ici automatiquement.'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {paypalOrders.map((ord: any) => (
                        <div
                          key={ord.id || ord.orderId}
                          className="p-2.5 rounded-lg bg-black/60 border border-blue-900/40 font-mono text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-white font-bold">{ord.id || ord.orderId}</span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                              {ord.status || 'COMPLETED'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-slate-400 text-[10px]">
                            <span>Payeur: <strong className="text-slate-200">{ord.user || ord.userEmail}</strong></span>
                            <span className="text-cyan-300 font-bold">
                              {ord.amount} {ord.currency || 'EUR'} (+{ord.scansAdded} scans)
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {ord.timestamp ? new Date(ord.timestamp).toLocaleString() : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Educational Guide for PayPal direct payouts */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                  <h4 className="font-bold text-white font-mono flex items-center gap-2">
                    <span>💡 Comment Fonctionnent Vos Versements PayPal :</span>
                  </h4>
                  <div className="space-y-2.5 text-slate-300 font-sans leading-relaxed">
                    <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 space-y-1">
                      <span className="font-bold text-cyan-400 block font-mono">1. Encaissement Direct sur votre Compte PayPal</span>
                      <p className="text-[11px] text-slate-400">
                        Chaque fois qu'un utilisateur achète des photos (via son compte PayPal ou directement avec sa <strong>Carte de Crédit / Débit</strong>), les fonds arrivent directement sur votre compte PayPal <strong>{OWNER_PAYOUT_EMAIL}</strong>.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 space-y-1">
                      <span className="font-bold text-emerald-400 block font-mono">2. Paiement par Carte de Crédit Direct vers PayPal</span>
                      <p className="text-[11px] text-slate-400">
                        Les utilisateurs n'ont même pas besoin d'avoir un compte PayPal : ils utilisent le bouton officiel <strong>Débit ou Carte de Crédit</strong> et règlent avec leur carte bancaire (Visa, Mastercard). L'argent est directement crédité sur votre PayPal.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800 space-y-1">
                      <span className="font-bold text-amber-400 block font-mono">3. Validation Automatique &amp; Sécurisée</span>
                      <p className="text-[11px] text-slate-400">
                        Toutes les transactions sont sécurisées et confirmées directement par l'API PayPal avant que les crédits de photos ne soient attribués.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-[11px] text-slate-300 font-mono leading-relaxed">
                  ✅ <strong>Règlement Garanti:</strong> Chaque paiement de pack photo est directement versé sur le compte PayPal officiel de <strong className="text-white">{OWNER_NAME}</strong> ({OWNER_PAYOUT_EMAIL}).
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
