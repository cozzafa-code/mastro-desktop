"use client";
// @ts-nocheck
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
// MASTRO ERP - RiepilogoPanel
// Estratto S8: ~569 righe (Riepilogo commessa)
// ÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉÔòÉ
import React from "react";
import { useMastro } from "./MastroContext";
import { FM, ICO, Ico, TIPOLOGIE_RAPIDE } from "./mastro-constants";


// ─── Lumina Design Tokens ────────────────────────────────
const L = {
  bg:          "#f9f9fb",
  surface:     "#ffffff",
  surfaceLow:  "#f3f3f5",
  surfaceMid:  "#eeeef0",
  primary:     "#031631",
  primaryCont: "#1a2b47",
  onPrimary:   "#ffffff",
  muted:       "#8293b4",
  text:        "#1a1c1d",
  sub:         "#44474d",
  placeholder: "#75777e",
  green:       "#1a9e73",
  red:         "#dc4444",
  amber:       "#e4c18c",
  amberBg:     "#ffdeac",
  border:      "rgba(197,198,206,0.25)",
  glass:       "rgba(255,255,255,0.85)",
} as const;
const SH = {
  ambient: "0 20px 40px rgba(26,28,29,0.04)",
  float:   "0 20px 40px rgba(26,28,29,0.08)",
  sm:      "0 2px 8px rgba(26,28,29,0.05)",
} as const;
// ─────────────────────────────────────────────────────────
export default function RiepilogoPanel() {
  const {
    T, S, isDesktop, fs, PIPELINE,
    selectedCM, problemi,
    getVaniAttivi, setShowRiepilogo,
  } = useMastro();

  if (!selectedCM) return null;
    const c = selectedCM;
    if (!c) return null;
    const today = new Date().toLocaleDateString("it-IT",{day:"2-digit",month:"2-digit",year:"numeric"});
    const vaniR = getVaniAttivi(c); const vaniFilled = vaniR.filter(v=>Object.values(v.misure||{}).filter(x=>(x as number)>0).length>=6).length;
    const fuoriSqN = vaniR.filter(v=>{const d=(v.misure?.d1 as number)>0&&(v.misure?.d2 as number)>0?Math.abs(v.misure.d1-v.misure.d2):null;return (d as number)>5;}).length;
    const totPezzi = vaniR.reduce((s,v) => s + (v.pezzi||1), 0);
    const probAperti = problemi.filter(p => p.commessaId === c.id && p.stato !== "risolto");

    // Info rilievo attivo
    const rilAttivo = c.rilievi?.find(r => r.vani?.length > 0);

    const SEP = "─────────────────────────────";
    const waMsg = [
      "📋 *RIEPILOGO COMMESSA "+c.code+"*",
      "📅 "+today+" → Fase: *"+(PIPELINE.find(p=>p.id===c.fase)?.nome||c.fase).toUpperCase()+"*",
      SEP,
      "",
      "👤 *CLIENTE*",
      c.cliente+" "+(c.cognome||""),
      c.telefono?"📞 "+c.telefono:"",
      c.email?"📧 "+c.email:"",
      "📍 "+c.indirizzo,
      [c.pianoEdificio?"🏢 "+c.pianoEdificio:"", c.mezzoSalita?"Salita: "+c.mezzoSalita:"", c.foroScale?"Foro scale: "+c.foroScale:"", c.difficoltaSalita?"Difficoltá: "+c.difficoltaSalita:""].filter(Boolean).join(" → "),
      "",
      "⚙️ *CONFIGURAZIONE*",
      c.sistema?"Sistema: *"+c.sistema+"*":"",
      "Tipo: "+(c.tipo==="riparazione"?"Riparazione":"Nuova installazione"),
      "",
      rilAttivo?"🔧 *RILIEVO*":"",
      rilAttivo?("Data: "+(rilAttivo.data||rilAttivo.dataRilievo||"")+" → Rilevatore: "+(rilAttivo.rilevatore||"")):"",
      rilAttivo&&rilAttivo.note?"Note rilievo: "+rilAttivo.note:"",
      "",
      "📊 *RIEPILOGO: "+vaniR.length+" vani → "+totPezzi+" pezzi totali*",
      vaniFilled < vaniR.length ? "⚠️ "+(vaniR.length - vaniFilled)+" vani incompleti" : "✓ Tutti i vani completi",
      fuoriSqN > 0 ? "⚠️ "+fuoriSqN+" vani fuorisquadra" : "",
      SEP,
      "",
      ...vaniR.map((v,i)=>{
        const m=v.misure||{};
        const tl=TIPOLOGIE_RAPIDE.find(tp=>tp.code===v.tipo)?.label||v.tipo||"-";
        const diff=m.d1>0&&m.d2>0?Math.abs(m.d1-m.d2):null;
        const fuori=diff!==null&&(diff as number)>5;
        const ct = v.controtelaio || {};
        const lines=[
          SEP,
          "*"+(i+1)+". "+v.nome.toUpperCase()+"*"+(v.pezzi>1?" x *"+v.pezzi+" PZ*":""),
          tl+" → "+v.tipo+" → "+(v.stanza||"")+" → "+(v.piano||"")+" "+(fuori?"Üá":"£à"),
          SEP,
          "",
          "📐 *MISURE VANO*",
          "L: "+(m.lAlto||"-")+" / *"+(m.lCentro||"-")+"* / "+(m.lBasso||"-")+" mm",
          "H: "+(m.hSx||"-")+" / *"+(m.hCentro||"-")+"* / "+(m.hDx||"-")+" mm",
          "",
          (m.d1>0||m.d2>0)?"Ôåx *DIAGONALI*":"",
          (m.d1>0&&m.d2>0)
            ?(fuori?"Üá D1: "+m.d1+" / D2: "+m.d2+"  *FUORI SQUADRA "+diff+"mm*":"D1: "+m.d1+" / D2: "+m.d2+" £à OK")
            :(m.d1>0?"D1: "+m.d1+" (D2 mancante)":""),
          "",
          (m.spSx>0||m.spDx>0||m.spSopra>0||m.spSotto>0)?"Ô¼ø *SPALLETTE*":"",
          (m.spSx>0||m.spDx>0||m.spSopra>0||m.spSotto>0)?[
            m.spSx?"Sx: "+m.spSx:"",
            m.spDx?"Dx: "+m.spDx:"",
            m.spSopra?"Sopra: "+m.spSopra:"",
            m.spSotto?"Sotto: "+m.spSotto:"",
          ].filter(Boolean).join(" → ")+" mm":"",
          m.davanzale?"📏 Davanzale: "+m.davanzale+" mm":"",
          m.soglia?"📏 Soglia: "+m.soglia+" mm":"",
          "",
          "🪟 *PRODOTTO*",
          v.sistema?"Sistema: *"+v.sistema+"*":"⚠️ Sistema NON specificato",
          v.vetro?"Vetro: "+v.vetro:"",
          v.coloreInt?"🎨 Colore: "+(v.bicolore?"INT: *"+v.coloreInt+"* / EST: *"+(v.coloreEst||"-")+"*":"*"+v.coloreInt+"*"):"⚠️ Colore NON specificato",
          v.coloreAcc?"Colore accessori: "+v.coloreAcc:"",
          "",
          (v.telaio||v.rifilato)?"🔧 *TELAIO*":"",
          v.telaio?"Tipo: "+v.telaio+(v.telaioAlaZ?" → Ala Z: "+v.telaioAlaZ+"mm":""):"",
          v.rifilato?("Rifilatura: "+(v.rifilSx?"Sx:"+v.rifilSx:"")+(v.rifilDx?" Dx:"+v.rifilDx:"")+(v.rifilSopra?" Sop:"+v.rifilSopra:"")+(v.rifilSotto?" Sot:"+v.rifilSotto:"")+" mm"):"",
          "",
          (v.coprifilo||v.lamiera)?"🔩 *FINITURA*":"",
          v.coprifilo?"Coprifilo: "+v.coprifilo:"",
          v.lamiera?"Lamiera: "+v.lamiera:"",
          "",
          ct.tipo?"*CONTROTELAIO*":"",
          ct.tipo?("Tipo: "+(ct.tipo==="singolo"?"Singolo":ct.tipo==="doppio"?"Doppio":"Con cassonetto")):"",
          ct.tipo?(ct.l&&ct.h?"Dimensioni CT: "+ct.l+"x"+ct.h+" mm"+(ct.prof?" → Prof: "+ct.prof+" mm":""):""):"",
          ct.tipo&&ct.offset?"Offset: "+ct.offset+" mm/lato":"",
          ct.tipo&&ct.infissoL?"åÆ Infisso calcolato: "+ct.infissoL+"x"+ct.infissoH+" mm":"",
          ct.tipo==="cassonetto"&&ct.casH?"Cassonetto: H "+ct.casH+"xP "+(ct.casP||"")+" mm":"",
          ct.tipo==="cassonetto"&&ct.cielino?"Cielino: "+ct.cielino:"",
          "",
          v.cassonetto?"📦 *CASSONETTO ESTERNO*":"",
          v.cassonetto?((m.casL||"")+"x"+(m.casH||"")+"x"+(m.casP||"")+" mm"+(v.casTipo?" → "+v.casTipo:"")):"",
          "",
          "⚙️ *ACCESSORI*",
          v.accessori?.tapparella?.attivo?("¼ç Tapparella: "+(v.accessori.tapparella.colore||"")+" → "+(v.accessori.tapparella.l||"")+"x"+(v.accessori.tapparella.h||"")+" mm"+(v.accessori.tapparella.motorizzata?" → MOTORIZZATA":"")):"¼ç Tapparella: NO",
          v.accessori?.persiana?.attivo?("🪟 Persiana: "+(v.accessori.persiana.colore||"")+(v.accessori.persiana.tipo?" → "+v.accessori.persiana.tipo:"")):"🪟 Persiana: NO",
          v.accessori?.zanzariera?.attivo?("🦟 Zanzariera: "+(v.accessori.zanzariera.l||"")+"x"+(v.accessori.zanzariera.h||"")+" mm"+(v.accessori.zanzariera.tipo?" → "+v.accessori.zanzariera.tipo:"")):"🦟 Zanzariera: NO",
          "",
          v.note?"📝 *NOTE VANO:* "+v.note:"",
          fuori?"⚠️ *ATTENZIONE: FUORISQUADRA - Verificare con muratore prima dell'ordine*":"",
        ].filter(x=>x!==undefined&&x!==null&&x!=="");
        return lines.join("\n");
      }),
      SEP,
      "",
      probAperti.length > 0 ? "⚠️ *PROBLEMI APERTI ("+probAperti.length+")*" : "",
      ...probAperti.map(p => "• "+p.titolo+" ("+(p.tipo||"")+" → "+(p.priorita==="alta"?"­ƒALTA":p.priorita==="media"?"­ƒƒá MEDIA":"Ü¬ BASSA")+")"+(p.descrizione?"  "+p.descrizione:"")),
      probAperti.length > 0 ? "" : "",
      c.note?"📝 *NOTE GENERALI*\n"+c.note+"\n"+SEP:"",
      c.tecnicoMisure?"👤 Tecnico: "+c.tecnicoMisure:"",
      c.dataRilievo?"📅 Data rilievo: "+c.dataRilievo:"",
      "",
      SEP,
      "📊 Totale: *"+vaniR.length+"* vani → *"+totPezzi+"* pezzi"+(fuoriSqN>0?" → Üá *"+fuoriSqN+"* fuorisquadra":""),
      "",
      "_Generato con MASTRO → "+today+"_",
    ].filter(Boolean).join("\n");

    const BLU="#2563eb", VRD="#059669", ROS="#dc2626", GRY="#94a3b8", AMB="#d97706", VIO="#7c3aed";
    const FM="'DM Mono',monospace";

    // Disegno SVG per ogni tipologia
    const DrawVano = ({v}) => {
      const m = v.misure||{};
      const lc = m.lCentro||0, hc = m.hCentro||0, hasM = lc>0&&hc>0;
      const diff = m.d1>0&&m.d2>0 ? Math.abs(m.d1-m.d2) : null;
      const fuori = diff!==null && diff>5;
      const t = v.tipo||"";
      // dimensioni fisse proporzionate al tipo
      const isPorta = t==="PF1A"||t==="PF2A"||t==="PF3A"||t==="PF4A"||t==="BLI"||t==="PF2AFISDX"||t==="PF2AFISSX";
      const isSC = t==="SC2A"||t==="SC4A"||t==="SCRDX"||t==="SCRSX"||t==="ALZDX"||t==="ALZSX"||t==="ALZSC";
      const W = isSC ? 260 : (t==="F4A"||t==="PF4A"||t==="SC4A") ? 340 : (t==="F3A"||t==="PF3A"||t==="F2AFISDX"||t==="F2AFISSX"||t==="PF2AFISDX"||t==="PF2AFISSX") ? 300 : (t==="F2A"||t==="PF2A"||t==="PERS2A") ? 220 : 160;
      const H = isPorta ? 240 : 160;
      const BW = 6; // bordo telaio fisso
      const GX = BW+10, GY = BW+10; // inizio vetro/anta
      const GW = W-GX*2, GH = H-GY*2;
      const cx = W/2, cy = H/2;
      const F = "monospace";
      const OR = "#e09010"; // arancio OB

      // Anta singola (riusabile)
      const anta1 = (ax,ay,aw,ah,ob,hingeLeft) => {
        const elems = [];
        elems.push(<rect key="v" x={ax} y={ay} width={aw} height={ah} fill="#ddeefa"/>);
        elems.push(<rect key="p" x={ax} y={ay} width={aw} height={ah} fill="none" stroke="#333" strokeWidth={1.2}/>);
        // triangolo: apice al centro del lato di apertura (opposto al cardine)
        if(hingeLeft) {
          // cardine SX ÔåÆ apice centro-DX
          elems.push(<line key="t1" x1={ax} y1={ay} x2={ax+aw} y2={ay+ah/2} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>);
          elems.push(<line key="t2" x1={ax} y1={ay+ah} x2={ax+aw} y2={ay+ah/2} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>);
          if(ob) {
            // OB aggiunge V vasistas in arancio (apice centro-basso)
            elems.push(<line key="ob1" x1={ax} y1={ay} x2={ax+aw/2} y2={ay+ah} stroke={OR} strokeWidth={1.2} strokeDasharray="8,4"/>);
            elems.push(<line key="ob2" x1={ax+aw} y1={ay} x2={ax+aw/2} y2={ay+ah} stroke={OR} strokeWidth={1.2} strokeDasharray="8,4"/>);
          }
          elems.push(<rect key="m" x={ax+aw-5} y={ay+ah/2-9} width={5} height={18} fill="white" stroke="#444" strokeWidth={0.8}/>);
        } else {
          // cardine DX ÔåÆ apice centro-SX
          elems.push(<line key="t1" x1={ax+aw} y1={ay} x2={ax} y2={ay+ah/2} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>);
          elems.push(<line key="t2" x1={ax+aw} y1={ay+ah} x2={ax} y2={ay+ah/2} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>);
          if(ob) {
            elems.push(<line key="ob1" x1={ax} y1={ay} x2={ax+aw/2} y2={ay+ah} stroke={OR} strokeWidth={1.2} strokeDasharray="8,4"/>);
            elems.push(<line key="ob2" x1={ax+aw} y1={ay} x2={ax+aw/2} y2={ay+ah} stroke={OR} strokeWidth={1.2} strokeDasharray="8,4"/>);
          }
          elems.push(<rect key="m" x={ax} y={ay+ah/2-9} width={5} height={18} fill="white" stroke="#444" strokeWidth={0.8}/>);
        }
        return elems;
      };

      let body = null;

      if (t==="F1A"||t==="PF1A") {
        body = anta1(GX,GY,GW,GH,false,true);
      } else if (t==="F2A"||t==="PF2A") {
        const hw = Math.floor((GW-8)/2);
        body = [
          <rect key="mont" x={GX+hw} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          ...anta1(GX, GY, hw, GH, false, true).map((e,i)=><g key={"l"+i}>{e}</g>),
          ...anta1(GX+hw+8, GY, GW-hw-8, GH, false, false).map((e,i)=><g key={"r"+i}>{e}</g>),
        ];
      } else if (t==="F3A"||t==="PF3A") {
        const tw = Math.floor((GW-16)/3);
        body = [
          <rect key="m1" x={GX+tw} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          <rect key="m2" x={GX+tw*2+8} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          ...anta1(GX, GY, tw, GH, true, true).map((e,i)=><g key={"a"+i}>{e}</g>),
          ...anta1(GX+tw+8, GY, tw, GH, false, true).map((e,i)=><g key={"b"+i}>{e}</g>),
          ...anta1(GX+tw*2+16, GY, tw, GH, true, false).map((e,i)=><g key={"c"+i}>{e}</g>),
        ];
      } else if (t==="F4A"||t==="PF4A") {
        const qw = Math.floor((GW-24)/4);
        body = [
          <rect key="m1" x={GX+qw} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          <rect key="m2" x={GX+qw*2+8} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          <rect key="m3" x={GX+qw*3+16} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          ...anta1(GX, GY, qw, GH, false, true).map((e,i)=><g key={"a"+i}>{e}</g>),
          ...anta1(GX+qw+8, GY, qw, GH, false, false).map((e,i)=><g key={"b"+i}>{e}</g>),
          ...anta1(GX+qw*2+16, GY, qw, GH, false, true).map((e,i)=><g key={"c"+i}>{e}</g>),
          ...anta1(GX+qw*3+24, GY, qw, GH, false, false).map((e,i)=><g key={"d"+i}>{e}</g>),
        ];
      } else if (t==="F2AFISDX"||t==="PF2AFISDX") {
        const tw = Math.floor((GW-16)/3);
        body = [
          <rect key="m1" x={GX+tw} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          <rect key="m2" x={GX+tw*2+8} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          ...anta1(GX, GY, tw, GH, false, true).map((e,i)=><g key={"a"+i}>{e}</g>),
          ...anta1(GX+tw+8, GY, tw, GH, false, false).map((e,i)=><g key={"b"+i}>{e}</g>),
          <rect key="fix" x={GX+tw*2+16} y={GY} width={tw} height={GH} fill="#ddeefa"/>,
          <rect key="fixb" x={GX+tw*2+16} y={GY} width={tw} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
          <text key="fixt" x={GX+tw*2+16+tw/2} y={cy+4} textAnchor="middle" fontSize={8} fill="#888" fontFamily={F}>FISSO</text>,
        ];
      } else if (t==="F2AFISSX"||t==="PF2AFISSX") {
        const tw = Math.floor((GW-16)/3);
        body = [
          <rect key="m1" x={GX+tw} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          <rect key="m2" x={GX+tw*2+8} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          <rect key="fix" x={GX} y={GY} width={tw} height={GH} fill="#ddeefa"/>,
          <rect key="fixb" x={GX} y={GY} width={tw} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
          <text key="fixt" x={GX+tw/2} y={cy+4} textAnchor="middle" fontSize={8} fill="#888" fontFamily={F}>FISSO</text>,
          ...anta1(GX+tw+8, GY, tw, GH, false, true).map((e,i)=><g key={"a"+i}>{e}</g>),
          ...anta1(GX+tw*2+16, GY, tw, GH, false, false).map((e,i)=><g key={"b"+i}>{e}</g>),
        ];
      } else if (t==="PERS1A") {
        body = [
          <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#e8f5e9"/>,
          <rect key="p" x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
          ...Array.from({length:8}).map((_,i)=><line key={"sl"+i} x1={GX} y1={GY+GH*i/8} x2={GX+GW} y2={GY+GH*i/8} stroke="#66bb6a" strokeWidth={0.6}/>),
          <line key="t1" x1={GX} y1={GY} x2={GX+GW} y2={cy} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <line key="t2" x1={GX} y1={GY+GH} x2={GX+GW} y2={cy} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
        ];
      } else if (t==="PERS2A") {
        const hw = Math.floor((GW-8)/2);
        body = [
          <rect key="m" x={GX+hw} y={0} width={8} height={H} fill="white" stroke="#333" strokeWidth={2}/>,
          <rect key="vl" x={GX} y={GY} width={hw} height={GH} fill="#e8f5e9"/>,
          <rect key="vr" x={GX+hw+8} y={GY} width={GW-hw-8} height={GH} fill="#e8f5e9"/>,
          ...Array.from({length:8}).map((_,i)=><line key={"sl"+i} x1={GX} y1={GY+GH*i/8} x2={GX+hw} y2={GY+GH*i/8} stroke="#66bb6a" strokeWidth={0.6}/>),
          ...Array.from({length:8}).map((_,i)=><line key={"sr"+i} x1={GX+hw+8} y1={GY+GH*i/8} x2={GX+GW} y2={GY+GH*i/8} stroke="#66bb6a" strokeWidth={0.6}/>),
          <rect key="pl" x={GX} y={GY} width={hw} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
          <rect key="pr" x={GX+hw+8} y={GY} width={GW-hw-8} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
        ];
      } else if (t==="MONO") {
        body = [
          <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#e3f2fd"/>,
          <rect key="p" x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
          <rect key="cas" x={GX} y={GY-12} width={GW} height={12} fill="#fff8e1" stroke="#ca8a04" strokeWidth={0.6}/>,
          <text key="ct" x={cx} y={GY-4} textAnchor="middle" fontSize={6} fill="#92400e" fontFamily={F} fontWeight="700">CASSONETTO</text>,
          <rect key="tap" x={GX+GW-8} y={GY} width={8} height={GH} fill="#ffecb3" stroke="#ff8f00" strokeWidth={0.5}/>,
          <text key="tt" x={cx} y={cy+4} textAnchor="middle" fontSize={10} fill="#666" fontFamily={F}>MONO</text>,
        ];
      } else if (t==="TAPP") {
        body = [
          <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#fff8e1"/>,
          <rect key="p" x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
          ...Array.from({length:12}).map((_,i)=><line key={"h"+i} x1={GX+2} y1={GY+GH*i/12} x2={GX+GW-2} y2={GY+GH*i/12} stroke="#ff8f00" strokeWidth={0.8}/>),
          <text key="tt" x={cx} y={cy+4} textAnchor="middle" fontSize={9} fill="#e65100" fontFamily={F} fontWeight="700">TAPPARELLA</text>,
        ];
      } else if (t==="ZANZ") {
        body = [
          <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#f3e5f5"/>,
          <rect key="p" x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
          ...Array.from({length:6}).map((_,i)=><line key={"hh"+i} x1={GX+2} y1={GY+GH*i/6} x2={GX+GW-2} y2={GY+GH*i/6} stroke="#ce93d8" strokeWidth={0.4}/>),
          ...Array.from({length:6}).map((_,i)=><line key={"vv"+i} x1={GX+GW*i/6} y1={GY+2} x2={GX+GW*i/6} y2={GY+GH-2} stroke="#ce93d8" strokeWidth={0.4}/>),
          <text key="tt" x={cx} y={cy+4} textAnchor="middle" fontSize={9} fill="#7b1fa2" fontFamily={F} fontWeight="700">ZANZARIERA</text>,
        ];
      } else if (t==="SC2A"||t==="SC4A"||t==="SCRDX"||t==="SCRSX") {
        const hw = Math.floor(GW/2);
        body = [
          <line key="bt" x1={GX} y1={GY-3} x2={GX+GW} y2={GY-3} stroke="#666" strokeWidth={2}/>,
          <line key="bb" x1={GX} y1={GY+GH+3} x2={GX+GW} y2={GY+GH+3} stroke="#666" strokeWidth={2}/>,
          <rect key="la" x={GX} y={GY} width={hw} height={GH} fill="#ddeefa" stroke="#333" strokeWidth={1.5}/>,
          <rect key="lb" x={GX+hw} y={GY} width={GW-hw} height={GH} fill="#ddeefa" fillOpacity={0.4} stroke="#555" strokeWidth={0.8} strokeDasharray="5,3"/>,
          <rect key="mh" x={GX+hw-4} y={cy-9} width={4} height={18} fill="white" stroke="#444" strokeWidth={0.8}/>,
          <line key="ar" x1={GX+hw+14} y1={cy} x2={GX+hw+GW*0.35} y2={cy} stroke="#1a56db" strokeWidth={1.2}/>,
          <polygon key="ap" points={(GX+hw+GW*0.35)+","+(cy-4)+" "+(GX+hw+GW*0.35)+","+(cy+4)+" "+(GX+hw+GW*0.35+8)+","+cy} fill="#1a56db"/>,
        ];
      } else if (t==="ALZDX"||t==="ALZSX"||t==="ALZSC") {
        const hw = Math.floor(GW/2);
        body = [
          <line key="bt" x1={GX} y1={GY-3} x2={GX+GW} y2={GY-3} stroke="#666" strokeWidth={2}/>,
          <line key="bb" x1={GX} y1={GY+GH+3} x2={GX+GW} y2={GY+GH+3} stroke="#666" strokeWidth={2}/>,
          <rect key="la" x={GX} y={GY} width={hw} height={GH} fill="#ddeefa" stroke="#333" strokeWidth={1.5}/>,
          <rect key="lb" x={GX+hw} y={GY} width={GW-hw} height={GH} fill="#ddeefa" fillOpacity={0.4} stroke="#555" strokeWidth={0.8} strokeDasharray="5,3"/>,
          <line key="av" x1={GX+hw+GW*0.22} y1={cy+12} x2={GX+hw+GW*0.22} y2={cy-14} stroke="#1a56db" strokeWidth={1.2}/>,
          <polygon key="ap" points={(GX+hw+GW*0.22-4)+","+(cy-10)+" "+(GX+hw+GW*0.22+4)+","+(cy-10)+" "+(GX+hw+GW*0.22)+","+(cy-18)} fill="#1a56db"/>,
        ];
      } else if (t==="VAS") {
        body = [
          <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#ddeefa"/>,
          <rect key="p" x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
          <line key="v1" x1={GX} y1={GY} x2={cx} y2={GY+GH} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <line key="v2" x1={GX+GW} y1={GY} x2={cx} y2={GY+GH} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <rect key="m" x={cx-12} y={GY+GH-4} width={24} height={4} fill="white" stroke="#444" strokeWidth={0.8}/>,
        ];
      } else if (t==="RIBALTA") {
        body = [
          <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#ddeefa"/>,
          <rect key="p" x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
          <line key="v1" x1={GX} y1={GY+GH} x2={cx} y2={GY} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <line key="v2" x1={GX+GW} y1={GY+GH} x2={cx} y2={GY} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <rect key="m" x={cx-12} y={GY} width={24} height={4} fill="white" stroke="#444" strokeWidth={0.8}/>,
        ];
      } else if (t==="BLI") {
        body = [
          <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#ddeefa"/>,
          <rect key="p" x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#333" strokeWidth={2}/>,
          <line key="t1" x1={GX} y1={GY} x2={GX+GW} y2={cy} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <line key="t2" x1={GX} y1={GY+GH} x2={GX+GW} y2={cy} stroke="#333" strokeWidth={1} strokeDasharray="8,4"/>,
          <rect key="m" x={GX+GW-5} y={cy-11} width={5} height={22} fill="white" stroke="#444" strokeWidth={0.8}/>,
          <circle key="mk" cx={GX+GW-3} cy={cy} r={5} fill="white" stroke="#333" strokeWidth={1.2}/>,
        ];
      } else if (t==="FISDX"||t==="FISSX"||t==="SOPR") {
        body = [<rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#ddeefa"/>];
      } else {
        const tipObj = TIPOLOGIE_RAPIDE.find(tp => tp.code === t);
        const forma = tipObj?.forma || "rettangolare";
        if (forma === "fuorisquadro") {
          // Usa H sx e H dx reali per proporzionare il disegno
          const hL = m.hSx || m.hCentro || hc || GH;
          const hR = m.hDx || m.hCentro || hc || GH;
          const maxH = Math.max(hL, hR, 1);
          const scaledHL = (hL / maxH) * GH;
          const scaledHR = (hR / maxH) * GH;
          const topL = GY + GH - scaledHL;
          const topR = GY + GH - scaledHR;
          const btm = GY + GH;
          body = [
            <polygon key="v" points={`${GX},${topL} ${GX+GW},${topR} ${GX+GW},${btm} ${GX},${btm}`} fill="#ddeefa" stroke="#333" strokeWidth={1.2}/>,
            // Diagonale in rosso
            <line key="diag" x1={GX} y1={topL} x2={GX+GW} y2={btm} stroke="#c62828" strokeWidth={1} strokeDasharray="6,3"/>,
            // Quote H1 e H2 sui lati
            <text key="h1" x={GX-2} y={(topL+btm)/2} textAnchor="end" fontSize={8} fill="#c62828" fontFamily={F} fontWeight="700">{"H1\n"+(m.hSx||"")}</text>,
            <text key="h2" x={GX+GW+2} y={(topR+btm)/2} textAnchor="start" fontSize={8} fill="#1565c0" fontFamily={F} fontWeight="700">{"H2\n"+(m.hDx||"")}</text>,
            // Label tipo
            <text key="tx" x={cx} y={btm-8} textAnchor="middle" fontSize={9} fill="#555" fontFamily={F} fontWeight="600">{t}</text>,
            // Differenza fuorisquadro
            ...(hL !== hR ? [<text key="diff" x={cx} y={Math.min(topL,topR)-4} textAnchor="middle" fontSize={7} fill="#c62828" fontFamily={F} fontWeight="700">{" "+Math.abs(hL-hR)+"mm"}</text>] : []),
          ];
        } else if (forma === "arco") {
          body = [
            <path key="v" d={`M${GX},${GY+GH} L${GX},${GY+GH*0.35} Q${GX},${GY} ${cx},${GY} Q${GX+GW},${GY} ${GX+GW},${GY+GH*0.35} L${GX+GW},${GY+GH} Z`} fill="#ddeefa" stroke="#333" strokeWidth={1.2}/>,
            <text key="tx" x={cx} y={cy+10} textAnchor="middle" fontSize={9} fill="#555" fontFamily={F} fontWeight="600">{t}</text>
          ];
        } else if (forma === "trapezio") {
          const inset = GW * 0.15;
          body = [
            <polygon key="v" points={`${GX+inset},${GY} ${GX+GW-inset},${GY} ${GX+GW},${GY+GH} ${GX},${GY+GH}`} fill="#ddeefa" stroke="#333" strokeWidth={1.2}/>,
            <text key="tx" x={cx} y={cy+4} textAnchor="middle" fontSize={9} fill="#555" fontFamily={F} fontWeight="600">{t}</text>
          ];
        } else if (forma === "triangolo") {
          body = [
            <polygon key="v" points={`${cx},${GY} ${GX+GW},${GY+GH} ${GX},${GY+GH}`} fill="#ddeefa" stroke="#333" strokeWidth={1.2}/>,
            <text key="tx" x={cx} y={GY+GH-10} textAnchor="middle" fontSize={9} fill="#555" fontFamily={F} fontWeight="600">{t}</text>
          ];
        } else if (forma === "oblo") {
          const r = Math.min(GW, GH) / 2;
          body = [
            <circle key="v" cx={cx} cy={cy} r={r} fill="#ddeefa" stroke="#333" strokeWidth={1.2}/>,
            <text key="tx" x={cx} y={cy+4} textAnchor="middle" fontSize={9} fill="#555" fontFamily={F} fontWeight="600">{t}</text>
          ];
        } else if (forma === "sagomato") {
          body = [
            <path key="v" d={`M${GX},${GY+GH} L${GX},${GY+GH*0.25} Q${GX},${GY} ${GX+GW*0.3},${GY} L${GX+GW*0.7},${GY} Q${GX+GW},${GY+GH*0.15} ${GX+GW},${GY+GH*0.4} L${GX+GW},${GY+GH*0.7} Q${GX+GW*0.8},${GY+GH} ${GX+GW*0.5},${GY+GH} Z`} fill="#ddeefa" stroke="#333" strokeWidth={1.2}/>,
            <text key="tx" x={cx} y={cy+4} textAnchor="middle" fontSize={8} fill="#555" fontFamily={F} fontWeight="600">{t}</text>,
            <text key="tx2" x={cx} y={cy+14} textAnchor="middle" fontSize={6} fill="#999" fontFamily={F}>SAGOMATO</text>
          ];
        } else {
          body = [
            <rect key="v" x={GX} y={GY} width={GW} height={GH} fill="#ddeefa"/>,
            <rect key="p" x={GX} y={GY} width={GW} height={GH} fill="none" stroke="#333" strokeWidth={1.2}/>,
            <text key="tx" x={cx} y={cy+4} textAnchor="middle" fontSize={10} fill="#888" fontFamily={F}>{t||"?"}</text>
          ];
        }
      }

      // soglia per porte
      const hasSoglia = isPorta || t==="SC2A"||t==="SC4A"||t==="ALZDX"||t==="ALZSX";

      return (
        <svg viewBox={"-18 -2 "+(W+22)+" "+(H+4)} width="100%" style={{display:"block",background:"white",border:"1px solid #ddd",borderRadius:3}}>
          {/* cassonetto */}
          {v.cassonetto&&<rect x={0} y={-14} width={W} height={14} fill="#fffde7" stroke="#ca8a04" strokeWidth={0.8}/>}
          {v.cassonetto&&<text x={cx} y={-4} textAnchor="middle" fontSize={6} fill="#92400e" fontFamily={F} fontWeight="700">{"CASS. "+(v.misure?.casL||"")+"x"+(v.misure?.casH||"")+"x"+(v.misure?.casP||"")}</text>}
          {/* telaio fisso */}
          <rect x={1} y={1} width={W-2} height={H-2} fill="white" stroke="#333" strokeWidth={BW}/>
          {/* soglia */}
          {hasSoglia&&<line x1={1} y1={H-BW/2} x2={W-1} y2={H-BW/2} stroke="#333" strokeWidth={3}/>}
          {/* corpo */}
          {body}
          {/* quadratura: solo badge, no linee */}
          {fuori&&<rect x={cx-26} y={cy-9} width={52} height={18} rx={3} fill="#dc2626"/>}
          {fuori&&<text x={cx} y={cy+4} textAnchor="middle" fontSize={9} fill="white" fontFamily={F} fontWeight="700">{"⚠ +"+diff+"mm"}</text>}
          {!fuori&&diff!==null&&<rect x={cx-18} y={cy-7} width={36} height={14} rx={3} fill="#15803d"/>}
          {!fuori&&diff!==null&&<text x={cx} y={cy+4} textAnchor="middle" fontSize={8} fill="white" fontFamily={F} fontWeight="700">{"✓ sq."}</text>}
          {/* quote */}
          {hasM&&<rect x={cx-30} y={-1} width={60} height={16} rx={2} fill="#1d4ed8"/>}
          {hasM&&<text x={cx} y={12} textAnchor="middle" fontSize={10} fill="white" fontFamily={F} fontWeight="700">{lc}</text>}
          {hasM&&<rect x={-16} y={cy-20} width={18} height={40} rx={3} fill="#15803d"/>}
          {hasM&&<text x={-7} y={cy+4} textAnchor="middle" fontSize={9} fill="white" fontFamily={F} fontWeight="700" transform={"rotate(-90,-7,"+cy+")"}>{hc}</text>}
          {/* badge telaio/accessori */}
          {v.telaio&&<text x={GX+2} y={GY+9} fontSize={6} fill="#6d28d9" fontFamily={F} fontWeight="700">{"Tel."+v.telaio+(v.telaio==="Z"&&v.telaioAlaZ?" "+v.telaioAlaZ:"")}</text>}
          {v.accessori?.tapparella?.attivo&&<text x={GX+GW-2} y={GY+9} textAnchor="end" fontSize={6} fill="#d97706" fontFamily={F} fontWeight="700">TAP</text>}
          {v.accessori?.zanzariera?.attivo&&<text x={GX+GW-2} y={GY+17} textAnchor="end" fontSize={6} fill="#6d28d9" fontFamily={F} fontWeight="700">ZAN</text>}
        </svg>
      );
    };

    return (
      <div style={{paddingBottom:110,background:"#f1f5f9",minHeight:"100vh"}}>
        {/* Header */}
        <div style={{background:"#0f172a",padding:"13px 16px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10}}>
          <div onClick={()=>setShowRiepilogo(false)} style={{cursor:"pointer",padding:4}}>
            <Ico d={ICO.back} s={20} c="#64748b"/>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:800,color:"white"}}>Riepilogo Sopralluogo</div>
            <div style={{fontSize:10,color:"#64748b"}}>{c.code} → {c.cliente} {c.cognome||""} → {today}</div>
          </div>
          <div style={{padding:"4px 8px",borderRadius:6,background:vaniFilled===vaniR.length?"#16a34a":"#d97706",fontSize:10,fontWeight:700,color:"white"}}>{vaniFilled}/{vaniR.length} ✓</div>
        </div>

        <div style={{padding:"10px 12px"}}>
          {/* Dati cantiere */}
          <div style={{background:"white",borderRadius:10,border:"1px solid #e2e8f0",padding:"12px 14px",marginBottom:10,boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            <div style={{fontSize:9,fontWeight:800,color:BLU,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>📍 Dati Cantiere</div>
            <div style={{display:"grid",gridTemplateColumns:"80px 1fr",gap:"3px 8px",fontSize:11.5}}>
              <span style={{color:GRY,fontWeight:600}}>Cliente</span><span style={{fontWeight:700}}>{c.cliente} {c.cognome||""}</span>
              <span style={{color:GRY,fontWeight:600}}>Indirizzo</span><span>{c.indirizzo}</span>
              {c.telefono&&<><span style={{color:GRY,fontWeight:600}}>Tel</span><span>{c.telefono}</span></>}
              {c.pianoEdificio&&<><span style={{color:GRY,fontWeight:600}}>Piano</span><span style={{fontWeight:600}}>{c.pianoEdificio}</span></>}
              {c.mezzoSalita&&<><span style={{color:GRY,fontWeight:600}}>Salita</span><span>{c.mezzoSalita}</span></>}
              {c.sistema&&<><span style={{color:GRY,fontWeight:600}}>Sistema</span><span style={{fontWeight:700,color:BLU}}>{c.sistema}</span></>}
            </div>
            {c.note&&<div style={{marginTop:8,padding:"5px 8px",background:"#fffbeb",borderRadius:6,fontSize:11,color:"#713f12",borderLeft:"3px solid "+AMB}}>📝 {c.note}</div>}
          </div>

          {/* Vani */}
          {vaniR.map((v,vi)=>{
            const m=v.misure||{};
            const lc=m.lCentro||0, hc=m.hCentro||0;
            const diff=m.d1>0&&m.d2>0?Math.abs(m.d1-m.d2):null;
            const fuori=diff!==null&&(diff as number)>5;
            const misN=Object.values(m).filter(x=>(x as number)>0).length;
            const tipLabel=TIPOLOGIE_RAPIDE.find(tp=>tp.code===v.tipo)?.label||v.tipo||"-";
            return (
              <div key={v.id} style={{background:"white",borderRadius:10,border:"1.5px solid "+(fuori?"#fca5a5":"#e2e8f0"),marginBottom:10,overflow:"hidden"}}>
                {/* Header */}
                <div style={{padding:"8px 12px",background:fuori?"#fef2f2":"#0f172a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <span style={{fontSize:13,fontWeight:800,color:fuori?"#991b1b":"white"}}>{vi+1}. {v.nome}</span>
                    <span style={{fontSize:10,color:fuori?"#b91c1c":"#64748b",marginLeft:6}}>{tipLabel} → {v.stanza} → {v.piano}</span>
                  </div>
                  <div style={{display:"flex",gap:3}}>
                    {(v.pezzi||1)>1&&<span style={{padding:"2px 6px",borderRadius:3,background:"#7c3aed",color:"white",fontSize:8,fontWeight:800}}>x{v.pezzi} PZ</span>}
                    {fuori&&<span style={{padding:"2px 6px",borderRadius:3,background:ROS,color:"white",fontSize:8,fontWeight:800}}>⚠ +{diff}mm</span>}
                    <span style={{padding:"2px 6px",borderRadius:3,background:misN>=6?"#16a34a":"#d97706",color:"white",fontSize:8,fontWeight:700}}>{misN}mis</span>
                  </div>
                </div>

                <div style={{display:"flex"}}>
                  {/* SVG disegno */}
                  <div style={{width:"50%",padding:"10px 6px 8px 10px",borderRight:"1px solid #f1f5f9"}}>
                    <div style={{fontSize:7,fontWeight:700,color:GRY,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Schema</div>
                    <DrawVano v={v}/>
                  </div>

                  {/* Misure */}
                  <div style={{flex:1,padding:"10px 10px 8px 10px"}}>
                    <div style={{fontSize:7,fontWeight:700,color:GRY,textTransform:"uppercase",marginBottom:5}}>Misure (mm)</div>
                    {[["LARGH",BLU,[["Alto",m.lAlto],["CentroÔxÅ",m.lCentro],["Basso",m.lBasso]]],
                      ["ALT",VRD,[["Sx",m.hSx],["CentroÔxÅ",m.hCentro],["Dx",m.hDx]]]
                    ].map(([lbl,col,rows])=>(
                      <div key={lbl} style={{marginBottom:5}}>
                        <div style={{fontSize:7,fontWeight:800,color:col,marginBottom:2,display:"flex",alignItems:"center",gap:2}}>
                          <span style={{width:6,height:6,borderRadius:1,background:col,display:"inline-block"}}/>
                          {lbl}
                        </div>
                        {rows.map(([l,val])=>(
                          <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:10.5,padding:"1.5px 0",borderBottom:"1px solid #f8fafc"}}>
                            <span style={{color:GRY,fontSize:9.5}}>{l}</span>
                            <span style={{fontWeight:700,color:val?"#0f172a":"#e2e8f0",fontFamily:"'DM Mono',monospace"}}>{val||"-"}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {(m.d1>0||m.d2>0)&&<div style={{marginBottom:4}}>
                      <div style={{fontSize:7,fontWeight:800,color:fuori?ROS:VIO,marginBottom:2}}>DIAG. {fuori?"⚠ +"+diff:"✓"}</div>
                      {[["D1Ôåx",m.d1],["D2Ôåÿ",m.d2]].map(([l,val])=>(
                        <div key={l} style={{display:"flex",justifyContent:"space-between",fontSize:10.5,padding:"1px 0"}}>
                          <span style={{color:GRY,fontSize:9.5}}>{l}</span>
                          <span style={{fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{val||"-"}</span>
                        </div>
                      ))}
                    </div>}
                    {(m.spSx>0||m.spDx>0)&&<div>
                      <div style={{fontSize:7,fontWeight:800,color:AMB,marginBottom:2}}>SPALL.</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        {[["Sx",m.spSx],["Dx",m.spDx],["Sop",m.spSopra]].filter(([,val])=>val>0).map(([l,val])=>(
                          <span key={l} style={{fontSize:10}}><span style={{color:GRY,fontSize:9}}>{l} </span><strong style={{fontFamily:"'DM Mono',monospace"}}>{val}</strong></span>
                        ))}
                      </div>
                    </div>}
                  </div>
                </div>

                {/* Prodotto */}
                {(v.sistema||v.vetro||v.telaio||v.accessori?.tapparella?.attivo||v.accessori?.zanzariera?.attivo||v.accessori?.persiana?.attivo||v.cassonetto||v.note||v.controtelaio?.tipo)&&(
                  <div style={{padding:"7px 12px",background:"#f8fafc",borderTop:"1px solid #f1f5f9"}}>
                    <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:3}}>
                      {v.controtelaio?.tipo&&<span style={{padding:"2px 7px",borderRadius:4,background:"#dbeafe",color:"#1e40af",fontSize:9.5,fontWeight:700}}>­ƒCT {v.controtelaio.tipo==="singolo"?"Sing.":v.controtelaio.tipo==="doppio"?"Doppio":"Cass."} {v.controtelaio.l||""}x{v.controtelaio.h||""}{v.controtelaio.prof?" P"+v.controtelaio.prof:""}</span>}
                      {v.sistema&&<span style={{padding:"2px 7px",borderRadius:4,background:"#eff6ff",color:"#1d4ed8",fontSize:9.5,fontWeight:700}}>ÔÜÖ {v.sistema}</span>}
                      {v.vetro&&<span style={{padding:"2px 7px",borderRadius:4,background:"#f0fdf4",color:"#15803d",fontSize:9.5,fontWeight:700}}>­ƒ{v.vetro}</span>}
                      {v.coloreInt&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fafafa",border:"1px solid #e2e8f0",color:"#374151",fontSize:9.5}}>🎨 {v.bicolore?"INT:"+v.coloreInt+"/EST:"+v.coloreEst:v.coloreInt}</span>}
                      {v.telaio&&<span style={{padding:"2px 7px",borderRadius:4,background:"#f5f3ff",color:"#6d28d9",fontSize:9.5,fontWeight:700}}>🔧 Tel.{v.telaio}{v.telaio==="Z"&&v.telaioAlaZ?" ("+v.telaioAlaZ+"mm)":""}</span>}
                      {v.rifilato&&(v.rifilSx||v.rifilDx)&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fdf4ff",color:"#7e22ce",fontSize:9.5}}>Rif Sx:{v.rifilSx} Dx:{v.rifilDx} Sop:{v.rifilSopra}</span>}
                      {v.coprifilo&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fefce8",color:"#92400e",fontSize:9.5}}>🔩 {v.coprifilo}</span>}
                      {v.lamiera&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fff7ed",color:"#9a3412",fontSize:9.5}}>📐 {v.lamiera}</span>}
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                      {v.cassonetto&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fef3c7",color:"#b45309",fontSize:9.5,fontWeight:700}}>📦 {v.casTipo||"Cass."} {v.misure?.casL||""}x{v.misure?.casH||""}x{v.misure?.casP||""}</span>}
                      {v.accessori?.tapparella?.attivo&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fef3c7",color:"#b45309",fontSize:9.5,fontWeight:700}}>¼ç Tap. {v.accessori.tapparella.colore} {v.accessori.tapparella.l}x{v.accessori.tapparella.h}</span>}
                      {v.accessori?.persiana?.attivo&&<span style={{padding:"2px 7px",borderRadius:4,background:"#eff6ff",color:"#1e40af",fontSize:9.5,fontWeight:700}}>🪟 Pers. {v.accessori.persiana.colore}</span>}
                      {v.accessori?.zanzariera?.attivo&&<span style={{padding:"2px 7px",borderRadius:4,background:"#fdf4ff",color:"#6b21a8",fontSize:9.5,fontWeight:700}}>🦟 Zan. {v.accessori.zanzariera.l}x{v.accessori.zanzariera.h}</span>}
                    </div>
                    {v.note&&<div style={{marginTop:5,fontSize:10.5,color:"#475569",fontStyle:"italic",padding:"3px 6px",background:"#fffbeb",borderRadius:4,borderLeft:"2px solid "+AMB}}>📝 {v.note}</div>}
                  </div>
                )}
              </div>
            );
          })}

          {/* Manodopera totale */}
          {(() => {
            const totOre = vaniR.reduce((s,v) => s + (v.oreStimate||0) + (v.oreExtra||0), 0);
            if (totOre === 0) return null;
            const costoOra = 35;
            const totCosto = totOre * costoOra;
            return (
              <div style={{background:"#D0800815",borderRadius:10,padding:"12px 14px",marginBottom:12,border:"1px solid #D0800830"}}>
                <div style={{fontSize:9,fontWeight:700,color:"#D08008",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>­ƒæ→ Manodopera</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {[["Ore stimate",vaniR.reduce((s,v)=>s+(v.oreStimate||0),0).toFixed(1),"#D08008"],["Ore extra",vaniR.reduce((s,v)=>s+(v.oreExtra||0),0).toFixed(1),"#E8A020"],["Costo totale","Ôé¼"+totCosto.toFixed(0),"#D08008"]].map(([l,val,col])=>(
                    <div key={l} style={{textAlign:"center",padding:"8px 4px",background:"rgba(255,255,255,0.6)",borderRadius:8}}>
                      <div style={{fontSize:18,fontWeight:800,color:col,fontFamily:"'DM Mono',monospace"}}>{val}</div>
                      <div style={{fontSize:8,color:"#94a3b8",marginTop:2}}>{l}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:10,color:"#D08008"}}>
                  <span>Totale: {totOre.toFixed(1)}h x é¼{costoOra}/ora</span>
                  <span style={{fontWeight:900}}>Ôé¼ {totCosto.toFixed(2)}</span>
                </div>
              </div>
            );
          })()}

          {/* Sommario */}
          <div style={{background:"#0f172a",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
            <div style={{fontSize:9,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>Sommario</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
              {[["Vani",vaniR.length,"#60a5fa"],["Misure ✓",vaniFilled,"#4ade80"],["⚠ Fuori sq.",fuoriSqN,fuoriSqN>0?"#fbbf24":"#4ade80"]].map(([l,val,col])=>(
                <div key={l} style={{textAlign:"center",padding:"8px 4px",background:"rgba(255,255,255,0.05)",borderRadius:8}}>
                  <div style={{fontSize:22,fontWeight:800,color:col,fontFamily:"'DM Mono',monospace"}}>{val}</div>
                  <div style={{fontSize:8,color:"#94a3b8",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

          {/* Anteprima messaggio WA */}
          <div style={{background:"#dcf8c6",border:"1.5px solid #16a34a",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:800,color:"#166534",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:6}}>Anteprima messaggio</div>
            <pre style={{fontFamily:"'DM Mono',monospace",fontSize:9.5,color:"#14532d",whiteSpace:"pre-wrap",lineHeight:1.65,margin:0,maxHeight:400,overflow:"auto"}}>{waMsg}</pre>
          </div>

        {/* Barra invio */}
        <div style={{position:"fixed",bottom:0,left:0,right:0,background:"white",borderTop:"2px solid #e2e8f0",padding:"10px 12px 22px",boxShadow:"0 -6px 20px rgba(0,0,0,0.08)"}}>
          <div style={{fontSize:9,fontWeight:700,color:GRY,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:7,textAlign:"center"}}>Invia riepilogo</div>
          <div style={{display:"flex",gap:8}}>
            <div onClick={()=>{navigator.clipboard?.writeText(waMsg.replace(/\*/g,""));}} 
              style={{padding:"13px 14px",borderRadius:11,background:"#f1f5f9",color:"#475569",cursor:"pointer",fontWeight:800,fontSize:13}}>📋</div>
            <div onClick={()=>window.open("https://wa.me/?text="+encodeURIComponent(waMsg))}
              style={{flex:1,padding:"13px 8px",borderRadius:11,background:"#16a34a",color:"white",textAlign:"center",cursor:"pointer",fontWeight:800,fontSize:13}}>­ƒÆ¼ WhatsApp</div>
            <div onClick={()=>window.open("mailto:?subject="+encodeURIComponent("Riepilogo Commessa "+c.code+" - "+c.cliente)+"&body="+encodeURIComponent(waMsg.replace(/\*/g,"")))}
              style={{flex:1,padding:"13px 8px",borderRadius:11,background:BLU,color:"white",textAlign:"center",cursor:"pointer",fontWeight:800,fontSize:13}}>📧 Email</div>
            <div onClick={()=>window.print()}
              style={{padding:"13px 14px",borderRadius:11,background:"#f1f5f9",color:"#475569",cursor:"pointer",fontWeight:800,fontSize:15}}>­ƒû¿</div>
          </div>
        </div>
      </div>
    );

}
