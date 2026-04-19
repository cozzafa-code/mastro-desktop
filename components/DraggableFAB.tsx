"use client";
import { useMastro } from "./MastroContext";
import { useState, useEffect, useRef } from "react";
export default function DraggableFAB({ fabOpen, setFabOpen, acc, onEvento, onCliente, onCommessa, onMessaggio, onLastCM, recentActions }) {
  const mastroCtx = (() => { try { return useMastro(); } catch { return null; } })();

  const buildContext = () => {
    if (!mastroCtx) return {};
    const { cantieri = [], fattureDB = [], tasks = [], montaggiDB = [], ordiniFornDB = [], pipelineDB = [] } = mastroCtx;
    const oggi = new Date().toISOString().split("T")[0];
    const faseCount = {};
    cantieri.forEach(c => { faseCount[c.fase] = (faseCount[c.fase] || 0) + 1; });
    const fattureAperte = fattureDB.filter(f => !f.pagata);
    return {
      oggi,
      riepilogo: {
        totaleCommesse: cantieri.length,
        commessePerFase: faseCount,
        fatturateTotale: fattureDB.reduce((s, f) => s + (f.importo || 0), 0),
        fatturateIncassate: fattureDB.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0),
        fattureAperte: fattureAperte.length,
        fattureScadute: fattureAperte.filter(f => f.scadenza && f.scadenza < oggi).length,
        taskAperti: tasks.filter(t => !t.done).length,
        montaggiProssimi: montaggiDB.filter(m => m.data >= oggi && m.stato !== "completato").length,
        ordiniAttivi: ordiniFornDB.filter(o => o.stato !== "consegnato").length,
      },
      commesse: cantieri.map(c => ({
        code: c.code,
        cliente: `${c.cliente || ""} ${c.cognome || ""}`.trim(),
        fase: c.fase, euro: c.euro || 0,
        scadenza: c.scadenza, confermato: c.confermato,
        sistema: c.sistema, indirizzo: c.indirizzo,
        telefono: c.telefono || "",
        email: c.email || "",
        note: c.note || "",
        aggiornato: c.aggiornato || "",
        giorniFermo: c.aggiornato ? Math.floor((Date.now() - new Date(c.aggiornato).getTime()) / 86400000) : 0,
      })),
      fattureAperte: fattureAperte.slice(0, 15),
      pipeline: pipelineDB,
    };
  };
  const [side, setSide] = useState("right");
  const [topPx, setTopPx] = useState(300);
  const [aiOpen, setAiOpen] = useState(false);
  const [wakeActive, setWakeActive] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false); // wake word listener attivo
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const liveModeRef = useRef(false);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const wakeListeningRef = useRef(false);
  const wakeRecRef = useRef(null);
  const wrapRef = useRef(null);
  const posRef = useRef(300);
  const dragRef = useRef({ on: false, moved: false, startY: 0, startTop: 300 });
  const fabOpenRef = useRef(fabOpen);
  useEffect(() => { fabOpenRef.current = fabOpen; }, [fabOpen]);
  useEffect(() => { liveModeRef.current = liveMode; }, [liveMode]);

  // Avvia wake word quando il componente monta
  useEffect(() => {
    // Aspetta che il componente sia stabile prima di avviare il wake word
    const timer = setTimeout(() => {
      try { startWakeWord(); } catch {}
    }, 3000);
    return () => {
      clearTimeout(timer);
      try { stopWakeWord(); } catch {}
    };
  }, []);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);
  useEffect(() => {
    const sd = localStorage.getItem("mastro:fab_side");
    const sp = localStorage.getItem("mastro:fab_top");
    if (sd) setSide(sd);
    const y = sp ? parseInt(sp) : Math.round(window.innerHeight / 2);
    posRef.current = y;
    setTopPx(y);
  }, []);
  useEffect(() => {
    const onTouchStart = (e) => {
      dragRef.current = { on: true, moved: false, startY: e.touches[0].clientY, startTop: posRef.current };
      e.preventDefault();
    };
    const onTouchMove = (e) => {
      if (!dragRef.current.on) return;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      if (Math.abs(dy) > 4) dragRef.current.moved = true;
      if (dragRef.current.moved && wrapRef.current) {
        const ny = Math.max(60, Math.min(window.innerHeight - 160, dragRef.current.startTop + dy));
        wrapRef.current.style.top = ny + "px";
        posRef.current = ny;
      }
      e.preventDefault();
    };
    const onTouchEnd = () => {
      if (!dragRef.current.on) return;
      dragRef.current.on = false;
      if (dragRef.current.moved) {
        setTopPx(posRef.current);
        localStorage.setItem("mastro:fab_top", String(posRef.current));
      } else {
        if (!fabOpenRef.current) setFabOpen(true);
      }
    };
    const tab = document.getElementById("mastro-fab-tab");
    if (!tab) return;
    tab.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      tab.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [setFabOpen]);
  const isRight = side === "right";
  const baseItems = [
    { l: "Assistente AI", c: "#1a2b47", t: "AI",  a: () => { setAiOpen(true); setFabOpen(false); } },
    { l: "Appuntamento", c: "#1A9E73", t: "CAL", a: onEvento },
    { l: "Nuovo cliente", c: "#3B7FE0", t: "USR", a: onCliente },
    { l: "Nuova commessa", c: "#d4a843", t: "FLD", a: onCommessa },
    { l: "Messaggio", c: "#8B5CF6", t: "MSG", a: onMessaggio },
  ];
  const recent = (recentActions || []).slice(0, 3).map(ra => ({
    l: ra.label, c: "#1a2b47", t: "BCK",
    a: () => { try { const d = JSON.parse(ra.action); if (d.type === "commessa" && onLastCM) onLastCM({ id: d.id }); } catch {} }
  }));
  const items = recent.length > 0 ? [...baseItems, { l: "SEP", c: "#555", t: "SEP", a: null }, ...recent] : baseItems;
  const screenH = typeof window !== "undefined" ? window.innerHeight : 800;
  const NAVBAR_H = 70; // altezza navbar inferiore
  const itemsH = items.filter(i => i.t !== "SEP").length * 70 + 20;
  const spaceBelow = screenH - topPx - 60 - NAVBAR_H;
  const showAbove = spaceBelow < itemsH;
  const actionsTop = showAbove ? Math.max(20, topPx - itemsH - 10) : Math.min(screenH - itemsH - NAVBAR_H - 10, topPx + 60);
  const MIC = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
  const CAL = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
  const USR = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
  const FLD = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>;
  const MSG = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
  const BCK = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;
  const AI_Icon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>;
  const AI_Sm = ({c="#fff",s=14}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>;
  const MIC_Icon = ({c="#fff",s=20}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>;
  const SND_Icon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
  const icons = { AI: AI_Icon, CAL, USR, FLD, MSG, BCK };

  // ÔöÇÔöÇ AI functions ÔöÇÔöÇ
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "it-IT"; utt.rate = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const itVoice = voices.find(v => v.lang.startsWith("it"));
    if (itVoice) utt.voice = itVoice;
    utt.onstart = () => { setIsSpeaking(true); isSpeakingRef.current = true; };
    utt.onend = () => { setIsSpeaking(false); isSpeakingRef.current = false; if (liveModeRef.current) setTimeout(() => startListening(), 400); };
    window.speechSynthesis.speak(utt);
  };
  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    if ((window as any).__mastroAudio) { (window as any).__mastroAudio.pause(); (window as any).__mastroAudio = null; }
    setIsSpeaking(false); isSpeakingRef.current = false;
  };

  const sendAI = async (text) => {
    const msg = (text || aiInput).trim();
    if (!msg || aiLoading) return;
    // Carica memoria sessioni precedenti
    const aiMemory = (() => { try { return JSON.parse(localStorage.getItem("mastro:ai_memory") || "[]").slice(-20); } catch { return []; } })();
    const historyCtx = aiMemory.length > 0 && aiMessages.length === 0 ? aiMemory : [];
    const newMsgs = [...historyCtx, ...aiMessages, { role: "user", content: msg }];
    setAiMessages(newMsgs); setAiInput(""); setAiLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs, context: buildContext(), tts: true }),
      });
      const data = await res.json();
      if (data.error) {
        setAiMessages(prev => [...prev, { role: "assistant", content: "Errore: " + data.error }]);
        return;
      }
      const reply = data.reply || "...";
      // Gestisci azione se presente
      if (data.action) handleAction(data.action);
      setAiMessages(prev => [...prev, { role: "assistant", content: reply }]);
      // Salva memoria (ultimi 40 messaggi)
      try {
        const stored = JSON.parse(localStorage.getItem("mastro:ai_memory") || "[]");
        const upd = [...stored, { role: "user", content: msg }, { role: "assistant", content: reply }].slice(-40);
        localStorage.setItem("mastro:ai_memory", JSON.stringify(upd));
      } catch {}
      // Audio ElevenLabs se disponibile, altrimenti Web Speech
      if (data.audio) {
        playAudio(data.audio);
      } else {
        speak(reply);
      }
    } catch (e) {
      setAiMessages(prev => [...prev, { role: "assistant", content: "Errore connessione" }]);
    } finally { setAiLoading(false); }
  };

  // Esegui azione nel frontend
  const handleAction = async (action) => {
    if (!mastroCtx) return;
    const { setCantieri, setTasks, setEvents, cantieri, generaPreventivoPDF } = mastroCtx;
    const oggi = new Date().toISOString().split("T")[0];
    const ora = new Date().toTimeString().substring(0, 5);

    if (action.type === "crea_commessa") {
      const newCM = {
        id: Date.now(), code: "S-" + String(Date.now()).slice(-4).padStart(4, "0"),
        cliente: action.params.cliente || "", cognome: action.params.cognome || "",
        indirizzo: action.params.indirizzo || "", telefono: action.params.telefono || "",
        note: action.params.note || "", fase: "sopralluogo",
        rilievi: [], allegati: [], creato: new Date().toLocaleDateString("it-IT"),
        aggiornato: new Date().toLocaleDateString("it-IT"), log: [],
      };
      setCantieri(prev => [newCM, ...prev]);
      return { ok: true, msg: "Commessa creata: " + newCM.code };

    } else if (action.type === "crea_task") {
      const newTask = {
        id: Date.now(), text: action.params.testo, done: false,
        priority: action.params.priorita || "media",
        date: action.params.data || oggi, cm: action.params.commessa || "",
        meta: "", time: "",
      };
      setTasks(prev => [...prev, newTask]);
      return { ok: true, msg: "Task creato" };

    } else if (action.type === "crea_evento") {
      const newEvent = {
        id: "ev_" + Date.now(), text: action.params.testo,
        date: action.params.data || oggi, time: action.params.ora || ora,
        tipo: action.params.tipo || "altro", cm: action.params.commessa || "",
        color: "#031631",
      };
      setEvents(prev => [...prev, newEvent]);
      return { ok: true, msg: "Evento creato" };

    } else if (action.type === "cambia_fase_commessa") {
      setCantieri(prev => prev.map(c =>
        c.code === action.params.codice ? { ...c, fase: action.params.nuova_fase, aggiornato: oggi } : c
      ));
      return { ok: true, msg: "Fase aggiornata" };

    } else if (action.type === "invia_preventivo_whatsapp") {
      // Trova la commessa
      const cm = cantieri.find(c =>
        c.code === action.params.codice ||
        (c.cliente + " " + (c.cognome||"")).toLowerCase().includes((action.params.cliente||"").toLowerCase())
      );
      if (!cm) return { ok: false, msg: "Commessa non trovata" };
      // Genera PDF
      try {
        if (mastroCtx.generaPreventivoPDF) await mastroCtx.generaPreventivoPDF(cm);
      } catch {}
      // Apri WhatsApp
      const tel = (cm.telefono || "").replace(/\s/g, "");
      const msg = encodeURIComponent(
        `Gentile ${cm.cliente}, le inviamo il preventivo per i lavori richiesti.
Per accettare il preventivo o per qualsiasi informazione non esiti a contattarci.`
      );
      if (tel) {
        window.open(`https://wa.me/${tel.startsWith("39") ? tel : "39" + tel}?text=${msg}`, "_blank");
        return { ok: true, msg: `Preventivo aperto su WhatsApp per ${cm.cliente} (${tel})` };
      } else {
        return { ok: false, msg: `PDF generato ma nessun telefono per ${cm.cliente}` };
      }

    } else if (action.type === "genera_pdf_commessa") {
      const cm = cantieri.find(c =>
        c.code === action.params.codice ||
        (c.cliente + " " + (c.cognome||"")).toLowerCase().includes((action.params.cliente||"").toLowerCase())
      );
      if (!cm) return { ok: false, msg: "Commessa non trovata" };
      try {
        if (mastroCtx.generaPreventivoPDF) await mastroCtx.generaPreventivoPDF(cm);
        return { ok: true, msg: `PDF generato per ${cm.cliente} (${cm.code})` };
      } catch(e) {
        return { ok: false, msg: "Errore generazione PDF: " + e.message };
      }

    } else if (action.type === "commesse_ferme") {
      const giorni = action.params.giorni || 7;
      const ferme = cantieri.filter(c => {
        const g = c.aggiornato ? Math.floor((Date.now() - new Date(c.aggiornato).getTime()) / 86400000) : 999;
        return g >= giorni && !["consegnato","annullato"].includes(c.fase);
      });
      return { ok: true, data: ferme.map(c => ({ code: c.code, cliente: c.cliente, fase: c.fase, giorni: Math.floor((Date.now() - new Date(c.aggiornato||"2020").getTime()) / 86400000) })) };

    } else if (action.type === "cerca_commessa") {
      const q = (action.params.query || "").toLowerCase();
      const found = cantieri.filter(c =>
        c.code?.toLowerCase().includes(q) ||
        c.cliente?.toLowerCase().includes(q) ||
        c.cognome?.toLowerCase().includes(q) ||
        c.indirizzo?.toLowerCase().includes(q)
      ).slice(0, 5);
      return { ok: true, data: found };
    }

    return { ok: false, msg: "Azione non riconosciuta: " + action.type };
  };

  // Riproduci audio base64 ElevenLabs
  const audioRef = (window as any).__mastroAudio;
  const playAudio = (audioDataUrl: string) => {
    // Se audio non sbloccato, skip silenziosamente
    if (!audioUnlocked) { if (liveModeRef.current) setTimeout(() => startListening(), 400); return; }
    setIsSpeaking(true); isSpeakingRef.current = true;
    const audio = new Audio(audioDataUrl);
    (window as any).__mastroAudio = audio;
    audio.onended = () => {
      setIsSpeaking(false); isSpeakingRef.current = false;
      if (liveModeRef.current) setTimeout(() => startListening(), 400);
    };
    audio.onerror = () => { setIsSpeaking(false); isSpeakingRef.current = false; speak(""); };
    audio.play().catch(() => { setIsSpeaking(false); isSpeakingRef.current = false; });
  };

  const startListening = () => {
    // Evita doppio avvio
    if (isListeningRef.current || isSpeakingRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "it-IT"; rec.interimResults = false; rec.continuous = false;
    rec.onstart = () => { setIsListening(true); isListeningRef.current = true; };
    rec.onend = () => {
      setIsListening(false);
      // In live mode: riavvia ascolto solo se non stiamo parlando
      // (se stiamo parlando, speak.onend lo riavvier├á)
      if (liveModeRef.current) {
        setTimeout(() => {
          if (liveModeRef.current && !window.speechSynthesis?.speaking) {
            startListening();
          }
        }, 500);
      }
    };
    rec.onresult = (e) => { const t = e.results[0][0].transcript; setAiInput(t); sendAI(t); };
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec; rec.start();
  };
  const stopListening = () => { (recognitionRef.current as any)?.stop(); setIsListening(false); };
  const toggleLiveMode = () => {
    if (liveMode) { stopListening(); stopSpeaking(); setLiveMode(false); }
    else { setLiveMode(true); setTimeout(() => startListening(), 200); }
  };

  // ÔöÇÔöÇ Wake word "Mastro" ÔöÇÔöÇ
  const startWakeWord = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR || wakeListeningRef.current) return;
    const rec = new SR();
    rec.lang = "it-IT";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = () => { wakeListeningRef.current = true; setWakeActive(true); };
    rec.onend = () => {
      wakeListeningRef.current = false;
      // Riavvia sempre se non siamo in live mode
      if (!liveModeRef.current) setTimeout(() => startWakeWord(), 1000);
    };
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript.toLowerCase();
        if (text.includes("mastro")) {
          rec.stop();
          wakeListeningRef.current = false;
          // Attiva assistente — apre pannello ma NON live mode automatico
          // L'utente deve prima toccare "Attiva voce"
          setAiOpen(true);
          setLiveMode(false);
          liveModeRef.current = false;
          // Feedback vocale breve
          const SR2 = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
          if (window.speechSynthesis) {
            const utt = new SpeechSynthesisUtterance("Dimmi");
            utt.lang = "it-IT"; utt.rate = 1.2; utt.volume = 0.8;
            window.speechSynthesis.speak(utt);
          }
          break;
        }
      }
    };
    rec.onerror = () => { wakeListeningRef.current = false; setTimeout(() => startWakeWord(), 2000); };
    wakeRecRef.current = rec;
    rec.start();
  };

  const stopWakeWord = () => {
    (wakeRecRef.current as any)?.stop();
    wakeListeningRef.current = false;
    setWakeActive(false);
  };

  return (
    <>
      {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,26,28,0.45)", zIndex: 89 }} />}}
      {fabOpen && (
        <div style={{ position: "fixed", zIndex: 92, [isRight ? "right" : "left"]: 58, top: actionsTop, display: "flex", flexDirection: "column", gap: 10, transition: "top 0.18s ease" }}>
          {items.map((item, i) => item.t === "SEP" ? (
            <div key={i} style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,0.5)", textAlign: "center", letterSpacing: 2 }}>RECENTI</div>
          ) : (
            <div key={i} onClick={() => { if (item.a) { item.a(); setFabOpen(false); } }} style={{ display: "flex", alignItems: "center", gap: 12, flexDirection: isRight ? "row-reverse" : "row", cursor: "pointer" }}>
              <div style={{ width: 54, height: 54, borderRadius: "50%", background: item.c, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px " + item.c + "70" }}>
                {icons[item.t] && icons[item.t]()}
              </div>
              <div style={{ background: "#031631", color: "#fff", fontSize: 13, fontWeight: 700, padding: "7px 13px", borderRadius: 10, whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", boxShadow: "0 2px 10px rgba(0,0,0,0.3)" }}>{item.l}</div>
            </div>
          ))}
        </div>
      )}
      <div ref={wrapRef} style={{ position: "fixed", [isRight ? "right" : "left"]: 0, top: topPx, zIndex: 92 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: fabOpen ? 44 : 24, height: fabOpen ? 110 : 0, overflow: "hidden", background: "#0f1f38",
            borderRadius: isRight ? "12px 0 0 0" : "0 12px 0 0",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "width 0.25s ease, height 0.25s ease" }}>
            <div onClick={() => setFabOpen(false)} style={{ cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: 1 }}>CHIUDI</span>
            </div>
            <div style={{ width: "80%", height: 1, background: "rgba(255,255,255,0.2)" }} />
            <div onClick={(e) => { e.stopPropagation(); const ns = side === "right" ? "left" : "right"; setSide(ns); localStorage.setItem("mastro:fab_side", ns); }} style={{ cursor: "pointer", textAlign: "center" }}>
              <span style={{ fontSize: 14, color: "#fff" }}>{side === "right" ? "<" : ">"}</span>
              <div style={{ fontSize: 7, color: "rgba(255,255,255,0.6)", fontWeight: 700 }}>LATO</div>
            </div>
          </div>
          <div id="mastro-fab-tab" onClick={() => { if (!fabOpen) setFabOpen(true); }}
            style={{ width: fabOpen ? 44 : 24, height: 90,
              background: acc, borderRadius: isRight ? (fabOpen ? "0 0 0 12px" : "12px 0 0 12px") : (fabOpen ? "0 0 12px 0" : "0 12px 12px 0"),
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              cursor: "grab", userSelect: "none", WebkitUserSelect: "none", touchAction: "none",
              transition: "width 0.25s ease",
              boxShadow: isRight ? "-4px 0 20px " + acc + "60" : "4px 0 20px " + acc + "60" }}>
            <div style={{ width: fabOpen ? 30 : 18, height: fabOpen ? 30 : 18, borderRadius: fabOpen ? 8 : 5, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.25s ease", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>
              <span style={{ fontSize: fabOpen ? 17 : 11, fontWeight: 900, color: acc, lineHeight: 1, transition: "font-size 0.25s" }}>M</span>
              {wakeActive && !fabOpen && <div style={{ position: "absolute", top: 2, right: 2, width: 6, height: 6, borderRadius: "50%", background: "#1A9E73", boxShadow: "0 0 4px #1A9E73" }} />}
            </div>
            <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: 7, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>MASTRO</span>
          </div>
        </div>
      </div>

      {/* ÔöÇÔöÇ PANNELLO AI ÔöÇÔöÇ */}
      {aiOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", flexDirection: "column", background: "#f9f9fb" }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #E2E8F0", background: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: acc, display: "flex", alignItems: "center", justifyContent: "center" }}><AI_Sm s={18} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#031631" }}>MASTRO AI</div>
              <div style={{ fontSize: 11, color: "#44474d" }}>{liveMode ? (isListening ? "In ascolto..." : isSpeaking ? "Sto parlando..." : "Live ÔÇö parla ora") : "Assistente intelligente"}</div>
            </div>
            <button onClick={toggleLiveMode} style={{ padding: "6px 12px", borderRadius: 20, border: `2px solid ${liveMode ? "#DC4444" : acc}`, background: liveMode ? "#DC4444" : "transparent", color: liveMode ? "#fff" : acc, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              {liveMode ? "Stop" : "Live"}
            </button>
            <div onClick={() => { stopListening(); stopSpeaking(); setLiveMode(false); setAiOpen(false); }} style={{ width: 32, height: 32, borderRadius: 8, background: "#f3f3f5", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#44474d" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          </div>
          {!audioUnlocked && (
            <div onClick={() => { unlockAudio(); setTimeout(() => { setLiveMode(true); liveModeRef.current = true; startListening(); }, 300); }} style={{ background: "#1a2b47", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, cursor: "pointer", borderBottom: "1px solid #0a5940" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              <span style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>Tocca per attivare la voce e iniziare</span>
            </div>
          )}
          {liveMode && (
            <div style={{ background: isListening ? "#DC444415" : "#f3f3f5", padding: "12px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #E2E8F0" }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: isListening ? "#DC4444" : isSpeaking ? acc : "rgba(197,198,206,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MIC_Icon c={isListening || isSpeaking ? "#fff" : "#75777e"} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#031631" }}>{isListening ? "Sto ascoltando..." : isSpeaking ? "Sto rispondendo..." : "Parla per fare una domanda"}</div>
                <div style={{ fontSize: 11, color: "#44474d" }}>Conversazione continua automaticamente</div>
              </div>
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 0" }}>
            {aiMessages.length === 0 && !liveMode && (
              <div style={{ textAlign: "center", padding: "32px 20px" }}>
                <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><AI_Sm s={36} c={acc} /></div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#031631", marginBottom: 4 }}>Come posso aiutarti?</div>
                <div style={{ fontSize: 12, color: "#44474d", marginBottom: 16 }}>Scrivi, usa il microfono o premi Live per parlare</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                  {["Quante commesse ho aperte?", "Fatture scadute?", "Riepilogo pipeline", "Chi devo chiamare oggi?"].map(s => (
                    <div key={s} onClick={() => sendAI(s)} style={{ padding: "8px 14px", borderRadius: 20, border: "1px solid #E2E8F0", background: "#fff", color: "#031631", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>{s}</div>
                  ))}
                </div>
              </div>
            )}
            {aiMessages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                {msg.role === "assistant" && <div style={{ width: 28, height: 28, borderRadius: 8, background: acc, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}><AI_Sm s={14} /></div>}
                <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? acc : "#fff", color: msg.role === "user" ? "#fff" : "#031631", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>{msg.content}</div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: acc, display: "flex", alignItems: "center", justifyContent: "center" }}><AI_Sm s={14} /></div>
                <div style={{ padding: "10px 16px", borderRadius: "16px 16px 16px 4px", background: "#fff" }}>
                  <div style={{ display: "flex", gap: 4 }}>{[0,1,2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: acc, animation: `aipulse 1.2s ease-in-out ${j*0.2}s infinite` }} />)}</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {!liveMode && (
            <div style={{ padding: "12px 16px 28px", background: "#fff", borderTop: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", background: "#f9f9fb", borderRadius: 24, border: "1.5px solid #E2E8F0", padding: "8px 14px" }}>
                  <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendAI(); }} placeholder="Chiedimi qualcosa..." style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: 14, color: "#031631", fontFamily: "inherit" }} />
                </div>
                <button onClick={isListening ? stopListening : startListening} style={{ width: 44, height: 44, borderRadius: "50%", border: `1.5px solid ${isListening ? "#DC4444" : "rgba(197,198,206,0.3)"}`, background: isListening ? "#DC4444" : "#f9f9fb", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MIC_Icon c={isListening ? "#fff" : "#44474d"} />
                </button>
                <button onClick={() => sendAI()} disabled={!aiInput.trim() || aiLoading} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: aiInput.trim() && !aiLoading ? acc : "rgba(197,198,206,0.3)", cursor: aiInput.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <SND_Icon />
                </button>
              </div>
              {aiMessages.length > 0 && <div onClick={() => setAiMessages([])} style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "#75777e", cursor: "pointer" }}>Nuova conversazione</div>}
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes aipulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }`}</style>
    </>
  );
}
