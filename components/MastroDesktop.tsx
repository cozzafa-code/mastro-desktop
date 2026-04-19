'use client';
import HomePanel from './HomePanel';
import DesktopDashboard from './DesktopDashboard';
import DesktopCommesse from './DesktopCommesse';
import DesktopClienti from './DesktopClienti';
import DesktopContabilita from './DesktopContabilita';
import CostruttorePanel from './CostruttorePanel';
import CommessePanel from './CommessePanel';
import AgendaPanel from './AgendaPanel';
import MessaggiPanel from './MessaggiPanel';
import MastroSignal from './MastroSignal';
import ClientiPanel from './ClientiPanel';
import ContabilitaPanel from './ContabilitaPanel';
import DesktopCNC from './DesktopCNC';
import DesktopProdFlow from './DesktopProdFlow';
import DesktopOrdini from './DesktopOrdini';
import OrdiniFornitori from './OrdiniFornitori';
import DesktopTeam from './DesktopTeam';
import DesktopMontaggi from './DesktopMontaggi';
import DesktopMisure from './DesktopMisure';
import DesktopFatture from './DesktopFatture';
import DesktopReport from './DesktopReport';
import DesktopListini from './DesktopListini';
import DesktopENEA from './DesktopENEA';
import DesktopLeads from './DesktopLeads';
import DesktopRete from './DesktopRete';
import DesktopAgente from './DesktopAgente';
import DesktopProduzione from './DesktopProduzione';
import DesktopInfissiOra from './DesktopInfissiOra';
import DesktopPortaleB2C from './DesktopPortaleB2C';
import WizardVanoComposto from './WizardVanoComposto';
import PreventivoPanel from './PreventivoPanel';
import MisurePanel from './MisurePanel';
import ArchivioProfiliPanel from './ArchivioProfiliPanel';
import NodiTecniciPanel from './NodiTecniciPanel';
import CostruttoreVetri from './CostruttoreVetri';
import CostruttoreLavorazioni from './CostruttoreLavorazioni';
import PosizionatoreLavorazioni from './PosizionatoreLavorazioni';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// ═══════════════════════════════════════════════════════════
// MASTRO DESKTOP — fliwoX Design System
// Sessione 5: Sidebar riorg + Tipologie SVG + Configuratore
// ═══════════════════════════════════════════════════════════

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Design System fliwoX (immutabile) ──
const DS = {
  teal: '#28A0A0',
  tealDark: '#156060',
  dark: '#0D1F1F',
  ink: '#0D1F1F',
  light: '#EEF8F8',
  border: '#C8E4E4',
  bg: '#E8F4F4',
  white: '#FFFFFF',
  red: '#DC4444',
  green: '#1A9E73',
  amber: '#F59E0B',
  blue: '#3B7FE0',
};

