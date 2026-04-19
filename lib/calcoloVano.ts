// ============================================================
// MASTRO — lib/calcoloVano.ts
// Motore di calcolo: da misure vano → lista taglio + accessori
// Puro TypeScript, zero dipendenze UI
// ============================================================

// --- TIPI ---------------------------------------------------

export interface MisureVano {
  lCentro: number   // larghezza luce centro-telaio (mm)
  hCentro: number   // altezza luce centro-telaio (mm)
  lMuro?: number    // larghezza foro muro
  hMuro?: number    // altezza foro muro
  lLuce?: number    // larghezza luce netta (vetro)
  hLuce?: number    // altezza luce netta (vetro)
  spessore_muro?: number
}

export interface ConfigVano {
  tipo: string          // 'F1A' | 'F2A' | 'FX' | 'PF' | 'P1B' ...
  pezzi: number
  sistema: string       // nome sistema es. "Schüco AWS 75"
  regole?: RegolaCalcolo
}

export interface ConfigVetro {
  attivo: boolean
  composizione: string  // es. "4/16/4 basso emissivo"
  trattamento?: string  // 'temperato' | 'satinato' | ''
  giunto_mm?: number    // spazio telaio-vetro (default 5mm)
}

export interface ConfigPersiana {
  attivo: boolean
  materiale: 'alluminio' | 'pvc' | ''
  tipo: string
  colore: string
  passo_stecca_mm?: number  // default 87mm alluminio, 77mm pvc
}

export interface ConfigTapparella {
  attivo: boolean
  materiale: string
  tipo: string
  colore: string
  comando: 'manuale' | 'motore' | ''
}

export interface ConfigZanzariera {
  attivo: boolean
  tipo: 'fissa' | 'scorrevole' | 'plisse' | ''
  colore: string
}

export interface RegolaCalcolo {
  // Tolleranze taglio profili (mm)
  tolleranza_telaio?: number      // default -2mm
  tolleranza_anta?: number        // default -4mm
  // Offset luce vetro rispetto a lCentro/hCentro
  offset_vetro_l?: number         // default -62mm (standard alluminio)
  offset_vetro_h?: number         // default -62mm
  // Ferramenta per tipo apertura
  cerniere_per_anta?: number      // default 3
  // Persiana
  passo_stecca_all?: number       // default 87mm
  passo_stecca_pvc?: number       // default 77mm
}

export interface RigaTaglio {
  profilo: string           // es. "Traverso telaio"
  codice?: string
  lunghezza_mm: number
  qta: number
  note?: string
}

export interface RigaAccessorio {
  nome: string
  categoria: 'ferramenta' | 'guarnizione' | 'vetro' | 'tappo' | 'coprifilo' | 'soglia' | 'altro'
  qta: number
  unita: 'pz' | 'ml' | 'mq'
  formula: string           // formula usata per debug/audit
}

export interface RigaOrdine {
  categoria: 'serramento' | 'vetro' | 'tapparella' | 'persiana' | 'zanzariera' | 'ferramenta'
  descrizione: string
  qta: number
  unita: string
  note?: string
}

export interface OutputCalcolo {
  vano_id: string | number
  vano_nome: string
  lista_taglio: RigaTaglio[]
  accessori: RigaAccessorio[]
  vetro?: {
    luce_l: number
    luce_h: number
    mq: number
    composizione: string
    qta: number
  }
  persiana?: {
    n_stecche: number
    ml_guide: number
    ml_ferramenta_continua: number
    ml_nastro: number
  }
  righe_ordine: RigaOrdine[]
  avvisi: string[]
}

// --- PARSER TIPO VANO ---------------------------------------
// Decodifica tipo apertura: quante ante, tipo apertura
interface TipoApertura {
  n_ante: number
  ribalta: boolean
  scorrevole: boolean
  fisso: boolean
}

function parseTipo(tipo: string): TipoApertura {
  const t = tipo.toUpperCase()
  return {
    n_ante:    t.includes('F2') || t.includes('P2') ? 2
             : t.includes('F3') ? 3
             : t.includes('FX') || t.includes('FISSO') ? 0
             : 1,
    ribalta:   t.includes('B') || t.includes('RIBALT'),
    scorrevole:t.includes('SC') || t.includes('SCORR'),
    fisso:     t.includes('FX') || t.includes('FISSO'),
  }
}

// --- CALCOLO PROFILI TELAIO + ANTE --------------------------

