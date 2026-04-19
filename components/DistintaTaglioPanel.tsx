// ============================================================
// MASTRO — DistintaTaglioPanel
// components/DistintaTaglioPanel.tsx
// ============================================================
// Renders inside ConfiguratorePanel when a tipologia + profilo
// are selected. Shows complete cut list with export PDF.
// ============================================================
// Design System: fliwoX (teal #28A0A0, ink #0D1F1F, bg #E8F4F4)
// SVG icons only, zero emoji, JetBrains Mono for numbers
// ============================================================

'use client';

import React, { useState, useMemo } from 'react';
import {
  calcolaDistinta,
  formatDistintaTable,
  type Tipologia,
  type RegolaDistinta,
  type DistintaResult,
  type ElementoTipo,
} from '../hooks/useDistintaTaglio';

// ---- fliwoX Design Tokens ----
const DS = {
  teal: '#28A0A0',
  tealDark: '#156060',
  ink: '#0D1F1F',
  bg: '#E8F4F4',
  bgLight: '#EEF8F8',
  border: '#C8E4E4',
  white: '#FFFFFF',
  red: '#DC4444',
  green: '#1A9E73',
  amber: '#D08008',
  mono: "'JetBrains Mono', monospace",
  sans: "'Inter', sans-serif",
};

// ---- SVG Icons (inline, no external libs) ----
const IconPDF = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

const IconCalc = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="1" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <rect x="4" y="3" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.2"/>
    <circle cx="5.5" cy="9" r="0.8" fill="currentColor"/>
    <circle cx="8" cy="9" r="0.8" fill="currentColor"/>
    <circle cx="10.5" cy="9" r="0.8" fill="currentColor"/>
    <circle cx="5.5" cy="12" r="0.8" fill="currentColor"/>
    <circle cx="8" cy="12" r="0.8" fill="currentColor"/>
    <circle cx="10.5" cy="12" r="0.8" fill="currentColor"/>
  </svg>
);

const IconWarn = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 1L13 12H1L7 1z" stroke={DS.amber} strokeWidth="1.5" fill="none"/>
    <path d="M7 5.5v3" stroke={DS.amber} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="7" cy="10.5" r="0.7" fill={DS.amber}/>
  </svg>
);

// ---- Color by element type ----
const TIPO_COLORS: Record<ElementoTipo, string> = {
  TELAIO: '#28A0A0',
  ANTA: '#3B7FE0',
  VETRO: '#8B5CF6',
  SOGLIA: '#D08008',
  ZOCCOLO: '#92400E',
  TRAVERSO: '#0D9488',
  FERMAVETRO: '#6366F1',
  GUARNIZIONE_TELAIO: '#059669',
  GUARNIZIONE_ANTA: '#10B981',
  GUARNIZIONE_VETRO: '#34D399',
  FERRAMENTA: '#6B7280',
};

// ---- KNOWN RULES (match SQL seed) ----
const REGOLE_DEFAULT: Record<string, RegolaDistinta> = {
  'IDEAL4000': {
    serie: 'IDEAL4000', materiale: 'PVC', fornitore: 'Aluplast',
    delta_telaio_w: 0, delta_telaio_h: 0, delta_anta: 84,
    delta_vetro_w: 150, delta_vetro_h: 132, delta_soglia: 0,
    delta_traverso: 84, delta_fermavetro: 0,
    riporto_anta: 110, gioco_anta: 0, gioco_vetro: 0,
  },
  'ENERGETO_8000': {
    serie: 'ENERGETO_8000', materiale: 'PVC', fornitore: 'Aluplast',
    delta_telaio_w: 0, delta_telaio_h: 0, delta_anta: 84,
    delta_vetro_w: 150, delta_vetro_h: 132, delta_soglia: 0,
    delta_traverso: 84, delta_fermavetro: 0,
    riporto_anta: 110, gioco_anta: 0, gioco_vetro: 0,
  },
  'CX450': {
    serie: 'CX450', materiale: 'AL', fornitore: 'Twin Systems',
    delta_telaio_w: 0, delta_telaio_h: 0, delta_anta: 44,
    delta_vetro_w: 150, delta_vetro_h: 132, delta_soglia: 0,
    delta_traverso: 44, delta_fermavetro: 0,
    riporto_anta: 0, gioco_anta: 0, gioco_vetro: 0,
  },
  'CX600': {
    serie: 'CX600', materiale: 'AL', fornitore: 'Twin Systems',
    delta_telaio_w: 0, delta_telaio_h: 0, delta_anta: 44,
    delta_vetro_w: 184, delta_vetro_h: 188, delta_soglia: 0,
    delta_traverso: 44, delta_fermavetro: 0,
    riporto_anta: 110, gioco_anta: 0, gioco_vetro: 0,
  },
  'CX700': {
    serie: 'CX700', materiale: 'AL', fornitore: 'Twin Systems',
    delta_telaio_w: 0, delta_telaio_h: 0, delta_anta: 44,
    delta_vetro_w: 150, delta_vetro_h: 132, delta_soglia: 0,
    delta_traverso: 44, delta_fermavetro: 0,
    riporto_anta: 0, gioco_anta: 0, gioco_vetro: 0,
  },
};

