"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — VoiceAssistant v2 — ULTRA INTELLIGENCE
// Riconosce comandi naturali, naviga, crea, modifica, detta misure
// Match clienti fuzzy, comandi compositi, feedback visivo live
// ═══════════════════════════════════════════════════════════
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMastro } from "./MastroContext";
import { FM, ICO, I } from "./mastro-constants";

// ─── NLP PATTERNS ───
const P = {
  time: /\b(domani|dopodomani|luned[iì]|marted[iì]|mercoled[iì]|gioved[iì]|venerd[iì]|sabato|domenica|ore?\s?\d{1,2}|alle?\s?\d{1,2}|mattina|pomeriggio|sera|settimana\s+prossima|oggi\s+pomeriggio|stasera|fra\s+\d+\s+giorni?|tra\s+\d+\s+giorni?)\b/i,
  problem: /\b(rotto|marcio|difett|guast|sostitui|danneggi|crepa|infiltr|muffa|condens|spiffero|rumore|bloccat|non\s+(?:funziona|chiude|apre|si\s+apre)|si\s+è\s+rott|perdita|scaric)\b/i,
  action: /\b(chiamar[ei]|telefonar[ei]|verificar[ei]|controllar[ei]|ordinar[ei]|confermar[ei]|inviar[ei]|spedir[ei]|preparar[ei]|richiamar[ei]|sollecitar[ei]|fissare?|prenotar[ei]|mandar[ei]|scriv[ei]|rispondi?)\b/i,
  positive: /\b(content[oia]|soddisfatt[oia]|brav[oia]|perfett[oia]|ottim[oia]|felic[ei]|grazie|compliment|eccellente|fantastico)\b/i,
  commercial: /\b(sconto|prezzo|pagament|acconto|saldo|fattura|preventivo|costo|budget|rata|listino|offerta|caparra|bonifico)\b/i,
  navigate: /\b(?:vai|apri|mostra|vedi|passa)\s+(?:a\s+|al?\s+|alla?\s+|alle?\s+)?(commess[ae]|ordini?|agenda|messaggi|clienti|impostazioni|contabilit[aà]|home|montaggi|calendario)\b/i,
  order: /\b(?:ordina|ordine|ordinare|riordina)\s+(?:(?:il?|i|la|le|del?|dei|delle?)\s+)?(material[ei]|profil[oi]|vetr[oi]|accessori?|ferramenta|guarnizioni?|coprifil[oi]|lamier[ae]|ante?|cerniere?|maniglie?|avvolgibil[ei]|zanzarier[ae])\b/i,
  measureSimple: /\b(\d{3,4})\s*(?:per|x|×)\s*(\d{3,4})\b/i,
  vanoWords: /\b(soggiorno|cucina|camera|cameretta|bagno|ingresso|corridoio|sala|studio|mansarda|cantina|garage|balcone|terrazzo|lavanderia|ripostiglio|veranda)\b/i,
  tipo: /\b(finestra|portafinestra|porta\s+blindata|porta\s+garage|scorrevol[ei]|vasistas|bilico|fisso|fissa|due\s+ante|tre\s+ante|2\s+ante|3\s+ante)\b/i,
  piano: /\bpiano\s+(terra|primo|secondo|terzo|quarto|quinto|seminterrato|interrato|\d+)\b/i,
  accessori: /\b(tapparella|motorizzat[ao]|zanzariera|persiana|cassonetto|controtelaio|coprifilo|inferriata)\b/gi,
  coloreInt: /\b(?:colore?\s+)?(?:interno?\s+)?(bianco|avorio|crema)\b/i,
  coloreEst: /\b(?:esterno?\s+)?(antracite|grigio|marrone|noce|rovere|ciliegio|douglas|7016|effetto\s+legno)\b/i,
  bicolore: /\bbicolore\b/i,
  vetro: /\b(?:vetro\s+)?(satinato|opaco|trasparente|triplo|doppio|temperato|stratificato|basso\s*emissivo|antisfondamento|vetrocamera|acustico)\b/i,
};