function calcolaTaglioTelaio(
  m: MisureVano,
  apertura: TipoApertura,
  regole: RegolaCalcolo
): RigaTaglio[] {
  const tolT = regole.tolleranza_telaio ?? -2
  const tolA = regole.tolleranza_anta ?? -4
  const L = m.lCentro
  const H = m.hCentro

  const righe: RigaTaglio[] = []

  // Telaio esterno (sempre 4 pezzi)
  righe.push(
    { profilo: 'Traverso telaio superiore', lunghezza_mm: L + tolT, qta: 1 },
    { profilo: 'Traverso telaio inferiore', lunghezza_mm: L + tolT, qta: 1 },
    { profilo: 'Montante telaio SX',        lunghezza_mm: H + tolT, qta: 1 },
    { profilo: 'Montante telaio DX',        lunghezza_mm: H + tolT, qta: 1 },
  )

  if (apertura.fisso) return righe

  // Calcola dimensione singola anta
  const nAnte = apertura.n_ante || 1
  const lAnta = Math.floor(L / nAnte) + tolA
  const hAnta = H + tolA - 10 // -10 per battuta

  if (apertura.scorrevole) {
    // Scorrevole: anta più larga, binario
    righe.push(
      { profilo: 'Anta scorrevole - traverso sup', lunghezza_mm: lAnta + 20, qta: nAnte },
      { profilo: 'Anta scorrevole - traverso inf', lunghezza_mm: lAnta + 20, qta: nAnte },
      { profilo: 'Anta scorrevole - montante',     lunghezza_mm: hAnta,       qta: nAnte * 2 },
      { profilo: 'Binario superiore',              lunghezza_mm: L,           qta: 1 },
      { profilo: 'Binario inferiore',              lunghezza_mm: L,           qta: 1 },
    )
  } else {
    // Anta battente standard
    righe.push(
      { profilo: 'Traverso anta superiore', lunghezza_mm: lAnta, qta: nAnte },
      { profilo: 'Traverso anta inferiore', lunghezza_mm: lAnta, qta: nAnte },
      { profilo: 'Montante anta',           lunghezza_mm: hAnta, qta: nAnte * 2 },
    )
    // Ribalta: aggiunge traverso intermedio
    if (apertura.ribalta) {
      righe.push(
        { profilo: 'Traverso intermedio ribalta', lunghezza_mm: lAnta, qta: nAnte }
      )
    }
  }

  return righe
}

// --- CALCOLO VETRO ------------------------------------------

function calcolaVetro(
  m: MisureVano,
  apertura: TipoApertura,
  cfg: ConfigVetro,
  regole: RegolaCalcolo
) {
  if (!cfg.attivo) return undefined

  const offL = regole.offset_vetro_l ?? -62
  const offH = regole.offset_vetro_h ?? -62
  const giunto = cfg.giunto_mm ?? 5
  const nAnte = Math.max(1, apertura.n_ante)

  // Luce vetro per anta
  const luceTotaleL = m.lCentro + offL
  const luceH = m.hCentro + offH
  const luceL = apertura.fisso
    ? luceTotaleL
    : Math.floor(luceTotaleL / nAnte) - giunto * 2

  const mq = parseFloat(((luceL / 1000) * (luceH / 1000) * (apertura.fisso ? 1 : nAnte)).toFixed(3))

  return {
    luce_l: luceL,
    luce_h: luceH,
    mq,
    composizione: cfg.composizione || '4/16/4 basso emissivo',
    qta: apertura.fisso ? 1 : nAnte,
  }
}

// --- CALCOLO ACCESSORI FERRAMENTA ---------------------------

