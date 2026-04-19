// @ts-nocheck
// WizardVanoComposto.tsx — MASTRO Wizard Vano Multi-Componente
// Aggiunge componenti con +, sync misure, salva in libreria o genera preventivo
'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ═══════════════════════════════════════════════════════════
// DESIGN SYSTEM fliwoX
// ═══════════════════════════════════════════════════════════
const DS = {
  teal: '#28A0A0', tealDark: '#156060', ink: '#0D1F1F',
  light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF',
  green: '#1A9E73', greenDark: '#0F7A56',
  red: '#DC4444', redDark: '#A83030',
  amber: '#D08008', amberDark: '#9A5F06',
  blue: '#3B7FE0', purple: '#7C3AED',
  bg: '#E8F4F4', sub: '#6B8A8A', card: '#FFFFFF',
};

const FONT = { ui: 'system-ui, -apple-system, sans-serif', mono: "'JetBrains Mono', monospace" };

// SVG Icons (no emoji, no external libs)
const ICO = {
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  save: 'M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2zM17 21v-8H7v8M7 3v5h8',
  lib: 'M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 014 17V5a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2H6.5',
  sync: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
  prev: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  drag: 'M8 6h.01M12 6h.01M8 12h.01M12 12h.01M8 18h.01M12 18h.01',
  trash: 'M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
};

const Ico = ({ d, s = 20, c = DS.ink }: { d: string; s?: number; c?: string }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>
);

// ═══════════════════════════════════════════════════════════
// TIPI COMPONENTE
// ═══════════════════════════════════════════════════════════
type CompTipo = 'controtelaio'|'finestra'|'lamiere'|'cassonetto'|'persiana'|'tapparella'|'zanzariera'|'nodo_posa';

interface Componente {
  id: string;
  tipo: CompTipo;
  ordine: number;
  config: Record<string, any>;
  misure: { L?: number; H?: number; P?: number; [k: string]: any };
  prezzo: number;
  costo: number;
  note: string;
}

const COMP_META: Record<CompTipo, { label: string; color: string; colorDark: string; campi: string[] }> = {
  controtelaio: { label: 'Controtelaio', color: '#28A0A0', colorDark: '#156060', campi: ['L','H','P','tipo_ct','materiale','spessore'] },
  finestra:     { label: 'Finestra', color: '#3B7FE0', colorDark: '#2060B0', campi: ['L','H','tipo_apertura','n_ante','sistema','vetro','colore_int','colore_est'] },
  lamiere:      { label: 'Lamiere', color: '#D08008', colorDark: '#9A5F06', campi: ['L_sopra','L_sotto','L_sx','L_dx','sviluppo','materiale','colore'] },
  cassonetto:   { label: 'Cassonetto', color: '#7C3AED', colorDark: '#5B21B6', campi: ['L','H','P','tipo','coibentazione'] },
  persiana:     { label: 'Persiana', color: '#1A9E73', colorDark: '#0F7A56', campi: ['L','H','n_ante','materiale','colore','stecche'] },
  tapparella:   { label: 'Tapparella', color: '#6B8A8A', colorDark: '#4A6A6A', campi: ['L','H','tipo_telo','tipo_cassonetto','motorizzata'] },
  zanzariera:   { label: 'Zanzariera', color: '#DC4444', colorDark: '#A83030', campi: ['L','H','tipo','guida'] },
  nodo_posa:    { label: 'Nodo Posa', color: '#0D1F1F', colorDark: '#000000', campi: ['posizione','tipo_muro','spessore_muro','isolamento'] },
};

// ═══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════
interface WizardVanoCompostoProps {
  vanoId?: string;
  commessaId: string;
  onClose?: () => void;
  onSaved?: () => void;
}

