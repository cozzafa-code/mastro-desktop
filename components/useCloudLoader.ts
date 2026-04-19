"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — useCloudLoader hook
// Gestisce: caricamento cloud al mount, visibility change, polling
// Estratto da MastroERP.tsx (Step 2 workflow)
// ═══════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef } from "react";
import { cloudLoadAll as cloudLoadAllSync } from "../components/mastro-sync";

// Demo data per migrazione sistemi (preservato da MastroERP)
const DEMO_GRIGLIE: Record<string, any[]> = {
  "Ideal 4000": [
    {l:600,h:600,prezzo:120},{l:600,h:800,prezzo:145},{l:600,h:1000,prezzo:170},{l:600,h:1200,prezzo:195},
    {l:800,h:800,prezzo:175},{l:800,h:1000,prezzo:205},{l:800,h:1200,prezzo:240},{l:800,h:1400,prezzo:270},
    {l:1000,h:1000,prezzo:250},{l:1000,h:1200,prezzo:290},{l:1000,h:1400,prezzo:330},{l:1000,h:1600,prezzo:370},
    {l:1200,h:1200,prezzo:340},{l:1200,h:1400,prezzo:385},{l:1200,h:1600,prezzo:430},{l:1200,h:1800,prezzo:480},
    {l:1400,h:1400,prezzo:430},{l:1400,h:1600,prezzo:485},{l:1400,h:2200,prezzo:580},
  ],
  "CT70": [
    {l:600,h:800,prezzo:195},{l:600,h:1200,prezzo:260},{l:800,h:1000,prezzo:275},{l:800,h:1400,prezzo:365},
    {l:1000,h:1200,prezzo:380},{l:1000,h:1400,prezzo:440},{l:1200,h:1400,prezzo:520},{l:1200,h:1600,prezzo:580},
    {l:1400,h:2200,prezzo:780},
  ],
};

// ── Types ──
interface CloudSetters {
  setCantieri: (v: any) => void;
  setEvents: (v: any) => void;
  setContatti: (v: any) => void;
  setTasks: (v: any) => void;
  setProblemi: (v: any) => void;
  setTeam: (v: any) => void;
  setAziendaInfo: (v: any) => void;
  setPipelineDB: (v: any) => void;
  setSistemiDB: (v: any) => void;
  setVetriDB: (v: any) => void;
  setColoriDB: (v: any) => void;
  setCoprifiliDB: (v: any) => void;
  setLamiereDB: (v: any) => void;
  setLibreriaDB: (v: any) => void;
  setFattureDB: (v: any) => void;
  setOrdiniFornDB: (v: any) => void;
  setSquadreDB: (v: any) => void;
  setMontaggiDB: (v: any) => void;
}

// ── Hook ──
export function useCloudLoader(
  userId: string | null,
  isUuid: boolean,
  setters: CloudSetters,
) {
  const syncReady = useRef(false);

  // Safety: filtra null/invalidi dagli array
  const safeArr = (arr: any) => Array.isArray(arr) ? arr.filter(x => x && typeof x === "object") : null;
  const sa = (cloud: any, k: string) => safeArr(cloud[k]);

  const applyCloud = useCallback(async () => {
    if (!isUuid) return;
    try {
      const cloud = await cloudLoadAllSync(userId);
      if (Object.keys(cloud).length === 0) return;

      // Cantieri: migrazione .fase
      const safeCantieri = sa(cloud, "cantieri")?.map(c => ({
        fase: "sopralluogo", ...c,
        fase: c.fase === "misure" ? "sopralluogo" : (c.fase || "sopralluogo"),
      })) || null;
      if (safeCantieri) { setters.setCantieri(safeCantieri); localStorage.setItem("mastro:cantieri", JSON.stringify(safeCantieri)); }

      // Array semplici
      const arrayKeys = [
        ["events", setters.setEvents],
        ["contatti", setters.setContatti],
        ["tasks", setters.setTasks],
        ["problemi", setters.setProblemi],
        ["team", setters.setTeam],
        ["pipeline", setters.setPipelineDB],
        ["vetri", setters.setVetriDB],
        ["colori", setters.setColoriDB],
        ["coprifili", setters.setCoprifiliDB],
        ["lamiere", setters.setLamiereDB],
        ["libreria", setters.setLibreriaDB],
        ["fatture", setters.setFattureDB],
        ["ordiniForn", setters.setOrdiniFornDB],
        ["squadre", setters.setSquadreDB],
        ["montaggi", setters.setMontaggiDB],
      ] as const;

      for (const [key, setter] of arrayKeys) {
        const data = sa(cloud, key);
        if (data) { setter(data); localStorage.setItem(`mastro:${key}`, JSON.stringify(data)); }
      }

      // Azienda: oggetto singolo (non array)
      if (cloud.azienda) {
        setters.setAziendaInfo(cloud.azienda);
        localStorage.setItem("mastro:azienda", JSON.stringify(cloud.azienda));
      }

      // Sistemi: migrazione con griglie demo
      if (sa(cloud, "sistemi")) {
        const migrated = sa(cloud, "sistemi")!.map(s => ({
          ...s,
          griglia: s.griglia || DEMO_GRIGLIE[s.sistema] || [],
          minimiMq: s.minimiMq || {},
        }));
        setters.setSistemiDB(migrated);
        localStorage.setItem("mastro:sistemi", JSON.stringify(migrated));
      }

    } catch (e) { console.warn("Cloud sync error:", e); }
  }, [userId, isUuid]);

  // Load from cloud on mount
  useEffect(() => {
    if (!userId) { syncReady.current = true; return; }
    let mounted = true;
    (async () => {
      await applyCloud();
      setTimeout(() => { if (mounted) syncReady.current = true; }, 2000);
    })();
    return () => { mounted = false; };
  }, [userId]);

  // Auto-refresh: visibility change + polling 10s
  useEffect(() => {
    if (!userId) return;
    const onVisible = () => {
      if (!document.hidden && syncReady.current) {
        syncReady.current = false;
        applyCloud().then(() => { syncReady.current = true; });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    const poll = setInterval(() => {
      if (!document.hidden && syncReady.current) applyCloud();
    }, 10000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(poll);
    };
  }, [userId, applyCloud]);

  return { syncReady, applyCloud };
}

// ── Helper per save effects ──
// Usare in MastroERP: persistAndSync(syncReady, isUuid, sync, "key", state)
export function persistAndSync(
  syncReady: React.MutableRefObject<boolean>,
  isUuid: boolean,
  sync: any,
  key: string,
  state: any,
) {
  try { localStorage.setItem(`mastro:${key}`, JSON.stringify(state)); } catch {}
  if (syncReady.current && isUuid) sync.cloudSave(key, state);
}
