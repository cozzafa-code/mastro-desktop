'use client';
// ═══════════════════════════════════════════════════════════
// MASTRO COCKPIT v6 — useCockpit Hook
// Dati organizzati per GIORNO con sezioni: produzione, montaggi, commerciale, pagamenti, team
// ═══════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// ── Types ──
export interface DayBlock {
  id: string; tipo: string; titolo: string; sotto: string; dettaglio: string;
  ora: string; colore: string; importo: number | null; avanzamento: number | null;
  commessa_code: string; persona: string; indirizzo: string; completato: boolean;
  urgenza: boolean; source: string; source_id: string;
}
export interface DayData {
  key: string; // YYYY-MM-DD
  produzione: DayBlock[];
  montaggi: DayBlock[];
  commerciale: DayBlock[];
  pagamenti: DayBlock[];
  team: DayBlock[];
  scadenze: DayBlock[];
}
export interface Operatore {
  id: string; nome: string; cognome: string; ruolo: string;
  stato: 'lavoro' | 'viaggio' | 'pausa' | 'disponibile' | 'offline';
}

function fmtISO(d: Date) { return d.toISOString().split('T')[0]; }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function startOfWeek(d: Date) { const r = new Date(d); const day = r.getDay() || 7; r.setDate(r.getDate() - day + 1); return r; }

