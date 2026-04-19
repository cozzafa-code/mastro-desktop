import { z } from 'zod';

// ── PIN ──────────────────────────────────────────────────────
export const PinActionSchema = z.object({
  action: z.enum(['set', 'verify', 'remove', 'unlock']),
  memberId: z.string().uuid(),
  azId: z.string().uuid(),
  pin: z.string().regex(/^\d{6}$/, 'PIN deve essere 6 cifre numeriche').optional(),
});

// ── GMAIL SEND ───────────────────────────────────────────────
export const GmailSendSchema = z.object({
  to: z.string().email('Email destinatario non valida'),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(50000),
  replyTo: z.string().email().optional(),
  azId: z.string().uuid().optional(),
});

// ── MASTRO ROUTE (generica) ──────────────────────────────────
export const MastroRouteBaseSchema = z.object({
  azId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
}).passthrough();

// ── COMMESSA ─────────────────────────────────────────────────
export const CommessaSchema = z.object({
  azienda_id: z.string().uuid(),
  cliente_id: z.string().uuid().optional(),
  titolo: z.string().min(1).max(200),
  descrizione: z.string().max(5000).optional(),
  stato: z.enum(['bozza', 'attiva', 'completata', 'annullata']).default('bozza'),
  data_sopralluogo: z.string().datetime().optional().nullable(),
  data_consegna: z.string().datetime().optional().nullable(),
  importo: z.number().min(0).max(9999999).optional().nullable(),
  note: z.string().max(5000).optional(),
});

// ── CONTATTO ─────────────────────────────────────────────────
export const ContattoSchema = z.object({
  azienda_id: z.string().uuid(),
  nome: z.string().min(1).max(200),
  cognome: z.string().max(100).optional(),
  email: z.string().email().optional().nullable(),
  telefono: z.string().max(30).optional().nullable(),
  indirizzo: z.string().max(300).optional().nullable(),
  citta: z.string().max(100).optional().nullable(),
  cap: z.string().max(10).optional().nullable(),
  piva: z.string().max(20).optional().nullable(),
  note: z.string().max(3000).optional(),
});

// ── MISURA ───────────────────────────────────────────────────
export const MisuraSchema = z.object({
  vano_id: z.string().uuid(),
  chiave: z.string().min(1).max(100),
  valore: z.number().min(0).max(99999),
  unita: z.string().max(20).default('mm'),
});

// ── TASK / EVENTO ────────────────────────────────────────────
export const TaskSchema = z.object({
  azienda_id: z.string().uuid(),
  titolo: z.string().min(1).max(300),
  descrizione: z.string().max(3000).optional(),
  data_scadenza: z.string().datetime().optional().nullable(),
  assegnato_a: z.string().uuid().optional().nullable(),
  commessa_id: z.string().uuid().optional().nullable(),
  priorita: z.enum(['bassa', 'media', 'alta', 'urgente']).default('media'),
  completato: z.boolean().default(false),
});

// ── MESSAGGIO ────────────────────────────────────────────────
export const MessaggioSchema = z.object({
  azienda_id: z.string().uuid(),
  commessa_id: z.string().uuid().optional().nullable(),
  testo: z.string().min(1).max(10000),
  tipo: z.enum(['interno', 'cliente', 'fornitore']).default('interno'),
});

// ── PDF REQUEST ──────────────────────────────────────────────
export const PdfRequestSchema = z.object({
  tipo: z.enum(['preventivo', 'conferma_b2b', 'conferma_b2c']),
  commessa_id: z.string().uuid(),
});

// ── ONBOARDING ───────────────────────────────────────────────
export const OnboardingSchema = z.object({
  ragione_sociale: z.string().min(1).max(200),
  piva: z.string().max(20).optional(),
  settori: z.array(z.enum(['serramenti', 'tendaggi', 'fabbro', 'zanzariere', 'pergole'])).min(1),
  nome_titolare: z.string().min(1).max(200),
  telefono: z.string().max(30).optional(),
  citta: z.string().max(100).optional(),
});

// ── SANITIZE ─────────────────────────────────────────────────
export function sanitizeString(s: unknown): string {
  if (typeof s !== 'string') return '';
  return s
    .replace(/<[^>]*>/g, '')           // strip HTML tags
    .replace(/javascript:/gi, '')       // strip javascript: protocol
    .replace(/on\w+\s*=/gi, '')         // strip event handlers
    .replace(/data:/gi, '')             // strip data: URI
    .trim()
    .slice(0, 10000);
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') result[k] = sanitizeString(v);
    else if (typeof v === 'object' && v !== null && !Array.isArray(v))
      result[k] = sanitizeObject(v as Record<string, unknown>);
    else result[k] = v;
  }
  return result as T;
}

// ── HELPER: parse + sanitize in un colpo ─────────────────────
export function parseAndSanitize<T>(schema: z.ZodSchema<T>, body: unknown): { data: T } | { error: string } {
  const sanitized = typeof body === 'object' && body !== null
    ? sanitizeObject(body as Record<string, unknown>)
    : body;
  const result = schema.safeParse(sanitized);
  if (!result.success) return { error: result.error.errors[0].message };
  return { data: result.data };
}
