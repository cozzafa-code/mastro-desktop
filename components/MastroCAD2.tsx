"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD v3 — Renderer SVG Puro, Zero dipendenze
// Profili ISO · Quote reali · Aperture tecniche · Maniglia custom
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";

const AMB = "#D08008", GRN = "#1A9E73", RED = "#DC4444", BLU = "#3B7FE0";
const BG = "#F2F1EC", TOP = "#1A1A1C";

// ── CATEGORIE ───────────────────────────────────────────────────
const CATEGORIE = [
  { id:"infisso",     label:"Infisso",       col: BLU },
  { id:"persiana",    label:"Persiana",      col: "#8a6a40" },
  { id:"vetrina",     label:"Vetrina",       col: GRN },
  { id:"porta",       label:"Porta",         col: AMB },
  { id:"zanzariera",  label:"Zanzariera",    col: "#5a8a6a" },
  { id:"copricaldaia",label:"Copri Caldaia", col: "#5a5a6a" },
];

// ── CONFIGURAZIONI ───────────────────────────────────────────────
// cols: array di percentuali larghezza
// celle: array di {tipo, verso, maniglia} per ogni cella
const CONFIGS: Record<string, any[]> = {
  infisso: [
    { id:"F1A_DX",  label:"1 Anta →",      cols:[100],      celle:[{tipo:"anta",  verso:"dx",maniglia:true}] },
    { id:"F1A_SX",  label:"← 1 Anta",      cols:[100],      celle:[{tipo:"anta",  verso:"sx",maniglia:true}] },
    { id:"F2A",     label:"2 Ante",         cols:[50,50],    celle:[{tipo:"anta",verso:"sx",maniglia:true},{tipo:"anta",verso:"dx",maniglia:true}] },
    { id:"F3A",     label:"3 Ante",         cols:[33,34,33], celle:[{tipo:"fisso",maniglia:false},{tipo:"anta",verso:"sx",maniglia:true},{tipo:"anta",verso:"dx",maniglia:true}] },
    { id:"FISSO",   label:"Fisso",          cols:[100],      celle:[{tipo:"fisso", maniglia:false}] },
    { id:"VASISTAS",label:"Vasistas",       cols:[100],      celle:[{tipo:"vasistas",maniglia:false}] },
    { id:"SC2",     label:"Scorrevole 2",   cols:[50,50],    celle:[{tipo:"scorrevole",verso:"dx",maniglia:true},{tipo:"fisso",maniglia:false}] },
    { id:"SC3",     label:"Scorrevole 3",   cols:[33,34,33], celle:[{tipo:"scorrevole",verso:"dx",maniglia:true},{tipo:"fisso",maniglia:false},{tipo:"scorrevole",verso:"sx",maniglia:true}] },
    { id:"PF2",     label:"Portafinestra 2",cols:[50,50],    celle:[{tipo:"pf",verso:"sx",maniglia:true},{tipo:"pf",verso:"dx",maniglia:true}] },
    { id:"SOPRALUCE",label:"Sopraluce",     cols:[50,50],    celle:[{tipo:"fisso",maniglia:false},{tipo:"fisso",maniglia:false},{tipo:"anta",verso:"sx",maniglia:true},{tipo:"anta",verso:"dx",maniglia:true}], sopraluce:true },
    { id:"ALZANTE", label:"Alzante Scorr.", cols:[50,50],    celle:[{tipo:"alzante",verso:"dx",maniglia:true},{tipo:"fisso",maniglia:false}] },
  ],
  persiana: [
    { id:"P1",  label:"Avvolgibile 1",  cols:[100],   celle:[{tipo:"avvolgibile"}] },
    { id:"P2",  label:"Avvolgibile 2",  cols:[50,50], celle:[{tipo:"avvolgibile"},{tipo:"avvolgibile"}] },
    { id:"PVEN",label:"Veneziana",      cols:[100],   celle:[{tipo:"veneziana"}] },
  ],
  vetrina: [
    { id:"V3",  label:"3 Campate",  cols:[33,34,33],       celle:[{tipo:"fisso"},{tipo:"scorrevole",verso:"dx",maniglia:true},{tipo:"fisso"}] },
    { id:"V5",  label:"5 Campate",  cols:[20,20,20,20,20], celle:[{tipo:"fisso"},{tipo:"anta",verso:"sx",maniglia:true},{tipo:"scorrevole",verso:"dx",maniglia:true},{tipo:"anta",verso:"dx",maniglia:true},{tipo:"fisso"}] },
    { id:"PV",  label:"Porta+Vetrina",cols:[25,25,25,25],  celle:[{tipo:"fisso"},{tipo:"pf",verso:"sx",maniglia:true},{tipo:"pf",verso:"dx",maniglia:true},{tipo:"fisso"}] },
  ],
  porta: [
    { id:"PT1", label:"Porta singola →",cols:[100],    celle:[{tipo:"pf",verso:"dx",maniglia:true}] },
    { id:"PT1L",label:"← Porta singola",cols:[100],    celle:[{tipo:"pf",verso:"sx",maniglia:true}] },
    { id:"PT2", label:"Porta doppia",   cols:[50,50],  celle:[{tipo:"pf",verso:"sx",maniglia:true},{tipo:"pf",verso:"dx",maniglia:true}] },
    { id:"PTF", label:"Fisso+Porta",    cols:[30,70],  celle:[{tipo:"fisso"},{tipo:"pf",verso:"dx",maniglia:true}] },
    { id:"PTFF",label:"Porta+Fisso",    cols:[70,30],  celle:[{tipo:"pf",verso:"sx",maniglia:true},{tipo:"fisso"}] },
  ],
  zanzariera: [
    { id:"Z1",label:"1 Anta",  cols:[100],   celle:[{tipo:"scorrevole",verso:"dx"}] },
    { id:"Z2",label:"2 Ante",  cols:[50,50], celle:[{tipo:"scorrevole",verso:"dx"},{tipo:"fisso"}] },
    { id:"ZP",label:"Plissé",  cols:[100],   celle:[{tipo:"plisse"}] },
  ],
  copricaldaia: [
    { id:"CC1",label:"Box singolo",cols:[100],   celle:[{tipo:"fisso"}] },
    { id:"CC2",label:"Box doppio", cols:[50,50], celle:[{tipo:"fisso"},{tipo:"fisso"}] },
    { id:"CCA",label:"Con anta",   cols:[100],   celle:[{tipo:"anta",verso:"dx",maniglia:true}] },
  ],
};

