// ============================================================
// MASTRO ERP — lib/pdf-fascicolo.ts
// PDF Fascicolo Geometra — multi-pagina A4
// Copertina + pagina per vano + riepilogo + firme
// ============================================================
import jsPDF from "jspdf";
import type { FascicoloSnapshot } from "./fascicolo-service";

// ─── COLORI BRAND ────────────────────────────────────────────
const C = {
  topbar:  [3,   22,  49],   // navy #031631
  teal:    [3,   22,  49],   // navy (era teal)
  accent:  [26,  43,  71],   // primaryContainer #1a2b47
  amber:   [26,  43,  71],   // navy dark
  green:   [26,  158, 115],
  blue:    [59,  127, 224],
  red:     [220, 68,  68],
  bg:      [249, 249, 251],  // Lumina bg
  text:    [26,  28,  29],
  sub:     [68,  71,  77],
  muted:   [130, 147, 180],
  bdr:     [220, 220, 222],
  white:   [255, 255, 255],
  lightbg: [243, 243, 245],  // surfaceLow
  purple:  [99,  102, 241],
};

const PW = 210, PH = 297;
const ML = 16, MR = 16;

// ─── HELPERS ─────────────────────────────────────────────────
const r = (d: jsPDF, c: number[]) => d.setDrawColor(c[0], c[1], c[2]);
const f = (d: jsPDF, c: number[]) => d.setFillColor(c[0], c[1], c[2]);
const t = (d: jsPDF, c: number[]) => d.setTextColor(c[0], c[1], c[2]);
const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function tipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    F1A:"Finestra 1A", F2A:"Finestra 2A", F3A:"Finestra 3A", F4A:"Finestra 4A",
    PF1A:"Balcone 1A", PF2A:"Balcone 2A", PF3A:"Balcone 3A", PF4A:"Balcone 4A",
    SC2A:"Scorrevole 2A", SC4A:"Scorrevole 4A", VAS:"Vasistas", RIBALTA:"Ribalta",
    SCRDX:"Scorrevole DX", SCRSX:"Scorrevole SX", ALZDX:"Alzante DX", ALZSX:"Alzante SX",
    FISDX:"Fisso DX", FISSX:"Fisso SX",
  };
  return map[tipo] || tipo || "—";
}

function statoLabel(s: string): { label: string; color: number[] } {
  const map: Record<string, { label: string; color: number[] }> = {
    provvisorie:  { label: "Provvisorie",  color: C.amber },
    verificate:   { label: "Verificate",   color: C.blue },
    confermate:   { label: "Confermate",   color: C.green },
    da_rivedere:  { label: "Da rivedere",  color: C.red },
  };
  return map[s] || { label: s || "—", color: C.sub };
}

// ─── FOOTER STANDARD ─────────────────────────────────────────
function footer(doc: jsPDF, snap: FascicoloSnapshot, pageNum: number, totalPages: number) {
  f(doc, C.bg);
  doc.rect(0, PH - 12, PW, 12, "F");
  r(doc, C.bdr);
  doc.setLineWidth(0.3);
  doc.line(0, PH - 12, PW, PH - 12);

  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  t(doc, C.sub);
  doc.text(snap.azienda.ragione || "MASTRO ERP", ML, PH - 5);
  doc.text(`Generato il ${new Date(snap.generatoIl).toLocaleDateString("it-IT")} · Valido fino al ${new Date(snap.validoFino).toLocaleDateString("it-IT")}`, PW / 2, PH - 5, { align: "center" });
  doc.text(`Pag. ${pageNum}/${totalPages}`, PW - MR, PH - 5, { align: "right" });
}

// ─── HEADER PAGINA INTERNA ────────────────────────────────────
function pageHeader(doc: jsPDF, snap: FascicoloSnapshot, subtitle: string) {
  f(doc, C.topbar);
  doc.rect(0, 0, PW, 14, "F");

  // Logo M
  f(doc, C.amber);
  doc.roundedRect(ML, 2.5, 9, 9, 1, 1, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  t(doc, C.white);
  doc.text("M", ML + 4.5, 9, { align: "center" });

  // Titolo
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  t(doc, C.white);
  doc.text("FASCICOLO GEOMETRA", ML + 13, 8);

  // Cliente e commessa a destra
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "normal");
  t(doc, [180, 180, 180]);
  const clienteStr = [snap.commessa.cliente, snap.commessa.cognome].filter(Boolean).join(" ") || "—";
  doc.text(`${snap.commessa.code || "—"} · ${clienteStr}`, PW - MR, 6, { align: "right" });
  doc.text(subtitle, PW - MR, 11, { align: "right" });
}

