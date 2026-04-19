'use client';
// ═══════════════════════════════════════════════════════════
// MASTRO CALENDARIO OPS v1 — Hook Cervello
// Blocchi = fasi VIVE commessa. Engine: conflitti, next actions, saturazione
// ═══════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// ── LAYER SYSTEM ──
export const LAYERS = [
  { id: 'produzione',  label: 'Produzione',   color: '#8B5CF6', icon: 'P' },
  { id: 'montaggi',    label: 'Montaggi',     color: '#1A9E73', icon: 'M' },
  { id: 'logistica',   label: 'Logistica',    color: '#D08008', icon: 'L' },
  { id: 'commerciale', label: 'Commerciale',  color: '#3B7FE0', icon: 'C' },
  { id: 'pagamenti',   label: 'Pagamenti',    color: '#28A0A0', icon: '€' },
  { id: 'problemi',    label: 'Problemi',     color: '#DC4444', icon: '!' },
  { id: 'admin',       label: 'Ufficio',      color: '#888880', icon: 'U' },
] as const;
export type LayerId = typeof LAYERS[number]['id'];
export type VistaId = 'settimana' | 'giorno' | 'mese' | 'gantt' | 'risorse' | 'eccezioni' | 'heatmap' | 'agenda';

// ── BLOCCO OPERATIVO — una fase VIVA della commessa ──
export interface Blocco {
  id: string;
  layer: LayerId;
  tipo: string;           // produzione, montaggio, consegna, sopralluogo, scadenza, problema, pagamento...
  titolo: string;
  cliente: string;
  commessa_code: string;
  commessa_id: string;
  data: string;           // YYYY-MM-DD
  ora: string;
  durata_h: number;
  risorsa: string;        // squadra, macchina, operatore
  indirizzo: string;
  stato: 'pianificato' | 'in_corso' | 'completato' | 'bloccato' | 'ritardo';
  priorita: number;       // 1=critica, 2=alta, 3=normale, 4=bassa
  importo: number | null;
  avanzamento: number;    // 0-100
  materiali_ok: boolean;
  pagamento_ok: boolean;
  problema: string;
  note: string;
  dipendenze: string[];   // IDs di blocchi che devono completarsi prima
  source: string;
  source_id: string;
}

// ── CONFLITTO ──
export interface Conflitto {
  id: string; tipo: 'sovrapposizione' | 'dipendenza' | 'materiale' | 'overbooking' | 'scadenza';
  gravita: 'critica' | 'alta' | 'media';
  blocco_ids: string[];
  messaggio: string;
  suggerimento: string;
}

// ── NEXT ACTION ──
export interface NextAction {
  id: string; tipo: 'chiamare' | 'ordinare' | 'confermare' | 'sbloccare' | 'spostare' | 'verificare';
  urgenza: 'ora' | 'oggi' | 'settimana';
  testo: string;
  commessa_code: string;
  blocco_id: string;
}

// ── DRAG RESULT ──
export interface DragResult {
  ok: boolean;
  warnings: string[];
  errors: string[];
  suggerimenti: string[];
}

// ── EVENT LOG ──
export interface EventLogEntry {
  id: string;
  timestamp: string;
  tipo: 'spostamento' | 'creazione' | 'completamento' | 'blocco' | 'modifica' | 'alert' | 'nota';
  dettagli: string;
  blocco_id: string;
  commessa_code: string;
  utente: string;
}

// ── BUFFER MANAGEMENT ──
export interface BufferInfo {
  blocco_id: string;
  titolo: string;
  commessa_code: string;
  giorniRimanenti: number;
  durataRimanente: number;
  bufferGiorni: number;
  stato: 'ok' | 'stretto' | 'critico' | 'sforato';
}

// ── ALERT PREDITTIVI ──
export interface AlertPredittivo {
  id: string;
  tipo: 'materiali_mancanti' | 'overbooking' | 'scadenza_pagamento' | 'buffer_sforato' | 'dipendenza_bloccata';
  gravita: 'critica' | 'alta' | 'media' | 'bassa';
  titolo: string;
  dettaglio: string;
  blocco_id: string;
  commessa_code: string;
  data_impatto: string;
}

function fmtEur(n: number) { return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }); }

// ── TOAST ──
export interface Toast {
  id: string;
  messaggio: string;
  tipo: 'successo' | 'errore' | 'warning' | 'info';
  timestamp: number;
}

// ── STORICO ──
export interface StoricoEntry {
  id: string;
  timestamp: string;
  blocco_id: string;
  stato_da: string;
  stato_a: string;
}

// ── SATURAZIONE ──
export interface Saturazione { data: string; livello: number; } // 0-100+

export interface Operatore {
  id: string; nome: string; cognome: string; ruolo: string;
  stato: 'lavoro' | 'viaggio' | 'pausa' | 'disponibile' | 'offline';
}