// ── SVG Icons (mastro-constants style) ──
const Icons = {
  dashboard: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="4" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="8" width="7" height="10" rx="1.5" />
    </svg>
  ),
  commesse: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 5h14M3 10h14M3 15h8" />
      <circle cx="15" cy="15" r="3" />
    </svg>
  ),
  messaggi: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4h12a2 2 0 012 2v6a2 2 0 01-2 2H8l-4 3v-3a2 2 0 01-2-2V6a2 2 0 012-2z" />
    </svg>
  ),
  agenda: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="14" height="13" rx="2" />
      <path d="M7 2v4M13 2v4M3 9h14" />
    </svg>
  ),
  distinte: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 3h12v14H4z" />
      <path d="M7 7h6M7 10h6M7 13h4" />
    </svg>
  ),
  cnc: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="6" width="16" height="10" rx="2" />
      <circle cx="7" cy="11" r="2" />
      <path d="M11 9h4M11 13h4" />
    </svg>
  ),
  team: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="7" cy="7" r="3" />
      <circle cx="14" cy="8" r="2.5" />
      <path d="M2 17c0-3 2.5-5 5-5s5 2 5 5M11 17c0-2.5 1.5-4 3-4s3 1.5 3 4" />
    </svg>
  ),
  ordini: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3h2l2 10h8l2-6H7" />
      <circle cx="8" cy="16" r="1.5" />
      <circle cx="14" cy="16" r="1.5" />
    </svg>
  ),
  clienti: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="7" r="4" />
      <path d="M3 18c0-3.5 3-6 7-6s7 2.5 7 6" />
    </svg>
  ),
  contabilita: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L4 6v8l8 4 8-4V6l-8-4z" />
      <path d="M4 6l8 4M12 10v8M12 10l8-4" />
    </svg>
  ),
  fatture: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M5 2h10a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V3a1 1 0 011-1z" />
      <path d="M8 6h4M8 9h4M8 12h2" />
      <path d="M12 14l1.5 1.5L16 13" stroke={DS.green} />
    </svg>
  ),
  analytics: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 17V10M7 17V7M11 17V12M15 17V5" />
    </svg>
  ),
  profili: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M3 7h14M7 3v14" />
    </svg>
  ),
  listini: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2v16M6 6l4-4 4 4M6 14l4 4 4-4" />
    </svg>
  ),
  archivio: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3h14v4H3zM4 7v10h12V7" />
      <path d="M8 11h4" />
    </svg>
  ),
  enea: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" />
    </svg>
  ),
  trova: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="9" r="6" />
      <path d="M14 14l4 4" />
    </svg>
  ),
  rete: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="4" r="2" />
      <circle cx="4" cy="14" r="2" />
      <circle cx="16" cy="14" r="2" />
      <path d="M10 6v4M7 12l-1.5 1M13 12l1.5 1" />
    </svg>
  ),
  ai: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 2l2 6h6l-5 4 2 6-5-4-5 4 2-6-5-4h6z" />
    </svg>
  ),
  misure: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 17L17 3M5 15l2-2M8 12l2-2M11 9l2-2M14 6l2-2" />
    </svg>
  ),
  infissiora: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M3 10h14M10 3v14" />
    </svg>
  ),
  portale: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="16" height="12" rx="2" />
      <path d="M6 18h8M10 15v3" />
    </svg>
  ),
  trasporti: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 11h12V5H2zM14 11h3l2 3v3h-5" />
      <circle cx="6" cy="16" r="2" />
      <circle cx="16" cy="16" r="2" />
    </svg>
  ),
  settings: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.2 4.2l2.1 2.1M13.7 13.7l2.1 2.1M4.2 15.8l2.1-2.1M13.7 6.3l2.1-2.1" />
    </svg>
  ),
  chevronDown: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6l4 4 4-4" />
    </svg>
  ),
  chevronRight: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 4l4 4-4 4" />
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 3v10M3 8h10" />
    </svg>
  ),
  config: (
    <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <path d="M14 11v6M11 14h6" />
    </svg>
  ),
};

