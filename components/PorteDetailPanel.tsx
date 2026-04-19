// ═══════════════════════════════════════════════════════════════════
// MASTRO ERP — PorteDetailPanel.tsx
// Form misure completo per settore PORTE
// Basato su catalogo MastroPorteV2 (HOPPE + CISA + cerniere + coprifilo + soglia)
//
// INTEGRAZIONE:
// In VanoSectorRouter.tsx, importa questo componente:
//   import PorteDetailPanel from "./PorteDetailPanel";
// Poi nel switch settore:
//   case "porte": return <PorteDetailPanel vano={vano} onUpdate={updateField} onBack={onBack} />;
//
// CAMPI SALVATI nel vano:
// misure.lCentro, misure.hCentro, misure.spessoreMuro
// materiale, modello, apertura, senso, finitura, vetroInserto, colore
// controtelaio, aggancio, classeEI, classeRC
// cernTipo, cernQty, cernFin
// coprifTipo, coprifLarg, coprifMat
// sogliaTipo, sogliaMat, battuta, guarnizione
// hTipo, hSerie, hMat, hFin, hBocc (HOPPE)
// cTipo, cCil, cMisCil, cEntrata, cAntip, cChiudip, cVers (CISA)
// note, foto.fronte, foto.retro, foto.dettaglio
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { captureFotoVano, captureFotoSimple } from "@/lib/vano-foto-uploader";

// ═══ MASTRO DS v1.0 ═══
const T = { bg:"#F2F1EC", card:"#FFFFFF", topbar:"#1A1A1C", acc:"#D08008", text:"#1A1A1C", sub:"#8E8E93", bdr:"#E5E4DF", green:"#1A9E73", red:"#DC4444", blue:"#3B7FE0" };
const FF = "'Inter', system-ui, sans-serif";
const FM = "'JetBrains Mono', monospace";

// ═══════════════════════════════════════════════════════════════════
// CATALOGO PORTE — COSTANTI COMPLETE
// ═══════════════════════════════════════════════════════════════════

const MATERIALI = ["Legno massello","Laccato opaco","Laccato lucido","Laminato CPL","Laminato HPL","Vetro temperato","Blindata","Metallica REI","Light","EI tagliafuoco"];

const APERTURE = {
  "Battente":["Battente singola","Battente doppia","Ventola singola"],
  "Libro":["Libro simmetrica","Libro asimmetrica"],
  "Roto":["Roto singola","Compack 180"],
  "Scomparsa":["Scomparsa singola","Scomparsa doppia"],
  "Esterno muro":["Esterno muro singola","Esterno muro doppia","Sovrapposta 2 ante"],
  "Filomuro":["Filomuro battente","Filomuro scorrevole"],
};

const FINITURE = ["Liscio","Pantografato","Inciso","Con vetro","Bugnato","Dogato H","Dogato V"];
const VETRI_INS = ["Trasparente","Satinato","Decorato","Laccato","Temperato"];
const COLORI = ["Bianco laccato","Bianco matrix","Grigio 7035","Grigio 7016","Noce nazionale","Noce canaletto","Rovere sbiancato","Rovere naturale","Rovere grigio","Wengé","Olmo","Frassino","RAL custom","NCS custom"];
const SENSI = ["DX spinta","DX tirare","SX spinta","SX tirare"];
const CONTROTELAI = ["Standard legno","Metallo zincato","Scrigno scomparsa","Eclisse scomparsa","Filomuro alu","Esistente","Da definire"];
const CLASSI_EI = ["EI 30","EI 60","EI 90","EI 120"];
const CLASSI_RC = ["RC 2","RC 3","RC 4"];
const MISURE_STD = [{l:600,h:2100,lb:"60×210"},{l:700,h:2100,lb:"70×210"},{l:800,h:2100,lb:"80×210"},{l:900,h:2100,lb:"90×210"},{l:1000,h:2100,lb:"100×210"},{l:1200,h:2100,lb:"120×210"},{l:800,h:2400,lb:"80×240"},{l:900,h:2400,lb:"90×240"}];
const AGGANCIO = ["Frontale a muro","A pavimento (perno)","Su controtelaio","Filomuro (incasso)","Su stipite esistente","A soffitto (binario)"];

// CERNIERE
const CERNIERE_TIPO = ["A scomparsa regolabile","A vista 3D","A molla (chiusura auto)","A bilico (pivot)","Per porta blindata","Per porta REI","Anuba (legno)","A libro"];
const CERNIERE_QTY = ["2 cerniere (≤ 80cm)","3 cerniere (> 80cm)","4 cerniere (H ≥ 240)","2+1 sicurezza (blindata)"];
const CERNIERE_FIN = ["Cromo satinato","Cromo lucido","Nero opaco","Bronzo","Ottone","Bianco","Inox","Coordinata porta"];

// COPRIFILO / CORNICE
const COPRIFILO_TIPO = ["Piatto liscio","Bombato classico","Squadrato moderno","Telescopico (regolabile)","Complanare (filomuro)","Senza coprifilo"];
const COPRIFILO_LARG = ["50mm","60mm","70mm","80mm","90mm","100mm"];
const COPRIFILO_MAT = ["Legno massello","MDF laccato","MDF rivestito","Alluminio","PVC"];

// SOGLIA / BATTUTA / GUARNIZIONE
const SOGLIA_TIPO = ["Automatica (a scomparsa)","Fissa a pavimento","A rompigoccia (esterno)","Ribassata (accessibilità)","Nessuna soglia","Esistente"];
const SOGLIA_MAT = ["Alluminio anodizzato","Alluminio verniciato","Acciaio inox","Legno","Ottone","PVC"];
const BATTUTA_TIPO = ["Singola (standard)","Doppia (acustica)","Tripla (blindata)","A battente libero","Magnetica"];
const GUARNIZIONE = ["TPE grigia","TPE nera","Silicone bianco","Silicone grigio","Acustica doppia labbro","Tagliafuoco intumescente"];