function calcolaAccessori(
  m: MisureVano,
  apertura: TipoApertura,
  regole: RegolaCalcolo
): RigaAccessorio[] {
  if (apertura.fisso) return []

  const L = m.lCentro
  const H = m.hCentro
  const perimetroTelaio = (L + H) * 2
  const nAnte = Math.max(1, apertura.n_ante)
  const perimetroTotaleAnte = perimetroTelaio * nAnte * 0.95 // ante leggermente più piccole
  const cerniere = regole.cerniere_per_anta ?? 3

  const acc: RigaAccessorio[] = []

  acc.push({
    nome: 'Maniglia cremonese',
    categoria: 'ferramenta',
    qta: nAnte,
    unita: 'pz',
    formula: `1 per anta × ${nAnte} ante`,
  })

  acc.push({
    nome: 'Cerniera a compasso',
    categoria: 'ferramenta',
    qta: nAnte * cerniere,
    unita: 'pz',
    formula: `${cerniere} per anta × ${nAnte} ante`,
  })

  if (apertura.ribalta) {
    acc.push({
      nome: 'Meccanismo ribalta (kit)',
      categoria: 'ferramenta',
      qta: nAnte,
      unita: 'pz',
      formula: '1 kit per anta ribaltabile',
    })
  }

  acc.push({
    nome: 'Guarnizione EPDM telaio',
    categoria: 'guarnizione',
    qta: Math.ceil(perimetroTelaio * 1.1),
    unita: 'ml',
    formula: `(${L}+${H})×2 × 1.1 = ${Math.ceil(perimetroTelaio * 1.1)}mm`,
  })

  acc.push({
    nome: 'Guarnizione EPDM anta',
    categoria: 'guarnizione',
    qta: Math.ceil(perimetroTotaleAnte * 1.1),
    unita: 'ml',
    formula: `perimetro ante × 1.1 = ${Math.ceil(perimetroTotaleAnte * 1.1)}mm`,
  })

  acc.push({
    nome: 'Tappo riporto',
    categoria: 'tappo',
    qta: Math.ceil((perimetroTelaio + perimetroTotaleAnte) / 1000 * 1.05),
    unita: 'ml',
    formula: `(perimetro telaio + ante) / 1000 × 1.05`,
  })

  return acc
}

// --- CALCOLO PERSIANA ---------------------------------------

function calcolaPersiana(
  m: MisureVano,
  cfg: ConfigPersiana
) {
  if (!cfg.attivo) return undefined

  const passo = cfg.passo_stecca_mm
    ?? (cfg.materiale === 'pvc' ? 77 : 87)

  const nStecche = Math.ceil(m.hCentro / passo)
  const mlGuide = m.hCentro * 2              // guide laterali sx + dx
  const mlFerramenta = m.hCentro * 2         // ferramenta continua sx + dx
  const mlNastro = m.lCentro * 2             // nastro avvolgimento

  return {
    n_stecche: nStecche,
    ml_guide: mlGuide,
    ml_ferramenta_continua: mlFerramenta,
    ml_nastro: mlNastro,
  }
}

// --- ASSEMBLA RIGHE ORDINE ----------------------------------

function assemblaRigheOrdine(
  vanoNome: string,
  cfg: ConfigVano,
  m: MisureVano,
  taglio: RigaTaglio[],
  accessori: RigaAccessorio[],
  vetro: ReturnType<typeof calcolaVetro>,
  persiana: ReturnType<typeof calcolaPersiana>,
  cfgTapparella: ConfigTapparella,
  cfgZanzariera: ConfigZanzariera
): RigaOrdine[] {
  const righe: RigaOrdine[] = []

  // Serramento — profili aggregati
  const totaleProfili = taglio.reduce((s, r) => s + r.lunghezza_mm * r.qta, 0)
  righe.push({
    categoria: 'serramento',
    descrizione: `${vanoNome} — ${cfg.tipo} ${cfg.sistema} ${m.lCentro}×${m.hCentro}mm`,
    qta: cfg.pezzi,
    unita: 'pz',
    note: `${taglio.length} profili, ${Math.ceil(totaleProfili / 1000)}ml totali`,
  })

  // Vetro
  if (vetro) {
    righe.push({
      categoria: 'vetro',
      descrizione: `Vetro ${vetro.composizione} ${vetro.luce_l}×${vetro.luce_h}mm`,
      qta: vetro.qta * cfg.pezzi,
      unita: 'pz',
      note: `${vetro.mq}mq per vano`,
    })
  }

  // Ferramenta (accessori raggruppati)
  for (const a of accessori) {
    righe.push({
      categoria: 'ferramenta',
      descrizione: `${a.nome} (${vanoNome})`,
      qta: a.qta * cfg.pezzi,
      unita: a.unita,
      note: a.formula,
    })
  }

  // Persiana
  if (persiana) {
    righe.push({
      categoria: 'persiana',
      descrizione: `Persiana — ${persiana.n_stecche} stecche ${m.lCentro}mm`,
      qta: cfg.pezzi,
      unita: 'pz',
      note: `Guide ${persiana.ml_guide}mm, ferramenta ${persiana.ml_ferramenta_continua}mm`,
    })
  }

  // Tapparella
  if (cfgTapparella.attivo) {
    righe.push({
      categoria: 'tapparella',
      descrizione: `Tapparella ${cfgTapparella.tipo} ${cfgTapparella.materiale} ${m.lCentro}×${m.hCentro}mm`,
      qta: cfg.pezzi,
      unita: 'pz',
      note: cfgTapparella.comando === 'motore' ? 'Con motorizzazione' : 'Manuale',
    })
  }

  // Zanzariera
  if (cfgZanzariera.attivo) {
    righe.push({
      categoria: 'zanzariera',
      descrizione: `Zanzariera ${cfgZanzariera.tipo} ${m.lCentro}×${m.hCentro}mm`,
      qta: cfg.pezzi,
      unita: 'pz',
    })
  }

  return righe
}

