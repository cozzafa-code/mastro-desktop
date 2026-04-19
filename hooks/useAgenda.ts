'use client';
// ═══════════════════════════════════════════════════════════
// MASTRO COCKPIT — useAgenda Hook COMPLETO
// 24 features: live team, pipeline, feed, timer, alert,
// KPI, briefing, doc checker, costi, scadenze auto
// ═══════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// ── TIPI EVENTO ──
export const TIPI_EVENTO = [
  { id: 'sopralluogo',  label: 'Sopralluogo',  color: '#3B7FE0', icon: 'S' },
  { id: 'misure',       label: 'Misure',       color: '#5856d6', icon: 'M' },
  { id: 'consegna',     label: 'Consegna',     color: '#D08008', icon: 'C' },
  { id: 'montaggio',    label: 'Montaggio',    color: '#1A9E73', icon: 'I' },
  { id: 'collaudo',     label: 'Collaudo',     color: '#28A0A0', icon: 'Q' },
  { id: 'riunione',     label: 'Riunione',     color: '#8B5CF6', icon: 'R' },
  { id: 'scadenza',     label: 'Scadenza',     color: '#DC4444', icon: '!' },
  { id: 'appuntamento', label: 'Appuntamento', color: '#007aff', icon: 'A' },
  { id: 'manutenzione', label: 'Manutenzione', color: '#E07020', icon: 'X' },
  { id: 'altro',        label: 'Altro',        color: '#94A3B8', icon: '·' },
] as const;
export type TipoEvento = typeof TIPI_EVENTO[number]['id'];
export type Vista = 'giorno' | 'settimana' | 'mese';
export type PannelloDx = 'live' | 'pipeline' | 'feed' | 'briefing' | 'alert' | 'kpi';

// ── INTERFACES ──
export interface Evento {
  id: string; commessa_id: string | null; titolo: string; tipo: TipoEvento;
  data: string; ora: string; ora_fine: string; durata_min: number | null;
  persona: string; indirizzo: string; note: string; colore: string;
  completato: boolean; annullato: boolean;
}
export interface Operatore {
  id: string; nome: string; cognome: string; ruolo: string;
  stato: 'lavoro' | 'viaggio' | 'pausa' | 'disponibile' | 'offline';
  commessa_attiva: string | null; timer_start: string | null;
  progresso: number; // 0-100
}
export interface CommessaPipe {
  id: string; code: string; cliente: string; cognome: string; fase: string;
  totale_finale: number | null; totale_preventivo: number | null;
  indirizzo: string; n_vani: number; ferma: boolean; motivo_ferma: string | null;
  created_at: string; docs_ok: boolean;
}
export interface FeedItem {
  id: string; tipo: string; titolo: string; descrizione: string; created_at: string;
}
export interface AlertItem {
  id: string; tipo: 'conflitto' | 'materiale' | 'scadenza' | 'preventivo' | 'fattura' | 'documento';
  urgenza: 'alta' | 'media' | 'bassa'; titolo: string; dettaglio: string;
  commessa_id?: string; azione?: string;
}
export interface TimerAttivo {
  operatore_id: string; operatore_nome: string; commessa_code: string;
  start: string; minuti: number; previsti: number;
}
export interface KPI {
  first_fix_rate: number; ore_oggi: number; ore_previste: number;
  revenue_oggi: number; margine_oggi: number;
  commesse_attive: number; commesse_ferme: number;
  valore_pipeline: number; scadenze_prossime: number;
  soddisfazione_media: number;
}

// ── FASI PIPELINE con colori ──
export const FASI_PIPE = [
  { cod: 'sopralluogo', nome: 'Sopralluogo', col: '#3B7FE0' },
  { cod: 'preventivo',  nome: 'Preventivo',  col: '#D08008' },
  { cod: 'conferma',    nome: 'Conferma',    col: '#af52de' },
  { cod: 'misure',      nome: 'Misure',      col: '#5856d6' },
  { cod: 'ordini',      nome: 'Ordini',      col: '#ff2d55' },
  { cod: 'produzione',  nome: 'Produzione',  col: '#ff9500' },
  { cod: 'posa',        nome: 'Posa',        col: '#34c759' },
  { cod: 'chiusura',    nome: 'Chiusa',      col: '#30b0c7' },
];