// MODELLI PORTA (thumbnails)
const MODELLI = [
  { id:"m01", nome:"Liscio Classic",    mat:"Laccato opaco",   shape:"liscio",   bg1:"#d6d3d1", bg2:"#f5f5f4" },
  { id:"m02", nome:"Pantografato Deco", mat:"Laccato opaco",   shape:"panto",    bg1:"#c4b5a8", bg2:"#e7e5e4" },
  { id:"m03", nome:"Vetro Satinato",    mat:"Vetro temperato", shape:"vetro",    bg1:"#93c5fd", bg2:"#dbeafe" },
  { id:"m04", nome:"Rovere Naturale",   mat:"Legno massello",  shape:"legno",    bg1:"#a18072", bg2:"#d6cfc7" },
  { id:"m05", nome:"Noce Canaletto",    mat:"Legno massello",  shape:"legno",    bg1:"#78543e", bg2:"#a18072" },
  { id:"m06", nome:"Dogato Moderno",    mat:"Laminato CPL",    shape:"dogato",   bg1:"#a1a1aa", bg2:"#d4d4d8" },
  { id:"m07", nome:"Minimal Filomuro",  mat:"Laccato opaco",   shape:"filo",     bg1:"#e7e5e4", bg2:"#fafaf9" },
  { id:"m08", nome:"Blindata Classe 3", mat:"Blindata",        shape:"blindata", bg1:"#57534e", bg2:"#78716c" },
  { id:"m09", nome:"REI 60 Hotel",      mat:"EI tagliafuoco",  shape:"rei",      bg1:"#dc2626", bg2:"#fca5a5" },
  { id:"m10", nome:"Scorrevole Glass",  mat:"Vetro temperato", shape:"scorr",    bg1:"#60a5fa", bg2:"#bfdbfe" },
  { id:"m11", nome:"Inciso Decor",      mat:"Laminato HPL",    shape:"inciso",   bg1:"#94a3b8", bg2:"#e2e8f0" },
  { id:"m12", nome:"Light Economica",   mat:"Light",           shape:"liscio",   bg1:"#e5e5e5", bg2:"#f5f5f5" },
];

// HOPPE
const HOPPE_TIPO = ["Su rosetta","Su placca","Maniglione","Scorrevole incasso","Tagliafuoco","Compact System"];
const HOPPE_SERIE = ["Paris","Tokyo","Amsterdam","Atlanta","Milano","Maribor","Brindisi","Seattle","Dublin","Houston","Dallas","Hamburg","Stockholm FS","Paris FS","Singapore","Valencia"];
const HOPPE_MAT = ["Alluminio","Acciaio inox","Ottone","Resina"];
const HOPPE_FIN = ["F1 Argento","F9 Acciaio sat.","Nero satinato","Bronzo","Cromo lucido","Cromo sat.","Bianco 9016","Nero 9005","Titanio"];
const HOPPE_BOCC = ["Tonda Ø52","Quadrata","Ovale","Doppia mappa","WC nottolino","Cieca"];

// CISA
const CISA_TIPO = ["Da infilare standard","Da infilare 4 mandate","Da applicare","Multipunto","Elettrica","Smart DOMO","Antipanico"];
const CISA_CIL = ["Europeo standard","RS5 alta sicurezza","Per pomolo","Fisso doppia mappa","Elettronico"];
const CISA_MIS_CIL = ["30+30","30+40","30+50","35+35","40+40","40+50","50+50","Su misura"];
const CISA_ENTRATA = ["40mm","50mm","60mm","70mm","80mm"];
const CISA_ANTIPAN = ["Barra push Alpha","Leva touch Fast","Con serratura"];
const CISA_CHIUDIP = ["Nessuno","A braccio standard","A slitta incasso","A pavimento","Elettromagnetico"];


// ═══════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════

const Chip = ({ label, sel, color, onTap, small }: any) => (
  <div onClick={onTap} style={{
    padding: small ? "5px 10px" : "7px 13px", borderRadius: 9,
    border: `1.5px solid ${sel ? color||T.acc : T.bdr}`,
    background: sel ? (color||T.acc)+"14" : T.card,
    fontSize: small ? 10 : 11, fontWeight: sel ? 700 : 500,
    color: sel ? (color||T.acc) : T.text, cursor: "pointer",
    transition: "all .12s", fontFamily: FF, userSelect: "none" as any,
  }}>{label}</div>
);

const ChipSel = ({ label, options, value, onChange, color, small }: any) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 5, textTransform: "uppercase" as any, letterSpacing: 0.5 }}>{label}</div>
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as any }}>{options.map((o: string) => <Chip key={o} label={o} sel={value===o} color={color} onTap={() => onChange(o)} small={small} />)}</div>
  </div>
);

