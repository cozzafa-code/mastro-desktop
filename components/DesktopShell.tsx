'use client'
// ============================================================
// MASTRO DESKTOP SHELL
// 3-zone layout: IconRail | ContextPanel | MainStage
// Design: Industrial Control Room — dark, precise, alive
// ============================================================
import React, { useState, useEffect, useRef } from 'react'
import { supabase, AZIENDA_ID } from '@/lib/supabase'
import { STATI_COMMESSA, MACRO_FASI } from '@/lib/types'

// ─── PALETTE ────────────────────────────────────────────────
const D = {
  void:    '#F2F1EC',   // background MASTRO
  surface: '#FFFFFF',   // pannelli card
  lift:    '#F8F7F2',   // card raised
  glass:   '#EDECE7',   // elementi interattivi
  rim:     '#E5E4DF',   // bordi sottili
  amber:   '#D08008',   // accent ambra MASTRO
  amberDim:'#D0800815',
  teal:    '#1A9E73',   // teal MASTRO
  tealDim: '#1A9E7315',
  green:   '#1A9E73',
  red:     '#DC4444',
  blue:    '#3B7FE0',
  purple:  '#8B5CF6',
  text:    '#1A1A1C',   // testo primario MASTRO
  sub:     '#86868b',   // testo secondario MASTRO
  ghost:   '#C0C0C5',   // testo fantasma
  white:   '#FFFFFF',
  topbar:  '#1A1A1C',   // topbar MASTRO
}

// ─── FONT (DM Mono per numeri, outfit per testo) ────────────
const FM = "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace"
const FF = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"

// ─── ICONE SVG INLINE ────────────────────────────────────────
const Ic = ({ n, s = 16, c }: { n: string; s?: number; c?: string }) => {
  const color = c || 'currentColor'
  const paths: Record<string, React.ReactNode> = {
    home:      <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></>,
    grid:      <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
    clipboard: <><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/></>,
    users:     <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
    dollar:    <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    package:   <><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></>,
    wrench:    <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>,
    calendar:  <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    ruler:     <><path d="M21 3L3 21M6.6 17.4l1.4 1.4M10.2 13.8l1.4 1.4M13.8 10.2l1.4 1.4M17.4 6.6l1.4 1.4"/></>,
    window:    <><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="9" x2="12" y2="21"/></>,
    zap:       <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    layers:    <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    settings:  <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
    search:    <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    bell:      <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></>,
    user:      <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    chart:     <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
    plus:      <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    arrow:     <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    check:     <><polyline points="20 6 9 17 4 12"/></>,
    x:         <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    eye:       <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    edit:      <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    cnc:       <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><circle cx="8" cy="10" r="2"/><path d="M14 10h4"/><path d="M14 13h4"/></>,
    truck:     <><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
    activity:  <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    inbox:     <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      {paths[n] || paths['grid']}
    </svg>
  )
}

// ─── MODULI DEFINIZIONE ────────────────────────────────────────
const MODULI = [
  { id: 'dashboard',    icon: 'home',      label: 'Dashboard',   color: D.amber,  group: 'core' },
  { id: 'commesse',     icon: 'clipboard', label: 'Commesse',    color: D.blue,   group: 'core' },
  { id: 'clienti',      icon: 'users',     label: 'Clienti',     color: D.teal,   group: 'core' },
  { id: 'calendario',   icon: 'calendar',  label: 'Calendario',  color: D.purple, group: 'core' },
  { id: 'divider1',     icon: '',          label: '',            color: '',       group: 'divider' },
  { id: 'contabilita',  icon: 'dollar',    label: 'Contabilità', color: D.green,  group: 'finance' },
  { id: 'magazzino',    icon: 'package',   label: 'Magazzino',   color: '#f97316', group: 'ops' },
  { id: 'produzione',   icon: 'wrench',    label: 'Produzione',  color: D.purple, group: 'ops' },
  { id: 'divider2',     icon: '',          label: '',            color: '',       group: 'divider' },
  { id: 'misure',       icon: 'ruler',     label: 'Misure',      color: D.teal,   group: 'tools' },
  { id: 'cnc',          icon: 'cnc',       label: 'CNC',         color: '#e879f9', group: 'tools' },
  { id: 'preventivi',   icon: 'layers',    label: 'Preventivi',  color: D.amber,  group: 'tools' },
  { id: 'lavorazioni',  icon: 'activity',  label: 'Lavorazioni', color: D.red,    group: 'tools' },
  { id: 'divider3',     icon: '',          label: '',            color: '',       group: 'divider' },
  { id: 'team',         icon: 'users',     label: 'Team',        color: D.blue,   group: 'admin' },
  { id: 'impostazioni', icon: 'settings',  label: 'Impostazioni',color: D.ghost,  group: 'admin' },
]

