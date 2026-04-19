"use client";
// @ts-nocheck
// MASTRO — DesktopOrdini v2 — Supabase reale + filtro commessa
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const DS = { teal: '#28A0A0', tealDark: '#156060', ink: '#0D1F1F', light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF', red: '#DC4444', green: '#1A9E73', amber: '#F59E0B', blue: '#3B7FE0' };
const M = "'JetBrains Mono', monospace";

export default function DesktopOrdini({ commessaId, onNavigate }: { commessaId?: string | null; onNavigate?: (p: string, cmId?: string) => void }) {
  const [ordini, setOrdini] = useState<any[]>([]);
  const [fornitori, setFornitori] = useState<any[]>([]);
  const [commessa, setCommessa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [ordR, fornR] = await Promise.all([
        (() => {
          let q = supabase.from('ordini_fornitore').select('*').order('created_at', { ascending: false });
          if (commessaId) q = q.eq('commessa_id', commessaId);
          return q;
        })(),
        supabase.from('fornitori').select('*').order('nome'),
      ]);
      setOrdini(ordR.data || []);
      setFornitori(fornR.data || []);
      if (commessaId) {
        const { data } = await supabase.from('commesse').select('*').eq('id', commessaId).single();
        setCommessa(data);
      }
      setLoading(false);
    })();
  }, [commessaId]);

  const statoColor = (s: string) => {
    if (!s) return '#999';
    const l = s.toLowerCase();
    if (l.includes('consegn') || l.includes('complet')) return DS.green;
    if (l.includes('inviat') || l.includes('conferm')) return DS.blue;
    if (l.includes('bozza')) return DS.amber;
    return '#999';
  };

  const fmtEuro = (v: any) => v ? `${Number(v).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '—';

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: DS.teal }}>Caricamento ordini...</div>;

  const totale = ordini.reduce((s, o) => s + (Number(o.totale) || 0), 0);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DS.ink }}>Ordini Fornitore</h2>
          {commessaId && commessa && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, padding: '3px 10px', background: DS.teal + '15', color: DS.teal, borderRadius: 6, fontWeight: 700 }}>
                Filtro: {commessa.nome_cliente || commessa.code}
              </span>
              <button onClick={() => onNavigate?.('ordini')} style={{ fontSize: 11, color: DS.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Rimuovi filtro</button>
            </div>
          )}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <KpiCard label="Totale ordini" value={ordini.length} color={DS.teal} />
        <KpiCard label="Fornitori" value={fornitori.length} color={DS.blue} />
        <KpiCard label="Valore totale" value={`EUR ${fmtEuro(totale)}`} color={DS.green} mono />
        <KpiCard label="In attesa" value={ordini.filter(o => !(o.stato || '').toLowerCase().includes('consegn')).length} color={DS.amber} />
      </div>

      {/* Ordini list */}
      {ordini.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: DS.light, borderRadius: 10, border: `1.5px dashed ${DS.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink, marginBottom: 8 }}>Nessun ordine trovato</div>
          <div style={{ fontSize: 13, color: '#999' }}>{commessaId ? 'Nessun ordine per questa commessa' : 'Crea ordini dal Configuratore commessa'}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ordini.map(o => (
            <div key={o.id} style={{ padding: '14px 18px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: DS.ink }}>{o.fornitore || 'Fornitore N/D'}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{o.numero || '—'} {o.data_ordine && `- ${new Date(o.data_ordine).toLocaleDateString('it-IT')}`}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontFamily: M, fontWeight: 700, color: DS.ink }}>EUR {fmtEuro(o.totale)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: statoColor(o.stato) + '15', color: statoColor(o.stato) }}>{o.stato || 'Bozza'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fornitori section */}
      {fornitori.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: DS.ink, marginBottom: 12 }}>Fornitori ({fornitori.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {fornitori.map(f => (
              <div key={f.id} style={{ padding: '12px 14px', background: DS.white, borderRadius: 8, border: `1px solid ${DS.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: DS.ink }}>{f.nome || '—'}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{f.tipo || ''} {f.citta && `- ${f.citta}`}</div>
                {f.telefono && <div style={{ fontSize: 11, color: DS.teal, marginTop: 2 }}>{f.telefono}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, color, mono }: { label: string; value: any; color: string; mono?: boolean }) {
  return (
    <div style={{ padding: '14px 16px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
      <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: mono ? 16 : 26, fontWeight: 800, fontFamily: mono ? "'JetBrains Mono', monospace" : undefined, color }}>{value}</div>
    </div>
  );
}
