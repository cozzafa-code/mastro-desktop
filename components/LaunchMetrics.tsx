'use client';
import { useState, useEffect } from 'react';

interface Metriche {
  totale_aziende: number;
  trialing: number;
  active: number;
  mrr: number;
  trial_conversion_rate: number;
  nuove_7gg: number;
  churn_30gg: number;
}

const PIANI_PREZZO: Record<string, number> = {
  base: 9, start: 29, pro: 59, titan: 89,
};

export default function LaunchMetrics() {
  const [metriche, setMetriche] = useState<Metriche | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/metriche', {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(setMetriche)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Caricamento metriche...</div>;
  if (!metriche) return null;

  const TARGET_MRR = 4440;
  const TARGET_CLIENTI = 30;
  const pctMRR = Math.min(100, Math.round((metriche.mrr / TARGET_MRR) * 100));
  const pctClienti = Math.min(100, Math.round((metriche.active / TARGET_CLIENTI) * 100));

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* KPI principali */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'MRR', val: `€${metriche.mrr.toLocaleString('it-IT')}`, sub: `target €${TARGET_MRR.toLocaleString('it-IT')}`, colore: '#D08008' },
          { label: 'Clienti paganti', val: metriche.active, sub: `target ${TARGET_CLIENTI}`, colore: '#1A9E73' },
          { label: 'In trial', val: metriche.trialing, sub: 'conversione potenziale', colore: '#3B7FE0' },
          { label: 'Aziende totali', val: metriche.totale_aziende, sub: `+${metriche.nuove_7gg} ultimi 7gg`, colore: '#1A1A1C' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #E5E3DC' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.colore }}>{k.val}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress verso target lancio */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #E5E3DC' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1C', marginBottom: 16 }}>
          Progresso verso target lancio Q2 2026
        </div>
        <ProgressBar label="MRR" pct={pctMRR} colore="#D08008" valore={`€${metriche.mrr} / €${TARGET_MRR}`} />
        <ProgressBar label="Clienti paganti" pct={pctClienti} colore="#1A9E73" valore={`${metriche.active} / ${TARGET_CLIENTI}`} />
        {metriche.trial_conversion_rate > 0 && (
          <ProgressBar label="Conv. trial→paid" pct={metriche.trial_conversion_rate} colore="#3B7FE0" valore={`${metriche.trial_conversion_rate}%`} />
        )}
      </div>

      {/* Breakdown piani */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', border: '1px solid #E5E3DC' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Distribuzione piani</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(PIANI_PREZZO).map(([piano, prezzo]) => (
            <div key={piano} style={{ flex: 1, minWidth: 80, background: '#F2F1EC', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>{piano}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>€{prezzo}/mese</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ label, pct, colore, valore }: { label: string; pct: number; colore: string; valore: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: '#374151' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: colore }}>{valore}</span>
      </div>
      <div style={{ height: 8, background: '#F2F1EC', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: colore, borderRadius: 4, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

function getToken(): string {
  return typeof window !== 'undefined' ? localStorage.getItem('sb-access-token') ?? '' : '';
}
