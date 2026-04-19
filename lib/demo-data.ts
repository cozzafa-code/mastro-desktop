// ═══════════════════════════════════════════════════════════
// MASTRO ERP — lib/demo-data.ts
// Demo data loader
// ═══════════════════════════════════════════════════════════

interface DemoDeps {
  setCantieri: (v: any) => void;
  setEvents: (v: any) => void;
  setTasks: (v: any) => void;
  setFattureDB: (v: any) => void;
  setOrdiniFornDB: (v: any) => void;
  setMontaggiDB: (v: any) => void;
  setSelectedCM: (v: any) => void;
  setSelectedVano: (v: any) => void;
  setTab: (v: any) => void;
}

export function caricaDemoCompleto(deps: DemoDeps) {
  const { setCantieri, setEvents, setTasks, setFattureDB, setOrdiniFornDB, setMontaggiDB, setSelectedCM, setSelectedVano, setTab } = deps;
    const oggi = new Date().toISOString().split("T")[0];
    const ieri = (() => { const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().split("T")[0]; })();
    const domani = (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().split("T")[0]; })();
    const fra3 = (() => { const d = new Date(); d.setDate(d.getDate()+3); return d.toISOString().split("T")[0]; })();
    const fra7 = (() => { const d = new Date(); d.setDate(d.getDate()+7); return d.toISOString().split("T")[0]; })();
    const fra14 = (() => { const d = new Date(); d.setDate(d.getDate()+14); return d.toISOString().split("T")[0]; })();

    // Vano factory
    const mkVano = (id, nome, tipo, stanza, piano, l, h, sys = "Aluplast Ideal 4000", colEst = "RAL 7016") => ({
      id, nome, tipo, stanza, piano, sistema: sys, pezzi: 1,
      coloreInt: "RAL 9010", coloreEst: colEst, bicolore: colEst !== "RAL 9010",
      coloreAcc: "", vetro: "", telaio: "", coprifilo: "", lamiera: "",
      misure: { lAlto: l+3, lCentro: l, lBasso: l-2, hSx: h, hCentro: h, hDx: h-3, d1: Math.round(Math.sqrt(l*l+h*h)), d2: Math.round(Math.sqrt(l*l+h*h))-2 },
      foto: {}, note: "", cassonetto: false,
      accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } },
    });

    // 4 COMMESSE a stadi diversi
    const cm1 = {
      id: 9001, code: "S-0001", cliente: "Giuseppe", cognome: "Verdi",
      indirizzo: "Via Garibaldi 12, Rende (CS)", telefono: "347 555 1234", email: "giuseppe.verdi@email.it",
      fase: "sopralluogo", sistema: "Aluplast Ideal 4000", tipo: "nuova",
      note: "Appartamento 2° piano. 5 finestre da sostituire.", prezzoMq: 180,
      rilievi: [], allegati: [], cf: "VRDGPP80A01D086Z", ivaPerc: 10,
      creato: "25 feb", aggiornato: oggi,
      log: [{ chi: "Fabio", cosa: "creato la commessa", quando: "2 giorni fa", color: "#86868b" }],
    };

    const vaniAnna = [
      mkVano(9101, "Finestra Soggiorno", "F2A", "Soggiorno", "1°", 1200, 1400),
      mkVano(9102, "Portafinestra Camera", "PF2A", "Camera", "1°", 1400, 2200),
      mkVano(9103, "Vasistas Bagno", "VAS", "Bagno", "1°", 600, 600),
      mkVano(9104, "Scorrevole Salone", "SC2A", "Salone", "1°", 1800, 2200),
    ];
    const cm2 = {
      id: 9002, code: "S-0002", cliente: "Anna", cognome: "Bianchi",
      indirizzo: "Corso Mazzini 88, Cosenza (CS)", telefono: "339 888 5678", email: "anna.bianchi@gmail.com",
      fase: "preventivo", sistema: "Aluplast Ideal 4000", tipo: "nuova", prezzoMq: 180,
      note: "Ristrutturazione. IVA 10%. RAL 7016 esterno.",
      rilievi: [{ id: 9201, n: 1, data: "2026-02-20", ora: "09:30", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", motivoModifica: "", note: "", vani: vaniAnna }],
      allegati: [], cf: "BNCNNA85C41D086Y", ivaPerc: 10,
      creato: "20 feb", aggiornato: "22 feb",
      log: [
        { chi: "Fabio", cosa: "completato rilievo — 4 vani", quando: "5 giorni fa", color: "#8B5CF6" },
        { chi: "Fabio", cosa: "creato la commessa", quando: "7 giorni fa", color: "#86868b" },
      ],
    };

    const vaniMario = [
      mkVano(9111, "Finestra Soggiorno", "F2A", "Soggiorno", "3°", 1200, 1400, "Aluplast Ideal 4000", "RAL 9010"),
      mkVano(9112, "Finestra Camera 1", "F2A", "Camera", "3°", 1000, 1200, "Aluplast Ideal 4000", "RAL 9010"),
      mkVano(9113, "Portafinestra Salone", "PF2A", "Salone", "3°", 1400, 2200, "Aluplast Ideal 4000", "RAL 9010"),
      mkVano(9114, "Vasistas Bagno", "VAS", "Bagno", "3°", 600, 600, "Aluplast Ideal 4000", "RAL 9010"),
    ];
    const cm3 = {
      id: 9003, code: "S-0003", cliente: "Mario", cognome: "Rossi",
      indirizzo: "Via Roma 42, Cosenza (CS)", telefono: "338 123 4567", email: "mario.rossi@libero.it",
      fase: "ordini", sistema: "Aluplast Ideal 4000", tipo: "nuova", prezzoMq: 180,
      note: "4 vani. Bonus 50%.",
      firmaCliente: true, dataFirma: "2026-02-15", confermato: true,
      rilievi: [{ id: 9202, n: 1, data: "2026-02-10", ora: "10:00", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", motivoModifica: "", note: "", vani: vaniMario }],
      allegati: [], cf: "RSSMRA75D15D086X", ivaPerc: 10,
      creato: "10 feb", aggiornato: "15 feb",
      log: [
        { chi: "Fabio", cosa: "fattura acconto emessa", quando: "12 giorni fa", color: "#8B5CF6" },
        { chi: "Fabio", cosa: "cliente ha firmato", quando: "12 giorni fa", color: "#1A9E73" },
        { chi: "Fabio", cosa: "creato la commessa", quando: "17 giorni fa", color: "#86868b" },
      ],
    };

    const vaniLaura = [
      mkVano(9121, "Finestra Cucina", "F2A", "Cucina", "PT", 1200, 1400, "Aluplast Ideal 4000", "Noce"),
      mkVano(9122, "Portafinestra Soggiorno", "PF2A", "Soggiorno", "PT", 1400, 2200, "Aluplast Ideal 4000", "Noce"),
      mkVano(9123, "Finestra Camera", "F1A", "Camera", "PT", 800, 1200, "Aluplast Ideal 4000", "Noce"),
    ];
    const cm4 = {
      id: 9004, code: "S-0004", cliente: "Laura", cognome: "Esposito",
      indirizzo: "Viale Trieste 5, Rende (CS)", telefono: "340 999 8765", email: "laura.esposito@outlook.it",
      fase: "posa", sistema: "Aluplast Ideal 4000", tipo: "nuova", prezzoMq: 180,
      note: "PT villa. Colore noce.",
      firmaCliente: true, dataFirma: "2026-01-20", confermato: true,
      rilievi: [{ id: 9203, n: 1, data: "2026-01-15", ora: "14:00", rilevatore: "Fabio", tipo: "rilievo", stato: "completato", motivoModifica: "", note: "", vani: vaniLaura }],
      allegati: [], cf: "SPSLRA82E45D086W", ivaPerc: 10,
      creato: "15 gen", aggiornato: "10 feb",
      log: [
        { chi: "Fabio", cosa: "montaggio pianificato", quando: "3 giorni fa", color: "#1A9E73" },
        { chi: "Fabio", cosa: "conferma fornitore approvata", quando: "17 giorni fa", color: "#af52de" },
        { chi: "Fabio", cosa: "ordine inviato", quando: "25 giorni fa", color: "#EF4444" },
        { chi: "Fabio", cosa: "creato la commessa", quando: "43 giorni fa", color: "#86868b" },
      ],
    };

    setCantieri([cm1, cm2, cm3, cm4]);

    // FATTURE
    setFattureDB([
      {
        id: "fat_d1", numero: 1, anno: 2026, data: "15/02/2026", dataISO: "2026-02-15", tipo: "acconto",
        cmId: 9003, cmCode: "S-0003", cliente: "Mario", cognome: "Rossi",
        indirizzo: "Via Roma 42, Cosenza", cf: "RSSMRA75D15D086X",
        importo: 593, imponibile: 539, iva: 10, ivaAmt: 54,
        pagata: true, dataPagamento: "2026-02-18", scadenza: "2026-03-17", note: "Acconto 50%",
      },
      {
        id: "fat_d2", numero: 2, anno: 2026, data: "20/01/2026", dataISO: "2026-01-20", tipo: "acconto",
        cmId: 9004, cmCode: "S-0004", cliente: "Laura", cognome: "Esposito",
        indirizzo: "Viale Trieste 5, Rende", cf: "SPSLRA82E45D086W",
        importo: 474, imponibile: 431, iva: 10, ivaAmt: 43,
        pagata: true, dataPagamento: "2026-01-25", scadenza: "2026-02-19", note: "Acconto 50%",
      },
    ]);

    // ORDINI
    setOrdiniFornDB([
      {
        id: "ord_d1", cmId: 9003, cmCode: "S-0003", cliente: "Mario Rossi",
        numero: 1, anno: 2026, dataOrdine: "2026-02-18",
        fornitore: { nome: "Aluplast Italia", email: "ordini@aluplast.it", tel: "0444 123456", referente: "Marco Ferro" },
        righe: vaniMario.map((v, i) => ({
          id: "r" + i, desc: `${v.nome}`, misure: `${v.misure.lCentro}×${v.misure.hCentro}`,
          qta: 1, prezzoUnit: 0, totale: 0, note: v.coloreEst,
        })),
        totale: 795, iva: 22, totaleIva: 970, sconto: 0,
        stato: "inviato",
        conferma: { ricevuta: false, dataRicezione: "", verificata: false, differenze: "", firmata: false, dataFirma: "" },
        consegna: { prevista: "", settimane: 0 }, pagamento: { termini: "", stato: "da_pagare" },
      },
      {
        id: "ord_d2", cmId: 9004, cmCode: "S-0004", cliente: "Laura Esposito",
        numero: 2, anno: 2026, dataOrdine: "2026-01-25",
        fornitore: { nome: "Aluplast Italia", email: "ordini@aluplast.it", tel: "0444 123456", referente: "Marco Ferro" },
        righe: vaniLaura.map((v, i) => ({
          id: "r" + i, desc: `${v.nome}`, misure: `${v.misure.lCentro}×${v.misure.hCentro}`,
          qta: 1, prezzoUnit: [210, 320, 140][i] || 0, totale: [210, 320, 140][i] || 0, note: v.coloreEst,
        })),
        totale: 670, iva: 22, totaleIva: 817, sconto: 0,
        stato: "confermato",
        conferma: { ricevuta: true, dataRicezione: "2026-02-01", verificata: true, firmata: true, dataFirma: "2026-02-01", nomeFile: "conferma_aluplast.pdf",
          datiEstratti: { totale: 817, settimane: 6, dataConsegna: "2026-03-15", pagamento: "30gg_fm" } },
        consegna: { prevista: "2026-03-15", settimane: 6 }, pagamento: { termini: "30gg_fm", stato: "da_pagare" },
      },
    ]);

    // MONTAGGI
    setMontaggiDB([{
      id: "m_d1", cmId: 9004, cmCode: "S-0004", cliente: "Laura Esposito",
      vani: 3, data: fra7, orario: "08:00", durata: "giornata",
      squadraId: "sq1", stato: "programmato", note: "3 vani PT villa — portare scala e silicone",
    }]);

    // EVENTI calendario
    setEvents([
      { id: "ev1", date: oggi, time: "09:00", text: "Sopralluogo Verdi", persona: "Giuseppe Verdi", addr: "Via Garibaldi 12, Rende", cm: "S-0001", color: "#0D7C6B", durata: 60 },
      { id: "ev2", date: oggi, time: "15:00", text: "Telefonata Bianchi — preventivo", persona: "Anna Bianchi", addr: "", cm: "S-0002", color: "#E8A020", durata: 30 },
      { id: "ev3", date: domani, time: "10:00", text: "Incontro Rossi — firma ordine", persona: "Mario Rossi", addr: "Via Roma 42, Cosenza", cm: "S-0003", color: "#1A9E73", durata: 45 },
      { id: "ev4", date: fra3, time: "08:30", text: "Consegna materiale Esposito", persona: "Laura Esposito", addr: "Viale Trieste 5, Rende", cm: "S-0004", color: "#af52de", durata: 120 },
      { id: "ev5", date: fra7, time: "08:00", text: "🔧 MONTAGGIO Esposito — 3 vani", persona: "Squadra A", addr: "Viale Trieste 5, Rende", cm: "S-0004", color: "#ff6b00", durata: 480 },
      { id: "ev6", date: fra14, time: "09:00", text: "Sopralluogo nuovo cliente", persona: "Sig.ra Ferraro", addr: "Via De Seta 15, Cosenza", color: "#0D7C6B", durata: 60 },
    ]);

    // TASKS
    setTasks([
      { id: "t1", text: "Inviare preventivo Bianchi", done: false, priority: "alta", meta: "S-0002 · Scade venerdì" },
      { id: "t2", text: "Preparare sopralluogo Verdi", done: false, priority: "media", meta: "S-0001 · Oggi ore 9" },
      { id: "t3", text: "Chiamare Aluplast per conferma Rossi", done: false, priority: "alta", meta: "S-0003 · Ordine 18/02" },
      { id: "t4", text: "Verificare consegna Esposito", done: true, priority: "media", meta: "S-0004 · 15 marzo" },
    ]);

    setSelectedCM(null);
    setSelectedRilievo(null);
    setSelectedVano(null);
    setTab("home");
}
