"use client";
// @ts-nocheck
// MASTRO ERP — FotoMisure v5
// Strumenti: Misura | Nota | Freccia | Matita
// Nota = tastiera del telefono (input text)
// Misura = numpad numerico
// Colore default: blu — ZERO rosso
import React, { useState, useRef, useCallback, useEffect } from "react";
import { ICO, I, FF, FM } from "./mastro-constants";

// ── Colori disponibili — BLU per primo, mai rosso di default ──
const COLORS = ["#3B7FE0", "#1A9E73", "#D08008", "#af52de", "#fff"];

// ── Icone SVG strumenti ────────────────────────────────────────
const IcoMisura = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="3" y1="21" x2="21" y2="3"/>
    <path d="M3 9V3h6"/><path d="M21 15v6h-6"/>
  </svg>
);
const IcoNota = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
  </svg>
);
const IcoFreccia = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5"/>
    <polyline points="12 5 19 5 19 12"/>
  </svg>
);
const IcoMatita = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
  </svg>
);

const TOOLS = [
  { id: "misura",  label: "Misura",  Icon: IcoMisura },
  { id: "nota",    label: "Nota",    Icon: IcoNota },
  { id: "freccia", label: "Freccia", Icon: IcoFreccia },
  { id: "matita",  label: "Matita",  Icon: IcoMatita },
];