// ─── FUZZY MATCH ───
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return d[m][n];
}

function findCliente(text, contatti, cantieri) {
  const tLow = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let best = null, bestScore = 0, bestCmId = null, bestCmCode = null;
  // Pass 1: full name in contatti
  for (const c of (contatti || [])) {
    const full = ((c.nome || "") + " " + (c.cognome || "")).trim().toLowerCase();
    if (full.length > 3 && tLow.includes(full)) return { nome: (c.nome+" "+(c.cognome||"")).trim(), id: c.id, cmId: findCM(full, cantieri), score: 1 };
  }
  // Pass 2: cognome in contatti
  for (const c of (contatti || [])) {
    const cog = (c.cognome || "").toLowerCase();
    if (cog.length > 3 && tLow.includes(cog) && 0.9 > bestScore) {
      best = c; bestScore = 0.9;
    }
  }
  // Pass 3: cantieri.cliente
  for (const cm of (cantieri || [])) {
    const cl = (cm.cliente || "").toLowerCase();
    if (cl.length > 3 && tLow.includes(cl)) return { nome: cm.cliente, id: null, cmId: cm.id, cmCode: cm.code, score: 0.95 };
  }
  // Pass 4: nome only (>3 chars)
  if (!best) {
    for (const c of (contatti || [])) {
      const nom = (c.nome || "").toLowerCase();
      if (nom.length > 3 && tLow.includes(nom) && 0.6 > bestScore) { best = c; bestScore = 0.6; }
    }
  }
  if (best) {
    const nome = (best.nome + " " + (best.cognome || "")).trim();
    return { nome, id: best.id, cmId: findCM(nome, cantieri), score: bestScore };
  }
  return null;
}
function findCM(name, cantieri) {
  if (!name) return null;
  const low = name.toLowerCase();
  const cm = (cantieri||[]).find(c => low.includes((c.cliente||"").toLowerCase().split(" ")[0]) || (c.cliente||"").toLowerCase().includes(low.split(" ")[0]));
  return cm?.id || null;
}

