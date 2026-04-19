"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — VanoDetailPanel
// Estratto S4: ~1.505 righe (Dettaglio vano + misure + disegno + accessori)
// ═══════════════════════════════════════════════════════════
import DisegnoTecnico from "./DisegnoTecnico";
import ConfiguratoreControtelaio from "./ConfiguratoreControtelaio";
import SkizzoTecnico from "./SkizzoTecnico";
import OrdineControtelaiPanel from "./OrdineControtelaiPanel";
import CassonettoEditor from "./CassonettoEditor";
import BoxEditor from "./BoxEditor";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, Ico, I, TIPOLOGIE_RAPIDE, ZANZ_CATEGORIE } from "./mastro-constants";
import { generaTavolaTecnica } from "../lib/pdf-tavola-tecnica";
import FotoMisure from "./FotoMisure";
import AccessoriCatalogoVano from "./AccessoriCatalogoVano";
import { supabase } from "@/lib/supabase";

// ─── STATI MISURE ──────────────────────────────────────────
const STATO_MISURE = [
  { id: "provvisorie", label: "Provvisorie", color: "#D08008", bg: "#D0800818", icon: "", desc: "Misure non ancora verificate" },
  { id: "verificate",  label: "Verificate",  color: "#D08008",  bg: "#D0800815", icon: "", desc: "Verificate sul posto, non ancora confermate" },
  { id: "confermate",  label: "Confermate",  color: "#1A9E73",  bg: "#1A9E7315", icon: "", desc: "Misure definitive — preventivo sbloccato" },
  { id: "da_rivedere", label: "Da rivedere", color: "#DC4444",  bg: "#DC444415", icon: "", desc: "Rilevate discrepanze — ricontrollare" },
];
const getStatoMisure = (v) => STATO_MISURE.find(s => s.id === (v?.statoMisure || "provvisorie")) || STATO_MISURE[0];

// ── Upload foto su Supabase Storage ──
async function uploadFotoVano(userId, cmId, vanoId, file, nome) {
  try {
    const ext = nome.split(".").pop() || "jpg";
    const path = `${userId}/${cmId}/${vanoId}/${Date.now()}_${nome}`;
    const { error } = await supabase.storage
      .from("foto-vani")
      .upload(path, file, { contentType: `image/${ext === "jpg" ? "jpeg" : ext}`, upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("foto-vani").getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.warn("[FOTO] Upload fallito, uso base64:", e);
    return null;
  }
}
async function deleteFotoVano(url) {
  try {
    const parts = url.split("/foto-vani/");
    if (parts.length < 2) return;
    await supabase.storage.from("foto-vani").remove([parts[1]]);
  } catch {}
}


function VanoMiniSVG({ type, stepColor }: { type: string; stepColor: string }) {
  const w = 60, h = 70;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
      <rect x={5} y={5} width={w-10} height={h-10} fill={stepColor + "12"} stroke={stepColor + "40"} strokeWidth={1.5} rx={3} />
      {type === "larghezze" && <>
        <line x1={10} y1={18} x2={w-10} y2={18} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
        <line x1={10} y1={h/2} x2={w-10} y2={h/2} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
        <line x1={10} y1={h-18} x2={w-10} y2={h-18} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
      </>}
      {type === "altezze" && <>
        <line x1={14} y1={10} x2={14} y2={h-10} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
        <line x1={w/2} y1={10} x2={w/2} y2={h-10} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
        <line x1={w-14} y1={10} x2={w-14} y2={h-10} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
      </>}
      {type === "diagonali" && <>
        <line x1={10} y1={10} x2={w-10} y2={h-10} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
        <line x1={w-10} y1={10} x2={10} y2={h-10} stroke={stepColor} strokeWidth={1.2} strokeDasharray="3,2" />
      </>}
      {type === "spallette" && <>
        <rect x={2} y={5} width={10} height={h-10} fill={stepColor + "25"} stroke={stepColor+"60"} rx={1} />
        <rect x={w-12} y={5} width={10} height={h-10} fill={stepColor + "25"} stroke={stepColor+"60"} rx={1} />
        <rect x={5} y={2} width={w-10} height={8} fill={stepColor + "18"} stroke={stepColor+"40"} rx={1} />
      </>}
      {type === "davanzale" && <>
        <rect x={5} y={h-16} width={w-10} height={10} fill={stepColor + "25"} stroke={stepColor+"60"} rx={1} />
      </>}
    </svg>
  );
}

function VanoBInput({ label, field, value, stepColor, textColor, subColor, bdrColor, cardBg, onUpdate }: {
  label: string; field: string; value: number;
  stepColor: string; textColor: string; subColor: string; bdrColor: string; cardBg: string;
  onUpdate: (val: number) => void;
}) {
  const isFilled = value > 0;
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: isFilled ? "#28A0A0" : "#8A8A82", marginBottom: 5, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ position: "relative" }}>
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value > 0 ? value : ""}
          placeholder="—"
          onChange={e => onUpdate(parseInt(e.target.value) || 0)}
          style={{
            width: "100%", padding: "14px 16px", fontSize: 24, fontWeight: 900,
            fontFamily: "'JetBrains Mono',monospace", textAlign: "center" as const,
            border: `2px solid ${isFilled ? "#28A0A0" : "#F0EFEC"}`,
            borderRadius: 14,
            background: isFilled ? "rgba(40,160,160,0.06)" : "white",
            color: isFilled ? "#0D1F1F" : "#8BBCBC",
            outline: "none", boxSizing: "border-box" as const,
            WebkitAppearance: "none" as const,
            boxShadow: isFilled ? "0 2px 8px rgba(40,160,160,0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
          }}
        />
        {isFilled && <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 800, color: "#8A8A82", pointerEvents: "none" }}>mm</span>}
      </div>
    </div>
  );
}