// ── Sidebar structure (riorganizzata S5) ──
interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  subtitle?: string;
  badge?: number;
  disabled?: boolean;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: 'LAVORO QUOTIDIANO',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Icons.dashboard },
      { id: 'agenda', label: 'Agenda', icon: Icons.agenda },
      { id: 'commesse', label: 'Commesse', icon: Icons.commesse },
      { id: 'messaggi', label: 'Messaggi', icon: Icons.messaggi },
      { id: 'ordini', label: 'Ordini fornitori', icon: Icons.ordini },
      { id: 'produzione', label: 'Produzione', icon: Icons.dashboard },
    ],
  },
  {
    title: 'GESTIONE TEAM',
    items: [
      { id: 'team', label: 'Squadre e operatori', icon: Icons.team },
      { id: 'montaggi', label: 'Montaggi', icon: Icons.misure },
      { id: 'misure', label: 'Rilievi e misure', icon: Icons.misure },
    ],
  },
  {
    title: 'AMMINISTRAZIONE',
    items: [
      { id: 'clienti', label: 'Clienti', icon: Icons.clienti },
      { id: 'contabilita', label: 'Contabilita', icon: Icons.contabilita },
      { id: 'fatture', label: 'Fatture SDI', icon: Icons.fatture },
      { id: 'analytics', label: 'Analytics', icon: Icons.analytics },
    ],
  },
  {
    title: 'CATALOGHI TECNICI',
    items: [
      { id: 'archivio_profili', label: 'Archivio Profili', icon: Icons.profili, subtitle: 'DXF / DWG' },
      { id: 'nodi_tecnici', label: 'Nodi Tecnici', icon: Icons.archivio },
      { id: 'costruttore_vetri', label: 'Costruttore Vetri', icon: Icons.config, subtitle: 'EN 673 / 410' },
      { id: 'lavorazioni', label: 'Libreria Lavorazioni', icon: Icons.cnc, subtitle: 'CNC + Cantiere' },
      { id: 'posizionatore', label: 'Posizionatore', icon: Icons.misure },
      { id: 'configuratore', label: 'Configuratore', icon: Icons.config },
      { id: 'listini', label: 'Listini', icon: Icons.listini },
    ],
  },
  {
    title: 'CONFIGURAZIONE',
    items: [
      { id: 'settings', label: 'Profili e Tipologie', icon: Icons.profili },
      { id: 'configuratore', label: 'Configuratore', icon: Icons.config },
      { id: 'archivio', label: 'Archivi tecnici', icon: Icons.archivio, subtitle: 'Nodi - Vetri - Colori' },
    ],
  },
  {
    title: 'EXTRA',
    items: [
      { id: 'enea', label: 'ENEA / CAM', icon: Icons.enea },
      { id: 'trovaClienti', label: 'Trova Clienti', icon: Icons.trova },
      { id: 'rete', label: 'RETE Agenti', icon: Icons.rete },
      { id: 'aiAgente', label: 'AI Agente', icon: Icons.ai },
    ],
  },
  {
    title: 'ROADMAP',
    items: [
      { id: 'infissiora', label: 'InfissiOra', icon: Icons.infissiora, subtitle: 'Marketplace B2C' },
      { id: 'portale', label: 'Portale Cliente', icon: Icons.portale, subtitle: 'In sviluppo' },
      { id: 'trasporti', label: 'Trasporti', icon: Icons.trasporti, subtitle: 'F5 - 2027', disabled: true },
    ],
  },
];




// DashboardPanel RIMOSSA (v11) — Il router usa HomePanel per 'dashboard'

// ═══════════════════════════════════════════════════════════
// PLACEHOLDER PANELS
// ═══════════════════════════════════════════════════════════

function PlaceholderPanel({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: DS.tealDark, gap: 12 }}>
      <div style={{ opacity: 0.3, transform: 'scale(2)' }}>{icon}</div>
      <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
      <span style={{ fontSize: 12, opacity: 0.5 }}>In arrivo</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MASTRO DESKTOP — Main Layout
// ═══════════════════════════════════════════════════════════

// Inline wrapper per SettingsPanel (evita circular import)
function SettingsPanelInline({ onNavigate }: { onNavigate: (p: string) => void }) {
  // Lazy import
  const [SP, setSP] = useState<React.ComponentType<any> | null>(null);
  useEffect(() => {
    import('./SettingsPanel').then(mod => setSP(() => mod.default));
  }, []);
  if (!SP) return <div style={{ padding: 32, color: DS.tealDark }}>Caricamento impostazioni...</div>;
  return <SP onNavigate={onNavigate} />;
}

// ═══════════════════════════════════════════════════════════
// VANO DETAIL STANDALONE — bypassa MastroContext, carica da Supabase
// ═══════════════════════════════════════════════════════════
const M = "'JetBrains Mono', monospace";
const VANO_TABS = ['Dettagli', 'Misure', 'Wizard', 'Preventivo', 'Disegno', 'Riepilogo'];
const TIPI_VANO = ['F1A', 'F2A', 'F1A-R', 'F2A-R', 'PF1A', 'PF2A', 'SC-1A', 'SC-2A', 'PT-1A', 'PT-2A', 'FIX', 'VAS-1A', 'PVC-F1A'];