// --- FUNZIONE PRINCIPALE ------------------------------------

export function calcolaVano(params: {
  vano_id: string | number
  vano_nome: string
  misure: MisureVano
  config: ConfigVano
  vetro: ConfigVetro
  persiana: ConfigPersiana
  tapparella: ConfigTapparella
  zanzariera: ConfigZanzariera
  regole?: RegolaCalcolo
}): OutputCalcolo {
  const { vano_id, vano_nome, misure: m, config: cfg } = params
  const regole: RegolaCalcolo = params.regole ?? {}
  const avvisi: string[] = []

  // Validazioni
  if (!m.lCentro || m.lCentro < 200)
    avvisi.push('Larghezza mancante o inferiore a 200mm')
  if (!m.hCentro || m.hCentro < 200)
    avvisi.push('Altezza mancante o inferiore a 200mm')
  if (m.lCentro > 4000)
    avvisi.push('Larghezza > 4000mm: verificare tipo apertura')
  if (m.hCentro > 3000)
    avvisi.push('Altezza > 3000mm: verificare tipo apertura')

  const apertura = parseTipo(cfg.tipo)

  const lista_taglio  = calcolaTaglioTelaio(m, apertura, regole)
  const vetro         = calcolaVetro(m, apertura, params.vetro, regole)
  const accessori     = calcolaAccessori(m, apertura, regole)
  const persiana      = calcolaPersiana(m, params.persiana)

  const righe_ordine  = assemblaRigheOrdine(
    vano_nome, cfg, m,
    lista_taglio, accessori, vetro, persiana,
    params.tapparella, params.zanzariera
  )

  return {
    vano_id,
    vano_nome,
    lista_taglio,
    accessori,
    vetro,
    persiana,
    righe_ordine,
    avvisi,
  }
}

// --- TRASFORMATORE COMMESSA → ORDINE FORNITORE --------------

export interface VanoInput {
  id: string | number
  nome: string
  tipo: string
  pezzi: number
  sistema: string
  misure: MisureVano
  vetro_config?: ConfigVetro
  persiana_config?: ConfigPersiana
  tapparella_config?: ConfigTapparella
  zanzariera_config?: ConfigZanzariera
  regole?: RegolaCalcolo
}

export interface OrdineFornitore {
  commessa_id: string
  commessa_code: string
  cliente: string
  fornitore: string
  righe: (RigaOrdine & { vano_nome: string })[]
  avvisi: string[]
  totale_vani: number
  totale_pezzi: number
}

export function trasformaCommessaInOrdine(params: {
  commessa_id: string
  commessa_code: string
  cliente: string
  fornitore: string
  vani: VanoInput[]
}): OrdineFornitore {
  const righe: (RigaOrdine & { vano_nome: string })[] = []
  const avvisi: string[] = []
  let totalePezzi = 0

  for (const v of params.vani) {
    const out = calcolaVano({
      vano_id: v.id,
      vano_nome: v.nome,
      misure: v.misure,
      config: { tipo: v.tipo, pezzi: v.pezzi, sistema: v.sistema, regole: v.regole },
      vetro:       v.vetro_config       ?? { attivo: false, composizione: '' },
      persiana:    v.persiana_config    ?? { attivo: false, materiale: '', tipo: '', colore: '' },
      tapparella:  v.tapparella_config  ?? { attivo: false, materiale: '', tipo: '', colore: '', comando: '' },
      zanzariera:  v.zanzariera_config  ?? { attivo: false, tipo: '', colore: '' },
      regole:      v.regole,
    })

    for (const riga of out.righe_ordine) {
      righe.push({ ...riga, vano_nome: v.nome })
    }

    avvisi.push(...out.avvisi.map(a => `${v.nome}: ${a}`))
    totalePezzi += v.pezzi
  }

  return {
    commessa_id:   params.commessa_id,
    commessa_code: params.commessa_code,
    cliente:       params.cliente,
    fornitore:     params.fornitore,
    righe,
    avvisi,
    totale_vani:   params.vani.length,
    totale_pezzi:  totalePezzi,
  }
}