export default function VanoDetailPanel() {
  const {
    T, S, isDesktop, fs, tipologieFiltrate,
    // State
    selectedCM, setSelectedCM, cantieri, setCantieri,
    selectedRilievo, setSelectedRilievo, isStorico,
    selectedVano, setSelectedVano, vanoStep, setVanoStep,
    vanoInfoOpen, setVanoInfoOpen, tipCat, setTipCat,
    spDrawing, setSpDrawing, viewingPhotoId, setViewingPhotoId,
    pendingFotoCat, setPendingFotoCat,
    showAIPhoto, setShowAIPhoto, aiPhotoStep, setAiPhotoStep,
    // Drawing
    isDrawing, setIsDrawing, drawTool, setDrawTool,
    drawPages, setDrawPages, drawPageIdx, setDrawPageIdx,
    drawFullscreen, setDrawFullscreen,
    penColor, setPenColor, penSize, setPenSize,
    // Voice
    voiceActive, voiceTranscript, startVoice, stopVoice,
    // Catalogo
    sistemiDB, coloriDB, vetriDB, coprifiliDB, lamiereDB, libreriaDB,
    tipoMisuraDB, tipoMisuraTappDB, tipoMisuraZanzDB, tipoCassonettoDB,
    posPersianaDB, telaiPersianaDB,
    ctProfDB, ctSezioniDB, ctCieliniDB, ctOffset,
    mezziSalita, fabOpen,
    // Helpers
    goBack, updateMisura, updateMisureBatch, updateVanoField, aziendaId,
    toggleAccessorio, updateAccessorio, compressImage,
    // Cataloghi accessori espansi
    zanzModelliDB, zanzRetiDB,
    cassModelliDB, cassIspezioneDB, cassTappoDB, cassSpallDB,
    tdSoleModelliDB, tdSoleMontaggioDB, tdSoleComandoDB,
    tdIntCategorieDB, tdIntTessutoDB, tdIntMontaggioDB, tdIntFinituraDB,
    bxDocAperturaDB, bxDocVetroDB, bxDocProfiloDB,
    cancSistemaDB, cancAutoDB,
    porteMaterialeDB, porteAperturaDB, porteFinituraDB, porteVetroDB,
    porteColoreDB, porteControtelaioDB, porteManiglia, porteClasseEI, porteClasseRC,
    settoriAttivi,
    showStrutture, setShowStrutture,
    spCanvasRef, canvasRef, fotoVanoRef, videoVanoRef, openCamera,
  } = useMastro();

  const STEPS = [
    { id: "misure", title: "MISURE", desc: "Larghezze, altezze e diagonali", color: "#507aff", icon: "" },
    { id: "dettagli", title: "DETTAGLI", desc: "Accessori, foto e note", color: "#af52de", icon: "" },
    { id: "riepilogo", title: "RIEPILOGO", desc: "Anteprima completa del vano", color: "#1A9E73", icon: "" },
  ];
  const [detailOpen, setDetailOpen] = useState<Record<string,boolean>>({});
  const [showDisegno, setShowDisegno] = useState(false);
  // === FLASH CONFIGURATORE ===
  const [flashSec, setFlashSec] = useState<string|null>(null);
  const [completedSecs, setCompletedSecs] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string,HTMLDivElement|null>>({});
  const SECTION_ORDER = ["accesso","tipologia","posizione","sistema","colori","telaio","coprifilo","lamiera","controtelaio"];
  const flashAndAdvance = (secId: string) => {
    console.log("FLASH:", secId);
    setCompletedSecs(prev => new Set([...prev, secId]));
    setFlashSec(secId);
    setTimeout(() => {
      setFlashSec(null);
      const idx = SECTION_ORDER.indexOf(secId);
      if (idx < SECTION_ORDER.length - 1) {
        const nextId = SECTION_ORDER[idx + 1];
        setVanoInfoOpen(nextId);
        setTimeout(() => {
          sectionRefs.current[nextId]?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
      } else {
        setVanoInfoOpen(null);
      }
    }, 450);
  };

  // ═══ VOICE RECOGNITION — Self-contained implementation ═══
  const [vrActive, setVrActive] = useState(false);
  const [showFotoMisure, setShowFotoMisure] = useState(false);
  const [showSchizzo, setShowSchizzo] = useState(false);
  const [showLamieraDisegno, setShowLamieraDisegno] = useState(false);
  const [showCassonettoEditor, setShowCassonettoEditor] = useState(false);
  const [showBoxEditor, setShowBoxEditor] = useState(false);
  const [lamieraSchizzoOpen, setLamieraSchizzoOpen] = useState(false);
  const [lamieraFabMenu, setLamieraFabMenu] = useState(false);
  const [lamieraTabLato, setLamieraTabLato] = useState<'right'|'left'>('right');
  const [lamieraTabY, setLamieraTabY] = useState(50); // percentuale top
  const lamieraTabDrag = React.useRef({dragging:false, startY:0, startPct:50});
  const [lamieraSchizzoFull, setLamieraSchizzoFull] = useState(false);
  const [lamieraFullscreen, setLamieraFullscreen] = useState(false);
  const [schizzoTool, setSchizzoTool] = useState<'pen'|'eraser'>('pen');
  const [spTool, setSpTool] = useState<'pen'|'eraser'>('pen');
  const [spSchizzoOpen, setSpSchizzoOpen] = useState(false);
  const [spSchizzoFull, setSpSchizzoFull] = useState(false);
  const [spColor, setSpColor] = useState('#1A2B4A');
  const [spSize, setSpSize] = useState(2);
  const [schizzoColor, setSchizzoColor] = useState('#1A2B4A');
  const [schizzoSize, setSchizzoSize] = useState(2.5);
  const schizzoCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const schizzoDrawing = React.useRef(false);
  const schizzo2Touches = React.useRef<any[]>([]);

  const [showOrdinePanel, setShowOrdinePanel] = useState(false);
  const [lamieraPieghe, setLamieraPieghe] = useState<Array<{dir:'su'|'giu'|'sx'|'dx', mm:number}>>([]);
  const [lamieraPDir, setLamieraPDir] = useState<'sx'|'dx'|'su'|'giu'>('sx');
  const [lamieraPMm, setLamieraPMm] = useState('');
  const [lamieraLatoBuono, setLamieraLatoBuono] = useState<'interno'|'esterno'>('esterno');
  const [lamieraAngoloInput, setLamieraAngoloInput] = useState(false);
  const [lamieraAngolo, setLamieraAngolo] = useState('90');
  const [lamieraAngoloPM, setLamieraAngoloPM] = useState<1|-1>(1); // +1 o -1
  const [lastDirTap, setLastDirTap] = useState<string>('');
  const [lamieraLatoInfisso, setLamieraLatoInfisso] = useState<'alto'|'basso'|'sx'|'dx'|''>('');
  const [lamieraSelIdx, setLamieraSelIdx] = useState<number|null>(null);
  const [lamieraLunghezza, setLamieraLunghezza] = useState('');
  // ── LAMIERA ZOOM/PAN refs ────────────────────────────────
  const [lamieraEditIdx, setLamieraEditIdx] = React.useState<number|null>(null); // indice lamiera in modifica
  const lamieraZoom = React.useRef(1);
  const lamieraPan = React.useRef({x:0,y:0});
  const lamieraTouches = React.useRef<any[]>([]);
  const lamieraSvgRef = React.useRef<SVGSVGElement>(null);
  // ── NUMPAD NATIVO ────────────────────────────────────────
  const [numpadField, setNumpadField] = useState<string|null>(null);
  const [numpadVal, setNumpadVal] = useState("");
  const openNumpad = (field: string) => {
    setNumpadField(field);
    setNumpadVal(v.misure?.[field] > 0 ? String(v.misure[field]) : "");
  };
  const closeNumpad = () => { setNumpadField(null); setNumpadVal(""); };
  const confirmNumpad = () => {
    if (numpadField) updateMisura(v.id, numpadField, numpadVal);
    closeNumpad();
  };
  const numpadTap = (k: string) => {
    if (k === "") { setNumpadVal(n => n.slice(0,-1)); return; }
    if (numpadVal.length >= 5) return;
    setNumpadVal(n => n + k);
  };
  const [showStatoMisurePanel, setShowStatoMisurePanel] = useState(false);
  const applyParsedRef = useRef<any>(null);
  const saveVoiceNoteRef = useRef<any>(null);
  const [vrTranscripts, setVrTranscripts] = useState<{text:string,time:string,parsed?:Record<string,any>}[]>([]);
  const [vrInterim, setVrInterim] = useState("");
  const [vrError, setVrError] = useState("");
  const recognitionRef = useRef<any>(null);

  const parseVoiceText = useCallback((text: string) => {
    const t = text.toLowerCase().replace(/[\.,;!?]/g, " ").trim();
    const parsed: Record<string, any> = {};
    // Larghezze
    const lMatch = t.match(/larghezza\s+(\d{3,4})/);
    if (lMatch) parsed.lCentro = parseInt(lMatch[1]);
    const lAlto = t.match(/larghezza\s+alto\s+(\d{3,4})/);
    if (lAlto) parsed.lAlto = parseInt(lAlto[1]);
    const lBasso = t.match(/larghezza\s+basso\s+(\d{3,4})/);
    if (lBasso) parsed.lBasso = parseInt(lBasso[1]);
    // Altezze
    const hMatch = t.match(/altezza\s+(\d{3,4})/);
    if (hMatch) parsed.hCentro = parseInt(hMatch[1]);
    const hSx = t.match(/altezza\s+sinistra\s+(\d{3,4})/);
    if (hSx) parsed.hSx = parseInt(hSx[1]);
    const hDx = t.match(/altezza\s+destra\s+(\d{3,4})/);
    if (hDx) parsed.hDx = parseInt(hDx[1]);
    // Diagonali
    const d1 = t.match(/diagonal[ei]\s*1?\s+(\d{3,4})/);
    if (d1) parsed.d1 = parseInt(d1[1]);
    const d2 = t.match(/diagonal[ei]\s*2\s+(\d{3,4})/);
    if (d2) parsed.d2 = parseInt(d2[1]);
    // Numeri isolati: 4 cifre = probabile misura
    if (Object.keys(parsed).length === 0) {
      const nums = t.match(/\b(\d{3,4})\b/g);
      if (nums && nums.length >= 2) {
        parsed.lCentro = parseInt(nums[0]);
        parsed.hCentro = parseInt(nums[1]);
      } else if (nums && nums.length === 1) {
        parsed.lCentro = parseInt(nums[0]);
      }
    }
    // Tipo
    if (t.includes("finestra")) parsed.tipo = "F1A";
    if (t.includes("portafinestra")) parsed.tipo = "PF1A";
    if (t.includes("due ante") || t.includes("2 ante")) {
      if (t.includes("portafinestra")) parsed.tipo = "PF2A"; else parsed.tipo = "F2A";
    }
    if (t.includes("scorrevole")) parsed.tipo = "PST";
    if (t.includes("vasistas")) parsed.tipo = "VAS";
    if (t.includes("porta blindata")) parsed.tipo = "PBC";
    if (t.includes("porta garage")) parsed.tipo = "PGA";
    if (t.includes("fisso") || t.includes("fissa")) parsed.tipo = "FISSO";
    // Stanza
    if (t.includes("soggiorno")) parsed.stanza = "Soggiorno";
    if (t.includes("cucina")) parsed.stanza = "Cucina";
    if (t.includes("camera")) parsed.stanza = "Camera";
    if (t.includes("cameretta")) parsed.stanza = "Cameretta";
    if (t.includes("bagno")) parsed.stanza = "Bagno";
    if (t.includes("studio")) parsed.stanza = "Studio";
    if (t.includes("ingresso")) parsed.stanza = "Ingresso";
    if (t.includes("corridoio")) parsed.stanza = "Corridoio";
    if (t.includes("ripostiglio")) parsed.stanza = "Ripostiglio";
    if (t.includes("cantina")) parsed.stanza = "Cantina";
    if (t.includes("garage")) parsed.stanza = "Garage";
    if (t.includes("mansarda")) parsed.stanza = "Mansarda";
    if (t.includes("sala")) parsed.stanza = "Sala";
    if (t.includes("lavanderia")) parsed.stanza = "Lavanderia";
    // Piano
    const pianoM = t.match(/piano\s+(terra|primo|secondo|terzo|quarto|quinto|seminterrato|interrato|\d+)/);
    if (pianoM) {
      const pv = pianoM[1];
      if (pv === "terra") parsed.piano = "PT";
      else if (pv === "primo") parsed.piano = "P1";
      else if (pv === "secondo") parsed.piano = "P2";
      else if (pv === "terzo") parsed.piano = "P3";
      else if (pv === "quarto") parsed.piano = "P4";
      else if (pv === "quinto") parsed.piano = "P5";
      else if (pv === "seminterrato" || pv === "interrato") parsed.piano = "S1";
      else parsed.piano = `P${pv}`;
    }
    // Accessori
    if (t.includes("tapparella")) parsed.tapparella = true;
    if (t.includes("motorizzata")) parsed.tapparellaMotorizzata = true;
    if (t.includes("zanzariera")) parsed.zanzariera = true;
    if (t.includes("persiana")) parsed.persiana = true;
    if (t.includes("cassonetto")) parsed.cassonetto = true;
    if (t.includes("davanzale in marmo")) parsed.davanzaleMarmo = true;
    if (t.includes("soglia")) parsed.soglia = true;
    if (t.includes("controtelaio")) parsed.controtelaio = true;
    if (t.includes("coprifilo")) parsed.coprifilo = true;
    // Vetro
    if (t.match(/vetro\s+satinato|satinato/)) parsed.vetro = "Satinato";
    if (t.match(/vetro\s+opaco|opaco/)) parsed.vetro = "Opaco";
    if (t.match(/vetro\s+trasparente|trasparente/)) parsed.vetro = "Trasparente";
    if (t.match(/triplo\s+vetro/)) parsed.vetro = "Triplo";
    if (t.match(/doppio\s+vetro/)) parsed.vetro = "Doppio";
    if (t.match(/vetro\s+temperato|temperato/)) parsed.vetro = "Temperato";
    if (t.match(/vetro\s+stratificato|stratificato/)) parsed.vetro = "Stratificato";
    if (t.match(/vetro\s+bassoemissivo|basso\s+emissivo/)) parsed.vetro = "Basso emissivo";
    if (t.match(/vetro\s+antisfondamento|antisfondamento/)) parsed.vetro = "Antisfondamento";
    if (t.match(/vetrocamera/)) parsed.vetro = "Vetrocamera";
    // Colori
    if (t.includes("bianco")) parsed.coloreInt = "RAL 9010";
    if (t.includes("bicolore")) parsed.bicolore = true;
    if (t.match(/grigio|antracite|7016/)) parsed.coloreEst = "RAL 7016";
    if (t.match(/effetto\s+legno|noce|rovere|ciliegio|douglass/)) parsed.coloreEst = t.match(/noce|rovere|ciliegio|douglass/)?.[0]?.charAt(0).toUpperCase() + t.match(/noce|rovere|ciliegio|douglass/)?.[0]?.slice(1) || "Effetto legno";
    // Spallette
    const spSx = t.match(/spalletta\s+sinistra\s+(\d{2,4})/);
    if (spSx) parsed.spSx = parseInt(spSx[1]);
    const spDx = t.match(/spalletta\s+destra\s+(\d{2,4})/);
    if (spDx) parsed.spDx = parseInt(spDx[1]);
    const spM = t.match(/spallette?\s+(\d{2,4})/);
    if (spM && !spSx && !spDx) { parsed.spSx = parseInt(spM[1]); parsed.spDx = parseInt(spM[1]); }
    // Davanzale
    const dav = t.match(/davanzale\s+(\d{2,4})/);
    if (dav) parsed.davProf = parseInt(dav[1]);
    return parsed;
  }, []);

  const applyParsed = useCallback((parsed: Record<string, any>) => {
    if (!selectedVano || !selectedRilievo) return;
    const mid = selectedVano.id;
    // Misure
    ["lAlto","lCentro","lBasso","hSx","hCentro","hDx","d1","d2","spSx","spDx","davProf"].forEach(k => {
      if (parsed[k]) updateMisura(mid, k, parsed[k]);
    });
    // Vano fields
    if (parsed.tipo) updateVanoField(mid, "tipo", parsed.tipo);
    if (parsed.stanza) updateVanoField(mid, "stanza", parsed.stanza);
    if (parsed.piano) updateVanoField(mid, "piano", parsed.piano);
    if (parsed.coloreInt) updateVanoField(mid, "coloreInt", parsed.coloreInt);
    if (parsed.coloreEst) updateVanoField(mid, "coloreEst", parsed.coloreEst);
    if (parsed.bicolore) updateVanoField(mid, "bicolore", true);
    if (parsed.vetro) updateVanoField(mid, "vetro", parsed.vetro);
    if (parsed.tapparella) toggleAccessorio(mid, "tapparella");
    if (parsed.zanzariera) toggleAccessorio(mid, "zanzariera");
    if (parsed.persiana) toggleAccessorio(mid, "persiana");
  }, [selectedVano, selectedRilievo, updateMisura, updateVanoField, toggleAccessorio]);
  applyParsedRef.current = applyParsed;

  // Save ALL voice text as note on the vano (recognized or not)
  const saveVoiceNote = useCallback((text: string, parsed: Record<string, any>) => {
    if (!selectedVano || !selectedRilievo) return;
    const mid = selectedVano.id;
    const time = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const parsedKeys = Object.keys(parsed);
    const prefix = parsedKeys.length > 0 ? "" : "";
    const newNote = `${prefix} [${time}] ${text}`;
    const existing = selectedVano.note || "";
    const updatedNote = existing ? `${existing}\n${newNote}` : newNote;
    updateVanoField(mid, "note", updatedNote);
  }, [selectedVano, selectedRilievo, updateVanoField]);
  saveVoiceNoteRef.current = saveVoiceNote;

  const vrStart = useCallback(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) { setVrError("Browser non supporta riconoscimento vocale. Usa Chrome."); return; }
    const rec = new SpeechRec();
    rec.lang = "it-IT";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.onstart = () => { setVrActive(true); setVrError(""); };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") setVrError("Microfono non autorizzato. Controlla i permessi del browser.");
      else if (e.error === "no-speech") setVrError("Nessun audio rilevato. Parla più forte.");
      else setVrError(`Errore: ${e.error}`);
    };
    rec.onend = () => {
      setVrActive(false);
      // Auto-restart if still mounted and was active
    };
    rec.onresult = (e: any) => {
      let interim = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalText += transcript;
        } else {
          interim += transcript;
        }
      }
      setVrInterim(interim);
      if (finalText.trim()) {
        const now = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        const parsed = parseVoiceText(finalText.trim());
        setVrTranscripts(prev => [...prev, { text: finalText.trim(), time: now, parsed }]);
        // Auto apply parsed fields
        if (Object.keys(parsed).length > 0) {
          if (applyParsedRef.current) applyParsedRef.current(parsed);
        }
        // ALWAYS save raw text as note on the vano
        if (saveVoiceNoteRef.current) saveVoiceNoteRef.current(finalText.trim(), parsed);
        setVrInterim("");
      }
    };
    recognitionRef.current = rec;
    try { rec.start(); } catch(e) { setVrError("Errore avvio microfono."); }
  }, [parseVoiceText]);

  const vrStop = useCallback(async () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }
    setVrActive(false);
    // Alimenta il dataset AI con le misure inserite
    try {
      const v = selectedVano;
      const m = v?.misure || {};
      if (v && Object.values(m).some(x => (x as number) > 0)) {
        await supabase.from("misure_apprese").insert({
          tipo_vano: v.tipo || "sconosciuto",
          sistema: v.sistema || null,
          misure: m,
          stanza: v.stanza || null,
          piano: v.piano || null,
          azienda_id: aziendaId || null,
          fonte: "dettatura",
          created_at: new Date().toISOString(),
        }).then(() => {}).catch(() => {});
      }
    } catch(e) {}
  }, [selectedVano, aziendaId]);

  // Cleanup on unmount
  useEffect(() => () => { if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {} }, []);

  // ── RENDER BODY ──────────────────────────────────────
  function renderBody() {
    if (!selectedVano || !selectedCM) return null;
    const v = selectedVano;
    const m = v.misure || {};
    const step = STEPS[vanoStep];
    const filled = Object.values(m).filter(x => (x as number) > 0).length;
    const TIPO_TIPS = { Scorrevole: { t: "Scorrevole (alzante/traslante)", dim: "2000 × 2200 mm", w: ["Binario inferiore: serve spazio incasso", "Verifica portata parete"] }, Portafinestra: { t: "Portafinestra standard", dim: "800-900 × 2200 mm", w: ["Soglia a taglio termico", "Verifica altezza architrave"] }, Finestra: { t: "Finestra", dim: "1200 × 1400 mm", w: ["Verifica spazio per anta"] } };
    const tip = TIPO_TIPS[v.tipo] || null;
    const hasWarnings = !m.lAlto && !m.lCentro && !m.lBasso;
    const hasHWarnings = !m.hSx && !m.hCentro && !m.hDx;
    const fSq = m.d1 > 0 && m.d2 > 0 ? Math.abs(m.d1 - m.d2) : null;



    return (
      <div style={{ paddingBottom: showLamieraDisegno ? 0 : 80, backgroundColor: "#F5F4F0" }}>
        {/* fliwoX Topbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#0D1F1F", position: "sticky", top: 0, zIndex: 20 }}>
          <div onClick={() => { setSelectedVano(null); setVanoStep(0); }} style={{ cursor: "pointer", width: 34, height: 34, background: "rgba(255,255,255,0.08)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0 }}>
            <Ico d={ICO.back} s={16} c="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: "white", letterSpacing: "-0.2px" }}>{v.nome}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, marginTop: 1 }}>{TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.label || v.tipo} · {v.stanza} · {v.piano}</div>
          </div>
          {/* BADGE STATO MISURE */}
          {(() => {
            const sm = getStatoMisure(v);
            return (
              <div onClick={() => setShowStatoMisurePanel(true)} style={{ padding: "5px 11px", borderRadius: 20, background: sm.bg, border: `1.5px solid ${sm.color}50`, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, boxShadow: `0 3px 0 0 ${sm.color}40` }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: sm.color, whiteSpace: "nowrap" }}>{sm.label}</span>
              </div>
            );
          })()}
        </div>

        {/* ═══ STORICO: BANNER SOLA LETTURA ═══ */}
        {isStorico && (
          <div style={{ margin: "0 16px 8px", padding: "10px 14px", borderRadius: 10, background: "#8B5CF610", border: "1.5px solid #8B5CF630", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}><I d={ICO.lock} /></span>
            <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "#8B5CF6" }}>
              Rilievo storico — sola lettura
            </div>
          </div>
        )}

        {/* ═══ VOCE AI SOPRALLUOGO — Self-contained ═══ */}
        <div style={{ margin: "8px 16px" }}>
          {/* Main button */}
          <div onClick={vrActive ? vrStop : vrStart}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderRadius: 10,
              background: vrActive ? "#DC4444" : "#0F766E",
              border: "none", cursor: "pointer", justifyContent: "center",
              boxShadow: vrActive ? "0 4px 0 #991B1B" : "0 4px 0 #0D5C56",
              transition: "all 0.1s" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
              <path d="M19 10v2a7 7 0 01-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>
              {vrActive ? "STOP" : "Avvia Dettatura"}
            </span>
            {vrActive && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", animation: "pulse 1s infinite", marginLeft: 4 }} />}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }`}</style>

          {/* Error */}
          {vrError && (
            <div style={{ marginTop: 6, padding: "6px 12px", borderRadius: 8, background: "#ffebee", border: "1px solid #ef9a9a", fontSize: 10, color: "#c62828", textAlign: "center" }}>
              <I d={ICO.alertTriangle} />️ {vrError}
            </div>
          )}

          {/* Hint when active */}
          {vrActive && (
            <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 8, background: "#DC444408", border: "1px dashed #DC444440", fontSize: 9, color: "#666", textAlign: "center", lineHeight: 1.6 }}>
              <I d={ICO.alertTriangle} /> <b>Parla ora</b> — Es: "Finestra due ante, soggiorno, piano terra, larghezza 1400, altezza 1200, tapparella motorizzata, bicolore bianco grigio"
            </div>
          )}

          {/* Interim (live) */}
          {vrActive && vrInterim && (
            <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8, background: "#fff8e1", border: "1px solid #ffe082", fontSize: 12, color: "#f57f17", fontStyle: "italic" }}>
              <I d={ICO.mic} /> {vrInterim}...
            </div>
          )}

          {/* Transcripts history */}
          {vrTranscripts.length > 0 && (
            <div style={{ marginTop: 8, borderRadius: 10, border: `1px solid ${T.bdr}`, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
              <div style={{ padding: "4px 10px", background: T.acc + "10", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: T.acc, textTransform: "uppercase" }}><I d={ICO.fileText} /> Trascrizioni ({vrTranscripts.length})</span>
                <span onClick={() => setVrTranscripts([])} style={{ fontSize: 9, color: T.red, cursor: "pointer", fontWeight: 700 }}><I d={ICO.trash} /> Pulisci</span>
              </div>
              {vrTranscripts.map((tr, i) => (
                <div key={i} style={{ padding: "6px 10px", borderTop: `1px solid ${T.bdr}`, fontSize: 11 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ color: T.text, fontWeight: 600 }}>"{tr.text}"</span>
                    <span style={{ fontSize: 8, color: T.sub, flexShrink: 0, marginLeft: 6 }}>{tr.time}</span>
                  </div>
                  {tr.parsed && Object.keys(tr.parsed).length > 0 && (
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap", marginTop: 2 }}>
                      {Object.entries(tr.parsed).map(([k, val]) => (
                        <span key={k} style={{ padding: "1px 5px", borderRadius: 4, background: T.grn + "18", fontSize: 8, fontWeight: 700, color: T.grn }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polyline points="20 6 9 17 4 12"/></svg> {k}: {String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                  {tr.parsed && Object.keys(tr.parsed).length === 0 && (
                    <div style={{ fontSize: 8, color: T.orange, fontWeight: 600, marginTop: 1 }}><I d={ICO.alertTriangle} /> Nessun campo riconosciuto — salvata come nota</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* == INFO VANO — fisarmoniche (solo step 0) == */}
        {vanoStep === 0 && (() => {
          const updateV = (field, val) => {
            const updRil = selectedRilievo ? { ...selectedRilievo, vani: selectedRilievo.vani.map(vn => vn.id === v.id ? { ...vn, [field]: val } : vn) } : null;
            setCantieri(cs => cs.map(c => c.id === selectedCM?.id
              ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? (updRil || r2) : r2) } : c));
            if (updRil) setSelectedRilievo(updRil);
            setSelectedCM(prev => prev ? ({ ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo?.id ? (updRil || r) : r) }) : prev);
            setSelectedVano(prev => ({ ...prev, [field]: val }));
          };
          const cats = [...new Set(tipologieFiltrate.map(t => t.cat))];
          const pianiList = ["S2","S1","PT","P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12","P13","P14","P15","P16","P17","P18","P19","P20","M"];
          const coloriRAL = ["RAL 9010","RAL 9016","RAL 9001","RAL 7016","RAL 7021","RAL 8014","RAL 8016","RAL 1013","Altro"];

          const sections = [
            { id:"accesso", icon: "", label:"Accesso / Difficoltà",
              iconSVG: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z\"/><polyline points=\"9 22 9 12 15 12 15 22\"/></svg>",
              badge: v.difficoltaSalita||null, filled: [v.difficoltaSalita, v.mezzoSalita].filter(Boolean).length, total: 2,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:4}}>
                  {[{id:"facile",l:"Facile",c:T.grn,e:""},{id:"media",l:"Media",c:T.orange,e:""},{id:"difficile",l:"Difficile",c:T.red,e:""}].map(d=>(
                    <div key={d.id} onClick={()=>{updateV("difficoltaSalita",d.id);}}
                      style={{flex:1,padding:"7px 4px",borderRadius:8,border:`1.5px solid ${v.difficoltaSalita===d.id?d.c:T.bdr}`,background:v.difficoltaSalita===d.id?d.c+"15":T.card,textAlign:"center",cursor:"pointer"}}>
                      <div style={{fontSize:13}}>{d.e}</div>
                      <div style={{fontSize:10,fontWeight:700,color:v.difficoltaSalita===d.id?d.c:T.sub}}>{d.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>MEZZO DI SALITA</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {mezziSalita.map(ms=>(
                    <div key={ms} onClick={()=>{updateV("mezzoSalita",ms);setTimeout(()=>flashAndAdvance("accesso"),150);}}
                      style={{padding:"7px 11px",borderRadius:8,border:"2px solid "+(v.mezzoSalita===ms?T.acc:T.bdr),background:v.mezzoSalita===ms?T.accLt:T.card,fontSize:11,fontWeight:v.mezzoSalita===ms?700:500,color:v.mezzoSalita===ms?T.acc:T.text,cursor:"pointer",transition:"all 0.15s"}}>
                      {ms}
                    </div>
                  ))}
                </div>
              </div>
            },
            { id:"tipologia", icon:"□", label:"Tipologia",
              iconSVG: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\"/></svg>",
              badge: v.tipo||null, filled: v.tipo ? 1 : 0, total: 1,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:2,borderBottom:`1px solid ${T.bdr}`,paddingBottom:0,marginBottom:4}}>
                  {cats.map(cat=>(
                    <div key={cat} onClick={()=>setTipCat(cat)}
                      style={{padding:"5px 8px",fontSize:10,fontWeight:700,cursor:"pointer",color:tipCat===cat?T.acc:T.sub,borderBottom:`2px solid ${tipCat===cat?T.acc:"transparent"}`,marginBottom:-1,whiteSpace:"nowrap"}}>
                      {cat}
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <select
                    value={v.tipo || ""}
                    onChange={e => { updateV("tipo", e.target.value); flashAndAdvance("tipologia"); }}
                    style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1.5px solid ${v.tipo?T.acc:T.bdr}`,
                      fontSize:15, fontWeight:600, background:v.tipo?T.accLt:T.card, color:v.tipo?T.acc:T.sub,
                      fontFamily:"Inter", boxSizing:"border-box", cursor:"pointer" }}>
                    <option value="">— Seleziona tipologia —</option>
                    {cats.map(cat => (
                      <optgroup key={cat} label={cat}>
                        {tipologieFiltrate.filter(t=>t.cat===cat).map(t=>(
                          <option key={t.code} value={t.code}>{t.code}{t.label ? ` — ${t.label}` : ""}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {v.tipo && (
                    <div style={{fontSize:11,color:T.acc,fontWeight:600,padding:"4px 8px",background:T.accLt,borderRadius:8,display:"inline-block"}}>
                      {TIPOLOGIE_RAPIDE.find(t=>t.code===v.tipo)?.label || v.tipo}
                    </div>
                  )}
                </div>
              </div>
            },
            { id:"posizione", icon: "", label:"Stanza / Piano",
              iconSVG: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/></svg>",
              badge: v.stanza?`${v.stanza}`:null, filled: [v.stanza].filter(Boolean).length, total: 1,
              body: <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>STANZA</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {["Soggiorno","Cucina","Camera","Cameretta","Bagno","Studio","Ingresso","Corridoio","Altro"].map(x=>(
                      <div key={x} onClick={()=>{const others=(selectedRilievo?.vani||[]).filter(vn=>vn.id!==v.id);const cnt=others.filter(vn=>vn.stanza===x||vn.stanza?.startsWith(x+" ")).length;updateV("stanza",cnt>0?x+" "+(cnt+1):x);setTimeout(()=>flashAndAdvance("posizione"),150);}}
                        style={{padding:"7px 12px",borderRadius:8,border:"2px solid "+(v.stanza===x?T.acc:T.bdr),background:v.stanza===x?T.accLt:T.card,fontSize:12,fontWeight:v.stanza===x?700:500,color:v.stanza===x?T.acc:T.text,cursor:"pointer",transition:"all 0.15s"}}>
                        {x}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>PEZZI</div>
                  <div style={{display:"flex",alignItems:"center",gap:4,maxWidth:120}}>
                    <div onClick={()=>updateV("pezzi",Math.max(1,(v.pezzi||1)-1))} style={{width:32,height:32,borderRadius:8,background:T.bg,border:"1px solid "+T.bdr,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,fontWeight:700,color:T.sub}}>−</div>
                    <div style={{flex:1,textAlign:"center",fontSize:18,fontWeight:800,color:T.acc}}>{v.pezzi||1}</div>
                    <div onClick={()=>updateV("pezzi",(v.pezzi||1)+1)} style={{width:32,height:32,borderRadius:8,background:T.bg,border:"1px solid "+T.bdr,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,fontWeight:700,color:T.sub}}>+</div>
                  </div>
                </div>
              </div>
            },
            { id:"sistema", icon: "", label:"Sistema / Vetro",
              iconSVG: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><rect x=\"2\" y=\"3\" width=\"20\" height=\"14\" rx=\"2\"/><line x1=\"8\" y1=\"21\" x2=\"16\" y2=\"21\"/><line x1=\"12\" y1=\"17\" x2=\"12\" y2=\"21\"/></svg>",
              badge: v.sistema?v.sistema.split(" ").slice(0,2).join(" · "):null, filled: [v.sistema, v.vetro].filter(Boolean).length, total: 2,
              body: <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>SISTEMA PROFILI</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {sistemiDB.map(s=>{
                      const full=s.marca+" "+s.sistema;
                      const sel=v.sistema===full;
                      return <div key={s.id} onClick={()=>{updateV("sistema",full);}}
                        style={{padding:"10px 12px",borderRadius:10,border:"2px solid "+(sel?T.acc:T.bdr),background:sel?T.accLt:T.card,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.15s"}}>
                        <span style={{fontSize:12,fontWeight:sel?700:500,color:sel?T.acc:T.text}}>{s.marca} <span style={{fontWeight:400}}>{s.sistema}</span></span>
                        {s.uf&&<span style={{padding:"2px 7px",borderRadius:5,background:parseFloat(s.uf)<=1.0?T.grn+"18":T.orange+"18",fontSize:10,fontWeight:700,color:parseFloat(s.uf)<=1.0?T.grn:T.orange,fontFamily:FF}}>Uf {s.uf}</span>}
                      </div>;
                    })}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>VETRO CAMERA</div>
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {vetriDB.map(g=>{
                      const sel=v.vetro===g.code;
                      return <div key={g.id} onClick={()=>{updateV("vetro",g.code);setTimeout(()=>flashAndAdvance("sistema"),150);}}
                        style={{padding:"10px 12px",borderRadius:10,border:"2px solid "+(sel?T.blu:T.bdr),background:sel?T.blu+"10":T.card,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.15s"}}>
                        <span style={{fontSize:12,fontWeight:sel?700:500,color:sel?T.blu:T.text}}>{g.code}</span>
                        {g.ug&&<span style={{padding:"2px 7px",borderRadius:5,background:parseFloat(g.ug)<=1.0?T.grn+"18":parseFloat(g.ug)<=1.5?T.orange+"18":T.red+"15",fontSize:10,fontWeight:700,color:parseFloat(g.ug)<=1.0?T.grn:parseFloat(g.ug)<=1.5?T.orange:T.red,fontFamily:FF}}>Ug {g.ug}</span>}
                      </div>;
                    })}
                  </div>
                </div>
              </div>},
            { id:"colori", icon: "", label:"Colori profili",
              iconSVG: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M12 2a10 10 0 010 20\"/></svg>",
              badge: v.coloreInt||null, filled: [v.coloreInt, v.bicolore && v.coloreEst, v.coloreAcc].filter(Boolean).length, total: v.bicolore ? 3 : 2,
              body: <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {!v.sistema && <div style={{padding:"14px",textAlign:"center",color:T.sub,fontSize:12,background:T.bg,borderRadius:10,border:"1px dashed "+T.bdr}}><I d={ICO.alertTriangle} />️ Scegli prima il sistema profili</div>}
                {v.sistema && <>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub}}>COLORE {v.bicolore?"INTERNO":"PROFILI"}</div>
                  <div onClick={()=>updateV("bicolore",!v.bicolore)}
                    style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:v.bicolore?T.accLt:"transparent",border:"1px solid "+(v.bicolore?T.acc:T.bdr),color:v.bicolore?T.acc:T.sub,cursor:"pointer",fontWeight:600}}>
                    Bicolore {v.bicolore?"":""}
                  </div>
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {coloriDB.map(c=>{
                    const sel=v.coloreInt===c.code;
                    return <div key={c.id} onClick={()=>{updateV("coloreInt",c.code); if(!v.bicolore) flashAndAdvance("colori");}}
                      style={{padding:"7px 10px",borderRadius:8,border:"2px solid "+(sel?T.acc:T.bdr),background:sel?T.accLt:T.card,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all 0.15s"}}>
                      <div style={{width:18,height:18,borderRadius:"50%",background:c.hex||"#ccc",border:"1.5px solid "+(c.hex==="#FFFFFF"||c.hex==="#F5F5F0"?T.bdr:c.hex||T.bdr),flexShrink:0}} />
                      <span style={{fontSize:11,fontWeight:sel?700:500,color:sel?T.acc:T.text}}>{c.code}</span>
                    </div>;
                  })}
                </div>
                {v.bicolore && <>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginTop:4}}>COLORE ESTERNO</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                    {coloriDB.map(c=>{
                      const sel=v.coloreEst===c.code;
                      return <div key={c.id} onClick={()=>{updateV("coloreEst",c.code); flashAndAdvance("colori");}}
                        style={{padding:"7px 10px",borderRadius:8,border:"2px solid "+(sel?T.acc:T.bdr),background:sel?T.accLt:T.card,cursor:"pointer",display:"flex",alignItems:"center",gap:6,transition:"all 0.15s"}}>
                        <div style={{width:18,height:18,borderRadius:"50%",background:c.hex||"#ccc",border:"1.5px solid "+(c.hex==="#FFFFFF"||c.hex==="#F5F5F0"?T.bdr:c.hex||T.bdr),flexShrink:0}} />
                        <span style={{fontSize:11,fontWeight:sel?700:500,color:sel?T.acc:T.text}}>{c.code}</span>
                      </div>;
                    })}
                  </div>
                </>}
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3}}>ACCESSORI</div>
                  <select style={S.select} value={v.coloreAcc||""} onChange={e=>updateV("coloreAcc",e.target.value)}>
                    <option value="">— Come profili —</option>
                    {coloriDB.map(c=><option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                  </select>
                </div>
                </>}
              </div>
            },
            { id:"telaio", icon: "", label:"Telaio / Rifilato",
              iconSVG: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><rect x=\"7\" y=\"7\" width=\"10\" height=\"10\"/></svg>",
              badge: v.telaio?(v.telaio==="Z"?"Telaio Z":"Telaio L"):(v.rifilato?"Rifilato":null), filled: [v.telaio, v.rifilato, v.telaioAlaZ].filter(Boolean).length, total: 2,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:6}}>
                  {[{id:"Z",l:"Telaio a Z"},{id:"L",l:"Telaio a L"}].map(t=>(
                    <div key={t.id} onClick={()=>{ updateV("telaio",v.telaio===t.id?"":t.id); if(v.telaio!==t.id) setTimeout(()=>flashAndAdvance("telaio"),200); }}
                      style={{flex:1,padding:"9px",borderRadius:8,border:`1.5px solid ${v.telaio===t.id?T.acc:T.bdr}`,background:v.telaio===t.id?T.accLt:T.card,textAlign:"center",fontSize:12,fontWeight:700,color:v.telaio===t.id?T.acc:T.sub,cursor:"pointer"}}>
                      {t.l}
                    </div>
                  ))}
                </div>
                {v.telaio==="Z" && <div>
                  <div style={{fontSize:10,color:T.sub,fontWeight:600,marginBottom:2}}>Lunghezza ala (mm)</div>
                  <input style={S.input} type="number" inputMode="numeric" placeholder="es. 35" value={v.telaioAlaZ||""} onChange={e=>updateV("telaioAlaZ",e.target.value)}/>
                </div>}
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div onClick={()=>updateV("rifilato",!v.rifilato)}
                    style={{width:40,height:22,borderRadius:11,background:v.rifilato?T.acc:T.bdr,cursor:"pointer",position:"relative",flexShrink:0}}>
                    <div style={{position:"absolute",top:2,left:v.rifilato?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left 0.15s"}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:600,color:T.text}}>Rifilato</span>
                </div>
                {v.rifilato && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {[["rifilSx","↙ Sx"],["rifilDx","↘ Dx"],["rifilSopra","↑ Sopra"],["rifilSotto","↓ Sotto"]].map(([f,l])=>(
                    <div key={f}><div style={{fontSize:9,color:T.sub,fontWeight:600,marginBottom:2}}>{l} (mm)</div>
                    <input style={S.input} type="number" inputMode="numeric" placeholder="0" value={v[f]||""} onChange={e=>updateV(f,e.target.value)}/></div>
                  ))}
                </div>}
              </div>
            },
            { id:"coprifilo", icon:"", label:"Coprifilo",
              iconSVG: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><rect x=\"7\" y=\"7\" width=\"10\" height=\"10\"/></svg>",
              badge: v.coprifilo||null, filled: v.coprifilo?1:0, total:1,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  <div onClick={()=>updateV("coprifilo","")}
                    style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid "+(!v.coprifilo?T.acc:T.bdr),
                      background:!v.coprifilo?T.accLt:T.card,fontSize:12,fontWeight:600,
                      color:!v.coprifilo?T.acc:T.sub,cursor:"pointer",
                      boxShadow:!v.coprifilo?"0 2px 0 "+T.acc+"40":"0 1px 0 rgba(0,0,0,0.08)"}}>
                    Nessuno
                  </div>
                  {coprifiliDB.map(c=>{
                    const sel=v.coprifilo===c.cod;
                    return <div key={c.id}
                      onClick={()=>{updateV("coprifilo",c.cod); setTimeout(()=>flashAndAdvance("coprifilo"),200);}}
                      style={{padding:"7px 12px",borderRadius:8,border:"1.5px solid "+(sel?T.acc:T.bdr),
                        background:sel?T.accLt:T.card,fontSize:12,fontWeight:600,
                        color:sel?T.acc:T.text,cursor:"pointer",
                        boxShadow:sel?"0 2px 0 "+T.acc+"40":"0 1px 0 rgba(0,0,0,0.08)"}}>
                      {c.cod}
                    </div>;
                  })}
                </div>
              </div>
            },
            { id:"lamiera", icon:"", label:"Lamiera",
              iconSVG: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z\"/></svg>",
              badge: (v.lamiere as any)?.length > 0 ? String((v.lamiere as any).length) : (v.lamiera||null),
              filled: ((v.lamiere as any)?.length||0) + (v.lamiera?1:0), total:1,
              body: (() => {
                const lamList: any[] = (v.lamiere as any) || [];
                const addLamiera = () => {
                  // Crea lamiera nell'array con dati vuoti, poi modal aggiorna quei dati
                  const newL = {id: Date.now().toString(), nome: "Lamiera "+(lamList.length+1), pieghe:[], latoBuono:"esterno", latoInfisso:"", lunghezza:""};
                  const updated = [...lamList, newL];
                  updateV("lamiere", updated);
                  setLamieraPieghe([]);
                  setLamieraLatoBuono("esterno");
                  setLamieraLatoInfisso("");
                  setLamieraLunghezza("");
                  // Imposta editIdx = indice della nuova lamiera → salvataggio usa branch if
                  setLamieraEditIdx(updated.length - 1);
                  lamieraZoom.current=1; lamieraPan.current={x:0,y:0};
                  setShowLamieraDisegno(true);
                };
                return (
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {lamList.map((lam: any, li: number) => {
                      const svilTot = (lam.pieghe||[]).reduce((a:number,s:any)=>a+s.mm,0);
                      let preNodes:{x:number,y:number}[] = [];
                      // ViewBox fisso 300x200 — etichette sempre proporzionate alla card
                      const PVFW=300, PVFH=200;
                      let svgVW=PVFW, svgVH=PVFH;
                      if((lam.pieghe||[]).length > 0){
                        let rx=0, ry=0;
                        const raw:number[][] = [[0,0]];
                        (lam.pieghe||[]).forEach((s:any)=>{
                          const ang = s.angolo != null ? s.angolo : 90;
                          let baseAngle = 0;
                          if(s.dir==='su')  baseAngle = Math.PI/2;
                          if(s.dir==='sx')  baseAngle = Math.PI;
                          if(s.dir==='giu') baseAngle = 3*Math.PI/2;
                          const devRad = (ang - 90) * Math.PI / 180;
                          const finalAngle = baseAngle - devRad;
                          rx += s.mm * Math.cos(finalAngle);
                          ry -= s.mm * Math.sin(finalAngle);
                          raw.push([rx,ry]);
                        });
                        const xs=raw.map(n=>n[0]), ys=raw.map(n=>n[1]);
                        const minX=Math.min(...xs), maxX=Math.max(...xs);
                        const minY=Math.min(...ys), maxY=Math.max(...ys);
                        const rX=Math.max(maxX-minX,1), rY=Math.max(maxY-minY,1);
                        const PAD=28;
                        const sc=Math.min((PVFW-PAD*2)/rX,(PVFH-PAD*2)/rY);
                        const ox=PAD + ((PVFW-PAD*2) - rX*sc)/2 - minX*sc;
                        const oy=PAD + ((PVFH-PAD*2) - rY*sc)/2 - minY*sc;
                        preNodes=raw.map(([x,y])=>({
                          x:+((ox+x*sc).toFixed(1)),
                          y:+((oy+y*sc).toFixed(1))
                        }));
                      }
                      const prePts = preNodes.map(n=>`${n.x},${n.y}`).join(' ');
                      return (
                        <div key={lam.id} style={{borderRadius:10,background:"#0F766E0A",border:"1px solid #0F766E25",overflow:"hidden"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderBottom:"1px solid #0F766E15"}}>
                            <input value={lam.nome} onChange={e=>{
                              const upd=[...lamList]; upd[li]={...upd[li],nome:e.target.value}; updateV("lamiere",upd);
                            }} style={{flex:1,fontSize:12,fontWeight:700,border:"none",background:"transparent",color:"#0F766E",outline:"none"}}/>
                            <div style={{fontSize:10,color:"#0F766E80",fontWeight:600}}>{svilTot>0?svilTot+"mm":""}</div>
                            <div onClick={e=>{e.stopPropagation();
                              setLamieraPieghe(lam.pieghe||[]);
                              setLamieraLatoBuono(lam.latoBuono||"esterno");
                              setLamieraLatoInfisso(lam.latoInfisso||"");
                              setLamieraLunghezza(lam.lunghezza||"");
                              setLamieraEditIdx(li);
                              lamieraZoom.current=1; lamieraPan.current={x:0,y:0};
                              setShowLamieraDisegno(true);
                            }} style={{padding:"5px 10px",borderRadius:6,background:"#0F766E",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                              ✏️ Modifica
                            </div>
                            <div onClick={e=>{e.stopPropagation();
                              updateV("lamiere",lamList.filter((_:any,i:number)=>i!==li));
                            }} style={{padding:"5px 8px",borderRadius:6,background:"#DC444415",color:"#DC4444",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                              ✕
                            </div>
                          </div>
                          {preNodes.length > 1 ? (
                            <svg viewBox={`0 0 ${svgVW} ${svgVH}`} width="100%"
                              style={{display:"block",background:"#F0FDF9",cursor:"pointer",borderRadius:"0 0 8px 8px"}}
                              onClick={e=>{e.stopPropagation();
                                setLamieraPieghe(lam.pieghe||[]);
                                setLamieraLatoBuono(lam.latoBuono||"esterno");
                                setLamieraLatoInfisso(lam.latoInfisso||"");
                                setLamieraLunghezza(lam.lunghezza||"");
                                setLamieraEditIdx(li);
                                lamieraZoom.current=1; lamieraPan.current={x:0,y:0};
                                setShowLamieraDisegno(true);
                              }}>
                              {/* Griglia */}
                              {Array.from({length:13}).map((_,gi)=>(
                                <line key={"gx"+gi} x1={gi*25} y1="0" x2={gi*25} y2={PVFH} stroke="#E0F5EE" strokeWidth="0.4"/>
                              ))}
                              {Array.from({length:9}).map((_,gi)=>(
                                <line key={"gy"+gi} x1="0" y1={gi*25} x2={PVFW} y2={gi*25} stroke="#E0F5EE" strokeWidth="0.4"/>
                              ))}
                              {/* Profilo */}
                              <polyline points={prePts} fill="none" stroke="#0F766E" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"/>
                              {/* Quote segmenti — fontSize proporzionale */}
                              {(() => {
                                const fz = 7.5; // viewBox fisso 300x200
                                const lhalf = fz * 0.65;
                                return (lam.pieghe||[]).map((s:any, si:number) => {
                                  if(si >= preNodes.length-1) return null;
                                  const n1=preNodes[si] as {x:number,y:number};
                                  const n2=preNodes[si+1] as {x:number,y:number};
                                  const mx=(n1.x+n2.x)/2, my=(n1.y+n2.y)/2;
                                  const isH=Math.abs(n2.x-n1.x)>=Math.abs(n2.y-n1.y);
                                  const side = si % 2 === 0 ? -1 : 1;
                                  const offset = fz * 1.6;
                                  const lx = isH ? mx : mx + side*offset;
                                  const ly = isH ? my + side*offset : my;
                                  // Solo deviazioni reali, non @+0° o @+90°
                                  const dev = (s.angolo!=null && s.angolo!==90) ? Math.abs(s.angolo-90) : 0;
                                  const lbl = dev > 0
                                    ? `${s.mm} ${s.angolo<90?'+':'−'}${dev}°`
                                    : String(s.mm);
                                  const tw = lbl.length * fz * 0.62 + 5;
                                  const th = fz + 4;
                                  // Clamp dentro viewBox
                                  const clx = Math.max(tw/2+1, Math.min(svgVW-tw/2-1, lx));
                                  const cly = Math.max(th/2+1, Math.min(svgVH-th/2-1, ly));
                                  return (
                                    <g key={"q"+si}>
                                      <rect x={clx-tw/2} y={cly-th/2} width={tw} height={th} rx="2"
                                        fill="rgba(3,22,49,0.85)"/>
                                      <text x={clx} y={cly+lhalf} textAnchor="middle"
                                        fontSize={fz} fill="#fff" fontWeight="700">{lbl}</text>
                                    </g>
                                  );
                                });
                              })()}
                              {/* Nodi */}
                              {(() => {
                                const nr = 4; // viewBox fisso 300x200
                                return preNodes.map((n:{x:number,y:number},i:number)=>(
                                  <circle key={i} cx={n.x} cy={n.y}
                                    r={i===0||i===preNodes.length-1?nr:nr*0.55}
                                    fill={i===0?"#031631":i===preNodes.length-1?"#dc4444":"#fff"}
                                    stroke="#0F766E" strokeWidth={nr*0.45}/>
                                ));
                              })()}
                              {/* Badge EST/INT — dimensioni proporzionali */}
                              {(() => {
                                const bfz = 7; // viewBox fisso 300x200
                                const bw = bfz*4.5, bh = bfz*1.8;
                                const isEst = lam.latoBuono==='esterno';
                                return (<>
                                  <rect x="3" y="3" width={bw} height={bh} rx="2"
                                    fill={isEst?"#3B7FE0":"#D08008"}/>
                                  <text x={3+bw/2} y={3+bh*0.72} textAnchor="middle"
                                    fontSize={bfz} fill="#fff" fontWeight="700">
                                    {isEst?'EST':'INT'}
                                  </text>
                                  {lam.latoInfisso && <>
                                    <rect x={3+bw+3} y="3" width={bfz*6} height={bh} rx="2" fill="#0F766E"/>
                                    <text x={3+bw+3+bfz*3} y={3+bh*0.72} textAnchor="middle"
                                      fontSize={bfz} fill="#fff" fontWeight="700">
                                      {lam.latoInfisso==='alto'?'^ ALTO':lam.latoInfisso==='basso'?'v BASSO':lam.latoInfisso==='sx'?'< SX':'> DX'}
                                    </text>
                                  </>}
                                  {svilTot>0 && <>
                                    <rect x={svgVW-bfz*7.5-2} y={svgVH-bh-3} width={bfz*7.5} height={bh} rx="2"
                                      fill="rgba(15,118,110,0.12)"/>
                                    <text x={svgVW-bfz*3.75-2} y={svgVH-3-bh*0.28} textAnchor="middle"
                                      fontSize={bfz} fill="#0F766E" fontWeight="800">
                                      {svilTot}mm
                                    </text>
                                  </>}
                                </>);
                              })()}
                            </svg>
                          ) : (
                            <div onClick={e=>{e.stopPropagation();
                              setLamieraPieghe(lam.pieghe||[]);
                              setLamieraLatoBuono(lam.latoBuono||"esterno");
                              setLamieraLatoInfisso(lam.latoInfisso||"");
                              setLamieraLunghezza(lam.lunghezza||"");
                              setLamieraEditIdx(li);
                              lamieraZoom.current=1; lamieraPan.current={x:0,y:0};
                              setShowLamieraDisegno(true);
                            }} style={{padding:"14px",textAlign:"center",fontSize:11,color:"#0F766E",
                              fontWeight:600,cursor:"pointer",background:"#F0FDF9",borderRadius:"0 0 8px 8px"}}>
                              ✏️ Tocca per disegnare le pieghe
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div onClick={addLamiera} style={{padding:"10px",borderRadius:10,border:"1.5px dashed #0F766E50",
                      background:"#F0FDF9",textAlign:"center",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:"#0F766E",color:"#fff",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900}}>+</div>
                      <div style={{fontSize:12,fontWeight:700,color:"#0F766E"}}>Aggiungi lamiera</div>
                    </div>
                  </div>
                );
              })(),
            },
                        { id:"controtelaio", icon:"◻", label:"Controtelaio",
              iconSVG: "<svg width=\"14\" height=\"14\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"/><line x1=\"3\" y1=\"9\" x2=\"21\" y2=\"9\"/><line x1=\"9\" y1=\"21\" x2=\"9\" y2=\"9\"/></svg>",
              badge: v.controtelaio?.tipo ? (v.controtelaio.tipo==="singolo"?"Singolo":v.controtelaio.tipo==="doppio"?"Doppio":"Con cassonetto") : null, filled: v.controtelaio?.tipo ? 1 : 0, total: 1,
              body: (() => {
                // ── SISTEMI CONTROTELAIO ─────────────────────────────
                const CT_SISTEMI = [
                  // SINGOLI
                  { id:"PROS", label:"PROS", gruppo:"Singolo", varLabels:["A — Sede infisso"], hasB:false, hasCass:false,
                    desc:"Controtelaio singolo - ribattuta variabile" },
                  { id:"PROI", label:"PROI", gruppo:"Singolo", varLabels:["A — Sede infisso"], hasB:false, hasCass:false,
                    desc:"Controtelaio singolo - ribattuta std 50mm" },
                  // FILO MURO
                  { id:"STH5", label:"STH5", gruppo:"EPS filo muro", varLabels:["A — Sede infisso","B — Sede persiana"], hasB:true, hasCass:true,
                    desc:"EPS - spalla 60mm" },
                  { id:"STH5I", label:"STH5I", gruppo:"EPS filo muro", varLabels:["A — Sede infisso","B — Sede persiana"], hasB:true, hasCass:true,
                    desc:"EPS - spalla 64mm" },
                  { id:"STH6", label:"STH6", gruppo:"EPS filo muro", varLabels:["A — Sede infisso","B — Sede persiana"], hasB:true, hasCass:true,
                    desc:"EPS 325mm intonaco finito" },
                  { id:"STH6I", label:"STH6I", gruppo:"EPS filo muro", varLabels:["A — Sede infisso","B — Sede persiana"], hasB:true, hasCass:true,
                    desc:"EPS 325mm - sede avanzata" },
                  { id:"STF5", label:"STF5", gruppo:"Fibrocemento filo muro", varLabels:["A — Sede infisso","B — Sede persiana"], hasB:true, hasCass:true,
                    desc:"Fibrocemento sp.44/64/84mm" },
                  { id:"STF6", label:"STF6", gruppo:"Fibrocemento filo muro", varLabels:["A — Sede infisso","B — Sede persiana"], hasB:true, hasCass:true,
                    desc:"Fibrocemento 325mm" },
                  // CENTRO MURO
                  { id:"STH3", label:"STH3", gruppo:"EPS centro muro", varLabels:["A — Sede infisso"], hasB:false, hasCass:true,
                    desc:"EPS centro muro 325mm" },
                  { id:"STF3", label:"STF3", gruppo:"Fibrocemento centro muro", varLabels:["A — Sede infisso"], hasB:false, hasCass:true,
                    desc:"Fibrocemento sp.64/84mm" },
                  { id:"PROGCP", label:"PROGCP", gruppo:"STH PRO", varLabels:["A — Sede infisso","B — Sede persiana"], hasB:true, hasCass:true,
                    desc:"PVC - variabile+38.5mm" },
                  { id:"PROGC", label:"PROGC", gruppo:"STH PRO", varLabels:["A — Sede infisso","B — Sede persiana"], hasB:true, hasCass:true,
                    desc:"Alluminio - variabile+32.4mm" },
                  { id:"CUSTOM", label:"+ Personalizzato", gruppo:"Altro", varLabels:["A","B","C"], hasB:true, hasCass:false,
                    desc:"Sistema non in lista" },
                ];

                const ct = v.controtelaio || {};
                const sistema = CT_SISTEMI.find(s => s.id === ct.sistema) || null;
                const gruppi = [...new Set(CT_SISTEMI.map(s => s.gruppo))];

                // ── CONFIGURATORE CONTROTELAIO ──────────────────────────────────
                const renderSagoma = (sis) => (
                  <ConfiguratoreControtelaio
                    value={v.controtelaio?.disegno}
                    sistemaId={sis?.id || null}
                    onChange={(d) => updateV("controtelaio", { ...(v.controtelaio || {}), disegno: d })}
                    T={T}
                  />
                );
                return (
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>

                    {/* ── SELEZIONE SISTEMA ── */}
                    <div>
                      <div style={{fontSize:10,fontWeight:800,color:T.sub,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>Sistema controtelaio</div>
                      {gruppi.map(gruppo => (
                        <div key={gruppo} style={{marginBottom:8}}>
                          <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:4,paddingLeft:2}}>{gruppo}</div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            {CT_SISTEMI.filter(s=>s.gruppo===gruppo).map(sis=>(
                              <div key={sis.id}
                                onClick={()=>updateV("controtelaio",{...(ct||{}),sistema:sis.id,varA:0,varB:0,varC:0})}
                                style={{padding:"7px 12px",borderRadius:8,cursor:"pointer",
                                  border:`2px solid ${ct.sistema===sis.id?"#1A9E73":T.bdr}`,
                                  background:ct.sistema===sis.id?"#1A9E7315":T.card,
                                  transition:"all 0.1s"}}>
                                <div style={{fontSize:12,fontWeight:800,color:ct.sistema===sis.id?"#1A9E73":T.text}}>{sis.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── SAGOMA + VARIABILI ── */}
                    {sistema && (
                      <div>
                        {/* Nome sistema + desc */}
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <div style={{padding:"4px 12px",borderRadius:20,background:"#1A9E73",color:"white",fontSize:12,fontWeight:800}}>{sistema.id}</div>
                          <div style={{fontSize:11,color:T.sub}}>{sistema.desc}</div>
                        </div>

                        {/* Sagoma SVG */}
                        <div style={{background:"#F8FBFF",borderRadius:10,border:"1.5px solid #3B7FE020",padding:"10px 8px",marginBottom:12}}>
                          {renderSagoma(sistema)}
                        </div>

                        {/* Input variabili — una riga per variabile */}
                        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
                          {/* A — sempre presente */}
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <div style={{width:28,height:28,borderRadius:6,background:"#DC4444",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <span style={{fontSize:13,fontWeight:800,color:"white"}}>A</span>
                            </div>
                            <div style={{flex:1}}>
                              <div style={{fontSize:9,fontWeight:700,color:"#DC4444",marginBottom:3}}>SEDE INFISSO (mm) — variabile</div>
                              <input type="number" inputMode="numeric" placeholder="inserisci mm"
                                value={ct.varA||""}
                                onChange={e=>updateV("controtelaio",{...ct,varA:parseInt(e.target.value)||0})}
                                style={{...S.input,borderColor:"#DC444460",fontSize:18,padding:"9px 14px"}}/>
                            </div>
                          </div>

                          {/* B — solo se sistema ha sede persiana */}
                          {sistema.hasB && (
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:28,height:28,borderRadius:6,background:"#D08008",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                <span style={{fontSize:13,fontWeight:800,color:"white"}}>B</span>
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:9,fontWeight:700,color:"#D08008",marginBottom:3}}>SEDE PERSIANA (mm) — variabile</div>
                                <input type="number" inputMode="numeric" placeholder="inserisci mm"
                                  value={ct.varB||""}
                                  onChange={e=>updateV("controtelaio",{...ct,varB:parseInt(e.target.value)||0})}
                                  style={{...S.input,borderColor:"#D0800860",fontSize:18,padding:"9px 14px"}}/>
                              </div>
                            </div>
                          )}

                          {/* C — profondità cassonetto */}
                          {sistema.hasCass && (
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <div style={{width:28,height:28,borderRadius:6,background:"#3B7FE0",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                <span style={{fontSize:13,fontWeight:800,color:"white"}}>C</span>
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontSize:9,fontWeight:700,color:"#3B7FE0",marginBottom:3}}>PROFONDITÀ INTONACO (mm) — std 325</div>
                                <input type="number" inputMode="numeric" placeholder="325"
                                  value={ct.varC||""}
                                  onChange={e=>updateV("controtelaio",{...ct,varC:parseInt(e.target.value)||0})}
                                  style={{...S.input,borderColor:"#3B7FE060",fontSize:18,padding:"9px 14px"}}/>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ── MISURE CONTROTELAIO ── */}
                        <div style={{borderTop:`1px solid ${T.bdr}`,paddingTop:10}}>
                          <div style={{fontSize:10,fontWeight:800,color:T.sub,marginBottom:6,textTransform:"uppercase",letterSpacing:0.5}}>
                            Misure controtelaio
                          </div>

                          {/* Schema visivo riferimento misura */}
                          <div style={{background:"#F0F4FF",borderRadius:8,padding:"8px 10px",marginBottom:8,
                            border:"1px solid #3B7FE020",display:"flex",gap:10,alignItems:"center"}}>
                            <svg width={60} height={44} viewBox="0 0 60 44">
                              {/* muro */}
                              <rect x={0} y={0} width={60} height={44} fill="#E8EEF5"/>
                              {/* controtelaio */}
                              <rect x={8} y={6} width={44} height={32} fill="#fff" stroke="#3B7FE0" strokeWidth={1.5}/>
                              {/* infisso */}
                              <rect x={14} y={11} width={32} height={22} fill="#E0F2FE" stroke="#0284C7" strokeWidth={1}/>
                              {/* freccia luce */}
                              <line x1={14} y1={38} x2={46} y2={38} stroke="#DC4444" strokeWidth={1}/>
                              <polygon points="14,36 14,40 10,38" fill="#DC4444"/>
                              <polygon points="46,36 46,40 50,38" fill="#DC4444"/>
                              <text x={30} y={43} textAnchor="middle" fontSize={5} fill="#DC4444" fontWeight="800">LUCE ARCH.</text>
                              {/* label A */}
                              <text x={4} y={24} textAnchor="middle" fontSize={5} fill="#DC4444" fontWeight="800">A</text>
                            </svg>
                            <div style={{fontSize:10,color:"#3B7FE0",lineHeight:1.5}}>
                              <div style={{fontWeight:800,marginBottom:2}}>Come misurare</div>
                              <div style={{color:"#64748B"}}>
                                {ct.tipoMisura==="luce"&&"Luce architettonica = larghezza netta del vano nel muro"}
                                {ct.tipoMisura==="esterno"&&"Esterno CT = dimensione esterna del controtelaio montato"}
                                {ct.tipoMisura==="interno"&&"Interno telaio = luce interna dell'infisso"}
                                {ct.tipoMisura==="grezzo"&&"Muro grezzo = apertura prima dell'intonaco"}
                                {!ct.tipoMisura&&"Seleziona il tipo di misura →"}
                              </div>
                            </div>
                          </div>

                          {/* Tipo riferimento */}
                          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
                            {[
                              {id:"luce",l:"Luce architett."},
                              {id:"esterno",l:"Esterno CT"},
                              {id:"interno",l:"Interno telaio"},
                              {id:"grezzo",l:"Muro grezzo"},
                            ].map(tm=>(
                              <div key={tm.id}
                                onClick={()=>updateV("controtelaio",{...ct,tipoMisura:tm.id})}
                                style={{padding:"6px 10px",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:700,
                                  border:`1.5px solid ${ct.tipoMisura===tm.id?"#3B7FE0":T.bdr}`,
                                  background:ct.tipoMisura===tm.id?"#3B7FE015":T.card,
                                  color:ct.tipoMisura===tm.id?"#3B7FE0":T.sub}}>
                                {tm.l}
                              </div>
                            ))}
                          </div>

                          {/* L × H */}
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
                            <div>
                              <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:3}}>LARGHEZZA L (mm)</div>
                              <input type="number" inputMode="numeric" placeholder="L"
                                value={ct.l||""}
                                onChange={e=>updateV("controtelaio",{...ct,l:parseInt(e.target.value)||0})}
                                style={{...S.input,fontSize:20,padding:"10px 14px"}}/>
                            </div>
                            <div>
                              <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:3}}>ALTEZZA H (mm)</div>
                              <input type="number" inputMode="numeric" placeholder="H"
                                value={ct.h||""}
                                onChange={e=>updateV("controtelaio",{...ct,h:parseInt(e.target.value)||0})}
                                style={{...S.input,fontSize:20,padding:"10px 14px"}}/>
                            </div>
                          </div>

                          {/* Ribattuta */}
                          <div style={{marginBottom:10}}>
                            <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:4}}>RIBATTUTA R</div>
                            <div style={{display:"flex",gap:6}}>
                              {(sistema?.id==="PROI"?[50]:[30,50,70]).map(r=>(
                                <div key={r}
                                  onClick={()=>updateV("controtelaio",{...ct,ribattuta:r})}
                                  style={{flex:1,padding:"8px 4px",borderRadius:8,textAlign:"center",cursor:"pointer",
                                    border:`2px solid ${ct.ribattuta===r?"#1A9E73":T.bdr}`,
                                    background:ct.ribattuta===r?"#1A9E7315":T.card}}>
                                  <div style={{fontSize:15,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                                    color:ct.ribattuta===r?"#1A9E73":T.text}}>{r}</div>
                                  <div style={{fontSize:8,color:T.sub}}>mm</div>
                                </div>
                              ))}
                              {sistema?.id==="PROI"&&(
                                <div style={{flex:2,padding:"8px",borderRadius:8,background:"#1A9E7310",
                                  border:"1px dashed #1A9E7340",display:"flex",alignItems:"center"}}>
                                  <div style={{fontSize:9,color:"#1A9E73",fontWeight:600}}>PROI — ribattuta standard 50mm</div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Calcola offset infisso */}
                          {ct.l > 0 && ct.h > 0 && (
                            <div onClick={()=>{
                              const off = ct.ribattuta || 30;
                              const cl = ct.l - off*2;
                              const ch = ct.h - off*2;
                              updateMisureBatch(v.id, {lAlto:cl,lCentro:cl,lBasso:cl});
                              updateMisura(v.id,"hSx",ch); updateMisura(v.id,"hCentro",ch); updateMisura(v.id,"hDx",ch);
                            }}
                              style={{padding:"10px 14px",borderRadius:10,background:"#1A9E7315",
                                border:"1.5px solid #1A9E7340",textAlign:"center",cursor:"pointer",marginBottom:4}}>
                              <div style={{fontSize:12,fontWeight:800,color:"#1A9E73"}}>
                                Calcola misura infisso (−{ct.ribattuta||30}mm/lato)
                              </div>
                              <div style={{fontSize:10,color:"#1A9E7380",marginTop:2,fontFamily:"'JetBrains Mono',monospace"}}>
                                {(ct.l||0)-(ct.ribattuta||30)*2} × {(ct.h||0)-(ct.ribattuta||30)*2} mm
                              </div>
                            </div>
                          )}
                        </div>

                        {/* ── CASSONETTO / AVVOLGIBILE (solo sistemi hasCass) ── */}
                        {sistema?.hasCass && (
                          <div style={{borderTop:`1px solid ${T.bdr}`,paddingTop:10,marginTop:4}}>
                            <div style={{fontSize:10,fontWeight:800,color:T.sub,marginBottom:8,
                              textTransform:"uppercase",letterSpacing:0.5}}>
                              Avvolgibile / Cassonetto
                            </div>

                            {/* Motore o cinghia */}
                            <div style={{marginBottom:8}}>
                              <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:4}}>COMANDO</div>
                              <div style={{display:"flex",gap:6}}>
                                {[["cinghia","Cinghia"],["motore","Motore"],["nessuno","Nessuno"]].map(([val,lbl])=>(
                                  <div key={val}
                                    onClick={()=>updateV("controtelaio",{...ct,comando:val})}
                                    style={{flex:1,padding:"7px 4px",borderRadius:8,textAlign:"center",cursor:"pointer",
                                      border:`2px solid ${ct.comando===val?"#D08008":T.bdr}`,
                                      background:ct.comando===val?"#D0800815":T.card}}>
                                    <div style={{fontSize:11,fontWeight:700,
                                      color:ct.comando===val?"#D08008":T.sub}}>{lbl}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* DX / SX */}
                            <div style={{marginBottom:8}}>
                              <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:4}}>AVVOLGIMENTO</div>
                              <div style={{display:"flex",gap:6}}>
                                {[["dx","DX"],["sx","SX"]].map(([val,lbl])=>(
                                  <div key={val}
                                    onClick={()=>updateV("controtelaio",{...ct,avvLato:val})}
                                    style={{flex:1,padding:"9px 4px",borderRadius:8,textAlign:"center",cursor:"pointer",
                                      border:`2px solid ${ct.avvLato===val?"#3B7FE0":T.bdr}`,
                                      background:ct.avvLato===val?"#3B7FE015":T.card}}>
                                    <div style={{fontSize:14,fontWeight:800,
                                      color:ct.avvLato===val?"#3B7FE0":T.sub}}>{lbl}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Tipologia avvolgibile */}
                            <div style={{marginBottom:8}}>
                              <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:4}}>TIPOLOGIA AVVOLGIBILE</div>
                              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                                {["Tapparella PVC","Tapparella alluminio","Tapparella legno","Persiana legno","Persiana alluminio","Veneziana"].map(tip=>(
                                  <div key={tip}
                                    onClick={()=>updateV("controtelaio",{...ct,avvTipologia:tip})}
                                    style={{padding:"5px 9px",borderRadius:6,cursor:"pointer",fontSize:10,fontWeight:600,
                                      border:`1.5px solid ${ct.avvTipologia===tip?"#D08008":T.bdr}`,
                                      background:ct.avvTipologia===tip?"#D0800815":T.card,
                                      color:ct.avvTipologia===tip?"#D08008":T.sub}}>
                                    {tip}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Colore avvolgibile */}
                            <div>
                              <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:4}}>COLORE AVVOLGIBILE</div>
                              <input type="text" placeholder="es. Bianco RAL 9010, Noce, Argento..."
                                value={ct.avvColore||""}
                                onChange={e=>updateV("controtelaio",{...ct,avvColore:e.target.value})}
                                style={{...S.input,fontSize:13,padding:"9px 12px"}}/>
                            </div>
                          </div>
                        )}

                        {/* ── ACCESSORI ── */}
                        <div style={{borderTop:`1px solid ${T.bdr}`,paddingTop:10,marginTop:10}}>
                          <div style={{fontSize:10,fontWeight:800,color:T.sub,marginBottom:6,
                            textTransform:"uppercase",letterSpacing:0.5}}>Accessori</div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            {[
                              ["battutaPVC","Battuta PVC"],
                              ["battutaLegno","Battuta legno"],
                              ["smusso","Smusso 45°"],
                              ["quartoLato","4° lato PVC"],
                              ["tappoZanz","Tappo zanzariera"],
                              ["sottobancale","Sottobancale EPS"],
                              ["assemblaggio","Assemblaggio CT"],
                              ...(sistema?.hasCass?[["avvMontaggio","Montaggio avvolgibile"]]:[]),
                            ].map(([k,lbl])=>(
                              <div key={k}
                                onClick={()=>updateV("controtelaio",{...ct,[k]:!ct[k]})}
                                style={{padding:"6px 11px",borderRadius:7,cursor:"pointer",fontSize:11,fontWeight:600,
                                  border:`1.5px solid ${ct[k]?"#D08008":T.bdr}`,
                                  background:ct[k]?"#D0800815":T.card,
                                  color:ct[k]?"#D08008":T.sub}}>
                                {ct[k]?"✓ ":""}{lbl}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ── RIEPILOGO ORDINE ── */}
                        {ct.l > 0 && ct.h > 0 && ct.sistema && (
                          <div style={{borderTop:`1px solid ${T.bdr}`,paddingTop:10,marginTop:10}}>
                            <div style={{background:"#1A1A1C",borderRadius:10,padding:"12px 14px"}}>
                              <div style={{fontSize:9,fontWeight:800,color:"rgba(255,255,255,0.5)",
                                textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>
                                Anteprima riga ordine
                              </div>
                              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,
                                  background:"#1A9E73",color:"#fff",borderRadius:4,padding:"2px 8px",fontWeight:700}}>
                                  {ct.sistema}
                                </span>
                                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,
                                  color:"#fff",fontWeight:700}}>
                                  {ct.l} × {ct.h} mm
                                </span>
                                {ct.ribattuta&&(
                                  <span style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>
                                    bat. {ct.ribattuta}mm
                                  </span>
                                )}
                                {ct.varA>0&&(
                                  <span style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>
                                    A={ct.varA}mm{ct.varB>0?` B=${ct.varB}mm`:""}
                                  </span>
                                )}
                                {ct.avvLato&&(
                                  <span style={{fontSize:10,background:"#3B7FE0",color:"#fff",
                                    borderRadius:4,padding:"1px 6px",fontWeight:700}}>
                                    {ct.avvLato.toUpperCase()}
                                  </span>
                                )}
                                {ct.avvTipologia&&(
                                  <span style={{fontSize:10,color:"rgba(255,255,255,0.6)"}}>
                                    {ct.avvTipologia}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                      </div>
                    )}

                    {/* Salta */}
                    {!sistema && (
                      <div style={{textAlign:"center",padding:"8px 0",fontSize:12,color:T.sub,cursor:"pointer"}}
                        onClick={()=>updateV("controtelaio",{tipo:"nessuno"})}>
                        Nessun controtelaio → Salta
                      </div>
                    )}

                  </div>
                );
              })()
            },
          ];

          // Build chip summary
          const configChips = [v.tipo, v.stanza && v.piano ? v.stanza+" "+v.piano : "", v.sistema ? v.sistema.split(" ").slice(0,2).join(" · ") : "", v.coloreInt && v.coloreEst && v.bicolore ? v.coloreInt+"/"+v.coloreEst : v.coloreInt||"", v.vetro||""].filter(Boolean);
          const prevVani = selectedRilievo ? selectedRilievo.vani.filter(vn => vn.id !== v.id && vn.tipo) : [];
          const handleClone = (src) => { ["tipo","stanza","piano","sistema","vetro","coloreInt","coloreEst","bicolore","coloreAcc","telaio","telaioAlaZ","rifilato","coprifilo","lamiera","controtelaio","difficoltaSalita","mezzoSalita"].forEach(f => { if(src[f]!==undefined&&src[f]!==null&&src[f]!=="") updateV(f,src[f]); }); };

          return (
            <div style={{padding:"6px 16px 2px"}}>
              {/* Flash CSS */}
              <style>{`
                @keyframes mFlashGreen { 0%{background:${T.grn}30;} 50%{background:${T.grn}45;} 100%{background:transparent;} }
                @keyframes mSlideBody { from{opacity:0;max-height:0;} to{opacity:1;max-height:600px;} }
                @keyframes mBadgePop { 0%{transform:scale(0.5);opacity:0;} 60%{transform:scale(1.15);} 100%{transform:scale(1);opacity:1;} }
                .m-flash{animation:mFlashGreen 0.5s ease-out;}
                .m-slide{animation:mSlideBody 0.3s ease-out;overflow:hidden;}
                .m-badge-pop{animation:mBadgePop 0.3s ease-out;}
              `}</style>

              {/* Chip riepilogo */}
              {configChips.length >= 2 && (
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"9px 12px",borderRadius:10,background:T.grn+"10",border:"1.5px solid "+T.grn+"30",marginBottom:8,flexWrap:"wrap"}}>
                  <span style={{fontSize:12}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>
                  <span style={{fontSize:11,fontWeight:700,color:T.grn,fontFamily:FF}}>{configChips.join(" · ")}</span>
                </div>
              )}

              {/* Clona da vano precedente */}
              {configChips.length < 2 && prevVani.length > 0 && (
                <div style={{display:"flex",gap:4,marginBottom:6,overflowX:"auto",paddingBottom:2,alignItems:"center"}}>
                  <span style={{fontSize:10,fontWeight:700,color:T.sub,whiteSpace:"nowrap"}}>Clona:</span>
                  {prevVani.map(pv=>(
                    <div key={pv.id} onClick={()=>handleClone(pv)} style={{padding:"4px 10px",borderRadius:8,border:"1px dashed "+T.acc+"60",background:T.card,fontSize:10,fontWeight:600,color:T.acc,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                      {pv.tipo||"?"} {pv.stanza?"· "+pv.stanza:""}
                    </div>
                  ))}
                </div>
              )}

              {/* Flash accordion sections */}
              {sections.map(sec=>{
                const isOpen = vanoInfoOpen===sec.id;
                const isDone = completedSecs.has(sec.id);
                const isFlashing = flashSec===sec.id;
                const hasFill = sec.filled > 0;
                const allFill = sec.filled >= sec.total;
                const isOptional = ["telaio","finiture","controtelaio"].includes(sec.id);
                return (
                  <div key={sec.id} ref={el=>sectionRefs.current[sec.id]=el}
                    className={isFlashing?"m-flash":""}
                    style={{marginBottom:6,borderRadius:14,border:`1.5px solid ${isOpen?"#28A0A0":isDone?"#1A9E73":hasFill?"rgba(26,158,115,0.4)":"#F0EFEC"}`,overflow:"hidden",transition:"border-color 0.3s",boxShadow:isOpen?"0 2px 8px rgba(40,160,160,0.15)":isDone?"0 2px 8px rgba(26,158,115,0.1)":"0 2px 8px rgba(0,0,0,0.04)"}}>
                    <div onClick={()=>setVanoInfoOpen(isOpen?null:sec.id)}
                      style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",background:isFlashing?"rgba(26,158,115,0.08)":isOpen?"rgba(40,160,160,0.06)":"white",cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        {sec.iconSVG && <span style={{width:16,height:16,display:"inline-flex",alignItems:"center",justifyContent:"center",color:isOpen?T.acc:T.sub,flexShrink:0}} dangerouslySetInnerHTML={{__html:sec.iconSVG}} />}
                        <span style={{fontSize:13,fontWeight:900,color:isOpen?"#28A0A0":isDone?"#1A9E73":"#0D1F1F"}}>{sec.label}</span>
                        {isOptional && !hasFill && <span style={{fontSize:9,color:"#8A8A82",fontWeight:700}}>opz.</span>}
                        {sec.badge && <span className={isFlashing?"m-badge-pop":""} style={{padding:"3px 9px",borderRadius:20,background:isDone?"rgba(26,158,115,0.12)":"rgba(40,160,160,0.10)",color:isDone?"#1A9E73":"#28A0A0",fontSize:10,fontWeight:900,boxShadow:isDone?"0 2px 0 0 rgba(26,158,115,0.3)":"0 2px 0 0 rgba(40,160,160,0.2)"}}>{sec.badge}</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {isDone && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A9E73" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        {hasFill && !isDone && <span style={{fontSize:10,fontWeight:900,color:allFill?"#1A9E73":"#D08008",padding:"2px 8px",borderRadius:20,background:allFill?"rgba(26,158,115,0.12)":"rgba(208,128,8,0.12)"}}>{sec.filled}/{sec.total}</span>}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8A8A82" strokeWidth="2.2" strokeLinecap="round" style={{transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.15s"}}><path d="M6 9l6 6 6-6"/></svg>
                      </div>
                    </div>
                    {isOpen && <div className="m-slide" style={{padding:"10px 14px 12px",background:"#F7F7F5",borderTop:"1.5px solid #F0EFEC"}}>
                      {sec.body}
                      {isOptional && <div onClick={()=>flashAndAdvance(sec.id)} style={{marginTop:8,padding:"8px",borderRadius:8,border:"1px dashed "+T.bdr,textAlign:"center",fontSize:11,color:T.sub,cursor:"pointer"}}>Salta →</div>}
                    </div>}
                  </div>
                );
              })}

            {/* ══════ STRUTTURE ══════ */}
            <div style={{marginTop:8,borderRadius:10,border:`1px solid ${T.acc}30`,overflow:"hidden"}}>
              <div onClick={()=>setVanoInfoOpen(vanoInfoOpen==="strutture"?null:"strutture")}
                style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:T.accLt,cursor:"pointer"}}>
                <span style={{fontSize:14}}><I d={ICO.building} />️</span>
                <span style={{fontSize:12,fontWeight:600,color:vanoInfoOpen==="strutture"?T.acc:T.text}}>Strutture</span>
                <span style={{fontSize:9,color:T.sub,fontStyle:"italic"}}>Pergole, Verande, Box</span>
                <span style={{marginLeft:"auto",fontSize:9,color:T.sub,transform:vanoInfoOpen==="strutture"?"rotate(180deg)":"none",transition:"transform 0.15s"}}>▼</span>
              </div>
              {vanoInfoOpen==="strutture" && (
                <div style={{padding:12,background:T.bg,borderTop:"1px solid "+T.bdr}}>
                  <div style={{textAlign:"center",padding:"20px 10px"}}>
                    <div style={{fontSize:36,marginBottom:8}}><I d={ICO.building} />️</div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>Configuratore Strutture</div>
                    <div style={{fontSize:11,color:T.sub,marginBottom:12}}>Pianta → Profili → Lati → 3D → Disegno Tecnico</div>
                    <div onClick={()=>setShowStrutture(true)} style={{padding:"12px 20px",borderRadius:8,background:T.acc,color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"inline-block"}}>
                      Apri Configuratore →
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          );
        })()}

        {/* fliwoX Progress bar — DETTAGLI · MISURE · RIEPILOGO */}
        <div style={{ padding: "10px 14px 4px" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {STEPS.map((s, i) => {
              const isActive = i === vanoStep;
              const isDone = i < vanoStep;
              return (
                <div key={i} onClick={() => setVanoStep(i)} style={{ flex: 1, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: isActive ? "#28A0A0" : isDone ? "#1A9E73" : "white", border: `1.5px solid ${isActive ? "#156060" : isDone ? "#0A5A3A" : "#F0EFEC"}`, boxShadow: isActive ? "0 2px 6px rgba(40,160,160,0.3)" : isDone ? "0 2px 6px rgba(26,158,115,0.2)" : "0 2px 6px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isDone
                        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <span style={{ fontSize: 10, fontWeight: 900, color: isActive ? "white" : "#8BBCBC" }}>{i + 1}</span>
                      }
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 900, color: isActive ? "#0D1F1F" : isDone ? "#1A9E73" : "#8A8A82" }}>{s.title}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: isActive ? "#28A0A0" : isDone ? "#1A9E73" : "#D0E8E8", boxShadow: isActive ? "0 2px 6px rgba(40,160,160,0.3)" : "none" }} />
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "8px 16px" }}>
          {/* fliwoX Step header card */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "white", borderRadius: 16, border: "1.5px solid #F0EFEC", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#28A0A010", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 3px 0 0 rgba(40,160,160,0.3)" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2.2" strokeLinecap="round">
                {vanoStep === 0 && <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>}
                {vanoStep === 1 && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
                {vanoStep === 2 && <><polyline points="20 6 9 17 4 12"/></>}
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#0D1F1F", letterSpacing: "-0.2px" }}>{step.title}</div>
              <div style={{ fontSize: 11, color: "#8A8A82", fontWeight: 700, marginTop: 2 }}>{step.desc}</div>
              {vanoStep === 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                  {(() => {
                    const filled = ["lAlto","lCentro","lBasso","hSx","hCentro","hDx","d1","d2"].filter(f => m[f] > 0).length;
                    const isComplete = filled >= 6;
                    return (
                      <div style={{ padding: "3px 10px", borderRadius: 20, background: isComplete ? "rgba(26,158,115,0.12)" : "rgba(40,160,160,0.10)", boxShadow: isComplete ? "0 2px 0 0 rgba(26,158,115,0.3)" : "0 2px 0 0 rgba(40,160,160,0.2)" }}>
                        <span style={{ fontSize: 10, fontWeight: 900, color: isComplete ? "#1A9E73" : "#28A0A0" }}>{filled}/8 inserite</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* FOTO + MISURE RAPIDA */}
          <div onClick={() => setShowFotoMisure(true)} style={{ padding: "12px 16px", borderRadius: 14, background: T.card, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, marginBottom: 0, border: `1.5px solid ${T.bdr}` }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: T.acc+"18", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.acc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Foto + Misure</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 1 }}>Scatta foto e annota misure sopra</div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          {/* GALLERY FOTO MISURE — sotto il bottone */}
          {(() => {
            const fotoMisure = Object.entries(v.foto || {}).filter(([k]) => k.startsWith("misure_")).sort((a, b) => b[0].localeCompare(a[0]));
            if (fotoMisure.length === 0) return <div style={{ marginBottom: 12 }} />;
            return (
              <div style={{ marginTop: 0, marginBottom: 12, borderRadius: "0 0 14px 14px", background: T.card, border: "1px solid " + T.bdr, borderTop: "none", padding: "8px 10px", overflow: "hidden" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>Foto misure salvate ({fotoMisure.length})</div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                  {fotoMisure.map(([key, foto]) => (
                    <div key={key} style={{ flexShrink: 0, position: "relative" }}>
                      <img src={foto.url || foto.dataUrl} style={{ width: 100, height: 75, objectFit: "cover", borderRadius: 8, border: "2px solid " + T.bdr }} />
                      <div style={{ position: "absolute", bottom: 2, left: 2, right: 2, padding: "2px 4px", borderRadius: "0 0 6px 6px", background: "rgba(0,0,0,0.6)", fontSize: 8, color: "#fff", fontWeight: 700, textAlign: "center" }}>
                        {(foto.annotations || []).length} segni
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); const newFoto = { ...(v.foto || {}) }; const fDel = newFoto[key]; if (fDel?.url) deleteFotoVano(fDel.url); delete newFoto[key]; setCantieri(cs => cs.map(c2 => c2.id === selectedCM?.id ? { ...c2, rilievi: c2.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: newFoto } : vn) } : r2) } : c2)); setSelectedVano(prev => ({ ...prev, foto: newFoto })); }} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: 9, background: "rgba(220,68,68,0.85)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 10, color: "#fff", fontWeight: 700 }}></div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Warnings */}
          {vanoStep === 0 && (hasWarnings || hasHWarnings) && (
            <div style={{ padding: "8px 14px", borderRadius: 10, background: "#fff3e0", border: "1px solid #ffe0b2", marginBottom: 12, fontSize: 11, color: "#e65100" }}>
              {hasWarnings && <div><I d={ICO.alertTriangle} /> Nessuna larghezza inserita</div>}
              {hasHWarnings && <div><I d={ICO.alertTriangle} /> Nessuna altezza inserita</div>}
            </div>
          )}

          {/* === STEP 0: MISURE (larghezze + altezze + diagonali) === */}
          {vanoStep === 0 && (
            <>
              {/* ═══ MISURE OUTDOOR: Tende / Pergole ═══ */}
              {(() => {
                const outdoorCodes = ["TDBR","TDCAD","TDCAP","TDVER","TDRUL","TDPERG","TDZIP","TDVELA","VENEZIA","TDS","TDR","TVE","PBC","PGA","PGF","TCA","TCB","ZTE"];
                if (!outdoorCodes.includes(v.tipo)) return null;
                const isPergola = ["TDPERG","PBC","PGA","PGF"].includes(v.tipo);
                const isBracci = ["TDBR","TCB","TCA","TDCAP"].includes(v.tipo);
                const isVela = v.tipo === "TDVELA";
                return (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ padding:"10px 14px", borderRadius:10, background:"#E8A02010", border:"1px solid #E8A02030", marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#E8A020" }}><I d={ICO.sparkles} />️ Misure {isPergola ? "Pergola" : isBracci ? "Tenda a bracci" : isVela ? "Vela ombreggiante" : "Tenda/Schermatura"}</div>
                      <div style={{ fontSize:10, color:T.sub, marginTop:2 }}>{isPergola ? "Larghezza × Profondità × Altezza colonne" : isBracci ? "Larghezza telo × Sporgenza (aggetto)" : "Larghezza × Altezza (caduta)"}</div>
                    </div>

                    {/* LARGHEZZA — sempre presente */}
                    <div style={{ fontSize:11, fontWeight:800, color:"#507aff", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}><I d={ICO.ruler} /> Larghezza</div>
                    {<VanoBInput key="lCentro" label={"Larghezza mm"} field="lCentro"
                        value={m["lCentro"] as number} stepColor={step.color}
                        textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                        onUpdate={(val: number) => updateMisura(v.id, "lCentro", val)} />}

                    {/* ALTEZZA/DROP — sempre presente */}
                    <div style={{ fontSize:11, fontWeight:800, color:"#1A9E73", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, marginTop:12 }}><I d={ICO.ruler} /> {isPergola ? "Altezza colonne" : "Altezza / Drop"}</div>
                    {<VanoBInput key="hCentro" label={isPergola ? "Altezza colonne mm" : "Altezza (caduta) mm"} field="hCentro"
                        value={m["hCentro"] as number} stepColor={step.color}
                        textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                        onUpdate={(val: number) => updateMisura(v.id, "hCentro", val)} />}

                    {/* PROFONDITA/SPORGENZA — pergole e bracci */}
                    {(isPergola || isBracci) && (<>
                      <div style={{ fontSize:11, fontWeight:800, color:"#E8A020", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, marginTop:12 }}>↕️ {isPergola ? "Profondità" : "Sporgenza (Aggetto)"}</div>
                      {<VanoBInput key="sporgenza" label={isPergola ? "Profondità mm" : "Sporgenza/Aggetto mm"} field="sporgenza"
                          value={m["sporgenza"] as number} stepColor={step.color}
                          textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                          onUpdate={(val: number) => updateMisura(v.id, "sporgenza", val)} />}
                    </>)}

                    {/* VELA: 3 lati */}
                    {isVela && (<>
                      <div style={{ fontSize:11, fontWeight:800, color:"#E8A020", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, marginTop:12 }}><I d={ICO.ruler} /> Lati vela</div>
                      {<VanoBInput key="lAlto" label={"Lato 2 mm"} field="lAlto"
                          value={m["lAlto"] as number} stepColor={step.color}
                          textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                          onUpdate={(val: number) => updateMisura(v.id, "lAlto", val)} />}
                      {<VanoBInput key="lBasso" label={"Lato 3 mm"} field="lBasso"
                          value={m["lBasso"] as number} stepColor={step.color}
                          textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                          onUpdate={(val: number) => updateMisura(v.id, "lBasso", val)} />}
                    </>)}

                    {/* PERGOLA: extra fields */}
                    {isPergola && (<>
                      <div style={{ fontSize:11, fontWeight:800, color:"#8B5CF6", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, marginTop:16, borderTop:"1px solid "+T.bdr, paddingTop:12 }}><I d={ICO.building} /> Configurazione Pergola</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                        <div>
                          <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:2 }}>N° MODULI</div>
                          <input style={S.input} type="number" placeholder="1" value={v.nModuli||""} onChange={e => updateV("nModuli", parseInt(e.target.value)||1)}/>
                        </div>
                        <div>
                          <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:2 }}>TIPO LAMA</div>
                          <select style={S.select} value={v.tipoLama||""} onChange={e => updateV("tipoLama", e.target.value)}>
                            <option value="">— Tipo —</option>
                            <option value="orientabile">Orientabile</option>
                            <option value="retrattile">Retrattile</option>
                            <option value="impacchettabile">Impacchettabile</option>
                            <option value="fissa">Fissa</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                        <div>
                          <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:2 }}>STRUTTURA</div>
                          <select style={S.select} value={v.struttura||""} onChange={e => updateV("struttura", e.target.value)}>
                            <option value="">— Struttura —</option>
                            <option value="alluminio">Alluminio</option>
                            <option value="acciaio">Acciaio</option>
                            <option value="legno">Legno</option>
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:2 }}>TIPO</div>
                          <select style={S.select} value={v.tipoPergola||""} onChange={e => updateV("tipoPergola", e.target.value)}>
                            <option value="">— Tipo —</option>
                            <option value="addossata">Addossata a muro</option>
                            <option value="freestanding">Autoportante</option>
                          </select>
                        </div>
                      </div>
                    </>)}

                    {/* COMUNE: montaggio + motorizzazione */}
                    <div style={{ fontSize:11, fontWeight:800, color:"#86868b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, marginTop:16, borderTop:"1px solid "+T.bdr, paddingTop:12 }}><I d={ICO.settings} /> Installazione</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:2 }}>MONTAGGIO</div>
                        <select style={S.select} value={v.montaggio||""} onChange={e => updateV("montaggio", e.target.value)}>
                          <option value="">— Montaggio —</option>
                          <option value="parete">A parete</option>
                          <option value="soffitto">A soffitto</option>
                          <option value="nicchia">In nicchia</option>
                          <option value="pavimento">A pavimento</option>
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:2 }}>ORIENTAMENTO</div>
                        <select style={S.select} value={v.orientamento||""} onChange={e => updateV("orientamento", e.target.value)}>
                          <option value="">— Orientamento —</option>
                          <option value="nord">Nord</option>
                          <option value="sud">Sud</option>
                          <option value="est">Est</option>
                          <option value="ovest">Ovest</option>
                        </select>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <div>
                        <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:2 }}>MOTORIZZAZIONE</div>
                        <select style={S.select} value={v.motorizzazione||""} onChange={e => updateV("motorizzazione", e.target.value)}>
                          <option value="">— Motorizzazione —</option>
                          <option value="manuale">Manuale</option>
                          <option value="motore">Motore tubolare</option>
                          <option value="motore_radio">Motore + radiocomando</option>
                          <option value="domotica">Domotica/smart</option>
                          <option value="sensore_vento">Con sensore vento</option>
                          <option value="sensore_sole">Con sensore sole</option>
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:9, fontWeight:700, color:T.sub, marginBottom:2 }}>TESSUTO/MATERIALE</div>
                        <input style={S.input} placeholder="es. Acrilico 300g" value={v.tessuto||""} onChange={e => updateV("tessuto", e.target.value)}/>
                      </div>
                    </div>

                    {/* Altezza montaggio da terra */}
                    <div style={{ marginTop:8 }}>
                      {<VanoBInput key="hMontaggio" label={"Altezza montaggio da terra mm"} field="hMontaggio"
                          value={m["hMontaggio"] as number} stepColor={step.color}
                          textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                          onUpdate={(val: number) => updateMisura(v.id, "hMontaggio", val)} />}
                    </div>

                    {/* Riepilogo visivo */}
                    {m.lCentro > 0 && m.hCentro > 0 && (
                      <div style={{ marginTop:12, padding:12, borderRadius:10, background:T.card, border:"1px solid "+T.bdr, textAlign:"center" }}>
                        <div style={{ fontSize:10, color:T.sub, fontWeight:700, marginBottom:4 }}><I d={ICO.ruler} /> RIEPILOGO</div>
                        <div style={{ fontSize:16, fontWeight:900, color:T.text }}>
                          {m.lCentro} × {m.hCentro} {(m.sporgenza||isPergola) ? " × " + (m.sporgenza||"—") : ""} mm
                        </div>
                        <div style={{ fontSize:11, color:T.sub }}>
                          {((m.lCentro/1000) * (isPergola ? (m.sporgenza||m.hCentro)/1000 : m.hCentro/1000)).toFixed(2)} m²
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ═══ MISURE STANDARD: Serramenti (8 punti) ═══ */}
              {!["TDBR","TDCAD","TDCAP","TDVER","TDRUL","TDPERG","TDZIP","TDVELA","VENEZIA","TDS","TDR","TVE","PBC","PGA","PGF","TCA","TCB","ZTE"].includes(v.tipo) && (<>

              {/* ═══ DISEGNO TECNICO — Bottone apre fullscreen ═══ */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${showDisegno ? T.purple : T.bdr}`, background: T.card, cursor: "pointer" }}
                  onClick={() => setShowDisegno(true)}>
                  <span style={{ fontSize: 16 }}><I d={ICO.edit} /></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: showDisegno ? T.purple : T.text }}>Disegno tecnico CAD</div>
                    <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{(m.lCentro || m.lAlto || 1200)}×{(m.hCentro || m.hSx || 1400)}mm · {(v.disegno?.elements?.length || 0)} elementi</div>
                  </div>
                  {(v.disegno?.elements?.length > 0) && <span style={{ padding: "2px 8px", borderRadius: 5, background: `${T.grn}18`, fontSize: 9, fontWeight: 800, color: T.grn }}>{v.disegno.elements.length} el.</span>}
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.purple, padding: "4px 10px", borderRadius: 6, background: `${T.purple}12`, border: `1px solid ${T.purple}30` }}>Apri →</span>
                </div>
              </div>

              

              {/* Modal DisegnoTecnico — forma finestra */}
              {showDisegno && (
                <div style={{ position:"fixed", inset:0, zIndex:9000, background:"rgba(0,0,0,0.7)",
                  display:"flex", alignItems:"stretch", justifyContent:"center",
                  paddingTop:"env(safe-area-inset-top, 0px)",
                  paddingBottom:"env(safe-area-inset-bottom, 0px)" }}>
                  <div style={{ width:"100vw", height:"100%",
                    background:"#fff", display:"flex", flexDirection:"column", overflow:"hidden" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px",
                      borderBottom:"1px solid #eee", flexShrink:0, background:"#1A9E7310" }}>
                      <span style={{ fontWeight:700, fontSize:13, flex:1, color:"#1A9E73" }}>📐 Disegno — {v.nome}</span>
                      <button onClick={()=>setShowDisegno(false)} style={{ background:"#DC4444", border:"none",
                        borderRadius:10, padding:"10px 18px", cursor:"pointer", fontSize:14, fontWeight:800, color:"#fff",
                        minWidth:88, minHeight:40 }}>✕ Chiudi</button>
                    </div>
                    <div style={{ flex:1, overflow:"hidden" }}>
                      <DisegnoTecnico
                        vanoId={v.id}
                        vanoNome={v.nome||`Vano ${v.numero||""}`}
                        vanoDisegno={v.disegno}
                        realW={m.lCentro||m.lAlto||1200}
                        realH={m.hCentro||m.hSx||1400}
                        onUpdate={(d:any)=>updateVanoField(v.id,"disegno",d)}
                        onClose={()=>setShowDisegno(false)}
                        T={T}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Schizzo tecnico — collassabile */}
              {showSchizzo ? (
                <SkizzoTecnico
                  misure={m}
                  onSaveMisure={(l, h) => {
                    updateMisureBatch(v.id, { lAlto:l, lCentro:l, lBasso:l });
                    updateMisura(v.id, "hSx", h);
                    updateMisura(v.id, "hCentro", h);
                    updateMisura(v.id, "hDx", h);
                  }}
                  onClose={() => setShowSchizzo(false)}
                  T={T}
                />
              ) : (
                <div onClick={() => setShowSchizzo(true)}
                  style={{ marginBottom:12, padding:"10px 14px", borderRadius:12,
                    border:`1px solid ${T.bdr}`, background:T.card,
                    display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:T.acc+"12",
                    display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.acc} strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:T.text }}>Schizzo vano</div>
                    <div style={{ fontSize:10, color:T.sub }}>
                      {(m.lCentro||m.lAlto) ? `L=${m.lCentro||m.lAlto}mm${m.hCentro?` · H=${m.hCentro}mm`:""}` : "Disegna il vano e quota le misure"}
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              )}
              <div style={{ fontSize: 11, fontWeight: 800, color: "#507aff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}><I d={ICO.ruler} /> Larghezze</div>
              {<VanoBInput key="lAlto" label={"Larghezza ALTO"} field="lAlto"
                  value={m["lAlto"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "lAlto", val)} />}
              {m.lAlto > 0 && !m.lCentro && !m.lBasso && (
                <div onClick={() => { updateMisura(v.id, "lCentro", m.lAlto); updateMisura(v.id, "lBasso", m.lAlto); }} style={{ margin: "-4px 0 12px", padding: "10px", borderRadius: 10, background: T.accLt, border: `1px solid ${T.acc}40`, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.acc }}>
                  = Tutte uguali ({m.lAlto} mm)
                </div>
              )}
              {<VanoBInput key="lCentro" label={"Larghezza CENTRO (luce netta)"} field="lCentro"
                  value={m["lCentro"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "lCentro", val)} />}
              {<VanoBInput key="lBasso" label={"Larghezza BASSO"} field="lBasso"
                  value={m["lBasso"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "lBasso", val)} />}

              {/* ALTEZZE */}
              <div style={{ fontSize: 11, fontWeight: 800, color: "#1A9E73", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, marginTop: 16, display: "flex", alignItems: "center", gap: 6, borderTop: `1px solid ${T.bdr}`, paddingTop: 16 }}><I d={ICO.ruler} /> Altezze</div>
              {<VanoBInput key="hSx" label={"Altezza SINISTRA"} field="hSx"
                  value={m["hSx"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "hSx", val)} />}
              {m.hSx > 0 && !m.hCentro && !m.hDx && (
                <div onClick={() => { updateMisura(v.id, "hCentro", m.hSx); updateMisura(v.id, "hDx", m.hSx); }} style={{ margin: "-4px 0 12px", padding: "10px", borderRadius: 10, background: T.accLt, border: `1px solid ${T.acc}40`, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.acc }}>
                  = Tutte uguali ({m.hSx} mm)
                </div>
              )}
              {<VanoBInput key="hCentro" label={"Altezza CENTRO"} field="hCentro"
                  value={m["hCentro"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "hCentro", val)} />}
              {<VanoBInput key="hDx" label={"Altezza DESTRA"} field="hDx"
                  value={m["hDx"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "hDx", val)} />}

              {/* DIAGONALI — collassabile */}
              <div onClick={() => setDetailOpen(d => ({...d, diagonali: !d.diagonali}))}
                style={{ marginTop: 16, borderTop: `1px solid ${T.bdr}`, paddingTop: 14,
                  paddingBottom: 10, cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#E8A020",
                    textTransform: "uppercase", letterSpacing: "0.08em" }}>Diagonali</span>
                  {(m.d1 > 0 || m.d2 > 0) && (
                    <span style={{ fontSize: 10, color: "#E8A020", fontWeight: 700,
                      background: "#E8A02015", padding: "2px 8px", borderRadius: 6 }}>
                      {[m.d1, m.d2].filter(x => x > 0).length}/2
                      {fSq !== null && fSq > 3 && " ⚠"}
                      {fSq !== null && fSq <= 3 && " ✓"}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 13, color: T.sub,
                  transform: detailOpen.diagonali ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.diagonali && (
                <div style={{ marginBottom: 8 }}>
                  {<VanoBInput key="d1" label={"Diagonale 1 ↗"} field="d1"
                      value={m["d1"] as number} stepColor={step.color}
                      textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                      onUpdate={(val: number) => updateMisura(v.id, "d1", val)} />}
                  {<VanoBInput key="d2" label={"Diagonale 2 ↘"} field="d2"
                      value={m["d2"] as number} stepColor={step.color}
                      textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                      onUpdate={(val: number) => updateMisura(v.id, "d2", val)} />}
                  {fSq !== null && fSq > 3 && (
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: "#ffebee", border: "1px solid #ef9a9a", marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#c62828" }}><I d={ICO.alertTriangle} /> Fuori squadra: {fSq}mm</div>
                      <div style={{ fontSize: 11, color: "#b71c1c" }}>Differenza superiore a 3mm — segnalare in ufficio</div>
                    </div>
                  )}
                  {fSq !== null && fSq <= 3 && (
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#2e7d32" }}>In squadra — differenza: {fSq}mm</div>
                    </div>
                  )}
                </div>
              )}
            </>)}

              {/* ═══ SPALLETTE + DAVANZALE ═══ */}
              <div style={{marginTop:16,borderTop:`1px solid ${T.bdr}`,paddingTop:16,marginBottom:4}}>
                <div style={{fontSize:10,fontWeight:800,color:T.sub,textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>Spallette e Davanzale</div>
              </div>
              {/* Spallette */}
              <div onClick={() => setDetailOpen(d => ({...d, spallette: !d.spallette}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.spallette ? "#32ade6" : T.bdr}`, background: detailOpen.spallette ? "#32ade608" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}><I d={ICO.layers} /></span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.spallette ? "#32ade6" : T.text }}>Spallette</span>
                  {(m.spSx||m.spDx||m.spSopra||m.imbotte) && <span style={{ fontSize: 10, color: "#32ade6", fontWeight: 700, background: "#32ade615", padding: "2px 8px", borderRadius: 6 }}>{[m.spSx,m.spDx,m.spSopra,m.imbotte].filter(x=>x>0).length}/4</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.spallette ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.spallette && (
                <div style={{ marginBottom: 12 }}>

                {/* ── SCHIZZO SPALLETTE — collassabile ── */}
                <div style={{borderRadius:12,border:'1px solid #32ade640',
                  background:'#32ade605',overflow:'hidden',marginBottom:12,
                  ...(spSchizzoFull?{position:'fixed',inset:0,zIndex:4000,borderRadius:0,margin:0}:{})}}>
                  {/* Riga titolo — sempre visibile, tap per aprire/chiudere */}
                  <div onClick={()=>setSpSchizzoOpen(o=>!o)}
                    style={{display:'flex',alignItems:'center',gap:6,
                      padding:'8px 12px',background:'#fff',cursor:'pointer',
                      borderBottom: spSchizzoOpen ? '1px solid #32ade620' : 'none'}}>
                    <span style={{fontSize:11,fontWeight:800,color:'#32ade6'}}>✏️ Schizzo spallette</span>
                    <span style={{fontSize:9,color:'#32ade6',opacity:0.7,marginLeft:'auto'}}>
                      {spSchizzoOpen?'▲':'▼'}
                    </span>
                  </div>
                  {/* Toolbar strumenti — solo se aperto */}
                  {spSchizzoOpen && (
                  <div style={{display:'flex',alignItems:'center',gap:5,
                    padding:'6px 10px',borderBottom:'1px solid #32ade620',
                    background:'#FAFAFA',flexWrap:'wrap'}}>
                    {([['pen','✒️'],['eraser','⬜']] as const).map(([t,icon])=>(
                      <div key={t} onClick={()=>setSpTool(t)}
                        style={{padding:'3px 7px',borderRadius:7,cursor:'pointer',fontSize:11,
                          border:`1.5px solid ${spTool===t?'#32ade6':'#E2E8F0'}`,
                          background:spTool===t?'#32ade6':'#fff',
                          color:spTool===t?'#fff':'#64748B',fontWeight:700}}>{icon}</div>
                    ))}
                    {([1.5,3,5] as const).map((s:number)=>(
                      <div key={s} onClick={()=>setSpSize(s)}
                        style={{width:24,height:24,borderRadius:6,cursor:'pointer',
                          border:`1.5px solid ${spSize===s?'#32ade6':'#E2E8F0'}`,
                          background:spSize===s?'#32ade615':'#fff',
                          display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <div style={{width:s*2,height:s*2,borderRadius:'50%',
                          background:spSize===s?'#32ade6':'#94A3B8'}}/>
                      </div>
                    ))}
                    {['#1A2B4A','#DC4444','#1A9E73','#D08008','#3B7FE0'].map(c=>(
                      <div key={c} onClick={()=>{setSpColor(c);setSpTool('pen');}}
                        style={{width:18,height:18,borderRadius:'50%',background:c,cursor:'pointer',
                          border:spColor===c&&spTool==='pen'?'2.5px solid #fff':'2px solid transparent',
                          boxShadow:spColor===c&&spTool==='pen'?`0 0 0 2px ${c}`:'none',flexShrink:0}}/>
                    ))}
                    <div onClick={()=>{const cv=spCanvasRef.current;const ctx=cv?.getContext('2d');if(ctx&&cv)ctx.clearRect(0,0,cv.width,cv.height);}}
                      style={{padding:'3px 7px',borderRadius:7,background:'#FEE2E2',
                        color:'#DC4444',fontSize:10,fontWeight:700,cursor:'pointer',
                        border:'1px solid #FCA5A5'}}>✕</div>
                    <div onClick={()=>setSpSchizzoFull(f=>!f)}
                      style={{padding:'3px 7px',borderRadius:7,fontSize:11,cursor:'pointer',
                        border:'1px solid #E2E8F0',background:'#fff',color:'#64748B',marginLeft:'auto'}}>
                      {spSchizzoFull?'⊡':'⊞'}
                    </div>
                  </div>
                  )}
                  {spSchizzoOpen && <canvas ref={spCanvasRef} width={800} height={340}
                    style={{width:'100%',height:200,display:'block',
                      background:'#FAFAFA',
                      cursor:spTool==='eraser'?'cell':'crosshair',touchAction:'none'}}
                    onPointerDown={e=>{
                      const cv=spCanvasRef.current;if(!cv)return;
                      cv.setPointerCapture(e.pointerId);setSpDrawing(true);
                      const r=cv.getBoundingClientRect();
                      const sx=cv.width/r.width,sy=cv.height/r.height;
                      const ctx=cv.getContext('2d');
                      if(ctx){
                        ctx.beginPath();ctx.moveTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);
                        if(spTool==='eraser'){ctx.globalCompositeOperation='destination-out';ctx.lineWidth=spSize*5;}
                        else{ctx.globalCompositeOperation='source-over';ctx.strokeStyle=spColor;ctx.lineWidth=spSize;}
                        ctx.lineCap='round';ctx.lineJoin='round';
                      }
                    }}
                    onPointerMove={e=>{
                      if(!spDrawing)return;
                      const cv=spCanvasRef.current;const ctx=cv?.getContext('2d');
                      if(ctx&&cv){const r=cv.getBoundingClientRect();
                        const sx=cv.width/r.width,sy=cv.height/r.height;
                        ctx.lineTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.stroke();}
                    }}
                    onPointerUp={()=>setSpDrawing(false)}
                    onPointerLeave={()=>setSpDrawing(false)}
                  />}
                </div>

              {<VanoBInput key="spSx" label={"Spalletta SINISTRA"} field="spSx"
                  value={m["spSx"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "spSx", val)} />}
              {<VanoBInput key="spDx" label={"Spalletta DESTRA"} field="spDx"
                  value={m["spDx"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "spDx", val)} />}
              {<VanoBInput key="spSopra" label={"Spalletta SOPRA"} field="spSopra"
                  value={m["spSopra"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "spSopra", val)} />}
              {<VanoBInput key="imbotte" label={"Profondità IMBOTTE"} field="imbotte"
                  value={m["imbotte"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "imbotte", val)} />}

              {/* ── LAMIERE SPALLETTE ── identico al sistema lamiere principale */}
              {(() => {
                const lamSpList: any[] = (v.lamiereSpallette as any) || [];
                const addLamieraSp = () => {
                  const newL = {id: Date.now().toString(), nome: "Lamiera Sp."+(lamSpList.length+1), pieghe:[], latoBuono:"esterno", latoInfisso:"", lunghezza:""};
                  const updated = [...lamSpList, newL];
                  updateVanoField(v.id, "lamiereSpallette", updated);
                  setLamieraPieghe([]);
                  setLamieraLatoBuono("esterno");
                  setLamieraLatoInfisso("");
                  setLamieraLunghezza("");
                  setLamieraEditIdx(updated.length - 1);
                  lamieraZoom.current=1; lamieraPan.current={x:0,y:0};
                  // Salva su lamiereSpallette al posto di lamiere
                  (window as any).__mastroLamieraTarget = 'lamiereSpallette';
                  setShowLamieraDisegno(true);
                };
                const PVFW=300, PVFH=200;
                return (
                  <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
                    <div style={{fontSize:10,fontWeight:800,color:"#32ade6",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:2}}>
                      Lamiere spallette
                    </div>
                    {lamSpList.map((lam: any, li: number) => {
                      const svilTot = (lam.pieghe||[]).reduce((a:number,s:any)=>a+s.mm,0);
                      let preNodes:{x:number,y:number}[] = [];
                      let svgVW=PVFW, svgVH=PVFH;
                      if((lam.pieghe||[]).length > 0){
                        let rx=0, ry=0;
                        const raw:number[][] = [[0,0]];
                        (lam.pieghe||[]).forEach((s:any)=>{
                          const ang = s.angolo != null ? s.angolo : 90;
                          let baseAngle = 0;
                          if(s.dir==='su')  baseAngle = Math.PI/2;
                          if(s.dir==='sx')  baseAngle = Math.PI;
                          if(s.dir==='giu') baseAngle = 3*Math.PI/2;
                          const devRad = (ang - 90) * Math.PI / 180;
                          const finalAngle = baseAngle - devRad;
                          rx += s.mm * Math.cos(finalAngle);
                          ry -= s.mm * Math.sin(finalAngle);
                          raw.push([rx,ry]);
                        });
                        const xs=raw.map(n=>n[0]), ys=raw.map(n=>n[1]);
                        const minX=Math.min(...xs), maxX=Math.max(...xs);
                        const minY=Math.min(...ys), maxY=Math.max(...ys);
                        const rX=Math.max(maxX-minX,1), rY=Math.max(maxY-minY,1);
                        const PAD=28;
                        const sc=Math.min((PVFW-PAD*2)/rX,(PVFH-PAD*2)/rY);
                        const ox=PAD + ((PVFW-PAD*2) - rX*sc)/2 - minX*sc;
                        const oy=PAD + ((PVFH-PAD*2) - rY*sc)/2 - minY*sc;
                        preNodes=raw.map(([x,y])=>({
                          x:+((ox+x*sc).toFixed(1)),
                          y:+((oy+y*sc).toFixed(1))
                        }));
                      }
                      const prePts = preNodes.map(n=>`${n.x},${n.y}`).join(' ');
                      return (
                        <div key={lam.id} style={{borderRadius:10,background:"#32ade60A",border:"1px solid #32ade625",overflow:"hidden"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderBottom:"1px solid #32ade615"}}>
                            <input value={lam.nome} onChange={e=>{
                              const upd=[...lamSpList]; upd[li]={...upd[li],nome:e.target.value}; updateVanoField(v.id, "lamiereSpallette",upd);
                            }} style={{flex:1,fontSize:12,fontWeight:700,border:"none",background:"transparent",color:"#32ade6",outline:"none"}}/>
                            <div style={{fontSize:10,color:"#32ade680",fontWeight:600}}>{svilTot>0?svilTot+"mm":""}</div>
                            <div onClick={e=>{e.stopPropagation();
                              setLamieraPieghe(lam.pieghe||[]);
                              setLamieraLatoBuono(lam.latoBuono||"esterno");
                              setLamieraLatoInfisso(lam.latoInfisso||"");
                              setLamieraLunghezza(lam.lunghezza||"");
                              setLamieraEditIdx(li);
                              lamieraZoom.current=1; lamieraPan.current={x:0,y:0};
                              (window as any).__mastroLamieraTarget = 'lamiereSpallette';
                              setShowLamieraDisegno(true);
                            }} style={{padding:"5px 10px",borderRadius:6,background:"#32ade6",color:"#fff",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                              ✏️ Modifica
                            </div>
                            <div onClick={e=>{e.stopPropagation();
                              updateVanoField(v.id, "lamiereSpallette",lamSpList.filter((_:any,i:number)=>i!==li));
                            }} style={{padding:"5px 8px",borderRadius:6,background:"#DC444415",color:"#DC4444",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                              ✕
                            </div>
                          </div>
                          {preNodes.length > 1 ? (
                            <svg viewBox={`0 0 ${svgVW} ${svgVH}`} width="100%"
                              style={{display:"block",background:"#F0F9FF",cursor:"pointer",borderRadius:"0 0 8px 8px"}}
                              onClick={e=>{e.stopPropagation();
                                setLamieraPieghe(lam.pieghe||[]);
                                setLamieraLatoBuono(lam.latoBuono||"esterno");
                                setLamieraLatoInfisso(lam.latoInfisso||"");
                                setLamieraLunghezza(lam.lunghezza||"");
                                setLamieraEditIdx(li);
                                lamieraZoom.current=1; lamieraPan.current={x:0,y:0};
                                (window as any).__mastroLamieraTarget = 'lamiereSpallette';
                                setShowLamieraDisegno(true);
                              }}>
                              {Array.from({length:13}).map((_,gi)=>(
                                <line key={"gx"+gi} x1={gi*25} y1="0" x2={gi*25} y2={PVFH} stroke="#E0EFFE" strokeWidth="0.4"/>
                              ))}
                              {Array.from({length:9}).map((_,gi)=>(
                                <line key={"gy"+gi} x1="0" y1={gi*25} x2={PVFW} y2={gi*25} stroke="#E0EFFE" strokeWidth="0.4"/>
                              ))}
                              <polyline points={prePts} fill="none" stroke="#32ade6" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round"/>
                              {(() => {
                                const fz = 7.5;
                                const lhalf = fz * 0.65;
                                return (lam.pieghe||[]).map((s:any, si:number) => {
                                  if(si >= preNodes.length-1) return null;
                                  const n1=preNodes[si] as {x:number,y:number};
                                  const n2=preNodes[si+1] as {x:number,y:number};
                                  const mx=(n1.x+n2.x)/2, my=(n1.y+n2.y)/2;
                                  const isH=Math.abs(n2.x-n1.x)>=Math.abs(n2.y-n1.y);
                                  const side = si % 2 === 0 ? -1 : 1;
                                  const offset = fz * 1.6;
                                  const lx = isH ? mx : mx + side*offset;
                                  const ly = isH ? my + side*offset : my;
                                  const dev = (s.angolo!=null && s.angolo!==90) ? Math.abs(s.angolo-90) : 0;
                                  const lbl = dev > 0 ? `${s.mm} ${s.angolo<90?'+':'−'}${dev}°` : String(s.mm);
                                  const tw = lbl.length * fz * 0.62 + 5;
                                  const th = fz + 4;
                                  const clx = Math.max(tw/2+1, Math.min(svgVW-tw/2-1, lx));
                                  const cly = Math.max(th/2+1, Math.min(svgVH-th/2-1, ly));
                                  return (
                                    <g key={"q"+si}>
                                      <rect x={clx-tw/2} y={cly-th/2} width={tw} height={th} rx="2" fill="rgba(3,22,49,0.85)"/>
                                      <text x={clx} y={cly+lhalf} textAnchor="middle" fontSize={fz} fill="#fff" fontWeight="700">{lbl}</text>
                                    </g>
                                  );
                                });
                              })()}
                              {(() => {
                                const nr = 4;
                                return preNodes.map((n:{x:number,y:number},i:number)=>(
                                  <circle key={i} cx={n.x} cy={n.y}
                                    r={i===0||i===preNodes.length-1?nr:nr*0.55}
                                    fill={i===0?"#031631":i===preNodes.length-1?"#dc4444":"#fff"}
                                    stroke="#32ade6" strokeWidth={nr*0.45}/>
                                ));
                              })()}
                              {(() => {
                                const bfz = 7;
                                const bw = bfz*4.5, bh = bfz*1.8;
                                const isEst = lam.latoBuono==='esterno';
                                return (<>
                                  <rect x="3" y="3" width={bw} height={bh} rx="2" fill={isEst?"#3B7FE0":"#D08008"}/>
                                  <text x={3+bw/2} y={3+bh*0.72} textAnchor="middle" fontSize={bfz} fill="#fff" fontWeight="700">
                                    {isEst?'EST':'INT'}
                                  </text>
                                  {lam.latoInfisso && <>
                                    <rect x={3+bw+3} y="3" width={bfz*6} height={bh} rx="2" fill="#32ade6"/>
                                    <text x={3+bw+3+bfz*3} y={3+bh*0.72} textAnchor="middle" fontSize={bfz} fill="#fff" fontWeight="700">
                                      {lam.latoInfisso==='alto'?'^ ALTO':lam.latoInfisso==='basso'?'v BASSO':lam.latoInfisso==='sx'?'< SX':'> DX'}
                                    </text>
                                  </>}
                                  {svilTot>0 && <>
                                    <rect x={svgVW-bfz*7.5-2} y={svgVH-bh-3} width={bfz*7.5} height={bh} rx="2" fill="rgba(50,173,230,0.12)"/>
                                    <text x={svgVW-bfz*3.75-2} y={svgVH-3-bh*0.28} textAnchor="middle" fontSize={bfz} fill="#32ade6" fontWeight="800">
                                      {svilTot}mm
                                    </text>
                                  </>}
                                </>);
                              })()}
                            </svg>
                          ) : (
                            <div onClick={e=>{e.stopPropagation();
                              setLamieraPieghe(lam.pieghe||[]);
                              setLamieraLatoBuono(lam.latoBuono||"esterno");
                              setLamieraLatoInfisso(lam.latoInfisso||"");
                              setLamieraLunghezza(lam.lunghezza||"");
                              setLamieraEditIdx(li);
                              lamieraZoom.current=1; lamieraPan.current={x:0,y:0};
                              (window as any).__mastroLamieraTarget = 'lamiereSpallette';
                              setShowLamieraDisegno(true);
                            }} style={{padding:"14px",textAlign:"center",fontSize:11,color:"#32ade6",
                              fontWeight:600,cursor:"pointer",background:"#F0F9FF",borderRadius:"0 0 8px 8px"}}>
                              ✏️ Tocca per disegnare le pieghe
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div onClick={addLamieraSp} style={{padding:"10px",borderRadius:10,border:"1.5px dashed #32ade650",
                      background:"#F0F9FF",textAlign:"center",cursor:"pointer",
                      display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <div style={{width:20,height:20,borderRadius:"50%",background:"#32ade6",color:"#fff",
                        display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900}}>+</div>
                      <div style={{fontSize:12,fontWeight:700,color:"#32ade6"}}>Aggiungi lamiera spallette</div>
                    </div>
                  </div>
                );
              })()}
                </div>
              )}
              {/* Davanzale + Cassonetto */}
              <div onClick={() => setDetailOpen(d => ({...d, davanzale: !d.davanzale}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.davanzale ? "#EF4444" : T.bdr}`, background: detailOpen.davanzale ? "#EF444408" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⬇</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.davanzale ? "#EF4444" : T.text }}>Davanzale + Cassonetto</span>
                  {(m.davProf||m.davSporg||m.soglia||v.cassonetto) && <span style={{ fontSize: 10, color: "#EF4444", fontWeight: 700, background: "#EF444415", padding: "2px 8px", borderRadius: 6 }}>{v.cassonetto ? "" : ""} {[m.davProf,m.davSporg,m.soglia].filter(x=>x>0).length}/3</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.davanzale ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.davanzale && (
                <div style={{ marginBottom: 12 }}>
              {<VanoBInput key="davProf" label={"Davanzale PROFONDITÀ"} field="davProf"
                  value={m["davProf"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "davProf", val)} />}
              {<VanoBInput key="davSporg" label={"Davanzale SPORGENZA"} field="davSporg"
                  value={m["davSporg"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "davSporg", val)} />}
              {<VanoBInput key="soglia" label={"Altezza SOGLIA"} field="soglia"
                  value={m["soglia"] as number} stepColor={step.color}
                  textColor={T.text} subColor={T.sub} bdrColor={T.bdr} cardBg={T.card}
                  onUpdate={(val: number) => updateMisura(v.id, "soglia", val)} />}
              {/* Cassonetto toggle */}
              <div style={{ marginTop: 8, padding: "12px 16px", borderRadius: 12, border: `1px dashed ${T.bdr}`, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => {
                const nv = { ...v, cassonetto: !v.cassonetto };
                setSelectedVano(nv);
                if(selectedRilievo){const updR3={...selectedRilievo,vani:selectedRilievo.vani.map(x=>x.id===v.id?nv:x)};setCantieri(cs=>cs.map(c=>c.id===selectedCM?.id?{...c,rilievi:c.rilievi.map(r2=>r2.id===selectedRilievo.id?updR3:r2)}:c));setSelectedRilievo(updR3);}
              }}>
                <span style={{ fontSize: 12, color: T.sub }}>+</span>
                <span style={{ fontSize: 14 }}><I d={ICO.box} /></span>
                <span style={{ fontSize: 13, color: T.sub }}>{v.cassonetto ? "Cassonetto attivo" : "Ha un cassonetto? Tocca per aggiungere"}</span>
              </div>
              {v.cassonetto && (
                <div style={{ marginTop: 8 }}>
                  {/* ── DISEGNATORE CASSONETTO ── */}
                  {(() => {
                    // Valori correnti dai campi (mm), default se 0
                    const cL = m.casL || 300;
                    const cH = m.casH || 200;
                    const cP = m.casP || 250;
                    const cLC = m.casLCiel || Math.round(cL * 0.6);
                    const cPC = m.casPCiel || Math.round(cP * 0.5);

                    // SVG: vista sezione laterale (H x P)
                    // Asse X = Profondità, Asse Y = Altezza
                    const SVG_W = 280, SVG_H = 200;
                    const PAD = 32;
                    const scX = (SVG_W - PAD*2) / Math.max(cP, cPC + 20);
                    const scY = (SVG_H - PAD*2) / Math.max(cH, 50);
                    const sc = Math.min(scX, scY, 0.8);

                    // Cassonetto esterno (sezione: Profondità x Altezza)
                    const cx0 = PAD, cy0 = PAD;
                    const cw = cP * sc, ch = cH * sc;
                    // Cielino (interno, in basso a sx)
                    const clw = cPC * sc, clh = Math.max(cLC * sc * 0.3, 8);

                    const handleUpdate = (field: string, val: number) => {
                      updateMisura(v.id, field, Math.max(10, Math.round(val)));
                    };

                    return (
                      <div style={{background:'#F0F9FF',borderRadius:12,border:'1px solid #3B7FE030',
                        marginBottom:12,overflow:'hidden'}}>
                        {/* Header */}
                        <div style={{padding:'8px 12px',borderBottom:'1px solid #3B7FE020',
                          display:'flex',alignItems:'center',justifyContent:'space-between',background:'#fff'}}>
                          <span style={{fontSize:11,fontWeight:800,color:'#3B7FE0'}}>
                            Sezione cassonetto
                          </span>
                          <div style={{display:'flex',gap:6,alignItems:'center'}}>
                            <span style={{fontSize:9,color:'#94A3B8'}}>trascina handle</span>
                            <div onClick={()=>setShowCassonettoEditor(true)}
                              style={{padding:'4px 10px',borderRadius:7,background:'#1A2B4A',
                                color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer'}}>
                              ⛶ Sezione
                            </div>
                            <div onClick={()=>setShowBoxEditor(true)}
                              style={{padding:'4px 10px',borderRadius:7,background:'#D08008',
                                color:'#fff',fontSize:10,fontWeight:700,cursor:'pointer'}}>
                              ⬡ 3D
                            </div>
                          </div>
                        </div>

                        {/* SVG sezione cassonetto — vista frontale dall'interno */}
                        {(() => {
                          // Coordinate nel viewBox
                          const SW=280, SH=210, PD=36;
                          // Scala uniforme basata su Profondità (asse X) e Altezza (asse Y)
                          const maxW = Math.max(cP, 100);
                          const maxH = Math.max(cH, 80);
                          const scW = (SW-PD*2) / maxW;
                          const scH = (SH-PD*2-20) / maxH; // 20px feritoia
                          const sc2 = Math.min(scW, scH, 1.0);
                          // Box cassonetto: origine in basso-sx
                          const bx = PD, by = SH - PD - 20; // 20=feritoia
                          const bw2 = cP * sc2;
                          const bh2 = cH * sc2;
                          // Parete sx (muro)
                          const wx = bx - 8;
                          // Feritoia (in basso, apertura tapparella)
                          const ferH = 14;
                          // Rullo (cerchio interno in alto al centro)
                          const rulloR = Math.min(bw2*0.28, bh2*0.35, 28);
                          const rulloCx = bx + bw2/2;
                          const rulloCy = by - bh2 + rulloR + 6;
                          // Cielino (pannello apribile in basso, lato interno)
                          const cielW = Math.min(cLC || (cP*0.5), cP) * sc2;
                          const cielH = Math.min(Math.max((m.casLCiel||50)*sc2*0.15, 8), 18);
                          // Asse Y: SVG crescente verso il basso, box va da by-bh2 a by

                          return (
                          <svg width="100%" viewBox={`0 0 ${SW} ${SH}`}
                            style={{display:'block',cursor:'default',userSelect:'none',background:'#F0F9FF'}}
                            onPointerMove={e=>{
                              const svgEl=e.currentTarget;
                              const rect=svgEl.getBoundingClientRect();
                              const mx=(e.clientX-rect.left)*(SW/rect.width);
                              const my=(e.clientY-rect.top)*(SH/rect.height);
                              const drag=(svgEl as any).__casDrag2;
                              if(!drag) return;
                              if(drag==='P') handleUpdate('casP', Math.max(80,(mx-bx)/sc2));
                              if(drag==='H') handleUpdate('casH', Math.max(80,(by-my)/sc2));
                            }}
                            onPointerUp={e=>{(e.currentTarget as any).__casDrag2=null;e.currentTarget.releasePointerCapture(e.pointerId);}}
                            onPointerLeave={e=>{(e.currentTarget as any).__casDrag2=null;}}>

                            {/* Griglia leggera */}
                            {Array.from({length:8}).map((_,i)=>(
                              <line key={'gx'+i} x1={PD+i*32} y1={PD} x2={PD+i*32} y2={SH-PD} stroke="#DCF0FF" strokeWidth="0.4"/>
                            ))}
                            {Array.from({length:6}).map((_,i)=>(
                              <line key={'gy'+i} x1={PD} y1={PD+i*30} x2={SW-PD} y2={PD+i*30} stroke="#DCF0FF" strokeWidth="0.4"/>
                            ))}

                            {/* Parete/muro (sx) */}
                            <rect x={wx-6} y={by-bh2-4} width={6} height={bh2+ferH+8}
                              fill="#CBD5E1" stroke="#94A3B8" strokeWidth="0.5"/>
                            <text x={wx-3} y={by-bh2/2} textAnchor="middle" fontSize="7"
                              fill="#64748B" transform={`rotate(-90,${wx-3},${by-bh2/2})`}>MURO</text>

                            {/* Corpo cassonetto — pareti */}
                            {/* Parete superiore */}
                            <rect x={bx} y={by-bh2} width={bw2} height={4}
                              fill="#3B7FE040" stroke="#3B7FE0" strokeWidth="1.5"/>
                            {/* Parete sx */}
                            <rect x={bx} y={by-bh2} width={4} height={bh2}
                              fill="#3B7FE040" stroke="#3B7FE0" strokeWidth="1.5"/>
                            {/* Parete dx */}
                            <rect x={bx+bw2-4} y={by-bh2} width={4} height={bh2}
                              fill="#3B7FE040" stroke="#3B7FE0" strokeWidth="1.5"/>
                            {/* Sfondo interno */}
                            <rect x={bx+4} y={by-bh2+4} width={bw2-8} height={bh2-4}
                              fill="#EFF8FF" opacity="0.6"/>

                            {/* Rullo tapparella */}
                            <circle cx={rulloCx} cy={rulloCy} r={rulloR}
                              fill="#DBEAFE" stroke="#3B7FE0" strokeWidth="1.5" strokeDasharray="4,2"/>
                            <circle cx={rulloCx} cy={rulloCy} r={rulloR*0.3}
                              fill="#3B7FE0" opacity="0.4"/>
                            <text x={rulloCx} y={rulloCy+3} textAnchor="middle"
                              fontSize="7" fill="#3B7FE0" fontWeight="700">RULLO</text>

                            {/* Feritoia in basso (uscita tapparella) */}
                            <rect x={bx} y={by} width={bw2} height={ferH}
                              fill="#1A2B4A15" stroke="#3B7FE0" strokeWidth="1.5" strokeDasharray="3,2"/>
                            <text x={bx+bw2/2} y={by+ferH*0.72} textAnchor="middle"
                              fontSize="7" fill="#3B7FE0" fontWeight="700">feritoia</text>

                            {/* Cielino (pannello ispezione — lato basso interno) */}
                            <rect x={bx+4} y={by-cielH-2} width={cielW} height={cielH}
                              fill="#FEF3C7" stroke="#D08008" strokeWidth="1.2" strokeDasharray="3,2" rx="2"/>
                            {cielW > 30 && <text x={bx+4+cielW/2} y={by-2-cielH*0.3} textAnchor="middle"
                              fontSize="7" fill="#D08008" fontWeight="700">cielino</text>}

                            {/* Quote Profondità (basso) */}
                            <line x1={bx} y1={by+ferH+8} x2={bx+bw2} y2={by+ferH+8}
                              stroke="#3B7FE0" strokeWidth="1"/>
                            <line x1={bx} y1={by+ferH+5} x2={bx} y2={by+ferH+11} stroke="#3B7FE0" strokeWidth="1"/>
                            <line x1={bx+bw2} y1={by+ferH+5} x2={bx+bw2} y2={by+ferH+11} stroke="#3B7FE0" strokeWidth="1"/>
                            <text x={bx+bw2/2} y={by+ferH+20} textAnchor="middle"
                              fontSize="9" fill="#3B7FE0" fontWeight="700">{cP}mm</text>

                            {/* Quote Altezza (dx) */}
                            <line x1={bx+bw2+10} y1={by-bh2} x2={bx+bw2+10} y2={by}
                              stroke="#3B7FE0" strokeWidth="1"/>
                            <line x1={bx+bw2+7} y1={by-bh2} x2={bx+bw2+13} y2={by-bh2} stroke="#3B7FE0" strokeWidth="1"/>
                            <line x1={bx+bw2+7} y1={by} x2={bx+bw2+13} y2={by} stroke="#3B7FE0" strokeWidth="1"/>
                            <text x={bx+bw2+22} y={by-bh2/2+4} textAnchor="middle"
                              fontSize="9" fill="#3B7FE0" fontWeight="700"
                              transform={`rotate(90,${bx+bw2+22},${by-bh2/2+4})`}>{cH}mm</text>

                            {/* Handle Profondità (dx centro) */}
                            <circle cx={bx+bw2} cy={by-bh2/2} r="7"
                              fill="#3B7FE0" stroke="#fff" strokeWidth="2"
                              style={{cursor:'ew-resize'}}
                              onPointerDown={e=>{
                                e.stopPropagation();
                                const svg=e.currentTarget.closest('svg') as any;
                                svg.__casDrag2='P';
                                svg.setPointerCapture(e.pointerId);
                              }}/>
                            <text x={bx+bw2} y={by-bh2/2+4} textAnchor="middle"
                              fontSize="9" fill="#fff" fontWeight="800" style={{pointerEvents:'none'}}>↔</text>

                            {/* Handle Altezza (top centro) */}
                            <circle cx={bx+bw2/2} cy={by-bh2} r="7"
                              fill="#3B7FE0" stroke="#fff" strokeWidth="2"
                              style={{cursor:'ns-resize'}}
                              onPointerDown={e=>{
                                e.stopPropagation();
                                const svg=e.currentTarget.closest('svg') as any;
                                svg.__casDrag2='H';
                                svg.setPointerCapture(e.pointerId);
                              }}/>
                            <text x={bx+bw2/2} y={by-bh2+4} textAnchor="middle"
                              fontSize="9" fill="#fff" fontWeight="800" style={{pointerEvents:'none'}}>↕</text>

                            {/* Label sezione */}
                            <text x={SW/2} y={14} textAnchor="middle"
                              fontSize="9" fill="#94A3B8" fontWeight="600">sezione laterale · interno →</text>
                          </svg>
                          );
                        })()}

                        {/* Campi numerici compatti sotto */}
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:6,
                          padding:'8px 10px',background:'#fff',borderTop:'1px solid #3B7FE020'}}>
                          {[
                            {label:'Larghezza',field:'casL',val:m.casL},
                            {label:'Altezza',field:'casH',val:m.casH},
                            {label:'Profondità',field:'casP',val:m.casP},
                            {label:'Ciel. L',field:'casLCiel',val:m.casLCiel},
                            {label:'Ciel. P',field:'casPCiel',val:m.casPCiel},
                          ].map(({label,field,val})=>(
                            <div key={field}>
                              <div style={{fontSize:9,color:'#64748B',fontWeight:700,marginBottom:2}}>{label}</div>
                              <div style={{display:'flex',alignItems:'center',gap:3}}>
                                <input type="number" inputMode="numeric"
                                  value={val||''}
                                  placeholder="mm"
                                  onChange={e=>updateMisura(v.id,field,parseInt(e.target.value)||0)}
                                  style={{width:'100%',padding:'6px 4px',borderRadius:6,border:'1px solid #E2E8F0',
                                    fontSize:13,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                                    textAlign:'center',background:'#F8FAFC',color:'#1A2B4A'}}/>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
                </div>
              )}


          </>
          )}

          {/* === STEP 1: DETTAGLI (accordion) === */}
          {vanoStep === 1 && (
            <>
              {/* Accessori */}
              <div onClick={() => setDetailOpen(d => ({...d, accessori: !d.accessori}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.accessori ? "#af52de" : T.bdr}`, background: detailOpen.accessori ? "#af52de08" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}><I d={ICO.plus} /></span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.accessori ? "#af52de" : T.text }}>Accessori</span>
                  {(v.accessori?.tapparella?.attivo||v.accessori?.persiana?.attivo||v.accessori?.zanzariera?.attivo) && <span style={{ fontSize: 10, color: "#af52de", fontWeight: 700, background: "#af52de15", padding: "2px 8px", borderRadius: 6 }}>{[v.accessori?.tapparella?.attivo,v.accessori?.persiana?.attivo,v.accessori?.zanzariera?.attivo].filter(Boolean).length} attivi</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.accessori ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.accessori && (
                <div style={{ marginBottom: 12 }}>
              {["tapparella", "persiana", "zanzariera", "cassonetto"].map(acc => {
                if (acc === "cassonetto") {
                  const casColor = "#b45309";
                  const focusNext = (ids, cur) => { const i = ids.indexOf(cur); if (i < ids.length - 1) { const el = document.getElementById(ids[i + 1]); if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); } } };
                  const casIds = [`cas-L-${v.id}`, `cas-H-${v.id}`, `cas-P-${v.id}`, `cas-LC-${v.id}`, `cas-PC-${v.id}`];
                  const casInput = (label, field, idx) => (
                    <div key={field} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>{label}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input id={casIds[idx]} style={{ flex: 1, padding: "10px", fontSize: 14, fontFamily: FM, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card }} type="number" inputMode="numeric" enterKeyHint={idx < 4 ? "next" : "done"} placeholder="" value={m[field] || ""} onChange={e => updateMisura(v.id, field, e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); focusNext(casIds, casIds[idx]); } }} />
                        <span style={{ fontSize: 11, color: T.sub, background: T.bg, padding: "6px 8px", borderRadius: 6 }}>mm</span>
                        {idx < 4 && <div onClick={() => focusNext(casIds, casIds[idx])} style={{ padding: "8px 12px", borderRadius: 8, background: casColor, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>→</div>}
                      </div>
                    </div>
                  );
                  return (
                    <div key={acc} style={{ marginBottom: 8, borderRadius: 12, border: `1px ${v.cassonetto ? "solid" : "dashed"} ${v.cassonetto ? casColor + "40" : T.bdr}`, overflow: "hidden", background: T.card }}>
                      {!v.cassonetto ? (
                        <div onClick={() => { const nv = { ...v, cassonetto: true }; setSelectedVano(nv); if(selectedRilievo){const updR3={...selectedRilievo,vani:selectedRilievo.vani.map(x=>x.id===v.id?nv:x)};setCantieri(cs=>cs.map(c=>c.id===selectedCM?.id?{...c,rilievi:c.rilievi.map(r2=>r2.id===selectedRilievo.id?updR3:r2)}:c));setSelectedRilievo(updR3);} }} style={{ padding: "14px 16px", textAlign: "center", cursor: "pointer" }}>
                          <span style={{ fontSize: 12, color: T.sub }}>+ <I d={ICO.box} /> Aggiungi Cassonetto</span>
                        </div>
                      ) : (
                        <>
                          <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.bdr}` }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: casColor }}><I d={ICO.box} /> Cassonetto</span>
                            <div onClick={() => { const nv = { ...v, cassonetto: false }; setSelectedVano(nv); if(selectedRilievo){const updR3={...selectedRilievo,vani:selectedRilievo.vani.map(x=>x.id===v.id?nv:x)};setCantieri(cs=>cs.map(c=>c.id===selectedCM?.id?{...c,rilievi:c.rilievi.map(r2=>r2.id===selectedRilievo.id?updR3:r2)}:c));setSelectedRilievo(updR3);} }} style={{ fontSize: 11, color: T.sub, cursor: "pointer" }}>▲ Chiudi</div>
                          </div>
                          <div style={{ padding: "12px 16px" }}>
                            <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipo Cassonetto</div>
                            <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                              {tipoCassonettoDB.map(tc => (
                                <div key={tc.id} onClick={() => updateVanoField(v.id, "casTipo", tc.code)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.casTipo === tc.code ? casColor : T.bdr}`, background: v.casTipo === tc.code ? casColor + "18" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.casTipo === tc.code ? 700 : 400, color: v.casTipo === tc.code ? casColor : T.text }}>{tc.code}</div>
                              ))}
                            </div>
                            {casInput("Larghezza", "casL", 0)}
                            {casInput("Altezza", "casH", 1)}
                            {casInput("Profondità", "casP", 2)}
                            <div style={{ marginTop: 4, marginBottom: 4, padding: "6px 0", borderTop: `1px dashed ${T.bdr}` }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 2 }}>Cielino</div>
                            </div>
                            {casInput("Larghezza Cielino", "casLCiel", 3)}
                            {casInput("Profondità Cielino", "casPCiel", 4)}
                            <div onClick={() => { const nv = { ...v, cassonetto: false }; setSelectedVano(nv); if(selectedRilievo){const updR3={...selectedRilievo,vani:selectedRilievo.vani.map(x=>x.id===v.id?nv:x)};setCantieri(cs=>cs.map(c=>c.id===selectedCM?.id?{...c,rilievi:c.rilievi.map(r2=>r2.id===selectedRilievo.id?updR3:r2)}:c));setSelectedRilievo(updR3);} }} style={{ marginTop: 10, padding: "8px", borderRadius: 8, border: `1px dashed #ef5350`, textAlign: "center", fontSize: 11, color: "#ef5350", cursor: "pointer" }}>
                              <I d={ICO.trash} /> Rimuovi cassonetto
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }
                const a = v.accessori?.[acc] || { attivo: false };
                const accColors = { tapparella: "#E8A020", persiana: "#0D7C6B", zanzariera: "#EF4444" };
                const accIcons = { tapparella: "⊞", persiana: "", zanzariera: "" };
                const focusNextAcc = (ids, cur) => { const i = ids.indexOf(cur); if (i < ids.length - 1) { const el = document.getElementById(ids[i + 1]); if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); } } };
                const accInputIds = [`${acc}-L-${v.id}`, `${acc}-H-${v.id}`];
                return (
                  <div key={acc} style={{ marginBottom: 8, borderRadius: 12, border: `1px ${a.attivo ? "solid" : "dashed"} ${a.attivo ? accColors[acc] + "40" : T.bdr}`, overflow: "hidden", background: T.card }}>
                    {!a.attivo ? (
                      <div onClick={() => toggleAccessorio(v.id, acc)} style={{ padding: "14px 16px", textAlign: "center", cursor: "pointer" }}>
                        <span style={{ fontSize: 12, color: T.sub }}>+ {accIcons[acc]} Aggiungi {acc.charAt(0).toUpperCase() + acc.slice(1)}</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.bdr}` }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: accColors[acc] }}>{accIcons[acc]} {acc.charAt(0).toUpperCase() + acc.slice(1)}</span>
                          <div onClick={() => toggleAccessorio(v.id, acc)} style={{ fontSize: 11, color: T.sub, cursor: "pointer" }}>▲ Chiudi</div>
                        </div>
                        <div style={{ padding: "12px 16px" }}>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>Larghezza</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input id={accInputIds[0]} style={{ flex: 1, padding: "10px", fontSize: 14, fontFamily: FM, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card }} type="number" inputMode="numeric" enterKeyHint="next" placeholder="" value={v.accessori?.[acc]?.l || ""} onChange={e => updateAccessorio(v.id, acc, "l", parseInt(e.target.value) || 0)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); focusNextAcc(accInputIds, accInputIds[0]); } }} />
                              <span style={{ fontSize: 11, color: T.sub, background: T.bg, padding: "6px 8px", borderRadius: 6 }}>mm</span>
                              <div onClick={() => focusNextAcc(accInputIds, accInputIds[0])} style={{ padding: "8px 12px", borderRadius: 8, background: accColors[acc], color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>→</div>
                            </div>
                          </div>
                          <div style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, color: T.text, marginBottom: 4 }}>Altezza</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <input id={accInputIds[1]} style={{ flex: 1, padding: "10px", fontSize: 14, fontFamily: FM, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card }} type="number" inputMode="numeric" enterKeyHint="done" placeholder="" value={v.accessori?.[acc]?.h || ""} onChange={e => updateAccessorio(v.id, acc, "h", parseInt(e.target.value) || 0)} />
                              <span style={{ fontSize: 11, color: T.sub, background: T.bg, padding: "6px 8px", borderRadius: 6 }}>mm</span>
                            </div>
                          </div>
                          {acc === "tapparella" && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Materiale</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                                {["PVC", "Alluminio", "Acciaio", "Legno"].map(mat => (
                                  <div key={mat} onClick={() => updateAccessorio(v.id, acc, "materiale", mat)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.materiale === mat ? "#E8A020" : T.bdr}`, background: v.accessori?.[acc]?.materiale === mat ? "#E8A02018" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.materiale === mat ? 700 : 400, color: v.accessori?.[acc]?.materiale === mat ? "#E8A020" : T.text }}>{mat}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Motorizzata</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                                {["Sì", "No"].map(mot => (
                                  <div key={mot} onClick={() => updateAccessorio(v.id, acc, "motorizzata", mot)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.motorizzata === mot ? "#1A9E73" : T.bdr}`, background: v.accessori?.[acc]?.motorizzata === mot ? "#1A9E7318" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.motorizzata === mot ? 700 : 400, color: v.accessori?.[acc]?.motorizzata === mot ? "#1A9E73" : T.text }}>{mot}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipo Misura</div>
                              <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF, marginBottom: 10 }} value={v.accessori?.[acc]?.tipoMisura || ""} onChange={e => updateAccessorio(v.id, acc, "tipoMisura", e.target.value)}>
                                <option value="">— Seleziona tipo misura —</option>
                                {tipoMisuraTappDB.map(tm => <option key={tm.id} value={tm.code}>{tm.code}</option>)}
                              </select>
                            </>
                          )}
                          {acc === "persiana" && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipologia Telaio</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                                {telaiPersianaDB.map(tp => (
                                  <div key={tp.id} onClick={() => updateAccessorio(v.id, acc, "telaio", tp.code)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.telaio === tp.code ? "#0D7C6B" : T.bdr}`, background: v.accessori?.[acc]?.telaio === tp.code ? "#0D7C6B18" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.telaio === tp.code ? 700 : 400, color: v.accessori?.[acc]?.telaio === tp.code ? "#0D7C6B" : T.text }}>{tp.code}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>4° Lato / Posizionamento</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                                {posPersianaDB.map(pp => (
                                  <div key={pp.id} onClick={() => updateAccessorio(v.id, acc, "posizionamento", pp.code)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.posizionamento === pp.code ? "#0D7C6B" : T.bdr}`, background: v.accessori?.[acc]?.posizionamento === pp.code ? "#0D7C6B18" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.posizionamento === pp.code ? 700 : 400, color: v.accessori?.[acc]?.posizionamento === pp.code ? "#0D7C6B" : T.text }}>{pp.code}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipo Misura</div>
                              <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF, marginBottom: 10 }} value={v.accessori?.[acc]?.tipoMisura || ""} onChange={e => updateAccessorio(v.id, acc, "tipoMisura", e.target.value)}>
                                <option value="">— Seleziona tipo misura —</option>
                                {tipoMisuraDB.map(tm => <option key={tm.id} value={tm.code}>{tm.code}</option>)}
                              </select>
                            </>
                          )}
                          {acc === "zanzariera" && (
                            <>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipologia</div>
                              <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF, marginBottom: 10 }} value={v.accessori?.[acc]?.categoria || ""} onChange={e => updateAccessorio(v.id, acc, "categoria", e.target.value)}>
                                <option value="">— Seleziona tipologia —</option>
                                {["Avvolgente verticale","Avvolgente laterale","Avvolgente con bottone","Plissettata verticale","Plissettata laterale","ZIP verticale","Incasso controtelaio","Pannello fisso","Battente 1 anta","Battente 2 ante","Scorrevole su binario"].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                              </select>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Tipo Misura</div>
                              <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF, marginBottom: 10 }} value={v.accessori?.[acc]?.tipoMisura || ""} onChange={e => updateAccessorio(v.id, acc, "tipoMisura", e.target.value)}>
                                <option value="">— Seleziona tipo misura —</option>
                                {tipoMisuraZanzDB.map(tm => <option key={tm.id} value={tm.code}>{tm.code}</option>)}
                              </select>
                            </>
                          )}
                          <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Colore</div>
                          <select style={{ width: "100%", padding: "10px", fontSize: 12, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, fontFamily: FF }} value={v.accessori?.[acc]?.colore || ""} onChange={e => updateAccessorio(v.id, acc, "colore", e.target.value)}>
                            <option value="">Colore</option>
                            {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                          </select>
                          <div onClick={() => toggleAccessorio(v.id, acc)} style={{ marginTop: 10, padding: "8px", borderRadius: 8, border: `1px dashed #ef5350`, textAlign: "center", fontSize: 11, color: "#ef5350", cursor: "pointer" }}>
                            <I d={ICO.lock} />‘ Rimuovi {acc}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
                </div>
              )}

              {/* Accessori da Catalogo */}
              <AccessoriCatalogoVano vano={v} updateVanoField={updateVanoField} T={T} />

              {/* Voci Libere */}
              <div onClick={() => setDetailOpen(d => ({...d, vociLibere: !d.vociLibere}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.vociLibere ? "#E8A020" : T.bdr}`, background: detailOpen.vociLibere ? "#E8A02008" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}><I d={ICO.package} /></span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.vociLibere ? "#E8A020" : T.text }}>Voci libere</span>
                  {v.vociLibere?.length > 0 && <span style={{ fontSize: 10, color: "#E8A020", fontWeight: 700, background: "#E8A02015", padding: "2px 8px", borderRadius: 6 }}>{v.vociLibere.length} voc{v.vociLibere.length === 1 ? "e" : "i"}</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.vociLibere ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.vociLibere && (
                <div style={{ marginBottom: 12, padding: "0 4px" }}>
                  {(v.vociLibere || []).map((voce, vi) => (
                    <div key={voce.id || vi} style={{ padding: 10, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#E8A020" }}>Voce {vi + 1}</span>
                        <div onClick={() => {
                          const newVoci = (v.vociLibere || []).filter((_, i) => i !== vi);
                          updateVanoField(v.id, "vociLibere", newVoci);
                        }} style={{ fontSize: 10, color: T.red, cursor: "pointer", fontWeight: 600 }}>Rimuovi</div>
                      </div>
                      {/* Tipo voce */}
                      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                        {[{id:"generico",label:"Generico",color:"#E8A020"},{id:"vetro",label:"Vetro",color:"#3B7FE0"},{id:"coprifilo",label:"Coprifilo",color:"#8B5CF6"}].map(t => (
                          <div key={t.id} onClick={() => {
                            const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], tipo: t.id };
                            updateVanoField(v.id, "vociLibere", newVoci);
                          }} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", background: (voce.tipo||"generico")===t.id ? t.color+"18" : T.bg, color: (voce.tipo||"generico")===t.id ? t.color : T.sub, border: `1px solid ${(voce.tipo||"generico")===t.id ? t.color+"50" : T.bdr}` }}>{t.label}</div>
                        ))}
                      </div>
                      {/* Campi vetro — da catalogo */}
                      {(voce.tipo === "vetro") && (
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Vetro da catalogo</label>
                          <select style={{ ...S.select, fontSize: 12, marginBottom: 6 }} value={voce.vetroCode || ""} onChange={e => {
                            const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], vetroCode: e.target.value };
                            updateVanoField(v.id, "vociLibere", newVoci);
                          }}>
                            <option value="">— Seleziona vetro —</option>
                            {vetriDB.map(g => <option key={g.id} value={g.code}>{g.code}{g.ug ? ` · Ug ${g.ug}` : ""}</option>)}
                          </select>
                          <div style={{ display: "flex", gap: 6 }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Larghezza mm</label>
                              <input style={{ ...S.input, fontSize: 12, fontFamily: FM }} type="number" placeholder="0" defaultValue={voce.larghezza || ""} onBlur={e => {
                                const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], larghezza: parseInt(e.target.value) || 0 };
                                updateVanoField(v.id, "vociLibere", newVoci);
                              }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Altezza mm</label>
                              <input style={{ ...S.input, fontSize: 12, fontFamily: FM }} type="number" placeholder="0" defaultValue={voce.altezza || ""} onBlur={e => {
                                const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], altezza: parseInt(e.target.value) || 0 };
                                updateVanoField(v.id, "vociLibere", newVoci);
                              }} />
                            </div>
                            {voce.larghezza > 0 && voce.altezza > 0 && <div style={{ fontSize: 10, color: "#3B7FE0", fontWeight: 700, alignSelf: "flex-end", paddingBottom: 8 }}>{((voce.larghezza * voce.altezza) / 1000000).toFixed(3)} mq</div>}
                          </div>
                        </div>
                      )}
                      {/* Campi coprifilo — da catalogo */}
                      {(voce.tipo === "coprifilo") && (
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Coprifilo da catalogo</label>
                          <select style={{ ...S.select, fontSize: 12, marginBottom: 6 }} value={voce.coprifiloCode || ""} onChange={e => {
                            const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], coprifiloCode: e.target.value };
                            updateVanoField(v.id, "vociLibere", newVoci);
                          }}>
                            <option value="">— Seleziona coprifilo —</option>
                            {coprifiliDB.map(c => <option key={c.id} value={c.cod}>{c.cod}</option>)}
                          </select>
                          <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Lamiera da catalogo</label>
                          <select style={{ ...S.select, fontSize: 12, marginBottom: 6 }} value={voce.lamieraCode || ""} onChange={e => {
                            const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], lamieraCode: e.target.value };
                            updateVanoField(v.id, "vociLibere", newVoci);
                          }}>
                            <option value="">— Seleziona lamiera —</option>
                            {lamiereDB.map(l => <option key={l.id} value={l.cod}>{l.cod}</option>)}
                          </select>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Lunghezza mm</label>
                            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              <input style={{ ...S.input, fontSize: 12, fontFamily: FM }} type="number" placeholder="0" defaultValue={voce.lunghezza || ""} onBlur={e => {
                                const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], lunghezza: parseInt(e.target.value) || 0 };
                                updateVanoField(v.id, "vociLibere", newVoci);
                              }} />
                              {voce.lunghezza > 0 && <div style={{ fontSize: 10, color: "#8B5CF6", fontWeight: 700, whiteSpace: "nowrap" }}>{(voce.lunghezza / 1000).toFixed(2)} ml</div>}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Foto */}
                      <div style={{ marginBottom: 6 }}>
                        {voce.foto ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <img src={voce.foto} style={{ height: 50, maxWidth: 80, objectFit: "cover", borderRadius: 6, border: `1px solid ${T.bdr}` }} alt="" />
                            <div onClick={() => {
                              const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], foto: undefined };
                              updateVanoField(v.id, "vociLibere", newVoci);
                            }} style={{ fontSize: 9, color: T.red, cursor: "pointer" }}></div>
                          </div>
                        ) : (
                          <label style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "#E8A02012", color: "#E8A020", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                            <I d={ICO.camera} /> Foto
                            <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                              const file = e.target.files?.[0]; if (!file) return;
                              const reader = new FileReader();
                              reader.onload = ev => {
                                const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], foto: ev.target?.result as string };
                                updateVanoField(v.id, "vociLibere", newVoci);
                              };
                              reader.readAsDataURL(file);
                            }} />
                          </label>
                        )}
                      </div>
                      {/* Descrizione */}
                      <input style={{ ...S.input, marginBottom: 6, fontSize: 12 }} placeholder="Descrizione (es. Controtelaio, Davanzale, Soglia...)" defaultValue={voce.descrizione || ""} onBlur={e => {
                        const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], descrizione: e.target.value };
                        updateVanoField(v.id, "vociLibere", newVoci);
                      }} />
                      {/* Prezzo + Unità + Quantità */}
                      <div style={{ display: "flex", gap: 6 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Prezzo €</label>
                          <input style={{ ...S.input, fontSize: 12, fontFamily: FM }} type="number" step="0.01" placeholder="0.00" defaultValue={voce.prezzo || ""} onBlur={e => {
                            const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], prezzo: parseFloat(e.target.value) || 0 };
                            updateVanoField(v.id, "vociLibere", newVoci);
                          }} />
                        </div>
                        <div style={{ width: 80 }}>
                          <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Unità</label>
                          <select style={{ ...S.select, fontSize: 11 }} value={voce.unita || "pz"} onChange={e => {
                            const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], unita: e.target.value };
                            updateVanoField(v.id, "vociLibere", newVoci);
                          }}>
                            <option value="pz">Pezzo</option>
                            <option value="mq">mq</option>
                            <option value="ml">ml</option>
                            <option value="kg">kg</option>
                            <option value="forfait">Forfait</option>
                          </select>
                        </div>
                        <div style={{ width: 60 }}>
                          <label style={{ fontSize: 9, color: T.sub, fontWeight: 700 }}>Qtà</label>
                          <input style={{ ...S.input, fontSize: 12, fontFamily: FM, textAlign: "center" }} type="number" step="0.1" defaultValue={voce.qta || 1} onBlur={e => {
                            const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], qta: parseFloat(e.target.value) || 1 };
                            updateVanoField(v.id, "vociLibere", newVoci);
                          }} />
                        </div>
                      </div>
                      {voce.prezzo > 0 && <div style={{ textAlign: "right", fontSize: 11, fontWeight: 700, color: T.grn, fontFamily: FM, marginTop: 4 }}>= €{((voce.prezzo || 0) * (voce.qta || 1)).toFixed(2)}</div>}
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: 8 }}>
                    <div onClick={() => {
                      const newVoci = [...(v.vociLibere || []), { id: Date.now(), tipo: "generico", descrizione: "", prezzo: 0, unita: "pz", qta: 1 }];
                      updateVanoField(v.id, "vociLibere", newVoci);
                    }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px dashed #E8A020`, textAlign: "center", cursor: "pointer", color: "#E8A020", fontSize: 12, fontWeight: 600 }}>+ Voce vuota</div>
                    <div onClick={() => {
                      const newVoci = [...(v.vociLibere || []), { id: Date.now(), tipo: "vetro", descrizione: "Vetro", prezzo: 0, unita: "mq", qta: 1, larghezza: 0, altezza: 0 }];
                      updateVanoField(v.id, "vociLibere", newVoci);
                    }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px dashed #3B7FE0`, textAlign: "center", cursor: "pointer", color: "#3B7FE0", fontSize: 12, fontWeight: 600 }}>Vetro</div>
                    <div onClick={() => {
                      const newVoci = [...(v.vociLibere || []), { id: Date.now(), tipo: "coprifilo", descrizione: "Coprifilo/Lamiera", prezzo: 0, unita: "ml", qta: 1, lunghezza: 0 }];
                      updateVanoField(v.id, "vociLibere", newVoci);
                    }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px dashed #8B5CF6`, textAlign: "center", cursor: "pointer", color: "#8B5CF6", fontSize: 12, fontWeight: 600 }}>Coprifilo</div>
                    <div onClick={() => {
                      setDetailOpen(d => ({ ...d, showLibreria: !d.showLibreria }));
                    }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}><I d={ICO.package} /> Da libreria</div>
                  </div>
                  {detailOpen.showLibreria && libreriaDB.length > 0 && (
                    <div style={{ marginTop: 8, padding: 8, borderRadius: 10, border: `1px solid ${T.acc}30`, background: T.acc + "06" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.acc, marginBottom: 6, textTransform: "uppercase" }}>Scegli dalla libreria</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {libreriaDB.map(item => (
                          <div key={item.id} onClick={() => {
                            const newVoce = { id: Date.now(), descrizione: item.nome, prezzo: item.prezzo || 0, unita: item.unita || "pz", qta: 1, foto: item.foto || undefined, libreriaId: item.id };
                            const newVoci = [...(v.vociLibere || []), newVoce];
                            updateVanoField(v.id, "vociLibere", newVoci);
                            setDetailOpen(d => ({ ...d, showLibreria: false }));
                          }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, cursor: "pointer" }}>
                            {item.foto ? (
                              <img src={item.foto} style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} alt="" />
                            ) : (
                              <div style={{ width: 32, height: 32, borderRadius: 4, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}><I d={ICO.package} /></div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.nome}</div>
                              <div style={{ fontSize: 9, color: T.sub }}>{item.categoria}</div>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: T.grn, fontFamily: FM, flexShrink: 0 }}>€{item.prezzo}/{item.unita || "pz"}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Foto + Note */}
              <div onClick={() => setDetailOpen(d => ({...d, disegno: !d.disegno}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.disegno ? T.acc : T.bdr}`, background: detailOpen.disegno ? T.acc+"08" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}><I d={ICO.camera} /></span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.disegno ? T.acc : T.text }}>Foto + Note</span>
                  {(v.note) && <span style={{ fontSize: 10, color: T.acc, fontWeight: 700, background: T.acc+"15", padding: "2px 8px", borderRadius: 6 }}><I d={ICO.fileText} /></span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.disegno ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.disegno && (
                <div style={{ marginBottom: 12 }}>
{/* Disegno mano libera — Enhanced: eraser, multi-page, fullscreen */}
              {(() => {
                const W = drawFullscreen ? 760 : 380;
                const H = drawFullscreen ? 680 : 340;
                const savePageData = () => { const cv = canvasRef.current; if (cv) { setDrawPages(prev => { const n = [...prev]; n[drawPageIdx] = cv.toDataURL(); return n; }); } };
                const loadPageData = (idx: number) => { const cv = canvasRef.current; const ctx = cv?.getContext("2d"); if (ctx && cv) { ctx.clearRect(0, 0, cv.width, cv.height); if (drawPages[idx]) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = drawPages[idx]; } } };
                const addPage = () => { savePageData(); setDrawPages(prev => [...prev, ""]); setDrawPageIdx(drawPages.length); setTimeout(() => { const cv = canvasRef.current; const ctx = cv?.getContext("2d"); if (ctx && cv) ctx.clearRect(0, 0, cv.width, cv.height); }, 50); };
                const switchPage = (idx: number) => { if (idx === drawPageIdx) return; savePageData(); setDrawPageIdx(idx); setTimeout(() => loadPageData(idx), 50); };
                const canvasEl = (
                  <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", height: drawFullscreen ? "calc(100vh - 140px)" : 340, background: "#fff", touchAction: "none", cursor: drawTool === "eraser" ? "cell" : "crosshair" }}
                    onPointerDown={e => {
                      canvasRef.current?.setPointerCapture(e.pointerId); setIsDrawing(true);
                      const cv = canvasRef.current; const ctx = cv?.getContext("2d");
                      if (ctx && cv) {
                        const r = cv.getBoundingClientRect(); const sx = cv.width / r.width, sy = cv.height / r.height;
                        ctx.beginPath(); ctx.moveTo((e.clientX - r.left) * sx, (e.clientY - r.top) * sy);
                        if (drawTool === "eraser") { ctx.globalCompositeOperation = "destination-out"; ctx.lineWidth = penSize * 8; }
                        else { ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = penColor; ctx.lineWidth = penSize; }
                        ctx.lineCap = "round"; ctx.lineJoin = "round";
                      }
                    }}
                    onPointerMove={e => {
                      if (!isDrawing) return; const cv = canvasRef.current; const ctx = cv?.getContext("2d");
                      if (ctx && cv) { const r = cv.getBoundingClientRect(); const sx = cv.width / r.width, sy = cv.height / r.height; ctx.lineTo((e.clientX - r.left) * sx, (e.clientY - r.top) * sy); ctx.stroke(); }
                    }}
                    onPointerUp={() => { setIsDrawing(false); const cv = canvasRef.current; const ctx = cv?.getContext("2d"); if (ctx) ctx.globalCompositeOperation = "source-over"; }}
                    onPointerLeave={() => { setIsDrawing(false); const cv = canvasRef.current; const ctx = cv?.getContext("2d"); if (ctx) ctx.globalCompositeOperation = "source-over"; }}
                  />
                );
                const toolbar = (
                  <div style={{ padding: "8px 14px", display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" as const }}>
                    {["#1d1d1f", "#DC4444", "#0D7C6B", "#1A9E73", "#E8A020", "#af52de", "#EF4444", "#ffffff"].map(c => (
                      <div key={c} onClick={() => { setPenColor(c); setDrawTool("pen"); }} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: penColor === c && drawTool === "pen" ? `3px solid ${T.acc}` : c === "#ffffff" ? `1px solid ${T.bdr}` : "2px solid transparent", cursor: "pointer" }} />
                    ))}
                    <div style={{ width: 1, height: 20, background: T.bdr, margin: "0 4px" }} />
                    {/* Gomma */}
                    <div onClick={() => setDrawTool(drawTool === "eraser" ? "pen" : "eraser")}
                      style={{ width: 32, height: 32, borderRadius: 8, background: drawTool === "eraser" ? "#DC4444" + "18" : T.bg, border: drawTool === "eraser" ? "2px solid #DC4444" : `1px solid ${T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <span style={{ fontSize: 14 }}>{drawTool === "eraser" ? "" : ""}</span>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
                      {[1, 2, 4, 6].map(s => (
                        <div key={s} onClick={() => setPenSize(s)} style={{ width: 24, height: 24, borderRadius: 6, background: penSize === s ? T.accLt : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <div style={{ width: s * 2 + 1, height: s * 2 + 1, borderRadius: "50%", background: drawTool === "eraser" ? "#DC4444" : T.text }} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
                const pageStrip = (
                  <div style={{ padding: "6px 14px", borderTop: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" as const }}>Fogli:</span>
                    {drawPages.map((_: string, i: number) => (
                      <div key={i} onClick={() => switchPage(i)}
                        style={{ minWidth: drawPageIdx === i ? 22 : 8, height: 8, borderRadius: 4, background: drawPageIdx === i ? T.acc : T.bdr, cursor: "pointer", transition: "all 0.15s", position: "relative" as const }}>
                        {drawPageIdx === i && <span style={{ position: "absolute" as const, top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 8, fontWeight: 700, color: T.acc }}>{i + 1}</span>}
                      </div>
                    ))}
                    <div onClick={addPage} style={{ width: 22, height: 22, borderRadius: "50%", background: T.bg, border: `1.5px dashed ${T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: T.sub, cursor: "pointer", fontWeight: 700 }}>+</div>
                    <span style={{ fontSize: 9, color: T.sub }}>{drawPageIdx + 1}/{drawPages.length}</span>
                    <div style={{ marginLeft: "auto" }} />
                    <div onClick={() => { savePageData(); setDrawFullscreen(!drawFullscreen); }}
                      style={{ padding: "3px 8px", borderRadius: 6, background: drawFullscreen ? T.acc + "12" : T.bg, border: `1px solid ${drawFullscreen ? T.acc : T.bdr}`, fontSize: 10, fontWeight: 700, color: drawFullscreen ? T.acc : T.sub, cursor: "pointer" }}>
                      {drawFullscreen ? "↙ Riduci" : "↗ Ingrandisci"}
                    </div>
                  </div>
                );

                if (drawFullscreen) return (
                  <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#fff", display: "flex", flexDirection: "column" as const }}>
                    <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.acc }}><I d={ICO.edit} /> Disegno — Foglio {drawPageIdx + 1}/{drawPages.length}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { const ctx = canvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, W, H); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}><I d={ICO.trash} /> Pulisci foglio</button>
                        <button style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#DC4444", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}><I d={ICO.save} /> Salva</button>
                        <button onClick={() => { savePageData(); setDrawFullscreen(false); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>Chiudi</button>
                      </div>
                    </div>
                    <div style={{ flex: 1, overflow: "hidden", position: "relative" }}
                      ref={el => { if(el && drawFullscreen) { setTimeout(() => loadPageData(drawPageIdx), 50); } }}>
                      {canvasEl}
                    </div>
                    {toolbar}
                    {pageStrip}
                  </div>
                );

                return (
                  <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: T.acc }}><I d={ICO.edit} /> Disegno a mano libera</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { const ctx = canvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, W, H); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}><I d={ICO.trash} /> Pulisci foglio</button>
                        <button style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#DC4444", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}><I d={ICO.save} /> Salva</button>
                      </div>
                    </div>
                    {canvasEl}
                    {toolbar}
                    {pageStrip}
                  </div>
                );
              })()}
              {/* Foto */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 14, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.blue }}><I d={ICO.camera} /> FOTO ({(v.foto && Object.keys(v.foto).length) || 0})</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setShowFotoMisure(true)} style={{ padding: "4px 10px", borderRadius: 6, background: T.acc+"15", color: T.acc, border: `1px solid ${T.acc}40`, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>Misure</button>
                    <button onClick={() => setShowFotoMisure(true)} style={{ padding: "4px 10px", borderRadius: 6, background: T.acc+"15", color: T.acc, border: `1px solid ${T.acc}40`, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>Misure</button>
                    <button onClick={() => openCamera("foto", null)}
                      style={{ padding: "4px 10px", borderRadius: 6, background: T.acc, color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}><I d={ICO.camera} /> Foto</button>
                    <button onClick={() => openCamera("video", null)}
                      style={{ padding: "4px 10px", borderRadius: 6, background: T.blue, color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}><I d={ICO.clapperboard} /> Video</button>
                  </div>
                </div>
                {/* Hidden file inputs as fallback */}
                <input ref={fotoVanoRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                  onChange={async e => {
                    const cat = pendingFotoCat;
                    const files = Array.from(e.target.files || []);
                    for (const file of files) {
                      const key = "foto_" + Date.now() + "_" + file.name;
                      // Prova upload Supabase, fallback base64
                      const userId = user?.id || "anon";
                      const cmId = selectedCM?.id || "cm";
                      const vanoId = v.id || "vano";
                      const publicUrl = await uploadFotoVano(userId, cmId, vanoId, file, file.name);
                      if (publicUrl) {
                        const fotoObj = { url: publicUrl, dataUrl: null, nome: file.name, tipo: "foto", categoria: cat || null };
                        setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: fotoObj } } : vn) } : r2) } : c));
                        setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: fotoObj } }));
                      } else {
                        // Fallback base64
                        const r = new FileReader();
                        r.onload = async ev => {
                          const compressed = await compressImage(ev.target.result as string);
                          const fotoObj = { url: null, dataUrl: compressed, nome: file.name, tipo: "foto", categoria: cat || null };
                          setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: fotoObj } } : vn) } : r2) } : c));
                          setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: fotoObj } }));
                        };
                        r.readAsDataURL(file);
                      }
                    }
                    setPendingFotoCat(null);
                    e.target.value = "";
                  }}/>
                <input ref={videoVanoRef} type="file" accept="video/*" capture="environment" style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const key = "video_" + Date.now();
                    const reader = new FileReader();
                    reader.onload = ev => {
                      const vObj = { nome: file.name, tipo: "video", dataUrl: ev.target?.result };
                      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: vObj } } : vn) } : r2) } : c));
                      setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: vObj } }));
                    };
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}/>
                <div style={{ fontSize: 10, color: T.sub, marginBottom: 6 }}>{Object.keys(v.foto||{}).length} allegati</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {[
                    { n: "Panoramica", r: true, c: "#DC4444" }, { n: "Spalle muro", r: true, c: "#0D7C6B" }, { n: "Soglia", r: true, c: "#0D7C6B" },
                    { n: "Cassonetto", r: false, c: "#1A9E73" }, { n: "Dettagli critici", r: true, c: "#DC4444" }, { n: "Imbotto", r: false, c: "#1A9E73" },
                    { n: "Contesto", r: false, c: "#1A9E73" }, { n: "Altro", r: false, c: "#1A9E73" },
                  ].map((cat, i) => {
                    const fotoCount = Object.values(v.foto||{}).filter(f=>f.categoria===cat.n).length;
                    return (
                    <div key={i} onClick={()=>{ openCamera("foto", cat.n); }}
                      style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${fotoCount>0 ? "#1A9E73" : cat.r ? cat.c + "40" : T.bdr}`, background: fotoCount>0 ? "#1A9E7315" : cat.r ? cat.c + "08" : "transparent", fontSize: 10, fontWeight: 600, color: fotoCount>0 ? "#1a9e40" : cat.r ? cat.c : T.sub, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, position:"relative" }}>
                      {fotoCount>0 ? <span style={{fontSize:8,background:"#1A9E73",color:"#fff",borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>{fotoCount}</span> : cat.r ? <span style={{ fontSize: 8 }}></span> : null}
                      <span style={{ fontSize: 10 }}><I d={ICO.camera} /></span> {cat.n}
                    </div>
                    );
                  })}
                </div>
                {Object.keys(v.foto||{}).length === 0
                  ? <div style={{ textAlign: "center", padding: "16px 0", color: T.sub, fontSize: 11 }}>Nessun allegato — tocca <I d={ICO.camera} /> Foto o <I d={ICO.clapperboard} /> Video</div>
                  : <>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {Object.entries(v.foto||{}).map(([k, f]) => (
                        <div key={k} onClick={() => { if (f.dataUrl) setViewingPhotoId(viewingPhotoId === k ? null : k as any); }}
                          style={{ position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: T.bg, border: viewingPhotoId === k ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, cursor: f.dataUrl ? "pointer" : "default" }}>
                          {f.tipo === "foto" && f.dataUrl
                            ? <img src={f.url || f.dataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={f.nome}/>
                            : f.tipo === "video" && f.dataUrl
                              ? <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
                                  <span style={{ fontSize: 28, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>▶</span>
                                </div>
                              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
                                  <span style={{ fontSize: 24 }}><I d={ICO.clapperboard} /></span>
                                  <span style={{ fontSize: 8, color: T.sub, textAlign: "center", padding: "0 4px" }}>{f.nome?.slice(0,12)}</span>
                                </div>
                          }
                          {f.categoria && <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:7,fontWeight:700,padding:"2px 3px",textAlign:"center",lineHeight:1.2}}>{f.categoria}</div>}
                          <div onClick={(ev) => {
                            ev.stopPropagation();
                            const newFoto = { ...(v.foto||{}) }; delete newFoto[k];
                            setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: newFoto } : vn) } : r2) } : c));
                            setSelectedVano(prev => ({ ...prev, foto: newFoto }));
                          }} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}></div>
                        </div>
                      ))}
                    </div>
                    {/* Inline viewer for tapped photo/video */}
                    {viewingPhotoId && (v.foto||{})[viewingPhotoId as any] && (
                      <div style={{ marginTop: 8, borderRadius: 12, overflow: "hidden", background: "#000", position: "relative" as const }}>
                        {(v.foto||{})[viewingPhotoId as any]?.tipo === "video"
                          ? <video src={(v.foto||{})[viewingPhotoId as any]?.dataUrl} controls playsInline autoPlay style={{ width: "100%", maxHeight: 300 }} />
                          : <img src={(v.foto||{})[viewingPhotoId as any]?.url || (v.foto||{})[viewingPhotoId as any]?.dataUrl} style={{ width: "100%", maxHeight: 300, objectFit: "contain" }} alt="" />
                        }
                        <div onClick={() => setViewingPhotoId(null)} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 700 }}></div>
                      </div>
                    )}
                  </>
                }
              </div>

              {/* Manodopera */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 14, marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#D08008", marginBottom: 10 }}>MANODOPERA</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 3 }}>Ore stimate</div>
                    <input type="number" step="0.5" min="0" value={v.oreStimate ?? ""} onChange={e => updateVanoField(v.id, "oreStimate", Number(e.target.value) || 0)}
                      placeholder="Auto" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 14, fontWeight: 700, fontFamily: FF, textAlign: "center", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 3 }}>Ore extra</div>
                    <input type="number" step="0.5" min="0" value={v.oreExtra ?? ""} onChange={e => updateVanoField(v.id, "oreExtra", Number(e.target.value) || 0)}
                      placeholder="0" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 14, fontWeight: 700, fontFamily: FF, textAlign: "center", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 3 }}>Totale ore</div>
                    <div style={{ padding: "8px 10px", borderRadius: 8, background: "#D0800810", border: `1px solid #D0800825`, fontSize: 14, fontWeight: 800, fontFamily: FF, textAlign: "center", color: "#D08008" }}>
                      {((v.oreStimate || 0) + (v.oreExtra || 0)).toFixed(1)}
                    </div>
                  </div>
                </div>
                <input value={v.notaManodopera || ""} onChange={e => updateVanoField(v.id, "notaManodopera", e.target.value)}
                  placeholder="Note manodopera (demolizione, muratura...)" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: "Inter", boxSizing: "border-box" }} />
                {(() => {
                  const costoOra = 35;
                  const totOre = (v.oreStimate || 0) + (v.oreExtra || 0);
                  const costo = totOre * costoOra;
                  return totOre > 0 ? (
                    <div style={{ marginTop: 6, fontSize: 10, color: T.sub, display: "flex", justifyContent: "space-between" }}>
                      <span>{totOre}h × €{costoOra}/ora</span>
                      <span style={{ fontWeight: 800, color: "#D08008" }}>€ {costo.toFixed(2)}</span>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Note */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#E8A020", marginBottom: 8 }}><I d={ICO.fileText} /> NOTE</div>
                <textarea style={{ width: "100%", padding: 10, fontSize: 13, border: `1px solid ${T.bdr}`, borderRadius: 8, background: T.card, minHeight: 60, resize: "vertical", fontFamily: FF, boxSizing: "border-box" }} placeholder="Note sul vano..." defaultValue={v.note || ""} />
              </div>
                </div>
              )}
            </>
          )}


          {/* === STEP 7: RIEPILOGO COMPLETO === */}
          {vanoStep === 2 && (
            <>
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 16, marginBottom: 12 }}>
                <div style={{ textAlign: "center", marginBottom: 14 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{v.nome}</div>
                  <div style={{ fontSize: 12, color: T.sub }}>{v.tipo} • {v.stanza} • {v.piano} • {v.pezzi||1}pz</div>
                </div>

                {/* Helper row renderer */}
                {(() => {
                  const Sec = ({ title, color, icon, rows }) => {
                    const hasData = rows.some(r => r[1]);
                    return (
                      <div style={{ borderRadius: 10, border: `1px solid ${color}25`, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ padding: "6px 12px", background: color + "10", fontSize: 11, fontWeight: 700, color, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>{icon} {title}</span>
                          {hasData && <span style={{ width: 7, height: 7, borderRadius: "50%", background: T.grn, display: "inline-block" }} />}
                        </div>
                        {rows.map(([l, val, highlight], ri) => (
                          <div key={ri} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderTop: `1px solid ${T.bdr}`, fontSize: 12 }}>
                            <span style={{ color: T.text }}>{l}</span>
                            <span style={{ fontFamily: FM, fontWeight: 600, color: highlight ? highlight : val ? T.text : T.sub2, maxWidth: "60%", textAlign: "right" }}>{val || "—"}</span>
                          </div>
                        ))}
                      </div>
                    );
                  };

                  const acc = v.accessori || {};
                  const ct = v.controtelaio || {};

                  return <>
                    {/* Misure */}
                    <Sec title="LARGHEZZE" color="#507aff" icon="" rows={[["Alto", m.lAlto], ["Centro", m.lCentro], ["Basso", m.lBasso]]} />
                    <Sec title="ALTEZZE" color="#1A9E73" icon="" rows={[["Sinistra", m.hSx], ["Centro", m.hCentro], ["Destra", m.hDx]]} />
                    <Sec title="DIAGONALI" color="#E8A020" icon="" rows={[["D1", m.d1], ["D2", m.d2], ["Fuori squadra", fSq !== null ? `${fSq}mm` : "", fSq > 3 ? "#DC4444" : undefined]]} />

                    {/* Sistema + Vetro */}
                    <Sec title="SISTEMA / VETRO" color="#0D7C6B" icon="" rows={[
                      ["Sistema", v.sistema],
                      ["Vetro", v.vetro],
                    ]} />

                    {/* Colori */}
                    <Sec title="COLORI PROFILI" color="#af52de" icon="" rows={[
                      ["Colore Int.", v.coloreInt],
                      ...(v.bicolore ? [["Colore Est.", v.coloreEst]] : []),
                      ...(v.bicolore ? [["Bicolore", "Sì", T.acc]] : []),
                      ["Colore Accessori", v.coloreAcc || "Come profili"],
                    ]} />

                    {/* Telaio */}
                    <Sec title="TELAIO / RIFILATO" color="#8e8e93" icon="" rows={[
                      ["Telaio", v.telaio === "Z" ? "Telaio a Z" : v.telaio === "L" ? "Telaio a L" : "—"],
                      ...(v.telaio === "Z" && v.telaioAlaZ ? [["Ala Z", `${v.telaioAlaZ}mm`]] : []),
                      ["Rifilato", v.rifilato ? "Sì" : "No"],
                      ...(v.rifilato ? [["Rifilo Sx", v.rifilSx || "—"], ["Rifilo Dx", v.rifilDx || "—"], ["Rifilo Sopra", v.rifilSopra || "—"], ["Rifilo Sotto", v.rifilSotto || "—"]] : []),
                    ]} />

                    {/* Coprifilo / Lamiera */}
                    <Sec title="COPRIFILO / LAMIERA" color="#b45309" icon="" rows={[
                      ["Coprifilo", v.coprifilo],
                      ["Lamiera", v.lamiera],
                    ]} />

                    {/* Controtelaio */}
                    {ct.tipo && <Sec title={`CONTROTELAIO ${ct.tipo === "singolo" ? "SINGOLO" : ct.tipo === "doppio" ? "DOPPIO" : "CON CASSONETTO"}`} color="#2563eb" icon="" rows={[
                      ["Larghezza", ct.l ? `${ct.l}mm` : ""],
                      ["Altezza", ct.h ? `${ct.h}mm` : ""],
                      ...(ct.tipo === "singolo" && ct.prof ? [["Profondità", `${ct.prof}mm`]] : []),
                      ...(ct.tipo === "doppio" ? [["Sez. Interna", ct.sezInt], ["Sez. Esterna", ct.sezEst], ["Distanziale", ct.distanziale]] : []),
                      ...(ct.tipo === "cassonetto" ? [["H Cassonetto", ct.hCass], ["P Cassonetto", ct.pCass], ["Sezione", ct.sezione], ["Spalla", ct.spalla], ["Cielino", ct.cielino]] : []),
                    ]} />}

                    {/* Spallette */}
                    <Sec title="SPALLETTE" color="#32ade6" icon="▤" rows={[["Sinistra", m.spSx], ["Destra", m.spDx], ["Sopra", m.spSopra], ["Imbotte", m.imbotte]]} />

                    {/* Davanzale */}
                    <Sec title="DAVANZALE" color="#EF4444" icon="⬇" rows={[["Profondità", m.davProf], ["Sporgenza", m.davSporg], ["Soglia", m.soglia]]} />

                    {/* Accessori — dettagliato */}
                    {(acc.tapparella?.attivo || acc.persiana?.attivo || acc.zanzariera?.attivo) && (
                      <Sec title="ACCESSORI" color="#af52de" icon="+" rows={[
                        ...(acc.tapparella?.attivo ? [
                          ["⊞ Tapparella", "Sì", T.grn],
                          ...(acc.tapparella.tipo ? [["  Tipo", acc.tapparella.tipo]] : []),
                          ...(acc.tapparella.l ? [["  Larghezza", `${acc.tapparella.l}mm`]] : []),
                          ...(acc.tapparella.h ? [["  Altezza", `${acc.tapparella.h}mm`]] : []),
                          ...(acc.tapparella.motorizzata !== undefined ? [["  Motorizzata", acc.tapparella.motorizzata ? "Sì" : "No"]] : []),
                          ...(acc.tapparella.colore ? [["  Colore", acc.tapparella.colore]] : []),
                        ] : []),
                        ...(acc.persiana?.attivo ? [
                          ["Persiana", "Sì", T.grn],
                          ...(acc.persiana.tipo ? [["  Tipo", acc.persiana.tipo]] : []),
                          ...(acc.persiana.ante ? [["  N° ante", String(acc.persiana.ante)]] : []),
                          ...(acc.persiana.colore ? [["  Colore", acc.persiana.colore]] : []),
                        ] : []),
                        ...(acc.zanzariera?.attivo ? [
                          ["Zanzariera", "Sì", T.grn],
                          ...(acc.zanzariera.categoria ? [["  Tipologia", acc.zanzariera.categoria]] : []),
                          ...(acc.zanzariera.tipoMisura ? [["  Tipo misura", acc.zanzariera.tipoMisura]] : []),
                          ...(acc.zanzariera.colore ? [["  Colore", acc.zanzariera.colore]] : []),
                        ] : []),
                      ]} />
                    )}

                    {/* Accessori da catalogo */}
                    {v.accessoriCatalogo && v.accessoriCatalogo.length > 0 && (
                      <Sec title="ACCESSORI CATALOGO" color="#8B5CF6" icon="" rows={v.accessoriCatalogo.map(a => [`${a.nome}`, `×${a.quantita} · €${((a.prezzoUnitario||0)*(a.quantita||1)).toFixed(0)}`])} />
                    )}
                    {/* Voci libere */}
                    {v.vociLibere && v.vociLibere.length > 0 && (
                      <Sec title="VOCI LIBERE" color="#E8A020" icon="" rows={v.vociLibere.map(vl => {
                        const label = vl.tipo === "vetro" ? `${vl.descrizione || "Vetro"}` : vl.tipo === "coprifilo" ? `${vl.descrizione || "Coprifilo"}` : `${vl.descrizione || "Voce"}`;
                        const val = vl.tipo === "vetro" && vl.larghezza && vl.altezza ? `${vl.larghezza}×${vl.altezza}mm · €${((vl.prezzo||0)*(vl.qta||1)).toFixed(0)}` : vl.tipo === "coprifilo" && vl.lunghezza ? `${(vl.lunghezza/1000).toFixed(2)}ml · €${((vl.prezzo||0)*(vl.qta||1)).toFixed(0)}` : `€${((vl.prezzo||0)*(vl.qta||1)).toFixed(0)}`;
                        return [label, val];
                      })} />
                    )}

                    {/* Note */}
                    {v.note && (
                      <div style={{ borderRadius: 10, border: `1px solid ${T.bdr}`, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ padding: "6px 12px", background: "#8e8e9310", fontSize: 11, fontWeight: 700, color: "#8e8e93" }}><I d={ICO.fileText} /> NOTE</div>
                        <div style={{ padding: "8px 12px", fontSize: 12, lineHeight: 1.5 }}>{v.note}</div>
                      </div>
                    )}

                    {/* Accesso */}
                    {(v.difficoltaSalita || v.mezzoSalita) && (
                      <Sec title="ACCESSO" color={v.difficoltaSalita === "facile" ? T.grn : v.difficoltaSalita === "difficile" ? "#DC4444" : "#E8A020"} icon="" rows={[
                        ["Difficoltà", v.difficoltaSalita],
                        ["Mezzo salita", v.mezzoSalita],
                      ]} />
                    )}

                    {/* Foto gallery */}
                    {Object.values(v.foto || {}).filter(f => f.tipo === "foto" && f.dataUrl).length > 0 && (
                      <div style={{ borderRadius: 10, border: `1px solid #0D7C6B25`, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ padding: "6px 12px", background: "#0D7C6B10", fontSize: 11, fontWeight: 700, color: "#0D7C6B" }}><I d={ICO.camera} /> FOTO ({Object.values(v.foto || {}).filter(f => f.tipo === "foto").length})</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: 8 }}>
                          {Object.entries(v.foto || {}).filter(([, f]) => f.tipo === "foto" && f.dataUrl).map(([k, f]) => (
                            <div key={k} style={{ position: "relative", width: 64, height: 48, borderRadius: 6, overflow: "hidden" }}>
                              <img src={f.url || f.dataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                              {f.categoria && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 6, textAlign: "center", padding: "1px" }}>{f.categoria}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Completeness score */}
                    {(() => {
                      const fields = [m.lCentro, m.hCentro, v.sistema, v.vetro, v.coloreInt, v.tipo, v.stanza].filter(Boolean).length;
                      const tot = 7;
                      const pct = Math.round(fields / tot * 100);
                      return (
                        <div style={{ padding: "10px 12px", borderRadius: 10, background: pct >= 80 ? T.grn + "10" : pct >= 50 ? "#E8A02010" : "#DC444410", border: `1px solid ${pct >= 80 ? T.grn + "30" : pct >= 50 ? "#E8A02030" : "#DC444430"}`, textAlign: "center" }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: pct >= 80 ? T.grn : pct >= 50 ? "#E8A020" : "#DC4444" }}>{pct}%</div>
                          <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>Completezza vano ({fields}/{tot} campi chiave)</div>
                        </div>
                      );
                    })()}
                  </>;
                })()}
              </div>
            </>
          )}

          {/* ═══ PDF TECNICO + TAVOLA TECNICA — solo nel riepilogo ═══ */}
          {vanoStep === 2 && (
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {/* PDF Tecnico Fornitore */}
              {v.pdfFornitore ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "#3B7FE010", border: "1px solid #3B7FE030" }}>
                  <span style={{ fontSize: 16 }}>📄</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#3B7FE0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{v.pdfFornitoreNome || "disegno_tecnico.pdf"}</div>
                    <div style={{ fontSize: 9, color: T.sub }}>{v.pdfFornitoreData || ""}</div>
                  </div>
                  <div onClick={() => { const a = document.createElement("a"); a.href = v.pdfFornitore; a.download = v.pdfFornitoreNome || "disegno.pdf"; a.click(); }}
                    style={{ padding: "5px 12px", borderRadius: 7, background: "#3B7FE015", border: "1px solid #3B7FE040", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#3B7FE0" }}>⬇ Apri</div>
                  <div onClick={() => { updateVanoField(v.id, "pdfFornitore", null); updateVanoField(v.id, "pdfFornitoreNome", null); updateVanoField(v.id, "pdfFornitoreData", null); }}
                    style={{ padding: "5px 8px", borderRadius: 7, background: "#DC444415", color: "#DC4444", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>✕</div>
                </div>
              ) : (
                <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: T.card, border: `1.5px dashed #3B7FE040`, cursor: "pointer" }}>
                  <span style={{ fontSize: 16 }}>📎</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#3B7FE0" }}>Allega PDF tecnico fornitore</div>
                    <div style={{ fontSize: 9, color: T.sub }}>Sezioni nodi, dettagli profilo</div>
                  </div>
                  <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={e => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => { updateVanoField(v.id, "pdfFornitore", reader.result as string); updateVanoField(v.id, "pdfFornitoreNome", file.name); updateVanoField(v.id, "pdfFornitoreData", new Date().toLocaleDateString("it-IT")); };
                    reader.readAsDataURL(file);
                  }} />
                </label>
              )}
              {/* Genera Tavola Tecnica */}
              <div onClick={() => {
                const ctx = { aziendaInfo, sistemiDB, vetriDB,
                  cliente: selectedCM?.cliente || selectedCM?.nome || "",
                  cognome: selectedCM?.cognome || "",
                  commessaCode: selectedCM?.code || selectedCM?.id || "",
                  commessaData: selectedCM?.data || "" };
                generaTavolaTecnica(v, ctx);
              }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                background: "linear-gradient(135deg, #2D7A6B 0%, #1A9E73 100%)",
                boxShadow: "0 2px 8px #2D7A6B30" }}>
                <div style={{ textAlign: "left" as const }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Genera Tavola Tecnica</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)" }}>Vista frontale · Nodi · Specifiche · Trasmittanza Uw</div>
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginLeft: "auto" }}>PDF ↓</span>
              </div>
              {/* Ordine Controtelai */}
              {selectedRilievo?.vani?.some(vn => vn.controtelaio?.sistema && vn.controtelaio.sistema !== "nessuno") && (
                <div onClick={() => setShowOrdinePanel(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    padding: "14px 16px", borderRadius: 12, cursor: "pointer",
                    background: "#1A1A1C", boxShadow: "0 2px 8px #1A1A1C30" }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Ordine Controtelai</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>PDF pronto per fornitore</div>
                  </div>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginLeft: "auto" }}>PDF ↓</span>
                </div>
              )}
            </div>
          )}

          {/* fliwoX Bottoni navigazione step */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {vanoStep > 0 && (
              <button onClick={() => setVanoStep(s => s - 1)} style={{ flex: 1, padding: "15px", borderRadius: 14, border: "2px solid #F0EFEC", background: "white", fontSize: 14, fontWeight: 900, cursor: "pointer", fontFamily: FF, color: "#0D1F1F", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                ← Indietro
              </button>
            )}
            {vanoStep < 2 && (
              <button onClick={() => setVanoStep(s => s + 1)} style={{ flex: 2, padding: "15px", borderRadius: 14, border: "none", background: "#28A0A0", color: "white", fontSize: 15, fontWeight: 900, cursor: "pointer", fontFamily: FF, boxShadow: "0 2px 8px rgba(40,160,160,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {vanoStep === 0 ? "MISURE →" : "RIEPILOGO →"}
              </button>
            )}
            {vanoStep === 0 && (
              <button onClick={() => setVanoStep(2)} style={{ padding: "15px 18px", borderRadius: 14, border: "2px solid rgba(26,158,115,0.4)", background: "rgba(26,158,115,0.1)", fontSize: 13, fontWeight: 900, cursor: "pointer", fontFamily: FF, color: "#1A9E73", boxShadow: "0 6px 0 0 rgba(26,158,115,0.3)" }}>Fine</button>
            )}
            {vanoStep === 2 && (
              <button onClick={() => { setVanoStep(0); goBack(); }} style={{ flex: 2, padding: "15px", borderRadius: 14, border: "none", background: "#1A9E73", color: "white", fontSize: 15, fontWeight: 900, cursor: "pointer", fontFamily: FF, boxShadow: "0 8px 0 0 #0A5A3A", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                SALVA TUTTO
              </button>
            )}
          </div>

          {/* === fliwoX RIEPILOGO RAPIDO === */}
          <div style={{ marginTop: 12, padding: "12px 14px", background: "white", borderRadius: 14, border: "1.5px solid #F0EFEC", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10, fontWeight: 900, color: "#8A8A82", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Riepilogo misure</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              {[
                ["L", m.lCentro || m.lAlto || m.lBasso, null],
                ["H", m.hCentro || m.hSx || m.hDx, null],
                ["Δ", fSq !== null ? `${fSq}mm` : null, fSq > 3 ? "#DC4444" : "#1A9E73"],
              ].map(([l, val, c]) => (
                <div key={l as string} style={{ padding: "8px 10px", borderRadius: 10, background: c === "#DC4444" ? "rgba(220,68,68,0.08)" : val ? "rgba(40,160,160,0.08)" : "#F5F5F5", border: `1.5px solid ${c === "#DC4444" ? "rgba(220,68,68,0.3)" : val ? "rgba(40,160,160,0.2)" : "#E8E8E8"}`, textAlign: "center" as const, boxShadow: val ? "0 3px 0 0 rgba(40,160,160,0.2)" : "0 2px 0 0 #E0E0E0" }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: "#8A8A82", marginBottom: 2, textTransform: "uppercase" as const }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 900, fontFamily: FM, color: c || (val ? "#0D1F1F" : "#8BBCBC") }}>{val || "—"}{val && l !== "Δ" ? <span style={{ fontSize: 10, color: "#8A8A82" }}>mm</span> : null}</div>
                </div>
              ))}
            </div>
            {/* Row 2: details */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
              {v.sistema && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#0D7C6B12", fontSize: 9, color: "#0D7C6B", fontWeight: 600 }}><I d={ICO.settings} /> {v.sistema.split(" ").slice(0, 2).join(" ")}</div>}
              {v.coloreInt && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#af52de12", fontSize: 9, color: "#af52de", fontWeight: 600 }}><I d={ICO.palette} /> {v.coloreInt}</div>}
              {v.vetro && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#32ade612", fontSize: 9, color: "#32ade6", fontWeight: 600 }}><I d={ICO.gem} /> {v.vetro}</div>}
              {v.coprifilo && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#b4530912", fontSize: 9, color: "#b45309", fontWeight: 600 }}><I d={ICO.settings} /> {v.coprifilo}</div>}
              {v.accessori?.tapparella?.attivo && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#1A9E7312", fontSize: 9, color: "#1A9E73", fontWeight: 600 }}><I d={ICO.grid} /> Tapp.</div>}
              {v.accessori?.persiana?.attivo && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#1A9E7312", fontSize: 9, color: "#1A9E73", fontWeight: 600 }}><I d={ICO.home} /> Pers.</div>}
              {v.accessori?.zanzariera?.attivo && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#af52de12", fontSize: 9, color: "#af52de", fontWeight: 600 }}><I d={ICO.bug} /> Zanz.</div>}
              {v.controtelaio?.tipo && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#2563eb12", fontSize: 9, color: "#2563eb", fontWeight: 600 }}><I d={ICO.square} /> CT</div>}
            </div>
          </div>

          {/* === FAB QUICK EDIT PANEL === */}
          {detailOpen.fabOpen && !showLamieraDisegno && <div onClick={() => setDetailOpen(d => ({ ...d, fabOpen: false }))} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 998 }} />}
          {detailOpen.fabOpen && !showLamieraDisegno && (
            <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 999, background: "#fff", borderRadius: "16px 16px 0 0", boxShadow: "0 -4px 30px rgba(0,0,0,0.2)", padding: "12px 16px 28px", maxHeight: "82vh", overflowY: "auto" }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "#ddd", margin: "0 auto 10px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 14, fontWeight: 900, color: T.text }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Accesso rapido</span>
                  <div style={{ fontSize: 9, color: T.sub, marginTop: 1 }}>{v.tipo || "?"} · {v.stanza || "?"} · {v.sistema ? "Sist." : "—"} · {v.coloreInt ? "Col." : "—"} · {(m.lCentro && m.hCentro) ? m.lCentro+"×"+m.hCentro : "— Mis."}</div>
                </div>
                <div onClick={() => setDetailOpen(d => ({ ...d, fabOpen: false }))} style={{ padding: "5px 12px", borderRadius: 8, background: T.bg, border: "1px solid " + T.bdr, fontSize: 11, color: T.sub, cursor: "pointer", fontWeight: 700 }}></div>
              </div>

              {/* STEP INDICATORS */}
              {(() => {
                const steps = [
                  { id: "tipo", label: "Tipo", done: !!v.tipo, icon: "⊞" },
                  { id: "sistema", label: "Sistema", done: !!v.sistema, icon: "" },
                  { id: "vetro", label: "Vetro", done: !!v.vetro, icon: "" },
                  { id: "colore", label: "Colore", done: !!v.coloreInt, icon: "" },
                  { id: "misure", label: "Misure", done: !!(m.lCentro && m.hCentro), icon: "" },
                  { id: "pezzi", label: "Pezzi", done: true, icon: "#" },
                ];
                const firstIncomplete = steps.findIndex(s => !s.done);
                const activeStep = firstIncomplete >= 0 ? firstIncomplete : steps.length - 1;
                return (
                  <>
                    {/* Step pills */}
                    <div style={{ display: "flex", gap: 3, marginBottom: 12, flexWrap: "wrap" }}>
                      {steps.map((s, i) => (
                        <div key={s.id} style={{
                          padding: "3px 8px", borderRadius: 12, fontSize: 9, fontWeight: 700,
                          background: s.done ? "#1A9E7315" : i === activeStep ? T.acc + "15" : T.bg,
                          color: s.done ? "#1A9E73" : i === activeStep ? T.acc : T.sub,
                          border: "1px solid " + (s.done ? "#1A9E7330" : i === activeStep ? T.acc + "40" : T.bdr),
                        }}>{s.done ? "" : s.icon} {s.label}</div>
                      ))}
                    </div>

                    {/* ACTIVE SECTION - show current + all done ones collapsed */}
                    {/* TIPOLOGIA */}
                    <div style={{ marginBottom: 8, padding: "6px 0", borderBottom: v.tipo ? "1px solid " + T.bdr : "none" }}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: activeStep === 0 ? T.acc : T.sub, textTransform: "uppercase", marginBottom: 4 }}>⊞ TIPOLOGIA {v.tipo && <span style={{ color: "#1A9E73", marginLeft: 6 }}>{v.tipo}</span>}</div>
                      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                        {tipologieFiltrate.map(tp => (
                          <div key={tp.code} onClick={() => updateVanoField(v.id, "tipo", tp.code)} style={{
                            padding: "6px 10px", borderRadius: 8, flexShrink: 0, cursor: "pointer",
                            border: "1.5px solid " + (v.tipo === tp.code ? "#E8A020" : T.bdr),
                            background: v.tipo === tp.code ? "#E8A02015" : T.card,
                          }}>
                            <div style={{ fontSize: 14, textAlign: "center" }}>{tp.icon}</div>
                            <div style={{ fontSize: 8, fontWeight: 700, color: v.tipo === tp.code ? "#E8A020" : T.sub, textAlign: "center", whiteSpace: "nowrap" }}>{tp.code}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* SISTEMA + VETRO - show when tipo is set */}
                    {v.tipo && (
                      <div style={{ marginBottom: 8, padding: "6px 0", borderBottom: (v.sistema && v.vetro) ? "1px solid " + T.bdr : "none", animation: "qpFadeIn 0.3s ease" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: activeStep === 1 ? T.acc : T.sub, textTransform: "uppercase", marginBottom: 3 }}>Sistema {v.sistema && <span style={{ color: "#1A9E73" }}></span>}</div>
                            <select style={{ ...S.select, fontSize: 12, padding: "8px", borderColor: !v.sistema && activeStep === 1 ? T.acc + "60" : undefined }} value={v.sistema || ""} onChange={e => updateVanoField(v.id, "sistema", e.target.value)}>
                              <option value="">— Sistema —</option>
                              {sistemiDB.map(s => <option key={s.id} value={s.marca + " " + s.sistema}>{s.marca} {s.sistema}</option>)}
                            </select>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, color: activeStep === 2 ? T.acc : T.sub, textTransform: "uppercase", marginBottom: 3 }}>Vetro {v.vetro && <span style={{ color: "#1A9E73" }}></span>}</div>
                            <select style={{ ...S.select, fontSize: 12, padding: "8px", borderColor: !v.vetro && activeStep === 2 ? T.acc + "60" : undefined }} value={v.vetro || ""} onChange={e => updateVanoField(v.id, "vetro", e.target.value)}>
                              <option value="">— Vetro —</option>
                              {vetriDB.map(g => <option key={g.id} value={g.code}>{g.code}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* COLORE - show when sistema is set */}
                    {v.sistema && (
                      <div style={{ marginBottom: 8, padding: "6px 0", borderBottom: v.coloreInt ? "1px solid " + T.bdr : "none", animation: "qpFadeIn 0.3s ease" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: activeStep === 3 ? T.acc : T.sub, textTransform: "uppercase" }}>Colore {v.coloreInt && <span style={{ color: "#1A9E73" }}></span>}</div>
                          <div onClick={() => updateVanoField(v.id, "bicolore", !v.bicolore)} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: v.bicolore ? T.accLt : T.bg, border: "1px solid " + (v.bicolore ? T.acc : T.bdr), color: v.bicolore ? T.acc : T.sub, cursor: "pointer", fontWeight: 600 }}>
                            Bicolore {v.bicolore ? "" : ""}
                          </div>
                        </div>
                        {!v.bicolore ? (
                          <select style={{ ...S.select, fontSize: 12, padding: "8px", borderColor: !v.coloreInt && activeStep === 3 ? T.acc + "60" : undefined }} value={v.coloreInt || ""} onChange={e => updateVanoField(v.id, "coloreInt", e.target.value)}>
                            <option value="">— Colore —</option>
                            {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                          </select>
                        ) : (
                          <div style={{ display: "flex", gap: 6 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 8, color: T.sub, marginBottom: 2 }}>INT</div>
                              <select style={{ ...S.select, fontSize: 11, padding: "7px" }} value={v.coloreInt || ""} onChange={e => updateVanoField(v.id, "coloreInt", e.target.value)}>
                                <option value="">—</option>
                                {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                              </select>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 8, color: T.sub, marginBottom: 2 }}>EST</div>
                              <select style={{ ...S.select, fontSize: 11, padding: "7px" }} value={v.coloreEst || ""} onChange={e => updateVanoField(v.id, "coloreEst", e.target.value)}>
                                <option value="">—</option>
                                {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                        {/* Colore accessori inline */}
                        <div style={{ marginTop: 6 }}>
                          <div style={{ fontSize: 8, fontWeight: 600, color: T.sub, marginBottom: 2 }}>Accessori</div>
                          <select style={{ ...S.select, fontSize: 11, padding: "7px" }} value={v.coloreAcc || ""} onChange={e => updateVanoField(v.id, "coloreAcc", e.target.value)}>
                            <option value="">— Come profili —</option>
                            {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* MISURE - show when colore is set */}
                    {v.coloreInt && (
                      <div style={{ marginBottom: 8, padding: "6px 0", animation: "qpFadeIn 0.3s ease" }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: activeStep === 4 ? T.acc : T.sub, textTransform: "uppercase", marginBottom: 4 }}>Misure (mm) {(m.lCentro > 0 && m.hCentro > 0) && <span style={{ color: "#1A9E73" }}>{m.lCentro}×{m.hCentro}</span>}</div>
                        <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 8, color: "#507aff", marginBottom: 2, fontWeight: 700 }}>LARGHEZZA</div>
                            <input type="number" inputMode="numeric" style={{ ...S.input, fontSize: 16, fontFamily: FM, fontWeight: 700, textAlign: "center", padding: "10px", borderColor: "#507aff50" }} value={m.lCentro || ""} placeholder="L" onChange={e => { const val = parseInt(e.target.value) || 0; updateMisureBatch(v.id, { lAlto: val, lCentro: val, lBasso: val }); }} />
                          </div>
                          <div style={{ fontSize: 18, color: T.sub, fontWeight: 300, paddingBottom: 10 }}>×</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 8, color: "#507aff", marginBottom: 2, fontWeight: 700 }}>ALTEZZA</div>
                            <input type="number" inputMode="numeric" style={{ ...S.input, fontSize: 16, fontFamily: FM, fontWeight: 700, textAlign: "center", padding: "10px", borderColor: "#507aff50" }} value={m.hCentro || ""} placeholder="H" onChange={e => { const val = parseInt(e.target.value) || 0; updateMisureBatch(v.id, { hSx: val, hCentro: val, hDx: val }); }} />
                          </div>
                          {m.lCentro > 0 && m.hCentro > 0 && (
                            <div style={{ textAlign: "center", paddingBottom: 6 }}>
                              <div style={{ fontSize: 14, color: T.grn, fontWeight: 800, fontFamily: FM }}>{((m.lCentro/1000)*(m.hCentro/1000)).toFixed(2)}</div>
                              <div style={{ fontSize: 7, color: T.grn, fontWeight: 600 }}>mq</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* PEZZI - always visible when misure set */}
                    {(m.lCentro > 0 && m.hCentro > 0) && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0", animation: "qpFadeIn 0.3s ease" }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}># Pezzi:</span>
                        <div style={{ display: "flex", gap: 3 }}>
                          {[1, 2, 3, 4, 5].map(n => (
                            <div key={n} onClick={() => updateVanoField(v.id, "pezzi", n)} style={{
                              width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 700, fontFamily: FM, cursor: "pointer",
                              background: (v.pezzi || 1) === n ? T.acc : T.bg,
                              color: (v.pezzi || 1) === n ? "#fff" : T.sub,
                              border: "1px solid " + ((v.pezzi || 1) === n ? T.acc : T.bdr)
                            }}>{n}</div>
                          ))}
                        </div>
                        <input type="number" inputMode="numeric" min="1" style={{
                          width: 48, padding: "4px 6px", fontSize: 13, fontFamily: FM, fontWeight: 700, textAlign: "center",
                          border: "1.5px solid " + ((v.pezzi || 1) > 5 ? T.acc : T.bdr), borderRadius: 6,
                          color: (v.pezzi || 1) > 5 ? T.acc : T.text,
                          background: (v.pezzi || 1) > 5 ? T.accLt : T.bg
                        }} value={v.pezzi || 1} onChange={e => updateVanoField(v.id, "pezzi", parseInt(e.target.value) || 1)} />
                      </div>
                    )}

                    {/* COMPLETION */}
                    {(m.lCentro > 0 && m.hCentro > 0 && v.sistema && v.coloreInt) && (
                      <div onClick={() => setDetailOpen(d => ({ ...d, fabOpen: false }))} style={{
                        marginTop: 8, padding: "12px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                        background: "linear-gradient(135deg, #1A9E73, #28a745)", color: "#fff",
                        fontSize: 13, fontWeight: 800, boxShadow: "0 3px 12px rgba(26,158,115,0.3)",
                      }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polyline points="20 6 9 17 4 12"/></svg> Vano configurato — Chiudi</div>
                    )}

                    <style>{"@keyframes qpFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }"}</style>
                  </>
                );
              })()}
            </div>
          )}

          {/* TAB laterale lamiera — draggabile su/giù, cambia lato */}
          {showLamieraDisegno && (
          <div style={{
            position:"fixed",
            [lamieraTabLato==='right'?'right':'left']: 0,
            top: lamieraTabY+'%',
            transform:"translateY(-50%)",
            zIndex:3100,
            display:"flex",
            flexDirection: lamieraTabLato==='right' ? "row" : "row-reverse",
            alignItems:"center",
            touchAction:"none",
          }}>
            {/* Menu opzioni */}
            {lamieraFabMenu && (
              <>
                <div onClick={()=>setLamieraFabMenu(false)}
                  style={{position:"fixed",inset:0,zIndex:-1}}/>
                <div style={{
                  display:"flex",flexDirection:"column",gap:6,
                  padding:"8px",background:"#fff",
                  borderRadius: lamieraTabLato==='right' ? "12px 0 0 12px" : "0 12px 12px 0",
                  boxShadow: lamieraTabLato==='right' ? "-4px 0 20px rgba(0,0,0,0.12)" : "4px 0 20px rgba(0,0,0,0.12)",
                  border:"1px solid #E2E8F0",
                  [lamieraTabLato==='right'?'borderRight':'borderLeft']:"none"}}>
                  {[
                    {
                      icon: lamieraSchizzoOpen?'✕':'🖊️',
                      label: lamieraSchizzoOpen?'Chiudi':'Schizzo',
                      action: ()=>{setLamieraSchizzoOpen(o=>!o);setLamieraFabMenu(false);}
                    },
                    ...(lamieraSchizzoOpen ? [{
                      icon: (lamieraSchizzoFull||lamieraFullscreen)?'↙':'⤢',
                      label: (lamieraSchizzoFull||lamieraFullscreen)?'Riduci':'Full schizzo',
                      action: ()=>{setLamieraSchizzoFull((f:any)=>!f);setLamieraFabMenu(false);}
                    }] : []),
                    {
                      icon: lamieraFullscreen?'↙':'↗',
                      label: lamieraFullscreen?'Riduci':'Full lamiera',
                      action: ()=>{setLamieraFullscreen(f=>!f);setLamieraFabMenu(false);}
                    },
                    {
                      icon: '◐',
                      label: lamieraLatoBuono==='esterno'?'Est.':'Int.',
                      action: ()=>{setLamieraLatoBuono((l:any)=>l==='esterno'?'interno':'esterno');setLamieraFabMenu(false);}
                    },
                    {
                      icon: lamieraTabLato==='right'?'◁':'▷',
                      label: lamieraTabLato==='right'?'Sposta sx':'Sposta dx',
                      action: ()=>{setLamieraTabLato(l=>l==='right'?'left':'right');setLamieraFabMenu(false);}
                    },
                  ].map(({icon,label,action},i)=>(
                    <div key={i} onClick={action}
                      style={{display:"flex",flexDirection:"column",alignItems:"center",
                        gap:3,padding:"10px 12px",
                        background:"#F8FAFC",borderRadius:10,cursor:"pointer",
                        border:"1px solid #E2E8F0",minWidth:60,textAlign:"center"}}>
                      <span style={{fontSize:20,lineHeight:1}}>{icon}</span>
                      <span style={{fontSize:9,fontWeight:700,color:"#1A2B4A",whiteSpace:"nowrap"}}>{label}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {/* Tab — lingua draggabile */}
            <div
              onPointerDown={e=>{
                // Se tocco breve = click menu, se trascino = drag
                lamieraTabDrag.current = {dragging:false, startY:e.clientY, startPct:lamieraTabY};
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              }}
              onPointerMove={e=>{
                const dy = e.clientY - lamieraTabDrag.current.startY;
                if(Math.abs(dy) > 5) lamieraTabDrag.current.dragging = true;
                if(lamieraTabDrag.current.dragging){
                  const pct = lamieraTabDrag.current.startPct + (dy / window.innerHeight * 100);
                  setLamieraTabY(Math.max(10, Math.min(90, pct)));
                }
              }}
              onPointerUp={e=>{
                if(!lamieraTabDrag.current.dragging){
                  setLamieraFabMenu(m=>!m);
                }
                lamieraTabDrag.current.dragging = false;
              }}
              style={{
                width:24, height:72,
                background:"#1A2B4A",
                borderRadius: lamieraTabLato==='right' ? "10px 0 0 10px" : "0 10px 10px 0",
                cursor:"grab",
                display:"flex",alignItems:"center",justifyContent:"center",
                boxShadow: lamieraTabLato==='right' ? "-3px 0 12px rgba(26,43,74,0.3)" : "3px 0 12px rgba(26,43,74,0.3)",
                flexShrink:0, userSelect:"none",
                touchAction:"none",
              }}>
              <span style={{fontSize:14,color:"#fff",lineHeight:1}}>
                {lamieraFabMenu
                  ? (lamieraTabLato==='right'?'›':'‹')
                  : (lamieraTabLato==='right'?'‹':'›')}
              </span>
            </div>
          </div>
          )}

        </div>
      
      
      {showFotoMisure && (
        <FotoMisure
          T={T}
          imageUrl={null}
          onClose={() => setShowFotoMisure(false)}
          onSave={(dataUrl, annots) => {
            const key = "misure_" + Date.now();
            const fotoObj = { dataUrl, nome: "Foto misure", tipo: "foto", categoria: "Misure annotate", annotations: annots };
            setCantieri(cs => cs.map(c2 => c2.id === selectedCM?.id ? { ...c2, rilievi: c2.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: fotoObj } } : vn) } : r2) } : c2));
            setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: fotoObj } }));
            setShowFotoMisure(false);
          }}
        />
      )}

      {/* ═══ PANEL SELEZIONE STATO MISURE ═══ */}
      {showStatoMisurePanel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "flex-end" }} onClick={() => setShowStatoMisurePanel(false)}>
          <div style={{ width: "100%", background: T.card, borderRadius: "20px 20px 0 0", padding: "20px 16px 32px", maxWidth: 480, margin: "0 auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: T.bdr, margin: "0 auto 16px" }} />
            <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 4 }}>Stato misure — {v.nome}</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Imposta lo stato di validazione delle misure di questo vano</div>
            {STATO_MISURE.map(sm => {
              const isActive = (v.statoMisure || "provvisorie") === sm.id;
              return (
                <div key={sm.id} onClick={() => {
                  updateVanoField(v.id, "statoMisure", sm.id);
                  setSelectedVano(prev => ({ ...prev, statoMisure: sm.id }));
                  setShowStatoMisurePanel(false);
                }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `2px solid ${isActive ? sm.color : T.bdr}`, background: isActive ? sm.bg : T.bg, marginBottom: 8, cursor: "pointer" }}>
                  <span style={{ fontSize: 20 }}>{sm.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? sm.color : T.text }}>{sm.label}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>{sm.desc}</div>
                  </div>
                  {isActive && <span style={{ fontSize: 16, color: sm.color }}>●</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ MODAL DISEGNO TECNICO LAMIERA ═══ */}
      {/* ═══ FULLSCREEN DISEGNO LAMIERA ═══ */}
      {/* ── MODAL ORDINE CONTROTELAI ── */}
      {showOrdinePanel && (
        <OrdineControtelaiPanel
          vani={selectedRilievo?.vani || []}
          commessa={selectedCM}
          aziendaInfo={null}
          T={T}
          onClose={() => setShowOrdinePanel(false)}
        />
      )}

      {showLamieraDisegno && (() => {
        // updateV locale — salva campo nel vano selezionato
        const updateV = (field: string, val: any) => {
          const updRil = selectedRilievo ? { ...selectedRilievo, vani: selectedRilievo.vani.map(vn => vn.id === selectedVano?.id ? { ...vn, [field]: val } : vn) } : null;
          if (updRil) {
            setCantieri(cs => cs.map(c => c.id === selectedCM?.id
              ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? updRil : r2) } : c));
            setSelectedRilievo(updRil);
            setSelectedCM(prev => prev ? ({ ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo?.id ? updRil : r) }) : prev);
          }
          setSelectedVano(prev => prev ? ({ ...prev, [field]: val }) : prev);
        };
        const allSegs = lamieraPieghe;

        // Build nodes in mm, poi scala per fit
        // angolo = angolo effettivo del tratto in gradi (0=destra, 90=su, 180=sinistra, 270=giu)
        // dir + angolo: dir indica quadrante di partenza, angolo devia dalla direzione base
        const buildNodes = () => {
          let cx = 0, cy = 0;
          const raw: {x:number,y:number}[] = [{x:0,y:0}];
          allSegs.forEach(s => {
            const ang = s.angolo != null ? s.angolo : 90;
            let baseAngle = 0;
            if(s.dir==='su')  baseAngle = Math.PI/2;
            if(s.dir==='sx')  baseAngle = Math.PI;
            if(s.dir==='giu') baseAngle = 3*Math.PI/2;
            const devRad = (ang - 90) * Math.PI / 180;
            const finalAngle = baseAngle - devRad;
            cx += s.mm * Math.cos(finalAngle);
            cy -= s.mm * Math.sin(finalAngle); // SVG y-down
            raw.push({x:cx, y:cy});
          });
          // Fit in viewBox 700x460 con padding 60
          const PAD = 70;
          const VW = 700, VH = 460;
          const xs = raw.map(n=>n.x), ys = raw.map(n=>n.y);
          const minX = Math.min(...xs), maxX = Math.max(...xs);
          const minY = Math.min(...ys), maxY = Math.max(...ys);
          const rangeX = maxX - minX || 1, rangeY = maxY - minY || 1;
          const scale = Math.min((VW - PAD*2) / rangeX, (VH - PAD*2) / rangeY);
          const offX = PAD + ((VW - PAD*2) - rangeX * scale) / 2 - minX * scale;
          const offY = PAD + ((VH - PAD*2) - rangeY * scale) / 2 - minY * scale;
          return raw.map(n => ({ x: n.x * scale + offX, y: n.y * scale + offY, mm: n }));
        };

        const nodes = buildNodes();
        const pts = nodes.map(n=>`${n.x.toFixed(1)},${n.y.toFixed(1)}`).join(' ');
        const sviluppata = allSegs.reduce((a,s)=>a+s.mm, 0);
        // Lunghezza = prima dimensione principale (il tratto più lungo)
        const lunghezzaPrincipale = allSegs.length > 0 ? Math.max(...allSegs.map(s=>s.mm)) : 0;

        const DIRS = [
          {d:'dx',label:'→',name:'Destra'},
          {d:'sx',label:'←',name:'Sinistra'},
          {d:'giu',label:'↓',name:'Giù'},
          {d:'su',label:'↑',name:'Su'},
        ] as const;

        return (
          <div style={{position:'fixed',inset:0,zIndex:3000,background:'#F8FAFC',display:'flex',flexDirection:'column',paddingBottom:'env(safe-area-inset-bottom,0px)',overflow:'hidden'}}>
            
            {/* Header compatto navy */}
            <div style={{background:'#1A2B4A',padding:'10px 14px',display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
              <div style={{flex:1,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',minWidth:0}}>
                <span style={{color:'#fff',fontSize:14,fontWeight:800,whiteSpace:'nowrap'}}>Lamiera</span>
                {/* Badge sviluppata */}
                {sviluppata>0 && <span style={{background:'rgba(255,255,255,0.15)',borderRadius:6,padding:'2px 8px',fontSize:11,color:'#fff',fontWeight:700,whiteSpace:'nowrap'}}>📏 {sviluppata}mm</span>}
                {/* Badge lato infisso */}
                {lamieraLatoInfisso && <span style={{background:'rgba(255,255,255,0.2)',borderRadius:6,padding:'2px 7px',fontSize:11,color:'#fff',fontWeight:800,whiteSpace:'nowrap'}}>{lamieraLatoInfisso==='alto'?'^ ALTO':lamieraLatoInfisso==='basso'?'v BASSO':lamieraLatoInfisso==='sx'?'< SX':'> DX'}</span>}
              </div>
              {/* Toggle lato buono */}
              <div onClick={()=>setLamieraLatoBuono(lamieraLatoBuono==='esterno'?'interno':'esterno')}
                style={{padding:'5px 10px',borderRadius:8,background:'rgba(255,255,255,0.12)',
                  color:'#fff',fontSize:11,fontWeight:700,cursor:'pointer',border:'1px solid rgba(255,255,255,0.25)',whiteSpace:'nowrap'}}>
                ◐ {lamieraLatoBuono==='esterno'?'Est.':'Int.'}
              </div>
              <div onClick={()=>setShowLamieraDisegno(false)}
                style={{color:'rgba(255,255,255,0.6)',fontSize:24,cursor:'pointer',padding:'0 4px',lineHeight:1}}>×</div>
            </div>

            {/* SVG con altezza contenuta su mobile */}
            <div
              style={{flex:1,minHeight:120,background:'#EEF7F5',overflow:'hidden',position:'relative',touchAction:'none'}}
              onTouchStart={e=>{
                const ts = Array.from(e.touches) as any;
                lamieraTouches.current = ts;
              }}
              onTouchMove={e=>{
                e.preventDefault();
                const ts = Array.from(e.touches) as any;
                if(ts.length===1 && lamieraTouches.current.length===1){
                  // Pan
                  const dx = ts[0].clientX - lamieraTouches.current[0].clientX;
                  const dy = ts[0].clientY - lamieraTouches.current[0].clientY;
                  lamieraPan.current = {x: lamieraPan.current.x+dx, y: lamieraPan.current.y+dy};
                  lamieraTouches.current = ts;
                  if(lamieraSvgRef.current){
                    lamieraSvgRef.current.style.transform = `translate(${lamieraPan.current.x}px,${lamieraPan.current.y}px) scale(${lamieraZoom.current})`;
                  }
                } else if(ts.length===2 && lamieraTouches.current.length===2){
                  // Pinch zoom
                  const dist = (a:any,b:any)=>Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY);
                  const prev = dist(lamieraTouches.current[0],lamieraTouches.current[1]);
                  const curr = dist(ts[0],ts[1]);
                  const delta = curr/prev;
                  lamieraZoom.current = Math.min(5,Math.max(0.3,lamieraZoom.current*delta));
                  lamieraTouches.current = ts;
                  if(lamieraSvgRef.current){
                    lamieraSvgRef.current.style.transform = `translate(${lamieraPan.current.x}px,${lamieraPan.current.y}px) scale(${lamieraZoom.current})`;
                  }
                }
              }}
              onTouchEnd={e=>{lamieraTouches.current = Array.from(e.touches) as any;}}
            >
              {allSegs.length===0 && (
                <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',
                  justifyContent:'center',flexDirection:'column',gap:8,color:'#94A3B8',pointerEvents:'none'}}>
                  <div style={{fontSize:40}}>✏️</div>
                  <div style={{fontSize:14,fontWeight:600}}>Aggiungi il primo segmento</div>
                  <div style={{fontSize:11}}>Scegli direzione e inserisci i mm</div>
                </div>
              )}
              {/* Hint zoom */}
              {allSegs.length>0 && (
                <div style={{position:'absolute',bottom:10,right:10,zIndex:10,
                  background:'rgba(0,0,0,0.45)',color:'#fff',borderRadius:8,
                  padding:'4px 10px',fontSize:10,fontWeight:600,pointerEvents:'none'}}>
                  🤏 Pizzica per zoomare · Trascina per muovere
                </div>
              )}
              {/* Bottoni zoom */}
              {allSegs.length>0 && (
                <div style={{position:'absolute',top:10,right:10,zIndex:10,display:'flex',flexDirection:'column',gap:4}}>
                  {[{l:'+',d:1.3},{l:'−',d:0.77},{l:'↺',d:0}].map(btn=>(
                    <div key={btn.l}
                      onClick={()=>{
                        if(btn.d===0){lamieraZoom.current=1;lamieraPan.current={x:0,y:0};}
                        else{lamieraZoom.current=Math.min(5,Math.max(0.3,lamieraZoom.current*btn.d));}
                        if(lamieraSvgRef.current){
                          lamieraSvgRef.current.style.transform=`translate(${lamieraPan.current.x}px,${lamieraPan.current.y}px) scale(${lamieraZoom.current})`;
                        }
                      }}
                      style={{width:30,height:30,borderRadius:7,background:'rgba(255,255,255,0.92)',
                        border:'1px solid #E2E8F0',display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:btn.l==='↺'?13:17,fontWeight:800,cursor:'pointer',color:'#1A2B4A',
                        boxShadow:'0 2px 6px rgba(0,0,0,0.10)'}}>
                      {btn.l}
                    </div>
                  ))}
                </div>
              )}
              <svg ref={lamieraSvgRef} width="100%" height="100%" viewBox="0 0 700 460"
                preserveAspectRatio="xMidYMid meet"
                style={{transformOrigin:'center center',transition:'transform 0.05s'}}>
                {/* Griglia */}
                {Array.from({length:15}).map((_,i)=>(
                  <line key={'gv'+i} x1={i*50} y1="0" x2={i*50} y2="460" stroke="#E2E8F0" strokeWidth="0.5"/>
                ))}
                {Array.from({length:10}).map((_,i)=>(
                  <line key={'gh'+i} x1="0" y1={i*50} x2="700" y2={i*50} stroke="#E2E8F0" strokeWidth="0.5"/>
                ))}

                {allSegs.length > 0 && (() => {
                  const isEst = lamieraLatoBuono === 'esterno';
                  const CLR = isEst ? '#3B7FE0' : '#D08008';

                  // Segmento più lungo = direzione principale del profilo
                  const longestSeg = allSegs.reduce((a,b)=>b.mm>a.mm?b:a, allSegs[0]);
                  const mainDir = longestSeg.dir;
                  // Perpendicolare: se profilo è verticale (su/giu) → freccia va a destra
                  //                 se profilo è orizzontale (dx/sx) → freccia va in su
                  const perpX = (mainDir==='su'||mainDir==='giu') ? 50 : 0;
                  const perpY = (mainDir==='dx'||mainDir==='sx') ? -50 : 0;
                  // Punto medio del segmento più lungo
                  const longestIdx = allSegs.indexOf(longestSeg);
                  const midNode = {
                    x: (nodes[longestIdx].x + nodes[longestIdx+1].x) / 2,
                    y: (nodes[longestIdx].y + nodes[longestIdx+1].y) / 2,
                  };
                  const arrowTipX = midNode.x + perpX;
                  const arrowTipY = midNode.y + perpY;

                  return (
                    <g>
                      {/* Profilo principale */}
                      <polyline points={pts} fill="none" stroke="#0F766E"
                        strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                      {/* Highlight segmento selezionato */}
                      {lamieraSelIdx!==null && lamieraSelIdx<nodes.length-1 && (() => {
                        const n0 = nodes[lamieraSelIdx], n1 = nodes[lamieraSelIdx+1];
                        return <line x1={n0.x} y1={n0.y} x2={n1.x} y2={n1.y}
                          stroke="#D08008" strokeWidth="7" strokeLinecap="round" opacity="0.7"/>;
                      })()}

                      {/* Punto START con label */}
                      <circle cx={nodes[0].x} cy={nodes[0].y} r="7" fill="#0F766E"/>
                      <text x={nodes[0].x-14} y={nodes[0].y-10} fontSize="11" fill="#0F766E" fontWeight="800">START</text>

                      {/* Punto END */}
                      <circle cx={nodes[nodes.length-1].x} cy={nodes[nodes.length-1].y} r="6"
                        fill="#fff" stroke="#0F766E" strokeWidth="3"/>

                      {/* Quote su ogni segmento */}
                      {nodes.slice(1).map((n,i)=>{
                        const prev = nodes[i];
                        const seg = allSegs[i];
                        const mx = (prev.x+n.x)/2, my = (prev.y+n.y)/2;
                        const isH = Math.abs(n.y-prev.y) < Math.abs(n.x-prev.x);
                        // offset quota fuori dal profilo
                        const qx = mx + (isH ? 0 : -30);
                        const qy = my + (isH ? -16 : 0);
                        return (
                          <g key={i}>
                            <circle cx={n.x.toFixed(1)} cy={n.y.toFixed(1)} r="4"
                              fill="#fff" stroke="#0F766E" strokeWidth="2"/>
                            {/* sfondo quota */}
                            <rect x={qx-22} y={qy-10} width="44" height="14" rx="4"
                              fill="rgba(255,255,255,0.85)"/>
                            <text x={qx} y={qy} textAnchor="middle" fontSize="12" fill="#0F172A" fontWeight="800">
                              {seg.mm}
                            </text>
                            {seg.angolo && seg.angolo !== 90 && (
                              <text x={n.x.toFixed(1)} y={(n.y+16).toFixed(1)}
                                textAnchor="middle" fontSize="10" fill="#D08008" fontWeight="700">{seg.angolo<90?'+':'−'}{Math.abs(seg.angolo-90)}°</text>
                            )}
                          </g>
                        );
                      })}

                      {/* LATO BUONO — freccia perpendicolare al profilo */}
                      <line x1={midNode.x} y1={midNode.y} x2={arrowTipX} y2={arrowTipY}
                        stroke={CLR} strokeWidth="2.5" strokeDasharray="5,4"/>
                      <polygon
                        points={(() => {
                          // Punta freccia verso la direzione della freccia
                          if(perpX > 0) return `${arrowTipX},${arrowTipY} ${arrowTipX-8},${arrowTipY-6} ${arrowTipX-8},${arrowTipY+6}`;
                          if(perpX < 0) return `${arrowTipX},${arrowTipY} ${arrowTipX+8},${arrowTipY-6} ${arrowTipX+8},${arrowTipY+6}`;
                          if(perpY < 0) return `${arrowTipX},${arrowTipY} ${arrowTipX-6},${arrowTipY+8} ${arrowTipX+6},${arrowTipY+8}`;
                          return `${arrowTipX},${arrowTipY} ${arrowTipX-6},${arrowTipY-8} ${arrowTipX+6},${arrowTipY-8}`;
                        })()}
                        fill={CLR}/>
                      <rect
                        x={perpX>0 ? arrowTipX+4 : perpX<0 ? arrowTipX-68 : arrowTipX-32}
                        y={perpY<0 ? arrowTipY-22 : perpY>0 ? arrowTipY+6 : arrowTipY-8}
                        width="64" height="16" rx="6" fill={CLR}/>
                      <text
                        x={perpX>0 ? arrowTipX+36 : perpX<0 ? arrowTipX-36 : arrowTipX}
                        y={perpY<0 ? arrowTipY-10 : perpY>0 ? arrowTipY+18 : arrowTipY+4}
                        textAnchor="middle" fontSize="10" fill="#fff" fontWeight="800">
                        ◐ {isEst?'ESTERNO':'INTERNO'}
                      </text>
                    </g>
                  );
                })()}

                {/* Stato vuoto — solo START dot */}
                {allSegs.length === 0 && (
                  <circle cx="350" cy="230" r="7" fill="#0F766E" opacity="0.4"/>
                )}
              </svg>
            </div>

            {/* Chips segmenti — scroll orizzontale, nascosto in fullscreen */}
            {allSegs.length > 0 && !lamieraFullscreen && (
              <div style={{padding:'5px 10px',background:'#fff',
                borderTop:'1px solid #E2E8F0',display:'flex',gap:4,flexShrink:0,alignItems:'center',
                overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
                {allSegs.map((s,i)=>{
                  const isSel = lamieraSelIdx===i;
                  return (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:3,padding:'5px 8px',
                      background:isSel?'#1A2B4A18':'',borderRadius:7,
                      border:`1.5px solid ${isSel?'#1A2B4A':'#1A2B4A50'}`,cursor:'pointer',
                      transition:'all 0.1s'}}>
                      {/* Tap chip = seleziona per edit */}
                      <span onClick={()=>{
                        if(isSel){setLamieraSelIdx(null);}
                        else{
                          setLamieraSelIdx(i);
                          setLamieraPDir(s.dir);
                          setLamieraPMm(String(s.mm));
                          setLamieraAngolo(String(Math.abs((s.angolo||90)-90)||''));
                          setLamieraAngoloPM(((s.angolo||90)<=90)?1:-1);
                          setLamieraAngoloInput((s.angolo||90)!==90);
                        }
                      }} style={{display:'flex',alignItems:'center',gap:4}}>
                        <span style={{fontSize:13,color:isSel?'#0F766E':'#0F766E'}}>{s.dir==='dx'?'→':s.dir==='sx'?'←':s.dir==='giu'?'↓':'↑'}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:800,color:isSel?'#0F172A':'#0F172A'}}>{s.mm}</span>
                        {s.angolo && s.angolo!==90 && (
                          <span style={{fontSize:10,fontWeight:700,color:'#D08008',
                            background:'#D0800815',padding:'1px 5px',borderRadius:4,
                            border:'1px solid #D0800840'}}>
                            {s.angolo<90?'+':'−'}{Math.abs(s.angolo-90)}°
                          </span>
                        )}
                      </span>
                      {/* X = elimina */}
                      <span onClick={e=>{e.stopPropagation();setLamieraPieghe(prev=>prev.filter((_,j)=>j!==i));if(isSel)setLamieraSelIdx(null);}}
                        style={{fontSize:12,color:'#DC4444',fontWeight:700,marginLeft:2,opacity:0.6,padding:'0 2px'}}>×</span>
                    </div>
                  );
                })}
                <div style={{padding:'3px 8px',background:'#1A2B4A18',borderRadius:6,flexShrink:0,
                  fontSize:11,fontWeight:700,color:'#1A2B4A',display:'flex',alignItems:'center',border:'1px solid #1A2B4A30'}}>
                  {sviluppata}mm tot
                </div>
              </div>
            )}

            {/* Pannello aggiunta — nascosto in fullscreen */}
            <div style={{background:'#fff',borderTop:'1px solid #E2E8F0',padding:'8px 12px 16px',flexShrink:0,overflowY:'auto',display:lamieraFullscreen?'none':'block'}}>

              {/* Lato infisso + Lunghezza */}
              <div style={{display:'flex',gap:8,marginBottom:10}}>
                {/* Lato infisso */}
                <div style={{flex:1}}>
                  <div style={{fontSize:9,fontWeight:800,color:'#64748B',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.06em'}}>Lato infisso</div>
                  <div style={{display:'flex',gap:4}}>
                    {([['alto','↑','Alto'],['basso','↓','Basso'],['sx','←','Sx'],['dx','→','Dx']] as const).map(([val,icon,lbl])=>{
                      const sel = lamieraLatoInfisso===val;
                      return (
                        <div key={val} onClick={()=>setLamieraLatoInfisso(sel?'':val)}
                          style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
                            padding:'6px 2px',borderRadius:10,cursor:'pointer',
                            border:`1.5px solid ${sel?'#1A2B4A':'#E2E8F0'}`,
                            background:sel?'#1A2B4A':'#fff',
                            transition:'all 0.12s',
                            boxShadow:sel?'0 2px 8px #1A2B4A50':'none'}}>
                          <span style={{fontSize:15,lineHeight:1,color:sel?'#fff':'#CBD5E1',marginBottom:2}}>{icon}</span>
                          <span style={{fontSize:9,fontWeight:800,color:sel?'rgba(255,255,255,0.85)':'#94A3B8',letterSpacing:'0.04em'}}>{lbl}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Lunghezza */}
                <div style={{flex:1}}>
                  <div style={{fontSize:9,fontWeight:800,color:'#64748B',marginBottom:4,textTransform:'uppercase'}}>Lunghezza (mm)</div>
                  <input
                    inputMode="decimal"
                    value={lamieraLunghezza}
                    onChange={e=>setLamieraLunghezza(e.target.value)}
                    placeholder="es. 1200"
                    style={{width:'100%',padding:'7px 10px',borderRadius:8,boxSizing:'border-box',
                      border:'1.5px solid #E2E8F0',fontSize:16,fontWeight:800,
                      fontFamily:"'JetBrains Mono',monospace",textAlign:'center',
                      background:'#fff',color:'#0F172A'}}/>
                  <div style={{fontSize:9,color:'#94A3B8',marginTop:3,textAlign:'center'}}>
                    Sviluppata: <b style={{color:'#1A2B4A'}}>{allSegs.reduce((a,s)=>a+s.mm,0)}mm</b>
                  </div>
                </div>
              </div>

              {/* Banner modifica segmento */}
              {lamieraSelIdx!==null && (
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                  padding:'7px 12px',borderRadius:10,background:'#FFF8EC',
                  border:'1.5px solid #D08008',marginBottom:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:'#D08008'}}>
                    ✏️ Modifica segmento {lamieraSelIdx+1} — cambia valori e premi OK
                  </span>
                  <span onClick={()=>{setLamieraSelIdx(null);setLamieraPMm('');}}
                    style={{fontSize:18,color:'#D08008',cursor:'pointer',fontWeight:800}}>✕</span>
                </div>
              )}

              {/* Angolo personalizzato — appare solo se lamieraAngoloInput */}
              {lamieraAngoloInput && (
                <div style={{marginBottom:8,display:'flex',alignItems:'center',gap:8,
                  padding:'8px 12px',background:'#FFF8EC',borderRadius:10,border:'1px solid #D0800830'}}>
                  <span style={{fontSize:12,fontWeight:700,color:'#D08008'}}>Angolo:</span>
                  <div onClick={()=>setLamieraAngoloPM((p:any)=>p===1?-1:1)}
                    style={{padding:'6px 12px',borderRadius:8,border:'1px solid #D0800860',
                      background:lamieraAngoloPM===1?'#FFF8EC':'#FFE8B0',
                      fontSize:18,fontWeight:900,color:'#D08008',cursor:'pointer',
                      minWidth:40,textAlign:'center',userSelect:'none' as any}}>
                    {lamieraAngoloPM===1?'+':'−'}
                  </div>
                  <input inputMode="decimal" value={lamieraAngolo}
                    onChange={e=>setLamieraAngolo(e.target.value)}
                    style={{width:60,padding:'6px 10px',borderRadius:8,border:'1px solid #D0800860',
                      fontSize:18,fontWeight:800,fontFamily:"'JetBrains Mono',monospace",
                      textAlign:'center',background:'#fff'}}/>
                  <span style={{fontSize:12,color:'#D08008',fontWeight:600}}>°</span>
                  <div onClick={()=>setLamieraAngoloInput(false)}
                    style={{marginLeft:'auto',fontSize:11,color:'#D08008',cursor:'pointer',fontWeight:700}}>90° default</div>
                </div>
              )}

              {/* 4 tasti direzione */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:5,marginBottom:6}}>
                {DIRS.map(({d,label,name})=>(
                  <div key={d}
                    onClick={()=>{
                      if(lamieraPDir===d && lastDirTap===d){
                        // Doppio tap = apri angolo
                        setLamieraAngoloInput(true);
                        setLastDirTap('');
                      } else {
                        setLamieraPDir(d as any);
                        setLastDirTap(d);
                        setTimeout(()=>setLastDirTap(''),800);
                      }
                    }}
                    style={{padding:'8px 4px',borderRadius:9,textAlign:'center',cursor:'pointer',
                      border:`2px solid ${lamieraPDir===d?'#1A2B4A':'#E2E8F0'}`,
                      background:lamieraPDir===d?'#1A2B4A':'#fff',
                      boxShadow:lamieraPDir===d?'0 3px 0 #111E33':'0 2px 0 rgba(0,0,0,0.06)',
                      transition:'all 0.1s'}}>
                    <div style={{fontSize:20,color:lamieraPDir===d?'#fff':'#94A3B8',lineHeight:1}}>{label}</div>
                    <div style={{fontSize:9,fontWeight:600,
                      color:lamieraPDir===d?'rgba(255,255,255,0.8)':'#CBD5E1',marginTop:3}}>{name}</div>
                    {lamieraPDir===d && !lamieraAngoloInput && (
                      <div style={{fontSize:8,color:'rgba(255,255,255,0.6)',marginTop:1}}>tap 2x=°</div>
                    )}
                  </div>
                ))}
              </div>

              {/* mm + + */}
              <div style={{display:'flex',gap:8,marginBottom:8}}>
                <div style={{flex:1,position:'relative'}}>
                  <input inputMode="decimal" value={lamieraPMm}
                    onChange={e=>setLamieraPMm(e.target.value)}
                    onKeyDown={e=>{
                      if(e.key==='Enter'&&lamieraPMm&&parseFloat(lamieraPMm)>0){
                        const angoloAbs = lamieraAngoloInput ? (parseFloat(lamieraAngolo)||0) : 0;
                        // 90=dritto, PM=+ → 90-abs (piega sx), PM=- → 90+abs (piega dx)
                        const angolo = lamieraAngoloInput && angoloAbs > 0
                          ? (lamieraAngoloPM === 1 ? 90 - angoloAbs : 90 + angoloAbs)
                          : 90;
                        if(lamieraSelIdx!==null){
                          setLamieraPieghe(prev=>prev.map((s,i)=>i===lamieraSelIdx?{dir:lamieraPDir,mm:parseFloat(lamieraPMm),angolo}:s));
                          setLamieraSelIdx(null);
                        } else {
                          setLamieraPieghe(prev=>[...prev,{dir:lamieraPDir,mm:parseFloat(lamieraPMm),angolo}]);
                        }
                        setLamieraPMm('');
                        setLamieraAngoloInput(false);
                        setLamieraAngolo('');
                        setLamieraAngoloPM(1);
                      }
                    }}
                    placeholder="mm"
                    style={{width:'100%',padding:'11px 40px 11px 14px',borderRadius:9,
                      border:'1.5px solid #E2E8F0',fontSize:24,fontWeight:800,
                      fontFamily:"'JetBrains Mono',monospace",textAlign:'center',
                      boxSizing:'border-box',background:'#fff',color:'#0F172A'}}/>
                  <span style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',
                    fontSize:13,color:'#94A3B8',fontWeight:600}}>mm</span>
                </div>
                <div onClick={()=>{
                  if(!lamieraPMm||parseFloat(lamieraPMm)<=0) return;
                  const angoloAbs = lamieraAngoloInput ? (parseFloat(lamieraAngolo)||0) : 0;
                        const angolo = lamieraAngoloInput && angoloAbs !== 90 ? (lamieraAngoloPM === 1 ? 90 - angoloAbs : 90 + angoloAbs) : 90;
                  if(lamieraSelIdx!==null){
                    // EDIT segmento esistente
                    setLamieraPieghe(prev=>prev.map((s,i)=>i===lamieraSelIdx?{dir:lamieraPDir,mm:parseFloat(lamieraPMm),angolo}:s));
                    setLamieraSelIdx(null);
                  } else {
                    // AGGIUNGI nuovo
                    setLamieraPieghe(prev=>[...prev,{dir:lamieraPDir,mm:parseFloat(lamieraPMm),angolo}]);
                  }
                  setLamieraPMm('');
                  setLamieraAngoloInput(false);
                  setLamieraAngolo('90');
                }}
                  style={{width:56,borderRadius:9,
                    background:lamieraSelIdx!==null?'#D08008':'#1A2B4A',color:'#fff',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:lamieraSelIdx!==null?11:28,fontWeight:800,cursor:'pointer',
                    boxShadow:`0 3px 0 ${lamieraSelIdx!==null?'#A06006':'#111E33'}`,
                    flexShrink:0,textAlign:'center',padding:'0 4px'}}>
                  {lamieraSelIdx!==null?'✓ OK':'+'}
                </div>
              </div>

              {/* Salva / Annulla */}
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                <div onClick={()=>setShowLamieraDisegno(false)}
                  style={{flex:'0 0 auto',padding:'12px 16px',borderRadius:12,textAlign:'center',
                    fontSize:13,fontWeight:600,cursor:'pointer',
                    background:'#F1F5F9',color:'#64748B'}}>
                  Annulla
                </div>
                {/* ESPORTA */}
                {allSegs.length>0 && (
                  <div onClick={()=>{
                    const dirsym=(d:string)=>d==='dx'?'→':d==='sx'?'←':d==='giu'?'↓':'↑';
                    const parti=[
                      'LAMIERA '+(v.lamiera||''),
                      lamieraLatoInfisso?'Lato: '+lamieraLatoInfisso.toUpperCase():'',
                      lamieraLunghezza?'Lunghezza: '+lamieraLunghezza+'mm':'',
                      'Sviluppata: '+sviluppata+'mm',
                      'Lato buono: '+lamieraLatoBuono.toUpperCase(),
                      'Pieghe ('+allSegs.length+'):',
                    ].filter(Boolean);
                    const piegheStr=allSegs.map((s,i)=>'  '+(i+1)+'. '+dirsym(s.dir)+' '+s.mm+'mm'+(s.angolo&&s.angolo!==90?' @ '+s.angolo+'deg':'')).join('\n');
                    const testo=parti.join('\n')+'\n'+piegheStr;
                    if(navigator.clipboard){navigator.clipboard.writeText(testo);}
                    alert('Copiato negli appunti!\n\n'+testo.slice(0,300));
                  }}
                    style={{flex:'0 0 auto',padding:'12px 14px',borderRadius:12,textAlign:'center',
                      fontSize:12,fontWeight:700,cursor:'pointer',
                      background:'#3B7FE010',color:'#3B7FE0',border:'1.5px solid #3B7FE040',
                      display:'flex',alignItems:'center',gap:6}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Esporta
                  </div>
                )}
                <div onClick={()=>{
                  // Salva nella lista lamiere
                  // Usa selectedVano?.lamiere ma con fallback robusto
                  const lamTarget = (window as any).__mastroLamieraTarget || 'lamiere';
                  (window as any).__mastroLamieraTarget = 'lamiere'; // reset
                  const lamListSave: any[] = (selectedVano?.[lamTarget] as any) || [];
                  const editData = {
                    pieghe: lamieraPieghe,
                    latoBuono: lamieraLatoBuono,
                    latoInfisso: lamieraLatoInfisso,
                    lunghezza: lamieraLunghezza
                  };
                  if (lamieraEditIdx !== null && lamieraEditIdx < lamListSave.length) {
                    const updated = lamListSave.map((l: any, i: number) => i === lamieraEditIdx
                      ? {...l, ...editData}
                      : l);
                    updateV(lamTarget, updated);
                  } else if (lamieraEditIdx !== null) {
                    const newLam = {id: Date.now().toString(), nome: (lamTarget==='lamiereSpallette'?'Lamiera Sp.':'Lamiera ')+(lamListSave.length+1), ...editData};
                    updateV(lamTarget, [...lamListSave, newLam]);
                  } else {
                    const newLam = {id: Date.now().toString(), nome: (lamTarget==='lamiereSpallette'?'Lamiera Sp.':'Lamiera ')+(lamListSave.length+1), ...editData};
                    updateV(lamTarget, [...lamListSave, newLam]);
                  }
                  setLamieraEditIdx(null);
                  setShowLamieraDisegno(false);
                }}
                  style={{flex:1,minWidth:120,padding:'12px',borderRadius:11,textAlign:'center',
                    fontSize:15,fontWeight:800,cursor:'pointer',
                    background:'#1A2B4A',color:'#fff',
                    boxShadow:'0 4px 0 #111E33',
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Salva lamiera
                </div>
              </div>

            </div>
            {/* Safe area iOS */}
            <div style={{background:'#1A2B4A',height:'env(safe-area-inset-bottom,0px)',flexShrink:0,minHeight:0}}/>

            {/* ── TENDINA SCHIZZO LIBERO ── */}
            {lamieraSchizzoOpen && (
              <div style={{position:'absolute',
                bottom:0,left:0,right:0,
                top: (lamieraSchizzoFull || lamieraFullscreen) ? 0 : 'auto',
                zIndex:10,
                background:'#fff',
                borderTop: lamieraSchizzoFull ? 'none' : '2px solid #1A2B4A',
                borderRadius: lamieraSchizzoFull ? 0 : '14px 14px 0 0',
                boxShadow:'0 -4px 20px rgba(0,0,0,0.15)',
                display:'flex',flexDirection:'column',
                height: (lamieraSchizzoFull || lamieraFullscreen) ? '100%' : '60%'}}>

                {/* Header tendina */}
                <div style={{display:'flex',alignItems:'center',gap:6,
                  padding:'7px 10px',borderBottom:'1px solid #E2E8F0',
                  flexShrink:0,background:'#fff'}}>
                  <span style={{fontSize:11,fontWeight:800,color:'#1A2B4A',marginRight:4}}>✏️ Schizzo</span>

                  {/* Penna / Gomma */}
                  {[{t:'pen',icon:'✒️',label:'Penna'},{t:'eraser',icon:'⬜',label:'Gomma'}].map(({t,icon,label})=>(
                    <div key={t} onClick={()=>setSchizzoTool(t as any)}
                      style={{padding:'4px 8px',borderRadius:7,cursor:'pointer',fontSize:10,fontWeight:700,
                        border:`1.5px solid ${schizzoTool===t?'#1A2B4A':'#E2E8F0'}`,
                        background:schizzoTool===t?'#1A2B4A':'#fff',
                        color:schizzoTool===t?'#fff':'#64748B'}}>
                      {icon}
                    </div>
                  ))}

                  {/* Spessore */}
                  {[{s:1.5,label:'S'},{s:3,label:'M'},{s:6,label:'L'}].map(({s,label})=>(
                    <div key={s} onClick={()=>setSchizzoSize(s)}
                      style={{width:28,height:28,borderRadius:7,cursor:'pointer',
                        border:`1.5px solid ${schizzoSize===s?'#1A2B4A':'#E2E8F0'}`,
                        background:schizzoSize===s?'#1A2B4A15':'#fff',
                        display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <div style={{width:s*2,height:s*2,borderRadius:'50%',background:schizzoSize===s?'#1A2B4A':'#94A3B8'}}/>
                    </div>
                  ))}

                  {/* Colori */}
                  {['#1A2B4A','#DC4444','#1A9E73','#D08008','#3B7FE0','#000000'].map(c=>(
                    <div key={c} onClick={()=>{setSchizzoColor(c);setSchizzoTool('pen');}}
                      style={{width:20,height:20,borderRadius:'50%',background:c,cursor:'pointer',flexShrink:0,
                        border:schizzoColor===c&&schizzoTool==='pen'?'2.5px solid #fff':'2px solid transparent',
                        boxShadow:schizzoColor===c&&schizzoTool==='pen'?`0 0 0 2px ${c}`:'none'}}/>
                  ))}

                  <div style={{marginLeft:'auto',display:'flex',gap:4,alignItems:'center'}}>
                    {/* Fullscreen toggle */}
                    <div onClick={()=>setLamieraSchizzoFull(f=>!f)}
                      style={{padding:'4px 7px',borderRadius:7,cursor:'pointer',fontSize:12,
                        border:'1.5px solid #E2E8F0',background:'#fff',color:'#64748B'}}>
                      {lamieraSchizzoFull?'⊡':'⊞'}
                    </div>
                    {/* Cancella */}
                    <div onClick={()=>{
                      const cv=schizzoCanvasRef.current;
                      const ctx=cv?.getContext('2d');
                      if(ctx&&cv) ctx.clearRect(0,0,cv.width,cv.height);
                    }} style={{padding:'4px 8px',borderRadius:7,background:'#FEE2E2',
                      color:'#DC4444',fontSize:10,fontWeight:700,cursor:'pointer',border:'1.5px solid #FCA5A5'}}>
                      ✕
                    </div>
                    {/* Chiudi */}
                    <div onClick={()=>{setLamieraSchizzoOpen(false);setLamieraSchizzoFull(false);}}
                      style={{fontSize:18,color:'#94A3B8',cursor:'pointer',fontWeight:300,lineHeight:1,padding:'0 2px'}}>×</div>
                  </div>
                </div>

                {/* Canvas schizzo */}
                <canvas ref={schizzoCanvasRef} width={1200} height={900}
                  style={{flex:1,width:'100%',height:'100%',
                    background:'#FAFAFA',
                    cursor:schizzoTool==='eraser'?'cell':'crosshair',
                    touchAction:'none'}}
                  onPointerDown={e=>{
                    const cv=schizzoCanvasRef.current;
                    if(!cv) return;
                    cv.setPointerCapture(e.pointerId);
                    schizzoDrawing.current=true;
                    const r=cv.getBoundingClientRect();
                    const sx=cv.width/r.width, sy=cv.height/r.height;
                    const ctx=cv.getContext('2d');
                    if(ctx){
                      ctx.beginPath();
                      ctx.moveTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);
                      if(schizzoTool==='eraser'){
                        ctx.globalCompositeOperation='destination-out';
                        ctx.lineWidth=schizzoSize*6;
                      } else {
                        ctx.globalCompositeOperation='source-over';
                        ctx.strokeStyle=schizzoColor;
                        ctx.lineWidth=schizzoSize;
                      }
                      ctx.lineCap='round';
                      ctx.lineJoin='round';
                    }
                  }}
                  onPointerMove={e=>{
                    if(!schizzoDrawing.current) return;
                    const cv=schizzoCanvasRef.current;
                    const ctx=cv?.getContext('2d');
                    if(ctx&&cv){
                      const r=cv.getBoundingClientRect();
                      const sx=cv.width/r.width, sy=cv.height/r.height;
                      ctx.lineTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);
                      ctx.stroke();
                    }
                  }}
                  onPointerUp={()=>{schizzoDrawing.current=false;}}
                  onPointerLeave={()=>{schizzoDrawing.current=false;}}
                />
              </div>
            )}
          </div>
        );
      })()}

      {/* ── BOX EDITOR 3D ── */}
      {showBoxEditor && (
        <BoxEditor onClose={() => setShowBoxEditor(false)} />
      )}

      {/* ── CASSONETTO EDITOR ── */}
      {showCassonettoEditor && (() => {
        const v2 = selectedVano;
        if (!v2) return null;
        const m2 = v2.misure || {};
        return (
          <CassonettoEditor
            misure={{
              casL: m2.casL || 0,
              casH: m2.casH || 0,
              casP: m2.casP || 0,
              casLCiel: m2.casLCiel || 0,
              casPCiel: m2.casPCiel || 0,
            }}
            onUpdate={(field, val) => updateMisura(v2.id, field, val)}
            onClose={() => setShowCassonettoEditor(false)}
          />
        );
      })()}

</div>

    );
  }; // end renderBody

  return renderBody();
}
