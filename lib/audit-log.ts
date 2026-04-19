// lib/audit-log.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type AuditAction =
  | 'login'
  | 'logout'
  | 'pin_verify'
  | 'pin_change'
  | 'pin_lock'
  | 'preventivo_create'
  | 'preventivo_update'
  | 'preventivo_delete'
  | 'preventivo_pdf'
  | 'cliente_create'
  | 'cliente_update'
  | 'cliente_delete'
  | 'misura_create'
  | 'misura_update'
  | 'misura_delete'
  | 'team_invite'
  | 'team_remove'
  | 'settings_update'
  | 'email_send'
  | 'account_delete';

export interface AuditLogEntry {
  azienda_id: string;
  user_id?: string;
  action: AuditAction;
  entity?: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  ip?: string;
}

export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await supabase.from('audit_log').insert(entry);
  } catch {
    // Audit log non deve mai far crashare l'app
    console.error('[audit-log] insert failed:', entry.action);
  }
}

// Helper per estrarre IP da NextRequest
export function getIpFromRequest(req: { headers: { get: (k: string) => string | null } }): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
}
