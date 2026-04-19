"use client";
// @ts-nocheck
// MASTRO ERP — HomePanel v11 — Card Configurabili
// Dropdown ingranaggio + Catalogo widget + Espandi inline + Salva layout JSONB
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const DS = {
  teal: '#28A0A0', tealDark: '#156060', dark: '#0D1F1F',
  light: '#EEF8F8', border: '#C8E4E4', bg: '#E8F4F4',
  white: '#FFFFFF', red: '#DC4444', green: '#1A9E73',
  amber: '#F59E0B', blue: '#3B7FE0', purple: '#8B5CF6', pink: '#EC4899',
};

const PIPELINE = [
  { key: 'RILIEVO', label: 'Sopralluogo', color: DS.blue },
  { key: 'PREVENTIVO', label: 'Preventivo', color: DS.amber },
  { key: 'CONFERMA ORDINE', label: 'Conferma', color: DS.teal },
  { key: 'ORDINE CONFERMATO', label: 'Ordini', color: DS.purple },
  { key: 'IN_PRODUZIONE', label: 'Produzione', color: DS.pink },
  { key: 'POSA', label: 'Posa', color: DS.green },
  { key: 'COLLAUDO', label: 'Collaudo', color: DS.teal },
  { key: 'FATTURA', label: 'Chiusura', color: '#6B7280' },
];

// ── Catalogo completo widget disponibili ──
const WIDGET_CATALOG = [
  { id: 'compiti', label: 'Compiti oggi', desc: 'Task del giorno con priorita', category: 'URGENTE', icon: 'C' },
  { id: 'pipeline', label: 'Pipeline commesse', desc: 'Stato avanzamento commesse', category: 'LAVORO', icon: 'P' },
  { id: 'scadenze', label: 'Scadenze 15gg', desc: 'Consegne, fatture, montaggi', category: 'URGENTE', icon: 'S' },
  { id: 'oggi', label: 'Oggi', desc: 'Montaggi e compiti del giorno', category: 'URGENTE', icon: 'O' },
  { id: 'team', label: 'Team', desc: 'Squadre e operatori online', category: 'TEAM', icon: 'T' },
  { id: 'produzione', label: 'Produzione', desc: 'Stato produzione e attese', category: 'LAVORO', icon: 'F' },
  { id: 'contabilita', label: 'Contabilita', desc: 'Fatturato, incassato, margine', category: 'SOLDI', icon: '$' },
  { id: 'pratiche', label: 'Pratiche fiscali', desc: 'ENEA, Ecobonus, Barriere', category: 'SOLDI', icon: 'E' },
  { id: 'messaggi_w', label: 'Messaggi recenti', desc: 'Ultimi messaggi non letti', category: 'URGENTE', icon: 'M' },
  { id: 'ordini_w', label: 'Ordini fornitori', desc: 'Ordini in attesa e confermati', category: 'LAVORO', icon: 'R' },
  { id: 'montaggi_w', label: 'Montaggi settimana', desc: 'Programmazione montaggi', category: 'LAVORO', icon: 'I' },
  { id: 'spese_w', label: 'Spese recenti', desc: 'Ultime spese operatori', category: 'SOLDI', icon: 'X' },
];

const DEFAULT_ORDER = ['compiti', 'pipeline', 'scadenze', 'produzione', 'oggi', 'contabilita', 'pratiche', 'team'];

const widget3d = {
  background: DS.white, borderRadius: 14, border: `1px solid ${DS.border}`,
  boxShadow: `0 5px 0 ${DS.border}, 0 8px 16px rgba(0,0,0,0.07)`,
  overflow: 'hidden', cursor: 'grab', transition: 'box-shadow 0.2s, transform 0.2s', position: 'relative',
};

