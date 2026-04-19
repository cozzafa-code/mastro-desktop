// =====================================================================
// MASTRO ERP - lib/pdf-misure.ts
// PDF Scheda Misure per produzione/fornitore
// Campi reali: lAlto/lCentro/lBasso, hSx/hCentro/hDx, d1/d2,
//              spSx/spDx, arch, davInt/davEst, casL/casH/casP
// =====================================================================
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const C = {
  dark:  [26,  26,  28]  as [number,number,number],
  amber: [208, 128,  8]  as [number,number,number],
  green: [26,  158, 115] as [number,number,number],
  sub:   [134, 134, 139] as [number,number,number],
  bg:    [242, 241, 236] as [number,number,number],
  white: [255, 255, 255] as [number,number,number],
  blue:  [59,  127, 224] as [number,number,number],
  line:  [220, 220, 220] as [number,number,number],
};

function cl(s) {
  if (!s) return "";
  return String(s).replace(/[^\x20-\x7E\xA0-\xFF]/g, "").replace(/\s+/g, " ").trim();
}

function drawHeader(doc, az) {
  const W = doc.internal.pageSize.width;
  doc.setFillColor(...C.dark);
  doc.rect(0, 0, W, 22, "F");
  doc.setFillColor(...C.blue);
  doc.roundedRect(8, 4, 14, 14, 2, 2, "F");
  doc.setTextColor(...C.dark);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("M", 15, 13.5, { align: "center" });
  doc.setTextColor(...C.white);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(cl(az.ragione || az.nome) || "MASTRO ERP", 26, 10);
  if (az.telefono || az.email) {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text([cl(az.telefono), cl(az.email)].filter(Boolean).join("  |  "), 26, 16);
  }
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.blue);
  doc.text("SCHEDA MISURE", W - 10, 14, { align: "right" });
  doc.setTextColor(...C.dark);
}

function drawVanoSchema(doc, v, x, y, w, h) {
  const m = v.misure || {};
  const lC = m.lCentro || 0;
  const hC = m.hCentro || 0;
  const lA = m.lAlto || lC;
  const lB = m.lBasso || lC;
  const hSx = m.hSx || hC;
  const hDx = m.hDx || hC;
  const maxL = Math.max(lA, lC, lB, 100);
  const maxH = Math.max(hSx, hC, hDx, 100);
  const scale = Math.min((w - 20) / maxL, (h - 16) / maxH);
  const dw = maxL * scale;
  const dh = maxH * scale;
  const ox = x + (w - dw) / 2;
  const oy = y + 4;
  const midL = lC * scale;
  const midOx = ox + (dw - midL) / 2;
  const leftH = hSx * scale;
  doc.setDrawColor(...C.dark);
  doc.setLineWidth(0.6);
  doc.setFillColor(230, 240, 255);
  doc.rect(midOx, oy, midL, leftH, "FD");
  doc.setDrawColor(...C.blue);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(midOx + midL / 2, oy + 2, midOx + midL / 2, oy + leftH - 2);
  doc.line(midOx + 2, oy + leftH / 2, midOx + midL - 2, oy + leftH / 2);
  doc.setLineDashPattern([], 0);
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "bold");
  if (lC > 0) { doc.setTextColor(...C.blue); doc.text("L:" + lC, midOx + midL / 2, oy - 1.5, { align: "center" }); }
  if (hC > 0) { doc.setTextColor(...C.green); doc.text("H:" + hC, midOx - 1, oy + leftH / 2, { align: "right" }); }
  if (m.d1 > 0 || m.d2 > 0) {
    doc.setTextColor(...C.amber);
    const ds = [m.d1 ? "D1:" + m.d1 : "", m.d2 ? "D2:" + m.d2 : ""].filter(Boolean).join(" ");
    doc.text(ds, midOx + midL / 2, oy + leftH + 3, { align: "center" });
  }
  doc.setTextColor(...C.dark);
}

