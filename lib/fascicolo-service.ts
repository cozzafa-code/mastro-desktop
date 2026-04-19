// ============================================================
// MASTRO ERP — lib/fascicolo-service.ts
// Gestione Fascicolo Geometra su Supabase
// Tabella: fascicoli (token UUID, snapshot JSONB, TTL 30gg)
// ============================================================
import { supabase } from "@/lib/supabase";

// ─── TIPI ────────────────────────────────────────────────────
export interface FascicoloSnapshot {
  commessa: {
    id: string;
    code?: string;
    cliente?: string;
    cognome?: string;
    indirizzo?: string;
    citta?: string;
    telefono?: string;
    email?: string;
    data?: string;
    fase?: string;
    note?: string;
    sistema?: string;
  };
  vani: Array<{
    id: string;
    nome?: string;
    tipo?: string;
    stanza?: string;
    piano?: string;
    pezzi?: number;
    sistema?: string;
    colore?: string;
    vetro?: string;
    controtelaio?: string;
    soglia?: string;
    davanzale?: string;
    note?: string;
    statoMisure?: string;
    misure?: Record<string, number>;
    accessori?: any;
    pdfFornitoreNome?: string;
    prezzoUnitario?: number;
    prezzoTotale?: number;
  }>;
  azienda: {
    ragione?: string;
    indirizzo?: string;
    telefono?: string;
    email?: string;
    piva?: string;
    logo?: string;
  };
  totali: {
    imponibile: number;
    iva: number;
    totale: number;
    nVani: number;
    nPezzi: number;
  };
  generatoIl: string;
  validoFino: string;
}

export interface Fascicolo {
  id: string;
  token: string;
  commessa_id: string;
  azienda_id: string;
  dati: FascicoloSnapshot;
  created_at: string;
  expires_at: string;
  viewed_at?: string;
  view_count: number;
}

// ─── GENERA E SALVA FASCICOLO ─────────────────────────────────
export async function creaFascicolo(
  snapshot: FascicoloSnapshot,
  commessaId: string,
  aziendaId: string
): Promise<{ token: string; url: string } | null> {
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + 30);

    const { data, error } = await supabase
      .from("fascicoli")
      .insert({
        commessa_id: commessaId,
        azienda_id: aziendaId,
        dati: snapshot,
        expires_at: expires.toISOString(),
        view_count: 0,
      })
      .select("token")
      .single();

    if (error || !data) {
      console.error("creaFascicolo error:", error);
      return null;
    }

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://mastro-erp.vercel.app";
    return {
      token: data.token,
      url: `${baseUrl}/fascicolo/${data.token}`,
    };
  } catch (e) {
    console.error("creaFascicolo exception:", e);
    return null;
  }
}

// ─── LEGGI FASCICOLO (pubblico, per token) ───────────────────
export async function getFascicoloByToken(token: string): Promise<Fascicolo | null> {
  try {
    const { data, error } = await supabase
      .from("fascicoli")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) return null;

    // Incrementa contatore visite
    await supabase
      .from("fascicoli")
      .update({ view_count: (data.view_count || 0) + 1, viewed_at: new Date().toISOString() })
      .eq("token", token);

    return data as Fascicolo;
  } catch (e) {
    console.error("getFascicoloByToken exception:", e);
    return null;
  }
}

// ─── LISTA FASCICOLI PER COMMESSA ────────────────────────────
export async function getFascicoliCommessa(commessaId: string): Promise<Fascicolo[]> {
  try {
    const { data, error } = await supabase
      .from("fascicoli")
      .select("id, token, created_at, expires_at, viewed_at, view_count")
      .eq("commessa_id", commessaId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Fascicolo[];
  } catch (e) {
    return [];
  }
}

// ─── REVOCA FASCICOLO ────────────────────────────────────────
export async function revocaFascicolo(token: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("fascicoli")
      .update({ expires_at: new Date().toISOString() })
      .eq("token", token);
    return !error;
  } catch (e) {
    return false;
  }
}

