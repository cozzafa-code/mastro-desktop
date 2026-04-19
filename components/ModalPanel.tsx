"use client";
// @ts-nocheck
// ═════════════════════════════════════
// MASTRO ERP · ModalPanel
// Estratto S7: ~718 righe (Modali: nuova commessa, task, email, segnalazione)
// ═════════════════════════════════════
import React from "react";
import { useMastro } from "./MastroContext";
import { FM } from "./mastro-constants";

export default function ModalPanel() {
  const {
    T, S, isDesktop, fs,
    // State
    showModal, setShowModal, cantieri, setCantieri, contatti, setContatti, team,
    newCM, setNewCM, newTask, setNewTask, taskAllegati, setTaskAllegati,
    // Email
    showEmailComposer, setShowEmailComposer, emailDest, setEmailDest,
    emailOggetto, setEmailOggetto, emailCorpo, setEmailCorpo,
    showMailModal, setShowMailModal, mailBody, setMailBody,
    // Segnalazione
    ripSearch, setRipSearch, ripCMSel, setRipCMSel,
    ripUrgenza, setRipUrgenza, ripProblema, setRipProblema,
    ripFotos, setRipFotos, ripFotoRef,
    mezziSalita,
    // Helpers
    addCommessa, addTask, getVaniAttivi,
    setSelectedCM, setTab,
    // Business logic
    inviaEmail,
  } = useMastro();

    if (!showModal) return null;
    return (
      <div style={S.modal} onClick={e => e.target === e.currentTarget && setShowModal(null)}>
        <div style={S.modalInner}>
          {/* TASK MODAL */}
          {/* === MODAL MANDA MAIL === */}
          {showMailModal && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
              onClick={e => e.target === e.currentTarget && setShowMailModal(null)}>
              <div style={{ background:T.bg, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:480, maxHeight:"85vh", overflow:"auto", paddingBottom:24 }}>
                {/* Header */}
                <div style={{ padding:"16px 16px 10px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, background:T.bg, zIndex:1, borderBottom:`1px solid ${T.bdr}` }}>
                  <span style={{ fontSize:22 }}>⚡</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:T.text }}>Manda Mail</div>
                    <div style={{ fontSize:11, color:T.sub }}>
                      {showMailModal.cm ? `${showMailModal.cm.cliente} ${showMailModal.cm.cognome||""}`.trim() : showMailModal.ev.persona || "Cliente"}
                      {showMailModal.cm?.email ? ` À ${showMailModal.cm.email}` : ""}
                    </div>
                  </div>
                  <div onClick={() => setShowMailModal(null)} style={{ width:30, height:30, borderRadius:"50%", background:T.bdr, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16, color:T.sub }}>ù</div>
                </div>

                <div style={{ padding:"14px 16px" }}>
                  {/* Info evento */}
                  <div style={{ background:T.accLt, borderRadius:10, padding:"10px 12px", marginBottom:12, borderLeft:`3px solid ${T.acc}` }}>
                    <div style={{ fontSize:12, fontWeight:700, color:T.acc, marginBottom:2 }}>{showMailModal.ev.text}</div>
                    <div style={{ fontSize:11, color:T.sub }}>
                      {new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"short", day:"numeric", month:"short" })}
                      {showMailModal.ev.time ? " À " + showMailModal.ev.time : ""}
                      {showMailModal.ev.addr ? " À 📧 " + showMailModal.ev.addr : ""}
                    </div>
                  </div>

                  {/* Campo email destinatario */}
                  {!showMailModal.cm?.email && (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Email destinatario</div>
                      <input
                        type="email" placeholder="cliente@email.com"
                        style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:"0.5px solid #F0EFEC", background:"#F7F7F5", fontSize:13, color:T.text, fontFamily:"inherit", boxSizing:"border-box" as any }}
                        onChange={e => {
                          const v = e.target.value;
                          setShowMailModal(prev => prev ? { ...prev, emailOverride: v } : prev);
                        }}
                      />
                    </div>
                  )}

                  {/* Testo mail modificabile */}
                  <div style={{ marginBottom:12 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Testo della mail</div>
                    <textarea
                      value={mailBody}
                      onChange={e => setMailBody(e.target.value)}
                      rows={10}
                      style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:"0.5px solid #F0EFEC", background:"#F7F7F5", fontSize:12, color:T.text, fontFamily:"inherit", resize:"vertical" as any, boxSizing:"border-box" as any, lineHeight:1.6 }}
                    />
                  </div>

                  {/* Template rapidi */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:6 }}>Template rapidi</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {[
                        { lbl:"✍ Conferma", tpl: `Gentile Cliente,

Le confermo l'appuntamento del ${new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" })}${showMailModal.ev.time ? " alle " + showMailModal.ev.time : ""}.

📧 ${showMailModal.ev.addr || "Luogo da concordare"}

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                        { lbl:"Reminder", tpl: `Gentile Cliente,

Le ricordiamo che domani, ${new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" })}${showMailModal.ev.time ? " alle " + showMailModal.ev.time : ""}, previsto previsto il nostro appuntamento.

📧 ${showMailModal.ev.addr || "Luogo da concordare"}

In caso di impedimento la preghiamo di avvertirci il prima possibile.

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                        { lbl:"📋 Preventivo pronto", tpl: `Gentile Cliente,

Siamo lieti di comunicarle che il preventivo relativo alla fornitura e posa previsto pronto.

Pucontattarci per concordare un incontro o richiedere il documento via mail.

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                        { lbl:"🔧 Posa confermata", tpl: `Gentile Cliente,

Confermiamo la data di posa in opera per il ${new Date(showMailModal.ev.date).toLocaleDateString("it-IT", { weekday:"long", day:"numeric", month:"long" })}${showMailModal.ev.time ? " a partire dalle " + showMailModal.ev.time : ""}.

La preghiamo di assicurarsi che i locali siano accessibili.

Cordiali saluti,
Fabio Cozza - Walter Cozza Serramenti` },
                      ].map(({ lbl, tpl }) => (
                        <div key={lbl} onClick={() => setMailBody(tpl)}
                          style={{ padding:"5px 10px", borderRadius:20, border:"0.5px solid #F0EFEC", background:"#F7F7F5", fontSize:11, fontWeight:600, color:T.text, cursor:"pointer" }}>
                          {lbl}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottoni azione */}
                  <div style={{ display:"flex", gap:8 }}>
                    <div
                      onClick={() => {
                        const dest = (showMailModal as any).emailOverride || showMailModal.cm?.email || "";
                        const sogg = encodeURIComponent(`Appuntamento - ${showMailModal.ev.text}`);
                        const corpo = encodeURIComponent(mailBody);
                        window.open(`mailto:${dest}?subject=${sogg}&body=${corpo}`);
                      }}
                      style={{ flex:1, padding:"12px", borderRadius:10, background:T.acc, color:"#fff", textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:700 }}>
                      ⚡ Apri in Mail
                    </div>
                    <div
                      onClick={() => {
                        navigator.clipboard?.writeText(mailBody);
                        alert("Testo copiato negli appunti!");
                      }}
                      style={{ padding:"12px 14px", borderRadius:10, background:T.bg, border:`1px solid ${T.bdr}`, color:T.sub, cursor:"pointer", fontSize:13, fontWeight:600 }}>
                      📋 Copia
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* === EMAIL COMPOSER MODAL === */}
          {showEmailComposer && (
            <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:500, display:"flex", alignItems:"flex-end", justifyContent:"center" }}
              onClick={e => e.target === e.currentTarget && setShowEmailComposer(null)}>
              <div style={{ background:T.card, borderRadius:"20px 20px 0 0", width:"100%", maxWidth:500, maxHeight:"90vh", overflow:"auto", paddingBottom:24 }}>
                {/* Header */}
                <div style={{ padding:"16px 16px 10px", display:"flex", alignItems:"center", gap:10, position:"sticky", top:0, background:T.card, zIndex:1, borderBottom:`1px solid ${T.bdr}` }}>
                  <span style={{ fontSize:22 }}>⚡</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:800, color:T.text }}>Componi Email</div>
                    <div style={{ fontSize:11, color:T.sub }}>{showEmailComposer.cm?.code} · {showEmailComposer.cm?.cliente} {showEmailComposer.cm?.cognome||""}</div>
                  </div>
                  <div onClick={() => setShowEmailComposer(null)} style={{ width:30, height:30, borderRadius:"50%", background:T.bdr, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16, color:T.sub }}>ù</div>
                </div>
                <div style={{ padding:"14px 16px" }}>
                  {/* Template selector */}
                  <div style={{ display:"flex", gap:4, marginBottom:12, flexWrap:"wrap" }}>
                    {[
                      { id: "preventivo", l: "📋 Preventivo", c: "#007aff" },
                      { id: "conferma", l: "📋 Conferma", c: "#34c759" },
                      { id: "montaggio", l: "🔧 Montaggio", c: "#5856d6" },
                      { id: "saldo", l: "💰 Saldo", c: "#ff9500" },
                      { id: "generico", l: "📝 Libero", c: "#86868b" },
                    ].map(t => (
                      <div key={t.id} onClick={() => inviaEmail(showEmailComposer.cm, t.id)}
                        style={{ padding:"6px 12px", borderRadius:20, border:`1.5px solid ${showEmailComposer.tipo === t.id ? t.c : t.c+"40"}`, background: showEmailComposer.tipo === t.id ? t.c+"15" : "transparent", fontSize:11, fontWeight:700, color:t.c, cursor:"pointer" }}>
                        {t.l}
                      </div>
                    ))}
                  </div>

                  {/* Destinatario */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", marginBottom:4 }}>A:</div>
                    <input value={emailDest} onChange={e => setEmailDest(e.target.value)} placeholder="email@cliente.it"
                      style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${T.bdr}`, background:T.bg, fontSize:13, color:T.text, fontFamily:"inherit", boxSizing:"border-box" as any }} />
                  </div>
                  {/* Oggetto */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", marginBottom:4 }}>Oggetto:</div>
                    <input value={emailOggetto} onChange={e => setEmailOggetto(e.target.value)}
                      style={{ width:"100%", padding:"9px 12px", borderRadius:8, border:`1px solid ${T.bdr}`, background:T.bg, fontSize:13, color:T.text, fontFamily:"inherit", boxSizing:"border-box" as any }} />
                  </div>
                  {/* Corpo */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:T.sub, textTransform:"uppercase", marginBottom:4 }}>Messaggio:</div>
                    <textarea value={emailCorpo} onChange={e => setEmailCorpo(e.target.value)} rows={14}
                      style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${T.bdr}`, background:T.bg, fontSize:12, color:T.text, fontFamily:"inherit", resize:"vertical" as any, boxSizing:"border-box" as any, lineHeight:1.6 }} />
                  </div>

                  {/* Bottoni invio */}
                  <div style={{ display:"flex", gap:8 }}>
                    <div onClick={() => {
                      window.open(`mailto:${emailDest}?subject=${encodeURIComponent(emailOggetto)}&body=${encodeURIComponent(emailCorpo)}`);
                    }} style={{ flex:1, padding:12, borderRadius:10, background:"#007aff", color:"#fff", textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:700 }}>
                      ⚡ Apri in Mail
                    </div>
                    <div onClick={() => {
                      window.open(`https://mail.google.com/mail/?view=cm&to=${emailDest}&su=${encodeURIComponent(emailOggetto)}&body=${encodeURIComponent(emailCorpo)}`, "_blank");
                    }} style={{ flex:1, padding:12, borderRadius:10, background:"#ea4335", color:"#fff", textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:700 }}>
                      Gmail
                    </div>
                    <div onClick={() => {
                      const tel = (showEmailComposer.cm?.telefono||"").replace(/\D/g,"");
                      const t = tel.startsWith("39") ? tel : "39" + tel;
                      window.open(`https://wa.me/${t}?text=${encodeURIComponent(emailCorpo)}`, "_blank");
                    }} style={{ padding:12, borderRadius:10, background:"#25d366", color:"#fff", textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:700 }}>
                      🔗
                    </div>
                  </div>
                  <div onClick={() => { navigator.clipboard?.writeText(emailCorpo); alert("Copiato!"); }}
                    style={{ marginTop:8, padding:10, borderRadius:8, background:T.bg, border:`1px solid ${T.bdr}`, textAlign:"center", cursor:"pointer", fontSize:12, fontWeight:600, color:T.sub }}>
                    📋 Copia testo
                  </div>
                </div>
              </div>
            </div>
          )}

          {showModal === "task" && (
            <>
              <div style={S.modalTitle}>Nuovo task</div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Cosa devi fare?</label>
                <input style={S.input} placeholder="es. Sopralluogo, chiamare fornitore..." value={newTask.text} onChange={e => setNewTask(t => ({ ...t, text: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={S.fieldLabel}>Data</label>
                  <input style={S.input} type="date" value={newTask.date} onChange={e => setNewTask(t => ({ ...t, date: e.target.value }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={S.fieldLabel}>Ora (opz.)</label>
                  <input style={S.input} type="time" value={newTask.time} onChange={e => setNewTask(t => ({ ...t, time: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Priorità</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[{ id: "alta", l: "Urgente", c: T.red }, { id: "media", l: "Normale", c: T.orange }, { id: "bassa", l: "Bassa", c: T.sub }].map(p => (
                    <div key={p.id} onClick={() => setNewTask(t => ({ ...t, priority: p.id }))} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${newTask.priority === p.id ? p.c : T.bdr}`, background: newTask.priority === p.id ? p.c + "18" : "transparent", color: p.c, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {p.l}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Collega a commessa (opzionale)</label>
                <select style={S.select} value={newTask.cm} onChange={e => setNewTask(t => ({ ...t, cm: e.target.value }))}>
                  <option value="">· Nessuna ·</option>
                  {cantieri.map(c => <option key={c.id} value={c.code}>{c.code} À {c.cliente}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Assegna a persona (opzionale)</label>
                <select style={S.select} value={newTask.persona} onChange={e => setNewTask(t => ({ ...t, persona: e.target.value }))}>
                  <option value="">· Nessuno ·</option>
                  {[...contatti.filter(ct => ct.tipo === "cliente"), ...team].map(m => <option key={m.id} value={m.nome}>{m.nome}{(m as any).ruolo ? " · " + (m as any).ruolo : ""}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Note (opzionale)</label>
                <input style={S.input} placeholder="Dettagli, materiale da portare..." value={newTask.meta} onChange={e => setNewTask(t => ({ ...t, meta: e.target.value }))} />
              </div>
              {/* Task Allegati */}
              <div style={{ marginBottom: 14 }}>
                <label style={S.fieldLabel}>Allegati</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[
                    { ico: "📁", l: "File", act: () => setTaskAllegati(a => [...a, { id: Date.now(), tipo: "file", nome: "Allegato_" + (a.length + 1) }]) },
                    { ico: "📝", l: "Nota", act: () => { let txt; try{txt=window.prompt("Nota:");}catch(e){} if (txt) setTaskAllegati(a => [...a, { id: Date.now(), tipo: "nota", nome: txt }]); }},
                    { ico: "🎵", l: "Audio", act: () => setTaskAllegati(a => [...a, { id: Date.now(), tipo: "vocale", nome: "Audio " + (a.length + 1) }]) },
                    { ico: "📸", l: "Foto", act: () => setTaskAllegati(a => [...a, { id: Date.now(), tipo: "foto", nome: "Foto " + (a.length + 1) }]) },
                  ].map((b, i) => (
                    <div key={i} onClick={b.act} style={{ flex: 1, padding: "8px 4px", background: T.bg, borderRadius: 8, border: `1px solid ${T.bdr}`, textAlign: "center", cursor: "pointer" }}>
                      <div style={{ fontSize: 16 }}>{b.ico}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: T.sub, marginTop: 1 }}>{b.l}</div>
                    </div>
                  ))}
                </div>
                {taskAllegati.length > 0 && (
                  <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {taskAllegati.map(a => (
                      <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, background: T.bg, border: `1px solid ${T.bdr}`, fontSize: 10 }}>
                        <span>{a.tipo === "nota" ? "📝" : a.tipo === "vocale" ? "🎵" : a.tipo === "foto" ? "📸" : "📁"}</span>
                        <span style={{ color: T.text, maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</span>
                        <span onClick={() => setTaskAllegati(al => al.filter(x => x.id !== a.id))} style={{ cursor: "pointer", color: T.red }}>×</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button style={S.btn} onClick={addTask}>Crea task</button>
              <button style={S.btnCancel} onClick={() => setShowModal(null)}>Annulla</button>
            </>
          )}

          {/* COMMESSA MODAL */}
          {showModal === "contatto" && (
            <div style={{ padding: "20px 0" }}>
              <div style={S.modalTitle}>Nuovo cliente</div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Nome *</label>
                <input style={S.input} placeholder="Nome" value={(newCM as any)._ctNome || ""} onChange={e => setNewCM(p => ({ ...p, _ctNome: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Cognome</label>
                <input style={S.input} placeholder="Cognome" value={(newCM as any)._ctCognome || ""} onChange={e => setNewCM(p => ({ ...p, _ctCognome: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Telefono</label>
                <input style={S.input} type="tel" placeholder="333 1234567" value={(newCM as any)._ctTel || ""} onChange={e => setNewCM(p => ({ ...p, _ctTel: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Email</label>
                <input style={S.input} type="email" placeholder="nome@email.it" value={(newCM as any)._ctEmail || ""} onChange={e => setNewCM(p => ({ ...p, _ctEmail: e.target.value } as any))} /></div>
              <div style={{ marginBottom: 12 }}><label style={S.fieldLabel}>Indirizzo</label>
                <input style={S.input} placeholder="Via Roma 12, Cosenza" value={(newCM as any)._ctAddr || ""} onChange={e => setNewCM(p => ({ ...p, _ctAddr: e.target.value } as any))} /></div>
              <div onClick={() => {
                const nome = ((newCM as any)._ctNome || "").trim();
                if (!nome) return;
                setContatti(prev => [...prev, { id: "CT-" + Date.now(), nome, cognome: (newCM as any)._ctCognome || "", tipo: "cliente", telefono: (newCM as any)._ctTel || "", email: (newCM as any)._ctEmail || "", indirizzo: (newCM as any)._ctAddr || "", preferito: false }]);
                setNewCM({ cliente: "", indirizzo: "", telefono: "", sistema: "", tipo: "nuova" });
                setShowModal(null);
              }} style={{ padding: "14px", borderRadius: 12, background: `linear-gradient(135deg, ${T.acc}, #b86e06)`, color: "#fff", textAlign: "center", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
                Salva cliente ✓
              </div>
            </div>
          )}

          {showModal === "commessa" && (
            <>
              <div style={S.modalTitle}>Nuova commessa</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                {[{ id: "nuova", l: "Nuova installazione", c: T.acc }, { id: "riparazione", l: "Riparazione", c: T.orange }].map(t => (
                  <div key={t.id} onClick={() => { setNewCM(c => ({ ...c, tipo: t.id })); setRipSearch(""); setRipCMSel(null); setRipProblema(""); setRipFotos([]); setRipUrgenza("media"); }}
                    style={{ flex: 1, padding: "12px 6px", borderRadius: 12, border: `2px solid ${newCM.tipo === t.id ? (t.id==="nuova"?T.acc:T.orange) : T.bdr}`, background: newCM.tipo === t.id ? (t.id==="nuova"?T.acc:T.orange)+"12" : T.card, textAlign: "center", cursor: "pointer", transition:"all 0.15s" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: newCM.tipo === t.id ? (t.id==="nuova"?T.acc:T.orange) : T.sub }}>{t.l}</div>
                  </div>
                ))}
              </div>

              {/* == FLUSSO RIPARAZIONE WIZARD FLASH == */}
              {newCM.tipo === "riparazione" && (() => {
                const [ripStep, setRipStep] = React.useState(0);
                const STEPS_RIP = ["Cliente","Problema","Dettagli","Foto"];
                const addRipFoto = (e) => {
                  const file = e.target.files?.[0]; if(!file) return;
                  const r = new FileReader();
                  r.onload = ev => setRipFotos(fs => [...fs, { id: Date.now(), dataUrl: ev.target.result }]);
                  r.readAsDataURL(file); e.target.value = "";
                };
                const addRiparazione = () => {
                  if (!ripProblema.trim()) return;
                  const code = "CM-" + String(cantieri.length + 1).padStart(4, "0");
                  const nuova = {
                    id: Date.now(), code,
                    cliente: ripCMSel ? ripCMSel.cliente : (newCM.cliente || ripSearch),
                    indirizzo: newCM.indirizzo || ripCMSel?.indirizzo || "",
                    telefono: newCM.telefono || ripCMSel?.telefono || "",
                    tipo: "riparazione", fase: "sopralluogo",
                    cmCollegata: ripCMSel?.code || null,
                    problema: ripProblema,
                    tipoProblema: newCM.tipoProblema || "",
                    tipoInfisso: newCM.tipoInfisso || "",
                    urgenza: ripUrgenza,
                    fotoProblema: ripFotos,
                    chiSegnala: newCM.chiSegnala || "",
                    preventivoStimato: newCM.preventivoStimato || "",
                    note: ripProblema,
                    alert: ripUrgenza === "urgente" ? "Riparazione urgente" : null,
                    creato: new Date().toLocaleDateString("it-IT", {day:"numeric",month:"short"}),
                    aggiornato: new Date().toLocaleDateString("it-IT", {day:"numeric",month:"short"}),
                    vani: ripCMSel?.vani || [], allegati: [],
                  };
                  setCantieri(cs => [nuova, ...cs]);
                  setRipSearch(""); setRipCMSel(null); setRipProblema(""); setRipFotos([]); setRipUrgenza("media"); setRipStep(0);
                  setNewCM(c => ({...c, tipo:"nuova", cliente:"", indirizzo:"", telefono:"", tipoProblema:"", tipoInfisso:"", chiSegnala:"", preventivoStimato:""}));
                  setShowModal(null);
                  setSelectedCM(nuova); setTab("commesse");
                };
                const canNext0 = ripCMSel || newCM.cliente?.trim() || ripSearch?.trim();
                const canNext1 = ripProblema.trim();
                const labelUrgenza = ripUrgenza === "urgente" ? "Urgente" : ripUrgenza === "normale" ? "Normale" : "Media";
                const colorUrgenza = ripUrgenza === "urgente" ? T.red : ripUrgenza === "normale" ? T.grn : T.orange;
                return (
                  <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                    {/* Stepper */}
                    <div style={{ display:"flex", alignItems:"center", marginBottom:16 }}>
                      {STEPS_RIP.map((s,i) => (
                        <React.Fragment key={s}>
                          <div onClick={() => i < ripStep && setRipStep(i)}
                            style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:1, cursor: i < ripStep ? "pointer" : "default" }}>
                            <div style={{ width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700,
                              background: i < ripStep ? T.grn : i === ripStep ? T.orange : T.bdr,
                              color: i <= ripStep ? "#fff" : T.sub }}>
                              {i < ripStep ? "✓" : i+1}
                            </div>
                            <div style={{ fontSize:9, fontWeight: i===ripStep?700:500, color: i===ripStep?T.orange:T.sub, marginTop:3 }}>{s}</div>
                          </div>
                          {i < STEPS_RIP.length-1 && <div style={{ flex:1, height:2, background: i < ripStep ? T.grn : T.bdr, marginBottom:14 }} />}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* STEP 0 — Cliente */}
                    {ripStep === 0 && (
                      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                        <input style={S.input} placeholder="Cerca cliente o commessa..."
                          value={ripSearch} onChange={e => { setRipSearch(e.target.value); if(ripCMSel) setRipCMSel(null); }}
                          autoFocus />
                        {ripSearch.length >= 1 && !ripCMSel && (() => {
                          const q = ripSearch.trim().toLowerCase();
                          const cmR = cantieri.filter(c => c.cliente?.toLowerCase().includes(q) || c.code?.toLowerCase().includes(q)).slice(0,4);
                          const ctR = contatti.filter(ct => ct.tipo==="cliente" && (ct.nome?.toLowerCase().includes(q)||(ct.cognome||"").toLowerCase().includes(q))).slice(0,4);
                          if (!cmR.length && !ctR.length) return null;
                          return (
                            <div style={{ background:T.card, border:`1px solid ${T.bdr}`, borderRadius:10, overflow:"hidden" }}>
                              {ctR.map(ct => (
                                <div key={ct.id} onClick={() => { setRipSearch(ct.nome+" "+(ct.cognome||"")); setNewCM(x=>({...x,cliente:ct.nome,cognome:ct.cognome||"",indirizzo:ct.indirizzo||"",telefono:ct.telefono||""})); }}
                                  style={{ padding:"10px 14px", borderBottom:`1px solid ${T.bdr}`, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
                                  <div style={{ width:28,height:28,borderRadius:"50%",background:T.accLt,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:T.acc }}>
                                    {(ct.nome||"?")[0]}
                                  </div>
                                  <div><div style={{ fontSize:13,fontWeight:700 }}>{ct.nome} {ct.cognome||""}</div><div style={{ fontSize:10,color:T.sub }}>{ct.telefono}</div></div>
                                </div>
                              ))}
                              {cmR.map(c => (
                                <div key={c.id} onClick={() => { setRipCMSel(c); setRipSearch(c.cliente); setNewCM(x=>({...x,indirizzo:c.indirizzo,telefono:c.telefono})); }}
                                  style={{ padding:"10px 14px", borderBottom:`1px solid ${T.bdr}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                                  <div><div style={{ fontSize:13,fontWeight:700 }}>{c.cliente}</div><div style={{ fontSize:10,color:T.sub }}>{c.code} · {c.indirizzo}</div></div>
                                  <div style={{ fontSize:11,color:T.acc,fontWeight:700 }}>Collega →</div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        {ripCMSel && (
                          <div style={{ padding:"10px 12px", background:T.accLt, border:`1px solid ${T.acc}30`, borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div><div style={{ fontSize:12,fontWeight:700,color:T.acc }}>✓ {ripCMSel.code}</div><div style={{ fontSize:11,color:T.sub }}>{ripCMSel.cliente}</div></div>
                            <div onClick={() => { setRipCMSel(null); setRipSearch(""); }} style={{ color:T.sub,cursor:"pointer",fontSize:18 }}>×</div>
                          </div>
                        )}
                        {!ripCMSel && (
                          <div style={{ display:"flex", flexDirection:"column", gap:8, padding:"10px 12px", background:T.bg, borderRadius:10, border:`1px solid ${T.bdr}` }}>
                            <div style={{ fontSize:10,fontWeight:700,color:T.sub,textTransform:"uppercase",letterSpacing:"0.06em" }}>Cliente nuovo</div>
                            <input style={S.input} placeholder="Nome e cognome" value={newCM.cliente||""} onChange={e=>setNewCM(c=>({...c,cliente:e.target.value}))} />
                            <div style={{ display:"flex",gap:8 }}>
                              <input style={{...S.input,flex:2}} placeholder="Indirizzo" value={newCM.indirizzo||""} onChange={e=>setNewCM(c=>({...c,indirizzo:e.target.value}))} />
                              <input style={{...S.input,flex:1}} placeholder="Tel" value={newCM.telefono||""} onChange={e=>setNewCM(c=>({...c,telefono:e.target.value}))} inputMode="tel" />
                            </div>
                          </div>
                        )}
                        <div style={{ display:"flex", gap:8, marginTop:4 }}>
                          <button style={{ ...S.btn, background:T.card, color:T.sub, border:`1px solid ${T.bdr}`, flex:1 }}
                            onClick={() => { setNewCM(c=>({...c,tipo:"nuova"})); setRipSearch(""); setRipCMSel(null); setRipStep(0); setShowModal(null); }}>
                            Annulla
                          </button>
                          <button style={{ ...S.btn, background: canNext0 ? T.orange : "#ccc", cursor: canNext0 ? "pointer" : "not-allowed", flex:2 }}
                            onClick={() => canNext0 && setRipStep(1)}>
                            Avanti — Problema →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 1 — Problema */}
                    {ripStep === 1 && (
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        <div>
                          <label style={S.fieldLabel}>Urgenza</label>
                          <div style={{ display:"flex", gap:8 }}>
                            {[{id:"normale",l:"Normale",c:T.grn},{id:"media",l:"Media",c:T.orange},{id:"urgente",l:"Urgente",c:T.red}].map(u => (
                              <div key={u.id} onClick={() => setRipUrgenza(u.id)}
                                style={{ flex:1, padding:"12px 4px", borderRadius:12, border:`2px solid ${ripUrgenza===u.id?u.c:T.bdr}`, background:ripUrgenza===u.id?u.c+"18":T.card, textAlign:"center", cursor:"pointer",
                                  boxShadow: ripUrgenza===u.id ? `0 3px 0 ${u.c}40` : "0 2px 0 rgba(0,0,0,0.08)", transition:"all 0.1s" }}>
                                <div style={{ fontSize:13,fontWeight:700,color:ripUrgenza===u.id?u.c:T.sub }}>{u.l}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label style={S.fieldLabel}>Tipo problema</label>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {["Vetro rotto","Cardine","Guarnizione","Serratura","Maniglia","Tapparella","Infiltrazioni","Deformazione","Altro"].map(t => (
                              <div key={t} onClick={() => setNewCM(c=>({...c,tipoProblema:c.tipoProblema===t?"":t}))}
                                style={{ padding:"7px 12px", borderRadius:20, border:`1.5px solid ${newCM.tipoProblema===t?T.orange:T.bdr}`, background:newCM.tipoProblema===t?T.orange+"18":T.card, fontSize:12, fontWeight:600, color:newCM.tipoProblema===t?T.orange:T.sub, cursor:"pointer",
                                  boxShadow: newCM.tipoProblema===t ? `0 2px 0 ${T.orange}40` : "none", transition:"all 0.1s" }}>
                                {t}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label style={S.fieldLabel}>Tipo infisso</label>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {["Finestra","Porta","Portafinestra","Scorrevole","Tapparella","Persiana","Zanzariera","Altro"].map(t => (
                              <div key={t} onClick={() => setNewCM(c=>({...c,tipoInfisso:c.tipoInfisso===t?"":t}))}
                                style={{ padding:"7px 12px", borderRadius:20, border:`1.5px solid ${newCM.tipoInfisso===t?T.acc:T.bdr}`, background:newCM.tipoInfisso===t?T.accLt:T.card, fontSize:12, fontWeight:600, color:newCM.tipoInfisso===t?T.acc:T.sub, cursor:"pointer",
                                  boxShadow: newCM.tipoInfisso===t ? `0 2px 0 ${T.acc}40` : "none", transition:"all 0.1s" }}>
                                {t}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label style={S.fieldLabel}>Descrizione problema *</label>
                          <textarea style={{ ...S.input, minHeight:70, resize:"vertical" }}
                            placeholder="Descrivi il problema..."
                            value={ripProblema} onChange={e => setRipProblema(e.target.value)} autoFocus />
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button style={{ ...S.btn, background:T.card, color:T.sub, border:`1px solid ${T.bdr}`, flex:1 }} onClick={() => setRipStep(0)}>← Indietro</button>
                          <button style={{ ...S.btn, background:canNext1?T.orange:"#ccc", cursor:canNext1?"pointer":"not-allowed", flex:2 }} onClick={() => canNext1 && setRipStep(2)}>Avanti →</button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2 — Dettagli */}
                    {ripStep === 2 && (
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        <div>
                          <label style={S.fieldLabel}>Chi segnala</label>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                            {["Cliente","Posatore","Tecnico","Subappaltatore","Altro"].map(t => (
                              <div key={t} onClick={() => setNewCM(c=>({...c,chiSegnala:c.chiSegnala===t?"":t}))}
                                style={{ padding:"7px 12px", borderRadius:20, border:`1.5px solid ${newCM.chiSegnala===t?T.acc:T.bdr}`, background:newCM.chiSegnala===t?T.accLt:T.card, fontSize:12, fontWeight:600, color:newCM.chiSegnala===t?T.acc:T.sub, cursor:"pointer",
                                  boxShadow: newCM.chiSegnala===t ? `0 2px 0 ${T.acc}40` : "none", transition:"all 0.1s" }}>
                                {t}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                          <div>
                            <label style={S.fieldLabel}>Data intervento</label>
                            <input type="date" style={S.input} value={newCM.dataRichiesta||""} onChange={e=>setNewCM(c=>({...c,dataRichiesta:e.target.value}))} />
                          </div>
                          <div>
                            <label style={S.fieldLabel}>Preventivo stimato (€)</label>
                            <input style={S.input} inputMode="numeric" placeholder="es. 250" value={newCM.preventivoStimato||""} onChange={e=>setNewCM(c=>({...c,preventivoStimato:e.target.value}))} />
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button style={{ ...S.btn, background:T.card, color:T.sub, border:`1px solid ${T.bdr}`, flex:1 }} onClick={() => setRipStep(1)}>← Indietro</button>
                          <button style={{ ...S.btn, background:T.orange, flex:2 }} onClick={() => setRipStep(3)}>Avanti →</button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3 — Foto + Crea */}
                    {ripStep === 3 && (
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        <div>
                          <label style={S.fieldLabel}>Foto problema ({ripFotos.length})</label>
                          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                            {ripFotos.map((f,i) => (
                              <div key={f.id} style={{ position:"relative", width:76, height:76, borderRadius:10, overflow:"hidden" }}>
                                <img src={f.dataUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                                <div onClick={() => setRipFotos(fs => fs.filter(x => x.id !== f.id))}
                                  style={{ position:"absolute", top:3, right:3, width:20, height:20, borderRadius:"50%", background:"rgba(0,0,0,0.6)", color:"#fff", fontSize:13, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontWeight:700 }}>×</div>
                              </div>
                            ))}
                            <div onClick={() => ripFotoRef.current?.click()}
                              style={{ width:76, height:76, borderRadius:10, border:`2px dashed ${T.bdr}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:4 }}>
                              <div style={{ fontSize:24, color:T.sub }}>+</div>
                              <div style={{ fontSize:9, color:T.sub, fontWeight:600 }}>Foto</div>
                            </div>
                          </div>
                          <input ref={ripFotoRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={addRipFoto} />
                        </div>
                        {/* Riepilogo */}
                        <div style={{ padding:"12px 14px", background:T.orange+"10", borderRadius:12, border:`1px solid ${T.orange}30` }}>
                          <div style={{ fontSize:11, fontWeight:700, color:T.orange, marginBottom:6 }}>Riepilogo riparazione</div>
                          <div style={{ fontSize:12, color:T.text }}>{ripCMSel ? ripCMSel.cliente : newCM.cliente || ripSearch}</div>
                          <div style={{ fontSize:11, color:T.sub, marginTop:2 }}>{newCM.tipoProblema && newCM.tipoProblema+" · "}{newCM.tipoInfisso && newCM.tipoInfisso+" · "}<span style={{ color:colorUrgenza, fontWeight:700 }}>{labelUrgenza}</span></div>
                          <div style={{ fontSize:11, color:T.sub, marginTop:2, fontStyle:"italic" }}>{ripProblema.slice(0,60)}{ripProblema.length>60?"...":""}</div>
                        </div>
                        <div style={{ display:"flex", gap:8 }}>
                          <button style={{ ...S.btn, background:T.card, color:T.sub, border:`1px solid ${T.bdr}`, flex:1 }} onClick={() => setRipStep(2)}>← Indietro</button>
                          <button style={{ ...S.btn, background:T.orange, flex:2 }} onClick={addRiparazione}>Crea riparazione ✓</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

                            {/* == FLUSSO NUOVA INSTALLAZIONE == */}
              {newCM.tipo === "nuova" && (() => {
                const AccordionSection = ({ id, icon, label, badge, children }) => {
                  const open = newCM._open === id;
                  return (
                    <div style={{ marginBottom:8, borderRadius:10, border:`1px solid ${T.bdr}`, overflow:"hidden" }}>
                      <div onClick={() => setNewCM(c=>({...c,_open:open?null:id}))}
                        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px", background:T.card, cursor:"pointer" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:16 }}>{icon}</span>
                          <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{label}</span>
                          {badge && <span style={{ ...S.badge(T.accLt,T.acc), fontSize:10 }}>{badge}</span>}
                        </div>
                        <span style={{ fontSize:12, color:T.sub, transition:"transform 0.2s", display:"inline-block", transform:open?"rotate(180deg)":"rotate(0deg)" }}>>▾</span>
                      </div>
                      {open && <div style={{ padding:"12px 14px", background:T.bg, borderTop:`1px solid ${T.bdr}` }}>{children}</div>}
                    </div>
                  );
                };

                const previewCode = "S-" + String(cantieri.length + 1).padStart(4,"0");

                return (
                  <>
                    <div style={{ marginBottom:14, padding:"8px 12px", background:T.bg, borderRadius:8, display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, color:T.sub }}>Numero commessa:</span>
                      <span style={{ fontSize:13, fontWeight:800, color:T.acc, fontFamily:FM }}>{previewCode}</span>
                      <span style={{ fontSize:10, color:T.sub }}>(assegnato automaticamente)</span>
                    </div>

                    <div style={{ marginBottom:14, padding:"14px", background:T.card, borderRadius:12, border:`1.5px solid ${T.bdr}` }}>
                      <div style={{ fontSize:10, fontWeight:800, color:T.sub, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:10 }}>👤 Dati cliente *</div>
                      <div style={{ display:"flex", gap:8, marginBottom:0 }}>
                        <input style={{...S.input,flex:1}} placeholder="Nome" value={newCM.cliente} onChange={e=>setNewCM(c=>({...c,cliente:e.target.value}))}/>
                        <input style={{...S.input,flex:1}} placeholder="Cognome" value={newCM.cognome||""} onChange={e=>setNewCM(c=>({...c,cognome:e.target.value}))}/>
                      </div>
                      {/* Bottone rubrica SEMPRE visibile */}
                      {!newCM.cliente && (
                        <div onClick={() => setNewCM(c => ({...c, cliente: " "}))} style={{ margin:"6px 0 8px", padding:"10px 14px", borderRadius:10, border:"1.5px dashed "+T.acc+"60", background:T.acc+"06", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                          <span style={{ fontSize:16 }}>📊</span>
                          <span style={{ fontSize:12, fontWeight:700, color:T.acc }}>Scegli dalla rubrica ({contatti.filter(c=>c.tipo==="cliente").length} clienti)</span>
                        </div>
                      )}
                      {/* Autocomplete rubrica - INLINE */}
                      {newCM.cliente.length >= 1 && (() => {
                        const q = newCM.cliente.trim().toLowerCase();
                        const matches = q.length > 0 
                          ? contatti.filter(ct => ct.nome?.toLowerCase().includes(q) || (ct.cognome || "").toLowerCase().includes(q) || (ct.azienda || "").toLowerCase().includes(q)).slice(0, 8)
                          : contatti.filter(ct => ct.tipo === "cliente").slice(0, 10);
                        const cmMatches = q.length > 0
                          ? cantieri.filter(cm => cm.cliente?.toLowerCase().includes(q) || (cm.cognome || "").toLowerCase().includes(q)).slice(0, 3)
                          : [];
                        const allSugg = [
                          ...matches.map(ct => ({ tipo: "rubrica", nome: ct.nome, cognome: ct.cognome || "", tel: ct.telefono || "", email: ct.email || "", indirizzo: ct.indirizzo || "", ico: "📊" })),
                          ...cmMatches.map(cm => ({ tipo: "commessa", nome: cm.cliente, cognome: cm.cognome || "", tel: cm.telefono || "", email: cm.email || "", indirizzo: cm.indirizzo || "", ico: "👤" }))
                        ];
                        const seen = new Set();
                        const unique = allSugg.filter(s => { const k = (s.nome+s.cognome).toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
                        if (unique.length === 0) return null;
                        return <div style={{ background:"#fff", border:"1.5px solid " + T.acc + "40", borderRadius:10, marginTop:6, marginBottom:8, overflow:"hidden", maxHeight:220, overflowY:"auto" }}>
                          <div style={{ padding:"6px 10px", fontSize:9, fontWeight:700, color:T.acc, background:T.acc+"08", borderBottom:"1px solid " + T.acc + "20", display:"flex", justifyContent:"space-between", position:"sticky", top:0 }}>
                            <span>📊 Seleziona dalla rubrica ({unique.length})</span>
                            <span onClick={(e) => { e.stopPropagation(); setNewCM(c => ({...c, cliente: ""})); }} style={{ cursor:"pointer", color:T.sub }}>×</span>
                          </div>
                          {unique.map((s, i) => (
                            <div key={i} onClick={() => setNewCM(c => ({...c, cliente: s.nome, cognome: s.cognome, telefono: s.tel, email: s.email, indirizzo: s.indirizzo || c.indirizzo }))}
                              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 12px", cursor:"pointer", borderBottom: i < unique.length -1 ? "1px solid " + T.bdr + "40" : "none" }}>
                              <div style={{ fontSize:16 }}>{s.ico}</div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:12, fontWeight:700, color:T.text }}>{s.nome} {s.cognome}</div>
                                <div style={{ fontSize:9, color:T.sub }}>{s.tel && ("📞 " + s.tel)} {s.email && (" ⚡ " + s.email)}</div>
                                {s.indirizzo && <div style={{ fontSize:9, color:T.sub }}>📧 {s.indirizzo}</div>}
                              </div>
                              <span style={{ fontSize:8, padding:"2px 6px", borderRadius:4, background: s.tipo === "rubrica" ? "#af52de15" : T.accLt, color: s.tipo === "rubrica" ? "#af52de" : T.acc, fontWeight:700 }}>{s.tipo === "rubrica" ? "RUBRICA" : "COMMESSA"}</span>
                            </div>
                          ))}
                        </div>;
                      })()}
                      <input style={{...S.input,marginBottom:8}} placeholder="Indirizzo lavori (Via, CAP, Città)" value={newCM.indirizzo} onChange={e=>setNewCM(c=>({...c,indirizzo:e.target.value}))}/>
                      <div style={{ display:"flex", gap:8 }}>
                        <input style={{...S.input,flex:1}} placeholder="Telefono" inputMode="tel" value={newCM.telefono} onChange={e=>setNewCM(c=>({...c,telefono:e.target.value}))}/>
                        <input style={{...S.input,flex:1}} placeholder="Email" inputMode="email" value={newCM.email||""} onChange={e=>setNewCM(c=>({...c,email:e.target.value}))}/>
                      </div>
                    </div>

                    <AccordionSection id="accesso" icon="→" label="Accesso / Difficoltà salita"
                      badge={newCM.difficoltaSalita||null}>
                      <div style={{ display:"flex", gap:4, marginBottom:8 }}>
                        {[{id:"facile",l:"Facile",c:T.grn,e:"📋"},{id:"media",l:"Media",c:T.orange,e:"🚨"},{id:"difficile",l:"Difficile",c:T.red,e:""}].map(d => (
                          <div key={d.id} onClick={()=>setNewCM(c=>({...c,difficoltaSalita:d.id}))}
                            style={{ flex:1, padding:"8px 4px", borderRadius:8, border:`1.5px solid ${newCM.difficoltaSalita===d.id?d.c:T.bdr}`, background:newCM.difficoltaSalita===d.id?d.c+"15":T.card, textAlign:"center", cursor:"pointer" }}>
                            <div style={{ fontSize:14 }}>{d.e}</div>
                            <div style={{ fontSize:10, fontWeight:600, color:newCM.difficoltaSalita===d.id?d.c:T.sub }}>{d.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:10, color:T.sub, fontWeight:600, marginBottom:2 }}>Piano edificio</div>
                          <select style={S.select} value={newCM.pianoEdificio} onChange={e=>setNewCM(c=>({...c,pianoEdificio:e.target.value}))}>
                            <option value="">· Seleziona ·</option>
                            {[
                              {v:"S2",l:"S2 — Secondo seminterrato"},
                              {v:"S1",l:"S1 — Seminterrato"},
                              {v:"PT",l:"PT — Piano Terra"},
                              {v:"P1",l:"P1 — Primo piano"},
                              {v:"P2",l:"P2 — Secondo piano"},
                              {v:"P3",l:"P3 — Terzo piano"},
                              {v:"P4",l:"P4 — Quarto piano"},
                              {v:"P5",l:"P5 — Quinto piano"},
                              {v:"P6",l:"P6 — Sesto piano"},
                              {v:"P7",l:"P7 — Settimo piano"},
                              {v:"P8",l:"P8 — Ottavo piano"},
                              {v:"P9",l:"P9 — Nono piano"},
                              {v:"P10",l:"P10 — Decimo piano"},
                              {v:"P15",l:"P15 — 15° piano"},
                              {v:"P20",l:"P20 — 20° piano"},
                              {v:"M",l:"M — Mansarda"},
                            ].map(p=><option key={p.v} value={p.v}>{p.l}</option>)}
                          </select>
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:10, color:T.sub, fontWeight:600, marginBottom:2 }}>Foro scale (cm)</div>
                          <input style={S.input} placeholder="es. 80ù200" value={newCM.foroScale} onChange={e=>setNewCM(c=>({...c,foroScale:e.target.value}))}/>
                        </div>
                      </div>
                      <div style={{ fontSize:10, color:T.sub, fontWeight:600, marginBottom:2 }}>Mezzo di salita</div>
                      <select style={S.select} value={newCM.mezzoSalita} onChange={e=>setNewCM(c=>({...c,mezzoSalita:e.target.value}))}>
                        <option value="">· Seleziona ·</option>
                        {mezziSalita.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </AccordionSection>

                    <AccordionSection id="note" icon="≡" label="Note aggiuntive"
                      badge={newCM.note ? "✓" : null}>
                      <textarea style={{...S.input,minHeight:70,resize:"vertical"}}
                        placeholder="Note aggiuntive sulla commessa…"
                        defaultValue={newCM.note} onBlur={e=>setNewCM(c=>({...c,note:e.target.value}))}/>
                    </AccordionSection>

                    <div style={{ marginTop:6 }}>
                      {!newCM.cliente.trim() && (
                        <div style={{ fontSize:11, color:T.sub, textAlign:"center", marginBottom:8 }}>Inserisci almeno il nome per procedere</div>
                      )}
                      <button style={{ ...S.btn, background:newCM.cliente.trim()?T.acc:"#ccc", cursor:newCM.cliente.trim()?"pointer":"not-allowed" }}
                        onClick={addCommessa} disabled={!newCM.cliente.trim()}>
                        ✓ Crea commessa {previewCode}
                      </button>
                      <button style={S.btnCancel} onClick={() => setShowModal(null)}>Annulla</button>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </div>
      </div>
    );

}
