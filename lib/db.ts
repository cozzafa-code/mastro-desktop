// ============================================================
// MASTRO ERP — Database CRUD Functions
// lib/db.ts
// ============================================================

import { supabase } from "./supabase";

// ╔══════════════════════════════════════════════════════════╗
// ║  COMMESSE                                               ║
// ╚══════════════════════════════════════════════════════════╝

export async function getCommesse() {
  const { data, error } = await supabase
    .from("commesse")
    .select(`
      *,
      contatto:contatti(*),
      rilievi(
        *,
        vani(
          *,
          allegati:allegati_vano(*)
        )
      ),
      allegati:allegati_commessa(*),
      log:commesse_log(*)
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getCommessa(id: string) {
  const { data, error } = await supabase
    .from("commesse")
    .select(`
      *,
      contatto:contatti(*),
      rilievi(
        *,
        vani(
          *,
          allegati:allegati_vano(*)
        )
      ),
      allegati:allegati_commessa(*),
      log:commesse_log(*)
    `)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function createCommessa(data: {
  cliente: string;
  cognome?: string;
  indirizzo?: string;
  telefono?: string;
  email?: string;
  sistema?: string;
  tipo?: string;
  difficolta_salita?: string;
  mezzo_salita?: string;
  foro_scale?: string;
  piano_edificio?: string;
  note?: string;
  contatto_id?: string;
}) {
  // Get azienda_id
  const { data: profile } = await supabase
    .from("profili")
    .select("azienda_id")
    .single();
  if (!profile) throw new Error("No profile found");

  // Generate code
  const { data: codeData } = await supabase.rpc("next_commessa_code", {
    az_id: profile.azienda_id,
  });

  const { data: cm, error } = await supabase
    .from("commesse")
    .insert({
      azienda_id: profile.azienda_id,
      code: codeData || "CM-0001",
      ...data,
    })
    .select()
    .single();
  if (error) throw error;

  // Auto-log creation
  await supabase.from("commesse_log").insert({
    commessa_id: cm.id,
    azione: "creazione",
    dettaglio: "Commessa creata",
  });

  return cm;
}

export async function updateCommessa(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("commesse")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCommessa(id: string) {
  const { error } = await supabase.from("commesse").delete().eq("id", id);
  if (error) throw error;
}

// Avanzamento fase
export async function avanzaFase(id: string, nuovaFase: string) {
  return updateCommessa(id, { fase: nuovaFase });
  // Trigger log_fase_change() fires automatically
}

// ╔══════════════════════════════════════════════════════════╗
// ║  RILIEVI                                                ║
// ╚══════════════════════════════════════════════════════════╝

export async function createRilievo(commessaId: string, data: {
  tipo?: string;
  data?: string;
  ora?: string;
  rilevatore?: string;
  note?: string;
  motivo_modifica?: string;
}) {
  // Calculate next numero
  const { count } = await supabase
    .from("rilievi")
    .select("*", { count: "exact", head: true })
    .eq("commessa_id", commessaId);

  const { data: ril, error } = await supabase
    .from("rilievi")
    .insert({
      commessa_id: commessaId,
      numero: (count || 0) + 1,
      ...data,
    })
    .select()
    .single();
  if (error) throw error;
  return ril;
}

export async function updateRilievo(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("rilievi")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRilievo(id: string) {
  const { error } = await supabase.from("rilievi").delete().eq("id", id);
  if (error) throw error;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  VANI                                                   ║
// ╚══════════════════════════════════════════════════════════╝

export async function createVano(rilievoId: string, commessaId: string, data: {
  nome: string;
  tipo?: string;
  stanza?: string;
  piano?: string;
  pezzi?: number;
  [key: string]: any;
}) {
  const { data: vano, error } = await supabase
    .from("vani")
    .insert({
      rilievo_id: rilievoId,
      commessa_id: commessaId,
      ...data,
    })
    .select()
    .single();
  if (error) throw error;
  return vano;
}

export async function updateVano(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("vani")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVano(id: string) {
  const { error } = await supabase.from("vani").delete().eq("id", id);
  if (error) throw error;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  MISURE                                                 ║
// ╚══════════════════════════════════════════════════════════╝

export async function upsertMisura(vanoId: string, chiave: string, valore: number) {
  // Upsert in misure table
  const { error } = await supabase
    .from("misure")
    .upsert(
      { vano_id: vanoId, chiave, valore },
      { onConflict: "vano_id,chiave" }
    );
  if (error) throw error;

  // Also update JSONB on vano for fast reads
  const { data: vano } = await supabase
    .from("vani")
    .select("misure_json")
    .eq("id", vanoId)
    .single();

  const misureJson = { ...(vano?.misure_json || {}), [chiave]: valore };
  await supabase
    .from("vani")
    .update({ misure_json: misureJson })
    .eq("id", vanoId);
}

export async function getMisure(vanoId: string) {
  const { data, error } = await supabase
    .from("misure")
    .select("*")
    .eq("vano_id", vanoId);
  if (error) throw error;
  // Convert to {L: 1200, H: 1400, ...} format
  const obj: Record<string, number> = {};
  (data || []).forEach((m) => { obj[m.chiave] = m.valore; });
  return obj;
}

// Batch save all misure at once
export async function saveMisureBatch(vanoId: string, misure: Record<string, number>) {
  const rows = Object.entries(misure)
    .filter(([_, v]) => v != null && v > 0)
    .map(([chiave, valore]) => ({ vano_id: vanoId, chiave, valore }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from("misure")
      .upsert(rows, { onConflict: "vano_id,chiave" });
    if (error) throw error;
  }

  // Update JSONB
  await supabase
    .from("vani")
    .update({ misure_json: misure })
    .eq("id", vanoId);
}

// ╔══════════════════════════════════════════════════════════╗
// ║  ALLEGATI COMMESSA                                      ║
// ╚══════════════════════════════════════════════════════════╝

export async function addAllegatoCommessa(commessaId: string, data: {
  tipo: "nota" | "vocale" | "video" | "foto" | "file";
  nome: string;
  contenuto?: string;
  file_url?: string;
  file_path?: string;
  file_size?: number;
  durata?: string;
}) {
  const { data: all, error } = await supabase
    .from("allegati_commessa")
    .insert({ commessa_id: commessaId, ...data })
    .select()
    .single();
  if (error) throw error;
  return all;
}

export async function deleteAllegatoCommessa(id: string) {
  const { error } = await supabase.from("allegati_commessa").delete().eq("id", id);
  if (error) throw error;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  ALLEGATI VANO (foto, video, disegni)                   ║
// ╚══════════════════════════════════════════════════════════╝

export async function addAllegatoVano(vanoId: string, commessaId: string, data: {
  tipo: "foto" | "video" | "disegno";
  categoria?: string;
  nome: string;
  file_url?: string;
  file_path?: string;
  file_size?: number;
  durata?: string;
  pagina?: number;
}) {
  const { data: all, error } = await supabase
    .from("allegati_vano")
    .insert({ vano_id: vanoId, commessa_id: commessaId, ...data })
    .select()
    .single();
  if (error) throw error;
  return all;
}

export async function deleteAllegatoVano(id: string) {
  const { error } = await supabase.from("allegati_vano").delete().eq("id", id);
  if (error) throw error;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  EVENTI                                                 ║
// ╚══════════════════════════════════════════════════════════╝

export async function getEventi(from?: string, to?: string) {
  let query = supabase
    .from("eventi")
    .select("*, commessa:commesse(id, code, cliente)")
    .order("data", { ascending: true })
    .order("ora", { ascending: true });

  if (from) query = query.gte("data", from);
  if (to) query = query.lte("data", to);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createEvento(data: {
  titolo: string;
  tipo?: string;
  data: string;
  ora?: string;
  ora_fine?: string;
  persona?: string;
  indirizzo?: string;
  note?: string;
  colore?: string;
  reminder?: string;
  commessa_id?: string;
}) {
  const { data: profile } = await supabase.from("profili").select("azienda_id").single();
  if (!profile) throw new Error("No profile");

  const { data: ev, error } = await supabase
    .from("eventi")
    .insert({ azienda_id: profile.azienda_id, ...data })
    .select()
    .single();
  if (error) throw error;
  return ev;
}

export async function updateEvento(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("eventi")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvento(id: string) {
  const { error } = await supabase.from("eventi").delete().eq("id", id);
  if (error) throw error;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  TASKS                                                  ║
// ╚══════════════════════════════════════════════════════════╝

export async function getTasks(includeCompleted = false) {
  let query = supabase
    .from("tasks")
    .select("*, commessa:commesse(id, code, cliente)")
    .order("created_at", { ascending: false });

  if (!includeCompleted) query = query.eq("done", false);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createTask(data: {
  testo: string;
  meta?: string;
  data?: string;
  ora?: string;
  priorita?: string;
  persona?: string;
  commessa_id?: string;
}) {
  const { data: profile } = await supabase.from("profili").select("azienda_id").single();
  if (!profile) throw new Error("No profile");

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({ azienda_id: profile.azienda_id, ...data })
    .select()
    .single();
  if (error) throw error;
  return task;
}

export async function toggleTask(id: string) {
  const { data: current } = await supabase
    .from("tasks")
    .select("done")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("tasks")
    .update({
      done: !current?.done,
      done_at: !current?.done ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id: string) {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  MESSAGGI                                               ║
// ╚══════════════════════════════════════════════════════════╝

export async function getMessaggi(canale?: string) {
  let query = supabase
    .from("messaggi")
    .select("*, contatto:contatti(*), commessa:commesse(id, code, cliente)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (canale && canale !== "tutti") query = query.eq("canale", canale);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createMessaggio(data: {
  canale: string;
  direzione?: string;
  da?: string;
  a?: string;
  oggetto?: string;
  testo: string;
  contatto_id?: string;
  commessa_id?: string;
}) {
  const { data: profile } = await supabase.from("profili").select("azienda_id").single();
  if (!profile) throw new Error("No profile");

  const { data: msg, error } = await supabase
    .from("messaggi")
    .insert({ azienda_id: profile.azienda_id, ...data })
    .select()
    .single();
  if (error) throw error;
  return msg;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  CONTATTI                                               ║
// ╚══════════════════════════════════════════════════════════╝

export async function getContatti() {
  const { data, error } = await supabase
    .from("contatti")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createContatto(data: {
  nome: string;
  cognome?: string;
  tipo?: string;
  telefono?: string;
  email?: string;
  indirizzo?: string;
  citta?: string;
  note?: string;
}) {
  const { data: profile } = await supabase.from("profili").select("azienda_id").single();
  if (!profile) throw new Error("No profile");

  const { data: c, error } = await supabase
    .from("contatti")
    .insert({ azienda_id: profile.azienda_id, ...data })
    .select()
    .single();
  if (error) throw error;
  return c;
}

export async function updateContatto(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from("contatti")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContatto(id: string) {
  const { error } = await supabase.from("contatti").delete().eq("id", id);
  if (error) throw error;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  TEAM                                                   ║
// ╚══════════════════════════════════════════════════════════╝

export async function getTeam() {
  const { data, error } = await supabase
    .from("team")
    .select("*")
    .eq("attivo", true)
    .order("created_at");
  if (error) throw error;
  return data;
}

export async function createTeamMember(data: {
  nome: string;
  ruolo?: string;
  compiti?: string;
  colore?: string;
  telefono?: string;
  email?: string;
}) {
  const { data: profile } = await supabase.from("profili").select("azienda_id").single();
  if (!profile) throw new Error("No profile");

  const { data: m, error } = await supabase
    .from("team")
    .insert({ azienda_id: profile.azienda_id, ...data })
    .select()
    .single();
  if (error) throw error;
  return m;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  CATALOGO (sistemi, colori, vetri, etc.)                ║
// ╚══════════════════════════════════════════════════════════╝

// Generic CRUD for catalog tables
async function getCatalog(table: string) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("attivo", true)
    .order("created_at");
  if (error) throw error;
  return data;
}

async function addCatalogItem(table: string, item: Record<string, any>) {
  const { data: profile } = await supabase.from("profili").select("azienda_id").single();
  if (!profile) throw new Error("No profile");

  const { data, error } = await supabase
    .from(table)
    .insert({ azienda_id: profile.azienda_id, ...item })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateCatalogItem(table: string, id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteCatalogItem(table: string, id: string) {
  // Soft delete
  const { error } = await supabase
    .from(table)
    .update({ attivo: false })
    .eq("id", id);
  if (error) throw error;
}

// Exports per catalog
export const sistemi = {
  get: () => getCatalog("sistemi"),
  add: (item: any) => addCatalogItem("sistemi", item),
  update: (id: string, u: any) => updateCatalogItem("sistemi", id, u),
  delete: (id: string) => deleteCatalogItem("sistemi", id),
};

export const colori = {
  get: () => getCatalog("colori"),
  add: (item: any) => addCatalogItem("colori", item),
  update: (id: string, u: any) => updateCatalogItem("colori", id, u),
  delete: (id: string) => deleteCatalogItem("colori", id),
};

export const vetri = {
  get: () => getCatalog("vetri"),
  add: (item: any) => addCatalogItem("vetri", item),
  update: (id: string, u: any) => updateCatalogItem("vetri", id, u),
  delete: (id: string) => deleteCatalogItem("vetri", id),
};

export const coprifili = {
  get: () => getCatalog("coprifili"),
  add: (item: any) => addCatalogItem("coprifili", item),
  update: (id: string, u: any) => updateCatalogItem("coprifili", id, u),
  delete: (id: string) => deleteCatalogItem("coprifili", id),
};

export const lamiereDb = {
  get: () => getCatalog("lamiere"),
  add: (item: any) => addCatalogItem("lamiere", item),
  update: (id: string, u: any) => updateCatalogItem("lamiere", id, u),
  delete: (id: string) => deleteCatalogItem("lamiere", id),
};

export const ctProfili = {
  get: () => getCatalog("ct_profili"),
  add: (item: any) => addCatalogItem("ct_profili", item),
  update: (id: string, u: any) => updateCatalogItem("ct_profili", id, u),
  delete: (id: string) => deleteCatalogItem("ct_profili", id),
};

export const catalogoAccessori = {
  get: (categoria?: string) => {
    let query = supabase
      .from("catalogo_accessori")
      .select("*")
      .eq("attivo", true)
      .order("created_at");
    if (categoria) query = query.eq("categoria", categoria);
    return query.then(({ data, error }) => {
      if (error) throw error;
      return data;
    });
  },
  add: (item: any) => addCatalogItem("catalogo_accessori", item),
  update: (id: string, u: any) => updateCatalogItem("catalogo_accessori", id, u),
  delete: (id: string) => deleteCatalogItem("catalogo_accessori", id),
};

// ╔══════════════════════════════════════════════════════════╗
// ║  PIPELINE FASI                                          ║
// ╚══════════════════════════════════════════════════════════╝

export async function getPipelineFasi() {
  const { data, error } = await supabase
    .from("pipeline_fasi")
    .select("*")
    .eq("attiva", true)
    .order("ordine");
  if (error) throw error;
  return data;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  DASHBOARD VIEW                                         ║
// ╚══════════════════════════════════════════════════════════╝

export async function getDashboardData() {
  const { data, error } = await supabase
    .from("v_commesse_dashboard")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ╔══════════════════════════════════════════════════════════╗
// ║  REALTIME SUBSCRIPTIONS                                 ║
// ╚══════════════════════════════════════════════════════════╝

export function subscribeToCommesse(callback: (payload: any) => void) {
  return supabase
    .channel("commesse_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "commesse" }, callback)
    .subscribe();
}

export function subscribeToEventi(callback: (payload: any) => void) {
  return supabase
    .channel("eventi_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "eventi" }, callback)
    .subscribe();
}

export function subscribeToTasks(callback: (payload: any) => void) {
  return supabase
    .channel("tasks_changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, callback)
    .subscribe();
}
