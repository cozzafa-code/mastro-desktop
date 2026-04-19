// ═══════════════════════════════════════════════════════════════════
// MASTRO ERP — BoxDocciaDetailPanel.tsx
// Form misure completo per settore BOX DOCCIA
// Basato su catalogo MastroBoxDoccia (7 config + vetro + profili + piatto)
//
// INTEGRAZIONE:
// In VanoSectorRouter.tsx:
//   import BoxDocciaDetailPanel from "./BoxDocciaDetailPanel";
//   case "boxdoccia": return <BoxDocciaDetailPanel vano={vano} onUpdate={updateField} onBack={onBack} />;
//
// CAMPI SALVATI nel vano:
// config, apertura, anteVasca
// misure.lCentro, misure.hCentro, misure.profondita, riducibile
// vetroTipo, vetroFin, vetroTratt
// profilMat, profilFin
// piattoTipo, piattoForma, piattoScarico, piattoL, piattoP
// aggancio, accessori[]
// note, foto.fronte, foto.retro, foto.dettaglio
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { captureFotoVano, captureFotoSimple } from "@/lib/vano-foto-uploader";

// ═══ MASTRO DS v1.0 ═══
const T = { bg:"#F2F1EC", card:"#FFFFFF", topbar:"#1A1A1C", acc:"#D08008", text:"#1A1A1C", sub:"#8E8E93", bdr:"#E5E4DF", green:"#1A9E73", red:"#DC4444", blue:"#3B7FE0" };
const FF = "'Inter', system-ui, sans-serif";
const FM = "'JetBrains Mono', monospace";

// ═══════════════════════════════════════════════════════════════════
// CATALOGO BOX DOCCIA — COSTANTI COMPLETE
// ═══════════════════════════════════════════════════════════════════

const CONFIGURAZIONI = [
  { id:"nicchia",       nome:"Nicchia",        desc:"Tra due muri paralleli" },
  { id:"angolare-l",    nome:"Angolare L",     desc:"Due lati vetro, angolo 90°" },
  { id:"angolare-u",    nome:"Angolare U",     desc:"Tre lati vetro" },
  { id:"walkin",        nome:"Walk-in",        desc:"Pannello fisso, ingresso aperto" },
  { id:"semicircolare", nome:"Semicircolare",  desc:"Piatto curvo, ante curve" },
  { id:"vasca",         nome:"Parete vasca",   desc:"Sopra vasca, 1-2 ante" },
  { id:"pentagonale",   nome:"Pentagonale",    desc:"Piatto pentagonale, angolo tagliato" },
];

const APERTURE = ["Scorrevole","Battente","Pivot","Saloon","Soffietto","Fisso (walk-in)","Combinata (fisso+battente)"];
const VETRO_TIPO = ["Temperato 6mm","Temperato 8mm","Stratificato 6+6","Temperato extra-chiaro 6mm","Temperato extra-chiaro 8mm"];
const VETRO_FINITURA = ["Trasparente","Satinato integrale","Satinato fascia centrale","Serigrafato","Fumé","Specchiato","Decorato"];
const VETRO_TRATTAMENTO = ["Nessuno","Anticalcare standard","Anticalcare permanente (tipo ClearShield)","Easy-clean nanotecnologico"];
const PROFILI_MAT = ["Alluminio","Acciaio inox","Ottone","Frameless (senza profili)"];
const PROFILI_FIN = ["Cromo lucido","Cromo satinato","Nero opaco","Nero satinato","Oro spazzolato","Bronzo","Rame","Bianco","Gunmetal"];
const PIATTO_TIPO = ["Non incluso","Acrilico (ABS)","Resina (mineralmarmo)","Ceramica","Pietra naturale","Filo pavimento (su misura)"];
const PIATTO_FORMA = ["Rettangolare","Quadrato","Semicircolare","Pentagonale","Angolare simmetrico","Angolare asimmetrico"];
const PIATTO_SCARICO = ["Centrale","Laterale","Lineare (canaletta)","A scomparsa"];
const ACCESSORI = ["Maniglia esterna","Maniglia interna","Portasalviette","Gancio accappatoio","Mensola angolare","Sedile ribaltabile","Barra stabilizzatrice extra","Gocciolatoio magnetico"];
const AGGANCIO = ["A muro (tasselli)","A pavimento (perno)","A soffitto","Su muretto preesistente","A vetro (morsetti)","Incasso profilo"];
const MISURE_NICCHIA = [{l:700,lb:"70"},{l:800,lb:"80"},{l:900,lb:"90"},{l:1000,lb:"100"},{l:1100,lb:"110"},{l:1200,lb:"120"},{l:1400,lb:"140"},{l:1600,lb:"160"},{l:1700,lb:"170"}];
const ANTE_VASCA = ["1 anta fissa","1 anta mobile","2 ante (fisso+mobile)","Soffietto"];


