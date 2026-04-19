"use client";
// @ts-nocheck
// ================================================================
// MASTRO ERP — useTeamOps hook (TEAM OS v2)
// Legge: operatori, missioni, anomalie, performance_operatore,
//        gps_snapshots, log_eventi
// Schema reale Supabase (16 apr):
//   gps_snapshots.pingato_at (NO created_at)
//   anomalie: severita / stato='aperta' / titolo (NO gravita/risolto)
//   missioni.stato default 'da_assegnare'
// File < 300 righe.
// ================================================================
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

const OFFLINE_SOGLIA_MIN = 30;
const STATI_CHIUSI = ["completata", "fallita", "annullata"];
const STATI_ANOMALIA_APERTI = ["aperta", "vista", "in_lavorazione"];

export interface Operatore {
  id: string; azienda_id?: string;
  nome: string; cognome?: string; ruolo?: string;
  telefono?: string; email?: string; attivo?: boolean;
  colore?: string; avatar_url?: string; ultimo_accesso?: string;
  stato_live?: "disponibile" | "occupato" | "ritardo" | "offline";
  ultima_posizione?: { lat: number; lng: number; at: string } | null;
  missioni_attive?: number;
  missione_corrente?: any;
}

export interface Missione {
  id: string; azienda_id?: string;
  titolo: string; descrizione?: string; tipologia?: string;
  commessa_id?: string; cliente_id?: string;
  luogo_nome?: string; luogo_indirizzo?: string; luogo_citta?: string;
  luogo_lat?: number; luogo_lng?: number;
  scadenza_at?: string; durata_stimata_minuti?: number;
  priorita?: number; urgente?: boolean; motivo_urgenza?: string;
  materiali_richiesti?: any; note_operative?: string;
  assegnato_a?: string; squadra_id?: string;
  assegnato_da?: string; assegnato_at?: string;
  operatori_proposti?: any;
  stato?: string;
  accettata_at?: string; iniziata_at?: string; completata_at?: string;
  durata_reale_minuti?: number;
  richiede_foto?: boolean; richiede_firma?: boolean; richiede_checklist?: boolean;
  created_at?: string;
}

export interface Anomalia {
  id: string; azienda_id?: string;
  tipo?: string; severita?: string; titolo?: string; descrizione?: string;
  operatore_id?: string; missione_id?: string; commessa_id?: string;
  stato?: string;
  rilevata_at?: string; risolta_at?: string;
  azione_suggerita?: string;
}

export interface LogEvento {
  id: string; azienda_id?: string; operatore_id?: string;
  tipo_evento: string; descrizione?: string;
  missione_id?: string; commessa_id?: string;
  lat?: number; lng?: number; luogo_descrizione?: string;
  dati?: any; evento_at?: string; origine?: string; dispositivo?: string;
}

export function useTeamOps() {
  const [loading, setLoading] = useState(true);
  const [aziendaId, setAziendaId] = useState<string | null>(null);
  const [operatori, setOperatori] = useState<Operatore[]>([]);
  const [missioni, setMissioni] = useState<Missione[]>([]);
  const [anomalie, setAnomalie] = useState<Anomalia[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [gpsSnapshots, setGpsSnapshots] = useState<any[]>([]);
  const [logEventi, setLogEventi] = useState<LogEvento[]>([]);

  const loadAll = useCallback(async () => {
    if (!supabaseUrl || !supabaseKey) { setLoading(false); return; }
    const supabase = createClient(supabaseUrl, supabaseKey);
    setLoading(true);
    try {
      const azRes = await supabase.from("operatori").select("azienda_id").eq("attivo", true).limit(1);
      const az = azRes.data?.[0]?.azienda_id || null;
      setAziendaId(az);

      const filterEq = (q: any) => az ? q.eq("azienda_id", az) : q;

      const [op, mi, an, pe, gps, le] = await Promise.all([
        filterEq(supabase.from("operatori").select("*").eq("attivo", true)).order("nome"),
        filterEq(supabase.from("missioni").select("*")).order("created_at", { ascending: false }).limit(300),
        filterEq(supabase.from("anomalie").select("*")).order("rilevata_at", { ascending: false }).limit(100),
        supabase.from("performance_operatore").select("*").order("periodo", { ascending: false }).limit(200),
        filterEq(supabase.from("gps_snapshots").select("*")).order("pingato_at", { ascending: false }).limit(500),
        filterEq(supabase.from("log_eventi").select("*")).order("evento_at", { ascending: false }).limit(200),
      ]);
      setOperatori(op.data || []);
      setMissioni(mi.data || []);
      setAnomalie(an.data || []);
      setPerformance(pe.data || []);
      setGpsSnapshots(gps.data || []);
      setLogEventi(le.data || []);
    } catch (e) { console.warn("[useTeamOps] load error:", e); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const operatoriArricchiti: Operatore[] = operatori.map(op => {
    const missioniAttive = missioni.filter(m =>
      m.assegnato_a === op.id && m.stato && !STATI_CHIUSI.includes(m.stato)
    );
    const missioneInCorso = missioniAttive.find(m => m.stato === "in_corso" || m.iniziata_at);
    const snapOp = gpsSnapshots.filter(g => g.operatore_id === op.id);
    const lastSnap = snapOp[0] || null;

    let stato_live: Operatore["stato_live"] = "offline";
    const now = Date.now();
    const lastMs = lastSnap?.pingato_at ? new Date(lastSnap.pingato_at).getTime() : 0;
    const minFromPing = lastMs ? Math.floor((now - lastMs) / 60000) : 999;

    if (missioneInCorso) {
      const scad = missioneInCorso.scadenza_at ? new Date(missioneInCorso.scadenza_at).getTime() : 0;
      stato_live = (scad && scad < now) ? "ritardo" : "occupato";
    } else if (minFromPing > OFFLINE_SOGLIA_MIN) {
      stato_live = "offline";
    } else {
      stato_live = "disponibile";
    }

    return {
      ...op, stato_live,
      ultima_posizione: lastSnap ? { lat: Number(lastSnap.lat), lng: Number(lastSnap.lng), at: lastSnap.pingato_at } : null,
      missioni_attive: missioniAttive.length,
      missione_corrente: missioneInCorso || null,
    };
  });

  const statiOperatori = operatoriArricchiti.reduce<Record<string, number>>((acc, op) => {
    const k = op.stato_live || "offline"; acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});

  const oggiStr = new Date().toISOString().split("T")[0];
  const kpi = {
    missioniAperte: missioni.filter(m => m.stato && !STATI_CHIUSI.includes(m.stato)).length,
    missioniDaAssegnare: missioni.filter(m => m.stato === "da_assegnare").length,
    missioniOggi: missioni.filter(m => m.scadenza_at && m.scadenza_at.startsWith(oggiStr)).length,
    missioniUrgenti: missioni.filter(m => m.urgente && m.stato && !STATI_CHIUSI.includes(m.stato)).length,
    anomalieAperte: anomalie.filter(a => a.stato && STATI_ANOMALIA_APERTI.includes(a.stato)).length,
    anomalieCritiche: anomalie.filter(a =>
      (a.severita === "alta" || a.severita === "critica") && a.stato && STATI_ANOMALIA_APERTI.includes(a.stato)
    ).length,
    completateOggi: missioni.filter(m => m.completata_at && m.completata_at.startsWith(oggiStr)).length,
    totaleOperatori: operatori.length,
  };

  return {
    loading, aziendaId,
    operatori: operatoriArricchiti,
    missioni, anomalie, performance, gpsSnapshots, logEventi,
    statiOperatori, kpi, reload: loadAll,
  };
}
