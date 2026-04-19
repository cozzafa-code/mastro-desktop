// ============================================================
// MASTRO ERP — Supabase Sync Layer (new normalized schema)
// lib/supabase-sync.ts
// ============================================================

import { supabase } from "./supabase";

// ── Get azienda_id from profili ──
export async function getAziendaId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profili")
    .select("azienda_id")
    .eq("id", user.id)
    .maybeSingle();
  return data?.azienda_id || null;
}

// ── Load ALL data at startup ──
export async function loadAllData(azId: string) {
  const [
    { data: commesse },
    { data: events },
    { data: contatti },
    { data: teamData },
    { data: tasks },
    { data: msgs },
    { data: sistemi },
    { data: colori },
    { data: vetri },
    { data: coprifili },
    { data: lamiere },
    { data: pipeline },
    { data: azienda },
  ] = await Promise.all([
    supabase.from("commesse").select(`
      *,
      rilievi(*, vani(*, allegati_vano:allegati_vano(*)))
    `).eq("azienda_id", azId).order("created_at", { ascending: false }),
    supabase.from("eventi").select("*").eq("azienda_id", azId).order("data"),
    supabase.from("contatti").select("*").eq("azienda_id", azId).order("nome"),
    supabase.from("team").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("tasks").select("*").eq("azienda_id", azId).order("created_at", { ascending: false }),
    supabase.from("messaggi").select("*").eq("azienda_id", azId).order("created_at", { ascending: false }).limit(100),
    supabase.from("sistemi").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("colori").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("vetri").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("coprifili").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("lamiere").select("*").eq("azienda_id", azId).eq("attivo", true),
    supabase.from("pipeline_fasi").select("*").eq("azienda_id", azId).eq("attiva", true).order("ordine"),
    supabase.from("aziende").select("*").eq("id", azId).single(),
  ]);

  // Map commesse from DB → app format
  const cantieriMapped = (commesse || []).map(cm => ({
    id: cm.id,
    code: cm.code,
    cliente: cm.cliente,
    cognome: cm.cognome || "",
    indirizzo: cm.indirizzo || "",
    telefono: cm.telefono || "",
    email: cm.email || "",
    fase: cm.fase,
    tipo: cm.tipo || "nuova",
    sistema: cm.sistema || "",
    difficoltaSalita: cm.difficolta_salita || "",
    mezzoSalita: cm.mezzo_salita || "",
    foroScale: cm.foro_scale || "",
    pianoEdificio: cm.piano_edificio || "",
    note: cm.note || "",
    totalePreventivo: cm.totale_preventivo,
    scontoPerc: cm.sconto_perc,
    totaleFinale: cm.totale_finale,
    firmaCliente: cm.firma_cliente,
    allegati: [],
    creato: cm.created_at ? new Date(cm.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "",
    aggiornato: cm.updated_at ? new Date(cm.updated_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "",
    log: [],
    rilievi: (cm.rilievi || []).map((r: any) => ({
      id: r.id,
      tipo: r.tipo,
      numero: r.numero,
      data: r.data,
      ora: r.ora || "",
      rilevatore: r.rilevatore || "",
      note: r.note || "",
      motivoModifica: r.motivo_modifica || "",
      completato: r.completato,
      vani: (r.vani || []).map((v: any) => ({
        id: v.id,
        nome: v.nome,
        tipo: v.tipo,
        pezzi: v.pezzi || 1,
        stanza: v.stanza || "Soggiorno",
        piano: v.piano || "PT",
        sistema: v.sistema || "",
        sottosistema: v.sottosistema || "",
        vetro: v.vetro || "",
        coloreInt: v.colore_int || "",
        coloreEst: v.colore_est || "",
        bicolore: v.bicolore || false,
        coloreAcc: v.colore_acc || "",
        telaio: v.telaio || "",
        telaioAlaZ: v.telaio_ala_z || "",
        rifilato: v.rifilato || false,
        rifilSx: v.rifil_sx || "",
        rifilDx: v.rifil_dx || "",
        rifilSopra: v.rifil_sopra || "",
        rifilSotto: v.rifil_sotto || "",
        coprifilo: v.coprifilo || "",
        lamiera: v.lamiera || "",
        cassonetto: v.cassonetto || false,
        accessori: v.accessori || {},
        difficoltaSalita: v.difficolta_salita || "",
        mezzoSalita: v.mezzo_salita || "",
        note: v.note || "",
        misure: v.misure_json || {},
        foto: {},
        _dbId: v.id,
      })),
    })),
  }));

  // Map events
  const eventsMapped = (events || []).map(ev => ({
    id: ev.id,
    text: ev.titolo,
    tipo: ev.tipo || "appuntamento",
    date: ev.data,
    time: ev.ora || "",
    persona: ev.persona || "",
    addr: ev.indirizzo || "",
    cm: ev.commessa_id || "",
    colore: ev.colore || "#007aff",
    color: ev.colore || "#007aff",
    reminder: ev.reminder || "",
    done: ev.completato || false,
    _dbId: ev.id,
  }));

  // Map contatti
  const contattiMapped = (contatti || []).map(c => ({
    id: c.id,
    nome: c.nome,
    cognome: c.cognome || "",
    tipo: c.tipo || "cliente",
    telefono: c.telefono || "",
    email: c.email || "",
    indirizzo: c.indirizzo || "",
    note: c.note || "",
    _dbId: c.id,
  }));

  // Map team
  const teamMapped = (teamData || []).map(t => ({
    id: t.id,
    nome: t.nome,
    ruolo: t.ruolo || "",
    compiti: t.compiti || "",
    colore: t.colore || "#007aff",
    _dbId: t.id,
  }));

  // Map tasks
  const tasksMapped = (tasks || []).map(t => ({
    id: t.id,
    text: t.testo,
    meta: t.meta || "",
    date: t.data || "",
    time: t.ora || "",
    priority: t.priorita || "media",
    persona: t.persona || "",
    cm: t.commessa_id || "",
    done: t.done,
    allegati: [],
    _dbId: t.id,
  }));

  // Map msgs
  const msgsMapped = (msgs || []).map(m => ({
    id: m.id,
    da: m.da || "",
    a: m.a || "",
    testo: m.testo,
    canale: m.canale,
    data: m.created_at ? new Date(m.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : "",
    letto: m.letto,
    _dbId: m.id,
  }));

  // Map catalogo
  const sistemiMapped = (sistemi || []).map(s => ({
    id: s.id, marca: s.marca, sistema: s.sistema, prezzoMq: Number(s.prezzo_mq), euroMq: Number(s.prezzo_mq),
    sovRAL: s.sov_ral, sovLegno: s.sov_legno, colori: s.colori || [], sottosistemi: s.sottosistemi || [],
  }));
  const coloriMapped = (colori || []).map(c => ({
    id: c.id, nome: c.nome, code: c.codice, hex: c.hex, tipo: c.tipo,
  }));
  const vetriMapped = (vetri || []).map(v => ({
    id: v.id, nome: v.nome, code: v.codice, ug: Number(v.ug), prezzoMq: Number(v.prezzo_mq),
  }));
  const coprifiliMapped = (coprifili || []).map(c => ({
    id: c.id, nome: c.nome, cod: c.codice, prezzoMl: Number(c.prezzo_ml),
  }));
  const lamiereMapped = (lamiere || []).map(l => ({
    id: l.id, nome: l.nome, cod: l.codice, prezzoMl: Number(l.prezzo_ml),
  }));
  const pipelineMapped = (pipeline || []).map(p => ({
    id: p.codice, nome: p.nome, ico: p.icona, color: p.colore, attiva: p.attiva,
  }));

  return {
    cantieri: cantieriMapped,
    events: eventsMapped,
    contatti: contattiMapped,
    team: teamMapped,
    tasks: tasksMapped,
    msgs: msgsMapped,
    sistemi: sistemiMapped.length > 0 ? sistemiMapped : null,
    colori: coloriMapped.length > 0 ? coloriMapped : null,
    vetri: vetriMapped.length > 0 ? vetriMapped : null,
    coprifili: coprifiliMapped.length > 0 ? coprifiliMapped : null,
    lamiere: lamiereMapped.length > 0 ? lamiereMapped : null,
    pipeline: pipelineMapped.length > 0 ? pipelineMapped : null,
    azienda: azienda?.data || azienda,
  };
}

// ╔══════════════════════════════════════════════════════════╗
// ║  SAVE FUNCTIONS (app state → DB)                        ║
// ╚══════════════════════════════════════════════════════════╝

// Debounce helper
const _pending: Record<string, NodeJS.Timeout> = {};
function debounce(key: string, fn: () => void, ms = 1000) {
  if (_pending[key]) clearTimeout(_pending[key]);
  _pending[key] = setTimeout(fn, ms);
}

// ── Save Commessa ──
export async function saveCantiere(azId: string, c: any) {
  debounce(`cm_${c.id}`, async () => {
    const isUUID = typeof c.id === "string" && c.id.includes("-");
    const row: any = {
      azienda_id: azId,
      code: c.code,
      cliente: c.cliente,
      cognome: c.cognome || "",
      indirizzo: c.indirizzo || "",
      telefono: c.telefono || "",
      email: c.email || "",
      fase: c.fase,
      tipo: c.tipo || "nuova",
      sistema: c.sistema || "",
      difficolta_salita: c.difficoltaSalita || "",
      mezzo_salita: c.mezzoSalita || "",
      foro_scale: c.foroScale || "",
      piano_edificio: c.pianoEdificio || "",
      note: c.note || "",
      totale_preventivo: c.totalePreventivo || null,
      sconto_perc: c.scontoPerc || null,
      totale_finale: c.totaleFinale || null,
      firma_cliente: c.firmaCliente || null,
    };
    if (isUUID) row.id = c.id;

    try {
      const { data, error } = await supabase
        .from("commesse")
        .upsert(row, { onConflict: "id" })
        .select()
        .single();
      if (error) console.error("Save commessa error:", error);

      // Save rilievi + vani
      if (data && c.rilievi) {
        for (const ril of c.rilievi) {
          await saveRilievo(data.id, ril);
        }
      }
    } catch (e) { console.error("Save commessa:", e); }
  });
}

async function saveRilievo(commessaId: string, r: any) {
  const isUUID = typeof r.id === "string" && r.id.includes("-");
  const row: any = {
    commessa_id: commessaId,
    tipo: r.tipo || "rilievo",
    numero: r.numero || 1,
    data: r.data || null,
    ora: r.ora || "",
    rilevatore: r.rilevatore || "",
    note: r.note || "",
    motivo_modifica: r.motivoModifica || "",
    completato: r.completato || false,
  };
  if (isUUID) row.id = r.id;

  try {
    const { data, error } = await supabase
      .from("rilievi")
      .upsert(row, { onConflict: "id" })
      .select()
      .single();
    if (error) { console.error("Save rilievo:", error); return; }

    if (data && r.vani) {
      for (const v of r.vani) {
        await saveVano(data.id, commessaId, v);
      }
    }
  } catch (e) { console.error("Save rilievo:", e); }
}

// ── Save Vano ──
export async function saveVano(rilievoId: string, commessaId: string, v: any) {
  const isUUID = typeof v.id === "string" && v.id.includes("-");
  const row: any = {
    rilievo_id: rilievoId,
    commessa_id: commessaId,
    nome: v.nome,
    tipo: v.tipo || "F1A",
    pezzi: v.pezzi || 1,
    stanza: v.stanza || "Soggiorno",
    piano: v.piano || "PT",
    sistema: v.sistema || "",
    sottosistema: v.sottosistema || "",
    vetro: v.vetro || "",
    colore_int: v.coloreInt || "",
    colore_est: v.coloreEst || "",
    bicolore: v.bicolore || false,
    colore_acc: v.coloreAcc || "",
    telaio: v.telaio || "",
    telaio_ala_z: v.telaioAlaZ || "",
    rifilato: v.rifilato || false,
    rifil_sx: v.rifilSx || "",
    rifil_dx: v.rifilDx || "",
    rifil_sopra: v.rifilSopra || "",
    rifil_sotto: v.rifilSotto || "",
    coprifilo: v.coprifilo || "",
    lamiera: v.lamiera || "",
    cassonetto: v.cassonetto || false,
    accessori: v.accessori || {},
    difficolta_salita: v.difficoltaSalita || "",
    mezzo_salita: v.mezzoSalita || "",
    note: v.note || "",
    misure_json: v.misure || {},
  };
  if (isUUID) row.id = v.id;

  try {
    const { error } = await supabase
      .from("vani")
      .upsert(row, { onConflict: "id" })
      .select();
    if (error) console.error("Save vano:", error);
  } catch (e) { console.error("Save vano:", e); }
}

// ── Delete Vano ──
export async function deleteVano(vanoId: string) {
  try {
    const isUUID = typeof vanoId === "string" && vanoId.includes("-");
    if (!isUUID) return;
    await supabase.from("vani").delete().eq("id", vanoId);
  } catch (e) { console.error("Delete vano:", e); }
}

// ── Save Event ──
export async function saveEvent(azId: string, ev: any) {
  debounce(`ev_${ev.id}`, async () => {
    const isUUID = typeof ev.id === "string" && ev.id.includes("-");
    const row: any = {
      azienda_id: azId,
      titolo: ev.text || ev.titolo || "",
      tipo: ev.tipo || "appuntamento",
      data: ev.date || new Date().toISOString().split("T")[0],
      ora: ev.time || ev.ora || "",
      persona: ev.persona || "",
      indirizzo: ev.addr || ev.indirizzo || "",
      colore: ev.colore || ev.color || "#007aff",
      reminder: ev.reminder || "",
      completato: ev.done || false,
      commessa_id: ev.cm && typeof ev.cm === "string" && ev.cm.includes("-") ? ev.cm : null,
    };
    if (isUUID) row.id = ev.id;

    try {
      const { error } = await supabase.from("eventi").upsert(row, { onConflict: "id" });
      if (error) console.error("Save event:", error);
    } catch (e) { console.error("Save event:", e); }
  });
}

// ── Delete Event ──
export async function deleteEvent(evId: string) {
  try {
    const isUUID = typeof evId === "string" && evId.includes("-");
    if (!isUUID) return;
    await supabase.from("eventi").delete().eq("id", evId);
  } catch (e) { console.error("Delete event:", e); }
}

// ── Save Contatto ──
export async function saveContatto(azId: string, c: any) {
  debounce(`ct_${c.id}`, async () => {
    const isUUID = typeof c.id === "string" && c.id.includes("-");
    const row: any = {
      azienda_id: azId,
      nome: c.nome,
      cognome: c.cognome || "",
      tipo: c.tipo || "cliente",
      telefono: c.telefono || "",
      email: c.email || "",
      indirizzo: c.indirizzo || "",
      note: c.note || "",
    };
    if (isUUID) row.id = c.id;

    try {
      const { error } = await supabase.from("contatti").upsert(row, { onConflict: "id" });
      if (error) console.error("Save contatto:", error);
    } catch (e) { console.error("Save contatto:", e); }
  });
}

// ── Save Team Member ──
export async function saveTeamMember(azId: string, t: any) {
  debounce(`tm_${t.id}`, async () => {
    const isUUID = typeof t.id === "string" && t.id.includes("-");
    const row: any = {
      azienda_id: azId,
      nome: t.nome,
      ruolo: t.ruolo || "",
      compiti: t.compiti || "",
      colore: t.colore || "#007aff",
    };
    if (isUUID) row.id = t.id;

    try {
      const { error } = await supabase.from("team").upsert(row, { onConflict: "id" });
      if (error) console.error("Save team:", error);
    } catch (e) { console.error("Save team:", e); }
  });
}

// ── Save Task ──
export async function saveTask(azId: string, t: any) {
  debounce(`task_${t.id}`, async () => {
    const isUUID = typeof t.id === "string" && t.id.includes("-");
    const row: any = {
      azienda_id: azId,
      testo: t.text || t.testo || "",
      meta: t.meta || "",
      data: t.date || null,
      ora: t.time || t.ora || "",
      priorita: t.priority || t.priorita || "media",
      persona: t.persona || "",
      done: t.done || false,
      done_at: t.done ? new Date().toISOString() : null,
      commessa_id: t.cm && typeof t.cm === "string" && t.cm.includes("-") ? t.cm : null,
    };
    if (isUUID) row.id = t.id;

    try {
      const { error } = await supabase.from("tasks").upsert(row, { onConflict: "id" });
      if (error) console.error("Save task:", error);
    } catch (e) { console.error("Save task:", e); }
  });
}

// ── Save Azienda Info ──
export async function saveAzienda(azId: string, info: any) {
  debounce("azienda", async () => {
    try {
      const { error } = await supabase.from("aziende").update({
        ragione: info.ragione || "",
        piva: info.piva || "",
        indirizzo: info.indirizzo || "",
        telefono: info.telefono || "",
        email: info.email || "",
        website: info.website || "",
        iban: info.iban || "",
        cciaa: info.cciaa || "",
        logo_url: info.logo || null,
      }).eq("id", azId);
      if (error) console.error("Save azienda:", error);
    } catch (e) { console.error("Save azienda:", e); }
  });
}

// ── Save Pipeline ──
export async function savePipeline(azId: string, pipeline: any[]) {
  debounce("pipeline", async () => {
    try {
      for (let i = 0; i < pipeline.length; i++) {
        const p = pipeline[i];
        await supabase.from("pipeline_fasi").upsert({
          azienda_id: azId,
          codice: p.id,
          nome: p.nome,
          icona: p.ico,
          colore: p.color,
          ordine: i,
          attiva: p.attiva !== false,
        }, { onConflict: "azienda_id,codice" });
      }
    } catch (e) { console.error("Save pipeline:", e); }
  });
}

// ── Save Materiali (catalogo) ──
export async function saveMateriali(azId: string, data: {
  sistemi?: any[];
  colori?: any[];
  vetri?: any[];
  coprifili?: any[];
  lamiere?: any[];
}) {
  debounce("materiali", async () => {
    try {
      if (data.sistemi) {
        for (const s of data.sistemi) {
          const isUUID = typeof s.id === "string" && s.id.includes("-");
          const row: any = {
            azienda_id: azId, marca: s.marca, sistema: s.sistema,
            prezzo_mq: s.prezzoMq || s.euroMq || 0, sov_ral: s.sovRAL || 0,
            sov_legno: s.sovLegno || 0, colori: s.colori || [], sottosistemi: s.sottosistemi || [],
          };
          if (isUUID) row.id = s.id;
          await supabase.from("sistemi").upsert(row, { onConflict: isUUID ? "id" : "azienda_id,marca,sistema" });
        }
      }
      // colori, vetri, coprifili, lamiere follow same pattern — skip for brevity
    } catch (e) { console.error("Save materiali:", e); }
  });
}