// ─── ANALISI ───
function analyzeVoice(text, ctx) {
  const t = text.toLowerCase().replace(/[.,;!?]/g, " ").trim();
  const r = {
    type: null, actions: [], priority: "media", tag: "nota",
    title: text, displayTitle: text,
    time: null, date: null,
    cmId: ctx.selectedCM?.id || null, cmCode: ctx.selectedCM?.code || null,
    clienteNome: ctx.selectedCM?.cliente || null,
    measures: {}, accessories: [], vanoTipo: null, stanza: null, piano: null,
    coloreInt: null, coloreEst: null, bicolore: false, vetro: null,
    confidence: 0, navigateTo: null, materiale: null,
  };

  // 1. NAVIGAZIONE
  const nav = t.match(P.navigate);
  if (nav) {
    r.type = "navigate";
    const d = nav[1].toLowerCase();
    const map = { commess:"commesse", ordin:"commesse", agenda:"agenda", messagg:"messaggi", client:"clienti", impostazion:"impostazioni", contabilit:"contabilita", home:"home", montagg:"montaggi_cal", calendar:"montaggi_cal" };
    for (const [k,v] of Object.entries(map)) { if (d.includes(k)) { r.navigateTo = v; break; } }
    r.confidence = 0.95;
  }

  // 2. CLIENTE
  const cl = findCliente(text, ctx.contatti, ctx.cantieri);
  if (cl) {
    r.clienteNome = cl.nome;
    if (cl.cmId) { r.cmId = cl.cmId; const cm = (ctx.cantieri||[]).find(c=>c.id===cl.cmId); if(cm) r.cmCode = cm.code; }
    r.actions.push({ icon: "👤", text: cl.nome, conf: cl.score });
  }

  // 3. ORDINE
  const ord = t.match(P.order);
  if (ord) {
    r.type = "task"; r.tag = "ordine"; r.priority = "alta";
    r.materiale = ord[1] || ord[2] || "materiale";
    r.displayTitle = "📦 Ordina " + r.materiale + (r.clienteNome ? " — " + r.clienteNome : "");
    r.confidence = Math.max(r.confidence, 0.9);
    r.actions.push({ icon: "📦", text: r.materiale });
  }

  // 4. MISURE
  const sm = t.match(P.measureSimple);
  if (sm) {
    const l = parseInt(sm[1]), h = parseInt(sm[2]);
    r.measures = { lAlto: l, lCentro: l, lBasso: l, hSx: h, hCentro: h, hDx: h };
  }
  const mPats = [
    [/larghezza\s+alto\s+(\d{2,5})/i, "lAlto"], [/larghezza\s+basso\s+(\d{2,5})/i, "lBasso"],
    [/larghezza\s+(?:centro?\s+)?(\d{2,5})/i, "lCentro"],
    [/altezza\s+sinistra\s+(\d{2,5})/i, "hSx"], [/altezza\s+destra\s+(\d{2,5})/i, "hDx"],
    [/altezza\s+(?:centro?\s+)?(\d{2,5})/i, "hCentro"],
    [/diagonal[ei]\s*1?\s+(\d{2,5})/i, "d1"], [/diagonal[ei]\s*2\s+(\d{2,5})/i, "d2"],
    [/spalletta\s+sinistra\s+(\d{2,5})/i, "spSx"], [/spalletta\s+destra\s+(\d{2,5})/i, "spDx"],
    [/spallette?\s+(\d{2,5})/i, "spBoth"], [/architrave\s+(\d{2,5})/i, "arch"],
    [/davanzale\s+(?:interno?\s+)?(\d{2,5})/i, "davInt"], [/davanzale\s+esterno?\s+(\d{2,5})/i, "davEst"],
  ];
  for (const [re, k] of mPats) {
    const m = t.match(re);
    if (m) { if (k === "spBoth") { r.measures.spSx = parseInt(m[1]); r.measures.spDx = parseInt(m[1]); } else r.measures[k] = parseInt(m[1]); }
  }
  if (r.measures.lCentro && !r.measures.lAlto) r.measures.lAlto = r.measures.lCentro;
  if (r.measures.lCentro && !r.measures.lBasso) r.measures.lBasso = r.measures.lCentro;
  if (r.measures.hCentro && !r.measures.hSx) r.measures.hSx = r.measures.hCentro;
  if (r.measures.hCentro && !r.measures.hDx) r.measures.hDx = r.measures.hCentro;
  // Fallback: numeri isolati
  if (Object.keys(r.measures).length === 0) {
    const nums = []; let nm; const nRe = /\b(\d{3,4})\b/g;
    while ((nm = nRe.exec(t)) !== null) nums.push(parseInt(nm[1]));
    if (nums.length >= 2) r.measures = { lAlto: nums[0], lCentro: nums[0], lBasso: nums[0], hSx: nums[1], hCentro: nums[1], hDx: nums[1] };
    else if (nums.length === 1) r.measures = { lCentro: nums[0], lAlto: nums[0], lBasso: nums[0] };
  }
  if (Object.keys(r.measures).length > 0) {
    if (!r.type) r.type = "measure";
    r.actions.push({ icon: "📐", text: r.measures.lCentro && r.measures.hCentro ? r.measures.lCentro+"×"+r.measures.hCentro : Object.keys(r.measures).length+" mis." });
    r.confidence = Math.max(r.confidence, 0.85);
  }

  // 5. TIPO INFISSO
  const tipoM = t.match(P.tipo);
  if (tipoM) {
    const tm = { finestra:"F1A", portafinestra:"PF1A", "porta blindata":"PBC", "porta garage":"PGA", scorrevol:"PST", vasistas:"VAS", bilico:"BIL", fisso:"FISSO", fissa:"FISSO" };
    let tipo = null;
    for (const [k,v] of Object.entries(tm)) { if (t.includes(k)) { tipo = v; break; } }
    if (t.match(/due\s+ante|2\s+ante/)) tipo = t.includes("portafinestra") ? "PF2A" : "F2A";
    if (t.match(/tre\s+ante|3\s+ante/)) tipo = t.includes("portafinestra") ? "PF3A" : "F3A";
    if (tipo) { r.vanoTipo = tipo; r.actions.push({ icon: "🪟", text: tipo }); }
  }

  // 6. STANZA + PIANO
  const stM = t.match(P.vanoWords);
  if (stM) { r.stanza = stM[1].charAt(0).toUpperCase() + stM[1].slice(1); r.actions.push({ icon: "🏠", text: r.stanza }); }
  const piM = t.match(P.piano);
  if (piM) {
    const pm = { terra:"PT",primo:"P1",secondo:"P2",terzo:"P3",quarto:"P4",quinto:"P5",seminterrato:"S1",interrato:"S1" };
    r.piano = pm[piM[1]] || "P"+piM[1]; r.actions.push({ icon: "🏢", text: r.piano });
  }

  // 7. COLORI + VETRO
  if (P.bicolore.test(t)) r.bicolore = true;
  const ci = t.match(P.coloreInt);
  if (ci) { const cm = { bianco:"RAL 9010",avorio:"RAL 1013",crema:"RAL 1015" }; r.coloreInt = cm[ci[1].toLowerCase()]||ci[1]; r.actions.push({ icon: "🎨", text: "Int:"+r.coloreInt }); }
  const ce = t.match(P.coloreEst);
  if (ce) { const cm = { antracite:"RAL 7016",grigio:"RAL 7016",marrone:"RAL 8017","7016":"RAL 7016" }; r.coloreEst = cm[ce[1].toLowerCase()]||ce[1].charAt(0).toUpperCase()+ce[1].slice(1); r.actions.push({ icon: "🎨", text: "Est:"+r.coloreEst }); }
  const vm = t.match(P.vetro);
  if (vm) { r.vetro = vm[1].charAt(0).toUpperCase()+vm[1].slice(1); r.actions.push({ icon: "🔲", text: r.vetro }); }

  // 8. ACCESSORI
  const accRe = P.accessori; accRe.lastIndex = 0; let am;
  while ((am = accRe.exec(t)) !== null) r.accessories.push(am[1].toLowerCase());
  if (r.accessories.length > 0) r.actions.push({ icon: "⚙", text: r.accessories.join(", ") });

  // 9. CLASSIFICAZIONE FINALE
  if (P.problem.test(t) && !r.type) { r.type = "problema"; r.priority = "alta"; r.tag = "problema"; r.confidence = Math.max(r.confidence, 0.9); }
  const timeM = t.match(P.time);
  if (timeM && !r.type) { r.type = "event"; r.time = parseTime(timeM[0]); r.date = parseDate(timeM[0]); r.confidence = Math.max(r.confidence, 0.8); r.actions.push({ icon: "📅", text: r.date+" "+r.time }); }
  if (P.action.test(t) && !r.type) { r.type = "task"; r.confidence = Math.max(r.confidence, 0.7); }
  if (P.positive.test(t) && !r.type) { r.type = "diary"; r.tag = "positivo"; r.confidence = Math.max(r.confidence, 0.6); }
  if (P.commercial.test(t) && !r.type) { r.type = "diary"; r.tag = "commerciale"; r.confidence = Math.max(r.confidence, 0.7); }
  if (!r.type) r.type = Object.keys(r.measures).length > 0 ? "measure" : "task";
  if (r.confidence === 0) r.confidence = 0.5;

  // Display title
  if (r.type === "measure" && r.measures.lCentro) r.displayTitle = "📐 "+r.measures.lCentro+"×"+(r.measures.hCentro||"?")+"mm"+(r.stanza ? " · "+r.stanza : "")+(r.vanoTipo ? " · "+r.vanoTipo : "");
  else if (r.type === "navigate") r.displayTitle = "🧭 Vai a "+(r.navigateTo||"...");
  return r;
}

