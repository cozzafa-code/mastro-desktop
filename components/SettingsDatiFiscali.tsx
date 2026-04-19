'use client';
import { useState, useEffect } from 'react';

interface DatiFiscali {
  nome: string;
  piva: string;
  cf: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  iban: string;
  pec: string;
  codice_sdi: string;
  regime_fiscale: string;
  telefono: string;
  email: string;
}

const REGIMI = [
  { value: 'RF01', label: 'RF01 — Ordinario' },
  { value: 'RF19', label: 'RF19 — Forfettario' },
  { value: 'RF02', label: 'RF02 — Contribuenti minimi' },
];

export default function SettingsDatiFiscali() {
  const [dati, setDati] = useState<Partial<DatiFiscali>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/azienda/profilo', {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then(r => r.json()).then(d => setDati(d ?? {}));
  }, []);

  const salva = async () => {
    setSaving(true);
    try {
      await fetch('/api/azienda/profilo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(dati),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const upd = (k: keyof DatiFiscali) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDati(prev => ({ ...prev, [k]: e.target.value }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Ragione Sociale *" value={dati.nome ?? ''} onChange={upd('nome')} full />
        <Field label="P.IVA *" value={dati.piva ?? ''} onChange={upd('piva')} placeholder="IT12345678901" />
        <Field label="Codice Fiscale" value={dati.cf ?? ''} onChange={upd('cf')} />
        <Field label="Telefono" value={dati.telefono ?? ''} onChange={upd('telefono')} />
        <Field label="Email" value={dati.email ?? ''} onChange={upd('email')} />
        <Field label="Indirizzo" value={dati.indirizzo ?? ''} onChange={upd('indirizzo')} />
        <Field label="CAP" value={dati.cap ?? ''} onChange={upd('cap')} />
        <Field label="Comune" value={dati.comune ?? ''} onChange={upd('comune')} />
        <Field label="Provincia" value={dati.provincia ?? ''} onChange={upd('provincia')} placeholder="BR" />
      </div>

      <div style={{ borderTop:'1.5px solid #C8E4E4', paddingTop:18, marginTop:4 }}>
        <div style={{ fontSize:10, fontWeight:900, color:'#4A7070', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:24, height:24, borderRadius:7, background:'rgba(124,95,191,0.12)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 0 0 rgba(124,95,191,0.25)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C5FBF" strokeWidth="2.2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          </div>
          Fatturazione Elettronica SDI
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Codice SDI" value={dati.codice_sdi ?? ''} onChange={upd('codice_sdi')} placeholder="es. XXXXXXX" />
          <Field label="PEC" value={dati.pec ?? ''} onChange={upd('pec')} placeholder="azienda@pec.it" />
          <Field label="IBAN" value={dati.iban ?? ''} onChange={upd('iban')} placeholder="IT60X0542811101000000123456" />
          <div>
            <label style={labelStyle}>Regime Fiscale</label>
            <select value={dati.regime_fiscale ?? 'RF19'} onChange={upd('regime_fiscale')} style={inputStyle}>
              {REGIMI.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={salva} disabled={saving} style={{
        padding:'16px 0', background: saved ? '#1A9E73' : '#28A0A0',
        color:'#fff', border:'none', borderRadius:16,
        fontSize:16, fontWeight:900, cursor:'pointer',
        fontFamily:'Inter, sans-serif',
        boxShadow: saved ? '0 7px 0 0 #0A5A3A' : '0 8px 0 0 #156060',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      }}>
        {saving ? 'Salvataggio...' : saved ? '✓ Salvato' : 'Salva dati fiscali'}
      </button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, full }: { label: string; value: string; onChange: any; placeholder?: string; full?: boolean }) {
  return (
    <div style={full ? { gridColumn: '1 / -1' } : {}}>
      <label style={labelStyle}>{label}</label>
      <input value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
    </div>
  );
}

const labelStyle: React.CSSProperties = { display:'block', fontSize:10, fontWeight:900, color:'#4A7070', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.05em' };
const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1.5px solid #C8E4E4', borderRadius:12, fontSize:14, fontFamily:'Inter, sans-serif', background:'#F0F8F8', color:'#0D1F1F', outline:'none', boxSizing:'border-box', fontWeight:700, boxShadow:'inset 0 2px 4px rgba(40,160,160,0.06)' };

function getToken(): string {
  return typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') ?? '' : '';
}
