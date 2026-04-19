import React from "react";

//               MOTIVI_BLOCCO, AFASE, useDragOrder hook, Home, Helpers, Stili
// Supabase sync ÔÇö stubs (enable import when Supabase is configured)
var _syncQueue: Record<string, any> = {};
var _syncTimer: any = null;
export const cloudSave = (userId: string, key: string, data: any) => {
  try {
  if (!userId) return;
  if (!_syncQueue) _syncQueue = {};
  _syncQueue[key] = data;
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async () => {
    try {
    const { supabase } = await import("@/lib/supabase");
    const batch = { ..._syncQueue };
    _syncQueue = {};
    for (const [k, v] of Object.entries(batch)) {
      try {
        await supabase.from("user_data").upsert(
          { user_id: userId, azienda_id: userId, key: k, data: v, updated_at: new Date().toISOString() },
          { onConflict: "user_id,azienda_id,key" }
        );
      } catch (e) { console.warn("Cloud save error:", k, e); }
    }
    } catch (e) { console.warn("cloudSave batch error:", e); }
  }, 1500); // debounce 1.5s
  } catch (e) { console.warn("cloudSave init error:", e); }
};

export const cloudLoadAll = async (userId: string): Promise<Record<string, any>> => {
  try {
    const { supabase } = await import("@/lib/supabase");
    const { data, error } = await supabase
      .from("user_data")
      .select("key, data, updated_at")
      .eq("user_id", userId);
    if (error) throw error;
    const result: Record<string, any> = {};
    (data || []).forEach(row => { result[row.key] = row.data; });
    return result;
  } catch (e) { console.warn("Cloud load error:", e); return {}; }
};
export const getAziendaId = async () => null;
export const loadAllData = async () => ({ cantieri: [], events: [], contatti: [], team: [], tasks: [], msgs: [], sistemi: null, colori: null, vetri: null, coprifili: null, lamiere: null, libreria: null, pipeline: null, azienda: null });
export const saveCantiere = async (...a: any[]) => {};
export const saveEvent = async (...a: any[]) => {};
export const deleteEventDB = async (...a: any[]) => {};
export const saveContatto = async (...a: any[]) => {};
export const saveTeamMember = async (...a: any[]) => {};
export const saveTask = async (...a: any[]) => {};
export const saveAzienda = async (...a: any[]) => {};
export const saveVanoDB = async (...a: any[]) => {};
export const saveMateriali = async (...a: any[]) => {};
export const savePipeline = async (...a: any[]) => {};

/* =======================================================
   MASTRO MISURE ÔÇö v15 COMPLETE REBUILD
   Tutte le feature recuperate + design Apple chiaro
   ======================================================= */

export const FONT = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=JetBrains+Mono:wght@400;600&display=swap";
export const FF = "'Plus Jakarta Sans',sans-serif";
export const FM = "'JetBrains Mono',monospace";

// Map tipologia code to minimo mq category
export const tipoToMinCat = (tipo: string): string => {
  if (tipo.includes("SC") || tipo === "ALZSC") return "scorrevole";
  if (tipo === "FIS" || tipo === "FISTONDO") return "fisso";
  if (tipo.includes("3A") || tipo.includes("4A")) return "3ante";
  if (tipo.includes("2A")) return "2ante";
  return "1anta";
};

/* == TEMI == */
export const THEMES = {
  lumina: {
    name: "Lumina", emoji: "sparkles",
    bg: "#f9f9fb", bg2: "#f3f3f5", card: "#ffffff", card2: "#f3f3f5",
    bdr: "rgba(197,198,206,0.35)", bdrL: "rgba(197,198,206,0.20)", 
    text: "#1a1c1d", sub: "#44474d", sub2: "#75777e",
    pri: "#031631",
    acc: "#031631", accD: "#1a2b47", accLt: "rgba(3,22,49,0.06)", accBg: "linear-gradient(135deg,#031631,#1a2b47)",
    grn: "#1a9e73", grnLt: "rgba(26,158,115,0.08)",
    red: "#dc4444", redLt: "rgba(220,68,68,0.08)",
    orange: "#e4c18c", orangeLt: "rgba(228,193,140,0.15)",
    blue: "#3b7fe0", blueLt: "rgba(59,127,224,0.08)",
    purple: "#6366f1", purpleLt: "rgba(99,102,241,0.08)",
    cyan: "#8293b4", cyanLt: "rgba(130,147,180,0.10)",
    cardSh: "0 20px 40px rgba(26,28,29,0.04)",
    cardShH: "0 20px 40px rgba(26,28,29,0.08)",
    topbar: "#031631",
    r: 20, r2: 12
  },
  chiaro: {
    name: "Chiaro", emoji: "sun",
    bg: "#F8FAFC", bg2: "#F1F5F9", card: "#FFFFFF", card2: "#F8FAFC",
    bdr: "#E2E8F0", bdrL: "#F1F5F9", text: "#0F172A", sub: "#64748B", sub2: "#94A3B8",
    pri: "#14B8A6",
    acc: "#14B8A6", accD: "#0F766E", accLt: "rgba(20,184,166,0.08)", accBg: "linear-gradient(135deg,#14B8A6,#0F766E)",
    grn: "#1A9E73", grnLt: "rgba(26,158,115,0.08)",
    red: "#DC4444", redLt: "rgba(220,68,68,0.08)",
    orange: "#E8A020", orangeLt: "rgba(232,160,32,0.08)",
    blue: "#3B7FE0", blueLt: "rgba(59,127,224,0.08)",
    purple: "#af52de", purpleLt: "rgba(175,82,222,0.08)",
    cyan: "#32ade6", cyanLt: "rgba(50,173,230,0.08)",
    cardSh: "0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
    cardShH: "0 4px 20px rgba(0,0,0,0.10)",
    r: 16, r2: 8
  },
  scuro: {
    name: "Scuro", emoji: "moon",
    bg: "#000000", bg2: "#1c1c1e", card: "#1c1c1e", card2: "#2c2c2e",
    bdr: "#38383a", bdrL: "#48484a", text: "#f2f2f7", sub: "#8e8e93", sub2: "#636366",
    pri: "#14B8A0",
    acc: "#14B8A0", accD: "#0D9E8A", accLt: "rgba(20,184,160,0.12)", accBg: "linear-gradient(135deg,#14B8A0,#0D9E8A)",
    grn: "#30d158", grnLt: "rgba(48,209,88,0.12)",
    red: "#ff453a", redLt: "rgba(255,69,58,0.12)",
    orange: "#ff9f0a", orangeLt: "rgba(255,159,10,0.12)",
    blue: "#4A9AFF", blueLt: "rgba(74,154,255,0.12)",
    purple: "#bf5af2", purpleLt: "rgba(191,90,242,0.12)",
    cyan: "#64d2ff", cyanLt: "rgba(100,210,255,0.12)",
    cardSh: "0 1px 3px rgba(0,0,0,0.3)",
    cardShH: "0 4px 12px rgba(0,0,0,0.4)",
    r: 12, r2: 16
  },
  oceano: {
    name: "Oceano", emoji: "droplets",
    bg: "#0f1923", bg2: "#162231", card: "#1a2a3a", card2: "#1f3040",
    bdr: "#2a3f55", bdrL: "#345070", text: "#e8ecf0", sub: "#7a90a5", sub2: "#4a6070",
    pri: "#4DD4C0",
    acc: "#4DD4C0", accD: "#38C4B0", accLt: "rgba(77,212,192,0.12)", accBg: "linear-gradient(135deg,#4DD4C0,#38C4B0)",
    grn: "#66bb6a", grnLt: "rgba(102,187,106,0.12)",
    red: "#ef5350", redLt: "rgba(239,83,80,0.12)",
    orange: "#ffa726", orangeLt: "rgba(255,167,38,0.12)",
    blue: "#42a5f5", blueLt: "rgba(66,165,245,0.12)",
    purple: "#ab47bc", purpleLt: "rgba(171,71,188,0.12)",
    cyan: "#26c6da", cyanLt: "rgba(38,198,218,0.12)",
    cardSh: "0 1px 3px rgba(0,0,0,0.25)",
    cardShH: "0 4px 12px rgba(0,0,0,0.35)",
    r: 12, r2: 16
  },
  // ═══════════════════════════════════════════════
  // fliwoX — Design System v1.0 — IMMUTABILE
  // Approvato Apr 2026 · GALASSIA MASTRO
  // ═══════════════════════════════════════════════
  fliwox: {
    name: "fliwoX", emoji: "layers",
    // Sfondo con griglia teal — applicare come background-image in componenti
    bg: "#D8EEEE", bg2: "#EEF8F8", card: "#FFFFFF", card2: "#F0F8F8",
    // Border e shadow card
    bdr: "#C8E4E4", bdrL: "#DDF0F0",
    // Testi
    text: "#0D1F1F", sub: "#4A7070", sub2: "#8BBCBC",
    // Primary teal
    pri: "#28A0A0",
    acc: "#28A0A0", accD: "#156060", accLt: "rgba(40,160,160,0.10)", accBg: "#28A0A0",
    // Semantici
    grn: "#1A9E73", grnLt: "rgba(26,158,115,0.10)",
    red: "#DC4444", redLt: "rgba(220,68,68,0.10)",
    orange: "#D08008", orangeLt: "rgba(208,128,8,0.10)",
    blue: "#3B7FE0", blueLt: "rgba(59,127,224,0.10)",
    purple: "#7C5FBF", purpleLt: "rgba(124,95,191,0.10)",
    cyan: "#28A0A0", cyanLt: "rgba(40,160,160,0.10)",
    // Card shadow — rilievo fisico fliwoX
    cardSh: "0 7px 0 0 #A8CCCC, 0 8px 20px rgba(0,0,0,0.06)",
    cardShH: "0 9px 0 0 #A8CCCC, 0 12px 28px rgba(0,0,0,0.10)",
    // Topbar
    topbar: "#0D1F1F",
    // Border radius
    r: 18, r2: 14,
    // Bottoni — rilievo fisico (usare box-shadow su bottoni)
    btnPrimaryBg: "#28A0A0",
    btnPrimarySh: "0 8px 0 0 #156060",
    btnSecondaryBg: "#FFFFFF",
    btnSecondarySh: "0 6px 0 0 #A8CCCC",
    // Pipeline fasi — colori approvati
    pipelineColors: {
      sopralluogo: "#28A0A0",
      preventivo:  "#1A7070",
      ordine:      "#1060A0",
      montaggio:   "#806020",
      fattura:     "#6B4FB0",
      da_fare:     "#D0E8E8",
    },
    // Avatar operatori
    avatarColors: {
      FC: "#28A0A0", // Fabio Cozza — titolare
      MV: "#1A7878", // Marco Vito — montatore
      PG: "#1060A0", // Paolo Greco — tecnico misure
      AB: "#806020", // Antonio Bruno — magazziniere
    },
  },
};

/* == PIANI ABBONAMENTO == */
export const PLANS = {
  trial: { nome: "Trial Gratuito", prezzo: 0, maxCommesse: 999, maxVani: 999, maxUtenti: 1, maxCataloghi: 1, sync: true, pdf: true, admin: false, api: false, durata: 14, badge: "gift", desc: "14 giorni con tutte le funzioni PRO" },
  free: { nome: "Free", prezzo: 0, maxCommesse: 5, maxVani: 15, maxUtenti: 1, maxCataloghi: 1, sync: false, pdf: false, admin: false, api: false, durata: null, badge: "zap", desc: "Per provare MASTRO ÔÇö 5 commesse, 1 utente" },
  pro: { nome: "Pro", prezzo: 49, maxCommesse: 9999, maxVani: 9999, maxUtenti: 2, maxCataloghi: 5, sync: true, pdf: true, admin: false, api: false, durata: null, badge: "star", desc: "Serramentista / Artigiano ÔÇö commesse illimitate" },
  business: { nome: "Business", prezzo: 149, maxCommesse: 9999, maxVani: 9999, maxUtenti: 10, maxCataloghi: 99, sync: true, pdf: true, admin: true, api: true, durata: null, badge: "gem", desc: "Showroom / Multi-sede ÔÇö team fino a 10 persone" },
};

