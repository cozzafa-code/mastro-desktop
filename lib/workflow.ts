// ============================================================
// MASTRO — lib/workflow.ts
// Motore workflow: gate check + automazioni + tracciabilità
// Da integrare in MastroERP.tsx sostituendo setFaseTo
// ============================================================

// ── Tipi ────────────────────────────────────────────────────
export interface GateRequisito {
  tipo: string
  // preventivo_approvato | acconto_ricevuto | misure_confermate
  // materiali_ordinati | materiali_arrivati | squadra_assegnata
  // data_montaggio | documenti_ok | checklist_completa | firma_cliente
}

export interface Automazione {
  tipo: string
  attiva: boolean
  // notifica_team | email_cliente | whatsapp_cliente
  // crea_task | avanza_fase_auto | notifica_admin
  destinatario?: string
  messaggio?: string
}

export interface FasePipeline {
  id: string
  nome: string
  color: string
  attiva: boolean
  gateRequisiti?: GateRequisito[]
  gateBloccante?: boolean
  automazioni?: Automazione[]
  emailTemplate?: string
}

// ── Verifica gate ────────────────────────────────────────────
export function verificaGate(
  commessa: any,
  targetFase: FasePipeline
): { ok: boolean; mancanti: string[] } {
  const req = targetFase.gateRequisiti || []
  if (req.length === 0) return { ok: true, mancanti: [] }

  const mancanti: string[] = []

  for (const r of req) {
    switch (r.tipo) {
      case 'preventivo_approvato':
        if (!commessa.preventivoInviato && !commessa.preventivoApprovato)
          mancanti.push('Preventivo non ancora inviato/approvato')
        break
      case 'acconto_ricevuto':
        if (!commessa.accontoRicevuto || parseFloat(commessa.accontoRicevuto) <= 0)
          mancanti.push('Acconto non ancora ricevuto')
        break
      case 'misure_confermate': {
        const rilievi = commessa.rilievi || []
        const hasDefinitivo = rilievi.some((r: any) => r.tipo === 'definitivo')
        if (!hasDefinitivo)
          mancanti.push('Nessun rilievo definitivo — misure non confermate')
        break
      }
      case 'materiali_ordinati': {
        const ordini = commessa.ordiniFornitore || []
        if (ordini.length === 0)
          mancanti.push('Nessun ordine fornitore creato')
        break
      }
      case 'materiali_arrivati': {
        const ordini = commessa.ordiniFornitore || []
        const tuttiArrivati = ordini.length > 0 &&
          ordini.every((o: any) => o.stato === 'ricevuto' || o.stato === 'confermato')
        if (!tuttiArrivati)
          mancanti.push('Materiali non ancora tutti arrivati in magazzino')
        break
      }
      case 'squadra_assegnata': {
        const montaggi = commessa.montaggi || []
        if (!montaggi.some((m: any) => m.squadraId || m.squadraNome))
          mancanti.push('Nessuna squadra di montaggio assegnata')
        break
      }
      case 'data_montaggio': {
        const montaggi = commessa.montaggi || []
        if (!montaggi.some((m: any) => m.data))
          mancanti.push('Data montaggio non ancora fissata')
        break
      }
      case 'firma_cliente':
        if (!commessa.firmaCliente && !commessa.confermaFirmata)
          mancanti.push('Firma cliente non ancora acquisita')
        break
      case 'checklist_completa': {
        const checklist = commessa.checklist || []
        if (checklist.some((item: any) => !item.done))
          mancanti.push(`Checklist incompleta (${checklist.filter((i:any) => !i.done).length} voci mancanti)`)
        break
      }
      case 'documenti_ok':
        if (!commessa.allegati || commessa.allegati.length === 0)
          mancanti.push('Nessun documento allegato')
        break
    }
  }

  return {
    ok: mancanti.length === 0,
    mancanti,
  }
}

// ── Label leggibile per requisito ───────────────────────────
export function labelRequisito(tipo: string): string {
  const map: Record<string, string> = {
    preventivo_approvato: 'Preventivo approvato',
    acconto_ricevuto: 'Acconto ricevuto',
    misure_confermate: 'Misure definitive confermate',
    materiali_ordinati: 'Materiali ordinati al fornitore',
    materiali_arrivati: 'Materiali arrivati in magazzino',
    squadra_assegnata: 'Squadra di montaggio assegnata',
    data_montaggio: 'Data montaggio fissata',
    firma_cliente: 'Firma cliente acquisita',
    checklist_completa: 'Checklist completata',
    documenti_ok: 'Documenti completi',
  }
  return map[tipo] || tipo
}

// ── Esegui automazioni ───────────────────────────────────────
export async function eseguiAutomazioni(
  commessa: any,
  fase: FasePipeline,
  team: any[],
  aziendaInfo: any
): Promise<void> {
  const automazioni = (fase.automazioni || []).filter(a => a.attiva)

  for (const auto of automazioni) {
    switch (auto.tipo) {
      case 'notifica_team':
        // Notifica interna — verrà mostrata nella QuickBar
        console.log(`[MASTRO] Notifica team: ${commessa.cliente} → ${fase.nome}`)
        break

      case 'email_cliente':
        // Email al cliente — richiede integrazione email
        if (fase.emailTemplate && commessa.email) {
          console.log(`[MASTRO] Email cliente ${commessa.email}: ${fase.emailTemplate}`)
          // In produzione: chiamata API email
        }
        break

      case 'whatsapp_cliente':
        // WhatsApp via link
        if (commessa.telefono) {
          const msg = auto.messaggio ||
            `Gentile ${commessa.cliente}, la sua commessa è avanzata alla fase: ${fase.nome}. — MASTRO`
          console.log(`[MASTRO] WhatsApp ${commessa.telefono}: ${msg}`)
        }
        break

      case 'notifica_admin':
        console.log(`[MASTRO] Notifica admin: ${commessa.cliente} → ${fase.nome}`)
        break

      case 'crea_task':
        // Crea task automatica
        console.log(`[MASTRO] Task auto creata per fase ${fase.nome}`)
        break
    }
  }
}

// ── Costruisce log entry ─────────────────────────────────────
export function buildLogEntry(
  chi: string,
  cosa: string,
  color: string,
  note?: string
) {
  return {
    chi,
    cosa,
    quando: new Date().toLocaleString('it-IT', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }),
    color,
    note: note || '',
    ts: new Date().toISOString(),
  }
}
