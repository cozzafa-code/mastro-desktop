// @ts-nocheck
'use client';
// ═══════════════════════════════════════════════════════════════
// MASTRO — CostruttoreLavorazioni (S21)
// Libreria lavorazioni: operazioni fisiche su profili
// Ogni lavorazione = insieme di operazioni elementari (fori, frese, tagli)
// con dimensioni precise, legata a un accessorio
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const DS = { teal: '#28A0A0', dark: '#156060', ink: '#0D1F1F', light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF', red: '#DC4444', green: '#1A9E73', amber: '#D08008', blue: '#3B7FE0' };
const M = "'JetBrains Mono', monospace";

// ── Operation types ──
type OpType = 'foro' | 'fresa_rett' | 'fresa_circ' | 'taglio' | 'scasso' | 'clip';

interface Operazione {
  id: string;
  tipo: OpType;
  // Position relative to reference point (0,0)
  x: number; // mm from ref
  y: number; // mm from ref
  // Dimensions
  diametro?: number;    // for foro, fresa_circ
  larghezza?: number;   // for fresa_rett, scasso, taglio
  altezza?: number;     // for fresa_rett, scasso
  profondita?: number;  // depth in mm (how deep into profile)
  passante?: boolean;   // through-hole
  // Description
  nota?: string;
}

interface Lavorazione {
  id?: string;
  codice: string;
  nome: string;
  descrizione: string;
  categoria: string;
  modalita: string; // 'cnc' | 'cantiere' | 'entrambi'
  operazioni: Operazione[];
  // Link to accessorio
  accessorio_id?: string;
  accessorio_nome?: string;
  accessorio_fittizio?: boolean;
  // Placement rules
  posizione_tipo: string;
  posizione_da: string;
  distanza_mm?: number;
  ripeti_ogni_mm?: number;
  // CNC
  utensile?: string;
  velocita_rpm?: number;
  avanzamento?: number;
  // Cantiere — istruzioni per operaio
  motivo?: string;          // PERCHE: "Per passaggio tubo condizionatore"
  attrezzi?: string[];      // COSA: ["Fresa a tazza ø60", "Trapano", "Sigillante"]
  passi?: string[];         // COME: step-by-step istruzioni
  avvertenze?: string;      // Attenzione / sicurezza
  tempo_stimato_min?: number;
  difficolta?: string;      // 'facile' | 'media' | 'difficile'
  // SVG preview
  sezione_svg?: string;
}

const CATEGORIE = [
  'ferramenta', 'drenaggio', 'ventilazione', 'rinforzo', 'fissaggio',
  'guarnizione', 'vetraggio', 'accessorio', 'strutturale', 'estetica',
];

const OP_TYPES: { tipo: OpType; nome: string; icona: string; color: string }[] = [
  { tipo: 'foro', nome: 'Foro', icona: '○', color: DS.blue },
  { tipo: 'fresa_rett', nome: 'Fresa rettangolare', icona: '□', color: DS.teal },
  { tipo: 'fresa_circ', nome: 'Fresa circolare', icona: '◎', color: DS.green },
  { tipo: 'scasso', nome: 'Scasso', icona: '▭', color: DS.amber },
  { tipo: 'taglio', nome: 'Taglio', icona: '╱', color: DS.red },
  { tipo: 'clip', nome: 'Clipaggio', icona: '⊏', color: '#7C5FBF' },
];

let _id = 0;
const gid = () => 'op_' + (++_id);

export default function CostruttoreLavorazioni({ onBack }: { onBack?: () => void }) {
  const [lavorazioni, setLavorazioni] = useState<any[]>([]);
  const [accessori, setAccessori] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Lavorazione | null>(null);
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  const [dragOp, setDragOp] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; opId: string } | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(5);
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 });
  const [panningCanvas, setPanningCanvas] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [snapGuides, setSnapGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const canvasRef = useRef<SVGSVGElement>(null);

  // Keyboard: Delete to remove selected operation, Escape to deselect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!editing) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedOp && !(e.target as HTMLElement)?.closest?.('input,textarea,select')) {
        removeOp(selectedOp);
        e.preventDefault();
      }
      if (e.key === 'Escape') {
        setSelectedOp(null);
        setCtxMenu(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editing, selectedOp]);

  useEffect(() => {
    (async () => {
      const [{ data: lavData }, { data: accData }] = await Promise.all([
        supabase.from('catalogo_lavorazioni').select('*').order('categoria').order('codice'),
        supabase.from('catalogo_accessori').select('id,codice,nome,categoria').order('categoria'),
      ]);
      setLavorazioni(lavData || []);
      setAccessori(accData || []);
      setLoading(false);
    })();
  }, []);

  const createNew = () => {
    setEditing({
      codice: '', nome: '', descrizione: '', categoria: 'ferramenta', modalita: 'cnc',
      operazioni: [], posizione_tipo: 'fissa', posizione_da: 'basso',
      distanza_mm: 0, attrezzi: [], passi: [],
    });
    setSelectedOp(null);
  };

  const addOperazione = (tipo: OpType) => {
    if (!editing) return;
    const defaults: Record<OpType, Partial<Operazione>> = {
      foro: { diametro: 10, profondita: 15, passante: false, x: 0, y: 0 },
      fresa_rett: { larghezza: 25, altezza: 10, profondita: 5, x: 0, y: 0 },
      fresa_circ: { diametro: 20, profondita: 5, x: 0, y: 0 },
      scasso: { larghezza: 30, altezza: 15, profondita: 8, x: 0, y: 0 },
      taglio: { larghezza: 3, altezza: 50, x: 0, y: 0 },
      clip: { larghezza: 15, altezza: 5, x: 0, y: 0 },
    };
    const op: Operazione = { id: gid(), tipo, ...defaults[tipo] } as Operazione;
    setEditing(prev => prev ? { ...prev, operazioni: [...prev.operazioni, op] } : null);
    setSelectedOp(op.id);
  };

  const updateOp = (id: string, u: Partial<Operazione>) => {
    setEditing(prev => prev ? { ...prev, operazioni: prev.operazioni.map(o => o.id === id ? { ...o, ...u } : o) } : null);
  };

  const removeOp = (id: string) => {
    setEditing(prev => prev ? { ...prev, operazioni: prev.operazioni.filter(o => o.id !== id) } : null);
    if (selectedOp === id) setSelectedOp(null);
  };

  // Generate SVG of the lavorazione
  const lavSVG = useMemo(() => {
    if (!editing || editing.operazioni.length === 0) return '';
    const ops = editing.operazioni;
    const parts: string[] = [];
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    const ub = (x: number, y: number, r: number = 0) => {
      if (x - r < minX) minX = x - r; if (x + r > maxX) maxX = x + r;
      if (y - r < minY) minY = y - r; if (y + r > maxY) maxY = y + r;
    };

    ops.forEach(op => {
      const sel = selectedOp === op.id;
      const sw = sel ? '0.4' : '0.2';
      if (op.tipo === 'foro') {
        const r = (op.diametro || 10) / 2;
        ub(op.x, op.y, r);
        parts.push(`<circle cx="${op.x}" cy="${op.y}" r="${r}" fill="${sel ? DS.blue + '30' : DS.blue + '15'}" stroke="${DS.blue}" stroke-width="${sw}"/>`);
        // Center cross
        parts.push(`<line x1="${op.x - r * 0.5}" y1="${op.y}" x2="${op.x + r * 0.5}" y2="${op.y}" stroke="${DS.blue}" stroke-width="0.15"/>`);
        parts.push(`<line x1="${op.x}" y1="${op.y - r * 0.5}" x2="${op.x}" y2="${op.y + r * 0.5}" stroke="${DS.blue}" stroke-width="0.15"/>`);
        // Diameter label
        parts.push(`<text x="${op.x}" y="${op.y + r + 2}" text-anchor="middle" font-size="2.5" fill="${DS.blue}" font-family="${M}" font-weight="700">ø${op.diametro}</text>`);
      }
      else if (op.tipo === 'fresa_rett' || op.tipo === 'scasso') {
        const w = op.larghezza || 25, h = op.altezza || 10;
        ub(op.x - w / 2, op.y - h / 2); ub(op.x + w / 2, op.y + h / 2);
        const col = op.tipo === 'scasso' ? DS.amber : DS.teal;
        parts.push(`<rect x="${op.x - w / 2}" y="${op.y - h / 2}" width="${w}" height="${h}" fill="${sel ? col + '30' : col + '15'}" stroke="${col}" stroke-width="${sw}" rx="0.3"/>`);
        parts.push(`<text x="${op.x}" y="${op.y + h / 2 + 2.5}" text-anchor="middle" font-size="2" fill="${col}" font-family="${M}" font-weight="700">${w}x${h}</text>`);
      }
      else if (op.tipo === 'fresa_circ') {
        const r = (op.diametro || 20) / 2;
        ub(op.x, op.y, r);
        parts.push(`<circle cx="${op.x}" cy="${op.y}" r="${r}" fill="${sel ? DS.green + '30' : DS.green + '15'}" stroke="${DS.green}" stroke-width="${sw}"/>`);
        parts.push(`<text x="${op.x}" y="${op.y + r + 2}" text-anchor="middle" font-size="2.5" fill="${DS.green}" font-family="${M}" font-weight="700">ø${op.diametro}</text>`);
      }
      else if (op.tipo === 'taglio') {
        const w = op.larghezza || 3, h = op.altezza || 50;
        ub(op.x - w / 2, op.y - h / 2); ub(op.x + w / 2, op.y + h / 2);
        parts.push(`<rect x="${op.x - w / 2}" y="${op.y - h / 2}" width="${w}" height="${h}" fill="${DS.red}20" stroke="${DS.red}" stroke-width="${sw}" stroke-dasharray="1,0.5"/>`);
      }
      else if (op.tipo === 'clip') {
        const w = op.larghezza || 15, h = op.altezza || 5;
        ub(op.x - w / 2, op.y - h / 2); ub(op.x + w / 2, op.y + h / 2);
        parts.push(`<rect x="${op.x - w / 2}" y="${op.y - h / 2}" width="${w}" height="${h}" fill="#7C5FBF20" stroke="#7C5FBF" stroke-width="${sw}"/>`);
      }
    });

    // Reference point
    parts.push(`<circle cx="0" cy="0" r="0.8" fill="${DS.red}" opacity="0.6"/>`);
    parts.push(`<line x1="-3" y1="0" x2="3" y2="0" stroke="${DS.red}" stroke-width="0.15" stroke-dasharray="0.5,0.5"/>`);
    parts.push(`<line x1="0" y1="-3" x2="0" y2="3" stroke="${DS.red}" stroke-width="0.15" stroke-dasharray="0.5,0.5"/>`);

    // Dimension lines between operations
    if (ops.length >= 2) {
      for (let i = 0; i < ops.length - 1; i++) {
        const a = ops[i], b = ops[i + 1];
        const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2).toFixed(1);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        parts.push(`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#999" stroke-width="0.1" stroke-dasharray="0.8,0.4"/>`);
        parts.push(`<text x="${mx}" y="${my - 1}" text-anchor="middle" font-size="2" fill="#999" font-family="${M}">${dist}</text>`);
      }
    }

    const pad = 8;
    const vx = minX - pad, vy = minY - pad;
    const vw = (maxX - minX) + pad * 2, vh = (maxY - minY) + pad * 2;
    return `<svg viewBox="${vx} ${vy} ${vw} ${vh}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" width="100%" height="100%">${parts.join('')}</svg>`;
  }, [editing, selectedOp]);

  // Save
  const saveLavorazione = async () => {
    if (!editing || !editing.codice.trim()) { alert('Inserisci il codice'); return; }
    const data = {
      codice: editing.codice, nome: editing.nome, descrizione: editing.descrizione,
      tipo: editing.categoria, parte: 'profilo', modalita: editing.modalita,
      operazioni: editing.operazioni.map(o => ({ tipo: o.tipo, x: o.x, y: o.y, diametro: o.diametro, larghezza: o.larghezza, altezza: o.altezza, profondita: o.profondita, passante: o.passante, nota: o.nota })),
      posizione_tipo: editing.posizione_tipo, posizione_da: editing.posizione_da,
      distanza_mm: editing.distanza_mm, ripeti_ogni_mm: editing.ripeti_ogni_mm,
      accessorio_id: editing.accessorio_id || null,
      utensile: editing.utensile || null, velocita_rpm: editing.velocita_rpm || null, avanzamento: editing.avanzamento || null,
      motivo: editing.motivo || null, attrezzi: editing.attrezzi || [], passi: editing.passi || [],
      avvertenze: editing.avvertenze || null, tempo_stimato_min: editing.tempo_stimato_min || null,
      difficolta: editing.difficolta || 'media',
      sezione_svg: lavSVG || null,
    };
    try {
      if (editing.id) {
        await supabase.from('catalogo_lavorazioni').update(data).eq('id', editing.id);
      } else {
        const { data: saved } = await supabase.from('catalogo_lavorazioni').insert(data).select().single();
        if (saved) setEditing(prev => prev ? { ...prev, id: saved.id } : null);
      }
      const { data: all } = await supabase.from('catalogo_lavorazioni').select('*').order('categoria');
      setLavorazioni(all || []);
      alert('Lavorazione salvata!');
    } catch (e: any) { alert('Errore: ' + e.message); }
  };

  // Print
  const printLav = () => {
    if (!editing) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Lavorazione ${editing.codice}</title>
    <style>@page{size:A4;margin:15mm}body{font-family:'Segoe UI',Arial,sans-serif;color:#0D1F1F;padding:20px}h1{font-size:20px;border-bottom:3px solid #28A0A0;padding-bottom:8px}
    table{width:100%;border-collapse:collapse;margin:10px 0}td,th{padding:8px 12px;border:1px solid #ddd;text-align:left;font-size:13px}th{background:#f5f5f0;font-weight:700;width:35%}
    .val{font-weight:700;font-family:monospace}.svg-box{text-align:center;margin:15px 0;padding:20px;border:1px solid #eee}
    @media print{button{display:none}}</style></head><body>
    <h1>SCHEDA LAVORAZIONE: ${editing.codice}</h1>
    <p><b>${editing.nome}</b> — ${editing.categoria}</p>
    <p>${editing.descrizione || ''}</p>
    <div class="svg-box">${lavSVG}</div>
    <h2>Operazioni (${editing.operazioni.length})</h2>
    <table><tr><th>Tipo</th><th>Posizione X</th><th>Posizione Y</th><th>Dimensioni</th><th>Profondità</th></tr>
    ${editing.operazioni.map(o => `<tr><td>${o.tipo}</td><td class="val">${o.x} mm</td><td class="val">${o.y} mm</td>
    <td class="val">${o.diametro ? 'ø' + o.diametro : ''}${o.larghezza ? o.larghezza + 'x' + o.altezza : ''} mm</td>
    <td class="val">${o.profondita || '-'} mm ${o.passante ? '(passante)' : ''}</td></tr>`).join('')}
    </table>
    <h2>Posizionamento</h2>
    <table>
    <tr><th>Tipo</th><td>${editing.posizione_tipo}</td></tr>
    <tr><th>Riferimento</th><td>Da ${editing.posizione_da}</td></tr>
    ${editing.distanza_mm ? `<tr><th>Distanza</th><td class="val">${editing.distanza_mm} mm</td></tr>` : ''}
    ${editing.ripeti_ogni_mm ? `<tr><th>Ripeti ogni</th><td class="val">${editing.ripeti_ogni_mm} mm</td></tr>` : ''}
    ${editing.utensile ? `<tr><th>Utensile</th><td>${editing.utensile}</td></tr>` : ''}
    ${editing.velocita_rpm ? `<tr><th>Velocità</th><td class="val">${editing.velocita_rpm} RPM</td></tr>` : ''}
    </table>
    <div style="margin-top:30px;font-size:10px;color:#999;border-top:1px solid #ddd;padding-top:10px">MASTRO Suite — ${new Date().toLocaleDateString('it-IT')}</div>
    <button onclick="window.print()" style="margin:20px auto;display:block;padding:12px 40px;font-size:14px;cursor:pointer;background:#28A0A0;color:white;border:none;border-radius:8px;font-weight:700">Stampa</button>
    </body></html>`);
    win.document.close();
  };

  // ── EDITOR ──
  if (editing) {
    const selOp = editing.operazioni.find(o => o.id === selectedOp);
    return (
      <div style={{ height: '100%', display: 'flex', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
        {/* LEFT: Canvas + operation buttons */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F5F5F0' }}>
          {/* Toolbar */}
          <div style={{ padding: '8px 14px', background: DS.ink, display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => setEditing(null)} style={{ background: 'none', border: 'none', color: DS.teal, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>&#8592; Lista</button>
            <div style={{ width: 1, height: 18, background: '#333' }} />
            {OP_TYPES.map(t => (
              <button key={t.tipo} onClick={() => addOperazione(t.tipo)}
                style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.1)', color: t.color, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onMouseOver={e => (e.currentTarget.style.background = t.color + '30')}
                onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,.1)')}>
                <span style={{ fontSize: 14 }}>{t.icona}</span> {t.nome}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={printLav} style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 6, color: '#999', padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Stampa</button>
            <button onClick={saveLavorazione} style={{ background: DS.green, border: 'none', borderRadius: 6, color: '#fff', padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 0 #157a5a` }}>Salva</button>
          </div>

          {/* Interactive Canvas */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
            onContextMenu={e => e.preventDefault()}>
            <svg ref={canvasRef} style={{ width: '100%', height: '100%', background: '#F5F5F0' }}
              onMouseMove={e => {
                if (dragOp && editing) {
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const cx = ((e.clientX - rect.left - rect.width / 2) / canvasZoom) - canvasPan.x;
                  const cy = ((e.clientY - rect.top - rect.height / 2) / canvasZoom) - canvasPan.y;
                  // Snap to 0.5mm grid first
                  let sx = Math.round(cx * 2) / 2;
                  let sy = Math.round(cy * 2) / 2;
                  // Snap to other operations alignment (within 2mm)
                  const SNAP_DIST = 2;
                  let guideX: number | null = null, guideY: number | null = null;
                  editing.operazioni.forEach(other => {
                    if (other.id === dragOp) return;
                    if (Math.abs(sx - other.x) < SNAP_DIST) { sx = other.x; guideX = other.x; }
                    if (Math.abs(sy - other.y) < SNAP_DIST) { sy = other.y; guideY = other.y; }
                  });
                  // Also snap to origin (0)
                  if (Math.abs(sx) < SNAP_DIST) { sx = 0; guideX = 0; }
                  if (Math.abs(sy) < SNAP_DIST) { sy = 0; guideY = 0; }
                  setSnapGuides({ x: guideX, y: guideY });
                  updateOp(dragOp, { x: sx, y: sy });
                } else {
                  setSnapGuides({ x: null, y: null });
                }
                if (panningCanvas) {
                  setCanvasPan({ x: canvasPan.x + (e.clientX - panStart.x) / canvasZoom, y: canvasPan.y + (e.clientY - panStart.y) / canvasZoom });
                  setPanStart({ x: e.clientX, y: e.clientY });
                }
              }}
              onMouseUp={() => { setDragOp(null); setPanningCanvas(false); setSnapGuides({ x: null, y: null }); }}
              onMouseDown={e => {
                if (e.button === 1 || (e.button === 0 && !e.target?.closest?.('[data-op]'))) {
                  setPanningCanvas(true);
                  setPanStart({ x: e.clientX, y: e.clientY });
                }
                setCtxMenu(null);
              }}
              onWheel={e => setCanvasZoom(z => Math.max(1, Math.min(20, z * (e.deltaY < 0 ? 1.1 : 0.9))))}
            >
              <g transform={`translate(${canvasRef.current ? canvasRef.current.clientWidth / 2 : 300}, ${canvasRef.current ? canvasRef.current.clientHeight / 2 : 300}) scale(${canvasZoom})`}>
                <g transform={`translate(${canvasPan.x}, ${canvasPan.y})`}>
                  {/* Grid */}
                  {Array.from({ length: 41 }, (_, i) => i * 5 - 100).map(v => (
                    <React.Fragment key={v}>
                      <line x1={v} y1={-100} x2={v} y2={100} stroke="#ddd" strokeWidth={0.1 / canvasZoom} />
                      <line x1={-100} y1={v} x2={100} y2={v} stroke="#ddd" strokeWidth={0.1 / canvasZoom} />
                    </React.Fragment>
                  ))}
                  {/* Origin crosshair */}
                  <line x1={-100} y1={0} x2={100} y2={0} stroke={DS.red} strokeWidth={0.15 / canvasZoom} strokeDasharray={`${1 / canvasZoom},${0.5 / canvasZoom}`} opacity={0.4} />
                  <line x1={0} y1={-100} x2={0} y2={100} stroke={DS.red} strokeWidth={0.15 / canvasZoom} strokeDasharray={`${1 / canvasZoom},${0.5 / canvasZoom}`} opacity={0.4} />
                  <circle cx={0} cy={0} r={1} fill={DS.red} opacity={0.5} />

                  {/* Snap alignment guides */}
                  {snapGuides.x !== null && <line x1={snapGuides.x} y1={-200} x2={snapGuides.x} y2={200} stroke={DS.teal} strokeWidth={0.15} strokeDasharray="1,0.5" opacity={0.8} />}
                  {snapGuides.y !== null && <line x1={-200} y1={snapGuides.y} x2={200} y2={snapGuides.y} stroke={DS.teal} strokeWidth={0.15} strokeDasharray="1,0.5" opacity={0.8} />}

                  {/* Dimension lines between consecutive ops */}
                  {editing.operazioni.length >= 2 && editing.operazioni.slice(0, -1).map((a, i) => {
                    const b = editing.operazioni[i + 1];
                    const dist = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2).toFixed(1);
                    return (
                      <g key={`dim${i}`}>
                        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#aaa" strokeWidth={0.12} strokeDasharray="0.8,0.4" />
                        <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 1.5} textAnchor="middle" fontSize={2.5} fill="#888" fontFamily={M}>{dist}</text>
                      </g>
                    );
                  })}

                  {/* Operations — draggable */}
                  {editing.operazioni.map(op => {
                    const info = OP_TYPES.find(t => t.tipo === op.tipo);
                    const sel = selectedOp === op.id;
                    const col = info?.color || DS.blue;
                    return (
                      <g key={op.id} data-op={op.id} style={{ cursor: 'grab' }}
                        onMouseDown={e => { e.stopPropagation(); if (e.button === 0) { setSelectedOp(op.id); setDragOp(op.id); } }}
                        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setSelectedOp(op.id); setCtxMenu({ x: e.clientX, y: e.clientY, opId: op.id }); }}>
                        {op.tipo === 'foro' && (<>
                          <circle cx={op.x} cy={op.y} r={(op.diametro || 10) / 2} fill={sel ? col + '35' : col + '15'} stroke={col} strokeWidth={sel ? 0.5 : 0.25} />
                          <line x1={op.x - (op.diametro || 10) / 4} y1={op.y} x2={op.x + (op.diametro || 10) / 4} y2={op.y} stroke={col} strokeWidth={0.15} />
                          <line x1={op.x} y1={op.y - (op.diametro || 10) / 4} x2={op.x} y2={op.y + (op.diametro || 10) / 4} stroke={col} strokeWidth={0.15} />
                          <text x={op.x} y={op.y + (op.diametro || 10) / 2 + 2.5} textAnchor="middle" fontSize={2.5} fill={col} fontFamily={M} fontWeight="700">ø{op.diametro}</text>
                        </>)}
                        {(op.tipo === 'fresa_rett' || op.tipo === 'scasso') && (
                          <><rect x={op.x - (op.larghezza || 25) / 2} y={op.y - (op.altezza || 10) / 2} width={op.larghezza || 25} height={op.altezza || 10} fill={sel ? col + '35' : col + '15'} stroke={col} strokeWidth={sel ? 0.5 : 0.25} rx={0.3} />
                          <text x={op.x} y={op.y + (op.altezza || 10) / 2 + 2.5} textAnchor="middle" fontSize={2} fill={col} fontFamily={M} fontWeight="700">{op.larghezza}x{op.altezza}</text></>
                        )}
                        {op.tipo === 'fresa_circ' && (
                          <><circle cx={op.x} cy={op.y} r={(op.diametro || 20) / 2} fill={sel ? col + '35' : col + '15'} stroke={col} strokeWidth={sel ? 0.5 : 0.25} />
                          <text x={op.x} y={op.y + (op.diametro || 20) / 2 + 2.5} textAnchor="middle" fontSize={2.5} fill={col} fontFamily={M} fontWeight="700">ø{op.diametro}</text></>
                        )}
                        {op.tipo === 'taglio' && (
                          <rect x={op.x - (op.larghezza || 3) / 2} y={op.y - (op.altezza || 50) / 2} width={op.larghezza || 3} height={op.altezza || 50} fill={DS.red + '20'} stroke={DS.red} strokeWidth={sel ? 0.5 : 0.25} strokeDasharray="1,0.5" />
                        )}
                        {op.tipo === 'clip' && (
                          <rect x={op.x - (op.larghezza || 15) / 2} y={op.y - (op.altezza || 5) / 2} width={op.larghezza || 15} height={op.altezza || 5} fill={sel ? '#7C5FBF35' : '#7C5FBF15'} stroke="#7C5FBF" strokeWidth={sel ? 0.5 : 0.25} />
                        )}
                        {/* Selection indicator */}
                        {sel && <circle cx={op.x} cy={op.y} r={1} fill={DS.red} />}
                        {/* Position label */}
                        <text x={op.x + 2} y={op.y - 2} fontSize={1.8} fill="#999" fontFamily={M}>({op.x},{op.y})</text>
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>

            {/* Context menu */}
            {ctxMenu && (() => {
              const op = editing.operazioni.find(o => o.id === ctxMenu.opId);
              if (!op) return null;
              const info = OP_TYPES.find(t => t.tipo === op.tipo);
              return (
                <div style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, background: DS.white, borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,.2)', border: `1px solid ${DS.border}`, zIndex: 100, minWidth: 200, padding: 10 }}
                  onClick={e => e.stopPropagation()}>
                  <div style={{ fontWeight: 700, fontSize: 12, color: info?.color, marginBottom: 8 }}>{info?.icona} {info?.nome}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 9, color: '#999' }}>X mm</label>
                      <input type="number" value={op.x} step={0.5} onChange={e => { updateOp(op.id, { x: parseFloat(e.target.value) || 0 }); }}
                        style={{ width: '100%', padding: '6px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 13, fontFamily: M, fontWeight: 700, boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 9, color: '#999' }}>Y mm</label>
                      <input type="number" value={op.y} step={0.5} onChange={e => { updateOp(op.id, { y: parseFloat(e.target.value) || 0 }); }}
                        style={{ width: '100%', padding: '6px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 13, fontFamily: M, fontWeight: 700, boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  {(op.tipo === 'foro' || op.tipo === 'fresa_circ') && (
                    <div style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 9, color: '#999' }}>Diametro mm</label>
                      <input type="number" value={op.diametro || 0} onChange={e => updateOp(op.id, { diametro: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '6px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 13, fontFamily: M, fontWeight: 700, boxSizing: 'border-box' }} />
                    </div>
                  )}
                  {(op.tipo === 'fresa_rett' || op.tipo === 'scasso' || op.tipo === 'taglio' || op.tipo === 'clip') && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                      <div>
                        <label style={{ fontSize: 9, color: '#999' }}>Largh mm</label>
                        <input type="number" value={op.larghezza || 0} onChange={e => updateOp(op.id, { larghezza: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '6px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 13, fontFamily: M, fontWeight: 700, boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 9, color: '#999' }}>Alt mm</label>
                        <input type="number" value={op.altezza || 0} onChange={e => updateOp(op.id, { altezza: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '6px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 13, fontFamily: M, fontWeight: 700, boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 9, color: '#999' }}>Profondita mm</label>
                    <input type="number" value={op.profondita || 0} onChange={e => updateOp(op.id, { profondita: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '6px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 12, fontFamily: M, boxSizing: 'border-box' }} />
                  </div>
                  {op.tipo === 'foro' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <input type="checkbox" checked={op.passante || false} onChange={e => updateOp(op.id, { passante: e.target.checked })} />
                      <label style={{ fontSize: 11, color: '#666' }}>Passante</label>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => { removeOp(op.id); setCtxMenu(null); }}
                      style={{ flex: 1, padding: '8px', background: DS.red + '10', color: DS.red, border: `1px solid ${DS.red}20`, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Elimina</button>
                    <button onClick={() => setCtxMenu(null)}
                      style={{ padding: '8px 12px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Chiudi</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* RIGHT: Properties */}
        <div style={{ width: 300, background: DS.white, borderLeft: `1.5px solid ${DS.border}`, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
          {/* Lavorazione info */}
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 6 }}>Info lavorazione</div>
            <input placeholder="Codice *" value={editing.codice} onChange={e => setEditing(prev => prev ? { ...prev, codice: e.target.value } : null)}
              style={{ width: '100%', padding: '8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 13, fontFamily: M, fontWeight: 700, marginBottom: 4, boxSizing: 'border-box' }} />
            <input placeholder="Nome (es: Scasso martellina)" value={editing.nome} onChange={e => setEditing(prev => prev ? { ...prev, nome: e.target.value } : null)}
              style={{ width: '100%', padding: '8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 12, marginBottom: 4, boxSizing: 'border-box' }} />
            <textarea placeholder="Descrizione dettagliata..." value={editing.descrizione} onChange={e => setEditing(prev => prev ? { ...prev, descrizione: e.target.value } : null)} rows={2}
              style={{ width: '100%', padding: '8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 11, boxSizing: 'border-box', resize: 'vertical', marginBottom: 4 }} />
            <select value={editing.categoria} onChange={e => setEditing(prev => prev ? { ...prev, categoria: e.target.value } : null)}
              style={{ width: '100%', padding: '8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 12, marginBottom: 4, boxSizing: 'border-box' }}>
              {CATEGORIE.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
              {(['cnc', 'cantiere', 'entrambi'] as const).map(m => (
                <button key={m} onClick={() => setEditing(prev => prev ? { ...prev, modalita: m } : null)}
                  style={{ padding: '6px', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer', textTransform: 'uppercase',
                    background: editing.modalita === m ? (m === 'cnc' ? DS.blue + '15' : m === 'cantiere' ? DS.amber + '15' : DS.green + '15') : '#f5f5f5',
                    color: editing.modalita === m ? (m === 'cnc' ? DS.blue : m === 'cantiere' ? DS.amber : DS.green) : '#999',
                    border: `1.5px solid ${editing.modalita === m ? (m === 'cnc' ? DS.blue : m === 'cantiere' ? DS.amber : DS.green) + '30' : '#eee'}`,
                  }}>{m}</button>
              ))}
            </div>
          </div>

          {/* Accessorio link */}
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Accessorio collegato</div>
            <select value={editing.accessorio_id || ''} onChange={e => setEditing(prev => prev ? { ...prev, accessorio_id: e.target.value || undefined } : null)}
              style={{ width: '100%', padding: '8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 11, boxSizing: 'border-box' }}>
              <option value="">— Accessorio fittizio —</option>
              {accessori.map(a => <option key={a.id} value={a.id}>{a.codice} — {a.nome}</option>)}
            </select>
          </div>

          {/* Posizionamento */}
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Posizionamento sul profilo</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 4 }}>
              <div>
                <label style={{ fontSize: 9, color: '#999' }}>Tipo</label>
                <select value={editing.posizione_tipo} onChange={e => setEditing(prev => prev ? { ...prev, posizione_tipo: e.target.value } : null)}
                  style={{ width: '100%', padding: '6px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, boxSizing: 'border-box' }}>
                  <option value="fissa">Fissa</option>
                  <option value="ripetuta">Ripetuta ogni X mm</option>
                  <option value="calcolata">Calcolata da dimensione</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 9, color: '#999' }}>Da</label>
                <select value={editing.posizione_da} onChange={e => setEditing(prev => prev ? { ...prev, posizione_da: e.target.value } : null)}
                  style={{ width: '100%', padding: '6px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, boxSizing: 'border-box' }}>
                  <option value="basso">Dal basso</option>
                  <option value="alto">Dall'alto</option>
                  <option value="centro">Dal centro</option>
                  <option value="bordo_sx">Bordo sinistro</option>
                  <option value="bordo_dx">Bordo destro</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              <div>
                <label style={{ fontSize: 9, color: '#999' }}>Distanza mm</label>
                <input type="number" value={editing.distanza_mm || ''} onChange={e => setEditing(prev => prev ? { ...prev, distanza_mm: parseFloat(e.target.value) || 0 } : null)}
                  style={{ width: '100%', padding: '6px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 12, fontFamily: M, boxSizing: 'border-box' }} />
              </div>
              {editing.posizione_tipo === 'ripetuta' && (
                <div>
                  <label style={{ fontSize: 9, color: '#999' }}>Ripeti ogni mm</label>
                  <input type="number" value={editing.ripeti_ogni_mm || ''} onChange={e => setEditing(prev => prev ? { ...prev, ripeti_ogni_mm: parseFloat(e.target.value) || 0 } : null)}
                    style={{ width: '100%', padding: '6px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 12, fontFamily: M, boxSizing: 'border-box' }} />
                </div>
              )}
            </div>
          </div>

          {/* CNC params — only if CNC or entrambi */}
          {(editing.modalita === 'cnc' || editing.modalita === 'entrambi') && (
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Parametri CNC</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
              <div>
                <label style={{ fontSize: 9, color: '#999' }}>Utensile</label>
                <input placeholder="es: P6" value={editing.utensile || ''} onChange={e => setEditing(prev => prev ? { ...prev, utensile: e.target.value } : null)}
                  style={{ width: '100%', padding: '6px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: '#999' }}>RPM</label>
                <input type="number" value={editing.velocita_rpm || ''} onChange={e => setEditing(prev => prev ? { ...prev, velocita_rpm: parseInt(e.target.value) || 0 } : null)}
                  style={{ width: '100%', padding: '6px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, fontFamily: M, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 9, color: '#999' }}>Avanz.</label>
                <input type="number" value={editing.avanzamento || ''} onChange={e => setEditing(prev => prev ? { ...prev, avanzamento: parseInt(e.target.value) || 0 } : null)}
                  style={{ width: '100%', padding: '6px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, fontFamily: M, boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
          )}

          {/* CANTIERE — istruzioni per operaio */}
          {(editing.modalita === 'cantiere' || editing.modalita === 'entrambi') && (
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: DS.amber, textTransform: 'uppercase', marginBottom: 6 }}>Istruzioni cantiere</div>
            
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 9, color: '#999', fontWeight: 600 }}>PERCHE — Motivo della lavorazione</label>
              <input placeholder="es: Per passaggio tubo condizionatore ø60" value={editing.motivo || ''} 
                onChange={e => setEditing(prev => prev ? { ...prev, motivo: e.target.value } : null)}
                style={{ width: '100%', padding: '8px', border: `1.5px solid ${DS.amber}30`, borderRadius: 6, fontSize: 12, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 9, color: '#999', fontWeight: 600 }}>ATTREZZI necessari</label>
              {(editing.attrezzi || []).map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 2 }}>
                  <input value={a} onChange={e => { const arr = [...(editing.attrezzi || [])]; arr[i] = e.target.value; setEditing(prev => prev ? { ...prev, attrezzi: arr } : null); }}
                    style={{ flex: 1, padding: '5px 8px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, boxSizing: 'border-box' }} />
                  <button onClick={() => { const arr = (editing.attrezzi || []).filter((_, j) => j !== i); setEditing(prev => prev ? { ...prev, attrezzi: arr } : null); }}
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 12 }}>&times;</button>
                </div>
              ))}
              <button onClick={() => setEditing(prev => prev ? { ...prev, attrezzi: [...(prev.attrezzi || []), ''] } : null)}
                style={{ fontSize: 10, color: DS.teal, background: 'none', border: `1px dashed ${DS.teal}30`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', width: '100%' }}>+ Aggiungi attrezzo</button>
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 9, color: '#999', fontWeight: 600 }}>COME — Passi da seguire (in ordine)</label>
              {(editing.passi || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 2, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: DS.teal, fontWeight: 700, width: 18, textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
                  <input value={p} onChange={e => { const arr = [...(editing.passi || [])]; arr[i] = e.target.value; setEditing(prev => prev ? { ...prev, passi: arr } : null); }}
                    style={{ flex: 1, padding: '5px 8px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, boxSizing: 'border-box' }} />
                  <button onClick={() => { const arr = (editing.passi || []).filter((_, j) => j !== i); setEditing(prev => prev ? { ...prev, passi: arr } : null); }}
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 12 }}>&times;</button>
                </div>
              ))}
              <button onClick={() => setEditing(prev => prev ? { ...prev, passi: [...(prev.passi || []), ''] } : null)}
                style={{ fontSize: 10, color: DS.teal, background: 'none', border: `1px dashed ${DS.teal}30`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', width: '100%' }}>+ Aggiungi passo</button>
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 9, color: '#999', fontWeight: 600 }}>Avvertenze / Sicurezza</label>
              <textarea placeholder="es: Attenzione a non bucare la guarnizione interna" value={editing.avvertenze || ''} rows={2}
                onChange={e => setEditing(prev => prev ? { ...prev, avvertenze: e.target.value } : null)}
                style={{ width: '100%', padding: '6px 8px', border: `1.5px solid ${DS.red}20`, borderRadius: 6, fontSize: 11, boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div>
                <label style={{ fontSize: 9, color: '#999' }}>Tempo stimato</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input type="number" value={editing.tempo_stimato_min || ''} onChange={e => setEditing(prev => prev ? { ...prev, tempo_stimato_min: parseInt(e.target.value) || 0 } : null)}
                    style={{ width: '100%', padding: '6px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 12, fontFamily: M, boxSizing: 'border-box' }} />
                  <span style={{ fontSize: 9, color: '#999' }}>min</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 9, color: '#999' }}>Difficolta</label>
                <select value={editing.difficolta || 'media'} onChange={e => setEditing(prev => prev ? { ...prev, difficolta: e.target.value } : null)}
                  style={{ width: '100%', padding: '6px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, boxSizing: 'border-box' }}>
                  <option value="facile">Facile</option>
                  <option value="media">Media</option>
                  <option value="difficile">Difficile</option>
                </select>
              </div>
            </div>
          </div>
          )}

          {/* Operations list */}
          <div style={{ flex: 1, padding: '10px 14px', overflow: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Operazioni ({editing.operazioni.length})</div>
            {editing.operazioni.map(op => {
              const info = OP_TYPES.find(t => t.tipo === op.tipo);
              const sel = selectedOp === op.id;
              return (
                <div key={op.id} onClick={() => setSelectedOp(op.id)}
                  style={{ padding: '8px 10px', borderRadius: 6, marginBottom: 3, border: `1.5px solid ${sel ? (info?.color || DS.teal) + '50' : DS.border}`, background: sel ? (info?.color || DS.teal) + '05' : DS.white, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: sel ? 6 : 0 }}>
                    <span style={{ fontSize: 14, color: info?.color }}>{info?.icona}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: DS.ink, flex: 1 }}>{info?.nome}</span>
                    <span style={{ fontSize: 10, fontFamily: M, color: '#999' }}>
                      {op.diametro ? `ø${op.diametro}` : ''}{op.larghezza ? `${op.larghezza}x${op.altezza}` : ''}
                    </span>
                    <button onClick={e => { e.stopPropagation(); removeOp(op.id); }}
                      style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 12 }}
                      onMouseOver={e => (e.currentTarget.style.color = DS.red)} onMouseOut={e => (e.currentTarget.style.color = '#ccc')}>&times;</button>
                  </div>
                  {sel && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                      <div>
                        <label style={{ fontSize: 8, color: '#999' }}>X mm</label>
                        <input type="number" value={op.x} onChange={e => updateOp(op.id, { x: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '4px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, fontFamily: M, boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 8, color: '#999' }}>Y mm</label>
                        <input type="number" value={op.y} onChange={e => updateOp(op.id, { y: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '4px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, fontFamily: M, boxSizing: 'border-box' }} />
                      </div>
                      {(op.tipo === 'foro' || op.tipo === 'fresa_circ') && (
                        <div>
                          <label style={{ fontSize: 8, color: '#999' }}>ø mm</label>
                          <input type="number" value={op.diametro || ''} onChange={e => updateOp(op.id, { diametro: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '4px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, fontFamily: M, boxSizing: 'border-box' }} />
                        </div>
                      )}
                      {(op.tipo === 'fresa_rett' || op.tipo === 'scasso' || op.tipo === 'taglio' || op.tipo === 'clip') && (<>
                        <div>
                          <label style={{ fontSize: 8, color: '#999' }}>Larg mm</label>
                          <input type="number" value={op.larghezza || ''} onChange={e => updateOp(op.id, { larghezza: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '4px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, fontFamily: M, boxSizing: 'border-box' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 8, color: '#999' }}>Alt mm</label>
                          <input type="number" value={op.altezza || ''} onChange={e => updateOp(op.id, { altezza: parseFloat(e.target.value) || 0 })}
                            style={{ width: '100%', padding: '4px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, fontFamily: M, boxSizing: 'border-box' }} />
                        </div>
                      </>)}
                      <div>
                        <label style={{ fontSize: 8, color: '#999' }}>Prof mm</label>
                        <input type="number" value={op.profondita || ''} onChange={e => updateOp(op.id, { profondita: parseFloat(e.target.value) || 0 })}
                          style={{ width: '100%', padding: '4px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, fontFamily: M, boxSizing: 'border-box' }} />
                      </div>
                      {op.tipo === 'foro' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input type="checkbox" checked={op.passante || false} onChange={e => updateOp(op.id, { passante: e.target.checked })} />
                          <label style={{ fontSize: 9, color: '#666' }}>Passante</label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ padding: '16px 20px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        {onBack && <button onClick={onBack} style={{ background: DS.white, border: `1.5px solid ${DS.border}`, borderRadius: 8, cursor: 'pointer', color: DS.teal, padding: '6px 12px', fontSize: 13, fontWeight: 700 }}>&#8592;</button>}
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DS.ink }}>Libreria Lavorazioni</h2>
        <span style={{ fontSize: 14, color: '#999', fontFamily: M }}>{lavorazioni.length}</span>
        <div style={{ flex: 1 }} />
        <button onClick={createNew} style={{ padding: '10px 18px', border: 'none', borderRadius: 8, background: DS.teal, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 0 ${DS.dark}` }}>
          + Nuova lavorazione
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Caricamento...</div>
        : lavorazioni.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#ccc' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Nessuna lavorazione</div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>Crea la prima lavorazione per la libreria</div>
            <button onClick={createNew} style={{ padding: '12px 24px', border: 'none', borderRadius: 8, background: DS.teal, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              + Crea prima lavorazione
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
            {lavorazioni.map(l => (
              <div key={l.id} onClick={() => setEditing({ ...l, categoria: l.tipo || 'ferramenta', operazioni: l.operazioni || [] })}
                style={{ padding: 14, borderRadius: 10, border: `1.5px solid ${DS.border}`, background: DS.white, cursor: 'pointer' }}
                onMouseOver={e => (e.currentTarget.style.borderColor = DS.teal + '50')}
                onMouseOut={e => (e.currentTarget.style.borderColor = DS.border)}>
                <div style={{ height: 80, background: DS.light, borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {l.sezione_svg ? <div dangerouslySetInnerHTML={{ __html: l.sezione_svg }} style={{ maxWidth: '90%', maxHeight: '90%' }} /> :
                    <span style={{ color: '#ddd', fontSize: 10 }}>No preview</span>}
                </div>
                <div style={{ fontFamily: M, fontSize: 12, fontWeight: 700, color: DS.ink }}>{l.codice}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{l.nome}</div>
                <div style={{ fontSize: 10, color: DS.teal, marginTop: 2 }}>{l.categoria} — {(l.operazioni || []).length} operazioni</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
