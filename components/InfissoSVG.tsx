"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO ERP — InfissoSVG
// Motore SVG parametrico tecnico per serramenti
// Genera disegno tecnico 2D frontale con quote, montanti, traversi
// Mobile-first, nessuna dipendenza esterna
// ═══════════════════════════════════════════════════════════════

// ── Costanti costruttive (mm → px scala 1:1 nel viewBox) ──────
const T_FRAME   = 70;   // spessore telaio fisso (mm)
const T_SASH    = 58;   // spessore anta
const T_MULLI   = 68;   // montante centrale
const T_TRANS   = 60;   // traverso
const GAP_GLASS = 14;   // gioco vetro
const T_BEAD    = 12;   // fermavetro

// ── Palette tecnica ───────────────────────────────────────────
const C = {
  frame:    "#2c3e50",   // telaio esterno
  sash:     "#34495e",   // anta
  glass:    "#a8d8ea",   // vetro
  glassStroke: "#6db5cc",
  axis:     "#e74c3c",   // linee asse (rosso tecnico)
  dim:      "#555",      // quote
  dimLine:  "#888",
  hatch:    "#c8d0d8",   // tratteggio sezione profilo
  tapp:     "#D08008",   // tapparella
  zanz:     "#3B7FE0",   // zanzariera
  open:     "#1A9E73",   // arco apertura
  bg:       "#fafbfc",
  text:     "#1a1a1c",
};

// ─────────────────────────────────────────────────────────────
// TIPI
// ─────────────────────────────────────────────────────────────
export type TipoInfisso =
  | "F1A_DX" | "F1A_SX"
  | "F2A" | "F2A_1F"   // 2 ante | fisso+anta
  | "F3A" | "F3A_1F"
  | "F_FISSO"
  | "PF1_DX" | "PF1_SX" | "PF2"
  | "SC2" | "SC3" | "ALZ"
  | "P1_DX" | "P1_SX" | "P2"
  | "ARCO" | "VASISTAS" | "ANTA_RIBALTA"
  | "FISSO_TRAV"        // fisso con traverso
  | "CUSTOM";

export interface WindowConfig {
  tipo: TipoInfisso;
  W: number;           // larghezza mm
  H: number;           // altezza mm
  // misure fuorisquadro
  lAlto?: number;
  lBasso?: number;
  hSx?: number;
  hDx?: number;
  // traverso personalizzato
  travH?: number;      // quota traverso da basso (mm), default H*0.4
  // accessori
  tapparella?: boolean;
  tappH?: number;      // altezza tapparella (mm)
  zanzariera?: boolean;
  // visualizzazione
  showQuote?: boolean;
  showApertura?: boolean;
  showSezione?: boolean;
}

// ─────────────────────────────────────────────────────────────
// HELPERS SVG
// ─────────────────────────────────────────────────────────────
const rect = (x: number, y: number, w: number, h: number, fill: string, stroke: string, sw = 2, rx = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" rx="${rx}" />`;

const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, sw = 1.5, dash = "") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw}" ${dash ? `stroke-dasharray="${dash}"` : ""} />`;

const text = (x: number, y: number, s: string, size = 12, color = C.dim, anchor = "middle", weight = "600") =>
  `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="${color}" font-weight="${weight}" font-family="Inter,Arial,system-ui">${s}</text>`;