const btn3d = (bg, shadow) => ({
  padding: '11px 20px', fontSize: 12, fontWeight: 700, color: DS.white, background: bg,
  border: 'none', borderRadius: 10, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
  fontFamily: "'Inter', sans-serif", boxShadow: `0 4px 0 ${shadow}, 0 6px 10px rgba(0,0,0,0.12)`, transition: 'transform 0.08s',
});

const btn3dOutline = { ...btn3d(DS.white, DS.border), color: DS.teal, border: `2px solid ${DS.teal}`, boxShadow: `0 4px 0 ${DS.border}, 0 6px 8px rgba(0,0,0,0.06)` };

// ── Icona ingranaggio SVG ──
function GearIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.3 3.3l1.4 1.4M11.3 11.3l1.4 1.4M3.3 12.7l1.4-1.4M11.3 4.7l1.4-1.4" />
    </svg>
  );
}

function WHead({ title, badge, badgeColor, dot, onAction, actionLabel, onGear, expanded, onToggleExpand }) {
  return (
    <div style={{ padding: '12px 16px 12px 28px', borderBottom: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: DS.dark, display: 'flex', alignItems: 'center', gap: 6 }}>
        {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, display: 'inline-block' }} />}
        {title}
        {badge && <span style={{ fontSize: 10, color: badgeColor || DS.tealDark, fontWeight: 500, marginLeft: 4 }}>{badge}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {onGear && (
          <button onClick={(e) => { e.stopPropagation(); onGear(); }} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6,
            color: DS.tealDark, opacity: 0.4, transition: 'all 0.15s', display: 'flex', alignItems: 'center',
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = DS.light; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.background = 'none'; }}
            title="Cambia widget"
          ><GearIcon /></button>
        )}
        {onAction && <button onClick={onAction} style={{ fontSize: 10, color: DS.teal, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'Inter', sans-serif" }}>{actionLabel || 'Vedi tutto'}</button>}
      </div>
    </div>
  );
}

function DragHandle() {
  return (
    <div style={{ position: 'absolute', top: 12, left: 5, display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.25, cursor: 'grab', padding: '2px 4px' }}>
      {[0,1,2].map(i => <span key={i} style={{ width: 12, height: 2, background: DS.tealDark, borderRadius: 1, display: 'block' }} />)}
    </div>
  );
}

function ExpandBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: 9, background: DS.light, border: 'none',
      borderTop: `1px solid ${DS.border}`, cursor: 'pointer',
      fontSize: 10, fontWeight: 600, color: DS.teal, fontFamily: "'Inter', sans-serif",
    }}>{label}</button>
  );
}

