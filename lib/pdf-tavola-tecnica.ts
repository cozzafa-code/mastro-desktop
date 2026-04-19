// ============================================================
// MASTRO ERP — lib/pdf-tavola-tecnica.ts
// Tavola Tecnica Professionale per Vano
// Genera PDF A4 con: vista frontale SVG, sezioni nodi,
// tabella specifiche, dati trasmittanza, sistema, vetro
// ============================================================
import jsPDF from "jspdf";

// ─── TIPI ───────────────────────────────────────────────────
interface Vano {
  id: string;
  nome?: string;
  tipo?: string;
  stanza?: string;
  piano?: string;
  pezzi?: number;
  sistema?: string;
  colore?: string;
  vetro?: string;
  controtelaio?: string;
  soglia?: string;
  davanzale?: string;
  note?: string;
  misure?: Record<string, number>;
  accessori?: any;
  vociLibere?: any[];
  prezzoManuale?: number;
}

interface SistemaDB {
  marca?: string;
  sistema?: string;
  euroMq?: number;
  prezzoMq?: number;
  uf?: number;
  profondita?: number;
  camere?: number;
  antieffrazione?: string;
  acustico?: number;
}

interface VetroDB {
  nome?: string;
  code?: string;
  ug?: number;
  composizione?: string;
}

interface AziendaInfo {
  ragione?: string;
  indirizzo?: string;
  telefono?: string;
  email?: string;
  logo?: string;
  piva?: string;
}

interface Ctx {
  aziendaInfo?: AziendaInfo;
  sistemiDB?: SistemaDB[];
  vetriDB?: VetroDB[];
  cliente?: string;
  cognome?: string;
  commessaCode?: string;
  commessaData?: string;
}

// ─── COLORI BRAND ───────────────────────────────────────────
const C = {
  topbar:  [26,  26,  28],   // #1A1A1C
  teal:    [45,  122, 107],  // #2D7A6B
  amber:   [208, 128, 8],    // #D08008
  green:   [26,  158, 115],  // #1A9E73
  blue:    [59,  127, 224],  // #3B7FE0
  red:     [220, 68,  68],   // #DC4444
  bg:      [242, 241, 236],  // #F2F1EC
  text:    [26,  26,  28],
  sub:     [134, 134, 139],
  bdr:     [220, 220, 215],
  white:   [255, 255, 255],
  lightbg: [248, 248, 245],
};

// ─── HELPERS ─────────────────────────────────────────────────
function rgb(doc: jsPDF, color: number[]) {
  doc.setDrawColor(color[0], color[1], color[2]);
}
function fill(doc: jsPDF, color: number[]) {
  doc.setFillColor(color[0], color[1], color[2]);
}
function textColor(doc: jsPDF, color: number[]) {
  doc.setTextColor(color[0], color[1], color[2]);
}

// Calcola Uw dalla formula semplificata
function calcUw(uf: number, ug: number, ag: number, af: number, lg: number, psi = 0.06): number {
  const at = ag + af;
  if (at <= 0) return uf;
  return (uf * af + ug * ag + psi * lg) / at;
}

// Ricava etichetta tipologia
function tipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    F1A: "Finestra 1 anta", F2A: "Finestra 2 ante", F3A: "Finestra 3 ante",
    F4A: "Finestra 4 ante", PF1A: "Balcone 1 anta", PF2A: "Balcone 2 ante",
    PF3A: "Balcone 3 ante", PF4A: "Balcone 4 ante",
    SC2A: "Scorrevole 2 ante", SC4A: "Scorrevole 4 ante",
    SCRDX: "Scorrevole DX", SCRSX: "Scorrevole SX",
    ALZDX: "Alzante DX", ALZSX: "Alzante SX",
    VAS: "Vasistas", RIBALTA: "Ribalta",
    F2AFISDX: "Finestra 2A + Fisso DX", F2AFISSX: "Finestra 2A + Fisso SX",
  };
  return map[tipo] || tipo || "—";
}

