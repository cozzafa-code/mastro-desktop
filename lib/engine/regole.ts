// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — lib/engine/regole.ts
// Controlli tecnici reali: limiti anta, vetro, peso
// ═══════════════════════════════════════════════════════════════
import type { Profilo } from "./profili";

export type SeveritaRegola = "errore" | "warning" | "info";

export interface ViolazioneRegola {
  cellaId: string;
  codice: string;
  severita: SeveritaRegola;
  messaggio: string;
  valore: number;
  limite: number;
}

interface CellaRegole {
  id: string;
  tipo: string;
  larghezzaNetta: number;
  altezzaNetta: number;
  pesoAntaKg: number;
  vetroL: number;
  vetroH: number;
}

// ── LIMITI VETRO (UNI EN 14351) ────────────────────────────────
const VETRO_MAX_L = 3000;   // mm
const VETRO_MAX_H = 4000;   // mm
const VETRO_MAX_MQ = 6.0;   // m²
const VETRO_MIN_L = 200;    // mm
const VETRO_MIN_H = 200;    // mm

// ── VERIFICA SINGOLA CELLA ─────────────────────────────────────

export function verificaCella(cella: CellaRegole, profilo: Profilo): ViolazioneRegola[] {
  const violazioni: ViolazioneRegola[] = [];
  const { id, tipo, larghezzaNetta, altezzaNetta, pesoAntaKg, vetroL, vetroH } = cella;

  if (tipo === "fisso" || tipo === "pannello_cieco") {
    // Solo controlli vetro per fisso
    const mq = (vetroL * vetroH) / 1_000_000;
    if (mq > VETRO_MAX_MQ)
      violazioni.push({ cellaId: id, codice: "VETRO_MAX_MQ", severita: "warning", messaggio: `Vetro fisso di grandi dimensioni (${mq.toFixed(2)} m²) — verificare trasportabilità`, valore: mq, limite: VETRO_MAX_MQ });
    return violazioni;
  }

  // ── Dimensione anta ──
  if (larghezzaNetta > profilo.larghezzaMaxAnta)
    violazioni.push({ cellaId: id, codice: "ANTA_MAX_L", severita: "errore", messaggio: `Anta fuori specifica: larghezza ${larghezzaNetta}mm supera il max ${profilo.larghezzaMaxAnta}mm per ${profilo.nome}`, valore: larghezzaNetta, limite: profilo.larghezzaMaxAnta });
  else if (larghezzaNetta > profilo.larghezzaMaxAnta * 0.85)
    violazioni.push({ cellaId: id, codice: "ANTA_MAX_L_WARN", severita: "warning", messaggio: `Anta larga ${larghezzaNetta}mm — vicina al limite massimo ${profilo.larghezzaMaxAnta}mm`, valore: larghezzaNetta, limite: profilo.larghezzaMaxAnta });

  if (altezzaNetta > profilo.altezzaMaxAnta)
    violazioni.push({ cellaId: id, codice: "ANTA_MAX_H", severita: "errore", messaggio: `Anta fuori specifica: altezza ${altezzaNetta}mm supera il max ${profilo.altezzaMaxAnta}mm per ${profilo.nome}`, valore: altezzaNetta, limite: profilo.altezzaMaxAnta });

  // ── Peso anta ──
  if (pesoAntaKg > profilo.pesoMaxAnta)
    violazioni.push({ cellaId: id, codice: "ANTA_PESO_MAX", severita: "errore", messaggio: `Peso anta ${pesoAntaKg.toFixed(1)}kg supera il massimo ${profilo.pesoMaxAnta}kg — necessarie cerniere rinforzate`, valore: pesoAntaKg, limite: profilo.pesoMaxAnta });
  else if (pesoAntaKg > profilo.pesoMaxAnta * 0.75)
    violazioni.push({ cellaId: id, codice: "ANTA_PESO_WARN", severita: "warning", messaggio: `Peso anta ${pesoAntaKg.toFixed(1)}kg — consigliare cerniere rinforzate oltre ${Math.round(profilo.pesoMaxAnta * 0.75)}kg`, valore: pesoAntaKg, limite: profilo.pesoMaxAnta * 0.75 });

  // ── Dimensione vetro ──
  if (vetroL > VETRO_MAX_L || vetroH > VETRO_MAX_H)
    violazioni.push({ cellaId: id, codice: "VETRO_DIM_MAX", severita: "errore", messaggio: `Vetro ${vetroL}×${vetroH}mm fuori dai limiti standard (max ${VETRO_MAX_L}×${VETRO_MAX_H}mm)`, valore: Math.max(vetroL, vetroH), limite: Math.max(VETRO_MAX_L, VETRO_MAX_H) });

  if (vetroL < VETRO_MIN_L || vetroH < VETRO_MIN_H)
    violazioni.push({ cellaId: id, codice: "VETRO_DIM_MIN", severita: "warning", messaggio: `Vetro ${vetroL}×${vetroH}mm troppo piccolo — verificare fattibilità`, valore: Math.min(vetroL, vetroH), limite: VETRO_MIN_L });

  // ── Porta: luce passaggio minima ──
  if (tipo === "porta") {
    if (larghezzaNetta < 700)
      violazioni.push({ cellaId: id, codice: "PORTA_MIN_L", severita: "errore", messaggio: `Luce porta ${larghezzaNetta}mm insufficiente — minimo 700mm`, valore: larghezzaNetta, limite: 700 });
    if (altezzaNetta < 2000)
      violazioni.push({ cellaId: id, codice: "PORTA_MIN_H", severita: "warning", messaggio: `Altezza porta ${altezzaNetta}mm — inferiore a 2000mm`, valore: altezzaNetta, limite: 2000 });
  }

  return violazioni;
}

// ── VERIFICA INTERA CONFIGURAZIONE ────────────────────────────

export function verificaConfigurazione(celle: CellaRegole[], profilo: Profilo): ViolazioneRegola[] {
  return celle.flatMap(c => verificaCella(c, profilo));
}

export function haErrori(violazioni: ViolazioneRegola[]): boolean {
  return violazioni.some(v => v.severita === "errore");
}

export function haWarning(violazioni: ViolazioneRegola[]): boolean {
  return violazioni.some(v => v.severita === "warning");
}
