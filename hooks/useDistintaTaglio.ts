// ============================================================
// MASTRO — Cut List Engine (Distinta Taglio)
// hooks/useDistintaTaglio.ts
// ============================================================
// Pure calculation engine. No Supabase dependency in core calc.
// Supabase used only for loading regole + saving risultati.
// ============================================================

// ---- TYPES ----

export type Tipologia =
  | '1A'         // 1 anta battente
  | '2A'         // 2 ante battenti
  | '2A_RIB'     // 2 ante battente + ribalta
  | 'VASISTAS'   // ribalta singola (apertura alto)
  | 'PORTA_1A'   // portafinestra 1 anta
  | 'SCORR_2A'   // scorrevole 2 ante
  | 'FISSO'      // fisso (no ante)
  | 'ANTA_ANTA'  // 2 ante con traverso
  | 'BILICO'     // bilico orizzontale
  | '3A';        // 3 ante

export interface RegolaDistinta {
  id?: string;
  serie: string;
  materiale: 'PVC' | 'AL' | 'LEGNO' | 'LEGNO_AL';
  fornitore?: string;
  delta_telaio_w: number;
  delta_telaio_h: number;
  delta_anta: number;
  delta_vetro_w: number;
  delta_vetro_h: number;
  delta_soglia: number;
  delta_traverso: number;
  delta_fermavetro: number;
  riporto_anta: number;
  gioco_anta: number;
  gioco_vetro: number;
  profilo_telaio_id?: string;
  profilo_anta_id?: string;
  profilo_soglia_id?: string;
  profilo_traverso_id?: string;
  profilo_fermavetro_id?: string;
}

export type ElementoTipo =
  | 'TELAIO'
  | 'ANTA'
  | 'VETRO'
  | 'SOGLIA'
  | 'ZOCCOLO'
  | 'TRAVERSO'
  | 'FERMAVETRO'
  | 'GUARNIZIONE_TELAIO'
  | 'GUARNIZIONE_ANTA'
  | 'GUARNIZIONE_VETRO'
  | 'FERRAMENTA';

export interface PezzoDistinta {
  elemento: string;           // e.g. 'TELAIO_MONTANTE_SX'
  tipo: ElementoTipo;
  descrizione: string;        // human readable
  lunghezza_mm: number;
  quantita: number;
  angolo_taglio: number;      // 45 or 90
  profilo_nome?: string;
  note?: string;
}

export interface DistintaResult {
  tipologia: Tipologia;
  serie: string;
  materiale: string;
  larghezza: number;          // input W mm
  altezza: number;            // input H mm
  pezzi: PezzoDistinta[];
  riepilogo: {
    totale_pezzi: number;
    totale_profili_ml: number;
    totale_vetri: number;
    totale_guarnizioni_ml: number;
    luce_vetro_w: number;
    luce_vetro_h: number;
    taglio_telaio_w: number;
    taglio_telaio_h: number;
    taglio_anta_w: number;
    taglio_anta_h: number;
  };
  warnings: string[];
}

// ---- TIPOLOGIA CONFIGS ----

interface TipologiaConfig {
  n_ante: number;
  has_soglia: boolean;
  has_traverso: boolean;
  has_zoccolo: boolean;
  is_scorrevole: boolean;
  is_fisso: boolean;
  angolo_telaio: number;      // 45 for PVC welded, 90 for AL cut
  angolo_anta: number;
}