// ─── SVG VISTA FRONTALE (disegnato con jsPDF) ─────────────────
function disegnaVistaFrontale(
  doc: jsPDF,
  x: number, y: number,
  W: number, H: number,
  lmm: number, hmm: number,
  tipo: string
) {
  const fw = W - 10;
  const fh = H - 10;
  const fx = x + 5;
  const fy = y + 5;

  // Sfondo area disegno
  fill(doc, C.white);
  doc.rect(x, y, W, H, "F");
  rgb(doc, C.bdr);
  doc.setLineWidth(0.3);
  doc.rect(x, y, W, H, "S");

  // Telaio fisso (bordo esterno)
  const tf = 4; // spessore telaio mm su disegno
  fill(doc, [200, 200, 200]);
  rgb(doc, [100, 100, 100]);
  doc.setLineWidth(0.5);
  doc.rect(fx, fy, fw, fh, "FD");

  // Apertura interna (luce)
  fill(doc, C.white);
  doc.rect(fx + tf, fy + tf, fw - tf*2, fh - tf*2, "FD");

  const isTwoLeaf = ["F2A","PF2A","F3A","PF3A","SC2A","F2AFISDX","F2AFISSX"].includes(tipo);
  const isScorrevole = tipo.startsWith("SC") || tipo.startsWith("ALZ");
  const isVasistas = tipo === "VAS" || tipo === "RIBALTA";
  const isFisso = tipo === "FISDX" || tipo === "FISSX";

  const ix = fx + tf, iy = fy + tf;
  const iw = fw - tf*2, ih = fh - tf*2;

  if (isFisso) {
    // Solo vetro, nessuna anta
    fill(doc, [200, 230, 255]);
    rgb(doc, [100, 160, 220]);
    doc.setLineWidth(0.3);
    doc.rect(ix + 1, iy + 1, iw - 2, ih - 2, "FD");
    // Croce vetro
    doc.setDrawColor(150, 200, 240);
    doc.setLineWidth(0.2);
    doc.line(ix+1, iy+1, ix+iw-1, iy+ih-1);
    doc.line(ix+iw-1, iy+1, ix+1, iy+ih-1);
  } else if (isTwoLeaf) {
    // Due ante
    const half = iw / 2;
    const ta = 2.5;
    [0, 1].forEach(side => {
      const ax = ix + side * half;
      const aw = half;
      fill(doc, [230, 230, 230]);
      rgb(doc, [80, 80, 80]);
      doc.setLineWidth(0.4);
      doc.rect(ax, iy, aw, ih, "FD");
      // Vetro anta
      fill(doc, [200, 230, 255]);
      rgb(doc, [100, 160, 220]);
      doc.setLineWidth(0.2);
      doc.rect(ax + ta, iy + ta, aw - ta*2, ih - ta*2, "FD");
      // Diagonale vetro
      doc.setDrawColor(150, 200, 240);
      doc.line(ax+ta, iy+ta, ax+aw-ta, iy+ih-ta);
      doc.line(ax+aw-ta, iy+ta, ax+ta, iy+ih-ta);
    });
    // Maniglia sx (su anta destra)
    fill(doc, [80, 80, 80]);
    doc.setLineWidth(0.2);
    doc.rect(ix + half - 1, iy + ih/2 - 4, 2, 8, "F");
  } else if (isScorrevole) {
    // Anta scorrevole (anta dx sovrapposta)
    const ta = 2.5;
    fill(doc, [230, 230, 230]);
    rgb(doc, [80, 80, 80]);
    doc.setLineWidth(0.3);
    doc.rect(ix, iy, iw/2, ih, "FD");
    fill(doc, [200, 230, 255]);
    doc.rect(ix + ta, iy + ta, iw/2 - ta*2, ih - ta*2, "FD");
    doc.setDrawColor(150, 200, 240);
    doc.line(ix+ta, iy+ta, ix+iw/2-ta, iy+ih-ta);
    // frecce scorrevole
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.3);
    doc.line(ix + iw*0.6, iy + ih/2, ix + iw*0.9, iy + ih/2);
    doc.line(ix + iw*0.9, iy + ih/2, ix + iw*0.85, iy + ih/2 - 1.5);
    doc.line(ix + iw*0.9, iy + ih/2, ix + iw*0.85, iy + ih/2 + 1.5);
  } else if (isVasistas) {
    // Anta ribaltante
    const ta = 2.5;
    fill(doc, [230, 230, 230]);
    rgb(doc, [80, 80, 80]);
    doc.setLineWidth(0.4);
    doc.rect(ix, iy, iw, ih, "FD");
    fill(doc, [200, 230, 255]);
    doc.rect(ix+ta, iy+ta, iw-ta*2, ih-ta*2, "FD");
    doc.setDrawColor(150, 200, 240);
    doc.line(ix+ta, iy+ta, ix+iw-ta, iy+ih-ta);
    doc.line(ix+iw-ta, iy+ta, ix+ta, iy+ih-ta);
    // Freccia vasistas (verso il basso)
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.4);
    doc.line(ix + iw/2, iy+2, ix + iw/2, iy + ih - 2);
    doc.line(ix + iw/2, iy + ih - 2, ix + iw/2 - 2, iy + ih - 5);
    doc.line(ix + iw/2, iy + ih - 2, ix + iw/2 + 2, iy + ih - 5);
  } else {
    // 1 anta default
    const ta = 2.5;
    fill(doc, [230, 230, 230]);
    rgb(doc, [80, 80, 80]);
    doc.setLineWidth(0.4);
    doc.rect(ix, iy, iw, ih, "FD");
    fill(doc, [200, 230, 255]);
    doc.rect(ix+ta, iy+ta, iw-ta*2, ih-ta*2, "FD");
    doc.setDrawColor(150, 200, 240);
    doc.line(ix+ta, iy+ta, ix+iw-ta, iy+ih-ta);
    doc.line(ix+iw-ta, iy+ta, ix+ta, iy+ih-ta);
    // maniglia
    fill(doc, [80, 80, 80]);
    doc.rect(ix + iw - ta - 1, iy + ih/2 - 3, 2, 6, "F");
  }

  // Quote larghezza
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.25);
  doc.line(fx, fy + fh + 4, fx + fw, fy + fh + 4);
  doc.line(fx, fy + fh + 2, fx, fy + fh + 6);
  doc.line(fx + fw, fy + fh + 2, fx + fw, fy + fh + 6);
  doc.setFontSize(6);
  textColor(doc, C.text);
  doc.setFont("helvetica", "bold");
  doc.text(`${lmm} mm`, fx + fw/2, fy + fh + 8, { align: "center" });

  // Quote altezza
  doc.setDrawColor(60, 60, 60);
  doc.line(fx - 4, fy, fx - 4, fy + fh);
  doc.line(fx - 6, fy, fx - 2, fy);
  doc.line(fx - 6, fy + fh, fx - 2, fy + fh);
  doc.text(`${hmm} mm`, fx - 4, fy + fh/2, { align: "center", angle: 90 });

  // Label "Vista interna"
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "normal");
  textColor(doc, C.sub);
  doc.text("Vista interna", fx + fw/2, fy + fh + 14, { align: "center" });
}

