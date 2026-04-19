"use client";
// @ts-nocheck
// ================================================================
// MASTRO ERP — useRealtimeSync hook
// Ascolta canali Supabase realtime su tabelle abilitate e chiama
// onRemoteChange() con debounce 500ms per ricaricare i dati.
//
// Regole rispettate:
// - File < 300 righe
// - Neutro: non tocca UI, serve sia mobile che desktop allo stesso modo
// - Zero modifiche a useCloudLoader, persistAndSync, altri hook
// - Rispetta flag cleanSlate come useCloudLoader
// ================================================================
import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Tabelle Supabase con Realtime abilitato (16 apr 2026)
const REALTIME_TABLES = [
  // Attivate il 16 aprile
  "commesse",
  "contatti",
  "eventi",
  "tasks",
  "messaggi",
  "fin_fatture_emesse",
  "fin_fatture_ricevute",
  "ordini_fornitore",
  "squadre",
  // Gia attive da prima
  "montaggi",
  "task_montaggi",
  "firma_collaudo",
  "comunicazioni_commessa",
  "eventi_calendario_montaggi",
  "fasi_produzione",
  "lavorazioni_commessa",
  "rilievi_montaggi",
];

/**
 * Sottoscrive canali Supabase Realtime e invoca onRemoteChange (debounced)
 * quando qualsiasi tabella cambia.
 *
 * @param userId - id utente (usato come chiave canali). Se null, hook dormiente.
 * @param onRemoteChange - callback da chiamare al cambio remoto (es. applyCloud)
 * @param enabled - master switch (default true)
 */
export function useRealtimeSync(
  userId: string | null,
  onRemoteChange: () => void | Promise<void>,
  enabled: boolean = true,
) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelsRef = useRef<any[]>([]);

  useEffect(() => {
    // Guardie di sicurezza
    if (!enabled) return;
    if (!userId) return;
    if (!supabaseUrl || !supabaseKey) return;

    // Rispetta flag cleanSlate (coerente con useCloudLoader)
    if (typeof window !== "undefined" && localStorage.getItem("mastro:cleanSlate") === "true") {
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Debounced callback: raggruppa eventi in raffica
    const triggerReload = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        try {
          const r = onRemoteChange();
          if (r && typeof (r as any).catch === "function") {
            (r as Promise<void>).catch((e) => console.warn("[realtime] onRemoteChange error:", e));
          }
        } catch (e) {
          console.warn("[realtime] onRemoteChange error:", e);
        }
      }, 500);
    };

    // Sottoscrive ogni tabella
    REALTIME_TABLES.forEach((table) => {
      try {
        const channel = supabase
          .channel(`rt-${table}-${userId}`)
          .on(
            "postgres_changes" as any,
            { event: "*", schema: "public", table },
            (_payload: any) => triggerReload(),
          )
          .subscribe();
        channelsRef.current.push(channel);
      } catch (e) {
        console.warn(`[realtime] subscribe ${table} failed:`, e);
      }
    });

    // Cleanup
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      channelsRef.current.forEach((ch) => {
        try { supabase.removeChannel(ch); } catch {}
      });
      channelsRef.current = [];
    };
  }, [userId, enabled]);
}
