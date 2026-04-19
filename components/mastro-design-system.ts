// ═══════════════════════════════════════════════════════════════
// MASTRO ENTERPRISE — Design System v2
// Ispirato a: Linear, Notion, Stripe Dashboard, SAP Fiori
// Principi: densità, gerarchia, precisione, zero decorazione
// ═══════════════════════════════════════════════════════════════

// ── PALETTE ────────────────────────────────────────────────────
// Light theme. Mai dark mode. Colori usati con parsimonia.
export const P = {
  // Neutrals (scala principale)
  bg:       '#F7F8FA',   // sfondo app
  surface:  '#FFFFFF',   // card, pannelli
  raised:   '#FAFBFC',   // hover, selected
  muted:    '#F0F1F3',   // separatori leggeri, input bg
  border:   '#E1E4E8',   // bordi card
  borderL:  '#ECEEF0',   // bordi interni leggeri
  
  // Text
  ink:      '#1B1F23',   // titoli, numeri importanti
  text:     '#24292E',   // testo body
  sub:      '#586069',   // testo secondario
  hint:     '#8B949E',   // placeholder, caption
  ghost:    '#C6CCD2',   // disabilitato
  
  // Brand
  teal:     '#0D9488',   // accent primario MASTRO
  tealL:    '#CCFBF1',   // teal light bg
  tealD:    '#115E59',   // teal dark (testo su light)
  
  // Semantic
  red:      '#DC2626',
  redL:     '#FEF2F2',
  amber:    '#D97706',
  amberL:   '#FFFBEB',
  green:    '#059669',
  greenL:   '#ECFDF5',
  blue:     '#2563EB',
  blueL:    '#EFF6FF',
  purple:   '#7C3AED',
  purpleL:  '#F5F3FF',
  orange:   '#EA580C',
  orangeL:  '#FFF7ED',
};

// ── TYPOGRAPHY ─────────────────────────────────────────────────
// DM Sans per UI, JetBrains Mono per numeri/codici
export const FONT = {
  sans: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace",
  // Google Fonts import (aggiungere nel layout.tsx):
  // <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
};

// ── SIZE SCALE ─────────────────────────────────────────────────
export const S = {
  // Font sizes
  xs: 10,   // caption, badge
  sm: 11,   // label secondario
  md: 12,   // body text
  lg: 13,   // body prominente
  xl: 14,   // titolo sezione
  h3: 16,   // titolo card
  h2: 20,   // titolo pannello
  h1: 24,   // titolo pagina
  hero: 32, // numero KPI
  
  // Spacing
  gap4: 4,
  gap8: 8,
  gap12: 12,
  gap16: 16,
  gap20: 20,
  gap24: 24,
  
  // Radius
  r4: 4,
  r6: 6,
  r8: 8,
  r10: 10,
  r12: 12,
};

// ── SHADOWS ────────────────────────────────────────────────────
export const SHADOW = {
  sm: '0 1px 2px rgba(27,31,35,0.04)',
  md: '0 1px 3px rgba(27,31,35,0.06), 0 1px 2px rgba(27,31,35,0.04)',
  lg: '0 4px 12px rgba(27,31,35,0.08)',
  xl: '0 8px 24px rgba(27,31,35,0.12)',
  card: '0 1px 3px rgba(27,31,35,0.04), 0 0 0 1px rgba(27,31,35,0.04)',
  cardHover: '0 4px 16px rgba(27,31,35,0.08), 0 0 0 1px rgba(13,148,136,0.15)',
};

// ── CARD STYLES ────────────────────────────────────────────────
export const CARD = {
  background: P.surface,
  borderRadius: S.r12,
  border: `1px solid ${P.border}`,
  boxShadow: SHADOW.card,
  overflow: 'hidden',
  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
};

export const CARD_HOVER = {
  boxShadow: SHADOW.cardHover,
  borderColor: P.teal + '30',
};

