// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — lib/engine/distinta.ts
// Genera distinta base completa esplodendo tutti i componenti
// ═══════════════════════════════════════════════════════════════
import type { Profilo } from "./profili";

// ── TIPI DISTINTA ──────────────────────────────────────────────

export interface TaglioProfilo {
  tipo: "telaio_vert" | "telaio_oriz" | "anta_vert" | "anta_oriz" | "montante" | "traverso";
  descrizione: string;
  lunghezzaMm: number;
  quantita: number;
  mlTotale: number;
  costoUnit: number;
  costoTot: number;
  barraAssegnata?: number;   // numero barra 6m
  offsetMm?: number;         // posizione nella barra
}

export interface TaglioVetro {
  cellaId: string;
  tipo: string;              // "4-16-4 Std", ecc.
  larghezza: number;         // mm luce netta vetro
  altezza: number;           // mm luce netta vetro
  mq: number;
  pesoKg: number;
  costoUnit: number;
  costoTot: number;
}

export interface FerramentaItem {
  tipo: string;
  descrizione: string;
  quantita: number;
  costoUnit: number;
  costoTot: number;
}

export interface DistintaBase {
  profili: TaglioProfilo[];
  vetri: TaglioVetro[];
  ferramenta: FerramentaItem[];
  // Totali
  mlProfiliBarre: number;
  nBarre6m: number;
  sfrido: number;           // %
  costoProfilatoTot: number;
  costoVetriTot: number;
  costoFerramentaTot: number;
  costoTot: number;
}

// ── GENERATORE DISTINTA ────────────────────────────────────────

interface CellaInput {
  id: string;
  tipo: string;
  larghezzaNetta: number;
  altezzaNetta: number;
  areaMq: number;
  vetroTipo?: string;
  vetroUg?: number;
  vetroMq?: number;           // luce netta vetro mq
  vetroPesoMq?: number;
  vetroCostoMq?: number;
  ferramenta: {
    maniglia: boolean;
    chiusuraMultipunto: boolean;
    nCerniere: number;
    costoFerramenta: number;
  };
}