// ═══════════════════════════════════════════════════════════════════
// UI COMPONENTS (shared pattern)
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

const ChipMulti = ({ label, options, value=[], onChange, small }: any) => (
  <div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 5, textTransform: "uppercase" as any, letterSpacing: 0.5 }}>{label}</div>
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as any }}>
      {options.map((o: string) => <Chip key={o} label={o} sel={value.includes(o)} onTap={() => onChange(value.includes(o) ? value.filter((x: string) => x !== o) : [...value, o])} small={small} />)}
    </div>
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
              <span style={{ fontSize: 8, color: T.sub, fontWeight: 600 }}>{cat === "fronte" ? "Foto bagno" : cat === "retro" ? "Schizzo" : "Dettaglio"}</span>
            </>
          )}
        </div>
      );
    })}
  </div>
);


// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION THUMBNAIL SVGs (planimetria)
// ═══════════════════════════════════════════════════════════════════
const ConfigThumb = ({ id, size = 52 }: { id: string; size?: number }) => {
  const s = size;
  const thumbs: Record<string, JSX.Element> = {
    nicchia: (
      <svg width={s} height={s} viewBox="0 0 56 56">
        <rect x="4" y="8" width="6" height="40" fill="#ccc"/>
        <rect x="46" y="8" width="6" height="40" fill="#ccc"/>
        <rect x="10" y="10" width="36" height="36" rx="1" fill={T.blue+"10"} stroke={T.blue} strokeWidth="1.5"/>
        <line x1="28" y1="10" x2="28" y2="46" stroke={T.blue+"55"} strokeWidth="1" strokeDasharray="3,2"/>
        <circle cx="26" cy="28" r="2" fill={T.blue}/>
      </svg>
    ),
    "angolare-l": (
      <svg width={s} height={s} viewBox="0 0 56 56">
        <rect x="4" y="4" width="6" height="48" fill="#ccc"/>
        <rect x="4" y="46" width="48" height="6" fill="#ccc"/>
        <rect x="10" y="10" width="36" height="36" rx="1" fill={T.blue+"10"} stroke={T.blue} strokeWidth="1.5"/>
        <line x1="10" y1="28" x2="46" y2="28" stroke={T.blue+"55"} strokeWidth="1" strokeDasharray="3,2"/>
      </svg>
    ),
    "angolare-u": (
      <svg width={s} height={s} viewBox="0 0 56 56">
        <rect x="4" y="4" width="6" height="48" fill="#ccc"/>
        <rect x="10" y="10" width="36" height="36" rx="1" fill={T.blue+"10"} stroke={T.blue} strokeWidth="1.5"/>
        <line x1="28" y1="10" x2="28" y2="46" stroke={T.blue+"44"} strokeWidth="0.8" strokeDasharray="2,2"/>
        <line x1="10" y1="28" x2="46" y2="28" stroke={T.blue+"44"} strokeWidth="0.8" strokeDasharray="2,2"/>
      </svg>
    ),
    walkin: (
      <svg width={s} height={s} viewBox="0 0 56 56">
        <rect x="4" y="8" width="6" height="40" fill="#ccc"/>
        <rect x="10" y="10" width="20" height="36" rx="1" fill={T.blue+"10"} stroke={T.blue} strokeWidth="1.5"/>
        <path d="M30 10 L30 46" stroke={T.blue} strokeWidth="2"/>
        <line x1="34" y1="28" x2="48" y2="28" stroke={T.blue+"33"} strokeWidth="1"/>
        <polygon points="46,25 52,28 46,31" fill={T.blue+"55"}/>
      </svg>
    ),
    semicircolare: (
      <svg width={s} height={s} viewBox="0 0 56 56">
        <rect x="4" y="4" width="6" height="48" fill="#ccc"/>
        <rect x="4" y="46" width="48" height="6" fill="#ccc"/>
        <path d="M10 46 Q10 10 46 10" fill={T.blue+"08"} stroke={T.blue} strokeWidth="1.5"/>
      </svg>
    ),
    vasca: (
      <svg width={s} height={s} viewBox="0 0 56 56">
        <rect x="8" y="32" width="40" height="18" rx="3" fill="#e8e6e1" stroke="#ccc" strokeWidth="1"/>
        <rect x="12" y="8" width="20" height="24" rx="1" fill={T.blue+"10"} stroke={T.blue} strokeWidth="1.5"/>
        <line x1="22" y1="8" x2="22" y2="32" stroke={T.blue+"55"} strokeWidth="1" strokeDasharray="3,2"/>
      </svg>
    ),
    pentagonale: (
      <svg width={s} height={s} viewBox="0 0 56 56">
        <rect x="4" y="4" width="6" height="48" fill="#ccc"/>
        <rect x="4" y="46" width="48" height="6" fill="#ccc"/>
        <path d="M10 46 L10 20 L30 10 L46 10" fill={T.blue+"08"} stroke={T.blue} strokeWidth="1.5"/>
      </svg>
    ),
  };
  return thumbs[id] || thumbs.nicchia;
};


