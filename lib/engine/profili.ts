// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — lib/engine/profili.ts
// Catalogo profili con valori tecnici realistici
// ═══════════════════════════════════════════════════════════════

export type MaterialeProfilo = "Alluminio" | "PVC" | "Legno";

export interface Profilo {
  id: string;
  nome: string;
  materiale: MaterialeProfilo;
  // Geometria (mm)
  spessoreTelaio: number;       // larghezza vista telaio fisso
  spessoreAnta: number;         // larghezza vista profilo anta
  spessoreFermavetro: number;   // spessore fermavetro
  sovrapposizioneAnta: number;  // battuta anta su telaio (falsa)
  profonditaTelaio: number;     // profondità muro
  // Termica
  Uf: number;                   // W/m²K trasmittanza profilo
  // Peso e costo
  pesoMlTelaio: number;         // kg/m profilo telaio
  pesoMlAnta: number;           // kg/m profilo anta
  costoMlTelaio: number;        // €/m
  costoMlAnta: number;          // €/m
  // Limiti tecnici
  larghezzaMaxAnta: number;     // mm
  altezzaMaxAnta: number;       // mm
  pesoMaxAnta: number;          // kg
}

// ── CATALOGO 3 PROFILI DEMO ────────────────────────────────────
// Valori basati su specifiche reali Schüco/Aluk/VEKA/Internorm

export const PROFILI_DEMO: Profilo[] = [
  {
    id: "alu_65",
    nome: "Alluminio Serie 65",
    materiale: "Alluminio",
    spessoreTelaio: 65,
    spessoreAnta: 65,
    spessoreFermavetro: 18,
    sovrapposizioneAnta: 12,
    profonditaTelaio: 65,
    Uf: 2.0,
    pesoMlTelaio: 1.85,
    pesoMlAnta: 1.65,
    costoMlTelaio: 28.50,
    costoMlAnta: 22.00,
    larghezzaMaxAnta: 1200,
    altezzaMaxAnta: 2500,
    pesoMaxAnta: 100,
  },
  {
    id: "pvc_70",
    nome: "PVC Serie 70",
    materiale: "PVC",
    spessoreTelaio: 70,
    spessoreAnta: 70,
    spessoreFermavetro: 20,
    sovrapposizioneAnta: 15,
    profonditaTelaio: 70,
    Uf: 1.3,
    pesoMlTelaio: 2.10,
    pesoMlAnta: 1.90,
    costoMlTelaio: 18.20,
    costoMlAnta: 14.50,
    larghezzaMaxAnta: 1100,
    altezzaMaxAnta: 2400,
    pesoMaxAnta: 80,
  },
  {
    id: "legno_80",
    nome: "Legno 80",
    materiale: "Legno",
    spessoreTelaio: 80,
    spessoreAnta: 78,
    spessoreFermavetro: 22,
    sovrapposizioneAnta: 14,
    profonditaTelaio: 80,
    Uf: 1.0,
    pesoMlTelaio: 3.20,
    pesoMlAnta: 2.90,
    costoMlTelaio: 72.00,
    costoMlAnta: 58.00,
    larghezzaMaxAnta: 1000,
    altezzaMaxAnta: 2200,
    pesoMaxAnta: 70,
  },
];

export function getProfiloById(id: string): Profilo | undefined {
  return PROFILI_DEMO.find(p => p.id === id);
}

export const PROFILO_DEFAULT = PROFILI_DEMO[0];
