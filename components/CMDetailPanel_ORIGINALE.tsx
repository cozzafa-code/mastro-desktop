"use client";
// @ts-nocheck
// 
// MASTRO ERP · CMDetailPanel
// Estratto S6: ~938 righe (Dettaglio commessa)
// 
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { FF, ICO, Ico, I, MOTIVI_BLOCCO, TIPOLOGIE_RAPIDE , IcoKey } from "./mastro-constants";
import { buildSnapshot, creaFascicolo, getFascicoliCommessa, revocaFascicolo } from "../lib/fascicolo-service";
import { generaFascicoloGeometraPDF } from "../lib/pdf-fascicolo";
import { generaExcelFascicolo } from "../lib/excel-fascicolo";
import InterventoTab from "./InterventoTab";
import InterventoFlowPanel from "./InterventoFlowPanel";
import PreventivoConfiguratoreTab from "./PreventivoConfiguratoreTab";
import DisegnoTecnico from "./DisegnoTecnico";
// @cadDraw state added below

export default function CMDetailPanel() {
  const {
    T, S, isDesktop, isTablet, fs, PIPELINE,
    // State
    selectedCM, setSelectedCM, cantieri, setCantieri,
    selectedRilievo, setSelectedRilievo,
    cmSubTab, setCmSubTab,
    fattureDB, setFattureDB, ordiniFornDB, setOrdiniFornDB,
    montaggiDB, setMontaggiDB, squadreDB,
    ccConfirm, setCcConfirm, ccDone, setCcDone,
    firmaStep, setFirmaStep, firmaFileUrl, setFirmaFileUrl, firmaFileName, setFirmaFileName,
    fattPerc, setFattPerc, montGiorni, setMontGiorni,
    voceTempDesc, setVoceTempDesc, voceTempImporto, setVoceTempImporto, voceTempQta, setVoceTempQta,
    prevWorkspace, setPrevWorkspace, prevTab, setPrevTab,
    editingVanoId, setEditingVanoId,
    drawingVanoId, setDrawingVanoId,
    sistemiDB, coloriDB, vetriDB,
    montFormOpen, setMontFormOpen, montFormData, setMontFormData,
    viewingPhotoId, setViewingPhotoId, viewingVideoId, setViewingVideoId,
    playProgress, playingId,
    problemi,
    // NuovoVano wizard
    nvStep, setNvStep, nvTipo, setNvTipo, nvVani, setNvVani,
    nvNote, setNvNote, nvData, setNvData, nvView, setNvView,
    nvBlocchi, setNvBlocchi, nvMotivoModifica, setNvMotivoModifica,
    // Modals
    showPreventivoModal, setShowPreventivoModal,
    showModal, setShowModal, showRiepilogo, setShowRiepilogo,
    showAllegatiModal, setShowAllegatiModal, allegatiText, setAllegatiText,
    showProblemaModal, setShowProblemaModal, problemaForm, setProblemaForm,
    showProblemiView, setShowProblemiView,
    // Events
    events, setEvents,
    // Helpers
    getVaniAttivi, calcolaVanoPrezzo, deleteCommessa, deleteVano,
    exportPDF, playAllegato, setFaseTo, addAllegato, faseIndex,
    fileInputRef, fotoInputRef,
    // Navigation
    setSelectedVano, setVanoStep,
    // Business logic
    generaPreventivoPDF, creaFattura, creaOrdineFornitore,
    generaPreventivoCondivisibile,
    apriInboxDocumento,
    aziendaInfo,
  } = useMastro();

  if (!selectedCM) return null;

    const [fabSecOpen, setFabSecOpen] = React.useState(false);
    const [workWeekend, setWorkWeekend] = useState<boolean | null>(null); // null=non chiesto, true=s, false=no
    const [showAccontoModal, setShowAccontoModal] = useState(false);
    const [accontoImporto, setAccontoImporto] = useState<string>("");
    const [showOrdinePreview, setShowOrdinePreview] = useState(false);
  const [noteOrdine, setNoteOrdine] = useState("");
    const [showCadDraw, setShowCadDraw] = useState(false);
    const [interventoOpen, setInterventoOpen] = useState(null);
    const [showFascicoloModal, setShowFascicoloModal] = useState(false);
    const [fascicoloLoading, setFascicoloLoading] = useState(false);
    const [fascicoloLink, setFascicoloLink] = useState<string | null>(null);
    const [fascicoloLinkCopied, setFascicoloLinkCopied] = useState(false);
    const [fascicoloStep, setFascicoloStep] = useState<"idle"|"generato">("idle");
    const [fascicoliStorico, setFascicoliStorico] = useState<any[]>([]);

  // · CAD DRAW FULLSCREEN ·
  if (showCadDraw) {
    const m = selectedCM?.misure || {};
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#fff", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "10px 16px", background: "#1A1A1C", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#D08008", fontWeight: 700, fontSize: 14 }}>📐 {selectedCM?.nome || "Disegno"}</span>
          <button onClick={() => setShowCadDraw(false)} style={{ background: "none", border: "none", color: "#fff", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <DisegnoTecnico
            vanoId={selectedCM?.id || ""}
            vanoNome={selectedCM?.nome || "Disegno"}
            vanoDisegno={selectedCM?.cadData}
            realW={m.lCentro || m.lAlto || 1200}
            realH={m.hCentro || m.hSx || 1400}
            onUpdate={(newDisegno: any) => {
              setCantieri((cs: any[]) => cs.map(x => x.id === selectedCM?.id ? { ...x, cadData: newDisegno } : x));
              setSelectedCM((p: any) => ({ ...p, cadData: newDisegno }));
            }}
          />
        </div>
      </div>
    );
  }
    const c = selectedCM;
    const r = selectedRilievo; // rilievo corrente
    const fase = PIPELINE.find(p => p.id === c.fase);
    //  READ-ONLY: solo l'ultimo rilievo  modificabile 
    const lastRilievo = (c.rilievi || []).length > 0 ? c.rilievi[c.rilievi.length - 1] : null;
    const isLastRilievo = !r || !lastRilievo || r.id === lastRilievo.id;
    const isStorico = r && !isLastRilievo;

    //  PREVENTIVO WORKSPACE CONSTANTS 
    const CONTROT_OPT = ["Nessuno", "Standard", "Monoblocco", "Monoblocco coibentato", "Monoblocco Termico"];
    const CASS_OPT = ["", "Standard", "Coibentato", "Monoblocco", "Monoblocco Termico"];
    const COPRIFILO_OPT = ["", "PVC 40mm", "PVC 60mm", "PVC 70mm", "Alluminio 40mm", "Alluminio 60mm", "Alluminio 70mm", "Alluminio 90mm"];
    const SOGLIA_OPT = ["", "Standard", "Ribassata", "A filo pavimento", "Alluminio", "Marmo"];
    const DAVANZALE_OPT = ["", "Alluminio 150mm", "Alluminio 200mm", "Alluminio 250mm", "Alluminio 300mm", "Alluminio 350mm", "Marmo", "Pietra"];
    const ZANZ_TIPO = ["Laterale", "Verticale", "Plissè", "A rullo"];
    const PERS_TIPO = ["Alluminio", "PVC", "Legno", "Blindata"];
    const TAPP_TIPO = ["PVC", "Alluminio coibentato", "Alluminio", "Acciaio"];
    const DETRAZIONI_OPT = [
      { id: "nessuna", l: "Nessuna", perc: 0 },
      { id: "50", l: "Ristrutt. 50%", perc: 50 },
      { id: "65", l: "Ecobonus 65%", perc: 65 },
      { id: "75", l: "Barriere 75%", perc: 75 },
    ];
    const TIPI_VANO = ["F1A","F2A","F3A","PF1A","PF2A","PF3A","VAS","FISSO","SC2A","SC3A","PORTA","SCOR","BOX"];

    //  PREVENTIVO WORKSPACE VIEW 
    if (prevWorkspace) {
      const pwVani = getVaniAttivi(c);
      const pwRilievi = c.rilievi || [];
      const pwIvaDefault = c.ivaPerc || 10;
      const pwSconto = c.scontoPerc || 0;
      const pwDetr = c.detrazione || "nessuna";
      const pwDetrObj = DETRAZIONI_OPT.find(d => d.id === pwDetr);
      const pwVociLibere = c.vociLibere || [];

      const pwTotVani = pwVani.reduce((s, v) => s + calcolaVanoPrezzo(v, c) * (v.pezzi || 1), 0);
      const pwTotVoci = pwVociLibere.reduce((s, vl) => s + (vl.importo || 0) * (vl.qta || 1), 0);
      const pwSubtot = pwTotVani + pwTotVoci;
      const pwScontoVal = pwSubtot * pwSconto / 100;
      const pwImponibile = pwSubtot - pwScontoVal;
      const pwIvaCalc = pwImponibile * pwIvaDefault / 100;
      const pwTotale = pwImponibile + pwIvaCalc;
      const pwVaniNonConf = pwVani.filter(v => (v.statoMisure || "provvisorie") !== "confermate");
      const pwBloccato = pwVaniNonConf.length > 0;
      const pwDetraibile = pwDetrObj && pwDetrObj.perc > 0 ? pwImponibile * pwDetrObj.perc / 100 : 0;
      const pwFmt = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";

      const updCM = (field, val) => {
        setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, [field]: val } : cm));
        setSelectedCM(prev => ({ ...prev, [field]: val }));
      };
      const pwUpdVano = (vanoId, field, val) => {
        setCantieri(cs => cs.map(cm => {
          if (cm.id !== c.id) return cm;
          const rilievi = (cm.rilievi || []).map(r => ({
            ...r, vani: (r.vani || []).map(v => v.id === vanoId ? { ...v, [field]: val } : v)
          }));
          return { ...cm, rilievi };
        }));
        setSelectedCM(prev => ({
          ...prev, rilievi: (prev.rilievi || []).map(r => ({
            ...r, vani: (r.vani || []).map(v => v.id === vanoId ? { ...v, [field]: val } : v)
          }))
        }));
      };
      // Duplica vano come "modifica" (versioning)
      const pwDuplicaVano = (v, isModifica) => {
        const newV = { ...JSON.parse(JSON.stringify(v)), id: Date.now(), nome: v.nome + (isModifica ? " (mod.)" : " (copia)"), versione: (v.versione || 1) + (isModifica ? 1 : 0), parentId: isModifica ? v.id : undefined, dataModifica: isModifica ? new Date().toISOString().split("T")[0] : undefined };
        // Aggiungi al primo rilievo
        setCantieri(cs => cs.map(cm => {
          if (cm.id !== c.id) return cm;
          const ril = [...(cm.rilievi || [])];
          if (ril.length > 0) ril[0] = { ...ril[0], vani: [...(ril[0].vani || []), newV] };
          return { ...cm, rilievi: ril };
        }));
        setSelectedCM(prev => {
          const ril = [...(prev.rilievi || [])];
          if (ril.length > 0) ril[0] = { ...ril[0], vani: [...(ril[0].vani || []), newV] };
          return { ...prev, rilievi: ril };
        });
        setEditingVanoId(newV.id);
      };

      const chipPw = (on) => ({ padding: "7px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", background: on ? `${T.acc}15` : T.card, color: on ? T.acc : T.sub, border: `1.5px solid ${on ? T.acc : T.bdr}` });
      const chipPwGrn = (on) => ({ padding: "7px 12px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: "pointer", background: on ? `${T.grn}15` : T.card, color: on ? T.grn : T.sub, border: `1.5px solid ${on ? T.grn : T.bdr}` });
      const inputPw = { width: "100%", padding: "10px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" as any, background: T.card };
      const tabPw = (t) => ({ flex: 1, padding: "10px 4px", textAlign: "center" as any, fontSize: 11, fontWeight: 700, cursor: "pointer", borderBottom: `2.5px solid ${prevTab === t ? T.acc : "transparent"}`, color: prevTab === t ? T.acc : T.sub });

      return (
        <div style={{ paddingBottom: 80 }}>
          {/* Header sticky */}
          <div style={{ background: T.topbar || "#1A1A1C", padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, position: "sticky", top: 0, zIndex: 10 }}>
            <div onClick={() => setPrevWorkspace(false)} style={{ fontSize: 18, cursor: "pointer", color: "#fff" }}>←</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.code} · {c.cliente} {c.cognome || ""}</div>
              <div style={{ fontSize: 10, color: "#ffffff60" }}>{c.indirizzo || ""}</div>
            </div>
            {fattureDB.filter(f => f.cmId === c.id).length > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 5, background: fattureDB.filter(f => f.cmId === c.id).every(f => f.pagata) ? "#1A9E7330" : "#D0800830", color: fattureDB.filter(f => f.cmId === c.id).every(f => f.pagata) ? "#1A9E73" : "#D08008", flexShrink: 0 }}>
                {fattureDB.filter(f => f.cmId === c.id).every(f => f.pagata) ? "✓ Pagata" : "📋 Fattura"}
              </span>
            )}
            <div style={{ background: T.acc, padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 900, color: "#fff", flexShrink: 0 }}>€{pwFmt(pwTotale)}</div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", background: T.card, borderBottom: `1px solid ${T.bdr}`, position: "sticky", top: 52, zIndex: 10 }}>
            <div onClick={() => setPrevTab("sopralluogo")} style={tabPw("sopralluogo")}><I d={ICO.search} /> Report</div>
            <div onClick={() => setPrevTab("preventivo")} style={tabPw("preventivo")}><I d={ICO.clipboard} /> Preventivo</div>
            <div onClick={() => setPrevTab("riepilogo")} style={tabPw("riepilogo")}><I d={ICO.barChart} /> Riepilogo</div>
            <div onClick={() => setPrevTab("importa")} style={tabPw("importa")}><I d={ICO.download} /> Importa</div>
            <div onClick={() => setPrevTab("cad")} style={tabPw("cad")}>✓+ Disegna</div>
          </div>

          <div style={{ paddingTop: 12 }}>

          {/*  TAB SOPRALLUOGO (REPORT + DIFF)  */}
          {prevTab === "sopralluogo" && (
            <div style={{ padding: "0 12px 20px" }}>
              <div style={{ padding: 14, background: `${T.blue}10`, borderRadius: 12, marginBottom: 14, border: `1px solid ${T.blue}20` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.blue }}><I d={ICO.clipboard} /> Report Sopralluogo</div>
                  <div style={{ fontSize: 10, color: T.sub, background: T.card, padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>R{pwRilievi.length} · {pwRilievi[0]?.data || "·"}</div>
                </div>
                <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{c.cliente} {c.cognome || ""} · {c.indirizzo || ""}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
                {[
                  { l: "Vani", v: pwVani.length, col: T.acc },
                  { l: "Pezzi", v: pwVani.reduce((s, v) => s + (v.pezzi || 1), 0), col: T.blue },
                  { l: "Foto", v: pwVani.reduce((s, v) => s + (Array.isArray(v.foto) ? v.foto.length : 0), 0), col: T.grn },
                  { l: "⏹+", v: pwVani.filter(v => Object.values(v.misure || {}).filter(x => (x as number) > 0).length < 6).length, col: T.red },
                ].map((st, i) => (
                  <div key={i} style={{ background: T.card, borderRadius: 10, padding: "10px 6px", textAlign: "center", border: `1px solid ${T.bdr}` }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: st.col }}>{st.v}</div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: T.sub }}>{st.l}</div>
                  </div>
                ))}
              </div>

              {pwVani.map(v => {
                const mis = v.misure || {};
                const nMis = Object.values(mis).filter(x => (x as number) > 0).length;
                const misOk = nMis >= 6;
                const lv = mis.lCentro || v.larghezza || v.l || 0;
                const hv = mis.hCentro || v.altezza || v.h || 0;
                const hasModifica = v.parentId || pwVani.some(vx => vx.parentId === v.id);
                return (
                  <div key={v.id} style={{ background: T.card, borderRadius: 12, padding: 12, marginBottom: 10, border: `1px solid ${T.bdr}`, borderLeft: `4px solid ${misOk ? T.grn : T.orange}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800 }}>{v.nome || `Vano ${v.id}`}
                          {v.versione > 1 && <span style={{ fontSize: 9, background: `${T.purple}15`, color: T.purple, padding: "2px 6px", borderRadius: 4, marginLeft: 6 }}>v{v.versione}</span>}
                          {v.parentId && <span style={{ fontSize: 9, background: `${T.orange}15`, color: T.orange, padding: "2px 6px", borderRadius: 4, marginLeft: 4 }}>MODIFICA</span>}
                        </div>
                        <div style={{ fontSize: 10, color: T.sub }}>{v.tipo || "F2A"} · {v.stanza || "·"} · {v.piano || "PT"} · {v.pezzi || 1}pz</div>
                      </div>
                      <span style={{ fontSize: 10, background: misOk ? `${T.grn}15` : `${T.red}15`, color: misOk ? T.grn : T.red, padding: "3px 8px", borderRadius: 6, fontWeight: 700, height: "fit-content" }}>{misOk ? `✓ ${nMis}` : `⏹+ ${nMis}/6`}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 8 }}>
                      {[{ l: "Larg.", val: lv }, { l: "Alt.", val: hv }, { l: "mq", val: ((lv * hv) / 1000000).toFixed(2) }].map((m, mi) => (
                        <div key={mi} style={{ background: T.bg, borderRadius: 8, padding: 8, textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: T.sub }}>{m.l}</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: mi === 2 ? T.acc : T.text }}>{m.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.8 }}>
                      <I d={ICO.building} /> {v.sistema || c.sistema || "·"} · <I d={ICO.palette} /> {v.colore || "Bianco"} · <I d={ICO.grid} /> {v.vetro || "Standard"}
                      {v.controtelaio && v.controtelaio !== "Nessuno" && ` · 🪟 ${v.controtelaio}`}
                      {v.accessori?.tapparella?.attivo && ` · Tapp. ${v.accessori.tapparella.tipo || ""}`}
                      {v.accessori?.persiana?.attivo && ` · Pers. ${v.accessori.persiana.tipo || ""}`}
                      {v.accessori?.zanzariera?.attivo && ` · Zanz. ${v.accessori.zanzariera.tipo || ""}`}
                      {v.coprifilo && ` · Coprifilo ${v.coprifilo}`}
                      {v.soglia && ` · Soglia ${v.soglia}`}
                      {v.davanzale && ` · Davanz. ${v.davanzale}`}
                    </div>
                    {v.note && <div style={{ fontSize: 11, color: T.orange, fontWeight: 600, marginTop: 4 }}><I d={ICO.mapPin} /> {v.note}</div>}

                    {/* PDF Tecnico Fornitore badge */}
                    {v.pdfFornitore ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, padding: "7px 10px", borderRadius: 8, background: "#3B7FE010", border: "1px solid #3B7FE030" }}>
                        <span style={{ fontSize: 14 }}>📐</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#3B7FE0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {v.pdfFornitoreNome || "Disegno tecnico.pdf"}
                          </div>
                          <div style={{ fontSize: 9, color: T.sub }}>{v.pdfFornitoreData || ""}</div>
                        </div>
                        <div onClick={() => {
                          const link = document.createElement("a");
                          link.href = v.pdfFornitore;
                          link.download = v.pdfFornitoreNome || "disegno_tecnico.pdf";
                          link.click();
                        }} style={{ padding: "4px 10px", borderRadius: 6, background: "#3B7FE015", border: "1px solid #3B7FE040", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#3B7FE0", whiteSpace: "nowrap" as const }}>
                          🔗 Apri
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: 8, padding: "6px 10px", borderRadius: 8, background: "#D0800808", border: "1px dashed #D0800840", fontSize: 10, color: T.sub, display: "flex", alignItems: "center", gap: 6 }}>
                        <span>📐</span> PDF tecnico fornitore non caricato · aprire il vano per aggiungerlo
                      </div>
                    )}

                    {/* Foto gallery */}
                    {(Array.isArray(v.foto) && v.foto.length > 0) && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto" }}>
                        {v.foto.map((f, fi) => (
                          <div key={fi} style={{ minWidth: 64, height: 64, borderRadius: 8, background: `${T.blue}08`, border: `1px solid ${T.blue}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 22 }}><I d={ICO.camera} /></span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Diff: se c' una modifica, mostra differenze */}
                    {v.parentId && (() => {
                      const orig = pwVani.find(vx => vx.id === v.parentId);
                      if (!orig) return null;
                      const diffs = [];
                      if ((orig.tipo || "") !== (v.tipo || "")) diffs.push({ l: "Tipo", da: orig.tipo, a: v.tipo });
                      if ((orig.colore || "") !== (v.colore || "")) diffs.push({ l: "Colore", da: orig.colore, a: v.colore });
                      if ((orig.vetro || "") !== (v.vetro || "")) diffs.push({ l: "Vetro", da: orig.vetro, a: v.vetro });
                      if ((orig.sistema || "") !== (v.sistema || "")) diffs.push({ l: "Sistema", da: orig.sistema, a: v.sistema });
                      if ((orig.controtelaio || "") !== (v.controtelaio || "")) diffs.push({ l: "Controtelaio", da: orig.controtelaio, a: v.controtelaio });
                      const origL = orig.misure?.lCentro || orig.larghezza || orig.l || 0;
                      const origH = orig.misure?.hCentro || orig.altezza || orig.h || 0;
                      if (origL !== lv) diffs.push({ l: "Larghezza", da: origL, a: lv });
                      if (origH !== hv) diffs.push({ l: "Altezza", da: origH, a: hv });
                      if (diffs.length === 0) return null;
                      return (
                        <div style={{ marginTop: 8, padding: 8, background: `${T.purple}08`, borderRadius: 8, border: `1px solid ${T.purple}20` }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: T.purple, marginBottom: 4 }}><I d={ICO.refreshCw} /> Differenze da originale</div>
                          {diffs.map((d, di) => (
                            <div key={di} style={{ fontSize: 10, display: "flex", gap: 4, marginBottom: 2 }}>
                              <span style={{ fontWeight: 700, color: T.sub, width: 70 }}>{d.l}:</span>
                              <span style={{ color: T.red, textDecoration: "line-through" }}>{d.da || "·"}</span>
                              <span style={{ color: T.sub }}>→</span>
                              <span style={{ color: T.grn, fontWeight: 700 }}>{d.a || "·"}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}

                    {/* Quick actions */}
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <div onClick={() => { setPrevTab("preventivo"); setEditingVanoId(v.id); }} style={{ flex: 1, padding: "6px 0", borderRadius: 6, textAlign: "center", fontSize: 10, fontWeight: 700, color: T.acc, background: `${T.acc}08`, cursor: "pointer", border: `1px solid ${T.acc}20` }}><I d={ICO.clipboard} /> Modifica nel preventivo</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/*  TAB PREVENTIVO (EDITOR)  */}
          {prevTab === "preventivo" && (
            <div style={{ padding: "0 12px 20px" }}>
              <PreventivoConfiguratoreTab />
            </div>
          )}

          {/*  TAB RIEPILOGO  */}
          {prevTab === "riepilogo" && (
            <div style={{ padding: "0 12px 20px" }}>
              <div style={{ background: T.topbar || "#1A1A1C", borderRadius: 12, padding: 16, marginBottom: 12, color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div><div style={{ fontSize: 10, color: "#ffffff60" }}>PREVENTIVO</div><div style={{ fontSize: 26, fontWeight: 900, marginTop: 2 }}>€{pwFmt(pwTotale)}</div></div>
                  {pwDetrObj && pwDetrObj.perc > 0 && (<div style={{ background: `${T.grn}30`, borderRadius: 8, padding: "6px 10px", textAlign: "right" as any }}><div style={{ fontSize: 9, color: "#ffffffa0" }}>{pwDetrObj.l}</div><div style={{ fontSize: 14, fontWeight: 900, color: "#4ade80" }}>-€{pwFmt(pwDetraibile)}</div></div>)}
                </div>
                <div style={{ fontSize: 10, color: "#ffffff60", marginTop: 6 }}>{c.code} · {c.cliente} · {pwVani.length} vani · {pwVani.reduce((s, v) => s + (v.pezzi || 1), 0)}pz</div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 6 }}>INFISSI</div>
              {pwVani.map(v => {
                const pv = calcolaVanoPrezzo(v, c) * (v.pezzi || 1);
                const lv = v.misure?.lCentro || v.larghezza || v.l || 0;
                const hv = v.misure?.hCentro || v.altezza || v.h || 0;
                const ac = v.accessori || {};
                return (
                  <div key={v.id} style={{ padding: "8px 0", borderBottom: `1px solid ${T.bdr}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ fontWeight: 700 }}>{v.nome || "Vano"}{v.parentId ? " <I d={ICO.refreshCw} />" : ""}</span>
                      <span style={{ fontWeight: 800, color: T.acc }}>€{pwFmt(pv)}</span>
                    </div>
                    <div style={{ fontSize: 9, color: T.sub }}>{v.tipo} · {lv}{hv} · {v.pezzi || 1}pz · {v.colore || "B."} · {v.vetro || "Std"}{v.controtelaio && v.controtelaio !== "Nessuno" ? ` · CT: ${v.controtelaio}` : ""}{ac.tapparella?.attivo ? ` · Tapp. ${ac.tapparella.tipo || ""}` : ""}{ac.persiana?.attivo ? ` · Pers. ${ac.persiana.tipo || ""}` : ""}{ac.zanzariera?.attivo ? ` · Zanz. ${ac.zanzariera.tipo || ""}` : ""}{v.coprifilo ? ` · CF: ${v.coprifilo}` : ""}{v.soglia ? ` · Soglia: ${v.soglia}` : ""}</div>
                  </div>
                );
              })}

              {pwVociLibere.length > 0 && (<><div style={{ fontSize: 11, fontWeight: 800, marginTop: 12, marginBottom: 6 }}>LAVORI</div>
                {pwVociLibere.map((vl, i) => (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.bdr}`, fontSize: 11 }}><span>{vl.desc} <span style={{ color: T.sub, fontSize: 9 }}>{vl.qta || 1}</span></span><span style={{ fontWeight: 700 }}>€{pwFmt((vl.importo || 0) * (vl.qta || 1))}</span></div>))}</>)}

              <div style={{ background: T.card, borderRadius: 12, padding: 14, marginTop: 14, border: `1px solid ${T.bdr}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span style={{ color: T.sub }}>Subtotale</span><span>€{pwFmt(pwSubtot)}</span></div>
                {pwSconto > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span style={{ color: T.grn }}>Sconto {pwSconto}%</span><span style={{ color: T.grn, fontWeight: 700 }}>-€{pwFmt(pwScontoVal)}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}><span style={{ color: T.sub }}>Imponibile</span><span style={{ fontWeight: 700 }}>€{pwFmt(pwImponibile)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}><span style={{ color: T.sub }}>IVA {pwIvaDefault}%</span><span>€{pwFmt(pwIvaCalc)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: `2px solid ${T.acc}`, paddingTop: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 900 }}>TOTALE</span>
                  <span style={{ fontSize: 22, fontWeight: 900, color: T.acc }}>€{pwFmt(pwTotale)}</span>
                </div>
                {pwDetrObj && pwDetrObj.perc > 0 && (<>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "8px 10px", background: `${T.grn}10`, borderRadius: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: T.grn }}><I d={ICO.building} /> {pwDetrObj.l}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: T.grn }}>-€{pwFmt(pwDetraibile)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700 }}>Costo effettivo</span>
                    <span style={{ fontSize: 16, fontWeight: 900 }}>€{pwFmt(pwTotale - pwDetraibile)}</span>
                  </div>
                </>)}
              </div>

              {c.notePreventivo && (
                <div style={{ marginTop: 12, padding: 12, background: T.bg, borderRadius: 10, fontSize: 10, color: T.sub, lineHeight: 1.8 }}>
                  <div style={{ fontWeight: 700, color: T.text, marginBottom: 4 }}>NOTE</div>
                  <div style={{ whiteSpace: "pre-wrap" as any }}>{c.notePreventivo}</div>
                </div>
              )}

              <div style={{ marginTop: 16, display: "flex", gap: 8, marginBottom: 8 }}>
                <button onClick={() => generaPreventivoPDF(c)} style={{ flex: 1, padding: 14, borderRadius: 10, background: `${T.acc}10`, color: T.acc, border: `1.5px solid ${T.acc}`, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.fileText} /> PDF</button>
                <button onClick={() => generaPreventivoCondivisibile(c)} style={{ flex: 1, padding: 14, borderRadius: 10, background: T.card, color: T.sub, border: `1.5px solid ${T.bdr}`, fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.eye} /> Anteprima</button>
              </div>
              <button onClick={async () => {
                generaPreventivoPDF(c);
                const url = await generaPreventivoCondivisibile(c);
                updCM("preventivoInviato", true);
                updCM("dataPreventivoInvio", new Date().toISOString().split("T")[0]);
                if (url) updCM("linkPreventivo", url);
                setCcDone("📐 PDF scaricato + link firma inviato!"); setTimeout(() => setCcDone(null), 3000);
              }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: "#25d366", color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.upload} /> GENERA PDF + INVIA CON FIRMA →</button>
              <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginTop: 4 }}>Scarica PDF e apre WhatsApp con link firma elettronica</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
                <span onClick={() => { updCM("preventivoInviato", true); setCcDone("✓ Completato"); setTimeout(() => { setCcDone(null); setPrevWorkspace(false); }, 2000); }} style={{ fontSize: 10, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>✓ Segna completato</span>
              </div>

              {/*  FASCICOLO GEOMETRA  */}
              <div style={{ marginTop: 16, borderTop: `1px solid ${T.bdr}`, paddingTop: 14 }}>
                <button
                  onClick={async () => {
                    setShowFascicoloModal(true);
                    setFascicoloStep("idle");
                    setFascicoloLink(null);
                    const storico = await getFascicoliCommessa(c.id);
                    setFascicoliStorico(storico);
                  }}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #2D7A6B 0%, #1A9E73 100%)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  <span style={{ fontSize: 16 }}>📐</span> Fascicolo Geometra
                </button>
                <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginTop: 4 }}>PDF tecnico · Link cliente · Excel ENEA</div>
              </div>
              {/* Avanti dopo invio · solo se non ancora confermato */}
              {c.preventivoInviato && faseIndex(c.fase) < faseIndex("conferma") && (
                <button onClick={() => { setFaseTo(c.id, "conferma"); setPrevWorkspace(false); setCcDone(null); }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}><I d={ICO.edit} />€+ AVANTI → Conferma ordine</button>
              )}
              {ccDone && <div style={{ marginTop: 8, padding: "8px 10px", borderRadius: 8, background: "#34c75918", border: "1px solid #34c75940", fontSize: 12, fontWeight: 700, color: "#34c759", textAlign: "center" }}>{ccDone}</div>}
            </div>
          )}

          {/*  TAB IMPORTA (da competitor / documento)  */}
          {prevTab === "cad" && (
            <div style={{ padding: 16 }}>
              <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: 20, textAlign: "center" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✓+</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.text, marginBottom: 6 }}>Disegnatore tecnico</div>
                <div style={{ fontSize: 12, color: T.sub, marginBottom: 16, lineHeight: 1.6 }}>
                  Disegna profili, telai, forme libere direttamente sul tablet.<br/>
                  Ogni linea diventa un profilo serramentistico con quote automatiche.
                </div>
                <button
                  onClick={() => setShowCadDraw(true)}
                  style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                  ✓+ Apri disegnatore
                </button>
                {c.cadData && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "#1A9E7312", borderRadius: 10, border: "1px solid #1A9E7330" }}>
                    <div style={{ fontSize: 11, color: "#1A9E73", fontWeight: 700 }}>
                      ✓ {c.cadData.oggetti?.length || 0} elementi disegnati
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {prevTab === "importa" && (
            <div style={{ padding: "0 12px 20px" }}>
              <div style={{ padding: 16, background: `${T.blue}08`, borderRadius: 12, marginBottom: 12, border: `1px solid ${T.blue}20` }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.blue, marginBottom: 4 }}><I d={ICO.download} /> Importa preventivo competitor</div>
                <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.6 }}>Scansiona o carica il preventivo di un competitor. MASTRO rilever+ automaticamente misure, colori, tipologie, coprifili e creer+ un preventivo da rivedere.</div>
              </div>

              {/* Upload options */}
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1, padding: 20, background: T.card, borderRadius: 12, border: `2px dashed ${T.blue}40`, textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}><I d={ICO.camera} /></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.blue }}>Scatta foto</div>
                  <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>Inquadra il preventivo</div>
                </div>
                <div style={{ flex: 1, padding: 20, background: T.card, borderRadius: 12, border: `2px dashed ${T.acc}40`, textAlign: "center", cursor: "pointer" }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}><I d={ICO.fileText} /></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.acc }}>Carica file</div>
                  <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>PDF, Word, immagine</div>
                </div>
              </div>

              {/* Esempio risultato AI */}
              <div style={{ background: T.card, borderRadius: 12, padding: 14, border: `1px solid ${T.bdr}`, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: T.purple, marginBottom: 8 }}><I d={ICO.cpu} /> Esempio: cosa rileva MASTRO</div>
                <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.8 }}>
                  <div style={{ marginBottom: 6 }}>Dal documento competitor, MASTRO estrae:</div>
                  {[
                    { icon: "📐", t: "Misure", d: "Larghezza  altezza per ogni vano" },
                    { icon: "🎵", t: "Colori", d: "Bianco, Antracite, Rovere, ecc." },
                    { icon: "?", t: "Tipologie", d: "F2A, PF2A, Scorrevole, ecc." },
                    { icon: "", t: "Controtelai", d: "Standard, Monoblocco" },
                    { icon: "🏭", t: "Accessori", d: "Tapparelle, persiane, zanzariere" },
                    { icon: "📦", t: "Complementi", d: "Coprifili, soglie, davanzali" },
                    { icon: "€", t: "Prezzi competitor", d: "Per confronto (non importati)" },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      <span>{r.icon}</span>
                      <span style={{ fontWeight: 700, color: T.text, width: 80 }}>{r.t}</span>
                      <span style={{ color: T.sub }}>{r.d}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: 12, background: `${T.grn}08`, borderRadius: 10, border: `1px solid ${T.grn}20`, fontSize: 11, color: T.grn, fontWeight: 600, textAlign: "center" }}>
                <I d={ICO.sparkles} /> MASTRO crea il preventivo, tu rivedi solo sistema e prezzi
              </div>
            </div>
          )}

          </div>

          {/* FAB · navigate sections · GRANDE con menu espandibile */}
          {editingVanoId && prevTab === "preventivo" && (() => {
            const secs = [
              { id: "foto", ico: <I d={ICO.camera} />, label: "Foto" },
              { id: "tipo", ico: <I d={ICO.fileText} />, label: "Tipo" },
              { id: "misure", ico: <I d={ICO.ruler} />, label: "Misure" },
              { id: "sistema", ico: <I d={ICO.building} />, label: "Sistema" },
              { id: "ct", ico: <I d={ICO.square} />, label: "Controtelaio" },
              { id: "acc", ico: <I d={ICO.home} />, label: "Accessori" },
              { id: "prezzo", ico: <I d={ICO.euro} />, label: "Prezzo" },
            ];
            const fabOpen = fabSecOpen;
            const setFabOpen = setFabSecOpen;
            return (
              <>
                {/* Overlay quando aperto */}
                {fabOpen && <div onClick={() => setFabOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98, background: "rgba(0,0,0,0.15)" }} />}
                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

                <div style={{ position: "fixed", bottom: 84, right: 16, zIndex: 99, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  {/* Menu espanso */}
                  {fabOpen && secs.map((s, si) => (
                    <div key={s.id} onClick={() => {
                      document.getElementById(`pw-sec-${s.id}-${editingVanoId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                      setFabOpen(false);
                    }} style={{
                      display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                      animation: `fadeIn 0.15s ease ${si * 0.03}s both`,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.65)", padding: "5px 10px", borderRadius: 8, backdropFilter: "blur(4px)" }}>{s.label}</span>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 20, background: T.card, border: `1.5px solid ${T.bdr}`, boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        cursor: "pointer",
                      }}>{s.ico}</div>
                    </div>
                  ))}

                  {/* FAB principale */}
                  <div onClick={() => setFabOpen(!fabOpen)} style={{
                    width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", background: T.acc, boxShadow: "0 4px 20px rgba(208,128,8,0.35)",
                    transition: "transform 0.2s", transform: fabOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}>
                    <span style={{ fontSize: 26, color: "#fff", lineHeight: 1 }}>+</span>
                  </div>
                </div>
              </>
            );
          })()}

        </div>
      );
    }

    // Vani del rilievo corrente
    const vaniList = r?.vani || [];
    // Compatibilit+ wizard vecchio
    const viste = []; // non più usato con nuova arch
    const vaniM: number[] = [];
    const vaniA = vaniList;
    const tipoRil = r?.tipo || "rilievo";
    const tipoColRil = tipoRil === "definitiva" ? T.grn : tipoRil === "modifica" ? T.orange : T.blue;
    const tipoIcoRil = tipoRil === "definitiva" ? "checkCircle" : tipoRil === "modifica" ? "wrench" : "mapPin";
    const tipoLblRil = tipoRil === "definitiva" ? "Misure Definitive" : tipoRil === "modifica" ? "Modifica" : "Rilievo Misure";

    // Calcolo avanzamento misure
    const vaniMisurati = vaniList.filter(v => Object.values(v.misure || {}).filter(x => (x as number) > 0).length >= 6);
    const vaniBloccati = vaniList.filter(v => v.note?.startsWith("+ BLOCCATO"));
    const vaniDaFare   = vaniList.filter(v => vaniMisurati.every(m => m.id !== v.id));
    const progVani = vaniList.length > 0 ? Math.round(vaniMisurati.length / vaniList.length * 100) : 0;
    const tutteMis = vaniMisurati.length === vaniList.length && vaniList.length > 0;

    // == Wizard helpers (legacy) ==
    function togV(id) { setNvVani(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
    function togB(id) {
      setNvBlocchi(b => b[id]
        ? (()=>{ const n = {...b}; delete n[id]; return n; })()
        : { ...b, [id]: { motivo: "", note: "" } }
      );
    }
    function sbF(id, f, v) { setNvBlocchi(b => ({ ...b, [id]: { ...b[id], [f]: v } })); }
    function salvaVisita() {
      const vaniBloccati = Object.entries(nvBlocchi).map(([id, b]) => ({
        vanoId: parseInt(id), motivo: b.motivo || "Altro", note: b.note || ""
      }));
      const stato = nvTipo === "modifica" ? "modifica" :
        nvVani.length === vaniA.length && vaniBloccati.length === 0 ? "completo" : "parziale";
      const nuova = {
        id: Date.now(), n: viste.length + 1,
        data: nvData.data || new Date().toISOString().split("T")[0],
        ora: nvData.ora || "", rilevatore: nvData.rilevatore || "",
        tipo: nvTipo, motivoModifica: nvMotivoModifica,
        stato, vaniMisurati: nvVani.map(Number), vaniBloccati, note: nvNote
      };
      setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, visite: [...(x.visite||[]), nuova] } : x));
      setSelectedCM(prev => ({ ...prev, visite: [...(prev.visite||[]), nuova] }));
      setNvView(false); setNvStep(1);
      setNvData({ data: "", ora: "", rilevatore: "" });
      setNvTipo("rilievo"); setNvMotivoModifica("");
      setNvVani([]); setNvBlocchi({}); setNvNote("");
    }

    // == VISTA WIZARD ==
    if (nvView) return (
      <div style={{ paddingBottom: 80 }}>
        {/* Header wizard */}
        <div style={{ ...S.header }}>
          <div onClick={() => { setNvView(false); setNvStep(1); }} style={{ cursor: "pointer", padding: 4 }}><Ico d={ICO.back} s={20} c={T.sub} /></div>
          <div style={{ flex: 1 }}>
            <div style={S.headerTitle}>Nuova visita</div>
            <div style={S.headerSub}>{c.code} · {c.cliente}</div>
          </div>
          <div style={{ fontSize: 11, color: T.sub }}>Step {nvStep}/5</div>
        </div>
        {/* Tab step */}
        <div style={{ display: "flex", background: T.card, borderBottom: `1px solid ${T.bdr}` }}>
          {["Tipo", "Dati", "Vani", "Blocchi", "Salva"].map((l, i) => (
            <div key={i} onClick={() => i < nvStep && setNvStep(i+1)}
              style={{ flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 10, fontWeight: 600,
                borderBottom: `2px solid ${nvStep===i+1 ? T.acc : "transparent"}`,
                color: nvStep===i+1 ? T.acc : T.sub, cursor: i < nvStep ? "pointer" : "default" }}>
              {l}
            </div>
          ))}
        </div>
        <div style={{ padding: "16px" }}>
          {/* STEP 1 · Tipo visita */}
          {nvStep === 1 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}><I d={ICO.tag} /> Tipo di visita</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Seleziona il tipo di sopralluogo</div>
            {[
              { k: "rilievo",    ico: <I d={ICO.ruler} />, label: "Rilievo misure",     desc: "Prima visita o misure di vani mancanti" },
              { k: "definitiva", ico: "✓", label: "Misure definitive",  desc: "Conferma finale di tutte le misure" },
              { k: "modifica",   ico: <I d={ICO.wrench} />, label: "Modifica cantiere",  desc: "Variazione, problema o sopralluogo post-vendita" },
            ].map(t => (
              <div key={t.k} onClick={() => setNvTipo(t.k)}
                style={{ ...S.card, padding: "13px 14px", marginBottom: 10, cursor: "pointer",
                  border: `1.5px solid ${nvTipo === t.k ? T.acc : T.bdr}`,
                  background: nvTipo === t.k ? T.accLt : T.card,
                  display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 24 }}>{t.ico}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: nvTipo === t.k ? T.acc : T.text }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{t.desc}</div>
                </div>
                <div style={{ width: 20, height: 20, borderRadius: "50%",
                  border: `2px solid ${nvTipo === t.k ? T.acc : T.bdr}`,
                  background: nvTipo === t.k ? T.acc : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontSize: 12 }}>{nvTipo === t.k ? "✓" : ""}</div>
              </div>
            ))}
            {nvTipo === "modifica" && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>MOTIVO MODIFICA</div>
                <input style={S.input} placeholder="Es: cliente ha cambiato idea su un vano, problema rilevato..." value={nvMotivoModifica} onChange={e => setNvMotivoModifica(e.target.value)} />
              </div>
            )}
            <button onClick={() => setNvStep(2)} style={{ ...S.btn, marginTop: 12, width: "100%" }}>Avanti →</button>
          </>}
          {/* STEP 2 · Dati */}
          {nvStep === 2 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}><I d={ICO.clipboard} /> Dati della visita</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>DATA</div>
                <input style={S.input} type="date" value={nvData.data} onChange={e => setNvData(d => ({...d, data: e.target.value}))} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>ORA</div>
                <input style={S.input} type="time" value={nvData.ora} onChange={e => setNvData(d => ({...d, ora: e.target.value}))} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>RILEVATORE</div>
                <input style={S.input} placeholder="Chi ha eseguito il rilievo..." value={nvData.rilevatore} onChange={e => setNvData(d => ({...d, rilevatore: e.target.value}))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={() => setNvStep(1)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Indietro</button>
              <button onClick={() => setNvStep(3)} style={{ ...S.btn, flex: 2 }}>Avanti →</button>
            </div>
          </>}
          {/* STEP 2 · Vani misurati */}
          {nvStep === 3 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>✓ Vani misurati</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Seleziona i vani che hai misurato</div>
            {vaniA.length === 0
              ? <div style={{ textAlign: "center", padding: "20px", color: T.sub }}>Tutti gi+ misurati!</div>
              : vaniA.map(v => (
                <div key={v.id} onClick={() => togV(v.id)} style={{
                  ...S.card, padding: "12px 14px", marginBottom: 8, cursor: "pointer",
                  border: `1.5px solid ${nvVani.includes(v.id) ? T.grn : T.bdr}`,
                  background: nvVani.includes(v.id) ? T.grnLt : T.card,
                  display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{v.nome}</div>
                    <div style={{ fontSize: 11, color: T.sub }}>~{v.mq}m²</div>
                  </div>
                  <div style={{ width: 24, height: 24, borderRadius: 6,
                    border: `2px solid ${nvVani.includes(v.id) ? T.grn : T.bdr}`,
                    background: nvVani.includes(v.id) ? T.grn : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 14 }}>
                    {nvVani.includes(v.id) ? "✓" : ""}
                  </div>
                </div>
              ))
            }
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setNvStep(2)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Indietro</button>
              <button onClick={() => setNvStep(4)} style={{ ...S.btn, flex: 2 }}>Avanti →</button>
            </div>
          </>}
          {/* STEP 4 · Vani bloccati */}
          {nvStep === 4 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}><I d={ICO.alertTriangle} /> Vani non misurati</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 14 }}>Indica il motivo per ogni vano saltato</div>
            {vaniA.filter(v => !nvVani.includes(v.id)).map(v => {
              const hB = !!nvBlocchi[v.id];
              return (
                <div key={v.id} style={{ ...S.card, marginBottom: 10, overflow: "hidden", border: `1.5px solid ${hB ? T.red : T.bdr}` }}>
                  <div onClick={() => togB(v.id)} style={{ padding: "11px 14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: hB ? T.redLt : T.card }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{v.nome}</div>
                      <div style={{ fontSize: 11, color: T.sub }}>{hB ? "Indica motivo" : "Tocca per segnare bloccato"}</div>
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${hB ? T.red : T.bdr}`, background: hB ? T.red : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>
                      {hB ? "✓" : ""}
                    </div>
                  </div>
                  {hB && (
                    <div style={{ padding: "0 14px 12px", background: T.redLt }}>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8, paddingTop: 8 }}>
                        {MOTIVI_BLOCCO.map(m => (
                          <div key={m} onClick={() => sbF(v.id, "motivo", m)} style={{
                            padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: "pointer",
                            background: nvBlocchi[v.id]?.motivo === m ? T.red : T.card,
                            border: `1.5px solid ${nvBlocchi[v.id]?.motivo === m ? T.red : T.bdr}`,
                            color: nvBlocchi[v.id]?.motivo === m ? "#fff" : T.sub
                          }}>{m}</div>
                        ))}
                      </div>
                      <input style={S.input} placeholder="Note aggiuntive..." value={nvBlocchi[v.id]?.note || ""} onChange={e => sbF(v.id, "note", e.target.value)} />
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginBottom: 5 }}>NOTE GENERALI</div>
              <textarea style={{ ...S.input, minHeight: 70, resize: "vertical" }} placeholder="Osservazioni sull'intera visita..." value={nvNote} onChange={e => setNvNote(e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={() => setNvStep(3)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Indietro</button>
              <button onClick={() => setNvStep(5)} style={{ ...S.btn, flex: 2 }}>Avanti →</button>
            </div>
          </>}
          {/* STEP 5 · Riepilogo */}
          {nvStep === 5 && <>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}><I d={ICO.clipboard} /> Riepilogo</div>
            <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: T.sub }}><I d={ICO.calendar} /> {nvData.data ? new Date(nvData.data + "T12:00:00").toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" }) : "·"} · <I d={ICO.clock} /> {nvData.ora || "--:--"}</div>
              <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}><I d={ICO.user} /> {nvData.rilevatore || "Non specificato"}</div>
            </div>
            {nvVani.length > 0 && (
              <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10, border: `1px solid ${T.grn}40` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.grn, marginBottom: 7 }}>✓ Misurati</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {nvVani.map(id => { const v = vaniA.find(x => x.id === id); return <span key={id} style={S.badge(T.grnLt, T.grn)}>{v?.nome}</span>; })}
                </div>
              </div>
            )}
            {Object.keys(nvBlocchi).length > 0 && (
              <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10, border: `1px solid ${T.red}40` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red, marginBottom: 7 }}><I d={ICO.alertTriangle} /> Bloccati</div>
                {Object.entries(nvBlocchi).map(([id, b]) => {
                  const v = vaniA.find(x => x.id === parseInt(id));
                  return <div key={id} style={{ fontSize: 11, marginBottom: 4 }}><strong>{v?.nome}</strong>: {b.motivo || "·"}{b.note && ` · ${b.note}`}</div>;
                })}
              </div>
            )}
            {nvNote && <div style={{ ...S.card, padding: "12px 14px", marginBottom: 10, fontStyle: "italic", fontSize: 11, color: T.sub }}>"{nvNote}"</div>}
            <div style={{ ...S.card, padding: "10px 14px", marginBottom: 10, background: T.accLt, border: `1px solid ${T.acc}30` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: T.acc, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Tipo visita</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.acc }}>
                {nvTipo === "rilievo" ? "📐 Rilievo misure" : nvTipo === "definitiva" ? "✓ Misure definitive" : "🔧 Modifica cantiere"}
              </div>
              {nvTipo === "modifica" && nvMotivoModifica && <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{nvMotivoModifica}</div>}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setNvStep(4)} style={{ ...S.btnCancel, flex: 1, border: `1px solid ${T.bdr}` }}>← Modifica</button>
              <button onClick={salvaVisita} style={{ ...S.btn, flex: 2, background: T.grn }}>✓ Salva visita</button>
            </div>
          </>}
        </div>
      </div>
    );

    // == VISTA RILIEVO CON VANI ==
    return (
      <div style={{ paddingBottom: 80 }}>
        {/* Header rilievo */}
        <div style={{ ...S.header }}>
          <div onClick={() => { setSelectedRilievo(null); setCmSubTab("rilievi"); }} style={{ cursor: "pointer", padding: "8px 12px", borderRadius: 8, background: T.bg, border: `1px solid ${T.bdr}`, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: T.text }}><Ico d={ICO.back} s={16} c={T.text} /> Indietro</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.sub} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{tipoRil === "definitiva" ? <><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></> : tipoRil === "modifica" ? <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/> : <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>}</svg>
              <div style={S.headerTitle}>{tipoLblRil} · R{r?.n}</div>
            </div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 1 }}><span style={{ fontFamily: "monospace", fontWeight: 700, color: T.acc }}>{c.code}</span> · {c.cliente} {c.cognome || ""} · {r?.data ? new Date(r.data + "T12:00:00").toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" }) : ""}</div>
          </div>
          {vaniList.length > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: tipoColRil }}>{progVani}%</div>
              <div style={{ fontSize: 10, color: T.sub }}>{vaniMisurati.length}/{vaniList.length} vani</div>
            </div>
          )}
          <div onClick={() => setShowRiepilogo(true)} style={{ padding: "6px 10px", borderRadius: 6, background: T.accLt, cursor: "pointer", marginLeft: 6 }}>
            <span style={{ fontSize: 14 }}><I d={ICO.clipboard} /></span>
          </div>
          <div onClick={exportPDF} style={{ padding: "6px 10px", borderRadius: 6, background: T.redLt, cursor: "pointer" }}>
            <Ico d={ICO.file} s={16} c={T.red} />
          </div>
        </div>

        {/* Banner rilievo info */}
        {r?.motivoModifica && (
          <div style={{ margin: "4px 16px 0", padding: "8px 12px", background: T.orangeLt, borderRadius: 8, border: `1px solid ${T.orange}30`, fontSize: 12, color: T.orange }}>
            <I d={ICO.wrench} /> <strong>Modifica:</strong> {r.motivoModifica}
          </div>
        )}

        {/* Barra progresso vani */}
        {vaniList.length > 0 && (
          <div style={{ padding: "8px 16px" }}>
            <div style={{ height: 5, background: T.bdr, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
              <div style={{ height: "100%", width: `${progVani}%`, background: progVani === 100 ? T.grn : tipoColRil, borderRadius: 3 }} />
            </div>
            {vaniDaFare.filter(v => !v.note?.startsWith("+")).length > 0 && <div style={{ fontSize: 11, color: T.red, fontWeight: 600 }}>Mancano misure: {vaniDaFare.filter(v => !v.note?.startsWith("+")).map(v => v.nome).join(", ")}</div>}
            {tutteMis && <div style={{ fontSize: 11, color: T.grn, fontWeight: 600 }}>✓ Tutte le misure raccolte</div>}
          </div>
        )}

        {/* Info badges */}
        <div style={{ padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {c.tipo === "riparazione" && <span style={S.badge(T.orangeLt, T.orange)}><I d={ICO.wrench} /> Riparazione</span>}
          {c.tipo === "nuova" && <span style={S.badge(T.grnLt, T.grn)}>Nuova</span>}
          {c.sistema && <span style={S.badge(T.blueLt, T.blue)}>{c.sistema}</span>}
          {c.difficoltaSalita && <span style={S.badge(c.difficoltaSalita === "facile" ? T.grnLt : c.difficoltaSalita === "media" ? T.orangeLt : T.redLt, c.difficoltaSalita === "facile" ? T.grn : c.difficoltaSalita === "media" ? T.orange : T.red)}>Salita: {c.difficoltaSalita}</span>}
          {c.mezzoSalita && <span style={S.badge(T.purpleLt, T.purple)}>{c.mezzoSalita}</span>}
          {c.pianoEdificio && <span style={S.badge(T.blueLt, T.blue)}>Piano: {c.pianoEdificio}</span>}
          {c.foroScale && <span style={S.badge(T.redLt, T.red)}>Foro: {c.foroScale}</span>}
          {c.telefono && <span onClick={() => window.location.href=`tel:${c.telefono}`} style={{ ...S.badge(T.grnLt, T.grn), cursor: "pointer" }}><I d={ICO.phone} /> {c.telefono}</span>}
        </div>
        {c.note && <div style={{ padding: "0 16px", marginBottom: 6 }}><div style={{ padding: "8px 12px", borderRadius: 8, background: T.card, border: `1px solid ${T.bdr}`, fontSize: 12, color: T.sub, lineHeight: 1.4 }}><I d={ICO.fileText} /> {c.note}</div></div>}

        {/* Centro Comando inline · replaces old phase panels */}
        {(() => {
          const vaniCC = getVaniAttivi(c);
          const rilieviCC = c.rilievi || [];
          const vaniConPrezzoCC = vaniCC.filter(v => calcolaVanoPrezzo(v, c) > 0);
          const totVaniCC = vaniCC.reduce((s, v) => s + calcolaVanoPrezzo(v, c), 0);
          const totVociCC = (c.vociLibere || []).reduce((s, vl) => s + ((vl.importo || 0) * (vl.qta || 1)), 0);
          const totPrevCC = totVaniCC + totVociCC;
          const ivaPercCC = c.ivaPerc || 10;
          const totIvaCC = totPrevCC * (1 + ivaPercCC / 100);
          const hasFirmaCC = !!c.firmaCliente;
          const fattCC = fattureDB.filter(f => f.cmId === c.id);
          const hasFattCC = fattCC.some(f => f.tipo === "acconto" || f.tipo === "unica");
          const ordCC = ordiniFornDB.filter(o => o.cmId === c.id);
          const hasOrdCC = ordCC.length > 0;
          const ordConfCC = ordCC.some(o => o.conferma?.ricevuta);
          const confFirmCC = ordCC.some(o => o.conferma?.firmata);
          const montCC = montaggiDB.filter(m => m.cmId === c.id);
          const hasMontCC = montCC.length > 0;
          const hasSaldoCC = fattCC.some(f => f.tipo === "saldo");
          const saldoPagCC = fattCC.find(f => f.tipo === "saldo")?.pagata;
          const unicaPagCC = fattCC.find(f => f.tipo === "unica")?.pagata;
          const incassatoCC = fattCC.filter(f => f.pagata).reduce((s, f) => s + (f.importo || 0), 0);
          const tuttoCC = (hasSaldoCC && saldoPagCC) || (fattCC.some(f => f.tipo === "unica") && unicaPagCC) || (c.fase === "chiusura" && incassatoCC >= totIvaCC) || (incassatoCC >= totIvaCC && fattCC.length > 0 && fattCC.every(f => f.pagata));
          const fmtCC = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0,00";

          const skipped = (id) => (c.skipLog || []).some(s => s.fase === id);
          const stepsCC = [
            { id: "sopralluogo", icon: "mapPin", l: "Rilievo",    done: (rilieviCC.length > 0 && vaniCC.length > 0) || skipped("sopralluogo"), skipped: skipped("sopralluogo"), desc: "Misure, foto, note dal cantiere" },
            { id: "preventivo",  icon: "fileText", l: "Preventivo", done: !!c.preventivoInviato || skipped("preventivo"),  skipped: skipped("preventivo"),  desc: "Rivedi prezzi, sconti, condizioni" },
            { id: "conferma",    icon: "✍️",  l: "Firma",      done: hasFirmaCC || skipped("conferma"),               skipped: skipped("conferma"),    desc: "Firma cliente e conferma ordine" },
            { id: "ordini",      icon: "package", l: "Ordine",     done: hasOrdCC || skipped("ordini"),                   skipped: skipped("ordini"),      desc: "Ordina materiali ai fornitori" },
            { id: "produzione",  icon: "🏭", l: "Produzione", done: confFirmCC || skipped("produzione"),             skipped: skipped("produzione"),  desc: "Attesa materiali e lavorazione" },
            { id: "posa",        icon: "wrench", l: "Posa",       done: montCC.some(m => ["completato","collaudo","chiuso"].includes(m.interventoStato || m.stato)) || skipped("posa"), skipped: skipped("posa"), desc: "Montaggio al cantiere" },
            { id: "collaudo",    icon: "checkCircle", l: "Collaudo",   done: !!c.collaudoOk || montCC.some(m => ["collaudo","chiuso"].includes(m.interventoStato)) || skipped("collaudo"), skipped: skipped("collaudo"), desc: "Verifica lavoro, foto finale" },
            { id: "chiusura",    icon: "tag", l: "Chiusura",   done: tuttoCC, desc: "Fattura saldo e chiudi" },
          ];
          const doneCC = stepsCC.filter(s => s.done).length;
          const curIdxCC = stepsCC.findIndex(s => !s.done);
          const curCC = curIdxCC >= 0 ? stepsCC[curIdxCC] : null;
          const progCC = Math.round((doneCC / stepsCC.length) * 100);

          return (
            <div style={{ margin: "8px 16px 4px" }}>
              {/* Progress dots con label */}
              <div style={{ display: "flex", gap: 2, marginBottom: 6, justifyContent: "center", alignItems: "flex-end" }}>
                {stepsCC.map((s, i) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
                        background: s.skipped ? "#ff9500" : s.done ? "#34c759" : i === curIdxCC ? T.acc : T.bg,
                        color: s.done || s.skipped || i === curIdxCC ? "#fff" : T.sub, fontWeight: 700,
                      }}>{s.skipped ? <I d={ICO.check} s={10} c="#fff" /> : s.done ? <I d={ICO.check} s={10} c="#fff" /> : <Ico d={ICO[s.icon as keyof typeof ICO] || ICO.edit} s={10} c="#fff" />}</div>
                      <div style={{ fontSize: 7, color: i === curIdxCC ? T.acc : s.done ? "#34c759" : T.sub, fontWeight: i === curIdxCC ? 800 : 500, whiteSpace: "nowrap", maxWidth: 32, overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>{s.l}</div>
                    </div>
                    {i < stepsCC.length - 1 && <div style={{ width: 6, height: 2, background: s.done ? "#34c759" : T.bdr, marginBottom: 12 }} />}
                  </div>
                ))}
              </div>
              {/* Current action */}
              {curCC && (
                <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <IcoKey name={curCC.icon} s={18} c={T.acc} />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>{curCC.l}</span>
                      <div style={{ fontSize: 10, color: T.sub }}>{curCC.desc}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: T.acc }}>{doneCC}/{stepsCC.length}</span>
                    {hasFattCC && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: tuttoCC ? "#1A9E7320" : "#D0800820", color: tuttoCC ? "#1A9E73" : "#D08008", marginLeft: 4 }}>
                        {tuttoCC ? "✓ Pagata" : "📋 Fatt."}
                      </span>
                    )}
                  </div>
                  {/* Success flash */}
                  {ccDone && <div style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "#34c75918", border: "1px solid #34c75940", fontSize: 12, fontWeight: 700, color: "#34c759", textAlign: "center" }}>{ccDone}</div>}

                  {/* Skipped steps log */}
                  {(c.skipLog || []).length > 0 && (
                    <div style={{ marginBottom: 8, padding: "6px 10px", borderRadius: 8, background: "#ff950010", border: "1px solid #ff950030" }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: "#ff9500", textTransform: "uppercase", marginBottom: 3 }}>Passaggi saltati</div>
                      {(c.skipLog || []).map((skip, si) => {
                        const stepInfo = stepsCC.find(s => s.id === skip.fase);
                        return (
                          <div key={si} style={{ fontSize: 10, color: T.text, display: "flex", gap: 6, padding: "2px 0" }}>
                            <span style={{ color: "#ff9500", fontWeight: 700 }}>⏭ {stepInfo?.l || skip.fase}</span>
                            <span style={{ color: T.sub, flex: 1 }}>{skip.motivo || "·"}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/*  SOPRALLUOGO  */}
                  {curCC.id === "sopralluogo" && (
                    <div>
                      {rilieviCC.length === 0 ? (
                        <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Vai al cantiere e prendi le misure dei vani</div>
                      ) : (
                        <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>
                          {rilieviCC.length} rilievo · {vaniCC.length} vani {vaniCC.length > 0 ? "· aggiungi misure a tutti i vani" : "· aggiungi i vani"}
                        </div>
                      )}
                      {vaniCC.length === 0 ? (
                        <div style={{ padding: "12px 16px", borderRadius: 10, border: `1.5px dashed ${T.grn}`, background: `${T.grn}08`, display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}><I d={ICO.mapPin} s={18} c={T.grn} /><div><div style={{ fontSize: 13, fontWeight: 700, color: T.grn }}>Avvia sopralluogo</div><div style={{ fontSize: 11, color: T.sub }}>Aggiungi i vani e inserisci le misure sul cantiere</div></div></div>
                      ) : (
                        <div style={{ fontSize: 12, color: T.grn, fontWeight: 700, textAlign: "center" }}>✓ {vaniCC.length} vani misurati · Vai al preventivo</div>
                      )}
                    </div>
                  )}

                  {/*  PREVENTIVO (CUORE · LINK A WORKSPACE)  */}
                  {curCC.id === "preventivo" && (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>{vaniCC.length} vani · {vaniConPrezzoCC.length} con prezzo</div>
                      
                      {/* Totale rapido */}
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: `${T.acc}10`, borderRadius: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>Totale + IVA {ivaPercCC}%</span>
                        <span style={{ fontSize: 14, fontWeight: 900, color: T.acc }}>€{fmtCC(totIvaCC)}</span>
                      </div>

                      {/* BOTTONE PRINCIPALE */}
                      <button onClick={() => { setPrevWorkspace(true); setPrevTab("preventivo"); setEditingVanoId(null); }} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: T.acc, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}><I d={ICO.clipboard} /> APRI PREVENTIVO →</button>

                      <div style={{ textAlign: "center", marginTop: 2 }}>
                        <span onClick={() => {
                          setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, preventivoInviato: true, dataPreventivoInvio: new Date().toISOString().split("T")[0] } : cm));
                          setSelectedCM(prev => ({ ...prev, preventivoInviato: true }));
                          setCcDone("✓ Completato"); setTimeout(() => setCcDone(null), 3000);
                        }} style={{ fontSize: 10, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>Gi+ inviato? Segna come completato</span>
                      </div>
                    </div>
                  )}

                  {/*  CONFERMA (firma + fattura acconto)  */}
                  {curCC.id === "conferma" && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.acc, marginBottom: 8 }}>Totale: €{fmtCC(totIvaCC)} (IVA {ivaPercCC}% incl.)</div>
                      {hasFattCC && !fattCC.every(f => f.pagata) && (
                        <div style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "#D0800815", border: "1px solid #D0800830", display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 13 }}>📋</span>
                          <span style={{ fontSize: 11, color: "#D08008", fontWeight: 600 }}>Fattura acconto emessa · verifica pagamento in Contabilit+</span>
                        </div>
                      )}
                      {firmaStep === 0 ? (
                        <div>
                          <button onClick={async () => {
                            generaPreventivoPDF(c);
                            await generaPreventivoCondivisibile(c);
                            setFirmaStep(1);
                          }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#25d366", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginBottom: 4 }}><I d={ICO.upload} /> GENERA PDF + INVIA CON FIRMA →</button>
                          <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginBottom: 6 }}>Scarica PDF e invia link firma elettronica via WhatsApp</div>
                          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                            <span onClick={() => generaPreventivoPDF(c)} style={{ fontSize: 10, color: T.sub, cursor: "pointer", textDecoration: "underline" }}><I d={ICO.fileText} /> Solo PDF</span>
                            <span onClick={() => setFirmaStep(1)} style={{ fontSize: 10, color: T.sub, cursor: "pointer", textDecoration: "underline" }}>Gi+ inviato? Carica firma</span>
                          </div>
                        </div>
                      ) : !firmaFileUrl ? (
                        <div>
                          {/* Bottone link firma digitale */}
                          <div style={{ marginBottom: 12 }}>
                            <button onClick={async () => {
                              try {
                                const res = await fetch("/api/firma", { method: "POST", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ action: "genera", data: { cmId: c.id, cmCode: c.code, cliente: `${c.cliente} ${c.cognome||""}`.trim(), importo: totIvaCC, descrizione: `Preventivo ${c.code} - ${vaniCC.length} vani` } }) });
                                const d = await res.json();
                                if (d.url) {
                                  setFirmaToken(d.token);
                                  const fullUrl = window.location.origin + d.url;
                                  await navigator.clipboard.writeText(fullUrl).catch(() => {});
                                  setFirmaLinkCopiato(true);
                                  setTimeout(() => setFirmaLinkCopiato(false), 4000);
                                  // Polling per verificare se cliente ha firmato
                                  const poll = setInterval(async () => {
                                    const r2 = await fetch("/api/firma", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "check", token: d.token }) });
                                    const d2 = await r2.json();
                                    if (d2.firmato) {
                                      clearInterval(poll);
                                      setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, firmaCliente: true, dataFirma: d2.firmaDataOra } : cm));
                                      setSelectedCM(prev => ({ ...prev, firmaCliente: true }));
                                      setCcDone("Firma ricevuta!");
                                      setTimeout(() => setCcDone(null), 3000);
                                    }
                                  }, 5000);
                                  setTimeout(() => clearInterval(poll), 10 * 60 * 1000); // max 10 min
                                }
                              } catch { setCcDone("Errore generazione link"); }
                            }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 8 }}>
                              Invia link firma al cliente
                            </button>
                            {firmaLinkCopiato && (
                              <div style={{ background: "#F0FDF9", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: T.grn, fontWeight: 600, textAlign: "center" }}>
                                Link copiato! Incollalo su WhatsApp al cliente
                              </div>
                            )}
                            {firmaToken && !firmaLinkCopiato && (
                              <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginTop: 4 }}>
                                In attesa della firma del cliente...
                              </div>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: T.sub, textAlign: "center", marginBottom: 8 }}>oppure</div>
                          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>Carica il documento firmato dal cliente</div>
                          <button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/pdf,image/*"; inp.onchange = (ev: any) => { const f = ev.target.files?.[0]; if (!f) return; setFirmaFileName(f.name); const r = new FileReader(); r.onload = (e) => setFirmaFileUrl(e.target?.result as string); r.readAsDataURL(f); }; inp.click(); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: `2px dashed ${T.acc}`, background: `${T.acc}08`, color: T.acc, fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.download} /> CARICA FIRMATO</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ padding: 8, borderRadius: 8, background: "#34c75912", marginBottom: 6, fontSize: 11, color: "#34c759", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                            <I d={ICO.paperclip} />
                            <span onClick={() => { if (firmaFileUrl) { const w = window.open(""); w?.document.write(`<iframe src="${firmaFileUrl}" style="width:100%;height:100vh;border:none"></iframe>`); } }} style={{ flex: 1, cursor: "pointer", textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{firmaFileName}</span>
                            <a href={firmaFileUrl || "#"} download={firmaFileName} style={{ fontSize: 10, color: "#34c759", cursor: "pointer", textDecoration: "none", flexShrink: 0 }}>🔗</a>
                            <span onClick={() => { setFirmaFileUrl(null); setFirmaFileName(""); }} style={{ cursor: "pointer", flexShrink: 0 }}>✓</span>
                          </div>
                          <button onClick={() => {
                            const all = { id: Date.now(), tipo: "firma", nome: firmaFileName, dataUrl: firmaFileUrl };
                            setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, firmaCliente: true, dataFirma: new Date().toISOString().split("T")[0], firmaDocumento: all, allegati: [...(cm.allegati || []), all] } : cm));
                            setSelectedCM(prev => ({ ...prev, firmaCliente: true, dataFirma: new Date().toISOString().split("T")[0] }));
                            setFirmaStep(0); setFirmaFileUrl(null); setFirmaFileName("");
                            setCcDone("✓ Firma registrata!"); setTimeout(() => setCcDone(null), 3000);
                          }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CONFERMA FIRMA →</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/*  ORDINI  */}
                  {curCC.id === "ordini" && (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>{vaniCC.length} vani · {c.sistema || "·"}</div>
                      <div style={{ background: T.bg, borderRadius: 8, padding: 8, marginBottom: 8, maxHeight: 120, overflow: "auto" }}>
                        {vaniCC.map((v, vi) => (
                          <div key={vi} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0", borderBottom: vi < vaniCC.length - 1 ? `1px solid ${T.bdr}` : "none" }}>
                            <span style={{ color: T.text, fontWeight: 600 }}>{v.nome || v.tipo || `Vano ${vi + 1}`}</span>
                            <span style={{ color: T.acc, fontWeight: 700 }}>{(v.larghezza || v.l || 0)}{(v.altezza || v.h || 0)}</span>
                          </div>
                        ))}
                      </div>
                      {!hasFattCC && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: T.sub, marginBottom: 4 }}>Fattura acconto (opzionale)</div>
                          <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" as any }}>
                            {[30, 40, 50, 60, 100].map(p => (
                              <div key={p} onClick={() => setFattPerc(p)} style={{ padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 10, fontWeight: 800, background: fattPerc === p ? T.acc : T.card, color: fattPerc === p ? "#fff" : T.text, border: `1.5px solid ${fattPerc === p ? T.acc : T.bdr}` }}>
                                {p === 100 ? "Unica" : p + "%"}
                              </div>
                            ))}
                          </div>
                          <button onClick={() => { setAccontoImporto(String(Math.round(totIvaCC * fattPerc / 100))); setShowAccontoModal(true); }} style={{ width: "100%", padding: 11, borderRadius: 8, border: `1px solid ${T.acc}`, background: `${T.acc}08`, color: T.acc, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}><I d={ICO.euro} /> Crea fattura €{fmtCC(Math.round(totIvaCC * fattPerc / 100))}</button>

                          {/* · MODAL IMPORTO ACCONTO · */}
                          {showAccontoModal && (
                            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
                              <div style={{ background: T.card, borderRadius: 16, padding: 24, width: "100%", maxWidth: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>Fattura {fattPerc === 100 ? "unica" : "acconto"}</div>
                                <div style={{ fontSize: 12, color: T.sub, marginBottom: 16 }}>Totale commessa IVA incl.: <strong>€{fmtCC(totIvaCC)}</strong></div>
                                <div style={{ fontSize: 11, color: T.sub, marginBottom: 6, fontWeight: 600 }}>Importo da fatturare (€)</div>
                                <input
                                  type="number"
                                  value={accontoImporto}
                                  onChange={e => setAccontoImporto(e.target.value)}
                                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${T.acc}`, fontSize: 18, fontWeight: 800, color: T.acc, background: T.bg, fontFamily: "inherit", marginBottom: 6, boxSizing: "border-box" as any, outline: "none" }}
                                  autoFocus
                                />
                                <div style={{ fontSize: 10, color: T.sub, marginBottom: 16 }}>
                                  {[30,40,50,60,100].map(p => (
                                    <span key={p} onClick={() => setAccontoImporto(String(Math.round(totIvaCC * p / 100)))} style={{ marginRight: 6, cursor: "pointer", color: T.acc, fontWeight: 700, textDecoration: "underline" }}>
                                      {p === 100 ? "Tutto" : p + "%"} (€{fmtCC(Math.round(totIvaCC * p / 100))})
                                    </span>
                                  ))}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                  <button onClick={() => setShowAccontoModal(false)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                                  <button onClick={() => {
                                    const imp = parseFloat(accontoImporto);
                                    if (!imp || imp <= 0) return;
                                    creaFattura(c, fattPerc === 100 ? "unica" : "acconto", imp);
                                    setShowAccontoModal(false);
                                    setCcDone("✓ Fattura creata!");
                                    setTimeout(() => setCcDone(null), 3000);
                                  }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CREA FATTURA €{fmtCC(parseFloat(accontoImporto) || 0)}</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      <button onClick={() => setShowOrdinePreview(true)} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.package} /> CREA ORDINE FORNITORE →</button>

                      {/* · MODAL ANTEPRIMA ORDINE FORNITORE · */}
                      {showOrdinePreview && (() => {
                        const prevVani = getVaniAttivi(c);
                        const prevRighe = prevVani.map(v => {
                          const tipLabel = TIPOLOGIE_RAPIDE.find((t: any) => t.code === v.tipo)?.label || v.tipo || "·";
                          const m = v.misure || {};
                          const lmm = m.lCentro || 0, hmm = m.hCentro || 0;
                          const prezzo = calcolaVanoPrezzo(v, c);
                          return {
                            desc: `${tipLabel} · ${v.stanza || ""} ${v.piano || ""}`.trim(),
                            misure: lmm > 0 && hmm > 0 ? `${lmm}x${hmm} mm` : "da definire",
                            qta: v.pezzi || 1,
                            prezzoUnit: Math.round(prezzo * 100) / 100,
                            totale: Math.round(prezzo * (v.pezzi || 1) * 100) / 100,
                            colore: v.coloreEst || "",
                          };
                        });
                        const prevTot = prevRighe.reduce((s, r) => s + r.totale, 0);
                        const ivaPercOrd = (c.ivaPerc || 22) / 100; const prevTotIva = Math.round(prevTot * (1 + ivaPercOrd) * 100) / 100;
                        const fmtOrd = (n) => typeof n === "number" ? n.toLocaleString("it-IT", { minimumFractionDigits: 2 }) : "0,00";
                        return (
                          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0" }}>
                            <div style={{ background: T.card, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", padding: 20, boxShadow: "0 -8px 40px rgba(0,0,0,0.25)" }}>
                              {/* Header */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                                <div>
                                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Anteprima Ordine Fornitore</div>
                                  <div style={{ fontSize: 11, color: T.sub }}>Commessa {c.code} · {c.cliente}</div>
                                </div>
                                <div onClick={() => setShowOrdinePreview(false)} style={{ width: 32, height: 32, borderRadius: "50%", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: T.sub }}>✓</div>
                              </div>

                              {/* Info fornitore */}
                              <div style={{ background: T.bg, borderRadius: 10, padding: 10, marginBottom: 12 }}>
                                <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" as any, letterSpacing: 0.5 }}>Fornitore</div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{c.sistema?.split(" ")[0] || "·"}</div>
                                <div style={{ fontSize: 11, color: T.sub }}>Sistema: {c.sistema || "non specificato"}</div>
                              </div>

                              {/* Righe ordine */}
                              <div style={{ background: T.bg, borderRadius: 10, padding: 10, marginBottom: 12 }}>
                                <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" as any, letterSpacing: 0.5 }}>Righe ordine ({prevRighe.length} vani)</div>
                                {prevRighe.length === 0 ? (
                                  <div style={{ fontSize: 12, color: T.sub, textAlign: "center", padding: 8 }}>Nessun vano con misure</div>
                                ) : prevRighe.map((r, ri) => (
                                  <div key={ri} style={{ padding: "8px 0", borderBottom: ri < prevRighe.length - 1 ? `1px solid ${T.bdr}` : "none" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{r.desc || `Vano ${ri + 1}`}</div>
                                        <div style={{ fontSize: 10, color: T.sub }}>
                                          {r.misure} · Qta: {r.qta}{r.colore ? ` · ${r.colore}` : ""}
                                        </div>
                                      </div>
                                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: T.acc }}>€{fmtOrd(r.totale)}</div>
                                        {r.qta > 1 && <div style={{ fontSize: 9, color: T.sub }}>€{fmtOrd(r.prezzoUnit)} cad.</div>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Totali */}
                              <div style={{ background: T.bg, borderRadius: 10, padding: 10, marginBottom: 16 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                  <span style={{ color: T.sub }}>Imponibile</span>
                                  <span style={{ fontWeight: 700, color: T.text }}>€{fmtOrd(prevTot)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                                  <span style={{ color: T.sub }}>IVA {c.ivaPerc || 22}%</span>
                                  <span style={{ fontWeight: 700, color: T.text }}>€{fmtOrd(Math.round((prevTotIva - prevTot) * 100) / 100)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, borderTop: `1px solid ${T.bdr}`, paddingTop: 6, marginTop: 4 }}>
                                  <span style={{ fontWeight: 700, color: T.text }}>Totale IVA incl.</span>
                                  <span style={{ fontWeight: 900, color: T.acc }}>€{fmtOrd(prevTotIva)}</span>
                                </div>
                              </div>

                              {/* Avviso se vani senza prezzo */}
                              {prevRighe.some(r => r.prezzoUnit === 0) && (
                                <div style={{ background: "#E8A02015", border: "1px solid #E8A02040", borderRadius: 8, padding: "8px 10px", marginBottom: 12, fontSize: 11, color: "#E8A020", fontWeight: 600 }}>
                                  ⏹+ Alcuni vani non hanno prezzo · verranno inclusi come €0,00
                                </div>
                              )}

                              {/* Note ordine */}
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 10, color: T.sub, fontWeight: 700, marginBottom: 4, textTransform: "uppercase" as any }}>Note per il fornitore</div>
                                <textarea value={noteOrdine} onChange={e => setNoteOrdine(e.target.value)} placeholder="Consegna urgente, RAL, riferimento..." rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.bg, color: T.text, fontSize: 11, resize: "none" as any, boxSizing: "border-box" as any, fontFamily: "inherit" }} />
                              </div>
                              {/* Bottoni */}
                              <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => setShowOrdinePreview(false)} style={{ flex: 1, padding: 13, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                                <button onClick={() => {
                                  creaOrdineFornitore(c, c.sistema?.split(" ")[0] || "", noteOrdine || ""); setNoteOrdine("");
                                  setSelectedCM((prev: any) => ({ ...prev }));
                                  setShowOrdinePreview(false);
                                  setCcDone("✓ Ordine creato!");
                                  setTimeout(() => setCcDone(null), 3000);
                                }} style={{ flex: 2, padding: 13, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                                  <I d={ICO.package} /> CONFERMA E CREA ORDINE
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/*  PRODUZIONE  */}
                  {curCC.id === "produzione" && (
                    <div>
                      {ordCC.length > 0 && (
                        <div style={{ background: T.bg, borderRadius: 8, padding: 8, marginBottom: 8 }}>
                          {ordCC.map((o, oi) => (
                            <div key={oi} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "3px 0" }}>
                              <span style={{ fontWeight: 600 }}>{typeof o.fornitore === "object" ? (o.fornitore?.nome || "Fornitore") : (o.fornitore || "Fornitore")}</span>
                              <span style={{ color: o.conferma?.ricevuta ? T.grn : T.orange, fontWeight: 700 }}>
                                {o.conferma?.firmata ? "✓ Confermato" : o.conferma?.ricevuta ? "📋 Conferma ricevuta" : "📐 In attesa"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {!ordConfCC ? (
                        <button onClick={() => apriInboxDocumento(c.id, "conferma")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#af52de", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.download} /> CARICA CONFERMA FORNITORE →</button>
                      ) : ccConfirm !== "conferma_ok" ? (
                        <button onClick={() => setCcConfirm("conferma_ok")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ APPROVA E AVVIA PRODUZIONE →</button>
                      ) : (
                        <div style={{ background: "#34c75912", borderRadius: 10, padding: 12, border: "1px solid #34c75930" }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#34c759", marginBottom: 4 }}>Confermi avvio produzione?</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => setCcConfirm(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                            <button onClick={() => { setOrdiniFornDB(prev => prev.map(o => o.cmId === c.id ? { ...o, conferma: { ...o.conferma, firmata: true } } : o)); setCcConfirm(null); setCcDone("✓ Produzione avviata!"); setTimeout(() => setCcDone(null), 3000); }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CONFERMO</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/*  POSA  */}
                  {curCC.id === "posa" && (
                    <div>
                      {!montFormOpen ? (
                        <div>
                          <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>{vaniCC.length} vani · {c.indirizzo || "·"}</div>
                          <button onClick={() => { setMontFormOpen(true); setMontGiorni(1); setMontFormData({ data: "", orario: "08:00", durata: "giornata", squadraId: squadreDB[0]?.id || "", note: "" }); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.wrench} /> PIANIFICA MONTAGGIO →</button>
                        </div>
                      ) : (
                        <div style={{ background: T.bg, borderRadius: 10, padding: 10, border: `1px solid ${T.bdr}` }}>
                          <input type="date" value={montFormData.data} onChange={e => { setMontFormData(p => ({ ...p, data: e.target.value })); setWorkWeekend(null); }} style={{ width: "100%", padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 14, fontFamily: "inherit", boxSizing: "border-box" as any, marginBottom: 6 }} />

                          {/* Mini calendario squadre · 3 settimane + anteprima */}
                          {(() => {
                            const selDate = montFormData.data ? new Date(montFormData.data + 'T12:00:00') : new Date();
                            const todayISO = new Date().toISOString().split('T')[0];
                            const baseDay = new Date(selDate);
                            baseDay.setDate(baseDay.getDate() - (baseDay.getDay() === 0 ? 6 : baseDay.getDay() - 1));
                            baseDay.setDate(baseDay.getDate() - 7);
                            const WEEKS = 3;
                            const allDays = Array.from({ length: WEEKS * 7 }, (_, i) => { const d = new Date(baseDay); d.setDate(d.getDate() + i); return d; });
                            const fmtD = (d) => d.toISOString().split('T')[0];
                            const dayN = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
                            const squads = squadreDB.length > 0 ? squadreDB : [{ id: 'default', nome: 'Squadra', colore: '#007aff' }];
                            const previewDays = new Set();
                            if (montFormData.data && montGiorni > 0) {
                              let added = 0;
                              const pStart = new Date(montFormData.data + 'T12:00:00');
                              for (let i = 0; added < Math.ceil(montGiorni) && i < 30; i++) {
                                const pd = new Date(pStart); pd.setDate(pd.getDate() + i);
                                const dow = pd.getDay();
                                if ((dow === 0 || dow === 6) && workWeekend !== true) continue;
                                previewDays.add(fmtD(pd)); added++;
                              }
                            }
                            const selSquadId = montFormData.squadraId || (squads.length === 1 ? squads[0].id : null);
                            return (
                              <div style={{ marginBottom: 8, borderRadius: 8, border: '1px solid ' + T.bdr, overflow: 'hidden', background: T.card }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px 0' }}>
                                  <span onClick={() => { const p = new Date(baseDay); p.setDate(p.getDate() - 7); setMontFormData(prev => ({ ...prev, data: fmtD(p) })); }} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700, color: T.acc, padding: '4px 8px' }}>{"📅"}</span>
                                  <span style={{ fontSize: 9, fontWeight: 800, color: T.sub, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Disponibilit+ squadre
                                  </span>
                                  <span onClick={() => { const n = new Date(baseDay); n.setDate(n.getDate() + 21); setMontFormData(prev => ({ ...prev, data: fmtD(n) })); }} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700, color: T.acc, padding: '4px 8px' }}>{"📷"}</span>
                                </div>
                                {Array.from({ length: WEEKS }, (_, wi) => {
                                  const weekDays = allDays.slice(wi * 7, wi * 7 + 7);
                                  const weekStart = weekDays[0];
                                  return (
                                    <div key={wi} style={{ borderTop: wi > 0 ? '1px solid ' + T.bdr + '50' : 'none', paddingTop: wi > 0 ? 2 : 0 }}>
                                      <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', fontSize: 9, padding: '2px 4px 0' }}>
                                        <div style={{ fontSize: 8, fontWeight: 600, color: T.sub + '80', padding: '1px 0' }}>
                                          {weekStart.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                        </div>
                                        {weekDays.map((d, i) => {
                                          const iso = fmtD(d);
                                          const isSel = iso === montFormData.data;
                                          const isToday = iso === todayISO;
                                          const isPast = iso < todayISO;
                                          return (
                                            <div key={i} onClick={() => !isPast && setMontFormData(p => ({ ...p, data: iso }))} style={{
                                              textAlign: 'center', cursor: isPast ? 'default' : 'pointer', padding: '1px 0', borderRadius: 4,
                                              background: isSel ? T.acc + '25' : isToday ? T.grn + '12' : 'transparent',
                                              border: isSel ? '1.5px solid ' + T.acc : '1.5px solid transparent',
                                              opacity: isPast ? 0.3 : 1,
                                            }}>
                                              {wi === 0 && <div style={{ fontSize: 8, fontWeight: 600, color: isSel ? T.acc : isToday ? T.grn : i >= 5 ? T.sub + '60' : T.sub }}>{dayN[i]}</div>}
                                              <div style={{ fontSize: 10, fontWeight: isSel || isToday ? 800 : 500, color: isSel ? T.acc : isToday ? T.grn : T.text }}>{d.getDate()}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      {squads.map((sq, si) => {
                                        const sqC = sq.colore || '#007aff';
                                        return (
                                          <div key={sq.id} style={{ display: 'grid', gridTemplateColumns: '48px repeat(7, 1fr)', fontSize: 7, padding: '0 4px' }}>
                                            <div style={{ fontSize: 8, fontWeight: 700, color: sqC, padding: '1px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wi === 0 ? sq.nome : ''}</div>
                                            {weekDays.map((d, di) => {
                                              const iso = fmtD(d);
                                              const dayM = (montaggiDB || []).filter(m => m.data === iso && (m.squadraId === sq.id || (!m.squadraId && squads.length === 1)));
                                              const isPreview = previewDays.has(iso) && (selSquadId === sq.id);
                                              const hasWork = dayM.length > 0;
                                              const isConflict = hasWork && isPreview;
                                              return (
                                                <div key={di} onClick={() => { if (fmtD(d) >= todayISO) setMontFormData(p => ({ ...p, data: iso, squadraId: sq.id })); }} style={{
                                                  textAlign: 'center', padding: '1px', cursor: 'pointer', borderRadius: 3, margin: '0 1px', minHeight: 13,
                                                  background: isConflict ? '#ff3b3020' : isPreview ? T.acc + '18' : hasWork ? sqC + '10' : 'transparent',
                                                  border: isPreview ? '1px dashed ' + (isConflict ? '#ff3b30' : T.acc) : '1px solid transparent',
                                                }}>
                                                  {hasWork ? dayM.map((m, mi) => (
                                                    <div key={mi} style={{ fontSize: 7, fontWeight: 700, color: isConflict ? '#ff3b30' : sqC, lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                      {(m.cliente || '').split(' ')[0] || 'Occ'}
                                                    </div>
                                                  )) : isPreview ? (
                                                    <div style={{ fontSize: 8, fontWeight: 800, color: T.acc }}>{"+"}</div>
                                                  ) : null}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '3px 8px 5px', fontSize: 8, color: T.sub }}>
                                  {previewDays.size > 0 && <span><span style={{ color: T.acc, fontWeight: 800 }}>{"+"}</span> Nuovo montaggio ({montGiorni}g)</span>}
                                  {previewDays.size > 0 && Array.from(previewDays).some(pd => (montaggiDB || []).some(m => m.data === pd && (m.squadraId === selSquadId))) && <span style={{ color: '#ff3b30', fontWeight: 700 }}>{"+"} Sovrapposizione!</span>}
                                  <span style={{ marginLeft: 'auto', cursor: 'pointer', color: T.acc, fontWeight: 700, fontSize: 9 }} onClick={() => setMontFormData(prev => ({ ...prev, data: todayISO }))}>Oggi</span>
                                </div>
                                {/* Banner weekend */}
                                {(() => {
                                  if (!montFormData.data || montGiorni <= 0) return null;
                                  // Controlla se il range (senza weekend) attraversa un sab/dom
                                  const pStart = new Date(montFormData.data + 'T12:00:00');
                                  let hasWeekendInRange = false;
                                  let added = 0;
                                  for (let i = 0; added < Math.ceil(montGiorni) && i < 30; i++) {
                                    const pd = new Date(pStart); pd.setDate(pd.getDate() + i);
                                    const dow = pd.getDay();
                                    if (dow === 0 || dow === 6) { hasWeekendInRange = true; break; }
                                    added++;
                                  }
                                  // Oppure se la data di partenza  sab/dom
                                  const startDow = pStart.getDay();
                                  if (startDow === 6 || startDow === 0) hasWeekendInRange = true;
                                  if (!hasWeekendInRange) { if (workWeekend !== null) setWorkWeekend(null); return null; }
                                  if (workWeekend !== null) return null; // gi+ risposto
                                  return (
                                    <div style={{ margin: '4px 8px 6px', padding: '8px 10px', borderRadius: 8, background: '#FF9F0A18', border: '1px solid #FF9F0A60' }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: '#FF9F0A', marginBottom: 6 }}>📐 Il periodo include sabato/domenica. Lavori anche nel weekend?</div>
                                      <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => setWorkWeekend(true)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: '#FF9F0A', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✓ S, lavoro</button>
                                        <button onClick={() => setWorkWeekend(false)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid #FF9F0A60', background: 'transparent', color: '#FF9F0A', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>No, solo feriali</button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            );
                          })()}
                          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                            <select value={montFormData.orario} onChange={e => setMontFormData(p => ({ ...p, orario: e.target.value }))} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 12, fontFamily: "inherit" }}>
                              {["06:00","07:00","07:30","08:00","08:30","09:00","10:00","14:00"].map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                              <button onClick={() => setMontGiorni(Math.max(0.5, montGiorni - 0.5))} style={{ width: 32, height: 38, border: `1px solid ${T.bdr}`, borderRadius: "8px 0 0 8px", background: T.card, fontSize: 16, cursor: "pointer" }}>✕</button>
                              <div style={{ flex: 1, height: 38, display: "flex", alignItems: "center", justifyContent: "center", borderTop: `1px solid ${T.bdr}`, borderBottom: `1px solid ${T.bdr}`, fontSize: 14, fontWeight: 800 }}>{montGiorni === 0.5 ? "½" : montGiorni}g</div>
                              <button onClick={() => setMontGiorni(montGiorni + 0.5)} style={{ width: 32, height: 38, border: `1px solid ${T.bdr}`, borderRadius: "0 8px 8px 0", background: T.card, fontSize: 16, cursor: "pointer" }}>+</button>
                            </div>
                          </div>
                          {squadreDB.length > 0 && <div style={{ display: "flex", gap: 4, marginBottom: 6, flexWrap: "wrap" as any }}>{squadreDB.map(sq => (
                            <div key={sq.id} onClick={() => setMontFormData(p => ({ ...p, squadraId: sq.id }))} style={{ padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, background: montFormData.squadraId === sq.id ? T.acc : T.card, color: montFormData.squadraId === sq.id ? "#fff" : T.text, border: `1px solid ${montFormData.squadraId === sq.id ? T.acc : T.bdr}` }}>{sq.nome || sq.id}</div>
                          ))}</div>}
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => setMontFormOpen(false)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                            <button onClick={() => {
                              if (!montFormData.data) { alert("Scegli una data"); return; }
                              const nuovoM = { id: "m_" + Date.now(), cmId: c.id, cmCode: c.code, cliente: c.cliente, indirizzo: c.indirizzo || "", vani: vaniCC.length, data: montFormData.data, orario: montFormData.orario, durata: montGiorni + "g", giorni: montGiorni, squadraId: montFormData.squadraId, stato: "programmato", note: montFormData.note };
                              setMontaggiDB(prev => [...prev, nuovoM]);
                              setEvents(prev => [...prev, { id: "ev_m_" + Date.now(), date: montFormData.data, time: montFormData.orario, text: `🔧 Montaggio ${c.cliente} (${montGiorni}g)`, tipo: "montaggio", persona: c.cliente, cm: c.code, addr: c.indirizzo || "", done: false }]);
                              setMontFormOpen(false);
                              setCcDone("✓ Montaggio pianificato!"); setTimeout(() => setCcDone(null), 3000);
                            }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CONFERMA</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/*  COLLAUDO  */}
                  {curCC.id === "collaudo" && (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Verifica il montaggio, scatta foto finale e fai firmare il collaudo</div>
                      <button onClick={() => {
                        setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, collaudoOk: true, dataCollaudo: new Date().toISOString().split("T")[0] } : cm));
                        setSelectedCM(prev => ({ ...prev, collaudoOk: true, dataCollaudo: new Date().toISOString().split("T")[0] }));
                        setCcDone("✓ Collaudo completato!"); setTimeout(() => setCcDone(null), 3000);
                      }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#5856d6", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.search} /> SEGNA COLLAUDO OK →</button>
                    </div>
                  )}

                  {/*  CHIUSURA  */}
                  {curCC.id === "chiusura" && (() => {
                    const saldoFatCC = fattCC.find(f => f.tipo === "saldo" || f.tipo === "unica");
                    const saldoPagatoCC = saldoFatCC?.pagata;
                    const restoCC = totIvaCC - incassatoCC;
                    return (
                    <div>
                      <div style={{ fontSize: 11, color: T.sub, marginBottom: 6 }}>
                        Incassato €{fmtCC(incassatoCC)} su €{fmtCC(totIvaCC)} {restoCC > 0 ? `· Resta €${fmtCC(restoCC)}` : "· ✓ Tutto incassato"}
                      </div>
                      {!saldoFatCC && restoCC > 0 && (
                        ccConfirm !== "saldo" ? (
                          <button onClick={() => setCcConfirm("saldo")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}><I d={ICO.euro} /> FATTURA SALDO €{fmtCC(restoCC)} →</button>
                        ) : (
                          <div style={{ background: T.acc + "10", borderRadius: 10, padding: 12, border: `1px solid ${T.acc}30` }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: T.acc, marginBottom: 4 }}>Fattura saldo €{fmtCC(restoCC)}</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setCcConfirm(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                              <button onClick={() => { creaFattura(c, restoCC === totIvaCC ? "unica" : "saldo"); setCcConfirm(null); setCcDone("✓ Fattura saldo creata!"); setTimeout(() => setCcDone(null), 3000); }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: T.acc, color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CREA FATTURA</button>
                            </div>
                          </div>
                        )
                      )}
                      {saldoFatCC && !saldoPagatoCC && (
                        ccConfirm !== "pagata" ? (
                          <button onClick={() => setCcConfirm("pagata")} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ SEGNA PAGATA €{fmtCC(restoCC)} →</button>
                        ) : (
                          <div style={{ background: "#34c75912", borderRadius: 10, padding: 12, border: "1px solid #34c75930" }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "#34c759", marginBottom: 4 }}>Conferma pagamento €{fmtCC(restoCC)}</div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button onClick={() => setCcConfirm(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${T.bdr}`, background: T.card, color: T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Annulla</button>
                              <button onClick={() => {
                                setFattureDB(prev => prev.map(f => f.cmId === c.id && !f.pagata ? { ...f, pagata: true, dataPagamento: new Date().toISOString().split("T")[0], metodoPagamento: "Bonifico" } : f));
                                setFaseTo(c.id, "chiusura");
                                setCcConfirm(null); setCcDone("✓ Commessa chiusa!"); setTimeout(() => setCcDone(null), 3000);
                              }} style={{ flex: 2, padding: 11, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CONFERMO INCASSO</button>
                            </div>
                          </div>
                        )
                      )}
                      {!saldoFatCC && restoCC <= 0 && (
                        <button onClick={() => { setFaseTo(c.id, "chiusura"); setCcDone("✓ Commessa chiusa!"); setTimeout(() => setCcDone(null), 3000); }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: "#34c759", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>✓ CHIUDI COMMESSA →</button>
                      )}
                    </div>
                    );
                  })()}

                  {/*  PULSANTE SALTA  */}
                  {curCC && !curCC.done && curCC.id !== "chiusura" && (
                    <div style={{ textAlign: "center", marginTop: 8 }}>
                      <span onClick={() => {
                        const skipIdx = stepsCC.findIndex(s => s.id === curCC.id);
                        if (skipIdx >= 0 && skipIdx < stepsCC.length - 1) {
                          const skipNote = prompt("Motivo per saltare '" + curCC.l + "':");
                          if (skipNote !== null) {
                            setCantieri(cs => cs.map(cm => cm.id === c.id ? { ...cm, skipLog: [...(cm.skipLog || []), { fase: curCC.id, motivo: skipNote, quando: new Date().toISOString() }] } : cm));
                            const nextStep = stepsCC[skipIdx + 1];
                            if (nextStep) setFaseTo(c.id, nextStep.id);
                            setCcDone(`⏭ ${curCC.l} saltato`); setTimeout(() => setCcDone(null), 3000);
                          }
                        }
                      }} style={{ fontSize: 10, color: T.sub2, cursor: "pointer", textDecoration: "underline" }}>⏭ Salta questo passaggio</span>
                    </div>
                  )}
                </div>
              )}
              {/* Totale */}
              {totPrevCC > 0 && (
                <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}` }}>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>Totale IVA incl.</span>
                  <span style={{ fontSize: 14, fontWeight: 900, color: T.acc }}>€{fmtCC(totIvaCC)}</span>
                </div>
              )}
            </div>
          );
        })()}

        {/* Contact actions */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px" }}>
          {[
            { ico: ICO.phone, label: "Chiama",   col: T.grn,  act: () => window.location.href=`tel:${c.telefono || ""}` },
            { ico: ICO.map,   label: "Naviga",   col: T.blue, act: () => window.open(`https://maps.google.com/?q=${encodeURIComponent(c.indirizzo || "")}`) },
            { ico: ICO.send,  label: "WhatsApp", col: "#25d366", act: () => window.open(`https://wa.me/?text=${encodeURIComponent(`Commessa ${c.code} - ${c.cliente}`)}`) },
          ].map((a, i) => (
            <div key={i} onClick={a.act} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 0", background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, cursor: "pointer" }}>
              <Ico d={a.ico} s={18} c={a.col} />
              <span style={{ fontSize: 10, fontWeight: 600, color: T.sub }}>{a.label}</span>
            </div>
          ))}
        </div>

        {/* == TAB: vani / visite / info == */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.bdr}`, margin: "0 0 0 0" }}>
          {[
            {k:"sopralluoghi",l:`Vani (${vaniList.length})`},
            {k:"visite",l:`Visite (${(c.rilievi||[]).length})`},
            {k:"info",l:"ℹ Info"},
          ].map(t => (
            <div key={t.k} onClick={() => setCmSubTab(t.k)} style={{
              flex: 1, padding: "8px 4px", textAlign: "center", fontSize: 12, fontWeight: 600, cursor: "pointer",
              borderBottom: `2px solid ${cmSubTab === t.k ? T.acc : "transparent"}`,
              color: cmSubTab === t.k ? T.acc : T.sub
            }}>{t.l}</div>
          ))}
        </div>

        {/* == TAB VISITE (timeline sopralluoghi) == */}
        {cmSubTab === "visite" && (
          <div style={{ padding: "12px 16px" }}>
            {/* Stato misure globale */}
            <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 14, textAlign: "center", fontSize: 12, fontWeight: 700,
              background: c.firmaCliente ? "#34c75912" : "#ff950012",
              color: c.firmaCliente ? "#34c759" : "#ff9500",
              border: `1px solid ${c.firmaCliente ? "#34c75930" : "#ff950030"}`,
            }}>
              {c.firmaCliente
                ? "✓ Misure definitive · cliente ha firmato"
                : `+ Misure indicative · ${(c.rilievi||[]).length} ${(c.rilievi||[]).length === 1 ? "visita" : "visite"} effettuate`}
            </div>

            {/* Timeline visite */}
            {(c.rilievi||[]).length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 16px", color: T.sub }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}><I d={ICO.ruler} /></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Nessuna visita ancora</div>
                <div style={{ fontSize: 12 }}>Crea il primo rilievo dal Centro Comando</div>
              </div>
            ) : [...(c.rilievi||[])].reverse().map((ril, idx) => {
              const isLast = idx === 0;
              const nVani = (ril.vani||[]).length;
              const nMisurati = (ril.vani||[]).filter(v => Object.values(v.misure||{}).filter(x=>(x as number)>0).length >= 6).length;
              const tipoCol = ril.tipo === "modifica" ? "#ff9500" : isLast ? T.acc : T.blue;
              const isSelected = r?.id === ril.id;
              return (
                <div key={ril.id} onClick={() => { setSelectedRilievo(ril); setCmSubTab("sopralluoghi"); }}
                  style={{ display: "flex", gap: 12, marginBottom: 14, cursor: "pointer", padding: "10px 12px", borderRadius: 12,
                    background: isSelected ? `${tipoCol}10` : T.card,
                    border: `1.5px solid ${isSelected ? tipoCol : T.bdr}`,
                  }}>
                  {/* Timeline line */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 36 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${tipoCol}15`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: `1.5px solid ${tipoCol}30`, flexShrink: 0 }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: tipoCol }}>R{ril.n}</div>
                      <div style={{ fontSize: 12 }}>{ril.tipo === "modifica" ? "🔧" : "📐"}</div>
                    </div>
                    {idx < (c.rilievi||[]).length - 1 && <div style={{ width: 2, flex: 1, background: T.bdr, marginTop: 4, minHeight: 8 }} />}
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>
                        {ril.data ? new Date(ril.data + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : "·"}
                      </span>
                      {ril.ora && <span style={{ fontSize: 11, color: T.sub }}>ore {ril.ora}</span>}
                      {isLast && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: tipoCol, color: "#fff" }}>ATTUALE</span>}
                      {ril.tipo === "modifica" && <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, background: "#ff9500", color: "#fff" }}>MODIFICA</span>}
                    </div>
                    <div style={{ fontSize: 11, color: T.sub }}>
                      {ril.rilevatore || "·"} · {nVani} vani · {nMisurati === nVani && nVani > 0 ? "✓ tutte le misure" : `${nMisurati}/${nVani} misurati`}
                    </div>
                    {ril.motivoModifica && <div style={{ fontSize: 11, color: "#ff9500", marginTop: 2 }}><I d={ICO.wrench} /> {ril.motivoModifica}</div>}
                    {ril.note && <div style={{ fontSize: 11, color: T.sub, marginTop: 2, fontStyle: "italic" }}>"{ril.note}"</div>}
                    {ril._ereditatiCount > 0 && <div style={{ fontSize: 10, color: "#34c759", marginTop: 2 }}><I d={ICO.clipboard} /> {ril._ereditatiCount} vani ereditati da R{ril.n - 1}</div>}
                  </div>
                  <span style={{ color: T.sub, fontSize: 14, alignSelf: "center" }}>📷</span>
                </div>
              );
            })}
          </div>
        )}

        {/* == TAB VANI (lista vani del rilievo) == */}
        {cmSubTab === "sopralluoghi" && (
          <div style={{ padding: "0 16px 14px" }}>
            {/* Rilievo selector - mostra quale stai guardando */}
            {(c.rilievi||[]).length > 1 && r && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 0 10px", borderBottom: `1px solid ${T.bdr}`, marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginRight: 4 }}>Visita:</div>
                {(c.rilievi||[]).map((ril, ridx) => {
                  const isSel = ril.id === r.id;
                  const isLast = ridx === (c.rilievi||[]).length - 1;
                  const col = isSel ? (isLast ? T.acc : "#5856d6") : T.sub;
                  return (
                    <div key={ril.id} onClick={() => setSelectedRilievo(ril)}
                      style={{ padding: "4px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700,
                        background: isSel ? col : T.bg,
                        color: isSel ? "#fff" : T.sub,
                        border: `1.5px solid ${isSel ? col : "transparent"}`,
                      }}>
                      R{ril.n} {!isLast && isSel ? "🔒" : ""}
                    </div>
                  );
                })}
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 10, color: isStorico ? "#5856d6" : T.sub, fontWeight: isStorico ? 700 : 400 }}>
                  {isStorico ? "🔒 sola lettura" : `${(r.vani||[]).length} vani`}
                </div>
              </div>
            )}
            {/*  BANNER STORICO  */}
            {isStorico && (
              <div style={{ padding: "10px 14px", borderRadius: 10, marginBottom: 10, background: "#5856d610", border: "1.5px solid #5856d630", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}><I d={ICO.lock} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#5856d6" }}>Rilievo storico R{r?.n} · sola lettura</div>
                  <div style={{ fontSize: 10, color: T.sub }}>Questo rilievo  archiviato. Solo l'ultimo rilievo (R{lastRilievo?.n})  modificabile.</div>
                </div>
                <div onClick={() => { if (lastRilievo) setSelectedRilievo(lastRilievo); }} style={{ padding: "6px 12px", borderRadius: 8, background: T.acc, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Vai a R{lastRilievo?.n} →
                </div>
              </div>
            )}
            {vaniList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "28px 16px" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}><I d={ICO.grid} /></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>Nessun vano in questo rilievo</div>
                {isStorico ? (
                  <div style={{ fontSize: 12, color: T.sub }}>Nessun vano era presente in questa visita</div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: T.sub, marginBottom: 18, lineHeight: 1.5 }}>Aggiungi il primo vano: finestra, porta, fisso...<br/>Poi inserirai le misure e le foto</div>
                    <button onClick={() => {
                  if (!selectedCM || !selectedRilievo) return;
                  const v = { id: Date.now(), nome: `Vano 1`, tipo: "", stanza: "", piano: "", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "", misure: {}, foto: {}, note: "", cassonetto: false, pezzi: 1, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
                  const updR = { ...selectedRilievo, vani: [...(selectedRilievo.vani||[]), v] };
                  setCantieri(cs => cs.map(cm => cm.id === selectedCM?.id ? { ...cm, rilievi: cm.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2), aggiornato: "Oggi" } : cm));
                  setSelectedRilievo(updR);
                  setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2) }));
                  setSelectedVano(v);
                  setVanoStep(0);
                }} style={{ ...S.btn, margin: "0 auto", padding: "14px 32px", fontSize: 15 }}>+ Aggiungi primo vano</button>
                  </>
                )}
              </div>
            ) : vaniList.map(v => {
              const nMisure = Object.values(v.misure||{}).filter(x=>(x as number)>0).length;
              const completo = nMisure >= 6;
              const bloccato = v.note?.startsWith("+ BLOCCATO");
              const colore = bloccato ? T.red : completo ? T.grn : T.orange;
              return (
                <div key={v.id} onClick={() => { console.log("CLICK VANO", v?.id, v?.nome); setSelectedVano(v); setVanoStep(0); }}
                  style={{ ...S.card, marginBottom: 8, padding: "12px 14px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 12,
                    borderLeft: `3px solid ${colore}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{v.nome}</span>
                      {/* Badge rilievo di appartenenza */}
                      {(() => {
                        const rIdx = c.rilievi?.findIndex(r => r.vani?.some(vv => vv.id === v.id));
                        if (rIdx == null || rIdx < 0) return null;
                        const ril = c.rilievi[rIdx];
                        const questoBloccato = v.note?.startsWith("+ BLOCCATO");
                        const questoIncompleto = !questoBloccato && Object.values(v.misure||{}).filter(x=>(x as number)>0).length > 0 && Object.values(v.misure||{}).filter(x=>(x as number)>0).length < 6;
                        const haProblema = questoBloccato || questoIncompleto;
                        return (
                          <span style={{
                            fontSize: 9, fontWeight: 800, borderRadius: 6, padding: "1px 6px",
                            background: haProblema ? T.redLt : T.bg,
                            color: haProblema ? T.red : T.sub,
                            border: `1px solid ${haProblema ? T.red+"40" : T.bdr}`
                          }}>
                            R{rIdx + 1} · {ril.data || ril.dataRilievo || "·"}
                            {haProblema && " <I d={ICO.alertTriangle} />"}
                          </span>
                        );
                      })()}
                    </div>
                    <div style={{ fontSize: 11, color: T.sub }}>{v.tipo} · {v.stanza} · {v.piano}</div>
                    {bloccato && <div style={{ fontSize: 11, color: T.red, marginTop: 2 }}>{v.note?.replace("+ BLOCCATO: ","")}</div>}
                  </div>
                  <div style={{ textAlign: "right", display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                    {/* Badge pezzi */}
                    <span style={{ fontSize:12, fontWeight:800, color:"#fff",
                      background: bloccato ? T.red : completo ? T.grn : T.orange,
                      borderRadius:8, padding:"2px 8px", minWidth:28, textAlign:"center" }}>
                      {v.pezzi||1} pz
                    </span>
                    {bloccato
                      ? <span style={S.badge(T.redLt, T.red)}><I d={ICO.alertTriangle} /> Bloccato</span>
                      : completo
                      ? <span style={S.badge(T.grnLt, T.grn)}>✓ {nMisure} mis.</span>
                      : <span style={S.badge(T.orangeLt, T.orange)}><I d={ICO.alertTriangle} /> {nMisure} mis.</span>}
                  </div>
                  <span style={{ color: T.sub, fontSize: 14 }}>📷</span>
                </div>
              );
            })}
            {vaniList.length > 0 && !isStorico && (
              <div onClick={() => {
                if (!selectedCM || !selectedRilievo) return;
                const v = { id: Date.now(), nome: `Vano ${(selectedRilievo.vani?.length||0)+1}`, tipo: "", stanza: "", piano: "", sistema: "", coloreInt: "", coloreEst: "", bicolore: false, coloreAcc: "", vetro: "", telaio: "", telaioAlaZ: "", rifilato: false, rifilSx: "", rifilDx: "", rifilSopra: "", rifilSotto: "", coprifilo: "", lamiera: "", difficoltaSalita: "", mezzoSalita: "", misure: {}, foto: {}, note: "", cassonetto: false, pezzi: 1, accessori: { tapparella: { attivo: false }, persiana: { attivo: false }, zanzariera: { attivo: false } } };
                const updR = { ...selectedRilievo, vani: [...(selectedRilievo.vani||[]), v] };
                setCantieri(cs => cs.map(cm => cm.id === selectedCM?.id ? { ...cm, rilievi: cm.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2), aggiornato: "Oggi" } : cm));
                setSelectedRilievo(updR);
                setSelectedCM(prev => ({ ...prev, rilievi: prev.rilievi.map(r2 => r2.id === selectedRilievo.id ? updR : r2) }));
                setSelectedVano(v);
                setVanoStep(0);
              }}
                style={{ ...S.card, padding: "11px 14px", marginTop: 6, cursor: "pointer",
                  border: `1px dashed ${T.bdr}`, background: "transparent",
                  display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                <span style={{ fontSize: 18, color: T.acc }}>+</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.acc }}>Aggiungi vano</span>
              </div>
            )}
          </div>
        )}

        {/* == TAB MISURE (stato per vano) == */}
        {vaniList.length > 0 && cmSubTab === "misure_tab" && (
          <div style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Stato per vano</div>
            {vaniList.map(v => {
              const mis = vaniM.includes(v.id);
              const blk = !mis && ulB(v.id);
              let daV = null;
              for (let i = viste.length - 1; i >= 0; i--) {
                if (viste[i].vaniMisurati?.includes(v.id)) { daV = viste[i]; break; }
              }
              return (
                <div key={v.id} style={{ ...S.card, marginBottom: 8 }}>
                  <div style={{ padding: "11px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: mis ? T.grnLt : blk ? T.redLt : T.bdr, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                      {mis ? "✓" : blk ? "+" : "📐"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{v.nome}</div>
                        <span style={{ fontSize: 10, color: T.sub }}>~{v.mq}m²</span>
                      </div>
                      {mis && daV && <div style={{ fontSize: 11, color: T.sub }}>{daV.n}·· visita · {new Date(daV.data + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</div>}
                      {!mis && blk && <div style={{ fontSize: 11, color: T.red }}>{blk.motivo}{blk.note && <span style={{ color: T.sub }}> · {blk.note}</span>}</div>}
                      {!mis && !blk && <div style={{ fontSize: 11, color: T.sub }}>Non ancora visitato</div>}
                    </div>
                    {!mis && <span style={{ ...S.badge(T.redLt, T.red), flexShrink: 0, fontSize: 9 }}>DA FARE</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* == TAB INFO RILIEVO == */}
        {cmSubTab === "info" && (
          <div style={{ padding: "14px 16px" }}>
            {/* Info rilievo */}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Dettagli Rilievo</div>
            {[
              ["Tipo",       tipoLblRil],
              ["Data",       r?.data ? new Date(r.data + "T12:00:00").toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long", year:"numeric" }) : "·"],
              ["Ora",        r?.ora || "·"],
              ["Rilevatore", r?.rilevatore || "·"],
              ["N. vani",    `${vaniList.length} vani`],
              ["Avanzamento",`${progVani}% (${vaniMisurati.length}/${vaniList.length})`],
              ...(r?.motivoModifica ? [["Motivo", r.motivoModifica]] : []),
              ...(r?.note ? [["Note", r.note]] : []),
            ].map(([k, v]) => (
              <div key={k} style={{ ...S.card, padding: "11px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 600, textAlign: "right" }}>{v}</div>
              </div>
            ))}
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 16 }}>Commessa</div>
            {[
              ["Cliente",   `${c.cliente} ${c.cognome || ""}`],
              ["Codice",    c.code],
              ["Indirizzo", c.indirizzo],
              ["Telefono",  c.telefono || "·"],
              ["Sistema",   c.sistema || "·"],
              ...(c.euro ? [["Importo", `€${c.euro.toLocaleString("it-IT")}`]] : []),
              ["Rilievi",   `${(c.rilievi||[]).length} totali`],
            ].map(([k, v]) => (
              <div key={k} style={{ ...S.card, padding: "11px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 12, color: T.sub, fontWeight: 600, flexShrink: 0 }}>{k}</div>
                <div style={{ fontSize: 12, fontWeight: 600, textAlign: "right" }}>{v}</div>
              </div>
            ))}
          </div>
        )}

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const a={id:Date.now(),tipo:"file",nome:f.name,data:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}),dataUrl:ev.target.result};setCantieri(cs=>cs.map(x=>x.id===selectedCM.id?{...x,allegati:[...(x.allegati||[]),a]}:x));setSelectedCM(p=>({...p,allegati:[...(p.allegati||[]),a]}));};r.readAsDataURL(f);e.target.value="";}}/> 
        <input ref={fotoInputRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const a={id:Date.now(),tipo:"foto",nome:f.name,data:new Date().toLocaleTimeString("it-IT",{hour:"2-digit",minute:"2-digit"}),dataUrl:ev.target.result};setCantieri(cs=>cs.map(x=>x.id===selectedCM.id?{...x,allegati:[...(x.allegati||[]),a]}:x));setSelectedCM(p=>({...p,allegati:[...(p.allegati||[]),a]}));};r.readAsDataURL(f);e.target.value="";}}/> 


        {/* SEGNALA PROBLEMA */}
        <div style={{ padding: "0 16px", marginBottom: 8, display: "flex", gap: 8 }}>
          <button onClick={() => { setProblemaForm({ titolo: "", descrizione: "", tipo: "materiale", priorita: "media", assegnato: "" }); setShowProblemaModal(true); }} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #FF3B30", background: "#FF3B3008", color: "#FF3B30", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, position: "relative" }}>
            <I d={ICO.alertTriangle} /> Segnala problema
            {problemi.filter(p => p.commessaId === c.id && p.stato !== "risolto").length > 0 && <span style={{ position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: "50%", background: "#FF3B30", color: "#fff", fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{problemi.filter(p => p.commessaId === c.id && p.stato !== "risolto").length}</span>}
          </button>
          {problemi.filter(p => p.commessaId === c.id).length > 0 && (
            <button onClick={() => { setShowProblemiView(true); }} style={{ padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${T.bdr}`, background: T.card, color: T.text, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: FF, display: "flex", alignItems: "center", gap: 6 }}>
              <I d={ICO.clipboard} /> {problemi.filter(p => p.commessaId === c.id).length}
            </button>
          )}
        </div>

        {/* Allegati / Note / Vocali / Video */}
        <div style={{ padding: "0 16px", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { ico: <I d={ICO.paperclip} />, label: "File", act: () => fileInputRef.current?.click() },
              { ico: <I d={ICO.camera} />, label: "Foto", act: () => fotoInputRef.current?.click() },
              { ico: <I d={ICO.fileText} />, label: "Nota", act: () => { setShowAllegatiModal("nota"); setAllegatiText(""); }},
              { ico: <I d={ICO.mic} />, label: "Vocale", act: () => { setShowAllegatiModal("vocale"); }},
              { ico: <I d={ICO.clapperboard} />, label: "Video", act: () => { setShowAllegatiModal("video"); }},
            ].map((b, i) => (
              <div key={i} onClick={b.act} style={{ flex: 1, padding: "10px 4px", background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer" }}>
                <div style={{ fontSize: 18 }}>{b.ico}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.sub, marginTop: 2 }}>{b.label}</div>
              </div>
            ))}
          </div>
          {/* Lista allegati */}
          {(c.allegati || []).length > 0 && (
            <div style={{ marginTop: 6, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, overflow: "hidden" }}>
              {(c.allegati || []).map(a => (
                <div key={a.id} style={{ borderBottom: `1px solid ${T.bg}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                    <span style={{ fontSize: 16 }}>{a.tipo === "nota" ? "📋" : a.tipo === "vocale" ? "🎵" : a.tipo === "video" ? "🎵" : a.tipo === "foto" ? "📐" : "🎵"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{a.nome}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{a.data ? new Date(a.data+'T12:00:00').toLocaleDateString('it-IT') : a.data}{a.durata ? ` · ${a.durata}` : ""}</div>
                    </div>
                    {/* Audio: play inline */}
                    {a.tipo === "vocale" && (
                      <div onClick={() => playAllegato(a.id)} style={{ padding: "3px 8px", borderRadius: 6, background: playingId === a.id ? T.redLt : T.accLt, fontSize: 10, fontWeight: 600, color: playingId === a.id ? T.red : T.acc, cursor: "pointer" }}>
                        {playingId === a.id ? "⏹ Stop" : "▶ Play"}
                      </div>
                    )}
                    {/* Video: open/close inline player */}
                    {a.tipo === "video" && a.dataUrl && (
                      <div onClick={() => setViewingVideoId(viewingVideoId === a.id ? null : a.id)} style={{ padding: "3px 8px", borderRadius: 6, background: viewingVideoId === a.id ? T.blueLt : T.accLt, fontSize: 10, fontWeight: 600, color: viewingVideoId === a.id ? T.blue : T.acc, cursor: "pointer" }}>
                        {viewingVideoId === a.id ? "✓ Chiudi" : "▶ Guarda"}
                      </div>
                    )}
                    {a.tipo === "video" && a.dataUrl && (
                      <a href={a.dataUrl} download={a.nome || "video.webm"} style={{ padding: "3px 8px", borderRadius: 6, background: T.bg, fontSize: 10, fontWeight: 600, color: T.sub, cursor: "pointer", textDecoration: "none" }}>🔗</a>
                    )}
                    {/* Photo: toggle inline preview */}
                    {a.tipo === "foto" && a.dataUrl && (
                      <div onClick={() => setViewingPhotoId(viewingPhotoId === a.id ? null : a.id)} style={{ padding: "3px 8px", borderRadius: 6, background: T.accLt, fontSize: 10, fontWeight: 600, color: T.acc, cursor: "pointer" }}>
                        {viewingPhotoId === a.id ? "✓ Chiudi" : "📸 Vedi"}
                      </div>
                    )}
                    {a.tipo === "foto" && a.dataUrl && <img src={a.dataUrl} style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6, flexShrink: 0 }} alt="" />}
                    {a.tipo === "file" && a.dataUrl && <a href={a.dataUrl} download={a.nome} style={{ padding: "3px 8px", borderRadius: 6, background: T.accLt, fontSize: 10, fontWeight: 600, color: T.acc, cursor: "pointer", textDecoration: "none" }}><I d={ICO.folder} /> Apri</a>}
                    {a.tipo === "firma" && a.dataUrl && <span onClick={() => { const w = window.open(""); w?.document.write(`<iframe src="${a.dataUrl}" style="width:100%;height:100vh;border:none"></iframe>`); }} style={{ padding: "3px 8px", borderRadius: 6, background: "#34c75912", fontSize: 10, fontWeight: 600, color: "#34c759", cursor: "pointer" }}>📸 Apri</span>}
                    {a.tipo === "firma" && a.dataUrl && <a href={a.dataUrl} download={a.nome} style={{ padding: "3px 8px", borderRadius: 6, background: T.bg, fontSize: 10, fontWeight: 600, color: T.sub, cursor: "pointer", textDecoration: "none" }}>🔗</a>}
                    {/* Delete */}
                    <div onClick={() => { setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, allegati: (x.allegati || []).filter(al => al.id !== a.id) } : x)); setSelectedCM(p => ({ ...p, allegati: (p.allegati || []).filter(al => al.id !== a.id) })); }} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={12} c={T.sub} /></div>
                  </div>
                  {/* Audio progress bar */}
                  {a.tipo === "vocale" && playingId === a.id && (
                    <div style={{ height: 3, background: T.bdr, margin: "0 12px 6px" }}>
                      <div style={{ height: "100%", background: T.acc, borderRadius: 2, width: `${playProgress}%`, transition: "width 0.1s linear" }} />
                    </div>
                  )}
                  {/* Inline VIDEO player */}
                  {a.tipo === "video" && viewingVideoId === a.id && a.dataUrl && (
                    <div style={{ padding: "6px 12px 10px" }}>
                      <video src={a.dataUrl} controls playsInline autoPlay
                        style={{ width: "100%", maxHeight: 280, borderRadius: 10, background: "#000" }} />
                    </div>
                  )}
                  {/* Inline PHOTO full preview */}
                  {a.tipo === "foto" && viewingPhotoId === a.id && a.dataUrl && (
                    <div style={{ padding: "6px 12px 10px" }}>
                      <img src={a.dataUrl} style={{ width: "100%", borderRadius: 10 }} alt={a.nome} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/*  SEZIONE INTERVENTI  */}
        {montaggiDB.filter(m => String(m.cmId) === String(c.id)).length > 0 && (
          <>
            <div style={{ ...S.section, marginTop: 8 }}>
              <div style={S.sectionTitle}><I d={ICO.wrench} /> Interventi ({montaggiDB.filter(m => String(m.cmId) === String(c.id)).length})</div>
            </div>
            <div style={{ padding: "0 16px" }}>
              <InterventoTab
                montaggiDB={montaggiDB}
                cmId={c.id}
                squadreDB={squadreDB}
                T={T}
                onOpenIntervento={(m) => setInterventoOpen(m)}
              />
            </div>
          </>
        )}

        {/* Timeline/Log */}
        {c.log && c.log.length > 0 && (
          <>
            <div style={{ ...S.section, marginTop: 8 }}>
              <div style={S.sectionTitle}>Cronologia</div>
            </div>
            <div style={{ padding: "0 16px" }}>
              {c.log.map((l, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, flexShrink: 0 }} />
                    {i < c.log.length - 1 && <div style={{ width: 1, flex: 1, background: T.bdr, marginTop: 4 }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.text, lineHeight: 1.3 }}><strong>{l.chi}</strong> {l.cosa}</div>
                    <div style={{ fontSize: 10, color: T.sub2, marginTop: 1 }}>{l.quando}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Elimina */}
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {c.fase === "chiusura" && <div style={{ fontSize: 12, fontWeight: 700, color: T.grn }}>✓ Commessa chiusa</div>}
          <span onClick={() => deleteCommessa(c.id)} style={{ fontSize: 11, color: T.sub2, cursor: "pointer", textDecoration: "underline" }}>Elimina commessa</span>
        </div>

        {/*  INTERVENTO FLOW PANEL (fixed overlay)  */}
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

        {/*  MODAL FASCICOLO GEOMETRA  */}
        {showFascicoloModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9000, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
            <div style={{ background: T.bg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 580, maxHeight: "88vh", overflowY: "auto", padding: "20px 16px 32px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #2D7A6B, #1A9E73)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginRight: 10 }}>📐</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Fascicolo Geometra</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{(getVaniAttivi(c) || []).length} vani · {c.code || c.id}</div>
                </div>
                <div onClick={() => setShowFascicoloModal(false)} style={{ fontSize: 20, color: T.sub, cursor: "pointer", padding: "0 4px" }}>✓</div>
              </div>

              {/* Stato generazione */}
              {fascicoloStep === "generato" && fascicoloLink && (
                <div style={{ background: "#E8F5E9", borderRadius: 12, padding: "12px 14px", marginBottom: 14, border: "1px solid #A5D6A7" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#2E7D32", marginBottom: 6 }}>✓ Fascicolo generato!</div>
                  <div style={{ fontSize: 11, color: "#388E3C", wordBreak: "break-all" as const, marginBottom: 8 }}>{fascicoloLink}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => {
                      navigator.clipboard.writeText(fascicoloLink);
                      setFascicoloLinkCopied(true);
                      setTimeout(() => setFascicoloLinkCopied(false), 2000);
                    }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#2E7D32", border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      {fascicoloLinkCopied ? "✓ Copiato!" : "🔗 Copia link"}
                    </button>
                    <button onClick={() => {
                      const text = encodeURIComponent(`Gentile cliente, ecco il fascicolo tecnico della sua commessa: ${fascicoloLink}`);
                      window.open(`https://wa.me/?text=${text}`, "_blank");
                    }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#25d366", border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      💬 WhatsApp
                    </button>
                    {c.email && (
                      <button onClick={() => {
                        const sub = encodeURIComponent(`Fascicolo Tecnico · ${c.code || "Commessa"}`);
                        const body = encodeURIComponent(`Gentile ${[c.cliente, c.cognome].filter(Boolean).join(" ") || "cliente"},\n\nLe invio il fascicolo tecnico della sua commessa:\n${fascicoloLink}\n\nIl link  valido per 30 giorni.\n\nCordiali saluti,\n${aziendaInfo?.ragione || ""}`);
                        window.open(`mailto:${c.email}?subject=${sub}&body=${body}`, "_blank");
                      }} style={{ flex: 1, padding: "8px", borderRadius: 8, background: T.blue, border: "none", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                        📧 Email
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Azioni principali */}
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 16 }}>

                {/* Genera link condivisibile */}
                <button
                  onClick={async () => {
                    setFascicoloLoading(true);
                    try {
                      const vani = getVaniAttivi(c) || [];
                      const snap = buildSnapshot(c, vani, aziendaInfo, sistemiDB, vetriDB, calcolaVanoPrezzo);
                      const result = await creaFascicolo(snap, c.id, aziendaInfo?.id || "");
                      if (result) {
                        setFascicoloLink(result.url);
                        setFascicoloStep("generato");
                        // Ricarica storico
                        const storico = await getFascicoliCommessa(c.id);
                        setFascicoliStorico(storico);
                      }
                    } finally {
                      setFascicoloLoading(false);
                    }
                  }}
                  disabled={fascicoloLoading}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "linear-gradient(135deg, #2D7A6B, #1A9E73)", color: "#fff", fontSize: 14, fontWeight: 800, cursor: fascicoloLoading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: fascicoloLoading ? 0.7 : 1 }}
                >
                  {fascicoloLoading ? "+▶ Generazione..." : "🔧 Genera link condivisibile (30gg)"}
                </button>

                {/* Scarica PDF */}
                <button
                  onClick={() => {
                    const vani = getVaniAttivi(c) || [];
                    const snap = buildSnapshot(c, vani, aziendaInfo, sistemiDB, vetriDB, calcolaVanoPrezzo);
                    generaFascicoloGeometraPDF(snap);
                  }}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: `1.5px solid ${T.teal}`, background: `${T.teal}10`, color: T.teal, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  📋 Scarica PDF Fascicolo
                </button>

                {/* Scarica Excel ENEA */}
                <button
                  onClick={() => {
                    const vani = getVaniAttivi(c) || [];
                    const snap = buildSnapshot(c, vani, aziendaInfo, sistemiDB, vetriDB, calcolaVanoPrezzo);
                    generaExcelFascicolo(snap);
                  }}
                  style={{ width: "100%", padding: 14, borderRadius: 12, border: `1.5px solid ${T.grn}`, background: `${T.grn}10`, color: T.grn, fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  📊 Scarica Excel ENEA/AdE
                </button>
              </div>

              {/* Storico link generati */}
              {fascicoliStorico.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 8 }}>Link precedenti</div>
                  {fascicoliStorico.map((fs) => {
                    const scaduto = new Date(fs.expires_at) < new Date();
                    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
                    const link = `${baseUrl}/fascicolo/${fs.token}`;
                    return (
                      <div key={fs.token} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: T.card, borderRadius: 10, marginBottom: 6, border: `1px solid ${T.bdr}`, opacity: scaduto ? 0.5 : 1 }}>
                        <span style={{ fontSize: 12 }}>{scaduto ? "🔒" : "🔧"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: T.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{new Date(fs.created_at).toLocaleDateString("it-IT")} · {fs.view_count || 0} visualizzazioni</div>
                          <div style={{ fontSize: 10, color: scaduto ? T.red : T.green }}>{scaduto ? "Scaduto" : `Valido fino al ${new Date(fs.expires_at).toLocaleDateString("it-IT")}`}</div>
                        </div>
                        {!scaduto && (
                          <>
                            <button onClick={() => { navigator.clipboard.writeText(link); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.bdr}`, background: T.bg, fontSize: 10, cursor: "pointer", color: T.text }}>Copia</button>
                            <button onClick={async () => { await revocaFascicolo(fs.token); const s = await getFascicoliCommessa(c.id); setFascicoliStorico(s); }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.red}30`, background: `${T.red}10`, fontSize: 10, cursor: "pointer", color: T.red }}>Revoca</button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );

}