function RowItem({ label, value, onClick }) {
  return (
    <div onClick={onClick} style={{
      padding: '9px 16px', borderBottom: `1px solid ${DS.border}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      cursor: 'pointer', transition: 'background 0.1s', fontSize: 12, color: DS.dark,
    }}
      onMouseEnter={e => (e.currentTarget.style.background = DS.light)}
      onMouseLeave={e => (e.currentTarget.style.background = DS.white)}
    >
      <span>{label}</span>
      <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
    </div>
  );
}

// ── Dropdown per cambiare widget nella card ──
function WidgetPicker({ currentId, visibleWidgets, onSelect, onRemove, onClose }) {
  const available = WIDGET_CATALOG.filter(w => !visibleWidgets.includes(w.id) || w.id === currentId);
  const categories = ['URGENTE', 'LAVORO', 'SOLDI', 'TEAM'];

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20,
      background: DS.white, borderRadius: 14, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: 12, color: DS.dark }}>Scegli widget</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onRemove} style={{
            fontSize: 10, fontWeight: 600, color: DS.red, background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", padding: '4px 8px', borderRadius: 6,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#FEE2E2')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >Rimuovi</button>
          <button onClick={onClose} style={{
            fontSize: 10, fontWeight: 700, color: DS.tealDark, background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Inter', sans-serif", padding: '4px 8px', borderRadius: 6,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = DS.light)}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >Chiudi</button>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {categories.map(cat => {
          const items = available.filter(w => w.category === cat);
          if (items.length === 0) return null;
          return (
            <div key={cat} style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 1, color: DS.tealDark, textTransform: 'uppercase', padding: '4px 0' }}>{cat}</div>
              {items.map(w => (
                <div key={w.id} onClick={() => onSelect(w.id)}
                  style={{
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                    background: w.id === currentId ? DS.light : 'transparent', border: w.id === currentId ? `1px solid ${DS.teal}` : '1px solid transparent',
                    transition: 'all 0.1s', marginBottom: 2,
                  }}
                  onMouseEnter={e => { if (w.id !== currentId) e.currentTarget.style.background = DS.light; }}
                  onMouseLeave={e => { if (w.id !== currentId) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, background: DS.teal, color: DS.white,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0,
                  }}>{w.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: DS.dark }}>{w.label}</div>
                    <div style={{ fontSize: 9, color: DS.tealDark }}>{w.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compiti Widget ──
function CompitiWidget({ onNavigate }) {
  const [compiti, setCompiti] = useState([
    { id: '1', title: 'Sopralluogo \u2014 Rossi Mario', type: 'Sopralluogo', typeColor: DS.blue, typeBg: '#EBF5FF', address: 'Via Roma 12', time: '9:00', priority: 'urgente', done: false },
    { id: '2', title: 'Misure \u2014 Bianchi Luigi', type: 'Misure', typeColor: DS.amber, typeBg: '#FFF8E1', address: 'Corso Mazzini 8', time: '11:00', priority: 'normale', done: false },
    { id: '3', title: 'Consegna \u2014 Verdi Anna', type: 'Consegna', typeColor: DS.green, typeBg: '#E8F5E9', address: 'Via Napoli 3', time: '8:30', priority: 'bassa', done: true },
  ]);

  const toggleDone = (id) => setCompiti(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  const prioColor = { urgente: DS.red, normale: DS.amber, bassa: DS.green };

  return (
    <>
      {compiti.map(c => (
        <div key={c.id} style={{ padding: '10px 16px', borderBottom: `1px solid ${DS.border}`, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'background 0.1s', opacity: c.done ? 0.5 : 1 }}
          onMouseEnter={e => (e.currentTarget.style.background = DS.light)} onMouseLeave={e => (e.currentTarget.style.background = DS.white)}>
          <div style={{ width: 5, height: 32, borderRadius: 3, background: prioColor[c.priority], flexShrink: 0 }} />
          <div onClick={(e) => { e.stopPropagation(); toggleDone(c.id); }} style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            border: c.done ? 'none' : `2px solid ${DS.border}`, background: c.done ? DS.green : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s',
          }}>
            {c.done && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={DS.white} strokeWidth="2.5" strokeLinecap="round"><path d="M2 6l3 3 5-5" /></svg>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: DS.dark, textDecoration: c.done ? 'line-through' : 'none' }}>{c.title}</div>
            <div style={{ fontSize: 10, color: DS.tealDark, marginTop: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 8, fontWeight: 700, background: c.typeBg, color: c.typeColor, textTransform: 'uppercase' }}>{c.type}</span>
              {c.address && <span>{c.address}</span>}
              {c.time && <span>ore {c.time}</span>}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

// ── Expanded content per ogni widget ──
function ExpandedContent({ widgetId, nav }) {
  switch (widgetId) {
    case 'compiti': return (
      <div style={{ padding: '12px 16px', background: DS.light, borderTop: `1px solid ${DS.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: DS.tealDark, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Compiti settimana</div>
        {['Lun: Sopralluogo Bianchi', 'Mar: Montaggio Esposito', 'Mer: Consegna Rossi', 'Gio: Misure De Luca', 'Ven: Collaudo Ferraro'].map((d, i) => (
          <div key={i} style={{ fontSize: 11, color: DS.dark, padding: '4px 0', borderBottom: i < 4 ? `1px solid ${DS.border}` : 'none' }}>{d}</div>
        ))}
      </div>
    );
    case 'pipeline': return (
      <div style={{ padding: '12px 16px', background: DS.light, borderTop: `1px solid ${DS.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: DS.tealDark, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Dettaglio pipeline</div>
        <div style={{ fontSize: 11, color: DS.dark }}>Nessuna commessa filtrata. Clicca "Vedi tutto" per la lista completa.</div>
      </div>
    );
    case 'scadenze': return (
      <div style={{ padding: '12px 16px', background: DS.light, borderTop: `1px solid ${DS.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: DS.tealDark, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Scadenze 30 giorni</div>
        <div style={{ fontSize: 11, color: DS.dark }}>Nessuna scadenza programmata nei prossimi 30 giorni.</div>
      </div>
    );
    case 'contabilita': return (
      <div style={{ padding: '12px 16px', background: DS.light, borderTop: `1px solid ${DS.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: DS.tealDark, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Andamento 6 mesi</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 60 }}>
          {[20, 35, 28, 45, 52, 40].map((h, i) => (
            <div key={i} style={{ flex: 1, background: DS.teal, borderRadius: '4px 4px 0 0', height: `${h}%`, opacity: 0.5 + (i * 0.1), transition: 'height 0.3s' }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          {['Nov', 'Dic', 'Gen', 'Feb', 'Mar', 'Apr'].map(m => <span key={m} style={{ fontSize: 8, color: DS.tealDark }}>{m}</span>)}
        </div>
      </div>
    );
    default: return (
      <div style={{ padding: '12px 16px', background: DS.light, borderTop: `1px solid ${DS.border}` }}>
        <div style={{ fontSize: 11, color: DS.tealDark }}>Dettaglio espanso in arrivo.</div>
      </div>
    );
  }
}

// ══════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════

export default function HomePanel({ onNavigate }) {
  const [commesse, setCommesse] = useState([]);
  const [messaggi, setMessaggi] = useState([]);
  const user = { nome: 'FABIO COZZA' };
  const nav = (panel) => { if (onNavigate) onNavigate(panel); };

  // ── Layout state ──
  const [widgetOrder, setWidgetOrder] = useState(DEFAULT_ORDER);
  const [pickerOpen, setPickerOpen] = useState(null); // widget id con picker aperto
  const [expandedWidgets, setExpandedWidgets] = useState({}); // { widgetId: true/false }
  const [showAddPanel, setShowAddPanel] = useState(false);

  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // ── Load data ──
  useEffect(() => {
    supabase.from('commesse').select('*').order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setCommesse(data); });
  }, []);

  // ── Load saved layout from Supabase ──
  useEffect(() => {
    (async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        const { data } = await supabase.from('profili_utente').select('dashboard_layout').eq('user_id', authUser.id).single();
        if (data?.dashboard_layout?.widgetOrder) {
          setWidgetOrder(data.dashboard_layout.widgetOrder);
        }
      } catch (e) { /* no saved layout, use default */ }
    })();
  }, []);

  // ── Save layout to Supabase ──
  const saveLayout = useCallback(async (newOrder) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      await supabase.from('profili_utente').upsert({
        user_id: authUser.id,
        dashboard_layout: { widgetOrder: newOrder, savedAt: new Date().toISOString() },
      }, { onConflict: 'user_id' });
    } catch (e) { /* silent fail — layout saves best-effort */ }
  }, []);

  // ── Drag & Drop ──
  const handleDragStart = (id) => { dragItem.current = id; };
  const handleDragOver = (id) => { dragOverItem.current = id; };
  const handleDrop = () => {
    if (!dragItem.current || !dragOverItem.current || dragItem.current === dragOverItem.current) return;
    setWidgetOrder(prev => {
      const arr = [...prev];
      const fi = arr.indexOf(dragItem.current);
      const ti = arr.indexOf(dragOverItem.current);
      arr.splice(fi, 1);
      arr.splice(ti, 0, dragItem.current);
      saveLayout(arr);
      return arr;
    });
    dragItem.current = null; dragOverItem.current = null;
  };

  // ── Widget swap (from picker) ──
  const swapWidget = (oldId, newId) => {
    setWidgetOrder(prev => {
      const arr = prev.map(id => id === oldId ? newId : id);
      saveLayout(arr);
      return arr;
    });
    setPickerOpen(null);
  };

  // ── Remove widget ──
  const removeWidget = (id) => {
    setWidgetOrder(prev => {
      const arr = prev.filter(w => w !== id);
      saveLayout(arr);
      return arr;
    });
    setPickerOpen(null);
  };

  // ── Add widget ──
  const addWidget = (id) => {
    if (widgetOrder.includes(id)) return;
    setWidgetOrder(prev => {
      const arr = [...prev, id];
      saveLayout(arr);
      return arr;
    });
    setShowAddPanel(false);
  };

  // ── Toggle expand ──
  const toggleExpand = (id) => {
    setExpandedWidgets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Stats ──
  const stats = useMemo(() => {
    const attive = commesse.filter(c => !['FATTURA', 'PAGATA'].includes(c.stato));
    const ferme = commesse.filter(c => c.stato === 'RILIEVO' || c.stato === 'PREVENTIVO');
    const pipeline = commesse.reduce((s, c) => s + (c.valore_totale || 0), 0);
    const daIncassare = commesse.filter(c => c.stato === 'FATTURA').reduce((s, c) => s + (c.valore_totale || 0), 0);
    const nonLetti = (messaggi || []).filter(m => !m.letto).length;
    return { attive: attive.length, ferme: ferme.length, pipeline, daIncassare, nonLetti };
  }, [commesse, messaggi]);

  const pipelineCounts = useMemo(() => {
    const c = {};
    PIPELINE.forEach(p => { c[p.key] = 0; });
    commesse.forEach(cm => { if (c[cm.stato] !== undefined) c[cm.stato]++; });
    return c;
  }, [commesse]);
  const totalPipe = Object.values(pipelineCounts).reduce((a, b) => a + b, 0);

  const now = new Date();
  const saluto = now.getHours() < 12 ? 'Buongiorno' : now.getHours() < 18 ? 'Buon pomeriggio' : 'Buonasera';

  // ── Render singolo widget ──
  const renderWidget = (id) => {
    const isPickerOpen = pickerOpen === id;
    const isExpanded = expandedWidgets[id];

    const w = (headProps, children, expandLabel) => (
      <div key={id} draggable={!isPickerOpen} onDragStart={() => handleDragStart(id)} onDragOver={(e) => { e.preventDefault(); handleDragOver(id); }} onDrop={handleDrop}
        style={{ ...widget3d, cursor: isPickerOpen ? 'default' : 'grab' }}
        onMouseEnter={e => { if (!isPickerOpen) { e.currentTarget.style.boxShadow = `0 7px 0 ${DS.teal}, 0 10px 20px rgba(0,0,0,0.1)`; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 5px 0 ${DS.border}, 0 8px 16px rgba(0,0,0,0.07)`; e.currentTarget.style.transform = 'none'; }}>
        <DragHandle />
        <WHead {...headProps} onGear={() => setPickerOpen(isPickerOpen ? null : id)} />
        {children}
        {isExpanded && <ExpandedContent widgetId={id} nav={nav} />}
        {expandLabel && (
          <ExpandBtn
            label={isExpanded ? 'Comprimi' : expandLabel}
            onClick={() => toggleExpand(id)}
          />
        )}
        {isPickerOpen && (
          <WidgetPicker
            currentId={id}
            visibleWidgets={widgetOrder}
            onSelect={(newId) => swapWidget(id, newId)}
            onRemove={() => removeWidget(id)}
            onClose={() => setPickerOpen(null)}
          />
        )}
      </div>
    );

    switch (id) {
      case 'compiti': return w(
        { title: 'Compiti oggi', badge: `3 da fare`, dot: DS.amber, onAction: () => nav('team'), actionLabel: 'Team Command' },
        <CompitiWidget onNavigate={nav} />,
        'Espandi compiti settimana'
      );
      case 'pipeline': return w(
        { title: 'Pipeline commesse', badge: `${totalPipe} attive`, onAction: () => nav('commesse') },
        <>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ height: 7, borderRadius: 4, background: DS.light, display: 'flex', overflow: 'hidden', marginBottom: 10 }}>
              {PIPELINE.map(p => { const pct = totalPipe > 0 ? (pipelineCounts[p.key] / totalPipe) * 100 : 0; return pct > 0 ? <div key={p.key} style={{ width: `${pct}%`, background: p.color }} /> : null; })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
              {PIPELINE.map(p => (
                <div key={p.key} onClick={() => nav('commesse')} style={{ padding: '10px 12px', borderRadius: 9, background: DS.light, border: `1px solid ${DS.border}`, cursor: 'pointer', transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.background = DS.white; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = DS.light; }}>
                  <div style={{ fontSize: 9, color: DS.tealDark }}>{p.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: DS.dark }}>{pipelineCounts[p.key]}</div>
                  <div style={{ fontSize: 8, fontWeight: 600, color: p.color }}>{totalPipe > 0 ? Math.round((pipelineCounts[p.key] / totalPipe) * 100) : 0}%</div>
                </div>
              ))}
            </div>
          </div>
        </>,
        'Espandi con lista commesse'
      );
      case 'scadenze': return w(
        { title: 'Scadenze 15gg', dot: DS.amber },
        <div style={{ padding: '14px 16px', fontSize: 11, color: DS.dark }}>
          {['Consegne', 'Fatture', 'Montaggi'].map(s => (<div key={s} style={{ marginBottom: 8 }}><div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: DS.tealDark, marginBottom: 2 }}>{s} (0)</div><div>Nessuna programmata</div></div>))}
        </div>,
        'Espandi scadenze 30gg'
      );
      case 'oggi': return w(
        { title: 'Oggi', dot: DS.blue },
        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[{ n: 0, l: 'montaggi' }, { n: 3, l: 'compiti' }].map(t => (
            <div key={t.l} onClick={() => nav('team')} style={{ textAlign: 'center', padding: 12, background: DS.light, borderRadius: 9, cursor: 'pointer' }}>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: DS.dark }}>{t.n}</div>
              <div style={{ fontSize: 9, color: DS.tealDark, marginTop: 2 }}>{t.l}</div>
            </div>
          ))}
        </div>,
        null
      );
      case 'team': return w(
        { title: 'Team', onAction: () => nav('team') },
        <div style={{ padding: '10px 16px' }}>
          <div onClick={() => nav('team')} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 0' }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: DS.teal, color: DS.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>T</div>
            <div><div style={{ fontSize: 12, fontWeight: 600, color: DS.dark }}>Titolare</div><div style={{ fontSize: 9, color: DS.green }}>Online \u2014 3 compiti</div></div>
          </div>
        </div>,
        'Espandi team'
      );
      case 'produzione': return w(
        { title: 'Produzione', badge: '0 attive', badgeColor: DS.red, dot: DS.red, onAction: () => nav('distinte') },
        <>
          <RowItem label="In produzione" value={0} onClick={() => nav('distinte')} />
          <RowItem label="In attesa ordini" value={0} onClick={() => nav('ordini')} />
          <RowItem label="Pronte per posa" value={0} onClick={() => nav('montaggi')} />
        </>,
        'Espandi produzione'
      );
      case 'contabilita': return w(
        { title: 'Contabilita', onAction: () => nav('contabilita') },
        <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[{ l: 'Fatturato', v: '\u20AC0', c: DS.green }, { l: 'Incassato', v: '\u20AC0', c: DS.teal }, { l: 'Spese', v: '\u20AC0', c: DS.red }, { l: 'Margine', v: '\u2014', c: DS.dark }].map(s => (
            <div key={s.l} onClick={() => nav('contabilita')} style={{ padding: 10, background: DS.light, borderRadius: 8, cursor: 'pointer' }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: DS.tealDark }}>{s.l}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.c, fontFamily: "'JetBrains Mono', monospace", marginTop: 3 }}>{s.v}</div>
            </div>
          ))}
        </div>,
        'Espandi con grafico 6 mesi'
      );
      case 'pratiche': return w(
        { title: 'Pratiche fiscali', dot: DS.blue },
        <>
          <RowItem label="Ristrutturazione 50%" value={0} onClick={() => nav('enea')} />
          <RowItem label="Ecobonus 65%" value={0} onClick={() => nav('enea')} />
          <RowItem label="Barriere 75%" value={0} onClick={() => nav('enea')} />
        </>,
        'Espandi pratiche'
      );
      // ── Nuovi widget dal catalogo ──
      case 'messaggi_w': return w(
        { title: 'Messaggi recenti', dot: DS.teal, onAction: () => nav('messaggi') },
        <div style={{ padding: '14px 16px', fontSize: 11, color: DS.dark }}>
          <div style={{ textAlign: 'center', color: DS.tealDark, padding: 12 }}>Nessun messaggio non letto</div>
        </div>,
        null
      );
      case 'ordini_w': return w(
        { title: 'Ordini fornitori', dot: DS.amber, onAction: () => nav('ordini') },
        <>
          <RowItem label="In attesa conferma" value={0} onClick={() => nav('ordini')} />
          <RowItem label="Confermati" value={0} onClick={() => nav('ordini')} />
          <RowItem label="In consegna" value={0} onClick={() => nav('ordini')} />
        </>,
        'Espandi ordini'
      );
      case 'montaggi_w': return w(
        { title: 'Montaggi settimana', dot: DS.green, onAction: () => nav('montaggi') },
        <div style={{ padding: '14px 16px', fontSize: 11, color: DS.dark }}>
          <div style={{ textAlign: 'center', color: DS.tealDark, padding: 12 }}>Nessun montaggio programmato</div>
        </div>,
        null
      );
      case 'spese_w': return w(
        { title: 'Spese recenti', dot: DS.red, onAction: () => nav('contabilita') },
        <>
          <RowItem label="Questa settimana" value={'\u20AC0'} onClick={() => nav('contabilita')} />
          <RowItem label="Questo mese" value={'\u20AC0'} onClick={() => nav('contabilita')} />
          <RowItem label="Da approvare" value={0} onClick={() => nav('contabilita')} />
        </>,
        null
      );
      default: return null;
    }
  };

  const press = (e) => { e.currentTarget.style.transform = 'translateY(3px)'; };
  const release = (e) => { e.currentTarget.style.transform = 'none'; };

  // Widget disponibili per il pannello "Aggiungi"
  const addableWidgets = WIDGET_CATALOG.filter(w => !widgetOrder.includes(w.id));

  return (
    <div style={{ padding: 0, width: '100%', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: '18px 24px 14px', background: DS.white, borderBottom: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: DS.dark }}>{saluto}, {user?.nome || 'FABIO COZZA'}</h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: DS.tealDark }}>{now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} \u2014 trascina i widget per riordinare</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={btn3dOutline} onMouseDown={press} onMouseUp={release} onClick={() => nav('task')}>{stats.attive} task</button>
          <button style={btn3d(DS.teal, DS.tealDark)} onMouseDown={press} onMouseUp={release} onClick={() => {}}>+ Task</button>
          <button style={btn3d(DS.blue, '#2563EB')} onMouseDown={press} onMouseUp={release} onClick={() => {}}>+ Commessa</button>
          <button style={btn3d(DS.dark, '#000')} onMouseDown={press} onMouseUp={release} onClick={() => nav('messaggi')}>Messaggio</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: '14px 22px', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12 }}>
        {[
          { l: 'Commesse attive', v: stats.attive, c: DS.blue, s: '0 confermate', p: 'commesse' },
          { l: 'Ferme', v: stats.ferme, c: DS.amber, s: 'Soglia 5gg', p: 'commesse' },
          { l: 'Pipeline', v: `\u20AC${(stats.pipeline/1000).toFixed(stats.pipeline>9999?0:1)}k`, c: DS.green, s: '\u20AC0 confermato', p: 'commesse' },
          { l: 'Da incassare', v: `\u20AC${stats.daIncassare.toLocaleString('it-IT')}`, c: DS.red, s: '0 scadute', p: 'fatture' },
          { l: 'Messaggi', v: stats.nonLetti, c: DS.teal, s: `${messaggi?.length||0} totali`, p: 'messaggi' },
          { l: 'Compiti', v: 3, c: DS.dark, s: '1 urgente', p: 'team' },
        ].map((s, i) => (
          <div key={i} onClick={() => nav(s.p)} style={{
            padding: '14px 16px', background: DS.white, borderRadius: 12,
            border: `1px solid ${DS.border}`, cursor: 'pointer',
            boxShadow: `0 4px 0 ${DS.border}, 0 5px 10px rgba(0,0,0,0.05)`,
            transition: 'border-color 0.15s, transform 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = DS.teal; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: DS.tealDark, marginBottom: 5 }}>{s.l}</div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 9, color: DS.tealDark, marginTop: 3 }}>{s.s}</div>
          </div>
        ))}
      </div>

      {/* Widget grid */}
      <div style={{ padding: '0 22px 14px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {widgetOrder.map(id => renderWidget(id))}
      </div>

      {/* + Aggiungi widget */}
      <div style={{ padding: '0 22px 22px' }}>
        {!showAddPanel ? (
          <button onClick={() => setShowAddPanel(true)} style={{
            width: '100%', padding: 14, background: DS.white, border: `2px dashed ${DS.border}`,
            borderRadius: 14, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: DS.teal,
            fontFamily: "'Inter', sans-serif", transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = DS.teal; e.currentTarget.style.background = DS.light; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = DS.white; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 2v10M2 7h10" /></svg>
            Aggiungi widget ({addableWidgets.length} disponibili)
          </button>
        ) : (
          <div style={{ background: DS.white, borderRadius: 14, border: `1px solid ${DS.border}`, boxShadow: `0 5px 0 ${DS.border}, 0 8px 16px rgba(0,0,0,0.07)`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${DS.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: 13, color: DS.dark }}>Aggiungi widget alla dashboard</span>
              <button onClick={() => setShowAddPanel(false)} style={{ fontSize: 10, fontWeight: 700, color: DS.tealDark, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>Chiudi</button>
            </div>
            {addableWidgets.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 11, color: DS.tealDark }}>Tutti i widget sono gia nella dashboard</div>
            ) : (
              <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {addableWidgets.map(w => (
                  <div key={w.id} onClick={() => addWidget(w.id)} style={{
                    padding: 12, borderRadius: 10, border: `1px solid ${DS.border}`, cursor: 'pointer',
                    textAlign: 'center', transition: 'all 0.12s',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = DS.teal; e.currentTarget.style.background = DS.light; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = DS.border; e.currentTarget.style.background = DS.white; }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: DS.teal, color: DS.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, margin: '0 auto 6px' }}>{w.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: DS.dark }}>{w.label}</div>
                    <div style={{ fontSize: 8, color: DS.tealDark, marginTop: 2 }}>{w.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
