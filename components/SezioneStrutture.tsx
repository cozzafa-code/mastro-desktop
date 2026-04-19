"use client";
// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react"


/* ══════════════════════════════════════════════════════════════
   MASTRO STRUTTURE — Componente per MASTRO ERP
   Va sotto la sezione "Disegno Tecnico" esistente
   Pianta → Lati → 3D per Pergole, Verande, Box, Ferro
   ══════════════════════════════════════════════════════════════ */

/* ─── Design System MASTRO ─────────────────────────────────── */
const C = {
  bg: "#F2F1EC",
  amber: "#D08008",
  amberL: "rgba(208,128,8,0.08)",
  amberL2: "rgba(208,128,8,0.18)",
  green: "#1A9E73",
  greenL: "rgba(26,158,115,0.08)",
  red: "#DC4444",
  redL: "rgba(220,68,68,0.08)",
  blue: "#3B7FE0",
  blueL: "rgba(59,127,224,0.08)",
  card: "#FFFFFF",
  bdr: "#E2E0DA",
  text: "#1A1A1C",
  sub: "#6B6860",
  sub2: "#9B978E",
  r: 8,
}
const FM = "'JetBrains Mono', monospace"
const FB = "'Inter', system-ui, sans-serif"

/* ─── Tipi struttura ───────────────────────────────────────── */
const TIPI_STRUTTURA = [
  { id: "pergola", n: "Pergola Bioclimatica", icon: "☀️", dW: 4000, dD: 3000, dH: 2800, col: "#3A4048", roof: "lamelle" },
  { id: "veranda", n: "Veranda Balcone", icon: "🏠", dW: 3000, dD: 2000, dH: 2500, col: "#E8E4DA", roof: "vetro" },
  { id: "ferro", n: "Struttura Ferro", icon: "🔩", dW: 3000, dD: 2500, dH: 2700, col: "#2C2C2C", roof: "none" },
  { id: "box_alu", n: "Box Alluminio", icon: "📦", dW: 2000, dD: 1000, dH: 2200, col: "#A0A0A0", roof: "pannello" },
  { id: "box_doccia", n: "Box Doccia", icon: "🚿", dW: 1200, dD: 800, dH: 2100, col: "#D0D0D0", roof: "none" },
  { id: "caldaia", n: "Box Caldaia", icon: "🔥", dW: 1000, dD: 800, dH: 2000, col: "#8B8680", roof: "pannello" },
  { id: "cancello", n: "Cancello / Recinzione", icon: "🚪", dW: 4000, dD: 100, dH: 1800, col: "#1A1A1A", roof: "none" },
  { id: "armadio", n: "Armadio Esterno", icon: "🗄️", dW: 1800, dD: 600, dH: 2200, col: "#B0B0B0", roof: "pannello" },
]

/* ─── Elementi per lati ────────────────────────────────────── */
const ELEMENTI = [
  { id: "vetro_fisso", n: "Vetro Fisso", icon: "▫️", col: "#A8D8EA", op: 0.35 },
  { id: "vetro_scorr", n: "Scorrevole", icon: "↔️", col: "#7BC8F6", op: 0.35 },
  { id: "porta", n: "Porta", icon: "🚪", col: "#C4A882", op: 0.7 },
  { id: "pannello", n: "Pannello", icon: "▪️", col: "#8B8680", op: 0.85 },
  { id: "lamelle", n: "Lamelle", icon: "☰", col: "#A0A0A0", op: 0.6 },
  { id: "persiana", n: "Persiana", icon: "▤", col: "#6B8E6B", op: 0.7 },
  { id: "rete", n: "Zanzariera", icon: "▦", col: "#D0D0D0", op: 0.3 },
  { id: "griglia", n: "Griglia Areazione", icon: "⊞", col: "#999999", op: 0.5 },
  { id: "vuoto", n: "Aperto", icon: "○", col: "transparent", op: 0 },
]

/* ─── Colori struttura ─────────────────────────────────────── */
const COLORI = [
  { n: "Antracite 7016", h: "#3A4048" },
  { n: "Bianco 9010", h: "#EDE9DF" },
  { n: "Nero 9005", h: "#151518" },
  { n: "Marrone 8017", h: "#46342E" },
  { n: "Grigio 7035", h: "#BFC1BE" },
  { n: "Verde 6005", h: "#104538" },
  { n: "Corten", h: "#8B4513" },
  { n: "Noce", h: "#7D5D3C" },
]

/* ─── Utility ──────────────────────────────────────────────── */
function uid() { return "st" + Math.random().toString(36).slice(2, 9) }

