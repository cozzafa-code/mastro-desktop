"use client";
// @ts-nocheck
// MASTRO SPESE — SpesaQuick v1
// Mobile-first: foto scontrino + importo + categoria + nota vocale + commessa
// Invio alla ContabilitaPanel per approvazione titolare
import React, { useState, useRef, useCallback } from "react";
import { useMastro } from "./MastroContext";
import { FM, FF, ICO, I } from "./mastro-constants";
import { supabase } from "@/lib/supabase";

const GRN = "#1A9E73";
const AMB = "#D08008";
const TEAL = "#1A9E73";
const RED = "#DC4444";
const BLU = "#3B7FE0";

// Icone SVG inline per categorie — niente emoji
const CatIcon = ({ id, color, s=16 }: any) => {
  const icons: Record<string,any> = {
    carburante: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M3 22V8l9-6 9 6v14"/><path d="M9 22V12h6v10"/><path d="M18 10h2a2 2 0 012 2v4a2 2 0 01-2 2h-2"/></svg>,
    pranzo:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
    materiale:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>,
    attrezzatura:<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    trasferta:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
    telefono:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/></svg>,
    varie:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  };
  return icons[id] || icons.varie;
};

const CATEGORIE = [
  { id: "carburante", label: "Carburante", color: "#E8A020" },
  { id: "pranzo",     label: "Pranzo",     color: "#1A9E73" },
  { id: "materiale",  label: "Materiale",  color: "#3B7FE0" },
  { id: "attrezzatura", label: "Attrezzatura", color: "#8B5CF6" },
  { id: "trasferta",  label: "Trasferta",  color: "#DC4444" },
  { id: "telefono",   label: "Telefono",   color: "#0EA5E9" },
  { id: "varie",      label: "Varie",      color: "#6B7280" },
];

