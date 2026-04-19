// @ts-nocheck
'use client';
// ═══════════════════════════════════════════════════════════════
// MASTRO — PosizionatoreLavorazioni (S21)
// Piazza lavorazioni sulla sezione del profilo con posizione
// precisa X/Y (sulla sezione) + Z (profondità nel profilo)
// + regole di posizionamento lungo il profilo (altezza, ripetizione)
// ═══════════════════════════════════════════════════════════════
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const DS = { teal: '#28A0A0', dark: '#156060', ink: '#0D1F1F', light: '#EEF8F8', border: '#C8E4E4', white: '#FFFFFF', red: '#DC4444', green: '#1A9E73', amber: '#D08008', blue: '#3B7FE0' };
const M = "'JetBrains Mono', monospace";

interface PiazzamentoLav {
  id: string;
  lavorazione_id: string;
  lavorazione_codice: string;
  profilo_id: string;
  profilo_codice: string;
  // Position on cross-section (mm from profile origin)
  sez_x: number;  // left-right on section
  sez_y: number;  // top-bottom on section
  sez_z: number;  // depth INTO profile (0 = surface, positive = deeper)
  // Position along profile length
  lungo_tipo: string;  // 'da_basso' | 'da_alto' | 'da_centro' | 'da_maniglia' | 'da_angolo'
  lungo_distanza: number; // mm from reference
  lungo_ripeti: boolean;
  lungo_ripeti_ogni: number; // mm
  lungo_ripeti_max: number; // max count (0 = unlimited, based on length)
  // Side
  lato: string; // 'interno' | 'esterno' | 'laterale_dx' | 'laterale_sx' | 'frontale'
  nota: string;
}