function VanoDetailStandalone({ vanoId, commessaId, onBack, onNavigate }: {
  vanoId: string | null;
  commessaId: string | null;
  onBack: () => void;
  onNavigate: (p: string) => void;
}) {
  const [vano, setVano] = useState<any>(null);
  const [commessa, setCommessa] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const fetchData = useCallback(async () => {
    if (!vanoId) return;
    setLoading(true);
    const [{ data: v }, { data: cm }] = await Promise.all([
      supabase.from('vani').select('*').eq('id', vanoId).single(),
      commessaId ? supabase.from('commesse').select('*').eq('id', commessaId).single() : { data: null },
    ]);
    setVano(v);
    setCommessa(cm);
    setLoading(false);
  }, [vanoId, commessaId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateVano = useCallback(async (field: string, value: any) => {
    if (!vano) return;
    const updated = { ...vano, [field]: value };
    setVano(updated);
    setSaving(true);
    await supabase.from('vani').update({ [field]: value }).eq('id', vano.id);
    setSaving(false);
    setToast('Salvato');
    setTimeout(() => setToast(''), 1500);
  }, [vano]);

  const updateMisura = useCallback(async (key: string, val: number) => {
    if (!vano) return;
    const newMisure = { ...(vano.misure_complete || {}), [key]: val };
    setVano({ ...vano, misure_complete: newMisure });
    setSaving(true);
    await supabase.from('vani').update({ misure_complete: newMisure }).eq('id', vano.id);
    setSaving(false);
    setToast('Salvato');
    setTimeout(() => setToast(''), 1500);
  }, [vano]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: DS.teal }}>Caricamento vano...</div>;
  if (!vano) return <div style={{ padding: 40, textAlign: 'center', color: DS.red }}>Vano non trovato</div>;

  const mis = vano.misure_complete || vano.misure_json || {};
  const lmm = mis.lCentro || mis.larghezza || 0;
  const hmm = mis.hCentro || mis.altezza || 0;
  const hasMis = lmm > 0 && hmm > 0;
  const mq = hasMis ? ((lmm / 1000) * (hmm / 1000)).toFixed(2) : '—';

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 70, right: 24, padding: '8px 20px', background: DS.green, color: DS.white, borderRadius: 8, fontSize: 13, fontWeight: 700, zIndex: 999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ padding: '6px 14px', background: DS.light, border: `1px solid ${DS.border}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: DS.teal, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 3L5 8l5 5"/></svg>
          Commessa
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: DS.ink }}>{vano.nome || 'Vano'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            {commessa?.nome_cliente || ''} {commessa ? `- ${commessa.indirizzo || ''}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontFamily: M, fontWeight: 700, color: DS.teal, background: DS.light, padding: '4px 10px', borderRadius: 6, border: `1px solid ${DS.border}` }}>{vano.tipo || '—'}</span>
          {saving && <span style={{ fontSize: 11, color: DS.amber }}>Salvando...</span>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: DS.light, padding: 3, borderRadius: 10 }}>
        {VANO_TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            flex: 1, padding: '10px 0', fontSize: 13, fontWeight: tab === i ? 700 : 500,
            color: tab === i ? DS.white : DS.ink, background: tab === i ? DS.teal : 'transparent',
            border: 'none', borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
            boxShadow: tab === i ? `0 2px 0 ${DS.tealDark}` : 'none',
          }}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <VanoTabDettagli vano={vano} updateVano={updateVano} />}
      {tab === 1 && <MisurePanel vanoId={vano.id} onComplete={() => { setToast('Misure complete!'); fetchData(); }} />}
      {tab === 2 && <WizardVanoComposto vanoId={vano.id} commessaId={commessaId || ''} onSaved={() => { setToast('Vano salvato!'); fetchData(); }} />}
      {tab === 3 && <PreventivoPanel commessaId={commessaId || ''} />}
      {tab === 4 && <VanoTabDisegno vano={vano} onNavigate={onNavigate} />}
      {tab === 5 && <VanoTabRiepilogo vano={vano} commessa={commessa} lmm={lmm} hmm={hmm} mq={mq} />}
    </div>
  );
}

