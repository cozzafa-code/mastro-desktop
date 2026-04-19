"use client";
// @ts-nocheck
import React, { useState } from "react";
import { useMastro } from "./MastroContext";
import { TIPOLOGIE_RAPIDE } from "./mastro-constants";

export default function PreventivoModal() {
  const {
    T, showPreventivoModal, setShowPreventivoModal,
    selectedCM, setSelectedCM, cantieri, setCantieri,
    setSelectedVano, setVanoStep, sistemiDB,
    calcolaVanoPrezzo, getVaniAttivi,
    generaPreventivoPDF, generaPreventivoCondivisibile,
    setShowFirmaModal, aziendaInfo, toast
  } = useMastro();

  const [invioLink, setInvioLink] = useState(false);
  const [linkCopiato, setLinkCopiato] = useState(false);
  const [vaniEspansi, setVaniEspansi] = useState<Record<string, boolean>>({});

  if (!showPreventivoModal || !selectedCM) return null;

  const c = selectedCM;
  const upd = (f, v) => {
    setCantieri(cs => cs.map(x => x.id === c.id ? { ...x, [f]: v } : x));
    setSelectedCM(p => ({ ...p, [f]: v }));
  };
  const az = aziendaInfo || {};
  const vani = getVaniAttivi(c);

  const vaniCalc = vani.map(v => {
    const prezzoBase = calcolaVanoPrezzo(v, c);
    const pezzi = v.pezzi || 1;
    const acc = v.accessori || {};
    const m = v.misure || {};
    const lmm = m.lCentro || 0, hmm = m.hCentro || 0;
    const accFisici = [];
    if (acc.tapparella?.attivo) {
      const p = parseFloat(az.prezzoTapparella || c.prezzoTapparella || 0);
      accFisici.push({ label: "Tapparella" + (acc.tapparella.colore ? " " + acc.tapparella.colore : "") + (acc.tapparella.motorizzata ? " (mot.)" : ""), prezzo: p > 0 ? Math.round(((acc.tapparella.l || lmm) / 1000) * ((acc.tapparella.h || hmm) / 1000) * p * 100) / 100 : 0, pezzi });
    }
    if (acc.persiana?.attivo) {
      const p = parseFloat(az.prezzoPersiana || c.prezzoPersiana || 0);
      accFisici.push({ label: "Persiana" + (acc.persiana.colore ? " " + acc.persiana.colore : ""), prezzo: p > 0 ? Math.round(((acc.persiana.l || lmm) / 1000) * ((acc.persiana.h || hmm) / 1000) * p * 100) / 100 : 0, pezzi });
    }
    if (acc.zanzariera?.attivo) {
      const p = parseFloat(az.prezzoZanzariera || c.prezzoZanzariera || 0);
      accFisici.push({ label: "Zanzariera" + (acc.zanzariera.tipo ? " " + acc.zanzariera.tipo : ""), prezzo: p > 0 ? Math.round(((acc.zanzariera.l || lmm) / 1000) * ((acc.zanzariera.h || hmm) / 1000) * p * 100) / 100 : 0, pezzi });
    }
    const accCatalogo = (v.accessoriCatalogo || []).map(a => ({ label: a.nome || "Accessorio", prezzo: parseFloat(a.prezzoUnitario) || 0, pezzi: a.quantita || 1 }));
    const posaPrezzo = v.prevPosaPrezzo || (parseFloat(az.prezzoPosaVano || 0) > 0 && az.includePosaInPreventivo ? parseFloat(az.prezzoPosaVano) : 0);
    if (posaPrezzo > 0) accFisici.push({ label: "Posa in opera", prezzo: posaPrezzo, pezzi });
    const vociVano = (v.vociLibere || []).map(vl => ({ label: vl.desc || "Voce extra", prezzo: vl.prezzo || 0, pezzi: vl.qta || 1 }));
    const allAcc = [...accFisici, ...accCatalogo, ...vociVano];
    const totAccessori = allAcc.reduce((s, a) => s + a.prezzo * a.pezzi, 0);
    const totVano = prezzoBase * pezzi + totAccessori;
    const confermato = (v.statoMisure || "provvisorie") === "confermate";
    const sysRec = sistemiDB?.find(s => (s.marca + " " + s.sistema) === v.sistema || s.sistema === v.sistema);
    return { ...v, _prezzoBase: prezzoBase, _allAcc: allAcc, _totVano: totVano, _confermato: confermato, _sysRec: sysRec };
  });

  const vociCommessa = (c.vociLibere || []).map(vl => ({ label: vl.desc || "Voce extra", importo: (vl.importo || 0) * (vl.qta || 1) }));
  const totVani = vaniCalc.reduce((s, v) => s + v._totVano, 0);
  const totVoci = vociCommessa.reduce((s, v) => s + v.importo, 0);
  const totBase = totVani + totVoci;
  const scontoPerc = parseFloat(c.scontoPerc || c.sconto || 0);
  const scontoVal = totBase * scontoPerc / 100;
  const imponibile = totBase - scontoVal;
  const ivaPerc = parseFloat(c.ivaPerc || 10);
  const ivaVal = imponibile * ivaPerc / 100;
  const totIva = imponibile + ivaVal;
  const acconto = parseFloat(c.accontoRicevuto || 0);
  const saldo = totIva - acconto;
  const vaniNonConfermati = vaniCalc.filter(v => !v._confermato);
  const bloccato = vaniNonConfermati.length > 0;
  const fmt = n => (n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const settoreColor = v => {
    const s = TIPOLOGIE_RAPIDE.find(t => t.code === v.tipo)?.settore || "serramenti";
    return { serramenti: T.acc, fabbro: "#8B5E34", pergole: "#1A9E73", porte: "#D08008", zanzariere: "#3B7FE0", boxdoccia: "#0088cc", tendaggi: "#8B5CF6" }[s] || T.acc;
  };

  const handleGeneraPDF = () => {
    if (!bloccato) { generaPreventivoPDF(c); toast && toast("PDF generato", "success"); }
  };

  const handleInviaLink = async () => {
    setInvioLink(true);
    try {
      const url = await generaPreventivoCondivisibile(c);
      if (url) {
        await navigator.clipboard.writeText(url);
        setLinkCopiato(true);
        upd("preventivoLink", url);
        setTimeout(() => setLinkCopiato(false), 3000);
        toast && toast("Link copiato!", "success");
      }
    } catch { toast && toast("Errore link", "error"); }
    setInvioLink(false);
  };

  const toggleVano = (id) => setVaniEspansi(prev => ({ ...prev, [id]: !prev[id] }));

  const { bg, card, text, sub, bdr, acc, red, grn } = T;

  // ── stili riutilizzabili ──────────────────────────────────────────
  const labelStyle = { fontSize: 10, fontWeight: 700, color: sub, textTransform: "uppercase" as const, letterSpacing: 0.6, marginBottom: 4 };
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid " + bdr, fontSize: 16, fontWeight: 700, textAlign: "right" as const, boxSizing: "border-box" as const, background: bg, color: text, fontFamily: "inherit" };
  const rowBetween = { display: "flex", justifyContent: "space-between", alignItems: "center" };

  return (
    <div
      onClick={e => e.target === e.currentTarget && setShowPreventivoModal(false)}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
    >
      <div style={{ background: bg, borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "95vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* ── HEADER fisso ── */}
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid " + bdr, flexShrink: 0 }}>
          <div style={{ ...rowBetween }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: text, lineHeight: 1.2 }}>{c.cliente || "Preventivo"}</div>
              <div style={{ fontSize: 12, color: sub, marginTop: 2 }}>{c.indirizzo || c.nome || ""}</div>
            </div>
            <button
              onClick={() => setShowPreventivoModal(false)}
              style={{ width: 36, height: 36, borderRadius: 18, border: "none", background: bdr, color: text, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >×</button>
          </div>

          {/* totale sempre visibile nell header */}
          <div style={{ marginTop: 12, background: text, borderRadius: 12, padding: "10px 14px", ...rowBetween }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#ffffff99" }}>TOTALE IVA {ivaPerc}%</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: acc }}>€ {fmt(totIva)}</span>
          </div>
        </div>

        {/* ── BODY scrollabile ── */}
        <div style={{ flex: 1, overflow: "auto", padding: "16px 16px 8px" }}>

          {/* Banner vani non confermati */}
          {bloccato && (
            <div style={{ background: red + "12", border: "1.5px solid " + red + "40", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: red, marginBottom: 6 }}>
                ⚠️ {vaniNonConfermati.length} vano/i con misure provvisorie
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {vaniNonConfermati.map(v => (
                  <button
                    key={v.id}
                    onClick={() => { setShowPreventivoModal(false); setSelectedVano(v); setVanoStep(0); }}
                    style={{ ...rowBetween, padding: "8px 10px", borderRadius: 8, border: "1px solid " + red + "30", background: "transparent", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <span style={{ fontSize: 12, color: red, fontWeight: 600 }}>{v.nome}</span>
                    <span style={{ fontSize: 12, color: red, fontWeight: 800 }}>Vai →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── LISTA VANI ── */}
          <div style={{ fontSize: 11, fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8 }}>
            Voci preventivo · {vaniCalc.length} vano/i
          </div>

          {vaniCalc.length === 0 ? (
            <div style={{ background: card, borderRadius: 12, padding: 24, textAlign: "center", color: sub, fontSize: 13 }}>Nessun vano</div>
          ) : vaniCalc.map((v, i) => {
            const colore = settoreColor(v);
            const m = v.misure || {};
            const espanso = !!vaniEspansi[v.id];
            const misureStr = (m.lCentro && m.hCentro) ? `${m.lCentro}×${m.hCentro}` : null;
            const hasAcc = v._allAcc.length > 0;

            return (
              <div key={v.id} style={{ background: card, borderRadius: 12, marginBottom: 8, borderLeft: "3px solid " + colore, overflow: "hidden" }}>
                {/* riga principale — sempre visibile */}
                <div
                  onClick={() => hasAcc && toggleVano(v.id)}
                  style={{ padding: "13px 14px", ...rowBetween, gap: 10, cursor: hasAcc ? "pointer" : "default" }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...rowBetween, gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {v.nome || "Vano " + (i + 1)}
                      </span>
                      {!v._confermato && (
                        <span style={{ fontSize: 9, background: "#FF950018", color: "#FF9500", padding: "2px 6px", borderRadius: 4, fontWeight: 800, flexShrink: 0 }}>PROV.</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: sub, marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                      {misureStr && <span>{misureStr} mm</span>}
                      {v.pezzi > 1 && <span>· {v.pezzi} pz</span>}
                      {v._sysRec?.sistema && <span>· {v._sysRec.sistema}</span>}
                      {hasAcc && <span style={{ color: acc }}>· {v._allAcc.length} acc.</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: v._prezzoBase === 0 ? red : text }}>
                      € {fmt(v._totVano)}
                    </div>
                    {(v.pezzi || 1) > 1 && (
                      <div style={{ fontSize: 10, color: sub }}>€ {fmt(v._prezzoBase)} / pz</div>
                    )}
                    {hasAcc && (
                      <div style={{ fontSize: 11, color: acc, marginTop: 2 }}>{espanso ? "▲" : "▼"}</div>
                    )}
                  </div>
                </div>

                {/* accessori — accordion */}
                {espanso && hasAcc && (
                  <div style={{ borderTop: "1px solid " + bdr, padding: "8px 14px 10px" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: sub, textTransform: "uppercase", marginBottom: 6 }}>Dettaglio</div>
                    {/* riga prodotto base */}
                    <div style={{ ...rowBetween, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: sub }}>Prodotto base{v.pezzi > 1 ? " ×" + v.pezzi : ""}</span>
                      <span style={{ fontSize: 12, color: text, fontWeight: 700 }}>€ {fmt(v._prezzoBase * (v.pezzi || 1))}</span>
                    </div>
                    {v._allAcc.map((a, ai) => (
                      <div key={ai} style={{ ...rowBetween, padding: "4px 0", borderTop: "1px solid " + bdr + "60" }}>
                        <span style={{ fontSize: 12, color: sub }}>{a.label}{a.pezzi > 1 ? " ×" + a.pezzi : ""}</span>
                        <span style={{ fontSize: 12, color: a.prezzo === 0 ? sub : text, fontWeight: a.prezzo > 0 ? 700 : 400 }}>
                          {a.prezzo === 0 ? "inclusa" : "€ " + fmt(a.prezzo * a.pezzi)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* voci libere commessa */}
          {vociCommessa.map((vl, i) => (
            <div key={i} style={{ background: card, borderRadius: 12, marginBottom: 8, padding: "12px 14px", ...rowBetween, borderLeft: "3px solid " + sub }}>
              <span style={{ fontSize: 13, color: text }}>{vl.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: text }}>€ {fmt(vl.importo)}</span>
            </div>
          ))}

          {/* ── PARAMETRI ── */}
          <div style={{ background: card, borderRadius: 12, padding: "14px", marginTop: 6, marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Parametri</div>

            {/* sconto + IVA su una riga */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={labelStyle}>Sconto %</div>
                <input type="number" value={c.scontoPerc || c.sconto || 0} min={0} max={100} onChange={e => upd("scontoPerc", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={labelStyle}>IVA %</div>
                <input type="number" value={c.ivaPerc || 10} min={0} max={22} onChange={e => upd("ivaPerc", e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* acconto */}
            <div style={{ marginBottom: 10 }}>
              <div style={labelStyle}>Acconto €</div>
              <input type="number" value={c.accontoRicevuto || 0} min={0} onChange={e => upd("accontoRicevuto", e.target.value)} style={inputStyle} />
            </div>

            {/* note */}
            <div>
              <div style={labelStyle}>Note</div>
              <textarea
                value={c.notePreventivo || ""}
                onChange={e => upd("notePreventivo", e.target.value)}
                placeholder="Condizioni, garanzie, tempi..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid " + bdr, fontSize: 13, minHeight: 60, resize: "none" as const, boxSizing: "border-box" as const, fontFamily: "inherit", background: bg, color: text }}
              />
            </div>
          </div>

          {/* ── RIEPILOGO ── */}
          <div style={{ background: card, borderRadius: 12, padding: "14px", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: sub, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>Riepilogo</div>
            {scontoPerc > 0 && (
              <div style={{ ...rowBetween, fontSize: 13, color: "#FF9500", marginBottom: 6 }}>
                <span>Sconto {scontoPerc}%</span><span>− € {fmt(scontoVal)}</span>
              </div>
            )}
            <div style={{ ...rowBetween, fontSize: 13, color: sub, marginBottom: 5 }}>
              <span>Imponibile</span><span style={{ fontWeight: 700, color: text }}>€ {fmt(imponibile)}</span>
            </div>
            <div style={{ ...rowBetween, fontSize: 13, color: sub, marginBottom: 12 }}>
              <span>IVA {ivaPerc}%</span><span>€ {fmt(ivaVal)}</span>
            </div>
            <div style={{ background: text, borderRadius: 10, padding: "12px 14px", ...rowBetween }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>TOTALE IVA INCLUSA</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: acc }}>€ {fmt(totIva)}</span>
            </div>
            {acconto > 0 && (
              <div style={{ marginTop: 8, background: grn + "15", borderRadius: 10, padding: "10px 14px", ...rowBetween }}>
                <div>
                  <div style={{ fontSize: 11, color: sub }}>Acconto: € {fmt(acconto)}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: grn }}>Saldo da incassare</div>
                </div>
                <span style={{ fontSize: 18, fontWeight: 900, color: grn }}>€ {fmt(saldo)}</span>
              </div>
            )}
          </div>

          {/* ── FIRMA ── */}
          {c.firmaCliente ? (
            <div style={{ background: grn + "10", borderRadius: 12, padding: 14, border: "1.5px solid " + grn + "40", marginBottom: 10 }}>
              <div style={{ ...rowBetween, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: grn }}>✓ Firmato {c.dataFirma || ""}</span>
                <button onClick={() => { upd("firmaCliente", null); upd("dataFirma", null); }} style={{ fontSize: 12, color: red, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Rimuovi</button>
              </div>
              <img src={c.firmaCliente} alt="Firma" style={{ width: "100%", maxHeight: 60, objectFit: "contain", background: "#fff", borderRadius: 8 }} />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <button
                onClick={() => { setShowPreventivoModal(false); setShowFirmaModal(true); }}
                style={{ padding: "13px 8px", borderRadius: 12, border: "1.5px solid " + grn, background: grn + "12", color: grn, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", lineHeight: 1.3, textAlign: "center" as const }}
              >Firma qui</button>
              <button
                onClick={handleInviaLink}
                disabled={invioLink}
                style={{ padding: "13px 8px", borderRadius: 12, border: "1.5px solid " + acc, background: acc + "12", color: acc, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", lineHeight: 1.3, textAlign: "center" as const, opacity: invioLink ? 0.6 : 1 }}
              >{linkCopiato ? "✓ Link copiato!" : invioLink ? "..." : "Invia link\nfirma cliente"}</button>
            </div>
          )}
        </div>

        {/* ── FOOTER fisso — PDF button ── */}
        <div style={{ padding: "12px 16px 28px", borderTop: "1px solid " + bdr, flexShrink: 0, background: bg }}>
          <button
            onClick={handleGeneraPDF}
            disabled={bloccato}
            style={{
              width: "100%", padding: 16, borderRadius: 14, border: "none",
              fontSize: 16, fontWeight: 800, cursor: bloccato ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              background: bloccato ? "#8e8e93" : `linear-gradient(135deg, ${acc}, ${acc}cc)`,
              color: "#fff",
              opacity: bloccato ? 0.7 : 1,
              boxShadow: bloccato ? "none" : `0 4px 20px ${acc}50`
            }}
          >
            {bloccato ? `Conferma ${vaniNonConfermati.length} misure per procedere` : "📄 Genera e Scarica PDF"}
          </button>
        </div>

      </div>
    </div>
  );
}
