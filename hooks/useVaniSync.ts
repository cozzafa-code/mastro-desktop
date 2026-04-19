"use client";
// @ts-nocheck
// ================================================================
// MASTRO ERP — useVaniSync
// Osserva lo state `cantieri` e sincronizza automaticamente:
//   - vani → tabella `vani` (record separato per ogni vano)
//   - vani_disegno → tabella `vani_disegno` (misure + disegno per vano)
//   - foto → tabella `ops_foto` (foto scattate in cantiere)
// Cosi' il desktop ritrova tutto quello che il mobile scrive.
//
// UTILIZZO: aggiungere in MastroERP.tsx dopo la riga degli effect:
//   import { useVaniSync } from "../hooks/useVaniSync";
//   useVaniSync(cantieri, aziendaId, isUuid);
//
// NON modifica cantieri/state. Solo SCRIVE su tabelle Supabase separate.
// File < 300 righe.
// ================================================================
import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

function sb() {
  return createClient(supabaseUrl, supabaseKey);
}

// Debounce: non scrivere ad ogni keystroke, aspetta 3 secondi di inattivita'
const DEBOUNCE_MS = 3000;

export function useVaniSync(
  cantieri: any[],
  userId: string | null,
  isUuid: boolean
) {
  const timerRef = useRef<any>(null);
  const lastHashRef = useRef<string>("");
  const aziendaIdRef = useRef<string | null>(null);

  // Ricava aziendaId una volta sola
  useEffect(() => {
    if (!isUuid || !userId || aziendaIdRef.current) return;
    sb().from("operatori").select("azienda_id").eq("attivo", true).limit(1)
      .then(({ data }) => { if (data?.[0]?.azienda_id) aziendaIdRef.current = data[0].azienda_id; });
  }, [userId, isUuid]);

  useEffect(() => {
    if (!isUuid || !cantieri || cantieri.length === 0) return;
    if (!supabaseUrl || !supabaseKey) return;
    const aziendaId = aziendaIdRef.current;
    if (!aziendaId) return;

    // Hash veloce per evitare sync inutili
    const hash = JSON.stringify(
      cantieri.map(c => ({
        id: c.id,
        vani: (c.rilievi || []).flatMap((r: any) =>
          (r.vani || []).map((v: any) => ({
            id: v.id,
            tipo: v.tipo,
            misure: v.misure,
            note: v.note,
            sistema: v.sistema,
            coloreInt: v.coloreInt,
            coloreEst: v.coloreEst,
            _dKeys: v.disegno ? Object.keys(v.disegno).length : 0,
          }))
        ),
      }))
    );
    if (hash === lastHashRef.current) return;
    lastHashRef.current = hash;

    // Debounce
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      syncVaniToSupabase(cantieri, aziendaId);
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cantieri, userId, isUuid]);
}

