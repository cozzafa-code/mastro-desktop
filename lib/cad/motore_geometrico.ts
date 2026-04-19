// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — MODULO 1: MOTORE GEOMETRICO
// Input: dimensioni vano + montanti + traversi
// Output: griglia di celle con dimensioni nette reali
// Puro TypeScript, nessuna dipendenza React/UI
// ═══════════════════════════════════════════════════════════════
import type { Montante, Traverso, Griglia, Cella, SistemaProfilo, FerramentaCella } from "./types_cad";

const FERRAMENTA_DEFAULT: FerramentaCella = {
  maniglia: true, maniglione: false, nCerniere: 2,
  cerniereTipo: "standard", chiusuraMultipunto: false, costoFerramenta: 0
};

/**
 * Calcola la griglia di celle dato il vano e la struttura.
 * Restituisce celle con dimensioni nette reali in mm.
 */
export function calcolaGriglia(
  larghezzaVano: number,
  altezzaVano: number,
  montanti: Montante[],
  traversi: Traverso[],
  sistema: SistemaProfilo,
  celleEsistenti: Partial<Cella>[] = []
): Griglia {
  const sp = sistema.spessoreTelaio;

  // Punti X: bordo interno sx + posizioni montanti + bordo interno dx
  const xPunti = [
    sp,
    ...montanti.map(m => m.xMm).sort((a,b) => a-b),
    larghezzaVano - sp
  ];

  // Punti Y: bordo interno top + posizioni traversi + bordo interno bottom
  const yPunti = [
    sp,
    ...traversi.map(t => t.yMm).sort((a,b) => a-b),
    altezzaVano - sp
  ];

  const nCol = xPunti.length - 1;
  const nRow = yPunti.length - 1;
  const celle: Cella[] = [];

  for (let row = 0; row < nRow; row++) {
    for (let col = 0; col < nCol; col++) {
      const id = `${col}-${row}`;
      const esistente = celleEsistenti.find(c => c.id === id) || {};

      // Larghezza netta: sottrae mezzo profilo montante su ogni lato (se non è bordo telaio)
      const x0 = xPunti[col];
      const x1 = xPunti[col + 1];
      const spSxMezzo = col === 0 ? 0 : sp / 2;
      const spDxMezzo = col === nCol - 1 ? 0 : sp / 2;
      const larghezzaNetta = x1 - x0 - spSxMezzo - spDxMezzo;

      const y0 = yPunti[row];
      const y1 = yPunti[row + 1];
      const spTopMezzo = row === 0 ? 0 : sp / 2;
      const spBotMezzo = row === nRow - 1 ? 0 : sp / 2;
      const altezzaNetta = y1 - y0 - spTopMezzo - spBotMezzo;

      const areaMq = (larghezzaNetta * altezzaNetta) / 1_000_000;

      celle.push({
        id,
        colIdx: col,
        rowIdx: row,
        larghezzaNetta: Math.round(larghezzaNetta),
        altezzaNetta: Math.round(altezzaNetta),
        areaMq: Math.round(areaMq * 1000) / 1000,
        tipo: esistente.tipo || "fisso",
        verso: esistente.verso || "sx",
        riempimento: esistente.riempimento || "vetro",
        vetro: esistente.vetro,
        pannello: esistente.pannello,
        ferramenta: esistente.ferramenta || { ...FERRAMENTA_DEFAULT },
        pesoVetro: 0,   // calcolato da calcolaOutput
        costoVetro: 0,
        costoFerramenta: 0,
      });
    }
  }

  return { nColonne: nCol, nRighe: nRow, xPunti, yPunti, celle };
}

/**
 * Aggiunge un montante alla posizione xMm.
 * Clamp: non può stare a meno di 2x spessore dal bordo o da altri montanti.
 */
export function addMontante(
  montanti: Montante[],
  xMm: number,
  larghezzaVano: number,
  sistema: SistemaProfilo
): Montante[] {
  const sp = sistema.spessoreTelaio;
  const min = sp * 2;
  const max = larghezzaVano - sp * 2;
  const x = Math.round(Math.max(min, Math.min(max, xMm)));
  // evita duplicati troppo vicini (< 2x spessore)
  if (montanti.some(m => Math.abs(m.xMm - x) < sp * 2)) return montanti;
  const id = `m${Date.now()}`;
  return [...montanti, { id, xMm: x, spessoreMm: sp }].sort((a,b) => a.xMm - b.xMm);
}

export function addTraverso(
  traversi: Traverso[],
  yMm: number,
  altezzaVano: number,
  sistema: SistemaProfilo
): Traverso[] {
  const sp = sistema.spessoreTelaio;
  const min = sp * 2;
  const max = altezzaVano - sp * 2;
  const y = Math.round(Math.max(min, Math.min(max, yMm)));
  if (traversi.some(t => Math.abs(t.yMm - y) < sp * 2)) return traversi;
  const id = `t${Date.now()}`;
  return [...traversi, { id, yMm: y, spessoreMm: sp }].sort((a,b) => a.yMm - b.yMm);
}

export function moveMontante(
  montanti: Montante[],
  id: string,
  newX: number,
  larghezzaVano: number,
  sistema: SistemaProfilo
): Montante[] {
  const sp = sistema.spessoreTelaio;
  const x = Math.round(Math.max(sp * 2, Math.min(larghezzaVano - sp * 2, newX)));
  return montanti.map(m => m.id === id ? { ...m, xMm: x } : m);
}

export function moveTraverso(
  traversi: Traverso[],
  id: string,
  newY: number,
  altezzaVano: number,
  sistema: SistemaProfilo
): Traverso[] {
  const sp = sistema.spessoreTelaio;
  const y = Math.round(Math.max(sp * 2, Math.min(altezzaVano - sp * 2, newY)));
  return traversi.map(t => t.id === id ? { ...t, yMm: y } : t);
}

/**
 * Suggerisce posizione centrale per nuovo montante/traverso.
 */
export function suggerisciPosMontante(montanti: Montante[], larghezzaVano: number, sistema: SistemaProfilo): number {
  const sp = sistema.spessoreTelaio;
  const pts = [sp, ...montanti.map(m => m.xMm), larghezzaVano - sp];
  let maxGap = 0; let bestX = larghezzaVano / 2;
  for (let i = 0; i < pts.length - 1; i++) {
    const gap = pts[i+1] - pts[i];
    if (gap > maxGap) { maxGap = gap; bestX = Math.round((pts[i] + pts[i+1]) / 2); }
  }
  return bestX;
}

export function suggerisciPosTraverso(traversi: Traverso[], altezzaVano: number, sistema: SistemaProfilo): number {
  const sp = sistema.spessoreTelaio;
  const pts = [sp, ...traversi.map(t => t.yMm), altezzaVano - sp];
  let maxGap = 0; let bestY = altezzaVano / 2;
  for (let i = 0; i < pts.length - 1; i++) {
    const gap = pts[i+1] - pts[i];
    if (gap > maxGap) { maxGap = gap; bestY = Math.round((pts[i] + pts[i+1]) / 2); }
  }
  return bestY;
}
