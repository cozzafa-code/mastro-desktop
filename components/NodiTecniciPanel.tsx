// @ts-nocheck
'use client';
// ═══════════════════════════════════════════════════════════
// MASTRO — NodiTecniciPanel v1 (S21)
// Editor visuale nodi tecnici: assembla profili in sezione
// Zoom/Pan canvas + carica profili + ruota/specchia/quota
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const DS = {
  teal: '#28A0A0', dark: '#156060', ink: '#0D1F1F',
  light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF',
  red: '#DC4444', green: '#1A9E73', amber: '#D08008', blue: '#3B7FE0',
};
const M = "'JetBrains Mono', monospace";

// SVG Icons
const Ic = {
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  rotate: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>,
  flip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="7 2 3 6 7 10"/><path d="M3 6h11a4 4 0 0 1 0 8h-1"/></svg>,
  ruler: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l20 20"/><path d="M5 2v3"/><path d="M2 5h3"/><path d="M19 22v-3"/><path d="M22 19h-3"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  save: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>,
  move: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg>,
  back: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
};

interface NodoLayer {
  id: string;
  profiloId: string | null;
  codice: string;
  svg: string;
  x: number;
  y: number;
  rotation: number;   // degrees
  flipH: boolean;
  flipV: boolean;
  color: string;
  label: string;
  visible: boolean;
  groupId: string | null; // profiles in same group move together
}

interface NodoTecnico {
  id?: string;
  codice: string;
  nome: string;
  fornitore: string;
  serie: string;
  tipo_nodo: string;
  layers: NodoLayer[];
}

const NODO_TIPI = ['orizzontale_alto', 'orizzontale_basso', 'verticale_cerniera', 'verticale_chiusura', 'verticale_montante', 'soglia', 'davanzale', 'cassonetto', 'controtelaio'];
const LAYER_COLORS = ['#0D1F1F', '#28A0A0', '#DC4444', '#3B7FE0', '#D08008', '#1A9E73', '#7C5FBF', '#E06B3B'];
const GROUP_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD', '#F0E68C'];

