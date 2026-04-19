'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { supabase, AZIENDA_ID } from '@/lib/supabase'
import DesktopShell from './DesktopShell'

import { Commessa, Cliente, Evento, Fattura, Pagamento, Scadenza, STATI_COMMESSA, ArticoloMagazzino, CategoriaMagazzino, MovimentoMagazzino, Fornitore, FaseProduzione, CentroLavoro, Lavorazione, Dipendente, CommessaAttivita, MACRO_FASI, OrdineFornitore, Promemoria, Serramento, TIPI_SERRAMENTO, MATERIALI_PROFILO, COLORI_SERRAMENTO } from '@/lib/types'

// ==================== SVG ICON SET ====================
const Ic = ({ n, s = 16, c, w = 1.8 }: { n: string; s?: number; c?: string; w?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c || 'currentColor'} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
    {({
      home: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></>,
      clipboard: <><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/></>,
      dollar: <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
      package: <><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></>,
      wrench: <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>,
      users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
      calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
      file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></>,
      check: <><polyline points="20 6 9 17 4 12"/></>,
      clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
      alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
      bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></>,
      ruler: <><path d="M21 3L3 21M6.6 17.4l1.4 1.4M10.2 13.8l1.4 1.4M13.8 10.2l1.4 1.4M17.4 6.6l1.4 1.4"/></>,
      settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
      inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
      send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
      creditcard: <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
      building: <><path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/></>,
      arrowUpDown: <><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></>,
      zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
      timer: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M5 3l-2 2M19 3l2 2"/></>,
      search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
      chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
      pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
      truck: <><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
      user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
      window: <><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="9" x2="12" y2="21"/></>,
      diamond: <><path d="M2.7 10.3a2.41 2.41 0 000 3.41l7.59 7.59a2.41 2.41 0 003.41 0l7.59-7.59a2.41 2.41 0 000-3.41L13.7 2.71a2.41 2.41 0 00-3.41 0z"/></>,
      chevronRight: <><polyline points="9 18 15 12 9 6"/></>,
      chevronLeft: <><polyline points="15 18 9 12 15 6"/></>,
      x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
      plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
      minus: <><line x1="5" y1="12" x2="19" y2="12"/></>,
      edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
      trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
      refresh: <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
      play: <><polygon points="5 3 19 12 5 21 5 3"/></>,
      pause: <><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>,
      eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
      filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
      mic: <><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8"/></>,
      grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
      layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
      target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
      activity: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
      blocked: <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>,
      maximize: <><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>,
      store: <><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9"/><path d="M9 21V13h6v8"/><path d="M3 9h18"/></>,
      arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
      arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
      gitBranch: <><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></>,
    })[n] || <circle cx="12" cy="12" r="1"/>}
  </svg>
)

// ==================== LIGHT THEME PALETTE ====================
const TH = {
  bg: '#F7F8FA', bgCard: '#FFFFFF', bgInput: '#F0F2F5', bgHover: '#E9ECF0', bgDeep: '#F5F6F8',
  border: '#E8ECF1', borderMed: '#D6DAE1', borderStrong: '#C8CCD2',
  text: '#1A1D26', textSec: '#5F6680', textMuted: '#8C92A4', textPlaceholder: '#B0B5C3',
  amber: '#D97706', blue: '#3B82F6', green: '#059669', purple: '#7C3AED', red: '#DC2626', pink: '#EC4899',
  shadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  shadowMd: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
}

// ==================== SHARED INPUT COMPONENTS ====================
const InputField = ({ label, value, onChange, type = 'text', placeholder = '' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
  <div>
    <label style={{ fontSize: 10, color: TH.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600 }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
      style={{ background: TH.bgInput, border: `1px solid ${TH.borderMed}`, color: TH.text }} />
  </div>
)

const SelectField = ({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
  <div>
    <label style={{ fontSize: 10, color: TH.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600 }}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
      style={{ background: TH.bgInput, border: `1px solid ${TH.borderMed}`, color: TH.text }}>
      <option value="">— Seleziona —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
)

// Componente separato per il form evento - evita re-render di Dashboard
const CalendarioEventoForm = React.memo(({ 
  initialValues,
  onSave, 
  onCancel,
  clienti,
  commesse,
  tipiEvento,
  styles
}: {
  initialValues: any
  onSave: (evento: any) => void
  onCancel: () => void
  clienti: any[]
  commesse: any[]
  tipiEvento: any
  styles: { TH: any; TX: any; BG: any }
}) => {
  const { TH, TX, BG } = styles
  
  // State interno del form - NON fa re-render di Dashboard!
  const [formData, setFormData] = useState(initialValues)
  
  const handleSave = () => {
    onSave(formData)
  }
  
  return (
    <div className="rounded-2xl p-5 mb-6" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: TH.shadow }}>
      <h4 className="text-sm font-semibold mb-3">Nuovo Evento</h4>
      <div className="grid grid-cols-4 gap-3 mb-3">
        <InputField label="Titolo" value={formData.titolo} onChange={v => setFormData(prev => ({ ...prev, titolo: v }))} placeholder="es. Sopralluogo via Roma" />
        <SelectField label="Tipo" value={formData.tipo} onChange={v => setFormData(prev => ({ ...prev, tipo: v }))} options={Object.entries(tipiEvento).map(([k, v]: [string, any]) => ({ value: k, label: v.label }))} />
        <InputField label="Data" value={formData.data} onChange={v => setFormData(prev => ({ ...prev, data: v }))} type="date" />
        <InputField label="Ora Inizio" value={formData.ora_inizio} onChange={v => setFormData(prev => ({ ...prev, ora_inizio: v }))} type="time" />
      </div>
      <div className="grid grid-cols-4 gap-3 mb-3">
        <SelectField label="Durata" value={String(formData.durata_min)} onChange={v => setFormData(prev => ({ ...prev, durata_min: parseInt(v) }))} options={[{ value: '30', label: '30 min' }, { value: '60', label: '1 ora' }, { value: '90', label: '1.5 ore' }, { value: '120', label: '2 ore' }, { value: '180', label: '3 ore' }, { value: '240', label: '4 ore' }, { value: '480', label: 'Giornata' }]} />
        <SelectField label="Cliente" value={formData.cliente_id} onChange={v => setFormData(prev => ({ ...prev, cliente_id: v }))} options={clienti.map(c => ({ value: c.id, label: `${c.nome} ${c.cognome}` }))} />
        <SelectField label="Commessa" value={formData.commessa_id} onChange={v => setFormData(prev => ({ ...prev, commessa_id: v }))} options={commesse.map(c => ({ value: c.id, label: `${c.codice} - ${c.titolo}` }))} />
        <InputField label="Note" value={formData.note} onChange={v => setFormData(prev => ({ ...prev, note: v }))} placeholder="Note..." />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: TX.textSec, border: `1px solid ${TX.borderMed}` }}>Annulla</button>
        <button type="button" onClick={handleSave} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: TH.amber, color: '#fff' }}>Salva Evento</button>
      </div>
    </div>
  )
})

export default function Dashboard() {
  // ==================== AUTH STATE ====================
  const [authUser, setAuthUser] = useState<any>(null)
  const [profilo, setProfilo] = useState<{ id: string; nome: string; cognome: string; ruolo: string; licenza: string; reparto: string; telefono: string; avatar: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authView, setAuthView] = useState<'login'|'signup'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authNome, setAuthNome] = useState('')
  const [authCognome, setAuthCognome] = useState('')
  const [authError, setAuthError] = useState('')

  // ==================== RESPONSIVE ====================
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // ==================== AUTH LOGIC ====================
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) loadProfilo(session.user.id)
      else setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null)
      if (session?.user) loadProfilo(session.user.id)
      else { setProfilo(null); setAuthLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfilo = async (uid: string) => {
    const { data, error } = await supabase.from('profili').select('*').eq('id', uid).single()
    if (data) { setProfilo(data as any); setAuthLoading(false) }
    else {
      // Primo accesso: crea profilo BASE
      const user = (await supabase.auth.getUser()).data.user
      const newP = { id: uid, nome: user?.user_metadata?.nome || 'Nuovo', cognome: user?.user_metadata?.cognome || 'Utente', ruolo: '', licenza: 'BASE', reparto: '', telefono: '', avatar: '' }
      await supabase.from('profili').insert(newP)
      setProfilo(newP as any)
      setAuthLoading(false)
    }
  }

  const handleLogin = async () => {
    setAuthError('')
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
    if (error) setAuthError(error.message)
  }

  const handleSignup = async () => {
    setAuthError('')
    if (!authNome || !authCognome) { setAuthError('Nome e cognome obbligatori'); return }
    const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { nome: authNome, cognome: authCognome } } })
    if (error) setAuthError(error.message)
    else if (data.user) {
      await supabase.from('profili').insert({ id: data.user.id, nome: authNome, cognome: authCognome, ruolo: '', licenza: 'BASE', reparto: '', telefono: '', avatar: (authNome[0] + authCognome[0]).toUpperCase() })
      setAuthError('Controlla la tua email per confermare la registrazione.')
    }
  }

  const handleLogout = async () => { await supabase.auth.signOut(); setAuthUser(null); setProfilo(null) }

  // ==================== LICENSE CONFIG ====================
  const licenzaConfig: Record<string, { label: string; color: string; icon: string; tabs: string[] }> = {
    TITAN: { label: 'Direzione Generale', color: '#B7950B', icon: '👑', tabs: ['dashboard','commesse','contabilita','magazzino','produzione','clienti','calendario','misure','configuratore','workflow','pratiche','team','rete','marketplace'] },
    VENDITA: { label: 'Commerciale', color: '#196F3D', icon: '🤝', tabs: ['dashboard','commesse','clienti','calendario','misure','configuratore','workflow','pratiche','team'] },
    ADMIN: { label: 'Amministrazione', color: '#1B4F72', icon: '📊', tabs: ['dashboard','commesse','contabilita','clienti','calendario','misure','workflow','pratiche','team','marketplace'] },
    PRODUZIONE: { label: 'Produzione', color: '#6C3483', icon: '🔧', tabs: ['dashboard','commesse','magazzino','produzione','misure','workflow','team'] },
    CANTIERE: { label: 'Cantiere', color: '#E67E22', icon: '🏗️', tabs: ['dashboard','commesse','clienti','calendario','misure','team'] },
    LOGISTICA: { label: 'Logistica', color: '#922B21', icon: '🚚', tabs: ['dashboard','magazzino','team','marketplace'] },
    BASE: { label: 'Servizi Generali', color: '#5D6D7E', icon: '🏢', tabs: ['dashboard','team'] },
  }

  const [devLicenza, setDevLicenza] = useState<string | null>(null)
  const userLicenza = devLicenza || profilo?.licenza || 'BASE'
  const userConfig = licenzaConfig[userLicenza] || licenzaConfig.BASE
  const allowedTabs = userConfig.tabs

  // ==================== LOGIN PAGE ====================


  // ==================== APP STATE ====================
  const [commesse, setCommesse] = useState<(Commessa & { cliente?: Cliente })[]>([])
  const [eventiOggi, setEventiOggi] = useState<Evento[]>([])
  const [fatture, setFatture] = useState<(Fattura & { cliente?: Cliente; commessa?: Commessa })[]>([])
  const [pagamenti, setPagamenti] = useState<(Pagamento & { cliente?: Cliente })[]>([])
  const [scadenze, setScadenze] = useState<(Scadenza & { cliente?: Cliente; commessa?: Commessa })[]>([])
  const [stats, setStats] = useState({ attive: 0, valore: 0, oggi: 0, inbox: 0 })
  const [finStats, setFinStats] = useState({ fatturato: 0, incassato: 0, daIncassare: 0, scadute: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('dashboard')
  const [activeCommessa, setActiveCommessa] = useState<string | null>(null)
  const [contabView, setContabView] = useState<string>('overview')
  const [showNewFattura, setShowNewFattura] = useState(false)
  const [showNewPagamento, setShowNewPagamento] = useState(false)
  const [articoli, setArticoli] = useState<(ArticoloMagazzino & { fornitore?: Fornitore; categoria?: CategoriaMagazzino })[]>([])
  const [movimenti, setMovimenti] = useState<(MovimentoMagazzino & { articolo?: ArticoloMagazzino })[]>([])
  const [fornitori, setFornitori] = useState<Fornitore[]>([])
  const [magView, setMagView] = useState<string>('articoli')
  const [magFilter, setMagFilter] = useState<string>('tutti')
  const [showNewMovimento, setShowNewMovimento] = useState(false)
  const [newMovimento, setNewMovimento] = useState({ articolo_id: '', tipo: 'carico', causale: 'acquisto', quantita: 0, prezzo_unitario: 0, documento_rif: '', note: '' })
  const [fasi, setFasi] = useState<FaseProduzione[]>([])
  const [centriLavoro, setCentriLavoro] = useState<CentroLavoro[]>([])
  const [lavorazioni, setLavorazioni] = useState<(Lavorazione & { fase?: FaseProduzione; centro_lavoro?: CentroLavoro; commessa?: Commessa })[]>([])
  const [dipendenti, setDipendenti] = useState<Dipendente[]>([])
  const [prodView, setProdView] = useState<string>('lavorazioni')
  const [clienti, setClienti] = useState<Cliente[]>([])
  const [commessaFilter, setCommessaFilter] = useState<string>('tutti')
  const [radarSelected, setRadarSelected] = useState<string|null>(null)
  const [clienteFilter, setClienteFilter] = useState<string>('tutti')
  const [selectedCommessa, setSelectedCommessa] = useState<string | null>(null)
  const [showNewCommessa, setShowNewCommessa] = useState(false)
  const [showNewCliente, setShowNewCliente] = useState(false)
  const [newCommessa, setNewCommessa] = useState({ 
    codice: '', 
    titolo: '', 
    cliente_id: '', 
    commessa_originale_id: '', // Per riparazioni/manutenzioni
    stato: 'sopralluogo',
    data_inizio: new Date().toISOString().split('T')[0],
    indirizzo: '', 
    citta: '', 
    valore_preventivo: 0, 
    note: '' 
  })
  const [newCliente, setNewCliente] = useState({ nome: '', cognome: '', telefono: '', email: '', indirizzo: '', citta: '', tipo: 'privato' })
  const [commessaAttivita, setCommessaAttivita] = useState<CommessaAttivita[]>([])
  const [progettoLoading, setProgettoLoading] = useState(false)
  const [expandedFase, setExpandedFase] = useState<string | null>(null)
  const [expandedAttivita, setExpandedAttivita] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<{ id: string; note: string } | null>(null)
  const [phaseChat, setPhaseChat] = useState<string|null>(null)
  const [chatMsg, setChatMsg] = useState('')
  const [chatMessages, setChatMessages] = useState<Record<string, Array<{id:string;user:string;msg:string;time:string;fase:string}>>>({
    sopralluogo: [
      { id: 'c1', user: 'Luigi Ferraro', msg: 'Sopralluogo completato, misurazione preliminare fatta. Il cliente vuole RAL 7016.', time: '10/02 09:30', fase: 'sopralluogo' },
      { id: 'c2', user: 'Fabio Cozza', msg: 'Perfetto, preparo il preventivo con profili Schüco AWS 75. Hai fatto le foto?', time: '10/02 10:15', fase: 'sopralluogo' },
      { id: 'c3', user: 'Luigi Ferraro', msg: 'Sì, caricate nella commessa. Attenzione: muro portante a sinistra, serve controtelaio rinforzato.', time: '10/02 10:22', fase: 'sopralluogo' },
    ],
    preventivo: [
      { id: 'c4', user: 'Fabio Cozza', msg: 'Preventivo inviato al cliente: 8.500€ per 8 finestre + 2 portefinestre. Attendo conferma.', time: '11/02 14:00', fase: 'preventivo' },
    ],
    misure: [
      { id: 'c5', user: 'Luigi Ferraro', msg: 'Misure definitive prese. Differenza di 2cm sulla finestra bagno rispetto al sopralluogo.', time: '13/02 08:45', fase: 'misure' },
      { id: 'c6', user: 'Fabio Cozza', msg: 'Ok, aggiorno il configuratore. Ordine materiali partirà domani.', time: '13/02 09:10', fase: 'misure' },
    ],
  })
  const [calView, setCalView] = useState<string>('settimana')
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calWeekStart, setCalWeekStart] = useState(() => {
    const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff)).toISOString().split('T')[0]
  })
  const [calSelectedDate, setCalSelectedDate] = useState<string | null>(null)
  const [calEventi, setCalEventi] = useState<(Evento & { cliente?: Cliente })[]>([])
  const [showNewEvento, setShowNewEvento] = useState(false)
  const [newEvento, setNewEvento] = useState({ titolo: '', tipo: 'sopralluogo', data: new Date().toISOString().split('T')[0], ora_inizio: '09:00', durata_min: 60, cliente_id: '', commessa_id: '', note: '' })
  
  const [globalSearch, setGlobalSearch] = useState('')
  const [calFilterTipo, setCalFilterTipo] = useState<string[]>([])
  const [calZoom, setCalZoom] = useState(2)
  const [draggedEvento, setDraggedEvento] = useState<any>(null)
  const [draggingEventoOggi, setDraggingEventoOggi] = useState<string | null>(null)
  const [dragStartY, setDragStartY] = useState(0)
  const [dashView, setDashView] = useState<string>('kanban')
  const [ordini, setOrdini] = useState<(OrdineFornitore & { fornitore?: Fornitore; commessa?: Commessa })[]>([])
  const [showNewOrdine, setShowNewOrdine] = useState(false)
  const [newOrdine, setNewOrdine] = useState({ codice: '', fornitore_id: '', commessa_id: '', tipo: 'materiale', descrizione: '', importo_totale: 0, data_ordine: new Date().toISOString().split('T')[0], data_consegna_prevista: '', note: '' })
  const [promemoria, setPromemoria] = useState<(Promemoria & { commessa?: Commessa; cliente?: Cliente })[]>([])
  const [newPromemoriaText, setNewPromemoriaText] = useState('')
  const [newPromemoriaPriorita, setNewPromemoriaPriorita] = useState('normale')
  const [newPromemoriaCommessa, setNewPromemoriaCommessa] = useState('')
  const [showPromemoriaForm, setShowPromemoriaForm] = useState(false)
  const [serramenti, setSerramenti] = useState<Serramento[]>([])
  const [selectedSerramento, setSelectedSerramento] = useState<string | null>(null)
  const [commessaView, setCommessaView] = useState<'progetto' | 'configuratore'>('progetto')
  const [configTab, setConfigTab] = useState<string>('dimensioni')
  
  // FLOW BUILDER
  const [showFlowBuilder, setShowFlowBuilder] = useState(false)
  const [workflows, setWorkflows] = useState<any[]>([])
  const [currentFlow, setCurrentFlow] = useState<any>(null)
  const [flowNodes, setFlowNodes] = useState<any[]>([])
  const [flowConnections, setFlowConnections] = useState<any[]>([])
  
  // MISURE CANTIERE
  const [misureCommesse, setMisureCommesse] = useState<any[]>([])
  const [misuraCommessaId, setMisuraCommessaId] = useState<string|null>(null)
  const [misuraVanoIdx, setMisuraVanoIdx] = useState<number|null>(null)
  const [misureSearch, setMisureSearch] = useState('')
  const [misureVani, setMisureVani] = useState<any[]>([])
  const [misuraData, setMisuraData] = useState<Record<string,any>>({})
  const [misuraAccData, setMisuraAccData] = useState<Record<string,any>>({})
  const [misuraNote, setMisuraNote] = useState('')
  const [misuraAcc, setMisuraAcc] = useState({ cass: false, tapp: false, pers: false, zanz: false })
  const defaultSerramento = {
    posizione: '', ambiente: '', piano: 'PT', tipo: 'finestra',
    larghezza: 1200, altezza: 1400, profondita_muro: 300,
    num_ante: 1, configurazione: '1a-ar', divisione_ante: '',
    ha_traverso: false, altezza_sopraluce: 400, tipo_sopraluce: 'fisso',
    sistema_profilo: '', materiale: 'pvc', larghezza_profilo: 70,
    colore_esterno: '#FFFFFF', colore_interno: '#FFFFFF',
    nome_colore_esterno: 'Bianco', nome_colore_interno: 'Bianco', finitura: 'liscio',
    tipo_vetro: 'doppio', composizione_vetro: '4/16/4',
    vetro_basso_emissivo: true, vetro_temperato: false, vetro_stratificato: false,
    gas_camera: 'argon', ug_valore: 1.1,
    tipo_ferramenta: 'standard', classe_antieffrazione: '', maniglia: 'standard',
    colore_maniglia: '#C0C0C0', posizione_maniglia: 'destra', cerniere: 'standard',
    cassonetto: false, tipo_cassonetto: '', avvolgibile: false, tipo_avvolgibile: '',
    motorizzato: false, zanzariera: false, tipo_zanzariera: '',
    persiana: false, tipo_persiana: '', davanzale_interno: false, davanzale_esterno: false, soglia: '',
  }
  const [newFattura, setNewFattura] = useState({
    cliente_id: '', commessa_id: '', numero: '', tipo: 'fattura', direzione: 'emessa',
    data_emissione: new Date().toISOString().split('T')[0], data_scadenza: '',
    imponibile: 0, aliquota_iva: 10, note: '', metodo_pagamento: 'bonifico'
  })
  const [newPagamento, setNewPagamento] = useState({
    cliente_id: '', commessa_id: '', fattura_id: '', tipo: 'incasso',
    importo: 0, data_pagamento: new Date().toISOString().split('T')[0],
    metodo: 'bonifico', riferimento: '', note: ''
  })
  // ==================== CONFIGURATORE ====================
  const [confTab, setConfTab] = useState<string>('profili')
  const [confProfili, setConfProfili] = useState<{id:string,codice:string,nome:string,tipo:string,larghezza:number,altezza:number,peso:number,costo:number,colori:string[],note:string}[]>([
    {id:'p1',codice:'TF-70',nome:'Telaio Fisso 70',tipo:'telaio',larghezza:70,altezza:70.46,peso:1.85,costo:12.50,colori:['RAL 9010','RAL 7016','RAL 8017'],note:'Profilo telaio fisso standard ID4'},
    {id:'p2',codice:'TM-79',nome:'Telaio Mobile 79',tipo:'anta',larghezza:79,altezza:77.49,peso:2.10,costo:14.80,colori:['RAL 9010','RAL 7016','RAL 8017'],note:'Profilo anta standard ID4'},
  ])
  const [confAccessori, setConfAccessori] = useState<{id:string,codice:string,nome:string,tipo:string,prezzo:number,fornitore:string,note:string}[]>([
    {id:'a1',codice:'CR-001',nome:'Cremonese standard',tipo:'ferramenta',prezzo:18.50,fornitore:'Maico',note:'Cremonese DK standard'},
    {id:'a2',codice:'CN-001',nome:'Cerniera 2D',tipo:'ferramenta',prezzo:8.20,fornitore:'Maico',note:'Cerniera a 2 regolazioni'},
  ])
  const [confKit, setConfKit] = useState<{id:string,nome:string,tipo:string,articoli:{accId:string,qty:number}[],note:string}[]>([
    {id:'k1',nome:'Kit Finestra 1 anta',tipo:'ferramenta',articoli:[{accId:'a1',qty:1},{accId:'a2',qty:2}],note:'Kit base per finestra 1 anta DK'},
  ])
  const [confVetri, setConfVetri] = useState<{id:string,codice:string,nome:string,spessore:number,ug:number,prezzo:number,note:string}[]>([
    {id:'v1',codice:'4-16-4',nome:'Doppio vetro standard',spessore:24,ug:2.7,prezzo:28,note:'Vetrocamera standard'},
    {id:'v2',codice:'4-16Ar-4BE',nome:'Basso emissivo Argon',spessore:24,ug:1.0,prezzo:45,note:'Vetrocamera con Argon e BE'},
    {id:'v3',codice:'4-16Ar-4-16Ar-4BE',nome:'Triplo vetro BE',spessore:44,ug:0.6,prezzo:72,note:'Triplo vetrocamera'},
  ])
  const [showNewProfilo, setShowNewProfilo] = useState(false)
  const [showNewAccessorio, setShowNewAccessorio] = useState(false)
  const [showNewKit, setShowNewKit] = useState(false)
  const [showNewVetro, setShowNewVetro] = useState(false)
  const [newProfilo, setNewProfilo] = useState({codice:'',nome:'',tipo:'telaio',larghezza:0,altezza:0,peso:0,costo:0,colori:'',note:''})
  const [newAccessorio, setNewAccessorio] = useState({codice:'',nome:'',tipo:'ferramenta',prezzo:0,fornitore:'',note:''})
  const [newVetro, setNewVetro] = useState({codice:'',nome:'',spessore:0,ug:0,prezzo:0,note:''})
  const [dashWidgets, setDashWidgets] = useState([
    {id:'kpi',label:'KPI Principali',icon:'chart',size:'full' as string,visible:true},
    {id:'promemoria',label:'Promemoria',icon:'pin',size:'half' as string,visible:true},
    {id:'ordini',label:'Ordini Fornitore',icon:'package',size:'half' as string,visible:true},
    {id:'kanban',label:'Kanban Commesse',icon:'grid',size:'full' as string,visible:true},
    {id:'pipeline',label:'Pipeline',icon:'chart',size:'half' as string,visible:false},
    {id:'eventi_oggi',label:'Eventi Oggi',icon:'calendar',size:'third' as string,visible:false},
    {id:'lavorazioni',label:'Lavorazioni Attive',icon:'wrench',size:'third' as string,visible:false},
    {id:'scadenze',label:'Scadenze',icon:'clock',size:'third' as string,visible:false},
    {id:'interconnessioni',label:'Interconnessioni',icon:'activity',size:'half' as string,visible:false},
  ])
  const [wMenu, setWMenu] = useState<{x:number,y:number,wid:string}|null>(null)
  const [wAddMenu, setWAddMenu] = useState<{x:number,y:number}|null>(null)
  const [kpiSlots, setKpiSlots] = useState(['attive','valore','oggi','fatturato','da_incassare'])
  const [kpiEditing, setKpiEditing] = useState<number|null>(null)
  const [dragComm, setDragComm] = useState<string|null>(null)
  const [dragOver, setDragOver] = useState<string|null>(null)
  const [expandedWidget, setExpandedWidget] = useState<string|null>(null)
  const [dashStyle, setDashStyle] = useState({ radius: 'rounded' as string, density: 'normal' as string, accent: TH.amber, bgTheme: 'default' as string })
  const [savedPresets, setSavedPresets] = useState([
    { name: 'MASTRO Classic', style: { radius: 'rounded', density: 'normal', accent: '#D97706', bgTheme: 'default' } },
    { name: 'Ocean Pro', style: { radius: 'rounded', density: 'normal', accent: '#3B82F6', bgTheme: 'sky' } },
    { name: 'Dark Mode', style: { radius: 'rounded', density: 'normal', accent: '#D97706', bgTheme: 'charcoal' } },
  ])
  const [showGlobalSettings, setShowGlobalSettings] = useState(false)
  const [presetName, setPresetName] = useState('')

  // ═══ GLOBAL THEME COMPUTATION ═══
  const bgThemes: Record<string, { page: string; card: string; input: string; label: string }> = {
    default:  { page: '#F7F8FA', card: '#FFFFFF', input: '#F0F2F5', label: 'Classico' },
    snow:     { page: '#FFFFFF', card: '#F8F9FB', input: '#F0F1F4', label: 'Neve' },
    cream:    { page: '#FDF8F0', card: '#FFFFFF', input: '#F7F0E6', label: 'Crema' },
    slate:    { page: '#E8ECF2', card: '#F4F6FA', input: '#DDE2EB', label: 'Ardesia' },
    mint:     { page: '#ECFDF5', card: '#FFFFFF', input: '#D1FAE5', label: 'Menta' },
    sky:      { page: '#EFF6FF', card: '#FFFFFF', input: '#DBEAFE', label: 'Cielo' },
    lavender: { page: '#F3F0FF', card: '#FFFFFF', input: '#E8E0FF', label: 'Lavanda' },
    rose:     { page: '#FFF1F2', card: '#FFFFFF', input: '#FFE4E6', label: 'Rosa' },
    sand:     { page: '#F5F0EB', card: '#FEFCFA', input: '#EBE3D9', label: 'Sabbia' },
    charcoal: { page: '#1E2028', card: '#282A34', input: '#32343F', label: 'Carbone' },
    midnight: { page: '#0F172A', card: '#1E293B', input: '#273548', label: 'Notte' },
    forest:   { page: '#0C1A14', card: '#142620', input: '#1C3329', label: 'Foresta' },
  }
  const BG = bgThemes[dashStyle.bgTheme] || bgThemes.default
  const isDark = ['charcoal', 'midnight', 'forest'].includes(dashStyle.bgTheme)
  const TX = isDark ? { text: '#F1F5F9', textSec: '#94A3B8', textMuted: '#64748B', border: '#374151', borderMed: '#4B5563', bgHover: '#3F4150' }
    : { text: '#1A1D26', textSec: '#5F6680', textMuted: '#8C92A4', border: '#E8ECF1', borderMed: '#D6DAE1', bgHover: '#E9ECF0' }
  const AC = dashStyle.accent
  const rd = dashStyle.radius === 'sharp' ? '4px' : dashStyle.radius === 'pill' ? '20px' : '12px'
  const gap = dashStyle.density === 'compact' ? 'gap-2' : dashStyle.density === 'spacious' ? 'gap-6' : 'gap-4'
  const pad = dashStyle.density === 'compact' ? 'p-3' : dashStyle.density === 'spacious' ? 'p-6' : 'p-4'

  const savePreset = (name: string) => {
    if (!name.trim()) return
    setSavedPresets(prev => {
      const exists = prev.findIndex(p => p.name === name)
      const entry = { name: name.trim(), style: { ...dashStyle } }
      if (exists >= 0) { const n = [...prev]; n[exists] = entry; return n }
      return [...prev, entry]
    })
    setPresetName('')
  }
  const loadPreset = (p: any) => setDashStyle({ radius: p.style.radius, density: p.style.density, accent: p.style.accent, bgTheme: p.style.bgTheme })
  const deletePreset = (name: string) => setSavedPresets(prev => prev.filter(p => p.name !== name))

  useEffect(() => { loadAll() }, [])

  useEffect(() => {
    if (selectedCommessa) {
      loadCommessaAttivita(selectedCommessa)
      loadSerramenti(selectedCommessa)
      const channel = supabase
        .channel(`attivita-${selectedCommessa}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'commessa_attivita', filter: `commessa_id=eq.${selectedCommessa}` },
          () => { loadCommessaAttivita(selectedCommessa) }
        ).subscribe()
      return () => { supabase.removeChannel(channel) }
    } else {
      setCommessaAttivita([])
      setSerramenti([])
      setSelectedSerramento(null)
      setCommessaView('progetto')
      setExpandedFase(null)
      setExpandedAttivita(null)
    }
  }, [selectedCommessa])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadDashboard(), loadContabilita(), loadMagazzino(), loadProduzione(), loadClienti(), loadOrdini(), loadPromemoria()])
    setLoading(false)
  }

  async function loadDashboard() {
    const { data: commData } = await supabase
      .from('commesse').select('*, cliente:clienti(*)').eq('azienda_id', AZIENDA_ID)
      .neq('stato', 'chiusura').order('updated_at', { ascending: false })
    const oggi = new Date().toISOString().split('T')[0]
    const { data: evData } = await supabase
      .from('eventi').select('*, cliente:clienti(*)').eq('azienda_id', AZIENDA_ID)
      .eq('data', oggi).order('ora_inizio', { ascending: true })
    const { count: inboxCount } = await supabase
      .from('inbox').select('*', { count: 'exact', head: true })
      .eq('azienda_id', AZIENDA_ID).eq('letto', false)
    const comm = (commData || []) as (Commessa & { cliente?: Cliente })[]
    setCommesse(comm)
    setEventiOggi((evData || []) as Evento[])
    setStats({ attive: comm.length, valore: comm.reduce((s, c) => s + (c.valore_preventivo || 0), 0), oggi: (evData || []).length, inbox: inboxCount || 0 })
  }

  async function loadContabilita() {
    const { data: fatData } = await supabase.from('fatture').select('*, cliente:clienti(*), commessa:commesse(*)').eq('azienda_id', AZIENDA_ID).order('data_emissione', { ascending: false })
    const { data: pagData } = await supabase.from('pagamenti').select('*, cliente:clienti(*)').eq('azienda_id', AZIENDA_ID).order('data_pagamento', { ascending: false })
    const { data: scadData } = await supabase.from('scadenze').select('*, cliente:clienti(*), commessa:commesse(*)').eq('azienda_id', AZIENDA_ID).order('data_scadenza', { ascending: true })
    const fat = (fatData || []) as (Fattura & { cliente?: Cliente; commessa?: Commessa })[]
    const pag = (pagData || []) as (Pagamento & { cliente?: Cliente })[]
    const scad = (scadData || []) as (Scadenza & { cliente?: Cliente; commessa?: Commessa })[]
    setFatture(fat); setPagamenti(pag); setScadenze(scad)
    const emesse = fat.filter(f => f.direzione === 'emessa')
    const incassato = pag.filter(p => p.tipo === 'incasso').reduce((s, p) => s + p.importo, 0)
    const oggiStr = new Date().toISOString().split('T')[0]
    const scadute = scad.filter(s => s.stato === 'aperta' && s.data_scadenza < oggiStr)
    setFinStats({ fatturato: emesse.reduce((s, f) => s + f.totale, 0), incassato, daIncassare: emesse.reduce((s, f) => s + f.totale, 0) - incassato, scadute: scadute.reduce((s, sc) => s + sc.importo, 0) })
  }

  async function loadMagazzino() {
    const { data: artData } = await supabase.from('articoli_magazzino').select('*').eq('azienda_id', AZIENDA_ID).order('codice', { ascending: true })
    const { data: movData } = await supabase.from('movimenti_magazzino').select('*, articolo:articoli_magazzino(*)').eq('azienda_id', AZIENDA_ID).order('created_at', { ascending: false }).limit(50)
    const { data: forData } = await supabase.from('fornitori').select('*').eq('azienda_id', AZIENDA_ID).order('ragione_sociale', { ascending: true })
    setArticoli((artData || []) as any[]); setMovimenti((movData || []) as any[]); setFornitori((forData || []) as Fornitore[])
  }

  async function loadProduzione() {
    const { data: fasiData } = await supabase.from('fasi_produzione').select('*').eq('azienda_id', AZIENDA_ID).order('ordine', { ascending: true })
    const { data: centriData } = await supabase.from('centri_lavoro').select('*').eq('azienda_id', AZIENDA_ID)
    const { data: lavData } = await supabase.from('lavorazioni').select('*, fase:fasi_produzione(*), commessa:commesse(*)').eq('azienda_id', AZIENDA_ID).order('created_at', { ascending: false })
    const { data: dipData } = await supabase.from('dipendenti').select('*').eq('azienda_id', AZIENDA_ID).eq('attivo', true)
    setFasi((fasiData || []) as FaseProduzione[]); setCentriLavoro((centriData || []) as CentroLavoro[]); setLavorazioni((lavData || []) as any[]); setDipendenti((dipData || []) as Dipendente[])
  }

  async function updateLavorazioneStato(id: string, nuovoStato: string) {
    const updates: any = { stato: nuovoStato }
    if (nuovoStato === 'in_corso') updates.data_inizio = new Date().toISOString()
    if (nuovoStato === 'completata') updates.data_fine = new Date().toISOString()
    await supabase.from('lavorazioni').update(updates).eq('id', id); await loadProduzione()
  }

  async function loadClienti() {
    const { data } = await supabase.from('clienti').select('*').eq('azienda_id', AZIENDA_ID).order('cognome', { ascending: true })
    setClienti((data || []) as Cliente[])
  }

  async function loadCommessaAttivita(commessaId: string) {
    setProgettoLoading(true)
    const { data, error } = await supabase.from('commessa_attivita').select('*').eq('commessa_id', commessaId).order('macro_fase_ordine', { ascending: true }).order('ordine', { ascending: true })
    if (!error) { setCommessaAttivita((data || []) as CommessaAttivita[]); const firstActive = (data || []).find((a: any) => a.stato !== 'completata'); if (firstActive) setExpandedFase((firstActive as any).macro_fase) }
    setProgettoLoading(false)
  }

  async function updateAttivitaStato(id: string, nuovoStato: string) {
    const updates: any = { stato: nuovoStato }
    if (nuovoStato === 'in_corso') { updates.data_inizio = new Date().toISOString(); updates.percentuale = 10 }
    if (nuovoStato === 'completata') { updates.data_fine = new Date().toISOString(); updates.percentuale = 100 }
    if (nuovoStato === 'da_fare') { updates.percentuale = 0; updates.data_inizio = null; updates.data_fine = null }
    await supabase.from('commessa_attivita').update(updates).eq('id', id)
    if (selectedCommessa) await loadCommessaAttivita(selectedCommessa)
  }

  async function updateAttivitaPercentuale(id: string, perc: number) {
    const updates: any = { percentuale: perc }
    if (perc === 100) { updates.stato = 'completata'; updates.data_fine = new Date().toISOString() }
    else if (perc > 0) { updates.stato = 'in_corso'; const att = commessaAttivita.find(a => a.id === id); if (att && !att.data_inizio) updates.data_inizio = new Date().toISOString() }
    else { updates.stato = 'da_fare' }
    await supabase.from('commessa_attivita').update(updates).eq('id', id)
    if (selectedCommessa) await loadCommessaAttivita(selectedCommessa)
  }

  async function updateAttivitaField(id: string, field: string, value: any) {
    await supabase.from('commessa_attivita').update({ [field]: value }).eq('id', id)
    if (selectedCommessa) await loadCommessaAttivita(selectedCommessa)
  }

  async function saveAttivitaNote(id: string, note: string) {
    await supabase.from('commessa_attivita').update({ note }).eq('id', id)
    setEditingNote(null); if (selectedCommessa) await loadCommessaAttivita(selectedCommessa)
  }

  async function createCommessa() {
    // Genera codice automatico se non fornito
    const codice = newCommessa.codice || `WC-${String(commesse.length + 257).padStart(4, '0')}`
    
    const { error } = await supabase.from('commesse').insert({ 
      azienda_id: AZIENDA_ID, 
      codice, 
      titolo: newCommessa.titolo, 
      cliente_id: newCommessa.cliente_id || null, 
      commessa_originale_id: newCommessa.commessa_originale_id || null,
      stato: newCommessa.stato || 'sopralluogo',
      data_inizio: newCommessa.data_inizio,
      indirizzo: newCommessa.indirizzo, 
      citta: newCommessa.citta, 
      valore_preventivo: newCommessa.valore_preventivo || 0, 
      note: newCommessa.note || null 
    })
    
    if (!error) { 
      setShowNewCommessa(false)
      setNewCommessa({ 
        codice: '', 
        titolo: '', 
        cliente_id: '', 
        commessa_originale_id: '',
        stato: 'sopralluogo',
        data_inizio: new Date().toISOString().split('T')[0],
        indirizzo: '', 
        citta: '', 
        valore_preventivo: 0, 
        note: '' 
      })
      await loadAll()
    }
  }

  async function createCliente() {
    const { error } = await supabase.from('clienti').insert({ azienda_id: AZIENDA_ID, nome: newCliente.nome, cognome: newCliente.cognome, telefono: newCliente.telefono, email: newCliente.email, indirizzo: newCliente.indirizzo, citta: newCliente.citta, tipo: newCliente.tipo })
    if (!error) { setShowNewCliente(false); setNewCliente({ nome: '', cognome: '', telefono: '', email: '', indirizzo: '', citta: '', tipo: 'privato' }); await loadClienti() }
  }

  async function updateCommessaStato(id: string, nuovoStato: string) {
    await supabase.from('commesse').update({ stato: nuovoStato }).eq('id', id); await loadDashboard()
  }

  async function loadCalendario() {
    const d1 = new Date(calYear, calMonth - 1, 1); const d2 = new Date(calYear, calMonth + 2, 1)
    const { data } = await supabase.from('eventi').select('*, cliente:clienti(*), commessa:commesse(*)').eq('azienda_id', AZIENDA_ID).gte('data', d1.toISOString().split('T')[0]).lt('data', d2.toISOString().split('T')[0]).order('ora_inizio', { ascending: true })
    setCalEventi((data || []) as any[])
  }

  useEffect(() => { if (activeTab === 'calendario') loadCalendario() }, [calMonth, calYear, calWeekStart, activeTab])

  // REAL-TIME SYNC - Eventi calendario
  useEffect(() => {
    if (activeTab !== 'calendario') return
    
    const channel = supabase
      .channel('eventi_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'eventi', filter: `azienda_id=eq.${AZIENDA_ID}` },
        (payload) => {
          console.log('📡 Real-time evento:', payload)
          loadCalendario() // Ricarica eventi quando cambiano
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeTab, calMonth, calYear])

  async function loadOrdini() {
    const { data } = await supabase.from('ordini_fornitore').select('*, fornitore:fornitori(*), commessa:commesse(*)').eq('azienda_id', AZIENDA_ID).order('created_at', { ascending: false })
    if (data) setOrdini(data as any[])
  }

  async function createOrdine() {
    const nextNum = ordini.length + 1; const codice = newOrdine.codice || `ORD-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`
    const { error } = await supabase.from('ordini_fornitore').insert({ azienda_id: AZIENDA_ID, codice, stato: 'bozza', tipo: newOrdine.tipo, fornitore_id: newOrdine.fornitore_id || null, commessa_id: newOrdine.commessa_id || null, descrizione: newOrdine.descrizione || null, importo_totale: newOrdine.importo_totale, data_ordine: newOrdine.data_ordine || null, data_consegna_prevista: newOrdine.data_consegna_prevista || null, note: newOrdine.note || null })
    if (!error) { setShowNewOrdine(false); setNewOrdine({ codice: '', fornitore_id: '', commessa_id: '', tipo: 'materiale', descrizione: '', importo_totale: 0, data_ordine: new Date().toISOString().split('T')[0], data_consegna_prevista: '', note: '' }); await loadOrdini() }
  }

  async function updateOrdineStato(id: string, stato: string) {
    const updates: any = { stato }; if (stato === 'consegnato') updates.data_consegna_effettiva = new Date().toISOString().split('T')[0]
    await supabase.from('ordini_fornitore').update(updates).eq('id', id); await loadOrdini()
  }

  async function loadPromemoria() {
    const { data } = await supabase.from('promemoria').select('*, commessa:commesse(*), cliente:clienti(*)').eq('azienda_id', AZIENDA_ID).order('created_at', { ascending: false })
    if (data) setPromemoria(data as any[])
  }

  async function createPromemoria() {
    if (!newPromemoriaText.trim()) return
    const { error } = await supabase.from('promemoria').insert({ azienda_id: AZIENDA_ID, testo: newPromemoriaText.trim(), priorita: newPromemoriaPriorita, stato: 'aperto', commessa_id: newPromemoriaCommessa || null })
    if (!error) { setNewPromemoriaText(''); setNewPromemoriaPriorita('normale'); setNewPromemoriaCommessa(''); setShowPromemoriaForm(false); await loadPromemoria() }
  }

  async function togglePromemoria(id: string, stato: string) {
    const updates: any = { stato: stato === 'aperto' ? 'completato' : 'aperto' }
    if (stato === 'aperto') updates.completato_at = new Date().toISOString(); else updates.completato_at = null
    await supabase.from('promemoria').update(updates).eq('id', id); await loadPromemoria()
  }

  async function deletePromemoria(id: string) { await supabase.from('promemoria').delete().eq('id', id); await loadPromemoria() }

  async function loadSerramenti(commessaId: string) {
    const { data } = await supabase.from('serramenti').select('*').eq('commessa_id', commessaId).order('ordine', { ascending: true })
    if (data) setSerramenti(data as Serramento[])
  }

  async function createSerramento(commessaId: string) {
    const nextOrdine = serramenti.length + 1; const nextPos = `F${nextOrdine}`
    const { data, error } = await supabase.from('serramenti').insert({ azienda_id: AZIENDA_ID, commessa_id: commessaId, posizione: nextPos, ambiente: '', piano: 'PT', tipo: 'finestra', larghezza: 1200, altezza: 1400, profondita_muro: 300, num_ante: 1, configurazione: '1a-ar', materiale: 'pvc', larghezza_profilo: 70, colore_esterno: '#FFFFFF', colore_interno: '#FFFFFF', nome_colore_esterno: 'Bianco', nome_colore_interno: 'Bianco', finitura: 'liscio', tipo_vetro: 'doppio', composizione_vetro: '4/16/4', vetro_basso_emissivo: true, gas_camera: 'argon', ug_valore: 1.1, tipo_ferramenta: 'standard', maniglia: 'standard', colore_maniglia: '#C0C0C0', posizione_maniglia: 'destra', cerniere: 'standard', ordine: nextOrdine }).select().single()
    if (!error && data) { await loadSerramenti(commessaId); setSelectedSerramento(data.id); setConfigTab('dimensioni') }
  }

  async function updateSerramento(id: string, updates: Partial<Serramento>) {
    const curr = serramenti.find(s => s.id === id)
    if (curr) { const l = updates.larghezza ?? curr.larghezza; const h = updates.altezza ?? curr.altezza; (updates as any).superficie_mq = parseFloat(((l * h) / 1000000).toFixed(3)) }
    await supabase.from('serramenti').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    if (selectedCommessa) await loadSerramenti(selectedCommessa)
  }

  async function deleteSerramento(id: string) {
    await supabase.from('serramenti').delete().eq('id', id)
    if (selectedSerramento === id) setSelectedSerramento(null)
    if (selectedCommessa) await loadSerramenti(selectedCommessa)
  }

  async function loadMisureCommesse() {
    const { data: comms } = await supabase.from('commesse').select('*, cliente:clienti(*)').eq('azienda_id', AZIENDA_ID).order('created_at', { ascending: false })
    if (comms) setMisureCommesse(comms)
  }

  async function loadMisureVani(commessaId: string) {
    const { data } = await supabase.from('serramenti').select('*').eq('commessa_id', commessaId).order('ordine', { ascending: true })
    if (data) setMisureVani(data)
  }

  async function saveMisuraVano(serramentoId: string, updates: any) {
    await supabase.from('serramenti').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', serramentoId)
    if (misuraCommessaId) await loadMisureVani(misuraCommessaId)
  }

  async function createEvento(eventoData: any) {
    const { error } = await supabase.from('eventi').insert({ azienda_id: AZIENDA_ID, titolo: eventoData.titolo, tipo: eventoData.tipo, data: eventoData.data, ora_inizio: eventoData.ora_inizio, durata_min: eventoData.durata_min, cliente_id: eventoData.cliente_id || null, commessa_id: eventoData.commessa_id || null, note: eventoData.note || null })
    if (!error) { setShowNewEvento(false); await loadCalendario(); await loadDashboard() }
  }

  async function updateEventoOra(eventoId: string, newOraInizio: string) {
    const { error } = await supabase.from('eventi').update({ ora_inizio: newOraInizio }).eq('id', eventoId)
    if (!error) { await loadCalendario() }
  }

  async function updateEventoData(eventoId: string, newData: string) {
    const { error } = await supabase.from('eventi').update({ data: newData }).eq('id', eventoId)
    if (!error) { await loadCalendario() }
  }

  async function createMovimento() {
    const art = articoli.find(a => a.id === newMovimento.articolo_id)
    const { error } = await supabase.from('movimenti_magazzino').insert({ azienda_id: AZIENDA_ID, articolo_id: newMovimento.articolo_id, tipo: newMovimento.tipo, causale: newMovimento.causale, quantita: newMovimento.quantita, prezzo_unitario: newMovimento.prezzo_unitario || null, documento_rif: newMovimento.documento_rif || null, note: newMovimento.note || null })
    if (!error && art) {
      const delta = newMovimento.tipo === 'carico' ? newMovimento.quantita : -newMovimento.quantita
      await supabase.from('articoli_magazzino').update({ scorta_attuale: art.scorta_attuale + delta }).eq('id', art.id)
      setShowNewMovimento(false); setNewMovimento({ articolo_id: '', tipo: 'carico', causale: 'acquisto', quantita: 0, prezzo_unitario: 0, documento_rif: '', note: '' }); await loadMagazzino()
    }
  }

  async function createFattura() {
    const iva = newFattura.imponibile * (newFattura.aliquota_iva / 100); const totale = newFattura.imponibile + iva
    const { error } = await supabase.from('fatture').insert({ azienda_id: AZIENDA_ID, cliente_id: newFattura.cliente_id || null, commessa_id: newFattura.commessa_id || null, numero: newFattura.numero, tipo: newFattura.tipo, direzione: newFattura.direzione, data_emissione: newFattura.data_emissione, data_scadenza: newFattura.data_scadenza || null, imponibile: newFattura.imponibile, aliquota_iva: newFattura.aliquota_iva, importo_iva: iva, totale, stato: 'emessa', metodo_pagamento: newFattura.metodo_pagamento, note: newFattura.note || null })
    if (!error) { setShowNewFattura(false); setNewFattura({ cliente_id: '', commessa_id: '', numero: '', tipo: 'fattura', direzione: 'emessa', data_emissione: new Date().toISOString().split('T')[0], data_scadenza: '', imponibile: 0, aliquota_iva: 10, note: '', metodo_pagamento: 'bonifico' }); await loadContabilita() }
  }

  async function createPagamento() {
    const { error } = await supabase.from('pagamenti').insert({ azienda_id: AZIENDA_ID, fattura_id: newPagamento.fattura_id || null, commessa_id: newPagamento.commessa_id || null, cliente_id: newPagamento.cliente_id || null, tipo: newPagamento.tipo, importo: newPagamento.importo, data_pagamento: newPagamento.data_pagamento, metodo: newPagamento.metodo, riferimento: newPagamento.riferimento || null, note: newPagamento.note || null })
    if (!error) { setShowNewPagamento(false); setNewPagamento({ cliente_id: '', commessa_id: '', fattura_id: '', tipo: 'incasso', importo: 0, data_pagamento: new Date().toISOString().split('T')[0], metodo: 'bonifico', riferimento: '', note: '' }); await loadContabilita() }
  }

  // SVG Renderer for serramento preview (adjusted for light theme)
  function renderSerramentoSVG(s: Partial<Serramento>, svgW = 360, svgH = 420) {
    const L = s.larghezza || 1200; const H = s.altezza || 1400
    const scale = Math.min((svgW - 80) / L, (svgH - 80) / H)
    const w = L * scale; const h = H * scale
    const ox = (svgW - w) / 2; const oy = (svgH - h) / 2 + 10
    const tf = Math.max((s.larghezza_profilo || 70) * scale, 6)
    const sf = Math.max(tf * 0.7, 4)
    const colEst = s.colore_esterno || '#FFFFFF'
    const colFrame = s.materiale === 'alluminio' ? '#B0B0B0' : s.materiale === 'legno' ? '#A0522D' : s.materiale === 'legno_alluminio' ? '#8B7355' : colEst
    const colFrameDark = s.materiale === 'alluminio' ? '#888' : s.materiale === 'legno' ? '#6B3410' : '#D0D0D0'
    const config = s.configurazione || '1a-ar'; const panels = config.split('+')
    const numP = panels.length
    const divs = s.divisione_ante ? s.divisione_ante.split(',').map(Number) : panels.map(() => 100 / numP)
    const hasTrav = s.ha_traverso || false; const travH = hasTrav ? (s.altezza_sopraluce || 400) * scale : 0
    const glassColor = s.tipo_vetro === 'triplo' ? 'rgba(180,210,235,0.45)' : 'rgba(190,220,245,0.35)'
    const glassReflect = 'rgba(255,255,255,0.3)'
    let svgContent = ''
    svgContent += `<rect x="0" y="0" width="${svgW}" height="${svgH}" fill="#F0F2F5" rx="8"/>`
    svgContent += `<rect x="${ox - 2}" y="${oy - 2}" width="${w + 4}" height="${h + 4}" rx="2" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="2"/>`
    svgContent += `<rect x="${ox}" y="${oy}" width="${w}" height="${h}" rx="1" fill="${colFrame}" stroke="${colFrameDark}" stroke-width="1.5"/>`
    svgContent += `<rect x="${ox + tf}" y="${oy + tf}" width="${w - tf * 2}" height="${h - tf * 2}" fill="#E8ECF1" />`
    if (hasTrav) { svgContent += `<rect x="${ox + tf}" y="${oy + h - tf - travH}" width="${w - tf * 2}" height="${tf * 0.6}" fill="${colFrame}" stroke="${colFrameDark}" stroke-width="0.5"/>` }
    let panelX = ox + tf; const panelY = oy + tf; const totalPanelW = w - tf * 2; const mainH = hasTrav ? h - tf * 2 - travH - tf * 0.3 : h - tf * 2
    panels.forEach((panel, i) => {
      const pct = divs[i] / 100; const pw = totalPanelW * pct - (numP > 1 && i < numP - 1 ? tf * 0.3 : 0)
      const parts = panel.trim().split('-'); const panelType = parts[0]; const apertura = parts[1] || 'ar'; const isFisso = panelType.includes('f')
      if (!isFisso) {
        svgContent += `<rect x="${panelX + 1}" y="${panelY + 1}" width="${pw - 2}" height="${mainH - 2}" rx="0.5" fill="${colFrame}" stroke="${colFrameDark}" stroke-width="0.8"/>`
        svgContent += `<rect x="${panelX + sf + 1}" y="${panelY + sf + 1}" width="${pw - sf * 2 - 2}" height="${mainH - sf * 2 - 2}" fill="${glassColor}" stroke="rgba(100,130,160,0.3)" stroke-width="0.5"/>`
        const gx = panelX + sf + 4; const gy = panelY + sf + 4; const gw = (pw - sf * 2 - 10) * 0.4; const gh = (mainH - sf * 2 - 10) * 0.6
        svgContent += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="1" fill="${glassReflect}" opacity="0.5"/>`
      } else {
        svgContent += `<rect x="${panelX + 1}" y="${panelY + 1}" width="${pw - 2}" height="${mainH - 2}" fill="${glassColor}" stroke="rgba(100,130,160,0.3)" stroke-width="0.5"/>`
        svgContent += `<rect x="${panelX + 5}" y="${panelY + 5}" width="${(pw - 12) * 0.35}" height="${(mainH - 12) * 0.5}" rx="1" fill="${glassReflect}" opacity="0.4"/>`
        svgContent += `<line x1="${panelX + pw * 0.3}" y1="${panelY + mainH * 0.3}" x2="${panelX + pw * 0.7}" y2="${panelY + mainH * 0.7}" stroke="rgba(100,130,160,0.4)" stroke-width="0.8"/>`
        svgContent += `<line x1="${panelX + pw * 0.7}" y1="${panelY + mainH * 0.3}" x2="${panelX + pw * 0.3}" y2="${panelY + mainH * 0.7}" stroke="rgba(100,130,160,0.4)" stroke-width="0.8"/>`
      }
      if (!isFisso) {
        if (apertura === 'ar' || apertura === 'b') {
          const hingeX = s.posizione_maniglia === 'sinistra' ? panelX + pw - sf : panelX + sf
          const handleX = s.posizione_maniglia === 'sinistra' ? panelX + sf : panelX + pw - sf
          svgContent += `<polygon points="${hingeX},${panelY + sf + 2} ${hingeX},${panelY + mainH - sf - 2} ${handleX},${panelY + mainH / 2}" fill="none" stroke="rgba(60,100,160,0.5)" stroke-width="1" stroke-dasharray="4,2"/>`
          if (apertura === 'ar') { const cx = panelX + pw / 2; svgContent += `<polygon points="${panelX + sf + 2},${panelY + mainH - sf} ${panelX + pw - sf - 2},${panelY + mainH - sf} ${cx},${panelY + sf + 2}" fill="none" stroke="rgba(60,160,100,0.4)" stroke-width="0.8" stroke-dasharray="3,2"/>` }
        } else if (apertura === 'v') { const cx = panelX + pw / 2; svgContent += `<polygon points="${panelX + sf + 2},${panelY + mainH - sf} ${panelX + pw - sf - 2},${panelY + mainH - sf} ${cx},${panelY + sf + 4}" fill="none" stroke="rgba(60,100,160,0.5)" stroke-width="1" stroke-dasharray="4,2"/>` }
        else if (apertura === 's') { const cx = panelX + pw / 2; const cy = panelY + mainH / 2; const symW = pw * 0.35; svgContent += `<line x1="${cx - symW}" y1="${cy}" x2="${cx + symW}" y2="${cy}" stroke="rgba(60,100,160,0.5)" stroke-width="1.5"/>`; svgContent += `<polygon points="${cx + symW},${cy} ${cx + symW - 8},${cy - 5} ${cx + symW - 8},${cy + 5}" fill="rgba(60,100,160,0.5)"/>` }
        if (apertura !== 's' && apertura !== 'v') {
          const hx = s.posizione_maniglia === 'sinistra' ? panelX + sf + 3 : panelX + pw - sf - 3; const hy = panelY + mainH / 2
          svgContent += `<rect x="${hx - 1.5}" y="${hy - 12}" width="3" height="24" rx="1.5" fill="${s.colore_maniglia || '#C0C0C0'}" stroke="rgba(0,0,0,0.3)" stroke-width="0.5"/>`
          svgContent += `<rect x="${hx - 2.5}" y="${hy - 2}" width="5" height="4" rx="1" fill="${s.colore_maniglia || '#C0C0C0'}"/>`
        }
      }
      if (i < numP - 1) { panelX += pw; svgContent += `<rect x="${panelX}" y="${panelY}" width="${tf * 0.3}" height="${mainH}" fill="${colFrame}" stroke="${colFrameDark}" stroke-width="0.3"/>`; panelX += tf * 0.3 }
    })
    if (hasTrav) { const slY = oy + h - tf - travH + tf * 0.3; const slH = travH - tf * 0.3; svgContent += `<rect x="${ox + tf + 1}" y="${slY + 1}" width="${totalPanelW - 2}" height="${slH - 2}" fill="${glassColor}" stroke="rgba(100,130,160,0.3)" stroke-width="0.5"/>` }
    const dimStyle = `fill: ${TH.blue}; font-size: 10px; font-family: monospace; text-anchor: middle;`
    svgContent += `<line x1="${ox}" y1="${oy + h + 15}" x2="${ox + w}" y2="${oy + h + 15}" stroke="${TH.blue}" stroke-width="0.8"/>`
    svgContent += `<line x1="${ox}" y1="${oy + h + 10}" x2="${ox}" y2="${oy + h + 20}" stroke="${TH.blue}" stroke-width="0.8"/>`
    svgContent += `<line x1="${ox + w}" y1="${oy + h + 10}" x2="${ox + w}" y2="${oy + h + 20}" stroke="${TH.blue}" stroke-width="0.8"/>`
    svgContent += `<text x="${ox + w / 2}" y="${oy + h + 28}" style="${dimStyle}">${L} mm</text>`
    svgContent += `<line x1="${ox + w + 15}" y1="${oy}" x2="${ox + w + 15}" y2="${oy + h}" stroke="${TH.blue}" stroke-width="0.8"/>`
    svgContent += `<line x1="${ox + w + 10}" y1="${oy}" x2="${ox + w + 20}" y2="${oy}" stroke="${TH.blue}" stroke-width="0.8"/>`
    svgContent += `<line x1="${ox + w + 10}" y1="${oy + h}" x2="${ox + w + 20}" y2="${oy + h}" stroke="${TH.blue}" stroke-width="0.8"/>`
    svgContent += `<text x="${ox + w + 30}" y="${oy + h / 2 + 4}" style="${dimStyle}" transform="rotate(-90 ${ox + w + 30} ${oy + h / 2})">${H} mm</text>`
    return `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`
  }

  const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
  const fmtDec = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n)
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'
  const getStato = (stato: string) => STATI_COMMESSA.find(s => s.value === stato) || STATI_COMMESSA[0]
  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const oggiISO = new Date().toISOString().split('T')[0]


  // === AUTH GUARD ===
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: -2 }}>MASTRO</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>Caricamento...</div>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ width: 420, padding: 0 }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #f59e0b, #d97706)', marginBottom: 16, boxShadow: '0 8px 32px rgba(245,158,11,0.25)' }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>M</span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: -1.5, margin: 0 }}>MASTRO</h1>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Il Sistema Operativo del Serramentista</p>
          </div>

          {/* Card */}
          <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', padding: 32, boxShadow: '0 12px 48px rgba(0,0,0,0.4)' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: '#0f172a', borderRadius: 10, padding: 4 }}>
              {(['login', 'signup'] as const).map(v => (
                <button key={v} onClick={() => { setAuthView(v); setAuthError('') }}
                  style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    background: authView === v ? '#334155' : 'transparent', color: authView === v ? '#fff' : '#64748b' }}>
                  {v === 'login' ? 'Accedi' : 'Registrati'}
                </button>
              ))}
            </div>

            {/* Signup fields */}
            {authView === 'signup' && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Nome</label>
                  <input value={authNome} onChange={e => setAuthNome(e.target.value)} placeholder="Mario"
                    style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Cognome</label>
                  <input value={authCognome} onChange={e => setAuthCognome(e.target.value)} placeholder="Rossi"
                    style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</label>
              <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} type="email" placeholder="nome@azienda.it"
                style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Password</label>
              <input value={authPassword} onChange={e => setAuthPassword(e.target.value)} type="password" placeholder="••••••••"
                onKeyDown={e => { if (e.key === 'Enter') authView === 'login' ? handleLogin() : handleSignup() }}
                style={{ width: '100%', padding: '12px 14px', background: '#0f172a', border: '1px solid #334155', borderRadius: 10, color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Error */}
            {authError && (
              <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 10, background: authError.includes('email') && authView === 'signup' ? '#064e3b' : '#7f1d1d',
                border: `1px solid ${authError.includes('email') && authView === 'signup' ? '#065f46' : '#991b1b'}`, fontSize: 12, color: authError.includes('email') && authView === 'signup' ? '#6ee7b7' : '#fca5a5' }}>
                {authError}
              </div>
            )}

            {/* Button */}
            <button onClick={authView === 'login' ? handleLogin : handleSignup}
              style={{ width: '100%', padding: '14px 0', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5, boxShadow: '0 4px 16px rgba(245,158,11,0.3)' }}>
              {authView === 'login' ? 'Accedi a MASTRO' : 'Crea Account'}
            </button>
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', fontSize: 11, color: '#475569', marginTop: 24 }}>
            Walter Cozza Serramenti SRL · MASTRO ERP v1.0
          </p>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: BG.page }}>
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-extrabold mx-auto mb-3 animate-pulse" style={{ background: 'linear-gradient(135deg, #D97706, #7C3AED)', color: '#fff' }}>M</div>
        <p style={{ color: TX.textMuted, fontSize: 14 }}>Caricamento...</p>
      </div>
    </div>
  )

  // ==================== SHARED COMPONENTS (Light Theme) ====================
  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-2xl p-5 ${className}`} style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>{children}</div>
  )

  const Badge = ({ text, color }: { text: string; color: string }) => (
    <span className="px-2 py-0.5 rounded-md" style={{ background: color + '15', color, fontSize: 10, fontWeight: 600 }}>{text}</span>
  )

  // Tab button helper
  const TabBtn = ({ active, onClick, label, count, color = TH.blue }: { active: boolean; onClick: () => void; label: string; count?: number; color?: string }) => (
    <button onClick={onClick} className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
      style={{ background: active ? color + '10' : BG.card, color: active ? color : TX.textSec, border: `1px solid ${active ? color + '30' : TX.border}` }}>
      {label} {count !== undefined && <span style={{ fontFamily: 'monospace', marginLeft: 4 }}>{count}</span>}
    </button>
  )

  // ==================== MOBILE LAYOUT (Light) ====================
  const MobileLayout = () => (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto lg:hidden" style={{ background: BG.page, color: TX.text }}>
      <header className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #D97706, #7C3AED)', color: '#fff' }}>M</div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">MASTRO</h1>
              <p style={{ fontSize: 10, color: TX.textMuted, letterSpacing: 1.5, textTransform: 'uppercase' as const }}>Walter Cozza Serramenti</p>
            </div>
          </div>
          <button className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}><Ic n="bell" s={16} c={TX.textSec}/></button>
        </div>
      </header>
      <div className="px-5 py-3 grid grid-cols-4 gap-2">
        {[
          { label: 'Commesse', value: stats.attive, icon: 'clipboard', bg: TH.blue + '08' },
          { label: 'Valore', value: fmt(stats.valore), icon: 'dollar', bg: TH.green + '08' },
          { label: 'Oggi', value: stats.oggi, icon: 'calendar', bg: TH.amber + '08' },
          { label: 'Inbox', value: stats.inbox, icon: 'inbox', bg: TH.pink + '08' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl p-2.5 text-center" style={{ background: s.bg, border: `1px solid ${TX.border}` }}>
            <Ic n={s.icon} s={18} c={TX.textSec}/>
            <div className="font-bold mt-0.5" style={{ fontSize: s.label === 'Valore' ? 11 : 14, color: TX.text }}>{s.value}</div>
            <div style={{ fontSize: 8, color: TX.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className="px-5 py-2 flex-1">
        <div className="flex items-center justify-between mb-2">
          <h2 style={{ fontSize: 11, fontWeight: 600, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1.5 }}>Commesse attive</h2>
          <button style={{ fontSize: 10, color: TH.amber, fontWeight: 600 }}>+ Nuova</button>
        </div>
        <div className="space-y-2">{commesse.map(c => <CommessaCard key={c.id} c={c} />)}</div>
      </div>
      <nav className="sticky bottom-0 px-4 py-2" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${TX.border}` }}>
        <div className="flex justify-around">
          {[
            { id: 'home', icon: 'home', label: 'Home' },
            { id: 'contabilita', icon: 'dollar', label: 'Contabilità' },
            { id: 'misure', icon: 'ruler', label: 'Misure' },
            { id: 'cattura', icon: 'mic', label: 'Cattura' },
            { id: 'altro', icon: 'settings', label: 'Altro' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex flex-col items-center gap-0.5 min-w-[48px]">
              <Ic n={tab.icon} s={18} c={activeTab === tab.id ? TH.amber : TX.textMuted}/>
              <span style={{ fontSize: 9, fontWeight: 600, color: activeTab === tab.id ? TH.amber : TX.textMuted }}>{tab.label}</span>
              {activeTab === tab.id && <div className="w-4 h-0.5 rounded-full" style={{ background: TH.amber }} />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )

  // ==================== COMMESSA CARD (Light) ====================
  // ═══ ENHANCED PIPELINE BAR ═══
  const PipelineBar = ({ stato, size = 'sm', onPhaseClick }: { stato: string; size?: 'sm' | 'md' | 'lg'; onPhaseClick?: (fase: string) => void }) => {
    const currentIdx = STATI_COMMESSA.findIndex(s => s.value === stato)
    const si = getStato(stato)
    const h = size === 'lg' ? 14 : size === 'md' ? 10 : 6
    const showLabels = size !== 'sm'
    return (
      <div>
        <div className="flex gap-1" style={{ position: 'relative' }}>
          {STATI_COMMESSA.map((s, i) => {
            const isPast = i < currentIdx
            const isCurrent = i === currentIdx
            const isFuture = i > currentIdx
            const msgs = chatMessages[s.value] || []
            return (
              <div key={s.value} className="flex-1" style={{ cursor: onPhaseClick ? 'pointer' : 'default' }}
                onClick={() => onPhaseClick?.(s.value)}>
                <div style={{ height: h, borderRadius: h / 2, position: 'relative', overflow: 'hidden',
                  background: isPast ? TH.green : isCurrent ? si.color : TX.bgHover,
                  opacity: isFuture ? 0.4 : 1, transition: 'all 0.3s' }}>
                  {isCurrent && <div style={{ position: 'absolute', inset: 0, borderRadius: h / 2,
                    boxShadow: `0 0 ${size === 'sm' ? 4 : 8}px ${si.color}60`,
                    background: `linear-gradient(90deg, ${si.color}, ${si.color}CC)` }} />}
                </div>
                {showLabels && (
                  <div className="mt-1 text-center" style={{ position: 'relative' }}>
                    <div style={{ fontSize: size === 'lg' ? 9 : 7, fontWeight: isCurrent ? 800 : isPast ? 600 : 400,
                      color: isPast ? TH.green : isCurrent ? si.color : TX.textMuted, lineHeight: 1.2 }}>
                      {isPast ? '✓' : isCurrent ? '▶' : ''} {s.label}
                    </div>
                    {msgs.length > 0 && size === 'lg' && (
                      <div style={{ fontSize: 7, color: isCurrent ? si.color : TX.textMuted }}>💬 {msgs.length}</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {!showLabels && (
          <div className="flex items-center justify-between mt-1">
            <span style={{ fontSize: 8, fontWeight: 700, color: si.color }}>▶ {si.label}</span>
            <span style={{ fontSize: 8, color: TX.textMuted }}>{currentIdx + 1}/{STATI_COMMESSA.length}</span>
          </div>
        )}
      </div>
    )
  }

  const CommessaCard = ({ c }: { c: Commessa & { cliente?: Cliente } }) => {
    const si = getStato(c.stato)
    return (
      <div className={`rounded-xl p-3 cursor-pointer transition-all ${activeCommessa === c.id ? 'ring-1' : ''}`}
        style={{ background: BG.card, border: `1px solid ${activeCommessa === c.id ? si.color : TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}
        onClick={() => setActiveCommessa(activeCommessa === c.id ? null : c.id)}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: TX.textMuted }}>{c.codice}</span>
            <span className="text-sm font-semibold" style={{ color: TX.text }}>{c.titolo}</span>
          </div>
          <Badge text={`${si.icon} ${si.label}`} color={si.color} />
        </div>
        <div className="flex items-center justify-between mb-1.5" style={{ fontSize: 10, color: TX.textSec }}>
          <span>{c.cliente?.nome} {c.cliente?.cognome}</span>
          {c.valore_preventivo > 0 && <span style={{ fontFamily: 'monospace', fontWeight: 600, color: TH.green }}>{fmt(c.valore_preventivo)}</span>}
        </div>
        <PipelineBar stato={c.stato} size="sm" />
      </div>
    )
  }

  // ==================== COMMESSE CONTENT (Light) ====================
  const CommesseContent = () => {
    if (selectedCommessa) {
      const comm = commesse.find(c => c.id === selectedCommessa)
      if (!comm) return null
      const si = getStato(comm.stato)
      return (
        <div>
          <button onClick={() => setSelectedCommessa(null)} className="flex items-center gap-1 mb-4 text-sm" style={{ color: TX.textSec, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Ic n="arrowLeft" s={14}/> Torna alla lista
          </button>
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: si.color + '12', color: si.color }}><Ic n="clipboard" s={18}/></div>
                <div>
                  <div className="flex items-center gap-2"><span style={{ fontSize: 11, fontFamily: 'monospace', color: TH.amber, fontWeight: 700 }}>{comm.codice}</span><Badge text={si.label} color={si.color} /></div>
                  <h3 className="text-lg font-bold" style={{ color: TX.text }}>{comm.titolo}</h3>
                </div>
              </div>
              {comm.valore_preventivo > 0 && <div style={{ textAlign: 'right' as const }}><div style={{ fontSize: 9, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1 }}>VALORE</div><div className="text-lg font-bold" style={{ fontFamily: 'monospace', color: TH.green }}>{fmt(comm.valore_preventivo)}</div></div>}
            </div>
            <div className="flex items-center gap-4" style={{ fontSize: 11, color: TX.textSec }}>
              <span><Ic n="user" s={11}/> {comm.cliente?.nome} {comm.cliente?.cognome}</span>
              {comm.citta && <span><Ic n="pin" s={11}/> {comm.citta}</span>}
              {comm.indirizzo && <span>{comm.indirizzo}</span>}
            </div>
            <div className="mt-3"><PipelineBar stato={comm.stato} size="md" onPhaseClick={(fase) => setPhaseChat(phaseChat === fase ? null : fase)} /></div>
          </Card>
          <VistaProgetto />
        </div>
      )
    }

    const filtered = commesse.filter(c => commessaFilter === 'tutti' || c.stato === commessaFilter)
    return (
      <div>
        {/* Pulsante Nuova Commessa in alto a destra */}
        <div className="flex justify-end mb-3">
          <button 
            onClick={() => setShowNewCommessa(true)} 
            className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{ background: TH.green, color: '#fff' }}>
            <Ic n="plus" s={16}/>
            Nuova Commessa
          </button>
        </div>

        {/* Filtri stati commessa */}
        <div className="mb-4">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: BG.input, display: 'inline-flex' }}>
            <button onClick={() => setCommessaFilter('tutti')} className="px-3 py-1.5 rounded-md text-xs font-semibold"
              style={{ background: commessaFilter === 'tutti' ? BG.card : 'transparent', color: commessaFilter === 'tutti' ? TX.text : TX.textMuted, border: 'none', cursor: 'pointer', boxShadow: commessaFilter === 'tutti' ? isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow : 'none' }}>
              Tutte ({commesse.length})
            </button>
            {STATI_COMMESSA.map(s => {
              const count = commesse.filter(c => c.stato === s.value).length
              if (count === 0) return null
              return (
                <button key={s.value} onClick={() => setCommessaFilter(s.value)} className="px-3 py-1.5 rounded-md text-xs font-semibold"
                  style={{ background: commessaFilter === s.value ? s.color + '10' : 'transparent', color: commessaFilter === s.value ? s.color : TX.textMuted, border: 'none', cursor: 'pointer' }}>
                  {s.label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* ═══ DIALOG NUOVA COMMESSA ═══ */}
        {showNewCommessa && (
          <div 
            key="dialog-new-commessa"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowNewCommessa(false)}>
            <div 
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="rounded-xl p-6" 
              style={{ background: BG.card, width: 600, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${TX.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: TH.green + '15' }}>
                    <Ic n="plus" s={24} c={TH.green}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: TX.text }}>Nuova Commessa</h3>
                    <p style={{ fontSize: 11, color: TX.textMuted }}>Crea una nuova commessa nel sistema</p>
                  </div>
                </div>
                <button onClick={() => setShowNewCommessa(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TX.textMuted }}>
                  <Ic n="x" s={20}/>
                </button>
              </div>

              <div className="space-y-4">
                {/* Riga 1: Codice + Titolo */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Codice <span style={{ color: TX.textMuted }}>(opzionale)</span>
                    </label>
                    <input
                      type="text"
                      value={newCommessa.codice}
                      onChange={(e) => setNewCommessa(prev => ({ ...prev, codice: e.target.value }))}
                      placeholder="es. WC-0100"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text, fontFamily: 'monospace' }}
                    />
                    <p style={{ fontSize: 10, color: TX.textMuted, marginTop: 4 }}>Se vuoto, viene generato automaticamente</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Titolo * <span style={{ color: '#ff4444' }}>richiesto</span>
                    </label>
                    <input
                      type="text"
                      value={newCommessa.titolo}
                      onChange={(e) => setNewCommessa(prev => ({ ...prev, titolo: e.target.value }))}
                      placeholder="es. Sostituzione infissi Villa Rende"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                    />
                  </div>
                </div>

                {/* Riga 2: Cliente + Data Inizio */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Cliente
                    </label>
                    <select
                      value={newCommessa.cliente_id}
                      onChange={(e) => setNewCommessa(prev => ({ ...prev, cliente_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}>
                      <option value="">Seleziona cliente...</option>
                      {clienti.map(c => (
                        <option key={c.id} value={c.id}>{c.nome} {c.cognome}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => { setShowNewCommessa(false); setShowNewCliente(true) }}
                      style={{ fontSize: 10, color: TH.blue, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                      + Crea nuovo cliente
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Data Inizio
                    </label>
                    <input
                      type="date"
                      value={newCommessa.data_inizio}
                      onChange={(e) => setNewCommessa(prev => ({ ...prev, data_inizio: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                    />
                  </div>
                </div>

                {/* Riga 3: Indirizzo + Città */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Indirizzo
                    </label>
                    <input
                      type="text"
                      value={newCommessa.indirizzo}
                      onChange={(e) => setNewCommessa(prev => ({ ...prev, indirizzo: e.target.value }))}
                      placeholder="es. Via Roma 123"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Città
                    </label>
                    <input
                      type="text"
                      value={newCommessa.citta}
                      onChange={(e) => setNewCommessa(prev => ({ ...prev, citta: e.target.value }))}
                      placeholder="es. Cosenza"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                    />
                  </div>
                </div>

                {/* Riga 3.5: Commessa Originale (per riparazioni/manutenzioni) */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                    Commessa Originale <span style={{ fontSize: 9, color: TX.textMuted }}>(opzionale - per riparazioni)</span>
                  </label>
                  <select
                    value={newCommessa.commessa_originale_id}
                    onChange={(e) => setNewCommessa(prev => ({ ...prev, commessa_originale_id: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}>
                    <option value="">Nessuna (nuova commessa)</option>
                    {commesse.map(c => (
                      <option key={c.id} value={c.id}>{c.codice} - {c.titolo}</option>
                    ))}
                  </select>
                  <p style={{ fontSize: 10, color: TX.textMuted, marginTop: 4 }}>
                    Se è una riparazione/manutenzione, collega alla commessa originale per tracciare lo storico
                  </p>
                </div>

                {/* Riga 4: Valore + Stato */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Valore Preventivo (€)
                    </label>
                    <input
                      type="number"
                      value={newCommessa.valore_preventivo}
                      onChange={(e) => setNewCommessa(prev => ({ ...prev, valore_preventivo: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text, fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Stato Iniziale
                    </label>
                    <select
                      value={newCommessa.stato}
                      onChange={(e) => setNewCommessa(prev => ({ ...prev, stato: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}>
                      {STATI_COMMESSA.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Riga 5: Note */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                    Note
                  </label>
                  <textarea
                    value={newCommessa.note}
                    onChange={(e) => setNewCommessa(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Note aggiuntive sulla commessa..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                  />
                </div>
              </div>

              {/* Pulsanti azione */}
              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => {
                    setShowNewCommessa(false)
                    setNewCommessa({ 
                      codice: '', 
                      titolo: '', 
                      cliente_id: '', 
                      commessa_originale_id: '',
                      stato: 'sopralluogo',
                      data_inizio: new Date().toISOString().split('T')[0],
                      indirizzo: '', 
                      citta: '', 
                      valore_preventivo: 0, 
                      note: '' 
                    })
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: BG.input, color: TX.text, border: `1px solid ${TX.border}` }}>
                  Annulla
                </button>
                <button 
                  onClick={createCommessa}
                  disabled={!newCommessa.titolo.trim()}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ 
                    background: newCommessa.titolo.trim() ? TH.green : TX.border, 
                    color: '#fff',
                    opacity: newCommessa.titolo.trim() ? 1 : 0.5,
                    cursor: newCommessa.titolo.trim() ? 'pointer' : 'not-allowed'
                  }}>
                  <Ic n="check" s={16}/>
                  Crea Commessa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ DIALOG NUOVO CLIENTE ═══ */}
        {showNewCliente && (
          <div 
            key="dialog-new-cliente"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowNewCliente(false)}>
            <div 
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className="rounded-xl p-6" 
              style={{ background: BG.card, width: 500, maxHeight: '90vh', overflowY: 'auto', border: `1px solid ${TX.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: TH.blue + '15' }}>
                    <Ic n="user" s={24} c={TH.blue}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: TX.text }}>Nuovo Cliente</h3>
                    <p style={{ fontSize: 11, color: TX.textMuted }}>Aggiungi un nuovo cliente all'anagrafica</p>
                  </div>
                </div>
                <button onClick={() => setShowNewCliente(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: TX.textMuted }}>
                  <Ic n="x" s={20}/>
                </button>
              </div>

              <div className="space-y-4">
                {/* Riga 1: Nome + Cognome */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Nome * <span style={{ color: '#ff4444' }}>richiesto</span>
                    </label>
                    <input
                      type="text"
                      value={newCliente.nome}
                      onChange={(e) => setNewCliente(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="es. Mario"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Cognome * <span style={{ color: '#ff4444' }}>richiesto</span>
                    </label>
                    <input
                      type="text"
                      value={newCliente.cognome}
                      onChange={(e) => setNewCliente(prev => ({ ...prev, cognome: e.target.value }))}
                      placeholder="es. Rossi"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                    />
                  </div>
                </div>

                {/* Riga 2: Telefono + Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Telefono
                    </label>
                    <input
                      type="tel"
                      value={newCliente.telefono}
                      onChange={(e) => setNewCliente(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="es. 328 1234567"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={newCliente.email}
                      onChange={(e) => setNewCliente(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="es. mario@email.it"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                    />
                  </div>
                </div>

                {/* Riga 3: Tipo Cliente */}
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                    Tipo Cliente
                  </label>
                  <div className="flex gap-2">
                    {['privato', 'azienda', 'ente'].map(tipo => (
                      <button
                        key={tipo}
                        onClick={() => setNewCliente(prev => ({ ...prev, tipo }))}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold capitalize"
                        style={{ 
                          background: newCliente.tipo === tipo ? TH.blue + '15' : BG.input,
                          color: newCliente.tipo === tipo ? TH.blue : TX.text,
                          border: `1px solid ${newCliente.tipo === tipo ? TH.blue + '50' : TX.border}`
                        }}>
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Riga 4: Indirizzo + Città */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Indirizzo
                    </label>
                    <input
                      type="text"
                      value={newCliente.indirizzo}
                      onChange={(e) => setNewCliente(prev => ({ ...prev, indirizzo: e.target.value }))}
                      placeholder="es. Via Roma 123"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                      Città
                    </label>
                    <input
                      type="text"
                      value={newCliente.citta}
                      onChange={(e) => setNewCliente(prev => ({ ...prev, citta: e.target.value }))}
                      placeholder="es. Cosenza"
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                    />
                  </div>
                </div>
              </div>

              {/* Pulsanti azione */}
              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => {
                    setShowNewCliente(false)
                    setNewCliente({ nome: '', cognome: '', telefono: '', email: '', indirizzo: '', citta: '', tipo: 'privato' })
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: BG.input, color: TX.text, border: `1px solid ${TX.border}` }}>
                  Annulla
                </button>
                <button 
                  onClick={async () => {
                    await createCliente()
                    // Riapri il form commessa con il nuovo cliente selezionato
                    setShowNewCommessa(true)
                  }}
                  disabled={!newCliente.nome.trim() || !newCliente.cognome.trim()}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ 
                    background: (newCliente.nome.trim() && newCliente.cognome.trim()) ? TH.blue : TX.border, 
                    color: '#fff',
                    opacity: (newCliente.nome.trim() && newCliente.cognome.trim()) ? 1 : 0.5,
                    cursor: (newCliente.nome.trim() && newCliente.cognome.trim()) ? 'pointer' : 'not-allowed'
                  }}>
                  <Ic n="check" s={16}/>
                  Crea Cliente
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ BOX 1: RADAR COMMESSE — Mappa visuale pipeline ═══ */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${AC}, ${TH.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic n="activity" s={14} c="#fff"/>
              </div>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: TX.text }}>Radar Commesse</h3>
                <span style={{ fontSize: 9, color: TX.textMuted }}>Ogni commessa nella sua fase · Click per aprire</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 9, color: TX.textMuted }}>{commesse.length} attive</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: AC }}>{fmt(commesse.reduce((s, c) => s + (c.valore_preventivo || 0), 0))}</span>
            </div>
          </div>
          {/* Phase columns */}
          <div className="flex gap-1" style={{ minHeight: 100 }}>
            {STATI_COMMESSA.map((fase, fi) => {
              const commsInFase = commesse.filter(c => c.stato === fase.value)
              const isFirst = fi === 0
              const isLast = fi === STATI_COMMESSA.length - 1
              return (
                <div key={fase.value} className="flex-1" style={{ minWidth: 0 }}>
                  {/* Phase header */}
                  <div className="text-center mb-2 pb-2" style={{ borderBottom: `2px solid ${commsInFase.length > 0 ? fase.color : TX.bgHover}` }}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: fase.color, textTransform: 'uppercase', letterSpacing: 1.5 }}>{fase.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: commsInFase.length > 0 ? fase.color : TX.bgHover }}>{commsInFase.length}</div>
                  </div>
                  {/* Commesse chips */}
                  <div className="space-y-1">
                    {commsInFase.map(c => {
                      const isSelected = radarSelected === c.id
                      return (
                      <div key={c.id} className="p-1.5 rounded-lg cursor-pointer" onClick={() => setRadarSelected(isSelected ? null : c.id)}
                        style={{ background: isSelected ? fase.color + '20' : fase.color + '08', border: `1px solid ${isSelected ? fase.color : fase.color + '20'}`, transition: 'all 0.2s',
                          boxShadow: isSelected ? `0 0 8px ${fase.color}30` : 'none' }}>
                        <div className="flex items-center justify-between">
                          <span style={{ fontSize: 8, fontFamily: 'monospace', fontWeight: 700, color: fase.color }}>{c.codice}</span>
                          {c.valore_preventivo > 0 && <span style={{ fontSize: 7, fontWeight: 700, color: TH.green }}>{fmt(c.valore_preventivo)}</span>}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: TX.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.titolo}</div>
                        <div style={{ fontSize: 7, color: TX.textMuted }}>{c.cliente?.cognome || ''}</div>
                      </div>
                    )})}
                    {commsInFase.length === 0 && (
                      <div className="text-center py-3" style={{ fontSize: 8, color: TX.textMuted, opacity: 0.4 }}>—</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ═══ RADAR DETAIL PANEL ═══ */}
          {radarSelected && (() => {
            const rc = commesse.find(c => c.id === radarSelected)
            if (!rc) return null
            const rsi = getStato(rc.stato)
            const ridx = STATI_COMMESSA.findIndex(s => s.value === rc.stato)
            const daysInState = rc.updated_at ? Math.floor((Date.now() - new Date(rc.updated_at).getTime()) / 86400000) : 0
            const msgs = chatMessages[rc.stato] || []
            return (
              <div className="mt-4 pt-4" style={{ borderTop: `2px solid ${rsi.color}` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${rsi.color}, ${rsi.color}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 18, color: '#fff', fontWeight: 900 }}>{ridx + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: AC }}>{rc.codice}</span>
                        <Badge text={rsi.label} color={rsi.color} />
                        <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: daysInState > 7 ? TH.red + '12' : AC + '08', color: daysInState > 7 ? TH.red : AC, fontWeight: 700 }}>
                          {daysInState}g in questa fase
                        </span>
                      </div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, color: TX.text }}>{rc.titolo}</h4>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedCommessa(rc.id)} style={{ padding: '6px 14px', background: AC, border: 'none', borderRadius: 8, fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                      Apri Commessa →
                    </button>
                    <button onClick={() => setRadarSelected(null)} style={{ padding: '4px', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 6, cursor: 'pointer' }}>
                      <Ic n="x" s={12} c={TX.textMuted}/>
                    </button>
                  </div>
                </div>

                {/* CHI / DOVE / QUANDO / VALORE */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="p-3 rounded-xl" style={{ background: TH.blue + '06', border: `1px solid ${TH.blue}15` }}>
                    <div className="flex items-center gap-1.5 mb-2"><span style={{ fontSize: 14 }}>👤</span><span style={{ fontSize: 8, fontWeight: 800, color: TH.blue, textTransform: 'uppercase', letterSpacing: 1.5 }}>CHI</span></div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TX.text }}>{rc.cliente?.nome} {rc.cliente?.cognome}</div>
                    <div style={{ fontSize: 9, color: TX.textMuted, marginTop: 2 }}>Cliente</div>
                    {rc.responsabile_id ? (() => { const resp = dipendenti.find(d => d.id === rc.responsabile_id); return resp ? <div style={{ fontSize: 10, color: TX.textSec, marginTop: 4 }}><Ic n="wrench" s={9} c={TX.textMuted}/> {resp.nome} {resp.cognome}</div> : null })() : <div style={{ fontSize: 10, color: AC, marginTop: 4 }}>Responsabile: te</div>}
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: TH.green + '06', border: `1px solid ${TH.green}15` }}>
                    <div className="flex items-center gap-1.5 mb-2"><span style={{ fontSize: 14 }}>📍</span><span style={{ fontSize: 8, fontWeight: 800, color: TH.green, textTransform: 'uppercase', letterSpacing: 1.5 }}>DOVE</span></div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TX.text }}>{rc.citta || 'Non specificata'}</div>
                    <div style={{ fontSize: 9, color: TX.textMuted, marginTop: 2 }}>{rc.indirizzo || 'Indirizzo cantiere'}</div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: AC + '06', border: `1px solid ${AC}15` }}>
                    <div className="flex items-center gap-1.5 mb-2"><span style={{ fontSize: 14 }}>📅</span><span style={{ fontSize: 8, fontWeight: 800, color: AC, textTransform: 'uppercase', letterSpacing: 1.5 }}>QUANDO</span></div>
                    <div style={{ fontSize: 10, color: TX.text }}><b>Creata:</b> {rc.created_at ? fmtDate(rc.created_at) : '—'}</div>
                    <div style={{ fontSize: 10, color: TX.text, marginTop: 2 }}><b>Aggiornata:</b> {rc.updated_at ? fmtDate(rc.updated_at) : '—'}</div>
                    <div style={{ fontSize: 10, color: daysInState > 14 ? TH.red : TX.textSec, fontWeight: daysInState > 14 ? 700 : 400, marginTop: 2 }}>
                      {daysInState}g in fase {daysInState > 14 ? '⚠️' : daysInState > 7 ? '🟡' : '🟢'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl" style={{ background: TH.purple + '06', border: `1px solid ${TH.purple}15` }}>
                    <div className="flex items-center gap-1.5 mb-2"><span style={{ fontSize: 14 }}>💰</span><span style={{ fontSize: 8, fontWeight: 800, color: TH.purple, textTransform: 'uppercase', letterSpacing: 1.5 }}>VALORE</span></div>
                    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: TH.green }}>{rc.valore_preventivo > 0 ? fmt(rc.valore_preventivo) : '—'}</div>
                    <div style={{ fontSize: 9, color: TX.textMuted, marginTop: 2 }}>Preventivo</div>
                    {rc.note && <div style={{ fontSize: 9, color: TX.textSec, marginTop: 4, fontStyle: 'italic' }}>{rc.note}</div>}
                  </div>
                </div>

                {/* Pipeline + avanza */}
                <div className="p-3 rounded-xl mb-3" style={{ background: BG.input }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 10, fontWeight: 700, color: TX.text }}>Pipeline</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: rsi.color }}>{Math.round(((ridx + 1) / STATI_COMMESSA.length) * 100)}%</span>
                  </div>
                  <PipelineBar stato={rc.stato} size="md" />
                  {ridx < STATI_COMMESSA.length - 1 && (
                    <div className="flex items-center justify-between mt-3 pt-2" style={{ borderTop: `1px dashed ${TX.border}` }}>
                      <span style={{ fontSize: 10, color: TX.textSec }}><b style={{ color: TX.text }}>Prossimo:</b> {STATI_COMMESSA[ridx + 1].label}</span>
                      <button onClick={() => updateCommessaStato(rc.id, STATI_COMMESSA[ridx + 1].value)}
                        style={{ padding: '4px 12px', background: STATI_COMMESSA[ridx + 1].color + '10', border: `1px solid ${STATI_COMMESSA[ridx + 1].color}30`, borderRadius: 6, fontSize: 9, fontWeight: 700, color: STATI_COMMESSA[ridx + 1].color, cursor: 'pointer' }}>
                        Avanza → {STATI_COMMESSA[ridx + 1].label}
                      </button>
                    </div>
                  )}
                </div>

                {/* Chat recente */}
                {msgs.length > 0 && (
                  <div className="p-3 rounded-xl" style={{ background: BG.input }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: TX.text }}>💬 Chat — {rsi.label}</span>
                    <div className="mt-2 space-y-1.5">
                      {msgs.slice(-3).map(m => (
                        <div key={m.id} className="flex items-start gap-2">
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: m.user === 'Fabio Cozza' ? AC + '15' : TH.blue + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: m.user === 'Fabio Cozza' ? AC : TH.blue, flexShrink: 0 }}>{m.user.charAt(0)}</div>
                          <div>
                            <div className="flex items-center gap-2"><span style={{ fontSize: 8, fontWeight: 700, color: TX.text }}>{m.user}</span><span style={{ fontSize: 7, color: TX.textMuted }}>{m.time}</span></div>
                            <div style={{ fontSize: 9, color: TX.textSec }}>{m.msg}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </Card>

        {/* ═══ BOX 2: ANALYTICS COMMESSE — Percentuali WOW ═══ */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${TH.green}, ${TH.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ic n="chart" s={14} c="#fff"/>
              </div>
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: TX.text }}>Analytics in Tempo Reale</h3>
                <span style={{ fontSize: 9, color: TX.textMuted }}>Panoramica percentuali e performance</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-3">
            {STATI_COMMESSA.map((fase, fi) => {
              const count = commesse.filter(c => c.stato === fase.value).length
              const perc = commesse.length > 0 ? Math.round((count / commesse.length) * 100) : 0
              const valore = commesse.filter(c => c.stato === fase.value).reduce((s, c) => s + (c.valore_preventivo || 0), 0)
              // SVG ring
              const radius = 28
              const circumference = 2 * Math.PI * radius
              const offset = circumference - (perc / 100) * circumference
              return (
                <div key={fase.value} className="text-center">
                  {/* Circular progress */}
                  <div style={{ position: 'relative', width: 70, height: 70, margin: '0 auto' }}>
                    <svg width={70} height={70} viewBox="0 0 70 70">
                      {/* Background ring */}
                      <circle cx={35} cy={35} r={radius} fill="none" stroke={TX.bgHover} strokeWidth={5} />
                      {/* Progress ring */}
                      <circle cx={35} cy={35} r={radius} fill="none" stroke={fase.color} strokeWidth={5}
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        strokeLinecap="round" transform="rotate(-90 35 35)"
                        style={{ transition: 'stroke-dashoffset 1s ease' }} />
                      {/* Glow effect for active phases */}
                      {count > 0 && (
                        <circle cx={35} cy={35} r={radius} fill="none" stroke={fase.color} strokeWidth={2} opacity={0.3}
                          strokeDasharray={circumference} strokeDashoffset={offset}
                          strokeLinecap="round" transform="rotate(-90 35 35)" />
                      )}
                    </svg>
                    {/* Center text */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: count > 0 ? fase.color : TX.textMuted, lineHeight: 1 }}>{perc}%</span>
                      <span style={{ fontSize: 8, color: TX.textMuted }}>{count}/{commesse.length}</span>
                    </div>
                  </div>
                  {/* Label */}
                  <div style={{ fontSize: 8, fontWeight: 700, color: fase.color, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{fase.label}</div>
                  {/* Value bar */}
                  <div style={{ marginTop: 4, padding: '2px 4px', borderRadius: 4, background: count > 0 ? fase.color + '08' : 'transparent' }}>
                    <span style={{ fontSize: 8, fontWeight: 700, fontFamily: 'monospace', color: count > 0 ? TH.green : TX.textMuted }}>
                      {valore > 0 ? fmt(valore) : '—'}
                    </span>
                  </div>
                  {/* Mini bar underneath */}
                  <div className="mt-1 mx-auto" style={{ width: '80%', height: 3, borderRadius: 2, background: TX.bgHover }}>
                    <div style={{ height: 3, borderRadius: 2, width: `${perc}%`, background: `linear-gradient(90deg, ${fase.color}, ${fase.color}80)`, transition: 'width 1s ease', boxShadow: count > 0 ? `0 0 6px ${fase.color}40` : 'none' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Bottom summary row */}
          <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: `1px solid ${TX.border}` }}>
            {[
              { label: 'Valore Totale', value: fmt(commesse.reduce((s, c) => s + (c.valore_preventivo || 0), 0)), color: TH.green, icon: '💰' },
              { label: 'Valore Medio', value: fmt(commesse.length > 0 ? commesse.reduce((s, c) => s + (c.valore_preventivo || 0), 0) / commesse.length : 0), color: TH.blue, icon: '📊' },
              { label: 'Prime 3 Fasi', value: `${Math.round((commesse.filter(c => ['sopralluogo','preventivo','misure'].includes(c.stato)).length / Math.max(commesse.length, 1)) * 100)}%`, color: AC, icon: '🔄' },
              { label: 'In Produzione+', value: `${Math.round((commesse.filter(c => ['ordini','produzione','posa','chiusura'].includes(c.stato)).length / Math.max(commesse.length, 1)) * 100)}%`, color: TH.purple, icon: '⚡' },
              { label: 'Completamento', value: `${Math.round((commesse.filter(c => c.stato === 'chiusura').length / Math.max(commesse.length, 1)) * 100)}%`, color: TH.green, icon: '✅' },
            ].map((stat, i) => (
              <div key={i} className="text-center flex-1">
                <span style={{ fontSize: 14 }}>{stat.icon}</span>
                <div style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 7, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          {filtered.map(c => {
            const csi = getStato(c.stato)
            const cidx = STATI_COMMESSA.findIndex(s => s.value === c.stato)
            const cperc = Math.round(((cidx + 1) / STATI_COMMESSA.length) * 100)
            const cDays = c.updated_at ? Math.floor((Date.now() - new Date(c.updated_at).getTime()) / 86400000) : 0
            const resp = c.responsabile_id ? dipendenti.find(d => d.id === c.responsabile_id) : null
            return (
            <div key={c.id} className="rounded-xl cursor-pointer transition-all overflow-hidden" onClick={() => setSelectedCommessa(c.id)}
              style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow, borderLeft: `4px solid ${csi.color}` }}>

              {/* Header row */}
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: csi.color + '12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: csi.color }}>{cidx + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, color: csi.color }}>{c.codice}</span>
                      <span style={{ fontSize: 8, padding: '2px 8px', borderRadius: 4, background: csi.color + '12', color: csi.color, fontWeight: 700 }}>{csi.icon} {csi.label}</span>
                      {cDays > 7 && <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: cDays > 14 ? TH.red + '12' : TH.amber + '12', color: cDays > 14 ? TH.red : TH.amber, fontWeight: 700 }}>{cDays}g {cDays > 14 ? '⚠️' : '🟡'}</span>}
                    </div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: TX.text, marginTop: 2 }}>{c.titolo || '—'}</h4>
                  </div>
                </div>
                <div className="text-right">
                  {c.valore_preventivo > 0 && <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'monospace', color: TH.green }}>{fmt(c.valore_preventivo)}</div>}
                  <div style={{ fontSize: 18, fontWeight: 900, color: csi.color }}>{cperc}%</div>
                </div>
              </div>

              {/* Info row */}
              <div className="flex items-center gap-4 px-4 pb-2" style={{ fontSize: 10, color: TX.textSec }}>
                <span><Ic n="user" s={10} c={TX.textMuted}/> {c.cliente?.nome} {c.cliente?.cognome}</span>
                {c.citta && <span><Ic n="pin" s={10} c={TX.textMuted}/> {c.citta}</span>}
                {resp && <span><Ic n="wrench" s={10} c={TX.textMuted}/> {resp.nome} {resp.cognome}</span>}
                {c.created_at && <span style={{ marginLeft: 'auto', fontSize: 9, color: TX.textMuted }}>{fmtDate(c.created_at)}</span>}
              </div>

              {/* Pipeline with labels */}
              <div className="px-4 pb-3">
                <div className="flex items-center gap-0.5">
                  {STATI_COMMESSA.map((s, i) => (
                    <div key={s.value} className="flex-1" style={{ position: 'relative' }}>
                      <div style={{ height: i === cidx ? 8 : 4, borderRadius: 4,
                        background: i < cidx ? TH.green : i === cidx ? csi.color : TX.bgHover,
                        boxShadow: i === cidx ? `0 0 6px ${csi.color}40` : 'none', transition: 'all 0.3s' }} />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span style={{ fontSize: 8, fontWeight: 700, color: csi.color }}>▶ {csi.label}</span>
                  {cidx < STATI_COMMESSA.length - 1 && <span style={{ fontSize: 7, color: TX.textMuted }}>Prossimo: {STATI_COMMESSA[cidx + 1].label}</span>}
                </div>
              </div>
            </div>
          )})}
          {filtered.length === 0 && <div className="col-span-2 text-center py-12"><Ic n="clipboard" s={32} c={TX.textMuted}/><p className="mt-2" style={{ fontSize: 12, color: TX.textMuted }}>Nessuna commessa trovata</p></div>}
        </div>
      </div>
    )
  }

  // ==================== CONTABILITÀ VIEWS (Light) ====================
  const ContabilitaOverview = () => (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Fatturato', value: fmtDec(finStats.fatturato), sub: 'fatture emesse', icon: 'file', color: TH.blue },
          { label: 'Incassato', value: fmtDec(finStats.incassato), sub: 'pagamenti ricevuti', icon: 'check', color: TH.green },
          { label: 'Da Incassare', value: fmtDec(finStats.daIncassare), sub: 'crediti aperti', icon: 'clock', color: TH.amber },
          { label: 'Scaduto', value: fmtDec(finStats.scadute), sub: 'pagamenti scaduti', icon: 'alert', color: TH.red },
        ].map((s, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1.5, fontWeight: 600 }}>{s.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.color + '10' }}><Ic n={s.icon} s={16} c={s.color}/></div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: TX.textMuted }}>{s.sub}</div>
          </Card>
        ))}
      </div>
      <div className="flex gap-2 mb-6">
        {[
          { id: 'fatture', label: 'Fatture', icon: 'file', count: fatture.length },
          { id: 'pagamenti', label: 'Pagamenti', icon: 'creditcard', count: pagamenti.length },
          { id: 'scadenze', label: 'Scadenzario', icon: 'calendar', count: scadenze.filter(s => s.stato === 'aperta').length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setContabView(tab.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: contabView === tab.id ? TH.amber + '10' : BG.card, color: contabView === tab.id ? TH.amber : TX.textSec, border: `1px solid ${contabView === tab.id ? TH.amber + '30' : TX.border}` }}>
            <Ic n={tab.icon} s={14}/> {tab.label} <span style={{ fontFamily: 'monospace', marginLeft: 4 }}>{tab.count}</span>
          </button>
        ))}
      </div>
      {contabView === 'overview' && <FattureList />}
      {contabView === 'fatture' && <FattureList />}
      {contabView === 'pagamenti' && <PagamentiList />}
      {contabView === 'scadenze' && <ScadenzeList />}
    </div>
  )

  const FattureList = () => (
    <Card>
      <div className="flex items-center justify-between mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}>
        <h3 className="font-semibold text-sm" style={{ color: TX.text }}>Fatture</h3>
        <button onClick={() => setShowNewFattura(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: TH.amber, color: '#fff' }}>+ Nuova Fattura</button>
      </div>
      {showNewFattura && (
        <div className="mb-4 p-4 rounded-xl" style={{ background: BG.input, border: `1px solid ${TX.borderMed}` }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: TX.text }}>Nuova Fattura</h4>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <InputField label="Numero" value={newFattura.numero} onChange={v => setNewFattura({ ...newFattura, numero: v })} placeholder="2025/003" />
            <SelectField label="Tipo" value={newFattura.tipo} onChange={v => setNewFattura({ ...newFattura, tipo: v })} options={[{ value: 'fattura', label: 'Fattura' }, { value: 'acconto', label: 'Acconto' }, { value: 'nota_credito', label: 'Nota di credito' }]} />
            <SelectField label="Direzione" value={newFattura.direzione} onChange={v => setNewFattura({ ...newFattura, direzione: v })} options={[{ value: 'emessa', label: 'Emessa (vendita)' }, { value: 'ricevuta', label: 'Ricevuta (acquisto)' }]} />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <SelectField label="Cliente" value={newFattura.cliente_id} onChange={v => setNewFattura({ ...newFattura, cliente_id: v })} options={commesse.filter(c => c.cliente).map(c => ({ value: c.cliente!.id, label: `${c.cliente!.nome} ${c.cliente!.cognome}` })).filter((v, i, a) => a.findIndex(t => t.value === v.value) === i)} />
            <SelectField label="Commessa" value={newFattura.commessa_id} onChange={v => setNewFattura({ ...newFattura, commessa_id: v })} options={commesse.map(c => ({ value: c.id, label: `${c.codice} - ${c.titolo}` }))} />
            <SelectField label="Metodo Pagamento" value={newFattura.metodo_pagamento} onChange={v => setNewFattura({ ...newFattura, metodo_pagamento: v })} options={[{ value: 'bonifico', label: 'Bonifico' }, { value: 'contanti', label: 'Contanti' }, { value: 'assegno', label: 'Assegno' }, { value: 'carta', label: 'Carta' }, { value: 'riba', label: 'Ri.Ba.' }]} />
          </div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <InputField label="Data Emissione" value={newFattura.data_emissione} onChange={v => setNewFattura({ ...newFattura, data_emissione: v })} type="date" />
            <InputField label="Data Scadenza" value={newFattura.data_scadenza} onChange={v => setNewFattura({ ...newFattura, data_scadenza: v })} type="date" />
            <InputField label="Imponibile €" value={newFattura.imponibile} onChange={v => setNewFattura({ ...newFattura, imponibile: parseFloat(v) || 0 })} type="number" />
            <SelectField label="IVA %" value={String(newFattura.aliquota_iva)} onChange={v => setNewFattura({ ...newFattura, aliquota_iva: parseFloat(v) })} options={[{ value: '22', label: '22% (ordinaria)' }, { value: '10', label: '10% (ristrutturazione)' }, { value: '4', label: '4% (prima casa)' }, { value: '0', label: 'Esente' }]} />
          </div>
          <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${TX.borderMed}` }}>
            <div><span style={{ fontSize: 11, color: TX.textMuted }}>Totale: </span><span className="text-lg font-bold" style={{ color: TH.green, fontFamily: 'monospace' }}>{fmtDec(newFattura.imponibile + newFattura.imponibile * (newFattura.aliquota_iva / 100))}</span></div>
            <div className="flex gap-2">
              <button onClick={() => setShowNewFattura(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: TX.textSec, border: `1px solid ${TX.borderMed}` }}>Annulla</button>
              <button onClick={createFattura} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: TH.green, color: '#fff' }}>Salva Fattura</button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-12 px-4 py-2 gap-2" style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${TX.border}` }}>
        <div className="col-span-2">Numero</div><div className="col-span-2">Data</div><div className="col-span-2">Cliente</div><div className="col-span-2">Commessa</div><div className="col-span-1">Stato</div><div className="col-span-1">IVA</div><div className="col-span-2 text-right">Totale</div>
      </div>
      {fatture.map(f => (
        <div key={f.id} className="grid grid-cols-12 px-4 py-3 gap-2 items-center" style={{ borderBottom: `1px solid ${TX.border}` }}>
          <div className="col-span-2"><div className="text-sm font-medium" style={{ fontFamily: 'monospace', color: TX.text }}>{f.numero}</div><div style={{ fontSize: 9, color: TX.textMuted }}>{f.direzione === 'emessa' ? 'Emessa' : 'Ricevuta'} · {f.tipo}</div></div>
          <div className="col-span-2" style={{ fontSize: 12, color: TX.textSec }}><div>{fmtDate(f.data_emissione)}</div>{f.data_scadenza && <div style={{ fontSize: 10, color: f.data_scadenza < oggiISO && f.stato !== 'pagata' ? TH.red : TX.textMuted }}>Scad. {fmtDate(f.data_scadenza)}</div>}</div>
          <div className="col-span-2" style={{ fontSize: 12, color: TX.textSec }}>{f.cliente ? `${f.cliente.nome} ${f.cliente.cognome}` : '—'}</div>
          <div className="col-span-2" style={{ fontSize: 11, color: TX.textMuted }}>{f.commessa?.codice || '—'}</div>
          <div className="col-span-1"><Badge text={f.stato === 'pagata' ? 'Pagata' : f.stato === 'emessa' ? 'Emessa' : f.stato} color={f.stato === 'pagata' ? TH.green : f.stato === 'emessa' ? TH.amber : TX.textSec} /></div>
          <div className="col-span-1" style={{ fontSize: 11, color: TX.textMuted, fontFamily: 'monospace' }}>{f.aliquota_iva}%</div>
          <div className="col-span-2 text-right" style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13, color: f.direzione === 'emessa' ? TH.green : TH.red }}>{f.direzione === 'ricevuta' ? '-' : ''}{fmtDec(f.totale)}</div>
        </div>
      ))}
      {fatture.length === 0 && <div className="text-center py-8"><Ic n="file" s={32} c={TX.textMuted}/><p style={{ fontSize: 12, color: TX.textMuted, marginTop: 8 }}>Nessuna fattura registrata</p></div>}
    </Card>
  )

  const PagamentiList = () => (
    <Card>
      <div className="flex items-center justify-between mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}>
        <h3 className="font-semibold text-sm" style={{ color: TX.text }}>Pagamenti</h3>
        <button onClick={() => setShowNewPagamento(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: TH.green, color: '#fff' }}>+ Registra Pagamento</button>
      </div>
      {showNewPagamento && (
        <div className="mb-4 p-4 rounded-xl" style={{ background: BG.input, border: `1px solid ${TX.borderMed}` }}>
          <h4 className="text-sm font-semibold mb-3">Registra Pagamento</h4>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <SelectField label="Tipo" value={newPagamento.tipo} onChange={v => setNewPagamento({ ...newPagamento, tipo: v })} options={[{ value: 'incasso', label: 'Incasso' }, { value: 'pagamento', label: 'Pagamento' }]} />
            <InputField label="Importo €" value={newPagamento.importo} onChange={v => setNewPagamento({ ...newPagamento, importo: parseFloat(v) || 0 })} type="number" />
            <InputField label="Data" value={newPagamento.data_pagamento} onChange={v => setNewPagamento({ ...newPagamento, data_pagamento: v })} type="date" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <SelectField label="Metodo" value={newPagamento.metodo} onChange={v => setNewPagamento({ ...newPagamento, metodo: v })} options={[{ value: 'bonifico', label: 'Bonifico' }, { value: 'contanti', label: 'Contanti' }, { value: 'assegno', label: 'Assegno' }, { value: 'carta', label: 'Carta' }, { value: 'riba', label: 'Ri.Ba.' }]} />
            <SelectField label="Fattura" value={newPagamento.fattura_id} onChange={v => setNewPagamento({ ...newPagamento, fattura_id: v })} options={fatture.map(f => ({ value: f.id, label: `${f.numero} - ${fmtDec(f.totale)}` }))} />
            <InputField label="Riferimento" value={newPagamento.riferimento || ''} onChange={v => setNewPagamento({ ...newPagamento, riferimento: v })} placeholder="es. CRO/TRN" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNewPagamento(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: TX.textSec, border: `1px solid ${TX.borderMed}` }}>Annulla</button>
            <button onClick={createPagamento} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: TH.green, color: '#fff' }}>Salva Pagamento</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-12 px-4 py-2 gap-2" style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${TX.border}` }}>
        <div className="col-span-2">Data</div><div className="col-span-2">Tipo</div><div className="col-span-2">Metodo</div><div className="col-span-3">Riferimento</div><div className="col-span-3 text-right">Importo</div>
      </div>
      {pagamenti.map(p => (
        <div key={p.id} className="grid grid-cols-12 px-4 py-3 gap-2 items-center" style={{ borderBottom: `1px solid ${TX.border}` }}>
          <div className="col-span-2" style={{ fontSize: 12, color: TX.textSec }}>{fmtDate(p.data_pagamento)}</div>
          <div className="col-span-2"><Badge text={p.tipo === 'incasso' ? 'Incasso' : 'Pagamento'} color={p.tipo === 'incasso' ? TH.green : TH.red} /></div>
          <div className="col-span-2" style={{ fontSize: 12, color: TX.textSec }}>{p.metodo}</div>
          <div className="col-span-3" style={{ fontSize: 11, color: TX.textMuted }}>{p.riferimento || '—'}</div>
          <div className="col-span-3 text-right" style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14, color: p.tipo === 'incasso' ? TH.green : TH.red }}>{p.tipo === 'pagamento' ? '-' : '+'}{fmtDec(p.importo)}</div>
        </div>
      ))}
      {pagamenti.length === 0 && <div className="text-center py-8"><Ic n="creditcard" s={32} c={TX.textMuted}/><p style={{ fontSize: 12, color: TX.textMuted, marginTop: 8 }}>Nessun pagamento registrato</p></div>}
    </Card>
  )

  const ScadenzeList = () => (
    <Card>
      <div className="flex items-center justify-between mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}>
        <h3 className="font-semibold text-sm" style={{ color: TX.text }}>Scadenzario</h3>
        <div className="flex gap-2">
          <Badge text={`${scadenze.filter(s => s.stato === 'aperta' && s.data_scadenza < oggiISO).length} scadute`} color={TH.red} />
          <Badge text={`${scadenze.filter(s => s.stato === 'aperta' && s.data_scadenza >= oggiISO).length} in scadenza`} color={TH.amber} />
        </div>
      </div>
      <div className="grid grid-cols-12 px-4 py-2 gap-2" style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${TX.border}` }}>
        <div className="col-span-2">Scadenza</div><div className="col-span-3">Descrizione</div><div className="col-span-2">Cliente</div><div className="col-span-2">Commessa</div><div className="col-span-1">Stato</div><div className="col-span-2 text-right">Importo</div>
      </div>
      {scadenze.map(s => {
        const isScaduta = s.stato === 'aperta' && s.data_scadenza < oggiISO
        const giorniMancanti = Math.ceil((new Date(s.data_scadenza).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        return (
          <div key={s.id} className="grid grid-cols-12 px-4 py-3 gap-2 items-center" style={{ borderBottom: `1px solid ${TX.border}`, borderLeft: isScaduta ? `3px solid ${TH.red}` : '3px solid transparent' }}>
            <div className="col-span-2"><div style={{ fontSize: 12, fontWeight: 600, color: isScaduta ? TH.red : TX.text }}>{fmtDate(s.data_scadenza)}</div><div style={{ fontSize: 9, color: isScaduta ? TH.red : TX.textMuted }}>{isScaduta ? `${Math.abs(giorniMancanti)} gg fa` : s.stato === 'aperta' ? `tra ${giorniMancanti} gg` : ''}</div></div>
            <div className="col-span-3" style={{ fontSize: 12, color: TX.text }}>{s.descrizione || '—'}</div>
            <div className="col-span-2" style={{ fontSize: 12, color: TX.textSec }}>{s.cliente ? `${s.cliente.nome} ${s.cliente.cognome}` : '—'}</div>
            <div className="col-span-2" style={{ fontSize: 11, color: TX.textMuted }}>{s.commessa?.codice || '—'}</div>
            <div className="col-span-1"><Badge text={s.stato === 'pagata' ? '✓' : isScaduta ? '!' : '...'} color={s.stato === 'pagata' ? TH.green : isScaduta ? TH.red : TH.amber} /></div>
            <div className="col-span-2 text-right" style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14, color: isScaduta ? TH.red : TH.amber }}>{fmtDec(s.importo)}</div>
          </div>
        )
      })}
      {scadenze.length === 0 && <div className="text-center py-8"><Ic n="calendar" s={32} c={TX.textMuted}/><p style={{ fontSize: 12, color: TX.textMuted, marginTop: 8 }}>Nessuna scadenza</p></div>}
    </Card>
  )

  // ==================== MAGAZZINO (Light) ====================
  const magStats = { totArticoli: articoli.length, sottoScorta: articoli.filter(a => a.scorta_attuale <= a.scorta_minima && a.scorta_minima > 0).length, valoreStock: articoli.reduce((s, a) => s + (a.scorta_attuale * a.prezzo_acquisto), 0), movOggi: movimenti.filter(m => m.created_at?.startsWith(oggiISO)).length }
  const tipiArticolo = ['tutti', 'profilo', 'accessorio', 'vetro', 'guarnizione']
  const articoliFiltrati = magFilter === 'tutti' ? articoli : articoli.filter(a => a.tipo === magFilter)

  const MagazzinoContent = () => (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Articoli', value: magStats.totArticoli, sub: 'a catalogo', icon: 'package', color: TH.blue },
          { label: 'Sotto Scorta', value: magStats.sottoScorta, sub: 'da riordinare', icon: 'alert', color: TH.red },
          { label: 'Valore Stock', value: fmt(magStats.valoreStock), sub: 'al costo', icon: 'dollar', color: TH.green },
          { label: 'Fornitori', value: fornitori.length, sub: 'attivi', icon: 'building', color: TH.purple },
        ].map((s, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1.5, fontWeight: 600 }}>{s.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.color + '10' }}><Ic n={s.icon} s={16} c={s.color}/></div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: TX.textMuted }}>{s.sub}</div>
          </Card>
        ))}
      </div>
      <div className="flex gap-2 mb-6">
        {[{ id: 'articoli', label: 'Articoli', icon: 'package', count: articoli.length }, { id: 'movimenti', label: 'Movimenti', icon: 'arrowUpDown', count: movimenti.length }, { id: 'fornitori', label: 'Fornitori', icon: 'building', count: fornitori.length }].map(tab => (
          <button key={tab.id} onClick={() => setMagView(tab.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: magView === tab.id ? TH.purple + '10' : BG.card, color: magView === tab.id ? TH.purple : TX.textSec, border: `1px solid ${magView === tab.id ? TH.purple + '30' : TX.border}` }}>
            <Ic n={tab.icon} s={14}/> {tab.label} <span style={{ fontFamily: 'monospace', marginLeft: 4 }}>{tab.count}</span>
          </button>
        ))}
      </div>
      {magView === 'articoli' && <ArticoliList />}
      {magView === 'movimenti' && <MovimentiList />}
      {magView === 'fornitori' && <FornitoriList />}
    </div>
  )

  const ArticoliList = () => (
    <Card>
      <div className="flex items-center justify-between mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}>
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-sm">Articoli Magazzino</h3>
          <div className="flex gap-1">{tipiArticolo.map(t => (<button key={t} onClick={() => setMagFilter(t)} className="px-2 py-1 rounded text-xs" style={{ background: magFilter === t ? TH.purple + '12' : 'transparent', color: magFilter === t ? TH.purple : TX.textMuted, fontWeight: magFilter === t ? 600 : 400 }}>{t === 'tutti' ? 'Tutti' : t.charAt(0).toUpperCase() + t.slice(1) + 'i'}</button>))}</div>
        </div>
        <button onClick={() => setShowNewMovimento(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: TH.purple, color: '#fff' }}>+ Movimento</button>
      </div>
      {showNewMovimento && (
        <div className="mb-4 p-4 rounded-xl" style={{ background: BG.input, border: `1px solid ${TX.borderMed}` }}>
          <h4 className="text-sm font-semibold mb-3">Nuovo Movimento</h4>
          <div className="grid grid-cols-4 gap-3 mb-3">
            <SelectField label="Articolo" value={newMovimento.articolo_id} onChange={v => setNewMovimento({ ...newMovimento, articolo_id: v })} options={articoli.map(a => ({ value: a.id, label: `${a.codice} - ${a.nome}` }))} />
            <SelectField label="Tipo" value={newMovimento.tipo} onChange={v => setNewMovimento({ ...newMovimento, tipo: v })} options={[{ value: 'carico', label: 'Carico' }, { value: 'scarico', label: 'Scarico' }, { value: 'rettifica', label: 'Rettifica' }]} />
            <SelectField label="Causale" value={newMovimento.causale} onChange={v => setNewMovimento({ ...newMovimento, causale: v })} options={[{ value: 'acquisto', label: 'Acquisto' }, { value: 'produzione', label: 'Produzione' }, { value: 'reso', label: 'Reso' }, { value: 'inventario', label: 'Inventario' }]} />
            <InputField label="Quantità" value={newMovimento.quantita} onChange={v => setNewMovimento({ ...newMovimento, quantita: parseFloat(v) || 0 })} type="number" />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowNewMovimento(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: TX.textSec, border: `1px solid ${TX.borderMed}` }}>Annulla</button>
            <button onClick={createMovimento} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: TH.purple, color: '#fff' }}>Salva</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-12 px-4 py-2 gap-2" style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${TX.border}` }}>
        <div className="col-span-1">Cod.</div><div className="col-span-3">Articolo</div><div className="col-span-1">Tipo</div><div className="col-span-1">U.M.</div><div className="col-span-1">Scorta</div><div className="col-span-1">Min.</div><div className="col-span-1">€ Acq.</div><div className="col-span-1">Ubicaz.</div><div className="col-span-2">Fornitore</div>
      </div>
      {articoliFiltrati.map(a => {
        const sottoScorta = a.scorta_minima > 0 && a.scorta_attuale <= a.scorta_minima
        const tipoColors: Record<string, string> = { profilo: TH.blue, accessorio: TH.amber, vetro: TH.green, guarnizione: TH.pink }
        return (
          <div key={a.id} className="grid grid-cols-12 px-4 py-3 gap-2 items-center" style={{ borderBottom: `1px solid ${TX.border}`, borderLeft: sottoScorta ? `3px solid ${TH.red}` : '3px solid transparent' }}>
            <div className="col-span-1" style={{ fontSize: 10, fontFamily: 'monospace', color: TX.textMuted }}>{a.codice}</div>
            <div className="col-span-3"><div className="text-sm font-medium" style={{ color: TX.text }}>{a.nome}</div>{a.lunghezza_standard && <div style={{ fontSize: 9, color: TX.textMuted }}>Barra {a.lunghezza_standard}mm</div>}</div>
            <div className="col-span-1"><Badge text={a.tipo} color={tipoColors[a.tipo] || TX.textSec} /></div>
            <div className="col-span-1" style={{ fontSize: 11, color: TX.textSec }}>{a.unita_misura}</div>
            <div className="col-span-1"><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: sottoScorta ? TH.red : TX.text }}>{a.scorta_attuale}</span>{sottoScorta && <span style={{ fontSize: 9, color: TH.red, display: 'block' }}>SOTTO</span>}</div>
            <div className="col-span-1" style={{ fontSize: 11, fontFamily: 'monospace', color: TX.textMuted }}>{a.scorta_minima || '—'}</div>
            <div className="col-span-1" style={{ fontSize: 11, fontFamily: 'monospace', color: TX.textSec }}>{a.prezzo_acquisto > 0 ? `€${a.prezzo_acquisto}` : '—'}</div>
            <div className="col-span-1" style={{ fontSize: 10, fontFamily: 'monospace', color: TX.textMuted }}>{a.ubicazione || '—'}</div>
            <div className="col-span-2" style={{ fontSize: 11, color: TX.textSec }}>{a.fornitore?.ragione_sociale || '—'}</div>
          </div>
        )
      })}
      {articoliFiltrati.length === 0 && <div className="text-center py-8"><Ic n="package" s={32} c={TX.textMuted}/><p style={{ fontSize: 12, color: TX.textMuted, marginTop: 8 }}>Nessun articolo trovato</p></div>}
    </Card>
  )

  const MovimentiList = () => (
    <Card>
      <div className="flex items-center justify-between mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}>
        <h3 className="font-semibold text-sm">Movimenti Magazzino</h3>
        <button onClick={() => { setShowNewMovimento(true); setMagView('articoli') }} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: TH.purple, color: '#fff' }}>+ Movimento</button>
      </div>
      <div className="grid grid-cols-12 px-4 py-2 gap-2" style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${TX.border}` }}>
        <div className="col-span-2">Data</div><div className="col-span-3">Articolo</div><div className="col-span-1">Tipo</div><div className="col-span-2">Causale</div><div className="col-span-1">Qtà</div><div className="col-span-1">€ Unit.</div><div className="col-span-2">Doc. Rif.</div>
      </div>
      {movimenti.map(m => (
        <div key={m.id} className="grid grid-cols-12 px-4 py-3 gap-2 items-center" style={{ borderBottom: `1px solid ${TX.border}` }}>
          <div className="col-span-2" style={{ fontSize: 11, color: TX.textSec }}>{m.created_at ? fmtDate(m.created_at.split('T')[0]) : '—'}</div>
          <div className="col-span-3" style={{ fontSize: 12, color: TX.text }}>{m.articolo?.nome || '—'}</div>
          <div className="col-span-1"><Badge text={m.tipo === 'carico' ? 'Carico' : m.tipo === 'scarico' ? 'Scarico' : 'Rett.'} color={m.tipo === 'carico' ? TH.green : m.tipo === 'scarico' ? TH.red : TH.amber} /></div>
          <div className="col-span-2" style={{ fontSize: 11, color: TX.textMuted }}>{m.causale || '—'}</div>
          <div className="col-span-1" style={{ fontFamily: 'monospace', fontWeight: 700, color: m.tipo === 'carico' ? TH.green : TH.red }}>{m.tipo === 'carico' ? '+' : '-'}{m.quantita}</div>
          <div className="col-span-1" style={{ fontSize: 11, fontFamily: 'monospace', color: TX.textSec }}>{m.prezzo_unitario ? `€${m.prezzo_unitario}` : '—'}</div>
          <div className="col-span-2" style={{ fontSize: 10, fontFamily: 'monospace', color: TX.textMuted }}>{m.documento_rif || '—'}</div>
        </div>
      ))}
      {movimenti.length === 0 && <div className="text-center py-8"><Ic n="arrowUpDown" s={32} c={TX.textMuted}/><p style={{ fontSize: 12, color: TX.textMuted, marginTop: 8 }}>Nessun movimento registrato</p></div>}
    </Card>
  )

  const FornitoriList = () => (
    <Card>
      <div className="flex items-center justify-between mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}><h3 className="font-semibold text-sm">Fornitori</h3></div>
      <div className="grid grid-cols-12 px-4 py-2 gap-2" style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${TX.border}` }}>
        <div className="col-span-4">Ragione Sociale</div><div className="col-span-2">Città</div><div className="col-span-2">Telefono</div><div className="col-span-2">Email</div><div className="col-span-2">Articoli</div>
      </div>
      {fornitori.map(f => (
        <div key={f.id} className="grid grid-cols-12 px-4 py-3 gap-2 items-center" style={{ borderBottom: `1px solid ${TX.border}` }}>
          <div className="col-span-4"><div className="text-sm font-medium" style={{ color: TX.text }}>{f.ragione_sociale}</div><div style={{ fontSize: 9, color: TX.textMuted }}>P.IVA {f.partita_iva || '—'}</div></div>
          <div className="col-span-2" style={{ fontSize: 12, color: TX.textSec }}>{f.citta || '—'}</div>
          <div className="col-span-2" style={{ fontSize: 11, color: TX.textSec }}>{f.telefono || '—'}</div>
          <div className="col-span-2" style={{ fontSize: 11, color: TH.blue }}>{f.email || '—'}</div>
          <div className="col-span-2" style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: TH.purple }}>{articoli.filter(a => a.fornitore_id === f.id).length} art.</div>
        </div>
      ))}
      {fornitori.length === 0 && <div className="text-center py-8"><Ic n="building" s={32} c={TX.textMuted}/><p style={{ fontSize: 12, color: TX.textMuted, marginTop: 8 }}>Nessun fornitore registrato</p></div>}
    </Card>
  )

  // ==================== PRODUZIONE (Light) ====================
  const prodStats = { totLavorazioni: lavorazioni.length, inCorso: lavorazioni.filter(l => l.stato === 'in_corso').length, inAttesa: lavorazioni.filter(l => l.stato === 'attesa').length, completate: lavorazioni.filter(l => l.stato === 'completata').length, tempoTotale: lavorazioni.reduce((s, l) => s + (l.tempo_effettivo_min || 0), 0) }
  const statoLavColors: Record<string, { color: string; icon: string; label: string }> = {
    attesa: { color: TX.textSec, icon: '⏳', label: 'In Attesa' }, in_corso: { color: TH.blue, icon: '▶', label: 'In Corso' },
    pausa: { color: TH.amber, icon: '⏸', label: 'In Pausa' }, completata: { color: TH.green, icon: '✓', label: 'Completata' }, problema: { color: TH.red, icon: '!', label: 'Problema' },
  }
  const lavPerCommessa = lavorazioni.reduce((acc, l) => { const key = l.commessa_id; if (!acc[key]) acc[key] = { commessa: l.commessa, lavorazioni: [] }; acc[key].lavorazioni.push(l); return acc }, {} as Record<string, { commessa?: Commessa; lavorazioni: typeof lavorazioni }>)

  const ProduzioneContent = () => (
    <div>
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Lavorazioni', value: prodStats.totLavorazioni, sub: 'totali', icon: 'wrench', color: TH.blue },
          { label: 'In Corso', value: prodStats.inCorso, sub: 'adesso', icon: 'zap', color: TH.amber },
          { label: 'In Attesa', value: prodStats.inAttesa, sub: 'da avviare', icon: 'clock', color: TX.textSec },
          { label: 'Completate', value: prodStats.completate, sub: 'fatte', icon: 'check', color: TH.green },
          { label: 'Tempo Totale', value: `${Math.floor(prodStats.tempoTotale / 60)}h ${prodStats.tempoTotale % 60}m`, sub: 'effettivo', icon: 'timer', color: TH.purple },
        ].map((s, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1.5, fontWeight: 600 }}>{s.label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: s.color + '10' }}><Ic n={s.icon} s={16} c={s.color}/></div>
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: TX.textMuted }}>{s.sub}</div>
          </Card>
        ))}
      </div>
      <div className="flex gap-2 mb-6">
        {[{ id: 'lavorazioni', label: 'Lavorazioni', icon: 'wrench', count: lavorazioni.length }, { id: 'fasi', label: 'Fasi Standard', icon: 'layers', count: fasi.length }, { id: 'centri', label: 'Centri Lavoro', icon: 'building', count: centriLavoro.length }, { id: 'dipendenti', label: 'Dipendenti', icon: 'users', count: dipendenti.length }].map(tab => (
          <button key={tab.id} onClick={() => setProdView(tab.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: prodView === tab.id ? TH.blue + '10' : BG.card, color: prodView === tab.id ? TH.blue : TX.textSec, border: `1px solid ${prodView === tab.id ? TH.blue + '30' : TX.border}` }}>
            <Ic n={tab.icon} s={14}/> {tab.label} <span style={{ fontFamily: 'monospace', marginLeft: 4 }}>{tab.count}</span>
          </button>
        ))}
      </div>
      {prodView === 'lavorazioni' && <LavorazioniView />}
      {prodView === 'fasi' && <FasiView />}
      {prodView === 'centri' && <CentriView />}
      {prodView === 'dipendenti' && <DipendentiView />}
    </div>
  )

  const LavorazioniView = () => (
    <div className="space-y-4">
      {Object.entries(lavPerCommessa).map(([commessaId, group]) => {
        const completate = group.lavorazioni.filter(l => l.stato === 'completata').length; const totali = group.lavorazioni.length; const perc = totali > 0 ? Math.round((completate / totali) * 100) : 0
        return (
          <Card key={commessaId}>
            <div className="flex items-center justify-between mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}>
              <div className="flex items-center gap-3">
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: TH.amber, fontWeight: 700 }}>{group.commessa?.codice || '—'}</span>
                <span className="font-semibold text-sm" style={{ color: TX.text }}>{group.commessa?.titolo || 'Commessa'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 rounded-full" style={{ background: TX.border }}><div className="h-2 rounded-full transition-all" style={{ background: perc === 100 ? TH.green : TH.blue, width: `${perc}%` }} /></div>
                <span style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: perc === 100 ? TH.green : TH.blue }}>{perc}%</span>
              </div>
            </div>
            <div className="space-y-2">
              {group.lavorazioni.sort((a, b) => (a.fase?.ordine || 0) - (b.fase?.ordine || 0)).map(l => {
                const sl = statoLavColors[l.stato] || statoLavColors.attesa
                const tempoPerc = l.tempo_stimato_min > 0 ? Math.min(100, Math.round((l.tempo_effettivo_min / l.tempo_stimato_min) * 100)) : 0
                const overTime = l.tempo_effettivo_min > l.tempo_stimato_min
                return (
                  <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: l.stato === 'in_corso' ? TH.blue + '06' : BG.input, border: `1px solid ${l.stato === 'in_corso' ? TH.blue + '20' : TX.border}` }}>
                    <div style={{ minWidth: 140 }}><div className="flex items-center gap-2"><span style={{ fontSize: 10, fontFamily: 'monospace', color: TX.textMuted, fontWeight: 600 }}>{l.fase?.codice}</span><span className="text-sm font-medium" style={{ color: TX.text }}>{l.fase?.nome || '—'}</span></div></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1"><span style={{ fontSize: 10, color: TX.textMuted }}>{l.tempo_effettivo_min > 0 ? `${l.tempo_effettivo_min} min` : '—'} / {l.tempo_stimato_min} min</span>{overTime && <span style={{ fontSize: 9, color: TH.red, fontWeight: 600 }}>OVER +{l.tempo_effettivo_min - l.tempo_stimato_min}min</span>}</div>
                      <div className="h-1.5 rounded-full" style={{ background: TX.border }}><div className="h-1.5 rounded-full transition-all" style={{ background: overTime ? TH.red : sl.color, width: `${tempoPerc}%` }} /></div>
                    </div>
                    <div style={{ minWidth: 100 }}><Badge text={`${sl.icon} ${sl.label}`} color={sl.color} /></div>
                    <div className="flex gap-1">
                      {l.stato === 'attesa' && <button onClick={() => updateLavorazioneStato(l.id, 'in_corso')} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: TH.blue + '12', color: TH.blue }}>▶ Avvia</button>}
                      {l.stato === 'in_corso' && (<><button onClick={() => updateLavorazioneStato(l.id, 'pausa')} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: TH.amber + '12', color: TH.amber }}>⏸ Pausa</button><button onClick={() => updateLavorazioneStato(l.id, 'completata')} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: TH.green + '12', color: TH.green }}>✓ Fine</button></>)}
                      {l.stato === 'pausa' && <button onClick={() => updateLavorazioneStato(l.id, 'in_corso')} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: TH.blue + '12', color: TH.blue }}>▶ Riprendi</button>}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
      {lavorazioni.length === 0 && <Card><div className="text-center py-8"><Ic n="wrench" s={32} c={TX.textMuted}/><p style={{ fontSize: 12, color: TX.textMuted, marginTop: 8 }}>Nessuna lavorazione in corso</p></div></Card>}
    </div>
  )

  const FasiView = () => (
    <Card>
      <div className="flex items-center justify-between mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}><h3 className="font-semibold text-sm">Fasi Standard di Produzione</h3><span style={{ fontSize: 11, color: TX.textMuted }}>{fasi.length} fasi configurate</span></div>
      <div className="space-y-2">
        {fasi.map((f, i) => (
          <div key={f.id} className="flex items-center gap-4 p-3 rounded-lg" style={{ background: BG.input, border: `1px solid ${TX.border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: TH.blue + '12', color: TH.blue }}>{i + 1}</div>
            <div className="flex-1"><div className="flex items-center gap-2"><span style={{ fontSize: 11, fontFamily: 'monospace', color: TH.amber, fontWeight: 600 }}>{f.codice}</span><span className="text-sm font-medium" style={{ color: TX.text }}>{f.nome}</span></div><span style={{ fontSize: 10, color: TX.textMuted }}>{f.tipo}</span></div>
            <div style={{ fontSize: 12, fontFamily: 'monospace', color: TH.purple }}>{f.tempo_stimato_min} min</div>
          </div>
        ))}
      </div>
    </Card>
  )

  const CentriView = () => (
    <Card>
      <div className="flex items-center justify-between mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}><h3 className="font-semibold text-sm">Centri di Lavoro</h3></div>
      <div className="grid grid-cols-12 px-4 py-2 gap-2" style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${TX.border}` }}>
        <div className="col-span-3">Nome</div><div className="col-span-2">Tipo</div><div className="col-span-2">Marca</div><div className="col-span-2">Modello</div><div className="col-span-1">Stato</div><div className="col-span-2 text-right">€/ora</div>
      </div>
      {centriLavoro.map(c => (
        <div key={c.id} className="grid grid-cols-12 px-4 py-3 gap-2 items-center" style={{ borderBottom: `1px solid ${TX.border}` }}>
          <div className="col-span-3 text-sm font-medium" style={{ color: TX.text }}>{c.nome}</div>
          <div className="col-span-2"><Badge text={c.tipo || '—'} color={TH.blue} /></div>
          <div className="col-span-2" style={{ fontSize: 12, color: TX.textSec }}>{c.marca || '—'}</div>
          <div className="col-span-2" style={{ fontSize: 12, color: TX.textSec }}>{c.modello || '—'}</div>
          <div className="col-span-1"><Badge text={c.stato === 'attivo' ? 'ON' : 'OFF'} color={c.stato === 'attivo' ? TH.green : TH.red} /></div>
          <div className="col-span-2 text-right" style={{ fontFamily: 'monospace', fontWeight: 600, color: TH.purple }}>€{c.costo_orario}/h</div>
        </div>
      ))}
    </Card>
  )

  const DipendentiView = () => (
    <Card>
      <div className="flex items-center justify-between mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}><h3 className="font-semibold text-sm">Dipendenti</h3></div>
      <div className="grid grid-cols-12 px-4 py-2 gap-2" style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${TX.border}` }}>
        <div className="col-span-3">Nome</div><div className="col-span-2">Ruolo</div><div className="col-span-2">Reparto</div><div className="col-span-2 text-right">Costo Orario</div><div className="col-span-3 text-right">Lavorazioni</div>
      </div>
      {dipendenti.map(d => (
        <div key={d.id} className="grid grid-cols-12 px-4 py-3 gap-2 items-center" style={{ borderBottom: `1px solid ${TX.border}` }}>
          <div className="col-span-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: TH.blue + '12', color: TH.blue }}>{d.nome[0]}{d.cognome[0]}</div><span className="text-sm font-medium" style={{ color: TX.text }}>{d.nome} {d.cognome}</span></div></div>
          <div className="col-span-2"><Badge text={d.ruolo || '—'} color={d.ruolo === 'operaio' ? TH.blue : d.ruolo === 'posatore' ? TH.green : TH.amber} /></div>
          <div className="col-span-2" style={{ fontSize: 12, color: TX.textSec }}>{d.reparto || '—'}</div>
          <div className="col-span-2 text-right" style={{ fontFamily: 'monospace', fontWeight: 600, color: TH.purple }}>€{d.costo_orario}/h</div>
          <div className="col-span-3 text-right" style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: TH.amber }}>—</div>
        </div>
      ))}
    </Card>
  )

  // ==================== CLIENTI (Light) ====================
  const ClientiContent = () => {
    const tipi = ['tutti', 'privato', 'azienda', 'condominio']
    const clientiFiltrati = clienteFilter === 'tutti' ? clienti : clienti.filter(c => c.tipo === clienteFilter)
    return (
      <Card>
        <div className="flex items-center justify-between mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}>
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-sm">Clienti</h3>
            <div className="flex gap-1">{tipi.map(t => (<button key={t} onClick={() => setClienteFilter(t)} className="px-2 py-1 rounded text-xs" style={{ background: clienteFilter === t ? TH.amber + '12' : 'transparent', color: clienteFilter === t ? TH.amber : TX.textMuted, fontWeight: clienteFilter === t ? 600 : 400 }}>{t === 'tutti' ? 'Tutti' : t.charAt(0).toUpperCase() + t.slice(1)}</button>))}</div>
          </div>
          <button onClick={() => setShowNewCliente(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: TH.amber, color: '#fff' }}>+ Nuovo Cliente</button>
        </div>
        {showNewCliente && (
          <div className="mb-4 p-4 rounded-xl" style={{ background: BG.input, border: `1px solid ${TX.borderMed}` }}>
            <h4 className="text-sm font-semibold mb-3">Nuovo Cliente</h4>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <InputField label="Nome" value={newCliente.nome} onChange={v => setNewCliente({ ...newCliente, nome: v })} placeholder="Mario" />
              <InputField label="Cognome" value={newCliente.cognome} onChange={v => setNewCliente({ ...newCliente, cognome: v })} placeholder="Rossi" />
              <InputField label="Telefono" value={newCliente.telefono} onChange={v => setNewCliente({ ...newCliente, telefono: v })} placeholder="+39 0984..." />
              <InputField label="Email" value={newCliente.email} onChange={v => setNewCliente({ ...newCliente, email: v })} placeholder="mario@..." />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <InputField label="Indirizzo" value={newCliente.indirizzo} onChange={v => setNewCliente({ ...newCliente, indirizzo: v })} />
              <InputField label="Città" value={newCliente.citta} onChange={v => setNewCliente({ ...newCliente, citta: v })} />
              <SelectField label="Tipo" value={newCliente.tipo} onChange={v => setNewCliente({ ...newCliente, tipo: v })} options={[{ value: 'privato', label: 'Privato' }, { value: 'azienda', label: 'Azienda' }, { value: 'condominio', label: 'Condominio' }]} />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowNewCliente(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ color: TX.textSec, border: `1px solid ${TX.borderMed}` }}>Annulla</button>
              <button onClick={createCliente} className="px-4 py-1.5 rounded-lg text-xs font-semibold" style={{ background: TH.amber, color: '#fff' }}>Salva Cliente</button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-12 px-4 py-2 gap-2" style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, borderBottom: `1px solid ${TX.border}` }}>
          <div className="col-span-3">Nome</div><div className="col-span-1">Tipo</div><div className="col-span-2">Telefono</div><div className="col-span-2">Email</div><div className="col-span-2">Indirizzo</div><div className="col-span-2 text-right">Commesse</div>
        </div>
        {clientiFiltrati.map(cl => {
          const numComm = commesse.filter(c => c.cliente_id === cl.id).length
          return (
            <div key={cl.id} className="grid grid-cols-12 px-4 py-3 gap-2 items-center" style={{ borderBottom: `1px solid ${TX.border}` }}>
              <div className="col-span-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: cl.tipo === 'azienda' ? TH.purple + '12' : cl.tipo === 'condominio' ? TH.green + '12' : TH.blue + '12', color: cl.tipo === 'azienda' ? TH.purple : cl.tipo === 'condominio' ? TH.green : TH.blue }}>{cl.nome?.[0] || ''}{cl.cognome?.[0] || ''}</div><span className="text-sm font-medium" style={{ color: TX.text }}>{cl.nome} {cl.cognome}</span></div></div>
              <div className="col-span-1"><Badge text={cl.tipo} color={cl.tipo === 'azienda' ? TH.purple : cl.tipo === 'condominio' ? TH.green : TH.blue} /></div>
              <div className="col-span-2" style={{ fontSize: 12, color: TX.textSec }}>{cl.telefono || '—'}</div>
              <div className="col-span-2" style={{ fontSize: 11, color: TH.blue }}>{cl.email || '—'}</div>
              <div className="col-span-2" style={{ fontSize: 12, color: TX.textSec }}>{cl.citta || '—'}</div>
              <div className="col-span-2 text-right" style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 14, color: TH.amber }}>{numComm}</div>
            </div>
          )
        })}
        {clientiFiltrati.length === 0 && <div className="text-center py-8"><Ic n="users" s={32} c={TX.textMuted}/><p style={{ fontSize: 12, color: TX.textMuted, marginTop: 8 }}>Nessun cliente trovato</p></div>}
      </Card>
    )
  }

  // ==================== MISURE CANTIERE — Interactive field measurement ====================
  const MISURE_TEMPLATES: Record<string, { desc: string; tipiche: { l: number; h: number }; accessori: string[]; avvisi: string[]; campiObbligatori: string[] }> = {
    finestra: { desc: 'Finestra standard', tipiche: { l: 1200, h: 1400 }, accessori: ['tapp','zanz'], avvisi: ['Verifica fuori squadra','Misura diagonali!','Controlla cassonetto se presente'], campiObbligatori: ['lAlto','lBasso','hSx','hDx'] },
    portafinestra: { desc: 'Portafinestra', tipiche: { l: 900, h: 2200 }, accessori: ['tapp','pers'], avvisi: ['Misura soglia attentamente','Verifica battuta a terra','Controlla senso apertura'], campiObbligatori: ['lAlto','lBasso','hSx','hDx','soglia'] },
    scorrevole: { desc: 'Scorrevole alzante', tipiche: { l: 2000, h: 2200 }, accessori: ['zanz'], avvisi: ['Binario inferiore: serve spazio incasso','Verifica portata parete','Tolleranze strette!'], campiObbligatori: ['lAlto','lBasso','hSx','hDx','imbotte'] },
    porta_ingresso: { desc: 'Porta ingresso', tipiche: { l: 900, h: 2100 }, accessori: [], avvisi: ['Verifica luce muro','Controlla tipo muro (portante?)','Misura imbotte'], campiObbligatori: ['lAlto','hSx','hDx','imbotte'] },
    vasistas: { desc: 'Vasistas', tipiche: { l: 600, h: 600 }, accessori: ['zanz'], avvisi: ['Posizione in alto: verifica accessibilità'], campiObbligatori: ['lAlto','hSx'] },
    fisso: { desc: 'Vetrata fissa', tipiche: { l: 1000, h: 1500 }, accessori: [], avvisi: ['Solo vetro: verifica spessore'], campiObbligatori: ['lAlto','lBasso','hSx','hDx'] },
  }

  // Measure Chip component — tap to edit inline
  const MChip = ({ value, color, label, onSave }: { value: number|null|undefined; color: string; label: string; onSave: (v: number|null) => void }) => {
    const [ed, setEd] = useState(false)
    const [t, setT] = useState('')
    const ref = useRef<HTMLInputElement>(null)
    useEffect(() => { if (ed) { setT(value?.toString() || ''); setTimeout(() => ref.current?.focus(), 50) } }, [ed, value])
    const sv = () => { setEd(false); onSave(t ? parseInt(t) : null) }
    if (ed) return <input ref={ref} type="number" inputMode="numeric" value={t} onChange={e => setT(e.target.value)} onBlur={sv} onKeyDown={e => e.key === 'Enter' && sv()} style={{ width: 72, padding: '6px 4px', borderRadius: 8, border: `2px solid ${color}`, background: '#fff', color, fontSize: 17, fontWeight: 800, textAlign: 'center', outline: 'none' }} />
    return <button onClick={() => setEd(true)} style={{ padding: '5px 8px', borderRadius: 8, border: `2px solid ${value ? color : TX.border}`, background: value ? color + '08' : BG.input, color: value ? color : TX.textMuted, fontSize: value ? 15 : 10, fontWeight: 700, cursor: 'pointer', minWidth: 60, textAlign: 'center', lineHeight: '1.2' }}>{value || label}</button>
  }

  // Accessory expand card for misure
  const MAccCard = ({ title, icon, color, data, fields, onSave, onRemove }: {
    title: string; icon: string; color: string; data: Record<string,any>;
    fields: { key: string; label: string; type: 'mm'|'pick'|'text'; options?: string[] }[];
    onSave: (key: string, val: any) => void; onRemove: () => void
  }) => {
    const [open, setOpen] = useState(false)
    const mmF = fields.filter(f => f.type === 'mm'); const hasData = mmF.some(f => data[f.key])
    const summary = mmF.map(f => data[f.key] ? `${f.label}: ${data[f.key]}` : '').filter(Boolean).join(' · ')
    if (!open) return <button onClick={() => setOpen(true)} style={{ width: '100%', background: BG.card, borderRadius: 10, padding: '12px 14px', border: hasData ? `2px solid ${color}30` : `1px solid ${TX.border}`, cursor: 'pointer', textAlign: 'left', marginBottom: 6, boxShadow: isDark ? 'none' : TH.shadow }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontSize: 13, fontWeight: 700, color: hasData ? color : TX.textMuted }}>{title}</span></div>
        <Ic n="edit" s={12} c={TX.textMuted}/>
      </div>
      {hasData && <div style={{ fontSize: 11, color: TX.textSec, marginTop: 4 }}>{summary}</div>}
    </button>
    return <div style={{ background: BG.card, borderRadius: 10, padding: 14, border: `2px solid ${color}`, marginBottom: 6, boxShadow: isDark ? 'none' : TH.shadow }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>{icon}</span><span style={{ fontSize: 13, fontWeight: 700, color }}>{title}</span></div>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: TX.textMuted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>▲ Chiudi</button>
      </div>
      {fields.map(f => {
        if (f.type === 'mm') return <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${TX.border}` }}>
          <span style={{ fontSize: 13, color: TX.text }}>{f.label}</span>
          <MChip value={data[f.key]} color={color} label="mm" onSave={v => onSave(f.key, v)} />
        </div>
        if (f.type === 'pick') return <div key={f.key} style={{ marginBottom: 10, marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TX.textMuted, marginBottom: 6, textTransform: 'uppercase' as const }}>{f.label}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{(f.options||[]).map(o => <button key={o} onClick={() => onSave(f.key, o)} style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: data[f.key] === o ? color + '15' : BG.input, color: data[f.key] === o ? color : TX.textSec, border: `1px solid ${data[f.key] === o ? color + '40' : TX.border}` }}>{o}</button>)}</div>
        </div>
        return <div key={f.key} style={{ marginBottom: 10, marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: TX.textMuted, marginBottom: 4, textTransform: 'uppercase' as const }}>{f.label}</div>
          <input value={data[f.key]||''} onChange={e => onSave(f.key, e.target.value)} placeholder={f.label} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${TX.border}`, background: BG.input, color: TX.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
      })}
      <button onClick={onRemove} style={{ width: '100%', padding: 8, borderRadius: 8, border: `1px solid ${TX.border}`, background: 'transparent', color: TH.red, fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 6 }}>🗑 Rimuovi {title.toLowerCase()}</button>
    </div>
  }

  // Error detection for measurements
  const getMisuraWarnings = (m: Record<string,any>, tipo: string) => {
    const warns: string[] = []
    const tpl = MISURE_TEMPLATES[tipo]
    if (tpl) {
      tpl.campiObbligatori.forEach(f => { if (!m[f]) warns.push(`Manca ${f.replace(/([A-Z])/g,' $1').toLowerCase()}`) })
      if (m.lAlto && m.lBasso && Math.abs(m.lAlto - m.lBasso) > 15) warns.push(`⚠️ Fuori squadra larghezza: ${Math.abs(m.lAlto - m.lBasso)}mm`)
      if (m.hSx && m.hDx && Math.abs(m.hSx - m.hDx) > 15) warns.push(`⚠️ Fuori squadra altezza: ${Math.abs(m.hSx - m.hDx)}mm`)
      if (m.d1 && m.d2 && Math.abs(m.d1 - m.d2) > 5) warns.push(`⚠️ Diagonali diverse: ${Math.abs(m.d1 - m.d2)}mm`)
      if (tpl.tipiche.l > 0 && m.lAlto) {
        const diff = Math.abs(m.lAlto - tpl.tipiche.l)
        if (diff > 300) warns.push(`Larghezza insolita per ${tpl.desc}: ${m.lAlto}mm (tipica: ${tpl.tipiche.l}mm)`)
      }
    }
    return warns
  }

  const MisureCantiereContent = () => {
    // If viewing a specific vano
    if (misuraCommessaId && misuraVanoIdx !== null) {
      const vano = misureVani[misuraVanoIdx]
      if (!vano) return null
      const m = misuraData
      const tipo = vano.tipo || 'finestra'
      const tpl = MISURE_TEMPLATES[tipo]
      const warns = getMisuraWarnings(m, tipo)
      const cW = TH.blue, cH = TH.green, cD = TH.amber, cSp = '#06b6d4', cDv = TH.pink, cCs = TH.purple

      // Count filled fields
      const allFields = ['lAlto','lCentro','lBasso','hSx','hCentro','hDx','d1','d2','spSx','spDx','spSopra','davProf','davSporg','soglia','imbotte']
      const filled = allFields.filter(f => m[f]).length
      const pct = Math.round((filled / allFields.length) * 100)

      const doSave = async () => {
        const accJson = Object.keys(misuraAccData).length > 0 ? JSON.stringify(misuraAccData) : ''
        await saveMisuraVano(vano.id, {
          note: JSON.stringify({ misure: m, accessori: misuraAccData, noteText: misuraNote, acc: misuraAcc }),
          ha_cassonetto: misuraAcc.cass, ha_tapparella: misuraAcc.tapp, ha_persiana: misuraAcc.pers, ha_zanzariera: misuraAcc.zanz,
        } as any)
        alert('✅ Misure salvate!')
      }

      return (
        <div>
          {/* Header back */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { setMisuraVanoIdx(null) }} className="flex items-center gap-2 text-sm" style={{ color: TX.textSec, background: 'none', border: 'none', cursor: 'pointer' }}>
              <Ic n="arrowLeft" s={14}/> Torna alla lista vani
            </button>
            <button onClick={doSave} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2" style={{ background: TH.green, color: '#fff', border: 'none', cursor: 'pointer' }}>
              <Ic n="check" s={14} c="#fff"/> SALVA MISURE
            </button>
          </div>

          {/* Vano info + progress */}
          <Card className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: TH.amber + '12', fontSize: 20 }}>📐</div>
                <div>
                  <h3 className="font-bold text-base" style={{ color: TX.text }}>{vano.posizione || `Vano ${misuraVanoIdx + 1}`}</h3>
                  <span style={{ fontSize: 11, color: TX.textMuted }}>{vano.tipo} · {vano.ambiente || 'N/D'} · {vano.piano || 'PT'}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: pct === 100 ? TH.green : pct > 50 ? TH.amber : TH.red }}>{pct}%</div>
                <div style={{ fontSize: 9, color: TX.textMuted }}>{filled}/{allFields.length} campi</div>
              </div>
            </div>
            <div className="mt-3" style={{ height: 6, borderRadius: 3, background: TX.bgHover, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3, background: pct === 100 ? TH.green : pct > 50 ? TH.amber : TH.red, transition: 'width 0.3s' }} />
            </div>
          </Card>

          {/* Template tips + warnings */}
          {tpl && <Card className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 12, fontWeight: 700, color: TH.purple }}><Ic n="target" s={13} c={TH.purple}/> {tpl.desc}</span>
              {tpl.tipiche.l > 0 && <span style={{ fontSize: 10, color: TX.textMuted, background: BG.input, padding: '2px 8px', borderRadius: 4 }}>Tipiche: {tpl.tipiche.l}×{tpl.tipiche.h}</span>}
            </div>
            {tpl.avvisi.map((a,i) => <div key={i} style={{ fontSize: 11, color: TH.amber, marginTop: 3 }}>⚠️ {a}</div>)}
            {warns.length > 0 && <div style={{ marginTop: 8, padding: '8px 10px', background: TH.red + '08', borderRadius: 8, border: `1px solid ${TH.red}20` }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: TH.red, marginBottom: 4 }}>🚨 ERRORI RILEVATI</div>
              {warns.map((w,i) => <div key={i} style={{ fontSize: 11, color: TH.red }}>{w}</div>)}
            </div>}
          </Card>}

          {/* ═══ INTERACTIVE WINDOW DRAWING ═══ */}
          <Card className="mb-4">
            <div style={{ fontSize: 13, fontWeight: 700, color: TX.text, marginBottom: 14, textAlign: 'center' }}>📐 TOCCA I VALORI PER INSERIRE LE MISURE</div>

            {/* Cassonetto in drawing */}
            {misuraAcc.cass && <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10, padding: 10, background: cCs + '08', borderRadius: 10, border: `1px dashed ${cCs}30` }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: cCs, fontWeight: 700, marginBottom: 2 }}>CASS. L</div><MChip value={m.cassL} color={cCs} label="L" onSave={v => setMisuraData(p => ({...p, cassL: v}))} /></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: cCs, fontWeight: 700, marginBottom: 2 }}>CASS. H</div><MChip value={m.cassH} color={cCs} label="H" onSave={v => setMisuraData(p => ({...p, cassH: v}))} /></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: cCs, fontWeight: 700, marginBottom: 2 }}>CASS. P</div><MChip value={m.cassP} color={cCs} label="P" onSave={v => setMisuraData(p => ({...p, cassP: v}))} /></div>
            </div>}

            {/* Spalletta sopra */}
            <div style={{ textAlign: 'center', marginBottom: 6 }}><div style={{ fontSize: 9, color: cSp, fontWeight: 700 }}>SPALL. SOPRA</div><MChip value={m.spSopra} color={cSp} label="mm" onSave={v => setMisuraData(p => ({...p, spSopra: v}))} /></div>

            {/* Larghezza alto */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 30, height: 2, background: cW }} />
                <MChip value={m.lAlto} color={cW} label="L alto" onSave={v => setMisuraData(p => ({...p, lAlto: v}))} />
                <div style={{ width: 30, height: 2, background: cW }} />
              </div>
            </div>

            {/* Main frame */}
            <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'center' }}>
              {/* Left side — spalletta + altezza */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingRight: 6 }}>
                <div style={{ textAlign: 'center', marginBottom: 6 }}><div style={{ fontSize: 8, color: cSp }}>SP.SX</div><MChip value={m.spSx} color={cSp} label="mm" onSave={v => setMisuraData(p => ({...p, spSx: v}))} /></div>
                <MChip value={m.hSx} color={cH} label="H sx" onSave={v => setMisuraData(p => ({...p, hSx: v}))} />
                <div style={{ fontSize: 8, color: cH, marginTop: 4 }}>↕</div>
              </div>

              {/* Window frame */}
              <div style={{ width: 180, minHeight: 220, border: `3px solid ${TX.borderMed}`, borderRadius: 6, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BG.input }}>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 180 220"><line x1="0" y1="0" x2="180" y2="220" stroke={cD + '30'} strokeWidth="1" strokeDasharray="4" /><line x1="180" y1="0" x2="0" y2="220" stroke={cD + '30'} strokeWidth="1" strokeDasharray="4" /></svg>
                <MChip value={m.hCentro} color={cH} label="H centro" onSave={v => setMisuraData(p => ({...p, hCentro: v}))} />
                <div style={{ height: 12 }} />
                <MChip value={m.lCentro} color={cW} label="L centro" onSave={v => setMisuraData(p => ({...p, lCentro: v}))} />
                <div style={{ height: 12 }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <MChip value={m.d1} color={cD} label="D1" onSave={v => setMisuraData(p => ({...p, d1: v}))} />
                  <MChip value={m.d2} color={cD} label="D2" onSave={v => setMisuraData(p => ({...p, d2: v}))} />
                </div>
                {m.d1 && m.d2 && <div style={{ marginTop: 6, fontSize: 10, fontWeight: 700, color: Math.abs(m.d1 - m.d2) > 5 ? TH.red : TH.green }}>
                  F.sq: {Math.abs(m.d1 - m.d2)}mm {Math.abs(m.d1 - m.d2) > 5 ? '⚠️' : '✓'}
                </div>}
              </div>

              {/* Right side */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 6 }}>
                <div style={{ textAlign: 'center', marginBottom: 6 }}><div style={{ fontSize: 8, color: cSp }}>SP.DX</div><MChip value={m.spDx} color={cSp} label="mm" onSave={v => setMisuraData(p => ({...p, spDx: v}))} /></div>
                <MChip value={m.hDx} color={cH} label="H dx" onSave={v => setMisuraData(p => ({...p, hDx: v}))} />
                <div style={{ fontSize: 8, color: cH, marginTop: 4 }}>↕</div>
              </div>
            </div>

            {/* Larghezza basso */}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 30, height: 2, background: cW }} />
                <MChip value={m.lBasso} color={cW} label="L basso" onSave={v => setMisuraData(p => ({...p, lBasso: v}))} />
                <div style={{ width: 30, height: 2, background: cW }} />
              </div>
            </div>

            {/* Davanzale + Soglia + Imbotte */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12, padding: 10, background: BG.input, borderRadius: 10, border: `1px solid ${TX.border}` }}>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: cDv, fontWeight: 700 }}>DAV.PROF</div><MChip value={m.davProf} color={cDv} label="mm" onSave={v => setMisuraData(p => ({...p, davProf: v}))} /></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: cDv, fontWeight: 700 }}>DAV.SPORG</div><MChip value={m.davSporg} color={cDv} label="mm" onSave={v => setMisuraData(p => ({...p, davSporg: v}))} /></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: TX.textMuted, fontWeight: 700 }}>SOGLIA</div><MChip value={m.soglia} color={TX.textSec} label="mm" onSave={v => setMisuraData(p => ({...p, soglia: v}))} /></div>
              <div style={{ textAlign: 'center' }}><div style={{ fontSize: 9, color: TX.textMuted, fontWeight: 700 }}>IMBOTTE</div><MChip value={m.imbotte} color={TX.textSec} label="mm" onSave={v => setMisuraData(p => ({...p, imbotte: v}))} /></div>
            </div>
          </Card>

          {/* ═══ ACCESSORI ═══ */}
          <Card className="mb-4">
            <h4 className="text-sm font-semibold mb-3" style={{ color: TX.text }}>Accessori</h4>

            {!misuraAcc.cass ? <button onClick={() => setMisuraAcc(p => ({...p, cass: true}))} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px dashed ${TX.border}`, background: 'transparent', color: TX.textMuted, fontSize: 12, cursor: 'pointer', marginBottom: 6, textAlign: 'left' }}>+ 📦 Aggiungi Cassonetto</button>
              : <button onClick={() => setMisuraAcc(p => ({...p, cass: false}))} style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1px solid ${cCs}30`, background: cCs + '08', color: cCs, fontSize: 11, cursor: 'pointer', marginBottom: 6, textAlign: 'left', fontWeight: 600 }}>📦 Cassonetto ✓ (misure nel disegno) — tocca per rimuovere</button>}

            {misuraAcc.tapp ? <MAccCard title="Tapparella" icon="🔲" color={TH.amber} data={misuraAccData}
              fields={[{key:'tl',label:'Larghezza',type:'mm'},{key:'ta',label:'Altezza',type:'mm'},{key:'tt',label:'Materiale',type:'pick',options:['PVC','Alluminio','Acciaio','Legno']},{key:'tm',label:'Motorizzata',type:'pick',options:['Sì','No']},{key:'tc',label:'Colore',type:'text'}]}
              onSave={(k,v) => setMisuraAccData(p => ({...p,[k]:v}))} onRemove={() => setMisuraAcc(p => ({...p, tapp: false}))} />
              : <button onClick={() => setMisuraAcc(p => ({...p, tapp: true}))} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px dashed ${TX.border}`, background: 'transparent', color: TX.textMuted, fontSize: 12, cursor: 'pointer', marginBottom: 6, textAlign: 'left' }}>+ 🔲 Aggiungi Tapparella</button>}

            {misuraAcc.pers ? <MAccCard title="Persiana" icon="🪟" color="#14b8a6" data={misuraAccData}
              fields={[{key:'pl',label:'Larg. anta',type:'mm'},{key:'pa',label:'Alt. anta',type:'mm'},{key:'pn',label:'N° ante',type:'pick',options:['1','2','3','4']},{key:'pt',label:'Tipo',type:'pick',options:['Battente','Scorrevole','Libro']},{key:'pc',label:'Colore',type:'text'}]}
              onSave={(k,v) => setMisuraAccData(p => ({...p,[k]:v}))} onRemove={() => setMisuraAcc(p => ({...p, pers: false}))} />
              : <button onClick={() => setMisuraAcc(p => ({...p, pers: true}))} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px dashed ${TX.border}`, background: 'transparent', color: TX.textMuted, fontSize: 12, cursor: 'pointer', marginBottom: 6, textAlign: 'left' }}>+ 🪟 Aggiungi Persiana</button>}

            {misuraAcc.zanz ? <MAccCard title="Zanzariera" icon="🦟" color={TH.purple} data={misuraAccData}
              fields={[{key:'zl',label:'Larghezza',type:'mm'},{key:'za',label:'Altezza',type:'mm'},{key:'zt',label:'Tipo',type:'pick',options:['Laterale','Verticale','Plissé','Fissa']},{key:'zg',label:'Guida',type:'pick',options:['Incasso','Sovrapposizione']},{key:'zc',label:'Colore',type:'text'}]}
              onSave={(k,v) => setMisuraAccData(p => ({...p,[k]:v}))} onRemove={() => setMisuraAcc(p => ({...p, zanz: false}))} />
              : <button onClick={() => setMisuraAcc(p => ({...p, zanz: true}))} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: `1px dashed ${TX.border}`, background: 'transparent', color: TX.textMuted, fontSize: 12, cursor: 'pointer', marginBottom: 6, textAlign: 'left' }}>+ 🦟 Aggiungi Zanzariera</button>}
          </Card>

          {/* Note */}
          <Card className="mb-4">
            <h4 className="text-xs font-bold mb-2" style={{ color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1 }}>📝 NOTE</h4>
            <textarea value={misuraNote} onChange={e => setMisuraNote(e.target.value)} placeholder="Note libere..." style={{ width: '100%', padding: 12, borderRadius: 8, border: `1px solid ${TX.border}`, background: BG.input, color: TX.text, fontSize: 13, minHeight: 60, resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const }} />
          </Card>

          {/* Save button big */}
          <button onClick={doSave} className="w-full rounded-xl text-base font-bold flex items-center justify-center gap-2" style={{ padding: 16, background: TH.green, color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}>
            <Ic n="check" s={18} c="#fff"/> SALVA MISURE
          </button>
        </div>
      )
    }

    // If viewing commessa vani list
    if (misuraCommessaId) {
      const comm = misureCommesse.find((c: any) => c.id === misuraCommessaId)
      return (
        <div>
          <button onClick={() => { setMisuraCommessaId(null); setMisureVani([]) }} className="flex items-center gap-2 mb-4 text-sm" style={{ color: TX.textSec, background: 'none', border: 'none', cursor: 'pointer' }}>
            <Ic n="arrowLeft" s={14}/> Torna alle commesse
          </button>
          <Card className="mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: TH.amber + '12' }}>🏗️</div>
              <div>
                <h3 className="font-bold text-base" style={{ color: TX.text }}>{comm?.codice} — {comm?.titolo}</h3>
                <span style={{ fontSize: 11, color: TX.textMuted }}>{comm?.cliente?.nome} {comm?.cliente?.cognome} · {comm?.indirizzo} {comm?.citta}</span>
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm" style={{ color: TX.text }}>Vani da misurare ({misureVani.length})</h4>
            <button onClick={async () => { await createSerramento(misuraCommessaId); await loadMisureVani(misuraCommessaId) }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5" style={{ background: TH.amber, color: '#fff', border: 'none', cursor: 'pointer' }}>
              <Ic n="plus" s={13} c="#fff"/> Aggiungi Vano
            </button>
          </div>

          {misureVani.length === 0 && <Card><div className="text-center py-8" style={{ color: TX.textMuted }}><Ic n="ruler" s={32} c={TX.textMuted}/><p className="text-sm mt-2">Nessun vano. Aggiungi il primo!</p></div></Card>}

          <div className={`grid grid-cols-2 ${gap}`}>
            {misureVani.map((v: any, i: number) => {
              // Parse stored measurement data
              let mData: any = {}; try { const parsed = JSON.parse(v.note || '{}'); mData = parsed.misure || {} } catch {}
              const allF = ['lAlto','lBasso','hSx','hDx']
              const filled = allF.filter(f => mData[f]).length
              const pct = Math.round((filled / allF.length) * 100)

              return <div key={v.id} onClick={() => {
                let parsed: any = {}; try { parsed = JSON.parse(v.note || '{}') } catch {}
                setMisuraData(parsed.misure || {})
                setMisuraAccData(parsed.accessori || {})
                setMisuraNote(parsed.noteText || '')
                setMisuraAcc(parsed.acc || { cass: v.ha_cassonetto, tapp: v.ha_tapparella, pers: v.ha_persiana, zanz: v.ha_zanzariera })
                setMisuraVanoIdx(i)
              }} className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? 'none' : TH.shadow }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: TH.amber }}>{v.posizione || `V${i+1}`}</span>
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: pct === 100 ? TH.green + '12' : pct > 0 ? TH.amber + '12' : TH.red + '12', color: pct === 100 ? TH.green : pct > 0 ? TH.amber : TH.red, fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TX.text }}>{v.tipo || 'finestra'}</div>
                <div style={{ fontSize: 10, color: TX.textMuted }}>{v.ambiente || '—'} · {v.piano || 'PT'}</div>
                {mData.lAlto && mData.hSx && <div style={{ fontSize: 11, color: TH.blue, fontWeight: 600, marginTop: 4, fontFamily: 'monospace' }}>{mData.lAlto} × {mData.hSx} mm</div>}
                <div className="mt-2" style={{ height: 4, borderRadius: 2, background: TX.bgHover }}>
                  <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: pct === 100 ? TH.green : TH.amber }} />
                </div>
              </div>
            })}
          </div>
        </div>
      )
    }

    // Main list — commesse to measure
    const filtered = misureCommesse.filter((c: any) => {
      if (!misureSearch) return true
      const s = misureSearch.toLowerCase()
      return (c.codice||'').toLowerCase().includes(s) || (c.titolo||'').toLowerCase().includes(s) || (c.cliente?.nome||'').toLowerCase().includes(s) || (c.cliente?.cognome||'').toLowerCase().includes(s) || (c.indirizzo||'').toLowerCase().includes(s) || (c.citta||'').toLowerCase().includes(s)
    })

    return (
      <div>
        {/* Search bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <Ic n="search" s={14} c={TX.textMuted}/>
            <input value={misureSearch} onChange={e => setMisureSearch(e.target.value)} placeholder="Cerca commessa, cliente, indirizzo..."
              className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }} />
          </div>
          <Badge text={`${filtered.length} commesse`} color={TH.amber} />
        </div>

        {/* Commesse grid */}
        <div className="space-y-3">
          {filtered.map((c: any) => {
            const si = getStato(c.stato)
            return <div key={c.id} onClick={async () => {
              setMisuraCommessaId(c.id)
              await loadMisureVani(c.id)
            }} className="rounded-xl p-4 cursor-pointer transition-all hover:shadow-lg" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? 'none' : TH.shadow }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: si.color + '12' }}>
                    <Ic n="ruler" s={18} c={si.color}/>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: TH.amber }}>{c.codice}</span>
                      <Badge text={si.label} color={si.color} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: TX.text }}>{c.titolo}</div>
                    <div style={{ fontSize: 10, color: TX.textMuted }}>{c.cliente?.nome} {c.cliente?.cognome} · {c.indirizzo} {c.citta}</div>
                  </div>
                </div>
                <Ic n="chevronRight" s={16} c={TX.textMuted}/>
              </div>
            </div>
          })}
        </div>
        {filtered.length === 0 && <Card><div className="text-center py-8" style={{ color: TX.textMuted }}><Ic n="ruler" s={32} c={TX.textMuted}/><p className="text-sm mt-2">Nessuna commessa trovata</p></div></Card>}
      </div>
    )
  }

  // ==================== CALENDARIO (Light) ====================
  const tipiEvento: Record<string, { label: string; color: string; icon: string }> = {
    sopralluogo: { label: 'Sopralluogo', color: TH.blue, icon: 'eye' }, misure: { label: 'Misure', color: TH.green, icon: 'ruler' },
    scadenza: { label: 'Scadenza', color: TH.red, icon: 'clock' },
    posa: { label: 'Posa', color: TH.amber, icon: 'wrench' }, consegna: { label: 'Consegna', color: TH.purple, icon: 'truck' },
    riunione: { label: 'Riunione', color: TH.pink, icon: 'users' }, altro: { label: 'Altro', color: TX.textSec, icon: 'calendar' },
  }

  const CalendarioContent = () => {
    const calDate = new Date(calYear, calMonth, 1); const monthName = calDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

    const getWeekDays = () => {
      const start = new Date(calWeekStart); const days = []
      for (let i = 0; i < 7; i++) { const d = new Date(start); d.setDate(start.getDate() + i); days.push(d) }
      return days
    }

    const getMonthDays = () => {
      const first = new Date(calYear, calMonth, 1); const last = new Date(calYear, calMonth + 1, 0)
      const startDay = first.getDay() === 0 ? 6 : first.getDay() - 1; const days = []
      for (let i = startDay - 1; i >= 0; i--) { const d = new Date(calYear, calMonth, -i); days.push({ date: d, current: false }) }
      for (let i = 1; i <= last.getDate(); i++) days.push({ date: new Date(calYear, calMonth, i), current: true })
      while (days.length < 42) { const d = new Date(calYear, calMonth + 1, days.length - last.getDate() - startDay + 1); days.push({ date: d, current: false }) }
      return days
    }

    const filteredEventi = calFilterTipo.length > 0 ? calEventi.filter(e => calFilterTipo.includes(e.tipo)) : calEventi

    // Memorizzo styles, callbacks e initialValues per evitare re-render di CalendarioEventoForm
    const memoizedStyles = useMemo(() => ({ TH, TX, BG }), [isDark])
    const handleCancelEvento = useCallback(() => setShowNewEvento(false), [])
    const initialValues = useMemo(() => ({ 
      titolo: '', 
      tipo: 'sopralluogo', 
      data: new Date().toISOString().split('T')[0], 
      ora_inizio: '09:00', 
      durata_min: 60, 
      cliente_id: '', 
      commessa_id: '', 
      note: '' 
    }), [])
    const handleCreateEvento = useCallback((eventoData: any) => createEvento(eventoData), [])

    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Tab Vista */}
            <div className="flex gap-2">
              {[{ id: 'oggi', label: 'Oggi', icon: 'target' }, { id: 'settimana', label: 'Settimana', icon: 'grid' }, { id: 'mese', label: 'Mese', icon: 'calendar' }, { id: 'timeline', label: 'Timeline', icon: 'activity' }].map(v => (
                <button key={v.id} onClick={() => setCalView(v.id)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{ background: calView === v.id ? TH.amber + '10' : BG.card, color: calView === v.id ? TH.amber : TX.textSec, border: `1px solid ${calView === v.id ? TH.amber + '30' : TX.border}` }}>
                  <Ic n={v.icon} s={14}/> {v.label}
                </button>
              ))}
            </div>
            
            {/* Separatore visivo */}
            <div style={{ width: 1, height: 24, background: TX.border }} />
            
            {/* Filtri Tipo Evento */}
            <div className="flex gap-1">
              <button 
                onClick={() => setCalFilterTipo([])} 
                className="px-2 py-1 rounded text-xs" 
                style={{ 
                  background: calFilterTipo.length === 0 ? TH.blue + '12' : 'transparent', 
                  color: calFilterTipo.length === 0 ? TH.blue : TX.textMuted, 
                  fontWeight: 500,
                  border: `1px solid ${calFilterTipo.length === 0 ? TH.blue + '30' : 'transparent'}`
                }}>
                Tutte ({calEventi.length})
              </button>
              {Object.entries(tipiEvento).map(([k, v]) => (
                <button key={k} onClick={() => setCalFilterTipo(prev => prev.includes(k) ? prev.filter(t => t !== k) : [...prev, k])} className="px-2 py-1 rounded text-xs" style={{ background: calFilterTipo.includes(k) ? v.color + '20' : 'transparent', color: calFilterTipo.includes(k) ? v.color : TX.textMuted, opacity: calFilterTipo.length > 0 && !calFilterTipo.includes(k) ? 0.4 : 1, fontWeight: 500, border: `1px solid ${calFilterTipo.includes(k) ? v.color + '40' : 'transparent'}` }}>
                  {v.label} ({calEventi.filter(e => e.tipo === k).length})
                </button>
              ))}
            </div>
          </div>
          
          {/* Pulsante Nuovo Evento a destra */}
          <button onClick={() => setShowNewEvento(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5" style={{ background: TH.amber, color: '#fff' }}>
            <Ic n="plus" s={14}/>
            Nuovo Evento
          </button>
        </div>

        {showNewEvento && (
          <CalendarioEventoForm 
            initialValues={initialValues}
            onSave={handleCreateEvento}
            onCancel={handleCancelEvento}
            clienti={clienti}
            commesse={commesse}
            tipiEvento={tipiEvento}
            styles={memoizedStyles}
          />
        )}

        {/* OGGI VIEW */}
        {calView === 'oggi' && (
          <Card>
            <div className="flex items-center gap-3 mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}>
              <Ic n="target" s={20} c={TH.amber}/>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: TX.text }}>
                  {calSelectedDate && calSelectedDate !== oggiISO 
                    ? new Date(calSelectedDate + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
                    : 'Oggi'}
                </h3>
                <span style={{ fontSize: 11, color: TX.textMuted }}>
                  {calSelectedDate || oggiISO}
                </span>
              </div>
              {calSelectedDate && calSelectedDate !== oggiISO && (
                <button 
                  onClick={() => {
                    setCalSelectedDate(null)
                    setCalView('oggi')
                  }} 
                  className="ml-auto px-2 py-1 rounded text-xs" 
                  style={{ background: TH.blue + '15', color: TH.blue }}>
                  Torna a oggi
                </button>
              )}
            </div>
            <div 
              className="relative" 
              style={{ minHeight: 600 }}
              onMouseMove={(ev) => {
                if (!draggingEventoOggi) return
                const evento = filteredEventi.find(e => e.id === draggingEventoOggi)
                if (!evento) return
                
                // Calcola nuova ora basata sulla posizione Y del mouse
                const deltaY = ev.clientY - dragStartY
                const [hh, mm] = (evento.ora_inizio || '08:00').split(':').map(Number)
                const startMinutes = hh * 60 + mm
                const rawMinutes = startMinutes + Math.round(deltaY / (50 * calZoom) * 60)
                
                // SNAP a 15 minuti per precisione
                const snappedMinutes = Math.round(rawMinutes / 15) * 15
                
                // Limiti: 07:00 - 18:00
                const clampedMinutes = Math.max(7 * 60, Math.min(18 * 60, snappedMinutes))
                const newHH = Math.floor(clampedMinutes / 60)
                const newMM = clampedMinutes % 60
                const newOraInizio = `${String(newHH).padStart(2, '0')}:${String(newMM).padStart(2, '0')}`
                
                // Aggiorna temporaneamente la visualizzazione (ottimistic update)
                setCalEventi(prev => prev.map(e => 
                  e.id === draggingEventoOggi ? { ...e, ora_inizio: newOraInizio } : e
                ))
              }}
              onMouseUp={async () => {
                if (!draggingEventoOggi) return
                const evento = filteredEventi.find(e => e.id === draggingEventoOggi)
                if (evento && evento.ora_inizio) {
                  // Salva sul database
                  await updateEventoOra(draggingEventoOggi, evento.ora_inizio)
                }
                setDraggingEventoOggi(null)
              }}
              onMouseLeave={() => {
                if (draggingEventoOggi) {
                  setDraggingEventoOggi(null)
                  loadCalendario() // Ricarica per ripristinare se drag annullato
                }
              }}>
              {Array.from({ length: 12 }).map((_, i) => {
                const hour = i + 7
                return (<div key={hour} className="flex items-start" style={{ height: 50 * calZoom }}><span style={{ width: 50, fontSize: 10, fontFamily: 'monospace', color: TX.textMuted, textAlign: 'right', paddingRight: 8, paddingTop: 2 }}>{String(hour).padStart(2, '0')}:00</span><div className="flex-1" style={{ borderTop: `1px solid ${TX.border}` }} /></div>)
              })}
              {(() => {
                // Gestione intelligente sovrapposizioni
                const giornoVista = calSelectedDate || oggiISO
                const eventiOggi = filteredEventi.filter(e => e.data === giornoVista)
                const eventiConPosizione = eventiOggi.map((e, idx) => {
                  const te = tipiEvento[e.tipo] || tipiEvento.altro
                  const [hh, mm] = (e.ora_inizio || '08:00').split(':').map(Number)
                  const startMinutes = hh * 60 + mm
                  const endMinutes = startMinutes + (e.durata_min || 60)
                  return { ...e, te, startMinutes, endMinutes, column: 0, totalColumns: 1 }
                })
                
                // Calcola sovrapposizioni e colonne
                eventiConPosizione.forEach((e1, i) => {
                  const overlapping = eventiConPosizione.filter((e2, j) => 
                    i !== j && e1.startMinutes < e2.endMinutes && e1.endMinutes > e2.startMinutes
                  )
                  e1.totalColumns = Math.max(e1.totalColumns, overlapping.length + 1)
                  
                  // Trova prima colonna libera
                  const usedColumns = overlapping
                    .filter(e2 => eventiConPosizione.indexOf(e2) < i)
                    .map(e2 => e2.column)
                  for (let col = 0; col < e1.totalColumns; col++) {
                    if (!usedColumns.includes(col)) {
                      e1.column = col
                      break
                    }
                  }
                })
                
                return eventiConPosizione.map(e => {
                  const top = ((e.startMinutes - 7 * 60) / 60) * 50 * calZoom
                  const height = ((e.durata_min || 60) / 60) * 50 * calZoom
                  
                  // Calcolo corretto posizione
                  const columnWidth = `calc((100% - 58px) / ${e.totalColumns})`
                  const leftPosition = e.totalColumns === 1 
                    ? '58px' 
                    : `calc(58px + (100% - 58px) * ${e.column} / ${e.totalColumns})`
                  
                  return (
                    <div 
                      key={e.id}
                      onMouseDown={(ev) => {
                        ev.stopPropagation()
                        setDraggingEventoOggi(e.id)
                        setDragStartY(ev.clientY)
                      }}
                      onClick={(ev) => {
                        // Click funziona solo se non ho appena draggato
                        if (draggingEventoOggi) return
                        if (e.commessa_id) {
                          setSelectedCommessa(e.commessa_id)
                          setActiveTab('commesse')
                        } else if (e.cliente_id) {
                          setActiveTab('clienti')
                        }
                      }}
                      className="absolute rounded-lg p-2.5 overflow-hidden shadow-md transition-all select-none" 
                      style={{ 
                        top, 
                        left: leftPosition,
                        width: e.totalColumns === 1 ? 'calc(100% - 66px)' : `calc(${columnWidth} - 4px)`,
                        height: Math.max(height, 50), 
                        background: e.te.color + '15', 
                        borderLeft: `4px solid ${e.te.color}`, 
                        border: `1px solid ${e.te.color}35`,
                        cursor: draggingEventoOggi === e.id ? 'grabbing' : 'grab',
                        opacity: draggingEventoOggi === e.id ? 0.7 : 1,
                        transform: draggingEventoOggi === e.id ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: draggingEventoOggi === e.id ? `0 8px 24px ${e.te.color}60` : '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                      {/* Etichetta tipo evento */}
                      <div className="flex items-center gap-1 mb-2 px-1.5 py-0.5 rounded-md inline-block" style={{ background: e.te.color + '30' }}>
                        <Ic n={e.te.icon} s={10} c={e.te.color}/>
                        <span style={{ fontSize: 9, fontWeight: 700, color: e.te.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{e.te.label}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold" style={{ color: e.te.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.titolo}</span>
                      </div>
                      <div style={{ fontSize: 10, color: TX.textMuted, fontWeight: 600 }}>{e.ora_inizio} · {e.durata_min}min</div>
                      {e.cliente && (
                        <div style={{ fontSize: 10, color: TX.text, fontWeight: 600, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          👤 {e.cliente.nome} {e.cliente.cognome}
                        </div>
                      )}
                      {e.commessa && (
                        <div style={{ fontSize: 10, color: TH.blue, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          📋 #{e.commessa.codice}
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          </Card>
        )}

        {/* SETTIMANA VIEW */}
        {calView === 'settimana' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { const d = new Date(calWeekStart); d.setDate(d.getDate() - 7); setCalWeekStart(d.toISOString().split('T')[0]) }} className="p-1 rounded" style={{ color: TX.textSec }}><Ic n="chevronLeft" s={18}/></button>
              <span className="text-sm font-semibold" style={{ color: TX.text }}>Settimana del {new Date(calWeekStart).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}</span>
              <button onClick={() => { const d = new Date(calWeekStart); d.setDate(d.getDate() + 7); setCalWeekStart(d.toISOString().split('T')[0]) }} className="p-1 rounded" style={{ color: TX.textSec }}><Ic n="chevronRight" s={18}/></button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays().map(d => {
                const iso = d.toISOString().split('T')[0]; const isToday = iso === oggiISO
                const dayEvents = filteredEventi.filter(e => e.data === iso)
                return (
                  <div 
                    key={iso} 
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                    }}
                    onDragEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)'
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                    onDrop={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      if (draggedEvento && draggedEvento.data !== iso) {
                        updateEventoData(draggedEvento.id, iso)
                      }
                    }}
                    className="rounded-xl p-3 transition-all duration-200" 
                    style={{ 
                      background: draggedEvento && draggedEvento.data !== iso ? TH.amber + '15' : (isToday ? TH.amber + '06' : BG.input), 
                      border: `3px ${draggedEvento && draggedEvento.data !== iso ? 'dashed' : 'solid'} ${draggedEvento && draggedEvento.data !== iso ? TH.amber : (isToday ? TH.amber + '30' : TX.border)}`, 
                      minHeight: 200,
                      boxShadow: draggedEvento && draggedEvento.data !== iso ? '0 4px 12px rgba(217, 119, 6, 0.2)' : 'none'
                    }}>
                    <div className="text-center mb-3">
                      <div style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, fontWeight: 700 }}>{d.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold mt-1`} style={{ background: isToday ? TH.amber : 'transparent', color: isToday ? '#fff' : TX.text, border: `2px solid ${isToday ? 'transparent' : TX.border}` }}>{d.getDate()}</div>
                    </div>
                    <div className="space-y-2">
                      {dayEvents.map(e => { 
                        const te = tipiEvento[e.tipo] || tipiEvento.altro
                        return (
                        <div 
                          key={e.id} 
                          draggable
                          onClick={(ev) => {
                            // Click funziona solo se non sto draggando
                            if (!draggedEvento) {
                              if (e.commessa_id) {
                                setSelectedCommessa(e.commessa_id)
                                setActiveTab('commesse')
                              } else if (e.cliente_id) {
                                setActiveTab('clienti')
                              }
                            }
                          }}
                          onDragStart={(ev) => {
                            setDraggedEvento(e)
                            ev.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragEnd={() => setDraggedEvento(null)}
                          className="rounded-lg p-2.5 cursor-pointer hover:shadow-lg transition-all" 
                          style={{ 
                            background: draggedEvento?.id === e.id ? te.color + '30' : te.color + '15', 
                            borderLeft: `4px solid ${te.color}`, 
                            border: `1px solid ${te.color}40`,
                            opacity: draggedEvento?.id === e.id ? 0.5 : 1,
                            marginBottom: 6
                          }}>
                          {/* Etichetta tipo evento */}
                          <div className="flex items-center gap-1 mb-2 px-1.5 py-0.5 rounded-md inline-block" style={{ background: te.color + '25' }}>
                            <Ic n={te.icon} s={9} c={te.color}/>
                            <span style={{ fontSize: 8, fontWeight: 700, color: te.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{te.label}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-1.5">
                            <span style={{ fontSize: 11, fontWeight: 700, color: te.color }}>{e.ora_inizio?.slice(0, 5)}</span>
                            <span style={{ fontSize: 9, color: TX.textMuted }}>·</span>
                            <span style={{ fontSize: 9, color: TX.textMuted }}>{e.durata_min}min</span>
                          </div>
                          <div style={{ 
                            fontSize: 12, 
                            color: TX.text, 
                            fontWeight: 700, 
                            marginBottom: 4,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>{e.titolo}</div>
                          {e.cliente && (
                            <div style={{ 
                              fontSize: 10, 
                              color: TX.text, 
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              👤 {e.cliente.nome} {e.cliente.cognome}
                            </div>
                          )}
                          {e.commessa && (
                            <div style={{ 
                              fontSize: 10, 
                              color: TH.blue, 
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              📋 #{e.commessa.codice}
                            </div>
                          )}
                        </div>
                      )})}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}

        {/* MESE VIEW */}
        {calView === 'mese' && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }} className="p-1 rounded" style={{ color: TX.textSec }}><Ic n="chevronLeft" s={18}/></button>
              <span className="text-sm font-semibold capitalize" style={{ color: TX.text }}>{monthName}</span>
              <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }} className="p-1 rounded" style={{ color: TX.textSec }}><Ic n="chevronRight" s={18}/></button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (<div key={d} className="text-center py-2" style={{ fontSize: 10, color: TX.textMuted, textTransform: 'uppercase' as const, fontWeight: 700 }}>{d}</div>))}
              {getMonthDays().map((d, i) => {
                const iso = d.date.toISOString().split('T')[0]; const isToday = iso === oggiISO; const dayEv = filteredEventi.filter(e => e.data === iso)
                const pienezza = Math.min((dayEv.length / 5) * 100, 100) // max 5 eventi = 100%
                return (
                  <div 
                    key={i} 
                    onClick={() => {
                      // Click porta alla vista OGGI di quel giorno
                      setCalView('oggi')
                      setCalSelectedDate(iso)
                      // Aggiorna anche la settimana per essere coerente
                      const clickedDate = new Date(iso)
                      const day = clickedDate.getDay()
                      const diff = clickedDate.getDate() - day + (day === 0 ? -6 : 1)
                      setCalWeekStart(new Date(clickedDate.setDate(diff)).toISOString().split('T')[0])
                    }}
                    className="relative p-2 rounded-lg cursor-pointer hover:shadow-lg hover:scale-105 transition-all group" 
                    style={{ 
                      background: calSelectedDate === iso ? TH.amber + '15' : isToday ? TH.blue + '08' : BG.input, 
                      border: `2px solid ${calSelectedDate === iso ? TH.amber : isToday ? TH.blue + '50' : TX.border}`, 
                      opacity: d.current ? 1 : 0.4, 
                      minHeight: 80 
                    }}>
                    <div style={{ fontSize: 14, fontWeight: isToday ? 700 : 600, color: isToday ? TH.blue : TX.text, marginBottom: 6 }}>{d.date.getDate()}</div>
                    {dayEv.length > 0 && (
                      <>
                        {/* Mostra i primi 3 eventi con etichette colorate */}
                        <div className="space-y-1">
                          {dayEv.slice(0, 3).map(e => {
                            const te = tipiEvento[e.tipo] || tipiEvento.altro
                            return (
                              <div key={e.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded" style={{ background: te.color + '20', borderLeft: `2px solid ${te.color}` }}>
                                <Ic n={te.icon} s={8} c={te.color}/>
                                <span style={{ fontSize: 8, fontWeight: 700, color: te.color, textTransform: 'uppercase' }}>{te.label}</span>
                              </div>
                            )
                          })}
                          {dayEv.length > 3 && (
                            <div style={{ fontSize: 8, color: TX.textMuted, textAlign: 'center', marginTop: 2 }}>
                              +{dayEv.length - 3} altri
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
            {calSelectedDate && (
              <div className="mt-4 pt-4" style={{ borderBottom: `1px solid ${TX.border}` }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: TX.text }}>{new Date(calSelectedDate + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
                <div className="space-y-1">
                  {filteredEventi.filter(e => e.data === calSelectedDate).map(e => { const te = tipiEvento[e.tipo] || tipiEvento.altro; return (
                    <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: te.color + '06', borderLeft: `3px solid ${te.color}` }}>
                      <Ic n={te.icon} s={16} c={te.color}/><div><div className="text-sm font-medium" style={{ color: TX.text }}>{e.titolo}</div><span style={{ fontSize: 10, color: TX.textMuted }}>{e.ora_inizio || '??:??'} · {e.durata_min}min</span></div>
                    </div>
                  )})}
                  {filteredEventi.filter(e => e.data === calSelectedDate).length === 0 && <p style={{ fontSize: 12, color: TX.textMuted }}>Nessun evento</p>}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* TIMELINE VIEW (12 weeks) */}
        {calView === 'timeline' && (
          <Card>
            <div className="flex items-center gap-3 mb-4" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 12 }}><Ic n="activity" s={18} c={TH.amber}/><h3 className="font-semibold text-sm">Timeline 12 Settimane — Commesse</h3></div>
            <div className="overflow-x-auto">
              <div style={{ minWidth: 900 }}>
                <div className="flex" style={{ borderBottom: `1px solid ${TX.border}`, paddingBottom: 4, marginBottom: 8 }}>
                  <div style={{ width: 180, fontSize: 10, color: TX.textMuted, fontWeight: 600, textTransform: 'uppercase' as const }}>Commessa</div>
                  <div className="flex flex-1">{Array.from({ length: 12 }).map((_, w) => { const d = new Date(); d.setDate(d.getDate() + w * 7); return (<div key={w} className="flex-1 text-center" style={{ fontSize: 8, color: TX.textMuted }}>{d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</div>) })}</div>
                </div>
                {commesse.slice(0, 10).map(c => {
                  const si = getStato(c.stato); const idx = STATI_COMMESSA.findIndex(s => s.value === c.stato); const progress = ((idx + 1) / STATI_COMMESSA.length) * 100
                  return (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setSelectedCommessa(c.id)
                        setActiveTab('commesse')
                      }}
                      className="flex items-center py-1 cursor-pointer hover:bg-opacity-50 transition-all" 
                      style={{ 
                        borderBottom: `1px solid ${TX.border}`,
                        background: selectedCommessa === c.id ? si.color + '08' : 'transparent'
                      }}>
                      <div style={{ width: 180 }}>
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: TH.amber, fontWeight: 700 }}>{c.codice}</span>
                        <span className="ml-1" style={{ fontSize: 11, color: TX.text }}>{(c.titolo || '').slice(0, 20)}</span>
                      </div>
                      <div className="flex flex-1">
                        <div 
                          className="h-6 rounded-md hover:shadow-md transition-all" 
                          style={{ 
                            background: `linear-gradient(90deg, ${si.color}25, ${si.color}08)`, 
                            width: `${Math.max(progress, 10)}%`, 
                            display: 'flex', 
                            alignItems: 'center', 
                            paddingLeft: 6,
                            border: `1px solid ${si.color}30`
                          }}>
                          <span style={{ fontSize: 8, color: si.color, fontWeight: 600 }}>{si.label}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )}
      </div>
    )
  }

  // ==================== COMMESSA DETAIL: VISTA PROGETTO (Light) ====================
  const VistaProgetto = () => {
    const comm = commesse.find(c => c.id === selectedCommessa)
    if (!comm) return null
    const si = getStato(comm.stato)
    const currentIdx = STATI_COMMESSA.findIndex(s => s.value === comm.stato)
    const faseGroups: Record<string, CommessaAttivita[]> = {}
    commessaAttivita.forEach(a => { if (!faseGroups[a.macro_fase]) faseGroups[a.macro_fase] = []; faseGroups[a.macro_fase].push(a) })
    const overallPerc = Math.round(((currentIdx + 1) / STATI_COMMESSA.length) * 100)
    const daysInPhase = comm.updated_at ? Math.floor((Date.now() - new Date(comm.updated_at).getTime()) / 86400000) : 0

    const sendChat = (fase: string) => {
      if (!chatMsg.trim()) return
      const newMsg = { id: `c${Date.now()}`, user: 'Fabio Cozza', msg: chatMsg.trim(), time: new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), fase }
      setChatMessages(prev => ({ ...prev, [fase]: [...(prev[fase] || []), newMsg] }))
      setChatMsg('')
    }

    return (
      <div>
        {/* Tab bar */}
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setCommessaView('progetto')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: commessaView === 'progetto' ? AC + '12' : 'transparent', color: commessaView === 'progetto' ? AC : TX.textSec, border: `1px solid ${commessaView === 'progetto' ? AC + '30' : TX.border}` }}>Vista Progetto</button>
          <button onClick={() => setCommessaView('configuratore')} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: commessaView === 'configuratore' ? TH.blue + '12' : 'transparent', color: commessaView === 'configuratore' ? TH.blue : TX.textSec, border: `1px solid ${commessaView === 'configuratore' ? TH.blue + '30' : TX.border}` }}><Ic n="window" s={12}/> Configuratore ({serramenti.length})</button>
        </div>

        {commessaView === 'progetto' && (
          <div className="space-y-4">

            {/* ═══ INTERACTIVE PIPELINE HEADER ═══ */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: TX.text }}>Avanzamento Commessa</h3>
                  <span style={{ fontSize: 11, color: TX.textMuted }}>{overallPerc}% completato · Fase attuale da {daysInPhase}g</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 22, fontWeight: 800, color: si.color }}>{overallPerc}%</span>
                </div>
              </div>

              {/* Phase stepper */}
              <div className="flex items-center gap-1 mb-2">
                {STATI_COMMESSA.map((s, i) => {
                  const isPast = i < currentIdx
                  const isCurrent = i === currentIdx
                  const isFuture = i > currentIdx
                  const msgs = chatMessages[s.value] || []
                  return (
                    <div key={s.value} className="flex-1 cursor-pointer" onClick={() => setPhaseChat(phaseChat === s.value ? null : s.value)}>
                      {/* Phase bar */}
                      <div style={{ height: isCurrent ? 12 : 8, borderRadius: 6,
                        background: isPast ? TH.green : isCurrent ? `linear-gradient(90deg, ${si.color}, ${si.color}90)` : TX.bgHover,
                        transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}>
                        {isCurrent && (
                          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                            animation: 'none', borderRadius: 6 }} />
                        )}
                      </div>
                      {/* Phase label */}
                      <div className="text-center mt-1.5">
                        <div style={{ fontSize: isCurrent ? 10 : 8, fontWeight: isCurrent ? 800 : isPast ? 600 : 400,
                          color: isPast ? TH.green : isCurrent ? si.color : TX.textMuted }}>
                          {isPast ? '✓' : isCurrent ? '●' : ''} {s.label}
                        </div>
                        {/* Chat indicator */}
                        {msgs.length > 0 && (
                          <span style={{ fontSize: 7, padding: '0 4px', borderRadius: 4, background: isCurrent ? si.color + '15' : TX.bgHover,
                            color: isCurrent ? si.color : TX.textMuted, fontWeight: 600 }}>
                            💬 {msgs.length}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Quick advance button */}
              {currentIdx < STATI_COMMESSA.length - 1 && (
                <div className="flex justify-end mt-2">
                  <button onClick={() => updateCommessaStato(comm.id, STATI_COMMESSA[currentIdx + 1].value)}
                    style={{ padding: '5px 14px', background: STATI_COMMESSA[currentIdx + 1].color + '10', border: `1px solid ${STATI_COMMESSA[currentIdx + 1].color}30`,
                      borderRadius: 8, fontSize: 10, fontWeight: 700, color: STATI_COMMESSA[currentIdx + 1].color, cursor: 'pointer' }}>
                    Avanza → {STATI_COMMESSA[currentIdx + 1].label}
                  </button>
                </div>
              )}
            </Card>

            {/* ═══ PHASE CHAT PANEL ═══ */}
            {phaseChat && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATI_COMMESSA.find(s => s.value === phaseChat)?.color || AC }} />
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: TX.text }}>
                      Chat — {STATI_COMMESSA.find(s => s.value === phaseChat)?.label}
                    </h4>
                    <span style={{ fontSize: 9, color: TX.textMuted }}>({(chatMessages[phaseChat] || []).length} messaggi)</span>
                  </div>
                  <button onClick={() => setPhaseChat(null)} style={{ padding: '2px 8px', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 10, color: TX.textMuted }}>
                    <Ic n="x" s={10} c={TX.textMuted}/> Chiudi
                  </button>
                </div>

                {/* Messages */}
                <div className="space-y-2 mb-3" style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {(chatMessages[phaseChat] || []).length === 0 ? (
                    <div className="text-center py-6" style={{ fontSize: 11, color: TX.textMuted }}>Nessun messaggio in questa fase. Inizia la conversazione!</div>
                  ) : (chatMessages[phaseChat] || []).map(m => {
                    const isMe = m.user === 'Fabio Cozza'
                    return (
                      <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div style={{ maxWidth: '75%', padding: '8px 12px', borderRadius: 12,
                          background: isMe ? AC + '12' : BG.input,
                          border: `1px solid ${isMe ? AC + '20' : TX.border}`,
                          borderBottomRightRadius: isMe ? 4 : 12,
                          borderBottomLeftRadius: isMe ? 12 : 4 }}>
                          <div className="flex items-center gap-2 mb-1">
                            <span style={{ fontSize: 9, fontWeight: 700, color: isMe ? AC : TH.blue }}>{m.user}</span>
                            <span style={{ fontSize: 8, color: TX.textMuted }}>{m.time}</span>
                          </div>
                          <div style={{ fontSize: 11, color: TX.text, lineHeight: 1.5 }}>{m.msg}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && phaseChat) sendChat(phaseChat) }}
                    placeholder={`Scrivi nella fase ${STATI_COMMESSA.find(s => s.value === phaseChat)?.label}...`}
                    style={{ flex: 1, padding: '8px 12px', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 10, fontSize: 12, color: TX.text, outline: 'none' }} />
                  <button onClick={() => phaseChat && sendChat(phaseChat)}
                    style={{ padding: '8px 16px', background: AC, border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                    <Ic n="send" s={12} c="#fff"/> Invia
                  </button>
                </div>
              </Card>
            )}

            {/* ═══ TIMELINE EVENTI RECENTI ═══ */}
            <Card>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: TX.text, marginBottom: 12 }}><Ic n="clock" s={13} c={AC}/> Timeline Attività Recenti</h4>
              <div style={{ borderLeft: `2px solid ${TX.border}`, marginLeft: 6, paddingLeft: 16 }}>
                {[
                  { time: 'Oggi 09:30', event: 'Misure definitive prese', user: 'Luigi Ferraro', fase: 'misure', color: TH.blue },
                  { time: 'Ieri 14:00', event: 'Preventivo inviato al cliente (8.500€)', user: 'Fabio Cozza', fase: 'preventivo', color: TH.green },
                  { time: 'Ieri 10:22', event: 'Foto sopralluogo caricate', user: 'Luigi Ferraro', fase: 'sopralluogo', color: TH.green },
                  { time: '10/02 09:30', event: 'Sopralluogo completato', user: 'Luigi Ferraro', fase: 'sopralluogo', color: TH.green },
                  { time: '08/02 16:00', event: 'Commessa creata', user: 'Fabio Cozza', fase: '', color: AC },
                ].map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 mb-4 relative">
                    <div style={{ position: 'absolute', left: -22, top: 2, width: 10, height: 10, borderRadius: '50%', background: ev.color, border: `2px solid ${BG.card}` }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 9, color: TX.textMuted, fontFamily: 'monospace' }}>{ev.time}</span>
                        {ev.fase && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: ev.color + '12', color: ev.color, fontWeight: 600 }}>{ev.fase}</span>}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 500, color: TX.text, marginTop: 1 }}>{ev.event}</div>
                      <div style={{ fontSize: 9, color: TX.textMuted }}>{ev.user}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* ═══ ATTIVITÀ PER FASE (existing, improved) ═══ */}
            {progettoLoading ? <div className="text-center py-8"><p style={{ fontSize: 12, color: TX.textMuted }}>Caricamento attività...</p></div> : (
              <>
                {MACRO_FASI.map(mf => {
                  const acts = faseGroups[mf.key] || []; if (acts.length === 0) return null
                  const completate = acts.filter(a => a.stato === 'completata').length; const perc = acts.length > 0 ? Math.round((completate / acts.length) * 100) : 0
                  const isExpanded = expandedFase === mf.key
                  return (
                    <Card key={mf.key}>
                      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedFase(isExpanded ? null : mf.key)}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: mf.color + '12', color: mf.color }}>{mf.ordine}</div>
                          <div><h4 className="text-sm font-semibold" style={{ color: TX.text }}>{mf.label}</h4><span style={{ fontSize: 10, color: TX.textMuted }}>{completate}/{acts.length} completate</span></div>
                        </div>
                        <div className="flex items-center gap-3">
                          {/* Chat button for this phase */}
                          <button onClick={(e) => { e.stopPropagation(); setPhaseChat(phaseChat === mf.key ? null : mf.key) }}
                            style={{ padding: '3px 8px', borderRadius: 6, background: phaseChat === mf.key ? AC + '12' : BG.input, border: `1px solid ${phaseChat === mf.key ? AC + '30' : TX.border}`, cursor: 'pointer', fontSize: 9, color: phaseChat === mf.key ? AC : TX.textMuted }}>
                            💬 {(chatMessages[mf.key] || []).length}
                          </button>
                          <div className="w-20 h-2 rounded-full" style={{ background: TX.border }}><div className="h-2 rounded-full" style={{ width: `${perc}%`, background: perc === 100 ? TH.green : mf.color }} /></div>
                          <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: perc === 100 ? TH.green : mf.color }}>{perc}%</span>
                          <Ic n={isExpanded ? 'minus' : 'plus'} s={14} c={TX.textMuted}/>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-4 pt-3 space-y-2" style={{ borderTop: `1px solid ${TX.border}` }}>
                          {acts.map(a => {
                            const isActExpanded = expandedAttivita === a.id
                            return (
                              <div key={a.id} className="rounded-lg p-3" style={{ background: a.stato === 'completata' ? TH.green + '04' : a.stato === 'in_corso' ? TH.blue + '04' : BG.input, border: `1px solid ${a.stato === 'completata' ? TH.green + '15' : a.stato === 'in_corso' ? TH.blue + '15' : TX.border}` }}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => setExpandedAttivita(isActExpanded ? null : a.id)}>
                                    <button onClick={e => { e.stopPropagation(); const next = a.stato === 'da_fare' ? 'in_corso' : a.stato === 'in_corso' ? 'completata' : 'da_fare'; updateAttivitaStato(a.id, next) }} className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: a.stato === 'completata' ? TH.green : a.stato === 'in_corso' ? TH.blue + '20' : BG.input, border: `1.5px solid ${a.stato === 'completata' ? TH.green : a.stato === 'in_corso' ? TH.blue : TX.borderMed}` }}>
                                      {a.stato === 'completata' && <Ic n="check" s={12} c="#fff"/>}
                                      {a.stato === 'in_corso' && <Ic n="play" s={10} c={TH.blue}/>}
                                    </button>
                                    <span className="text-sm" style={{ color: a.stato === 'completata' ? TH.green : TX.text, textDecoration: a.stato === 'completata' ? 'line-through' : 'none', fontWeight: a.stato === 'in_corso' ? 600 : 400 }}>{a.titolo}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {a.obbligatoria && <span style={{ fontSize: 8, fontWeight: 700, color: TH.red, letterSpacing: 1 }}>OBBL.</span>}
                                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: TX.textMuted }}>{a.percentuale}%</span>
                                    <div className="w-16 h-1.5 rounded-full" style={{ background: TX.border }}><div className="h-1.5 rounded-full" style={{ width: `${a.percentuale}%`, background: a.stato === 'completata' ? TH.green : mf.color }} /></div>
                                  </div>
                                </div>
                                {isActExpanded && (
                                  <div className="mt-3 pt-3 space-y-3" style={{ borderTop: `1px solid ${TX.border}` }}>
                                    <div className="flex gap-2 flex-wrap">
                                      {[0, 10, 25, 50, 75, 100].map(p => (<button key={p} onClick={() => updateAttivitaPercentuale(a.id, p)} className="px-2 py-0.5 rounded text-xs" style={{ background: a.percentuale === p ? mf.color + '15' : BG.input, color: a.percentuale === p ? mf.color : TX.textMuted, border: `1px solid ${a.percentuale === p ? mf.color + '30' : TX.border}` }}>{p}%</button>))}
                                    </div>
                                    <div className="flex gap-3">
                                      <SelectField label="Assegnato a" value={a.assegnato_a || ''} onChange={v => updateAttivitaField(a.id, 'assegnato_a', v)} options={dipendenti.map(d => ({ value: d.id, label: `${d.nome} ${d.cognome}` }))} />
                                      <SelectField label="Priorità" value={a.priorita || 'media'} onChange={v => updateAttivitaField(a.id, 'priorita', v)} options={[{ value: 'bassa', label: 'Bassa' }, { value: 'media', label: 'Media' }, { value: 'alta', label: 'Alta' }, { value: 'urgente', label: 'Urgente' }]} />
                                    </div>
                                    {editingNote?.id === a.id ? (
                                      <div><textarea value={editingNote.note} onChange={e => setEditingNote({ ...editingNote, note: e.target.value })} className="w-full p-2 rounded-lg text-sm" rows={3} style={{ background: BG.input, border: `1px solid ${TX.borderMed}`, color: TX.text, resize: 'none' }} />
                                      <div className="flex gap-2 mt-1"><button onClick={() => saveAttivitaNote(a.id, editingNote.note)} className="px-2 py-1 rounded text-xs font-semibold" style={{ background: TH.green, color: '#fff' }}>Salva</button><button onClick={() => setEditingNote(null)} className="px-2 py-1 rounded text-xs" style={{ color: TX.textSec }}>Annulla</button></div></div>
                                    ) : (
                                      <div onClick={() => setEditingNote({ id: a.id, note: a.note || '' })} className="cursor-pointer p-2 rounded-lg" style={{ background: BG.input, border: `1px dashed ${TX.borderMed}` }}><span style={{ fontSize: 11, color: a.note ? TX.textSec : TX.textMuted }}>{a.note || 'Aggiungi note...'}</span></div>
                                    )}
                                    {a.data_inizio && <div style={{ fontSize: 10, color: TX.textMuted }}>Iniziata: {fmtDate(a.data_inizio)} {a.data_fine && `· Completata: ${fmtDate(a.data_fine)}`}</div>}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </Card>
                  )
                })}
                {commessaAttivita.length === 0 && <Card><div className="text-center py-8"><Ic n="clipboard" s={32} c={TX.textMuted}/><p style={{ fontSize: 12, color: TX.textMuted, marginTop: 8 }}>Nessuna attività configurata. Le attività vengono create automaticamente dal database.</p></div></Card>}
              </>
            )}

            {/* ═══ SEZIONE ALLEGATI ═══ */}
            {commessaView === 'progetto' && selectedCommessa && (
              <Card className="mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Ic n="paperclip" s={16} c={TH.purple}/>
                    <h3 className="font-semibold text-sm" style={{ color: TX.text }}>
                      Allegati <span style={{ fontSize: 11, color: TX.textMuted }}>(0)</span>
                    </h3>
                  </div>
                  <button
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    style={{ 
                      background: TH.purple + '15', 
                      color: TH.purple,
                      border: `1px solid ${TH.purple}30`,
                      cursor: 'pointer'
                    }}>
                    <Ic n="plus" s={14}/>
                    Carica File
                  </button>
                </div>

                {/* Lista allegati (vuota per ora) */}
                <div className="text-center py-8" style={{ color: TX.textMuted }}>
                  <Ic n="paperclip" s={32} c={TX.textMuted} style={{ opacity: 0.3 }}/>
                  <p className="text-xs mt-2">Nessun allegato caricato</p>
                  <p className="text-xs mt-1" style={{ color: TX.textMuted, opacity: 0.7 }}>
                    Carica PDF, foto, documenti relativi a questa commessa
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {commessaView === 'configuratore' && <ConfiguratoreFullScreen onClose={() => setCommessaView('progetto')} />}
      </div>
    )
  }


  // ==================== CONFIGURATORE SERRAMENTI FULL-SCREEN v3 ====================
  const CF = { bg: '#ECEEF2', panel: '#FFF', deep: '#F0F2F5', border: '#DDE1E8', borderM: '#CCD0D8', text: '#161923', sec: '#4B5066', muted: '#7C839A', amber: '#D97706', amberBg: '#FFF8EB', blue: '#2563EB', blueBg: '#EFF6FF', green: '#059669', greenBg: '#ECFDF5', red: '#DC2626', frame: '#4B5563', frameL: '#9CA3AF', glass: '#CADEFC', glassBrd: '#7CB8F0', dim: '#2563EB', dimBg: '#EFF6FF', hndl: '#B45309', hndlF: '#D97706', hinge: '#6B7280', canvas: '#F7F8FB', grid: '#EAECF0' }
  const CIc = ({ d, s = 16, c = 'currentColor', sw = 1.7 }: any) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>{d}</svg>
  const cic = { plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>, x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>, trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>, save: <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>, splitV: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></>, splitH: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></>, zoomIn: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></>, zoomOut: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></>, ruler: <><path d="M21 3L3 21M6.6 17.4l1.4 1.4M10.2 13.8l1.4 1.4M13.8 10.2l1.4 1.4M17.4 6.6l1.4 1.4"/></>, grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>, copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></>, folder: <><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></>, back: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></> }
  const CAPERT = [{ id: 'fisso', label: 'Fisso' }, { id: 'anta_dx', label: 'Anta DX' }, { id: 'anta_sx', label: 'Anta SX' }, { id: 'ar_dx', label: 'A-Rib. DX' }, { id: 'ar_sx', label: 'A-Rib. SX' }, { id: 'ribalta', label: 'Ribalta' }, { id: 'vasistas', label: 'Vasistas' }, { id: 'scorr_dx', label: 'Scorr. DX' }, { id: 'scorr_sx', label: 'Scorr. SX' }, { id: 'bilico_h', label: 'Bilico O' }, { id: 'bilico_v', label: 'Bilico V' }, { id: 'pannello', label: 'Pannello' }]
  const CVETRI = [{ id: 'v1', l: '4/16/4', ug: 2.7 }, { id: 'v2', l: '4/16/4BE', ug: 1.1 }, { id: 'v3', l: '4/16Ar/4BE', ug: 1.0 }, { id: 'v4', l: '4/20Ar/4BE', ug: 0.9 }, { id: 'v5', l: '4/14Ar/4/14Ar/4BE', ug: 0.6 }, { id: 'v6', l: '44.2/16Ar/4BE', ug: 1.0 }, { id: 'v7', l: '44.2/16Ar/33.1BE', ug: 1.0 }]
  const CCOLORI = [{ c: 'RAL 9010', n: 'Bianco puro', h: '#F7F5EF' }, { c: 'RAL 9016', n: 'Bianco traff.', h: '#F7FBF5' }, { c: 'RAL 7016', n: 'Grigio antr.', h: '#383E42' }, { c: 'RAL 8017', n: 'Marrone', h: '#44322D' }, { c: 'RAL 6005', n: 'Verde', h: '#0F4336' }, { c: 'RAL 7035', n: 'Grigio luce', h: '#C5C7C4' }, { c: 'RAL 9005', n: 'Nero', h: '#0E0E10' }, { c: 'Pell.', n: 'Noce', h: '#7B5B3A' }, { c: 'Pell.', n: 'Rovere', h: '#A8845A' }]
  const CTIP: any[] = [{ id: 't1', n: '1 Anta', w: 800, h: 1200, sp: [], ce: ['anta_dx'] }, { id: 't2', n: '1 A-Rib.', w: 800, h: 1200, sp: [], ce: ['ar_dx'] }, { id: 't3', n: '2 Ante', w: 1200, h: 1400, sp: [{ a: 'v', p: .5 }], ce: ['anta_sx', 'anta_dx'] }, { id: 't4', n: '2 A-Rib.', w: 1200, h: 1400, sp: [{ a: 'v', p: .5 }], ce: ['ar_sx', 'ar_dx'] }, { id: 't5', n: 'Fisso+A-R', w: 1400, h: 1400, sp: [{ a: 'v', p: .4 }], ce: ['fisso', 'ar_dx'] }, { id: 't6', n: 'Fisso', w: 1000, h: 1000, sp: [], ce: ['fisso'] }, { id: 't7', n: 'Vasistas', w: 800, h: 600, sp: [], ce: ['vasistas'] }, { id: 't8', n: 'PF 1 Anta', w: 900, h: 2200, sp: [], ce: ['anta_dx'] }, { id: 't9', n: 'PF 2 Ante', w: 1400, h: 2200, sp: [{ a: 'v', p: .5 }], ce: ['anta_sx', 'anta_dx'] }, { id: 't10', n: 'Scorrevole', w: 2000, h: 2200, sp: [{ a: 'v', p: .5 }], ce: ['scorr_sx', 'fisso'] }, { id: 't11', n: '2A+Sopral.', w: 1200, h: 1800, sp: [{ a: 'h', p: .28 }, { a: 'v', p: .5 }], ce: ['fisso', 'fisso', 'ar_sx', 'ar_dx'] }, { id: 't12', n: '3 Ante', w: 1800, h: 1400, sp: [{ a: 'v', p: .33 }, { a: 'v', p: .67 }], ce: ['anta_sx', 'fisso', 'anta_dx'] }, { id: 't13', n: 'Libera', w: 1200, h: 1400, sp: [], ce: ['fisso'] }]
  let _cuid = 0; const cuid = () => `cu${++_cuid}`
  const cmkCell = (ap = 'fisso') => ({ id: cuid(), ap, vetro: 'v3' })
  const cmkSer = (tip: any, num: number) => ({ id: cuid(), sigla: `F${num}`, W: tip.w, H: tip.h, mat: 'PVC', profW: 71, sistema: '', codTelaio: '', codAnte: '', colEst: CCOLORI[0], colInt: CCOLORI[0], splits: tip.sp.map((s: any) => ({ axis: s.a, pos: s.p })), cells: tip.ce.map((a: string) => cmkCell(a)), hMan: 1050, nPz: 1, canalina: 'Warm Edge', gas: 'Argon 90%', maniglia: 'Secustik std', cerniere: 'Standard nascosta', chiusure: 'Multipunto' })
  const cGetCells = (ser: any) => { const { splits, cells, W, H, profW: fw } = ser; const hS = splits.filter((s: any) => s.axis === 'h').sort((a: any, b: any) => a.pos - b.pos); const vS = splits.filter((s: any) => s.axis === 'v').sort((a: any, b: any) => a.pos - b.pos); const cols = [fw, ...vS.map((s: any) => W * s.pos), W - fw]; const rows = [fw, ...hS.map((s: any) => H * s.pos), H - fw]; const r: any[] = []; let ci = 0; for (let ri = 0; ri < rows.length - 1; ri++) for (let ci2 = 0; ci2 < cols.length - 1; ci2++) r.push({ c: cells[ci++] || cmkCell(), x: cols[ci2], y: rows[ri], w: cols[ci2 + 1] - cols[ci2], h: rows[ri + 1] - rows[ri] }); return r }
  const cDIN = ({ ap, x, y, w, h, sel }: any) => { const cx = x + w / 2, cy = y + h / 2, col = sel ? CF.blue : '#4D7EA8', sw = sel ? 2 : 1.2, da = '7 4', da2 = '4 3'; const L = (x1: number, y1: number, x2: number, y2: number, d = da, s = sw) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={s} strokeDasharray={d}/>; const m: any = { anta_dx: <g>{L(x + w, y, x, cy)}{L(x + w, y + h, x, cy)}</g>, anta_sx: <g>{L(x, y, x + w, cy)}{L(x, y + h, x + w, cy)}</g>, ar_dx: <g>{L(x + w, y, x, cy)}{L(x + w, y + h, x, cy)}{L(x, y + h, cx, y, da2, sw * .65)}{L(x + w, y + h, cx, y, da2, sw * .65)}</g>, ar_sx: <g>{L(x, y, x + w, cy)}{L(x, y + h, x + w, cy)}{L(x, y + h, cx, y, da2, sw * .65)}{L(x + w, y + h, cx, y, da2, sw * .65)}</g>, ribalta: <g>{L(x, y + h, cx, y)}{L(x + w, y + h, cx, y)}</g>, vasistas: <g>{L(x, y, cx, y + h)}{L(x + w, y, cx, y + h)}</g>, scorr_dx: <g><line x1={x + w * .2} y1={cy} x2={x + w * .75} y2={cy} stroke={col} strokeWidth={sw + 1}/><polygon points={`${x + w * .75},${cy - 6} ${x + w * .75 + 9},${cy} ${x + w * .75},${cy + 6}`} fill={col}/></g>, scorr_sx: <g><line x1={x + w * .25} y1={cy} x2={x + w * .8} y2={cy} stroke={col} strokeWidth={sw + 1}/><polygon points={`${x + w * .25},${cy - 6} ${x + w * .25 - 9},${cy} ${x + w * .25},${cy + 6}`} fill={col}/></g>, pannello: <g><line x1={x + 5} y1={y + 5} x2={x + w - 5} y2={y + h - 5} stroke={col} strokeWidth={sw * .7}/><line x1={x + w - 5} y1={y + 5} x2={x + 5} y2={y + h - 5} stroke={col} strokeWidth={sw * .7}/></g> }; return m[ap] || null }
  const cHH = (a: string) => ['anta_dx', 'anta_sx', 'ar_dx', 'ar_sx'].includes(a)
  const cIR = (a: string) => ['anta_dx', 'ar_dx'].includes(a)
  const cHM = (a: string) => !['fisso', 'pannello'].includes(a)
  const CSVGDraw = ({ ser, sc = .25, selId, onSel, dims = true, gridOn = true, onDragSplit }: any) => {
    const { W, H, profW, colEst, hMan, codTelaio } = ser; const sW = W * sc, sH = H * sc, fw = profW * sc, ox = 70, oy = 45, svgW = sW + 160, svgH = sH + 110, pi = Math.max(fw * .35, 3), pA = Math.max(fw * .22, 2); const cells = cGetCells(ser); const vLab = (vid: string) => CVETRI.find(v => v.id === vid)?.l || ''; const svgRef = useRef<SVGSVGElement>(null); const [drag, setDrag] = useState<any>(null)
    useEffect(() => { if (!drag) return; const onMove = (e: MouseEvent) => { const r = svgRef.current?.getBoundingClientRect(); if (!r) return; const v = drag.axis === 'v' ? (e.clientX - r.left - ox) / sW : (e.clientY - r.top - oy) / sH; onDragSplit?.(drag.idx, Math.max(.1, Math.min(.9, v))) }; const onUp = () => setDrag(null); window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) } }, [drag, sW, sH, onDragSplit])
    return (<svg ref={svgRef} width={svgW} height={svgH} style={{ display: 'block', userSelect: 'none' }}>
      {gridOn && <><defs><pattern id="cgp" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0L0 0 0 20" fill="none" stroke={CF.grid} strokeWidth=".4"/></pattern></defs><rect width={svgW} height={svgH} fill="url(#cgp)"/></>}
      <defs><marker id="caR" markerWidth="7" markerHeight="7" refX="7" refY="3.5" orient="auto"><path d="M0,0L7,3.5L0,7" fill={CF.dim}/></marker><marker id="caL" markerWidth="7" markerHeight="7" refX="0" refY="3.5" orient="auto"><path d="M7,0L0,3.5L7,7" fill={CF.dim}/></marker></defs>
      <rect x={ox + 5} y={oy + 5} width={sW} height={sH} rx={1} fill="rgba(0,0,0,.07)"/>
      <rect x={ox} y={oy} width={sW} height={sH} fill={colEst?.h || '#F7F5EF'} stroke={CF.frame} strokeWidth={2.5} rx={.5}/>
      <rect x={ox + pi} y={oy + pi} width={sW - 2 * pi} height={sH - 2 * pi} fill="none" stroke={CF.frame} strokeWidth={1} rx={.5}/>
      <rect x={ox + fw} y={oy + fw} width={sW - 2 * fw} height={sH - 2 * fw} fill="none" stroke={CF.frame} strokeWidth={1.5}/>
      {cells.map((cr: any) => { const cx = ox + cr.x * sc, cy = oy + cr.y * sc, cw = cr.w * sc, ch = cr.h * sc, sel = selId === cr.c.id, isGl = cr.c.ap !== 'pannello', isOp = cHH(cr.c.ap) || cr.c.ap === 'ribalta' || cr.c.ap === 'vasistas'; return (<g key={cr.c.id} onClick={(e: any) => { e.stopPropagation(); onSel?.(cr.c.id) }} style={{ cursor: 'pointer' }}>
        {isOp && <><rect x={cx + pA} y={cy + pA} width={cw - 2 * pA} height={ch - 2 * pA} fill="none" stroke={CF.frame} strokeWidth={1.2} rx={.5}/><rect x={cx + pA + pi * .7} y={cy + pA + pi * .7} width={cw - 2 * (pA + pi * .7)} height={ch - 2 * (pA + pi * .7)} fill="none" stroke={CF.frameL} strokeWidth={.6}/></>}
        <rect x={cx + fw * .6} y={cy + fw * .6} width={cw - fw * 1.2} height={ch - fw * 1.2} fill={isGl ? CF.glass : '#D0D3DA'} fillOpacity={isGl ? .3 : .4} stroke={sel ? CF.blue : isGl ? CF.glassBrd : CF.borderM} strokeWidth={sel ? 2.5 : .6} rx={.5}/>
        {isGl && cw > 50 && ch > 50 && <g opacity={.1}><line x1={cx + cw * .2} y1={cy + ch * .15} x2={cx + cw * .4} y2={cy + ch * .85} stroke="#3B82F6" strokeWidth={2}/><line x1={cx + cw * .3} y1={cy + ch * .12} x2={cx + cw * .5} y2={cy + ch * .82} stroke="#3B82F6" strokeWidth={1.2}/></g>}
        {cDIN({ ap: cr.c.ap, x: cx + fw * .7, y: cy + fw * .7, w: cw - fw * 1.4, h: ch - fw * 1.4, sel })}
        {cHM(cr.c.ap) && (() => { const hL = Math.min(18, ch * .08) * Math.max(sc / .25, .5), hW = Math.max(3, 4 * (sc / .25)), bW = hW * 1.6, bH = hL * .3; if (cIR(cr.c.ap)) { const hx = cx + pA + 4, hy = cy + ch * .48; return <g><rect x={hx} y={hy - bH / 2} width={bW} height={bH} rx={1.5} fill={CF.hndlF} stroke={CF.hndl} strokeWidth={.6}/><rect x={hx + 1} y={hy - hL / 2} width={hW} height={hL} rx={1} fill={CF.hndlF} stroke={CF.hndl} strokeWidth={.5}/></g> } if (cr.c.ap === 'anta_sx' || cr.c.ap === 'ar_sx') { const hx = cx + cw - pA - 4 - bW, hy = cy + ch * .48; return <g><rect x={hx} y={hy - bH / 2} width={bW} height={bH} rx={1.5} fill={CF.hndlF} stroke={CF.hndl} strokeWidth={.6}/><rect x={hx + bW - hW - 1} y={hy - hL / 2} width={hW} height={hL} rx={1} fill={CF.hndlF} stroke={CF.hndl} strokeWidth={.5}/></g> } if (cr.c.ap === 'ribalta' || cr.c.ap === 'vasistas') { const hx = cx + cw * .48, hy = cy + ch - pA - 5; return <g><rect x={hx - bH / 2} y={hy - bW} width={bH} height={bW} rx={1.5} fill={CF.hndlF} stroke={CF.hndl} strokeWidth={.6}/><rect x={hx - hL / 2} y={hy - hW - 1} width={hL} height={hW} rx={1} fill={CF.hndlF} stroke={CF.hndl} strokeWidth={.5}/></g> } return null })()}
        {cHH(cr.c.ap) && [.18, .5, .82].map(p => { const hW2 = Math.max(6, 8 * (sc / .25)), hH2 = Math.max(3, 4 * (sc / .25)), hx2 = cIR(cr.c.ap) ? cx + cw - pA - 1 : cx + pA - hW2 + 1, hy2 = cy + ch * p - hH2 / 2; return <g key={p}><rect x={hx2} y={hy2} width={hW2} height={hH2} rx={1} fill="#E5E7EB" stroke={CF.hinge} strokeWidth={.7}/></g> })}
        {cw > 70 && ch > 50 && <text x={cx + cw / 2} y={cy + ch - fw * .7 - 4} textAnchor="middle" fontSize={Math.min(9, cw / 12)} fill="#5B88A8" fontFamily="monospace" fontWeight={600} opacity={.6}>V{vLab(cr.c.vetro)}</text>}
        <text x={cx + cw / 2} y={cy + fw * .7 + 10} textAnchor="middle" fontSize={Math.min(8, cw / 15)} fill={CF.muted} fontFamily="monospace" opacity={.6}>{Math.round(cr.w)}×{Math.round(cr.h)}</text>
        {sel && <rect x={cx + 1} y={cy + 1} width={cw - 2} height={ch - 2} fill="none" stroke={CF.blue} strokeWidth={1} strokeDasharray="4 2" rx={1} opacity={.4}/>}
      </g>) })}
      {ser.splits.map((s: any, i: number) => { const spW = Math.max(fw * .3, 4); if (s.axis === 'h') { const sy = oy + H * s.pos * sc; return <g key={`sp${i}`}><rect x={ox + pi} y={sy - spW / 2} width={sW - 2 * pi} height={spW} fill={colEst?.h || '#F7F5EF'} stroke={CF.frame} strokeWidth={1.2} rx={.5}/><rect x={ox} y={sy - 8} width={sW} height={16} fill="transparent" style={{ cursor: 'ns-resize' }} onMouseDown={(e: any) => { e.preventDefault(); setDrag({ idx: i, axis: 'h' }) }}/></g> } else { const sx = ox + W * s.pos * sc; return <g key={`sp${i}`}><rect x={sx - spW / 2} y={oy + pi} width={spW} height={sH - 2 * pi} fill={colEst?.h || '#F7F5EF'} stroke={CF.frame} strokeWidth={1.2} rx={.5}/><rect x={sx - 8} y={oy} width={16} height={sH} fill="transparent" style={{ cursor: 'ew-resize' }} onMouseDown={(e: any) => { e.preventDefault(); setDrag({ idx: i, axis: 'v' }) }}/></g> } })}
      {codTelaio && <><text x={ox + sW / 2} y={oy - 8} textAnchor="middle" fontSize={7.5} fill={CF.muted} fontFamily="monospace" fontWeight={600}>{codTelaio}</text><text x={ox + sW / 2} y={oy + sH + 16} textAnchor="middle" fontSize={7.5} fill={CF.muted} fontFamily="monospace" fontWeight={600}>{codTelaio}</text></>}
      {dims && <><line x1={ox} y1={oy + sH + 28} x2={ox + sW} y2={oy + sH + 28} stroke={CF.dim} strokeWidth={1} markerEnd="url(#caR)" markerStart="url(#caL)"/><line x1={ox} y1={oy + sH + 22} x2={ox} y2={oy + sH + 34} stroke={CF.dim} strokeWidth={.6}/><line x1={ox + sW} y1={oy + sH + 22} x2={ox + sW} y2={oy + sH + 34} stroke={CF.dim} strokeWidth={.6}/><rect x={ox + sW / 2 - 24} y={oy + sH + 19} width={48} height={18} rx={3} fill={CF.dimBg} stroke={CF.dim} strokeWidth={.5}/><text x={ox + sW / 2} y={oy + sH + 32} textAnchor="middle" fontSize={12} fill={CF.dim} fontWeight={800} fontFamily="monospace">{W}</text><line x1={ox + sW + 28} y1={oy} x2={ox + sW + 28} y2={oy + sH} stroke={CF.dim} strokeWidth={1}/><line x1={ox + sW + 22} y1={oy} x2={ox + sW + 34} y2={oy} stroke={CF.dim} strokeWidth={.6}/><line x1={ox + sW + 22} y1={oy + sH} x2={ox + sW + 34} y2={oy + sH} stroke={CF.dim} strokeWidth={.6}/><rect x={ox + sW + 18} y={oy + sH / 2 - 9} width={20} height={18} rx={3} fill={CF.dimBg} stroke={CF.dim} strokeWidth={.5}/><text x={ox + sW + 28} y={oy + sH / 2 + 4} textAnchor="middle" fontSize={12} fill={CF.dim} fontWeight={800} fontFamily="monospace" transform={`rotate(-90,${ox + sW + 28},${oy + sH / 2})`}>{H}</text>{hMan > 0 && <g><line x1={ox - 24} y1={oy + sH} x2={ox - 24} y2={oy + sH - hMan * sc} stroke={CF.hndlF} strokeWidth={.8}/><line x1={ox - 28} y1={oy + sH} x2={ox - 20} y2={oy + sH} stroke={CF.hndlF} strokeWidth={.6}/><line x1={ox - 28} y1={oy + sH - hMan * sc} x2={ox - 20} y2={oy + sH - hMan * sc} stroke={CF.hndlF} strokeWidth={.6}/><rect x={ox - 44} y={oy + sH - hMan * sc - 7} width={36} height={14} rx={2} fill={CF.amberBg} stroke={CF.hndlF} strokeWidth={.4}/><text x={ox - 26} y={oy + sH - hMan * sc + 3} textAnchor="middle" fontSize={8} fill={CF.hndlF} fontFamily="monospace" fontWeight={700}>{hMan}</text></g>}<text x={ox + sW} y={oy + sH + 52} textAnchor="end" fontSize={9} fill={CF.blue} fontWeight={600} fontStyle="italic" opacity={.7}>Vista interna</text></>}
    </svg>)
  }
  const ConfiguratoreFullScreen = ({ onClose }: { onClose: () => void }) => {
    const [cSers, setCsers] = useState([cmkSer(CTIP[3], 1), cmkSer(CTIP[7], 2)]); const [cAi, setCai] = useState(0); const [cSelId, setCselId] = useState<string | null>(null); const [cTab, setCtab] = useState('dim'); const [cShowList, setCshowList] = useState(true); const [cZoom, setCzoom] = useState(.28); const [cShowDims, setCshowDims] = useState(true); const [cShowGrid, setCshowGrid] = useState(true); const [cShowTip, setCshowTip] = useState(false)
    const cAct = cSers[cAi]; const cSelCell = cAct?.cells.find((c: any) => c.id === cSelId) || cAct?.cells[0]
    const cUpd = useCallback((fn: any) => { setCsers((p: any) => { const n = [...p]; const s = { ...n[cAi] }; fn(s); n[cAi] = s; return n }) }, [cAi])
    const cUpdC = useCallback((cid: string, k: string, v: any) => cUpd((s: any) => { s.cells = s.cells.map((c: any) => c.id === cid ? { ...c, [k]: v } : c) }), [cUpd])
    const cAddTip = (t: any) => { setCsers((p: any) => [...p, cmkSer(t, p.length + 1)]); setCai(cSers.length); setCselId(null); setCshowTip(false) }
    const cDup = (i: number) => { const o = JSON.parse(JSON.stringify(cSers[i])); o.id = cuid(); o.sigla += 'b'; o.cells.forEach((c: any) => c.id = cuid()); setCsers((p: any) => [...p.slice(0, i + 1), o, ...p.slice(i + 1)]); setCai(i + 1) }
    const cDel = (i: number) => { if (cSers.length <= 1) return; setCsers((p: any) => p.filter((_: any, j: number) => j !== i)); setCai(Math.max(0, cAi >= i ? cAi - 1 : cAi)) }
    const cAddSplit = (axis: string) => { cUpd((s: any) => { const ex = s.splits.filter((sp: any) => sp.axis === axis).map((e: any) => e.pos); const pts = [0, ...ex, 1].sort((a: number, b: number) => a - b); let best = .5, maxG = 0; for (let i = 0; i < pts.length - 1; i++) { const g = pts[i + 1] - pts[i]; if (g > maxG) { maxG = g; best = (pts[i] + pts[i + 1]) / 2 } }; s.splits = [...s.splits, { axis, pos: best }]; s.cells = [...s.cells, cmkCell()] }) }
    const cDragSplit = useCallback((idx: number, newPos: number) => { cUpd((s: any) => { s.splits = s.splits.map((sp: any, i: number) => i === idx ? { ...sp, pos: newPos } : sp) }) }, [cUpd])
    const cRemoveSplit = (idx: number) => cUpd((s: any) => { s.splits = s.splits.filter((_: any, i: number) => i !== idx); if (s.cells.length > 1) s.cells = s.cells.slice(0, -1) })
    if (!cAct) return null
    const CLabel = ({ children }: any) => <label style={{ display: 'block', fontSize: 8.5, fontWeight: 700, color: CF.muted, textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 3, marginTop: 8 }}>{children}</label>
    const CInp = ({ label, value, onChange, type = 'text', unit, ...p }: any) => <div style={{ marginBottom: 6 }}><CLabel>{label}</CLabel><div style={{ display: 'flex', alignItems: 'center', gap: 3 }}><input type={type} value={value} onChange={(e: any) => onChange(type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)} style={{ flex: 1, padding: '5px 7px', background: CF.deep, border: `1px solid ${CF.border}`, borderRadius: 4, fontSize: 12, color: CF.text, outline: 'none', fontFamily: type === 'number' ? 'monospace' : 'inherit' }} {...p}/>{unit && <span style={{ fontSize: 9, color: CF.muted }}>{unit}</span>}</div></div>
    const CSel = ({ label, value, onChange, opts }: any) => <div style={{ marginBottom: 6 }}><CLabel>{label}</CLabel><select value={value} onChange={(e: any) => onChange(e.target.value)} style={{ width: '100%', padding: '5px 7px', background: CF.deep, border: `1px solid ${CF.border}`, borderRadius: 4, fontSize: 11, color: CF.text, outline: 'none' }}>{opts.map((o: string) => <option key={o}>{o}</option>)}</select></div>
    const cTabs = [{ id: 'dim', l: 'Dimensioni' }, { id: 'ap', l: 'Apertura' }, { id: 'prof', l: 'Profilo' }, { id: 'vetro', l: 'Vetro' }, { id: 'ferr', l: 'Ferramenta' }]
    return (<div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: CF.bg, fontFamily: "-apple-system,sans-serif" }}>
      <div style={{ height: 44, background: '#1E293B', display: 'flex', alignItems: 'center', padding: '0 10px', gap: 5, flexShrink: 0 }}>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 4, color: '#94A3B8', fontSize: 10, cursor: 'pointer' }}><CIc d={cic.back} s={12} c="#94A3B8"/> Chiudi</button>
        <button onClick={() => setCshowTip(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 4, color: '#94A3B8', fontSize: 10, cursor: 'pointer' }}><CIc d={cic.folder} s={12} c="#94A3B8"/> Tipologie</button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.08)' }}/><span style={{ fontSize: 12, fontWeight: 800, color: '#F8FAFC' }}>CONFIGURATORE</span><span style={{ fontSize: 10, color: '#64748B', marginLeft: 6 }}>{cAct.sigla} — {cAct.W}×{cAct.H} {cAct.mat}</span><div style={{ flex: 1 }}/>
        <div style={{ display: 'flex', gap: 1, padding: 2, background: 'rgba(255,255,255,.04)', borderRadius: 4 }}>
          <button onClick={() => cAddSplit('v')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 10, cursor: 'pointer' }}><CIc d={cic.splitV} s={12} c="#94A3B8"/> Montante</button>
          <button onClick={() => cAddSplit('h')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 7px', background: 'transparent', border: 'none', color: '#94A3B8', fontSize: 10, cursor: 'pointer' }}><CIc d={cic.splitH} s={12} c="#94A3B8"/> Traverso</button>
        </div>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.08)' }}/>
        <button onClick={() => setCzoom(z => Math.max(.1, z - .04))} style={{ padding: 3, background: 'transparent', border: 'none', cursor: 'pointer' }}><CIc d={cic.zoomOut} s={13} c="#94A3B8"/></button><span style={{ fontSize: 9, color: '#475569', minWidth: 28, textAlign: 'center' }}>{Math.round(cZoom * 100)}%</span><button onClick={() => setCzoom(z => Math.min(.6, z + .04))} style={{ padding: 3, background: 'transparent', border: 'none', cursor: 'pointer' }}><CIc d={cic.zoomIn} s={13} c="#94A3B8"/></button>
        <button onClick={() => setCshowDims(!cShowDims)} style={{ padding: 3, background: cShowDims ? 'rgba(37,99,235,.15)' : 'transparent', border: 'none', borderRadius: 3, cursor: 'pointer' }}><CIc d={cic.ruler} s={13} c={cShowDims ? '#60A5FA' : '#475569'}/></button>
        <button onClick={() => setCshowGrid(!cShowGrid)} style={{ padding: 3, background: cShowGrid ? 'rgba(37,99,235,.15)' : 'transparent', border: 'none', borderRadius: 3, cursor: 'pointer' }}><CIc d={cic.grid} s={13} c={cShowGrid ? '#60A5FA' : '#475569'}/></button>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.08)' }}/><button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: CF.amber, border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}><CIc d={cic.save} s={12} c="#fff"/> Salva</button>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {cShowList && <div style={{ width: 200, background: CF.panel, borderRight: `1px solid ${CF.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${CF.border}` }}><span style={{ fontSize: 9, fontWeight: 700, color: CF.muted, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Serramenti ({cSers.length})</span><button onClick={() => setCshowTip(true)} style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: CF.amberBg, border: `1px solid ${CF.amber}25`, borderRadius: 4, cursor: 'pointer' }}><CIc d={cic.plus} s={11} c={CF.amber}/></button></div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 4 }}>{cSers.map((s: any, i: number) => <div key={s.id} onClick={() => { setCai(i); setCselId(null) }} style={{ padding: '6px 8px', marginBottom: 2, borderRadius: 6, cursor: 'pointer', background: i === cAi ? CF.blueBg : 'transparent', border: `1px solid ${i === cAi ? CF.blue + '20' : 'transparent'}` }}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 12, fontWeight: 700, color: i === cAi ? CF.blue : CF.text }}>{s.sigla}</span><div style={{ display: 'flex', gap: 2 }}><button onClick={(e: any) => { e.stopPropagation(); cDup(i) }} style={{ padding: 1, background: 'none', border: 'none', cursor: 'pointer', opacity: .3 }}><CIc d={cic.copy} s={10} c={CF.sec}/></button><button onClick={(e: any) => { e.stopPropagation(); cDel(i) }} style={{ padding: 1, background: 'none', border: 'none', cursor: 'pointer', opacity: .3 }}><CIc d={cic.trash} s={10} c={CF.red}/></button></div></div><div style={{ fontSize: 9, color: CF.muted }}>{s.W}×{s.H} · {s.mat}</div><div style={{ marginTop: 3, display: 'flex', justifyContent: 'center' }}><CSVGDraw ser={s} sc={.045} dims={false} gridOn={false}/></div></div>)}</div>
        </div>}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: CF.canvas, position: 'relative' }}>
          <button onClick={() => setCshowList(!cShowList)} style={{ position: 'absolute', top: 5, left: 5, zIndex: 10, padding: '2px 6px', background: CF.panel, border: `1px solid ${CF.border}`, borderRadius: 4, cursor: 'pointer', fontSize: 9, color: CF.sec }}>{cShowList ? '◀' : '▶'}</button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: 12 }}><CSVGDraw ser={cAct} sc={cZoom} selId={cSelId || cAct.cells[0]?.id} onSel={setCselId} dims={cShowDims} gridOn={cShowGrid} onDragSplit={cDragSplit}/></div>
          {cAct.splits.length > 0 && <div style={{ padding: '4px 8px', background: CF.panel, borderTop: `1px solid ${CF.border}`, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}><span style={{ fontSize: 8, color: CF.muted, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 1 }}>Divisioni:</span>{cAct.splits.map((s: any, i: number) => <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 5px', background: CF.deep, borderRadius: 3, border: `1px solid ${CF.border}`, fontSize: 9, color: CF.sec }}>{s.axis === 'h' ? 'Trav.' : 'Mont.'} {Math.round(s.pos * cAct.W)}mm <button onClick={() => cRemoveSplit(i)} style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer' }}><CIc d={cic.x} s={8} c={CF.red}/></button></div>)}<span style={{ fontSize: 8, color: CF.muted, fontStyle: 'italic' }}>— Trascina</span></div>}
        </div>
        <div style={{ width: 280, background: CF.panel, borderLeft: `1px solid ${CF.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${CF.border}`, flexShrink: 0 }}>{cTabs.map(t => <button key={t.id} onClick={() => setCtab(t.id)} style={{ flex: 1, padding: '8px 2px', fontSize: 9, fontWeight: 600, border: 'none', cursor: 'pointer', borderBottom: cTab === t.id ? `2px solid ${CF.amber}` : '2px solid transparent', background: cTab === t.id ? CF.amberBg : 'transparent', color: cTab === t.id ? CF.amber : CF.muted }}>{t.l}</button>)}</div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
            {cTab === 'dim' && <div><CInp label="Sigla" value={cAct.sigla} onChange={(v: any) => cUpd((s: any) => { s.sigla = v })}/><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}><CInp label="Larghezza" value={cAct.W} onChange={(v: any) => cUpd((s: any) => { s.W = v })} type="number" unit="mm"/><CInp label="Altezza" value={cAct.H} onChange={(v: any) => cUpd((s: any) => { s.H = v })} type="number" unit="mm"/></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}><CInp label="H Maniglia" value={cAct.hMan} onChange={(v: any) => cUpd((s: any) => { s.hMan = v })} type="number" unit="mm"/><CInp label="N° Pezzi" value={cAct.nPz} onChange={(v: any) => cUpd((s: any) => { s.nPz = v })} type="number"/></div><CLabel>Misure rapide</CLabel><div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 8 }}>{[[600,600],[800,1000],[1000,1200],[1200,1400],[900,2200],[1400,1600],[1600,2200],[2000,2200]].map(([w, h]) => <button key={`${w}${h}`} onClick={() => cUpd((s: any) => { s.W = w; s.H = h })} style={{ padding: '3px 5px', fontSize: 9, background: cAct.W === w && cAct.H === h ? CF.blueBg : CF.deep, border: `1px solid ${cAct.W === w && cAct.H === h ? CF.blue + '30' : CF.border}`, borderRadius: 3, cursor: 'pointer', color: cAct.W === w && cAct.H === h ? CF.blue : CF.muted, fontFamily: 'monospace' }}>{w}×{h}</button>)}</div></div>}
            {cTab === 'ap' && <div><div style={{ fontSize: 9, color: CF.blue, padding: '4px 7px', background: CF.blueBg, borderRadius: 4, marginBottom: 8 }}>Clicca una cella, poi scegli apertura.</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>{CAPERT.map(a => { const on = cSelCell?.ap === a.id; return <button key={a.id} onClick={() => cSelCell && cUpdC(cSelCell.id, 'ap', a.id)} style={{ padding: '7px 3px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderRadius: 5, cursor: 'pointer', background: on ? CF.amberBg : CF.deep, border: `1.5px solid ${on ? CF.amber : CF.border}`, color: on ? CF.amber : CF.sec }}><svg width={30} height={30} viewBox="0 0 40 40"><rect x={2} y={2} width={36} height={36} fill={on ? '#FEF3C7' : '#F5F6F8'} stroke={on ? CF.amber : CF.borderM} strokeWidth={1.2} rx={2}/>{cDIN({ ap: a.id, x: 6, y: 6, w: 28, h: 28, sel: on })}</svg><span style={{ fontSize: 8.5, fontWeight: 600 }}>{a.label}</span></button> })}</div></div>}
            {cTab === 'prof' && <div><CSel label="Materiale" value={cAct.mat} onChange={(v: any) => cUpd((s: any) => { s.mat = v })} opts={['PVC', 'Alluminio', 'Legno', 'Legno/Alluminio', 'Acciaio']}/><CInp label="Largh. profilo" value={cAct.profW} onChange={(v: any) => cUpd((s: any) => { s.profW = v })} type="number" unit="mm"/><CInp label="Sistema" value={cAct.sistema} onChange={(v: any) => cUpd((s: any) => { s.sistema = v })} placeholder="Schüco, Rehau..."/><CInp label="Cod. Telaio" value={cAct.codTelaio} onChange={(v: any) => cUpd((s: any) => { s.codTelaio = v })} placeholder="14XX07+R"/><CInp label="Cod. Anta" value={cAct.codAnte} onChange={(v: any) => cUpd((s: any) => { s.codAnte = v })} placeholder="14XX22+R"/><CLabel>Colore esterno</CLabel><div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>{CCOLORI.map(col => <button key={col.c + col.n} onClick={() => cUpd((s: any) => { s.colEst = col })} title={`${col.c} ${col.n}`} style={{ width: 24, height: 24, borderRadius: 4, background: col.h, border: `2px solid ${cAct.colEst?.n === col.n ? CF.blue : 'rgba(0,0,0,.1)'}`, cursor: 'pointer' }}/>)}</div><CLabel>Colore interno</CLabel><div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>{CCOLORI.slice(0, 5).map(col => <button key={col.c + col.n} onClick={() => cUpd((s: any) => { s.colInt = col })} style={{ width: 24, height: 24, borderRadius: 4, background: col.h, border: `2px solid ${cAct.colInt?.n === col.n ? CF.blue : 'rgba(0,0,0,.1)'}`, cursor: 'pointer' }}/>)}</div></div>}
            {cTab === 'vetro' && <div><div style={{ fontSize: 9, color: CF.blue, padding: '4px 7px', background: CF.blueBg, borderRadius: 4, marginBottom: 8 }}>Vetro per cella selezionata.</div>{CVETRI.map(v => { const on = cSelCell?.vetro === v.id; return <button key={v.id} onClick={() => cSelCell && cUpdC(cSelCell.id, 'vetro', v.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 9px', marginBottom: 3, borderRadius: 5, cursor: 'pointer', textAlign: 'left', background: on ? CF.greenBg : CF.deep, border: `1.5px solid ${on ? CF.green : CF.border}` }}><span style={{ fontSize: 11, fontWeight: 600, color: on ? CF.green : CF.text, fontFamily: 'monospace' }}>{v.l}</span><span style={{ fontSize: 10, fontWeight: 700, color: on ? CF.green : CF.blue, fontFamily: 'monospace' }}>Ug {v.ug}</span></button> })}<CSel label="Canalina" value={cAct.canalina} onChange={(v: any) => cUpd((s: any) => { s.canalina = v })} opts={['Alluminio', 'Warm Edge', 'Warm Edge (TGI)', 'Super Spacer']}/><CSel label="Gas" value={cAct.gas} onChange={(v: any) => cUpd((s: any) => { s.gas = v })} opts={['Aria', 'Argon 90%', 'Argon 95%', 'Kripton']}/></div>}
            {cTab === 'ferr' && <div><CSel label="Maniglia" value={cAct.maniglia} onChange={(v: any) => cUpd((s: any) => { s.maniglia = v })} opts={['Secustik std', 'Hoppe Atlanta', 'Hoppe Tokyo', 'Roto Line', 'Maco Multi Matic']}/><CSel label="Cerniere" value={cAct.cerniere} onChange={(v: any) => cUpd((s: any) => { s.cerniere = v })} opts={['Standard nascosta', 'A scomparsa', 'Roto NT', 'Maco Multi Power', 'GU Uni-Jet']}/><CSel label="Chiusure" value={cAct.chiusure} onChange={(v: any) => cUpd((s: any) => { s.chiusure = v })} opts={['Multipunto', 'RC1', 'RC2', 'RC3', 'Micro-ventilazione']}/></div>}
          </div>
          <div style={{ padding: '6px 12px', borderTop: `1px solid ${CF.border}`, background: CF.deep, fontSize: 9, color: CF.muted }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{cAct.cells.length} celle · {cAct.splits.length} div.</span><span style={{ fontFamily: 'monospace', fontWeight: 700, color: CF.green }}>Ug {CVETRI.find(v => v.id === cSelCell?.vetro)?.ug || '—'}</span></div></div>
        </div>
      </div>
      {cShowTip && <div style={{ position: 'absolute', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setCshowTip(false)}><div style={{ width: '75%', maxWidth: 800, maxHeight: '75vh', background: CF.panel, borderRadius: 10, overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,.2)' }} onClick={(e: any) => e.stopPropagation()}><div style={{ padding: '14px 18px', borderBottom: `1px solid ${CF.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 14, fontWeight: 700 }}>Aggiungi da tipologia</span><button onClick={() => setCshowTip(false)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}><CIc d={cic.x} s={16} c={CF.muted}/></button></div><div style={{ padding: 14, overflowY: 'auto', maxHeight: '60vh' }}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>{CTIP.map((t: any) => <div key={t.id} onClick={() => cAddTip(t)} style={{ background: CF.deep, border: `1px solid ${CF.border}`, borderRadius: 7, padding: 10, cursor: 'pointer', textAlign: 'center' }}><div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}><CSVGDraw ser={cmkSer(t, 1)} sc={.035} dims={false} gridOn={false}/></div><div style={{ fontSize: 11, fontWeight: 700, color: CF.text }}>{t.n}</div><div style={{ fontSize: 9, color: CF.amber, fontFamily: 'monospace' }}>{t.w}×{t.h}</div></div>)}</div></div></div></div>}
    </div>)
  }


  // ==================== DASHBOARD CONTENT ====================
  const searchResults = globalSearch.length > 1 ? {
    commesse: commesse.filter(c => [c.codice, c.titolo, c.cliente?.nome, c.cliente?.cognome, c.citta].join(' ').toLowerCase().includes(globalSearch.toLowerCase())),
    eventi: calEventi.filter(e => [e.titolo, e.cliente?.nome, e.tipo].join(' ').toLowerCase().includes(globalSearch.toLowerCase())),
    clienti: clienti.filter(c => [c.nome, c.cognome, c.citta, c.telefono].join(' ').toLowerCase().includes(globalSearch.toLowerCase())),
  } : null


  const ConfiguratoreContent = () => {
    const confTabs = [
      {id:'profili',label:'Profili',icon:'layers',count:confProfili.length},
      {id:'accessori',label:'Accessori',icon:'wrench',count:confAccessori.length},
      {id:'kit',label:'Kit',icon:'package',count:confKit.length},
      {id:'vetri',label:'Vetri & Pannelli',icon:'diamond',count:confVetri.length},
      {id:'tipologie',label:'Tipologie',icon:'window',count:0},
    ]


    // ── PROFILI ──
    const ProfiliSection = () => (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm" style={{color:TX.text}}>Profili DXF/DWG</h3>
            <p style={{fontSize:11,color:TX.textMuted}}>Importa e gestisci i profili con sezioni reali</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-xl flex items-center gap-2" style={{padding:'6px 14px',background:BG.input,border:`1px solid ${TX.border}`,color:TX.textSec,fontSize:11,fontWeight:600,cursor:'pointer'}}><Ic n="file" s={13}/>Importa DXF</button>
            <button onClick={()=>setShowNewProfilo(true)} className="rounded-xl flex items-center gap-2" style={{padding:'6px 14px',background:TH.amber,border:'none',color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}><Ic n="plus" s={13} c="#fff"/>Nuovo profilo</button>
          </div>
        </div>
        {showNewProfilo && (
          <div className="rounded-xl p-4 mb-4" style={{background:BG.card,border:`1px solid ${TH.amber}30`,boxShadow:isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow}}>
            <div className="flex items-center justify-between mb-3"><span style={{fontSize:12,fontWeight:700,color:TH.amber}}>Nuovo profilo</span><button onClick={()=>setShowNewProfilo(false)} style={{background:'none',border:'none',cursor:'pointer'}}><Ic n="x" s={16} c={TX.textMuted}/></button></div>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <InputField label="Codice" value={newProfilo.codice} onChange={(v:string)=>setNewProfilo({...newProfilo,codice:v})}/>
              <InputField label="Nome" value={newProfilo.nome} onChange={(v:string)=>setNewProfilo({...newProfilo,nome:v})}/>
              <div>
                <label style={{fontSize:9,color:TX.textMuted,textTransform:'uppercase',fontWeight:700,display:'block',marginBottom:2}}>Tipo</label>
                <select value={newProfilo.tipo} onChange={e=>setNewProfilo({...newProfilo,tipo:e.target.value})} className="rounded-lg w-full" style={{padding:'6px 10px',border:`1px solid ${TX.border}`,fontSize:12,color:TX.text,background:BG.input}}>
                  <option value="telaio">Telaio fisso</option><option value="anta">Telaio mobile (anta)</option><option value="fermavetro">Fermavetro</option><option value="sopraluce">Traverso/Sopraluce</option><option value="altro">Altro</option>
                </select>
              </div>
              <InputField label="Costo €/m" value={newProfilo.costo} onChange={(v:number)=>setNewProfilo({...newProfilo,costo:v})} type="number"/>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <InputField label="Larghezza mm" value={newProfilo.larghezza} onChange={(v:number)=>setNewProfilo({...newProfilo,larghezza:v})} type="number"/>
              <InputField label="Altezza mm" value={newProfilo.altezza} onChange={(v:number)=>setNewProfilo({...newProfilo,altezza:v})} type="number"/>
              <InputField label="Peso kg/m" value={newProfilo.peso} onChange={(v:number)=>setNewProfilo({...newProfilo,peso:v})} type="number"/>
              <InputField label="Colori (virgola)" value={newProfilo.colori} onChange={(v:string)=>setNewProfilo({...newProfilo,colori:v})}/>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setShowNewProfilo(false)} className="rounded-lg" style={{padding:'6px 16px',border:`1px solid ${TX.border}`,background:BG.card,color:TX.textSec,fontSize:11,cursor:'pointer'}}>Annulla</button>
              <button onClick={()=>{setConfProfili(p=>[...p,{id:'p'+Date.now(),codice:newProfilo.codice,nome:newProfilo.nome,tipo:newProfilo.tipo,larghezza:newProfilo.larghezza,altezza:newProfilo.altezza,peso:newProfilo.peso,costo:newProfilo.costo,colori:newProfilo.colori.split(',').map(s=>s.trim()).filter(Boolean),note:newProfilo.note}]);setShowNewProfilo(false);setNewProfilo({codice:'',nome:'',tipo:'telaio',larghezza:0,altezza:0,peso:0,costo:0,colori:'',note:''})}} className="rounded-lg" style={{padding:'6px 16px',border:'none',background:TH.amber,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>Salva</button>
            </div>
          </div>
        )}
        <div className="rounded-xl overflow-hidden" style={{border:`1px solid ${TX.border}`}}>
          <div className="grid grid-cols-12 gap-0 px-4 py-2" style={{background:BG.page,fontSize:9,fontWeight:700,color:TX.textMuted,textTransform:'uppercase',letterSpacing:1}}>
            <div className="col-span-1">Codice</div><div className="col-span-3">Nome</div><div className="col-span-1">Tipo</div><div className="col-span-1 text-right">L mm</div><div className="col-span-1 text-right">H mm</div><div className="col-span-1 text-right">Peso</div><div className="col-span-1 text-right">€/m</div><div className="col-span-2">Colori</div><div className="col-span-1"></div>
          </div>
          {confProfili.map(p=>(
            <div key={p.id} className="grid grid-cols-12 gap-0 px-4 py-3 items-center" style={{borderTop:`1px solid ${TX.border}`,fontSize:12}}>
              <div className="col-span-1"><span className="px-2 py-0.5 rounded" style={{background:TH.amber+'12',color:TH.amber,fontSize:10,fontWeight:700,fontFamily:'monospace'}}>{p.codice}</span></div>
              <div className="col-span-3 font-medium" style={{color:TX.text}}>{p.nome}</div>
              <div className="col-span-1"><span className="px-2 py-0.5 rounded-full" style={{fontSize:9,fontWeight:600,background:p.tipo==='telaio'?TH.blue+'12':p.tipo==='anta'?TH.amber+'12':TH.green+'12',color:p.tipo==='telaio'?TH.blue:p.tipo==='anta'?TH.amber:TH.green}}>{p.tipo}</span></div>
              <div className="col-span-1 text-right font-mono" style={{color:TX.textSec,fontSize:11}}>{p.larghezza}</div>
              <div className="col-span-1 text-right font-mono" style={{color:TX.textSec,fontSize:11}}>{p.altezza}</div>
              <div className="col-span-1 text-right font-mono" style={{color:TX.textSec,fontSize:11}}>{p.peso}</div>
              <div className="col-span-1 text-right font-mono font-semibold" style={{color:TH.green,fontSize:11}}>€{p.costo}</div>
              <div className="col-span-2 flex gap-1 flex-wrap">{p.colori.map((c,i)=><span key={i} className="px-1.5 py-0.5 rounded" style={{fontSize:8,background:BG.input,color:TX.textSec}}>{c}</span>)}</div>
              <div className="col-span-1 flex justify-end gap-1"><button className="rounded p-1" style={{border:'none',background:'none',cursor:'pointer'}}><Ic n="edit" s={13} c={TX.textMuted}/></button><button onClick={()=>setConfProfili(pr=>pr.filter(x=>x.id!==p.id))} className="rounded p-1" style={{border:'none',background:'none',cursor:'pointer'}}><Ic n="trash" s={13} c={TH.red}/></button></div>
            </div>
          ))}
          {confProfili.length===0&&<div className="py-8 text-center" style={{color:TX.textMuted,fontSize:12}}>Nessun profilo. Importa un DXF o crea manualmente.</div>}
        </div>
      </div>
    )

    // ── ACCESSORI ──
    const AccessoriSection = () => (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-semibold text-sm" style={{color:TX.text}}>Accessori</h3><p style={{fontSize:11,color:TX.textMuted}}>Ferramenta, guarnizioni, accessori vari</p></div>
          <button onClick={()=>setShowNewAccessorio(true)} className="rounded-xl flex items-center gap-2" style={{padding:'6px 14px',background:TH.amber,border:'none',color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}><Ic n="plus" s={13} c="#fff"/>Nuovo accessorio</button>
        </div>
        {showNewAccessorio && (
          <div className="rounded-xl p-4 mb-4" style={{background:BG.card,border:`1px solid ${TH.amber}30`,boxShadow:isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow}}>
            <div className="flex items-center justify-between mb-3"><span style={{fontSize:12,fontWeight:700,color:TH.amber}}>Nuovo accessorio</span><button onClick={()=>setShowNewAccessorio(false)} style={{background:'none',border:'none',cursor:'pointer'}}><Ic n="x" s={16} c={TX.textMuted}/></button></div>
            <div className="grid grid-cols-5 gap-3 mb-3">
              <InputField label="Codice" value={newAccessorio.codice} onChange={(v:string)=>setNewAccessorio({...newAccessorio,codice:v})}/>
              <InputField label="Nome" value={newAccessorio.nome} onChange={(v:string)=>setNewAccessorio({...newAccessorio,nome:v})}/>
              <div><label style={{fontSize:9,color:TX.textMuted,textTransform:'uppercase',fontWeight:700,display:'block',marginBottom:2}}>Tipo</label><select value={newAccessorio.tipo} onChange={e=>setNewAccessorio({...newAccessorio,tipo:e.target.value})} className="rounded-lg w-full" style={{padding:'6px 10px',border:`1px solid ${TX.border}`,fontSize:12,color:TX.text,background:BG.input}}><option value="ferramenta">Ferramenta</option><option value="guarnizione">Guarnizione</option><option value="maniglia">Maniglia</option><option value="cerniera">Cerniera</option><option value="altro">Altro</option></select></div>
              <InputField label="Prezzo €" value={newAccessorio.prezzo} onChange={(v:number)=>setNewAccessorio({...newAccessorio,prezzo:v})} type="number"/>
              <InputField label="Fornitore" value={newAccessorio.fornitore} onChange={(v:string)=>setNewAccessorio({...newAccessorio,fornitore:v})}/>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setShowNewAccessorio(false)} className="rounded-lg" style={{padding:'6px 16px',border:`1px solid ${TX.border}`,background:BG.card,color:TX.textSec,fontSize:11,cursor:'pointer'}}>Annulla</button>
              <button onClick={()=>{setConfAccessori(p=>[...p,{id:'a'+Date.now(),...newAccessorio}]);setShowNewAccessorio(false);setNewAccessorio({codice:'',nome:'',tipo:'ferramenta',prezzo:0,fornitore:'',note:''})}} className="rounded-lg" style={{padding:'6px 16px',border:'none',background:TH.amber,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>Salva</button>
            </div>
          </div>
        )}
        <div className="rounded-xl overflow-hidden" style={{border:`1px solid ${TX.border}`}}>
          <div className="grid grid-cols-12 gap-0 px-4 py-2" style={{background:BG.page,fontSize:9,fontWeight:700,color:TX.textMuted,textTransform:'uppercase',letterSpacing:1}}>
            <div className="col-span-2">Codice</div><div className="col-span-3">Nome</div><div className="col-span-2">Tipo</div><div className="col-span-2">Fornitore</div><div className="col-span-2 text-right">Prezzo</div><div className="col-span-1"></div>
          </div>
          {confAccessori.map(a=>(
            <div key={a.id} className="grid grid-cols-12 gap-0 px-4 py-3 items-center" style={{borderTop:`1px solid ${TX.border}`,fontSize:12}}>
              <div className="col-span-2"><span className="px-2 py-0.5 rounded" style={{background:TH.purple+'12',color:TH.purple,fontSize:10,fontWeight:700,fontFamily:'monospace'}}>{a.codice}</span></div>
              <div className="col-span-3 font-medium" style={{color:TX.text}}>{a.nome}</div>
              <div className="col-span-2"><span className="px-2 py-0.5 rounded-full" style={{fontSize:9,fontWeight:600,background:BG.input,color:TX.textSec}}>{a.tipo}</span></div>
              <div className="col-span-2" style={{color:TX.textSec}}>{a.fornitore}</div>
              <div className="col-span-2 text-right font-mono font-semibold" style={{color:TH.green}}>€{a.prezzo.toFixed(2)}</div>
              <div className="col-span-1 flex justify-end gap-1"><button className="rounded p-1" style={{border:'none',background:'none',cursor:'pointer'}}><Ic n="edit" s={13} c={TX.textMuted}/></button><button onClick={()=>setConfAccessori(pr=>pr.filter(x=>x.id!==a.id))} className="rounded p-1" style={{border:'none',background:'none',cursor:'pointer'}}><Ic n="trash" s={13} c={TH.red}/></button></div>
            </div>
          ))}
        </div>
      </div>
    )

    // ── KIT ──
    const KitSection = () => (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-semibold text-sm" style={{color:TX.text}}>Kit Accessori</h3><p style={{fontSize:11,color:TX.textMuted}}>Raggruppa accessori in kit predefiniti</p></div>
          <button className="rounded-xl flex items-center gap-2" style={{padding:'6px 14px',background:TH.amber,border:'none',color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}><Ic n="plus" s={13} c="#fff"/>Nuovo kit</button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {confKit.map(k=>{
            const totale=k.articoli.reduce((s,a)=>{const acc=confAccessori.find(x=>x.id===a.accId);return s+(acc?acc.prezzo*a.qty:0)},0)
            return <div key={k.id} className="rounded-xl p-4" style={{background:BG.card,border:`1px solid ${TX.border}`,boxShadow:isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3"><Ic n="package" s={18} c={TH.amber}/><div><span className="font-semibold text-sm" style={{color:TX.text}}>{k.nome}</span><span className="ml-2 px-2 py-0.5 rounded-full" style={{fontSize:9,background:BG.input,color:TX.textSec}}>{k.tipo}</span></div></div>
                <span className="font-mono font-bold" style={{color:TH.green,fontSize:14}}>€{totale.toFixed(2)}</span>
              </div>
              <div className="rounded-lg overflow-hidden" style={{border:`1px solid ${TX.border}`}}>
                {k.articoli.map((art,ai)=>{const acc=confAccessori.find(x=>x.id===art.accId);return <div key={ai} className="flex items-center justify-between px-3 py-2" style={{borderTop:ai?`1px solid ${TX.border}`:'none',fontSize:11}}>
                  <span style={{color:TX.text}}>{acc?.nome||'?'}</span><div className="flex items-center gap-3"><span style={{color:TX.textMuted}}>×{art.qty}</span><span className="font-mono" style={{color:TH.green}}>€{acc?(acc.prezzo*art.qty).toFixed(2):'0'}</span></div>
                </div>})}
              </div>
              {k.note&&<p style={{fontSize:10,color:TX.textMuted,marginTop:6}}>{k.note}</p>}
            </div>
          })}
        </div>
      </div>
    )

    // ── VETRI ──
    const VetriSection = () => (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div><h3 className="font-semibold text-sm" style={{color:TX.text}}>Vetri & Pannelli</h3><p style={{fontSize:11,color:TX.textMuted}}>Vetrocamere, pannelli, riempimenti</p></div>
          <button onClick={()=>setShowNewVetro(true)} className="rounded-xl flex items-center gap-2" style={{padding:'6px 14px',background:TH.amber,border:'none',color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}><Ic n="plus" s={13} c="#fff"/>Nuovo vetro</button>
        </div>
        {showNewVetro && (
          <div className="rounded-xl p-4 mb-4" style={{background:BG.card,border:`1px solid ${TH.amber}30`,boxShadow:isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow}}>
            <div className="flex items-center justify-between mb-3"><span style={{fontSize:12,fontWeight:700,color:TH.amber}}>Nuovo vetro</span><button onClick={()=>setShowNewVetro(false)} style={{background:'none',border:'none',cursor:'pointer'}}><Ic n="x" s={16} c={TX.textMuted}/></button></div>
            <div className="grid grid-cols-5 gap-3 mb-3">
              <InputField label="Codice" value={newVetro.codice} onChange={(v:string)=>setNewVetro({...newVetro,codice:v})}/>
              <InputField label="Nome" value={newVetro.nome} onChange={(v:string)=>setNewVetro({...newVetro,nome:v})}/>
              <InputField label="Spessore mm" value={newVetro.spessore} onChange={(v:number)=>setNewVetro({...newVetro,spessore:v})} type="number"/>
              <InputField label="Ug (W/m²K)" value={newVetro.ug} onChange={(v:number)=>setNewVetro({...newVetro,ug:v})} type="number"/>
              <InputField label="Prezzo €/mq" value={newVetro.prezzo} onChange={(v:number)=>setNewVetro({...newVetro,prezzo:v})} type="number"/>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setShowNewVetro(false)} className="rounded-lg" style={{padding:'6px 16px',border:`1px solid ${TX.border}`,background:BG.card,color:TX.textSec,fontSize:11,cursor:'pointer'}}>Annulla</button>
              <button onClick={()=>{setConfVetri(p=>[...p,{id:'v'+Date.now(),...newVetro}]);setShowNewVetro(false);setNewVetro({codice:'',nome:'',spessore:0,ug:0,prezzo:0,note:''})}} className="rounded-lg" style={{padding:'6px 16px',border:'none',background:TH.amber,color:'#fff',fontSize:11,fontWeight:600,cursor:'pointer'}}>Salva</button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-3">
          {confVetri.map(v=>(
            <div key={v.id} className="rounded-xl p-4" style={{background:BG.card,border:`1px solid ${TX.border}`,boxShadow:isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow}}>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded font-mono" style={{background:TH.blue+'12',color:TH.blue,fontSize:10,fontWeight:700}}>{v.codice}</span>
                <div className="flex gap-1"><button className="rounded p-1" style={{border:'none',background:'none',cursor:'pointer'}}><Ic n="edit" s={13} c={TX.textMuted}/></button><button onClick={()=>setConfVetri(pr=>pr.filter(x=>x.id!==v.id))} className="rounded p-1" style={{border:'none',background:'none',cursor:'pointer'}}><Ic n="trash" s={13} c={TH.red}/></button></div>
              </div>
              <h4 className="font-semibold text-sm mb-2" style={{color:TX.text}}>{v.nome}</h4>
              <div className="flex items-center justify-between" style={{fontSize:11}}>
                <div className="flex gap-3">
                  <span style={{color:TX.textMuted}}>Sp. <strong style={{color:TX.text}}>{v.spessore}mm</strong></span>
                  <span style={{color:TX.textMuted}}>Ug <strong style={{color:TH.blue}}>{v.ug}</strong></span>
                </div>
                <span className="font-mono font-bold" style={{color:TH.green}}>€{v.prezzo}/mq</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )

    // ── TIPOLOGIE (CAD placeholder) ──
    const TipologieSection = () => (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4" style={{background:TH.amber+'12'}}><Ic n="window" s={36} c={TH.amber}/></div>
        <h3 className="text-lg font-bold mb-2" style={{color:TX.text}}>Configuratore Tipologie</h3>
        <p style={{fontSize:12,color:TX.textMuted,maxWidth:400,margin:'0 auto 16px'}}>
          Inserisci prima i profili, accessori, kit e vetri. Poi qui potrai creare tipologie assemblando tutti i componenti con il CAD.
        </p>
        <div className="flex gap-3 justify-center">
          {confProfili.length>0&&confVetri.length>0 ? (
            <button className="rounded-xl flex items-center gap-2" style={{padding:'8px 20px',background:TH.amber,border:'none',color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}><Ic n="plus" s={15} c="#fff"/>Crea tipologia</button>
          ) : (
            <div className="rounded-xl px-4 py-3" style={{background:TH.red+'08',border:`1px solid ${TH.red}20`}}>
              <p style={{fontSize:11,color:TH.red,fontWeight:600}}>Servono almeno: {confProfili.length===0?'1 profilo, ':''}{confVetri.length===0?'1 vetro':''}</p>
            </div>
          )}
        </div>
      </div>
    )

    return (
      <div>
        {/* Sub-tabs */}
        <div className="flex items-center gap-1 mb-5 pb-3" style={{borderBottom:`1px solid ${TX.border}`}}>
          {confTabs.map(tab=>(
            <button key={tab.id} onClick={()=>setConfTab(tab.id)} className="rounded-xl flex items-center gap-2 transition-all" style={{padding:'6px 14px',background:confTab===tab.id?TH.amber+'10':'transparent',color:confTab===tab.id?TH.amber:TX.textSec,border:`1px solid ${confTab===tab.id?TH.amber+'30':'transparent'}`,fontSize:11,fontWeight:confTab===tab.id?700:500,cursor:'pointer'}}>
              <Ic n={tab.icon} s={14} c={confTab===tab.id?TH.amber:TX.textMuted}/>
              {tab.label}
              <span className="px-1.5 py-0.5 rounded-full" style={{fontSize:9,fontWeight:700,background:confTab===tab.id?TH.amber+'20':BG.input,color:confTab===tab.id?TH.amber:TX.textMuted}}>{tab.count}</span>
            </button>
          ))}
        </div>
        {confTab==='profili'&&<ProfiliSection/>}
        {confTab==='accessori'&&<AccessoriSection/>}
        {confTab==='kit'&&<KitSection/>}
        {confTab==='vetri'&&<VetriSection/>}
        {confTab==='tipologie'&&<TipologieSection/>}
      </div>
    )
  }


  const DashboardContent = () => {
    const wMove = (wid: string, dir: -1|1) => {
      setDashWidgets(prev => {
        const n = [...prev]; const i = n.findIndex(w => w.id === wid); const j = i + dir
        if (j < 0 || j >= n.length) return n; [n[i], n[j]] = [n[j], n[i]]; return n
      })
    }
    const wHide = (wid: string) => setDashWidgets(prev => prev.map(w => w.id === wid ? { ...w, visible: false } : w))
    const wShow = (wid: string) => setDashWidgets(prev => prev.map(w => w.id === wid ? { ...w, visible: true } : w))
    const wResize = (wid: string, size: string) => setDashWidgets(prev => prev.map(w => w.id === wid ? { ...w, size } : w))
    const colClass = (s: string) => s === 'full' ? 'col-span-12' : s === 'half' ? 'col-span-6' : 'col-span-4'

    // ── WIDGET: Search ──
    const WSearch = React.memo(() => (
      <div className="flex items-center gap-2 px-4 py-3" style={{ background: BG.input, border: `1px solid ${TX.border}`, borderRadius: rd }}>
        <Ic n="search" s={16} c={TX.textMuted}/>
        <input 
          value={globalSearch} 
          onChange={(e) => setGlobalSearch(e.target.value)} 
          placeholder="Cerca commesse, clienti, eventi..."
          autoComplete="off"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: TX.text, fontSize: 14 }} 
        />
        {globalSearch && <button onClick={() => setGlobalSearch('')} style={{ background: 'transparent', border: 'none', color: TX.textMuted, cursor: 'pointer' }}><Ic n="x" s={14}/></button>}
      </div>
    ))

    // ── WIDGET: KPI ──
    // All available KPIs
    const allKpis: Record<string, { label: string; value: string|number; icon: string; color: string }> = {
      attive: { label: 'Commesse Attive', value: stats.attive, icon: 'clipboard', color: TH.blue },
      valore: { label: 'Valore Totale', value: fmt(stats.valore), icon: 'dollar', color: TH.green },
      oggi: { label: 'Eventi Oggi', value: stats.oggi, icon: 'calendar', color: AC },
      fatturato: { label: 'Fatturato', value: fmtDec(finStats.fatturato), icon: 'file', color: TH.purple },
      da_incassare: { label: 'Da Incassare', value: fmtDec(finStats.daIncassare), icon: 'clock', color: TH.red },
      ordini_attivi: { label: 'Ordini Attivi', value: ordini.filter(o => o.stato !== 'consegnato' && o.stato !== 'annullato').length, icon: 'package', color: TH.purple },
      promemoria_aperti: { label: 'Promemoria', value: promemoria.filter(p => p.stato === 'aperto').length, icon: 'pin', color: AC },
      clienti: { label: 'Clienti Totali', value: clienti.length, icon: 'user', color: TH.blue },
      lavorazioni: { label: 'Lavorazioni', value: lavorazioni.filter(l => l.stato === 'in_corso').length, icon: 'wrench', color: AC },
      scadenze_aperte: { label: 'Scadenze Aperte', value: scadenze.filter(s => s.stato === 'aperta').length, icon: 'clock', color: TH.red },
      fatture_tot: { label: 'N° Fatture', value: fatture.length, icon: 'file', color: TH.green },
      valore_medio: { label: 'Valore Medio', value: commesse.length > 0 ? fmtDec(commesse.reduce((s,c) => s + (c.valore_preventivo||0), 0) / commesse.length) : '0', icon: 'chart', color: TH.blue },
      sopralluoghi: { label: 'In Sopralluogo', value: commesse.filter(c => c.stato === 'sopralluogo').length, icon: 'search', color: AC },
      in_produzione: { label: 'In Produzione', value: commesse.filter(c => c.stato === 'produzione').length, icon: 'wrench', color: TH.purple },
      completate: { label: 'Completate', value: commesse.filter(c => c.stato === 'chiusura').length, icon: 'check', color: TH.green },
    }

    const WKPI = () => (
      <div className="grid grid-cols-5 gap-3" style={{ position: 'relative' }}>
        {kpiSlots.map((slot, i) => {
          const k = allKpis[slot] || allKpis.attive
          return (
            <div key={i} className="p-3 cursor-pointer" style={{ background: BG.input, borderRadius: rd, position: 'relative' }}
              onClick={(e) => { e.stopPropagation(); setKpiEditing(kpiEditing === i ? null : i) }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 9, color: TX.textMuted, textTransform: 'uppercase' as const, letterSpacing: 1.5, fontWeight: 600 }}>{k.label}</span>
                <Ic n={k.icon} s={14} c={k.color}/>
              </div>
              <div className="text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
              {/* Small edit indicator */}
              <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 8, color: TX.textMuted, opacity: 0.4 }}>▼</div>
              {/* Dropdown to change KPI */}
              {kpiEditing === i && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4, background: BG.card,
                  border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : isDark ? '0 4px 12px rgba(0,0,0,0.4)' : TH.shadowMd,
                  borderRadius: rd, maxHeight: 240, overflowY: 'auto', minWidth: 200 }}
                  onClick={(e) => e.stopPropagation()}>
                  <div style={{ padding: '5px 10px', fontSize: 8, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Scegli KPI</div>
                  {Object.entries(allKpis).map(([id, kpi]) => (
                    <button key={id} onClick={(e) => { e.stopPropagation(); setKpiSlots(prev => { const n = [...prev]; n[i] = id; return n }); setKpiEditing(null) }}
                      style={{ display: 'flex', width: '100%', padding: '6px 10px', fontSize: 11, color: slot === id ? AC : TX.text,
                        fontWeight: slot === id ? 700 : 400, cursor: 'pointer', background: slot === id ? AC + '10' : 'transparent',
                        border: 'none', textAlign: 'left', alignItems: 'center', gap: 6 }}>
                      <Ic n={kpi.icon} s={11} c={kpi.color}/> {kpi.label}
                      <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'monospace', color: kpi.color, fontWeight: 700 }}>{kpi.value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )

    // ── WIDGET: Promemoria ──
    const WPromemoria = () => (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 style={{ fontSize: 11, fontWeight: 700, color: AC }}><Ic n="pin" s={12} c={AC}/> PROMEMORIA</h4>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 10, color: TX.textMuted }}>{promemoria.filter(p => p.stato === 'aperto').length} aperti</span>
            <button onClick={() => setShowPromemoriaForm(!showPromemoriaForm)} style={{ background: AC + '12', border: `1px solid ${AC}30`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: AC, cursor: 'pointer', fontWeight: 600 }}>+</button>
          </div>
        </div>
        {showPromemoriaForm && (
          <div className="mb-3 p-2" style={{ background: BG.input, border: `1px solid ${TX.border}`, borderRadius: rd }}>
            <div className="flex gap-2 mb-2">
              <input value={newPromemoriaText} onChange={(e) => setNewPromemoriaText(e.target.value)} placeholder="Cosa devi ricordare?"
                onKeyDown={(e) => e.key === 'Enter' && createPromemoria()}
                style={{ flex: 1, background: BG.card, border: `1px solid ${TX.border}`, borderRadius: 6, padding: '6px 8px', fontSize: 12, color: TX.text, outline: 'none' }} autoFocus />
              <button onClick={createPromemoria} style={{ background: AC, border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Salva</button>
            </div>
            <div className="flex gap-1 items-center">
              <span style={{ fontSize: 9, color: TX.textMuted }}>Priorità:</span>
              {['bassa', 'normale', 'alta', 'urgente'].map(p => (
                <button key={p} onClick={() => setNewPromemoriaPriorita(p)} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, border: 'none', cursor: 'pointer',
                  background: newPromemoriaPriorita === p ? (p === 'urgente' ? TH.red : p === 'alta' ? AC : p === 'normale' ? TH.blue : TX.textMuted) + '18' : BG.card,
                  color: newPromemoriaPriorita === p ? (p === 'urgente' ? TH.red : p === 'alta' ? AC : p === 'normale' ? TH.blue : TX.textSec) : TX.textMuted }}>
                  {p}
                </button>
              ))}
              <select value={newPromemoriaCommessa} onChange={(e) => setNewPromemoriaCommessa(e.target.value)}
                style={{ marginLeft: 8, background: BG.card, border: `1px solid ${TX.border}`, borderRadius: 4, padding: '2px 4px', fontSize: 9, color: TX.textSec, outline: 'none' }}>
                <option value="">Nessuna commessa</option>
                {commesse.map(c => <option key={c.id} value={c.id}>{c.codice}</option>)}
              </select>
            </div>
          </div>
        )}
        <div className="space-y-1" style={{ maxHeight: expandedWidget ? 'none' : 220, overflowY: 'auto' }}>
          {promemoria.filter(p => p.stato === 'aperto').slice(0, 8).map(p => {
            const priColors: Record<string, string> = { urgente: TH.red, alta: AC, normale: TH.blue, bassa: TX.textMuted }
            return (
              <div key={p.id} className="flex items-center gap-2 px-2 py-1.5" style={{ background: BG.input, borderRadius: rd }}>
                <button onClick={() => togglePromemoria(p.id, p.stato)} className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ border: `2px solid ${priColors[p.priorita] || TX.textMuted}`, background: 'transparent', cursor: 'pointer' }} />
                <div className="flex-1 min-w-0">
                  <span className="truncate block" style={{ fontSize: 11, color: TX.text }}>{p.testo}</span>
                  {p.commessa && <span style={{ fontSize: 8, color: AC }}>{(p.commessa as any).codice}</span>}
                </div>
                <button onClick={() => deletePromemoria(p.id)} style={{ background: 'transparent', border: 'none', color: TX.textMuted, cursor: 'pointer', padding: 0 }}><Ic n="x" s={10}/></button>
              </div>
            )
          })}
          {promemoria.filter(p => p.stato === 'aperto').length === 0 && <p style={{ fontSize: 11, color: TX.textMuted, textAlign: 'center', padding: 8 }}>Nessun promemoria</p>}
        </div>
      </div>
    )

    // ── WIDGET: Ordini ──
    const WOrdini = () => {
      const statoOrdColors: Record<string, { color: string; label: string }> = {
        bozza: { color: TX.textMuted, label: 'Bozza' }, inviato: { color: TH.blue, label: 'Inviato' },
        confermato: { color: TH.purple, label: 'Confermato' }, in_consegna: { color: AC, label: 'In consegna' },
        consegnato: { color: TH.green, label: 'Consegnato' }, annullato: { color: TH.red, label: 'Annullato' },
      }
      const statiFlow = ['bozza', 'inviato', 'confermato', 'in_consegna', 'consegnato']
      return (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 style={{ fontSize: 11, fontWeight: 700, color: TH.purple }}><Ic n="package" s={12} c={TH.purple}/> ORDINI FORNITORE</h4>
            <span style={{ fontSize: 10, color: TX.textMuted }}>{ordini.filter(o => o.stato !== 'consegnato' && o.stato !== 'annullato').length} attivi</span>
          </div>
          <div className="space-y-1" style={{ maxHeight: expandedWidget ? 'none' : 220, overflowY: 'auto' }}>
            {ordini.filter(o => o.stato !== 'consegnato' && o.stato !== 'annullato').slice(0, 8).map(o => {
              const so = statoOrdColors[o.stato] || statoOrdColors.bozza
              const nextStato = statiFlow[statiFlow.indexOf(o.stato) + 1]
              return (
                <div key={o.id} className="flex items-center gap-2 px-2 py-1.5" style={{ background: BG.input, borderRadius: rd }}>
                  <div className="w-1.5 h-8 rounded" style={{ background: so.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span style={{ fontSize: 10, fontFamily: 'monospace', color: TH.purple, fontWeight: 700 }}>{o.codice}</span>
                      <span className="truncate" style={{ fontSize: 10, color: TX.text }}>{o.descrizione || o.tipo}</span>
                    </div>
                    {o.fornitore && <span style={{ fontSize: 8, color: TX.textMuted }}>{(o.fornitore as any).ragione_sociale}</span>}
                  </div>
                  {o.importo_totale > 0 && <span style={{ fontSize: 9, fontFamily: 'monospace', color: TH.green }}>{fmtDec(o.importo_totale)}</span>}
                  <Badge text={so.label} color={so.color} />
                  {nextStato && <button onClick={() => updateOrdineStato(o.id, nextStato)} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 8, border: 'none', background: TX.bgHover, color: TX.textSec, cursor: 'pointer' }}><Ic n="arrowRight" s={8}/></button>}
                </div>
              )
            })}
            {ordini.filter(o => o.stato !== 'consegnato' && o.stato !== 'annullato').length === 0 && <p style={{ fontSize: 11, color: TX.textMuted, textAlign: 'center', padding: 8 }}>Nessun ordine attivo</p>}
          </div>
        </div>
      )
    }

    // ── WIDGET: Kanban (INTERACTIVE) ──
    const WKanban = () => {
      const statiValues = STATI_COMMESSA.map(s => s.value)
      const getDaysInPhase = (c: any) => {
        if (!c.updated_at) return 0
        return Math.floor((Date.now() - new Date(c.updated_at).getTime()) / 86400000)
      }
      const getUrgency = (days: number) => {
        if (days >= 14) return { color: TH.red, label: 'critico', bg: TH.red + '12' }
        if (days >= 7) return { color: AC, label: 'attenzione', bg: AC + '10' }
        return { color: 'transparent', label: '', bg: 'transparent' }
      }
      return (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold" style={{ color: TX.text }}><Ic n="grid" s={13} c={TH.blue}/> Kanban Commesse</h4>
            <span style={{ fontSize: 9, color: TX.textMuted }}>trascina le card per spostare fase</span>
          </div>
          <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
            <div className="flex gap-3" style={{ minWidth: STATI_COMMESSA.length * 200 }}>
              {STATI_COMMESSA.map((stato, si) => {
                const stCommesse = commesse.filter(c => c.stato === stato.value)
                const isOver = dragOver === stato.value
                return (
                  <div key={stato.value} className="flex-1"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(stato.value) }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={(e) => {
                      e.preventDefault(); setDragOver(null)
                      if (dragComm) { updateCommessaStato(dragComm, stato.value); setDragComm(null) }
                    }}
                    style={{
                      background: isOver ? (stato.color + '15') : BG.input,
                      border: `1px solid ${isOver ? stato.color : TX.border}`,
                      minWidth: 180, maxWidth: 260, borderRadius: rd,
                      transition: 'all 0.2s ease',
                      transform: isOver ? 'scale(1.02)' : 'scale(1)',
                    }}>
                    <div className="p-2 flex items-center justify-between" style={{ borderBottom: `2px solid ${stato.color}${isOver ? '' : '30'}` }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: stato.color }}>{stato.label}</span>
                      <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: 9, fontWeight: 700, background: stato.color + '15', color: stato.color }}>{stCommesse.length}</span>
                    </div>
                    <div className="p-2 space-y-1.5" style={{ maxHeight: expandedWidget === 'kanban' ? 'none' : 400, overflowY: 'auto', minHeight: 60 }}>
                      {stCommesse.map(comm => {
                        const days = getDaysInPhase(comm)
                        const urg = getUrgency(days)
                        const nextStato = statiValues[si + 1]
                        const isDragging = dragComm === comm.id
                        return (
                          <div key={comm.id} className="p-2.5 cursor-grab group/card"
                            draggable
                            onDragStart={() => setDragComm(comm.id)}
                            onDragEnd={() => { setDragComm(null); setDragOver(null) }}
                            onClick={() => { if (!dragComm) { setActiveTab('commesse'); setSelectedCommessa(comm.id) } }}
                            style={{
                              background: isDragging ? AC + '08' : BG.card,
                              border: `1px solid ${urg.color !== 'transparent' ? urg.color + '40' : TX.border}`,
                              boxShadow: isDragging ? `0 4px 12px ${AC}30` : (isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow),
                              borderRadius: rd, opacity: isDragging ? 0.7 : 1,
                              borderLeft: urg.color !== 'transparent' ? `3px solid ${urg.color}` : undefined,
                              transition: 'box-shadow 0.2s ease, opacity 0.2s ease',
                            }}>
                            <div className="flex items-center justify-between mb-1">
                              <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: AC }}>{comm.codice}</span>
                              <div className="flex items-center gap-1">
                                {comm.valore_preventivo > 0 && <span style={{ fontSize: 9, fontFamily: 'monospace', color: TH.green }}>{fmtDec(comm.valore_preventivo)}</span>}
                              </div>
                            </div>
                            <div className="text-xs font-medium truncate mb-1" style={{ color: TX.text }}>{comm.titolo}</div>
                            <div className="flex items-center justify-between">
                              <div style={{ fontSize: 9, color: TX.textMuted }}><Ic n="user" s={8}/> {comm.cliente?.nome} {comm.cliente?.cognome}</div>
                              {/* Days in phase indicator */}
                              {days > 0 && (
                                <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, fontWeight: 700,
                                  background: urg.color !== 'transparent' ? urg.bg : TX.bgHover,
                                  color: urg.color !== 'transparent' ? urg.color : TX.textMuted }}>
                                  {days}g
                                </span>
                              )}
                            </div>
                            {/* Quick action: Avanza fase */}
                            {nextStato && (
                              <button
                                className="w-full mt-1.5 kanban-advance"
                                onClick={(e) => { e.stopPropagation(); updateCommessaStato(comm.id, nextStato) }}
                                style={{
                                  padding: '3px 0', borderRadius: 4, fontSize: 8, fontWeight: 700,
                                  border: `1px solid ${(STATI_COMMESSA[si + 1]?.color || AC) + '30'}`,
                                  background: (STATI_COMMESSA[si + 1]?.color || AC) + '08',
                                  color: STATI_COMMESSA[si + 1]?.color || AC,
                                  cursor: 'pointer', textAlign: 'center',
                                  opacity: 0.4, transition: 'opacity 0.2s ease',
                                }}
                                onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
                                onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.4' }}>
                                → {STATI_COMMESSA[si + 1]?.label}
                              </button>
                            )}
                          </div>
                        )
                      })}
                      {stCommesse.length === 0 && (
                        <div className="text-center py-6" style={{ fontSize: 9, color: TX.textMuted, border: `2px dashed ${TX.border}`, borderRadius: rd, opacity: isOver ? 1 : 0.5 }}>
                          {isOver ? '↓ Rilascia qui' : '—'}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    // ── WIDGET: Pipeline (IMPROVED - per-commessa progress) ──
    const WPipeline = () => {
      const activeComm = commesse.filter(c => c.stato !== 'chiusura')
      return (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold" style={{ color: TX.text }}><Ic n="chart" s={13} c={TH.green}/> Pipeline Commesse</h4>
            <span style={{ fontSize: 9, color: TX.textMuted }}>{activeComm.length} attive</span>
          </div>
          {/* Phase header */}
          <div className="flex gap-0.5 mb-2 px-1">
            {STATI_COMMESSA.map(s => (
              <div key={s.value} className="flex-1 text-center" style={{ fontSize: 7, color: TX.textMuted, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>
                {s.label.slice(0, 4)}
              </div>
            ))}
          </div>
          <div className="space-y-1.5" style={{ maxHeight: expandedWidget === 'pipeline' ? 'none' : 300, overflowY: 'auto' }}>
            {activeComm.slice(0, 12).map(c => {
              const si = getStato(c.stato)
              const idx = STATI_COMMESSA.findIndex(s => s.value === c.stato)
              const perc = Math.round(((idx + 1) / STATI_COMMESSA.length) * 100)
              return (
                <div key={c.id} className="cursor-pointer" style={{ background: BG.input, borderRadius: rd, padding: '8px 10px' }}
                  onClick={() => { setActiveTab('commesse'); setSelectedCommessa(c.id) }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: AC }}>{c.codice}</span>
                      <span className="truncate" style={{ fontSize: 10, color: TX.text, fontWeight: 500 }}>{c.titolo}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {c.valore_preventivo > 0 && <span style={{ fontSize: 9, fontFamily: 'monospace', color: TH.green }}>{fmtDec(c.valore_preventivo)}</span>}
                      <span style={{ fontSize: 8, fontWeight: 700, color: si.color, background: si.color + '15', padding: '1px 6px', borderRadius: 4 }}>{perc}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5 flex-1">
                      {STATI_COMMESSA.map((s, i) => (
                        <div key={s.value} className="flex-1 rounded-sm" style={{
                          height: 6,
                          background: i <= idx ? si.color : TX.border,
                          opacity: i === idx ? 1 : i < idx ? 0.6 : 0.3,
                          transition: 'all 0.3s ease'
                        }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ fontSize: 8, color: TX.textMuted }}><Ic n="user" s={7}/> {c.cliente?.nome} {c.cliente?.cognome}</span>
                    <span style={{ fontSize: 8, color: si.color, fontWeight: 600 }}>{si.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Summary bar at bottom */}
          <div className="flex gap-1 mt-3 pt-2" style={{ borderTop: `1px solid ${TX.border}` }}>
            {STATI_COMMESSA.map(s => {
              const count = commesse.filter(c => c.stato === s.value).length
              return (
                <div key={s.value} className="flex-1 text-center p-1 cursor-pointer" style={{ borderRadius: rd, background: count > 0 ? s.color + '10' : 'transparent' }}
                  onClick={() => { setActiveTab('commesse'); setCommessaFilter(s.value) }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{count}</div>
                  <div style={{ fontSize: 7, color: TX.textMuted, fontWeight: 600 }}>{s.label.slice(0, 4)}</div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    // ── WIDGET: Eventi Oggi ──
    const WEventiOggi = () => (
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: TX.text }}><Ic n="calendar" s={13} c={TH.blue}/> Eventi Oggi</h4>
        <div className="space-y-1.5">
          {eventiOggi.map(e => {
            const tc = tipiEvento[e.tipo || 'altro']
            return (<div key={e.id} className="flex items-center gap-2 p-2" style={{ background: BG.input, borderRadius: rd }}>
              <div className="flex-1"><div className="text-sm" style={{ color: TX.text }}>{e.titolo}</div><div style={{ fontSize: 10, color: TX.textMuted }}>{e.ora_inizio?.slice(0, 5)} · {e.cliente?.nome}</div></div>
              <Badge text={e.tipo || 'altro'} color={tc.color || TX.textMuted} />
            </div>)
          })}
          {eventiOggi.length === 0 && <p style={{ fontSize: 11, color: TX.textMuted, textAlign: 'center', padding: 12 }}>Nessun evento oggi</p>}
        </div>
      </div>
    )

    // ── WIDGET: Lavorazioni ──
    const WLavorazioni = () => (
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: TX.text }}><Ic n="wrench" s={13} c={AC}/> Lavorazioni Attive</h4>
        <div className="space-y-1.5">
          {lavorazioni.filter(l => l.stato === 'in_corso').slice(0, 8).map(l => (
            <div key={l.id} className="flex items-center gap-2 p-2" style={{ background: BG.input, borderRadius: rd }}>
              <div className="flex-1"><div style={{ fontSize: 11, fontWeight: 600, color: TX.text }}>{l.fase?.nome}</div><div style={{ fontSize: 9, color: TX.textMuted }}>{l.commessa?.codice}</div></div>
              <Badge text="in corso" color={AC} />
            </div>
          ))}
          {lavorazioni.filter(l => l.stato === 'in_corso').length === 0 && <p style={{ fontSize: 11, color: TX.textMuted, textAlign: 'center', padding: 12 }}>Nessuna attiva</p>}
        </div>
      </div>
    )

    // ── WIDGET: Scadenze ──
    const WScadenze = () => (
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: TX.text }}><Ic n="clock" s={13} c={TH.red}/> Scadenze</h4>
        <div className="space-y-1.5">
          {scadenze.filter(s => s.stato === 'aperta').slice(0, 8).map(s => (
            <div key={s.id} className="flex items-center gap-2 p-2" style={{ background: TH.red + '06', borderRadius: rd }}>
              <div className="flex-1"><div style={{ fontSize: 11, fontWeight: 600, color: TH.red }}>{fmtDec(s.importo)}</div><div style={{ fontSize: 9, color: TX.textMuted }}>{new Date(s.data_scadenza).toLocaleDateString('it-IT')}</div></div>
            </div>
          ))}
          {scadenze.filter(s => s.stato === 'aperta').length === 0 && <p style={{ fontSize: 11, color: TX.textMuted, textAlign: 'center', padding: 12 }}>Nessuna scadenza</p>}
        </div>
      </div>
    )

    // ── WIDGET: Interconnessioni ──
    const WInterconn = () => (
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: TX.text }}><Ic n="activity" s={13} c={TH.purple}/> Interconnessioni</h4>
        <div className="space-y-1.5">
          {commesse.filter(c => c.stato !== 'chiusura').slice(0, 6).map(c => {
            const si = getStato(c.stato)
            const evts = calEventi.filter(e => e.commessa_id === c.id).length
            const fatt = fatture.filter(f => f.commessa_id === c.id).length
            return (
              <div key={c.id} className="flex items-center gap-2 p-1.5 cursor-pointer" style={{ background: BG.input, borderRadius: rd }}
                onClick={() => { setActiveTab('commesse'); setSelectedCommessa(c.id) }}>
                <div className="w-1.5 h-6 rounded" style={{ background: si.color }} />
                <div className="flex-1 min-w-0"><span style={{ fontSize: 9, fontFamily: 'monospace', color: AC }}>{c.codice}</span> <span className="text-xs truncate" style={{ color: TX.text }}>{c.titolo}</span></div>
                <div className="flex gap-1">
                  {evts > 0 && <span className="px-1 py-0.5 rounded" style={{ fontSize: 7, background: TH.blue + '10', color: TH.blue }}><Ic n="calendar" s={7}/>{evts}</span>}
                  {fatt > 0 && <span className="px-1 py-0.5 rounded" style={{ fontSize: 7, background: TH.purple + '10', color: TH.purple }}><Ic n="file" s={7}/>{fatt}</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )

    const widgetMap: Record<string, React.ReactNode> = {
      kpi: <WKPI/>, promemoria: <WPromemoria/>, ordini: <WOrdini/>,
      kanban: <WKanban/>, pipeline: <WPipeline/>, eventi_oggi: <WEventiOggi/>,
      lavorazioni: <WLavorazioni/>, scadenze: <WScadenze/>, interconnessioni: <WInterconn/>,
    }

    const visibleWidgets = dashWidgets.filter(w => w.visible)
    const hiddenWidgets = dashWidgets.filter(w => !w.visible)

    // Theme presets for settings
    const themePresets = [
      { id: 'amber', label: 'MASTRO', color: '#D97706', desc: 'Default' },
      { id: 'blue', label: 'Ocean', color: '#3B82F6', desc: 'Professionale' },
      { id: 'green', label: 'Forest', color: '#059669', desc: 'Naturale' },
      { id: 'purple', label: 'Royal', color: '#7C3AED', desc: 'Elegante' },
      { id: 'red', label: 'Sunset', color: '#DC2626', desc: 'Energico' },
      { id: 'pink', label: 'Rose', color: '#EC4899', desc: 'Moderno' },
      { id: 'teal', label: 'Teal', color: '#0D9488', desc: 'Fresco' },
      { id: 'indigo', label: 'Indigo', color: '#4F46E5', desc: 'Sofisticato' },
    ]

    return (
      <div onClick={() => { setWMenu(null); setWAddMenu(null); setKpiEditing(null) }} style={{ background: BG.page, margin: -24, padding: 24, minHeight: 'calc(100vh - 60px)', borderRadius: 12 }}>
        {/* Dashboard header with settings */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 style={{ fontSize: 18, fontWeight: 800, color: TX.text, letterSpacing: -0.5 }}>Dashboard</h2>
            <span style={{ fontSize: 10, color: TX.textMuted, background: BG.input, padding: '2px 8px', borderRadius: 20 }}>
              {visibleWidgets.length} widget · {commesse.length} commesse
            </span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setShowGlobalSettings(true) }}
            className="flex items-center gap-1.5" style={{ padding: '6px 14px', background: AC + '10', border: `1px solid ${AC}30`, borderRadius: rd, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: AC }}>
            <Ic n="settings" s={13} c={AC}/> Personalizza
          </button>
        </div>

        {/* ═══ BARRA RICERCA GLOBALE ═══ */}
        <div className="mb-6">
          <WSearch />
        </div>

        {/* ═══ SMART COMMAND CENTER ═══ */}
        {(() => {
          const now = new Date()
          const hour = now.getHours()
          const saluto = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera'

          // Analyze commesse
          const commesseFerme = commesse.filter(c => {
            if (!c.updated_at || c.stato === 'chiusura') return false
            const days = Math.floor((Date.now() - new Date(c.updated_at).getTime()) / 86400000)
            return days > 7
          })
          const commesseUrgenti = commesse.filter(c => ['ordini','produzione'].includes(c.stato))
          const commesseNuove = commesse.filter(c => c.stato === 'sopralluogo')

          // Finance alerts
          const scaduti = finStats.scadute > 0
          const daIncassare = finStats.daIncassare > 0

          // Build smart alerts
          const alerts: Array<{ tipo: string; icon: string; color: string; titolo: string; desc: string; action?: string; actionFn?: () => void }> = []

          if (commesseFerme.length > 0) alerts.push({ tipo: 'warning', icon: '⏱️', color: TH.red,
            titolo: `${commesseFerme.length} commess${commesseFerme.length > 1 ? 'e ferme' : 'a ferma'} da >7 giorni`,
            desc: commesseFerme.map(c => `${c.codice} (${getStato(c.stato).label})`).join(', '),
            action: 'Vedi commesse', actionFn: () => setActiveTab('commesse') })

          if (scaduti) alerts.push({ tipo: 'danger', icon: '💳', color: TH.red,
            titolo: `${fmtDec(finStats.scadute)} in pagamenti scaduti`,
            desc: 'Azione immediata: sollecitare i clienti per i pagamenti arretrati',
            action: 'Contabilità', actionFn: () => setActiveTab('contabilita') })

          if (commesseUrgenti.length > 0) alerts.push({ tipo: 'action', icon: '🔧', color: TH.purple,
            titolo: `${commesseUrgenti.length} commess${commesseUrgenti.length > 1 ? 'e' : 'a'} in produzione/ordini`,
            desc: commesseUrgenti.map(c => `${c.codice}: ${c.titolo || '—'}`).join(' · '),
            action: 'Produzione', actionFn: () => setActiveTab('produzione') })

          if (commesseNuove.length > 0) alerts.push({ tipo: 'info', icon: '🎯', color: AC,
            titolo: `${commesseNuove.length} sopralluogh${commesseNuove.length > 1 ? 'i' : 'o'} da gestire`,
            desc: 'Nuovi potenziali clienti in attesa. Priorità: contatto entro 48h.',
            action: 'Commesse', actionFn: () => setActiveTab('commesse') })

          if (daIncassare && !scaduti) alerts.push({ tipo: 'info', icon: '💰', color: TH.amber,
            titolo: `${fmtDec(finStats.daIncassare)} da incassare`,
            desc: 'Crediti aperti da monitorare. Nessuno scaduto al momento.' })

          // Today's focus
          const topCommessa = commesse.find(c => c.stato === 'produzione') || commesse.find(c => c.stato === 'ordini') || commesse[0]

          return (
            <div className="mb-4 rounded-xl overflow-hidden" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.05)' }}>
              {/* Briefing header */}
              <div className="p-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${AC}08, ${TH.purple}06)`, borderBottom: `1px solid ${TX.border}` }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: TX.text }}>{saluto} Fabio 👋</h3>
                  <p style={{ fontSize: 11, color: TX.textSec, marginTop: 2 }}>
                    {alerts.length === 0 ? 'Tutto sotto controllo. Nessuna urgenza.' :
                     alerts.length === 1 ? 'C\'è 1 cosa che richiede la tua attenzione.' :
                     `Ci sono ${alerts.length} cose che richiedono la tua attenzione.`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 9, color: TX.textMuted }}>{now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                </div>
              </div>

              {/* Smart alerts */}
              {alerts.length > 0 && (
                <div className="p-3 grid gap-2" style={{ gridTemplateColumns: alerts.length <= 2 ? `repeat(${alerts.length}, 1fr)` : 'repeat(2, 1fr)' }}>
                  {alerts.map((a, i) => (
                    <div key={i} className="p-3 rounded-lg flex items-start gap-3" style={{ background: a.color + '04', border: `1px solid ${a.color}12` }}>
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>{a.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div style={{ fontSize: 11, fontWeight: 700, color: a.color }}>{a.titolo}</div>
                        <div style={{ fontSize: 9, color: TX.textSec, marginTop: 1, lineHeight: 1.4 }}>{a.desc}</div>
                      </div>
                      {a.action && a.actionFn && (
                        <button onClick={(e) => { e.stopPropagation(); a.actionFn!() }}
                          style={{ padding: '4px 10px', background: a.color + '10', border: `1px solid ${a.color}25`, borderRadius: 6, fontSize: 8, fontWeight: 700, color: a.color, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {a.action} →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Quick navigation row */}
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: `1px solid ${TX.border}`, background: BG.input }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: TX.textMuted, marginRight: 4 }}>AZIONI RAPIDE</span>
                {[
                  { label: '+ Commessa', icon: 'plus', fn: () => { setActiveTab('commesse'); setTimeout(() => setShowNewCommessa(true), 100) }, color: TH.green },
                  { label: 'Calendario', icon: 'calendar', fn: () => setActiveTab('calendario'), color: TH.blue },
                  { label: 'Rete Comm.', icon: 'users', fn: () => setActiveTab('rete'), color: TH.purple },
                  { label: 'Marketplace', icon: 'store', fn: () => setActiveTab('marketplace'), color: AC },
                  { label: 'Configuratore', icon: 'window', fn: () => setActiveTab('configuratore'), color: TH.amber },
                ].map((q, qi) => (
                  <button key={qi} onClick={(e) => { e.stopPropagation(); q.fn() }}
                    style={{ padding: '4px 10px', background: BG.card, border: `1px solid ${TX.border}`, borderRadius: 6, fontSize: 9, fontWeight: 600, color: q.color, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Ic n={q.icon} s={10} c={q.color}/> {q.label}
                  </button>
                ))}
                {topCommessa && (
                  <button onClick={(e) => { e.stopPropagation(); setActiveTab('commesse'); setTimeout(() => setSelectedCommessa(topCommessa.id), 100) }}
                    style={{ marginLeft: 'auto', padding: '4px 10px', background: AC + '08', border: `1px solid ${AC}20`, borderRadius: 6, fontSize: 9, fontWeight: 700, color: AC, cursor: 'pointer' }}>
                    🔥 Priorità: {topCommessa.codice} ({getStato(topCommessa.stato).label})
                  </button>
                )}
              </div>
            </div>
          )
        })()}

        {/* Fullscreen widget overlay */}
        {expandedWidget && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: BG.page, overflowY: 'auto', padding: 24 }}
            onClick={() => setExpandedWidget(null)}>
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Ic n={dashWidgets.find(w => w.id === expandedWidget)?.icon || 'grid'} s={18} c={AC}/>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: TX.text }}>{dashWidgets.find(w => w.id === expandedWidget)?.label}</h2>
                </div>
                <button onClick={() => setExpandedWidget(null)}
                  className="flex items-center gap-1.5" style={{ padding: '8px 16px', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: rd, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: TX.text }}>
                  <Ic n="x" s={14} c={TX.textMuted}/> Chiudi
                </button>
              </div>
              <div style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow, borderRadius: rd, padding: 24 }}>
                {widgetMap[expandedWidget]}
              </div>
            </div>
          </div>
        )}

        {/* Widget grid */}
        <div className={`grid grid-cols-12 ${gap}`}>
          {visibleWidgets.map(w => (
            <div key={w.id} data-wid={w.id} className={colClass(w.size)}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setWMenu({ x: e.clientX, y: e.clientY, wid: w.id }); setWAddMenu(null) }}>
              <div style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow, borderRadius: rd, position: 'relative' }}>
                {/* Expand button */}
                <button onClick={(e) => { e.stopPropagation(); setExpandedWidget(w.id) }}
                  style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, padding: '3px 5px', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 6,
                    cursor: 'pointer', opacity: 0.3, transition: 'opacity 0.2s' }}
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1' }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = '0.3' }}>
                  <Ic n="maximize" s={10} c={TX.textMuted}/>
                </button>
                <div className={pad}>{widgetMap[w.id]}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Add widget button */}
        {hiddenWidgets.length > 0 && (
          <div className="mt-4 text-center">
            <button onClick={(e) => { e.stopPropagation(); setWAddMenu({ x: e.clientX, y: e.clientY }) }} className="inline-flex items-center gap-2"
              style={{ padding: '8px 16px', border: `2px dashed ${TX.border}`, background: 'transparent', color: TX.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: rd }}>
              <Ic n="plus" s={13} c={TX.textMuted}/> Aggiungi widget ({hiddenWidgets.length} disponibili)
            </button>
          </div>
        )}

        {/* Widget context menu (right-click) */}
        {wMenu && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }} onClick={(e) => { e.stopPropagation(); setWMenu(null) }}>
            <div style={{ position: 'absolute', left: Math.min(wMenu.x, window.innerWidth - 220), top: Math.min(wMenu.y, window.innerHeight - 320) }} onClick={(e) => e.stopPropagation()}>
              <div style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : isDark ? '0 4px 12px rgba(0,0,0,0.4)' : isDark ? '0 4px 12px rgba(0,0,0,0.4)' : TH.shadowMd, minWidth: 200, padding: '4px 0', borderRadius: rd }}>
                <div style={{ padding: '5px 14px', fontSize: 9, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                  {dashWidgets.find(w => w.id === wMenu.wid)?.label}
                </div>
                <div style={{ height: 1, background: TX.border, margin: '4px 0' }} />
                <button onClick={() => { wMove(wMenu.wid, -1); setWMenu(null) }} style={{ display: 'block', width: '100%', padding: '7px 14px', fontSize: 12, color: TX.text, cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'left' }}>⬆ Sposta su</button>
                <button onClick={() => { wMove(wMenu.wid, 1); setWMenu(null) }} style={{ display: 'block', width: '100%', padding: '7px 14px', fontSize: 12, color: TX.text, cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'left' }}>⬇ Sposta giù</button>
                <div style={{ height: 1, background: TX.border, margin: '4px 0' }} />
                <div style={{ padding: '5px 14px', fontSize: 9, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Dimensione</div>
                {[{ id: 'full', l: '▬▬ Intero' }, { id: 'half', l: '▬ Metà' }, { id: 'third', l: '▪ Terzo' }].map(s => (
                  <button key={s.id} onClick={() => { wResize(wMenu.wid, s.id); setWMenu(null) }}
                    style={{ display: 'block', width: '100%', padding: '6px 14px', fontSize: 11, color: dashWidgets.find(w => w.id === wMenu.wid)?.size === s.id ? AC : TX.text, fontWeight: dashWidgets.find(w => w.id === wMenu.wid)?.size === s.id ? 700 : 400, cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'left' }}>{s.l}</button>
                ))}
                <div style={{ height: 1, background: TX.border, margin: '4px 0' }} />
                <button onClick={() => { wHide(wMenu.wid); setWMenu(null) }}
                  style={{ display: 'block', width: '100%', padding: '7px 14px', fontSize: 12, color: TH.red, cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'left' }}>✕ Nascondi</button>
              </div>
            </div>
          </div>
        )}

        {/* Add widget menu */}
        {wAddMenu && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }} onClick={(e) => { e.stopPropagation(); setWAddMenu(null) }}>
            <div style={{ position: 'absolute', left: Math.min(wAddMenu.x, window.innerWidth - 240), top: Math.min(wAddMenu.y, window.innerHeight - 300) }} onClick={(e) => e.stopPropagation()}>
              <div style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : isDark ? '0 4px 12px rgba(0,0,0,0.4)' : isDark ? '0 4px 12px rgba(0,0,0,0.4)' : TH.shadowMd, minWidth: 220, padding: '4px 0', borderRadius: rd }}>
                <div style={{ padding: '5px 14px', fontSize: 9, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Aggiungi widget</div>
                <div style={{ height: 1, background: TX.border, margin: '4px 0' }} />
                {hiddenWidgets.length === 0 && <div style={{ padding: '12px 14px', fontSize: 11, color: TX.textMuted }}>Tutti i widget sono visibili</div>}
                {hiddenWidgets.map(w => (
                  <button key={w.id} onClick={() => { wShow(w.id); setWAddMenu(null) }}
                    style={{ display: 'flex', width: '100%', padding: '7px 14px', fontSize: 12, color: TX.text, cursor: 'pointer', background: 'transparent', border: 'none', textAlign: 'left', alignItems: 'center', gap: 8 }}>
                    <Ic n={w.icon} s={13} c={AC}/> {w.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }


  // ==================== MARKETPLACE ====================
  const MarketplaceContent = () => {
    const [mkView, setMkView] = useState('catalogo')
    const [mkSearch, setMkSearch] = useState('')
    const [mkCat, setMkCat] = useState('tutti')
    const [mkSelectedFornitore, setMkSelectedFornitore] = useState<string|null>(null)
    const [mkShowRFQ, setMkShowRFQ] = useState(false)
    const [mkRFQComm, setMkRFQComm] = useState('')
    const [mkConfronto, setMkConfronto] = useState(false)

    // Sample marketplace fornitori (enriched with marketplace data)
    const mkFornitori = [
      { id: 'f1', nome: 'Schüco Italia Srl', categoria: 'profili', zone: ['Calabria','Campania','Sicilia'], rating: 4.7, ordini: 234, tempoMedio: 5, puntualita: 94, prezzo: 'medio-alto', logo: '🏗️',
        prodotti: ['AWS 75', 'ASS 77 PD', 'AWS 90', 'SI 82'], desc: 'Leader mondiale sistemi per finestre e facciate. Profili in alluminio alta gamma.',
        contatto: 'marco.bianchi@schuco.it', tel: '+39 02 8888 1234' },
      { id: 'f2', nome: 'AGC Glass Europe', categoria: 'vetri', zone: ['Italia'], rating: 4.5, ordini: 189, tempoMedio: 4, puntualita: 91, prezzo: 'competitivo', logo: '🪟',
        prodotti: ['Planitherm XN', 'Stratobel', 'Stopray', 'iplus'], desc: 'Vetrocamere basso emissive e stratificate. Consegna rapida zona Calabria.',
        contatto: 'ordini.sud@agc.com', tel: '+39 089 555 6789' },
      { id: 'f3', nome: 'Maico Srl', categoria: 'ferramenta', zone: ['Italia'], rating: 4.8, ordini: 312, tempoMedio: 3, puntualita: 97, prezzo: 'medio', logo: '🔩',
        prodotti: ['Multi-Matic', 'Multi-Power', 'Cerniere', 'Maniglie'], desc: 'Ferramenta per serramenti in alluminio e PVC. Qualità tedesca, rete Italia.',
        contatto: 'vendite@maico.it', tel: '+39 0471 555 333' },
      { id: 'f4', nome: 'Deventer Srl', categoria: 'guarnizioni', zone: ['Calabria','Puglia','Campania'], rating: 4.3, ordini: 156, tempoMedio: 6, puntualita: 88, prezzo: 'economico', logo: '🔧',
        prodotti: ['SPV', 'SV', 'DS', 'Guarnizioni centrali'], desc: 'Guarnizioni e sigillanti per serramenti. Ampia gamma TPE e silicone.',
        contatto: 'sud@deventer.it', tel: '+39 035 444 5678' },
      { id: 'f5', nome: 'Eclisse Srl', categoria: 'controtelai', zone: ['Italia'], rating: 4.6, ordini: 98, tempoMedio: 7, puntualita: 92, prezzo: 'medio-alto', logo: '🚪',
        prodotti: ['Syntesis', 'Unico', 'Luce', 'Controtelaio Classic'], desc: 'Controtelai per porte scorrevoli e battenti. Consegna in tutta Italia.',
        contatto: 'ordini@eclisse.it', tel: '+39 0422 333 444' },
      { id: 'f6', nome: 'Reynaers Aluminium', categoria: 'profili', zone: ['Calabria','Campania','Basilicata'], rating: 4.4, ordini: 167, tempoMedio: 6, puntualita: 89, prezzo: 'competitivo', logo: '🏗️',
        prodotti: ['MasterLine 8', 'SlimLine 38', 'Hi-Finity', 'CS 86-HI'], desc: 'Sistemi in alluminio per finestre, porte e facciate continue.',
        contatto: 'italia@reynaers.com', tel: '+39 049 777 8888' },
      { id: 'f7', nome: 'Pilkington Italia', categoria: 'vetri', zone: ['Italia'], rating: 4.2, ordini: 145, tempoMedio: 5, puntualita: 86, prezzo: 'economico', logo: '🪟',
        prodotti: ['Optitherm', 'Optiwhite', 'Suncool', 'Pyrostop'], desc: 'Vetri float, stratificati e speciali. Stabilimento Sud Italia.',
        contatto: 'commerciale@pilkington.it', tel: '+39 080 222 3333' },
      { id: 'f8', nome: 'Roto Frank AG', categoria: 'ferramenta', zone: ['Italia'], rating: 4.6, ordini: 201, tempoMedio: 4, puntualita: 93, prezzo: 'medio', logo: '🔩',
        prodotti: ['NT', 'NX', 'Patio Inowa', 'TiltFirst'], desc: 'Ferramenta anta-ribalta, scorrevoli e parallelo. Premium quality.',
        contatto: 'ordini@roto-frank.it', tel: '+39 045 888 9999' },
    ]

    const categories = [
      { id: 'tutti', label: 'Tutti', icon: 'grid' },
      { id: 'profili', label: 'Profili', icon: 'layers' },
      { id: 'vetri', label: 'Vetri', icon: 'eye' },
      { id: 'ferramenta', label: 'Ferramenta', icon: 'wrench' },
      { id: 'guarnizioni', label: 'Guarnizioni', icon: 'settings' },
      { id: 'controtelai', label: 'Controtelai', icon: 'window' },
    ]

    const filtered = mkFornitori.filter(f => {
      if (mkCat !== 'tutti' && f.categoria !== mkCat) return false
      if (mkSearch && !f.nome.toLowerCase().includes(mkSearch.toLowerCase()) && !f.prodotti.some(p => p.toLowerCase().includes(mkSearch.toLowerCase()))) return false
      return true
    })

    // Sample RFQ data
    const sampleRFQs = [
      { id: 'rfq1', commessa: 'WC-0254', titolo: 'Appartamento Via Roma', stato: 'in_attesa', fornitori: 3, risposte: 1, creata: '2025-02-10', materiali: 12 },
      { id: 'rfq2', commessa: 'WC-0256', titolo: 'Uffici C.so Mazzini', stato: 'completata', fornitori: 4, risposte: 4, creata: '2025-02-05', materiali: 24, risparmio: 820 },
    ]

    // Sample confronto data
    const sampleConfronto = [
      { materiale: 'Profilo AWS 75 (6m)', qta: 24, fornitori: [
        { nome: 'Schüco Italia', prezzo: 145, consegna: 5, dispo: true },
        { nome: 'Reynaers', prezzo: 128, consegna: 7, dispo: true },
      ]},
      { materiale: 'Vetrocamera 4/16/4 BE', qta: 16, fornitori: [
        { nome: 'AGC Glass', prezzo: 38, consegna: 4, dispo: true },
        { nome: 'Pilkington', prezzo: 34, consegna: 6, dispo: true },
      ]},
      { materiale: 'Ferramenta Multi-Matic', qta: 8, fornitori: [
        { nome: 'Maico', prezzo: 42, consegna: 3, dispo: true },
        { nome: 'Roto Frank', prezzo: 45, consegna: 4, dispo: true },
      ]},
    ]

    // Stats
    const mkStats = {
      fornitoriAttivi: mkFornitori.length,
      rfqInCorso: sampleRFQs.filter(r => r.stato === 'in_attesa').length,
      risparmiMedio: '12%',
      transato: '€ 48.500',
    }

    const renderStars = (rating: number) => {
      return '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating))
    }

    return (
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: TX.text, letterSpacing: -0.5 }}>
              <Ic n="store" s={20} c={AC}/> Marketplace Fornitori
            </h2>
            <p style={{ fontSize: 11, color: TX.textMuted, marginTop: 2 }}>Ordina materiale, confronta prezzi, traccia consegne — tutto in un click</p>
          </div>
          <button onClick={() => setMkShowRFQ(true)}
            style={{ padding: '8px 18px', background: AC, border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Ic n="send" s={14} c="#fff"/> Nuova Richiesta Preventivi
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Fornitori Attivi', value: mkStats.fornitoriAttivi, icon: 'building', color: TH.blue },
            { label: 'RFQ in Corso', value: mkStats.rfqInCorso, icon: 'send', color: AC },
            { label: 'Risparmio Medio', value: mkStats.risparmiMedio, icon: 'chart', color: TH.green },
            { label: 'Transato Mese', value: mkStats.transato, icon: 'dollar', color: TH.purple },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 9, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>{s.label}</span>
                <Ic n={s.icon} s={14} c={s.color}/>
              </div>
              <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: BG.input, display: 'inline-flex' }}>
          {[
            { id: 'catalogo', label: 'Fornitori', icon: 'building' },
            { id: 'rfq', label: 'Preventivi', icon: 'send' },
            { id: 'confronto', label: 'Confronto', icon: 'chart' },
            { id: 'tracking', label: 'Tracking', icon: 'truck' },
            { id: 'fatturazione', label: 'Fatturazione SDI', icon: 'creditcard' },
            { id: 'scoring', label: 'Scoring', icon: 'activity' },
          ].map(v => (
            <button key={v.id} onClick={() => setMkView(v.id)} className="px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5"
              style={{ background: mkView === v.id ? BG.card : 'transparent', color: mkView === v.id ? AC : TX.textMuted, border: 'none', cursor: 'pointer', boxShadow: mkView === v.id ? isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow : 'none' }}>
              <Ic n={v.icon} s={12} c={mkView === v.id ? AC : TX.textMuted}/> {v.label}
            </button>
          ))}
        </div>

        {/* ═══════ CATALOGO FORNITORI ═══════ */}
        {mkView === 'catalogo' && (
          <div>
            {/* Search + filters */}
            <div className="flex gap-3 mb-4">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: BG.input, border: `1px solid ${TX.border}` }}>
                <Ic n="search" s={14} c={TX.textMuted}/>
                <input value={mkSearch} onChange={(e) => setMkSearch(e.target.value)} placeholder="Cerca fornitore, prodotto, marca..."
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: TX.text, fontSize: 13 }} />
              </div>
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: BG.input }}>
                {categories.map(c => (
                  <button key={c.id} onClick={() => setMkCat(c.id)} className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                    style={{ background: mkCat === c.id ? BG.card : 'transparent', color: mkCat === c.id ? AC : TX.textMuted, border: 'none', cursor: 'pointer', boxShadow: mkCat === c.id ? isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow : 'none' }}>
                    <Ic n={c.icon} s={10} c={mkCat === c.id ? AC : TX.textMuted}/> {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fornitori grid */}
            <div className="grid grid-cols-2 gap-4">
              {filtered.map(f => (
                <div key={f.id} className="rounded-xl cursor-pointer" onClick={() => setMkSelectedFornitore(mkSelectedFornitore === f.id ? null : f.id)}
                  style={{ background: BG.card, border: `1px solid ${mkSelectedFornitore === f.id ? AC + '60' : TX.border}`, boxShadow: TH.shadow, overflow: 'hidden' }}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG.input, borderRadius: 10 }}>{f.logo}</div>
                        <div>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: TX.text }}>{f.nome}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span style={{ fontSize: 10, color: AC, letterSpacing: -1 }}>{renderStars(f.rating)}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: AC }}>{f.rating}</span>
                            <span style={{ fontSize: 9, color: TX.textMuted }}>({f.ordini} ordini)</span>
                          </div>
                        </div>
                      </div>
                      <Badge text={f.categoria} color={f.categoria === 'profili' ? TH.blue : f.categoria === 'vetri' ? TH.green : f.categoria === 'ferramenta' ? TH.purple : f.categoria === 'guarnizioni' ? TH.red : AC} />
                    </div>
                    <p style={{ fontSize: 11, color: TX.textSec, marginBottom: 8, lineHeight: 1.4 }}>{f.desc}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {f.prodotti.slice(0, 4).map(p => (
                        <span key={p} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: BG.input, color: TX.textSec, fontWeight: 500 }}>{p}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Ic n="truck" s={10} c={TH.blue}/>
                        <span style={{ fontSize: 10, color: TX.textSec }}>{f.tempoMedio}gg medi</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Ic n="check" s={10} c={TH.green}/>
                        <span style={{ fontSize: 10, color: TH.green, fontWeight: 600 }}>{f.puntualita}% puntuale</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Ic n="dollar" s={10} c={TH.purple}/>
                        <span style={{ fontSize: 10, color: TX.textSec }}>{f.prezzo}</span>
                      </div>
                      <div className="flex items-center gap-1" style={{ marginLeft: 'auto' }}>
                        {f.zone.slice(0, 2).map(z => (
                          <span key={z} style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: TH.blue + '10', color: TH.blue }}>{z}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {mkSelectedFornitore === f.id && (
                    <div className="px-4 pb-4 pt-2" style={{ borderTop: `1px solid ${TX.border}` }}>
                      <div className="grid grid-cols-3 gap-3 mb-3">
                        <div className="p-2 rounded-lg" style={{ background: BG.input }}>
                          <div style={{ fontSize: 8, color: TX.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>Contatto</div>
                          <div style={{ fontSize: 10, color: TX.text, fontWeight: 600 }}>{f.contatto}</div>
                        </div>
                        <div className="p-2 rounded-lg" style={{ background: BG.input }}>
                          <div style={{ fontSize: 8, color: TX.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>Telefono</div>
                          <div style={{ fontSize: 10, color: TX.text, fontWeight: 600 }}>{f.tel}</div>
                        </div>
                        <div className="p-2 rounded-lg" style={{ background: BG.input }}>
                          <div style={{ fontSize: 8, color: TX.textMuted, textTransform: 'uppercase', marginBottom: 2 }}>Zone</div>
                          <div style={{ fontSize: 10, color: TX.text, fontWeight: 600 }}>{f.zone.join(', ')}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setMkShowRFQ(true) }}
                          style={{ flex: 1, padding: '8px 0', background: AC, border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                          <Ic n="send" s={11} c="#fff"/> Richiedi Preventivo
                        </button>
                        <button style={{ flex: 1, padding: '8px 0', background: TH.blue + '10', border: `1px solid ${TH.blue}30`, borderRadius: 8, fontSize: 11, fontWeight: 700, color: TH.blue, cursor: 'pointer' }}>
                          <Ic n="clipboard" s={11} c={TH.blue}/> Vedi Storico Ordini
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ RICHIESTE PREVENTIVI ═══════ */}
        {mkView === 'rfq' && (
          <div>
            <div className="space-y-3">
              {sampleRFQs.map(rfq => (
                <div key={rfq.id} className="p-4 rounded-xl" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: AC }}>{rfq.commessa}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: TX.text }}>{rfq.titolo}</span>
                    </div>
                    <Badge text={rfq.stato === 'in_attesa' ? 'In attesa risposte' : rfq.stato === 'completata' ? 'Completata' : rfq.stato} color={rfq.stato === 'in_attesa' ? AC : TH.green} />
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1"><Ic n="building" s={10} c={TX.textMuted}/><span style={{ fontSize: 10, color: TX.textSec }}>{rfq.fornitori} fornitori contattati</span></div>
                    <div className="flex items-center gap-1"><Ic n="check" s={10} c={TH.green}/><span style={{ fontSize: 10, color: TH.green }}>{rfq.risposte}/{rfq.fornitori} risposte</span></div>
                    <div className="flex items-center gap-1"><Ic n="package" s={10} c={TX.textMuted}/><span style={{ fontSize: 10, color: TX.textSec }}>{rfq.materiali} materiali</span></div>
                    <div className="flex items-center gap-1"><Ic n="calendar" s={10} c={TX.textMuted}/><span style={{ fontSize: 10, color: TX.textSec }}>{rfq.creata}</span></div>
                    {rfq.risparmio && <div className="flex items-center gap-1"><Ic n="chart" s={10} c={TH.green}/><span style={{ fontSize: 10, color: TH.green, fontWeight: 700 }}>Risparmiato €{rfq.risparmio}</span></div>}
                  </div>
                  {/* Progress bar for responses */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full" style={{ background: BG.input }}>
                      <div className="h-2 rounded-full" style={{ background: rfq.stato === 'completata' ? TH.green : AC, width: `${(rfq.risposte / rfq.fornitori) * 100}%`, transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: 9, color: TX.textMuted }}>{Math.round((rfq.risposte / rfq.fornitori) * 100)}%</span>
                  </div>
                  {rfq.stato === 'in_attesa' && rfq.risposte > 0 && (
                    <button onClick={() => { setMkView('confronto'); setMkConfronto(true) }}
                      className="mt-3" style={{ padding: '6px 14px', background: AC + '10', border: `1px solid ${AC}30`, borderRadius: 8, fontSize: 11, fontWeight: 600, color: AC, cursor: 'pointer' }}>
                      <Ic n="chart" s={11} c={AC}/> Confronta Preventivi
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ CONFRONTO PREZZI ═══════ */}
        {mkView === 'confronto' && (
          <div>
            <div className="rounded-xl overflow-hidden" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
              <div className="p-4" style={{ borderBottom: `1px solid ${TX.border}` }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: TX.text }}>Confronto Preventivi — WC-0254 Appartamento Via Roma</h3>
                <p style={{ fontSize: 11, color: TX.textMuted, marginTop: 2 }}>Confronta prezzi, tempi e disponibilità tra fornitori</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: BG.input }}>
                      <th style={{ padding: '10px 16px', fontSize: 10, fontWeight: 700, color: TX.textMuted, textAlign: 'left', textTransform: 'uppercase', letterSpacing: 1 }}>Materiale</th>
                      <th style={{ padding: '10px 12px', fontSize: 10, fontWeight: 700, color: TX.textMuted, textAlign: 'center' }}>Qtà</th>
                      {['Fornitore A', 'Fornitore B'].map((f, i) => (
                        <th key={i} style={{ padding: '10px 12px', fontSize: 10, fontWeight: 700, color: i === 0 ? TH.blue : TH.purple, textAlign: 'center' }}>{f}</th>
                      ))}
                      <th style={{ padding: '10px 12px', fontSize: 10, fontWeight: 700, color: TH.green, textAlign: 'center' }}>Risparmio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleConfronto.map((row, ri) => {
                      const prezzi = row.fornitori.map(f => f.prezzo * row.qta)
                      const min = Math.min(...prezzi)
                      const max = Math.max(...prezzi)
                      const risparmio = max - min
                      return (
                        <tr key={ri} style={{ borderBottom: `1px solid ${TX.border}` }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: TX.text }}>{row.materiale}</div>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: TX.textSec }}>{row.qta}</td>
                          {row.fornitori.map((f, fi) => {
                            const tot = f.prezzo * row.qta
                            const isBest = tot === min
                            return (
                              <td key={fi} style={{ padding: '12px', textAlign: 'center' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: isBest ? TH.green : TX.text }}>{fmtDec(tot)}</div>
                                <div style={{ fontSize: 9, color: TX.textMuted }}>{f.nome}</div>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                  <Ic n="truck" s={8} c={TX.textMuted}/><span style={{ fontSize: 8, color: TX.textMuted }}>{f.consegna}gg</span>
                                  {f.dispo && <span style={{ fontSize: 7, padding: '0 3px', borderRadius: 2, background: TH.green + '15', color: TH.green, fontWeight: 700 }}>✓ dispo</span>}
                                </div>
                                {isBest && <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 4, background: TH.green + '15', color: TH.green, fontWeight: 700, display: 'inline-block', marginTop: 3 }}>Miglior prezzo</span>}
                              </td>
                            )
                          })}
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {risparmio > 0 && <span style={{ fontSize: 12, fontWeight: 700, color: TH.green }}>€{risparmio.toFixed(0)}</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: BG.input }}>
                      <td colSpan={2} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: TX.text }}>TOTALE</td>
                      {[0, 1].map(fi => {
                        const tot = sampleConfronto.reduce((s, r) => s + (r.fornitori[fi]?.prezzo || 0) * r.qta, 0)
                        const allTots = [0, 1].map(i => sampleConfronto.reduce((s, r) => s + (r.fornitori[i]?.prezzo || 0) * r.qta, 0))
                        const isBest = tot === Math.min(...allTots)
                        return <td key={fi} style={{ padding: '12px', textAlign: 'center', fontSize: 14, fontWeight: 800, color: isBest ? TH.green : TX.text }}>{fmtDec(tot)}</td>
                      })}
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: TH.green }}>
                          €{Math.abs([0, 1].map(i => sampleConfronto.reduce((s, r) => s + (r.fornitori[i]?.prezzo || 0) * r.qta, 0)).reduce((a, b) => a - b)).toFixed(0)}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="p-4 flex gap-3" style={{ borderTop: `1px solid ${TX.border}` }}>
                <button style={{ flex: 1, padding: '10px 0', background: TH.green, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  <Ic n="check" s={13} c="#fff"/> Ordina dal Miglior Prezzo
                </button>
                <button style={{ flex: 1, padding: '10px 0', background: TH.blue + '10', border: `1px solid ${TH.blue}30`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: TH.blue, cursor: 'pointer' }}>
                  <Ic n="truck" s={13} c={TH.blue}/> Ordina Consegna Più Rapida
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ SCORING & ANALYTICS ═══════ */}
        {mkView === 'scoring' && (
          <div className="grid grid-cols-2 gap-4">
            {/* Top fornitori */}
            <div className="rounded-xl p-4" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: TX.text, marginBottom: 12 }}><Ic n="activity" s={13} c={AC}/> Classifica Fornitori</h3>
              <div className="space-y-2">
                {[...mkFornitori].sort((a, b) => b.rating - a.rating).map((f, i) => (
                  <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: BG.input }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? AC : i === 1 ? TX.textMuted : i === 2 ? '#CD7F32' : TX.textMuted, width: 24, textAlign: 'center' }}>
                      {i < 3 ? ['🥇','🥈','🥉'][i] : `${i + 1}°`}
                    </span>
                    <div className="text-lg">{f.logo}</div>
                    <div className="flex-1">
                      <div style={{ fontSize: 12, fontWeight: 600, color: TX.text }}>{f.nome}</div>
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 10, color: AC }}>{renderStars(f.rating)}</span>
                        <Badge text={f.categoria} color={TX.textMuted} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontSize: 16, fontWeight: 800, color: AC }}>{f.rating}</div>
                      <div style={{ fontSize: 8, color: TX.textMuted }}>{f.ordini} ordini</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance metrics */}
            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: TX.text, marginBottom: 12 }}><Ic n="truck" s={13} c={TH.blue}/> Puntualità Consegne</h3>
                <div className="space-y-2">
                  {[...mkFornitori].sort((a, b) => b.puntualita - a.puntualita).slice(0, 5).map(f => (
                    <div key={f.id} className="flex items-center gap-3">
                      <span style={{ fontSize: 10, color: TX.textSec, width: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nome.split(' ').slice(0, 2).join(' ')}</span>
                      <div className="flex-1 h-3 rounded-full" style={{ background: BG.input }}>
                        <div className="h-3 rounded-full" style={{ background: f.puntualita >= 95 ? TH.green : f.puntualita >= 90 ? TH.blue : AC, width: `${f.puntualita}%` }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: f.puntualita >= 95 ? TH.green : f.puntualita >= 90 ? TH.blue : AC, width: 35, textAlign: 'right' }}>{f.puntualita}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: TX.text, marginBottom: 12 }}><Ic n="clock" s={13} c={TH.purple}/> Tempi Medi Consegna</h3>
                <div className="space-y-2">
                  {[...mkFornitori].sort((a, b) => a.tempoMedio - b.tempoMedio).slice(0, 5).map(f => (
                    <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: BG.input }}>
                      <div className="text-lg">{f.logo}</div>
                      <div className="flex-1">
                        <span style={{ fontSize: 11, color: TX.text, fontWeight: 500 }}>{f.nome.split(' ').slice(0, 2).join(' ')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div style={{ width: f.tempoMedio * 12, height: 8, borderRadius: 4, background: f.tempoMedio <= 4 ? TH.green : f.tempoMedio <= 6 ? AC : TH.red }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: f.tempoMedio <= 4 ? TH.green : f.tempoMedio <= 6 ? AC : TH.red }}>{f.tempoMedio}gg</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Marketplace insight */}
              <div className="rounded-xl p-4" style={{ background: AC + '08', border: `1px solid ${AC}20` }}>
                <p style={{ fontSize: 10, color: AC, fontWeight: 700, marginBottom: 4 }}>💡 Indice Prezzi MASTRO</p>
                <p style={{ fontSize: 11, color: TX.textSec, lineHeight: 1.5 }}>
                  Basato su {mkFornitori.reduce((s, f) => s + f.ordini, 0)} ordini aggregati nella tua zona.
                  Profili alluminio: <b style={{ color: TX.text }}>+3.2%</b> ultimo trimestre. Vetrocamere: <b style={{ color: TH.green }}>-1.5%</b>. Ferramenta: <b style={{ color: TX.text }}>stabile</b>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ TRACKING ORDINI ═══════ */}
        {mkView === 'tracking' && (() => {
          const samplePOs = [
            { id: 'PO-001', commessa: 'WC-0254', titolo: 'Appartamento Via Roma', fornitore: 'Schüco Italia', materiale: 'Profili AWS 75 (24pz)', totale: 3480,
              stato_po: 'confermato' as string, data_consegna: '2025-02-20', critico: true,
              shipment: { corriere: 'Fercam', tracking: 'FRC2025123456', stato: 'in_transito' as string, eta: '2025-02-19', ultimo_evento: '15/02 08:30 - Partito da deposito Milano' },
              delivery: null },
            { id: 'PO-002', commessa: 'WC-0254', titolo: 'Appartamento Via Roma', fornitore: 'AGC Glass', materiale: 'Vetrocamere 4/16/4 BE (16pz)', totale: 608,
              stato_po: 'confermato' as string, data_consegna: '2025-02-22', critico: true,
              shipment: { corriere: 'BRT', tracking: 'BRT0987654321', stato: 'etichetta_creata' as string, eta: '2025-02-21', ultimo_evento: '14/02 - Etichetta creata, attesa ritiro' },
              delivery: null },
            { id: 'PO-003', commessa: 'WC-0256', titolo: 'Uffici C.so Mazzini', fornitore: 'Maico Srl', materiale: 'Ferramenta Multi-Matic (24 set)', totale: 1008,
              stato_po: 'confermato' as string, data_consegna: '2025-02-18', critico: false,
              shipment: { corriere: 'GLS', tracking: 'GLS1122334455', stato: 'consegnato' as string, eta: '2025-02-17', ultimo_evento: '17/02 14:20 - Consegnato' },
              delivery: { data: '2025-02-17', esito: 'conforme' as string, note: 'Tutto ok, 24 set verificati' } },
            { id: 'PO-004', commessa: 'WC-0260', titolo: 'fab', fornitore: 'Deventer Srl', materiale: 'Guarnizioni SPV (50m)', totale: 175,
              stato_po: 'inviato' as string, data_consegna: '2025-02-25', critico: false,
              shipment: null, delivery: null },
            { id: 'PO-005', commessa: 'WC-0254', titolo: 'Appartamento Via Roma', fornitore: 'Roto Frank', materiale: 'Cerniere NX (16pz)', totale: 320,
              stato_po: 'confermato' as string, data_consegna: '2025-02-16', critico: true,
              shipment: { corriere: 'BRT', tracking: 'BRT5566778899', stato: 'eccezione' as string, eta: '2025-02-16', ultimo_evento: '15/02 - ECCEZIONE: pacco danneggiato in transito' },
              delivery: null },
          ]
          const semaforo = (po: typeof samplePOs[0]) => {
            if (!po.shipment) return { icon: '⚪', color: TX.textMuted, label: 'In attesa' }
            if (po.shipment.stato === 'consegnato' && po.delivery?.esito === 'conforme') return { icon: '🟢', color: TH.green, label: 'Completato' }
            if (po.shipment.stato === 'consegnato') return { icon: '🟢', color: TH.green, label: 'Consegnato' }
            if (po.shipment.stato === 'eccezione') return { icon: '🔴', color: TH.red, label: 'Eccezione!' }
            if (po.shipment.stato === 'in_transito') return { icon: '🟡', color: AC, label: 'In transito' }
            if (po.shipment.stato === 'in_consegna') return { icon: '🟡', color: AC, label: 'In consegna' }
            return { icon: '⚪', color: TX.textMuted, label: po.shipment.stato.replace(/_/g, ' ') }
          }
          const commessaProntaProd = (commId: string) => {
            const pos = samplePOs.filter(p => p.commessa === commId && p.critico)
            if (pos.length === 0) return { icon: '⚪', label: 'N/A' }
            const allOk = pos.every(p => p.shipment?.stato === 'consegnato')
            const anyBlock = pos.some(p => p.shipment?.stato === 'eccezione' || !p.shipment)
            if (allOk) return { icon: '🟢', label: 'Pronto Produzione' }
            if (anyBlock) return { icon: '🔴', label: 'Bloccato' }
            return { icon: '🟡', label: 'In arrivo' }
          }
          const uniqueComm = [...new Set(samplePOs.map(p => p.commessa))]
          return (
            <div>
              {/* Integration providers banner */}
              <div className="p-3 rounded-xl mb-4 flex items-center gap-4" style={{ background: TH.blue + '06', border: `1px solid ${TH.blue}15` }}>
                <div style={{ fontSize: 22 }}>🔗</div>
                <div className="flex-1">
                  <div style={{ fontSize: 11, fontWeight: 700, color: TH.blue }}>Tracking Multi-Corriere Automatico</div>
                  <div style={{ fontSize: 9, color: TX.textSec, lineHeight: 1.5 }}>
                    Integrato con <b>Qapla&apos;</b> (450+ corrieri) e <b>AfterShip</b> (1.100+ corrieri). 
                    BRT, GLS, Fercam, DHL, UPS, TNT, Poste — tutti con stati normalizzati in tempo reale.
                  </div>
                </div>
                <div className="flex gap-2">
                  {['Qapla\'', 'AfterShip', 'Gsped'].map(p => (
                    <span key={p} style={{ fontSize: 8, padding: '3px 8px', borderRadius: 5, background: BG.card, border: `1px solid ${TX.border}`, color: TX.textSec, fontWeight: 600 }}>{p}</span>
                  ))}
                </div>
                <span style={{ fontSize: 8, padding: '3px 10px', borderRadius: 5, background: TH.green + '12', color: TH.green, fontWeight: 700 }}>✓ ATTIVO</span>
              </div>

              {/* Semaforo produzione per commessa */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {uniqueComm.map(cid => {
                  const sem = commessaProntaProd(cid)
                  const pos = samplePOs.filter(p => p.commessa === cid)
                  const tit = pos[0]?.titolo || cid
                  return (
                    <div key={cid} className="p-3 rounded-xl" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: AC }}>{cid}</span>
                        <span style={{ fontSize: 14 }}>{sem.icon}</span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: TX.text, marginBottom: 2 }}>{tit}</div>
                      <div style={{ fontSize: 10, color: TX.textSec }}>{pos.length} ordini · {pos.filter(p => p.critico).length} critici</div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: sem.icon === '🟢' ? TH.green : sem.icon === '🔴' ? TH.red : AC, marginTop: 4 }}>{sem.label}</div>
                    </div>
                  )
                })}
              </div>

              {/* Orders list */}
              <div className="space-y-3">
                {samplePOs.map(po => {
                  const sem = semaforo(po)
                  return (
                    <div key={po.id} className="rounded-xl overflow-hidden" style={{ background: BG.card, border: `1px solid ${sem.color}30`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow,
                      borderLeft: `4px solid ${sem.color}` }}>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span style={{ fontSize: 16 }}>{sem.icon}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: AC }}>{po.id}</span>
                                <span style={{ fontSize: 11, fontFamily: 'monospace', color: TX.textMuted }}>{po.commessa}</span>
                                {po.critico && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: TH.red + '15', color: TH.red, fontWeight: 800 }}>CRITICO</span>}
                              </div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: TX.text }}>{po.materiale}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div style={{ fontSize: 14, fontWeight: 700, color: TH.green }}>{fmtDec(po.totale)}</div>
                            <div style={{ fontSize: 10, color: TX.textMuted }}>{po.fornitore}</div>
                          </div>
                        </div>

                        {/* Shipment tracking */}
                        {po.shipment ? (
                          <div className="p-3 rounded-lg mt-2" style={{ background: BG.input }}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Ic n="truck" s={12} c={sem.color}/> 
                                <span style={{ fontSize: 10, fontWeight: 600, color: TX.text }}>{po.shipment.corriere}</span>
                                <span style={{ fontSize: 9, fontFamily: 'monospace', color: TX.textMuted }}>{po.shipment.tracking}</span>
                              </div>
                              <Badge text={sem.label} color={sem.color} />
                            </div>
                            <div style={{ fontSize: 10, color: TX.textSec, marginTop: 4 }}>{po.shipment.ultimo_evento}</div>
                            <div className="flex items-center gap-4 mt-2">
                              <span style={{ fontSize: 9, color: TX.textMuted }}>ETA: <b style={{ color: TX.text }}>{po.shipment.eta}</b></span>
                              <span style={{ fontSize: 9, color: TX.textMuted }}>Consegna prevista: <b style={{ color: TX.text }}>{po.data_consegna}</b></span>
                            </div>
                            {/* Tracking progress */}
                            <div className="flex gap-1 mt-3">
                              {['etichetta', 'ritirato', 'in transito', 'in consegna', 'consegnato'].map((step, si) => {
                                const steps: Record<string, number> = { etichetta_creata: 0, ritirato: 1, in_transito: 2, in_consegna: 3, consegnato: 4, eccezione: -1 }
                                const current = steps[po.shipment!.stato] ?? 0
                                const isException = po.shipment!.stato === 'eccezione'
                                const active = !isException && si <= current
                                return (
                                  <div key={si} className="flex-1">
                                    <div style={{ height: 4, borderRadius: 2, background: isException ? TH.red + '30' : active ? sem.color : TX.bgHover, transition: 'background 0.3s' }} />
                                    <div style={{ fontSize: 7, color: active ? sem.color : TX.textMuted, marginTop: 2, textAlign: 'center' }}>{step}</div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg mt-2 text-center" style={{ background: BG.input, border: `1px dashed ${TX.border}` }}>
                            <span style={{ fontSize: 10, color: TX.textMuted }}>In attesa spedizione dal fornitore</span>
                          </div>
                        )}

                        {/* Delivery confirmation */}
                        {po.delivery && (
                          <div className="p-2 rounded-lg mt-2 flex items-center gap-2" style={{ background: TH.green + '08', border: `1px solid ${TH.green}20` }}>
                            <Ic n="check" s={12} c={TH.green}/>
                            <span style={{ fontSize: 10, color: TH.green, fontWeight: 600 }}>Ricevuto il {po.delivery.data} — {po.delivery.esito}</span>
                            <span style={{ fontSize: 9, color: TX.textMuted, marginLeft: 'auto' }}>{po.delivery.note}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {po.shipment?.stato === 'consegnato' && !po.delivery && (
                            <>
                              <button style={{ padding: '5px 12px', background: TH.green + '10', border: `1px solid ${TH.green}30`, borderRadius: 6, fontSize: 10, fontWeight: 600, color: TH.green, cursor: 'pointer' }}>
                                <Ic n="check" s={10} c={TH.green}/> Segna Conforme
                              </button>
                              <button style={{ padding: '5px 12px', background: TH.red + '10', border: `1px solid ${TH.red}30`, borderRadius: 6, fontSize: 10, fontWeight: 600, color: TH.red, cursor: 'pointer' }}>
                                <Ic n="alert" s={10} c={TH.red}/> Non Conforme
                              </button>
                            </>
                          )}
                          {po.shipment?.stato === 'eccezione' && (
                            <button style={{ padding: '5px 12px', background: TH.red + '10', border: `1px solid ${TH.red}30`, borderRadius: 6, fontSize: 10, fontWeight: 600, color: TH.red, cursor: 'pointer' }}>
                              <Ic n="send" s={10} c={TH.red}/> Sollecita Fornitore
                            </button>
                          )}
                          {!po.shipment && po.stato_po === 'inviato' && (
                            <button style={{ padding: '5px 12px', background: AC + '10', border: `1px solid ${AC}30`, borderRadius: 6, fontSize: 10, fontWeight: 600, color: AC, cursor: 'pointer' }}>
                              <Ic n="send" s={10} c={AC}/> Sollecita Spedizione
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ═══════ FATTURAZIONE SDI ═══════ */}
        {mkView === 'fatturazione' && (() => {
          const fatture = [
            { id: 'FE-001', tipo: 'vendita', numero: 'FV-2025/012', commessa: 'WC-0254', cliente: 'Mario Bianchi', importo: 8500, iva: 10, data: '2025-02-10', stato: 'consegnata', sdi_id: 'IT01234567890_ABCDE', pa: false },
            { id: 'FE-002', tipo: 'vendita', numero: 'FV-2025/013', commessa: 'WC-0256', cliente: 'Condominio Aurora', importo: 24000, iva: 10, data: '2025-02-12', stato: 'inviata', sdi_id: '', pa: false },
            { id: 'FE-003', tipo: 'acquisto', numero: 'FA-2025/087', commessa: 'WC-0254', fornitore: 'Schüco Italia', importo: 3480, iva: 22, data: '2025-02-08', stato: 'ricevuta', sdi_id: 'IT98765432100_XYZWK', pa: false },
            { id: 'FE-004', tipo: 'acquisto', numero: 'FA-2025/088', commessa: 'WC-0254', fornitore: 'AGC Glass', importo: 608, iva: 22, data: '2025-02-09', stato: 'ricevuta', sdi_id: 'IT55667788990_GLSS1', pa: false },
            { id: 'FE-005', tipo: 'vendita', numero: 'FV-2025/014', commessa: 'WC-0260', cliente: 'Studio Tecnico Rossi', importo: 3200, iva: 22, data: '2025-02-14', stato: 'bozza', sdi_id: '', pa: true },
          ]
          const statoFatt: Record<string, { label: string; color: string; icon: string }> = {
            bozza: { label: 'Bozza', color: TX.textMuted, icon: '📝' },
            inviata: { label: 'Inviata SDI', color: AC, icon: '📤' },
            consegnata: { label: 'Consegnata', color: TH.green, icon: '✅' },
            ricevuta: { label: 'Ricevuta', color: TH.blue, icon: '📥' },
            scartata: { label: 'Scartata', color: TH.red, icon: '❌' },
            non_consegnata: { label: 'Non consegnata', color: TH.red, icon: '⚠️' },
          }
          const totVendite = fatture.filter(f => f.tipo === 'vendita').reduce((s, f) => s + f.importo, 0)
          const totAcquisti = fatture.filter(f => f.tipo === 'acquisto').reduce((s, f) => s + f.importo, 0)
          return (
            <div>
              {/* SDI Integration banner */}
              <div className="p-3 rounded-xl mb-4 flex items-center gap-4" style={{ background: TH.green + '06', border: `1px solid ${TH.green}15` }}>
                <div style={{ fontSize: 22 }}>🏛️</div>
                <div className="flex-1">
                  <div style={{ fontSize: 11, fontWeight: 700, color: TH.green }}>Fatturazione Elettronica SDI — Integrazione Diretta</div>
                  <div style={{ fontSize: 9, color: TX.textSec, lineHeight: 1.5 }}>
                    Collegato a <b>Openapi.it</b> per invio/ricezione fatture via SDI. Firma digitale automatica, validazione preventiva, webhook per conferme.
                    Costo: ~€0,02/fattura. Alternativa disponibile: A-Cube API, Fattura Elettronica API, Invoicetronic.
                  </div>
                </div>
                <div className="flex gap-2">
                  {['Openapi.it', 'A-Cube', 'Invoicetronic'].map(p => (
                    <span key={p} style={{ fontSize: 8, padding: '3px 8px', borderRadius: 5, background: BG.card, border: `1px solid ${TX.border}`, color: TX.textSec, fontWeight: 600 }}>{p}</span>
                  ))}
                </div>
                <span style={{ fontSize: 8, padding: '3px 10px', borderRadius: 5, background: TH.green + '12', color: TH.green, fontWeight: 700 }}>✓ ATTIVO</span>
              </div>

              {/* KPI */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Fatture Emesse', value: fatture.filter(f => f.tipo === 'vendita').length, sub: fmtDec(totVendite), color: TH.green, icon: '📤' },
                  { label: 'Fatture Ricevute', value: fatture.filter(f => f.tipo === 'acquisto').length, sub: fmtDec(totAcquisti), color: TH.blue, icon: '📥' },
                  { label: 'In Attesa SDI', value: fatture.filter(f => f.stato === 'inviata').length, sub: 'da confermare', color: AC, icon: '⏳' },
                  { label: 'Margine Commesse', value: '', sub: fmtDec(totVendite - totAcquisti), color: totVendite > totAcquisti ? TH.green : TH.red, icon: '📊' },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 9, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>{s.label}</span>
                      <span style={{ fontSize: 14 }}>{s.icon}</span>
                    </div>
                    {s.value !== '' && <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>}
                    <div style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Fatture list */}
              <div className="space-y-2">
                {fatture.map(f => {
                  const st = statoFatt[f.stato] || statoFatt.bozza
                  return (
                    <div key={f.id} className="p-4 rounded-xl" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: 16 }}>{st.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace', color: TX.text }}>{f.numero}</span>
                              <Badge text={f.tipo === 'vendita' ? 'VENDITA' : 'ACQUISTO'} color={f.tipo === 'vendita' ? TH.green : TH.blue} />
                              <Badge text={st.label} color={st.color} />
                              {f.pa && <Badge text="PA" color={TH.purple} />}
                            </div>
                            <div style={{ fontSize: 10, color: TX.textSec }}>
                              {f.tipo === 'vendita' ? `Cliente: ${(f as any).cliente}` : `Fornitore: ${(f as any).fornitore}`} · Commessa {f.commessa}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'monospace', color: f.tipo === 'vendita' ? TH.green : TH.blue }}>{fmtDec(f.importo)}</div>
                          <div style={{ fontSize: 9, color: TX.textMuted }}>IVA {f.iva}% · {f.data}</div>
                        </div>
                      </div>

                      {/* SDI info */}
                      <div className="flex items-center gap-4">
                        {f.sdi_id && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md" style={{ background: BG.input, fontSize: 9 }}>
                            <span style={{ color: TX.textMuted }}>SDI:</span>
                            <span style={{ fontFamily: 'monospace', color: TX.text, fontWeight: 600 }}>{f.sdi_id}</span>
                          </div>
                        )}
                        <div className="flex gap-2 ml-auto">
                          {f.stato === 'bozza' && (
                            <>
                              <button style={{ padding: '4px 12px', background: AC, border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                                Valida & Invia SDI
                              </button>
                              <button style={{ padding: '4px 12px', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 6, fontSize: 10, color: TX.textSec, cursor: 'pointer' }}>
                                Anteprima XML
                              </button>
                            </>
                          )}
                          {f.stato === 'consegnata' && (
                            <button style={{ padding: '4px 12px', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 6, fontSize: 10, color: TX.textSec, cursor: 'pointer' }}>
                              Scarica PDF
                            </button>
                          )}
                          {f.stato === 'ricevuta' && (
                            <button style={{ padding: '4px 12px', background: TH.green + '10', border: `1px solid ${TH.green}30`, borderRadius: 6, fontSize: 10, fontWeight: 600, color: TH.green, cursor: 'pointer' }}>
                              Registra in Contabilità
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4">
                <button style={{ flex: 1, padding: '10px 0', background: AC, border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  + Nuova Fattura Vendita
                </button>
                <button style={{ flex: 1, padding: '10px 0', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 10, fontSize: 12, fontWeight: 700, color: TX.text, cursor: 'pointer' }}>
                  Importa da SDI
                </button>
              </div>
            </div>
          )
        })()}

        {/* ═══════ NEW RFQ MODAL ═══════ */}
        {mkShowRFQ && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setMkShowRFQ(false)}>
            <div className="rounded-xl" style={{ width: 520, background: BG.card, boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : TH.shadowMd, overflow: 'hidden' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="p-5" style={{ borderBottom: `1px solid ${TX.border}` }}>
                <div className="flex items-center justify-between">
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: TX.text }}><Ic n="send" s={16} c={AC}/> Nuova Richiesta Preventivi</h3>
                  <button onClick={() => setMkShowRFQ(false)} style={{ background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 8, padding: 6, cursor: 'pointer' }}><Ic n="x" s={14} c={TX.textMuted}/></button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>Commessa</label>
                  <select value={mkRFQComm} onChange={(e) => setMkRFQComm(e.target.value)}
                    style={{ width: '100%', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: TX.text, outline: 'none' }}>
                    <option value="">Seleziona commessa...</option>
                    {commesse.map(c => <option key={c.id} value={c.id}>{c.codice} — {c.titolo}</option>)}
                  </select>
                </div>
                <div className="p-3 rounded-lg" style={{ background: BG.input }}>
                  <p style={{ fontSize: 11, color: TX.textSec }}><Ic n="zap" s={11} c={AC}/> La distinta materiali verrà generata automaticamente dal configuratore. I fornitori nella tua zona riceveranno la richiesta e potranno rispondere direttamente qui.</p>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8 }}>Categorie da richiedere</label>
                  <div className="flex flex-wrap gap-2">
                    {['Profili','Vetrocamere','Ferramenta','Guarnizioni','Controtelai','Accessori'].map(c => (
                      <label key={c} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer" style={{ background: BG.card, border: `1px solid ${TX.border}`, fontSize: 11, color: TX.text }}>
                        <input type="checkbox" defaultChecked style={{ accentColor: AC }} /> {c}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 4 }}>Note per i fornitori</label>
                  <textarea rows={2} placeholder="Es: consegna urgente entro 5gg, materiale RAL 7016..."
                    style={{ width: '100%', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 12, color: TX.text, outline: 'none', resize: 'none' }} />
                </div>
              </div>
              <div className="p-5 flex gap-3" style={{ borderTop: `1px solid ${TX.border}`, background: BG.input }}>
                <button onClick={() => setMkShowRFQ(false)}
                  style={{ flex: 1, padding: '10px 0', background: 'transparent', border: `1px solid ${TX.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, color: TX.textSec, cursor: 'pointer' }}>
                  Annulla
                </button>
                <button onClick={() => { setMkShowRFQ(false); alert('RFQ inviata! I fornitori risponderanno nella sezione Richieste Preventivi.') }}
                  style={{ flex: 2, padding: '10px 0', background: AC, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                  <Ic n="send" s={12} c="#fff"/> Invia a Fornitori della Zona
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==================== PRATICHE & ENTI (Standalone) ====================
  const PraticheContent = () => {
    const [prView, setPrView] = useState('pratiche')

    // ── PRATICHE DATA ──
    const pratiche = [
      { id: 'PR-001', commessa: 'WC-0254', titolo: 'Pratica ENEA Ecobonus', tipo: 'ENEA', stato: 'in_lavorazione', scadenza: '2025-03-15', responsabile: 'Fabio Cozza',
        controparte: 'ENEA', priorita: 'alta',
        checklist: [
          { step: 'Raccolta dati immobile', done: true }, { step: 'Scheda descrittiva intervento', done: true },
          { step: 'Calcolo trasmittanza ante/post', done: true }, { step: 'Asseverazione tecnico', done: false },
          { step: 'Compilazione portale ENEA', done: false }, { step: 'Invio entro 90gg da fine lavori', done: false },
        ],
        documenti: ['Relazione_tecnica.pdf', 'Scheda_prodotto_AWS75.pdf', 'Fattura_WC0254.pdf'],
        invii: [{ canale: 'Portale', data: '', esito: 'non_inviato' }] },
      { id: 'PR-002', commessa: 'WC-0256', titolo: 'Detrazione 50% AdE', tipo: 'AdE', stato: 'inviata', scadenza: '2025-04-30', responsabile: 'Fabio Cozza',
        controparte: 'Agenzia delle Entrate', priorita: 'normale',
        checklist: [
          { step: 'Comunicazione bonifico parlante', done: true }, { step: 'Dichiarazione del costruttore', done: true },
          { step: 'Comunicazione ASL (se necessaria)', done: true }, { step: 'Invio documentazione fiscale', done: true },
        ],
        documenti: ['Bonifico_parlante.pdf', 'Dichiarazione_costruttore.pdf', 'Ricevuta_invio.pdf'],
        invii: [{ canale: 'PEC', data: '2025-02-10', esito: 'consegnato' }] },
      { id: 'PR-003', commessa: 'WC-0254', titolo: 'CILA Comune Cosenza', tipo: 'Comune', stato: 'in_attesa', scadenza: '2025-02-28', responsabile: 'Geom. Rossi',
        controparte: 'Comune di Cosenza - SUE', priorita: 'alta',
        checklist: [
          { step: 'Modulo CILA compilato', done: true }, { step: 'Relazione tecnica asseverata', done: true },
          { step: 'Elaborati grafici', done: true }, { step: 'Invio al SUE', done: true },
          { step: 'Protocollo ricevuto', done: true }, { step: 'Risposta ente', done: false },
        ],
        documenti: ['CILA_modulo.pdf', 'Elaborati_grafici.dwg', 'Protocollo_SUE_12345.pdf'],
        invii: [{ canale: 'PEC', data: '2025-02-05', esito: 'consegnato' }, { canale: 'Portale', data: '2025-02-05', esito: 'inviato' }] },
    ]
    const tipoColors: Record<string, string> = { ENEA: TH.green, AdE: TH.blue, Comune: TH.purple, Altro: TX.textMuted }
    const statoLabels: Record<string, { label: string; color: string }> = {
      da_fare: { label: 'Da fare', color: TX.textMuted }, in_lavorazione: { label: 'In lavorazione', color: AC },
      inviata: { label: 'Inviata', color: TH.blue }, in_attesa: { label: 'In attesa risposta', color: TH.purple },
      approvata: { label: 'Approvata', color: TH.green }, respinta: { label: 'Respinta', color: TH.red }, chiusa: { label: 'Chiusa', color: TX.textMuted },
    }

    // ── COMUNICAZIONI DATA ──
    const messages = [
      { id: 'm1', tipo: 'ente', da: 'ENEA', a: 'Fabio Cozza', oggetto: 'Pratica Ecobonus - Richiesta integrazione documenti', data: '2025-02-13 14:30', stato: 'da_leggere',
        canale: 'PEC', corpo: 'Si richiede integrazione della documentazione tecnica relativa alla trasmittanza termica dei serramenti installati. Termine: 15 giorni dalla ricezione.', allegati: ['Richiesta_integrazione.pdf'] },
      { id: 'm2', tipo: 'ente', da: 'Comune di Cosenza - SUE', a: 'Fabio Cozza', oggetto: 'CILA prot. 12345 - Ricevuta presentazione', data: '2025-02-05 16:45', stato: 'letto',
        canale: 'PEC', corpo: "Si comunica l'avvenuta presentazione della CILA. Protocollo n. 12345 del 05/02/2025. L'istanza verrà esaminata entro 30 giorni.", allegati: ['Protocollo_12345.pdf'] },
      { id: 'm3', tipo: 'consulente', da: 'Studio Commercialista Greco', a: 'Walter Cozza Srl', oggetto: 'Detrazione 50% WC-0256 - Documentazione completa', data: '2025-02-12 11:00', stato: 'letto',
        canale: 'Email', corpo: "Confermo che la documentazione per la detrazione fiscale al 50% è completa e conforme. La pratica è stata inoltrata all'AdE.", allegati: ['Riepilogo_detrazione.pdf'] },
      { id: 'm4', tipo: 'ente', da: 'Agenzia delle Entrate', a: 'Walter Cozza Srl', oggetto: 'Conferma ricezione dichiarazione detrazioni', data: '2025-02-11 09:00', stato: 'letto',
        canale: 'PEC', corpo: 'Si conferma la ricezione della documentazione relativa alle detrazioni fiscali per interventi di efficientamento energetico.', allegati: ['Ricevuta_AdE.pdf'] },
    ]
    const tipoIcon: Record<string, { emoji: string; color: string }> = { ente: { emoji: '🏛️', color: TH.purple }, consulente: { emoji: '👔', color: TH.green } }
    const canaleColors: Record<string, string> = { PEC: TH.red, Email: TH.blue, Portale: AC }

    return (
      <div className="space-y-4">
        {/* Integration banners */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: TH.green + '06', border: `1px solid ${TH.green}15` }}>
            <span style={{ fontSize: 22 }}>🌱</span>
            <div className="flex-1">
              <div style={{ fontSize: 11, fontWeight: 700, color: TH.green }}>ENEA — Pre-compilazione Automatica</div>
              <div style={{ fontSize: 9, color: TX.textSec, lineHeight: 1.4 }}>
                Portale richiede SPID. MASTRO pre-compila tutti i dati: trasmittanza Uw, superfici, dati catastali. <b>5 min invece di 45</b> + reminder 90gg.
              </div>
            </div>
            <span style={{ fontSize: 8, padding: '3px 10px', borderRadius: 5, background: AC + '12', color: AC, fontWeight: 700 }}>PRE-COMP.</span>
          </div>
          <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: TH.blue + '06', border: `1px solid ${TH.blue}15` }}>
            <span style={{ fontSize: 22 }}>🏛️</span>
            <div className="flex-1">
              <div style={{ fontSize: 11, fontWeight: 700, color: TH.blue }}>Agenzia Entrate — Invio PEC + Bonifici Parlanti</div>
              <div style={{ fontSize: 9, color: TX.textSec, lineHeight: 1.4 }}>
                Detrazioni 50%/65%: documentazione completa, verifica bonifici parlanti, invio PEC. Collegamento con fatturazione SDI.
              </div>
            </div>
            <span style={{ fontSize: 8, padding: '3px 10px', borderRadius: 5, background: TH.green + '12', color: TH.green, fontWeight: 700 }}>✓ PEC</span>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: BG.input, display: 'inline-flex' }}>
          {[
            { id: 'pratiche', label: 'Pratiche', icon: 'file' },
            { id: 'comunicazioni', label: 'Comunicazioni Enti', icon: 'inbox' },
          ].map(v => (
            <button key={v.id} onClick={() => setPrView(v.id)} className="px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5"
              style={{ background: prView === v.id ? BG.card : 'transparent', color: prView === v.id ? AC : TX.textMuted, border: 'none', cursor: 'pointer',
                boxShadow: prView === v.id ? isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow : 'none' }}>
              <Ic n={v.icon} s={12} c={prView === v.id ? AC : TX.textMuted}/> {v.label}
              {v.id === 'comunicazioni' && messages.filter(m => m.stato === 'da_leggere').length > 0 && (
                <span style={{ background: TH.red, color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 8, fontWeight: 700 }}>{messages.filter(m => m.stato === 'da_leggere').length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── PRATICHE LIST ── */}
        {prView === 'pratiche' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Pratiche Totali', value: pratiche.length, color: TH.blue, icon: 'file' },
                { label: 'In Lavorazione', value: pratiche.filter(p => p.stato === 'in_lavorazione').length, color: AC, icon: 'clock' },
                { label: 'In Attesa', value: pratiche.filter(p => p.stato === 'in_attesa').length, color: TH.purple, icon: 'inbox' },
                { label: 'Completate', value: pratiche.filter(p => ['approvata','chiusa'].includes(p.stato)).length, color: TH.green, icon: 'check' },
              ].map((s, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 9, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>{s.label}</span>
                    <Ic n={s.icon} s={14} c={s.color}/>
                  </div>
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Cards */}
            <div className="space-y-4">
              {pratiche.map(p => {
                const tc = tipoColors[p.tipo] || TX.textMuted
                const st = statoLabels[p.stato] || statoLabels.da_fare
                const checkDone = p.checklist.filter(c => c.done).length
                const checkTotal = p.checklist.length
                const checkPerc = Math.round((checkDone / checkTotal) * 100)
                return (
                  <div key={p.id} className="rounded-xl overflow-hidden" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: tc + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                            {p.tipo === 'ENEA' ? '🌱' : p.tipo === 'AdE' ? '🏛️' : p.tipo === 'Comune' ? '🏢' : '📄'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: AC }}>{p.id}</span>
                              <Badge text={p.tipo} color={tc} /> <Badge text={st.label} color={st.color} />
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: TX.text }}>{p.titolo}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div style={{ fontSize: 10, color: TX.textMuted }}>Scadenza</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: new Date(p.scadenza) < new Date() ? TH.red : TX.text }}>{p.scadenza}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 mb-3" style={{ fontSize: 10, color: TX.textSec }}>
                        <span><Ic n="user" s={10} c={TX.textMuted}/> {p.responsabile}</span>
                        <span><Ic n="building" s={10} c={TX.textMuted}/> {p.controparte}</span>
                        <span><Ic n="clipboard" s={10} c={TX.textMuted}/> {p.commessa}</span>
                        <span style={{ color: p.priorita === 'alta' ? TH.red : TX.textMuted, fontWeight: p.priorita === 'alta' ? 700 : 400 }}>Priorità: {p.priorita}</span>
                      </div>
                      {/* Checklist */}
                      <div className="p-3 rounded-lg mb-3" style={{ background: BG.input }}>
                        <div className="flex items-center justify-between mb-2">
                          <span style={{ fontSize: 10, fontWeight: 700, color: TX.text }}>Checklist</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: checkPerc === 100 ? TH.green : AC }}>{checkDone}/{checkTotal} ({checkPerc}%)</span>
                        </div>
                        <div className="h-2 rounded-full mb-2" style={{ background: TX.bgHover }}>
                          <div className="h-2 rounded-full" style={{ background: checkPerc === 100 ? TH.green : AC, width: `${checkPerc}%`, transition: 'width 0.3s' }} />
                        </div>
                        <div className="space-y-1">
                          {p.checklist.map((c, ci) => (
                            <div key={ci} className="flex items-center gap-2">
                              <span style={{ fontSize: 12, color: c.done ? TH.green : TX.textMuted }}>{c.done ? '✓' : '○'}</span>
                              <span style={{ fontSize: 10, color: c.done ? TX.textMuted : TX.text, textDecoration: c.done ? 'line-through' : 'none' }}>{c.step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Docs + Invii */}
                      <div className="flex items-center gap-2 mb-3">
                        <span style={{ fontSize: 9, fontWeight: 700, color: TX.textMuted, textTransform: 'uppercase' }}>Documenti:</span>
                        {p.documenti.map((d, di) => (<span key={di} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: BG.input, color: TX.textSec }}>📎 {d}</span>))}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span style={{ fontSize: 9, fontWeight: 700, color: TX.textMuted, textTransform: 'uppercase' }}>Invii:</span>
                        {p.invii.map((inv, ii) => (
                          <span key={ii} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4,
                            background: inv.esito === 'consegnato' ? TH.green + '12' : inv.esito === 'inviato' ? TH.blue + '12' : AC + '08',
                            color: inv.esito === 'consegnato' ? TH.green : inv.esito === 'inviato' ? TH.blue : TX.textMuted }}>
                            {inv.canale} {inv.data && `· ${inv.data}`} · {inv.esito.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                      {/* Actions */}
                      <div className="flex gap-2">
                        {p.stato === 'in_lavorazione' && (<>
                          <button style={{ padding: '6px 14px', background: AC, border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#fff', cursor: 'pointer' }}><Ic n="send" s={10} c="#fff"/> Invia via PEC</button>
                          <button style={{ padding: '6px 14px', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 6, fontSize: 10, fontWeight: 600, color: TX.text, cursor: 'pointer' }}><Ic n="file" s={10} c={TX.textMuted}/> Genera Documenti</button>
                          <button style={{ padding: '6px 14px', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 6, fontSize: 10, fontWeight: 600, color: TX.text, cursor: 'pointer' }}><Ic n="inbox" s={10} c={TX.textMuted}/> Portale: Prepara Pacchetto</button>
                        </>)}
                        {p.stato === 'in_attesa' && (<>
                          <button style={{ padding: '6px 14px', background: TH.purple + '10', border: `1px solid ${TH.purple}30`, borderRadius: 6, fontSize: 10, fontWeight: 600, color: TH.purple, cursor: 'pointer' }}><Ic n="send" s={10} c={TH.purple}/> Sollecita Ente</button>
                          <button style={{ padding: '6px 14px', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 6, fontSize: 10, fontWeight: 600, color: TX.text, cursor: 'pointer' }}><Ic n="file" s={10} c={TX.textMuted}/> Carica Ricevuta</button>
                        </>)}
                        {p.stato === 'inviata' && (
                          <button style={{ padding: '6px 14px', background: TH.green + '10', border: `1px solid ${TH.green}30`, borderRadius: 6, fontSize: 10, fontWeight: 600, color: TH.green, cursor: 'pointer' }}><Ic n="check" s={10} c={TH.green}/> Segna Approvata</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 text-center">
              <button style={{ padding: '10px 24px', background: AC, border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>+ Nuova Pratica (ENEA / AdE / Comune)</button>
            </div>
          </div>
        )}

        {/* ── COMUNICAZIONI ENTI ── */}
        {prView === 'comunicazioni' && (
          <div>
            <div className="space-y-2">
              {messages.map(m => {
                const ti = tipoIcon[m.tipo] || { emoji: '📨', color: TX.textMuted }
                const unread = m.stato === 'da_leggere'
                return (
                  <div key={m.id} className="p-4 rounded-xl cursor-pointer"
                    style={{ background: unread ? AC + '04' : BG.card, border: `1px solid ${unread ? AC + '30' : TX.border}`,
                      boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow, borderLeft: unread ? `3px solid ${AC}` : undefined }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 14 }}>{ti.emoji}</span>
                        <span style={{ fontSize: 12, fontWeight: unread ? 800 : 600, color: TX.text }}>{m.da}</span>
                        <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: (canaleColors[m.canale] || TX.textMuted) + '12', color: canaleColors[m.canale] || TX.textMuted, fontWeight: 600 }}>{m.canale}</span>
                        {unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: AC }} />}
                      </div>
                      <span style={{ fontSize: 9, color: TX.textMuted }}>{m.data}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: unread ? 700 : 500, color: TX.text, marginBottom: 4 }}>{m.oggetto}</div>
                    <div style={{ fontSize: 10, color: TX.textSec, lineHeight: 1.4, maxHeight: 36, overflow: 'hidden' }}>{m.corpo}</div>
                    {m.allegati.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {m.allegati.map((a, ai) => (<span key={ai} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 3, background: BG.input, color: TX.textMuted }}>📎 {a}</span>))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex gap-3">
              <button style={{ flex: 1, padding: '10px 0', background: TH.red + '10', border: `1px solid ${TH.red}30`, borderRadius: 10, fontSize: 12, fontWeight: 700, color: TH.red, cursor: 'pointer' }}><Ic n="send" s={12} c={TH.red}/> Invia PEC</button>
              <button style={{ flex: 1, padding: '10px 0', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 10, fontSize: 12, fontWeight: 700, color: TX.text, cursor: 'pointer' }}><Ic n="send" s={12} c={TX.textMuted}/> Invia Email</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==================== TEAM AZIENDALE ====================
  const TeamContent = () => {
    const [teamView, setTeamView] = useState('persone')
    const [selectedMembro, setSelectedMembro] = useState<string|null>(null)
    const [teamChatTarget, setTeamChatTarget] = useState<string|null>(null)
    const [teamChatMsg, setTeamChatMsg] = useState('')
    const [teamChatMessages, setTeamChatMessages] = useState<Record<string, Array<{id:string;from:string;msg:string;time:string;read:boolean}>>>({
      general: [
        { id: 'tc1', from: 'Fabio Cozza', msg: 'Ragazzi domani mattina riunione alle 8:30 per organizzare la settimana. Tutti presenti.', time: '14/02 08:00', read: true },
        { id: 'tc2', from: 'Luigi Ferraro', msg: 'Confermo. Porto i rilievi della Villa Rende.', time: '14/02 08:15', read: true },
        { id: 'tc3', from: 'Marco Ferraro', msg: 'Ok capo. Ho 3 sopralluoghi da programmare questa settimana.', time: '14/02 08:20', read: true },
        { id: 'tc4', from: 'Giuseppe Russo', msg: 'La saldatrice TIG ha bisogno di manutenzione, la porto lunedì dal tecnico.', time: '14/02 09:00', read: false },
      ],
      produzione: [
        { id: 'tc5', from: 'Giuseppe Russo', msg: 'Taglio profili WC-0254 completato. Inizio saldatura domani.', time: '14/02 14:30', read: true },
        { id: 'tc6', from: 'Antonio Ferraro', msg: 'Ho montato le ferramenta su WC-0256, mancano le maniglie. Chi ordina?', time: '14/02 15:00', read: false },
      ],
      cantiere: [
        { id: 'tc7', from: 'Luigi Ferraro', msg: 'Cantiere Via Roma: controtelaio posato, domani si montano i serramenti.', time: '14/02 11:00', read: true },
        { id: 'tc8', from: 'Salvatore Ferraro', msg: 'Portato il furgone a Via Roma. Scarico completato, tutto integro.', time: '14/02 11:30', read: true },
      ],
    })

    const reparti = [
      { id: 'dir', nome: 'Direzione', color: TH.amber, icon: '👑' },
      { id: 'amm', nome: 'Amministrazione', color: TH.blue, icon: '📊' },
      { id: 'comm', nome: 'Commerciale', color: TH.green, icon: '🤝' },
      { id: 'prod', nome: 'Produzione', color: TH.purple, icon: '🔧' },
      { id: 'posa', nome: 'Posa in Opera', color: AC, icon: '🏗️' },
      { id: 'log', nome: 'Logistica', color: TH.red, icon: '🚚' },
      { id: 'serv', nome: 'Servizi Generali', color: TX.textMuted, icon: '🏢' },
    ]

    const team = [
      { id: 'T01', nome: 'Fabio', cognome: 'Cozza', ruolo: 'Titolare / Direttore Generale', reparto: 'dir', avatar: 'FC', telefono: '+39 333 0000001', email: 'fabio@wcs.it',
        stato: 'attivo', competenze: ['Gestione aziendale', 'Preventivazione', 'Configuratore', 'Relazioni clienti'], turno: 'Lun-Ven 8-18', costoH: 0, note: 'Supervisione generale e sviluppo business',
        presenza: 'in_sede', ultimoAccesso: '14/02 09:30' },
      { id: 'T02', nome: 'Walter', cognome: 'Cozza', ruolo: 'Fondatore / Consulente Senior', reparto: 'dir', avatar: 'WC', telefono: '+39 333 0000002', email: 'walter@wcs.it',
        stato: 'attivo', competenze: ['Esperienza 40 anni', 'Consulenza tecnica', 'Relazioni storiche'], turno: 'Lun-Ven 9-13', costoH: 0, note: 'Consulenza e supervisione qualità',
        presenza: 'in_sede', ultimoAccesso: '14/02 09:00' },
      { id: 'T03', nome: 'Maria', cognome: 'Greco', ruolo: 'Amministrazione / Contabilità', reparto: 'amm', avatar: 'MG', telefono: '+39 333 0000003', email: 'maria@wcs.it',
        stato: 'attivo', competenze: ['Fatturazione', 'Contabilità', 'Pratiche fiscali', 'Pagamenti'], turno: 'Lun-Ven 8:30-17:30', costoH: 18, note: 'Gestione completa ciclo amministrativo',
        presenza: 'in_sede', ultimoAccesso: '14/02 08:30' },
      { id: 'T04', nome: 'Marco', cognome: 'Ferraro', ruolo: 'Agente Commerciale Senior', reparto: 'comm', avatar: 'MF', telefono: '+39 333 1234567', email: 'marco.ferraro@wcs.it',
        stato: 'attivo', competenze: ['Vendita', 'Sopralluoghi', 'Preventivi', 'Relazioni clienti'], turno: 'Lun-Ven 8-18 + Sab mattina', costoH: 22, note: 'Zona Cosenza Nord. 28 clienti attivi.',
        presenza: 'fuori_sede', ultimoAccesso: '14/02 09:30' },
      { id: 'T05', nome: 'Giulia', cognome: 'Mancuso', ruolo: 'Agente Commerciale', reparto: 'comm', avatar: 'GM', telefono: '+39 334 7654321', email: 'giulia.mancuso@wcs.it',
        stato: 'attivo', competenze: ['Vendita', 'Sopralluoghi', 'Detrazioni fiscali'], turno: 'Lun-Ven 8-18', costoH: 20, note: 'Zona Cosenza Sud + Crotone. 19 clienti attivi.',
        presenza: 'fuori_sede', ultimoAccesso: '14/02 08:15' },
      { id: 'T06', nome: 'Giuseppe', cognome: 'Russo', ruolo: 'Capo Officina / Saldatore', reparto: 'prod', avatar: 'GR', telefono: '+39 335 1111111', email: '',
        stato: 'attivo', competenze: ['Saldatura TIG/MIG', 'Taglio profili', 'Assemblaggio', 'Controllo qualità'], turno: 'Lun-Ven 7-16', costoH: 25, note: 'Responsabile linea produttiva. 15 anni esperienza.',
        presenza: 'in_sede', ultimoAccesso: '14/02 07:00' },
      { id: 'T07', nome: 'Antonio', cognome: 'Ferraro', ruolo: 'Operaio Specializzato', reparto: 'prod', avatar: 'AF', telefono: '+39 335 2222222', email: '',
        stato: 'attivo', competenze: ['Assemblaggio serramenti', 'Ferramenta', 'Vetrazione', 'Sigillatura'], turno: 'Lun-Ven 7-16', costoH: 18, note: 'Specialista assemblaggio e vetrazione.',
        presenza: 'in_sede', ultimoAccesso: '14/02 07:00' },
      { id: 'T08', nome: 'Luigi', cognome: 'Ferraro', ruolo: 'Capo Cantiere / Posatore', reparto: 'posa', avatar: 'LF', telefono: '+39 336 3333333', email: 'luigi@wcs.it',
        stato: 'attivo', competenze: ['Posa in opera', 'Rilievo misure', 'Controtelaio', 'Sigillatura', 'Sopralluoghi'], turno: 'Lun-Ven 7-16 + straordinari', costoH: 24, note: 'Responsabile cantieri. Molto affidabile.',
        presenza: 'cantiere', ultimoAccesso: '14/02 11:00' },
      { id: 'T09', nome: 'Paolo', cognome: 'Mancini', ruolo: 'Posatore', reparto: 'posa', avatar: 'PM', telefono: '+39 336 4444444', email: '',
        stato: 'attivo', competenze: ['Posa in opera', 'Muratura leggera', 'Controtelaio'], turno: 'Lun-Ven 7-16', costoH: 16, note: 'Squadra con Luigi. 3 anni esperienza.',
        presenza: 'cantiere', ultimoAccesso: '14/02 11:00' },
      { id: 'T10', nome: 'Salvatore', cognome: 'Ferraro', ruolo: 'Autista / Logistica', reparto: 'log', avatar: 'SF', telefono: '+39 337 5555555', email: '',
        stato: 'attivo', competenze: ['Patente C', 'Carico/scarico', 'Consegne', 'Magazzino'], turno: 'Lun-Ven 6:30-15:30', costoH: 15, note: 'Gestione furgone e consegne cantieri.',
        presenza: 'fuori_sede', ultimoAccesso: '14/02 11:30' },
      { id: 'T11', nome: 'Rosa', cognome: 'Ferraro', ruolo: 'Pulizie / Servizi Generali', reparto: 'serv', avatar: 'RF', telefono: '+39 338 6666666', email: '',
        stato: 'attivo', competenze: ['Pulizie uffici', 'Pulizie officina', 'Gestione rifiuti'], turno: 'Lun-Ven 6-8 + 16-17', costoH: 10, note: 'Pulizie giornaliere uffici e officina.',
        presenza: 'in_sede', ultimoAccesso: '14/02 06:00' },
      { id: 'T12', nome: 'Franco', cognome: 'Bruno', ruolo: 'Custode / Portineria', reparto: 'serv', avatar: 'FB', telefono: '+39 338 7777777', email: '',
        stato: 'attivo', competenze: ['Apertura/chiusura', 'Sorveglianza', 'Ricevimento merci', 'Centralino'], turno: 'Lun-Ven 6:30-14:30 + Sab 7-12', costoH: 12, note: 'Apre il cancello, riceve corrieri e fornitori.',
        presenza: 'in_sede', ultimoAccesso: '14/02 06:30' },
    ]

    const presenzaInfo: Record<string, { label: string; color: string; icon: string }> = {
      in_sede: { label: 'In sede', color: TH.green, icon: '🏢' },
      fuori_sede: { label: 'Fuori sede', color: TH.blue, icon: '🚗' },
      cantiere: { label: 'Cantiere', color: AC, icon: '🏗️' },
      ferie: { label: 'Ferie', color: TH.amber, icon: '🏖️' },
      malattia: { label: 'Malattia', color: TH.red, icon: '🤒' },
      offline: { label: 'Offline', color: TX.textMuted, icon: '⚫' },
    }

    const channels = [
      { id: 'general', nome: '# Generale', icon: '📢', desc: 'Comunicazioni per tutti' },
      { id: 'produzione', nome: '# Produzione', icon: '🔧', desc: 'Officina e assemblaggio' },
      { id: 'cantiere', nome: '# Cantiere', icon: '🏗️', desc: 'Squadre posa in opera' },
      { id: 'commerciale', nome: '# Commerciale', icon: '🤝', desc: 'Vendite e clienti' },
      { id: 'admin', nome: '# Amministrazione', icon: '📊', desc: 'Fatture e pagamenti' },
    ]

    const sendTeamChat = () => {
      if (!teamChatMsg.trim() || !teamChatTarget) return
      const newMsg = { id: `tc${Date.now()}`, from: 'Fabio Cozza', msg: teamChatMsg.trim(),
        time: new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }), read: true }
      setTeamChatMessages(prev => ({ ...prev, [teamChatTarget]: [...(prev[teamChatTarget] || []), newMsg] }))
      setTeamChatMsg('')
    }

    const totalUnread = Object.values(teamChatMessages).reduce((s, msgs) => s + msgs.filter(m => !m.read && m.from !== 'Fabio Cozza').length, 0)

    return (
      <div className="space-y-4">
        {/* Sub-tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: BG.input, display: 'inline-flex' }}>
            {[
              { id: 'persone', label: 'Persone', icon: 'users' },
              { id: 'chat', label: 'Chat Team', icon: 'send', badge: totalUnread },
              { id: 'presenze', label: 'Presenze Oggi', icon: 'check' },
            ].map(v => (
              <button key={v.id} onClick={() => setTeamView(v.id)} className="px-4 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5"
                style={{ background: teamView === v.id ? BG.card : 'transparent', color: teamView === v.id ? AC : TX.textMuted, border: 'none', cursor: 'pointer',
                  boxShadow: teamView === v.id ? isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow : 'none' }}>
                <Ic n={v.icon} s={12} c={teamView === v.id ? AC : TX.textMuted}/> {v.label}
                {(v as any).badge > 0 && <span style={{ background: TH.red, color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 8, fontWeight: 700 }}>{(v as any).badge}</span>}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 10, color: TX.textMuted }}>{team.length} persone</span>
            <span style={{ fontSize: 10, color: TH.green, fontWeight: 700 }}>{team.filter(t => t.stato === 'attivo').length} attivi</span>
          </div>
        </div>

        {/* ═══ PERSONE ═══ */}
        {teamView === 'persone' && (
          <div>
            {/* KPI */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Team Totale', value: team.length, sub: `${reparti.length} reparti`, color: TH.blue, icon: '👥' },
                { label: 'In Sede', value: team.filter(t => t.presenza === 'in_sede').length, sub: 'operativi ora', color: TH.green, icon: '🏢' },
                { label: 'Fuori / Cantiere', value: team.filter(t => ['fuori_sede','cantiere'].includes(t.presenza)).length, sub: 'sul territorio', color: AC, icon: '🚗' },
                { label: 'Costo Orario Tot.', value: `€${team.reduce((s,t) => s + t.costoH, 0)}/h`, sub: `~€${Math.round(team.reduce((s,t) => s + t.costoH, 0) * 8)}/giorno`, color: TH.purple, icon: '💰' },
              ].map((s, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                  <div className="flex items-center justify-between mb-1"><span style={{ fontSize: 8, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>{s.label}</span><span style={{ fontSize: 14 }}>{s.icon}</span></div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: TX.textMuted }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* By department */}
            {reparti.map(rep => {
              const members = team.filter(t => t.reparto === rep.id)
              if (members.length === 0) return null
              return (
                <div key={rep.id} className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: 14 }}>{rep.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: rep.color, textTransform: 'uppercase', letterSpacing: 1 }}>{rep.nome}</span>
                    <span style={{ fontSize: 9, color: TX.textMuted }}>({members.length})</span>
                    <div style={{ flex: 1, height: 1, background: rep.color + '20' }} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {members.map(m => {
                      const pr = presenzaInfo[m.presenza] || presenzaInfo.offline
                      const isSelected = selectedMembro === m.id
                      return (
                        <div key={m.id}>
                          <div className="p-3 rounded-xl cursor-pointer" onClick={() => setSelectedMembro(isSelected ? null : m.id)}
                            style={{ background: isSelected ? rep.color + '06' : BG.card, border: `1px solid ${isSelected ? rep.color : TX.border}`,
                              boxShadow: isSelected ? `0 0 8px ${rep.color}15` : isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                            <div className="flex items-center gap-3">
                              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${rep.color}, ${rep.color}80)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', position: 'relative', flexShrink: 0 }}>
                                {m.avatar}
                                <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: pr.color, border: `2px solid ${BG.card}` }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div style={{ fontSize: 12, fontWeight: 700, color: TX.text }}>{m.nome} {m.cognome}</div>
                                <div style={{ fontSize: 9, color: TX.textMuted }}>{m.ruolo}</div>
                              </div>
                              <div className="text-right">
                                <span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: pr.color + '12', color: pr.color, fontWeight: 600 }}>{pr.icon} {pr.label}</span>
                                {m.costoH > 0 && <div style={{ fontSize: 8, color: TX.textMuted, marginTop: 2 }}>€{m.costoH}/h</div>}
                              </div>
                            </div>
                          </div>
                          {/* Expanded detail */}
                          {isSelected && (
                            <div className="mt-1 p-3 rounded-xl" style={{ background: BG.input, border: `1px solid ${TX.border}` }}>
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                <div><span style={{ fontSize: 8, color: TX.textMuted, textTransform: 'uppercase' }}>Telefono</span><div style={{ fontSize: 11, fontWeight: 600, color: TX.text }}>{m.telefono}</div></div>
                                <div><span style={{ fontSize: 8, color: TX.textMuted, textTransform: 'uppercase' }}>Email</span><div style={{ fontSize: 11, fontWeight: 600, color: TX.text }}>{m.email || '—'}</div></div>
                                <div><span style={{ fontSize: 8, color: TX.textMuted, textTransform: 'uppercase' }}>Turno</span><div style={{ fontSize: 11, fontWeight: 600, color: TX.text }}>{m.turno}</div></div>
                              </div>
                              <div className="mb-2"><span style={{ fontSize: 8, color: TX.textMuted, textTransform: 'uppercase' }}>Competenze</span>
                                <div className="flex flex-wrap gap-1 mt-1">{m.competenze.map((c, ci) => (
                                  <span key={ci} style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: rep.color + '10', color: rep.color, fontWeight: 600 }}>{c}</span>
                                ))}</div>
                              </div>
                              <div style={{ fontSize: 9, color: TX.textSec, fontStyle: 'italic' }}>{m.note}</div>
                              <div className="flex gap-2 mt-3">
                                <button onClick={(e) => { e.stopPropagation(); setTeamView('chat'); setTeamChatTarget(`dm_${m.id}`) }}
                                  style={{ padding: '5px 12px', background: AC, border: 'none', borderRadius: 6, fontSize: 9, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>💬 Messaggio</button>
                                <button style={{ padding: '5px 12px', background: TH.green + '10', border: `1px solid ${TH.green}30`, borderRadius: 6, fontSize: 9, fontWeight: 600, color: TH.green, cursor: 'pointer' }}>📞 Chiama</button>
                                <button style={{ padding: '5px 12px', background: BG.card, border: `1px solid ${TX.border}`, borderRadius: 6, fontSize: 9, fontWeight: 600, color: TX.text, cursor: 'pointer' }}>📋 Assegna Attività</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ═══ CHAT TEAM ═══ */}
        {teamView === 'chat' && (
          <div className="flex gap-4" style={{ height: 'calc(100vh - 220px)' }}>
            {/* Channel list */}
            <div className="w-56 flex-shrink-0 rounded-xl overflow-hidden" style={{ background: BG.card, border: `1px solid ${TX.border}` }}>
              <div className="p-3" style={{ borderBottom: `1px solid ${TX.border}`, background: BG.input }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: TX.text, textTransform: 'uppercase', letterSpacing: 1 }}>Canali</span>
              </div>
              <div className="p-1">
                {channels.map(ch => {
                  const msgs = teamChatMessages[ch.id] || []
                  const unread = msgs.filter(m => !m.read && m.from !== 'Fabio Cozza').length
                  return (
                    <div key={ch.id} className="px-3 py-2 rounded-lg cursor-pointer mb-0.5"
                      onClick={() => setTeamChatTarget(ch.id)}
                      style={{ background: teamChatTarget === ch.id ? AC + '10' : 'transparent', border: teamChatTarget === ch.id ? `1px solid ${AC}20` : '1px solid transparent' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 12 }}>{ch.icon}</span>
                          <span style={{ fontSize: 11, fontWeight: teamChatTarget === ch.id ? 700 : 500, color: teamChatTarget === ch.id ? AC : TX.text }}>{ch.nome}</span>
                        </div>
                        {unread > 0 && <span style={{ background: TH.red, color: '#fff', borderRadius: 10, padding: '0 5px', fontSize: 8, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{unread}</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-3" style={{ borderTop: `1px solid ${TX.border}`, borderBottom: `1px solid ${TX.border}`, background: BG.input }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: TX.text, textTransform: 'uppercase', letterSpacing: 1 }}>Messaggi Diretti</span>
              </div>
              <div className="p-1" style={{ overflowY: 'auto', maxHeight: 300 }}>
                {team.filter(t => t.id !== 'T01').map(m => {
                  const pr = presenzaInfo[m.presenza]
                  return (
                    <div key={m.id} className="px-3 py-1.5 rounded-lg cursor-pointer mb-0.5 flex items-center gap-2"
                      onClick={() => setTeamChatTarget(`dm_${m.id}`)}
                      style={{ background: teamChatTarget === `dm_${m.id}` ? AC + '10' : 'transparent' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: pr.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: teamChatTarget === `dm_${m.id}` ? 700 : 400, color: TX.text }}>{m.nome} {m.cognome.charAt(0)}.</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 rounded-xl overflow-hidden flex flex-col" style={{ background: BG.card, border: `1px solid ${TX.border}` }}>
              {!teamChatTarget ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center"><span style={{ fontSize: 40 }}>💬</span><p style={{ fontSize: 12, color: TX.textMuted, marginTop: 8 }}>Seleziona un canale o una persona</p></div>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="p-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${TX.border}`, background: BG.input }}>
                    <div className="flex items-center gap-2">
                      {teamChatTarget.startsWith('dm_') ? (() => {
                        const m = team.find(t => t.id === teamChatTarget.replace('dm_', ''))
                        return m ? <><div style={{ width: 24, height: 24, borderRadius: '50%', background: AC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{m.avatar}</div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: TX.text }}>{m.nome} {m.cognome}</span>
                          <span style={{ fontSize: 9, color: TX.textMuted }}>{m.ruolo}</span></> : null
                      })() : (() => {
                        const ch = channels.find(c => c.id === teamChatTarget)
                        return ch ? <><span style={{ fontSize: 16 }}>{ch.icon}</span><span style={{ fontSize: 12, fontWeight: 700, color: TX.text }}>{ch.nome}</span>
                          <span style={{ fontSize: 9, color: TX.textMuted }}>{ch.desc}</span></> : null
                      })()}
                    </div>
                  </div>
                  {/* Messages */}
                  <div className="flex-1 p-4 space-y-3" style={{ overflowY: 'auto' }}>
                    {(teamChatMessages[teamChatTarget] || []).map(m => {
                      const isMe = m.from === 'Fabio Cozza'
                      const member = team.find(t => `${t.nome} ${t.cognome}` === m.from)
                      const rep = member ? reparti.find(r => r.id === member.reparto) : null
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                          {!isMe && <div style={{ width: 28, height: 28, borderRadius: '50%', background: rep?.color || AC, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{member?.avatar || '?'}</div>}
                          <div style={{ maxWidth: '70%', padding: '8px 12px', borderRadius: 12,
                            background: isMe ? AC + '12' : BG.input, border: `1px solid ${isMe ? AC + '20' : TX.border}`,
                            borderBottomRightRadius: isMe ? 4 : 12, borderBottomLeftRadius: isMe ? 12 : 4 }}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span style={{ fontSize: 9, fontWeight: 700, color: isMe ? AC : rep?.color || TH.blue }}>{m.from}</span>
                              <span style={{ fontSize: 7, color: TX.textMuted }}>{m.time}</span>
                              {!m.read && !isMe && <span style={{ width: 5, height: 5, borderRadius: '50%', background: TH.red }} />}
                            </div>
                            <div style={{ fontSize: 11, color: TX.text, lineHeight: 1.5 }}>{m.msg}</div>
                          </div>
                        </div>
                      )
                    })}
                    {(teamChatMessages[teamChatTarget] || []).length === 0 && (
                      <div className="text-center py-12"><span style={{ fontSize: 32 }}>🤫</span><p style={{ fontSize: 11, color: TX.textMuted, marginTop: 4 }}>Nessun messaggio. Inizia la conversazione!</p></div>
                    )}
                  </div>
                  {/* Input */}
                  <div className="p-3 flex gap-2" style={{ borderTop: `1px solid ${TX.border}`, background: BG.input }}>
                    <input value={teamChatMsg} onChange={e => setTeamChatMsg(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') sendTeamChat() }}
                      placeholder="Scrivi un messaggio..." style={{ flex: 1, padding: '8px 14px', background: BG.card, border: `1px solid ${TX.border}`, borderRadius: 10, fontSize: 12, color: TX.text, outline: 'none' }} />
                    <button onClick={sendTeamChat} style={{ padding: '8px 18px', background: AC, border: 'none', borderRadius: 10, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                      Invia
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══ PRESENZE OGGI ═══ */}
        {teamView === 'presenze' && (
          <div>
            <div className="grid grid-cols-6 gap-2 mb-4">
              {Object.entries(presenzaInfo).map(([key, p]) => {
                const count = team.filter(t => t.presenza === key).length
                return (
                  <div key={key} className="p-2 rounded-lg text-center" style={{ background: count > 0 ? p.color + '08' : BG.input, border: `1px solid ${count > 0 ? p.color + '15' : TX.border}` }}>
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <div style={{ fontSize: 16, fontWeight: 900, color: count > 0 ? p.color : TX.textMuted }}>{count}</div>
                    <div style={{ fontSize: 8, color: TX.textMuted, fontWeight: 600 }}>{p.label}</div>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {team.map(m => {
                const pr = presenzaInfo[m.presenza]
                const rep = reparti.find(r => r.id === m.reparto)
                return (
                  <div key={m.id} className="p-3 rounded-xl text-center" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${rep?.color || AC}, ${rep?.color || AC}80)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 auto', position: 'relative' }}>
                      {m.avatar}
                      <div style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', background: pr.color, border: `2px solid ${BG.card}` }} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: TX.text, marginTop: 6 }}>{m.nome} {m.cognome.charAt(0)}.</div>
                    <div style={{ fontSize: 8, color: TX.textMuted }}>{m.ruolo}</div>
                    <div className="mt-2"><span style={{ fontSize: 8, padding: '2px 6px', borderRadius: 4, background: pr.color + '12', color: pr.color, fontWeight: 600 }}>{pr.icon} {pr.label}</span></div>
                    <div style={{ fontSize: 7, color: TX.textMuted, marginTop: 4 }}>{m.turno}</div>
                    <div style={{ fontSize: 7, color: TX.textMuted }}>Ultimo: {m.ultimoAccesso}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ==================== RETE COMMERCIALE ====================
  const ReteCommercialeContent = () => {
    const [reteView, setReteView] = useState('agenti')
    const [selectedAgente, setSelectedAgente] = useState<string|null>(null)

    const agenti = [
      { id: 'AG-001', nome: 'Marco', cognome: 'Ferraro', zona: 'Cosenza Nord', telefono: '+39 333 1234567', email: 'marco.ferraro@wcs.it', avatar: 'MF',
        stato: 'attivo', ultimoAccesso: '2025-02-14 09:30', appVersion: '2.1.3',
        stats: { clientiAttivi: 28, clientiTotali: 45, preventiviMese: 12, preventiviVinti: 8, fatturato: 148000, fatturatoTarget: 200000, visiteMese: 18, conversionRate: 67 },
        clientiRecenti: [
          { nome: 'Mario Rossi', tipo: 'acquisito', valore: 8500, data: '2025-02-10', commessa: 'WC-0254', note: 'Vuole RAL 7016, 8 finestre + 2 portefinestre' },
          { nome: 'Ennio Palazzo', tipo: 'prospect', valore: 0, data: '2025-02-13', commessa: '', note: 'Interessato a sostituzione completa villa. Appuntamento giovedì.' },
          { nome: 'Laura Mancini', tipo: 'acquisito', valore: 12000, data: '2025-02-08', commessa: 'WC-0256', note: 'Uffici C.so Mazzini. Pagamento in 3 rate.' },
        ],
        diario: [
          { data: '2025-02-14 09:30', tipo: 'visita', testo: 'Sopralluogo Via Roma. Cliente conferma ordine. Chiusura prevista oggi.' },
          { data: '2025-02-13 14:00', tipo: 'chiamata', testo: 'Call con Palazzo per villa Rende. Molto interessato, vuole preventivo entro lunedì.' },
          { data: '2025-02-12 11:00', tipo: 'nota', testo: 'Competitor ha offerto -15% su Mancini. Abbiamo vinto comunque per qualità servizio.' },
          { data: '2025-02-11 16:30', tipo: 'preventivo', testo: 'Inviato preventivo WC-0264 a Bianchi. Attendo conferma.' },
        ]},
      { id: 'AG-002', nome: 'Giulia', cognome: 'Mancuso', zona: 'Cosenza Sud + Crotone', telefono: '+39 334 7654321', email: 'giulia.mancuso@wcs.it', avatar: 'GM',
        stato: 'attivo', ultimoAccesso: '2025-02-14 08:15', appVersion: '2.1.3',
        stats: { clientiAttivi: 19, clientiTotali: 32, preventiviMese: 8, preventiviVinti: 5, fatturato: 95000, fatturatoTarget: 150000, visiteMese: 14, conversionRate: 63 },
        clientiRecenti: [
          { nome: 'Condominio Aurora', tipo: 'acquisito', valore: 24000, data: '2025-02-05', commessa: 'WC-0258', note: 'Bonus 110%, 20 unità abitative. Pratica ENEA in corso.' },
          { nome: 'Giuseppe Ferraro', tipo: 'prospect', valore: 0, data: '2025-02-12', commessa: '', note: 'Ristrutturazione appartamento centro Crotone. Primo contatto.' },
        ],
        diario: [
          { data: '2025-02-14 08:15', tipo: 'nota', testo: 'Preparazione offerta condominio Crotone. 15 appartamenti, coordinamento amministratore.' },
          { data: '2025-02-13 10:00', tipo: 'visita', testo: 'Sopralluogo Crotone centro con Ferraro. Misure preliminari prese.' },
        ]},
      { id: 'AG-003', nome: 'Antonio', cognome: 'Greco', zona: 'Catanzaro + Lamezia', telefono: '+39 335 9876543', email: 'antonio.greco@wcs.it', avatar: 'AG',
        stato: 'offline', ultimoAccesso: '2025-02-13 17:30', appVersion: '2.1.2',
        stats: { clientiAttivi: 12, clientiTotali: 25, preventiviMese: 5, preventiviVinti: 2, fatturato: 42000, fatturatoTarget: 120000, visiteMese: 8, conversionRate: 40 },
        clientiRecenti: [
          { nome: 'Studio Legale Ferraro', tipo: 'perso', valore: 6000, data: '2025-02-01', commessa: '', note: 'Perso per prezzo. Competitor ha offerto -20%. Rivediamo pricing zona CZ.' },
        ],
        diario: [
          { data: '2025-02-13 17:30', tipo: 'nota', testo: 'Zona Catanzaro difficile, forte concorrenza. Serve promozione specifica o margini più aggressivi.' },
        ]},
    ]
    const totFatturato = agenti.reduce((s, a) => s + a.stats.fatturato, 0)
    const totTarget = agenti.reduce((s, a) => s + a.stats.fatturatoTarget, 0)
    const totClienti = agenti.reduce((s, a) => s + a.stats.clientiAttivi, 0)
    const totPreventivi = agenti.reduce((s, a) => s + a.stats.preventiviMese, 0)
    const avgConversion = Math.round(agenti.reduce((s, a) => s + a.stats.conversionRate, 0) / agenti.length)
    const diarioIcons: Record<string, string> = { visita: '🏠', chiamata: '📞', nota: '📝', preventivo: '📄' }

    return (
      <div className="space-y-4">
        {/* KPI Row */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Fatturato Rete', value: fmtDec(totFatturato), sub: `Target: ${fmtDec(totTarget)}`, perc: Math.round((totFatturato/totTarget)*100), color: TH.green, icon: '💰' },
            { label: 'Agenti Attivi', value: `${agenti.filter(a => a.stato === 'attivo').length}/${agenti.length}`, sub: `${agenti.filter(a => a.stato === 'offline').length} offline`, perc: Math.round((agenti.filter(a => a.stato === 'attivo').length/agenti.length)*100), color: TH.blue, icon: '👥' },
            { label: 'Clienti Attivi', value: totClienti.toString(), sub: `${agenti.reduce((s,a) => s + a.stats.clientiTotali, 0)} totali`, perc: Math.round((totClienti/agenti.reduce((s,a)=>s+a.stats.clientiTotali,0))*100), color: AC, icon: '🎯' },
            { label: 'Preventivi/Mese', value: totPreventivi.toString(), sub: `${agenti.reduce((s,a)=>s+a.stats.preventiviVinti,0)} vinti`, perc: Math.round((agenti.reduce((s,a)=>s+a.stats.preventiviVinti,0)/Math.max(totPreventivi,1))*100), color: TH.purple, icon: '📋' },
            { label: 'Conversione Media', value: `${avgConversion}%`, sub: 'prospect → cliente', perc: avgConversion, color: avgConversion > 60 ? TH.green : avgConversion > 40 ? TH.amber : TH.red, icon: '⚡' },
          ].map((s, i) => (
            <div key={i} className="p-3 rounded-xl" style={{ background: BG.card, border: `1px solid ${TX.border}`, boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 8, color: TX.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600 }}>{s.label}</span>
                <span style={{ fontSize: 14 }}>{s.icon}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'monospace', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 9, color: TX.textMuted }}>{s.sub}</div>
              <div className="mt-2 h-1.5 rounded-full" style={{ background: TX.bgHover }}>
                <div className="h-1.5 rounded-full" style={{ width: `${Math.min(s.perc, 100)}%`, background: s.color, transition: 'width 1s', boxShadow: `0 0 4px ${s.color}40` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-3 gap-4">
          {agenti.map(ag => {
            const fatPerc = Math.round((ag.stats.fatturato / ag.stats.fatturatoTarget) * 100)
            const isSelected = selectedAgente === ag.id
            return (
              <div key={ag.id} className="rounded-xl overflow-hidden cursor-pointer" onClick={() => setSelectedAgente(isSelected ? null : ag.id)}
                style={{ background: BG.card, border: `1px solid ${isSelected ? AC : TX.border}`, boxShadow: isSelected ? `0 0 12px ${AC}20` : isDark ? '0 1px 4px rgba(0,0,0,0.3)' : TH.shadow }}>
                {/* Agent header */}
                <div className="p-3 flex items-center gap-3" style={{ background: isSelected ? AC + '06' : BG.card }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${ag.stato === 'attivo' ? TH.green : TX.textMuted}, ${ag.stato === 'attivo' ? TH.blue : TX.bgHover})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', position: 'relative' }}>
                    {ag.avatar}
                    <div style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', background: ag.stato === 'attivo' ? TH.green : TX.textMuted, border: `2px solid ${BG.card}` }} />
                  </div>
                  <div className="flex-1">
                    <div style={{ fontSize: 13, fontWeight: 700, color: TX.text }}>{ag.nome} {ag.cognome}</div>
                    <div style={{ fontSize: 9, color: TX.textMuted }}>{ag.zona}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontSize: 14, fontWeight: 900, fontFamily: 'monospace', color: fatPerc >= 80 ? TH.green : fatPerc >= 50 ? TH.amber : TH.red }}>{fatPerc}%</div>
                    <div style={{ fontSize: 7, color: TX.textMuted }}>del target</div>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-0" style={{ borderTop: `1px solid ${TX.border}`, borderBottom: `1px solid ${TX.border}` }}>
                  {[
                    { label: 'Clienti', value: ag.stats.clientiAttivi, color: TH.blue },
                    { label: 'Prev.', value: ag.stats.preventiviMese, color: AC },
                    { label: 'Vinti', value: ag.stats.preventiviVinti, color: TH.green },
                    { label: 'Conv.', value: `${ag.stats.conversionRate}%`, color: ag.stats.conversionRate > 60 ? TH.green : TH.amber },
                  ].map((st, si) => (
                    <div key={si} className="text-center py-2" style={{ borderRight: si < 3 ? `1px solid ${TX.border}` : 'none' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: st.color }}>{st.value}</div>
                      <div style={{ fontSize: 7, color: TX.textMuted, textTransform: 'uppercase' }}>{st.label}</div>
                    </div>
                  ))}
                </div>

                {/* Fatturato bar */}
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 9, fontWeight: 700, color: TX.text }}>{fmtDec(ag.stats.fatturato)}</span>
                    <span style={{ fontSize: 8, color: TX.textMuted }}>/ {fmtDec(ag.stats.fatturatoTarget)}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: TX.bgHover }}>
                    <div className="h-2 rounded-full" style={{ width: `${Math.min(fatPerc, 100)}%`,
                      background: `linear-gradient(90deg, ${fatPerc >= 80 ? TH.green : fatPerc >= 50 ? TH.amber : TH.red}, ${fatPerc >= 80 ? TH.green : fatPerc >= 50 ? TH.amber : TH.red}80)`,
                      boxShadow: `0 0 6px ${fatPerc >= 80 ? TH.green : fatPerc >= 50 ? TH.amber : TH.red}30` }} />
                  </div>
                  <div style={{ fontSize: 7, color: TX.textMuted, marginTop: 2 }}>Ultimo accesso: {ag.ultimoAccesso} · App v{ag.appVersion}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ═══ AGENT DETAIL PANEL ═══ */}
        {selectedAgente && (() => {
          const ag = agenti.find(a => a.id === selectedAgente)
          if (!ag) return null
          return (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${TH.green}, ${TH.blue})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>{ag.avatar}</div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: TX.text }}>{ag.nome} {ag.cognome}</h3>
                    <div style={{ fontSize: 10, color: TX.textMuted }}>{ag.zona} · {ag.telefono} · {ag.email}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button style={{ padding: '6px 14px', background: TH.green + '10', border: `1px solid ${TH.green}30`, borderRadius: 8, fontSize: 10, fontWeight: 700, color: TH.green, cursor: 'pointer' }}>📞 Chiama</button>
                  <button style={{ padding: '6px 14px', background: AC + '10', border: `1px solid ${AC}30`, borderRadius: 8, fontSize: 10, fontWeight: 700, color: AC, cursor: 'pointer' }}>✉️ Messaggio</button>
                  <button onClick={() => setSelectedAgente(null)} style={{ padding: '4px 8px', background: BG.input, border: `1px solid ${TX.border}`, borderRadius: 6, cursor: 'pointer' }}><Ic n="x" s={12} c={TX.textMuted}/></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Clienti Recenti */}
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: TX.text, marginBottom: 8 }}>👥 Clienti Recenti</h4>
                  <div className="space-y-2">
                    {ag.clientiRecenti.map((cl, ci) => {
                      const tipoC: Record<string, { color: string; label: string }> = { acquisito: { color: TH.green, label: '✅ Acquisito' }, prospect: { color: AC, label: '🎯 Prospect' }, perso: { color: TH.red, label: '❌ Perso' } }
                      const tc = tipoC[cl.tipo] || tipoC.prospect
                      return (
                        <div key={ci} className="p-3 rounded-lg" style={{ background: BG.input, border: `1px solid ${TX.border}` }}>
                          <div className="flex items-center justify-between mb-1">
                            <span style={{ fontSize: 11, fontWeight: 700, color: TX.text }}>{cl.nome}</span>
                            <div className="flex items-center gap-2">
                              <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: tc.color + '12', color: tc.color, fontWeight: 600 }}>{tc.label}</span>
                              {cl.valore > 0 && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'monospace', color: TH.green }}>{fmtDec(cl.valore)}</span>}
                            </div>
                          </div>
                          <div style={{ fontSize: 9, color: TX.textSec, lineHeight: 1.4 }}>{cl.note}</div>
                          <div className="flex items-center gap-3 mt-1" style={{ fontSize: 8, color: TX.textMuted }}>
                            <span>{cl.data}</span>
                            {cl.commessa && <span style={{ fontFamily: 'monospace', color: AC }}>→ {cl.commessa}</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Diario Agente */}
                <div>
                  <h4 style={{ fontSize: 11, fontWeight: 700, color: TX.text, marginBottom: 8 }}>📔 Diario Attività</h4>
                  <div style={{ borderLeft: `2px solid ${TX.border}`, marginLeft: 6, paddingLeft: 14 }}>
                    {ag.diario.map((d, di) => (
                      <div key={di} className="mb-3 relative">
                        <div style={{ position: 'absolute', left: -20, top: 2, width: 10, height: 10, borderRadius: '50%', background: AC, border: `2px solid ${BG.card}` }} />
                        <div className="flex items-center gap-2 mb-0.5">
                          <span style={{ fontSize: 12 }}>{diarioIcons[d.tipo] || '📝'}</span>
                          <span style={{ fontSize: 8, fontFamily: 'monospace', color: TX.textMuted }}>{d.data}</span>
                          <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, background: AC + '08', color: AC, fontWeight: 600, textTransform: 'uppercase' }}>{d.tipo}</span>
                        </div>
                        <div style={{ fontSize: 10, color: TX.text, lineHeight: 1.4 }}>{d.testo}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notiziario / News */}
              <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${TX.border}` }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: TX.text, marginBottom: 8 }}>📢 Comunicazioni dalla Sede</h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { tipo: 'promo', testo: 'Nuova promozione Schüco AWS 75 — sconto 12% fino al 28/02. Spingere su zona Cosenza.', data: '14/02', color: TH.green },
                    { tipo: 'prodotto', testo: 'Disponibile nuovo profilo Aluplast IDEAL 8000. Trasmittanza Uw 0.86. Ottimo per detrazioni.', data: '12/02', color: TH.blue },
                    { tipo: 'alert', testo: 'Competitor AluK ha abbassato prezzi del 10% su Catanzaro. Preparare controfferta.', data: '11/02', color: TH.red },
                  ].map((n, ni) => (
                    <div key={ni} className="p-3 rounded-lg" style={{ background: n.color + '04', border: `1px solid ${n.color}15` }}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, background: n.color + '12', color: n.color, fontWeight: 700, textTransform: 'uppercase' }}>{n.tipo}</span>
                        <span style={{ fontSize: 7, color: TX.textMuted }}>{n.data}</span>
                      </div>
                      <div style={{ fontSize: 9, color: TX.text, lineHeight: 1.4 }}>{n.testo}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )
        })()}
      </div>
    )
  }

  // ==================== WORKFLOW BUILDER ====================
  const WorkflowContent = () => {
    const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null)
    const [selectedNode, setSelectedNode] = useState<string | null>(null)
    const [showNewWorkflowDialog, setShowNewWorkflowDialog] = useState(false)
    const [newWorkflowName, setNewWorkflowName] = useState('')
    const [newWorkflowDesc, setNewWorkflowDesc] = useState('')
    const [newWorkflowTipo, setNewWorkflowTipo] = useState('commessa')
    
    // CANVAS INTERATTIVO - States
    const [canvasNodes, setCanvasNodes] = useState<any[]>([])
    const [canvasConnections, setCanvasConnections] = useState<any[]>([])
    const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null)
    const [draggingNode, setDraggingNode] = useState<string | null>(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null)
    const [tempConnectionEnd, setTempConnectionEnd] = useState<{ x: number, y: number } | null>(null)
    const canvasRef = React.useRef<HTMLDivElement>(null)
    
    // Tipi di nodi disponibili
    const nodeTypes = [
      { id: 'start', label: 'Inizio', icon: 'play', color: TH.green, description: 'Punto di partenza del workflow' },
      { id: 'fase', label: 'Fase Lavoro', icon: 'box', color: TH.blue, description: 'Fase operativa (es. Sopralluogo, Montaggio)' },
      { id: 'decision', label: 'Decisione', icon: 'gitBranch', color: TH.amber, description: 'Punto di scelta (es. Cliente conferma?)' },
      { id: 'action', label: 'Azione', icon: 'zap', color: TH.purple, description: 'Azione automatica (email, notifica)' },
      { id: 'delay', label: 'Attesa', icon: 'clock', color: TX.textMuted, description: 'Pausa temporizzata' },
      { id: 'end', label: 'Fine', icon: 'checkCircle', color: TH.green, description: 'Completamento workflow' },
    ]

    // Workflows esempio
    const exampleWorkflows = [
      { id: 'wf1', nome: 'Infissi Residenziali', tipo: 'commessa', fasi: 7, attivo: true, descrizione: 'Workflow standard per commesse residenziali' },
      { id: 'wf2', nome: 'Infissi Commerciali', tipo: 'commessa', fasi: 9, attivo: true, descrizione: 'Workflow per progetti commerciali e uffici' },
      { id: 'wf3', nome: 'Solo Misura + Preventivo', tipo: 'servizio', fasi: 3, attivo: false, descrizione: 'Workflow rapido solo preventivo' },
    ]
    
    // FUNZIONI CANVAS
    const addNodeToCanvas = (nodeType: any, x: number, y: number) => {
      const newNode = {
        id: `node_${Date.now()}`,
        type: nodeType.id,
        label: nodeType.label,
        icon: nodeType.icon,
        color: nodeType.color,
        x,
        y,
        data: {
          nome: '',
          durata_giorni: 1,
          responsabile: '',
          note: ''
        }
      }
      setCanvasNodes(prev => [...prev, newNode])
      setSelectedNode(newNode.id)
    }
    
    const deleteNode = (nodeId: string) => {
      setCanvasNodes(prev => prev.filter(n => n.id !== nodeId))
      setCanvasConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId))
      if (selectedNode === nodeId) setSelectedNode(null)
    }
    
    const addConnection = (fromId: string, toId: string) => {
      // Evita duplicati
      const exists = canvasConnections.some(c => c.from === fromId && c.to === toId)
      if (!exists && fromId !== toId) {
        setCanvasConnections(prev => [...prev, { id: `conn_${Date.now()}`, from: fromId, to: toId }])
      }
    }
    
    const updateNodeData = (nodeId: string, field: string, value: any) => {
      setCanvasNodes(prev => prev.map(n => 
        n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n
      ))
    }

    return (
      <>
        {/* DIALOG NUOVO WORKFLOW */}
        {showNewWorkflowDialog && (
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowNewWorkflowDialog(false)}>
            <div 
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl p-6" 
              style={{ background: BG.card, width: 500, border: `1px solid ${TX.border}`, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <h3 className="font-bold text-lg mb-4" style={{ color: TX.text }}>Crea Nuovo Workflow</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>Nome Workflow</label>
                  <input 
                    type="text"
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                    placeholder="es. Infissi Residenziali Premium"
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>Tipo</label>
                  <select 
                    value={newWorkflowTipo}
                    onChange={(e) => setNewWorkflowTipo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}>
                    <option value="commessa">Commessa</option>
                    <option value="servizio">Servizio</option>
                    <option value="manutenzione">Manutenzione</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>Descrizione</label>
                  <textarea 
                    value={newWorkflowDesc}
                    onChange={(e) => setNewWorkflowDesc(e.target.value)}
                    placeholder="Breve descrizione del workflow..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button 
                  onClick={() => {
                    setShowNewWorkflowDialog(false)
                    setNewWorkflowName('')
                    setNewWorkflowDesc('')
                  }}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ background: BG.input, color: TX.text, border: `1px solid ${TX.border}` }}>
                  Annulla
                </button>
                <button 
                  onClick={() => {
                    if (!newWorkflowName.trim()) return
                    // TODO: Salvare workflow su Supabase
                    console.log('Nuovo workflow:', { nome: newWorkflowName, tipo: newWorkflowTipo, descrizione: newWorkflowDesc })
                    setShowNewWorkflowDialog(false)
                    setNewWorkflowName('')
                    setNewWorkflowDesc('')
                    alert('✅ Workflow creato! (Salvataggio DB in arrivo)')
                  }}
                  disabled={!newWorkflowName.trim()}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ 
                    background: newWorkflowName.trim() ? TH.blue : TX.border, 
                    color: '#fff',
                    opacity: newWorkflowName.trim() ? 1 : 0.5
                  }}>
                  Crea Workflow
                </button>
              </div>
            </div>
          </div>
        )}

      <div className="flex h-full">
        {/* SIDEBAR - Lista Workflows */}
        <div className="w-64 flex flex-col" style={{ background: BG.card, borderRight: `1px solid ${TX.border}` }}>
          <div className="p-4 border-b" style={{ borderColor: TX.border }}>
            <h3 className="font-bold text-sm mb-2" style={{ color: TX.text }}>I Tuoi Workflow</h3>
            <button 
              onClick={() => setShowNewWorkflowDialog(true)}
              className="w-full px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: TH.blue, color: '#fff' }}>
              <Ic n="plus" s={14}/> Nuovo Workflow
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {exampleWorkflows.map(wf => (
              <div
                key={wf.id}
                onClick={() => setSelectedWorkflow(wf.id)}
                className="p-3 rounded-lg mb-2 cursor-pointer transition-all"
                style={{ 
                  background: selectedWorkflow === wf.id ? TH.blue + '15' : 'transparent',
                  border: `1px solid ${selectedWorkflow === wf.id ? TH.blue + '40' : TX.border}`
                }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm" style={{ color: TX.text }}>{wf.nome}</span>
                  {wf.attivo && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: TH.green + '20', color: TH.green }}>
                      ATTIVO
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: TX.textMuted }}>{wf.descrizione}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span style={{ fontSize: 10, color: TX.textMuted }}>
                    <Ic n="box" s={10}/> {wf.fasi} fasi
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CANVAS - Area di disegno workflow */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: TX.border, background: BG.card }}>
            <div>
              <h2 className="font-bold text-lg" style={{ color: TX.text }}>
                {selectedWorkflow ? 'Infissi Residenziali' : 'Seleziona un workflow'}
              </h2>
              <p style={{ fontSize: 11, color: TX.textMuted }}>
                {selectedWorkflow ? 'Trascina i nodi per creare il tuo processo personalizzato' : 'Scegli un workflow dalla lista o creane uno nuovo'}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: BG.input, color: TX.text, border: `1px solid ${TX.border}` }}>
                <Ic n="save" s={12}/> Salva
              </button>
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: TH.green, color: '#fff' }}>
                <Ic n="play" s={12}/> Attiva
              </button>
            </div>
          </div>

          {selectedWorkflow ? (
            <div className="flex-1 p-4" style={{ background: BG.page }}>
              {/* TOOLBAR - Nodi disponibili */}
              <div className="mb-4 p-3 rounded-lg" style={{ background: BG.card, border: `1px solid ${TX.border}` }}>
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontSize: 10, color: TX.textMuted, fontWeight: 700, textTransform: 'uppercase' as const }}>
                    Nodi Disponibili - Trascina sul Canvas
                  </div>
                  <div style={{ fontSize: 10, color: TH.blue }}>
                    {canvasNodes.length} nodi · {canvasConnections.length} collegamenti
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {nodeTypes.map(node => (
                    <div
                      key={node.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedNodeType(node.id)
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                      onDragEnd={() => setDraggedNodeType(null)}
                      className="px-3 py-2 rounded-lg cursor-move hover:shadow-lg transition-all flex items-center gap-2"
                      style={{ 
                        background: node.color + '15', 
                        border: `2px solid ${draggedNodeType === node.id ? node.color : node.color + '30'}`,
                        minWidth: 120,
                        transform: draggedNodeType === node.id ? 'scale(0.95)' : 'scale(1)'
                      }}>
                      <Ic n={node.icon} s={14} c={node.color}/>
                      <span style={{ fontSize: 11, fontWeight: 700, color: node.color }}>{node.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CANVAS INTERATTIVO */}
              <div 
                ref={canvasRef}
                className="rounded-lg relative"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (!draggedNodeType || !canvasRef.current) return
                  
                  const rect = canvasRef.current.getBoundingClientRect()
                  const x = e.clientX - rect.left - 75
                  const y = e.clientY - rect.top - 20
                  
                  const nodeType = nodeTypes.find(n => n.id === draggedNodeType)
                  if (nodeType) addNodeToCanvas(nodeType, x, y)
                  setDraggedNodeType(null)
                }}
                onMouseMove={(e) => {
                  if (!draggingNode || !canvasRef.current) return
                  const rect = canvasRef.current.getBoundingClientRect()
                  const x = e.clientX - rect.left - dragOffset.x
                  const y = e.clientY - rect.top - dragOffset.y
                  setCanvasNodes(prev => prev.map(n => 
                    n.id === draggingNode ? { ...n, x, y } : n
                  ))
                }}
                onMouseMove={(e) => {
                  if (connectingFrom && canvasRef.current) {
                    const rect = canvasRef.current.getBoundingClientRect()
                    setTempConnectionEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                  } else if (draggingNode && canvasRef.current) {
                    const rect = canvasRef.current.getBoundingClientRect()
                    const x = e.clientX - rect.left - dragOffset.x
                    const y = e.clientY - rect.top - dragOffset.y
                    setCanvasNodes(prev => prev.map(n => 
                      n.id === draggingNode ? { ...n, x, y } : n
                    ))
                  }
                }}
                onMouseUp={() => {
                  setDraggingNode(null)
                  if (connectingFrom) {
                    setConnectingFrom(null)
                    setTempConnectionEnd(null)
                  }
                }}
                style={{ 
                  background: `repeating-linear-gradient(0deg, ${TX.border}20, ${TX.border}20 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, ${TX.border}20, ${TX.border}20 1px, transparent 1px, transparent 20px)`,
                  backgroundColor: BG.card,
                  border: `2px solid ${TX.border}`,
                  minHeight: 600,
                  cursor: draggingNode ? 'grabbing' : connectingFrom ? 'crosshair' : 'default'
                }}>
                
                {/* SVG per le connessioni */}
                <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', width: '100%', height: '100%' }}>
                  {canvasConnections.map(conn => {
                    const fromNode = canvasNodes.find(n => n.id === conn.from)
                    const toNode = canvasNodes.find(n => n.id === conn.to)
                    if (!fromNode || !toNode) return null
                    
                    const x1 = fromNode.x + 75
                    const y1 = fromNode.y + 20
                    const x2 = toNode.x + 75
                    const y2 = toNode.y + 20
                    
                    return (
                      <g key={conn.id}>
                        <line 
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke={TH.blue}
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                      </g>
                    )
                  })}
                  
                  {/* Connessione temporanea durante il drag */}
                  {connectingFrom && tempConnectionEnd && (() => {
                    const fromNode = canvasNodes.find(n => n.id === connectingFrom)
                    if (!fromNode) return null
                    return (
                      <line 
                        x1={fromNode.x + 75} 
                        y1={fromNode.y + 20}
                        x2={tempConnectionEnd.x}
                        y2={tempConnectionEnd.y}
                        stroke={TH.amber}
                        strokeWidth="2"
                        strokeDasharray="5,5"
                      />
                    )
                  })()}
                  
                  {/* Marker per le frecce */}
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                      <polygon points="0 0, 10 3, 0 6" fill={TH.blue} />
                    </marker>
                  </defs>
                </svg>
                
                {/* Nodi nel canvas */}
                {canvasNodes.map(node => (
                  <div
                    key={node.id}
                    onMouseDown={(e) => {
                      if (e.shiftKey) {
                        // SHIFT + Click = inizia connessione
                        e.stopPropagation()
                        if (connectingFrom) {
                          addConnection(connectingFrom, node.id)
                          setConnectingFrom(null)
                          setTempConnectionEnd(null)
                        } else {
                          setConnectingFrom(node.id)
                        }
                      } else if (e.altKey) {
                        // ALT + Click = elimina
                        e.stopPropagation()
                        if (window.confirm(`Eliminare il nodo "${node.label}"?`)) {
                          deleteNode(node.id)
                        }
                      } else {
                        // Click normale = seleziona e inizia drag
                        e.stopPropagation()
                        setSelectedNode(node.id)
                        setDraggingNode(node.id)
                        const rect = e.currentTarget.getBoundingClientRect()
                        const parentRect = canvasRef.current?.getBoundingClientRect()
                        if (parentRect) {
                          setDragOffset({
                            x: e.clientX - parentRect.left - node.x,
                            y: e.clientY - parentRect.top - node.y
                          })
                        }
                      }
                    }}
                    className="absolute px-4 py-2.5 rounded-lg shadow-lg transition-all select-none"
                    style={{
                      left: node.x,
                      top: node.y,
                      background: node.color + '15',
                      border: `3px solid ${selectedNode === node.id ? node.color : node.color + '40'}`,
                      cursor: 'grab',
                      minWidth: 150,
                      transform: selectedNode === node.id ? 'scale(1.05)' : 'scale(1)',
                      boxShadow: selectedNode === node.id ? `0 8px 24px ${node.color}40` : '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                    <div className="flex items-center gap-2 mb-1">
                      <Ic n={node.icon} s={16} c={node.color}/>
                      <span style={{ fontSize: 12, fontWeight: 700, color: node.color }}>{node.label}</span>
                    </div>
                    {node.data.nome && (
                      <div style={{ fontSize: 11, color: TX.text, fontWeight: 600 }}>{node.data.nome}</div>
                    )}
                    {node.data.durata_giorni && (
                      <div style={{ fontSize: 10, color: TX.textMuted }}>⏱️ {node.data.durata_giorni}gg</div>
                    )}
                  </div>
                ))}
                
                {/* Help overlay quando canvas vuoto */}
                {canvasNodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <Ic n="gitBranch" s={64} c={TX.textMuted}/>
                      <h3 className="font-bold text-lg mt-4" style={{ color: TX.text }}>Trascina i Nodi qui!</h3>
                      <p style={{ fontSize: 12, color: TX.textMuted, marginTop: 8, maxWidth: 400 }}>
                        Trascina i blocchi dalla barra sopra per costruire il tuo workflow
                      </p>
                      <div className="mt-6 space-y-2" style={{ fontSize: 11, color: TX.textMuted, textAlign: 'left', maxWidth: 350, margin: '24px auto 0' }}>
                        <div>🖱️ <strong>Click</strong> = Seleziona e sposta</div>
                        <div>⇧ <strong>SHIFT + Click</strong> su 2 nodi = Collega</div>
                        <div>⌥ <strong>ALT + Click</strong> = Elimina</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ background: BG.page }}>
              <div className="text-center">
                <Ic n="gitBranch" s={64} c={TX.textMuted}/>
                <h3 className="font-bold text-lg mt-4" style={{ color: TX.text }}>Crea il Tuo Workflow</h3>
                <p style={{ fontSize: 13, color: TX.textMuted, marginTop: 8, maxWidth: 400 }}>
                  Seleziona un workflow esistente o creane uno nuovo per iniziare a personalizzare il tuo processo di lavoro
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PROPERTIES - Proprietà nodo selezionato */}
        <div className="w-80 flex flex-col" style={{ background: BG.card, borderLeft: `1px solid ${TX.border}` }}>
          <div className="p-4 border-b" style={{ borderColor: TX.border }}>
            <h3 className="font-bold text-sm" style={{ color: TX.text }}>Proprietà Nodo</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {selectedNode ? (() => {
              const node = canvasNodes.find(n => n.id === selectedNode)
              if (!node) return null
              
              return (
                <div className="space-y-4">
                  {/* Header nodo */}
                  <div className="p-3 rounded-lg" style={{ background: node.color + '15', border: `2px solid ${node.color}40` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Ic n={node.icon} s={20} c={node.color}/>
                      <span style={{ fontSize: 14, fontWeight: 700, color: node.color }}>{node.label}</span>
                    </div>
                    <div style={{ fontSize: 10, color: TX.textMuted, fontFamily: 'monospace' }}>ID: {node.id}</div>
                  </div>

                  {/* Form proprietà */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                        Nome Fase
                      </label>
                      <input
                        type="text"
                        value={node.data.nome || ''}
                        onChange={(e) => updateNodeData(node.id, 'nome', e.target.value)}
                        placeholder="es. Sopralluogo Cliente"
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                      />
                    </div>

                    {node.type === 'fase' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                          Durata Stimata (giorni)
                        </label>
                        <input
                          type="number"
                          value={node.data.durata_giorni || 1}
                          onChange={(e) => updateNodeData(node.id, 'durata_giorni', parseInt(e.target.value))}
                          min="1"
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                        />
                      </div>
                    )}

                    {(node.type === 'fase' || node.type === 'action') && (
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                          Responsabile
                        </label>
                        <select
                          value={node.data.responsabile || ''}
                          onChange={(e) => updateNodeData(node.id, 'responsabile', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}>
                          <option value="">Nessuno</option>
                          <option value="ufficio">Ufficio</option>
                          <option value="tecnico">Tecnico</option>
                          <option value="commerciale">Commerciale</option>
                          <option value="produzione">Produzione</option>
                        </select>
                      </div>
                    )}

                    {node.type === 'decision' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                          Condizione
                        </label>
                        <input
                          type="text"
                          value={node.data.condizione || ''}
                          onChange={(e) => updateNodeData(node.id, 'condizione', e.target.value)}
                          placeholder="es. Cliente ha confermato?"
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                        />
                      </div>
                    )}

                    {node.type === 'action' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                          Tipo Azione
                        </label>
                        <select
                          value={node.data.azione_tipo || ''}
                          onChange={(e) => updateNodeData(node.id, 'azione_tipo', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}>
                          <option value="">Seleziona...</option>
                          <option value="email">Invia Email</option>
                          <option value="notifica">Notifica</option>
                          <option value="ordine">Crea Ordine</option>
                          <option value="calendario">Aggiungi Evento</option>
                        </select>
                      </div>
                    )}

                    {node.type === 'delay' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                          Attesa (giorni)
                        </label>
                        <input
                          type="number"
                          value={node.data.delay_giorni || 1}
                          onChange={(e) => updateNodeData(node.id, 'delay_giorni', parseInt(e.target.value))}
                          min="1"
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold mb-1" style={{ color: TX.textMuted }}>
                        Note
                      </label>
                      <textarea
                        value={node.data.note || ''}
                        onChange={(e) => updateNodeData(node.id, 'note', e.target.value)}
                        placeholder="Note aggiuntive..."
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg text-sm"
                        style={{ background: BG.input, border: `1px solid ${TX.border}`, color: TX.text }}
                      />
                    </div>
                  </div>

                  {/* Azioni nodo */}
                  <div className="pt-4 border-t" style={{ borderColor: TX.border }}>
                    <button
                      onClick={() => {
                        if (window.confirm(`Eliminare il nodo "${node.label}"?`)) {
                          deleteNode(node.id)
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                      style={{ background: '#ff4444', color: '#fff' }}>
                      <Ic n="trash" s={14}/>
                      Elimina Nodo
                    </button>
                  </div>

                  {/* Statistiche connessioni */}
                  <div className="pt-4 border-t" style={{ borderColor: TX.border }}>
                    <div style={{ fontSize: 10, color: TX.textMuted, fontWeight: 700, textTransform: 'uppercase' as const, marginBottom: 8 }}>
                      Connessioni
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between" style={{ fontSize: 11, color: TX.text }}>
                        <span>In ingresso:</span>
                        <span className="font-bold">{canvasConnections.filter(c => c.to === node.id).length}</span>
                      </div>
                      <div className="flex items-center justify-between" style={{ fontSize: 11, color: TX.text }}>
                        <span>In uscita:</span>
                        <span className="font-bold">{canvasConnections.filter(c => c.from === node.id).length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })() : (
              <div className="text-center py-8">
                <Ic n="mousePointer" s={32} c={TX.textMuted}/>
                <p style={{ fontSize: 11, color: TX.textMuted, marginTop: 8 }}>
                  Seleziona un nodo per modificarne le proprietà
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </>
    )
  }

  // ==================== DESKTOP LAYOUT ====================
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home' },
    { id: 'commesse', label: 'Commesse', icon: 'clipboard' },
    { id: 'contabilita', label: 'Contabilità', icon: 'dollar' },
    { id: 'magazzino', label: 'Magazzino', icon: 'package' },
    { id: 'produzione', label: 'Produzione', icon: 'wrench' },
    { id: 'clienti', label: 'Clienti', icon: 'users' },
    { id: 'calendario', label: 'Calendario', icon: 'calendar' },
    { id: 'misure', label: 'Misure Cantiere', icon: 'ruler' },
    { id: 'configuratore', label: 'Configuratore', icon: 'window' },
    { id: 'workflow', label: 'Workflow Builder', icon: 'gitBranch' },
    { id: 'pratiche', label: 'Pratiche & Enti', icon: 'file' },
    { id: 'team', label: 'Team', icon: 'users' },
    { id: 'rete', label: 'Rete Commerciale', icon: 'users' },
    { id: 'marketplace', label: 'Marketplace', icon: 'store' },
  ].filter(t => allowedTabs.includes(t.id))

  return (
    <>
      {isMobile === null ? null : isMobile ? (
        <MobileLayout />
      ) : (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }}>
          <DesktopShell
            profilo={profilo}
            onLogout={handleLogout}
            commesse={commesse}
            clienti={clienti}
            stats={stats}
          />
        </div>
      )}
      {/* DEV TOOLBAR */}
      <div style={{ position: "fixed", bottom: 12, right: 12, zIndex: 99999, background: "#1a1a2e", borderRadius: 12, padding: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.5)", maxWidth: 320, fontSize: 11 }}>
        <div style={{ color: "#fff", fontWeight: 700, marginBottom: 6 }}>DEV TOOLBAR</div>
        <div style={{ color: "#aaa", marginBottom: 4 }}>Licenza: <span style={{ color: "#0f0" }}>{userLicenza}</span></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
          {Object.keys(licenzaConfig).map(k => (
            <button key={k} onClick={() => setDevLicenza(k)} style={{ padding: "3px 8px", borderRadius: 6, border: k === userLicenza ? "2px solid #0f0" : "1px solid #444", background: k === userLicenza ? "#0f03" : "#333", color: "#fff", cursor: "pointer", fontSize: 10 }}>{k}</button>
          ))}
        </div>
        <div style={{ color: "#aaa", fontSize: 10 }}>Tabs: {allowedTabs.join(", ")}</div>
      </div>
    </>
  )
}