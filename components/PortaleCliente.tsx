"use client";
// @ts-nocheck
// MASTRO — PortaleCliente.tsx (app/portale/[token]/page.tsx)
// Portale B2C cliente: stato lavoro, documenti, pagamenti, chat, firma

import { useState } from "react";

const TEAL="#1A9E73", DARK="#1A1A1C", RED="#DC4444", AMBER="#E8A020", BLUE="#3B7FE0", PURPLE="#8B5CF6";

// Dati demo — in produzione vengono da Supabase via token
const DEMO_COMMESSA = {
  code:"S-0042", cliente:"Anna Rossi", indirizzo:"Via Roma 12, Cosenza",
  azienda:{ nome:"Walter Cozza Serramenti", tel:"+39 0984 123456", logo:"WC", colore:DARK },
  fase:"produzione", progress:65,
  fasi:[
    {l:"Sopralluogo",    data:"3 Feb", done:true,  nota:"Rilievo completato. 4 vani."},
    {l:"Preventivo",     data:"5 Feb", done:true,  nota:"€8.450 accettato e firmato digitalmente."},
    {l:"Misure",         data:"7 Feb", done:true,  nota:"Misure definitive confermate."},
    {l:"Ordine",         data:"10 Feb",done:true,  nota:"Ordine Schüco confermato."},
    {l:"Produzione",     data:"~18 Feb",done:false, nota:"Lavorazione in corso. Stimati 5 gg."},
    {l:"Posa",           data:"~26 Feb",done:false, nota:"Installazione 1 giornata."},
    {l:"Completato",     data:"",      done:false, nota:""},
  ],
  vani:[
    {nome:"Salone",     tipo:"Scorrevole HST",    mis:"2400×2200 mm", col:"RAL 7016", uw:"1.1"},
    {nome:"Camera",     tipo:"Finestra 2 ante",   mis:"1400×1400 mm", col:"RAL 7016", uw:"1.3"},
    {nome:"Cameretta",  tipo:"Finestra 1 anta",   mis:"1000×1200 mm", col:"RAL 7016", uw:"1.3"},
    {nome:"Bagno",      tipo:"Vasistas",          mis:"600×600 mm",   col:"RAL 9010", uw:"1.4"},
  ],
  pagamenti:{
    totale:8450, pagato:2535, saldo:5915,
    rate:[
      {desc:"Acconto 30%",    importo:2535, data:"6 Feb",  stato:"pagata"},
      {desc:"Saldo 70% (posa)",importo:5915,data:"~26 Feb",stato:"da pagare"},
    ]
  },
  docs:[
    {nome:"Preventivo firmato",  data:"5 Feb",   stato:"firmato",     ico:"📄"},
    {nome:"Contratto fornitura", data:"5 Feb",   stato:"firmato",     ico:"📋"},
    {nome:"Fattura acconto",     data:"6 Feb",   stato:"pagata",      ico:"🧾"},
    {nome:"Conferma ordine",     data:"10 Feb",  stato:null,          ico:"📦"},
    {nome:"Fattura saldo",       data:"alla posa",stato:"da emettere",ico:"🧾"},
    {nome:"Certificazione CE",   data:"dopo posa",stato:"in arrivo",  ico:"🏅"},
    {nome:"Pratica ENEA",        data:"dopo posa",stato:"da compilare",ico:"🌱"},
    {nome:"Garanzia 10 anni",    data:"dopo posa",stato:"in arrivo",  ico:"🛡️"},
  ],
  chat:[
    {dir:"azienda",da:"Walter Cozza",txt:"Preventivo pronto! €8.450 tutto incluso.",t:"5 Feb"},
    {dir:"cliente",da:"Anna",txt:"Va bene, procediamo!",t:"5 Feb"},
    {dir:"azienda",da:"Walter Cozza",txt:"Ordine confermato! Produzione inizia il 12 febbraio.",t:"10 Feb"},
    {dir:"cliente",da:"Anna",txt:"Perfetto. Quando arrivano i serramenti?",t:"19 Feb"},
    {dir:"azienda",da:"Walter Cozza",txt:"Consegna prevista 24 febbraio, posa il 26. Vi confermiamo con anticipo.",t:"19 Feb"},
  ],
};