export default function NodiTecniciPanel({ onBack, fornitore: initFornitore, serie: initSerie }: { onBack?: () => void; fornitore?: string; serie?: string }) {
  const [nodi, setNodi] = useState<any[]>([]);
  const [profili, setProfili] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNodo, setEditingNodo] = useState<NodoTecnico | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);

  // Canvas state
  const [zoom, setZoom] = useState(3);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [dragging, setDragging] = useState<'canvas' | string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, ox: 0, oy: 0 });
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'quota' | 'link'>('select');
  const svgRef = useRef<SVGSVGElement>(null);

  // Quote state — quotes store layer references + offsets so they follow profile movement
  const [quoteMode, setQuoteMode] = useState(false);
  const [quotes, setQuotes] = useState<{ 
    layerId1: string; offX1: number; offY1: number;
    layerId2: string; offX2: number; offY2: number;
  }[]>([]);
  const [quotePt1, setQuotePt1] = useState<{ x: number; y: number; layerId: string; offX: number; offY: number } | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<number | null>(null);
  
  // Move dialog state
  const [moveDialog, setMoveDialog] = useState<{ layerId: string; dx: string } | null>(null);

  // Resolve quote to world coordinates (follows layer movement)
  const resolveQuote = (q: typeof quotes[0]) => {
    if (!editingNodo) return { x1: 0, y1: 0, x2: 0, y2: 0, dist: 0 };
    const l1 = editingNodo.layers.find(l => l.id === q.layerId1);
    const l2 = editingNodo.layers.find(l => l.id === q.layerId2);
    const x1 = (l1?.x || 0) + q.offX1;
    const y1 = (l1?.y || 0) + q.offY1;
    const x2 = (l2?.x || 0) + q.offX2;
    const y2 = (l2?.y || 0) + q.offY2;
    return { x1, y1, x2, y2, dist: Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) };
  };

  useEffect(() => {
    (async () => {
      const [{ data: nodiData }, { data: profData }, { data: vetriData }, { data: pannData }] = await Promise.all([
        supabase.from('nodi_tecnici').select('*').order('serie').order('tipo_nodo'),
        supabase.from('catalogo_profili').select('id,codice,fornitore,serie,tipo,sezione_svg').not('sezione_svg', 'is', null),
        supabase.from('catalogo_vetri').select('id,codice,composizione,fornitore,sezione_svg,ug,spessore').not('sezione_svg', 'is', null),
        supabase.from('catalogo_pannelli').select('id,codice,nome,fornitore,sezione_svg,up,spessore').not('sezione_svg', 'is', null),
      ]);
      setNodi(nodiData || []);
      // Merge all into profili with a _source tag
      const all = [
        ...(profData || []).map(p => ({ ...p, _source: 'profilo' })),
        ...(vetriData || []).map(v => ({ ...v, tipo: 'vetro', serie: 'Vetri', _source: 'vetro' })),
        ...(pannData || []).map(p => ({ ...p, tipo: 'pannello', serie: 'Pannelli', _source: 'pannello' })),
      ];
      setProfili(all);
      setLoading(false);
    })();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!editingNodo) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Delete selected quote
        if (selectedQuote !== null) {
          setQuotes(prev => prev.filter((_, j) => j !== selectedQuote));
          setSelectedQuote(null);
          e.preventDefault();
        }
      }
      if (e.key === 'Escape') {
        setSelectedQuote(null);
        setSelectedLayer(null);
        setQuotePt1(null);
        setContextMenu(null);
        setMoveDialog(null);
        if (tool !== 'select') setTool('select');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editingNodo, selectedQuote, tool]);

  // Print nodo
  const printNodo = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Nodo ${editingNodo?.codice || ''}</title><style>
      @page { size: A4 landscape; margin: 10mm; }
      body { margin: 0; display: flex; flex-direction: column; align-items: center; font-family: 'Inter', sans-serif; }
      h1 { font-size: 16px; margin: 10px 0 5px; }
      .info { font-size: 11px; color: #666; margin-bottom: 10px; }
      svg { max-width: 100%; max-height: 80vh; border: 1px solid #eee; }
      .quotes { margin-top: 10px; font-size: 12px; }
      .quotes td { padding: 2px 10px; }
      @media print { button { display: none; } }
    </style></head><body>
      <h1>Nodo: ${editingNodo?.codice || 'Senza nome'}</h1>
      <div class="info">${editingNodo?.nome || ''} — ${editingNodo?.serie || ''} — ${editingNodo?.tipo_nodo?.replace(/_/g, ' ') || ''}</div>
      <div class="info">${editingNodo?.layers.length || 0} profili</div>
      ${svgData}
      ${quotes.length > 0 ? `<table class="quotes"><tr><th>Quota</th><th>mm</th></tr>${quotes.map((q, i) => {
        const r = resolveQuote(q);
        return `<tr><td>#${i + 1}</td><td><b>${r.dist.toFixed(1)}</b></td></tr>`;
      }).join('')}</table>` : ''}
      <button onclick="window.print()" style="margin:20px;padding:10px 30px;font-size:14px;cursor:pointer">Stampa</button>
    </body></html>`);
    win.document.close();
  };

  const createNewNodo = () => {
    setEditingNodo({
      codice: '', nome: '', fornitore: initFornitore || '', serie: initSerie || '', tipo_nodo: 'orizzontale_alto', layers: [],
    });
    setZoom(3); setPanX(0); setPanY(0);
    setQuotes([]); setQuotePt1(null);
    setSelectedLayer(null);
  };

  const addLayerFromProfile = (profilo: any) => {
    if (!editingNodo) return;
    const newLayer: NodoLayer = {
      id: Date.now().toString(),
      profiloId: profilo.id,
      codice: profilo.codice,
      svg: profilo.sezione_svg,
      x: 0, y: 0,
      rotation: 0,
      flipH: false, flipV: false,
      color: LAYER_COLORS[editingNodo.layers.length % LAYER_COLORS.length],
      label: profilo.codice + ' (' + profilo.tipo + ')',
      visible: true,
      groupId: null,
    };
    setEditingNodo(prev => prev ? { ...prev, layers: [...prev.layers, newLayer] } : null);
    setSelectedLayer(newLayer.id);
    setShowCatalog(false);
  };

  const updateLayer = (layerId: string, updates: Partial<NodoLayer>) => {
    setEditingNodo(prev => {
      if (!prev) return null;
      return { ...prev, layers: prev.layers.map(l => l.id === layerId ? { ...l, ...updates } : l) };
    });
  };

  const deleteLayer = (layerId: string) => {
    setEditingNodo(prev => {
      if (!prev) return null;
      return { ...prev, layers: prev.layers.filter(l => l.id !== layerId) };
    });
    if (selectedLayer === layerId) setSelectedLayer(null);
  };

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; layerId: string } | null>(null);

  // Canvas mouse handlers
  const screenToCanvas = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left - rect.width / 2 - panX) / zoom,
      y: (clientY - rect.top - rect.height / 2 - panY) / zoom,
    };
  };

  // ── Snap points extracted from SVG content — WITH Y-flip correction ──
  const getSnapPoints = useCallback(() => {
    if (!editingNodo) return [];
    const points: { x: number; y: number; layerId: string }[] = [];
    
    editingNodo.layers.filter(l => l.visible).forEach(layer => {
      if (!layer.svg) return;
      const svg = layer.svg;
      
      // Extract the Y-flip translate value directly from the SVG inner transform
      // The SVG has: <g transform="scale(1,-1) translate(0, VALUE)">
      // VALUE = -(minY+maxY) from the DXF parser
      let yFlipOffset = 0;
      const translateMatch = svg.match(/translate\(0[,\s]+([-\d.]+)\)/);
      if (translateMatch) {
        // The translate value is -(minY+maxY), so yFlipOffset = -translateValue
        yFlipOffset = -parseFloat(translateMatch[1]);
      } else {
        // Fallback: estimate from viewBox
        const vbMatch = svg.match(/viewBox="([\d.\s-]+)"/);
        if (vbMatch) {
          const vbParts = vbMatch[1].split(/\s+/).map(Number);
          yFlipOffset = vbParts[1] + vbParts[3]; // minY + height ≈ minY + maxY + 2*padding
        }
      }
      
      // Helper: apply Y-flip then layer transform
      const addPoint = (rawX: number, rawY: number) => {
        // Apply the SVG inner transform: scale(1,-1) translate(0, -(minY+maxY))
        // Result: (rawX, -rawY + yFlipOffset)
        const svgX = rawX;
        const svgY = -rawY + yFlipOffset;
        // Then apply layer transform (position, rotation, flip)
        const tp = transformPoint(svgX, svgY, layer);
        points.push({ ...tp, layerId: layer.id });
      };
      
      // Extract points from polyline/polygon points="x,y x,y ..."
      const pointsRegex = /points="([^"]+)"/g;
      let match;
      while ((match = pointsRegex.exec(svg)) !== null) {
        const pairs = match[1].split(/\s+/).map(pair => {
          const [x, y] = pair.split(',').map(Number);
          return { x, y };
        }).filter(p => isFinite(p.x) && isFinite(p.y));
        
        pairs.forEach(p => addPoint(p.x, p.y));
        // Midpoints
        for (let k = 0; k < pairs.length - 1; k++) {
          addPoint((pairs[k].x + pairs[k + 1].x) / 2, (pairs[k].y + pairs[k + 1].y) / 2);
        }
      }
      
      // Extract M/L coordinates from path d="..."
      const pathRegex = /d="([^"]+)"/g;
      while ((match = pathRegex.exec(svg)) !== null) {
        const d = match[1];
        const coordRegex = /[ML]\s*([\d.-]+)[,\s]([\d.-]+)/g;
        let cm;
        while ((cm = coordRegex.exec(d)) !== null) {
          addPoint(parseFloat(cm[1]), parseFloat(cm[2]));
        }
        // Arc endpoints
        const arcRegex = /A[\d.,\s]+\s+([\d.-]+)[,\s]([\d.-]+)/g;
        while ((cm = arcRegex.exec(d)) !== null) {
          addPoint(parseFloat(cm[1]), parseFloat(cm[2]));
        }
      }
      
      // Circle centers
      const circleRegex = /cx="([\d.-]+)"\s*cy="([\d.-]+)"/g;
      while ((match = circleRegex.exec(svg)) !== null) {
        addPoint(parseFloat(match[1]), parseFloat(match[2]));
      }
    });
    return points;
  }, [editingNodo]);

  // Transform point by layer position, rotation, flip
  const transformPoint = (x: number, y: number, layer: NodoLayer) => {
    const rad = (layer.rotation * Math.PI) / 180;
    let px = layer.flipH ? -x : x;
    let py = layer.flipV ? -y : y;
    const rx = px * Math.cos(rad) - py * Math.sin(rad);
    const ry = px * Math.sin(rad) + py * Math.cos(rad);
    return { x: rx + layer.x, y: ry + layer.y };
  };

  // Find nearest snap point — includes vertices AND nearest point on line segments
  const findNearestSnap = (cx: number, cy: number, maxDist: number = 25) => {
    const snaps = getSnapPoints();
    let best: { x: number; y: number; layerId: string } | null = null;
    let bestDist = maxDist / zoom;
    
    // 1. Check vertex snap points
    snaps.forEach(s => {
      const d = Math.sqrt((s.x - cx) ** 2 + (s.y - cy) ** 2);
      if (d < bestDist) { bestDist = d; best = { x: s.x, y: s.y, layerId: s.layerId }; }
    });
    
    // 2. Check nearest point on line segments between consecutive vertices
    // Group snap points by layer, then check segments
    if (!editingNodo) return best;
    editingNodo.layers.filter(l => l.visible).forEach(layer => {
      if (!layer.svg) return;
      // Extract polyline/polygon points sequences
      const ptRegex = /points="([^"]+)"/g;
      let m;
      while ((m = ptRegex.exec(layer.svg)) !== null) {
        const pts = m[1].split(/\s+/).map(pair => {
          const [x, y] = pair.split(',').map(Number);
          return isFinite(x) && isFinite(y) ? transformPoint(x, y, layer) : null;
        }).filter(Boolean) as { x: number; y: number }[];
        
        for (let i = 0; i < pts.length - 1; i++) {
          const proj = projectOnSegment(cx, cy, pts[i], pts[i + 1]);
          if (proj) {
            const d = Math.sqrt((proj.x - cx) ** 2 + (proj.y - cy) ** 2);
            if (d < bestDist) { bestDist = d; best = proj; }
          }
        }
      }
    });
    
    return best;
  };
  
  // Project point onto line segment, return closest point on segment
  const projectOnSegment = (px: number, py: number, a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = b.x - a.x, dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 0.0001) return null;
    let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return { x: a.x + t * dx, y: a.y + t * dy };
  };

  // Hover state for snap preview
  const [hoverPt, setHoverPt] = useState<{ x: number; y: number; layerId: string } | null>(null);

  const handleCanvasWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.3, Math.min(20, z * factor)));
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setContextMenu(null);
    if (e.button === 2) return;
    if (e.button === 0 && tool === 'quota') {
      const raw = screenToCanvas(e.clientX, e.clientY);
      const snapped = findNearestSnap(raw.x, raw.y);
      const pt = snapped || raw;
      
      // Find which layer this point belongs to (nearest layer center)
      let bestLayerId = '__canvas__';
      if (snapped) {
        bestLayerId = snapped.layerId;
      } else if (editingNodo) {
        // Fallback: find nearest layer by center distance
        let bestD = Infinity;
        editingNodo.layers.filter(l => l.visible).forEach(l => {
          const d = Math.sqrt((raw.x - l.x) ** 2 + (raw.y - l.y) ** 2);
          if (d < bestD) { bestD = d; bestLayerId = l.id; }
        });
      }
      
      const layer = editingNodo?.layers.find(l => l.id === bestLayerId);
      const offX = pt.x - (layer?.x || 0);
      const offY = pt.y - (layer?.y || 0);
      
      if (!quotePt1) {
        setQuotePt1({ x: pt.x, y: pt.y, layerId: bestLayerId, offX, offY });
      } else {
        setQuotes(prev => [...prev, { 
          layerId1: quotePt1.layerId, offX1: quotePt1.offX, offY1: quotePt1.offY,
          layerId2: bestLayerId, offX2: offX, offY2: offY,
        }]);
        setQuotePt1(null);
      }
      return;
    }
    if (e.button === 1 || e.button === 0) {
      setSelectedLayer(null);
      setDragging('canvas');
      setDragStart({ x: e.clientX, y: e.clientY, ox: panX, oy: panY });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (dragging === 'canvas') {
      setPanX(dragStart.ox + e.clientX - dragStart.x);
      setPanY(dragStart.oy + e.clientY - dragStart.y);
    } else if (dragging && dragging !== 'canvas' && editingNodo) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      // Move this layer
      const dragLayer = editingNodo.layers.find(l => l.id === dragging);
      if (dragLayer) {
        const newX = dragStart.ox + dx;
        const newY = dragStart.oy + dy;
        const deltaX = newX - dragLayer.x;
        const deltaY = newY - dragLayer.y;
        
        if (dragLayer.groupId) {
          // Move all layers in the same group
          setEditingNodo(prev => {
            if (!prev) return null;
            return { ...prev, layers: prev.layers.map(l => {
              if (l.id === dragging) return { ...l, x: newX, y: newY };
              if (l.groupId === dragLayer.groupId) return { ...l, x: l.x + deltaX, y: l.y + deltaY };
              return l;
            })};
          });
        } else {
          updateLayer(dragging, { x: newX, y: newY });
        }
      }
    }
    // Update hover snap point for quota tool
    if (tool === 'quota') {
      const raw = screenToCanvas(e.clientX, e.clientY);
      const snap = findNearestSnap(raw.x, raw.y);
      setHoverPt(snap);
    }
  };

  const handleCanvasMouseUp = () => setDragging(null);

  const handleLayerMouseDown = (e: React.MouseEvent, layer: NodoLayer) => {
    e.stopPropagation();
    setContextMenu(null);
    if (e.button === 2) return;
    
    if (tool === 'link') {
      // Link tool: toggle this layer in/out of selected layer's group
      if (selectedLayer && selectedLayer !== layer.id) {
        const selLayer = editingNodo?.layers.find(l => l.id === selectedLayer);
        if (selLayer) {
          const groupId = selLayer.groupId || 'grp_' + Date.now();
          // Assign both to same group
          setEditingNodo(prev => {
            if (!prev) return null;
            return { ...prev, layers: prev.layers.map(l => {
              if (l.id === selectedLayer || l.id === layer.id) return { ...l, groupId };
              return l;
            })};
          });
        }
      } else {
        setSelectedLayer(layer.id);
      }
      return;
    }
    
    if (tool === 'quota') return;
    setSelectedLayer(layer.id);
    setDragging(layer.id);
    setDragStart({ x: e.clientX, y: e.clientY, ox: layer.x, oy: layer.y });
  };

  const handleLayerContextMenu = (e: React.MouseEvent, layer: NodoLayer) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedLayer(layer.id);
    setContextMenu({ x: e.clientX, y: e.clientY, layerId: layer.id });
  };

  const saveNodo = async () => {
    if (!editingNodo || !editingNodo.codice) { alert('Inserisci almeno il codice del nodo.'); return; }
    const saveData = {
      codice: editingNodo.codice,
      nome: editingNodo.nome,
      fornitore: editingNodo.fornitore || initFornitore || '',
      serie: editingNodo.serie,
      tipo_nodo: editingNodo.tipo_nodo,
      profili: editingNodo.layers.map(l => ({
        ruolo: l.label, codice: l.codice, profiloId: l.profiloId,
        x: l.x, y: l.y, rotation: l.rotation, flipH: l.flipH, flipV: l.flipV,
      })),
      // Generate combined SVG for preview
      sezione_svg: generateCombinedSVG(),
    };

    try {
      if (editingNodo.id) {
        await supabase.from('nodi_tecnici').update(saveData).eq('id', editingNodo.id);
      } else {
        const { data } = await supabase.from('nodi_tecnici').insert(saveData).select().single();
        if (data) setEditingNodo(prev => prev ? { ...prev, id: data.id } : null);
      }
      // Refresh list
      const { data } = await supabase.from('nodi_tecnici').select('*').order('serie').order('tipo_nodo');
      setNodi(data || []);
      alert('Nodo salvato!');
    } catch (e: any) { alert('Errore: ' + e.message); }
  };

  const generateCombinedSVG = () => {
    if (!editingNodo) return '';
    const parts = editingNodo.layers.filter(l => l.visible).map(l => {
      const transform = `translate(${l.x},${l.y}) rotate(${l.rotation}) scale(${l.flipH ? -1 : 1},${l.flipV ? -1 : 1})`;
      return `<g transform="${transform}">${l.svg.replace(/<\/?svg[^>]*>/g, '')}</g>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200">${parts}</svg>`;
  };

  // ── EDITOR VIEW ──
  if (editingNodo) {
    const sel = editingNodo.layers.find(l => l.id === selectedLayer);
    return (
      <div style={{ height: '100%', display: 'flex', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
        {/* LEFT: Vertical toolbar */}
        <div style={{ width: 48, background: DS.ink, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 2, flexShrink: 0 }}>
          <VToolBtn active={false} onClick={() => setEditingNodo(null)} icon={Ic.back} tip="Lista" />
          <div style={{ width: 28, height: 1, background: '#333', margin: '4px 0' }} />
          <VToolBtn active={false} onClick={() => setShowCatalog(true)} icon={Ic.plus} tip="Aggiungi profilo" color={DS.teal} />
          <div style={{ width: 28, height: 1, background: '#333', margin: '4px 0' }} />
          <VToolBtn active={tool === 'select'} onClick={() => setTool('select')} icon={Ic.move} tip="Sposta (S)" />
          <VToolBtn active={tool === 'quota'} onClick={() => { setTool('quota'); setQuotePt1(null); }} icon={Ic.ruler} tip="Quota (Q)" />
          <VToolBtn active={tool === 'link'} onClick={() => setTool('link')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>} tip="Lega profili (L)" />
          <div style={{ flex: 1 }} />
          <VToolBtn active={false} onClick={() => { setZoom(3); setPanX(0); setPanY(0); }} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M12 3v18"/></svg>} tip="Reset vista" />
          <VToolBtn active={false} onClick={printNodo} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>} tip="Stampa nodo" />
          <VToolBtn active={false} onClick={saveNodo} icon={Ic.save} tip="Salva nodo" color={DS.green} />
        </div>

        {/* CENTER: Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F5F5F0', position: 'relative' }}>
          {/* Top info bar */}
          <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,.8)', borderBottom: `1px solid ${DS.border}`, display: 'flex', gap: 12, alignItems: 'center', fontSize: 11, flexShrink: 0 }}>
            <span style={{ fontFamily: M, fontWeight: 700, color: DS.ink }}>{editingNodo.codice || 'Nuovo nodo'}</span>
            <span style={{ color: '#999' }}>{editingNodo.layers.length} profili</span>
            <span style={{ color: '#999' }}>{quotes.length} quote</span>
            <div style={{ flex: 1 }} />
            <span style={{ fontFamily: M, fontSize: 10, color: '#999' }}>{Math.round(zoom * 100)}%</span>
            {tool === 'quota' && <span style={{ color: DS.red, fontWeight: 700 }}>QUOTA: {quotePt1 ? 'clicca secondo punto' : 'clicca primo punto'}</span>}
            {tool === 'link' && <span style={{ color: DS.blue, fontWeight: 700 }}>LEGA: seleziona primo profilo, poi clicca il secondo per legare</span>}
          </div>

          {/* Canvas SVG */}
          <svg ref={svgRef}
            style={{ flex: 1, cursor: dragging ? 'grabbing' : tool === 'quota' ? 'crosshair' : 'grab' }}
            onWheel={handleCanvasWheel}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onContextMenu={e => { if (!selectedLayer) e.preventDefault(); }}>
            {/* Grid */}
            <defs>
              <pattern id="nodoGrid" width={10 * zoom} height={10 * zoom} patternUnits="userSpaceOnUse" x={panX % (10 * zoom)} y={panY % (10 * zoom)}>
                <line x1="0" y1="0" x2={10 * zoom} y2="0" stroke="#ddd" strokeWidth="0.5" />
                <line x1="0" y1="0" x2="0" y2={10 * zoom} stroke="#ddd" strokeWidth="0.5" />
              </pattern>
              <marker id="arrowS" markerWidth="6" markerHeight="4" refX="0" refY="2" orient="auto-start-reverse"><path d="M6,0 L0,2 L6,4" fill={DS.red} /></marker>
              <marker id="arrowE" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto"><path d="M0,0 L6,2 L0,4" fill={DS.red} /></marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#nodoGrid)" />

            {/* Origin */}
            <g transform={`translate(${panX + (svgRef.current?.clientWidth || 600) / 2}, ${panY + (svgRef.current?.clientHeight || 400) / 2})`}>
              <line x1={-15} y1="0" x2={15} y2="0" stroke="#bbb" strokeWidth="0.5" strokeDasharray="3,2" />
              <line x1="0" y1={-15} x2="0" y2={15} stroke="#bbb" strokeWidth="0.5" strokeDasharray="3,2" />
            </g>

            {/* World group */}
            <g transform={`translate(${panX + (svgRef.current?.clientWidth || 600) / 2}, ${panY + (svgRef.current?.clientHeight || 400) / 2}) scale(${zoom})`}>
              {/* Layers */}
              {editingNodo.layers.filter(l => l.visible).map(layer => (
                <g key={layer.id}
                  transform={`translate(${layer.x},${layer.y}) rotate(${layer.rotation}) scale(${layer.flipH ? -1 : 1},${layer.flipV ? -1 : 1})`}
                  onMouseDown={(e) => handleLayerMouseDown(e as any, layer)}
                  onContextMenu={(e) => handleLayerContextMenu(e as any, layer)}
                  style={{ cursor: tool === 'select' ? 'move' : 'crosshair' }}
                  opacity={selectedLayer === layer.id ? 1 : 0.65}>
                  <g dangerouslySetInnerHTML={{ __html: extractSVGContent(layer.svg) }} />
                  {selectedLayer === layer.id && (
                    <rect x="-60" y="-60" width="120" height="120" fill="none" stroke={DS.teal} strokeWidth={0.8 / zoom} strokeDasharray={`${3 / zoom},${2 / zoom}`} />
                  )}
                </g>
              ))}

              {/* Quotes */}
              {quotes.map((q, i) => {
                const { x1, y1, x2, y2, dist } = resolveQuote(q);
                const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
                const isSelected = selectedQuote === i;
                const col = isSelected ? DS.teal : DS.ink;
                const fs = 14 / zoom;
                return (
                  <g key={`q${i}`} onClick={(e) => { e.stopPropagation(); setSelectedQuote(isSelected ? null : i); }} style={{ cursor: 'pointer' }}>
                    {/* Extension lines at endpoints */}
                    <circle cx={q.x1} cy={q.y1} r={1.5 / zoom} fill={col} />
                    <circle cx={q.x2} cy={q.y2} r={1.5 / zoom} fill={col} />
                    {/* Main dimension line */}
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={(isSelected ? 1.2 : 0.7) / zoom} />
                    {/* Label background */}
                    <rect x={mx - 28 / zoom} y={my - fs * 0.9} width={56 / zoom} height={fs * 1.6} fill="rgba(255,255,255,.95)" rx={2 / zoom} stroke={col} strokeWidth={0.3 / zoom} />
                    {/* Dimension text */}
                    <text x={mx} y={my + fs * 0.3} textAnchor="middle" fontSize={fs} fill={col} fontFamily={M} fontWeight="800">{dist.toFixed(1)}</text>
                  </g>
                );
              })}
              {/* Snap point near cursor - BIG and visible */}
              {tool === 'quota' && hoverPt && (
                <g>
                  <circle cx={hoverPt.x} cy={hoverPt.y} r={5 / zoom} fill={DS.red} opacity={0.9} />
                  <circle cx={hoverPt.x} cy={hoverPt.y} r={10 / zoom} fill="none" stroke={DS.red} strokeWidth={1 / zoom} opacity={0.5} />
                  <line x1={hoverPt.x - 8 / zoom} y1={hoverPt.y} x2={hoverPt.x + 8 / zoom} y2={hoverPt.y} stroke={DS.red} strokeWidth={0.5 / zoom} />
                  <line x1={hoverPt.x} y1={hoverPt.y - 8 / zoom} x2={hoverPt.x} y2={hoverPt.y + 8 / zoom} stroke={DS.red} strokeWidth={0.5 / zoom} />
                </g>
              )}
              {/* First quota point - locked */}
              {quotePt1 && (
                <g>
                  <circle cx={quotePt1.x} cy={quotePt1.y} r={5 / zoom} fill={DS.green} opacity={0.9} />
                  <circle cx={quotePt1.x} cy={quotePt1.y} r={10 / zoom} fill="none" stroke={DS.green} strokeWidth={1 / zoom} opacity={0.5} />
                  {hoverPt && (
                    <line x1={quotePt1.x} y1={quotePt1.y} x2={hoverPt.x} y2={hoverPt.y} stroke={DS.red} strokeWidth={0.8 / zoom} strokeDasharray={`${4 / zoom},${3 / zoom}`} />
                  )}
                </g>
              )}
            </g>
          </svg>

          {/* Context Menu */}
          {contextMenu && (() => {
            const layer = editingNodo?.layers.find(l => l.id === contextMenu.layerId);
            if (!layer) return null;
            return (
              <div style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 100, background: DS.white, borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,.2)', border: `1px solid ${DS.border}`, padding: '4px 0', minWidth: 190 }}
                onMouseLeave={() => setContextMenu(null)}>
                <div style={{ padding: '6px 14px', fontSize: 10, fontWeight: 700, color: '#999', fontFamily: M, borderBottom: `1px solid ${DS.border}` }}>{layer.codice}</div>
                <CtxItem label="Ruota +90°" shortcut="R" onClick={() => { updateLayer(layer.id, { rotation: (layer.rotation + 90) % 360 }); setContextMenu(null); }} />
                <CtxItem label="Ruota -90°" onClick={() => { updateLayer(layer.id, { rotation: (layer.rotation - 90 + 360) % 360 }); setContextMenu(null); }} />
                <CtxItem label="Ruota +45°" onClick={() => { updateLayer(layer.id, { rotation: (layer.rotation + 45) % 360 }); setContextMenu(null); }} />
                <CtxItem label="Ruota +1°" onClick={() => { updateLayer(layer.id, { rotation: (layer.rotation + 1) % 360 }); setContextMenu(null); }} />
                <CtxItem label="Ruota -1°" onClick={() => { updateLayer(layer.id, { rotation: (layer.rotation - 1 + 360) % 360 }); setContextMenu(null); }} />
                <div style={{ height: 1, background: DS.border, margin: '3px 0' }} />
                <CtxItem label={`Specchia ↔${layer.flipH ? ' (on)' : ''}`} shortcut="H" onClick={() => { updateLayer(layer.id, { flipH: !layer.flipH }); setContextMenu(null); }} color={layer.flipH ? DS.teal : undefined} />
                <CtxItem label={`Specchia ↕${layer.flipV ? ' (on)' : ''}`} shortcut="V" onClick={() => { updateLayer(layer.id, { flipV: !layer.flipV }); setContextMenu(null); }} color={layer.flipV ? DS.teal : undefined} />
                <div style={{ height: 1, background: DS.border, margin: '3px 0' }} />
                <CtxItem label="In primo piano" onClick={() => { setEditingNodo(prev => { if (!prev) return null; const ls = [...prev.layers]; const idx = ls.findIndex(l => l.id === layer.id); if (idx >= 0) { const [m] = ls.splice(idx, 1); ls.push(m); } return { ...prev, layers: ls }; }); setContextMenu(null); }} />
                <CtxItem label="In fondo" onClick={() => { setEditingNodo(prev => { if (!prev) return null; const ls = [...prev.layers]; const idx = ls.findIndex(l => l.id === layer.id); if (idx >= 0) { const [m] = ls.splice(idx, 1); ls.unshift(m); } return { ...prev, layers: ls }; }); setContextMenu(null); }} />
                <CtxItem label="Reset posizione" onClick={() => { updateLayer(layer.id, { x: 0, y: 0, rotation: 0, flipH: false, flipV: false }); setContextMenu(null); }} />
                <CtxItem label="Sposta di..." shortcut="mm" onClick={() => { setMoveDialog({ layerId: layer.id, dx: '1' }); setContextMenu(null); }} color={DS.blue} />
                <CtxItem label={layer.groupId ? `Slega dal gruppo` : 'Lega con...'} shortcut="L" onClick={() => {
                  if (layer.groupId) {
                    // Unlink
                    updateLayer(layer.id, { groupId: null });
                  } else {
                    // Enter link mode
                    setSelectedLayer(layer.id);
                    setTool('link');
                  }
                  setContextMenu(null);
                }} color={layer.groupId ? DS.red : DS.blue} />
                <div style={{ height: 1, background: DS.border, margin: '3px 0' }} />
                <CtxItem label="Elimina" color={DS.red} onClick={() => { deleteLayer(layer.id); setContextMenu(null); }} />
              </div>
            );
          })()}
        </div>

        {/* RIGHT: Panels */}
        <div style={{ width: 260, background: DS.white, borderLeft: `1.5px solid ${DS.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Nodo info */}
          <div style={{ padding: '10px 12px', borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Info nodo</div>
            <input placeholder="Codice *" value={editingNodo.codice} onChange={e => setEditingNodo(prev => prev ? { ...prev, codice: e.target.value } : null)}
              style={{ width: '100%', padding: '6px 8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 12, fontWeight: 700, fontFamily: M, marginBottom: 3, outline: 'none', boxSizing: 'border-box' }} />
            <input placeholder="Nome" value={editingNodo.nome} onChange={e => setEditingNodo(prev => prev ? { ...prev, nome: e.target.value } : null)}
              style={{ width: '100%', padding: '6px 8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 11, marginBottom: 3, outline: 'none', boxSizing: 'border-box' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <input placeholder="Serie" value={editingNodo.serie} onChange={e => setEditingNodo(prev => prev ? { ...prev, serie: e.target.value } : null)}
                style={{ width: '100%', padding: '6px 8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 10, outline: 'none', boxSizing: 'border-box' }} />
              <select value={editingNodo.tipo_nodo} onChange={e => setEditingNodo(prev => prev ? { ...prev, tipo_nodo: e.target.value } : null)}
                style={{ width: '100%', padding: '6px 3px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 9, boxSizing: 'border-box' }}>
                {NODO_TIPI.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          {/* Layers */}
          <div style={{ flex: 1, overflow: 'auto', padding: '6px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>
              Profili ({editingNodo.layers.length})
            </div>
            {editingNodo.layers.length === 0 ? (
              <div style={{ padding: '20px 8px', textAlign: 'center', color: '#ccc', fontSize: 11 }}>
                Clicca + per aggiungere profili
              </div>
            ) : editingNodo.layers.map(layer => (
              <div key={layer.id} onClick={() => setSelectedLayer(layer.id)}
                style={{ padding: '6px 8px', borderRadius: 6, marginBottom: 2, border: `1.5px solid ${selectedLayer === layer.id ? DS.teal + '50' : 'transparent'}`, background: selectedLayer === layer.id ? DS.teal + '05' : 'transparent', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: layer.color, flexShrink: 0 }} />
                  {layer.groupId && <div style={{ width: 6, height: 6, borderRadius: '50%', background: GROUP_COLORS[Math.abs(String(layer.groupId).split('').reduce((a: number,c: string) => a + c.charCodeAt(0), 0)) % GROUP_COLORS.length], flexShrink: 0, border: '1px solid rgba(0,0,0,.15)' }} title="Legato" />}
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: M, color: DS.ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.codice}</span>
                  <button onClick={e => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: layer.visible ? DS.teal : '#ccc', padding: 0 }}>
                    {layer.visible ? '◉' : '○'}
                  </button>
                </div>
                {selectedLayer === layer.id && (
                  <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <MiniInput label="X" value={layer.x} onChange={v => updateLayer(layer.id, { x: v })} />
                    <MiniInput label="Y" value={layer.y} onChange={v => updateLayer(layer.id, { y: v })} />
                    <MiniInput label="°" value={layer.rotation} onChange={v => updateLayer(layer.id, { rotation: v })} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quotes */}
          {quotes.length > 0 && (
            <div style={{ padding: '6px 12px', borderTop: `1px solid ${DS.border}`, maxHeight: 120, overflow: 'auto' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Quote ({quotes.length})
                <button onClick={() => { setQuotes([]); setSelectedQuote(null); }} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 9 }}
                  onMouseOver={e => (e.currentTarget.style.color = DS.red)} onMouseOut={e => (e.currentTarget.style.color = '#ccc')}>Cancella tutte</button>
              </div>
              {quotes.map((q, i) => {
                const { dist } = resolveQuote(q);
                return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginBottom: 1, padding: '2px 4px', borderRadius: 4, background: selectedQuote === i ? DS.red + '10' : 'transparent', cursor: 'pointer' }}
                  onClick={() => setSelectedQuote(selectedQuote === i ? null : i)}>
                  <span style={{ color: DS.red, fontFamily: M, fontWeight: 700, fontSize: 12 }}>{dist.toFixed(1)}</span>
                  <span style={{ color: '#bbb', fontSize: 9 }}>mm</span>
                  <div style={{ flex: 1 }} />
                  <button onClick={e => { e.stopPropagation(); setQuotes(prev => prev.filter((_, j) => j !== i)); if (selectedQuote === i) setSelectedQuote(null); }}
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 11 }}>&times;</button>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Move Panel - NON-blocking, floating, with directional buttons */}
        {moveDialog && (() => {
          const layer = editingNodo?.layers.find(l => l.id === moveDialog.layerId);
          if (!layer) return null;
          return (
            <div style={{ position: 'absolute', top: 60, right: 272, zIndex: 100, background: DS.white, borderRadius: 12, padding: 14, boxShadow: '0 8px 30px rgba(0,0,0,.2)', border: `1.5px solid ${DS.teal}30`, width: 200, pointerEvents: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 12, color: DS.ink }}>{layer.codice}</span>
                <button onClick={() => setMoveDialog(null)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 16 }}>&times;</button>
              </div>
              <div style={{ fontSize: 9, color: '#999', marginBottom: 8, fontFamily: M }}>X={layer.x.toFixed(1)} Y={layer.y.toFixed(1)}</div>
              {/* Step input */}
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 9, fontWeight: 700, color: '#999' }}>Passo (mm)</label>
                <input type="number" value={moveDialog.dx} onChange={e => setMoveDialog(prev => prev ? { ...prev, dx: e.target.value } : null)}
                  style={{ width: '100%', padding: '6px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 14, fontFamily: M, fontWeight: 700, textAlign: 'center', boxSizing: 'border-box' }} />
              </div>
              {/* Directional pad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3, marginBottom: 8 }}>
                <div />
                <button onClick={() => updateLayer(layer.id, { y: layer.y - (parseFloat(moveDialog.dx) || 1) })}
                  style={{ padding: '8px', background: DS.ink, color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 700 }}>&#9650;</button>
                <div />
                <button onClick={() => updateLayer(layer.id, { x: layer.x - (parseFloat(moveDialog.dx) || 1) })}
                  style={{ padding: '8px', background: DS.ink, color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 700 }}>&#9664;</button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#999', fontFamily: M }}>{moveDialog.dx}mm</div>
                <button onClick={() => updateLayer(layer.id, { x: layer.x + (parseFloat(moveDialog.dx) || 1) })}
                  style={{ padding: '8px', background: DS.ink, color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 700 }}>&#9654;</button>
                <div />
                <button onClick={() => updateLayer(layer.id, { y: layer.y + (parseFloat(moveDialog.dx) || 1) })}
                  style={{ padding: '8px', background: DS.ink, color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer', fontWeight: 700 }}>&#9660;</button>
                <div />
              </div>
              {/* Direct position input */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <div>
                  <label style={{ fontSize: 8, color: '#999' }}>X</label>
                  <input type="number" value={Math.round(layer.x * 10) / 10} onChange={e => updateLayer(layer.id, { x: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '4px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, fontFamily: M, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 8, color: '#999' }}>Y</label>
                  <input type="number" value={Math.round(layer.y * 10) / 10} onChange={e => updateLayer(layer.id, { y: parseFloat(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '4px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, fontFamily: M, boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Profile catalog modal — with filters */}
        {showCatalog && <ProfileCatalogModal profili={profili} onSelect={addLayerFromProfile} onClose={() => setShowCatalog(false)} />}
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ padding: '16px 20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {onBack && <button onClick={onBack} style={{ background: DS.white, border: `1.5px solid ${DS.border}`, borderRadius: 8, cursor: 'pointer', color: DS.teal, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>{Ic.back}</button>}
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DS.ink }}>Nodi Tecnici</h2>
          <span style={{ fontSize: 14, color: '#999', fontFamily: M }}>{nodi.length} nodi</span>
          <div style={{ flex: 1 }} />
          <button onClick={createNewNodo} style={{ padding: '10px 18px', border: 'none', borderRadius: 8, background: DS.teal, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 2px 0 ${DS.dark}` }}>
            {Ic.plus} Nuovo nodo
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Caricamento...</div>
        : nodi.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#ccc' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Nessun nodo tecnico</div>
            <div style={{ fontSize: 12, marginBottom: 16 }}>Crea il primo nodo assemblando i profili dal catalogo</div>
            <button onClick={createNewNodo} style={{ padding: '12px 24px', border: 'none', borderRadius: 8, background: DS.teal, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 0 ${DS.dark}` }}>
              {Ic.plus} Crea primo nodo
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {[...nodi].sort((a,b) => {
              const aMatch = (a.fornitore === initFornitore && a.serie === initSerie) ? 0 : (a.serie === initSerie ? 1 : 2);
              const bMatch = (b.fornitore === initFornitore && b.serie === initSerie) ? 0 : (b.serie === initSerie ? 1 : 2);
              return aMatch - bMatch;
            }).map(n => (
              <div key={n.id} onClick={() => {
                setEditingNodo({
                  id: n.id, codice: n.codice, nome: n.nome, fornitore: n.fornitore || '', serie: n.serie, tipo_nodo: n.tipo_nodo,
                  layers: (n.profili || []).map((p: any, i: number) => ({
                    id: Date.now().toString() + i, profiloId: null, codice: p.codice, svg: '',
                    x: p.x || 0, y: p.y || 0, rotation: p.rotation || 0,
                    flipH: p.flipH || false, flipV: p.flipV || false,
                    color: LAYER_COLORS[i % LAYER_COLORS.length], label: p.ruolo || p.codice, visible: true,
                  })),
                });
              }} style={{ padding: 14, borderRadius: 10, border: `1.5px solid ${DS.border}`, background: DS.white, cursor: 'pointer' }}>
                <div style={{ height: 100, background: DS.light, borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {n.sezione_svg ? <div dangerouslySetInnerHTML={{ __html: n.sezione_svg }} style={{ maxWidth: '90%', maxHeight: '90%' }} /> :
                    <span style={{ color: '#ddd', fontSize: 10 }}>No preview</span>}
                </div>
                <div style={{ fontFamily: M, fontSize: 12, fontWeight: 700, color: DS.ink }}>{n.codice}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{n.nome}</div>
                <div style={{ fontSize: 10, color: DS.teal, marginTop: 2 }}>{n.fornitore ? n.fornitore + ' ' : ''}{n.serie} — {n.tipo_nodo?.replace(/_/g, ' ')}</div>
                {initSerie && n.serie === initSerie && <div style={{ fontSize: 8, fontWeight: 800, color: DS.green, marginTop: 2, textTransform: 'uppercase' as const }}>Serie attiva</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper: extract SVG inner content ──
function extractSVGContent(svgString: string): string {
  if (!svgString) return '';
  // Remove outer <svg> tags, keep inner content + viewBox transform
  const vbMatch = svgString.match(/viewBox="([^"]+)"/);
  const inner = svgString.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
  return inner;
}

// ── Small button for layer controls ──
function SmallBtn({ icon, label, onClick, active, color }: any) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 6px', borderRadius: 4, border: `1px solid ${active ? (color || DS.teal) + '40' : DS.border}`,
      background: active ? (color || DS.teal) + '10' : DS.white, color: color || DS.teal,
      fontSize: 9, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2,
    }}>{icon}{label}</button>
  );
}

// ── Profile Catalog Modal — filterable by fornitore/serie/tipo ──
function ProfileCatalogModal({ profili, onSelect, onClose }: { profili: any[]; onSelect: (p: any) => void; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [filtroFornitore, setFiltroFornitore] = useState('');
  const [filtroSerie, setFiltroSerie] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');

  const fornitori = [...new Set(profili.map(p => p.fornitore).filter(Boolean))];
  const serie = [...new Set(profili.filter(p => !filtroFornitore || p.fornitore === filtroFornitore).map(p => p.serie).filter(Boolean))];
  const tipi = [...new Set(profili.map(p => p.tipo).filter(Boolean))];

  const filtered = profili.filter(p => {
    if (filtroFornitore && p.fornitore !== filtroFornitore) return false;
    if (filtroSerie && p.serie !== filtroSerie) return false;
    if (filtroTipo && p.tipo !== filtroTipo) return false;
    if (search) {
      const s = search.toLowerCase();
      return (p.codice || '').toLowerCase().includes(s) || (p.fornitore || '').toLowerCase().includes(s) || (p.serie || '').toLowerCase().includes(s);
    }
    return true;
  });

  // Group by serie
  const grouped: Record<string, any[]> = {};
  filtered.forEach(p => {
    const key = `${p.fornitore || '?'} — ${p.serie || '?'}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 620, maxHeight: '80vh', background: DS.white, borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.3)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', background: DS.ink, color: '#fff', fontWeight: 800, fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Scegli profilo dal catalogo</span>
          <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.6 }}>{filtered.length} profili</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: 18 }}>&times;</button>
        </div>
        {/* Filters */}
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${DS.border}`, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', flexShrink: 0 }}>
          <input placeholder="Cerca..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 120, padding: '6px 10px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 12, outline: 'none' }} />
          <select value={filtroFornitore} onChange={e => { setFiltroFornitore(e.target.value); setFiltroSerie(''); }}
            style={{ padding: '6px 8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 11, background: DS.white }}>
            <option value="">Tutti fornitori</option>
            {fornitori.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={filtroSerie} onChange={e => setFiltroSerie(e.target.value)}
            style={{ padding: '6px 8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 11, background: DS.white }}>
            <option value="">Tutte serie</option>
            {serie.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            style={{ padding: '6px 8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 11, background: DS.white }}>
            <option value="">Tutti tipi</option>
            {tipi.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#999', padding: 30, fontSize: 13 }}>
              {profili.length === 0 ? 'Nessun profilo con sezione trovato. Carica profili in Archivio Profili prima.' : 'Nessun profilo corrisponde ai filtri.'}
            </div>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group} style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: DS.ink, marginBottom: 6, paddingLeft: 4, borderLeft: `3px solid ${DS.teal}` }}>&nbsp;{group} <span style={{ fontWeight: 400, color: '#999' }}>{items.length}</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
                  {items.map(p => (
                    <div key={p.id} onClick={() => onSelect(p)}
                      style={{ padding: 8, borderRadius: 8, border: `1.5px solid ${DS.border}`, cursor: 'pointer', background: DS.white, textAlign: 'center' }}
                      onMouseOver={e => (e.currentTarget.style.borderColor = DS.teal)}
                      onMouseOut={e => (e.currentTarget.style.borderColor = DS.border)}>
                      <div style={{ height: 55, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 3 }}>
                        <div dangerouslySetInnerHTML={{ __html: p.sezione_svg }} style={{ maxWidth: '90%', maxHeight: '90%' }} />
                      </div>
                      <div style={{ fontSize: 10, fontFamily: M, fontWeight: 700, color: DS.ink }}>{p.codice}</div>
                      <div style={{ fontSize: 9, color: '#999' }}>{p.tipo}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Vertical toolbar button ──
function VToolBtn({ active, onClick, icon, tip, color }: any) {
  return (
    <button onClick={onClick} title={tip} style={{
      width: 36, height: 36, borderRadius: 8, border: 'none',
      background: active ? (color || DS.teal) : 'transparent', color: active ? '#fff' : (color || '#888'),
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all .15s',
    }}
    onMouseOver={e => { if (!active) (e.currentTarget.style.background = 'rgba(255,255,255,.1)'); }}
    onMouseOut={e => { if (!active) (e.currentTarget.style.background = 'transparent'); }}>
      {icon}
    </button>
  );
}

// ── Mini numeric input for layer controls ──
function MiniInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <span style={{ fontSize: 8, color: '#999' }}>{label}</span>
      <input type="number" value={Math.round(value * 10) / 10} onChange={e => onChange(parseFloat(e.target.value) || 0)}
        style={{ width: '100%', padding: '2px 4px', border: `1px solid ${DS.border}`, borderRadius: 3, fontSize: 10, fontFamily: M, boxSizing: 'border-box' }} />
    </div>
  );
}

// ── Context menu item ──
function CtxItem({ label, onClick, shortcut, color }: { label: string; onClick: () => void; shortcut?: string; color?: string }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '7px 14px', border: 'none', background: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: color || DS.ink,
    }}
    onMouseOver={e => (e.currentTarget.style.background = DS.light)}
    onMouseOut={e => (e.currentTarget.style.background = 'none')}>
      <span>{label}</span>
      {shortcut && <span style={{ fontSize: 10, color: '#bbb', fontFamily: M }}>{shortcut}</span>}
    </button>
  );
}

// ── Toolbar button ──
function ToolBtn({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 10px', borderRadius: 6, border: 'none',
      background: active ? DS.teal : 'rgba(255,255,255,.1)', color: active ? '#fff' : '#999',
      fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
    }}>{icon} {label}</button>
  );
}
