// ═══════════════════════════════════════════════════════════════
// MASTRO CAD — motore_geometrico.ts v2.0
// Supporta griglia ricorsiva: sub-montanti/traversi per cella
// ═══════════════════════════════════════════════════════════════
import type { Cella, Griglia, MontanteLocale, TraversoLocale, PresetApertura } from "./types_cad";

const FER_DEFAULT = {
  maniglia:true, maniglione:false, nCerniere:2,
  cerniereTipo:"standard" as const, chiusuraMultipunto:false, costoFerramenta:0
};

// ── CALCOLA SUB-GRIGLIA DI UNA SINGOLA CELLA ──────────────────
export function calcolaSubGriglia(
  cella: Cella,
  sp: number,
  celleEsistenti: Cella[] = []
): Cella[] {
  if (!cella.subMontanti.length && !cella.subTraversi.length) return [];

  const L = cella.larghezzaNetta;
  const H = cella.altezzaNetta;

  const xPts = [0, ...cella.subMontanti.map(m=>m.xMmRel).sort((a,b)=>a-b), L];
  const yPts = [0, ...cella.subTraversi.map(t=>t.yMmRel).sort((a,b)=>a-b), H];

  const nCol = xPts.length - 1;
  const nRow = yPts.length - 1;
  const subCelle: Cella[] = [];

  for (let row = 0; row < nRow; row++) {
    for (let col = 0; col < nCol; col++) {
      const subId = `${cella.id}.${col}-${row}`;
      const esistente = celleEsistenti.find(c => c.id === subId) || {};

      const x0 = xPts[col];
      const x1 = xPts[col+1];
      const y0 = yPts[row];
      const y1 = yPts[row+1];

      // Spessore profilo interno: mezzo sp per lato interno, 0 per bordo cella
      const spSx = col === 0       ? 0 : sp/2;
      const spDx = col === nCol-1  ? 0 : sp/2;
      const spTop= row === 0       ? 0 : sp/2;
      const spBot= row === nRow-1  ? 0 : sp/2;

      const lNetta = Math.round(x1-x0-spSx-spDx);
      const hNetta = Math.round(y1-y0-spTop-spBot);
      const areaMq = Math.round(lNetta*hNetta)/1_000_000;

      subCelle.push({
        id: subId,
        colIdx: col, rowIdx: row,
        larghezzaNetta: lNetta,
        altezzaNetta: hNetta,
        areaMq,
        tipo: (esistente as any).tipo || "fisso",
        verso: (esistente as any).verso || "sx",
        riempimento: (esistente as any).riempimento || "vetro",
        vetro: (esistente as any).vetro,
        ferramenta: (esistente as any).ferramenta || {...FER_DEFAULT},
        subMontanti: (esistente as any).subMontanti || [],
        subTraversi: (esistente as any).subTraversi || [],
        subCelle: [],
        pesoVetro: 0, costoVetro: 0,
      });
    }
  }
  return subCelle;
}

// ── CALCOLA GRIGLIA PRINCIPALE ────────────────────────────────
export function calcolaGriglia(
  L: number, H: number,
  montanti: {id:string;xMm:number;spessoreMm:number}[],
  traversi:  {id:string;yMm:number;spessoreMm:number}[],
  sistema: {spessoreTelaio:number},
  celleEsistenti: Partial<Cella>[] = []
): Griglia {
  const sp = sistema.spessoreTelaio;

  const xPts = [sp, ...montanti.map(m=>m.xMm).sort((a,b)=>a-b), L-sp];
  const yPts = [sp, ...traversi.map(t=>t.yMm).sort((a,b)=>a-b), H-sp];

  const nCol = xPts.length-1;
  const nRow = yPts.length-1;
  const celle: Cella[] = [];

  for (let row=0; row<nRow; row++) {
    for (let col=0; col<nCol; col++) {
      const id = `${col}-${row}`;
      const es = celleEsistenti.find(c=>c.id===id) || {} as any;

      const x0 = xPts[col], x1 = xPts[col+1];
      const y0 = yPts[row], y1 = yPts[row+1];
      const spSx = col===0       ? 0 : sp/2;
      const spDx = col===nCol-1  ? 0 : sp/2;
      const spTop= row===0       ? 0 : sp/2;
      const spBot= row===nRow-1  ? 0 : sp/2;

      const lNetta = Math.round(x1-x0-spSx-spDx);
      const hNetta = Math.round(y1-y0-spTop-spBot);

      const cella: Cella = {
        id, colIdx:col, rowIdx:row,
        larghezzaNetta: lNetta,
        altezzaNetta: hNetta,
        areaMq: Math.round(lNetta*hNetta)/1_000_000,
        tipo: es.tipo || "fisso",
        verso: es.verso || "sx",
        riempimento: es.riempimento || "vetro",
        vetro: es.vetro,
        ferramenta: es.ferramenta || {...FER_DEFAULT},
        subMontanti: es.subMontanti || [],
        subTraversi: es.subTraversi || [],
        subCelle: [],
        pesoVetro:0, costoVetro:0,
      };

      // Ricalcola sub-griglia se esistente
      if (cella.subMontanti.length || cella.subTraversi.length) {
        cella.subCelle = calcolaSubGriglia(cella, sp, es.subCelle||[]);
      }

      celle.push(cella);
    }
  }

  return { nColonne:nCol, nRighe:nRow, xPunti:xPts, yPunti:yPts, celle };
}

