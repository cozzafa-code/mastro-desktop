"use client";
// @ts-nocheck
// OrdineControtelaiPanel — riepilogo vani con controtelaio + export PDF ordine
// Usato dentro VanoDetailPanel (sezione riepilogo commessa) o come modal autonomo
import React, { useState } from "react";
import { generaOrdineControtelaiPDF } from "../lib/pdf-ordine-controtelai";

const FM = "'JetBrains Mono','SF Mono',monospace";

const ACC_LABELS = {
  battutaPVC:    "Battuta PVC",
  battutaLegno:  "Battuta legno",
  smusso:        "Smusso 45°",
  quartoLato:    "4° lato PVC",
  tappoZanz:     "Tappo zanzariera",
  sottobancale:  "Sottobancale EPS",
  assemblaggio:  "Assemblaggio CT",
  avvMontaggio:  "Montaggio avvolgibile",
};

const TIPO_MISURA_LABELS = {
  luce:    "Luce architett.",
  esterno: "Esterno CT",
  interno: "Interno telaio",
  grezzo:  "Muro grezzo",
};

function RigaVano({ vano, pos, T }) {
  const ct = vano.controtelaio || {};
  const misL = vano.misure?.lCentro || ct.l || 0;
  const misH = vano.misure?.hCentro || ct.h || 0;
  const accAttivi = Object.entries(ACC_LABELS)
    .filter(([k]) => ct[k])
    .map(([, lbl]) => lbl);

  return (
    <tr style={{ borderBottom: `1px solid ${T.bdr}` }}>
      <td style={{ padding: "8px 6px", textAlign: "center", fontFamily: FM,
        fontSize: 13, fontWeight: 700, color: T.sub }}>{pos}</td>
      <td style={{ padding: "8px 6px", textAlign: "center", fontFamily: FM,
        fontSize: 12, fontWeight: 600, color: T.text }}>1</td>
      <td style={{ padding: "8px 6px", textAlign: "center", fontFamily: FM,
        fontSize: 14, fontWeight: 800, color: T.text }}>
        {ct.l || misL || "—"}
      </td>
      <td style={{ padding: "8px 6px", textAlign: "center", fontFamily: FM,
        fontSize: 14, fontWeight: 800, color: T.text }}>
        {ct.h || misH || "—"}
      </td>
      <td style={{ padding: "8px 6px", textAlign: "center", fontFamily: FM,
        fontSize: 12, fontWeight: 700,
        color: ct.ribattuta ? "#1A9E73" : T.sub }}>
        {ct.ribattuta || "—"}
      </td>
      <td style={{ padding: "8px 6px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#1A9E73" }}>
            {ct.sistema || "—"}
          </div>
          {ct.varA > 0 && (
            <div style={{ fontSize: 10, color: T.sub, fontFamily: FM }}>
              A={ct.varA}mm{ct.varB > 0 ? ` · B=${ct.varB}mm` : ""}
              {ct.varC > 0 ? ` · C=${ct.varC}mm` : ""}
            </div>
          )}
          {ct.tipoMisura && (
            <div style={{ fontSize: 9, color: T.sub }}>
              {TIPO_MISURA_LABELS[ct.tipoMisura] || ct.tipoMisura}
            </div>
          )}
        </div>
      </td>
      <td style={{ padding: "8px 6px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {ct.avvTipologia && (
            <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{ct.avvTipologia}</div>
          )}
          {ct.avvLato && (
            <div style={{ fontSize: 11, fontWeight: 800, color: "#3B7FE0",
              background: "#3B7FE015", borderRadius: 4, padding: "1px 6px",
              display: "inline-block" }}>{ct.avvLato.toUpperCase()}</div>
          )}
          {ct.comando && ct.comando !== "nessuno" && (
            <div style={{ fontSize: 10, color: T.sub }}>{ct.comando}</div>
          )}
          {ct.avvColore && (
            <div style={{ fontSize: 9, color: T.sub }}>{ct.avvColore}</div>
          )}
          {!ct.avvTipologia && !ct.avvLato && (
            <span style={{ color: "#CBD5E1", fontSize: 11 }}>—</span>
          )}
        </div>
      </td>
      <td style={{ padding: "8px 6px" }}>
        <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.5 }}>
          {accAttivi.length > 0
            ? accAttivi.join(" · ")
            : <span style={{ color: "#CBD5E1" }}>—</span>}
        </div>
      </td>
      <td style={{ padding: "8px 6px" }}>
        <div style={{ fontSize: 10, color: T.text }}>
          {vano.stanza || ""}{vano.piano ? ` · ${vano.piano}` : ""}
        </div>
      </td>
    </tr>
  );
}

