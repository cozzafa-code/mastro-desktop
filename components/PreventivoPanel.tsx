// @ts-nocheck
// PreventivoPanel.tsx — MASTRO Tab Preventivo Commessa
// Voci raggruppate per categoria, totali, margine, genera PDF
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const DS = {
  teal: '#28A0A0', tealDark: '#156060', ink: '#0D1F1F',
  light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF',
  green: '#1A9E73', red: '#DC4444', amber: '#D08008',
  bg: '#E8F4F4', sub: '#6B8A8A',
};
const FONT = { ui: 'system-ui, -apple-system, sans-serif', mono: "'JetBrains Mono', monospace" };

const Ico = ({ d, s = 20, c = DS.ink }: { d: string; s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);

const CAT_LABELS: Record<string, { label: string; color: string }> = {
  serramento: { label: 'Serramenti', color: '#3B7FE0' },
  controtelaio: { label: 'Controtelai', color: '#28A0A0' },
  lamiere: { label: 'Lamiere', color: '#D08008' },
  cassonetto: { label: 'Cassonetti', color: '#7C3AED' },
  persiana: { label: 'Persiane', color: '#1A9E73' },
  tapparella: { label: 'Tapparelle', color: '#6B8A8A' },
  zanzariera: { label: 'Zanzariere', color: '#DC4444' },
  accessorio: { label: 'Accessori', color: '#0D1F1F' },
  manodopera: { label: 'Manodopera', color: '#D08008' },
  nodo_posa: { label: 'Nodo Posa', color: '#0D1F1F' },
  voce_libera: { label: 'Voci libere', color: '#6B8A8A' },
};

interface PreventivoPanelProps {
  commessaId: string;
}

export default function PreventivoPanel({ commessaId }: PreventivoPanelProps) {
  const [preventivo, setPreventivo] = useState<any>(null);
  const [voci, setVoci] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingVoce, setAddingVoce] = useState(false);
  const [newVoce, setNewVoce] = useState({ categoria: 'voce_libera', descrizione: '', quantita: 1, prezzo_unitario: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    const { data: prev } = await supabase.from('preventivi').select('*').eq('commessa_id', commessaId).order('versione', { ascending: false }).limit(1).single();
    if (prev) {
      setPreventivo(prev);
      const { data: v } = await supabase.from('voci_preventivo').select('*').eq('preventivo_id', prev.id).order('ordine');
      setVoci(v || []);
    }
    setLoading(false);
  }, [commessaId]);

  useEffect(() => { load(); }, [load]);

  // Group by categoria
  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const v of voci) {
      const cat = v.categoria || 'voce_libera';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    }
    return groups;
  }, [voci]);

  const totals = useMemo(() => {
    const netto = voci.reduce((s, v) => s + (v.totale_riga || 0), 0);
    const margine = voci.reduce((s, v) => s + (v.margine_riga || 0), 0);
    return { netto, iva: netto * 0.22, lordo: netto * 1.22, margine, marginePct: netto > 0 ? (margine / netto * 100) : 0 };
  }, [voci]);

  // Add voce libera
  const addVoceLibera = useCallback(async () => {
    if (!preventivo || !newVoce.descrizione.trim()) return;
    const tot = newVoce.quantita * newVoce.prezzo_unitario;
    await supabase.from('voci_preventivo').insert({
      preventivo_id: preventivo.id,
      categoria: newVoce.categoria,
      descrizione: newVoce.descrizione,
      quantita: newVoce.quantita,
      prezzo_unitario: newVoce.prezzo_unitario,
      totale_riga: tot,
      ordine: voci.length,
    });
    setNewVoce({ categoria: 'voce_libera', descrizione: '', quantita: 1, prezzo_unitario: 0 });
    setAddingVoce(false);
    load();
  }, [preventivo, newVoce, voci, load]);

  // Delete voce
  const deleteVoce = useCallback(async (id: string) => {
    await supabase.from('voci_preventivo').delete().eq('id', id);
    load();
  }, [load]);

  // Stato badge
  const statoBadge = (stato: string) => {
    const map: Record<string, { bg: string; color: string }> = {
      bozza: { bg: `${DS.amber}20`, color: DS.amber },
      inviato: { bg: '#DBEAFE', color: '#3B7FE0' },
      accettato: { bg: '#D1FAE5', color: DS.green },
      rifiutato: { bg: '#FEE2E2', color: DS.red },
      scaduto: { bg: '#F3F4F6', color: '#6B7280' },
    };
    const s = map[stato] || map.bozza;
    return <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>{stato.toUpperCase()}</span>;
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: DS.sub }}>Caricamento preventivo...</div>;

  if (!preventivo) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ color: DS.sub, marginBottom: 16 }}>Nessun preventivo per questa commessa</div>
      <div style={{ fontSize: 13, color: DS.sub }}>Apri il Wizard Vano e clicca "Genera preventivo" per crearne uno automaticamente, oppure le voci verranno generate dai componenti configurati.</div>
    </div>
  );

  return (
    <div style={{ fontFamily: FONT.ui }}>
      {/* Header preventivo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Preventivo #{preventivo.numero} v{preventivo.versione}</div>
          <div style={{ fontSize: 12, color: DS.sub }}>{preventivo.data_emissione}</div>
        </div>
        <div style={{ flex: 1 }} />
        {statoBadge(preventivo.stato)}
      </div>

      {/* Voci raggruppate */}
      {Object.entries(grouped).map(([cat, items]) => {
        const catMeta = CAT_LABELS[cat] || { label: cat, color: DS.sub };
        const catTot = items.reduce((s, v) => s + (v.totale_riga || 0), 0);
        return (
          <div key={cat} style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `2px solid ${catMeta.color}` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: catMeta.color }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: catMeta.color, flex: 1 }}>{catMeta.label}</span>
              <span style={{ fontFamily: FONT.mono, fontSize: 13, fontWeight: 600 }}>{catTot.toFixed(2)}</span>
            </div>
            {items.map(v => (
              <div key={v.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: `1px solid ${DS.border}`, fontSize: 13 }}>
                <span style={{ flex: 1, color: DS.ink }}>{v.descrizione}</span>
                <span style={{ width: 50, textAlign: 'right', fontFamily: FONT.mono, color: DS.sub }}>{v.quantita}x</span>
                <span style={{ width: 90, textAlign: 'right', fontFamily: FONT.mono }}>{(v.prezzo_unitario || 0).toFixed(2)}</span>
                <span style={{ width: 90, textAlign: 'right', fontFamily: FONT.mono, fontWeight: 600 }}>{(v.totale_riga || 0).toFixed(2)}</span>
                <div onClick={() => deleteVoce(v.id)} style={{ cursor: 'pointer', marginLeft: 8, opacity: 0.3 }}>
                  <Ico d="M18 6L6 18M6 6l12 12" s={14} c={DS.red} />
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Add voce */}
      {addingVoce ? (
        <div style={{ padding: 12, borderRadius: 8, border: `1px solid ${DS.border}`, background: DS.light, marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 80px 100px', gap: 8, marginBottom: 8 }}>
            <select value={newVoce.categoria} onChange={e => setNewVoce(p => ({ ...p, categoria: e.target.value }))}
              style={{ padding: '6px 8px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 12 }}>
              {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input value={newVoce.descrizione} onChange={e => setNewVoce(p => ({ ...p, descrizione: e.target.value }))} placeholder="Descrizione"
              style={{ padding: '6px 8px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 12 }} />
            <input type="number" value={newVoce.quantita} onChange={e => setNewVoce(p => ({ ...p, quantita: parseFloat(e.target.value) || 1 }))} placeholder="Qty"
              style={{ padding: '6px 8px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 12, fontFamily: FONT.mono }} />
            <input type="number" value={newVoce.prezzo_unitario || ''} onChange={e => setNewVoce(p => ({ ...p, prezzo_unitario: parseFloat(e.target.value) || 0 }))} placeholder="Prezzo"
              style={{ padding: '6px 8px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 12, fontFamily: FONT.mono }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addVoceLibera} style={{ padding: '6px 16px', background: DS.teal, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Aggiungi</button>
            <button onClick={() => setAddingVoce(false)} style={{ padding: '6px 16px', background: DS.white, color: DS.sub, border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Annulla</button>
          </div>
        </div>
      ) : (
        <div onClick={() => setAddingVoce(true)} style={{ padding: 10, borderRadius: 6, border: `2px dashed ${DS.teal}`, textAlign: 'center', color: DS.teal, fontWeight: 600, fontSize: 12, cursor: 'pointer', marginBottom: 16 }}>
          + Aggiungi voce
        </div>
      )}

      {/* Totals */}
      <div style={{ background: DS.ink, borderRadius: 10, padding: 16, color: DS.white }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          <span style={{ opacity: 0.7 }}>Totale netto</span>
          <span style={{ fontFamily: FONT.mono, fontWeight: 600 }}>{totals.netto.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
          <span style={{ opacity: 0.7 }}>IVA 22%</span>
          <span style={{ fontFamily: FONT.mono }}>{totals.iva.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 16 }}>
          <span style={{ fontWeight: 700 }}>Totale</span>
          <span style={{ fontFamily: FONT.mono, fontWeight: 700 }}>{totals.lordo.toFixed(2)}</span>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
          <span style={{ opacity: 0.5 }}>Margine stimato</span>
          <span style={{ fontFamily: FONT.mono, color: totals.margine >= 0 ? '#5DCAA5' : '#F09595', fontWeight: 600 }}>
            {totals.margine.toFixed(2)} ({totals.marginePct.toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
}
