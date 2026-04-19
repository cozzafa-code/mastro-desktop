// lib/native.ts — Bridge between app and native Capacitor plugins
// Falls back gracefully to web APIs when not running in native shell

import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Network } from '@capacitor/network';
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { Preferences } from '@capacitor/preferences';

// ─── Platform Detection ─────────────────────────────────────
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
export const isIOS = platform === 'ios';
export const isAndroid = platform === 'android';
export const isWeb = platform === 'web';

// ─── Camera ─────────────────────────────────────────────────
export interface PhotoResult {
  dataUrl: string;
  format: string;
  path?: string;
}

/** Scatta foto dal cantiere — usa camera nativa su mobile, input file su web */
export async function takePhoto(source: 'camera' | 'gallery' = 'camera'): Promise<PhotoResult | null> {
  try {
    if (isNative) {
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        direction: CameraDirection.Rear,
        width: 1920,
        height: 1080,
        correctOrientation: true,
      });
      return {
        dataUrl: image.dataUrl!,
        format: image.format,
        path: image.path,
      };
    } else {
      // Web fallback — file input
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        if (source === 'camera') input.capture = 'environment';
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return resolve(null);
          const reader = new FileReader();
          reader.onload = () => resolve({
            dataUrl: reader.result as string,
            format: file.type.split('/')[1] || 'jpeg',
          });
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }
  } catch (e) {
    console.error('Camera error:', e);
    return null;
  }
}

/** Seleziona multiple foto dalla galleria */
export async function pickPhotos(limit = 10): Promise<PhotoResult[]> {
  try {
    if (isNative) {
      const result = await Camera.pickImages({
        quality: 85,
        width: 1920,
        height: 1080,
        limit,
      });
      return result.photos.map(p => ({
        dataUrl: p.webPath || '',
        format: p.format,
        path: p.path,
      }));
    } else {
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.multiple = true;
        input.onchange = async () => {
          const files = Array.from(input.files || []).slice(0, limit);
          const results: PhotoResult[] = [];
          for (const file of files) {
            const reader = new FileReader();
            const dataUrl = await new Promise<string>(r => {
              reader.onload = () => r(reader.result as string);
              reader.readAsDataURL(file);
            });
            results.push({ dataUrl, format: file.type.split('/')[1] || 'jpeg' });
          }
          resolve(results);
        };
        input.click();
      });
    }
  } catch (e) {
    console.error('Pick photos error:', e);
    return [];
  }
}

// ─── File System ────────────────────────────────────────────

/** Salva file localmente (offline cache) */
export async function saveFileLocally(filename: string, data: string, isBase64 = false): Promise<string | null> {
  try {
    if (isNative) {
      const result = await Filesystem.writeFile({
        path: `mastro/${filename}`,
        data,
        directory: Directory.Data,
        encoding: isBase64 ? undefined : Encoding.UTF8,
        recursive: true,
      });
      return result.uri;
    } else {
      // Web fallback — localStorage or IndexedDB
      localStorage.setItem(`mastro_file_${filename}`, data);
      return filename;
    }
  } catch (e) {
    console.error('Save file error:', e);
    return null;
  }
}