export default function OrdineControtelaiPanel({
  vani = [],
  commessa,
  aziendaInfo,
  T,
  onClose,
}) {
  const Tc = T || {
    bg: "#F2F1EC", card: "#FFFFFF", bdr: "#E5E3DC",
    text: "#1A1A1C", sub: "#8E8E93", acc: "#D08008",
    grn: "#1A9E73", red: "#DC4444", blue: "#3B7FE0",
  };

  const [note, setNote] = useState("");
  const [generating, setGenerating] = useState(false);

  // Filtra solo vani con controtelaio valorizzato
  const vaniCT = vani.filter(v =>
    v.controtelaio?.sistema && v.controtelaio.sistema !== "nessuno"
  );

  const handleGeneraPDF = async () => {
    setGenerating(true);
    try {
      await generaOrdineControtelaiPDF({
        vani: vaniCT,
        commessa,
        aziendaInfo,
        note,
      });
    } catch (e) {
      console.error("PDF ordine CT:", e);
      alert("Errore generazione PDF. Riprova.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>

      <div style={{
        width: "100%", maxWidth: 700,
        background: Tc.card, borderRadius: "16px 16px 0 0",
        maxHeight: "92vh", display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "14px 16px", background: "#1A1A1C",
          display: "flex", alignItems: "center", gap: 10, flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
              Ordine Controtelai
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 1 }}>
              {vaniCT.length} vano{vaniCT.length !== 1 ? "i" : ""} · commessa {commessa?.code || "—"}
            </div>
          </div>
          <div onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: 18, color: "#fff",
          }}>×</div>
        </div>

        {/* Intestazione mittente */}
        <div style={{
          padding: "10px 16px", background: "#F8FAFC",
          borderBottom: `1px solid ${Tc.bdr}`, flexShrink: 0,
          display: "flex", gap: 16, flexWrap: "wrap",
        }}>
          {[
            ["Azienda", aziendaInfo?.ragioneSociale || aziendaInfo?.nome || "—"],
            ["Cantiere", commessa?.indirizzo || commessa?.nome || "—"],
            ["Rif.", commessa?.code || "—"],
            ["Data", new Date().toLocaleDateString("it-IT")],
          ].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 9, fontWeight: 800, color: Tc.sub,
                textTransform: "uppercase", letterSpacing: 0.5 }}>{k}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: Tc.text }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Tabella vani */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 0 8px" }}>
          {vaniCT.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: Tc.sub, fontSize: 13 }}>
              Nessun vano con controtelaio configurato.<br />
              <span style={{ fontSize: 11 }}>Torna ai vani e seleziona un sistema controtelaio.</span>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr style={{ background: Tc.bg }}>
                    {["POS", "PZ", "L (mm)", "H (mm)", "BAT.", "SISTEMA", "AVVOLGIBILE", "ACCESSORI", "NOTE"].map(h => (
                      <th key={h} style={{
                        padding: "8px 6px", fontSize: 9, fontWeight: 800,
                        color: Tc.sub, textTransform: "uppercase", letterSpacing: 0.5,
                        textAlign: "center", borderBottom: `2px solid ${Tc.bdr}`,
                        whiteSpace: "nowrap",
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vaniCT.map((vano, idx) => (
                    <RigaVano key={vano.id} vano={vano} pos={idx + 1} T={Tc} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Note ordine */}
          <div style={{ padding: "12px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: Tc.sub,
              textTransform: "uppercase", marginBottom: 6 }}>Note ordine</div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Istruzioni speciali, varianti non standard, riferimenti cantiere..."
              rows={3}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "10px 12px", borderRadius: 8,
                border: `1.5px solid ${Tc.bdr}`, fontSize: 12,
                fontFamily: "Inter,sans-serif", resize: "vertical",
                background: "#fff", color: Tc.text, outline: "none",
              }}
            />
          </div>
        </div>

        {/* Footer azioni */}
        <div style={{
          padding: "12px 16px", borderTop: `1px solid ${Tc.bdr}`,
          display: "flex", gap: 10, background: Tc.card, flexShrink: 0,
        }}>
          <div onClick={onClose} style={{
            flex: "0 0 auto", padding: "12px 18px", borderRadius: 10,
            background: Tc.bg, border: `1px solid ${Tc.bdr}`,
            fontSize: 13, fontWeight: 600, color: Tc.sub, cursor: "pointer",
          }}>
            Chiudi
          </div>
          <div
            onClick={vaniCT.length > 0 && !generating ? handleGeneraPDF : undefined}
            style={{
              flex: 1, padding: "13px 16px", borderRadius: 10, textAlign: "center",
              fontSize: 14, fontWeight: 800, cursor: vaniCT.length > 0 ? "pointer" : "not-allowed",
              background: vaniCT.length > 0 ? "#1A1A1C" : "#E2E8F0",
              color: vaniCT.length > 0 ? "#fff" : Tc.sub,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: generating ? 0.7 : 1,
            }}>
            {generating ? (
              <>
                <span style={{ fontSize: 16 }}>⏳</span> Generazione PDF...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Genera PDF Ordine
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
