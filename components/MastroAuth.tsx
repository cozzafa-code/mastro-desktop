"use client";
import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

// ═══════════════════════════════════════════════════════════════════
// MASTRO AUTH — Login / Registrazione / Onboarding
// ═══════════════════════════════════════════════════════════════════

const T = {
  bg: "#F2F1EC", card: "#FFFFFF", text: "#1A1A1C", sub: "#8E8E93",
  acc: "#D08008", accLt: "#D0800815", blue: "#007aff", blueLt: "#007aff12",
  red: "#ff3b30", green: "#34c759", bdr: "#E5E5EA", purple: "#5856d6",
};

const FF = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const FM = "'JetBrains Mono', monospace";

type AuthStep = "login" | "register" | "onboarding" | "loading";

interface Props {
  onAuth: (user: any, profile: any) => void;
}

export default function MastroAuth({ onAuth }: Props) {
  const [step, setStep] = useState<AuthStep>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Onboarding fields
  const [onbRagione, setOnbRagione] = useState("");
  const [onbNome, setOnbNome] = useState("");
  const [onbCognome, setOnbCognome] = useState("");
  const [onbPiva, setOnbPiva] = useState("");
  const [onbTelefono, setOnbTelefono] = useState("");
  const [onbStep, setOnbStep] = useState(1); // 1: azienda, 2: settore, 3: personale
  const [onbSettore, setOnbSettore] = useState("");
  const [gdprAccettato, setGdprAccettato] = useState(false);
  const [marketingAccettato, setMarketingAccettato] = useState(false);

  // Check existing session on mount — WITH TIMEOUT
  useEffect(() => {
    let mounted = true;
    let resolved = false;

    // Timeout: se Supabase non risponde in 2 secondi, vai al login
    const timeout = setTimeout(() => {
      if (!resolved && mounted) {
        console.warn("Supabase timeout — fallback to login");
        resolved = true;
        setStep("login");
      }
    }, 2000);

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (resolved || !mounted) return;
        resolved = true;
        clearTimeout(timeout);

        if (session?.user) {
          // Entra subito — profilo caricato in background
          onAuth(session.user, null);
          // Tenta di caricare il profilo in background (non bloccante)
          try {
            const { data: profile } = await supabase
              .from("profili")
              .select("*, aziende(*)")
              .eq("id", session.user.id)
              .maybeSingle();
            if (mounted && profile) {
              onAuth(session.user, profile);
            }
          } catch {}
        } else {
          if (mounted) setStep("login");
        }
      } catch (e) {
        console.error("Auth check error:", e);
        if (!resolved && mounted) {
          resolved = true;
          clearTimeout(timeout);
          setStep("login");
        }
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Entra subito
        onAuth(session.user, null);
        // Profilo in background
        try {
          const { data: profile } = await supabase
            .from("profili")
            .select("*, aziende(*)")
            .eq("id", session.user.id)
            .maybeSingle();
          if (profile) onAuth(session.user, profile);
        } catch {}
      }
    });

    return () => { mounted = false; clearTimeout(timeout); subscription.unsubscribe(); };
  }, []);

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout: server non raggiungibile. Riprova.")), 8000));
      const { data, error: err } = await Promise.race([loginPromise, timeoutPromise]) as any;
      if (err) throw err;
      // onAuthStateChange handles the rest
    } catch (err: any) {
      setError(err.message === "Invalid login credentials"
        ? "Email o password errati"
        : err.message || "Errore di login");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setError(""); setLoading(true);
    if (password !== confirmPassword) { setError("Le password non coincidono"); setLoading(false); return; }
    if (password.length < 6) { setError("La password deve avere almeno 6 caratteri"); setLoading(false); return; }
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) throw err;
      if (data.user && !data.session) {
        setSuccess("Controlla la tua email per confermare la registrazione!");
        setStep("login");
      }
      // If auto-confirmed, onAuthStateChange handles it
    } catch (err: any) {
      setError(err.message || "Errore nella registrazione");
    }
    setLoading(false);
  };

  const handleOnboarding = async () => {
    if (onbStep === 1) {
      if (!onbRagione.trim()) { setError("Inserisci la ragione sociale"); return; }
      setError("");
      setOnbStep(2);
      return;
    }
    if (onbStep === 2) {
      if (!onbSettore) { setError("Seleziona il tuo settore"); return; }
      setError("");
      setOnbStep(3);
      return;
    }
    if (!onbNome.trim()) { setError("Inserisci il tuo nome"); return; }
    if (!gdprAccettato) { setError("Devi accettare la Privacy Policy per continuare"); return; }
    setError(""); setLoading(true);
    try {; setLoading(false); return; }
      const { data, error: err } = await supabase.rpc("onboard_new_user", {
        p_ragione: onbRagione.trim(),
        p_nome: onbNome.trim(),
        p_cognome: onbCognome.trim() || null,
        p_piva: onbPiva.trim() || null,
        p_telefono: onbTelefono.trim() || null,
        p_settore: onbSettore || null,
        p_gdpr_consent: true,
        p_gdpr_timestamp: new Date().toISOString(),
        p_marketing_consent: marketingAccettato,
      });
      if (err) throw err;
      // Reload profile
      const user = (await supabase.auth.getUser()).data.user;
      const { data: profile } = await supabase
        .from("profili")
        .select("*, aziende(*)")
        .eq("id", user!.id)
        .single();
      onAuth(user, profile);
    } catch (err: any) {
      setError(err.message || "Errore nel setup");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/dashboard` },
      });
      if (err) throw err;
    } catch (err: any) {
      setError(err.message || "Errore Google login");
      setLoading(false);
    }
  };

  // —— Loading screen ——
  if (step === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.text, letterSpacing: -0.5 }}>MASTRO</div>
          <div style={{ fontSize: 11, color: T.sub, fontWeight: 600, marginTop: 4 }}>Caricamento...</div>
          <div style={{ width: 40, height: 3, background: T.acc, borderRadius: 2, margin: "16px auto 0", animation: "loadBar 1s infinite" }} />
          <style>{`@keyframes loadBar { 0% { width: 40px; } 50% { width: 100px; } 100% { width: 40px; } }`}</style>
        </div>
      </div>
    );
  }

  // —— Onboarding screen ——
  if (step === "onboarding") {
    return (
      <div style={{ minHeight: "100vh", background: "#E8F4F4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF, padding: 20 }}>
        <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 20, padding: 32, boxShadow: "0 8px 40px rgba(0,0,0,0.08)", border: "1px solid #28A0A022" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: "#0D1F1F", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: FF }}>M</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0D1F1F" }}>Benvenuto in MASTRO</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Configura la tua azienda in 2 minuti</div>
          </div>

          {/* Progress */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: onbStep >= s ? "#28A0A0" : "#e0e0e0", transition: "all 0.3s" }} />
            ))}
          </div>

          {onbStep === 1 ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0D1F1F", marginBottom: 16 }}>La tua azienda</div>

              <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>Ragione sociale *</label>
              <input value={onbRagione} onChange={e => setOnbRagione(e.target.value)} placeholder="Es. Rossi Serramenti SRL"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: FF, marginBottom: 14, boxSizing: "border-box", outline: "none" }}
                onFocus={e => e.target.style.borderColor = "#28A0A0"} onBlur={e => e.target.style.borderColor = "#e0e0e0"} />

              <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>Partita IVA</label>
              <input value={onbPiva} onChange={e => setOnbPiva(e.target.value)} placeholder="IT01234567890"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: FM, marginBottom: 14, boxSizing: "border-box", outline: "none", letterSpacing: 1 }}
                onFocus={e => e.target.style.borderColor = "#28A0A0"} onBlur={e => e.target.style.borderColor = "#e0e0e0"} />

              <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>Telefono azienda</label>
              <input value={onbTelefono} onChange={e => setOnbTelefono(e.target.value)} placeholder="+39 0984 123456"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: FF, marginBottom: 20, boxSizing: "border-box", outline: "none" }}
                onFocus={e => e.target.style.borderColor = "#28A0A0"} onBlur={e => e.target.style.borderColor = "#e0e0e0"} />
            </>
          ) : onbStep === 2 ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0D1F1F", marginBottom: 8 }}>Il tuo settore</div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>Determina i moduli e i campi attivi nel tuo account.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {[
                  { id: "serramentista", label: "Serramentista", desc: "Finestre, porte, infissi", color: "#28A0A0" },
                  { id: "fabbro", label: "Fabbro", desc: "Cancelli, ringhiere, ferro", color: "#F97316" },
                  { id: "tendaggi", label: "Tendaggi", desc: "Tende, tessuti, decorazioni", color: "#7C3AED" },
                  { id: "zanzariere", label: "Zanzariere", desc: "Reti, sistemi antiinsetto", color: "#1A9E73" },
                  { id: "pergole", label: "Pergole", desc: "Pergole, gazebo, coperture", color: "#3B7FE0" },
                  { id: "altro", label: "Altro", desc: "Lavori generali", color: "#6B7280" },
                ].map(s => (
                  <div key={s.id} onClick={() => setOnbSettore(s.id)}
                    style={{ padding: "14px 12px", borderRadius: 12, border: `2px solid ${onbSettore === s.id ? s.color : "#e0e0e0"}`, background: onbSettore === s.id ? s.color + "10" : "#fff", cursor: "pointer", transition: "all 0.15s", textAlign: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: onbSettore === s.id ? s.color : "#0D1F1F" }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0D1F1F", marginBottom: 16 }}>I tuoi dati</div>

              <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>Nome *</label>
              <input value={onbNome} onChange={e => setOnbNome(e.target.value)} placeholder="Fabio"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: FF, marginBottom: 14, boxSizing: "border-box", outline: "none" }}
                onFocus={e => e.target.style.borderColor = "#28A0A0"} onBlur={e => e.target.style.borderColor = "#e0e0e0"} autoFocus />

              <label style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>Cognome</label>
              <input value={onbCognome} onChange={e => setOnbCognome(e.target.value)} placeholder="Cozza"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #e0e0e0", fontSize: 14, fontFamily: FF, marginBottom: 20, boxSizing: "border-box", outline: "none" }}
                onFocus={e => e.target.style.borderColor = "#28A0A0"} onBlur={e => e.target.style.borderColor = "#e0e0e0"} />

              <div style={{ background: "#28A0A008", borderRadius: 12, padding: "14px 16px", marginBottom: 20, border: "1px solid #28A0A020" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#28A0A0", marginBottom: 4 }}>{onbRagione}</div>
                {onbPiva && <div style={{ fontSize: 11, color: "#888", fontFamily: FM }}>{onbPiva}</div>}
                {onbTelefono && <div style={{ fontSize: 11, color: "#888" }}>{onbTelefono}</div>}
              </div>
            </>
          )}

          {/* GDPR Consenso - solo step 3 */}
          {onbStep === 3 && (
            <div style={{ marginBottom: 16 }}>
              <div
                onClick={() => setGdprAccettato(!gdprAccettato)}
                style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${gdprAccettato ? "#28A0A0" : "#e0e0e0"}`, background: gdprAccettato ? "#28A0A008" : "#fff", cursor: "pointer", marginBottom: 8, transition: "all 0.15s" }}
              >
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${gdprAccettato ? "#28A0A0" : "#e0e0e0"}`, background: gdprAccettato ? "#28A0A0" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.15s" }}>
                  {gdprAccettato && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>&#10003;</span>}
                </div>
                <div style={{ fontSize: 12, color: "#0D1F1F", lineHeight: 1.5 }}>
                  Ho letto e accetto la{" "}
                  <a href="https://mastro-erp.vercel.app/privacy" target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ color: "#28A0A0", fontWeight: 700, textDecoration: "underline" }}>
                    Privacy Policy
                  </a>{" "}e i{" "}
                  <a href="https://mastro-erp.vercel.app/termini" target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ color: "#28A0A0", fontWeight: 700, textDecoration: "underline" }}>
                    Termini di Servizio
                  </a>
                  {" "}<span style={{ color: "#DC4444", fontWeight: 700 }}>*</span>
                </div>
              </div>

              <div
                onClick={() => setMarketingAccettato(!marketingAccettato)}
                style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${marketingAccettato ? "#28A0A0" : "#e0e0e0"}`, background: marketingAccettato ? "#28A0A008" : "#fff", cursor: "pointer", transition: "all 0.15s" }}
              >
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${marketingAccettato ? "#28A0A0" : "#e0e0e0"}`, background: marketingAccettato ? "#28A0A0" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, transition: "all 0.15s" }}>
                  {marketingAccettato && <span style={{ color: "#fff", fontSize: 12, fontWeight: 900 }}>&#10003;</span>}
                </div>
                <div style={{ fontSize: 12, color: "#888", lineHeight: 1.5 }}>
                  Acconsento a ricevere aggiornamenti e comunicazioni da MASTRO (opzionale)
                </div>
              </div>
            </div>
          )}

          {error && <div style={{ background: "#DC444410", border: "1px solid #DC444430", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#DC4444", fontWeight: 600 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10 }}>
            {onbStep > 1 && (
              <button onClick={() => { setOnbStep(onbStep - 1); setError(""); }}
                style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1.5px solid #e0e0e0", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF, color: "#888" }}>
                Indietro
              </button>
            )}
            <button onClick={handleOnboarding} disabled={loading}
              style={{ flex: 2, padding: "14px", borderRadius: 12, border: "none", background: "#28A0A0", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: FF, opacity: loading ? 0.7 : 1, boxShadow: "0 4px 0 #1A8080, 0 6px 12px rgba(0,0,0,0.1)" }}>
              {loading ? "Creazione..." : onbStep < 3 ? "Continua" : "Inizia a usare MASTRO"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // —— Login / Register ——
  const isRegister = step === "register";

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FF, padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Logo + Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${T.acc}, #B8860B)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 32, boxShadow: "0 4px 20px rgba(208,128,8,0.3)" }}>🔧</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: -1 }}>MASTRO</div>
          <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, marginTop: 2, letterSpacing: 2, textTransform: "uppercase" }}>Sistema Operativo Serramentista</div>
        </div>

        {/* Card */}
        <div style={{ background: T.card, borderRadius: 20, padding: "28px 24px", boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>
            {isRegister ? "Crea il tuo account" : "Accedi"}
          </div>
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 20 }}>
            {isRegister ? "Inizia la prova gratuita di 14 giorni" : "Bentornato! Inserisci le tue credenziali"}
          </div>

          {/* Google button */}
          <button onClick={handleGoogleLogin} disabled={loading}
            style={{ width: "100%", padding: "12px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, background: T.card, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: FF, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16, color: T.text }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continua con Google
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: T.bdr }} />
            <span style={{ fontSize: 11, color: T.sub, fontWeight: 600 }}>oppure</span>
            <div style={{ flex: 1, height: 1, background: T.bdr }} />
          </div>

          {/* Email */}
          <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tuonome@azienda.it"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, fontSize: 14, fontFamily: FF, marginBottom: 12, boxSizing: "border-box", outline: "none" }}
            onFocus={e => e.target.style.borderColor = T.acc} onBlur={e => e.target.style.borderColor = T.bdr}
            onKeyDown={e => e.key === "Enter" && !isRegister && handleLogin()} />

          {/* Password */}
          <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, fontSize: 14, fontFamily: FF, marginBottom: isRegister ? 12 : 16, boxSizing: "border-box", outline: "none" }}
            onFocus={e => e.target.style.borderColor = T.acc} onBlur={e => e.target.style.borderColor = T.bdr}
            onKeyDown={e => e.key === "Enter" && !isRegister && handleLogin()} />

          {/* Confirm password (register only) */}
          {isRegister && (
            <>
              <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>Conferma password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, fontSize: 14, fontFamily: FF, marginBottom: 16, boxSizing: "border-box", outline: "none" }}
                onFocus={e => e.target.style.borderColor = T.acc} onBlur={e => e.target.style.borderColor = T.bdr}
                onKeyDown={e => e.key === "Enter" && handleRegister()} />
            </>
          )}

          {/* Error */}
          {error && <div style={{ background: "#ff3b3010", border: "1px solid #ff3b3030", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: T.red, fontWeight: 600 }}>⚠️ {error}</div>}

          {/* Success */}
          {success && <div style={{ background: "#34c75910", border: "1px solid #34c75930", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: T.green, fontWeight: 600 }}>✅ {success}</div>}

          {/* Submit button */}
          <button onClick={isRegister ? handleRegister : handleLogin} disabled={loading}
            style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${T.acc}, #B8860B)`, color: "#fff", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", fontFamily: FF, opacity: loading ? 0.7 : 1, boxShadow: "0 4px 16px rgba(208,128,8,0.3)" }}>
            {loading ? "Caricamento..." : isRegister ? "Registrati" : "Accedi"}
          </button>

          {/* Switch login/register */}
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <span style={{ fontSize: 13, color: T.sub }}>
              {isRegister ? "Hai già un account? " : "Non hai un account? "}
            </span>
            <span onClick={() => { setStep(isRegister ? "login" : "register"); setError(""); setSuccess(""); }}
              style={{ fontSize: 13, color: T.acc, fontWeight: 700, cursor: "pointer" }}>
              {isRegister ? "Accedi" : "Registrati gratis"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: T.sub }}>
          MASTRO ® 2026 — Sistema Operativo Serramentista
        </div>
      </div>
    </div>
  );
}
