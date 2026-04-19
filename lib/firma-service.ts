// ═══════════════════════════════════════════════════════════
// MASTRO ERP — lib/firma-service.ts
// Genera token firma condivisibile per cliente
// ═══════════════════════════════════════════════════════════
import { supabase } from "@/lib/supabase";

export interface FirmaSnapshot {
  cmCode: string;
  cliente: string;
  indirizzo?: string;
  telefono?: string;
  vani: Array<{
    nome: string;
    tipo: string;
    misure: string;
    qta: number;
    prezzoUnit: number;
    totale: number;
    coloreEst?: string;
    coloreInt?: string;
  }>;
  vociLibere?: Array<{ desc: string; importo: number; qta: number }>;
  totale: number;
  ivaPerc: number;
  totaleIva: number;
  condizioni?: string;
  aziendaInfo: {
    nome: string;
    indirizzo?: string;
    tel?: string;
    email?: string;
    piva?: string;
    logo?: string;
  };
}

export interface GeneraLinkFirmaParams {
  c: any; // commessa
  tipo?: "preventivo" | "conferma" | "collaudo";
  aziendaInfo: any;
  calcolaVanoPrezzo: (v: any, c: any) => number;
  getVaniAttivi: (c: any) => any[];
}

/**
 * Genera un token univoco, salva snapshot su Supabase,
 * restituisce URL pubblico per firma cliente.
 */
export async function generaLinkFirma({
  c,
  tipo = "preventivo",
  aziendaInfo,
  calcolaVanoPrezzo,
  getVaniAttivi,
}: GeneraLinkFirmaParams): Promise<string | null> {
  try {
    const vani = getVaniAttivi(c);
    const ivaPerc = c.ivaPerc || 10;

    const snapshotVani = vani.map((v: any) => {
      const prezzoUnit = calcolaVanoPrezzo(v, c);
      const qta = v.pezzi || 1;
      const m = v.misure || {};
      return {
        nome: v.nome || v.stanza || `Vano`,
        tipo: v.tipo || "",
        misure: m.lCentro && m.hCentro ? `${m.lCentro}×${m.hCentro}` : "da definire",
        qta,
        prezzoUnit: Math.round(prezzoUnit * 100) / 100,
        totale: Math.round(prezzoUnit * qta * 100) / 100,
        coloreEst: v.coloreEst || "",
        coloreInt: v.coloreInt || "",
      };
    });

    const vociLibere = (c.vociLibere || []).map((vl: any) => ({
      desc: vl.descrizione || vl.desc || "",
      importo: vl.importo || 0,
      qta: vl.qta || 1,
    }));

    const totVani = snapshotVani.reduce((s: number, v: any) => s + v.totale, 0);
    const totVoci = vociLibere.reduce((s: number, vl: any) => s + vl.importo * vl.qta, 0);
    const totale = Math.round((totVani + totVoci) * 100) / 100;
    const totaleIva = Math.round(totale * (1 + ivaPerc / 100) * 100) / 100;

    const snapshot: FirmaSnapshot = {
      cmCode: c.code || c.id,
      cliente: c.cliente || "",
      indirizzo: c.indirizzo || "",
      telefono: c.telefono || "",
      vani: snapshotVani,
      vociLibere,
      totale,
      ivaPerc,
      totaleIva,
      condizioni: c.condizioni || "",
      aziendaInfo: {
        nome: aziendaInfo.nome || "MASTRO",
        indirizzo: aziendaInfo.indirizzo || "",
        tel: aziendaInfo.tel || "",
        email: aziendaInfo.email || "",
        piva: aziendaInfo.piva || "",
        logo: aziendaInfo.logo || "",
      },
    };

    // Inserisci su Supabase — il token viene generato dal DB (DEFAULT)
    const { data, error } = await supabase
      .from("firma_tokens")
      .insert({
        cm_id: String(c.id),
        cm_code: c.code || "",
        cliente: c.cliente || "",
        tipo,
        snapshot,
        stato: "attivo",
      })
      .select("token")
      .single();

    if (error) {
      console.error("[firma-service] Errore inserimento token:", error);
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mastro-erp.vercel.app";
    return `${baseUrl}/firma/${data.token}`;
  } catch (err) {
    console.error("[firma-service] Errore:", err);
    return null;
  }
}

/**
 * Salva la firma del cliente su Supabase e aggiorna stato token.
 * Chiamata dalla pagina pubblica /firma/[token]
 */
export async function salvaFirmaCliente(
  token: string,
  firmaDataUrl: string,
  meta: { ip?: string; userAgent?: string }
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase
    .from("firma_tokens")
    .update({
      firma_data_url: firmaDataUrl,
      firma_ip: meta.ip || "",
      firma_user_agent: meta.userAgent || "",
      firmato_il: new Date().toISOString(),
      stato: "firmato",
    })
    .eq("token", token)
    .eq("stato", "attivo");

  if (error) {
    console.error("[firma-service] Errore salvataggio firma:", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * Legge lo snapshot da un token pubblico.
 * Usato dalla pagina /firma/[token]
 */
export async function getFirmaByToken(token: string): Promise<{
  data: { snapshot: FirmaSnapshot; tipo: string; stato: string; cm_id: string; cm_code: string } | null;
  error?: string;
}> {
  const { data, error } = await supabase
    .from("firma_tokens")
    .select("snapshot, tipo, stato, cm_id, cm_code, scade_il")
    .eq("token", token)
    .single();

  if (error || !data) return { data: null, error: error?.message || "Token non trovato" };

  if (data.stato !== "attivo") return { data: null, error: "Token già usato o revocato" };
  if (new Date(data.scade_il) < new Date()) return { data: null, error: "Link scaduto" };

  return { data: data as any };
}
