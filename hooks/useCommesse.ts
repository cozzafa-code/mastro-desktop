'use client';
// ═══════════════════════════════════════════════════════════
// MASTRO — useCommesse Hook v2
// Allineato allo schema reale Supabase (DB fgefcigxlbrmbeqqzjmo)
// ═══════════════════════════════════════════════════════════
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface FasePipeline {
  codice: string;
  nome: string;
  colore: string;
  ordine: number;
}

const FASI_DEFAULT: FasePipeline[] = [
  { codice: 'sopralluogo', nome: 'Sopralluogo', colore: '#007aff', ordine: 0 },
  { codice: 'preventivo',  nome: 'Preventivo',  colore: '#ff9500', ordine: 1 },
  { codice: 'conferma',    nome: 'Conferma',    colore: '#af52de', ordine: 2 },
  { codice: 'misure',      nome: 'Misure',      colore: '#5856d6', ordine: 3 },
  { codice: 'ordini',      nome: 'Ordini',      colore: '#ff2d55', ordine: 4 },
  { codice: 'produzione',  nome: 'Produzione',  colore: '#ff9500', ordine: 5 },
  { codice: 'posa',        nome: 'Posa',        colore: '#34c759', ordine: 6 },
  { codice: 'chiusura',    nome: 'Chiusura',    colore: '#30b0c7', ordine: 7 },
];

export interface Commessa {
  id: string;
  code: string;
  cliente: string;
  cognome: string;
  indirizzo: string;
  telefono: string;
  email: string;
  fase: string;
  tipo: string;
  sistema: string;
  totale_preventivo: number | null;
  totale_finale: number | null;
  sconto_perc: number | null;
  note: string;
  ferma: boolean;
  motivo_ferma: string | null;
  created_at: string;
  updated_at: string;
  n_vani: number;
}

export function useCommesse() {
  const [commesse, setCommesse] = useState<Commessa[]>([]);
  const [fasi, setFasi] = useState<FasePipeline[]>(FASI_DEFAULT);
  const [loading, setLoading] = useState(true);
  const [filtroFase, setFiltroFase] = useState<string>('tutte');
  const [filtroRicerca, setFiltroRicerca] = useState('');
  const [ordinamento, setOrdinamento] = useState<'data' | 'importo' | 'cliente'>('data');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchFasi = useCallback(async () => {
    const { data } = await supabase
      .from('pipeline_fasi')
      .select('codice, nome, colore, ordine')
      .eq('attiva', true)
      .order('ordine');
    if (data && data.length > 0) setFasi(data);
  }, []);

  const fetchCommesse = useCallback(async () => {
    setLoading(true);
    const { data: cmData, error } = await supabase
      .from('commesse')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !cmData) { setLoading(false); return; }

    const { data: vaniData } = await supabase.from('vani').select('commessa_id');
    const vaniCount: Record<string, number> = {};
    if (vaniData) vaniData.forEach((v: any) => {
      if (v.commessa_id) vaniCount[v.commessa_id] = (vaniCount[v.commessa_id] || 0) + 1;
    });

    setCommesse(cmData.map((c: any) => ({
      id: c.id, code: c.code || '', cliente: c.cliente || '', cognome: c.cognome || '',
      indirizzo: c.indirizzo || '', telefono: c.telefono || '', email: c.email || '',
      fase: c.fase || 'sopralluogo', tipo: c.tipo || 'nuova', sistema: c.sistema || '',
      totale_preventivo: c.totale_preventivo, totale_finale: c.totale_finale,
      sconto_perc: c.sconto_perc, note: c.note || '',
      ferma: c.ferma || false, motivo_ferma: c.motivo_ferma,
      created_at: c.created_at || '', updated_at: c.updated_at || '',
      n_vani: vaniCount[c.id] || 0,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchFasi(); fetchCommesse(); }, [fetchFasi, fetchCommesse]);

  const commesseFiltrate = useMemo(() => {
    let result = [...commesse];
    if (filtroFase !== 'tutte') result = result.filter(c => c.fase === filtroFase);
    if (filtroRicerca.trim()) {
      const q = filtroRicerca.toLowerCase();
      result = result.filter(c =>
        c.cliente.toLowerCase().includes(q) || c.cognome.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) || c.indirizzo.toLowerCase().includes(q) ||
        c.telefono.includes(q) || c.email.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (ordinamento === 'data') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (ordinamento === 'importo') return (b.totale_finale || 0) - (a.totale_finale || 0);
      return (a.cognome || a.cliente).localeCompare(b.cognome || b.cliente);
    });
    return result;
  }, [commesse, filtroFase, filtroRicerca, ordinamento]);

  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    fasi.forEach(f => { counts[f.codice] = 0; });
    commesse.forEach(c => { counts[c.fase] = (counts[c.fase] || 0) + 1; });
    return counts;
  }, [commesse, fasi]);

  const cambiaFase = useCallback(async (id: string, nuovaFase: string) => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('commesse')
      .update({ fase: nuovaFase, fase_start: now, updated_at: now })
      .eq('id', id);
    if (!error) setCommesse(prev => prev.map(c => c.id === id ? { ...c, fase: nuovaFase } : c));
  }, []);

  const creaCommessa = useCallback(async (dati: {
    cliente: string; cognome: string; indirizzo?: string;
    telefono?: string; email?: string; note?: string;
  }) => {
    const code = 'CM-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const { data, error } = await supabase.from('commesse').insert({
      code, azienda_id: 'ccca51c1-656b-4e7c-a501-55753e20da29',
      cliente: dati.cliente, cognome: dati.cognome || '',
      indirizzo: dati.indirizzo || '', telefono: dati.telefono || '',
      email: dati.email || '', note: dati.note || '',
      fase: 'sopralluogo', tipo: 'nuova',
    }).select().single();
    if (!error && data) { await fetchCommesse(); return data.id; }
    return null;
  }, [fetchCommesse]);

  return {
    commesse: commesseFiltrate, totaleCommesse: commesse.length, fasi, loading,
    filtroFase, setFiltroFase, filtroRicerca, setFiltroRicerca,
    ordinamento, setOrdinamento, selectedId, setSelectedId,
    pipelineCounts, cambiaFase, creaCommessa, refresh: fetchCommesse,
  };
}
