"use client";
// @ts-nocheck
// MASTRO — LoginCentrale v2
// Fix: cerca operatore per PIN su tutte le aziende + bottone OK

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", BLUE="#3B7FE0";
const FF="Inter,system-ui,sans-serif";

const RUOLO_APP: Record<string,string> = {
  titolare:           "/dashboard",
  preventivista:      "/dashboard",
  admin:              "/dashboard",
  tecnico_misure:     "https://mastro-misure.vercel.app",
  montatore:          "https://mastro-montaggi.vercel.app",
  magazziniere:       "https://mastro-magazzino.vercel.app",
  operaio_produzione: "https://mastro-produzione.vercel.app",
  agente:             "https://mastro-rete.vercel.app",
};

type LoginMode = "scelta" | "email" | "pin";

export default function LoginCentrale() {
  const [mode, setMode]     = useState<LoginMode>("scelta");
  const [email, setEmail]   = useState("");
  const [password, setPwd]  = useState("");
  const [pin, setPin]       = useState("");
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [checking, setChecking] = useState(true);

  // Se già loggato → redirect
  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{
      if(session) redirectByRole(session.user.id);
      else setChecking(false);
    });
  },[]);

  const redirectByRole = async (userId: string) => {
    try {
      const { data } = await supabase.from("profili").select("ruolo").eq("user_id", userId).single();
      const url = RUOLO_APP[data?.ruolo||"titolare"] || "/dashboard";
      window.location.href = url;
    } catch { window.location.href = "/dashboard"; }
  };

  const loginEmail = async () => {
    if(!email||!password) return setErrore("Inserisci email e password");
    setLoading(true); setErrore("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if(error) throw error;
      await redirectByRole(data.user.id);
    } catch(e:any) {
      setErrore(e.message?.includes("Invalid")?"Email o password errati":"Errore login");
      setLoading(false);
    }
  };

  const loginPIN = async () => {
    if(pin.length<4) return setErrore("Inserisci 4 cifre");
    setLoading(true); setErrore("");
    try {
      // Cerca operatore per PIN su qualsiasi azienda — senza richiedere azienda_id
      const { data, error } = await supabase
        .from("operatori")
        .select("id, nome, ruolo, azienda_id")
        .eq("pin", pin)
        .eq("attivo", true)
        .single();

      if(error || !data) {
        setErrore("PIN non riconosciuto"); setPin(""); setLoading(false); return;
      }

      // Aggiorna ultimo accesso
      await supabase.from("operatori").update({ ultimo_accesso: new Date().toISOString() }).eq("id", data.id);

      // Salva in sessionStorage
      sessionStorage.setItem("mastro_operatore", JSON.stringify(data));
      sessionStorage.setItem("mastro_ruolo", data.ruolo);

      const url = RUOLO_APP[data.ruolo] || "/dashboard";
      window.location.href = url;
    } catch(e:any) {
      setErrore("Errore di connessione"); setPin(""); setLoading(false);
    }
  };

  const pressPin = (n:string) => {
    if(loading) return;
    if(n==="⌫") { setPin(p=>p.slice(0,-1)); setErrore(""); return; }
    if(pin.length>=4) return;
    const p = pin+n; setPin(p); setErrore("");
    // Auto-submit dopo 4 cifre
    if(p.length===4) setTimeout(()=>loginPIN(),400);
  };

  if(checking) return (
    <div style={{minHeight:"100vh",background:DARK,display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:48,height:48,borderRadius:12,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:"#fff"}}>M</div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:DARK,display:"flex",flexDirection:"column" as any,alignItems:"center",justifyContent:"center",padding:24,fontFamily:FF}}>

      {/* LOGO */}
      <div style={{textAlign:"center" as any,marginBottom:40}}>
        <div style={{width:60,height:60,borderRadius:16,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:900,color:"#fff",margin:"0 auto 14px"}}>M</div>
        <div style={{fontSize:24,fontWeight:800,color:"#fff",letterSpacing:2}}>MASTRO</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.3)",marginTop:4}}>Suite gestionale serramentisti</div>
      </div>

      {/* SCELTA */}
      {mode==="scelta"&&(
        <div style={{width:"100%",maxWidth:360}}>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",textAlign:"center" as any,marginBottom:24}}>Come vuoi accedere?</div>
          <div style={{display:"flex",flexDirection:"column" as any,gap:12}}>
            <button onClick={()=>setMode("email")}
              style={{padding:"18px 20px",borderRadius:16,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:FF,display:"flex",alignItems:"center",gap:16,textAlign:"left" as any}}>
              <div style={{width:44,height:44,borderRadius:12,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <div style={{fontWeight:600,marginBottom:2}}>Titolare / Ufficio</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Email e password</div>
              </div>
            </button>
            <button onClick={()=>setMode("pin")}
              style={{padding:"18px 20px",borderRadius:16,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",fontSize:15,fontWeight:500,cursor:"pointer",fontFamily:FF,display:"flex",alignItems:"center",gap:16,textAlign:"left" as any}}>
              <div style={{width:44,height:44,borderRadius:12,background:BLUE,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              </div>
              <div>
                <div style={{fontWeight:600,marginBottom:2}}>Operaio / Tecnico</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>PIN 4 cifre</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* EMAIL */}
      {mode==="email"&&(
        <div style={{width:"100%",maxWidth:360}}>
          <button onClick={()=>{setMode("scelta");setErrore("");}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,marginBottom:24,padding:0,fontFamily:FF}}>‹ Indietro</button>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6}}>Email</div>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="email@azienda.it"
              style={{width:"100%",padding:"13px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:15,outline:"none",fontFamily:FF}}/>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,fontWeight:600,color:"rgba(255,255,255,0.4)",textTransform:"uppercase" as any,letterSpacing:0.5,marginBottom:6}}>Password</div>
            <input value={password} onChange={e=>setPwd(e.target.value)} type="password" placeholder="••••••••"
              onKeyDown={e=>{if(e.key==="Enter")loginEmail();}}
              style={{width:"100%",padding:"13px 14px",borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:15,outline:"none",fontFamily:FF}}/>
          </div>
          {errore&&<div style={{color:RED,fontSize:13,marginBottom:14,textAlign:"center" as any}}>{errore}</div>}
          <button onClick={loginEmail} disabled={loading}
            style={{width:"100%",padding:"15px",borderRadius:14,background:TEAL,color:"#fff",border:"none",fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:FF,opacity:loading?0.6:1}}>
            {loading?"Accesso...":"Accedi →"}
          </button>
        </div>
      )}

      {/* PIN */}
      {mode==="pin"&&(
        <div style={{width:"100%",maxWidth:320,display:"flex",flexDirection:"column" as any,alignItems:"center"}}>
          <button onClick={()=>{setMode("scelta");setPin("");setErrore("");}} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",cursor:"pointer",fontSize:13,marginBottom:24,padding:0,fontFamily:FF,alignSelf:"flex-start"}}>‹ Indietro</button>
          <div style={{fontSize:15,color:"rgba(255,255,255,0.5)",marginBottom:24}}>Inserisci il tuo PIN</div>

          {/* Dots */}
          <div style={{display:"flex",gap:16,marginBottom:32}}>
            {[0,1,2,3].map(i=>(
              <div key={i} style={{width:18,height:18,borderRadius:"50%",background:i<pin.length?BLUE:"rgba(255,255,255,0.15)",transition:"background .15s",transform:i<pin.length?"scale(1.1)":"scale(1)"}}/>
            ))}
          </div>

          {errore&&<div style={{color:RED,fontSize:13,marginBottom:16,textAlign:"center" as any}}>{errore}</div>}

          {/* Tastiera */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,width:"100%",marginBottom:16}}>
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((n,i)=>(
              <div key={i} onClick={()=>{if(n&&!loading)pressPin(n);}}
                style={{height:70,borderRadius:16,background:n?"rgba(255,255,255,0.09)":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:n==="⌫"?22:24,fontWeight:n==="⌫"?400:500,color:loading?"rgba(255,255,255,0.2)":"#fff",cursor:n&&!loading?"pointer":"default",userSelect:"none" as any,transition:"background .1s",WebkitUserSelect:"none" as any}}
                onTouchStart={e=>{if(n&&!loading)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.18)";}}
                onTouchEnd={e=>{if(n)(e.currentTarget as HTMLElement).style.background="rgba(255,255,255,0.09)";}}
              >{n}</div>
            ))}
          </div>

          {/* Bottone OK esplicito */}
          <button onClick={loginPIN} disabled={pin.length<4||loading}
            style={{width:"100%",padding:"16px",borderRadius:14,background:pin.length===4&&!loading?BLUE:"rgba(255,255,255,0.08)",color:pin.length===4&&!loading?"#fff":"rgba(255,255,255,0.3)",border:"none",fontSize:16,fontWeight:600,cursor:pin.length===4&&!loading?"pointer":"not-allowed",fontFamily:FF,transition:"all .2s"}}>
            {loading?"Verifica in corso...":"Entra →"}
          </button>
        </div>
      )}

      <div style={{position:"fixed" as any,bottom:20,fontSize:11,color:"rgba(255,255,255,0.12)"}}>MASTRO Suite · GALASSIA MASTRO</div>
    </div>
  );
}
