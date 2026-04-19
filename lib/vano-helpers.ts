// ═══════════════════════════════════════════════════════════
// MASTRO ERP — lib/vano-helpers.ts
// Fonte unica di verità per descrizione vano
// Usato da: configuratore, pdf-preventivo, pdf-condivisibile,
//           pdf-misure, fattura, scheda misure
// ═══════════════════════════════════════════════════════════

export interface VanoRiga {
  label: string;
  valore: string;
  gruppo: string;          // "prodotto"|"misure"|"finiture"|"accessori"|"manodopera"|"note"
  importante?: boolean;    // grassetto nel PDF
}

/** Costruisce la lista completa di tutte le voci di un vano */
export function buildVanoRighe(v: any): VanoRiga[] {
  const m = v.misure || {};
  const acc = v.accessori || {};
  const ct = v.controtelaio || {};
  const righe: VanoRiga[] = [];

  const add = (label: string, valore: any, gruppo: string, importante = false) => {
    const s = valore !== null && valore !== undefined && valore !== "" && valore !== false
      ? String(valore) : null;
    if (s) righe.push({ label, valore: s, gruppo, importante });
  };

  // ── IDENTIFICAZIONE ──
  add("Tipo", v.tipo, "prodotto", true);
  add("Stanza", v.stanza, "prodotto");
  add("Piano", v.piano, "prodotto");

  // ── PRODOTTO ──
  add("Sistema", v.sistema, "prodotto", true);
  add("Vetro", v.vetro, "prodotto", true);
  const colore = v.bicolore
    ? `${v.coloreInt || "—"} int. / ${v.coloreEst || "—"} est.`
    : (v.coloreInt || v.colore || null);
  add("Colore profili", colore, "prodotto", true);
  if (v.coloreAcc && v.coloreAcc !== v.coloreInt) add("Colore accessori", v.coloreAcc, "prodotto");

  // ── MISURE PRINCIPALI ──
  if (m.lCentro && m.hCentro) {
    add("Misura netta (L×H)", `${m.lCentro} × ${m.hCentro} mm`, "misure", true);
  }
  if (m.lAlto || m.lBasso) {
    if (m.lAlto !== m.lCentro) add("Larghezza alto", `${m.lAlto} mm`, "misure");
    if (m.lBasso !== m.lCentro) add("Larghezza basso", `${m.lBasso} mm`, "misure");
  }
  if (m.hSx !== m.hCentro && m.hSx) add("Altezza sinistra", `${m.hSx} mm`, "misure");
  if (m.hDx !== m.hCentro && m.hDx) add("Altezza destra", `${m.hDx} mm`, "misure");
  if (m.d1) add("Diagonale D1", `${m.d1} mm`, "misure");
  if (m.d2) add("Diagonale D2", `${m.d2} mm`, "misure");

  // Fuori squadra
  if (m.d1 && m.d2) {
    const fSq = Math.abs((m.d1 || 0) - (m.d2 || 0));
    if (fSq > 0) add("Fuori squadra", `${fSq} mm${fSq > 3 ? " ⚠" : ""}`, "misure");
  }

  // Spallette e imbotte
  if (m.spSx || m.spDx || m.spSopra || m.imbotte) {
    const sp = [
      m.spSx ? `Sx ${m.spSx}` : null,
      m.spDx ? `Dx ${m.spDx}` : null,
      m.spSopra ? `Sopra ${m.spSopra}` : null,
      m.imbotte ? `Imbotte ${m.imbotte}` : null,
    ].filter(Boolean).join(" · ");
    add("Spallette / Imbotte", sp + " mm", "misure");
  }

  // Davanzale e soglia
  if (m.davProf || m.davSporg) add("Davanzale", [m.davProf ? `Prof. ${m.davProf}` : null, m.davSporg ? `Sporg. ${m.davSporg}` : null].filter(Boolean).join(" / ") + " mm", "misure");
  if (m.soglia) add("Soglia", `${m.soglia} mm`, "misure");

  // ── TELAIO ──
  if (v.telaio) {
    const tLabel = v.telaio === "Z" ? "Telaio a Z" : "Telaio a L";
    const tExtra = v.telaio === "Z" && v.telaioAlaZ ? ` · ala ${v.telaioAlaZ}mm` : "";
    add("Telaio", tLabel + tExtra, "finiture");
  }
  if (v.rifilato) {
    const rifili = [
      v.rifilSx ? `Sx ${v.rifilSx}` : null,
      v.rifilDx ? `Dx ${v.rifilDx}` : null,
      v.rifilSopra ? `Sopra ${v.rifilSopra}` : null,
      v.rifilSotto ? `Sotto ${v.rifilSotto}` : null,
    ].filter(Boolean).join(" · ");
    add("Rifilato", rifili ? rifili + " mm" : "Sì", "finiture");
  }

  // ── FINITURE ──
  add("Coprifilo", v.coprifilo, "finiture");
  add("Lamiera", v.lamiera, "finiture");

  // ── CONTROTELAIO ──
  if (ct.tipo) {
    const ctLabel = ct.tipo === "singolo" ? "Singolo" : ct.tipo === "doppio" ? "Doppio" : "Con cassonetto";
    const ctMisure = ct.l && ct.h ? ` · ${ct.l}×${ct.h}mm` : "";
    add("Controtelaio", ctLabel + ctMisure, "finiture", true);
    if (ct.tipo === "cassonetto") {
      if (ct.hCass) add("  H cassonetto", `${ct.hCass} mm`, "finiture");
      if (ct.pCass) add("  P cassonetto", `${ct.pCass} mm`, "finiture");
      if (ct.sezione) add("  Sezione", ct.sezione, "finiture");
      if (ct.spalla) add("  Spalla", `${ct.spalla} mm`, "finiture");
      if (ct.cielino) add("  Cielino", `${ct.cielino} mm`, "finiture");
    }
  }

  // ── ACCESSORI ──
  const tapp = acc.tapparella;
  if (tapp?.attivo) {
    const parts = [
      "Tapparella",
      tapp.tipo,
      tapp.colore,
      tapp.azionamento,
      tapp.motorizzata ? "Motorizzata" : null,
      tapp.l && tapp.h ? `${tapp.l}×${tapp.h}mm` : (tapp.l ? `L ${tapp.l}mm` : null),
    ].filter(Boolean).join(" · ");
    add("Tapparella", parts.replace("Tapparella · ", ""), "accessori", true);
  }

  const pers = acc.persiana;
  if (pers?.attivo) {
    const parts = [pers.tipo, pers.colore, pers.ante ? `${pers.ante} ante` : null].filter(Boolean).join(" · ");
    add("Persiana", parts || "Sì", "accessori", true);
  }

  const zanz = acc.zanzariera;
  if (zanz?.attivo) {
    const parts = [zanz.tipo, zanz.colore, zanz.l && zanz.h ? `${zanz.l}×${zanz.h}mm` : null].filter(Boolean).join(" · ");
    add("Zanzariera", parts || "Sì", "accessori", true);
  }

  // Accessori catalogo
  (v.accessoriCatalogo || []).forEach((a: any) => {
    if (!a.nome) return;
    const parts = [a.codice ? `(${a.codice})` : null, a.colore, (a.quantita || 1) > 1 ? `× ${a.quantita}` : null].filter(Boolean).join(" ");
    add(a.nome, parts || "Sì", "accessori");
  });

  // Voci libere vano
  (v.vociLibere || []).forEach((vl: any) => {
    if (!vl.desc) return;
    add(vl.desc, vl.prezzo > 0 ? `€ ${vl.prezzo}${(vl.qta || 1) > 1 ? ` × ${vl.qta}` : ""}` : "Sì", "accessori");
  });

  // ── ACCESSO / DIFFICOLTÀ ──
  add("Difficoltà salita", v.difficoltaSalita, "note");
  add("Mezzo salita", v.mezzoSalita, "note");

  // ── MANODOPERA ──
  if ((v.oreStimate || 0) + (v.oreExtra || 0) > 0) {
    add("Ore manodopera", `${((v.oreStimate || 0) + (v.oreExtra || 0)).toFixed(1)}h`, "manodopera");
  }
  add("Nota manodopera", v.notaManodopera, "manodopera");

  return righe;
}