// ── Tab DETTAGLI ──
function VanoTabDettagli({ vano, updateVano }: { vano: any; updateVano: (f: string, v: any) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <VField label="Nome vano" value={vano.nome || ''} onChange={v => updateVano('nome', v)} />
      <div>
        <label style={{ fontSize: 12, fontWeight: 700, color: DS.ink, marginBottom: 4, display: 'block' }}>Tipologia</label>
        <select value={vano.tipo || ''} onChange={e => updateVano('tipo', e.target.value)}
          style={{ width: '100%', padding: '9px 10px', border: `1.5px solid ${DS.border}`, borderRadius: 8, fontSize: 13, background: DS.white, outline: 'none', color: DS.ink }}>
          <option value="">— Seleziona —</option>
          {TIPI_VANO.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <VField label="Stanza" value={vano.stanza || ''} onChange={v => updateVano('stanza', v)} />
      <VField label="Piano" value={vano.piano || ''} onChange={v => updateVano('piano', v)} />
      <VField label="Sistema" value={vano.sistema || ''} onChange={v => updateVano('sistema', v)} span />
      <div style={{ gridColumn: '1 / -1', padding: 16, background: DS.light, borderRadius: 10, border: `1px solid ${DS.border}` }}>
        <label style={{ fontSize: 12, fontWeight: 700, color: DS.ink, marginBottom: 6, display: 'block' }}>Note</label>
        <textarea value={vano.note || ''} onChange={e => updateVano('note', e.target.value)}
          rows={3} style={{ width: '100%', padding: 10, border: `1px solid ${DS.border}`, borderRadius: 8, fontSize: 13, resize: 'vertical', outline: 'none', background: DS.white }} />
      </div>
    </div>
  );
}

// ── Tab MISURE ──
const MISURE_FIELDS = [
  { key: 'lCentro', label: 'Larghezza Centro', unit: 'mm' },
  { key: 'hCentro', label: 'Altezza Centro', unit: 'mm' },
  { key: 'lSX', label: 'Larghezza SX', unit: 'mm' },
  { key: 'lDX', label: 'Larghezza DX', unit: 'mm' },
  { key: 'hSX', label: 'Altezza SX', unit: 'mm' },
  { key: 'hDX', label: 'Altezza DX', unit: 'mm' },
  { key: 'profMuro', label: 'Prof. muro', unit: 'mm' },
  { key: 'spallettaSX', label: 'Spalletta SX', unit: 'mm' },
  { key: 'spallettaDX', label: 'Spalletta DX', unit: 'mm' },
  { key: 'architrave', label: 'Architrave', unit: 'mm' },
  { key: 'soglia', label: 'Soglia', unit: 'mm' },
  { key: 'distDaPavimento', label: 'Dist. da pavimento', unit: 'mm' },
];

function VanoTabMisure({ vano, mis, updateMisura, lmm, hmm, mq }: {
  vano: any; mis: any; updateMisura: (k: string, v: number) => void; lmm: number; hmm: number; mq: string;
}) {
  return (
    <div>
      {/* Summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { l: 'Larghezza', v: lmm ? `${lmm} mm` : '—', c: DS.teal },
          { l: 'Altezza', v: hmm ? `${hmm} mm` : '—', c: DS.blue },
          { l: 'Superficie', v: mq !== '—' ? `${mq} m\u00B2` : '—', c: DS.green },
        ].map(s => (
          <div key={s.l} style={{ flex: 1, padding: '12px 14px', background: s.c + '08', borderRadius: 10, border: `1.5px solid ${s.c}20` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#999' }}>{s.l}</div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: M, color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
      {/* Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {MISURE_FIELDS.map(f => (
          <div key={f.key}>
            <label style={{ fontSize: 11, fontWeight: 700, color: DS.ink, display: 'block', marginBottom: 3 }}>{f.label}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              <input type="number" value={mis[f.key] || ''} onChange={e => updateMisura(f.key, parseInt(e.target.value) || 0)}
                style={{ flex: 1, padding: '8px 10px', border: `1.5px solid ${DS.border}`, borderRadius: '8px 0 0 8px', fontSize: 14, fontFamily: M, outline: 'none', background: DS.white }} />
              <span style={{ padding: '8px 10px', background: DS.light, border: `1.5px solid ${DS.border}`, borderLeft: 'none', borderRadius: '0 8px 8px 0', fontSize: 11, color: '#999', fontWeight: 700 }}>{f.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab ACCESSORI (placeholder) ──
function VanoTabAccessori({ vano }: { vano: any }) {
  const acc = vano.accessori || {};
  const items = Object.keys(acc);
  return (
    <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
      {items.length === 0 ? (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Nessun accessorio configurato</div>
          <div style={{ fontSize: 12 }}>Gli accessori saranno disponibili dal configuratore completo</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'left' }}>
          {items.map(k => (
            <div key={k} style={{ padding: '10px 14px', background: acc[k]?.attivo ? DS.teal + '08' : DS.light, borderRadius: 8, border: `1px solid ${acc[k]?.attivo ? DS.teal + '30' : DS.border}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: DS.ink }}>{k}</div>
              <div style={{ fontSize: 11, color: acc[k]?.attivo ? DS.green : '#999' }}>{acc[k]?.attivo ? 'Attivo' : 'Non attivo'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Tab DISEGNO (link to configuratore) ──
function VanoTabDisegno({ vano, onNavigate }: { vano: any; onNavigate: (p: string) => void }) {
  return (
    <div style={{ padding: 30, textAlign: 'center' }}>
      <div style={{ width: 80, height: 80, margin: '0 auto 16px', background: DS.teal + '10', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={DS.teal} strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" />
        </svg>
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: DS.ink, marginBottom: 8 }}>Disegno tecnico</div>
      <div style={{ fontSize: 13, color: '#999', marginBottom: 20 }}>Apri il configuratore per disegnare il vano con il CAD integrato</div>
      <button onClick={() => onNavigate('configuratore')} style={{
        padding: '12px 28px', fontSize: 14, fontWeight: 700, background: DS.teal, color: DS.white,
        border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: `0 3px 0 ${DS.tealDark}`,
      }}>
        Apri Configuratore
      </button>
    </div>
  );
}

// ── Tab RIEPILOGO ──
function VanoTabRiepilogo({ vano, commessa, lmm, hmm, mq }: { vano: any; commessa: any; lmm: number; hmm: number; mq: string }) {
  const rows = [
    ['Nome', vano.nome || '—'],
    ['Tipologia', vano.tipo || '—'],
    ['Stanza', vano.stanza || '—'],
    ['Piano', vano.piano || '—'],
    ['Sistema', vano.sistema || '—'],
    ['Larghezza', lmm ? `${lmm} mm` : '—'],
    ['Altezza', hmm ? `${hmm} mm` : '—'],
    ['Superficie', mq !== '—' ? `${mq} m\u00B2` : '—'],
    ['Commessa', commessa?.nome_cliente || '—'],
  ];
  return (
    <div style={{ borderRadius: 10, overflow: 'hidden', border: `1.5px solid ${DS.border}` }}>
      {rows.map(([label, val], i) => (
        <div key={label} style={{ display: 'flex', padding: '10px 16px', background: i % 2 === 0 ? DS.white : DS.light, borderBottom: i < rows.length - 1 ? `1px solid ${DS.border}40` : 'none' }}>
          <div style={{ width: 140, fontSize: 12, fontWeight: 700, color: '#999' }}>{label}</div>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: DS.ink, fontFamily: M }}>{val}</div>
        </div>
      ))}
    </div>
  );
}

// ── Helper: VField ──
function VField({ label, value, onChange, span }: { label: string; value: string; onChange: (v: string) => void; span?: boolean }) {
  return (
    <div style={{ gridColumn: span ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: DS.ink, marginBottom: 4, display: 'block' }}>{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '9px 10px', border: `1.5px solid ${DS.border}`, borderRadius: 8, fontSize: 13, outline: 'none', background: DS.white, color: DS.ink }} />
    </div>
  );
}

export default function MastroDesktop() {
  const [activePanel, setActivePanel] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // ── Vano Detail bridge ──
  const [selectedVanoId, setSelectedVanoId] = useState<string | null>(null);
  const [vanoCommessaId, setVanoCommessaId] = useState<string | null>(null);
  // ── Cross-navigation context ──
  const [navCommessaId, setNavCommessaId] = useState<string | null>(null);
  const [signalEntity, setSignalEntity] = useState<string | null>(null);
  const [signalContatto, setSignalContatto] = useState<string | null>(null);

  // Navigate to panel, optionally with commessa context
  const navigateTo = useCallback((panel: string, commessaId?: string, opts?: {entity?: string, contatto?: string}) => {
    if (commessaId) setNavCommessaId(commessaId);
    if (opts?.entity) setSignalEntity(opts.entity);
    if (opts?.contatto) setSignalContatto(opts.contatto);
    if (panel === 'messaggi' && !opts?.entity) { setSignalEntity(null); setSignalContatto(null); }
    setActivePanel(panel);
  }, []);

  // When clicking sidebar, clear commessa context
  const sidebarNavigate = useCallback((panel: string) => {
    setNavCommessaId(null);
    setActivePanel(panel);
  }, []);

  const handleOpenVano = useCallback((cmId: string, vanoId: string) => {
    setVanoCommessaId(cmId);
    setSelectedVanoId(vanoId);
    setActivePanel('configuratore');
  }, []);

  const handleBackFromVano = useCallback(() => {
    const backTo = vanoCommessaId ? 'commesse' : 'settings';
    setSelectedVanoId(null);
    setVanoCommessaId(null);
    setActivePanel(backTo);
  }, [vanoCommessaId]);

  const sidebarW = sidebarCollapsed ? 68 : 280;

  // Panel router
  const renderPanel = () => {
    switch (activePanel) {
      case 'dashboard': return <DesktopDashboard />;
      case 'agenda': return <AgendaPanel />;
      case 'commesse': return <DesktopCommesse onNavigate={navigateTo} onOpenVano={handleOpenVano} />;
      case 'messaggi': return <MastroSignal onBack={() => navigateTo('home')} initialEntity={signalEntity} initialContatto={signalContatto} />;
      case 'clienti': return <DesktopClienti />;
      case 'contabilita': return <DesktopContabilita />;
      case 'configuratore': return <CostruttorePanel onBack={() => handleBackFromVano()} vanoId={selectedVanoId} commessaId={vanoCommessaId} />;
      case 'settings': return <SettingsPanelInline onNavigate={navigateTo} />;
      case 'cnc': return <DesktopProdFlow commessaId={navCommessaId} onNavigate={navigateTo} onBack={() => navigateTo('home')} />;
      case 'distinte': return <DesktopProdFlow commessaId={navCommessaId} onNavigate={navigateTo} onBack={() => navigateTo('home')} />;
      case 'ordini': return <OrdiniFornitori onBack={() => navigateTo('home')} />;
      case 'team': return <DesktopTeam commessaId={navCommessaId} onNavigate={navigateTo} />;
      case 'montaggi': return <DesktopMontaggi commessaId={navCommessaId} onNavigate={navigateTo} />;
      case 'misure': return <DesktopMisure commessaId={navCommessaId} onNavigate={navigateTo} />;
      case 'fatture': return <DesktopFatture commessaId={navCommessaId} onNavigate={navigateTo} />;
      case 'analytics': return <DesktopReport />;
      case 'listini': return <DesktopListini />;
      case 'archivio': return <SettingsPanelInline onNavigate={navigateTo} />;
      case 'enea': return <DesktopENEA commessaId={navCommessaId} onNavigate={navigateTo} />;
      case 'trovaClienti': return <DesktopLeads />;
      case 'rete': return <DesktopRete />;
      case 'aiAgente': return <DesktopAgente />;
      case 'produzione': return <DesktopProduzione commessaId={navCommessaId} onNavigate={navigateTo} />;
      case 'archivio_profili': return <ArchivioProfiliPanel onBack={() => sidebarNavigate('dashboard')} />;
      case 'nodi_tecnici': return <NodiTecniciPanel onBack={() => sidebarNavigate('dashboard')} />;
      case 'costruttore_vetri': return <CostruttoreVetri onBack={() => sidebarNavigate('dashboard')} />;
      case 'lavorazioni': return <CostruttoreLavorazioni onBack={() => sidebarNavigate('dashboard')} />;
      case 'posizionatore': return <PosizionatoreLavorazioni onBack={() => sidebarNavigate('dashboard')} />;
      case 'infissiora': return <DesktopInfissiOra />;
      case 'portale': return <DesktopPortaleB2C />;
      case 'vanoDetail': return <VanoDetailStandalone vanoId={selectedVanoId} commessaId={vanoCommessaId} onBack={handleBackFromVano} onNavigate={navigateTo} />;
      case 'wizardVano': return <WizardVanoComposto vanoId={selectedVanoId} commessaId={vanoCommessaId || ''} onClose={handleBackFromVano} onSaved={handleBackFromVano} />;
      default: {
        const allItems = SIDEBAR_GROUPS.flatMap(g => g.items);
        const item = allItems.find(i => i.id === activePanel);
        return <PlaceholderPanel title={item?.label || activePanel} icon={item?.icon || Icons.dashboard} />;
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarW,
        minWidth: sidebarW,
        background: DS.dark,
        color: DS.white,
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        {/* Logo fliwoX + Toggle */}
        <div style={{ padding: '18px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}>
            {/* fliwoX icon — exact brand SVG */}
            <svg width="34" height="34" viewBox="0 0 200 200" fill="none">
              <g transform="rotate(8 100 100)">
                <rect x="55" y="55" width="90" height="90" rx="22" fill="#2FA7A2"/>
                <path d="M70 70 L130 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
                <path d="M130 70 L70 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
              </g>
            </svg>
            {!sidebarCollapsed && (
              <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: 0.5 }}>
                <span style={{ color: DS.white }}>fliwo</span>
                <span style={{ color: DS.teal }}>X</span>
              </span>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 6, borderRadius: 6, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.color = DS.teal; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'none'; }}
              title="Chiudi menu"
            >
              <svg width="22" height="22" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 4l-8 6 8 6" />
              </svg>
            </button>
          )}
        </div>

        {/* Nav groups */}
        <nav style={{ flex: 1, padding: '6px 0' }}>
          {SIDEBAR_GROUPS.map(group => (
            <div key={group.title} style={{ marginBottom: 8 }}>
              {!sidebarCollapsed && (
                <div style={{
                  padding: '18px 22px 6px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: DS.teal,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                }}>
                  {group.title}
                </div>
              )}
              {group.items.map((item, idx) => {
                const isActive = activePanel === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => !item.disabled && sidebarNavigate(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      width: sidebarCollapsed ? '100%' : 'calc(100% - 16px)',
                      margin: sidebarCollapsed ? '2px 0' : '3px 8px',
                      padding: sidebarCollapsed ? '16px 0' : '15px 18px',
                      justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                      background: isActive ? 'rgba(40,160,160,0.2)' : 'rgba(255,255,255,0.03)',
                      border: 'none',
                      borderLeft: isActive ? `4px solid ${DS.teal}` : '4px solid transparent',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      color: item.disabled ? 'rgba(255,255,255,0.25)' : isActive ? DS.teal : 'rgba(255,255,255,0.8)',
                      cursor: item.disabled ? 'not-allowed' : 'pointer',
                      fontSize: 15,
                      fontWeight: isActive ? 700 : 500,
                      transition: 'all 0.12s',
                      fontFamily: "'Inter', sans-serif",
                      textAlign: 'left',
                      borderRadius: sidebarCollapsed ? 0 : 10,
                      minHeight: 48,
                    }}
                    onMouseEnter={e => { if (!item.disabled && !isActive) { e.currentTarget.style.background = 'rgba(40,160,160,0.12)'; e.currentTarget.style.color = DS.teal; } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = item.disabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)'; } }}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!sidebarCollapsed && (
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</div>
                        {item.subtitle && (
                          <div style={{ fontSize: 10, opacity: 0.5, marginTop: 1 }}>{item.subtitle}</div>
                        )}
                      </div>
                    )}
                    {!sidebarCollapsed && item.badge && item.badge > 0 && (
                      <span style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        background: DS.red,
                        color: DS.white,
                        fontSize: 10,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: DS.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>F</div>
          {!sidebarCollapsed && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>FABIO COZZA</div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>Piano START</div>
            </div>
          )}
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4 }}
              title="Comprimi sidebar"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 3l-6 6 6 6" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: DS.bg,
        overflow: 'hidden',
      }}>
        {/* Topbar */}
        <header style={{
          height: 52,
          minHeight: 52,
          background: DS.white,
          borderBottom: `1px solid ${DS.border}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: DS.tealDark, padding: 6, borderRadius: 6, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = DS.light; e.currentTarget.style.color = DS.teal; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = DS.tealDark; }}
                title="Apri menu"
              >
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M4 6h14M4 11h14M4 16h14" />
                </svg>
              </button>
            )}
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: DS.ink, textTransform: 'capitalize' }}>
              {activePanel === 'vanoDetail' ? 'Dettaglio Vano' : (SIDEBAR_GROUPS.flatMap(g => g.items).find(i => i.id === activePanel)?.label || activePanel)}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 12, color: DS.tealDark }}>
              {new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Content area — full width, no padding (panels handle their own) */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {renderPanel()}
        </div>
      </main>
    </div>
  );
}