export default function PosizionatoreLavorazioni({ onBack }: { onBack?: () => void }) {
  const [profili, setProfili] = useState<any[]>([]);
  const [lavorazioni, setLavorazioni] = useState<any[]>([]);
  const [piazzamenti, setPiazzamenti] = useState<PiazzamentoLav[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection
  const [selProfilo, setSelProfilo] = useState<any | null>(null);
  const [selLav, setSelLav] = useState<any | null>(null);
  const [selPiazzamento, setSelPiazzamento] = useState<string | null>(null);

  // Canvas
  const [zoom, setZoom] = useState(4);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [dragging, setDragging] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    (async () => {
      const [{ data: pData, error: pErr }, { data: lData, error: lErr }] = await Promise.all([
        supabase.from('catalogo_profili').select('id,codice,fornitore,serie,tipo,sezione_svg'),
        supabase.from('catalogo_lavorazioni').select('id,codice,nome,tipo,operazioni,sezione_svg').order('codice'),
      ]);
      console.log('Profili raw:', pData?.length, 'err:', pErr);
      console.log('Lav raw:', lData?.length, 'err:', lErr);
      console.log('Profili con SVG:', (pData||[]).filter(p => p.sezione_svg).length);
      setProfili(pData || []);
      setLavorazioni(lData || []);
      setLoading(false);
    })();
  }, []);

  const screenToCanvas = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: (clientX - rect.left - rect.width / 2 - panX) / zoom,
      y: (clientY - rect.top - rect.height / 2 - panY) / zoom,
    };
  };

  const addPiazzamento = () => {
    if (!selProfilo || !selLav) return;
    const p: PiazzamentoLav = {
      id: 'pz_' + Date.now(),
      lavorazione_id: selLav.id,
      lavorazione_codice: selLav.codice,
      profilo_id: selProfilo.id,
      profilo_codice: selProfilo.codice,
      sez_x: 0, sez_y: 0, sez_z: 0,
      lungo_tipo: 'da_basso', lungo_distanza: 200,
      lungo_ripeti: false, lungo_ripeti_ogni: 400, lungo_ripeti_max: 0,
      lato: 'frontale', nota: '',
    };
    setPiazzamenti(prev => [...prev, p]);
    setSelPiazzamento(p.id);
  };

  const updatePz = (id: string, u: Partial<PiazzamentoLav>) => {
    setPiazzamenti(prev => prev.map(p => p.id === id ? { ...p, ...u } : p));
  };

  const removePz = (id: string) => {
    setPiazzamenti(prev => prev.filter(p => p.id !== id));
    if (selPiazzamento === id) setSelPiazzamento(null);
  };

  // Extract profile viewBox for rendering
  const profiloViewBox = useMemo(() => {
    if (!selProfilo?.sezione_svg) return null;
    const match = selProfilo.sezione_svg.match(/viewBox="([^"]+)"/);
    if (!match) return null;
    const [x, y, w, h] = match[1].split(/\s+/).map(Number);
    return { x, y, w, h };
  }, [selProfilo]);

  const savePiazzamenti = async () => {
    // Save as jsonb array on a junction table or on the lavorazione itself
    // For now, store on profilo as piazzamenti_lavorazioni
    if (!selProfilo) return;
    const profiloPz = piazzamenti.filter(p => p.profilo_id === selProfilo.id);
    try {
      await supabase.from('catalogo_profili').update({
        lavorazioni_piazzate: profiloPz.map(p => ({
          lavorazione_id: p.lavorazione_id, lavorazione_codice: p.lavorazione_codice,
          sez_x: p.sez_x, sez_y: p.sez_y, sez_z: p.sez_z,
          lungo_tipo: p.lungo_tipo, lungo_distanza: p.lungo_distanza,
          lungo_ripeti: p.lungo_ripeti, lungo_ripeti_ogni: p.lungo_ripeti_ogni,
          lungo_ripeti_max: p.lungo_ripeti_max, lato: p.lato, nota: p.nota,
        })),
      }).eq('id', selProfilo.id);
      alert('Piazzamenti salvati!');
    } catch (e: any) { alert('Errore: ' + e.message); }
  };

  // ── UI ──
  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden', fontFamily: "'Inter', sans-serif" }}>
      {/* LEFT — Profile section + operations overlay */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F5F5F0' }}>
        {/* Toolbar */}
        <div style={{ padding: '8px 14px', background: DS.ink, display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
          {onBack && <button onClick={onBack} style={{ background: 'none', border: 'none', color: DS.teal, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>&#8592;</button>}
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>Posizionatore</span>

          {/* Profile selector */}
          <select value={selProfilo?.id || ''} onChange={e => { const p = profili.find(x => x.id === e.target.value); setSelProfilo(p || null); setPiazzamenti([]); }}
            style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 11, maxWidth: 180 }}>
            <option value="">— Scegli profilo —</option>
            {profili.map(p => <option key={p.id} value={p.id}>{p.codice} ({p.tipo}) {p.sezione_svg ? 'SVG' : ''}</option>)}
          </select>

          {/* Lavorazione selector */}
          <select value={selLav?.id || ''} onChange={e => { const l = lavorazioni.find(x => x.id === e.target.value); setSelLav(l || null); }}
            style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', fontSize: 11, maxWidth: 180 }}>
            <option value="">— Scegli lavorazione —</option>
            {lavorazioni.map(l => <option key={l.id} value={l.id}>{l.codice} — {l.nome}</option>)}
          </select>

          <button onClick={addPiazzamento} disabled={!selProfilo || !selLav}
            style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: selProfilo && selLav ? DS.teal : '#555', color: '#fff', fontSize: 11, fontWeight: 700, cursor: selProfilo && selLav ? 'pointer' : 'default' }}>
            + Piazza lavorazione
          </button>

          <div style={{ flex: 1 }} />
          <button onClick={savePiazzamenti} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: DS.green, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 0 #157a5a` }}>
            Salva
          </button>
        </div>

        {/* Canvas — profile section with lavorazioni overlay */}
        <svg ref={svgRef} style={{ flex: 1, width: '100%', background: '#F5F5F0', cursor: dragging ? 'grabbing' : 'default' }}
          onWheel={e => setZoom(z => Math.max(1, Math.min(20, z * (e.deltaY < 0 ? 1.1 : 0.9))))}
          onMouseMove={e => {
            if (dragging) {
              const pt = screenToCanvas(e.clientX, e.clientY);
              updatePz(dragging, { sez_x: Math.round(pt.x * 2) / 2, sez_y: Math.round(pt.y * 2) / 2 });
            }
          }}
          onMouseUp={() => setDragging(null)}
          onMouseDown={e => {
            if (!e.target?.closest?.('[data-pz]')) {
              // Pan canvas
            }
          }}
        >
          <g transform={`translate(${svgRef.current ? svgRef.current.clientWidth / 2 : 400}, ${svgRef.current ? svgRef.current.clientHeight / 2 : 300}) scale(${zoom})`}>
            <g transform={`translate(${panX / zoom}, ${panY / zoom})`}>
              {/* Grid */}
              {Array.from({ length: 41 }, (_, i) => i * 5 - 100).map(v => (
                <React.Fragment key={v}>
                  <line x1={v} y1={-100} x2={v} y2={100} stroke="#e0e0e0" strokeWidth={0.08} />
                  <line x1={-100} y1={v} x2={100} y2={v} stroke="#e0e0e0" strokeWidth={0.08} />
                </React.Fragment>
              ))}

              {/* Profile section SVG */}
              {selProfilo?.sezione_svg && (
                <g dangerouslySetInnerHTML={{ __html: extractSVGContent(selProfilo.sezione_svg) }} />
              )}

              {/* Piazzamenti — draggable markers */}
              {piazzamenti.filter(p => p.profilo_id === selProfilo?.id).map(pz => {
                const sel = selPiazzamento === pz.id;
                const lav = lavorazioni.find(l => l.id === pz.lavorazione_id);
                const ops = lav?.operazioni || [];
                return (
                  <g key={pz.id} data-pz={pz.id}
                    onMouseDown={e => { e.stopPropagation(); setDragging(pz.id); setSelPiazzamento(pz.id); }}
                    style={{ cursor: 'grab' }}>
                    {/* Render each operation offset from piazzamento position */}
                    {ops.map((op: any, i: number) => {
                      const ox = pz.sez_x + (op.x || 0);
                      const oy = pz.sez_y + (op.y || 0);
                      if (op.tipo === 'foro') {
                        const r = (op.diametro || 10) / 2;
                        return (
                          <g key={i}>
                            <circle cx={ox} cy={oy} r={r} fill={sel ? DS.blue + '40' : DS.blue + '20'} stroke={DS.blue} strokeWidth={sel ? 0.4 : 0.2} />
                            <line x1={ox - r * 0.4} y1={oy} x2={ox + r * 0.4} y2={oy} stroke={DS.blue} strokeWidth={0.1} />
                            <line x1={ox} y1={oy - r * 0.4} x2={ox} y2={oy + r * 0.4} stroke={DS.blue} strokeWidth={0.1} />
                          </g>
                        );
                      }
                      if (op.tipo === 'fresa_rett' || op.tipo === 'scasso') {
                        const w = op.larghezza || 25, h = op.altezza || 10;
                        const col = op.tipo === 'scasso' ? DS.amber : DS.teal;
                        return <rect key={i} x={ox - w / 2} y={oy - h / 2} width={w} height={h} fill={sel ? col + '40' : col + '20'} stroke={col} strokeWidth={sel ? 0.4 : 0.2} rx={0.3} />;
                      }
                      if (op.tipo === 'fresa_circ') {
                        return <circle key={i} cx={ox} cy={oy} r={(op.diametro || 20) / 2} fill={sel ? DS.green + '40' : DS.green + '20'} stroke={DS.green} strokeWidth={sel ? 0.4 : 0.2} />;
                      }
                      return null;
                    })}
                    {/* Center marker */}
                    <circle cx={pz.sez_x} cy={pz.sez_y} r={sel ? 1.5 : 1} fill={DS.red} opacity={0.8} />
                    {/* Label */}
                    <text x={pz.sez_x + 2} y={pz.sez_y - 2} fontSize={2} fill={DS.ink} fontFamily={M} fontWeight="700">{pz.lavorazione_codice}</text>
                    <text x={pz.sez_x + 2} y={pz.sez_y + 3} fontSize={1.5} fill="#999" fontFamily={M}>({pz.sez_x},{pz.sez_y}) Z:{pz.sez_z}</text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* RIGHT — Piazzamento properties */}
      <div style={{ width: 300, background: DS.white, borderLeft: `1.5px solid ${DS.border}`, overflow: 'auto' }}>
        {!selProfilo ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#ccc', fontSize: 13 }}>Scegli un profilo dalla barra</div>
        ) : piazzamenti.filter(p => p.profilo_id === selProfilo.id).length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#ccc', fontSize: 12 }}>
            Scegli una lavorazione e premi<br />"+ Piazza lavorazione"
          </div>
        ) : (<>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${DS.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: DS.ink }}>Profilo: {selProfilo.codice}</div>
            <div style={{ fontSize: 10, color: '#999' }}>{piazzamenti.filter(p => p.profilo_id === selProfilo.id).length} lavorazioni piazzate</div>
          </div>

          {piazzamenti.filter(p => p.profilo_id === selProfilo.id).map(pz => {
            const sel = selPiazzamento === pz.id;
            return (
              <div key={pz.id} onClick={() => setSelPiazzamento(pz.id)}
                style={{ padding: '10px 14px', borderBottom: `1px solid ${DS.border}`, background: sel ? DS.teal + '05' : DS.white, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: sel ? 8 : 0 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: DS.blue, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: DS.ink, flex: 1 }}>{pz.lavorazione_codice}</span>
                  <button onClick={e => { e.stopPropagation(); removePz(pz.id); }}
                    style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14 }}
                    onMouseOver={e => (e.currentTarget.style.color = DS.red)} onMouseOut={e => (e.currentTarget.style.color = '#ccc')}>&times;</button>
                </div>

                {sel && (<>
                  {/* Position on section */}
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Posizione sulla sezione</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 8, color: '#999' }}>X mm</label>
                      <input type="number" value={pz.sez_x} step={0.5} onChange={e => updatePz(pz.id, { sez_x: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '5px', border: `1.5px solid ${DS.border}`, borderRadius: 4, fontSize: 12, fontFamily: M, fontWeight: 700, boxSizing: 'border-box', textAlign: 'center' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 8, color: '#999' }}>Y mm</label>
                      <input type="number" value={pz.sez_y} step={0.5} onChange={e => updatePz(pz.id, { sez_y: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '5px', border: `1.5px solid ${DS.border}`, borderRadius: 4, fontSize: 12, fontFamily: M, fontWeight: 700, boxSizing: 'border-box', textAlign: 'center' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 8, color: '#999' }}>Z prof.</label>
                      <input type="number" value={pz.sez_z} step={0.5} onChange={e => updatePz(pz.id, { sez_z: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '5px', border: `1.5px solid ${DS.border}`, borderRadius: 4, fontSize: 12, fontFamily: M, fontWeight: 700, boxSizing: 'border-box', textAlign: 'center' }} />
                    </div>
                  </div>

                  {/* Position along profile */}
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase', marginBottom: 4 }}>Posizione lungo il profilo</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 4 }}>
                    <div>
                      <label style={{ fontSize: 8, color: '#999' }}>Riferimento</label>
                      <select value={pz.lungo_tipo} onChange={e => updatePz(pz.id, { lungo_tipo: e.target.value })}
                        style={{ width: '100%', padding: '5px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 10, boxSizing: 'border-box' }}>
                        <option value="da_basso">Dal basso</option>
                        <option value="da_alto">Dall'alto</option>
                        <option value="da_centro">Dal centro</option>
                        <option value="da_maniglia">Da altezza maniglia</option>
                        <option value="da_angolo">Da angolo</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 8, color: '#999' }}>Distanza mm</label>
                      <input type="number" value={pz.lungo_distanza} onChange={e => updatePz(pz.id, { lungo_distanza: parseFloat(e.target.value) || 0 })}
                        style={{ width: '100%', padding: '5px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 12, fontFamily: M, fontWeight: 700, boxSizing: 'border-box', textAlign: 'center' }} />
                    </div>
                  </div>

                  {/* Ripetizione */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <input type="checkbox" checked={pz.lungo_ripeti} onChange={e => updatePz(pz.id, { lungo_ripeti: e.target.checked })} />
                    <label style={{ fontSize: 10, color: '#666' }}>Ripeti ogni</label>
                    {pz.lungo_ripeti && (<>
                      <input type="number" value={pz.lungo_ripeti_ogni} onChange={e => updatePz(pz.id, { lungo_ripeti_ogni: parseFloat(e.target.value) || 0 })}
                        style={{ width: 55, padding: '4px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 11, fontFamily: M, textAlign: 'center' }} />
                      <span style={{ fontSize: 9, color: '#999' }}>mm</span>
                    </>)}
                  </div>

                  {/* Lato */}
                  <div style={{ marginBottom: 4 }}>
                    <label style={{ fontSize: 8, color: '#999' }}>Lato</label>
                    <select value={pz.lato} onChange={e => updatePz(pz.id, { lato: e.target.value })}
                      style={{ width: '100%', padding: '5px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 10, boxSizing: 'border-box' }}>
                      <option value="frontale">Frontale</option>
                      <option value="interno">Interno</option>
                      <option value="esterno">Esterno</option>
                      <option value="laterale_dx">Laterale DX</option>
                      <option value="laterale_sx">Laterale SX</option>
                    </select>
                  </div>

                  <textarea placeholder="Note..." value={pz.nota} onChange={e => updatePz(pz.id, { nota: e.target.value })} rows={2}
                    style={{ width: '100%', padding: '6px', border: `1px solid ${DS.border}`, borderRadius: 4, fontSize: 10, boxSizing: 'border-box', resize: 'vertical' }} />
                </>)}
              </div>
            );
          })}
        </>)}
      </div>
    </div>
  );
}

function extractSVGContent(svgString: string): string {
  if (!svgString) return '';
  return svgString.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');
}
