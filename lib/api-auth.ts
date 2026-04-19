import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AuthResult {
  ok: boolean;
  userId: string;
  aziendaId?: string;
}

export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) return { ok: false, userId: '' };

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return { ok: false, userId: '' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('azienda_id')
    .eq('id', user.id)
    .single();

  return {
    ok: true,
    userId: user.id,
    aziendaId: profile?.azienda_id,
  };
}
