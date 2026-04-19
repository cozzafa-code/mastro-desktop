// ===================================================================
// MASTRO ERP - lib/pdf-preventivo.ts
// Genera PDF preventivo professionale con jsPDF
// v2 - Logo azienda, firma digitale, layout migliorato
// ===================================================================
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DARK:  [number,number,number] = [26,  26,  28];
const AMBER: [number,number,number] = [208, 128,  8];
const GREEN: [number,number,number] = [26,  158, 115];
const SUB:   [number,number,number] = [120, 120, 125];
const LINE:  [number,number,number] = [220, 220, 220];
const BG:    [number,number,number] = [245, 244, 240];
const WHITE: [number,number,number] = [255, 255, 255];
const AMBER_LIGHT: [number,number,number] = [252, 243, 224];

function fmt(n: number): string {
  if (isNaN(n) || n === null || n === undefined) return "0,00";
  return n.toFixed(2).replace(".", ",");
}

function clean(s: any): string {
  if (!s) return "";
  return String(s)
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Carica immagine da URL/base64 come promise
async function loadImage(src: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith("data:")) return src;
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

// ── Header con logo reale ──
async function drawHeader(doc: jsPDF, az: any): Promise<void> {
  const W = doc.internal.pageSize.width;

  // Barra superiore scura
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 24, "F");

  // Prova a caricare logo azienda
  const logoSrc = az.logoUrl || az.logo || null;
  let logoOk = false;
  if (logoSrc) {
    try {
      const logoData = await loadImage(logoSrc);
      if (logoData) {
        doc.addImage(logoData, 9, 3, 18, 18);
        logoOk = true;
      }
    } catch {}
  }

  if (!logoOk) {
    // Fallback: quadrato amber con iniziale
    doc.setFillColor(...AMBER);
    doc.roundedRect(9, 4, 16, 16, 2, 2, "F");
    doc.setTextColor(...DARK);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    const initial = clean(az.nome || az.ragione || "M").charAt(0).toUpperCase();
    doc.text(initial, 17, 14, { align: "center" });
  }

  // Nome azienda
  doc.setTextColor(...WHITE);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const nomeAz = clean(az.ragione || az.nome || "MASTRO ERP");
  doc.text(nomeAz, 30, 11);

  // Sottotitolo azienda
  const parts: string[] = [];
  if (az.indirizzo) parts.push(clean(az.indirizzo));
  if (az.piva) parts.push("P.IVA " + clean(az.piva));
  if (az.telefono) parts.push(clean(az.telefono));
  const sub = parts.join("  |  ");
  if (sub) {
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 185);
    doc.text(sub, 30, 18);
  }

  // Label PREVENTIVO destra
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...AMBER);
  doc.text("PREVENTIVO", W - 10, 16, { align: "right" });

  doc.setTextColor(...DARK);
}

// ── Sezione cliente + info preventivo ──
function drawClienteInfo(doc: jsPDF, az: any, c: any, y: number): number {
  const W = doc.internal.pageSize.width;
  const colW = (W - 28) / 2;
  const col1 = 12, col2 = 12 + colW + 4;
  const boxH = 42;

  // Box cliente
  doc.setFillColor(...BG);
  doc.roundedRect(col1, y, colW, boxH, 3, 3, "F");
  doc.setFillColor(...AMBER);
  doc.roundedRect(col1, y, colW, 7, 3, 3, "F");
  doc.rect(col1, y + 4, colW, 3, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("CLIENTE", col1 + 4, y + 5);

  const nomeCliente = [clean(c.cliente), clean(c.cognome)].filter(Boolean).join(" ");
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text(nomeCliente || "—", col1 + 4, y + 15);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SUB);
  let cy = y + 22;
  if (c.indirizzo) { doc.text(clean(c.indirizzo), col1 + 4, cy); cy += 5.5; }
  if (c.telefono)  { doc.text("Tel: " + clean(c.telefono), col1 + 4, cy); cy += 5.5; }
  if (c.email)     { doc.text(clean(c.email), col1 + 4, cy); }

  // Box info preventivo
  doc.setFillColor(...BG);
  doc.roundedRect(col2, y, colW, boxH, 3, 3, "F");
  doc.setFillColor(...DARK);
  doc.roundedRect(col2, y, colW, 7, 3, 3, "F");
  doc.rect(col2, y + 4, colW, 3, "F");

  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("DATI PREVENTIVO", col2 + 4, y + 5);

  const rows = [
    ["N.", clean(c.code) || "—"],
    ["Data", new Date().toLocaleDateString("it-IT")],
    ["Validita'", "30 giorni"],
    ["Pagamento", clean(c.condPagamento || c.pagamento) || "Da concordare"],
    ["IVA", (c.ivaPerc || 10) + "%"],
  ];
  doc.setFontSize(8);
  rows.forEach(([k, v], i) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(k, col2 + 4, y + 15 + i * 5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SUB);
    doc.text(v, col2 + 32, y + 15 + i * 5.5);
  });

  // Cantiere/indirizzo lavori
  if (c.indirizzoLavori || c.cantiere) {
    doc.setFontSize(7.5);
    doc.setFillColor(...AMBER_LIGHT);
    doc.roundedRect(12, y + boxH + 2, W - 24, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...AMBER);
    doc.text("CANTIERE:", 16, y + boxH + 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(clean(c.indirizzoLavori || c.cantiere), 40, y + boxH + 8);
    return y + boxH + 18;
  }

  doc.setTextColor(...DARK);
  return y + boxH + 10;
}

