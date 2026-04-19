/**
 * MASTRO Listini — helper per recupero prezzi
 * Gerarchia: listino_specifico_cliente > listino_categoria > prezzo_base
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PrezzoRisolto {
  prezzo: number;
  fonte: 'cliente' | 'categoria' | 'base';
  sconto_pct?: number;
  listino_nome?: string;
}

export async function risolviPrezzo(
  aziendaId: string,
  articoloCodice: string,
  clienteId?: string,
  categoriaId?: string
): Promise<PrezzoRisolto | null> {
  // 1. Prezzo specifico per cliente
  if (clienteId) {
    const { data } = await supabase
      .from('listino_prezzi')
      .select('prezzo, sconto_pct, listini(nome)')
      .eq('azienda_id', aziendaId)
      .eq('codice_articolo', articoloCodice)
      .eq('cliente_id', clienteId)
      .maybeSingle();

    if (data) return {
      prezzo: data.prezzo,
      fonte: 'cliente',
      sconto_pct: data.sconto_pct,
      listino_nome: (data.listini as any)?.nome,
    };
  }

  // 2. Prezzo per categoria
  if (categoriaId) {
    const { data } = await supabase
      .from('listino_prezzi')
      .select('prezzo, sconto_pct, listini(nome)')
      .eq('azienda_id', aziendaId)
      .eq('codice_articolo', articoloCodice)
      .eq('categoria_id', categoriaId)
      .maybeSingle();

    if (data) return {
      prezzo: data.prezzo,
      fonte: 'categoria',
      sconto_pct: data.sconto_pct,
      listino_nome: (data.listini as any)?.nome,
    };
  }

  // 3. Prezzo base
  const { data } = await supabase
    .from('listino_prezzi')
    .select('prezzo, sconto_pct, listini(nome)')
    .eq('azienda_id', aziendaId)
    .eq('codice_articolo', articoloCodice)
    .is('cliente_id', null)
    .is('categoria_id', null)
    .maybeSingle();

  if (data) return {
    prezzo: data.prezzo,
    fonte: 'base',
    sconto_pct: data.sconto_pct,
    listino_nome: (data.listini as any)?.nome,
  };

  return null;
}

export function applicaSconto(prezzo: number, sconto_pct?: number): number {
  if (!sconto_pct) return prezzo;
  return prezzo * (1 - sconto_pct / 100);
}