const SectionAcc = ({ icon, title, color, count, open, onToggle }: any) => (
  <div onClick={onToggle} style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", cursor: "pointer", borderBottom: `1px solid ${T.bdr}`, marginBottom: open ? 12 : 0, userSelect: "none" as any }}>
    <span style={{ fontSize: 16 }}>{icon}</span>
    <span style={{ fontSize: 13, fontWeight: 700, color: color||T.text, flex: 1 }}>{title}</span>
    {count > 0 && <span style={{ fontSize: 9, fontWeight: 700, background: (color||T.acc)+"20", color: color||T.acc, padding: "2px 8px", borderRadius: 20 }}>{count}</span>}
    <span style={{ fontSize: 11, color: T.sub, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>
  </div>
);

const NumInput = ({ label, value, onChange, unit="mm" }: any) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 10, color: T.sub, marginBottom: 3, fontWeight: 600 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <input type="number" inputMode="numeric" value={value||""} onChange={(e: any) => onChange(parseInt(e.target.value)||0)} style={{ flex: 1, padding: "10px 12px", fontSize: 15, fontFamily: FM, fontWeight: 600, border: `1.5px solid ${T.bdr}`, borderRadius: 9, background: T.card, color: T.text, outline: "none" }} />
      <span style={{ fontSize: 10, color: T.sub, background: T.bg, padding: "7px 9px", borderRadius: 7, fontWeight: 600 }}>{unit}</span>
    </div>
  </div>
);

const Sel = ({ label, value, onChange, options, groups }: any) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 10, color: T.sub, marginBottom: 3, fontWeight: 600 }}>{label}</div>
    <select value={value||""} onChange={(e: any) => onChange(e.target.value)} style={{ width: "100%", padding: "10px 12px", fontSize: 12, fontFamily: FF, fontWeight: 600, border: `1.5px solid ${T.bdr}`, borderRadius: 9, background: T.card, color: T.text, WebkitAppearance: "none" as any, outline: "none", paddingRight: 32 }}>
      <option value="">— Seleziona —</option>
      {groups ? Object.entries(groups).map(([g, items]: any) => <optgroup key={g} label={g}>{items.map((i: string) => <option key={i} value={i}>{i}</option>)}</optgroup>) : options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const PhotoRow = ({ foto, onCapture }: any) => (
  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
    {["fronte","retro","dettaglio"].map(cat => {
      const hasPhoto = foto?.[cat];
      return (
        <div key={cat} onClick={() => onCapture(cat)} style={{
          flex: 1, height: 56, borderRadius: 10,
          border: hasPhoto ? `2px solid ${T.green}` : `2px dashed ${T.bdr}`,
          display: "flex", flexDirection: "column" as any, alignItems: "center", justifyContent: "center",
          cursor: "pointer", background: hasPhoto ? T.green+"08" : T.card, overflow: "hidden", position: "relative" as any
        }}>
          {hasPhoto ? (
            <img src={hasPhoto} style={{ width:"100%", height:"100%", objectFit:"cover" as any }} alt="" />
          ) : (
            <>
              <span style={{ fontSize: 16 }}>📷</span>
              <span style={{ fontSize: 8, color: T.sub, fontWeight: 600 }}>{cat}</span>
            </>
          )}
        </div>
      );
    })}
  </div>
);


// ═══════════════════════════════════════════════════════════════════
// DOOR DRAWING SVG
// ═══════════════════════════════════════════════════════════════════
const DoorDrawing = ({ d }: any) => {
  const W = 140, H = 200, OX = 30, OY = 12;
  const hasV = d.finitura === "Con vetro";
  const isDopp = (d.apertura||"").includes("doppia") || (d.apertura||"").includes("2 ante");
  const isScorr = (d.apertura||"").includes("Scomparsa") || (d.apertura||"").includes("Esterno muro");
  const isLibro = (d.apertura||"").includes("Libro");
  const sensoR = (d.senso||"").includes("DX");
  const larg = d.larghezza || "—";
  const alt = d.altezza || "—";
  const spes = d.spessoreMuro || "—";
  const hasCopri = d.coprifTipo && d.coprifTipo !== "Senza coprifilo" && d.coprifTipo !== "Complanare (filomuro)";
  const hasSoglia = d.sogliaTipo && d.sogliaTipo !== "Nessuna soglia";
  const nCern = (d.cernQty||"").includes("4") ? 4 : (d.cernQty||"").includes("3") ? 3 : 2;

  return (
    <div style={{ background: T.card, borderRadius: 12, border: `1.5px solid ${T.bdr}`, padding: "12px 8px 6px", marginBottom: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" as any, letterSpacing: 0.5, marginBottom: 6, textAlign: "center" as any }}>Vista frontale</div>
      <svg width="100%" viewBox={`0 0 ${W+60} ${H+45}`} style={{ maxHeight: 220 }}>
        {/* Muro */}
        <rect x={OX-8} y={OY-4} width={W+16} height={H+10} rx="2" fill="#e8e6e1" stroke="#ccc" strokeWidth="0.8" />
        {/* Coprifilo */}
        {hasCopri && <>
          <rect x={OX-6} y={OY-2} width="5" height={H+6} rx="1" fill="#d6d3d1" stroke="#a8a29e" strokeWidth="0.5" />
          <rect x={OX+W+1} y={OY-2} width="5" height={H+6} rx="1" fill="#d6d3d1" stroke="#a8a29e" strokeWidth="0.5" />
          <rect x={OX-6} y={OY-5} width={W+12} height="4" rx="1" fill="#d6d3d1" stroke="#a8a29e" strokeWidth="0.5" />
        </>}
        {/* Vano porta */}
        <rect x={OX} y={OY} width={W} height={H} rx="1" fill="#faf9f6" stroke={T.acc} strokeWidth="2" />

        {isDopp ? <>
          <line x1={OX+W/2} y1={OY} x2={OX+W/2} y2={OY+H} stroke={T.acc} strokeWidth="1.5" strokeDasharray="4,3" />
          <rect x={OX+W/2-8} y={OY+H*0.47} width="6" height="12" rx="3" fill={T.acc} />
          <rect x={OX+W/2+2} y={OY+H*0.47} width="6" height="12" rx="3" fill={T.acc} />
          {hasV && <>
            <rect x={OX+10} y={OY+22} width={W/2-18} height={H*0.4} rx="2" fill={T.blue+"15"} stroke={T.blue+"40"} strokeWidth="0.8" />
            <rect x={OX+W/2+8} y={OY+22} width={W/2-18} height={H*0.4} rx="2" fill={T.blue+"15"} stroke={T.blue+"40"} strokeWidth="0.8" />
          </>}
          {Array.from({length:nCern},(_,i)=>{const py=OY+H*((i+1)/(nCern+1)); return <rect key={`cl${i}`} x={OX} y={py-4} width="3" height="8" rx="1.5" fill="#78716c"/>})}
          {Array.from({length:nCern},(_,i)=>{const py=OY+H*((i+1)/(nCern+1)); return <rect key={`cr${i}`} x={OX+W-3} y={py-4} width="3" height="8" rx="1.5" fill="#78716c"/>})}
        </> : isScorr ? <>
          <rect x={OX+3} y={OY+3} width={W-6} height={H-6} rx="1" fill="none" stroke={T.acc+"50"} strokeWidth="0.8" strokeDasharray="5,3" />
          <line x1={OX} y1={OY+H+2} x2={OX+W} y2={OY+H+2} stroke={T.acc} strokeWidth="2.5" />
          {hasV && <rect x={OX+12} y={OY+18} width={W-24} height={H*0.45} rx="2" fill={T.blue+"15"} stroke={T.blue+"40"} strokeWidth="0.8" />}
        </> : isLibro ? <>
          <line x1={OX+W/2} y1={OY} x2={OX+W/2} y2={OY+H} stroke={T.acc+"60"} strokeWidth="1" strokeDasharray="3,3" />
          <line x1={OX+W*0.25} y1={OY} x2={OX+W*0.25} y2={OY+H} stroke={T.acc+"40"} strokeWidth="0.8" strokeDasharray="2,2" />
          <line x1={OX+W*0.75} y1={OY} x2={OX+W*0.75} y2={OY+H} stroke={T.acc+"40"} strokeWidth="0.8" strokeDasharray="2,2" />
          <rect x={OX+W/2-3} y={OY+H*0.47} width="6" height="12" rx="2.5" fill={T.acc} />
        </> : <>
          {/* Battente singola */}
          <path d={sensoR
            ? `M${OX+W} ${OY+H} Q${OX+W} ${OY+H-W*0.5} ${OX+W-W*0.4} ${OY+H-W*0.4}`
            : `M${OX} ${OY+H} Q${OX} ${OY+H-W*0.5} ${OX+W*0.4} ${OY+H-W*0.4}`
          } fill="none" stroke={T.acc+"30"} strokeWidth="0.8" strokeDasharray="4,4" />
          <rect x={sensoR?OX+5:OX+W-12} y={OY+H*0.45} width="6" height="14" rx="3" fill={T.acc} />
          {hasV && <rect x={OX+15} y={OY+18} width={W-30} height={H*0.4} rx="2" fill={T.blue+"15"} stroke={T.blue+"40"} strokeWidth="0.8" />}
          {Array.from({length:nCern},(_,i)=>{
            const py = OY+H*((i+1)/(nCern+1));
            return <rect key={`c${i}`} x={sensoR?OX+W-3:OX} y={py-4} width="3" height="8" rx="1.5" fill="#78716c"/>;
          })}
        </>}
        {/* Soglia */}
        {hasSoglia && <rect x={OX-2} y={OY+H} width={W+4} height="3" rx="1" fill={d.sogliaTipo?.includes("Automatica")?T.acc+"40":"#a1a1aa50"} stroke="#78716c" strokeWidth="0.4" />}
        {/* Quote */}
        <line x1={OX} y1={OY+H+18} x2={OX+W} y2={OY+H+18} stroke={T.sub} strokeWidth="0.5" />
        <line x1={OX} y1={OY+H+14} x2={OX} y2={OY+H+22} stroke={T.sub} strokeWidth="0.5" />
        <line x1={OX+W} y1={OY+H+14} x2={OX+W} y2={OY+H+22} stroke={T.sub} strokeWidth="0.5" />
        <text x={OX+W/2} y={OY+H+28} textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={T.acc}>{larg}</text>
        <line x1={OX+W+14} y1={OY} x2={OX+W+14} y2={OY+H} stroke={T.sub} strokeWidth="0.5" />
        <line x1={OX+W+10} y1={OY} x2={OX+W+18} y2={OY} stroke={T.sub} strokeWidth="0.5" />
        <line x1={OX+W+10} y1={OY+H} x2={OX+W+18} y2={OY+H} stroke={T.sub} strokeWidth="0.5" />
        <text x={OX+W+24} y={OY+H/2+3} textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={T.acc} transform={`rotate(-90,${OX+W+24},${OY+H/2+3})`}>{alt}</text>
        <text x={OX+W/2} y={OY+H+38} textAnchor="middle" fontSize="8" fill={T.sub}>muro {spes} mm</text>
      </svg>
      {/* Legenda */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" as any, marginTop: 2 }}>
        {[
          d.apertura && { c: T.acc, l: d.apertura.split(" ").pop() },
          d.senso && { c: T.acc, l: d.senso },
          hasV && { c: T.blue, l: "Vetro" },
          hasSoglia && { c: "#78716c", l: "Soglia" },
          hasCopri && { c: "#a8a29e", l: "Coprifilo" },
        ].filter(Boolean).map((x: any, i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:3 }}>
            <div style={{ width:6, height:6, borderRadius:3, background:x.c }} />
            <span style={{ fontSize:8, color:T.sub }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// MODEL THUMBNAIL
// ═══════════════════════════════════════════════════════════════════
const ModelCard = ({ m, sel, onTap }: any) => (
  <div onClick={onTap} style={{ width:90, minHeight:110, borderRadius:11, border:`2px solid ${sel?T.acc:T.bdr}`, background:sel?T.acc+"0a":T.card, cursor:"pointer", overflow:"hidden", transition:"all .12s", flexShrink:0, boxShadow:sel?`0 2px 10px ${T.acc}25`:"none" }}>
    <div style={{ width:"100%", height:70, background:`linear-gradient(145deg,${m.bg1}25,${m.bg2}35)`, position:"relative" as any }}>
      {sel && <div style={{ position:"absolute" as any, top:3, right:3, width:14, height:14, borderRadius:7, background:T.acc, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"#fff", fontWeight:800 }}>✓</div>}
    </div>
    <div style={{ padding:"4px 5px" }}>
      <div style={{ fontSize:8, fontWeight:700, color:sel?T.acc:T.text, lineHeight:1.2 }}>{m.nome}</div>
      <div style={{ fontSize:7, color:T.sub, marginTop:1 }}>{m.mat}</div>
    </div>
  </div>
);


// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface PorteDetailPanelProps {
  vano: any;
  onUpdate: (field: string, value: any) => void;
  onBack: () => void;
  aziendaId?: string;
  cmId?: string;
}

export default function PorteDetailPanel({ vano, onUpdate, onBack, aziendaId, cmId }: PorteDetailPanelProps) {
  const [step, setStep] = useState(0);
  const [sec, setSec] = useState<Record<string,boolean>>({ mis:true, porta:true, cern:false, copri:false, soglia:false, hoppe:false, cisa:false });
  const tog = (s: string) => setSec(p => ({...p, [s]:!p[s]}));

  // Read fields from vano
  const d = vano || {};
  const m = d.misure || {};
  const set = useCallback((field: string, val: any) => {
    onUpdate(field, val);
  }, [onUpdate]);
  const setM = useCallback((field: string, val: any) => {
    onUpdate("misure", { ...(d.misure||{}), [field]: val });
  }, [onUpdate, d.misure]);

  const handleFoto = (cat: string) => {
    if (aziendaId && cmId && d.id) {
      captureFotoVano({ aziendaId, cmId, vanoId: String(d.id), categoria: cat }, (url) => set("foto", { ...(d.foto||{}), [cat]: url }), (err) => console.warn("[Foto]", err));
    } else {
      captureFotoSimple((url) => set("foto", { ...(d.foto||{}), [cat]: url }));
    }
  };

  // Counts for progress
  const misC = [m.lCentro, m.hCentro, m.spessoreMuro].filter(Boolean).length;
  const portaC = [d.modello, d.materiale, d.apertura, d.senso, d.finitura, d.colore, d.controtelaio, d.aggancio].filter(Boolean).length;
  const cernC = [d.cernTipo, d.cernQty, d.cernFin].filter(Boolean).length;
  const copriC = [d.coprifTipo, d.coprifLarg, d.coprifMat].filter(Boolean).length;
  const sogliaC = [d.sogliaTipo, d.sogliaMat, d.battuta, d.guarnizione].filter(Boolean).length;
  const hoppeC = [d.hTipo, d.hSerie, d.hMat, d.hFin].filter(Boolean).length;
  const cisaC = [d.cTipo, d.cCil, d.cEntrata].filter(Boolean).length;
  const total = misC + portaC + cernC + copriC + sogliaC + hoppeC + cisaC;
  const totalMax = 30;

  const needEI = d.materiale === "EI tagliafuoco" || d.materiale === "Metallica REI";
  const needRC = d.materiale === "Blindata";
  const modelliVis = d.materiale ? MODELLI.filter(mod => mod.mat === d.materiale) : MODELLI;

  const selMod = (mod: any) => {
    set("modello", mod.id === d.modello ? null : mod.id);
    if (mod.id !== d.modello) set("materiale", mod.mat);
  };

  // HOPPE serie filtered
  const hoppeSerieFilt = d.hTipo === "Tagliafuoco" ? HOPPE_SERIE.filter(s => s.includes("FS"))
    : d.hTipo === "Maniglione" ? ["Singapore","Valencia","Dallas"]
    : d.hTipo === "Scorrevole incasso" ? ["Kit M463 standard","Kit M463 con nottolino"]
    : HOPPE_SERIE.filter(s => !s.includes("FS"));

  // CISA tipo filtered
  const cisaTipoFilt = needRC ? ["Da infilare 4 mandate","Multipunto","Smart DOMO","Elettrica"]
    : needEI ? ["Da infilare standard","Antipanico"]
    : CISA_TIPO;

  // CERNIERE tipo filtered
  const cernTipoFilt = needRC ? ["Per porta blindata"] : needEI ? ["Per porta REI"] : CERNIERE_TIPO;

  const STEPS = ["Configurazione","Ferramenta","Riepilogo"];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:FF }}>
      {/* TOPBAR */}
      <div style={{ background:T.topbar, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky" as any, top:0, zIndex:99 }}>
        <div onClick={onBack} style={{ width:30, height:30, borderRadius:7, background:"#ffffff15", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13, color:"#fff" }}>←</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>🚪 Porte — Presa Misure</div>
          <div style={{ fontSize:10, color:"#888" }}>{d.nome || "Vano"} · {d.stanza || ""}</div>
        </div>
        <div style={{ background:total>=totalMax*0.5?T.green+"30":T.acc+"30", color:total>=totalMax*0.5?T.green:T.acc, padding:"3px 10px", borderRadius:16, fontSize:11, fontWeight:800, fontFamily:FM }}>{total}/{totalMax}</div>
      </div>
      {/* Progress bar */}
      <div style={{ height:3, background:T.bdr }}><div style={{ height:3, background:total>=totalMax*0.5?T.green:T.acc, width:`${(total/totalMax)*100}%`, transition:"width .3s", borderRadius:2 }} /></div>

      {/* STEP DOTS */}
      <div style={{ display:"flex", gap:6, padding:"10px 16px", justifyContent:"center" }}>
        {STEPS.map((s, i) => (
          <div key={i} onClick={() => setStep(i)} style={{
            padding:"5px 14px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer",
            background: step===i ? T.acc : T.card, color: step===i ? "#fff" : T.sub,
            border: `1px solid ${step===i ? T.acc : T.bdr}`, transition:"all .15s"
          }}>{i+1}. {s}</div>
        ))}
      </div>

      <div style={{ padding:"4px 16px 100px" }}>

        {/* ════════════════════════════════════════════ */}
        {/* STEP 0: CONFIGURAZIONE */}
        {/* ════════════════════════════════════════════ */}
        {step === 0 && <>

          {/* Disegno SVG tecnico */}
          {(m.lCentro || d.apertura || d.finitura || d.coprifTipo || d.sogliaTipo) && (
            <DoorDrawing d={{ larghezza:m.lCentro, altezza:m.hCentro, spessoreMuro:m.spessoreMuro, apertura:d.apertura, senso:d.senso, finitura:d.finitura, coprifTipo:d.coprifTipo, sogliaTipo:d.sogliaTipo, cernQty:d.cernQty }} />
          )}

          {/* ── MISURE ── */}
          <SectionAcc icon="📐" title="Misure vano" color={T.acc} count={misC} open={sec.mis} onToggle={() => tog("mis")} />
          {sec.mis && <div>
            <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase" as any }}>Misura rapida</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" as any, marginBottom:12 }}>
              {MISURE_STD.map(ms => <Chip key={ms.lb} label={ms.lb} sel={m.lCentro===ms.l && m.hCentro===ms.h} color={T.acc} onTap={() => { setM("lCentro",ms.l); setM("hCentro",ms.h); }} small />)}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1 }}><NumInput label="Larghezza luce" value={m.lCentro} onChange={(v: number) => setM("lCentro",v)} /></div>
              <div style={{ flex:1 }}><NumInput label="Altezza luce" value={m.hCentro} onChange={(v: number) => setM("hCentro",v)} /></div>
            </div>
            <NumInput label="Spessore muro" value={m.spessoreMuro} onChange={(v: number) => setM("spessoreMuro",v)} />
          </div>}

          {/* ── PORTA ── */}
          <SectionAcc icon="🚪" title="Configurazione porta" color={T.acc} count={portaC} open={sec.porta} onToggle={() => tog("porta")} />
          {sec.porta && <div>
            <ChipSel label="Materiale / Linea" options={MATERIALI} value={d.materiale} onChange={(v: string) => { set("materiale",v); set("modello",null); }} color={T.acc} />

            {/* Modelli con thumbnail */}
            <div style={{ marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ fontSize:9, fontWeight:700, color:T.sub, textTransform:"uppercase" as any }}>Modello {d.materiale ? `· ${modelliVis.length}` : ""}</div>
                {d.modello && <div onClick={() => set("modello",null)} style={{ fontSize:8, color:T.red, cursor:"pointer", fontWeight:700 }}>✕ Reset</div>}
              </div>
              <div style={{ display:"flex", gap:6, overflowX:"auto" as any, paddingBottom:4 }}>
                {modelliVis.map(mod => <ModelCard key={mod.id} m={mod} sel={d.modello===mod.id} onTap={() => selMod(mod)} />)}
              </div>
            </div>

            <Sel label="Sistema apertura" value={d.apertura} onChange={(v: string) => set("apertura",v)} groups={APERTURE} />
            <ChipSel label="Senso" options={SENSI} value={d.senso} onChange={(v: string) => set("senso",v)} color={T.acc} />
            <ChipSel label="Finitura" options={FINITURE} value={d.finitura} onChange={(v: string) => set("finitura",v)} color={T.acc} small />
            {d.finitura === "Con vetro" && <ChipSel label="Vetro inserto" options={VETRI_INS} value={d.vetroInserto} onChange={(v: string) => set("vetroInserto",v)} color={T.blue} small />}
            <Sel label="Colore / Essenza" value={d.colore} onChange={(v: string) => set("colore",v)} options={COLORI} />
            <ChipSel label="Controtelaio" options={CONTROTELAI} value={d.controtelaio} onChange={(v: string) => set("controtelaio",v)} color={T.acc} small />
            <ChipSel label="Sistema aggancio" options={AGGANCIO} value={d.aggancio} onChange={(v: string) => set("aggancio",v)} />

            {needEI && <>
              <ChipSel label="🔥 Classe EI" options={CLASSI_EI} value={d.classeEI} onChange={(v: string) => set("classeEI",v)} color={T.red} />
              <div style={{ fontSize:10, color:T.green, background:T.green+"12", border:`1px solid ${T.green}30`, padding:"8px 10px", borderRadius:9, marginBottom:12, lineHeight:1.5 }}>🔥 EN 1634 — Resistenza fuoco {d.classeEI||"..."} min</div>
            </>}
            {needRC && <>
              <ChipSel label="🛡 Classe RC" options={CLASSI_RC} value={d.classeRC} onChange={(v: string) => set("classeRC",v)} color={T.acc} />
              <div style={{ fontSize:10, color:T.acc, background:T.acc+"12", border:`1px solid ${T.acc}30`, padding:"8px 10px", borderRadius:9, marginBottom:12 }}>🛡 Blindata — Pannelli coordinabili</div>
            </>}
          </div>}
        </>}


        {/* ════════════════════════════════════════════ */}
        {/* STEP 1: FERRAMENTA */}
        {/* ════════════════════════════════════════════ */}
        {step === 1 && <>

          {/* ── CERNIERE ── */}
          <SectionAcc icon="🔩" title="Cerniere e ferramenta" color={T.acc} count={cernC} open={sec.cern} onToggle={() => tog("cern")} />
          {sec.cern && <div>
            <ChipSel label="Tipo cerniera" options={cernTipoFilt} value={d.cernTipo} onChange={(v: string) => set("cernTipo",v)} color={T.acc} />
            <ChipSel label="Quantità" options={CERNIERE_QTY} value={d.cernQty} onChange={(v: string) => set("cernQty",v)} color={T.acc} small />
            <ChipSel label="Finitura cerniere" options={CERNIERE_FIN} value={d.cernFin} onChange={(v: string) => set("cernFin",v)} color={T.acc} small />
            {d.cernTipo && <div style={{ background:T.acc+"0c", border:`1px solid ${T.acc}25`, borderRadius:9, padding:"8px 10px", marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.acc }}>{d.cernTipo}</div>
              <div style={{ fontSize:9, color:T.sub, marginTop:2 }}>{[d.cernQty, d.cernFin].filter(Boolean).join(" · ")}</div>
            </div>}
          </div>}

          {/* ── COPRIFILO ── */}
          <SectionAcc icon="🪵" title="Coprifilo e cornice" color={T.acc} count={copriC} open={sec.copri} onToggle={() => tog("copri")} />
          {sec.copri && <div>
            <ChipSel label="Tipo coprifilo" options={COPRIFILO_TIPO} value={d.coprifTipo} onChange={(v: string) => set("coprifTipo",v)} color={T.acc} />
            {d.coprifTipo && d.coprifTipo !== "Senza coprifilo" && d.coprifTipo !== "Complanare (filomuro)" && <>
              <ChipSel label="Larghezza" options={COPRIFILO_LARG} value={d.coprifLarg} onChange={(v: string) => set("coprifLarg",v)} color={T.acc} small />
              <ChipSel label="Materiale coprifilo" options={COPRIFILO_MAT} value={d.coprifMat} onChange={(v: string) => set("coprifMat",v)} color={T.acc} small />
            </>}
            {d.coprifTipo === "Telescopico (regolabile)" && <div style={{ fontSize:10, color:T.blue, background:T.blue+"12", border:`1px solid ${T.blue}30`, padding:"8px 10px", borderRadius:9, marginBottom:12 }}>📐 Telescopico: regolabile ±20mm per muri fuori squadro</div>}
          </div>}

          {/* ── SOGLIA / BATTUTA ── */}
          <SectionAcc icon="🧱" title="Soglia, battuta e guarnizione" color={T.acc} count={sogliaC} open={sec.soglia} onToggle={() => tog("soglia")} />
          {sec.soglia && <div>
            <ChipSel label="Tipo soglia" options={SOGLIA_TIPO} value={d.sogliaTipo} onChange={(v: string) => set("sogliaTipo",v)} color={T.acc} />
            {d.sogliaTipo && d.sogliaTipo !== "Nessuna soglia" && d.sogliaTipo !== "Esistente" && (
              <ChipSel label="Materiale soglia" options={SOGLIA_MAT} value={d.sogliaMat} onChange={(v: string) => set("sogliaMat",v)} color={T.acc} small />
            )}
            <ChipSel label="Battuta anta" options={BATTUTA_TIPO} value={d.battuta} onChange={(v: string) => set("battuta",v)} color={T.acc} />
            <ChipSel label="Guarnizione" options={GUARNIZIONE} value={d.guarnizione} onChange={(v: string) => set("guarnizione",v)} color={T.acc} small />
            {d.sogliaTipo === "Automatica (a scomparsa)" && <div style={{ fontSize:10, color:T.green, background:T.green+"12", border:`1px solid ${T.green}30`, padding:"8px 10px", borderRadius:9, marginBottom:12 }}>✓ Soglia automatica: si abbassa alla chiusura, nessun gradino visibile</div>}
            {needEI && d.guarnizione && d.guarnizione !== "Tagliafuoco intumescente" && <div style={{ fontSize:10, color:T.red, background:T.red+"12", border:`1px solid ${T.red}30`, padding:"8px 10px", borderRadius:9, marginBottom:12 }}>⚠ Porta EI: consigliata guarnizione tagliafuoco intumescente!</div>}
          </div>}

          {/* ── HOPPE ── */}
          <SectionAcc icon="🔑" title="Maniglieria HOPPE" color={T.acc} count={hoppeC} open={sec.hoppe} onToggle={() => tog("hoppe")} />
          {sec.hoppe && <div>
            <ChipSel label="Tipo guarnitura" options={HOPPE_TIPO} value={d.hTipo} onChange={(v: string) => set("hTipo",v)} color={T.acc} />
            <Sel label="Serie / Modello" value={d.hSerie} onChange={(v: string) => set("hSerie",v)} options={hoppeSerieFilt} />
            <ChipSel label="Materiale" options={HOPPE_MAT} value={d.hMat} onChange={(v: string) => set("hMat",v)} color={T.acc} small />
            <ChipSel label="Finitura" options={HOPPE_FIN} value={d.hFin} onChange={(v: string) => set("hFin",v)} color={T.acc} small />
            {(d.hTipo === "Su rosetta" || d.hTipo === "Su placca" || d.hTipo === "Tagliafuoco") && (
              <ChipSel label="Bocchetta" options={HOPPE_BOCC} value={d.hBocc} onChange={(v: string) => set("hBocc",v)} color={T.acc} small />
            )}
            {d.hSerie && <div style={{ background:T.acc+"0c", border:`1px solid ${T.acc}25`, borderRadius:9, padding:"8px 10px", marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.acc }}>{d.hTipo||"Guarnitura"} — {d.hSerie}</div>
              <div style={{ fontSize:9, color:T.sub, marginTop:2 }}>{[d.hMat, d.hFin, d.hBocc].filter(Boolean).join(" · ")}</div>
            </div>}
          </div>}

          {/* ── CISA ── */}
          <SectionAcc icon="🔒" title="Serratura CISA" color={T.acc} count={cisaC} open={sec.cisa} onToggle={() => tog("cisa")} />
          {sec.cisa && <div>
            <ChipSel label="Tipo serratura" options={cisaTipoFilt} value={d.cTipo} onChange={(v: string) => set("cTipo",v)} color={T.acc} />
            <ChipSel label="Cilindro" options={CISA_CIL} value={d.cCil} onChange={(v: string) => set("cCil",v)} color={T.acc} small />
            {d.cCil && d.cCil !== "Elettronico" && (
              <ChipSel label="Misura cilindro" options={CISA_MIS_CIL} value={d.cMisCil} onChange={(v: string) => set("cMisCil",v)} color={T.acc} small />
            )}
            <ChipSel label="Entrata" options={CISA_ENTRATA} value={d.cEntrata} onChange={(v: string) => set("cEntrata",v)} color={T.acc} small />
            {d.cTipo === "Antipanico" && (
              <ChipSel label="Maniglione antipanico" options={CISA_ANTIPAN} value={d.cAntip} onChange={(v: string) => set("cAntip",v)} color={T.red} />
            )}
            <ChipSel label="Chiudiporta" options={CISA_CHIUDIP} value={d.cChiudip} onChange={(v: string) => set("cChiudip",v)} color={T.acc} small />
            <Sel label="Versione" value={d.cVers} onChange={(v: string) => set("cVers",v)} options={["Destra","Sinistra","Reversibile"]} />
            {d.cTipo && <div style={{ background:T.acc+"0c", border:`1px solid ${T.acc}25`, borderRadius:9, padding:"8px 10px", marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:T.acc }}>{d.cTipo}</div>
              <div style={{ fontSize:9, color:T.sub, marginTop:2 }}>{[d.cCil, d.cMisCil, d.cEntrata, d.cChiudip !== "Nessuno" ? d.cChiudip : null].filter(Boolean).join(" · ")}</div>
            </div>}
          </div>}

          {/* ── NOTE + FOTO ── */}
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase" as any }}>Note</div>
            <textarea value={d.note||""} onChange={(e: any) => set("note",e.target.value)} placeholder="Coprifilo da coordinare, soglia da incassare, muro curvo, prese vicine..." style={{ width:"100%", padding:"10px 12px", fontSize:11, fontFamily:FF, border:`1.5px solid ${T.bdr}`, borderRadius:9, background:T.card, minHeight:50, resize:"vertical" as any, outline:"none", boxSizing:"border-box" as any }} />
          </div>

          <PhotoRow foto={d.foto} onCapture={handleFoto} />
        </>}


        {/* ════════════════════════════════════════════ */}
        {/* STEP 2: RIEPILOGO */}
        {/* ════════════════════════════════════════════ */}
        {step === 2 && <>
          <div style={{ background:T.card, borderRadius:12, border:`1.5px solid ${T.bdr}`, overflow:"hidden" }}>
            <div style={{ padding:"10px 14px", background:T.topbar, display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:12 }}>📋</span>
              <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>Riepilogo Porta</span>
              <span style={{ fontSize:9, color:"#888", marginLeft:"auto", fontFamily:FM }}>{total} campi</span>
            </div>
            <div style={{ padding:"12px 14px", fontSize:11, lineHeight:2.2, color:T.text }}>
              {/* Modello */}
              {d.modello && (() => { const mod = MODELLI.find(x => x.id === d.modello); return mod ? <RLine label="Modello" value={mod.nome} /> : null; })()}

              {/* Configurazione */}
              {d.materiale && <RLine label="Materiale" value={d.materiale} />}
              {d.apertura && <RLine label="Apertura" value={`${d.apertura}${d.senso ? ` (${d.senso})` : ""}`} />}
              {m.lCentro > 0 && m.hCentro > 0 && <RLine label="Misure" value={`${m.lCentro}×${m.hCentro} mm`} sub={m.spessoreMuro ? `muro ${m.spessoreMuro} mm` : undefined} mono />}
              {d.finitura && <RLine label="Finitura" value={`${d.finitura}${d.vetroInserto ? ` — ${d.vetroInserto}` : ""}`} />}
              {d.colore && <RLine label="Colore" value={d.colore} />}
              {d.controtelaio && <RLine label="Controtelaio" value={d.controtelaio} />}
              {d.aggancio && <RLine label="Aggancio" value={d.aggancio} />}
              {d.classeEI && <RLine label="🔥 Classe EI" value={d.classeEI} color={T.red} />}
              {d.classeRC && <RLine label="🛡 Classe RC" value={d.classeRC} color={T.acc} />}

              {/* Ferramenta */}
              {d.cernTipo && <RLine label="Cerniere" value={`${d.cernTipo}${d.cernQty ? ` · ${d.cernQty.split(" ")[0]}` : ""}${d.cernFin ? ` · ${d.cernFin}` : ""}`} />}
              {d.coprifTipo && d.coprifTipo !== "Senza coprifilo" && <RLine label="Coprifilo" value={`${d.coprifTipo}${d.coprifLarg ? ` ${d.coprifLarg}` : ""}${d.coprifMat ? ` · ${d.coprifMat}` : ""}`} />}
              {d.sogliaTipo && d.sogliaTipo !== "Nessuna soglia" && <RLine label="Soglia" value={`${d.sogliaTipo}${d.sogliaMat ? ` · ${d.sogliaMat}` : ""}`} />}
              {d.battuta && <RLine label="Battuta" value={d.battuta} />}
              {d.guarnizione && <RLine label="Guarnizione" value={d.guarnizione} />}

              {/* HOPPE + CISA */}
              {d.hSerie && <RLine label="🔑 Maniglia" value={`${d.hTipo} ${d.hSerie}`} sub={[d.hMat, d.hFin, d.hBocc].filter(Boolean).join(" · ")} color={T.acc} />}
              {d.cTipo && <RLine label="🔒 Serratura" value={d.cTipo} sub={[d.cCil, d.cMisCil, d.cEntrata].filter(Boolean).join(" · ")} color={T.acc} />}
              {d.cChiudip && d.cChiudip !== "Nessuno" && <RLine label="Chiudiporta" value={d.cChiudip} />}

              {/* Note */}
              {d.note && <RLine label="Note" value={d.note} />}
            </div>

            {/* Foto preview */}
            {d.foto && Object.values(d.foto).some(Boolean) && (
              <div style={{ padding:"8px 14px 12px", display:"flex", gap:6 }}>
                {Object.entries(d.foto).filter(([,v]) => v).map(([k,v]: any) => (
                  <img key={k} src={v} style={{ width:70, height:52, objectFit:"cover" as any, borderRadius:6, border:`1px solid ${T.bdr}` }} alt={k} />
                ))}
              </div>
            )}
          </div>
        </>}

      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed" as any, bottom:0, left:0, right:0, background:T.card, borderTop:`1px solid ${T.bdr}`, padding:"10px 16px", display:"flex", gap:8, maxWidth:480, margin:"0 auto", zIndex:99 }}>
        <div onClick={() => step > 0 ? setStep(step-1) : onBack()} style={{ flex:1, padding:"12px", borderRadius:10, background:T.bg, textAlign:"center" as any, fontSize:12, fontWeight:700, color:T.sub, cursor:"pointer" }}>
          {step > 0 ? "← Indietro" : "← Esci"}
        </div>
        <div onClick={() => step < 2 ? setStep(step+1) : onBack()} style={{
          flex:2, padding:"12px", borderRadius:10,
          background: step === 2 ? (total >= 6 ? T.green : T.bdr) : T.acc,
          textAlign:"center" as any, fontSize:12, fontWeight:800,
          color: step === 2 ? (total >= 6 ? "#fff" : T.sub) : "#fff",
          cursor: "pointer", transition:"all .2s"
        }}>
          {step === 2 ? `✓ Salva porta · ${total}/${totalMax}` : `Avanti → ${STEPS[step+1]}`}
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus,textarea:focus{border-color:${T.acc}!important;box-shadow:0 0 0 3px ${T.acc}20}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}


// ═══ RIEPILOGO LINE COMPONENT ═══
const RLine = ({ label, value, sub, color, mono }: { label:string; value:string; sub?:string; color?:string; mono?:boolean }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"2px 0" }}>
    <span style={{ color:T.sub, fontSize:10 }}>{label}:</span>
    <span style={{ fontWeight:700, fontSize:11, color:color||T.text, fontFamily:mono?FM:FF, textAlign:"right" as any, maxWidth:"65%" }}>
      {value}
      {sub && <span style={{ fontSize:9, color:T.sub, fontWeight:500, marginLeft:4 }}>{sub}</span>}
    </span>
  </div>
);
