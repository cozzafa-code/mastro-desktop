"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — InterventoFlowPanel v1
// Flow cantiere: Programmato → In viaggio → Arrivato →
//   In corso → Completato → Collaudo → Chiuso (firma)
// ═══════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMastro } from "./MastroContext";
import { FM, ICO, I, Ico } from "./mastro-constants";

// ═══ CONFIGURAZIONE FASI ═══
const FASI = [
  { id:"programmato",  label:"Programmato", icon:"📋", color:"#3B7FE0", desc:"Montaggio schedulato" },
  { id:"in_viaggio",   label:"In viaggio",  icon:"🚐", color:"#8B5CF6", desc:"Squadra in partenza" },
  { id:"arrivato",     label:"Arrivato",    icon:"📍", color:"#D08008", desc:"Arrivati in cantiere" },
  { id:"in_corso",     label:"In corso",    icon:"🔧", color:"#E8A020", desc:"Lavori in corso" },
  { id:"completato",   label:"Completato",  icon:"✅", color:"#1A9E73", desc:"Lavoro finito" },
  { id:"collaudo",     label:"Collaudo",    icon:"🔍", color:"#0D7C6B", desc:"Verifica qualità" },
  { id:"chiuso",       label:"Chiuso",      icon:"🤝", color:"#1A9E73", desc:"Firma cliente" },
];
const FASE_IDX = (id:string) => FASI.findIndex(f=>f.id===id);

// ═══ CHECKLIST DEFAULT ═══
const CL_COMPLETAMENTO = [
  { id:"cl1", label:"Installazione completata secondo progetto" },
  { id:"cl2", label:"Guarnizioni inserite e sigillate" },
  { id:"cl3", label:"Apertura/chiusura verificata" },
  { id:"cl4", label:"Vetro integro e pulito" },
  { id:"cl5", label:"Controtelaio a piombo e livello" },
  { id:"cl6", label:"Schiuma poliuretanica applicata" },
  { id:"cl7", label:"Silicone interno ed esterno" },
  { id:"cl8", label:"Maniglie e ferramenta montate" },
  { id:"cl9", label:"Tapparella/Persiana funzionante (se presente)" },
  { id:"cl10",label:"Pulizia cantiere completata" },
];
const CL_COLLAUDO = [
  { id:"co1", label:"Tenuta all'aria verificata" },
  { id:"co2", label:"Tenuta all'acqua verificata" },
  { id:"co3", label:"Funzionamento completo meccanismi" },
  { id:"co4", label:"Aspetto estetico conforme" },
  { id:"co5", label:"Cliente soddisfatto" },
];

// ═══ TIPI PROBLEMA ═══
const TIPI_PROBLEMA = [
  "Misura errata","Prodotto danneggiato","Materiale mancante",
  "Difetto produzione","Problema posa","Altro"
];

