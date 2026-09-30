import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { Trade, UserSubscription, SubscriptionTier, BillingCycle, FREE_CHART_SCANS_LIMIT, OWNER_PAYOUT_EMAIL, PaymentRecord, AppCurrency } from '../types/trade';
import { INITIAL_TRADES } from '../data/initialData';

export const FREE_TRADE_LIMIT = 3;
export { FREE_CHART_SCANS_LIMIT };

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  trades: Trade[];
  addTrade: (trade: Trade) => Promise<void>;
  isFirebaseActive: boolean;
  authError: string | null;
  subscription: UserSubscription;
  upgradeSubscription: (tier: SubscriptionTier, billingCycle?: BillingCycle) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  isProOrHigher: boolean;
  isInstitutional: boolean;
  tradesRemainingForFree: number;
  canAddTrade: boolean;
  chartScansUsed: number;
  scansPurchased: number;
  totalScansAllowed: number;
  chartScansRemaining: number;
  canScanChart: boolean;
  incrementChartScans: () => Promise<void>;
  addPurchasedScans: (count: number) => Promise<void>;
  isOwner: boolean;
  recordPayment: (payment: Partial<PaymentRecord>) => Promise<void>;
  currency: AppCurrency;
  setCurrency: (c: AppCurrency) => Promise<void>;
  currencySymbol: string;
  formatMoney: (val: number, options?: { showSign?: boolean; decimals?: number }) => string;
}

