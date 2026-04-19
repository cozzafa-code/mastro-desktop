"use client";
// @ts-nocheck
// MASTRO — DesktopENEA v2 — Supabase reale + filtro commessa
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const DS = { teal: '#28A0A0', tealDark: '#156060', ink: '#0D1F1F', light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF', red: '#DC4444', green: '#1A9E73', amber: '#F59E0B', blue: '#3B7FE0' };
const M = "'JetBrains Mono', monospace";

export default function DesktopENEA({ commessaId, onNavigate }: { commessaId?: string | null; onNavigate?: (p: string, cmId?: string) => void }) {
  const [commesse, setCommesse] = useState<any[]>([]);
  const [vani, setVani] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      if (commessaId) {
        const [cmR, vR] = await Promise.all([
          supabase.from('commesse').select('*').eq('id', commessaId).single(),
          supabase.from('vani').select('*').eq('commessa_id', commessaId),
        ]);
        setCommesse(cmR.data ? [cmR.data] : []);
        setVani(vR.data || []);
      } else {
        const { data } = await supabase.from('commesse').select('*').order('created_at', { ascending: false }).limit(20);
        setCommesse(data || []);
      }
      setLoading(false);
    })();
  }, [commessaId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: DS.teal }}>Caricamento ENEA...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DS.ink }}>Pratiche ENEA / Ecobonus</h2>
          {commessaId && commesse[0] && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, padding: '3px 10px', background: DS.teal + '15', color: DS.teal, borderRadius: 6, fontWeight: 700 }}>
                Filtro: {commesse[0].nome_cliente || commesse[0].code}
              </span>
              <button onClick={() => onNavigate?.('enea')} style={{ fontSize: 11, color: DS.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Rimuovi filtro</button>
            </div>
          )}
        </div>
      </div>

      {/* Info CAM */}
      <div style={{ padding: 16, background: DS.amber + '10', borderRadius: 10, border: `1.5px solid ${DS.amber}25`, marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: DS.amber, marginBottom: 6 }}>CAM 2026 - DM 24/11/2025</div>
        <div style={{ fontSize: 13, color: DS.ink, lineHeight: 1.5 }}>
          Criteri Ambientali Minimi in vigore dal 1 Feb 2026. Obbligo: % contenuto riciclato per materiale (PVC min 20%, AL min 40%), conformita UNI 11673-1, report auto-generato per pratica.
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Commesse', v: commesse.length, c: DS.teal },
          { l: 'Vani (filtro)', v: vani.length, c: DS.blue },
          { l: 'Pratiche inviate', v: 0, c: DS.green },
        ].map(k => (
          <div key={k.l} style={{ padding: '14px 16px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
            <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>{k.l}</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: M, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Commesse con dati ENEA */}
      <h3 style={{ fontSize: 16, fontWeight: 700, color: DS.ink, marginBottom: 12 }}>Commesse per pratica ENEA</h3>
      {commesse.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: DS.light, borderRadius: 10, border: `1.5px dashed ${DS.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink, marginBottom: 8 }}>Nessuna commessa</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {commesse.map(cm => {
            const hasCam = cm.cam_compliant;
            return (
              <div key={cm.id} style={{ padding: '14px 18px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink }}>{cm.nome_cliente || cm.cliente || '—'}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{cm.code} - {cm.indirizzo || '—'}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: hasCam ? DS.green + '15' : DS.amber + '15', color: hasCam ? DS.green : DS.amber }}>
                    {hasCam ? 'CAM OK' : 'CAM da verificare'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {[
                    { l: 'Zona climatica', v: cm.zona_climatica || '—' },
                    { l: 'Vani', v: cm.n_vani || '—' },
                    { l: 'Detrazione', v: cm.detrazione ? `${cm.detrazione}%` : '—' },
                    { l: 'Uw target', v: cm.uw_target ? `${cm.uw_target} W/m2K` : '—' },
                  ].map(d => (
                    <div key={d.l} style={{ padding: '6px 8px', background: DS.light, borderRadius: 6 }}>
                      <div style={{ fontSize: 10, color: '#999' }}>{d.l}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: M, color: DS.ink }}>{d.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