export default function FotoMisure({ imageUrl, onSave, onClose, T }) {
  const canvasRef    = useRef(null);
  const imgRef       = useRef(null);
  const containerRef = useRef(null);
  const fileRef      = useRef(null);
  const noteInputRef = useRef(null);

  const [loaded,       setLoaded]       = useState(false);
  const [tool,         setTool]         = useState("misura");
  const [color,        setColor]        = useState("#3B7FE0"); // BLU default
  const [annotations,  setAnnotations]  = useState([]);
  const [drawing,      setDrawing]      = useState(null);
  const [dragPrev,     setDragPrev]     = useState(null);
  const [penPath,      setPenPath]      = useState(null);
  const [undoStack,    setUndoStack]    = useState([]);
  const [localImg,     setLocalImg]     = useState(imageUrl || null);
  const [draggingNote, setDraggingNote] = useState(null); // {idx, offX, offY}

  // Modal misura (numpad)
  const [misuraModal, setMisuraModal] = useState(null); // {coords}
  const [misuraVal,   setMisuraVal]   = useState("");

  // Modal nota (tastiera reale)
  const [notaModal, setNotaModal] = useState(null); // {coords}
  const [notaVal,   setNotaVal]   = useState("");

  // ── Canvas sizing ─────────────────────────────────────────────
  const fitCanvas = useCallback(() => {
    const img = imgRef.current, canvas = canvasRef.current, box = containerRef.current;
    if (!img || !canvas || !box) return;
    const scale = Math.min(box.clientWidth / img.naturalWidth, box.clientHeight / img.naturalHeight);
    canvas.width  = Math.round(img.naturalWidth  * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    setLoaded(true);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", fitCanvas);
    return () => window.removeEventListener("resize", fitCanvas);
  }, [fitCanvas]);

  // ── Redraw ────────────────────────────────────────────────────
  const redraw = useCallback(() => {
    const canvas = canvasRef.current, img = imgRef.current;
    if (!canvas || !img || !loaded) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    annotations.forEach(a => {
      ctx.save();
      if (a.type === "misura")  drawMisura(ctx, a);
      if (a.type === "nota")    drawNota(ctx, a);
      if (a.type === "freccia") drawFreccia(ctx, a);
      if (a.type === "matita")  drawMatita(ctx, a);
      ctx.restore();
    });

    // Preview drag misura/freccia
    if (drawing && dragPrev) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash([7, 4]);
      ctx.beginPath(); ctx.moveTo(drawing.x, drawing.y); ctx.lineTo(dragPrev.x, dragPrev.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Preview matita live
    if (penPath && penPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(penPath[0].x, penPath[0].y);
      penPath.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
      ctx.restore();
    }
  }, [annotations, loaded, drawing, dragPrev, penPath, color]);

  useEffect(() => { redraw(); }, [redraw]);

  // ── Draw functions ────────────────────────────────────────────
  function drawMisura(ctx, a) {
    const { x1, y1, x2, y2, text, color: col } = a;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const perp = angle + Math.PI / 2;
    const tl = 10;
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    [[x1, y1], [x2, y2]].forEach(([px, py]) => {
      ctx.beginPath();
      ctx.moveTo(px - Math.cos(perp) * tl, py - Math.sin(perp) * tl);
      ctx.lineTo(px + Math.cos(perp) * tl, py + Math.sin(perp) * tl);
      ctx.stroke();
    });
    if (text) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const offX = -Math.sin(angle) * 18, offY = Math.cos(angle) * 18;
      ctx.font = "bold 14px 'JetBrains Mono',monospace";
      const tw = ctx.measureText(text).width + 14;
      ctx.fillStyle = "rgba(255,255,255,0.97)";
      ctx.beginPath(); ctx.roundRect(mx + offX - tw / 2, my - offY - 12, tw, 24, 4); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(mx + offX - tw / 2, my - offY - 12, tw, 24, 4); ctx.stroke();
      ctx.fillStyle = col; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(text, mx + offX, my - offY);
    }
  }

  function drawNota(ctx, a) {
    // ax,ay = punto ancora sulla foto (fisso)
    // tx,ty = centro box testo (draggabile)
    const { ax, ay, tx, ty, text, color: col } = a;
    if (!text) return;
    ctx.font = "bold 14px 'JetBrains Mono',monospace";
    const tw = ctx.measureText(text).width + 14;
    const bh = 28;
    const bx = tx, by = ty;

    // Linea tratteggiata ancora→box
    const ex = bx + tw / 2, ey = by - bh / 2;
    const angle = Math.atan2(ey - ay, ex - ax);
    ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.setLineDash([]);

    // Punta freccia sul box
    const hl = 13, ha = 0.42;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - hl * Math.cos(angle - ha), ey - hl * Math.sin(angle - ha));
    ctx.lineTo(ex - hl * Math.cos(angle + ha), ey - hl * Math.sin(angle + ha));
    ctx.closePath(); ctx.fill();

    // Cerchietto ancora
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(ax, ay, 5, 0, Math.PI * 2); ctx.stroke();

    // Box testo
    ctx.fillStyle = col === "#fff" ? "rgba(0,0,0,0.85)" : col + "DD";
    ctx.beginPath(); ctx.roundRect(bx - 2, by - bh / 2, tw, bh, 6); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(text, bx + 5, by);
  }

  function drawFreccia(ctx, a) {
    const { x1, y1, x2, y2, color: col } = a;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 2.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const hl = 18, ha = 0.42;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - hl * Math.cos(angle - ha), y2 - hl * Math.sin(angle - ha));
    ctx.lineTo(x2 - hl * Math.cos(angle + ha), y2 - hl * Math.sin(angle + ha));
    ctx.closePath(); ctx.fill();
  }

  function drawMatita(ctx, a) {
    const { points, color: col } = a;
    if (!points || points.length < 2) return;
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    points.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke();
  }

  // ── Coordinate helpers ────────────────────────────────────────
  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const t = e.touches?.[0] || e.changedTouches?.[0] || e;
    return {
      x: (t.clientX - rect.left) * (canvas.width  / rect.width),
      y: (t.clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  // ── HitTest nota (per drag box) ───────────────────────────────
  const hitTestNota = (pos) => {
    const canvas = canvasRef.current; if (!canvas) return -1;
    const ctx = canvas.getContext("2d");
    ctx.font = "bold 14px 'JetBrains Mono',monospace";
    for (let i = annotations.length - 1; i >= 0; i--) {
      const a = annotations[i];
      if (a.type !== "nota") continue;
      const tw = ctx.measureText(a.text).width + 14;
      const bh = 28;
      if (pos.x >= a.tx - 2 && pos.x <= a.tx + tw && pos.y >= a.ty - bh / 2 && pos.y <= a.ty + bh / 2) return i;
    }
    return -1;
  };

  // ── Touch/mouse handlers ──────────────────────────────────────
  const handleStart = (e) => {
    e.preventDefault();
    if (misuraModal || notaModal) return;
    const pos = getPos(e);

    if (tool === "nota") {
      const hit = hitTestNota(pos);
      if (hit >= 0) {
        const a = annotations[hit];
        setDraggingNote({ idx: hit, offX: pos.x - a.tx, offY: pos.y - a.ty });
        return;
      }
      // Nuovo punto ancora → apri modal testo
      setNotaModal({ coords: pos });
      setNotaVal("");
      setTimeout(() => noteInputRef.current?.focus(), 100);
      return;
    }

    if (tool === "matita") { setPenPath([pos]); return; }

    setDrawing(pos);
    setDragPrev(null);
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (draggingNote !== null) {
      const pos = getPos(e);
      setAnnotations(s => s.map((a, i) => i === draggingNote.idx
        ? { ...a, tx: pos.x - draggingNote.offX, ty: pos.y - draggingNote.offY }
        : a));
      return;
    }
    if (tool === "matita" && penPath) {
      setPenPath(prev => [...prev, getPos(e)]);
      return;
    }
    if (!drawing) return;
    setDragPrev(getPos(e));
  };

  const handleEnd = (e) => {
    e.preventDefault();
    if (draggingNote !== null) { setDraggingNote(null); return; }
    if (tool === "matita" && penPath) {
      if (penPath.length > 2) {
        setUndoStack(s => [...s, [...annotations]]);
        setAnnotations(s => [...s, { type: "matita", points: [...penPath], color }]);
      }
      setPenPath(null); return;
    }
    if (!drawing) return;
    const pos = getPos(e);
    const dist = Math.hypot(pos.x - drawing.x, pos.y - drawing.y);
    setDragPrev(null); setDrawing(null);
    if (dist < 10) return;

    if (tool === "misura") {
      setMisuraModal({ coords: { x1: drawing.x, y1: drawing.y, x2: pos.x, y2: pos.y } });
      setMisuraVal("");
    } else if (tool === "freccia") {
      setUndoStack(s => [...s, [...annotations]]);
      setAnnotations(s => [...s, { type: "freccia", x1: drawing.x, y1: drawing.y, x2: pos.x, y2: pos.y, color }]);
    }
  };

  // ── Confirm misura ────────────────────────────────────────────
  const confirmMisura = () => {
    if (!misuraModal) return;
    setUndoStack(s => [...s, [...annotations]]);
    setAnnotations(s => [...s, { type: "misura", ...misuraModal.coords, text: misuraVal.trim(), color }]);
    setMisuraModal(null); setMisuraVal("");
  };

  // ── Confirm nota ──────────────────────────────────────────────
  const confirmNota = () => {
    if (!notaModal || !notaVal.trim()) { setNotaModal(null); setNotaVal(""); return; }
    const ax = notaModal.coords.x, ay = notaModal.coords.y;
    setUndoStack(s => [...s, [...annotations]]);
    setAnnotations(s => [...s, {
      type: "nota", ax, ay,
      tx: ax + 90, ty: ay - 60, // box parte offset dal punto
      text: notaVal.trim(), color,
    }]);
    setNotaModal(null); setNotaVal("");
  };

  const undo = () => {
    if (undoStack.length > 0) { setAnnotations(undoStack[undoStack.length - 1]); setUndoStack(s => s.slice(0, -1)); }
    else if (annotations.length > 0) setAnnotations(s => s.slice(0, -1));
  };

  const QUICK = ["L", "H", "Sp", "Ø", "mm"];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#111",
      display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", background: "#1a1a1a",
        borderBottom: "1px solid #222", flexShrink: 0 }}>
        <div onClick={onClose} style={{ padding: 4, cursor: "pointer" }}>
          <I d={ICO.back} s={22} c="#aaa" />
        </div>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: FF }}>
          Foto + Misure
        </span>
        {annotations.length > 0 && (
          <span style={{ fontSize: 10, color: "#555", fontFamily: FM }}>{annotations.length} segni</span>
        )}
        {localImg && annotations.length > 0 && (
          <div onClick={() => {
            const c = canvasRef.current;
            if (c) onSave?.(c.toDataURL("image/jpeg", 0.88), annotations);
          }} style={{ padding: "8px 18px", borderRadius: 8, background: "#1A9E73",
            color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
            ✓ Salva
          </div>
        )}
      </div>

      {/* ── CANVAS ── */}
      <div ref={containerRef} style={{ flex: 1, position: "relative",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", background: "#111" }}>

        {!localImg ? (
          /* ── SCHERMATA INIZIALE ── */
          <div style={{ textAlign: "center", padding: 32, maxWidth: 300 }}>
            <div onClick={() => fileRef.current?.click()}
              style={{ width: 110, height: 110, borderRadius: 28, background: "#1d1d1d",
                border: "1.5px solid #2a2a2a", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 8,
                margin: "0 auto 28px", cursor: "pointer",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#555"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#444" }}>Scegli foto</span>
            </div>
            <div style={{ fontSize: 18, color: "#e0e0e0", fontWeight: 800, marginBottom: 10 }}>
              Foto + Misure
            </div>
            <div style={{ fontSize: 12, color: "#444", lineHeight: 1.8 }}>
              Scatta la foto del vano,<br />poi annota misure, note e frecce
            </div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
              {[["Misure", IcoMisura], ["Note", IcoNota], ["Frecce", IcoFreccia], ["Forme", IcoMatita]].map(([lbl, Icon]) => (
                <div key={lbl} style={{ padding: "5px 10px", borderRadius: 20, background: "#1d1d1d",
                  border: "1px solid #2a2a2a", fontSize: 10, color: "#555", fontWeight: 600,
                  display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ color: "#555" }}><Icon /></span>{lbl}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <img ref={imgRef} src={localImg} onLoad={fitCanvas} style={{ display: "none" }} alt="" />
            <canvas ref={canvasRef}
              onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
              onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd}
              style={{ touchAction: "none", maxWidth: "100%", maxHeight: "100%", display: "block",
                cursor: tool === "matita" || tool === "misura" ? "crosshair" : "default" }} />
          </>
        )}
      </div>

      {/* ── TOOLBAR ── */}
      {localImg && !misuraModal && !notaModal && (
        <div style={{ padding: "10px 12px 18px", background: "#1a1a1a",
          borderTop: "1px solid #222", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center", justifyContent: "space-between" }}>

            {/* Strumenti */}
            <div style={{ display: "flex", gap: 4 }}>
              {TOOLS.map(({ id, label, Icon }) => (
                <div key={id} onClick={() => setTool(id)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    padding: "8px 10px", borderRadius: 10, cursor: "pointer", minWidth: 52,
                    background: tool === id ? color + "22" : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${tool === id ? color : "#2a2a2a"}`,
                    color: tool === id ? color : "#555" }}>
                  <Icon />
                  <span style={{ fontSize: 8, fontWeight: 700, color: tool === id ? color : "#555" }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Colori */}
            <div style={{ display: "flex", gap: 5 }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)}
                  style={{ width: 22, height: 22, borderRadius: 11, background: c, cursor: "pointer",
                    border: color === c ? `3px solid ${c === "#fff" ? "#666" : "#fff"}` : "2px solid #2a2a2a",
                    boxShadow: color === c ? `0 0 8px ${c}70` : "none" }} />
              ))}
            </div>

            {/* Undo + Camera */}
            <div style={{ display: "flex", gap: 4 }}>
              {annotations.length > 0 && (
                <div onClick={undo} style={{ padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                  background: "rgba(255,255,255,0.05)", border: "1.5px solid #2a2a2a",
                  display: "flex", alignItems: "center" }}>
                  <I d={ICO.back} s={16} c="#666" />
                </div>
              )}
              <div onClick={() => fileRef.current?.click()}
                style={{ padding: "8px 10px", borderRadius: 10, cursor: "pointer",
                  background: "rgba(255,255,255,0.05)", border: "1.5px solid #2a2a2a",
                  display: "flex", alignItems: "center" }}>
                <I d={ICO.camera} s={16} c="#666" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL MISURA — numpad ── */}
      {misuraModal && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 30,
          background: "#141414", borderRadius: "20px 20px 0 0",
          padding: "12px 16px 28px", boxShadow: "0 -8px 40px rgba(0,0,0,0.8)" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a2a2a", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase",
            textAlign: "center", marginBottom: 10, letterSpacing: 0.5 }}>
            Inserisci misura
          </div>
          {/* Prefissi rapidi */}
          <div style={{ display: "flex", gap: 5, marginBottom: 10, justifyContent: "center" }}>
            {QUICK.map(q => (
              <div key={q} onClick={() => {
                if (q === "mm") setMisuraVal(v => v.replace(/ mm$/, "") + " mm");
                else setMisuraVal(v => q + ":" + v.replace(/^[A-ZØa-z]+:/, ""));
              }} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)",
                border: "1px solid #2a2a2a", color: "#777", fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: FM }}>{q}</div>
            ))}
          </div>
          {/* Display */}
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "#0a0a0a",
            border: `2px solid ${color}`, fontSize: 26, fontWeight: 800, fontFamily: FM,
            color: "#fff", textAlign: "center", marginBottom: 12, minHeight: 56,
            display: "flex", alignItems: "center", justifyContent: "center" }}>
            {misuraVal || <span style={{ color: "#333" }}>1200 mm</span>}
          </div>
          {/* Numpad 3×4 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginBottom: 10 }}>
            {["1","2","3","4","5","6","7","8","9","←","0","✓"].map(d => (
              <div key={d} onClick={() => {
                if (d === "←") setMisuraVal(v => v.slice(0, -1));
                else if (d === "✓") confirmMisura();
                else setMisuraVal(v => v + d);
              }} style={{ padding: "15px 0", borderRadius: 10, textAlign: "center",
                cursor: "pointer", userSelect: "none",
                background: d === "✓" ? color : "rgba(255,255,255,0.07)",
                color: d === "✓" ? "#fff" : d === "←" ? "#666" : "#fff",
                fontSize: d === "✓" ? 18 : 20, fontWeight: 800, fontFamily: FM }}>{d}</div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={() => { setMisuraModal(null); setMisuraVal(""); }}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "rgba(255,255,255,0.05)",
                color: "#555", textAlign: "center", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Solo linea
            </div>
            <div onClick={confirmMisura}
              style={{ flex: 2, padding: "12px 0", borderRadius: 10, background: color,
                color: "#fff", textAlign: "center", fontSize: 14, fontWeight: 800, cursor: "pointer" }}>
              Conferma {misuraVal ? `"${misuraVal}"` : ""}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NOTA — tastiera reale del telefono ── */}
      {notaModal && (
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 30,
          background: "#141414", borderRadius: "20px 20px 0 0",
          padding: "16px 16px 28px", boxShadow: "0 -8px 40px rgba(0,0,0,0.8)" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#2a2a2a", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 11, color: "#555", fontWeight: 700, textTransform: "uppercase",
            textAlign: "center", marginBottom: 12, letterSpacing: 0.5 }}>
            Scrivi nota
          </div>
          {/* Input testo — tastiera normale del telefono */}
          <input
            ref={noteInputRef}
            type="text"
            inputMode="text"
            value={notaVal}
            onChange={e => setNotaVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") confirmNota();
              if (e.key === "Escape") { setNotaModal(null); setNotaVal(""); }
            }}
            placeholder="es. Spigolo rotto, Muffa, Manca intonaco..."
            autoFocus
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12,
              background: "#0a0a0a", border: `2px solid ${color}`,
              color: "#fff", fontSize: 16, fontWeight: 500,
              fontFamily: "Inter, sans-serif", outline: "none",
              boxSizing: "border-box", marginBottom: 12 }}
          />
          {/* Colori rapidi */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
            {COLORS.map(c => (
              <div key={c} onClick={() => setColor(c)}
                style={{ width: 26, height: 26, borderRadius: 13, background: c, cursor: "pointer",
                  border: color === c ? `3px solid ${c === "#fff" ? "#666" : "#fff"}` : "2px solid #2a2a2a",
                  boxShadow: color === c ? `0 0 8px ${c}70` : "none" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={() => { setNotaModal(null); setNotaVal(""); }}
              style={{ flex: 1, padding: "12px 0", borderRadius: 10, background: "rgba(255,255,255,0.05)",
                color: "#555", textAlign: "center", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              Annulla
            </div>
            <div onClick={confirmNota}
              style={{ flex: 2, padding: "12px 0", borderRadius: 10, background: color,
                color: "#fff", textAlign: "center", fontSize: 14, fontWeight: 800, cursor: "pointer",
                opacity: notaVal.trim() ? 1 : 0.4 }}>
              Aggiungi nota
            </div>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" capture="environment"
        style={{ display: "none" }} onChange={e => {
          const f = e.target.files?.[0]; if (!f) return;
          const r = new FileReader();
          r.onload = ev => { setLocalImg(ev.target.result); setAnnotations([]); setUndoStack([]); setLoaded(false); };
          r.readAsDataURL(f);
          e.target.value = "";
        }} />
    </div>
  );
}