function parseTime(h) { const o = h.match(/ore?\s?(\d{1,2})/i)||h.match(/alle?\s?(\d{1,2})/i); if(o) return o[1].padStart(2,"0")+":00"; if(/mattina/i.test(h)) return "09:00"; if(/pomeriggio/i.test(h)) return "15:00"; if(/sera|stasera/i.test(h)) return "19:00"; return "09:00"; }
function parseDate(h) {
  const d = new Date();
  if (/domani/i.test(h)) d.setDate(d.getDate()+1);
  else if (/dopodomani/i.test(h)) d.setDate(d.getDate()+2);
  else if (/settimana\s+prossima/i.test(h)) d.setDate(d.getDate()+7);
  else { const fra = h.match(/(?:fra|tra)\s+(\d+)\s+giorni?/i); if(fra) d.setDate(d.getDate()+parseInt(fra[1]));
    else { const days = {lunedi:1,"lunedì":1,martedi:2,"martedì":2,mercoledi:3,"mercoledì":3,giovedi:4,"giovedì":4,venerdi:5,"venerdì":5,sabato:6,domenica:0};
      for (const [n,dow] of Object.entries(days)) { if (h.toLowerCase().includes(n)) { let diff=dow-d.getDay(); if(diff<=0)diff+=7; d.setDate(d.getDate()+diff); break; } } } }
  return d.toISOString().split("T")[0];
}

