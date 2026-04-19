// hooks/useValidatoreVano.ts
// MASTRO AI — Validatore tecnico vano
// Legge regole_validazione + sistemi_profili da Supabase
// e valida un vano restituendo errori/alert/info

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Tipi ────────────────────────────────────────────────────────────────────

export type Severita = "BLOCCANTE" | "ALERT" | "INFO";

export interface AlertValidazione {
  codice: string;
  severita: Severita;
  messaggio: string;
  suggerimento?: string;
}

export interface DatiVano {
  sistema?: string;           // es. "IDEAL 4000"
  vetro?: string;
  larghezza?: number;         // mm
  altezza?: number;           // mm
  pezzi?: number;
  altezzaDaTerra?: number;    // cm
  destinazione?: string;      // "scuola" | "ufficio" | "residenziale"
  zonaClimatica?: string;     // A-F
  posizionePosa?: string;     // "interno" | "centro" | "esterno"
  zonaCostiera?: boolean;
  pianoEdificio?: number;
  accessori?: {
    tapparella?: { attivo?: boolean };
    zanzariera?: { attivo?: boolean };
    schermatura?: { attivo?: boolean; colore?: string };
  };
}

interface SistemaProfiloDB {
  nome: string;
  uf_val: number;
  peso_max_anta_kg: number;
  larghezza_max_anta_mm: number;
  altezza_max_anta_mm: number;
  rapporto_max_h_w: number;
  peso_ml_profilo: number;
  guarnizione_centrale: boolean;
  bonding_inside: boolean;
}