const TIPOLOGIE: Tipologia[] = [
  '1A', '2A', '2A_RIB', 'VASISTAS', 'PORTA_1A',
  'SCORR_2A', 'FISSO', 'ANTA_ANTA', 'BILICO', '3A'
];

const TIPOLOGIA_LABELS: Record<Tipologia, string> = {
  '1A': '1 Anta',
  '2A': '2 Ante',
  '2A_RIB': '2 Ante Ribalta',
  'VASISTAS': 'Vasistas',
  'PORTA_1A': 'Portafinestra',
  'SCORR_2A': 'Scorrevole 2A',
  'FISSO': 'Fisso',
  'ANTA_ANTA': 'Anta + Anta',
  'BILICO': 'Bilico',
  '3A': '3 Ante',
};

// ---- COMPONENT ----

interface DistintaTaglioPanelProps {
  // If pre-selected from ConfiguratorePanel
  initialTipologia?: Tipologia;
  initialSerie?: string;
  initialW?: number;
  initialH?: number;
  // Regole from Supabase (optional, falls back to defaults)
  regoleDB?: Record<string, RegolaDistinta>;
}

export default function DistintaTaglioPanel({
  initialTipologia = '2A',
  initialSerie = 'IDEAL4000',
  initialW = 1200,
  initialH = 1400,
  regoleDB,
}: DistintaTaglioPanelProps) {
  const [tipologia, setTipologia] = useState<Tipologia>(initialTipologia);
  const [serie, setSerie] = useState(initialSerie);
  const [W, setW] = useState(initialW);
  const [H, setH] = useState(initialH);
  const [filterTipo, setFilterTipo] = useState<ElementoTipo | 'ALL'>('ALL');

  const regole = regoleDB || REGOLE_DEFAULT;
  const regola = regole[serie];

  const result: DistintaResult | null = useMemo(() => {
    if (!regola || W <= 0 || H <= 0) return null;
    return calcolaDistinta(tipologia, W, H, regola);
  }, [tipologia, serie, W, H, regola]);

  const filteredPezzi = useMemo(() => {
    if (!result) return [];
    if (filterTipo === 'ALL') return result.pezzi;
    return result.pezzi.filter(p => p.tipo === filterTipo);
  }, [result, filterTipo]);

  // ---- PDF EXPORT ----
  const handleExportPDF = () => {
    if (!result) return;
    // Build printable HTML
    const table = formatDistintaTable(result);
    const htmlContent = `
<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Distinta Taglio - ${result.tipologia} ${result.serie} ${result.larghezza}x${result.altezza}</title>
<style>
  body { font-family: 'Inter', Arial, sans-serif; padding: 40px; color: #0D1F1F; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #0D1F1F; color: #fff; padding: 6px 8px; text-align: left; font-weight: 600; }
  td { padding: 5px 8px; border-bottom: 1px solid #C8E4E4; }
  tr:nth-child(even) { background: #EEF8F8; }
  .mono { font-family: 'JetBrains Mono', monospace; }
  .summary { margin-top: 20px; padding: 12px; background: #E8F4F4; border-radius: 8px; font-size: 12px; }
  .summary strong { color: #28A0A0; }
  .warn { color: #D08008; font-size: 11px; margin-top: 8px; }
  @media print { body { padding: 20px; } }
</style>
</head><body>
<h1>DISTINTA TAGLIO</h1>
<div class="meta">
  Tipologia: <strong>${TIPOLOGIA_LABELS[result.tipologia]}</strong> |
  Serie: <strong>${result.serie}</strong> (${result.materiale}) |
  Dimensioni: <strong class="mono">${result.larghezza} x ${result.altezza} mm</strong> |
  Data: ${new Date().toLocaleDateString('it-IT')}
</div>
<table>
<thead><tr>${table[0].map(h => `<th>${h}</th>`).join('')}</tr></thead>
<tbody>${table.slice(1).map(r => `<tr>${r.map((c,i) => `<td${i===3||i===4?' class="mono"':''}>${c}</td>`).join('')}</tr>`).join('')}</tbody>
</table>
<div class="summary">
  <strong>Riepilogo:</strong>
  Pezzi totali: <strong>${result.riepilogo.totale_pezzi}</strong> |
  Profili: <strong>${result.riepilogo.totale_profili_ml} ml</strong> |
  Vetri: <strong>${result.riepilogo.totale_vetri}</strong> |
  Guarnizioni: <strong>${result.riepilogo.totale_guarnizioni_ml} ml</strong><br/>
  Telaio: <strong class="mono">${result.riepilogo.taglio_telaio_w} x ${result.riepilogo.taglio_telaio_h}</strong> |
  Anta: <strong class="mono">${result.riepilogo.taglio_anta_w} x ${result.riepilogo.taglio_anta_h}</strong> |
  Vetro: <strong class="mono">${result.riepilogo.luce_vetro_w} x ${result.riepilogo.luce_vetro_h}</strong>
</div>
${result.warnings.length > 0 ? `<div class="warn">${result.warnings.join('<br/>')}</div>` : ''}
<div style="margin-top:30px;font-size:10px;color:#999;">MASTRO Suite — Galassia MASTRO</div>
</body></html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        win.print();
        URL.revokeObjectURL(url);
      };
    }
  };

  // ---- STYLES ----
  const s = {
    container: {
      background: DS.white,
      borderRadius: '16px',
      border: `1px solid ${DS.border}`,
      padding: '20px',
      fontFamily: DS.sans,
    } as React.CSSProperties,
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '16px',
    } as React.CSSProperties,
    title: {
      fontSize: '15px',
      fontWeight: 700,
      color: DS.ink,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    } as React.CSSProperties,
    inputRow: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 100px 100px',
      gap: '10px',
      marginBottom: '16px',
    } as React.CSSProperties,
    select: {
      padding: '8px 10px',
      borderRadius: '8px',
      border: `1px solid ${DS.border}`,
      fontSize: '13px',
      fontFamily: DS.sans,
      color: DS.ink,
      background: DS.bgLight,
      outline: 'none',
    } as React.CSSProperties,
    input: {
      padding: '8px 10px',
      borderRadius: '8px',
      border: `1px solid ${DS.border}`,
      fontSize: '13px',
      fontFamily: DS.mono,
      color: DS.ink,
      background: DS.bgLight,
      textAlign: 'right' as const,
      outline: 'none',
    } as React.CSSProperties,
    label: {
      fontSize: '10px',
      fontWeight: 600,
      color: DS.tealDark,
      textTransform: 'uppercase' as const,
      marginBottom: '3px',
      letterSpacing: '0.5px',
    } as React.CSSProperties,
    btn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '7px 14px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: DS.sans,
      transition: 'all 0.15s',
    } as React.CSSProperties,
    btnPrimary: {
      background: DS.teal,
      color: '#fff',
      boxShadow: `0 2px 0 ${DS.tealDark}`,
    } as React.CSSProperties,
    btnSecondary: {
      background: DS.bgLight,
      color: DS.ink,
      border: `1px solid ${DS.border}`,
    } as React.CSSProperties,
    table: {
      width: '100%',
      borderCollapse: 'collapse' as const,
      fontSize: '12px',
    } as React.CSSProperties,
    th: {
      background: DS.ink,
      color: '#fff',
      padding: '7px 8px',
      textAlign: 'left' as const,
      fontWeight: 600,
      fontSize: '11px',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.3px',
    } as React.CSSProperties,
    td: {
      padding: '6px 8px',
      borderBottom: `1px solid ${DS.border}`,
      verticalAlign: 'middle' as const,
    } as React.CSSProperties,
    tdMono: {
      fontFamily: DS.mono,
      fontSize: '12px',
      fontWeight: 600,
    } as React.CSSProperties,
    badge: (color: string) => ({
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 700,
      color: '#fff',
      background: color,
      letterSpacing: '0.3px',
    }) as React.CSSProperties,
    summaryBox: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '10px',
      padding: '14px',
      background: DS.bg,
      borderRadius: '10px',
      marginTop: '14px',
    } as React.CSSProperties,
    summaryItem: {
      textAlign: 'center' as const,
    } as React.CSSProperties,
    summaryValue: {
      fontSize: '18px',
      fontWeight: 700,
      color: DS.teal,
      fontFamily: DS.mono,
    } as React.CSSProperties,
    summaryLabel: {
      fontSize: '10px',
      color: DS.tealDark,
      fontWeight: 600,
      textTransform: 'uppercase' as const,
    } as React.CSSProperties,
    filterRow: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap' as const,
      marginBottom: '10px',
    } as React.CSSProperties,
    filterBtn: (active: boolean) => ({
      padding: '4px 10px',
      borderRadius: '6px',
      border: active ? `2px solid ${DS.teal}` : `1px solid ${DS.border}`,
      background: active ? DS.bgLight : 'transparent',
      fontSize: '11px',
      fontWeight: active ? 700 : 500,
      color: active ? DS.teal : DS.ink,
      cursor: 'pointer',
      transition: 'all 0.15s',
    }) as React.CSSProperties,
    warning: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 12px',
      background: '#FEF3C7',
      borderRadius: '8px',
      fontSize: '12px',
      color: '#92400E',
      marginBottom: '10px',
    } as React.CSSProperties,
  };

  const filterTypes: (ElementoTipo | 'ALL')[] = [
    'ALL', 'TELAIO', 'ANTA', 'VETRO', 'FERMAVETRO',
    'SOGLIA', 'TRAVERSO', 'GUARNIZIONE_TELAIO', 'GUARNIZIONE_ANTA', 'FERRAMENTA'
  ];

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.title}>
          <IconCalc /> Distinta Taglio
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExportPDF}
            disabled={!result}
            style={{
              ...s.btn,
              ...s.btnPrimary,
              opacity: result ? 1 : 0.4,
            }}
          >
            <IconPDF /> Esporta PDF
          </button>
        </div>
      </div>

      {/* Input Row */}
      <div style={s.inputRow}>
        <div>
          <div style={s.label}>Tipologia</div>
          <select
            value={tipologia}
            onChange={(e) => setTipologia(e.target.value as Tipologia)}
            style={{ ...s.select, width: '100%' }}
          >
            {TIPOLOGIE.map(t => (
              <option key={t} value={t}>{TIPOLOGIA_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={s.label}>Serie / Sistema</div>
          <select
            value={serie}
            onChange={(e) => setSerie(e.target.value)}
            style={{ ...s.select, width: '100%' }}
          >
            {Object.keys(regole).map(s => (
              <option key={s} value={s}>{s} ({regole[s].materiale})</option>
            ))}
          </select>
        </div>
        <div>
          <div style={s.label}>Largh. (mm)</div>
          <input
            type="number"
            value={W}
            onChange={(e) => setW(parseInt(e.target.value) || 0)}
            style={s.input}
            min={100}
            max={5000}
            step={10}
          />
        </div>
        <div>
          <div style={s.label}>Alt. (mm)</div>
          <input
            type="number"
            value={H}
            onChange={(e) => setH(parseInt(e.target.value) || 0)}
            style={s.input}
            min={100}
            max={5000}
            step={10}
          />
        </div>
      </div>

      {/* Warnings */}
      {result?.warnings.map((w, i) => (
        <div key={i} style={s.warning}>
          <IconWarn /> {w}
        </div>
      ))}

      {/* Summary boxes */}
      {result && (
        <div style={s.summaryBox}>
          <div style={s.summaryItem}>
            <div style={s.summaryValue}>{result.riepilogo.totale_pezzi}</div>
            <div style={s.summaryLabel}>Pezzi</div>
          </div>
          <div style={s.summaryItem}>
            <div style={s.summaryValue}>{result.riepilogo.totale_profili_ml}</div>
            <div style={s.summaryLabel}>Profili (ml)</div>
          </div>
          <div style={s.summaryItem}>
            <div style={s.summaryValue}>{result.riepilogo.totale_vetri}</div>
            <div style={s.summaryLabel}>Vetri</div>
          </div>
          <div style={s.summaryItem}>
            <div style={s.summaryValue}>{result.riepilogo.totale_guarnizioni_ml}</div>
            <div style={s.summaryLabel}>Guarnizioni (ml)</div>
          </div>
        </div>
      )}

      {/* Detail boxes: telaio / anta / vetro dimensions */}
      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: '12px 0' }}>
          <div style={{ padding: '8px 12px', background: DS.bgLight, borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: DS.tealDark, textTransform: 'uppercase' }}>Telaio</div>
            <div style={{ fontFamily: DS.mono, fontSize: '14px', fontWeight: 700, color: DS.ink }}>
              {result.riepilogo.taglio_telaio_w} x {result.riepilogo.taglio_telaio_h}
            </div>
          </div>
          <div style={{ padding: '8px 12px', background: DS.bgLight, borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: DS.tealDark, textTransform: 'uppercase' }}>Anta</div>
            <div style={{ fontFamily: DS.mono, fontSize: '14px', fontWeight: 700, color: DS.ink }}>
              {result.riepilogo.taglio_anta_w > 0
                ? `${result.riepilogo.taglio_anta_w} x ${result.riepilogo.taglio_anta_h}`
                : '—'}
            </div>
          </div>
          <div style={{ padding: '8px 12px', background: DS.bgLight, borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: DS.tealDark, textTransform: 'uppercase' }}>Vetro</div>
            <div style={{ fontFamily: DS.mono, fontSize: '14px', fontWeight: 700, color: DS.ink }}>
              {result.riepilogo.luce_vetro_w} x {result.riepilogo.luce_vetro_h}
            </div>
          </div>
        </div>
      )}

      {/* Filter pills */}
      {result && (
        <div style={s.filterRow}>
          {filterTypes.map(ft => {
            const count = ft === 'ALL'
              ? result.pezzi.length
              : result.pezzi.filter(p => p.tipo === ft).length;
            if (ft !== 'ALL' && count === 0) return null;
            return (
              <button
                key={ft}
                onClick={() => setFilterTipo(ft)}
                style={s.filterBtn(filterTipo === ft)}
              >
                {ft === 'ALL' ? 'Tutti' : ft.replace(/_/g, ' ')} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Cut list table */}
      {result && filteredPezzi.length > 0 && (
        <div style={{ overflowX: 'auto', borderRadius: '10px', border: `1px solid ${DS.border}` }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={{ ...s.th, width: '30px', textAlign: 'center' }}>#</th>
                <th style={s.th}>Elemento</th>
                <th style={{ ...s.th, width: '90px' }}>Tipo</th>
                <th style={{ ...s.th, width: '100px', textAlign: 'right' }}>Lunghezza</th>
                <th style={{ ...s.th, width: '40px', textAlign: 'center' }}>Qt</th>
                <th style={{ ...s.th, width: '55px', textAlign: 'center' }}>Angolo</th>
                <th style={s.th}>Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredPezzi.map((p, i) => (
                <tr
                  key={p.elemento + i}
                  style={{ background: i % 2 === 0 ? '#fff' : DS.bgLight }}
                >
                  <td style={{ ...s.td, textAlign: 'center', color: '#999', fontSize: '11px' }}>
                    {i + 1}
                  </td>
                  <td style={{ ...s.td, fontWeight: 600 }}>{p.descrizione}</td>
                  <td style={s.td}>
                    <span style={s.badge(TIPO_COLORS[p.tipo] || '#666')}>
                      {p.tipo}
                    </span>
                  </td>
                  <td style={{ ...s.td, ...s.tdMono, textAlign: 'right' }}>
                    {p.lunghezza_mm > 0 ? `${p.lunghezza_mm} mm` : '—'}
                  </td>
                  <td style={{ ...s.td, ...s.tdMono, textAlign: 'center' }}>
                    {p.quantita}
                  </td>
                  <td style={{ ...s.td, textAlign: 'center', fontSize: '11px' }}>
                    {p.angolo_taglio > 0 ? `${p.angolo_taglio}°` : '—'}
                  </td>
                  <td style={{ ...s.td, fontSize: '11px', color: '#666' }}>
                    {p.note || ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* No regola warning */}
      {!regola && (
        <div style={s.warning}>
          <IconWarn /> Nessuna regola trovata per la serie "{serie}". Configura i delta in Impostazioni.
        </div>
      )}
    </div>
  );
}
