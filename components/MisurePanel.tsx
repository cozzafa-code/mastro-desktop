// @ts-nocheck
// MisurePanel.tsx — MASTRO Misure Intelligenti per Vano
// Stati visivi, validazione coerenza, semaforo per campo
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

// ═══════════════════════════════════════════════════════════
// GRUPPI MISURE per tipo vano
// ═══════════════════════════════════════════════════════════
interface CampoMisura {
  key: string; label: string; unita: string; min?: number; max?: number; obbligatorio?: boolean;
}

const GRUPPI_MISURE: { nome: string; campi: CampoMisura[] }[] = [
  {
    nome: 'Vano murario',
    campi: [
      { key: 'luce_L', label: 'Luce larga', unita: 'mm', min: 300, max: 4000, obbligatorio: true },
      { key: 'luce_H', label: 'Luce alta', unita: 'mm', min: 300, max: 3500, obbligatorio: true },
      { key: 'luce_L2', label: 'Luce larga basso', unita: 'mm', min: 300, max: 4000 },
      { key: 'luce_H2', label: 'Luce alta dx', unita: 'mm', min: 300, max: 3500 },
      { key: 'profondita_muro', label: 'Profondita muro', unita: 'mm', min: 50, max: 800, obbligatorio: true },
      { key: 'spalletta_sx', label: 'Spalletta SX', unita: 'mm', min: 0, max: 300 },
      { key: 'spalletta_dx', label: 'Spalletta DX', unita: 'mm', min: 0, max: 300 },
      { key: 'architrave', label: 'Architrave', unita: 'mm', min: 0, max: 300 },
      { key: 'soglia', label: 'Soglia', unita: 'mm', min: 0, max: 200 },
    ]
  },
  {
    nome: 'Serramento',
    campi: [
      { key: 'ser_L', label: 'Larghezza serramento', unita: 'mm', min: 300, max: 4000, obbligatorio: true },
      { key: 'ser_H', label: 'Altezza serramento', unita: 'mm', min: 300, max: 3500, obbligatorio: true },
      { key: 'fuorisquadro_sx', label: 'Fuorisquadro SX', unita: 'mm', min: -20, max: 20 },
      { key: 'fuorisquadro_dx', label: 'Fuorisquadro DX', unita: 'mm', min: -20, max: 20 },
      { key: 'fuorisquadro_sopra', label: 'Fuorisquadro sopra', unita: 'mm', min: -20, max: 20 },
      { key: 'fuorisquadro_sotto', label: 'Fuorisquadro sotto', unita: 'mm', min: -20, max: 20 },
    ]
  },
  {
    nome: 'Controtelaio',
    campi: [
      { key: 'ct_L', label: 'Larghezza CT', unita: 'mm', min: 300, max: 4000 },
      { key: 'ct_H', label: 'Altezza CT', unita: 'mm', min: 300, max: 3500 },
      { key: 'ct_P', label: 'Profondita CT', unita: 'mm', min: 30, max: 200 },
      { key: 'ct_zanche', label: 'N. Zanche', unita: 'pz', min: 0, max: 20 },
    ]
  },
  {
    nome: 'Cassonetto / Tapparella',
    campi: [
      { key: 'cass_L', label: 'Larghezza cassonetto', unita: 'mm', min: 300, max: 4000 },
      { key: 'cass_H', label: 'Altezza cassonetto', unita: 'mm', min: 100, max: 500 },
      { key: 'cass_P', label: 'Profondita cassonetto', unita: 'mm', min: 100, max: 400 },
      { key: 'rullo_diam', label: 'Diametro rullo', unita: 'mm', min: 40, max: 200 },
    ]
  },
  {
    nome: 'Lamiere',
    campi: [
      { key: 'lam_sopra', label: 'Sviluppo sopra', unita: 'mm', min: 0, max: 500 },
      { key: 'lam_sotto', label: 'Sviluppo sotto', unita: 'mm', min: 0, max: 500 },
      { key: 'lam_sx', label: 'Sviluppo SX', unita: 'mm', min: 0, max: 500 },
      { key: 'lam_dx', label: 'Sviluppo DX', unita: 'mm', min: 0, max: 500 },
    ]
  },
];

type Stato = 'da_fare' | 'in_corso' | 'completato';

interface MisurePanelProps {
  vanoId: string;
  onComplete?: () => void;
}

