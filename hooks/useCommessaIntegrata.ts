"use client";
// @ts-nocheck
// ================================================================
// MASTRO ERP — useCommessaIntegrata
// Carica TUTTO quello che riguarda una commessa da TUTTE le tabelle:
//   commessa base, vani, vani_disegno, ops_foto, firma_collaudo,
//   ops_alert, ops_avanzamenti, ops_timer, ops_checklist_completamenti,
//   montaggi, missioni, log_eventi
// Questo e' il PONTE che collega mobile → desktop → satellite.
// File < 300 righe.
// ================================================================
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

function sb() { return createClient(supabaseUrl, supabaseKey); }

export interface CommessaIntegrata {
  commessa: any;
  vani: any[];
  disegni: any[];           // vani_disegno: CAD + misure per vano
  foto: any[];              // ops_foto: foto cantiere
  firme: any[];             // firma_collaudo: firme cliente
  alert: any[];             // ops_alert: problemi segnalati
  avanzamenti: any[];       // ops_avanzamenti: storico fasi
  timer: any[];             // ops_timer: ore lavorate
  checklist: any[];         // ops_checklist_completamenti
  montaggi: any[];          // montaggi collegati
  missioni: any[];          // missioni TEAM OS
  eventi: any[];            // log_eventi
}

export function useCommessaIntegrata(commessaId: string | null) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CommessaIntegrata | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!commessaId || !supabaseUrl || !supabaseKey) return;
    setLoading(true);
    setError(null);
    try {
      const s = sb();
      const [
        commRes, vaniRes, disegniRes, fotoRes, firmeRes,
        alertRes, avanzRes, timerRes, checkRes, montRes, missRes, evtRes,
      ] = await Promise.all([
        s.from("commesse").select("*").eq("id", commessaId).single(),
        s.from("vani").select("*").eq("commessa_id", commessaId).order("created_at"),
        s.from("vani_disegno").select("*").eq("commessa_id", commessaId).order("created_at"),
        s.from("ops_foto").select("*").eq("commessa_id", commessaId).order("created_at", { ascending: false }),
        s.from("firma_collaudo").select("*").eq("commessa_id", commessaId).order("created_at", { ascending: false }),
        s.from("ops_alert").select("*").eq("commessa_id", commessaId).order("created_at", { ascending: false }),
        s.from("ops_avanzamenti").select("*").eq("commessa_id", commessaId).order("created_at", { ascending: false }).limit(100),
        s.from("ops_timer").select("*").eq("commessa_id", commessaId).order("created_at", { ascending: false }),
        s.from("ops_checklist_completamenti").select("*").eq("commessa_id", commessaId).order("created_at", { ascending: false }),
        s.from("montaggi").select("*").eq("commessa_id", commessaId).order("created_at"),
        s.from("missioni").select("*").eq("commessa_id", commessaId).order("created_at", { ascending: false }),
        s.from("log_eventi").select("*").eq("commessa_id", commessaId).order("evento_at", { ascending: false }).limit(50),
      ]);

      setData({
        commessa: commRes.data,
        vani: vaniRes.data || [],
        disegni: disegniRes.data || [],
        foto: fotoRes.data || [],
        firme: firmeRes.data || [],
        alert: alertRes.data || [],
        avanzamenti: avanzRes.data || [],
        timer: timerRes.data || [],
        checklist: checkRes.data || [],
        montaggi: montRes.data || [],
        missioni: missRes.data || [],
        eventi: evtRes.data || [],
      });
    } catch (e: any) {
      setError(e.message || "Errore caricamento");
      console.warn("[useCommessaIntegrata]", e);
    }
    setLoading(false);
  }, [commessaId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Metriche calcolate
  const metriche = data ? {
    totaleVani: data.vani.length,
    vaniConDisegno: data.disegni.length,
    vaniConMisure: data.disegni.filter(d => d.mis_l && d.mis_h).length,
    totaleFoto: data.foto.length,
    firmeFatte: data.firme.length,
    firmaCliente: data.firme.find(f => f.firma_svg || f.firma_url) || null,
    alertAperti: data.alert.filter(a => !a.risolto).length,
    alertTotali: data.alert.length,
    oreLavorate: data.timer.reduce((s, t) => s + (t.durata_secondi || 0), 0) / 3600,
    checklistCompletate: data.checklist.length,
    montaggiCompletati: data.montaggi.filter(m => m.stato === "completato").length,
    montaggiTotali: data.montaggi.length,
    missioniAperte: data.missioni.filter(m => m.stato && !["completata", "fallita", "annullata"].includes(m.stato)).length,
    ultimoEvento: data.eventi[0] || null,
  } : null;

  return { loading, data, metriche, error, reload: loadAll };
}