// ─── BUILD SNAPSHOT da dati commessa ─────────────────────────
export function buildSnapshot(
  c: any,
  vani: any[],
  aziendaInfo: any,
  sistemiDB: any[],
  vetriDB: any[],
  calcolaVanoPrezzo: (v: any, c: any) => number
): FascicoloSnapshot {
  const validoFino = new Date();
  validoFino.setDate(validoFino.getDate() + 30);

  const vaniSnap = vani.map((v) => {
    const pUnit = calcolaVanoPrezzo(v, c);
    return {
      id: v.id,
      nome: v.nome,
      tipo: v.tipo,
      stanza: v.stanza,
      piano: v.piano,
      pezzi: v.pezzi || 1,
      sistema: v.sistema || c.sistema,
      colore: v.colore,
      vetro: v.vetro,
      controtelaio: v.controtelaio,
      soglia: v.soglia,
      davanzale: v.davanzale,
      note: v.note,
      statoMisure: v.statoMisure || "provvisorie",
      misure: v.misure || {},
      accessori: v.accessori,
      pdfFornitoreNome: v.pdfFornitoreNome,
      prezzoUnitario: pUnit,
      prezzoTotale: pUnit * (v.pezzi || 1),
    };
  });

  const imponibile = vaniSnap.reduce((s, v) => s + (v.prezzoTotale || 0), 0) +
    (c.vociLibere || []).reduce((s, vl) => s + (vl.importo || 0) * (vl.qta || 1), 0);
  const ivaRate = (c.iva ?? 10) / 100;
  const iva = imponibile * ivaRate;

  return {
    commessa: {
      id: c.id,
      code: c.code || c.id,
      cliente: c.cliente || c.nome,
      cognome: c.cognome,
      indirizzo: c.indirizzo,
      citta: c.citta,
      telefono: c.telefono,
      email: c.email,
      data: c.data,
      fase: c.fase,
      note: c.note,
      sistema: c.sistema,
    },
    vani: vaniSnap,
    azienda: {
      ragione: aziendaInfo?.ragione,
      indirizzo: aziendaInfo?.indirizzo,
      telefono: aziendaInfo?.telefono,
      email: aziendaInfo?.email,
      piva: aziendaInfo?.piva,
      logo: aziendaInfo?.logo,
    },
    totali: {
      imponibile,
      iva,
      totale: imponibile + iva,
      nVani: vaniSnap.length,
      nPezzi: vaniSnap.reduce((s, v) => s + (v.pezzi || 1), 0),
    },
    generatoIl: new Date().toISOString(),
    validoFino: validoFino.toISOString(),
  };
}

// ─── SQL per creare la tabella (da eseguire in Supabase SQL Editor) ──
/*
CREATE TABLE IF NOT EXISTS fascicoli (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  commessa_id TEXT NOT NULL,
  azienda_id  UUID NOT NULL,
  dati        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL,
  viewed_at   TIMESTAMPTZ,
  view_count  INT NOT NULL DEFAULT 0
);

-- Indici
CREATE INDEX IF NOT EXISTS fascicoli_token_idx ON fascicoli(token);
CREATE INDEX IF NOT EXISTS fascicoli_commessa_idx ON fascicoli(commessa_id);
CREATE INDEX IF NOT EXISTS fascicoli_azienda_idx ON fascicoli(azienda_id);

-- RLS
ALTER TABLE fascicoli ENABLE ROW LEVEL SECURITY;

-- Lettura pubblica per token (pagina cliente, no auth)
CREATE POLICY "fascicoli_public_read" ON fascicoli
  FOR SELECT USING (true);

-- Scrittura solo per utenti autenticati della propria azienda
CREATE POLICY "fascicoli_insert_auth" ON fascicoli
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "fascicoli_update_own" ON fascicoli
  FOR UPDATE USING (azienda_id = (
    SELECT id FROM aziende WHERE user_id = auth.uid() LIMIT 1
  ));
*/