const TIPOLOGIA_CONFIG: Record<Tipologia, TipologiaConfig> = {
  '1A':        { n_ante: 1, has_soglia: false, has_traverso: false, has_zoccolo: false, is_scorrevole: false, is_fisso: false, angolo_telaio: 45, angolo_anta: 45 },
  '2A':        { n_ante: 2, has_soglia: false, has_traverso: false, has_zoccolo: false, is_scorrevole: false, is_fisso: false, angolo_telaio: 45, angolo_anta: 45 },
  '2A_RIB':    { n_ante: 2, has_soglia: false, has_traverso: false, has_zoccolo: false, is_scorrevole: false, is_fisso: false, angolo_telaio: 45, angolo_anta: 45 },
  'VASISTAS':  { n_ante: 1, has_soglia: false, has_traverso: false, has_zoccolo: false, is_scorrevole: false, is_fisso: false, angolo_telaio: 45, angolo_anta: 45 },
  'PORTA_1A':  { n_ante: 1, has_soglia: true,  has_traverso: false, has_zoccolo: true,  is_scorrevole: false, is_fisso: false, angolo_telaio: 45, angolo_anta: 45 },
  'SCORR_2A':  { n_ante: 2, has_soglia: true,  has_traverso: false, has_zoccolo: false, is_scorrevole: true,  is_fisso: false, angolo_telaio: 90, angolo_anta: 90 },
  'FISSO':     { n_ante: 0, has_soglia: false, has_traverso: false, has_zoccolo: false, is_scorrevole: false, is_fisso: true,  angolo_telaio: 45, angolo_anta: 45 },
  'ANTA_ANTA': { n_ante: 2, has_soglia: false, has_traverso: true,  has_zoccolo: false, is_scorrevole: false, is_fisso: false, angolo_telaio: 45, angolo_anta: 45 },
  'BILICO':    { n_ante: 1, has_soglia: false, has_traverso: false, has_zoccolo: false, is_scorrevole: false, is_fisso: false, angolo_telaio: 45, angolo_anta: 45 },
  '3A':        { n_ante: 3, has_soglia: false, has_traverso: true,  has_zoccolo: false, is_scorrevole: false, is_fisso: false, angolo_telaio: 45, angolo_anta: 45 },
};

// ---- CORE ENGINE ----