// ─── NODO SEZIONE (schematico generico) ───────────────────────
function disegnaNodo(
  doc: jsPDF,
  x: number, y: number,
  W: number, H: number,
  tipo: "verticale" | "orizzontale",
  label: string,
  vetroSpessore = 24
) {
  // Sfondo
  fill(doc, C.white);
  rgb(doc, C.bdr);
  doc.setLineWidth(0.2);
  doc.rect(x, y, W, H, "FD");

  const mx = x + W/2;
  const my = y + H/2;
  const profilo = 6; // spessore profilo mm in disegno
  const vetroW = vetroSpessore * 0.08; // scala

  if (tipo === "verticale") {
    // Nodo verticale: telaio fisso sopra/sotto, anta in mezzo, vetro al centro
    // Telaio superiore
    fill(doc, [180, 180, 180]);
    rgb(doc, [80, 80, 80]);
    doc.setLineWidth(0.3);
    doc.rect(x+3, y+3, W-6, profilo, "FD");
    // Telaio inferiore
    doc.rect(x+3, y+H-profilo-3, W-6, profilo, "FD");
    // Anta sup
    fill(doc, [210, 210, 210]);
    doc.rect(x+5, y+profilo+3, W-10, profilo*0.8, "FD");
    // Anta inf
    doc.rect(x+5, y+H-profilo-3-profilo*0.8, W-10, profilo*0.8, "FD");
    // Vetro
    fill(doc, [190, 220, 255]);
    rgb(doc, [100, 160, 220]);
    doc.setLineWidth(0.4);
    const gy = y + profilo + 3 + profilo*0.8;
    const gh = H - 2*(profilo + 3 + profilo*0.8);
    doc.rect(mx - vetroW/2, gy, vetroW, gh, "FD");
    // Guarnizioni
    doc.setFillColor(60, 60, 60);
    doc.circle(mx - vetroW/2 - 0.5, gy + 1.5, 0.8, "F");
    doc.circle(mx + vetroW/2 + 0.5, gy + 1.5, 0.8, "F");
    doc.circle(mx - vetroW/2 - 0.5, gy + gh - 1.5, 0.8, "F");
    doc.circle(mx + vetroW/2 + 0.5, gy + gh - 1.5, 0.8, "F");
    // Quote spessore vetro
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.15);
    doc.line(mx - vetroW/2, y+H-2, mx + vetroW/2, y+H-2);
    doc.setFontSize(4.5);
    textColor(doc, C.sub);
    doc.text(`${vetroSpessore}mm`, mx, y+H-0.5, { align: "center" });
  } else {
    // Nodo orizzontale: telaio sx/dx, anta, vetro
    // Telaio sinistro
    fill(doc, [180, 180, 180]);
    rgb(doc, [80, 80, 80]);
    doc.setLineWidth(0.3);
    doc.rect(x+3, y+3, profilo, H-6, "FD");
    // Telaio destro
    doc.rect(x+W-profilo-3, y+3, profilo, H-6, "FD");
    // Anta sx
    fill(doc, [210, 210, 210]);
    doc.rect(x+profilo+3, y+5, profilo*0.8, H-10, "FD");
    // Anta dx
    doc.rect(x+W-profilo-3-profilo*0.8, y+5, profilo*0.8, H-10, "FD");
    // Vetro
    fill(doc, [190, 220, 255]);
    rgb(doc, [100, 160, 220]);
    doc.setLineWidth(0.4);
    const gx = x + profilo + 3 + profilo*0.8;
    const gw = W - 2*(profilo + 3 + profilo*0.8);
    doc.rect(gx, my - vetroW/2, gw, vetroW, "FD");
    // Guarnizioni
    doc.setFillColor(60, 60, 60);
    doc.circle(gx + 1.5, my - vetroW/2 - 0.5, 0.8, "F");
    doc.circle(gx + 1.5, my + vetroW/2 + 0.5, 0.8, "F");
    doc.circle(gx + gw - 1.5, my - vetroW/2 - 0.5, 0.8, "F");
    doc.circle(gx + gw - 1.5, my + vetroW/2 + 0.5, 0.8, "F");
  }

  // Label nodo
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  textColor(doc, C.text);
  doc.text(label, x + W/2, y + H + 5, { align: "center" });
}