// ── Helpers ──
function fmtISO(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfWeek(d: Date) { const r = new Date(d); const day = r.getDay() || 7; r.setDate(r.getDate() - day + 1); return r; }
function parseOra(ora: string): number { const [h, m] = ora.split(':').map(Number); return h + (m || 0) / 60; }

const FASE_LAYER: Record<string, LayerId> = {
  preventivo: 'commerciale', ordine: 'commerciale', ordini: 'commerciale',
  produzione: 'produzione', posa: 'montaggi', collaudo: 'montaggi',
  chiusura: 'admin',
};
const FASE_DURATA: Record<string, number> = {
  preventivo: 1, ordine: 1, ordini: 2, produzione: 8, posa: 6, collaudo: 2, chiusura: 1,
};
const TIPO_LAYER: Record<string, LayerId> = {
  montaggio: 'montaggi', posa: 'montaggi', sopralluogo: 'commerciale',
  misure: 'commerciale', consegna: 'logistica', collaudo: 'montaggi',
  riunione: 'admin', scadenza: 'problemi', manutenzione: 'montaggi',
  appuntamento: 'commerciale',
};

// ══════════════════════════════════════════════════════════════
export function useCalendarioOPS() {
  const [blocchi, setBlocchi] = useState<Blocco[]>([]);
  const [operatori, setOperatori] = useState<Operatore[]>([]);
  const [conflitti, setConflitti] = useState<Conflitto[]>([]);
  const [nextActions, setNextActions] = useState<NextAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<VistaId>('settimana');
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(fmtISO(new Date()));
  const [selectedBlocco, setSelectedBlocco] = useState<string | null>(null);
  const [layersAttivi, setLayersAttivi] = useState<Set<LayerId>>(new Set(LAYERS.map(l => l.id)));

  const oggi = fmtISO(new Date());
  const baseWeek = useMemo(() => startOfWeek(addDays(new Date(), weekOffset * 7)), [weekOffset]);
  const weekStart = useMemo(() => fmtISO(baseWeek), [baseWeek]);
  const weekEnd = useMemo(() => fmtISO(addDays(baseWeek, 6)), [baseWeek]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => fmtISO(addDays(baseWeek, i))), [baseWeek]);

  const toggleLayer = useCallback((id: LayerId) => {
    setLayersAttivi(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  // ══════════════════════════════════════════════════════════════
  // FETCH + TRANSFORM TO BLOCCHI
  // ══════════════════════════════════════════════════════════════
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [evR, cmR, opR, costiR, vaniR] = await Promise.all([
      supabase.from('eventi').select('*').gte('data', weekStart).lte('data', weekEnd).order('ora'),
      supabase.from('commesse').select('*').order('created_at', { ascending: false }),
      supabase.from('operatori').select('*').eq('attivo', true).order('nome'),
      supabase.from('costi_commessa').select('*').gte('data', weekStart).lte('data', weekEnd),
      supabase.from('vani').select('commessa_id'),
    ]);

    const rawEv = evR.data || [], rawCm = cmR.data || [], rawOp = opR.data || [], rawCosti = costiR.data || [];
    const vc: Record<string, number> = {};
    (vaniR.data || []).forEach((v: any) => { if (v.commessa_id) vc[v.commessa_id] = (vc[v.commessa_id] || 0) + 1; });

    const all: Blocco[] = [];

    // ── EVENTI → blocchi operativi ──
    rawEv.forEach((e: any) => {
      all.push({
        id: 'ev-' + e.id, layer: TIPO_LAYER[e.tipo] || 'admin', tipo: e.tipo || 'appuntamento',
        titolo: e.titolo || '', cliente: e.persona || '', commessa_code: '', commessa_id: '',
        data: e.data, ora: e.ora || '', durata_h: 1,
        risorsa: e.persona || '', indirizzo: e.indirizzo || '',
        stato: e.completato ? 'completato' : 'pianificato',
        priorita: e.tipo === 'scadenza' ? 1 : 3, importo: null, avanzamento: e.completato ? 100 : 0,
        materiali_ok: true, pagamento_ok: true, problema: '', note: e.note || '',
        dipendenze: [], source: 'eventi', source_id: e.id,
      });
    });

    // ── COMMESSE → blocchi fase viva ──
    const FASI_ATTIVE = ['preventivo', 'ordine', 'ordini', 'produzione', 'posa', 'collaudo'];
    rawCm.forEach((c: any) => {
      if (!FASI_ATTIVE.includes(c.fase)) return;
      const nome = ((c.cognome || '') + ' ' + (c.cliente || '')).trim();
      const vani = vc[c.id] || 0;
      const layer = FASE_LAYER[c.fase] || 'admin';
      const durata = FASE_DURATA[c.fase] || 3;

      // Blocco fase principale — distribuito nei giorni della settimana
      const startDay = c.fase === 'posa' ? 2 : c.fase === 'produzione' ? 0 : 1;
      const endDay = Math.min(startDay + Math.ceil(durata / 2), 6);
      for (let d = startDay; d <= endDay && d < 7; d++) {
        const dayKey = weekDays[d];
        if (!dayKey) continue;
        all.push({
          id: `cm-${c.id}-${d}`, layer, tipo: c.fase,
          titolo: `${c.code} — ${nome}`, cliente: nome, commessa_code: c.code || '', commessa_id: c.id,
          data: dayKey, ora: c.fase === 'posa' ? '07:30' : c.fase === 'produzione' ? '08:00' : '09:00',
          durata_h: durata / Math.max(endDay - startDay + 1, 1),
          risorsa: c.fase === 'posa' ? 'Squadra A' : c.fase === 'produzione' ? 'Laboratorio' : 'Ufficio',
          indirizzo: c.indirizzo || '',
          stato: c.ferma ? 'bloccato' : 'in_corso',
          priorita: c.ferma ? 1 : c.fase === 'posa' ? 2 : 3,
          importo: c.totale_finale || c.totale_preventivo || null,
          avanzamento: c.fase === 'produzione' ? 50 : c.fase === 'posa' ? 70 : 20,
          materiali_ok: !c.ferma, pagamento_ok: true,
          problema: c.ferma ? (c.motivo_ferma || 'Commessa ferma') : '',
          note: '', dipendenze: [], source: 'commesse', source_id: c.id,
        });
      }

      // Preventivi scaduti → blocco problema
      if (c.fase === 'preventivo' && c.created_at) {
        const days_old = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
        if (days_old > 14) {
          all.push({
            id: 'prob-prev-' + c.id, layer: 'problemi', tipo: 'preventivo_scaduto',
            titolo: `Preventivo ${c.code} — ${days_old}gg senza risposta`, cliente: nome,
            commessa_code: c.code, commessa_id: c.id, data: oggi, ora: '', durata_h: 0,
            risorsa: 'Ufficio', indirizzo: '', stato: 'ritardo', priorita: days_old > 30 ? 1 : 2,
            importo: c.totale_preventivo, avanzamento: 0, materiali_ok: true, pagamento_ok: false,
            problema: `${days_old} giorni senza risposta cliente`, note: '', dipendenze: [],
            source: 'commesse', source_id: c.id,
          });
        }
      }

      // Commesse ferme → blocco problema
      if (c.ferma) {
        all.push({
          id: 'prob-ferma-' + c.id, layer: 'problemi', tipo: 'commessa_ferma',
          titolo: `${c.code} FERMA`, cliente: nome,
          commessa_code: c.code, commessa_id: c.id, data: oggi, ora: '', durata_h: 0,
          risorsa: '', indirizzo: '', stato: 'bloccato', priorita: 1,
          importo: null, avanzamento: 0, materiali_ok: false, pagamento_ok: true,
          problema: c.motivo_ferma || 'Da verificare', note: '', dipendenze: [],
          source: 'commesse', source_id: c.id,
        });
      }
    });

    // ── COSTI → blocchi pagamento ──
    rawCosti.forEach((c: any) => {
      all.push({
        id: 'cost-' + c.id, layer: 'pagamenti', tipo: 'uscita',
        titolo: c.descrizione || 'Costo', cliente: '', commessa_code: '', commessa_id: '',
        data: c.data, ora: '', durata_h: 0, risorsa: 'Admin', indirizzo: '',
        stato: 'pianificato', priorita: 3, importo: -(c.importo || 0), avanzamento: 100,
        materiali_ok: true, pagamento_ok: true, problema: '', note: c.tipo || '',
        dipendenze: [], source: 'costi_commessa', source_id: c.id,
      });
    });

    // Fatture entrata da commesse chiuse
    rawCm.forEach((c: any) => {
      if (c.totale_finale && ['posa', 'chiusura'].includes(c.fase)) {
        const fd = c.updated_at?.split('T')[0] || oggi;
        if (fd >= weekStart && fd <= weekEnd) {
          all.push({
            id: 'fatt-' + c.id, layer: 'pagamenti', tipo: 'entrata',
            titolo: `Fattura ${c.code}`, cliente: ((c.cognome || '') + ' ' + (c.cliente || '')).trim(),
            commessa_code: c.code, commessa_id: c.id, data: fd, ora: '', durata_h: 0,
            risorsa: 'Admin', indirizzo: '', stato: 'pianificato', priorita: 3,
            importo: c.totale_finale, avanzamento: 100,
            materiali_ok: true, pagamento_ok: true, problema: '', note: '',
            dipendenze: [], source: 'commesse', source_id: c.id,
          });
        }
      }
    });

    setBlocchi(all);

    // ── OPERATORI ──
    const statiSim: Operatore['stato'][] = ['lavoro', 'viaggio', 'pausa', 'disponibile', 'lavoro', 'disponibile'];
    setOperatori(rawOp.map((o: any, i: number) => ({
      id: o.id, nome: o.nome || '', cognome: o.cognome || '', ruolo: o.ruolo || '',
      stato: statiSim[i % statiSim.length],
    })));

    // ── CONFLICT ENGINE ──
    const conflicts: Conflitto[] = [];
    // Sovrapposizioni risorse
    const risorse = new Map<string, Blocco[]>();
    all.filter(b => b.risorsa && b.stato !== 'completato').forEach(b => {
      const key = `${b.data}-${b.risorsa}`;
      if (!risorse.has(key)) risorse.set(key, []);
      risorse.get(key)!.push(b);
    });
    risorse.forEach((bs, key) => {
      if (bs.length > 1 && bs.some(b => b.ora)) {
        conflicts.push({
          id: 'conf-' + key, tipo: 'sovrapposizione', gravita: 'alta',
          blocco_ids: bs.map(b => b.id),
          messaggio: `${bs[0].risorsa} ha ${bs.length} impegni il ${bs[0].data}`,
          suggerimento: 'Riassegna o sposta uno dei blocchi',
        });
      }
    });
    // Materiali mancanti
    all.filter(b => !b.materiali_ok && b.stato !== 'completato').forEach(b => {
      conflicts.push({
        id: 'conf-mat-' + b.id, tipo: 'materiale', gravita: 'critica',
        blocco_ids: [b.id], messaggio: `Materiale mancante per ${b.titolo}`,
        suggerimento: 'Verifica ordine fornitore o sposta blocco',
      });
    });
    // Blocchi con stato bloccato
    all.filter(b => b.stato === 'bloccato').forEach(b => {
      conflicts.push({
        id: 'conf-block-' + b.id, tipo: 'dipendenza', gravita: 'critica',
        blocco_ids: [b.id], messaggio: `${b.titolo} — ${b.problema || 'bloccato'}`,
        suggerimento: 'Risolvi il problema o contatta il responsabile',
      });
    });
    setConflitti(conflicts);

    // ── NEXT ACTION ENGINE ──
    const actions: NextAction[] = [];
    // Problemi da risolvere
    all.filter(b => b.layer === 'problemi').forEach(b => {
      actions.push({
        id: 'na-' + b.id, tipo: b.tipo === 'preventivo_scaduto' ? 'chiamare' : 'sbloccare',
        urgenza: b.priorita === 1 ? 'ora' : 'oggi', testo: b.titolo,
        commessa_code: b.commessa_code, blocco_id: b.id,
      });
    });
    // Conferme mancanti per montaggi prossimi
    all.filter(b => b.layer === 'montaggi' && b.stato === 'pianificato' && b.data <= weekDays[2]).forEach(b => {
      actions.push({
        id: 'na-conf-' + b.id, tipo: 'confermare', urgenza: 'oggi',
        testo: `Conferma montaggio ${b.commessa_code} — ${b.cliente}`,
        commessa_code: b.commessa_code, blocco_id: b.id,
      });
    });
    setNextActions(actions);

    setLoading(false);
  }, [weekStart, weekEnd, oggi, weekDays]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtrato per layer ──
  const blocchiFiltrati = useMemo(() => blocchi.filter(b => layersAttivi.has(b.layer)), [blocchi, layersAttivi]);

  // ── Blocchi per giorno ──
  const blocchiPerGiorno = useMemo(() => {
    const map: Record<string, Blocco[]> = {};
    blocchiFiltrati.forEach(b => { if (!map[b.data]) map[b.data] = []; map[b.data].push(b); });
    Object.values(map).forEach(arr => arr.sort((a, b) => (a.ora || 'ZZ').localeCompare(b.ora || 'ZZ')));
    return map;
  }, [blocchiFiltrati]);

  // ── Saturazione per giorno ──
  const saturazione = useMemo((): Record<string, number> => {
    const map: Record<string, number> = {};
    weekDays.forEach(d => {
      const bs = blocchiPerGiorno[d] || [];
      const ore = bs.reduce((a, b) => a + b.durata_h, 0);
      map[d] = Math.round((ore / 8) * 100); // 8h = 100%
    });
    return map;
  }, [blocchiPerGiorno, weekDays]);

  // ── Eccezioni (problemi+ritardi+blocchi) ──
  const eccezioni = useMemo(() => blocchi.filter(b =>
    b.stato === 'bloccato' || b.stato === 'ritardo' || b.layer === 'problemi' || b.priorita <= 2
  ), [blocchi]);

  // ── Nav ──
  const navWeek = useCallback((dir: number) => setWeekOffset(p => p + dir), []);
  const goToday = useCallback(() => { setWeekOffset(0); setSelectedDay(oggi); }, [oggi]);

  // ── CRUD ──
  const creaEvento = useCallback(async (dati: any) => {
    await supabase.from('eventi').insert({
      azienda_id: 'ccca51c1-656b-4e7c-a501-55753e20da29',
      titolo: dati.titolo, tipo: dati.tipo || 'appuntamento',
      data: dati.data || oggi, ora: dati.ora || '09:00',
      persona: dati.persona || '', indirizzo: dati.indirizzo || '',
      colore: '#3B7FE0', note: dati.note || '',
    });
    await fetchAll();
  }, [oggi, fetchAll]);

  // ── KPI economici settimana ──
  const kpiSettimana = useMemo(() => {
    const pagBlocchi = blocchi.filter(b => b.layer === 'pagamenti');
    const entrate = pagBlocchi.filter(b => (b.importo || 0) > 0).reduce((a, b) => a + (b.importo || 0), 0);
    const uscite = pagBlocchi.filter(b => (b.importo || 0) < 0).reduce((a, b) => a + Math.abs(b.importo || 0), 0);
    const montaggi = blocchi.filter(b => b.layer === 'montaggi').length;
    const produzione = blocchi.filter(b => b.layer === 'produzione').length;
    const commesseUniche = new Set(blocchi.filter(b => b.commessa_code).map(b => b.commessa_code)).size;
    return { entrate, uscite, margine: entrate - uscite, montaggi, produzione, commesseUniche };
  }, [blocchi]);

  // ── Month days (4-5 weeks around current week) ──
  const monthDays = useMemo(() => {
    const first = new Date(baseWeek);
    first.setDate(first.getDate() - 7); // 1 week before
    return Array.from({ length: 35 }, (_, i) => fmtISO(addDays(first, i)));
  }, [baseWeek]);

  // ── Risorse uniche ──
  const risorseUniche = useMemo(() => {
    const set = new Set<string>();
    blocchiFiltrati.forEach(b => { if (b.risorsa) set.add(b.risorsa); });
    return Array.from(set).sort();
  }, [blocchiFiltrati]);

  // ── Gantt: commesse uniche con fasi ──
  const ganttCommesse = useMemo(() => {
    const map = new Map<string, { code: string; cliente: string; blocchi: Blocco[] }>();
    blocchiFiltrati.filter(b => b.commessa_code).forEach(b => {
      if (!map.has(b.commessa_code)) map.set(b.commessa_code, { code: b.commessa_code, cliente: b.cliente, blocchi: [] });
      map.get(b.commessa_code)!.blocchi.push(b);
    });
    return Array.from(map.values());
  }, [blocchiFiltrati]);

  // ══════════════════════════════════════════════════════════════
  // DRAG & DROP ENGINE — sposta blocco con controlli reali
  // ══════════════════════════════════════════════════════════════
  const [dragResult, setDragResult] = useState<DragResult | null>(null);

  const checkDrop = useCallback((bloccoId: string, nuovaData: string, nuovaOra?: string): DragResult => {
    const blocco = blocchi.find(b => b.id === bloccoId);
    if (!blocco) return { ok: false, warnings: [], errors: ['Blocco non trovato'], suggerimenti: [] };

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggerimenti: string[] = [];

    // 1. Risorsa gia occupata?
    const stessoSlot = blocchi.filter(b =>
      b.id !== bloccoId && b.risorsa === blocco.risorsa && b.data === nuovaData && b.stato !== 'completato'
    );
    if (stessoSlot.length > 0 && blocco.ora) {
      const oraConflitto = stessoSlot.find(b => b.ora && Math.abs(parseOra(b.ora) - parseOra(nuovaOra || blocco.ora)) < blocco.durata_h);
      if (oraConflitto) {
        errors.push(`${blocco.risorsa} occupata ${oraConflitto.ora?.slice(0, 5)} — ${oraConflitto.titolo}`);
        // Suggerisci slot libero
        const oreOccupate = stessoSlot.filter(b => b.ora).map(b => parseOra(b.ora));
        for (let h = 7; h <= 17; h++) {
          if (!oreOccupate.some(o => Math.abs(o - h) < blocco.durata_h)) {
            suggerimenti.push(`${String(h).padStart(2, '0')}:00 stesso giorno`);
            break;
          }
        }
      }
    }

    // 2. Saturazione giorno
    const oreTotGiorno = blocchi.filter(b => b.data === nuovaData && b.stato !== 'completato' && b.id !== bloccoId)
      .reduce((a, b) => a + b.durata_h, 0) + blocco.durata_h;
    if (oreTotGiorno > 10) warnings.push(`Giorno saturo: ${oreTotGiorno}h totali`);

    // 3. Dipendenze — non spostare prima di blocchi predecessori
    if (blocco.dipendenze.length > 0) {
      const predNonCompleti = blocco.dipendenze
        .map(id => blocchi.find(b => b.id === id))
        .filter(b => b && b.stato !== 'completato' && b.data > nuovaData);
      if (predNonCompleti.length > 0) {
        errors.push('Dipendenza incompleta: non puoi anticipare prima del predecessore');
      }
    }

    // 4. Materiali mancanti su montaggi
    if (blocco.layer === 'montaggi' && !blocco.materiali_ok) {
      warnings.push('Materiali mancanti — montaggio a rischio');
    }

    // 5. Weekend
    const dow = new Date(nuovaData + 'T00:00:00').getDay();
    if (dow === 0) warnings.push('Domenica — conferma necessaria');

    // Suggerimento giorno dopo se errori
    if (errors.length > 0) {
      const domani = fmtISO(addDays(new Date(nuovaData + 'T00:00:00'), 1));
      suggerimenti.push(`Prova ${domani}`);
      // Altra risorsa
      const altreRisorse = risorseUniche.filter(r => r !== blocco.risorsa);
      if (altreRisorse.length > 0) suggerimenti.push(`Risorsa: ${altreRisorse[0]}`);
    }

    return { ok: errors.length === 0, warnings, errors, suggerimenti };
  }, [blocchi, risorseUniche]);

  const eseguiDrop = useCallback((bloccoId: string, nuovaData: string, nuovaOra?: string) => {
    const result = checkDrop(bloccoId, nuovaData, nuovaOra);
    setDragResult(result);
    if (!result.ok) return result;
    // Applica spostamento locale
    setBlocchi(prev => prev.map(b => b.id === bloccoId ? { ...b, data: nuovaData, ora: nuovaOra || b.ora } : b));
    return result;
  }, [checkDrop]);

  const clearDragResult = useCallback(() => setDragResult(null), []);

  // ══════════════════════════════════════════════════════════════
  // COMMESSA FANTASMA — simulazione "what if"
  // ══════════════════════════════════════════════════════════════
  const [fantasma, setFantasma] = useState<Blocco | null>(null);

  const creaFantasma = useCallback((dati: { titolo: string; durata_h: number; data: string; risorsa: string; layer: LayerId }) => {
    const ghost: Blocco = {
      id: 'ghost-' + Date.now(), layer: dati.layer, tipo: 'fantasma',
      titolo: dati.titolo, cliente: 'SIMULAZIONE', commessa_code: 'GHOST',
      commessa_id: '', data: dati.data, ora: '08:00', durata_h: dati.durata_h,
      risorsa: dati.risorsa, indirizzo: '', stato: 'pianificato', priorita: 3,
      importo: null, avanzamento: 0, materiali_ok: true, pagamento_ok: true,
      problema: '', note: 'Commessa fantasma — simulazione', dipendenze: [],
      source: 'ghost', source_id: '',
    };
    setFantasma(ghost);
    return ghost;
  }, []);

  const rimuoviFantasma = useCallback(() => setFantasma(null), []);

  // Impatto fantasma sulla saturazione
  const impactoFantasma = useMemo(() => {
    if (!fantasma) return null;
    const giorniImpattati: string[] = [];
    for (let i = 0; i < Math.ceil(fantasma.durata_h / 8); i++) {
      giorniImpattati.push(fmtISO(addDays(new Date(fantasma.data + 'T00:00:00'), i)));
    }
    const conflitti: string[] = [];
    giorniImpattati.forEach(d => {
      const sat = saturazione[d] || 0;
      const nuovaSat = sat + Math.round((Math.min(fantasma.durata_h, 8) / 8) * 100);
      if (nuovaSat > 100) conflitti.push(`${d}: saturazione ${nuovaSat}%`);
      // Risorsa occupata?
      const stessa = blocchi.filter(b => b.risorsa === fantasma.risorsa && b.data === d && b.stato !== 'completato');
      if (stessa.length > 0) conflitti.push(`${fantasma.risorsa} gia occupata il ${d}`);
    });
    return { giorniImpattati, conflitti, saturo: conflitti.length > 0 };
  }, [fantasma, saturazione, blocchi]);

  // ══════════════════════════════════════════════════════════════
  // SMART FILTERS
  // ══════════════════════════════════════════════════════════════
  const [filtroSmart, setFiltroSmart] = useState<string | null>(null);

  const blocchiFiltroSmart = useMemo(() => {
    if (!filtroSmart) return null;
    switch (filtroSmart) {
      case 'ritardi': return blocchi.filter(b => b.stato === 'ritardo' || b.stato === 'bloccato');
      case 'oggi': return blocchi.filter(b => b.data === oggi);
      case 'overbooking': {
        const risMap = new Map<string, number>();
        blocchi.filter(b => b.stato !== 'completato').forEach(b => {
          const k = `${b.data}-${b.risorsa}`;
          risMap.set(k, (risMap.get(k) || 0) + 1);
        });
        const overKeys = new Set(Array.from(risMap.entries()).filter(([, v]) => v > 1).map(([k]) => k));
        return blocchi.filter(b => overKeys.has(`${b.data}-${b.risorsa}`));
      }
      case 'montaggi_conf': return blocchi.filter(b => b.layer === 'montaggi' && b.stato === 'pianificato');
      case 'critici': return blocchi.filter(b => b.priorita <= 2 || b.stato === 'bloccato');
      case 'alto_valore': return blocchi.filter(b => (b.importo || 0) > 5000);
      default: return null;
    }
  }, [filtroSmart, blocchi, oggi]);

  // ══════════════════════════════════════════════════════════════
  // MODALITA GUERRA — solo oggi+domani, critici
  // ══════════════════════════════════════════════════════════════
  const [guerra, setGuerra] = useState(false);
  const domani = fmtISO(addDays(new Date(), 1));

  const blocchiGuerra = useMemo(() => {
    if (!guerra) return null;
    return blocchi.filter(b =>
      (b.data === oggi || b.data === domani) &&
      (b.stato !== 'completato') &&
      (b.priorita <= 2 || b.stato === 'bloccato' || b.stato === 'ritardo' || b.layer === 'problemi' || b.layer === 'montaggi')
    ).sort((a, b) => a.priorita - b.priorita);
  }, [guerra, blocchi, oggi, domani]);

  // ══════════════════════════════════════════════════════════════
  // EVENT LOG — registro completo azioni con timestamp
  // ══════════════════════════════════════════════════════════════
  const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);

  const logEvent = useCallback((tipo: EventLogEntry['tipo'], dettagli: string, blocco_id?: string, commessa_code?: string) => {
    const entry: EventLogEntry = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
      tipo, dettagli, blocco_id: blocco_id || '', commessa_code: commessa_code || '',
      utente: 'titolare',
    };
    setEventLog(prev => [entry, ...prev].slice(0, 200)); // max 200 entries
  }, []);

  // ══════════════════════════════════════════════════════════════
  // DEPENDENCY ENGINE — predecessori/successori reali
  // ══════════════════════════════════════════════════════════════
  const grafoDepend = useMemo(() => {
    const successori = new Map<string, string[]>(); // bloccoId -> chi dipende da me
    const predecessori = new Map<string, string[]>(); // bloccoId -> da chi dipendo
    blocchi.forEach(b => {
      if (b.dipendenze.length > 0) {
        predecessori.set(b.id, [...b.dipendenze]);
        b.dipendenze.forEach(depId => {
          const succ = successori.get(depId) || [];
          succ.push(b.id);
          successori.set(depId, succ);
        });
      }
    });
    return { successori, predecessori };
  }, [blocchi]);

  // Catena critica: percorso piu lungo di dipendenze
  const catenaCritica = useMemo(() => {
    const visited = new Set<string>();
    const findLongest = (id: string, depth: number): { path: string[]; len: number } => {
      if (visited.has(id)) return { path: [], len: depth };
      visited.add(id);
      const succs = grafoDepend.successori.get(id) || [];
      if (succs.length === 0) return { path: [id], len: depth };
      let best = { path: [id], len: depth };
      for (const s of succs) {
        const r = findLongest(s, depth + 1);
        if (r.len > best.len) best = { path: [id, ...r.path], len: r.len };
      }
      return best;
    };
    // Find roots (no predecessors)
    const roots = blocchi.filter(b => !b.dipendenze.length && (grafoDepend.successori.get(b.id)?.length || 0) > 0);
    let longest = { path: [] as string[], len: 0 };
    roots.forEach(r => { visited.clear(); const res = findLongest(r.id, 0); if (res.len > longest.len) longest = res; });
    return longest.path;
  }, [blocchi, grafoDepend]);

  // Blocchi bloccati da dipendenze incomplete
  const blocchiBloccatiDaDip = useMemo(() => {
    return blocchi.filter(b => {
      if (b.dipendenze.length === 0) return false;
      return b.dipendenze.some(depId => {
        const dep = blocchi.find(x => x.id === depId);
        return dep && dep.stato !== 'completato';
      });
    });
  }, [blocchi]);

  // ══════════════════════════════════════════════════════════════
  // BUFFER MANAGEMENT — margini temporali
  // ══════════════════════════════════════════════════════════════
  const bufferAnalysis = useMemo(() => {
    const results: BufferInfo[] = [];
    blocchi.forEach(b => {
      if (b.stato === 'completato') return;
      // Calcola giorni rimanenti
      const dataFine = new Date(b.data + 'T00:00:00');
      const now = new Date(oggi + 'T00:00:00');
      const giorniRimanenti = Math.ceil((dataFine.getTime() - now.getTime()) / 86400000);
      // Stima durata rimanente in giorni
      const durataRimanente = Math.ceil((b.durata_h * (100 - b.avanzamento) / 100) / 8);
      const bufferGiorni = giorniRimanenti - durataRimanente;
      const stato: BufferInfo['stato'] = bufferGiorni < 0 ? 'sforato' : bufferGiorni === 0 ? 'critico' : bufferGiorni <= 1 ? 'stretto' : 'ok';
      if (stato !== 'ok') {
        results.push({ blocco_id: b.id, titolo: b.titolo, commessa_code: b.commessa_code, giorniRimanenti, durataRimanente, bufferGiorni, stato });
      }
    });
    return results.sort((a, b) => a.bufferGiorni - b.bufferGiorni);
  }, [blocchi, oggi]);

  // ══════════════════════════════════════════════════════════════
  // ALERT PREDITTIVI — segnala problemi PRIMA che accadano
  // ══════════════════════════════════════════════════════════════
  const alertPredittivi = useMemo(() => {
    const alerts: AlertPredittivo[] = [];
    // 1. Montaggi senza materiali nei prossimi 3 giorni
    const fra3gg = fmtISO(addDays(new Date(), 3));
    blocchi.filter(b => b.layer === 'montaggi' && !b.materiali_ok && b.data <= fra3gg && b.data >= oggi && b.stato !== 'completato')
      .forEach(b => alerts.push({ id: 'ap-mat-' + b.id, tipo: 'materiali_mancanti', gravita: 'alta', titolo: `Materiali mancanti per ${b.titolo}`, dettaglio: `Montaggio previsto ${b.data} ma materiali non confermati`, blocco_id: b.id, commessa_code: b.commessa_code, data_impatto: b.data }));
    // 2. Saturazione > 120% nei prossimi 5 giorni
    for (let i = 0; i < 5; i++) {
      const d = fmtISO(addDays(new Date(), i));
      const sat = saturazione[d] || 0;
      if (sat > 120) alerts.push({ id: 'ap-sat-' + d, tipo: 'overbooking', gravita: 'alta', titolo: `Overbooking il ${d}`, dettaglio: `Saturazione ${sat}% — impossibile rispettare tutti gli impegni`, blocco_id: '', commessa_code: '', data_impatto: d });
    }
    // 3. Pagamenti in scadenza (blocchi pagamenti entro 7gg non completati)
    const fra7gg = fmtISO(addDays(new Date(), 7));
    blocchi.filter(b => b.layer === 'pagamenti' && b.stato !== 'completato' && b.data <= fra7gg && b.data >= oggi && (b.importo || 0) < 0)
      .forEach(b => alerts.push({ id: 'ap-pag-' + b.id, tipo: 'scadenza_pagamento', gravita: 'media', titolo: `Pagamento in scadenza: ${fmtEur(Math.abs(b.importo || 0))}`, dettaglio: `${b.titolo} — scade ${b.data}`, blocco_id: b.id, commessa_code: b.commessa_code, data_impatto: b.data }));
    // 4. Buffer sforato
    bufferAnalysis.filter(b => b.stato === 'sforato').forEach(b => alerts.push({ id: 'ap-buf-' + b.blocco_id, tipo: 'buffer_sforato', gravita: 'critica', titolo: `Buffer sforato: ${b.titolo}`, dettaglio: `${Math.abs(b.bufferGiorni)} giorni di ritardo previsto`, blocco_id: b.blocco_id, commessa_code: b.commessa_code, data_impatto: oggi }));
    // 5. Dipendenze a rischio — blocco pianificato ma predecessore in ritardo
    blocchiBloccatiDaDip.forEach(b => {
      if (b.stato === 'pianificato' && b.data <= fra3gg) {
        alerts.push({ id: 'ap-dep-' + b.id, tipo: 'dipendenza_bloccata', gravita: 'alta', titolo: `${b.titolo} bloccato da predecessore`, dettaglio: `Predecessore non completato — rischio slittamento`, blocco_id: b.id, commessa_code: b.commessa_code, data_impatto: b.data });
      }
    });
    return alerts.sort((a, b) => {
      const grav: Record<string, number> = { critica: 0, alta: 1, media: 2, bassa: 3 };
      return (grav[a.gravita] || 9) - (grav[b.gravita] || 9);
    });
  }, [blocchi, saturazione, oggi, bufferAnalysis, blocchiBloccatiDaDip]);

  // ══════════════════════════════════════════════════════════════
  // STATISTICHE PERFORMANCE SETTIMANA
  // ══════════════════════════════════════════════════════════════
  const statsSettimana = useMemo(() => {
    const totale = blocchi.length;
    const completati = blocchi.filter(b => b.stato === 'completato').length;
    const inCorso = blocchi.filter(b => b.stato === 'in_corso').length;
    const bloccati = blocchi.filter(b => b.stato === 'bloccato').length;
    const ritardo = blocchi.filter(b => b.stato === 'ritardo').length;
    const pctCompletato = totale > 0 ? Math.round((completati / totale) * 100) : 0;
    const oreTotali = blocchi.reduce((a, b) => a + b.durata_h, 0);
    const oreFatte = blocchi.filter(b => b.stato === 'completato').reduce((a, b) => a + b.durata_h, 0);
    const velocita = completati > 0 ? Math.round(oreFatte / completati * 10) / 10 : 0;
    return { totale, completati, inCorso, bloccati, ritardo, pctCompletato, oreTotali, oreFatte, velocita };
  }, [blocchi]);

  // ══════════════════════════════════════════════════════════════
  // AUTO-SUGGEST RISORSA — suggerisce la meno carica per data
  // ══════════════════════════════════════════════════════════════
  const suggestRisorsa = useCallback((data: string, durata_h: number): { risorsa: string; ore_libere: number }[] => {
    if (risorseUniche.length === 0) return [];
    const suggestions = risorseUniche.map(r => {
      const oreOccupate = blocchi.filter(b => b.risorsa === r && b.data === data && b.stato !== 'completato')
        .reduce((a, b) => a + b.durata_h, 0);
      return { risorsa: r, ore_libere: 8 - oreOccupate };
    }).filter(s => s.ore_libere >= durata_h).sort((a, b) => b.ore_libere - a.ore_libere);
    return suggestions;
  }, [blocchi, risorseUniche]);

  // ══════════════════════════════════════════════════════════════
  // DETTAGLIO GIORNO — statistiche per giorno selezionato
  // ══════════════════════════════════════════════════════════════
  const dettaglioGiorno = useMemo(() => {
    const bs = blocchiPerGiorno[selectedDay] || [];
    const perLayer = new Map<string, number>();
    const perStato = new Map<string, number>();
    let oreTotali = 0; let importoTotale = 0;
    bs.forEach(b => {
      perLayer.set(b.layer, (perLayer.get(b.layer) || 0) + 1);
      perStato.set(b.stato, (perStato.get(b.stato) || 0) + 1);
      oreTotali += b.durata_h;
      if (b.importo) importoTotale += b.importo;
    });
    const risorseCoinvolte = [...new Set(bs.map(b => b.risorsa).filter(Boolean))];
    const commesseCoinvolte = [...new Set(bs.map(b => b.commessa_code).filter(Boolean))];
    const problemiBlocco = bs.filter(b => b.problema);
    return { totale: bs.length, perLayer: Object.fromEntries(perLayer), perStato: Object.fromEntries(perStato), oreTotali, importoTotale, risorseCoinvolte, commesseCoinvolte, problemiBlocco, sat: saturazione[selectedDay] || 0 };
  }, [blocchiPerGiorno, selectedDay, saturazione]);

  // ══════════════════════════════════════════════════════════════
  // QUICK ACTIONS — cambio stato blocco
  // ══════════════════════════════════════════════════════════════
  const quickAction = useCallback((bloccoId: string, azione: 'conferma' | 'blocca' | 'completa' | 'riprendi') => {
    const nuovoStato: Record<string, Blocco['stato']> = { conferma: 'in_corso', blocca: 'bloccato', completa: 'completato', riprendi: 'pianificato' };
    setBlocchi(prev => prev.map(b => b.id === bloccoId ? { ...b, stato: nuovoStato[azione] || b.stato } : b));
    const b = blocchi.find(x => x.id === bloccoId);
    logEvent(azione === 'blocca' ? 'blocco' : 'modifica', `${azione.toUpperCase()}: ${b?.titolo || bloccoId}`, bloccoId, b?.commessa_code);
  }, [blocchi, logEvent]);

  // ══════════════════════════════════════════════════════════════
  // GANTT DIPENDENZE — archi tra blocchi per visualizzazione
  // ══════════════════════════════════════════════════════════════
  const ganttArchi = useMemo(() => {
    const archi: { from: string; to: string; fromData: string; toData: string; fromCommessa: string }[] = [];
    blocchi.forEach(b => {
      b.dipendenze.forEach(depId => {
        const dep = blocchi.find(x => x.id === depId);
        if (dep) {
          archi.push({ from: depId, to: b.id, fromData: dep.data, toData: b.data, fromCommessa: dep.commessa_code });
        }
      });
    });
    return archi;
  }, [blocchi]);

  // ══════════════════════════════════════════════════════════════
  // HEATMAP DATI — saturazione per ogni giorno del mese
  // ══════════════════════════════════════════════════════════════
  const heatmapMese = useMemo(() => {
    return monthDays.map(d => ({
      data: d,
      sat: saturazione[d] || 0,
      blocchi: (blocchiPerGiorno[d] || []).length,
      ore: (blocchiPerGiorno[d] || []).reduce((a: number, b: Blocco) => a + b.durata_h, 0),
    }));
  }, [monthDays, saturazione, blocchiPerGiorno]);

  // ══════════════════════════════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ══════════════════════════════════════════════════════════════
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((messaggio: string, tipo: Toast['tipo'] = 'info') => {
    const t: Toast = { id: 'toast-' + Date.now(), messaggio, tipo, timestamp: Date.now() };
    setToasts(prev => [...prev, t]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3500);
  }, []);

  // ══════════════════════════════════════════════════════════════
  // COMPLETATI OGGI — contatore real-time
  // ══════════════════════════════════════════════════════════════
  const completatiOggi = useMemo(() => {
    return blocchi.filter(b => b.data === oggi && b.stato === 'completato').length;
  }, [blocchi, oggi]);

  const blocchiOggiTotale = useMemo(() => {
    return blocchi.filter(b => b.data === oggi).length;
  }, [blocchi, oggi]);

  // ══════════════════════════════════════════════════════════════
  // CATENA CRITICA DETTAGLIATA — con blocchi reali
  // ══════════════════════════════════════════════════════════════
  const catenaCriticaDettaglio = useMemo(() => {
    return catenaCritica.map(id => blocchi.find(b => b.id === id)).filter(Boolean) as Blocco[];
  }, [catenaCritica, blocchi]);

  // Override quickAction per aggiungere toast
  const quickActionToast = useCallback((bloccoId: string, azione: 'conferma' | 'blocca' | 'completa' | 'riprendi') => {
    quickAction(bloccoId, azione);
    const b = blocchi.find(x => x.id === bloccoId);
    const msgs: Record<string, string> = { conferma: 'Confermato', blocca: 'Bloccato', completa: 'Completato', riprendi: 'Ripristinato' };
    addToast(`${msgs[azione] || azione}: ${b?.titolo || ''}`, azione === 'blocca' ? 'errore' : 'successo');
  }, [quickAction, blocchi, addToast]);

  // ══════════════════════════════════════════════════════════════
  // TREND SETTIMANALE — confronto con settimana precedente
  // ══════════════════════════════════════════════════════════════
  const trendSettimana = useMemo(() => {
    // Calcola ore previste vs ore completate per giorno
    return weekDays.map(d => {
      const bs = blocchiPerGiorno[d] || [];
      const previste = bs.reduce((a, b) => a + b.durata_h, 0);
      const completate = bs.filter(b => b.stato === 'completato').reduce((a, b) => a + b.durata_h, 0);
      const inCorso = bs.filter(b => b.stato === 'in_corso').reduce((a, b) => a + b.durata_h, 0);
      return { data: d, previste, completate, inCorso, pct: previste > 0 ? Math.round((completate / previste) * 100) : 0 };
    });
  }, [weekDays, blocchiPerGiorno]);

  // ══════════════════════════════════════════════════════════════
  // MULTI-SELECT — seleziona piu' blocchi
  // ══════════════════════════════════════════════════════════════
  const [multiSelect, setMultiSelect] = useState<Set<string>>(new Set());

  const toggleMultiSelect = useCallback((id: string) => {
    setMultiSelect(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearMultiSelect = useCallback(() => setMultiSelect(new Set()), []);

  // Azione batch su tutti i selezionati
  const batchAction = useCallback((azione: 'conferma' | 'blocca' | 'completa' | 'riprendi' | 'sposta', data?: string) => {
    const ids = Array.from(multiSelect);
    if (ids.length === 0) return;
    if (azione === 'sposta' && data) {
      setBlocchi(prev => prev.map(b => ids.includes(b.id) ? { ...b, data } : b));
      logEvent('spostamento', `BATCH SPOSTA ${ids.length} blocchi a ${data}`);
      addToast(`${ids.length} blocchi spostati a ${data}`, 'successo');
    } else {
      const nuovoStato: Record<string, Blocco['stato']> = { conferma: 'in_corso', blocca: 'bloccato', completa: 'completato', riprendi: 'pianificato' };
      const s = nuovoStato[azione];
      if (s) {
        setBlocchi(prev => prev.map(b => ids.includes(b.id) ? { ...b, stato: s } : b));
        logEvent('modifica', `BATCH ${azione.toUpperCase()} ${ids.length} blocchi`);
        addToast(`${ids.length} blocchi: ${azione}`, azione === 'blocca' ? 'errore' : 'successo');
      }
    }
    clearMultiSelect();
  }, [multiSelect, logEvent, addToast, clearMultiSelect]);

  // ══════════════════════════════════════════════════════════════
  // COMMESSA DETAIL — tutte le fasi di una commessa
  // ══════════════════════════════════════════════════════════════
  const [commessaDetailCode, setCommessaDetailCode] = useState<string | null>(null);

  const commessaDetail = useMemo(() => {
    if (!commessaDetailCode) return null;
    const fasi = blocchi.filter(b => b.commessa_code === commessaDetailCode).sort((a, b) => a.data.localeCompare(b.data));
    if (fasi.length === 0) return null;
    const completate = fasi.filter(b => b.stato === 'completato').length;
    const importoTot = fasi.reduce((a, b) => a + (b.importo || 0), 0);
    const oreTot = fasi.reduce((a, b) => a + b.durata_h, 0);
    const cliente = fasi[0].cliente;
    const problemi = fasi.filter(b => b.problema);
    const dataInizio = fasi[0].data;
    const dataFine = fasi[fasi.length - 1].data;
    const pctCompletato = Math.round((completate / fasi.length) * 100);
    return { code: commessaDetailCode, cliente, fasi, completate, totale: fasi.length, importoTot, oreTot, problemi, dataInizio, dataFine, pctCompletato };
  }, [commessaDetailCode, blocchi]);

  // ══════════════════════════════════════════════════════════════
  // TIMER ATTIVI — blocchi in_corso con tempo trascorso
  // ══════════════════════════════════════════════════════════════
  const [timers, setTimers] = useState<Map<string, number>>(new Map()); // bloccoId -> startTimestamp

  const toggleTimer = useCallback((bloccoId: string) => {
    setTimers(prev => {
      const next = new Map(prev);
      if (next.has(bloccoId)) { next.delete(bloccoId); } else { next.set(bloccoId, Date.now()); }
      return next;
    });
  }, []);

  const timerAttivi = useMemo(() => {
    const now = Date.now();
    return Array.from(timers.entries()).map(([id, start]) => {
      const b = blocchi.find(x => x.id === id);
      const elapsed = Math.floor((now - start) / 60000); // minuti
      return { id, titolo: b?.titolo || '', elapsed, ore: Math.floor(elapsed / 60), minuti: elapsed % 60 };
    });
  }, [timers, blocchi]);

  // ══════════════════════════════════════════════════════════════
  // NOTE RAPIDE — aggiungi nota a blocco
  // ══════════════════════════════════════════════════════════════
  const addNota = useCallback((bloccoId: string, nota: string) => {
    setBlocchi(prev => prev.map(b => b.id === bloccoId ? { ...b, note: b.note ? b.note + '\n' + nota : nota } : b));
    const b = blocchi.find(x => x.id === bloccoId);
    logEvent('nota', `Nota su ${b?.titolo || bloccoId}: ${nota.slice(0, 50)}`, bloccoId, b?.commessa_code);
    addToast('Nota aggiunta', 'info');
  }, [blocchi, logEvent, addToast]);

  // ══════════════════════════════════════════════════════════════
  // EXPORT REPORT — genera testo report e copia in clipboard
  // ══════════════════════════════════════════════════════════════
  const exportReport = useCallback(() => {
    const s = statsSettimana;
    const lines = [
      `REPORT SETTIMANA ${weekStart} - ${weekEnd}`,
      `Blocchi: ${s.completati}/${s.totale} completati (${s.pctCompletato}%)`,
      `In corso: ${s.inCorso} | Bloccati: ${s.bloccati} | Ritardo: ${s.ritardo}`,
      `Ore: ${s.oreFatte}/${s.oreTotali}h`,
      `Entrate: ${fmtEur(kpiSettimana.entrate)} | Uscite: ${fmtEur(kpiSettimana.uscite)} | Margine: ${fmtEur(kpiSettimana.margine)}`,
      `Commesse attive: ${kpiSettimana.commesseUniche}`,
      `Montaggi: ${kpiSettimana.montaggi} | Problemi: ${eccezioni.length} | Conflitti: ${conflitti.length}`,
      `Alert predittivi: ${alertPredittivi.length}`,
      '',
      'RISORSE:',
      ...risorseUniche.map(r => {
        const ore = blocchi.filter(b => b.risorsa === r && b.stato !== 'completato').reduce((a, b) => a + b.durata_h, 0);
        return `  ${r}: ${ore}h (${Math.round((ore / 40) * 100)}%)`;
      }),
    ];
    const text = lines.join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      addToast('Report copiato in clipboard', 'successo');
    }
    return text;
  }, [statsSettimana, kpiSettimana, eccezioni, conflitti, alertPredittivi, risorseUniche, blocchi, weekStart, weekEnd, addToast]);

  // ══════════════════════════════════════════════════════════════
  // RISORSA DETAIL — dettaglio carico di una risorsa
  // ══════════════════════════════════════════════════════════════
  const [risorsaDetailName, setRisorsaDetailName] = useState<string | null>(null);

  const risorsaDetail = useMemo(() => {
    if (!risorsaDetailName) return null;
    const bsRisorsa = blocchi.filter(b => b.risorsa === risorsaDetailName);
    const perGiorno = weekDays.map(d => {
      const bs = bsRisorsa.filter(b => b.data === d);
      return { data: d, blocchi: bs, ore: bs.reduce((a, b) => a + b.durata_h, 0) };
    });
    const oreTotali = bsRisorsa.reduce((a, b) => a + b.durata_h, 0);
    const completati = bsRisorsa.filter(b => b.stato === 'completato').length;
    const problemi = bsRisorsa.filter(b => b.problema);
    const commesse = [...new Set(bsRisorsa.map(b => b.commessa_code).filter(Boolean))];
    return { nome: risorsaDetailName, perGiorno, oreTotali, totale: bsRisorsa.length, completati, problemi, commesse, pct: Math.round((oreTotali / 40) * 100) };
  }, [risorsaDetailName, blocchi, weekDays]);

  // ══════════════════════════════════════════════════════════════
  // AGENDA LISTA — tutti i blocchi in ordine cronologico
  // ══════════════════════════════════════════════════════════════
  const agendaLista = useMemo(() => {
    return [...blocchiFiltrati]
      .filter(b => b.stato !== 'completato')
      .sort((a, b) => {
        const dc = a.data.localeCompare(b.data);
        if (dc !== 0) return dc;
        if (a.ora && b.ora) return a.ora.localeCompare(b.ora);
        if (a.ora) return -1;
        if (b.ora) return 1;
        return a.priorita - b.priorita;
      });
  }, [blocchiFiltrati]);

  // ══════════════════════════════════════════════════════════════
  // RECAP GIORNALIERO — summary di cosa e' successo oggi
  // ══════════════════════════════════════════════════════════════
  const recapGiornaliero = useMemo(() => {
    const bs = blocchiPerGiorno[oggi] || [];
    const completati = bs.filter(b => b.stato === 'completato');
    const inCorso = bs.filter(b => b.stato === 'in_corso');
    const bloccati = bs.filter(b => b.stato === 'bloccato');
    const rimasti = bs.filter(b => b.stato === 'pianificato');
    const oreFatte = completati.reduce((a, b) => a + b.durata_h, 0);
    const oreRimaste = rimasti.reduce((a, b) => a + b.durata_h, 0) + inCorso.reduce((a, b) => a + b.durata_h * (1 - b.avanzamento / 100), 0);
    const importoIncassato = completati.filter(b => b.importo && b.importo > 0).reduce((a, b) => a + (b.importo || 0), 0);
    const lines: string[] = [];
    if (completati.length > 0) lines.push(`${completati.length} completati (${oreFatte}h)`);
    if (inCorso.length > 0) lines.push(`${inCorso.length} in corso`);
    if (bloccati.length > 0) lines.push(`${bloccati.length} BLOCCATI`);
    if (rimasti.length > 0) lines.push(`${rimasti.length} da fare (${Math.round(oreRimaste)}h)`);
    if (importoIncassato > 0) lines.push(`Incassato: ${fmtEur(importoIncassato)}`);
    return { completati: completati.length, inCorso: inCorso.length, bloccati: bloccati.length, rimasti: rimasti.length, oreFatte, oreRimaste: Math.round(oreRimaste), importoIncassato, summary: lines.join(' | '), totale: bs.length, pct: bs.length > 0 ? Math.round((completati.length / bs.length) * 100) : 0 };
  }, [blocchiPerGiorno, oggi]);

  // ══════════════════════════════════════════════════════════════
  // DUPLICA BLOCCO
  // ══════════════════════════════════════════════════════════════
  const duplicaBlocco = useCallback((bloccoId: string, nuovaData?: string) => {
    const orig = blocchi.find(b => b.id === bloccoId);
    if (!orig) return;
    const clone: Blocco = {
      ...orig,
      id: 'dup-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      data: nuovaData || orig.data,
      stato: 'pianificato',
      avanzamento: 0,
    };
    setBlocchi(prev => [...prev, clone]);
    logEvent('creazione', `Duplicato: ${orig.titolo}`, clone.id, orig.commessa_code);
    addToast(`Duplicato: ${orig.titolo}`, 'successo');
  }, [blocchi, logEvent, addToast]);

  // ══════════════════════════════════════════════════════════════
  // STORICO STATI — traccia ogni cambio stato
  // ══════════════════════════════════════════════════════════════
  const [storicoStati, setStoricoStati] = useState<StoricoEntry[]>([]);

  const registraStato = useCallback((bloccoId: string, vecchio: string, nuovo: string) => {
    setStoricoStati(prev => [{
      id: 'st-' + Date.now(),
      timestamp: new Date().toISOString(),
      blocco_id: bloccoId,
      stato_da: vecchio,
      stato_a: nuovo,
    }, ...prev].slice(0, 500));
  }, []);

  // ══════════════════════════════════════════════════════════════
  // FILTRI AVANZATI COMBINABILI — layer + stato + risorsa
  // ══════════════════════════════════════════════════════════════
  const [filtroAvanzato, setFiltroAvanzato] = useState<{ stato?: string; risorsa?: string; commessa?: string } | null>(null);

  const blocchiFiltroAvanzato = useMemo(() => {
    if (!filtroAvanzato) return null;
    return blocchi.filter(b => {
      if (filtroAvanzato.stato && b.stato !== filtroAvanzato.stato) return false;
      if (filtroAvanzato.risorsa && b.risorsa !== filtroAvanzato.risorsa) return false;
      if (filtroAvanzato.commessa && b.commessa_code !== filtroAvanzato.commessa) return false;
      return true;
    });
  }, [filtroAvanzato, blocchi]);

  // ══════════════════════════════════════════════════════════════
  // CAMBIO RISORSA — riassegna blocco a risorsa diversa
  // ══════════════════════════════════════════════════════════════
  const cambiaRisorsa = useCallback((bloccoId: string, nuovaRisorsa: string) => {
    const b = blocchi.find(x => x.id === bloccoId);
    if (!b) return;
    const vecchia = b.risorsa;
    setBlocchi(prev => prev.map(x => x.id === bloccoId ? { ...x, risorsa: nuovaRisorsa } : x));
    logEvent('modifica', `Risorsa ${vecchia} -> ${nuovaRisorsa}: ${b.titolo}`, bloccoId, b.commessa_code);
    addToast(`Riassegnato a ${nuovaRisorsa}`, 'info');
  }, [blocchi, logEvent, addToast]);

  // ══════════════════════════════════════════════════════════════
  // TEMPO RIMANENTE GIORNATA
  // ══════════════════════════════════════════════════════════════
  const tempoRimanente = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const fineGiornata = 19; // 19:00
    const oreRimaste = Math.max(fineGiornata - h - m / 60, 0);
    const oreImpegnate = recapGiornaliero.oreRimaste;
    return {
      oreDisponibili: Math.round(oreRimaste * 10) / 10,
      oreImpegnate,
      surplus: Math.round((oreRimaste - oreImpegnate) * 10) / 10,
      overload: oreImpegnate > oreRimaste,
    };
  }, [recapGiornaliero]);

  // ══════════════════════════════════════════════════════════════
  // COMMESSE UNICHE con stato aggregato
  // ══════════════════════════════════════════════════════════════
  const commesseAttive = useMemo(() => {
    const map = new Map<string, { code: string; cliente: string; totale: number; completati: number; bloccati: number; importo: number }>();
    blocchi.forEach(b => {
      if (!b.commessa_code) return;
      if (!map.has(b.commessa_code)) map.set(b.commessa_code, { code: b.commessa_code, cliente: b.cliente, totale: 0, completati: 0, bloccati: 0, importo: 0 });
      const c = map.get(b.commessa_code)!;
      c.totale++;
      if (b.stato === 'completato') c.completati++;
      if (b.stato === 'bloccato') c.bloccati++;
      if (b.importo) c.importo += b.importo;
    });
    return Array.from(map.values()).sort((a, b) => (a.completati / a.totale) - (b.completati / b.totale));
  }, [blocchi]);

  // ══════════════════════════════════════════════════════════════
  // AGGIORNA AVANZAMENTO — slider %
  // ══════════════════════════════════════════════════════════════
  const aggiornaAvanzamento = useCallback((bloccoId: string, pct: number) => {
    const clamped = Math.max(0, Math.min(100, pct));
    setBlocchi(prev => prev.map(b => {
      if (b.id !== bloccoId) return b;
      const nuovoStato = clamped === 100 ? 'completato' : clamped > 0 && b.stato === 'pianificato' ? 'in_corso' : b.stato;
      return { ...b, avanzamento: clamped, stato: nuovoStato };
    }));
    if (pct === 100) addToast('Completato!', 'successo');
  }, [addToast]);

  // ══════════════════════════════════════════════════════════════
  // DIPENDENZE DETAIL — per sidebar, mostra predecessori e successori
  // ══════════════════════════════════════════════════════════════
  const getDipendenze = useCallback((bloccoId: string) => {
    const predecessori = (grafoDepend.predecessori.get(bloccoId) || []).map(id => blocchi.find(b => b.id === id)).filter(Boolean) as Blocco[];
    const successori = (grafoDepend.successori.get(bloccoId) || []).map(id => blocchi.find(b => b.id === id)).filter(Boolean) as Blocco[];
    return { predecessori, successori };
  }, [grafoDepend, blocchi]);

  // ══════════════════════════════════════════════════════════════
  // PRINT REPORT
  // ══════════════════════════════════════════════════════════════
  const printReport = useCallback(() => {
    if (typeof window !== 'undefined') window.print();
  }, []);

  // ══════════════════════════════════════════════════════════════
  // BATCH CON CONFERMA — restituisce dati per modal
  // ══════════════════════════════════════════════════════════════
  const [pendingBatch, setPendingBatch] = useState<{ azione: string; data?: string } | null>(null);

  const requestBatch = useCallback((azione: string, data?: string) => {
    if (['blocca', 'completa'].includes(azione) && multiSelect.size > 3) {
      setPendingBatch({ azione, data });
    } else {
      batchAction(azione as any, data);
    }
  }, [multiSelect, batchAction]);

  const confirmBatch = useCallback(() => {
    if (!pendingBatch) return;
    batchAction(pendingBatch.azione as any, pendingBatch.data);
    setPendingBatch(null);
  }, [pendingBatch, batchAction]);

  const cancelBatch = useCallback(() => setPendingBatch(null), []);

  // ══════════════════════════════════════════════════════════════
  // PROSSIMI BLOCCHI — cosa succede nelle prossime 2 ore
  // ══════════════════════════════════════════════════════════════
  const prossimiBlocchi = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const nowMinutes = h * 60 + m;
    const fra2ore = nowMinutes + 120;
    return blocchi.filter(b => {
      if (b.data !== oggi || b.stato === 'completato' || !b.ora) return false;
      const [bh, bm] = b.ora.split(':').map(Number);
      const bMin = bh * 60 + (bm || 0);
      return bMin >= nowMinutes && bMin <= fra2ore;
    }).sort((a, b) => a.ora.localeCompare(b.ora));
  }, [blocchi, oggi]);

  // ══════════════════════════════════════════════════════════════
  // CAMBIA PRIORITA
  // ══════════════════════════════════════════════════════════════
  const cambiaPriorita = useCallback((bloccoId: string, nuovaPriorita: number) => {
    setBlocchi(prev => prev.map(b => b.id === bloccoId ? { ...b, priorita: nuovaPriorita } : b));
    const b = blocchi.find(x => x.id === bloccoId);
    logEvent('modifica', `Priorita ${b?.titolo}: ${nuovaPriorita}`, bloccoId, b?.commessa_code);
  }, [blocchi, logEvent]);

  // ══════════════════════════════════════════════════════════════
  // CARICO GIORNALIERO — ore assegnate vs capacita per oggi
  // ══════════════════════════════════════════════════════════════
  const caricoGiornaliero = useMemo(() => {
    const bs = blocchiPerGiorno[oggi] || [];
    const oreAssegnate = bs.filter(b => b.stato !== 'completato').reduce((a, b) => a + b.durata_h, 0);
    const capacita = risorseUniche.length * 8; // 8h per risorsa
    const pct = capacita > 0 ? Math.round((oreAssegnate / capacita) * 100) : 0;
    return { oreAssegnate, capacita, pct, overload: pct > 100 };
  }, [blocchiPerGiorno, oggi, risorseUniche]);

  // ══════════════════════════════════════════════════════════════
  // STORICO PER BLOCCO — filtra storico per blocco specifico
  // ══════════════════════════════════════════════════════════════
  const storicoPerBlocco = useCallback((bloccoId: string) => {
    return storicoStati.filter(s => s.blocco_id === bloccoId);
  }, [storicoStati]);

  // ══════════════════════════════════════════════════════════════
  // SIDEBAR COLLAPSED STATE
  // ══════════════════════════════════════════════════════════════
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarCollapsed(p => !p), []);

  // ══════════════════════════════════════════════════════════════
  // DRAG RISORSA — sposta blocco su altra risorsa (per vista Risorse)
  // ══════════════════════════════════════════════════════════════
  const dropSuRisorsa = useCallback((bloccoId: string, nuovaRisorsa: string) => {
    const b = blocchi.find(x => x.id === bloccoId);
    if (!b || b.risorsa === nuovaRisorsa) return;
    // Check se risorsa e' gia piena quel giorno
    const oreGia = blocchi.filter(x => x.risorsa === nuovaRisorsa && x.data === b.data && x.stato !== 'completato')
      .reduce((a, x) => a + x.durata_h, 0);
    if (oreGia + b.durata_h > 10) {
      addToast(`${nuovaRisorsa} gia a ${oreGia}h il ${b.data}`, 'warning');
    }
    cambiaRisorsa(bloccoId, nuovaRisorsa);
  }, [blocchi, cambiaRisorsa, addToast]);

  // ══════════════════════════════════════════════════════════════
  // SUMMARY EXPORT DETTAGLIATO
  // ══════════════════════════════════════════════════════════════
  const exportDettagliato = useCallback(() => {
    const lines = [
      `REPORT DETTAGLIATO — ${oggi}`,
      `${'='.repeat(50)}`,
      '',
      ...blocchi.map(b => `[${b.stato.toUpperCase()}] ${b.data} ${b.ora||'--:--'} | ${b.titolo} | ${b.risorsa} | ${b.commessa_code} | ${b.durata_h}h | ${b.avanzamento}%`),
    ];
    const text = lines.join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      addToast('Report dettagliato copiato', 'successo');
    }
    return text;
  }, [blocchi, oggi, addToast]);

  // ══════════════════════════════════════════════════════════════
  // AUTO-SCHEDULING SUGGERIMENTO — trova primo slot libero
  // ══════════════════════════════════════════════════════════════
  const autoSchedule = useCallback((durata_h: number, layer: LayerId, risorsaPref?: string): { data: string; ora: string; risorsa: string } | null => {
    // Scansiona prossimi 14 giorni, trova primo slot
    for (let d = 0; d < 14; d++) {
      const data = fmtISO(addDays(new Date(), d));
      const dow = new Date(data + 'T00:00:00').getDay();
      if (dow === 0) continue; // salta domenica
      const candidates = risorsaPref ? [risorsaPref] : risorseUniche;
      for (const risorsa of candidates) {
        const oreGia = blocchi.filter(b => b.risorsa === risorsa && b.data === data && b.stato !== 'completato')
          .reduce((a, b) => a + b.durata_h, 0);
        if (oreGia + durata_h <= 8) {
          // Trova ora libera
          const oreOccupate = blocchi.filter(b => b.risorsa === risorsa && b.data === data && b.ora)
            .map(b => ({ start: parseOra(b.ora), dur: b.durata_h }));
          for (let h = 7; h <= 18 - durata_h; h++) {
            const libero = !oreOccupate.some(o => h < o.start + o.dur && h + durata_h > o.start);
            if (libero) return { data, ora: `${String(h).padStart(2, '0')}:00`, risorsa };
          }
        }
      }
    }
    return null;
  }, [blocchi, risorseUniche]);

  // ══════════════════════════════════════════════════════════════
  // SCENARIO SIMULATOR — confronta impatto di N blocchi fantasma
  // ══════════════════════════════════════════════════════════════
  const simulaScenario = useCallback((blocchiSimulati: { titolo: string; durata_h: number; data: string; risorsa: string }[]) => {
    const conflittiTrovati: string[] = [];
    const satModificata = { ...saturazione };
    blocchiSimulati.forEach(bs => {
      const oreGia = blocchi.filter(b => b.risorsa === bs.risorsa && b.data === bs.data && b.stato !== 'completato')
        .reduce((a, b) => a + b.durata_h, 0);
      const oreTotali = oreGia + bs.durata_h;
      if (oreTotali > 8) conflittiTrovati.push(`${bs.risorsa} sovraccarica il ${bs.data}: ${oreTotali}h`);
      const satGiorno = (satModificata[bs.data] || 0) + Math.round((bs.durata_h / 8) * 100);
      satModificata[bs.data] = satGiorno;
      if (satGiorno > 100) conflittiTrovati.push(`Saturazione ${bs.data}: ${satGiorno}%`);
    });
    return { conflitti: conflittiTrovati, saturazione: satModificata, fattibile: conflittiTrovati.length === 0 };
  }, [blocchi, saturazione]);

  // ══════════════════════════════════════════════════════════════
  // WEEKLY SUMMARY — testo riassuntivo settimana per WhatsApp/email
  // ══════════════════════════════════════════════════════════════
  const weeklySummary = useCallback(() => {
    const s = statsSettimana;
    const problemi = eccezioni.length;
    const emoji = s.pctCompletato >= 80 ? 'ottima' : s.pctCompletato >= 50 ? 'nella media' : 'difficile';
    const lines = [
      `Settimana ${emoji}:`,
      `${s.completati}/${s.totale} completati (${s.pctCompletato}%)`,
      `${s.oreFatte}h lavorate su ${s.oreTotali}h previste`,
      problemi > 0 ? `${problemi} problemi aperti` : 'Nessun problema',
      kpiSettimana.margine !== 0 ? `Margine: ${fmtEur(kpiSettimana.margine)}` : '',
      alertPredittivi.length > 0 ? `${alertPredittivi.length} alert da gestire` : '',
    ].filter(Boolean);
    const text = lines.join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      addToast('Summary copiato — pronto per WhatsApp', 'successo');
    }
    return text;
  }, [statsSettimana, eccezioni, kpiSettimana, alertPredittivi, addToast]);

  // ══════════════════════════════════════════════════════════════
  // SEARCH COMMESSE — cerca per nome/codice/cliente
  // ══════════════════════════════════════════════════════════════
  const searchCommesse = useCallback((query: string) => {
    const q = query.toLowerCase();
    return commesseAttive.filter(c =>
      c.code.toLowerCase().includes(q) || c.cliente.toLowerCase().includes(q)
    );
  }, [commesseAttive]);

  // ══════════════════════════════════════════════════════════════
  // CREA DA TEMPLATE — blocco precompilato per tipo
  // ══════════════════════════════════════════════════════════════
  const templateBlocchi: Record<string, Partial<Blocco>> = {
    sopralluogo: { tipo: 'sopralluogo', layer: 'commerciale', durata_h: 2, priorita: 3 },
    montaggio: { tipo: 'montaggio', layer: 'montaggi', durata_h: 8, priorita: 2 },
    consegna: { tipo: 'consegna', layer: 'logistica', durata_h: 3, priorita: 2 },
    misure: { tipo: 'misure', layer: 'commerciale', durata_h: 1, priorita: 3 },
    produzione: { tipo: 'produzione', layer: 'produzione', durata_h: 8, priorita: 3 },
    collaudo: { tipo: 'collaudo', layer: 'montaggi', durata_h: 2, priorita: 2 },
    pagamento: { tipo: 'pagamento', layer: 'pagamenti', durata_h: 0.5, priorita: 4 },
    riunione: { tipo: 'riunione', layer: 'admin', durata_h: 1, priorita: 4 },
  };

  const creaDaTemplate = useCallback((templateId: string, override: Partial<Blocco>) => {
    const tmpl = templateBlocchi[templateId] || {};
    const newB: Blocco = {
      id: 'new-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      layer: (tmpl.layer || 'admin') as LayerId,
      tipo: tmpl.tipo || templateId,
      titolo: override.titolo || `Nuovo ${templateId}`,
      cliente: override.cliente || '',
      commessa_code: override.commessa_code || '',
      commessa_id: '', data: override.data || oggi,
      ora: override.ora || '09:00',
      durata_h: tmpl.durata_h || 2,
      risorsa: override.risorsa || risorseUniche[0] || '',
      indirizzo: override.indirizzo || '',
      stato: 'pianificato', priorita: tmpl.priorita || 3,
      importo: override.importo ?? null, avanzamento: 0,
      materiali_ok: true, pagamento_ok: true,
      problema: '', note: '', dipendenze: [],
      source: 'manual', source_id: '',
    };
    setBlocchi(prev => [...prev, newB]);
    logEvent('creazione', `Nuovo ${templateId}: ${newB.titolo}`, newB.id, newB.commessa_code);
    addToast(`Creato: ${newB.titolo}`, 'successo');
    return newB;
  }, [oggi, risorseUniche, logEvent, addToast]);

  // ══════════════════════════════════════════════════════════════
  // PRODUCTIVITY SCORE — punteggio giornaliero 0-100
  // ══════════════════════════════════════════════════════════════
  const productivityScore = useMemo(() => {
    const r = recapGiornaliero;
    if (r.totale === 0) return { score: 0, label: 'N/A', color: '#ccc' };
    let score = r.pct; // base: % completamento
    if (r.bloccati > 0) score -= r.bloccati * 10; // penalita blocchi
    if (r.oreRimaste > 0 && tempoRimanente.oreDisponibili < r.oreRimaste) score -= 15; // penalita overload
    score = Math.max(0, Math.min(100, Math.round(score)));
    const label = score >= 80 ? 'Eccellente' : score >= 60 ? 'Buono' : score >= 40 ? 'Da migliorare' : 'Critico';
    const color = score >= 80 ? '#1A9E73' : score >= 60 ? '#28A0A0' : score >= 40 ? '#D08008' : '#DC4444';
    return { score, label, color };
  }, [recapGiornaliero, tempoRimanente]);

  // ══════════════════════════════════════════════════════════════
  // #20 CAPACITY ENGINE — capacita reale risorse
  // ══════════════════════════════════════════════════════════════
  const [capacityOverrides, setCapacityOverrides] = useState<Map<string, { ferie: string[]; oreMax: number; sabato: boolean }>>(new Map());

  const capacitaRisorse = useMemo(() => {
    return risorseUniche.map(r => {
      const override = capacityOverrides.get(r);
      const oreMaxGiorno = override?.oreMax || 8;
      const sabato = override?.sabato || false;
      const ferie = new Set(override?.ferie || []);
      const perGiorno = weekDays.map(d => {
        const dow = new Date(d + 'T00:00:00').getDay();
        const disponibile = ferie.has(d) ? 0 : (dow === 0 ? 0 : dow === 6 ? (sabato ? oreMaxGiorno / 2 : 0) : oreMaxGiorno);
        const assegnate = blocchi.filter(b => b.risorsa === r && b.data === d && b.stato !== 'completato').reduce((a, b) => a + b.durata_h, 0);
        return { data: d, disponibile, assegnate, libere: Math.max(disponibile - assegnate, 0), pct: disponibile > 0 ? Math.round((assegnate / disponibile) * 100) : 0 };
      });
      const oreSettimana = perGiorno.reduce((a, g) => a + g.disponibile, 0);
      const oreAssegnate = perGiorno.reduce((a, g) => a + g.assegnate, 0);
      return { risorsa: r, perGiorno, oreSettimana, oreAssegnate, pct: oreSettimana > 0 ? Math.round((oreAssegnate / oreSettimana) * 100) : 0 };
    });
  }, [risorseUniche, weekDays, blocchi, capacityOverrides]);

  const setCapacityOverride = useCallback((risorsa: string, override: { ferie?: string[]; oreMax?: number; sabato?: boolean }) => {
    setCapacityOverrides(prev => {
      const next = new Map(prev);
      const existing = next.get(risorsa) || { ferie: [], oreMax: 8, sabato: false };
      next.set(risorsa, { ...existing, ...override });
      return next;
    });
  }, []);

  // ══════════════════════════════════════════════════════════════
  // #21 PRIORITY ENGINE — priorita dinamiche ricalcolate
  // ══════════════════════════════════════════════════════════════
  const prioritaDinamiche = useMemo(() => {
    return blocchi.filter(b => b.stato !== 'completato').map(b => {
      let score = 0;
      // Data promessa vicina
      const giorniA = Math.ceil((new Date(b.data + 'T00:00:00').getTime() - new Date(oggi + 'T00:00:00').getTime()) / 86400000);
      if (giorniA <= 0) score += 40; // gia scaduto
      else if (giorniA <= 1) score += 30;
      else if (giorniA <= 3) score += 20;
      else if (giorniA <= 7) score += 10;
      // Stato
      if (b.stato === 'bloccato') score += 25;
      if (b.stato === 'ritardo') score += 20;
      // Importo alto
      if ((b.importo || 0) > 10000) score += 15;
      else if ((b.importo || 0) > 5000) score += 10;
      // Materiali mancanti
      if (!b.materiali_ok) score += 15;
      // Problemi
      if (b.problema) score += 10;
      // Priorita originale
      score += (5 - b.priorita) * 5;
      // Montaggio (piu visibile al cliente)
      if (b.layer === 'montaggi') score += 5;
      return { ...b, scoreDinamico: Math.min(100, score), urgenza: score >= 60 ? 'critica' as const : score >= 40 ? 'alta' as const : score >= 20 ? 'media' as const : 'bassa' as const };
    }).sort((a, b) => b.scoreDinamico - a.scoreDinamico);
  }, [blocchi, oggi]);

  // ══════════════════════════════════════════════════════════════
  // #28 GESTIONE BUFFER — margini realistici
  // ══════════════════════════════════════════════════════════════
  const [bufferConfig, setBufferConfig] = useState({
    fornitoreInaffidabile: 2, // giorni extra
    cantiereDifficile: 1,
    meteo: 0.5,
    revisioneTecnica: 1,
    rischioErrore: 0.5,
  });

  const bufferPerBlocco = useCallback((blocco: Blocco): number => {
    let buffer = 0;
    if (!blocco.materiali_ok) buffer += bufferConfig.fornitoreInaffidabile;
    if (blocco.layer === 'montaggi') buffer += bufferConfig.cantiereDifficile;
    if (blocco.problema) buffer += bufferConfig.rischioErrore;
    if (blocco.tipo === 'produzione' && blocco.avanzamento < 50) buffer += bufferConfig.revisioneTecnica;
    return buffer;
  }, [bufferConfig]);

  // ══════════════════════════════════════════════════════════════
  // #30 PANNELLO PROBLEMI — dati aggregati
  // ══════════════════════════════════════════════════════════════
  const problemiAperti = useMemo(() => {
    return blocchi.filter(b => b.problema && b.stato !== 'completato').map(b => ({
      id: b.id, titolo: b.titolo, problema: b.problema, commessa_code: b.commessa_code,
      cliente: b.cliente, risorsa: b.risorsa, data: b.data, priorita: b.priorita,
      gravita: b.priorita <= 1 ? 'critica' : b.priorita <= 2 ? 'alta' : 'media',
    })).sort((a, b) => a.priorita - b.priorita);
  }, [blocchi]);

  // ══════════════════════════════════════════════════════════════
  // #43 DASHBOARD STATO AZIENDA — pressione operativa
  // ══════════════════════════════════════════════════════════════
  const dashboardStato = useMemo(() => {
    const satMedia = weekDays.reduce((a, d) => a + (saturazione[d] || 0), 0) / 7;
    const montaggiConf = blocchi.filter(b => b.layer === 'montaggi' && b.stato === 'in_corso').length;
    const montaggiRischio = blocchi.filter(b => b.layer === 'montaggi' && (!b.materiali_ok || b.stato === 'bloccato')).length;
    const matCritici = blocchi.filter(b => !b.materiali_ok && b.stato !== 'completato').length;
    const blocchiAmm = blocchi.filter(b => b.layer === 'pagamenti' && !b.pagamento_ok).length;
    const ritardoMedio = blocchi.filter(b => b.stato === 'ritardo').length;
    const giornoPiuStressato = weekDays.reduce((best, d) => (saturazione[d] || 0) > (saturazione[best] || 0) ? d : best, weekDays[0]);
    const spazioLibero = weekDays.reduce((a, d) => a + Math.max(100 - (saturazione[d] || 0), 0), 0) / 7;
    return { satMedia: Math.round(satMedia), montaggiConf, montaggiRischio, matCritici, blocchiAmm, ritardoMedio, giornoPiuStressato, spazioLibero: Math.round(spazioLibero), stato: satMedia > 80 ? 'critico' : satMedia > 60 ? 'teso' : satMedia > 30 ? 'normale' : 'tranquillo' };
  }, [blocchi, saturazione, weekDays]);

  // ══════════════════════════════════════════════════════════════
  // #46 LOGICA D'USO GIORNALIERA — flusso mattina/meta/fine
  // ══════════════════════════════════════════════════════════════
  const flussoGiornaliero = useMemo(() => {
    const h = new Date().getHours();
    const fase = h < 10 ? 'mattina' : h < 14 ? 'meta_giornata' : 'fine_giornata';
    const mattina = { alertDaGestire: alertPredittivi.filter(a => a.gravita === 'critica' || a.gravita === 'alta').length, blocchiOggi: (blocchiPerGiorno[oggi] || []).filter(b => b.stato !== 'completato').length, risorseDaConfermare: risorseUniche.filter(r => blocchi.some(b => b.risorsa === r && b.data === oggi && b.stato === 'pianificato')).length };
    const meta = { avanzamentiDaAggiornare: (blocchiPerGiorno[oggi] || []).filter(b => b.stato === 'in_corso' && b.avanzamento < 100).length, imprevisti: problemiAperti.filter(p => p.data === oggi).length };
    const fine = { blocchiDaChiudere: (blocchiPerGiorno[oggi] || []).filter(b => b.stato === 'in_corso').length, domaniDaPreparare: (blocchiPerGiorno[fmtISO(addDays(new Date(), 1))] || []).filter(b => b.stato === 'pianificato').length };
    return { fase, mattina, meta, fine };
  }, [alertPredittivi, blocchiPerGiorno, oggi, risorseUniche, blocchi, problemiAperti]);

  return {
    blocchi: blocchiFiltrati, blocchiPerGiorno, operatori, conflitti, nextActions,
    saturazione, eccezioni, kpiSettimana, loading, oggi, weekStart, weekEnd, weekDays,
    monthDays, risorseUniche, ganttCommesse,
    vista, setVista, selectedDay, setSelectedDay, selectedBlocco, setSelectedBlocco,
    layersAttivi, toggleLayer, navWeek, goToday, creaEvento, refresh: fetchAll,
    checkDrop, eseguiDrop, dragResult, clearDragResult,
    fantasma, creaFantasma, rimuoviFantasma, impactoFantasma,
    filtroSmart, setFiltroSmart, blocchiFiltroSmart,
    guerra, setGuerra, blocchiGuerra,
    eventLog, logEvent,
    grafoDepend, catenaCritica, catenaCriticaDettaglio, blocchiBloccatiDaDip,
    bufferAnalysis, alertPredittivi, statsSettimana,
    suggestRisorsa, dettaglioGiorno, quickAction: quickActionToast, ganttArchi, heatmapMese,
    toasts, addToast, completatiOggi, blocchiOggiTotale, trendSettimana,
    multiSelect, toggleMultiSelect, clearMultiSelect, batchAction: requestBatch,
    commessaDetail, setCommessaDetailCode,
    timerAttivi, toggleTimer,
    addNota,
    exportReport, risorsaDetail, setRisorsaDetailName, agendaLista, recapGiornaliero,
    duplicaBlocco, storicoStati, filtroAvanzato, setFiltroAvanzato, blocchiFiltroAvanzato,
    cambiaRisorsa, tempoRimanente, commesseAttive,
    aggiornaAvanzamento, getDipendenze, printReport,
    pendingBatch, confirmBatch, cancelBatch, prossimiBlocchi,
    cambiaPriorita, caricoGiornaliero, storicoPerBlocco,
    sidebarCollapsed, toggleSidebar, dropSuRisorsa, exportDettagliato,
    autoSchedule, simulaScenario, weeklySummary, searchCommesse,
    creaDaTemplate, templateBlocchi, productivityScore,
    // v8.0
    capacitaRisorse, setCapacityOverride, prioritaDinamiche,
    bufferConfig, setBufferConfig, bufferPerBlocco,
    problemiAperti, dashboardStato, flussoGiornaliero,
  };
}
