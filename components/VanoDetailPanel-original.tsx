"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — VanoDetailPanel
// Estratto S4: ~1.505 righe (Dettaglio vano + misure + disegno + accessori)
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMastro } from "./MastroContext";
import { FF, FM, ICO, Ico, TIPOLOGIE_RAPIDE, ZANZ_CATEGORIE } from "./mastro-constants";
import DisegnoTecnico from "./DisegnoTecnico";

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
    goBack, updateMisura, updateMisureBatch, updateVanoField,
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
    spCanvasRef, canvasRef, fotoVanoRef, videoVanoRef, openCamera,
  } = useMastro();

  const STEPS = [
    { id: "misure", title: "MISURE", desc: "Larghezze, altezze e diagonali", color: "#507aff", icon: "📏" },
    { id: "dettagli", title: "DETTAGLI", desc: "Spallette, davanzale, accessori, foto", color: "#af52de", icon: "⚙" },
    { id: "riepilogo", title: "RIEPILOGO", desc: "Anteprima completa del vano", color: "#34c759", icon: "📋" },
  ];
  const [detailOpen, setDetailOpen] = useState<Record<string,boolean>>({});
  const [showDisegno, setShowDisegno] = useState(false);
  // === FLASH CONFIGURATORE ===
  const [flashSec, setFlashSec] = useState<string|null>(null);
  const [completedSecs, setCompletedSecs] = useState<Set<string>>(new Set());
  const sectionRefs = useRef<Record<string,HTMLDivElement|null>>({});
  const SECTION_ORDER = ["accesso","tipologia","posizione","sistema","colori","telaio","finiture","controtelaio"];
  const flashAndAdvance = (secId: string) => {
    console.log("🔥 FLASH:", secId);
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

  // Save ALL voice text as note on the vano (recognized or not)
  const saveVoiceNote = useCallback((text: string, parsed: Record<string, any>) => {
    if (!selectedVano || !selectedRilievo) return;
    const mid = selectedVano.id;
    const time = new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
    const parsedKeys = Object.keys(parsed);
    const prefix = parsedKeys.length > 0 ? "🎤" : "🎤💬";
    const newNote = `${prefix} [${time}] ${text}`;
    const existing = selectedVano.note || "";
    const updatedNote = existing ? `${existing}\n${newNote}` : newNote;
    updateVanoField(mid, "note", updatedNote);
  }, [selectedVano, selectedRilievo, updateVanoField]);

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
          applyParsed(parsed);
        }
        // ALWAYS save raw text as note on the vano
        saveVoiceNote(finalText.trim(), parsed);
        setVrInterim("");
      }
    };
    recognitionRef.current = rec;
    try { rec.start(); } catch(e) { setVrError("Errore avvio microfono."); }
  }, [parseVoiceText, applyParsed, saveVoiceNote]);

  const vrStop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }
    setVrActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { if (recognitionRef.current) try { recognitionRef.current.stop(); } catch(e) {} }, []);

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

    // Mini SVG per step
    const MiniSVG = ({ type }) => {
      const w = 60, h = 70;
      return (
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ display: "block" }}>
          <rect x={5} y={5} width={w-10} height={h-10} fill={step.color + "12"} stroke={step.color + "40"} strokeWidth={1.5} rx={3} />
          {type === "larghezze" && <>
            <line x1={10} y1={18} x2={w-10} y2={18} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={10} y1={h/2} x2={w-10} y2={h/2} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={10} y1={h-18} x2={w-10} y2={h-18} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
          </>}
          {type === "altezze" && <>
            <line x1={14} y1={10} x2={14} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={w/2} y1={10} x2={w/2} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={w-14} y1={10} x2={w-14} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
          </>}
          {type === "diagonali" && <>
            <line x1={10} y1={10} x2={w-10} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
            <line x1={w-10} y1={10} x2={10} y2={h-10} stroke={step.color} strokeWidth={1.2} strokeDasharray="3,2" />
          </>}
          {type === "spallette" && <>
            <rect x={2} y={5} width={10} height={h-10} fill={step.color + "25"} stroke={step.color+"60"} rx={1} />
            <rect x={w-12} y={5} width={10} height={h-10} fill={step.color + "25"} stroke={step.color+"60"} rx={1} />
            <rect x={5} y={2} width={w-10} height={8} fill={step.color + "18"} stroke={step.color+"40"} rx={1} />
          </>}
          {type === "davanzale" && <>
            <rect x={5} y={h-16} width={w-10} height={10} fill={step.color + "25"} stroke={step.color+"60"} rx={1} />
          </>}
        </svg>
      );
    };

    // Inline input renderer (no sub-component = no focus loss)
    const bInput = (label, field) => (
      <div key={field} style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 4 }}>{label}</div>
        <input
          key={`input-${field}`}
          style={{ width: "100%", padding: "14px 16px", fontSize: 17, fontWeight: 500, fontFamily: FM, textAlign: "center", border: `1px solid ${T.bdr}`, borderRadius: 12, background: m[field] > 0 ? step.color + "08" : T.card, color: T.text, outline: "none", boxSizing: "border-box" }}
          type="number" inputMode="numeric" placeholder="Tocca per inserire" value={m[field] || ""}
          onChange={e => updateMisura(v.id, field, e.target.value)}
        />
      </div>
    );

    return (
      <div style={{ paddingBottom: 80, background: T.bg }}>
        {/* Back + vano name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", background: T.card, borderBottom: `1px solid ${T.bdr}` }}>
          <div onClick={() => { setSelectedVano(null); setVanoStep(0); }} style={{ cursor: "pointer", padding: 4 }}><Ico d={ICO.back} s={20} c={T.sub} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{v.nome}</div>
            <div style={{ fontSize: 10, color: T.sub }}>{TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.label || v.tipo} · {v.stanza} · {v.piano}</div>
          </div>
          <div onClick={() => { setShowAIPhoto(true); setAiPhotoStep(0); }} style={{ padding: "5px 10px", borderRadius: 8, background: "linear-gradient(135deg, #af52de20, #007aff20)", border: "1px solid #af52de40", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 14 }}>🤖</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#af52de" }}>AI</span>
          </div>
        </div>

        {/* ═══ STORICO: BANNER SOLA LETTURA ═══ */}
        {isStorico && (
          <div style={{ margin: "0 16px 8px", padding: "10px 14px", borderRadius: 10, background: "#5856d610", border: "1.5px solid #5856d630", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>🔒</span>
            <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: "#5856d6" }}>
              Rilievo storico — sola lettura
            </div>
          </div>
        )}

        {/* ═══ VOCE AI SOPRALLUOGO — Self-contained ═══ */}
        <div style={{ margin: "8px 16px" }}>
          {/* Main button */}
          <div onClick={vrActive ? vrStop : vrStart}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 20px", borderRadius: 16, background: vrActive ? "linear-gradient(135deg, #ff3b30, #ff6b6b)" : "linear-gradient(135deg, #D08008, #b86e00)", border: "none", cursor: "pointer", justifyContent: "center", boxShadow: vrActive ? "0 0 20px rgba(255,59,48,0.4)" : "0 2px 8px rgba(208,128,8,0.3)" }}>
            <span style={{ fontSize: 22 }}>{vrActive ? "⏹" : "🎙️"}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>
              {vrActive ? "⏺ STOP REGISTRAZIONE" : "🎙️ Avvia Dettatura"}
            </span>
            {vrActive && <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", animation: "pulse 1s infinite" }} />}
          </div>
          <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.8)} }`}</style>

          {/* Error */}
          {vrError && (
            <div style={{ marginTop: 6, padding: "6px 12px", borderRadius: 8, background: "#ffebee", border: "1px solid #ef9a9a", fontSize: 10, color: "#c62828", textAlign: "center" }}>
              ⚠️ {vrError}
            </div>
          )}

          {/* Hint when active */}
          {vrActive && (
            <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 8, background: "#ff3b3008", border: "1px dashed #ff3b3040", fontSize: 9, color: "#666", textAlign: "center", lineHeight: 1.6 }}>
              🔴 <b>Parla ora</b> — Es: "Finestra due ante, soggiorno, piano terra, larghezza 1400, altezza 1200, tapparella motorizzata, bicolore bianco grigio"
            </div>
          )}

          {/* Interim (live) */}
          {vrActive && vrInterim && (
            <div style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8, background: "#fff8e1", border: "1px solid #ffe082", fontSize: 12, color: "#f57f17", fontStyle: "italic" }}>
              🎤 {vrInterim}...
            </div>
          )}

          {/* Transcripts history */}
          {vrTranscripts.length > 0 && (
            <div style={{ marginTop: 8, borderRadius: 10, border: `1px solid ${T.bdr}`, overflow: "hidden", maxHeight: 200, overflowY: "auto" }}>
              <div style={{ padding: "4px 10px", background: T.acc + "10", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: T.acc, textTransform: "uppercase" }}>📝 Trascrizioni ({vrTranscripts.length})</span>
                <span onClick={() => setVrTranscripts([])} style={{ fontSize: 9, color: T.red, cursor: "pointer", fontWeight: 700 }}>🗑 Pulisci</span>
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
                          ✓ {k}: {String(val)}
                        </span>
                      ))}
                    </div>
                  )}
                  {tr.parsed && Object.keys(tr.parsed).length === 0 && (
                    <div style={{ fontSize: 8, color: T.orange, fontWeight: 600, marginTop: 1 }}>⚠ Nessun campo riconosciuto — salvata come nota</div>
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
            { id:"accesso", icon:"🏗", label:"Accesso / Difficoltà",
              badge: v.difficoltaSalita||null, filled: [v.difficoltaSalita, v.mezzoSalita].filter(Boolean).length, total: 2,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:4}}>
                  {[{id:"facile",l:"Facile",c:T.grn,e:"✅"},{id:"media",l:"Media",c:T.orange,e:"⚠️"},{id:"difficile",l:"Difficile",c:T.red,e:"🔴"}].map(d=>(
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
            { id:"tipologia", icon:"🪟", label:"Tipologia",
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
                <div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch"}}>
                  {tipologieFiltrate.filter(t=>t.cat===tipCat).map(t=>(
                    <div key={t.code} onClick={()=>{console.log("🪟 TIPO TAP:",t.code);updateV("tipo",t.code);flashAndAdvance("tipologia");}}
                      style={{padding:"7px 10px",borderRadius:10,border:`1.5px solid ${v.tipo===t.code?T.acc:T.bdr}`,background:v.tipo===t.code?T.accLt:T.card,fontSize:11,fontWeight:700,color:v.tipo===t.code?T.acc:T.text,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
                      {t.icon} {t.code}
                    </div>
                  ))}
                </div>
              </div>
            },
            { id:"posizione", icon:"🏠", label:"Stanza / Piano",
              badge: v.stanza?`${v.stanza} · ${v.piano}`:null, filled: [v.stanza, v.piano].filter(Boolean).length, total: 2,
              body: <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>STANZA</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {["Soggiorno","Cucina","Camera","Cameretta","Bagno","Studio","Ingresso","Corridoio","Altro"].map(x=>(
                      <div key={x} onClick={()=>{updateV("stanza",x);if(v.piano)setTimeout(()=>flashAndAdvance("posizione"),150);}}
                        style={{padding:"7px 12px",borderRadius:8,border:"2px solid "+(v.stanza===x?T.acc:T.bdr),background:v.stanza===x?T.accLt:T.card,fontSize:12,fontWeight:v.stanza===x?700:500,color:v.stanza===x?T.acc:T.text,cursor:"pointer",transition:"all 0.15s"}}>
                        {x}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.5px"}}>PIANO</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {pianiList.map(p=>(
                      <div key={p} onClick={()=>{updateV("piano",p);if(v.stanza)setTimeout(()=>flashAndAdvance("posizione"),150);}}
                        style={{padding:"7px 10px",borderRadius:8,border:"2px solid "+(v.piano===p?T.blu:T.bdr),background:v.piano===p?T.blu+"12":T.card,fontSize:11,fontWeight:v.piano===p?700:500,color:v.piano===p?T.blu:T.text,cursor:"pointer",transition:"all 0.15s"}}>
                        {p==="PT"?"PT Terra":p==="S1"?"S1":p==="S2"?"S2":p==="M"?"Mans.":p}
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
            { id:"sistema", icon:"⚙️", label:"Sistema / Vetro",
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
            { id:"colori", icon:"🎨", label:"Colori profili",
              badge: v.coloreInt||null, filled: [v.coloreInt, v.bicolore && v.coloreEst, v.coloreAcc].filter(Boolean).length, total: v.bicolore ? 3 : 2,
              body: <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {!v.sistema && <div style={{padding:"14px",textAlign:"center",color:T.sub,fontSize:12,background:T.bg,borderRadius:10,border:"1px dashed "+T.bdr}}>⚠️ Scegli prima il sistema profili</div>}
                {v.sistema && <>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub}}>COLORE {v.bicolore?"INTERNO":"PROFILI"}</div>
                  <div onClick={()=>updateV("bicolore",!v.bicolore)}
                    style={{fontSize:10,padding:"2px 8px",borderRadius:4,background:v.bicolore?T.accLt:"transparent",border:"1px solid "+(v.bicolore?T.acc:T.bdr),color:v.bicolore?T.acc:T.sub,cursor:"pointer",fontWeight:600}}>
                    Bicolore {v.bicolore?"✓":""}
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
            { id:"telaio", icon:"📐", label:"Telaio / Rifilato",
              badge: v.telaio?(v.telaio==="Z"?"Telaio Z":"Telaio L"):(v.rifilato?"Rifilato":null), filled: [v.telaio, v.rifilato, v.telaioAlaZ].filter(Boolean).length, total: 2,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{display:"flex",gap:6}}>
                  {[{id:"Z",l:"Telaio a Z"},{id:"L",l:"Telaio a L"}].map(t=>(
                    <div key={t.id} onClick={()=>updateV("telaio",v.telaio===t.id?"":t.id)}
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
            { id:"finiture", icon:"🔩", label:"Coprifilo / Lamiera",
              badge: (v.coprifilo||v.lamiera)?"✓":null, filled: [v.coprifilo, v.lamiera].filter(Boolean).length, total: 2,
              body: <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase"}}>COPRIFILO</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    <div onClick={()=>updateV("coprifilo","")} style={{padding:"7px 10px",borderRadius:8,border:"2px solid "+(!v.coprifilo?T.sub+"40":T.bdr),background:!v.coprifilo?T.bg:T.card,fontSize:11,fontWeight:!v.coprifilo?700:500,color:!v.coprifilo?T.sub:T.text,cursor:"pointer"}}>Nessuno</div>
                    {coprifiliDB.map(c=>{
                      const sel=v.coprifilo===c.cod;
                      return <div key={c.id} onClick={()=>{updateV("coprifilo",c.cod);}}
                        style={{padding:"7px 10px",borderRadius:8,border:"2px solid "+(sel?T.acc:T.bdr),background:sel?T.accLt:T.card,fontSize:11,fontWeight:sel?700:500,color:sel?T.acc:T.text,cursor:"pointer",transition:"all 0.15s"}}>
                        {c.cod}
                      </div>;
                    })}
                  </div>
                </div>
                <div>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase"}}>LAMIERA</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    <div onClick={()=>updateV("lamiera","")} style={{padding:"7px 10px",borderRadius:8,border:"2px solid "+(!v.lamiera?T.sub+"40":T.bdr),background:!v.lamiera?T.bg:T.card,fontSize:11,fontWeight:!v.lamiera?700:500,color:!v.lamiera?T.sub:T.text,cursor:"pointer"}}>Nessuna</div>
                    {lamiereDB.map(l=>{
                      const sel=v.lamiera===l.cod;
                      return <div key={l.id} onClick={()=>{updateV("lamiera",l.cod);setTimeout(()=>flashAndAdvance("finiture"),150);}}
                        style={{padding:"7px 10px",borderRadius:8,border:"2px solid "+(sel?T.acc:T.bdr),background:sel?T.accLt:T.card,fontSize:11,fontWeight:sel?700:500,color:sel?T.acc:T.text,cursor:"pointer",transition:"all 0.15s"}}>
                        {l.cod}
                      </div>;
                    })}
                  </div>
                </div>
              </div>},
            { id:"controtelaio", icon:"🔲", label:"Controtelaio",
              badge: v.controtelaio?.tipo ? (v.controtelaio.tipo==="singolo"?"Singolo":v.controtelaio.tipo==="doppio"?"Doppio":"Con cassonetto") : null, filled: v.controtelaio?.tipo ? 1 : 0, total: 1,
              body: <div style={{display:"flex",flexDirection:"column",gap:8}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:2}}>TIPO CONTROTELAIO</div>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {[{id:"",l:"Nessuno",c:T.sub},{id:"singolo",l:"Singolo",c:"#2563eb"},{id:"doppio",l:"Doppio",c:"#7c3aed"},{id:"cassonetto",l:"Con Cassonetto",c:"#b45309"}].map(ct=>(
                    <div key={ct.id} onClick={()=>updateV("controtelaio",{...(v.controtelaio||{}),tipo:ct.id})}
                      style={{flex:1,padding:"8px 6px",borderRadius:8,border:`1.5px solid ${v.controtelaio?.tipo===ct.id?ct.c:T.bdr}`,background:v.controtelaio?.tipo===ct.id?ct.c+"15":T.card,textAlign:"center",cursor:"pointer",minWidth:70}}>
                      <div style={{fontSize:11,fontWeight:700,color:v.controtelaio?.tipo===ct.id?ct.c:T.sub}}>{ct.l}</div>
                    </div>
                  ))}
                </div>
                {v.controtelaio?.tipo==="singolo" && <>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>LARGHEZZA</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.l||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,l:parseInt(e.target.value)||0})}/></div>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>ALTEZZA</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.h||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,h:parseInt(e.target.value)||0})}/></div>
                  </div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>PROFONDITÀ</div>
                    <select style={S.select} value={v.controtelaio?.prof||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,prof:e.target.value})}>
                      <option value="">— Seleziona —</option>
                      {ctProfDB.map(p=><option key={p.id} value={p.code}>{p.code} mm</option>)}
                    </select></div>
                  {v.controtelaio?.l > 0 && v.controtelaio?.h > 0 && (
                    <div onClick={()=>{
                      const off = ctOffset;
                      const cl = v.controtelaio.l - off*2;
                      const ch = v.controtelaio.h - off*2;
                      updateMisureBatch(v.id, { lAlto: cl, lCentro: cl, lBasso: cl });
                      updateMisureBatch(v.id, { hSx: ch, hCentro: ch, hDx: ch });
                    }} style={{padding:"10px",borderRadius:10,background:"#2563eb15",border:"1.5px solid #2563eb40",textAlign:"center",cursor:"pointer"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#2563eb"}}>⚡ Calcola infisso (offset −{ctOffset}mm/lato)</div>
                      <div style={{fontSize:10,color:"#2563eb80",marginTop:2}}>{v.controtelaio.l-ctOffset*2} × {v.controtelaio.h-ctOffset*2} mm</div>
                    </div>
                  )}
                </>}
                {v.controtelaio?.tipo==="doppio" && <>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>LARGHEZZA</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.l||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,l:parseInt(e.target.value)||0})}/></div>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>ALTEZZA</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.h||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,h:parseInt(e.target.value)||0})}/></div>
                  </div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>SEZIONE INTERNA (infisso interno)</div>
                    <select style={S.select} value={v.controtelaio?.sezInt||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,sezInt:e.target.value})}>
                      <option value="">— Seleziona —</option>
                      {ctSezioniDB.map(s=><option key={s.id} value={s.code}>{s.code}</option>)}
                    </select></div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>SEZIONE ESTERNA (infisso esterno)</div>
                    <select style={S.select} value={v.controtelaio?.sezEst||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,sezEst:e.target.value})}>
                      <option value="">— Seleziona —</option>
                      {ctSezioniDB.map(s=><option key={s.id} value={s.code}>{s.code}</option>)}
                    </select></div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>DISTANZIALE</div>
                    <input style={S.input} type="text" placeholder="es. 30mm" value={v.controtelaio?.distanziale||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,distanziale:e.target.value})}/></div>
                  {v.controtelaio?.l > 0 && v.controtelaio?.h > 0 && (
                    <div onClick={()=>{
                      const off = ctOffset;
                      const cl = v.controtelaio.l - off*2;
                      const ch = v.controtelaio.h - off*2;
                      updateMisureBatch(v.id, { lAlto: cl, lCentro: cl, lBasso: cl });
                      updateMisureBatch(v.id, { hSx: ch, hCentro: ch, hDx: ch });
                    }} style={{padding:"10px",borderRadius:10,background:"#7c3aed15",border:"1.5px solid #7c3aed40",textAlign:"center",cursor:"pointer"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#7c3aed"}}>⚡ Calcola infisso (offset −{ctOffset}mm/lato)</div>
                      <div style={{fontSize:10,color:"#7c3aed80",marginTop:2}}>{v.controtelaio.l-ctOffset*2} × {v.controtelaio.h-ctOffset*2} mm</div>
                    </div>
                  )}
                </>}
                {v.controtelaio?.tipo==="cassonetto" && <>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>LARGH. VANO</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.l||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,l:parseInt(e.target.value)||0})}/></div>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>ALT. MAX VANO</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.h||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,h:parseInt(e.target.value)||0})}/></div>
                  </div>
                  <div style={{marginTop:4,padding:"6px 0",borderTop:`1px dashed ${T.bdr}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4}}>CASSONETTO</div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>H CASSONETTO</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.hCass||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,hCass:parseInt(e.target.value)||0})}/></div>
                    <div style={{flex:1}}><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>P CASSONETTO</div>
                      <input style={S.input} type="number" inputMode="numeric" placeholder="mm" value={v.controtelaio?.pCass||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,pCass:parseInt(e.target.value)||0})}/></div>
                  </div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>SEZIONE CONTROTELAIO</div>
                    <select style={S.select} value={v.controtelaio?.sezione||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,sezione:e.target.value})}>
                      <option value="">— Seleziona —</option>
                      {ctSezioniDB.map(s=><option key={s.id} value={s.code}>{s.code}</option>)}
                    </select></div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>SPALLA CONTROTELAIO</div>
                    <input style={S.input} type="text" placeholder="es. 120mm" value={v.controtelaio?.spalla||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,spalla:e.target.value})}/></div>
                  <div><div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:2}}>MODELLO CIELINO</div>
                    <select style={S.select} value={v.controtelaio?.cielino||""} onChange={e=>updateV("controtelaio",{...v.controtelaio,cielino:e.target.value})}>
                      <option value="">— Seleziona —</option>
                      {ctCieliniDB.map(c=><option key={c.id} value={c.code}>{c.code}</option>)}
                    </select></div>
                  {v.controtelaio?.l > 0 && v.controtelaio?.h > 0 && (
                    <div onClick={()=>{
                      const off = ctOffset;
                      const cl = v.controtelaio.l - off*2;
                      const hInf = v.controtelaio.h - (v.controtelaio.hCass||0) - off*2;
                      updateMisureBatch(v.id, { lAlto: cl, lCentro: cl, lBasso: cl });
                      updateMisura(v.id,"hSx",hInf); updateMisura(v.id,"hCentro",hInf); updateMisura(v.id,"hDx",hInf);
                    }} style={{padding:"10px",borderRadius:10,background:"#b4530915",border:"1.5px solid #b4530940",textAlign:"center",cursor:"pointer"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#b45309"}}>⚡ Calcola infisso (offset −{ctOffset}mm/lato)</div>
                      <div style={{fontSize:10,color:"#b4530980",marginTop:2}}>L: {v.controtelaio.l-ctOffset*2} · H: {v.controtelaio.h-(v.controtelaio.hCass||0)-ctOffset*2} mm</div>
                    </div>
                  )}
                </>}
              </div>
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
                  <span style={{fontSize:12}}>✅</span>
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
                    style={{marginBottom:3,borderRadius:10,border:"1px solid "+(isOpen?T.acc+"50":isDone?T.grn+"40":hasFill?T.grn+"30":T.bdr),overflow:"hidden",transition:"border-color 0.3s, box-shadow 0.3s",boxShadow:isOpen?"0 2px 10px "+T.acc+"12":"none"}}>
                    <div onClick={()=>setVanoInfoOpen(isOpen?null:sec.id)}
                      style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:isFlashing?T.grn+"12":isOpen?T.acc+"05":T.card,cursor:"pointer",transition:"background 0.3s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:7}}>
                        <span style={{fontSize:14}}>{sec.icon}</span>
                        <span style={{fontSize:12,fontWeight:600,color:isOpen?T.acc:T.text}}>{sec.label}</span>
                        {isOptional && !hasFill && <span style={{fontSize:9,color:T.sub,fontStyle:"italic"}}>opz.</span>}
                        {sec.badge && <span className={isFlashing?"m-badge-pop":""} style={{...S.badge(isDone?T.grn+"15":T.accLt, isDone?T.grn:T.acc),fontSize:9,padding:"1px 6px"}}>{sec.badge}</span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        {isDone && <span style={{width:8,height:8,borderRadius:"50%",background:T.grn,display:"inline-block"}} />}
                        {hasFill && !isDone && <span style={{fontSize:9,fontWeight:700,color:allFill?T.grn:T.orange}}>{sec.filled}/{sec.total}</span>}
                        <span style={{fontSize:9,color:T.sub,display:"inline-block",transform:isOpen?"rotate(180deg)":"none",transition:"transform 0.15s"}}>▼</span>
                      </div>
                    </div>
                    {isOpen && <div className="m-slide" style={{padding:"12px",background:T.bg,borderTop:"1px solid "+T.bdr}}>
                      {sec.body}
                      {isOptional && <div onClick={()=>flashAndAdvance(sec.id)} style={{marginTop:8,padding:"8px",borderRadius:8,border:"1px dashed "+T.bdr,textAlign:"center",fontSize:11,color:T.sub,cursor:"pointer"}}>Salta →</div>}
                    </div>}
                  </div>
                );
              })}
            </div>

            {/* ══════ STRUTTURE ══════ */}
            <div style={{marginTop:8,borderRadius:10,border:"1px solid #3B7FE030",overflow:"hidden"}}>
              <div onClick={()=>setVanoInfoOpen(vanoInfoOpen==="strutture"?null:"strutture")}
                style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"rgba(59,127,224,0.05)",cursor:"pointer"}}>
                <span style={{fontSize:14}}>🏗️</span>
                <span style={{fontSize:12,fontWeight:600,color:vanoInfoOpen==="strutture"?"#3B7FE0":T.text}}>Strutture</span>
                <span style={{fontSize:9,color:T.sub,fontStyle:"italic"}}>Pergole, Verande, Box</span>
                <span style={{marginLeft:"auto",fontSize:9,color:T.sub,transform:vanoInfoOpen==="strutture"?"rotate(180deg)":"none",transition:"transform 0.15s"}}>▼</span>
              </div>
              {vanoInfoOpen==="strutture" && (
                <div style={{padding:12,background:T.bg,borderTop:"1px solid "+T.bdr}}>
                  <div style={{textAlign:"center",padding:"20px 10px"}}>
                    <div style={{fontSize:36,marginBottom:8}}>🏗️</div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:4}}>Configuratore Strutture</div>
                    <div style={{fontSize:11,color:T.sub}}>Pianta → Lati → 3D per Pergole, Verande, Box Doccia, Ferro</div>
                    <div style={{marginTop:12,padding:"10px 14px",borderRadius:8,background:"#3B7FE010",border:"1px solid #3B7FE025",fontSize:11,color:"#3B7FE0",fontWeight:600}}>
                      ✅ Sezione attiva — Configuratore in arrivo
                    </div>
                  </div>
                </div>
              )}
            </div>

          );
        })()}

        {/* Dots progress */}
        <div style={{ display: "flex", justifyContent: "center", gap: 5, padding: "14px 16px 6px" }}>
          {STEPS.map((s, i) => (
            <div key={i} onClick={() => setVanoStep(i)} style={{ width: i === vanoStep ? 18 : 8, height: 8, borderRadius: 4, background: i === vanoStep ? s.color : i < vanoStep ? s.color + "60" : T.bdr, cursor: "pointer", transition: "all 0.2s" }} />
          ))}
        </div>

        <div style={{ padding: "8px 16px" }}>
          {/* Step header card */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: step.color + "10", borderRadius: 14, border: `1px solid ${step.color}25`, marginBottom: 12 }}>
            <div style={{ width: 50, height: 50, borderRadius: 12, background: step.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{step.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: step.color }}>{step.icon} {step.title}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{step.desc}</div>
              {vanoStep === 0 && <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginTop: 2 }}>{["lAlto","lCentro","lBasso","hSx","hCentro","hDx","d1","d2"].filter(f => m[f] > 0).length}/8 inserite</div>}
            </div>
          </div>

          {/* Warnings */}
          {vanoStep === 0 && (hasWarnings || hasHWarnings) && (
            <div style={{ padding: "8px 14px", borderRadius: 10, background: "#fff3e0", border: "1px solid #ffe0b2", marginBottom: 12, fontSize: 11, color: "#e65100" }}>
              {hasWarnings && <div>⚠ Nessuna larghezza inserita</div>}
              {hasHWarnings && <div>⚠ Nessuna altezza inserita</div>}
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
                    <div style={{ padding:"10px 14px", borderRadius:10, background:"#ff950010", border:"1px solid #ff950030", marginBottom:12 }}>
                      <div style={{ fontSize:11, fontWeight:700, color:"#ff9500" }}>☀️ Misure {isPergola ? "Pergola" : isBracci ? "Tenda a bracci" : isVela ? "Vela ombreggiante" : "Tenda/Schermatura"}</div>
                      <div style={{ fontSize:10, color:T.sub, marginTop:2 }}>{isPergola ? "Larghezza × Profondità × Altezza colonne" : isBracci ? "Larghezza telo × Sporgenza (aggetto)" : "Larghezza × Altezza (caduta)"}</div>
                    </div>

                    {/* LARGHEZZA — sempre presente */}
                    <div style={{ fontSize:11, fontWeight:800, color:"#507aff", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6 }}>📏 Larghezza</div>
                    {bInput("Larghezza mm", "lCentro")}

                    {/* ALTEZZA/DROP — sempre presente */}
                    <div style={{ fontSize:11, fontWeight:800, color:"#34c759", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, marginTop:12 }}>📐 {isPergola ? "Altezza colonne" : "Altezza / Drop"}</div>
                    {bInput(isPergola ? "Altezza colonne mm" : "Altezza (caduta) mm", "hCentro")}

                    {/* PROFONDITA/SPORGENZA — pergole e bracci */}
                    {(isPergola || isBracci) && (<>
                      <div style={{ fontSize:11, fontWeight:800, color:"#ff9500", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, marginTop:12 }}>↕️ {isPergola ? "Profondità" : "Sporgenza (Aggetto)"}</div>
                      {bInput(isPergola ? "Profondità mm" : "Sporgenza/Aggetto mm", "sporgenza")}
                    </>)}

                    {/* VELA: 3 lati */}
                    {isVela && (<>
                      <div style={{ fontSize:11, fontWeight:800, color:"#ff9500", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, marginTop:12 }}>📐 Lati vela</div>
                      {bInput("Lato 2 mm", "lAlto")}
                      {bInput("Lato 3 mm", "lBasso")}
                    </>)}

                    {/* PERGOLA: extra fields */}
                    {isPergola && (<>
                      <div style={{ fontSize:11, fontWeight:800, color:"#5856d6", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, marginTop:16, borderTop:"1px solid "+T.bdr, paddingTop:12 }}>🏗 Configurazione Pergola</div>
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
                    <div style={{ fontSize:11, fontWeight:800, color:"#86868b", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:6, marginTop:16, borderTop:"1px solid "+T.bdr, paddingTop:12 }}>⚙️ Installazione</div>
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
                      {bInput("Altezza montaggio da terra mm", "hMontaggio")}
                    </div>

                    {/* Riepilogo visivo */}
                    {m.lCentro > 0 && m.hCentro > 0 && (
                      <div style={{ marginTop:12, padding:12, borderRadius:10, background:T.card, border:"1px solid "+T.bdr, textAlign:"center" }}>
                        <div style={{ fontSize:10, color:T.sub, fontWeight:700, marginBottom:4 }}>📐 RIEPILOGO</div>
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

              {/* ═══ DISEGNO TECNICO — Condiviso con preventivo ═══ */}
              <div style={{ marginBottom: 14 }}>
                <div onClick={() => setShowDisegno(!showDisegno)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${showDisegno ? T.purple : T.bdr}`, background: showDisegno ? `${T.purple}08` : T.card, cursor: "pointer" }}>
                  <span style={{ fontSize: 14 }}>✏️</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: showDisegno ? T.purple : T.text, flex: 1 }}>Disegno tecnico</span>
                  <span style={{ fontSize: 9, color: T.sub, fontFamily: FM }}>{(m.lCentro || m.lAlto || 1200)}×{(m.hCentro || m.hSx || 1400)}mm</span>
                  {(v.disegno?.elements?.length > 0) && <span style={{ padding: "1px 6px", borderRadius: 4, background: `${T.grn}18`, fontSize: 8, fontWeight: 800, color: T.grn }}>{v.disegno.elements.length} el.</span>}
                  <span style={{ fontSize: 9, color: T.sub, transform: showDisegno ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▼</span>
                </div>
                {showDisegno && (
                  <DisegnoTecnico
                    vanoId={v.id}
                    vanoNome={v.nome || `Vano ${v.numero || ""}`}
                    vanoDisegno={v.disegno}
                    realW={m.lCentro || m.lAlto || 1200}
                    realH={m.hCentro || m.hSx || 1400}
                    onUpdate={(newDisegno) => updateVanoField(v.id, "disegno", newDisegno)}
                    onUpdateField={(field, value) => {
                      if (field === "larghezza") updateMisura(v.id, "lCentro", value);
                      if (field === "altezza") updateMisura(v.id, "hCentro", value);
                    }}
                    onClose={() => setShowDisegno(false)}
                    T={T}
                  />
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#507aff", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>📏 Larghezze</div>
              {bInput("Larghezza ALTO", "lAlto")}
              {m.lAlto > 0 && !m.lCentro && !m.lBasso && (
                <div onClick={() => { updateMisura(v.id, "lCentro", m.lAlto); updateMisura(v.id, "lBasso", m.lAlto); }} style={{ margin: "-4px 0 12px", padding: "10px", borderRadius: 10, background: T.accLt, border: `1px solid ${T.acc}40`, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.acc }}>
                  = Tutte uguali ({m.lAlto} mm)
                </div>
              )}
              {bInput("Larghezza CENTRO (luce netta)", "lCentro")}
              {bInput("Larghezza BASSO", "lBasso")}

              {/* ALTEZZE */}
              <div style={{ fontSize: 11, fontWeight: 800, color: "#34c759", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, marginTop: 16, display: "flex", alignItems: "center", gap: 6, borderTop: `1px solid ${T.bdr}`, paddingTop: 16 }}>📐 Altezze</div>
              {bInput("Altezza SINISTRA", "hSx")}
              {m.hSx > 0 && !m.hCentro && !m.hDx && (
                <div onClick={() => { updateMisura(v.id, "hCentro", m.hSx); updateMisura(v.id, "hDx", m.hSx); }} style={{ margin: "-4px 0 12px", padding: "10px", borderRadius: 10, background: T.accLt, border: `1px solid ${T.acc}40`, textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: T.acc }}>
                  = Tutte uguali ({m.hSx} mm)
                </div>
              )}
              {bInput("Altezza CENTRO", "hCentro")}
              {bInput("Altezza DESTRA", "hDx")}

              {/* DIAGONALI */}
              <div style={{ fontSize: 11, fontWeight: 800, color: "#ff9500", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, marginTop: 16, display: "flex", alignItems: "center", gap: 6, borderTop: `1px solid ${T.bdr}`, paddingTop: 16 }}>✕ Diagonali</div>
              {bInput("Diagonale 1 ↗", "d1")}
              {bInput("Diagonale 2 ↘", "d2")}
              {fSq !== null && fSq > 3 && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#ffebee", border: "1px solid #ef9a9a", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#c62828" }}>⚠ Fuori squadra: {fSq}mm</div>
                  <div style={{ fontSize: 11, color: "#b71c1c" }}>Differenza superiore a 3mm — segnalare in ufficio</div>
                </div>
              )}
              {fSq !== null && fSq <= 3 && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#e8f5e9", border: "1px solid #a5d6a7" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#2e7d32" }}>✅ In squadra — differenza: {fSq}mm</div>
                </div>
              )}
            </>)}
          </>
          )}

          {/* === STEP 1: DETTAGLI (accordion) === */}
          {vanoStep === 1 && (
            <>
              {/* Spallette */}
              <div onClick={() => setDetailOpen(d => ({...d, spallette: !d.spallette}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.spallette ? "#32ade6" : T.bdr}`, background: detailOpen.spallette ? "#32ade608" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🧱</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.spallette ? "#32ade6" : T.text }}>Spallette</span>
                  {(m.spSx||m.spDx||m.spSopra||m.imbotte) && <span style={{ fontSize: 10, color: "#32ade6", fontWeight: 700, background: "#32ade615", padding: "2px 8px", borderRadius: 6 }}>{[m.spSx,m.spDx,m.spSopra,m.imbotte].filter(x=>x>0).length}/4</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.spallette ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.spallette && (
                <div style={{ marginBottom: 12 }}>
              {bInput("Spalletta SINISTRA", "spSx")}
              {bInput("Spalletta DESTRA", "spDx")}
              {bInput("Spalletta SOPRA", "spSopra")}
              {bInput("Profondità IMBOTTE", "imbotte")}
              {/* DISEGNO LIBERO SPALLETTE */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, marginTop: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#32ade6" }}>✏️ Disegno spallette</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { const ctx = spCanvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, 380, 200); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>🗝‘ Pulisci</button>
                    <button style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: T.grn, color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>💾 Salva</button>
                  </div>
                </div>
                <canvas ref={spCanvasRef} width={380} height={200} style={{ width: "100%", height: 200, background: "#fff", touchAction: "none", cursor: "crosshair" }}
                  onPointerDown={e=>{spCanvasRef.current?.setPointerCapture(e.pointerId);setSpDrawing(true);const cv=spCanvasRef.current;const ctx=cv?.getContext("2d");if(ctx&&cv){const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;ctx.beginPath();ctx.moveTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.strokeStyle=penColor;ctx.lineWidth=penSize;ctx.lineCap="round";ctx.lineJoin="round";}}}
                  onPointerMove={e=>{if(!spDrawing)return;const cv=spCanvasRef.current;const ctx=cv?.getContext("2d");if(ctx&&cv){const r=cv.getBoundingClientRect();const sx=cv.width/r.width,sy=cv.height/r.height;ctx.lineTo((e.clientX-r.left)*sx,(e.clientY-r.top)*sy);ctx.stroke();}}}
                  onPointerUp={() => setSpDrawing(false)}
                  onPointerLeave={() => setSpDrawing(false)}
                />
                <div style={{ padding: "6px 14px", display: "flex", gap: 4 }}>
                  {["#1d1d1f", "#ff3b30", "#007aff", "#34c759", "#ff9500"].map(c => (
                    <div key={c} onClick={() => setPenColor(c)} style={{ width: 20, height: 20, borderRadius: "50%", background: c, border: penColor === c ? `3px solid ${T.acc}` : "2px solid transparent", cursor: "pointer" }} />
                  ))}
                  <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
                    {[1, 2, 4].map(s => (
                      <div key={s} onClick={() => setPenSize(s)} style={{ width: 22, height: 22, borderRadius: 6, background: penSize === s ? T.accLt : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <div style={{ width: s * 2 + 2, height: s * 2 + 2, borderRadius: "50%", background: T.text }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
                </div>
              )}
              {/* Davanzale + Cassonetto */}
              <div onClick={() => setDetailOpen(d => ({...d, davanzale: !d.davanzale}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.davanzale ? "#ff2d55" : T.bdr}`, background: detailOpen.davanzale ? "#ff2d5508" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⬇</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.davanzale ? "#ff2d55" : T.text }}>Davanzale + Cassonetto</span>
                  {(m.davProf||m.davSporg||m.soglia||v.cassonetto) && <span style={{ fontSize: 10, color: "#ff2d55", fontWeight: 700, background: "#ff2d5515", padding: "2px 8px", borderRadius: 6 }}>{v.cassonetto ? "🧊" : ""} {[m.davProf,m.davSporg,m.soglia].filter(x=>x>0).length}/3</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.davanzale ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.davanzale && (
                <div style={{ marginBottom: 12 }}>
              {bInput("Davanzale PROFONDITÀ", "davProf")}
              {bInput("Davanzale SPORGENZA", "davSporg")}
              {bInput("Altezza SOGLIA", "soglia")}
              {/* Cassonetto toggle */}
              <div style={{ marginTop: 8, padding: "12px 16px", borderRadius: 12, border: `1px dashed ${T.bdr}`, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => {
                const nv = { ...v, cassonetto: !v.cassonetto };
                setSelectedVano(nv);
                if(selectedRilievo){const updR3={...selectedRilievo,vani:selectedRilievo.vani.map(x=>x.id===v.id?nv:x)};setCantieri(cs=>cs.map(c=>c.id===selectedCM?.id?{...c,rilievi:c.rilievi.map(r2=>r2.id===selectedRilievo.id?updR3:r2)}:c));setSelectedRilievo(updR3);}
              }}>
                <span style={{ fontSize: 12, color: T.sub }}>+</span>
                <span style={{ fontSize: 14 }}>🧊</span>
                <span style={{ fontSize: 13, color: T.sub }}>{v.cassonetto ? "Cassonetto attivo" : "Ha un cassonetto? Tocca per aggiungere"}</span>
              </div>
              {v.cassonetto && (
                <div style={{ marginTop: 8 }}>
                  {bInput("Cassonetto LARGHEZZA", "casL")}
                  {bInput("Cassonetto ALTEZZA", "casH")}
                  {bInput("Cassonetto PROFONDITÀ", "casP")}
                  {bInput("Cielino LARGHEZZA", "casLCiel")}
                  {bInput("Cielino PROFONDITÀ", "casPCiel")}
                </div>
              )}
                </div>
              )}
              {/* Accessori */}
              <div onClick={() => setDetailOpen(d => ({...d, accessori: !d.accessori}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.accessori ? "#af52de" : T.bdr}`, background: detailOpen.accessori ? "#af52de08" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>✚</span>
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
                          <span style={{ fontSize: 12, color: T.sub }}>+ 🧊 Aggiungi Cassonetto</span>
                        </div>
                      ) : (
                        <>
                          <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.bdr}` }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: casColor }}>🧊 Cassonetto</span>
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
                              🗑 Rimuovi cassonetto
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }
                const a = v.accessori?.[acc] || { attivo: false };
                const accColors = { tapparella: "#ff9500", persiana: "#007aff", zanzariera: "#ff2d55" };
                const accIcons = { tapparella: "🪟", persiana: "🏠", zanzariera: "🦟" };
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
                                  <div key={mat} onClick={() => updateAccessorio(v.id, acc, "materiale", mat)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.materiale === mat ? "#ff9500" : T.bdr}`, background: v.accessori?.[acc]?.materiale === mat ? "#ff950018" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.materiale === mat ? 700 : 400, color: v.accessori?.[acc]?.materiale === mat ? "#ff9500" : T.text }}>{mat}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>Motorizzata</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                                {["Sì", "No"].map(mot => (
                                  <div key={mot} onClick={() => updateAccessorio(v.id, acc, "motorizzata", mot)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.motorizzata === mot ? "#34c759" : T.bdr}`, background: v.accessori?.[acc]?.motorizzata === mot ? "#34c75918" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.motorizzata === mot ? 700 : 400, color: v.accessori?.[acc]?.motorizzata === mot ? "#34c759" : T.text }}>{mot}</div>
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
                                  <div key={tp.id} onClick={() => updateAccessorio(v.id, acc, "telaio", tp.code)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.telaio === tp.code ? "#007aff" : T.bdr}`, background: v.accessori?.[acc]?.telaio === tp.code ? "#007aff18" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.telaio === tp.code ? 700 : 400, color: v.accessori?.[acc]?.telaio === tp.code ? "#007aff" : T.text }}>{tp.code}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6, textTransform: "uppercase" }}>4° Lato / Posizionamento</div>
                              <div style={{ display: "flex", gap: 4, marginBottom: 10, flexWrap: "wrap" }}>
                                {posPersianaDB.map(pp => (
                                  <div key={pp.id} onClick={() => updateAccessorio(v.id, acc, "posizionamento", pp.code)} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${v.accessori?.[acc]?.posizionamento === pp.code ? "#007aff" : T.bdr}`, background: v.accessori?.[acc]?.posizionamento === pp.code ? "#007aff18" : T.card, fontSize: 12, cursor: "pointer", fontWeight: v.accessori?.[acc]?.posizionamento === pp.code ? 700 : 400, color: v.accessori?.[acc]?.posizionamento === pp.code ? "#007aff" : T.text }}>{pp.code}</div>
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
                            🗝‘ Rimuovi {acc}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
                </div>
              )}
              {/* Voci Libere */}
              <div onClick={() => setDetailOpen(d => ({...d, vociLibere: !d.vociLibere}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.vociLibere ? "#ff9500" : T.bdr}`, background: detailOpen.vociLibere ? "#ff950008" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📦</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.vociLibere ? "#ff9500" : T.text }}>Voci libere</span>
                  {v.vociLibere?.length > 0 && <span style={{ fontSize: 10, color: "#ff9500", fontWeight: 700, background: "#ff950015", padding: "2px 8px", borderRadius: 6 }}>{v.vociLibere.length} voc{v.vociLibere.length === 1 ? "e" : "i"}</span>}
                </div>
                <span style={{ fontSize: 13, color: T.sub, transform: detailOpen.vociLibere ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
              </div>
              {detailOpen.vociLibere && (
                <div style={{ marginBottom: 12, padding: "0 4px" }}>
                  {(v.vociLibere || []).map((voce, vi) => (
                    <div key={voce.id || vi} style={{ padding: 10, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#ff9500" }}>Voce {vi + 1}</span>
                        <div onClick={() => {
                          const newVoci = (v.vociLibere || []).filter((_, i) => i !== vi);
                          updateVanoField(v.id, "vociLibere", newVoci);
                        }} style={{ fontSize: 10, color: T.red, cursor: "pointer", fontWeight: 600 }}>✕ Rimuovi</div>
                      </div>
                      {/* Foto */}
                      <div style={{ marginBottom: 6 }}>
                        {voce.foto ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <img src={voce.foto} style={{ height: 50, maxWidth: 80, objectFit: "cover", borderRadius: 6, border: `1px solid ${T.bdr}` }} alt="" />
                            <div onClick={() => {
                              const newVoci = [...(v.vociLibere || [])]; newVoci[vi] = { ...newVoci[vi], foto: undefined };
                              updateVanoField(v.id, "vociLibere", newVoci);
                            }} style={{ fontSize: 9, color: T.red, cursor: "pointer" }}>✕</div>
                          </div>
                        ) : (
                          <label style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "#ff950012", color: "#ff9500", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
                            📷 Foto
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
                      const newVoci = [...(v.vociLibere || []), { id: Date.now(), descrizione: "", prezzo: 0, unita: "pz", qta: 1 }];
                      updateVanoField(v.id, "vociLibere", newVoci);
                    }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px dashed #ff9500`, textAlign: "center", cursor: "pointer", color: "#ff9500", fontSize: 12, fontWeight: 600 }}>+ Voce vuota</div>
                    <div onClick={() => {
                      setDetailOpen(d => ({ ...d, showLibreria: !d.showLibreria }));
                    }} style={{ flex: 1, padding: 12, borderRadius: 10, border: `1px dashed ${T.acc}`, textAlign: "center", cursor: "pointer", color: T.acc, fontSize: 12, fontWeight: 600 }}>📦 Da libreria</div>
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
                              <div style={{ width: 32, height: 32, borderRadius: 4, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📦</div>
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
              <div onClick={() => setDetailOpen(d => ({...d, disegno: !d.disegno}))} style={{ padding: "12px 16px", borderRadius: 12, border: `1px solid ${detailOpen.disegno ? "#ff6b6b" : T.bdr}`, background: detailOpen.disegno ? "#ff6b6b08" : T.card, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>📷</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: detailOpen.disegno ? "#ff6b6b" : T.text }}>Foto + Note</span>
                  {(v.note) && <span style={{ fontSize: 10, color: "#ff6b6b", fontWeight: 700, background: "#ff6b6b15", padding: "2px 8px", borderRadius: 6 }}>📝</span>}
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
                    {["#1d1d1f", "#ff3b30", "#007aff", "#34c759", "#ff9500", "#af52de", "#ff2d55", "#ffffff"].map(c => (
                      <div key={c} onClick={() => { setPenColor(c); setDrawTool("pen"); }} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: penColor === c && drawTool === "pen" ? `3px solid ${T.acc}` : c === "#ffffff" ? `1px solid ${T.bdr}` : "2px solid transparent", cursor: "pointer" }} />
                    ))}
                    <div style={{ width: 1, height: 20, background: T.bdr, margin: "0 4px" }} />
                    {/* Gomma */}
                    <div onClick={() => setDrawTool(drawTool === "eraser" ? "pen" : "eraser")}
                      style={{ width: 32, height: 32, borderRadius: 8, background: drawTool === "eraser" ? "#ff3b30" + "18" : T.bg, border: drawTool === "eraser" ? "2px solid #ff3b30" : `1px solid ${T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <span style={{ fontSize: 14 }}>{drawTool === "eraser" ? "✕" : "🧹"}</span>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 3 }}>
                      {[1, 2, 4, 6].map(s => (
                        <div key={s} onClick={() => setPenSize(s)} style={{ width: 24, height: 24, borderRadius: 6, background: penSize === s ? T.accLt : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <div style={{ width: s * 2 + 1, height: s * 2 + 1, borderRadius: "50%", background: drawTool === "eraser" ? "#ff3b30" : T.text }} />
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
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#ff6b6b" }}>✏️ Disegno — Foglio {drawPageIdx + 1}/{drawPages.length}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { const ctx = canvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, W, H); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>🗑 Pulisci foglio</button>
                        <button style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#ff3b30", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>💾 Salva</button>
                        <button onClick={() => { savePageData(); setDrawFullscreen(false); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>✕ Chiudi</button>
                      </div>
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>{canvasEl}</div>
                    {toolbar}
                    {pageStrip}
                  </div>
                );

                return (
                  <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ padding: "10px 14px", borderBottom: `1px solid ${T.bdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#ff6b6b" }}>✏️ Disegno a mano libera</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => { const ctx = canvasRef.current?.getContext("2d"); ctx?.clearRect(0, 0, W, H); }} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>🗑 Pulisci foglio</button>
                        <button style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#ff3b30", color: "#fff", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>💾 Salva</button>
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
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>📷 FOTO ({(v.foto && Object.keys(v.foto).length) || 0})</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => openCamera("foto", null)}
                      style={{ padding: "4px 10px", borderRadius: 6, background: T.acc, color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>📷 Foto</button>
                    <button onClick={() => openCamera("video", null)}
                      style={{ padding: "4px 10px", borderRadius: 6, background: T.blue, color: "#fff", border: "none", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: FF }}>🎬 Video</button>
                  </div>
                </div>
                {/* Hidden file inputs as fallback */}
                <input ref={fotoVanoRef} type="file" accept="image/*" multiple style={{ display: "none" }}
                  onChange={e => {
                    const cat = pendingFotoCat;
                    Array.from(e.target.files || []).forEach(file => {
                      const r = new FileReader();
                      r.onload = async ev => {
                        const compressed = await compressImage(ev.target.result as string);
                        const key = "foto_" + Date.now() + "_" + file.name;
                        const fotoObj = { dataUrl: compressed, nome: file.name, tipo: "foto", categoria: cat || null };
                        setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: fotoObj } } : vn) } : r2) } : c));
                        setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: fotoObj } }));
                      };
                      r.readAsDataURL(file);
                    });
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
                    { n: "Panoramica", r: true, c: "#ff3b30" }, { n: "Spalle muro", r: true, c: "#007aff" }, { n: "Soglia", r: true, c: "#007aff" },
                    { n: "Cassonetto", r: false, c: "#34c759" }, { n: "Dettagli critici", r: true, c: "#ff3b30" }, { n: "Imbotto", r: false, c: "#34c759" },
                    { n: "Contesto", r: false, c: "#34c759" }, { n: "Altro", r: false, c: "#34c759" },
                  ].map((cat, i) => {
                    const fotoCount = Object.values(v.foto||{}).filter(f=>f.categoria===cat.n).length;
                    return (
                    <div key={i} onClick={()=>{ openCamera("foto", cat.n); }}
                      style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${fotoCount>0 ? "#34c759" : cat.r ? cat.c + "40" : T.bdr}`, background: fotoCount>0 ? "#34c75915" : cat.r ? cat.c + "08" : "transparent", fontSize: 10, fontWeight: 600, color: fotoCount>0 ? "#1a9e40" : cat.r ? cat.c : T.sub, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, position:"relative" }}>
                      {fotoCount>0 ? <span style={{fontSize:8,background:"#34c759",color:"#fff",borderRadius:"50%",width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900}}>{fotoCount}</span> : cat.r ? <span style={{ fontSize: 8 }}>✕</span> : null}
                      <span style={{ fontSize: 10 }}>📷</span> {cat.n}
                    </div>
                    );
                  })}
                </div>
                {Object.keys(v.foto||{}).length === 0
                  ? <div style={{ textAlign: "center", padding: "16px 0", color: T.sub, fontSize: 11 }}>Nessun allegato — tocca 📷 Foto o 🎬 Video</div>
                  : <>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                      {Object.entries(v.foto||{}).map(([k, f]) => (
                        <div key={k} onClick={() => { if (f.dataUrl) setViewingPhotoId(viewingPhotoId === k ? null : k as any); }}
                          style={{ position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden", background: T.bg, border: viewingPhotoId === k ? `2px solid ${T.acc}` : `1px solid ${T.bdr}`, cursor: f.dataUrl ? "pointer" : "default" }}>
                          {f.tipo === "foto" && f.dataUrl
                            ? <img src={f.dataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={f.nome}/>
                            : f.tipo === "video" && f.dataUrl
                              ? <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#111" }}>
                                  <span style={{ fontSize: 28, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}>▶</span>
                                </div>
                              : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 2 }}>
                                  <span style={{ fontSize: 24 }}>🎬</span>
                                  <span style={{ fontSize: 8, color: T.sub, textAlign: "center", padding: "0 4px" }}>{f.nome?.slice(0,12)}</span>
                                </div>
                          }
                          {f.categoria && <div style={{position:"absolute",bottom:0,left:0,right:0,background:"rgba(0,0,0,0.6)",color:"#fff",fontSize:7,fontWeight:700,padding:"2px 3px",textAlign:"center",lineHeight:1.2}}>{f.categoria}</div>}
                          <div onClick={(ev) => {
                            ev.stopPropagation();
                            const newFoto = { ...(v.foto||{}) }; delete newFoto[k];
                            setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: newFoto } : vn) } : r2) } : c));
                            setSelectedVano(prev => ({ ...prev, foto: newFoto }));
                          }} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</div>
                        </div>
                      ))}
                    </div>
                    {/* Inline viewer for tapped photo/video */}
                    {viewingPhotoId && (v.foto||{})[viewingPhotoId as any] && (
                      <div style={{ marginTop: 8, borderRadius: 12, overflow: "hidden", background: "#000", position: "relative" as const }}>
                        {(v.foto||{})[viewingPhotoId as any]?.tipo === "video"
                          ? <video src={(v.foto||{})[viewingPhotoId as any]?.dataUrl} controls playsInline autoPlay style={{ width: "100%", maxHeight: 300 }} />
                          : <img src={(v.foto||{})[viewingPhotoId as any]?.dataUrl} style={{ width: "100%", maxHeight: 300, objectFit: "contain" }} alt="" />
                        }
                        <div onClick={() => setViewingPhotoId(null)} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>✕</div>
                      </div>
                    )}
                  </>
                }
              </div>

              {/* Note */}
              <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#ff9500", marginBottom: 8 }}>📝 NOTE</div>
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
                    <Sec title="LARGHEZZE" color="#507aff" icon="📏" rows={[["Alto", m.lAlto], ["Centro", m.lCentro], ["Basso", m.lBasso]]} />
                    <Sec title="ALTEZZE" color="#34c759" icon="📐" rows={[["Sinistra", m.hSx], ["Centro", m.hCentro], ["Destra", m.hDx]]} />
                    <Sec title="DIAGONALI" color="#ff9500" icon="✕" rows={[["D1", m.d1], ["D2", m.d2], ["Fuori squadra", fSq !== null ? `${fSq}mm` : "", fSq > 3 ? "#ff3b30" : undefined]]} />

                    {/* Sistema + Vetro */}
                    <Sec title="SISTEMA / VETRO" color="#007aff" icon="⚙️" rows={[
                      ["Sistema", v.sistema],
                      ["Vetro", v.vetro],
                    ]} />

                    {/* Colori */}
                    <Sec title="COLORI PROFILI" color="#af52de" icon="🎨" rows={[
                      ["Colore Int.", v.coloreInt],
                      ...(v.bicolore ? [["Colore Est.", v.coloreEst]] : []),
                      ...(v.bicolore ? [["Bicolore", "Sì", T.acc]] : []),
                      ["Colore Accessori", v.coloreAcc || "Come profili"],
                    ]} />

                    {/* Telaio */}
                    <Sec title="TELAIO / RIFILATO" color="#8e8e93" icon="📐" rows={[
                      ["Telaio", v.telaio === "Z" ? "Telaio a Z" : v.telaio === "L" ? "Telaio a L" : "—"],
                      ...(v.telaio === "Z" && v.telaioAlaZ ? [["Ala Z", `${v.telaioAlaZ}mm`]] : []),
                      ["Rifilato", v.rifilato ? "Sì" : "No"],
                      ...(v.rifilato ? [["Rifilo Sx", v.rifilSx || "—"], ["Rifilo Dx", v.rifilDx || "—"], ["Rifilo Sopra", v.rifilSopra || "—"], ["Rifilo Sotto", v.rifilSotto || "—"]] : []),
                    ]} />

                    {/* Coprifilo / Lamiera */}
                    <Sec title="COPRIFILO / LAMIERA" color="#b45309" icon="🔩" rows={[
                      ["Coprifilo", v.coprifilo],
                      ["Lamiera", v.lamiera],
                    ]} />

                    {/* Controtelaio */}
                    {ct.tipo && <Sec title={`CONTROTELAIO ${ct.tipo === "singolo" ? "SINGOLO" : ct.tipo === "doppio" ? "DOPPIO" : "CON CASSONETTO"}`} color="#2563eb" icon="🔲" rows={[
                      ["Larghezza", ct.l ? `${ct.l}mm` : ""],
                      ["Altezza", ct.h ? `${ct.h}mm` : ""],
                      ...(ct.tipo === "singolo" && ct.prof ? [["Profondità", `${ct.prof}mm`]] : []),
                      ...(ct.tipo === "doppio" ? [["Sez. Interna", ct.sezInt], ["Sez. Esterna", ct.sezEst], ["Distanziale", ct.distanziale]] : []),
                      ...(ct.tipo === "cassonetto" ? [["H Cassonetto", ct.hCass], ["P Cassonetto", ct.pCass], ["Sezione", ct.sezione], ["Spalla", ct.spalla], ["Cielino", ct.cielino]] : []),
                    ]} />}

                    {/* Spallette */}
                    <Sec title="SPALLETTE" color="#32ade6" icon="🧱" rows={[["Sinistra", m.spSx], ["Destra", m.spDx], ["Sopra", m.spSopra], ["Imbotte", m.imbotte]]} />

                    {/* Davanzale */}
                    <Sec title="DAVANZALE" color="#ff2d55" icon="⬇" rows={[["Profondità", m.davProf], ["Sporgenza", m.davSporg], ["Soglia", m.soglia]]} />

                    {/* Accessori — dettagliato */}
                    {(acc.tapparella?.attivo || acc.persiana?.attivo || acc.zanzariera?.attivo) && (
                      <Sec title="ACCESSORI" color="#af52de" icon="✚" rows={[
                        ...(acc.tapparella?.attivo ? [
                          ["🪟 Tapparella", "Sì", T.grn],
                          ...(acc.tapparella.tipo ? [["  Tipo", acc.tapparella.tipo]] : []),
                          ...(acc.tapparella.l ? [["  Larghezza", `${acc.tapparella.l}mm`]] : []),
                          ...(acc.tapparella.h ? [["  Altezza", `${acc.tapparella.h}mm`]] : []),
                          ...(acc.tapparella.motorizzata !== undefined ? [["  Motorizzata", acc.tapparella.motorizzata ? "Sì" : "No"]] : []),
                          ...(acc.tapparella.colore ? [["  Colore", acc.tapparella.colore]] : []),
                        ] : []),
                        ...(acc.persiana?.attivo ? [
                          ["🏠 Persiana", "Sì", T.grn],
                          ...(acc.persiana.tipo ? [["  Tipo", acc.persiana.tipo]] : []),
                          ...(acc.persiana.ante ? [["  N° ante", String(acc.persiana.ante)]] : []),
                          ...(acc.persiana.colore ? [["  Colore", acc.persiana.colore]] : []),
                        ] : []),
                        ...(acc.zanzariera?.attivo ? [
                          ["🦟 Zanzariera", "Sì", T.grn],
                          ...(acc.zanzariera.tipo ? [["  Tipo", acc.zanzariera.tipo]] : []),
                          ...(acc.zanzariera.colore ? [["  Colore", acc.zanzariera.colore]] : []),
                        ] : []),
                      ]} />
                    )}

                    {/* Voci libere */}
                    {v.vociLibere && v.vociLibere.length > 0 && (
                      <Sec title="VOCI LIBERE" color="#ff9500" icon="📝" rows={v.vociLibere.map(vl => [vl.nome || "Voce", vl.valore || "—"])} />
                    )}

                    {/* Note */}
                    {v.note && (
                      <div style={{ borderRadius: 10, border: `1px solid ${T.bdr}`, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ padding: "6px 12px", background: "#8e8e9310", fontSize: 11, fontWeight: 700, color: "#8e8e93" }}>📝 NOTE</div>
                        <div style={{ padding: "8px 12px", fontSize: 12, lineHeight: 1.5 }}>{v.note}</div>
                      </div>
                    )}

                    {/* Accesso */}
                    {(v.difficoltaSalita || v.mezzoSalita) && (
                      <Sec title="ACCESSO" color={v.difficoltaSalita === "facile" ? T.grn : v.difficoltaSalita === "difficile" ? "#ff3b30" : "#ff9500"} icon="🏗" rows={[
                        ["Difficoltà", v.difficoltaSalita],
                        ["Mezzo salita", v.mezzoSalita],
                      ]} />
                    )}

                    {/* Foto gallery */}
                    {Object.values(v.foto || {}).filter(f => f.tipo === "foto" && f.dataUrl).length > 0 && (
                      <div style={{ borderRadius: 10, border: `1px solid #007aff25`, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ padding: "6px 12px", background: "#007aff10", fontSize: 11, fontWeight: 700, color: "#007aff" }}>📷 FOTO ({Object.values(v.foto || {}).filter(f => f.tipo === "foto").length})</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: 8 }}>
                          {Object.entries(v.foto || {}).filter(([, f]) => f.tipo === "foto" && f.dataUrl).map(([k, f]) => (
                            <div key={k} style={{ position: "relative", width: 64, height: 48, borderRadius: 6, overflow: "hidden" }}>
                              <img src={f.dataUrl} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
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
                        <div style={{ padding: "10px 12px", borderRadius: 10, background: pct >= 80 ? T.grn + "10" : pct >= 50 ? "#ff950010" : "#ff3b3010", border: `1px solid ${pct >= 80 ? T.grn + "30" : pct >= 50 ? "#ff950030" : "#ff3b3030"}`, textAlign: "center" }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: pct >= 80 ? T.grn : pct >= 50 ? "#ff9500" : "#ff3b30" }}>{pct}%</div>
                          <div style={{ fontSize: 10, color: T.sub, fontWeight: 600 }}>Completezza vano ({fields}/{tot} campi chiave)</div>
                        </div>
                      );
                    })()}
                  </>;
                })()}
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {vanoStep > 0 && (
              <button onClick={() => setVanoStep(s => s - 1)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: FF, color: T.text }}>← Indietro</button>
            )}
            {vanoStep < 2 && (
              <button onClick={() => setVanoStep(s => s + 1)} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: step.color, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>{vanoStep === 0 ? "Dettagli →" : "Riepilogo →"}</button>
            )}
            {vanoStep === 0 && (
              <button onClick={() => setVanoStep(2)} style={{ padding: "14px 16px", borderRadius: 12, border: `1px solid ${T.grn}`, background: T.grn + "15", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: FF, color: T.grn }}>✓ Fine</button>
            )}
            {vanoStep === 2 && (
              <button onClick={() => { setVanoStep(0); goBack(); }} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>💾 SALVA TUTTO</button>
            )}
          </div>

          {/* === RIEPILOGO RAPIDO === */}
          <div style={{ marginTop: 12, padding: "8px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>Riepilogo rapido</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {[
                ["L", m.lCentro || m.lAlto || m.lBasso, null],
                ["H", m.hCentro || m.hSx || m.hDx, null],
                ["D1", m.d1, null], ["D2", m.d2, null],
                ["F.sq", fSq !== null ? `${fSq}` : null, fSq > 3 ? "#ff3b30" : null],
              ].map(([l, val, c]) => (
                <div key={l} style={{ padding: "3px 8px", borderRadius: 4, background: c ? c + "12" : T.bg, fontSize: 10, fontFamily: FM, color: c || (val ? T.text : T.sub2) }}>
                  {l}: {val || "—"}
                </div>
              ))}
            </div>
            {/* Row 2: details */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
              {v.sistema && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#007aff12", fontSize: 9, color: "#007aff", fontWeight: 600 }}>⚙ {v.sistema.split(" ").slice(0, 2).join(" ")}</div>}
              {v.coloreInt && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#af52de12", fontSize: 9, color: "#af52de", fontWeight: 600 }}>🎨 {v.coloreInt}</div>}
              {v.vetro && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#32ade612", fontSize: 9, color: "#32ade6", fontWeight: 600 }}>💎 {v.vetro}</div>}
              {v.coprifilo && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#b4530912", fontSize: 9, color: "#b45309", fontWeight: 600 }}>🔩 {v.coprifilo}</div>}
              {v.accessori?.tapparella?.attivo && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#34c75912", fontSize: 9, color: "#34c759", fontWeight: 600 }}>🪟 Tapp.</div>}
              {v.accessori?.persiana?.attivo && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#34c75912", fontSize: 9, color: "#34c759", fontWeight: 600 }}>🏠 Pers.</div>}
              {v.accessori?.zanzariera?.attivo && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#af52de12", fontSize: 9, color: "#af52de", fontWeight: 600 }}>🦟 Zanz.</div>}
              {v.controtelaio?.tipo && <div style={{ padding: "2px 6px", borderRadius: 4, background: "#2563eb12", fontSize: 9, color: "#2563eb", fontWeight: 600 }}>🔲 CT</div>}
            </div>
          </div>

          {/* === FAB QUICK EDIT PANEL === */}
          {detailOpen.fabOpen && <div onClick={() => setDetailOpen(d => ({ ...d, fabOpen: false }))} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 998 }} />}
          {detailOpen.fabOpen && (
            <div style={{ position: "fixed", bottom: 80, left: 12, right: 12, zIndex: 999, background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.25)", padding: "14px 16px", maxHeight: "75vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>⚡ Accesso rapido</span>
                <div onClick={() => setDetailOpen(d => ({ ...d, fabOpen: false }))} style={{ padding: "4px 10px", borderRadius: 6, background: T.bg, fontSize: 11, color: T.sub, cursor: "pointer", fontWeight: 600 }}>✕ Chiudi</div>
              </div>

              {/* TIPOLOGIA — chips scroll */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 4 }}>🪟 Tipologia</div>
                <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
                  {tipologieFiltrate.map(tp => (
                    <div key={tp.code} onClick={() => updateVanoField(v.id, "tipo", tp.code)} style={{
                      padding: "6px 10px", borderRadius: 8, flexShrink: 0, cursor: "pointer",
                      border: `1.5px solid ${v.tipo === tp.code ? "#ff9500" : T.bdr}`,
                      background: v.tipo === tp.code ? "#ff950015" : T.card,
                    }}>
                      <div style={{ fontSize: 14, textAlign: "center" }}>{tp.icon}</div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: v.tipo === tp.code ? "#ff9500" : T.sub, textAlign: "center", whiteSpace: "nowrap" }}>{tp.code}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SISTEMA + VETRO */}
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>⚙️ Sistema</div>
                  <select style={{ ...S.select, fontSize: 12, padding: "8px" }} value={v.sistema || ""} onChange={e => updateVanoField(v.id, "sistema", e.target.value)}>
                    <option value="">— Sistema —</option>
                    {sistemiDB.map(s => <option key={s.id} value={`${s.marca} ${s.sistema}`}>{s.marca} {s.sistema}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>🪟 Vetro</div>
                  <select style={{ ...S.select, fontSize: 12, padding: "8px" }} value={v.vetro || ""} onChange={e => updateVanoField(v.id, "vetro", e.target.value)}>
                    <option value="">— Vetro —</option>
                    {vetriDB.map(g => <option key={g.id} value={g.code}>{g.code}</option>)}
                  </select>
                </div>
              </div>

              {/* COLORI */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>🎨 Colore</div>
                  <div onClick={() => updateVanoField(v.id, "bicolore", !v.bicolore)} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, background: v.bicolore ? T.accLt : T.bg, border: `1px solid ${v.bicolore ? T.acc : T.bdr}`, color: v.bicolore ? T.acc : T.sub, cursor: "pointer", fontWeight: 600 }}>
                    Bicolore {v.bicolore ? "✓" : ""}
                  </div>
                </div>
                {!v.bicolore ? (
                  <select style={{ ...S.select, fontSize: 12, padding: "8px" }} value={v.coloreInt || ""} onChange={e => updateVanoField(v.id, "coloreInt", e.target.value)}>
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
              </div>

              {/* COLORE ACCESSORI */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>🔩 Colore accessori</div>
                <select style={{ ...S.select, fontSize: 12, padding: "8px" }} value={v.coloreAcc || ""} onChange={e => updateVanoField(v.id, "coloreAcc", e.target.value)}>
                  <option value="">— Come profili —</option>
                  {coloriDB.map(c => <option key={c.id} value={c.code}>{c.code} — {c.nome}</option>)}
                </select>
              </div>

              {/* MISURE RAPIDE — L (tutte e 3) × H (tutte e 3) */}
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 4 }}>📏 Misure (mm) — compila L e H, inserisce Alto/Centro/Basso e Sx/Centro/Dx</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, color: "#507aff", marginBottom: 2, fontWeight: 700 }}>LARGHEZZA</div>
                    <input type="number" inputMode="numeric" style={{ ...S.input, fontSize: 16, fontFamily: FM, fontWeight: 700, textAlign: "center", padding: "10px", borderColor: "#507aff50" }} value={m.lCentro || ""} placeholder="L" onChange={e => { const val = parseInt(e.target.value) || 0; updateMisureBatch(v.id, { lAlto: val, lCentro: val, lBasso: val }); }} />
                    <div style={{ fontSize: 8, color: T.sub, marginTop: 2, textAlign: "center" }}>→ Alto · Centro · Basso</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", paddingTop: 8, fontSize: 18, color: T.sub, fontWeight: 300 }}>×</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, color: "#507aff", marginBottom: 2, fontWeight: 700 }}>ALTEZZA</div>
                    <input type="number" inputMode="numeric" style={{ ...S.input, fontSize: 16, fontFamily: FM, fontWeight: 700, textAlign: "center", padding: "10px", borderColor: "#507aff50" }} value={m.hCentro || ""} placeholder="H" onChange={e => { const val = parseInt(e.target.value) || 0; updateMisureBatch(v.id, { hSx: val, hCentro: val, hDx: val }); }} />
                    <div style={{ fontSize: 8, color: T.sub, marginTop: 2, textAlign: "center" }}>→ Sx · Centro · Dx</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 8 }}>
                    {m.lCentro > 0 && m.hCentro > 0 && (
                      <div style={{ fontSize: 13, color: T.grn, fontWeight: 800, fontFamily: FM }}>{((m.lCentro/1000)*(m.hCentro/1000)).toFixed(2)}</div>
                    )}
                    {m.lCentro > 0 && m.hCentro > 0 && (
                      <div style={{ fontSize: 8, color: T.grn, fontWeight: 600 }}>mq</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Pezzi — chips 1-5 + input libero */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 0" }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>Pezzi:</span>
                <div style={{ display: "flex", gap: 3 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} onClick={() => updateVanoField(v.id, "pezzi", n)} style={{
                      width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, fontFamily: FM, cursor: "pointer",
                      background: (v.pezzi || 1) === n ? T.acc : T.bg,
                      color: (v.pezzi || 1) === n ? "#fff" : T.sub,
                      border: `1px solid ${(v.pezzi || 1) === n ? T.acc : T.bdr}`
                    }}>{n}</div>
                  ))}
                </div>
                <input type="number" inputMode="numeric" min="1" style={{
                  width: 48, padding: "4px 6px", fontSize: 13, fontFamily: FM, fontWeight: 700, textAlign: "center",
                  border: `1.5px solid ${(v.pezzi || 1) > 5 ? T.acc : T.bdr}`, borderRadius: 6,
                  color: (v.pezzi || 1) > 5 ? T.acc : T.text,
                  background: (v.pezzi || 1) > 5 ? T.accLt : T.bg
                }} value={v.pezzi || 1} onChange={e => updateVanoField(v.id, "pezzi", parseInt(e.target.value) || 1)} />
              </div>
            </div>
          )}
          <div onClick={() => setDetailOpen(d => ({ ...d, fabOpen: !d.fabOpen }))} style={{
            position: "fixed", bottom: 260, right: 20, zIndex: 999,
            width: 52, height: 52, borderRadius: "50%",
            background: detailOpen.fabOpen ? T.red : "linear-gradient(135deg, #34c759, #28a745)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 18px rgba(52,199,89,0.45)", cursor: "pointer",
            transition: "transform 0.2s, background 0.2s",
            transform: detailOpen.fabOpen ? "rotate(45deg)" : "none"
          }}>
            <span style={{ fontSize: 20, color: "#fff" }}>⚡</span>
          </div>

        </div>
      </div>
    );

}
