// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase in Service Worker
// Automatically uses the project's config
const firebaseConfig = {
  apiKey: "AIzaSyCb7Dxc6BmVINeMEloov-ouOwSWPvofu1w",
  authDomain: "formal-diagram-d8chg.firebaseapp.com",
  projectId: "formal-diagram-d8chg",
  storageBucket: "formal-diagram-d8chg.firebasestorage.app",
  messagingSenderId: "411006325751",
  appId: "1:411006325751:web:90d10afe4af1c17d19d4f2"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'Trading Signal Alert';
  const options = {
    body: payload.notification?.body || payload.data?.body || 'New institutional market signal detected.',
    icon: '/icon.png',
    badge: '/badge.png',
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});
