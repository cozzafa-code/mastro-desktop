"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — MontaggiCalendar v4 — REDESIGN
// Priorità: OGGI → Stats → Filtri → Calendario → Prossimi
// ═══════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef } from "react";
import { useMastro } from "./MastroContext";
import { FM, ICO, I } from "./mastro-constants";
import InterventoFlowPanel from "./InterventoFlowPanel";

const DN = ["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
const MN = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const STATO = {
  programmato: { bg:"#3B7FE015", bd:"#3B7FE0", tx:"#3B7FE0", l:"Programmato" },
  in_viaggio:  { bg:"#8B5CF615", bd:"#8B5CF6", tx:"#8B5CF6", l:"In viaggio" },
  arrivato:    { bg:"#D0800815", bd:"#D08008", tx:"#D08008", l:"Arrivato" },
  in_corso:    { bg:"#E8A02018", bd:"#E8A020", tx:"#D08008", l:"In corso" },
  completato:  { bg:"#1A9E7315", bd:"#1A9E73", tx:"#1A9E73", l:"Completato" },
  collaudo:    { bg:"#0D7C6B15", bd:"#0D7C6B", tx:"#0D7C6B", l:"Collaudo" },
  chiuso:      { bg:"#1A9E7320", bd:"#1A9E73", tx:"#1A9E73", l:"Chiuso" },
  annullato:   { bg:"#DC444415", bd:"#DC4444", tx:"#DC4444", l:"Annullato" },
};
const fmt = d => d.toISOString().split("T")[0];

export default function MontaggiCalendar() {
  const {
    T, S, cantieri, montaggiDB, setMontaggiDB, squadreDB, setSelectedCM, setTab,
  } = useMastro();

  const [view, setView] = useState("week");
  const [curDate, setCurDate] = useState(() => new Date());
  const [filterSquadra, setFilterSquadra] = useState("tutte");
  const [filterTipo, setFilterTipo] = useState("tutti");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [interventoOpen, setInterventoOpen] = useState(null); // montaggio in flow
  const [dragId, setDragId] = useState(null);
  const [dragSquad, setDragSquad] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const longPressTimer = useRef(null);
  const [touchDrag, setTouchDrag] = useState(null);
  const [touchPos, setTouchPos] = useState(null);
  const [touchLabel, setTouchLabel] = useState("");

  const todayISO = fmt(new Date());
  const year = curDate.getFullYear();
  const month = curDate.getMonth();

  // ═══ DATI ═══
  const riparazioni = useMemo(() =>
    cantieri.filter(c => c.tipo === "riparazione" && c.fase !== "chiusura").map(c => {
      let data = c.dataRichiesta || "";
      if (!data && c.creato) {
        const p = c.creato.match(/(\d+)\s+(\w+)/);
        if (p) {
          const ms = {gen:0,feb:1,mar:2,apr:3,mag:4,giu:5,lug:6,ago:7,set:8,ott:9,nov:10,dic:11};
          data = `${new Date().getFullYear()}-${String((ms[p[2].toLowerCase()]??0)+1).padStart(2,"0")}-${p[1].padStart(2,"0")}`;
        }
      }
      return { id:"rip_"+c.id, tipo:"riparazione", cmId:c.id, data, cliente:c.cliente, indirizzo:c.indirizzo||"",
        urgenza:c.urgenza||"media", problema:c.problema||c.note||"", code:c.code, tipoProblema:c.tipoProblema||"",
        stato: c.fase==="chiusura"?"completato":c.fase==="sopralluogo"?"programmato":"in_corso",
        orario: c.orario || "" };
    }), [cantieri]);

  const allEvents = useMemo(() => {
    let m = (montaggiDB||[]).map(x => ({...x, tipo:"montaggio", stato:x.interventoStato||x.stato||"programmato", squadra:squadreDB.find(s=>s.id===x.squadraId)}));
    let all = [...m, ...riparazioni];
    if (filterSquadra !== "tutte") all = all.filter(e => e.tipo==="riparazione" || e.squadraId===filterSquadra);
    if (filterTipo !== "tutti") all = all.filter(e => e.tipo===filterTipo);
    return all;
  }, [montaggiDB, riparazioni, squadreDB, filterSquadra, filterTipo]);

  const byDate = useMemo(() => {
    const map = {};
    allEvents.forEach(e => {
      if (!e.data) return;
      const g = e.giorni || 1;
      let added = 0;
      for (let d = 0; added < Math.ceil(g) && d < 30; d++) {
        const dt = new Date(e.data+"T12:00:00"); dt.setDate(dt.getDate()+d);
        if (dt.getDay()===0||dt.getDay()===6) continue;
        const iso = fmt(dt);
        if (!map[iso]) map[iso] = [];
        map[iso].push({...e, _day:added+1, _tot:Math.ceil(g)});
        added++;
      }
    });
    return map;
  }, [allEvents]);

  const nav = dir => {
    const d = new Date(curDate);
    if (view==="day") d.setDate(d.getDate()+dir);
    else if (view==="week") d.setDate(d.getDate()+dir*7);
    else d.setMonth(d.getMonth()+dir);
    setCurDate(d);
  };
  const goToday = () => { setCurDate(new Date()); if (view !== "day") setView("day"); };

  const getWeekDays = (base) => {
    const d = new Date(base);
    d.setDate(d.getDate() - ((d.getDay()+6)%7));
    return Array.from({length:7}, (_,i) => { const x=new Date(d); x.setDate(x.getDate()+i); return {date:x, iso:fmt(x)}; });
  };
  const weekDays = getWeekDays(curDate);

  const getMonthDays = () => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month+1, 0);
    const off = (first.getDay()+6)%7;
    const days = [];
    for (let i=off-1;i>=0;i--) { const d=new Date(year,month,-i); days.push({date:d,iso:fmt(d),inMonth:false}); }
    for (let i=1;i<=last.getDate();i++) { const d=new Date(year,month,i); days.push({date:d,iso:fmt(d),inMonth:true}); }
    while (days.length<42) { const d=new Date(year,month+1,days.length-off-last.getDate()+1); days.push({date:d,iso:fmt(d),inMonth:false}); }
    return days;
  };
  const monthDays = getMonthDays();

  const mp = `${year}-${String(month+1).padStart(2,"0")}`;
  const mEvts = allEvents.filter(e => e.data?.startsWith(mp));
  const stats = { m: mEvts.filter(e=>e.tipo==="montaggio").length, r: mEvts.filter(e=>e.tipo==="riparazione").length,
    prog: mEvts.filter(e=>["programmato"].includes(e.stato)).length, corso: mEvts.filter(e=>["in_viaggio","arrivato","in_corso"].includes(e.stato)).length, done: mEvts.filter(e=>["completato","collaudo","chiuso"].includes(e.stato)).length };

  // ═══ OGGI: chi è in cantiere ═══
  const todayAll = useMemo(() => {
    const allM = (montaggiDB||[]).map(x => ({...x, tipo:"montaggio", stato:x.interventoStato||x.stato||"programmato", squadra:squadreDB.find(s=>s.id===x.squadraId)}));
    const combined = [...allM, ...riparazioni];
    const result = [];
    combined.forEach(e => {
      if (!e.data) return;
      const g = e.giorni || 1;
      let added = 0;
      for (let d = 0; added < Math.ceil(g) && d < 30; d++) {
        const dt = new Date(e.data+"T12:00:00"); dt.setDate(dt.getDate()+d);
        if (dt.getDay()===0||dt.getDay()===6) continue;
        if (fmt(dt) === todayISO) result.push({...e, _day:added+1, _tot:Math.ceil(g)});
        added++;
      }
    });
    return result.sort((a,b) => (a.orario||"08:00").localeCompare(b.orario||"08:00"));
  }, [montaggiDB, riparazioni, squadreDB, todayISO]);

  // ═══ DRAG ═══
  const onDragStart = (e, item) => { setDragId(item.id); setDragSquad(item.squadraId||null); e.dataTransfer.effectAllowed="move"; e.dataTransfer.setData("text/plain",item.id); };
  const onDragOver = (e, iso) => { e.preventDefault(); setDropTarget(iso); };
  const onDragLeave = () => setDropTarget(null);
  const onDrop = (e, targetISO) => {
    e.preventDefault();
    if (dragId && targetISO) { const orig = allEvents.find(ev=>ev.id===dragId); if (orig&&orig.tipo==="montaggio"&&orig.data!==targetISO) setMontaggiDB(prev=>prev.map(m=>m.id===dragId?{...m,data:targetISO}:m)); }
    setDragId(null); setDropTarget(null); setDragSquad(null);
  };
  const onTouchStartItem = (e, item) => {
    const t = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      setTouchDrag({id:item.id,squadraId:item.squadraId,originISO:item.data,tipo:item.tipo});
      setTouchLabel((item.cliente||"").split(" ")[0]);
      setTouchPos({x:t.clientX,y:t.clientY});
      if (navigator.vibrate) navigator.vibrate(30);
    }, 400);
  };
  const onTouchMoveGlobal = (e) => {
    if (!touchDrag) { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current=null; } return; }
    e.preventDefault(); const t=e.touches[0]; setTouchPos({x:t.clientX,y:t.clientY});
    const el=document.elementFromPoint(t.clientX,t.clientY); if (el) { const dayEl=el.closest("[data-dropiso]"); if (dayEl) setDropTarget(dayEl.getAttribute("data-dropiso")); }
  };
  const onTouchEndGlobal = () => {
    clearTimeout(longPressTimer.current); longPressTimer.current=null;
    if (touchDrag&&dropTarget&&touchDrag.tipo==="montaggio"&&touchDrag.originISO!==dropTarget) setMontaggiDB(prev=>prev.map(m=>m.id===touchDrag.id?{...m,data:dropTarget}:m));
    setTouchDrag(null); setTouchPos(null); setDropTarget(null); setTouchLabel("");
  };

  const cS = { background: T.card, borderRadius: 10, border: "1px solid " + T.bdr };
  const squads = squadreDB.length > 0 ? squadreDB : [{ id:"default", nome:"Squadra", colore:"#3B7FE0" }];

  // ═══ EVENT CHIP ═══
  const EventChip = ({ ev, compact }) => {
    const isM = ev.tipo==="montaggio"; const sqC = ev.squadra?.colore||(isM?"#3B7FE0":"#ff9500");
    const col = isM?sqC:(ev.urgenza==="urgente"?"#DC4444":"#ff9500"); const sc = STATO[ev.stato]||STATO.programmato;
    return (
      <div draggable={isM} onDragStart={isM?(e)=>onDragStart(e,ev):undefined} onTouchStart={isM?(e)=>onTouchStartItem(e,ev):undefined}
        onClick={(e)=>{e.stopPropagation();setSelectedEvent(selectedEvent?.id===ev.id?null:ev);}}
        style={{ padding:compact?"2px 4px":"3px 5px", borderRadius:4, marginBottom:1, cursor:isM?"grab":"pointer",
          background:dragId===ev.id?col+"30":sc.bg, borderLeft:"3px solid "+col,
          fontSize:compact?7:9, fontWeight:700, color:sc.tx, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          opacity:dragId===ev.id?0.5:1, transition:"opacity 0.15s", touchAction:"none",
        }}>
        {compact?(ev.cliente||"").split(" ")[0]:(<>{isM?"🔧":"🛠"} {(ev.cliente||"").split(" ")[0]}{ev._tot>1?` ${ev._day}/${ev._tot}`:""}</>)}
      </div>
    );
  };

  // ═══ DETAIL POPUP ═══
  const DetailPopup = () => {
    if (!selectedEvent) return null;
    const ev=selectedEvent; const isM=ev.tipo==="montaggio"; const sqC=ev.squadra?.colore||"#3B7FE0";
    const sc=STATO[ev.stato]||STATO.programmato; const cm=cantieri.find(c=>c.id===ev.cmId);
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:999,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>setSelectedEvent(null)}>
        <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:480,background:T.card,borderRadius:"16px 16px 0 0",padding:"16px 20px 28px",maxHeight:"70vh",overflowY:"auto"}}>
          <div style={{width:36,height:4,borderRadius:2,background:T.bdr,margin:"0 auto 12px"}} />
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{width:44,height:44,borderRadius:10,flexShrink:0,background:isM?sqC+"12":(ev.urgenza==="urgente"?"#DC444412":"#ff950012"),display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{isM?"🔧":"🛠"}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:17,fontWeight:900,color:T.text}}>{ev.cliente}</div>
              <div style={{fontSize:11,color:T.sub,marginTop:1}}>{ev.code||ev.cmCode||""}{ev.indirizzo?" · "+ev.indirizzo:""}</div>
            </div>
            <div style={{padding:"4px 10px",borderRadius:8,fontSize:10,fontWeight:800,background:isM?sc.bg:(ev.urgenza==="urgente"?"#DC444412":"#ff950012"),color:isM?sc.tx:(ev.urgenza==="urgente"?"#DC4444":"#ff9500"),border:"1px solid "+(isM?sc.bd+"30":(ev.urgenza==="urgente"?"#DC444430":"#ff950030"))}}>{isM?sc.l:(ev.urgenza==="urgente"?"⚠ Urgente":ev.urgenza==="media"?"Media":"Normale")}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            <div style={{padding:"8px 10px",borderRadius:8,background:T.bg,border:"1px solid "+T.bdr}}><div style={{fontSize:8,fontWeight:700,color:T.sub,textTransform:"uppercase",marginBottom:2}}>Data</div><div style={{fontSize:12,fontWeight:800,color:T.text}}>{ev.data?new Date(ev.data+"T12:00:00").toLocaleDateString("it-IT",{day:"numeric",month:"short"}):"—"}</div></div>
            <div style={{padding:"8px 10px",borderRadius:8,background:T.bg,border:"1px solid "+T.bdr}}><div style={{fontSize:8,fontWeight:700,color:T.sub,textTransform:"uppercase",marginBottom:2}}>Orario</div><div style={{fontSize:12,fontWeight:800,color:T.text}}>{ev.orario||"08:00"}</div></div>
            {isM?(<div style={{padding:"8px 10px",borderRadius:8,background:T.bg,border:"1px solid "+T.bdr}}><div style={{fontSize:8,fontWeight:700,color:T.sub,textTransform:"uppercase",marginBottom:2}}>Durata</div><div style={{fontSize:12,fontWeight:800,color:T.text}}>{ev.giorni||1}g</div></div>):(<div style={{padding:"8px 10px",borderRadius:8,background:T.bg,border:"1px solid "+T.bdr}}><div style={{fontSize:8,fontWeight:700,color:T.sub,textTransform:"uppercase",marginBottom:2}}>Tipo</div><div style={{fontSize:11,fontWeight:800,color:T.text}}>{ev.tipoProblema||"Ripar."}</div></div>)}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {isM&&ev.squadra&&(<div style={{flex:1,padding:"8px 10px",borderRadius:8,background:sqC+"08",border:"1px solid "+sqC+"20"}}><div style={{fontSize:8,fontWeight:700,color:sqC,textTransform:"uppercase",marginBottom:2}}>Squadra</div><div style={{fontSize:12,fontWeight:800,color:sqC,display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:4,background:sqC}} />{ev.squadra.nome}</div></div>)}
            {cm&&(<div style={{flex:1,padding:"8px 10px",borderRadius:8,background:T.acc+"08",border:"1px solid "+T.acc+"20"}}><div style={{fontSize:8,fontWeight:700,color:T.acc,textTransform:"uppercase",marginBottom:2}}>Commessa</div><div style={{fontSize:12,fontWeight:800,color:T.acc}}>{cm.code} · Fase: {cm.fase}</div></div>)}
          </div>
          {!isM&&ev.problema&&(<div style={{padding:"8px 12px",borderRadius:8,background:"#ff950006",border:"1px solid #ff950020",marginBottom:14}}><div style={{fontSize:8,fontWeight:700,color:"#ff9500",textTransform:"uppercase",marginBottom:3}}>Problema</div><div style={{fontSize:12,color:T.text}}>{ev.problema}</div></div>)}
          {isM&&(<div style={{marginBottom:14}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase"}}>Stato intervento</div><div style={{display:"flex",gap:2}}>{["programmato","in_viaggio","arrivato","in_corso","completato","collaudo","chiuso"].map((key,i)=>{const val=STATO[key]; const fasi=["programmato","in_viaggio","arrivato","in_corso","completato","collaudo","chiuso"]; const curIdx=fasi.indexOf(ev.stato); const isActive=i<=curIdx; return(<div key={key} style={{flex:1,padding:"6px 2px",borderRadius:6,textAlign:"center",background:isActive?val.bg:T.bg,border:"1px solid "+(isActive?val.bd+"40":T.bdr+"40"),fontSize:7,fontWeight:800,color:isActive?val.tx:T.sub+"80",overflow:"hidden",whiteSpace:"nowrap"}}>{i<=curIdx&&ev.stato===key?"● ":""}{val.l}</div>);})}</div></div>)}
          <div style={{display:"flex",gap:8}}>
            {isM && (
              <div onClick={()=>{setInterventoOpen(ev);setSelectedEvent(null);}} style={{
                flex:1, padding:"12px", borderRadius:10, textAlign:"center", cursor:"pointer",
                background:"linear-gradient(135deg, #1A9E73, #0D7C6B)", color:"#fff",
                fontSize:12, fontWeight:800, boxShadow:"0 3px 12px rgba(26,158,115,0.3)",
              }}>
                {ev.interventoStato && ev.interventoStato !== "programmato" ? "🔧 Gestisci intervento" : "🚐 Avvia intervento"}
              </div>
            )}
            <div onClick={()=>{const c=cantieri.find(c=>c.id===ev.cmId);if(c){setSelectedCM(c);setTab("commesse");}setSelectedEvent(null);}} style={{flex:isM?0:1,padding:"12px",borderRadius:10,textAlign:"center",cursor:"pointer",background:isM?T.acc+"10":"#ff950010",border:"1px solid "+(isM?T.acc+"25":"#ff950025"),fontSize:12,fontWeight:800,color:isM?T.acc:"#ff9500",minWidth:isM?120:undefined}}>
              Commessa →
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══ RENDER ═══
  return (
    <div style={{ paddingBottom: 90 }} onTouchMove={touchDrag?onTouchMoveGlobal:undefined} onTouchEnd={touchDrag?onTouchEndGlobal:undefined}>
      {touchDrag&&touchPos&&(<div style={{position:"fixed",left:touchPos.x-40,top:touchPos.y-20,zIndex:1000,padding:"6px 12px",borderRadius:8,background:T.acc,color:"#fff",fontSize:11,fontWeight:800,pointerEvents:"none",boxShadow:"0 4px 20px rgba(0,0,0,0.3)"}}>🔧 {touchLabel}</div>)}

      {/* ═══ HEADER ═══ */}
      <div style={{ padding:"14px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div>
          <div style={{ fontSize:20, fontWeight:900, color:T.text, letterSpacing:"-0.03em" }}>Cantieri</div>
          <div style={{ fontSize:10, color:T.sub, marginTop:1 }}>{stats.m} montaggi · {stats.r} riparazioni · {MN[month]}</div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <div onClick={goToday} style={{ padding:"5px 10px", borderRadius:6, background:T.grn+"10", border:"1px solid "+T.grn+"30", fontSize:10, fontWeight:700, color:T.grn, cursor:"pointer" }}>Oggi</div>
          <div onClick={() => setTab("home")} style={{ padding:"5px 10px", borderRadius:6, background:T.bg, border:"1px solid "+T.bdr, fontSize:10, fontWeight:700, color:T.sub, cursor:"pointer" }}>✕</div>
        </div>
      </div>

      {/* ═══ 1. OGGI — CHI È IN CANTIERE ═══ */}
      <div style={{ margin:"14px 12px 0" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 4px", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:4, background:T.grn, animation:"todayPulse 2s infinite" }} />
            <span style={{ fontSize:13, fontWeight:900, color:T.text }}>Oggi in cantiere</span>
          </div>
          <span style={{ fontSize:11, fontWeight:700, color:T.sub, fontFamily:FM }}>{todayAll.length}</span>
        </div>
        {todayAll.length === 0 ? (
          <div style={{ padding:"20px 16px", textAlign:"center", ...cS }}>
            <div style={{ fontSize:13, fontWeight:700, color:T.sub }}>Nessun impegno oggi</div>
            <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>Giornata libera</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {todayAll.map((ev, i) => {
              const isM=ev.tipo==="montaggio"; const sqC=ev.squadra?.colore||"#3B7FE0";
              const col=isM?sqC:(ev.urgenza==="urgente"?"#DC4444":"#ff9500");
              const sc=STATO[ev.stato]||STATO.programmato;
              return (
                <div key={ev.id+"_today_"+i} onClick={()=>setSelectedEvent(ev)} style={{
                  ...cS, cursor:"pointer", borderLeft:"4px solid "+col, padding:"14px 16px",
                  display:"flex", alignItems:"center", gap:14,
                }}>
                  <div style={{ flexShrink:0, textAlign:"center", minWidth:44 }}>
                    <div style={{ fontSize:18, fontWeight:900, color:T.text, fontFamily:FM, lineHeight:1 }}>
                      {(ev.orario||"08:00").split(":")[0]}<span style={{fontSize:12}}>:{(ev.orario||"08:00").split(":")[1]||"00"}</span>
                    </div>
                  </div>
                  <div style={{ width:1, height:36, background:T.bdr+"80" }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:T.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.cliente}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:3, flexWrap:"wrap" }}>
                      {isM&&ev.squadra&&(<span style={{display:"inline-flex",alignItems:"center",gap:3,fontSize:10,fontWeight:700,color:sqC}}><span style={{width:6,height:6,borderRadius:3,background:sqC,display:"inline-block"}} />{ev.squadra.nome}</span>)}
                      {ev.indirizzo&&<span style={{fontSize:10,color:T.sub}}>{ev.indirizzo}</span>}
                      {!isM&&<span style={{fontSize:10,fontWeight:700,color:ev.urgenza==="urgente"?"#DC4444":"#ff9500"}}>{ev.urgenza==="urgente"?"⚠ Urgente":"Riparazione"}</span>}
                    </div>
                  </div>
                  <div style={{padding:"4px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:sc.bg,color:sc.tx,border:"1px solid "+sc.bd+"30",flexShrink:0}}>{sc.l}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes todayPulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

      {/* ═══ 2. CONTATORI COMPATTI ═══ */}
      <div style={{ display:"flex", gap:4, padding:"14px 12px 0" }}>
        {[{n:stats.prog,l:"Programmati",c:"#3B7FE0"},{n:stats.corso,l:"In corso",c:"#D08008"},{n:stats.done,l:"Completati",c:"#1A9E73"}].map((s,i) => (
          <div key={i} style={{ flex:1, padding:"8px 6px", borderRadius:8, background:s.c+"06", border:"1px solid "+s.c+"15",
            display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
            <span style={{ fontSize:16, fontWeight:900, color:s.c, fontFamily:FM }}>{s.n}</span>
            <span style={{ fontSize:8, fontWeight:700, color:s.c, lineHeight:1.1 }}>{s.l}</span>
          </div>
        ))}
      </div>

      {/* ═══ 3. FILTRI UNIFICATI ═══ */}
      <div style={{ padding:"10px 12px 0", display:"flex", gap:4, overflowX:"auto", WebkitOverflowScrolling:"touch" }}>
        {["tutti","montaggio","riparazione"].map(t => (
          <div key={t} onClick={()=>setFilterTipo(t===filterTipo?"tutti":t)} style={{
            padding:"5px 12px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
            background:filterTipo===t?(t==="montaggio"?"#3B7FE012":t==="riparazione"?"#ff950012":T.text+"08"):T.bg,
            color:filterTipo===t?(t==="montaggio"?"#3B7FE0":t==="riparazione"?"#ff9500":T.text):T.sub,
            border:"1px solid "+(filterTipo===t?(t==="montaggio"?"#3B7FE035":t==="riparazione"?"#ff950035":T.text+"18"):T.bdr),
          }}>{t==="tutti"?"Tutti":t==="montaggio"?"🔧 Montaggi":"🛠 Riparazioni"}</div>
        ))}
        {squadreDB.length>1&&<div style={{width:1,background:T.bdr,margin:"2px 2px"}} />}
        {squadreDB.map(sq => (
          <div key={sq.id} onClick={()=>setFilterSquadra(filterSquadra===sq.id?"tutte":sq.id)} style={{
            padding:"5px 12px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap",
            background:filterSquadra===sq.id?(sq.colore||"#007aff")+"12":T.bg,
            color:filterSquadra===sq.id?(sq.colore||"#007aff"):T.sub,
            border:"1px solid "+(filterSquadra===sq.id?(sq.colore||"#007aff")+"35":T.bdr),
          }}><span style={{display:"inline-block",width:6,height:6,borderRadius:3,background:sq.colore||"#007aff",marginRight:4}} />{sq.nome}</div>
        ))}
      </div>

      {/* ═══ 4. VIEW TOGGLE ═══ */}
      <div style={{ display:"flex", gap:0, margin:"10px 12px 8px", borderRadius:8, overflow:"hidden", border:"1px solid "+T.bdr }}>
        {[{id:"day",l:"Giorno"},{id:"week",l:"Settimana"},{id:"month",l:"Mese"}].map(v => (
          <div key={v.id} onClick={()=>setView(v.id)} style={{
            flex:1, padding:"7px 0", textAlign:"center", fontSize:11, fontWeight:700, cursor:"pointer",
            background:view===v.id?T.acc:T.card, color:view===v.id?"#fff":T.sub,
          }}>{v.l}</div>
        ))}
      </div>

      {/* NAV */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"2px 20px 6px" }}>
        <div onClick={()=>nav(-1)} style={{cursor:"pointer",padding:"4px 10px",fontSize:18,fontWeight:800,color:T.acc}}>‹</div>
        <div style={{ fontSize:15, fontWeight:900, color:T.text }}>
          {view==="day"?curDate.toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})
           :view==="week"?`${weekDays[0].date.toLocaleDateString("it-IT",{day:"numeric",month:"short"})} — ${weekDays[6].date.toLocaleDateString("it-IT",{day:"numeric",month:"short",year:"numeric"})}`
           :`${MN[month]} ${year}`}
        </div>
        <div onClick={()=>nav(1)} style={{cursor:"pointer",padding:"4px 10px",fontSize:18,fontWeight:800,color:T.acc}}>›</div>
      </div>

      {/* ═══ VISTA GIORNO ═══ */}
      {view==="day"&&(()=>{
        const iso=fmt(curDate); const evts=byDate[iso]||[];
        return (
          <div style={{padding:"0 12px"}}>
            {evts.length===0?(
              <div style={{padding:"32px 16px",textAlign:"center",...cS}}><div style={{fontSize:32,marginBottom:6}}>📅</div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Giornata libera</div></div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {evts.map((ev,i)=>{
                  const isM=ev.tipo==="montaggio"; const sqC=ev.squadra?.colore||"#3B7FE0";
                  const col=isM?sqC:(ev.urgenza==="urgente"?"#DC4444":"#ff9500"); const sc=STATO[ev.stato]||STATO.programmato;
                  return (
                    <div key={ev.id+"_"+i} onClick={()=>setSelectedEvent(ev)} style={{...cS,cursor:"pointer",borderLeft:"3px solid "+col,padding:"12px 14px",display:"flex",alignItems:"center",gap:12}}>
                      <div style={{width:42,height:42,borderRadius:10,background:col+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{isM?"🔧":"🛠"}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:800,color:T.text}}>{ev.cliente}</div>
                        <div style={{fontSize:10,color:T.sub,marginTop:1}}>{isM&&ev.squadra&&<><span style={{fontWeight:800,color:sqC}}>{ev.squadra.nome}</span> · </>}{ev.orario||"08:00"} · {ev.indirizzo||ev.code||""}</div>
                      </div>
                      <div style={{padding:"3px 8px",borderRadius:6,fontSize:9,fontWeight:800,background:sc.bg,color:sc.tx,border:"1px solid "+sc.bd+"30",flexShrink:0}}>{isM?sc.l:(ev.urgenza==="urgente"?"⚠ Urg.":"Ripar.")}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══ VISTA SETTIMANA ═══ */}
      {view==="week"&&(
        <div style={{margin:"0 10px",...cS,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",padding:"6px 4px 2px"}}>
            <div />
            {weekDays.map((wd,i)=>(
              <div key={i} data-dropiso={wd.iso} onDragOver={e=>onDragOver(e,wd.iso)} onDragLeave={onDragLeave} onDrop={e=>onDrop(e,wd.iso)}
                style={{textAlign:"center",padding:"3px 0",borderRadius:6,cursor:"pointer",
                  background:dropTarget===wd.iso?T.acc+"20":wd.iso===todayISO?T.grn+"10":wd.iso===fmt(curDate)?T.acc+"10":"transparent",
                  border:dropTarget===wd.iso?"1.5px dashed "+T.acc:wd.iso===todayISO?"1.5px solid "+T.grn+"30":"1.5px solid transparent",transition:"all 0.15s"}}
                onClick={()=>{setCurDate(new Date(wd.iso+"T12:00:00"));setView("day");}}>
                <div style={{fontSize:9,fontWeight:700,color:wd.iso===todayISO?T.grn:i>=5?T.sub+"50":T.sub}}>{DN[i]}</div>
                <div style={{fontSize:12,fontWeight:wd.iso===todayISO?900:600,color:wd.iso===todayISO?T.grn:T.text}}>{wd.date.getDate()}</div>
              </div>
            ))}
          </div>
          {squads.map(sq=>{
            const sqC=sq.colore||"#007aff";
            return (
              <div key={sq.id} style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",padding:"0 4px",borderTop:"1px solid "+T.bdr+"25"}}>
                <div style={{fontSize:8,fontWeight:800,color:sqC,padding:"4px 2px",display:"flex",alignItems:"center",gap:2,overflow:"hidden"}}>
                  <div style={{width:6,height:6,borderRadius:3,background:sqC,flexShrink:0}} />
                  <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sq.nome}</span>
                </div>
                {weekDays.map((wd,di)=>{
                  const dayEvts=(byDate[wd.iso]||[]).filter(e=>e.tipo==="montaggio"&&(e.squadraId===sq.id||(!e.squadraId&&squads.length===1)));
                  const unique=dayEvts.filter((m,i,a)=>a.findIndex(x=>x.id===m.id)===i);
                  return (
                    <div key={di} data-dropiso={wd.iso} onDragOver={e=>onDragOver(e,wd.iso)} onDragLeave={onDragLeave} onDrop={e=>onDrop(e,wd.iso)}
                      style={{padding:"2px 1px",minHeight:26,background:dropTarget===wd.iso?T.acc+"10":"transparent",borderRadius:3,transition:"background 0.15s"}}>
                      {unique.map((ev,ei)=><EventChip key={ev.id+"_"+ei} ev={ev} compact />)}
                    </div>
                  );
                })}
              </div>
            );
          })}
          <div style={{display:"grid",gridTemplateColumns:"52px repeat(7,1fr)",padding:"0 4px",borderTop:"1px solid "+T.bdr+"25"}}>
            <div style={{fontSize:8,fontWeight:800,color:"#ff9500",padding:"4px 2px",display:"flex",alignItems:"center",gap:2}}>
              <div style={{width:6,height:6,borderRadius:3,background:"#ff9500",flexShrink:0}} />Ripar.
            </div>
            {weekDays.map((wd,di)=>{
              const dayR=(byDate[wd.iso]||[]).filter(e=>e.tipo==="riparazione");
              return (<div key={di} style={{padding:"2px 1px",minHeight:26}}>{dayR.map((ev,ri)=><EventChip key={ev.id+"_"+ri} ev={ev} compact />)}</div>);
            })}
          </div>
          <div style={{height:4}} />
          <div style={{padding:"4px 12px 6px",fontSize:8,color:T.sub+"80",textAlign:"center"}}>💡 Tieni premuto un montaggio e trascinalo per spostarlo</div>
        </div>
      )}

      {/* ═══ VISTA MESE ═══ */}
      {view==="month"&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 10px 3px"}}>
            {DN.map((d,i)=>(<div key={i} style={{textAlign:"center",fontSize:9,fontWeight:800,color:i>=5?T.sub+"50":T.sub,textTransform:"uppercase",letterSpacing:"0.06em"}}>{d}</div>))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"0 10px",gap:1}}>
            {monthDays.map((day,idx)=>{
              const evts=byDate[day.iso]||[]; const isToday=day.iso===todayISO;
              const mC=evts.filter(e=>e.tipo==="montaggio").length; const rC=evts.filter(e=>e.tipo==="riparazione").length;
              return (
                <div key={idx} data-dropiso={day.iso} onDragOver={e=>onDragOver(e,day.iso)} onDragLeave={onDragLeave} onDrop={e=>onDrop(e,day.iso)}
                  onClick={()=>{setCurDate(new Date(day.iso+"T12:00:00"));setView("day");}}
                  style={{minHeight:52,padding:"2px 1px",borderRadius:6,cursor:"pointer",
                    background:dropTarget===day.iso?T.acc+"15":isToday?T.grn+"06":"transparent",
                    border:dropTarget===day.iso?"1.5px dashed "+T.acc:isToday?"1.5px solid "+T.grn+"35":"1.5px solid transparent",
                    opacity:day.inMonth?1:0.25}}>
                  <div style={{textAlign:"center",fontSize:12,fontWeight:isToday?900:500,color:isToday?"#fff":T.text,marginBottom:2,
                    ...(isToday?{background:T.grn,width:22,height:22,lineHeight:"22px",borderRadius:"50%",margin:"0 auto 2px"}:{})}}>{day.date.getDate()}</div>
                  <div style={{display:"flex",flexDirection:"column",gap:1,padding:"0 1px"}}>
                    {evts.slice(0,3).map((e,ei)=>{const col=e.tipo==="montaggio"?(e.squadra?.colore||"#3B7FE0"):(e.urgenza==="urgente"?"#DC4444":"#ff9500");return <div key={ei} style={{height:4,borderRadius:1,background:col+"35",borderLeft:"2px solid "+col}} />;})}
                    {evts.length>3&&<div style={{fontSize:7,textAlign:"center",color:T.acc,fontWeight:800}}>+{evts.length-3}</div>}
                  </div>
                  {evts.length>0&&evts.length<=3&&(<div style={{textAlign:"center",marginTop:1}}>{mC>0&&<span style={{fontSize:7,fontWeight:800,color:"#3B7FE0"}}>{mC}M </span>}{rC>0&&<span style={{fontSize:7,fontWeight:800,color:evts.some(e=>e.urgenza==="urgente")?"#DC4444":"#ff9500"}}>{rC}R</span>}</div>)}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* LEGENDA */}
      <div style={{padding:"12px 20px 0",display:"flex",gap:14}}>
        {[{c:"#3B7FE0",l:"Montaggio"},{c:"#ff9500",l:"Riparazione"},{c:"#DC4444",l:"Urgente"}].map((x,i)=>(
          <div key={i} style={{fontSize:9,color:T.sub,fontWeight:600,display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:14,height:4,borderRadius:1,background:x.c+"40",borderLeft:"2.5px solid "+x.c}} />{x.l}
          </div>
        ))}
      </div>

      {/* ═══ 5. PROSSIMI IMPEGNI ═══ */}
      {(()=>{
        const upcoming=[];
        for (let d=1;d<21&&upcoming.length<8;d++) { const dt=new Date();dt.setDate(dt.getDate()+d);const iso=fmt(dt);const dayEvts=byDate[iso]||[];dayEvts.forEach(ev=>{if(upcoming.length<8&&!upcoming.find(u=>u.id===ev.id))upcoming.push({...ev,_dateISO:iso});}); }
        if (upcoming.length===0) return null;
        return (
          <div style={{padding:"14px 12px 0"}}>
            <div style={{fontSize:12,fontWeight:900,color:T.text,marginBottom:8,padding:"0 4px"}}>Prossimi impegni</div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {upcoming.map((ev,i)=>{
                const isM=ev.tipo==="montaggio"; const sqC=ev.squadra?.colore||"#3B7FE0";
                const col=isM?sqC:(ev.urgenza==="urgente"?"#DC4444":"#ff9500");
                const sc=STATO[ev.stato]||STATO.programmato;
                const evDate=new Date(ev._dateISO+"T12:00:00");
                const isTomorrow=(()=>{const t=new Date();t.setDate(t.getDate()+1);return ev._dateISO===fmt(t);})();
                const dayLabel=isTomorrow?"Domani":evDate.toLocaleDateString("it-IT",{weekday:"short",day:"numeric",month:"short"});
                return (
                  <div key={ev.id+"_up_"+i} onClick={()=>setSelectedEvent(ev)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:T.card,borderRadius:8,border:"1px solid "+T.bdr,borderLeft:"3px solid "+col,cursor:"pointer"}}>
                    <div style={{width:52,flexShrink:0,textAlign:"center"}}>
                      <div style={{fontSize:8,fontWeight:700,color:T.sub,textTransform:"uppercase",lineHeight:1.3}}>{evDate.toLocaleDateString("it-IT",{weekday:"short"}).toUpperCase()}</div>
                      <div style={{fontSize:8,fontWeight:700,color:T.sub,textTransform:"uppercase"}}>{evDate.toLocaleDateString("it-IT",{day:"numeric",month:"short"}).toUpperCase()}</div>
                      <div style={{fontSize:13,fontWeight:900,color:T.text,fontFamily:FM}}>{ev.orario||"08:00"}</div>
                    </div>
                    <div style={{width:1,height:28,background:T.bdr+"60"}} />
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.cliente}</div>
                      <div style={{fontSize:9,color:T.sub,marginTop:2}}>{isM&&ev.squadra?ev.squadra.nome+" · ":""}{ev.indirizzo||ev.code||""}</div>
                    </div>
                    <div style={{width:8,height:8,borderRadius:4,flexShrink:0,background:sc.bd}} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <DetailPopup />

      {/* ═══ INTERVENTO FLOW ═══ */}
      {interventoOpen && (
        <InterventoFlowPanel
          montaggio={interventoOpen}
          onClose={() => setInterventoOpen(null)}
          onUpdate={(updated) => {
            setMontaggiDB(prev => prev.map(m => m.id === updated.id ? updated : m));
            setInterventoOpen(updated);
          }}
        />
      )}
    </div>
  );
}
