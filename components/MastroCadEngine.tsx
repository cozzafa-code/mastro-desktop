"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════════
// MASTRO CAD ENGINE — Componente React con Fabric.js
// Motore disegno tecnico parametrico per serramenti
// Tablet-first, touch nativo, profili reali, quote automatiche
// ═══════════════════════════════════════════════════════════════
import React, {
  useEffect, useRef, useState, useCallback, useMemo
} from "react";

// ── TIPI ────────────────────────────────────────────────────
export interface Profilo {
  id: string;
  nome: string;
  sistema: string;
  tipo: "telaio" | "anta" | "montante" | "traverso" | "soglia";
  larghezza: number;
  profondita: number;
  ala_sx?: number;
  ala_dx?: number;
  battuta_vetro: number;
  color: string;
}

export interface Cella {
  tipo: "fisso" | "anta" | "portafinestra" | "scorrevole" | "alzante" | "vasistas" | "vuoto";
  verso: "sx" | "dx";
}

export interface Tipologia {
  id: string;
  nome: string;
  cols: number[];        // percentuali larghezza colonne
  righe: number[][];     // righe[ci] = array percentuali altezze
  celle: Cella[];
}

// Tipi nodo ammicciatura
export type TipoNodo = "croce" | "T-mont" | "T-trav" | "passante-mont" | "passante-trav" | "coprigiunto" | "L";

export interface NodoConfig {
  tipo: TipoNodo;
  // Angolo taglio in gradi (default 45)
  angolo?: number;
}

// Traverso parziale — può attraversare solo alcune colonne
export interface TraversoConfig {
  mm: number;           // posizione mm dall'alto
  colonneDa?: number;   // indice colonna inizio (default: tutto)
  colonneA?: number;    // indice colonna fine (default: tutto)
}

// Fuorisquadro — 4 punti angolo del telaio
export interface FuoriSquadro {
  abilitato: boolean;
  tlX: number; tlY: number;  // top-left delta mm
  trX: number; trY: number;  // top-right delta mm
  blX: number; blY: number;  // bottom-left delta mm
  brX: number; brY: number;  // bottom-right delta mm
}

export interface CadConfig {
  W: number;
  H: number;
  tipologia: Tipologia;
  montanti: number[];          // posizioni mm dal bordo sx
  traversi: TraversoConfig[];  // traversi parziali configurabili
  // Nodi: chiave "m{mi}-t{ti}" → config nodo
  nodi: Record<string, NodoConfig>;
  profili: {
    telaio: Profilo;
    anta: Profilo;
    montante: Profilo;
    traverso?: Profilo;
  };
  cassonetto?: boolean;
  cassH?: number;
  fuoriSquadro?: FuoriSquadro;
  showQuote?: boolean;
  showSezOrizzontale?: boolean;
}

export interface MastroCadEngineProps {
  config: CadConfig;
  onChange?: (config: CadConfig) => void;
  readonly?: boolean;
  height?: number;
}

// ── DATABASE PROFILI DEFAULT ─────────────────────────────────
export const PROFILI_DEFAULT: Profilo[] = [
  {
    id: "gen-telaio-60",
    nome: "Generico 60mm",
    sistema: "Generico",
    tipo: "telaio",
    larghezza: 60, profondita: 80,
    ala_sx: 20, ala_dx: 20,
    battuta_vetro: 14,
    color: "#3a5a7a"
  },
  {
    id: "gen-anta-50",
    nome: "Anta 50mm",
    sistema: "Generico",
    tipo: "anta",
    larghezza: 50, profondita: 70,
    battuta_vetro: 12,
    color: "#2c4060"
  },
  {
    id: "gen-mont-60",
    nome: "Montante 60mm",
    sistema: "Generico",
    tipo: "montante",
    larghezza: 60, profondita: 80,
    battuta_vetro: 14,
    color: "#3a5a7a"
  },
  {
    id: "schuco-aws75",
    nome: "Schüco AWS 75",
    sistema: "Schüco",
    tipo: "telaio",
    larghezza: 75, profondita: 90,
    ala_sx: 22, ala_dx: 22,
    battuta_vetro: 16,
    color: "#1a3a5a"
  },
  {
    id: "reynaers-cs68",
    nome: "Reynaers CS68",
    sistema: "Reynaers",
    tipo: "telaio",
    larghezza: 68, profondita: 82,
    battuta_vetro: 15,
    color: "#2a4a6a"
  },
];

// ── TIPOLOGIE DEFAULT ────────────────────────────────────────
export const TIPOLOGIE_DEFAULT: Tipologia[] = [
  {
    id: "F2A", nome: "2 ante battenti",
    cols: [50, 50], righe: [[100], [100]],
    celle: [{ tipo: "anta", verso: "sx" }, { tipo: "anta", verso: "dx" }]
  },
  {
    id: "F1A_DX", nome: "1 anta destra",
    cols: [100], righe: [[100]],
    celle: [{ tipo: "anta", verso: "dx" }]
  },
  {
    id: "F3A", nome: "3 ante",
    cols: [33, 34, 33], righe: [[100], [100], [100]],
    celle: [{ tipo: "fisso" }, { tipo: "anta", verso: "sx" }, { tipo: "anta", verso: "dx" }]
  },
  {
    id: "SOPRALUCE", nome: "2A + sopraluce",
    cols: [50, 50], righe: [[28, 72], [28, 72]],
    celle: [
      { tipo: "fisso" }, { tipo: "fisso" },
      { tipo: "anta", verso: "sx" }, { tipo: "anta", verso: "dx" }
    ]
  },
  {
    id: "SC2", nome: "Scorrevole 2",
    cols: [50, 50], righe: [[100], [100]],
    celle: [{ tipo: "scorrevole", verso: "dx" }, { tipo: "fisso" }]
  },
  {
    id: "PF2", nome: "Portafinestra 2a",
    cols: [50, 50], righe: [[100], [100]],
    celle: [{ tipo: "portafinestra", verso: "sx" }, { tipo: "portafinestra", verso: "dx" }]
  },
  {
    id: "VETRINA5", nome: "Vetrina 5 camp.",
    cols: [20, 20, 20, 20, 20],
    righe: [[100], [100], [100], [100], [100]],
    celle: [
      { tipo: "fisso" }, { tipo: "anta", verso: "sx" },
      { tipo: "scorrevole", verso: "dx" },
      { tipo: "anta", verso: "dx" }, { tipo: "fisso" }
    ]
  },
  {
    id: "PORTA_VET", nome: "Porta + Vetrina",
    cols: [25, 25, 25, 25],
    righe: [[100], [100], [100], [100]],
    celle: [
      { tipo: "fisso" }, { tipo: "portafinestra", verso: "sx" },
      { tipo: "portafinestra", verso: "dx" }, { tipo: "fisso" }
    ]
  },
];

// ── CONFIG DEFAULT ───────────────────────────────────────────
export const defaultCadConfig = (): CadConfig => ({
  W: 1800, H: 1500,
  tipologia: TIPOLOGIE_DEFAULT[0],
  montanti: [],
  traversi: [],
  nodi: {},
  profili: {
    telaio: PROFILI_DEFAULT[0],
    anta: PROFILI_DEFAULT[1],
    montante: PROFILI_DEFAULT[2],
  },
  cassonetto: false,
  cassH: 180,
  fuoriSquadro: { abilitato: false, tlX:0,tlY:0,trX:0,trY:0,blX:0,blY:0,brX:0,brY:0 },
  showQuote: true,
  showSezOrizzontale: false,
});

// Helper: ottieni config nodo con default
export function getNodo(nodi: Record<string,NodoConfig>, mi: number, ti: number): NodoConfig {
  return nodi[`m${mi}-t${ti}`] || { tipo: "croce" };
}