// ══════════════════════════════════════════════════════════════
export function useCockpit() {
  const [days, setDays] = useState<Record<string, DayData>>({});
  const [operatori, setOperatori] = useState<Operatore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(fmtISO(new Date()));
  const [weekOffset, setWeekOffset] = useState(0);

  const oggi = fmtISO(new Date());
  const baseWeek = useMemo(() => startOfWeek(addDays(new Date(), weekOffset * 7)), [weekOffset]);
  const weekStart = useMemo(() => fmtISO(baseWeek), [baseWeek]);
  const weekEnd = useMemo(() => fmtISO(addDays(baseWeek, 6)), [baseWeek]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => fmtISO(addDays(baseWeek, i))), [baseWeek]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [evR, cmR, opR, costiR, vaniR] = await Promise.all([
      supabase.from('eventi').select('*').gte('data', weekStart).lte('data', weekEnd).order('ora'),
      supabase.from('commesse').select('*').order('created_at', { ascending: false }),
      supabase.from('operatori').select('*').eq('attivo', true).order('nome'),
      supabase.from('costi_commessa').select('*').gte('data', weekStart).lte('data', weekEnd),
      supabase.from('vani').select('commessa_id'),
    ]);
    const rawEv = evR.data || [];
    const rawCm = cmR.data || [];
    const rawOp = opR.data || [];
    const rawCosti = costiR.data || [];

    // Vani count
    const vc: Record<string, number> = {};
    (vaniR.data || []).forEach((v: any) => { if (v.commessa_id) vc[v.commessa_id] = (vc[v.commessa_id] || 0) + 1; });

    // Init all 7 days
    const map: Record<string, DayData> = {};
    weekDays.forEach(k => { map[k] = { key: k, produzione: [], montaggi: [], commerciale: [], pagamenti: [], team: [], scadenze: [] }; });

    // ── EVENTI → smistamento per sezione ──
    rawEv.forEach((e: any) => {
      const d = e.data;
      if (!map[d]) return;
      const block: DayBlock = {
        id: 'ev-' + e.id, tipo: e.tipo || 'appuntamento', titolo: e.titolo || '',
        sotto: e.persona || '', dettaglio: e.indirizzo || '', ora: e.ora || '',
        colore: e.colore || '#3B7FE0', importo: null, avanzamento: null,
        commessa_code: '', persona: e.persona || '', indirizzo: e.indirizzo || '',
        completato: e.completato || false, urgenza: e.tipo === 'scadenza',
        source: 'eventi', source_id: e.id,
      };
      if (['montaggio', 'posa'].includes(e.tipo)) map[d].montaggi.push(block);
      else if (['sopralluogo', 'misure', 'appuntamento'].includes(e.tipo)) map[d].commerciale.push(block);
      else if (['scadenza'].includes(e.tipo)) map[d].scadenze.push(block);
      else if (['riunione'].includes(e.tipo)) map[d].team.push(block);
      else if (['consegna'].includes(e.tipo)) map[d].commerciale.push(block);
      else if (['collaudo', 'manutenzione'].includes(e.tipo)) map[d].montaggi.push(block);
      else map[d].commerciale.push(block);
    });

    // ── COMMESSE → produzione (attive nel range) ──
    const FASI_PROD = ['produzione', 'ordini', 'ordine'];
    const FASI_MONT = ['posa', 'collaudo'];
    const FASI_COMM = ['preventivo'];
    rawCm.forEach((c: any) => {
      const nome = ((c.cognome || '') + ' ' + (c.cliente || '')).trim();
      const vani = vc[c.id] || 0;
      // Produzione → appare in ogni giorno della settimana (attiva)
      if (FASI_PROD.includes(c.fase)) {
        weekDays.forEach(d => {
          if (!map[d]) return;
          map[d].produzione.push({
            id: 'cm-prod-' + c.id + '-' + d, tipo: 'produzione', titolo: `${c.code} — ${nome}`,
            sotto: `${vani} vani — ${c.fase}`, dettaglio: c.indirizzo || '', ora: '',
            colore: '#7F77DD', importo: c.totale_preventivo || null,
            avanzamento: c.fase === 'produzione' ? 50 : 20,
            commessa_code: c.code, persona: nome, indirizzo: c.indirizzo || '',
            completato: false, urgenza: !!c.ferma, source: 'commesse', source_id: c.id,
          });
        });
      }
      // Posa → montaggi in ogni giorno
      if (FASI_MONT.includes(c.fase)) {
        weekDays.forEach(d => {
          if (!map[d]) return;
          map[d].montaggi.push({
            id: 'cm-mont-' + c.id + '-' + d, tipo: c.fase, titolo: `${c.code} — ${nome}`,
            sotto: `${vani} vani — ${c.fase}`, dettaglio: c.indirizzo || '', ora: '',
            colore: '#639922', importo: c.totale_finale || c.totale_preventivo || null,
            avanzamento: c.fase === 'posa' ? 70 : 90,
            commessa_code: c.code, persona: nome, indirizzo: c.indirizzo || '',
            completato: false, urgenza: false, source: 'commesse', source_id: c.id,
          });
        });
      }
      // Preventivo scaduto → scadenze oggi
      if (c.fase === 'preventivo' && c.created_at) {
        const days_old = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);
        if (days_old > 14 && map[oggi]) {
          map[oggi].scadenze.push({
            id: 'cm-prev-' + c.id, tipo: 'preventivo_scaduto',
            titolo: `Preventivo ${c.code} — ${days_old}gg senza risposta`,
            sotto: nome, dettaglio: '', ora: '', colore: '#E24B4A',
            importo: c.totale_preventivo || null, avanzamento: null,
            commessa_code: c.code, persona: nome, indirizzo: '',
            completato: false, urgenza: days_old > 30, source: 'commesse', source_id: c.id,
          });
        }
      }
      // Ferma → scadenze oggi
      if (c.ferma && map[oggi]) {
        map[oggi].scadenze.push({
          id: 'cm-ferma-' + c.id, tipo: 'commessa_ferma',
          titolo: `${c.code} FERMA — ${c.motivo_ferma || 'da verificare'}`,
          sotto: nome, dettaglio: '', ora: '', colore: '#E24B4A',
          importo: null, avanzamento: null,
          commessa_code: c.code, persona: nome, indirizzo: '',
          completato: false, urgenza: true, source: 'commesse', source_id: c.id,
        });
      }
      // Fatture → pagamenti
      if (c.totale_finale && ['posa', 'chiusura'].includes(c.fase)) {
        const fd = c.updated_at?.split('T')[0] || oggi;
        if (map[fd]) {
          map[fd].pagamenti.push({
            id: 'fatt-' + c.id, tipo: 'fattura_entrata',
            titolo: `Fattura ${c.code} — ${nome}`, sotto: 'Entrata',
            dettaglio: '', ora: '', colore: '#1D9E75',
            importo: c.totale_finale, avanzamento: null,
            commessa_code: c.code, persona: nome, indirizzo: '',
            completato: c.fase === 'chiusura', urgenza: false,
            source: 'commesse', source_id: c.id,
          });
        }
      }
    });

    // ── COSTI → pagamenti ──
    rawCosti.forEach((c: any) => {
      const d = c.data;
      if (!map[d]) return;
      map[d].pagamenti.push({
        id: 'cost-' + c.id, tipo: 'spesa',
        titolo: c.descrizione || 'Costo', sotto: c.tipo || 'Uscita',
        dettaglio: '', ora: '', colore: '#E24B4A',
        importo: -(c.importo || 0), avanzamento: null,
        commessa_code: '', persona: '', indirizzo: '',
        completato: false, urgenza: false,
        source: 'costi_commessa', source_id: c.id,
      });
    });

    setDays(map);

    // OPERATORI
    const statiSim: Operatore['stato'][] = ['lavoro', 'viaggio', 'pausa', 'disponibile', 'lavoro', 'disponibile'];
    setOperatori(rawOp.map((o: any, i: number) => ({
      id: o.id, nome: o.nome || '', cognome: o.cognome || '', ruolo: o.ruolo || '',
      stato: statiSim[i % statiSim.length],
    })));

    setLoading(false);
  }, [weekStart, weekEnd, oggi, weekDays]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Nav
  const navWeek = useCallback((dir: number) => { setWeekOffset(p => p + dir); }, []);
  const goToday = useCallback(() => { setWeekOffset(0); setSelectedDay(oggi); }, [oggi]);

  // CRUD
  const creaEvento = useCallback(async (dati: any) => {
    await supabase.from('eventi').insert({
      azienda_id: 'ccca51c1-656b-4e7c-a501-55753e20da29',
      titolo: dati.titolo, tipo: dati.tipo || 'appuntamento',
      data: dati.data || oggi, ora: dati.ora || '09:00',
      persona: dati.persona || '', indirizzo: dati.indirizzo || '',
      colore: dati.colore || '#3B7FE0', note: dati.note || '',
    });
    await fetchAll();
  }, [oggi, fetchAll]);

  return {
    days, operatori, loading, oggi, weekStart, weekEnd, weekDays,
    selectedDay, setSelectedDay, navWeek, goToday, creaEvento, refresh: fetchAll,
  };
}