/** Leggi file locale */
export async function readLocalFile(filename: string): Promise<string | null> {
  try {
    if (isNative) {
      const result = await Filesystem.readFile({
        path: `mastro/${filename}`,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return typeof result.data === 'string' ? result.data : null;
    } else {
      return localStorage.getItem(`mastro_file_${filename}`);
    }
  } catch (e) {
    return null;
  }
}

/** Elimina file locale */
export async function deleteLocalFile(filename: string): Promise<void> {
  try {
    if (isNative) {
      await Filesystem.deleteFile({
        path: `mastro/${filename}`,
        directory: Directory.Data,
      });
    } else {
      localStorage.removeItem(`mastro_file_${filename}`);
    }
  } catch (e) {
    console.error('Delete file error:', e);
  }
}

// ─── Share ───────────────────────────────────────────────────

/** Condividi preventivo/documento */
export async function shareContent(opts: {
  title?: string;
  text?: string;
  url?: string;
  files?: string[]; // file paths for native
}): Promise<boolean> {
  try {
    if (isNative) {
      await Share.share({
        title: opts.title,
        text: opts.text,
        url: opts.url,
        dialogTitle: opts.title || 'Condividi da MASTRO',
      });
      return true;
    } else if (navigator.share) {
      await navigator.share({
        title: opts.title,
        text: opts.text,
        url: opts.url,
      });
      return true;
    } else {
      // Fallback: copy to clipboard
      const content = opts.url || opts.text || '';
      await navigator.clipboard.writeText(content);
      return true;
    }
  } catch (e) {
    console.error('Share error:', e);
    return false;
  }
}

// ─── Push Notifications ──────────────────────────────────────

export interface PushToken {
  value: string;
  platform: string;
}

/** Registra per push notifications */
export async function registerPushNotifications(
  onToken: (token: PushToken) => void,
  onNotification: (notification: any) => void,
  onAction: (action: any) => void,
): Promise<boolean> {
  if (!isNative) {
    console.log('Push notifications solo su native');
    return false;
  }

  try {
    // Richiedi permessi
    const permResult = await PushNotifications.requestPermissions();
    if (permResult.receive !== 'granted') {
      console.warn('Push permission denied');
      return false;
    }

    // Registra
    await PushNotifications.register();

    // Token ricevuto
    PushNotifications.addListener('registration', (token) => {
      console.log('Push token:', token.value);
      onToken({ value: token.value, platform });
    });

    // Errore registrazione
    PushNotifications.addListener('registrationError', (err) => {
      console.error('Push registration error:', err);
    });

    // Notifica ricevuta (app in foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received:', notification);
      onNotification(notification);
    });

    // Utente ha tappato sulla notifica
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('Push action:', action);
      onAction(action);
    });

    return true;
  } catch (e) {
    console.error('Push setup error:', e);
    return false;
  }
}

// ─── Network ─────────────────────────────────────────────────

export interface NetworkStatus {
  connected: boolean;
  connectionType: string;
}

/** Stato connessione attuale */
export async function getNetworkStatus(): Promise<NetworkStatus> {
  try {
    const status = await Network.getStatus();
    return {
      connected: status.connected,
      connectionType: status.connectionType,
    };
  } catch {
    return { connected: navigator.onLine, connectionType: 'unknown' };
  }
}

/** Ascolta cambi di connessione */
export function onNetworkChange(callback: (status: NetworkStatus) => void): () => void {
  if (isNative) {
    const listener = Network.addListener('networkStatusChange', (status) => {
      callback({ connected: status.connected, connectionType: status.connectionType });
    });
    return () => { listener.then(l => l.remove()); };
  } else {
    const onOnline = () => callback({ connected: true, connectionType: 'wifi' });
    const onOffline = () => callback({ connected: false, connectionType: 'none' });
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
}

// ─── Haptics ─────────────────────────────────────────────────

/** Vibrazione leggera — feedback touch */
export async function hapticLight() {
  if (isNative) await Haptics.impact({ style: ImpactStyle.Light });
}

/** Vibrazione media — conferma azione */
export async function hapticMedium() {
  if (isNative) await Haptics.impact({ style: ImpactStyle.Medium });
}

/** Vibrazione pesante — attenzione */
export async function hapticHeavy() {
  if (isNative) await Haptics.impact({ style: ImpactStyle.Heavy });
}

/** Vibrazione successo */
export async function hapticSuccess() {
  if (isNative) await Haptics.notification({ type: NotificationType.Success });
}

/** Vibrazione errore */
export async function hapticError() {
  if (isNative) await Haptics.notification({ type: NotificationType.Error });
}

// ─── Status Bar ──────────────────────────────────────────────

/** Configura status bar per MASTRO (dark topbar) */
export async function setupStatusBar() {
  if (!isNative) return;
  try {
    await StatusBar.setBackgroundColor({ color: '#1A1A1C' });
    await StatusBar.setStyle({ style: StatusBarStyle.Dark });
  } catch (e) {
    console.error('StatusBar error:', e);
  }
}

/** Nascondi status bar (fullscreen — es. disegno) */
export async function hideStatusBar() {
  if (isNative) await StatusBar.hide();
}

/** Mostra status bar */
export async function showStatusBar() {
  if (isNative) await StatusBar.show();
}

// ─── Keyboard ────────────────────────────────────────────────

/** Ascolta apertura/chiusura tastiera */
export function onKeyboardChange(
  onShow: (height: number) => void,
  onHide: () => void,
): () => void {
  if (!isNative) return () => {};
  
  const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
    onShow(info.keyboardHeight);
  });
  const hideListener = Keyboard.addListener('keyboardWillHide', () => {
    onHide();
  });

  return () => {
    showListener.then(l => l.remove());
    hideListener.then(l => l.remove());
  };
}