// ── BUTTON STYLES ──────────────────────────────────────────────
export const BTN = {
  primary: {
    padding: '8px 16px', fontSize: S.md, fontWeight: 600,
    color: '#fff', background: P.teal, border: 'none',
    borderRadius: S.r8, cursor: 'pointer', fontFamily: FONT.sans,
    boxShadow: `0 1px 2px rgba(13,148,136,0.2)`,
    transition: 'all 0.15s ease',
  },
  secondary: {
    padding: '8px 16px', fontSize: S.md, fontWeight: 600,
    color: P.text, background: P.surface, border: `1px solid ${P.border}`,
    borderRadius: S.r8, cursor: 'pointer', fontFamily: FONT.sans,
    boxShadow: SHADOW.sm,
    transition: 'all 0.15s ease',
  },
  danger: {
    padding: '8px 16px', fontSize: S.md, fontWeight: 600,
    color: '#fff', background: P.red, border: 'none',
    borderRadius: S.r8, cursor: 'pointer', fontFamily: FONT.sans,
    transition: 'all 0.15s ease',
  },
  ghost: {
    padding: '6px 12px', fontSize: S.sm, fontWeight: 600,
    color: P.sub, background: 'transparent', border: 'none',
    borderRadius: S.r6, cursor: 'pointer', fontFamily: FONT.sans,
    transition: 'all 0.15s ease',
  },
};

// ── BADGE STYLES ───────────────────────────────────────────────
export const BADGE = (color, bg) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '2px 8px', borderRadius: 20,
  fontSize: S.xs, fontWeight: 700, letterSpacing: 0.3,
  color: color, background: bg,
});

// ── KPI CARD STYLES ────────────────────────────────────────────
export const KPI_CARD = {
  ...CARD,
  padding: '18px 20px',
  cursor: 'pointer',
};

// ── ROW STYLES ─────────────────────────────────────────────────
export const ROW = {
  display: 'flex', alignItems: 'center',
  padding: '10px 20px',
  borderBottom: `1px solid ${P.borderL}`,
  cursor: 'pointer',
  transition: 'background 0.1s ease',
};

export const ROW_HOVER_BG = P.raised;

// ── SECTION HEADER ─────────────────────────────────────────────
export const SECTION_HEAD = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '14px 20px',
  borderBottom: `1px solid ${P.borderL}`,
};

// ── PROGRESS BAR ───────────────────────────────────────────────
export const progressBar = (value, max, color) => ({
  container: {
    height: 4, borderRadius: 2, background: P.muted,
    overflow: 'hidden', marginTop: 8,
  },
  fill: {
    height: '100%', borderRadius: 2, background: color,
    width: `${max > 0 ? Math.min(Math.round(value / max * 100), 100) : 0}%`,
    transition: 'width 0.6s ease',
  },
});

// ── AVATAR ─────────────────────────────────────────────────────
export const AVATAR = (size = 34, color = P.teal) => ({
  width: size, height: size, borderRadius: S.r8,
  background: color + '12',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: size * 0.4, fontWeight: 800, color: color,
  flexShrink: 0,
});

// ── DOT ────────────────────────────────────────────────────────
export const DOT = (color, size = 8) => ({
  width: size, height: size, borderRadius: '50%',
  background: color, flexShrink: 0, display: 'inline-block',
});

// ── HELPERS ────────────────────────────────────────────────────
export const fmtE = (n) => "€" + Math.round(n).toLocaleString("it-IT");
export const fmtK = (n) => n >= 10000 ? "€" + Math.round(n / 1000) + "k" : n >= 1000 ? "€" + (n / 1000).toFixed(1) + "k" : fmtE(n);
export const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;
export const daysTo = (d) => Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
export const TODAY = () => new Date().toISOString().split("T")[0];

// ── PIPELINE CONFIG ────────────────────────────────────────────
export const FASI = ["sopralluogo","preventivo","conferma","misure","ordini","produzione","posa","chiusura"];
export const FASE_LABEL = {
  sopralluogo: "Sopralluogo", preventivo: "Preventivo", conferma: "Conferma",
  misure: "Misure", ordini: "Ordini", produzione: "Produzione",
  posa: "Posa", chiusura: "Chiusura",
};
export const FASE_COLOR = {
  sopralluogo: P.blue, preventivo: P.amber, conferma: P.teal,
  misure: P.purple, ordini: P.red, produzione: P.orange,
  posa: P.green, chiusura: P.hint,
};
