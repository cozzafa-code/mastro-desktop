// lib/useNative.ts — Hook per inizializzare features native in React
import { useEffect, useState, useCallback } from 'react';
import {
  isNative,
  platform,
  initNative,
  getNetworkStatus,
  onNetworkChange,
  onAppStateChange,
  onBackButton,
  registerPushNotifications,
  type NetworkStatus,
  type PushToken,
} from './native';

/** Hook principale — inizializza native + monitora stato */
export function useNative() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({ connected: true, connectionType: 'unknown' });
  const [isAppActive, setIsAppActive] = useState(true);
  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    // Init native platform
    initNative();

    // Network monitoring
    getNetworkStatus().then(setNetworkStatus);
    const unsubNetwork = onNetworkChange(setNetworkStatus);

    // App state (foreground/background)
    const unsubAppState = onAppStateChange(setIsAppActive);

    return () => {
      unsubNetwork();
      unsubAppState();
    };
  }, []);

  // Push notifications setup
  const setupPush = useCallback(async (
    onNotification?: (n: any) => void,
    onAction?: (a: any) => void,
  ) => {
    if (!isNative) return false;
    return registerPushNotifications(
      (token) => {
        setPushToken(token.value);
        // TODO: salva token su Supabase per invio push dal server
      },
      onNotification || (() => {}),
      onAction || (() => {}),
    );
  }, []);

  return {
    isNative,
    platform,
    isOnline: networkStatus.connected,
    connectionType: networkStatus.connectionType,
    isAppActive,
    pushToken,
    setupPush,
  };
}

/** Hook per Android back button */
export function useBackButton(handler: () => void) {
  useEffect(() => {
    const unsub = onBackButton(handler);
    return unsub;
  }, [handler]);
}

/** Hook per registrare service worker (PWA) */
export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('✅ Service Worker registered', reg.scope);
        })
        .catch((err) => {
          console.warn('SW registration failed:', err);
        });
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
      return true;
    }
    return false;
  };

  return { isInstalled, canInstall, install };
}
