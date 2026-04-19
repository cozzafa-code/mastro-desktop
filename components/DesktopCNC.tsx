"use client";
// @ts-nocheck
// MASTRO — DesktopCNC v2 — Supabase reale + filtro commessa
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const DS = { teal: '#28A0A0', tealDark: '#156060', ink: '#0D1F1F', light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF', red: '#DC4444', green: '#1A9E73', amber: '#F59E0B', blue: '#3B7FE0' };
const M = "'JetBrains Mono', monospace";

export default function DesktopCNC({ commessaId, onNavigate }: { commessaId?: string | null; onNavigate?: (p: string, cmId?: string) => void }) {
  const [vani, setVani] = useState<any[]>([]);
  const [commessa, setCommessa] = useState<any>(null);
  const [lavorazioni, setLavorazioni] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (commessaId) {
        const [vR, cmR, lavR] = await Promise.all([
          supabase.from('vani').select('*').eq('commessa_id', commessaId).order('created_at'),
          supabase.from('commesse').select('*').eq('id', commessaId).single(),
          supabase.from('lavorazioni').select('*').eq('commessa_id', commessaId),
        ]);
        setVani(vR.data || []);
        setCommessa(cmR.data);
        setLavorazioni(lavR.data || []);
      } else {
        // Carica ultime lavorazioni globali
        const { data } = await supabase.from('lavorazioni').select('*').order('created_at', { ascending: false }).limit(50);
        setLavorazioni(data || []);
      }
      setLoading(false);
    })();
  }, [commessaId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: DS.teal }}>Caricamento CNC...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DS.ink }}>CNC / Macchine</h2>
          {commessaId && commessa && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, padding: '3px 10px', background: DS.teal + '15', color: DS.teal, borderRadius: 6, fontWeight: 700 }}>
                Filtro: {commessa.nome_cliente || commessa.code}
              </span>
              <button onClick={() => onNavigate?.('cnc')} style={{ fontSize: 11, color: DS.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Rimuovi filtro</button>
            </div>
          )}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: '14px 16px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>Vani</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: M, color: DS.teal }}>{vani.length}</div>
        </div>
        <div style={{ padding: '14px 16px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>Lavorazioni</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: M, color: DS.blue }}>{lavorazioni.length}</div>
        </div>
        <div style={{ padding: '14px 16px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>Completate</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: M, color: DS.green }}>{lavorazioni.filter(l => l.completata).length}</div>
        </div>
      </div>

      {/* Vani per distinta CNC (quando filtro commessa) */}
      {commessaId && vani.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: DS.ink, marginBottom: 12 }}>Vani per distinta CNC</h3>
          <div style={{ borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${DS.border}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 120px 100px', padding: '10px 16px', background: DS.light, fontSize: 11, fontWeight: 700, color: '#999' }}>
              <span>#</span><span>Nome</span><span>Tipo</span><span>Misure (mm)</span><span>m2</span>
            </div>
            {vani.map((v, i) => {
              const mis = v.misure_complete || v.misure_json || {};
              const l = mis.lCentro || mis.larghezza || 0;
              const h = mis.hCentro || mis.altezza || 0;
              const mq = l > 0 && h > 0 ? ((l / 1000) * (h / 1000)).toFixed(2) : '—';
              return (
                <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 120px 100px', padding: '10px 16px', background: i % 2 === 0 ? DS.white : DS.light, borderTop: `1px solid ${DS.border}30`, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, fontFamily: M, color: DS.teal }}>{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: DS.ink }}>{v.nome || `Vano ${i + 1}`}</span>
                  <span style={{ fontSize: 12, fontFamily: M, color: '#999' }}>{v.tipo || '—'}</span>
                  <span style={{ fontSize: 12, fontFamily: M, fontWeight: 700, color: DS.ink }}>{l > 0 ? `${l}x${h}` : '—'}</span>
                  <span style={{ fontSize: 12, fontFamily: M, color: DS.teal, fontWeight: 700 }}>{mq}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lavorazioni */}
      {lavorazioni.length > 0 ? (
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: DS.ink, marginBottom: 12 }}>Lavorazioni ({lavorazioni.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lavorazioni.map(l => (
              <div key={l.id} style={{ padding: '12px 16px', background: DS.white, borderRadius: 8, border: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DS.ink }}>{l.tipo || l.nome || 'Lavorazione'}</div>
                  <div style={{ fontSize: 11, color: '#999' }}>{l.macchina || ''} {l.centro_lavoro && `- ${l.centro_lavoro}`}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: l.completata ? DS.green + '15' : DS.amber + '15', color: l.completata ? DS.green : DS.amber }}>
                  {l.completata ? 'Completata' : 'In coda'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : !commessaId && (
        <div style={{ padding: 40, textAlign: 'center', background: DS.light, borderRadius: 10, border: `1.5px dashed ${DS.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink, marginBottom: 8 }}>Nessuna lavorazione CNC</div>
          <div style={{ fontSize: 13, color: '#999' }}>Le distinte CNC saranno generate dal Configuratore vano</div>
        </div>
      )}
    </div>
  );
}