// ─── MAIN EXPORT ─────────────────────────────────────────────
export function generaTavolaTecnica(vano: Vano, ctx: Ctx): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = 210, PH = 297;
  const ML = 14, MR = 14, MT = 14;

  const m = vano.misure || {};
  const lmm = m.lCentro || m.lAlto || 0;
  const hmm = m.hCentro || m.hSx || 0;
  const lc = lmm / 1000, hc = hmm / 1000;
  const mq = lc * hc;

  const az = ctx.aziendaInfo || {};
  const sysRec = (ctx.sistemiDB || []).find(
    s => (s.marca + " " + s.sistema) === vano.sistema || s.sistema === vano.sistema
  ) as any;
  const vetroRec = (ctx.vetriDB || []).find(
    g => g.code === vano.vetro || g.nome === vano.vetro
  ) as any;

  // Ug vetro
  const ug = vetroRec?.ug || 1.1;
  const uf = sysRec?.uf || 1.4;
  // Stima aree per Uw
  const ag = mq * 0.70;
  const af = mq * 0.30;
  const lg = 2 * (lc + hc);
  const uw = calcUw(uf, ug, ag, af, lg);

  // Spessore vetro approssimato dal codice
  let vetroSpessore = 24;
  if (vetroRec?.code) {
    const parts = (vetroRec.code || "").split("/");
    if (parts.length >= 3) {
      const sp = parseInt(parts[1]) || 16;
      vetroSpessore = sp + 8;
    }
  }

  // ─── HEADER ──────────────────────────────────────────────
  fill(doc, C.topbar);
  doc.rect(0, 0, PW, 22, "F");

  // Logo M
  fill(doc, C.amber);
  doc.roundedRect(ML, 4, 14, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  textColor(doc, C.white);
  doc.text("M", ML + 7, 13.5, { align: "center" });

  // Nome azienda
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  textColor(doc, C.white);
  doc.text(az.ragione || "MASTRO ERP", ML + 18, 10);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  textColor(doc, [180, 180, 180]);
  doc.text(az.indirizzo || "", ML + 18, 15);

  // Titolo destra
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  textColor(doc, C.amber);
  doc.text("TAVOLA TECNICA", PW - MR, 11, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  textColor(doc, [180, 180, 180]);
  doc.text("Specifiche costruttive vano", PW - MR, 16.5, { align: "right" });

  let cy = 28;

  // ─── INFO BOX ─────────────────────────────────────────────
  fill(doc, C.lightbg);
  rgb(doc, C.bdr);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, cy, PW - ML - MR, 22, 2, 2, "FD");

  const colW = (PW - ML - MR) / 4;
  const infoItems = [
    { label: "VANO", value: vano.nome || `Vano` },
    { label: "TIPOLOGIA", value: tipoLabel(vano.tipo || "") },
    { label: "COMMESSA", value: ctx.commessaCode || "—" },
    { label: "CLIENTE", value: `${ctx.cliente || ""} ${ctx.cognome || ""}`.trim() || "—" },
  ];
  infoItems.forEach((item, i) => {
    const ix = ML + i * colW;
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    textColor(doc, C.sub);
    doc.text(item.label, ix + 4, cy + 7);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    textColor(doc, C.text);
    doc.text(item.value, ix + 4, cy + 14);
    if (i < 3) {
      doc.setDrawColor(C.bdr[0], C.bdr[1], C.bdr[2]);
      doc.setLineWidth(0.2);
      doc.line(ix + colW, cy + 3, ix + colW, cy + 19);
    }
  });

  // Misure
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  textColor(doc, C.sub);
  doc.text("MISURE", ML + 4, cy + 20.5);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  textColor(doc, C.teal);
  doc.text(`${lmm} × ${hmm} mm  —  ${mq.toFixed(2)} m²  —  ${vano.pezzi || 1} pz`, ML + 4 + 16, cy + 20.5);

  cy += 26;

  // ─── LAYOUT PRINCIPALE: Vista frontale + Nodi ──────────────
  const leftW = 70;
  const rightX = ML + leftW + 6;
  const rightW = PW - rightX - MR;
  const drawH = 90;

  // Vista frontale
  disegnaVistaFrontale(
    doc,
    ML, cy,
    leftW, drawH,
    lmm, hmm,
    vano.tipo || "F2A"
  );

  // 3 nodi a destra
  const nodoW = (rightW - 8) / 2;
  const nodoH = 38;

  // Nodo sezione verticale superiore
  disegnaNodo(doc, rightX, cy, nodoW, nodoH, "verticale", "Nodo Sup. — Traverso", vetroSpessore);
  // Nodo sezione verticale inferiore
  disegnaNodo(doc, rightX, cy + nodoH + 6, nodoW, nodoH, "verticale", "Nodo Inf. — Traverso", vetroSpessore);
  // Nodo sezione orizzontale
  disegnaNodo(doc, rightX + nodoW + 8, cy, nodoW, nodoH*2 + 6, "orizzontale", "Nodo Lat. — Montante", vetroSpessore);

  // Nota schematica
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "italic");
  textColor(doc, C.sub);
  doc.text("* Nodi schematici — profili reali da tavole fornitore", rightX, cy + nodoH*2 + 14);

  cy += drawH + 10;

  // ─── TABELLA SPECIFICHE ───────────────────────────────────
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  textColor(doc, C.text);
  doc.text("SPECIFICHE TECNICHE", ML, cy);

  cy += 4;

  const rows: [string, string, string, string][] = [
    // Sistema
    ["Sistema", sysRec ? `${sysRec.marca} ${sysRec.sistema}` : (vano.sistema || "—"),
     "Classe", sysRec?.antieffrazione || "RC2"],
    // Vetro
    ["Vetro", vetroRec ? `${vetroRec.nome} (${vetroRec.code})` : (vano.vetro || "—"),
     "Ug vetro", `${ug.toFixed(2)} W/m²K`],
    // Colori
    ["Colore int.", vano.colore?.split("/")[0]?.trim() || "—",
     "Colore est.", vano.colore?.split("/")[1]?.trim() || vano.colore || "—"],
    // Trasmittanza
    ["Uf profilo", `${uf.toFixed(2)} W/m²K`,
     "Uw calcolato", `${uw.toFixed(2)} W/m²K`],
    // Controtelaio / Soglia
    ["Controtelaio", vano.controtelaio || "—",
     "Soglia", vano.soglia || "—"],
    // Davanzale / Piano
    ["Davanzale", vano.davanzale || "—",
     "Piano/Stanza", `${vano.piano || "—"} / ${vano.stanza || "—"}`],
  ];

  const tableW = PW - ML - MR;
  const rowH = 7;
  const colWidths = [28, tableW * 0.35, 28, tableW * 0.35 - 28];

  rows.forEach((row, ri) => {
    const ry = cy + ri * rowH;
    // Sfondo alternato
    fill(doc, ri % 2 === 0 ? C.lightbg : C.white);
    doc.rect(ML, ry, tableW, rowH, "F");
    // Bordo
    rgb(doc, C.bdr);
    doc.setLineWidth(0.15);
    doc.rect(ML, ry, tableW, rowH, "S");

    let cx2 = ML;
    row.forEach((cell, ci) => {
      const cw = ci === 0 ? colWidths[0] : ci === 1 ? colWidths[1] : ci === 2 ? colWidths[2] : colWidths[3];
      const isLabel = ci === 0 || ci === 2;
      doc.setFontSize(isLabel ? 6.5 : 7.5);
      doc.setFont("helvetica", isLabel ? "normal" : "bold");
      textColor(doc, isLabel ? C.sub : C.text);
      doc.text(cell, cx2 + 2, ry + rowH - 2);
      // Separatore verticale
      if (ci < 3) {
        rgb(doc, C.bdr);
        doc.setLineWidth(0.15);
        doc.line(cx2 + cw, ry, cx2 + cw, ry + rowH);
      }
      cx2 += cw;
    });
  });

  cy += rows.length * rowH + 6;

  // ─── ACCESSORI ────────────────────────────────────────────
  const acc = vano.accessori || {};
  const accItems: string[] = [];
  if (acc.tapparella?.attivo) accItems.push(`Tapparella ${acc.tapparella.tipo || ""} ${acc.tapparella.motorizzata ? "motorizzata" : ""}`.trim());
  if (acc.persiana?.attivo) accItems.push(`Persiana ${acc.persiana.tipo || ""}`.trim());
  if (acc.zanzariera?.attivo) accItems.push(`Zanzariera ${acc.zanzariera.tipo || ""}`.trim());
  if (vano.controtelaio && vano.controtelaio !== "Nessuno") accItems.push(`Controtelaio ${vano.controtelaio}`);

  if (accItems.length > 0) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    textColor(doc, C.text);
    doc.text("ACCESSORI E DOTAZIONI", ML, cy);
    cy += 4;
    fill(doc, C.lightbg);
    rgb(doc, C.bdr);
    doc.setLineWidth(0.15);
    doc.roundedRect(ML, cy, tableW, accItems.length * 6 + 4, 1, 1, "FD");
    accItems.forEach((a, ai) => {
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      textColor(doc, C.text);
      doc.text(`• ${a}`, ML + 3, cy + 5 + ai * 6);
    });
    cy += accItems.length * 6 + 8;
  }

  // ─── NOTE ─────────────────────────────────────────────────
  if (vano.note) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    textColor(doc, C.text);
    doc.text("NOTE TECNICHE", ML, cy);
    cy += 4;
    fill(doc, [255, 248, 225]);
    rgb(doc, [240, 180, 0]);
    doc.setLineWidth(0.3);
    doc.roundedRect(ML, cy, tableW, 12, 1, 1, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    textColor(doc, [100, 80, 0]);
    doc.text(vano.note, ML + 3, cy + 7.5);
    cy += 16;
  }

  // ─── BOX TRASMITTANZA ─────────────────────────────────────
  // (solo se abbiamo dati sufficienti)
  if (lmm > 0 && hmm > 0) {
    const bw = (tableW - 8) / 3;
    const bh = 22;
    const bdata = [
      { label: "Uw", value: `${uw.toFixed(2)}`, unit: "W/m²K", color: uw < 1.4 ? C.green : uw < 1.8 ? C.amber : C.red },
      { label: "Ug vetro", value: `${ug.toFixed(2)}`, unit: "W/m²K", color: C.blue },
      { label: "Superficie", value: `${mq.toFixed(3)}`, unit: "m²", color: C.teal },
    ];

    bdata.forEach((b, bi) => {
      const bx = ML + bi * (bw + 4);
      const by2 = cy;
      fill(doc, C.white);
      rgb(doc, b.color);
      doc.setLineWidth(0.5);
      doc.roundedRect(bx, by2, bw, bh, 2, 2, "FD");
      // Barra colore sinistra
      fill(doc, b.color);
      doc.roundedRect(bx, by2, 3, bh, 2, 2, "F");
      doc.rect(bx + 1, by2, 2, bh, "F");
      // Label
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      textColor(doc, C.sub);
      doc.text(b.label, bx + 6, by2 + 7);
      // Valore
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      textColor(doc, b.color);
      doc.text(b.value, bx + 6, by2 + 17);
      // Unità
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      textColor(doc, C.sub);
      doc.text(b.unit, bx + 6 + doc.getTextWidth(b.value) * 14/doc.getFontSize() + 1, by2 + 17);
    });
    cy += bh + 6;
  }

  // ─── FOOTER ──────────────────────────────────────────────
  const footerY = PH - 14;
  fill(doc, C.bg);
  doc.rect(0, footerY, PW, 14, "F");
  rgb(doc, C.bdr);
  doc.setLineWidth(0.3);
  doc.line(0, footerY, PW, footerY);

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  textColor(doc, C.sub);
  doc.text(az.ragione || "MASTRO ERP", ML, footerY + 5);
  doc.text(az.telefono || "", ML, footerY + 9.5);
  doc.text(az.email || "", ML + 35, footerY + 9.5);

  const dataDoc = new Date().toLocaleDateString("it-IT");
  doc.text(`Emesso il ${dataDoc}`, PW/2, footerY + 5, { align: "center" });
  doc.setFontSize(5.5);
  doc.text("Documento generato da MASTRO ERP — Nodi a scopo indicativo. Profili reali da tavole fornitore.", PW/2, footerY + 9.5, { align: "center" });
  doc.text(`Pag. 1/1`, PW - MR, footerY + 7, { align: "right" });

  // ─── DOWNLOAD ────────────────────────────────────────────
  const nome = (ctx.cliente || "Cliente").replace(/\s+/g, "_");
  const codice = ctx.commessaCode?.replace(/\s+/g, "_") || "CM";
  const vNome = (vano.nome || "Vano").replace(/\s+/g, "_");
  doc.save(`tavola_tecnica_${codice}_${vNome}_${nome}.pdf`);
}