/** Descrizione compatta per riga tabella PDF (1 riga) */
export function buildDescCompatta(v: any): string {
  const m = v.misure || {};
  const acc = v.accessori || {};
  const ct = v.controtelaio || {};

  const misura = m.lCentro && m.hCentro ? `${m.lCentro}×${m.hCentro}mm` : "";
  const colore = v.bicolore
    ? `${v.coloreInt || ""} int./est. ${v.coloreEst || ""}`
    : (v.coloreInt || v.colore || "");

  return [
    v.tipo,
    misura,
    v.sistema,
    v.vetro,
    colore,
    v.stanza ? `(${v.stanza}${v.piano ? " " + v.piano : ""})` : null,
  ].filter(Boolean).join(" · ");
}

/** Descrizione completa per riga tabella PDF (multi-riga, testo) */
export function buildDescCompletaTesto(v: any, coprifiliDB?: any[], lamiereDB?: any[]): string[] {
  const righe = buildVanoRighe(v);
  const gruppiOrdine = ["prodotto", "misure", "finiture", "accessori"];
  return righe
    .filter(r => gruppiOrdine.includes(r.gruppo))
    .map(r => `${r.label}: ${r.valore}`);
}

/** Calcola prezzo singolo accessorio dal vano */
export function calcolaAccPrezzi(v: any, az: any, c: any): Record<string, number> {
  const m = v.misure || {};
  const acc = v.accessori || {};
  const lmm = parseFloat(m.lCentro || 0), hmm = parseFloat(m.hCentro || 0);
  const prezzi: Record<string, number> = {};

  const calcMq = (a: any, fieldPrezzo: string): number => {
    const pMq = parseFloat(az?.[fieldPrezzo] || c?.[fieldPrezzo] || 0);
    if (!pMq) return 0;
    return Math.round((a.l || lmm) / 1000 * (a.h || hmm) / 1000 * pMq * 100) / 100;
  };

  if (acc.tapparella?.attivo) prezzi.tapparella = calcMq(acc.tapparella, "prezzoTapparella");
  if (acc.persiana?.attivo)   prezzi.persiana   = calcMq(acc.persiana,   "prezzoPersiana");
  if (acc.zanzariera?.attivo) prezzi.zanzariera = calcMq(acc.zanzariera, "prezzoZanzariera");

  const pCT = parseFloat(az?.prezzoControtelaio || 0);
  const ct = v.controtelaio || {};
  if (ct.tipo && ct.tipo !== "Nessuno" && pCT > 0) prezzi.controtelaio = pCT;

  const pPosa = parseFloat(az?.prezzoPosaVano || 0);
  if (pPosa > 0 && az?.includePosaInPreventivo) prezzi.posa = pPosa;

  return prezzi;
}
