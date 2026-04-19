import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export async function getAziendaId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profili').select('azienda_id').eq('id', user.id).single();
  return data?.azienda_id || null;
}

export const commesse = {
  async lista(aziendaId, filtri = {}) {
    let q = supabase.from('commesse').select('*, cliente:clienti(nome,cognome,telefono,email)').eq('azienda_id', aziendaId).order('updated_at', { ascending: false });
    if (filtri.fase) q = q.eq('fase_pipeline', filtri.fase);
    if (filtri.urgente) q = q.eq('urgente', true);
    return q;
  },
  async dettaglio(id) {
    return supabase.from('commesse').select('*, cliente:clienti(*), vani:vani(*), preventivi:preventivi(*), messaggi:messaggi(*), eventi:eventi(*), checklist:checklist_posa(*), produzione:produzione(*)').eq('id', id).single();
  },
  async crea(aziendaId, dati) { return supabase.from('commesse').insert({ azienda_id: aziendaId, ...dati }).select().single(); },
  async avanzaFase(id, fase) { return supabase.from('commesse').update({ fase_pipeline: fase, sotto_fase: 0 }).eq('id', id).select().single(); },
};

export const vani = {
  async listaPerCommessa(id) { return supabase.from('vani').select('*').eq('commessa_id', id).order('numero_vano'); },
  async salva(aziendaId, vano) { return supabase.from('vani').upsert({ azienda_id: aziendaId, ...vano }).select().single(); },
};

export const messaggi = {
  async listaPerCommessa(id, limit = 50) { return supabase.from('messaggi').select('*').eq('commessa_id', id).order('created_at', { ascending: true }).limit(limit); },
  async invia(aziendaId, msg) { return supabase.from('messaggi').insert({ azienda_id: aziendaId, ...msg }).select().single(); },
};

export const eventi_cal = {
  async listaRange(aziendaId, inizio, fine) { return supabase.from('eventi').select('*, commessa:commesse(codice)').eq('azienda_id', aziendaId).gte('data_inizio', inizio).lte('data_inizio', fine).order('data_inizio'); },
  async crea(aziendaId, ev) { return supabase.from('eventi').insert({ azienda_id: aziendaId, ...ev }).select().single(); },
};

export const produzione = {
  async perCommessa(id) { return supabase.from('produzione').select('*').eq('commessa_id', id).order('sotto_fase'); },
  async avanzaFase(aziendaId, commessaId, fase, opId) { return supabase.from('produzione').upsert({ azienda_id: aziendaId, commessa_id: commessaId, sotto_fase: fase, stato: 'in_corso', operatore_id: opId, data_inizio: new Date().toISOString() }).select().single(); },
};

export const pipeline = {
  async getConfig(aziendaId) { return supabase.from('pipeline_config').select('*').eq('azienda_id', aziendaId).eq('attiva', true).order('ordine'); },
};

export const importWizard = {
  async importaClienti(aziendaId, clientiDati, fonte) {
    let importati = 0, duplicati = 0, errori = [];
    for (const c of clientiDati) {
      try {
        const { data: dup } = await supabase.from('clienti').select('id').eq('azienda_id', aziendaId).eq('telefono', c.telefono || '').limit(1);
        if (dup?.length > 0) { duplicati++; continue; }
        await supabase.from('clienti').insert({ azienda_id: aziendaId, ...c });
        importati++;
      } catch (e) { errori.push({ nome: c.nome, errore: e.message }); }
    }
    await supabase.from('import_log').insert({ azienda_id: aziendaId, fonte, tipo_dati: 'clienti', righe_totali: clientiDati.length, righe_importate: importati, righe_errore: errori.length, righe_duplicate: duplicati, errori, stato: 'completato', completed_at: new Date().toISOString() });
    return { importati, duplicati, errori: errori.length };
  },
};

export function subscribeCommesse(aziendaId, cb) { return supabase.channel('commesse-' + aziendaId).on('postgres_changes', { event: '*', schema: 'public', table: 'commesse', filter: 'azienda_id=eq.' + aziendaId }, cb).subscribe(); }
export function subscribeMessaggi(aziendaId, cb) { return supabase.channel('messaggi-' + aziendaId).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messaggi', filter: 'azienda_id=eq.' + aziendaId }, cb).subscribe(); }
export function subscribeProduzione(commessaId, cb) { return supabase.channel('prod-' + commessaId).on('postgres_changes', { event: '*', schema: 'public', table: 'produzione', filter: 'commessa_id=eq.' + commessaId }, cb).subscribe(); }