// ─── PAGINA COPERTINA ─────────────────────────────────────────
function paginaCopertina(doc: jsPDF, snap: FascicoloSnapshot) {
  // Sfondo header grande
  f(doc, C.topbar);
  doc.rect(0, 0, PW, 80, "F");

  // Barra accent teal
  f(doc, C.teal);
  doc.rect(0, 76, PW, 4, "F");

  // Logo M grande
  f(doc, C.amber);
  doc.roundedRect(ML, 18, 22, 22, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  t(doc, C.white);
  doc.text("M", ML + 11, 33, { align: "center" });

  // Titolo
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  t(doc, C.white);
  doc.text("FASCICOLO GEOMETRA", ML + 27, 28);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  t(doc, [180, 180, 180]);
  doc.text("Documentazione tecnica completa della commessa", ML + 27, 36);

  // Info azienda in header
  doc.setFontSize(8);
  t(doc, [150, 150, 150]);
  doc.text(snap.azienda.ragione || "", ML + 27, 46);
  doc.text([snap.azienda.indirizzo, snap.azienda.telefono, snap.azienda.email].filter(Boolean).join("  ·  "), ML + 27, 52);
  if (snap.azienda.piva) doc.text(`P.IVA ${snap.azienda.piva}`, ML + 27, 58);

  // Data generazione
  doc.setFontSize(7);
  t(doc, [120, 120, 120]);
  doc.text(`Emesso il ${new Date(snap.generatoIl).toLocaleDateString("it-IT")}  ·  Valido fino al ${new Date(snap.validoFino).toLocaleDateString("it-IT")}`, PW - MR, 70, { align: "right" });

  let cy = 92;

  // ── BOX CLIENTE ──────────────────────────────────────────
  f(doc, [248, 248, 245]);
  r(doc, C.bdr);
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, cy, PW - ML - MR, 48, 2, 2, "FD");

  // Barra sinistra teal
  f(doc, C.teal);
  doc.roundedRect(ML, cy, 4, 48, 2, 2, "F");
  doc.rect(ML + 2, cy, 2, 48, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  t(doc, C.teal);
  doc.text("COMMITTENTE", ML + 8, cy + 8);

  const clienteNome = [snap.commessa.cliente, snap.commessa.cognome].filter(Boolean).join(" ") || "—";
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  t(doc, C.text);
  doc.text(clienteNome, ML + 8, cy + 18);

  const infoCliente = [
    snap.commessa.indirizzo,
    snap.commessa.citta,
    snap.commessa.telefono,
    snap.commessa.email,
  ].filter(Boolean);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  t(doc, C.sub);
  infoCliente.forEach((info, i) => {
    doc.text(info!, ML + 8, cy + 27 + i * 6);
  });

  // Commessa code
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  t(doc, C.amber);
  doc.text(`Commessa ${snap.commessa.code || snap.commessa.id}`, PW - MR - 4, cy + 8, { align: "right" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  t(doc, C.sub);
  if (snap.commessa.data) doc.text(`Data: ${snap.commessa.data}`, PW - MR - 4, cy + 15, { align: "right" });
  if (snap.commessa.fase) doc.text(`Fase: ${snap.commessa.fase}`, PW - MR - 4, cy + 22, { align: "right" });

  cy += 56;

  // ── RIEPILOGO NUMERICO ────────────────────────────────────
  const kpi = [
    { label: "Vani totali",    value: String(snap.totali.nVani),  color: C.teal },
    { label: "Pezzi",          value: String(snap.totali.nPezzi), color: C.blue },
    { label: "Imponibile",     value: `€ ${fmt(snap.totali.imponibile)}`, color: C.amber },
    { label: "IVA",            value: `€ ${fmt(snap.totali.iva)}`, color: C.sub },
    { label: "Totale",         value: `€ ${fmt(snap.totali.totale)}`, color: C.green },
  ];
  const kpiW = (PW - ML - MR) / kpi.length;
  kpi.forEach((k, i) => {
    const kx = ML + i * kpiW;
    f(doc, C.white);
    r(doc, C.bdr);
    doc.setLineWidth(0.2);
    doc.rect(kx, cy, kpiW, 22, "FD");
    if (i > 0) {
      r(doc, C.bdr);
      doc.line(kx, cy + 2, kx, cy + 20);
    }
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    t(doc, C.sub);
    doc.text(k.label, kx + kpiW / 2, cy + 7, { align: "center" });
    doc.setFontSize(i >= 2 ? 9 : 13);
    doc.setFont("helvetica", "bold");
    t(doc, k.color);
    doc.text(k.value, kx + kpiW / 2, cy + 17, { align: "center" });
  });

  cy += 30;

  // ── INDICE VANI ───────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  t(doc, C.text);
  doc.text("INDICE VANI", ML, cy);

  cy += 5;
  const colW = (PW - ML - MR - 4) / 2;

  snap.vani.forEach((v, vi) => {
    const col = vi % 2;
    const row = Math.floor(vi / 2);
    const vx = ML + col * (colW + 4);
    const vy = cy + row * 10;

    const m = v.misure || {};
    const lmm = m.lCentro || m.lAlto || 0;
    const hmm = m.hCentro || m.hSx || 0;
    const stato = statoLabel(v.statoMisure || "provvisorie");

    f(doc, vi % 2 === 0 ? C.lightbg : C.white);
    r(doc, C.bdr);
    doc.setLineWidth(0.15);
    doc.rect(vx, vy, colW, 8, "FD");

    // numero
    f(doc, C.teal);
    doc.rect(vx, vy, 7, 8, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    t(doc, C.white);
    doc.text(String(vi + 1), vx + 3.5, vy + 5.5, { align: "center" });

    // nome vano
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    t(doc, C.text);
    const nomeV = v.nome || `Vano ${vi + 1}`;
    doc.text(nomeV.substring(0, 18), vx + 10, vy + 3.5);

    // tipo e misure
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    t(doc, C.sub);
    doc.text(`${tipoLabel(v.tipo || "")} · ${lmm}×${hmm}mm`, vx + 10, vy + 7);

    // badge stato
    f(doc, stato.color);
    doc.roundedRect(vx + colW - 22, vy + 2, 20, 5, 1, 1, "F");
    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    t(doc, C.white);
    doc.text(stato.label, vx + colW - 12, vy + 5.5, { align: "center" });
  });

  cy += Math.ceil(snap.vani.length / 2) * 10 + 10;

  // ── SISTEMA PRINCIPALE ───────────────────────────────────
  if (snap.commessa.sistema) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    t(doc, C.sub);
    doc.text(`Sistema principale: `, ML, cy);
    doc.setFont("helvetica", "bold");
    t(doc, C.text);
    doc.text(snap.commessa.sistema, ML + 35, cy);
  }

  // Footer copertina
  f(doc, C.bg);
  doc.rect(0, PH - 12, PW, 12, "F");
  r(doc, C.bdr);
  doc.setLineWidth(0.3);
  doc.line(0, PH - 12, PW, PH - 12);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  t(doc, C.sub);
  doc.text(snap.azienda.ragione || "", ML, PH - 5);
  doc.text("Documento riservato — MASTRO ERP", PW / 2, PH - 5, { align: "center" });
  doc.text("Pag. 1", PW - MR, PH - 5, { align: "right" });
}


// ─── SVG → PNG (per inserire il disegno CAD nel PDF) ─────────
// Nota: funzione async — usata solo quando cadData è disponibile
async function svgToPngDataUrl(svgString: string, width = 400, height = 300): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width * 2;  // retina
    canvas.height = height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    await new Promise<void>((res, rej) => {
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url); res(); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(); };
      img.src = url;
    });
    return canvas.toDataURL("image/png");
  } catch { return null; }
}

