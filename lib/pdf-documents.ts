// ═══════════════════════════════════════════════════════════
// MASTRO ERP — lib/pdf-documents.ts
// Fattura cliente, Ordine fornitore, Conferma firmata,
// Pagina tracking cliente, XML SDI (bozza)
// ═══════════════════════════════════════════════════════════
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const C = {
  dark:  [26,  26,  28],
  amber: [208, 128,  8],
  green: [26,  158, 115],
  sub:   [134, 134, 139],
  bg:    [242, 241, 236],
  white: [255, 255, 255],
  blue:  [59,  127, 224],
  red:   [220,  68,  68],
};

function fmt(n: number) {
  return (n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function miniHeader(doc: jsPDF, az: any, label: string, color: number[]) {
  const W = doc.internal.pageSize.width;
  doc.setFillColor(...C.dark as [number,number,number]);
  doc.rect(0, 0, W, 22, "F");

  doc.setFillColor(...color as [number,number,number]);
  doc.roundedRect(8, 4, 14, 14, 2, 2, "F");
  doc.setTextColor(...C.dark as [number,number,number]);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("M", 15, 13.5, { align: "center" });

  doc.setTextColor(...C.white as [number,number,number]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(az.nome || "MASTRO ERP", 26, 12);

  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...color as [number,number,number]);
  doc.text(label, W - 10, 14, { align: "right" });

  doc.setTextColor(...C.dark as [number,number,number]);
}

// ─────────────────────────────────────────────────────────
// FATTURA CLIENTE
// ─────────────────────────────────────────────────────────
export function generaFatturaPDF(fat: any, ctx: any) {
  const { aziendaInfo } = ctx;
  const az = aziendaInfo || {};
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.width;

  const tipoLabel: Record<string, string> = {
    acconto: "FATTURA ACCONTO",
    saldo:   "FATTURA SALDO",
    unica:   "FATTURA",
  };

  miniHeader(doc, az, tipoLabel[fat.tipo] || "FATTURA", C.green);

  let y = 28;

  // Dati azienda emittente
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.sub as [number,number,number]);
  const azLines = [
    az.indirizzo || "",
    [az.cap, az.citta].filter(Boolean).join(" "),
    az.piva ? `P.IVA ${az.piva}` : "",
    az.cf ? `C.F. ${az.cf}` : "",
    az.pec || "",
    az.sdi ? `SDI ${az.sdi}` : "",
  ].filter(Boolean);
  doc.text(azLines, 12, y);

  // Dati cliente (dx)
  const clienteLines = [
    `${fat.clienteNome || ""}`,
    fat.clienteIndirizzo || "",
    fat.clientePiva ? `P.IVA ${fat.clientePiva}` : "",
    fat.clienteCf ? `C.F. ${fat.clienteCf}` : "",
    fat.clienteSdi ? `SDI ${fat.clienteSdi}` : "",
    fat.clientePec || "",
  ].filter(Boolean);

  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.sub as [number,number,number]);
  doc.text("DESTINATARIO", W / 2 + 4, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.dark as [number,number,number]);
  doc.text(clienteLines, W / 2 + 4, y + 5);

  y = Math.max(y + azLines.length * 5, y + clienteLines.length * 5) + 10;

  // Info fattura
  doc.setFillColor(...C.bg as [number,number,number]);
  doc.roundedRect(12, y, W - 24, 18, 3, 3, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark as [number,number,number]);

  const fRows = [
    ["N° Fattura", `${fat.numero}/${fat.anno}`],
    ["Data",       fat.data || new Date().toLocaleDateString("it-IT")],
    ["Scadenza",   fat.scadenza || "—"],
    ["Commessa",   fat.cmCode || "—"],
  ];
  fRows.forEach(([k, v], i) => {
    const x = 14 + i * ((W - 28) / 4);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.sub as [number,number,number]);
    doc.setFontSize(7);
    doc.text(k, x, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark as [number,number,number]);
    doc.setFontSize(10);
    doc.text(String(v), x, y + 13);
  });

  y += 24;

  // Tabella righe fattura
  const righe = fat.righe || [{
    desc: fat.descrizione || `Fornitura e posa ${fat.tipo}`,
    qta: 1,
    prezzoUnit: fat.imponibile || fat.importo || 0,
    totale: fat.imponibile || fat.importo || 0,
  }];

  autoTable(doc, {
    startY: y,
    head: [["Descrizione", "Q.tà", "Prezzo unit.", "Totale"]],
    body: righe.map((r: any) => [
      r.desc || "—",
      String(r.qta || 1),
      `€ ${fmt(r.prezzoUnit || r.totale || 0)}`,
      `€ ${fmt(r.totale || 0)}`,
    ]),
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3, textColor: C.dark },
    headStyles: {
      fillColor: C.dark as [number,number,number],
      textColor: C.white as [number,number,number],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 14, halign: "center" },
      2: { cellWidth: 32, halign: "right" },
      3: { cellWidth: 32, halign: "right", fontStyle: "bold" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Totali
  const imp = fat.imponibile || fat.importo || 0;
  const ivaAmt = imp * (fat.aliqIva || 10) / 100;
  const totFat = imp + ivaAmt;

  const totW = 85;
  const totX = W - totW - 12;
  [
    ["Imponibile", `€ ${fmt(imp)}`, false],
    [`IVA ${fat.aliqIva || 10}%`, `€ ${fmt(ivaAmt)}`, false],
    ["TOTALE FATTURA", `€ ${fmt(totFat)}`, true],
    fat.pagata ? ["Pagata il", fat.dataPagamento || "—", false] : null,
  ].filter(Boolean).forEach(([label, val, bold]: any) => {
    if (bold) {
      doc.setFillColor(...C.green as [number,number,number]);
      doc.rect(totX, y - 4, totW, 8, "F");
      doc.setTextColor(...C.white as [number,number,number]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
    } else {
      doc.setTextColor(...C.sub as [number,number,number]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }
    doc.text(String(label), totX + 3, y + 0.5);
    doc.text(String(val), totX + totW - 3, y + 0.5, { align: "right" });
    y += 8;
  });

  y += 6;

  // Dati pagamento
  if (az.iban) {
    doc.setFillColor(...C.bg as [number,number,number]);
    doc.roundedRect(12, y, W - 24, 14, 3, 3, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.sub as [number,number,number]);
    doc.text("DATI PAGAMENTO", 14, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark as [number,number,number]);
    doc.text(`IBAN: ${az.iban}${az.banca ? " · " + az.banca : ""}`, 14, y + 11);
  }

  // Footer
  const pH = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(...C.sub as [number,number,number]);
  doc.text(`Documento generato da MASTRO ERP · ${new Date().toLocaleString("it-IT")}`, 12, pH - 6);

  doc.save(`fattura_${fat.numero}_${fat.anno}_${fat.clienteNome?.replace(/\s/g, "_") || "cliente"}.pdf`);
}

// ─────────────────────────────────────────────────────────
// ORDINE FORNITORE
// ─────────────────────────────────────────────────────────
export function generaOrdinePDF(ord: any, ctx: any) {
  const { aziendaInfo } = ctx;
  const az = aziendaInfo || {};
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.width;

  miniHeader(doc, az, "ORDINE FORNITORE", C.blue);

  let y = 28;

  // Info ordine + fornitore
  doc.setFillColor(...C.bg as [number,number,number]);
  doc.roundedRect(12, y, W - 24, 20, 3, 3, "F");

  const oRows = [
    ["N° Ordine", `${ord.numero}/${ord.anno}`],
    ["Data",       new Date(ord.dataOrdine || Date.now()).toLocaleDateString("it-IT")],
    ["Commessa",   ord.cmCode || "—"],
    ["Cliente",    ord.cliente || "—"],
  ];
  oRows.forEach(([k, v], i) => {
    const x = 14 + i * ((W - 28) / 4);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.sub as [number,number,number]);
    doc.text(k, x, y + 6);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.dark as [number,number,number]);
    doc.text(String(v), x, y + 14);
  });

  y += 26;

  // Fornitore
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark as [number,number,number]);
  doc.text(`Spett.le ${ord.fornitore?.nome || "Fornitore"}`, 12, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.sub as [number,number,number]);
  const fornLines = [
    ord.fornitore?.referente ? `Att.ne: ${ord.fornitore.referente}` : "",
    ord.fornitore?.email || "",
    ord.fornitore?.tel || "",
  ].filter(Boolean);
  doc.text(fornLines, 12, y + 5);

  y += fornLines.length * 5 + 12;

  // Righe ordine
  autoTable(doc, {
    startY: y,
    head: [["#", "Descrizione", "Misure", "Q.tà", "Prezzo unit.", "Totale"]],
    body: (ord.righe || []).map((r: any, i: number) => [
      String(i + 1),
      r.desc || "—",
      r.misure || "—",
      String(r.qta || 1),
      `€ ${fmt(r.prezzoUnit || 0)}`,
      `€ ${fmt((r.qta || 1) * (r.prezzoUnit || 0))}`,
    ]),
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3, textColor: C.dark },
    headStyles: {
      fillColor: C.dark as [number,number,number],
      textColor: C.white as [number,number,number],
      fontStyle: "bold",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 8,  halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 22 },
      3: { cellWidth: 12, halign: "center" },
      4: { cellWidth: 28, halign: "right" },
      5: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Totali
  const totW = 80;
  const totX = W - totW - 12;
  [
    ["Imponibile",    `€ ${fmt(ord.totale || 0)}`,    false],
    [`IVA ${ord.iva || 22}%`, `€ ${fmt((ord.totale || 0) * (ord.iva || 22) / 100)}`, false],
    ["TOTALE",        `€ ${fmt(ord.totaleIva || 0)}`, true],
  ].forEach(([label, val, bold]: any) => {
    if (bold) {
      doc.setFillColor(...C.blue as [number,number,number]);
      doc.rect(totX, y - 4, totW, 8, "F");
      doc.setTextColor(...C.white as [number,number,number]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
    } else {
      doc.setTextColor(...C.sub as [number,number,number]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }
    doc.text(String(label), totX + 3, y + 0.5);
    doc.text(String(val), totX + totW - 3, y + 0.5, { align: "right" });
    y += 8;
  });

  y += 6;

  // Condizioni
  const condLines: string[] = [];
  if (ord.consegna?.prevista) condLines.push(`Consegna prevista: ${new Date(ord.consegna.prevista).toLocaleDateString("it-IT")}`);
  if (ord.pagamento?.termini) condLines.push(`Pagamento: ${ord.pagamento.termini}`);
  if (condLines.length > 0) {
    doc.setFillColor(...C.bg as [number,number,number]);
    doc.roundedRect(12, y, W - 24, condLines.length * 6 + 8, 3, 3, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.sub as [number,number,number]);
    doc.text("CONDIZIONI", 14, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark as [number,number,number]);
    doc.text(condLines, 14, y + 11);
    y += condLines.length * 6 + 14;
  }

  // Note
  if (ord.note) {
    doc.setFontSize(8);
    doc.setTextColor(...C.sub as [number,number,number]);
    const noteLines = doc.splitTextToSize(ord.note, W - 24);
    doc.text(noteLines, 12, y);
  }

  // Footer
  const pH = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(...C.sub as [number,number,number]);
  doc.text(`${az.nome || "MASTRO ERP"} · ${az.piva ? "P.IVA " + az.piva : ""}`, 12, pH - 6);
  doc.text(new Date().toLocaleDateString("it-IT"), W - 12, pH - 6, { align: "right" });

  doc.save(`ordine_${ord.numero}_${ord.anno}_${ord.fornitore?.nome?.replace(/\s/g, "_") || "fornitore"}.pdf`);
}

// ─────────────────────────────────────────────────────────
// CONFERMA FIRMATA (ordine accettato)
// ─────────────────────────────────────────────────────────
export function generaConfermaFirmataPDF(ord: any, ctx: any) {
  const { aziendaInfo } = ctx;
  const az = aziendaInfo || {};
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.width;

  miniHeader(doc, az, "CONFERMA D'ORDINE", C.green);

  let y = 30;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark as [number,number,number]);
  doc.text(`Conferma ordine N. ${ord.numero}/${ord.anno}`, 12, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...C.sub as [number,number,number]);
  doc.text(`Commessa: ${ord.cmCode || "—"} · Cliente: ${ord.cliente || "—"}`, 12, y + 6);
  doc.text(`Data conferma: ${ord.conferma?.dataFirma || new Date().toLocaleDateString("it-IT")}`, 12, y + 12);

  y += 22;

  // Tabella righe (stessa dell'ordine)
  autoTable(doc, {
    startY: y,
    head: [["#", "Descrizione", "Misure", "Q.tà", "Totale"]],
    body: (ord.righe || []).map((r: any, i: number) => [
      String(i + 1),
      r.desc || "—",
      r.misure || "—",
      String(r.qta || 1),
      `€ ${fmt((r.qta || 1) * (r.prezzoUnit || 0))}`,
    ]),
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3, textColor: C.dark },
    headStyles: {
      fillColor: C.green as [number,number,number],
      textColor: C.white as [number,number,number],
      fontStyle: "bold",
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Totale
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark as [number,number,number]);
  doc.text(`Totale confermato: € ${fmt(ord.totaleIva || 0)}`, W - 12, y, { align: "right" });
  y += 16;

  // Differenze (se presenti)
  if (ord.conferma?.differenze) {
    doc.setFillColor(255, 248, 220);
    doc.roundedRect(12, y, W - 24, 20, 3, 3, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.amber as [number,number,number]);
    doc.text("NOTE / DIFFERENZE", 14, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.dark as [number,number,number]);
    const dLines = doc.splitTextToSize(ord.conferma.differenze, W - 28);
    doc.text(dLines, 14, y + 11);
    y += 26;
  }

  // Firma azienda
  doc.setFillColor(...C.bg as [number,number,number]);
  doc.roundedRect(12, y, W - 24, 28, 3, 3, "F");
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.sub as [number,number,number]);
  doc.text("FIRMA AUTORIZZATA", 14, y + 6);
  doc.setDrawColor(...C.sub as [number,number,number]);
  doc.setLineWidth(0.4);
  doc.line(14, y + 22, 100, y + 22);
  doc.line(W - 100, y + 22, W - 14, y + 22);
  doc.setFontSize(7);
  doc.text(az.nome || "", 57, y + 26, { align: "center" });
  doc.text("Fornitore", W - 57, y + 26, { align: "center" });

  // Footer
  const pH = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(...C.sub as [number,number,number]);
  doc.text(`MASTRO ERP · ${new Date().toLocaleString("it-IT")}`, 12, pH - 6);

  doc.save(`conferma_${ord.numero}_${ord.anno}.pdf`);
}

// ─────────────────────────────────────────────────────────
// TRACKING CLIENTE (apre nuova tab con pagina HTML)
// ─────────────────────────────────────────────────────────
export function generaTrackingCliente(c: any) {
  const steps = [
    { id: "ordinato",   label: "Ordinato",   icon: "📦", color: "#ff9500" },
    { id: "produzione", label: "In Produzione", icon: "🏭", color: "#5856d6" },
    { id: "pronto",     label: "Pronto",      icon: "✅", color: "#34c759" },
    { id: "consegnato", label: "Consegnato",  icon: "🚛", color: "#007aff" },
    { id: "montato",    label: "Montato",     icon: "🔧", color: "#30b0c7" },
  ];
  const order = steps.map(s => s.id);
  const curIdx = order.indexOf(c.trackingStato || "");

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Stato ordine ${c.code || ""} — MASTRO</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Inter', sans-serif; background: #F2F1EC; min-height: 100vh; padding: 24px 16px; }
    .card { background: #fff; border-radius: 20px; max-width: 480px; margin: 0 auto; overflow: hidden; box-shadow: 0 8px 40px rgba(0,0,0,0.08); }
    .header { background: #1A1A1C; padding: 24px; text-align: center; }
    .logo { display: inline-block; width: 48px; height: 48px; background: #D08008; border-radius: 12px; line-height: 48px; font-size: 22px; font-weight: 900; color: #1A1A1C; margin-bottom: 12px; }
    .header h1 { color: #fff; font-size: 20px; }
    .header p { color: #86868b; font-size: 13px; margin-top: 4px; }
    .body { padding: 24px; }
    .info { background: #F2F1EC; border-radius: 12px; padding: 16px; margin-bottom: 24px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 14px; }
    .info-row strong { color: #1A1A1C; }
    .info-row span { color: #86868b; }
    .steps { }
    .step { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .step:last-child { border-bottom: none; }
    .step-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
    .step-label { font-size: 14px; font-weight: 600; }
    .step-date { font-size: 11px; color: #86868b; margin-top: 2px; }
    .active .step-icon { box-shadow: 0 0 0 3px currentColor; }
    .footer { padding: 16px 24px; text-align: center; font-size: 11px; color: #86868b; border-top: 1px solid #f0f0f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">M</div>
      <h1>Stato del tuo ordine</h1>
      <p>${c.cliente || ""}${c.cognome ? " " + c.cognome : ""}</p>
    </div>
    <div class="body">
      <div class="info">
        <div class="info-row"><span>Commessa</span><strong>${c.code || "—"}</strong></div>
        ${c.dataPrevConsegna ? `<div class="info-row"><span>Consegna prevista</span><strong>${new Date(c.dataPrevConsegna + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</strong></div>` : ""}
      </div>
      <div class="steps">
        ${steps.map((s, i) => {
          const done = i <= curIdx;
          const current = i === curIdx;
          const dateKey = `tracking_${s.id}_data`;
          return `
          <div class="step ${current ? "active" : ""}">
            <div class="step-icon" style="background:${done ? s.color + "20" : "#f0f0f0"};color:${done ? s.color : "#ccc"}">
              ${done ? s.icon : "○"}
            </div>
            <div>
              <div class="step-label" style="color:${done ? "#1A1A1C" : "#ccc"}">${s.label}</div>
              ${c[dateKey] ? `<div class="step-date">${c[dateKey]}</div>` : ""}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>
    <div class="footer">
      Aggiornato il ${new Date().toLocaleDateString("it-IT")} · MASTRO ERP
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

// ─────────────────────────────────────────────────────────
// XML SDI (bozza FatturaPA — NON per invio diretto)
// ─────────────────────────────────────────────────────────
export function generaXmlSDI(fat: any, az: any): string {
  const esc = (s: any) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const imp = fat.imponibile || fat.importo || 0;
  const aliq = fat.aliqIva || 10;
  const ivaAmt = imp * aliq / 100;
  const tot = imp + ivaAmt;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPR12"
  xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>IT</IdPaese>
        <IdCodice>${esc(az.piva || "")}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>00001</ProgressivoInvio>
      <FormatoTrasmissione>FPR12</FormatoTrasmissione>
      <CodiceDestinatario>${esc(fat.clienteSdi || "0000000")}</CodiceDestinatario>
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>IT</IdPaese>
          <IdCodice>${esc(az.piva || "")}</IdCodice>
        </IdFiscaleIVA>
        <Anagrafica><Denominazione>${esc(az.nome)}</Denominazione></Anagrafica>
        <RegimeFiscale>RF01</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${esc(az.indirizzo || "")}</Indirizzo>
        <CAP>${esc(az.cap || "00000")}</CAP>
        <Comune>${esc(az.citta || "")}</Comune>
        <Nazione>IT</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        <CodiceFiscale>${esc(fat.clienteCf || fat.clientePiva || "")}</CodiceFiscale>
        <Anagrafica><Denominazione>${esc(fat.clienteNome || "")}</Denominazione></Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${esc(fat.clienteIndirizzo || "")}</Indirizzo>
        <CAP>00000</CAP>
        <Comune>—</Comune>
        <Nazione>IT</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>TD01</TipoDocumento>
        <Divisa>EUR</Divisa>
        <Data>${fat.data || new Date().toISOString().split("T")[0]}</Data>
        <Numero>${fat.numero}/${fat.anno}</Numero>
        <ImportoTotaleDocumento>${tot.toFixed(2)}</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      <DettaglioLinee>
        <NumeroLinea>1</NumeroLinea>
        <Descrizione>${esc(fat.descrizione || "Fornitura e posa")}</Descrizione>
        <Quantita>1.00</Quantita>
        <PrezzoUnitario>${imp.toFixed(2)}</PrezzoUnitario>
        <PrezzoTotale>${imp.toFixed(2)}</PrezzoTotale>
        <AliquotaIVA>${aliq}.00</AliquotaIVA>
      </DettaglioLinee>
      <DatiRiepilogo>
        <AliquotaIVA>${aliq}.00</AliquotaIVA>
        <ImponibileImporto>${imp.toFixed(2)}</ImponibileImporto>
        <Imposta>${ivaAmt.toFixed(2)}</Imposta>
        <EsigibilitaIVA>I</EsigibilitaIVA>
      </DatiRiepilogo>
    </DatiBeniServizi>
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;

  // Download XML
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fattura_${fat.numero}_${fat.anno}_SDI.xml`;
  a.click();
  URL.revokeObjectURL(url);
  return xml;
}