// -------- Sync effettivo --------
async function syncVaniToSupabase(cantieri: any[], aziendaId: string) {
  const s = sb();

  for (const commessa of cantieri) {
    const commessaId = commessa.id;
    if (!commessaId) continue;

    // Estrai tutti i vani da tutti i rilievi
    const rilievi = commessa.rilievi || [];
    for (const rilievo of rilievi) {
      const vani = rilievo.vani || [];
      for (const vano of vani) {
        if (!vano.id) continue;

        try {
          // 1. Upsert su vani_disegno (misure + configurazione)
          const misure = vano.misure || {};
          const row = {
            azienda_id: aziendaId,
            vano_id: String(vano.id),
            commessa_id: String(commessaId),
            tipologia: vano.tipo || null,
            sistema: vano.sistema || null,
            mis_l: misure.lCentro || misure.lAlto || null,
            mis_h: misure.hCentro || misure.hSx || null,
            mis_diag1: misure.diag1 || null,
            mis_diag2: misure.diag2 || null,
            mis_spessore_muro: misure.spessoreMuro || null,
            mis_note: vano.note || null,
            mis_foto_urls: vano.fotoUrls || [],
            stato: "bozza",
            extra: {
              stanza: vano.stanza,
              piano: vano.piano,
              coloreInt: vano.coloreInt,
              coloreEst: vano.coloreEst,
              bicolore: vano.bicolore,
              vetro: vano.vetro,
              telaio: vano.telaio,
              rifilato: vano.rifilato,
              coprifilo: vano.coprifilo,
              lamiera: vano.lamiera,
              difficoltaSalita: vano.difficoltaSalita,
              mezzoSalita: vano.mezzoSalita,
              pezzi: vano.pezzi,
              accessori: vano.accessori,
              cassonetto: vano.cassonetto,
              controtelaio: vano.controtelaio,
              misure_complete: misure,
              rilievo_id: rilievo.id,
              rilievo_data: rilievo.data,
              disegno: vano.disegno || null,
            },
            updated_at: new Date().toISOString(),
          };

          // Cerca se esiste gia'
          const { data: existing } = await s
            .from("vani_disegno")
            .select("id")
            .eq("vano_id", String(vano.id))
            .eq("commessa_id", String(commessaId))
            .limit(1);

          if (existing && existing.length > 0) {
            await s
              .from("vani_disegno")
              .update(row)
              .eq("id", existing[0].id);
          } else {
            await s.from("vani_disegno").insert(row);
          }

          // 2. Sync foto del vano (se presenti come URL)
          const fotoVano = vano.foto || {};
          const fotoEntries = Object.entries(fotoVano).filter(
            ([, v]) => v && typeof v === "string" && (v as string).startsWith("http")
          );
          for (const [fotoKey, fotoUrl] of fotoEntries) {
            // Evita duplicati: cerca se esiste gia' questa URL
            const { data: existFoto } = await s
              .from("ops_foto")
              .select("id")
              .eq("commessa_id", String(commessaId))
              .eq("url", fotoUrl as string)
              .limit(1);

            if (!existFoto || existFoto.length === 0) {
              await s.from("ops_foto").insert({
                azienda_id: aziendaId,
                commessa_id: String(commessaId),
                url: fotoUrl as string,
                tipo: "misura",
                fase_codice: fotoKey,
                note: `Foto ${fotoKey} - ${vano.tipo || "vano"} ${vano.stanza || ""}`.trim(),
              });
            }
          }

          // 3. Sync disegno libero (canvas pages) se presenti
          if (vano.drawPages && Array.isArray(vano.drawPages)) {
            for (let i = 0; i < vano.drawPages.length; i++) {
              const pageDataUrl = vano.drawPages[i];
              if (!pageDataUrl || !pageDataUrl.startsWith("data:")) continue;

              const { data: existDraw } = await s
                .from("ops_foto")
                .select("id")
                .eq("commessa_id", String(commessaId))
                .eq("tipo", "disegno_libero")
                .eq("fase_codice", `draw_p${i}_v${vano.id}`)
                .limit(1);

              if (!existDraw || existDraw.length === 0) {
                await s.from("ops_foto").insert({
                  azienda_id: aziendaId,
                  commessa_id: String(commessaId),
                  url: pageDataUrl,
                  tipo: "disegno_libero",
                  fase_codice: `draw_p${i}_v${vano.id}`,
                  note: `Disegno libero pagina ${i + 1} - ${vano.tipo || "vano"}`,
                });
              }
            }
          }
        } catch (e) {
          console.warn(`[useVaniSync] errore sync vano ${vano.id}:`, e);
        }
      }
    }
  }
}

// -------- Sync dettatura vocale (testo trascritto) --------
// Chiamare dopo che saveVoiceNote aggiorna il vano
export async function syncDettatura(
  aziendaId: string,
  commessaId: string,
  vanoId: string,
  testo: string
) {
  if (!aziendaId || !commessaId || !vanoId) return;
  try {
    const s = sb();
    // Aggiorna mis_note in vani_disegno
    const { data: existing } = await s
      .from("vani_disegno")
      .select("id, mis_note")
      .eq("vano_id", String(vanoId))
      .eq("commessa_id", String(commessaId))
      .limit(1);

    if (existing && existing.length > 0) {
      const noteAttuali = existing[0].mis_note || "";
      const nuoveNote = noteAttuali
        ? `${noteAttuali}\n[dettatura] ${testo}`
        : `[dettatura] ${testo}`;
      await s
        .from("vani_disegno")
        .update({ mis_note: nuoveNote, updated_at: new Date().toISOString() })
        .eq("id", existing[0].id);
    }

    // Log evento
    await s.from("log_eventi").insert({
      azienda_id: aziendaId,
      tipo_evento: "dettatura_vocale",
      descrizione: testo.slice(0, 200),
      commessa_id: String(commessaId),
      origine: "mobile",
    });
  } catch (e) {
    console.warn("[syncDettatura] errore:", e);
  }
}
// sync
