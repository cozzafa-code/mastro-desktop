// ═══════════════════════════════════════════════════════════
// MASTRO ERP — useOfflineCache
// Cache IndexedDB per commesse attive (offline-first)
// ═══════════════════════════════════════════════════════════

import { useEffect, useCallback, useRef } from "react";

const DB_NAME = "mastro_offline";
const DB_VERSION = 1;
const STORE_CANTIERI = "cantieri";
const STORE_META = "meta";

const openDB = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CANTIERI))
        db.createObjectStore(STORE_CANTIERI, { keyPath: "id" });
      if (!db.objectStoreNames.contains(STORE_META))
        db.createObjectStore(STORE_META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror  = () => reject(req.error);
  });

export const idbGetCantieri = async (): Promise<any[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(STORE_CANTIERI, "readonly");
      const req = tx.objectStore(STORE_CANTIERI).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror   = () => reject(req.error);
    });
  } catch { return []; }
};

export const idbSaveCantieri = async (cantieri: any[]): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE_CANTIERI, "readwrite");
      const store = tx.objectStore(STORE_CANTIERI);
      store.clear();
      cantieri.forEach((c) => store.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } catch (e) { console.warn("[mastro:idb] save failed", e); }
};

export const idbPutCantiere = async (cantiere: any): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CANTIERI, "readwrite");
      tx.objectStore(STORE_CANTIERI).put(cantiere);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => reject(tx.error);
    });
  } catch (e) { console.warn("[mastro:idb] put failed", e); }
};

const idbSetLastSync = async (ts: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_META, "readwrite");
      tx.objectStore(STORE_META).put(ts, "lastSync");
      tx.oncomplete = () => resolve();
    });
  } catch {}
};

export const idbGetLastSync = async (): Promise<string | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx  = db.transaction(STORE_META, "readonly");
      const req = tx.objectStore(STORE_META).get("lastSync");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => resolve(null);
    });
  } catch { return null; }
};

export const useOfflineCache = (
  cantieri: any[],
  setCantieri: (c: any[]) => void,
  isReady = true
) => {
  const initialized = useRef(false);

  // Mount: carica da IDB se cantieri vuoto
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    idbGetCantieri().then((cached) => {
      if (cached.length > 0) {
        setCantieri(cached);
        console.log(`[mastro:idb] ${cached.length} cantieri caricati offline`);
      }
    });
  }, []);

  // Salva su IDB quando cantieri cambia
  useEffect(() => {
    if (!isReady || cantieri.length === 0) return;
    idbSaveCantieri(cantieri).then(() => idbSetLastSync(new Date().toISOString()));
  }, [cantieri, isReady]);

  const loadFromCache = useCallback(async () => {
    const cached = await idbGetCantieri();
    if (cached.length > 0) setCantieri(cached);
    return cached;
  }, [setCantieri]);

  const getCacheInfo = useCallback(async () => {
    const lastSync = await idbGetLastSync();
    const cached   = await idbGetCantieri();
    return { lastSync, count: cached.length };
  }, []);

  return { loadFromCache, getCacheInfo };
};

export default useOfflineCache;