// ── SISTEMI PROFILI ──────────────────────────────────────────────
const SISTEMI: Record<string,any> = {
  alluminio:{ n:"Alluminio", TF:60, TM:60, TA:50, col:"#4a7a9b" },
  pvc:      { n:"PVC",       TF:80, TM:76, TA:70, col:"#4a7a4a" },
  legno:    { n:"Legno",     TF:92, TM:86, TA:78, col:"#8a6a40" },
  ferro:    { n:"Ferro",     TF:45, TM:42, TA:38, col:"#5a5a6a" },
};

// ─────────────────────────────────────────────────────────────────
// RENDERER SVG TECNICO PURO
// ─────────────────────────────────────────────────────────────────
function renderSVG(
  cfg: any, W: number, H: number,
  sistema: string, showQuote: boolean,
  celleCfg: any[], // stato celle con maniglia personalizzata
  selCella: number | null
): string {
  const S = SISTEMI[sistema] || SISTEMI.alluminio;
  const TF = S.TF, TM = S.TM, TA = S.TA;
  const col = S.col;

  // Scala: max 560px larghezza, max 480px altezza
  const maxW = 560, maxH = 480;
  const scalaW = maxW / W, scalaH = maxH / H;
  const sc = Math.min(scalaW, scalaH, 0.35);

  const PAD = showQuote ? 50 : 16;
  const QOFF = 28;
  const fw = W * sc, fh = H * sc;
  const vW = fw + PAD * 2 + (showQuote ? QOFF * 2 : 0);
  const vH = fh + PAD * 2 + (showQuote ? QOFF * 2 : 0);
  const ox = PAD + (showQuote ? QOFF : 0);
  const oy = PAD + (showQuote ? QOFF : 0);

  const tfp = TF * sc, tmp = TM * sc, tap = TA * sc;

  const cols = cfg.cols || [100];
  const nCols = cols.length;
  const totalPct = cols.reduce((a: number, b: number) => a + b, 0);
  const isSopraluce = !!cfg.sopraluce;
  const sopH = isSopraluce ? 0.28 : 0; // 28% altezza sopraluce

  let d = `<svg viewBox="0 0 ${vW.toFixed(1)} ${vH.toFixed(1)}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;background:#ffffff">`;

  // DEFS
  d += `<defs>
    <pattern id="hp" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="4" stroke="${col}" stroke-width="1.2" opacity="0.6"/>
    </pattern>
    <pattern id="glas" width="12" height="12" patternUnits="userSpaceOnUse">
      <line x1="0" y1="12" x2="12" y2="0" stroke="#4a90b8" stroke-width="0.5" opacity="0.5"/>
    </pattern>
    <filter id="sel"><feColorMatrix type="saturate" values="3"/></filter>
  </defs>`;

  // ── TELAIO ESTERNO ──────────────────────────────────────────
  const c = Math.min(tfp * 0.6, 10);
  const pts = (arr: number[][]) => arr.map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const poly = (p: number[][], fill: string, stroke: string, sw: number) =>
    `<polygon points="${pts(p)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

  // Top
  d += poly([[ox,oy],[ox+fw,oy],[ox+fw,oy+tfp-c],[ox+fw-c,oy+tfp],[ox+c,oy+tfp],[ox,oy+tfp-c]], "url(#hp)", col, 1.2);
  // Bottom
  d += poly([[ox+c,oy+fh-tfp],[ox+fw-c,oy+fh-tfp],[ox+fw,oy+fh-tfp+c],[ox+fw,oy+fh],[ox,oy+fh],[ox,oy+fh-tfp+c]], "url(#hp)", col, 1.2);
  // Left
  d += poly([[ox,oy+tfp-c],[ox+tfp-c,oy+tfp],[ox+tfp,oy+tfp+c],[ox+tfp,oy+fh-tfp-c],[ox+tfp-c,oy+fh-tfp],[ox,oy+fh-tfp+c]], "url(#hp)", col, 1.2);
  // Right
  d += poly([[ox+fw-tfp,oy+tfp+c],[ox+fw-tfp+c,oy+tfp],[ox+fw,oy+tfp-c],[ox+fw,oy+fh-tfp+c],[ox+fw-tfp+c,oy+fh-tfp],[ox+fw-tfp,oy+fh-tfp-c]], "url(#hp)", col, 1.2);
  // Outline
  d += `<rect x="${ox}" y="${oy}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" fill="none" stroke="${col}" stroke-width="1.8"/>`;
  d += `<rect x="${(ox+tfp).toFixed(1)}" y="${(oy+tfp).toFixed(1)}" width="${(fw-tfp*2).toFixed(1)}" height="${(fh-tfp*2).toFixed(1)}" fill="none" stroke="${col}" stroke-width="0.6" opacity="0.4"/>`;

  // ── COLONNE ─────────────────────────────────────────────────
  const availW = fw - tfp * 2 - tmp * (nCols - 1);
  let curX = ox + tfp;
  const colBounds: { x: number; w: number }[] = [];
  cols.forEach((pct: number, ci: number) => {
    const cw = (pct / totalPct) * availW;
    colBounds.push({ x: curX, w: cw });
    curX += cw + (ci < nCols - 1 ? tmp : 0);
  });

  // ── MONTANTI ────────────────────────────────────────────────
  colBounds.forEach(({ x, w }, ci) => {
    if (ci < nCols - 1) {
      const mx = x + w;
      const mc = Math.min(tmp * 0.5, 8);
      d += poly([
        [mx+mc, oy+tfp],[mx+tmp-mc, oy+tfp],[mx+tmp, oy+tfp+mc],
        [mx+tmp, oy+fh-tfp-mc],[mx+tmp-mc, oy+fh-tfp],[mx+mc, oy+fh-tfp],[mx, oy+fh-tfp-mc],[mx, oy+tfp+mc]
      ], "url(#hp)", col, 1.0);
      d += `<line x1="${(mx+tmp/2).toFixed(1)}" y1="${(oy+tfp).toFixed(1)}" x2="${(mx+tmp/2).toFixed(1)}" y2="${(oy+fh-tfp).toFixed(1)}" stroke="${col}" stroke-width="0.5" opacity="0.4"/>`;
    }
  });

  // ── CELLE ───────────────────────────────────────────────────
  const celle = celleCfg.length > 0 ? celleCfg : (cfg.celle || []);
  colBounds.forEach(({ x: cx, w: cw }, ci) => {
    const isSopL = isSopraluce && ci >= 0;
    // Per sopraluce: prima metà celle = sopraluce, seconda = anta
    if (isSopraluce) {
      // Sopraluce (28%)
      const sy = oy + tfp, sh = (fh - tfp * 2) * sopH;
      const ay = sy + sh, ah = (fh - tfp * 2) * (1 - sopH);
      const cella0 = celle[ci] || { tipo: "fisso" };
      const cella1 = celle[ci + nCols] || { tipo: "anta", verso: "dx", maniglia: true };
      d += drawCella(cx, sy, cw, sh, tap, cella0, col, false);
      d += drawCella(cx, ay, cw, ah, tap, cella1, col, selCella === ci + nCols);
    } else {
      const cy = oy + tfp, ch = fh - tfp * 2;
      const cella = celle[ci] || { tipo: "fisso" };
      d += drawCella(cx, cy, cw, ch, tap, cella, col, selCella === ci);
    }
  });

  // ── QUOTE ───────────────────────────────────────────────────
  if (showQuote) {
    const qCol = "#1a2a3a";
    const fs = 11;
    // Larghezza totale
    d += quota(ox, oy - QOFF + 6, ox + fw, oy - QOFF + 6, `${W} mm`, true, qCol, fs + 1, true);
    // Altezza totale
    d += quota(ox + fw + QOFF - 6, oy, ox + fw + QOFF - 6, oy + fh, `${H} mm`, false, qCol, fs + 1, true);
    // Quote campate se >1
    if (nCols > 1) {
      colBounds.forEach(({ x, w }, ci) => {
        const campW = Math.round((cols[ci] / totalPct) * (W - TF * 2 - TM * (nCols - 1)));
        d += quota(x, oy + fh + 18, x + w, oy + fh + 18, `${campW}`, true, AMB, 9, false);
      });
    }
  }

  d += `</svg>`;
  return d;
}

function drawCella(ax: number, ay: number, aw: number, ah: number, tap: number, cella: any, col: string, sel: boolean): string {
  const tipo = cella.tipo || "fisso";
  const verso = cella.verso || "dx";
  const hasManigl = !!cella.maniglia;
  let s = "";
  const c = Math.min(tap * 0.5, 7);
  const gx = ax + tap, gy = ay + tap, gw = aw - tap * 2, gh = ah - tap * 2;

  if (tipo === "avvolgibile" || tipo === "veneziana" || tipo === "plisse") {
    // Persiana: strisce orizzontali
    s += `<rect x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" width="${aw.toFixed(1)}" height="${ah.toFixed(1)}" fill="#d8c8a8" stroke="${col}" stroke-width="1.2"/>`;
    const nStrisce = Math.round(ah / 8);
    for (let i = 1; i < nStrisce; i++) {
      const sy = ay + (i / nStrisce) * ah;
      s += `<line x1="${ax.toFixed(1)}" y1="${sy.toFixed(1)}" x2="${(ax+aw).toFixed(1)}" y2="${sy.toFixed(1)}" stroke="${col}" stroke-width="0.6" opacity="0.5"/>`;
    }
    if (tipo === "avvolgibile") s += `<text x="${(ax+aw/2).toFixed(1)}" y="${(ay+ah/2+4).toFixed(1)}" text-anchor="middle" font-size="8" fill="${col}" font-family="Arial" font-weight="600">AVV.</text>`;
    if (tipo === "veneziana") s += `<text x="${(ax+aw/2).toFixed(1)}" y="${(ay+ah/2+4).toFixed(1)}" text-anchor="middle" font-size="8" fill="${col}" font-family="Arial" font-weight="600">VEN.</text>`;
    return s;
  }

  // 4 barre profilo anta con tagli 45°
  const ps = "url(#hp)";
  // Top
  s += `<polygon points="${ax+c},${ay} ${ax+aw-c},${ay} ${ax+aw},${ay+c} ${ax+aw},${ay+tap-c} ${ax+aw-c},${ay+tap} ${ax+c},${ay+tap} ${ax},${ay+tap-c} ${ax},${ay+c}" fill="${ps}" stroke="${col}" stroke-width="${sel?"1.8":"1.0"}"/>`;
  // Bottom
  s += `<polygon points="${ax+c},${ay+ah-tap} ${ax+aw-c},${ay+ah-tap} ${ax+aw},${ay+ah-tap+c} ${ax+aw},${ay+ah-c} ${ax+aw-c},${ay+ah} ${ax+c},${ay+ah} ${ax},${ay+ah-c} ${ax},${ay+ah-tap+c}" fill="${ps}" stroke="${col}" stroke-width="${sel?"1.8":"1.0"}"/>`;
  // Left
  s += `<polygon points="${ax},${ay+tap} ${ax+tap-c},${ay+tap} ${ax+tap},${ay+tap+c} ${ax+tap},${ay+ah-tap-c} ${ax+tap-c},${ay+ah-tap} ${ax},${ay+ah-tap}" fill="${ps}" stroke="${col}" stroke-width="${sel?"1.8":"1.0"}"/>`;
  // Right
  s += `<polygon points="${ax+aw-tap},${ay+tap} ${ax+aw},${ay+tap} ${ax+aw},${ay+ah-tap} ${ax+aw-tap},${ay+ah-tap} ${ax+aw-tap},${ay+ah-tap-c} ${ax+aw-tap+c},${ay+ah-tap} ${ax+aw},${ay+ah-tap} ${ax+aw},${ay+tap} ${ax+aw-tap+c},${ay+tap} ${ax+aw-tap},${ay+tap+c}" fill="${ps}" stroke="${col}" stroke-width="${sel?"1.8":"1.0"}"/>`;
  // Outline anta
  s += `<rect x="${ax.toFixed(1)}" y="${ay.toFixed(1)}" width="${aw.toFixed(1)}" height="${ah.toFixed(1)}" fill="none" stroke="${sel?"#D08008":col}" stroke-width="${sel?"2.5":"1.5"}"/>`;

  // Vetro
  if (gw > 2 && gh > 2) {
    s += `<rect x="${gx.toFixed(1)}" y="${gy.toFixed(1)}" width="${gw.toFixed(1)}" height="${gh.toFixed(1)}" fill="url(#glas)" stroke="#4a96b8" stroke-width="0.8"/>`;
    s += `<rect x="${gx.toFixed(1)}" y="${gy.toFixed(1)}" width="${gw.toFixed(1)}" height="${gh.toFixed(1)}" fill="#a8d8ea18"/>`;
    // Riflessione
    s += `<rect x="${(gx+4).toFixed(1)}" y="${(gy+4).toFixed(1)}" width="${(gw*0.1).toFixed(1)}" height="${(gh*0.6).toFixed(1)}" fill="rgba(255,255,255,0.18)" rx="2"/>`;
  }

  // Tipo apertura
  if (tipo === "fisso") {
    s += `<line x1="${(gx+3).toFixed(1)}" y1="${(gy+3).toFixed(1)}" x2="${(gx+gw-3).toFixed(1)}" y2="${(gy+gh-3).toFixed(1)}" stroke="#4a7a9a" stroke-width="0.8" opacity="0.5"/>`;
    s += `<line x1="${(gx+gw-3).toFixed(1)}" y1="${(gy+3).toFixed(1)}" x2="${(gx+3).toFixed(1)}" y2="${(gy+gh-3).toFixed(1)}" stroke="#4a7a9a" stroke-width="0.8" opacity="0.5"/>`;
  } else if (tipo === "anta" || tipo === "pf") {
    // Arco apertura ISO — parte dal lato cerniera in basso
    if (gw > 8 && gh > 8) {
      const r = Math.min(aw - tap*2, ah - tap*2) * 0.88;
      const hingeX = verso === "sx" ? ax + aw - tap : ax + tap;
      const endX = verso === "sx" ? ax + tap : ax + aw - tap;
      const sweep = verso === "sx" ? 1 : 0;
      s += `<path d="M${hingeX.toFixed(1)} ${(ay+ah).toFixed(1)} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${sweep} ${endX.toFixed(1)} ${(ay+ah).toFixed(1)}" fill="${GRN}15" stroke="${GRN}" stroke-width="1.4" stroke-dasharray="7,4"/>`;
      // Linea diagonale (asse apertura)
      s += `<line x1="${hingeX.toFixed(1)}" y1="${(ay+ah).toFixed(1)}" x2="${endX.toFixed(1)}" y2="${(ay+ah-r).toFixed(1)}" stroke="${GRN}" stroke-width="0.8" opacity="0.6"/>`;
      // Asse cerniera verticale
      s += `<line x1="${hingeX.toFixed(1)}" y1="${(ay+tap/2).toFixed(1)}" x2="${hingeX.toFixed(1)}" y2="${(ay+ah-tap/2).toFixed(1)}" stroke="${GRN}" stroke-width="0.7" stroke-dasharray="4,3" opacity="0.7"/>`;
      // Simboli cerniera
      [0.25, 0.5, 0.75].forEach(f => {
        const cy2 = ay + ah * f;
        s += `<circle cx="${hingeX.toFixed(1)}" cy="${cy2.toFixed(1)}" r="3.5" fill="${GRN}30" stroke="${GRN}" stroke-width="0.8"/>`;
      });
    }
    // Maniglia
    if (hasManigl && gw > 10 && gh > 20) {
      const mx = verso === "dx" ? ax + aw - tap - 5 : ax + tap + 5;
      const my = ay + ah / 2;
      const hh = Math.min(ah * 0.12, 22);
      s += `<rect x="${(mx-3).toFixed(1)}" y="${(my-hh/2).toFixed(1)}" width="6" height="${hh.toFixed(1)}" rx="3" fill="${AMB}" stroke="#a06000" stroke-width="0.8"/>`;
      s += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="4.5" fill="#c07000" stroke="#a05000" stroke-width="0.8"/>`;
    }
  } else if (tipo === "scorrevole" || tipo === "alzante") {
    const dir = verso === "dx" ? 1 : -1;
    const cx2 = ax + aw / 2 + dir * aw * 0.08, cy2 = ay + ah / 2;
    const len = Math.min(aw * 0.3, 36);
    // Guide
    [0.15, 0.85].forEach(fy => {
      const gy2 = ay + ah * fy;
      s += `<line x1="${(ax+tap).toFixed(1)}" y1="${gy2.toFixed(1)}" x2="${(ax+aw-tap).toFixed(1)}" y2="${gy2.toFixed(1)}" stroke="${GRN}" stroke-width="1.2" opacity="0.5"/>`;
    });
    s += `<line x1="${(cx2-len*dir).toFixed(1)}" y1="${cy2.toFixed(1)}" x2="${(cx2+len*dir).toFixed(1)}" y2="${cy2.toFixed(1)}" stroke="${GRN}" stroke-width="2.2" stroke-linecap="round"/>`;
    s += `<polygon points="${cx2+len*dir},${cy2-5} ${cx2+len*dir+9*dir},${cy2} ${cx2+len*dir},${cy2+5}" fill="${GRN}"/>`;
    if (tipo === "alzante") s += `<text x="${(ax+aw/2).toFixed(1)}" y="${(ay+ah-8).toFixed(1)}" text-anchor="middle" font-size="8" fill="${GRN}" font-family="Arial" font-weight="700">ALZ</text>`;
    // Maniglia scorrevole
    if (hasManigl) {
      const mx2 = verso === "dx" ? ax + aw - tap - 5 : ax + tap + 5;
      s += `<rect x="${(mx2-3).toFixed(1)}" y="${(cy2-11).toFixed(1)}" width="6" height="22" rx="3" fill="${AMB}" stroke="#a06000" stroke-width="0.8"/>`;
    }
  } else if (tipo === "vasistas") {
    if (gw > 6 && gh > 6) {
      const vh = gh * 0.35;
      s += `<path d="M${gx.toFixed(1)} ${(gy+vh).toFixed(1)} L${(gx+gw/2).toFixed(1)} ${(gy+3).toFixed(1)} L${(gx+gw).toFixed(1)} ${(gy+vh).toFixed(1)}" fill="${GRN}15" stroke="${GRN}" stroke-width="1.3" stroke-dasharray="6,3"/>`;
      s += `<line x1="${gx.toFixed(1)}" y1="${(gy+gh).toFixed(1)}" x2="${(gx+gw).toFixed(1)}" y2="${(gy+gh).toFixed(1)}" stroke="${GRN}" stroke-width="1" opacity="0.7"/>`;
      s += `<text x="${(gx+gw/2).toFixed(1)}" y="${(gy+vh/2+4).toFixed(1)}" text-anchor="middle" font-size="9" fill="${GRN}" font-family="Arial">▲</text>`;
    }
  }

  return s;
}

function quota(x1: number, y1: number, x2: number, y2: number, label: string, horiz: boolean, col: string, fs: number, bold: boolean): string {
  const fw = bold ? "bold" : "normal";
  if (horiz) {
    return `
<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="0.9"/>
<line x1="${x1.toFixed(1)}" y1="${(y1-5).toFixed(1)}" x2="${x1.toFixed(1)}" y2="${(y1+5).toFixed(1)}" stroke="${col}" stroke-width="0.9"/>
<line x1="${x2.toFixed(1)}" y1="${(y2-5).toFixed(1)}" x2="${x2.toFixed(1)}" y2="${(y2+5).toFixed(1)}" stroke="${col}" stroke-width="0.9"/>
<text x="${((x1+x2)/2).toFixed(1)}" y="${(y1-7).toFixed(1)}" text-anchor="middle" font-size="${fs}" fill="${col}" font-family="Arial" font-weight="${fw}">${label}</text>`;
  } else {
    const mx = x1 + fs + 4;
    return `
<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="0.9"/>
<line x1="${(x1-5).toFixed(1)}" y1="${y1.toFixed(1)}" x2="${(x1+5).toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${col}" stroke-width="0.9"/>
<line x1="${(x2-5).toFixed(1)}" y1="${y2.toFixed(1)}" x2="${(x2+5).toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${col}" stroke-width="0.9"/>
<text x="${mx.toFixed(1)}" y="${((y1+y2)/2).toFixed(1)}" text-anchor="middle" font-size="${fs}" fill="${col}" font-family="Arial" font-weight="${fw}" transform="rotate(90,${mx.toFixed(1)},${((y1+y2)/2).toFixed(1)})">${label}</text>`;
  }
}

// ─────────────────────────────────────────────────────────────────
// MINI SVG per griglia selezione
// ─────────────────────────────────────────────────────────────────
function MiniSVG({ cfg, sel, col }: any) {
  const W = 70, H = 54, TF = 5, TM = 3, TA = 4;
  const cols = cfg.cols || [100];
  const totalPct = cols.reduce((a: number, b: number) => a + b, 0);
  const availW = W - TF * 2 - TM * (cols.length - 1);
  const bg = sel ? col + "15" : "#f0f4f8";
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${W}" height="${H}" rx="4" fill="${bg}"/>`;
  // Telaio
  s += `<rect x="0" y="0" width="${W}" height="${TF}" fill="${col}" opacity="0.7"/>`;
  s += `<rect x="0" y="${H-TF}" width="${W}" height="${TF}" fill="${col}" opacity="0.7"/>`;
  s += `<rect x="0" y="${TF}" width="${TF}" height="${H-TF*2}" fill="${col}" opacity="0.7"/>`;
  s += `<rect x="${W-TF}" y="${TF}" width="${TF}" height="${H-TF*2}" fill="${col}" opacity="0.7"/>`;
  let curX = TF;
  cols.forEach((pct: number, ci: number) => {
    const cw = (pct / totalPct) * availW;
    if (ci > 0) s += `<rect x="${(curX-TM).toFixed(1)}" y="${TF}" width="${TM}" height="${H-TF*2}" fill="${col}" opacity="0.5"/>`;
    s += `<rect x="${curX.toFixed(1)}" y="${TF}" width="${cw.toFixed(1)}" height="${H-TF*2}" fill="#a8d8ea20" stroke="${col}" stroke-width="0.6" opacity="0.5"/>`;
    const cella = cfg.celle?.[ci] || { tipo: "fisso" };
    const gx = curX + TA, gy = TF + TA, gw = cw - TA * 2, gh = H - TF * 2 - TA * 2;
    if (cella.tipo === "anta" || cella.tipo === "pf") {
      const r = Math.min(gw * 0.8, gh * 0.8);
      const cx = cella.verso === "sx" ? curX + cw : curX;
      const ex = cella.verso === "sx" ? curX : curX + cw;
      const sw = cella.verso === "sx" ? 1 : 0;
      s += `<path d="M${cx.toFixed(1)} ${H-TF} A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${sw} ${ex.toFixed(1)} ${H-TF}" fill="${GRN}15" stroke="${GRN}" stroke-width="0.8" stroke-dasharray="3,2"/>`;
    } else if (cella.tipo === "scorrevole" || cella.tipo === "alzante") {
      const dir = cella.verso === "dx" ? 1 : -1;
      const cx2 = curX + cw/2, cy2 = TF + (H-TF*2)/2;
      s += `<line x1="${(cx2-8*dir).toFixed(1)}" y1="${cy2}" x2="${(cx2+8*dir).toFixed(1)}" y2="${cy2}" stroke="${GRN}" stroke-width="1.2"/>`;
      s += `<polygon points="${cx2+8*dir},${cy2-3} ${cx2+12*dir},${cy2} ${cx2+8*dir},${cy2+3}" fill="${GRN}"/>`;
    } else if (cella.tipo === "vasistas") {
      s += `<path d="M${gx} ${gy+gh*0.35} L${gx+gw/2} ${gy+2} L${gx+gw} ${gy+gh*0.35}" fill="none" stroke="${GRN}" stroke-width="0.8" stroke-dasharray="2,2"/>`;
    } else {
      s += `<line x1="${(gx+2).toFixed(1)}" y1="${(gy+2).toFixed(1)}" x2="${(gx+gw-2).toFixed(1)}" y2="${(gy+gh-2).toFixed(1)}" stroke="#4a7a9a" stroke-width="0.6" opacity="0.4"/>`;
      s += `<line x1="${(gx+gw-2).toFixed(1)}" y1="${(gy+2).toFixed(1)}" x2="${(gx+2).toFixed(1)}" y2="${(gy+gh-2).toFixed(1)}" stroke="#4a7a9a" stroke-width="0.6" opacity="0.4"/>`;
    }
    curX += cw + TM;
  });
  s += `<rect x="0.5" y="0.5" width="${W-1}" height="${H-1}" rx="3.5" fill="none" stroke="${sel?col:"#3a5a7a"}" stroke-width="${sel?2:0.8}"/>`;
  s += `</svg>`;
  return <div dangerouslySetInnerHTML={{ __html: s }} />;
}

// ═══════════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════════
interface Props {
  onClose: () => void;
  onSalva?: (data: any) => void;
  onMisureUpdate?: (mis: { lCentro: number; hCentro: number }) => void;
  vanoNome?: string;
  misureIniziali?: { lCentro?: number; hCentro?: number };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════════
export default function MastroCAD({ onClose, onSalva, onMisureUpdate, vanoNome, misureIniziali }: Props) {
  const [cat, setCat] = useState("infisso");
  const [cfgSel, setCfgSel] = useState<any>(CONFIGS.infisso[0]);
  const [step, setStep] = useState<"scegli"|"canvas">("scegli");
  const [W, setW] = useState(String(misureIniziali?.lCentro || ""));
  const [H, setH] = useState(String(misureIniziali?.hCentro || ""));
  const [sistema, setSistema] = useState("alluminio");
  const [showQuote, setShowQuote] = useState(true);
  const [celleCfg, setCelleCfg] = useState<any[]>([]);
  const [selCella, setSelCella] = useState<number|null>(null);

  const catCol = CATEGORIE.find(c => c.id === cat)?.col || BLU;
  const configs = CONFIGS[cat] || [];
  const Wi = parseInt(W, 10) || 1200;
  const Hi = parseInt(H, 10) || 1500;

  // Inizializza celle quando cambia config
  function selectConfig(cfg: any) {
    setCfgSel(cfg);
    setCelleCfg(JSON.parse(JSON.stringify(cfg.celle || [])));
    setSelCella(null);
  }

  function selectCat(id: string) {
    setCat(id);
    const first = CONFIGS[id]?.[0];
    if (first) selectConfig(first);
  }

  // Celle finali (con modifiche utente)
  const celle = celleCfg.length > 0 ? celleCfg : (cfgSel?.celle || []);

  function vaiCanvas() {
    if (!cfgSel) return;
    if (onMisureUpdate) onMisureUpdate({ lCentro: Wi, hCentro: Hi });
    setStep("canvas");
  }

  function toggleManiglia(idx: number) {
    setCelleCfg(prev => {
      const n = [...prev];
      n[idx] = { ...n[idx], maniglia: !n[idx].maniglia };
      return n;
    });
  }

  function setCellaVers(idx: number, verso: string) {
    setCelleCfg(prev => {
      const n = [...prev];
      n[idx] = { ...n[idx], verso };
      return n;
    });
  }

  function setCellaTipo(idx: number, tipo: string) {
    setCelleCfg(prev => {
      const n = [...prev];
      n[idx] = { ...n[idx], tipo };
      return n;
    });
  }

  // SVG live
  const svgStr = useMemo(() => {
    if (!cfgSel) return "";
    return renderSVG(cfgSel, Wi, Hi, sistema, showQuote, celle, selCella);
  }, [cfgSel, Wi, Hi, sistema, showQuote, celle, selCella]);

  // Download SVG
  function downloadSVG() {
    const blob = new Blob([svgStr.replace('style="width:100%;height:auto;display:block;background:#ffffff"', '')], { type: "image/svg+xml" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `mastro-${cfgSel?.id}-${Wi}x${Hi}.svg`; a.click();
  }

  const root: any = { position: "fixed", inset: 0, zIndex: 600, display: "flex", flexDirection: "column", fontFamily: "system-ui", background: BG };
  const topbar: any = { background: TOP, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 };

  // ══════════════════════════════════════════════════════════════
  // STEP: SCEGLI
  // ══════════════════════════════════════════════════════════════
  if (step === "scegli") {
    return (
      <div style={root}>
        <div style={topbar}>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#888",fontSize:22,cursor:"pointer" }}>←</button>
          <div style={{ color:"#fff",fontSize:14,fontWeight:700,flex:1 }}>MASTRO CAD — {vanoNome||"Nuovo"}</div>
        </div>

        <div style={{ flex:1, overflow:"auto", padding:14 }}>
          {/* Categorie */}
          <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 }}>
            {CATEGORIE.map(c => (
              <button key={c.id} onClick={() => selectCat(c.id)} style={{
                padding:"8px 16px", borderRadius:20, border:`2px solid ${cat===c.id?c.col:"#ddd"}`,
                background:cat===c.id?c.col:"#fff", color:cat===c.id?"#fff":"#555",
                fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
              }}>{c.label}</button>
            ))}
          </div>

          {/* Griglia configurazioni */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:9, marginBottom:16 }}>
            {configs.map((cfg: any) => (
              <button key={cfg.id} onClick={() => selectConfig(cfg)} style={{
                background:cfgSel?.id===cfg.id?catCol+"12":"#fff",
                border:`2px solid ${cfgSel?.id===cfg.id?catCol:"#e0ddd6"}`,
                borderRadius:11, padding:"10px 5px 7px",
                display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                cursor:"pointer", fontFamily:"inherit",
              }}>
                <MiniSVG cfg={cfg} sel={cfgSel?.id===cfg.id} col={catCol} />
                <div style={{ fontSize:10, fontWeight:700, color:cfgSel?.id===cfg.id?catCol:TOP, textAlign:"center" }}>{cfg.label}</div>
              </button>
            ))}
          </div>

          {/* Misure */}
          <div style={{ background:"#fff", borderRadius:14, padding:14, border:`1px solid #e0ddd6` }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:0.6, marginBottom:10 }}>Misure (mm)</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              {[["Larghezza",W,setW],["Altezza",H,setH]].map(([l,v,set]:any) => (
                <div key={l as string}>
                  <div style={{ fontSize:10, color:"#888", marginBottom:4 }}>{l}</div>
                  <input type="number" inputMode="numeric" value={v} placeholder={l==="Larghezza"?"1200":"1500"}
                    onChange={e => set(e.target.value)}
                    style={{ width:"100%", padding:"12px 10px", borderRadius:10, border:`2px solid ${v?AMB:"#ddd"}`, fontSize:22, fontWeight:800, fontFamily:"monospace", textAlign:"right", background:BG, color:TOP, boxSizing:"border-box" as const }} />
                </div>
              ))}
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:12 }}>
              {[["600×900","600","900"],["900×1500","900","1500"],["1200×1500","1200","1500"],["1500×2200","1500","2200"],["2000×1500","2000","1500"]].map(([l,w,h]) => (
                <button key={l} onClick={() => { setW(w); setH(h); }} style={{
                  padding:"6px 11px", borderRadius:8, border:`1px solid ${W===w&&H===h?AMB:"#ddd"}`,
                  background:W===w&&H===h?AMB:"#fafafa", color:W===w&&H===h?"#fff":"#666",
                  fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"monospace",
                }}>{l}</button>
              ))}
            </div>
            <button onClick={vaiCanvas} disabled={!cfgSel} style={{
              width:"100%", padding:15, borderRadius:12, border:"none",
              background:cfgSel?catCol:"#ccc", color:"#fff",
              fontSize:15, fontWeight:800, cursor:cfgSel?"pointer":"default", fontFamily:"inherit",
            }}>
              Disegna {cfgSel?.label}{W&&H?` — ${W}×${H}mm`:" →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════
  // STEP: CANVAS
  // ══════════════════════════════════════════════════════════════
  return (
    <div style={root}>
      {/* TOPBAR */}
      <div style={topbar}>
        <button onClick={() => setStep("scegli")} style={{ background:"none",border:"none",color:"#888",fontSize:22,cursor:"pointer" }}>←</button>
        <div style={{ color:"#fff",fontSize:13,fontWeight:700,flex:1 }}>
          {cfgSel?.label} <span style={{ fontSize:11,color:"#555",fontWeight:400 }}>{Wi}×{Hi}mm</span>
        </div>
        <button onClick={downloadSVG} style={{ padding:"5px 12px",borderRadius:7,border:`1px solid ${GRN}`,background:GRN+"15",color:GRN,fontSize:11,fontWeight:700,cursor:"pointer" }}>↓ SVG</button>
        <button onClick={() => { if(onSalva) onSalva({ cfg:cfgSel, celle, W:Wi, H:Hi, sistema }); onClose(); }} style={{ padding:"7px 16px",borderRadius:9,border:"none",background:GRN,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer" }}>Salva</button>
      </div>

      {/* TOOLBAR */}
      <div style={{ background:"#fff", borderBottom:"1px solid #e8e6e0", padding:"8px 12px", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", flexShrink:0 }}>
        {/* Sistema */}
        {Object.entries(SISTEMI).map(([id, s]: any) => (
          <button key={id} onClick={() => setSistema(id)} style={{
            padding:"5px 10px", borderRadius:7, border:`1px solid ${sistema===id?s.col:"#ddd"}`,
            background:sistema===id?s.col+"18":"#fafafa", color:sistema===id?s.col:"#666",
            fontSize:11, fontWeight:sistema===id?700:500, cursor:"pointer",
          }}>{s.n}</button>
        ))}
        <div style={{ width:1, height:18, background:"#ddd" }}/>
        <button onClick={() => setShowQuote(q => !q)} style={{
          padding:"5px 10px", borderRadius:7, border:`1px solid ${showQuote?BLU:"#ddd"}`,
          background:showQuote?BLU+"15":"#fafafa", color:showQuote?BLU:"#666", fontSize:11, cursor:"pointer",
        }}>Quote {showQuote?"ON":"OFF"}</button>
        <div style={{ flex:1 }}/>
        <span style={{ fontSize:10, color:"#aaa" }}>Tocca cella per modificare</span>
      </div>

      {/* SVG CANVAS */}
      <div style={{ flex:1, overflow:"auto", padding:8, background:"#f8f8f6" }}>
        {/* Canvas cliccabile per selezione celle */}
        <div style={{ position:"relative", display:"inline-block", width:"100%" }}>
          <div dangerouslySetInnerHTML={{ __html: svgStr }} />
          {/* Overlay aree cliccabili per celle */}
          <CelleOverlay cfg={cfgSel} celle={celle} Wi={Wi} Hi={Hi} sistema={sistema} selCella={selCella} setSelCella={setSelCella} />
        </div>
      </div>

      {/* PANEL CELLA SELEZIONATA */}
      {selCella !== null && celle[selCella] && (
        <div style={{ background:"#fff", borderTop:"1px solid #e8e6e0", padding:"12px 14px 20px", flexShrink:0 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:AMB }}>Cella {selCella+1} — {celle[selCella].tipo}</div>
            <button onClick={() => setSelCella(null)} style={{ background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#888" }}>×</button>
          </div>
          {/* Tipo */}
          <div style={{ fontSize:10, color:"#888", fontWeight:700, marginBottom:6 }}>TIPO</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {["fisso","anta","pf","scorrevole","alzante","vasistas"].map(t => (
              <button key={t} onClick={() => setCellaTipo(selCella, t)} style={{
                padding:"6px 11px", borderRadius:8, border:`1px solid ${celle[selCella].tipo===t?GRN:"#ddd"}`,
                background:celle[selCella].tipo===t?GRN+"15":"#fafafa", color:celle[selCella].tipo===t?GRN:"#666",
                fontSize:11, fontWeight:celle[selCella].tipo===t?700:500, cursor:"pointer",
              }}>{t==="pf"?"Portafin.":t.charAt(0).toUpperCase()+t.slice(1)}</button>
            ))}
          </div>
          {/* Verso */}
          {["anta","pf","scorrevole","alzante"].includes(celle[selCella].tipo) && (
            <>
              <div style={{ fontSize:10, color:"#888", fontWeight:700, marginBottom:6 }}>VERSO</div>
              <div style={{ display:"flex", gap:6, marginBottom:10 }}>
                {[["sx","← Sinistra"],["dx","Destra →"]].map(([v,l]) => (
                  <button key={v} onClick={() => setCellaVers(selCella, v)} style={{
                    flex:1, padding:"8px", borderRadius:8, border:`1px solid ${celle[selCella].verso===v?AMB:"#ddd"}`,
                    background:celle[selCella].verso===v?AMB+"15":"#fafafa", color:celle[selCella].verso===v?AMB:"#666",
                    fontSize:12, fontWeight:700, cursor:"pointer", textAlign:"center",
                  }}>{l}</button>
                ))}
              </div>
            </>
          )}
          {/* Maniglia */}
          {["anta","pf","scorrevole","alzante"].includes(celle[selCella].tipo) && (
            <button onClick={() => toggleManiglia(selCella)} style={{
              width:"100%", padding:"10px", borderRadius:10,
              border:`1.5px solid ${celle[selCella].maniglia?AMB:"#ddd"}`,
              background:celle[selCella].maniglia?AMB+"15":"#fafafa",
              color:celle[selCella].maniglia?AMB:"#888",
              fontSize:13, fontWeight:700, cursor:"pointer",
            }}>
              {celle[selCella].maniglia ? "✓ Maniglia presente" : "+ Aggiungi maniglia"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Overlay trasparente per click su celle nel canvas
function CelleOverlay({ cfg, celle, Wi, Hi, sistema, selCella, setSelCella }: any) {
  if (!cfg) return null;
  const S = SISTEMI[sistema] || SISTEMI.alluminio;
  const { TF, TM, TA } = S;
  const cols = cfg.cols || [100];
  const totalPct = cols.reduce((a: number, b: number) => a + b, 0);
  // Stessa scala del renderer
  const maxW = 560, maxH = 480;
  const scalaW = maxW / Wi, scalaH = maxH / Hi;
  const sc = Math.min(scalaW, scalaH, 0.35);
  const PAD = 50, QOFF = 28;
  const fw = Wi * sc, fh = Hi * sc;
  const ox = PAD + QOFF, oy = PAD + QOFF;
  const tfp = TF * sc, tmp = TM * sc;
  const vW = fw + PAD * 2 + QOFF * 2;
  const vH = fh + PAD * 2 + QOFF * 2;
  const availW = fw - tfp * 2 - tmp * (cols.length - 1);
  let curX = ox + tfp;
  const areas: { x: number; y: number; w: number; h: number; idx: number }[] = [];
  cols.forEach((pct: number, ci: number) => {
    const cw = (pct / totalPct) * availW;
    areas.push({ x: curX, y: oy + tfp, w: cw, h: fh - tfp * 2, idx: ci });
    curX += cw + tmp;
  });
  // Percentuale sul div contenitore
  return (
    <svg viewBox={`0 0 ${vW.toFixed(1)} ${vH.toFixed(1)}`} style={{ position:"absolute", inset:0, width:"100%", height:"100%", cursor:"pointer" }}>
      {areas.map(a => (
        <rect key={a.idx} x={a.x} y={a.y} width={a.w} height={a.h}
          fill={selCella===a.idx?"#D0800815":"transparent"}
          stroke={selCella===a.idx?AMB:"transparent"} strokeWidth="2"
          onClick={() => setSelCella(selCella===a.idx?null:a.idx)}
          style={{ cursor:"pointer" }}
        />
      ))}
    </svg>
  );
}