const hatchRect = (x: number, y: number, w: number, h: number, id: string) => `
  <defs>
    <pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="6" stroke="${C.hatch}" stroke-width="1.5"/>
    </pattern>
  </defs>
  ${rect(x, y, w, h, `url(#${id})`, C.frame, 2)}`;

// Quota con frecce e misura
const quota = (x1: number, y1: number, x2: number, y2: number, val: number, offset = 24, horiz = true) => {
  const label = `${Math.round(val)}`;
  if (horiz) {
    const y = y1 - offset;
    return `
      ${line(x1, y1, x1, y - 4, C.dimLine, 0.8)}
      ${line(x2, y1, x2, y - 4, C.dimLine, 0.8)}
      ${line(x1, y, x2, y, C.dimLine, 1)}
      <polygon points="${x1},${y-4} ${x1+6},${y} ${x1},${y+4}" fill="${C.dimLine}"/>
      <polygon points="${x2},${y-4} ${x2-6},${y} ${x2},${y+4}" fill="${C.dimLine}"/>
      ${text((x1+x2)/2, y - 6, label, 14, C.dim)}`;
  } else {
    const x = x2 + offset;
    return `
      ${line(x1, y1, x + 4, y1, C.dimLine, 0.8)}
      ${line(x1, y2, x + 4, y2, C.dimLine, 0.8)}
      ${line(x, y1, x, y2, C.dimLine, 1)}
      <polygon points="${x-4},${y1} ${x},${y1+6} ${x+4},${y1}" fill="${C.dimLine}"/>
      <polygon points="${x-4},${y2} ${x},${y2-6} ${x+4},${y2}" fill="${C.dimLine}"/>
      <text x="${x+16}" y="${(y1+y2)/2+5}" text-anchor="middle" font-size="14" fill="${C.dim}" font-weight="600" font-family="Inter,Arial,system-ui" transform="rotate(90,${x+16},${(y1+y2)/2+5})">${label}</text>`;
  }
};

// Arco apertura anta
const arcApertura = (ax: number, ay: number, aw: number, ah: number, lato: "sx"|"dx") => {
  const r = Math.min(aw * 0.85, ah * 0.85);
  const cx = lato === "dx" ? ax : ax + aw;
  const cy = ay + ah;
  const ex = lato === "dx" ? ax + r : ax + aw - r;
  const ey = ay + ah - r;
  const sweep = lato === "dx" ? 0 : 1;
  return `
    <path d="M ${cx} ${ay + ah} A ${r} ${r} 0 0 ${sweep} ${lato === "dx" ? ax + aw : ax} ${ay + ah}"
      fill="${C.open}18" stroke="${C.open}" stroke-width="1.2" stroke-dasharray="8,4" />
    <line x1="${cx}" y1="${ay}" x2="${cx}" y2="${ay + ah}"
      stroke="${C.sash}" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>`;
};

// Maniglia
const maniglia = (ax: number, ay: number, aw: number, ah: number, lato: "sx"|"dx") => {
  const mx = lato === "dx" ? ax + aw - T_SASH - 4 : ax + T_SASH + 4;
  const my = ay + ah / 2;
  return `
    <rect x="${mx - 4}" y="${my - 14}" width="8" height="28" rx="4"
      fill="#D08008" stroke="#a06000" stroke-width="1.5"/>
    <circle cx="${mx}" cy="${my}" r="5" fill="#c07000" />`;
};

// Profilo sezione (tratteggio tecnico sul telaio)
const profiloSezione = (x: number, y: number, w: number, h: number, idSuffix: string) =>
  hatchRect(x, y, w, h, `hatch_${idSuffix}`);

// ─────────────────────────────────────────────────────────────
// MOTORE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export function buildWindowSVG(cfg: WindowConfig): string {
  const { tipo, W, H, showQuote = true, showApertura = true, tapparella, tappH: rawTappH, zanzariera } = cfg;

  const PAD_TOP  = showQuote ? 80 : 20;
  const PAD_BOT  = 20;
  const PAD_SX   = 20;
  const PAD_DX   = showQuote ? 80 : 20;
  const tappH    = tapparella ? (rawTappH || Math.round(H * 0.12)) : 0;

  const vW = W + PAD_SX + PAD_DX;
  const vH = H + PAD_TOP + PAD_BOT + tappH;

  const ox = PAD_SX;  // origine X
  const oy = PAD_TOP + tappH; // origine Y (sotto tapparella)

  let body = "";
  let defs = `<defs>
    <pattern id="glass_pattern" width="20" height="20" patternUnits="userSpaceOnUse">
      <line x1="0" y1="20" x2="20" y2="0" stroke="${C.glassStroke}" stroke-width="0.4" opacity="0.5"/>
    </pattern>
  </defs>`;

  // ── TAPPARELLA ────────────────────────────────────────────
  if (tapparella && tappH > 0) {
    body += `
      ${rect(ox, PAD_TOP, W, tappH, C.tapp + "30", C.tapp, 2)}
      ${line(ox, PAD_TOP + tappH * 0.25, ox + W, PAD_TOP + tappH * 0.25, C.tapp, 0.8)}
      ${line(ox, PAD_TOP + tappH * 0.5,  ox + W, PAD_TOP + tappH * 0.5,  C.tapp, 0.8)}
      ${line(ox, PAD_TOP + tappH * 0.75, ox + W, PAD_TOP + tappH * 0.75, C.tapp, 0.8)}
      ${text(ox + W/2, PAD_TOP + tappH/2 + 5, "TAPPARELLA", 13, C.tapp, "middle", "800")}`;
    if (showQuote) {
      body += quota(ox, PAD_TOP + tappH, ox + W, PAD_TOP + tappH, tappH, 24, false).replace(
        `x2="${ox + W + 80}"`, `x2="${ox + W + 40}"`
      );
    }
  }

  // ── TELAIO ESTERNO ────────────────────────────────────────
  // Sezione profilo telaio (tratteggio su 4 lati)
  body += profiloSezione(ox, oy, T_FRAME, H, "fl");          // sx
  body += profiloSezione(ox + W - T_FRAME, oy, T_FRAME, H, "fr"); // dx
  body += profiloSezione(ox + T_FRAME, oy, W - T_FRAME*2, T_FRAME, "ft"); // top
  body += profiloSezione(ox + T_FRAME, oy + H - T_FRAME, W - T_FRAME*2, T_FRAME, "fb"); // bot

  // Rettangolo telaio outline
  body += rect(ox, oy, W, H, "none", C.frame, 3);

  // ── GENERAZIONE CAMPITURE per tipo ───────────────────────
  const inner = {
    x: ox + T_FRAME,
    y: oy + T_FRAME,
    w: W - T_FRAME * 2,
    h: H - T_FRAME * 2,
  };

  body += buildCampiture(tipo, inner, cfg, showApertura);

  // ── ZANZARIERA overlay ────────────────────────────────────
  if (zanzariera) {
    body += `
      <rect x="${ox + 3}" y="${oy + 3}" width="${W - 6}" height="${H - 6}"
        fill="none" stroke="${C.zanz}" stroke-width="1.5" stroke-dasharray="6,4" opacity="0.6" />
      ${text(ox + 20, oy + 18, "ZAN", 11, C.zanz, "start", "700")}`;
  }

  // ── QUOTE ─────────────────────────────────────────────────
  if (showQuote) {
    // Larghezza totale
    body += quota(ox, oy, ox + W, oy, W, 50);
    // Altezza totale
    body += quota(ox + W, oy, ox + W, oy + H, H, 40, false);

    // Quote interne campiture (se tipo ha divisori)
    body += buildQuoteInterne(tipo, inner, cfg);
  }

  // ── NORD / ORIENTAMENTO (opzionale) ──────────────────────
  // Titolo tipo
  body += text(ox + W/2, oy + H + 16, `${tipo.replace(/_/g," ")} — ${W}×${H} mm`, 13, C.dim);

  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${vW} ${vH}"
    style="width:100%;height:100%;background:${C.bg}">
    ${defs}
    ${body}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────
// CAMPITURE per tipo
// ─────────────────────────────────────────────────────────────
function buildCampiture(tipo: TipoInfisso, inner: any, cfg: WindowConfig, showAp: boolean): string {
  const { x, y, w, h } = inner;
  let s = "";

  const glass1 = (gx: number, gy: number, gw: number, gh: number) => `
    ${rect(gx, gy, gw, gh, "url(#glass_pattern)", C.glassStroke, 1.5)}
    ${rect(gx, gy, gw, gh, C.glass + "60", "none", 0)}`;

  const anta = (ax: number, ay: number, aw: number, ah: number) => `
    ${profiloSezione(ax, ay, T_SASH, ah, `sl_${ax}`)}
    ${profiloSezione(ax + aw - T_SASH, ay, T_SASH, ah, `sr_${ax}`)}
    ${profiloSezione(ax + T_SASH, ay, aw - T_SASH*2, T_SASH, `st_${ax}`)}
    ${profiloSezione(ax + T_SASH, ay + ah - T_SASH, aw - T_SASH*2, T_SASH, `sb_${ax}`)}
    ${rect(ax, ay, aw, ah, "none", C.sash, 2)}`;

  const fisso = (fx: number, fy: number, fw: number, fh: number) => `
    ${profiloSezione(fx, fy, T_SASH, fh, `fsl_${fx}`)}
    ${profiloSezione(fx + fw - T_SASH, fy, T_SASH, fh, `fsr_${fx}`)}
    ${profiloSezione(fx + T_SASH, fy, fw - T_SASH*2, T_SASH, `fst_${fx}`)}
    ${profiloSezione(fx + T_SASH, fy + fh - T_SASH, fw - T_SASH*2, T_SASH, `fsb_${fx}`)}
    ${rect(fx, fy, fw, fh, "none", C.sash, 1.5, 0)}
    ${line(fx+4, fy+4, fx+fw-4, fy+fh-4, C.hatch, 1)}
    ${line(fx+fw-4, fy+4, fx+4, fy+fh-4, C.hatch, 1)}`;

  const montante = (mx: number) => `
    ${profiloSezione(mx, y, T_MULLI, h, `m_${mx}`)}
    ${rect(mx, y, T_MULLI, h, "none", C.frame, 1.5)}`;

  const traverso = (ty: number) => `
    ${profiloSezione(x, ty, w, T_TRANS, `tr_${ty}`)}
    ${rect(x, ty, w, T_TRANS, "none", C.frame, 1.5)}`;

  switch (tipo) {

    // ── FISSO ──
    case "F_FISSO": {
      const gi = { x: x + T_SASH + T_BEAD, y: y + T_SASH + T_BEAD, w: w - (T_SASH+T_BEAD)*2, h: h - (T_SASH+T_BEAD)*2 };
      s += fisso(x, y, w, h);
      s += glass1(gi.x, gi.y, gi.w, gi.h);
      break;
    }

    // ── 1 ANTA DX (cerniera sx) ──
    case "F1A_DX":
    case "PF1_DX":
    case "P1_DX": {
      s += anta(x, y, w, h);
      const gi = { x: x + T_SASH + T_BEAD, y: y + T_SASH + T_BEAD, w: w-(T_SASH+T_BEAD)*2, h: h-(T_SASH+T_BEAD)*2 };
      s += glass1(gi.x, gi.y, gi.w, gi.h);
      if (showAp) s += arcApertura(x, y, w, h, "dx");
      s += maniglia(x, y, w, h, "dx");
      break;
    }

    // ── 1 ANTA SX (cerniera dx) ──
    case "F1A_SX":
    case "PF1_SX":
    case "P1_SX": {
      s += anta(x, y, w, h);
      const gi = { x: x + T_SASH + T_BEAD, y: y + T_SASH + T_BEAD, w: w-(T_SASH+T_BEAD)*2, h: h-(T_SASH+T_BEAD)*2 };
      s += glass1(gi.x, gi.y, gi.w, gi.h);
      if (showAp) s += arcApertura(x, y, w, h, "sx");
      s += maniglia(x, y, w, h, "sx");
      break;
    }

    // ── 2 ANTE ──
    case "F2A":
    case "PF2":
    case "P2": {
      const hw = (w - T_MULLI) / 2;
      s += montante(x + hw);
      // anta sx
      s += anta(x, y, hw, h);
      s += glass1(x + T_SASH + T_BEAD, y + T_SASH + T_BEAD, hw - (T_SASH+T_BEAD)*2, h - (T_SASH+T_BEAD)*2);
      if (showAp) s += arcApertura(x, y, hw, h, "sx");
      s += maniglia(x, y, hw, h, "sx");
      // anta dx
      const ax2 = x + hw + T_MULLI;
      const aw2 = w - hw - T_MULLI;
      s += anta(ax2, y, aw2, h);
      s += glass1(ax2 + T_SASH + T_BEAD, y + T_SASH + T_BEAD, aw2 - (T_SASH+T_BEAD)*2, h - (T_SASH+T_BEAD)*2);
      if (showAp) s += arcApertura(ax2, y, aw2, h, "dx");
      s += maniglia(ax2, y, aw2, h, "dx");
      break;
    }

    // ── 3 ANTE ──
    case "F3A": {
      const tw = (w - T_MULLI*2) / 3;
      s += montante(x + tw);
      s += montante(x + tw*2 + T_MULLI);
      // fisso sx
      s += fisso(x, y, tw, h);
      s += glass1(x + T_SASH + T_BEAD, y + T_SASH + T_BEAD, tw - (T_SASH+T_BEAD)*2, h - (T_SASH+T_BEAD)*2);
      // anta centro
      const ax2 = x + tw + T_MULLI;
      s += anta(ax2, y, tw, h);
      s += glass1(ax2 + T_SASH + T_BEAD, y + T_SASH + T_BEAD, tw - (T_SASH+T_BEAD)*2, h - (T_SASH+T_BEAD)*2);
      if (showAp) s += arcApertura(ax2, y, tw, h, "sx");
      // anta dx
      const ax3 = x + tw*2 + T_MULLI*2;
      const aw3 = w - tw*2 - T_MULLI*2;
      s += anta(ax3, y, aw3, h);
      s += glass1(ax3 + T_SASH + T_BEAD, y + T_SASH + T_BEAD, aw3 - (T_SASH+T_BEAD)*2, h - (T_SASH+T_BEAD)*2);
      if (showAp) s += arcApertura(ax3, y, aw3, h, "dx");
      break;
    }

    // ── FISSO + TRAVERSO ──
    case "FISSO_TRAV": {
      const travY = y + (cfg.travH || Math.round(h * 0.4));
      s += traverso(travY);
      // fisso sopra
      s += fisso(x, y, w, travY - y);
      s += glass1(x + T_SASH + T_BEAD, y + T_SASH + T_BEAD, w - (T_SASH+T_BEAD)*2, travY - y - (T_SASH+T_BEAD)*2);
      // anta sotto (apertura)
      const ayB = travY + T_TRANS;
      const ahB = h - (travY - y) - T_TRANS;
      s += anta(x, ayB, w, ahB);
      s += glass1(x + T_SASH + T_BEAD, ayB + T_SASH + T_BEAD, w - (T_SASH+T_BEAD)*2, ahB - (T_SASH+T_BEAD)*2);
      if (showAp) s += arcApertura(x, ayB, w, ahB, "dx");
      s += maniglia(x, ayB, w, ahB, "dx");
      break;
    }

    // ── VASISTAS ──
    case "VASISTAS": {
      const vasH = Math.round(h * 0.32);
      s += traverso(y + vasH);
      // vasistas sopra
      s += anta(x, y, w, vasH);
      s += glass1(x + T_SASH + T_BEAD, y + T_SASH + T_BEAD, w - (T_SASH+T_BEAD)*2, vasH - (T_SASH+T_BEAD)*2);
      s += `<path d="M ${x + w/2} ${y + vasH} L ${x + T_SASH*2} ${y + T_SASH} L ${x + w - T_SASH*2} ${y + T_SASH}"
        fill="${C.open}25" stroke="${C.open}" stroke-width="1.2" stroke-dasharray="7,4"/>`;
      s += text(x + w/2, y + vasH/2 + 6, "▲ vas.", 11, C.open, "middle", "700");
      // fisso sotto
      const ayB = y + vasH + T_TRANS;
      s += fisso(x, ayB, w, h - vasH - T_TRANS);
      s += glass1(x + T_SASH + T_BEAD, ayB + T_SASH + T_BEAD, w - (T_SASH+T_BEAD)*2, h - vasH - T_TRANS - (T_SASH+T_BEAD)*2);
      break;
    }

    // ── ANTA + RIBALTA ──
    case "ANTA_RIBALTA": {
      s += anta(x, y, w, h);
      const gi = { x: x + T_SASH + T_BEAD, y: y + T_SASH + T_BEAD, w: w-(T_SASH+T_BEAD)*2, h: h-(T_SASH+T_BEAD)*2 };
      s += glass1(gi.x, gi.y, gi.w, gi.h);
      // arco anta sx
      if (showAp) s += arcApertura(x, y, w, h, "sx");
      // tratteggio ribalta
      s += `<path d="M ${x} ${y + h} L ${x + w/2} ${y + h - Math.min(w,h)*0.5} L ${x + w} ${y + h}"
        fill="${C.open}15" stroke="${C.open}" stroke-width="1" stroke-dasharray="6,4"/>`;
      s += text(x + w/2, y + h - 18, "↕ rib.", 11, C.open, "middle", "700");
      s += maniglia(x, y, w, h, "sx");
      break;
    }

    // ── SCORREVOLE 2 ──
    case "SC2": {
      const hw = (w - T_MULLI) / 2;
      // guida (linee orizzontali)
      s += line(x, y + T_FRAME/2, x + w, y + T_FRAME/2, C.dimLine, 1.2);
      s += line(x, y + h - T_FRAME/2, x + w, y + h - T_FRAME/2, C.dimLine, 1.2);
      // anta sx (mobile)
      s += anta(x, y, hw + T_MULLI/2, h);
      s += glass1(x + T_SASH + T_BEAD, y + T_SASH + T_BEAD, hw + T_MULLI/2 - (T_SASH+T_BEAD)*2, h - (T_SASH+T_BEAD)*2);
      s += line(x + hw/2, y + h*0.4, x + hw/2 + hw*0.5, y + h*0.4, C.open, 2); // freccia
      s += text(x + hw/2 + hw*0.25, y + h*0.4 - 10, "→", 20, C.open, "middle");
      // anta dx (fissa)
      const ax2 = x + hw + T_MULLI/2;
      s += fisso(ax2, y, w - hw - T_MULLI/2, h);
      s += glass1(ax2 + T_SASH + T_BEAD, y + T_SASH + T_BEAD, w - hw - T_MULLI/2 - (T_SASH+T_BEAD)*2, h - (T_SASH+T_BEAD)*2);
      break;
    }

    // ── ALZANTE SCORREVOLE ──
    case "ALZ": {
      const hw = (w - T_MULLI) / 2;
      s += montante(x + hw);
      s += anta(x, y, hw, h);
      s += glass1(x + T_SASH + T_BEAD, y + T_SASH + T_BEAD, hw - (T_SASH+T_BEAD)*2, h - (T_SASH+T_BEAD)*2);
      s += line(x + hw/2, y + h*0.5, x + hw/2, y + h*0.5 - h*0.25, C.open, 2);
      s += text(x + hw/2, y + h*0.3, "↑", 22, C.open, "middle");
      const ax2 = x + hw + T_MULLI;
      s += anta(ax2, y, w - hw - T_MULLI, h);
      s += glass1(ax2 + T_SASH + T_BEAD, y + T_SASH + T_BEAD, w - hw - T_MULLI - (T_SASH+T_BEAD)*2, h - (T_SASH+T_BEAD)*2);
      s += line(ax2 + (w - hw - T_MULLI)/2, y + h*0.5, ax2 + (w - hw - T_MULLI)/2, y + h*0.5 - h*0.25, C.open, 2);
      s += text(ax2 + (w-hw-T_MULLI)/2, y + h*0.3, "↑", 22, C.open, "middle");
      s += text(x + w/2, y + h - 20, "ALZANTE SCORREVOLE", 12, C.open, "middle", "800");
      break;
    }

    // ── ARCO ──
    case "ARCO": {
      const archH = Math.round(h * 0.22);
      const hw = (w - T_MULLI) / 2;
      s += montante(x + hw);
      // telaio arco superiore
      s += `<path d="M ${x} ${y + archH} Q ${x + w/2} ${y - archH * 0.6} ${x + w} ${y + archH}"
        fill="${C.hatch}" stroke="${C.frame}" stroke-width="3" opacity="0.5"/>`;
      // 2 ante sotto arco
      const ayA = y + archH + T_TRANS;
      const ahA = h - archH - T_TRANS;
      s += anta(x, ayA, hw, ahA);
      s += glass1(x + T_SASH + T_BEAD, ayA + T_SASH + T_BEAD, hw - (T_SASH+T_BEAD)*2, ahA - (T_SASH+T_BEAD)*2);
      if (showAp) s += arcApertura(x, ayA, hw, ahA, "sx");
      const ax2 = x + hw + T_MULLI;
      const aw2 = w - hw - T_MULLI;
      s += anta(ax2, ayA, aw2, ahA);
      s += glass1(ax2 + T_SASH + T_BEAD, ayA + T_SASH + T_BEAD, aw2 - (T_SASH+T_BEAD)*2, ahA - (T_SASH+T_BEAD)*2);
      if (showAp) s += arcApertura(ax2, ayA, aw2, ahA, "dx");
      break;
    }

    default: {
      // fallback: 1 anta dx
      s += anta(x, y, w, h);
      s += glass1(x + T_SASH + T_BEAD, y + T_SASH + T_BEAD, w - (T_SASH+T_BEAD)*2, h - (T_SASH+T_BEAD)*2);
      if (showAp) s += arcApertura(x, y, w, h, "dx");
      s += maniglia(x, y, w, h, "dx");
    }
  }

  return s;
}

// ─────────────────────────────────────────────────────────────
// QUOTE INTERNE (divisori)
// ─────────────────────────────────────────────────────────────
function buildQuoteInterne(tipo: TipoInfisso, inner: any, cfg: WindowConfig): string {
  const { x, y, w, h } = inner;
  let s = "";

  switch (tipo) {
    case "F2A": case "PF2": case "P2": {
      const hw = (w - T_MULLI) / 2;
      s += quota(x, y + h, x + hw, y + h, hw, 20);
      s += quota(x + hw + T_MULLI, y + h, x + w, y + h, hw, 20);
      s += quota(x, y + h, x, y, h, 50, false);
      break;
    }
    case "F3A": {
      const tw = (w - T_MULLI*2) / 3;
      s += quota(x, y + h, x + tw, y + h, tw, 20);
      s += quota(x + tw + T_MULLI, y + h, x + tw*2 + T_MULLI, y + h, tw, 20);
      break;
    }
    case "FISSO_TRAV":
    case "VASISTAS": {
      const travY = tipo === "VASISTAS" ? y + Math.round(h * 0.32) : y + (cfg.travH || Math.round(h * 0.4));
      s += quota(x + w, y, x + w, travY, travY - y, 40, false);
      s += quota(x + w, travY, x + w, y + h, h - (travY - y), 40, false);
      break;
    }
  }
  return s;
}

// ─────────────────────────────────────────────────────────────
// MINI PREVIEW (per griglia selezione tipo, 80x60)
// ─────────────────────────────────────────────────────────────
export function buildMiniPreview(tipo: TipoInfisso): string {
  const W = 200, H = 260;
  const mini = buildWindowSVG({ tipo, W, H, showQuote: false, showApertura: true });
  return mini.replace(`viewBox="0 0 ${W} ${H}"`, `viewBox="0 0 ${W} ${H}"`);
}

// ─────────────────────────────────────────────────────────────
// REACT COMPONENT
// ─────────────────────────────────────────────────────────────
import React, { useMemo } from "react";

interface InfissoSVGProps {
  config: WindowConfig;
  className?: string;
  style?: React.CSSProperties;
}

export default function InfissoSVG({ config, className, style }: InfissoSVGProps) {
  const svgHtml = useMemo(() => buildWindowSVG(config), [
    config.tipo, config.W, config.H, config.tapparella,
    config.zanzariera, config.showQuote, config.travH,
  ]);

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