const DEFAULT_SUBSCRIPTION: UserSubscription = {
  tier: 'free',
  status: 'trialing',
  billingCycle: 'monthly',
  expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  planPrice: 0,
  planName: 'Free Starter Trial',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
  trades: INITIAL_TRADES,
  addTrade: async () => {},
  isFirebaseActive: true,
  authError: null,
  subscription: DEFAULT_SUBSCRIPTION,
  upgradeSubscription: async () => {},
  cancelSubscription: async () => {},
  isProOrHigher: false,
  isInstitutional: false,
  tradesRemainingForFree: FREE_TRADE_LIMIT,
  canAddTrade: true,
  chartScansUsed: 0,
  scansPurchased: 0,
  totalScansAllowed: FREE_CHART_SCANS_LIMIT,
  chartScansRemaining: FREE_CHART_SCANS_LIMIT,
  canScanChart: true,
  incrementChartScans: async () => {},
  addPurchasedScans: async () => {},
  isOwner: false,
  recordPayment: async () => {},
  currency: 'USD',
  setCurrency: async () => {},
  currencySymbol: '$',
  formatMoney: () => '$0.00',
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [trades, setTrades] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem('tj_trades_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse cached trades', e);
    }
    return INITIAL_TRADES;
  });
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize subscription from localStorage if available
  const [subscription, setSubscription] = useState<UserSubscription>(() => {
    try {
      const saved = localStorage.getItem('tj_subscription');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to parse cached subscription', e);
    }
    return DEFAULT_SUBSCRIPTION;
  });

  // Track chart screenshot scans used (starts at 0)
  const [chartScansUsed, setChartScansUsed] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tj_chart_scans_used');
      if (saved !== null) {
        return parseInt(saved, 10) || 0;
      }
    } catch (e) {
      console.warn('Failed to parse cached chart scans used', e);
    }
    return 0;
  });

  // Track purchased extra scans (e.g. +10 pics for 5 EUR)
  const [scansPurchased, setScansPurchased] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('tj_scans_purchased');
      if (saved !== null) {
        return parseInt(saved, 10) || 0;
      }
    } catch (e) {
      console.warn('Failed to parse cached scans purchased', e);
    }
    return 0;
  });

  // User international currency preference: 'USD' or 'EUR'
  const [currency, setCurrencyState] = useState<AppCurrency>(() => {
    try {
      const saved = localStorage.getItem('tj_app_currency');
      if (saved === 'EUR' || saved === 'USD') return saved;
    } catch (e) {
      console.warn('Failed to parse cached currency', e);
    }
    return 'USD';
  });

  const setCurrency = async (newCurr: AppCurrency) => {
    setCurrencyState(newCurr);
    try {
      localStorage.setItem('tj_app_currency', newCurr);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            preferredCurrency: newCurr,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.warn('Failed to persist preferred currency', err);
    }
  };

  const currencySymbol = currency === 'EUR' ? '€' : '$';

  const formatMoney = (val: number, options?: { showSign?: boolean; decimals?: number }) => {
    const decimals = options?.decimals ?? 2;
    const absFormatted = Math.abs(val).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    if (options?.showSign) {
      if (val > 0) {
        return currency === 'EUR' ? `+${absFormatted} €` : `+$${absFormatted}`;
      } else if (val < 0) {
        return currency === 'EUR' ? `-${absFormatted} €` : `-$${absFormatted}`;
      } else {
        return currency === 'EUR' ? `0.00 €` : `$0.00`;
      }
    }
    return currency === 'EUR' ? `${absFormatted} €` : `$${absFormatted}`;
  };

  const totalScansAllowed = FREE_CHART_SCANS_LIMIT + scansPurchased;
  const chartScansRemaining = Math.max(0, totalScansAllowed - chartScansUsed);
  const canScanChart = chartScansRemaining > 0;

  const isProOrHigher = scansPurchased > 0;
  const isInstitutional = false;
  const tradesRemainingForFree = 999999;
  const canAddTrade = true;

  // Check if current user is the owner Sara Oussoussou
  const isOwner = user?.email?.toLowerCase() === OWNER_PAYOUT_EMAIL.toLowerCase();

  const incrementChartScans = async () => {
    const nextCount = chartScansUsed + 1;
    setChartScansUsed(nextCount);
    try {
      localStorage.setItem('tj_chart_scans_used', nextCount.toString());
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          chartScansUsed: nextCount,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Failed to persist chart scans count', err);
    }
  };

  const addPurchasedScans = async (count: number) => {
    const nextPurchased = scansPurchased + count;
    setScansPurchased(nextPurchased);
    try {
      localStorage.setItem('tj_scans_purchased', nextPurchased.toString());
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          scansPurchased: nextPurchased,
          totalScansAllowed: FREE_CHART_SCANS_LIMIT + nextPurchased,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    } catch (err) {
      console.warn('Failed to persist purchased scans count', err);
    }
  };

  const recordPayment = async (paymentData: Partial<PaymentRecord>) => {
    const newRecord: PaymentRecord = {
      id: paymentData.id || `PAY-${Date.now()}`,
      userId: user?.uid || 'guest-trader',
      payerEmail: user?.email || paymentData.payerEmail || 'anonymous@trader.internal',
      amount: paymentData.amount || 5,
      currency: paymentData.currency || currency,
      scansAdded: paymentData.scansAdded || 10,
      packId: paymentData.packId || 'pack_10',
      plan: 'pro',
      billingCycle: 'monthly',
      recipientEmail: OWNER_PAYOUT_EMAIL,
      recipientName: 'Sara Oussoussou',
      paymentMethod: paymentData.paymentMethod || 'card',
      transactionId: paymentData.transactionId || `TX-${Date.now()}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    try {
      // Save locally
      const existingPayments: PaymentRecord[] = JSON.parse(localStorage.getItem('tj_merchant_payments') || '[]');
      existingPayments.unshift(newRecord);
      localStorage.setItem('tj_merchant_payments', JSON.stringify(existingPayments));

      // Persist to user's payment ledger in Firestore if logged in
      if (user) {
        const payRef = doc(db, 'users', user.uid, 'payments', newRecord.id);
        await setDoc(payRef, newRecord);
      }
    } catch (err) {
      console.error('Failed to log payment transaction to Firestore:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        // Sync user profile to Firestore
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            if (typeof data.chartScansUsed === 'number') {
              setChartScansUsed(data.chartScansUsed);
              localStorage.setItem('tj_chart_scans_used', data.chartScansUsed.toString());
            }
            if (typeof data.scansPurchased === 'number') {
              setScansPurchased(data.scansPurchased);
              localStorage.setItem('tj_scans_purchased', data.scansPurchased.toString());
            }
            if (data.preferredCurrency === 'EUR' || data.preferredCurrency === 'USD') {
              setCurrencyState(data.preferredCurrency);
              localStorage.setItem('tj_app_currency', data.preferredCurrency);
            }
            if (data.subscriptionTier) {
              const cloudSub: UserSubscription = {
                tier: data.subscriptionTier || 'free',
                status: data.subscriptionStatus || 'trialing',
                billingCycle: data.billingCycle || 'monthly',
                expiresAt: data.subscriptionExpiresAt || new Date().toISOString(),
                planPrice: data.planPrice || 0,
                planName:
                  data.subscriptionTier === 'institutional'
                    ? 'Institutional Desk'
                    : data.subscriptionTier === 'pro'
                    ? 'Pro Trader'
                    : 'Free Starter Trial',
              };
              setSubscription(cloudSub);
              localStorage.setItem('tj_subscription', JSON.stringify(cloudSub));
            }
          } else {
            // First time user setup in Firestore
            await setDoc(
              userDocRef,
              {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                subscriptionTier: subscription.tier,
                subscriptionStatus: subscription.status,
                billingCycle: subscription.billingCycle,
                subscriptionExpiresAt: subscription.expiresAt,
                planPrice: subscription.planPrice,
                chartScansUsed: chartScansUsed,
                payoutRecipient: OWNER_PAYOUT_EMAIL,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
              },
              { merge: true }
            );
          }

          // Listen to user trades from Firestore
          const tradesQuery = query(
            collection(db, 'users', currentUser.uid, 'trades'),
            orderBy('createdAt', 'desc')
          );

          const unsubTrades = onSnapshot(tradesQuery, (snapshot) => {
            if (!snapshot.empty) {
              const loadedTrades: Trade[] = snapshot.docs.map((docSnap) => ({
                ...(docSnap.data() as Trade),
                id: docSnap.id,
              }));
              setTrades(loadedTrades);
            } else {
              setTrades(INITIAL_TRADES);
            }
          });

          return () => unsubTrades();
        } catch (err) {
          console.error('Error syncing user profile or trades with Firestore:', err);
        }
      } else {
        setTrades(INITIAL_TRADES);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Google Sign-in failed:', error);
      setAuthError(error?.message || 'Sign in error');
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign-out failed:', error);
      setAuthError(error?.message || 'Sign out error');
    }
  };

  const upgradeSubscription = async (
    tier: SubscriptionTier,
    billingCycle: BillingCycle = 'monthly'
  ) => {
    const prices: Record<string, number> = {
      free: 0,
      pro: billingCycle === 'monthly' ? 29 : 279,
      institutional: billingCycle === 'monthly' ? 99 : 899,
      pack_10: 5,
      pack_25: 10,
      pack_60: 20,
    };

    const newSub: UserSubscription = {
      tier,
      status: 'active',
      billingCycle,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      planPrice: prices[tier] || 0,
      planName:
        tier === 'institutional'
          ? 'Institutional Desk'
          : tier === 'pro'
          ? 'Pro Trader'
          : tier === 'pack_10'
          ? '+10 Picture Analyses'
          : tier === 'pack_25'
          ? '+25 Picture Analyses'
          : tier === 'pack_60'
          ? '+60 Picture Analyses'
          : 'Free Starter Trial',
    };

    setSubscription(newSub);
    localStorage.setItem('tj_subscription', JSON.stringify(newSub));

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            subscriptionTier: newSub.tier,
            subscriptionStatus: newSub.status,
            billingCycle: newSub.billingCycle,
            subscriptionExpiresAt: newSub.expiresAt,
            planPrice: newSub.planPrice,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Failed to persist subscription upgrade to Firestore:', err);
      }
    }
  };

  const cancelSubscription = async () => {
    const canceledSub: UserSubscription = {
      tier: 'free',
      status: 'canceled',
      billingCycle: 'monthly',
      expiresAt: new Date().toISOString(),
      planPrice: 0,
      planName: 'Free Starter Trial',
    };

    setSubscription(canceledSub);
    localStorage.setItem('tj_subscription', JSON.stringify(canceledSub));

    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            subscriptionTier: 'free',
            subscriptionStatus: 'canceled',
            planPrice: 0,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.error('Failed to persist subscription cancellation to Firestore:', err);
      }
    }
  };

  const addTrade = async (newTrade: Trade) => {
    setTrades((prev) => {
      const updated = [newTrade, ...prev];
      try {
        localStorage.setItem('tj_trades_list', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to cache trades list', e);
      }
      return updated;
    });

    if (user) {
      try {
        const tradeRef = doc(db, 'users', user.uid, 'trades', newTrade.id);
        const payload = {
          ...newTrade,
          userId: user.uid,
          createdAt: new Date().toISOString(),
        };
        await setDoc(tradeRef, payload);
      } catch (err) {
        console.error('Error writing trade to Firestore:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        logout,
        trades,
        addTrade,
        isFirebaseActive: true,
        authError,
        subscription,
        upgradeSubscription,
        cancelSubscription,
        isProOrHigher,
        isInstitutional,
        tradesRemainingForFree,
        canAddTrade,
        chartScansUsed,
        scansPurchased,
        totalScansAllowed,
        chartScansRemaining,
        canScanChart,
        incrementChartScans,
        addPurchasedScans,
        isOwner,
        recordPayment,
        currency,
        setCurrency,
        currencySymbol,
        formatMoney,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