// ─── STATO BADGE ─────────────────────────────────────────────
function StatoBadge({ stato }: { stato: string }) {
  const s = STATI_COMMESSA.find(x => x.value === stato)
  const colors: Record<string, string> = {
    sopralluogo: '#f5a623', preventivo: '#8b90a8', misure: '#5b9cf6',
    ordini: '#a78bfa', produzione: '#34d399', posa: '#60a5fa', chiusura: '#10b981',
  }
  const col = colors[stato] || D.sub
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
      fontFamily: FM, letterSpacing: '0.04em',
      background: col + '18', color: col, border: `1px solid ${col}30`,
      whiteSpace: 'nowrap' as const,
    }}>
      {s?.icon} {s?.label || stato}
    </span>
  )
}

// ─── NUMERO FORMATTATO ────────────────────────────────────────
function Num({ v, prefix = '€', dim = false }: { v: number; prefix?: string; dim?: boolean }) {
  const formatted = v.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  return (
    <span style={{ fontFamily: FM, color: dim ? D.sub : D.text }}>
      <span style={{ fontSize: '0.75em', color: D.sub, marginRight: 2 }}>{prefix}</span>
      {formatted}
    </span>
  )
}

// ─── SEZIONE COMING SOON ──────────────────────────────────────
function ComingSoon({ label, icon, color }: { label: string; icon: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, opacity: 0.5 }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: color + '15', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Ic n={icon} s={28} c={color} />
      </div>
      <div style={{ textAlign: 'center' as const }}>
        <div style={{ fontFamily: FF, fontSize: 18, fontWeight: 700, color: D.text }}>{label}</div>
        <div style={{ fontFamily: FF, fontSize: 12, color: D.sub, marginTop: 4 }}>Modulo in arrivo</div>
      </div>
    </div>
  )
}

