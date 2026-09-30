import React, { useEffect, useRef, useState } from 'react';
import { loadScript } from '@paypal/paypal-js';
import { Lock, CheckCircle2, AlertCircle, RotateCcw, CreditCard, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PICTURE_PACKS, PicturePack, AppCurrency } from '../../types/trade';

interface PayPalButtonProps {
  pack?: PicturePack;
  currency?: AppCurrency;
  onSuccess?: (details: { orderId: string; scansAdded: number; amount: number; currency: string }) => void;
  onError?: (errorMsg: string) => void;
  compact?: boolean;
  buttonLabel?: 'paypal' | 'checkout' | 'buynow' | 'pay';
  customTitle?: string;
}

export const PayPalButtonComponent: React.FC<PayPalButtonProps> = ({
  pack = PICTURE_PACKS[0], // Defaults to 'pack_10'
  currency: propCurrency,
  onSuccess,
  onError,
  compact = false,
  buttonLabel = 'pay',
  customTitle,
}) => {
  const { user, addPurchasedScans, recordPayment, currency: appCurrency } = useAuth();
  const activeCurrency: AppCurrency = propCurrency || appCurrency || 'USD';
  const packPrice = activeCurrency === 'EUR' ? pack.priceEUR : pack.priceUSD;
  const containerRef = useRef<HTMLDivElement>(null);

  const [loadingConfig, setLoadingConfig] = useState(true);
  const [paypalConfig, setPaypalConfig] = useState<{ isConfigured: boolean; clientId: string | null } | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{
    orderId: string;
    amount: number;
    currency: string;
    scansAdded: number;
    timestamp: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fetch PayPal client configuration from server proxy
  useEffect(() => {
    let isMounted = true;
    fetch('/api/paypal/config')
      .then((r) => r.json())
      .then((data) => {
        if (isMounted) {
          setPaypalConfig(data);
          setLoadingConfig(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('[PayPal] Failed to fetch PayPal config:', err);
          setPaypalConfig({ isConfigured: false, clientId: null });
          setLoadingConfig(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load the official PayPal JS SDK and render official Smart Buttons
  useEffect(() => {
    if (!paypalConfig?.isConfigured || !paypalConfig.clientId || !containerRef.current) {
      return;
    }

    let isMounted = true;
    containerRef.current.innerHTML = '';

    loadScript({
      clientId: paypalConfig.clientId,
      currency: activeCurrency,
      intent: 'capture',
    })
      .then((paypal) => {
        if (!isMounted || !paypal || !paypal.Buttons || !containerRef.current) return;

        setSdkLoaded(true);

        paypal
          .Buttons({
            style: {
              layout: 'vertical',
              color: 'gold',
              shape: 'rect',
              label: buttonLabel,
              height: compact ? 36 : 42,
            },
            createOrder: async () => {
              setErrorMessage(null);
              try {
                const res = await fetch('/api/paypal/create-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    packId: pack.id,
                    amount: packPrice.toFixed(2),
                    currency: activeCurrency,
                    planName: pack.name,
                    userId: user?.uid || 'guest-trader',
                    userEmail: user?.email || 'trader@client',
                    scansCount: pack.scansCount,
                  }),
                });

                const data = await res.json();
                if (!res.ok || !data.id) {
                  throw new Error(data.error || 'Failed to initialize PayPal order');
                }

                return data.id;
              } catch (err: any) {
                console.error('[PayPal] Order creation error:', err);
                setErrorMessage(err.message || 'Error creating PayPal order');
                onError?.(err.message || 'Error creating PayPal order');
                throw err;
              }
            },
            onApprove: async (data: any) => {
              setIsCapturing(true);
              setErrorMessage(null);

              try {
                const captureRes = await fetch('/api/paypal/capture-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    orderId: data.orderID,
                    userId: user?.uid || 'guest-trader',
                    userEmail: user?.email || 'trader@client',
                    packId: pack.id,
                    scansCount: pack.scansCount,
                  }),
                });

                const captureData = await captureRes.json();

                // Strict check: only unlock if PayPal confirmed COMPLETED
                if (!captureRes.ok || captureData.status !== 'COMPLETED') {
                  throw new Error(
                    captureData.error ||
                      `PayPal status: ${captureData.status || 'Incomplete'}. Unlocking cancelled.`
                  );
                }

                // Unlock credits now that backend confirmed status === 'COMPLETED'
                const scansAdded = captureData.scansAdded || pack.scansCount;
                await addPurchasedScans(scansAdded);

                const finalPaidAmount = captureData.amount || packPrice;
                const finalPaidCurrency = captureData.currency || activeCurrency;

                // Record transaction
                await recordPayment({
                  amount: finalPaidAmount,
                  currency: finalPaidCurrency,
                  scansAdded,
                  packId: pack.id,
                  paymentMethod: 'paypal',
                  transactionId: captureData.orderId || data.orderID,
                  payerEmail: captureData.user || user?.email,
                });

                const successPayload = {
                  orderId: captureData.orderId || data.orderID,
                  amount: finalPaidAmount,
                  currency: finalPaidCurrency,
                  scansAdded,
                  timestamp: captureData.timestamp || new Date().toISOString(),
                };

                setPaymentSuccess(successPayload);
                setIsCapturing(false);
                onSuccess?.(successPayload);
              } catch (err: any) {
                console.error('[PayPal] Capture error:', err);
                setIsCapturing(false);
                setErrorMessage(err.message || 'Failed to complete payment');
                onError?.(err.message || 'Failed to complete payment');
              }
            },
            onError: (err: any) => {
              console.error('[PayPal SDK Error]:', err);
              setErrorMessage('PayPal encountered an error processing transaction. Please retry.');
              onError?.('PayPal window closed or encountered an error.');
            },
            onCancel: () => {
              setErrorMessage('PayPal transaction was cancelled.');
            },
          })
          .render(containerRef.current)
          .catch((err) => {
            console.error('[PayPal Render Error]:', err);
            if (isMounted) {
              setErrorMessage('Unable to initialize PayPal buttons.');
            }
          });
      })
      .catch((err) => {
        console.error('[PayPal Script Load Error]:', err);
        if (isMounted) {
          setErrorMessage('Failed to load official PayPal JS SDK.');
        }
      });

    return () => {
      isMounted = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [
    paypalConfig?.isConfigured,
    paypalConfig?.clientId,
    pack.id,
    packPrice,
    activeCurrency,
    pack.scansCount,
    buttonLabel,
    compact,
  ]);

  if (loadingConfig) {
    return (
      <div className="flex items-center justify-center p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 font-mono gap-2">
        <RotateCcw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
        <span>Loading PayPal Gateway...</span>
      </div>
    );
  }

  // If payment succeeded
  if (paymentSuccess) {
    return (
      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs font-mono space-y-2 animate-in fade-in">
        <div className="flex items-center gap-2 font-bold text-white">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Payment Verified &amp; Completed!</span>
        </div>
        <p className="text-[11px] text-slate-200">
          +{paymentSuccess.scansAdded} Picture Analyses added to your balance.
        </p>
        <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-emerald-500/20">
          <span>Order ID: {paymentSuccess.orderId}</span>
          <span className="text-emerald-400 font-bold">
            {paymentSuccess.amount} {paymentSuccess.currency}
          </span>
        </div>
      </div>
    );
  }

  const defaultTitle = `Pay As You Go: ${
    activeCurrency === 'EUR' ? `${pack.priceEUR} €` : `$${pack.priceUSD}`
  } for +${pack.scansCount} Pictures`;

  return (
    <div className="space-y-2">
      {/* Header Badge */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
              <span>{customTitle || defaultTitle}</span>
            </span>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
            Sandbox Active
          </span>
        </div>
      )}

      {/* Capturing Overlay */}
      {isCapturing && (
        <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Verifying COMPLETED status with PayPal...</span>
        </div>
      )}

      {/* Not configured notice if keys are missing */}
      {!paypalConfig?.isConfigured ? (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2 font-mono">
          <div className="flex items-center gap-2 font-bold text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>PayPal Credentials Required</span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            Please configure <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">PAYPAL_CLIENT_ID</code> and <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">PAYPAL_CLIENT_SECRET</code> in the AI Studio Secrets panel to enable instant PayPal checkout.
          </p>
        </div>
      ) : (
        /* The Official PayPal JS SDK Button Container */
        <div className="relative min-h-[42px]">
          <div ref={containerRef} className="w-full z-10" />
          {!sdkLoaded && !isCapturing && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono gap-2">
              <RotateCcw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Initializing PayPal Button...</span>
            </div>
          )}
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span className="text-[11px]">{errorMessage}</span>
        </div>
      )}

      {!compact && (
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>Official PayPal REST Orders API v2</span>
          </span>
          <span>Instant Crediting</span>
        </div>
      )}
    </div>
  );
};
