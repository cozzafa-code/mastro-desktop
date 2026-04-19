// lib/pdf-ordine-controtelai.ts
// Genera PDF scheda ordine controtelai generica MASTRO
// Compatibile con qualsiasi fornitore — nessun riferimento a Schipani
// Usa jsPDF (già presente come dipendenza per pdf-tavola-tecnica)

const ACC_LABELS: Record<string, string> = {
  battutaPVC:    "Battuta PVC",
  battutaLegno:  "Battuta legno",
  smusso:        "Smusso 45°",
  quartoLato:    "4° lato PVC",
  tappoZanz:     "Tappo incasso zanzariera",
  sottobancale:  "Sottobancale EPS",
  assemblaggio:  "Assemblaggio",
  avvolgibile:   "Montaggio avvolgibile nel cassonetto",
};

const TIPO_MISURA_LABELS: Record<string, string> = {
  luce:    "Luce architettonica",
  esterno: "Esterno controtelaio",
  interno: "Interno telaio",
  grezzo:  "Muro grezzo",
};

interface Vano {
  id: string;
  stanza?: string;
  piano?: string;
  misure?: { lCentro?: number; hCentro?: number };
  controtelaio?: {
    sistema?: string;
    l?: number;
    h?: number;
    varA?: number;
    varB?: number;
    varC?: number;
    ribattuta?: number;
    tipoMisura?: string;
    battutaPVC?: boolean;
    battutaLegno?: boolean;
    smusso?: boolean;
    quartoLato?: boolean;
    tappoZanz?: boolean;
    sottobancale?: boolean;
    assemblaggio?: boolean;
    avvolgibile?: boolean;
  };
}

interface PdfOrdineParams {
  vani: Vano[];
  commessa?: {
    code?: string;
    nome?: string;
    indirizzo?: string;
    cliente?: string;
    cognome?: string;
  };
  aziendaInfo?: {
    ragioneSociale?: string;
    nome?: string;
    telefono?: string;
    email?: string;
    indirizzo?: string;
  };
  note?: string;
}

