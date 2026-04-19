// ============================================================
// MASTRO ERP â€” Supabase Client + Auth
// lib/supabase.ts
// ============================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fgefcigxlbrmbeqqzjmo.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZnZWZjaWd4bGJybWJlcXF6am1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk5NjQ2NjAsImV4cCI6MjA1NTU0MDY2MH0.r2cNPGpb5MMy99kEMIRSgHgBBmJU1gfjsGOEFWBYfwY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: "sb-session",
    storage: {
      getItem: (key: string) => {
        if (typeof document === "undefined") return null;
        const match = document.cookie.match(new RegExp("(^| )" + key + "=([^;]+)"));
        return match ? decodeURIComponent(match[2]) : null;
      },
      setItem: (key: string, value: string) => {
        if (typeof document === "undefined") return;
        document.cookie = key + "=" + encodeURIComponent(value) + "; path=/; max-age=31536000; SameSite=Lax";
      },
      removeItem: (key: string) => {
        if (typeof document === "undefined") return;
        document.cookie = key + "=; path=/; max-age=0";
      },
    },
  },
});

// â”€â”€ Auth Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export function onAuthChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}

// â”€â”€ Onboarding â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function onboardNewUser(
  ragione: string,
  nome: string,
  cognome?: string,
  piva?: string,
  telefono?: string
) {
  const { data, error } = await supabase.rpc("onboard_new_user", {
    p_ragione: ragione,
    p_nome: nome,
    p_cognome: cognome || null,
    p_piva: piva || null,
    p_telefono: telefono || null,
  });
  if (error) throw error;
  return data as string; // azienda_id
}

// â”€â”€ Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getMyProfile() {
  const user = await getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("profili")
    .select("*, aziende(*)")
    .eq("id", user.id)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function updateProfile(updates: Record<string, any>) {
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
  const { data, error } = await supabase
    .from("profili")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// â”€â”€ Azienda â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export async function getAzienda() {
  const { data, error } = await supabase
    .from("aziende")
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateAzienda(updates: Record<string, any>) {
  const profile = await getMyProfile();
  if (!profile) throw new Error("No profile");
  const { data, error } = await supabase
    .from("aziende")
    .update(updates)
    .eq("id", profile.azienda_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}


