"use client";
import DraggableFAB from "@/components/DraggableFAB";
// =======================================================
// MASTRO ERP v2 - PARTE 1/5
// Righe 1-1280: Costanti, Dati Demo (incluse visite/vaniList/euro/scadenza),
// Continuazione in PARTE2
// =======================================================
// components/MastroERP.tsx
// MASTRO ERP - adattato per Next.js + Supabase
import React, { useState, useRef, useCallback, useEffect } from "react";
import MastroDesktop from "./MastroDesktop";
// import { getAziendaId, loadAllData, saveCantiere, saveEvent, deleteEvent as deleteEventDB, saveContatto, saveTeamMember, saveTask, saveAzienda, saveVano, deleteVano, saveMateriali, savePipeline } from "@/lib/supabase-sync";
import { supabase } from "@/lib/supabase";
import { useSyncEngine, SyncStatusBar } from "./mastro-sync";
import { useCloudLoader, persistAndSync } from "../hooks/useCloudLoader";
import { generaPreventivoPDF as _generaPreventivoPDF } from "../lib/pdf-preventivo";
import { generaPDFMisure as _generaPDFMisure } from "../lib/pdf-misure";
import { generaFatturaPDF as _generaFatturaPDF, generaOrdinePDF as _generaOrdinePDF, generaConfermaFirmataPDF as _generaConfermaFirmataPDF, generaXmlSDI as _generaXmlSDI, generaTrackingCliente as _generaTrackingCliente } from "../lib/pdf-documents";
import { generaPreventivoCondivisibile as _generaPrevCond, estraiDatiPDF as _estraiDatiPDF } from "../lib/pdf-condivisibile";
import { importExcelCatalog as _importExcelCatalog } from "../lib/import-utils";
import { caricaDemoCompleto as _caricaDemoCompleto } from "../lib/demo-data";
import { verificaGate, buildLogEntry, eseguiAutomazioni, labelRequisito } from "../lib/workflow";
import { MastroErrorBoundary, PanelErrorBoundary } from "./MastroErrorBoundary";
import { useConfirmDialog, useToast, exportAllData } from "./mastro-ui-safety";
import { validateCommessa, validateVano, validateTask, validateEvento, validateFatturaPassiva, validateMisura, sanitize, FormErrors, FieldError } from "./mastro-validation";

// === CLOUD SYNC HELPERS ===
const SYNC_KEYS = ["cantieri","events","contatti","tasks","problemi","team","azienda","pipeline","sistemi","vetri","colori","coprifili","lamiere","libreria","fatture","squadre","montaggi","ordiniForn"];


import { getAziendaId, loadAllData, saveCantiere, saveEvent, deleteEventDB, saveContatto, saveTeamMember, saveTask, saveAzienda, saveVanoDB, saveMateriali, savePipeline, FONT, FF, FM, tipoToMinCat, THEMES, PLANS, PIPELINE_DEFAULT, MOTIVI_BLOCCO, AFASE, CANTIERI_INIT, FATTURE_INIT, ORDINI_INIT, MONTAGGI_INIT, TASKS_INIT, AI_INBOX_INIT, MSGS_INIT, TEAM_INIT, CONTATTI_INIT, COLORI_INIT, SISTEMI_INIT, VETRI_INIT, TIPOLOGIE_RAPIDE, SETTORI, SETTORI_DEFAULT, COPRIFILI_INIT, LAMIERE_INIT, Ico, I, ICO, PUNTI_MISURE, useDragOrder, TIPI_EVENTO, tipoEvColor } from "./mastro-constants";
const STATI_ORD_MINI=[{id:'bozza',l:'Bozza',c:'#999'},{id:'approvato',l:'Approvato',c:'#3B7FE0'},{id:'inviato',l:'Inviato',c:'#D08008'},{id:'confermato_forn',l:'Confermato',c:'#6366F1'},{id:'modificato_forn',l:'Modificato',c:'#F59E0B'},{id:'in_produzione',l:'In prod.',c:'#7C3AED'},{id:'spedito',l:'Spedito',c:'#3B7FE0'},{id:'ricevuto_parziale',l:'Parziale',c:'#D08008'},{id:'ricevuto',l:'Ricevuto',c:'#1A9E73'},{id:'controllato',l:'Controllato',c:'#059669'},{id:'chiuso',l:'Chiuso',c:'#6B7280'},{id:'contestato',l:'Contestato',c:'#DC4444'},{id:'annullato',l:'Annullato',c:'#DC4444'}];
import { MastroContext } from "./MastroContext";
import SettingsPanel from "./SettingsPanel";
import PreventivoModal from "./PreventivoModal";
import RilieviListPanel from "./RilieviListPanel";
import VanoDetailPanel from "./VanoDetailPanel";
import VanoSectorRouter from "./VanoSectorRouter";
import HomePanel from "./HomePanelMobile";
import VoiceAssistant from "./VoiceAssistant";
import CMDetailPanel from "./CMDetailPanel";
import NodiTecniciPanel from "./NodiTecniciPanel";
import OrdiniFornitori from "./OrdiniFornitori";
import CostruttoreLavorazioni from "./CostruttoreLavorazioni";
import ModalPanel from "./ModalPanel";
import RiepilogoPanel from "./RiepilogoPanel";
import AgendaPanel from "./AgendaPanel";
import MessaggiPanel from "./MessaggiPanel";
import AssistentePanel from "./AssistentePanel";
import ContabilitaPanel from "./ContabilitaPanel";
// ClientiPanel inline (was external)
import CommessePanel from "./CommessePanel";
import { OnboardingPanel, FirmaModalPanel } from "./OnboardingPanel";
import MastroStrutture from "./MastroStrutture";
import MontaggiCalendar from "./MontaggiCalendar";
import { useOfflineCache } from "@/hooks/useOfflineCache";

function MastroMisureInner({ user, azienda: aziendaInit }: { user?: any, azienda?: any }) {
  const [theme, setTheme] = useState("fliwox");
  const T = THEMES[theme];
  useEffect(() => { document.body.style.background = T.bg; }, [T.bg]);
  // Inject font link in <head> client-side to avoid SSR hydration mismatch
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "mastro-font-link";
    if (!document.getElementById(id)) {
      const el = document.createElement("link");
      el.id = id;
      el.rel = "stylesheet";
      el.href = FONT;
      document.head.appendChild(el);
    }
  }, []);
  const userId = user?.id || null;
  const isUuid = userId ? /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(userId) : false;
  const sync = useSyncEngine(isUuid ? userId : null);
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const { toast, ToastContainer } = useToast();
  
  const [tab, setTab] = useState("home");
  // === SUBSCRIPTION ===
  const [subPlan, setSubPlan] = useState<string>("pro");
  const [trialStart] = useState(() => { if (typeof window === "undefined") return new Date(); const s = localStorage.getItem("mastro_trial_start"); if (s) return new Date(s); const d = new Date(); localStorage.setItem("mastro_trial_start", d.toISOString()); return d; });
  const trialDaysLeft = 30;
  const activePlan = subPlan === "trial" && trialDaysLeft <= 0 ? "free" : subPlan;
  const plan = PLANS[activePlan] || PLANS.free;
  const [showPaywall, setShowPaywall] = useState<string | null>(null);
  const canDo = (action: string) => {
    if (action === "commessa" && cantieri.length >= plan.maxCommesse) { setShowPaywall("Hai raggiunto il limite di " + plan.maxCommesse + " commesse. Passa a un piano superiore per continuare."); return false; }
    if (action === "pdf" && !plan.pdf) { setShowPaywall("La generazione PDF è disponibile dal piano Pro."); return false; }
    if (action === "sync" && !plan.sync) { setShowPaywall("La sync real-time è disponibile dal piano Pro."); return false; }
    return true;
  };
  const WIDGET_IDS = ["contatori", "io", "attenzione", "programma", "settimana", "commesse", "azioni", "dashboard"];
  const drag = useDragOrder(WIDGET_IDS);
  const [homeEditMode, setHomeEditMode] = useState(false);
  const [dayOffset, setDayOffset] = useState(0);
  const [ioChecked, setIoChecked] = useState<Record<string,boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string,boolean>>({});
  const [lastOpenedCMId, setLastOpenedCMId] = useState<string|null>(null);
  // Wizard nuova visita
  const [cmSubTab, setCmSubTab] = useState("sopralluoghi"); // "sopralluoghi" | "misure" | "info"
  const [nvView, setNvView] = useState(false);
  const [nvStep, setNvStep] = useState(1);
  const [nvData, setNvData] = useState({ data: "", ora: "", rilevatore: "" });
  const [nvTipo, setNvTipo] = useState("rilievo"); // "rilievo" | "definitiva" | "modifica"
  const [nvMotivoModifica, setNvMotivoModifica] = useState("");
  const [nvVani, setNvVani] = useState([]);
  const [nvBlocchi, setNvBlocchi] = useState({});
  const [nvNote, setNvNote] = useState("");
  // NO DEMO DATA — production mode, all empty by default
  // Calendario griglia espandibile
  const [expandedDay, setExpandedDay] = useState(null); // ISO string del giorno espanso
  const [cantieri, setCantieri] = useState<any[]>([]);
  // Offline cache IndexedDB — carica al mount, salva ad ogni cambio
  const { loadFromCache, getCacheInfo } = useOfflineCache(cantieri, setCantieri, cantieri.length > 0 || typeof window !== "undefined");
  const [tasks, setTasks] = useState<any[]>([]);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [replyText, setReplyText] = useState("");
  // === MODULO PROBLEMI ===
  const [problemi, setProblemi] = useState<any[]>([]);
  const [showProblemaModal, setShowProblemaModal] = useState(false);
  const [selectedProblema, setSelectedProblema] = useState<any>(null);
  const [problemaForm, setProblemaForm] = useState({ titolo: "", descrizione: "", tipo: "materiale", priorita: "media", assegnato: "" });
  const [showProblemiView, setShowProblemiView] = useState(false);
  const [showStrutture, setShowStrutture] = useState(false);
  // Save problemi to localStorage
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "problemi", problemi), [problemi]);
  const [team, setTeam] = useState<any[]>([]);
  const [coloriDB, setColoriDB] = useState(COLORI_INIT);
  const [sistemiDB, setSistemiDB] = useState(SISTEMI_INIT);
  const [vetriDB, setVetriDB] = useState(VETRI_INIT);
  const [coprifiliDB, setCoprifiliDB] = useState(COPRIFILI_INIT);
  const [lamiereDB, setLamiereDB] = useState(LAMIERE_INIT);
  // Listini per settore - struttura: { id, nome, euroMq, minimoMq, griglia: [{l,h,prezzo}] }
  const [tapparelleListino, setTapparelleListino] = useState<any[]>([]);
  const [persianeListino, setPersianeListino] = useState<any[]>([]);
  const [zanzariereListino, setZanzariereListino] = useState<any[]>([]);
  const [tendeListino, setTendeListino] = useState<any[]>([]);
  const [pergoleListino, setPergoleListino] = useState<any[]>([]);
  const [libreriaDB, setLibreriaDB] = useState<any[]>([
    { id: 1, nome: "Controtelaio monoblocco", categoria: "Controtelaio", prezzo: 85, unita: "pz" },
    { id: 2, nome: "Davanzale marmo", categoria: "Davanzale", prezzo: 45, unita: "ml" },
    { id: 3, nome: "Soglia alluminio", categoria: "Soglia", prezzo: 25, unita: "ml" },
    { id: 4, nome: "Opere murarie", categoria: "Opere", prezzo: 120, unita: "forfait" },
    { id: 5, nome: "Cassonetto coibentato", categoria: "Cassonetto", prezzo: 95, unita: "ml" },
    { id: 6, nome: "Zoccolino raccordo", categoria: "Accessorio", prezzo: 12, unita: "ml" },
  ]);
  const [telaiPersianaDB, setTelaiPersianaDB] = useState([
    { id: "tp1", code: "L" }, { id: "tp2", code: "Z 22" }, { id: "tp3", code: "Z 27" }, { id: "tp4", code: "Z 40" }, { id: "tp5", code: "Z 50" }
  ]);
  const [posPersianaDB, setPosPersianaDB] = useState([
    { id: "pp1", code: "In battuta" }, { id: "pp2", code: "Con zoccoletto" }, { id: "pp3", code: "A filo muro" }, { id: "pp4", code: "Su controtelaio" }
  ]);
  const [tipoMisuraDB, setTipoMisuraDB] = useState([
    { id: "tm1", code: "Punta corta" }, { id: "tm2", code: "Punta lunga" }, { id: "tm3", code: "Muro finito" }, { id: "tm4", code: "Muro grezzo" }
  ]);
  const [tipoMisuraTappDB, setTipoMisuraTappDB] = useState([
    { id: "tmt1", code: "Misura luce guida" }, { id: "tmt2", code: "Misura finita tapparella" }
  ]);
  const [tipoMisuraZanzDB, setTipoMisuraZanzDB] = useState([
    { id: "tmz1", code: "Misura muro finito" }, { id: "tmz2", code: "Misura esterna zanzariera" }
  ]);
  const [tipoCassonettoDB, setTipoCassonettoDB] = useState([
    { id: "tc1", code: "Monoblocco" }, { id: "tc2", code: "Esterno" }, { id: "tc3", code: "A scomparsa" }, { id: "tc4", code: "Sopraluce" }
  ]);
  const [ctProfDB, setCtProfDB] = useState([
    { id: "cp1", code: "40" }, { id: "cp2", code: "45" }, { id: "cp3", code: "50" }, { id: "cp4", code: "55" }, { id: "cp5", code: "60" }, { id: "cp6", code: "65" }, { id: "cp7", code: "70" }
  ]);
  const [ctSezioniDB, setCtSezioniDB] = useState([
    { id: "cs1", code: "56Ã—40" }, { id: "cs2", code: "56Ã—50" }, { id: "cs3", code: "56Ã—60" }, { id: "cs4", code: "56Ã—70" }, { id: "cs5", code: "76Ã—50" }, { id: "cs6", code: "76Ã—60" }
  ]);
  const [ctCieliniDB, setCtCieliniDB] = useState([
    { id: "cc1", code: "A tampone" }, { id: "cc2", code: "A tappo" }, { id: "cc3", code: "Frontale" }
  ]);
  const [ctOffset, setCtOffset] = useState(10); // mm per lato (totale = x2)
  const [pipelineDB, setPipelineDB] = useState(PIPELINE_DEFAULT);
  const [faseOpen, setFaseOpen] = useState(true);
  const [sogliaDays, setSogliaDays] = useState(5);
  const [showFirmaModal, setShowFirmaModal] = useState(false);
  const [firmaDrawing, setFirmaDrawing] = useState(false);
  const [firmaDataUrl, setFirmaDataUrl] = useState(null);
  const [showPreventivoModal, setShowPreventivoModal] = useState(false);
  const [favTipologie, setFavTipologie] = useState(["F1A", "F2A", "PF2A", "SC2A", "FISDX", "VAS"]);
  
  // Fatturazione
  const [fattureDB, setFattureDB] = useState<any[]>([]);

  //  FATTURE PASSIVE (ricevute da fornitori) 
  const [fatturePassive, setFatturePassive] = useState<any[]>(() => {
    try { const v = localStorage.getItem("mastro:fatturePassive"); return v ? JSON.parse(v) : []; } catch(e) { return []; }
  });
  const [showFatturaPassiva, setShowFatturaPassiva] = useState(false);
  const [newFattPassiva, setNewFattPassiva] = useState({ fornitore: "", numero: "", data: "", importo: 0, iva: 22, descrizione: "", cmId: "", pagata: false, scadenza: "" });

  //  CONTABILITÃ€ 
  const [showContabilita, setShowContabilita] = useState(false);
  const [contabTab, setContabTab] = useState("panoramica");
  const [contabMese, setContabMese] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });

  //  CRONOLOGIA 
  const [showCronologia, setShowCronologia] = useState(false);

  //  KIT ACCESSORI 
  const [kitAccessori, setKitAccessori] = useState(() => {
    try { const v = localStorage.getItem("mastro:kit"); return v ? JSON.parse(v) : [
      { id: 1, nome: "Kit Standard", items: ["Maniglia", "Cerniere x2", "Guarnizione"], prezzo: 45 },
      { id: 2, nome: "Kit Sicurezza", items: ["Maniglia con chiave", "Cerniere x3", "Defender", "Multipoint"], prezzo: 120 },
      { id: 3, nome: "Kit Scorrevole", items: ["Binario", "Carrelli x2", "Chiusura soft", "Maniglia incasso"], prezzo: 180 },
    ]; } catch(e) { return []; }
  });

  //  FORNITORI PRO 
  const [fornitori, setFornitori] = useState(() => {
    try { const v = localStorage.getItem("mastro:fornitori"); if (v) { const p = JSON.parse(v); if (Array.isArray(p) && p.length > 0) return p; } } catch(e) {}
    return [
    { id: "f1", nome: "Aluplast Italia", ragioneSociale: "Aluplast Italia SRL", piva: "01234567890", cf: "", tipo: "Profili PVC", categoria: "profili", indirizzo: "Via Roma 10", cap: "37100", citta: "Verona", provincia: "VR", telefono: "+39 045 123456", cellulare: "", email: "ordini@aluplast.it", pec: "aluplast@pec.it", sito: "www.aluplast.it", referente: "Marco Rossi", telReferente: "+39 333 1234567", emailReferente: "m.rossi@aluplast.it", banca: "Unicredit", iban: "IT60X0542811101000000123456", pagamento: "60gg_fm", scontoBase: 35, tempoConsegna: 18, sistemiTrattati: "Ideal 4000, Ideal 7000, Ideal 8000", note: "Fornitore principale PVC", rating: 4.6, preferito: true, attivo: true },
    { id: "f2", nome: "SchÃ¼co International", ragioneSociale: "SchÃ¼co International Italia SRL", piva: "09876543210", cf: "", tipo: "Profili Alluminio", categoria: "profili", indirizzo: "Via Milano 50", cap: "20100", citta: "Milano", provincia: "MI", telefono: "+39 02 654321", cellulare: "", email: "italia@schueco.com", pec: "schuco@pec.it", sito: "www.schueco.com", referente: "Luca Bianchi", telReferente: "+39 335 7654321", emailReferente: "l.bianchi@schueco.com", banca: "Intesa", iban: "", pagamento: "60gg_fm", scontoBase: 30, tempoConsegna: 22, sistemiTrattati: "AWS 75, ASS 70, ASS 77", note: "", rating: 4.8, preferito: true, attivo: true },
    { id: "f3", nome: "Pilkington Italia", ragioneSociale: "Pilkington Italia SPA", piva: "", cf: "", tipo: "Vetri", categoria: "vetri", indirizzo: "", cap: "", citta: "Napoli", provincia: "NA", telefono: "+39 081 789012", cellulare: "", email: "ordini@pilkington.it", pec: "", sito: "", referente: "", telReferente: "", emailReferente: "", banca: "", iban: "", pagamento: "30gg_fm", scontoBase: 20, tempoConsegna: 12, sistemiTrattati: "", note: "", rating: 4.3, preferito: false, attivo: true },
    { id: "f4", nome: "Roto Frank", ragioneSociale: "Roto Frank AG", piva: "", cf: "", tipo: "Ferramenta", categoria: "ferramenta", indirizzo: "", cap: "", citta: "Bolzano", provincia: "BZ", telefono: "+39 0471 345678", cellulare: "", email: "italia@roto-frank.com", pec: "", sito: "", referente: "", telReferente: "", emailReferente: "", banca: "", iban: "", pagamento: "30gg_fm", scontoBase: 25, tempoConsegna: 8, sistemiTrattati: "", note: "", rating: 4.5, preferito: false, attivo: true },
  ]; });
  const [showFornitoreDetail, setShowFornitoreDetail] = useState<any>(null);
  const [showFornitoreForm, setShowFornitoreForm] = useState(false);
  const [fornitoreEdit, setFornitoreEdit] = useState<any>(null);

  //  TEMI CUSTOM 
  const [customThemes, setCustomThemes] = useState(() => {
    try { const v = localStorage.getItem("mastro:customThemes"); return v ? JSON.parse(v) : []; } catch(e) { return []; }
  });

  //  VOCE AI 
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(()=>{try{localStorage.setItem("mastro:fatturePassive",JSON.stringify(fatturePassive));}catch(e){}},[fatturePassive]);
  useEffect(()=>{try{localStorage.setItem("mastro:fornitori",JSON.stringify(fornitori));}catch(e){}},[fornitori]);
  useEffect(()=>{try{localStorage.setItem("mastro:kit",JSON.stringify(kitAccessori));}catch(e){}},[kitAccessori]);
  useEffect(()=>{try{localStorage.setItem("mastro:customThemes",JSON.stringify(customThemes));}catch(e){}},[customThemes]);
  const [ordiniFornDB, setOrdiniFornDB] = useState<any[]>([]);
  const [showFatturaModal, setShowFatturaModal] = useState(false);
  const [fatturaEdit, setFatturaEdit] = useState<any>(null);
  
  // Squadre montaggio
  const [squadreDB, setSquadreDB] = useState<any[]>([
    { id: "sq1", nome: "Squadra A", membri: ["Mario", "Giuseppe"], colore: "#0D7C6B" },
    { id: "sq2", nome: "Squadra B", membri: ["Paolo", "Andrea"], colore: "#1A9E73" },
  ]);
  const [montaggiDB, setMontaggiDB] = useState<any[]>([]);
  
  // Settori attivi + Onboarding
  const [settoriAttivi, setSettoriAttivi] = useState<string[]>(SETTORI_DEFAULT);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pianoAttivo, setPianoAttivo] = useState<"free"|"pro"|"business">("pro"); // default pro for dev
  
  // Tipologie filtrate per settori attivi
  const tipologieFiltrate = TIPOLOGIE_RAPIDE.filter(t => settoriAttivi.includes(t.settore));
  
  // Stato calendario montaggi
  const [calMontaggiWeek, setCalMontaggiWeek] = useState(0);
  const [showCalMontaggi, setShowCalMontaggi] = useState(false);
  const [calMontaggiTarget, setCalMontaggiTarget] = useState<string | null>(null);
  const [montFormOpen, setMontFormOpen] = useState(false);
  const [montFormData, setMontFormData] = useState({ data: "", orario: "08:00", durata: "giornata", squadraId: "", note: "" });
  const [ccConfirm, setCcConfirm] = useState<string | null>(null);
  const [ccDone, setCcDone] = useState<string | null>(null);
  const [firmaStep, setFirmaStep] = useState(0);
  const [firmaFileUrl, setFirmaFileUrl] = useState<string | null>(null);
  const [firmaFileName, setFirmaFileName] = useState("");
  const [fattPerc, setFattPerc] = useState(50);
  const [voceTempDesc, setVoceTempDesc] = useState("");
  const [voceTempImporto, setVoceTempImporto] = useState("");
  const [voceTempQta, setVoceTempQta] = useState("1");
  const [prevWorkspace, setPrevWorkspace] = useState(false);
  const [prevTab, setPrevTab] = useState("preventivo");
  const [editingVanoId, setEditingVanoId] = useState(null);
  const [drawingVanoId, setDrawingVanoId] = useState(null);
  const [montGiorni, setMontGiorni] = useState(1);
  const [docViewer, setDocViewer] = useState<{ docs: any[], title: string } | null>(null);
  const [ccExpandStep, setCcExpandStep] = useState<string|null>(null);
  const [confSett, setConfSett] = useState(""); // settimane consegna input
  
  // Navigation
  const [selectedCM, setSelectedCM] = useState(null);
  const [selectedRilievo, setSelectedRilievo] = useState(null); // rilievo aperto
  const [showNuovoRilievo, setShowNuovoRilievo] = useState(false);
  const [nuovoRilTipo, setNuovoRilTipo] = useState("rilievo");
  const [nuovoRilData, setNuovoRilData] = useState({ data: "", ora: "", rilevatore: "", note: "", motivoModifica: "" });
  const [selectedVano, setSelectedVano] = useState(null);
  const [filterFase, setFilterFase] = useState("tutte");
  const [searchQ, setSearchQ] = useState("");
  const [showModal, setShowModal] = useState(null); // 'task' | 'commessa' | 'vano' | null
  const [settingsTab, setSettingsTab] = useState("generali");
  const [expandedPipelinePhase, setExpandedPipelinePhase] = useState(null);
  const [pipelinePhaseTab, setPipelinePhaseTab] = useState("email");
  const [showRiepilogo, setShowRiepilogo] = useState(false);
  const [riepilogoSending, setRiepilogoSending] = useState(false);

  // === ONBOARDING TUTORIAL ===
  const [tutoStep, setTutoStep] = useState(0);
  React.useEffect(() => {
    try { if (!localStorage.getItem("mastro:onboarded")) setTutoStep(1); } catch(e){}
  }, []);
  const closeTuto = () => { setTutoStep(0); try { localStorage.setItem("mastro:onboarded", "1"); } catch(e){} };
  const nextTuto = () => { if (tutoStep >= 5) closeTuto(); else setTutoStep(tutoStep + 1); };

  const [aziendaInfo, setAziendaInfo] = useState({
    ragione: aziendaInit?.ragione || "Walter Cozza Serramenti SRL",
    piva: aziendaInit?.piva || "",
    indirizzo: aziendaInit?.indirizzo || "",
    telefono: aziendaInit?.telefono || "",
    email: aziendaInit?.email || "",
    website: "",
    iban: "",
    cciaa: "",
    logo: null,
    pec: "",
    condFornitura: "",
    condPagamento: "",
    condConsegna: "",
    condContratto: "",
    condDettagli: "",
    // Listini accessori globali
    prezzoTapparella: aziendaInit?.prezzoTapparella || 0,
    prezzoPersiana: aziendaInit?.prezzoPersiana || 0,
    prezzoZanzariera: aziendaInit?.prezzoZanzariera || 0,
    prezzoControtelaio: aziendaInit?.prezzoControtelaio || 0,
    prezzoPosaVano: aziendaInit?.prezzoPosaVano || 0,
    prezzoSmaltimento: aziendaInit?.prezzoSmaltimento || 0,
    includePosaInPreventivo: aziendaInit?.includePosaInPreventivo || false,
    scontoGlobale: aziendaInit?.scontoGlobale || 0,
  });
  const logoInputRef = useRef(null);
  const [aiChat, setAiChat] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiMsgs, setAiMsgs] = useState([{ role: "ai", text: "Ciao Fabio! Sono MASTRO AI. Chiedimi qualsiasi cosa sulle tue commesse, task o misure." }]);
  
  // Send commessa modal
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendOpts, setSendOpts] = useState({ misure: true, foto: true, disegno: true, note: true, accessori: true });
  const [sendConfirm, setSendConfirm] = useState(null);
  
  // Vano wizard step
  const [vanoStep, setVanoStep] = useState(0);
  const spCanvasRef = useRef(null);
  const [spDrawing, setSpDrawing] = useState(false); // "sent" | null
  
  // Agenda
  const [agendaView, setAgendaView] = useState("mese"); // "giorno" | "settimana" | "mese"
  const [agendaFilters, setAgendaFilters] = useState({ eventi: true, montaggi: true, consegne: true, scadenze: true, tasks: true });
  const [homeExpand, setHomeExpand] = useState<Record<string, boolean>>({});
  const [homeView, setHomeView] = useState<string|null>(null);
  const [montView, setMontView] = useState("lista");
  const [montExpandId, setMontExpandId] = useState<string|null>(null);
  const [montCalDate, setMontCalDate] = useState(new Date());
  const [dossierTab, setDossierTab] = useState("storia");
  const [cmFaseIdx, setCmFaseIdx] = useState(0); // filtro fase widget commesse dashboard
  // Team Command Center states
  const [teamView, setTeamView] = useState<"compiti"|"calendario"|"persone"|"report">("compiti");
  const [teamWeek, setTeamWeek] = useState(0);
  const [showNewCompito, setShowNewCompito] = useState(false);
  const [newCompito, setNewCompito] = useState({ persona: "", tipo: "", descrizione: "", data: new Date().toISOString().split("T")[0], ora: "09:00", scadenza: "", priorita: "normale", note: "", commessaId: "" });
  const [calViewLocal, setCalViewLocal] = useState<"giorno"|"settimana"|"mese">("giorno");
  const [teamFilterPerson, setTeamFilterPerson] = useState("");
  const [calDateCO, setCalDateCO] = useState(new Date());
  const [expandedItem, setExpandedItem] = useState<string|null>(null);
  const [cmView, setCmView] = useState<"card"|"list">("card"); // vista commesse: card grande | lista compatta
  const [fasePanelOpen, setFasePanelOpen] = useState<Record<string,boolean>>({}); // accordion checklist per fase
  const [catIdx, setCatIdx] = useState(0); // categoria widget allerte dashboard
  const [selDate, setSelDate] = useState(new Date());
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showMailModal, setShowMailModal] = useState<{ev: any, cm: any} | null>(null);
  const [showEmailComposer, setShowEmailComposer] = useState<any>(null); // {cm, tipo}
  const [emailDest, setEmailDest] = useState("");
  const [emailOggetto, setEmailOggetto] = useState("");
  const [emailCorpo, setEmailCorpo] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [newEvent, setNewEvent] = useState({ text: "", time: "", tipo: "sopralluogo", cm: "", persona: "", date: "", reminder: "", addr: "" });
  const [events, setEvents] = useState<any[]>([]);
  
    // Advance fase notification
  const [faseNotif, setFaseNotif] = useState(null);
  
  // AI Photo
  const [showAIPhoto, setShowAIPhoto] = useState(false);
  const [aiPhotoStep, setAiPhotoStep] = useState(0); // 0=ready, 1=analyzing, 2=done
  const [settingsModal, setSettingsModal] = useState(null); // {type, item?}
  const [importStatus, setImportStatus] = useState(null); // {step, msg, detail, ok}
  const [importLog, setImportLog] = useState([]);
  const [settingsForm, setSettingsForm] = useState({});
  const [showAllegatiModal, setShowAllegatiModal] = useState(null); // "nota" | "vocale" | "video" | null

  // Auto-start camera preview when video modal opens
  React.useEffect(() => {
    if (showAllegatiModal === "video") {
      (async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
          mediaStreamRef.current = stream;
          setTimeout(() => {
            if (videoPreviewRef.current) { videoPreviewRef.current.srcObject = stream; videoPreviewRef.current.play().catch(() => {}); }
          }, 100);
        } catch (err) {
          console.warn("Camera preview failed:", err);
        }
      })();
    } else {
      // cleanup when modal closes
      if (mediaStreamRef.current && !isRecording) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [showAllegatiModal]);
  const [allegatiText, setAllegatiText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const recInterval = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const [playProgress, setPlayProgress] = useState(0);
  const playInterval = useRef(null);
  const [viewingVideoId, setViewingVideoId] = useState<number|null>(null);
  const [viewingPhotoId, setViewingPhotoId] = useState<number|string|null>(null);
  const mediaRecorderRef = useRef<MediaRecorder|null>(null);
  const mediaStreamRef = useRef<MediaStream|null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const audioPlayRef = useRef<HTMLAudioElement|null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement|null>(null);
  
  // Drawing state
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const fotoInputRef = useRef(null);
  const firmaRef = useRef(null);
  const fotoVanoRef = useRef(null);
  const cameraPreviewRef = useRef<HTMLVideoElement|null>(null);
  const cameraStreamRef = useRef<MediaStream|null>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraMode, setCameraMode] = useState<"foto"|"video">("foto");
  const calTouchStartRef = React.useRef(0);
  const calTouchEndRef = React.useRef(0);
  const [pendingFotoCat, setPendingFotoCat] = useState(null);
  const videoVanoRef = useRef(null);
  const ripFotoRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawTool, setDrawTool] = useState<"pen"|"eraser">("pen");
  const [drawPages, setDrawPages] = useState<string[]>([""]);
  const [drawPageIdx, setDrawPageIdx] = useState(0);
  const [drawFullscreen, setDrawFullscreen] = useState(false);
  const [penColor, setPenColor] = useState("#1d1d1f");
  const [penSize, setPenSize] = useState(2);
  const [drawPaths, setDrawPaths] = useState([]);

  // New task form
  const [newTask, setNewTask] = useState({ text: "", meta: "", time: "", priority: "media", cm: "", date: "", persona: "" });
  const [taskAllegati, setTaskAllegati] = useState([]); // allegati for new task
  const [msgFilter, setMsgFilter] = useState("tutti"); // tutti/email/whatsapp/sms/telegram
  const [msgSearch, setMsgSearch] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeMsg, setComposeMsg] = useState({ to: "", text: "", canale: "whatsapp", cm: "" });
  const [fabOpen, setFabOpen] = useState(false);
  const [recentActions, setRecentActions] = useState(() => {
    try { const s = localStorage.getItem("mastro:recent_actions"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const trackAction = (type, label, action) => {
    setRecentActions(prev => {
      const next = [{ type, label, action, ts: Date.now() }, ...prev.filter(a => a.label !== label)].slice(0, 3);
      try { localStorage.setItem("mastro:recent_actions", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const [showVoice, setShowVoice] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  
  // Intercept ordini tab from MastroDesktop sidebar (may use different ID)
  useEffect(() => {
    if (tab === 'ordini_f' || tab === 'ordini' || tab === 'ordiniForn' || tab === 'ordini_fornitore') {
      setTab('ordini_fornitori');
    }
  }, [tab]);
  const [contatti, setContatti] = useState<any[]>([]);
  const [msgSubTab, setMsgSubTab] = useState("chat"); // "chat" | "rubrica" | "ai" | "email"
  const [aiInbox, setAiInbox] = useState<any[]>([]);
  const [selectedAiMsg, setSelectedAiMsg] = useState(null);
  // Gmail integration
  const [gmailStatus, setGmailStatus] = useState<{connected:boolean, email?:string}>({ connected: false });
  const [gmailMessages, setGmailMessages] = useState<any[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [gmailNextPage, setGmailNextPage] = useState<string|null>(null);
  const [gmailSelected, setGmailSelected] = useState<any>(null);
  const [gmailReply, setGmailReply] = useState("");
  const [gmailSending, setGmailSending] = useState(false);
  const [gmailSearch, setGmailSearch] = useState("");
  const [rubricaSearch, setRubricaSearch] = useState("");
  const [rubricaFilter, setRubricaFilter] = useState("tutti"); // tutti/preferiti/team/clienti/fornitori
  const [globalSearch, setGlobalSearch] = useState("");
  // New commessa form
  const [newCM, setNewCM] = useState<any>({ cliente: "", indirizzo: "", telefono: "", email: "", sistema: "", tipo: "nuova", difficoltaSalita: "", mezzoSalita: "", foroScale: "", pianoEdificio: "", note: "" });
  const [ripSearch, setRipSearch] = useState("");
  const [ripCMSel, setRipCMSel] = useState(null);
  const [ripProblema, setRipProblema] = useState("");
  const [ripFotos, setRipFotos] = useState([]);
  const [ripUrgenza, setRipUrgenza] = useState("media");
  // New vano form
  const [vanoInfoOpen, setVanoInfoOpen] = useState(null); // which accordion section is open
  const [tipCat, setTipCat] = useState("Finestre");
  const [newVano, setNewVano] = useState({ nome: "", tipo: "", stanza: "", piano: "", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", pezzi: 1 });
  const [customPiani, setCustomPiani] = useState(["S1", "PT", "P1", "P2", "P3"]);
  const [mezziSalita, setMezziSalita] = useState(["Scala interna", "Scala esterna", "Scala aerea", "Scala a mano", "Gru", "Elevatore", "Ponteggio", "Nessuno"]);
  const [showAddPiano, setShowAddPiano] = useState(false);
  const [newPiano, setNewPiano] = useState("");

  // Responsive width
  const [winW, setWinW] = useState(typeof window !== "undefined" ? window.innerWidth : 430);
  useEffect(() => {
    const h = () => setWinW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  // == Persistence ==
  // DEMO VERSION - FORCE RESET on every new deploy
  const DEMO_VER = "v50-gmail-email";
  useEffect(()=>{
      // Check if user chose "clean slate" - skip demo data
      const cleanSlate = localStorage.getItem("mastro:cleanSlate");
      if (cleanSlate === "true") {
        // NUKE: clear ALL mastro keys first
        Object.keys(localStorage).filter(k => k.startsWith("mastro:")).forEach(k => {
          try { localStorage.removeItem(k); } catch(e) {}
        });
        // Force empty state
        setCantieri([]);
        setTasks([]);
        setEvents([]);
        setFattureDB([]);
        setOrdiniFornDB([]);
        setMontaggiDB([]);
        setMsgs([]);
        setContatti([]);
        setPipelineDB(PIPELINE_DEFAULT);
        setProblemi([]);
        setTeam([]);
        setShowOnboarding(true);
        setTutoStep(1);
        // PERSIST empty arrays so reload doesn't bring back demo
        localStorage.setItem("mastro:cantieri", "[]");
        localStorage.setItem("mastro:tasks", "[]");
        localStorage.setItem("mastro:events", "[]");
        localStorage.setItem("mastro:fatture", "[]");
        localStorage.setItem("mastro:ordiniForn", "[]");
        localStorage.setItem("mastro:montaggi", "[]");
        localStorage.setItem("mastro:msgs", "[]");
        localStorage.setItem("mastro:contatti", "[]");
        localStorage.setItem("mastro:problemi", "[]");
        localStorage.setItem("mastro:team", "[]");
        localStorage.setItem("mastro:pipeline", JSON.stringify(PIPELINE_DEFAULT));
        localStorage.setItem("mastro:demoVer", DEMO_VER);
        localStorage.setItem("mastro:cleanSlate", "true");
        return;
      }
      // Load saved data from localStorage
      try{const _v=localStorage.getItem("mastro:cantieri");if(_v){const p=JSON.parse(_v);setCantieri(p);}}catch(e){}
      try{const _v=localStorage.getItem("mastro:tasks");if(_v){const p=JSON.parse(_v);setTasks(p);}}catch(e){}
      try{const _v=localStorage.getItem("mastro:events");if(_v){const p=JSON.parse(_v);setEvents(p);}}catch(e){}
      try{const _v=localStorage.getItem("mastro:colori");if(_v)setColoriDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:sistemi");if(_v){
        let parsed=JSON.parse(_v);
        // Migration: add griglia + minimiMq if missing
        const DEMO_GRIGLIE: Record<string, any[]> = {
          "Ideal 4000": [
            {l:600,h:600,prezzo:120},{l:600,h:800,prezzo:145},{l:600,h:1000,prezzo:170},{l:600,h:1200,prezzo:195},
            {l:800,h:800,prezzo:175},{l:800,h:1000,prezzo:205},{l:800,h:1200,prezzo:240},{l:800,h:1400,prezzo:270},
            {l:1000,h:1000,prezzo:250},{l:1000,h:1200,prezzo:290},{l:1000,h:1400,prezzo:330},{l:1000,h:1600,prezzo:370},
            {l:1200,h:1200,prezzo:340},{l:1200,h:1400,prezzo:385},{l:1200,h:1600,prezzo:430},{l:1200,h:1800,prezzo:480},
            {l:1400,h:1400,prezzo:430},{l:1400,h:1600,prezzo:485},{l:1400,h:2200,prezzo:580},
          ],
          "CT70": [
            {l:600,h:800,prezzo:195},{l:600,h:1200,prezzo:260},
            {l:800,h:1000,prezzo:275},{l:800,h:1400,prezzo:365},
            {l:1000,h:1200,prezzo:380},{l:1000,h:1400,prezzo:440},
            {l:1200,h:1400,prezzo:520},{l:1200,h:1600,prezzo:580},
            {l:1400,h:2200,prezzo:780},
          ],
        };
        const DEMO_MINIMI_MQ: Record<string, any> = { "Ideal 4000": { "1anta": 1.5, "2ante": 2.0, "3ante": 2.8, "scorrevole": 3.5, "fisso": 1.0 }, "CT70": { "1anta": 1.5, "2ante": 2.0, "scorrevole": 3.5 }, "S80": { "1anta": 1.5, "2ante": 2.0 }, "FIN-Project": { "1anta": 1.5, "2ante": 2.2, "scorrevole": 4.0 } };
        parsed = parsed.map(s => ({
          ...s,
          griglia: s.griglia || DEMO_GRIGLIE[s.sistema] || [],
          minimiMq: s.minimiMq || {},
        }));
        setSistemiDB(parsed);
      }}catch(e){}
      try{const _v=localStorage.getItem("mastro:vetri");if(_v)setVetriDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:coprifili");if(_v)setCoprifiliDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:lamiere");if(_v)setLamiereDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:libreria");if(_v)setLibreriaDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:fatture");if(_v){const p=JSON.parse(_v);setFattureDB(p);}}catch(e){}
      try{const _v=localStorage.getItem("mastro:ordiniForn");if(_v){const p=JSON.parse(_v);setOrdiniFornDB(p);}}catch(e){}
      try{const _v=localStorage.getItem("mastro:squadre");if(_v)setSquadreDB(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:montaggi");if(_v){const p=JSON.parse(_v);setMontaggiDB(p);}}catch(e){}
      try{const _v=localStorage.getItem("mastro:settori");if(_v)setSettoriAttivi(JSON.parse(_v));else setShowOnboarding(true);}catch(e){setShowOnboarding(true);}
      try{const _v=localStorage.getItem("mastro:piano");if(_v)setPianoAttivo(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:team");if(_v)setTeam(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:contatti");if(_v)setContatti(JSON.parse(_v));}catch(e){}
      try{const _v=localStorage.getItem("mastro:pipeline");if(_v){const parsed=JSON.parse(_v); if(parsed.some(p=>p.id==="collaudo")){setPipelineDB(parsed);}else{setPipelineDB(PIPELINE_DEFAULT);localStorage.setItem("mastro:pipeline",JSON.stringify(PIPELINE_DEFAULT));}} }catch(e){}
      try{const _v=localStorage.getItem("mastro:azienda");if(_v)setAziendaInfo(JSON.parse(_v));}catch(e){}
},[]);

  // Cloud loader hook (caricamento, visibility, polling)
  const { syncReady } = useCloudLoader(userId, isUuid, {
    setCantieri, setEvents, setContatti, setTasks, setProblemi, setTeam,
    setAziendaInfo, setPipelineDB, setSistemiDB, setVetriDB, setColoriDB,
    setCoprifiliDB, setLamiereDB, setLibreriaDB, setFattureDB, setOrdiniFornDB,
    setSquadreDB, setMontaggiDB,
  });

  // Persist + cloud sync effects
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "cantieri", cantieri), [cantieri]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "tasks", tasks), [tasks]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "events", events), [events]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "colori", coloriDB), [coloriDB]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "sistemi", sistemiDB), [sistemiDB]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "vetri", vetriDB), [vetriDB]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "coprifili", coprifiliDB), [coprifiliDB]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "lamiere", lamiereDB), [lamiereDB]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "libreria", libreriaDB), [libreriaDB]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "fatture", fattureDB), [fattureDB]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "ordiniForn", ordiniFornDB), [ordiniFornDB]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "squadre", squadreDB), [squadreDB]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "montaggi", montaggiDB), [montaggiDB]);
  useEffect(()=>{try{localStorage.setItem("mastro:settori",JSON.stringify(settoriAttivi));}catch(e){}},[settoriAttivi]);
  useEffect(()=>{try{localStorage.setItem("mastro:piano",JSON.stringify(pianoAttivo));}catch(e){}},[pianoAttivo]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "team", team), [team]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "contatti", contatti), [contatti]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "pipeline", pipelineDB), [pipelineDB]);
  useEffect(() => persistAndSync(syncReady, isUuid, sync, "azienda", aziendaInfo), [aziendaInfo]);
  useEffect(() => {
    if (selectedCM?.id) {
      setLastOpenedCMId(selectedCM.id);
      trackAction("commessa", selectedCM.code + " " + selectedCM.cliente, JSON.stringify({ type: "commessa", id: selectedCM.id }));
    }
  }, [selectedCM?.id]);

  const PIPELINE = pipelineDB.filter(p => p.attiva !== false);
  const aziendaDB = aziendaInfo; // alias used by PDF/email helpers
  const parseDataCM = (s) => {
    const oggi0 = new Date(); oggi0.setHours(0,0,0,0);
    if(!s) return null;
    if(s==="oggi"||s==="Oggi"||s==="Adesso") return oggi0;
    const mesi2 = {gen:0,feb:1,mar:2,apr:3,mag:4,giu:5,lug:6,ago:7,set:8,ott:9,nov:10,dic:11};
    const m2 = s.toLowerCase().match(/(\d+)\s+([a-z]+)/);
    if(m2) return new Date(oggi0.getFullYear(), mesi2[m2[2]]??0, parseInt(m2[1]));
    return null;
  };
  const giorniFermaCM = (c) => {
    const oggi0 = new Date(); oggi0.setHours(0,0,0,0);
    const d = parseDataCM(c.aggiornato);
    if(!d) return 0;
    return Math.floor((oggi0 - d) / 86400000);
  };

  // === GMAIL INTEGRATION ===
  const gmailCheckStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/gmail/status");
      const data = await res.json();
      setGmailStatus(data);
      if (data.connected) gmailFetchMessages();
    } catch {}
  }, []);

  const gmailFetchMessages = useCallback(async (query?: string, page?: string) => {
    setGmailLoading(true);
    try {
      let url = "/api/gmail/messages?max=20";
      if (query) url += `&q=${encodeURIComponent(query)}`;
      if (page) url += `&page=${page}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.messages) {
        if (page) setGmailMessages(prev => [...prev, ...data.messages]);
        else setGmailMessages(data.messages);
        setGmailNextPage(data.nextPage);
      }
    } catch {}
    setGmailLoading(false);
  }, []);

  const gmailSendReply = useCallback(async (to: string, subject: string, body: string, threadId?: string) => {
    setGmailSending(true);
    try {
      const res = await fetch("/api/gmail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`, body, threadId }),
      });
      const data = await res.json();
      if (data.success) {
        setGmailReply("");
        alert("Email inviata!");
        gmailFetchMessages();
      } else {
        alert("Errore: " + (data.error || "invio fallito"));
      }
    } catch { alert("Errore di rete"); }
    setGmailSending(false);
  }, []);

  const gmailMatchCommessa = useCallback((email: any) => {
    if (!email) return null;
    const fromLower = (email.from || "").toLowerCase();
    const subLower = (email.subject || "").toLowerCase();
    const bodyLower = (email.body || "").substring(0, 500).toLowerCase();
    const all = fromLower + " " + subLower + " " + bodyLower;
    // Match by commessa code (S-XXXX)
    const codeMatch = all.match(/s-\d{4}/i);
    if (codeMatch) {
      const cm = cantieri.find(c => c.code.toLowerCase() === codeMatch[0].toLowerCase());
      if (cm) return cm;
    }
    // Match by client email
    for (const cm of cantieri) {
      if (cm.email && fromLower.includes(cm.email.toLowerCase())) return cm;
    }
    // Match by client name
    for (const cm of cantieri) {
      const nome = (cm.cliente || "").toLowerCase();
      const cognome = (cm.cognome || "").toLowerCase();
      if (nome.length > 2 && (fromLower.includes(nome) || subLower.includes(nome))) return cm;
      if (cognome.length > 2 && (fromLower.includes(cognome) || subLower.includes(cognome))) return cm;
    }
    return null;
  }, [cantieri]);

  // Check Gmail on mount
  useEffect(() => { gmailCheckStatus(); }, []);
  const isTablet = winW >= 768;
  const isDesktop = winW >= 1024;

  const goBack = () => {
    if (homeView) { setHomeView(null); return; }
    if (showRiepilogo) { setShowRiepilogo(false); return; }
    if (selectedVano) { setSelectedVano(null); setVanoStep(0); return; }
    if (showNuovoRilievo) { setShowNuovoRilievo(false); return; }
    if (selectedRilievo) {
      setSelectedRilievo(null);
      // SYNC: rileggi selectedCM da cantieri per evitare dati stale (bug misure che spariscono)
      if (selectedCM) {
        setCantieri(cs => {
          const fresh = cs.find(c => c.id === selectedCM.id);
          if (fresh) setTimeout(() => setSelectedCM(fresh), 0);
          return cs;
        });
      }
      return;
    }
    if (selectedCM) { setSelectedCM(null); return; }
  };

  /* == Helpers == */
  // Ritorna i vani del rilievo attivo (o dell'ultimo se nessuno selezionato)
  const getVaniCM = (c) => {
    if (!c?.rilievi || c.rilievi.length === 0) return [];
    if (selectedRilievo && selectedCM?.id === c.id) return selectedRilievo.vani || [];
    return c.rilievi[c.rilievi.length - 1]?.vani || [];
  };
  const getVaniAttivi = (c) => {
    if (!c?.rilievi || c.rilievi.length === 0) return [];
    return c.rilievi[c.rilievi.length - 1]?.vani || [];
  };

  // === CALCOLO PREZZO VANO - usato da Centro Comando, creaFattura, PDF ===
  const calcolaVanoPrezzo = (v, c) => {
    const m = v.misure || {};
    const lc = (m.lCentro || 0) / 1000, hc = (m.hCentro || 0) / 1000;
    const lmm = m.lCentro || 0, hmm = m.hCentro || 0;
    const mq = lc * hc, perim = 2 * (lc + hc);
    if (mq <= 0) return 0; // niente misure = niente prezzo
    const sysRec = sistemiDB.find(s => (s.marca + " " + s.sistema) === v.sistema || s.sistema === v.sistema);
    // Minimo mq
    const minCat = tipoToMinCat ? tipoToMinCat(v.tipo || "F1A") : "";
    const minimoMq = sysRec?.minimiMq?.[minCat] || 0;
    const mqCalc = (minimoMq > 0 && mq > 0 && mq < minimoMq) ? minimoMq : mq;
    // Grid or â‚¬/mq
    let tot = 0;
    const gridPrice = sysRec?.griglia ? (() => {
      const g = sysRec.griglia;
      const exact = g.find(p => p.l >= lmm && p.h >= hmm);
      return exact ? exact.prezzo : (g.length > 0 ? g[g.length - 1].prezzo : null);
    })() : null;
    tot = gridPrice !== null ? gridPrice : mqCalc * parseFloat(sysRec?.prezzoMq || sysRec?.euroMq || c?.prezzoMq || 350);
    // Vetro
    const vetroRec = vetriDB.find(g => g.code === v.vetro || g.nome === v.vetro);
    if (vetroRec?.prezzoMq) tot += mq * parseFloat(vetroRec.prezzoMq);
    // Coprifilo
    const copRec = coprifiliDB.find(cp => cp.cod === v.coprifilo);
    if (copRec?.prezzoMl) tot += perim * parseFloat(copRec.prezzoMl);
    // Lamiera
    const lamRec = lamiereDB.find(l => l.cod === v.lamiera);
    if (lamRec?.prezzoMl) tot += lc * parseFloat(lamRec.prezzoMl);
    // Accessori - calcolo prezzo da listino settore o fallback globale
    // Helper: cerca prezzo in listino settore (griglia LÃ—H o â‚¬/mq con minimo)
    const getListinoPrice = (listino: any[], lmm: number, hmm: number) => {
      if (!listino?.length) return null;
      const mq = (lmm / 1000) * (hmm / 1000);
      // Prova griglia LÃ—H per ogni prodotto del listino (usa il primo match)
      for (const prod of listino) {
        if (prod.griglia?.length) {
          const match = prod.griglia.find((g: any) => g.l >= lmm && g.h >= hmm);
          if (match) return match.prezzo;
          const last = prod.griglia[prod.griglia.length - 1];
          if (last) return last.prezzo;
        }
        if (prod.euroMq > 0) {
          const mqCalc = prod.minimoMq > 0 && mq < prod.minimoMq ? prod.minimoMq : mq;
          return mqCalc * prod.euroMq;
        }
      }
      return null;
    };
    const tapp = v.accessori?.tapparella;
    if (tapp?.attivo) {
      const tl = tapp.l || lmm, th = tapp.h || hmm;
      const fromListino = getListinoPrice(tapparelleListino, tl, th);
      const fallback = parseFloat(c?.prezzoTapparella || aziendaInfo?.prezzoTapparella || 0);
      const p = fromListino ?? (fallback > 0 ? (tl/1000)*(th/1000)*fallback : 0);
      tot += p;
    }
    const pers = v.accessori?.persiana;
    if (pers?.attivo) {
      const pl = pers.l || lmm, ph = pers.h || hmm;
      const fromListino = getListinoPrice(persianeListino, pl, ph);
      const fallback = parseFloat(c?.prezzoPersiana || aziendaInfo?.prezzoPersiana || 0);
      const p = fromListino ?? (fallback > 0 ? (pl/1000)*(ph/1000)*fallback : 0);
      tot += p;
    }
    const zanz = v.accessori?.zanzariera;
    if (zanz?.attivo) {
      const zl = zanz.l || lmm, zh = zanz.h || hmm;
      const fromListino = getListinoPrice(zanzariereListino, zl, zh);
      const fallback = parseFloat(c?.prezzoZanzariera || aziendaInfo?.prezzoZanzariera || 0);
      const p = fromListino ?? (fallback > 0 ? (zl/1000)*(zh/1000)*fallback : 0);
      tot += p;
    }
    // Controtelaio - da listino globale
    const pCT = parseFloat(aziendaInfo?.prezzoControtelaio || 0);
    if (v.controtelaio && v.controtelaio !== "Nessuno" && pCT > 0) tot += pCT;
    // Posa - da listino globale
    const pPosa = parseFloat(aziendaInfo?.prezzoPosaVano || 0);
    if (pPosa > 0 && aziendaInfo?.includePosaInPreventivo) tot += pPosa * (v.pezzi || 1);
    // Sconto/maggiorazione globale su tot
    const sconto = parseFloat(aziendaInfo?.scontoGlobale || 0);
    if (sconto !== 0) tot = tot * (1 + sconto / 100);
    // Voci libere del vano
    if (v.vociLibere?.length > 0) v.vociLibere.forEach(vl => { tot += (vl.prezzo || 0) * (vl.qta || 1); });
    return Math.round(tot * 100) / 100;
  };

  // Totale commessa calcolato = somma vani + voci libere della commessa
  const calcolaTotaleCommessa = (c) => {
    const vani = getVaniAttivi(c);
    const totVani = vani.reduce((s, v) => s + calcolaVanoPrezzo(v, c), 0);
    const totVoci = (c.vociLibere || []).reduce((s, vl) => s + ((vl.importo || 0) * (vl.qta || 1)), 0);
    return totVani + totVoci;
  };
  const countVani = () => cantieri.reduce((s, c) => s + getVaniAttivi(c).length, 0);
  // Fase reale calcolata da azioni (Centro Comando) - per PipelineBar
  const faseRealeCommessa = (c) => {
    const rilieviC = (c.rilievi || []);
    const vaniC = rilieviC.flatMap(r => r.vani || []);
    const fattC = fattureDB.filter(f => f.cmId === c.id);
    const ordC = ordiniFornDB.filter(o => o.cmId === c.id);
    const montC = montaggiDB.filter(m => m.cmId === c.id);
    const hasFirma = !!(c.firmaCliente || c.firmaClienteUrl);
    if (fattC.some(f => f.tipo === "saldo" && f.pagata) || (fattC.some(f => f.tipo === "unica") && fattC.find(f => f.tipo === "unica")?.pagata)) return "chiusura";
    if (montC.some(m => ["collaudo","chiuso"].includes(m.interventoStato || m.stato))) return "collaudo";
    if (montC.some(m => ["programmato","in_corso","completato"].includes(m.interventoStato || m.stato || ""))) return "posa";
    if (ordC.some(o => o.conferma?.ricevuta)) return "produzione";
    if (ordC.length > 0) return "ordini";
    if (hasFirma) return "conferma";
    if (c.preventivoInviato) return "conferma";
    if (vaniC.length > 0) return "preventivo";
    if (rilieviC.length > 0) return "sopralluogo";
    return c.fase || "sopralluogo";
  };
  // Safety: ensure every cantiere has required fields
  const cantieriSafe = cantieri.filter(c => c && c.id && c.fase);
  if (cantieriSafe.length !== cantieri.length && cantieri.length > 0) {
    // Auto-fix: remove invalid entries
    setTimeout(() => setCantieri(cantieriSafe), 0);
  }
  const urgentCount = () => cantieriSafe.filter(c => c.alert).length;
  const readyCount = () => cantieriSafe.filter(c => c.fase === "posa" || c.fase === "chiusura").length;
  const faseIndex = (fase) => PIPELINE.findIndex(p => p.id === fase);
  const priColor = (p) => p === "alta" ? T.red : p === "media" ? T.orange : T.sub2;

  const toggleTask = (id) => setTasks(ts => ts.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const addTask = () => {
    const v = validateTask(newTask);
    if (!v.valid) { toast(v.errors[0], "error"); return; }
    setTasks(ts => [...ts, { id: Date.now(), ...newTask, done: false, allegati: [...taskAllegati] }]);
    setTaskAllegati([]);
    setNewTask({ text: "", meta: "", time: "", priority: "media", cm: "", date: "", persona: "" });
    setShowModal(null);
  };

  // #23: retroattivo clienteId una tantum
  useEffect(() => { if (contatti?.length) fixClienteIdRetroattivo(); }, [contatti.length]);

  const addCommessa = () => {
    const v = validateCommessa(newCM);
    if (!v.valid) { setFormErrors(v.errors); toast(v.errors[0], "error"); return; }
    setFormErrors([]);
    if (!canDo("commessa")) return;
    const code = "S-" + String(cantieri.length + 1).padStart(4, "0");
    const _ctMatch = contatti?.find((ct:any) => ct.id === newCM.clienteId || ((ct.nome||"").toLowerCase()+(ct.cognome?" "+ct.cognome:"").toLowerCase()).trim() === ([newCM.cliente,newCM.cognome].filter(Boolean).join(" ").toLowerCase()));
    const nc = { id: Date.now(), code, clienteId: _ctMatch?.id || newCM.clienteId || null, cliente: newCM.cliente, cognome: newCM.cognome||"", indirizzo: newCM.indirizzo, telefono: newCM.telefono, email: newCM.email||"", fase: "sopralluogo", rilievi: [], sistema: newCM.sistema, tipo: newCM.tipo, difficoltaSalita: newCM.difficoltaSalita, mezzoSalita: newCM.mezzoSalita, foroScale: newCM.foroScale, pianoEdificio: newCM.pianoEdificio, note: newCM.note, allegati: [], creato: new Date().toLocaleDateString("it-IT",{day:"numeric",month:"short"}), aggiornato: new Date().toLocaleDateString("it-IT",{day:"numeric",month:"short"}), log: [{ chi: "Fabio", cosa: "creato la commessa", quando: "Adesso", color: T.sub }] };
    setCantieri(cs => [nc, ...cs]);
    setNewCM({ cliente: "", cognome: "", indirizzo: "", telefono: "", email: "", sistema: "", tipo: "nuova", difficoltaSalita: "", mezzoSalita: "", foroScale: "", pianoEdificio: "", note: "" });
    setShowModal(null);
    setSelectedCM(nc);
    setTab("commesse");
  };


  // #23 FIX: popola clienteId retroattivo sulle commesse che non ce l'hanno
  const fixClienteIdRetroattivo = () => {
    if (!contatti?.length) return;
    setCantieri(cs => cs.map(c => {
      if (c.clienteId) return c;
      const ct = contatti.find((ct:any) => {
        const nomeCompleto = ([ct.nome, ct.cognome].filter(Boolean).join(" ")).toLowerCase();
        const cmNome = ([c.cliente, c.cognome].filter(Boolean).join(" ")).toLowerCase();
        if (nomeCompleto && cmNome && nomeCompleto === cmNome) return true;
        if (ct.telefono && c.telefono && ct.telefono.replace(/\D/g,"") === c.telefono.replace(/\D/g,"")) return true;
        return false;
      });
      return ct ? { ...c, clienteId: ct.id } : c;
    }));
  };
  const addVano = () => {
    if (!selectedCM || !selectedRilievo) return;
    const tipObj = TIPOLOGIE_RAPIDE.find(t => t.code === newVano.tipo);
    const nome = newVano.nome.trim() || `${tipObj?.label || newVano.tipo} ${(selectedRilievo.vani?.length || 0) + 1}`;
    const v = { id: Date.now(), nome, tipo: newVano.tipo, stanza: newVano.stanza, piano: newVano.piano, sistema: newVano.sistema, pezzi: newVano.pezzi||1, coloreInt: newVano.coloreInt, coloreEst: newVano.coloreEst, bicolore: newVano.bicolore, coloreAcc: newVano.coloreAcc, vetro: newVano.vetro, telaio: newVano.telaio, telaioAlaZ: newVano.telaioAlaZ, rifilato: newVano.rifilato, rifilSx: newVano.rifilSx, rifilDx: newVano.rifilDx, rifilSopra: newVano.rifilSopra, rifilSotto: newVano.rifilSotto, coprifilo: newVano.coprifilo, lamiera: newVano.lamiera, misure: {}, foto: {}, note: "", cassonetto: false, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
    const updRilievo = { ...selectedRilievo, vani: [...(selectedRilievo.vani || []), v] };
    setCantieri(cs => cs.map(c => c.id === selectedCM.id ? { ...c, rilievi: c.rilievi.map(r => r.id === selectedRilievo.id ? updRilievo : r), aggiornato: "Oggi" } : c));
    setSelectedRilievo(updRilievo);
    setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo.id ? updRilievo : r) }));
    setNewVano(prev => ({ nome: "", tipo: prev.tipo, stanza: "", piano: prev.piano, sistema: prev.sistema, coloreInt: prev.coloreInt, coloreEst: prev.coloreEst, bicolore: prev.bicolore, coloreAcc: prev.coloreAcc, vetro: prev.vetro, telaio: prev.telaio, telaioAlaZ: prev.telaioAlaZ, rifilato: prev.rifilato, rifilSx: prev.rifilSx, rifilDx: prev.rifilDx, rifilSopra: prev.rifilSopra, rifilSotto: prev.rifilSotto, coprifilo: prev.coprifilo, lamiera: prev.lamiera }));
    setShowModal(null);
    setSelectedVano(v);
    setVanoStep(0);
  };

  const updateMisura = (vanoId, key, value) => {
    if (isStorico) return; // rilievo storico = sola lettura
    const numVal = sanitize.misura(value);
    const mv = validateMisura(key, numVal);
    if (!mv.valid) { toast(mv.errors[0], "warning"); }
    // Capture IDs NOW to prevent stale closures
    const cmId = selectedCM?.id;
    const rilId = selectedRilievo?.id;
    if (!cmId || !rilId) return;
    const updateVani = (vani) => vani.map(v => v.id === vanoId ? { ...v, misure: { ...v.misure, [key]: numVal } } : v);
    setCantieri(cs => cs.map(c => c.id === cmId ? {
      ...c, rilievi: c.rilievi.map(r => r.id === rilId ? { ...r, vani: updateVani(r.vani) } : r)
    } : c));
    setSelectedRilievo(prev => prev ? ({ ...prev, vani: updateVani(prev.vani) }) : prev);
    setSelectedCM(prev => prev ? ({
      ...prev, rilievi: prev.rilievi.map(r => r.id === rilId ? { ...r, vani: updateVani(r.vani) } : r)
    }) : prev);
    if (selectedVano?.id === vanoId) setSelectedVano(prev => ({ ...prev, misure: { ...prev.misure, [key]: numVal } }));
  };

  // Batch update: set multiple misure keys at once (no race conditions)
  const updateMisureBatch = (vanoId, updates: Record<string, number>) => {
    if (isStorico) return; // rilievo storico = sola lettura
    if (selectedRilievo) {
      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? {
        ...c, rilievi: c.rilievi.map(r => r.id === selectedRilievo.id ? {
          ...r, vani: r.vani.map(v => v.id === vanoId ? { ...v, misure: { ...v.misure, ...updates } } : v)
        } : r)
      } : c));
      setSelectedRilievo(prev => prev ? ({
        ...prev, vani: prev.vani.map(v => v.id === vanoId ? { ...v, misure: { ...v.misure, ...updates } } : v)
      }) : prev);
      setSelectedCM(prev => prev ? ({
        ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo.id ? {
          ...r, vani: r.vani.map(v => v.id === vanoId ? { ...v, misure: { ...v.misure, ...updates } } : v)
        } : r)
      }) : prev);
    }
    if (selectedVano?.id === vanoId) setSelectedVano(prev => ({ ...prev, misure: { ...prev.misure, ...updates } }));
  };

  const toggleAccessorio = (vanoId, acc) => {
    if (isStorico) return; // rilievo storico = sola lettura
    if (selectedRilievo) {
      const updRil = { ...selectedRilievo, vani: selectedRilievo.vani.map(v => v.id === vanoId ? { ...v, accessori: { ...v.accessori, [acc]: { ...v.accessori[acc], attivo: !v.accessori[acc].attivo } } } : v) };
      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) } : c));
      setSelectedRilievo(updRil);
    }
    if (selectedVano?.id === vanoId) setSelectedVano(prev => ({ ...prev, accessori: { ...prev.accessori, [acc]: { ...prev.accessori[acc], attivo: !prev.accessori[acc].attivo } } }));
  };

  const updateAccessorio = (vanoId, acc, field, value) => {
    if (selectedRilievo) {
      const updRil = { ...selectedRilievo, vani: selectedRilievo.vani.map(v => v.id === vanoId ? { ...v, accessori: { ...v.accessori, [acc]: { ...v.accessori[acc], [field]: value } } } : v) };
      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) } : c));
      setSelectedRilievo(updRil);
      setSelectedCM(prev => prev ? ({ ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) }) : prev);
    }
    if (selectedVano?.id === vanoId) setSelectedVano(prev => ({ ...prev, accessori: { ...prev.accessori, [acc]: { ...prev.accessori[acc], [field]: value } } }));
  };

  const updateVanoField = (vanoId, field, value) => {
    if (isStorico) return; // rilievo storico = sola lettura
    if (selectedRilievo) {
      const updRil = { ...selectedRilievo, vani: selectedRilievo.vani.map(v => v.id === vanoId ? { ...v, [field]: value } : v) };
      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) } : c));
      setSelectedRilievo(updRil);
      setSelectedCM(prev => prev ? ({ ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) }) : prev);
    }
    if (selectedVano?.id === vanoId) setSelectedVano(prev => ({ ...prev, [field]: value }));
  };

  // DELETE functions
  const deleteTask = (taskId) => { confirm({ title: "Eliminare task?", message: "Questa azione è irreversibile.", confirmText: "Elimina", danger: true, onConfirm: () => { setTasks(ts => ts.filter(t => t.id !== taskId)); toast("Task eliminato", "success"); } }); };
  const deleteVano = (vanoId) => {
    if (isStorico) return; // rilievo storico = sola lettura
    confirm({ title: "Eliminare vano?", message: "Il vano e tutte le sue misure verranno eliminati.", confirmText: "Elimina", danger: true, onConfirm: () => {
    if (selectedRilievo) {
      const updRil = { ...selectedRilievo, vani: selectedRilievo.vani.filter(v => v.id !== vanoId) };
      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) } : c));
      setSelectedRilievo(updRil);
      setSelectedCM(prev => prev ? ({ ...prev, rilievi: prev.rilievi.map(r => r.id === selectedRilievo.id ? updRil : r) }) : prev);
    }
    if (selectedVano?.id === vanoId) { setSelectedVano(null); setVanoStep(0); }
    toast("Vano eliminato", "success");
    } });
  };
  const deleteCommessa = (cmId) => {
    const cm = cantieri.find(c => c.id === cmId);
    confirm({
      title: "Eliminare commessa?",
      message: `Stai per eliminare "${cm?.cliente || "commessa"}" e tutti i suoi vani, rilievi e documenti. Questa azione è irreversibile.`,
      confirmText: "Elimina",
      danger: true,
      onConfirm: () => {
        setCantieri(cs => cs.filter(c => c.id !== cmId));
        if (selectedCM?.id === cmId) { setSelectedCM(null); setSelectedVano(null); }
        toast("Commessa eliminata", "success");
      },
    });
  };
  const deleteEvent = (evId) => { confirm({ title: "Eliminare evento?", message: "L'evento verrà rimosso dal calendario.", confirmText: "Elimina", danger: true, onConfirm: () => { setEvents(ev => ev.filter(e => e.id !== evId)); toast("Evento eliminato", "success"); } }); };
  const deleteMsg = (msgId) => { confirm({ title: "Eliminare messaggio?", message: "Il messaggio verrà rimosso.", confirmText: "Elimina", danger: true, onConfirm: () => { setMsgs(ms => ms.filter(m => m.id !== msgId)); toast("Messaggio eliminato", "success"); } }); };

  const addAllegato = (tipo, content, dataUrl?: string, durata?: string) => {
    if (!selectedCM) return;
    const a = { id: Date.now(), tipo, nome: content || (tipo === "file" ? "Allegato" : tipo === "vocale" ? "Nota vocale" : tipo === "video" ? "Video" : "Nota"), data: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), durata: durata || "", dataUrl: dataUrl || "" };
    setCantieri(cs => cs.map(x => x.id === selectedCM.id ? { ...x, allegati: [...(x.allegati || []), a] } : x));
    setSelectedCM(p => ({ ...p, allegati: [...(p.allegati || []), a] }));
  };

  const playAllegato = (id) => {
    if (playingId === id) {
      if (audioPlayRef.current) { audioPlayRef.current.pause(); audioPlayRef.current = null; }
      clearInterval(playInterval.current); setPlayingId(null); setPlayProgress(0); return;
    }
    clearInterval(playInterval.current);
    // find allegato dataUrl
    const allAllegati = (selectedCM?.allegati || []);
    const found = allAllegati.find(a => a.id === id);
    if (found?.dataUrl) {
      const audio = new Audio(found.dataUrl);
      audioPlayRef.current = audio;
      setPlayingId(id); setPlayProgress(0);
      audio.onended = () => { setPlayingId(null); setPlayProgress(0); audioPlayRef.current = null; };
      audio.ontimeupdate = () => { if (audio.duration) setPlayProgress((audio.currentTime / audio.duration) * 100); };
      audio.play().catch(() => {});
    } else {
      // fallback: fake progress for old entries without dataUrl
      setPlayingId(id); setPlayProgress(0);
      let prog = 0;
      playInterval.current = setInterval(() => { prog += 2; setPlayProgress(prog); if (prog >= 100) { clearInterval(playInterval.current); setPlayingId(null); setPlayProgress(0); } }, 100);
    }
  };

  const stopAllMedia = () => {
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") { mediaRecorderRef.current.stop(); }
    mediaRecorderRef.current = null;
    mediaChunksRef.current = [];
  };

  const startMediaRecording = async (tipo: "vocale" | "video") => {
    try {
      let stream: MediaStream;
      if (tipo === "video" && mediaStreamRef.current) {
        // Camera preview already running - add audio track to existing video stream
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
        const audioTrack = audioStream.getAudioTracks()[0];
        stream = new MediaStream([videoTrack, audioTrack]);
        mediaStreamRef.current = stream;
      } else {
        const constraints = tipo === "video" 
          ? { audio: true, video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } } 
          : { audio: true };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        mediaStreamRef.current = stream;
      }
      if (tipo === "video" && videoPreviewRef.current) { videoPreviewRef.current.srcObject = stream; videoPreviewRef.current.play().catch(() => {}); }
      const mimeType = tipo === "video" 
        ? (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm")
        : (MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm");
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) mediaChunksRef.current.push(e.data); };
      recorder.start(200);
      mediaRecorderRef.current = recorder;
      setIsRecording(true); setRecSeconds(0);
      recInterval.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } catch (err) {
      alert("ï¸ Impossibile accedere al " + (tipo === "video" ? "camera/microfono" : "microfono") + ". Controlla i permessi del browser.\n\n" + (err as Error).message);
    }
  };

  const stopMediaRecording = (tipo: "vocale" | "video") => {
    clearInterval(recInterval.current);
    const secs = recSeconds;
    return new Promise<void>((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(mediaChunksRef.current, { type: tipo === "video" ? "video/webm" : "audio/webm" });
          const url = URL.createObjectURL(blob);
          const durStr = Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
          const nome = tipo === "video" 
            ? "Video " + new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
            : "Nota vocale " + new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
          addAllegato(tipo, nome, url, durStr);
          stopAllMedia();
          setIsRecording(false); setRecSeconds(0); setShowAllegatiModal(null);
          resolve();
        };
        mediaRecorderRef.current.stop();
      } else { setIsRecording(false); setRecSeconds(0); resolve(); }
      if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
    });
  };

  // CAMERA MODAL - for taking photos and recording videos in vano
  // Image compression utility - max 1200px wide, 0.7 JPEG quality
  const compressImage = (dataUrl: string, maxW = 1200, quality = 0.7): Promise<string> => {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxW / img.width, maxW / img.height, 1);
        const w = Math.round(img.width * ratio), h = Math.round(img.height * ratio);
        const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        cv.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL("image/jpeg", quality));
      };
      img.src = dataUrl;
    });
  };

  const openCamera = async (mode: "foto" | "video", cat?: string) => {
    if (cat !== undefined) setPendingFotoCat(cat);
    setCameraMode(mode);
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }, 
        audio: mode === "video" 
      });
      cameraStreamRef.current = stream;
      setTimeout(() => {
        if (cameraPreviewRef.current) { cameraPreviewRef.current.srcObject = stream; cameraPreviewRef.current.play().catch(() => {}); }
      }, 100);
    } catch (err) {
      alert("ï¸ Impossibile accedere alla fotocamera. Controlla i permessi.\n\n" + (err as Error).message);
      setShowCameraModal(false);
    }
  };

  const capturePhoto = async () => {
    const video = cameraPreviewRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    // Compress to max 1200px
    const compressed = await compressImage(dataUrl);
    const cat = pendingFotoCat;
    const key = "foto_" + Date.now();
    const fotoObj = { dataUrl: compressed, nome: "Foto " + new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), tipo: "foto", categoria: cat || null };
    if (selectedVano && selectedCM && selectedRilievo) {
      const v = selectedVano;
      setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: fotoObj } } : vn) } : r2) } : c));
      setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: fotoObj } }));
    }
    // Flash effect + don't close (allow multiple shots)
  };

  const startCameraVideoRec = () => {
    const stream = cameraStreamRef.current;
    if (!stream) return;
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType });
    mediaChunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) mediaChunksRef.current.push(e.data); };
    recorder.start(200);
    mediaRecorderRef.current = recorder;
    setIsRecording(true); setRecSeconds(0);
    recInterval.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
  };

  const stopCameraVideoRec = () => {
    clearInterval(recInterval.current);
    const secs = recSeconds;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(mediaChunksRef.current, { type: "video/webm" });
        const dataUrl = URL.createObjectURL(blob);
        const key = "video_" + Date.now();
        const durStr = Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0");
        const vObj = { nome: "Video " + new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), tipo: "video", dataUrl, durata: durStr };
        if (selectedVano && selectedCM && selectedRilievo) {
          const v = selectedVano;
          setCantieri(cs => cs.map(c => c.id === selectedCM?.id ? { ...c, rilievi: c.rilievi.map(r2 => r2.id === selectedRilievo?.id ? { ...r2, vani: r2.vani.map(vn => vn.id === v.id ? { ...vn, foto: { ...(vn.foto||{}), [key]: vObj } } : vn) } : r2) } : c));
          setSelectedVano(prev => ({ ...prev, foto: { ...(prev.foto||{}), [key]: vObj } }));
        }
        mediaChunksRef.current = [];
      };
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false); setRecSeconds(0);
  };

  const closeCamera = () => {
    if (isRecording) stopCameraVideoRec();
    if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach(t => t.stop()); cameraStreamRef.current = null; }
    setShowCameraModal(false);
    setPendingFotoCat(null);
  };

  // IMPORT EXCEL CATALOG
  const importExcelCatalog = async (file) => _importExcelCatalog(file, { setSistemiDB, setVetriDB, setCoprifiliDB, setLamiereDB, setColoriDB, setImportStatus, setImportLog });
  // SETTINGS CRUD
  const addSettingsItem = () => {
    const f = settingsForm;
    if (settingsModal === "sistema" && f.marca && f.sistema) {
      setSistemiDB(s => [...s, { id: Date.now(), marca: f.marca, sistema: f.sistema, euroMq: parseInt(f.euroMq)||0, prezzoMq: parseFloat(f.prezzoMq||f.euroMq)||0, sovRAL: parseInt(f.sovRAL)||0, sovLegno: parseInt(f.sovLegno)||0, minimiMq: {}, colori: [], sottosistemi: f.sottosistemi ? f.sottosistemi.split(",").map(s => s.trim()) : [], griglia: [] }]);
    } else if (settingsModal === "colore" && f.nome && f.code) {
      setColoriDB(c => [...c, { id: Date.now(), nome: f.nome, code: f.code, hex: f.hex || "#888888", tipo: f.tipo || "RAL" }]);
    } else if (settingsModal === "vetro" && f.nome && f.code) {
      setVetriDB(v => [...v, { id: Date.now(), nome: f.nome, code: f.code, ug: parseFloat(f.ug)||1.0, prezzoMq: parseFloat(f.prezzoMq)||0 }]);
    } else if (settingsModal === "coprifilo" && f.nome && f.cod) {
      setCoprifiliDB(c => [...c, { id: Date.now(), nome: f.nome, cod: f.cod, prezzoMl: parseFloat(f.prezzoMl)||0 }]);
    } else if (settingsModal === "lamiera" && f.nome && f.cod) {
      setLamiereDB(l => [...l, { id: Date.now(), nome: f.nome, cod: f.cod, prezzoMl: parseFloat(f.prezzoMl)||0 }]);
    } else if (settingsModal === "tipologia" && f.code && f.label) {
      TIPOLOGIE_RAPIDE.push({ code: f.code, label: f.label, icon: f.icon || "âŠž", cat: f.cat || "Altro", forma: f.forma || "rettangolare" });
    } else if (settingsModal === "membro" && f.nome) {
      const colori = ["#0D7C6B","#1A9E73","#af52de","#E8A020","#DC4444","#5ac8fa"];
      setTeam(t => [...t, { id: Date.now(), nome: f.nome, ruolo: f.ruolo || "Posatore", compiti: f.compiti || "", telefono: f.telefono || "", email: f.email || "", colore: colori[t.length % colori.length], documenti: [], note_diario: [] }]);
    } else return;
    setSettingsModal(null); setSettingsForm({});
  };
  const deleteSettingsItem = (type, id) => {
    confirm({ title: "Eliminare elemento?", message: "L'elemento verrà rimosso dal catalogo.", confirmText: "Elimina", danger: true, onConfirm: () => {
    if (type === "sistema") setSistemiDB(s => s.filter(x => x.id !== id));
    if (type === "colore") setColoriDB(c => c.filter(x => x.id !== id));
    if (type === "vetro") setVetriDB(v => v.filter(x => x.id !== id));
    if (type === "coprifilo") setCoprifiliDB(c => c.filter(x => x.id !== id));
    if (type === "lamiera") setLamiereDB(l => l.filter(x => x.id !== id));
    toast("Elemento eliminato", "success");
    } });
  };

  const advanceFase = (cmId) => {
    const FASE_TEAM = { preventivo: "Sara Greco", conferma: "Sara Greco", misure: "Marco Ferraro", ordini: "Sara Greco", produzione: "Marco Ferraro", posa: "Marco Ferraro", chiusura: "Fabio Cozza" };
    setCantieri(cs => cs.map(c => {
      if (c.id !== cmId) return c;
      const idx = faseIndex(c.fase);
      if (idx < PIPELINE.length - 1) {
        const next = PIPELINE[idx + 1];
        return { ...c, fase: next.id, log: [{ chi: "Fabio", cosa: `avanzato a ${next.nome}`, quando: "Adesso", color: next.color }, ...(c.log||[])] };
      }
      return c;
    }));
    if (selectedCM?.id === cmId) {
      const idx = faseIndex(selectedCM.fase);
      if (idx < PIPELINE.length - 1) {
        const next = PIPELINE[idx + 1];
        const addetto = FASE_TEAM[next.id] || "Fabio Cozza";
        setSelectedCM(prev => ({ ...prev, fase: next.id, log: [{ chi: "Fabio", cosa: `avanzato a ${next.nome}`, quando: "Adesso", color: next.color }, ...prev.log] }));
        setFaseNotif({ fase: next.nome, addetto, color: next.color });
        setTimeout(() => setFaseNotif(null), 4000);
      }
    }
  };

  // === AUTO-ADVANCE: sincronizza fase pipeline con azioni reali ===
  const setFaseTo = (cmId: string, targetFase: string, operatore?: string) => {
    const targetIdx = faseIndex(targetFase);
    const faseDef = pipelineDB.find((p: any) => p.id === targetFase);

    // Funzione per costruire log entry con timestamp reale
    const buildLog = (chi: string, cosa: string, color: string) => ({
      chi, cosa, color,
      quando: new Date().toLocaleString("it-IT", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }),
      ts: new Date().toISOString(),
    });

    // Verifica gate sulla commessa corrente
    const checkGateForCommessa = (c: any): { ok: boolean; mancanti: string[] } => {
      if (!faseDef?.gateBloccante || !faseDef?.gateRequisiti?.length) return { ok: true, mancanti: [] };
      return verificaGate(c, faseDef);
    };

    let bloccato = false;

    setCantieri((cs: any[]) => cs.map(c => {
      if (c.id !== cmId) return c;
      const curIdx = faseIndex(c.fase);
      if (targetIdx <= curIdx) return c;

      // Gate check
      const { ok, mancanti } = checkGateForCommessa(c);
      if (!ok) {
        bloccato = true;
        return c; // non avanza
      }

      const chi = operatore || "MASTRO";
      const logEntry = buildLog(chi, ` > ${faseDef?.nome || targetFase}`, faseDef?.color || "#0D7C6B");
      const updated = { ...c, fase: targetFase, ultima_modifica: new Date().toISOString(), log: [logEntry, ...(c.log||[])] };

      // Esegui automazioni async
      if (faseDef?.automazioni?.length > 0) {
        eseguiAutomazioni(updated, faseDef, team, aziendaInfo).catch(console.error);
      }

      return updated;
    }));

    // Mostra errore se bloccato
    if (bloccato) {
      const c = cantieri.find((x: any) => x.id === cmId);
      if (c) {
        const { mancanti } = checkGateForCommessa(c);
        toast(`â›” Gate bloccante - ${mancanti.join(" Â· ")}`, "error");
      }
      return;
    }

    // Aggiorna selectedCM se è la commessa aperta
    if (selectedCM?.id === cmId) {
      const curIdx = faseIndex(selectedCM.fase);
      if (targetIdx > curIdx) {
        const next = pipelineDB.find((p: any) => p.id === targetFase);
        const logEntry = buildLog(operatore || "MASTRO", ` > ${next?.nome || targetFase}`, next?.color || "#0D7C6B");
        setSelectedCM((prev: any) => ({ ...prev, fase: targetFase, ultima_modifica: new Date().toISOString(), log: [logEntry, ...(prev?.log||[])] }));
        setFaseNotif({ fase: next?.nome || targetFase, addetto: operatore || "Auto", color: next?.color || "#0D7C6B" });
        setTimeout(() => setFaseNotif(null), 3000);
      }
    }
  };


  const addEvent = () => {
    const _evTitle = newEvent.text.trim() || (newEvent.persona ? "Appuntamento " + newEvent.persona : "");
    const v = validateEvento(newEvent);
    if (!v.valid) { toast(v.errors[0], "error"); return; }
    newEvent.text = _evTitle;
    // If tipo is "task", create a task instead of an event
    if (newEvent.tipo === "task") {
      const taskDate = newEvent.date || selDate.toISOString().split("T")[0];
      setTasks(ts => [...ts, { id: Date.now(), text: newEvent.text, meta: (newEvent as any)._taskMeta || "", time: newEvent.time, priority: (newEvent as any)._taskPriority || "media", cm: newEvent.cm, date: taskDate, persona: newEvent.persona, done: false, allegati: [] }]);
      setNewEvent({ text: "", time: "", tipo: "sopralluogo", cm: "", persona: "", date: "", reminder: "", addr: "" });
      setShowNewEvent(false);
      return;
    }
    if ((newEvent as any)._newCliente && (newEvent as any)._nomeCliente) {
      const nc = { id: "CT-" + Date.now(), nome: (newEvent as any)._nomeCliente, cognome: (newEvent as any)._cognomeCliente || "", tipo: "cliente", telefono: (newEvent as any)._telCliente || "", indirizzo: (newEvent as any)._addrCliente || "" };
      setContatti(prev => [...prev, nc]);
      newEvent.persona = nc.nome + (nc.cognome ? " " + nc.cognome : "");
    }
    if (!newEvent.time) newEvent.time = "09:00";
    setEvents(ev => [...ev, { id: Date.now(), ...newEvent, date: newEvent.date || selDate.toISOString().split("T")[0], addr: newEvent.addr || "", color: tipoEvColor(newEvent.tipo) }]);
    setNewEvent({ text: "", time: "", tipo: "sopralluogo", cm: "", persona: "", date: "", reminder: "", addr: "" });
    trackAction("evento", newEvent.text || "Evento", JSON.stringify({ type: "evento" }));
    setShowNewEvent(false);
  };


  //  CONVERTI EVENTO 
  const convertEvent = (evId, newTipo) => {
    setEvents(prev => prev.map(e => e.id === evId ? { ...e, tipo: newTipo, color: tipoEvColor(newTipo) } : e));
  };
  const linkEventToCM = (evId, cmId) => {
    setEvents(prev => prev.map(e => e.id === evId ? { ...e, cm: cmId } : e));
  };

  //  FATTURE PASSIVE 
  const creaFatturaPassiva = () => {
    const v = validateFatturaPassiva(newFattPassiva);
    if (!v.valid) { toast(v.errors[0], "error"); return; }
    const fp = { ...newFattPassiva, id: "fp_" + Date.now(), importo: sanitize.numero(newFattPassiva.importo), dataISO: newFattPassiva.data || new Date().toISOString().split("T")[0] };
    setFatturePassive(prev => [...prev, fp]);
    setNewFattPassiva({ fornitore: "", numero: "", data: "", importo: 0, iva: 22, descrizione: "", cmId: "", pagata: false, scadenza: "" });
    setShowFatturaPassiva(false);
  };

  //  VOCE AI 
  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) { alert("Browser non supporta riconoscimento vocale"); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recog = new SR();
    recog.continuous = true; recog.interimResults = true; recog.lang = "it-IT";
    recog.onresult = (e: any) => {
      let t = ""; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setVoiceTranscript(t);
    };
    recog.onerror = () => setVoiceActive(false);
    recog.onend = () => setVoiceActive(false);
    recog.start(); recognitionRef.current = recog; setVoiceActive(true);
  };
  const stopVoice = () => { recognitionRef.current?.stop(); setVoiceActive(false); };


  const sendCommessa = () => {
    setSendConfirm("sent");
    setTimeout(() => { setSendConfirm(null); setShowSendModal(false); }, 2500);
  };

  const handleAI = () => {
    if (!aiInput.trim()) return;
    const q = aiInput.toLowerCase();
    setAiMsgs(m => [...m, { role: "user", text: aiInput }]);
    setAiInput("");
    let resp = "Non ho capito, prova a riformulare la domanda.";
    if (q.includes("oggi") || q.includes("programma")) {
      const t = tasks.filter(x => !x.done);
      resp = `Oggi hai ${t.length} task aperti:\n${t.map((x, i) => `${i + 1}. ${x.text}${x.time ? ` (${x.time})` : ""}`).join("\n")}`;
    } else if (q.includes("commess") || q.includes("stato") || q.includes("pipeline")) {
      resp = `Hai ${cantieri.length} commesse:\n${cantieri.map(c => `â€¢ ${c.code} ${c.cliente} - ${PIPELINE.find(p => p.id === c.fase)?.nome}`).join("\n")}`;
    } else if (q.includes("vani") || q.includes("misur")) {
      resp = `Totale vani: ${countVani()}\nCommesse con vani da misurare:\n${cantieri.filter(c => getVaniAttivi(c).some(v => Object.keys(v.misure || {}).length < 6)).map(c => `â€¢ ${c.code}: ${getVaniAttivi(c).filter(v => Object.keys(v.misure || {}).length < 6).length} vani incompleti`).join("\n")}`;
    } else if (q.includes("urgent") || q.includes("priorit")) {
      const u = tasks.filter(x => x.priority === "alta" && !x.done);
      resp = u.length ? `Task urgenti:\n${u.map(x => `â€¢ ${x.text}`).join("\n")}` : "Nessun task urgente!";
    }
    setTimeout(() => setAiMsgs(m => [...m, { role: "ai", text: resp }]), 300);
  };

  const exportPDF = () => {
    if (!selectedCM) return;
    const cm = selectedCM;
    let html = `<html><head><title>MASTRO MISURE - ${cm.code}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px}h1{color:#0D7C6B;border-bottom:3px solid #0D7C6B;padding-bottom:10px}h2{color:#333;margin-top:30px}.vano{border:1px solid #ddd;border-radius:8px;padding:15px;margin:10px 0;page-break-inside:avoid}.misure-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}.m-item{background:#F2F1EC;padding:6px 10px;border-radius:4px;font-size:13px}.m-label{color:#666;font-size:11px}.m-val{font-weight:700;color:#1d1d1f}.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}.info{color:#666;font-size:13px}@media print{body{padding:0}}</style></head><body>`;
    html += `<div class="header"><div><h1>MASTRO MISURE</h1><p class="info">Report Misure - ${cm.code}</p></div><div style="text-align:right"><p><strong>${cm.cliente}</strong></p><p class="info">${cm.indirizzo}</p><p class="info">Sistema: ${cm.sistema || "N/D"} | Tipo: ${cm.tipo === "riparazione" ? "Riparazione" : "Nuova"}</p></div></div>`;
    const vaniExport = getVaniAttivi(cm);
    vaniExport.forEach((v, i) => {
      const m = v.misure || {};
      html += `<div class="vano"><h3>${i + 1}. ${v.nome} - ${v.tipo} (${v.stanza}, ${v.piano})</h3><div class="misure-grid">`;
      [["L alto", m.lAlto], ["L centro", m.lCentro], ["L basso", m.lBasso], ["H sinistra", m.hSx], ["H centro", m.hCentro], ["H destra", m.hDx], ["Diag. 1", m.d1], ["Diag. 2", m.d2], ["Spall. SX", m.spSx], ["Spall. DX", m.spDx], ["Architrave", m.arch], ["Dav. int.", m.davInt], ["Dav. est.", m.davEst]].forEach(([l, val]) => {
        html += `<div class="m-item"><div class="m-label">${l}</div><div class="m-val">${val || " - "} mm</div></div>`;
      });
      html += `</div>`;
      if (v.cassonetto) html += `<p style="margin-top:8px;font-size:13px">Cassonetto${v.casTipo ? " " + v.casTipo : ""}: ${(v.misure||{}).casL || " - "}Ã—${(v.misure||{}).casH || " - "}Ã—${(v.misure||{}).casP || " - "} mm</p>`;
      if (v.note) html += `<p style="margin-top:4px;font-size:12px;color:#666">Note: ${v.note}</p>`;
      html += `</div>`;
    });
    html += `<div style="margin-top:40px;border-top:1px solid #ddd;padding-top:20px;display:flex;justify-content:space-between"><div><p class="info">Firma tecnico</p><div style="border-bottom:1px solid #333;width:200px;height:40px"></div></div><div><p class="info">Firma cliente</p><div style="border-bottom:1px solid #333;width:200px;height:40px"></div></div></div>`;
    html += `<p style="text-align:center;margin-top:30px;color:#999;font-size:11px">Generato da MASTRO MISURE - ${new Date().toLocaleDateString("it-IT")}</p></body></html>`;
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 500);
  };

  /* ======= STYLES ======= */
  const fs = isDesktop ? 1.1 : isTablet ? 1.05 : 1;
  const S = {
    app: { fontFamily: FF, background: T.bg, backgroundImage: "linear-gradient(rgba(40,160,160,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,.18) 1px,transparent 1px)", backgroundSize: "24px 24px", color: T.text, width: "100%", minHeight: "100vh", position: "relative", WebkitFontSmoothing: "antialiased", paddingBottom: 80, overflow: "hidden" },
    header: { padding: `${14*fs}px ${16*fs}px ${12*fs}px`, background: T.card, borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 10 },
    headerTitle: { fontSize: 19*fs, fontWeight: 700, letterSpacing: -0.3, color: T.text },
    headerSub: { fontSize: 12*fs, color: T.sub, marginTop: 1 },
    section: { margin: `0 ${16*fs}px`, padding: "10px 0 4px", display: "flex", justifyContent: "space-between", alignItems: "center" },
    sectionTitle: { fontSize: 13*fs, fontWeight: 700, color: T.text },
    sectionBtn: { fontSize: 12*fs, color: T.acc, fontWeight: 600, background: "none", border: "none", cursor: "pointer" },
    card: { background: T.card, borderRadius: T.r, boxShadow: T.cardSh, overflow: "hidden", marginBottom: 8, cursor: "pointer", transition: "box-shadow 0.15s" },
    cardInner: { padding: `${12*fs}px ${14*fs}px` },
    chip: (active) => ({ padding: `${6*fs}px ${12*fs}px`, borderRadius: 8, border: `1px solid ${active ? T.acc : T.bdr}`, background: active ? T.acc : T.card, color: active ? "#fff" : T.text, fontSize: 12*fs, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s" }),
    stat: { flex: 1, textAlign: "center", padding: `${10*fs}px 4px`, background: T.card, cursor: "pointer" },
    statNum: { fontSize: 18*fs, fontWeight: 700 },
    statLabel: { fontSize: 9*fs, color: T.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.3, marginTop: 1 },
    badge: (bg, color) => ({ fontSize: 11*fs, fontWeight: 600, padding: `${3*fs}px ${8*fs}px`, borderRadius: 6, background: bg, color, display: "inline-block" }),
    input: { width: "100%", padding: `${10*fs}px ${12*fs}px`, borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 14*fs, color: T.text, outline: "none", fontFamily: FF, boxSizing: "border-box" },
    select: { width: "100%", padding: `${10*fs}px ${12*fs}px`, borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 14*fs, color: T.text, outline: "none", fontFamily: FF, boxSizing: "border-box" },
    btn: { width: "100%", padding: `${14*fs}px`, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 15*fs, fontWeight: 700, cursor: "pointer", fontFamily: FF },
    btnCancel: { width: "100%", padding: `${12*fs}px`, borderRadius: 10, border: "none", background: "none", color: T.sub, fontSize: 14*fs, fontWeight: 600, cursor: "pointer", fontFamily: FF },
    tabBar: { position: "fixed", bottom: 0, left: 0, right: 0, width: "100%", background: T.card + "ee", backdropFilter: "blur(20px)", borderTop: `1px solid ${T.bdr}`, display: "flex", padding: `${6*fs}px 0 ${8*fs}px`, zIndex: 100 },
    tabItem: (active) => ({ flex: 1, textAlign: "center", padding: "4px 0", cursor: "pointer", opacity: active ? 1 : 0.5, transition: "opacity 0.15s" }),
    tabLabel: (active) => ({ fontSize: 10*fs, fontWeight: 600, color: active ? T.acc : T.sub, marginTop: 1 }),
    modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", zIndex: 200, display: "flex", justifyContent: "center", alignItems: "flex-end" },
    modalInner: { background: T.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: isDesktop ? 600 : 500, padding: `${20*fs}px ${16*fs}px ${30*fs}px`, maxHeight: "85vh", overflowY: "auto" },
    modalTitle: { fontSize: 17*fs, fontWeight: 700, marginBottom: 16, color: T.text },
    fieldLabel: { fontSize: 12*fs, fontWeight: 600, color: T.sub, marginBottom: 4, display: "block" },
    pipeStep: (done, current) => ({ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 52, cursor: "pointer" }),
    pipeCircle: (done, current, color) => ({ width: current ? 32 : 26, height: current ? 32 : 26, borderRadius: "50%", background: done ? color : "transparent", border: done ? "none" : current ? `3px solid ${color}` : `2px dashed ${T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: current ? 14 : 12, boxShadow: current ? `0 0 12px ${color}40` : "none", transition: "all 0.2s" }),
    pipeLine: (done) => ({ flex: 1, height: 2, background: done ? T.grn : T.bdr, minWidth: 12, alignSelf: "center", marginTop: -14 }),
    pipeLabel: (current) => ({ fontSize: 9*fs, fontWeight: current ? 700 : 500, color: current ? T.text : T.sub, marginTop: 4, textAlign: "center", maxWidth: 52 }),
  };

  /* ======= CALENDAR STRIP ======= */
  const today = new Date();
  const calDays = Array.from({ length: 9 }, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() + i - 2);
    return { day: d.getDate(), name: ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"][d.getDay()], isToday: i === 2, hasDot: [0, 2, 4, 6].includes(i) };
  });

  /* ======= PIPELINE COMPONENT ======= */
  const PipelineBar = ({ fase, cm = null }) => {
    // Se viene passata la commessa, usa la fase reale calcolata dalle azioni
    const faseEffettiva = cm ? faseRealeCommessa(cm) : fase;
    const idx = faseIndex(faseEffettiva);
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", padding: "8px 0", WebkitOverflowScrolling: "touch" }}>
        {PIPELINE.map((p, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "flex-start", flex: i < PIPELINE.length - 1 ? 1 : "none" }}>
              <div style={S.pipeStep(done, current)}>
                <div style={S.pipeCircle(done, current, p.color)}>
                  {done ? <Ico d={ICO.check} s={13} c="#fff" sw={2.5} /> : <Ico d={ICO[p.ico] || ICO.calendar} s={13} c={current ? "#fff" : p.color} sw={2} />}
                </div>
                <div style={S.pipeLabel(current)}>{p.nome}</div>
              </div>
              {i < PIPELINE.length - 1 && <div style={S.pipeLine(done)} />}
            </div>
          );
        })}
      </div>
    );
  };

  /* ======= VANO SVG SCHEMA ======= */
  const VanoSVG = ({ v, onTap }) => {
    const m = v.misure || {};
    return (
      <svg viewBox="0 0 200 260" style={{ width: "100%", maxWidth: 280, display: "block", margin: "0 auto" }}>
        {/* Vano outline */}
        <rect x="30" y="15" width="140" height="220" fill={T.accLt} stroke={T.acc} strokeWidth={1.5} rx={2} />
        {/* Spallette */}
        <rect x="15" y="12" width="15" height="226" fill={T.blueLt} stroke={T.blue} strokeWidth={0.5} rx={1} strokeDasharray="3,2" />
        <rect x="170" y="12" width="15" height="226" fill={T.blueLt} stroke={T.blue} strokeWidth={0.5} rx={1} strokeDasharray="3,2" />
        {/* Cassonetto */}
        {v.cassonetto && <rect x="28" y="0" width="144" height="15" fill={T.orangeLt} stroke={T.orange} strokeWidth={0.5} rx={2} />}
        {v.cassonetto && <text x="100" y="11" textAnchor="middle" fontSize={7} fill={T.orange} fontFamily={FM}>CASSONETTO</text>}
        {/* Davanzale */}
        <line x1="25" y1="237" x2="175" y2="237" stroke={T.sub2} strokeWidth={1} strokeDasharray="4,3" />
        <text x="100" y="252" textAnchor="middle" fontSize={8} fill={T.sub2} fontFamily={FM}>Davanzale</text>
        {/* 3 Larghezze lines */}
        <line x1="35" y1="28" x2="165" y2="28" stroke={T.acc + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        <line x1="35" y1="125" x2="165" y2="125" stroke={T.acc + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        <line x1="35" y1="222" x2="165" y2="222" stroke={T.acc + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        {/* 3 Altezze lines */}
        <line x1="35" y1="20" x2="35" y2="232" stroke={T.blue + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        <line x1="100" y1="20" x2="100" y2="232" stroke={T.blue + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        <line x1="165" y1="20" x2="165" y2="232" stroke={T.blue + "40"} strokeWidth={0.5} strokeDasharray="3,3" />
        {/* Diagonals */}
        <line x1="35" y1="20" x2="165" y2="232" stroke={T.purple + "30"} strokeWidth={0.5} strokeDasharray="4,3" />
        <line x1="165" y1="20" x2="35" y2="232" stroke={T.purple + "30"} strokeWidth={0.5} strokeDasharray="4,3" />
        {/* Tap points */}
        {PUNTI_MISURE.map(p => {
          const val = m[p.key];
          const col = T[p.color] || T.acc;
          return (
            <g key={p.key} onClick={() => onTap && onTap(p.key)} style={{ cursor: "pointer" }}>
              <circle cx={p.x} cy={p.y} r={val ? 14 : 12} fill={val ? col + "20" : T.bdr + "60"} stroke={val ? col : T.sub2} strokeWidth={val ? 1.5 : 1} />
              <text x={p.x} y={p.y + (val ? 1 : 4)} textAnchor="middle" fontSize={val ? 8 : 7} fill={val ? col : T.sub} fontWeight={val ? 700 : 500} fontFamily={FM} dominantBaseline="middle">
                {val || p.label}
              </text>
            </g>
          );
        })}
        {/* Spalletta labels */}
        <text x="22" y="130" textAnchor="middle" fontSize={7} fill={T.sub} fontFamily={FM} transform="rotate(-90,22,130)">
          Sp.SX {m.spSx || ""}
        </text>
        <text x="178" y="130" textAnchor="middle" fontSize={7} fill={T.sub} fontFamily={FM} transform="rotate(90,178,130)">
          Sp.DX {m.spDx || ""}
        </text>
      </svg>
    );
  };

  /* ======= FILTERED CANTIERI ======= */
  const filtered = cantieri.filter(c => {
    if (filterFase !== "tutte" && c.fase !== filterFase) return false;
    if (searchQ && !c.cliente.toLowerCase().includes(searchQ.toLowerCase()) && !c.code.toLowerCase().includes(searchQ.toLowerCase()) && !(c.tipo || "").toLowerCase().includes(searchQ.toLowerCase()) && !(c.indirizzo || "").toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  /* ==================================== */
  /* ====       RENDER SECTIONS       == */
  /* ==================================== */

  /* == HOME TAB == */
  const toggleCollapse = (id: string) => setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  const SectionHead = ({ id, icon, title, count, countColor, extra }: { id: string; icon: string; title: string; count?: number; countColor?: string; extra?: any }) => (
    <div style={{ ...S.section, margin: "0 16px" }}>
      <div onClick={() => toggleCollapse(id)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", flex: 1 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{title}</span>
        {count !== undefined && count > 0 && (
          <span style={{ ...S.badge(countColor ? countColor + "18" : T.acc + "18", countColor || T.acc), fontSize: 10, fontWeight: 800 }}>{count}</span>
        )}
        <span style={{ fontSize: 8, color: T.sub, marginLeft: 2, transform: collapsed[id] ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.15s", display: "inline-block" }}>â–¼</span>
      </div>
      {extra}
    </div>
  );

  // === <I d={ICO.target} /> CARICA DEMO COMPLETO - forza TUTTI i dati per vedere il ciclo ===
  const caricaDemoCompleto = () => _caricaDemoCompleto({ setCantieri, setEvents, setTasks, setFattureDB, setOrdiniFornDB, setMontaggiDB, setSelectedCM, setSelectedVano, setTab });

  const renderHome = () => <HomePanel />;
// =======================================================
// MASTRO ERP v2 - PARTE 2/5
// Righe 1281-2638: renderCMCard (con AFASE+euro+scadenza+borderLeft),
//                 renderCommesse, renderCMDetail (wizard 4-step + 3 tab
//                 sopralluoghi/misure/info + cronologia visite),
//                 renderRiepilogo, renderFasePanel
// =======================================================
  /* == COMMESSA CARD == */

  /* == COMMESSE TAB == */
  // ============================================================
  // RENDER LISTA RILIEVI (livello intermedio: commessa > rilievi)
  // ============================================================
  const renderRilieviList = () => <RilieviListPanel />;

  // Card compatta per vista lista

  
  const renderCommesse = () => <CommessePanel onOpenVano={(cmId: string, vanoId: string) => {
    // Bridge: find commessa in cantieri, set selectedCM + selectedVano
    const cm = cantieri.find(c => c.id === cmId);
    if (cm) {
      setSelectedCM(cm);
      const rilievo = cm.rilievi?.[cm.rilievi.length - 1];
      if (rilievo) setSelectedRilievo(rilievo);
      const vano = rilievo?.vani?.find(v => String(v.id) === String(vanoId));
      if (vano) { setSelectedVano(vano); setVanoStep(0); }
    }
  }} />;

  /* == COMMESSA DETAIL == */
  const renderCMDetail = () => <CMDetailPanel />;

  /* == RIEPILOGO COMMESSA - SCHERMATA INVIO == */

  /* ===============================================
     PANNELLI DI FASE - renderFasePanel(c)
     Appare nella commessa detail, sotto la pipeline
     Un pannello specifico per ogni fase
  =============================================== */
  const renderFasePanel = (c) => {
    const fi = faseIndex(c.fase);
    const nextFase = PIPELINE[fi + 1];
    const fase = PIPELINE[fi];

    // Helper: aggiorna campo dentro la commessa selezionata
    const updateCM = (field, val) => {
      setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, [field]: val } : x));
      setSelectedCM(prev => ({ ...prev, [field]: val }));
    };
    const updateCMNested = (obj) => {
      setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, ...obj } : x));
      setSelectedCM(prev => ({ ...prev, ...obj }));
    };

    // Chip checklist riusabile
    const Chip = ({ label, done, onClick }) => (
      <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px",
        borderRadius:8, border:`1.5px solid ${done ? T.grn : T.bdr}`, background: done ? T.grn+"12" : T.card,
        cursor:"pointer", marginBottom:6 }}>
        <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${done ? T.grn : T.bdr}`,
          background: done ? T.grn : "transparent", display:"flex", alignItems:"center", justifyContent:"center",
          flexShrink:0 }}>
          {done && <span style={{fontSize:10,color:"white",fontWeight:800}}></span>}
        </div>
        <span style={{fontSize:12, fontWeight:600, color: done ? T.grn : T.text}}>{label}</span>
      </div>
    );

    // Campo input riusabile - defaultValue+onBlur per evitare focus loss
    const Field = ({ label, field, placeholder, type="text" }) => (
      <div style={{marginBottom:8}}>
        <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:3,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</div>
        <input type={type} placeholder={placeholder||""} defaultValue={c[field]||""}
          key={`${c.id}-${field}`}
          onBlur={e => { const v = e.target.value; if (v !== (c[field]||"")) updateCM(field, v); }}
          style={{width:"100%",padding:"9px 12px",borderRadius:8,border:`1px solid ${T.bdr}`,
            background:T.card,fontSize:13,color:T.text,fontFamily:FF,boxSizing:"border-box"}}/>
      </div>
    );

    // === ASSEGNAZIONE COMPITI PER FASE ===
    const AssegnaCompito = ({ faseId }: { faseId: string }) => {
      const ass = (c.assegnazioni || {})[faseId] || {};
      const updateAss = (field: string, val: any) => {
        const newAss = { ...(c.assegnazioni || {}), [faseId]: { ...ass, [field]: val } };
        updateCM("assegnazioni", newAss);
      };
      const statoColors = { da_fare: T.orange, in_corso: T.blue, completato: T.grn, bloccato: T.red };
      const statoLabels = { da_fare: "Da fare", in_corso: "In corso", completato: "Completato", bloccato: "Bloccato" };
      return (
        <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 10, background: T.bg, border: "1px solid " + T.bdr }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: T.sub, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.05em" }}>
            <I d={ICO.users} s={10} c={T.sub} /> Assegnazione
          </div>
          {/* Persona / Squadra */}
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 3 }}>Responsabile</div>
              <select value={ass.persona || ""} onChange={e => updateAss("persona", e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid " + T.bdr, background: T.card, fontSize: 12, fontFamily: FF, color: T.text }}>
                <option value="">— Nessuno —</option>
                <optgroup label="Team">
                  {team.map(m => <option key={m.id} value={m.nome}>{m.nome} ({m.ruolo})</option>)}
                </optgroup>
                <optgroup label="Squadre">
                  {squadreDB.map(sq => <option key={sq.id} value={"sq:" + sq.nome}>{sq.nome} ({(sq.membri || []).length} membri)</option>)}
                </optgroup>
              </select>
            </div>
            <div style={{ width: 100 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 3 }}>Scadenza</div>
              <input type="date" value={ass.scadenza || ""} onChange={e => updateAss("scadenza", e.target.value)}
                style={{ width: "100%", padding: "8px 6px", borderRadius: 8, border: "1.5px solid " + T.bdr, background: T.card, fontSize: 11, fontFamily: FF, color: T.text }} />
            </div>
          </div>
          {/* Stato */}
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {(["da_fare","in_corso","completato","bloccato"] as const).map(s => (
              <button key={s} onClick={() => updateAss("stato", s)}
                style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: (ass.stato || "da_fare") === s ? "none" : "1px solid " + T.bdr,
                  background: (ass.stato || "da_fare") === s ? statoColors[s] : "transparent",
                  color: (ass.stato || "da_fare") === s ? "#fff" : T.sub,
                  fontSize: 10, fontWeight: 800, cursor: "pointer", fontFamily: FF }}>
                {statoLabels[s]}
              </button>
            ))}
          </div>
          {/* Note compito */}
          <input placeholder="Note compito..." value={ass.note || ""} onChange={e => updateAss("note", e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid " + T.bdr, background: T.card, fontSize: 11, fontFamily: FF, color: T.text, boxSizing: "border-box" }} />
          {/* Show assigned person badge */}
          {ass.persona && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: (team.find(m => m.nome === ass.persona)?.colore || T.acc), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 9, fontWeight: 800 }}>
                {(ass.persona || "?").replace("sq:", "").charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{ass.persona.replace("sq:", "")}</span>
              {ass.scadenza && <span style={{ fontSize: 9, color: new Date(ass.scadenza) < new Date() && (ass.stato || "da_fare") !== "completato" ? T.red : T.sub, marginLeft: "auto" }}>
                <I d={ICO.calendar} s={9} c={T.sub} /> {new Date(ass.scadenza).toLocaleDateString("it-IT", {day:"2-digit",month:"short"})}
              </span>}
            </div>
          )}
        </div>
      );
    };

    const panelStyle = {
      margin:"0 16px 12px", borderRadius:12, border:`1.5px solid ${fase?.color}30`,
      background:T.card, overflow:"hidden"
    };
    const headerStyle = {
      padding:"10px 14px", background:fase?.color+"15", borderBottom:`1px solid ${fase?.color}25`,
      display:"flex", alignItems:"center", gap:8
    };

    // Toggle accordion per id fase
    const isOpen = (id) => fasePanelOpen[id] !== false; // default aperto
    const togglePanel = (id) => setFasePanelOpen(s => ({...s, [id]: !isOpen(id)}));

    // Wrapper accordion semplice - stessa UI di prima, solo con toggle + assegnazione
    const FasePanel = ({ id, children, taskNonFatti = 0 }) => {
      const ass = (c.assegnazioni || {})[id] || {};
      return (
        <div style={panelStyle}>
          <div onClick={() => togglePanel(id)} style={{ ...headerStyle, cursor:"pointer",
            borderBottom: isOpen(id) ? `1px solid ${fase?.color}25` : "none", userSelect:"none" }}>
            {/* Contenuto header originale passato come primo child */}
            <div style={{display:"flex",alignItems:"center",gap:8,flex:1,pointerEvents:"none"}}>
              {(children as any[])[0]}
            </div>
            {/* Assigned person badge in header */}
            {ass.persona && (
              <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:6,
                background:(ass.stato==="completato"?T.grn:ass.stato==="in_corso"?T.blue:ass.stato==="bloccato"?T.red:T.orange)+"18",
                color:ass.stato==="completato"?T.grn:ass.stato==="in_corso"?T.blue:ass.stato==="bloccato"?T.red:T.orange,
                marginRight:4,flexShrink:0}}>{ass.persona.replace("sq:","").split(" ")[0]}</span>
            )}
            {/* Badge alert se task non completati */}
            {taskNonFatti > 0 && (
              <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6,flexShrink:0}}/>
            )}
            <span style={{fontSize:13,color:T.sub,transform:isOpen(id)?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s",flexShrink:0}}>â–¾</span>
          </div>
          {isOpen(id) && (
            <div style={{padding:"12px 14px"}}>
              {(children as any[]).slice(1)}
              <AssegnaCompito faseId={id} />
            </div>
          )}
        </div>
      );
    };

    // === SOPRALLUOGO ===
    if (c.fase === "sopralluogo") {
      const vaniAttivi2 = getVaniAttivi(c); const vaniCompletati = vaniAttivi2.filter(v => Object.values(v.misure||{}).filter(x=>(x as number)>0).length >= 6).length;
      const tuttiCompletati = vaniCompletati === vaniAttivi2.length && vaniAttivi2.length > 0;
      const ndone = [!c.ck_foto, !c.ck_accesso, !c.ck_riepilogo_inviato, !tuttiCompletati].filter(Boolean).length;
      const open_sopr = fasePanelOpen["sopralluogo"] !== false;
      return (
        <div style={panelStyle}>
          <div onClick={()=>togglePanel("sopralluogo")} style={{...headerStyle,cursor:"pointer",borderBottom:open_sopr?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
            <span style={{display:"inline-flex"}}><Ico d={ICO.search} s={16} c={T.blue} /></span>
            <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Sopralluogo</span>
            <span style={{fontSize:11,fontWeight:700,color:tuttiCompletati?T.grn:T.orange,marginRight:4}}>{vaniCompletati}/{vaniAttivi2.length} vani </span>
            {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
            <span style={{fontSize:13,color:T.sub,transform:open_sopr?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>â–¾</span>
          </div>
          {open_sopr && <div style={{padding:"12px 14px"}}>
            <Chip label="Fotografie scattate" done={c.ck_foto} onClick={()=>updateCM("ck_foto",!c.ck_foto)}/>
            <Chip label="Difficoltà accesso rilevata" done={c.ck_accesso} onClick={()=>updateCM("ck_accesso",!c.ck_accesso)}/>
            <Chip label="Riepilogo inviato al cliente" done={c.ck_riepilogo_inviato} onClick={()=>updateCM("ck_riepilogo_inviato",!c.ck_riepilogo_inviato)}/>
            <Chip label={`Tutte le misure inserite (${vaniCompletati}/${vaniAttivi2.length})`} done={tuttiCompletati} onClick={()=>{}}/>
            <Field label="Data sopralluogo" field="dataSopralluogo" type="date"/>
            <AssegnaCompito faseId="sopralluogo" />
            <Field label="Note sopralluogo" field="noteSopralluogo" placeholder="Annotazioni rapide..."/>
            {tuttiCompletati && (
              <div style={{marginTop:8,padding:"10px 12px",borderRadius:8,background:T.grn+"15",border:`1px solid ${T.grn}30`,fontSize:12,color:T.grn,fontWeight:600,textAlign:"center"}}>
                 Pronto per il preventivo
              </div>
            )}
          </div>}
        </div>
      );
    }

    // === PREVENTIVO ===
    if (c.fase === "preventivo") {
      const vaniCalc = getVaniAttivi(c); const totale = vaniCalc.reduce((sum, v) => sum + calcolaVanoPrezzo(v, c), 0);
      const iva = totale * 0.1;
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <I d={ICO.clipboard} s={16} c="#F5A623" />
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Preventivo</span>
          </div>
          <div style={{padding:"12px 14px"}}>
            <Field label="Prezzo base â‚¬/mq" field="prezzoMq" placeholder="350" type="number"/>
            <Field label="Sconto %" field="sconto" placeholder="0" type="number"/>
            <Field label="Note preventivo" field="notePreventivo" placeholder="Condizioni, garanzie..."/>
            <div style={{padding:"10px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.bdr}`,marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,marginBottom:4}}>
                <span>Totale imponibile</span><span style={{fontWeight:700,color:T.text}}>â‚¬ {totale.toFixed(2)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.sub,marginBottom:4}}>
                <span>IVA 10%</span><span>â‚¬ {iva.toFixed(2)}</span>
              </div>
              {c.sconto > 0 && (
                <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.orange,marginBottom:4}}>
                  <span>Sconto {c.sconto}%</span><span>- â‚¬ {(totale * c.sconto/100).toFixed(2)}</span>
                </div>
              )}
              <div style={{borderTop:`1px solid ${T.bdr}`,marginTop:6,paddingTop:6,display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:800}}>
                <span>TOTALE IVA inclusa</span>
                <span style={{color:T.acc}}>â‚¬ {(totale + iva - (totale*(c.sconto||0)/100)).toFixed(2)}</span>
              </div>
            </div>
            <Chip label="Preventivo inviato al cliente" done={c.ck_prev_inviato} onClick={()=>updateCM("ck_prev_inviato",!c.ck_prev_inviato)}/>
            <Chip label="Cliente ha accettato verbalmente" done={c.ck_prev_accettato} onClick={()=>updateCM("ck_prev_accettato",!c.ck_prev_accettato)}/>
          </div>
        </div>
      );
    }

    // === CONFERMA ===
    if (c.fase === "conferma") {
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span style={{fontSize:16}}><I d={ICO.edit} />ï¸</span>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Conferma Ordine</span>
          </div>
          <div style={{padding:"12px 14px"}}>
            <Field label="Data conferma" field="dataConferma" type="date"/>
            <Field label="Acconto ricevuto â‚¬" field="accontoRicevuto" placeholder="0" type="number"/>
            <Field label="Metodo pagamento" field="metodoPagamento" placeholder="Bonifico / Contanti / Carta..."/>
            <Field label="Data prevista posa" field="dataPosaPrevista" type="date"/>
            <Chip label="Contratto firmato" done={c.ck_contratto} onClick={()=>updateCM("ck_contratto",!c.ck_contratto)}/>
            <Chip label="Acconto incassato" done={c.ck_acconto_inc} onClick={()=>updateCM("ck_acconto_inc",!c.ck_acconto_inc)}/>
            <Chip label="Data posa concordata" done={c.ck_data_posa} onClick={()=>updateCM("ck_data_posa",!c.ck_data_posa)}/>
          </div>
        </div>
      );
    }

    // === MISURE ===
    if (c.fase === "misure") {
      const vaniCalc = getVaniAttivi(c);
      const vaniOk = vaniCalc.filter(v => Object.values(v.misure||{}).filter(x=>(x as number)>0).length >= 9).length;
      return (
        (() => {
          const ndone = [!c.ck_misure_ok,!c.ck_diag_ok,!c.ck_pdf_prod,!c.ck_sistema_ok].filter(Boolean).length;
          const open = fasePanelOpen["misure"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("misure")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <span style={{fontSize:16}}><I d={ICO.ruler} /></span>
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Rilievo Misure Definitivo</span>
                <span style={{fontSize:11,fontWeight:700,color:vaniOk===vaniCalc.length?T.grn:T.orange,marginRight:4}}>{vaniOk}/{vaniCalc.length}</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>â–¾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Chip label="Tutte le misure verificate" done={c.ck_misure_ok} onClick={()=>updateCM("ck_misure_ok",!c.ck_misure_ok)}/>
                <Chip label="Diagonali controllate" done={c.ck_diag_ok} onClick={()=>updateCM("ck_diag_ok",!c.ck_diag_ok)}/>
                <Chip label="Riepilogo PDF inviato a produzione" done={c.ck_pdf_prod} onClick={()=>updateCM("ck_pdf_prod",!c.ck_pdf_prod)}/>
                <Chip label="Conferma sistema/colori approvata" done={c.ck_sistema_ok} onClick={()=>updateCM("ck_sistema_ok",!c.ck_sistema_ok)}/>
                <Field label="Tecnico misuratore" field="tecnicoMisure" placeholder="Nome tecnico..."/>
                <Field label="Data rilievo definitivo" field="dataRilievo" type="date"/>
              </div>}
            </div>
          );
        })()
      );
    }

    // === ORDINI ===
    if (c.fase === "ordini") {
      return (
        (() => {
          const ndone = [!c.ck_ordine_inviato,!c.ck_ordine_confermato,!c.ck_cliente_avvisato].filter(Boolean).length;
          const open = fasePanelOpen["ordini"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("ordini")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <I d={ICO.package} s={16} c={fase?.color || T.acc} />
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Ordini Fornitore</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>â–¾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Field label="Fornitore" field="fornitore" placeholder="Es. SchÃ¼co, Rehau..."/>
                <Field label="NÂ° Ordine fornitore" field="numOrdine" placeholder="ORD-2026-XXXX"/>
                <Field label="Data ordine" field="dataOrdine" type="date"/>
                <Field label="Data consegna prevista" field="dataConsegna" type="date"/>
                <Chip label="Ordine inviato" done={c.ck_ordine_inviato} onClick={()=>updateCM("ck_ordine_inviato",!c.ck_ordine_inviato)}/>
                <Chip label="Conferma ricezione da fornitore" done={c.ck_ordine_confermato} onClick={()=>updateCM("ck_ordine_confermato",!c.ck_ordine_confermato)}/>
                <Chip label="Materiale in arrivo comunicato al cliente" done={c.ck_cliente_avvisato} onClick={()=>updateCM("ck_cliente_avvisato",!c.ck_cliente_avvisato)}/>
                {/* ORDER COCKPIT — Barra approvvigionamento commessa */}
                {(() => {
                  const ordCM = ordiniFornDB.filter(o => (o.commesse_ids || []).includes(c.id) || o.cmId === c.id);
                  if (!ordCM.length) return <div style={{marginTop:10,padding:10,borderRadius:10,background:"#EEF8F8",border:"1px solid #C8E4E4",fontSize:11,color:"#156060",textAlign:"center"}}>Nessun ordine procurement collegato a questa commessa</div>;
                  const totRighe = ordCM.reduce((s, o) => s + ((o.righe || []).length || o.totale_pezzi || 0), 0);
                  const confRighe = ordCM.filter(o => ['confermato_forn','in_produzione','spedito','ricevuto','controllato','chiuso'].includes(o.stato)).reduce((s, o) => s + ((o.righe || []).length || o.totale_pezzi || 0), 0);
                  const ricRighe = ordCM.filter(o => ['ricevuto','controllato','chiuso'].includes(o.stato)).reduce((s, o) => s + ((o.righe || []).length || o.totale_pezzi || 0), 0);
                  const pConf = totRighe > 0 ? Math.round(confRighe / totRighe * 100) : 0;
                  const pRic = totRighe > 0 ? Math.round(ricRighe / totRighe * 100) : 0;
                  const inRitardo = ordCM.some(o => o.consegna_prevista && new Date(o.consegna_prevista) < new Date() && !['ricevuto','chiuso','controllato','annullato'].includes(o.stato));
                  return (
                    <div style={{marginTop:12,padding:14,borderRadius:12,background:"#EEF8F8",border:inRitardo?"2px solid #DC4444":"2px solid #C8E4E4"}}>
                      <div style={{fontSize:11,fontWeight:800,color:"#0D1F1F",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                        APPROVVIGIONAMENTO
                        {inRitardo && <span style={{color:"#DC4444",fontWeight:800,marginLeft:6}}>IN RITARDO</span>}
                      </div>
                      {/* Progress bars */}
                      <div style={{marginBottom:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,fontWeight:700,color:"#156060",marginBottom:2}}>
                          <span>Ordinato: {ordCM.length} ordini ({totRighe} righe)</span><span>100%</span>
                        </div>
                        <div style={{height:8,borderRadius:4,background:"#C8E4E4"}}><div style={{height:8,borderRadius:4,background:"#28A0A0",width:"100%"}}/></div>
                      </div>
                      <div style={{marginBottom:6}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,fontWeight:700,color:"#3B7FE0",marginBottom:2}}>
                          <span>Confermato fornitore</span><span>{pConf}%</span>
                        </div>
                        <div style={{height:8,borderRadius:4,background:"#C8E4E4"}}><div style={{height:8,borderRadius:4,background:"#3B7FE0",width:pConf+"%",transition:"width .3s"}}/></div>
                      </div>
                      <div style={{marginBottom:4}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:9,fontWeight:700,color:"#1A9E73",marginBottom:2}}>
                          <span>Ricevuto in magazzino</span><span>{pRic}%</span>
                        </div>
                        <div style={{height:8,borderRadius:4,background:"#C8E4E4"}}><div style={{height:8,borderRadius:4,background:"#1A9E73",width:pRic+"%",transition:"width .3s"}}/></div>
                      </div>
                      {/* Lista ordini mini */}
                      <div style={{marginTop:8}}>
                        {ordCM.map(o => {
                          const stO = STATI_ORD_MINI.find(s => s.id === o.stato) || {l:o.stato,c:"#999"};
                          return <div key={o.id || o.codice} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0",fontSize:10,borderTop:"1px solid #C8E4E4"}}>
                            <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:"#28A0A0"}}>{o.codice}</span>
                            <span style={{flex:1,color:"#156060"}}>{o.fornitore}</span>
                            <span style={{padding:"2px 8px",borderRadius:4,fontSize:8,fontWeight:700,background:stO.c+"18",color:stO.c}}>{stO.l}</span>
                          </div>;
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>}
            </div>
          );
        })()
      );
    }

    // === PRODUZIONE ===
    if (c.fase === "produzione") {
      return (
        (() => {
          const ndone = [!c.ck_mat_ricevuto,!c.ck_colori_ok,!c.ck_accessori_ok,!c.ck_posa_confermata].filter(Boolean).length;
          const open = fasePanelOpen["produzione"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("produzione")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <I d={ICO.factory} s={16} c="#F59E0B" />
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Produzione</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>â–¾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Field label="Data consegna in magazzino" field="dataInMagazzino" type="date"/>
                <Chip label="Materiale ricevuto e controllato" done={c.ck_mat_ricevuto} onClick={()=>updateCM("ck_mat_ricevuto",!c.ck_mat_ricevuto)}/>
                <Chip label="Colori verificati" done={c.ck_colori_ok} onClick={()=>updateCM("ck_colori_ok",!c.ck_colori_ok)}/>
                <Chip label="Accessori completi (maniglie, guarnizioni)" done={c.ck_accessori_ok} onClick={()=>updateCM("ck_accessori_ok",!c.ck_accessori_ok)}/>
                <Chip label="Data posa confermata al cliente" done={c.ck_posa_confermata} onClick={()=>updateCM("ck_posa_confermata",!c.ck_posa_confermata)}/>
                <Field label="Note magazzino" field="noteMagazzino" placeholder="Anomalie, sostituzioni..."/>
              </div>}
            </div>
          );
        })()
      );
    }

    // === POSA ===
    if (c.fase === "posa") {
      return (
        (() => {
          const ndone = [!c.ck_posati,!c.ck_finiture,!c.ck_pulizia,!c.ck_test,!c.ck_foto_posa,!c.ck_cliente_ok].filter(Boolean).length;
          const open = fasePanelOpen["posa"] !== false;
          return (
            <div style={panelStyle}>
              <div onClick={()=>togglePanel("posa")} style={{...headerStyle,cursor:"pointer",borderBottom:open?`1px solid ${fase?.color}25`:"none",userSelect:"none"}}>
                <I d={ICO.hammer} s={16} c="#F97316" />
                <span style={{fontSize:13,fontWeight:700,color:T.text,flex:1}}>Posa in Opera</span>
                {ndone>0 && <span style={{width:8,height:8,borderRadius:"50%",background:T.red,display:"inline-block",marginRight:6}}/>}
                <span style={{fontSize:13,color:T.sub,transform:open?"rotate(0deg)":"rotate(-90deg)",transition:"transform 0.2s"}}>â–¾</span>
              </div>
              {open && <div style={{padding:"12px 14px"}}>
                <Field label="Data posa effettiva" field="dataPosa" type="date"/>
                <Field label="Squadra posatori" field="squadraPosa" placeholder="Marco + Luigi..."/>
                <Chip label="Tutti i vani posati" done={c.ck_posati} onClick={()=>updateCM("ck_posati",!c.ck_posati)}/>
                <Chip label="Sigillature e finiture completate" done={c.ck_finiture} onClick={()=>updateCM("ck_finiture",!c.ck_finiture)}/>
                <Chip label="Pulizia cantiere" done={c.ck_pulizia} onClick={()=>updateCM("ck_pulizia",!c.ck_pulizia)}/>
                <Chip label="Test funzionamento maniglie/chiusure" done={c.ck_test} onClick={()=>updateCM("ck_test",!c.ck_test)}/>
                <Chip label="Foto lavoro completato scattate" done={c.ck_foto_posa} onClick={()=>updateCM("ck_foto_posa",!c.ck_foto_posa)}/>
                <Chip label="Cliente presente e soddisfatto" done={c.ck_cliente_ok} onClick={()=>updateCM("ck_cliente_ok",!c.ck_cliente_ok)}/>
                <Field label="Note posa" field="notePosa" placeholder="Problemi riscontrati, extra..."/>
              </div>}
            </div>
          );
        })()
      );
    }

    // === CHIUSURA ===
    if (c.fase === "chiusura") {
      const vaniCalc2 = getVaniAttivi(c); const totale = vaniCalc2.reduce((sum, v) => {
        const m = v.misure||{};
        const mq = ((m.lCentro||0)/1000) * ((m.hCentro||0)/1000);
        return sum + mq * parseFloat(c.prezzoMq||350);
      }, 0);
      const iva = totale * 0.1;
      const totIva = totale + iva - (totale*(c.sconto||0)/100);
      const saldo = totIva - parseFloat(c.accontoRicevuto||0);
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span style={{fontSize:16}}></span>
            <span style={{fontSize:13,fontWeight:700,color:T.text}}>Chiusura Commessa</span>
          </div>
          <div style={{padding:"12px 14px"}}>
            <div style={{padding:"10px 12px",borderRadius:8,background:T.bg,border:`1px solid ${T.bdr}`,marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:T.sub}}>Totale commessa</span><span style={{fontWeight:700}}>â‚¬ {totIva.toFixed(2)}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                <span style={{color:T.sub}}>Acconto ricevuto</span><span style={{color:T.grn,fontWeight:700}}>- â‚¬ {parseFloat(c.accontoRicevuto||0).toFixed(2)}</span>
              </div>
              <div style={{borderTop:`1px solid ${T.bdr}`,paddingTop:6,marginTop:2,display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:800}}>
                <span>Saldo da incassare</span><span style={{color:saldo>0?T.red:T.grn}}>â‚¬ {saldo.toFixed(2)}</span>
              </div>
            </div>
            <Field label="Data chiusura" field="dataChiusura" type="date"/>
            <Field label="Saldo incassato â‚¬" field="saldoIncassato" placeholder="0" type="number"/>
            <Field label="Metodo saldo" field="metodoSaldo" placeholder="Bonifico / Contanti..."/>
            <Chip label="Saldo incassato" done={c.ck_saldo} onClick={()=>updateCM("ck_saldo",!c.ck_saldo)}/>
            <Chip label="Fattura emessa" done={c.ck_fattura} onClick={()=>updateCM("ck_fattura",!c.ck_fattura)}/>
            <Chip label="Garanzia consegnata al cliente" done={c.ck_garanzia} onClick={()=>updateCM("ck_garanzia",!c.ck_garanzia)}/>
            <Chip label="Scheda commessa archiviata" done={c.ck_archiviata} onClick={()=>updateCM("ck_archiviata",!c.ck_archiviata)}/>
            {c.ck_saldo && c.ck_fattura && (
              <div style={{marginTop:8,padding:"12px",borderRadius:8,background:T.grn+"15",border:`1px solid ${T.grn}30`,textAlign:"center"}}>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"center" }}><I d={ICO.sparkles} s={22} c={T.acc} /></div>
                <div style={{fontSize:13,fontWeight:800,color:T.grn,marginTop:4}}>Commessa completata!</div>
                <div style={{fontSize:11,color:T.sub,marginTop:2}}>{c.code} Â· {c.cliente} {c.cognome||""}</div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderRiepilogo = () => <RiepilogoPanel />;

// =======================================================
// MASTRO ERP v2 - PARTE 3/5
// Righe 2639-3594: Vano Detail Wizard completo
// =======================================================
  /* == VANO DETAIL == */
  const renderVanoDetail = () => <VanoSectorRouter />;

  /* == AGENDA TAB - Giorno / Settimana / Mese == */
  /* == CLIENTI TAB == */
  const [clientiSearch, setClientiSearch] = useState("");
  const [clientiFilter, setClientiFilter] = useState("tutti");
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [newCliente, setNewCliente] = useState({ nome: "", cognome: "", tipo: "cliente", telefono: "", email: "", indirizzo: "", piva: "", note: "" });
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  const [clienteDetailTab, setClienteDetailTab] = useState("info");
  const [clienteNotes, setClienteNotes] = useState<Record<string,string>>({});



  const renderClienti = () => {
    // === DETAIL VIEW ===
    if (selectedCliente) {
      const cl = selectedCliente;
      const clCM = cantieri.filter((c: any) => {
        const nome = (cl.nome + (cl.cognome ? " " + cl.cognome : "")).toLowerCase();
        return (c.cliente||"").toLowerCase() === nome || (c.clienteId||"") === cl.id;
      });
      const clEvents = events.filter((e: any) => (e.persona||"").toLowerCase().includes((cl.nome||"").toLowerCase()));
      const clMsgs = msgs.filter((m: any) => (m.from||"").toLowerCase().includes((cl.nome||"").toLowerCase()) || (m.to||"").toLowerCase().includes((cl.nome||"").toLowerCase()));
      const clFatture = fattureDB.filter((f: any) => (f.cliente||"").toLowerCase().includes((cl.nome||"").toLowerCase()));
      const tabs = ["info","storia","commesse","note"];
      // editMode uses clienteNotes["_editMode"] as workaround
      const editMode = clienteNotes["_editMode"] === "1";
      const setEditMode = (v: boolean) => setClienteNotes(prev => ({...prev, _editMode: v ? "1" : "0"}));
      const nota = clienteNotes["_nota"] || "";
      const setNota = (v: string) => setClienteNotes(prev => ({...prev, _nota: v}));

      // Build timeline
      const timeline: any[] = [];
      clCM.forEach((c: any) => timeline.push({ tipo: "commessa", data: c.dataCreazione || c.data || "", label: c.titolo || c.nome || "Commessa", sub: c.fase || "", color: T.acc, ico: "briefcase" }));
      clEvents.forEach((e: any) => timeline.push({ tipo: "evento", data: e.data || e.date || "", label: e.text || e.titolo || "Evento", sub: e.tipo || "", color: T.blue, ico: "calendar" }));
      clMsgs.forEach((m: any) => timeline.push({ tipo: "messaggio", data: m.data || m.date || "", label: m.oggetto || m.text || "Messaggio", sub: m.canale || "", color: "#25d366", ico: "messageCircle" }));
      clFatture.forEach((f: any) => timeline.push({ tipo: "fattura", data: f.data || "", label: "Fattura " + (f.numero || ""), sub: f.stato || "", color: T.orange, ico: "wallet" }));
      (cl.diario || []).forEach((d: any) => timeline.push({ tipo: "nota", data: d.data || "", label: d.testo || "", sub: "Nota manuale", color: T.purple || "#7C5FBF", ico: "fileText" }));
      timeline.sort((a: any, b: any) => (b.data || "").localeCompare(a.data || ""));

      return (
        <div style={{ minHeight: "100vh", background: T.bg, backgroundImage: "linear-gradient(rgba(40,160,160,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,.18) 1px,transparent 1px)", backgroundSize: "24px 24px" }}>
          {/* Header */}
          <div style={{ background: "#0D1F1F", padding: "20px 16px 24px", paddingTop: "calc(20px + env(safe-area-inset-top, 0px))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div onClick={() => { setSelectedCliente(null); setClienteDetailTab("info"); }}
                style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <I d={ICO.arrowLeft} s={18} c="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#fff" }}>{cl.nome}{cl.cognome ? " " + cl.cognome : ""}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>{cl.tipo || "cliente"}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#0D1F1F", background: T.acc, padding: "4px 10px", borderRadius: 8, textTransform: "uppercase" as any }}>{cl.tipo || "cliente"}</span>
            </div>
            {/* Quick actions */}
            <div style={{ display: "flex", gap: 8 }}>
              {cl.telefono && <div onClick={() => window.location.href = "tel:" + cl.telefono}
                style={{ flex: 1, padding: "10px 8px", borderRadius: 12, background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                <I d={ICO.phone} s={14} c={T.acc} /><span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Chiama</span>
              </div>}
              {cl.telefono && <div onClick={() => window.open("https://wa.me/" + (cl.telefono.replace(/\D/g,"").startsWith("39") ? cl.telefono.replace(/\D/g,"") : "39" + cl.telefono.replace(/\D/g,"")))}
                style={{ flex: 1, padding: "10px 8px", borderRadius: 12, background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                <I d={ICO.messageCircle} s={14} c="#25d366" /><span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>WhatsApp</span>
              </div>}
              {cl.email && <div onClick={() => window.location.href = "mailto:" + cl.email}
                style={{ flex: 1, padding: "10px 8px", borderRadius: 12, background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                <I d={ICO.mail} s={14} c={T.blue} /><span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Email</span>
              </div>}
            </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 0, background: T.card, borderBottom: "1.5px solid " + T.bdr }}>
            {tabs.map(t => (
              <div key={t} onClick={() => setClienteDetailTab(t)}
                style={{ flex: 1, padding: "12px 8px", textAlign: "center", fontSize: 13, fontWeight: clienteDetailTab === t ? 900 : 600,
                  color: clienteDetailTab === t ? T.acc : T.sub, cursor: "pointer",
                  borderBottom: clienteDetailTab === t ? "3px solid " + T.acc : "3px solid transparent",
                  textTransform: "capitalize" as any }}>{t}</div>
            ))}
          </div>

          <div style={{ padding: "16px 16px 120px" }}>
            {/* INFO TAB */}
            {clienteDetailTab === "info" && (
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <button onClick={() => { 
                    if (editMode) { 
                      const edits: any = {}; 
                      ["nome","cognome","telefono","email","indirizzo","piva","note"].forEach(f => { if (clienteNotes["_edit_" + f] !== undefined) edits[f] = clienteNotes["_edit_" + f]; });
                      setContatti(prev => prev.map(c => c.id === cl.id ? {...c, ...edits} : c)); 
                      setSelectedCliente({...cl, ...edits}); 
                      setClienteNotes(prev => { const n = {...prev}; Object.keys(n).filter(k => k.startsWith("_edit_")).forEach(k => delete n[k]); return {...n, _editMode: "0"}; });
                    } else { setEditMode(true); } 
                  }}
                    style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: editMode ? T.acc : T.accLt,
                      color: editMode ? "#fff" : T.acc, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: FF,
                      boxShadow: editMode ? "0 3px 0 0 " + T.accDk : "none" }}>
                    {editMode ? "Salva" : "Modifica"}
                  </button>
                </div>
                {["nome","cognome","telefono","email","indirizzo","piva","note"].map(f => (
                  <div key={f} style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4, textTransform: "uppercase" as any }}>{f === "piva" ? "P.IVA" : f}</div>
                    {editMode ? (
                      <input value={(clienteNotes["_edit_" + f] !== undefined ? clienteNotes["_edit_" + f] : (cl as any)[f]) || ""} 
                        onChange={e => setClienteNotes(prev => ({...prev, ["_edit_" + f]: e.target.value}))}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid " + T.acc, background: T.card, fontSize: 14, fontFamily: FF, color: T.text, outline: "none" }} />
                    ) : (
                      <div style={{ padding: "12px 14px", borderRadius: 12, border: "1.5px solid " + T.bdr, background: T.card, fontSize: 14, color: (cl as any)[f] ? T.text : T.sub, minHeight: 44 }}>
                        {(cl as any)[f] || "—"}
                      </div>
                    )}
                  </div>
                ))}
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16 }}>
                  {[
                    { label: "Commesse", val: clCM.length, color: T.acc },
                    { label: "Fatture", val: clFatture.length, color: T.orange },
                    { label: "Messaggi", val: clMsgs.length, color: "#25d366" },
                  ].map(s => (
                    <div key={s.label} style={{ background: T.card, borderRadius: 14, border: "1.5px solid " + T.bdr, padding: "14px 10px", textAlign: "center", boxShadow: "0 3px 0 0 " + T.bdr }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Delete */}
                <button onClick={() => { if (confirm("Eliminare " + cl.nome + "?")) { setContatti(prev => prev.filter(c => c.id !== cl.id)); setSelectedCliente(null); } }}
                  style={{ width: "100%", marginTop: 24, padding: "14px", borderRadius: 14, border: "none", background: "#FFE4E4", color: "#DC4444",
                    fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FF, boxShadow: "0 4px 0 0 #F0B0B0" }}>
                  Elimina contatto
                </button>
              </div>
            )}

            {/* STORIA TAB - Timeline */}
            {clienteDetailTab === "storia" && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 12 }}>Cronologia completa</div>
                {timeline.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: T.sub }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Nessuna attivita ancora</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>Le commesse, messaggi ed eventi appariranno qui</div>
                  </div>
                )}
                {timeline.map((item: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 2 }}>
                    {/* Timeline line */}
                    <div style={{ display: "flex", flexDirection: "column" as any, alignItems: "center", width: 24 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color, flexShrink: 0, marginTop: 6 }} />
                      {i < timeline.length - 1 && <div style={{ width: 2, flex: 1, background: T.bdr, minHeight: 30 }} />}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, paddingBottom: 16 }}>
                      <div style={{ background: T.card, borderRadius: 12, border: "1.5px solid " + T.bdr, padding: "12px 14px", boxShadow: "0 2px 0 0 " + T.bdr }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <I d={ICO[item.ico] || ICO.fileText} s={13} c={item.color} />
                          <span style={{ fontSize: 10, fontWeight: 800, color: item.color, textTransform: "uppercase" as any }}>{item.tipo}</span>
                          <span style={{ fontSize: 10, color: T.sub, marginLeft: "auto" }}>{item.data ? new Date(item.data).toLocaleDateString("it-IT") : ""}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.label}</div>
                        {item.sub && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{item.sub}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COMMESSE TAB */}
            {clienteDetailTab === "commesse" && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 12 }}>Commesse ({clCM.length})</div>
                {clCM.length === 0 && <div style={{ textAlign: "center", padding: "40px", color: T.sub, fontSize: 13 }}>Nessuna commessa per questo cliente</div>}
                {clCM.map((c: any) => (
                  <div key={c.id} onClick={() => { setSelectedCliente(null); setSelectedCM(c); setTab("commesse"); }}
                    style={{ background: T.card, borderRadius: 14, border: "1.5px solid " + T.bdr, padding: "14px 16px",
                      marginBottom: 8, cursor: "pointer", boxShadow: "0 3px 0 0 " + T.bdr }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{c.titolo || c.nome || "Commessa"}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.acc, background: T.accLt, padding: "3px 8px", borderRadius: 6 }}>{c.fase || "—"}</span>
                    </div>
                    {c.indirizzo && <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}><I d={ICO.mapPin} s={11} c={T.sub} /> {c.indirizzo}</div>}
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>{countVani(c)} vani</div>
                  </div>
                ))}
              </div>
            )}

            {/* NOTE TAB */}
            {clienteDetailTab === "note" && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 12 }}>Diario</div>
                {/* Add note */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <input value={nota} onChange={e => setNota(e.target.value)} placeholder="Scrivi una nota..."
                    style={{ flex: 1, padding: "12px 14px", borderRadius: 12, border: "1.5px solid " + T.bdr, background: T.card, fontSize: 14, fontFamily: FF, color: T.text, outline: "none" }} />
                  <button onClick={() => {
                    if (!nota.trim()) return;
                    const entry = { data: new Date().toISOString(), testo: nota.trim() };
                    const updated = {...cl, diario: [...(cl.diario || []), entry]};
                    setContatti(prev => prev.map(c => c.id === cl.id ? updated : c));
                    setSelectedCliente(updated);
                    setNota("");
                  }} style={{ width: 48, height: 48, borderRadius: 12, border: "none", background: T.acc, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", boxShadow: "0 4px 0 0 " + T.accDk, flexShrink: 0 }}>
                    <I d={ICO.plus} s={20} c="#fff" sw={3} />
                  </button>
                </div>
                {/* Notes list */}
                {(cl.diario || []).slice().reverse().map((d: any, i: number) => (
                  <div key={i} style={{ background: T.card, borderRadius: 12, border: "1.5px solid " + T.bdr, padding: "14px 16px",
                    marginBottom: 8, boxShadow: "0 2px 0 0 " + T.bdr }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.sub }}>{d.data ? new Date(d.data).toLocaleDateString("it-IT", {day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}) : ""}</span>
                      <span onClick={() => {
                        const updated = {...cl, diario: (cl.diario || []).filter((_: any, idx: number) => idx !== (cl.diario || []).length - 1 - i)};
                        setContatti(prev => prev.map(c => c.id === cl.id ? updated : c));
                        setSelectedCliente(updated);
                      }} style={{ fontSize: 10, color: T.red, cursor: "pointer", fontWeight: 700 }}>Elimina</span>
                    </div>
                    <div style={{ fontSize: 13, color: T.text, lineHeight: 1.5 }}>{d.testo}</div>
                  </div>
                ))}
                {(cl.diario || []).length === 0 && <div style={{ textAlign: "center", padding: "40px", color: T.sub, fontSize: 13 }}>Nessuna nota ancora. Scrivi la prima!</div>}
              </div>
            )}
          </div>
        </div>
      );
    }

    // === LIST VIEW ===
    const flt = contatti.filter((c: any) => {
      if (clientiFilter !== "tutti" && c.tipo !== clientiFilter) return false;
      if (clientiSearch) {
        const q = clientiSearch.toLowerCase();
        return (c.nome||"").toLowerCase().includes(q) || (c.cognome||"").toLowerCase().includes(q) || (c.telefono||"").includes(q) || (c.email||"").toLowerCase().includes(q);
      }
      return true;
    });
    const tipi = ["tutti","clienti","fornitori","professionisti"];
    return (
      <div style={{ padding: "16px 16px 120px", minHeight: "100vh" }}>
        {/* Search */}
        <div style={{ position:"relative", marginBottom:12 }}>
          <I d={ICO.search} s={16} c={T.sub} style={{position:"absolute",left:12,top:12}} />
          <input value={clientiSearch} onChange={e => setClientiSearch(e.target.value)}
            placeholder="Cerca..." style={{ width:"100%", padding:"12px 12px 12px 38px", borderRadius:14, border:"1.5px solid " + T.bdr, background:T.card, fontSize:14, fontFamily:FF, color:T.text, outline:"none" }} />
        </div>
        {/* Filter pills */}
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" as any }}>
          {tipi.map(t => {
            const count = t === "tutti" ? contatti.length : contatti.filter((c:any) => c.tipo === t.replace(/i$/,"e").replace(/ori$/,"ore")).length;
            return (
              <button key={t} onClick={() => setClientiFilter(t)}
                style={{ padding:"6px 14px", borderRadius:20, border: clientiFilter===t ? "none" : "1.5px solid " + T.bdr,
                  background: clientiFilter===t ? T.acc : T.card, color: clientiFilter===t ? "#fff" : T.text,
                  fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:FF,
                  boxShadow: clientiFilter===t ? "0 3px 0 0 " + T.accDk : "none",
                  textTransform:"capitalize" as any }}>
                {t} {count}
              </button>
            );
          })}
        </div>
        {/* Empty state */}
        {flt.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 20px", color:T.sub }}>
            <I d={ICO.userPlus} s={40} c={T.bdr} />
            <div style={{ fontSize:16, fontWeight:800, color:T.text, marginTop:16 }}>Nessun contatto</div>
            <div style={{ fontSize:13, marginTop:4 }}>Aggiungi il tuo primo cliente</div>
          </div>
        )}
        {/* Contact list */}
        {flt.map((c: any) => (
          <div key={c.id} onClick={() => setSelectedCliente(c)}
            style={{ background:T.card, borderRadius:14, border:"1.5px solid " + T.bdr, padding:"14px 16px",
              marginBottom:8, display:"flex", alignItems:"center", gap:12, cursor:"pointer",
              boxShadow:"0 3px 0 0 " + T.bdr }}>
            <div style={{ width:40, height:40, borderRadius:12, background:T.accLt,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:15, fontWeight:900, color:T.acc }}>
              {(c.nome||"?")[0].toUpperCase()}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:800, color:T.text }}>{c.nome}{c.cognome ? " " + c.cognome : ""}</div>
              {c.telefono && <div style={{ fontSize:12, color:T.sub }}>{c.telefono}</div>}
            </div>
            <span style={{ fontSize:10, fontWeight:700, color:T.acc, background:T.accLt, padding:"3px 8px", borderRadius:6, textTransform:"capitalize" as any }}>{c.tipo || "cliente"}</span>
          </div>
        ))}
        {/* FAB add */}
        <div onClick={() => setShowNewCliente(true)}
          style={{ position:"fixed", bottom:90, right:20, width:56, height:56, borderRadius:16,
            background:T.acc, display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 6px 0 0 " + T.accDk + ", 0 8px 20px rgba(0,0,0,.15)", cursor:"pointer", zIndex:50 }}>
          <I d={ICO.plus} s={24} c="#fff" sw={3} />
        </div>
        {/* New contact modal */}
        {showNewCliente && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:300, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
            onClick={() => setShowNewCliente(false)}>
            <div onClick={e => e.stopPropagation()}
              style={{ background:T.card, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480, padding:"24px 20px", maxHeight:"85vh", overflow:"auto" }}>
              <div style={{ fontSize:18, fontWeight:900, color:T.text, marginBottom:16 }}>Nuovo contatto</div>
              {["nome","cognome","telefono","email","indirizzo","piva","note"].map(f => (
                <div key={f} style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.sub, marginBottom:4, textTransform:"capitalize" as any }}>{f === "piva" ? "P.IVA" : f}</div>
                  <input value={(newCliente as any)[f] || ""} onChange={e => setNewCliente(prev => ({...prev, [f]: e.target.value}))}
                    style={{ width:"100%", padding:"12px 14px", borderRadius:12, border:"1.5px solid " + T.bdr, background:T.bg, fontSize:14, fontFamily:FF, color:T.text, outline:"none" }} />
                </div>
              ))}
              <div style={{ marginBottom:12 }}>
                <div style={{ fontSize:11, fontWeight:700, color:T.sub, marginBottom:6 }}>Tipo</div>
                <div style={{ display:"flex", gap:8 }}>
                  {["cliente","fornitore","professionista"].map(t => (
                    <button key={t} onClick={() => setNewCliente(prev => ({...prev, tipo: t}))}
                      style={{ flex:1, padding:"10px 8px", borderRadius:12, border: newCliente.tipo===t ? "none" : "1.5px solid " + T.bdr,
                        background: newCliente.tipo===t ? T.acc : T.card, color: newCliente.tipo===t ? "#fff" : T.text,
                        fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:FF,
                        boxShadow: newCliente.tipo===t ? "0 3px 0 0 " + T.accDk : "none",
                        textTransform:"capitalize" as any }}>{t}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => {
                if (!newCliente.nome.trim()) return;
                const nc = { ...newCliente, id: "CT-" + Date.now(), preferito: false, diario: [] };
                setContatti(prev => [...prev, nc]);
                setNewCliente({ nome:"", cognome:"", tipo:"cliente", telefono:"", email:"", indirizzo:"", piva:"", note:"" });
                setShowNewCliente(false);
              }} style={{ width:"100%", padding:"16px", borderRadius:14, border:"none", background:T.acc, color:"#fff",
                fontSize:15, fontWeight:900, cursor:"pointer", fontFamily:FF,
                boxShadow:"0 6px 0 0 " + T.accDk, marginTop:8 }}>
                Salva contatto
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAgenda = () => <AgendaPanel />;

// =======================================================
// MASTRO ERP v2 - PARTE 4/5
// Righe 3595-4130: Agenda (Giorno/Settimana/Mese), Chat AI, Settings
// =======================================================
  /* == CHAT / AI TAB == */
  const renderMessaggi = () => <MessaggiPanel />;

  /* == SETTINGS TAB == */

  //  CONTABILITÃ€ PRO 
  const renderContabilita = () => <ContabilitaPanel />;


  const renderSettings = () => <SettingsPanel />;

// =======================================================
// MASTRO ERP v2 - PARTE 5/5
// Righe 4131-5248: Modals (Task, Commessa, Vano, Allegati, Firma, AI Photo),
//                 Main Render finale
// =======================================================
  /* ======= MODALS ======= */
  const renderModal = () => <ModalPanel />;


  const generaPreventivoPDF = (c) => _generaPreventivoPDF(c, {
    sistemiDB, vetriDB, coprifiliDB, lamiereDB, aziendaInfo, getVaniAttivi,
    calcolaVanoPrezzo, tapparelleListino, persianeListino, zanzariereListino,
  });


  // PDF Misure (estratto in lib/pdf-misure.ts)
  const generaPDFMisure = (c) => _generaPDFMisure(c, { aziendaInfo, getVaniAttivi });


  // === FATTURAZIONE ===
  const nextNumFattura = () => {
    const anno = new Date().getFullYear();
    const annoPrev = fattureDB.filter(f => f.anno === anno);
    return annoPrev.length + 1;
  };

  const creaFattura = (c, tipo: "acconto" | "saldo" | "unica") => {
    const num = nextNumFattura();
    const anno = new Date().getFullYear();
    // Calcola totale REALE dai vani + voci libere
    const importoBase = calcolaTotaleCommessa(c);
    const giaPagato = fattureDB.filter(f => f.cmId === c.id && f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
    const importo = tipo === "acconto" ? Math.round(importoBase * 0.5) : tipo === "saldo" ? Math.round(importoBase - giaPagato) : importoBase;
    const iva = 10; // serramenti = 10% se ristrutturazione, 22% se nuova costruzione
    const imponibile = Math.round(importo / (1 + iva / 100) * 100) / 100;
    const ivaAmt = importo - imponibile;
    const fattura = {
      id: "fat_" + Date.now(),
      numero: num,
      anno,
      data: new Date().toLocaleDateString("it-IT"),
      dataISO: new Date().toISOString().split("T")[0],
      tipo,
      cmId: c.id,
      cmCode: c.code,
      cliente: c.cliente,
      cognome: c.cognome || "",
      indirizzo: c.indirizzo || "",
      cf: c.cf || "",
      piva: c.piva || "",
      sdi: c.sdi || "",
      pec: c.pec || "",
      importo,
      imponibile,
      iva,
      ivaAmt,
      pagata: false,
      dataPagamento: null,
      metodoPagamento: "",
      scadenza: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split("T")[0]; })(),
      note: tipo === "acconto" ? "Acconto 50% su ordine" : tipo === "saldo" ? "Saldo a completamento lavori" : "",
    };
    setFattureDB(prev => [...prev, fattura]);
    // AUTO-ADVANCE pipeline
    if (tipo === "acconto" || tipo === "unica") setFaseTo(c.id, "ordini");
    if (tipo === "saldo") setFaseTo(c.id, "chiusura");
    return fattura;
  };

  const generaFatturaPDF = (fat) => _generaFatturaPDF(fat, { aziendaInfo, fattureDB, calcolaVanoPrezzo, getVaniAttivi });
  // === WHATSAPP / EMAIL HELPERS ===
  const inviaWhatsApp = (c, tipo: "preventivo" | "conferma" | "stato") => {
    const tel = (c.telefono || "").replace(/\D/g, "");
    const msgs = {
      preventivo: `Gentile ${c.cliente}, le invio in allegato il preventivo per la fornitura serramenti. Rif: ${c.code}. Resto a disposizione per qualsiasi chiarimento.`,
      conferma: `Gentile ${c.cliente}, confermiamo la ricezione del suo ordine ${c.code}. Provvederemo a ordinare il materiale. La terremo aggiornata sullo stato di avanzamento.`,
      stato: `Gentile ${c.cliente}, aggiornamento sul suo ordine ${c.code}: ${c.trackingStato === "ordinato" ? "il materiale è stato ordinato" : c.trackingStato === "produzione" ? "il materiale è in produzione" : c.trackingStato === "pronto" ? "il materiale è pronto per la consegna" : c.trackingStato === "consegnato" ? "il materiale è stato consegnato" : c.trackingStato === "montato" ? "il montaggio è completato" : "in lavorazione"}.${c.dataPrevConsegna ? " Consegna prevista: " + c.dataPrevConsegna : ""}`,
    };
    const msg = encodeURIComponent(msgs[tipo] || "");
    window.open(`https://wa.me/${tel.startsWith("39") ? tel : "39" + tel}?text=${msg}`, "_blank");
  };

  const inviaEmail = (c, tipo: "preventivo" | "conferma" | "montaggio" | "saldo" | "generico") => {
    const az = aziendaDB;
    const azNome = az.ragione || az.nome || "Walter Cozza Serramenti";
    const azTel = az.telefono || "";
    const azEmail = az.email || "";
    const firma = `\nCordiali saluti,\n${azNome}${azTel ? "\nTel. " + azTel : ""}${azEmail ? "\n" + azEmail : ""}`;
    const vani = getVaniAttivi(c);
    const totale = vani.reduce((s, v) => s + calcolaVanoPrezzo(v, c), 0) + (c.vociLibere || []).reduce((s, vl) => s + ((vl.importo||0)*(vl.qta||1)), 0);
    const ivaP = parseFloat(c.ivaPerc || 10);
    const totIva = totale * (1 + ivaP / 100);
    const fmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";
    
    const templates = {
      preventivo: {
        oggetto: `Preventivo ${c.code} - ${azNome}`,
        corpo: `Gentile ${c.cliente} ${c.cognome || ""},\n\nle trasmetto il preventivo per la fornitura e posa in opera dei serramenti per l'immobile in ${c.indirizzo || " - "}.\n\nRif. commessa: ${c.code}\nVani: ${vani.length}\n${c.sistema ? "Sistema: " + c.sistema + "\n" : ""}Importo: â‚¬${fmt(totale)} + IVA ${ivaP}% = â‚¬${fmt(totIva)}\n${c.praticaFiscale ? "Agevolazione: " + c.praticaFiscale + "\n" : ""}\nIl preventivo include fornitura, posa in opera, smaltimento vecchi infissi e rilascio documentazione (DoP, CE, manuale).\n\nResto a disposizione per qualsiasi chiarimento.${firma}`
      },
      conferma: {
        oggetto: `Conferma ordine ${c.code} - ${azNome}`,
        corpo: `Gentile ${c.cliente} ${c.cognome || ""},\n\ncon la presente le confermiamo la ricezione dell'ordine per la commessa ${c.code}.\n\nMateriale ordinato al fornitore\nTempi di consegna stimati: 4-6 settimane\nCantiere: ${c.indirizzo || " - "}\n\nLa terremo aggiornata sullo stato di avanzamento della produzione.\n\nPer qualsiasi necessità non esiti a contattarci.${firma}`
      },
      montaggio: {
        oggetto: `Programmazione montaggio ${c.code} - ${azNome}`,
        corpo: `Gentile ${c.cliente} ${c.cognome || ""},\n\nsiamo lieti di comunicarle che il materiale per la commessa ${c.code} è arrivato.\n\nMontaggio previsto: [INSERIRE DATA]\nIndirizzo: ${c.indirizzo || " - "}\nDurata stimata: ${vani.length <= 3 ? "1 giorno" : vani.length <= 6 ? "2 giorni" : "3+ giorni"}\nSquadra: [NOME SQUADRA]\n\nNote per il giorno del montaggio:\n- Assicurarsi che i locali siano accessibili\n- Spostare eventuali mobili vicino alle finestre\n- Ãˆ possibile che si verifichi polvere durante lo smontaggio\n\nLa preghiamo di confermare la data rispondendo a questa mail.${firma}`
      },
      saldo: {
        oggetto: `Completamento lavori e saldo ${c.code} - ${azNome}`,
        corpo: `Gentile ${c.cliente} ${c.cognome || ""},\n\ncon la presente le comunichiamo che i lavori relativi alla commessa ${c.code} sono stati completati con successo.\n\nFornitura e posa completata\nVani installati: ${vani.length}\nCantiere: ${c.indirizzo || " - "}\n\nImporto totale: â‚¬${fmt(totIva)} (IVA ${ivaP}% inclusa)\n${(() => { const inc = fattureDB.filter(f => f.cmId === c.id && f.pagata).reduce((s,f)=>s+(f.importo||0),0); return inc > 0 ? `Già versato: â‚¬${fmt(inc)}\nSaldo dovuto: â‚¬${fmt(totIva - inc)}\n` : ""; })()}\nIn allegato:\n- Fattura di saldo\n- Dichiarazione di prestazione (DoP)\n- Certificazione CE\n- Manuale d'uso e manutenzione\n\nModalità di pagamento: Bonifico bancario\nIBAN: ${az.iban || "[IBAN]"}\n\nLa ringraziamo per la fiducia.${firma}`
      },
      generico: {
        oggetto: `Commessa ${c.code} - ${azNome}`,
        corpo: `Gentile ${c.cliente} ${c.cognome || ""},\n\n[Scrivi qui il messaggio]\n\nRif. commessa: ${c.code}\nCantiere: ${c.indirizzo || " - "}${firma}`
      }
    };
    const t = templates[tipo] || templates.generico;
    setEmailDest(c.email || "");
    setEmailOggetto(t.oggetto);
    setEmailCorpo(t.corpo);
    setShowEmailComposer({ cm: c, tipo });
  };

  // =============================================
  // === ORDINI FORNITORE - MODULO COMPLETO ===
  // =============================================

  const [ordineDetail, setOrdineDetail] = useState<string | null>(null); // id ordine aperto
  const [extractingPDF, setExtractingPDF] = useState(false); // loading AI extraction
  const [showInboxDoc, setShowInboxDoc] = useState(false); // global document inbox
  const [inboxResult, setInboxResult] = useState<any>(null); // extracted data from inbox
  // Onboarding wizard state (spostato fuori dalla IIFE per regola hooks)
  const [obNome, setObNome] = React.useState("");
  const [obRagione, setObRagione] = React.useState("");
  const [obPiva, setObPiva] = React.useState("");
  const [obTel, setObTel] = React.useState("");
  const [obEmail, setObEmail] = React.useState("");
  const [obIndirizzo, setObIndirizzo] = React.useState("");
  const [obSettori, setObSettori] = React.useState<string[]>(["serramenti"]);
  const [obPrezzoMq, setObPrezzoMq] = React.useState("350");
  const [obPosa, setObPosa] = React.useState("80");



  // Crea nuovo ordine fornitore da commessa
  const creaOrdineFornitore = (c, fornitoreNome = "") => {
    const vani = getVaniAttivi(c);
    // Auto-genera righe da vani commessa con prezzi
    const righe = vani.map(v => {
      const tipLabel = TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.label || v.tipo || " - ";
      const m = v.misure || {};
      const lmm = m.lCentro || 0, hmm = m.hCentro || 0;
      const prezzo = calcolaVanoPrezzo(v, c);
      return {
        id: "r_" + Math.random().toString(36).slice(2, 8),
        desc: `${tipLabel} - ${v.stanza || ""} ${v.piano || ""}`.trim(),
        misure: lmm > 0 && hmm > 0 ? `${lmm}Ã—${hmm}` : "da definire",
        qta: v.pezzi || 1,
        prezzoUnit: Math.round(prezzo * 100) / 100,
        totale: Math.round(prezzo * (v.pezzi || 1) * 100) / 100,
        note: v.coloreEst ? `Colore: ${v.coloreEst}` : "",
      };
    });

    const ord = {
      id: "ord_" + Date.now(),
      cmId: c.id,
      cmCode: c.code,
      cliente: c.cliente,
      numero: ordiniFornDB.filter(o => new Date(o.dataOrdine).getFullYear() === new Date().getFullYear()).length + 1,
      anno: new Date().getFullYear(),
      dataOrdine: new Date().toISOString().split("T")[0],
      fornitore: {
        nome: fornitoreNome,
        email: "",
        tel: "",
        piva: "",
        referente: "",
      },
      righe,
      totale: righe.reduce((s, r) => s + r.totale, 0),
      iva: 22, // IVA fornitore standard
      totaleIva: Math.round(righe.reduce((s, r) => s + r.totale, 0) * 1.22 * 100) / 100,
      sconto: 0,

      // STATO ORDINE
      stato: "bozza" as string, // bozza > inviato > confermato > in_produzione > spedito > consegnato

      // CONFERMA FORNITORE
      conferma: {
        ricevuta: false,
        dataRicezione: "",
        verificata: false, // MASTRO ha controllato
        differenze: "",    // note su differenze
        firmata: false,
        dataFirma: "",
        reinviata: false,
        dataReinvio: "",
      },

      // CONSEGNA
      consegna: {
        prevista: "",       // data prevista dal fornitore
        settimane: 0,       // settimane di produzione
        effettiva: "",      // data effettiva consegna
        luogo: c.indirizzo || "",
        note: "",
      },

      // PAGAMENTO
      pagamento: {
        termini: "30gg_fm" as string, // anticipato, 30gg_fm, 60gg_fm, 90gg_fm, ricevuta_merce
        scadenza: "",
        importo: 0,
        pagato: false,
        dataPagamento: "",
        metodo: "", // bonifico, assegno, riba
      },

      note: "",
    };

    setOrdiniFornDB(prev => [...prev, ord]);
    setFaseTo(c.id, "ordini"); // AUTO-ADVANCE: ordine creato > fase ordini
    return ord;
  };

  // Ricalcola totali ordine
  const ricalcolaOrdine = (ordId: string) => {
    setOrdiniFornDB(prev => prev.map(o => {
      if (o.id !== ordId) return o;
      const subtot = o.righe.reduce((s, r) => s + (r.qta * r.prezzoUnit), 0);
      const scontoVal = subtot * (o.sconto || 0) / 100;
      const imponibile = subtot - scontoVal;
      const ivaVal = imponibile * o.iva / 100;
      return { ...o, totale: imponibile, totaleIva: imponibile + ivaVal, pagamento: { ...o.pagamento, importo: imponibile + ivaVal } };
    }));
  };

  // Aggiorna campo ordine
  const updateOrdine = (ordId: string, path: string, value: any) => {
    setOrdiniFornDB(prev => prev.map(o => {
      if (o.id !== ordId) return o;
      const parts = path.split(".");
      const updated = { ...o };
      let current: any = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...current[parts[i]] };
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return updated;
    }));
  };

  // Calcola scadenza pagamento
  const calcolaScadenzaPagamento = (dataOrdine: string, termini: string) => {
    const d = new Date(dataOrdine);
    if (termini === "anticipato") return dataOrdine;
    if (termini === "ricevuta_merce") return ""; // da compilare alla consegna
    const days = termini === "30gg_fm" ? 30 : termini === "60gg_fm" ? 60 : termini === "90gg_fm" ? 90 : 30;
    // Fine mese + giorni
    const fm = new Date(d.getFullYear(), d.getMonth() + 1, 0); // fine mese ordine
    fm.setDate(fm.getDate() + days);
    return fm.toISOString().split("T")[0];
  };

  // Genera PDF ordine fornitore
  const generaOrdinePDF = (ord) => _generaOrdinePDF(ord, { aziendaInfo });
  const generaConfermaFirmataPDF = (ord) => _generaConfermaFirmataPDF(ord, { aziendaInfo });
  const inviaOrdineFornitore = (ord, mezzo: "email" | "whatsapp") => {
    const az = aziendaDB;
    if (mezzo === "email") {
      const subject = ord.conferma.firmata
        ? `Conferma ordine N.${ord.numero}/${ord.anno} - ${az.nome}`
        : `Ordine N.${ord.numero}/${ord.anno} - ${az.nome}`;
      const body = ord.conferma.firmata
        ? `Gentile ${ord.fornitore.referente || ord.fornitore.nome},\n\nconfermiamo l'ordine N.${ord.numero}/${ord.anno} per la commessa ${ord.cmCode} (${ord.cliente}).\n\nTotale: â‚¬${ord.totaleIva?.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\nConsegna prevista: ${ord.consegna.prevista ? new Date(ord.consegna.prevista).toLocaleDateString("it-IT") : "da concordare"}\nPagamento: ${ord.pagamento.termini}\n\nIn allegato la conferma firmata.\n\nCordiali saluti,\n${az.nome}`
        : `Gentile ${ord.fornitore.referente || ord.fornitore.nome},\n\ncon la presente vi trasmettiamo l'ordine N.${ord.numero}/${ord.anno} per la commessa ${ord.cmCode} (${ord.cliente}).\n\nRichiediamo conferma d'ordine con tempi di consegna e condizioni di pagamento.\n\nCordiali saluti,\n${az.nome}`;
      window.open(`mailto:${ord.fornitore.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    } else {
      const tel = (ord.fornitore.tel || "").replace(/\D/g, "");
      const msg = ord.conferma.firmata
        ? `Buongiorno, vi confermiamo ordine N.${ord.numero}/${ord.anno} - Commessa ${ord.cmCode} (${ord.cliente}). Totale â‚¬${ord.totaleIva?.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Consegna prevista: ${ord.consegna.prevista ? new Date(ord.consegna.prevista).toLocaleDateString("it-IT") : "da concordare"}. Vi inviamo conferma firmata via email. ${az.nome}`
        : `Buongiorno, vi invio ordine N.${ord.numero}/${ord.anno} - Commessa ${ord.cmCode} (${ord.cliente}). Attendo conferma d'ordine con tempi e condizioni. Grazie. ${az.nome}`;
      window.open(`https://wa.me/${tel.startsWith("39") ? tel : "39" + tel}?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  // Stati ordine con colori
  const ORDINE_STATI = [
    { id: "bozza", label: "Bozza", icon: "fileText", color: "#8e8e93" },
    { id: "inviato", label: "Inviato", icon: "send", color: "#0D7C6B" },
    { id: "confermato", label: "Confermato", icon: "checkCircle", color: "#1A9E73" },
    { id: "in_produzione", label: "In Produzione", icon: "factory", color: "#E8A020" },
    { id: "spedito", label: "Spedito", icon: "truck", color: "#8B5CF6" },
    { id: "consegnato", label: "Consegnato", icon: "package", color: "#30b0c7" },
  ];

  // === PIANIFICAZIONE MONTAGGIO ===
  const creaMontaggio = (c) => {
    const m = {
      id: "mont_" + Date.now(),
      cmId: c.id,
      cmCode: c.code,
      cliente: c.cliente,
      indirizzo: c.indirizzo || "",
      squadraId: squadreDB[0]?.id || "",
      data: "",
      oraInizio: "08:00",
      durata: "giornata", // "mezza", "giornata", "2giorni", "3giorni"
      stato: "pianificato", // pianificato, in_corso, completato
      note: "",
      vaniCount: getVaniAttivi(c).length,
    };
    setMontaggiDB(prev => [...prev, m]);
    return m;
  };

  // Genera giorni della settimana
  const getWeekDays = (offset: number) => {
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };

  // Render calendario montaggi (vista settimanale con squadre)
  const renderCalendarioMontaggi = (targetMontaggioId?: string) => {
    const days = getWeekDays(calMontaggiWeek);
    const durataGiorni = (d: string) => d === "mezza" ? 0.5 : d === "2giorni" ? 2 : d === "3giorni" ? 3 : 1;
    const isOccupied = (sq: any, day: Date) => {
      const dayStr = day.toISOString().split("T")[0];
      return montaggiDB.some(m => {
        if (m.squadraId !== sq.id || !m.data || m.stato === "completato") return false;
        const startDate = new Date(m.data);
        const numDays = durataGiorni(m.durata);
        for (let i = 0; i < Math.ceil(numDays); i++) {
          const d = new Date(startDate);
          d.setDate(startDate.getDate() + i);
          if (d.toISOString().split("T")[0] === dayStr) return m;
        }
        return false;
      });
    };
    const today = new Date().toISOString().split("T")[0];
    const isSunday = (d: Date) => d.getDay() === 0;

    return (
      <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
        {/* Header navigazione settimana */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: T.bg, borderBottom: `1px solid ${T.bdr}` }}>
          <div onClick={() => setCalMontaggiWeek(w => w - 1)} style={{ padding: "4px 10px", cursor: "pointer", fontSize: 16, fontWeight: 700, color: T.acc }}>â—€</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>
            {days[0].toLocaleDateString("it-IT", { day: "numeric", month: "short" })} - {days[6].toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div onClick={() => setCalMontaggiWeek(0)} style={{ padding: "3px 8px", borderRadius: 6, background: calMontaggiWeek === 0 ? T.acc : "transparent", color: calMontaggiWeek === 0 ? "#fff" : T.sub, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Oggi</div>
            <div onClick={() => setCalMontaggiWeek(w => w + 1)} style={{ padding: "4px 10px", cursor: "pointer", fontSize: 16, fontWeight: 700, color: T.acc }}>â–¶</div>
          </div>
        </div>

        {/* Griglia: header giorni */}
        <div style={{ display: "grid", gridTemplateColumns: `80px repeat(7, 1fr)`, fontSize: 9 }}>
          <div style={{ padding: "6px 4px", fontWeight: 700, color: T.sub, textAlign: "center", borderBottom: `1px solid ${T.bdr}`, borderRight: `1px solid ${T.bdr}` }}>Squadra</div>
          {days.map((d, i) => {
            const isToday = d.toISOString().split("T")[0] === today;
            const isSun = isSunday(d);
            return (
              <div key={i} style={{
                padding: "6px 2px", textAlign: "center", fontWeight: 700,
                color: isToday ? "#fff" : isSun ? T.red : T.text,
                background: isToday ? T.acc : isSun ? "#DC444410" : "transparent",
                borderBottom: `1px solid ${T.bdr}`,
                borderRight: i < 6 ? `1px solid ${T.bdr}` : "none",
              }}>
                <div>{["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"][i]}</div>
                <div style={{ fontSize: 12 }}>{d.getDate()}</div>
              </div>
            );
          })}

          {/* Righe squadre */}
          {squadreDB.map(sq => (
            <React.Fragment key={sq.id}>
              <div style={{ padding: "8px 6px", fontWeight: 700, fontSize: 10, color: sq.colore, borderRight: `1px solid ${T.bdr}`, borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: sq.colore, flexShrink: 0 }} />
                {sq.nome}
              </div>
              {days.map((d, i) => {
                const occ = isOccupied(sq, d);
                const dayStr = d.toISOString().split("T")[0];
                const isPast = dayStr < today;
                const isSun = isSunday(d);
                const canClick = !occ && !isPast && !isSun && targetMontaggioId;
                return (
                  <div key={i} onClick={() => {
                    if (canClick) {
                      setMontaggiDB(prev => prev.map(m => m.id === targetMontaggioId ? { ...m, data: dayStr, squadraId: sq.id } : m));
                    }
                  }} style={{
                    padding: "4px 3px", borderBottom: `1px solid ${T.bdr}`,
                    borderRight: i < 6 ? `1px solid ${T.bdr}` : "none",
                    background: occ ? sq.colore + "20" : isPast ? T.bg + "80" : isSun ? "#DC444405" : canClick ? "#1A9E7308" : "transparent",
                    cursor: canClick ? "pointer" : "default",
                    minHeight: 36, position: "relative" as any,
                  }}>
                    {occ && (
                      <div style={{ fontSize: 7, fontWeight: 700, color: sq.colore, lineHeight: 1.2 }}>
                        <div>{(occ as any).cliente?.slice(0, 8)}</div>
                        <div style={{ color: T.sub }}>{(occ as any).vaniCount}v Â· {(occ as any).durata === "mezza" ? "Â½" : (occ as any).durata === "2giorni" ? "2g" : (occ as any).durata === "3giorni" ? "3g" : "1g"}</div>
                      </div>
                    )}
                    {canClick && !occ && (
                      <div style={{ position: "absolute" as any, inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#1A9E7350" }}>+</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>

        {/* Legenda */}
        <div style={{ padding: "6px 12px", display: "flex", gap: 12, flexWrap: "wrap" as any, fontSize: 9, color: T.sub, borderTop: `1px solid ${T.bdr}` }}>
          {squadreDB.map(sq => (
            <span key={sq.id} style={{ display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: sq.colore }} />
              {sq.nome}: {montaggiDB.filter(m => m.squadraId === sq.id && m.stato !== "completato").length} in programma
            </span>
          ))}
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#E8A020" }} />
            Consegne: {ordiniFornDB.filter(o => o.dataConsegnaPrev && o.stato !== "consegnato").length} attese
          </span>
        </div>

        {/* Consegne fornitore nella settimana */}
        {(() => {
          const weekDeliveries = ordiniFornDB.filter(o => {
            if (!o.dataConsegnaPrev || o.stato === "consegnato") return false;
            const d = new Date(o.dataConsegnaPrev);
            return d >= days[0] && d <= days[6];
          });
          if (weekDeliveries.length === 0) return null;
          return (
            <div style={{ padding: "8px 12px", borderTop: `1px solid ${T.bdr}`, background: "#E8A02008" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#E8A020", marginBottom: 4 }}><I d={ICO.truck} s={9} c="#E8A020" /> Consegne questa settimana:</div>
              {weekDeliveries.map(o => {
                const cm = cantieri.find(cc => cc.id === o.cmId);
                const isLate = new Date(o.dataConsegnaPrev) < new Date();
                return (
                  <div key={o.id} style={{ fontSize: 10, color: isLate ? T.red : T.text, padding: "2px 0", display: "flex", gap: 8 }}>
                    <span style={{ fontWeight: 700, width: 30, color: "#E8A020" }}>{new Date(o.dataConsegnaPrev).toLocaleDateString("it-IT", { weekday: "short" })}</span>
                    <span style={{ fontWeight: 600 }}>{typeof o.fornitore === "object" ? (o.fornitore?.nome || "") : o.fornitore}</span>
                    <span style={{ color: T.sub }}> > {cm?.cliente || o.cmId}</span>
                    {o.costo > 0 && <span style={{ color: T.sub }}>â‚¬{o.costo.toLocaleString("it-IT")}</span>}
                    {isLate && <span style={{ color: T.red, fontWeight: 700 }}><I d={ICO.alertTriangle} />ï¸ RITARDO</span>}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  };

  // Preventivo condivisibile (estratto in lib/pdf-condivisibile.ts)
  const generaPreventivoCondivisibile = async (c) => _generaPrevCond(c, { aziendaInfo, calcolaVanoPrezzo, getVaniAttivi });
  // === UPLOAD CONFERMA FORNITORE (Supabase Storage + AI Extraction) ===
  const uploadConfermaFornitore = (ordId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // 1. Upload a Supabase Storage
      const fileName = `conferma_${ordId}_${Date.now()}_${file.name}`;
      let fileUrl = "";
      try {
        const { data: uploadData, error } = await supabase.storage
          .from("conferme-fornitore")
          .upload(`docs/${fileName}`, file, { contentType: file.type, upsert: true });
        if (!error && uploadData) {
          const { data: urlData } = supabase.storage.from("conferme-fornitore").getPublicUrl(`docs/${fileName}`);
          fileUrl = urlData?.publicUrl || "";
        }
      } catch (err) { console.warn("Upload Supabase fallito:", err); }

      // 2. AI Extraction - funziona con PDF, immagini, scansioni
      let extractedData: any = {};
      setExtractingPDF(true);
      try {
        extractedData = await estraiDatiPDF(file);
      } catch (err) { console.warn("Estrazione:", err); }
      setExtractingPDF(false);

      // 3. Aggiorna ordine con allegato + dati estratti
      setOrdiniFornDB(prev => prev.map(o => {
        if (o.id !== ordId) return o;
        const updated = {
          ...o,
          conferma: {
            ...o.conferma,
            ricevuta: true,
            dataRicezione: new Date().toISOString().split("T")[0],
            nomeFile: file.name,
            fileUrl: fileUrl,
            datiEstratti: extractedData, // salva tutto per riferimento
          },
          stato: o.stato === "bozza" || o.stato === "inviato" ? "confermato" : o.stato,
        };
        // Auto-fill dati estratti
        if (extractedData.totale) updated.totaleIva = extractedData.totale;
        if (extractedData.imponibile) updated.totale = extractedData.imponibile;
        if (extractedData.settimane) updated.consegna = { ...updated.consegna, settimane: extractedData.settimane };
        if (extractedData.dataConsegna) updated.consegna = { ...updated.consegna, prevista: extractedData.dataConsegna };
        if (extractedData.pagamento) updated.pagamento = { ...updated.pagamento, termini: extractedData.pagamento };
        if (extractedData.fornitoreNome && !o.fornitore?.nome) updated.fornitore = { ...updated.fornitore, nome: extractedData.fornitoreNome };
        if (extractedData.numeroOrdine) updated.numero = extractedData.numeroOrdine;
        // Auto-fill righe se estratte dall'AI
        if (extractedData.righe?.length > 0 && (!o.righe || o.righe.length === 0)) {
          updated.righe = extractedData.righe.map((r: any, i: number) => ({
            id: Date.now() + i,
            desc: r.descrizione || "",
            misure: r.misure || "",
            qta: r.quantita || 1,
            prezzoUnit: r.prezzo_unitario || 0,
            totale: r.prezzo_totale || (r.prezzo_unitario || 0) * (r.quantita || 1),
            note: "",
          }));
        }
        return updated;
      }));
    };
    input.click();
  };

  // AI PDF extraction (estratto in lib/pdf-condivisibile.ts)
  const estraiDatiPDF = async (file: File): Promise<any> => _estraiDatiPDF(file);
  // === <I d={ICO.download} /> INBOX UNIVERSALE - Classifica qualsiasi documento ===
  const apriInboxDocumento = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,image/*,.jpg,.jpeg,.png";
    input.onchange = async (ev: any) => {
      const file = ev.target.files?.[0];
      if (!file) return;
      setShowInboxDoc(true);
      setInboxResult({ stato: "caricamento", file: file.name, tipo: file.type });

      let fileUrl = "";
      let extractedData: any = {};

      try {
        // Crea URL locale per il file (funziona sempre, anche offline)
        try { fileUrl = URL.createObjectURL(file); } catch(e) {}
        
        // Prova upload Supabase (se disponibile)
        try {
          if (typeof supabase !== "undefined" && supabase?.storage) {
            const fileName = "inbox_" + Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const result: any = await Promise.race([
              supabase.storage.from("conferme-fornitore").upload("docs/" + fileName, file, { contentType: file.type, upsert: true }),
              new Promise((_, rej) => setTimeout(() => rej("timeout"), 3000)),
            ]).catch(() => null);
            if (result && !result.error) {
              const { data: urlData } = supabase.storage.from("conferme-fornitore").getPublicUrl("docs/" + fileName);
              if (urlData?.publicUrl) fileUrl = urlData.publicUrl;
            }
          }
        } catch (err) { /* skip - local URL works fine */ }

        setInboxResult((prev: any) => ({ ...prev, stato: "analisi" }));
        
        // Estrai dati dal file (max 4 secondi)
        try {
          extractedData = await Promise.race([
            estraiDatiPDF(file),
            new Promise((_, rej) => setTimeout(() => rej("timeout"), 4000)),
          ]).catch(() => ({ nomeFile: file.name }));
        } catch (err) { extractedData = { nomeFile: file.name }; }
      } catch (err) { console.warn("Inbox error:", err); extractedData = { nomeFile: file.name }; }

      // === CLASSIFICAZIONE UNIVERSALE ===
      const fname = file.name.toLowerCase();
      const dati = extractedData;
      let docTipo: string = "sconosciuto"; // firma | conferma | fattura | ricevuta | foto
      let matchedCommessa: any = null;
      let matchedOrdine: any = null;
      let confidence = 0;

      // 1. Detect tipo from filename + content
      if (fname.includes("firmato") || fname.includes("firma") || fname.includes("signed") || dati.text?.match(/firmato|firma.*cliente|approvato/i)) {
        docTipo = "firma"; confidence = 90;
      } else if (fname.includes("conferma") || fname.includes("order_confirm") || dati.fornitoreNome || dati.settimane) {
        docTipo = "conferma"; confidence = 85;
      } else if (fname.includes("fattura") || fname.includes("invoice") || dati.text?.match(/fattura\s*(n\.?|numero)/i)) {
        docTipo = "fattura"; confidence = 85;
      } else if (fname.includes("bonifico") || fname.includes("ricevuta") || fname.includes("pagamento") || dati.text?.match(/bonifico|accredito|pagamento/i)) {
        docTipo = "ricevuta"; confidence = 80;
      } else if (file.type.startsWith("image/") && !dati.fornitoreNome && !dati.totale) {
        docTipo = "foto"; confidence = 60;
      } else if (dati.fornitoreNome || dati.settimane) {
        docTipo = "conferma"; confidence = 70;
      } else if (dati.totale > 0) {
        docTipo = "fattura"; confidence = 50;
      }

      // 2. Match to commessa/ordine
      const ordiniAttivi = ordiniFornDB.filter(o => !o.conferma?.ricevuta);
      
      if (docTipo === "conferma") {
        // Match conferma to ordine fornitore
        if (dati.fornitoreNome) {
          matchedOrdine = ordiniAttivi.find(o =>
            (o.fornitore?.nome || "").toLowerCase().includes(dati.fornitoreNome.toLowerCase()) ||
            dati.fornitoreNome.toLowerCase().includes((o.fornitore?.nome || "").toLowerCase())
          );
        }
        if (!matchedOrdine && dati.totale) {
          matchedOrdine = ordiniAttivi.find(o => Math.abs((o.totaleIva || o.totale || 0) - dati.totale) < 100);
        }
        if (!matchedOrdine && ordiniAttivi.length === 1) matchedOrdine = ordiniAttivi[0];
        if (matchedOrdine) matchedCommessa = cantieri.find(cm => cm.id === matchedOrdine.cmId);
      } else if (docTipo === "firma") {
        // Match firma to commessa in attesa firma
        const cmInAttesaFirma = cantieri.filter(cm => !cm.firmaCliente && cm.rilievi?.length > 0);
        // Try match by client name in filename
        for (const cm of cmInAttesaFirma) {
          const cliName = `${cm.cliente} ${cm.cognome || ""}`.toLowerCase();
          if (fname.includes(cm.cliente.toLowerCase()) || fname.includes((cm.cognome || "").toLowerCase()) || fname.includes(cm.code.toLowerCase())) {
            matchedCommessa = cm; confidence = 95; break;
          }
        }
        if (!matchedCommessa && cmInAttesaFirma.length === 1) { matchedCommessa = cmInAttesaFirma[0]; confidence = 75; }
        if (!matchedCommessa && cmInAttesaFirma.length > 0) { matchedCommessa = null; } // ambiguous - will show options
      } else if (docTipo === "ricevuta") {
        // Match ricevuta to fattura non pagata
        const fatNonPagate = fattureDB.filter(f => !f.pagata);
        if (dati.totale) {
          const match = fatNonPagate.find(f => Math.abs(f.importo - dati.totale) < 10);
          if (match) matchedCommessa = cantieri.find(cm => cm.id === match.cmId);
        }
        if (!matchedCommessa && fatNonPagate.length === 1) {
          matchedCommessa = cantieri.find(cm => cm.id === fatNonPagate[0].cmId);
        }
      } else if (docTipo === "foto") {
        // Match foto to montaggio in corso
        const montInCorso = montaggiDB.filter(m => m.stato === "in_corso" || m.stato === "programmato");
        if (montInCorso.length === 1) matchedCommessa = cantieri.find(cm => cm.id === montInCorso[0].cmId);
      }

      // All commesse for manual selection
      const commesseAttive = cantieri.filter(cm => cm.fase !== "chiusura");

      setInboxResult({
        stato: "completato", file: file.name, tipo: file.type, fileUrl,
        dati: extractedData, docTipo, confidence,
        matchedOrdine, matchedCommessa, tuttiOrdini: ordiniAttivi, commesseAttive,
      });
    };
    input.click();
  };

  // Conferma inbox > assegna a ordine
  const confermaInboxDoc = (ordId: string) => {
    const res = inboxResult;
    if (!res || !ordId) return;
    setOrdiniFornDB(prev => prev.map(o => {
      if (o.id !== ordId) return o;
      const updated = {
        ...o,
        conferma: {
          ...o.conferma,
          ricevuta: true,
          dataRicezione: new Date().toISOString().split("T")[0],
          nomeFile: res.file,
          fileUrl: res.fileUrl || "",
          datiEstratti: res.dati,
        },
        stato: o.stato === "bozza" || o.stato === "inviato" ? "confermato" : o.stato,
      };
      if (res.dati?.totale) updated.totaleIva = res.dati.totale;
      if (res.dati?.imponibile) updated.totale = res.dati.imponibile;
      if (res.dati?.settimane) updated.consegna = { ...updated.consegna, settimane: res.dati.settimane };
      if (res.dati?.dataConsegna) updated.consegna = { ...updated.consegna, prevista: res.dati.dataConsegna };
      if (res.dati?.pagamento) updated.pagamento = { ...updated.pagamento, termini: res.dati.pagamento };
      if (res.dati?.righe?.length > 0 && (!o.righe || o.righe.length === 0)) {
        updated.righe = res.dati.righe.map((r: any, i: number) => ({
          id: Date.now() + i, desc: r.descrizione || "", misure: r.misure || "",
          qta: r.quantita || 1, prezzoUnit: r.prezzo_unitario || 0,
          totale: r.prezzo_totale || 0, note: "",
        }));
      }
      return updated;
    }));
    // Auto-advance commessa
    const ord = ordiniFornDB.find(o => o.id === ordId);
    if (ord?.cmId) setFaseTo(ord.cmId, "produzione");
    setShowInboxDoc(false);
    setInboxResult(null);
  };

  // Assegna documento universale a commessa/step
  const assegnaDocUniversale = (cmId: number, tipo: string) => {
    const res = inboxResult;
    if (!res) return;
    const allegato = { id: Date.now(), tipo, nome: res.file, data: new Date().toLocaleDateString("it-IT"), dataUrl: res.fileUrl || "" };
    
    if (tipo === "firma") {
      setCantieri(cs => cs.map(cm => cm.id === cmId ? {
        ...cm, firmaCliente: true, dataFirma: new Date().toISOString().split("T")[0],
        firmaDocumento: allegato, allegati: [...(cm.allegati || []), allegato],
        log: [{ chi: "Fabio", cosa: `documento firmato caricato da inbox`, quando: "Adesso", color: "#1A9E73" }, ...(cm.log || [])]
      } : cm));
      if (selectedCM?.id === cmId) setSelectedCM(prev => ({ ...prev, firmaCliente: true, dataFirma: new Date().toISOString().split("T")[0] }));
    } else if (tipo === "ricevuta") {
      // Segna fattura come pagata
      const fatNonPagata = fattureDB.find(f => f.cmId === cmId && !f.pagata);
      if (fatNonPagata) {
        setFattureDB(prev => prev.map(f => f.id === fatNonPagata.id ? { ...f, pagata: true, dataPagamento: new Date().toISOString().split("T")[0], metodoPagamento: "Bonifico" } : f));
      }
      setCantieri(cs => cs.map(cm => cm.id === cmId ? {
        ...cm, allegati: [...(cm.allegati || []), allegato],
        log: [{ chi: "Fabio", cosa: `ricevuta pagamento caricata da inbox`, quando: "Adesso", color: "#0D7C6B" }, ...(cm.log || [])]
      } : cm));
    } else if (tipo === "foto") {
      setCantieri(cs => cs.map(cm => cm.id === cmId ? {
        ...cm, allegati: [...(cm.allegati || []), allegato],
        log: [{ chi: "Fabio", cosa: `foto cantiere caricata da inbox`, quando: "Adesso", color: "#8B5CF6" }, ...(cm.log || [])]
      } : cm));
    } else {
      // Generic: just add as allegato
      setCantieri(cs => cs.map(cm => cm.id === cmId ? {
        ...cm, allegati: [...(cm.allegati || []), allegato],
        log: [{ chi: "Fabio", cosa: `documento "${res.file}" caricato da inbox`, quando: "Adesso", color: "#86868b" }, ...(cm.log || [])]
      } : cm));
    }
    
    setShowInboxDoc(false); setInboxResult(null);
  };

  // === TRACKING CLIENTE (pagina pubblica) ===
  const generaTrackingCliente = (c) => _generaTrackingCliente(c, { aziendaInfo, fattureDB, montaggiDB });
  const generaXmlSDI = (fat) => _generaXmlSDI(fat, { aziendaInfo });

  const _aiVt = selectedVano?.tipo || "F1A";
  const _aiSizes: Record<string, [number, number]> = {
    "F1A": [700, 1200], "F2A": [1200, 1400], "F3A": [1800, 1400],
    "PF1A": [800, 2200], "PF2A": [1400, 2200], "PF3A": [2100, 2200],
    "VAS": [700, 500], "SOPR": [800, 400], "FIS": [600, 1000], "FISTONDO": [600, 600],
    "SC2A": [1600, 2200], "SC4A": [2800, 2200], "ALZSC": [3000, 2200],
    "BLI": [900, 2100], "TRIANG": [800, 800], "OBLICA": [700, 1200]
  };
  const [_aiStdW, _aiStdH] = _aiSizes[_aiVt] || [1100, 1300];
  const _aiEx = (selectedVano?.misure || {}) as any;
  const _aiBaseW = (_aiEx.lCentro ?? 0) > 0 ? (_aiEx.lCentro + Math.floor(Math.random() * 7 - 3)) : (_aiStdW + Math.floor(Math.random() * 11 - 5));
  const _aiBaseH = (_aiEx.hCentro ?? 0) > 0 ? (_aiEx.hCentro + Math.floor(Math.random() * 7 - 3)) : (_aiStdH + Math.floor(Math.random() * 11 - 5));
  const _aiTip = TIPOLOGIE_RAPIDE.find(t => t.code === _aiVt)?.label || _aiVt;



  // === CTX - condivide tutto con i componenti estratti ===
  //  IS STORICO - rilievo vecchio = sola lettura 
  const lastRilievoGlobal = selectedCM?.rilievi?.length > 0 ? selectedCM.rilievi[selectedCM.rilievi.length - 1] : null;
  const isStorico = selectedRilievo && lastRilievoGlobal && selectedRilievo.id !== lastRilievoGlobal.id;

  const ctx = {
    T, S, theme, setTheme, isDesktop, isTablet, fs, PIPELINE, tipologieFiltrate,
    tab, setTab, subPlan, setSubPlan, showPaywall, setShowPaywall,
    homeEditMode, setHomeEditMode, dayOffset, setDayOffset,
    ioChecked, setIoChecked, collapsed, setCollapsed,
    lastOpenedCMId, setLastOpenedCMId, cmSubTab, setCmSubTab,
    nvView, setNvView, nvStep, setNvStep, nvData, setNvData,
    nvTipo, setNvTipo, nvMotivoModifica, setNvMotivoModifica,
    nvVani, setNvVani, nvBlocchi, setNvBlocchi, nvNote, setNvNote,
    expandedDay, setExpandedDay,
    cantieri, setCantieri, tasks, setTasks, msgs, setMsgs,
    selectedMsg, setSelectedMsg, replyText, setReplyText,
    problemi, setProblemi, showProblemaModal, setShowProblemaModal,
    selectedProblema, setSelectedProblema, problemaForm, setProblemaForm,
    showProblemiView, setShowProblemiView,
    team, setTeam, coloriDB, setColoriDB, sistemiDB, setSistemiDB,
    vetriDB, setVetriDB, coprifiliDB, setCoprifiliDB,
    lamiereDB, setLamiereDB, libreriaDB, setLibreriaDB,
    tapparelleListino, setTapparelleListino, persianeListino, setPersianeListino,
    zanzariereListino, setZanzariereListino, tendeListino, setTendeListino, pergoleListino, setPergoleListino,
    telaiPersianaDB, setTelaiPersianaDB, posPersianaDB, setPosPersianaDB,
    tipoMisuraDB, setTipoMisuraDB, tipoMisuraTappDB, setTipoMisuraTappDB,
    tipoMisuraZanzDB, setTipoMisuraZanzDB, tipoCassonettoDB, setTipoCassonettoDB,
    ctProfDB, setCtProfDB, ctSezioniDB, setCtSezioniDB,
    ctCieliniDB, setCtCieliniDB, ctOffset, setCtOffset,
    pipelineDB, setPipelineDB, faseOpen, setFaseOpen,
    sogliaDays, setSogliaDays, showFirmaModal, setShowFirmaModal,
    firmaDrawing, setFirmaDrawing, firmaDataUrl, setFirmaDataUrl,
    showPreventivoModal, setShowPreventivoModal,
    favTipologie, setFavTipologie, fattureDB, setFattureDB,
    fatturePassive, setFatturePassive, showFatturaPassiva, setShowFatturaPassiva,
    newFattPassiva, setNewFattPassiva, showContabilita, setShowContabilita,
    contabTab, setContabTab, contabMese, setContabMese,
    showCronologia, setShowCronologia, kitAccessori, setKitAccessori,
    fornitori, setFornitori, showFornitoreDetail, setShowFornitoreDetail,
    showFornitoreForm, setShowFornitoreForm, fornitoreEdit, setFornitoreEdit,
    customThemes, setCustomThemes, voiceActive, setVoiceActive,
    voiceTranscript, setVoiceTranscript, ordiniFornDB, setOrdiniFornDB,
    showFatturaModal, setShowFatturaModal, fatturaEdit, setFatturaEdit,
    squadreDB, setSquadreDB, montaggiDB, setMontaggiDB,
    settoriAttivi, setSettoriAttivi, showOnboarding, setShowOnboarding,
    showStrutture, setShowStrutture,
    pianoAttivo, setPianoAttivo,
    calMontaggiWeek, setCalMontaggiWeek, showCalMontaggi, setShowCalMontaggi,
    calMontaggiTarget, setCalMontaggiTarget,
    montFormOpen, setMontFormOpen, montFormData, setMontFormData,
    ccConfirm, setCcConfirm, ccDone, setCcDone,
    firmaStep, setFirmaStep, firmaFileUrl, setFirmaFileUrl,
    firmaFileName, setFirmaFileName, fattPerc, setFattPerc,
    voceTempDesc, setVoceTempDesc, voceTempImporto, setVoceTempImporto, voceTempQta, setVoceTempQta,
    prevWorkspace, setPrevWorkspace, prevTab, setPrevTab,
    editingVanoId, setEditingVanoId,
    drawingVanoId, setDrawingVanoId,
    sistemiDB, coloriDB, vetriDB,
    montGiorni, setMontGiorni, docViewer, setDocViewer,
    ccExpandStep, setCcExpandStep, confSett, setConfSett,
    selectedCM, setSelectedCM, selectedRilievo, setSelectedRilievo, isStorico,
    showNuovoRilievo, setShowNuovoRilievo, nuovoRilTipo, setNuovoRilTipo,
    nuovoRilData, setNuovoRilData, selectedVano, setSelectedVano,
    filterFase, setFilterFase, searchQ, setSearchQ,
    showModal, setShowModal, settingsTab, setSettingsTab,
    expandedPipelinePhase, setExpandedPipelinePhase,
    pipelinePhaseTab, setPipelinePhaseTab,
    showRiepilogo, setShowRiepilogo, riepilogoSending, setRiepilogoSending,
    tutoStep, setTutoStep, aziendaInfo, setAziendaInfo,
    aiChat, setAiChat, aiInput, setAiInput, aiMsgs, setAiMsgs,
    showSendModal, setShowSendModal, sendOpts, setSendOpts,
    sendConfirm, setSendConfirm, vanoStep, setVanoStep,
    spDrawing, setSpDrawing, agendaView, setAgendaView,
    agendaFilters, setAgendaFilters, homeExpand, setHomeExpand,
    homeView, setHomeView, montView, setMontView,
    montExpandId, setMontExpandId, montCalDate, setMontCalDate,
    dossierTab, setDossierTab, cmFaseIdx, setCmFaseIdx,
    cmView, setCmView, fasePanelOpen, setFasePanelOpen,
    catIdx, setCatIdx, selDate, setSelDate,
    showNewEvent, setShowNewEvent, selectedEvent, setSelectedEvent,
    selectedTask, setSelectedTask, showMailModal, setShowMailModal,
    showEmailComposer, setShowEmailComposer,
    emailDest, setEmailDest, emailOggetto, setEmailOggetto,
    emailCorpo, setEmailCorpo, mailBody, setMailBody,
    newEvent, setNewEvent, events, setEvents,
    faseNotif, setFaseNotif, showAIPhoto, setShowAIPhoto,
    aiPhotoStep, setAiPhotoStep, settingsModal, setSettingsModal,
    importStatus, setImportStatus, importLog, setImportLog, importExcelCatalog,
    settingsForm, setSettingsForm, showAllegatiModal, setShowAllegatiModal,
    allegatiText, setAllegatiText, isRecording, setIsRecording,
    recSeconds, setRecSeconds, playingId, setPlayingId,
    playProgress, setPlayProgress, viewingVideoId, setViewingVideoId,
    viewingPhotoId, setViewingPhotoId, showCameraModal, setShowCameraModal,
    cameraMode, setCameraMode, pendingFotoCat, setPendingFotoCat,
    isDrawing, setIsDrawing, drawTool, setDrawTool,
    drawPages, setDrawPages, drawPageIdx, setDrawPageIdx,
    drawFullscreen, setDrawFullscreen, penColor, setPenColor,
    penSize, setPenSize, drawPaths, setDrawPaths,
    newTask, setNewTask, taskAllegati, setTaskAllegati,
    msgFilter, setMsgFilter, msgSearch, setMsgSearch,
    showCompose, setShowCompose, composeMsg, setComposeMsg,
    fabOpen, setFabOpen, contatti, setContatti,
    msgSubTab, setMsgSubTab, aiInbox, setAiInbox,
    selectedAiMsg, setSelectedAiMsg,
    gmailStatus, setGmailStatus, gmailMessages, setGmailMessages,
    gmailLoading, setGmailLoading, gmailNextPage, setGmailNextPage,
    gmailSelected, setGmailSelected, gmailReply, setGmailReply,
    gmailSending, setGmailSending, gmailSearch, setGmailSearch,
    rubricaSearch, setRubricaSearch, rubricaFilter, setRubricaFilter,
    globalSearch, setGlobalSearch, newCM, setNewCM,
    ripSearch, setRipSearch, ripCMSel, setRipCMSel,
    ripProblema, setRipProblema, ripFotos, setRipFotos,
    ripUrgenza, setRipUrgenza, vanoInfoOpen, setVanoInfoOpen,
    tipCat, setTipCat, newVano, setNewVano,
    customPiani, setCustomPiani, mezziSalita, setMezziSalita,
    showAddPiano, setShowAddPiano, newPiano, setNewPiano,
    winW, setWinW,
    // Helpers
    canDo, closeTuto, nextTuto, parseDataCM, giorniFermaCM,
    goBack, getVaniCM, getVaniAttivi,
    calcolaVanoPrezzo, calcolaTotaleCommessa, countVani,
    urgentCount, readyCount, faseIndex, priColor,
    toggleTask, addTask, addCommessa, addVano,
    updateMisura, updateMisureBatch, toggleAccessorio, updateAccessorio,
    updateVanoField, deleteTask, deleteVano, deleteCommessa,
    deleteEvent, deleteMsg, addAllegato, playAllegato,
    stopAllMedia, stopMediaRecording, compressImage,
    startCameraVideoRec, stopCameraVideoRec, closeCamera,
    addSettingsItem, deleteSettingsItem, advanceFase, setFaseTo,
    addEvent, convertEvent, linkEventToCM, creaFatturaPassiva,
    startVoice, stopVoice, sendCommessa, handleAI, exportPDF, apriInboxDocumento, gmailFetchMessages, gmailSendReply, gmailMatchCommessa,
    // Sub-components
    PipelineBar, VanoSVG, toggleCollapse, SectionHead, caricaDemoCompleto, renderCalendarioMontaggi,
    spCanvasRef, canvasRef, fotoVanoRef, videoVanoRef, openCamera, fileInputRef, fotoInputRef, ripFotoRef, firmaRef,
    // Refs/computed
    filtered, calDays, today, confirm, toast, exportAllData, formErrors, setFormErrors, FormErrors, FieldError,
    // Business logic functions
    generaPreventivoPDF, generaPDFMisure, creaFattura, generaFatturaPDF, inviaWhatsApp, inviaEmail, creaOrdineFornitore, ricalcolaOrdine, updateOrdine, calcolaScadenzaPagamento, generaOrdinePDF, generaConfermaFirmataPDF, inviaOrdineFornitore, creaMontaggio, getWeekDays, generaPreventivoCondivisibile, uploadConfermaFornitore, estraiDatiPDF, confermaInboxDoc, assegnaDocUniversale, generaTrackingCliente, generaXmlSDI, nextNumFattura,
 ORDINE_STATI, activePlan, trialDaysLeft, drag,
    clientiSearch, setClientiSearch, clientiFilter, setClientiFilter,
    selectedCliente, setSelectedCliente,
    showNewCliente, setShowNewCliente, newCliente, setNewCliente,
  };


  /* ======= MAIN RENDER ======= */

  //  DESKTOP SHELL 
  if (isDesktop) {
    return (
      <MastroContext.Provider value={ctx}>
        <>
          <style>{`
            * { box-sizing: border-box; }
            body { margin: 0; }
            input, select, textarea, button { font-size: inherit; }
            ::-webkit-scrollbar { width: 4px; height: 4px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #DCDCD7; border-radius: 2px; }
          `}</style>
          <MastroDesktop />
          {/* Ordini Fornitori — overlay sopra MastroDesktop quando tab = ordini_fornitori */}
          {tab === "ordini_fornitori" && <div style={{position:"fixed",inset:0,zIndex:200,background:"#F8FAFA"}}><OrdiniFornitori onBack={() => setTab("home")} /></div>}
        </>
      </MastroContext.Provider>
    );
  }

  return (
    <MastroContext.Provider value={ctx}>
    <>
      <div style={S.app}>
        {/* Content */}
        {tab === "home" && !selectedCM && !selectedMsg && <PanelErrorBoundary name="Home">{renderHome()}</PanelErrorBoundary>}
        {tab === "commesse" && <PanelErrorBoundary name="Commesse">{renderCommesse()}</PanelErrorBoundary>}
        {selectedVano && tab === "commesse" && <div style={{position:"fixed",inset:0,zIndex:200,background:"#F2F1EC",overflow:"auto"}}><PanelErrorBoundary name="VanoDetail">{renderVanoDetail()}</PanelErrorBoundary></div>}
        {tab === "clienti" && <PanelErrorBoundary name="Clienti">{renderClienti()}</PanelErrorBoundary>}
        {tab === "messaggi" && !selectedMsg && <PanelErrorBoundary name="Messaggi">{renderMessaggi()}</PanelErrorBoundary>}

        {tab === "agenda" && <PanelErrorBoundary name="Agenda">{renderAgenda()}</PanelErrorBoundary>}
        {tab === "contabilita" && <PanelErrorBoundary name="Contabilita">{renderContabilita()}</PanelErrorBoundary>}
        {tab === "montaggi_cal" && <PanelErrorBoundary name="Cantiere">{(() => {
          // === CENTRO OPERATIVO CANTIERE ===
          const today = new Date().toISOString().split("T")[0];
          const todayDate = new Date();
          
          // Collect ALL tasks from commesse assignments + standalone tasks
          const tuttiCompiti: any[] = [];
          cantieri.forEach((cm: any) => {
            Object.entries(cm.assegnazioni || {}).forEach(([faseId, ass]: [string, any]) => {
              if (ass.persona) {
                tuttiCompiti.push({
                  id: cm.id + "-" + faseId, persona: ass.persona, tipo: faseId,
                  descrizione: (PIPELINE.find(p => p.id === faseId)?.nome || faseId) + " - " + (cm.cliente || cm.titolo || cm.code || ""),
                  stato: ass.stato || "da_fare", scadenza: ass.scadenza || "", note: ass.note || "",
                  commessaId: cm.id, commessa: cm, color: PIPELINE.find(p => p.id === faseId)?.color || T.acc,
                  data: ass.scadenza || "", ora: ass.ora || "",
                });
              }
            });
          });
          tasks.forEach((t: any) => {
            if (t.persona) {
              tuttiCompiti.push({
                id: t.id, persona: t.persona, tipo: t.tipo || "task",
                descrizione: t.text || t.descrizione || "",
                stato: t.done ? "completato" : "da_fare", scadenza: t.date || "", notes: t.meta || "",
                commessaId: "", commessa: null,
                color: t.priority === "alta" ? T.red : t.priority === "media" ? T.orange : T.acc,
                data: t.date || "", ora: t.time || "",
              });
            }
          });
          const eventsAsCompiti = (events || []).map((ev: any) => ({
            id: "ev-" + ev.id, persona: ev.persona || "", tipo: ev.tipo || "evento",
            descrizione: ev.text || "", stato: "evento", scadenza: "", notes: "",
            commessaId: "", commessa: ev.cm ? cantieri.find((c:any) => c.code === ev.cm) : null,
            color: tipoEvColor(ev.tipo || "sopralluogo"), data: ev.date || "", ora: ev.time || "",
            _isEvent: true, _event: ev,
          }));
          const allItems = [...tuttiCompiti, ...eventsAsCompiti];

          const compitiPersona = (nome: string) => tuttiCompiti.filter(c => c.persona === nome || c.persona === "sq:" + nome);
          const itemsForDay = (dayStr: string) => allItems.filter(c => c.data === dayStr || c.scadenza === dayStr);
          const compitiOggi = tuttiCompiti.filter(c => c.data === today || c.scadenza === today);
          const compitiScaduti = tuttiCompiti.filter(c => c.scadenza && c.scadenza < today && c.stato !== "completato");
          const compitiInCorso = tuttiCompiti.filter(c => c.stato === "in_corso");
          const eventiOggi = eventsAsCompiti.filter(c => c.data === today);
          const compitiDomani = allItems.filter(c => { const d = new Date(); d.setDate(d.getDate()+1); return c.data === d.toISOString().split("T")[0]; });

          const [calDate, setCalDate] = [calDateCO, setCalDateCO];

          const getWeekDaysFrom = (d: Date) => {
            const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const mon = new Date(new Date(d).setDate(diff));
            return Array.from({length: 7}, (_, i) => { const dd = new Date(mon); dd.setDate(mon.getDate() + i); return dd; });
          };
          const weekDays = getWeekDaysFrom(calDate);
          const calMonth = calDate.getMonth();
          const calYear = calDate.getFullYear();
          const monthDays: Date[] = [];
          const firstOfMonth = new Date(calYear, calMonth, 1);
          const startDay = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;
          for (let i = -startDay; i < 42 - startDay; i++) {
            const d = new Date(calYear, calMonth, 1 + i);
            monthDays.push(d);
          }

          const filterItems = (items: any[]) => teamFilterPerson ? items.filter(c => c.persona === teamFilterPerson) : items;
          const statoColors: Record<string,string> = { completato: T.grn, in_corso: T.blue || "#3B7FE0", da_fare: T.orange || "#E8A020", bloccato: T.red, evento: "#8B5CF6" };
          const tipoEmoji: Record<string,string> = { Sopralluogo: "S", Misure: "M", Preventivo: "P", Montaggio: "Mt", Collaudo: "Co", Consegna: "Cn", Acquisti: "Ac", Ufficio: "Uf", sopralluogo: "S", montaggio: "Mt", consegna: "Cn", misure: "M", task: "T", evento: "Ev" };

          const navigateDay = (offset: number) => setCalDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + offset); return d; });
          const navigateWeek = (offset: number) => setCalDate(prev => { const d = new Date(prev); d.setDate(d.getDate() + offset * 7); return d; });
          const navigateMonth = (offset: number) => setCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
          const goToday = () => setCalDate(new Date());
          const isToday = (d: Date) => d.toISOString().split("T")[0] === today;
          const selectedDayStr = calDate.toISOString().split("T")[0];

          const quickComplete = (c: any) => {
            if (c._isEvent) return;
            if (c.commessaId) {
              setCantieri(prev => prev.map(cm => cm.id === c.commessaId ? {...cm, assegnazioni: {...(cm.assegnazioni||{}), [c.tipo]: {...((cm.assegnazioni||{})[c.tipo]||{}), stato: "completato"}}} : cm));
            } else {
              setTasks(prev => prev.map(t => t.id === c.id ? {...t, done: true} : t));
            }
          };
          const quickStart = (c: any) => {
            if (c._isEvent) return;
            if (c.commessaId) {
              setCantieri(prev => prev.map(cm => cm.id === c.commessaId ? {...cm, assegnazioni: {...(cm.assegnazioni||{}), [c.tipo]: {...((cm.assegnazioni||{})[c.tipo]||{}), stato: "in_corso"}}} : cm));
            }
          };

          // === RENDER ITEM CARD ===
          const renderItemCard = (c: any, compact?: boolean) => {
            const isExp = expandedItem === c.id;
            const isEvt = c._isEvent;
            return (
              <div key={c.id} style={{ marginBottom: compact ? 3 : 6 }}>
                <div onClick={() => setExpandedItem(isExp ? null : c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: compact ? "6px 8px" : "10px 12px",
                    background: T.card, borderRadius: compact ? 8 : 12, border: "1.5px solid " + T.bdr,
                    borderLeft: "4px solid " + (c.color || T.acc), cursor: "pointer",
                    boxShadow: isExp ? "0 4px 12px rgba(0,0,0,.08)" : "none" }}>
                  {!isEvt && !compact && (
                    <div onClick={(e) => { e.stopPropagation(); c.stato === "da_fare" ? quickStart(c) : quickComplete(c); }}
                      style={{ width: 22, height: 22, borderRadius: 7, border: "2px solid " + (statoColors[c.stato] || T.bdr),
                        background: c.stato === "completato" ? T.grn : c.stato === "in_corso" ? T.blue + "15" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                      {c.stato === "completato" && <I d={ICO.check} s={12} c="#fff" sw={3} />}
                      {c.stato === "in_corso" && <div style={{ width: 8, height: 8, borderRadius: 2, background: T.blue }} />}
                    </div>
                  )}
                  {isEvt && <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: compact ? 10 : 12, fontWeight: 700, color: c.stato === "completato" ? T.sub : T.text,
                      textDecoration: c.stato === "completato" ? "line-through" : "none",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.descrizione}
                    </div>
                    {!compact && (
                      <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                        {c.ora && <span style={{ fontSize: 9, fontWeight: 800, color: T.acc }}>{c.ora}</span>}
                        {c.persona && <span style={{ fontSize: 9, color: T.sub }}>{c.persona}</span>}
                        <span style={{ fontSize: 8, fontWeight: 800, padding: "1px 5px", borderRadius: 4, background: (c.color || T.acc) + "18", color: c.color || T.acc }}>{tipoEmoji[c.tipo] || c.tipo}</span>
                      </div>
                    )}
                  </div>
                  {compact && c.ora && <span style={{ fontSize: 9, fontWeight: 800, color: T.acc, flexShrink: 0 }}>{c.ora}</span>}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="2"><path d={isExp ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/></svg>
                </div>
                {isExp && (
                  <div style={{ padding: "10px 12px", background: T.card, borderRadius: "0 0 12px 12px", borderLeft: "4px solid " + (c.color || T.acc), borderRight: "1.5px solid " + T.bdr, borderBottom: "1.5px solid " + T.bdr, marginTop: -2 }}>
                    {c.notes && <div style={{ fontSize: 11, color: T.sub, marginBottom: 8, padding: "6px 8px", background: T.bg, borderRadius: 6 }}>{c.notes}</div>}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {!isEvt && c.stato !== "completato" && (
                        <div onClick={() => quickComplete(c)} style={{ padding: "8px 12px", borderRadius: 8, background: T.grn, color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 0 0 #147A55" }}>Fatto</div>
                      )}
                      {!isEvt && c.stato === "da_fare" && (
                        <div onClick={() => quickStart(c)} style={{ padding: "8px 12px", borderRadius: 8, background: T.blue || "#3B7FE0", color: "#fff", fontSize: 11, fontWeight: 800, cursor: "pointer", boxShadow: "0 2px 0 0 #2563EB" }}>Inizia</div>
                      )}
                      {c.commessa && (
                        <div onClick={() => { setSelectedCM(c.commessa); setTab("commesse"); }} style={{ padding: "8px 12px", borderRadius: 8, background: T.accLt, color: T.acc, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                          <I d={ICO.folder} s={10} c={T.acc} /> {c.commessa.code}
                        </div>
                      )}
                      {c.persona && (() => {
                        const member = team.find((m:any) => m.nome === c.persona);
                        if (!member?.telefono) return null;
                        return (<>
                          <div onClick={() => window.location.href = "tel:" + member.telefono} style={{ padding: "8px 12px", borderRadius: 8, background: T.grn + "15", color: T.grn, fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                            <I d={ICO.phone} s={10} c={T.grn} /> Chiama
                          </div>
                          <div onClick={() => window.open("https://wa.me/" + (member.telefono||"").replace(/\D/g,""))} style={{ padding: "8px 12px", borderRadius: 8, background: "#25d36615", color: "#25d366", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                            <I d={ICO.messageCircle} s={10} c="#25d366" /> WA
                          </div>
                        </>);
                      })()}
                      {c.commessa?.indirizzo && (
                        <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(c.commessa.indirizzo))} style={{ padding: "8px 12px", borderRadius: 8, background: T.blueLt || "#EFF6FF", color: T.blue || "#3B7FE0", fontSize: 11, fontWeight: 800, cursor: "pointer" }}>
                          <I d={ICO.mapPin} s={10} c={T.blue || "#3B7FE0"} /> Mappa
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          };

          return (
            <div style={{ minHeight: "100vh", paddingBottom: 100, background: T.bg }}>
              {/* HEADER */}
              <div style={{ background: "#0D1F1F", padding: "16px 16px 12px", paddingTop: "calc(16px + env(safe-area-inset-top, 0px))" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>Centro Operativo</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>{team.length} persone - {tuttiCompiti.filter(c => c.stato !== "completato").length} attivi - {eventiOggi.length} eventi oggi</div>
                  </div>
                  <div onClick={() => setTab("home")} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <I d={ICO.home} s={16} c="rgba(255,255,255,.5)" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { label: "Oggi", val: compitiOggi.length + eventiOggi.length, color: T.acc || "#28A0A0" },
                    { label: "Domani", val: compitiDomani.length, color: T.blue || "#3B7FE0" },
                    { label: "Scaduti", val: compitiScaduti.length, color: compitiScaduti.length > 0 ? "#DC4444" : "rgba(255,255,255,.2)" },
                    { label: "In corso", val: compitiInCorso.length, color: T.blue || "#3B7FE0" },
                    { label: "Fatti", val: tuttiCompiti.filter(c => c.stato === "completato").length, color: T.grn || "#1A9E73" },
                  ].map(k => (
                    <div key={k.label} style={{ flex: 1, padding: "8px 2px", borderRadius: 10, background: "rgba(255,255,255,.06)", textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: k.color }}>{k.val}</div>
                      <div style={{ fontSize: 8, fontWeight: 700, color: "rgba(255,255,255,.3)" }}>{k.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* VIEW SWITCHER + FILTERS */}
              <div style={{ padding: "8px 16px", background: T.card, borderBottom: "1.5px solid " + T.bdr }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  {(["giorno","settimana","mese"] as const).map(v => (
                    <div key={v} onClick={() => setCalViewLocal(v)}
                      style={{ flex: 1, padding: "8px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                        background: calViewLocal === v ? (T.acc || "#28A0A0") : "transparent",
                        color: calViewLocal === v ? "#fff" : T.text,
                        fontSize: 12, fontWeight: calViewLocal === v ? 900 : 600,
                        border: calViewLocal === v ? "none" : "1.5px solid " + T.bdr,
                        boxShadow: calViewLocal === v ? "0 3px 0 0 " + (T.accDk || "#156060") : "none" }}>
                      {v === "giorno" ? "Giorno" : v === "settimana" ? "Settimana" : "Mese"}
                    </div>
                  ))}
                </div>
                {team.length > 0 && (
                  <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
                    <div onClick={() => setTeamFilterPerson("")}
                      style={{ padding: "5px 10px", borderRadius: 8, whiteSpace: "nowrap", cursor: "pointer", fontSize: 11, fontWeight: 800,
                        background: !teamFilterPerson ? T.acc : "transparent", color: !teamFilterPerson ? "#fff" : T.sub,
                        border: !teamFilterPerson ? "none" : "1px solid " + T.bdr, flexShrink: 0 }}>Tutti</div>
                    {team.map(m => (
                      <div key={m.id} onClick={() => setTeamFilterPerson(teamFilterPerson === m.nome ? "" : m.nome)}
                        style={{ padding: "5px 10px", borderRadius: 8, whiteSpace: "nowrap", cursor: "pointer", fontSize: 11, fontWeight: 700,
                          background: teamFilterPerson === m.nome ? m.colore : "transparent",
                          color: teamFilterPerson === m.nome ? "#fff" : T.text,
                          border: teamFilterPerson === m.nome ? "none" : "1px solid " + T.bdr, flexShrink: 0,
                          display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", background: teamFilterPerson === m.nome ? "rgba(255,255,255,.3)" : m.colore,
                          display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 7, fontWeight: 800 }}>
                          {(m.nome||"?")[0]}
                        </div>
                        {m.nome.split(" ")[0]}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NAV BAR */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px" }}>
                <div onClick={() => calViewLocal === "giorno" ? navigateDay(-1) : calViewLocal === "settimana" ? navigateWeek(-1) : navigateMonth(-1)}
                  style={{ width: 36, height: 36, borderRadius: 10, background: T.card, border: "1.5px solid " + T.bdr, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <I d={ICO.chevronLeft} s={16} c={T.text} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: T.text }}>
                    {calViewLocal === "giorno" && calDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                    {calViewLocal === "settimana" && (weekDays[0].toLocaleDateString("it-IT", {day:"numeric",month:"short"}) + " - " + weekDays[6].toLocaleDateString("it-IT", {day:"numeric",month:"short",year:"numeric"}))}
                    {calViewLocal === "mese" && calDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
                  </div>
                  {!isToday(calDate) && <div onClick={goToday} style={{ fontSize: 10, color: T.acc, fontWeight: 800, cursor: "pointer", marginTop: 2 }}>Torna a oggi</div>}
                </div>
                <div onClick={() => calViewLocal === "giorno" ? navigateDay(1) : calViewLocal === "settimana" ? navigateWeek(1) : navigateMonth(1)}
                  style={{ width: 36, height: 36, borderRadius: 10, background: T.card, border: "1.5px solid " + T.bdr, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <I d={ICO.chevronRight} s={16} c={T.text} />
                </div>
              </div>

              <div style={{ padding: "0 16px" }}>

              {/* VISTA GIORNO */}
              {calViewLocal === "giorno" && (() => {
                const dayItems = filterItems(itemsForDay(selectedDayStr));
                const hours = Array.from({length: 14}, (_, i) => i + 7);
                const itemsByHour: Record<number, any[]> = {};
                hours.forEach(h => { itemsByHour[h] = []; });
                dayItems.forEach(c => {
                  const hour = c.ora ? parseInt(c.ora.split(":")[0]) : -1;
                  if (hour >= 7 && hour <= 20 && itemsByHour[hour]) { itemsByHour[hour].push(c); }
                  else { if (!itemsByHour[-1]) itemsByHour[-1] = []; itemsByHour[-1].push(c); }
                });
                const noTimeItems = itemsByHour[-1] || [];
                return (<>
                  {compitiScaduti.length > 0 && isToday(calDate) && (
                    <div style={{ background: "#DC444412", borderRadius: 10, padding: "8px 12px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8, border: "1px solid #DC444425" }}>
                      <I d={ICO.alertTriangle} s={14} c="#DC4444" />
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#DC4444" }}>{compitiScaduti.length} scaduti</span>
                      <span style={{ fontSize: 10, color: T.sub, marginLeft: "auto" }}>da risolvere</span>
                    </div>
                  )}
                  {noTimeItems.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: T.sub, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>Senza orario</div>
                      {noTimeItems.map(c => renderItemCard(c))}
                    </div>
                  )}
                  {hours.map(h => {
                    const items = itemsByHour[h] || [];
                    const isPast = isToday(calDate) && h < todayDate.getHours();
                    const isNow = isToday(calDate) && h === todayDate.getHours();
                    return (
                      <div key={h} style={{ display: "flex", gap: 8, minHeight: items.length > 0 ? "auto" : 32, opacity: isPast && items.length === 0 ? 0.4 : 1 }}>
                        <div style={{ width: 42, flexShrink: 0, textAlign: "right", paddingTop: 2 }}>
                          <div style={{ fontSize: 11, fontWeight: isNow ? 900 : 600, color: isNow ? T.acc : T.sub, fontFamily: FM }}>{h.toString().padStart(2,"0")}:00</div>
                        </div>
                        <div style={{ flex: 1, borderLeft: "2px solid " + (isNow ? T.acc : T.bdr), paddingLeft: 10, paddingBottom: 4, position: "relative" }}>
                          {isNow && <div style={{ position: "absolute", left: -5, top: 4, width: 8, height: 8, borderRadius: "50%", background: T.acc }} />}
                          {items.length > 0 ? items.map(c => renderItemCard(c)) : (
                            <div onClick={() => { setNewCompito(p => ({...p, data: selectedDayStr, ora: h.toString().padStart(2,"0") + ":00"})); setShowNewCompito(true); }}
                              style={{ height: 28, borderRadius: 6, border: "1px dashed " + T.bdr + "60", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontSize: 9, color: T.bdr }}>+</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {dayItems.length === 0 && (
                    <div style={{ textAlign: "center", padding: "30px 20px" }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>&#128203;</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Giornata libera</div>
                      <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Tocca un orario per aggiungere</div>
                    </div>
                  )}
                </>);
              })()}

              {/* VISTA SETTIMANA */}
              {calViewLocal === "settimana" && (<>
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                  <div style={{ display: "flex", gap: 0, marginBottom: 6, minWidth: 600 }}>
                    {weekDays.map((d, i) => {
                      const dayStr = d.toISOString().split("T")[0];
                      const isTd = dayStr === today;
                      const isSun = d.getDay() === 0;
                      const dayCount = filterItems(itemsForDay(dayStr)).length;
                      return (
                        <div key={i} onClick={() => { setCalDate(d); setCalViewLocal("giorno"); }}
                          style={{ flex: 1, textAlign: "center", padding: "6px 2px", cursor: "pointer", borderRadius: 10,
                            background: isTd ? (T.acc || "#28A0A0") + "15" : "transparent" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: isSun ? T.red : T.sub }}>{["Dom","Lun","Mar","Mer","Gio","Ven","Sab"][d.getDay()]}</div>
                          <div style={{ fontSize: 16, fontWeight: isTd ? 900 : 700, color: isTd ? "#fff" : T.text,
                            background: isTd ? (T.acc || "#28A0A0") : "transparent", borderRadius: "50%", width: 30, height: 30,
                            display: "flex", alignItems: "center", justifyContent: "center", margin: "2px auto" }}>{d.getDate()}</div>
                          {dayCount > 0 && <div style={{ fontSize: 8, fontWeight: 800, color: T.acc, marginTop: 1 }}>{dayCount}</div>}
                        </div>
                      );
                    })}
                  </div>
                  {team.length > 0 && !teamFilterPerson ? (
                    <div style={{ minWidth: 600 }}>
                      {team.map(m => {
                        const weekItems = weekDays.map(d => filterItems(itemsForDay(d.toISOString().split("T")[0])).filter(c => c.persona === m.nome));
                        const hasAny = weekItems.some(items => items.length > 0);
                        if (!hasAny) return null;
                        return (
                          <div key={m.id} style={{ display: "flex", borderBottom: "1px solid " + T.bdr + "50", minHeight: 44 }}>
                            <div style={{ width: 72, flexShrink: 0, display: "flex", alignItems: "flex-start", gap: 3, padding: "6px 0" }}>
                              <div style={{ width: 20, height: 20, borderRadius: "50%", background: m.colore, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 8, fontWeight: 800, flexShrink: 0 }}>
                                {(m.nome||"?")[0]}
                              </div>
                              <div style={{ fontSize: 9, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.nome.split(" ")[0]}</div>
                            </div>
                            {weekDays.map((d, i) => {
                              const dayStr = d.toISOString().split("T")[0];
                              const items = filterItems(itemsForDay(dayStr)).filter(c => c.persona === m.nome);
                              const isSun = d.getDay() === 0;
                              return (
                                <div key={i} onClick={() => { setCalDate(d); setCalViewLocal("giorno"); }}
                                  style={{ flex: 1, padding: "3px 2px", background: isSun ? T.bdr + "20" : "transparent", minHeight: 40, cursor: "pointer", display: "flex", flexDirection: "column", gap: 2 }}>
                                  {items.slice(0, 3).map(c => (
                                    <div key={c.id} style={{ padding: "2px 3px", borderRadius: 4, background: (c.color || T.acc) + "20", borderLeft: "2px solid " + (c.color || T.acc),
                                      fontSize: 7, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                      {c.ora ? c.ora.substring(0,5) + " " : ""}{c.descrizione.substring(0, 12)}
                                    </div>
                                  ))}
                                  {items.length > 3 && <div style={{ fontSize: 7, fontWeight: 800, color: T.acc, textAlign: "center" }}>+{items.length - 3}</div>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    weekDays.map(d => {
                      const dayStr = d.toISOString().split("T")[0];
                      const items = filterItems(itemsForDay(dayStr));
                      if (items.length === 0) return null;
                      return (
                        <div key={dayStr} style={{ marginBottom: 8 }}>
                          <div onClick={() => { setCalDate(d); setCalViewLocal("giorno"); }}
                            style={{ fontSize: 11, fontWeight: 800, color: isToday(d) ? T.acc : T.text, marginBottom: 4, cursor: "pointer" }}>
                            {d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" })}
                            {isToday(d) && <span style={{ color: T.acc, marginLeft: 6, fontSize: 9 }}>OGGI</span>}
                          </div>
                          {items.map(c => renderItemCard(c, true))}
                        </div>
                      );
                    })
                  )}
                </div>
              </>)}

              {/* VISTA MESE */}
              {calViewLocal === "mese" && (<>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0 }}>
                  {["L","M","M","G","V","S","D"].map((d, i) => (
                    <div key={i} style={{ textAlign: "center", padding: "4px 0", fontSize: 10, fontWeight: 700, color: i === 6 ? T.red : T.sub }}>{d}</div>
                  ))}
                  {monthDays.map((d, i) => {
                    const dayStr = d.toISOString().split("T")[0];
                    const isThisMonth = d.getMonth() === calMonth;
                    const isTd = dayStr === today;
                    const dayItems2 = filterItems(itemsForDay(dayStr));
                    const hasScaduti = dayItems2.some(c => c.scadenza && c.scadenza < today && c.stato !== "completato");
                    return (
                      <div key={i} onClick={() => { setCalDate(d); setCalViewLocal("giorno"); }}
                        style={{ padding: "4px 2px", minHeight: 44, cursor: "pointer", borderRadius: 6,
                          background: isTd ? (T.acc || "#28A0A0") + "12" : "transparent",
                          opacity: isThisMonth ? 1 : 0.3, position: "relative" }}>
                        <div style={{ fontSize: 12, fontWeight: isTd ? 900 : 600, textAlign: "center",
                          color: isTd ? "#fff" : T.text,
                          background: isTd ? (T.acc || "#28A0A0") : "transparent",
                          borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                          {d.getDate()}
                        </div>
                        {dayItems2.length > 0 && (
                          <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2, flexWrap: "wrap" }}>
                            {dayItems2.slice(0, 4).map((c, j) => (
                              <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: c.color || T.acc }} />
                            ))}
                            {dayItems2.length > 4 && <div style={{ fontSize: 7, fontWeight: 800, color: T.sub }}>+{dayItems2.length - 4}</div>}
                          </div>
                        )}
                        {hasScaduti && <div style={{ position: "absolute", top: 2, right: 2, width: 6, height: 6, borderRadius: "50%", background: T.red }} />}
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const selItems = filterItems(itemsForDay(selectedDayStr));
                  return selItems.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: T.text, marginBottom: 6 }}>
                        {calDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                        <span style={{ fontSize: 10, color: T.sub, marginLeft: 6 }}>{selItems.length} elementi</span>
                      </div>
                      {selItems.map(c => renderItemCard(c))}
                    </div>
                  );
                })()}
              </>)}

              </div>

              {/* QUICK ACTIONS BAR */}
              <div style={{ position: "fixed", bottom: 70, left: 0, right: 0, zIndex: 50, padding: "0 12px" }}>
                <div style={{ display: "flex", gap: 6, background: "#0D1F1F", borderRadius: 16, padding: "8px 10px", boxShadow: "0 -4px 20px rgba(0,0,0,.15)" }}>
                  <div onClick={() => { setNewCompito(p => ({...p, data: selectedDayStr})); setShowNewCompito(true); }}
                    style={{ flex: 1, padding: "10px 4px", borderRadius: 12, background: T.acc || "#28A0A0", textAlign: "center", cursor: "pointer",
                      boxShadow: "0 3px 0 0 " + (T.accDk || "#156060") }}>
                    <I d={ICO.plus} s={14} c="#fff" sw={2.5} />
                    <div style={{ fontSize: 9, fontWeight: 800, color: "#fff", marginTop: 1 }}>Compito</div>
                  </div>
                  <div onClick={() => { setNewEvent({...newEvent, date: selectedDayStr}); setShowNewEvent(true); }}
                    style={{ flex: 1, padding: "10px 4px", borderRadius: 12, background: "rgba(255,255,255,.08)", textAlign: "center", cursor: "pointer" }}>
                    <I d={ICO.calendar} s={14} c={T.acc} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.6)", marginTop: 1 }}>Evento</div>
                  </div>
                  <div onClick={() => setShowModal("commessa")}
                    style={{ flex: 1, padding: "10px 4px", borderRadius: 12, background: "rgba(255,255,255,.08)", textAlign: "center", cursor: "pointer" }}>
                    <I d={ICO.folder} s={14} c={T.orange || "#E8A020"} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.6)", marginTop: 1 }}>Commessa</div>
                  </div>
                  <div onClick={() => setShowModal("contatto")}
                    style={{ flex: 1, padding: "10px 4px", borderRadius: 12, background: "rgba(255,255,255,.08)", textAlign: "center", cursor: "pointer" }}>
                    <I d={ICO.userPlus} s={14} c={T.blue || "#3B7FE0"} />
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.6)", marginTop: 1 }}>Cliente</div>
                  </div>
                  <div onClick={() => setShowVoice(true)}
                    style={{ flex: 1, padding: "10px 4px", borderRadius: 12, background: "rgba(255,255,255,.08)", textAlign: "center", cursor: "pointer" }}>
                    <I d={ICO.mic} s={14} c="#DC4444" />
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.6)", marginTop: 1 }}>Voce</div>
                  </div>
                </div>
              </div>

              {/* NEW COMPITO MODAL */}
              {showNewCompito && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
                  onClick={() => setShowNewCompito(false)}>
                  <div onClick={e => e.stopPropagation()}
                    style={{ background: T.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, padding: "24px 20px", maxHeight: "85vh", overflow: "auto" }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: T.text, marginBottom: 16 }}>Nuovo compito</div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>Assegna a</div>
                      <select value={newCompito.persona} onChange={e => setNewCompito(p => ({...p, persona: e.target.value}))}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid " + T.bdr, background: T.bg, fontSize: 14, fontFamily: FF, color: T.text }}>
                        <option value="">-- Seleziona --</option>
                        {team.map(m => <option key={m.id} value={m.nome}>{m.nome} ({m.ruolo})</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>Tipo</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {["Sopralluogo","Misure","Preventivo","Montaggio","Collaudo","Consegna","Acquisti","Ufficio","Pulizia","Manutenzione","Altro"].map(tipo => (
                          <button key={tipo} onClick={() => setNewCompito(p => ({...p, tipo}))}
                            style={{ padding: "6px 10px", borderRadius: 8, border: newCompito.tipo === tipo ? "none" : "1px solid " + T.bdr,
                              background: newCompito.tipo === tipo ? (T.acc || "#28A0A0") : "transparent",
                              color: newCompito.tipo === tipo ? "#fff" : T.text,
                              fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{tipo}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>Descrizione</div>
                      <input value={newCompito.descrizione} onChange={e => setNewCompito(p => ({...p, descrizione: e.target.value}))}
                        placeholder="es. Pulire ufficio, Portare materiale..."
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid " + T.bdr, background: T.bg, fontSize: 14, fontFamily: FF, color: T.text, outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>Data</div>
                        <input type="date" value={newCompito.data} onChange={e => setNewCompito(p => ({...p, data: e.target.value}))}
                          style={{ width: "100%", padding: "12px 10px", borderRadius: 12, border: "1.5px solid " + T.bdr, background: T.bg, fontSize: 13, fontFamily: FF, color: T.text }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>Ora</div>
                        <input type="time" value={newCompito.ora} onChange={e => setNewCompito(p => ({...p, ora: e.target.value}))}
                          style={{ width: "100%", padding: "12px 10px", borderRadius: 12, border: "1.5px solid " + T.bdr, background: T.bg, fontSize: 13, fontFamily: FF, color: T.text }} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>Priorita</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[{id:"bassa",c:T.grn},{id:"normale",c:T.orange},{id:"urgente",c:T.red}].map(pr => (
                          <button key={pr.id} onClick={() => setNewCompito(p => ({...p, priorita: pr.id}))}
                            style={{ flex: 1, padding: "10px", borderRadius: 10, border: newCompito.priorita === pr.id ? "none" : "1px solid " + T.bdr,
                              background: newCompito.priorita === pr.id ? pr.c : "transparent",
                              color: newCompito.priorita === pr.id ? "#fff" : T.text,
                              fontSize: 12, fontWeight: 800, cursor: "pointer", textTransform: "capitalize",
                              boxShadow: newCompito.priorita === pr.id ? "0 3px 0 0 " + pr.c + "80" : "none" }}>{pr.id}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>Commessa collegata</div>
                      <select value={newCompito.commessaId} onChange={e => setNewCompito(p => ({...p, commessaId: e.target.value}))}
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid " + T.bdr, background: T.bg, fontSize: 13, fontFamily: FF, color: T.text }}>
                        <option value="">-- Nessuna --</option>
                        {cantieri.map(cm => <option key={cm.id} value={cm.id}>{cm.code} - {cm.cliente}</option>)}
                      </select>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}>Note</div>
                      <input value={newCompito.note} onChange={e => setNewCompito(p => ({...p, note: e.target.value}))}
                        placeholder="Istruzioni aggiuntive..."
                        style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1.5px solid " + T.bdr, background: T.bg, fontSize: 13, fontFamily: FF, color: T.text, outline: "none" }} />
                    </div>
                    <button onClick={() => {
                      if (!newCompito.persona || !newCompito.descrizione) return;
                      const t = { id: "t" + Date.now(), text: newCompito.descrizione, persona: newCompito.persona, date: newCompito.data, time: newCompito.ora, priority: newCompito.priorita, cm: newCompito.commessaId, meta: newCompito.note, done: false, tipo: newCompito.tipo };
                      setTasks(prev => [...prev, t]);
                      setShowNewCompito(false);
                      setNewCompito({ persona: "", tipo: "", descrizione: "", data: new Date().toISOString().split("T")[0], ora: "09:00", scadenza: "", priorita: "normale", note: "", commessaId: "" });
                    }} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: T.acc || "#28A0A0", color: "#fff",
                      fontSize: 15, fontWeight: 900, cursor: "pointer", fontFamily: FF,
                      boxShadow: "0 6px 0 0 " + (T.accDk || "#156060") }}>
                      Assegna compito
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}</PanelErrorBoundary>}
          {tab === "settings" && <PanelErrorBoundary name="Impostazioni">{renderSettings()}</PanelErrorBoundary>}
        {tab === "nodi_tecnici" && <PanelErrorBoundary name="Nodi Tecnici"><div style={{position:"fixed",inset:0,zIndex:200,background:"#F2F1EC"}}><NodiTecniciPanel onBack={() => setTab("home")} /></div></PanelErrorBoundary>}
        {tab === "ordini_fornitori" && <PanelErrorBoundary name="Ordini Fornitori"><div style={{position:"fixed",inset:0,zIndex:200,background:"#F8FAFA"}}><OrdiniFornitori onBack={() => setTab("home")} /></div></PanelErrorBoundary>}
        {tab === "lavorazioni_cat" && <PanelErrorBoundary name="Lavorazioni"><div style={{position:"fixed",inset:0,zIndex:200,background:"#F2F1EC"}}><CostruttoreLavorazioni onBack={() => setTab("home")} /></div></PanelErrorBoundary>}
        {tab === "altro" && (() => {
          return (
            <div style={{ padding:"20px 16px 100px", minHeight:"100vh" }}>
              <div style={{ fontSize:20, fontWeight:900, color:"#0D1F1F", marginBottom:20 }}>Altro</div>
              <div onClick={() => setTab("settings")}
                style={{ background:"#fff", borderRadius:16, border:"1px solid #C8E4E4",
                  boxShadow:"0 4px 0 0 #A8CCCC", padding:"18px 16px",
                  display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
                <div style={{ width:44, height:44, borderRadius:12,
                  background:"#4A707015", display:"flex", alignItems:"center",
                  justifyContent:"center", flexShrink:0 }}>
                  <I d={ICO.settings} s={22} c="#4A7070" />
                </div>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#0D1F1F" }}>Impostazioni</div>
                  <div style={{ fontSize:12, color:"#4A7070", marginTop:2 }}>Azienda, team, piani</div>
                </div>
                <svg style={{ marginLeft:"auto" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8BBCBC" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>

              {/* CATALOGHI TECNICI */}
              <div style={{ fontSize:13, fontWeight:800, color:"#28A0A0", textTransform:"uppercase", letterSpacing:".8px", marginTop:24, marginBottom:10 }}>Cataloghi Tecnici</div>
              {[
                { id:"ordini_fornitori", label:"Ordini Fornitori", desc:"Trasformatore ordini universale", col:"#D08008", ico:ICO.package },
                { id:"nodi_tecnici", label:"Nodi Tecnici", desc:"Assembla sezioni profilo nei giunti", col:"#28A0A0", ico:ICO.edit },
                { id:"lavorazioni_cat", label:"Lavorazioni", desc:"Forature, fresature, operazioni CNC", col:"#3B7FE0", ico:ICO.wrench },
              ].map(item => (
                <div key={item.id} onClick={() => setTab(item.id)}
                  style={{ background:"#fff", borderRadius:16, border:"1px solid #C8E4E4",
                    boxShadow:"0 4px 0 0 #A8CCCC", padding:"18px 16px", marginBottom:10,
                    display:"flex", alignItems:"center", gap:14, cursor:"pointer" }}>
                  <div style={{ width:44, height:44, borderRadius:12,
                    background:item.col+"15", display:"flex", alignItems:"center",
                    justifyContent:"center", flexShrink:0 }}>
                    <I d={item.ico} s={22} c={item.col} />
                  </div>
                  <div>
                    <div style={{ fontSize:15, fontWeight:800, color:"#0D1F1F" }}>{item.label}</div>
                    <div style={{ fontSize:12, color:"#4A7070", marginTop:2 }}>{item.desc}</div>
                  </div>
                  <svg style={{ marginLeft:"auto" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.col} strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              ))}
            </div>
          );
        })()}

        <SyncStatusBar status={sync.status} />
        {ConfirmDialog}
        {ToastContainer}
        {/* FAB - Quick Actions */}
        {/* FAB - Compose menu */}
        <style>{`
          @keyframes fabPulse { 0%,100% { box-shadow: 0 4px 20px rgba(13,124,107,0.4); } 50% { box-shadow: 0 4px 30px rgba(13,124,107,0.6); } }
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          body { background: #E8F4F4; background-image: linear-gradient(rgba(40,160,160,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,.18) 1px,transparent 1px); background-size: 24px 24px; color: transparent; font-size: 0; }
          body > div { font-size: initial; color: initial; }
        `}</style>
        {/* EVENT POPUP OVERLAY - Google Calendar style */}
        {selectedEvent && !selectedEvent._isTask && (tab === "agenda" || tab === "home") && (() => {
          const ev = selectedEvent;
          const cmObj = ev.cm ? cantieri.find(c => c.code === ev.cm) : null;
          return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedEvent(null)}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)" }} />
              <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", zIndex: 9999, background: T.bg, borderRadius: 16, padding: 20, width: "90%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <input defaultValue={ev.text} onBlur={(e) => { const val = e.target.value.trim(); if (val && val !== ev.text) { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, text: val } : x)); setSelectedEvent({ ...ev, text: val }); } }} style={{ fontSize: 18, fontWeight: 800, color: T.text, border: "none", background: "transparent", width: "100%", outline: "none", padding: 0, fontFamily: "inherit" }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <input type="date" defaultValue={ev.date} onChange={(e) => { if (e.target.value) { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, date: e.target.value } : x)); setSelectedEvent({ ...ev, date: e.target.value }); } }} style={{ fontSize: 13, color: T.sub, border: `1px solid ${T.bdr}`, borderRadius: 8, padding: "4px 8px", background: T.card, fontFamily: "inherit" }} />
                      <input type="time" defaultValue={ev.time || ""} onChange={(e) => { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, time: e.target.value } : x)); setSelectedEvent({ ...ev, time: e.target.value }); }} style={{ fontSize: 13, color: T.sub, border: `1px solid ${T.bdr}`, borderRadius: 8, padding: "4px 8px", background: T.card, fontFamily: "inherit" }} />
                    </div>
                  </div>
                  <div onClick={() => setSelectedEvent(null)} style={{ cursor: "pointer", fontSize: 22, color: T.sub, padding: "0 4px" }}>{""}</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {ev.persona && <span style={S.badge(T.purpleLt, T.purple)}><I d={ICO.user} /> {ev.persona}</span>}
                  {ev.addr && <span style={{ fontSize: 11, color: T.sub, background: T.blueLt, padding: "3px 8px", borderRadius: 6 }}><I d={ICO.mapPin} s={11} c={T.blue} /> {ev.addr}</span>}
                  {ev.cm && <span style={S.badge(T.blueLt, T.blue)}><Ico d={ICO.folder} s={14} c="currentColor" /> {ev.cm}</span>}
                  <select defaultValue={ev.tipo || "sopralluogo"} onChange={(e) => { setEvents(prev => prev.map(x => x.id === ev.id ? { ...x, tipo: e.target.value } : x)); setSelectedEvent({ ...ev, tipo: e.target.value }); }} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: tipoEvColor(ev.tipo || "sopralluogo") + "18", color: tipoEvColor(ev.tipo || "sopralluogo"), fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {TIPI_EVENTO.map(t => <option key={t.id} value={t.id}>{t.l}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 8 }}>
                  {ev.addr && <div onClick={() => window.open("https://maps.google.com/?q=" + encodeURIComponent(ev.addr))} style={{ padding: "12px 4px", borderRadius: 10, background: T.blueLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.blue }}><I d={ICO.mapPin} s={12} c={T.blue} /> Mappa</div>}
                  <div onClick={() => { const tel = cmObj?.telefono || contatti.find(c => c.nome === ev.persona)?.telefono; if (tel) window.location.href="tel:" + tel; }} style={{ padding: "12px 4px", borderRadius: 10, background: T.grnLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.grn }}><Ico d={ICO.phone} s={14} c={T.grn} /> Chiama</div>
                  <div onClick={() => { const cliente = cmObj ? `${cmObj.cliente} ${cmObj.cognome||""}`.trim() : (ev.persona || "Cliente"); const dataFmt = new Date(ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" }); setMailBody(`Gentile ${cliente},\n\nLe confermo l'appuntamento:\n\n${dataFmt}${ev.time ? " alle " + ev.time : ""}\n${ev.addr || ""}\n\n${ev.text}\n\nCordiali saluti,\nFabio Cozza`); setShowMailModal({ ev, cm: cmObj }); setSelectedEvent(null); }} style={{ padding: "12px 4px", borderRadius: 10, background: T.accLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.acc }}>{"ï¸"} Mail</div>
                  <div onClick={() => { deleteEvent(ev.id); setSelectedEvent(null); }} style={{ padding: "12px 4px", borderRadius: 10, background: T.redLt, textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.red }}><Ico d={ICO.trash} s={14} c={T.red} /> Elimina</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  <div onClick={() => { if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "12px 4px", borderRadius: 12, background: "linear-gradient(135deg, #0D7C6B15, #0D7C6B08)", border: "1px solid #0D7C6B25", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#0D7C6B" }}><Ico d={ICO.folder} s={14} c="currentColor" /> Commessa</div>
                  <div onClick={() => { if (cmObj) { setSelectedCM(cmObj); } else { const code = "CM-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "Nuovo", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "Misure: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); } setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "12px 4px", borderRadius: 12, background: "linear-gradient(135deg, #E8A02015, #E8A02008)", border: "1px solid #E8A02025", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#E8A020" }}><I d={ICO.ruler} s={12} c="#E8A020" /> Misure</div>
                  <div onClick={() => { const code = "INT-" + Date.now().toString().slice(-4); const nc = { id: "c" + Date.now(), code, cliente: ev.persona || "", cognome: "", indirizzo: ev.addr || "", telefono: "", tipo: "nuova", fase: "sopralluogo", vani: [], note: "Intervento: " + ev.text }; setCantieri(prev => [...prev, nc]); setSelectedCM(nc); setSelectedEvent(null); setTab("commesse"); }} style={{ padding: "12px 4px", borderRadius: 12, background: "linear-gradient(135deg, #1A9E7315, #1A9E7308)", border: "1px solid #1A9E7325", textAlign: "center", cursor: "pointer", fontSize: 12, fontWeight: 800, color: "#1A9E73" }}><I d={ICO.wrench} s={12} c="#1A9E73" /> Intervento</div>
                </div>
              </div>
            </div>
          );
        })()}
        {/* TASK DETAIL MODAL */}
        {selectedTask && (() => {
          const t = tasks.find(x => x.id === selectedTask.id) || selectedTask;
          const prioColor = t.priority === "alta" ? "#FF3B30" : t.priority === "media" ? "#FF9500" : "#8E8E93";
          const prioLabel = t.priority === "alta" ? "Urgente" : t.priority === "media" ? "Normale" : "â— Bassa";
          return (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelectedTask(null)}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.3)" }} />
              <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", zIndex: 9999, background: T.bg, borderRadius: 16, padding: 20, width: "90%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 800, color: prioColor, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4, fontFamily: FM }}>TASK Â· {prioLabel}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.text, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.6 : 1 }}>{t.text}</div>
                    {t.date && <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}><I d={ICO.calendar} /> {new Date(t.date + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}{t.time ? " alle " + t.time : ""}</div>}
                  </div>
                  <div onClick={() => setSelectedTask(null)} style={{ cursor: "pointer", fontSize: 22, color: T.sub, padding: "0 4px" }}></div>
                </div>
                {t.meta && <div style={{ fontSize: 13, color: T.sub, marginBottom: 12, padding: "8px 12px", background: T.bgSec, borderRadius: 8, border: `1px solid ${T.bdr}` }}><Ico d={ICO.fileText} s={12} c={T.sub} /> {t.meta}</div>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  <span style={S.badge(prioColor + "18", prioColor)}>{prioLabel}</span>
                  {t.cm && <span onClick={() => { const cm = cantieri.find(c => c.code === t.cm); if (cm) { setSelectedCM(cm); setTab("commesse"); setSelectedTask(null); } }} style={{ ...S.badge(T.accLt, T.acc), cursor: "pointer" }}><Ico d={ICO.folder} s={12} c={T.acc} /> {t.cm}</span>}
                  {t.persona && <span style={S.badge(T.purpleLt, T.purple)}><I d={ICO.user} /> {t.persona}</span>}
                  {t.done && <span style={S.badge(T.grnLt, T.grn)}> Completato</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div onClick={() => { toggleTask(t.id); setSelectedTask({ ...t, done: !t.done }); }} style={{ padding: "14px", borderRadius: 12, background: t.done ? T.bg : T.grn, color: t.done ? T.sub : "#fff", textAlign: "center", cursor: "pointer", fontSize: 14, fontWeight: 800, border: `1px solid ${t.done ? T.bdr : T.grn}` }}>{t.done ? "â†© Riapri" : "Completa"}</div>
                  <div onClick={() => { setTasks(ts => ts.filter(x => x.id !== t.id)); setSelectedTask(null); }} style={{ padding: "14px", borderRadius: 12, background: "#FF3B3010", color: "#FF3B30", textAlign: "center", cursor: "pointer", fontSize: 14, fontWeight: 800, border: "1px solid #FF3B3020" }}><><Ico d={ICO.trash} s={14} c="#FF3B30" /></> Elimina</div>
                </div>
              </div>
            </div>
          );
        })()}
        <DraggableFAB currentTab={tab} fabOpen={fabOpen} setFabOpen={setFabOpen} acc={T.acc} onVoice={() => setShowVoice(true)} onEvento={() => setShowNewEvent(true)} onCliente={() => setShowModal("contatto")} onCommessa={() => setShowModal("commessa")} onMessaggio={() => setShowCompose(true)} lastCM={lastOpenedCMId ? cantieri.find(c => c.id === lastOpenedCMId) : cantieri[0]} recentActions={recentActions} trackAction={trackAction} onLastCM={(cm) => { setSelectedCM(cm); setTab("commesse"); }} />

        {/* MESSAGE DETAIL OVERLAY */}
        {selectedMsg && (<div style={{ position: "fixed", inset: 0, background: T.bg, zIndex: 100 }}><div onClick={() => { setSelectedMsg(null); setReplyText(""); }} style={{ padding: 16, cursor: "pointer", fontWeight: 700, color: T.acc }}>← Chiudi</div></div>)}

        {/* SETTINGS ADD MODAL */}
        {settingsModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && setSettingsModal(null)}>
            <div style={{ background: T.card, borderRadius: 16, width: "100%", maxWidth: 380, padding: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>
                {settingsModal === "sistema" && "Nuovo Sistema"}
                {settingsModal === "colore" && "Nuovo Colore"}
                {settingsModal === "vetro" && "Nuovo Vetro"}
                {settingsModal === "coprifilo" && "Nuovo Coprifilo"}
                {settingsModal === "lamiera" && "Nuova Lamiera"}
                {settingsModal === "tipologia" && "Nuova Tipologia"}
                {settingsModal === "membro" && "Nuovo Membro Team"}
              </div>

              {settingsModal === "membro" && (<>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Nome e cognome</label><input style={S.input} placeholder="es. Marco Ferraro" value={settingsForm.nome || ""} onChange={e => setSettingsForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Ruolo</label><select style={S.select} value={settingsForm.ruolo || "Posatore"} onChange={e => setSettingsForm(f => ({ ...f, ruolo: e.target.value }))}>
                  <optgroup label="Direzione"><option>Titolare</option><option>Socio</option><option>Direttore generale</option></optgroup>
                  <optgroup label="Cantiere"><option>Capo squadra</option><option>Posatore</option><option>Aiuto montatore</option><option>Tecnico misure</option><option>Tecnico assistenza</option></optgroup>
                  <optgroup label="Produzione"><option>Resp. produzione</option><option>Operatore CNC</option><option>Assemblatore</option><option>Vetraio</option><option>Magazziniere</option></optgroup>
                  <optgroup label="Ufficio"><option>Resp. commerciale</option><option>Preventivista</option><option>Amministrazione</option><option>Contabile</option><option>Segreteria</option><option>Resp. acquisti</option></optgroup>
                  <optgroup label="Vendita"><option>Agente</option><option>Consulente showroom</option><option>Progettista</option></optgroup>
                  <optgroup label="Altro"><option>Autista</option><option>Apprendista</option><option>Stagista</option><option>Consulente esterno</option></optgroup>
                </select></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Compiti principali</label><input style={S.input} placeholder="es. Misure, installazione, assistenza" value={settingsForm.compiti || ""} onChange={e => setSettingsForm(f => ({ ...f, compiti: e.target.value }))} /></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Telefono</label><input style={S.input} type="tel" placeholder="es. 347 123 4567" value={settingsForm.telefono || ""} onChange={e => setSettingsForm(f => ({ ...f, telefono: e.target.value }))} /></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Email</label><input style={S.input} type="email" placeholder="es. marco@azienda.it" value={settingsForm.email || ""} onChange={e => setSettingsForm(f => ({ ...f, email: e.target.value }))} /></div>
              </>)}

              {settingsModal === "sistema" && (<>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Marca</label><input style={S.input} placeholder="es. Aluplast" value={settingsForm.marca || ""} onChange={e => setSettingsForm(f => ({ ...f, marca: e.target.value }))} /></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Sistema</label><input style={S.input} placeholder="es. Ideal 4000" value={settingsForm.sistema || ""} onChange={e => setSettingsForm(f => ({ ...f, sistema: e.target.value }))} /></div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>â‚¬/mq (fallback)</label><input style={S.input} type="number" placeholder="180" value={settingsForm.euroMq || ""} onChange={e => setSettingsForm(f => ({ ...f, euroMq: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Sovr. RAL %</label><input style={S.input} type="number" placeholder="12" value={settingsForm.sovRAL || ""} onChange={e => setSettingsForm(f => ({ ...f, sovRAL: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Sovr. Legno %</label><input style={S.input} type="number" placeholder="22" value={settingsForm.sovLegno || ""} onChange={e => setSettingsForm(f => ({ ...f, sovLegno: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Sottosistemi (separati da virgola)</label><input style={S.input} placeholder="es. Classicline, Roundline" value={settingsForm.sottosistemi || ""} onChange={e => setSettingsForm(f => ({ ...f, sottosistemi: e.target.value }))} /></div>
              </>)}

              {settingsModal === "colore" && (<>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Nome</label><input style={S.input} placeholder="es. Grigio antracite" value={settingsForm.nome || ""} onChange={e => setSettingsForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Codice</label><input style={S.input} placeholder="es. RAL 7016" value={settingsForm.code || ""} onChange={e => setSettingsForm(f => ({ ...f, code: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Tipo</label><select style={S.select} value={settingsForm.tipo || "RAL"} onChange={e => setSettingsForm(f => ({ ...f, tipo: e.target.value }))}><option>RAL</option><option>Legno</option><option>Satinato</option><option>Altro</option></select></div>
                </div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Colore HEX</label><div style={{ display: "flex", gap: 8, alignItems: "center" }}><input type="color" value={settingsForm.hex || "#888888"} onChange={e => setSettingsForm(f => ({ ...f, hex: e.target.value }))} style={{ width: 40, height: 34, border: "none", cursor: "pointer" }} /><input style={{ ...S.input, flex: 1 }} value={settingsForm.hex || "#888888"} onChange={e => setSettingsForm(f => ({ ...f, hex: e.target.value }))} /></div></div>
              </>)}

              {settingsModal === "vetro" && (<>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Nome</label><input style={S.input} placeholder="es. Triplo basso emissivo" value={settingsForm.nome || ""} onChange={e => setSettingsForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 2 }}><label style={S.fieldLabel}>Codice composizione</label><input style={S.input} placeholder="es. 4/16/4 BE" value={settingsForm.code || ""} onChange={e => setSettingsForm(f => ({ ...f, code: e.target.value }))} /></div>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Ug</label><input style={S.input} type="number" step="0.1" placeholder="1.1" value={settingsForm.ug || ""} onChange={e => setSettingsForm(f => ({ ...f, ug: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Prezzo â‚¬/mq</label><input style={S.input} type="number" step="0.5" placeholder="es. 45" value={settingsForm.prezzoMq || ""} onChange={e => setSettingsForm(f => ({ ...f, prezzoMq: parseFloat(e.target.value)||0 }))} /></div>
              </>)}

              {(settingsModal === "coprifilo" || settingsModal === "lamiera") && (<>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Codice</label><input style={S.input} placeholder={settingsModal === "coprifilo" ? "es. CP50" : "es. LD250"} value={settingsForm.cod || ""} onChange={e => setSettingsForm(f => ({ ...f, cod: e.target.value }))} /></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Descrizione</label><input style={S.input} placeholder={settingsModal === "coprifilo" ? "es. Coprifilo piatto 50mm" : "es. Lamiera davanzale 250mm"} value={settingsForm.nome || ""} onChange={e => setSettingsForm(f => ({ ...f, nome: e.target.value }))} /></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Prezzo â‚¬/ml</label><input style={S.input} type="number" step="0.5" placeholder="es. 5.50" value={settingsForm.prezzoMl || ""} onChange={e => setSettingsForm(f => ({ ...f, prezzoMl: parseFloat(e.target.value)||0 }))} /></div>
              </>)}

              {settingsModal === "tipologia" && (<>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}><label style={S.fieldLabel}>Codice</label><input style={S.input} placeholder="es. F4A" value={settingsForm.code || ""} onChange={e => setSettingsForm(f => ({ ...f, code: e.target.value }))} /></div>
                  <div style={{ width: 60 }}><label style={S.fieldLabel}>Icona</label><input style={S.input} placeholder="âŠž" value={settingsForm.icon || ""} onChange={e => setSettingsForm(f => ({ ...f, icon: e.target.value }))} /></div>
                </div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Descrizione</label><input style={S.input} placeholder="es. Finestra 4 ante" value={settingsForm.label || ""} onChange={e => setSettingsForm(f => ({ ...f, label: e.target.value }))} /></div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Categoria</label>
                  <select style={S.select} value={settingsForm.cat || "Altro"} onChange={e => setSettingsForm(f => ({ ...f, cat: e.target.value }))}>
                    {["Finestre","Balconi","Scorrevoli","Persiane","Altro"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 10 }}><label style={S.fieldLabel}>Forma base</label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { id: "rettangolare", label: "Rettangolare", svg: null },
                      { id: "fuorisquadro", label: "Fuorisquadro", svg: null },
                      { id: "arco", label: "Ad arco", svg: null },
                      { id: "trapezio", label: "Trapezoidale", svg: null },
                      { id: "triangolo", label: "Triangolare", svg: null },
                      { id: "oblo", label: "Oblò", svg: null },
                      { id: "sagomato", label: "Sagomato", svg: null },
                    ].map(f => (
                      <div key={f.id} onClick={() => setSettingsForm(fm => ({ ...fm, forma: f.id }))} style={{ padding: "6px 8px", borderRadius: 10, border: `2px solid ${settingsForm.forma === f.id ? T.acc : T.bdr}`, background: settingsForm.forma === f.id ? T.accLt : T.card, cursor: "pointer", textAlign: "center", minWidth: 56 }}>
                        <div>{f.svg}</div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: settingsForm.forma === f.id ? T.acc : T.sub, marginTop: 2 }}>{f.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>)}

              <button style={S.btn} onClick={addSettingsItem}>Salva</button>
              <button style={S.btnCancel} onClick={() => setSettingsModal(null)}>Annulla</button>
            </div>
          </div>
        )}


        {/* === MODULO PROBLEMI - MODAL CREAZIONE === */}
        {showProblemaModal && selectedCM && (() => {
          const c = selectedCM;
          const TIPI_PROB = [
            { id: "materiale", l: "Materiale", ico: "package", c: "#FF9500" },
            { id: "misure", l: "Misure errate", ico: "ruler", c: "#8B5CF6" },
            { id: "installazione", l: "Installazione", ico: "hammer", c: "#1A9E73" },
            { id: "cliente", l: "Cliente", ico: "user", c: "#0D7C6B" },
            { id: "fornitore", l: "Fornitore", ico: "factory", c: "#FF6B00" },
            { id: "qualita", l: "Qualità", ico: "alert", c: "#FF3B30" },
            { id: "altro", l: "Altro", ico: "clipboard", c: "#8E8E93" },
          ];
          const PRIO = [
            { id: "alta", l: "Alta", c: "#FF3B30" },
            { id: "media", l: "Media", c: "#FF9500" },
            { id: "bassa", l: "â— Bassa", c: "#8E8E93" },
          ];
          return (
            <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowProblemaModal(false)}>
              <div style={{ ...S.modalInner, maxHeight: "85vh", overflow: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#FF3B30" }}><I d={ICO.alertTriangle} /> Segnala problema</div>
                  <div onClick={() => setShowProblemaModal(false)} style={{ cursor: "pointer", fontSize: 20, color: T.sub }}></div>
                </div>
                <div style={{ fontSize: 11, color: T.sub, marginBottom: 14, padding: "8px 12px", background: T.accLt, borderRadius: 8 }}><Ico d={ICO.folder} s={12} c={T.acc} /> {c.code} Â· {c.cliente} Â· Fase: <b>{c.fase}</b></div>

                <label style={S.fieldLabel}>Titolo *</label>
                <input style={S.input} placeholder="Es: Profilo arrivato danneggiato" value={problemaForm.titolo} onChange={e => setProblemaForm(f => ({ ...f, titolo: e.target.value }))} />

                <label style={{ ...S.fieldLabel, marginTop: 12 }}>Tipo problema</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {TIPI_PROB.map(t => (
                    <div key={t.id} onClick={() => setProblemaForm(f => ({ ...f, tipo: t.id }))} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${problemaForm.tipo === t.id ? t.c : T.bdr}`, background: problemaForm.tipo === t.id ? t.c + "18" : "transparent", fontSize: 11, fontWeight: 600, color: problemaForm.tipo === t.id ? t.c : T.sub, cursor: "pointer" }}>
                      {t.l}
                    </div>
                  ))}
                </div>

                <label style={S.fieldLabel}>Priorità</label>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {PRIO.map(p => (
                    <div key={p.id} onClick={() => setProblemaForm(f => ({ ...f, priorita: p.id }))} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${problemaForm.priorita === p.id ? p.c : T.bdr}`, background: problemaForm.priorita === p.id ? p.c + "18" : "transparent", textAlign: "center", fontSize: 11, fontWeight: 700, color: problemaForm.priorita === p.id ? p.c : T.sub, cursor: "pointer" }}>
                      {p.l}
                    </div>
                  ))}
                </div>

                <label style={S.fieldLabel}>Descrizione</label>
                <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }} placeholder="Descrivi il problema nel dettaglio..." value={problemaForm.descrizione} onChange={e => setProblemaForm(f => ({ ...f, descrizione: e.target.value }))} />

                <label style={{ ...S.fieldLabel, marginTop: 12 }}>Assegna a</label>
                <select style={S.select || S.input} value={problemaForm.assegnato} onChange={e => setProblemaForm(f => ({ ...f, assegnato: e.target.value }))}>
                  <option value=""> -  Nessuno  - </option>
                  {team.map(m => <option key={m.id} value={m.nome}>{m.nome} - {(m as any).ruolo}</option>)}
                </select>

                <button onClick={() => {
                  if (!problemaForm.titolo.trim()) return;
                  const np = {
                    id: "P" + Date.now(),
                    commessaId: c.id,
                    commessaCode: c.code,
                    cliente: c.cliente,
                    fase: c.fase,
                    tipo: problemaForm.tipo,
                    priorita: problemaForm.priorita,
                    stato: "aperto",
                    titolo: problemaForm.titolo.trim(),
                    descrizione: problemaForm.descrizione.trim(),
                    segnalatoDa: team[0]?.nome || "Fabio",
                    assegnatoA: problemaForm.assegnato,
                    dataApertura: new Date().toISOString(),
                    dataRisoluzione: null,
                    noteRisoluzione: "",
                  };
                  setProblemi(prev => [np, ...prev]);
                  setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, log: [...(x.log || []), { chi: np.segnalatoDa, cosa: `Problema segnalato: ${np.titolo}`, quando: "Adesso", color: "#FF3B30" }] } : x));
                  setSelectedCM(prev => ({ ...prev, log: [...(prev.log || []), { chi: np.segnalatoDa, cosa: `Problema segnalato: ${np.titolo}`, quando: "Adesso", color: "#FF3B30" }] }));
                  setShowProblemaModal(false);
                }} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: "#FF3B30", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF, marginTop: 16 }}>
                  <I d={ICO.alertTriangle} /> Crea segnalazione
                </button>
              </div>
            </div>
          );
        })()}

        {/* === MODULO PROBLEMI - VISTA LISTA === */}
        {showProblemiView && (() => {
          const cmFilter = selectedCM?.id;
          const list = cmFilter ? problemi.filter(p => p.commessaId === cmFilter) : problemi;
          const TIPI_PROB_MAP = { materiale: { l: "Materiale", ico: "package", c: "#FF9500" }, misure: { l: "Misure", ico: "ruler", c: "#8B5CF6" }, installazione: { l: "Install.", ico: "hammer", c: "#1A9E73" }, cliente: { l: "Cliente", ico: "user", c: "#0D7C6B" }, fornitore: { l: "Fornitore", ico: "factory", c: "#FF6B00" }, qualita: { l: "Qualità", ico: "alert", c: "#FF3B30" }, altro: { l: "Altro", ico: "clipboard", c: "#8E8E93" } };
          const STATO_MAP = { aperto: { l: "Aperto", c: "#FF3B30" }, in_corso: { l: "In corso", c: "#FF9500" }, risolto: { l: "Risolto", c: "#1A9E73" } };
          const aperti = list.filter(p => p.stato === "aperto").length;
          const inCorso = list.filter(p => p.stato === "in_corso").length;
          const risolti = list.filter(p => p.stato === "risolto").length;
          return (
            <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowProblemiView(false)}>
              <div style={{ ...S.modalInner, maxWidth: 500, maxHeight: "90vh", overflow: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}><I d={ICO.alertTriangle} /> Problemi {cmFilter ? `Â· ${selectedCM.code}` : " -  Tutti"}</div>
                  <div onClick={() => setShowProblemiView(false)} style={{ cursor: "pointer", fontSize: 20, color: T.sub }}></div>
                </div>

                {/* Contatori */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <div style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#FF3B3010", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#FF3B30" }}>{aperti}</div>
                    <div style={{ fontSize: 10, color: "#FF3B30", fontWeight: 600 }}>Aperti</div>
                  </div>
                  <div style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#FF950010", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#FF9500" }}>{inCorso}</div>
                    <div style={{ fontSize: 10, color: "#FF9500", fontWeight: 600 }}>In corso</div>
                  </div>
                  <div style={{ flex: 1, padding: "10px", borderRadius: 10, background: "#1A9E7310", textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: "#1A9E73" }}>{risolti}</div>
                    <div style={{ fontSize: 10, color: "#1A9E73", fontWeight: 600 }}>Risolti</div>
                  </div>
                </div>

                {list.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "28px 16px" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}></div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Nessun problema segnalato</div>
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Ottimo lavoro!</div>
                  </div>
                ) : list.map(p => {
                  const tp = TIPI_PROB_MAP[p.tipo] || TIPI_PROB_MAP.altro;
                  const st = STATO_MAP[p.stato] || STATO_MAP.aperto;
                  const prio = p.priorita === "alta" ? { l: "", c: "#FF3B30" } : p.priorita === "media" ? { l: "", c: "#FF9500" } : { l: "â—", c: "#8E8E93" };
                  return (
                    <div key={p.id} style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: "12px 14px", marginBottom: 8, borderLeft: `3px solid ${st.c}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{prio.l} {p.titolo}</div>
                          <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{p.commessaCode} Â· {p.cliente} Â· {p.fase}</div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: st.c + "18", color: st.c }}>{st.l}</span>
                      </div>
                      {p.descrizione && <div style={{ fontSize: 11, color: T.sub, marginBottom: 8, lineHeight: 1.5 }}>{p.descrizione}</div>}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: tp.c + "18", color: tp.c, fontWeight: 600 }}>{tp.l}</span>
                        {p.assegnatoA && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: T.purpleLt, color: T.purple, fontWeight: 600 }}><I d={ICO.user} /> {p.assegnatoA}</span>}
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: T.bg, color: T.sub }}>{new Date(p.dataApertura).toLocaleDateString("it-IT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      {/* Azioni */}
                      <div style={{ display: "flex", gap: 6 }}>
                        {p.stato === "aperto" && (
                          <button onClick={() => setProblemi(prev => prev.map(x => x.id === p.id ? { ...x, stato: "in_corso" } : x))} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid #FF9500`, background: "#FF950010", color: "#FF9500", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                            <I d={ICO.alertTriangle} /> Prendi in carico
                          </button>
                        )}
                        {p.stato === "in_corso" && (
                          <button onClick={() => setProblemi(prev => prev.map(x => x.id === p.id ? { ...x, stato: "risolto", dataRisoluzione: new Date().toISOString() } : x))} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid #1A9E73`, background: "#1A9E7310", color: "#1A9E73", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                             Risolvi
                          </button>
                        )}
                        {p.stato === "risolto" && (
                          <button onClick={() => setProblemi(prev => prev.map(x => x.id === p.id ? { ...x, stato: "aperto", dataRisoluzione: null } : x))} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.bg, color: T.sub, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                            â†© Riapri
                          </button>
                        )}
                        <button onClick={() => { if (confirm("Eliminare questo problema?")) setProblemi(prev => prev.filter(x => x.id !== p.id)); }} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid #FF3B3030`, background: "#FF3B3008", color: "#FF3B30", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: FF }}>
                          <I d={ICO.trash} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Tab Bar */}
        {!isDesktop && (() => {
          const TABS = [
            { id: "home",      ico: ICO.home,      label: "Home" },
            { id: "agenda",    ico: ICO.calendar,  label: "Agenda" },
            { id: "commesse",  ico: ICO.folder,    label: "Commesse" },
            { id: "messaggi",  ico: ICO.messageCircle, label: "Talk" },
            { id: "altro",     ico: ICO.settings,  label: "Altro" },
          ];
          const NAV_ICONS: Record<string, React.ReactNode> = {
            home: <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l11-6 11 6v13l-11 6L3 22V9z"/><path d="M14 3v19M3 9l11 6 11-6"/></svg>,
            agenda: <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="22" height="20" rx="2"/><line x1="3" y1="10" x2="25" y2="10"/><line x1="9" y1="4" x2="9" y2="10"/><line x1="19" y1="4" x2="19" y2="10"/><line x1="8" y1="15" x2="12" y2="15"/><line x1="8" y1="19" x2="12" y2="19"/><line x1="16" y1="15" x2="20" y2="15"/></svg>,
            commesse: <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="5" y="3" width="18" height="22" rx="2"/><line x1="9" y1="13" x2="19" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>,
            messaggi: <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16a2 2 0 012 2v9a2 2 0 01-2 2H4L2 22V8a2 2 0 012-2z"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="15" x2="13" y2="15"/></svg>,
            altro: <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="14" r="2"/><circle cx="14" cy="14" r="2"/><circle cx="21" cy="14" r="2"/></svg>,
            settings: <svg width="20" height="20" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="14" cy="14" r="3"/><path d="M14 4v3M14 21v3M4 14h3M21 14h3M6.3 6.3l2.1 2.1M19.6 19.6l2.1 2.1M6.3 21.7l2.1-2.1M19.6 8.4l2.1-2.1"/></svg>,
          };
          return (
            <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:100,
              background:"#0D1F1F", borderTop:"1px solid rgba(40,160,160,0.15)",
              display:"flex", justifyContent:"space-around", alignItems:"center",
              padding:"10px 0",
              paddingBottom:"calc(10px + env(safe-area-inset-bottom, 0px))" }}>
              {TABS.map(t => {
                const active = tab === t.id;
                const badge = t.id === "messaggi" && (msgs||[]).filter((m:any) => !m.letto).length > 0
                  ? (msgs||[]).filter((m:any) => !m.letto).length : 0;
                return (
                  <div key={t.id} onClick={() => { setTab(t.id); if (t.id !== "commesse") setSelectedCM(null); }}
                    style={{ flex:1, display:"flex", flexDirection:"column" as any, alignItems:"center", gap:3, cursor:"pointer", padding:"2px 0" }}>
                    <div style={{ position:"relative" as any, color: active ? "#28A0A0" : "rgba(255,255,255,0.35)" }}>
                      {React.cloneElement(NAV_ICONS[t.id] as any, { stroke: active ? "#28A0A0" : "rgba(255,255,255,0.35)" })}
                      {badge > 0 && (
                        <div style={{ position:"absolute", top:-4, right:-6, width:16, height:16,
                          borderRadius:"50%", background:"#DC4444", color:"#fff",
                          fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {badge > 9 ? "9+" : badge}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize:10, fontWeight: active ? 900 : 600,
                      color: active ? "#28A0A0" : "rgba(255,255,255,0.35)" }}>{t.label}</div>
                  </div>
                );
              })}
            </div>
          );
        })()}

      {/* === TUTORIAL INTERATTIVO === */}
            {/* â•â•â• ONBOARDING 5 STEP â•â•â• */}
      {tutoStep >= 1 && tutoStep <= 4 && (() => {
        const ACC = "#28A0A0";
        const DARK = "#1A1A1C";

        const SETTORI_OPT = [
          { id: "serramenti", label: "Serramenti" },
          { id: "tendaggi", label: "Tendaggi" },
          { id: "fabbro", label: "Fabbro" },
          { id: "zanzariere", label: "Zanzariere" },
          { id: "pergole", label: "Pergole" },
        ];

        const toggleSettore = (id: string) => {
          setObSettori(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
        };

        const saveAndNext = () => {
          if (tutoStep === 2) {
            if (!obNome.trim()) return;
            setAziendaInfo(prev => ({ ...prev, nome: obNome, ragione: obRagione || obNome, piva: obPiva, telefono: obTel, email: obEmail, indirizzo: obIndirizzo }));
          }
          if (tutoStep === 3) {
            setSettoriAttivi(obSettori.length > 0 ? obSettori : ["serramenti"]);
            try { localStorage.setItem("mastro:settori", JSON.stringify(obSettori)); } catch {}
          }
          
          if (tutoStep >= 4) { closeTuto(); return; }
          setTutoStep(tutoStep + 1);
        };

        const inp = (val: string, set: (v: string) => void, ph: string, type = "text") => (
          <input value={val} onChange={e => set(e.target.value)} placeholder={ph} type={type}
            style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #E2E8F0", fontSize: 15, outline: "none", boxSizing: "border-box" as any, fontFamily: "inherit", marginBottom: 10, background: "#fff" }} />
        );

        const dots = Array.from({ length: 4 }, (_, i) => (
          <div key={i} style={{ width: i + 1 === tutoStep ? 20 : 8, height: 8, borderRadius: 4, background: i + 1 <= tutoStep ? ACC : "#E2E8F0", transition: "all 0.2s" }} />
        ));

        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#E8F4F4", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {/* Header */}
            <div style={{ background: DARK, padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, flexShrink: 0 }}><svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><g transform="rotate(8 100 100)"><rect x="55" y="55" width="90" height="90" rx="22" fill="#2FA7A2"/><path d="M70 70 L130 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/><path d="M130 70 L70 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/></g></svg></div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>fliwoX</div>
              <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>{dots}</div>
            </div>

            <div style={{ flex: 1, padding: "24px 20px", maxWidth: 480, margin: "0 auto", width: "100%", boxSizing: "border-box" as any }}>

              {/* STEP 1 - BENVENUTO */}
              {tutoStep === 1 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: "#28A0A0", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: DARK, marginBottom: 10 }}>Benvenuto in fliwoX</div>
                  <div style={{ fontSize: 15, color: "#555", lineHeight: 1.7, marginBottom: 32 }}>
                    Il gestionale per artigiani italiani.<br />
                    Serramenti, tendaggi, fabbri, zanzariere, pergole.<br /><br />
                    Configuriamo il tuo account in <b>2 minuti</b>.
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, textAlign: "left", marginBottom: 32, background: "#fff", borderRadius: 16, padding: 20 }}>
                    {[
                      { icon: "CM", t: "Commesse", d: "Ogni lavoro dalla richiesta alla posa" },
                      { icon: "MS", t: "Misure dal cantiere", d: "Rilievi vano per vano con il telefono" },
                      { icon: "PV", t: "Preventivi PDF", d: "Professionale, con logo e firma digitale" },
                      { icon: "AI", t: "Assistente AI", d: "Di' Mastro e gestisci tutto a voce" },
                    ].map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#28A0A0", color: "#fff", fontSize: 12, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{s.t}</div>
                          <div style={{ fontSize: 12, color: "#777" }}>{s.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={saveAndNext} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: ACC, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                    Inizia la configurazione
                  </button>
                  <div onClick={closeTuto} style={{ marginTop: 14, fontSize: 12, color: "#999", cursor: "pointer" }}>Salta, configura dopo</div>
                </div>
              )}

              {/* STEP 2 - DATI AZIENDA */}
              {tutoStep === 2 && (
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: DARK, marginBottom: 6 }}>La tua azienda</div>
                  <div style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>Questi dati appaiono nei preventivi e nelle fatture.</div>
                  {inp(obNome, setObNome, "Nome commerciale (es. Rossi Serramenti) *")}
                  {inp(obRagione, setObRagione, "Ragione sociale (es. Rossi Serramenti SRL)")}
                  {inp(obPiva, setObPiva, "P.IVA (es. IT01234567890)")}
                  {inp(obTel, setObTel, "Telefono (es. 0832 123456)", "tel")}
                  {inp(obEmail, setObEmail, "Email (es. info@rossiserramenti.it)", "email")}
                  {inp(obIndirizzo, setObIndirizzo, "Indirizzo (es. Via Roma 1, Lecce)")}
                  <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                    <button onClick={() => setTutoStep(1)} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Indietro</button>
                    <button onClick={saveAndNext} disabled={!obNome.trim()} style={{ flex: 2, padding: 14, borderRadius: 12, border: "none", background: obNome.trim() ? ACC : "#ccc", color: "#fff", fontSize: 15, fontWeight: 800, cursor: obNome.trim() ? "pointer" : "default", fontFamily: "inherit" }}>Continua</button>
                  </div>
                </div>
              )}

              {/* STEP 3 - SETTORI */}
              {tutoStep === 3 && (
                <div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: DARK, marginBottom: 6 }}>In che settore lavori?</div>
                  <div style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>Seleziona uno o più settori. Puoi cambiare in qualsiasi momento.</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                    {SETTORI_OPT.map(s => {
                      const sel = obSettori.includes(s.id);
                      return (
                        <div key={s.id} onClick={() => toggleSettore(s.id)}
                          style={{ padding: "14px 18px", borderRadius: 14, border: `2px solid ${sel ? ACC : "#E2E8F0"}`, background: sel ? "#E8F4F4" : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${sel ? ACC : "#E2E8F0"}`, background: sel ? ACC : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {sel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: sel ? 700 : 500, color: sel ? DARK : "#555" }}>{s.label}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setTutoStep(2)} style={{ flex: 1, padding: 14, borderRadius: 12, border: "1.5px solid #E2E8F0", background: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Indietro</button>
                    <button onClick={saveAndNext} style={{ flex: 2, padding: 14, borderRadius: 12, border: "none", background: ACC, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>Continua</button>
                  </div>
                </div>
              )}

              {/* STEP 4 PREZZI — RIMOSSO */}
{/* STEP 4 — TUTTO PRONTO (renamed) - TUTTO PRONTO */}
              {tutoStep === 4 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: "#28A0A0", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: DARK, marginBottom: 10 }}>Tutto pronto!</div>
                  <div style={{ fontSize: 14, color: "#555", lineHeight: 1.7, marginBottom: 32 }}>
                    Il tuo fliwoX è configurato.<br />
                    Ecco come iniziare subito:
                  </div>
                  <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 28, textAlign: "left" }}>
                    {[
                      { n: "1", t: "Crea la prima commessa", d: "Vai in Commesse, tocca + e inserisci cliente" },
                      { n: "2", t: "Aggiungi i vani", d: "Dentro la commessa, aggiungi finestre e porte" },
                      { n: "3", t: "Misura dal cantiere", d: "Apri la commessa sul telefono e misura vano per vano" },
                      { n: "4", t: "Invia il preventivo", d: "Dì Mastro, manda il preventivo a [cliente] e il gioco è fatto" },
                    ].map((s, i) => (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: ACC, color: "#fff", fontSize: 13, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.n}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: DARK }}>{s.t}</div>
                          <div style={{ fontSize: 12, color: "#777" }}>{s.d}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={saveAndNext} style={{ width: "100%", padding: 16, borderRadius: 14, border: "none", background: ACC, color: "#fff", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                    Entra in fliwoX
                  </button>
                </div>
              )}

            </div>
          </div>
        );
      })()}

        {/* Modals */}
        {<PanelErrorBoundary name="Modal">{renderModal()}</PanelErrorBoundary>}
        {showPreventivoModal && <PanelErrorBoundary name="Preventivo"><PreventivoModal /></PanelErrorBoundary>}
        {/* renderFirmaModal - TODO */}
        {/* renderOnboarding - TODO */}

        {/* SEND COMMESSA MODAL */}
        {showSendModal && selectedCM && (
          <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowSendModal(false)}>
            <div style={S.modalInner}>
              {sendConfirm === "sent" ? (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}></div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: T.grn }}>Commessa inviata!</div>
                  <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Email inviata con tutti i dati selezionati</div>
                </div>
              ) : (
                <>
                  <div style={S.modalTitle}><I d={ICO.mail} /> Invia Commessa - {selectedCM.code}</div>
                  <div style={{ fontSize: 12, color: T.sub, marginBottom: 14 }}>Scegli cosa includere nell'invio:</div>
                  {[
                    { key: "misure", label: "Misure tutti i vani", ico: <I d={ICO.ruler} /> },
                    { key: "foto", label: "Foto scattate", ico: <I d={ICO.camera} /> },
                    { key: "disegno", label: "Disegni mano libera", ico: <I d={ICO.edit} /> },
                    { key: "accessori", label: "Accessori (tapparelle, zanzariere...)", ico: <I d={ICO.grid} /> },
                    { key: "note", label: "Note e annotazioni", ico: <I d={ICO.fileText} /> },
                  ].map(opt => (
                    <div key={opt.key} onClick={() => setSendOpts(o => ({ ...o, [opt.key]: !o[opt.key] }))} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: sendOpts[opt.key] ? T.accLt : T.card, border: `1px solid ${sendOpts[opt.key] ? T.acc : T.bdr}`, borderRadius: 10, marginBottom: 6, cursor: "pointer" }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${sendOpts[opt.key] ? T.acc : T.bdr}`, background: sendOpts[opt.key] ? T.acc : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>
                        {sendOpts[opt.key] && ""}
                      </div>
                      <span style={{ fontSize: 16 }}>{opt.ico}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{opt.label}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, marginBottom: 8 }}>
                    <label style={S.fieldLabel}>Invia a (email)</label>
                    <input style={S.input} placeholder="email@destinatario.com" />
                  </div>
                  <button onClick={sendCommessa} style={{ ...S.btn, background: "linear-gradient(135deg, #0D7C6B, #0055cc)", marginTop: 4 }}>
                    <I d={ICO.mail} /> Invia commessa completa
                  </button>
                  <button style={S.btnCancel} onClick={() => setShowSendModal(false)}>Annulla</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* NEW EVENT MODAL */}
        {showNewEvent && (
          <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowNewEvent(false)}>
            <div style={S.modalInner}>
              <div style={S.modalTitle}>{newEvent.tipo === "task" ? "Nuovo task" : "Nuovo evento"}</div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Titolo</label>
                <input style={S.input} placeholder="es. Sopralluogo, consegna materiale..." value={newEvent.text} onChange={e => setNewEvent(ev => ({ ...ev, text: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={S.fieldLabel}>Data</label>
                  <input style={S.input} type="date" value={newEvent.date || selDate.toISOString().split("T")[0]} onChange={e => setNewEvent(ev => ({ ...ev, date: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.fieldLabel}>Ora (opz.)</label>
                  <input style={S.input} type="time" value={newEvent.time} onChange={e => setNewEvent(ev => ({ ...ev, time: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Tipo</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[{ id: "task", l: "Task", ico: "checkCircle", c: T.orange }, ...TIPI_EVENTO].map(t => (
                    <div key={t.id} onClick={() => setNewEvent(ev => ({ ...ev, tipo: t.id }))} style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${newEvent.tipo === t.id ? t.c : T.bdr}`, background: newEvent.tipo === t.id ? t.c + "18" : "transparent", textAlign: "center", fontSize: 11, fontWeight: 600, color: newEvent.tipo === t.id ? t.c : T.sub, cursor: "pointer" }}>
                      {t.l}
                    </div>
                  ))}
                </div>
              </div>
              {/* --- TASK-SPECIFIC FIELDS --- */}
              {newEvent.tipo === "task" && (<>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Priorità</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ id: "alta", l: "Alta", c: "#FF3B30" }, { id: "media", l: "Media", c: "#FF9500" }, { id: "bassa", l: "â— Bassa", c: "#8E8E93" }].map(p => (
                    <div key={p.id} onClick={() => setNewEvent(ev => ({ ...ev, _taskPriority: p.id } as any))} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `1px solid ${((newEvent as any)._taskPriority || "media") === p.id ? p.c : T.bdr}`, background: ((newEvent as any)._taskPriority || "media") === p.id ? p.c + "18" : "transparent", textAlign: "center", fontSize: 12, fontWeight: 600, color: ((newEvent as any)._taskPriority || "media") === p.id ? p.c : T.sub, cursor: "pointer" }}>
                      {p.l}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Collega a commessa</label>
                <select style={S.select} value={newEvent.cm} onChange={e => setNewEvent(ev => ({ ...ev, cm: e.target.value }))}>
                  <option value=""> -  Nessuna  - </option>
                  {cantieri.map(c => <option key={c.id} value={c.code}>{c.code} Â· {c.cliente}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Assegna a persona</label>
                <select style={S.select} value={newEvent.persona} onChange={e => setNewEvent(ev => ({ ...ev, persona: e.target.value }))}>
                  <option value=""> -  Nessuno  - </option>
                  {[...contatti.filter(ct => ct.tipo === "cliente"), ...team].map(m => <option key={m.id} value={m.nome}>{m.nome}{(m as any).ruolo ? " - " + (m as any).ruolo : ""}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Note (opz.)</label>
                <input style={S.input} placeholder="Dettagli, materiale da portare..." value={(newEvent as any)._taskMeta || ""} onChange={e => setNewEvent(ev => ({ ...ev, _taskMeta: e.target.value } as any))} />
              </div>
              </>)}
              {/* --- EVENT-SPECIFIC FIELDS --- */}
              {newEvent.tipo !== "task" && (<>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Cliente</label>
                <select style={S.select} value={newEvent.persona || ""} onChange={e => {
                  const val = e.target.value;
                  if (val === "__new__") { setNewEvent(ev => ({ ...ev, persona: "", _newCliente: true } as any)); }
                  else { const ct = contatti.find(c => c.nome === val); setNewEvent(ev => ({ ...ev, persona: val, addr: ct?.indirizzo || ev.addr, text: ev.text || ("Appuntamento " + val), _newCliente: false } as any)); }
                }}>
                  <option value=""> -  Seleziona cliente  - </option>
                  {contatti.filter(ct => ct.tipo === "cliente").map(ct => <option key={ct.id || ct.nome} value={ct.nome}>{ct.nome}{ct.cognome ? " " + ct.cognome : ""}</option>)}
                  <option value="__new__"><I d={ICO.plus} /> Nuovo cliente...</option>
                </select>
                {(newEvent as any)._newCliente && (
                  <div style={{ background: T.bgSec, borderRadius: 10, padding: 12, marginTop: 8, border: `1px solid ${T.bdr}` }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}><I d={ICO.user} /> Nuovo cliente</div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                      <input style={{ ...S.input, flex: 1 }} placeholder="Nome" value={(newEvent as any)._nomeCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _nomeCliente: e.target.value } as any))} />
                      <input style={{ ...S.input, flex: 1 }} placeholder="Cognome" value={(newEvent as any)._cognomeCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _cognomeCliente: e.target.value } as any))} />
                    </div>
                    <input style={{ ...S.input, marginBottom: 8 }} placeholder="Telefono" value={(newEvent as any)._telCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _telCliente: e.target.value } as any))} />
                    <input style={S.input} placeholder="Indirizzo" value={(newEvent as any)._addrCliente || ""} onChange={e => setNewEvent(ev => ({ ...ev, _addrCliente: e.target.value, addr: e.target.value } as any))} />
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Collega a commessa</label>
                <select style={S.select} value={newEvent.cm} onChange={e => setNewEvent(ev => ({ ...ev, cm: e.target.value }))}>
                  <option value=""> -  Nessuna  - </option>
                  {cantieri.map(c => <option key={c.id} value={c.code}>{c.code} Â· {c.cliente}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Assegna a persona</label>
                <select style={S.select} value={newEvent.persona} onChange={e => setNewEvent(ev => ({ ...ev, persona: e.target.value }))}>
                  <option value=""> -  Nessuno  - </option>
                  {team.map(m => <option key={m.id} value={m.nome}>{m.nome} - {m.ruolo}</option>)}
                </select>
              </div>
              {/* Indirizzo */}
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Indirizzo (opz.)</label>
                <input style={S.input} placeholder="Via Roma 12, Cosenza..." value={newEvent.addr||""} onChange={e => setNewEvent(ev => ({ ...ev, addr: e.target.value }))} />
              </div>
              {/* Reminder */}
              <div style={{ marginBottom: 16 }}>
                <label style={S.fieldLabel}><I d={ICO.clock} /> Reminder al cliente</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { id: "", l: "Nessuno" },
                    { id: "24h", l: "24h prima" },
                    { id: "1h", l: "1h prima" },
                    { id: "giorno", l: "Il giorno" },
                  ].map(r => (
                    <div key={r.id} onClick={() => setNewEvent(ev => ({ ...ev, reminder: r.id }))}
                      style={{ flex: 1, padding: "8px 4px", borderRadius: 8, textAlign: "center", fontSize: 11, fontWeight: 700, cursor: "pointer",
                        border: `1px solid ${newEvent.reminder === r.id ? T.acc : T.bdr}`,
                        background: newEvent.reminder === r.id ? T.accLt : "transparent",
                        color: newEvent.reminder === r.id ? T.acc : T.sub }}>
                      {r.l}
                    </div>
                  ))}
                </div>
                {newEvent.reminder && (
                  <div style={{ marginTop: 6, fontSize: 10, color: T.sub, padding: "5px 8px", background: T.accLt, borderRadius: 6 }}>
                    <I d={ICO.mail} /> MASTRO ti avviserà di inviare il reminder - lo farai con 1 click dal banner in agenda
                  </div>
                )}
              </div>
              </>)}
              <button style={S.btn} onClick={addEvent}>{newEvent.tipo === "task" ? "Crea task" : "Crea evento"}</button>
              <button style={S.btnCancel} onClick={() => setShowNewEvent(false)}>Annulla</button>
            </div>
          </div>
        )}

        {/* FASE ADVANCE NOTIFICATION */}
        {faseNotif && (
          <div style={{ position: "fixed", top: 60, left: "50%", transform: "translateX(-50%)", maxWidth: 380, width: "90%", padding: "12px 16px", borderRadius: 12, background: T.card, border: `1px solid ${faseNotif.color}40`, boxShadow: `0 4px 20px ${faseNotif.color}30`, zIndex: 300, display: "flex", alignItems: "center", gap: 10, animation: "fadeIn 0.3s ease" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: faseNotif.color + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 18 }}><I d={ICO.mail} /></span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Avanzato a {faseNotif.fase}</div>
              <div style={{ fontSize: 11, color: T.sub }}>Email inviata a <strong>{faseNotif.addetto}</strong></div>
            </div>
            <div style={{ fontSize: 18 }}></div>
          </div>
        )}

        {/* COMPOSE MESSAGE MODAL */}
        {showCompose && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && setShowCompose(false)}>
            <div style={{ background: T.card, borderRadius: 16, width: "100%", maxWidth: 420, padding: 20, maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}><I d={ICO.edit} /> Nuovo messaggio</div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.fieldLabel}>Invia via</label>
                <div style={{ display: "flex", gap: 4 }}>
                  {[
                    { id: "whatsapp", l: "WhatsApp", c: "#25d366" },
                    { id: "email", l: "Email", c: T.blue },
                    { id: "sms", l: "SMS", c: T.orange },
                    { id: "telegram", l: "ï¸ Telegram", c: "#0088cc" },
                  ].map(ch => (
                    <div key={ch.id} onClick={() => setComposeMsg(c => ({ ...c, canale: ch.id }))} style={{ flex: 1, padding: "8px 4px", borderRadius: 8, border: `1.5px solid ${composeMsg.canale === ch.id ? ch.c : T.bdr}`, background: composeMsg.canale === ch.id ? ch.c + "15" : T.card, textAlign: "center", cursor: "pointer", fontSize: 10, fontWeight: 600, color: composeMsg.canale === ch.id ? ch.c : T.sub }}>
                      {ch.l}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.fieldLabel}>Destinatario</label>
                <input style={S.input} placeholder="Nome o numero..." value={composeMsg.to} onChange={e => setComposeMsg(c => ({ ...c, to: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={S.fieldLabel}>Collega a commessa (opzionale)</label>
                <select style={S.select} value={composeMsg.cm} onChange={e => setComposeMsg(c => ({ ...c, cm: e.target.value }))}>
                  <option value=""> -  Nessuna  - </option>
                  {cantieri.map(c => <option key={c.id} value={c.code}>{c.code} Â· {c.cliente}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Messaggio</label>
                <textarea style={{ width: "100%", padding: 12, fontSize: 13, border: `1px solid ${T.bdr}`, borderRadius: 10, background: T.bg, minHeight: 80, resize: "vertical", fontFamily: FF, boxSizing: "border-box" }} placeholder="Scrivi il messaggio..." value={composeMsg.text} onChange={e => setComposeMsg(c => ({ ...c, text: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[{ ico: "paperclip", l: "File" }, { ico: "camera", l: "Foto" }, { ico: "mic", l: "Audio" }, { ico: "mapPin", l: "Posizione" }].map((b, i) => (
                  <div key={i} style={{ flex: 1, padding: "8px 4px", background: T.bg, borderRadius: 8, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer" }}>
                    <div><I d={ICO[b.ico]} s={16} c={T.sub} /></div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: T.sub, marginTop: 1 }}>{b.l}</div>
                  </div>
                ))}
              </div>
              <button onClick={() => {
                if (composeMsg.to.trim() && composeMsg.text.trim()) {
                  const newMsg = {
                    id: Date.now(), from: composeMsg.to, preview: composeMsg.text, time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
                    cm: composeMsg.cm, read: true, canale: composeMsg.canale,
                    thread: [{ who: "Tu", text: composeMsg.text, time: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }), date: new Date().toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }), canale: composeMsg.canale }]
                  };
                  setMsgs(ms => [newMsg, ...ms]);
                  setShowCompose(false);
                  setComposeMsg({ to: "", text: "", canale: "whatsapp", cm: "" });
                }
              }} style={{ ...S.btn, opacity: composeMsg.to.trim() && composeMsg.text.trim() ? 1 : 0.5 }}>
                Invia messaggio
              </button>
              <button onClick={() => setShowCompose(false)} style={S.btnCancel}>Annulla</button>
            </div>
          </div>
        )}

        {/* ALLEGATI MODAL */}
        {showAllegatiModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && setShowAllegatiModal(null)}>
            <div style={{ background: T.card, borderRadius: 16, width: "100%", maxWidth: 380, padding: 20 }}>
              {showAllegatiModal === "nota" && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12 }}><I d={ICO.fileText} /> Nuova nota</div>
                  <textarea style={{ width: "100%", padding: 12, fontSize: 13, border: `1px solid ${T.bdr}`, borderRadius: 10, background: T.bg, minHeight: 100, resize: "vertical", fontFamily: FF, boxSizing: "border-box" }} placeholder="Scrivi la nota..." value={allegatiText} onChange={e => setAllegatiText(e.target.value)} autoFocus />
                  <button onClick={() => { if (allegatiText.trim()) { addAllegato("nota", allegatiText.trim()); setShowAllegatiModal(null); setAllegatiText(""); } }} style={{ ...S.btn, marginTop: 10, opacity: allegatiText.trim() ? 1 : 0.5 }}>Salva nota</button>
                </>
              )}
              {showAllegatiModal === "vocale" && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #DC4444, #ff6b6b)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 16, color: "#fff" }}><I d={ICO.mic} /></span>
                    </span>
                    <span>Nota Vocale</span>
                  </div>
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    {/* Waveform visualizer */}
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, height: 60, marginBottom: 16 }}>
                      {Array.from({ length: 32 }).map((_, i) => (
                        <div key={i} style={{
                          width: 3, borderRadius: 2,
                          background: isRecording ? "#DC4444" : T.bdr,
                          height: isRecording ? (Math.sin(Date.now() / 200 + i * 0.5) * 0.5 + 0.5) * 40 + 8 : 8,
                          transition: "height 0.15s",
                          animation: isRecording ? `audioWave 0.6s ease-in-out infinite` : "none",
                          animationDelay: `${i * 30}ms`,
                          opacity: isRecording ? 1 : 0.3
                        }} />
                      ))}
                    </div>
                    <style>{`@keyframes audioWave { 0%,100% { height: 8px; } 50% { height: ${Math.random() * 30 + 20}px; } }`}</style>
                    {/* Timer */}
                    <div style={{ fontSize: 32, fontWeight: 700, fontFamily: FM, color: isRecording ? T.red : T.sub, marginBottom: 16, letterSpacing: 2 }}>
                      {Math.floor(recSeconds / 60)}:{String(recSeconds % 60).padStart(2, "0")}
                    </div>
                    {/* Record button */}
                    <div onClick={() => {
                      if (!isRecording) { startMediaRecording("vocale"); }
                      else { stopMediaRecording("vocale"); }
                    }} style={{ width: 70, height: 70, borderRadius: "50%", background: isRecording ? "linear-gradient(135deg, #DC4444, #cc0000)" : "linear-gradient(135deg, #DC4444, #ff6b6b)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto", cursor: "pointer", boxShadow: isRecording ? "0 0 24px rgba(255,59,48,0.5)" : "0 4px 16px rgba(255,59,48,0.3)" }}>
                      <span style={{ fontSize: 28, color: "#fff" }}>{isRecording ? "" : ""}</span>
                    </div>
                    <div style={{ fontSize: 12, color: isRecording ? T.red : T.sub, marginTop: 10, fontWeight: isRecording ? 700 : 400 }}>
                      {isRecording ? "Registrazione... tocca per fermare" : "Tocca per registrare"}
                    </div>
                  </div>
                </>
              )}
              {showAllegatiModal === "video" && (
                <>
                  <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #0D7C6B, #8B5CF6)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 16, color: "#fff" }}><I d={ICO.clapperboard} /></span>
                    </span>
                    <span>Registra Video</span>
                  </div>
                  <div style={{ padding: "4px 0" }}>
                    {/* Camera preview - always visible */}
                    <div style={{ width: "100%", height: 220, background: "#000", borderRadius: 14, marginBottom: 10, overflow: "hidden", position: "relative" as const }}>
                      <video ref={videoPreviewRef} playsInline muted autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      {/* REC badge */}
                      {isRecording && (
                        <div style={{ position: "absolute" as const, top: 10, left: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "4px 10px" }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#DC4444", animation: "pulse 1s infinite" }} />
                          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: FM, color: "#fff" }}>
                            {Math.floor(recSeconds / 60)}:{String(recSeconds % 60).padStart(2, "0")}
                          </span>
                        </div>
                      )}
                      {/* Camera switch hint */}
                      {!isRecording && (
                        <div style={{ position: "absolute" as const, bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.5)", borderRadius: 6, padding: "4px 12px" }}>
                          <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}><I d={ICO.camera} /> Camera posteriore</span>
                        </div>
                      )}
                    </div>
                    {/* Controls */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, padding: "6px 0" }}>
                      <div onClick={() => {
                        if (!isRecording) { startMediaRecording("video"); }
                        else { stopMediaRecording("video"); }
                      }} style={{ width: 64, height: 64, borderRadius: "50%", border: "4px solid " + (isRecording ? "#DC4444" : "#0D7C6B"), background: isRecording ? "#DC4444" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>
                        {isRecording
                          ? <div style={{ width: 22, height: 22, borderRadius: 4, background: "#fff" }} />
                          : <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#DC4444" }} />
                        }
                      </div>
                    </div>
                    <div style={{ textAlign: "center", fontSize: 11, color: isRecording ? T.red : T.sub, fontWeight: isRecording ? 700 : 400, marginTop: 2 }}>
                      {isRecording ? "Tocca per fermare" : "Tocca il cerchio per registrare"}
                    </div>
                  </div>
                  <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
                </>
              )}
              <button onClick={() => { stopAllMedia(); clearInterval(recInterval.current); setIsRecording(false); setRecSeconds(0); setShowAllegatiModal(null); }} style={S.btnCancel}>Annulla</button>
            </div>
          </div>
        )}

        {/* CAMERA MODAL - foto & video cattura */}
        {showCameraModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#000", display: "flex", flexDirection: "column" as const }}>
            {/* Header */}
            <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.8)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>
                  {cameraMode === "foto" ? "Scatta Foto" : "Registra Video"}
                </span>
                {pendingFotoCat && <span style={{ fontSize: 10, color: "#E8A020", fontWeight: 700, background: "rgba(255,149,0,0.2)", padding: "2px 8px", borderRadius: 4 }}>{pendingFotoCat}</span>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {/* Switch mode */}
                <div onClick={() => setCameraMode(cameraMode === "foto" ? "video" : "foto")}
                  style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.15)", fontSize: 10, color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                  {cameraMode === "foto" ? "Video" : "Foto"}
                </div>
                {/* Import from gallery */}
                <div onClick={() => { fotoVanoRef.current?.click(); }}
                  style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(255,255,255,0.15)", fontSize: 10, color: "#fff", fontWeight: 600, cursor: "pointer" }}>
                  <I d={ICO.image} /> Galleria
                </div>
                <div onClick={closeCamera}
                  style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(255,59,48,0.3)", fontSize: 10, color: "#ff6b6b", fontWeight: 700, cursor: "pointer" }}>
                   Chiudi
                </div>
              </div>
            </div>
            {/* Camera preview */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" as const }}>
              <video ref={cameraPreviewRef} playsInline muted autoPlay style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {/* REC indicator for video */}
              {cameraMode === "video" && isRecording && (
                <div style={{ position: "absolute", top: 16, left: 16, display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "6px 12px" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#DC4444", animation: "pulse 1s infinite" }} />
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: FM, color: "#fff" }}>
                    {Math.floor(recSeconds / 60)}:{String(recSeconds % 60).padStart(2, "0")}
                  </span>
                </div>
              )}
              {/* Photo count badge */}
              {cameraMode === "foto" && (
                <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(0,0,0,0.6)", borderRadius: 8, padding: "6px 12px" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
                    <I d={ICO.camera} /> {Object.values(selectedVano?.foto || {}).filter(f => f.tipo === "foto" && (!pendingFotoCat || f.categoria === pendingFotoCat)).length} scattate
                  </span>
                </div>
              )}
            </div>
            {/* Controls */}
            <div style={{ padding: "16px 0 24px", background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", gap: 32 }}>
              {cameraMode === "foto" ? (
                <div onClick={capturePhoto}
                  style={{ width: 72, height: 72, borderRadius: "50%", border: "4px solid #fff", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <div style={{ width: 58, height: 58, borderRadius: "50%", background: "#fff" }} />
                </div>
              ) : (
                <div onClick={() => { if (!isRecording) startCameraVideoRec(); else stopCameraVideoRec(); }}
                  style={{ width: 72, height: 72, borderRadius: "50%", border: "4px solid #fff", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  {isRecording
                    ? <div style={{ width: 26, height: 26, borderRadius: 4, background: "#DC4444" }} />
                    : <div style={{ width: 58, height: 58, borderRadius: "50%", background: "#DC4444" }} />
                  }
                </div>
              )}
            </div>
            <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }`}</style>
          </div>
        )}

        {/* AI PHOTO MODAL */}
        {/* AI PHOTO MODAL */}
        {showAIPhoto && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => e.target === e.currentTarget && setShowAIPhoto(false)}>
            <div style={{ background: T.card, borderRadius: 16, width: "100%", maxWidth: 380, padding: 20, maxHeight: "80vh", overflowY: "auto" }}>
              {aiPhotoStep === 0 && (
                <>
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, #af52de, #0D7C6B)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 28 }}><I d={ICO.cpu} /></div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#af52de" }}>AI Misure da Foto</div>
                    <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>Inquadra il vano "{selectedVano?.nome}" e l'AI analizzerà l'immagine</div>
                  </div>
                  <div style={{ position: "relative", height: 200, borderRadius: 12, overflow: "hidden", marginBottom: 12, background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ position: "absolute", inset: 20, border: "2px solid #af52de80", borderRadius: 8 }} />
                    <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#af52de30" }} />
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "#af52de30" }} />
                    <div style={{ color: "#af52de", fontSize: 12, fontWeight: 600, textAlign: "center", zIndex: 1 }}><I d={ICO.camera} /> Simulazione fotocamera<br /><span style={{ fontSize: 10, color: "#af52de80" }}>Inquadra il serramento</span></div>
                  </div>
                  <button onClick={() => { setAiPhotoStep(1); setTimeout(() => setAiPhotoStep(2), 2000 + Math.random() * 1500); }} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #af52de, #0D7C6B)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF, marginBottom: 8 }}>
                    <I d={ICO.camera} /> Scatta e analizza
                  </button>
                  <button onClick={() => setShowAIPhoto(false)} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FF, color: T.sub }}>Annulla</button>
                </>
              )}
              {aiPhotoStep === 1 && (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", border: "4px solid #af52de20", borderTopColor: "#af52de", margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#af52de" }}>Analisi AI in corso...</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Rilevamento bordi Â· Edge detection Â· Stima dimensioni</div>
                  <div style={{ fontSize: 10, color: T.sub, marginTop: 8 }}>Analizzando "{selectedVano?.nome}"...</div>
                </div>
              )}
              {aiPhotoStep === 2 && (
                <>
                  <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}></div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: T.grn }}>Analisi completata!</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Misure suggerite per "{selectedVano?.nome}" (verifica con metro)</div>
                  </div>
                  <div style={{ borderRadius: 10, border: `1px solid ${T.bdr}`, overflow: "hidden", marginBottom: 12 }}>
                    {[["Larghezza stimata", `~${_aiBaseW} mm`, T.acc], ["Altezza stimata", `~${_aiBaseH} mm`, T.blue], ["Tipo rilevato", _aiTip, T.purple]].map(([l, val, col]) => (
                      <div key={String(l)} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `1px solid ${T.bdr}`, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: T.sub }}>{l}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, fontFamily: FM, color: String(col) }}>{val}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "#fff3e0", border: "1px solid #ffe0b2", marginBottom: 12, fontSize: 10, color: "#e65100" }}>
                    <I d={ICO.alertTriangle} />ï¸ Le misure AI sono approssimative. Usa sempre il metro laser per le misure definitive.
                  </div>
                  <button onClick={() => {
                    if (selectedVano) {
                      updateMisura(selectedVano.id, "lAlto", _aiBaseW + Math.floor(Math.random() * 5 - 2));
                      updateMisura(selectedVano.id, "lCentro", _aiBaseW);
                      updateMisura(selectedVano.id, "lBasso", _aiBaseW - Math.floor(Math.random() * 4));
                      updateMisura(selectedVano.id, "hSx", _aiBaseH);
                      updateMisura(selectedVano.id, "hCentro", _aiBaseH + Math.floor(Math.random() * 3 - 1));
                      updateMisura(selectedVano.id, "hDx", _aiBaseH - Math.floor(Math.random() * 4));
                    }
                    setShowAIPhoto(false);
                  }} style={{ width: "100%", padding: 12, borderRadius: 10, border: "none", background: "linear-gradient(135deg, #af52de, #0D7C6B)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: FF, marginBottom: 8 }}>
                     Applica misure suggerite
                  </button>
                  <button onClick={() => setShowAIPhoto(false)} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FF, color: T.sub }}>Solo anteprima, non applicare</button>
                </>
              )}
            </div>
          </div>
        )}
      {/* === PAYWALL MODAL === */}
      {showPaywall && (
        <div onClick={() => setShowPaywall(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: 16, maxWidth: 360, width: "100%", overflow: "hidden" }}>
            <div style={{ padding: "20px 20px 12px", textAlign: "center" as const }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}><I d={ICO.gem} /></div>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 6 }}>Passa a un piano superiore</div>
              <div style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{showPaywall}</div>
            </div>
            <div style={{ padding: "12px 20px 20px", display: "flex", flexDirection: "column" as const, gap: 8 }}>
              <div onClick={() => { setShowPaywall(null); setSettingsTab("piano"); setTab("settings"); }}
                style={{ padding: 12, borderRadius: 10, background: T.acc, textAlign: "center" as const, fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                Vedi piani disponibili
              </div>
              <div onClick={() => setShowPaywall(null)}
                style={{ padding: 10, borderRadius: 8, textAlign: "center" as const, fontSize: 12, fontWeight: 600, color: T.sub, cursor: "pointer" }}>
                Non ora
              </div>
            </div>
          </div>
        </div>
      )}
      {/* === <I d={ICO.download} /> INBOX DOCUMENTI - Modal globale === */}
      {showContabilita && <PanelErrorBoundary name="Contabilità">{renderContabilita()}</PanelErrorBoundary>}
        {showInboxDoc && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 10001, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <div style={{ background: T.card, borderRadius: "20px 20px 0 0", maxWidth: 500, width: "100%", maxHeight: "85vh", overflowY: "auto", padding: "20px 20px 30px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}><I d={ICO.download} /> Documento in Arrivo</div>
              <div onClick={() => { setShowInboxDoc(false); setInboxResult(null); }} style={{ width: 30, height: 30, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14 }}></div>
            </div>

            {/* Loading */}
            {inboxResult?.stato === "caricamento" && (
              <div style={{ textAlign: "center", padding: 30 }}>
                <div style={{ fontSize: 36, animation: "spin 1s linear infinite", display: "inline-block" }}><I d={ICO.fileText} /></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginTop: 8 }}>Caricamento...</div>
                <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>{inboxResult.file}</div>
              </div>
            )}

            {/* AI Analysis */}
            {inboxResult?.stato === "analisi" && (
              <div style={{ textAlign: "center", padding: 30 }}>
                <div style={{ fontSize: 36, animation: "spin 1s linear infinite", display: "inline-block" }}><I d={ICO.cpu} /></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#af52de", marginTop: 8 }}>AI sta leggendo il documento...</div>
                <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Estraggo: totale, consegna, pagamento, articoli</div>
              </div>
            )}

            {/* Results */}
            {inboxResult?.stato === "completato" && (
              <div>
                {/* File info + classification */}
                <div style={{ ...S.card, padding: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontSize: 28 }}>{inboxResult.tipo?.includes("pdf") ? "" : ""}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{inboxResult.file}</div>
                    {inboxResult.fileUrl && <div onClick={() => window.open(inboxResult.fileUrl, "_blank")} style={{ fontSize: 10, color: "#0D7C6B", cursor: "pointer", marginTop: 2 }}><I d={ICO.link} /> Apri originale</div>}
                  </div>
                </div>

                {/* AI Classification badge */}
                {(() => {
                  const tipoLabels: any = { firma: "Preventivo Firmato", conferma: "Conferma Fornitore", fattura: "Fattura", ricevuta: "Ricevuta Pagamento", foto: "Foto Cantiere", sconosciuto: "Documento" };
                  const tipoColors: any = { firma: "#1A9E73", conferma: "#af52de", fattura: "#0D7C6B", ricevuta: "#E8A020", foto: "#8B5CF6", sconosciuto: "#86868b" };
                  const col = tipoColors[inboxResult.docTipo] || "#86868b";
                  return (
                    <div style={{ ...S.card, padding: 12, marginBottom: 12, background: col + "10", border: `2px solid ${col}30` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: col, textTransform: "uppercase" }}><I d={ICO.cpu} /> MASTRO ha classificato:</span>
                        <span style={{ fontSize: 10, color: T.sub }}>{inboxResult.confidence}% sicuro</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: col }}>{tipoLabels[inboxResult.docTipo] || "Documento"}</div>
                      {inboxResult.matchedCommessa && (
                        <div style={{ fontSize: 12, color: T.text, marginTop: 4 }}>
                          > <b>{inboxResult.matchedCommessa.code} - {inboxResult.matchedCommessa.cliente} {inboxResult.matchedCommessa.cognome || ""}</b>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Extracted data (for conferma) */}
                {inboxResult.dati && (inboxResult.dati.fornitoreNome || inboxResult.dati.totale > 0 || inboxResult.dati.settimane > 0) && (
                  <div style={{ ...S.card, padding: 12, marginBottom: 12, background: "#af52de08", border: `1px solid #af52de20` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#af52de", textTransform: "uppercase", marginBottom: 8 }}><I d={ICO.cpu} /> Dati Estratti</div>
                    {inboxResult.dati.fornitoreNome && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}><span style={{ color: T.sub }}>Fornitore</span><b>{String(inboxResult.dati.fornitoreNome || "")}</b></div>}
                    {inboxResult.dati.totale > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}><span style={{ color: T.sub }}>Totale</span><b style={{ color: "#af52de" }}>â‚¬{inboxResult.dati.totale.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></div>}
                    {inboxResult.dati.settimane > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}><span style={{ color: T.sub }}>Produzione</span><b>{inboxResult.dati.settimane} settimane</b></div>}
                    {inboxResult.dati.dataConsegna && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0" }}><span style={{ color: T.sub }}>Consegna</span><b>{new Date(inboxResult.dati.dataConsegna).toLocaleDateString("it-IT")}</b></div>}
                  </div>
                )}

                {/* === CONFERMA type: assign to ordine === */}
                {inboxResult.docTipo === "conferma" && inboxResult.matchedOrdine && (
                  <div style={{ ...S.card, padding: 12, marginBottom: 12, background: "#1A9E7308", border: `2px solid #1A9E73` }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#1A9E73", marginBottom: 6 }}>ORDINE TROVATO</div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{inboxResult.matchedCommessa?.code} - {inboxResult.matchedCommessa?.cliente}</div>
                    <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{inboxResult.matchedOrdine.fornitore?.nome || " - "} Â· â‚¬{(inboxResult.matchedOrdine.totaleIva || 0).toLocaleString("it-IT")}</div>
                    <button onClick={() => confermaInboxDoc(inboxResult.matchedOrdine.id)} style={{ width: "100%", marginTop: 10, padding: 14, borderRadius: 12, border: "none", background: "#1A9E73", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                       ASSEGNA A QUESTO ORDINE
                    </button>
                  </div>
                )}
                {inboxResult.docTipo === "conferma" && inboxResult.tuttiOrdini?.filter(o => o.id !== inboxResult.matchedOrdine?.id).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>{inboxResult.matchedOrdine ? "Oppure scegli un altro ordine:" : "A quale ordine appartiene?"}</div>
                    {inboxResult.tuttiOrdini.filter(o => o.id !== inboxResult.matchedOrdine?.id).map(o => {
                      const cm = cantieri.find(c => c.id === o.cmId);
                      return (
                        <div key={o.id} onClick={() => confermaInboxDoc(o.id)} style={{ ...S.card, padding: "10px 12px", marginBottom: 6, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.bdr}` }}>
                          <div><div style={{ fontSize: 12, fontWeight: 700 }}>{cm?.code} - {cm?.cliente}</div><div style={{ fontSize: 10, color: T.sub }}>{o.fornitore?.nome || " - "}</div></div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.acc }}>â‚¬{(o.totaleIva || 0).toLocaleString("it-IT")}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* === FIRMA / RICEVUTA / FOTO type: assign to commessa === */}
                {(inboxResult.docTipo === "firma" || inboxResult.docTipo === "ricevuta" || inboxResult.docTipo === "foto" || inboxResult.docTipo === "sconosciuto") && (
                  <div>
                    {inboxResult.matchedCommessa && (
                      <div style={{ ...S.card, padding: 12, marginBottom: 12, background: "#1A9E7308", border: `2px solid #1A9E73` }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#1A9E73", marginBottom: 6 }}>COMMESSA TROVATA</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{inboxResult.matchedCommessa.code} - {inboxResult.matchedCommessa.cliente} {inboxResult.matchedCommessa.cognome || ""}</div>
                        <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{inboxResult.matchedCommessa.indirizzo || " - "}</div>
                        <button onClick={() => assegnaDocUniversale(inboxResult.matchedCommessa.id, inboxResult.docTipo)} style={{ width: "100%", marginTop: 10, padding: 14, borderRadius: 12, border: "none", background: "#1A9E73", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                           ASSEGNA QUI
                        </button>
                      </div>
                    )}
                    {/* All commesse for manual selection */}
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>
                      {inboxResult.matchedCommessa ? "Oppure scegli un'altra commessa:" : "A quale commessa appartiene?"}
                    </div>
                    {(inboxResult.commesseAttive || cantieri).filter(cm => cm.id !== inboxResult.matchedCommessa?.id).map(cm => (
                      <div key={cm.id} onClick={() => assegnaDocUniversale(cm.id, inboxResult.docTipo)} style={{ ...S.card, padding: "10px 12px", marginBottom: 6, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.bdr}` }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{cm.code} - {cm.cliente} {cm.cognome || ""}</div>
                          <div style={{ fontSize: 10, color: T.sub }}>{cm.fase} Â· {cm.indirizzo || " - "}</div>
                        </div>
                        <span style={{ fontSize: 16 }}> ></span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Change classification */}
                <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: T.bg, textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, marginBottom: 6 }}>Classificazione sbagliata? Scegli il tipo:</div>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" as any }}>
                    {[
                      { id: "firma", label: "ï¸ Firma", col: "#1A9E73" },
                      { id: "conferma", label: "Conferma", col: "#af52de" },
                      { id: "ricevuta", label: "Ricevuta", col: "#E8A020" },
                      { id: "foto", label: "Foto", col: "#8B5CF6" },
                    ].map(t => (
                      <span key={t.id} onClick={() => setInboxResult(prev => ({ ...prev, docTipo: t.id, confidence: 100 }))} style={{
                        padding: "6px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: "pointer",
                        background: inboxResult.docTipo === t.id ? t.col : T.card,
                        color: inboxResult.docTipo === t.id ? "#fff" : T.text,
                        border: `1px solid ${inboxResult.docTipo === t.id ? t.col : T.bdr}`,
                      }}>{t.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {/* ===== DOCUMENT VIEWER MODAL ===== */}
      {docViewer && (
        <div onClick={() => setDocViewer(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.card, borderRadius: 16, width: "100%", maxWidth: 500, maxHeight: "80vh", overflow: "auto" }}>
            {/* Header */}
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 10 }}>
              <I d={ICO.clipboard} s={20} c={T.acc} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>{docViewer.title}</div>
                <div style={{ fontSize: 11, color: T.sub }}>{docViewer.docs.length} document{docViewer.docs.length !== 1 ? "i" : "o"}</div>
              </div>
              <span onClick={() => setDocViewer(null)} style={{ fontSize: 24, cursor: "pointer", color: T.sub, lineHeight: 1 }}></span>
            </div>
            {/* Document list */}
            <div style={{ padding: 12 }}>
              {docViewer.docs.map((doc, di) => {
                const tipoColors: any = { firma: "#1A9E73", fattura: "#0D7C6B", ordine: "#E8A020", conferma: "#af52de", rilievo: "#8B5CF6", preventivo: "#EF4444", montaggio: "#0D7C6B", verbale: "#1A9E73" };
                const col = tipoColors[doc.tipo] || T.acc;
                return (
                  <div key={di} style={{ padding: 14, marginBottom: 8, borderRadius: 12, border: `1px solid ${T.bdr}`, background: T.bg }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: col + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                        <I d={ICO[doc.tipo === "firma" ? "signatureEdit" : doc.tipo === "fattura" ? "wallet" : doc.tipo === "ordine" ? "package" : doc.tipo === "conferma" ? "fileText" : doc.tipo === "rilievo" ? "ruler" : doc.tipo === "preventivo" ? "clipboard" : doc.tipo === "montaggio" ? "hammer" : "paperclip"]} s={14} c={T.sub} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{doc.nome}</div>
                        <div style={{ fontSize: 11, color: T.sub }}>{doc.detail || ""}</div>
                        {doc.data && <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}><I d={ICO.calendar} /> {fmtData(doc.data)}</div>}
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: col, background: col + "15", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase" as any }}>{doc.tipo}</span>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      {doc.dataUrl ? (
                        <a href={doc.dataUrl} download={doc.nome} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${col}`, background: col + "08", color: col, fontSize: 11, fontWeight: 700, cursor: "pointer", textAlign: "center", textDecoration: "none" }}>
                          â¬‡ï¸ Scarica
                        </a>
                      ) : (
                        <button onClick={() => { alert(`In produzione questo aprirà il file "${doc.nome}" da Supabase Storage.\n\nNella demo i documenti sono simulati.`); }} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid ${col}`, background: col + "08", color: col, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          <I d={ICO.eye} /> Visualizza
                        </button>
                      )}
                      <button onClick={() => {
                        const tel = (selectedCM?.telefono || "").replace(/\D/g, "");
                        window.open(`https://wa.me/${tel.startsWith("39") ? tel : "39" + tel}?text=${encodeURIComponent(`Ecco il documento: ${doc.nome}`)}`, "_blank");
                      }} style={{ flex: 1, padding: 8, borderRadius: 8, border: `1px solid #25d366`, background: "#25d36608", color: "#25d366", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                        <I d={ICO.messageCircle} /> WhatsApp
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* All attachments */}
            
                {/*  CRONOLOGIA  */}
                <div style={{ marginTop: 12 }}>
                  <div onClick={() => setShowCronologia(!showCronologia)} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: "8px 0" }}>
                    <span style={{ fontSize: 11 }}><I d={ICO.scroll} /></span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.text }}>Cronologia ({(c.log || []).length})</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: T.sub }}>{showCronologia ? "â–²" : "â–¼"}</span>
                  </div>
                  {showCronologia && (c.log || []).slice().reverse().map((l, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: `1px solid ${T.bg}`, fontSize: 11 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: l.color || T.acc, marginTop: 5, flexShrink: 0 }} />
                      <div><b>{l.chi}</b> {l.cosa} <span style={{ color: T.sub, fontSize: 9 }}>{l.quando}</span></div>
                    </div>
                  ))}
                </div>

                {selectedCM && (selectedCM.allegati || []).length > 0 && (
              <div style={{ padding: "0 12px 16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}><I d={ICO.paperclip} /> TUTTI GLI ALLEGATI COMMESSA ({selectedCM.allegati.length})</div>
                {(selectedCM.allegati || []).map((a: any, ai: number) => (
                  <div key={ai} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: ai < selectedCM.allegati.length - 1 ? `1px solid ${T.bdr}` : "none" }}>
                    <span><I d={ICO[a.tipo === "firma" ? "signatureEdit" : a.tipo === "fattura" ? "wallet" : a.tipo === "ordine" ? "package" : "paperclip"]} s={14} c={T.sub} /></span>
                    <div style={{ flex: 1, fontSize: 11, color: T.text, fontWeight: 600 }}>{a.nome}</div>
                    <span style={{ fontSize: 10, color: T.sub }}>{fmtData(a.data)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    {/* === CONFIGURATORE STRUTTURE === */}
    {showStrutture && <MastroStrutture onClose={() => setShowStrutture(false)} />}
      {showVoice && <VoiceAssistant onClose={() => setShowVoice(false)} />}

      {/* ═══ TALK GLOBALE — sempre visibile in tutte le schermate ═══ */}
      {tab !== "messaggi" && !talkOpen && (
        <div onClick={() => setTalkOpen(true)} style={{ position:"fixed", bottom: isDesktop ? 20 : 80, right: 20, width: 52, height: 52, borderRadius: "50%", background: "#28A0A0", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(40,160,160,.4), 0 2px 0 #156060", zIndex: 800, transition: "transform .15s" }}
          onMouseOver={(e:any) => e.currentTarget.style.transform="scale(1.08)"}
          onMouseOut={(e:any) => e.currentTarget.style.transform="scale(1)"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          {(msgs||[]).filter((m:any) => !m.letto).length > 0 && <div style={{ position:"absolute" as const, top:-3, right:-3, width:18, height:18, borderRadius:"50%", background:"#DC4444", color:"#fff", fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid #fff" }}>{(msgs||[]).filter((m:any) => !m.letto).length > 9 ? "9+" : (msgs||[]).filter((m:any) => !m.letto).length}</div>}
        </div>
      )}
      {talkOpen && (
        <div style={{ position:"fixed", bottom: isDesktop ? 20 : 80, right: 20, width: 340, height: 460, borderRadius: 16, background: "#fff", boxShadow: "0 8px 40px rgba(0,0,0,.2), 0 0 0 1px #C8E4E4", zIndex: 801, overflow: "hidden", display: "flex", flexDirection: "column" as const }}>
          <div style={{ background: "#0D1F1F", padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#28A0A0" strokeWidth="2" width="18" height="18"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 800, fontSize: 13, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>Talk <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1A9E73" }} /></div></div>
            <button onClick={() => { setTab("messaggi"); setTalkOpen(false); }} style={{ background: "none", border: "1px solid rgba(255,255,255,.1)", borderRadius: 4, padding: "2px 8px", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 9, fontWeight: 700, fontFamily: FF }}>Espandi</button>
            <button onClick={() => setTalkOpen(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 18, padding: "0 4px", lineHeight: "1" }}>&times;</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" as const, padding: 12, background: "#FAFCFC", fontSize: 12 }}>
            {(msgs||[]).slice(-20).map((m:any, i:number) => (
              <div key={i} style={{ marginBottom: 8, padding: "6px 10px", background: m.letto ? "#fff" : "#EEF8F8", borderRadius: 8, border: "1px solid #C8E4E4" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#156060" }}>{m.mittente || m.from || "Sistema"}</div>
                <div style={{ fontSize: 11, color: "#0D1F1F", marginTop: 2 }}>{m.oggetto || m.text || (m.corpo||"").substring(0,60) || "..."}</div>
                <div style={{ fontSize: 8, color: "#999", marginTop: 2 }}>{m.data || ""}</div>
              </div>
            ))}
            {(!msgs || !msgs.length) && <div style={{ textAlign: "center" as const, padding: "40px 0", color: "#999", fontSize: 11 }}>Nessun messaggio</div>}
          </div>
          <div style={{ padding: "8px 10px", borderTop: "1px solid #C8E4E4", background: "#fff", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <input type="text" placeholder="Messaggio..." style={{ flex: 1, border: "1.5px solid #C8E4E4", borderRadius: 20, padding: "7px 12px", fontSize: 11, fontFamily: FF, outline: "none", background: "#F4F8F8" }}
              onKeyDown={(e:any) => { if(e.key === "Enter" && e.target.value.trim()) { setMsgs((prev:any) => [...(prev||[]), { id: Date.now(), mittente: "Tu", oggetto: e.target.value, data: new Date().toISOString().split("T")[0], letto: true, canale: "chat" }]); e.target.value = ""; }}}
              onFocus={(e:any) => e.target.style.borderColor="#28A0A0"} onBlur={(e:any) => e.target.style.borderColor="#C8E4E4"} />
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#28A0A0", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, boxShadow: "0 2px 4px rgba(40,160,160,.3)" }}
              onClick={(e:any) => { const inp = e.currentTarget.previousSibling as HTMLInputElement; if(inp?.value?.trim()) { setMsgs((prev:any) => [...(prev||[]), { id: Date.now(), mittente: "Tu", oggetto: inp.value, data: new Date().toISOString().split("T")[0], letto: true, canale: "chat" }]); inp.value = ""; }}}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M2 2l16 8-16 8V11l10-1-10-1V2z"/></svg>
            </div>
          </div>
        </div>
      )}

    </>
    </MastroContext.Provider>
  );
}




//  ERROR BOUNDARY WRAPPER 
export default function MastroMisure() {
  return (
    <MastroErrorBoundary>
      <MastroMisureInner />
    </MastroErrorBoundary>
  );
}
