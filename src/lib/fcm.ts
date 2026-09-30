import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import app, { db } from './firebase';

export interface FCMStatus {
  supported: boolean;
  permission: NotificationPermission;
  token: string | null;
  error?: string;
}

/**
 * Request notification permissions and register FCM Push token.
 * Saves the token to both Firestore (/users/{userId}/fcmTokens/{tokenId}) and the backend server.
 */
export async function requestFCMToken(userId?: string): Promise<FCMStatus> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      supported: false,
      permission: 'denied',
      token: null,
      error: 'Push notifications are not supported in this browser.',
    };
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return {
      supported: false,
      permission: Notification.permission,
      token: null,
      error: 'Firebase Cloud Messaging is not supported in this browser context.',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        supported: true,
        permission,
        token: null,
        error: 'Notification permission was not granted by user.',
      };
    }

    // Register service worker if available
    let registration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js').catch((err) => {
        console.warn('Service worker registration note:', err.message);
        return undefined;
      });
    }

    const messaging = getMessaging(app);
    const vapidKey =
      (import.meta as any).env.VITE_FIREBASE_VAPID_KEY ||
      'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuYHIduNpnvBQQy8h_v8A5Tq30';

    const currentToken = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey.startsWith('MY_') ? undefined : vapidKey,
    }).catch((err) => {
      console.warn('Could not generate FCM Web Push token (VAPID key required):', err.message);
      return null;
    });

    if (currentToken) {
      // 1. Send token to server backend
      await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken }),
      }).catch((e) => console.warn('Failed to notify backend of FCM token:', e));

      // 2. Save token to Firestore under user document if user is authenticated
      if (userId) {
        try {
          const tokenDocId = currentToken.slice(0, 32);
          const tokenRef = doc(db, 'users', userId, 'fcmTokens', tokenDocId);
          await setDoc(
            tokenRef,
            {
              token: currentToken,
              platform: 'web',
              userAgent: navigator.userAgent,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (dbErr: any) {
          console.warn('Failed to persist FCM token to Firestore:', dbErr.message);
        }
      }

      return {
        supported: true,
        permission: 'granted',
        token: currentToken,
      };
    }

    return {
      supported: true,
      permission: 'granted',
      token: null,
      error: 'VAPID key required in VITE_FIREBASE_VAPID_KEY for Web Push token generation.',
    };
  } catch (err: any) {
    console.error('Error requesting FCM notification token:', err);
    return {
      supported: true,
      permission: Notification.permission,
      token: null,
      error: err?.message || 'Failed to request notification permission.',
    };
  }
}

/**
 * Setup foreground push notification listener.
 */
export async function listenToForegroundNotifications(onReceive: (payload: any) => void) {
  const supported = await isSupported().catch(() => false);
  if (!supported) return () => {};

  try {
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground push message received:', payload);
      onReceive(payload);
    });
  } catch (e) {
    console.warn('Foreground notification listener setup failed:', e);
    return () => {};
  }
}
