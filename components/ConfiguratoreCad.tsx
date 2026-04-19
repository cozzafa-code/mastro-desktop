"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — ConfiguratoreCad v6.0
// Montanti globali (colonne) + traversi per-cella (righe locali)
// Ogni slot (cella finale) è configurabile indipendentemente
// ═══════════════════════════════════════════════════════════════
import React, { useState, useMemo, useRef, useCallback } from "react";
import { RendererSVG } from "./renderer_svg";
import { addMontante, moveMontante, suggerisciPosMontante } from "./motore_geometrico";
import { PROFILI_DEMO, PROFILO_DEFAULT } from "../lib/engine/profili";
import { calcolaLuceCella, calcolaUw, calcolaPesi } from "../lib/engine/calcoli";
import { generaDistinta } from "../lib/engine/distinta";
import { verificaConfigurazione, haErrori } from "../lib/engine/regole";

// ── TIPI LOCALI ─────────────────────────────────────────────────
// Slot = unità configurabile finale (porzione di colonna divisa da traversi locali)
interface Slot {
  id: string;           // es. "col0-slot0"
  colId: string;        // es. "col0"
  slotIdx: number;
  larghezzaNetta: number;
  altezzaNetta: number;
  areaMq: number;
  tipo: string;
  verso: string;
  vetro: any;
  ferramenta: any;
}

// Colonna = una sezione verticale del vano
interface Colonna {
  id: string;           // "col0", "col1", ...
  xStart: number;       // mm assoluto inizio (dopo spessore profilo)
  larghezzaNetta: number;
  traversiLocali: { id: string; yMmRel: number }[]; // relativi alla colonna
  slots: Slot[];
}

const VETRI = [
  { id:"std",   label:"Vetro standard 4-16-4",   ugValore:1.1, pesoMq:20, costoMq:55  },
  { id:"lam",   label:"Stratificato 33.1",        ugValore:1.1, pesoMq:18, costoMq:95  },
  { id:"rifl",  label:"Riflettente selettivo",    ugValore:1.0, pesoMq:22, costoMq:130 },
  { id:"tri",   label:"Triplo basso emissivo",    ugValore:0.5, pesoMq:30, costoMq:195 },
  { id:"cam",   label:"Camera 4-12-4",            ugValore:0.9, pesoMq:20, costoMq:75  },
  { id:"anti",  label:"Antisfondamento P2A",      ugValore:1.0, pesoMq:38, costoMq:210 },
];

const TIPI = [
  { id:"fisso",          label:"Fisso"          },
  { id:"anta_battente",  label:"Anta battente"  },
  { id:"anta_ribalta",   label:"Anta-ribalta"   },
  { id:"wasistas",       label:"Wasistas"       },
  { id:"porta",          label:"Porta"          },
  { id:"scorrevole",     label:"Scorrevole"     },
  { id:"pannello_cieco", label:"Pannello cieco" },
];