export function generaPDFMisure(c, ctx) {
  const { aziendaInfo, getVaniAttivi } = ctx;
  const az = aziendaInfo || {};
  const vani = getVaniAttivi(c);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.width;
  const H = doc.internal.pageSize.height;
  drawHeader(doc, az);
  let y = 27;
  doc.setFillColor(...C.bg);
  doc.rect(8, y, W - 16, 14, "F");
  const infoItems = [
    ["COMMESSA", cl(c.code) || "-"],
    ["CLIENTE", [cl(c.cliente), cl(c.cognome)].filter(Boolean).join(" ") || "-"],
    ["INDIRIZZO", cl(c.indirizzo) || "-"],
    ["SISTEMA", cl(c.sistema) || "-"],
    ["DATA", new Date().toLocaleDateString("it-IT")],
  ];
  const colW = (W - 16) / infoItems.length;
  infoItems.forEach(([k, v], i) => {
    const cx = 10 + i * colW;
    doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.sub); doc.text(k, cx, y + 5);
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark); doc.text(cl(v), cx, y + 11);
  });
  y += 18;
  if (vani.length === 0) {
    doc.setFontSize(11); doc.setTextColor(...C.sub);
    doc.text("Nessun vano attivo.", W / 2, 110, { align: "center" });
    doc.save("misure_" + (c.code || c.id) + ".pdf");
    return;
  }
  const head = [[
    "#", "Vano", "Tipo", "Piano",
    "L Alto", "L Cen.", "L Basso",
    "H Sx", "H Cen.", "H Dx",
    "D1", "D2", "Sp.Sx", "Sp.Dx", "Arch.",
    "Dav.Int", "Dav.Est", "Cas.LxH",
    "Sistema / Colore", "Vetro", "Pz", "Acc.", "Note",
  ]];
  const rows = vani.map((v, i) => {
    const m = v.misure || {};
    const acc = v.accessori || {};
    const accStr = [acc.tapparella?.attivo ? "Tapp" : "", acc.persiana?.attivo ? "Pers" : "", acc.zanzariera?.attivo ? "Zanz" : ""].filter(Boolean).join(" ");
    const sistemaStr = [cl(v.sistema), cl(v.coloreEst || v.coloreInt)].filter(Boolean).join(" / ");
    const casStr = v.cassonetto ? (m.casL || "-") + "x" + (m.casH || "-") : "-";
    return [
      String(i + 1), cl(v.nome || ("V" + (i + 1))), cl(v.tipo || "-"), cl(v.piano || "-"),
      m.lAlto   ? String(m.lAlto)   : "-",
      m.lCentro ? String(m.lCentro) : "-",
      m.lBasso  ? String(m.lBasso)  : "-",
      m.hSx     ? String(m.hSx)     : "-",
      m.hCentro ? String(m.hCentro) : "-",
      m.hDx     ? String(m.hDx)     : "-",
      m.d1      ? String(m.d1)      : "-",
      m.d2      ? String(m.d2)      : "-",
      m.spSx    ? String(m.spSx)    : "-",
      m.spDx    ? String(m.spDx)    : "-",
      m.arch    ? String(m.arch)    : "-",
      m.davInt  ? String(m.davInt)  : "-",
      m.davEst  ? String(m.davEst)  : "-",
      casStr,
      sistemaStr || "-", cl(v.vetro || "-"), String(v.pezzi || 1), accStr || "-", cl(v.note || ""),
    ];
  });
  autoTable(doc, {
    startY: y, head, body: rows, theme: "striped",
    styles: { fontSize: 7, cellPadding: 1.8, textColor: C.dark, font: "helvetica", overflow: "ellipsize" },
    headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: "bold", fontSize: 6.5, halign: "center" },
    columnStyles: {
      0: { cellWidth: 5, halign: "center" }, 1: { cellWidth: 18 }, 2: { cellWidth: 10 }, 3: { cellWidth: 8, halign: "center" },
      4: { cellWidth: 9, halign: "center" }, 5: { cellWidth: 10, halign: "center" }, 6: { cellWidth: 9, halign: "center" },
      7: { cellWidth: 9, halign: "center" }, 8: { cellWidth: 10, halign: "center" }, 9: { cellWidth: 9, halign: "center" },
      10: { cellWidth: 8, halign: "center" }, 11: { cellWidth: 8, halign: "center" },
      12: { cellWidth: 8, halign: "center" }, 13: { cellWidth: 8, halign: "center" }, 14: { cellWidth: 8, halign: "center" },
      15: { cellWidth: 9, halign: "center" }, 16: { cellWidth: 9, halign: "center" }, 17: { cellWidth: 11, halign: "center" },
      18: { cellWidth: 22 }, 19: { cellWidth: 14 }, 20: { cellWidth: 5, halign: "center" }, 21: { cellWidth: 12 },
    },
    alternateRowStyles: { fillColor: [248, 248, 250] },
  });
  const tableEndY = doc.lastAutoTable.finalY;
  const spazio = H - tableEndY - 14;
  if (spazio >= 32 && vani.length <= 8) {
    const nPerRiga = Math.min(vani.length, Math.floor((W - 16) / 34));
    const sw = Math.min(34, (W - 16) / nPerRiga);
    const sh = Math.min(spazio - 10, sw * 1.3);
    const sx0 = 8;
    const sy0 = tableEndY + 5;
    doc.setFontSize(6); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.sub);
    doc.text("SCHEMI VANI (mm)", sx0, sy0 - 1);
    vani.slice(0, nPerRiga).forEach((v, i) => {
      drawVanoSchema(doc, v, sx0 + i * sw, sy0 + 1, sw - 2, sh);
      doc.setFontSize(5); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.sub);
      doc.text(cl(v.nome || ("V" + (i + 1))).slice(0, 10), sx0 + i * sw + (sw - 2) / 2, sy0 + sh + 4, { align: "center" });
    });
  }
  const footY = H - 8;
  const totalePezzi = vani.reduce((s, v) => s + (v.pezzi || 1), 0);
  doc.setFillColor(...C.bg); doc.rect(0, footY - 4, W, 12, "F");
  doc.setFontSize(7.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...C.dark);
  doc.text("Totale vani: " + vani.length + "   Totale pezzi: " + totalePezzi, 10, footY + 2);
  doc.setFillColor(...C.white); doc.roundedRect(W - 85, footY - 3, 75, 10, 2, 2, "FD");
  doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...C.sub);
  doc.text("Verificato / Firma:", W - 83, footY + 1);
  doc.setDrawColor(...C.sub); doc.setLineWidth(0.3); doc.line(W - 55, footY + 6, W - 12, footY + 6);
  doc.setFontSize(6); doc.setTextColor(...C.sub);
  doc.text("MASTRO ERP  |  " + new Date().toLocaleString("it-IT"), W / 2, footY + 8, { align: "center" });
  doc.save("misure_" + cl(c.code || c.id) + "_" + (cl(c.cliente) || "cliente").replace(/\s/g, "_") + ".pdf");
}