// ─── PANEL: DASHBOARD ─────────────────────────────────────────
function DashboardPanel({ commesse, stats }: { commesse: any[]; stats: any }) {
  const fasi = STATI_COMMESSA.map(s => ({
    ...s,
    count: commesse.filter(c => c.stato === s.value).length,
    valore: commesse.filter(c => c.stato === s.value).reduce((sum, c) => sum + (c.valore_preventivo || 0), 0),
  }))

  const kpi = [
    { label: 'Commesse attive', value: commesse.filter(c => !['chiusura'].includes(c.stato)).length, unit: '', color: D.amber, icon: 'clipboard' },
    { label: 'Valore totale', value: commesse.reduce((s, c) => s + (c.valore_preventivo || 0), 0), unit: '€', color: D.teal, icon: 'dollar' },
    { label: 'In produzione', value: commesse.filter(c => c.stato === 'produzione').length, unit: '', color: D.purple, icon: 'wrench' },
    { label: 'Da consegnare', value: commesse.filter(c => ['produzione', 'posa'].includes(c.stato)).length, unit: '', color: D.green, icon: 'truck' },
  ]

  return (
    <div style={{ padding: '28px 32px', height: '100%', overflowY: 'auto' as const }}>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {kpi.map((k, i) => (
          <div key={i} style={{
            background: D.lift, borderRadius: 14, padding: '18px 20px',
            border: `1px solid ${D.rim}`,
            position: 'relative' as const, overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute' as const, top: 16, right: 16, opacity: 0.15 }}>
              <Ic n={k.icon} s={32} c={k.color} />
            </div>
            <div style={{ fontFamily: FF, fontSize: 11, fontWeight: 600, color: D.sub, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>{k.label}</div>
            <div style={{ fontFamily: FM, fontSize: 32, fontWeight: 700, color: k.color, lineHeight: 1 }}>
              {k.unit && <span style={{ fontSize: 16, color: D.sub, marginRight: 3 }}>{k.unit}</span>}
              {k.value.toLocaleString('it-IT')}
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline bar */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: FF, fontSize: 11, fontWeight: 700, color: D.sub, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 12 }}>Pipeline commesse</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          {fasi.map(f => (
            <div key={f.value} style={{
              flex: `0 0 auto`, background: D.lift, borderRadius: 10, padding: '12px 16px',
              border: `1px solid ${f.count > 0 ? f.color + '40' : D.rim}`,
              minWidth: 110,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 14 }}>{f.icon}</span>
                <span style={{ fontFamily: FF, fontSize: 11, color: D.sub }}>{f.label}</span>
              </div>
              <div style={{ fontFamily: FM, fontSize: 24, fontWeight: 700, color: f.count > 0 ? f.color : D.ghost }}>{f.count}</div>
              {f.valore > 0 && <div style={{ fontFamily: FM, fontSize: 10, color: D.sub, marginTop: 2 }}>€ {(f.valore / 1000).toFixed(0)}k</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Ultime commesse */}
      <div>
        <div style={{ fontFamily: FF, fontSize: 11, fontWeight: 700, color: D.sub, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 12 }}>Commesse recenti</div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
          {commesse.slice(0, 8).map(c => (
            <div key={c.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: D.lift, borderRadius: 10, padding: '11px 16px',
              border: `1px solid ${D.rim}`,
              cursor: 'default',
            }}>
              <div style={{ fontFamily: FM, fontSize: 11, color: D.sub, minWidth: 72 }}>{c.codice || '—'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {c.cliente ? `${c.cliente.cognome} ${c.cliente.nome}` : c.titolo || '—'}
                </div>
                <div style={{ fontFamily: FF, fontSize: 11, color: D.sub }}>{c.citta || c.indirizzo || '—'}</div>
              </div>
              <StatoBadge stato={c.stato} />
              <div style={{ fontFamily: FM, fontSize: 13, fontWeight: 700, color: D.amber, minWidth: 72, textAlign: 'right' as const }}>
                € {(c.valore_preventivo || 0).toLocaleString('it-IT', { minimumFractionDigits: 0 })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── PANEL: COMMESSE ──────────────────────────────────────────
function CommessePanel({ commesse, onSelect, selected }: { commesse: any[]; onSelect: (c: any) => void; selected: any }) {
  const [filter, setFilter] = useState('tutti')
  const [search, setSearch] = useState('')

  const filtered = commesse.filter(c => {
    const matchFilter = filter === 'tutti' || c.stato === filter
    const matchSearch = !search ||
      `${c.cliente?.cognome} ${c.cliente?.nome} ${c.codice} ${c.citta}`.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Lista */}
      <div style={{ width: 340, borderRight: `1px solid ${D.rim}`, display: 'flex', flexDirection: 'column' as const, flexShrink: 0 }}>
        {/* Search */}
        <div style={{ padding: '16px 14px 10px', borderBottom: `1px solid ${D.rim}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: D.glass, borderRadius: 8, padding: '8px 12px', border: `1px solid ${D.rim}` }}>
            <Ic n="search" s={14} c={D.sub} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cerca commessa..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: FF, fontSize: 13, color: D.text }}
            />
          </div>
        </div>
        {/* Filtri stato */}
        <div style={{ padding: '8px 14px', display: 'flex', gap: 4, flexWrap: 'wrap' as const, borderBottom: `1px solid ${D.rim}` }}>
          {[{ value: 'tutti', label: 'Tutti' }, ...STATI_COMMESSA].map(s => {
            const colors: Record<string, string> = {
              sopralluogo: '#f5a623', preventivo: '#8b90a8', misure: '#5b9cf6',
              ordini: '#a78bfa', produzione: '#34d399', posa: '#60a5fa', chiusura: '#10b981',
              tutti: D.amber,
            }
            const col = colors[s.value] || D.sub
            const isActive = filter === s.value
            return (
              <button key={s.value} onClick={() => setFilter(s.value)}
                style={{
                  padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                  fontFamily: FM, letterSpacing: '0.03em', cursor: 'pointer',
                  background: isActive ? col + '20' : 'transparent',
                  color: isActive ? col : D.sub,
                  border: `1px solid ${isActive ? col + '50' : 'transparent'}`,
                  transition: 'all 0.12s',
                }}>
                {'icon' in s ? (s as any).icon + ' ' : ''}{s.label}
              </button>
            )
          })}
        </div>
        {/* Lista commesse */}
        <div style={{ flex: 1, overflowY: 'auto' as const }}>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center' as const, color: D.sub, fontSize: 13, fontFamily: FF }}>Nessuna commessa trovata</div>
          )}
          {filtered.map(c => {
            const isSelected = selected?.id === c.id
            const colors: Record<string, string> = {
              sopralluogo: '#f5a623', preventivo: '#8b90a8', misure: '#5b9cf6',
              ordini: '#a78bfa', produzione: '#34d399', posa: '#60a5fa', chiusura: '#10b981',
            }
            const stateColor = colors[c.stato] || D.sub
            return (
              <div key={c.id} onClick={() => onSelect(c)}
                style={{
                  padding: '12px 14px', cursor: 'pointer', borderBottom: `1px solid ${D.rim}`,
                  background: isSelected ? D.amberDim : 'transparent',
                  borderLeft: `3px solid ${isSelected ? D.amber : 'transparent'}`,
                  transition: 'all 0.1s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                  <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: D.text }}>
                    {c.cliente ? `${c.cliente.cognome} ${c.cliente.nome}` : c.titolo || '—'}
                  </div>
                  <span style={{ fontFamily: FM, fontSize: 10, color: stateColor, background: stateColor + '15', padding: '1px 6px', borderRadius: 3, border: `1px solid ${stateColor}30` }}>
                    {STATI_COMMESSA.find(s => s.value === c.stato)?.icon} {STATI_COMMESSA.find(s => s.value === c.stato)?.label}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: FM, fontSize: 10, color: D.sub }}>{c.codice || '—'} · {c.citta || '—'}</div>
                  <div style={{ fontFamily: FM, fontSize: 12, fontWeight: 700, color: D.amber }}>
                    € {(c.valore_preventivo || 0).toLocaleString('it-IT', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {/* Footer count */}
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${D.rim}`, fontFamily: FM, fontSize: 10, color: D.sub }}>
          {filtered.length} commesse · € {filtered.reduce((s, c) => s + (c.valore_preventivo || 0), 0).toLocaleString('it-IT', { minimumFractionDigits: 0 })}
        </div>
      </div>

      {/* Dettaglio */}
      <div style={{ flex: 1, overflowY: 'auto' as const }}>
        {!selected ? (
          <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, opacity: 0.4 }}>
            <Ic n="clipboard" s={40} c={D.blue} />
            <div style={{ fontFamily: FF, fontSize: 14, color: D.sub }}>Seleziona una commessa</div>
          </div>
        ) : (
          <CommessaDetail commessa={selected} />
        )}
      </div>
    </div>
  )
}

// ─── COMMESSA DETAIL ─────────────────────────────────────────
function CommessaDetail({ commessa: c }: { commessa: any }) {
  const [tab, setTab] = useState<'info' | 'fasi' | 'note'>('info')

  const FASI_COLORS: Record<string, string> = {
    sopralluogo: '#f5a623', preventivo: '#8b90a8', misure: '#5b9cf6',
    ordini: '#a78bfa', produzione: '#34d399', posa: '#60a5fa', chiusura: '#10b981',
  }
  const currentFaseIdx = STATI_COMMESSA.findIndex(s => s.value === c.stato)

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header commessa */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: FM, fontSize: 11, color: D.sub, marginBottom: 4 }}>{c.codice || 'COMMESSA'}</div>
            <div style={{ fontFamily: FF, fontSize: 22, fontWeight: 800, color: D.text }}>
              {c.cliente ? `${c.cliente.cognome} ${c.cliente.nome}` : c.titolo || '—'}
            </div>
            {c.citta && <div style={{ fontFamily: FF, fontSize: 13, color: D.sub, marginTop: 3 }}>{c.indirizzo}{c.citta ? `, ${c.citta}` : ''}</div>}
          </div>
          <div style={{ fontFamily: FM, fontSize: 28, fontWeight: 700, color: D.amber }}>
            € {(c.valore_preventivo || 0).toLocaleString('it-IT', { minimumFractionDigits: 0 })}
          </div>
        </div>
        <StatoBadge stato={c.stato} />
      </div>

      {/* Progress fasi */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          {STATI_COMMESSA.map((s, i) => {
            const isPast = i < currentFaseIdx
            const isCurrent = i === currentFaseIdx
            const col = FASI_COLORS[s.value] || D.sub
            return (
              <React.Fragment key={s.value}>
                <div style={{
                  display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 4,
                  flex: 1, opacity: isPast ? 0.4 : isCurrent ? 1 : 0.25,
                }}>
                  <div style={{
                    width: isCurrent ? 28 : 20, height: isCurrent ? 28 : 20,
                    borderRadius: '50%', background: isCurrent ? col + '25' : isPast ? col + '15' : D.glass,
                    border: `2px solid ${isCurrent ? col : isPast ? col + '60' : D.rim}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isCurrent ? 13 : 10, transition: 'all 0.2s',
                  }}>
                    {isPast ? <Ic n="check" s={10} c={col} /> : s.icon}
                  </div>
                  <div style={{ fontFamily: FM, fontSize: 8, color: isCurrent ? col : D.sub, fontWeight: isCurrent ? 700 : 400, textAlign: 'center' as const }}>{s.label}</div>
                </div>
                {i < STATI_COMMESSA.length - 1 && (
                  <div style={{ flex: 0, width: 16, height: 1, background: i < currentFaseIdx ? FASI_COLORS[s.value] + '60' : D.rim, marginBottom: 16 }} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Tab */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: `1px solid ${D.rim}` }}>
        {[
          { id: 'info', label: 'Dettagli' },
          { id: 'fasi', label: 'Fasi' },
          { id: 'note', label: 'Note' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{
              padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: FF, fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? D.amber : D.sub,
              borderBottom: `2px solid ${tab === t.id ? D.amber : 'transparent'}`,
              marginBottom: -1, transition: 'all 0.1s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Cliente', value: c.cliente ? `${c.cliente.cognome} ${c.cliente.nome}` : '—' },
            { label: 'Telefono', value: c.cliente?.telefono || '—' },
            { label: 'Email', value: c.cliente?.email || '—' },
            { label: 'Codice', value: c.codice || '—' },
            { label: 'Tipo', value: c.tipo || '—' },
            { label: 'Priorità', value: c.priorita || '—' },
            { label: 'Data inizio', value: c.data_inizio || '—' },
            { label: 'Consegna prevista', value: c.data_consegna_prevista || '—' },
            { label: 'Assegnato a', value: c.assegnato_a || '—' },
            { label: 'Indirizzo cantiere', value: [c.indirizzo, c.citta].filter(Boolean).join(', ') || '—' },
          ].map((field, fi) => (
            <div key={fi} style={{ background: D.lift, borderRadius: 8, padding: '10px 12px', border: `1px solid ${D.rim}` }}>
              <div style={{ fontFamily: FF, fontSize: 10, color: D.sub, marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{field.label}</div>
              <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: D.text }}>{field.value}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'fasi' && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
          {STATI_COMMESSA.map((s, i) => {
            const isPast = i < currentFaseIdx
            const isCurrent = i === currentFaseIdx
            const col = FASI_COLORS[s.value] || D.sub
            return (
              <div key={s.value} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: isCurrent ? col + '10' : D.lift,
                borderRadius: 10, padding: '12px 16px',
                border: `1px solid ${isCurrent ? col + '40' : D.rim}`,
                opacity: !isPast && !isCurrent ? 0.4 : 1,
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: col + '20', border: `2px solid ${col}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {isPast ? '✓' : s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: FF, fontSize: 13, fontWeight: isCurrent ? 700 : 600, color: isCurrent ? col : D.text }}>{s.label}</div>
                  <div style={{ fontFamily: FF, fontSize: 11, color: D.sub }}>
                    {isPast ? 'Completata' : isCurrent ? 'In corso' : 'In attesa'}
                  </div>
                </div>
                {isCurrent && <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, boxShadow: `0 0 8px ${col}` }} />}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'note' && (
        <div style={{ background: D.lift, borderRadius: 10, padding: 16, border: `1px solid ${D.rim}`, fontFamily: FF, fontSize: 13, color: c.note ? D.text : D.sub, lineHeight: 1.7, minHeight: 100 }}>
          {c.note || 'Nessuna nota per questa commessa.'}
        </div>
      )}
    </div>
  )
}

// ─── PANEL: CLIENTI ───────────────────────────────────────────
function ClientiPanel({ clienti }: { clienti: any[] }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const filtered = clienti.filter(c =>
    !search || `${c.cognome} ${c.nome} ${c.email} ${c.citta}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ width: 300, borderRight: `1px solid ${D.rim}`, display: 'flex', flexDirection: 'column' as const, flexShrink: 0 }}>
        <div style={{ padding: '16px 14px', borderBottom: `1px solid ${D.rim}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: D.glass, borderRadius: 8, padding: '8px 12px', border: `1px solid ${D.rim}` }}>
            <Ic n="search" s={14} c={D.sub} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca cliente..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: FF, fontSize: 13, color: D.text }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' as const }}>
          {filtered.map(c => (
            <div key={c.id} onClick={() => setSelected(c)}
              style={{
                padding: '12px 14px', cursor: 'pointer', borderBottom: `1px solid ${D.rim}`,
                background: selected?.id === c.id ? D.tealDim : 'transparent',
                borderLeft: `3px solid ${selected?.id === c.id ? D.teal : 'transparent'}`,
              }}>
              <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: D.text }}>{c.cognome} {c.nome}</div>
              <div style={{ fontFamily: FM, fontSize: 10, color: D.sub, marginTop: 2 }}>{c.email || '—'} · {c.citta || '—'}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${D.rim}`, fontFamily: FM, fontSize: 10, color: D.sub }}>{filtered.length} clienti</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' as const }}>
        {!selected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.3 }}>
            <div style={{ textAlign: 'center' as const }}>
              <Ic n="users" s={40} c={D.teal} />
              <div style={{ fontFamily: FF, fontSize: 14, color: D.sub, marginTop: 8 }}>Seleziona un cliente</div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px 28px' }}>
            <div style={{ fontFamily: FF, fontSize: 22, fontWeight: 800, color: D.text, marginBottom: 4 }}>{selected.cognome} {selected.nome}</div>
            <div style={{ fontFamily: FM, fontSize: 11, color: D.sub, marginBottom: 20 }}>{selected.tipo || 'Cliente privato'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Email', value: selected.email }, { label: 'Telefono', value: selected.telefono },
                { label: 'Indirizzo', value: selected.indirizzo }, { label: 'Città', value: selected.citta },
                { label: 'P.IVA', value: selected.partita_iva }, { label: 'Cod. Fiscale', value: selected.codice_fiscale },
              ].map((f, fi) => (
                <div key={fi} style={{ background: D.lift, borderRadius: 8, padding: '10px 12px', border: `1px solid ${D.rim}` }}>
                  <div style={{ fontFamily: FF, fontSize: 10, color: D.sub, marginBottom: 3, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>{f.label}</div>
                  <div style={{ fontFamily: FF, fontSize: 13, fontWeight: 600, color: f.value ? D.text : D.ghost }}>{f.value || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ICON RAIL (colonna sinistra icone) ──────────────────────
function IconRail({ active, onSelect, profilo, onLogout }: {
  active: string
  onSelect: (id: string) => void
  profilo: any
  onLogout: () => void
}) {
  const [tooltip, setTooltip] = useState<string | null>(null)

  return (
    <div style={{
      width: 64, background: D.topbar, borderRight: `1px solid #2A2A2C`,
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      flexShrink: 0, zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 0 12px', display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: D.teal,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FM, fontSize: 16, fontWeight: 900, color: '#FFFFFF',
          
        }}>M</div>
      </div>

      <div style={{ width: 28, height: 1, background: D.rim, marginBottom: 8 }} />

      {/* Moduli */}
      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2, padding: '4px 0', overflowY: 'auto' as const }}>
        {MODULI.map(m => {
          if (m.group === 'divider') return (
            <div key={m.id} style={{ width: 28, height: 1, background: D.rim, margin: '6px 0' }} />
          )
          const isActive = active === m.id
          return (
            <div key={m.id} style={{ position: 'relative' as const, width: '100%', display: 'flex', justifyContent: 'center' }}
              onMouseEnter={() => setTooltip(m.id)}
              onMouseLeave={() => setTooltip(null)}>
              <button onClick={() => onSelect(m.id)}
                style={{
                  width: 44, height: 44, borderRadius: 11, border: 'none', cursor: 'pointer',
                  background: isActive ? m.color + '20' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  outline: isActive ? `1.5px solid ${m.color}50` : 'none',
                  transition: 'all 0.12s',
                  position: 'relative' as const,
                }}>
                <Ic n={m.icon} s={18} c={isActive ? m.color : '#86868b'} />
                {isActive && (
                  <div style={{
                    position: 'absolute' as const, left: -2, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 20, borderRadius: '0 2px 2px 0', background: m.color,
                  }} />
                )}
              </button>
              {/* Tooltip */}
              {tooltip === m.id && (
                <div style={{
                  position: 'absolute' as const, left: 52, top: '50%', transform: 'translateY(-50%)',
                  background: D.glass, border: `1px solid ${D.rim}`, borderRadius: 7,
                  padding: '5px 10px', whiteSpace: 'nowrap' as const,
                  fontFamily: FF, fontSize: 12, fontWeight: 600, color: D.text,
                  zIndex: 999, pointerEvents: 'none' as const,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  <span style={{ color: m.color, marginRight: 6 }}>●</span>{m.label}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Avatar utente */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', paddingBottom: 14, paddingTop: 8, borderTop: `1px solid ${D.rim}` }}>
        <button onClick={onLogout} title="Esci"
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
            background: D.amber + '30', color: D.amber,
            fontFamily: FM, fontSize: 12, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          {profilo?.nome?.[0]}{profilo?.cognome?.[0]}
        </button>
      </div>
    </div>
  )
}

// ─── TOPBAR MODULO ────────────────────────────────────────────
function ModuleTopbar({ modulo, oggi, notifiche }: { modulo: any; oggi: string; notifiche?: number }) {
  return (
    <div style={{
      height: 52, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      background: D.surface, borderBottom: `1px solid ${D.rim}`, boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: modulo.color + '20', border: `1px solid ${modulo.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Ic n={modulo.icon} s={14} c={modulo.color} />
        </div>
        <div>
          <div style={{ fontFamily: FF, fontSize: 15, fontWeight: 700, color: D.text }}>{modulo.label}</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: FM, fontSize: 11, color: D.sub }}>{oggi}</div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: D.glass, border: `1px solid ${D.rim}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' as const }}>
          <Ic n="bell" s={14} c={D.sub} />
          {notifiche && notifiche > 0 ? (
            <div style={{ position: 'absolute' as const, top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: D.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FM, fontSize: 8, color: D.white, fontWeight: 700 }}>{notifiche}</div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── SHELL PRINCIPALE ─────────────────────────────────────────
export default function DesktopShell({
  profilo,
  onLogout,
  commesse = [],
  clienti = [],
  stats = {},
}: {
  profilo: any
  onLogout: () => void
  commesse?: any[]
  clienti?: any[]
  stats?: any
}) {
  const [activeModule, setActiveModule] = useState('dashboard')
  const [selectedCommessa, setSelectedCommessa] = useState<any>(null)
  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  const modulo = MODULI.find(m => m.id === activeModule) || MODULI[0]

  const renderContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardPanel commesse={commesse} stats={stats} />
      case 'commesse':
        return <CommessePanel commesse={commesse} onSelect={setSelectedCommessa} selected={selectedCommessa} />
      case 'clienti':
        return <ClientiPanel clienti={clienti} />
      case 'cnc':
        return <ComingSoon label="MASTRO CNC" icon="cnc" color="#e879f9" />
      case 'preventivi':
        return <ComingSoon label="Preventivi Avanzati" icon="layers" color={D.amber} />
      case 'lavorazioni':
        return <ComingSoon label="Lavorazioni" icon="activity" color={D.red} />
      case 'misure':
        return <ComingSoon label="MASTRO MISURE" icon="ruler" color={D.teal} />
      default:
        return <ComingSoon label={modulo?.label || activeModule} icon={modulo?.icon || 'grid'} color={modulo?.color || D.amber} />
    }
  }

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden',
      background: D.void, color: D.text,
      fontFamily: FF,
    }}>
      {/* Zona 1: Icon Rail */}
      <IconRail
        active={activeModule}
        onSelect={setActiveModule}
        profilo={profilo}
        onLogout={onLogout}
      />

      {/* Zona 2+3: Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden' }}>
        {/* Topbar modulo */}
        <ModuleTopbar modulo={modulo} oggi={oggi} notifiche={commesse.filter(c => c.stato === 'produzione').length} />

        {/* Contenuto */}
        <div style={{ flex: 1, overflow: 'hidden', background: D.void }}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
