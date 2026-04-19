// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — MODELLO DATI TECNICO v1.0
// Fonte di verità per tutti i moduli del configuratore
// ═══════════════════════════════════════════════════════════════

// ── ENUMERAZIONI ───────────────────────────────────────────────

export type TipoCella =
  | "fisso"
  | "anta_battente"
  | "anta_ribalta"
  | "wasistas"
  | "porta"
  | "scorrevole"
  | "pannello_cieco";

export type VersoApertura = "sx" | "dx" | "interno" | "esterno";

export type TipoVetro =
  | "std_4_16_4"
  | "stratificato_33_1"
  | "riflettente"
  | "triplo"
  | "camera"
  | "antisfondamento"
  | "personalizzato";

export type TipoProfilo = "ALLUMINIO" | "PVC" | "LEGNO";

export type TipoPannello = "cieco_lamiera" | "cieco_legno" | "sandwich" | "vetro";

// ── PROFILO SISTEMA ────────────────────────────────────────────

export interface SistemaProfilo {
  tipo: TipoProfilo;
  serieNome: string;          // es. "Schüco AWS 70"
  spessoreTelaio: number;     // mm — larghezza profilo vista frontale
  spessoreMuro: number;       // mm — profondità profilo
  costoMlTelaio: number;      // €/ml telaio
  costoMlAnte: number;        // €/ml profili anta
  ufProfilo: number;          // W/m²K trasmittanza profilo
  coloreEsterno: string;      // hex
  coloreInterno: string;      // hex
}

// ── VETRO ──────────────────────────────────────────────────────

export interface ConfigVetro {
  tipo: TipoVetro;
  label: string;              // nome commerciale
  composizione: string;       // es. "4-16-4 Argon"
  ugValore: number;           // W/m²K
  sfValore: number;           // fattore solare
  spessoreToale: number;      // mm
  pesoMq: number;             // kg/m²
  costoMq: number;            // €/m²
  puntoDiRugiada: number;     // °C interno
  resistenzaUrto: boolean;    // antisfondamento
  trattamenti: string[];      // ["basso_emissivo", "selettivo", ...]
}

// ── FERRAMENTA CELLA ──────────────────────────────────────────

export interface FerramentaCella {
  maniglia: boolean;
  maniglione: boolean;        // per porte
  nCerniere: number;          // 2 | 3
  cerniereTipo: "standard" | "rinforzate" | "nascoste";
  chiusuraMultipunto: boolean;
  costoFerramenta: number;    // € totale ferramenta cella
}

// ── CELLA ─────────────────────────────────────────────────────

export interface Cella {
  id: string;                 // "0-0", "1-0", ecc.
  // Posizione nella griglia
  colIdx: number;
  rowIdx: number;
  // Dimensioni nette interne (mm) — calcolate dal motore geometrico
  larghezzaNetta: number;
  altezzaNetta: number;
  areaMq: number;             // larghezzaNetta * altezzaNetta / 1e6
  // Configurazione
  tipo: TipoCella;
  verso: VersoApertura;
  riempimento: "vetro" | "pannello";
  vetro?: ConfigVetro;
  pannello?: { tipo: TipoPannello; spessore: number; costoMq: number };
  ferramenta: FerramentaCella;
  // Output tecnico (calcolato)
  pesoVetro: number;          // kg
  costoVetro: number;         // €
  costoFerramenta: number;    // €
}

// ── MONTANTE / TRAVERSO ────────────────────────────────────────

export interface Montante {
  id: string;
  xMm: number;                // posizione dal bordo sinistro telaio (mm)
  spessoreMm: number;         // stesso del sistema profilo
}

export interface Traverso {
  id: string;
  yMm: number;                // posizione dal bordo superiore telaio (mm)
  spessoreMm: number;
}

// ── GRIGLIA ───────────────────────────────────────────────────

export interface Griglia {
  nColonne: number;           // montanti.length + 1
  nRighe: number;             // traversi.length + 1
  xPunti: number[];           // punti X assoluti (inclusi bordi telaio)
  yPunti: number[];           // punti Y assoluti (inclusi bordi telaio)
  celle: Cella[];             // nColonne * nRighe celle
}

// ── INFISSO (UNITÀ PRINCIPALE) ────────────────────────────────

export interface Infisso {
  id: string;
  vanoId: string;             // FK commessa vano
  // Dimensioni vano (mm)
  larghezzaVano: number;
  altezzaVano: number;
  spessoreMuro: number;
  // Sistema
  sistema: SistemaProfilo;
  // Struttura
  montanti: Montante[];
  traversi: Traverso[];
  griglia: Griglia;
  // Stato UI (non persistito su DB)
  _cellaSel: string | null;
  _mode: "industrial" | "marketing";
  // Output tecnico aggregato (calcolato, non persistito)
  output?: OutputTecnico;
}

// ── OUTPUT TECNICO ────────────────────────────────────────────

export interface OutputTecnico {
  // Superfici
  areaTotMq: number;
  areaVetroMq: number;
  areaPannelliMq: number;
  // Profili
  mlTelaio: number;
  mlAnte: number;
  mlTotale: number;
  nBarre6m: number;
  sfrido: number;             // %
  // Pesi
  pesoVetriKg: number;
  pesoProfiliKg: number;      // stima ml * kg/ml sistema
  pesoTotaleKg: number;
  // Termica
  uw: number;                 // W/m²K calcolato EN 14351
  ugMedio: number;            // media pesata vetri
  classeEnergetica: "A4"|"A3"|"A2"|"A1"|"A"|"B"|"C"|"D";
  rischioBrinamento: boolean;
  // Economico
  costoVetri: number;
  costoProfiloTelaio: number;
  costoProfiloAnte: number;
  costoFerramenta: number;
  costoTotMateriali: number;
  margine: number;            // %
  prezzoVendita: number;
  // Distinta tagli
  listaTagli: TaglioProfilo[];
  // Distinta componenti
  distinta: DistintaVoce[];
}

export interface TaglioProfilo {
  profiloId: string;
  descrizione: string;
  lunghezzaMm: number;
  quantita: number;
  barraAssegnata: number;     // numero barra 6m
  offset: number;             // posizione nel barra mm
}

export interface DistintaVoce {
  codice: string;
  descrizione: string;
  um: "pz" | "ml" | "m2" | "kg";
  quantita: number;
  costoUnit: number;
  costoTot: number;
}

// ── PAYLOAD SUPABASE ──────────────────────────────────────────
// Tutto ciò che viene persistito — senza i campi _ui e output calcolati

export interface InfissoJSON {
  id: string;
  vano_id: string;
  larghezza_vano: number;
  altezza_vano: number;
  spessore_muro: number;
  sistema: SistemaProfilo;
  montanti: Montante[];
  traversi: Traverso[];
  celle: Pick<Cella,
    "id"|"colIdx"|"rowIdx"|"tipo"|"verso"|"riempimento"|"vetro"|"pannello"|"ferramenta"
  >[];
  created_at?: string;
  updated_at?: string;
}