export function generaDistinta(
  L: number,
  H: number,
  montantiXmm: number[],
  traversiYmm: number[],
  celle: CellaInput[],
  profilo: Profilo
): DistintaBase {
  const profili: TaglioProfilo[] = [];

  const aggiungiProfilo = (
    tipo: TaglioProfilo["tipo"],
    desc: string,
    lunghezzaMm: number,
    qty: number,
    costoMl: number
  ) => {
    profili.push({
      tipo,
      descrizione: desc,
      lunghezzaMm: Math.round(lunghezzaMm),
      quantita: qty,
      mlTotale: Math.round(lunghezzaMm * qty) / 1000,
      costoUnit: Math.round(costoMl * lunghezzaMm / 1000 * 100) / 100,
      costoTot: Math.round(costoMl * lunghezzaMm / 1000 * qty * 100) / 100,
    });
  };

  // ── TELAIO FISSO ──
  aggiungiProfilo("telaio_vert", "Traverso telaio superiore",  L, 1, profilo.costoMlTelaio);
  aggiungiProfilo("telaio_vert", "Traverso telaio inferiore",  L, 1, profilo.costoMlTelaio);
  aggiungiProfilo("telaio_oriz", "Montante telaio sinistro",   H, 1, profilo.costoMlTelaio);
  aggiungiProfilo("telaio_oriz", "Montante telaio destro",     H, 1, profilo.costoMlTelaio);

  // ── MONTANTI INTERNI ──
  montantiXmm.forEach((_, i) => {
    aggiungiProfilo("montante", `Montante interno ${i+1}`, H - profilo.spessoreTelaio * 2, 1, profilo.costoMlTelaio);
  });

  // ── TRAVERSI INTERNI ──
  traversiYmm.forEach((_, i) => {
    aggiungiProfilo("traverso", `Traverso interno ${i+1}`, L - profilo.spessoreTelaio * 2, 1, profilo.costoMlTelaio);
  });

  // ── PROFILI ANTA per cella mobile ──
  celle.filter(c => c.tipo !== "fisso" && c.tipo !== "pannello_cieco").forEach(c => {
    aggiungiProfilo("anta_vert", `Anta vert. cella ${c.id}`, c.altezzaNetta, 2, profilo.costoMlAnta);
    aggiungiProfilo("anta_oriz", `Anta oriz. cella ${c.id}`, c.larghezzaNetta, 2, profilo.costoMlAnta);
  });

  // ── OTTIMIZZAZIONE BARRE 6m (greedy) ──
  let barra = 1;
  let offsetMm = 0;
  const tagliaLama = 5; // mm lama sega
  profili.forEach(p => {
    for (let q = 0; q < p.quantita; q++) {
      if (offsetMm + p.lunghezzaMm > 6000) { barra++; offsetMm = 0; }
      p.barraAssegnata = barra;
      p.offsetMm = offsetMm;
      offsetMm += p.lunghezzaMm + tagliaLama;
    }
  });

  const mlTot = profili.reduce((a, p) => a + p.mlTotale, 0);
  const nBarre6m = barra;
  const sfrido = nBarre6m > 0
    ? Math.round(((nBarre6m * 6 - mlTot) / (nBarre6m * 6)) * 1000) / 10
    : 0;

  // ── VETRI ──
  const vetri: TaglioVetro[] = celle.map(c => ({
    cellaId: c.id,
    tipo: c.vetroTipo || "4-16-4 Std",
    larghezza: Math.round((c.vetroMq ? Math.sqrt(c.vetroMq) : 0) * 1000) || c.larghezzaNetta,
    altezza: Math.round((c.vetroMq ? Math.sqrt(c.vetroMq) : 0) * 1000) || c.altezzaNetta,
    mq: c.vetroMq || c.areaMq,
    pesoKg: Math.round((c.vetroMq || c.areaMq) * (c.vetroPesoMq || 20) * 10) / 10,
    costoUnit: c.vetroCostoMq || 55,
    costoTot: Math.round((c.vetroMq || c.areaMq) * (c.vetroCostoMq || 55) * 100) / 100,
  }));

  // ── FERRAMENTA ──
  const ferramenta: FerramentaItem[] = [];
  const celleMobili = celle.filter(c => c.tipo !== "fisso" && c.tipo !== "pannello_cieco");

  const aggFer = (tipo: string, desc: string, qty: number, costoUnit: number) => {
    const ex = ferramenta.find(f => f.tipo === tipo);
    if (ex) { ex.quantita += qty; ex.costoTot = Math.round(ex.quantita * ex.costoUnit * 100) / 100; }
    else ferramenta.push({ tipo, descrizione: desc, quantita: qty, costoUnit, costoTot: Math.round(qty * costoUnit * 100) / 100 });
  };

  celleMobili.forEach(c => {
    aggFer("cerniera_std", "Cerniera standard", c.ferramenta.nCerniere, 4.50);
    if (c.ferramenta.maniglia) aggFer("maniglia_std", "Maniglia standard", 1, 18.00);
    if (c.ferramenta.chiusuraMultipunto) aggFer("multipunto", "Chiusura multipunto", 1, 45.00);
    if (c.tipo === "porta") aggFer("maniglione", "Maniglione porta", 1, 65.00);
    if (c.tipo === "scorrevole") aggFer("kit_scorrevole", "Kit binario scorrevole", 1, 85.00);
  });

  const costoProfilatoTot = Math.round(profili.reduce((a, p) => a + p.costoTot, 0) * 100) / 100;
  const costoVetriTot = Math.round(vetri.reduce((a, v) => a + v.costoTot, 0) * 100) / 100;
  const costoFerramentaTot = Math.round(ferramenta.reduce((a, f) => a + f.costoTot, 0) * 100) / 100;

  return {
    profili,
    vetri,
    ferramenta,
    mlProfiliBarre: Math.round(mlTot * 100) / 100,
    nBarre6m,
    sfrido,
    costoProfilatoTot,
    costoVetriTot,
    costoFerramentaTot,
    costoTot: Math.round((costoProfilatoTot + costoVetriTot + costoFerramentaTot) * 100) / 100,
  };
}