// ═══ WAVEFORM ═══
function Waveform({ active }) {
  const [bars, setBars] = useState(Array(9).fill(3));
  useEffect(() => { if(!active) return; const iv = setInterval(() => setBars(p => p.map((_,i) => 3+Math.sin(Date.now()/180+i*1.1)*14+Math.random()*10)), 70); return () => clearInterval(iv); }, [active]);
  return (<div style={{ display:"flex", alignItems:"center", gap:3, height:40 }}>{bars.map((h,i) => <div key={i} style={{ width:4, height:h, borderRadius:2, background:"#DC4444", transition:"height 0.07s" }} />)}</div>);
}

// ═══ MAIN ═══
export default function VoiceAssistant({ onClose }) {
  const ctx = useMastro();
  const { T, toast, selectedCM, cantieri, contatti, events, tasks, setTasks, setEvents, setContatti, setTab, setSelectedCM, selectedVano, selectedRilievo, updateMisura, updateVanoField, toggleAccessorio } = ctx;

  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [liveActions, setLiveActions] = useState([]);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast("Browser non supporta riconoscimento vocale", "error"); return; }
    const rec = new SR(); rec.lang = "it-IT"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => {
      let fin = "", int = "";
      for (let i = 0; i < e.results.length; i++) { if (e.results[i].isFinal) fin += e.results[i][0].transcript; else int += e.results[i][0].transcript; }
      setTranscript(fin); setInterim(int);
      const full = (fin+" "+int).trim();
      if (full.length > 3) { clearTimeout(timerRef.current); timerRef.current = setTimeout(() => {
        const preview = analyzeVoice(full, { contatti, cantieri, selectedCM, selectedVano, events, tasks });
        setLiveActions(preview.actions);
      }, 350); }
    };
    rec.onerror = (e) => { if (e.error === "not-allowed") toast("Microfono non autorizzato", "error"); };
    rec.onend = () => { if (recognitionRef.current) { recognitionRef.current = null; setRecording(false); const full = (transcript+" "+interim).trim(); if (full) { setProcessing(true); const analysis = analyzeVoice(full, { contatti, cantieri, selectedCM, selectedVano, events, tasks }); executeAction(analysis); setTimeout(() => { setResult(analysis); setProcessing(false); }, 400); } } };
    recognitionRef.current = rec; rec.start();
    setRecording(true); setTranscript(""); setInterim(""); setResult(null); setLiveActions([]);
  };

  const stopRecording = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    setRecording(false);
    const full = (transcript+" "+interim).trim();
    if (!full) { toast("Nessun audio rilevato", "warning"); return; }
    setProcessing(true);
    const analysis = analyzeVoice(full, { contatti, cantieri, selectedCM, selectedVano, events, tasks });
    // Execute IMMEDIATELY — don't wait for animation
    executeAction(analysis);
    // Then show result after brief animation
    setTimeout(() => { setResult(analysis); setProcessing(false); }, 400);
  };

  const executeAction = (r) => {
    const now = new Date();
    // NAVIGATE
    if (r.type === "navigate" && r.navigateTo) {
      if (r.cmId) { const cm = cantieri.find(c => c.id === r.cmId); if (cm) { setSelectedCM(cm); setTab("commesse"); toast("📂 "+cm.code+" — "+cm.cliente, "success"); } }
      else { setTab(r.navigateTo); toast("🧭 "+r.navigateTo, "success"); }
      return;
    }
    // MEASURE + vano context
    if (r.type === "measure" && selectedVano && selectedRilievo) {
      const mid = selectedVano.id;
      for (const [k,v] of Object.entries(r.measures)) { if (typeof v === "number" && v > 0) updateMisura(mid, k, v); }
      if (r.vanoTipo) updateVanoField(mid, "tipo", r.vanoTipo);
      if (r.stanza) updateVanoField(mid, "stanza", r.stanza);
      if (r.piano) updateVanoField(mid, "piano", r.piano);
      if (r.coloreInt) updateVanoField(mid, "coloreInt", r.coloreInt);
      if (r.coloreEst) updateVanoField(mid, "coloreEst", r.coloreEst);
      if (r.bicolore) updateVanoField(mid, "bicolore", true);
      if (r.vetro) updateVanoField(mid, "vetro", r.vetro);
      for (const acc of r.accessories) { if (["tapparella","zanzariera","persiana","cassonetto","controtelaio","coprifilo"].includes(acc)) toggleAccessorio(mid, acc); }
      toast("📐 Misure applicate"+(r.measures.lCentro ? ": "+r.measures.lCentro+"×"+(r.measures.hCentro||"?") : ""), "success");
      return;
    }
    // MEASURE without vano
    if (r.type === "measure") {
      setTasks(prev => [...prev, { id:"TK-"+Date.now(), text:"📐 "+r.displayTitle, done:false, priority:"media", meta:r.cmCode||r.clienteNome||"", cmId:r.cmId, createdAt:now.toISOString() }]);
      toast("📐 Misure salvate come task", "success"); return;
    }
    // EVENT
    if (r.type === "event") {
      setEvents(prev => [...prev, { id:"EV-"+Date.now(), text:r.title, date:r.date||now.toISOString().split("T")[0], time:r.time||"09:00", tipo:"sopralluogo", persona:r.clienteNome||"", color:T.acc, cmId:r.cmId }]);
      toast("📅 Evento: "+r.title.slice(0,40), "success", () => { setTab("agenda"); onClose(); }); return;
    }
    // TASK / PROBLEMA / ORDINE
    if (r.type === "task" || r.type === "problema") {
      setTasks(prev => [...prev, { id:"TK-"+Date.now(), text:r.displayTitle||r.title, done:false, priority:r.priority, meta:r.cmCode||(r.clienteNome||""), cmId:r.cmId, createdAt:now.toISOString() }]);
      const icon = r.tag==="ordine"?"📦":r.tag==="problema"?"⚠️":"✓";
      toast(icon+" Task: "+(r.displayTitle||r.title).slice(0,40), r.priority==="alta"?"error":"success", () => { setTab("agenda"); onClose(); });
      if (r.tag === "ordine" && r.cmId) { setTimeout(() => { const cm = cantieri.find(c=>c.id===r.cmId); if(cm){setSelectedCM(cm);setTab("commesse");} }, 1200); }
      return;
    }
    // DIARY
    if (r.type === "diary" && r.clienteNome) {
      const cliente = contatti.find(c => (c.nome+" "+(c.cognome||"")).trim().toLowerCase().includes(r.clienteNome.toLowerCase().split(" ")[0]));
      if (cliente) {
        const entry = { id:"D-"+Date.now(), data:now.toLocaleDateString("it-IT",{day:"numeric",month:"short"}), testo:r.title, tag:r.tag };
        setContatti(prev => prev.map(x => x.id===cliente.id ? {...x, diario:[entry,...(x.diario||[])]} : x));
        toast("📖 Diario "+cliente.nome, "success"); return;
      }
    }
    // Fallback
    setTasks(prev => [...prev, { id:"TK-"+Date.now(), text:r.title, done:false, priority:"media", meta:r.clienteNome||"Vocale", cmId:r.cmId, createdAt:now.toISOString() }]);
    toast("📝 Nota salvata", "success");
  };

  const tc = { task:{l:"Task",c:T.acc,i:"✓"}, event:{l:"Evento",c:"#3B7FE0",i:"📅"}, diary:{l:"Diario",c:"#6B7280",i:"📖"}, problema:{l:"Problema",c:"#DC4444",i:"⚠️"}, navigate:{l:"Navigazione",c:"#1A9E73",i:"🧭"}, measure:{l:"Misure",c:"#507aff",i:"📐"} }[result?.type] || { l:"Task",c:T.acc,i:"✓" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.92)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24 }}>

      {/* Close */}
      <div onClick={() => { recognitionRef.current?.stop(); onClose(); }} style={{ position:"absolute", top:16, right:16, width:36, height:36, borderRadius:18, background:"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
        <I d={ICO.x} s={18} c="rgba(255,255,255,0.5)" />
      </div>

      {/* Context */}
      {selectedCM && <div style={{ position:"absolute", top:16, left:16, padding:"4px 10px", borderRadius:8, background:"rgba(255,255,255,0.06)", fontSize:10, color:"rgba(255,255,255,0.35)", fontWeight:700 }}>📂 {selectedCM.code} · {selectedCM.cliente}</div>}
      {selectedVano && <div style={{ position:"absolute", top:38, left:16, padding:"3px 8px", borderRadius:6, background:"rgba(80,122,255,0.12)", fontSize:9, color:"#507aff", fontWeight:700 }}>🪟 {selectedVano.tipo||"?"} · {selectedVano.stanza||"?"}</div>}

      {/* Status */}
      <div style={{ color:"rgba(255,255,255,0.35)", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", marginBottom:20 }}>
        {recording ? "🔴 Sto ascoltando..." : processing ? "✨ Analizzo..." : result ? "Fatto!" : "Premi per parlare"}
      </div>

      {/* Mic */}
      {!recording && !processing && !result && (
        <div onClick={startRecording} style={{ width:80, height:80, borderRadius:40, background:"linear-gradient(135deg, #DC4444, #ff6b6b)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 0 40px rgba(220,68,68,0.3)" }}>
          <I d={ICO.mic} s={32} c="#fff" />
        </div>
      )}

      {/* Recording */}
      {recording && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
          <Waveform active={true} />
          <div onClick={stopRecording} style={{ width:64, height:64, borderRadius:32, background:"#DC4444", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", boxShadow:"0 0 30px rgba(220,68,68,0.5)" }}>
            <div style={{ width:20, height:20, borderRadius:3, background:"#fff" }} />
          </div>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", textAlign:"center", maxWidth:280, lineHeight:1.6 }}>
            {selectedVano ? "🪟 Dici misure, tipo, stanza, colori, accessori..." : "💬 Comandi, task, eventi, ordini, navigazione..."}
          </div>
        </div>
      )}

      {/* Processing */}
      {processing && <div style={{ width:64, height:64, borderRadius:32, background:T.acc, display:"flex", alignItems:"center", justifyContent:"center", animation:"vaP 1s infinite" }}><I d={ICO.sparkles} s={28} c="#fff" /></div>}

      {/* Transcript */}
      {(transcript||interim) && <div style={{ marginTop:20, maxWidth:320, textAlign:"center" }}><div style={{ fontSize:15, color:"#fff", fontWeight:600, lineHeight:1.5 }}>"{transcript}<span style={{ color:"rgba(255,255,255,0.35)" }}>{interim}</span>"</div></div>}

      {/* Live chips */}
      {recording && liveActions.length > 0 && (
        <div style={{ display:"flex", gap:4, flexWrap:"wrap", justifyContent:"center", marginTop:8 }}>
          {liveActions.map((a,i) => <span key={i} style={{ padding:"3px 8px", borderRadius:8, fontSize:10, fontWeight:700, background:"rgba(26,158,115,0.15)", color:"#1A9E73", border:"1px solid rgba(26,158,115,0.25)", animation:"vaF 0.3s ease" }}>{a.icon} {a.text}</span>)}
        </div>
      )}

      {/* Result */}
      {result && !processing && (
        <div style={{ marginTop:20, background:"rgba(255,255,255,0.06)", borderRadius:16, padding:18, maxWidth:340, width:"100%", border:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10, flexWrap:"wrap" }}>
            <span style={{ padding:"3px 10px", borderRadius:6, background:tc.c+"25", color:tc.c, fontSize:10, fontWeight:700, textTransform:"uppercase" }}>{tc.i} {tc.l}</span>
            {result.priority === "alta" && <span style={{ padding:"3px 8px", borderRadius:6, background:"#DC444425", color:"#DC4444", fontSize:10, fontWeight:700 }}>🔴 URGENTE</span>}
            {result.tag !== "nota" && <span style={{ padding:"3px 8px", borderRadius:6, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", fontSize:9, fontWeight:700 }}>{result.tag}</span>}
          </div>
          {result.actions.length > 0 && <div style={{ display:"flex", gap:4, flexWrap:"wrap", marginBottom:8 }}>{result.actions.map((a,i) => <span key={i} style={{ padding:"2px 7px", borderRadius:6, background:"rgba(26,158,115,0.12)", color:"#1A9E73", fontSize:9, fontWeight:700 }}>{a.icon} {a.text}</span>)}</div>}
          {result.clienteNome && <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginBottom:3 }}>👤 {result.clienteNome}</div>}
          {result.cmCode && <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginBottom:3 }}>📂 {result.cmCode}</div>}
          {Object.keys(result.measures).length > 0 && (
            <div style={{ marginTop:6, padding:"6px 8px", borderRadius:8, background:"rgba(80,122,255,0.1)", border:"1px solid rgba(80,122,255,0.2)" }}>
              <div style={{ fontSize:9, color:"#507aff", fontWeight:700, marginBottom:3 }}>📐 MISURE</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>{Object.entries(result.measures).map(([k,v]) => <span key={k} style={{ padding:"2px 5px", borderRadius:4, background:"rgba(80,122,255,0.15)", color:"#fff", fontSize:10, fontWeight:700, fontFamily:FM }}>{k}:{v}</span>)}</div>
            </div>
          )}
          <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ flex:1, height:3, borderRadius:2, background:"rgba(255,255,255,0.08)" }}><div style={{ height:3, borderRadius:2, background:result.confidence>0.7?"#1A9E73":result.confidence>0.5?"#E8A020":"#DC4444", width:(result.confidence*100)+"%", transition:"width 0.3s" }} /></div>
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>{Math.round(result.confidence*100)}%</span>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:14 }}>
            <div onClick={() => { recognitionRef.current?.stop(); setTimeout(onClose, 100); }} style={{ flex:1, padding:"10px 0", borderRadius:10, background:tc.c, color:"#fff", textAlign:"center", fontSize:13, fontWeight:700, cursor:"pointer" }}>✓ OK</div>
            <div onClick={() => { setResult(null); setTranscript(""); setInterim(""); setLiveActions([]); }} style={{ padding:"10px 16px", borderRadius:10, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)", textAlign:"center", fontSize:13, fontWeight:600, cursor:"pointer" }}>🔄</div>
          </div>
        </div>
      )}

      <style>{`@keyframes vaP{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:0.85}} @keyframes vaF{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