/* == PIPELINE 7+1 FASI == */
export const PIPELINE_DEFAULT = [
  { id: "sopralluogo", nome: "Sopralluogo", ico: "search", color: "#3B7FE0", attiva: true, desc: "Vai al cantiere, prendi misure, foto, note" },
  { id: "preventivo", nome: "Preventivo", ico: "clipboard", color: "#F5A623", attiva: true, desc: "Rivedi misure, calcola prezzi, sconti, condizioni" },
  { id: "conferma", nome: "Conferma", ico: "signatureEdit", color: "#0D7C6B", attiva: true, desc: "Firma del cliente, conferma ordine, acconto" },
  { id: "ordini", nome: "Ordini", ico: "package", color: "#EF4444", attiva: true, desc: "Ordina materiali ai fornitori" },
  { id: "produzione", nome: "Produzione", ico: "factory", color: "#F59E0B", attiva: true, desc: "In lavorazione, attesa materiali" },
  { id: "posa", nome: "Posa", ico: "hammer", color: "#F97316", attiva: true, desc: "Montaggio al cantiere" },
  { id: "collaudo", nome: "Collaudo", ico: "shieldCheck", color: "#8B5CF6", attiva: true, desc: "Verifica lavoro, foto finale" },
  { id: "chiusura", nome: "Chiusura", ico: "checkCircle", color: "#10B981", attiva: true, desc: "Fattura saldo, documenti, archivia" },
];

/* == MOTIVI BLOCCO SOPRALLUOGO == */
export const MOTIVI_BLOCCO = [
  "Cliente assente",
  "Vano inaccessibile",
  "Materiale da rimuovere",
  "Lavori in corso",
  "Arredo da spostare",
  "Altro"
];

/* == AZIONE SUGGERITA PER FASE == */
export const AFASE = {
  sopralluogo: { i: "search", t: "Vai al cantiere ÔÇö misure, foto, note",  c: "#3B7FE0" },
  preventivo:  { i: "clipboard", t: "Prepara preventivo ÔÇö prezzi, sconti, condizioni",  c: "#F5A623" },
  conferma:    { i: "signatureEdit", t: "Attendi conferma cliente ÔÇö firma contratto",   c: "#E85BAF" },
  ordini:      { i: "package", t: "Ordina materiali ai fornitori",          c: "#EF4444" },
  produzione:  { i: "building", t: "Monitora produzione",      c: "#F59E0B" },
  posa:        { i: "wrench", t: "Schedula montaggio",            c: "#F97316" },
  collaudo:    { i: "search", t: "Verifica lavoro, foto finale",   c: "#8B5CF6" },
  chiusura:    { i: "check", t: "Fattura saldo e chiudi",    c: "#10B981" },
};

