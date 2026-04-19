// ============================================================
// MASTRO ERP — lib/excel-fascicolo.ts
// Excel Fascicolo Geometra per ENEA/AdE
// Usa SheetJS (xlsx) già disponibile come dependency
// ============================================================
import * as XLSX from "xlsx";
import type { FascicoloSnapshot } from "./fascicolo-service";

function tipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    F1A:"Finestra 1 anta", F2A:"Finestra 2 ante", F3A:"Finestra 3 ante",
    F4A:"Finestra 4 ante", PF1A:"Balcone 1 anta", PF2A:"Balcone 2 ante",
    PF3A:"Balcone 3 ante", PF4A:"Balcone 4 ante",
    SC2A:"Scorrevole 2 ante", SC4A:"Scorrevole 4 ante",
    VAS:"Vasistas", RIBALTA:"Ribalta",
    SCRDX:"Scorrevole DX", SCRSX:"Scorrevole SX",
  };
  return map[tipo] || tipo || "—";
}

export function generaExcelFascicolo(snap: FascicoloSnapshot): void {
  const wb = XLSX.utils.book_new();

  // ─── FOGLIO 1: RIEPILOGO VANI ──────────────────────────────
  const headerRiepilogo = [
    "N°", "Nome Vano", "Tipologia", "Piano", "Stanza", "Pezzi",
    "Larg. Alto (mm)", "Larg. Centro (mm)", "Larg. Basso (mm)",
    "Alt. Sx (mm)", "Alt. Centro (mm)", "Alt. Dx (mm)",
    "Diag. 1 (mm)", "Diag. 2 (mm)",
    "Sup. m²", "Stato Misure",
    "Sistema", "Vetro", "Colore",
    "Controtelaio", "Soglia", "Davanzale",
    "Acc. Tapparella", "Acc. Persiana", "Acc. Zanzariera",
    "Prezzo Unit. (€)", "Prezzo Tot. (€)", "Note",
  ];

  const rowsRiepilogo = snap.vani.map((v, i) => {
    const m = v.misure || {};
    const acc = v.accessori || {};
    const mq = ((m.lCentro || 0) * (m.hCentro || 0)) / 1000000;
    return [
      i + 1,
      v.nome || `Vano ${i + 1}`,
      tipoLabel(v.tipo || ""),
      v.piano || "",
      v.stanza || "",
      v.pezzi || 1,
      m.lAlto || "",
      m.lCentro || "",
      m.lBasso || "",
      m.hSx || "",
      m.hCentro || "",
      m.hDx || "",
      m.d1 || "",
      m.d2 || "",
      mq > 0 ? +mq.toFixed(4) : "",
      v.statoMisure || "provvisorie",
      v.sistema || "",
      v.vetro || "",
      v.colore || "",
      v.controtelaio || "",
      v.soglia || "",
      v.davanzale || "",
      acc.tapparella?.attivo ? (acc.tapparella.tipo || "Sì") : "",
      acc.persiana?.attivo ? (acc.persiana.tipo || "Sì") : "",
      acc.zanzariera?.attivo ? (acc.zanzariera.tipo || "Sì") : "",
      v.prezzoUnitario ? +v.prezzoUnitario.toFixed(2) : "",
      v.prezzoTotale ? +v.prezzoTotale.toFixed(2) : "",
      v.note || "",
    ];
  });

  const wsRiepilogo = XLSX.utils.aoa_to_sheet([headerRiepilogo, ...rowsRiepilogo]);

  // Larghezze colonne
  wsRiepilogo["!cols"] = [
    { wch: 4 }, { wch: 18 }, { wch: 16 }, { wch: 8 }, { wch: 12 }, { wch: 6 },
    { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 12 },
    { wch: 12 }, { wch: 12 },
    { wch: 10 }, { wch: 14 },
    { wch: 20 }, { wch: 20 }, { wch: 16 },
    { wch: 14 }, { wch: 12 }, { wch: 12 },
    { wch: 16 }, { wch: 14 }, { wch: 16 },
    { wch: 14 }, { wch: 14 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, wsRiepilogo, "Vani");

  // ─── FOGLIO 2: ENEA / Trasmittanza ─────────────────────────
  const headerENEA = [
    "N°", "Descrizione", "Tipologia",
    "Sup. Lorda m²", "Sup. Vetro m² (stima 70%)", "Sup. Telaio m² (stima 30%)",
    "Ug W/m²K", "Uf W/m²K (stima)", "Uw W/m²K (calc.)",
    "Classe energetica stimata",
    "Sistema", "Note",
  ];

  const rowsENEA = snap.vani.map((v, i) => {
    const m = v.misure || {};
    const lmm = (m.lCentro || m.lAlto || 0) / 1000;
    const hmm = (m.hCentro || m.hSx || 0) / 1000;
    const at = lmm * hmm * (v.pezzi || 1);
    const ag = at * 0.70;
    const af = at * 0.30;

    // Stima Ug dal codice vetro
    let ug = 1.1;
    if (v.vetro?.includes("0.6") || v.vetro?.toLowerCase().includes("triplo")) ug = 0.6;
    else if (v.vetro?.includes("1.0")) ug = 1.0;

    const uf = 1.4; // default se non disponibile
    const lg = 2 * (lmm + hmm) * (v.pezzi || 1);
    const uw = at > 0 ? ((uf * af + ug * ag + 0.06 * lg) / at) : uf;

    let classeEn = "—";
    if (uw <= 0.95) classeEn = "A4";
    else if (uw <= 1.2) classeEn = "A3";
    else if (uw <= 1.4) classeEn = "A2";
    else if (uw <= 1.8) classeEn = "A1";
    else if (uw <= 2.2) classeEn = "B";
    else classeEn = "C+";

    return [
      i + 1,
      v.nome || `Vano ${i + 1}`,
      tipoLabel(v.tipo || ""),
      at > 0 ? +at.toFixed(4) : "",
      ag > 0 ? +ag.toFixed(4) : "",
      af > 0 ? +af.toFixed(4) : "",
      ug,
      uf,
      at > 0 ? +uw.toFixed(3) : "",
      classeEn,
      v.sistema || "",
      v.note || "",
    ];
  });

  // Totali ENEA
  const totSupLorda = rowsENEA.reduce((s, r) => s + (Number(r[3]) || 0), 0);
  rowsENEA.push([
    "", "TOTALE", "",
    +totSupLorda.toFixed(4), "", "", "", "", "", "", "", "",
  ]);

  const wsENEA = XLSX.utils.aoa_to_sheet([headerENEA, ...rowsENEA]);
  wsENEA["!cols"] = [
    { wch: 4 }, { wch: 18 }, { wch: 16 },
    { wch: 14 }, { wch: 16 }, { wch: 16 },
    { wch: 10 }, { wch: 14 }, { wch: 12 },
    { wch: 18 }, { wch: 20 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, wsENEA, "ENEA-Trasmittanza");

  // ─── FOGLIO 3: INTESTAZIONE COMMESSA ───────────────────────
  const infoRows = [
    ["FASCICOLO GEOMETRA — MASTRO ERP", ""],
    ["", ""],
    ["COMMESSA", ""],
    ["Codice", snap.commessa.code || snap.commessa.id],
    ["Data", snap.commessa.data || ""],
    ["Fase", snap.commessa.fase || ""],
    ["Note", snap.commessa.note || ""],
    ["", ""],
    ["CLIENTE", ""],
    ["Nome", [snap.commessa.cliente, snap.commessa.cognome].filter(Boolean).join(" ")],
    ["Indirizzo", snap.commessa.indirizzo || ""],
    ["Città", snap.commessa.citta || ""],
    ["Telefono", snap.commessa.telefono || ""],
    ["Email", snap.commessa.email || ""],
    ["", ""],
    ["INSTALLATORE", ""],
    ["Ragione sociale", snap.azienda.ragione || ""],
    ["Indirizzo", snap.azienda.indirizzo || ""],
    ["Telefono", snap.azienda.telefono || ""],
    ["Email", snap.azienda.email || ""],
    ["P.IVA", snap.azienda.piva || ""],
    ["", ""],
    ["TOTALI", ""],
    ["N° vani", snap.totali.nVani],
    ["N° pezzi", snap.totali.nPezzi],
    ["Imponibile (€)", +snap.totali.imponibile.toFixed(2)],
    ["IVA (€)", +snap.totali.iva.toFixed(2)],
    ["Totale (€)", +snap.totali.totale.toFixed(2)],
    ["", ""],
    ["Generato il", new Date(snap.generatoIl).toLocaleDateString("it-IT")],
    ["Valido fino al", new Date(snap.validoFino).toLocaleDateString("it-IT")],
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(infoRows);
  wsInfo["!cols"] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "Commessa");

  // ─── DOWNLOAD ────────────────────────────────────────────
  const clienteStr = [snap.commessa.cliente, snap.commessa.cognome]
    .filter(Boolean).join("_").replace(/\s+/g, "_") || "Cliente";
  const code = (snap.commessa.code || snap.commessa.id || "CM").replace(/\s+/g, "_");

  XLSX.writeFile(wb, `fascicolo_ENEA_${code}_${clienteStr}.xlsx`);
}