// ─── App Lifecycle ───────────────────────────────────────────

/** Ascolta back button (Android) */
export function onBackButton(callback: () => void): () => void {
  if (!isNative) return () => {};
  const listener = App.addListener('backButton', () => callback());
  return () => { listener.then(l => l.remove()); };
}

/** Ascolta app state (foreground/background) */
export function onAppStateChange(callback: (isActive: boolean) => void): () => void {
  if (!isNative) return () => {};
  const listener = App.addListener('appStateChange', (state) => {
    callback(state.isActive);
  });
  return () => { listener.then(l => l.remove()); };
}

/** Deep link handler */
export function onDeepLink(callback: (url: string) => void): () => void {
  if (!isNative) return () => {};
  const listener = App.addListener('appUrlOpen', (event) => {
    callback(event.url);
  });
  return () => { listener.then(l => l.remove()); };
}

// ─── Splash Screen ───────────────────────────────────────────

export async function hideSplash() {
  if (isNative) await SplashScreen.hide();
}

// ─── Local Preferences (Key-Value) ──────────────────────────

/** Salva preferenza locale */
export async function setPreference(key: string, value: string): Promise<void> {
  if (isNative) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

/** Leggi preferenza locale */
export async function getPreference(key: string): Promise<string | null> {
  if (isNative) {
    const { value } = await Preferences.get({ key });
    return value;
  } else {
    return localStorage.getItem(key);
  }
}

/** Rimuovi preferenza locale */
export async function removePreference(key: string): Promise<void> {
  if (isNative) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}

// ─── Offline Queue ───────────────────────────────────────────

interface QueuedAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

const QUEUE_KEY = 'mastro_offline_queue';

/** Aggiungi azione alla coda offline */
export async function queueOfflineAction(action: Omit<QueuedAction, 'id' | 'timestamp'>): Promise<void> {
  const queue = await getOfflineQueue();
  queue.push({
    ...action,
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
  });
  await setPreference(QUEUE_KEY, JSON.stringify(queue));
}

/** Leggi coda offline */
export async function getOfflineQueue(): Promise<QueuedAction[]> {
  const raw = await getPreference(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

/** Svuota coda dopo sync */
export async function clearOfflineQueue(): Promise<void> {
  await removePreference(QUEUE_KEY);
}

/** Rimuovi singola azione dalla coda */
export async function removeFromQueue(actionId: string): Promise<void> {
  const queue = await getOfflineQueue();
  const filtered = queue.filter(a => a.id !== actionId);
  await setPreference(QUEUE_KEY, JSON.stringify(filtered));
}

// ─── Init Native ─────────────────────────────────────────────

/** Chiama all'avvio dell'app per configurare tutto */
export async function initNative() {
  if (!isNative) return;

  // Status bar MASTRO style
  await setupStatusBar();

  // Nascondi splash dopo init
  setTimeout(() => hideSplash(), 500);

  // Log platform
  console.log(`🔧 MASTRO running on ${platform}`);
}
