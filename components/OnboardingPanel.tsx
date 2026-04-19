"use client";
// @ts-nocheck
import React from "react";
import { useMastro } from "./MastroContext";
import { FF } from "./mastro-constants";

export function OnboardingPanel() {
  const {
    T, S, isDesktop, fs,
    firmaDrawing, selectedCM, setCantieri, setFaseTo, setFirmaDrawing,
    setSelectedCM, setSettoriAttivi, setShowFirmaModal, setShowOnboarding,
    settoriAttivi, showOnboarding,
  } = useMastro();

    if (!showOnboarding) return null;
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ background: T.card, borderRadius: 20, padding: 24, maxWidth: 420, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: T.text, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 28, fontWeight: 900, color: T.card, fontFamily: FF }}>M</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.text, letterSpacing: -0.5 }}>Benvenuto in MASTRO</div>
            <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>Seleziona i prodotti che vendi o installi. Puoi modificare in qualsiasi momento dalle Impostazioni.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {SETTORI.map(s => {
              const isOn = settoriAttivi.includes(s.id);
              return (
                <div key={s.id} onClick={() => {
                  setSettoriAttivi(prev => isOn ? prev.filter(x => x !== s.id) : [...prev, s.id]);
                }} style={{
                  padding: "14px 16px", borderRadius: 14, cursor: "pointer",
                  border: `2px solid ${isOn ? "#007aff" : T.bdr}`,
                  background: isOn ? "#007aff10" : T.bg,
                  display: "flex", alignItems: "center", gap: 12, transition: "all .15s",
                }}>
                  <div style={{ fontSize: 28, width: 36, textAlign: "center" }}>{s.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isOn ? "#007aff" : T.text }}>{s.label}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>{s.desc}</div>
                  </div>
                  <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    background: isOn ? "#007aff" : T.bg,
                    border: `2px solid ${isOn ? "#007aff" : T.bdr}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, color: "#fff", fontWeight: 900,
                  }}>{isOn ? "✓" : ""}</div>
                </div>
              );
            })}
          </div>
          <button onClick={() => {
            if (settoriAttivi.length === 0) { setSettoriAttivi(SETTORI_DEFAULT); }
            setShowOnboarding(false);
          }} style={{
            width: "100%", padding: 16, borderRadius: 14, border: "none",
            background: settoriAttivi.length > 0 ? "#007aff" : T.bdr,
            color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: FF,
            marginTop: 16,
          }}>
            {settoriAttivi.length > 0 ? `Inizia con ${settoriAttivi.length} ${settoriAttivi.length === 1 ? "settore" : "settori"} →` : "Seleziona almeno un settore"}
          </button>
          <div style={{ textAlign: "center", fontSize: 10, color: T.sub, marginTop: 10 }}>
            MASTRO si adatta al tuo lavoro: serramenti, zanzariere, tende, box doccia e altro.
          </div>
        </div>
      </div>
    );

}

export function FirmaModalPanel() {
  const {
    T, S, fs,
    firmaDrawing, selectedCM, setCantieri, setFaseTo, setFirmaDrawing,
    setSelectedCM, setShowFirmaModal, showFirmaModal,
    firmaRef,
  } = useMastro();

    if (!showFirmaModal) return null;
    const c = selectedCM;
    const clearFirma = () => { const cv=firmaRef.current; if(cv){const ctx=cv.getContext("2d");ctx.clearRect(0,0,cv.width,cv.height);} };
    const salvaFirma = () => {
      const cv=firmaRef.current; if(!cv)return;
      const dataUrl=cv.toDataURL("image/png");
      setCantieri(cs=>cs.map(x=>x.id===c.id?{...x,firmaCliente:dataUrl,dataFirma:new Date().toLocaleDateString("it-IT")}:x));
      setSelectedCM(p=>({...p,firmaCliente:dataUrl,dataFirma:new Date().toLocaleDateString("it-IT")}));
      setFaseTo(c.id, "conferma"); // AUTO-ADVANCE: firma → conferma
      setShowFirmaModal(false);
    };
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
        <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:420,overflow:"hidden"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #eee",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>✍️</span>
            <div><div style={{fontSize:14,fontWeight:800}}>Firma del Cliente</div><div style={{fontSize:11,color:"#666"}}>{c?.code}</div></div>
            <div onClick={()=>setShowFirmaModal(false)} style={{marginLeft:"auto",width:28,height:28,borderRadius:"50%",background:"#f5f5f7",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>✕</div>
          </div>
          <div style={{padding:"12px 16px 0"}}>
            <div style={{fontSize:11,color:"#666",marginBottom:8,textAlign:"center"}}>Firma nella casella qui sotto</div>
            <div style={{border:"2px solid #007aff",borderRadius:10,overflow:"hidden",background:"#fafafa",touchAction:"none"}}>
              <canvas ref={firmaRef} width={388} height={160} style={{width:"100%",height:160,display:"block",cursor:"crosshair"}}
                onPointerDown={e=>{firmaRef.current?.setPointerCapture(e.pointerId);setFirmaDrawing(true);const cv=firmaRef.current;const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;const ctx=cv.getContext("2d");ctx.beginPath();ctx.moveTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.strokeStyle="#1a1a1c";ctx.lineWidth=2.5;ctx.lineCap="round";ctx.lineJoin="round";}}
                onPointerMove={e=>{if(!firmaDrawing)return;const cv=firmaRef.current;const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;const ctx=cv.getContext("2d");ctx.lineTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.stroke();}}
                onPointerUp={()=>setFirmaDrawing(false)} onPointerLeave={()=>setFirmaDrawing(false)}/>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0 10px"}}>
              <div style={{fontSize:10,color:"#999"}}>📅 {new Date().toLocaleDateString("it-IT")}</div>
              <div onClick={clearFirma} style={{fontSize:11,color:"#ff3b30",cursor:"pointer",fontWeight:600}}>🗝‘ Cancella</div>
            </div>
          </div>
          <div style={{padding:"0 16px 16px",display:"flex",gap:8}}>
            <button onClick={()=>setShowFirmaModal(false)} style={{flex:1,padding:12,borderRadius:10,border:"1px solid #eee",background:"#f5f5f7",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",color:"#666"}}>Annulla</button>
            <button onClick={salvaFirma} style={{flex:2,padding:12,borderRadius:10,border:"none",background:"linear-gradient(135deg,#34c759,#1a9e40)",color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>✅ Conferma firma</button>
          </div>
        </div>
      </div>
    );

}