export default function WizardVanoComposto({ vanoId, commessaId, onClose, onSaved }: WizardVanoCompostoProps) {
  const [componenti, setComponenti] = useState<Componente[]>([]);
  const [showSelector, setShowSelector] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [saving, setSaving] = useState(false);
  const [showLibSave, setShowLibSave] = useState(false);
  const [libNome, setLibNome] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [vanoData, setVanoData] = useState<any>(null);

  // Load existing vano data + componenti
  useEffect(() => {
    if (!vanoId) return;
    (async () => {
      const { data: v } = await supabase.from('vani').select('*').eq('id', vanoId).single();
      if (v) setVanoData(v);
      const { data: cc } = await supabase.from('componenti_vano').select('*').eq('vano_id', vanoId).order('ordine');
      if (cc?.length) setComponenti(cc.map(c => ({ ...c, config: c.config || {}, misure: c.misure || {}, note: c.note || '' })));
    })();
  }, [vanoId]);

  // Load templates
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('libreria_vano_template').select('*').eq('attivo', true).order('usato_count', { ascending: false }).limit(20);
      if (data) setTemplates(data);
    })();
  }, []);

  // ── ADD COMPONENTE ──
  const addComponente = useCallback((tipo: CompTipo) => {
    const id = crypto.randomUUID();
    const masterMisure = componenti.find(c => c.tipo === 'controtelaio' || c.tipo === 'finestra');
    const newComp: Componente = {
      id, tipo, ordine: componenti.length,
      config: {},
      misure: masterMisure ? { L: masterMisure.misure.L, H: masterMisure.misure.H } : {},
      prezzo: 0, costo: 0, note: ''
    };
    setComponenti(prev => [...prev, newComp]);
    setEditingId(id);
    setShowSelector(false);
  }, [componenti]);

  // ── SYNC MISURE ── CT/Finestra dettano L,H a tutti gli altri
  const syncMisure = useCallback((sourceId: string, field: string, value: number) => {
    setComponenti(prev => {
      const updated = prev.map(c => {
        if (c.id === sourceId) return { ...c, misure: { ...c.misure, [field]: value } };
        return c;
      });
      const source = updated.find(c => c.id === sourceId);
      if (source && (source.tipo === 'controtelaio' || source.tipo === 'finestra') && (field === 'L' || field === 'H')) {
        return updated.map(c => {
          if (c.id === sourceId) return c;
          if (field === 'L' || field === 'H') {
            return { ...c, misure: { ...c.misure, [field]: value } };
          }
          return c;
        });
      }
      return updated;
    });
  }, []);

  // ── UPDATE CONFIG ──
  const updateConfig = useCallback((id: string, key: string, val: any) => {
    setComponenti(prev => prev.map(c => c.id === id ? { ...c, config: { ...c.config, [key]: val } } : c));
  }, []);

  // ── UPDATE PREZZO ──
  const updatePrezzo = useCallback((id: string, field: 'prezzo'|'costo', val: number) => {
    setComponenti(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
  }, []);

  // ── REMOVE ──
  const removeComp = useCallback((id: string) => {
    setComponenti(prev => prev.filter(c => c.id !== id));
    if (editingId === id) setEditingId(null);
  }, [editingId]);

  // ── TOTALS ──
  const totals = useMemo(() => {
    const prezzo = componenti.reduce((s, c) => s + (c.prezzo || 0), 0);
    const costo = componenti.reduce((s, c) => s + (c.costo || 0), 0);
    return { prezzo, costo, margine: prezzo - costo, marginePct: prezzo > 0 ? ((prezzo - costo) / prezzo * 100) : 0 };
  }, [componenti]);

  // ── SAVE TO DB ──
  const saveAll = useCallback(async () => {
    if (!vanoId) return;
    setSaving(true);
    try {
      // Delete old componenti
      await supabase.from('componenti_vano').delete().eq('vano_id', vanoId);
      // Insert new
      if (componenti.length > 0) {
        await supabase.from('componenti_vano').insert(
          componenti.map((c, i) => ({
            vano_id: vanoId,
            tipo: c.tipo,
            ordine: i,
            config: c.config,
            misure: c.misure,
            prezzo: c.prezzo || 0,
            costo: c.costo || 0,
            note: c.note,
          }))
        );
      }
      // Update vano configs from components
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      for (const c of componenti) {
        if (c.tipo === 'controtelaio') updates.controtelaio_config = { ...c.config, misure: c.misure };
        if (c.tipo === 'cassonetto') updates.cassonetto_config = { ...c.config, misure: c.misure };
        if (c.tipo === 'persiana') updates.persiana_config = { ...c.config, misure: c.misure };
        if (c.tipo === 'tapparella') updates.tapparella_config = { ...c.config, misure: c.misure };
        if (c.tipo === 'zanzariera') updates.zanzariera_config = { ...c.config, misure: c.misure };
        if (c.tipo === 'lamiere') updates.lamiere_config = c.config;
      }
      await supabase.from('vani').update(updates).eq('id', vanoId);
      onSaved?.();
    } finally {
      setSaving(false);
    }
  }, [vanoId, componenti, onSaved]);

  // ── SAVE TO LIBRARY ──
  const saveToLibrary = useCallback(async () => {
    if (!libNome.trim()) return;
    setSaving(true);
    try {
      const templateData: Record<string, any> = {
        nome: libNome.trim(),
        categoria: 'serramenti',
        misure_riferimento: componenti[0]?.misure || {},
        prezzo_base: totals.prezzo,
        costo_base: totals.costo,
      };
      // Extract configs per tipo
      for (const c of componenti) {
        if (c.tipo === 'controtelaio') templateData.controtelaio_config = { ...c.config, misure: c.misure };
        if (c.tipo === 'cassonetto') templateData.cassonetto_config = { ...c.config, misure: c.misure };
        if (c.tipo === 'persiana') templateData.persiana_config = { ...c.config, misure: c.misure };
        if (c.tipo === 'tapparella') templateData.tapparella_config = { ...c.config, misure: c.misure };
        if (c.tipo === 'zanzariera') templateData.zanzariera_config = { ...c.config, misure: c.misure };
        if (c.tipo === 'finestra') {
          templateData.tipo = c.config.tipo_apertura;
          templateData.sistema = c.config.sistema;
          templateData.vetro = c.config.vetro;
          templateData.colore_int = c.config.colore_int;
          templateData.colore_est = c.config.colore_est;
        }
        if (c.tipo === 'lamiere') templateData.lamiere_config = c.config;
        if (c.tipo === 'nodo_posa') templateData.nodo_posa_config = c.config;
      }
      templateData.accessori = componenti.map(c => ({ tipo: c.tipo, config: c.config, misure: c.misure }));
      await supabase.from('libreria_vano_template').insert(templateData);
      setShowLibSave(false);
      setLibNome('');
      // Refresh templates
      const { data } = await supabase.from('libreria_vano_template').select('*').eq('attivo', true).order('usato_count', { ascending: false }).limit(20);
      if (data) setTemplates(data);
    } finally {
      setSaving(false);
    }
  }, [libNome, componenti, totals]);

  // ── APPLY TEMPLATE ──
  const applyTemplate = useCallback((tpl: any) => {
    const newComps: Componente[] = [];
    const baseMisure = tpl.misure_riferimento || {};
    if (tpl.accessori && Array.isArray(tpl.accessori)) {
      tpl.accessori.forEach((a: any, i: number) => {
        newComps.push({
          id: crypto.randomUUID(),
          tipo: a.tipo,
          ordine: i,
          config: a.config || {},
          misure: a.misure || baseMisure,
          prezzo: 0, costo: 0, note: ''
        });
      });
    }
    setComponenti(newComps);
    setShowTemplates(false);
    // Increment usage counter
    supabase.from('libreria_vano_template').update({ usato_count: (tpl.usato_count || 0) + 1 }).eq('id', tpl.id);
  }, []);

  // ── GENERA PREVENTIVO ──
  const generaPreventivo = useCallback(async () => {
    if (!commessaId || componenti.length === 0) return;
    setSaving(true);
    try {
      // Create or get preventivo
      let { data: prev } = await supabase.from('preventivi').select('id').eq('commessa_id', commessaId).eq('stato', 'bozza').single();
      if (!prev) {
        const { data: newPrev } = await supabase.from('preventivi').insert({
          commessa_id: commessaId,
          totale_netto: totals.prezzo,
          totale_iva: totals.prezzo * 0.22,
          totale_lordo: totals.prezzo * 1.22,
          margine_stimato: totals.margine,
        }).select('id').single();
        prev = newPrev;
      }
      if (!prev) return;
      // Delete old voci for this vano
      if (vanoId) {
        await supabase.from('voci_preventivo').delete().eq('preventivo_id', prev.id).eq('vano_id', vanoId);
      }
      // Insert voci per componente
      const voci = componenti.map((c, i) => ({
        preventivo_id: prev!.id,
        vano_id: vanoId || null,
        categoria: c.tipo === 'finestra' ? 'serramento' : c.tipo,
        descrizione: `${COMP_META[c.tipo].label}${c.misure.L && c.misure.H ? ` ${c.misure.L}x${c.misure.H}` : ''}${c.config.sistema ? ` - ${c.config.sistema}` : ''}`,
        quantita: 1,
        prezzo_unitario: c.prezzo || 0,
        totale_riga: c.prezzo || 0,
        costo_acquisto: c.costo || 0,
        margine_riga: (c.prezzo || 0) - (c.costo || 0),
        ordine: i,
        meta: { config: c.config, misure: c.misure },
      }));
      await supabase.from('voci_preventivo').insert(voci);
      // Update preventivo totals
      const { data: allVoci } = await supabase.from('voci_preventivo').select('totale_riga, margine_riga').eq('preventivo_id', prev.id);
      if (allVoci) {
        const netto = allVoci.reduce((s, v) => s + (v.totale_riga || 0), 0);
        const marg = allVoci.reduce((s, v) => s + (v.margine_riga || 0), 0);
        await supabase.from('preventivi').update({
          totale_netto: netto,
          totale_iva: netto * 0.22,
          totale_lordo: netto * 1.22,
          margine_stimato: marg,
          updated_at: new Date().toISOString(),
        }).eq('id', prev.id);
      }
    } finally {
      setSaving(false);
    }
  }, [commessaId, vanoId, componenti, totals]);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  const editingComp = componenti.find(c => c.id === editingId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: DS.bg, fontFamily: FONT.ui }}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: DS.ink, color: DS.white }}>
        {onClose && <div onClick={onClose} style={{ cursor: 'pointer', padding: 4 }}><Ico d={ICO.x} s={18} c="#fff" /></div>}
        <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>Wizard Vano Composto</span>
        <div onClick={() => setShowTemplates(!showTemplates)} style={{ cursor: 'pointer', padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: 6, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Ico d={ICO.lib} s={14} c="#fff" /> Libreria
        </div>
      </div>

      {/* ── TEMPLATES DROPDOWN ── */}
      {showTemplates && templates.length > 0 && (
        <div style={{ background: DS.white, borderBottom: `1px solid ${DS.border}`, padding: 12, maxHeight: 200, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: DS.sub, textTransform: 'uppercase', marginBottom: 8 }}>Template salvati</div>
          {templates.map(t => (
            <div key={t.id} onClick={() => applyTemplate(t)} style={{ padding: '8px 12px', borderRadius: 6, border: `1px solid ${DS.border}`, marginBottom: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{t.nome}</div>
                <div style={{ fontSize: 11, color: DS.sub }}>{t.sistema || t.categoria} {t.misure_riferimento?.L && `${t.misure_riferimento.L}x${t.misure_riferimento.H}`}</div>
              </div>
              <div style={{ fontSize: 12, fontFamily: FONT.mono, color: DS.teal, fontWeight: 600 }}>
                {t.prezzo_base > 0 && `${t.prezzo_base.toFixed(0)}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT: Lista componenti */}
        <div style={{ width: 260, borderRight: `1px solid ${DS.border}`, display: 'flex', flexDirection: 'column', background: DS.white }}>
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${DS.border}`, fontSize: 11, fontWeight: 700, color: DS.sub, textTransform: 'uppercase' }}>
            Componenti ({componenti.length})
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
            {componenti.map((c, i) => {
              const meta = COMP_META[c.tipo];
              const active = editingId === c.id;
              return (
                <div key={c.id} onClick={() => setEditingId(c.id)}
                  style={{
                    padding: '10px 12px', marginBottom: 6, borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${active ? meta.color : DS.border}`,
                    background: active ? `${meta.color}10` : DS.white,
                    transition: 'all 0.15s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{meta.label}</span>
                    <div onClick={e => { e.stopPropagation(); removeComp(c.id); }} style={{ cursor: 'pointer', opacity: 0.4 }}>
                      <Ico d={ICO.trash} s={14} c={DS.red} />
                    </div>
                  </div>
                  {(c.misure.L || c.misure.H) && (
                    <div style={{ fontSize: 11, color: DS.sub, marginTop: 4, fontFamily: FONT.mono }}>
                      {c.misure.L || '?'} x {c.misure.H || '?'} mm
                    </div>
                  )}
                  {c.prezzo > 0 && (
                    <div style={{ fontSize: 12, color: meta.color, fontWeight: 600, fontFamily: FONT.mono, marginTop: 2 }}>
                      {c.prezzo.toFixed(2)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* + BUTTON */}
            <div onClick={() => setShowSelector(!showSelector)}
              style={{
                padding: 12, borderRadius: 8, border: `2px dashed ${DS.teal}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                cursor: 'pointer', color: DS.teal, fontWeight: 600, fontSize: 13,
                background: showSelector ? `${DS.teal}10` : 'transparent',
              }}>
              <Ico d={ICO.plus} s={18} c={DS.teal} /> Aggiungi
            </div>

            {/* SELECTOR */}
            {showSelector && (
              <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {(Object.entries(COMP_META) as [CompTipo, typeof COMP_META[CompTipo]][]).map(([tipo, meta]) => (
                  <div key={tipo} onClick={() => addComponente(tipo)}
                    style={{
                      padding: '8px 6px', borderRadius: 6, cursor: 'pointer', textAlign: 'center',
                      background: `${meta.color}15`, border: `1px solid ${meta.color}30`,
                      fontSize: 11, fontWeight: 600, color: meta.colorDark,
                    }}>
                    {meta.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TOTALS BAR */}
          <div style={{ padding: 12, borderTop: `1px solid ${DS.border}`, background: DS.light }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: DS.sub }}>Totale</span>
              <span style={{ fontFamily: FONT.mono, fontWeight: 700, color: DS.ink }}>{totals.prezzo.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
              <span style={{ color: DS.sub }}>Margine</span>
              <span style={{ fontFamily: FONT.mono, fontWeight: 600, color: totals.margine >= 0 ? DS.green : DS.red }}>
                {totals.margine.toFixed(2)} ({totals.marginePct.toFixed(0)}%)
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Editor componente */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {editingComp ? (
            <ComponentEditor
              comp={editingComp}
              onMisuraChange={syncMisure}
              onConfigChange={updateConfig}
              onPrezzoChange={updatePrezzo}
              onNoteChange={(id, note) => setComponenti(prev => prev.map(c => c.id === id ? { ...c, note } : c))}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: DS.sub }}>
              <Ico d={ICO.eye} s={48} c={DS.border} />
              <div style={{ marginTop: 16, fontSize: 14 }}>Seleziona un componente o aggiungine uno nuovo</div>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM ACTIONS ── */}
      <div style={{ display: 'flex', gap: 8, padding: '10px 16px', borderTop: `1px solid ${DS.border}`, background: DS.white }}>
        <Btn label="Salva vano" icon={ICO.save} color={DS.teal} dark={DS.tealDark} onClick={saveAll} disabled={saving || !vanoId} />
        <Btn label="Salva in libreria" icon={ICO.lib} color={DS.amber} dark={DS.amberDark} onClick={() => setShowLibSave(true)} disabled={saving || componenti.length === 0} />
        <Btn label="Genera preventivo" icon={ICO.prev} color={DS.green} dark={DS.greenDark} onClick={generaPreventivo} disabled={saving || componenti.length === 0} />
      </div>

      {/* ── LIB SAVE MODAL ── */}
      {showLibSave && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: DS.white, borderRadius: 12, padding: 24, width: 360 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 16 }}>Salva in libreria</div>
            <input value={libNome} onChange={e => setLibNome(e.target.value)} placeholder="Nome template (es. Finestra 2 ante + CT + lamiere)"
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 14, fontFamily: FONT.ui, marginBottom: 16, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn label="Annulla" color={DS.sub} dark="#444" onClick={() => setShowLibSave(false)} />
              <Btn label="Salva" icon={ICO.save} color={DS.teal} dark={DS.tealDark} onClick={saveToLibrary} disabled={!libNome.trim()} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// COMPONENT EDITOR — form per singolo componente
// ═══════════════════════════════════════════════════════════
function ComponentEditor({ comp, onMisuraChange, onConfigChange, onPrezzoChange, onNoteChange }: {
  comp: Componente;
  onMisuraChange: (id: string, field: string, val: number) => void;
  onConfigChange: (id: string, key: string, val: any) => void;
  onPrezzoChange: (id: string, field: 'prezzo'|'costo', val: number) => void;
  onNoteChange: (id: string, note: string) => void;
}) {
  const meta = COMP_META[comp.tipo];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: meta.color }} />
        <span style={{ fontWeight: 700, fontSize: 18, color: DS.ink }}>{meta.label}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: `${DS.teal}15`, borderRadius: 6 }}>
          <Ico d={ICO.sync} s={14} c={DS.teal} />
          <span style={{ fontSize: 11, color: DS.teal, fontWeight: 600 }}>Sync attivo</span>
        </div>
      </div>

      {/* Misure principali */}
      <SectionTitle title="Misure" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <NumInput label="Larghezza (mm)" value={comp.misure.L} onChange={v => onMisuraChange(comp.id, 'L', v)} synced={comp.tipo !== 'controtelaio' && comp.tipo !== 'finestra'} />
        <NumInput label="Altezza (mm)" value={comp.misure.H} onChange={v => onMisuraChange(comp.id, 'H', v)} synced={comp.tipo !== 'controtelaio' && comp.tipo !== 'finestra'} />
        {meta.campi.includes('P') && <NumInput label="Profondita (mm)" value={comp.misure.P} onChange={v => onMisuraChange(comp.id, 'P', v)} />}
      </div>

      {/* Configurazione specifica */}
      <SectionTitle title="Configurazione" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        {meta.campi.filter(c => !['L','H','P'].includes(c)).map(campo => (
          <TextInput key={campo} label={campo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            value={comp.config[campo] || ''} onChange={v => onConfigChange(comp.id, campo, v)} />
        ))}
      </div>

      {/* Prezzi */}
      <SectionTitle title="Prezzi" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        <NumInput label="Prezzo vendita" value={comp.prezzo} onChange={v => onPrezzoChange(comp.id, 'prezzo', v)} prefix="EUR" />
        <NumInput label="Costo acquisto" value={comp.costo} onChange={v => onPrezzoChange(comp.id, 'costo', v)} prefix="EUR" />
      </div>
      {comp.prezzo > 0 && (
        <div style={{ padding: '8px 12px', borderRadius: 6, background: (comp.prezzo - comp.costo) >= 0 ? '#D1FAE5' : '#FEE2E2', display: 'inline-flex', gap: 8, fontSize: 13, fontFamily: FONT.mono, marginBottom: 20 }}>
          <span style={{ color: DS.sub }}>Margine:</span>
          <span style={{ fontWeight: 700, color: (comp.prezzo - comp.costo) >= 0 ? DS.green : DS.red }}>
            {(comp.prezzo - comp.costo).toFixed(2)} ({comp.prezzo > 0 ? ((comp.prezzo - comp.costo) / comp.prezzo * 100).toFixed(0) : 0}%)
          </span>
        </div>
      )}

      {/* Note */}
      <SectionTitle title="Note" />
      <textarea value={comp.note} onChange={e => onNoteChange(comp.id, e.target.value)} placeholder="Note lavorazione, dettagli, problemi..."
        style={{ width: '100%', minHeight: 60, padding: '8px 12px', border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 13, fontFamily: FONT.ui, resize: 'vertical', boxSizing: 'border-box' }} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// UI ATOMS
// ═══════════════════════════════════════════════════════════
function SectionTitle({ title }: { title: string }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: DS.sub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${DS.border}` }}>{title}</div>;
}

function NumInput({ label, value, onChange, prefix, synced }: { label: string; value?: number; onChange: (v: number) => void; prefix?: string; synced?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: DS.sub, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {synced && <span style={{ fontSize: 9, background: `${DS.teal}20`, color: DS.teal, padding: '1px 4px', borderRadius: 3, fontWeight: 600 }}>SYNC</span>}
      </div>
      <div style={{ position: 'relative' }}>
        <input type="number" value={value ?? ''} onChange={e => onChange(parseFloat(e.target.value) || 0)}
          style={{
            width: '100%', padding: '8px 12px', border: `1px solid ${synced ? DS.teal : DS.border}`, borderRadius: 6,
            fontSize: 14, fontFamily: FONT.mono, background: synced ? `${DS.teal}08` : DS.white,
            color: DS.ink, outline: 'none', boxSizing: 'border-box',
          }} />
        {prefix && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: DS.sub }}>{prefix}</span>}
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: DS.sub, marginBottom: 4 }}>{label}</div>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', padding: '8px 12px', border: `1px solid ${DS.border}`, borderRadius: 6, fontSize: 13, fontFamily: FONT.ui, color: DS.ink, outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

function Btn({ label, icon, color, dark, onClick, disabled }: { label: string; icon?: string; color: string; dark: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        flex: 1, padding: '10px 16px', background: color, color: '#fff', border: 'none', borderRadius: 8,
        fontSize: 13, fontWeight: 700, fontFamily: FONT.ui, cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: `0 4px 0 0 ${dark}`, transform: 'translateY(0)', transition: 'all 0.1s',
        opacity: disabled ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      }}
      onMouseDown={e => { if (!disabled) (e.currentTarget.style.transform = 'translateY(3px)', e.currentTarget.style.boxShadow = `0 1px 0 0 ${dark}`); }}
      onMouseUp={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 0 ${dark}`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 0 0 ${dark}`; }}>
      {icon && <Ico d={icon} s={16} c="#fff" />}
      {label}
    </button>
  );
}
