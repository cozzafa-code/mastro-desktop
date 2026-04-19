"use client";
// @ts-nocheck
// MASTRO — DesktopMisure v2 — Supabase reale + filtro commessa
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const DS = { teal: '#28A0A0', tealDark: '#156060', ink: '#0D1F1F', light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF', red: '#DC4444', green: '#1A9E73', amber: '#F59E0B', blue: '#3B7FE0' };
const M = "'JetBrains Mono', monospace";

export default function DesktopMisure({ commessaId, onNavigate }: { commessaId?: string | null; onNavigate?: (p: string, cmId?: string) => void }) {
  const [vani, setVani] = useState<any[]>([]);
  const [commesse, setCommesse] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (commessaId) {
        const [vR, cmR] = await Promise.all([
          supabase.from('vani').select('*').eq('commessa_id', commessaId).order('created_at'),
          supabase.from('commesse').select('*').eq('id', commessaId).single(),
        ]);
        setVani(vR.data || []);
        setCommesse(cmR.data ? [cmR.data] : []);
      } else {
        // Ultime commesse con vani
        const { data: cms } = await supabase.from('commesse').select('*').order('created_at', { ascending: false }).limit(20);
        setCommesse(cms || []);
        if (cms?.length) {
          const ids = cms.map(c => c.id);
          const { data: vs } = await supabase.from('vani').select('*').in('commessa_id', ids).order('created_at');
          setVani(vs || []);
        }
      }
      setLoading(false);
    })();
  }, [commessaId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: DS.teal }}>Caricamento misure...</div>;

  const vaniConMisure = vani.filter(v => { const m = v.misure_complete || v.misure_json || {}; return (m.lCentro || m.lLuce) > 0; });
  const vaniSenza = vani.filter(v => { const m = v.misure_complete || v.misure_json || {}; return !(m.lCentro || m.lLuce) || (m.lCentro || m.lLuce) <= 0; });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DS.ink }}>Rilievi e Misure</h2>
          {commessaId && commesse[0] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, padding: '3px 10px', background: DS.teal + '15', color: DS.teal, borderRadius: 6, fontWeight: 700 }}>
                Filtro: {commesse[0].nome_cliente || commesse[0].code}
              </span>
              <button onClick={() => onNavigate?.('misure')} style={{ fontSize: 11, color: DS.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Rimuovi filtro</button>
            </div>
          )}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Vani totali', v: vani.length, c: DS.teal },
          { l: 'Con misure', v: vaniConMisure.length, c: DS.green },
          { l: 'Senza misure', v: vaniSenza.length, c: DS.red },
          { l: 'Commesse', v: commesse.length, c: DS.blue },
        ].map(k => (
          <div key={k.l} style={{ padding: '14px 16px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
            <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>{k.l}</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: M, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Tabella vani */}
      {vani.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: DS.light, borderRadius: 10, border: `1.5px dashed ${DS.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink, marginBottom: 8 }}>Nessun vano trovato</div>
          <div style={{ fontSize: 13, color: '#999' }}>Aggiungi vani dal Configuratore della commessa</div>
        </div>
      ) : (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${DS.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 80px 80px 80px 80px 80px', padding: '10px 16px', background: DS.light, fontSize: 11, fontWeight: 700, color: '#999' }}>
            <span>#</span><span>Nome</span><span>Tipo</span><span>L centro</span><span>H centro</span><span>L SX</span><span>L DX</span><span>m2</span>
          </div>
          {vani.map((v, i) => {
            const m = v.misure_complete || v.misure_json || {};
            const l = m.lCentro || m.larghezza || 0;
            const h = m.hCentro || m.altezza || 0;
            const mq = l > 0 && h > 0 ? ((l / 1000) * (h / 1000)).toFixed(2) : '—';
            const hasMis = l > 0;
            return (
              <div key={v.id} onClick={() => onNavigate?.('commesse')}
                style={{ display: 'grid', gridTemplateColumns: '60px 1fr 100px 80px 80px 80px 80px 80px', padding: '10px 16px', background: i % 2 === 0 ? DS.white : DS.light, borderTop: `1px solid ${DS.border}30`, cursor: 'pointer', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, fontFamily: M, color: hasMis ? DS.green : DS.red }}>{i + 1}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: DS.ink }}>{v.nome || `Vano ${i + 1}`}</span>
                <span style={{ fontSize: 12, fontFamily: M, color: '#999' }}>{v.tipo || '—'}</span>
                <span style={{ fontSize: 12, fontFamily: M, fontWeight: 700, color: hasMis ? DS.ink : '#ccc' }}>{l || '—'}</span>
                <span style={{ fontSize: 12, fontFamily: M, fontWeight: 700, color: hasMis ? DS.ink : '#ccc' }}>{h || '—'}</span>
                <span style={{ fontSize: 12, fontFamily: M, color: '#999' }}>{m.lSX || '—'}</span>
                <span style={{ fontSize: 12, fontFamily: M, color: '#999' }}>{m.lDX || '—'}</span>
                <span style={{ fontSize: 12, fontFamily: M, fontWeight: 700, color: DS.teal }}>{mq}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