// ÔòÉÔòÉÔòÉ 20 COMMESSE DEMO REALISTICHE ÔòÉÔòÉÔòÉ
export const CANTIERI_INIT = [
  // ÔòÉÔòÉÔòÉ 1. SOPRALLUOGO ÔÇö appena creato ÔòÉÔòÉÔòÉ
  {
    id: 1001, code: "S-0001", cliente: "Giuseppe", cognome: "Verdi", indirizzo: "Via Garibaldi 12, Rende (CS)",
    telefono: "347 555 1234", email: "giuseppe.verdi@email.it", fase: "sopralluogo",
    sistema: "Aluplast Ideal 4000", tipo: "nuova", difficoltaSalita: "", mezzoSalita: "", foroScale: "", pianoEdificio: "2┬░",
    note: "Appartamento secondo piano, 5 finestre da sostituire.",
    rilievi: [], allegati: [],
    creato: "25 feb", aggiornato: "25 feb",
    cf: "VRDGPP80A01D086Z", piva: "", sdi: "", pec: "",
    log: [{ chi: "Fabio", cosa: "creato la commessa", quando: "2 giorni fa", color: "#86868b" }],
  },
  // ÔòÉÔòÉÔòÉ 2. PREVENTIVO ÔÇö misure fatte, deve firmare ÔòÉÔòÉÔòÉ
  {
    id: 1002, code: "S-0002", cliente: "Anna", cognome: "Bianchi", indirizzo: "Corso Mazzini 88, Cosenza (CS)",
    telefono: "339 888 5678", email: "anna.bianchi@gmail.com", fase: "preventivo",
    sistema: "Aluplast Ideal 4000", tipo: "nuova", difficoltaSalita: "", mezzoSalita: "", foroScale: "", pianoEdificio: "1┬░",
    note: "Ristrutturazione completa. IVA agevolata 10%.",
    prezzoMq: 180,
    rilievi: [{
      id: 2001, n: 1, data: "2026-02-20", ora: "09:30", rilevatore: "Fabio", tipo: "rilievo",
      motivoModifica: "", note: "Tutti i vani accessibili.", stato: "completato",
      vani: [
        { id: 3001, nome: "Finestra Soggiorno", tipo: "F2A", stanza: "Soggiorno", piano: "1┬░", sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 7016", bicolore: true, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 1210, lCentro: 1200, lBasso: 1195, hSx: 1410, hCentro: 1400, hDx: 1405, d1: 1852, d2: 1849 }, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: true, l: 1200, h: 1400 } } },
        { id: 3002, nome: "Portafinestra Camera", tipo: "PF2A", stanza: "Camera", piano: "1┬░", sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 7016", bicolore: true, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 1405, lCentro: 1400, lBasso: 1398, hSx: 2210, hCentro: 2200, hDx: 2205, d1: 2610, d2: 2607 }, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: true, l: 1400, h: 2200 }, persiana: { attivo: false }, zanzariera: { attivo: false } } },
        { id: 3003, nome: "Vasistas Bagno", tipo: "VAS", stanza: "Bagno", piano: "1┬░", sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 7016", bicolore: true, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 605, lCentro: 600, lBasso: 598, hSx: 605, hCentro: 600, hDx: 602, d1: 850, d2: 848 }, foto: {}, note: "Vetro opaco", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } },
        { id: 3004, nome: "Scorrevole Salone", tipo: "SC2A", stanza: "Salone", piano: "1┬░", sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "RAL 9010", coloreEst: "RAL 7016", bicolore: true, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 1810, lCentro: 1800, lBasso: 1795, hSx: 2210, hCentro: 2200, hDx: 2205, d1: 2843, d2: 2840 }, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: true, l: 1800, h: 2200 } } },
      ],
    }],
    allegati: [], creato: "20 feb", aggiornato: "22 feb",
    cf: "BNCNNA85C41D086Y", piva: "", sdi: "0000000", pec: "anna.bianchi@pec.it", ivaPerc: 10,
    log: [{ chi: "Fabio", cosa: "completato rilievo misure ÔÇö 4 vani", quando: "5 giorni fa", color: "#8B5CF6" }],
  },
  // ÔòÉÔòÉÔòÉ 3. ORDINI ÔÇö firmato, deve ordinare ÔòÉÔòÉÔòÉ
  {
    id: 1003, code: "S-0003", cliente: "Mario", cognome: "Rossi", indirizzo: "Via Roma 42, Cosenza (CS)",
    telefono: "320 111 4567", email: "mario.rossi@libero.it", fase: "ordini",
    sistema: "Aluplast Ideal 7000", tipo: "nuova", difficoltaSalita: "media", mezzoSalita: "Argano", foroScale: "80├ù200", pianoEdificio: "3┬░",
    note: "3┬░ piano, serve argano. 4 finestre + portone.",
    prezzoMq: 220, euro: 3520,
    firmaCliente: true, dataFirma: "2026-02-10",
    rilievi: [{
      id: 2003, n: 1, data: "2026-02-05", ora: "10:00", rilevatore: "Fabio", tipo: "rilievo",
      motivoModifica: "", note: "", stato: "completato",
      vani: [
        { id: 3010, nome: "F1 Cucina", tipo: "F2A", stanza: "Cucina", piano: "3┬░", sistema: "Aluplast Ideal 7000", pezzi: 1, coloreInt: "Bianco", coloreEst: "Bianco", bicolore: false, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 1010, lCentro: 1000, lBasso: 995, hSx: 1210, hCentro: 1200, hDx: 1205, d1: 1562, d2: 1560 }, foto: {}, note: "", cassonetto: true, accessori: { tapparella: { attivo: true, l: 1000, h: 1200 }, persiana: { attivo: false }, zanzariera: { attivo: false } } },
        { id: 3011, nome: "F2 Soggiorno", tipo: "F2A", stanza: "Soggiorno", piano: "3┬░", sistema: "Aluplast Ideal 7000", pezzi: 1, coloreInt: "Bianco", coloreEst: "Bianco", bicolore: false, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 1410, lCentro: 1400, lBasso: 1395, hSx: 1510, hCentro: 1500, hDx: 1505, d1: 2052, d2: 2050 }, foto: {}, note: "", cassonetto: true, accessori: { tapparella: { attivo: true, l: 1400, h: 1500 }, persiana: { attivo: false }, zanzariera: { attivo: true, l: 1400, h: 1500 } } },
        { id: 3012, nome: "PF Camera", tipo: "PF2A", stanza: "Camera", piano: "3┬░", sistema: "Aluplast Ideal 7000", pezzi: 1, coloreInt: "Bianco", coloreEst: "Bianco", bicolore: false, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 1210, lCentro: 1200, lBasso: 1198, hSx: 2310, hCentro: 2300, hDx: 2305, d1: 2594, d2: 2592 }, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } },
        { id: 3013, nome: "Portone Ingresso", tipo: "PORTONE", stanza: "Ingresso", piano: "3┬░", sistema: "Aluplast Ideal 7000", pezzi: 1, coloreInt: "Bianco", coloreEst: "RAL 7016", bicolore: true, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 910, lCentro: 900, lBasso: 898, hSx: 2110, hCentro: 2100, hDx: 2105, d1: 2284, d2: 2282 }, foto: {}, note: "Blindato", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } },
      ],
    }],
    allegati: [
      { id: 9901, tipo: "firma", nome: "Preventivo_S-0003_firmato.pdf", data: "10/02/2026" },
    ],
    creato: "03 feb", aggiornato: "15 feb",
    cf: "RSSMRA75B15D086X", piva: "", sdi: "", pec: "", ivaPerc: 10,
    log: [
      { chi: "Fabio", cosa: "cliente ha firmato il preventivo", quando: "17 giorni fa", color: "#1A9E73" },
      { chi: "Fabio", cosa: "completato rilievo misure ÔÇö 4 vani", quando: "22 giorni fa", color: "#8B5CF6" },
    ],
  },
  // ÔòÉÔòÉÔòÉ 4. PRODUZIONE ÔÇö ordinato, attesa materiale ÔòÉÔòÉÔòÉ
  {
    id: 1004, code: "S-0004", cliente: "Laura", cognome: "Esposito", indirizzo: "Viale Trieste 5, Rende (CS)",
    telefono: "333 222 8888", email: "laura.esposito@yahoo.it", fase: "produzione",
    sistema: "Aluplast Ideal 4000", tipo: "nuova", difficoltaSalita: "facile", mezzoSalita: "", foroScale: "", pianoEdificio: "PT",
    note: "Piano terra villa, accesso facile dal giardino.",
    prezzoMq: 180, euro: 2700,
    firmaCliente: true, dataFirma: "2026-01-20",
    rilievi: [{
      id: 2004, n: 1, data: "2026-01-15", ora: "14:00", rilevatore: "Fabio", tipo: "rilievo",
      motivoModifica: "", note: "Villa PT, 3 vani.", stato: "completato",
      vani: [
        { id: 3020, nome: "F Cucina Grande", tipo: "F2A", stanza: "Cucina", piano: "PT", sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "Bianco", coloreEst: "Bianco", bicolore: false, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 1610, lCentro: 1600, lBasso: 1595, hSx: 1210, hCentro: 1200, hDx: 1205, d1: 2000, d2: 1998 }, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: true, l: 1600, h: 1200 }, persiana: { attivo: false }, zanzariera: { attivo: true, l: 1600, h: 1200 } } },
        { id: 3021, nome: "PF Soggiorno", tipo: "PF2A", stanza: "Soggiorno", piano: "PT", sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "Bianco", coloreEst: "Bianco", bicolore: false, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 1810, lCentro: 1800, lBasso: 1798, hSx: 2310, hCentro: 2300, hDx: 2305, d1: 2921, d2: 2919 }, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: true, l: 1800, h: 2300, tipo: "alluminio" }, zanzariera: { attivo: false } } },
        { id: 3022, nome: "Vasistas Bagno", tipo: "VAS", stanza: "Bagno", piano: "PT", sistema: "Aluplast Ideal 4000", pezzi: 1, coloreInt: "Bianco", coloreEst: "Bianco", bicolore: false, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 605, lCentro: 600, lBasso: 598, hSx: 505, hCentro: 500, hDx: 502, d1: 781, d2: 780 }, foto: {}, note: "Vetro opaco", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } },
      ],
    }],
    allegati: [
      { id: 9902, tipo: "firma", nome: "Preventivo_S-0004_firmato.pdf", data: "20/01/2026" },
      { id: 9903, tipo: "ordine", nome: "Ordine_Aluplast_S-0004.pdf", data: "22/01/2026" },
      { id: 9904, tipo: "conferma", nome: "Conferma_Aluplast_8821.pdf", data: "25/01/2026" },
    ],
    creato: "10 gen", aggiornato: "25 gen",
    cf: "SPSLRA90D55D086W", piva: "", sdi: "", pec: "", ivaPerc: 10,
    praticaFiscale: "Detraz. 50%",
    docIdentita: [
      { id: "di1", tipo: "CI", nome: "CI_Laura_Esposito.jpg", data: "20/01/2026" },
      { id: "di2", tipo: "CF", nome: "CF_Laura_Esposito.jpg", data: "20/01/2026" },
    ],
    log: [
      { chi: "Fabio", cosa: "ricevuta conferma ordine Aluplast", quando: "1 mese fa", color: "#1A9E73" },
      { chi: "Fabio", cosa: "inviato ordine ad Aluplast", quando: "1 mese fa", color: "#EF4444" },
    ],
  },
  // ÔòÉÔòÉÔòÉ 5. CHIUSURA ÔÇö completata con tutto ÔòÉÔòÉÔòÉ
  {
    id: 1005, code: "S-0005", cliente: "Salvatore", cognome: "De Luca", indirizzo: "Corso Italia 22, Cosenza (CS)",
    telefono: "329 456 7890", email: "s.deluca@gmail.com", fase: "chiusura",
    sistema: "Sch├╝co CT70", tipo: "ristrutturazione", difficoltaSalita: "", mezzoSalita: "", foroScale: "", pianoEdificio: "1┬░",
    note: "Lavoro completato. Cliente soddisfatto.",
    prezzoMq: 280, euro: 1930,
    firmaCliente: true, dataFirma: "2025-12-10",
    firmaDocumento: { id: 9910, tipo: "firma", nome: "Preventivo_S-0005_firmato.pdf", data: "10/12/2025" },
    allegati: [
      { id: 9910, tipo: "firma", nome: "Preventivo_S-0005_firmato.pdf", data: "10/12/2025" },
      { id: 9911, tipo: "fattura", nome: "Fattura_003_2025_acconto.pdf", data: "12/12/2025" },
      { id: 9912, tipo: "ordine", nome: "Ordine_Schuco_S-0005.pdf", data: "13/12/2025" },
      { id: 9913, tipo: "conferma", nome: "Conferma_Schuco_12345.pdf", data: "16/12/2025" },
      { id: 9914, tipo: "fattura", nome: "Fattura_005_2026_saldo.pdf", data: "20/02/2026" },
      { id: 9915, tipo: "verbale", nome: "Verbale_consegna_S-0005.pdf", data: "18/02/2026" },
    ],
    rilievi: [{
      id: 2005, n: 1, data: "2025-12-05", ora: "09:00", rilevatore: "Fabio", tipo: "rilievo",
      motivoModifica: "", note: "Appartamento ristrutturato, muri perfetti.", stato: "completato",
      vani: [
        { id: 3030, nome: "F Cucina", tipo: "F2A", stanza: "Cucina", piano: "1┬░", sistema: "Sch├╝co CT70", pezzi: 1, coloreInt: "Bianco", coloreEst: "RAL 7016", bicolore: true, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 1010, lCentro: 1000, lBasso: 998, hSx: 1210, hCentro: 1200, hDx: 1205, d1: 1562, d2: 1560 }, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } },
        { id: 3031, nome: "PF Salone", tipo: "PF2A", stanza: "Salone", piano: "1┬░", sistema: "Sch├╝co CT70", pezzi: 1, coloreInt: "Bianco", coloreEst: "RAL 7016", bicolore: true, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 1410, lCentro: 1400, lBasso: 1398, hSx: 2310, hCentro: 2300, hDx: 2305, d1: 2694, d2: 2692 }, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } },
        { id: 3032, nome: "VAS Bagno", tipo: "VAS", stanza: "Bagno", piano: "1┬░", sistema: "Sch├╝co CT70", pezzi: 1, coloreInt: "Bianco", coloreEst: "RAL 7016", bicolore: true, coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "", misure: { lAlto: 605, lCentro: 600, lBasso: 598, hSx: 505, hCentro: 500, hDx: 502, d1: 781, d2: 780 }, foto: {}, note: "Vetro opaco", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } },
      ],
    }],
    creato: "01 dic", aggiornato: "18 feb",
    cf: "DLCSVT70H15D086V", piva: "", sdi: "", pec: "",
    ivaPerc: 10,
    praticaFiscale: "Ecobonus 65%",
    docIdentita: [
      { id: "di3", tipo: "CI", nome: "CI_Salvatore_DeLuca_fronte.jpg", data: "10/12/2025" },
      { id: "di4", tipo: "CI", nome: "CI_Salvatore_DeLuca_retro.jpg", data: "10/12/2025" },
      { id: "di5", tipo: "CF", nome: "CF_Salvatore_DeLuca.jpg", data: "10/12/2025" },
    ],
    docFiscali: [
      { id: "df1", nome: "ENEA_S-0005.pdf", data: "15/02/2026" },
      { id: "df2", nome: "Asseverazione_tecnico.pdf", data: "16/02/2026" },
      { id: "df3", nome: "Bonifico_parlante.pdf", data: "18/02/2026" },
    ],
    log: [
      { chi: "Fabio", cosa: "commessa completata e chiusa", quando: "9 giorni fa", color: "#1A9E73" },
      { chi: "Fabio", cosa: "montaggio completato", quando: "10 giorni fa", color: "#3B7FE0" },
      { chi: "Fabio", cosa: "emessa fattura saldo", quando: "7 giorni fa", color: "#E8A020" },
    ],
  },
  // ÔòÉÔòÉÔòÉ 6. POSA ÔÇö pronto per montaggio ÔòÉÔòÉÔòÉ
  { id: 1006, code: "S-0006", cliente: "Francesca", cognome: "Romano", indirizzo: "Via Popilia 156, Cosenza (CS)", telefono: "340 777 3333", email: "f.romano@outlook.it", fase: "posa", sistema: "Rehau Geneo", tipo: "nuova", difficoltaSalita: "facile", note: "Villa bifamiliare PT+1┬░, 8 vani totali.", prezzoMq: 250, euro: 6400, firmaCliente: true, dataFirma: "2026-01-05", rilievi: [{ id: 2006, n: 1, data: "2025-12-20", ora: "10:00", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", vani: [{ id: 3040, nome: "F1 Cucina PT", tipo: "F2A", stanza: "Cucina", piano: "PT", sistema: "Rehau Geneo", pezzi: 1, misure: { lAlto: 1210, lCentro: 1200, lBasso: 1195, hSx: 1010, hCentro: 1000, hDx: 1005 }, foto: {}, accessori: { tapparella: { attivo: true }, persiana: { attivo: false }, zanzariera: { attivo: false } } }, { id: 3041, nome: "PF Soggiorno PT", tipo: "PF2A", stanza: "Soggiorno", piano: "PT", sistema: "Rehau Geneo", pezzi: 1, misure: { lAlto: 1810, lCentro: 1800, lBasso: 1798, hSx: 2310, hCentro: 2300, hDx: 2305 }, foto: {}, accessori: { tapparella: { attivo: false }, persiana: { attivo: true }, zanzariera: { attivo: false } } }] }], allegati: [{ id: 9920, tipo: "firma", nome: "Preventivo_S-0006.pdf", data: "05/01/2026" }, { id: 9921, tipo: "ordine", nome: "Ordine_Rehau.pdf", data: "10/01/2026" }, { id: 9922, tipo: "conferma", nome: "Conferma_Rehau_9987.pdf", data: "14/01/2026" }], creato: "15 dic", aggiornato: "14 gen", cf: "RMNFNC88M41D086T", ivaPerc: 10, praticaFiscale: "Detraz. 50%", docIdentita: [{ id: "di6", tipo: "CI", nome: "CI_Romano_fronte.jpg", data: "05/01/2026" }, { id: "di7", tipo: "CF", nome: "CF_Romano.jpg", data: "05/01/2026" }], log: [{ chi: "Fabio", cosa: "materiale arrivato, programmare montaggio", quando: "2 sett fa", color: "#1A9E73" }] },
  // ÔòÉÔòÉÔòÉ 7-20 ÔÇö commesse aggiuntive in vari stadi ÔòÉÔòÉÔòÉ
  { id: 1007, code: "S-0007", cliente: "Marco", cognome: "Ferraro", indirizzo: "Via dei Mille 33, Rende (CS)", telefono: "335 444 9999", email: "m.ferraro@gmail.com", fase: "sopralluogo", sistema: "", tipo: "nuova", note: "Nuovo cliente da passaparola De Luca. 6 finestre.", rilievi: [], allegati: [], creato: "27 feb", aggiornato: "27 feb", log: [{ chi: "Fabio", cosa: "creato da passaparola", quando: "oggi", color: "#86868b" }] },
  { id: 1008, code: "S-0008", cliente: "Lucia", cognome: "Greco", indirizzo: "Piazza XV Marzo 8, Cosenza (CS)", telefono: "328 111 2222", email: "lucia.greco@pec.it", fase: "sopralluogo", sistema: "Aluplast Ideal 8000", tipo: "nuova", difficoltaSalita: "difficile", mezzoSalita: "Autoscala", pianoEdificio: "5┬░", note: "5┬░ piano, serve autoscala. Condominio storico.", prezzoMq: 200, rilievi: [{ id: 2008, n: 1, data: "2026-02-15", ora: "08:00", rilevatore: "Fabio", tipo: "rilievo", stato: "parziale", vani: [{ id: 3050, nome: "F1 Salone", tipo: "F2A", stanza: "Salone", piano: "5┬░", sistema: "Aluplast Ideal 8000", pezzi: 1, misure: { lAlto: 1010, lCentro: 1000, lBasso: 998, hSx: 1510, hCentro: 1500, hDx: 1505 }, foto: {}, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } }] }], allegati: [], creato: "10 feb", aggiornato: "15 feb", cf: "GRCLCU92P65D086S", log: [{ chi: "Fabio", cosa: "rilievo parziale ÔÇö tornare per 3 vani", quando: "12 giorni fa", color: "#E8A020" }] },
  { id: 1009, code: "S-0009", cliente: "Roberto", cognome: "Mancini", indirizzo: "Contrada San Vito, Mendicino (CS)", telefono: "347 888 1111", email: "", fase: "produzione", sistema: "Aluplast Ideal 4000", tipo: "nuova", note: "Villa in campagna, 8 vani. Materiale in produzione.", prezzoMq: 180, euro: 5760, firmaCliente: true, dataFirma: "2026-01-25", rilievi: [{ id: 2009, n: 1, data: "2026-01-18", ora: "09:00", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", vani: [{ id: 3060, nome: "F1", tipo: "F2A", stanza: "Cucina", piano: "PT", sistema: "Aluplast Ideal 4000", pezzi: 1, misure: { lAlto: 1210, lCentro: 1200, lBasso: 1195, hSx: 1010, hCentro: 1000, hDx: 1005 }, foto: {}, accessori: { tapparella: { attivo: true }, persiana: { attivo: false }, zanzariera: { attivo: false } } }, { id: 3061, nome: "F2", tipo: "F2A", stanza: "Camera", piano: "1┬░", sistema: "Aluplast Ideal 4000", pezzi: 1, misure: { lAlto: 1010, lCentro: 1000, lBasso: 998, hSx: 1210, hCentro: 1200, hDx: 1205 }, foto: {}, accessori: { tapparella: { attivo: true }, persiana: { attivo: false }, zanzariera: { attivo: false } } }] }], allegati: [{ id: 9930, tipo: "firma", nome: "Prev_S-0009_firmato.pdf", data: "25/01/2026" }, { id: 9931, tipo: "ordine", nome: "Ordine_Aluplast_S0009.pdf", data: "28/01/2026" }], creato: "15 gen", aggiornato: "28 gen", cf: "MNCRRT68S20D086R", ivaPerc: 10, log: [] },
  { id: 1010, code: "S-0010", cliente: "Francesco", cognome: "Greco", indirizzo: "Via Calabria 77, Cosenza (CS)", telefono: "339 555 6666", email: "f.greco@gmail.com", fase: "posa", sistema: "Sch├╝co AWS 75", tipo: "nuova", note: "Ufficio commerciale, 6 finestre grandi.", prezzoMq: 300, euro: 7200, firmaCliente: true, dataFirma: "2026-01-08", rilievi: [{ id: 2010, n: 1, data: "2025-12-15", ora: "14:00", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", vani: [{ id: 3070, nome: "F1 Ufficio", tipo: "F2A", stanza: "Ufficio 1", piano: "PT", sistema: "Sch├╝co AWS 75", pezzi: 1, misure: { lAlto: 1810, lCentro: 1800, lBasso: 1798, hSx: 1610, hCentro: 1600, hDx: 1605 }, foto: {}, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } }] }], allegati: [{ id: 9940, tipo: "firma", nome: "Prev_S-0010.pdf", data: "08/01/2026" }], creato: "10 dic", aggiornato: "20 feb", cf: "", piva: "03456789012", ivaPerc: 22, log: [] },
  { id: 1011, code: "S-0011", cliente: "Lucia", cognome: "Ferraro", indirizzo: "Via Panebianco 200, Cosenza (CS)", telefono: "366 999 4444", email: "l.ferraro@alice.it", fase: "conferma", sistema: "Aluplast Ideal 4000", tipo: "nuova", note: "Preventivo da firmare. 2 vasistas bagno.", prezzoMq: 180, rilievi: [{ id: 2011, n: 1, data: "2026-02-22", ora: "11:00", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", vani: [{ id: 3080, nome: "VAS Bagno 1", tipo: "VAS", stanza: "Bagno", piano: "1┬░", sistema: "Aluplast Ideal 4000", pezzi: 1, misure: { lAlto: 605, lCentro: 600, lBasso: 598, hSx: 505, hCentro: 500, hDx: 502 }, foto: {}, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } }, { id: 3081, nome: "VAS Bagno 2", tipo: "VAS", stanza: "Bagno ospiti", piano: "1┬░", sistema: "Aluplast Ideal 4000", pezzi: 1, misure: { lAlto: 505, lCentro: 500, lBasso: 498, hSx: 505, hCentro: 500, hDx: 502 }, foto: {}, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } }] }], allegati: [], creato: "22 feb", aggiornato: "24 feb", log: [] },
  // ÔòÉÔòÉÔòÉ 12-16 ÔÇö CHIUSE (archivio) ÔòÉÔòÉÔòÉ
  { id: 1012, code: "S-0012", cliente: "Paolo", cognome: "Valentino", indirizzo: "Via Caloprese 15, Cosenza (CS)", telefono: "348 222 3333", fase: "chiusura", sistema: "Aluplast Ideal 4000", tipo: "nuova", note: "Completata. 3 finestre, nessun problema.", prezzoMq: 180, euro: 1620, firmaCliente: true, dataFirma: "2025-11-10", rilievi: [{ id: 2012, n: 1, data: "2025-11-01", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", vani: [{ id: 3090, nome: "F Cucina", tipo: "F2A", stanza: "Cucina", piano: "2┬░", sistema: "Aluplast Ideal 4000", pezzi: 1, misure: { lAlto: 1010, lCentro: 1000, lBasso: 998, hSx: 1010, hCentro: 1000, hDx: 1005 }, foto: {}, accessori: { tapparella: { attivo: true }, persiana: { attivo: false }, zanzariera: { attivo: false } } }] }], allegati: [{ id: 9950, tipo: "firma", nome: "Prev_S-0012.pdf", data: "10/11/2025" }, { id: 9951, tipo: "fattura", nome: "Fattura_saldo_S-0012.pdf", data: "15/01/2026" }, { id: 9952, tipo: "verbale", nome: "Verbale_S-0012.pdf", data: "10/01/2026" }], creato: "25 ott", aggiornato: "15 gen", cf: "VLNPLA82D10D086Q", praticaFiscale: "IVA 10%", docIdentita: [{ id: "di10", tipo: "CI", nome: "CI_Valentino.jpg", data: "10/11/2025" }], log: [] },
  { id: 1013, code: "S-0013", cliente: "Andrea", cognome: "Colombo", indirizzo: "Via degli Stadi 45, Rende (CS)", telefono: "320 444 5555", fase: "chiusura", sistema: "Rehau Geneo", tipo: "nuova", note: "Completata. 4 portefinestre.", prezzoMq: 250, euro: 4000, firmaCliente: true, dataFirma: "2025-10-20", rilievi: [{ id: 2013, n: 1, data: "2025-10-10", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", vani: [{ id: 3100, nome: "PF1", tipo: "PF2A", stanza: "Salone", piano: "PT", sistema: "Rehau Geneo", pezzi: 1, misure: { lAlto: 1410, lCentro: 1400, lBasso: 1398, hSx: 2310, hCentro: 2300, hDx: 2305 }, foto: {}, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } }] }], allegati: [{ id: 9960, tipo: "firma", nome: "Prev_S-0013.pdf", data: "20/10/2025" }, { id: 9961, tipo: "fattura", nome: "Fattura_unica_S-0013.pdf", data: "20/12/2025" }], creato: "05 ott", aggiornato: "20 dic", praticaFiscale: "Ecobonus 65%", docIdentita: [{ id: "di11", tipo: "CI", nome: "CI_Colombo_f.jpg", data: "20/10/2025" }, { id: "di12", tipo: "CI", nome: "CI_Colombo_r.jpg", data: "20/10/2025" }, { id: "di13", tipo: "CF", nome: "CF_Colombo.jpg", data: "20/10/2025" }], docFiscali: [{ id: "df4", nome: "ENEA_S-0013.pdf", data: "10/01/2026" }, { id: "df5", nome: "Asseverazione.pdf", data: "12/01/2026" }], log: [] },
  { id: 1014, code: "S-0014", cliente: "Teresa", cognome: "Catanzaro", indirizzo: "Via Firenze 9, Cosenza (CS)", telefono: "389 666 7777", fase: "chiusura", sistema: "Aluplast Ideal 7000", tipo: "nuova", note: "Appartamento 3┬░ piano. Completata.", prezzoMq: 220, euro: 2640, firmaCliente: true, allegati: [{ id: 9970, tipo: "verbale", nome: "Verbale_S-0014.pdf", data: "05/02/2026" }], rilievi: [{ id: 2014, n: 1, data: "2025-12-01", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", vani: [{ id: 3110, nome: "F Camera", tipo: "F2A", stanza: "Camera", piano: "3┬░", sistema: "Aluplast Ideal 7000", pezzi: 1, misure: { lAlto: 1210, lCentro: 1200, lBasso: 1198, hSx: 1310, hCentro: 1300, hDx: 1305 }, foto: {}, accessori: { tapparella: { attivo: true }, persiana: { attivo: false }, zanzariera: { attivo: false } } }] }], creato: "25 nov", aggiornato: "05 feb", log: [] },
  { id: 1015, code: "S-0015", cliente: "Vincenzo", cognome: "Pinto", indirizzo: "Contrada Donnici, Cosenza (CS)", telefono: "338 888 0000", fase: "chiusura", sistema: "Aluplast Ideal 4000", tipo: "nuova", note: "Villa campagna. 10 vani. Completata.", prezzoMq: 180, euro: 7200, firmaCliente: true, allegati: [{ id: 9980, tipo: "verbale", nome: "Verbale_S-0015.pdf", data: "20/01/2026" }], rilievi: [{ id: 2015, n: 1, data: "2025-09-15", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", vani: [{ id: 3120, nome: "F1", tipo: "F2A", stanza: "Cucina", piano: "PT", sistema: "Aluplast Ideal 4000", pezzi: 1, misure: { lAlto: 1010, lCentro: 1000, lBasso: 998, hSx: 1010, hCentro: 1000, hDx: 1005 }, foto: {}, accessori: { tapparella: { attivo: true }, persiana: { attivo: false }, zanzariera: { attivo: false } } }] }], creato: "10 set", aggiornato: "20 gen", praticaFiscale: "Superbonus", docIdentita: [{ id: "di14", tipo: "CI", nome: "CI_Pinto.jpg", data: "15/09/2025" }, { id: "di15", tipo: "CF", nome: "CF_Pinto.jpg", data: "15/09/2025" }], docFiscali: [{ id: "df6", nome: "APE_ante.pdf" }, { id: "df7", nome: "APE_post.pdf" }, { id: "df8", nome: "ENEA_trasmissione.pdf" }, { id: "df9", nome: "Visto_conformita.pdf" }], log: [] },
  { id: 1016, code: "S-0016", cliente: "Giovanna", cognome: "Ferrara", indirizzo: "Viale Mancini 12, Cosenza (CS)", telefono: "333 111 2233", fase: "chiusura", sistema: "Sch├╝co CT70", tipo: "ristrutturazione", note: "2 portefinestre salone. Completata.", prezzoMq: 280, euro: 2240, firmaCliente: true, allegati: [{ id: 9990, tipo: "verbale", nome: "Verbale_S-0016.pdf", data: "10/02/2026" }], rilievi: [{ id: 2016, n: 1, data: "2025-11-20", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", vani: [{ id: 3130, nome: "PF Salone", tipo: "PF2A", stanza: "Salone", piano: "2┬░", sistema: "Sch├╝co CT70", pezzi: 1, misure: { lAlto: 1410, lCentro: 1400, lBasso: 1398, hSx: 2210, hCentro: 2200, hDx: 2205 }, foto: {}, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } }] }], creato: "15 nov", aggiornato: "10 feb", log: [] },
  // ÔòÉÔòÉÔòÉ 17-20 ÔÇö ATTIVE (vari stadi) ÔòÉÔòÉÔòÉ
  { id: 1017, code: "S-0017", cliente: "Carmela", cognome: "Aiello", indirizzo: "Via Marconi 55, Montalto Uffugo (CS)", telefono: "347 333 4455", fase: "sopralluogo", tipo: "riparazione", note: "Tapparella bloccata + guarnizioni da sostituire.", rilievi: [], allegati: [], creato: "26 feb", aggiornato: "26 feb", log: [{ chi: "Fabio", cosa: "richiesta riparazione ricevuta", quando: "ieri", color: "#E8A020" }] },
  { id: 1018, code: "S-0018", cliente: "Antonio", cognome: "Scalia", indirizzo: "Corso Umberto 120, Cosenza (CS)", telefono: "320 555 8899", email: "a.scalia@studio.it", fase: "preventivo", sistema: "Sch├╝co ASS 70", tipo: "nuova", note: "Studio legale, 4 finestre anti-rumore.", prezzoMq: 320, rilievi: [{ id: 2018, n: 1, data: "2026-02-24", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", vani: [{ id: 3140, nome: "F Studio", tipo: "F2A", stanza: "Studio", piano: "1┬░", sistema: "Sch├╝co ASS 70", pezzi: 1, misure: { lAlto: 1610, lCentro: 1600, lBasso: 1598, hSx: 1410, hCentro: 1400, hDx: 1405 }, foto: {}, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } }] }], allegati: [], creato: "20 feb", aggiornato: "24 feb", piva: "04567890123", ivaPerc: 22, log: [] },
  { id: 1019, code: "S-0019", cliente: "Maria Rosa", cognome: "Pellegrini", indirizzo: "Via Casali 8, Castrolibero (CS)", telefono: "349 777 1122", fase: "ordini", sistema: "Aluplast Ideal 4000", tipo: "nuova", note: "Villetta, 5 finestre + 2 portefinestre.", prezzoMq: 180, euro: 4500, firmaCliente: true, dataFirma: "2026-02-18", rilievi: [{ id: 2019, n: 1, data: "2026-02-10", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", vani: [{ id: 3150, nome: "F1 Cucina", tipo: "F2A", stanza: "Cucina", piano: "PT", sistema: "Aluplast Ideal 4000", pezzi: 1, misure: { lAlto: 1210, lCentro: 1200, lBasso: 1195, hSx: 1010, hCentro: 1000, hDx: 1005 }, foto: {}, accessori: { tapparella: { attivo: true }, persiana: { attivo: false }, zanzariera: { attivo: false } } }] }], allegati: [{ id: 9995, tipo: "firma", nome: "Prev_S-0019.pdf", data: "18/02/2026" }], creato: "05 feb", aggiornato: "18 feb", cf: "PLLMRS65R41D086P", praticaFiscale: "Detraz. 50%", docIdentita: [{ id: "di16", tipo: "CI", nome: "CI_Pellegrini.jpg", data: "18/02/2026" }, { id: "di17", tipo: "CF", nome: "CF_Pellegrini.jpg", data: "18/02/2026" }], log: [] },
  { id: 1020, code: "S-0020", cliente: "Domenico", cognome: "Cosenza", indirizzo: "Via dei Normanni 30, Cosenza (CS)", telefono: "340 888 9900", email: "d.cosenza@gmail.com", fase: "sopralluogo", sistema: "", tipo: "nuova", note: "Condominio 12 appartamenti, sopralluogo esplorativo per offerta.", rilievi: [], allegati: [], creato: "27 feb", aggiornato: "27 feb", log: [{ chi: "Fabio", cosa: "primo contatto telefonico", quando: "oggi", color: "#86868b" }] },
];


// Demo fatture
// Demo fatture ÔÇö matching 20 commesse
export const FATTURE_INIT = [
  { id: "fat_1", numero: 1, anno: 2026, data: "15/02/2026", dataISO: "2026-02-15", tipo: "acconto", importo: 593, cliente: "Anna Bianchi", cmId: 1002, cmCode: "S-0002", pagata: false, scadenza: "2026-03-15" },
  { id: "fat_2", numero: 2, anno: 2026, data: "10/02/2026", dataISO: "2026-02-10", tipo: "acconto", importo: 1056, cliente: "Mario Rossi", cmId: 1003, cmCode: "S-0003", pagata: true, dataPagamento: "2026-02-12", scadenza: "2026-03-10" },
  { id: "fat_3", numero: 3, anno: 2025, data: "12/12/2025", dataISO: "2025-12-12", tipo: "acconto", importo: 695, cliente: "Salvatore De Luca", cmId: 1005, cmCode: "S-0005", pagata: true, dataPagamento: "2025-12-15", scadenza: "2026-01-12" },
  { id: "fat_4", numero: 5, anno: 2026, data: "20/02/2026", dataISO: "2026-02-20", tipo: "saldo", importo: 1235.5, cliente: "Salvatore De Luca", cmId: 1005, cmCode: "S-0005", pagata: true, dataPagamento: "2026-02-22", scadenza: "2026-03-20" },
  { id: "fat_5", numero: 4, anno: 2026, data: "22/01/2026", dataISO: "2026-01-22", tipo: "acconto", importo: 810, cliente: "Laura Esposito", cmId: 1004, cmCode: "S-0004", pagata: true, dataPagamento: "2026-01-25", scadenza: "2026-02-22" },
  { id: "fat_6", numero: 6, anno: 2026, data: "08/01/2026", dataISO: "2026-01-08", tipo: "acconto", importo: 1920, cliente: "Francesca Romano", cmId: 1006, cmCode: "S-0006", pagata: true, dataPagamento: "2026-01-10", scadenza: "2026-02-08" },
  { id: "fat_7", numero: 7, anno: 2026, data: "10/01/2026", dataISO: "2026-01-10", tipo: "acconto", importo: 1728, cliente: "Roberto Mancini", cmId: 1009, cmCode: "S-0009", pagata: true, dataPagamento: "2026-01-12", scadenza: "2026-02-10" },
  { id: "fat_8", numero: 8, anno: 2026, data: "12/01/2026", dataISO: "2026-01-12", tipo: "acconto", importo: 2160, cliente: "Francesco Greco", cmId: 1010, cmCode: "S-0010", pagata: false, scadenza: "2026-02-28" },
  { id: "fat_9", numero: 9, anno: 2025, data: "15/11/2025", dataISO: "2025-11-15", tipo: "unica", importo: 1782, cliente: "Paolo Valentino", cmId: 1012, cmCode: "S-0012", pagata: true, dataPagamento: "2025-12-15", scadenza: "2025-12-15" },
  { id: "fat_10", numero: 10, anno: 2025, data: "20/12/2025", dataISO: "2025-12-20", tipo: "unica", importo: 4400, cliente: "Andrea Colombo", cmId: 1013, cmCode: "S-0013", pagata: true, dataPagamento: "2025-12-22", scadenza: "2026-01-20" },
  { id: "fat_11", numero: 11, anno: 2025, data: "10/01/2026", dataISO: "2026-01-10", tipo: "unica", importo: 2904, cliente: "Teresa Catanzaro", cmId: 1014, cmCode: "S-0014", pagata: true, dataPagamento: "2026-01-12" },
  { id: "fat_12", numero: 12, anno: 2026, data: "25/01/2026", dataISO: "2026-01-25", tipo: "unica", importo: 7920, cliente: "Vincenzo Pinto", cmId: 1015, cmCode: "S-0015", pagata: true, dataPagamento: "2026-01-28" },
  { id: "fat_13", numero: 13, anno: 2026, data: "15/02/2026", dataISO: "2026-02-15", tipo: "unica", importo: 2464, cliente: "Giovanna Ferrara", cmId: 1016, cmCode: "S-0016", pagata: false, scadenza: "2026-03-15" },
  { id: "fat_14", numero: 14, anno: 2026, data: "20/02/2026", dataISO: "2026-02-20", tipo: "acconto", importo: 1350, cliente: "Maria Rosa Pellegrini", cmId: 1019, cmCode: "S-0019", pagata: true, dataPagamento: "2026-02-22", scadenza: "2026-03-20" },
];


// Demo ordini fornitore
// Demo ordini fornitore ÔÇö matching 20 commesse
export const ORDINI_INIT = [
  { id: "ord_1", cmId: 1003, cmCode: "S-0003", cliente: "Mario Rossi", fornitore: { id: "f1", nome: "Aluplast Italia" }, totale: 1200, totaleIva: 1464, stato: "inviato", dataInvio: "2026-02-20", conferma: { ricevuta: false }, consegna: { settimane: 4, prevista: "2026-03-20" } },
  { id: "ord_2", cmId: 1004, cmCode: "S-0004", cliente: "Laura Esposito", fornitore: { id: "f1", nome: "Aluplast Italia" }, totale: 970, totaleIva: 1183.4, stato: "confermato", dataInvio: "2026-01-22", conferma: { ricevuta: true, nomeFile: "Conferma_Aluplast_8821.pdf", dataRicezione: "2026-01-25" }, consegna: { settimane: 5, prevista: "2026-02-28" } },
  { id: "ord_3", cmId: 1005, cmCode: "S-0005", cliente: "Salvatore De Luca", fornitore: { id: "f2", nome: "Sch├╝co International" }, totale: 1298, totaleIva: 1583.56, stato: "consegnato", dataInvio: "2025-12-13", conferma: { ricevuta: true, nomeFile: "Conferma_Schuco_12345.pdf", dataRicezione: "2025-12-16" }, consegna: { settimane: 7, prevista: "2026-01-30" } },
  { id: "ord_4", cmId: 1006, cmCode: "S-0006", cliente: "Francesca Romano", fornitore: { id: "f5", nome: "Rehau Italia" }, totale: 2100, totaleIva: 2562, stato: "consegnato", dataInvio: "2026-01-10", conferma: { ricevuta: true, nomeFile: "Conferma_Rehau_9987.pdf", dataRicezione: "2026-01-14" }, consegna: { settimane: 5, prevista: "2026-02-14" } },
  { id: "ord_5", cmId: 1009, cmCode: "S-0009", cliente: "Roberto Mancini", fornitore: { id: "f1", nome: "Aluplast Italia" }, totale: 1850, totaleIva: 2257, stato: "confermato", dataInvio: "2026-01-28", conferma: { ricevuta: true, nomeFile: "Conferma_Aluplast_9102.pdf", dataRicezione: "2026-02-01" }, consegna: { settimane: 6, prevista: "2026-03-12" } },
  { id: "ord_6", cmId: 1010, cmCode: "S-0010", cliente: "Francesco Greco", fornitore: { id: "f2", nome: "Sch├╝co International" }, totale: 2800, totaleIva: 3416, stato: "consegnato", dataInvio: "2026-01-12", conferma: { ricevuta: true }, consegna: { settimane: 6, prevista: "2026-02-22" } },
  { id: "ord_7", cmId: 1019, cmCode: "S-0019", cliente: "Maria Rosa Pellegrini", fornitore: { id: "f1", nome: "Aluplast Italia" }, totale: 1500, totaleIva: 1830, stato: "inviato", dataInvio: "2026-02-22", conferma: { ricevuta: false }, consegna: { settimane: 5, prevista: "2026-03-28" } },
];


// Demo montaggi
// Demo montaggi ÔÇö matching 20 commesse
export const MONTAGGI_INIT = [
  { id: "m_1", cmId: 1005, cmCode: "S-0005", cliente: "Salvatore De Luca", vani: 3, data: "2026-02-17", orario: "08:00", durata: "2g", giorni: 2, squadraId: "sq1", stato: "completato", note: "Completato senza problemi." },
  { id: "m_2", cmId: 1006, cmCode: "S-0006", cliente: "Francesca Romano", vani: 8, data: "2026-03-03", orario: "07:30", durata: "3g", giorni: 3, squadraId: "sq1", stato: "programmato", note: "Villa bifamiliare, 2 piani." },
  { id: "m_3", cmId: 1010, cmCode: "S-0010", cliente: "Francesco Greco", vani: 6, data: "2026-03-06", orario: "08:00", durata: "2g", giorni: 2, squadraId: "sq2", stato: "programmato", note: "Ufficio, 6 finestre grandi." },
  { id: "m_4", cmId: 1009, cmCode: "S-0009", cliente: "Roberto Mancini", vani: 8, data: "2026-03-16", orario: "07:00", durata: "4g", giorni: 4, squadraId: "sq1", stato: "programmato", note: "Villa campagna, 8 infissi." },
  { id: "m_5", cmId: 1003, cmCode: "S-0003", cliente: "Mario Rossi", vani: 4, data: "2026-03-24", orario: "08:00", durata: "2g", giorni: 2, squadraId: "sq1", stato: "programmato", note: "3┬░ piano con argano." },
  { id: "m_6", cmId: 1012, cmCode: "S-0012", cliente: "Paolo Valentino", vani: 3, data: "2026-01-08", orario: "08:00", durata: "1g", giorni: 1, squadraId: "sq2", stato: "completato", note: "3 finestre, completato." },
  { id: "m_7", cmId: 1013, cmCode: "S-0013", cliente: "Andrea Colombo", vani: 4, data: "2025-12-15", orario: "08:00", durata: "2g", giorni: 2, squadraId: "sq1", stato: "completato", note: "4 portefinestre." },
  { id: "m_8", cmId: 1014, cmCode: "S-0014", cliente: "Teresa Catanzaro", vani: 3, data: "2026-01-28", orario: "08:00", durata: "1.5g", giorni: 1.5, squadraId: "sq2", stato: "completato", note: "" },
  { id: "m_9", cmId: 1015, cmCode: "S-0015", cliente: "Vincenzo Pinto", vani: 10, data: "2026-01-14", orario: "07:00", durata: "5g", giorni: 5, squadraId: "sq1", stato: "completato", note: "Villa 10 vani." },
  { id: "m_10", cmId: 1016, cmCode: "S-0016", cliente: "Giovanna Ferrara", vani: 2, data: "2026-02-06", orario: "09:00", durata: "0.5g", giorni: 0.5, squadraId: "sq2", stato: "completato", note: "2 portefinestre." },
  { id: "m_11", cmId: 1004, cmCode: "S-0004", cliente: "Laura Esposito", vani: 3, data: "2026-03-10", orario: "08:00", durata: "1.5g", giorni: 1.5, squadraId: "sq2", stato: "programmato", note: "Villa PT, accesso giardino." },
  { id: "m_12", cmId: 1019, cmCode: "S-0019", cliente: "Maria Rosa Pellegrini", vani: 7, data: "2026-04-07", orario: "07:30", durata: "3g", giorni: 3, squadraId: "sq1", stato: "programmato", note: "Villetta, 5F+2PF." },
];


export const TASKS_INIT = [
  { id: 1, text: "Chiamare Verdi per sopralluogo", meta: "Fissare data", time: "", priority: "alta", cm: "S-0001", date: "2026-02-28", persona: "Giuseppe Verdi", done: false, allegati: [] },
  { id: 2, text: "Preparare preventivo Bianchi", meta: "4 vani, IVA 10%", time: "", priority: "alta", cm: "S-0002", date: "2026-02-28", persona: "Anna Bianchi", done: false, allegati: [] },
  { id: 3, text: "Ordinare materiale Rossi", meta: "Aluplast Ideal 7000, 4 vani", time: "", priority: "media", cm: "S-0003", date: "2026-03-01", persona: "", done: false, allegati: [] },
  { id: 4, text: "Controllare consegna Esposito", meta: "Prevista 28/02", time: "", priority: "media", cm: "S-0004", date: "2026-02-28", persona: "", done: false, allegati: [] },
  { id: 5, text: "Programmare montaggio Romano", meta: "8 vani, 3 giorni", time: "", priority: "alta", cm: "S-0006", date: "2026-03-01", persona: "", done: false, allegati: [] },
  { id: 6, text: "Tornare per misure Greco Lucia", meta: "3 vani mancanti", time: "", priority: "media", cm: "S-0008", date: "2026-03-03", persona: "Lucia Greco", done: false, allegati: [] },
  { id: 7, text: "Richiedere autoscala per Greco", meta: "5┬░ piano", time: "", priority: "alta", cm: "S-0008", date: "2026-03-02", persona: "", done: false, allegati: [] },
  { id: 8, text: "Sopralluogo Ferraro passaparola", meta: "6 finestre", time: "", priority: "media", cm: "S-0007", date: "2026-03-04", persona: "Marco Ferraro", done: false, allegati: [] },
  { id: 9, text: "Far firmare preventivo Scalia", meta: "Studio legale", time: "", priority: "alta", cm: "S-0018", date: "2026-03-01", persona: "Antonio Scalia", done: false, allegati: [] },
  { id: 10, text: "Sopralluogo condominio Cosenza", meta: "12 appartamenti", time: "", priority: "media", cm: "S-0020", date: "2026-03-05", persona: "Domenico Cosenza", done: false, allegati: [] },
];



// === AI INBOX ÔÇö email in arrivo con classificazione AI ===
export const AI_INBOX_INIT = [];

export const MSGS_INIT = [
  { id: "msg1", from: "Salvatore De Luca", preview: "Buongiorno, quando possiamo fissare il montaggio?", time: "09:15", date: "2025-12-12", cm: "S-0005", read: true, canale: "whatsapp",
    thread: [{ who: "Salvatore De Luca", text: "Buongiorno, quando possiamo fissare il montaggio?", time: "09:15", date: "12/12", canale: "whatsapp" },
             { who: "Tu", text: "Buongiorno Salvatore! Materiale arriva il 10 febbraio, montaggio previsto settimana del 17.", time: "09:22", date: "12/12", canale: "whatsapp" },
             { who: "Salvatore De Luca", text: "Perfetto, grazie mille", time: "09:30", date: "12/12", canale: "whatsapp" }] },
  { id: "msg2", from: "Anna Bianchi", preview: "Ho ricevuto il preventivo, vorrei procedere", time: "14:30", date: "2026-01-20", cm: "S-0002", read: true, canale: "email",
    thread: [{ who: "Anna Bianchi", text: "Buongiorno, ho ricevuto il preventivo per le 4 finestre. Vorrei procedere con l'ordine. Possiamo fissare un appuntamento per la firma?", time: "14:30", date: "20/01", canale: "email" },
             { who: "Tu", text: "Gentile Anna, perfetto! Le propongo gioved├¼ prossimo alle 10:00 nel nostro showroom. Le confermo che il prezzo include IVA 10%.", time: "15:45", date: "20/01", canale: "email" }] },
  { id: "msg3", from: "Mario Rossi", preview: "Confermo disponibilit├á per il sopralluogo", time: "11:00", date: "2026-02-10", cm: "S-0003", read: true, canale: "whatsapp",
    thread: [{ who: "Tu", text: "Buongiorno Mario, il materiale ├¿ in produzione. Prevediamo consegna tra 3 settimane.", time: "10:45", date: "10/02", canale: "whatsapp" },
             { who: "Mario Rossi", text: "Confermo disponibilit├á per il sopralluogo di venerd├¼", time: "11:00", date: "10/02", canale: "whatsapp" }] },
  { id: "msg4", from: "Laura Esposito", preview: "Le finestre sono bellissime, grazie!", time: "16:20", date: "2026-02-20", cm: "S-0004", read: false, canale: "whatsapp",
    thread: [{ who: "Laura Esposito", text: "Le finestre sono bellissime, grazie! Volevo chiedere informazioni sulla manutenzione.", time: "16:20", date: "20/02", canale: "whatsapp" }] },
  { id: "msg5", from: "Francesca Romano", preview: "Conferma montaggio 3 marzo", time: "08:30", date: "2026-02-25", cm: "S-0006", read: false, canale: "sms",
    thread: [{ who: "Tu", text: "Gentile Francesca, confermiamo il montaggio per luned├¼ 3 marzo. La squadra arriver├á alle 8:00.", time: "08:30", date: "25/02", canale: "sms" },
             { who: "Francesca Romano", text: "Perfetto, saremo presenti. Grazie", time: "09:10", date: "25/02", canale: "sms" }] },
  { id: "msg6", from: "Paolo Valentino", preview: "Fattura ricevuta, pagamento effettuato", time: "10:00", date: "2025-11-18", cm: "S-0012", read: true, canale: "email",
    thread: [{ who: "Tu", text: "Gentile Paolo, in allegato la fattura per i lavori completati. Cordiali saluti.", time: "09:00", date: "18/11", canale: "email" },
             { who: "Paolo Valentino", text: "Fattura ricevuta, pagamento effettuato tramite bonifico. Grazie per l'ottimo lavoro!", time: "10:00", date: "18/11", canale: "email" }] },
  { id: "msg7", from: "Andrea Colombo", preview: "Quando arriva il materiale Rehau?", time: "17:45", date: "2025-11-25", cm: "S-0013", read: true, canale: "whatsapp",
    thread: [{ who: "Andrea Colombo", text: "Quando arriva il materiale Rehau?", time: "17:45", date: "25/11", canale: "whatsapp" },
             { who: "Tu", text: "Il materiale ├¿ in consegna per il 2 dicembre. La terremo aggiornato.", time: "18:00", date: "25/11", canale: "whatsapp" },
             { who: "Andrea Colombo", text: "Ottimo, grazie", time: "18:05", date: "25/11", canale: "whatsapp" }] },
  { id: "msg8", from: "Vincenzo Pinto", preview: "Documentazione Superbonus completata", time: "11:30", date: "2026-01-10", cm: "S-0015", read: true, canale: "email",
    thread: [{ who: "Tu", text: "Gentile Vincenzo, le comunichiamo che la documentazione Superbonus ├¿ stata completata e inviata all'ENEA.", time: "11:30", date: "10/01", canale: "email" },
             { who: "Vincenzo Pinto", text: "Ricevuto, grazie per la gestione impeccabile della pratica.", time: "14:00", date: "10/01", canale: "email" }] },
  { id: "msg9", from: "Roberto Mancini", preview: "Possiamo spostare il montaggio?", time: "07:45", date: "2026-02-28", cm: "S-0009", read: false, canale: "whatsapp",
    thread: [{ who: "Roberto Mancini", text: "Buongiorno, ├¿ possibile spostare il montaggio di una settimana? Ho un imprevisto.", time: "07:45", date: "28/02", canale: "whatsapp" }] },
  { id: "msg10", from: "Giuseppe Verdi", preview: "Richiesta sopralluogo nuove finestre", time: "15:00", date: "2026-02-26", cm: "S-0001", read: false, canale: "email",
    thread: [{ who: "Giuseppe Verdi", text: "Buongiorno, vorrei richiedere un sopralluogo per la sostituzione di 6 finestre del mio appartamento. Quando sarebbe disponibile?", time: "15:00", date: "26/02", canale: "email" }] },
];

export const TEAM_INIT = [
  { id: 1, nome: "", ruolo: "Titolare", compiti: "Gestione commesse, preventivi, rapporti clienti", colore: "#0D7C6B" },
];

export const CONTATTI_INIT = [
  { id: "ct1", nome: "Giuseppe", cognome: "Verdi", telefono: "347 555 1234", email: "giuseppe.verdi@email.it", indirizzo: "Via Garibaldi 12, Rende", tipo: "cliente", preferito: false },
  { id: "ct2", nome: "Anna", cognome: "Bianchi", telefono: "339 888 5678", email: "anna.bianchi@gmail.com", indirizzo: "Corso Mazzini 88, Cosenza", tipo: "cliente", preferito: true },
  { id: "ct3", nome: "Mario", cognome: "Rossi", telefono: "320 111 4567", email: "mario.rossi@libero.it", indirizzo: "Via Roma 42, Cosenza", tipo: "cliente", preferito: true },
  { id: "ct4", nome: "Laura", cognome: "Esposito", telefono: "333 222 8888", email: "laura.esposito@yahoo.it", indirizzo: "Viale Trieste 5, Rende", tipo: "cliente", preferito: false },
  { id: "ct5", nome: "Salvatore", cognome: "De Luca", telefono: "329 456 7890", email: "s.deluca@gmail.com", indirizzo: "Corso Italia 22, Cosenza", tipo: "cliente", preferito: true },
  { id: "ct6", nome: "Francesca", cognome: "Romano", telefono: "340 777 3333", email: "f.romano@outlook.it", indirizzo: "Via Popilia 156, Cosenza", tipo: "cliente", preferito: false },
  { id: "ct7", nome: "Marco", cognome: "Ferraro", telefono: "335 444 9999", email: "m.ferraro@gmail.com", indirizzo: "Via dei Mille 33, Rende", tipo: "cliente", preferito: false },
  { id: "ct8", nome: "Roberto", cognome: "Mancini", telefono: "347 888 1111", email: "", indirizzo: "Contrada San Vito, Mendicino", tipo: "cliente", preferito: false },
  { id: "ct9", nome: "Francesco", cognome: "Greco", telefono: "339 555 6666", email: "f.greco@gmail.com", indirizzo: "Via Calabria 77, Cosenza", tipo: "cliente", preferito: false },
  { id: "ct10", nome: "Paolo", cognome: "Valentino", telefono: "348 222 3333", email: "", indirizzo: "Via Caloprese 15, Cosenza", tipo: "cliente", preferito: false },
  { id: "ct11", nome: "Andrea", cognome: "Colombo", telefono: "320 444 5555", email: "", indirizzo: "Via degli Stadi 45, Rende", tipo: "cliente", preferito: false },
  { id: "ct12", nome: "Maria Rosa", cognome: "Pellegrini", telefono: "349 777 1122", email: "", indirizzo: "Via Casali 8, Castrolibero", tipo: "cliente", preferito: false },
  { id: "ct13", nome: "Domenico", cognome: "Cosenza", telefono: "340 888 9900", email: "d.cosenza@gmail.com", indirizzo: "Via dei Normanni 30, Cosenza", tipo: "cliente", preferito: false },
  { id: "ct14", nome: "Antonio", cognome: "Scalia", telefono: "320 555 8899", email: "a.scalia@studio.it", indirizzo: "Corso Umberto 120, Cosenza", tipo: "cliente", preferito: false },
  { id: "ct15", nome: "Marco", cognome: "Rossi", telefono: "+39 045 123456", email: "m.rossi@aluplast.it", azienda: "Aluplast Italia", tipo: "fornitore", preferito: true },
  { id: "ct16", nome: "Luca", cognome: "Bianchi", telefono: "+39 335 7654321", email: "l.bianchi@schueco.com", azienda: "Sch├╝co International", tipo: "fornitore", preferito: true },
];


export const COLORI_INIT = [
  { id: 1, nome: "Bianco", code: "RAL 9010", hex: "#f5f5f0", tipo: "RAL" },
  { id: 2, nome: "Grigio antracite", code: "RAL 7016", hex: "#383e42", tipo: "RAL" },
  { id: 3, nome: "Nero", code: "RAL 9005", hex: "#0e0e10", tipo: "RAL" },
  { id: 4, nome: "Marrone", code: "RAL 8014", hex: "#4a3728", tipo: "RAL" },
  { id: 5, nome: "Noce", code: "Noce", hex: "#6b4226", tipo: "Legno" },
  { id: 6, nome: "Rovere", code: "Rovere", hex: "#a0784a", tipo: "Legno" },
];

export const SISTEMI_INIT = [
  { id: 1, marca: "Aluplast", sistema: "Ideal 4000", euroMq: 180, prezzoMq: 180, sovRAL: 12, sovLegno: 22, minimiMq: { "1anta": 1.5, "2ante": 2.0, "3ante": 2.8, "scorrevole": 3.5, "fisso": 1.0 }, colori: ["RAL 9010", "RAL 7016", "RAL 9005", "Noce"], sottosistemi: ["Classicline", "Roundline"], griglia: [
    { l: 600, h: 600, prezzo: 120 }, { l: 600, h: 800, prezzo: 145 }, { l: 600, h: 1000, prezzo: 170 }, { l: 600, h: 1200, prezzo: 195 },
    { l: 800, h: 800, prezzo: 175 }, { l: 800, h: 1000, prezzo: 205 }, { l: 800, h: 1200, prezzo: 240 }, { l: 800, h: 1400, prezzo: 270 },
    { l: 1000, h: 1000, prezzo: 250 }, { l: 1000, h: 1200, prezzo: 290 }, { l: 1000, h: 1400, prezzo: 330 }, { l: 1000, h: 1600, prezzo: 370 },
    { l: 1200, h: 1200, prezzo: 340 }, { l: 1200, h: 1400, prezzo: 385 }, { l: 1200, h: 1600, prezzo: 430 }, { l: 1200, h: 1800, prezzo: 480 },
    { l: 1400, h: 1400, prezzo: 430 }, { l: 1400, h: 1600, prezzo: 485 }, { l: 1400, h: 2200, prezzo: 580 },
  ] },
  { id: 2, marca: "Sch├╝co", sistema: "CT70", euroMq: 280, prezzoMq: 280, sovRAL: 15, sovLegno: 25, minimiMq: { "1anta": 1.5, "2ante": 2.0, "scorrevole": 3.5 }, colori: ["RAL 9010", "RAL 7016", "RAL 9005"], sottosistemi: ["Classic", "Rondo"], griglia: [
    { l: 600, h: 800, prezzo: 195 }, { l: 600, h: 1200, prezzo: 260 },
    { l: 800, h: 1000, prezzo: 275 }, { l: 800, h: 1400, prezzo: 365 },
    { l: 1000, h: 1200, prezzo: 380 }, { l: 1000, h: 1400, prezzo: 440 },
    { l: 1200, h: 1400, prezzo: 520 }, { l: 1200, h: 1600, prezzo: 580 },
    { l: 1400, h: 2200, prezzo: 780 },
  ] },
  { id: 3, marca: "Rehau", sistema: "S80", euroMq: 220, prezzoMq: 220, sovRAL: 12, sovLegno: 20, minimiMq: { "1anta": 1.5, "2ante": 2.0 }, colori: ["RAL 9010", "RAL 7016", "Noce"], sottosistemi: ["Geneo", "Synego"], griglia: [] },
  { id: 4, marca: "Finstral", sistema: "FIN-Project", euroMq: 350, prezzoMq: 350, sovRAL: 18, sovLegno: 30, minimiMq: { "1anta": 1.5, "2ante": 2.2, "scorrevole": 4.0 }, colori: ["RAL 9010", "RAL 7016", "RAL 9005", "Rovere"], sottosistemi: ["Nova-line", "Step-line"], griglia: [] },
];

export const VETRI_INIT = [
  { id: 1, nome: "Doppio basso emissivo", code: "4/16/4 BE", ug: 1.1, prezzoMq: 45 },
  { id: 2, nome: "Triplo basso emissivo", code: "4/12/4/12/4 BE", ug: 0.6, prezzoMq: 75 },
  { id: 3, nome: "Doppio sicurezza", code: "33.1/16/4 BE", ug: 1.1, prezzoMq: 65 },
  { id: 4, nome: "Triplo sicurezza", code: "33.1/12/4/12/4 BE", ug: 0.6, prezzoMq: 90 },
  { id: 5, nome: "Satinato", code: "4/16/4 SAT", ug: 1.1, prezzoMq: 55 },
  { id: 6, nome: "Fonoisolante", code: "44.2/20/6 BE", ug: 1.0, prezzoMq: 110 },
];

export const TIPOLOGIE_RAPIDE = [
  // Finestre
  { code: "F1A",    label: "Finestra 1 anta",           icon: "columns", cat: "Finestre", settore: "serramenti" },
  { code: "F2A",    label: "Finestra 2 ante",            icon: "columns", cat: "Finestre", settore: "serramenti" },
  { code: "F3A",    label: "Finestra 3 ante",            icon: "columns", cat: "Finestre", settore: "serramenti" },
  { code: "F4A",    label: "Finestra 4 ante",            icon: "columns", cat: "Finestre", settore: "serramenti" },
  { code: "F2AFISDX", label: "Finestra 2A + Fisso DX",  icon: "columns", cat: "Finestre", settore: "serramenti" },
  { code: "F2AFISSX", label: "Finestra 2A + Fisso SX",  icon: "columns", cat: "Finestre", settore: "serramenti" },
  { code: "FISDX",  label: "Fisso DX",                  icon: "square",  cat: "Finestre", settore: "serramenti" },
  { code: "FISSX",  label: "Fisso SX",                  icon: "square",  cat: "Finestre", settore: "serramenti" },
  { code: "VAS",    label: "Vasistas",                  icon: "chevronDown",  cat: "Finestre", settore: "serramenti" },
  { code: "RIBALTA",label: "Ribalta",                   icon: "chevronUp",  cat: "Finestre", settore: "serramenti" },
  // Balconi / Portafinestre
  { code: "PF1A",   label: "Balcone 1 anta",            icon: "door", cat: "Balconi", settore: "serramenti" },
  { code: "PF2A",   label: "Balcone 2 ante",            icon: "door", cat: "Balconi", settore: "serramenti" },
  { code: "PF3A",   label: "Balcone 3 ante",            icon: "door", cat: "Balconi", settore: "serramenti" },
  { code: "PF4A",   label: "Balcone 4 ante",            icon: "door", cat: "Balconi", settore: "serramenti" },
  { code: "PF2AFISDX", label: "Balcone 2A + Fisso DX", icon: "door", cat: "Balconi", settore: "serramenti" },
  { code: "PF2AFISSX", label: "Balcone 2A + Fisso SX", icon: "door", cat: "Balconi", settore: "serramenti" },
  // Scorrevoli / Alzanti
  { code: "SC2A",   label: "Scorrevole 2 ante",         icon: "arrowLeftRight", cat: "Scorrevoli", settore: "serramenti" },
  { code: "SC4A",   label: "Scorrevole 4 ante",         icon: "arrowLeftRight", cat: "Scorrevoli", settore: "serramenti" },
  { code: "SCRDX",  label: "Scorrevole DX",             icon: "chevronRight",  cat: "Scorrevoli", settore: "serramenti" },
  { code: "SCRSX",  label: "Scorrevole SX",             icon: "chevronLeft",  cat: "Scorrevoli", settore: "serramenti" },
  { code: "ALZDX",  label: "Alzante DX",                icon: "chevronUp",  cat: "Scorrevoli", settore: "serramenti" },
  { code: "ALZSX",  label: "Alzante SX",                icon: "chevronUp",  cat: "Scorrevoli", settore: "serramenti" },
  // Persiane / Oscuramenti
  { code: "PERS1A", label: "Persiana 1 anta",           icon: "layers", cat: "Persiane", settore: "persiane" },
  { code: "PERS2A", label: "Persiana 2 ante",           icon: "layers", cat: "Persiane", settore: "persiane" },
  { code: "PERS3A", label: "Persiana 3 ante",           icon: "layers", cat: "Persiane", settore: "persiane" },
  { code: "PERSOR", label: "Persiana orientabile",      icon: "refreshCw", cat: "Persiane", settore: "persiane" },
  { code: "SCURO1", label: "Scuro 1 anta",              icon: "door", cat: "Persiane", settore: "persiane" },
  { code: "SCURO2", label: "Scuro 2 ante",              icon: "door", cat: "Persiane", settore: "persiane" },
  // Tapparelle / Avvolgibili
  { code: "TAPP",   label: "Tapparella",                icon: "chevronDown",  cat: "Tapparelle", settore: "tapparelle" },
  { code: "TAPPAL", label: "Tapparella alluminio",      icon: "chevronDown",  cat: "Tapparelle", settore: "tapparelle" },
  { code: "TAPPPVC",label: "Tapparella PVC",            icon: "chevronDown",  cat: "Tapparelle", settore: "tapparelle" },
  { code: "TAPPBL", label: "Tapparella blindata",       icon: "shield", cat: "Tapparelle", settore: "tapparelle" },
  { code: "TAPPMOT",label: "Tapparella motorizzata",    icon: "zap", cat: "Tapparelle", settore: "tapparelle" },
  { code: "ORIENTA",label: "Avvolgibile orientabile",   icon: "refreshCw", cat: "Tapparelle", settore: "tapparelle" },
  { code: "CASS",   label: "Cassonetto",                icon: "box", cat: "Tapparelle", settore: "tapparelle" },
  // Zanzariere
  { code: "ZANZLAT",label: "Zanzariera laterale",       icon: "grid", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZVER",label: "Zanzariera verticale",      icon: "grid", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZPLI",label: "Zanzariera pliss├®",         icon: "grid", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZBAT",label: "Zanzariera battente",       icon: "grid", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZFIX",label: "Zanzariera fissa",          icon: "grid", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZMAG",label: "Zanzariera magnetica",      icon: "zap", cat: "Zanzariere", settore: "zanzariere" },
  { code: "ZANZ2A", label: "Zanzariera 2 ante pliss├®",  icon: "grid", cat: "Zanzariere", settore: "zanzariere" },
  // Tende da sole
  { code: "TDBR",   label: "Tenda a bracci",            icon: "sun", cat: "Tende da sole", settore: "tende" },
  { code: "TDCAD",  label: "Tenda a caduta",            icon: "sun", cat: "Tende da sole", settore: "tende" },
  { code: "TDCAP",  label: "Cappottina",                icon: "sun", cat: "Tende da sole", settore: "tende" },
  { code: "TDVER",  label: "Tenda verticale",           icon: "sun", cat: "Tende da sole", settore: "tende" },
  { code: "TDRUL",  label: "Tenda a rullo",             icon: "sun", cat: "Tende da sole", settore: "tende" },
  { code: "TDPERG", label: "Pergola bioclimatica",      icon: "building", cat: "Tende da sole", settore: "tende" },
  { code: "TDZIP",  label: "Tenda ZIP / Screen",        icon: "sun", cat: "Tende da sole", settore: "tende" },
  { code: "TDVELA", label: "Vela ombreggiante",         icon: "maximize", cat: "Tende da sole", settore: "tende" },
  { code: "VENEZIA",label: "Veneziana",                 icon: "grid",  cat: "Tende da sole", settore: "tende" },
  // Box doccia
  { code: "BXNIC",  label: "Box doccia nicchia",        icon: "droplets", cat: "Box doccia", settore: "boxdoccia" },
  { code: "BXANG",  label: "Box doccia angolare",       icon: "droplets", cat: "Box doccia", settore: "boxdoccia" },
  { code: "BXWALK", label: "Walk-in",                   icon: "droplets", cat: "Box doccia", settore: "boxdoccia" },
  { code: "BXVAS",  label: "Parete vasca",              icon: "layers", cat: "Box doccia", settore: "boxdoccia" },
  { code: "BXSEM",  label: "Box semicircolare",         icon: "droplets", cat: "Box doccia", settore: "boxdoccia" },
  { code: "BXPENT", label: "Box pentagonale",           icon: "droplets", cat: "Box doccia", settore: "boxdoccia" },
  { code: "PIATTO", label: "Piatto doccia",             icon: "square", cat: "Box doccia", settore: "boxdoccia" },
  // Porte
  { code: "PTINT1", label: "Porta interna battente",    icon: "door", cat: "Porte", settore: "porte" },
  { code: "PTINT2", label: "Porta interna 2 ante",      icon: "door", cat: "Porte", settore: "porte" },
  { code: "PTSCO",  label: "Porta scorrevole",          icon: "arrowLeftRight", cat: "Porte", settore: "porte" },
  { code: "PTSCC",  label: "Porta scorrevole a scomparsa", icon: "arrowLeftRight", cat: "Porte", settore: "porte" },
  { code: "PTFIL",  label: "Porta filomuro",            icon: "square",  cat: "Porte", settore: "porte" },
  { code: "PTSOF",  label: "Porta a soffietto",         icon: "layers", cat: "Porte", settore: "porte" },
  { code: "BLI",    label: "Porta blindata",            icon: "shield", cat: "Porte", settore: "porte" },
  { code: "PTSEZ",  label: "Portone sezionale",         icon: "home", cat: "Porte", settore: "porte" },
  // Altro
  { code: "SOPR",   label: "Sopraluce",                 icon: "triangle",  cat: "Altro", settore: "serramenti" },
  { code: "MONO",   label: "Monoblocco",                icon: "square",  cat: "Altro", settore: "serramenti" },
  { code: "GRATA",  label: "Grata di sicurezza",        icon: "lock", cat: "Altro", settore: "serramenti" },
  { code: "CANCSING", label: "Cancello battente",        icon: "building", cat: "Cancelli", settore: "cancelli" },
  { code: "CANCDOPP", label: "Cancello doppio",          icon: "building", cat: "Cancelli", settore: "cancelli" },
  { code: "CANCSCOR", label: "Cancello scorrevole",      icon: "building", cat: "Cancelli", settore: "cancelli" },
  { code: "CANCPED",  label: "Pedonale",                 icon: "user", cat: "Cancelli", settore: "cancelli" },
  { code: "CANCCP",   label: "Carraio + pedonale",       icon: "building", cat: "Cancelli", settore: "cancelli" },
  { code: "RECINZ",   label: "Recinzione pannelli",      icon: "grid", cat: "Cancelli", settore: "cancelli" },
  { code: "RINGH",    label: "Ringhiera",                icon: "settings", cat: "Cancelli", settore: "cancelli" },
  { code: "PARAP",    label: "Parapetto",                icon: "settings", cat: "Cancelli", settore: "cancelli" },
  { code: "VERANDA",label: "Veranda / Vetrata",         icon: "home", cat: "Altro", settore: "serramenti" },
];

// === SETTORI / CATEGORIE ATTIVABILI ===
export const SETTORI = [
  { id: "serramenti", label: "Finestre e Serramenti", icon: "columns", desc: "Finestre, balconi, scorrevoli, alzanti, fissi" },
  { id: "porte", label: "Porte", icon: "door", desc: "Porte interne, blindate, scorrevoli, sezionali" },
  { id: "persiane", label: "Persiane e Scuri", icon: "layers", desc: "Persiane in alluminio, legno, PVC, scuri" },
  { id: "tapparelle", label: "Tapparelle e Avvolgibili", icon: "chevronDown", desc: "Tapparelle, cassonetti, motorizzazioni" },
  { id: "zanzariere", label: "Zanzariere", icon: "grid", desc: "Laterali, verticali, pliss├®, battenti, magnetiche" },
  { id: "tende", label: "Tende da Sole", icon: "sun", desc: "Bracci, caduta, cappottine, pergole, ZIP, veneziane" },
  { id: "boxdoccia", label: "Box Doccia", icon: "droplets", desc: "Nicchia, angolari, walk-in, pareti vasca" },
  { id: "cancelli", label: "Cancelli e Recinzioni", icon: "building", desc: "Battenti, scorrevoli, recinzioni, ringhiere, automazioni" },
  { id: "strutture", label: "Strutture", icon: "building", desc: "Pergole, verande, pensiline, box alluminio, ferro" },
];

export const SETTORI_DEFAULT = ["serramenti", "persiane", "tapparelle", "zanzariere"]; // serramentista classico

export const COPRIFILI_INIT = [
  { id: 1, nome: "Coprifilo piatto 40mm", cod: "CP40", prezzoMl: 4.5 },
  { id: 2, nome: "Coprifilo piatto 50mm", cod: "CP50", prezzoMl: 5.5 },
  { id: 3, nome: "Coprifilo piatto 70mm", cod: "CP70", prezzoMl: 7.0 },
  { id: 4, nome: "Coprifilo angolare 40mm", cod: "CA40", prezzoMl: 5.0 },
  { id: 5, nome: "Coprifilo a Z 50mm", cod: "CZ50", prezzoMl: 6.0 },
];

export const LAMIERE_INIT = [
  { id: 1, nome: "Lamiera davanzale 200mm", cod: "LD200", prezzoMl: 8.0 },
  { id: 2, nome: "Lamiera davanzale 250mm", cod: "LD250", prezzoMl: 9.5 },
  { id: 3, nome: "Lamiera davanzale 300mm", cod: "LD300", prezzoMl: 11.0 },
  { id: 4, nome: "Scossalina 150mm", cod: "SC150", prezzoMl: 7.0 },
  { id: 5, nome: "Scossalina 200mm", cod: "SC200", prezzoMl: 8.5 },
];

/* == ICONS SVG == */
export const Ico = ({ d, s = 20, c = "#888", sw = 1.8 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
// Inline icon helper (replaces emoji spans) ÔÇö usage: <I d={ICO.package} c="#0D7C6B" />
export const I = ({ d, s = 16, c = "currentColor", sw = 2 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}>{d}</svg>
);
// Render icona da stringa-chiave ÔÇö usage: <IcoKey name="columns" s={16} c="#64748B" />
export const IcoKey = ({ name, s = 16, c = "currentColor", sw = 1.8 }: { name: string; s?: number; c?: string; sw?: number }) => {
  const d = ICO[name as keyof typeof ICO];
  if (!d) return null;
  return <Ico d={d} s={s} c={c} sw={sw} />;
};

export const ICO = {
  // Navigation
  home: <><path d="M2 12L12 3l10 9"/><path d="M5 9.5V20a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V9.5"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4M16 3v4"/><rect x="7" y="14" width="2" height="2" rx="0.5" fill="currentColor"/><rect x="11" y="14" width="2" height="2" rx="0.5" fill="currentColor"/><rect x="15" y="14" width="2" height="2" rx="0.5" fill="currentColor"/></>,
  chat: <><rect x="2" y="4" width="20" height="14" rx="2"/><path d="M7 8h10M7 12h6"/></>,
  settings: <><circle cx="12" cy="12" r="2.5"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></>,
  back: <><polyline points="15 18 9 12 15 6"/></>,
  // Actions
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  check: <><polyline points="20 6 9 17 4 12"/></>,
  checkCircle: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
  x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  // Communication
  phone: <><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></>,
  send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
  messageCircle: <><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></>,
  // Files & Docs
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></>,
  folder: <><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></>,
  clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>,
  paperclip: <><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></>,
  // Media
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>,
  image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>,
  video: <><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></>,
  mic: <><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></>,
  // Tools & Work
  pen: <><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></>,
  trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
  wrench: <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>,
  hammer: <><path d="M15 12l-8.5 8.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 010-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="M20.91 11.7l-1.25-1.25c-.6-.6-.93-1.4-.93-2.25V6.5L14.5 2.23a.5.5 0 00-.8.14l-1.02 2.45a2 2 0 00.44 2.17l5.08 4.56"/></>,
  // People
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  // Location & Map
  map: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
  mapPin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
  // Status & Alerts
  star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  alert: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  alertCircle: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>,
  info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
  // Search & Filter
  search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  filter: <><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 10h8M5 6h14M11 14h2M10 18h4"/></>,
  // Business
  package: <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  truck: <><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
  wallet: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="17" cy="15" r="1" fill="currentColor"/></>,
  factory: <><path d="M2 20V8l6 4V8l6 4V8l6 4v12H2z"/><path d="M2 20h20"/></>,
  printer: <><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></>,
  // Measurements
  ruler: <><path d="M21.73 18l-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004 21h16a2 2 0 001.73-3z"/><path d="M12 17V9"/><path d="M8 17V13"/><path d="M16 17V13"/></>,
  maximize: <><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>,
  // Misc
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  download: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  upload: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  inbox: <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
  sparkles: <><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M19 13l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13z"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
  creditCard: <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
  barChart: <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
  grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
  door: <><path d="M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2z"/><path d="M15 13a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/></>,
  columns: <><path d="M12 3v18"/><rect x="2" y="3" width="20" height="18" rx="2"/></>,
  ai: <><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>,
  paint: <><path d="M19 3H5a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/><path d="M12 11v6a2 2 0 01-2 2H8a2 2 0 01-2-2v-1"/></>,
  signatureEdit: <><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/><path d="M2 22h20"/></>,
  building: <><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/></>,
  shieldCheck: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>,
  zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
  // Additional icons for emoji replacement
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  edit: <><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></>,
  refreshCw: <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></>,
  alertTriangle: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  cpu: <><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>,
  palette: <><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12" r="1.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.04-.24-.3-.39-.65-.39-1.04 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.36-8.92-10-8.92z"/></>,
  sparkles: <><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></>,
  target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
  save: <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
  tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
  link: <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
  gem: <><polygon points="12 2 22 8.5 12 22 2 8.5 12 2"/></>,
  rocket: <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></>,
  scroll: <><path d="M8 21h12a2 2 0 002-2v-2H10v2a2 2 0 11-4 0V5a2 2 0 012-2h14v14"/></>,
  euro: <><path d="M4 10h12M4 14h12M6 6a8 8 0 100 12"/></>,
  square: <><rect x="3" y="3" width="18" height="18" rx="2"/></>,
  box: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  bug: <><rect x="8" y="6" width="8" height="14" rx="4"/><path d="M19 9h2M3 9h2M19 15h2M3 15h2M17 3l-2 4M7 3l2 4"/></>,
  scissors: <><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></>,
  hardHat: <><path d="M2 18a1 1 0 001 1h18a1 1 0 001-1v-2a1 1 0 00-1-1H3a1 1 0 00-1 1v2z"/><path d="M10 15V6a1 1 0 011-1h2a1 1 0 011 1v9"/><path d="M4 15v-3a8 8 0 0116 0v3"/></>,
  clapperboard: <><path d="M4 11v8a2 2 0 002 2h12a2 2 0 002-2v-8H4z"/><path d="M4 11l3.5-7H20l-3.5 7H4z"/><line x1="8" y1="4" x2="12" y2="11"/><line x1="14" y1="4" x2="18" y2="11"/></>,
  barChart: <><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>,
  // Extra icons for tipologie/settori
  droplets: <><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></>,
  arrowLeftRight: <><path d="M8 3 3 8l5 5"/><path d="M3 8h18"/><path d="m16 3 5 5-5 5"/></>,
  triangle: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></>,
  chevronLeft: <><polyline points="15 18 9 12 15 6"/></>,
  chevronRight: <><polyline points="9 18 15 12 9 6"/></>,
  chevronUp: <><polyline points="18 15 12 9 6 15"/></>,
  chevronDown: <><polyline points="6 9 12 15 18 9"/></>,
  moon: <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></>,
  gift: <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>,

};

/* == MISURE PUNTI == */
export const PUNTI_MISURE = [
  { key: "lAlto", label: "L alto", x: 95, y: 8, color: "acc" },
  { key: "lCentro", label: "L centro", x: 95, y: 125, color: "acc" },
  { key: "lBasso", label: "L basso", x: 95, y: 242, color: "acc" },
  { key: "hSx", label: "H sx", x: 8, y: 125, color: "blue", rot: true },
  { key: "hCentro", label: "H centro", x: 95, y: 170, color: "blue" },
  { key: "hDx", label: "H dx", x: 182, y: 125, color: "blue", rot: true },
  { key: "d1", label: "D1 Ôåù", x: 50, y: 55, color: "purple" },
  { key: "d2", label: "D2 Ôåÿ", x: 140, y: 55, color: "purple" },
];

/* ====================================== */
/* ==          MAIN COMPONENT          == */
/* ====================================== */

/* == HOOK DRAG ORDER == */
export function useDragOrder(init) {
  const [order, setOrder] = React.useState(init);
  const [dragging, setDragging] = React.useState(null);
  const [over, setOver] = React.useState(null);
  function start(id) { setDragging(id); }
  function onOver(id) { if (dragging && dragging !== id) setOver(id); }
  function drop(id) {
    if (!dragging || dragging === id) { setDragging(null); setOver(null); return; }
    setOrder(o => { const a = [...o], f = a.indexOf(dragging), t = a.indexOf(id); a.splice(f,1); a.splice(t,0,dragging); return a; });
    setDragging(null); setOver(null);
  }
  function end() { setDragging(null); setOver(null); }
  return { order, setOrder, dragging, over, start, onOver, drop, end };
}

// === TIPI EVENTO (module-level) ===
export const TIPI_EVENTO = [
  { id: "sopralluogo", l: "Sopralluogo", ico: "search", c: "#3B7FE0" },
  { id: "misure", l: "Misure", ico: "ruler", c: "#8B5CF6" },
  { id: "preventivo", l: "Preventivo", ico: "clipboard", c: "#F5A623" },
  { id: "posa", l: "Posa", ico: "hammer", c: "#F97316" },
  { id: "consegna", l: "Consegna", ico: "package", c: "#EF4444" },
  { id: "riparazione", l: "Riparazione", ico: "wrench", c: "#DC4444" },
  { id: "collaudo", l: "Collaudo", ico: "shieldCheck", c: "#10B981" },
  { id: "telefonata", l: "Telefonata", ico: "phone", c: "#3B7FE0" },
  { id: "riunione", l: "Riunione", ico: "users", c: "#7A7A7A" },
  { id: "manutenzione", l: "Manutenzione", ico: "wrench", c: "#F97316" },
  { id: "altro", l: "Altro", ico: "calendar", c: "#E8A020" },
  { id: "impegno", l: "Impegno", ico: "mapPin", c: "#636366" },
  { id: "controllo", l: "Controllo cantiere", ico: "building", c: "#8B5CF6" },
];
export const tipoEvColor = (tipo) => {
  const t = TIPI_EVENTO.find(x => x.id === tipo);
  return t ? t.c : "#D08008";
};

