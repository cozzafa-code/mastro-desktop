'use client';

import { FC, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommessaCardProps {
  id: string;
  numero: string;
  cliente: string;
  descrizione: string;
  stato: 'in_lavorazione' | 'completata' | 'in_attesa' | 'annullata';
  importo: number;
  cantiere: string;
  scadenza: string;
  darkMode?: boolean;
  onApri?: (id: string) => void;
  onChiudi?: (id: string) => void;
  onMenu?: (id: string) => void;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

const T = {
  teal:        '#14b8a6',
  tealDark:    '#0F766E',
  tealBg:      '#E1F5EE',
  tealBgDark:  '#134e4a',
  tealText:    '#0F766E',
  tealTextDark:'#5eead4',

  light: {
    page:      '#F8FAFC',
    card:      '#FFFFFF',
    titleText: '#0F172A',
    metaText:  '#64748B',
    valueText: '#334155',
    iconBg:    '#F1F5F9',
    iconColor: '#64748B',
    badgeGrayBg:   '#F1F5F9',
    badgeGrayText: '#475569',
    btnSecBorder:  '#E2E8F0',
    btnSecText:    '#475569',
    btnSecHover:   '#F1F5F9',
    divider:       '#F1F5F9',
  },
  dark: {
    page:      '#0F172A',
    card:      '#1E293B',
    titleText: '#F8FAFC',
    metaText:  '#64748B',
    valueText: '#CBD5E1',
    iconBg:    '#334155',
    iconColor: '#94A3B8',
    badgeGrayBg:   '#1e3a5f',
    badgeGrayText: '#94A3B8',
    btnSecBorder:  '#334155',
    btnSecText:    '#94A3B8',
    btnSecHover:   '#334155',
    divider:       '#334155',
  },
  radius: { card: 16, element: 8, badge: 6 },
  shadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
  shadowDark: '0 1px 4px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.2)',
  focusRing: '0 0 0 3px rgba(20,184,166,0.28)',
  transition: 'all 0.2s ease',
} as const;

// ─── Icone SVG Lucide ─────────────────────────────────────────────────────────

const IconX = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconPencil = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const IconDots = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATO_LABELS: Record<CommessaCardProps['stato'], string> = {
  in_lavorazione: 'In lavorazione',
  completata:     'Completata',
  in_attesa:      'In attesa',
  annullata:      'Annullata',
};

const formatEuro = (n: number) =>
  new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

// ─── Componente ───────────────────────────────────────────────────────────────

export const CommessaCard: FC<CommessaCardProps> = ({
  id, numero, cliente, descrizione, stato, importo,
  cantiere, scadenza, darkMode = false, onApri, onChiudi, onMenu,
}) => {
  const [hoverPrimary, setHoverPrimary] = useState(false);
  const [hoverSec, setHoverSec]         = useState(false);
  const [hoverX, setHoverX]             = useState(false);
  const [hoverDots, setHoverDots]       = useState(false);

  const c = darkMode ? T.dark : T.light;

  return (
    <div style={{
      background:    c.card,
      borderRadius:  T.radius.card,
      boxShadow:     darkMode ? T.shadowDark : T.shadow,
      padding:       20,
      fontFamily:    'Inter, sans-serif',
      width:         '100%',
      maxWidth:      360,
      boxSizing:     'border-box',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 12, color: c.metaText, margin: '0 0 4px', letterSpacing: '0.03em' }}>
            Commessa {numero}
          </p>
          <p style={{ fontSize: 17, fontWeight: 600, margin: 0, color: c.titleText, lineHeight: 1.3 }}>
            {cliente}
          </p>
          {descrizione && (
            <p style={{ fontSize: 13, color: c.metaText, margin: '2px 0 0' }}>{descrizione}</p>
          )}
        </div>

        <button
          onClick={() => onChiudi?.(id)}
          onMouseEnter={() => setHoverX(true)}
          onMouseLeave={() => setHoverX(false)}
          style={{
            width: 32, height: 32,
            borderRadius: T.radius.element,
            border: 'none',
            background: hoverX ? (darkMode ? '#475569' : '#E2E8F0') : c.iconBg,
            color:      c.iconColor,
            cursor:     'pointer',
            display:    'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: T.transition,
            outline:    'none',
          }}
          onFocus={e  => { e.currentTarget.style.boxShadow = T.focusRing; }}
          onBlur={e   => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <IconX />
        </button>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{
          background:    darkMode ? T.tealBgDark : T.tealBg,
          color:         darkMode ? T.tealTextDark : T.tealText,
          fontSize:      10, fontWeight: 600,
          padding:       '4px 10px',
          borderRadius:  T.radius.badge,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {STATO_LABELS[stato]}
        </span>
        <span style={{
          background:    c.badgeGrayBg,
          color:         c.badgeGrayText,
          fontSize:      10, fontWeight: 600,
          padding:       '4px 10px',
          borderRadius:  T.radius.badge,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {formatEuro(importo)}
        </span>
      </div>

      {/* Corpo */}
      <div style={{
        borderTop:   `1px solid ${c.divider}`,
        paddingTop:  16,
        display:     'grid',
        gridTemplateColumns: '1fr 1fr',
        gap:         10,
        marginBottom: 18,
      }}>
        <div>
          <p style={{ fontSize: 11, color: c.metaText, margin: '0 0 2px', letterSpacing: '0.03em' }}>Cantiere</p>
          <p style={{ fontSize: 13, color: c.valueText, margin: 0, fontWeight: 500 }}>{cantiere}</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: c.metaText, margin: '0 0 2px', letterSpacing: '0.03em' }}>Scadenza</p>
          <p style={{ fontSize: 13, color: c.valueText, margin: 0, fontWeight: 500 }}>{scadenza}</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onApri?.(id)}
          onMouseEnter={() => setHoverPrimary(true)}
          onMouseLeave={() => setHoverPrimary(false)}
          style={{
            flex:          1,
            padding:       '9px 12px',
            borderRadius:  T.radius.element,
            border:        'none',
            background:    hoverPrimary ? T.tealDark : T.teal,
            color:         '#fff',
            fontSize:      13, fontWeight: 500,
            cursor:        'pointer',
            display:       'flex', alignItems: 'center', justifyContent: 'center',
            gap:           8,
            transition:    T.transition,
            outline:       'none',
          }}
          onFocus={e  => { e.currentTarget.style.boxShadow = T.focusRing; }}
          onBlur={e   => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <IconPencil />
          Apri commessa
        </button>

        <button
          onClick={() => onMenu?.(id)}
          onMouseEnter={() => setHoverDots(true)}
          onMouseLeave={() => setHoverDots(false)}
          style={{
            width:         36, height: 36,
            flexShrink:    0,
            padding:       0,
            borderRadius:  T.radius.element,
            border:        `1px solid ${c.btnSecBorder}`,
            background:    hoverDots ? c.btnSecHover : 'transparent',
            color:         c.btnSecText,
            cursor:        'pointer',
            display:       'flex', alignItems: 'center', justifyContent: 'center',
            transition:    T.transition,
            outline:       'none',
          }}
          onFocus={e  => { e.currentTarget.style.boxShadow = T.focusRing; }}
          onBlur={e   => { e.currentTarget.style.boxShadow = 'none'; }}
        >
          <IconDots />
        </button>
      </div>

    </div>
  );
};

export default CommessaCard;
