// ═══════════════════════════════════════════════════════════
// MASTRO ERP — Accessori & Catalogo Config v2.0
// Modelli, tipologie, campi misura per tutte le categorie
// Da importare in mastro-constants.tsx
// ═══════════════════════════════════════════════════════════

// ─── SETTORI AGGIORNATI (sostituisce SETTORI in constants) ──
export const SETTORI_V2 = [
  { id: "serramenti",    label: "Finestre e Serramenti", icon: "🪟", desc: "Finestre, balconi, scorrevoli, alzanti, fissi" },
  { id: "porte",         label: "Porte",                 icon: "🚪", desc: "Porte interne, blindate, scorrevoli, sezionali" },
  { id: "persiane",      label: "Persiane e Scuri",      icon: "🌂", desc: "Persiane in alluminio, legno, PVC, scuri" },
  { id: "tapparelle",    label: "Tapparelle e Avvolgibili", icon: "⬇", desc: "Tapparelle, cassonetti, motorizzazioni" },
  { id: "zanzariere",    label: "Zanzariere",            icon: "🕸", desc: "Laterali, verticali, plissé, battenti, magnetiche" },
  { id: "tende",         label: "Tende da Sole",         icon: "☀️", desc: "Bracci, caduta, cappottine, pergole, ZIP" },
  { id: "tendeinterne",  label: "Tende da Interno",      icon: "🪞", desc: "Rullo, pacchetto, veneziane, plissettate, pannello" },
  { id: "boxdoccia",     label: "Box Doccia",            icon: "🚿", desc: "Nicchia, angolari, walk-in, pareti vasca" },
  { id: "cancelli",      label: "Cancelli e Recinzioni", icon: "🚧", desc: "Battenti, scorrevoli, recinzioni, ringhiere" },
];

// ─── TIPOLOGIE RAPIDE NUOVE (da AGGIUNGERE a TIPOLOGIE_RAPIDE) ──
export const TIPOLOGIE_NUOVE = [
  // Tende da interno
  { code: "TIRUL",  label: "Tenda a rullo",         icon: "🪞", cat: "Tende interno", settore: "tendeinterne" },
  { code: "TIPAC",  label: "Tenda a pacchetto",     icon: "🪞", cat: "Tende interno", settore: "tendeinterne" },
  { code: "TIPAN",  label: "Tenda a pannello",      icon: "🪞", cat: "Tende interno", settore: "tendeinterne" },
  { code: "TIVEN",  label: "Veneziana",             icon: "▤",  cat: "Tende interno", settore: "tendeinterne" },
  { code: "TIPLI",  label: "Tenda plissettata",     icon: "🪞", cat: "Tende interno", settore: "tendeinterne" },
  { code: "TIBAS",  label: "Tenda a bastone",       icon: "🪞", cat: "Tende interno", settore: "tendeinterne" },
  { code: "TIBIN",  label: "Tenda a binario",       icon: "🪞", cat: "Tende interno", settore: "tendeinterne" },
  { code: "TIDBI",  label: "Tenda doppio binario",  icon: "🪞", cat: "Tende interno", settore: "tendeinterne" },
  { code: "TIVET",  label: "Tenda da tetto/Velux",  icon: "🪞", cat: "Tende interno", settore: "tendeinterne" },
  { code: "TIVER",  label: "Tenda verticale",       icon: "🪞", cat: "Tende interno", settore: "tendeinterne" },
  // Cancelli e recinzioni
  { code: "CANBS",  label: "Cancello battente singolo",icon: "🚧", cat: "Cancelli", settore: "cancelli" },
  { code: "CANBD",  label: "Cancello battente doppio", icon: "🚧", cat: "Cancelli", settore: "cancelli" },
  { code: "CANSC",  label: "Cancello scorrevole",      icon: "🚧", cat: "Cancelli", settore: "cancelli" },
  { code: "CANPE",  label: "Cancelletto pedonale",     icon: "🚶", cat: "Cancelli", settore: "cancelli" },
  { code: "REMOD",  label: "Recinzione modulare",      icon: "▮▮", cat: "Recinzioni", settore: "cancelli" },
  { code: "RINGH",  label: "Ringhiera/Balconata",      icon: "▬",  cat: "Recinzioni", settore: "cancelli" },
  { code: "GRATA",  label: "Grata di sicurezza",       icon: "🔒", cat: "Recinzioni", settore: "cancelli" },
];

