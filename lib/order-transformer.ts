/**
 * MASTRO Universal Order Transformer
 * Normalizza ordini da fornitori diversi (email, PDF, CSV, XML Opera)
 * verso la struttura interna MASTRO
 */

export interface RigaOrdineNormalizzata {
  codice_profilo?: string;
  descrizione: string;
  quantita: number;
  lunghezza_mm?: number;
  larghezza_mm?: number;
  altezza_mm?: number;
  colore?: string;
  note?: string;
  prezzo_unitario?: number;
  fornitore_raw?: string; // riga originale grezza
}

export interface OrdineNormalizzato {
  fornitore: string;
  formato_fonte: 'opera_xml' | 'csv' | 'testo_libero' | 'email' | 'manuale';
  numero_ordine?: string;
  data?: string;
  righe: RigaOrdineNormalizzata[];
  totale_stimato?: number;
  errori: string[];
}

// ── Parser Opera XML ────────────────────────────────────────
export function parseOperaXML(xmlStr: string): OrdineNormalizzato {
  const righe: RigaOrdineNormalizzata[] = [];
  const errori: string[] = [];

  try {
    // Pattern Opera: <PROFILO codice="..." desc="..." qta="..." lung="..." />
    const profileRegex = /<(?:PROFILO|ITEM|ROW)[^>]*codice="([^"]*)"[^>]*desc="([^"]*)"[^>]*qta="([^"]*)"(?:[^>]*lung="([^"]*)")?[^>]*\/?>/gi;
    let match;
    while ((match = profileRegex.exec(xmlStr)) !== null) {
      righe.push({
        codice_profilo: match[1],
        descrizione: match[2],
        quantita: parseFloat(match[3]) || 1,
        lunghezza_mm: match[4] ? parseFloat(match[4]) : undefined,
        fornitore_raw: match[0],
      });
    }

    // Fallback: cerca tag generici con attributi numerici
    if (righe.length === 0) {
      const genericRegex = /<[A-Z]+[^>]*\bqta\b[^>]*>/gi;
      const count = (xmlStr.match(genericRegex) || []).length;
      if (count === 0) errori.push('Nessun elemento riconosciuto nel XML Opera');
    }
  } catch (e: any) {
    errori.push(`Errore parsing XML: ${e.message}`);
  }

  return { fornitore: 'Opera', formato_fonte: 'opera_xml', righe, errori };
}

// ── Parser CSV generico ─────────────────────────────────────
export function parseCSV(csv: string, fornitore = 'Fornitore'): OrdineNormalizzato {
  const righe: RigaOrdineNormalizzata[] = [];
  const errori: string[] = [];
  const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) { errori.push('CSV vuoto o senza righe dati'); return { fornitore, formato_fonte: 'csv', righe, errori }; }

  const headers = lines[0].split(/[,;]/).map(h => h.toLowerCase().trim());
  const idx = (keys: string[]) => keys.map(k => headers.findIndex(h => h.includes(k))).find(i => i >= 0) ?? -1;

  const iDesc = idx(['desc', 'nome', 'articol', 'prodot']);
  const iQta = idx(['qta', 'quant', 'pz', 'num']);
  const iCod = idx(['cod', 'ref', 'art']);
  const iLung = idx(['lung', 'length', 'mm', 'l ']);
  const iPrezzo = idx(['prez', 'cost', 'importo', 'eur']);

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/[,;]/);
    const desc = iDesc >= 0 ? cols[iDesc]?.trim() : cols[0]?.trim();
    if (!desc) continue;
    righe.push({
      codice_profilo: iCod >= 0 ? cols[iCod]?.trim() : undefined,
      descrizione: desc,
      quantita: iQta >= 0 ? parseFloat(cols[iQta]) || 1 : 1,
      lunghezza_mm: iLung >= 0 ? parseFloat(cols[iLung]) || undefined : undefined,
      prezzo_unitario: iPrezzo >= 0 ? parseFloat(cols[iPrezzo]?.replace(',', '.')) || undefined : undefined,
      fornitore_raw: lines[i],
    });
  }

  return { fornitore, formato_fonte: 'csv', righe, errori };
}

// ── Parser testo libero (email/copia-incolla) ───────────────
export function parseTestoLibero(testo: string, fornitore = 'Fornitore'): OrdineNormalizzato {
  const righe: RigaOrdineNormalizzata[] = [];
  const errori: string[] = [];
  const lines = testo.split('\n').map(l => l.trim()).filter(l => l.length > 4);

  for (const line of lines) {
    // Pattern: "3x Profilo CX65 2600mm bianco" o "2 pz Traverso 1200"
    const m = line.match(/^(\d+(?:[.,]\d+)?)\s*[xX×]?\s*(?:pz\.?|pcs?)?\s+(.+)/);
    if (m) {
      const desc = m[2].trim();
      const mmMatch = desc.match(/(\d{3,4})\s*mm/i);
      righe.push({
        descrizione: desc,
        quantita: parseFloat(m[1].replace(',', '.')) || 1,
        lunghezza_mm: mmMatch ? parseInt(mmMatch[1]) : undefined,
        fornitore_raw: line,
      });
    }
  }

  if (righe.length === 0) errori.push('Nessuna riga riconosciuta. Formato atteso: "3x Descrizione [lunghezza]mm"');

  return { fornitore, formato_fonte: 'testo_libero', righe, errori };
}

// ── Entry point unificato ────────────────────────────────────
export function trasformaOrdine(input: string, hint?: 'xml' | 'csv' | 'testo'): OrdineNormalizzato {
  const trimmed = input.trim();

  if (hint === 'xml' || trimmed.startsWith('<') || trimmed.includes('<?xml')) {
    return parseOperaXML(trimmed);
  }
  if (hint === 'csv' || trimmed.split('\n')[0]?.includes(';') || trimmed.split('\n')[0]?.includes(',')) {
    return parseCSV(trimmed);
  }
  return parseTestoLibero(trimmed);
}