// ══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ══════════════════════════════════════════════════════════════
export default function MastroCadEngine({
  config,
  onChange,
  readonly = false,
  height = 520,
}: MastroCadEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const toolRef = useRef<string>("sel");
  const configRef = useRef<CadConfig>(config);
  const [tool, setTool] = useState<string>("sel");
  const [vista, setVista] = useState<string>("prospetto");
  const [selData, setSelData] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [rightTab, setRightTab] = useState<"profili" | "tipologie">("tipologie");
  const [showNodoPanel, setShowNodoPanel] = useState(false);
  const [showCellaPanel, setShowCellaPanel] = useState(false);

  const SCALE = 0.2; // mm → px nel canvas

  // ── Carica Fabric.js dinamicamente ──────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).fabric) { setIsLoaded(true); return; }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error("Fabric.js non caricato");
    document.head.appendChild(script);
  }, []);

  // ── Init canvas ──────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded || !canvasRef.current || fabricRef.current) return;
    const fabric = (window as any).fabric;
    const container = containerRef.current;
    if (!container) return;

    const cW = container.clientWidth;
    const cH = container.clientHeight;

    const canvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#1e2028",
      selection: !readonly,
      preserveObjectStacking: true,
      width: cW,
      height: cH,
    });

    fabricRef.current = canvas;

    // Mouse move → coordinate
    canvas.on("mouse:move", (e: any) => {
      const p = canvas.getPointer(e.e);
      updateStatus(p.x / SCALE, p.y / SCALE);
    });

    // Click → aggiungi elementi
    canvas.on("mouse:down", (e: any) => {
      if (readonly) return;
      const p = canvas.getPointer(e.e);
      handleCanvasClick(p.x / SCALE, p.y / SCALE);
    });

    // Selezione
    canvas.on("selection:created", (e: any) => {
      const obj = e.selected?.[0];
      const data = obj?.get?.("cadData");
      if (data) {
        setSelData(data);
        if (data.tipo === "nodo" && !readonly) {
          setShowNodoPanel(true);
          setShowCellaPanel(false);
        } else if (data.tipo === "cella" && !readonly) {
          setShowCellaPanel(true);
          setShowNodoPanel(false);
        }
      }
    });
    canvas.on("selection:cleared", () => { setSelData(null); setShowCellaPanel(false); });

    // Zoom con rotella
    canvas.on("mouse:wheel", (e: any) => {
      const delta = e.e.deltaY;
      let z = canvas.getZoom() * (0.999 ** delta);
      z = Math.max(0.05, Math.min(15, z));
      canvas.zoomToPoint({ x: e.e.offsetX, y: e.e.offsetY }, z);
      setZoomLevel(z);
      e.e.preventDefault();
      e.e.stopPropagation();
    });

    // Touch pan
    let lastTouch: any = null;
    canvas.on("touch:drag", (e: any) => {
      if (e.e.touches?.length === 2) {
        const touch = e.e.touches;
        if (lastTouch) {
          const dx = ((touch[0].clientX + touch[1].clientX) / 2) -
            ((lastTouch[0].clientX + lastTouch[1].clientX) / 2);
          const dy = ((touch[0].clientY + touch[1].clientY) / 2) -
            ((lastTouch[0].clientY + lastTouch[1].clientY) / 2);
          const vpt = canvas.viewportTransform!.slice();
          vpt[4] += dx; vpt[5] += dy;
          canvas.setViewportTransform(vpt);
        }
        lastTouch = touch;
      }
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [isLoaded]);

  // ── Ridisegna quando config cambia ──────────────────────────
  useEffect(() => {
    if (!fabricRef.current || !isLoaded) return;
    drawAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.W, config.H, config.tipologia, config.montanti, config.traversi, config.nodi, config.fuoriSquadro, config.cassonetto, config.cassH, config.showQuote, isLoaded, vista]);

  // ── Resize ──────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      if (!fabricRef.current || !containerRef.current) return;
      fabricRef.current.setWidth(containerRef.current.clientWidth);
      fabricRef.current.setHeight(containerRef.current.clientHeight);
      fitScreen();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isLoaded]);

  // ════════════════════════════════════════════════════════════
  // MOTORE DISEGNO
  // ════════════════════════════════════════════════════════════
  const drawAll = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const fabric = (window as any).fabric;
    if (!fabric) return;

    canvas.clear();
    canvas.backgroundColor = "#1e2028";

    const { W, H, tipologia: tip, montanti, traversi, profili, cassonetto, cassH, showQuote } = configRef.current;
    const TF = profili.telaio.larghezza;
    const TA = profili.anta.larghezza;
    const TM = profili.montante.larghezza;
    const TT = 52; // traverso fisso per ora

    const ox = 65; // offset px
    const cassHpx = cassonetto ? (cassH || 180) * SCALE : 0;
    const oy = 50 + cassHpx;

    // ── GRIGLIA ──
    drawGrid(canvas, fabric, ox, oy, W, H);

    // ── CASSONETTO ──
    if (cassonetto && cassHpx > 0) {
      drawCassonetto(canvas, fabric, ox, 50, W * SCALE, cassHpx);
    }

    // ── TELAIO (con eventuale fuorisquadro) ──
    const fq = configRef.current.fuoriSquadro;
    if (fq?.abilitato) {
      drawTelaioFuoriSquadro(canvas, fabric, ox, oy, W * SCALE, H * SCALE, TF * SCALE, profili.telaio.color, fq);
      // ── DRAG HANDLES FUORISQUADRO ──
      if (onChange) {
        const s = SCALE;
        const handles = [
          { key: "tl", cx: ox + fq.tlX*s,       cy: oy + fq.tlY*s,       label: "TL" },
          { key: "tr", cx: ox + W*s + fq.trX*s,  cy: oy + fq.trY*s,       label: "TR" },
          { key: "bl", cx: ox + fq.blX*s,        cy: oy + H*s + fq.blY*s, label: "BL" },
          { key: "br", cx: ox + W*s + fq.brX*s,  cy: oy + H*s + fq.brY*s, label: "BR" },
        ];
        handles.forEach(({ key, cx, cy, label }) => {
          // Cerchio handle
          const circle = new fabric.Circle({
            left: cx - 8, top: cy - 8,
            radius: 8,
            fill: "#D0800840", stroke: "#D08008", strokeWidth: 2,
            selectable: true, evented: true,
            hoverCursor: "grab", moveCursor: "grabbing",
            hasBorders: false, hasControls: false,
            lockScalingX: true, lockScalingY: true, lockRotation: true,
          });
          circle.set("fqKey", key);
          circle.set("fqOxPx", ox);
          circle.set("fqOyPx", oy);
          circle.set("fqW", W);
          circle.set("fqH", H);

          // Label angolo
          const txt = new fabric.Text(label, {
            left: cx - 6, top: cy - 6,
            fontSize: 7, fill: "#D08008", fontFamily: "monospace",
            selectable: false, evented: false, originX: "center", originY: "center",
          });

          canvas.add(circle);
          canvas.add(txt);

          // Drag: object:modified aggiornamento fq
          circle.on("modified", () => {
            const newCx = (circle.left || 0) + 8;
            const newCy = (circle.top || 0) + 8;
            const fqCopy = { ...(config.fuoriSquadro as FuoriSquadro) };
            if (key === "tl") { fqCopy.tlX = Math.round((newCx - ox) / s); fqCopy.tlY = Math.round((newCy - oy) / s); }
            else if (key === "tr") { fqCopy.trX = Math.round((newCx - (ox + W*s)) / s); fqCopy.trY = Math.round((newCy - oy) / s); }
            else if (key === "bl") { fqCopy.blX = Math.round((newCx - ox) / s); fqCopy.blY = Math.round((newCy - (oy + H*s)) / s); }
            else if (key === "br") { fqCopy.brX = Math.round((newCx - (ox + W*s)) / s); fqCopy.brY = Math.round((newCy - (oy + H*s)) / s); }
            onChange({ ...configRef.current, fuoriSquadro: fqCopy });
          });
        });
      }
    } else {
      drawTelaio(canvas, fabric, ox, oy, W * SCALE, H * SCALE, TF * SCALE, profili.telaio.color);
    }

    // ── MONTANTI ──
    montanti.forEach((mm, mi) => {
      const x = ox + mm * SCALE;
      drawMontante(canvas, fabric, x, oy + TF * SCALE, H * SCALE - TF * SCALE * 2, TM * SCALE, mi, mm);
    });

    // ── TRAVERSI PARZIALI ──
    const montsX = montanti.map(m => ox + m * SCALE);
    const travsY = traversi.map(t => oy + t.mm * SCALE);

    traversi.forEach((trav, ti) => {
      const y = oy + trav.mm * SCALE;
      // Calcola range colonne
      const colDa = trav.colonneDa ?? 0;
      const colA = trav.colonneA ?? (tip.cols.length - 1);
      // X1 e X2 del traverso basati sulle colonne
      const availW2 = W - TF * 2 - TM * (tip.cols.length - 1);
      const totalW2 = tip.cols.reduce((s:number,c:number)=>s+c,0);
      let curX2 = TF;
      const colXs: {x1:number,x2:number}[] = [];
      tip.cols.forEach((cw:number) => {
        const colW = (cw/totalW2)*availW2;
        colXs.push({x1:curX2, x2:curX2+colW});
        curX2 += colW + TM;
      });
      const tx1 = ox + (colXs[colDa]?.x1 ?? TF) * SCALE;
      const tx2 = ox + (colXs[colA]?.x2 ?? (W-TF)) * SCALE;
      const travW = tx2 - tx1;

      // Filtra montanti che cadono nel range del traverso
      const montsInRange = montanti.filter((mm2,mi) => {
        const mx = ox + mm2 * SCALE;
        return mx >= tx1 && mx <= tx2;
      });
      const montsXInRange = montsInRange.map(m => ox + m * SCALE);
      const montsIdxInRange = montanti.map((m,mi)=>({m,mi})).filter(({m})=>{
        const mx = ox + m * SCALE;
        return mx >= tx1 && mx <= tx2;
      });

      drawTraverso(canvas, fabric, tx1, y, travW, TT * SCALE, ti, trav.mm, montsXInRange, TM * SCALE, montsIdxInRange, config.nodi);
    });

    // ── NODI (cerchi visivi alle intersezioni) ──
    montanti.forEach((mm, mi) => {
      traversi.forEach((trav, ti) => {
        const mx = ox + mm * SCALE;
        const ty = oy + trav.mm * SCALE;
        const nodo = getNodo(config.nodi, mi, ti);
        drawNodoIndicator(canvas, fabric, mx, ty, TM * SCALE, TT * SCALE, nodo, mi, ti);
      });
    });

    // ── CAMPITURE ──
    const celle = calcolaCelle(ox, oy, W, H, TF, TA, TM, TT, tip);
    celle.forEach(c => drawCampitura(canvas, fabric, c));

    // ── QUOTE ──
    if (showQuote !== false) {
      drawQuote(canvas, fabric, ox, oy, W, H, TF, TA, TM, TT, tip, montanti, traversi);
    }

    // ── SEZIONE ORIZZONTALE ──
    if (vista === "sez-h" || vista === "sez-v") {
      drawSezioneOrizzontale(canvas, fabric, ox, oy + H * SCALE + 50, W, TF, TA, TM, tip);
    }
    if (vista === "sez-v") {
      drawSezioneVerticale(canvas, fabric, ox, oy, W, H, TF, TA, 52, tip);
    }

    canvas.renderAll();
    fitScreen();

    // Aggiorna badge
    const nCelle = celle.length;
  }, [config, vista]);

  // ── GRIGLIA ─────────────────────────────────────────────────
  function drawGrid(canvas: any, fabric: any, ox: number, oy: number, W: number, H: number) {
    const step = 100 * SCALE;
    for (let x = 0; x <= W * SCALE; x += step) {
      canvas.add(new fabric.Line([ox + x, oy - 10, ox + x, oy + H * SCALE + 10], {
        stroke: "#252530", strokeWidth: 0.4, selectable: false, evented: false
      }));
    }
    for (let y = 0; y <= H * SCALE; y += step) {
      canvas.add(new fabric.Line([ox - 10, oy + y, ox + W * SCALE + 10, oy + y], {
        stroke: "#252530", strokeWidth: 0.4, selectable: false, evented: false
      }));
    }
  }

  // ── CASSONETTO ──────────────────────────────────────────────
  function drawCassonetto(canvas: any, fabric: any, ox: number, oy: number, W: number, cH: number) {
    const c45 = Math.min(cH * 0.4, 10);
    const pts = ptsToFabric([
      ox + c45, oy, ox + W - c45, oy,
      ox + W, oy + c45, ox + W, oy + cH - c45,
      ox + W - c45, oy + cH, ox + c45, oy + cH,
      ox, oy + cH - c45, ox, oy + c45
    ]);
    canvas.add(new fabric.Polygon(pts, {
      fill: createHatchPattern("#3a5070"),
      stroke: "#6a8aaa", strokeWidth: 1.5,
      selectable: false, evented: false
    }));
    canvas.add(new fabric.Text("CASSONETTO / TAPPARELLA", {
      left: ox + W / 2, top: oy + cH / 2,
      fontSize: 10, fill: "#D08008", fontFamily: "system-ui",
      fontWeight: "bold", originX: "center", originY: "center",
      selectable: false, evented: false
    }));
  }

  // ── TELAIO ESTERNO ──────────────────────────────────────────
  function drawTelaio(canvas: any, fabric: any, ox: number, oy: number, W: number, H: number, TF: number, color: string) {
    const c = TF * 0.65;

    // Barra top
    addBarra(canvas, fabric, [
      ox, oy, ox + W, oy, ox + W, oy + TF - c * 0.3,
      ox + W - c * 0.7, oy + TF, ox + c * 0.7, oy + TF, ox, oy + TF - c * 0.3
    ]);
    // Barra bottom
    addBarra(canvas, fabric, [
      ox + c * 0.7, oy + H - TF, ox + W - c * 0.7, oy + H - TF,
      ox + W, oy + H - TF + c * 0.3, ox + W, oy + H,
      ox, oy + H, ox, oy + H - TF + c * 0.3
    ]);
    // Barra sx
    addBarra(canvas, fabric, [
      ox, oy + TF - c * 0.3, ox + TF - c * 0.3, oy + TF,
      ox + TF, oy + TF + c * 0.3, ox + TF, oy + H - TF - c * 0.3,
      ox + TF - c * 0.3, oy + H - TF, ox, oy + H - TF + c * 0.3
    ]);
    // Barra dx
    addBarra(canvas, fabric, [
      ox + W - TF, oy + TF + c * 0.3, ox + W, oy + TF - c * 0.3,
      ox + W, oy + H - TF + c * 0.3, ox + W - TF, oy + H - TF - c * 0.3,
      ox + W - TF + c * 0.3, oy + H - TF, ox + W - TF, oy + H - TF,
      ox + W - TF + c * 0.3, oy + TF, ox + W - TF, oy + TF + c * 0.3
    ]);

    // Outline esterno
    canvas.add(new fabric.Rect({
      left: ox, top: oy, width: W, height: H,
      fill: "transparent", stroke: "#c8d8e8", strokeWidth: 2,
      selectable: false, evented: false
    }));
  }

  function addBarra(canvas: any, fabric: any, coords: number[]) {
    const pts = ptsToFabric(coords);
    canvas.add(new fabric.Polygon(pts, {
      fill: createHatchPattern("#4a6a8a"),
      stroke: "#8aaabb", strokeWidth: 0.8,
      selectable: false, evented: false
    }));
    canvas.add(new fabric.Polygon(pts, {
      fill: "transparent", stroke: "#c0d0e0", strokeWidth: 0.8,
      selectable: false, evented: false
    }));
  }

  // ── TELAIO FUORISQUADRO ─────────────────────────────────────
  function drawTelaioFuoriSquadro(canvas: any, fabric: any, ox: number, oy: number, W: number, H: number, TF: number, color: string, fq: FuoriSquadro) {
    const s = SCALE;
    // 4 angoli con delta applicati
    const tl = { x: ox + fq.tlX*s, y: oy + fq.tlY*s };
    const tr = { x: ox + W + fq.trX*s, y: oy + fq.trY*s };
    const bl = { x: ox + fq.blX*s, y: oy + H + fq.blY*s };
    const br = { x: ox + W + fq.brX*s, y: oy + H + fq.brY*s };

    // Outline esterno fuorisquadro
    const pts = [tl.x,tl.y, tr.x,tr.y, br.x,br.y, bl.x,bl.y];
    canvas.add(new fabric.Polygon(ptsToFabric(pts), {
      fill: "transparent", stroke: "#c8d8e8", strokeWidth: 2.5,
      selectable: false, evented: false
    }));

    // Barre telaio (approssimate come trapezi)
    // Top
    addBarra(canvas, fabric, [tl.x,tl.y, tr.x,tr.y, tr.x+TF*0.3,tr.y+TF, tl.x+TF*0.3,tl.y+TF]);
    // Bottom
    addBarra(canvas, fabric, [bl.x+TF*0.3,bl.y-TF, br.x-TF*0.3,br.y-TF, br.x,br.y, bl.x,bl.y]);
    // Left
    addBarra(canvas, fabric, [tl.x,tl.y+TF, tl.x+TF,tl.y+TF, bl.x+TF,bl.y-TF, bl.x,bl.y-TF]);
    // Right
    addBarra(canvas, fabric, [tr.x-TF,tr.y+TF, tr.x,tr.y+TF, br.x,br.y-TF, br.x-TF,br.y-TF]);

    // Quote fuorisquadro (delta angoli)
    const dati = [
      { label: `ΔTL ${fq.tlX},${fq.tlY}`, x: tl.x, y: tl.y - 12 },
      { label: `ΔTR ${fq.trX},${fq.trY}`, x: tr.x, y: tr.y - 12 },
      { label: `ΔBL ${fq.blX},${fq.blY}`, x: bl.x, y: bl.y + 14 },
      { label: `ΔBR ${fq.brX},${fq.brY}`, x: br.x, y: br.y + 14 },
    ];
    dati.forEach(d => {
      canvas.add(new fabric.Text(d.label, {
        left: d.x, top: d.y, fontSize: 8, fill: "#D08008",
        fontFamily: "monospace", originX: "center",
        selectable: false, evented: false
      }));
    });
  }

  // ── MONTANTE ────────────────────────────────────────────────
  function drawMontante(canvas: any, fabric: any, cx: number, y1: number, h: number, TM: number, idx: number, mm: number) {
    const c = TM * 0.45;
    const x1 = cx - TM / 2, x2 = cx + TM / 2;
    const pts = ptsToFabric([
      x1 + c, y1, x2 - c, y1, x2, y1 + c, x2, y1 + h - c,
      x2 - c, y1 + h, x1 + c, y1 + h, x1, y1 + h - c, x1, y1 + c
    ]);

    const body = new fabric.Polygon(pts, {
      fill: createHatchPattern("#3a5a7a"),
      stroke: "#a0b8c8", strokeWidth: 1.2,
      selectable: !readonly, evented: !readonly,
      hoverCursor: "pointer",
    });
    body.set("cadData", { tipo: "montante", mm, idx });
    canvas.add(body);

    // Asse tratto-punto
    canvas.add(new fabric.Line([cx, y1, cx, y1 + h], {
      stroke: "#D08008", strokeWidth: 0.8,
      strokeDashArray: [8, 4, 2, 4],
      selectable: false, evented: false, opacity: 0.5
    }));

    // Quota posizione montante
    canvas.add(new fabric.Text(mm + "mm", {
      left: cx, top: y1 - 16,
      fontSize: 9, fill: "#D08008", fontFamily: "monospace",
      originX: "center", selectable: false, evented: false, opacity: 0.8
    }));
  }

  // ── TRAVERSO ────────────────────────────────────────────────
  function drawTraverso(canvas: any, fabric: any, x1: number, cy: number, w: number, TT: number, idx: number, mm: number, montsX: number[], TM: number, montsIdx?: any[], nodi?: Record<string,NodoConfig>) {
    const segs = calcSegmentiNodi(x1, x1 + w, montsX, TM, idx, montsIdx||[], nodi||{});
    const c = TT * 0.45;

    segs.forEach(([sx1, sx2]) => {
      const pts = ptsToFabric([
        sx1 + c, cy - TT / 2, sx2 - c, cy - TT / 2,
        sx2, cy - TT / 2 + c, sx2, cy + TT / 2 - c,
        sx2 - c, cy + TT / 2, sx1 + c, cy + TT / 2,
        sx1, cy + TT / 2 - c, sx1, cy - TT / 2 + c
      ]);
      canvas.add(new fabric.Polygon(pts, {
        fill: createHatchPattern("#3a5a7a"),
        stroke: "#9ab0c0", strokeWidth: 1,
        selectable: false, evented: false
      }));
    });

    // Asse orizzontale
    canvas.add(new fabric.Line([x1, cy, x1 + w, cy], {
      stroke: "#3B7FE0", strokeWidth: 0.8,
      strokeDashArray: [8, 4, 2, 4],
      selectable: false, evented: false, opacity: 0.4
    }));
  }

  function calcSegmenti(x1: number, x2: number, montsX: number[], TM: number): [number, number][] {
    const punti = [x1, ...montsX.flatMap(mx => [mx - TM / 2, mx + TM / 2]), x2];
    punti.sort((a, b) => a - b);
    const segs: [number, number][] = [];
    for (let i = 0; i < punti.length - 1; i += 2) {
      if (punti[i + 1] - punti[i] > 2) segs.push([punti[i], punti[i + 1]]);
    }
    return segs.length > 0 ? segs : [[x1, x2]];
  }

  // Versione nodo-aware: considera il tipo di nodo per decidere se il traverso passa o si interrompe
  function calcSegmentiNodi(x1: number, x2: number, montsX: number[], TM: number, ti: number, montsIdx: any[], nodi: Record<string,NodoConfig>): [number, number][] {
    if (montsX.length === 0) return [[x1, x2]];
    const punti: number[] = [x1];
    montsX.forEach((mx, i) => {
      const mi = montsIdx[i]?.mi ?? i;
      const nodo = nodi[`m${mi}-t${ti}`] || { tipo: "croce" };
      if (nodo.tipo === "passante-trav") {
        // traverso passante: non si interrompe al montante
        // non aggiungere interruzione
      } else {
        // default: traverso si interrompe al montante
        punti.push(mx - TM / 2);
        punti.push(mx + TM / 2);
      }
    });
    punti.push(x2);
    punti.sort((a, b) => a - b);
    const segs: [number, number][] = [];
    for (let i = 0; i < punti.length - 1; i += 2) {
      if (punti[i + 1] - punti[i] > 2) segs.push([punti[i], punti[i + 1]]);
    }
    return segs.length > 0 ? segs : [[x1, x2]];
  }

  // ── INDICATORE NODO (cerchio all'intersezione) ───────────────
  function drawNodoIndicator(canvas: any, fabric: any, mx: number, ty: number, TM: number, TT: number, nodo: NodoConfig, mi: number, ti: number) {
    const hw = TM / 2, hh = TT / 2;
    const col = nodoColor(nodo.tipo);

    // Box nodo
    const box = new fabric.Rect({
      left: mx - hw, top: ty - hh,
      width: TM, height: TT,
      fill: col.fill, stroke: col.stroke, strokeWidth: 1.5,
      selectable: !readonly, evented: !readonly,
      hoverCursor: "pointer",
      rx: 2,
    });
    box.set("cadData", { tipo: "nodo", mi, ti, tipoNodo: nodo.tipo });
    canvas.add(box);

    // Linee diagonali 45° agli angoli
    const c = Math.min(hw, hh) * 0.5;
    const diagPts = [
      [mx-hw, ty-hh, mx-hw+c, ty-hh+c],
      [mx+hw, ty-hh, mx+hw-c, ty-hh+c],
      [mx-hw, ty+hh, mx-hw+c, ty+hh-c],
      [mx+hw, ty+hh, mx+hw-c, ty+hh-c],
    ];
    diagPts.forEach(([x1,y1,x2,y2]) => {
      canvas.add(new fabric.Line([x1,y1,x2,y2], {
        stroke: col.stroke, strokeWidth: 1,
        selectable: false, evented: false
      }));
    });

    // Label tipo nodo
    const labels: Record<string,string> = {
      "croce":"✕","T-mont":"T","T-trav":"T","passante-mont":"║",
      "passante-trav":"═","coprigiunto":"CG","L":"L"
    };
    canvas.add(new fabric.Text(labels[nodo.tipo] || "?", {
      left: mx, top: ty,
      fontSize: 8, fill: col.stroke, fontFamily: "system-ui",
      originX: "center", originY: "center",
      selectable: false, evented: false
    }));
  }

  function nodoColor(tipo: TipoNodo) {
    const map: Record<string,{fill:string,stroke:string}> = {
      "croce":          { fill: "rgba(74,106,138,0.6)",  stroke: "#6a9ab8" },
      "T-mont":         { fill: "rgba(208,128,8,0.2)",   stroke: "#D08008" },
      "T-trav":         { fill: "rgba(208,128,8,0.2)",   stroke: "#D08008" },
      "passante-mont":  { fill: "rgba(26,158,115,0.2)",  stroke: "#1A9E73" },
      "passante-trav":  { fill: "rgba(26,158,115,0.2)",  stroke: "#1A9E73" },
      "coprigiunto":    { fill: "rgba(59,127,224,0.2)",  stroke: "#3B7FE0" },
      "L":              { fill: "rgba(220,68,68,0.15)",  stroke: "#DC4444" },
    };
    return map[tipo] || map["croce"];
  }

  // ── CAMPITURE ───────────────────────────────────────────────
  function calcolaCelle(ox: number, oy: number, W: number, H: number, TF: number, TA: number, TM: number, TT: number, tip: Tipologia) {
    const cols = tip.cols;
    const righeT = tip.righe;
    const totalW = cols.reduce((s, c) => s + c, 0);
    const availW = W - TF * 2 - TM * (cols.length - 1);
    const celle: any[] = [];
    let curX = TF;

    cols.forEach((cw, ci) => {
      const colW = (cw / totalW) * availW;
      const righe = righeT[ci] || [100];
      const totalH = righe.reduce((s, r) => s + r, 0);
      const availH = H - TF * 2 - TT * (righe.length - 1);
      let curY = TF;

      righe.forEach((rh, ri) => {
        const cellH = (rh / totalH) * availH;
        const cellaIdx = cols.slice(0, ci).reduce((s, _, i) => (righeT[i] || [1]).length + s, 0) + ri;
        const conf = tip.celle[cellaIdx] || { tipo: "fisso", verso: "dx" };

        celle.push({
          x: (ox + curX) * SCALE,
          y: (oy + curY) * SCALE,
          w: colW * SCALE,
          h: cellH * SCALE,
          wMm: colW,
          hMm: cellH,
          TA: TA * SCALE,
          ci, ri, cellaIdx,
          ...conf,
        });
        curY += cellH + TT;
      });
      curX += colW + TM;
    });
    return celle;
  }

  function drawCampitura(canvas: any, fabric: any, cell: any) {
    const { x, y, w, h, TA, tipo, verso, wMm, hMm, ci, ri } = cell;
    const c45 = Math.min(TA * 0.7, 8);

    // 4 barre profilo anta con tagli 45°
    const bars = [
      // top
      [x+c45,y, x+w-c45,y, x+w,y+c45, x+w,y+TA-c45, x+w-c45,y+TA, x+c45,y+TA, x,y+TA-c45, x,y+c45],
      // bot
      [x+c45,y+h-TA, x+w-c45,y+h-TA, x+w,y+h-TA+c45, x+w,y+h-c45, x+w-c45,y+h, x+c45,y+h, x,y+h-c45, x,y+h-TA+c45],
      // sx
      [x,y+TA, x+TA-c45,y+TA, x+TA,y+TA+c45, x+TA,y+h-TA-c45, x+TA-c45,y+h-TA, x,y+h-TA],
      // dx
      [x+w-TA,y+TA, x+w,y+TA, x+w,y+h-TA, x+w-TA,y+h-TA, x+w-TA,y+h-TA-c45, x+w-TA+c45,y+h-TA, x+w,y+h-TA, x+w,y+TA, x+w-TA+c45,y+TA, x+w-TA,y+TA+c45],
    ];

    bars.forEach(coords => {
      const pts = ptsToFabric(coords);
      canvas.add(new fabric.Polygon(pts, {
        fill: createHatchPattern("#2c4060"),
        stroke: "#8aaabb", strokeWidth: 0.8,
        selectable: false, evented: false
      }));
      canvas.add(new fabric.Polygon(pts, {
        fill: "transparent", stroke: "#b0c8d8", strokeWidth: 0.6,
        selectable: false, evented: false
      }));
    });

    // Outline anta — selezionabile
    const outline = new fabric.Rect({
      left: x, top: y, width: w, height: h,
      fill: "transparent", stroke: "#aac8d8", strokeWidth: 1.5,
      selectable: !readonly, evented: !readonly,
      hoverCursor: "pointer",
    });
    outline.set("cadData", { tipo: "cella", ci, ri, wMm, hMm, apertura: tipo, verso });
    canvas.add(outline);

    // VETRO
    const gx = x + TA, gy = y + TA, gw = w - TA * 2, gh = h - TA * 2;
    if (gw > 2 && gh > 2) {
      canvas.add(new fabric.Rect({
        left: gx, top: gy, width: gw, height: gh,
        fill: createVetroPattern(),
        stroke: "#4a96b8", strokeWidth: 0.8,
        selectable: false, evented: false
      }));
      // Riflessione
      canvas.add(new fabric.Line([gx + gw * 0.07, gy + gh * 0.05, gx + gw * 0.2, gy + gh * 0.3], {
        stroke: "rgba(200,230,255,0.35)", strokeWidth: gw * 0.035,
        selectable: false, evented: false
      }));
    }

    // APERTURA specifica
    if (tipo === "anta" || tipo === "portafinestra") {
      drawArcoBattente(canvas, fabric, x, y, w, h, TA, verso);
      drawManiglia(canvas, fabric, x, y, w, h, TA, verso);
    } else if (tipo === "scorrevole" || tipo === "alzante") {
      drawScorrevole(canvas, fabric, x, y, w, h, verso, tipo);
    } else if (tipo === "vasistas") {
      drawVasistas(canvas, fabric, x, y, w, h, TA);
    } else if (tipo === "fisso" && gw > 4 && gh > 4) {
      // Croce fisso
      canvas.add(new fabric.Line([gx + 4, gy + 4, gx + gw - 4, gy + gh - 4], { stroke: "#4a7a9a", strokeWidth: 0.7, opacity: 0.5, selectable: false, evented: false }));
      canvas.add(new fabric.Line([gx + gw - 4, gy + 4, gx + 4, gy + gh - 4], { stroke: "#4a7a9a", strokeWidth: 0.7, opacity: 0.5, selectable: false, evented: false }));
    }

    // Quota cella
    if (w > 30 && h > 20) {
      canvas.add(new fabric.Text(`${Math.round(wMm)}×${Math.round(hMm)}`, {
        left: x + w / 2, top: y + h / 2,
        fontSize: 9, fill: "#5a8898", fontFamily: "monospace",
        originX: "center", originY: "center",
        selectable: false, evented: false, opacity: 0.7
      }));
    }
  }

  // ── ARCO BATTENTE ISO ───────────────────────────────────────
  function drawArcoBattente(canvas: any, fabric: any, ax: number, ay: number, aw: number, ah: number, TA: number, verso: string) {
    const r = Math.min((aw - TA) * 0.88, (ah - TA) * 0.85);
    const cx = verso === "sx" ? ax + aw - TA : ax + TA;
    const cy = ay + ah;
    const ex = verso === "sx" ? ax + TA : ax + aw - TA;

    canvas.add(new fabric.Path(
      `M ${cx} ${cy} A ${r} ${r} 0 0 ${verso === "sx" ? 0 : 1} ${ex} ${cy}`,
      {
        fill: "rgba(26,158,115,0.07)",
        stroke: "#1A9E73", strokeWidth: 1.4,
        strokeDashArray: [10, 5],
        selectable: false, evented: false
      }
    ));

    // Asse cerniera
    const asseX = verso === "sx" ? ax + TA / 2 : ax + aw - TA / 2;
    canvas.add(new fabric.Line([asseX, ay + TA / 2, asseX, ay + ah - TA / 2], {
      stroke: "#1A9E73", strokeWidth: 0.8,
      strokeDashArray: [4, 3], opacity: 0.6,
      selectable: false, evented: false
    }));

    // Simboli cerniera
    [0.25, 0.75].forEach(f => {
      canvas.add(new fabric.Circle({
        left: asseX - 4, top: ay + ah * f - 4, radius: 4,
        fill: "#1A9E7340", stroke: "#1A9E73", strokeWidth: 1,
        selectable: false, evented: false
      }));
    });
  }

  // ── MANIGLIA ────────────────────────────────────────────────
  function drawManiglia(canvas: any, fabric: any, ax: number, ay: number, aw: number, ah: number, TA: number, verso: string) {
    const mx = verso === "dx" ? ax + aw - TA - 4 : ax + TA + 4;
    const my = ay + ah / 2;
    const hH = Math.min(ah * 0.14, 26);

    canvas.add(new fabric.Rect({
      left: mx - 3, top: my - hH / 2, width: 6, height: hH, rx: 3,
      fill: "#D08008", stroke: "#a06000", strokeWidth: 1,
      selectable: false, evented: false
    }));
    canvas.add(new fabric.Circle({
      left: mx - 5, top: my - 5, radius: 5,
      fill: "#c07000", stroke: "#a05000", strokeWidth: 1,
      selectable: false, evented: false
    }));
  }

  // ── SCORREVOLE / ALZANTE ────────────────────────────────────
  function drawScorrevole(canvas: any, fabric: any, ax: number, ay: number, aw: number, ah: number, verso: string, tipo: string) {
    const dir = verso === "dx" ? 1 : -1;
    const cx = ax + aw / 2 + dir * 8;
    const cy = ay + ah / 2;
    const len = Math.min(aw * 0.32, 44);

    canvas.add(new fabric.Path(
      `M ${cx - len * dir} ${cy} L ${cx + len * dir} ${cy}`,
      { stroke: "#1A9E73", strokeWidth: 2.2, fill: "transparent", selectable: false, evented: false }
    ));
    canvas.add(new fabric.Triangle({
      left: dir === 1 ? cx + len - 5 : cx - len - 5,
      top: cy - 5, width: 10, height: 10,
      angle: dir === 1 ? 90 : 270,
      fill: "#1A9E73", selectable: false, evented: false
    }));

    // Guide scorrimento
    ["top", "bot"].forEach(pos => {
      const gy = pos === "top" ? ay + 8 : ay + ah - 8;
      canvas.add(new fabric.Line([ax + 8, gy, ax + aw - 8, gy], {
        stroke: "#1A9E7360", strokeWidth: 2, selectable: false, evented: false
      }));
    });

    if (tipo === "alzante") {
      canvas.add(new fabric.Text("ALZ", {
        left: ax + aw / 2, top: ay + ah - 14,
        fontSize: 9, fill: "#1A9E73", fontFamily: "system-ui",
        fontWeight: "bold", originX: "center",
        selectable: false, evented: false
      }));
    }
  }

  // ── VASISTAS ────────────────────────────────────────────────
  function drawVasistas(canvas: any, fabric: any, ax: number, ay: number, aw: number, ah: number, TA: number) {
    const gx = ax + TA, gy = ay + TA, gw = aw - TA * 2, gh = ah - TA * 2;
    const vH = gh * 0.38;
    canvas.add(new fabric.Path(
      `M ${gx} ${gy + vH} L ${gx + gw / 2} ${gy + 4} L ${gx + gw} ${gy + vH}`,
      {
        fill: "rgba(26,158,115,0.1)",
        stroke: "#1A9E73", strokeWidth: 1.3,
        strokeDashArray: [6, 3],
        selectable: false, evented: false
      }
    ));
  }

  // ── QUOTE ───────────────────────────────────────────────────
  function drawQuote(canvas: any, fabric: any, ox: number, oy: number, W: number, H: number, TF: number, TA: number, TM: number, TT: number, tip: Tipologia, montanti: number[], traversi: number[]) {
    const qOff = 22;

    // Larghezza totale
    addQuota(canvas, fabric, ox, oy - qOff - 14, ox + W * SCALE, oy - qOff - 14, W + " mm", true, "#b0c0d0", 11);

    // Altezza totale
    addQuota(canvas, fabric, ox + W * SCALE + qOff, oy, ox + W * SCALE + qOff, oy + H * SCALE, H + " mm", false, "#b0c0d0", 11);

    // Quote colonne
    const cols = tip.cols;
    const totalW = cols.reduce((s, c) => s + c, 0);
    const availW = W - TF * 2 - TM * (cols.length - 1);
    let curX = TF;
    if (cols.length > 1) {
      cols.forEach((cw, ci) => {
        const colW = (cw / totalW) * availW;
        addQuota(canvas, fabric,
          (ox + curX) * SCALE, oy + H * SCALE + 16,
          (ox + curX + colW) * SCALE, oy + H * SCALE + 16,
          Math.round(colW) + "", true, "#D08008", 9
        );
        curX += colW + TM;
      });
    }

    // Quote montanti
    montanti.forEach(mm => {
      canvas.add(new fabric.Text(mm + "mm", {
        left: (ox + mm) * SCALE, top: oy - 10,
        fontSize: 8, fill: "#D08008", fontFamily: "monospace",
        originX: "center", selectable: false, evented: false, opacity: 0.7
      }));
    });
  }

  function addQuota(canvas: any, fabric: any, x1: number, y1: number, x2: number, y2: number, label: string, horiz: boolean, color: string, fontSize: number) {
    if (horiz) {
      canvas.add(new fabric.Line([x1, y1, x2, y2], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Line([x1, y1 - 4, x1, y1 + 4], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Line([x2, y2 - 4, x2, y2 + 4], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Triangle({ left: x1 + 1, top: y1 - 4, width: 6, height: 6, angle: 270, fill: color, selectable: false, evented: false }));
      canvas.add(new fabric.Triangle({ left: x2 - 7, top: y2 - 4, width: 6, height: 6, angle: 90, fill: color, selectable: false, evented: false }));
      canvas.add(new fabric.Text(label, { left: (x1 + x2) / 2, top: y1 - fontSize - 3, fontSize, fill: color, fontFamily: "system-ui", originX: "center", selectable: false, evented: false }));
    } else {
      canvas.add(new fabric.Line([x1, y1, x2, y2], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Line([x1 - 4, y1, x1 + 4, y1], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Line([x2 - 4, y2, x2 + 4, y2], { stroke: color, strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Triangle({ left: x1 - 3, top: y1, width: 6, height: 6, angle: 0, fill: color, selectable: false, evented: false }));
      canvas.add(new fabric.Triangle({ left: x2 - 3, top: y2 - 7, width: 6, height: 6, angle: 180, fill: color, selectable: false, evented: false }));
      canvas.add(new fabric.Text(label, {
        left: x1 + fontSize + 5, top: (y1 + y2) / 2,
        fontSize, fill: color, fontFamily: "system-ui", angle: 90,
        originX: "center", originY: "center",
        selectable: false, evented: false
      }));
    }
  }

  // ── SEZIONE ORIZZONTALE ─────────────────────────────────────
  function drawSezioneOrizzontale(canvas: any, fabric: any, ox: number, oy: number, W: number, TF: number, TA: number, TM: number, tip: Tipologia) {
    const sH = 70;
    canvas.add(new fabric.Text("SEZ. ORIZZONTALE", {
      left: ox, top: oy - 14, fontSize: 8, fill: "#3B7FE0",
      fontFamily: "system-ui", fontWeight: "bold",
      selectable: false, evented: false
    }));
    canvas.add(new fabric.Rect({
      left: ox, top: oy, width: W * SCALE, height: sH,
      fill: "#12181e", stroke: "#2a3a4a", strokeWidth: 1,
      selectable: false, evented: false
    }));

    const cols = tip.cols;
    const totalW = cols.reduce((s, c) => s + c, 0);
    const availW = W - TF * 2 - TM * (cols.length - 1);
    let curX = TF;

    // Telai sx e dx
    [0, (W - TF) * SCALE].forEach(x => {
      canvas.add(new fabric.Rect({
        left: ox + x, top: oy + sH * 0.1, width: TF * SCALE, height: sH * 0.8,
        fill: createHatchPattern("#3a5070"), stroke: "#8aaabb", strokeWidth: 1,
        selectable: false, evented: false
      }));
    });

    cols.forEach((cw) => {
      const colW = (cw / totalW) * availW;
      // Ante sx e dx della colonna
      canvas.add(new fabric.Rect({ left: (ox + curX) * SCALE, top: oy + sH * 0.1, width: TA * SCALE, height: sH * 0.8, fill: createHatchPattern("#2c4060"), stroke: "#8aaabb", strokeWidth: 0.8, selectable: false, evented: false }));
      canvas.add(new fabric.Rect({ left: (ox + curX + colW - TA) * SCALE, top: oy + sH * 0.1, width: TA * SCALE, height: sH * 0.8, fill: createHatchPattern("#2c4060"), stroke: "#8aaabb", strokeWidth: 0.8, selectable: false, evented: false }));
      // Vetro
      canvas.add(new fabric.Rect({ left: (ox + curX + TA) * SCALE, top: oy + sH * 0.22, width: (colW - TA * 2) * SCALE, height: sH * 0.56, fill: createVetroPattern(), stroke: "#4a96b8", strokeWidth: 0.5, selectable: false, evented: false }));
      curX += colW + TM;
    });
  }

  // ── SEZIONE VERTICALE COMPLETA ──────────────────────────────
  function drawSezioneVerticale(canvas: any, fabric: any, ox: number, oy: number, W: number, H: number, TF: number, TA: number, TT: number, tip: Tipologia) {
    const sW = 80; // larghezza vista sezione verticale in px
    const pxH = H * SCALE;
    const startX = ox + W * SCALE + 60; // a destra del prospetto

    // Label
    canvas.add(new fabric.Text("SEZ. VERTICALE", {
      left: startX, top: oy - 14, fontSize: 8, fill: "#3B7FE0",
      fontFamily: "system-ui", fontWeight: "bold",
      selectable: false, evented: false
    }));

    // Sfondo
    canvas.add(new fabric.Rect({
      left: startX, top: oy, width: sW, height: pxH,
      fill: "#12181e", stroke: "#2a3a4a", strokeWidth: 1,
      selectable: false, evented: false
    }));

    // Profilo telaio top
    const barH = TF * SCALE;
    canvas.add(new fabric.Rect({
      left: startX, top: oy, width: sW, height: barH,
      fill: createHatchPattern("#3a5070"), stroke: "#8aaabb", strokeWidth: 1,
      selectable: false, evented: false
    }));
    // Profilo telaio bottom
    canvas.add(new fabric.Rect({
      left: startX, top: oy + pxH - barH, width: sW, height: barH,
      fill: createHatchPattern("#3a5070"), stroke: "#8aaabb", strokeWidth: 1,
      selectable: false, evented: false
    }));

    // Profili anta top e bottom di ogni cella
    const righe0 = tip.righe[0] || [100];
    const totalH = righe0.reduce((s: number, r: number) => s + r, 0);
    const availH = H - TF * 2 - 52 * (righe0.length - 1);
    let curY = TF;
    righe0.forEach((rh: number, ri: number) => {
      const cellH = (rh / totalH) * availH;
      const taH = TA * SCALE;
      // anta top
      canvas.add(new fabric.Rect({
        left: startX, top: oy + curY * SCALE, width: sW, height: taH,
        fill: createHatchPattern("#2c4060"), stroke: "#8aaabb", strokeWidth: 0.8,
        selectable: false, evented: false
      }));
      // anta bottom
      canvas.add(new fabric.Rect({
        left: startX, top: oy + (curY + cellH - TA) * SCALE, width: sW, height: taH,
        fill: createHatchPattern("#2c4060"), stroke: "#8aaabb", strokeWidth: 0.8,
        selectable: false, evented: false
      }));
      // vetro
      canvas.add(new fabric.Rect({
        left: startX + sW * 0.2,
        top: oy + (curY + TA) * SCALE,
        width: sW * 0.6,
        height: (cellH - TA * 2) * SCALE,
        fill: createVetroPattern(), stroke: "#4a96b8", strokeWidth: 0.5,
        selectable: false, evented: false
      }));

      // Traverso se non ultima riga
      if (ri < righe0.length - 1) {
        const travY = curY + cellH;
        canvas.add(new fabric.Rect({
          left: startX, top: oy + travY * SCALE, width: sW, height: 52 * SCALE,
          fill: createHatchPattern("#3a5a7a"), stroke: "#9ab0c0", strokeWidth: 1,
          selectable: false, evented: false
        }));
      }

      // Quote riga
      addQuota(canvas, fabric,
        startX + sW + 6, oy + curY * SCALE,
        startX + sW + 6, oy + (curY + cellH) * SCALE,
        Math.round(cellH) + "", false, "#D08008", 8
      );

      curY += cellH + 52;
    });

    // Quote totale altezza
    addQuota(canvas, fabric,
      startX - 16, oy,
      startX - 16, oy + pxH,
      H + " mm", false, "#b0c0d0", 10
    );
  }

  // ── EXPORT PDF OFFICINA ──────────────────────────────────────
  // Genera un SVG string del disegno tecnico completo
  // per poi convertirlo in PDF con pdf-lib o jsPDF
  function generaSvgOfficina(): string {
    const { W, H, tipologia: tip, montanti, traversi, profili, cassonetto, cassH, fuoriSquadro } = config;
    const TF = profili.telaio.larghezza;
    const TA = profili.anta.larghezza;
    const TM = profili.montante.larghezza;
    const TT = 52;
    const SCALE_SVG = 0.4; // scala per PDF (più grande)
    const ox = 80, oy = 80;
    const cassHmm = (cassonetto && cassH) ? cassH : 0;
    const cassHpx = cassHmm * SCALE_SVG;
    const oyR = oy + cassHpx;
    const W2 = W * SCALE_SVG;
    const H2 = H * SCALE_SVG;
    const TF2 = TF * SCALE_SVG;
    const TA2 = TA * SCALE_SVG;
    const TM2 = TM * SCALE_SVG;
    const TT2 = TT * SCALE_SVG;
    const vW = W2 + ox * 2 + 100;
    const vH = H2 + oyR + 100 + (cassHpx > 0 ? cassHpx + 20 : 0);

    let s = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vW} ${vH}" width="${vW}" height="${vH}" style="background:#fff">
<defs>
  <pattern id="hp" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="5" stroke="#8a9ab0" stroke-width="1.3"/>
  </pattern>
  <pattern id="gp" width="14" height="14" patternUnits="userSpaceOnUse">
    <line x1="0" y1="14" x2="14" y2="0" stroke="#4a90b8" stroke-width="0.5" opacity="0.6"/>
  </pattern>
</defs>`;

    // TITOLO
    s += `<text x="${vW/2}" y="32" text-anchor="middle" font-size="14" fill="#1a2a3a" font-family="Arial" font-weight="bold">MASTRO ERP — DISEGNO TECNICO OFFICINA</text>`;
    s += `<text x="${vW/2}" y="50" text-anchor="middle" font-size="10" fill="#555" font-family="Arial">${tip.nome} — ${W}×${H} mm — Telaio ${profili.telaio.nome}</text>`;
    s += `<line x1="${ox}" y1="58" x2="${vW-ox}" y2="58" stroke="#ccc" stroke-width="0.5"/>`;

    const C45F = (c: number, f = 0.65) => c * f;

    // CASSONETTO
    if (cassHpx > 0) {
      s += svgRect(ox, oy, W2, cassHpx, "url(#hp)", "#6a8aaa", 1.5);
      s += `<text x="${ox+W2/2}" y="${oy+cassHpx/2+4}" text-anchor="middle" font-size="10" fill="#D08008" font-family="Arial" font-weight="bold">CASSONETTO H=${cassHmm}mm</text>`;
    }

    // TELAIO
    const c45 = C45F(TF2);
    // top
    s += svgPoly([[ox,oyR],[ox+W2,oyR],[ox+W2,oyR+TF2-c45*0.3],[ox+W2-c45*0.7,oyR+TF2],[ox+c45*0.7,oyR+TF2],[ox,oyR+TF2-c45*0.3]]);
    // bot
    s += svgPoly([[ox+c45*0.7,oyR+H2-TF2],[ox+W2-c45*0.7,oyR+H2-TF2],[ox+W2,oyR+H2-TF2+c45*0.3],[ox+W2,oyR+H2],[ox,oyR+H2],[ox,oyR+H2-TF2+c45*0.3]]);
    // sx
    s += svgPoly([[ox,oyR+TF2-c45*0.3],[ox+TF2-c45*0.3,oyR+TF2],[ox+TF2,oyR+TF2+c45*0.3],[ox+TF2,oyR+H2-TF2-c45*0.3],[ox+TF2-c45*0.3,oyR+H2-TF2],[ox,oyR+H2-TF2+c45*0.3]]);
    // dx
    s += svgPoly([[ox+W2-TF2,oyR+TF2+c45*0.3],[ox+W2,oyR+TF2-c45*0.3],[ox+W2,oyR+H2-TF2+c45*0.3],[ox+W2-TF2,oyR+H2-TF2-c45*0.3],[ox+W2-TF2+c45*0.3,oyR+H2-TF2],[ox+W2-TF2,oyR+H2-TF2],[ox+W2-TF2+c45*0.3,oyR+TF2],[ox+W2-TF2,oyR+TF2+c45*0.3]]);
    s += `<rect x="${ox}" y="${oyR}" width="${W2}" height="${H2}" fill="none" stroke="#1a2a3a" stroke-width="2"/>`;

    // MONTANTI
    montanti.forEach((mm) => {
      const mx = ox + mm * SCALE_SVG;
      const mxL = mx - TM2/2, mxR = mx + TM2/2;
      const mc45 = C45F(TM2/2);
      s += svgPoly([
        mxL+mc45,oyR+TF2, mxR-mc45,oyR+TF2, mxR,oyR+TF2+mc45,
        mxR,oyR+H2-TF2-mc45, mxR-mc45,oyR+H2-TF2, mxL+mc45,oyR+H2-TF2,
        mxL,oyR+H2-TF2-mc45, mxL,oyR+TF2+mc45
      ]);
      s += `<line x1="${mx}" y1="${oyR+TF2}" x2="${mx}" y2="${oyR+H2-TF2}" stroke="#D08008" stroke-width="0.7" stroke-dasharray="6,3,1,3" opacity="0.5"/>`;
    });

    // TRAVERSI
    const totalW2 = tip.cols.reduce((s: number,c: number)=>s+c,0);
    const availW2 = W - TF*2 - TM*(tip.cols.length-1);

    traversi.forEach((trav) => {
      const mm = typeof trav === "number" ? trav : trav.mm;
      const ty = oyR + mm * SCALE_SVG;
      s += svgPoly([
        ox+TF2+C45F(TT2/2), ty-TT2/2,
        ox+W2-TF2-C45F(TT2/2), ty-TT2/2,
        ox+W2-TF2, ty-TT2/2+C45F(TT2/2),
        ox+W2-TF2, ty+TT2/2-C45F(TT2/2),
        ox+W2-TF2-C45F(TT2/2), ty+TT2/2,
        ox+TF2+C45F(TT2/2), ty+TT2/2,
        ox+TF2, ty+TT2/2-C45F(TT2/2),
        ox+TF2, ty-TT2/2+C45F(TT2/2)
      ]);
    });

    // CAMPITURE
    const cols2 = tip.cols;
    let curX2 = TF;
    cols2.forEach((cw: number, ci: number) => {
      const colW = (cw/totalW2)*availW2;
      const righe2 = tip.righe[ci] || [100];
      const totalH2 = righe2.reduce((s: number,r: number)=>s+r,0);
      const availH2 = H - TF*2 - TT*(righe2.length-1);
      let curY2 = TF;
      righe2.forEach((rh: number, ri: number) => {
        const cellH = (rh/totalH2)*availH2;
        const cellaIdx = cols2.slice(0,ci).reduce((s: number,_: any,i: number)=>(tip.righe[i]||[1]).length+s,0)+ri;
        const cella = tip.celle[cellaIdx] || {tipo:"fisso",verso:"dx"};
        const ax = ox + curX2*SCALE_SVG;
        const ay = oyR + curY2*SCALE_SVG;
        const aw = colW*SCALE_SVG;
        const ah = cellH*SCALE_SVG;
        const c45a = C45F(TA2*0.7, 0.7);

        // 4 barre anta
        s += svgPoly([ax+c45a,ay, ax+aw-c45a,ay, ax+aw,ay+c45a, ax+aw,ay+TA2-c45a, ax+aw-c45a,ay+TA2, ax+c45a,ay+TA2, ax,ay+TA2-c45a, ax,ay+c45a]);
        s += svgPoly([ax+c45a,ay+ah-TA2, ax+aw-c45a,ay+ah-TA2, ax+aw,ay+ah-TA2+c45a, ax+aw,ay+ah-c45a, ax+aw-c45a,ay+ah, ax+c45a,ay+ah, ax,ay+ah-c45a, ax,ay+ah-TA2+c45a]);
        s += svgPoly([ax,ay+TA2, ax+TA2-c45a,ay+TA2, ax+TA2,ay+TA2+c45a, ax+TA2,ay+ah-TA2-c45a, ax+TA2-c45a,ay+ah-TA2, ax,ay+ah-TA2]);
        s += svgPoly([ax+aw-TA2,ay+TA2, ax+aw,ay+TA2, ax+aw,ay+ah-TA2, ax+aw-TA2,ay+ah-TA2, ax+aw-TA2,ay+ah-TA2-c45a, ax+aw-TA2+c45a,ay+ah-TA2, ax+aw,ay+ah-TA2, ax+aw,ay+TA2, ax+aw-TA2+c45a,ay+TA2, ax+aw-TA2,ay+TA2+c45a]);
        s += `<rect x="${ax}" y="${ay}" width="${aw}" height="${ah}" fill="none" stroke="#2c3e50" stroke-width="1.5"/>`;

        // Vetro
        const gx=ax+TA2,gy=ay+TA2,gw=aw-TA2*2,gh=ah-TA2*2;
        s += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" fill="url(#gp)" stroke="#4a96b8" stroke-width="0.8"/>`;

        // Apertura
        if(cella.tipo==="anta"||cella.tipo==="portafinestra") {
          const r = Math.min(gw*0.82,gh*0.78);
          const cx = cella.verso==="sx" ? ax+aw-TA2 : ax+TA2;
          const sweep = cella.verso==="sx" ? 1 : 0;
          const ex = cella.verso==="sx" ? ax+TA2 : ax+aw-TA2;
          s += `<path d="M${cx} ${ay+ah} A${r} ${r} 0 0 ${sweep} ${ex} ${ay+ah}" fill="rgba(26,158,115,0.08)" stroke="#1A9E73" stroke-width="1.3" stroke-dasharray="8,4"/>`;
          // Maniglia
          const mx3 = cella.verso==="dx" ? ax+aw-TA2-4 : ax+TA2+4;
          s += `<rect x="${mx3-2.5}" y="${ay+ah/2-10}" width="5" height="20" rx="2.5" fill="#D08008"/>`;
        } else if(cella.tipo==="scorrevole"||cella.tipo==="alzante") {
          const dir = cella.verso==="dx"?1:-1;
          const cxA = ax+aw/2+dir*8, cyA = ay+ah/2;
          s += `<line x1="${cxA-16*dir}" y1="${cyA}" x2="${cxA+18*dir}" y2="${cyA}" stroke="#1A9E73" stroke-width="2" stroke-linecap="round"/>`;
          s += `<polygon points="${cxA+18*dir},${cyA-5} ${cxA+18*dir+10*dir},${cyA} ${cxA+18*dir},${cyA+5}" fill="#1A9E73"/>`;
        } else if(cella.tipo==="fisso") {
          s += `<line x1="${gx+3}" y1="${gy+3}" x2="${gx+gw-3}" y2="${gy+gh-3}" stroke="#4a7a9a" stroke-width="0.8" opacity="0.5"/>`;
          s += `<line x1="${gx+gw-3}" y1="${gy+3}" x2="${gx+3}" y2="${gy+gh-3}" stroke="#4a7a9a" stroke-width="0.8" opacity="0.5"/>`;
        }

        // Quote cella
        s += `<text x="${ax+aw/2}" y="${ay+ah/2+4}" text-anchor="middle" font-size="9" fill="#5a8898" font-family="Arial">${Math.round(colW)}×${Math.round(cellH)}</text>`;
        curY2 += cellH + TT;
      });
      curX2 += colW + TM;
    });

    // QUOTE TOTALI
    // Larghezza
    s += svgQuota(ox, oyR-18, ox+W2, oyR-18, W+"mm", true, "#1a2a3a", 11);
    // Altezza
    s += svgQuota(ox+W2+18, oyR, ox+W2+18, oyR+H2, H+"mm", false, "#1a2a3a", 11);
    // Quote colonne
    if(cols2.length > 1) {
      const totalW3 = cols2.reduce((s: number,c: number)=>s+c,0);
      const availW3 = W - TF*2 - TM*(cols2.length-1);
      let curX3 = TF;
      cols2.forEach((cw: number) => {
        const colW = (cw/totalW3)*availW3;
        s += svgQuota((ox+curX3)*SCALE_SVG, oyR+H2+16, (ox+curX3+colW)*SCALE_SVG, oyR+H2+16, Math.round(colW)+"", true, "#D08008", 9);
        curX3 += colW + TM;
      });
    }

    // SEZIONE ORIZZONTALE (in basso)
    const sezY = oyR + H2 + 50;
    const sezH = 72;
    s += `<text x="${ox}" y="${sezY-8}" font-size="9" fill="#3B7FE0" font-family="Arial" font-weight="bold">SEZIONE ORIZZONTALE</text>`;
    s += `<rect x="${ox}" y="${sezY}" width="${W2}" height="${sezH}" fill="#f8f9ff" stroke="#aaa" stroke-width="0.8"/>`;
    // Telai
    s += svgRect(ox, sezY+sezH*0.1, TF2, sezH*0.8, "url(#hp)", "#8aaabb", 1);
    s += svgRect(ox+W2-TF2, sezY+sezH*0.1, TF2, sezH*0.8, "url(#hp)", "#8aaabb", 1);
    let curX4 = TF;
    const totalW4 = cols2.reduce((s: number,c: number)=>s+c,0);
    const availW4 = W - TF*2 - TM*(cols2.length-1);
    cols2.forEach((cw: number, ci: number) => {
      const colW = (cw/totalW4)*availW4;
      s += svgRect((ox+curX4)*SCALE_SVG, sezY+sezH*0.1, TA2, sezH*0.8, "url(#hp)", "#8aaabb", 0.8);
      s += svgRect((ox+curX4+colW-TA)*SCALE_SVG, sezY+sezH*0.1, TA2, sezH*0.8, "url(#hp)", "#8aaabb", 0.8);
      s += svgRect((ox+curX4+TA)*SCALE_SVG, sezY+sezH*0.2, (colW-TA*2)*SCALE_SVG, sezH*0.6, "url(#gp)", "#4a96b8", 0.5);
      if(ci < cols2.length-1) {
        // montante
        s += svgRect((ox+curX4+colW)*SCALE_SVG, sezY, TM2, sezH, "url(#hp)", "#6a8aaa", 1);
      }
      curX4 += colW + TM;
    });

    // SEZIONE VERTICALE
    const sezVX = ox + W2 + 80;
    const sezVW = 80;
    s += `<text x="${sezVX}" y="${oyR-8}" font-size="9" fill="#3B7FE0" font-family="Arial" font-weight="bold">SEZIONE VERTICALE</text>`;
    s += `<rect x="${sezVX}" y="${oyR}" width="${sezVW}" height="${H2}" fill="#f8f9ff" stroke="#aaa" stroke-width="0.8"/>`;
    s += svgRect(sezVX, oyR, sezVW, TF2, "url(#hp)", "#8aaabb", 1);
    s += svgRect(sezVX, oyR+H2-TF2, sezVW, TF2, "url(#hp)", "#8aaabb", 1);
    const righeV = tip.righe[0]||[100];
    const totalHV = righeV.reduce((s: number,r: number)=>s+r,0);
    const availHV = H-TF*2-TT*(righeV.length-1);
    let curYV = TF;
    righeV.forEach((rh: number, ri: number) => {
      const cellH = (rh/totalHV)*availHV;
      s += svgRect(sezVX, oyR+curYV*SCALE_SVG, sezVW, TA2, "url(#hp)", "#8aaabb", 0.8);
      s += svgRect(sezVX, oyR+(curYV+cellH-TA)*SCALE_SVG, sezVW, TA2, "url(#hp)", "#8aaabb", 0.8);
      s += svgRect(sezVX+sezVW*0.2, oyR+(curYV+TA)*SCALE_SVG, sezVW*0.6, (cellH-TA*2)*SCALE_SVG, "url(#gp)", "#4a96b8", 0.5);
      if(ri < righeV.length-1) {
        s += svgRect(sezVX, oyR+(curYV+cellH)*SCALE_SVG, sezVW, TT2, "url(#hp)", "#6a8aaa", 1);
      }
      curYV += cellH + TT;
    });

    // CARTIGLIO (tabella info in basso)
    const cartY = Math.max(sezY+sezH, oyR+H2) + 30;
    s += svgCartello(ox, cartY, vW-ox*2);

    s += "</svg>";
    return s;
  }

  // Helpers SVG per export
  function svgPoly(coords: number[], fill="url(#hp)", stroke="#3a5a7a", sw=1.2) {
    const pts = [];
    for(let i=0;i<coords.length;i+=2) pts.push(`${coords[i].toFixed(1)},${coords[i+1].toFixed(1)}`);
    return `<polygon points="${pts.join(" ")}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }
  function svgRect(x: number,y: number,w: number,h: number,fill: string,stroke: string,sw: number) {
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  }
  function svgQuota(x1: number,y1: number,x2: number,y2: number,label: string,horiz: boolean,col: string,fs: number) {
    if(horiz) {
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="0.8"/>
<line x1="${x1}" y1="${y1-4}" x2="${x1}" y2="${y1+4}" stroke="${col}" stroke-width="0.8"/>
<line x1="${x2}" y1="${y2-4}" x2="${x2}" y2="${y2+4}" stroke="${col}" stroke-width="0.8"/>
<text x="${(x1+x2)/2}" y="${y1-5}" text-anchor="middle" font-size="${fs}" fill="${col}" font-family="Arial" font-weight="bold">${label}</text>`;
    } else {
      const mx = x1+fs+4;
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}" stroke-width="0.8"/>
<line x1="${x1-4}" y1="${y1}" x2="${x1+4}" y2="${y1}" stroke="${col}" stroke-width="0.8"/>
<line x1="${x2-4}" y1="${y2}" x2="${x2+4}" y2="${y2}" stroke="${col}" stroke-width="0.8"/>
<text x="${mx}" y="${(y1+y2)/2}" text-anchor="middle" font-size="${fs}" fill="${col}" font-family="Arial" font-weight="bold" transform="rotate(90,${mx},${(y1+y2)/2})">${label}</text>`;
    }
  }
  function svgCartello(x: number, y: number, w: number) {
    const h = 60;
    const now = new Date().toLocaleDateString("it-IT");
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#f8f9ff" stroke="#aaa" stroke-width="0.8"/>
<line x1="${x+w*0.4}" y1="${y}" x2="${x+w*0.4}" y2="${y+h}" stroke="#aaa" stroke-width="0.5"/>
<line x1="${x+w*0.7}" y1="${y}" x2="${x+w*0.7}" y2="${y+h}" stroke="#aaa" stroke-width="0.5"/>
<line x1="${x}" y1="${y+h*0.5}" x2="${x+w}" y2="${y+h*0.5}" stroke="#aaa" stroke-width="0.5"/>
<text x="${x+8}" y="${y+18}" font-size="9" fill="#555" font-family="Arial" font-weight="bold">PROGETTO</text>
<text x="${x+8}" y="${y+34}" font-size="10" fill="#1a2a3a" font-family="Arial">MASTRO ERP</text>
<text x="${x+8}" y="${y+50}" font-size="8" fill="#888" font-family="Arial">www.mastroerp.com</text>
<text x="${x+w*0.4+8}" y="${y+18}" font-size="9" fill="#555" font-family="Arial" font-weight="bold">DATA</text>
<text x="${x+w*0.4+8}" y="${y+34}" font-size="10" fill="#1a2a3a" font-family="Arial">${now}</text>
<text x="${x+w*0.7+8}" y="${y+18}" font-size="9" fill="#555" font-family="Arial" font-weight="bold">SCALA</text>
<text x="${x+w*0.7+8}" y="${y+34}" font-size="10" fill="#1a2a3a" font-family="Arial">1:10</text>`;
  }

  // ── DOWNLOAD SVG/PDF ─────────────────────────────────────────
  function downloadSVG() {
    const svgStr = generaSvgOfficina();
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mastro-disegno-${config.tipologia.id}-${config.W}x${config.H}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPDFviaSVG() {
    // Apre il SVG in nuova finestra → stampa come PDF
    const svgStr = generaSvgOfficina();
    const htmlStr = `<!DOCTYPE html><html><head><title>Disegno Officina MASTRO</title>
<style>body{margin:0;padding:0}@media print{body{margin:0}svg{max-width:100%;height:auto}}</style>
</head><body>${svgStr}<script>window.onload=()=>setTimeout(()=>window.print(),500)</script></body></html>`;
    const blob = new Blob([htmlStr], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // ── HELPERS ─────────────────────────────────────────────────
  function ptsToFabric(coords: number[]) {
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < coords.length; i += 2) pts.push({ x: coords[i], y: coords[i + 1] });
    return pts;
  }

  function createHatchPattern(color: string) {
    const c = document.createElement("canvas");
    c.width = 6; c.height = 6;
    const ctx = c.getContext("2d")!;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(6, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, 1); ctx.lineTo(1, -1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, 7); ctx.lineTo(7, 5); ctx.stroke();
    const fabric = (window as any).fabric;
    return new fabric.Pattern({ source: c, repeat: "repeat" });
  }

  function createVetroPattern() {
    const c = document.createElement("canvas");
    c.width = 16; c.height = 16;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "rgba(168,216,234,0.18)";
    ctx.fillRect(0, 0, 16, 16);
    ctx.strokeStyle = "rgba(74,150,184,0.35)";
    ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(0, 16); ctx.lineTo(16, 0); ctx.stroke();
    const fabric = (window as any).fabric;
    return new fabric.Pattern({ source: c, repeat: "repeat" });
  }

  // ── TOOL HANDLERS ───────────────────────────────────────────
  const handleCanvasClick = useCallback((mmX: number, mmY: number) => {
    if (!onChange) return;
    const ct = toolRef.current;
    if (ct === "mont") {
      const mm = Math.round(mmX / 5) * 5;
      if (mm > 0 && mm < config.W) {
        const newM = [...configRef.current.montanti, mm].sort((a, b) => a - b);
        onChange({ ...configRef.current, montanti: newM });
      }
    } else if (ct === "trav") {
      const mm = Math.round(mmY / 5) * 5;
      if (mm > 0 && mm < config.H) {
        const newT: TraversoConfig[] = [...configRef.current.traversi, { mm }].sort((a, b) => a.mm - b.mm);
        onChange({ ...configRef.current, traversi: newT });
      }
    } else if (tool === "anta") {
      // Click dentro il telaio → cicla numero ante 1→2→3→4→5→6→1
      const tip = configRef.current.tipologia;
      const nAnte = tip.cols.length;
      const next = (nAnte % 6) + 1;
      const cols = Array(next).fill(Math.round(100 / next));
      // Aggiusta per arrivare esattamente a 100
      cols[0] += 100 - cols.reduce((s: number, c: number) => s + c, 0);
      const celle: Cella[] = Array(next).fill(null).map((_, i) => ({
        tipo: "anta" as const,
        verso: i % 2 === 0 ? "sx" as const : "dx" as const,
      }));
      const newTip: Tipologia = {
        id: `custom_${next}a`,
        nome: `${next} ante`,
        cols,
        righe: Array(next).fill([100]),
        celle,
      };
      onChange({ ...configRef.current, tipologia: newTip });
    } else if (ct === "anta") {
      if (onChange) { const tip = (configRef.current||{}).tipologia || {}; const n = ((tip.cols||[]).length % 6)+1; const cols = Array(n).fill(Math.floor(100/n)); cols[0]+=100-cols.reduce((s,x)=>s+x,0); const celle = Array.from({length:n},(_,i)=>({tipo:"anta",verso:i%2===0?"sx":"dx"})); onChange({...(configRef.current||{}), tipologia:{...tip,id:"c"+n,nome:n+" ante",cols,righe:Array(n).fill([100]),celle}}); }
    } else if (ct === "sel") {
      // Selezione oggetto — gestita da Fabric
    }
  }, [tool, onChange]);

  const fitScreen = useCallback(() => {
    const canvas = fabricRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const aW = container.clientWidth;
    const aH = container.clientHeight;
    // Disegno occupa W+160 per quote, H+120 per quote
    const drawW = (configRef.current.W + 180) * SCALE;
    const drawH = (configRef.current.H + 160) * SCALE;
    const z = Math.min((aW - 20) / drawW, (aH - 20) / drawH, 3);
    // Centra il disegno nel canvas
    const panX = -(aW / 2 - drawW * z / 2) + 30;
    const panY = -(aH / 2 - drawH * z / 2) + 20;
    canvas.setZoom(z);
    canvas.absolutePan({ x: panX, y: panY });
    setZoomLevel(z);
    canvas.renderAll();
  }, [config.W, config.H]);

  const zoomIn = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const c = canvas.getCenter();
    let z = Math.min(canvas.getZoom() * 1.25, 15);
    canvas.zoomToPoint({ x: c.left, y: c.top }, z);
    setZoomLevel(z);
  };
  const zoomOut = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const c = canvas.getCenter();
    let z = Math.max(canvas.getZoom() * 0.8, 0.05);
    canvas.zoomToPoint({ x: c.left, y: c.top }, z);
    setZoomLevel(z);
  };

  function updateStatus(x: number, y: number) {
    // Gestita internamente nel canvas event
  }

  // ── RENDER ──────────────────────────────────────────────────
  const AMB = "#D08008";
  type TipoNodo = "croce"|"T-mont"|"T-trav"|"passante-mont"|"passante-trav"|"coprigiunto"|"L";
  const GRN = "#1A9E73";
  const BLU = "#3B7FE0";

  const toolBtnStyle = (t: string) => ({
    display: "flex", alignItems: "center", gap: 6,
    width: "100%", padding: "7px 10px", borderRadius: 7,
    border: `1px solid ${tool === t ? AMB : "#2a2a2a"}`,
    background: tool === t ? AMB + "15" : "#1a1a1a",
    color: tool === t ? AMB : "#888",
    fontSize: 11, fontWeight: 500, cursor: "pointer",
    fontFamily: "inherit", marginBottom: 4, textAlign: "left" as const,
  });

  const iconStyle = { fontSize: 13, width: 18, textAlign: "center" as const };

  // Aggiorna sempre configRef con la prop corrente
  configRef.current = config;

  configRef.current = configRef.current || {};
  toolRef.current = tool;

  if (!isLoaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height, background: "#1a1a1c", borderRadius: 12, color: "#555", fontSize: 13 }}>
        Caricamento motore CAD...
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height, background: "#1a1a1c", borderRadius: 12, overflow: "hidden", fontFamily: "system-ui" }}>

      {/* TOOLBAR */}
      {!readonly && (
        <div style={{ background: "#111", padding: "6px 12px", display: "flex", gap: 6, borderBottom: "1px solid #2a2a2a", flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
          {[
            { id: "sel", ico: "↖", l: "Seleziona" },
            { id: "anta", ico: "▷", l: "Anta" },
            { id: "mont", ico: "|", l: "Montante" },
            { id: "trav", ico: "—", l: "Traverso" },
          ].map(t => (
            <button key={t.id} onClick={() => setTool(t.id)} style={{
              padding: "5px 10px", borderRadius: 7,
              border: `1px solid ${tool === t.id ? AMB : "#2a2a2a"}`,
              background: tool === t.id ? AMB + "15" : "#1a1a1a",
              color: tool === t.id ? AMB : "#888",
              fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{ fontSize: 13 }}>{t.ico}</span>{t.l}
            </button>
          ))}

          <div style={{ width: 1, height: 20, background: "#2a2a2a", margin: "0 2px" }} />

          <button onClick={() => setVista(v => v === "prospetto" ? "sez-h" : "prospetto")} style={{
            padding: "5px 10px", borderRadius: 7,
            border: `1px solid ${vista !== "prospetto" ? BLU : "#2a2a2a"}`,
            background: vista !== "prospetto" ? BLU + "15" : "#1a1a1a",
            color: vista !== "prospetto" ? BLU : "#888",
            fontSize: 11, cursor: "pointer", fontFamily: "inherit",
          }}>
            {vista === "prospetto" ? "Vista sez." : "Vista prosp."}
          </button>

          {onChange && (
            <>
              <button onClick={() => onChange({ ...configRef.current, montanti: [] })} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#DC4444", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                ✕ Mont.
              </button>
              <button onClick={() => onChange({ ...configRef.current, traversi: [] })} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#DC4444", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                ✕ Trav.
              </button>
            </>
          )}

          <div style={{ flex: 1 }} />

          <button onClick={downloadSVG} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #1A9E73", background: "#1A9E7315", color: "#1A9E73", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>↓ SVG</button>
          <button onClick={downloadPDFviaSVG} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #D08008", background: "#D0800815", color: "#D08008", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>↓ PDF</button>
          <div style={{ width: 1, height: 20, background: "#2a2a2a" }} />
          <button onClick={fitScreen} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#888", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>⊡ Fit</button>
          <button onClick={zoomIn} style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#888", fontSize: 14, cursor: "pointer" }}>+</button>
          <span style={{ fontSize: 10, color: "#555", padding: "0 4px" }}>{Math.round(zoomLevel * 100)}%</span>
          <button onClick={zoomOut} style={{ padding: "5px 8px", borderRadius: 7, border: "1px solid #2a2a2a", background: "#1a1a1a", color: "#888", fontSize: 14, cursor: "pointer" }}>−</button>
        </div>
      )}

      {/* CANVAS */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        <canvas ref={canvasRef} />

        {/* Info selezione */}
        {selData && !showNodoPanel && !showCellaPanel && (
          <div style={{
            position: "absolute", bottom: 10, left: 10,
            background: "#111e", padding: "6px 12px", borderRadius: 8,
            border: `1px solid ${AMB}40`, fontSize: 11, color: AMB,
          }}>
            {selData.tipo === "cella"
              ? `${selData.apertura} ${selData.verso || ""} — ${Math.round(selData.wMm)}×${Math.round(selData.hMm)} mm`
              : selData.tipo === "nodo"
              ? `Nodo M${selData.mi+1}×T${selData.ti+1} — ${selData.tipoNodo}`
              : `Montante @ ${selData.mm}mm`
            }
          </div>
        )}

        {/* PANNELLO NODO ─ bottom sheet */}
        {showNodoPanel && selData?.tipo === "nodo" && onChange && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "#111", borderTop: `1px solid ${AMB}40`,
            padding: "12px 16px", borderRadius: "12px 12px 0 0",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: AMB }}>
                Nodo M{selData.mi+1} × T{selData.ti+1}
              </span>
              <button onClick={() => setShowNodoPanel(false)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["croce","T-mont","T-trav","passante-mont","passante-trav","coprigiunto","L"] as TipoNodo[]).map(tipo => {
                const sel = (config.nodi?.[`m${selData.mi}-t${selData.ti}`]?.tipo || "croce") === tipo;
                const labels: Record<string,string> = {
                  "croce":"✕ Croce","T-mont":"T Mont.","T-trav":"T Trav.",
                  "passante-mont":"║ Pass.M","passante-trav":"═ Pass.T",
                  "coprigiunto":"▣ Coprig.","L":"L Angolo"
                };
                return (
                  <button key={tipo} onClick={() => {
                    const newNodi = { ...(config.nodi || {}), [`m${selData.mi}-t${selData.ti}`]: { tipo } };
                    onChange({ ...configRef.current, nodi: newNodi });
                  }} style={{
                    padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                    border: `1px solid ${sel ? AMB : "#333"}`,
                    background: sel ? AMB+"20" : "#1a1a1a",
                    color: sel ? AMB : "#888", fontSize: 11, fontWeight: sel ? 700 : 500,
                  }}>
                    {labels[tipo]}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "#555" }}>
              {selData.tipoNodo === "croce" && "Entrambi i profili si interrompono — nodo a croce standard"}
              {selData.tipoNodo === "T-mont" && "Traverso si ferma sul montante — montante continuo"}
              {selData.tipoNodo === "T-trav" && "Montante si ferma sul traverso — traverso continuo"}
              {selData.tipoNodo === "passante-mont" && "Montante attraversa senza interrompersi"}
              {selData.tipoNodo === "passante-trav" && "Traverso attraversa senza interrompersi"}
              {selData.tipoNodo === "coprigiunto" && "Profilo coprigiunto a copertura del nodo"}
              {selData.tipoNodo === "L" && "Nodo ad angolo — solo per composizioni speciali"}
            </div>
          </div>
        )}
        {/* TOAST ANTE — mostra numero ante correnti quando tool=anta */}
        {tool === "anta" && onChange && (
          <div style={{
            position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
            background: "#111e", border: `1px solid ${AMB}60`,
            padding: "6px 16px", borderRadius: 20, fontSize: 12, color: AMB,
            fontWeight: 700, pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            {configRef.current.tipologia.cols.length} {configRef.current.tipologia.cols.length === 1 ? "anta" : "ante"} — tocca per aggiungere
          </div>
        )}

        {/* PANNELLO NODO ─ bottom sheet */}
        {showNodoPanel && selData?.tipo === "nodo" && onChange && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "#111", borderTop: `1px solid ${AMB}40`,
            padding: "12px 16px", borderRadius: "12px 12px 0 0",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: AMB }}>
                Nodo M{selData.mi+1} × T{selData.ti+1}
              </span>
              <button onClick={() => setShowNodoPanel(false)} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 16 }}>×</button>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(["croce","T-mont","T-trav","passante-mont","passante-trav","coprigiunto","L"] as TipoNodo[]).map(tipo => {
                const sel = (config.nodi?.[`m${selData.mi}-t${selData.ti}`]?.tipo || "croce") === tipo;
                const labels: Record<string,string> = {
                  "croce":"✕ Croce","T-mont":"T Mont.","T-trav":"T Trav.",
                  "passante-mont":"║ Pass.M","passante-trav":"═ Pass.T",
                  "coprigiunto":"▣ Coprig.","L":"L Angolo"
                };
                return (
                  <button key={tipo} onClick={() => {
                    const newNodi = { ...(config.nodi || {}), [`m${selData.mi}-t${selData.ti}`]: { tipo } };
                    onChange({ ...configRef.current, nodi: newNodi });
                  }} style={{
                    padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                    border: `1px solid ${sel ? AMB : "#333"}`,
                    background: sel ? AMB+"20" : "#1a1a1a",
                    color: sel ? AMB : "#888", fontSize: 11, fontWeight: sel ? 700 : 500,
                  }}>
                    {labels[tipo]}
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "#555" }}>
              {selData.tipoNodo === "croce" && "Entrambi i profili si interrompono — nodo a croce standard"}
              {selData.tipoNodo === "T-mont" && "Traverso si ferma sul montante — montante continuo"}
              {selData.tipoNodo === "T-trav" && "Montante si ferma sul traverso — traverso continuo"}
              {selData.tipoNodo === "passante-mont" && "Montante attraversa senza interrompersi"}
              {selData.tipoNodo === "passante-trav" && "Traverso attraversa senza interrompersi"}
              {selData.tipoNodo === "coprigiunto" && "Profilo coprigiunto a copertura del nodo"}
              {selData.tipoNodo === "L" && "Nodo ad angolo — solo per composizioni speciali"}
            </div>
          </div>
        )}
        {/* PANNELLO CELLA ─ bottom sheet apertura */}
        {tool === "anta" && onChange && (
          <div style={{
            position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
            background: "#111e", border: "1px solid #D0800860",
            padding: "6px 16px", borderRadius: 20, fontSize: 12, color: "#D08008",
            fontWeight: 700, pointerEvents: "none", whiteSpace: "nowrap",
          }}>
            Tocca il telaio per aggiungere ante
          </div>
        )}
      </div>
    </div>
  );
}