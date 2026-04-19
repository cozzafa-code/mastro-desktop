"use client";
// @ts-nocheck
// MASTRO — DesktopFatture v2 — Supabase reale + filtro commessa
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const DS = { teal: '#28A0A0', tealDark: '#156060', ink: '#0D1F1F', light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF', red: '#DC4444', green: '#1A9E73', amber: '#F59E0B', blue: '#3B7FE0' };
const M = "'JetBrains Mono', monospace";

export default function DesktopFatture({ commessaId, onNavigate }: { commessaId?: string | null; onNavigate?: (p: string, cmId?: string) => void }) {
  const [fatture, setFatture] = useState<any[]>([]);
  const [commessa, setCommessa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'tutte' | 'emesse' | 'pagate' | 'scadute'>('tutte');

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from('fatture').select('*').order('data_emissione', { ascending: false });
      if (commessaId) q = q.eq('commessa_id', commessaId);
      const { data } = await q;
      setFatture(data || []);
      if (commessaId) {
        const r = await supabase.from('commesse').select('*').eq('id', commessaId).single();
        setCommessa(r.data);
      }
      setLoading(false);
    })();
  }, [commessaId]);

  const fmtEuro = (v: any) => v ? `EUR ${Number(v).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '—';
  const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('it-IT') : '—';

  const statoColor = (f: any) => {
    if (f.pagata || (f.stato || '').toLowerCase().includes('pagat')) return DS.green;
    if (f.data_scadenza && new Date(f.data_scadenza) < new Date()) return DS.red;
    return DS.amber;
  };
  const statoLabel = (f: any) => {
    if (f.pagata || (f.stato || '').toLowerCase().includes('pagat')) return 'Pagata';
    if (f.data_scadenza && new Date(f.data_scadenza) < new Date()) return 'Scaduta';
    return 'Emessa';
  };

  const filtered = fatture.filter(f => {
    if (filter === 'tutte') return true;
    if (filter === 'pagate') return f.pagata || (f.stato || '').toLowerCase().includes('pagat');
    if (filter === 'scadute') return !f.pagata && f.data_scadenza && new Date(f.data_scadenza) < new Date();
    return !f.pagata;
  });

  const totEmesso = fatture.reduce((s, f) => s + (Number(f.importo) || Number(f.totale) || 0), 0);
  const totPagato = fatture.filter(f => f.pagata).reduce((s, f) => s + (Number(f.importo) || Number(f.totale) || 0), 0);
  const totScaduto = fatture.filter(f => !f.pagata && f.data_scadenza && new Date(f.data_scadenza) < new Date()).reduce((s, f) => s + (Number(f.importo) || Number(f.totale) || 0), 0);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: DS.teal }}>Caricamento fatture...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DS.ink }}>Fatture SDI</h2>
          {commessaId && commessa && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, padding: '3px 10px', background: DS.teal + '15', color: DS.teal, borderRadius: 6, fontWeight: 700 }}>
                Filtro: {commessa.nome_cliente || commessa.code}
              </span>
              <button onClick={() => onNavigate?.('fatture')} style={{ fontSize: 11, color: DS.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Rimuovi filtro</button>
            </div>
          )}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Totale emesso', v: fmtEuro(totEmesso), c: DS.teal },
          { l: 'Incassato', v: fmtEuro(totPagato), c: DS.green },
          { l: 'Scaduto', v: fmtEuro(totScaduto), c: DS.red },
          { l: 'N. fatture', v: fatture.length, c: DS.blue },
        ].map(k => (
          <div key={k.l} style={{ padding: '14px 16px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
            <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>{k.l}</div>
            <div style={{ fontSize: typeof k.v === 'number' ? 26 : 16, fontWeight: 800, fontFamily: M, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Filtri */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: DS.light, borderRadius: 8, padding: 3, width: 'fit-content' }}>
        {(['tutte', 'emesse', 'pagate', 'scadute'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', fontSize: 12, fontWeight: filter === f ? 700 : 500,
            background: filter === f ? DS.teal : 'transparent', color: filter === f ? DS.white : DS.ink,
            border: 'none', borderRadius: 6, cursor: 'pointer', textTransform: 'capitalize',
          }}>{f}</button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: DS.light, borderRadius: 10, border: `1.5px dashed ${DS.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink, marginBottom: 8 }}>Nessuna fattura</div>
          <div style={{ fontSize: 13, color: '#999' }}>Le fatture saranno generate dalla Contabilita commessa</div>
        </div>
      ) : (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${DS.border}` }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 100px', gap: 0, padding: '10px 16px', background: DS.light, fontSize: 11, fontWeight: 700, color: '#999' }}>
            <span>Numero</span><span>Cliente</span><span>Emissione</span><span>Scadenza</span><span>Importo</span><span>Stato</span>
          </div>
          {filtered.map((f, i) => (
            <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 100px', gap: 0, padding: '12px 16px', background: i % 2 === 0 ? DS.white : DS.light, borderTop: `1px solid ${DS.border}30`, alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: M, color: DS.ink }}>{f.numero || '—'}</span>
              <span style={{ fontSize: 13, color: DS.ink }}>{f.cliente || f.nome_cliente || '—'}</span>
              <span style={{ fontSize: 12, fontFamily: M, color: '#999' }}>{fmtDate(f.data_emissione)}</span>
              <span style={{ fontSize: 12, fontFamily: M, color: statoColor(f) === DS.red ? DS.red : '#999' }}>{fmtDate(f.data_scadenza)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: M, color: DS.ink }}>{fmtEuro(f.importo || f.totale)}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: statoColor(f) + '15', color: statoColor(f), textAlign: 'center' }}>{statoLabel(f)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