// -------- Funzioni di scrittura ponte (mobile → Supabase) --------

// Salva foto cantiere (chiamata da mobile dopo scatto)
export async function salvaFotoCantiere(payload: {
  azienda_id: string; commessa_id: string; operatore_id?: string;
  url: string; tipo?: string; fase_codice?: string; note?: string;
}) {
  const { data, error } = await sb().from("ops_foto").insert({
    azienda_id: payload.azienda_id,
    commessa_id: payload.commessa_id,
    operatore_id: payload.operatore_id || null,
    url: payload.url,
    tipo: payload.tipo || "cantiere",
    fase_codice: payload.fase_codice || null,
    note: payload.note || null,
  }).select().single();
  if (error) throw error;
  return data;
}

// Salva firma collaudo (chiamata da mobile dopo firma)
export async function salvaFirmaCollaudo(payload: {
  azienda_id: string; commessa_id: string; montaggio_id?: string;
  firma_svg: string; cliente_nome: string; operatore?: string;
  vani_completati?: number; vani_totali?: number; note?: string;
}) {
  const { data, error } = await sb().from("firma_collaudo").insert({
    azienda_id: payload.azienda_id,
    commessa_id: payload.commessa_id,
    montaggio_id: payload.montaggio_id || null,
    firma_svg: payload.firma_svg,
    cliente_nome: payload.cliente_nome,
    firmato_da: payload.cliente_nome,
    firmato_il: new Date().toISOString(),
    operatore: payload.operatore || null,
    vani_completati: payload.vani_completati || null,
    vani_totali: payload.vani_totali || null,
    note: payload.note || null,
  }).select().single();
  if (error) throw error;

  // Aggiorna anche la commessa con firma_cliente
  await sb().from("commesse").update({
    firma_cliente: payload.cliente_nome,
    firma_data: new Date().toISOString(),
  }).eq("id", payload.commessa_id);

  return data;
}

// Salva disegno tecnico per vano (chiamata da DisegnoTecnico dopo save)
export async function salvaDisegnoVano(payload: {
  azienda_id: string; vano_id: string; commessa_id: string;
  tipologia?: string; sistema?: string;
  mis_l?: number; mis_h?: number; mis_diag1?: number; mis_diag2?: number;
  mis_spessore_muro?: number; mis_note?: string; mis_foto_urls?: string[];
  extra?: any;
}) {
  // Upsert: se esiste aggiorna, se no crea
  const existing = await sb().from("vani_disegno").select("id").eq("vano_id", payload.vano_id).limit(1);
  const row = {
    azienda_id: payload.azienda_id,
    vano_id: payload.vano_id,
    commessa_id: payload.commessa_id,
    tipologia: payload.tipologia || null,
    sistema: payload.sistema || null,
    mis_l: payload.mis_l || null,
    mis_h: payload.mis_h || null,
    mis_diag1: payload.mis_diag1 || null,
    mis_diag2: payload.mis_diag2 || null,
    mis_spessore_muro: payload.mis_spessore_muro || null,
    mis_note: payload.mis_note || null,
    mis_foto_urls: payload.mis_foto_urls || [],
    extra: payload.extra || null,
    stato: "bozza",
    updated_at: new Date().toISOString(),
  };

  if (existing.data && existing.data.length > 0) {
    const { data, error } = await sb().from("vani_disegno").update(row).eq("id", existing.data[0].id).select().single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await sb().from("vani_disegno").insert(row).select().single();
    if (error) throw error;
    return data;
  }
}

// Segnala problema da cantiere
export async function segnalaProblema(payload: {
  azienda_id: string; commessa_id: string;
  tipo?: string; severita?: string; messaggio: string;
  destinatario_id?: string;
}) {
  const { data, error } = await sb().from("ops_alert").insert({
    azienda_id: payload.azienda_id,
    commessa_id: payload.commessa_id,
    tipo: payload.tipo || "problema_cantiere",
    severita: payload.severita || "media",
    messaggio: payload.messaggio,
    destinatario_id: payload.destinatario_id || null,
    letto: false,
    risolto: false,
  }).select().single();
  if (error) throw error;
  return data;
}

// Registra avanzamento fase
export async function registraAvanzamento(payload: {
  azienda_id: string; commessa_id: string;
  operatore_id?: string; fase_codice: string;
  stato: string; note?: string; dati?: any;
}) {
  const { data, error } = await sb().from("ops_avanzamenti").insert({
    azienda_id: payload.azienda_id,
    commessa_id: payload.commessa_id,
    operatore_id: payload.operatore_id || null,
    fase_codice: payload.fase_codice,
    stato: payload.stato,
    note: payload.note || null,
    dati: payload.dati || null,
  }).select().single();
  if (error) throw error;
  return data;
}
// bridge