export function calcolaDistinta(
  tipologia: Tipologia,
  W: number,  // larghezza esterna mm
  H: number,  // altezza esterna mm
  regola: RegolaDistinta
): DistintaResult {
  const cfg = TIPOLOGIA_CONFIG[tipologia];
  const pezzi: PezzoDistinta[] = [];
  const warnings: string[] = [];

  // Override angles based on material
  const angolo_t = regola.materiale === 'AL' ? 90 : cfg.angolo_telaio;
  const angolo_a = regola.materiale === 'AL' ? 90 : cfg.angolo_anta;

  // ============================================================
  // 1. TELAIO (frame)
  // ============================================================
  // Taglio telaio = dimensione esterna - delta_telaio
  const telaio_w = W - regola.delta_telaio_w;
  const telaio_h = H - regola.delta_telaio_h;

  if (cfg.has_soglia) {
    // Portefinestra: 2 montanti + 1 traverso superiore + 1 soglia (no traverso inferiore)
    pezzi.push({
      elemento: 'TELAIO_MONTANTE_SX',
      tipo: 'TELAIO',
      descrizione: 'Montante telaio sinistro',
      lunghezza_mm: telaio_h,
      quantita: 1,
      angolo_taglio: angolo_t,
      note: 'Taglio superiore a ' + angolo_t + '°, inferiore a 90° (appoggio soglia)'
    });
    pezzi.push({
      elemento: 'TELAIO_MONTANTE_DX',
      tipo: 'TELAIO',
      descrizione: 'Montante telaio destro',
      lunghezza_mm: telaio_h,
      quantita: 1,
      angolo_taglio: angolo_t,
      note: 'Taglio superiore a ' + angolo_t + '°, inferiore a 90° (appoggio soglia)'
    });
    pezzi.push({
      elemento: 'TELAIO_TRAVERSO_SUP',
      tipo: 'TELAIO',
      descrizione: 'Traverso superiore telaio',
      lunghezza_mm: telaio_w,
      quantita: 1,
      angolo_taglio: angolo_t,
    });
  } else {
    // Standard: 2 montanti + 2 traversi
    pezzi.push({
      elemento: 'TELAIO_MONTANTE_SX',
      tipo: 'TELAIO',
      descrizione: 'Montante telaio sinistro',
      lunghezza_mm: telaio_h,
      quantita: 1,
      angolo_taglio: angolo_t,
    });
    pezzi.push({
      elemento: 'TELAIO_MONTANTE_DX',
      tipo: 'TELAIO',
      descrizione: 'Montante telaio destro',
      lunghezza_mm: telaio_h,
      quantita: 1,
      angolo_taglio: angolo_t,
    });
    pezzi.push({
      elemento: 'TELAIO_TRAVERSO_SUP',
      tipo: 'TELAIO',
      descrizione: 'Traverso superiore telaio',
      lunghezza_mm: telaio_w,
      quantita: 1,
      angolo_taglio: angolo_t,
    });
    pezzi.push({
      elemento: 'TELAIO_TRAVERSO_INF',
      tipo: 'TELAIO',
      descrizione: 'Traverso inferiore telaio',
      lunghezza_mm: telaio_w,
      quantita: 1,
      angolo_taglio: angolo_t,
    });
  }

  // ============================================================
  // 2. SOGLIA (threshold — only portefinestre/scorrevoli)
  // ============================================================
  if (cfg.has_soglia) {
    const soglia_w = telaio_w - regola.delta_soglia;
    pezzi.push({
      elemento: 'SOGLIA',
      tipo: 'SOGLIA',
      descrizione: 'Soglia portafinestra',
      lunghezza_mm: soglia_w > 0 ? soglia_w : telaio_w,
      quantita: 1,
      angolo_taglio: 90,
      note: 'Taglio dritto, appoggio a terra'
    });
  }

  // ============================================================
  // 3. ANTE (sashes)
  // ============================================================
  if (!cfg.is_fisso && cfg.n_ante > 0) {
    // Luce interna telaio (spazio disponibile per ante)
    // Per scorrevoli: le ante si sovrappongono, non si divide
    let anta_w: number;
    let anta_h: number;

    if (cfg.is_scorrevole) {
      // Scorrevole: ogni anta = larghezza telaio / 2 + riporto (overlap)
      anta_w = Math.round(telaio_w / 2) + regola.riporto_anta - regola.delta_anta;
      anta_h = telaio_h - regola.delta_anta;
    } else if (cfg.has_traverso) {
      // Con traverso: anta_w = (telaio_w / n_ante) - delta_anta
      // Il traverso divide orizzontalmente
      anta_w = Math.round(telaio_w / cfg.n_ante) - regola.delta_anta;
      anta_h = telaio_h - regola.delta_anta;
    } else {
      // Standard: anta_w = (telaio_w / n_ante) - delta_anta
      anta_w = Math.round(telaio_w / cfg.n_ante) - regola.delta_anta;
      anta_h = telaio_h - regola.delta_anta;
    }

    // For each sash
    const antaLabels = cfg.n_ante === 1 ? [''] : 
                       cfg.n_ante === 2 ? ['_SX', '_DX'] : 
                       ['_SX', '_CENTRO', '_DX'];

    for (let i = 0; i < cfg.n_ante; i++) {
      const suffix = antaLabels[i] || `_${i + 1}`;
      
      pezzi.push({
        elemento: `ANTA${suffix}_MONTANTE_SX`,
        tipo: 'ANTA',
        descrizione: `Montante sinistro anta${suffix.toLowerCase()}`,
        lunghezza_mm: anta_h,
        quantita: 1,
        angolo_taglio: angolo_a,
      });
      pezzi.push({
        elemento: `ANTA${suffix}_MONTANTE_DX`,
        tipo: 'ANTA',
        descrizione: `Montante destro anta${suffix.toLowerCase()}`,
        lunghezza_mm: anta_h,
        quantita: 1,
        angolo_taglio: angolo_a,
      });
      pezzi.push({
        elemento: `ANTA${suffix}_TRAVERSO_SUP`,
        tipo: 'ANTA',
        descrizione: `Traverso superiore anta${suffix.toLowerCase()}`,
        lunghezza_mm: anta_w,
        quantita: 1,
        angolo_taglio: angolo_a,
      });
      pezzi.push({
        elemento: `ANTA${suffix}_TRAVERSO_INF`,
        tipo: 'ANTA',
        descrizione: `Traverso inferiore anta${suffix.toLowerCase()}`,
        lunghezza_mm: anta_w,
        quantita: 1,
        angolo_taglio: angolo_a,
      });
    }

    // ============================================================
    // 4. VETRO (glass) — per ogni anta
    // ============================================================
    const vetro_w = anta_w - regola.delta_vetro_w;
    const vetro_h = anta_h - regola.delta_vetro_h;

    for (let i = 0; i < cfg.n_ante; i++) {
      const suffix = antaLabels[i] || `_${i + 1}`;
      pezzi.push({
        elemento: `VETRO${suffix}`,
        tipo: 'VETRO',
        descrizione: `Vetrocamera anta${suffix.toLowerCase()}`,
        lunghezza_mm: 0, // vetro is W x H, not a linear cut
        quantita: 1,
        angolo_taglio: 90,
        note: `${vetro_w} x ${vetro_h} mm`
      });
    }

    // ============================================================
    // 5. FERMAVETRO (glazing bead) — 4 per vetro
    // ============================================================
    for (let i = 0; i < cfg.n_ante; i++) {
      const suffix = antaLabels[i] || `_${i + 1}`;
      const fv_w = vetro_w - regola.delta_fermavetro;
      const fv_h = vetro_h - regola.delta_fermavetro;
      
      pezzi.push({
        elemento: `FV${suffix}_ORIZZ`,
        tipo: 'FERMAVETRO',
        descrizione: `Fermavetro orizzontale anta${suffix.toLowerCase()}`,
        lunghezza_mm: fv_w > 0 ? fv_w : vetro_w,
        quantita: 2,
        angolo_taglio: 45,
      });
      pezzi.push({
        elemento: `FV${suffix}_VERT`,
        tipo: 'FERMAVETRO',
        descrizione: `Fermavetro verticale anta${suffix.toLowerCase()}`,
        lunghezza_mm: fv_h > 0 ? fv_h : vetro_h,
        quantita: 2,
        angolo_taglio: 45,
      });
    }

    // ============================================================
    // 6. GUARNIZIONI ANTA (sash gaskets) — perimeter per anta
    // ============================================================
    for (let i = 0; i < cfg.n_ante; i++) {
      const suffix = antaLabels[i] || `_${i + 1}`;
      const perimetro_anta = 2 * (anta_w + anta_h);
      pezzi.push({
        elemento: `GUARNIZIONE_ANTA${suffix}`,
        tipo: 'GUARNIZIONE_ANTA',
        descrizione: `Guarnizione perimetrale anta${suffix.toLowerCase()}`,
        lunghezza_mm: perimetro_anta,
        quantita: 1,
        angolo_taglio: 0,
        note: 'Taglio dritto, metro lineare'
      });
    }

    // Store for riepilogo
    var taglio_anta_w_out = anta_w;
    var taglio_anta_h_out = anta_h;
    var luce_vetro_w_out = vetro_w;
    var luce_vetro_h_out = vetro_h;

  } else if (cfg.is_fisso) {
    // FISSO: vetro direttamente nel telaio
    const vetro_w = telaio_w - regola.delta_vetro_w;
    const vetro_h = telaio_h - regola.delta_vetro_h;

    pezzi.push({
      elemento: 'VETRO_FISSO',
      tipo: 'VETRO',
      descrizione: 'Vetrocamera fisso',
      lunghezza_mm: 0,
      quantita: 1,
      angolo_taglio: 90,
      note: `${vetro_w} x ${vetro_h} mm`
    });

    // Fermavetro fisso
    const fv_w = vetro_w - regola.delta_fermavetro;
    const fv_h = vetro_h - regola.delta_fermavetro;
    pezzi.push({
      elemento: 'FV_FISSO_ORIZZ',
      tipo: 'FERMAVETRO',
      descrizione: 'Fermavetro orizzontale fisso',
      lunghezza_mm: fv_w > 0 ? fv_w : vetro_w,
      quantita: 2,
      angolo_taglio: 45,
    });
    pezzi.push({
      elemento: 'FV_FISSO_VERT',
      tipo: 'FERMAVETRO',
      descrizione: 'Fermavetro verticale fisso',
      lunghezza_mm: fv_h > 0 ? fv_h : vetro_h,
      quantita: 2,
      angolo_taglio: 45,
    });

    var taglio_anta_w_out = 0;
    var taglio_anta_h_out = 0;
    var luce_vetro_w_out = vetro_w;
    var luce_vetro_h_out = vetro_h;
  } else {
    var taglio_anta_w_out = 0;
    var taglio_anta_h_out = 0;
    var luce_vetro_w_out = 0;
    var luce_vetro_h_out = 0;
  }

  // ============================================================
  // 7. TRAVERSO CENTRALE (central transom)
  // ============================================================
  if (cfg.has_traverso) {
    const traverso_w = telaio_w - regola.delta_traverso;
    pezzi.push({
      elemento: 'TRAVERSO_CENTRALE',
      tipo: 'TRAVERSO',
      descrizione: 'Traverso centrale (montante divisorio)',
      lunghezza_mm: telaio_h, // vertical divider = height of frame
      quantita: cfg.n_ante === 3 ? 2 : 1,
      angolo_taglio: 90,
      note: 'Divide le ante verticalmente'
    });
  }

  // ============================================================
  // 8. ZOCCOLO (kick plate — only portefinestre)
  // ============================================================
  if (cfg.has_zoccolo) {
    pezzi.push({
      elemento: 'ZOCCOLO',
      tipo: 'ZOCCOLO',
      descrizione: 'Zoccolo inferiore portafinestra',
      lunghezza_mm: telaio_w,
      quantita: 1,
      angolo_taglio: 90,
      note: 'Profilo di finitura sotto soglia'
    });
  }

  // ============================================================
  // 9. GUARNIZIONE TELAIO (frame gasket — perimeter)
  // ============================================================
  const perimetro_telaio = 2 * (telaio_w + telaio_h);
  pezzi.push({
    elemento: 'GUARNIZIONE_TELAIO',
    tipo: 'GUARNIZIONE_TELAIO',
    descrizione: 'Guarnizione perimetrale telaio',
    lunghezza_mm: perimetro_telaio,
    quantita: 1,
    angolo_taglio: 0,
    note: 'Metro lineare, taglio dritto'
  });

  // ============================================================
  // 10. GUARNIZIONE VETRO (glass gasket — per vetro)
  // ============================================================
  const n_vetri = cfg.is_fisso ? 1 : cfg.n_ante;
  for (let i = 0; i < n_vetri; i++) {
    const perimetro_vetro = 2 * (luce_vetro_w_out + luce_vetro_h_out);
    pezzi.push({
      elemento: `GUARNIZIONE_VETRO_${i + 1}`,
      tipo: 'GUARNIZIONE_VETRO',
      descrizione: `Guarnizione vetro n.${i + 1}`,
      lunghezza_mm: perimetro_vetro,
      quantita: 1,
      angolo_taglio: 0,
    });
  }

  // ============================================================
  // 11. FERRAMENTA (hardware — count only, no cut length)
  // ============================================================
  if (!cfg.is_fisso) {
    // Cremonese (1 per anta battente, 0 per scorrevole)
    if (!cfg.is_scorrevole) {
      pezzi.push({
        elemento: 'CREMONESE',
        tipo: 'FERRAMENTA',
        descrizione: 'Cremonese / maniglione',
        lunghezza_mm: 0,
        quantita: cfg.n_ante,
        angolo_taglio: 0,
        note: tipologia === 'VASISTAS' ? 'Tipo vasistas' : 'Tipo battente/ribalta'
      });
    }

    // Cerniere (2-3 per anta, based on height)
    const cerniere_per_anta = (taglio_anta_h_out || telaio_h) > 1800 ? 3 : 2;
    pezzi.push({
      elemento: 'CERNIERE',
      tipo: 'FERRAMENTA',
      descrizione: 'Cerniere',
      lunghezza_mm: 0,
      quantita: cerniere_per_anta * cfg.n_ante,
      angolo_taglio: 0,
      note: `${cerniere_per_anta} per anta`
    });

    // Maniglia (1 per anta)
    pezzi.push({
      elemento: 'MANIGLIA',
      tipo: 'FERRAMENTA',
      descrizione: 'Maniglia',
      lunghezza_mm: 0,
      quantita: cfg.n_ante,
      angolo_taglio: 0,
    });

    // Incontri / scontri
    pezzi.push({
      elemento: 'INCONTRI',
      tipo: 'FERRAMENTA',
      descrizione: 'Incontri / scontri chiusura',
      lunghezza_mm: 0,
      quantita: cfg.n_ante * 2,
      angolo_taglio: 0,
    });
  }

  // ============================================================
  // WARNINGS
  // ============================================================
  if (W < 400 || H < 400) warnings.push('Dimensioni molto piccole — verificare');
  if (W > 3000) warnings.push('Larghezza > 3m — verificare portata profilo');
  if (H > 2800) warnings.push('Altezza > 2.8m — verificare classe vento');
  if (luce_vetro_w_out < 100 || luce_vetro_h_out < 100) {
    warnings.push('Luce vetro troppo piccola — controllare delta');
  }
  if (regola.delta_vetro_w === 0 && regola.delta_vetro_h === 0) {
    warnings.push('Delta vetro non configurato — il calcolo vetro potrebbe non essere corretto');
  }

  // ============================================================
  // RIEPILOGO
  // ============================================================
  const totale_pezzi = pezzi.reduce((s, p) => s + p.quantita, 0);
  const totale_profili_ml = pezzi
    .filter(p => ['TELAIO', 'ANTA', 'SOGLIA', 'ZOCCOLO', 'TRAVERSO', 'FERMAVETRO'].includes(p.tipo))
    .reduce((s, p) => s + (p.lunghezza_mm * p.quantita), 0) / 1000;
  const totale_vetri = pezzi.filter(p => p.tipo === 'VETRO').reduce((s, p) => s + p.quantita, 0);
  const totale_guarnizioni_ml = pezzi
    .filter(p => p.tipo.startsWith('GUARNIZIONE'))
    .reduce((s, p) => s + (p.lunghezza_mm * p.quantita), 0) / 1000;

  return {
    tipologia,
    serie: regola.serie,
    materiale: regola.materiale,
    larghezza: W,
    altezza: H,
    pezzi,
    riepilogo: {
      totale_pezzi,
      totale_profili_ml: Math.round(totale_profili_ml * 100) / 100,
      totale_vetri,
      totale_guarnizioni_ml: Math.round(totale_guarnizioni_ml * 100) / 100,
      luce_vetro_w: luce_vetro_w_out,
      luce_vetro_h: luce_vetro_h_out,
      taglio_telaio_w: telaio_w,
      taglio_telaio_h: telaio_h,
      taglio_anta_w: taglio_anta_w_out,
      taglio_anta_h: taglio_anta_h_out,
    },
    warnings,
  };
}