export default function MisurePanel({ vanoId, onComplete }: MisurePanelProps) {
  const [valori, setValori] = useState<Record<string, number | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [espanso, setEspanso] = useState<Record<string, boolean>>({ 'Vano murario': true, 'Serramento': true });

  // Load existing misure
  useEffect(() => {
    (async () => {
      // From misure table (key-value)
      const { data: rows } = await supabase.from('misure').select('chiave, valore').eq('vano_id', vanoId);
      const vals: Record<string, number | undefined> = {};
      rows?.forEach(r => { vals[r.chiave] = r.valore; });
      // Also from vani.misure_json
      const { data: vano } = await supabase.from('vani').select('misure_json').eq('id', vanoId).single();
      if (vano?.misure_json) {
        Object.entries(vano.misure_json).forEach(([k, v]) => {
          if (vals[k] === undefined && typeof v === 'number') vals[k] = v;
        });
      }
      setValori(vals);
    })();
  }, [vanoId]);

  // Validate
  const validazioni = useMemo(() => {
    const errs: Record<string, { tipo: 'errore'|'warning'; msg: string }> = {};
    // Range checks
    for (const g of GRUPPI_MISURE) {
      for (const c of g.campi) {
        const v = valori[c.key];
        if (v === undefined || v === null) {
          if (c.obbligatorio) errs[c.key] = { tipo: 'errore', msg: 'Obbligatorio' };
          continue;
        }
        if (c.min !== undefined && v < c.min) errs[c.key] = { tipo: 'errore', msg: `Min ${c.min}` };
        if (c.max !== undefined && v > c.max) errs[c.key] = { tipo: 'errore', msg: `Max ${c.max}` };
      }
    }
    // Coerenza: luce > serramento
    const luceL = valori.luce_L, serL = valori.ser_L;
    if (luceL && serL && serL >= luceL) errs.ser_L = { tipo: 'warning', msg: 'Serramento >= luce vano' };
    const luceH = valori.luce_H, serH = valori.ser_H;
    if (luceH && serH && serH >= luceH) errs.ser_H = { tipo: 'warning', msg: 'Serramento >= luce vano' };
    // Fuorisquadro: differenza L-L2 e H-H2
    const l2 = valori.luce_L2;
    if (luceL && l2 && Math.abs(luceL - l2) > 15) errs.luce_L2 = { tipo: 'warning', msg: `Differenza ${Math.abs(luceL - l2)}mm - fuorisquadro` };
    return errs;
  }, [valori]);

  // Stato per gruppo
  const getStatoGruppo = useCallback((campi: CampoMisura[]): Stato => {
    const obbligatori = campi.filter(c => c.obbligatorio);
    const compilati = campi.filter(c => valori[c.key] !== undefined && valori[c.key] !== null);
    const obblCompilati = obbligatori.filter(c => valori[c.key] !== undefined && valori[c.key] !== null);
    if (compilati.length === 0) return 'da_fare';
    if (obblCompilati.length < obbligatori.length) return 'in_corso';
    const hasErrors = campi.some(c => validazioni[c.key]?.tipo === 'errore');
    if (hasErrors) return 'in_corso';
    return 'completato';
  }, [valori, validazioni]);

  // Stato globale
  const statoGlobale = useMemo((): Stato => {
    const stati = GRUPPI_MISURE.map(g => getStatoGruppo(g.campi));
    if (stati.every(s => s === 'completato')) return 'completato';
    if (stati.some(s => s !== 'da_fare')) return 'in_corso';
    return 'da_fare';
  }, [getStatoGruppo]);

  // Percentuale compilazione
  const percCompilazione = useMemo(() => {
    const obbligatori = GRUPPI_MISURE.flatMap(g => g.campi).filter(c => c.obbligatorio);
    const compilati = obbligatori.filter(c => valori[c.key] !== undefined);
    return obbligatori.length > 0 ? Math.round(compilati.length / obbligatori.length * 100) : 0;
  }, [valori]);

  // Save
  const save = useCallback(async () => {
    setSaving(true);
    try {
      // Delete all misure for this vano
      await supabase.from('misure').delete().eq('vano_id', vanoId);
      // Insert new
      const rows = Object.entries(valori)
        .filter(([_, v]) => v !== undefined && v !== null)
        .map(([key, val]) => ({ vano_id: vanoId, chiave: key, valore: val, unita: 'mm' }));
      if (rows.length > 0) await supabase.from('misure').insert(rows);
      // Also update misure_json on vani
      await supabase.from('vani').update({
        misure_json: valori,
        misure_complete: statoGlobale === 'completato' ? { completato: true, data: new Date().toISOString() } : null,
        updated_at: new Date().toISOString(),
      }).eq('id', vanoId);
      if (statoGlobale === 'completato') onComplete?.();
    } finally {
      setSaving(false);
    }
  }, [vanoId, valori, statoGlobale, onComplete]);

  const STATO_STYLE: Record<Stato, { bg: string; color: string; label: string }> = {
    da_fare: { bg: '#FEE2E2', color: DS.red, label: 'DA FARE' },
    in_corso: { bg: `${DS.amber}20`, color: DS.amber, label: 'IN CORSO' },
    completato: { bg: '#D1FAE5', color: DS.green, label: 'COMPLETATO' },
  };

  return (
    <div style={{ fontFamily: FONT.ui }}>
      {/* Status header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ ...statoBadgeStyle(STATO_STYLE[statoGlobale]), padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
          {STATO_STYLE[statoGlobale].label}
        </div>
        <div style={{ flex: 1, height: 6, background: DS.border, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${percCompilazione}%`, height: '100%', background: percCompilazione === 100 ? DS.green : DS.teal, borderRadius: 3, transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: 12, fontFamily: FONT.mono, color: DS.sub, fontWeight: 600 }}>{percCompilazione}%</span>
      </div>

      {/* Gruppi misure */}
      {GRUPPI_MISURE.map(gruppo => {
        const stato = getStatoGruppo(gruppo.campi);
        const isOpen = espanso[gruppo.nome] !== false;
        const stStyle = STATO_STYLE[stato];
        return (
          <div key={gruppo.nome} style={{ marginBottom: 12, borderRadius: 8, border: `1px solid ${DS.border}`, overflow: 'hidden' }}>
            <div onClick={() => setEspanso(p => ({ ...p, [gruppo.nome]: !isOpen }))}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: DS.light, cursor: 'pointer', borderBottom: isOpen ? `1px solid ${DS.border}` : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: stStyle.color }} />
              <span style={{ fontWeight: 700, fontSize: 13, flex: 1 }}>{gruppo.nome}</span>
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: stStyle.bg, color: stStyle.color }}>{stStyle.label}</span>
              <Ico d={isOpen ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} s={16} c={DS.sub} />
            </div>
            {isOpen && (
              <div style={{ padding: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {gruppo.campi.map(campo => {
                  const v = valori[campo.key];
                  const err = validazioni[campo.key];
                  const borderColor = err ? (err.tipo === 'errore' ? DS.red : DS.amber) : (v !== undefined ? DS.green : DS.border);
                  return (
                    <div key={campo.key}>
                      <div style={{ fontSize: 11, color: DS.sub, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {campo.label}
                        {campo.obbligatorio && <span style={{ color: DS.red, fontSize: 10 }}>*</span>}
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input type="number" value={v ?? ''} onChange={e => {
                          const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                          setValori(p => ({ ...p, [campo.key]: val }));
                        }}
                          style={{
                            width: '100%', padding: '7px 40px 7px 10px', border: `2px solid ${borderColor}`, borderRadius: 6,
                            fontSize: 14, fontFamily: FONT.mono, color: DS.ink, outline: 'none', boxSizing: 'border-box',
                            background: err?.tipo === 'errore' ? '#FEF2F2' : DS.white,
                          }} />
                        <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: DS.sub }}>{campo.unita}</span>
                        {/* Semaforo */}
                        <div style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', width: 6, height: 6, borderRadius: '50%', background: v !== undefined && !err ? DS.green : (err?.tipo === 'errore' ? DS.red : (err ? DS.amber : DS.border)) }} />
                      </div>
                      {err && <div style={{ fontSize: 10, color: err.tipo === 'errore' ? DS.red : DS.amber, marginTop: 2 }}>{err.msg}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Save button */}
      <button onClick={save} disabled={saving}
        style={{
          width: '100%', padding: '12px 20px', background: DS.teal, color: '#fff', border: 'none', borderRadius: 8,
          fontSize: 14, fontWeight: 700, fontFamily: FONT.ui, cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow: `0 4px 0 0 ${DS.tealDark}`, marginTop: 12, opacity: saving ? 0.6 : 1,
        }}>
        {saving ? 'Salvataggio...' : 'Salva misure'}
      </button>

      {/* Warnings summary */}
      {Object.keys(validazioni).length > 0 && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 6, background: `${DS.amber}10`, border: `1px solid ${DS.amber}30`, fontSize: 12, color: DS.amber }}>
          {Object.values(validazioni).filter(v => v.tipo === 'errore').length} errori, {Object.values(validazioni).filter(v => v.tipo === 'warning').length} avvisi
        </div>
      )}
    </div>
  );
}

function statoBadgeStyle(s: { bg: string; color: string }) {
  return { background: s.bg, color: s.color };
}
