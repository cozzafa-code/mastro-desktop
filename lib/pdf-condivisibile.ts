// ═══════════════════════════════════════════════════════════
// MASTRO ERP — lib/pdf-condivisibile.ts
// Conferma d'Ordine con firma cliente (documento commerciale)
// Sostituisce il semplice "preventivo" — è il contratto reale
// ═══════════════════════════════════════════════════════════

export async function generaPreventivoCondivisibile(c: any, ctx: any) {
  const { aziendaInfo, calcolaVanoPrezzo, getVaniAttivi } = ctx;
  const az = aziendaInfo || {};

  const vani = getVaniAttivi(c);
  const vaniCalc = vani.map((v: any) => ({
    ...v,
    prezzo: calcolaVanoPrezzo(v, c) * (v.pezzi || 1),
    prezzoUnit: calcolaVanoPrezzo(v, c),
  }));

  const totBase = vaniCalc.reduce((s: number, v: any) => s + v.prezzo, 0)
    + (c.vociLibere || []).reduce((s: number, vl: any) => s + ((vl.importo || 0) * (vl.qta || 1)), 0);

  const scontoPerc = parseFloat(c.scontoPerc || c.sconto || 0);
  const sconto = totBase * scontoPerc / 100;
  const imponibile = totBase - sconto;
  const ivaPerc = c.ivaPerc || 10;
  const iva = imponibile * ivaPerc / 100;
  const totIva = imponibile + iva;
  const acconto = parseFloat(c.accontoRicevuto || 0);

  // Fix decimali: sempre 2 cifre
  const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ─── Helper accessori attivi ───
  const isAttivo = (a: any) => a && (a === true || a.attivo === true || a.presente === true || a.inclusa === true || a.incluso === true);

  // ─── Calcolo prezzo singolo accessorio (stessa logica di calcolaVanoPrezzo) ───
  const prezzoAcc = (tipo: "tapparella"|"persiana"|"zanzariera"|"controtelaio", v: any): number => {
    const m = v.misure || {};
    const lmm = parseFloat(m.lCentro || 0);
    const hmm = parseFloat(m.hCentro || 0);
    const acc = v.accessori?.[tipo];
    if (tipo === "controtelaio") return parseFloat(az.prezzoControtelaio || 0);
    if (!acc?.attivo) return 0;
    const al = acc.l || lmm, ah = acc.h || hmm;
    const fb = parseFloat(az[`prezzo${tipo.charAt(0).toUpperCase()+tipo.slice(1)}`] || 0);
    return fb > 0 ? Math.round((al/1000)*(ah/1000)*fb * 100)/100 : 0;
  };

  // ─── Righe vani: riga principale + sub-righe accessori ───
  let rigaIndex = 0;
  const righeHTML = vaniCalc.map((v: any) => {
    rigaIndex++;
    const idx = rigaIndex;
    const m = v.misure || {};
    const ct = v.controtelaio || {};
    const misureStr = m.lCentro && m.hCentro ? `${m.lCentro}×${m.hCentro} mm` : "";
    const colori = v.bicolore
      ? `${v.coloreInt || "—"} int. / ${v.coloreEst || "—"} est.`
      : (v.coloreInt || v.coloreEst || v.colore || "");

    // Riga 1: sistema · misure · vetro · colore
    const riga1 = [v.tipo, misureStr, v.sistema || v.modello, v.vetro, colori].filter(Boolean).join(" · ");
    // Riga 2: posizione + finiture tecniche
    const riga2Parts = [
      v.stanza ? `${v.stanza}${v.piano ? " "+v.piano : ""}` : null,
      ct.tipo && ct.tipo !== "Nessuno" ? `CT ${ct.tipo === "singolo" ? "Singolo" : ct.tipo === "doppio" ? "Doppio" : "Cassonetto"}${ct.l && ct.h ? " "+ct.l+"×"+ct.h : ""}` : null,
      v.telaio ? `Telaio ${v.telaio}${v.telaioAlaZ ? " "+v.telaioAlaZ+"mm" : ""}` : null,
      v.rifilato ? `Rifilato${[v.rifilSx,v.rifilDx,v.rifilSopra,v.rifilSotto].filter(Boolean).length > 0 ? " "+[v.rifilSx,v.rifilDx,v.rifilSopra,v.rifilSotto].filter(Boolean).join("/")+"mm" : ""}` : null,
      v.coprifilo ? `Coprifilo ${v.coprifilo}` : null,
    ].filter(Boolean);
    // Riga 3: misure secondarie
    const misure2 = [
      m.lAlto && m.lAlto !== m.lCentro ? `lAlto ${m.lAlto}` : null,
      m.lBasso && m.lBasso !== m.lCentro ? `lBasso ${m.lBasso}` : null,
      m.hSx && m.hSx !== m.hCentro ? `hSx ${m.hSx}` : null,
      m.hDx && m.hDx !== m.hCentro ? `hDx ${m.hDx}` : null,
      m.d1 || m.d2 ? `D ${m.d1||"—"}/${m.d2||"—"}` : null,
      m.spSx || m.spDx ? `Sp ${[m.spSx,m.spDx,m.spSopra].filter(Boolean).join("/")}` : null,
      m.soglia ? `Soglia ${m.soglia}` : null,
      m.imbotte ? `Imbotte ${m.imbotte}` : null,
      m.davProf ? `Dav ${m.davProf}${m.davSporg ? "/"+m.davSporg : ""}` : null,
    ].filter(Boolean);

    const dettagliHTML = [
      `<div style="font-size:11px;color:#444;margin-top:3px">${riga1}</div>`,
      riga2Parts.length > 0 ? `<div style="font-size:10px;color:#86868b;margin-top:2px">${riga2Parts.join("  ·  ")}</div>` : "",
      misure2.length > 0 ? `<div style="font-size:10px;color:#aaa;margin-top:1px">${misure2.join("  ·  ")} mm</div>` : "",
    ].join("");

    // ─── Disegno SVG del vano ───
    let disegnoHTML = "";
    if (v.disegno?.elements?.length > 0) {
      const els = v.disegno.elements;
      const PAD = 20, PAD_DIM = 24;

      // Bounding box su tutti gli elementi
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      const expandBB = (x: number, y: number) => {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      };
      els.forEach((el: any) => {
        if (el.type === "rect") { expandBB(el.x, el.y); expandBB(el.x + el.w, el.y + el.h); }
        else if (el.type === "montante") { expandBB(el.x, el.y1 ?? 0); expandBB(el.x, el.y2 ?? 0); }
        else if (el.type === "traverso") { expandBB(el.x1 ?? 0, el.y); expandBB(el.x2 ?? 0, el.y); }
        else if (el.type === "freeLine" || el.type === "apLine" || el.type === "dim") {
          expandBB(el.x1 ?? 0, el.y1 ?? 0); expandBB(el.x2 ?? 0, el.y2 ?? 0);
        } else if (el.type === "polyAnta" || el.type === "polyGlass") {
          (el.poly || []).forEach((p: any) => expandBB(p.x ?? 0, p.y ?? 0));
        }
      });
      if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 300; maxY = 250; }

      const cW = Math.max(maxX - minX, 10), cH = Math.max(maxY - minY, 10);
      const svgW = 280, svgH = Math.min(220, Math.round(svgW * cH / cW));
      const sc = Math.min((svgW - PAD * 2 - PAD_DIM) / cW, (svgH - PAD * 2 - PAD_DIM) / cH);
      const ox = PAD_DIM + (svgW - PAD_DIM - PAD - cW * sc) / 2 - minX * sc;
      const oy = PAD + (svgH - PAD * 2 - cH * sc) / 2 - minY * sc;
      const tx = (x: number) => Math.round((ox + x * sc) * 10) / 10;
      const ty = (y: number) => Math.round((oy + y * sc) * 10) / 10;
      const sw = (w: number) => Math.round(w * sc * 10) / 10;

      const TK = 4 * sc; // spessore telaio

      let svgEls = "";
      els.forEach((el: any) => {
        if (el.type === "rect") {
          // Cornice esterna
          svgEls += `<rect x="${tx(el.x)}" y="${ty(el.y)}" width="${sw(el.w)}" height="${sw(el.h)}" fill="#E8F0FE" stroke="#1A1A1C" stroke-width="2" rx="1"/>`;
          // Cornice interna (telaio)
          svgEls += `<rect x="${tx(el.x)+TK}" y="${ty(el.y)+TK}" width="${sw(el.w)-TK*2}" height="${sw(el.h)-TK*2}" fill="none" stroke="#1A1A1C" stroke-width="1"/>`;
        } else if (el.type === "montante") {
          svgEls += `<line x1="${tx(el.x)}" y1="${ty(el.y1 ?? 0)}" x2="${tx(el.x)}" y2="${ty(el.y2 ?? 0)}" stroke="#1A1A1C" stroke-width="2"/>`;
        } else if (el.type === "traverso") {
          svgEls += `<line x1="${tx(el.x1 ?? 0)}" y1="${ty(el.y)}" x2="${tx(el.x2 ?? 0)}" y2="${ty(el.y)}" stroke="#1A1A1C" stroke-width="2"/>`;
        } else if (el.type === "freeLine") {
          svgEls += `<line x1="${tx(el.x1)}" y1="${ty(el.y1)}" x2="${tx(el.x2)}" y2="${ty(el.y2)}" stroke="#555" stroke-width="1" stroke-dasharray="none"/>`;
        } else if (el.type === "apLine") {
          // Linea apertura (arco anta) — tratteggiata
          svgEls += `<line x1="${tx(el.x1)}" y1="${ty(el.y1)}" x2="${tx(el.x2)}" y2="${ty(el.y2)}" stroke="#3B7FE0" stroke-width="0.8" stroke-dasharray="3,2"/>`;
        } else if (el.type === "dim") {
          // Quota dimensionale
          const x1 = tx(el.x1 ?? 0), y1 = ty(el.y1 ?? 0), x2 = tx(el.x2 ?? 0), y2 = ty(el.y2 ?? 0);
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          const isH = Math.abs(y2 - y1) < Math.abs(x2 - x1);
          svgEls += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#888" stroke-width="0.5"/>`;
          // Frecce
          svgEls += `<polygon points="${x1},${y1} ${x1+3},${y1-2} ${x1+3},${y1+2}" fill="#888"/>`;
          svgEls += `<polygon points="${x2},${y2} ${x2-3},${y2-2} ${x2-3},${y2+2}" fill="#888"/>`;
          if (el.label) {
            const rot = isH ? "0" : `rotate(-90 ${mx} ${my})`;
            svgEls += `<text x="${mx}" y="${isH ? my - 3 : my}" transform="${rot}" font-size="7" fill="#555" text-anchor="middle" font-family="Arial">${el.label}</text>`;
          }
        } else if (el.type === "polyAnta" || el.type === "polyGlass") {
          const poly = el.poly || [];
          if (poly.length >= 2) {
            const pts = poly.map((p: any) => `${tx(p.x)},${ty(p.y)}`).join(" ");
            if (el.type === "polyGlass") {
              svgEls += `<polygon points="${pts}" fill="#B3D4FF40" stroke="#3B7FE0" stroke-width="0.8"/>`;
            } else {
              // Anta: riempimento + diagonale apertura
              svgEls += `<polygon points="${pts}" fill="#1A9E7308" stroke="#1A9E73" stroke-width="1"/>`;
              // Linea diagonale che indica apertura
              if (poly.length >= 3) {
                svgEls += `<line x1="${tx(poly[0].x)}" y1="${ty(poly[0].y)}" x2="${tx(poly[2].x)}" y2="${ty(poly[2].y)}" stroke="#1A9E7360" stroke-width="0.5" stroke-dasharray="3,2"/>`;
              }
            }
          }
        }
      });

      // Quote esterne larghezza e altezza (solo se non ci sono già dim)
      const hasDim = els.some((e: any) => e.type === "dim");
      const lmm2 = v.misure?.lCentro || 0, hmm2 = v.misure?.hCentro || 0;
      if (!hasDim && lmm2 && hmm2) {
        const frame = els.find((e: any) => e.type === "rect");
        if (frame) {
          const fx1 = tx(frame.x), fy1 = ty(frame.y), fx2 = tx(frame.x + frame.w), fy2 = ty(frame.y + frame.h);
          // Larghezza (sotto)
          svgEls += `<line x1="${fx1}" y1="${fy2+8}" x2="${fx2}" y2="${fy2+8}" stroke="#888" stroke-width="0.5"/>`;
          svgEls += `<text x="${(fx1+fx2)/2}" y="${fy2+17}" font-size="7" fill="#555" text-anchor="middle" font-family="Arial">${lmm2} mm</text>`;
          // Altezza (sinistra)
          svgEls += `<line x1="${fx1-8}" y1="${fy1}" x2="${fx1-8}" y2="${fy2}" stroke="#888" stroke-width="0.5"/>`;
          svgEls += `<text x="${fx1-10}" y="${(fy1+fy2)/2}" font-size="7" fill="#555" text-anchor="middle" font-family="Arial" transform="rotate(-90 ${fx1-10} ${(fy1+fy2)/2})">${hmm2} mm</text>`;
        }
      }

      disegnoHTML = `<svg viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}" style="max-width:100%;border:1px solid #e5e5ea;border-radius:8px;background:#fafafa;display:block;margin-top:8px;" xmlns="http://www.w3.org/2000/svg">${svgEls}</svg>`;
    }

    // ─── Riga principale infisso ───
    const pezzi = v.pezzi || 1;
    const prezzoInfissoUnit = v.prezzoUnit - prezzoAcc("tapparella",v) - prezzoAcc("persiana",v) - prezzoAcc("zanzariera",v) - prezzoAcc("controtelaio",v)
      - (v.vociLibere||[]).reduce((s:number,vl:any)=>s+(vl.prezzo||0)*(vl.qta||1),0)/pezzi
      - (v.accessoriCatalogo||[]).reduce((s:number,ac:any)=>s+((ac.prezzoUnitario||0)*(ac.quantita||1)),0)/pezzi;
    
    let rows = `
    <tr>
      <td style="vertical-align:top;padding-top:12px">${idx}</td>
      <td style="vertical-align:top;padding-top:12px">
        <div style="font-weight:700;font-size:13px">${v.nome || `Vano ${idx}`}</div>
        ${dettagliHTML}
        ${disegnoHTML}
      </td>
      <td class="num" style="vertical-align:top;padding-top:12px">${pezzi}</td>
      <td class="num" style="vertical-align:top;padding-top:12px">€ ${fmt(Math.max(0, prezzoInfissoUnit))}</td>
      <td class="num bold" style="vertical-align:top;padding-top:12px">€ ${fmt(Math.max(0, prezzoInfissoUnit) * pezzi)}</td>
    </tr>`;

    // ─── Sub-righe accessori con prezzo ───
    const acc = v.accessori || {};
    
    // Tapparella
    const tapp = acc.tapparella;
    if (isAttivo(tapp)) {
      const desc = ["Tapparella", tapp.tipo, tapp.colore, tapp.azionamento, tapp.motorizzata?"Motorizzata":null, tapp.l&&tapp.h?`${tapp.l}×${tapp.h} mm`:null].filter(Boolean).join(" ");
      const p = prezzoAcc("tapparella", v);
      rows += `<tr style="background:#fafafa"><td></td><td style="font-size:11px;color:#555;padding-left:16px">↳ ${desc}</td><td class="num" style="font-size:11px;color:#555">${pezzi}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p)}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p*pezzi)}</td></tr>`;
    }
    // Persiana
    const pers = acc.persiana;
    if (isAttivo(pers)) {
      const desc = ["Persiana", pers.tipo, pers.colore].filter(Boolean).join(" ");
      const p = prezzoAcc("persiana", v);
      rows += `<tr style="background:#fafafa"><td></td><td style="font-size:11px;color:#555;padding-left:16px">↳ ${desc}</td><td class="num" style="font-size:11px;color:#555">${pezzi}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p)}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p*pezzi)}</td></tr>`;
    }
    // Zanzariera
    const zanz = acc.zanzariera;
    if (isAttivo(zanz)) {
      const desc = ["Zanzariera", zanz.tipo, zanz.colore].filter(Boolean).join(" ");
      const p = prezzoAcc("zanzariera", v);
      rows += `<tr style="background:#fafafa"><td></td><td style="font-size:11px;color:#555;padding-left:16px">↳ ${desc}</td><td class="num" style="font-size:11px;color:#555">${pezzi}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p)}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p*pezzi)}</td></tr>`;
    }
    // Controtelaio
    if (v.controtelaio && v.controtelaio !== "Nessuno") {
      const p = prezzoAcc("controtelaio", v);
      rows += `<tr style="background:#fafafa"><td></td><td style="font-size:11px;color:#555;padding-left:16px">↳ Controtelaio ${v.controtelaio}</td><td class="num" style="font-size:11px;color:#555">${pezzi}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p)}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p*pezzi)}</td></tr>`;
    }
    // Accessori catalogo
    (v.accessoriCatalogo || []).forEach((ac: any) => {
      if (!ac.nome) return;
      const qta = ac.quantita || 1;
      const p = ac.prezzoUnitario || 0;
      const desc = [ac.nome, ac.colore].filter(Boolean).join(" ");
      rows += `<tr style="background:#fafafa"><td></td><td style="font-size:11px;color:#555;padding-left:16px">↳ ${desc}</td><td class="num" style="font-size:11px;color:#555">${qta}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p)}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p*qta)}</td></tr>`;
    });
    // Voci libere vano
    (v.vociLibere || []).forEach((vl: any) => {
      if (!vl.desc) return;
      const qta = vl.qta || 1;
      const p = vl.prezzo || 0;
      rows += `<tr style="background:#fafafa"><td></td><td style="font-size:11px;color:#555;padding-left:16px">↳ ${vl.desc}</td><td class="num" style="font-size:11px;color:#555">${qta}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p)}</td><td class="num" style="font-size:11px;color:#555">€ ${fmt(p*qta)}</td></tr>`;
    });

    return rows;
  }).join("");

  const vociLibHTML = (c.vociLibere || []).map((vl: any) => `
    <tr>
      <td>—</td>
      <td>${vl.desc || vl.descrizione || "Voce aggiuntiva"}</td>
      <td class="num">${vl.qta || 1}</td>
      <td class="num">€ ${fmt(vl.importo || 0)}</td>
      <td class="num bold">€ ${fmt((vl.importo || 0) * (vl.qta || 1))}</td>
    </tr>`).join("");

  // ─── Condizioni commerciali — prima da Settings azienda, poi da commessa ───
  const condPag = az.condPagamento || c.condPagamento || "";
  const condConsegna = az.condConsegna || c.tempiConsegna || "";
  const condFornitura = az.condFornitura || "";
  const condContratto = az.condContratto || c.garanzia || "";
  const condDettagli = az.condDettagli || "";
  const dataPrevConsegna = c.dataPrevConsegna || "";

  const condizioniHTML = (condPag || condConsegna || condFornitura || condContratto || condDettagli || dataPrevConsegna) ? `
    <div class="condizioni-grid">
      ${condPag ? `<div class="cond-item"><div class="label">💳 Condizioni di pagamento</div><div class="cond-val" style="white-space:pre-wrap">${condPag}</div></div>` : ""}
      ${condConsegna ? `<div class="cond-item"><div class="label">📦 Tempi di consegna</div><div class="cond-val" style="white-space:pre-wrap">${condConsegna}</div></div>` : ""}
      ${condFornitura ? `<div class="cond-item"><div class="label">📋 Condizioni di fornitura</div><div class="cond-val" style="white-space:pre-wrap">${condFornitura}</div></div>` : ""}
      ${condContratto ? `<div class="cond-item"><div class="label">🛡 Garanzia e contratto</div><div class="cond-val" style="white-space:pre-wrap">${condContratto}</div></div>` : ""}
      ${condDettagli ? `<div class="cond-item" style="grid-column:1/-1"><div class="label">📄 Documenti alla consegna</div><div class="cond-val" style="white-space:pre-wrap">${condDettagli}</div></div>` : ""}
      ${dataPrevConsegna ? `<div class="cond-item"><div class="label">📅 Data prevista consegna</div><div class="cond-val">${new Date(dataPrevConsegna).toLocaleDateString("it-IT")}</div></div>` : ""}
    </div>` : "";

  // ─── Note ───
  const noteHTML = c.notePreventivo ? `
    <div class="note-box">
      <div class="label">Note e condizioni particolari</div>
      <div style="margin-top:6px;line-height:1.6;font-size:13px;white-space:pre-wrap">${c.notePreventivo}</div>
    </div>` : "";

  // ─── Firma ───
  const firmaHTML = c.firmaCliente ? `
    <div class="firma-box">
      <div class="firma-header">
        <div>
          <div class="label">Documento firmato da</div>
          <div class="firma-nome">${c.cliente || ""}${c.cognome ? " " + c.cognome : ""}</div>
          ${c.dataFirma ? `<div style="font-size:12px;color:#166534;margin-top:2px">Data firma: ${c.dataFirma}</div>` : ""}
        </div>
        <div style="font-size:22px">✅</div>
      </div>
      <img src="${c.firmaCliente}" alt="Firma cliente" style="max-height:70px;margin-top:12px;border:1px solid #bbf7d0;border-radius:8px;padding:6px;display:block;" />
    </div>` : `
    <div class="firma-attesa" style="background:#f9f9fb">
      <div class="label">Firma cliente</div>
      <div style="border:2px dashed #d0d0d0;border-radius:10px;height:60px;margin-top:8px;display:flex;align-items:center;justify-content:center;color:#86868b;font-size:12px">
        In attesa di firma
      </div>
      <div style="margin-top:12px;display:flex;justify-content:space-between;border-top:1px solid #e5e5ea;padding-top:12px;font-size:12px;color:#86868b">
        <span>Luogo e data: _________________</span>
        <span>Firma: _________________</span>
      </div>
    </div>`;

  // ─── Acconto box ───
  const accontoHTML = acconto > 0 ? `
    <div style="margin-top:8px;background:#f0fdf4;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;color:#166534;font-size:13px;font-weight:700">
      <span>Acconto ricevuto</span><span>− € ${fmt(acconto)}</span>
    </div>
    <div style="margin-top:6px;background:#fff;border:2px solid #166534;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;color:#166534;font-size:15px;font-weight:800">
      <span>Saldo da incassare</span><span>€ ${fmt(totIva - acconto)}</span>
    </div>` : "";

  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Conferma d'Ordine ${c.code || ""} — ${az.ragione || az.nome || "MASTRO"}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f9f9fb; padding: 32px 16px; color: #1a1c1d; -webkit-font-smoothing: antialiased; }
    .card { background: #fff; border-radius: 24px; max-width: 720px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 40px rgba(3,22,49,0.10); border: 1px solid rgba(197,198,206,0.3); }
    .topbar { background: #031631; padding: 22px 28px; display: flex; justify-content: space-between; align-items: center; }
    .logo-wrap { display: flex; align-items: center; gap: 14px; }
    .logo { width: 42px; height: 42px; background: #1a2b47; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 19px; font-weight: 900; color: #fff; letter-spacing: -0.04em; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; }
    .az-nome { color: #fff; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; }
    .az-sub { color: #8293b4; font-size: 11px; margin-top: 3px; }
    .tag { background: #fff; color: #031631; font-size: 11px; font-weight: 800; padding: 7px 16px; border-radius: 9999px; letter-spacing: 0.08em; text-transform: uppercase; }
    .body { padding: 32px 28px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 32px; }
    .info-box { background: #f3f3f5; border-radius: 14px; padding: 18px; }
    .label { font-size: 9px; font-weight: 700; color: #75777e; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.15em; }
    .info-box .value { font-size: 16px; font-weight: 800; color: #1a1c1d; letter-spacing: -0.02em; }
    .info-box .sub { font-size: 12px; color: #44474d; margin-top: 4px; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 4px; }
    th { background: #031631; color: #fff; padding: 11px 14px; text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
    th.num, td.num { text-align: right; }
    td { padding: 12px 14px; border-bottom: 1px solid rgba(197,198,206,0.2); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #f9f9fb; }
    .bold { font-weight: 700; }
    .totali { margin-top: 24px; border: 1px solid rgba(197,198,206,0.25); border-radius: 14px; overflow: hidden; }
    .tot-row { display: flex; justify-content: space-between; padding: 11px 16px; font-size: 13px; border-bottom: 1px solid rgba(197,198,206,0.2); background: #fff; color: #44474d; }
    .tot-row:last-child { border-bottom: none; }
    .tot-final { background: #031631; color: #fff; padding: 16px 18px; display: flex; justify-content: space-between; font-size: 17px; font-weight: 800; letter-spacing: -0.02em; font-family: 'JetBrains Mono', monospace; }
    .condizioni-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
    .cond-item { background: #f3f3f5; border-radius: 10px; padding: 12px 14px; }
    .cond-val { font-size: 13px; font-weight: 600; margin-top: 4px; color: #1a1c1d; }
    .note-box { background: #f3f3f5; border-radius: 12px; padding: 16px; margin-top: 16px; }
    .firma-box { background: #f0fdf4; border: 1.5px solid #1a9e73; border-radius: 14px; padding: 18px; margin-top: 20px; }
    .firma-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .firma-nome { font-size: 15px; font-weight: 700; color: #085041; margin-top: 4px; }
    .firma-attesa { border: 1.5px dashed rgba(197,198,206,0.5); border-radius: 14px; padding: 18px; margin-top: 20px; text-align: center; color: #75777e; font-size: 13px; }
    .sezione-title { font-size: 10px; font-weight: 700; color: #75777e; text-transform: uppercase; letter-spacing: 0.15em; margin: 28px 0 12px; }
    .footer { padding: 18px 28px; border-top: 1px solid rgba(197,198,206,0.2); text-align: center; font-size: 11px; color: #75777e; background: #f9f9fb; }
    .cf-box { font-size: 11px; color: #75777e; margin-top: 4px; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    @media print { body { background: white; padding: 0; } .card { box-shadow: none; border-radius: 0; max-width: 100%; } }
    @media (max-width: 500px) { .info-grid, .condizioni-grid { grid-template-columns: 1fr; } body { padding: 0; } .card { border-radius: 0; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="topbar">
      <div class="logo-wrap">
        ${az.logo_url ? `<img src="${az.logo_url}" style="width:42px;height:42px;border-radius:12px;object-fit:cover;" />` : `<div class="logo">M</div>`}
        <div>
          <div class="az-nome">${az.ragione || az.nome || "MASTRO ERP"}</div>
          <div class="az-sub">${[az.indirizzo, az.telefono, az.piva ? "P.IVA " + az.piva : ""].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
      <div class="tag">Conferma d'ordine</div>
    </div>

    <div class="body">
      <div class="info-grid">
        <div class="info-box">
          <div class="label">Cliente</div>
          <div class="value">${c.cliente || ""}${c.cognome ? " " + c.cognome : ""}</div>
          <div class="sub">${c.indirizzo || ""}</div>
          ${c.telefono ? `<div class="sub">${c.telefono}</div>` : ""}
          ${c.email ? `<div class="sub">${c.email}</div>` : ""}
          ${c.cf ? `<div class="cf-box">C.F. ${c.cf}</div>` : ""}
        </div>
        <div class="info-box">
          <div class="label">Riferimento ordine</div>
          <div class="value">${c.code || "—"}</div>
          <div class="sub">Data: ${new Date().toLocaleDateString("it-IT")}</div>
          ${c.sistema ? `<div class="sub">Sistema: ${c.sistema}</div>` : ""}
          ${c.detrazione && c.detrazione !== "nessuna" ? `<div class="sub" style="color:#D08008;font-weight:700">Detrazione: ${c.detrazione}%</div>` : ""}
        </div>
      </div>

      <div class="sezione-title">Descrizione lavori</div>
      <table>
        <thead>
          <tr>
            <th style="width:30px">#</th>
            <th>Descrizione</th>
            <th class="num" style="width:40px">Q.tà</th>
            <th class="num" style="width:90px">Prezzo unit.</th>
            <th class="num" style="width:90px">Totale</th>
          </tr>
        </thead>
        <tbody>
          ${righeHTML}
          ${vociLibHTML}
        </tbody>
      </table>

      <div class="totali">
        ${scontoPerc > 0 ? `<div class="tot-row"><span>Subtotale</span><span>€ ${fmt(totBase)}</span></div><div class="tot-row" style="color:#D08008"><span>Sconto ${scontoPerc}%</span><span>− € ${fmt(sconto)}</span></div>` : ""}
        <div class="tot-row"><span>Imponibile</span><span>€ ${fmt(imponibile)}</span></div>
        <div class="tot-row"><span>IVA ${ivaPerc}%</span><span>€ ${fmt(iva)}</span></div>
        <div class="tot-final">
          <span>TOTALE IVA INCLUSA</span>
          <span>€ ${fmt(totIva)}</span>
        </div>
      </div>
      ${accontoHTML}

      ${condizioniHTML ? `<div class="sezione-title">Condizioni commerciali</div>${condizioniHTML}` : ""}
      ${noteHTML}

      <div class="sezione-title">Accettazione ordine</div>
      ${firmaHTML}
    </div>

    <div class="footer">
      ${az.ragione || az.nome || "MASTRO ERP"}${az.piva ? " &nbsp;·&nbsp; P.IVA " + az.piva : ""}${az.email ? " &nbsp;·&nbsp; " + az.email : ""}<br>
      <span style="color:#aaa">Documento generato il ${new Date().toLocaleString("it-IT")}</span>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  return url;
}


// ─────────────────────────────────────────────────────────
// ESTRAI DATI DA PDF (conferma fornitore)
// Legge testo grezzo da un PDF caricato e restituisce
// un oggetto con i dati estratti per pre-compilare l'ordine
// ─────────────────────────────────────────────────────────
export async function estraiDatiPDF(file: File): Promise<Record<string, any>> {
  // Estrazione base: legge testo dal PDF usando FileReader
  // Per un'estrazione più precisa integrare pdf.js in futuro
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string || "";

      // Pattern comuni in conferme d'ordine italiane
      const result: Record<string, any> = {
        rawText: text.slice(0, 2000),
        estratto: true,
      };

      // Importo totale
      const totMatch = text.match(/totale[:\s]+€?\s*([\d.,]+)/i);
      if (totMatch) result.importoTotale = parseFloat(totMatch[1].replace(".", "").replace(",", "."));

      // Data consegna
      const consMatch = text.match(/consegna[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i);
      if (consMatch) result.dataConsegna = consMatch[1];

      // Numero ordine/conferma
      const numMatch = text.match(/n[°.]\s*(\d+\/\d+|\d+)/i);
      if (numMatch) result.numeroRiferimento = numMatch[1];

      // Settimane consegna
      const settMatch = text.match(/(\d+)\s*settiman/i);
      if (settMatch) result.settimaneConsegna = parseInt(settMatch[1]);

      resolve(result);
    };
    reader.onerror = () => resolve({ errore: "Impossibile leggere il file", estratto: false });
    reader.readAsText(file, "utf-8");
  });
}