// ---- HELPER: format for display ----

export function formatDistintaTable(result: DistintaResult): string[][] {
  const header = ['#', 'Elemento', 'Tipo', 'Lunghezza (mm)', 'Qtà', 'Angolo', 'Note'];
  const rows = result.pezzi.map((p, i) => [
    String(i + 1),
    p.descrizione,
    p.tipo,
    p.lunghezza_mm > 0 ? String(p.lunghezza_mm) : (p.note || '-'),
    String(p.quantita),
    p.angolo_taglio > 0 ? `${p.angolo_taglio}°` : '-',
    p.note || '',
  ]);
  return [header, ...rows];
}

// ---- TEST: IDEAL4000 2A 1200x1400 ----
// Expected (from Opera/real production):
//   Telaio montante: 1400mm, Telaio traverso: 1200mm
//   Anta montante: 1400-84=1316mm, Anta traverso: 600-84=516mm (1200/2=600)
//   Vetro: 516-150=366mm x 1316-132=1184mm
//   Fermavetro: ~366 x ~1184 (depending on delta_fv)
//
// To run test:
// const result = calcolaDistinta('2A', 1200, 1400, {
//   serie: 'IDEAL4000', materiale: 'PVC', delta_telaio_w: 0, delta_telaio_h: 0,
//   delta_anta: 84, delta_vetro_w: 150, delta_vetro_h: 132,
//   delta_soglia: 0, delta_traverso: 84, delta_fermavetro: 0,
//   riporto_anta: 110, gioco_anta: 0, gioco_vetro: 0,
// });
