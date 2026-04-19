// @ts-nocheck
// MASTRO — hooks/useDesktopData.ts
// Hook centralizzato per dati desktop: polling real-time da Supabase
// Usato da tutti i moduli Desktop* per dati freschi senza reload

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface DesktopStats {
  commesseAttive: number;
  commesseFerme: number;
  valoreAttive: number;
  valoreConfermato: number;
  montaggiOggi: number;
  montaggiSettimana: number;
  fattureDaIncassare: number;
  fattureScadute: number;
  msgNonLetti: number;
  leadsNuovi: number;
  materialiSottoScorta: number;
  lastUpdate: Date;
}

export interface RealtimeAlert {
  id: string;
  tipo: "ferma" | "fattura" | "montaggio" | "messaggio" | "produzione";
  titolo: string;
  desc: string;
  colore: string;
  link: string;
  ts: Date;
}

const POLL_INTERVAL = 30000; // 30 secondi

export function useDesktopData(aziendaId: string | null) {
  const [stats, setStats] = useState<DesktopStats | null>(null);
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchStats = useCallback(async () => {
    if (!aziendaId || !mountedRef.current) return;
    try {
      const TODAY = new Date().toISOString().split("T")[0];
      const WEEK_END = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

      const [
        { data: commesse },
        { data: fatture },
        { data: montaggi },
        { data: messaggi },
        { count: leadsCount },
      ] = await Promise.all([
        supabase.from("commesse").select("id,fase,euro,ultima_modifica,confermato").eq("azienda_id", aziendaId),
        supabase.from("fatture").select("id,importo,pagata,scadenza,data").eq("azienda_id", aziendaId),
        supabase.from("montaggi").select("id,data,stato").eq("azienda_id", aziendaId),
        supabase.from("messaggi").select("id,letto").eq("azienda_id", aziendaId).eq("letto", false),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("azienda_id", aziendaId).eq("stato", "nuovo"),
      ]);

      if (!mountedRef.current) return;

      const SOGLIA_FERMA = 7;
      const attive = (commesse || []).filter(c => c.fase !== "chiusura");
      const ferme = attive.filter(c => {
        if (!c.ultima_modifica) return false;
        const gg = Math.floor((Date.now() - new Date(c.ultima_modifica).getTime()) / 86400000);
        return gg >= SOGLIA_FERMA;
      });

      const newStats: DesktopStats = {
        commesseAttive: attive.length,
        commesseFerme: ferme.length,
        valoreAttive: attive.reduce((s, c) => s + (parseFloat(c.euro) || 0), 0),
        valoreConfermato: attive.filter(c => c.confermato || ["conferma","misure","ordini","produzione","posa"].includes(c.fase)).reduce((s, c) => s + (parseFloat(c.euro) || 0), 0),
        montaggiOggi: (montaggi || []).filter(m => m.data === TODAY).length,
        montaggiSettimana: (montaggi || []).filter(m => m.data >= TODAY && m.data <= WEEK_END).length,
        fattureDaIncassare: (fatture || []).filter(f => !f.pagata).reduce((s, f) => s + (f.importo || 0), 0),
        fattureScadute: (fatture || []).filter(f => !f.pagata && f.scadenza && f.scadenza < TODAY).length,
        msgNonLetti: (messaggi || []).length,
        leadsNuovi: leadsCount || 0,
        materialiSottoScorta: 0,
        lastUpdate: new Date(),
      };

      // Genera alert
      const newAlerts: RealtimeAlert[] = [];
      if (ferme.length > 0) {
        newAlerts.push({ id: "ferme", tipo: "ferma", titolo: `${ferme.length} commesse ferme`, desc: `Nessun aggiornamento da più di ${SOGLIA_FERMA} giorni`, colore: "#DC4444", link: "commesse", ts: new Date() });
      }
      if (newStats.fattureScadute > 0) {
        newAlerts.push({ id: "fatture", tipo: "fattura", titolo: `${newStats.fattureScadute} fatture scadute`, desc: `€${Math.round(newStats.fattureDaIncassare).toLocaleString("it-IT")} da incassare`, colore: "#F97316", link: "fatture", ts: new Date() });
      }
      if (newStats.montaggiOggi > 0) {
        newAlerts.push({ id: "montaggi", tipo: "montaggio", titolo: `${newStats.montaggiOggi} montaggi oggi`, desc: "Controlla le squadre in Montaggi", colore: "#8B5CF6", link: "montaggi", ts: new Date() });
      }

      setStats(newStats);
      setAlerts(newAlerts);
      setError(null);
    } catch (err: any) {
      if (mountedRef.current) setError(err.message || "Errore dati");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [aziendaId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchStats();
    pollRef.current = setInterval(fetchStats, POLL_INTERVAL);

    // Realtime subscriptions
    if (!aziendaId) return;
    const sub = supabase.channel(`desktop-${aziendaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "commesse", filter: `azienda_id=eq.${aziendaId}` }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "messaggi", filter: `azienda_id=eq.${aziendaId}` }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "montaggi", filter: `azienda_id=eq.${aziendaId}` }, () => fetchStats())
      .subscribe();

    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
      supabase.removeChannel(sub);
    };
  }, [aziendaId, fetchStats]);

  return { stats, alerts, loading, error, refresh: fetchStats };
}

// Hook per singola commessa real-time
export function useCommessaRealtime(commessaId: string | null) {
  const [commessa, setCommessa] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!commessaId) return;
    setLoading(true);

    supabase.from("commesse").select("*").eq("id", commessaId).single()
      .then(({ data }) => { setCommessa(data); setLoading(false); });

    const sub = supabase.channel(`commessa-${commessaId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "commesse", filter: `id=eq.${commessaId}` },
        (payload) => setCommessa(payload.new))
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, [commessaId]);

  return { commessa, loading };
}

// Hook per dati produzione real-time
export function useProduzioneRealtime(aziendaId: string | null) {
  const [ordini, setOrdini] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!aziendaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("ordini_fornitori")
      .select("*, commesse(id,cliente,cognome,code,euro,fase,vani)")
      .eq("azienda_id", aziendaId)
      .order("created_at", { ascending: false });
    setOrdini(data || []);
    setLoading(false);
  }, [aziendaId]);

  useEffect(() => {
    fetch();
    if (!aziendaId) return;
    const sub = supabase.channel(`produzione-${aziendaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "ordini_fornitori", filter: `azienda_id=eq.${aziendaId}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [aziendaId, fetch]);

  return { ordini, loading, refresh: fetch };
}

// Hook fatture per contabilità
export function useFattureRealtime(aziendaId: string | null) {
  const [fatture, setFatture] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!aziendaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("fatture")
      .select("*, commesse(id,cliente,cognome,code)")
      .eq("azienda_id", aziendaId)
      .order("data", { ascending: false });
    setFatture(data || []);
    setLoading(false);
  }, [aziendaId]);

  useEffect(() => {
    fetch();
    if (!aziendaId) return;
    const sub = supabase.channel(`fatture-${aziendaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "fatture", filter: `azienda_id=eq.${aziendaId}` }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [aziendaId, fetch]);

  return { fatture, loading, refresh: fetch };
}