export default function PortaleCliente() {
  const [tab, setTab] = useState<"home"|"docs"|"chat"|"pagamenti">("home");
  const [msg, setMsg] = useState("");
  const [chatMsgs, setChatMsgs] = useState(DEMO_COMMESSA.chat);
  const cm = DEMO_COMMESSA;
  const faseIdx = cm.fasi.findIndex(f=>!f.done);

  const sendMsg = () => {
    if(!msg.trim()) return;
    setChatMsgs(p=>[...p,{dir:"cliente",da:"Anna",txt:msg,t:"ora"}]);
    setMsg("");
    setTimeout(()=>setChatMsgs(p=>[...p,{dir:"azienda",da:cm.azienda.nome,txt:"Messaggio ricevuto. Ti risponderemo al più presto.",t:"ora"}]),800);
  };

  const fmtE=(n:number)=>"€"+n.toLocaleString("it-IT");
  const statoColor=(s:string|null)=>!s?"#9CA3AF":s==="firmato"||s==="pagata"?TEAL:s==="da pagare"||s==="da emettere"||s==="da compilare"?AMBER:s==="in arrivo"?BLUE:"#9CA3AF";

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",fontFamily:"Inter,sans-serif",background:"#F8FAFC",paddingBottom:80}}>
      {/* HEADER AZIENDA */}
      <div style={{background:DARK,padding:"16px 20px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{width:40,height:40,borderRadius:10,background:TEAL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:"#fff",flexShrink:0}}>{cm.azienda.logo}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>{cm.azienda.nome}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.45)"}}>{cm.azienda.tel}</div>
          </div>
          <div style={{fontSize:10,fontWeight:700,color:TEAL,background:TEAL+"18",padding:"3px 8px",borderRadius:100}}>Portale Cliente</div>
        </div>

        {/* Progress commessa */}
        <div style={{background:"rgba(255,255,255,0.07)",borderRadius:12,padding:"14px 16px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{cm.fasi[Math.max(0,faseIdx-1)]?.l||"In corso"}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.4)"}}>{cm.code} · {cm.indirizzo.split(",")[1]?.trim()}</div>
            </div>
            <div style={{textAlign:"right" as any}}>
              <div style={{fontSize:22,fontWeight:800,color:TEAL}}>{cm.progress}%</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.4)"}}>completato</div>
            </div>
          </div>
          <div style={{height:4,background:"rgba(255,255,255,0.1)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${cm.progress}%`,background:TEAL,borderRadius:2}}/>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex"}}>
          {[["home","🏠 Stato"],["docs","📁 Documenti"],["chat","💬 Chat"],["pagamenti","💰 Pagamenti"]].map(([id,l])=>(
            <div key={id} onClick={()=>setTab(id as any)} style={{flex:1,padding:"10px 6px",textAlign:"center" as any,fontSize:11,fontWeight:tab===id?700:400,color:tab===id?"#fff":"rgba(255,255,255,0.35)",borderBottom:`2px solid ${tab===id?TEAL:"transparent"}`,cursor:"pointer"}}>{l}</div>
          ))}
        </div>
      </div>

      {/* HOME */}
      {tab==="home"&&<div style={{padding:"16px"}}>
        {/* Timeline fasi */}
        <div style={{fontSize:13,fontWeight:700,color:DARK,marginBottom:14}}>Stato del tuo lavoro</div>
        {cm.fasi.map((f,i)=>{
          const isCurr=i===faseIdx; const isPast=f.done;
          return (
            <div key={i} style={{display:"flex",gap:12,marginBottom:4}}>
              <div style={{display:"flex",flexDirection:"column" as any,alignItems:"center",width:20,flexShrink:0}}>
                <div style={{width:isCurr?20:12,height:isCurr?20:12,borderRadius:isCurr?6:6,background:isPast?TEAL:isCurr?TEAL:"#E5E3DC",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:isCurr?`0 0 0 3px ${TEAL}25`:"none",flexShrink:0}}>
                  {isPast&&<svg width="8" height="8" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>}
                  {isCurr&&!isPast&&<div style={{width:6,height:6,borderRadius:3,background:"#fff"}}/>}
                </div>
                {i<cm.fasi.length-1&&<div style={{width:2,flex:1,background:isPast?TEAL:"#E5E3DC",minHeight:16,marginTop:2}}/>}
              </div>
              <div style={{flex:1,paddingBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,fontWeight:isCurr?700:500,color:isPast||isCurr?DARK:"#9CA3AF"}}>{f.l}</span>
                  {f.data&&<span style={{fontSize:11,color:"#9CA3AF"}}>{f.data}</span>}
                  {isCurr&&<span style={{fontSize:9,fontWeight:700,color:TEAL,background:TEAL+"12",padding:"1px 6px",borderRadius:100}}>IN CORSO</span>}
                </div>
                {(isPast||isCurr)&&f.nota&&<div style={{fontSize:11,color:"#6B7280",marginTop:2,lineHeight:1.4}}>{f.nota}</div>}
              </div>
            </div>
          );
        })}

        {/* Vani */}
        <div style={{fontSize:13,fontWeight:700,color:DARK,margin:"20px 0 12px"}}>I tuoi serramenti ({cm.vani.length})</div>
        {cm.vani.map((v,i)=>(
          <div key={i} style={{background:"#fff",borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",border:"1px solid #E5E3DC"}}>
            <div>
              <div style={{fontSize:14,fontWeight:600,color:DARK}}>{v.nome}</div>
              <div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{v.tipo} · {v.mis} · {v.col}</div>
            </div>
            <div style={{textAlign:"right" as any}}>
              <div style={{fontSize:12,fontWeight:700,color:TEAL}}>Uw {v.uw}</div>
              <div style={{fontSize:10,color:"#9CA3AF"}}>W/m²K</div>
            </div>
          </div>
        ))}
      </div>}

      {/* DOCUMENTI */}
      {tab==="docs"&&<div style={{padding:"16px"}}>
        <div style={{fontSize:13,fontWeight:700,color:DARK,marginBottom:14}}>I tuoi documenti</div>
        {cm.docs.map((d,i)=>{
          const sc=statoColor(d.stato);
          return (
            <div key={i} style={{background:"#fff",borderRadius:12,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:12,border:"1px solid #E5E3DC"}}>
              <span style={{fontSize:24,flexShrink:0}}>{d.ico}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:DARK}}>{d.nome}</div>
                <div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{d.data}</div>
              </div>
              {d.stato&&<span style={{fontSize:10,fontWeight:700,color:sc,background:sc+"12",padding:"2px 8px",borderRadius:100,flexShrink:0}}>{d.stato}</span>}
            </div>
          );
        })}
      </div>}

      {/* CHAT */}
      {tab==="chat"&&(
        <div style={{display:"flex",flexDirection:"column" as any,minHeight:"calc(100vh - 200px)"}}>
          <div style={{flex:1,padding:"16px",display:"flex",flexDirection:"column" as any,gap:10,overflowY:"auto" as any}}>
            {chatMsgs.map((m:any,i:number)=>{
              const isCliente=m.dir==="cliente";
              return (
                <div key={i} style={{display:"flex",justifyContent:isCliente?"flex-end":"flex-start" as any}}>
                  <div style={{maxWidth:"82%",padding:"10px 14px",borderRadius:isCliente?"14px 14px 4px 14px":"14px 14px 14px 4px",background:isCliente?TEAL:"#fff",color:isCliente?"#fff":DARK,border:isCliente?"none":"1px solid #E5E3DC"}}>
                    {!isCliente&&<div style={{fontSize:11,fontWeight:700,color:TEAL,marginBottom:3}}>{m.da}</div>}
                    <div style={{fontSize:14,lineHeight:1.5}}>{m.txt}</div>
                    <div style={{fontSize:9,color:isCliente?"rgba(255,255,255,0.5)":"#9CA3AF",marginTop:3,textAlign:"right" as any}}>{m.t}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{background:"#fff",borderTop:"1px solid #E5E3DC",padding:"12px 16px",display:"flex",gap:8,flexShrink:0}}>
            <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")sendMsg();}} placeholder="Scrivi un messaggio..." style={{flex:1,padding:"10px 14px",border:"1px solid #E5E3DC",borderRadius:22,fontSize:14,outline:"none",fontFamily:"Inter,sans-serif"}}/>
            <button onClick={sendMsg} style={{width:40,height:40,borderRadius:20,background:TEAL,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* PAGAMENTI */}
      {tab==="pagamenti"&&<div style={{padding:"16px"}}>
        {/* Totale */}
        <div style={{background:"#fff",borderRadius:14,padding:"16px",marginBottom:14,border:"1px solid #E5E3DC"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12,textAlign:"center" as any}}>
            <div><div style={{fontSize:9,color:"#6B7280",textTransform:"uppercase" as any,letterSpacing:0.5}}>Totale</div><div style={{fontSize:18,fontWeight:800,color:DARK}}>{fmtE(cm.pagamenti.totale)}</div></div>
            <div><div style={{fontSize:9,color:"#6B7280",textTransform:"uppercase" as any,letterSpacing:0.5}}>Pagato</div><div style={{fontSize:18,fontWeight:800,color:TEAL}}>{fmtE(cm.pagamenti.pagato)}</div></div>
            <div><div style={{fontSize:9,color:"#6B7280",textTransform:"uppercase" as any,letterSpacing:0.5}}>Saldo</div><div style={{fontSize:18,fontWeight:800,color:AMBER}}>{fmtE(cm.pagamenti.saldo)}</div></div>
          </div>
          <div style={{height:6,background:"#F4F6F8",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.round(cm.pagamenti.pagato/cm.pagamenti.totale*100)}%`,background:TEAL,borderRadius:3}}/>
          </div>
          <div style={{fontSize:11,color:"#9CA3AF",textAlign:"right" as any,marginTop:4}}>{Math.round(cm.pagamenti.pagato/cm.pagamenti.totale*100)}% pagato</div>
        </div>
        {cm.pagamenti.rate.map((r,i)=>{
          const sc=r.stato==="pagata"?TEAL:AMBER;
          return (
            <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px 16px",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",border:`1px solid ${r.stato==="pagata"?"#E5E3DC":AMBER+"30"}`}}>
              <div><div style={{fontSize:14,fontWeight:600,color:DARK}}>{r.desc}</div><div style={{fontSize:11,color:"#6B7280",marginTop:2}}>{r.data}</div></div>
              <div style={{textAlign:"right" as any}}>
                <div style={{fontSize:16,fontWeight:800,color:DARK}}>{fmtE(r.importo)}</div>
                <span style={{fontSize:10,fontWeight:700,color:sc,background:sc+"12",padding:"2px 8px",borderRadius:100}}>{r.stato}</span>
              </div>
            </div>
          );
        })}
        <div style={{marginTop:16,background:`${TEAL}08`,borderRadius:12,padding:"12px 14px",border:`1px solid ${TEAL}20`,fontSize:12,color:"#6B7280",textAlign:"center" as any}}>
          Per informazioni sui pagamenti contatta direttamente {cm.azienda.nome}:<br/>
          <span style={{color:TEAL,fontWeight:600}}>{cm.azienda.tel}</span>
        </div>
      </div>}

      {/* BOTTOM NAV */}
      <div style={{position:"fixed" as any,bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"#fff",borderTop:"1px solid #E5E3DC",display:"flex",padding:"8px 0 20px",zIndex:100}}>
        {[["home","🏠","Stato"],["docs","📁","Documenti"],["chat","💬","Chat"],["pagamenti","💰","Pagamenti"]].map(([id,ico,l])=>(
          <div key={id} onClick={()=>setTab(id as any)} style={{flex:1,display:"flex",flexDirection:"column" as any,alignItems:"center",gap:2,cursor:"pointer"}}>
            <span style={{fontSize:20}}>{ico}</span>
            <span style={{fontSize:10,fontWeight:tab===id?600:400,color:tab===id?TEAL:"#9CA3AF"}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