// ═══════════════════════════════════════════════════════════
// CATALOGO MODELLI — Dati dai fornitori
// Ogni DB ha: id, code (nome breve), nome (desc), e campi specifici
// ═══════════════════════════════════════════════════════════

// ─── ZANZARIERE (da catalogo Zanzar 2024-2025) ──────────
export const ZANZ_CATEGORIE = [
  { id: "avv_nb", code: "Avvolgente s/bottone", desc: "Scorrimento verticale senza bottone di aggancio" },
  { id: "avv_cb", code: "Avvolgente c/bottone", desc: "Scorrimento verticale con bottone di aggancio" },
  { id: "plisse", code: "Plissettata",          desc: "A soffietto, ingombro minimo" },
  { id: "zip",    code: "ZIP / Tenda tecnica",  desc: "Scorrimento in guide laterali ZIP" },
  { id: "incas",  code: "Da incasso",           desc: "Integrata nel controtelaio" },
  { id: "pann",   code: "Pannello / Battente",  desc: "Anta singola o scorrevole" },
];

export const ZANZ_MODELLI_INIT = [
  // Avvolgenti senza bottone
  { id: "z01", code: "Libera",    cat: "avv_nb", lMin: 400, lMax: 2000, hMin: 400, hMax: 2800, prezzo: 162, unitaPrezzo: "mq", note: "Max largh 2000mm" },
  { id: "z02", code: "Star 50",   cat: "avv_nb", lMin: 400, lMax: 1800, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z03", code: "Extrema",   cat: "avv_nb", lMin: 400, lMax: 2300, hMin: 400, hMax: 2800, prezzo: 0,   unitaPrezzo: "mq", note: "Max largh 2300mm" },
  { id: "z04", code: "Jolly",     cat: "avv_nb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z05", code: "Flexa",     cat: "avv_nb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z06", code: "Klip 40",   cat: "avv_nb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z07", code: "Frontal 40",cat: "avv_nb", lMin: 400, lMax: 1800, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z08", code: "Jumbo",     cat: "avv_nb", lMin: 400, lMax: 2000, hMin: 400, hMax: 3000, prezzo: 0,   unitaPrezzo: "mq", note: "Grande formato" },
  { id: "z09", code: "New Idea",  cat: "avv_nb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z10", code: "Micro",     cat: "avv_nb", lMin: 300, lMax: 1200, hMin: 300, hMax: 1600, prezzo: 0,   unitaPrezzo: "mq", note: "Compatta" },
  { id: "z11", code: "Oasis",     cat: "avv_nb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  // Avvolgenti con bottone
  { id: "z12", code: "Kiss 50",   cat: "avv_cb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 95,  unitaPrezzo: "mq", note: "" },
  { id: "z13", code: "Fast 50",   cat: "avv_cb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z14", code: "Tonda",     cat: "avv_cb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z15", code: "Eko",       cat: "avv_cb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z16", code: "Quadra",    cat: "avv_cb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z17", code: "Gipsy",     cat: "avv_cb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z18", code: "Susy Elite",cat: "avv_cb", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0,   unitaPrezzo: "mq", note: "" },
  { id: "z19", code: "Moto 65",   cat: "avv_cb", lMin: 400, lMax: 2000, hMin: 400, hMax: 2800, prezzo: 0,   unitaPrezzo: "mq", note: "Motorizzata" },
  // Plissettate
  { id: "z20", code: "Plissè Zero",  cat: "plisse", lMin: 300, lMax: 1600, hMin: 300, hMax: 2800, prezzo: 0, unitaPrezzo: "mq", note: "" },
  { id: "z21", code: "Plissè Plus",  cat: "plisse", lMin: 300, lMax: 2400, hMin: 300, hMax: 2800, prezzo: 0, unitaPrezzo: "mq", note: "" },
  { id: "z22", code: "Plissè 0.18",  cat: "plisse", lMin: 300, lMax: 1600, hMin: 300, hMax: 2800, prezzo: 0, unitaPrezzo: "mq", note: "18mm ingombro" },
  { id: "z23", code: "Plissè 0.22 Top", cat: "plisse", lMin: 300, lMax: 1800, hMin: 300, hMax: 2800, prezzo: 0, unitaPrezzo: "mq", note: "" },
  { id: "z24", code: "Plissè 0.27",  cat: "plisse", lMin: 300, lMax: 2000, hMin: 300, hMax: 2800, prezzo: 0, unitaPrezzo: "mq", note: "" },
  // ZIP / Tende tecniche
  { id: "z25", code: "Sigilla",   cat: "zip", lMin: 400, lMax: 3000, hMin: 400, hMax: 3000, prezzo: 0, unitaPrezzo: "mq", note: "ZIP" },
  { id: "z26", code: "Kiusa",     cat: "zip", lMin: 400, lMax: 2500, hMin: 400, hMax: 2500, prezzo: 0, unitaPrezzo: "mq", note: "" },
  { id: "z27", code: "Maxma",     cat: "zip", lMin: 400, lMax: 3500, hMin: 400, hMax: 3500, prezzo: 0, unitaPrezzo: "mq", note: "Grande formato ZIP" },
  { id: "z28", code: "Cubo-Flat", cat: "zip", lMin: 400, lMax: 2500, hMin: 400, hMax: 2500, prezzo: 0, unitaPrezzo: "mq", note: "" },
  { id: "z29", code: "Rond",      cat: "zip", lMin: 400, lMax: 2000, hMin: 400, hMax: 2000, prezzo: 0, unitaPrezzo: "mq", note: "" },
  // Da incasso
  { id: "z30", code: "Unika",     cat: "incas", lMin: 400, lMax: 1800, hMin: 400, hMax: 2500, prezzo: 0, unitaPrezzo: "mq", note: "" },
  { id: "z31", code: "Alto Block",cat: "incas", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0, unitaPrezzo: "mq", note: "" },
  { id: "z32", code: "Perlegno",  cat: "incas", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0, unitaPrezzo: "mq", note: "Per infissi legno" },
  { id: "z33", code: "Ketty",     cat: "incas", lMin: 400, lMax: 1600, hMin: 400, hMax: 2500, prezzo: 0, unitaPrezzo: "mq", note: "" },
  // Pannelli / Battenti
  { id: "z34", code: "Pratika",   cat: "pann", lMin: 500, lMax: 1400, hMin: 1800, hMax: 2500, prezzo: 0, unitaPrezzo: "mq", note: "Pannello scorrevole" },
  { id: "z35", code: "America",   cat: "pann", lMin: 500, lMax: 1400, hMin: 1800, hMax: 2500, prezzo: 0, unitaPrezzo: "mq", note: "" },
  { id: "z36", code: "Pegaso",    cat: "pann", lMin: 500, lMax: 1400, hMin: 1800, hMax: 2500, prezzo: 0, unitaPrezzo: "mq", note: "Battente" },
  { id: "z37", code: "Tris",      cat: "pann", lMin: 500, lMax: 1600, hMin: 1800, hMax: 2500, prezzo: 0, unitaPrezzo: "mq", note: "" },
];

export const ZANZ_RETI = [
  { id: "r1", code: "Standard",       sovrapprezzo: 0 },
  { id: "r2", code: "Antibatterica",  sovrapprezzo: 7.20 },  // €/mq
  { id: "r3", code: "Antivento",      sovrapprezzo: 0 },
  { id: "r4", code: "Pet Screen",     sovrapprezzo: 0 },
  { id: "r5", code: "Antipolline",    sovrapprezzo: 0 },
];

export const ZANZ_OPTIONAL = [
  { id: "o1", code: "Clic-clac",      sovrapprezzo: 17.50, unita: "pz" },
  { id: "o2", code: "Maniglia",       sovrapprezzo: 0,     unita: "pz" },
  { id: "o3", code: "Molla chiusura", sovrapprezzo: 0,     unita: "pz" },
];

// ─── CASSONETTI (da catalogo Ferraro - Sistema EXTEND) ──
export const CASS_MODELLI_INIT = [
  { id: "c01", code: "IFC 25x25", nome: "Cassonetto ispez. frontale 25×25", lMax: 6000, hStd: 250, pStd: 250, ispezione: "frontale" },
  { id: "c02", code: "IFC 30x25", nome: "Cassonetto ispez. frontale 30×25", lMax: 6000, hStd: 300, pStd: 250, ispezione: "frontale" },
  { id: "c03", code: "IFC 30x30", nome: "Cassonetto ispez. frontale 30×30", lMax: 6000, hStd: 300, pStd: 300, ispezione: "frontale" },
  { id: "c04", code: "IFC 35x30", nome: "Cassonetto ispez. frontale 35×30", lMax: 6000, hStd: 350, pStd: 300, ispezione: "frontale" },
  { id: "c05", code: "IFM",       nome: "Cassonetto modulare",              lMax: 6000, hStd: 0,   pStd: 0,   ispezione: "frontale" },
  { id: "c06", code: "IFCL",      nome: "Cassonetto ristrutturazione",      lMax: 6000, hStd: 0,   pStd: 0,   ispezione: "frontale" },
  { id: "c07", code: "ELIO",      nome: "ELIO — coibentato",                lMax: 6000, hStd: 0,   pStd: 0,   ispezione: "soffitto" },
  { id: "c08", code: "ELIO VP",   nome: "ELIO VP — ventilazione passiva",   lMax: 6000, hStd: 0,   pStd: 0,   ispezione: "soffitto" },
  { id: "c09", code: "ELIO TF",   nome: "ELIO TF — taglio fuoco",          lMax: 6000, hStd: 0,   pStd: 0,   ispezione: "soffitto" },
  { id: "c10", code: "KALOS",     nome: "KALOS — design",                   lMax: 6000, hStd: 0,   pStd: 0,   ispezione: "frontale" },
  { id: "c11", code: "KALOS NOLAM",nome: "KALOS NOLAM — senza lamiera",    lMax: 6000, hStd: 0,   pStd: 0,   ispezione: "frontale" },
];

export const CASS_ISPEZIONE = [
  { id: "i1", code: "Frontale" },
  { id: "i2", code: "Soffitto" },
  { id: "i3", code: "Laterale" },
];

export const CASS_TAPPO = [
  { id: "t1", code: "Sovrapposto" },
  { id: "t2", code: "Filo muro" },
  { id: "t3", code: "Veletta" },
  { id: "t4", code: "Senza tappo" },
];

export const CASS_SPALLE = [
  { id: "s1", code: "Guida incassata", barra: 6500 },
  { id: "s2", code: "Guida sporgente", barra: 6500 },
  { id: "s3", code: "Senza spalle",    barra: 0 },
];

// ─── TENDE DA SOLE (da catalogo Tenditalia + TendaMaggi) ──
export const TDSOLE_CATEGORIE = [
  { id: "bracci_p", code: "Bracci piastre",    desc: "Struttura a bracci con piastre" },
  { id: "bracci_b", code: "Bracci barra quadra",desc: "Struttura con barra quadra" },
  { id: "caduta",   code: "Caduta",             desc: "A caduta verticale o guidata" },
  { id: "cappott",  code: "Cappottine",         desc: "A cupola, gradini, standard" },
  { id: "antiv",    code: "Antivento",          desc: "Con guide laterali antivento" },
  { id: "giard",    code: "Da giardino",        desc: "Gazebo, cenador" },
  { id: "perg",     code: "Pergole / Bioclimatiche", desc: "Pergotende e bioclimatiche" },
  { id: "tecnica",  code: "Tende tecniche",     desc: "ZIP screen, avvolgibili" },
];

export const TDSOLE_MODELLI_INIT = [
  // Bracci piastre (Tenditalia)
  { id: "ts01", code: "Mediterranea",    cat: "bracci_p", lMin: 2000, lMax: 7000, spMin: 1500, spMax: 3500, prezzo: 0, note: "" },
  { id: "ts02", code: "Mediterranea Light",cat: "bracci_p", lMin: 2000, lMax: 5000, spMin: 1500, spMax: 2500, prezzo: 0, note: "" },
  { id: "ts03", code: "Erre",            cat: "bracci_p", lMin: 2000, lMax: 7000, spMin: 1500, spMax: 3500, prezzo: 0, note: "" },
  { id: "ts04", code: "Erre Smart",      cat: "bracci_p", lMin: 2000, lMax: 5000, spMin: 1500, spMax: 2500, prezzo: 0, note: "" },
  { id: "ts05", code: "Block Plus",      cat: "bracci_p", lMin: 2000, lMax: 6000, spMin: 1500, spMax: 3500, prezzo: 0, note: "Con cassonetto" },
  { id: "ts06", code: "Amalfi",          cat: "bracci_p", lMin: 2000, lMax: 7000, spMin: 1500, spMax: 3500, prezzo: 0, note: "" },
  { id: "ts07", code: "Star LED",        cat: "bracci_p", lMin: 2000, lMax: 6000, spMin: 1500, spMax: 3000, prezzo: 0, note: "Con illuminazione LED" },
  { id: "ts08", code: "Ari",             cat: "bracci_p", lMin: 2000, lMax: 5000, spMin: 1500, spMax: 2500, prezzo: 0, note: "" },
  { id: "ts09", code: "Nabi",            cat: "bracci_p", lMin: 2000, lMax: 5000, spMin: 1500, spMax: 2500, prezzo: 0, note: "" },
  { id: "ts10", code: "Kora",            cat: "bracci_p", lMin: 2000, lMax: 5000, spMin: 1500, spMax: 2500, prezzo: 0, note: "" },
  { id: "ts11", code: "Maki",            cat: "bracci_p", lMin: 2000, lMax: 5000, spMin: 1500, spMax: 2500, prezzo: 0, note: "" },
  // Bracci barra quadra
  { id: "ts12", code: "Kappa 2",         cat: "bracci_b", lMin: 2000, lMax: 7000, spMin: 1500, spMax: 4000, prezzo: 0, note: "" },
  { id: "ts13", code: "Tirrena 2",       cat: "bracci_b", lMin: 2000, lMax: 7000, spMin: 1500, spMax: 4000, prezzo: 0, note: "" },
  { id: "ts14", code: "Medea",           cat: "bracci_b", lMin: 2000, lMax: 7000, spMin: 1500, spMax: 4000, prezzo: 0, note: "" },
  { id: "ts15", code: "Elite Plus",      cat: "bracci_b", lMin: 2000, lMax: 7000, spMin: 1500, spMax: 5000, prezzo: 0, note: "" },
  { id: "ts16", code: "Atlantica",       cat: "bracci_b", lMin: 2000, lMax: 5750, spMin: 1500, spMax: 5750, prezzo: 0, note: "Max 575cm" },
  // Cappottine
  { id: "ts17", code: "Cappottina Standard", cat: "cappott", lMin: 600, lMax: 3000, spMin: 500, spMax: 1500, prezzo: 0, note: "" },
  { id: "ts18", code: "Cappottina Gradini",  cat: "cappott", lMin: 600, lMax: 3000, spMin: 500, spMax: 1500, prezzo: 0, note: "" },
  { id: "ts19", code: "Cappottina Cupola",   cat: "cappott", lMin: 600, lMax: 3000, spMin: 500, spMax: 1500, prezzo: 0, note: "" },
  { id: "ts20", code: "Canada",          cat: "cappott", lMin: 600, lMax: 3000, spMin: 500, spMax: 2000, prezzo: 0, note: "" },
  { id: "ts21", code: "Capua",           cat: "cappott", lMin: 600, lMax: 3000, spMin: 500, spMax: 1500, prezzo: 0, note: "" },
  // Caduta
  { id: "ts22", code: "Zip 2",           cat: "caduta", lMin: 400, lMax: 5000, spMin: 400, spMax: 4000, prezzo: 0, note: "Click automatico" },
  { id: "ts23", code: "Maestrale",       cat: "caduta", lMin: 400, lMax: 4000, spMin: 400, spMax: 3500, prezzo: 0, note: "" },
  { id: "ts24", code: "Eolo",            cat: "caduta", lMin: 400, lMax: 4000, spMin: 400, spMax: 3000, prezzo: 0, note: "" },
  { id: "ts25", code: "Demetra",         cat: "caduta", lMin: 400, lMax: 4000, spMin: 400, spMax: 3000, prezzo: 0, note: "Doppio telo" },
  // TendaMaggi categorie aggiuntive
  { id: "ts26", code: "Antivento Aosta", cat: "antiv", lMin: 1000, lMax: 6000, spMin: 0, spMax: 0, prezzo: 0, note: "Con guide" },
  { id: "ts27", code: "Pergotenda",      cat: "perg", lMin: 2000, lMax: 7000, spMin: 2000, spMax: 6000, prezzo: 0, note: "" },
  { id: "ts28", code: "Bioclimatica",    cat: "perg", lMin: 2000, lMax: 7000, spMin: 2000, spMax: 6000, prezzo: 0, note: "Lamelle orientabili" },
];

export const TDSOLE_MONTAGGIO = [
  { id: "m1", code: "Parete" },
  { id: "m2", code: "Soffitto" },
  { id: "m3", code: "A tetto" },
];

export const TDSOLE_COMANDO = [
  { id: "co1", code: "Manuale DX" },
  { id: "co2", code: "Manuale SX" },
  { id: "co3", code: "Motorizzata" },
  { id: "co4", code: "Motorizzata + telecomando" },
  { id: "co5", code: "Motorizzata + sensore vento" },
];

// ─── TENDE DA INTERNO (da catalogo Tuiss) ──────────────
export const TDINT_CATEGORIE = [
  { id: "rullo",     code: "Tende a rullo",        desc: "Filtranti, oscuranti, termiche" },
  { id: "pacchetto", code: "Tende a pacchetto",    desc: "Classiche, morbide" },
  { id: "pannello",  code: "Tende a pannello",     desc: "Per grandi superfici vetrate" },
  { id: "veneziana", code: "Veneziane",             desc: "Alluminio, legno, PVC" },
  { id: "plissett",  code: "Plissettate",           desc: "Nido d'ape, filtranti/oscuranti" },
  { id: "bastone",   code: "Tende a bastone",      desc: "Ad anello, piega, matita" },
  { id: "binario",   code: "Tende a binario/onda", desc: "Effetto onda, moderno" },
  { id: "doppiobin", code: "Doppio binario",        desc: "Voile + oscurante" },
  { id: "tetto",     code: "Tende da tetto",       desc: "Per Velux/FAKRO" },
  { id: "verticale", code: "Verticali",             desc: "A strisce verticali" },
];

export const TDINT_TESSUTO = [
  { id: "t1", code: "Filtrante" },
  { id: "t2", code: "Oscurante" },
  { id: "t3", code: "Termico" },
  { id: "t4", code: "Voile" },
  { id: "t5", code: "Lino" },
  { id: "t6", code: "Tecnico" },
];

export const TDINT_MONTAGGIO = [
  { id: "m1", code: "Parete" },
  { id: "m2", code: "Soffitto" },
  { id: "m3", code: "A vetro (senza fori)" },
  { id: "m4", code: "In nicchia" },
  { id: "m5", code: "Al telaio finestra" },
];

export const TDINT_FINITURA = [
  { id: "f1", code: "Ad anello" },
  { id: "f2", code: "A piega doppia" },
  { id: "f3", code: "A matita" },
  { id: "f4", code: "A onda" },
];

// ─── BOX DOCCIA (da catalogo Deghi) ──────────────────────
export const BXDOC_CATEGORIE = [
  { id: "nicchia",   code: "Nicchia",         desc: "Tra due muri paralleli" },
  { id: "angolare",  code: "Angolare",        desc: "Due lati aperti" },
  { id: "semicir",   code: "Semicircolare",   desc: "Curvo" },
  { id: "walkin",    code: "Walk-in",         desc: "Aperto, senza porta" },
  { id: "vasca",     code: "Parete vasca",    desc: "Sopra vasca da bagno" },
  { id: "soffietto", code: "A soffietto",     desc: "Apertura a soffietto" },
  { id: "pentag",    code: "Pentagonale",     desc: "Cinque lati" },
];

export const BXDOC_APERTURA = [
  { id: "a1", code: "Scorrevole" },
  { id: "a2", code: "Battente" },
  { id: "a3", code: "A soffietto" },
  { id: "a4", code: "Pivot" },
  { id: "a5", code: "Walk-in (fisso)" },
  { id: "a6", code: "Saloon" },
];

export const BXDOC_VETRO = [
  { id: "v1", code: "Cristallo 6mm trasparente" },
  { id: "v2", code: "Cristallo 6mm satinato" },
  { id: "v3", code: "Cristallo 8mm trasparente" },
  { id: "v4", code: "Cristallo 8mm satinato" },
  { id: "v5", code: "Cristallo 8mm fumé" },
];

export const BXDOC_PROFILO = [
  { id: "p1", code: "Cromo lucido" },
  { id: "p2", code: "Nero opaco" },
  { id: "p3", code: "Bianco" },
  { id: "p4", code: "Bronzo" },
  { id: "p5", code: "Oro" },
  { id: "p6", code: "Senza profilo (frameless)" },
];

// ─── CANCELLI E RECINZIONI (da catalogo Eurofer 2025-26) ──
export const CANC_CATEGORIE = [
  { id: "batt_s", code: "Battente singolo",  desc: "Una anta" },
  { id: "batt_d", code: "Battente doppio",   desc: "Due ante" },
  { id: "scorr",  code: "Scorrevole",        desc: "Su binario" },
  { id: "pedon",  code: "Pedonale",          desc: "Cancelletto pedonale" },
  { id: "recinz", code: "Recinzione",        desc: "Moduli recinzione" },
  { id: "ringh",  code: "Ringhiera",         desc: "Balconate e ringhiere" },
];

export const CANC_SISTEMA = [
  { id: "s1", code: "Secreta",  desc: "Doghe orizzontali privacy, acciaio prezincato", moduli: true },
  { id: "s2", code: "Linear",   desc: "Ferro battuto classico, moduli standard 2m", moduli: true },
  { id: "s3", code: "Gradius",  desc: "Per terreni inclinati, pendenza fino 30°", moduli: true },
  { id: "s4", code: "Laserfer", desc: "Taglio laser personalizzato", moduli: false },
  { id: "s5", code: "Su misura",desc: "Cancello personalizzato ferro battuto", moduli: false },
];

export const CANC_AUTOMAZIONE = [
  { id: "a1", code: "Manuale" },
  { id: "a2", code: "Predisposizione automazione" },
  { id: "a3", code: "Motorizzato" },
  { id: "a4", code: "Motorizzato + telecomando" },
];

// ═══════════════════════════════════════════════════════════
// ACCESSORI META — Definizione campi per ogni tipo accessorio
// Usato per rendere dinamica la UI nel VanoDetailPanel
// ═══════════════════════════════════════════════════════════

export const ACCESSORI_META = {
  tapparella: {
    label: "Tapparella", icon: "🪟", color: "#ff9500", settore: "tapparelle",
    campi: ["l", "h", "materiale", "motorizzata", "tipoMisura", "colore"],
  },
  persiana: {
    label: "Persiana", icon: "🏠", color: "#007aff", settore: "persiane",
    campi: ["l", "h", "telaio", "posizionamento", "tipoMisura", "colore"],
  },
  zanzariera: {
    label: "Zanzariera", icon: "🦟", color: "#ff2d55", settore: "zanzariere",
    campi: ["l", "h", "categoria", "modello", "latoApertura", "tipoRete", "profTelaio", "tipoMisura", "colore"],
  },
  cassonetto: {
    label: "Cassonetto", icon: "🧊", color: "#b45309", settore: "tapparelle",
    campi: ["tipo", "modello", "l", "h", "p", "ispezione", "tappo", "spalle", "cielino"],
  },
  tenda_sole: {
    label: "Tenda da sole", icon: "☀️", color: "#f59e0b", settore: "tende",
    campi: ["categoria", "modello", "larghezza", "sporgenza", "altezzaInst", "montaggio", "comando", "telo", "colore"],
  },
  tenda_interna: {
    label: "Tenda da interno", icon: "🪞", color: "#8b5cf6", settore: "tendeinterne",
    campi: ["categoria", "larghezza", "altezza", "profTelaio", "montaggio", "tessuto", "finitura", "latoComando", "colore"],
  },
  box_doccia: {
    label: "Box doccia", icon: "🚿", color: "#06b6d4", settore: "boxdoccia",
    campi: ["tipo", "larghezza", "profondita", "altezza", "apertura", "vetro", "profilo"],
  },
  cancello: {
    label: "Cancello/Recinzione", icon: "🚧", color: "#64748b", settore: "cancelli",
    campi: ["tipo", "sistema", "larghezza", "altezza", "nModuli", "lunghezzaRec", "pendenza", "automazione", "coloreRAL"],
  },
};

// ═══════════════════════════════════════════════════════════
// DEFAULT SETTORI (aggiornato)
// ═══════════════════════════════════════════════════════════
export const SETTORI_DEFAULT_V2 = ["serramenti", "persiane", "tapparelle", "zanzariere"];