const AMBER="#D08008"; const DARK="#1A1A1C"; const TEAL="#1A9E73";
const RED="#DC4444"; const BDR="#E5E7EB"; const SUB="#6B7280";
const FF="Inter,system-ui,sans-serif"; const FM="JetBrains Mono,monospace";
const INP:any={padding:"5px 8px",border:`1px solid ${BDR}`,borderRadius:6,fontSize:12,fontWeight:600,fontFamily:FF,outline:"none",boxSizing:"border-box",width:"100%"};
const ROW:any={display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #F3F4F6"};
const LBL:any={fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6};
const FER={maniglia:true,maniglione:false,nCerniere:2,cerniereTipo:"standard",chiusuraMultipunto:false,costoFerramenta:0};

// ── MOTORE GEOMETRICO LOCALE ────────────────────────────────────

function calcolaColonne(L:number, H:number, montanti:any[], sp:number, colonneEsistenti:Colonna[]): Colonna[] {
  // Punti X delle colonne: tra profilo sx e montanti e profilo dx
  const xPts = [sp, ...montanti.map((m:any)=>m.xMm).sort((a:number,b:number)=>a-b), L-sp];
  const nCol = xPts.length - 1;
  const altNetta = H - sp*2;

  return Array.from({length: nCol}, (_,i) => {
    const id = `col${i}`;
    const xStart = xPts[i] + (i>0 ? sp/2 : 0);
    const xEnd   = xPts[i+1] - (i<nCol-1 ? sp/2 : 0);
    const lNetta = Math.round(xEnd - xStart);
    const old = colonneEsistenti.find(c=>c.id===id);
    const traversiLocali = old?.traversiLocali || [];

    // Calcola slots dalla colonna
    const yPts = [0, ...traversiLocali.map(t=>t.yMmRel).sort((a:number,b:number)=>a-b), altNetta];
    const slots: Slot[] = Array.from({length: yPts.length-1}, (_,j) => {
      const slotId = `${id}-slot${j}`;
      const oldSlot = old?.slots?.find(s=>s.id===slotId);
      const hNetta = Math.round(yPts[j+1] - yPts[j] - (j>0 ? sp/2 : 0) - (j<yPts.length-2 ? sp/2 : 0));
      return {
        id: slotId, colId: id, slotIdx: j,
        larghezzaNetta: lNetta,
        altezzaNetta: Math.max(50, hNetta),
        areaMq: Math.round(lNetta * Math.max(50,hNetta)) / 1_000_000,
        tipo: oldSlot?.tipo || "fisso",
        verso: oldSlot?.verso || "sx",
        vetro: oldSlot?.vetro || VETRI[0],
        ferramenta: oldSlot?.ferramenta || {...FER},
      };
    });

    return { id, xStart, larghezzaNetta: lNetta, traversiLocali, slots };
  });
}

function buildInfisso(L=1500, H=2100, profilo=PROFILO_DEFAULT) {
  const sp = profilo.spessoreTelaio;
  // Parte SENZA montanti — l'utente li aggiunge
  const montanti:any[] = [];
  const colonne = calcolaColonne(L, H, montanti, sp, []);
  return {
    id:`inf_${Date.now()}`, larghezzaVano:L, altezzaVano:H, spessoreMuro:150,
    profilo, montanti, colonne, _slotSel:null, _mode:"industrial",
    sistema:{spessoreTelaio:sp, tipo:profilo.materiale, serieNome:profilo.nome,
      ufProfilo:profilo.Uf, costoMlTelaio:profilo.costoMlTelaio, costoMlAnte:profilo.costoMlAnta}
  };
}

function ricalcola(inf:any, prevL?:number, prevH?:number) {
  const sp = inf.profilo.spessoreTelaio;
  const L = inf.larghezzaVano, H = inf.altezzaVano;
  let montanti = inf.montanti;
  if(prevL&&prevL!==L) montanti=montanti.map((m:any)=>({...m,xMm:Math.round(Math.max(sp*2,Math.min(L-sp*2,m.xMm*L/prevL)))}));
  const colonne = calcolaColonne(L, H, montanti, sp, inf.colonne||[]);
  return {...inf, montanti, colonne, sistema:{...inf.sistema, spessoreTelaio:sp}};
}

// ── RENDERER ADAPTER ────────────────────────────────────────────
// Converte il modello colonne/slots in formato atteso dal RendererSVG
function toInfissoRender(inf:any) {
  const sp = inf.profilo.spessoreTelaio;
  const L = inf.larghezzaVano;
  const H = inf.altezzaVano;
  const altNetta = H - sp*2;

  // xPunti: bordi colonne
  const xPts = [sp, ...inf.montanti.map((m:any)=>m.xMm).sort((a:number,b:number)=>a-b), L-sp];

  // Costruisce celle PIATTE — una per slot, con xPunti/yPunti calcolati
  // Raccoglie tutti i yPunti unici (unione traversi locali di tutte le colonne)
  const allYSet = new Set<number>([sp, H-sp]);
  inf.colonne.forEach((col:any)=>{
    col.traversiLocali?.forEach((t:any)=>allYSet.add(sp+t.yMmRel));
  });
  const yPts = Array.from(allYSet).sort((a:number,b:number)=>a-b);

  // Celle flat: una per ogni slot
  const celle:any[] = [];
  inf.colonne.forEach((col:any)=>{
    const colIdx = parseInt(col.id.replace("col",""));
    const colYPts = [sp, ...col.traversiLocali.map((t:any)=>sp+t.yMmRel).sort((a:number,b:number)=>a-b), H-sp];
    
    col.slots.forEach((s:any, si:number)=>{
      // Calcola rowIdx globale: trova quale riga yPts corrisponde
      const yStart = colYPts[si];
      const rowIdx = yPts.indexOf(yStart);
      
      // Calcola altezza netta dello slot
      const yEnd = colYPts[si+1];
      const spTop = si===0 ? 0 : sp/2;
      const spBot = si===col.slots.length-1 ? 0 : sp/2;
      const hNetta = Math.round((yEnd-yStart) - spTop - spBot);

      // Calcola larghezza netta della colonna
      const nCol = xPts.length-1;
      const spSx = colIdx===0 ? 0 : sp/2;
      const spDx = colIdx===nCol-1 ? 0 : sp/2;
      const lNetta = Math.round(xPts[colIdx+1]-xPts[colIdx]-spSx-spDx);

      celle.push({
        id: s.id,
        colIdx,
        rowIdx: rowIdx >= 0 ? rowIdx : si,
        larghezzaNetta: lNetta,
        altezzaNetta: Math.max(50, hNetta),
        areaMq: Math.round(lNetta*Math.max(50,hNetta))/1_000_000,
        tipo: s.tipo, verso: s.verso, vetro: s.vetro, ferramenta: s.ferramenta,
        subMontanti: [],
        // Traversi locali solo per il rendering visivo (non per subCelle)
        subTraversi: si===0 ? col.traversiLocali.map((t:any)=>({
          id: t.id, yMmRel: t.yMmRel, spessoreMm: sp, colId: col.id,
        })) : [],
        subCelle: [],
        _colYStart: yStart, // offset assoluto y inizio slot
        _colYEnd: yEnd,
      });
    });
  });

  return {
    ...inf,
    traversi: [],
    griglia: { nColonne: inf.colonne.length, nRighe: yPts.length-1, xPunti: xPts, yPunti: yPts, celle },
    sistema: {
      spessoreTelaio: sp, tipo: inf.profilo.materiale, serieNome: inf.profilo.nome,
      ufProfilo: inf.profilo.Uf, costoMlTelaio: inf.profilo.costoMlTelaio,
      costoMlAnte: inf.profilo.costoMlAnta, coloreEsterno:"#9CA3AF", coloreInterno:"#F2F1EC"
    }
  };
}

export default function ConfiguratoreCad({realW, realH, vanoNome, onUpdate, onClose}:any) {
  const [inf, setInf] = useState(()=>buildInfisso(parseInt(realW)||1500, parseInt(realH)||2100));
  const [dragging, setDragging] = useState<any>(null);
  const wasDrag = useRef(false);
  const [tabRight, setTabRight] = useState("risultati");
  const [ctxMenu, setCtxMenu] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Tracking frequenza d'uso per ordinamento intelligente context menu
  const [usageStats, setUsageStats] = React.useState<Record<string,number>>({});
  
  React.useEffect(()=>{
    try { 
      const saved = JSON.parse(localStorage.getItem('mastro_cad_usage')||'{}');
      setUsageStats(saved);
    } catch {}
  },[]);
  
  const trackUsage = (key:string) => {
    setUsageStats((prev:any)=>{
      const next = {...prev, [key]: (prev[key]||0)+1};
      try { localStorage.setItem('mastro_cad_usage', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const upd = (partial:any) => setInf((p:any)=>{
    const pL=p.larghezzaVano, pH=p.altezzaVano;
    return ricalcola({...p,...partial},pL,pH);
  });

  // Tutti gli slot flat
  const tuttiSlots = useMemo(()=>inf.colonne.flatMap((c:any)=>c.slots),[inf.colonne]);

  const slotSel = tuttiSlots.find((s:any)=>s.id===inf._slotSel);
  const colSel = slotSel ? inf.colonne.find((c:any)=>c.id===slotSel.colId) : null;

  const updSlot = (slotId:string, partial:any) => setInf((p:any)=>({
    ...p, colonne: p.colonne.map((col:any)=>({
      ...col, slots: col.slots.map((s:any)=>s.id===slotId?{...s,...partial}:s)
    }))
  }));

  const addTraversoLocale = (colId:string) => {
    setInf((p:any)=>{
      const sp = p.profilo.spessoreTelaio;
      const H = p.altezzaVano;
      const altNetta = H - sp*2;
      const colonne = p.colonne.map((col:any)=>{
        if(col.id!==colId) return col;
        const existing = col.traversiLocali.map((t:any)=>t.yMmRel);
        const yPts = [0,...existing.sort((a:number,b:number)=>a-b), altNetta];
        // Trova il gap più grande
        let maxGap=0, bestY=Math.round(altNetta/2);
        for(let i=0;i<yPts.length-1;i++){const g=yPts[i+1]-yPts[i];if(g>maxGap){maxGap=g;bestY=Math.round((yPts[i]+yPts[i+1])/2);}}
        const traversiLocali=[...col.traversiLocali,{id:`tl${Date.now()}`,yMmRel:bestY}].sort((a:any,b:any)=>a.yMmRel-b.yMmRel);
        // Ricalcola slots
        const yPts2=[0,...traversiLocali.map((t:any)=>t.yMmRel), altNetta];
        const slots:Slot[]=Array.from({length:yPts2.length-1},(_,j)=>{
          const slotId=`${colId}-slot${j}`;
          const oldSlot=col.slots?.find((s:any)=>s.id===slotId);
          const hNetta=Math.round(yPts2[j+1]-yPts2[j]-(j>0?sp/2:0)-(j<yPts2.length-2?sp/2:0));
          return {id:slotId,colId,slotIdx:j,larghezzaNetta:col.larghezzaNetta,altezzaNetta:Math.max(50,hNetta),areaMq:Math.round(col.larghezzaNetta*Math.max(50,hNetta))/1_000_000,tipo:oldSlot?.tipo||"fisso",verso:oldSlot?.verso||"sx",vetro:oldSlot?.vetro||VETRI[0],ferramenta:oldSlot?.ferramenta||{...FER}};
        });
        return {...col, traversiLocali, slots};
      });
      return {...p, colonne};
    });
  };

  const removeTraversoLocale = (colId:string) => {
    setInf((p:any)=>{
      const sp = p.profilo.spessoreTelaio;
      const H = p.altezzaVano;
      const altNetta = H - sp*2;
      const colonne = p.colonne.map((col:any)=>{
        if(col.id!==colId||!col.traversiLocali.length) return col;
        const traversiLocali = col.traversiLocali.slice(0,-1);
        const yPts=[0,...traversiLocali.map((t:any)=>t.yMmRel), altNetta];
        const slots:Slot[]=Array.from({length:yPts.length-1},(_,j)=>{
          const slotId=`${colId}-slot${j}`;
          const oldSlot=col.slots?.find((s:any)=>s.id===slotId);
          const hNetta=Math.round(yPts[j+1]-yPts[j]-(j>0?sp/2:0)-(j<yPts.length-2?sp/2:0));
          return {id:slotId,colId,slotIdx:j,larghezzaNetta:col.larghezzaNetta,altezzaNetta:Math.max(50,hNetta),areaMq:Math.round(col.larghezzaNetta*Math.max(50,hNetta))/1_000_000,tipo:oldSlot?.tipo||"fisso",verso:oldSlot?.verso||"sx",vetro:oldSlot?.vetro||VETRI[0],ferramenta:oldSlot?.ferramenta||{...FER}};
        });
        return {...col, traversiLocali, slots};
      });
      return {...p, colonne};
    });
  };

  // Calcoli
  const luci = useMemo(()=>{
    const m:any={};
    tuttiSlots.forEach((s:any)=>{m[s.id]=calcolaLuceCella(s.larghezzaNetta,s.altezzaNetta,inf.profilo,s.tipo);});
    return m;
  },[tuttiSlots,inf.profilo]);

  const uwCalc = useMemo(()=>calcolaUw(inf.larghezzaVano,inf.altezzaVano,
    tuttiSlots.map((s:any)=>({areaMq:luci[s.id]?.vetroMq||s.areaMq,vetroUg:s.vetro?.ugValore||1.1})),
    inf.profilo),[inf,luci,tuttiSlots]);

  const mlTelaio = useMemo(()=>(inf.larghezzaVano*2+inf.altezzaVano*2)/1000,[inf]);
  const mlAnte = useMemo(()=>tuttiSlots.filter((s:any)=>!["fisso","pannello_cieco"].includes(s.tipo))
    .reduce((a:number,s:any)=>a+(s.larghezzaNetta*2+s.altezzaNetta*2)/1000,0),[tuttiSlots]);

  const pesi = useMemo(()=>calcolaPesi(mlTelaio,mlAnte,
    tuttiSlots.map((s:any)=>({areaMq:luci[s.id]?.vetroMq||s.areaMq,pesoMqVetro:s.vetro?.pesoMq||20,tipo:s.tipo})),
    inf.profilo),[mlTelaio,mlAnte,tuttiSlots,luci,inf.profilo]);

  const distinta = useMemo(()=>generaDistinta(inf.larghezzaVano,inf.altezzaVano,
    inf.montanti.map((m:any)=>m.xMm),[],
    tuttiSlots.map((s:any)=>({id:s.id,tipo:s.tipo,larghezzaNetta:s.larghezzaNetta,altezzaNetta:s.altezzaNetta,areaMq:s.areaMq,vetroTipo:s.vetro?.label,vetroUg:s.vetro?.ugValore,vetroMq:luci[s.id]?.vetroMq,vetroPesoMq:s.vetro?.pesoMq,vetroCostoMq:s.vetro?.costoMq,ferramenta:s.ferramenta||FER})),
    inf.profilo),[inf,tuttiSlots,luci]);

  const violazioni = useMemo(()=>verificaConfigurazione(
    tuttiSlots.map((s:any)=>({id:s.id,tipo:s.tipo,larghezzaNetta:s.larghezzaNetta,altezzaNetta:s.altezzaNetta,pesoAntaKg:pesi.pesoAntaMax,vetroL:luci[s.id]?.vetroL||0,vetroH:luci[s.id]?.vetroH||0})),
    inf.profilo),[tuttiSlots,inf.profilo,pesi,luci]);

  // Drag montanti
  const handleMouseMove = useCallback((e:any)=>{
    if(!dragging||!svgRef.current)return;
    wasDrag.current=true;
    const CTM=svgRef.current.getScreenCTM()!;
    const pt={x:(e.clientX-CTM.e)/CTM.a,y:(e.clientY-CTM.f)/CTM.d};
    const sp=inf.profilo.spessoreTelaio;
    if(dragging.type==="m"){
      setInf((p:any)=>{
        const montanti=moveMontante(p.montanti,dragging.id,pt.x,p.larghezzaVano,{spessoreTelaio:sp});
        return ricalcola({...p,montanti});
      });
    }
    // Drag traverso locale per colonna
    if(dragging.type==="st"&&dragging.colId){
      const altNetta=inf.altezzaVano-sp*2;
      // Calcola xStart della colonna per ottenere yMmRel
      const col=inf.colonne.find((c:any)=>c.id===dragging.colId);
      if(!col)return;
      const newYRel=Math.round(Math.max(sp,Math.min(altNetta-sp,pt.y-sp)));
      setInf((p:any)=>({
        ...p,
        colonne:p.colonne.map((c:any)=>{
          if(c.id!==dragging.colId)return c;
          const traversiLocali=c.traversiLocali.map((t:any)=>t.id===dragging.id?{...t,yMmRel:newYRel}:t);
          const altNetta2=p.altezzaVano-sp*2;
          const yPts=[0,...traversiLocali.map((t:any)=>t.yMmRel).sort((a:number,b:number)=>a-b),altNetta2];
          const slots=c.slots.map((s:any,si:number)=>{
            const hNetta=Math.round(yPts[si+1]-yPts[si]-(si>0?sp/2:0)-(si<yPts.length-2?sp/2:0));
            return {...s,altezzaNetta:Math.max(50,hNetta),areaMq:Math.round(c.larghezzaNetta*Math.max(50,hNetta))/1_000_000};
          });
          return {...c,traversiLocali,slots};
        })
      }));
    }
  },[dragging,inf.profilo,inf.colonne,inf.altezzaVano]);

  const handleMouseUp=useCallback(()=>{setDragging(null);setTimeout(()=>{wasDrag.current=false;},50);},[]);

  const handleCellaClick=useCallback((id:string)=>{
    if(wasDrag.current)return;
    setInf((p:any)=>({...p,_slotSel:p._slotSel===id?null:id}));
  },[]);

  // Adatta inf per renderer
  const infRender = useMemo(()=>toInfissoRender(inf),[inf]);
  // Sovrascrive _cellaSel con _slotSel
  const infForRenderer = useMemo(()=>({...infRender,_cellaSel:inf._slotSel}),[infRender,inf._slotSel]);

  const isMkt = inf._mode==="marketing";
  const uwC = uwCalc.uw<=1.0?TEAL:uwCalc.uw<=1.4?AMBER:RED;
  const nErr = violazioni.filter((v:any)=>v.severita==="errore").length;
  const nWarn = violazioni.filter((v:any)=>v.severita==="warning").length;

  return (
    <div style={{width:"100%",height:"100%",display:"flex",overflow:"hidden",fontFamily:FF}}>

      {/* SIDEBAR */}
      <div style={{width:250,flexShrink:0,background:"#fff",borderRight:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"10px 12px",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
          <div style={{fontSize:11,fontWeight:700,color:SUB,textTransform:"uppercase",letterSpacing:0.5,marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{vanoNome||"CAD"}</div>
          <div style={{display:"flex",background:"#F3F4F6",borderRadius:8,padding:2}}>
            {(["industrial","marketing"] as string[]).map((modeOpt)=>(
              <button key={modeOpt} onClick={()=>upd({_mode:modeOpt})} style={{flex:1,padding:"5px 0",border:"none",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:700,textTransform:"uppercase",background:inf._mode===modeOpt?(modeOpt==="marketing"?AMBER:DARK):"transparent",color:inf._mode===modeOpt?"#fff":SUB}}>{modeOpt==="industrial"?"TECNICO":"MKT"}</button>
            ))}
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:12}}>

          {/* Dimensioni */}
          <div>
            <div style={LBL}>Dimensioni vano</div>
            <div style={{display:"flex",gap:6}}>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:SUB,marginBottom:2}}>L mm</div>
                <input type="number" defaultValue={inf.larghezzaVano} key={inf.larghezzaVano} style={INP}
                  onBlur={e=>{const v=parseInt(e.target.value);if(v>200)upd({larghezzaVano:v});}}
                  onKeyDown={e=>{if(e.key==="Enter"){const v=parseInt((e.target as HTMLInputElement).value);if(v>200)upd({larghezzaVano:v});}}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:9,color:SUB,marginBottom:2}}>H mm</div>
                <input type="number" defaultValue={inf.altezzaVano} key={inf.altezzaVano} style={INP}
                  onBlur={e=>{const v=parseInt(e.target.value);if(v>200)upd({altezzaVano:v});}}
                  onKeyDown={e=>{if(e.key==="Enter"){const v=parseInt((e.target as HTMLInputElement).value);if(v>200)upd({altezzaVano:v});}}}/>
              </div>
            </div>
          </div>

          {/* Profilo */}
          <div>
            <div style={LBL}>Sistema profilo</div>
            {PROFILI_DEMO.map((p:any)=>(
              <button key={p.id} onClick={()=>upd({profilo:p})} style={{display:"block",width:"100%",padding:"6px 10px",marginBottom:3,border:`1.5px solid ${inf.profilo.id===p.id?AMBER:BDR}`,borderRadius:7,background:inf.profilo.id===p.id?AMBER+"18":"#fff",fontSize:11,fontWeight:inf.profilo.id===p.id?700:400,color:inf.profilo.id===p.id?AMBER:DARK,cursor:"pointer",textAlign:"left" as any}}>
                <div>{p.nome}</div>
                <div style={{fontSize:9,color:SUB,fontWeight:400}}>Uf {p.Uf} · tel {p.spessoreTelaio}mm · anta {p.spessoreAnta}mm</div>
              </button>
            ))}
          </div>

          {/* Montanti globali */}
          <div>
            <div style={LBL}>Montanti (colonne)</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
              <button onClick={()=>setInf((p:any)=>{const sp=p.profilo.spessoreTelaio;const m=addMontante(p.montanti,suggerisciPosMontante(p.montanti,p.larghezzaVano,{spessoreTelaio:sp}),p.larghezzaVano,{spessoreTelaio:sp});return ricalcola({...p,montanti:m});})} style={{padding:"6px",border:`1px solid ${BDR}`,borderRadius:6,fontSize:11,cursor:"pointer",background:"#F9FAFB",color:DARK}}>+ Montante</button>
              <button onClick={()=>setInf((p:any)=>{if(!p.montanti.length)return p;return ricalcola({...p,montanti:p.montanti.slice(0,-1)});})} disabled={inf.montanti.length===0} style={{padding:"6px",border:`1px solid ${BDR}`,borderRadius:6,fontSize:11,cursor:inf.montanti.length===0?"default":"pointer",background:"#F9FAFB",color:inf.montanti.length===0?"#CCC":RED}}>− Montante</button>
            </div>
            <div style={{fontSize:10,color:SUB,marginTop:4}}>{inf.colonne.length} colonne · {tuttiSlots.length} slot totali</div>
          </div>

          {/* Colonne con traversi locali */}
          <div>
            <div style={LBL}>Traversi per colonna</div>
            {inf.colonne.map((col:any)=>(
              <div key={col.id} style={{marginBottom:6,padding:"6px 8px",background:"#F9FAFB",borderRadius:7,border:`1px solid ${BDR}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:10,fontWeight:700,color:DARK}}>{col.id.replace("col","Col.")} — {col.larghezzaNetta}mm</span>
                  <span style={{fontSize:9,color:SUB}}>{col.slots.length} slot</span>
                </div>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={()=>addTraversoLocale(col.id)} style={{flex:1,padding:"4px",border:`1px solid ${BDR}`,borderRadius:5,fontSize:10,cursor:"pointer",background:"#fff",color:DARK}}>+ Traverso</button>
                  <button onClick={()=>removeTraversoLocale(col.id)} disabled={col.traversiLocali.length===0} style={{flex:1,padding:"4px",border:`1px solid ${BDR}`,borderRadius:5,fontSize:10,cursor:col.traversiLocali.length===0?"default":"pointer",background:"#fff",color:col.traversiLocali.length===0?"#CCC":RED}}>− Traverso</button>
                </div>
              </div>
            ))}
          </div>

          {/* Slot selezionato */}
          {slotSel ? (
            <div style={{border:`1.5px solid ${AMBER}`,borderRadius:10,padding:"10px",background:AMBER+"06"}}>
              <div style={{fontSize:10,fontWeight:700,color:AMBER,textTransform:"uppercase",marginBottom:8}}>
                {slotSel.colId.replace("col","Col.")} Slot {slotSel.slotIdx+1} — {slotSel.larghezzaNetta}×{slotSel.altezzaNetta}mm
              </div>

              {/* Luci nette */}
              <div style={{background:"#F8FAFC",borderRadius:7,padding:"7px 9px",marginBottom:8,border:`1px solid ${BDR}`}}>
                <div style={{fontSize:9,fontWeight:700,color:SUB,textTransform:"uppercase",marginBottom:4}}>Luci nette</div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:10,color:SUB}}>Vetro</span>
                  <span style={{fontSize:10,fontWeight:700,fontFamily:FM,color:DARK}}>{luci[slotSel.id]?.vetroL||0}×{luci[slotSel.id]?.vetroH||0}mm</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <span style={{fontSize:10,color:SUB}}>m²</span>
                  <span style={{fontSize:10,fontWeight:700,fontFamily:FM,color:SUB}}>{(luci[slotSel.id]?.vetroMq||0).toFixed(3)}</span>
                </div>
                {!["fisso","pannello_cieco"].includes(slotSel.tipo) && (
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                    <span style={{fontSize:10,color:SUB}}>Anta</span>
                    <span style={{fontSize:10,fontWeight:700,fontFamily:FM,color:TEAL}}>{luci[slotSel.id]?.antaL||0}×{luci[slotSel.id]?.antaH||0}mm</span>
                  </div>
                )}
              </div>

              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:SUB,marginBottom:3}}>Tipo apertura</div>
                <select value={slotSel.tipo} onChange={e=>updSlot(slotSel.id,{tipo:e.target.value})} style={INP}>
                  {TIPI.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>

              {["anta_battente","porta","anta_ribalta"].includes(slotSel.tipo)&&(
                <div style={{marginBottom:6}}>
                  <div style={{fontSize:9,color:SUB,marginBottom:3}}>Verso</div>
                  <div style={{display:"flex",gap:4}}>
                    <button onClick={()=>updSlot(slotSel.id,{verso:"sx"})} style={{flex:1,padding:"5px 0",border:`1.5px solid ${slotSel.verso==="sx"?TEAL:BDR}`,borderRadius:6,fontSize:11,fontWeight:slotSel.verso==="sx"?700:400,cursor:"pointer",background:slotSel.verso==="sx"?TEAL+"12":"#fff",color:slotSel.verso==="sx"?TEAL:DARK}}>◄ SX</button>
                    <button onClick={()=>updSlot(slotSel.id,{verso:"dx"})} style={{flex:1,padding:"5px 0",border:`1.5px solid ${slotSel.verso==="dx"?TEAL:BDR}`,borderRadius:6,fontSize:11,fontWeight:slotSel.verso==="dx"?700:400,cursor:"pointer",background:slotSel.verso==="dx"?TEAL+"12":"#fff",color:slotSel.verso==="dx"?TEAL:DARK}}>DX ►</button>
                  </div>
                </div>
              )}

              <div style={{marginBottom:6}}>
                <div style={{fontSize:9,color:SUB,marginBottom:3}}>Vetro</div>
                <select value={slotSel.vetro?.id||"std"} onChange={e=>updSlot(slotSel.id,{vetro:VETRI.find(v=>v.id===e.target.value)})} style={INP}>
                  {VETRI.map(v=><option key={v.id} value={v.id}>{v.label} (Ug {v.ugValore})</option>)}
                </select>
              </div>

              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>updSlot(slotSel.id,{ferramenta:{...(slotSel.ferramenta||FER),maniglia:!slotSel.ferramenta?.maniglia}})}
                  style={{flex:1,padding:"5px 4px",border:`1.5px solid ${slotSel.ferramenta?.maniglia?TEAL:BDR}`,borderRadius:6,fontSize:10,cursor:"pointer",background:slotSel.ferramenta?.maniglia?TEAL+"12":"#fff",color:slotSel.ferramenta?.maniglia?TEAL:DARK}}>Maniglia</button>
                <button onClick={()=>updSlot(slotSel.id,{ferramenta:{...(slotSel.ferramenta||FER),chiusuraMultipunto:!slotSel.ferramenta?.chiusuraMultipunto}})}
                  style={{flex:1,padding:"5px 4px",border:`1.5px solid ${slotSel.ferramenta?.chiusuraMultipunto?TEAL:BDR}`,borderRadius:6,fontSize:10,cursor:"pointer",background:slotSel.ferramenta?.chiusuraMultipunto?TEAL+"12":"#fff",color:slotSel.ferramenta?.chiusuraMultipunto?TEAL:DARK}}>Multipunto</button>
              </div>

              {violazioni.filter((v:any)=>v.cellaId===slotSel.id).map((v:any,i:number)=>(
                <div key={i} style={{padding:"5px 7px",background:v.severita==="errore"?"#FEF2F2":"#FEF3C7",borderRadius:6,marginTop:4,fontSize:10,color:v.severita==="errore"?RED:"#92400E",fontWeight:600}}>
                  {v.severita==="errore"?"⛔":"⚠"} {v.messaggio}
                </div>
              ))}
            </div>
          ) : (
            <div style={{padding:"12px",background:"#F9FAFB",borderRadius:8,fontSize:11,color:SUB,textAlign:"center" as any,border:`1px dashed ${BDR}`}}>
              Clicca uno slot nel canvas
            </div>
          )}

          {/* Vetro globale */}
          <div>
            <div style={LBL}>Vetro su tutti gli slot</div>
            <select id="vg" defaultValue="std" style={{...INP,marginBottom:5}}>
              {VETRI.map(v=><option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
            <button onClick={()=>{const el=document.getElementById("vg") as HTMLSelectElement;const vetro=VETRI.find(v=>v.id===el.value);if(!vetro)return;setInf((p:any)=>({...p,colonne:p.colonne.map((col:any)=>({...col,slots:col.slots.map((s:any)=>({...s,vetro}))}))}))}}
              style={{width:"100%",padding:"6px 0",border:`1px solid ${BDR}`,borderRadius:7,background:"#F9FAFB",color:DARK,fontSize:11,fontWeight:600,cursor:"pointer"}}>Applica a tutti</button>
          </div>
        </div>
      </div>

      {/* CANVAS */}
      <div style={{flex:1,position:"relative",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",background:isMkt?DARK:"#F0F2F5",minWidth:0}}
        onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
        onContextMenu={(e)=>{
          e.preventDefault();
          if(!svgRef.current)return;
          const CTM=svgRef.current.getScreenCTM();
          if(!CTM)return;
          const svgX=(e.clientX-CTM.e)/CTM.a;
          const svgY=(e.clientY-CTM.f)/CTM.d;
          const sp=inf.profilo.spessoreTelaio;
          const H=inf.altezzaVano;
          const altNetta=H-sp*2;
          const xPts=[sp,...inf.montanti.map((m:any)=>m.xMm).sort((a:number,b:number)=>a-b),inf.larghezzaVano-sp];
          let colIdx=-1;
          for(let i=0;i<xPts.length-1;i++){if(svgX>=xPts[i]&&svgX<=xPts[i+1]){colIdx=i;break;}}
          if(colIdx<0||colIdx>=inf.colonne.length)return;
          const col=inf.colonne[colIdx];
          const yRel=svgY-sp;
          const yPts=[0,...col.traversiLocali.map((t:any)=>t.yMmRel).sort((a:number,b:number)=>a-b),altNetta];
          let slotIdx=0;
          for(let i=0;i<yPts.length-1;i++){if(yRel>=yPts[i]&&yRel<=yPts[i+1]){slotIdx=i;break;}}
          const slot=col.slots[slotIdx];
          if(slot)setCtxMenu({x:e.clientX,y:e.clientY,slotId:slot.id});
        }}> 
        <RendererSVG infisso={infForRenderer} width="90%" height="90%" svgRef={svgRef}
          setDragging={(d:any)=>{wasDrag.current=false;setDragging(d);}}
          onCellaClick={handleCellaClick}/>
        
        {/* CONTEXT MENU */}
        {ctxMenu&&(
          <div style={{position:"fixed",left:ctxMenu.x,top:ctxMenu.y,zIndex:99999,
            background:"#fff",borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.22)",
            border:"1px solid #E5E7EB",minWidth:220,overflow:"hidden",fontFamily:"Inter,system-ui,sans-serif"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:"8px 14px",background:"#1A1A1C",borderBottom:"1px solid #333",
              fontSize:11,fontWeight:700,color:"#D08008",textTransform:"uppercase",letterSpacing:0.5}}>
              {ctxMenu.slotId.replace("col","Col.").replace("-slot"," · Slot ")}
            </div>
            <div style={{padding:"4px 0 2px"}}>
              <div style={{padding:"2px 14px",fontSize:10,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase"}}>Tipo apertura</div>
              {([{id:"fisso",l:"Fisso",ic:"▣"},{id:"anta_battente",l:"Anta battente",ic:"◧"},{id:"anta_ribalta",l:"Anta-ribalta",ic:"◨"},{id:"wasistas",l:"Wasistas",ic:"◩"},{id:"porta",l:"Porta",ic:"🚪"},{id:"scorrevole",l:"Scorrevole",ic:"⇔"},{id:"pannello_cieco",l:"Pannello cieco",ic:"▪"}] as any[]).map((t:any)=>{
                const isCur=tuttiSlots.find((s:any)=>s.id===ctxMenu.slotId)?.tipo===t.id;
                return <div key={t.id} onClick={()=>{updSlot(ctxMenu.slotId,{tipo:t.id});setInf((p:any)=>({...p,_slotSel:ctxMenu.slotId}));setCtxMenu(null);}}
                  style={{padding:"7px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,
                    background:isCur?"#FFF8E7":"transparent",fontSize:13,color:"#1A1A1C"}}>
                  <span style={{fontSize:15,width:20}}>{t.ic}</span>
                  <span style={{flex:1}}>{t.l}</span>
                  {isCur&&<span style={{color:"#D08008",fontWeight:900}}>✓</span>}
                </div>;
              })}
            </div>
            {(["anta_battente","anta_ribalta","porta"] as string[]).includes(tuttiSlots.find((s:any)=>s.id===ctxMenu.slotId)?.tipo||"")&&(
              <div style={{borderTop:"1px solid #F3F4F6",padding:"4px 14px 8px"}}>
                <div style={{fontSize:10,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase",marginBottom:4}}>Verso</div>
                <div style={{display:"flex",gap:6}}>
                  {(["sx","dx"] as string[]).map((v:string)=>{
                    const isCur=tuttiSlots.find((s:any)=>s.id===ctxMenu.slotId)?.verso===v;
                    return <button key={v} onClick={()=>{updSlot(ctxMenu.slotId,{verso:v});setCtxMenu(null);}}
                      style={{flex:1,padding:"5px 0",border:`1.5px solid ${isCur?"#1A9E73":"#E5E7EB"}`,borderRadius:6,
                        fontSize:12,fontWeight:700,cursor:"pointer",
                        background:isCur?"#1A9E7318":"#fff",color:isCur?"#1A9E73":"#1A1A1C"}}>
                      {v==="sx"?"◄ SX":"DX ►"}
                    </button>;
                  })}
                </div>
              </div>
            )}
            <div style={{borderTop:"1px solid #F3F4F6",padding:"4px 0 4px"}}>
              <div style={{padding:"2px 14px",fontSize:10,fontWeight:700,color:"#9CA3AF",textTransform:"uppercase"}}>Vetro</div>
              {(VETRI as any[]).map((v:any)=>{
                const isCur=tuttiSlots.find((s:any)=>s.id===ctxMenu.slotId)?.vetro?.id===v.id;
                return <div key={v.id} onClick={()=>{updSlot(ctxMenu.slotId,{vetro:v});setCtxMenu(null);}}
                  style={{padding:"6px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",
                    background:isCur?"#F0FDF4":"transparent",fontSize:12,color:"#1A1A1C"}}>
                  <span>{v.label}</span>
                  <span style={{color:"#6B7280",fontSize:11}}>Ug {v.ugValore}{isCur?" ✓":""}</span>
                </div>;
              })}
            </div>
          </div>
        )}
      </div>

      {/* PANNELLO DESTRO */}
      <div style={{width:230,flexShrink:0,background:"#fff",borderLeft:`1px solid ${BDR}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{display:"flex",borderBottom:`1px solid ${BDR}`,flexShrink:0}}>
          {["risultati","distinta","regole"].map(id=>{
            const l = id==="risultati"?"Risultati":id==="distinta"?"Distinta":(nErr>0?`Regole ⛔${nErr}`:nWarn>0?`Regole ⚠${nWarn}`:"Regole");
            return <button key={id} onClick={()=>setTabRight(id)} style={{flex:1,padding:"8px 2px",border:"none",borderBottom:`2px solid ${tabRight===id?AMBER:"transparent"}`,fontSize:10,fontWeight:tabRight===id?700:400,cursor:"pointer",background:"#fff",color:tabRight===id?AMBER:SUB}}>{l}</button>;
          })}
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"10px 12px",display:"flex",flexDirection:"column",gap:8}}>
          {tabRight==="risultati"&&<>
            <div style={{background:"#F8FAFC",borderRadius:8,padding:"8px 10px",border:`1px solid ${BDR}`}}>
              <div style={{fontSize:9,color:SUB,marginBottom:2}}>Trasmittanza Uw</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                <span style={{fontSize:24,fontWeight:900,fontFamily:FM,color:uwC}}>{uwCalc.uw}</span>
                <span style={{fontSize:11,color:SUB}}>W/m²K</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:3}}>
                <div style={{background:uwC,color:"#fff",fontSize:10,fontWeight:800,padding:"1px 7px",borderRadius:4}}>{uwCalc.classeEnergetica}</div>
                <span style={{fontSize:10,color:SUB}}>Ug {uwCalc.ugMedio}</span>
              </div>
            </div>
            {([["Sup. tot.",`${Math.round(inf.larghezzaVano*inf.altezzaVano/10000)/100} m²`],
              ["ML telaio",`${mlTelaio.toFixed(2)} m`],["ML ante",`${mlAnte.toFixed(2)} m`],
              ["Peso vetri",`${pesi.pesoVetriKg} kg`],["Peso profili",`${pesi.pesoProfiliKg} kg`],
              ["Peso totale",`${pesi.pesoTotaleKg} kg`],
              ["Barre 6m",`${distinta.nBarre6m} pz`],["Sfrido",`${distinta.sfrido}%`],
            ] as [string,string][]).map(([l,v])=>(
              <div key={l} style={ROW}><span style={{fontSize:11,color:SUB}}>{l}</span><span style={{fontSize:12,fontWeight:700,fontFamily:FM}}>{v}</span></div>
            ))}
          </>}
          {tabRight==="distinta"&&<>
            {distinta.profili.map((p:any,i:number)=>(
              <div key={i} style={{padding:"5px 7px",background:"#F9FAFB",borderRadius:6,marginBottom:2}}>
                <div style={{fontSize:10,fontWeight:600,color:DARK}}>{p.descrizione}</div>
                <div style={{fontSize:9,color:SUB,fontFamily:FM}}>{p.lunghezzaMm}mm×{p.quantita} · <span style={{color:AMBER}}>€{p.costoTot}</span></div>
                {p.barraAssegnata&&<div style={{fontSize:9,color:TEAL}}>Barra {p.barraAssegnata}@{p.offsetMm}mm</div>}
              </div>
            ))}
            {distinta.vetri.map((v:any,i:number)=>(
              <div key={i} style={{padding:"5px 7px",background:"#F0FDF4",borderRadius:6,marginBottom:2}}>
                <div style={{fontSize:10,fontWeight:600,color:DARK}}>{v.tipo}</div>
                <div style={{fontSize:9,color:SUB,fontFamily:FM}}>{v.mq.toFixed(3)}m² · <span style={{color:TEAL}}>€{v.costoTot}</span></div>
              </div>
            ))}
          </>}
          {tabRight==="regole"&&(violazioni.length===0
            ?<div style={{padding:"12px",background:"#F0FDF4",borderRadius:8,fontSize:12,color:TEAL,fontWeight:600,textAlign:"center" as any}}>✓ OK</div>
            :violazioni.map((v:any,i:number)=>(
              <div key={i} style={{padding:"7px 10px",background:v.severita==="errore"?"#FEF2F2":"#FEF3C7",borderRadius:8,border:`1px solid ${v.severita==="errore"?"#FCA5A5":"#FCD34D"}`}}>
                <div style={{fontSize:11,fontWeight:700,color:v.severita==="errore"?RED:"#92400E"}}>{v.severita==="errore"?"⛔":"⚠"} {v.cellaId}</div>
                <div style={{fontSize:10,marginTop:2}}>{v.messaggio}</div>
              </div>
            ))
          )}
        </div>
        <div style={{borderTop:`1px solid ${BDR}`,padding:"10px 12px",flexShrink:0,background:"#FAFAFA"}}>
          <div style={{fontSize:10,fontWeight:700,color:SUB,textTransform:"uppercase",marginBottom:6}}>Preventivo</div>
          {([["Profili",`€${distinta.costoProfilatoTot.toLocaleString("it-IT")}`],["Vetri",`€${distinta.costoVetriTot.toLocaleString("it-IT")}`],["Ferramenta",`€${distinta.costoFerramentaTot.toLocaleString("it-IT")}`]] as [string,string][]).map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:SUB}}>{l}</span><span style={{fontSize:11,fontWeight:600,fontFamily:FM}}>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:6,borderTop:`1px solid ${BDR}`,marginTop:2}}>
            <span style={{fontSize:11,fontWeight:700}}>Vendita ×2.4</span>
            <span style={{fontSize:17,fontWeight:900,fontFamily:FM,color:AMBER}}>€{Math.round(distinta.costoTot*2.4).toLocaleString("it-IT")}</span>
          </div>
          <button onClick={()=>onUpdate?.({infisso:inf,distinta,pesi,uw:uwCalc})}
            style={{marginTop:8,width:"100%",padding:"8px 0",border:"none",borderRadius:8,background:haErrori(violazioni)?RED:TEAL,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>
            {haErrori(violazioni)?"⛔ Errori tecnici":"✓ Salva configurazione"}
          </button>
        </div>
      </div>
    </div>
  );
}
