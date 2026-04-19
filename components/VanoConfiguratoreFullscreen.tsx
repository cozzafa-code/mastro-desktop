"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO ERP — VanoConfiguratoreFullscreen
// Configuratore vano fullscreen per tablet e smartphone
// Flusso: tipologia → misure → campiture → accessori → prezzo
// Salva direttamente nel vano della commessa
// ═══════════════════════════════════════════════════════════════
import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useMastro } from "./MastroContext";
// MastroCadEngine rimosso — SVG puro

// ── Costanti design ─────────────────────────────────────────
const AMB = "#D08008";
const GRN = "#1A9E73";
const RED = "#DC4444";
const BLU = "#3B7FE0";
const fmt = (n: number) => (n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── LIBRERIA TIPOLOGIE ──────────────────────────────────────
const LIBRERIA = [
  {
    id: "F1A_DX", label: "1 anta →", cat: "Finestre",
    cols: [{ w: 100 }], righe: [[100]],
    celle: [{ tipo: "anta", verso: "dx" }]
  },
  {
    id: "F1A_SX", label: "← 1 anta", cat: "Finestre",
    cols: [{ w: 100 }], righe: [[100]],
    celle: [{ tipo: "anta", verso: "sx" }]
  },
  {
    id: "F2A", label: "2 ante", cat: "Finestre",
    cols: [{ w: 50 }, { w: 50 }], righe: [[100], [100]],
    celle: [{ tipo: "anta", verso: "sx" }, { tipo: "anta", verso: "dx" }]
  },
  {
    id: "F3A", label: "3 ante", cat: "Finestre",
    cols: [{ w: 33 }, { w: 34 }, { w: 33 }], righe: [[100], [100], [100]],
    celle: [{ tipo: "fisso" }, { tipo: "anta", verso: "sx" }, { tipo: "anta", verso: "dx" }]
  },
  {
    id: "F_FISSO", label: "Fisso", cat: "Finestre",
    cols: [{ w: 100 }], righe: [[100]],
    celle: [{ tipo: "fisso" }]
  },
  {
    id: "SOPRALUCE", label: "Sopraluce", cat: "Finestre",
    cols: [{ w: 50 }, { w: 50 }], righe: [[30, 70], [30, 70]],
    celle: [{ tipo: "fisso" }, { tipo: "fisso" }, { tipo: "anta", verso: "sx" }, { tipo: "anta", verso: "dx" }]
  },
  {
    id: "FISSO_ANTA", label: "Fisso+Anta", cat: "Finestre",
    cols: [{ w: 35 }, { w: 65 }], righe: [[100], [100]],
    celle: [{ tipo: "fisso" }, { tipo: "anta", verso: "dx" }]
  },
  {
    id: "VASISTAS", label: "Vasistas", cat: "Finestre",
    cols: [{ w: 100 }], righe: [[35, 65]],
    celle: [{ tipo: "vasistas" }, { tipo: "fisso" }]
  },
  {
    id: "PF2", label: "Portafinestra 2a", cat: "Porte-finestre",
    cols: [{ w: 50 }, { w: 50 }], righe: [[100], [100]],
    celle: [{ tipo: "portafinestra", verso: "sx" }, { tipo: "portafinestra", verso: "dx" }]
  },
  {
    id: "PF1_DX", label: "PF 1 anta →", cat: "Porte-finestre",
    cols: [{ w: 100 }], righe: [[100]],
    celle: [{ tipo: "portafinestra", verso: "dx" }]
  },
  {
    id: "SC2", label: "Scorrevole 2", cat: "Scorrevoli",
    cols: [{ w: 50 }, { w: 50 }], righe: [[100], [100]],
    celle: [{ tipo: "scorrevole", verso: "dx" }, { tipo: "fisso" }]
  },
  {
    id: "SC3", label: "Scorrevole 3", cat: "Scorrevoli",
    cols: [{ w: 33 }, { w: 34 }, { w: 33 }], righe: [[100], [100], [100]],
    celle: [{ tipo: "fisso" }, { tipo: "scorrevole", verso: "dx" }, { tipo: "fisso" }]
  },
  {
    id: "ALZ", label: "Alzante scorrev.", cat: "Scorrevoli",
    cols: [{ w: 50 }, { w: 50 }], righe: [[100], [100]],
    celle: [{ tipo: "alzante", verso: "dx" }, { tipo: "alzante", verso: "sx" }]
  },
  {
    id: "P1_DX", label: "Porta →", cat: "Porte",
    cols: [{ w: 100 }], righe: [[100]],
    celle: [{ tipo: "portafinestra", verso: "dx" }]
  },
  {
    id: "P2", label: "Porta 2 ante", cat: "Porte",
    cols: [{ w: 50 }, { w: 50 }], righe: [[100], [100]],
    celle: [{ tipo: "portafinestra", verso: "sx" }, { tipo: "portafinestra", verso: "dx" }]
  },
  {
    id: "VETRINA3", label: "Vetrina 3 camp.", cat: "Vetrine",
    cols: [{ w: 33 }, { w: 34 }, { w: 33 }], righe: [[100], [100], [100]],
    celle: [{ tipo: "fisso" }, { tipo: "fisso" }, { tipo: "fisso" }]
  },
  {
    id: "VETRINA5", label: "Vetrina 5 camp.", cat: "Vetrine",
    cols: [{ w: 20 }, { w: 20 }, { w: 20 }, { w: 20 }, { w: 20 }],
    righe: [[100], [100], [100], [100], [100]],
    celle: [
      { tipo: "fisso" }, { tipo: "anta", verso: "sx" },
      { tipo: "scorrevole", verso: "dx" },
      { tipo: "anta", verso: "dx" }, { tipo: "fisso" }
    ]
  },
  {
    id: "PORTA_VETRINA", label: "Porta+Vetrina", cat: "Vetrine",
    cols: [{ w: 25 }, { w: 25 }, { w: 25 }, { w: 25 }],
    righe: [[100], [100], [100], [100]],
    celle: [
      { tipo: "fisso" }, { tipo: "portafinestra", verso: "sx" },
      { tipo: "portafinestra", verso: "dx" }, { tipo: "fisso" }
    ]
  },
  {
    id: "ARCO", label: "Con arco", cat: "Speciali",
    cols: [{ w: 50 }, { w: 50 }], righe: [[22, 78], [22, 78]],
    celle: [{ tipo: "fisso" }, { tipo: "fisso" }, { tipo: "anta", verso: "sx" }, { tipo: "anta", verso: "dx" }]
  },
  {
    id: "CUSTOM", label: "Personalizzato", cat: "Speciali",
    cols: [{ w: 50 }, { w: 50 }], righe: [[100], [100]],
    celle: [{ tipo: "fisso" }, { tipo: "fisso" }]
  },
];

const CATS = ["Finestre", "Porte-finestre", "Scorrevoli", "Porte", "Vetrine", "Speciali"];

// ── STEP DEL CONFIGURATORE ──────────────────────────────────
// 0 = tipologia, 1 = misure+config, 2 = accessori+prezzo

// ── MOTORE SVG ──────────────────────────────────────────────
function buildSVG(cfg: any, W: number, H: number, opts: any = {}): string {
  const { showQuote = true, tapp = false, zanz = false, dark = false } = opts;
  const P = cfg.profili || { telaio: 60, anta: 50, mont: 58, trav: 52 };
  const PAD = showQuote ? 36 : 12;
  const QPAD = showQuote ? 48 : 16;
  const cassHmm = (tapp && cfg.cassH) ? cfg.cassH : 0;

  const cols = cfg.colonne || [{ w: 100 }];
  const totalW = cols.reduce((s: number, c: any) => s + c.w, 0);

  const VW = 600, VH = 440;
  const fw = VW - PAD * 2 - QPAD;
  const fhTotal = VH - PAD * 2 - QPAD;
  const cassHpx = cassHmm > 0 ? (cassHmm / H) * fhTotal : 0;
  const fh = fhTotal - cassHpx;
  const ox = PAD, oy = PAD + cassHpx;

  const bg = dark ? "#232325" : "#f0f4fa";
  const frameStroke = dark ? "#c0d0e0" : "#1a2a3a";
  const profFill = dark ? "#3a5a7a" : "#b0c0d0";

  let d = `<svg viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg" style="background:${bg}">`;

  // DEFS
  d += `<defs>
    <pattern id="hp" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="5" stroke="${dark ? '#5a7a9a' : '#8a9ab0'}" stroke-width="1.3"/></pattern>
    <pattern id="gp" width="14" height="14" patternUnits="userSpaceOnUse">
      <line x1="0" y1="14" x2="14" y2="0" stroke="#4a90b8" stroke-width="0.5" opacity="0.7"/></pattern>
  </defs>`;

  const TF = (P.telaio / W) * fw;
  const TM = (P.mont / W) * fw;
  const TA = (P.anta / W) * fw;

  const poly = (pts: number[][], fill = "url(#hp)", stroke = frameStroke, sw = 1.5) => {
    const p = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    return `<polygon points="${p}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  };

  // CASSONETTO
  if (cassHpx > 0) {
    const c45 = Math.min(8, cassHpx / 2);
    d += poly([[ox + c45, PAD], [ox + fw - c45, PAD], [ox + fw, PAD + c45], [ox + fw, PAD + cassHpx - c45], [ox + fw - c45, PAD + cassHpx], [ox + c45, PAD + cassHpx], [ox, PAD + cassHpx - c45], [ox, PAD + c45]]);
    d += `<rect x="${ox}" y="${PAD}" width="${fw}" height="${cassHpx}" fill="none" stroke="${frameStroke}" stroke-width="1.5"/>`;
    d += `<text x="${ox + fw / 2}" y="${PAD + cassHpx / 2 + 4}" text-anchor="middle" font-size="10" fill="${AMB}" font-family="system-ui" font-weight="600">CASSONETTO</text>`;
  }

  // TELAIO ESTERNO
  const c45F = Math.min(TF, 14);
  d += poly([[ox, oy], [ox + fw, oy], [ox + fw, oy + TF - c45F], [ox + fw - c45F, oy + TF], [ox + c45F, oy + TF], [ox, oy + TF - c45F]]); // top
  d += poly([[ox + c45F, oy + fh - TF], [ox + fw - c45F, oy + fh - TF], [ox + fw, oy + fh - TF + c45F], [ox + fw, oy + fh], [ox, oy + fh], [ox, oy + fh - TF + c45F]]); // bot
  d += poly([[ox, oy + TF], [ox + TF - c45F, oy + TF], [ox + TF, oy + TF + c45F], [ox + TF, oy + fh - TF - c45F], [ox + TF - c45F, oy + fh - TF], [ox, oy + fh - TF]]); // left
  d += poly([[ox + fw - TF, oy + TF], [ox + fw, oy + TF], [ox + fw, oy + fh - TF], [ox + fw - TF, oy + fh - TF], [ox + fw - TF, oy + fh - TF - c45F], [ox + fw - TF + c45F, oy + fh - TF], [ox + fw, oy + fh - TF], [ox + fw, oy + TF], [ox + fw - TF + c45F, oy + TF], [ox + fw - TF, oy + TF + c45F]]); // right
  d += `<rect x="${ox}" y="${oy}" width="${fw}" height="${fh}" fill="none" stroke="${frameStroke}" stroke-width="2.2"/>`;

  // COLONNE — calcola posizioni x
  const availW2 = fw - TF * 2 - TM * (cols.length - 1);
  let curX = ox + TF;
  const colBounds: any[] = [];
  cols.forEach((col: any, ci: number) => {
    const cw = (col.w / totalW) * availW2;
    colBounds.push({ x1: curX, x2: curX + cw, col, ci });
    curX += cw + (ci < cols.length - 1 ? TM : 0);
  });

  // MONTANTI
  colBounds.forEach((cb, ci) => {
    if (ci < colBounds.length - 1) {
      const mx1 = cb.x2, mx2 = cb.x2 + TM;
      const mc = Math.min(TM / 2, 10);
      d += poly([[mx1 + mc, oy + TF], [mx2 - mc, oy + TF], [mx2, oy + TF + mc], [mx2, oy + fh - TF - mc], [mx2 - mc, oy + fh - TF], [mx1 + mc, oy + fh - TF], [mx1, oy + fh - TF - mc], [mx1, oy + TF + mc]]);
      d += `<line x1="${(mx1 + mx2) / 2}" y1="${oy + TF}" x2="${(mx1 + mx2) / 2}" y2="${oy + fh - TF}" stroke="${frameStroke}" stroke-width="1.2" opacity="0.5"/>`;
    }
  });

  // CELLE
  colBounds.forEach((cb) => {
    const { x1, x2, col, ci } = cb;
    const cw = x2 - x1;
    const righeH = cfg.righe?.[ci] || [100];
    const totalH = righeH.reduce((s: number, h: number) => s + h, 0);
    const TT = (P.trav / H) * fh;
    const availH2 = fh - TF * 2 - TT * (righeH.length - 1);

    let curY = oy + TF;
    righeH.forEach((rh: number, ri: number) => {
      const ch = (rh / totalH) * availH2;
      const cellaIdx = ci * righeH.length + ri;
      const cella = cfg.celle?.[cellaIdx] || { tipo: "fisso", verso: "dx" };

      // TRAVERSO sopra (tranne prima riga)
      if (ri > 0) {
        const ty1 = curY - TT, ty2 = curY;
        const tc = Math.min(TT / 2, 8);
        d += poly([[x1 + tc, ty1], [x2 - tc, ty1], [x2, ty1 + tc], [x2, ty2 - tc], [x2 - tc, ty2], [x1 + tc, ty2], [x1, ty2 - tc], [x1, ty1 + tc]]);
        d += `<line x1="${x1}" y1="${(ty1 + ty2) / 2}" x2="${x2}" y2="${(ty1 + ty2) / 2}" stroke="${frameStroke}" stroke-width="1" opacity="0.4"/>`;
      }

      d += drawCellaInternal(x1, curY, cw, ch, TA, cella, frameStroke, dark);
      curY += ch + TT;
    });
  });

  // ZANZARIERA
  if (zanz) {
    d += `<rect x="${ox + 3}" y="${oy + 3}" width="${fw - 6}" height="${fh - 6}" fill="none" stroke="${BLU}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6"/>`;
    d += `<text x="${ox + 12}" y="${oy + 18}" font-size="9" fill="${BLU}" font-family="system-ui" font-weight="600">ZANZ.</text>`;
  }

  // QUOTE
  if (showQuote) {
    const qCol = dark ? "#888" : "#555";
    d += `<line x1="${ox}" y1="${oy - 14}" x2="${ox + fw}" y2="${oy - 14}" stroke="${qCol}" stroke-width="0.9"/>`;
    d += `<line x1="${ox}" y1="${oy - 18}" x2="${ox}" y2="${oy - 10}" stroke="${qCol}" stroke-width="0.9"/>`;
    d += `<line x1="${ox + fw}" y1="${oy - 18}" x2="${ox + fw}" y2="${oy - 10}" stroke="${qCol}" stroke-width="0.9"/>`;
    d += `<text x="${ox + fw / 2}" y="${oy - 18}" text-anchor="middle" font-size="11" fill="${qCol}" font-family="system-ui" font-weight="500">${W} mm</text>`;
    d += `<line x1="${ox + fw + 16}" y1="${oy}" x2="${ox + fw + 16}" y2="${oy + fh}" stroke="${qCol}" stroke-width="0.9"/>`;
    d += `<line x1="${ox + fw + 12}" y1="${oy}" x2="${ox + fw + 20}" y2="${oy}" stroke="${qCol}" stroke-width="0.9"/>`;
    d += `<line x1="${ox + fw + 12}" y1="${oy + fh}" x2="${ox + fw + 20}" y2="${oy + fh}" stroke="${qCol}" stroke-width="0.9"/>`;
    d += `<text x="${ox + fw + 32}" y="${oy + fh / 2 + 4}" text-anchor="middle" font-size="11" fill="${qCol}" font-family="system-ui" font-weight="500" transform="rotate(90,${ox + fw + 32},${oy + fh / 2 + 4})">${H} mm</text>`;
  }

  d += "</svg>";
  return d;
}

function drawCellaInternal(ax: number, ay: number, aw: number, ah: number, TA: number, cella: any, stroke: string, dark: boolean): string {
  const tipo = cella.tipo || "fisso";
  const verso = cella.verso || "dx";
  let s = "";
  const c45 = Math.min(TA, 9);

  if (tipo === "vuoto") {
    s += `<rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="${dark ? '#111' : '#e8e8e8'}" stroke="${dark ? '#2a2a2a' : '#ccc'}" stroke-width="1"/>`;
    return s;
  }

  // 4 barre profilo con tagli 45°
  const ps = `url(#hp)`;
  s += `<polygon points="${ax + c45},${ay} ${ax + aw - c45},${ay} ${ax + aw},${ay + c45} ${ax + aw},${ay + TA - c45} ${ax + aw - c45},${ay + TA} ${ax + c45},${ay + TA} ${ax},${ay + TA - c45} ${ax},${ay + c45}" fill="${ps}" stroke="${stroke}" stroke-width="1.2"/>`; // top
  s += `<polygon points="${ax + c45},${ay + ah - TA} ${ax + aw - c45},${ay + ah - TA} ${ax + aw},${ay + ah - TA + c45} ${ax + aw},${ay + ah - c45} ${ax + aw - c45},${ay + ah} ${ax + c45},${ay + ah} ${ax},${ay + ah - c45} ${ax},${ay + ah - TA + c45}" fill="${ps}" stroke="${stroke}" stroke-width="1.2"/>`; // bot
  s += `<polygon points="${ax},${ay + TA} ${ax + TA - c45},${ay + TA} ${ax + TA},${ay + TA + c45} ${ax + TA},${ay + ah - TA - c45} ${ax + TA - c45},${ay + ah - TA} ${ax},${ay + ah - TA}" fill="${ps}" stroke="${stroke}" stroke-width="1.2"/>`; // left
  s += `<polygon points="${ax + aw - TA},${ay + TA} ${ax + aw},${ay + TA} ${ax + aw},${ay + ah - TA} ${ax + aw - TA},${ay + ah - TA} ${ax + aw - TA},${ay + ah - TA - c45} ${ax + aw - TA + c45},${ay + ah - TA} ${ax + aw},${ay + ah - TA} ${ax + aw},${ay + TA} ${ax + aw - TA + c45},${ay + TA} ${ax + aw - TA},${ay + TA + c45}" fill="${ps}" stroke="${stroke}" stroke-width="1.2"/>`; // right
  s += `<rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="none" stroke="${stroke}" stroke-width="1.8"/>`;

  // Vetro
  const gx = ax + TA, gy = ay + TA, gw = aw - TA * 2, gh = ah - TA * 2;
  if (gw > 2 && gh > 2) {
    s += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" fill="url(#gp)"/>`;
    s += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" fill="#a8d8ea25" stroke="#4a96b8" stroke-width="0.8"/>`;
  }

  if (tipo === "fisso") {
    if (gw > 6 && gh > 6) {
      s += `<line x1="${gx + 3}" y1="${gy + 3}" x2="${gx + gw - 3}" y2="${gy + gh - 3}" stroke="#4a7a9a" stroke-width="0.8" opacity="0.6"/>`;
      s += `<line x1="${gx + gw - 3}" y1="${gy + 3}" x2="${gx + 3}" y2="${gy + gh - 3}" stroke="#4a7a9a" stroke-width="0.8" opacity="0.6"/>`;
    }
  } else if (tipo === "anta" || tipo === "portafinestra") {
    if (gw > 10 && gh > 10) {
      const r = Math.min(gw * 0.76, gh * 0.72);
      const cx = verso === "sx" ? ax + aw : ax;
      const sweep = verso === "sx" ? 1 : 0;
      s += `<path d="M${cx} ${ay + ah} A${r} ${r} 0 0 ${sweep} ${verso === "sx" ? ax : ax + aw} ${ay + ah}" fill="#1A9E7318" stroke="#1A9E73" stroke-width="1.4" stroke-dasharray="7,4"/>`;
    }
    const mx = verso === "dx" ? ax + aw - TA - 3 : ax + TA + 3;
    const my = ay + ah / 2;
    s += `<rect x="${mx - 2.5}" y="${my - 10}" width="5" height="20" rx="2.5" fill="${AMB}"/>`;
  } else if (tipo === "scorrevole" || tipo === "alzante") {
    const dir = verso === "dx" ? 1 : -1;
    const cx = ax + aw / 2 + dir * 6, cy = ay + ah / 2;
    if (gw > 10 && gh > 10) {
      s += `<line x1="${cx - 12 * dir}" y1="${cy}" x2="${cx + 14 * dir}" y2="${cy}" stroke="#1A9E73" stroke-width="2.2" stroke-linecap="round"/>`;
      s += `<polygon points="${cx + 14 * dir},${cy - 5} ${cx + 14 * dir + 8 * dir},${cy} ${cx + 14 * dir},${cy + 5}" fill="#1A9E73"/>`;
      if (tipo === "alzante") {
        s += `<text x="${ax + aw / 2}" y="${ay + ah - 8}" text-anchor="middle" font-size="8" fill="#1A9E73" font-family="system-ui" font-weight="600">ALZ</text>`;
      }
    }
  } else if (tipo === "vasistas") {
    if (gw > 8 && gh > 8) {
      const vh = gh * 0.38;
      s += `<path d="M${gx} ${gy + vh} L${gx + gw / 2} ${gy + 4} L${gx + gw} ${gy + vh}" fill="#1A9E7315" stroke="#1A9E73" stroke-width="1.3" stroke-dasharray="5,3"/>`;
      s += `<text x="${gx + gw / 2}" y="${gy + vh / 2 + 4}" text-anchor="middle" font-size="9" fill="#1A9E73" font-family="system-ui">▲</text>`;
    }
  }

  return s;
}

// ── MINI PREVIEW per libreria ────────────────────────────────
function buildMiniSVG(lib: any): string {
  const cols = lib.cols || [{ w: 100 }];
  const totalW = cols.reduce((s: number, c: any) => s + c.w, 0);
  const W = 80, H = 60, TF = 6, TM = 5, TA = 5;
  const ox = 2, oy = 2, fw = W - 4, fh = H - 4;
  const availW = fw - TF * 2 - TM * (cols.length - 1);

  let d = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="background:#f8f9ff">`;
  // telaio
  d += `<rect x="${ox}" y="${oy}" width="${fw}" height="${fh}" fill="#d0d8e4" stroke="#2c3e50" stroke-width="1.5"/>`;
  d += `<rect x="${ox + TF}" y="${oy + TF}" width="${fw - TF * 2}" height="${fh - TF * 2}" fill="#e8f4fa" stroke="#4a90b8" stroke-width="0.8"/>`;

  let curX = ox + TF;
  cols.forEach((col: any, ci: number) => {
    const cw = (col.w / totalW) * availW;
    // montante
    if (ci > 0) {
      d += `<rect x="${curX - TM}" y="${oy + TF}" width="${TM}" height="${fh - TF * 2}" fill="#c0cad8" stroke="#2c3e50" stroke-width="0.8"/>`;
    }
    // anta base
    d += `<rect x="${curX + 2}" y="${oy + TF + 2}" width="${cw - 4}" height="${fh - TF * 2 - 4}" fill="#d8eaf4" stroke="#3a5a7a" stroke-width="0.8"/>`;
    // apertura
    const cella = lib.celle?.[ci] || { tipo: "fisso", verso: "dx" };
    if (cella.tipo === "anta" || cella.tipo === "portafinestra") {
      const r = Math.min((cw - 4) * 0.7, (fh - TF * 2 - 4) * 0.7);
      const cx = cella.verso === "sx" ? curX + cw - 2 : curX + 2;
      const sweep = cella.verso === "sx" ? 1 : 0;
      d += `<path d="M${cx} ${oy + fh - TF - 2} A${r} ${r} 0 0 ${sweep} ${cella.verso === "sx" ? curX + 2 : curX + cw - 2} ${oy + fh - TF - 2}" fill="none" stroke="#1A9E73" stroke-width="1" stroke-dasharray="3,2"/>`;
    } else if (cella.tipo === "scorrevole" || cella.tipo === "alzante") {
      const mid = curX + cw / 2;
      d += `<line x1="${mid - 8}" y1="${oy + fh / 2}" x2="${mid + 8}" y2="${oy + fh / 2}" stroke="#1A9E73" stroke-width="1.5"/>`;
      d += `<polygon points="${mid + 8},${oy + fh / 2 - 3} ${mid + 12},${oy + fh / 2} ${mid + 8},${oy + fh / 2 + 3}" fill="#1A9E73"/>`;
    }
    curX += cw + TM;
  });

  d += "</svg>";
  return d;
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ══════════════════════════════════════════════════════════════
interface Props {
  vano: any;
  onSalva: (patch: any) => void;
  onChiudi: () => void;
  T: any;
}

export default function VanoConfiguratoreFullscreen({ vano, onSalva, onChiudi, T }: Props) {
  const { aziendaInfo, calcolaVanoPrezzo, selectedCM } = useMastro();
  const az = aziendaInfo || {};
  const c = selectedCM || {};

  // Step 0=tipologia, 1=misure+config, 2=accessori+prezzo
  const [step, setStep] = useState(vano.infissoConfig ? 1 : 0);
  const [catAttiva, setCatAttiva] = useState("Finestre");

  // Config infisso
  const [cfg, setCfg] = useState<any>(vano.infissoConfig || {
    tipId: "F2A",
    colonne: [{ w: 50 }, { w: 50 }],
    righe: [[100], [100]],
    celle: [{ tipo: "anta", verso: "sx" }, { tipo: "anta", verso: "dx" }],
    profili: { telaio: 60, anta: 50, mont: 58, trav: 52 },
    cassH: 200,
  });

  // Misure
  const [misure, setMisure] = useState<any>(vano.misure || {});
  const [tipoMisura, setTipoMisura] = useState(vano.tipoMisura || "finita");
  const [telaioMm, setTelaioMm] = useState(vano.telaioMm || 20);

  // Accessori
  const [tapp, setTapp] = useState(!!vano.accessori?.tapparella?.attivo);
  const [zanz, setZanz] = useState(!!vano.accessori?.zanzariera?.attivo);
  const [cassOn, setCassOn] = useState(!!vano.cassonetto);
  const [posaP, setPosaP] = useState(vano.prevPosaPrezzo || 0);
  const [preu, setPreu] = useState(vano.prevPrezzoOverride ?? calcolaVanoPrezzo?.(vano, c) ?? 0);
  const [pz, setPz] = useState(vano.pezzi || 1);
  const [tappP, setTappP] = useState(vano.accessori?.tapparella?.prezzo || 0);
  const [zanzP, setZanzP] = useState(vano.accessori?.zanzariera?.prezzo || 0);
  const [nome, setNome] = useState(vano.nome || "Vano");
  const [selCella, setSelCella] = useState<number | null>(null);

  const W = misure.lCentro || 1200;
  const H = misure.hCentro || 1500;

  // Calcola misura infisso in base alla tipologia
  const misuraInfisso = useMemo(() => {
    let detL = 0, detH = 0;
    if (tipoMisura === "pCorta") { detL = 5; detH = 5; }
    if (tipoMisura === "pLunga") { detL = telaioMm; detH = telaioMm; }
    if (tipoMisura === "grezzo") { detL = -20; detH = -20; }
    return { L: W - detL * 2, H: H - detH * 2, detL, detH };
  }, [W, H, tipoMisura, telaioMm]);

  const totale = useMemo(() => {
    const sub = preu * pz;
    return sub + (tapp ? tappP : 0) + (zanz ? zanzP : 0) + posaP;
  }, [preu, pz, tapp, tappP, zanz, zanzP, posaP]);

  const svgStr = useMemo(() => buildSVG(cfg, misuraInfisso.L, misuraInfisso.H, {
    showQuote: true, tapp: cassOn, zanz, dark: T.bg === "#1A1A1C",
  }), [cfg, misuraInfisso.L, misuraInfisso.H, cassOn, zanz, T.bg]);

  // Applica tipologia dalla libreria
  const applyLib = useCallback((lib: any) => {
    setCfg((prev: any) => ({
      ...prev,
      tipId: lib.id,
      colonne: lib.cols,
      righe: lib.righe,
      celle: lib.celle,
    }));
    setSelCella(null);
    setStep(1);
  }, []);

  // Aggiorna cella
  const updCella = useCallback((idx: number, patch: any) => {
    setCfg((prev: any) => {
      const celle = [...(prev.celle || [])];
      celle[idx] = { ...celle[idx], ...patch };
      return { ...prev, celle };
    });
  }, []);

  // Aggiorna colonna
  const updColonna = useCallback((ci: number, patch: any) => {
    setCfg((prev: any) => {
      const colonne = [...(prev.colonne || [])];
      colonne[ci] = { ...colonne[ci], ...patch };
      return { ...prev, colonne };
    });
  }, []);

  // Aggiorna righe colonna
  const updRighe = useCallback((ci: number, righe: number[]) => {
    setCfg((prev: any) => {
      const r = [...(prev.righe || [])];
      r[ci] = righe;
      return { ...prev, righe: r };
    });
  }, []);

  // Aggiunge colonna
  const addColonna = useCallback(() => {
    setCfg((prev: any) => {
      const cols = [...(prev.colonne || [])];
      const newW = Math.round(100 / (cols.length + 1));
      cols.forEach((c: any) => c.w = newW);
      cols.push({ w: newW });
      const righe = [...(prev.righe || []), [100]];
      const celle = [...(prev.celle || []), { tipo: "fisso", verso: "dx" }];
      return { ...prev, colonne: cols, righe, celle };
    });
  }, []);

  // Rimuove colonna
  const removeColonna = useCallback((ci: number) => {
    setCfg((prev: any) => {
      if ((prev.colonne || []).length <= 1) return prev;
      const cols = prev.colonne.filter((_: any, i: number) => i !== ci);
      const righe = (prev.righe || []).filter((_: any, i: number) => i !== ci);
      const colCells = (prev.righe?.[ci] || [1]).length;
      const startIdx = prev.righe?.slice(0, ci).reduce((s: number, r: any) => s + r.length, 0) || 0;
      const celle = (prev.celle || []).filter((_: any, i: number) => i < startIdx || i >= startIdx + colCells);
      return { ...prev, colonne: cols, righe, celle };
    });
    setSelCella(null);
  }, []);

  const salva = () => {
    onSalva({
      nome,
      infissoConfig: cfg,
      misure: { ...misure, lCentro: misuraInfisso.L, hCentro: misuraInfisso.H },
      tipoMisura, telaioMm,
      pezzi: pz,
      prevPrezzoOverride: preu,
      prevPosaPrezzo: posaP,
      cassonetto: cassOn,
      accessori: {
        tapparella: { attivo: tapp, prezzo: tappP },
        zanzariera: { attivo: zanz, prezzo: zanzP },
      },
    });
  };

  const { bg, card, text, sub, bdr, acc } = T;
  const dark = bg === "#1A1A1C" || bg?.includes("1A1A");

  // ── STILI ────────────────────────────────────────────────
  const inp = (extra = {}) => ({
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: `1.5px solid ${bdr}`, fontSize: 18, fontWeight: 700,
    textAlign: "right" as const, background: bg, color: text,
    fontFamily: "inherit", ...extra,
  });
  const lbl = { fontSize: 10, fontWeight: 700, color: sub, textTransform: "uppercase" as const, letterSpacing: 0.7, marginBottom: 4 };
  const pill = (sel: boolean, col = AMB) => ({
    padding: "7px 14px", borderRadius: 20, cursor: "pointer",
    border: `1.5px solid ${sel ? col : bdr}`,
    background: sel ? col + "18" : card,
    color: sel ? col : sub, fontSize: 12, fontWeight: sel ? 700 : 500,
  });
  const tgl = (on: boolean) => ({
    width: 48, height: 28, borderRadius: 14,
    background: on ? GRN : bdr, position: "relative" as const,
    cursor: "pointer", transition: "background 0.2s", flexShrink: 0,
  });
  const tglK = (on: boolean) => ({
    position: "absolute" as const, top: 3, left: on ? 22 : 3,
    width: 22, height: 22, borderRadius: 11, background: "#fff",
    transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: bg, display: "flex", flexDirection: "column",
    }}>
      {/* ── HEADER ── */}
      <div style={{
        background: "#1A1A1C", padding: "12px 16px",
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
      }}>
        <button onClick={onChiudi} style={{
          background: "none", border: "none", color: "#fff",
          fontSize: 22, cursor: "pointer", padding: "0 4px",
        }}>←</button>
        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
          style={{
            flex: 1, background: "none", border: "none", color: "#fff",
            fontSize: 16, fontWeight: 700, fontFamily: "inherit", padding: 0,
          }}
        />
        <div style={{ background: AMB, color: "#fff", fontSize: 15, fontWeight: 800, padding: "5px 14px", borderRadius: 20 }}>
          € {fmt(totale)}
        </div>
        {step > 0 && (
          <button onClick={salva} style={{
            background: GRN, border: "none", color: "#fff",
            fontSize: 13, fontWeight: 700, padding: "8px 16px",
            borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
          }}>Salva</button>
        )}
      </div>

      {/* ── STEP INDICATOR ── */}
      <div style={{
        display: "flex", background: "#111", borderBottom: `1px solid ${bdr}`,
        flexShrink: 0,
      }}>
        {["Tipologia", "Configura", "Prezzo"].map((s, i) => (
          <div key={i} onClick={() => step > 0 && setStep(i)} style={{
            flex: 1, padding: "10px 4px", textAlign: "center",
            fontSize: 12, fontWeight: step === i ? 700 : 500,
            color: step === i ? AMB : step > i ? GRN : sub,
            borderBottom: `2.5px solid ${step === i ? AMB : "transparent"}`,
            cursor: step > 0 ? "pointer" : "default",
          }}>
            {step > i && i !== step ? "✓ " : `${i + 1}. `}{s}
          </div>
        ))}
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, overflow: "auto" }}>

        {/* ══ STEP 0 — TIPOLOGIA ══ */}
        {step === 0 && (
          <div style={{ padding: 14 }}>
            {/* Cat filter */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 14, paddingBottom: 4 }}>
              {CATS.map(cat => (
                <button key={cat} onClick={() => setCatAttiva(cat)} style={{
                  ...pill(catAttiva === cat),
                  whiteSpace: "nowrap", fontFamily: "inherit",
                }}>
                  {cat}
                </button>
              ))}
            </div>

            {/* Griglia tipologie */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {LIBRERIA.filter(l => l.cat === catAttiva).map(lib => (
                <div key={lib.id} onClick={() => applyLib(lib)} style={{
                  background: card, borderRadius: 12,
                  border: `1.5px solid ${cfg.tipId === lib.id ? AMB : bdr}`,
                  overflow: "hidden", cursor: "pointer",
                  boxShadow: cfg.tipId === lib.id ? `0 0 0 2px ${AMB}40` : "none",
                }}>
                  <div
                    style={{ background: "#f8f9ff" }}
                    dangerouslySetInnerHTML={{ __html: buildMiniSVG(lib) }}
                  />
                  <div style={{ padding: "6px 8px", fontSize: 11, fontWeight: 600, color: cfg.tipId === lib.id ? AMB : text, textAlign: "center" }}>
                    {lib.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 14, padding: "12px 14px", background: card, borderRadius: 12, border: `1px solid ${bdr}` }}>
              <div style={{ ...lbl, marginBottom: 8 }}>Oppure personalizza</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={addColonna} style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${GRN}`,
                  background: GRN + "15", color: GRN, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}>+ Colonna</button>
                <button onClick={() => setStep(1)} style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: `1.5px solid ${AMB}`,
                  background: AMB + "15", color: AMB, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                }}>Avanti →</button>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 1 — MISURE + CONFIGURAZIONE ══ */}
        {step === 1 && (
          <div style={{ padding: 14 }}>

            {/* DISEGNO TECNICO SVG — prospetto live */}
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${bdr}`, marginBottom: 12, background: "#f0f4fa" }}>
              <div style={{ width: "100%" }} dangerouslySetInnerHTML={{ __html: svgStr.replace('<svg ', '<svg style="width:100%;height:auto;display:block" ') }}/>
            </div>

            {/* MISURE */}
            <div style={{ background: card, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${bdr}` }}>
              <div style={{ ...lbl, marginBottom: 10 }}>Misure (mm)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={lbl}>Larghezza rilevata</div>
                  <input style={inp()} type="number" inputMode="numeric" value={misure.lCentro || ""}
                    placeholder="1200" onChange={e => setMisure((m: any) => ({ ...m, lCentro: Number(e.target.value) }))} />
                </div>
                <div>
                  <div style={lbl}>Altezza rilevata</div>
                  <input style={inp()} type="number" inputMode="numeric" value={misure.hCentro || ""}
                    placeholder="1500" onChange={e => setMisure((m: any) => ({ ...m, hCentro: Number(e.target.value) }))} />
                </div>
              </div>

              {/* TIPO MISURAZIONE */}
              <div style={{ ...lbl, marginBottom: 8 }}>Tipo misurazione</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                {[
                  { id: "finita", l: "Misura finita", sub: "Nessuna detrazione" },
                  { id: "pCorta", l: "Punta corta telaio", sub: "−5mm per lato" },
                  { id: "pLunga", l: "Punta lunga telaio", sub: `−${telaioMm}mm per lato (ala telaio)` },
                  { id: "grezzo", l: "Muro grezzo", sub: "+20mm tolleranza" },
                ].map(tm => (
                  <div key={tm.id} onClick={() => setTipoMisura(tm.id)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                    border: `1.5px solid ${tipoMisura === tm.id ? GRN : bdr}`,
                    background: tipoMisura === tm.id ? GRN + "10" : bg,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: tipoMisura === tm.id ? GRN : text }}>{tm.l}</div>
                      <div style={{ fontSize: 10, color: sub, marginTop: 1 }}>{tm.sub}</div>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: 10,
                      border: `2px solid ${tipoMisura === tm.id ? GRN : bdr}`,
                      background: tipoMisura === tm.id ? GRN : "transparent",
                    }} />
                  </div>
                ))}
              </div>

              {tipoMisura === "pLunga" && (
                <div style={{ marginBottom: 10 }}>
                  <div style={lbl}>Ala telaio (mm)</div>
                  <input style={inp({ fontSize: 16 })} type="number" value={telaioMm}
                    onChange={e => setTelaioMm(Number(e.target.value))} />
                </div>
              )}

              {/* MISURA RISULTANTE */}
              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 12px", borderRadius: 10, background: GRN + "12",
                border: `1px solid ${GRN}30`,
              }}>
                <div style={{ fontSize: 12, color: sub }}>Misura infisso calcolata</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: GRN, fontFamily: "monospace" }}>
                  {misuraInfisso.L} × {misuraInfisso.H} mm
                </div>
              </div>
            </div>

            {/* CONFIGURAZIONE CELLE */}
            <div style={{ background: card, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${bdr}` }}>
              <div style={{ ...lbl, marginBottom: 10 }}>Campiture</div>

              {/* Lista celle */}
              {(cfg.colonne || []).map((col: any, ci: number) => {
                const righeH = cfg.righe?.[ci] || [100];
                return righeH.map((rh: number, ri: number) => {
                  const cellaIdx = (cfg.colonne || []).slice(0, ci).reduce((s: number, _: any, i: number) => s + (cfg.righe?.[i]?.length || 1), 0) + ri;
                  const cella = cfg.celle?.[cellaIdx] || { tipo: "fisso", verso: "dx" };
                  const isSel = selCella === cellaIdx;
                  return (
                    <div key={`${ci}-${ri}`}>
                      <div onClick={() => setSelCella(isSel ? null : cellaIdx)} style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 10, marginBottom: 6,
                        border: `1.5px solid ${isSel ? AMB : bdr}`,
                        background: isSel ? AMB + "10" : bg, cursor: "pointer",
                      }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: isSel ? AMB : bdr, display: "flex", alignItems: "center", justifyContent: "center", color: isSel ? "#fff" : sub, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                          {ci + 1}{righeH.length > 1 ? `.${ri + 1}` : ""}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: isSel ? AMB : text }}>
                            Colonna {ci + 1}{righeH.length > 1 ? `, Riga ${ri + 1}` : ""}
                          </div>
                          <div style={{ fontSize: 10, color: sub }}>
                            {cella.tipo} {cella.verso ? (cella.verso === "dx" ? "→" : "←") : ""}
                            {" · "}{col.w}% larghezza · {rh}% altezza
                          </div>
                        </div>
                        <div style={{ fontSize: 14, color: isSel ? AMB : sub }}>{isSel ? "▲" : "▼"}</div>
                      </div>

                      {isSel && (
                        <div style={{ padding: "10px 12px", background: AMB + "08", borderRadius: 10, marginBottom: 8, border: `1px solid ${AMB}30` }}>
                          {/* Tipo */}
                          <div style={{ ...lbl, marginBottom: 6 }}>Tipo</div>
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 5, marginBottom: 10 }}>
                            {[
                              { id: "fisso", l: "Fisso" }, { id: "anta", l: "Anta batt." },
                              { id: "portafinestra", l: "Portafin." }, { id: "scorrevole", l: "Scorrev." },
                              { id: "alzante", l: "Alzante" }, { id: "vasistas", l: "Vasistas" },
                              { id: "vuoto", l: "Vuoto" },
                            ].map(t => (
                              <button key={t.id} onClick={() => updCella(cellaIdx, { tipo: t.id })} style={{
                                ...pill(cella.tipo === t.id, GRN), fontFamily: "inherit",
                              }}>{t.l}</button>
                            ))}
                          </div>
                          {/* Verso */}
                          {cella.tipo !== "fisso" && cella.tipo !== "vuoto" && (
                            <>
                              <div style={{ ...lbl, marginBottom: 6 }}>Verso apertura</div>
                              <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                                {[{ id: "sx", l: "← Sinistra" }, { id: "dx", l: "Destra →" }].map(v => (
                                  <button key={v.id} onClick={() => updCella(cellaIdx, { verso: v.id })} style={{
                                    flex: 1, ...pill(cella.verso === v.id, AMB), fontFamily: "inherit", textAlign: "center" as const,
                                  }}>{v.l}</button>
                                ))}
                              </div>
                            </>
                          )}
                          {/* Larghezza colonna */}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div>
                              <div style={lbl}>Larghezza col. %</div>
                              <input style={inp({ fontSize: 16 })} type="number" value={col.w}
                                onChange={e => updColonna(ci, { w: Number(e.target.value) })} />
                            </div>
                            <div>
                              <div style={lbl}>Altezza riga %</div>
                              <input style={inp({ fontSize: 16 })} type="number" value={rh}
                                onChange={e => {
                                  const r = [...(cfg.righe?.[ci] || [])];
                                  r[ri] = Number(e.target.value);
                                  updRighe(ci, r);
                                }} />
                            </div>
                          </div>
                          {/* Azioni */}
                          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                            <button onClick={() => {
                              const r = [...(cfg.righe?.[ci] || [])];
                              r.push(Math.round(r[r.length - 1] / 2));
                              r[r.length - 2] = Math.round(r[r.length - 2] / 2);
                              updRighe(ci, r);
                              const newCelle = [...(cfg.celle || [])];
                              newCelle.splice(cellaIdx + 1, 0, { tipo: "fisso", verso: "dx" });
                              setCfg((prev: any) => ({ ...prev, celle: newCelle }));
                            }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${GRN}`, background: GRN + "15", color: GRN, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                              + Traverso
                            </button>
                            {cfg.colonne?.length > 1 && ri === 0 && (
                              <button onClick={() => removeColonna(ci)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${RED}`, background: RED + "15", color: RED, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                × Col.
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })}

              <button onClick={addColonna} style={{
                width: "100%", padding: "10px", borderRadius: 10,
                border: `1.5px dashed ${bdr}`, background: "transparent",
                color: sub, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit", marginTop: 4,
              }}>+ Aggiungi colonna</button>
            </div>

            {/* PROFILI */}
            <div style={{ background: card, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${bdr}` }}>
              <div style={{ ...lbl, marginBottom: 10 }}>Spessori profili (mm)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { k: "telaio", l: "Telaio" }, { k: "anta", l: "Anta" },
                  { k: "mont", l: "Montante" }, { k: "trav", l: "Traverso" },
                ].map(({ k, l }) => (
                  <div key={k}>
                    <div style={lbl}>{l}</div>
                    <input style={inp({ fontSize: 15 })} type="number" value={cfg.profili?.[k] || 0}
                      onChange={e => setCfg((prev: any) => ({ ...prev, profili: { ...prev.profili, [k]: Number(e.target.value) } }))} />
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} style={{
              width: "100%", padding: 15, borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${AMB}, ${AMB}cc)`,
              color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
              fontFamily: "inherit", boxShadow: `0 4px 20px ${AMB}40`,
            }}>Accessori e Prezzo →</button>
          </div>
        )}

        {/* ══ STEP 2 — ACCESSORI + PREZZO ══ */}
        {step === 2 && (
          <div style={{ padding: 14 }}>

            {/* MINI PREVIEW SVG */}
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${bdr}`, marginBottom: 12, background: "#f0f4fa", maxHeight: 220 }}>
              <div style={{ width: "100%" }} dangerouslySetInnerHTML={{ __html: svgStr.replace('<svg ', '<svg style="width:100%;height:auto;display:block" ') }}/>
            </div>

            {/* PREZZO */}
            <div style={{ background: card, borderRadius: 12, padding: 14, marginBottom: 10, border: `1px solid ${bdr}` }}>
              <div style={{ ...lbl, marginBottom: 10 }}>Prezzo infisso</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={lbl}>€ / pezzo</div>
                  <input style={inp({ fontSize: 20 })} type="number" inputMode="decimal" value={preu || ""}
                    placeholder="0,00" onChange={e => setPreu(Number(e.target.value))} />
                </div>
                <div>
                  <div style={lbl}>Pezzi</div>
                  <input style={inp({ fontSize: 20 })} type="number" inputMode="numeric" value={pz}
                    min={1} onChange={e => setPz(Math.max(1, Number(e.target.value)))} />
                </div>
                <div>
                  <div style={lbl}>Subtot.</div>
                  <div style={{ padding: "10px 12px", borderRadius: 10, background: GRN + "12", border: `1px solid ${GRN}30`, fontSize: 16, fontWeight: 800, color: GRN, textAlign: "right" as const }}>
                    €{fmt(preu * pz)}
                  </div>
                </div>
              </div>
            </div>

            {/* CASSONETTO */}
            <div style={{ background: card, borderRadius: 12, border: `1px solid ${cassOn ? AMB + "50" : bdr}`, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 10 }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: text }}>Cassonetto / Tapparella</span>
                <div style={tgl(cassOn)} onClick={() => setCassOn(!cassOn)}><div style={tglK(cassOn)} /></div>
              </div>
              {cassOn && (
                <div style={{ borderTop: `1px solid ${bdr}`, padding: "10px 14px" }}>
                  <div style={lbl}>Altezza cassonetto (mm)</div>
                  <input style={inp({ fontSize: 16 })} type="number" value={cfg.cassH || 200}
                    onChange={e => setCfg((p: any) => ({ ...p, cassH: Number(e.target.value) }))} />
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: sub }}>Include tapparella nel prezzo</span>
                    <div style={tgl(tapp)} onClick={() => setTapp(!tapp)}><div style={tglK(tapp)} /></div>
                  </div>
                  {tapp && (
                    <div style={{ marginTop: 8 }}>
                      <div style={lbl}>€ tapparella</div>
                      <input style={inp({ fontSize: 16 })} type="number" value={tappP}
                        onChange={e => setTappP(Number(e.target.value))} />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ZANZARIERA */}
            <div style={{ background: card, borderRadius: 12, border: `1px solid ${zanz ? BLU + "50" : bdr}`, marginBottom: 8, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 10 }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: text }}>Zanzariera</span>
                <div style={tgl(zanz)} onClick={() => setZanz(!zanz)}><div style={tglK(zanz)} /></div>
              </div>
              {zanz && (
                <div style={{ borderTop: `1px solid ${bdr}`, padding: "10px 14px" }}>
                  <div style={lbl}>€ zanzariera</div>
                  <input style={inp({ fontSize: 16 })} type="number" value={zanzP}
                    onChange={e => setZanzP(Number(e.target.value))} />
                </div>
              )}
            </div>

            {/* POSA */}
            <div style={{ background: card, borderRadius: 12, padding: 14, marginBottom: 14, border: `1px solid ${bdr}` }}>
              <div style={lbl}>€ posa in opera</div>
              <input style={inp()} type="number" value={posaP}
                onChange={e => setPosaP(Number(e.target.value))} />
            </div>

            {/* TOTALE VANO */}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 16px", background: "#1A1A1C", borderRadius: 14, marginBottom: 14,
            }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>TOTALE VANO</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: AMB }}>€ {fmt(totale)}</span>
            </div>

            {/* SALVA */}
            <button onClick={salva} style={{
              width: "100%", padding: 16, borderRadius: 14, border: "none",
              background: `linear-gradient(135deg, ${GRN}, ${GRN}cc)`,
              color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer",
              fontFamily: "inherit", boxShadow: `0 4px 20px ${GRN}50`,
            }}>✓ Salva vano nel preventivo</button>
          </div>
        )}
      </div>
    </div>
  );
}