// ── MONTANTI GLOBALI ──────────────────────────────────────────
export function addMontante(montanti:any[], xMm:number, L:number, sistema:any) {
  const sp = sistema.spessoreTelaio;
  const x = Math.round(Math.max(sp*2, Math.min(L-sp*2, xMm)));
  if (montanti.some(m=>Math.abs(m.xMm-x)<sp*2)) return montanti;
  return [...montanti, {id:`m${Date.now()}`,xMm:x,spessoreMm:sp}].sort((a,b)=>a.xMm-b.xMm);
}

export function addTraverso(traversi:any[], yMm:number, H:number, sistema:any) {
  const sp = sistema.spessoreTelaio;
  const y = Math.round(Math.max(sp*2, Math.min(H-sp*2, yMm)));
  if (traversi.some(t=>Math.abs(t.yMm-y)<sp*2)) return traversi;
  return [...traversi, {id:`t${Date.now()}`,yMm:y,spessoreMm:sp}].sort((a,b)=>a.yMm-b.yMm);
}

export function moveMontante(montanti:any[], id:string, newX:number, L:number, sistema:any) {
  const sp = sistema.spessoreTelaio;
  const x = Math.round(Math.max(sp*2, Math.min(L-sp*2, newX)));
  return montanti.map(m=>m.id===id?{...m,xMm:x}:m);
}

export function moveTraverso(traversi:any[], id:string, newY:number, H:number, sistema:any) {
  const sp = sistema.spessoreTelaio;
  const y = Math.round(Math.max(sp*2, Math.min(H-sp*2, newY)));
  return traversi.map(t=>t.id===id?{...t,yMm:y}:t);
}

// ── SUB-MONTANTI/TRAVERSI PER CELLA ──────────────────────────
export function addSubMontante(cella: Cella, xMmRel:number, sp:number): Cella {
  const x = Math.round(Math.max(sp, Math.min(cella.larghezzaNetta-sp, xMmRel)));
  if (cella.subMontanti.some(m=>Math.abs(m.xMmRel-x)<sp)) return cella;
  const subMontanti = [...cella.subMontanti, {id:`sm${Date.now()}`,xMmRel:x,spessoreMm:sp}]
    .sort((a,b)=>a.xMmRel-b.xMmRel);
  const updated = {...cella, subMontanti};
  updated.subCelle = calcolaSubGriglia(updated, sp, cella.subCelle);
  return updated;
}

export function addSubTraverso(cella: Cella, yMmRel:number, sp:number): Cella {
  const y = Math.round(Math.max(sp, Math.min(cella.altezzaNetta-sp, yMmRel)));
  if (cella.subTraversi.some(t=>Math.abs(t.yMmRel-y)<sp)) return cella;
  const subTraversi = [...cella.subTraversi, {id:`st${Date.now()}`,yMmRel:y,spessoreMm:sp}]
    .sort((a,b)=>a.yMmRel-b.yMmRel);
  const updated = {...cella, subTraversi};
  updated.subCelle = calcolaSubGriglia(updated, sp, cella.subCelle);
  return updated;
}

export function removeSubMontante(cella: Cella, id:string, sp:number): Cella {
  const subMontanti = cella.subMontanti.filter(m=>m.id!==id);
  const updated = {...cella, subMontanti};
  updated.subCelle = calcolaSubGriglia(updated, sp, cella.subCelle);
  return updated;
}