// ─── Ricostruisce SVG semplificato dalle elements del cadData ──
function buildVanoSvg(cadData: any, realW: number, realH: number): string {
  if (!cadData?.elements?.length) return "";
  const els = cadData.elements;
  const W = 360, H = 270;
  const scX = realW > 0 ? W / realW : 1;
  const scY = realH > 0 ? H / realH : 1;
  const sc = Math.min(scX, scY) * 0.85;
  const offX = (W - (realW * sc)) / 2;
  const offY = (H - (realH * sc)) / 2;

  let shapes = "";
  for (const el of els) {
    if (el.type === "rect") {
      const x = offX + el.x * sc, y = offY + el.y * sc;
      const w = el.w * sc, h = el.h * sc;
      shapes += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="none" stroke="#031631" stroke-width="1.5" rx="1"/>`;
    } else if (el.type === "montante" || el.type === "traverso") {
      const x = offX + el.x * sc, y = offY + el.y * sc;
      const w = Math.max(el.w * sc, 1.5), h = Math.max(el.h * sc, 1.5);
      shapes += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#1a1c1d" opacity="0.7"/>`;
    } else if (el.type === "freeLine") {
      const x1 = offX + el.x1 * sc, y1 = offY + el.y1 * sc;
      const x2 = offX + el.x2 * sc, y2 = offY + el.y2 * sc;
      shapes += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#031631" stroke-width="1.5"/>`;
    } else if (el.type === "anta" || el.type === "apertura") {
      const x = offX + el.x * sc, y = offY + el.y * sc;
      const w = el.w * sc, h = el.h * sc;
      shapes += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#dbeafe" stroke="#3b7fe0" stroke-width="1" rx="1"/>`;
      shapes += `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x+w).toFixed(1)}" y2="${(y+h/2).toFixed(1)}" stroke="#3b7fe090" stroke-width="0.5"/>`;
      shapes += `<line x1="${x.toFixed(1)}" y1="${(y+h).toFixed(1)}" x2="${(x+w).toFixed(1)}" y2="${(y+h/2).toFixed(1)}" stroke="#3b7fe090" stroke-width="0.5"/>`;
    } else if (el.type === "dim") {
      const x1 = offX + el.x1 * sc, y1 = offY + el.y1 * sc;
      const x2 = offX + el.x2 * sc, y2 = offY + el.y2 * sc;
      shapes += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#1a9e73" stroke-width="0.8" stroke-dasharray="2,2"/>`;
      if (el.label) {
        const mx = ((x1+x2)/2).toFixed(1), my = ((y1+y2)/2 - 4).toFixed(1);
        shapes += `<text x="${mx}" y="${my}" text-anchor="middle" font-size="9" fill="#085041" font-family="monospace" font-weight="bold">${el.label}</text>`;
      }
    } else if (el.type === "label") {
      const x = offX + el.x * sc, y = offY + el.y * sc;
      shapes += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="10" fill="#1a1c1d" font-family="monospace">${el.text || ""}</text>`;
    }
  }

  // Sfondo e bordo
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#f9f9fb" rx="4"/>
  <rect width="${W}" height="${H}" fill="none" stroke="#c5c6ce" stroke-width="0.5" rx="4"/>
  ${shapes}
  <text x="${W/2}" y="${H-6}" text-anchor="middle" font-size="8" fill="#75777e" font-family="monospace">${realW}×${realH}mm</text>
</svg>`;
}

// ─── PAGINA VANO ─────────────────────────────────────────────
function paginaVano(doc: jsPDF, vano: FascicoloSnapshot["vani"][0], idx: number, snap: FascicoloSnapshot, pageNum: number, totalPages: number, disegnoImg?: string | null) {
  const m = vano.misure || {};
  const lmm = m.lCentro || m.lAlto || 0;
  const hmm = m.hCentro || m.hSx || 0;
  const lBasso = m.lBasso || lmm;
  const lAlto = m.lAlto || lmm;
  const hDx = m.hDx || hmm;
  const hSx = m.hSx || hmm;
  const d1 = m.d1 || 0;
  const d2 = m.d2 || 0;
  const mq = (lmm * hmm) / 1000000;
  const stato = statoLabel(vano.statoMisure || "provvisorie");
  const acc = vano.accessori || {};

  pageHeader(doc, snap, `Vano ${idx + 1} di ${snap.vani.length}`);

  let cy = 18;

  // ── INTESTAZIONE VANO ────────────────────────────────────
  // Badge numero vano
  f(doc, C.teal);
  doc.roundedRect(ML, cy, 10, 10, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  t(doc, C.white);
  doc.text(String(idx + 1), ML + 5, cy + 7, { align: "center" });

  // Nome vano
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  t(doc, C.text);
  doc.text(vano.nome || `Vano ${idx + 1}`, ML + 14, cy + 7);

  // Badge stato
  f(doc, stato.color);
  doc.roundedRect(PW - MR - 28, cy + 1, 26, 8, 2, 2, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  t(doc, C.white);
  doc.text(stato.label, PW - MR - 15, cy + 6.5, { align: "center" });

  cy += 14;

  // ── GRIGLIA INFO + MISURE ─────────────────────────────────
  const tableW = PW - ML - MR;
  const col1 = tableW * 0.5;

  // Blocco sinistra — specifiche
  const specsRows = [
    ["Tipologia",     tipoLabel(vano.tipo || "")],
    ["Piano / Stanza", `${vano.piano || "—"} / ${vano.stanza || "—"}`],
    ["Pezzi",         String(vano.pezzi || 1)],
    ["Sistema",       vano.sistema || "—"],
    ["Vetro",         vano.vetro || "—"],
    ["Colore",        vano.colore || "—"],
    ["Controtelaio",  vano.controtelaio || "—"],
    ["Soglia",        vano.soglia || "—"],
    ["Davanzale",     vano.davanzale || "—"],
  ];

  const rowH = 6.5;
  specsRows.forEach((row, ri) => {
    f(doc, ri % 2 === 0 ? C.lightbg : C.white);
    r(doc, C.bdr);
    doc.setLineWidth(0.1);
    doc.rect(ML, cy + ri * rowH, col1, rowH, "FD");
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    t(doc, C.sub);
    doc.text(row[0], ML + 2, cy + ri * rowH + rowH - 1.5);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    t(doc, C.text);
    doc.text(row[1], ML + 30, cy + ri * rowH + rowH - 1.5);
  });

  // Blocco destra — misure
  const mx = ML + col1 + 4;
  const mw = tableW - col1 - 4;

  f(doc, C.teal);
  doc.roundedRect(mx, cy, mw, 8, 1, 1, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  t(doc, C.white);
  doc.text("MISURE (mm)", mx + mw / 2, cy + 5.5, { align: "center" });

  const misRows = [
    ["Larghezza Alto",    lAlto],
    ["Larghezza Centro",  lmm],
    ["Larghezza Basso",   lBasso],
    ["Altezza Sinistra",  hSx],
    ["Altezza Centro",    hmm],
    ["Altezza Destra",    hDx],
    ["Diagonale 1 ↗",    d1],
    ["Diagonale 2 ↘",    d2],
  ];

  misRows.forEach((row, ri) => {
    const hasVal = (row[1] as number) > 0;
    f(doc, ri % 2 === 0 ? C.lightbg : C.white);
    r(doc, C.bdr);
    doc.setLineWidth(0.1);
    doc.rect(mx, cy + 8 + ri * rowH, mw, rowH, "FD");
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    t(doc, C.sub);
    doc.text(row[0] as string, mx + 2, cy + 8 + ri * rowH + rowH - 1.5);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    t(doc, hasVal ? C.teal : C.sub);
    doc.text(hasVal ? String(row[1]) : "—", mx + mw - 3, cy + 8 + ri * rowH + rowH - 1.5, { align: "right" });
  });

  // mq e fuori squadra
  const fSq = d1 > 0 && d2 > 0 ? Math.abs(d1 - d2) : null;
  const mqRy = cy + 8 + misRows.length * rowH + 2;

  f(doc, `${C.teal[0]},${C.teal[1]},${C.teal[2]}` as any);
  f(doc, C.teal);
  doc.roundedRect(mx, mqRy, mw, 8, 1, 1, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  t(doc, C.white);
  doc.text(`${mq.toFixed(3)} m²`, mx + mw / 2, mqRy + 5.5, { align: "center" });

  if (fSq !== null) {
    const fsColor = fSq > 3 ? C.red : C.green;
    f(doc, fsColor);
    doc.roundedRect(mx, mqRy + 10, mw, 7, 1, 1, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica", "bold");
    t(doc, C.white);
    doc.text(fSq > 3 ? `⚠ Fuori squadra: ${fSq}mm` : `✓ In squadra: ${fSq}mm`, mx + mw / 2, mqRy + 15, { align: "center" });
  }

  cy += specsRows.length * rowH + 12;

  // ── ACCESSORI ────────────────────────────────────────────
  const accItems: string[] = [];
  if (acc.tapparella?.attivo) accItems.push(`Tapparella ${acc.tapparella.tipo || ""} ${acc.tapparella.motorizzata ? "motorizzata" : ""}`.trim());
  if (acc.persiana?.attivo) accItems.push(`Persiana ${acc.persiana.tipo || ""}`.trim());
  if (acc.zanzariera?.attivo) accItems.push(`Zanzariera ${acc.zanzariera.tipo || ""}`.trim());

  if (accItems.length > 0) {
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    t(doc, C.text);
    doc.text("ACCESSORI", ML, cy);
    cy += 3;
    accItems.forEach((a, ai) => {
      f(doc, ai % 2 === 0 ? C.lightbg : C.white);
      r(doc, C.bdr);
      doc.setLineWidth(0.1);
      doc.rect(ML, cy, tableW, 6, "FD");
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      t(doc, C.text);
      doc.text(`• ${a}`, ML + 3, cy + 4.5);
      cy += 6;
    });
    cy += 4;
  }

  // ── DISEGNO CAD VANO ─────────────────────────────────────
  if (disegnoImg) {
    // Calcola altezza proporzionale al disegno (360x270 → scala per larghezza A4)
    const imgW = tableW;
    const imgH = imgW * (270 / 360);
    // Controlla se c'è spazio sulla pagina corrente
    if (cy + imgH + 8 > PH - 20) {
      doc.addPage();
      pageHeader(doc, snap, `Vano ${idx + 1} — Disegno`);
      cy = 22;
    }
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    t(doc, C.text);
    doc.text("DISEGNO TECNICO", ML, cy);
    cy += 3;
    try {
      doc.addImage(disegnoImg, "PNG", ML, cy, imgW, imgH);
      cy += imgH + 6;
    } catch {}
  }

  // ── PDF FORNITORE ────────────────────────────────────────
  if (vano.pdfFornitoreNome) {
    f(doc, [230, 240, 255]);
    r(doc, [100, 150, 220]);
    doc.setLineWidth(0.3);
    doc.roundedRect(ML, cy, tableW, 8, 1, 1, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    t(doc, C.blue);
    doc.text(`📐 PDF Tecnico Fornitore: ${vano.pdfFornitoreNome}`, ML + 3, cy + 5.5);
    cy += 12;
  }

  // ── NOTE ─────────────────────────────────────────────────
  if (vano.note) {
    f(doc, [255, 248, 225]);
    r(doc, [220, 160, 0]);
    doc.setLineWidth(0.3);
    doc.roundedRect(ML, cy, tableW, 10, 1, 1, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    t(doc, [120, 80, 0]);
    doc.text("⚠ NOTE:", ML + 3, cy + 4);
    doc.setFont("helvetica", "normal");
    doc.text(vano.note.substring(0, 90), ML + 18, cy + 4);
    cy += 14;
  }

  // ── PREZZO VANO ─────────────────────────────────────────
  if (vano.prezzoTotale && vano.prezzoTotale > 0) {
    const pw2 = tableW;
    f(doc, C.lightbg);
    r(doc, C.bdr);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, cy, pw2, 10, 1, 1, "FD");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    t(doc, C.sub);
    doc.text(`Prezzo unitario: €${fmt(vano.prezzoUnitario || 0)}  ×  ${vano.pezzi || 1} pz`, ML + 3, cy + 6.5);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    t(doc, C.amber);
    doc.text(`€ ${fmt(vano.prezzoTotale)}`, PW - MR - 3, cy + 6.5, { align: "right" });
    cy += 14;
  }

  footer(doc, snap, pageNum, totalPages);
}

// ─── PAGINA RIEPILOGO FINALE ──────────────────────────────────
function paginaRiepilogo(doc: jsPDF, snap: FascicoloSnapshot, pageNum: number, totalPages: number) {
  pageHeader(doc, snap, "Riepilogo e Firma");

  let cy = 22;
  const tableW = PW - ML - MR;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  t(doc, C.text);
  doc.text("RIEPILOGO COMMESSA", ML, cy);
  cy += 8;

  // Tabella vani riepilogo
  const cols = [30, 30, 28, 28, tableW - 116];
  const headers = ["Vano", "Tipologia", "Misure", "Pezzi", "Note"];
  const rowH = 7;

  // Header tabella
  f(doc, C.topbar);
  doc.rect(ML, cy, tableW, rowH, "F");
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  t(doc, C.white);
  let cx = ML;
  headers.forEach((h, hi) => {
    doc.text(h, cx + 2, cy + 5);
    cx += cols[hi];
  });
  cy += rowH;

  snap.vani.forEach((v, vi) => {
    const m = v.misure || {};
    const lmm = m.lCentro || m.lAlto || 0;
    const hmm = m.hCentro || m.hSx || 0;
    const stato = statoLabel(v.statoMisure || "provvisorie");

    f(doc, vi % 2 === 0 ? C.lightbg : C.white);
    r(doc, C.bdr);
    doc.setLineWidth(0.1);
    doc.rect(ML, cy, tableW, rowH, "FD");

    const cells = [
      v.nome || `Vano ${vi + 1}`,
      tipoLabel(v.tipo || ""),
      `${lmm}×${hmm}`,
      String(v.pezzi || 1),
      v.note?.substring(0, 30) || "—",
    ];

    cx = ML;
    cells.forEach((cell, ci) => {
      doc.setFontSize(6.5);
      doc.setFont("helvetica", ci === 0 ? "bold" : "normal");
      t(doc, C.text);
      doc.text(cell, cx + 2, cy + 5);
      if (ci < cells.length - 1) {
        r(doc, C.bdr);
        doc.setLineWidth(0.1);
        doc.line(cx + cols[ci], cy, cx + cols[ci], cy + rowH);
      }
      cx += cols[ci];
    });

    // Badge stato inline
    f(doc, stato.color);
    doc.roundedRect(ML + cols[0] - 1, cy + 1.5, cols[0] - 2, rowH - 3, 1, 1, "F");
    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    t(doc, C.white);

    cy += rowH;
  });

  cy += 8;

  // Totali
  const totRows = [
    ["Imponibile", `€ ${fmt(snap.totali.imponibile)}`],
    ["IVA", `€ ${fmt(snap.totali.iva)}`],
    ["Totale", `€ ${fmt(snap.totali.totale)}`],
  ];
  totRows.forEach((row, ri) => {
    const isLast = ri === totRows.length - 1;
    f(doc, isLast ? C.teal : C.lightbg);
    r(doc, isLast ? C.teal : C.bdr);
    doc.setLineWidth(isLast ? 0.5 : 0.15);
    doc.rect(PW - MR - 80, cy, 80, 8, isLast ? "FD" : "FD");
    doc.setFontSize(isLast ? 9 : 7.5);
    doc.setFont("helvetica", isLast ? "bold" : "normal");
    t(doc, isLast ? C.white : C.text);
    doc.text(row[0], PW - MR - 77, cy + 5.5);
    doc.text(row[1], PW - MR - 3, cy + 5.5, { align: "right" });
    cy += 9;
  });

  cy += 16;

  // ── FIRMA CLIENTE ────────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  t(doc, C.text);
  doc.text("ACCETTAZIONE E FIRMA", ML, cy);
  cy += 5;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  t(doc, C.sub);
  const disclaimerLines = [
    "Il sottoscritto, presa visione del presente fascicolo tecnico, dichiara di aver verificato",
    "le misure, le tipologie e le specifiche tecniche riportate per ciascun vano e di accettarle.",
  ];
  disclaimerLines.forEach((l, li) => {
    doc.text(l, ML, cy + li * 6);
  });
  cy += 16;

  // Box firme
  const boxW = (tableW - 8) / 2;
  [
    { label: "Firma del Cliente", note: snap.commessa.cliente || "" },
    { label: "Firma Responsabile", note: snap.azienda.ragione || "" },
  ].forEach((box, bi) => {
    const bx = ML + bi * (boxW + 8);
    r(doc, C.bdr);
    doc.setLineWidth(0.3);
    doc.rect(bx, cy, boxW, 28, "S");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    t(doc, C.sub);
    doc.text(box.label, bx + 3, cy + 5);
    doc.setFont("helvetica", "normal");
    doc.text(box.note, bx + 3, cy + 24);
    doc.text("Data: _______________", bx + boxW - 3, cy + 24, { align: "right" });
  });

  cy += 36;

  // ── NOTE COMMESSA ────────────────────────────────────────
  if (snap.commessa.note) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    t(doc, C.text);
    doc.text("NOTE GENERALI", ML, cy);
    cy += 4;
    f(doc, [255, 248, 225]);
    r(doc, [220, 160, 0]);
    doc.setLineWidth(0.3);
    doc.roundedRect(ML, cy, tableW, 14, 1, 1, "FD");
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    t(doc, [100, 80, 0]);
    doc.text(snap.commessa.note.substring(0, 120), ML + 3, cy + 8);
  }

  footer(doc, snap, pageNum, totalPages);
}

// ─── MAIN EXPORT ─────────────────────────────────────────────
export async function generaFascicoloGeometraPDF(snap: FascicoloSnapshot): Promise<void> {
  const totalPages = 2 + snap.vani.length;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Pre-genera le immagini SVG per ogni vano
  const disegniImg: (string | null)[] = await Promise.all(
    snap.vani.map(async (v) => {
      if (v.cadData?.elements?.length) {
        const lmm = v.misure?.lCentro || v.misure?.lAlto || 1200;
        const hmm = v.misure?.hCentro || v.misure?.hSx || 1400;
        const svgStr = buildVanoSvg(v.cadData, lmm, hmm);
        if (svgStr) return await svgToPngDataUrl(svgStr, 360, 270);
      }
      return null;
    })
  );

  paginaCopertina(doc, snap);

  snap.vani.forEach((v, i) => {
    doc.addPage();
    paginaVano(doc, v, i, snap, i + 2, totalPages, disegniImg[i]);
  });

  doc.addPage();
  paginaRiepilogo(doc, snap, totalPages, totalPages);

  const clienteStr = [snap.commessa.cliente, snap.commessa.cognome]
    .filter(Boolean).join("_").replace(/\s+/g, "_") || "Cliente";
  const code = (snap.commessa.code || snap.commessa.id || "CM").replace(/\s+/g, "_");
  doc.save(`fascicolo_geometra_${code}_${clienteStr}.pdf`);
}

// Export per uso nella pagina pubblica (ritorna blob)
export async function generaFascicoloBlob(snap: FascicoloSnapshot): Promise<Blob> {
  const totalPages = 2 + snap.vani.length;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const disegniImg: (string | null)[] = await Promise.all(
    snap.vani.map(async (v) => {
      if (v.cadData?.elements?.length) {
        const lmm = v.misure?.lCentro || v.misure?.lAlto || 1200;
        const hmm = v.misure?.hCentro || v.misure?.hSx || 1400;
        const svgStr = buildVanoSvg(v.cadData, lmm, hmm);
        if (svgStr) return await svgToPngDataUrl(svgStr, 360, 270);
      }
      return null;
    })
  );
  paginaCopertina(doc, snap);
  snap.vani.forEach((v, i) => {
    doc.addPage();
    paginaVano(doc, v, i, snap, i + 2, totalPages, disegniImg[i]);
  });
  doc.addPage();
  paginaRiepilogo(doc, snap, totalPages, totalPages);
  return doc.output("blob");
}