export async function generaOrdineControtelaiPDF(params: PdfOrdineParams): Promise<void> {
  // Dynamic import — jsPDF non è SSR-safe
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  const { vani, commessa, aziendaInfo, note } = params;
  const W = 297; // A4 landscape width
  const margin = 12;
  let y = margin;

  // ── Colori ──────────────────────────────────────────────────
  const C = {
    dark:   [26, 26, 28]  as [number, number, number],
    green:  [26, 158, 115] as [number, number, number],
    amber:  [208, 128, 8]  as [number, number, number],
    blue:   [59, 127, 224] as [number, number, number],
    bg:     [242, 241, 236] as [number, number, number],
    bdr:    [229, 227, 220] as [number, number, number],
    sub:    [142, 142, 147] as [number, number, number],
    white:  [255, 255, 255] as [number, number, number],
  };

  // ── Helper ───────────────────────────────────────────────────
  const fillRect = (x: number, y: number, w: number, h: number, color: [number,number,number]) => {
    doc.setFillColor(...color);
    doc.rect(x, y, w, h, "F");
  };
  const text = (
    str: string, x: number, y: number,
    size = 10, color: [number,number,number] = C.dark,
    bold = false, align: "left"|"center"|"right" = "left"
  ) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...color);
    doc.text(str, x, y, { align });
  };

  // ── Header ───────────────────────────────────────────────────
  fillRect(0, 0, W, 18, C.dark);
  text("SCHEDA ORDINE CONTROTELAI", margin, 11, 14, C.white, true);
  text("MASTRO ERP", W - margin, 11, 10, [208, 128, 8], true, "right");
  y = 24;

  // ── Intestazione ─────────────────────────────────────────────
  fillRect(margin, y, W - margin * 2, 20, C.bg);
  doc.setDrawColor(...C.bdr);
  doc.rect(margin, y, W - margin * 2, 20);

  const cols = [
    ["Azienda mittente", aziendaInfo?.ragioneSociale || aziendaInfo?.nome || "—"],
    ["Cantiere / Indirizzo", commessa?.indirizzo || commessa?.nome || "—"],
    ["Cliente", [commessa?.cliente, commessa?.cognome].filter(Boolean).join(" ") || "—"],
    ["Riferimento", commessa?.code || "—"],
    ["Data ordine", new Date().toLocaleDateString("it-IT")],
  ];
  const colW = (W - margin * 2) / cols.length;
  cols.forEach(([label, value], i) => {
    const cx = margin + colW * i + 4;
    text(label.toUpperCase(), cx, y + 6, 6, C.sub, true);
    text(value, cx, y + 13, 9, C.dark, true);
  });
  y += 26;

  // ── Tabella vani ──────────────────────────────────────────────
  const headers = ["POS", "PZ", "L (mm)", "H (mm)", "BAT.", "SISTEMA", "AVV / DX-SX", "ACCESSORI", "NOTE"];
  const colWs   = [10,    10,    20,        20,        16,      28,        38,             52,           0]; // 0 = fill
  const totalFixed = colWs.reduce((a, b) => a + b, 0);
  const noteW = W - margin * 2 - totalFixed;
  colWs[colWs.length - 1] = noteW;

  // Header row
  fillRect(margin, y, W - margin * 2, 8, C.dark);
  let cx = margin;
  headers.forEach((h, i) => {
    text(h, cx + colWs[i] / 2, y + 5.5, 6.5, C.white, true, "center");
    cx += colWs[i];
  });
  y += 8;

  // Righe dati
  vani.forEach((vano, idx) => {
    const ct = vano.controtelaio || {};
    const L = ct.l || vano.misure?.lCentro || 0;
    const H = ct.h || vano.misure?.hCentro || 0;
    const rowH = 12;
    const rowBg: [number,number,number] = idx % 2 === 0 ? C.white : C.bg;
    fillRect(margin, y, W - margin * 2, rowH, rowBg);
    doc.setDrawColor(...C.bdr);
    doc.rect(margin, y, W - margin * 2, rowH);

    const accAttivi = Object.entries(ACC_LABELS)
      .filter(([k]) => (ct as any)[k])
      .map(([, lbl]) => lbl)
      .join(", ");

    const noteVano = [
      vano.stanza || "",
      vano.piano ? `· ${vano.piano}` : "",
    ].filter(Boolean).join(" ");

    const avvCell = [
      ct.avvTipologia || "",
      ct.avvLato ? ct.avvLato.toUpperCase() : "",
      ct.avvColore || "",
      ct.comando && ct.comando !== "nessuno" ? ct.comando : "",
    ].filter(Boolean).join(" / ") || "—";

    const cells = [
      String(idx + 1),
      "1",
      L > 0 ? String(L) : "—",
      H > 0 ? String(H) : "—",
      ct.ribattuta ? String(ct.ribattuta) : "—",
      [ct.sistema || "—", ct.varA ? `A=${ct.varA}` : "", ct.varB ? `B=${ct.varB}` : ""].filter(Boolean).join(" "),
      avvCell,
      accAttivi || "—",
      noteVano || "",
    ];

    cx = margin;
    cells.forEach((cell, i) => {
      const isSystem = i === 5;
      const color: [number,number,number] = isSystem ? C.green : C.dark;
      const isMono = i <= 4 || i === 6 || i === 7;
      // Truncate accessori text to fit
      const maxLen = Math.floor(colWs[i] / 1.8);
      const displayCell = cell.length > maxLen ? cell.slice(0, maxLen - 2) + "…" : cell;
      doc.setFont(isMono ? "courier" : "helvetica", isSystem ? "bold" : "normal");
      doc.setFontSize(8);
      doc.setTextColor(...color);
      doc.text(displayCell, cx + colWs[i] / 2, y + 7.5, { align: "center" });
      cx += colWs[i];
    });
    y += rowH;

    // Nuova pagina se necessario
    if (y > 175) {
      doc.addPage();
      y = margin;
    }
  });

  y += 8;

  // ── Riepilogo accessori ────────────────────────────────────────
  if (y < 155) {
    const uniqueAcc = new Set<string>();
    vani.forEach(v => {
      Object.entries(ACC_LABELS).forEach(([k, lbl]) => {
        if ((v.controtelaio as any)?.[k]) uniqueAcc.add(lbl);
      });
    });

    if (uniqueAcc.size > 0) {
      text("ACCESSORI RICHIESTI:", margin, y + 5, 8, C.dark, true);
      y += 8;
      const accList = [...uniqueAcc];
      accList.forEach((acc, i) => {
        const col = Math.floor(i / 4);
        const row = i % 4;
        fillRect(margin + col * 70 + 0, y + row * 7, 3, 3, C.green);
        text(acc, margin + col * 70 + 5, y + row * 7 + 2.5, 8, C.dark);
      });
      y += Math.ceil(accList.length / 4) * 7 + 6;
    }
  }

  // ── Note ─────────────────────────────────────────────────────
  if (note?.trim() && y < 170) {
    fillRect(margin, y, W - margin * 2, 6, C.bg);
    text("NOTE:", margin + 2, y + 4, 8, C.dark, true);
    y += 8;
    const lines = doc.splitTextToSize(note.trim(), W - margin * 2 - 4);
    lines.slice(0, 3).forEach((line: string) => {
      text(line, margin + 2, y + 4, 8, C.dark);
      y += 5;
    });
  }

  // ── Footer ───────────────────────────────────────────────────
  fillRect(0, 202, W, 8, C.bg);
  doc.setDrawColor(...C.bdr);
  doc.line(0, 202, W, 202);
  text(
    `MASTRO ERP · Scheda Ordine Controtelai · ${new Date().toLocaleString("it-IT")}`,
    W / 2, 207, 7, C.sub, false, "center"
  );
  text(`${vani.length} vano${vani.length !== 1 ? "i" : ""}`, W - margin, 207, 7, C.sub, false, "right");

  // ── Salva ────────────────────────────────────────────────────
  const filename = `Ordine_CT_${commessa?.code || "MASTRO"}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