function drawLine(doc: jsPDF, y: number): void {
  const W = doc.internal.pageSize.width;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(12, y, W - 12, y);
}

function drawFooter(doc: jsPDF, az: any): void {
  const pageCount = (doc.internal as any).getNumberOfPages();
  const W = doc.internal.pageSize.width;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pH = doc.internal.pageSize.height;
    doc.setFillColor(...DARK);
    doc.rect(0, pH - 12, W, 12, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(160, 160, 165);
    const footParts: string[] = [];
    if (az.telefono) footParts.push(clean(az.telefono));
    if (az.email) footParts.push(clean(az.email));
    if (az.sito || az.website) footParts.push(clean(az.sito || az.website));
    if (footParts.length) doc.text(footParts.join("  |  "), 12, pH - 4);
    doc.setTextColor(...AMBER);
    doc.text("Pag. " + i + " / " + pageCount, W - 12, pH - 4, { align: "right" });
  }
}

// ===================================================================
// FUNZIONE PRINCIPALE
// ===================================================================
export async function generaPreventivoPDF(c: any, ctx: any): Promise<void> {
  const { sistemiDB, vetriDB, coprifiliDB, lamiereDB, aziendaInfo, aziendaDB, getVaniAttivi } = ctx;
  const az = aziendaDB || aziendaInfo || {};

  const calcolaVano = (v: any): { prezzoBase: number; accessoriCat: number; posa: number; totUnitario: number; totaleVano: number } => {
    const pezzi = v.pezzi || 1;
    if (ctx.calcolaVanoPrezzo) {
      const tot = ctx.calcolaVanoPrezzo(v, c);
      const acc = v.accessori || {};
      const m = v.misure || {};
      const lmm = m.lCentro || 0, hmm = m.hCentro || 0;
      const pTapp = parseFloat(az.prezzoTapparella || c.prezzoTapparella || 0);
      const pZanz = parseFloat(az.prezzoZanzariera || c.prezzoZanzariera || 0);
      let accFisici = 0;
      if (acc.tapparella?.attivo && pTapp > 0) accFisici += Math.round(((acc.tapparella.l||lmm)/1000)*((acc.tapparella.h||hmm)/1000)*pTapp*100)/100;
      if (acc.zanzariera?.attivo && pZanz > 0) accFisici += Math.round(((acc.zanzariera.l||lmm)/1000)*((acc.zanzariera.h||hmm)/1000)*pZanz*100)/100;
      const accCat = (v.accessoriCatalogo||[]).reduce((s:number,a:any)=>s+(parseFloat(a.prezzoUnitario)||0)*(a.quantita||1),0);
      const posa = v.prevPosaPrezzo || (parseFloat(az.prezzoPosaVano||0)>0&&az.includePosaInPreventivo?parseFloat(az.prezzoPosaVano):0);
      return { prezzoBase: tot, accessoriCat: accCat, posa, totUnitario: tot+accFisici, totaleVano: (tot+accFisici)*pezzi+accCat+posa };
    }
    const m = v.misure || {};
    const lc = (m.lCentro || 0) / 1000;
    const hc = (m.hCentro || 0) / 1000;
    const lmm = m.lCentro || 0;
    const hmm = m.hCentro || 0;
    const mq = lc * hc;
    const perim = 2 * (lc + hc);
    if (v.prevPrezzoOverride !== undefined && v.prevPrezzoOverride !== null) {
      const base = v.prevPrezzoOverride;
      const accCat = (v.accessoriCatalogo || []).reduce((s: number, a: any) => s + (parseFloat(a.prezzoUnitario) || 0) * (a.quantita || 1), 0);
      const posa = v.prevPosaPrezzo || 0;
      return { prezzoBase: base, accessoriCat: accCat, posa, totUnitario: base + accCat / pezzi, totaleVano: base * pezzi + accCat + posa };
    }
    if (["porte","boxdoccia","cancelli","zanzariere","tendesole"].includes(v.settore)) {
      const base = v.prezzoManuale || 0;
      return { prezzoBase: base, accessoriCat: 0, posa: 0, totUnitario: base, totaleVano: base * pezzi };
    }
    const sysRec = sistemiDB?.find((s: any) => (s.marca + " " + s.sistema) === v.sistema || s.sistema === v.sistema);
    const gridPrice = sysRec?.griglia?.length > 0
      ? (sysRec.griglia.find((p: any) => p.l >= lmm && p.h >= hmm)?.prezzo ?? sysRec.griglia[sysRec.griglia.length - 1]?.prezzo ?? null)
      : null;
    let infisso = gridPrice !== null ? gridPrice : mq * parseFloat(sysRec?.prezzoMq || sysRec?.euroMq || c.prezzoMq || 350);
    const vetroRec = vetriDB?.find((g: any) => g.code === v.vetro || g.nome === v.vetro);
    if (vetroRec?.prezzoMq) infisso += mq * parseFloat(vetroRec.prezzoMq);
    const copRec = coprifiliDB?.find((cp: any) => cp.cod === v.coprifilo);
    if (copRec?.prezzoMl) infisso += perim * parseFloat(copRec.prezzoMl);
    const lamRec = lamiereDB?.find((l: any) => l.cod === v.lamiera);
    if (lamRec?.prezzoMl) infisso += lc * parseFloat(lamRec.prezzoMl);
    const scontoGlob = parseFloat(az.scontoGlobale || 0);
    if (scontoGlob !== 0) infisso = infisso * (1 + scontoGlob / 100);
    const accCat = (v.accessoriCatalogo || []).reduce((s: number, a: any) => s + (parseFloat(a.prezzoUnitario) || 0) * (a.quantita || 1), 0);
    const posa = v.prevPosaPrezzo || (parseFloat(az.prezzoPosaVano || 0) > 0 && az.includePosaInPreventivo ? parseFloat(az.prezzoPosaVano) : 0);
    const acc = v.accessori || {};
    let accFisici = 0;
    const pTapp = parseFloat(az.prezzoTapparella || c.prezzoTapparella || 0);
    if (acc.tapparella?.attivo && pTapp > 0) accFisici += Math.round(((acc.tapparella.l || lmm) / 1000) * ((acc.tapparella.h || hmm) / 1000) * pTapp * 100) / 100;
    const pZanz = parseFloat(az.prezzoZanzariera || c.prezzoZanzariera || 0);
    if (acc.zanzariera?.attivo && pZanz > 0) accFisici += Math.round(((acc.zanzariera.l || lmm) / 1000) * ((acc.zanzariera.h || hmm) / 1000) * pZanz * 100) / 100;
    infisso = Math.round(infisso * 100) / 100;
    return { prezzoBase: infisso, accessoriCat: accCat, posa, totUnitario: infisso + accFisici, totaleVano: (infisso + accFisici) * pezzi + accCat + posa };
  };

  const vani = getVaniAttivi ? getVaniAttivi(c) : (c.vani || []).filter((v: any) => !v.eliminato);
  const vaniCalc = vani.map((v: any) => ({ ...v, _calc: calcolaVano(v) }));

  const totVani = vaniCalc.reduce((s: number, v: any) => s + v._calc.totaleVano, 0);
  const vociLib = (c.vociLibere || []).reduce((s: number, vl: any) => s + (vl.importo || 0) * (vl.qta || 1), 0);
  const totBase = totVani + vociLib;
  const scontoPerc = parseFloat(c.sconto || c.scontoPerc || 0);
  const scontoVal = totBase * scontoPerc / 100;
  const imponibile = totBase - scontoVal;
  const ivaPerc = parseFloat(c.iva || c.aliquotaIva || c.ivaPerc || 10);
  const ivaVal = imponibile * ivaPerc / 100;
  const totIva = imponibile + ivaVal;
  const acconto = parseFloat(c.accontoRicevuto || 0);
  const saldo = totIva - acconto;

  // ── Crea documento ──
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.width;

  await drawHeader(doc, az);
  let y = drawClienteInfo(doc, az, c, 30);

  // ── Titolo tabella ──
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SUB);
  doc.text("DETTAGLIO VOCI", 12, y);
  y += 3;

  // ── Righe tabella ──
  const rows: any[] = [];

  vaniCalc.forEach((v: any, idx: number) => {
    const m = v.misure || {};
    const pezzi = v.pezzi || 1;
    const acc = v.accessori || {};
    const calc = v._calc;

    // Misure leggibili
    const lmm = m.lCentro || m.l || 0;
    const hmm = m.hCentro || m.h || 0;
    const misure = lmm > 0 && hmm > 0 ? lmm + " x " + hmm + " mm" : "misure da definire";

    const sistema = clean(v.sistema || "");
    const colore = v.bicolore
      ? [clean(v.coloreInt), "/ est.", clean(v.coloreEst)].filter(Boolean).join(" ")
      : clean(v.coloreInt || v.colore || v.coloreEst || "");
    const vetro = clean(v.vetro || "");

    const descParts: string[] = [];
    if (sistema) descParts.push(sistema);
    if (misure)  descParts.push(misure);
    if (vetro)   descParts.push(vetro);
    if (colore)  descParts.push(colore);

    const tecnici: string[] = [];
    if (v.stanza) tecnici.push(clean(v.stanza) + (v.piano ? " - " + clean(v.piano) : ""));
    if (v.controtelaio && v.controtelaio !== "Nessuno") tecnici.push("CT: " + clean(v.controtelaio));
    if (v.coprifilo) tecnici.push("Coprifilo: " + clean(v.coprifilo));
    if (v.lamiera)   tecnici.push("Lamiera: " + clean(v.lamiera));
    if (m.davProf)   tecnici.push("Dav. " + m.davProf + "mm");
    if (m.soglia)    tecnici.push("Soglia " + m.soglia + "mm");
    if (m.imbotte)   tecnici.push("Imbotte " + m.imbotte + "mm");

    const nomevano = clean(v.nome || "Vano " + (idx + 1)) + (v.tipo ? "  [" + clean(v.tipo) + "]" : "");
    const descFull = [
      nomevano,
      descParts.join("  |  "),
      tecnici.length > 0 ? tecnici.join("  |  ") : null,
    ].filter(Boolean).join("\n");

    rows.push([
      String(idx + 1),
      descFull,
      String(pezzi),
      "EUR " + fmt(calc.prezzoBase),
      "EUR " + fmt(calc.prezzoBase * pezzi),
    ]);

    if (acc.tapparella?.attivo) {
      const lT = acc.tapparella.l || acc.tapparella.larghezza || lmm;
      const hT = acc.tapparella.h || acc.tapparella.altezza || hmm;
      const tDesc = ["Tapparella", clean(acc.tapparella.tipo||""), clean(acc.tapparella.colore||""),
        lT && hT ? lT + "x" + hT + "mm" : ""].filter(Boolean).join(" ");
      rows.push(["", "  > " + tDesc, String(pezzi), acc.tapparella.inclusa ? "inclusa" : "a prev.", acc.tapparella.inclusa ? "" : ""]);
    }
    if (acc.zanzariera?.attivo) {
      const lZ = acc.zanzariera.l || acc.zanzariera.larghezza || lmm;
      const hZ = acc.zanzariera.h || acc.zanzariera.altezza || hmm;
      const zDesc = ["Zanzariera", clean(acc.zanzariera.tipo||""), clean(acc.zanzariera.colore||""),
        lZ && hZ ? lZ + "x" + hZ + "mm" : ""].filter(Boolean).join(" ");
      rows.push(["", "  > " + zDesc, String(pezzi), acc.zanzariera.inclusa ? "inclusa" : "a prev.", acc.zanzariera.inclusa ? "" : ""]);
    }

    (v.accessoriCatalogo || []).forEach((a: any) => {
      if (!a?.nome) return;
      const aDesc = [clean(a.nome), a.codice ? "(" + clean(a.codice) + ")" : ""].filter(Boolean).join(" ");
      const qta = a.quantita || 1;
      const pu = parseFloat(a.prezzoUnitario) || 0;
      rows.push(["", "  > " + aDesc, String(qta),
        pu > 0 ? "EUR " + fmt(pu) : "incluso",
        pu > 0 ? "EUR " + fmt(pu * qta) : ""]);
    });

    if (calc.posa > 0) {
      rows.push(["", "  > Posa in opera", String(pezzi), "EUR " + fmt(calc.posa), "EUR " + fmt(calc.posa * pezzi)]);
    } else if (v.prevPosa && v.prevPosa !== "Non prevista") {
      rows.push(["", "  > Posa in opera", String(pezzi), "inclusa", ""]);
    }

    (v.vociLibere || []).forEach((vl: any) => {
      if (!vl.desc) return;
      const q = vl.qta || 1;
      const p = vl.prezzo || 0;
      rows.push(["", "  > " + clean(vl.desc), String(q), "EUR " + fmt(p), "EUR " + fmt(p * q)]);
    });
  });

  (c.vociLibere || []).forEach((vl: any) => {
    rows.push(["-", clean(vl.desc || vl.descrizione || "Voce aggiuntiva"),
      String(vl.qta || 1), "EUR " + fmt(vl.importo || 0), "EUR " + fmt((vl.importo || 0) * (vl.qta || 1))]);
  });

  // ── Tabella ──
  autoTable(doc, {
    startY: y,
    head: [["#", "Descrizione", "Q.ta'", "Prezzo unit.", "Totale"]],
    body: rows,
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
      textColor: DARK,
      font: "helvetica",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 4.5, bottom: 4.5, left: 4, right: 4 },
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", fontStyle: "bold" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 14, halign: "center" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 32, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [250, 250, 253] },
    bodyStyles: { lineColor: LINE, lineWidth: 0.1 },
    didParseCell: (data: any) => {
      if (data.section === "body" && data.row.raw[0] === "" && data.column.index === 1) {
        data.cell.styles.fontSize = 7.5;
        data.cell.styles.textColor = SUB;
      }
      // Prima riga di ogni vano: bold nome
      if (data.section === "body" && data.column.index === 1 && data.row.raw[0] !== "") {
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // ── Totali ──
  const totW = 90;
  const totX = W - totW - 12;

  const totRows: Array<[string, string, "normal"|"bold"|"amber"|"grand"|"green"]> = [];
  totRows.push(["Totale vani", "EUR " + fmt(totVani), "normal"]);
  if (vociLib > 0) totRows.push(["Voci extra", "EUR " + fmt(vociLib), "normal"]);
  if (scontoPerc > 0) totRows.push(["Sconto " + scontoPerc + "%", "- EUR " + fmt(scontoVal), "amber"]);
  totRows.push(["Imponibile", "EUR " + fmt(imponibile), "bold"]);
  totRows.push(["IVA " + ivaPerc + "%", "EUR " + fmt(ivaVal), "normal"]);
  totRows.push(["TOTALE IVA INCLUSA", "EUR " + fmt(totIva), "grand"]);

  let ty = y;
  totRows.forEach(([label, val, style]) => {
    if (style === "grand") {
      doc.setFillColor(...DARK);
      doc.roundedRect(totX, ty - 5.5, totW, 10, 2, 2, "F");
      doc.setTextColor(...WHITE);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(label, totX + 4, ty);
      doc.text(val, totX + totW - 4, ty, { align: "right" });
      ty += 12;
    } else if (style === "bold") {
      doc.setTextColor(...DARK);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      drawLine(doc, ty - 3);
      doc.text(label, totX + 4, ty);
      doc.text(val, totX + totW - 4, ty, { align: "right" });
      ty += 8;
    } else if (style === "amber") {
      doc.setTextColor(...AMBER);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text(label, totX + 4, ty);
      doc.text(val, totX + totW - 4, ty, { align: "right" });
      ty += 7;
    } else {
      doc.setTextColor(...SUB);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text(label, totX + 4, ty);
      doc.text(val, totX + totW - 4, ty, { align: "right" });
      ty += 7;
    }
  });

  if (acconto > 0) {
    doc.setTextColor(...SUB);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.text("Acconto ricevuto", totX + 4, ty);
    doc.text("- EUR " + fmt(acconto), totX + totW - 4, ty, { align: "right" });
    ty += 8;
    doc.setFillColor(...GREEN);
    doc.roundedRect(totX, ty - 5.5, totW, 10, 2, 2, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("SALDO", totX + 4, ty);
    doc.text("EUR " + fmt(saldo), totX + totW - 4, ty, { align: "right" });
  }

  y = Math.max(ty + 8, y + 8);

  // ── Note ──
  const nota = clean(c.notePreventivo || c.note || "");
  if (nota) {
    if (y > 235) { doc.addPage(); await drawHeader(doc, az); y = 32; }
    doc.setFillColor(...BG);
    const noteLines = doc.splitTextToSize(nota, W - 36);
    const noteH = noteLines.length * 5 + 14;
    doc.roundedRect(12, y, W - 24, noteH, 3, 3, "F");
    doc.setFillColor(...AMBER);
    doc.roundedRect(12, y, W - 24, 7, 3, 3, "F");
    doc.rect(12, y + 4, W - 24, 3, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text("NOTE", 16, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...DARK);
    doc.text(noteLines, 16, y + 13);
    y += noteH + 8;
  }

  // ── Condizioni ──
  const condizioni = clean(az.condizioni || az.condPagamento || "");
  if (condizioni) {
    if (y > 240) { doc.addPage(); await drawHeader(doc, az); y = 32; }
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SUB);
    const condLines = doc.splitTextToSize("Condizioni: " + condizioni, W - 24);
    doc.text(condLines, 12, y);
    y += condLines.length * 4 + 6;
  }

  // ── Firma cliente (da link o da file) ──
  const firmaData = c.firmaBase64 || c.firmaCliente;
  if (firmaData) {
    if (y > 220) { doc.addPage(); await drawHeader(doc, az); y = 32; }
    doc.setFillColor(...BG);
    doc.roundedRect(12, y, W - 24, 42, 3, 3, "F");
    doc.setFillColor(...GREEN);
    doc.roundedRect(12, y, W - 24, 7, 3, 3, "F");
    doc.rect(12, y + 4, W - 24, 3, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
    doc.text("FIRMA PER ACCETTAZIONE", 16, y + 5);

    const nomeCliente = [clean(c.cliente), clean(c.cognome)].filter(Boolean).join(" ");
    const dataFirma = clean(c.dataFirma || c.nomeFirmatario || new Date().toLocaleDateString("it-IT"));
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(nomeCliente + " - " + dataFirma, 16, y + 15);

    try { doc.addImage(firmaData, "PNG", 16, y + 17, 75, 20); } catch {}

    // Linea firma destra
    doc.setDrawColor(...DARK);
    doc.setLineWidth(0.4);
    doc.line(W - 85, y + 37, W - 14, y + 37);
    doc.setFontSize(7);
    doc.setTextColor(...SUB);
    doc.text("Firma per accettazione", W - 50, y + 41, { align: "center" });
    y += 50;
  } else {
    // Box firma vuoto per firma fisica
    if (y > 230) { doc.addPage(); await drawHeader(doc, az); y = 32; }
    doc.setFillColor(...BG);
    doc.roundedRect(12, y, W - 24, 30, 3, 3, "F");
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SUB);
    doc.text("FIRMA PER ACCETTAZIONE", 16, y + 7);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.5);
    doc.line(16, y + 26, 100, y + 26);
    doc.line(W - 85, y + 26, W - 14, y + 26);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Luogo e data", 16, y + 30);
    doc.text("Firma cliente per accettazione", W - 50, y + 30, { align: "center" });
  }

  drawFooter(doc, az);

  const nome = clean(c.cliente || "cliente").replace(/\s+/g, "_");
  const filename = "preventivo_" + clean(c.code || String(c.id)) + "_" + nome + ".pdf";
  doc.save(filename);
}