// ═══════════════════════════════════════════════════════════════════
// SHOWER DRAWING SVG (planimetria grande)
// ═══════════════════════════════════════════════════════════════════
const DocciaDraw = ({ d }: any) => {
  const cfg = d.config || "";
  const larg = d.larghezza || "—";
  const prof = d.profondita || "—";
  const alt = d.altezza || "—";

  return (
    <div style={{ background: T.card, borderRadius: 12, border: `1.5px solid ${T.bdr}`, padding: "12px 8px 6px", marginBottom: 14 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" as any, letterSpacing: 0.5, marginBottom: 6, textAlign: "center" as any }}>Vista pianta</div>
      <svg width="100%" viewBox="0 0 220 180" style={{ maxHeight: 200 }}>

        {cfg === "nicchia" && <>
          <rect x="20" y="20" width="12" height="120" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <rect x="188" y="20" width="12" height="120" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <rect x="20" y="132" width="180" height="12" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <rect x="32" y="30" width="156" height="102" rx="2" fill={T.blue+"08"} stroke={T.blue} strokeWidth="1.5"/>
          <line x1="110" y1="30" x2="110" y2="132" stroke={T.blue+"44"} strokeWidth="1" strokeDasharray="4,3"/>
          <rect x="108" y="60" width="4" height="12" rx="2" fill={T.blue}/>
          <line x1="32" y1="155" x2="188" y2="155" stroke={T.sub} strokeWidth="0.5"/>
          <text x="110" y="168" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={T.acc}>{larg}</text>
        </>}

        {cfg === "angolare-l" && <>
          <rect x="20" y="20" width="12" height="140" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <rect x="20" y="148" width="180" height="12" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <rect x="32" y="30" width="140" height="118" rx="2" fill={T.blue+"08"} stroke={T.blue} strokeWidth="1.5"/>
          <line x1="32" y1="90" x2="172" y2="90" stroke={T.blue+"44"} strokeWidth="1" strokeDasharray="4,3"/>
          <line x1="32" y1="168" x2="172" y2="168" stroke={T.sub} strokeWidth="0.5"/>
          <text x="102" y="178" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={T.acc}>{larg}</text>
          <line x1="185" y1="30" x2="185" y2="148" stroke={T.sub} strokeWidth="0.5"/>
          <text x="200" y="92" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={T.acc} transform="rotate(-90,200,92)">{prof}</text>
        </>}

        {cfg === "angolare-u" && <>
          <rect x="20" y="80" width="12" height="80" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <rect x="32" y="30" width="140" height="118" rx="2" fill={T.blue+"08"} stroke={T.blue} strokeWidth="1.5"/>
          <line x1="102" y1="30" x2="102" y2="148" stroke={T.blue+"44"} strokeWidth="0.8" strokeDasharray="2,2"/>
          <line x1="32" y1="90" x2="172" y2="90" stroke={T.blue+"44"} strokeWidth="0.8" strokeDasharray="2,2"/>
          <line x1="32" y1="168" x2="172" y2="168" stroke={T.sub} strokeWidth="0.5"/>
          <text x="102" y="178" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={T.acc}>{larg}</text>
          <line x1="185" y1="30" x2="185" y2="148" stroke={T.sub} strokeWidth="0.5"/>
          <text x="200" y="92" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={T.acc} transform="rotate(-90,200,92)">{prof}</text>
        </>}

        {cfg === "walkin" && <>
          <rect x="20" y="20" width="12" height="140" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <rect x="20" y="148" width="180" height="12" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <rect x="32" y="30" width="80" height="118" rx="2" fill={T.blue+"08"} stroke={T.blue} strokeWidth="2"/>
          <line x1="116" y1="85" x2="170" y2="85" stroke={T.blue+"33"} strokeWidth="1"/>
          <polygon points="166,82 174,85 166,88" fill={T.blue+"55"}/>
          <text x="145" y="78" textAnchor="middle" fontSize="8" fill={T.sub}>ingresso</text>
          <line x1="32" y1="168" x2="112" y2="168" stroke={T.sub} strokeWidth="0.5"/>
          <text x="72" y="178" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={T.acc}>{larg}</text>
        </>}

        {cfg === "vasca" && <>
          <rect x="30" y="60" width="160" height="80" rx="8" fill="#e8e6e1" stroke="#ccc" strokeWidth="1"/>
          <text x="110" y="108" textAnchor="middle" fontSize="9" fill={T.sub}>vasca</text>
          <rect x="40" y="20" width="80" height="40" rx="2" fill={T.blue+"10"} stroke={T.blue} strokeWidth="1.5"/>
          <line x1="80" y1="20" x2="80" y2="60" stroke={T.blue+"44"} strokeWidth="1" strokeDasharray="3,2"/>
          <line x1="40" y1="155" x2="120" y2="155" stroke={T.sub} strokeWidth="0.5"/>
          <text x="80" y="168" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={T.acc}>{larg}</text>
        </>}

        {cfg === "semicircolare" && <>
          <rect x="20" y="20" width="12" height="140" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <rect x="20" y="148" width="180" height="12" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <path d="M32 148 Q32 30 172 30" fill={T.blue+"08"} stroke={T.blue} strokeWidth="1.5"/>
          <line x1="32" y1="168" x2="172" y2="168" stroke={T.sub} strokeWidth="0.5"/>
          <text x="102" y="178" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={T.acc}>{larg}</text>
        </>}

        {cfg === "pentagonale" && <>
          <rect x="20" y="20" width="12" height="140" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <rect x="20" y="148" width="180" height="12" fill="#ddd" stroke="#bbb" strokeWidth="0.8"/>
          <path d="M32 148 L32 70 L100 30 L172 30" fill={T.blue+"08"} stroke={T.blue} strokeWidth="1.5"/>
          <line x1="32" y1="168" x2="172" y2="168" stroke={T.sub} strokeWidth="0.5"/>
          <text x="102" y="178" textAnchor="middle" fontSize="9" fontFamily={FM} fontWeight="700" fill={T.acc}>{larg}</text>
        </>}

        {!cfg && <text x="110" y="90" textAnchor="middle" fontSize="11" fill={T.sub}>Seleziona configurazione</text>}

        <text x="110" y="14" textAnchor="middle" fontSize="8" fill={T.sub}>H: {alt} mm</text>
      </svg>
    </div>
  );
};


// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════

interface BoxDocciaDetailPanelProps {
  vano: any;
  onUpdate: (field: string, value: any) => void;
  onBack: () => void;
  aziendaId?: string;
  cmId?: string;
}

export default function BoxDocciaDetailPanel({ vano, onUpdate, onBack, aziendaId, cmId }: BoxDocciaDetailPanelProps) {
  const [step, setStep] = useState(0);
  const [sec, setSec] = useState<Record<string,boolean>>({ config:true, mis:true, vetro:false, profili:false, piatto:false, acc:false });
  const tog = (s: string) => setSec(p => ({...p, [s]:!p[s]}));

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

  const isAng = (d.config||"").includes("angolare") || d.config === "pentagonale" || d.config === "angolare-u";

  // Counts
  const confC = [d.config, d.apertura].filter(Boolean).length;
  const misC = [m.lCentro, m.hCentro].filter(Boolean).length + (isAng && m.profondita ? 1 : 0);
  const vetroC = [d.vetroTipo, d.vetroFin, d.vetroTratt].filter(Boolean).length;
  const profC = [d.profilMat, d.profilFin].filter(Boolean).length;
  const piatC = [d.piattoTipo, d.piattoForma].filter(Boolean).length;
  const accC = [d.aggancio, ...(d.accessori||[])].filter(Boolean).length;
  const total = confC + misC + vetroC + profC + piatC + accC;
  const totalMax = 20;

  const STEPS = ["Config & Misure","Vetro & Profili","Riepilogo"];

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:FF }}>
      {/* TOPBAR */}
      <div style={{ background:T.topbar, padding:"12px 16px", display:"flex", alignItems:"center", gap:10, position:"sticky" as any, top:0, zIndex:99 }}>
        <div onClick={onBack} style={{ width:30, height:30, borderRadius:7, background:"#ffffff15", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:13, color:"#fff" }}>←</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>🚿 Box Doccia — Presa Misure</div>
          <div style={{ fontSize:10, color:"#888" }}>{d.nome || "Vano"} · {d.stanza || ""}</div>
        </div>
        <div style={{ background:total>=totalMax*0.5?T.green+"30":T.blue+"30", color:total>=totalMax*0.5?T.green:T.blue, padding:"3px 10px", borderRadius:16, fontSize:11, fontWeight:800, fontFamily:FM }}>{total}/{totalMax}</div>
      </div>
      <div style={{ height:3, background:T.bdr }}><div style={{ height:3, background:total>=totalMax*0.5?T.green:T.blue, width:`${(total/totalMax)*100}%`, transition:"width .3s", borderRadius:2 }} /></div>

      {/* STEP DOTS */}
      <div style={{ display:"flex", gap:6, padding:"10px 16px", justifyContent:"center" }}>
        {STEPS.map((s, i) => (
          <div key={i} onClick={() => setStep(i)} style={{
            padding:"5px 14px", borderRadius:20, fontSize:10, fontWeight:700, cursor:"pointer",
            background: step===i ? T.blue : T.card, color: step===i ? "#fff" : T.sub,
            border: `1px solid ${step===i ? T.blue : T.bdr}`, transition:"all .15s"
          }}>{i+1}. {s}</div>
        ))}
      </div>

      <div style={{ padding:"4px 16px 100px" }}>

        {/* ════════════════════════════════════════════ */}
        {/* STEP 0: CONFIGURAZIONE & MISURE */}
        {/* ════════════════════════════════════════════ */}
        {step === 0 && <>

          {/* Disegno planimetria */}
          {d.config && <DocciaDraw d={{ config:d.config, larghezza:m.lCentro, profondita:m.profondita, altezza:m.hCentro }} />}

          {/* ── CONFIGURAZIONE ── */}
          <SectionAcc icon="🚿" title="Configurazione" color={T.blue} count={confC} open={sec.config} onToggle={() => tog("config")} />
          {sec.config && <div>
            <div style={{ display:"flex", flexDirection:"column" as any, gap:6, marginBottom:12 }}>
              {CONFIGURAZIONI.map(c => (
                <div key={c.id} onClick={() => set("config", c.id === d.config ? null : c.id)} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:11,
                  border:`1.5px solid ${d.config===c.id ? T.blue : T.bdr}`,
                  background: d.config===c.id ? T.blue+"0a" : T.card,
                  cursor:"pointer", transition:"all .12s"
                }}>
                  <div style={{ width:52, height:52, borderRadius:8, background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <ConfigThumb id={c.id} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:d.config===c.id ? T.blue : T.text }}>{c.nome}</div>
                    <div style={{ fontSize:9, color:T.sub, marginTop:1 }}>{c.desc}</div>
                  </div>
                  {d.config===c.id && <div style={{ width:18, height:18, borderRadius:9, background:T.blue, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:800 }}>✓</div>}
                </div>
              ))}
            </div>

            <ChipSel label="Tipo apertura" options={d.config === "walkin" ? ["Fisso (walk-in)"] : APERTURE} value={d.apertura} onChange={(v: string) => set("apertura",v)} color={T.blue} />
            {d.config === "vasca" && <ChipSel label="Ante parete vasca" options={ANTE_VASCA} value={d.anteVasca} onChange={(v: string) => set("anteVasca",v)} color={T.blue} small />}
          </div>}

          {/* ── MISURE ── */}
          <SectionAcc icon="📐" title="Misure" color={T.blue} count={misC} open={sec.mis} onToggle={() => tog("mis")} />
          {sec.mis && <div>
            {/* Quick sizes for nicchia */}
            {d.config === "nicchia" && <>
              <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase" as any }}>Larghezza nicchia (cm)</div>
              <div style={{ display:"flex", gap:4, flexWrap:"wrap" as any, marginBottom:12 }}>
                {MISURE_NICCHIA.map(ms => <Chip key={ms.lb} label={ms.lb} sel={m.lCentro===ms.l} color={T.blue} onTap={() => setM("lCentro",ms.l)} small />)}
              </div>
            </>}

            <div style={{ display:"flex", gap:8 }}>
              <div style={{ flex:1 }}>
                <NumInput label={d.config==="nicchia" ? "Larghezza nicchia" : "Larghezza ingresso"} value={m.lCentro} onChange={(v: number) => setM("lCentro",v)} />
              </div>
              {isAng && <div style={{ flex:1 }}>
                <NumInput label="Profondità (lato corto)" value={m.profondita} onChange={(v: number) => setM("profondita",v)} />
              </div>}
            </div>
            <NumInput label="Altezza box" value={m.hCentro} onChange={(v: number) => setM("hCentro",v)} />

            <ChipSel label="Riducibile" options={["No","Sì, taglio laterale","Sì, taglio altezza","Sì, entrambi"]} value={d.riducibile} onChange={(v: string) => set("riducibile",v)} color={T.blue} small />
            {d.riducibile && d.riducibile !== "No" && (
              <div style={{ fontSize:10, color:T.blue, background:T.blue+"12", border:`1px solid ${T.blue}30`, padding:"8px 10px", borderRadius:9, marginBottom:12 }}>
                📐 Profili riducibili: taglio in cantiere per adattamento ±20mm
              </div>
            )}
          </div>}
        </>}


        {/* ════════════════════════════════════════════ */}
        {/* STEP 1: VETRO, PROFILI, PIATTO, ACCESSORI */}
        {/* ════════════════════════════════════════════ */}
        {step === 1 && <>

          {/* ── VETRO ── */}
          <SectionAcc icon="🪟" title="Vetro" color={T.blue} count={vetroC} open={sec.vetro} onToggle={() => tog("vetro")} />
          {sec.vetro && <div>
            <ChipSel label="Tipo vetro" options={VETRO_TIPO} value={d.vetroTipo} onChange={(v: string) => set("vetroTipo",v)} color={T.blue} />
            <ChipSel label="Finitura vetro" options={VETRO_FINITURA} value={d.vetroFin} onChange={(v: string) => set("vetroFin",v)} color={T.blue} small />
            <ChipSel label="Trattamento" options={VETRO_TRATTAMENTO} value={d.vetroTratt} onChange={(v: string) => set("vetroTratt",v)} color={T.blue} small />
            {d.vetroTratt && d.vetroTratt.includes("permanente") && (
              <div style={{ fontSize:10, color:T.green, background:T.green+"12", border:`1px solid ${T.green}30`, padding:"8px 10px", borderRadius:9, marginBottom:12 }}>
                ✓ Trattamento permanente: protezione anti-calcare garantita 10 anni
              </div>
            )}
          </div>}

          {/* ── PROFILI ── */}
          <SectionAcc icon="🔧" title="Profili e ferramenta" color={T.blue} count={profC} open={sec.profili} onToggle={() => tog("profili")} />
          {sec.profili && <div>
            <ChipSel label="Materiale profili" options={PROFILI_MAT} value={d.profilMat} onChange={(v: string) => set("profilMat",v)} color={T.blue} />
            {d.profilMat !== "Frameless (senza profili)" && (
              <ChipSel label="Finitura profili" options={PROFILI_FIN} value={d.profilFin} onChange={(v: string) => set("profilFin",v)} color={T.blue} small />
            )}
            {d.profilMat === "Frameless (senza profili)" && (
              <div style={{ fontSize:10, color:T.acc, background:T.acc+"12", border:`1px solid ${T.acc}30`, padding:"8px 10px", borderRadius:9, marginBottom:12 }}>
                ✨ Frameless: vetro temperato 8mm minimo, morsetti puntuali, estetica minimale
              </div>
            )}
          </div>}

          {/* ── PIATTO DOCCIA ── */}
          <SectionAcc icon="🧱" title="Piatto doccia" color={T.blue} count={piatC} open={sec.piatto} onToggle={() => tog("piatto")} />
          {sec.piatto && <div>
            <ChipSel label="Tipo piatto" options={PIATTO_TIPO} value={d.piattoTipo} onChange={(v: string) => set("piattoTipo",v)} color={T.blue} />
            {d.piattoTipo && d.piattoTipo !== "Non incluso" && <>
              <ChipSel label="Forma" options={PIATTO_FORMA} value={d.piattoForma} onChange={(v: string) => set("piattoForma",v)} color={T.blue} small />
              <ChipSel label="Scarico" options={PIATTO_SCARICO} value={d.piattoScarico} onChange={(v: string) => set("piattoScarico",v)} color={T.blue} small />
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}><NumInput label="Larghezza piatto" value={d.piattoL} onChange={(v: number) => set("piattoL",v)} /></div>
                <div style={{ flex:1 }}><NumInput label="Profondità piatto" value={d.piattoP} onChange={(v: number) => set("piattoP",v)} /></div>
              </div>
            </>}
          </div>}

          {/* ── ACCESSORI ── */}
          <SectionAcc icon="🔨" title="Accessori e montaggio" color={T.blue} count={accC} open={sec.acc} onToggle={() => tog("acc")} />
          {sec.acc && <div>
            <ChipSel label="Sistema aggancio" options={AGGANCIO} value={d.aggancio} onChange={(v: string) => set("aggancio",v)} color={T.blue} />
            <ChipMulti label="Accessori" options={ACCESSORI} value={d.accessori || []} onChange={(v: string[]) => set("accessori",v)} small />
          </div>}

          {/* ── NOTE + FOTO ── */}
          <div style={{ marginTop:16 }}>
            <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:5, textTransform:"uppercase" as any }}>Note</div>
            <textarea value={d.note||""} onChange={(e: any) => set("note",e.target.value)} placeholder="Tubazioni esistenti, piastrelle da proteggere, accesso difficile..." style={{ width:"100%", padding:"10px 12px", fontSize:11, fontFamily:FF, border:`1.5px solid ${T.bdr}`, borderRadius:9, background:T.card, minHeight:50, resize:"vertical" as any, outline:"none", boxSizing:"border-box" as any }} />
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
              <span style={{ fontSize:12, fontWeight:700, color:"#fff" }}>Riepilogo Box Doccia</span>
              <span style={{ fontSize:9, color:"#888", marginLeft:"auto", fontFamily:FM }}>{total} campi</span>
            </div>
            <div style={{ padding:"12px 14px", fontSize:11, lineHeight:2.2, color:T.text }}>
              {d.config && <RLine label="Configurazione" value={CONFIGURAZIONI.find(c => c.id === d.config)?.nome || d.config} color={T.blue} />}
              {d.apertura && <RLine label="Apertura" value={d.apertura} />}
              {d.config === "vasca" && d.anteVasca && <RLine label="Ante vasca" value={d.anteVasca} />}
              {m.lCentro > 0 && <RLine label="Larghezza" value={`${m.lCentro} mm`} mono />}
              {isAng && m.profondita > 0 && <RLine label="Profondità" value={`${m.profondita} mm`} mono />}
              {m.hCentro > 0 && <RLine label="Altezza" value={`${m.hCentro} mm`} mono />}
              {d.riducibile && d.riducibile !== "No" && <RLine label="Riducibile" value={d.riducibile} />}
              {d.vetroTipo && <RLine label="Vetro" value={`${d.vetroTipo}${d.vetroFin ? ` · ${d.vetroFin}` : ""}`} />}
              {d.vetroTratt && d.vetroTratt !== "Nessuno" && <RLine label="Trattamento" value={d.vetroTratt} />}
              {d.profilMat && <RLine label="Profili" value={`${d.profilMat}${d.profilFin ? ` · ${d.profilFin}` : ""}`} />}
              {d.piattoTipo && d.piattoTipo !== "Non incluso" && <RLine label="Piatto" value={`${d.piattoTipo}${d.piattoForma ? ` · ${d.piattoForma}` : ""}`} sub={d.piattoScarico ? `Scarico: ${d.piattoScarico}` : undefined} />}
              {d.piattoL > 0 && d.piattoP > 0 && <RLine label="Mis. piatto" value={`${d.piattoL}×${d.piattoP} mm`} mono />}
              {d.aggancio && <RLine label="Aggancio" value={d.aggancio} />}
              {(d.accessori||[]).length > 0 && <RLine label="Accessori" value={(d.accessori||[]).join(", ")} />}
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
          background: step === 2 ? (total >= 5 ? T.green : T.bdr) : T.blue,
          textAlign:"center" as any, fontSize:12, fontWeight:800,
          color: step === 2 ? (total >= 5 ? "#fff" : T.sub) : "#fff",
          cursor:"pointer", transition:"all .2s"
        }}>
          {step === 2 ? `✓ Salva box doccia · ${total}/${totalMax}` : `Avanti → ${STEPS[step+1]}`}
        </div>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}input:focus,select:focus,textarea:focus{border-color:${T.blue}!important;box-shadow:0 0 0 3px ${T.blue}20}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}`}</style>
    </div>
  );
}


// ═══ RIEPILOGO LINE ═══
const RLine = ({ label, value, sub, color, mono }: { label:string; value:string; sub?:string; color?:string; mono?:boolean }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"2px 0" }}>
    <span style={{ color:T.sub, fontSize:10 }}>{label}:</span>
    <span style={{ fontWeight:700, fontSize:11, color:color||T.text, fontFamily:mono?FM:FF, textAlign:"right" as any, maxWidth:"65%" }}>
      {value}
      {sub && <span style={{ fontSize:9, color:T.sub, fontWeight:500, marginLeft:4 }}>{sub}</span>}
    </span>
  </div>
);
