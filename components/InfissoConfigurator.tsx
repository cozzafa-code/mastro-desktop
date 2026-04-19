"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — InfissoConfigurator
// Configuratore SVG tecnico per infissi, porte, scorrevoli
// Mobile-first. Nessuna dipendenza esterna.
// ═══════════════════════════════════════════════════════════
import React, { useState, useMemo, useCallback } from "react";

// ── Costanti disegno ─────────────────────────────────────
const FRAME = 6;        // spessore telaio px SVG
const SASH  = 4;        // spessore anta
const DASH  = [4, 3];   // tratteggio apertura

// ── Tipi infisso ─────────────────────────────────────────
export const TIPI_INFISSO = [
  // Finestre
  { id: "F1A_DX",   label: "1 anta DX",       cat: "finestra",   icon: "F1R" },
  { id: "F1A_SX",   label: "1 anta SX",       cat: "finestra",   icon: "F1L" },
  { id: "F2A",      label: "2 ante",           cat: "finestra",   icon: "F2"  },
  { id: "F3A",      label: "3 ante",           cat: "finestra",   icon: "F3"  },
  { id: "F_FISSO",  label: "Fisso",            cat: "finestra",   icon: "FX"  },
  // Porta-finestre
  { id: "PF1_DX",   label: "PF 1 anta DX",    cat: "portafinestra", icon: "PF1R" },
  { id: "PF1_SX",   label: "PF 1 anta SX",    cat: "portafinestra", icon: "PF1L" },
  { id: "PF2",      label: "PF 2 ante",        cat: "portafinestra", icon: "PF2"  },
  // Scorrevoli
  { id: "SC2",      label: "Scorrevole 2",     cat: "scorrevole", icon: "SC2" },
  { id: "SC3",      label: "Scorrevole 3",     cat: "scorrevole", icon: "SC3" },
  { id: "ALZ",      label: "Alzante",          cat: "scorrevole", icon: "ALZ" },
  // Porte
  { id: "P1_DX",    label: "Porta DX",         cat: "porta",      icon: "P1R" },
  { id: "P1_SX",    label: "Porta SX",         cat: "porta",      icon: "P1L" },
  { id: "P2",       label: "Porta 2 ante",     cat: "porta",      icon: "P2"  },
  // Speciali
  { id: "ARCO",     label: "Con arco",         cat: "speciale",   icon: "AR"  },
  { id: "FISSO_T",  label: "Fisso+Traverso",   cat: "speciale",   icon: "FT"  },
  { id: "VASISTAS", label: "Vasistas",         cat: "speciale",   icon: "VS"  },
  { id: "CUSTOM",   label: "Personalizzato",   cat: "speciale",   icon: "CU"  },
];

const CATS = [
  { id: "finestra",      label: "Finestre" },
  { id: "portafinestra", label: "Porta-fin." },
  { id: "scorrevole",    label: "Scorrevoli" },
  { id: "porta",         label: "Porte" },
  { id: "speciale",      label: "Speciali" },
];

