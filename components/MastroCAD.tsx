"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD v2 — Sistema Parametrico Serramenti
// Tablet-first · Touch nativo · Disegno automatico da tipologia
// Nessun disegno a mano libera — ogni serramento nasce da config
// ═══════════════════════════════════════════════════════════════
import React, { useState, useCallback, useRef, useEffect } from "react";
import MastroCadEngine, {
  defaultCadConfig,
  TIPOLOGIE_DEFAULT,
  CadConfig,
  Tipologia,
} from "./MastroCadEngine";

// ── COLORI ──────────────────────────────────────────────────────
const AMB = "#D08008";
const GRN = "#1A9E73";
const RED = "#DC4444";
const BLU = "#3B7FE0";
const BG  = "#F2F1EC";
const TOP = "#1A1A1C";

// ── TIPI SERRAMENTO ─────────────────────────────────────────────
interface TipoSerramento {
  id: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
  tipologieIds: string[];
  coloriTema: string;
}

const TIPI_SERRAMENTO: TipoSerramento[] = [
  {
    id: "finestra",
    label: "Finestra",
    icon: <IconFinestra />,
    desc: "Battente, scorrevole, fisso, vasistas",
    tipologieIds: ["F1A_DX","F2A","F3A","SOPRALUCE","SC2"],
    coloriTema: BLU,
  },
  {
    id: "portafinestra",
    label: "Portafinestra",
    icon: <IconPortaFinestra />,
    desc: "Battente pavimento, alzante scorrevole",
    tipologieIds: ["PF2","F2A","F1A_DX"],
    coloriTema: GRN,
  },
  {
    id: "porta",
    label: "Porta",
    icon: <IconPorta />,
    desc: "Porta singola, doppia, con fisso laterale",
    tipologieIds: ["F1A_DX","PORTA_VET","PF2"],
    coloriTema: AMB,
  },
  {
    id: "vetrina",
    label: "Vetrina",
    icon: <IconVetrina />,
    desc: "Vetrina commerciale multi-campo",
    tipologieIds: ["VETRINA5","PORTA_VET","F3A"],
    coloriTema: BLU,
  },
  {
    id: "persiana",
    label: "Persiana",
    icon: <IconPersiana />,
    desc: "Avvolgibile, tapparella, veneziana",
    tipologieIds: ["F1A_DX","F2A"],
    coloriTema: "#8a6a40",
  },
  {
    id: "copricaldaia",
    label: "Copri Caldaia",
    icon: <IconCopriCaldaia />,
    desc: "Box, grigliato, pannello aerato",
    tipologieIds: ["F1A_DX","F2A"],
    coloriTema: "#5a5a6a",
  },
];

// ── STEP DEL FLUSSO ─────────────────────────────────────────────
type Step = "tipo" | "config" | "misure" | "canvas";

// ── NUMPAD STATE ─────────────────────────────────────────────────
interface NumpadState {
  target: "W" | "H";
  value: string;
}

// ═══════════════════════════════════════════════════════════════
// ICONE SVG INLINE — nessuna emoji nelle label UI
// ═══════════════════════════════════════════════════════════════
function IconFinestra() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="2" y="4" width="32" height="28" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <rect x="6" y="8" width="10" height="20" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <rect x="20" y="8" width="10" height="20" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <line x1="18" y1="4" x2="18" y2="32" stroke="currentColor" strokeWidth="2"/>
      {/* Arco apertura */}
      <path d="M6 28 A10 10 0 0 0 16 18" stroke="currentColor" strokeWidth="1" strokeDasharray="3,2" opacity="0.7"/>
    </svg>
  );
}
function IconPortaFinestra() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="3" y="2" width="30" height="32" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <line x1="18" y1="2" x2="18" y2="34" stroke="currentColor" strokeWidth="2"/>
      <rect x="7" y="2" width="8" height="32" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5"/>
      <rect x="21" y="2" width="8" height="32" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5"/>
      <circle cx="16" cy="18" r="1.5" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}
