"use client";
// @ts-nocheck
// MASTRO — DesktopTeam v2 — Supabase reale
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const DS = { teal: '#28A0A0', tealDark: '#156060', ink: '#0D1F1F', light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF', red: '#DC4444', green: '#1A9E73', amber: '#F59E0B', blue: '#3B7FE0' };
const M = "'JetBrains Mono', monospace";

export default function DesktopTeam({ commessaId, onNavigate }: { commessaId?: string | null; onNavigate?: (p: string, cmId?: string) => void }) {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Try dipendenti first, then profili_utente
      let { data } = await supabase.from('dipendenti').select('*').order('nome');
      if (!data || data.length === 0) {
        const r = await supabase.from('profili_utente').select('*');
        data = r.data;
      }
      setTeam(data || []);
      setLoading(false);
    })();
  }, []);

  const ruoloColor = (r: string) => {
    if (!r) return '#999';
    const l = r.toLowerCase();
    if (l.includes('titol') || l.includes('admin')) return DS.teal;
    if (l.includes('posato') || l.includes('montato')) return DS.blue;
    if (l.includes('tecnic') || l.includes('misurat')) return DS.amber;
    if (l.includes('commerc') || l.includes('agent')) return DS.green;
    return '#999';
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: DS.teal }}>Caricamento team...</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DS.ink }}>Squadre e Operatori</h2>
        <span style={{ fontSize: 14, fontFamily: M, fontWeight: 700, color: DS.teal }}>{team.length} membri</span>
      </div>

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ padding: '14px 16px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>Totale</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: M, color: DS.teal }}>{team.length}</div>
        </div>
        <div style={{ padding: '14px 16px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>Posatori</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: M, color: DS.blue }}>{team.filter(t => (t.ruolo || '').toLowerCase().includes('posato')).length}</div>
        </div>
        <div style={{ padding: '14px 16px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}` }}>
          <div style={{ fontSize: 11, color: '#999', fontWeight: 600 }}>Tecnici</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: M, color: DS.amber }}>{team.filter(t => (t.ruolo || '').toLowerCase().includes('tecnic')).length}</div>
        </div>
      </div>

      {/* Grid members */}
      {team.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: DS.light, borderRadius: 10, border: `1.5px dashed ${DS.border}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: DS.ink, marginBottom: 8 }}>Nessun membro del team</div>
          <div style={{ fontSize: 13, color: '#999' }}>Aggiungi operatori dalla sezione Impostazioni</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {team.map(t => {
            const nome = t.nome || t.full_name || t.email || '—';
            const initials = nome.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div key={t.id} style={{ padding: '16px 18px', background: DS.white, borderRadius: 10, border: `1.5px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: ruoloColor(t.ruolo) + '20', color: ruoloColor(t.ruolo), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: DS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nome}</div>
                  <div style={{ fontSize: 12, color: ruoloColor(t.ruolo), fontWeight: 600 }}>{t.ruolo || t.role || '—'}</div>
                  {t.telefono && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{t.telefono}</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