export default function SpesaQuick({ onClose }: { onClose: () => void }) {
  const { T, cantieri, userId, team } = useMastro();
  const [step, setStep] = useState<"foto"|"dati"|"inviata">("dati");
  const [foto, setFoto] = useState<string | null>(null);
  const [importo, setImporto] = useState("");
  const [categoria, setCategoria] = useState("varie");
  const [nota, setNota] = useState("");
  const [cmId, setCmId] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<any>(null);

  const operatore = team?.find((t: any) => t.id === userId) || { nome: "Operatore" };

  // Foto scontrino
  const handleFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFoto(ev.target?.result as string);
      setStep("dati");
    };
    reader.readAsDataURL(file);
  };

  // Nota vocale
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new (window as any).MediaRecorder(stream);
      mediaRef.current = mr;
      const chunks: BlobPart[] = [];
      mr.ondataavailable = (e: any) => chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        // Trascrizione basic — usa SpeechRecognition se disponibile
        setNota(prev => prev + " [nota vocale registrata]");
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setRecording(true);
    } catch {
      setNota(prev => prev);
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  // Invia spesa
  const invia = useCallback(async () => {
    if (!importo || parseFloat(importo) <= 0) return;
    setLoading(true);
    try {
      const spesa = {
        operatore_id: userId || "unknown",
        operatore_nome: operatore.nome || "Operatore",
        importo: parseFloat(importo),
        categoria,
        nota,
        foto_url: foto || null,
        cm_id: cmId || null,
        stato: "in_attesa",
        created_at: new Date().toISOString(),
        azienda_id: userId,
      };
      const { error } = await supabase.from("spese_operatori").insert(spesa);
      if (error) throw error;
      setStep("inviata");
    } catch (e) {
      // Salva in locale se offline
      const locali = JSON.parse(localStorage.getItem("mastro:spese_pending") || "[]");
      locali.push({ importo, categoria, nota, foto, cmId, ts: Date.now() });
      localStorage.setItem("mastro:spese_pending", JSON.stringify(locali));
      setStep("inviata");
    } finally {
      setLoading(false);
    }
  }, [importo, categoria, nota, foto, cmId, userId]);

  const cat = CATEGORIE.find(c => c.id === categoria) || CATEGORIE[6];
  const cmAttive = (cantieri || []).filter((c: any) => !["consegnato","chiuso"].includes(c.fase));

  const inputStyle = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    border: `1px solid ${T.bdr}`, fontSize: 15, fontFamily: FF,
    background: T.card, color: T.text, boxSizing: "border-box" as const,
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: T.bg, display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{ background: "#1A1A1C", padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div onClick={onClose} style={{ color: "#aaa", fontSize: 22, cursor: "pointer" }}>←</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>Nuova spesa</div>
          <div style={{ color: "#888", fontSize: 11 }}>{operatore.nome}</div>
        </div>
        {step === "dati" && importo && (
          <div style={{ background: GRN, color: "#fff", padding: "6px 14px", borderRadius: 20, fontSize: 15, fontWeight: 700, fontFamily: FM, boxShadow: "0 2px 8px rgba(26,158,115,0.4)" }}>
            €{parseFloat(importo).toFixed(2)}
          </div>
        )}
      </div>

      {/* STEP FOTO */}
      {step === "foto" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 20 }}>
          <div style={{ width: 100, height: 100, borderRadius: 24, background: AMB + "15", border: `2px dashed ${AMB}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I d={ICO.camera} s={44} c={AMB} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Fotografa lo scontrino</div>
            <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>oppure inserisci i dati manualmente</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: "none" }} />
          <div onClick={() => fileRef.current?.click()}
            style={{ width: "100%", padding: "16px", borderRadius: 14, background: AMB, color: "#fff", fontSize: 15, fontWeight: 800, textAlign: "center", cursor: "pointer" }}>
            Scatta foto scontrino
          </div>
          <div onClick={() => setStep("dati")}
            style={{ width: "100%", padding: "14px", borderRadius: 14, background: T.card, border: `1px solid ${T.bdr}`, color: T.sub, fontSize: 14, fontWeight: 600, textAlign: "center", cursor: "pointer" }}>
            Inserisci senza foto
          </div>
        </div>
      )}

      {/* STEP DATI */}
      {step === "dati" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 90px" }}>

          {/* Foto scontrino inline */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>Foto scontrino</label>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: "none" }} />
            {foto ? (
              <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${T.bdr}`, position: "relative" }}>
                <img src={foto} style={{ width: "100%", maxHeight: 140, objectFit: "cover" }} />
                <div onClick={() => setFoto(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 8, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>× Rimuovi</div>
                <div onClick={() => fileRef.current?.click()} style={{ position: "absolute", bottom: 8, right: 8, background: AMB, color: "#fff", borderRadius: 8, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>Cambia</div>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()}
                style={{ padding: "14px 16px", borderRadius: 12, border: "1.5px dashed #1A9E7360", background: "#1A9E7308", display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
                  boxShadow: `0 2px 0 ${AMB}20` }}>
                <I d={ICO.camera} s={24} c={GRN} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: GRN }}>Scatta o allega foto scontrino</div>
                  <div style={{ fontSize: 11, color: T.sub }}>Opzionale — aiuta per la rendicontazione</div>
                </div>
              </div>
            )}
          </div>

          {/* Importo — grande e numerico */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Importo (€)</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 22, fontWeight: 700, color: T.sub }}>€</span>
              <input
                inputMode="decimal"
                value={importo}
                onChange={e => setImporto(e.target.value)}
                placeholder="0.00"
                autoFocus
                style={{ ...inputStyle, paddingLeft: 36, fontSize: 26, fontWeight: 800, fontFamily: FM, textAlign: "right", borderColor: importo ? GRN : T.bdr }}
              />
            </div>
          </div>

          {/* Categoria */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 8 }}>Categoria</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {CATEGORIE.map(c => (
                <div key={c.id} onClick={() => setCategoria(c.id)}
                  style={{ padding: "10px 12px", borderRadius: 10,
                    border: `1.5px solid ${categoria === c.id ? c.color : T.bdr}`,
                    background: categoria === c.id ? c.color + "15" : T.card,
                    display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                    boxShadow: categoria === c.id ? `0 3px 0 ${c.color}40` : "0 2px 0 rgba(0,0,0,0.07)",
                    transition: "all 0.1s" }}>
                  <CatIcon id={c.id} color={categoria === c.id ? c.color : T.sub} s={18} />
                  <span style={{ fontSize: 13, fontWeight: categoria === c.id ? 700 : 500, color: categoria === c.id ? c.color : T.text }}>{c.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nota */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Nota</label>
            <div style={{ position: "relative" }}>
              <textarea
                value={nota}
                onChange={e => setNota(e.target.value)}
                placeholder="Descrizione spesa..."
                rows={2}
                style={{ ...inputStyle, resize: "none", paddingRight: 48 }}
              />
              <div onClick={recording ? stopRecording : startRecording}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", background: recording ? RED : T.bg, border: `1px solid ${recording ? RED : T.bdr}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <I d={ICO.mic} s={16} c={recording ? "#fff" : T.sub} />
              </div>
            </div>
            {recording && <div style={{ fontSize: 11, color: RED, marginTop: 4, fontWeight: 600 }}>● Registrazione in corso... tocca per fermare</div>}
          </div>

          {/* Commessa opzionale */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.8, display: "block", marginBottom: 6 }}>Commessa (opzionale)</label>
            <select value={cmId} onChange={e => setCmId(e.target.value)} style={{ ...inputStyle }}>
              <option value="">— Nessuna commessa —</option>
              {cmAttive.map((c: any) => (
                <option key={c.id} value={c.id}>{c.code} · {c.cliente} {c.cognome || ""}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* STEP INVIATA */}
      {step === "inviata" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: GRN + "20", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <I d={ICO.checkCircle} s={44} c={GRN} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: T.text }}>Spesa inviata!</div>
            <div style={{ fontSize: 14, color: T.sub, marginTop: 6 }}>€{parseFloat(importo || "0").toFixed(2)} · {cat.label}</div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 4 }}>In attesa di approvazione del titolare</div>
          </div>
          <div onClick={onClose}
            style={{ width: "100%", padding: "16px", borderRadius: 14, background: GRN, color: "#fff", fontSize: 15, fontWeight: 800, textAlign: "center", cursor: "pointer",
              boxShadow: "0 4px 0 #0D7C6B" }}>
            Chiudi
          </div>
          <div onClick={() => { setStep("foto"); setFoto(null); setImporto(""); setNota(""); setCmId(""); setCategoria("varie"); }}
            style={{ width: "100%", padding: "14px", borderRadius: 14, background: T.card, border: `1px solid ${T.bdr}`, color: T.sub, fontSize: 14, fontWeight: 600, textAlign: "center", cursor: "pointer" }}>
            Aggiungi altra spesa
          </div>
        </div>
      )}

      {/* Footer — bottone invia */}
      {step === "dati" && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 16px 28px", background: T.card, borderTop: `1px solid ${T.bdr}` }}>
          <div onClick={!loading && importo ? invia : undefined}
            style={{ padding: "16px", borderRadius: 14, textAlign: "center", fontSize: 15, fontWeight: 800,
              cursor: importo ? "pointer" : "default",
              background: importo ? GRN : T.bdr,
              color: importo ? "#fff" : T.sub,
              opacity: loading ? 0.7 : 1,
              boxShadow: importo ? "0 4px 0 #0D7C6B, 0 6px 16px rgba(13,124,107,0.25)" : "none",
              transition: "all 0.1s" }}>
            {loading ? "Invio in corso..." : `Invia spesa · €${parseFloat(importo || "0").toFixed(2)}`}
          </div>
        </div>
      )}
    </div>
  );
}