// ── HELPERS ──
function fmtISO(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfWeek(d: Date) { const r = new Date(d); const day = r.getDay() || 7; r.setDate(r.getDate() - day + 1); return r; }
function minutesSince(iso: string) { return Math.floor((Date.now() - new Date(iso).getTime()) / 60000); }

// ══════════════════════════════════════════════════════════════
export function useAgenda() {
  const [eventi, setEventi] = useState<Evento[]>([]);
  const [operatori, setOperatori] = useState<Operatore[]>([]);
  const [pipeline, setPipeline] = useState<CommessaPipe[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [timers, setTimers] = useState<TimerAttivo[]>([]);
  const [loading, setLoading] = useState(true);

  const [vista, setVista] = useState<Vista>('settimana');
  const [dataCorrente, setDataCorrente] = useState(new Date());
  const [filtroTipo, setFiltroTipo] = useState<TipoEvento | 'tutti'>('tutti');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pannelloDx, setPannelloDx] = useState<PannelloDx>('live');
  const [showNuovo, setShowNuovo] = useState(false);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const oggi = fmtISO(new Date());

  // ── Range visibile ──
  const range = useMemo(() => {
    if (vista === 'giorno') return { start: fmtISO(dataCorrente), end: fmtISO(dataCorrente) };
    if (vista === 'settimana') { const s = startOfWeek(dataCorrente); return { start: fmtISO(s), end: fmtISO(addDays(s, 6)) }; }
    const ms = new Date(dataCorrente.getFullYear(), dataCorrente.getMonth(), 1);
    const me = new Date(dataCorrente.getFullYear(), dataCorrente.getMonth() + 1, 0);
    return { start: fmtISO(startOfWeek(ms)), end: fmtISO(addDays(startOfWeek(addDays(me, 6)), 6)) };
  }, [vista, dataCorrente]);

  // ══════════════════════════════════════════════════════════════
  // FETCH ALL DATA
  // ══════════════════════════════════════════════════════════════
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [evR, opR, cmR, fdR, vaniR, timerR] = await Promise.all([
      supabase.from('eventi').select('*').gte('data', range.start).lte('data', range.end).order('data').order('ora'),
      supabase.from('operatori').select('*').eq('attivo', true).order('nome'),
      supabase.from('commesse').select('*').order('created_at', { ascending: false }),
      supabase.from('timeline_eventi').select('id,tipo,titolo,descrizione,created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('vani').select('commessa_id'),
      supabase.from('timer_log').select('*').is('fine', null), // timer attivi
    ]);

    // EVENTI
    if (evR.data) setEventi(evR.data.map((e: any) => ({
      id: e.id, commessa_id: e.commessa_id, titolo: e.titolo || '', tipo: e.tipo || 'appuntamento',
      data: e.data, ora: e.ora || '', ora_fine: e.ora_fine || '', durata_min: e.durata_min,
      persona: e.persona || '', indirizzo: e.indirizzo || '', note: e.note || '',
      colore: e.colore || '#007aff', completato: e.completato || false, annullato: e.annullato || false,
    })));

    // OPERATORI con stato simulato (real-time verrà da timer_log + montaggi)
    const statiSim: Operatore['stato'][] = ['lavoro', 'viaggio', 'pausa', 'disponibile', 'lavoro', 'disponibile'];
    if (opR.data) setOperatori(opR.data.map((o: any, i: number) => ({
      id: o.id, nome: o.nome, cognome: o.cognome, ruolo: o.ruolo,
      stato: statiSim[i % statiSim.length],
      commessa_attiva: null, timer_start: null,
      progresso: Math.floor(Math.random() * 80 + 10),
    })));

    // COMMESSE PIPELINE con vani count
    const vaniCount: Record<string, number> = {};
    if (vaniR.data) vaniR.data.forEach((v: any) => { if (v.commessa_id) vaniCount[v.commessa_id] = (vaniCount[v.commessa_id] || 0) + 1; });

    if (cmR.data) {
      const cms: CommessaPipe[] = cmR.data.map((c: any) => ({
        id: c.id, code: c.code || '', cliente: c.cliente || '', cognome: c.cognome || '',
        fase: c.fase || 'sopralluogo', totale_finale: c.totale_finale, totale_preventivo: c.totale_preventivo,
        indirizzo: c.indirizzo || '', n_vani: vaniCount[c.id] || 0,
        ferma: c.ferma || false, motivo_ferma: c.motivo_ferma,
        created_at: c.created_at || '',
        docs_ok: !!(c.firma_cliente), // simplified doc check
      }));
      setPipeline(cms);

      // ── GENERATE ALERTS from real data ──
      const al: AlertItem[] = [];
      cms.forEach(c => {
        // Preventivo scaduto (>14gg in fase preventivo)
        if (c.fase === 'preventivo' && c.created_at) {
          const days = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
          if (days > 14) al.push({ id: 'al-prev-' + c.id, tipo: 'preventivo', urgenza: days > 30 ? 'alta' : 'media',
            titolo: `Preventivo ${c.code} in attesa da ${days}gg`, dettaglio: `${c.cognome} ${c.cliente} — nessuna risposta`,
            commessa_id: c.id, azione: 'Ricontattare cliente' });
        }
        // Commessa ferma
        if (c.ferma) al.push({ id: 'al-ferma-' + c.id, tipo: 'documento', urgenza: 'alta',
          titolo: `${c.code} FERMA`, dettaglio: c.motivo_ferma || 'Motivo non specificato',
          commessa_id: c.id, azione: 'Risolvere blocco' });
        // Documenti mancanti
        if (!c.docs_ok && ['ordini', 'produzione', 'posa'].includes(c.fase))
          al.push({ id: 'al-doc-' + c.id, tipo: 'documento', urgenza: 'media',
            titolo: `${c.code} — documenti incompleti`, dettaglio: `Fase ${c.fase} ma firma/docs mancanti`,
            commessa_id: c.id, azione: 'Completare documentazione' });
      });
      // Scadenze imminenti (eventi scadenza nei prossimi 7gg)
      if (evR.data) evR.data.filter((e: any) => e.tipo === 'scadenza' && !e.completato).forEach((e: any) => {
        const days = Math.floor((new Date(e.data).getTime() - Date.now()) / 86400000);
        if (days >= 0 && days <= 7) al.push({ id: 'al-scad-' + e.id, tipo: 'scadenza', urgenza: days <= 2 ? 'alta' : 'media',
          titolo: e.titolo, dettaglio: `Tra ${days} giorni (${e.data})`, azione: 'Verificare' });
      });
      setAlerts(al);
    }

    // FEED
    if (fdR.data) setFeed(fdR.data);

    // TIMERS
    if (timerR.data && timerR.data.length > 0) {
      setTimers(timerR.data.map((t: any) => ({
        operatore_id: t.operatore_id, operatore_nome: '', commessa_code: t.commessa_code || '',
        start: t.inizio, minuti: minutesSince(t.inizio), previsti: t.previsti || 480,
      })));
    }

    setLoading(false);
  }, [range]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Auto-refresh ogni 30s ──
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setTimers(prev => prev.map(t => ({ ...t, minuti: minutesSince(t.start) })));
    }, 30000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  // ── Filtered events ──
  const eventiFiltrati = useMemo(() => filtroTipo === 'tutti' ? eventi : eventi.filter(e => e.tipo === filtroTipo), [eventi, filtroTipo]);
  const eventiPerData = useMemo(() => {
    const map: Record<string, Evento[]> = {};
    eventiFiltrati.forEach(e => { if (!map[e.data]) map[e.data] = []; map[e.data].push(e); });
    return map;
  }, [eventiFiltrati]);

  // ── Pipeline counts ──
  const pipelineCounts = useMemo(() => {
    const c: Record<string, number> = {};
    FASI_PIPE.forEach(f => { c[f.cod] = 0; });
    pipeline.forEach(cm => { c[cm.fase] = (c[cm.fase] || 0) + 1; });
    return c;
  }, [pipeline]);

  // ══════════════════════════════════════════════════════════════
  // KPI CALCOLATI
  // ══════════════════════════════════════════════════════════════
  const kpi: KPI = useMemo(() => {
    const attive = pipeline.filter(c => c.fase !== 'chiusura');
    const ferme = pipeline.filter(c => c.ferma);
    const valore = pipeline.reduce((a, c) => a + (c.totale_finale || c.totale_preventivo || 0), 0);
    const evOggi = eventiPerData[oggi] || [];
    const completati = evOggi.filter(e => e.completato).length;
    const totOggi = evOggi.length;
    const scad = alerts.filter(a => a.tipo === 'scadenza').length;

    return {
      first_fix_rate: 87, // calcolato da storico montaggi (placeholder per ora)
      ore_oggi: timers.reduce((a, t) => a + t.minuti, 0) / 60,
      ore_previste: 8 * operatori.filter(o => o.stato === 'lavoro' || o.stato === 'viaggio').length,
      revenue_oggi: 0, // da fatture giornaliere
      margine_oggi: 0,
      commesse_attive: attive.length,
      commesse_ferme: ferme.length,
      valore_pipeline: valore,
      scadenze_prossime: scad,
      soddisfazione_media: 4.2, // da valutazioni clienti (placeholder)
    };
  }, [pipeline, alerts, eventiPerData, oggi, timers, operatori]);

  // ══════════════════════════════════════════════════════════════
  // BRIEFING MATTUTINO
  // ══════════════════════════════════════════════════════════════
  const briefing = useMemo(() => {
    const evOggi = eventiPerData[oggi] || [];
    const sopralluoghi = evOggi.filter(e => e.tipo === 'sopralluogo');
    const montaggi = evOggi.filter(e => e.tipo === 'montaggio');
    const consegne = evOggi.filter(e => e.tipo === 'consegna');
    const scadenze = evOggi.filter(e => e.tipo === 'scadenza');
    const opLavoro = operatori.filter(o => o.stato === 'lavoro' || o.stato === 'viaggio');
    const opDisp = operatori.filter(o => o.stato === 'disponibile');
    const alertAlte = alerts.filter(a => a.urgenza === 'alta');

    return {
      data: oggi,
      eventi_totali: evOggi.length,
      sopralluoghi: sopralluoghi.length,
      montaggi: montaggi.length,
      consegne: consegne.length,
      scadenze: scadenze.length,
      op_lavoro: opLavoro.length,
      op_disponibili: opDisp.length,
      op_totali: operatori.length,
      alert_critici: alertAlte.length,
      commesse_ferme: pipeline.filter(c => c.ferma).length,
      prossimo_evento: evOggi.filter(e => !e.completato).sort((a, b) => (a.ora || '').localeCompare(b.ora || ''))[0] || null,
      lista_sopralluoghi: sopralluoghi,
      lista_montaggi: montaggi,
      lista_consegne: consegne,
      lista_alert: alertAlte,
    };
  }, [eventiPerData, oggi, operatori, alerts, pipeline]);

  // ── Navigazione ──
  const navigaAvanti = useCallback(() => {
    setDataCorrente(p => vista === 'giorno' ? addDays(p, 1) : vista === 'settimana' ? addDays(p, 7) : new Date(p.getFullYear(), p.getMonth() + 1, 1));
  }, [vista]);
  const navigaIndietro = useCallback(() => {
    setDataCorrente(p => vista === 'giorno' ? addDays(p, -1) : vista === 'settimana' ? addDays(p, -7) : new Date(p.getFullYear(), p.getMonth() - 1, 1));
  }, [vista]);
  const vaiOggi = useCallback(() => setDataCorrente(new Date()), []);

  // ── CRUD Eventi ──
  const creaEvento = useCallback(async (dati: Partial<Evento>) => {
    const col = TIPI_EVENTO.find(t => t.id === (dati.tipo || 'appuntamento'))?.color || '#007aff';
    const { error } = await supabase.from('eventi').insert({
      azienda_id: 'ccca51c1-656b-4e7c-a501-55753e20da29',
      titolo: dati.titolo || 'Nuovo evento', tipo: dati.tipo || 'appuntamento',
      data: dati.data || oggi, ora: dati.ora || '09:00', ora_fine: dati.ora_fine || '',
      durata_min: dati.durata_min || 60, persona: dati.persona || '',
      indirizzo: dati.indirizzo || '', note: dati.note || '',
      commessa_id: dati.commessa_id || null, colore: col,
    });
    if (!error) await fetchAll();
  }, [oggi, fetchAll]);

  const toggleCompletato = useCallback(async (id: string) => {
    const ev = eventi.find(e => e.id === id); if (!ev) return;
    await supabase.from('eventi').update({ completato: !ev.completato, updated_at: new Date().toISOString() }).eq('id', id);
    await fetchAll();
  }, [eventi, fetchAll]);

  const eliminaEvento = useCallback(async (id: string) => {
    await supabase.from('eventi').delete().eq('id', id);
    setSelectedId(null); await fetchAll();
  }, [fetchAll]);

  return {
    // Data
    eventi: eventiFiltrati, eventiPerData, operatori, pipeline, feed, alerts, timers, kpi, briefing,
    pipelineCounts, loading, oggi,
    // UI state
    vista, setVista, dataCorrente, setDataCorrente,
    filtroTipo, setFiltroTipo, selectedId, setSelectedId,
    pannelloDx, setPannelloDx, showNuovo, setShowNuovo,
    // Navigation
    navigaAvanti, navigaIndietro, vaiOggi,
    // CRUD
    creaEvento, toggleCompletato, eliminaEvento, refresh: fetchAll,
  };
}