// ─── Supabase client ─────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useValidatoreVano(datiVano: DatiVano | null) {
  const [alerts, setAlerts] = useState<AlertValidazione[]>([]);
  const [loading, setLoading] = useState(false);
  const [sistemaInfo, setSistemaInfo] = useState<SistemaProfiloDB | null>(null);

  const valida = useCallback(async () => {
    if (!datiVano) { setAlerts([]); return; }
    setLoading(true);

    try {
      // 1. Carica sistema profilo se specificato
      let sistema: SistemaProfiloDB | null = null;
      if (datiVano.sistema) {
        const { data } = await supabase
          .from("sistemi_profili")
          .select("*")
          .ilike("nome", `%${datiVano.sistema}%`)
          .single();
        sistema = data;
        setSistemaInfo(data);
      }

      // 2. Carica regole dal DB
      const { data: regole } = await supabase
        .from("regole_validazione")
        .select("*")
        .order("severita");

      const risultati: AlertValidazione[] = [];

      const l = datiVano.larghezza || 0;
      const h = datiVano.altezza || 0;
      const altezzaEdificio = (datiVano.pianoEdificio || 1) * 3; // ~3m per piano

      // ── REGOLE BLOCCANTI ──────────────────────────────────────────────────

      // UNI 7697: vetro stratificato
      if (
        (datiVano.altezzaDaTerra !== undefined && datiVano.altezzaDaTerra < 90) ||
        datiVano.destinazione === "scuola" ||
        datiVano.destinazione === "ufficio"
      ) {
        risultati.push({
          codice: "UNI_7697",
          severita: "BLOCCANTE",
          messaggio: "Vetro stratificato obbligatorio",
          suggerimento: datiVano.altezzaDaTerra !== undefined && datiVano.altezzaDaTerra < 90
            ? `Altezza da terra ${datiVano.altezzaDaTerra}cm < 90cm — vetro monolitico ILLEGALE`
            : `Destinazione ${datiVano.destinazione} — vetro stratificato obbligatorio per normativa`,
        });
      }

      // Limiti dimensionali sistema
      if (sistema && l > 0 && h > 0) {
        if (l > sistema.larghezza_max_anta_mm) {
          risultati.push({
            codice: "STATICA_LARGHEZZA",
            severita: "BLOCCANTE",
            messaggio: `Larghezza ${l}mm supera il limite ${sistema.larghezza_max_anta_mm}mm per ${sistema.nome}`,
            suggerimento: "Suddividere in due ante o usare sistema alzante",
          });
        }
        if (h > sistema.altezza_max_anta_mm) {
          risultati.push({
            codice: "STATICA_ALTEZZA",
            severita: "BLOCCANTE",
            messaggio: `Altezza ${h}mm supera il limite ${sistema.altezza_max_anta_mm}mm per ${sistema.nome}`,
            suggerimento: "Verificare con ferramenta speciale (max 150kg)",
          });
        }
        // Rapporto h/w
        if (l > 0 && h / l > sistema.rapporto_max_h_w) {
          risultati.push({
            codice: "STATICA_RAPPORTO",
            severita: "BLOCCANTE",
            messaggio: `Rapporto H/L ${(h / l).toFixed(2)} supera il limite ${sistema.rapporto_max_h_w} per ${sistema.nome}`,
            suggerimento: "Aggiungere traverso intermedio o cambiare sistema",
          });
        }

        // Peso anta stimato
        const areaM2 = (l / 1000) * (h / 1000);
        const pesoStimato = areaM2 * 30; // ~30kg/m² stima vetro camera
        if (pesoStimato > sistema.peso_max_anta_kg) {
          risultati.push({
            codice: "STATICA_PESO",
            severita: "BLOCCANTE",
            messaggio: `Peso anta stimato ${pesoStimato.toFixed(0)}kg supera il limite ${sistema.peso_max_anta_kg}kg`,
            suggerimento: "Usare ferramenta speciale (fino a 150kg) o ridurre dimensioni",
          });
        }
      }

      // Vento zona costiera
      if (datiVano.zonaCostiera && altezzaEdificio > 10) {
        risultati.push({
          codice: "VENTO_COSTIERO",
          severita: "BLOCCANTE",
          messaggio: `Altezza edificio ~${altezzaEdificio}m in zona costiera — richiesta classe minima C4`,
          suggerimento: "Verificare classificazione vento con sistema scelto",
        });
      }

      // ── ALERT ─────────────────────────────────────────────────────────────

      // Posizione posa
      if (datiVano.posizionePosa === "esterno") {
        risultati.push({
          codice: "POSA_POSIZIONE",
          severita: "ALERT",
          messaggio: "Posa in posizione esterna — rischio condensa sugli angoli interni",
          suggerimento: "Raccomandato: posa nel terzo interno o a filo interno mazzetta isolata (UNI 11673)",
        });
      }

      // Zona climatica vs Uw sistema
      if (datiVano.zonaClimatica && sistema) {
        const ufSistema = sistema.uf_val;
        const limiti: Record<string, number> = {
          A: 5.0, B: 3.4, C: 2.6, D: 2.0, E: 1.8, F: 1.4
        };
        const limite = limiti[datiVano.zonaClimatica];
        if (limite && ufSistema > limite) {
          risultati.push({
            codice: "TERMICA_ZONA",
            severita: "ALERT",
            messaggio: `Uf ${ufSistema} W/m²K potrebbe non soddisfare zona climatica ${datiVano.zonaClimatica} (limite Uw ≤ ${limite})`,
            suggerimento: `Verificare Uw totale con vetro scelto — considerare ${ufSistema > 1.0 ? "ENERGETO 8000" : "IDEAL 8000"}`,
          });
        }
      }

      // Guarnizione centrale mancante
      if (sistema && !sistema.guarnizione_centrale) {
        risultati.push({
          codice: "GUARNIZIONE_CENTRALE",
          severita: "ALERT",
          messaggio: `${sistema.nome} non ha guarnizione centrale — ferramenta esposta alla zona fredda`,
          suggerimento: "IDEAL 5000+ include guarnizione centrale che migliora Uw di ~0.1 e protegge la ferramenta",
        });
      }

      // ── INFO ──────────────────────────────────────────────────────────────

      // Schermatura solare — detrazione
      if (datiVano.accessori?.schermatura?.attivo) {
        risultati.push({
          codice: "DETRAZIONE_SCHERMATURE",
          severita: "INFO",
          messaggio: "Schermatura solare presente — verifica ammissibilità detrazione 50%",
          suggerimento: "Tessuti Blackout eclypser (gtot ≤ 0.35, Classe 1) ammessi Legge 145/2018",
        });
      }

      // Casa Passiva
      if (sistema?.bonding_inside) {
        risultati.push({
          codice: "CASA_PASSIVA",
          severita: "INFO",
          messaggio: `${sistema.nome} con Bonding Inside — compatibile standard Casa Passiva (Uw ≤ 0.80)`,
          suggerimento: "Abbinare vetro triplo Ug ≤ 0.6 con canalina Warm-Edge per raggiungere standard ift Rosenheim",
        });
      }

      setAlerts(risultati);
    } catch (e) {
      console.error("useValidatoreVano error:", e);
    } finally {
      setLoading(false);
    }
  }, [datiVano]);

  useEffect(() => {
    valida();
  }, [valida]);

  const bloccanti = alerts.filter(a => a.severita === "BLOCCANTE");
  const alertList = alerts.filter(a => a.severita === "ALERT");
  const infoList  = alerts.filter(a => a.severita === "INFO");
  const hasBlocchi = bloccanti.length > 0;

  return { alerts, bloccanti, alertList, infoList, hasBlocchi, loading, sistemaInfo, valida };
}