export function removeSubTraverso(cella: Cella, id:string, sp:number): Cella {
  const subTraversi = cella.subTraversi.filter(t=>t.id!==id);
  const updated = {...cella, subTraversi};
  updated.subCelle = calcolaSubGriglia(updated, sp, cella.subCelle);
  return updated;
}

// ── POSIZIONE SUGGERITA ────────────────────────────────────────
export function suggerisciPosMontante(montanti:any[], L:number, sistema:any) {
  const sp = sistema.spessoreTelaio;
  const pts = [sp, ...montanti.map((m:any)=>m.xMm), L-sp];
  let maxGap=0, bestX=Math.round(L/2);
  for (let i=0;i<pts.length-1;i++){const g=pts[i+1]-pts[i];if(g>maxGap){maxGap=g;bestX=Math.round((pts[i]+pts[i+1])/2);}}
  return bestX;
}

export function suggerisciPosTraverso(traversi:any[], H:number, sistema:any) {
  const sp = sistema.spessoreTelaio;
  const pts = [sp, ...traversi.map((t:any)=>t.yMm), H-sp];
  let maxGap=0, bestY=Math.round(H/2);
  for (let i=0;i<pts.length-1;i++){const g=pts[i+1]-pts[i];if(g>maxGap){maxGap=g;bestY=Math.round((pts[i]+pts[i+1])/2);}}
  return bestY;
}

export function suggerisciSubPos(items:any[], dim:number, sp:number, key:"xMmRel"|"yMmRel") {
  const pts = [0, ...items.map((x:any)=>x[key]).sort((a:number,b:number)=>a-b), dim];
  let maxGap=0, best=Math.round(dim/2);
  for (let i=0;i<pts.length-1;i++){const g=pts[i+1]-pts[i];if(g>maxGap){maxGap=g;best=Math.round((pts[i]+pts[i+1])/2);}}
  return best;
}

// ── PRESET APERTURE ───────────────────────────────────────────
export function applicaPreset(
  L:number, H:number, preset:string, sp:number
): { montanti:{id:string;xMm:number;spessoreMm:number}[]; celle_config: Record<string,Partial<Cella>> } {
  const celle_config: Record<string,Partial<Cella>> = {};

  if (preset==="fisso") {
    celle_config["0-0"] = {tipo:"fisso"};
    return {montanti:[], celle_config};
  }
  if (preset==="1_anta_sx") {
    celle_config["0-0"] = {tipo:"anta_battente",verso:"sx"};
    return {montanti:[], celle_config};
  }
  if (preset==="1_anta_dx") {
    celle_config["0-0"] = {tipo:"anta_battente",verso:"dx"};
    return {montanti:[], celle_config};
  }
  if (preset==="porta_sx") {
    celle_config["0-0"] = {tipo:"porta",verso:"sx"};
    return {montanti:[], celle_config};
  }
  if (preset==="porta_dx") {
    celle_config["0-0"] = {tipo:"porta",verso:"dx"};
    return {montanti:[], celle_config};
  }
  if (preset==="2_ante") {
    const m = [{id:"m_preset",xMm:Math.round(L/2),spessoreMm:sp}];
    celle_config["0-0"] = {tipo:"anta_battente",verso:"dx"};
    celle_config["1-0"] = {tipo:"anta_battente",verso:"sx"};
    return {montanti:m, celle_config};
  }
  if (preset==="3_ante") {
    const m = [
      {id:"m_preset1",xMm:Math.round(L/3),spessoreMm:sp},
      {id:"m_preset2",xMm:Math.round(L*2/3),spessoreMm:sp},
    ];
    celle_config["0-0"] = {tipo:"anta_battente",verso:"dx"};
    celle_config["1-0"] = {tipo:"fisso"};
    celle_config["2-0"] = {tipo:"anta_battente",verso:"sx"};
    return {montanti:m, celle_config};
  }
  if (preset==="scorrevole_2") {
    const m = [{id:"m_preset",xMm:Math.round(L/2),spessoreMm:sp}];
    celle_config["0-0"] = {tipo:"scorrevole"};
    celle_config["1-0"] = {tipo:"scorrevole"};
    return {montanti:m, celle_config};
  }
  return {montanti:[], celle_config};
}