// ─────────────────────────────────────────────────────────
// MOTORE SVG
// Genera il disegno tecnico dell'infisso dato tipo + misure
// Coordinate in mm, poi scalate al viewBox
// ─────────────────────────────────────────────────────────
function generaSVG(tipo: string, W: number, H: number, opts: any = {}): string {
  const PAD = 28; // padding quote
  const vW = W + PAD * 2;
  const vH = H + PAD * 2;
  const x0 = PAD, y0 = PAD;

  const frame = `
    <rect x="${x0}" y="${y0}" width="${W}" height="${H}"
      fill="#e8f0fe" stroke="#1A1A1C" stroke-width="${FRAME}" />`;

  // helper: anta battente con arco apertura
  const antaBattente = (ax: number, ay: number, aw: number, ah: number, lato: "sx"|"dx", verso: "int"|"ext" = "int") => {
    const sx = ax, dx = ax + aw, top = ay, bot = ay + ah;
    const cx = lato === "sx" ? sx : dx;
    const r = Math.min(aw, ah) * 0.7;
    const arcX = lato === "sx" ? sx + r : dx - r;
    const sweep = lato === "sx" ? 1 : 0;
    return `
      <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}"
        fill="#c8daf8" stroke="#1A1A1C" stroke-width="${SASH}" />
      <line x1="${cx}" y1="${top}" x2="${cx}" y2="${bot}"
        stroke="#1A1A1C" stroke-width="1.5"
        stroke-dasharray="${DASH[0]},${DASH[1]}" />
      <path d="M ${cx} ${bot} A ${r} ${r} 0 0 ${sweep} ${arcX} ${ay}"
        fill="none" stroke="#3B7FE0" stroke-width="1.5"
        stroke-dasharray="${DASH[0]},${DASH[1]}" opacity="0.7"/>
      <text x="${ax + aw/2}" y="${ay + ah/2 + 4}" text-anchor="middle"
        font-size="9" fill="#3B7FE0" font-weight="700"
        font-family="Inter,system-ui">${lato === "sx" ? "◁" : "▷"}</text>`;
  };

  // helper: anta scorrevole
  const antaScorrevole = (ax: number, ay: number, aw: number, ah: number, dir: "sx"|"dx") => {
    const arrowX1 = dir === "sx" ? ax + 8 : ax + aw - 8;
    const arrowX2 = dir === "sx" ? ax + aw * 0.6 : ax + aw * 0.4;
    return `
      <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}"
        fill="#d4edda" stroke="#1A9E73" stroke-width="${SASH}" />
      <line x1="${arrowX1}" y1="${ay + ah/2}"
            x2="${arrowX2}" y2="${ay + ah/2}"
        stroke="#1A9E73" stroke-width="2"
        marker-end="url(#arrow_${dir})" />`;
  };

  // helper: fisso
  const antaFissa = (ax: number, ay: number, aw: number, ah: number) => `
    <rect x="${ax}" y="${ay}" width="${aw}" height="${ah}"
      fill="#f0f4ff" stroke="#8e8e93" stroke-width="${SASH}" stroke-dasharray="6,3" />
    <line x1="${ax+4}" y1="${ay+4}" x2="${ax+aw-4}" y2="${ay+ah-4}"
      stroke="#c0c0c8" stroke-width="1" />
    <line x1="${ax+aw-4}" y1="${ay+4}" x2="${ax+4}" y2="${ay+ah-4}"
      stroke="#c0c0c8" stroke-width="1" />`;

  // helper: maniglia
  const maniglia = (ax: number, ay: number, aw: number, ah: number, lato: "sx"|"dx") => {
    const mx = lato === "sx" ? ax + aw - 6 : ax + 6;
    const my = ay + ah / 2;
    return `<circle cx="${mx}" cy="${my}" r="3" fill="#D08008" />`;
  };

  // helper: quote
  const quote = () => `
    <line x1="${x0}" y1="${y0 - 10}" x2="${x0 + W}" y2="${y0 - 10}"
      stroke="#8e8e93" stroke-width="0.8" marker-start="url(#tick)" marker-end="url(#tick)" />
    <text x="${x0 + W/2}" y="${y0 - 14}" text-anchor="middle"
      font-size="8" fill="#8e8e93" font-family="Inter,system-ui">${W} mm</text>
    <line x1="${x0 + W + 10}" y1="${y0}" x2="${x0 + W + 10}" y2="${y0 + H}"
      stroke="#8e8e93" stroke-width="0.8" marker-start="url(#tick)" marker-end="url(#tick)" />
    <text x="${x0 + W + 18}" y="${y0 + H/2 + 3}" text-anchor="middle"
      font-size="8" fill="#8e8e93" font-family="Inter,system-ui"
      transform="rotate(90, ${x0 + W + 18}, ${y0 + H/2 + 3})">${H} mm</text>`;

  const defs = `<defs>
    <marker id="tick" markerWidth="4" markerHeight="6" refX="2" refY="3" orient="auto">
      <line x1="2" y1="0" x2="2" y2="6" stroke="#8e8e93" stroke-width="1"/>
    </marker>
    <marker id="arrow_sx" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
      <path d="M6,0 L0,3 L6,6" fill="none" stroke="#1A9E73" stroke-width="1.5"/>
    </marker>
    <marker id="arrow_dx" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
      <path d="M0,0 L6,3 L0,6" fill="none" stroke="#1A9E73" stroke-width="1.5"/>
    </marker>
  </defs>`;

  let body = "";
  const iF = FRAME / 2; // inset telaio

  switch (tipo) {
    case "F1A_DX":
    case "PF1_DX":
    case "P1_DX":
      body = antaBattente(x0+iF, y0+iF, W-iF*2, H-iF*2, "sx", "int")
           + maniglia(x0+iF, y0+iF, W-iF*2, H-iF*2, "sx");
      break;
    case "F1A_SX":
    case "PF1_SX":
    case "P1_SX":
      body = antaBattente(x0+iF, y0+iF, W-iF*2, H-iF*2, "dx", "int")
           + maniglia(x0+iF, y0+iF, W-iF*2, H-iF*2, "dx");
      break;
    case "F2A":
    case "PF2":
    case "P2": {
      const hw = (W - iF*2) / 2;
      body = antaBattente(x0+iF, y0+iF, hw, H-iF*2, "dx", "int")
           + antaBattente(x0+iF+hw, y0+iF, hw, H-iF*2, "sx", "int")
           + maniglia(x0+iF, y0+iF, hw, H-iF*2, "dx")
           + maniglia(x0+iF+hw, y0+iF, hw, H-iF*2, "sx");
      break;
    }
    case "F3A": {
      const tw = (W - iF*2) / 3;
      body = antaFissa(x0+iF, y0+iF, tw, H-iF*2)
           + antaBattente(x0+iF+tw, y0+iF, tw, H-iF*2, "dx", "int")
           + antaBattente(x0+iF+tw*2, y0+iF, tw, H-iF*2, "sx", "int");
      break;
    }
    case "F_FISSO":
    case "FISSO_T":
      body = antaFissa(x0+iF, y0+iF, W-iF*2, H-iF*2);
      if (tipo === "FISSO_T") {
        const tH = H * 0.3;
        body += antaBattente(x0+iF, y0+iF, W-iF*2, tH, "dx")
              + antaFissa(x0+iF, y0+iF+tH, W-iF*2, H-iF*2-tH);
      }
      break;
    case "SC2": {
      const hw = (W - iF*2) / 2;
      body = antaScorrevole(x0+iF, y0+iF, hw, H-iF*2, "dx")
           + antaScorrevole(x0+iF+hw, y0+iF, hw, H-iF*2, "sx");
      break;
    }
    case "SC3": {
      const tw = (W - iF*2) / 3;
      body = antaFissa(x0+iF, y0+iF, tw, H-iF*2)
           + antaScorrevole(x0+iF+tw, y0+iF, tw, H-iF*2, "dx")
           + antaScorrevole(x0+iF+tw*2, y0+iF, tw, H-iF*2, "sx");
      break;
    }
    case "ALZ": {
      const hw = (W - iF*2) / 2;
      body = antaScorrevole(x0+iF, y0+iF, hw, H-iF*2, "dx")
           + antaScorrevole(x0+iF+hw, y0+iF, hw, H-iF*2, "sx")
           + `<text x="${x0+W/2}" y="${y0+H-8}" text-anchor="middle"
               font-size="7" fill="#1A9E73" font-family="Inter,system-ui">ALZANTE</text>`;
      break;
    }
    case "ARCO": {
      const ah = H * 0.25;
      const rA = W / 2;
      body = antaBattente(x0+iF, y0+ah+iF, (W-iF*2)/2, H-ah-iF*2, "dx")
           + antaBattente(x0+iF+(W-iF*2)/2, y0+ah+iF, (W-iF*2)/2, H-ah-iF*2, "sx")
           + `<path d="M ${x0+iF} ${y0+ah} Q ${x0+W/2} ${y0+iF} ${x0+W-iF} ${y0+ah}"
               fill="#c8daf8" stroke="#1A1A1C" stroke-width="${SASH}" />`;
      break;
    }
    case "VASISTAS": {
      body = antaFissa(x0+iF, y0+iF, W-iF*2, H-iF*2)
           + `<rect x="${x0+iF}" y="${y0+iF}" width="${W-iF*2}" height="${(H-iF*2)*0.35}"
               fill="#c8daf8" stroke="#1A1A1C" stroke-width="${SASH}" />
             <text x="${x0+W/2}" y="${y0+H*0.2}" text-anchor="middle"
               font-size="7" fill="#3B7FE0" font-family="Inter,system-ui">▲ VASISTAS</text>`;
      break;
    }
    default:
      body = antaBattente(x0+iF, y0+iF, W-iF*2, H-iF*2, "sx");
  }

  // Tapparella
  const tapH = opts.tapparella ? 16 : 0;
  const tapSVG = opts.tapparella ? `
    <rect x="${x0}" y="${y0 - tapH}" width="${W}" height="${tapH}"
      fill="#D08008" opacity="0.25" stroke="#D08008" stroke-width="1.5" />
    <text x="${x0 + W/2}" y="${y0 - 5}" text-anchor="middle"
      font-size="7" fill="#D08008" font-weight="700"
      font-family="Inter,system-ui">TAPPARELLA</text>` : "";

  // Zanzariera
  const zanSVG = opts.zanzariera ? `
    <rect x="${x0+2}" y="${y0+2}" width="${W-4}" height="${H-4}"
      fill="none" stroke="#3B7FE0" stroke-width="1"
      stroke-dasharray="3,3" opacity="0.5" />
    <text x="${x0+6}" y="${y0+12}" font-size="6" fill="#3B7FE0"
      opacity="0.7" font-family="Inter,system-ui">ZAN</text>` : "";

  return `<svg xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 ${vW} ${vH + tapH}"
    style="width:100%;height:100%">
    ${defs}
    ${tapSVG}
    ${frame}
    ${body}
    ${zanSVG}
    ${quote()}
  </svg>`;
}