function IconPorta() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="5" y="2" width="22" height="32" rx="2" stroke="currentColor" strokeWidth="2.5" fill="none"/>
      <rect x="9" y="6" width="14" height="24" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.5"/>
      <circle cx="21" cy="18" r="1.8" fill="currentColor"/>
      <line x1="5" y1="34" x2="31" y2="34" stroke="currentColor" strokeWidth="2"/>
      <path d="M5 34 A16 16 0 0 0 27 20" stroke="currentColor" strokeWidth="1" strokeDasharray="3,2" opacity="0.5"/>
    </svg>
  );
}
function IconVetrina() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="2" y="6" width="32" height="26" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="10" y1="6" x2="10" y2="32" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="18" y1="6" x2="18" y2="32" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="26" y1="6" x2="26" y2="32" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="2" y="6" width="32" height="6" rx="1" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.1"/>
    </svg>
  );
}
function IconPersiana() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="3" y="3" width="30" height="30" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      {[8,13,18,23,28].map(y => (
        <rect key={y} x="5" y={y} width="26" height="4" rx="1" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.2"/>
      ))}
      <line x1="18" y1="3" x2="18" y2="7" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}
function IconCopriCaldaia() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <rect x="3" y="5" width="30" height="26" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      {[10,16,22,28].map(x => (
        <line key={x} x1={x} y1="5" x2={x} y2="31" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
      ))}
      {[12,20].map(y => (
        <line key={y} x1="3" y1={y} x2="33" y2={y} stroke="currentColor" strokeWidth="1" opacity="0.3"/>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// PREVIEW SVG MINI per le tipologie (thumbnail)
// ─────────────────────────────────────────────────────────────────
function TipologiaPreview({ tip, selected }: { tip: Tipologia; selected: boolean }) {
  const W = 80, H = 60, TF = 6, TA = 5;
  const cols = tip.cols;
  const totalPct = cols.reduce((s, c) => s + c, 0);
  const innerW = W - TF * 2;
  const innerH = H - TF * 2;
  const nCols = cols.length;
  const TM = nCols > 1 ? 4 : 0;
  const availW = innerW - TM * (nCols - 1);

  let curX = TF;
  const colRects: { x: number; w: number; tipo: string; verso: string }[] = [];
  cols.forEach((pct, ci) => {
    const cw = (pct / totalPct) * availW;
    const cella = tip.celle[ci] || { tipo: "fisso", verso: "dx" };
    colRects.push({ x: curX, w: cw, tipo: cella.tipo, verso: cella.verso });
    curX += cw + TM;
  });

  const stroke = selected ? AMB : "#3a5a7a";
  const bg = selected ? `${AMB}15` : "#f0f4f8";

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <rect x="0" y="0" width={W} height={H} rx="3" fill={bg}/>
      {/* Telaio */}
      <rect x={0} y={0} width={W} height={TF} fill={stroke} opacity="0.7"/>
      <rect x={0} y={H - TF} width={W} height={TF} fill={stroke} opacity="0.7"/>
      <rect x={0} y={TF} width={TF} height={H - TF * 2} fill={stroke} opacity="0.7"/>
      <rect x={W - TF} y={TF} width={TF} height={H - TF * 2} fill={stroke} opacity="0.7"/>
      {/* Colonne */}
      {colRects.map((col, ci) => {
        const sx = col.x, sw = col.w;
        const sx2 = sx + TA, sy2 = TF + TA, sw2 = sw - TA * 2, sh2 = innerH - TA * 2;
        // Montante
        const showMont = ci > 0;
        return (
          <g key={ci}>
            {showMont && <rect x={sx - TM} y={TF} width={TM} height={innerH} fill={stroke} opacity="0.6"/>}
            {/* Anta bordo */}
            <rect x={sx} y={TF} width={sw} height={innerH} fill="none" stroke={stroke} strokeWidth="1" opacity="0.5"/>
            {/* Vetro */}
            {sw2 > 0 && sh2 > 0 && (
              <rect x={sx2} y={sy2} width={sw2} height={sh2} fill="#a8d4f050" stroke="#4a96b8" strokeWidth="0.5"/>
            )}
            {/* Apertura */}
            {col.tipo === "anta" && (
              <path
                d={col.verso === "dx"
                  ? `M ${sx} ${H - TF} A ${Math.min(sw, innerH) * 0.8} ${Math.min(sw, innerH) * 0.8} 0 0 0 ${sx + sw} ${H - TF - Math.min(sw, innerH) * 0.8}`
                  : `M ${sx + sw} ${H - TF} A ${Math.min(sw, innerH) * 0.8} ${Math.min(sw, innerH) * 0.8} 0 0 1 ${sx} ${H - TF - Math.min(sw, innerH) * 0.8}`}
                fill={`${GRN}15`} stroke={GRN} strokeWidth="0.8" strokeDasharray="3,2"
              />
            )}
            {col.tipo === "scorrevole" && (
              <g>
                <line x1={sx + sw * 0.2} y1={TF + innerH * 0.5} x2={sx + sw * 0.8} y2={TF + innerH * 0.5} stroke={GRN} strokeWidth="1.5"/>
                <polygon points={`${sx+sw*0.75},${TF+innerH*0.5-3} ${sx+sw*0.85},${TF+innerH*0.5} ${sx+sw*0.75},${TF+innerH*0.5+3}`} fill={GRN}/>
              </g>
            )}
            {col.tipo === "fisso" && (
              <g opacity="0.4">
                <line x1={sx2} y1={sy2} x2={sx2+sw2} y2={sy2+sh2} stroke="#4a7a9a" strokeWidth="0.7"/>
                <line x1={sx2+sw2} y1={sy2} x2={sx2} y2={sy2+sh2} stroke="#4a7a9a" strokeWidth="0.7"/>
              </g>
            )}
            {col.tipo === "vasistas" && (
              <path d={`M ${sx2} ${sy2+sh2*0.3} L ${sx2+sw2/2} ${sy2+3} L ${sx2+sw2} ${sy2+sh2*0.3}`}
                stroke={GRN} strokeWidth="0.8" strokeDasharray="2,2" fill="none"/>
            )}
          </g>
        );
      })}
      {/* Outline */}
      <rect x="0.5" y="0.5" width={W - 1} height={H - 1} rx="3" fill="none"
        stroke={selected ? AMB : "#3a5a7a"} strokeWidth={selected ? 2 : 1}/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// PROPS COMPONENTE PRINCIPALE
// ─────────────────────────────────────────────────────────────────
interface MastroCADProps {
  onClose: () => void;
  onSalva?: (data: { config: CadConfig; svgData?: string }) => void;
  onMisureUpdate?: (mis: { lCentro: number; hCentro: number }) => void;
  vanoNome?: string;
  misureIniziali?: { lCentro?: number; hCentro?: number };
}

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE — MastroCAD v2
// ═══════════════════════════════════════════════════════════════
export default function MastroCAD({
  onClose, onSalva, onMisureUpdate, vanoNome, misureIniziali
}: MastroCADProps) {
  // ── STEP FLOW ──────────────────────────────────────────────
  const [step, setStep] = useState<Step>("tipo");
  const [tipoSel, setTipoSel] = useState<TipoSerramento | null>(null);
  const [tipologiaSel, setTipologiaSel] = useState<Tipologia | null>(null);

  // ── MISURE ────────────────────────────────────────────────
  const [W, setW] = useState(misureIniziali?.lCentro || 0);
  const [H, setH] = useState(misureIniziali?.hCentro || 0);
  const [npTarget, setNpTarget] = useState<"W" | "H">("W");
  const [npVal, setNpVal] = useState("");

  // ── CONFIG CAD ────────────────────────────────────────────
  const [cadConfig, setCadConfig] = useState<CadConfig | null>(null);

  // ── PANEL LATERALE ────────────────────────────────────────
  const [panelTab, setPanelTab] = useState<"tipologia" | "profilo" | "montanti" | "quote">("tipologia");
  const [montInputMm, setMontInputMm] = useState("");
  const [travInputMm, setTravInputMm] = useState("");

  // ── STEP: scegli tipo ─────────────────────────────────────
  function selezionaTipo(tipo: TipoSerramento) {
    setTipoSel(tipo);
    setStep("config");
  }

  // ── STEP: scegli configurazione ──────────────────────────
  function selezionaConfig(tip: Tipologia) {
    setTipologiaSel(tip);
    // Se le misure sono già note, vai diretto al canvas
    if (W > 100 && H > 100) {
      buildConfig(tip, W, H);
      setStep("canvas");
    } else {
      setStep("misure");
      setNpTarget("W");
      setNpVal(W > 0 ? String(W) : "");
    }
  }

  // ── STEP: costruisci config ───────────────────────────────
  function buildConfig(tip: Tipologia, w: number, h: number) {
    const base = defaultCadConfig();
    const cfg: CadConfig = {
      ...base,
      W: w,
      H: h,
      tipologia: tip,
      montanti: [],
      traversi: [],
      showQuote: true,
    };
    setCadConfig(cfg);
    if (onMisureUpdate) onMisureUpdate({ lCentro: w, hCentro: h });
  }

  // ── NUMPAD ────────────────────────────────────────────────
  function npKey(k: string) {
    if (k === "⌫") { setNpVal(v => v.slice(0, -1)); return; }
    if (k === "OK") {
      const mm = parseInt(npVal, 10) || 0;
      if (npTarget === "W") {
        setW(mm);
        if (H > 100) {
          buildConfig(tipologiaSel!, mm, H);
          setStep("canvas");
        } else {
          setNpTarget("H");
          setNpVal(H > 0 ? String(H) : "");
        }
      } else {
        setH(mm);
        buildConfig(tipologiaSel!, W, mm);
        setStep("canvas");
      }
      return;
    }
    setNpVal(v => v + k);
  }

  function npQuick(delta: number) {
    setNpVal(v => String(Math.max(0, (parseInt(v, 10) || 0) + delta)));
  }

  // ── CANVAS CONFIG CHANGES ─────────────────────────────────
  function handleConfigChange(newCfg: CadConfig) {
    setCadConfig(newCfg);
    if (onMisureUpdate) onMisureUpdate({ lCentro: newCfg.W, hCentro: newCfg.H });
  }

  // ── SALVA ─────────────────────────────────────────────────
  function handleSalva() {
    if (onSalva && cadConfig) onSalva({ config: cadConfig });
    onClose();
  }

  // ── STILI CONDIVISI ───────────────────────────────────────
  const s = {
    root: { position: "fixed" as const, inset: 0, zIndex: 600, display: "flex", flexDirection: "column" as const, fontFamily: "system-ui", background: BG },
    topbar: { background: TOP, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 },
    topTitle: { color: "#fff", fontSize: 14, fontWeight: 700, flex: 1 },
    backBtn: { background: "none", border: "none", color: "#888", fontSize: 22, cursor: "pointer", padding: "0 4px" },
    saveBtn: { padding: "7px 18px", borderRadius: 9, border: "none", background: GRN, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
    scroll: { flex: 1, overflow: "auto" as const, padding: 16 },
    sectionTitle: { fontSize: 13, fontWeight: 800, color: TOP, marginBottom: 4 },
    sectionSub: { fontSize: 11, color: "#888", marginBottom: 16 },
  };

  // ─────────────────────────────────────────────────────────
  // RENDER STEP: TIPO
  // ─────────────────────────────────────────────────────────
  if (step === "tipo") {
    return (
      <div style={s.root}>
        <div style={s.topbar}>
          <button style={s.backBtn} onClick={onClose}>←</button>
          <div style={s.topTitle}>MASTRO CAD — {vanoNome || "Nuovo disegno"}</div>
        </div>
        <div style={s.scroll}>
          <div style={s.sectionTitle}>Tipo di serramento</div>
          <div style={s.sectionSub}>Scegli il tipo per vedere le configurazioni disponibili</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {TIPI_SERRAMENTO.map(tipo => (
              <button key={tipo.id} onClick={() => selezionaTipo(tipo)} style={{
                background: "#fff", border: `1.5px solid #e0ddd6`, borderRadius: 14,
                padding: "18px 14px", display: "flex", flexDirection: "column", alignItems: "center",
                gap: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "center",
                transition: "all 0.15s",
              }}
              onTouchStart={e => { (e.currentTarget as any).style.borderColor = tipo.coloriTema; (e.currentTarget as any).style.background = tipo.coloriTema + "12"; }}
              onTouchEnd={e => { (e.currentTarget as any).style.borderColor = "#e0ddd6"; (e.currentTarget as any).style.background = "#fff"; }}
              >
                <div style={{ color: tipo.coloriTema, width: 36, height: 36 }}>{tipo.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: TOP }}>{tipo.label}</div>
                <div style={{ fontSize: 10, color: "#888", lineHeight: 1.4 }}>{tipo.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // RENDER STEP: CONFIG (scelta tipologia)
  // ─────────────────────────────────────────────────────────
  if (step === "config" && tipoSel) {
    const tipologieDisp = TIPOLOGIE_DEFAULT.filter(t =>
      tipoSel.tipologieIds.includes(t.id)
    );
    return (
      <div style={s.root}>
        <div style={s.topbar}>
          <button style={s.backBtn} onClick={() => setStep("tipo")}>←</button>
          <div style={s.topTitle}>{tipoSel.label} — Configurazione</div>
        </div>
        <div style={s.scroll}>
          <div style={s.sectionTitle}>Schema aperture</div>
          <div style={s.sectionSub}>Scegli la configurazione — potrai modificarla sul disegno</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            {tipologieDisp.map(tip => (
              <button key={tip.id} onClick={() => selezionaConfig(tip)} style={{
                background: "#fff", border: `1.5px solid #e0ddd6`, borderRadius: 12,
                padding: "14px", display: "flex", flexDirection: "column", alignItems: "center",
                gap: 10, cursor: "pointer", fontFamily: "inherit",
              }}>
                <TipologiaPreview tip={tip} selected={tipologiaSel?.id === tip.id} />
                <div style={{ fontSize: 12, fontWeight: 700, color: TOP }}>{tip.nome}</div>
                <div style={{ fontSize: 10, color: "#888" }}>{tip.cols.length} camp. — {tip.celle.map(c => c.tipo).join(", ")}</div>
              </button>
            ))}
            {/* Tutte le tipologie */}
            {TIPOLOGIE_DEFAULT.filter(t => !tipoSel.tipologieIds.includes(t.id)).map(tip => (
              <button key={tip.id} onClick={() => selezionaConfig(tip)} style={{
                background: "#fafafa", border: `1px dashed #ccc`, borderRadius: 12,
                padding: "14px", display: "flex", flexDirection: "column", alignItems: "center",
                gap: 10, cursor: "pointer", fontFamily: "inherit", opacity: 0.75,
              }}>
                <TipologiaPreview tip={tip} selected={false} />
                <div style={{ fontSize: 11, fontWeight: 600, color: "#666" }}>{tip.nome}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // RENDER STEP: MISURE
  // ─────────────────────────────────────────────────────────
  if (step === "misure") {
    const isW = npTarget === "W";
    const labelTarget = isW ? "Larghezza (mm)" : "Altezza (mm)";
    const otherVal = isW ? H : W;
    const otherLabel = isW ? "Altezza" : "Larghezza";

    return (
      <div style={s.root}>
        <div style={s.topbar}>
          <button style={s.backBtn} onClick={() => setStep("config")}>←</button>
          <div style={s.topTitle}>{tipologiaSel?.nome || "Misure"}</div>
        </div>

        {/* Anteprima schema */}
        <div style={{ padding: "16px 16px 0", display: "flex", gap: 12, alignItems: "center" }}>
          {tipologiaSel && <TipologiaPreview tip={tipologiaSel} selected={false} />}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: TOP, marginBottom: 4 }}>
              {tipologiaSel?.nome}
            </div>
            {otherVal > 0 && (
              <div style={{ fontSize: 11, color: "#888" }}>
                {otherLabel}: <b style={{ color: AMB }}>{otherVal} mm</b>
              </div>
            )}
          </div>
        </div>

        {/* Numpad */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 16, gap: 12 }}>
          {/* Label target */}
          <div style={{ fontSize: 12, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: 0.6 }}>
            {labelTarget}
          </div>

          {/* Display valore */}
          <div style={{
            padding: "16px 20px", borderRadius: 12, background: "#fff",
            border: `2px solid ${AMB}`, fontSize: 36, fontWeight: 800,
            fontFamily: "JetBrains Mono, monospace", textAlign: "right",
            color: TOP, letterSpacing: 2,
          }}>
            {npVal || "—"} {npVal ? <span style={{ fontSize: 16, color: "#999", fontWeight: 400 }}>mm</span> : ""}
          </div>

          {/* Shortcuts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
            {["600","900","1200","1800"].map(v => (
              <button key={v} onClick={() => setNpVal(v)} style={{
                padding: "11px 4px", borderRadius: 9, border: `1px solid ${npVal===v?AMB:"#ddd"}`,
                background: npVal===v ? AMB : "#fff", color: npVal===v ? "#fff" : "#444",
                fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "monospace",
              }}>{v}</button>
            ))}
          </div>

          {/* Fine regolazione */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 5 }}>
            {[[-50,"−50"],[-10,"−10"],[+10,"+10"],[+50,"+50"]].map(([d, l]) => (
              <button key={l as string} onClick={() => npQuick(d as number)} style={{
                padding: "9px 4px", borderRadius: 8, border: `1px solid ${GRN}40`,
                background: `${GRN}10`, color: GRN, fontSize: 12, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>{l}</button>
            ))}
          </div>

          {/* Tastiera numerica */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, flex: 1 }}>
            {["7","8","9","4","5","6","1","2","3","0","⌫","OK"].map(k => (
              <button key={k} onClick={() => npKey(k)} style={{
                borderRadius: 10, border: `1px solid ${k==="OK"?GRN:k==="⌫"?RED:"#ddd"}`,
                background: k==="OK"?GRN:k==="⌫"?RED:"#fff",
                color: k==="OK"||k==="⌫"?"#fff":TOP,
                fontSize: k==="OK"||k==="⌫"?13:24, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center",
                minHeight: 56, touchAction: "manipulation",
              }}>{k}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // RENDER STEP: CANVAS (disegno generato)
  // ─────────────────────────────────────────────────────────
  if (step === "canvas" && cadConfig) {
    return (
      <div style={s.root}>
        {/* TOPBAR */}
        <div style={s.topbar}>
          <button style={s.backBtn} onClick={() => setStep("misure")}>←</button>
          <div style={s.topTitle}>
            {cadConfig.tipologia.nome}
            <span style={{ fontSize: 11, color: "#555", marginLeft: 8, fontWeight: 400 }}>
              {cadConfig.W} × {cadConfig.H} mm
            </span>
          </div>
          <button style={s.saveBtn} onClick={handleSalva}>Salva</button>
        </div>

        {/* PANEL TAB */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e0ddd6", display: "flex", gap: 0, flexShrink: 0, overflowX: "auto" as const }}>
          {[
            { id: "tipologia", label: "Schema" },
            { id: "profilo", label: "Profilo" },
            { id: "montanti", label: "Divisori" },
            { id: "quote", label: "Quote" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setPanelTab(tab.id as any)} style={{
              padding: "10px 16px", fontSize: 12, fontWeight: panelTab===tab.id?700:500,
              border: "none", background: "none", cursor: "pointer", fontFamily: "inherit",
              color: panelTab===tab.id?AMB:"#888", whiteSpace: "nowrap",
              borderBottom: panelTab===tab.id?`2px solid ${AMB}`:"2px solid transparent",
            }}>{tab.label}</button>
          ))}
        </div>

        {/* PANEL CONTENT */}
        <CanvasPanel
          tab={panelTab}
          config={cadConfig}
          onChange={handleConfigChange}
          tipologieSel={tipoSel}
          montInputMm={montInputMm}
          setMontInputMm={setMontInputMm}
          travInputMm={travInputMm}
          setTravInputMm={setTravInputMm}
          onChangeTipologia={(tip) => {
            handleConfigChange({ ...cadConfig, tipologia: tip });
          }}
        />

        {/* CANVAS ENGINE */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <MastroCadEngine
            config={cadConfig}
            onChange={handleConfigChange}
            height={undefined}
          />
        </div>
      </div>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// CANVAS PANEL — pannello di editing sopra il canvas
// ═══════════════════════════════════════════════════════════════
function CanvasPanel({
  tab, config, onChange, tipologieSel,
  montInputMm, setMontInputMm,
  travInputMm, setTravInputMm,
  onChangeTipologia,
}: any) {
  const AMBl = AMB;
  const style = {
    panel: { background: "#fff", padding: "10px 14px", borderBottom: "1px solid #e0ddd6", maxHeight: 180, overflow: "auto" as const, flexShrink: 0 },
    label: { fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase" as const, letterSpacing: 0.6, marginBottom: 6 },
    row: { display: "flex", gap: 6, alignItems: "center", marginBottom: 8 },
    chip: (sel: boolean, col = AMB) => ({
      padding: "6px 10px", borderRadius: 8, border: `1px solid ${sel ? col : "#ddd"}`,
      background: sel ? col + "18" : "#fafafa", color: sel ? col : "#666",
      fontSize: 11, fontWeight: sel ? 700 : 500, cursor: "pointer", fontFamily: "inherit",
    }),
  };

  if (tab === "tipologia") {
    const tipologieDisp = TIPOLOGIE_DEFAULT;
    return (
      <div style={style.panel}>
        <div style={style.label}>Schema aperture</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tipologieDisp.map(tip => (
            <button key={tip.id} onClick={() => onChangeTipologia(tip)} style={{
              ...style.chip(config.tipologia.id === tip.id),
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 10px",
            }}>
              <TipologiaPreview tip={tip} selected={config.tipologia.id === tip.id} />
              <span style={{ fontSize: 9 }}>{tip.nome}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (tab === "profilo") {
    const sistemi = ["Alluminio", "PVC", "Legno", "Ferro"];
    const spessori = [60, 70, 80, 90];
    const curSist = config.profili?.telaio?.sistema || "Generico";
    const curSp = config.profili?.telaio?.larghezza || 60;
    return (
      <div style={style.panel}>
        <div style={style.label}>Sistema</div>
        <div style={{ ...style.row, marginBottom: 12 }}>
          {sistemi.map(s => (
            <button key={s} onClick={() => {
              const newP = { ...config.profili, telaio: { ...config.profili.telaio, sistema: s } };
              onChange({ ...config, profili: newP });
            }} style={style.chip(curSist === s)}>{s}</button>
          ))}
        </div>
        <div style={style.label}>Spessore telaio</div>
        <div style={style.row}>
          {spessori.map(sp => (
            <button key={sp} onClick={() => {
              const newP = {
                ...config.profili,
                telaio: { ...config.profili.telaio, larghezza: sp },
                anta: { ...config.profili.anta, larghezza: sp - 10 },
                montante: { ...config.profili.montante, larghezza: sp },
              };
              onChange({ ...config, profili: newP });
            }} style={style.chip(curSp === sp)}>{sp}mm</button>
          ))}
        </div>
        <div style={style.row}>
          <label style={{ ...style.chip(config.cassonetto), cursor: "pointer" }}
            onClick={() => onChange({ ...config, cassonetto: !config.cassonetto })}>
            Cassonetto {config.cassonetto ? "ON" : "OFF"}
          </label>
          {config.cassonetto && (
            <div style={{ display: "flex", gap: 6 }}>
              {[150, 180, 220, 250].map(h => (
                <button key={h} onClick={() => onChange({ ...config, cassH: h })}
                  style={style.chip((config.cassH || 180) === h)}>{h}mm</button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (tab === "montanti") {
    return (
      <div style={style.panel}>
        <div style={{ display: "flex", gap: 16 }}>
          {/* Montanti */}
          <div style={{ flex: 1 }}>
            <div style={style.label}>Montante (mm dal bordo sx)</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input
                type="number" inputMode="numeric"
                value={montInputMm} onChange={e => setMontInputMm(e.target.value)}
                placeholder="es. 900"
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, fontFamily: "monospace" }}
              />
              <button onClick={() => {
                const mm = parseInt(montInputMm, 10);
                if (mm > 0 && mm < config.W) {
                  const newM = [...(config.montanti || []), mm].sort((a, b) => a - b);
                  onChange({ ...config, montanti: newM });
                  setMontInputMm("");
                }
              }} style={{ padding: "8px 14px", borderRadius: 8, background: AMB, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                + Mont.
              </button>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(config.montanti || []).map((mm: number, i: number) => (
                <button key={i} onClick={() => {
                  const newM = config.montanti.filter((_: any, j: number) => j !== i);
                  onChange({ ...config, montanti: newM });
                }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${AMB}`, background: `${AMB}15`, color: AMB, fontSize: 11, cursor: "pointer" }}>
                  {mm}mm ×
                </button>
              ))}
              {(config.montanti || []).length === 0 && <span style={{ fontSize: 11, color: "#aaa" }}>Nessun montante</span>}
            </div>
          </div>
          {/* Traversi */}
          <div style={{ flex: 1 }}>
            <div style={style.label}>Traverso (mm dall'alto)</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input
                type="number" inputMode="numeric"
                value={travInputMm} onChange={e => setTravInputMm(e.target.value)}
                placeholder="es. 400"
                style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, fontFamily: "monospace" }}
              />
              <button onClick={() => {
                const mm = parseInt(travInputMm, 10);
                if (mm > 0 && mm < config.H) {
                  const newT = [...(config.traversi || []), { mm }].sort((a: any, b: any) => a.mm - b.mm);
                  onChange({ ...config, traversi: newT });
                  setTravInputMm("");
                }
              }} style={{ padding: "8px 14px", borderRadius: 8, background: BLU, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>
                + Trav.
              </button>
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {(config.traversi || []).map((t: any, i: number) => (
                <button key={i} onClick={() => {
                  const newT = config.traversi.filter((_: any, j: number) => j !== i);
                  onChange({ ...config, traversi: newT });
                }} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${BLU}`, background: `${BLU}15`, color: BLU, fontSize: 11, cursor: "pointer" }}>
                  {t.mm}mm ×
                </button>
              ))}
              {(config.traversi || []).length === 0 && <span style={{ fontSize: 11, color: "#aaa" }}>Nessun traverso</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tab === "quote") {
    return (
      <div style={style.panel}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={() => onChange({ ...config, showQuote: !config.showQuote })}
            style={style.chip(!!config.showQuote, GRN)}>
            Quote {config.showQuote ? "ON" : "OFF"}
          </button>
          <button onClick={() => {
            const fq = config.fuoriSquadro;
            onChange({ ...config, fuoriSquadro: { ...fq, abilitato: !fq?.abilitato } });
          }} style={style.chip(!!config.fuoriSquadro?.abilitato, AMB)}>
            Fuorisquadro {config.fuoriSquadro?.abilitato ? "ON" : "OFF"}
          </button>
          {/* Misure W e H editabili */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#888" }}>L:</span>
            <input
              type="number" inputMode="numeric"
              value={config.W} onChange={e => onChange({ ...config, W: parseInt(e.target.value, 10) || config.W })}
              style={{ width: 70, padding: "5px 8px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13, fontFamily: "monospace" }}
            />
            <span style={{ fontSize: 11, color: "#888" }}>H:</span>
            <input
              type="number" inputMode="numeric"
              value={config.H} onChange={e => onChange({ ...config, H: parseInt(e.target.value, 10) || config.H })}
              style={{ width: 70, padding: "5px 8px", borderRadius: 7, border: "1px solid #ddd", fontSize: 13, fontFamily: "monospace" }}
            />
            <span style={{ fontSize: 10, color: "#aaa" }}>mm</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
