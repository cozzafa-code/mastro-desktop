// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — types_cad.ts v2.0
// Modello dati ricorsivo: ogni cella può avere sub-griglia
// ═══════════════════════════════════════════════════════════════

export type TipoCella =
  | "fisso" | "anta_battente" | "anta_ribalta"
  | "wasistas" | "porta" | "scorrevole" | "pannello_cieco";

export type VersoApertura = "sx" | "dx" | "interno" | "esterno";

export interface ConfigVetro {
  id: string;
  label: string;
  ugValore: number;
  pesoMq: number;
  costoMq: number;
}

export interface FerramentaCella {
  maniglia: boolean;
  maniglione: boolean;
  nCerniere: number;
  cerniereTipo: "standard" | "rinforzate" | "nascoste";
  chiusuraMultipunto: boolean;
  costoFerramenta: number;
}

// ── MONTANTE/TRAVERSO LOCALE (relativo alla cella padre) ───────
export interface MontanteLocale {
  id: string;
  xMmRel: number;    // mm dal bordo sinistro della cella padre
  spessoreMm: number;
}

export interface TraversoLocale {
  id: string;
  yMmRel: number;    // mm dal bordo superiore della cella padre
  spessoreMm: number;
}

// ── CELLA RICORSIVA ────────────────────────────────────────────
export interface Cella {
  id: string;
  // Posizione nella griglia padre
  colIdx: number;
  rowIdx: number;
  // Dimensioni nette (mm) — calcolate dal motore
  larghezzaNetta: number;
  altezzaNetta: number;
  areaMq: number;
  // Configurazione apertura
  tipo: TipoCella;
  verso: VersoApertura;
  riempimento: "vetro" | "pannello";
  vetro?: ConfigVetro;
  ferramenta: FerramentaCella;
  // ── SUB-GRIGLIA (ricorsiva) ──
  // Se presenti, questa cella è un contenitore con sotto-celle
  subMontanti: MontanteLocale[];
  subTraversi: TraversoLocale[];
  subCelle: Cella[];           // celle figlie, vuoto se cella foglia
  // Calcolati
  pesoVetro: number;
  costoVetro: number;
}

// ── GRIGLIA DI PRIMO LIVELLO ───────────────────────────────────
export interface Griglia {
  nColonne: number;
  nRighe: number;
  xPunti: number[];   // coordinate assolute bordi colonne
  yPunti: number[];   // coordinate assolute bordi righe
  celle: Cella[];
}

// ── INFISSO PRINCIPALE ─────────────────────────────────────────
export interface Infisso {
  id: string;
  vanoId: string;
  larghezzaVano: number;
  altezzaVano: number;
  spessoreMuro: number;
  profilo: any;           // Profilo da lib/engine/profili
  montanti: { id: string; xMm: number; spessoreMm: number }[];
  traversi:  { id: string; yMm: number; spessoreMm: number }[];
  griglia: Griglia;
  _cellaSel: string | null;   // id cella selezionata (path: "0-0" o "0-0.1-0")
  _mode: "industrial" | "marketing";
  sistema: any;               // compat layer renderer
}

// ── PRESET APERTURE ────────────────────────────────────────────
export type PresetApertura =
  | "1_anta_sx" | "1_anta_dx"
  | "2_ante"    | "3_ante"
  | "2_ante_bilico"
  | "fisso"     | "porta_sx" | "porta_dx"
  | "scorrevole_2" | "scorrevole_3";