// ─────────────────────────────────────────────────────────
// COMPONENTE PRINCIPALE
// ─────────────────────────────────────────────────────────
interface Props {
  vano: any;
  updVano: (id: any, patch: any) => void;
  T: any;
}

export default function InfissoConfigurator({ vano, updVano, T }: Props) {
  const cfg = vano.infissoConfig || {};
  const m   = vano.misure || {};

  const upd = useCallback((patch: any) => {
    updVano(vano.id, { infissoConfig: { ...cfg, ...patch } });
  }, [vano.id, cfg, updVano]);

  const updM = useCallback((patch: any) => {
    updVano(vano.id, { misure: { ...m, ...patch } });
  }, [vano.id, m, updVano]);

  const W = m.lCentro || 1000;
  const H = m.hCentro || 1500;
  const tipo = cfg.tipo || "F2A";

  // Misure speciali visibili solo se diverse dal centro
  const hasFuorisquadro = m.lAlto && m.lAlto !== m.lCentro;
  const [showExtra, setShowExtra] = useState(!!hasFuorisquadro);
  const [catAttiva, setCatAttiva] = useState<string>("finestra");

  const svgStr = useMemo(() =>
    generaSVG(tipo, W, H, {
      tapparella: vano.accessori?.tapparella?.attivo,
      zanzariera: vano.accessori?.zanzariera?.attivo,
    }),
    [tipo, W, H, vano.accessori]
  );

  const inputS = {
    width: "100%", padding: "10px 12px", borderRadius: 10,
    border: `1.5px solid ${T.bdr}`, fontSize: 20, fontWeight: 800,
    textAlign: "right" as const, boxSizing: "border-box" as const,
    background: T.bg, color: T.text, fontFamily: "Inter,system-ui",
  };
  const labelS = {
    fontSize: 10, fontWeight: 700, color: T.sub,
    textTransform: "uppercase" as const, letterSpacing: 0.8, marginBottom: 4,
  };

  const tipiCat = TIPI_INFISSO.filter(t => t.cat === catAttiva);

  return (
    <div style={{ padding: "0 0 8px" }}>

      {/* ── SVG PREVIEW ── */}
      <div style={{
        background: "#f8f9ff", borderRadius: 14, border: `1.5px solid ${T.bdr}`,
        padding: 12, marginBottom: 14,
        minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <div
          style={{ width: "100%", maxWidth: 340 }}
          dangerouslySetInnerHTML={{ __html: svgStr }}
        />
      </div>

      {/* ── MISURE PRINCIPALI — 2 campi grandi ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <div style={labelS}>Larghezza mm</div>
          <input
            type="number" inputMode="numeric"
            value={m.lCentro || ""}
            placeholder="1200"
            onChange={e => {
              const v = Number(e.target.value);
              updM({ lCentro: v, lAlto: m.lAlto || v, lBasso: m.lBasso || v });
            }}
            style={inputS}
            autoFocus={false}
          />
        </div>
        <div>
          <div style={labelS}>Altezza mm</div>
          <input
            type="number" inputMode="numeric"
            value={m.hCentro || ""}
            placeholder="1500"
            onChange={e => {
              const v = Number(e.target.value);
              updM({ hCentro: v, hSx: m.hSx || v, hDx: m.hDx || v });
            }}
            style={inputS}
          />
        </div>
      </div>

      {/* ── MISURE EXTRA (fuorisquadro) ── */}
      <div
        onClick={() => setShowExtra(!showExtra)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          marginBottom: showExtra ? 10 : 14, cursor: "pointer",
          padding: "8px 10px", borderRadius: 10,
          background: showExtra ? "#D0800810" : T.card,
          border: `1px solid ${showExtra ? "#D08008" : T.bdr}`,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: showExtra ? "#D08008" : T.sub }}>
          {showExtra ? "▲" : "▼"} Misure fuorisquadro / dettaglio
        </span>
        {hasFuorisquadro && (
          <span style={{ fontSize: 9, background: "#D0800820", color: "#D08008", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>
            ATTIVO
          </span>
        )}
      </div>

      {showExtra && (
        <div style={{ background: T.card, borderRadius: 12, padding: "12px", marginBottom: 14, border: `1px solid ${T.bdr}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
            {[
              { k: "lAlto",  label: "L. Alto" },
              { k: "lCentro", label: "L. Centro" },
              { k: "lBasso", label: "L. Basso" },
              { k: "hSx",   label: "H. Sx" },
              { k: "hCentro", label: "H. Centro" },
              { k: "hDx",   label: "H. Dx" },
            ].map(({ k, label }) => (
              <div key={k}>
                <div style={{ ...labelS, fontSize: 9 }}>{label}</div>
                <input
                  type="number" inputMode="numeric"
                  value={m[k] || ""}
                  placeholder="0"
                  onChange={e => updM({ [k]: Number(e.target.value) })}
                  style={{ ...inputS, fontSize: 14, padding: "8px 10px" }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { k: "d1",    label: "D1" },
              { k: "d2",    label: "D2" },
              { k: "spSx",  label: "Sp. Sx" },
              { k: "spDx",  label: "Sp. Dx" },
              { k: "davInt", label: "Dav. Int" },
              { k: "davEst", label: "Dav. Est" },
              { k: "soglia", label: "Soglia" },
              { k: "imbotte", label: "Imbotte" },
            ].map(({ k, label }) => (
              <div key={k}>
                <div style={{ ...labelS, fontSize: 9 }}>{label}</div>
                <input
                  type="number" inputMode="numeric"
                  value={m[k] || ""}
                  placeholder="0"
                  onChange={e => updM({ [k]: Number(e.target.value) })}
                  style={{ ...inputS, fontSize: 13, padding: "7px 8px" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SELEZIONE TIPO ── */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ ...labelS, marginBottom: 8 }}>Tipo infisso</div>

        {/* Tab categorie */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto", paddingBottom: 4 }}>
          {CATS.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCatAttiva(cat.id)}
              style={{
                padding: "6px 12px", borderRadius: 20, border: "1.5px solid",
                borderColor: catAttiva === cat.id ? "#D08008" : T.bdr,
                background: catAttiva === cat.id ? "#D0800815" : T.bg,
                color: catAttiva === cat.id ? "#D08008" : T.sub,
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                whiteSpace: "nowrap", fontFamily: "Inter,system-ui",
                flexShrink: 0,
              }}
            >{cat.label}</button>
          ))}
        </div>

        {/* Griglia tipi */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {tipiCat.map(t => {
            const sel = tipo === t.id;
            return (
              <button
                key={t.id}
                onClick={() => upd({ tipo: t.id })}
                style={{
                  padding: "10px 6px", borderRadius: 12,
                  border: `2px solid ${sel ? "#D08008" : T.bdr}`,
                  background: sel ? "#D0800815" : T.card,
                  cursor: "pointer", fontFamily: "Inter,system-ui",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 4,
                }}
              >
                {/* Mini SVG preview tipo */}
                <div style={{ width: 44, height: 34 }}
                  dangerouslySetInnerHTML={{ __html: miniPreview(t.id) }}
                />
                <span style={{
                  fontSize: 9, fontWeight: sel ? 800 : 600,
                  color: sel ? "#D08008" : T.sub, textAlign: "center", lineHeight: 1.2,
                }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── NOTE VANO ── */}
      <div style={{ marginTop: 10 }}>
        <div style={labelS}>Note vano</div>
        <textarea
          value={vano.note || ""}
          onChange={e => updVano(vano.id, { note: e.target.value })}
          placeholder="Note tecniche, colori, finiture..."
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 10,
            border: `1.5px solid ${T.bdr}`, fontSize: 13, minHeight: 56,
            resize: "none", boxSizing: "border-box" as const,
            fontFamily: "Inter,system-ui", background: T.bg, color: T.text,
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Mini preview per griglia selezione tipo
// ─────────────────────────────────────────────────────────
export function generaSVGMini(tipo: string, W: number = 900, H: number = 1400, tapp: boolean = false, zanz: boolean = false): string {
  return miniPreview(tipo);
}

function miniPreview(tipo: string): string {
  const W = 44, H = 34, f = 2, s = 2;
  const base = `<rect x="1" y="1" width="${W-2}" height="${H-2}" fill="#e8f0fe" stroke="#1A1A1C" stroke-width="${f}" rx="1"/>`;

  const linV = (x: number) => `<line x1="${x}" y1="${1+f}" x2="${x}" y2="${H-1-f}" stroke="#1A1A1C" stroke-width="${s}"/>`;
  const linH = (y: number) => `<line x1="${1+f}" y1="${y}" x2="${W-1-f}" y2="${y}" stroke="#1A1A1C" stroke-width="${s}"/>`;
  const arcR = (x: number, y: number, r: number, sweep: number) =>
    `<path d="M${x},${H-3} A${r},${r} 0 0 ${sweep} ${x+(sweep?r:-r)},${y}" fill="none" stroke="#3B7FE0" stroke-width="1" stroke-dasharray="2,2"/>`;

  switch (tipo) {
    case "F1A_DX": case "PF1_DX": case "P1_DX":
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${base}${arcR(f+1, f+1, H-f*2-2, 1)}</svg>`;
    case "F1A_SX": case "PF1_SX": case "P1_SX":
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${base}${arcR(W-f-1, f+1, H-f*2-2, 0)}</svg>`;
    case "F2A": case "PF2": case "P2":
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${base}${linV(W/2)}${arcR(f+1,f+1,H/2-f,1)}${arcR(W-f-1,f+1,H/2-f,0)}</svg>`;
    case "F3A":
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${base}${linV(W/3)}${linV(W*2/3)}</svg>`;
    case "F_FISSO":
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${base}<line x1="4" y1="4" x2="${W-4}" y2="${H-4}" stroke="#ccc" stroke-width="1"/><line x1="${W-4}" y1="4" x2="4" y2="${H-4}" stroke="#ccc" stroke-width="1"/></svg>`;
    case "SC2":
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${base}${linV(W/2)}<line x1="6" y1="${H/2}" x2="${W/2-3}" y2="${H/2}" stroke="#1A9E73" stroke-width="1.5"/><line x1="${W/2+3}" y1="${H/2}" x2="${W-6}" y2="${H/2}" stroke="#1A9E73" stroke-width="1.5"/></svg>`;
    case "ALZ":
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${base}${linV(W/2)}<text x="${W/2}" y="${H-4}" text-anchor="middle" font-size="5" fill="#1A9E73" font-family="Inter">ALZ</text></svg>`;
    case "ARCO":
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${base}<path d="M${f+1},${H/3} Q${W/2},${f+1} ${W-f-1},${H/3}" fill="#c8daf8" stroke="#1A1A1C" stroke-width="${s}"/>${linV(W/2)}</svg>`;
    case "VASISTAS":
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${base}${linH(H/3)}<text x="${W/2}" y="${H/4+3}" text-anchor="middle" font-size="5" fill="#3B7FE0" font-family="Inter">▲</text></svg>`;
    case "FISSO_T":
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${base}${linH(H*0.3)}</svg>`;
    default:
      return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${base}<text x="${W/2}" y="${H/2+3}" text-anchor="middle" font-size="8" fill="#8e8e93" font-family="Inter">?</text></svg>`;
  }
}
