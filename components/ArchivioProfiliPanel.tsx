// @ts-nocheck
'use client';
// ═══════════════════════════════════════════════════════════
// MASTRO — ArchivioProfiliPanel v1 (S21)
// Archivio profili con convertitore DXF/DWG → SVG
// Gestione catalogo profili per serie/fornitore
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

// ── SVG Icons ──
const Ic = {
  upload: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  file: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>,
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>,
  grid: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  list: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  trash: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  eye: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  back: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
};

const TIPI_PROFILO = ['telaio', 'anta', 'montante', 'traverso', 'soglia', 'zoccolo', 'fermavetro', 'coprifilo'];
const MATERIALI = ['PVC', 'AL', 'legno', 'acciaio', 'misto'];

interface Profilo {
  id: string; codice: string; fornitore: string; serie: string; tipo: string;
  materiale: string; larghezza_vista: number; profondita: number; altezza_mm: number;
  spessore_parete_mm: number; peso_kg_m: number; prezzo_ml: number;
  taglio_tipo: string; sfrido_mm: number; n_guarnizioni: number;
  sezione_svg: string | null; attivo: boolean;
}

export default function ArchivioProfiliPanel({ onBack }: { onBack?: () => void }) {
  const [profili, setProfili] = useState<Profilo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroFornitore, setFiltroFornitore] = useState('');
  const [filtroSerie, setFiltroSerie] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [vista, setVista] = useState<'grid' | 'lista'>('grid');
  const [selected, setSelected] = useState<Profilo | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertResult, setConvertResult] = useState<{ svg: string; width: number; height: number } | null>(null);
  const [showNuovo, setShowNuovo] = useState(false);

  const fetchProfili = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('catalogo_profili').select('*')
      .not('fornitore', 'eq', '').order('fornitore').order('serie').order('tipo');
    setProfili(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfili(); }, [fetchProfili]);

  // Unique values for filters
  const fornitori = [...new Set(profili.map(p => p.fornitore).filter(Boolean))];
  const serie = [...new Set(profili.filter(p => !filtroFornitore || p.fornitore === filtroFornitore).map(p => p.serie).filter(Boolean))];

  // Filtered list
  const filtered = profili.filter(p => {
    if (filtroFornitore && p.fornitore !== filtroFornitore) return false;
    if (filtroSerie && p.serie !== filtroSerie) return false;
    if (filtroTipo && p.tipo !== filtroTipo) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.codice.toLowerCase().includes(s) || p.fornitore.toLowerCase().includes(s) || p.serie.toLowerCase().includes(s) || p.tipo.toLowerCase().includes(s);
    }
    return true;
  });

  // Group by serie for grid view
  const grouped: Record<string, Profilo[]> = {};
  filtered.forEach(p => {
    const key = `${p.fornitore} — ${p.serie}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(p);
  });

  const createAndSaveProfilo = async (newP: any, svg: string) => {
    if (!svg) { alert('Nessuna sezione SVG. Carica prima un file DXF/DWG.'); return; }
    try {
      console.log('[MASTRO] Saving profile:', newP.codice);
      const { data, error } = await supabase.from('catalogo_profili').insert({
        codice: newP.codice, fornitore: newP.fornitore, serie: newP.serie,
        tipo: newP.tipo, materiale: newP.materiale,
        larghezza_vista: parseFloat(newP.larghezza_vista) || 0,
        profondita: parseFloat(newP.profondita) || 0,
        peso_kg_m: parseFloat(newP.peso_metro) || 0,
        prezzo_ml: parseFloat(newP.prezzo_metro) || 0,
        lunghezze_barre: newP.barre ? newP.barre.map((b: string) => parseFloat(b)).filter((b: number) => b > 0) : [6500],
        utilizzo: newP.utilizzo || [],
        sezione_svg: svg, attivo: true,
      }).select().single();
      if (error) { alert('Errore salvataggio: ' + error.message); console.error(error); return; }
      if (data) {
        setProfili(prev => [...prev, data]);
        setConvertResult(null);
        setShowUpload(false);
        setSelected(data);
      }
    } catch (e: any) { alert('Errore: ' + e.message); console.error(e); }
  };

  // ── DXF → SVG CONVERTER ──
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDXFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    setConverting(true);
    setConvertResult(null);

    try {
      if (ext === 'dwg') {
        const svg = await convertDWGtoSVG(file);
        setConvertResult({ svg, width: 0, height: 0 });
      } else {
        const text = await file.text();
        if (!text.includes('SECTION') || !text.includes('ENTITIES')) {
          throw new Error('Il file non sembra un DXF valido.');
        }
        const result = parseDXFtoSVG(text, file.name);
        setConvertResult(result);
      }
    } catch (err: any) {
      alert('Errore conversione: ' + err.message);
    }
    setConverting(false);
    // Reset the actual input element that triggered the event
    e.target.value = '';
  };

  // DWG → SVG via libredwg-web WASM (client-side, no server needed)
  async function convertDWGtoSVG(file: File): Promise<string> {
    const arrayBuf = await file.arrayBuffer();
    
    // Load the UMD script dynamically (avoids Webpack issues)
    if (!(window as any).__libredwgWeb) {
      const script = document.createElement('script');
      script.src = '/libredwg-web.umd.cjs';
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Impossibile caricare il motore DWG. Verifica la connessione.'));
        document.head.appendChild(script);
      });
      
      const lib = (window as any)['libredwg-web'];
      if (!lib || !lib.createModule) throw new Error('Motore DWG non inizializzato correttamente.');
      
      const wasmModule = await lib.createModule({
        locateFile: (path: string) => {
          if (path.endsWith('.wasm')) return '/libredwg-web.wasm';
          return path;
        }
      });
      
      (window as any).__libredwgWeb = new lib.LibreDwg(wasmModule);
      (window as any).__libredwgFileType = lib.Dwg_File_Type;
    }
    
    const libreDwg = (window as any).__libredwgWeb;
    const fileType = (window as any).__libredwgFileType;
    
    // Read DWG file
    const data = libreDwg.dwg_read_data(arrayBuf, fileType.DWG);
    if (!data) throw new Error('Impossibile leggere il file DWG. Formato non supportato o file corrotto.');
    
    // Convert to database → SVG
    const database = libreDwg.convert(data);
    const svg = libreDwg.dwg_to_svg(database);
    
    // Free WASM memory
    libreDwg.dwg_free(data);
    
    if (!svg || svg.length < 50) throw new Error('Il file DWG non contiene geometria disegnabile.');
    
    // Post-process SVG: fix colors for light background
    // AutoCAD uses light colors (white/yellow) on dark background — swap to dark
    let fixed = svg
      .replace(/width="[^"]*"/, 'width="100%"')
      .replace(/height="[^"]*"/, 'height="100%"')
      // Force minimum stroke width
      .replace(/stroke-width="0\.1%"/g, 'stroke-width="0.3"')
      // Replace white/near-white strokes with dark
      .replace(/stroke\s*[:=]\s*["']?\s*#(?:fff|FFF|ffffff|FFFFFF|fefefe|FEFEFE)\b/gi, 'stroke="#0D1F1F"')
      .replace(/stroke\s*[:=]\s*["']?\s*rgb\s*\(\s*255\s*,\s*255\s*,\s*255\s*\)/gi, 'stroke="#0D1F1F"')
      // Replace yellow strokes (common AutoCAD color 2) with dark
      .replace(/stroke\s*[:=]\s*["']?\s*#(?:ffff00|FFFF00)\b/gi, 'stroke="#0D1F1F"')
      .replace(/stroke\s*[:=]\s*["']?\s*rgb\s*\(\s*255\s*,\s*255\s*,\s*0\s*\)/gi, 'stroke="#0D1F1F"');
    
    // If the SVG has no visible strokes, add a global dark stroke
    if (!fixed.includes('stroke="#0') && !fixed.includes('stroke="#1') && !fixed.includes("stroke='#0")) {
      fixed = fixed.replace(/<g /, '<g stroke="#0D1F1F" ');
    }
    
    return fixed;
  }

  const saveSVGtoProfilo = async (profiloId: string, svg: string) => {
    await supabase.from('catalogo_profili').update({ sezione_svg: svg }).eq('id', profiloId);
    setProfili(prev => prev.map(p => p.id === profiloId ? { ...p, sezione_svg: svg } : p));
    if (selected?.id === profiloId) setSelected(prev => prev ? { ...prev, sezione_svg: svg } : null);
    setConvertResult(null);
    setShowUpload(false);
  };

  // ── DETAIL VIEW ──
  if (selected) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
        <div style={{ padding: '16px 24px', flexShrink: 0, borderBottom: `1.5px solid ${DS.border}`, background: `linear-gradient(180deg, ${DS.teal}08 0%, ${DS.white} 100%)` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setSelected(null)} style={{ background: DS.white, border: `1.5px solid ${DS.border}`, borderRadius: 8, cursor: 'pointer', color: DS.teal, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 700 }}>{Ic.back} Lista</button>
            <span style={{ fontFamily: M, fontWeight: 700, color: DS.dark, fontSize: 16 }}>{selected.codice}</span>
            <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: DS.teal + '12', color: DS.teal }}>{selected.tipo}</span>
            <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: DS.blue + '10', color: DS.blue }}>{selected.fornitore} — {selected.serie}</span>
            <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: (selected.materiale === 'PVC' ? DS.green : DS.amber) + '10', color: selected.materiale === 'PVC' ? DS.green : DS.amber }}>{selected.materiale}</span>
            <div style={{ flex: 1 }} />
            <button onClick={async () => { if (!confirm('Eliminare profilo ' + selected.codice + '?')) return; await supabase.from('catalogo_profili').delete().eq('id', selected.id); setProfili(prev => prev.filter(x => x.id !== selected.id)); setSelected(null); }}
              style={{ padding: '6px 14px', border: `1.5px solid ${DS.red}30`, borderRadius: 8, background: DS.white, color: DS.red, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>{Ic.trash} Elimina</button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* LEFT: Sezione SVG */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Sezione profilo</div>
            <div style={{ minHeight: 300, background: DS.white, borderRadius: 12, border: `1.5px solid ${DS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
              {selected.sezione_svg ? (
                <div dangerouslySetInnerHTML={{ __html: selected.sezione_svg }} style={{ width: '100%', height: '100%', padding: 20 }} />
              ) : (
                <div style={{ textAlign: 'center', color: '#ccc', padding: 40 }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="3" x2="21" y2="21" opacity=".3"/></svg>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 8 }}>Nessuna sezione caricata</div>
                  <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>Carica un file DXF per visualizzare la sezione</div>
                </div>
              )}
            </div>
            <button onClick={() => { setShowUpload(true); }} style={{ marginTop: 10, padding: '10px 20px', background: DS.teal, color: DS.white, border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 2px 0 ${DS.dark}` }}>
              {Ic.upload} Carica DXF sezione
            </button>
          </div>
          {/* RIGHT: Dati tecnici */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 8 }}>Dati tecnici</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <InfoCard label="Larghezza vista" value={`${selected.larghezza_vista} mm`} />
              <InfoCard label="Profondita" value={`${selected.profondita} mm`} />
              <InfoCard label="Altezza profilo" value={`${selected.altezza_mm || '—'} mm`} />
              <InfoCard label="Spessore pareti" value={`${selected.spessore_parete_mm || '—'} mm`} />
              <InfoCard label="Peso/metro" value={`${selected.peso_kg_m || '—'} kg/m`} color={DS.amber} />
              <InfoCard label="Prezzo/metro" value={`EUR ${selected.prezzo_ml || '—'}`} color={DS.green} />
              <InfoCard label="Taglio" value={selected.taglio_tipo === '45' ? '45° miter' : '90° dritto'} />
              <InfoCard label="Sfrido" value={`${selected.sfrido_mm} mm`} />
              <InfoCard label="Guarnizioni" value={`${selected.n_guarnizioni}`} />
              <InfoCard label="Stato" value={selected.attivo ? 'Attivo' : 'Disattivato'} color={selected.attivo ? DS.green : DS.red} />
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 }}>Lavorazioni collegate</div>
            <div style={{ padding: 16, background: DS.light, borderRadius: 10, border: `1.5px dashed ${DS.border}`, textAlign: 'center', color: '#bbb', fontSize: 12 }}>
              Le lavorazioni saranno collegate tramite gli accessori
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 }}>Nodi tecnici</div>
            <div style={{ padding: 16, background: DS.light, borderRadius: 10, border: `1.5px dashed ${DS.border}`, textAlign: 'center', color: '#bbb', fontSize: 12 }}>
              I nodi saranno visibili quando le sezioni sono caricate
            </div>
          </div>
        </div>

        {/* Upload modal */}
        {showUpload && <DXFUploadModal
          onClose={() => { setShowUpload(false); setConvertResult(null); }}
          onConvert={handleDXFUpload}
          converting={converting}
          result={convertResult}
          onSave={() => convertResult && saveSVGtoProfilo(selected.id, convertResult.svg)}
          fileInputRef={fileInputRef}
          onCreateAndSave={createAndSaveProfilo}
        />}
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ padding: '16px 20px 0', flexShrink: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          {onBack && <button onClick={onBack} style={{ background: DS.white, border: `1.5px solid ${DS.border}`, borderRadius: 8, cursor: 'pointer', color: DS.teal, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 700 }}>{Ic.back}</button>}
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: DS.ink }}>Archivio Profili</h2>
          <span style={{ fontSize: 14, color: '#999', fontFamily: M }}>{profili.length} profili</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => { setConvertResult(null); setShowUpload(true); }} style={{ padding: '10px 18px', border: 'none', borderRadius: 8, background: DS.blue, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 2px 0 #2960B0` }}>
            {Ic.upload} Importa DXF
          </button>
          <button onClick={() => { setConvertResult(null); setShowUpload(true); }} style={{ padding: '10px 18px', border: 'none', borderRadius: 8, background: DS.teal, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: `0 2px 0 ${DS.dark}` }}>
            + Nuovo profilo
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filtroFornitore} onChange={e => { setFiltroFornitore(e.target.value); setFiltroSerie(''); }}
            style={{ padding: '8px 12px', border: `1.5px solid ${DS.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, background: DS.white, cursor: 'pointer' }}>
            <option value="">Tutti i fornitori</option>
            {fornitori.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <select value={filtroSerie} onChange={e => setFiltroSerie(e.target.value)}
            style={{ padding: '8px 12px', border: `1.5px solid ${DS.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, background: DS.white, cursor: 'pointer' }}>
            <option value="">Tutte le serie</option>
            {serie.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            style={{ padding: '8px 12px', border: `1.5px solid ${DS.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600, background: DS.white, cursor: 'pointer' }}>
            <option value="">Tutti i tipi</option>
            {TIPI_PROFILO.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <div style={{ flex: 1 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }}>{Ic.search}</div>
            <input type="text" placeholder="Cerca profilo..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px 8px 32px', border: `1.5px solid ${DS.border}`, borderRadius: 8, fontSize: 12, background: DS.white, outline: 'none', width: 200 }} />
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={() => setVista('grid')} style={{ padding: '7px 10px', border: `1.5px solid ${vista === 'grid' ? DS.teal + '40' : DS.border}`, borderRadius: '8px 0 0 8px', background: vista === 'grid' ? DS.teal + '10' : DS.white, cursor: 'pointer', color: vista === 'grid' ? DS.teal : '#999' }}>{Ic.grid}</button>
            <button onClick={() => setVista('lista')} style={{ padding: '7px 10px', border: `1.5px solid ${vista === 'lista' ? DS.teal + '40' : DS.border}`, borderRadius: '0 8px 8px 0', background: vista === 'lista' ? DS.teal + '10' : DS.white, cursor: 'pointer', color: vista === 'lista' ? DS.teal : '#999' }}>{Ic.list}</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 20px' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>Caricamento...</div>
        : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#ccc' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Nessun profilo trovato</div>
            <div style={{ fontSize: 12 }}>Importa profili tramite DXF o creane uno manualmente</div>
          </div>
        ) : vista === 'grid' ? (
          // GRID VIEW — grouped by serie
          Object.entries(grouped).map(([key, profs]) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: DS.ink, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 4, height: 16, borderRadius: 2, background: DS.teal }} />
                {key}
                <span style={{ fontFamily: M, fontSize: 11, color: '#999', fontWeight: 500 }}>{profs.length} profili</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
                {profs.map(p => (
                  <div key={p.id} onClick={() => setSelected(p)} style={{
                    padding: 14, borderRadius: 10, border: `1.5px solid ${DS.border}`, background: DS.white, cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,.04)', transition: 'all .15s',
                  }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = DS.teal + '50'; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = DS.border; }}>
                    {/* Mini SVG preview */}
                    <div style={{ height: 80, background: DS.light, borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {p.sezione_svg ? (
                        <div dangerouslySetInnerHTML={{ __html: p.sezione_svg }} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                      ) : (
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                      )}
                    </div>
                    <div style={{ fontFamily: M, fontSize: 12, fontWeight: 700, color: DS.ink, marginBottom: 2 }}>{p.codice}</div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>{p.tipo}</div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontFamily: M, color: DS.teal }}>{p.larghezza_vista}x{p.profondita}</span>
                      <span style={{ fontSize: 10, fontFamily: M, color: DS.amber }}>{p.peso_kg_m}kg/m</span>
                      <div style={{ flex: 1 }} />
                      <button onClick={async (e) => { e.stopPropagation(); if (!confirm('Eliminare ' + p.codice + '?')) return; await supabase.from('catalogo_profili').delete().eq('id', p.id); setProfili(prev => prev.filter(x => x.id !== p.id)); }}
                        style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 12, padding: 2 }}
                        onMouseOver={e => (e.currentTarget.style.color = DS.red)}
                        onMouseOut={e => (e.currentTarget.style.color = '#ccc')}>{Ic.trash}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          // LIST VIEW — table
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead><tr style={{ background: DS.light }}>
              {['Codice', 'Fornitore', 'Serie', 'Tipo', 'Mat.', 'L.vista', 'Prof.', 'Peso/m', 'EUR/m', 'Taglio', 'SVG'].map(h => (
                <th key={h} style={{ padding: '10px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', borderBottom: `2px solid ${DS.border}` }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)} style={{ cursor: 'pointer', borderBottom: `1px solid ${DS.border}40` }}
                  onMouseOver={e => { (e.currentTarget as HTMLElement).style.background = DS.light; }}
                  onMouseOut={e => { (e.currentTarget as HTMLElement).style.background = ''; }}>
                  <td style={{ padding: '8px', fontFamily: M, fontWeight: 700, color: DS.teal }}>{p.codice}</td>
                  <td style={{ padding: '8px', fontWeight: 600 }}>{p.fornitore}</td>
                  <td style={{ padding: '8px' }}>{p.serie}</td>
                  <td style={{ padding: '8px' }}><span style={{ padding: '2px 6px', borderRadius: 4, background: DS.teal + '10', color: DS.teal, fontSize: 10, fontWeight: 700 }}>{p.tipo}</span></td>
                  <td style={{ padding: '8px', color: p.materiale === 'PVC' ? DS.green : DS.amber, fontWeight: 600 }}>{p.materiale}</td>
                  <td style={{ padding: '8px', fontFamily: M }}>{p.larghezza_vista}</td>
                  <td style={{ padding: '8px', fontFamily: M }}>{p.profondita}</td>
                  <td style={{ padding: '8px', fontFamily: M }}>{p.peso_kg_m}</td>
                  <td style={{ padding: '8px', fontFamily: M, color: DS.green }}>{p.prezzo_ml}</td>
                  <td style={{ padding: '8px' }}>{p.taglio_tipo}°</td>
                  <td style={{ padding: '8px' }}>{p.sezione_svg ? <span style={{ color: DS.green }}>Si</span> : <span style={{ color: '#ccc' }}>No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Upload modal (standalone, not tied to a profile) */}
      {showUpload && <DXFUploadModal
        onClose={() => { setShowUpload(false); setConvertResult(null); }}
        onConvert={handleDXFUpload}
        converting={converting}
        result={convertResult}
        onSave={null}
        fileInputRef={fileInputRef}
        profili={filtered}
        onSaveToProfilo={(id: string) => convertResult && saveSVGtoProfilo(id, convertResult.svg)}
        onCreateAndSave={createAndSaveProfilo}
      />}
    </div>
  );
}

// ── DXF Upload Modal — with create new profile form ──
function DXFUploadModal({ onClose, onConvert, converting, result, onSave, fileInputRef, profili, onSaveToProfilo, onCreateAndSave }: any) {
  const [targetProfilo, setTargetProfilo] = useState('');
  const [mode, setMode] = useState<'existing' | 'new'>('new');
  const [newP, setNewP] = useState({ codice: '', fornitore: '', serie: '', tipo: 'telaio', materiale: 'PVC', larghezza_vista: '', profondita: '', peso_metro: '', prezzo_metro: '', barre: ['6500'] as string[], utilizzo: [] as string[] });
  const [fileName, setFileName] = useState('');
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = localInputRef; // Use local ref to avoid conflicts

  const canSaveNew = !!(newP.codice.trim() && newP.fornitore.trim() && newP.serie.trim() && result);

  const handleLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      console.log('[MASTRO] File selected:', file.name, file.size, 'bytes');
      const baseName = file.name.replace(/\.(dxf|dwg)$/i, '').toUpperCase();
      if (!newP.codice) setNewP(p => ({ ...p, codice: baseName }));
    }
    onConvert(e);
    setTimeout(() => { if (inputRef.current) inputRef.current.value = ''; }, 100);
  };

  // Auto-fill dimensions when result changes
  useEffect(() => {
    if (result && result.width > 0 && result.height > 0) {
      setNewP(p => ({
        ...p,
        larghezza_vista: p.larghezza_vista || String(result.width),
        profondita: p.profondita || String(result.height),
      }));
    }
  }, [result]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 700, maxHeight: '90vh', background: DS.white, borderRadius: 16, overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ padding: '14px 20px', background: DS.ink, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, position: 'sticky', top: 0, zIndex: 2 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DS.teal} strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
          <span style={{ fontWeight: 800, fontSize: 15 }}>Convertitore DXF → SVG</span>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.5)', cursor: 'pointer', fontSize: 20 }}>&times;</button>
        </div>
        <div style={{ padding: 20 }}>
          {/* Upload zone */}
          <div style={{
            padding: 24, borderRadius: 12, border: `2px dashed ${converting ? DS.teal : DS.border}`,
            background: converting ? DS.teal + '08' : DS.light, textAlign: 'center', cursor: 'pointer',
          }} onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" accept=".dxf,.dwg,.DXF,.DWG" onChange={handleLocalUpload} style={{ display: 'none' }} />
            {converting ? (
              <div style={{ color: DS.teal, fontWeight: 700 }}>Conversione in corso...</div>
            ) : (
              <>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={DS.teal} strokeWidth="1.5" style={{ marginBottom: 6 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <div style={{ fontSize: 14, fontWeight: 700, color: DS.ink }}>Carica file DXF</div>
                <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>File sezione profilo dal fornitore</div>
              </>
            )}
          </div>

          {/* Result preview + save form */}
          {result && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                Anteprima sezione
                {fileName && <span style={{ fontSize: 10, fontWeight: 600, color: DS.teal, fontFamily: M, textTransform: 'none' }}>{fileName}</span>}
              </div>
              <SvgPreview svg={result.svg} />

              {/* Mode toggle */}
              <div style={{ display: 'flex', gap: 4, marginTop: 14, marginBottom: 12 }}>
                <button onClick={() => setMode('new')} style={{ flex: 1, padding: '8px', borderRadius: '8px 0 0 8px', border: `1.5px solid ${mode === 'new' ? DS.teal : DS.border}`, background: mode === 'new' ? DS.teal + '10' : DS.white, color: mode === 'new' ? DS.teal : '#999', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  + Crea nuovo profilo
                </button>
                <button onClick={() => setMode('existing')} style={{ flex: 1, padding: '8px', borderRadius: '0 8px 8px 0', border: `1.5px solid ${mode === 'existing' ? DS.teal : DS.border}`, background: mode === 'existing' ? DS.teal + '10' : DS.white, color: mode === 'existing' ? DS.teal : '#999', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  Assegna a esistente
                </button>
              </div>

              {mode === 'new' ? (
                <div>
                  {/* New profile form */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <FormField label="CODICE *" value={newP.codice} onChange={v => setNewP(p => ({ ...p, codice: v }))} ph="ID4K-TEL" />
                    <FormField label="FORNITORE *" value={newP.fornitore} onChange={v => setNewP(p => ({ ...p, fornitore: v }))} ph="Aluplast" />
                    <FormField label="SERIE *" value={newP.serie} onChange={v => setNewP(p => ({ ...p, serie: v }))} ph="IDEAL4000" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>TIPO</label>
                      <select value={newP.tipo} onChange={e => setNewP(p => ({ ...p, tipo: e.target.value }))} style={{ width: '100%', padding: '8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                        {['telaio', 'anta', 'montante', 'traverso', 'soglia', 'zoccolo', 'fermavetro', 'coprifilo'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>MATERIALE</label>
                      <select value={newP.materiale} onChange={e => setNewP(p => ({ ...p, materiale: e.target.value }))} style={{ width: '100%', padding: '8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                        {['PVC', 'AL', 'legno', 'acciaio', 'misto'].map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <FormField label="LARG. VISTA (mm)" value={newP.larghezza_vista} onChange={v => setNewP(p => ({ ...p, larghezza_vista: v }))} ph="70" type="number" />
                    <FormField label="PROFONDITA (mm)" value={newP.profondita} onChange={v => setNewP(p => ({ ...p, profondita: v }))} ph="70" type="number" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <FormField label="PESO (kg/m)" value={newP.peso_metro} onChange={v => setNewP(p => ({ ...p, peso_metro: v }))} ph="1.65" type="number" />
                    <FormField label="PREZZO (EUR/m)" value={newP.prezzo_metro} onChange={v => setNewP(p => ({ ...p, prezzo_metro: v }))} ph="4.20" type="number" />
                  </div>
                  {/* Lunghezze barre disponibili */}
                  <div style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>LUNGHEZZE BARRE DISPONIBILI (mm)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
                      {newP.barre.map((b, i) => (
                        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 10px', borderRadius: 6, background: DS.teal + '12', color: DS.teal, fontSize: 12, fontWeight: 700, fontFamily: M, border: `1px solid ${DS.teal}25` }}>
                          {b} mm
                          <button type="button" onClick={() => setNewP(p => ({ ...p, barre: p.barre.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: DS.red, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
                        </span>
                      ))}
                      <input type="number" placeholder="+ Aggiungi" style={{ width: 90, padding: '4px 8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 11, fontFamily: M, outline: 'none' }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value.trim();
                            if (val && !newP.barre.includes(val)) {
                              setNewP(p => ({ ...p, barre: [...p.barre, val] }));
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }} />
                    </div>
                    <div style={{ fontSize: 9, color: '#bbb', marginTop: 2 }}>Digita e premi Invio per aggiungere</div>
                  </div>
                  {/* Utilizzo — bottoni predefiniti + tag custom */}
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>UTILIZZO</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                      {['Telaio fisso', 'Anta battente', 'Anta ribalta', 'Anta scorrevole', 'Anta alzante', 'Porta battente', 'Porta scorrevole', 'Montante fisso', 'Montante mobile', 'Traverso fisso', 'Traverso mobile', 'Soglia', 'Coprifilo', 'Fermavetro', 'Zoccolo'].map(u => {
                        const active = newP.utilizzo.includes(u);
                        return (
                          <button key={u} type="button" onClick={() => setNewP(p => ({ ...p, utilizzo: active ? p.utilizzo.filter(x => x !== u) : [...p.utilizzo, u] }))} style={{
                            padding: '4px 10px', borderRadius: 6, fontSize: 10, fontWeight: active ? 700 : 500, cursor: 'pointer',
                            background: active ? DS.teal + '15' : DS.white,
                            color: active ? DS.teal : '#888',
                            border: `1.5px solid ${active ? DS.teal + '40' : DS.border}`,
                          }}>{u}</button>
                        );
                      })}
                    </div>
                    {/* Custom tags added by user */}
                    {newP.utilizzo.filter(u => !['Telaio fisso', 'Anta battente', 'Anta ribalta', 'Anta scorrevole', 'Anta alzante', 'Porta battente', 'Porta scorrevole', 'Montante fisso', 'Montante mobile', 'Traverso fisso', 'Traverso mobile', 'Soglia', 'Coprifilo', 'Fermavetro', 'Zoccolo'].includes(u)).length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                        {newP.utilizzo.filter(u => !['Telaio fisso', 'Anta battente', 'Anta ribalta', 'Anta scorrevole', 'Anta alzante', 'Porta battente', 'Porta scorrevole', 'Montante fisso', 'Montante mobile', 'Traverso fisso', 'Traverso mobile', 'Soglia', 'Coprifilo', 'Fermavetro', 'Zoccolo'].includes(u)).map((u, i) => (
                          <span key={u} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '4px 10px', borderRadius: 6, background: '#D08008' + '15', color: '#D08008', fontSize: 11, fontWeight: 700, border: `1px solid #D0800825` }}>
                            {u}
                            <button type="button" onClick={() => setNewP(p => ({ ...p, utilizzo: p.utilizzo.filter(x => x !== u) }))} style={{ background: 'none', border: 'none', color: DS.red, cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}>&times;</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <input type="text" placeholder="+ Aggiungi utilizzo personalizzato..." style={{ width: '100%', padding: '6px 10px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 11, outline: 'none' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && !newP.utilizzo.includes(val)) {
                            setNewP(p => ({ ...p, utilizzo: [...p.utilizzo, val] }));
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }} />
                  </div>
                  <button onClick={() => {
                    if (!newP.codice.trim()) { alert('Inserisci il codice profilo'); return; }
                    if (!newP.fornitore.trim()) { alert('Inserisci il fornitore'); return; }
                    if (!newP.serie.trim()) { alert('Inserisci la serie'); return; }
                    if (!result) { alert('Carica prima un file DXF/DWG'); return; }
                    onCreateAndSave?.(newP, result.svg);
                  }}
                    style={{ width: '100%', padding: '12px', background: DS.green, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 0 #157a5a` }}>
                    Crea profilo e salva sezione
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select value={targetProfilo} onChange={e => setTargetProfilo(e.target.value)} style={{ flex: 1, padding: '10px 12px', border: `1.5px solid ${DS.border}`, borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                    <option value="">— Scegli profilo —</option>
                    {profili && profili.map((p: any) => <option key={p.id} value={p.id}>{p.codice} ({p.fornitore} {p.serie} — {p.tipo})</option>)}
                  </select>
                  <button disabled={!targetProfilo} onClick={() => onSaveToProfilo?.(targetProfilo)}
                    style={{ padding: '10px 20px', background: targetProfilo ? DS.green : '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: targetProfilo ? 'pointer' : 'default' }}>
                    Salva
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SvgPreview({ svg }: { svg: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.85 : 1.18;
    setZoom(z => Math.max(0.2, Math.min(10, z * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.px + (e.clientX - dragStart.current.x),
      y: dragStart.current.py + (e.clientY - dragStart.current.y),
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  return (
    <div style={{ position: 'relative' }}>
      <div ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ height: 320, background: '#F8FCFC', borderRadius: 10, border: `1.5px solid ${DS.teal}25`, overflow: 'hidden', cursor: dragging ? 'grabbing' : 'grab', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div dangerouslySetInnerHTML={{ __html: svg }}
            style={{ width: '85%', height: '85%', transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center', transition: dragging ? 'none' : 'transform 0.1s' }} />
        </div>
      </div>
      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4 }}>
        <button type="button" onClick={() => setZoom(z => Math.min(10, z * 1.3))} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${DS.border}`, background: DS.white, cursor: 'pointer', fontSize: 16, fontWeight: 700, color: DS.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
        <button type="button" onClick={() => setZoom(z => Math.max(0.2, z * 0.7))} style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${DS.border}`, background: DS.white, cursor: 'pointer', fontSize: 16, fontWeight: 700, color: DS.teal, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
        <button type="button" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={{ height: 28, padding: '0 8px', borderRadius: 6, border: `1px solid ${DS.border}`, background: DS.white, cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#999' }}>Reset</button>
      </div>
      <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, color: '#bbb', background: 'rgba(255,255,255,.8)', padding: '2px 6px', borderRadius: 4 }}>{Math.round(zoom * 100)}%</div>
    </div>
  );
}

function FormField({ label, value, onChange, ph, type }: { label: string; value: string; onChange: (v: string) => void; ph?: string; type?: string }) {
  return (
    <div>
      <label style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>{label}</label>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={ph}
        style={{ width: '100%', padding: '8px', border: `1.5px solid ${DS.border}`, borderRadius: 6, fontSize: 12, fontWeight: 600, outline: 'none' }} />
    </div>
  );
}

// ── InfoCard ──
function InfoCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 8, background: DS.white, border: `1px solid ${DS.border}` }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: M, color: color || DS.ink, marginTop: 3 }}>{value}</div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// DXF → SVG Parser v3 — reads BLOCKS, handles AcDb codes
// Robust: won't confuse layer "0" with entity separator
// ═══════════════════════════════════════════════════════════
function parseDXFtoSVG(dxfText: string, filename: string): string {
  const raw = dxfText.replace(/\r/g, '').split('\n').map(l => l.trim());
  // Build code-value pairs array — this is the key fix:
  // DXF format is strictly alternating code/value lines
  const pairs: [number, string][] = [];
  for (let i = 0; i < raw.length - 1; i += 2) {
    const code = parseInt(raw[i]);
    if (!isNaN(code)) pairs.push([code, raw[i + 1]]);
  }

  const svgParts: string[] = [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const ub = (x: number, y: number) => {
    if (isFinite(x) && isFinite(y)) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  };

  // Find the main block name from INSERT in ENTITIES section
  let mainBlock = '';
  // First find where ENTITIES section starts (code 0=SECTION, then code 2=ENTITIES)
  for (let i = 0; i < pairs.length - 1; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === 'SECTION' && pairs[i + 1][0] === 2 && pairs[i + 1][1] === 'ENTITIES') {
      // Now find INSERT entity within ENTITIES
      for (let j = i + 2; j < pairs.length; j++) {
        if (pairs[j][0] === 0 && pairs[j][1] === 'ENDSEC') break;
        if (pairs[j][0] === 0 && pairs[j][1] === 'INSERT') {
          // Find code 2 (block name) after INSERT
          for (let k = j + 1; k < pairs.length && pairs[k][0] !== 0; k++) {
            if (pairs[k][0] === 2) { mainBlock = pairs[k][1]; break; }
          }
          if (mainBlock) break;
        }
      }
      break;
    }
  }

  // Also try: use filename as block hint (e.g. "15xx10.dxf" → block might be named similarly)
  const fileHint = filename.replace(/\.dxf$/i, '').replace(/\.dwg$/i, '');

  function processEntity(etype: string, codes: [number, string][]) {
    const getF = (c: number) => { const p = codes.find(([cc]) => cc === c); return p ? parseFloat(p[1]) : 0; };
    const getAllF = (c: number) => codes.filter(([cc]) => cc === c).map(([, v]) => parseFloat(v));

    if (etype === 'LINE') {
      const x1 = getF(10), y1 = getF(20), x2 = getF(11), y2 = getF(21);
      ub(x1, y1); ub(x2, y2);
      svgParts.push(`<line x1="${x1.toFixed(3)}" y1="${y1.toFixed(3)}" x2="${x2.toFixed(3)}" y2="${y2.toFixed(3)}" stroke="#0D1F1F" stroke-width="0.2" fill="none"/>`);
    }
    else if (etype === 'CIRCLE') {
      const cx = getF(10), cy = getF(20), r = getF(40);
      ub(cx - r, cy - r); ub(cx + r, cy + r);
      svgParts.push(`<circle cx="${cx.toFixed(3)}" cy="${cy.toFixed(3)}" r="${r.toFixed(3)}" stroke="#0D1F1F" stroke-width="0.2" fill="none"/>`);
    }
    else if (etype === 'ARC') {
      const cx = getF(10), cy = getF(20), r = getF(40), sa = getF(50), ea = getF(51);
      ub(cx - r, cy - r); ub(cx + r, cy + r);
      const sar = sa * Math.PI / 180, ear = ea * Math.PI / 180;
      const x1 = cx + r * Math.cos(sar), y1 = cy + r * Math.sin(sar);
      const x2 = cx + r * Math.cos(ear), y2 = cy + r * Math.sin(ear);
      const sweep = ((ea - sa) % 360 + 360) % 360;
      svgParts.push(`<path d="M${x1.toFixed(3)},${y1.toFixed(3)} A${r.toFixed(3)},${r.toFixed(3)} 0 ${sweep > 180 ? 1 : 0},1 ${x2.toFixed(3)},${y2.toFixed(3)}" stroke="#0D1F1F" stroke-width="0.2" fill="none"/>`);
    }
    else if (etype === 'LWPOLYLINE') {
      const f70 = codes.find(([c]) => c === 70);
      const closed = f70 ? (parseInt(f70[1]) & 1) === 1 : false;
      
      // Parse vertices sequentially: each vertex starts with code 10 (x)
      // followed by code 20 (y), then optionally code 42 (bulge)
      const verts: { x: number; y: number; bulge: number }[] = [];
      for (let k = 0; k < codes.length; k++) {
        if (codes[k][0] === 10) {
          const x = parseFloat(codes[k][1]);
          let y = 0, bulge = 0;
          // Look ahead for y (code 20) and bulge (code 42) before next vertex (code 10)
          for (let j = k + 1; j < codes.length; j++) {
            if (codes[j][0] === 10) break; // next vertex
            if (codes[j][0] === 20) y = parseFloat(codes[j][1]);
            if (codes[j][0] === 42) bulge = parseFloat(codes[j][1]);
          }
          verts.push({ x, y, bulge });
        }
      }
      
      const len = verts.length;
      if (len >= 2) {
        for (let k = 0; k < len; k++) ub(verts[k].x, verts[k].y);
        const hasBulge = verts.some(v => Math.abs(v.bulge) > 0.001);
        
        if (!hasBulge) {
          const pts = verts.map(v => `${v.x.toFixed(3)},${v.y.toFixed(3)}`).join(' ');
          svgParts.push(`<${closed ? 'polygon' : 'polyline'} points="${pts}" stroke="#0D1F1F" stroke-width="0.2" fill="${closed ? 'rgba(40,160,160,0.04)' : 'none'}"/>`);
        } else {
          let d = `M${verts[0].x.toFixed(3)},${verts[0].y.toFixed(3)}`;
          const n = closed ? len : len - 1;
          for (let k = 0; k < n; k++) {
            const v = verts[k], nv = verts[(k + 1) % len];
            if (Math.abs(v.bulge) < 0.001) {
              d += ` L${nv.x.toFixed(3)},${nv.y.toFixed(3)}`;
            } else {
              const angle = 4 * Math.atan(Math.abs(v.bulge));
              const dx = nv.x - v.x, dy = nv.y - v.y;
              const chord = Math.sqrt(dx * dx + dy * dy);
              if (chord < 0.0001 || Math.abs(Math.sin(angle / 2)) < 0.001) {
                d += ` L${nv.x.toFixed(3)},${nv.y.toFixed(3)}`;
                continue;
              }
              const radius = chord / (2 * Math.sin(angle / 2));
              const largeArc = angle > Math.PI ? 1 : 0;
              const sweep = v.bulge < 0 ? 0 : 1;
              d += ` A${radius.toFixed(3)},${radius.toFixed(3)} 0 ${largeArc},${sweep} ${nv.x.toFixed(3)},${nv.y.toFixed(3)}`;
            }
          }
          if (closed) d += ' Z';
          svgParts.push(`<path d="${d}" stroke="#0D1F1F" stroke-width="0.2" fill="${closed ? 'rgba(40,160,160,0.04)' : 'none'}"/>`);
        }
      }
    }
    else if (etype === 'SOLID') {
      const x1 = getF(10), y1 = getF(20), x2 = getF(11), y2 = getF(21);
      const x3 = getF(12), y3 = getF(22), x4 = getF(13), y4 = getF(23);
      ub(x1, y1); ub(x2, y2); ub(x3, y3); ub(x4, y4);
      svgParts.push(`<polygon points="${x1.toFixed(3)},${y1.toFixed(3)} ${x2.toFixed(3)},${y2.toFixed(3)} ${x4.toFixed(3)},${y4.toFixed(3)} ${x3.toFixed(3)},${y3.toFixed(3)}" stroke="none" fill="rgba(13,31,31,0.1)"/>`);
    }
  }

  // ═══ STRATEGY: Try ENTITIES first (direct geometry), fallback to BLOCKS ═══

  // 1. Find ENTITIES section and count direct geometry
  let entStart = -1, entEnd = -1;
  for (let i = 0; i < pairs.length - 1; i++) {
    if (pairs[i][0] === 0 && pairs[i][1] === 'SECTION' && pairs[i + 1][0] === 2 && pairs[i + 1][1] === 'ENTITIES') entStart = i + 2;
    if (entStart > 0 && entEnd < 0 && pairs[i][0] === 0 && pairs[i][1] === 'ENDSEC' && i > entStart) entEnd = i;
  }

  // Count direct geometry in ENTITIES (not INSERTs)
  let directGeoCount = 0;
  if (entStart > 0 && entEnd > 0) {
    for (let i = entStart; i < entEnd; i++) {
      if (pairs[i][0] === 0 && ['LINE', 'LWPOLYLINE', 'ARC', 'CIRCLE', 'SOLID'].includes(pairs[i][1])) directGeoCount++;
    }
  }

  console.log('[MASTRO DXF] Direct geometry in ENTITIES:', directGeoCount);

  // 2. If ENTITIES has significant direct geometry (>10), parse ONLY from there
  if (directGeoCount > 10 && entStart > 0 && entEnd > 0) {
    console.log('[MASTRO DXF] Using ENTITIES section (direct geometry)');
    for (let i = entStart; i < entEnd; i++) {
      if (pairs[i][0] === 0 && ['LINE', 'LWPOLYLINE', 'ARC', 'CIRCLE', 'SOLID'].includes(pairs[i][1])) {
        const etype = pairs[i][1];
        const codes: [number, string][] = [];
        let j = i + 1;
        while (j < entEnd && pairs[j][0] !== 0) { codes.push(pairs[j]); j++; }
        processEntity(etype, codes);
      }
    }
  } else {
    // 3. Fallback: parse from BLOCKS section
    let blocksStart = -1, blocksEnd = -1;
    for (let i = 0; i < pairs.length - 1; i++) {
      if (pairs[i][0] === 0 && pairs[i][1] === 'SECTION' && pairs[i + 1][0] === 2 && pairs[i + 1][1] === 'BLOCKS') blocksStart = i + 2;
      if (blocksStart > 0 && blocksEnd < 0 && pairs[i][0] === 0 && pairs[i][1] === 'ENDSEC' && i > blocksStart) blocksEnd = i;
    }

    if (blocksStart > 0 && blocksEnd > 0) {
      // Collect block info
      const blockInfo: Record<string, number> = {};
      let tmpBlock = '';
      for (let i = blocksStart; i < blocksEnd; i++) {
        if (pairs[i][0] === 0 && pairs[i][1] === 'BLOCK') {
          tmpBlock = '';
          for (let j = i + 1; j < blocksEnd && pairs[j][0] !== 0; j++) {
            if (pairs[j][0] === 2) { tmpBlock = pairs[j][1]; break; }
          }
          if (tmpBlock && !tmpBlock.startsWith('*')) blockInfo[tmpBlock] = 0;
        }
        if (pairs[i][0] === 0 && pairs[i][1] === 'ENDBLK') tmpBlock = '';
        if (tmpBlock && !tmpBlock.startsWith('*') && pairs[i][0] === 0 && ['LINE', 'LWPOLYLINE', 'ARC', 'CIRCLE', 'SOLID'].includes(pairs[i][1])) {
          blockInfo[tmpBlock] = (blockInfo[tmpBlock] || 0) + 1;
        }
      }

      // Choose best block: INSERT reference has ABSOLUTE priority
      let targetBlock = mainBlock;
      if (!targetBlock || !blockInfo[targetBlock] || blockInfo[targetBlock] === 0) {
        // Only fallback if INSERT block doesn't exist or has zero geometry
        const sorted = Object.entries(blockInfo).sort((a, b) => b[1] - a[1]);
        const fnMatch = sorted.find(([name]) => fileHint && name.includes(fileHint));
        if (fnMatch && fnMatch[1] > 0) {
          targetBlock = fnMatch[0];
        } else if (sorted.length > 0) {
          targetBlock = sorted[0][0];
        }
      }

      console.log('[MASTRO DXF] Using BLOCKS, target:', targetBlock, '| All:', JSON.stringify(blockInfo));

      // Parse only target block
      let curBlock = '';
      for (let i = blocksStart; i < blocksEnd; i++) {
        if (pairs[i][0] === 0 && pairs[i][1] === 'BLOCK') {
          curBlock = '';
          for (let j = i + 1; j < blocksEnd && pairs[j][0] !== 0; j++) {
            if (pairs[j][0] === 2) { curBlock = pairs[j][1]; break; }
          }
          continue;
        }
        if (pairs[i][0] === 0 && pairs[i][1] === 'ENDBLK') { curBlock = ''; continue; }
        if (curBlock !== targetBlock) continue;

        if (pairs[i][0] === 0 && ['LINE', 'LWPOLYLINE', 'ARC', 'CIRCLE', 'SOLID'].includes(pairs[i][1])) {
          const etype = pairs[i][1];
          const codes: [number, string][] = [];
          let j = i + 1;
          while (j < blocksEnd && pairs[j][0] !== 0) { codes.push(pairs[j]); j++; }
          processEntity(etype, codes);
        }
      }
    }
  }

  if (svgParts.length === 0) throw new Error('Nessuna entita geometrica trovata nel DXF');

  const pad = 2;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  const svg = `<svg viewBox="${(minX - pad).toFixed(2)} ${(minY - pad).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%"><g transform="scale(1,-1) translate(0,${(-(minY + maxY)).toFixed(2)})">${svgParts.join('')}</g></svg>`;
  
  // Return SVG + auto-calculated dimensions from bounding box (in mm)
  return {
    svg,
    width: Math.round((maxX - minX) * 10) / 10,
    height: Math.round((maxY - minY) * 10) / 10,
  };
}
