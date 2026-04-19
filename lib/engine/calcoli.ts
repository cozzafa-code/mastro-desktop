// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — lib/engine/calcoli.ts
// Calcoli tecnici reali: luci nette, Uw, pesi, ML
// ═══════════════════════════════════════════════════════════════
import type { Profilo } from "./profili";

// ── TIPI OUTPUT ────────────────────────────────────────────────

export interface LuceCella {
  // Luce netta vetro (dimensione vetro da ordinare)
  vetroL: number;
  vetroH: number;
  vetroMq: number;
  // Luce netta anta (dimensione profilo anta)
  antaL: number;
  antaH: number;
  // Luce passaggio (solo porta)
  passaggioL?: number;
  passaggioH?: number;
}

export interface PesoInfisso {
  pesoVetriKg: number;
  pesoProfiliKg: number;
  pesoFerramentaKg: number;
  pesoTotaleKg: number;
  pesoAntaMax: number;     // peso anta più pesante
}

export interface UwCalcolato {
  uw: number;
  ugMedio: number;
  classeEnergetica: "A4"|"A3"|"A2"|"A1"|"A"|"B"|"C"|"D";
}

// ── LUCE NETTA PER CELLA ───────────────────────────────────────
// Formula reale basata su spessori profilo

export function calcolaLuceCella(
  larghezzaCella: number,
  altezzaCella: number,
  profilo: Profilo,
  tipo: string
): LuceCella {
  const { spessoreTelaio: st, spessoreAnta: sa, spessoreFermavetro: sfv, sovrapposizioneAnta: sov } = profilo;

  // Luce anta = cella - 2x battuta telaio + 2x sovrapposizione
  const antaL = larghezzaCella - st * 2 + sov * 2;
  const antaH = altezzaCella - st * 2 + sov * 2;

  // Luce vetro = anta - 2x spessore anta - 2x fermavetro
  const vetroL = Math.max(0, antaL - sa * 2 - sfv * 2);
  const vetroH = Math.max(0, antaH - sa * 2 - sfv * 2);

  // Per il fisso: luce vetro diretta senza anta
  const vetroLFisso = Math.max(0, larghezzaCella - st * 2 - sfv * 2);
  const vetroHFisso = Math.max(0, altezzaCella - st * 2 - sfv * 2);

  const isFisso = tipo === "fisso";
  const finalVetroL = isFisso ? vetroLFisso : vetroL;
  const finalVetroH = isFisso ? vetroHFisso : vetroH;

  const result: LuceCella = {
    vetroL: Math.round(finalVetroL),
    vetroH: Math.round(finalVetroH),
    vetroMq: Math.round(finalVetroL * finalVetroH) / 1_000_000,
    antaL: Math.round(antaL),
    antaH: Math.round(antaH),
  };

  // Luce passaggio porta (netta calpestabile)
  if (tipo === "porta") {
    result.passaggioL = Math.round(antaL - sa * 2);
    result.passaggioH = Math.round(altezzaCella - st - 5); // 5mm soglia
  }

  return result;
}

// ── UW REALISTICO ──────────────────────────────────────────────
// Formula semplificata EN ISO 10077

export function calcolaUw(
  L: number,
  H: number,
  celle: Array<{ areaMq: number; vetroUg?: number }>,
  profilo: Profilo
): UwCalcolato {
  const At = (L * H) / 1_000_000;
  const Ag = celle.reduce((a, c) => a + (c.areaMq || 0), 0);
  const Af = Math.max(0, At - Ag);

  const ugMedioNum = celle.length > 0 && Ag > 0
    ? celle.reduce((a, c) => a + (c.vetroUg || 1.1) * (c.areaMq || 0), 0) / Ag
    : 1.1;

  const psi = 0.04;  // W/mK — psi lineare bordo vetro
  const lg = celle.reduce((a, c) => {
    const side = Math.sqrt(c.areaMq || 0) * 4;
    return a + side;
  }, 0);

  const uw = At > 0
    ? (ugMedioNum * Ag + profilo.Uf * Af + psi * lg) / At
    : 0;

  const uwRound = Math.round(uw * 100) / 100;
  const ugRound = Math.round(ugMedioNum * 100) / 100;

  return {
    uw: uwRound,
    ugMedio: ugRound,
    classeEnergetica: classeFromUw(uwRound),
  };
}

function classeFromUw(uw: number): UwCalcolato["classeEnergetica"] {
  if (uw <= 0.8) return "A4";
  if (uw <= 1.0) return "A3";
  if (uw <= 1.2) return "A2";
  if (uw <= 1.4) return "A1";
  if (uw <= 1.6) return "A";
  if (uw <= 2.0) return "B";
  if (uw <= 2.4) return "C";
  return "D";
}

// ── PESI REALI ─────────────────────────────────────────────────

export function calcolaPesi(
  mlTelaio: number,
  mlAnte: number,
  celle: Array<{ areaMq: number; pesoMqVetro?: number; tipo: string }>,
  profilo: Profilo
): PesoInfisso {
  const pesoVetriKg = Math.round(
    celle.reduce((a, c) => a + (c.areaMq || 0) * (c.pesoMqVetro || 20), 0) * 10
  ) / 10;

  const pesoProfiliKg = Math.round(
    (mlTelaio * profilo.pesoMlTelaio + mlAnte * profilo.pesoMlAnta) * 10
  ) / 10;

  const pesoFerramentaKg = celle.filter(c => c.tipo !== "fisso" && c.tipo !== "pannello_cieco").length * 1.8;

  // Anta più pesante (per controllo regole)
  const pesoAntaMax = Math.max(
    0,
    ...celle
      .filter(c => c.tipo !== "fisso" && c.tipo !== "pannello_cieco")
      .map(c => (c.areaMq || 0) * (c.pesoMqVetro || 20) + 3.5)
  );

  return {
    pesoVetriKg,
    pesoProfiliKg,
    pesoFerramentaKg,
    pesoTotaleKg: Math.round((pesoVetriKg + pesoProfiliKg + pesoFerramentaKg) * 10) / 10,
    pesoAntaMax: Math.round(pesoAntaMax * 10) / 10,
  };
}