export default function InterventoFlowPanel({ montaggio, onClose, onUpdate }) {
  const { T, S, cantieri, squadreDB } = useMastro();
  const m = montaggio;

  // Intervento data (estende il montaggio)
  const [intervento, setIntervento] = useState(() => ({
    stato: m.interventoStato || m.stato || "programmato",
    timeline: m.timeline || {},
    checkComp: m.checkComp || CL_COMPLETAMENTO.map(c=>({...c, checked:false, nota:""})),
    checkColl: m.checkColl || CL_COLLAUDO.map(c=>({...c, checked:false, nota:""})),
    problemi: m.problemi || [],
    firmaCliente: m.firmaCliente || null,
    firmaOperatore: m.firmaOperatore || null,
    noteCliente: m.noteCliente || "",
    fotoIntervento: m.fotoIntervento || [],
  }));

  // Problema form
  const [showProblema, setShowProblema] = useState(false);
  const [newProblema, setNewProblema] = useState({ tipo:"", desc:"", urgenza:"da_risolvere", foto:[] });

  // Firma
  const [showFirma, setShowFirma] = useState<"cliente"|"operatore"|null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const sq = squadreDB.find(s=>s.id===m.squadraId);
  const cm = cantieri.find(c=>c.id===m.cmId);
  const faseIdx = FASE_IDX(intervento.stato);
  const faseCorrente = FASI[faseIdx] || FASI[0];

  // ═══ SALVA ═══
  // Mappa fasi flow → stato base per retrocompatibilità
  const faseToStatoBase = (fase:string) => {
    if (fase === "programmato") return "programmato";
    if (["in_viaggio","arrivato","in_corso"].includes(fase)) return "in_corso";
    return "completato"; // completato, collaudo, chiuso
  };

  const salva = useCallback((upd) => {
    const next = { ...intervento, ...upd };
    setIntervento(next);
    onUpdate?.({ ...m, interventoStato: next.stato, stato: faseToStatoBase(next.stato), ...next });
  }, [intervento, m, onUpdate]);

  // ═══ AVANZA FASE ═══
  const avanzaFase = () => {
    if (faseIdx >= FASI.length - 1) return;
    const nextFase = FASI[faseIdx + 1].id;
    // Se sta chiudendo, verifica checklist + firme
    if (nextFase === "chiuso") {
      if (!intervento.firmaCliente) { alert("Serve la firma del cliente per chiudere l'intervento."); return; }
    }
    const now = new Date().toISOString();
    salva({ stato: nextFase, timeline: { ...intervento.timeline, [nextFase]: now } });
  };

  const tornaIndietro = () => {
    if (faseIdx <= 0) return;
    const prevFase = FASI[faseIdx - 1].id;
    salva({ stato: prevFase });
  };

  // ═══ FOTO ═══
  const scattaFoto = () => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*"; input.capture = "environment";
    input.onchange = (e:any) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const foto = { id: "f_"+Date.now(), fase: intervento.stato, dataUrl: reader.result, nota: "", ts: new Date().toISOString() };
        salva({ fotoIntervento: [...intervento.fotoIntervento, foto] });
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // ═══ FIRMA CANVAS ═══
  const startDraw = (e) => { isDrawing.current=true; const ctx=canvasRef.current?.getContext("2d"); if(!ctx)return; const r=canvasRef.current.getBoundingClientRect(); const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left; const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top; ctx.beginPath(); ctx.moveTo(x,y); };
  const draw = (e) => { if(!isDrawing.current)return; e.preventDefault(); const ctx=canvasRef.current?.getContext("2d"); if(!ctx)return; const r=canvasRef.current.getBoundingClientRect(); const x=(e.touches?e.touches[0].clientX:e.clientX)-r.left; const y=(e.touches?e.touches[0].clientY:e.clientY)-r.top; ctx.lineWidth=2; ctx.lineCap="round"; ctx.strokeStyle="#1A1A1C"; ctx.lineTo(x,y); ctx.stroke(); };
  const endDraw = () => { isDrawing.current=false; };
  const clearCanvas = () => { const ctx=canvasRef.current?.getContext("2d"); if(ctx) ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height); };
  const salvaFirma = () => {
    const data = canvasRef.current?.toDataURL("image/png");
    if (showFirma === "cliente") salva({ firmaCliente: data });
    else salva({ firmaOperatore: data });
    setShowFirma(null);
  };

  // ═══ PROBLEMI ═══
  const aggiungiProblema = () => {
    if (!newProblema.tipo || !newProblema.desc) return;
    const p = { id:"p_"+Date.now(), ...newProblema, stato:"aperto", ts:new Date().toISOString() };
    salva({ problemi: [...intervento.problemi, p] });
    setNewProblema({ tipo:"", desc:"", urgenza:"da_risolvere", foto:[] });
    setShowProblema(false);
  };

  // ═══ CHECKLIST TOGGLE ═══
  const toggleCheck = (tipo:"comp"|"coll", id:string) => {
    const key = tipo==="comp"?"checkComp":"checkColl";
    const list = intervento[key].map(c => c.id===id ? {...c, checked:!c.checked} : c);
    salva({ [key]: list });
  };

  const cS = { background: T.card, borderRadius: 12, border: "1px solid " + T.bdr };

  // ═══ RENDER ═══
  return (
    <div style={{ position:"fixed", inset:0, zIndex:1000, background:T.bg, overflowY:"auto" }}>
      {/* HEADER */}
      <div style={{ position:"sticky", top:0, zIndex:10, background:faseCorrente.color, padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
        <div onClick={onClose} style={{ cursor:"pointer", padding:4 }}><Ico d={ICO.back} s={22} c="#fff" /></div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:900, color:"#fff" }}>{m.cliente}</div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.8)" }}>{m.cmCode} · {sq?.nome||"—"} · {m.data ? new Date(m.data+'T12:00:00').toLocaleDateString('it-IT') : m.data}</div>
        </div>
        <div style={{ fontSize:28 }}>{faseCorrente.icon}</div>
      </div>

      {/* PROGRESS BAR */}
      <div style={{ display:"flex", padding:"12px 16px", gap:2 }}>
        {FASI.map((f,i) => (
          <div key={f.id} style={{ flex:1, height:4, borderRadius:2, background: i<=faseIdx ? faseCorrente.color : T.bdr+"40", transition:"background 0.3s" }} />
        ))}
      </div>
      <div style={{ textAlign:"center", fontSize:11, fontWeight:700, color:faseCorrente.color, marginBottom:12 }}>
        {faseCorrente.icon} {faseCorrente.label} — {faseCorrente.desc}
      </div>

      <div style={{ padding:"0 12px 120px" }}>

        {/* ═══ TIMELINE ═══ */}
        <div style={{ ...cS, padding:"12px 14px", marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:800, color:T.text, marginBottom:8 }}>Timeline intervento</div>
          {FASI.slice(0, faseIdx+1).map((f,i) => {
            const ts = intervento.timeline[f.id];
            const t = ts ? new Date(ts) : null;
            return (
              <div key={f.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"4px 0" }}>
                <div style={{ width:24, height:24, borderRadius:12, background:f.color+"15", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>{f.icon}</div>
                <div style={{ flex:1, fontSize:11, fontWeight:600, color:T.text }}>{f.label}</div>
                <div style={{ fontSize:10, color:T.sub, fontFamily:FM }}>{t ? t.toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"})+" · "+t.toLocaleDateString("it-IT",{day:"2-digit",month:"short"}) : "—"}</div>
              </div>
            );
          })}
        </div>

        {/* ═══ FOTO ═══ */}
        <div style={{ ...cS, padding:"12px 14px", marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:800, color:T.text }}>Foto cantiere ({intervento.fotoIntervento.length})</span>
            <div onClick={scattaFoto} style={{ padding:"4px 12px", borderRadius:6, background:T.acc+"12", border:"1px solid "+T.acc+"30", fontSize:10, fontWeight:700, color:T.acc, cursor:"pointer" }}>+ Foto</div>
          </div>
          {intervento.fotoIntervento.length > 0 && (
            <div style={{ display:"flex", gap:6, overflowX:"auto", paddingBottom:4 }}>
              {intervento.fotoIntervento.map(f => (
                <div key={f.id} style={{ flexShrink:0, position:"relative" }}>
                  <img src={f.dataUrl} style={{ width:64, height:64, borderRadius:8, objectFit:"cover" }} />
                  <div style={{ position:"absolute", bottom:2, left:2, fontSize:7, background:"rgba(0,0,0,0.6)", color:"#fff", padding:"1px 4px", borderRadius:3, fontWeight:600 }}>{FASI.find(x=>x.id===f.fase)?.icon||"📷"}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ═══ RIEPILOGO COMMESSA ═══ */}
        <div style={{ ...cS, padding:"12px 14px", marginBottom:10 }}>
          <div style={{ fontSize:11, fontWeight:800, color:T.text, marginBottom:6 }}>Dettagli commessa</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
            <div style={{ padding:"6px 10px", borderRadius:8, background:T.bg, border:"1px solid "+T.bdr, fontSize:10 }}>
              <span style={{ fontWeight:700, color:T.sub }}>Vani: </span><span style={{ fontWeight:800, color:T.text, fontFamily:FM }}>{m.vani || "—"}</span>
            </div>
            <div style={{ padding:"6px 10px", borderRadius:8, background:T.bg, border:"1px solid "+T.bdr, fontSize:10 }}>
              <span style={{ fontWeight:700, color:T.sub }}>Durata: </span><span style={{ fontWeight:800, color:T.text, fontFamily:FM }}>{m.durata || m.giorni+"g"}</span>
            </div>
            {cm?.indirizzo && (
              <div style={{ padding:"6px 10px", borderRadius:8, background:T.bg, border:"1px solid "+T.bdr, fontSize:10, flex:"1 1 100%" }}>
                <span style={{ fontWeight:700, color:T.sub }}>Indirizzo: </span><span style={{ fontWeight:600, color:T.text }}>{cm.indirizzo}</span>
              </div>
            )}
            {m.note && (
              <div style={{ padding:"6px 10px", borderRadius:8, background:T.bg, border:"1px solid "+T.bdr, fontSize:10, flex:"1 1 100%" }}>
                <span style={{ fontWeight:700, color:T.sub }}>Note: </span><span style={{ color:T.text }}>{m.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* ═══ CHECKLIST COMPLETAMENTO (fase: completato) ═══ */}
        {faseIdx >= 4 && (
          <div style={{ ...cS, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:800, color:T.text, marginBottom:8 }}>Checklist completamento</div>
            {intervento.checkComp.map(c => (
              <div key={c.id} onClick={()=>toggleCheck("comp",c.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", cursor:"pointer", borderBottom:"1px solid "+T.bdr+"20" }}>
                <div style={{ width:20, height:20, borderRadius:4, border:"2px solid "+(c.checked?"#1A9E73":T.bdr), background:c.checked?"#1A9E7315":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#1A9E73", flexShrink:0 }}>{c.checked?"✓":""}</div>
                <span style={{ fontSize:11, color:c.checked?T.text:T.sub, fontWeight:c.checked?600:400 }}>{c.label}</span>
              </div>
            ))}
            <div style={{ fontSize:9, color:T.sub, marginTop:6, textAlign:"center" }}>{intervento.checkComp.filter(c=>c.checked).length}/{intervento.checkComp.length} completati</div>
          </div>
        )}

        {/* ═══ CHECKLIST COLLAUDO (fase: collaudo) ═══ */}
        {faseIdx >= 5 && (
          <div style={{ ...cS, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:800, color:"#0D7C6B", marginBottom:8 }}>Checklist collaudo</div>
            {intervento.checkColl.map(c => (
              <div key={c.id} onClick={()=>toggleCheck("coll",c.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", cursor:"pointer", borderBottom:"1px solid "+T.bdr+"20" }}>
                <div style={{ width:20, height:20, borderRadius:4, border:"2px solid "+(c.checked?"#0D7C6B":T.bdr), background:c.checked?"#0D7C6B15":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#0D7C6B", flexShrink:0 }}>{c.checked?"✓":""}</div>
                <span style={{ fontSize:11, color:c.checked?T.text:T.sub, fontWeight:c.checked?600:400 }}>{c.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ═══ PROBLEMI ═══ */}
        <div style={{ ...cS, padding:"12px 14px", marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:11, fontWeight:800, color:T.text }}>Problemi ({intervento.problemi.length})</span>
            <div onClick={()=>setShowProblema(true)} style={{ padding:"4px 12px", borderRadius:6, background:"#DC444412", border:"1px solid #DC444430", fontSize:10, fontWeight:700, color:"#DC4444", cursor:"pointer" }}>+ Segnala</div>
          </div>
          {intervento.problemi.map(p => (
            <div key={p.id} style={{ padding:"8px 10px", borderRadius:8, marginBottom:4, background:p.urgenza==="bloccante"?"#DC444408":"#D0800808", borderLeft:"3px solid "+(p.urgenza==="bloccante"?"#DC4444":"#D08008") }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, fontWeight:700, color:T.text }}>{p.tipo}</span>
                <span style={{ fontSize:8, fontWeight:700, padding:"2px 6px", borderRadius:4, background:p.stato==="aperto"?"#DC444415":p.stato==="in_gestione"?"#D0800815":"#1A9E7315", color:p.stato==="aperto"?"#DC4444":p.stato==="in_gestione"?"#D08008":"#1A9E73" }}>{p.stato}</span>
              </div>
              <div style={{ fontSize:10, color:T.sub, marginTop:2 }}>{p.desc}</div>
            </div>
          ))}
        </div>

        {/* ═══ FIRME (fase: chiuso) ═══ */}
        {faseIdx >= 5 && (
          <div style={{ ...cS, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:800, color:T.text, marginBottom:8 }}>Firme</div>
            <div style={{ display:"flex", gap:8 }}>
              <div onClick={()=>setShowFirma("operatore")} style={{ flex:1, padding:"12px", borderRadius:8, textAlign:"center", cursor:"pointer", background:intervento.firmaOperatore?"#1A9E7308":T.bg, border:"1.5px solid "+(intervento.firmaOperatore?"#1A9E7340":T.bdr) }}>
                {intervento.firmaOperatore ? <img src={intervento.firmaOperatore} style={{height:40,maxWidth:"100%"}} /> : <div style={{fontSize:10,color:T.sub,fontWeight:600}}>Firma operatore</div>}
              </div>
              <div onClick={()=>setShowFirma("cliente")} style={{ flex:1, padding:"12px", borderRadius:8, textAlign:"center", cursor:"pointer", background:intervento.firmaCliente?"#1A9E7308":T.bg, border:"1.5px solid "+(intervento.firmaCliente?"#1A9E7340":T.bdr) }}>
                {intervento.firmaCliente ? <img src={intervento.firmaCliente} style={{height:40,maxWidth:"100%"}} /> : <div style={{fontSize:10,color:T.sub,fontWeight:600}}>Firma cliente</div>}
              </div>
            </div>
          </div>
        )}

        {/* ═══ NOTE CLIENTE ═══ */}
        {faseIdx >= 5 && (
          <div style={{ ...cS, padding:"12px 14px", marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:800, color:T.text, marginBottom:6 }}>Note / riserve cliente</div>
            <textarea value={intervento.noteCliente} onChange={e=>salva({noteCliente:e.target.value})} placeholder="Eventuali note o riserve del cliente..." style={{ width:"100%", minHeight:60, border:"1px solid "+T.bdr, borderRadius:8, padding:8, fontSize:11, fontFamily:"Inter", resize:"vertical", background:T.bg }} />
          </div>
        )}

        {/* ═══ GENERA PDF VERBALE ═══ */}
        {intervento.stato === "chiuso" && (
          <div onClick={() => {
            // Prepara dati per il PDF — in produzione, chiamata API
            const pdfData = { azienda: {}, montaggio: { ...m, squadra: sq?.nome || "—" }, intervento };
            const blob = new Blob([JSON.stringify(pdfData, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `verbale_${m.cmCode}_${m.cliente?.replace(/\s/g,"_")}.json`; a.click();
            URL.revokeObjectURL(url);
          }} style={{ ...cS, padding:"14px", marginBottom:10, textAlign:"center", cursor:"pointer", background:"linear-gradient(135deg, #1A9E73, #0D7C6B)", borderRadius:12, border:"none" }}>
            <div style={{ fontSize:14, fontWeight:900, color:"#fff" }}>Genera verbale PDF</div>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.8)", marginTop:2 }}>Scarica il verbale di consegna con timeline, checklist e firme</div>
          </div>
        )}
      </div>

      {/* ═══ BOTTOM ACTION BAR ═══ */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:10, background:T.card, borderTop:"1px solid "+T.bdr, padding:"12px 16px 28px", display:"flex", gap:8 }}>
        {faseIdx > 0 && faseIdx < FASI.length - 1 && (
          <div onClick={tornaIndietro} style={{ width:52, height:52, borderRadius:12, background:T.bg, border:"1px solid "+T.bdr, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:11, fontWeight:700, color:T.sub }}>
            <Ico d={ICO.back} s={20} c={T.sub} />
          </div>
        )}
        {faseIdx < FASI.length - 1 ? (
          <div onClick={avanzaFase} style={{ flex:1, padding:"14px", borderRadius:12, textAlign:"center", cursor:"pointer", background:FASI[faseIdx+1].color, color:"#fff", fontSize:14, fontWeight:900, boxShadow:"0 4px 16px "+FASI[faseIdx+1].color+"40" }}>
            {FASI[faseIdx+1].icon} {FASI[faseIdx+1].label} →
          </div>
        ) : (
          <div style={{ flex:1, padding:"14px", borderRadius:12, textAlign:"center", background:"#1A9E73", color:"#fff", fontSize:14, fontWeight:900 }}>
            ✅ Intervento chiuso
          </div>
        )}
        <div onClick={scattaFoto} style={{ width:52, height:52, borderRadius:12, background:T.bg, border:"1px solid "+T.bdr, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:20 }}>📷</div>
      </div>

      {/* ═══ MODAL PROBLEMA ═══ */}
      {showProblema && (
        <div style={{ position:"fixed", inset:0, zIndex:1100, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"flex-end" }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"100%", maxWidth:480, margin:"0 auto", background:T.card, borderRadius:"16px 16px 0 0", padding:"16px 20px 28px" }}>
            <div style={{ width:36, height:4, borderRadius:2, background:T.bdr, margin:"0 auto 12px" }} />
            <div style={{ fontSize:15, fontWeight:900, color:"#DC4444", marginBottom:12 }}>Segnala problema</div>
            <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:4 }}>Tipo problema</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:10 }}>
              {TIPI_PROBLEMA.map(t=>(
                <div key={t} onClick={()=>setNewProblema(p=>({...p,tipo:t}))} style={{ padding:"5px 10px", borderRadius:8, fontSize:10, fontWeight:600, cursor:"pointer", background:newProblema.tipo===t?"#DC444412":T.bg, color:newProblema.tipo===t?"#DC4444":T.sub, border:"1px solid "+(newProblema.tipo===t?"#DC444440":T.bdr) }}>{t}</div>
              ))}
            </div>
            <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:4 }}>Descrizione</div>
            <textarea value={newProblema.desc} onChange={e=>setNewProblema(p=>({...p,desc:e.target.value}))} placeholder="Descrivi il problema..." style={{ width:"100%", minHeight:60, border:"1px solid "+T.bdr, borderRadius:8, padding:8, fontSize:11, fontFamily:"Inter", marginBottom:10 }} />
            <div style={{ fontSize:10, fontWeight:700, color:T.sub, marginBottom:4 }}>Urgenza</div>
            <div style={{ display:"flex", gap:4, marginBottom:14 }}>
              {[{id:"bloccante",l:"Bloccante",c:"#DC4444"},{id:"da_risolvere",l:"Da risolvere",c:"#D08008"},{id:"estetico",l:"Estetico",c:"#3B7FE0"}].map(u=>(
                <div key={u.id} onClick={()=>setNewProblema(p=>({...p,urgenza:u.id}))} style={{ flex:1, padding:"8px", borderRadius:8, textAlign:"center", fontSize:10, fontWeight:700, cursor:"pointer", background:newProblema.urgenza===u.id?u.c+"12":T.bg, color:newProblema.urgenza===u.id?u.c:T.sub, border:"1.5px solid "+(newProblema.urgenza===u.id?u.c+"40":T.bdr) }}>{u.l}</div>
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div onClick={()=>setShowProblema(false)} style={{ flex:1, padding:"12px", borderRadius:10, textAlign:"center", cursor:"pointer", background:T.bg, border:"1px solid "+T.bdr, fontSize:12, fontWeight:700, color:T.sub }}>Annulla</div>
              <div onClick={aggiungiProblema} style={{ flex:1, padding:"12px", borderRadius:10, textAlign:"center", cursor:"pointer", background:"#DC4444", color:"#fff", fontSize:12, fontWeight:900 }}>Segnala</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL FIRMA ═══ */}
      {showFirma && (
        <div style={{ position:"fixed", inset:0, zIndex:1100, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div onClick={e=>e.stopPropagation()} style={{ width:"90%", maxWidth:420, background:T.card, borderRadius:16, padding:"20px", textAlign:"center" }}>
            <div style={{ fontSize:15, fontWeight:900, color:T.text, marginBottom:4 }}>Firma {showFirma==="cliente"?"cliente":"operatore"}</div>
            <div style={{ fontSize:10, color:T.sub, marginBottom:12 }}>Disegna la firma qui sotto</div>
            <canvas ref={canvasRef} width={380} height={160}
              style={{ border:"2px solid "+T.bdr, borderRadius:10, background:"#FAFAF8", touchAction:"none", width:"100%", cursor:"crosshair" }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
            />
            <div style={{ display:"flex", gap:8, marginTop:12 }}>
              <div onClick={clearCanvas} style={{ flex:1, padding:"10px", borderRadius:8, background:T.bg, border:"1px solid "+T.bdr, fontSize:11, fontWeight:700, color:T.sub, cursor:"pointer" }}>Cancella</div>
              <div onClick={()=>setShowFirma(null)} style={{ flex:1, padding:"10px", borderRadius:8, background:T.bg, border:"1px solid "+T.bdr, fontSize:11, fontWeight:700, color:T.sub, cursor:"pointer" }}>Annulla</div>
              <div onClick={salvaFirma} style={{ flex:1, padding:"10px", borderRadius:8, background:"#1A9E73", color:"#fff", fontSize:11, fontWeight:900, cursor:"pointer" }}>Salva</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
