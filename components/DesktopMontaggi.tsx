"use client";
// @ts-nocheck
// MASTRO — DesktopMontaggi v3 — Supabase reale + filtro commessa
import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const DS = { teal: '#28A0A0', tealDark: '#156060', ink: '#0D1F1F', light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF', red: '#DC4444', green: '#1A9E73', amber: '#F59E0B', blue: '#3B7FE0' };
const M = "'JetBrains Mono', monospace";

const CHECKLIST_POSA = [
  "Verifica misure in cantiere", "Rimozione infisso esistente", "Pulizia controtelaio / muratura",
  "Montaggio controtelaio", "Posa infisso + livellamento", "Ancoraggio definitivo",
  "Sigillatura perimetrale", "Montaggio tapparella / cassonetto", "Montaggio zanzariera",
  "Regolazione ferramenta", "Test apertura/chiusura", "Pulizia vetri e profili",
  "Foto ante/post cantiere", "Firma cliente",
];

export default function DesktopMontaggi({ commessaId, onNavigate }: { commessaId?: string | null; onNavigate?: (p: string, cmId?: string) => void }) {
  const [commesse, setCommesse] = useState<any[]>([]);
  const [montaggi, setMontaggi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCm, setSelectedCm] = useState<any>(null);
  const [view, setView] = useState<'lista' | 'calendario'>('lista');

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from('commesse').select('*').order('created_at', { ascending: false });
      if (commessaId) q = q.eq('id', commessaId);
      const { data } = await q;
      setCommesse(data || []);
      if (commessaId && data?.length) setSelectedCm(data[0]);
      setLoading(false);
    })();
  }, [commessaId]);

  const faseColor = (f: string) => {
    if (!f) return '#999';
    const lower = f.toLowerCase();
    if (lower.includes('consegn') || lower.includes('complet')) return DS.green;
    if (lower.includes('posa') || lower.includes('montag')) return DS.blue;
    if (lower.includes('produz')) return DS.amber;
    return DS.teal;
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: DS.teal }}>Caricamento montaggi...</div>;

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DS.ink }}>Montaggi</h2>
          {commessaId && selectedCm && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 12, padding: '3px 10px', background: DS.teal + '15', color: DS.teal, borderRadius: 6, fontWeight: 700 }}>
                Filtro: {selectedCm.nome_cliente || selectedCm.code}
              </span>
              <button onClick={() => onNavigate?.('montaggi')} style={{ fontSize: 11, color: DS.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Rimuovi filtro</button>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, background: DS.light, borderRadius: 8, padding: 3 }}>
          {(['lista', 'calendario'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '7px 16px', fontSize: 12, fontWeight: view === v ? 700 : 500,
              background: view === v ? DS.teal : 'transparent', color: view === v ? DS.white : DS.ink,
              border: 'none', borderRadius: 6, cursor: 'pointer', textTransform: 'capitalize',
            }}>{v}</button>
          ))}
        </div>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Commesse', v: commesse.length, c: DS.teal },
          { l: 'In posa', v: commesse.filter(c => (c.fase || '').toLowerCase().includes('posa')).length, c: DS.blue },
          { l: 'Completate', v: commesse.filter(c => (c.fase || '').toLowerCase().includes('complet')).length, c: DS.green },
          { l: 'In attesa', v: commesse.filter(c => !(c.fase || '').toLowerCase().includes('posa') && !(c.fase || '').toLowerCase().includes('complet')).length, c: DS.amber },
        ].map(k => (
          <div key={k.l} style={{ padding: '14px 16px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
            <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>{k.l}</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: M, color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Lista commesse per montaggio */}
      {view === 'lista' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {commesse.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999', background: DS.light, borderRadius: 10 }}>Nessuna commessa trovata</div>
          ) : commesse.map(cm => (
            <div key={cm.id} onClick={() => setSelectedCm(selectedCm?.id === cm.id ? null : cm)}
              style={{
                padding: '14px 18px', background: DS.white, borderRadius: 10,
                border: `1.5px solid ${selectedCm?.id === cm.id ? DS.teal : DS.border}`,
                cursor: 'pointer', transition: 'all .12s',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink }}>{cm.nome_cliente || cm.cliente || '—'}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{cm.code} {cm.indirizzo && `- ${cm.indirizzo}`}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 6, background: faseColor(cm.fase) + '15', color: faseColor(cm.fase) }}>
                    {cm.fase || 'N/D'}
                  </span>
                  <span style={{ fontSize: 13, fontFamily: M, fontWeight: 700, color: DS.ink }}>{cm.n_vani || 0} vani</span>
                </div>
              </div>

              {/* Expanded: checklist posa */}
              {selectedCm?.id === cm.id && (
                <div style={{ marginTop: 12, padding: 14, background: DS.light, borderRadius: 8, border: `1px solid ${DS.border}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: DS.ink, marginBottom: 8 }}>Checklist Posa Qualificata</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    {CHECKLIST_POSA.map((item, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: DS.ink, cursor: 'pointer', padding: '4px 6px', borderRadius: 4, background: DS.white }}>
                        <input type="checkbox" style={{ accentColor: DS.teal }} />
                        {item}
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={(e) => { e.stopPropagation(); onNavigate?.('commesse'); }} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 700, background: DS.teal, color: DS.white, border: 'none', borderRadius: 8, cursor: 'pointer', boxShadow: `0 2px 0 ${DS.tealDark}` }}>
                      Vai alla commessa
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Calendario placeholder */}
      {view === 'calendario' && (
        <div style={{ padding: 40, textAlign: 'center', color: '#999', background: DS.light, borderRadius: 10, border: `1.5px dashed ${DS.border}` }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: DS.ink }}>Calendario Montaggi</div>
          <div style={{ fontSize: 13 }}>Vista calendario con drag&drop - prossima versione</div>
          <div style={{ fontSize: 12, marginTop: 8, color: DS.teal }}>Usa la vista Lista per gestire i montaggi</div>
        </div>
      )}
    </div>
  );
}