/* ─── Calcola lati dalla pianta ────────────────────────────── */
function computeLati(s: any) {
  if (!s) return s
  const pts = s.pianta
  const lati = pts.map((p: any, i: number) => {
    const nx = pts[(i + 1) % pts.length]
    const dx = nx.x - p.x
    const dy = nx.y - p.y
    const lung = Math.round(Math.sqrt(dx * dx + dy * dy))
    const ex = s.lati && s.lati[i] ? s.lati[i] : null
    return {
      id: ex ? ex.id : uid(),
      nome: ex ? ex.nome : "Lato " + (i + 1),
      lunghezza: lung,
      altezza: s.H,
      elementi: ex ? ex.elementi : [],
      fromPt: p,
      toPt: nx,
    }
  })
  return { ...s, lati: lati }
}


/* ═════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPALE — SezioneStrutture
   ═════════════════════════════════════════════════════════════ */
export default function SezioneStrutture({ commessaId, onSave }: { commessaId?: string, onSave?: (data: any) => void }) {
  const [open, setOpen] = useState(false)
  const [fase, setFase] = useState("tipo")
  const [tipoSel, setTipoSel] = useState<any>(null)
  const [str, setStr] = useState<any>(null)

  function initStruttura(tipoId: string) {
    const t = TIPI_STRUTTURA.find(x => x.id === tipoId)
    if (!t) return
    setTipoSel(t)
    setStr({
      id: uid(),
      tipo: tipoId,
      W: t.dW,
      D: t.dD,
      H: t.dH,
      colStruct: t.col,
      roofType: t.roof,
      pianta: [
        { x: 0, y: 0 },
        { x: t.dW, y: 0 },
        { x: t.dW, y: t.dD },
        { x: 0, y: t.dD },
      ],
      lati: [],
    })
    setFase("pianta")
  }

  function upd(fn: any) {
    setStr((prev: any) => {
      const next = typeof fn === "function" ? fn(prev) : fn
      return computeLati(next)
    })
  }

  useEffect(() => {
    if (str && str.lati && str.lati.length === 0) {
      setStr(computeLati(str))
    }
  }, [str?.pianta?.length])

  return (
    <div style={{ marginTop: 16 }}>

      {/* ── Header collassabile ── */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: 10, padding: "14px 16px",
          background: "linear-gradient(135deg, rgba(59,127,224,0.08), rgba(59,127,224,0.03))",
          borderRadius: open ? C.r + "px " + C.r + "px 0 0" : C.r + "px",
          cursor: "pointer", border: "1px solid rgba(59,127,224,0.18)",
        }}
      >
        <span style={{ fontSize: 20 }}>🏗️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.blue, fontFamily: FB }}>Strutture</div>
          <div style={{ fontSize: 11, color: C.sub }}>Pergole, Verande, Box, Ferro — Pianta + Lati + 3D</div>
        </div>
        {str && tipoSel && (
          <span style={{
            fontSize: 11, fontFamily: FM, color: C.blue,
            background: C.blueL, padding: "3px 8px", borderRadius: 6,
          }}>
            {tipoSel.icon} {str.W}×{str.D}×{str.H}mm
          </span>
        )}
        <span style={{
          fontSize: 12, color: C.sub,
          transform: open ? "rotate(180deg)" : "none",
          transition: "transform 0.2s",
        }}>▼</span>
      </div>

      {/* ── Contenuto espanso ── */}
      {open && (
        <div style={{
          border: "1px solid " + C.bdr, borderTop: "none",
          borderRadius: "0 0 " + C.r + "px " + C.r + "px",
          background: C.card, overflow: "hidden",
        }}>

          {/* Tab fasi */}
          {str && (
            <div style={{ display: "flex", borderBottom: "1px solid " + C.bdr, background: C.bg }}>
              {[
                { k: "tipo", l: "Tipo" },
                { k: "pianta", l: "Pianta" },
                { k: "lati", l: "Lati" },
                { k: "3d", l: "3D Render" },
              ].map(f => (
                <button
                  key={f.k}
                  onClick={() => setFase(f.k)}
                  style={{
                    flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 700, fontFamily: FB,
                    background: fase === f.k ? C.card : "transparent",
                    color: fase === f.k ? C.amber : C.sub,
                    borderBottom: fase === f.k ? "2px solid " + C.amber : "2px solid transparent",
                  }}
                >
                  {f.l}
                </button>
              ))}
            </div>
          )}

          {/* ── FASE TIPO ── */}
          {fase === "tipo" && (
            <div style={{ padding: 16 }}>
              <div style={{
                fontSize: 12, fontWeight: 700, color: C.sub,
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 12,
              }}>
                Cosa vuoi progettare?
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {TIPI_STRUTTURA.map(t => (
                  <button
                    key={t.id}
                    onClick={() => initStruttura(t.id)}
                    style={{
                      padding: "16px 8px", borderRadius: C.r, cursor: "pointer",
                      border: tipoSel?.id === t.id ? "2px solid " + C.amber : "1.5px solid " + C.bdr,
                      background: tipoSel?.id === t.id ? C.amberL : C.card,
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{t.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, textAlign: "center", fontFamily: FB }}>{t.n}</span>
                    <span style={{ fontSize: 9, color: C.sub, fontFamily: FM }}>{t.dW}×{t.dD}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── FASE PIANTA ── */}
          {fase === "pianta" && str && (
            <PiantaEditor str={str} tipo={tipoSel} upd={upd} goLati={() => setFase("lati")} />
          )}

          {/* ── FASE LATI ── */}
          {fase === "lati" && str && (
            <LatiEditor str={str} tipo={tipoSel} upd={upd} go3d={() => setFase("3d")} />
          )}

          {/* ── FASE 3D ── */}
          {fase === "3d" && str && (
            <Render3D str={str} tipo={tipoSel} />
          )}

        </div>
      )}
    </div>
  )
}


/* ═════════════════════════════════════════════════════════════
   PIANTA EDITOR — Vista dall'alto, drag vertici, quote
   ═════════════════════════════════════════════════════════════ */
function PiantaEditor({ str, tipo, upd, goLati }: any) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [editDim, setEditDim] = useState<any>(null)

  const pts = str.pianta
  const sc = 0.1
  const pad = 70

  const minX = Math.min(...pts.map((p: any) => p.x))
  const maxX = Math.max(...pts.map((p: any) => p.x))
  const minY = Math.min(...pts.map((p: any) => p.y))
  const maxY = Math.max(...pts.map((p: any) => p.y))
  const svgW = (maxX - minX) * sc + pad * 2
  const svgH = (maxY - minY) * sc + pad * 2

  function toS(p: any) {
    return { x: (p.x - minX) * sc + pad, y: (p.y - minY) * sc + pad }
  }

  function onDown(idx: number, e: React.MouseEvent) {
    e.preventDefault()
    setDragIdx(idx)
  }

  const onMove = useCallback((e: MouseEvent) => {
    if (dragIdx === null) return
    const r = svgRef.current?.getBoundingClientRect()
    if (!r) return
    const mx = (e.clientX - r.left - pad) / sc + minX
    const my = (e.clientY - r.top - pad) / sc + minY
    const snap = { x: Math.round(mx / 50) * 50, y: Math.round(my / 50) * 50 }
    upd((prev: any) => {
      const np = [...prev.pianta]
      np[dragIdx] = snap
      const xs = np.map((p: any) => p.x)
      const ys = np.map((p: any) => p.y)
      return {
        ...prev,
        pianta: np,
        W: Math.max(...xs) - Math.min(...xs),
        D: Math.max(...ys) - Math.min(...ys),
      }
    })
  }, [dragIdx, sc, minX, minY, pad, upd])

  const onUp = useCallback(() => { setDragIdx(null) }, [])

  useEffect(() => {
    if (dragIdx !== null) {
      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
      return () => {
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }
    }
  }, [dragIdx, onMove, onUp])

  function addPt(idx: number) {
    const p1 = pts[idx]
    const p2 = pts[(idx + 1) % pts.length]
    upd((prev: any) => {
      const np = [...prev.pianta]
      np.splice(idx + 1, 0, {
        x: Math.round((p1.x + p2.x) / 2 / 50) * 50,
        y: Math.round((p1.y + p2.y) / 2 / 50) * 50,
      })
      return { ...prev, pianta: np }
    })
  }

  function rmPt(idx: number) {
    if (pts.length <= 3) return
    upd((prev: any) => ({
      ...prev,
      pianta: prev.pianta.filter((_: any, i: number) => i !== idx),
    }))
  }

  function applyDim(idx: number, val: number) {
    if (!val || isNaN(val)) { setEditDim(null); return }
    const p1 = pts[idx]
    const p2 = pts[(idx + 1) % pts.length]
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const oldL = Math.sqrt(dx * dx + dy * dy)
    if (!oldL) { setEditDim(null); return }
    const ratio = val / oldL
    upd((prev: any) => {
      const np = [...prev.pianta]
      np[(idx + 1) % np.length] = {
        x: Math.round((p1.x + dx * ratio) / 50) * 50,
        y: Math.round((p1.y + dy * ratio) / 50) * 50,
      }
      return { ...prev, pianta: np }
    })
    setEditDim(null)
  }

  function setShape(shape: string) {
    const W = str.W
    const D = str.D
    let newPts: any[] = []
    if (shape === "rect") {
      newPts = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: D }, { x: 0, y: D }]
    } else if (shape === "L") {
      newPts = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: D * 0.6 }, { x: W * 0.5, y: D * 0.6 }, { x: W * 0.5, y: D }, { x: 0, y: D }]
    } else if (shape === "U") {
      newPts = [{ x: 0, y: 0 }, { x: W, y: 0 }, { x: W, y: D }, { x: W * 0.7, y: D }, { x: W * 0.7, y: D * 0.4 }, { x: W * 0.3, y: D * 0.4 }, { x: W * 0.3, y: D }, { x: 0, y: D }]
    } else if (shape === "trap") {
      newPts = [{ x: W * 0.1, y: 0 }, { x: W * 0.9, y: 0 }, { x: W, y: D }, { x: 0, y: D }]
    }
    upd((prev: any) => ({
      ...prev,
      pianta: newPts.map(p => ({
        x: Math.round(p.x / 50) * 50,
        y: Math.round(p.y / 50) * 50,
      })),
    }))
  }

  return (
    <div style={{ display: "flex", minHeight: 420 }}>

      {/* Pannello sinistro */}
      <div style={{
        width: 230, borderRight: "1px solid " + C.bdr, padding: 14,
        display: "flex", flexDirection: "column", gap: 14, overflowY: "auto",
      }}>
        {/* Tipo selezionato */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 22 }}>{tipo?.icon}</span>
          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: FB }}>{tipo?.n}</div>
        </div>

        {/* Dimensioni */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Dimensioni
          </div>
          {[
            { k: "W", l: "Largh." },
            { k: "D", l: "Prof." },
            { k: "H", l: "Alt." },
          ].map(d => (
            <div key={d.k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: C.sub, width: 40 }}>{d.l}</span>
              <input
                type="number"
                value={str[d.k]}
                step={50}
                onChange={e => {
                  const v = parseInt(e.target.value) || 0
                  upd((prev: any) => {
                    const rW = d.k === "W" ? v / prev.W : 1
                    const rD = d.k === "D" ? v / prev.D : 1
                    return {
                      ...prev,
                      [d.k]: v,
                      pianta: prev.pianta.map((p: any) => ({
                        x: Math.round(p.x * rW / 50) * 50,
                        y: Math.round(p.y * rD / 50) * 50,
                      })),
                    }
                  })
                }}
                style={{
                  flex: 1, padding: "4px 6px", borderRadius: 5,
                  border: "1px solid " + C.bdr, fontSize: 12,
                  fontFamily: FM, textAlign: "right",
                }}
              />
              <span style={{ fontSize: 9, color: C.sub2 }}>mm</span>
            </div>
          ))}
        </div>

        {/* Forme preset */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Forma
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
            {[
              { k: "rect", l: "▭ Rettangolo" },
              { k: "L", l: "⌐ Forma L" },
              { k: "U", l: "⊔ Forma U" },
              { k: "trap", l: "⏢ Trapezio" },
            ].map(s => (
              <button
                key={s.k}
                onClick={() => setShape(s.k)}
                style={{
                  padding: "6px 4px", borderRadius: 5,
                  border: "1px solid " + C.bdr, background: C.bg,
                  cursor: "pointer", fontSize: 10, fontWeight: 600, color: C.sub,
                }}
              >
                {s.l}
              </button>
            ))}
          </div>
        </div>

        {/* Colore struttura */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
            Colore
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
            {COLORI.map(c => (
              <button
                key={c.h}
                onClick={() => upd((prev: any) => ({ ...prev, colStruct: c.h }))}
                title={c.n}
                style={{
                  width: 30, height: 30, borderRadius: 6, background: c.h, cursor: "pointer",
                  border: str.colStruct === c.h ? "3px solid " + C.amber : "2px solid " + C.bdr,
                }}
              />
            ))}
          </div>
        </div>

        {/* Copertura */}
        {tipo?.roof !== "none" && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Copertura
            </div>
            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              {["lamelle", "vetro", "pannello", "policarbonato", "none"].map(r => (
                <button
                  key={r}
                  onClick={() => upd((prev: any) => ({ ...prev, roofType: r }))}
                  style={{
                    padding: "4px 8px", borderRadius: 5, fontSize: 9, fontWeight: 600, cursor: "pointer",
                    border: str.roofType === r ? "2px solid " + C.amber : "1px solid " + C.bdr,
                    background: str.roofType === r ? C.amberL : C.bg,
                    color: str.roofType === r ? C.amber : C.sub,
                    textTransform: "capitalize",
                  }}
                >
                  {r === "none" ? "Nessuna" : r}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ flex: 1 }} />

        <button
          onClick={goLati}
          style={{
            padding: "10px", borderRadius: C.r, border: "none",
            background: C.amber, color: "#fff", fontSize: 13,
            fontWeight: 700, cursor: "pointer", fontFamily: FB,
          }}
        >
          Avanti → Lati
        </button>
      </div>

      {/* SVG Canvas pianta */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        background: "#FAFAF5", overflow: "auto", position: "relative",
      }}>
        <div style={{
          position: "absolute", top: 8, left: 10,
          fontSize: 10, color: C.sub, fontFamily: FM,
        }}>
          PIANTA · Griglia 50mm · Trascina vertici · Doppio-click elimina · Click lato aggiunge punto
        </div>

        <svg
          ref={svgRef}
          width={Math.max(svgW, 420)}
          height={Math.max(svgH, 340)}
          style={{ cursor: dragIdx !== null ? "grabbing" : "default" }}
        >
          {/* Griglia */}
          <defs>
            <pattern id="g50s" width={50 * sc} height={50 * sc} patternUnits="userSpaceOnUse">
              <path d={"M " + (50 * sc) + " 0 L 0 0 0 " + (50 * sc)} fill="none" stroke="#E0DDD5" strokeWidth={0.4} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g50s)" />

          {/* Forma pianta */}
          <polygon
            points={pts.map((p: any) => { const s = toS(p); return s.x + "," + s.y }).join(" ")}
            fill={str.colStruct + "18"}
            stroke={str.colStruct}
            strokeWidth={2.5}
          />

          {/* Lati con quote */}
          {pts.map((p: any, i: number) => {
            const next = pts[(i + 1) % pts.length]
            const s1 = toS(p)
            const s2 = toS(next)
            const mx = (s1.x + s2.x) / 2
            const my = (s1.y + s2.y) / 2
            const dx = s2.x - s1.x
            const dy = s2.y - s1.y
            const len = Math.round(Math.sqrt((next.x - p.x) ** 2 + (next.y - p.y) ** 2))
            const nx = -dy
            const ny = dx
            const nl = Math.sqrt(nx * nx + ny * ny) || 1
            const tx = mx + (nx / nl) * 20
            const ty = my + (ny / nl) * 20
            const angle = Math.atan2(dy, dx) * 180 / Math.PI
            const da = (angle > 90 || angle < -90) ? angle + 180 : angle

            return (
              <g key={"d" + i}>
                <line x1={s1.x} y1={s1.y} x2={s2.x} y2={s2.y} stroke={C.amber} strokeWidth={0.8} strokeDasharray="3,2" opacity={0.5} />

                {/* Quota editabile */}
                <g
                  transform={"translate(" + tx + "," + ty + ") rotate(" + da + ")"}
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditDim({ idx: i })}
                >
                  <rect x={-26} y={-9} width={52} height={18} rx={4} fill={C.card} stroke={C.amber} strokeWidth={0.8} />
                  {editDim?.idx === i ? (
                    <foreignObject x={-24} y={-8} width={48} height={16}>
                      <input
                        autoFocus
                        type="number"
                        defaultValue={len}
                        style={{
                          width: "100%", height: "100%", border: "none",
                          background: "transparent", textAlign: "center",
                          fontSize: 9, fontFamily: FM, fontWeight: 700, color: C.amber,
                        }}
                        onBlur={(e) => applyDim(i, parseInt(e.target.value))}
                        onKeyDown={(e) => { if (e.key === "Enter") applyDim(i, parseInt((e.target as HTMLInputElement).value)) }}
                      />
                    </foreignObject>
                  ) : (
                    <text textAnchor="middle" dy={3.5} fontSize={9} fontFamily={FM} fontWeight={700} fill={C.amber}>
                      {len}
                    </text>
                  )}
                </g>

                {/* Label lato */}
                <text x={mx} y={my} textAnchor="middle" dy={-6} fontSize={7} fill={C.sub2} fontFamily={FM}>
                  L{i + 1}
                </text>

                {/* + su lato per aggiungere punto */}
                <circle
                  cx={mx} cy={my} r={5} fill={C.green} opacity={0}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => (e.target as SVGCircleElement).setAttribute("opacity", "0.8")}
                  onMouseLeave={(e) => (e.target as SVGCircleElement).setAttribute("opacity", "0")}
                  onClick={(e) => { e.stopPropagation(); addPt(i) }}
                />
              </g>
            )
          })}

          {/* Vertici trascinabili */}
          {pts.map((p: any, i: number) => {
            const s = toS(p)
            return (
              <g key={"v" + i}>
                <circle
                  cx={s.x} cy={s.y} r={dragIdx === i ? 9 : 6}
                  fill={dragIdx === i ? C.amber : C.card}
                  stroke={C.amber} strokeWidth={2}
                  style={{ cursor: "grab" }}
                  onMouseDown={(e) => onDown(i, e)}
                  onDoubleClick={() => rmPt(i)}
                />
                <text
                  x={s.x} y={s.y + 3} textAnchor="middle"
                  fontSize={7} fontFamily={FM} fontWeight={700}
                  fill={dragIdx === i ? "#fff" : C.amber}
                  style={{ pointerEvents: "none" }}
                >
                  {i + 1}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}


/* ═════════════════════════════════════════════════════════════
   LATI EDITOR — Per ogni lato inserisci elementi
   ═════════════════════════════════════════════════════════════ */
function LatiEditor({ str, tipo, upd, go3d }: any) {
  const [selL, setSelL] = useState(0)
  const [addMode, setAddMode] = useState<string | null>(null)

  const lato = str.lati[selL]
  if (!lato) return null

  const scX = 0.13
  const scY = 0.13
  const sW = lato.lunghezza * scX
  const sH = lato.altezza * scY
  const px = 50
  const py = 40

  function addEl(tipoEl: string, mx: number) {
    upd((prev: any) => {
      const nl = [...prev.lati]
      const l = { ...nl[selL] }
      const w = Math.round(lato.lunghezza * 0.25 / 50) * 50
      l.elementi = [
        ...l.elementi,
        { id: uid(), tipo: tipoEl, x: mx || 200, y: 0, w: w, h: lato.altezza },
      ]
      nl[selL] = l
      return { ...prev, lati: nl }
    })
    setAddMode(null)
  }

  function rmEl(elId: string) {
    upd((prev: any) => {
      const nl = [...prev.lati]
      const l = { ...nl[selL] }
      l.elementi = l.elementi.filter((e: any) => e.id !== elId)
      nl[selL] = l
      return { ...prev, lati: nl }
    })
  }

  function updEl(elId: string, ch: any) {
    upd((prev: any) => {
      const nl = [...prev.lati]
      const l = { ...nl[selL] }
      l.elementi = l.elementi.map((e: any) => e.id === elId ? { ...e, ...ch } : e)
      nl[selL] = l
      return { ...prev, lati: nl }
    })
  }

  function svgClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!addMode) return
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = Math.round(((e.clientX - rect.left - px) / scX) / 50) * 50
    addEl(addMode, Math.max(0, mx))
  }

  return (
    <div style={{ display: "flex", minHeight: 420 }}>

      {/* Lista lati */}
      <div style={{ width: 200, borderRight: "1px solid " + C.bdr, overflowY: "auto" }}>
        <div style={{
          padding: "12px 12px 6px", fontSize: 10, fontWeight: 700,
          color: C.sub, textTransform: "uppercase", letterSpacing: 1,
        }}>
          Lati ({str.lati.length})
        </div>
        {str.lati.map((l: any, i: number) => (
          <div
            key={l.id}
            onClick={() => setSelL(i)}
            style={{
              padding: "10px 12px", cursor: "pointer",
              borderLeft: "3px solid " + (selL === i ? C.amber : "transparent"),
              background: selL === i ? C.amberL : "transparent",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, fontFamily: FB }}>{l.nome}</div>
            <div style={{ fontSize: 10, color: C.sub, fontFamily: FM }}>
              {l.lunghezza}mm · {l.elementi.length} el.
            </div>
          </div>
        ))}

        {/* Mini pianta */}
        <div style={{ padding: 12 }}>
          <svg width={160} height={100}
            viewBox={"-5 -5 " + (str.W * 0.035 + 10) + " " + (str.D * 0.035 + 10)}
          >
            <polygon
              points={str.pianta.map((p: any) => (p.x * 0.035) + "," + (p.y * 0.035)).join(" ")}
              fill="#f5f4ef" stroke={C.sub} strokeWidth={0.8}
            />
            {str.pianta.map((p: any, i: number) => {
              const nx = str.pianta[(i + 1) % str.pianta.length]
              return (
                <line
                  key={i}
                  x1={p.x * 0.035} y1={p.y * 0.035}
                  x2={nx.x * 0.035} y2={nx.y * 0.035}
                  stroke={selL === i ? C.amber : C.sub}
                  strokeWidth={selL === i ? 2.5 : 0.8}
                  style={{ cursor: "pointer" }}
                  onClick={(e) => { e.stopPropagation(); setSelL(i) }}
                />
              )
            })}
          </svg>
        </div>

        <div style={{ padding: "0 12px 12px" }}>
          <button
            onClick={go3d}
            style={{
              width: "100%", padding: "10px", borderRadius: C.r,
              border: "none", background: C.amber, color: "#fff",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FB,
            }}
          >
            Avanti → 3D
          </button>
        </div>
      </div>

      {/* Editor lato */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Toolbar elementi */}
        <div style={{
          padding: "8px 12px", borderBottom: "1px solid " + C.bdr,
          background: C.bg, display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center",
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: C.sub, marginRight: 6 }}>INSERISCI:</span>
          {ELEMENTI.map(el => (
            <button
              key={el.id}
              onClick={() => setAddMode(addMode === el.id ? null : el.id)}
              style={{
                padding: "4px 8px", borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: "pointer",
                border: addMode === el.id ? "2px solid " + C.amber : "1px solid " + C.bdr,
                background: addMode === el.id ? C.amberL : "transparent",
                color: addMode === el.id ? C.amber : C.text,
              }}
            >
              {el.icon} {el.n}
            </button>
          ))}
        </div>

        {addMode && (
          <div style={{ padding: "5px 12px", background: C.amberL, fontSize: 11, color: C.amber, fontWeight: 600 }}>
            👆 Clicca sulla parete per posizionare: {ELEMENTI.find(e => e.id === addMode)?.n}
          </div>
        )}

        {/* SVG prospetto lato */}
        <div
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            background: "#FAFAF5", overflow: "auto",
          }}
        >
          <svg
            width={Math.max(sW + px * 2, 380)}
            height={Math.max(sH + py * 2, 280)}
            style={{ cursor: addMode ? "crosshair" : "default" }}
            onClick={svgClick}
          >
            {/* Struttura */}
            <rect x={px} y={py} width={sW} height={sH} fill="none" stroke={str.colStruct} strokeWidth={5} />
            {/* Pavimento */}
            <line x1={px - 15} y1={py + sH} x2={px + sW + 15} y2={py + sH} stroke="#888" strokeWidth={1.5} />

            {/* Elementi sul lato */}
            {lato.elementi.map((el: any) => {
              const def = ELEMENTI.find(e => e.id === el.tipo)
              if (!def || el.tipo === "vuoto") return null
              const ex = px + el.x * scX
              const ey = py + el.y * scY
              const ew = el.w * scX
              const eh = el.h * scY

              return (
                <g key={el.id}>
                  <rect
                    x={ex} y={ey} width={ew} height={eh}
                    fill={def.col} fillOpacity={def.op}
                    stroke={str.colStruct} strokeWidth={1.5} rx={1}
                  />

                  {/* Dettagli grafici per tipo */}
                  {el.tipo.includes("vetro") && (
                    <>
                      <line x1={ex + 3} y1={ey + 3} x2={ex + ew - 3} y2={ey + eh - 3} stroke="#fff" strokeWidth={0.4} opacity={0.5} />
                      <line x1={ex + ew - 3} y1={ey + 3} x2={ex + 3} y2={ey + eh - 3} stroke="#fff" strokeWidth={0.4} opacity={0.5} />
                    </>
                  )}
                  {el.tipo === "vetro_scorr" && (
                    <text x={ex + ew / 2} y={ey + eh / 2 + 4} textAnchor="middle" fontSize={14} fill={str.colStruct} opacity={0.3}>↔</text>
                  )}
                  {el.tipo === "porta" && (
                    <circle cx={ex + ew * 0.85} cy={ey + eh * 0.55} r={2.5} fill={str.colStruct} />
                  )}
                  {el.tipo === "lamelle" && Array.from({ length: Math.floor(eh / 10) }).map((_, j) => (
                    <line key={j} x1={ex + 2} y1={ey + j * 10 + 5} x2={ex + ew - 2} y2={ey + j * 10 + 5} stroke={str.colStruct} strokeWidth={1} opacity={0.4} />
                  ))}
                  {el.tipo === "persiana" && Array.from({ length: Math.floor(eh / 7) }).map((_, j) => (
                    <line key={j} x1={ex + 2} y1={ey + j * 7 + 3} x2={ex + ew - 2} y2={ey + j * 7 + 3} stroke="#3a5a3a" strokeWidth={0.8} opacity={0.4} />
                  ))}
                  {el.tipo === "griglia" && Array.from({ length: Math.floor(eh / 12) }).map((_, j) => (
                    <line key={j} x1={ex + 2} y1={ey + j * 12 + 6} x2={ex + ew - 2} y2={ey + j * 12 + 6} stroke="#777" strokeWidth={0.6} opacity={0.5} />
                  ))}

                  {/* Label */}
                  <text x={ex + ew / 2} y={ey - 5} textAnchor="middle" fontSize={8} fontFamily={FM} fontWeight={600} fill={C.sub}>
                    {def.n}
                  </text>
                  {/* Dimensioni */}
                  <text x={ex + ew / 2} y={ey + eh + 12} textAnchor="middle" fontSize={7} fontFamily={FM} fill={C.amber}>
                    {el.w}×{el.h}
                  </text>

                  {/* X elimina */}
                  <circle cx={ex + ew - 1} cy={ey + 1} r={6} fill={C.red} opacity={0.7} style={{ cursor: "pointer" }}
                    onClick={(e) => { e.stopPropagation(); rmEl(el.id) }} />
                  <text x={ex + ew - 1} y={ey + 4.5} textAnchor="middle" fontSize={8} fill="#fff" fontWeight={700} style={{ pointerEvents: "none" }}>×</text>
                </g>
              )
            })}

            {/* Quote larghezza */}
            <text x={px + sW / 2} y={py - 18} textAnchor="middle" fontSize={11} fontFamily={FM} fontWeight={700} fill={C.amber}>
              {lato.lunghezza} mm
            </text>
            <line x1={px} y1={py - 12} x2={px + sW} y2={py - 12} stroke={C.amber} strokeWidth={0.8} />

            {/* Quote altezza */}
            <text
              x={px - 22} y={py + sH / 2} textAnchor="middle"
              fontSize={11} fontFamily={FM} fontWeight={700} fill={C.amber}
              transform={"rotate(-90," + (px - 22) + "," + (py + sH / 2) + ")"}
            >
              {lato.altezza} mm
            </text>

            {/* Titolo */}
            <text x={px + sW / 2} y={16} textAnchor="middle" fontSize={13} fontWeight={800} fill={C.text} fontFamily={FB}>
              {lato.nome} — Prospetto
            </text>
          </svg>
        </div>

        {/* Barra edit elementi in basso */}
        {lato.elementi.length > 0 && (
          <div style={{
            padding: "8px 12px", borderTop: "1px solid " + C.bdr,
            background: C.card, display: "flex", gap: 8, overflowX: "auto",
          }}>
            {lato.elementi.map((el: any) => {
              const def = ELEMENTI.find(e => e.id === el.tipo)
              return (
                <div key={el.id} style={{
                  display: "flex", gap: 4, alignItems: "center",
                  padding: "5px 8px", borderRadius: 6,
                  border: "1px solid " + C.bdr, background: C.bg, whiteSpace: "nowrap",
                }}>
                  <span style={{ fontSize: 12 }}>{def?.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, fontFamily: FB }}>{def?.n}</span>
                  <span style={{ fontSize: 8, color: C.sub }}>x</span>
                  <input type="number" value={el.x} step={50}
                    onChange={(e) => updEl(el.id, { x: parseInt(e.target.value) || 0 })}
                    style={{ width: 48, padding: "2px 3px", borderRadius: 3, border: "1px solid " + C.bdr, fontSize: 9, fontFamily: FM, textAlign: "right" }}
                  />
                  <span style={{ fontSize: 8, color: C.sub }}>w</span>
                  <input type="number" value={el.w} step={50}
                    onChange={(e) => updEl(el.id, { w: parseInt(e.target.value) || 0 })}
                    style={{ width: 48, padding: "2px 3px", borderRadius: 3, border: "1px solid " + C.bdr, fontSize: 9, fontFamily: FM, textAlign: "right" }}
                  />
                  <span style={{ fontSize: 8, color: C.sub }}>h</span>
                  <input type="number" value={el.h} step={50}
                    onChange={(e) => updEl(el.id, { h: parseInt(e.target.value) || 0 })}
                    style={{ width: 48, padding: "2px 3px", borderRadius: 3, border: "1px solid " + C.bdr, fontSize: 9, fontFamily: FM, textAlign: "right" }}
                  />
                  <button
                    onClick={() => rmEl(el.id)}
                    style={{
                      padding: "2px 5px", borderRadius: 3, border: "none",
                      background: C.redL, color: C.red, fontSize: 10, fontWeight: 700, cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


/* ═════════════════════════════════════════════════════════════
   3D RENDERING — Three.js r128
   ═════════════════════════════════════════════════════════════ */
function Render3D({ str, tipo }: any) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏗️</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4, fontFamily: FB }}>
        {tipo?.icon} {tipo?.n}
      </div>
      <div style={{ fontSize: 12, color: C.sub, fontFamily: FM, marginBottom: 16 }}>
        {str.W}×{str.D}×{str.H}mm · {str.lati.length} lati · {str.lati.reduce((s: number, l: any) => s + l.elementi.length, 0)} elementi
      </div>
      <div style={{
        padding: "14px 20px", borderRadius: 10,
        background: C.blueL, border: "1px solid rgba(59,127,224,0.2)",
        fontSize: 12, color: C.blue, fontWeight: 600,
      }}>
        Rendering 3D disponibile prossimamente.<br/>
        Configura Pianta e Lati per definire la struttura.
      </div>
    </div>
  )
}
