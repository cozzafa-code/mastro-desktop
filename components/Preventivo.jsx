// ============================================================
// MASTRO SUITE — Preventivo.jsx
// Componente completo: configuratore vano + disegno libero + PDF engine
// Stack: Next.js 14 + Supabase + Vercel
// Design System: Inter, bg #F2F1EC, amber #D08008, green #1A9E73
// ============================================================

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Dati mock (in prod arrivano da Supabase) ────────────────────────────────
const COMMESSA_MOCK = {
  id: 'CM-9353',
  numero: 'PRV-2024-047',
  data: '13/03/2026',
  validita: '13/04/2026',
  azienda: {
    nome: 'Walter Cozza Serramenti SRL',
    indirizzo: 'Via Roma 12, 87100 Cosenza (CS)',
    piva: 'IT01234567890',
    tel: '+39 0984 123456',
    email: 'info@cozzaserramenti.it',
    logo: null,
  },
  cliente: {
    nome: 'Mario Rossi',
    indirizzo: 'Via Nazionale 45, 87010 Montalto Uffugo (CS)',
    tel: '+39 333 1234567',
    email: 'mario.rossi@email.it',
    cf: 'RSSMRA80A01F839Y',
  },
  cantiere: 'Via Nazionale 45, Montalto Uffugo',
  praticaFiscale: 'nessuna',
  ivaAliquota: 10,
  scontoGlobale: 0,
  vani: [
    {
      id: 1,
      nome: 'Vano 1',
      tipo: 'F2A',
      larghezza: 1111,
      altezza: 1111,
      spessoreMuro: 300,
      lucenetta: 1050,
      quotaDavanzale: 900,
      nPezzi: 6,
      piano: 'P.T.',
      posizione: 'Soggiorno',
      apertura: 'Anta/Ribalta',
      versoapertura: 'Sinistro',
      coloreEsterno: 'Bianco',
      profilo: 'Aluplast 70mm',
      vetro: '4/16/4 Ar basso-e',
      uw: 1.4,
      fornitore: 'Aluplast',
      prezzoUnitario: 361.87,
      tapparella: { tipo: 'RAL 7016 Mot.', inclusa: true },
      zanzariera: { tipo: 'Plisse bianco', inclusa: true },
      accessori: [
        { id: 'a1', nome: 'Martellina Karma DK', codice: '3060', prezzo: 18.0, attiva: true, colore: 'Bianco' },
        { id: 'a2', nome: 'Martellina Karma DK con chiave', codice: '3060K', prezzo: 25.0, attiva: false, colore: 'Bianco' },
        { id: 'a3', nome: 'Martellina Karma Ribassata', codice: '3060R', prezzo: 20.0, attiva: false, colore: 'Bianco' },
        { id: 'a4', nome: 'Doppia Maniglia Karma', codice: '3067', prezzo: 32.0, attiva: true, colore: 'Bianco' },
        { id: 'a5', nome: 'Cremonese Karma Apertura Esterna', codice: '6065', prezzo: 28.0, attiva: true, colore: 'Bianco' },
        { id: 'a6', nome: 'Cremonese Karma Standard', codice: '6060', prezzo: 22.0, attiva: false, colore: 'Bianco' },
        { id: 'a7', nome: 'Cremonese Karma Logica', codice: '6060L', prezzo: 35.0, attiva: true, colore: 'Bianco' },
        { id: 'a8', nome: 'Martellina Karma Minimal Design', codice: '3060MD', prezzo: 22.0, attiva: false, colore: 'Bianco' },
      ],
      coloreManiglie: 'Bianco RAL 9016',
      coloreCremonesi: 'Bianco RAL 9016',
      coloreZanzariera: 'Bianco',
      posa: 'Inclusa',
      smontaggio: 'Non richiesto',
      smaltimento: 'Non incluso',
      prezzoPosa: 0,
      noteVano: '',
      disegno: null, // base64 PNG dal canvas
      quote: [],    // [{x1,y1,x2,y2,valore}]
    },
  ],
  vociExtra: [],
  noteCommessa: '',
};

const PRATICHE = ['nessuna', 'ristrutturazione50', 'ecobonus65', 'barriere75'];
const PRATICHE_LABEL = {
  nessuna: 'Nessuna',
  ristrutturazione50: 'Ristrutturazione 50%',
  ecobonus65: 'Ecobonus 65%',
  barriere75: 'Barriere 75%',
};
const IVA_OPTS = [4, 10, 22];
const SCONTO_OPTS = [0, 5, 10, 15, 20];
const TIPI_VANO = ['F2A', 'F1', 'PF', 'PF-sc', 'Fisso', 'Vasistas', 'Scorrevole', 'Bilico'];
const APERTURE = ['Anta/Ribalta', 'Solo anta', 'Solo ribalta', 'Bilico', 'Scorrevole'];
const PROFILI = ['Aluplast 70mm', 'Aluplast 82mm', 'Rehau 70mm', 'Veka 82mm', 'Kommerling 76mm'];
const VETRI = ['4/16/4 Ar basso-e', '4/12/4 std', '4/20/4 Ar triplo', '4/16/4 basso-e triplo', 'Personalizzato'];
const FORNITORI = ['Aluplast', 'Rehau', 'Veka', 'Kommerling', 'Schuco'];
const COLORI_STD = ['Bianco RAL 9016', 'RAL 7016 Antracite', 'RAL 9005 Nero', 'Inox F9', 'Oro', 'Bronzo', 'Personalizzato'];
const TIPI_TAPPARELLA = ['RAL 7016 Mot.', 'Bianco Mot.', 'RAL 7016 Man.', 'Bianco Man.', 'Non inclusa'];
const TIPI_ZANZARIERA = ['Plisse bianco', 'Plisse antracite', 'Avvolgibile', 'Laterale', 'Non inclusa'];

// ─── Calcoli ─────────────────────────────────────────────────────────────────
function calcolaVano(vano) {
  const base = vano.prezzoUnitario * vano.nPezzi;
  const accessoriAttivi = vano.accessori.filter((a) => a.attiva);
  const totAcc = accessoriAttivi.reduce((s, a) => s + a.prezzo, 0);
  const totPosa = Number(vano.prezzoPosa) || 0;
  return base + totAcc + totPosa;
}

function calcolaTotale(commessa) {
  const subtotal = commessa.vani.reduce((s, v) => s + calcolaVano(v), 0);
  const vociExtra = commessa.vociExtra.reduce((s, v) => s + (Number(v.prezzo) || 0), 0);
  const lordo = subtotal + vociExtra;
  const sconto = lordo * (commessa.scontoGlobale / 100);
  const imponibile = lordo - sconto;
  const iva = imponibile * (commessa.ivaAliquota / 100);
  const totale = imponibile + iva;
  return { subtotal, vociExtra, lordo, sconto, imponibile, iva, totale };
}

function fmt(n) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);
}

// ─── PDF ENGINE ──────────────────────────────────────────────────────────────
// Importato dinamicamente per evitare SSR issues in Next.js
async function generaPDF(commessa, tipo = 'preventivo', firmaDataUrl = null) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totali = calcolaTotale(commessa);
  const W = 210;
  const MARGIN = 14;
  const GREEN = [26, 158, 115];
  const DARK = [26, 26, 28];
  const GRAY = [100, 100, 100];
  const LIGHT = [242, 241, 236];
  const AMBER = [208, 128, 8];

  // ── Intestazione topbar ───────────────────────────────────────────
  doc.setFillColor(...DARK);
  doc.rect(0, 0, W, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MASTRO', MARGIN, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const titoloDoc =
    tipo === 'preventivo'
      ? 'PREVENTIVO'
      : tipo === 'conferma'
      ? 'CONFERMA D\'ORDINE'
      : 'ORDINE FORNITORE';
  doc.text(titoloDoc, W / 2, 12, { align: 'center' });
  doc.text(commessa.numero, W - MARGIN, 12, { align: 'right' });

  // ── Dati azienda + cliente ────────────────────────────────────────
  let y = 24;
  doc.setFillColor(...LIGHT);
  doc.rect(MARGIN, y, 85, 32, 'F');
  doc.rect(W - MARGIN - 85, y, 85, 32, 'F');

  doc.setTextColor(...GREEN);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('AZIENDA', MARGIN + 3, y + 5);
  doc.text('CLIENTE', W - MARGIN - 85 + 3, y + 5);

  doc.setTextColor(...DARK);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(commessa.azienda.nome, MARGIN + 3, y + 11);
  doc.text(commessa.cliente.nome, W - MARGIN - 85 + 3, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  const azLines = [
    commessa.azienda.indirizzo,
    `P.IVA: ${commessa.azienda.piva}`,
    commessa.azienda.tel,
    commessa.azienda.email,
  ];
  const clLines = [
    commessa.cliente.indirizzo,
    `C.F.: ${commessa.cliente.cf}`,
    commessa.cliente.tel,
    commessa.cliente.email,
  ];
  azLines.forEach((l, i) => doc.text(l, MARGIN + 3, y + 17 + i * 4));
  clLines.forEach((l, i) => doc.text(l, W - MARGIN - 85 + 3, y + 17 + i * 4));

  // ── Dati commessa (data, cantiere, pratica) ───────────────────────
  y += 38;
  doc.setFillColor(...GREEN);
  doc.rect(MARGIN, y, W - MARGIN * 2, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const metaItems = [
    `Data: ${commessa.data}`,
    `Validita: ${commessa.validita}`,
    `Cantiere: ${commessa.cantiere}`,
    `Pratica: ${PRATICHE_LABEL[commessa.praticaFiscale]}`,
    `IVA: ${commessa.ivaAliquota}%`,
  ];
  const colW = (W - MARGIN * 2) / metaItems.length;
  metaItems.forEach((item, i) => {
    doc.text(item, MARGIN + colW * i + colW / 2, y + 4, { align: 'center' });
  });

  // ── Vani ──────────────────────────────────────────────────────────
  y += 10;
  commessa.vani.forEach((vano, vi) => {
    const totVano = calcolaVano(vano);

    // Header vano
    doc.setFillColor(...DARK);
    doc.rect(MARGIN, y, W - MARGIN * 2, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`${vano.nome} — ${vano.tipo} · ${vano.nPezzi} pz · ${vano.larghezza}×${vano.altezza}mm · ${vano.coloreEsterno}`, MARGIN + 3, y + 5.5);
    doc.text(fmt(totVano), W - MARGIN - 3, y + 5.5, { align: 'right' });
    y += 10;

    // Tabella misure e caratteristiche
    const specsData = [
      ['Larghezza', `${vano.larghezza} mm`, 'Altezza', `${vano.altezza} mm`, 'Spessore muro', `${vano.spessoreMuro} mm`],
      ['Luce netta', `${vano.lucenetta} mm`, 'Davanzale', `${vano.quotaDavanzale} mm`, 'Piano', vano.piano],
      ['Apertura', vano.apertura, 'Verso', vano.versoapertura, 'Posizione', vano.posizione],
      ['Profilo', vano.profilo, 'Vetro', vano.vetro, 'Uw', `${vano.uw} W/m²K`],
      ['Fornitore', vano.fornitore, 'Tapparella', vano.tapparella.tipo, 'Zanzariera', vano.zanzariera.tipo],
    ];

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      body: specsData,
      theme: 'grid',
      styles: { fontSize: 7, cellPadding: 1.5, textColor: DARK },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: GRAY, fillColor: [250, 249, 244] },
        2: { fontStyle: 'bold', textColor: GRAY, fillColor: [250, 249, 244] },
        4: { fontStyle: 'bold', textColor: GRAY, fillColor: [250, 249, 244] },
      },
      didDrawPage: () => {},
    });
    y = doc.lastAutoTable.finalY + 3;

    // Tabella accessori attivi
    const accAttivi = vano.accessori.filter((a) => a.attiva);
    if (accAttivi.length > 0) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GREEN);
      doc.text('ACCESSORI INCLUSI', MARGIN, y + 3);
      y += 5;

      autoTable(doc, {
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [['Descrizione', 'Codice', 'Colore', 'Prezzo unitario', 'Qta', 'Totale']],
        body: [
          // Infisso
          [
            `Infisso ${vano.larghezza}×${vano.altezza}mm (${vano.profilo})`,
            '—',
            vano.coloreEsterno,
            fmt(vano.prezzoUnitario),
            `×${vano.nPezzi}`,
            fmt(vano.prezzoUnitario * vano.nPezzi),
          ],
          // Tapparella
          vano.tapparella.inclusa
            ? [`Tapparella ${vano.tapparella.tipo}`, '—', '—', 'incluso', '—', 'incluso']
            : null,
          // Zanzariera
          vano.zanzariera.inclusa
            ? [`Zanzariera ${vano.zanzariera.tipo}`, '—', vano.coloreZanzariera, 'incluso', '—', 'incluso']
            : null,
          // Accessori
          ...accAttivi.map((a) => [
            a.nome,
            a.codice,
            a.colore,
            fmt(a.prezzo),
            '×1',
            fmt(a.prezzo),
          ]),
          // Posa
          vano.prezzoPosa > 0
            ? ['Posa in opera', '—', '—', fmt(vano.prezzoPosa), '—', fmt(vano.prezzoPosa)]
            : null,
        ].filter(Boolean),
        foot: [[{ content: `Totale Vano ${vi + 1}`, colSpan: 5, styles: { fontStyle: 'bold', halign: 'right' } }, fmt(totVano)]],
        headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
        footStyles: { fillColor: LIGHT, textColor: DARK, fontSize: 7.5, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'center' },
          5: { halign: 'right', fontStyle: 'bold' },
        },
      });
      y = doc.lastAutoTable.finalY + 4;
    }

    // Disegno tecnico (se presente)
    if (vano.disegno) {
      try {
        const imgH = 55;
        const imgW = 80;
        if (y + imgH > 270) { doc.addPage(); y = 14; }
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GREEN);
        doc.text('DISEGNO TECNICO VANO', MARGIN, y + 3);
        y += 5;
        doc.setDrawColor(...GRAY);
        doc.rect(MARGIN, y, imgW, imgH);
        doc.addImage(vano.disegno, 'PNG', MARGIN + 1, y + 1, imgW - 2, imgH - 2);
        // Quote annotate
        if (vano.quote.length > 0) {
          doc.setFontSize(6.5);
          doc.setTextColor(...GRAY);
          doc.setFont('helvetica', 'italic');
          doc.text(
            `Quote: ${vano.quote.map((q) => q.valore + 'mm').join(' · ')}`,
            MARGIN + imgW + 5,
            y + 8
          );
        }
        y += imgH + 4;
      } catch (e) {
        // skip image errors
      }
    }

    // Note vano
    if (vano.noteVano) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...GRAY);
      doc.text(`Nota vano: ${vano.noteVano}`, MARGIN, y + 3);
      y += 7;
    }

    y += 3;
    if (y > 240 && vi < commessa.vani.length - 1) { doc.addPage(); y = 14; }
  });

  // ── Voci extra ────────────────────────────────────────────────────
  if (commessa.vociExtra.length > 0) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...AMBER);
    doc.text('VOCI EXTRA', MARGIN, y + 3);
    y += 5;
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Descrizione', 'Importo']],
      body: commessa.vociExtra.map((v) => [v.descrizione, fmt(v.prezzo)]),
      headStyles: { fillColor: AMBER, textColor: [255, 255, 255], fontSize: 7 },
      styles: { fontSize: 7 },
      columnStyles: { 1: { halign: 'right' } },
    });
    y = doc.lastAutoTable.finalY + 4;
  }

  // ── Totali ────────────────────────────────────────────────────────
  if (y > 230) { doc.addPage(); y = 14; }

  const totW = 90;
  const totX = W - MARGIN - totW;
  doc.setFillColor(...LIGHT);
  doc.rect(totX, y, totW, commessa.scontoGlobale > 0 ? 28 : 22, 'F');

  const totRows = [];
  if (commessa.scontoGlobale > 0) {
    totRows.push(['Subtotale', fmt(totali.lordo)]);
    totRows.push([`Sconto ${commessa.scontoGlobale}%`, `-${fmt(totali.sconto)}`]);
  }
  totRows.push([`Imponibile`, fmt(totali.imponibile)]);
  totRows.push([`IVA ${commessa.ivaAliquota}%`, fmt(totali.iva)]);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  totRows.forEach((r, i) => {
    doc.text(r[0], totX + 4, y + 6 + i * 5);
    doc.text(r[1], totX + totW - 4, y + 6 + i * 5, { align: 'right' });
  });

  const totaleY = y + 6 + totRows.length * 5 + 1;
  doc.setFillColor(...GREEN);
  doc.rect(totX, totaleY - 1, totW, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('TOTALE', totX + 4, totaleY + 5.5);
  doc.text(fmt(totali.totale), totX + totW - 4, totaleY + 5.5, { align: 'right' });

  y = totaleY + 14;

  // ── Note commessa ─────────────────────────────────────────────────
  if (commessa.noteCommessa) {
    doc.setFillColor(...LIGHT);
    doc.rect(MARGIN, y, W - MARGIN * 2, 18, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text('NOTE E CONDIZIONI', MARGIN + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(commessa.noteCommessa, W - MARGIN * 2 - 6);
    doc.text(noteLines, MARGIN + 3, y + 10);
    y += 22;
  }

  // ── Sezione firma (preventivo + conferma) ─────────────────────────
  if (tipo === 'preventivo' || tipo === 'conferma') {
    if (y > 235) { doc.addPage(); y = 14; }

    const isFirmaConferma = tipo === 'conferma';

    // Box condizioni
    doc.setFillColor(...LIGHT);
    doc.rect(MARGIN, y, W - MARGIN * 2, isFirmaConferma ? 14 : 10, 'F');
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...GRAY);
    const condizioni = isFirmaConferma
      ? 'Il sottoscritto, presa visione e accettazione del preventivo, conferma l\'ordine e autorizza la produzione secondo le specifiche indicate. I prezzi sono comprensivi di IVA. La presente conferma costituisce contratto vincolante ai sensi del Codice Civile italiano.'
      : 'Il presente preventivo e valido fino alla data indicata. I prezzi sono IVA esclusa salvo diversa indicazione. Per conferma ordine richiedere apposito modulo di accettazione.';
    const condizioniLines = doc.splitTextToSize(condizioni, W - MARGIN * 2 - 6);
    doc.text(condizioniLines, MARGIN + 3, y + 5);
    y += isFirmaConferma ? 18 : 14;

    // Colonne firma
    const firmaBoxH = isFirmaConferma && firmaDataUrl ? 52 : 28;
    const col1X = MARGIN;
    const col2X = W / 2 + 2;
    const colW2 = (W - MARGIN * 2 - 4) / 2;

    // Box timbro azienda
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.rect(col1X, y, colW2, firmaBoxH);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text('TIMBRO E FIRMA AZIENDA', col1X + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(commessa.azienda.nome, col1X + 3, y + 11);
    doc.text(`Data: ${commessa.data}`, col1X + 3, y + 16);

    // Box firma cliente
    doc.rect(col2X, y, colW2, firmaBoxH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(isFirmaConferma ? GREEN[0] : GRAY[0], isFirmaConferma ? GREEN[1] : GRAY[1], isFirmaConferma ? GREEN[2] : GRAY[2]);
    const labelFirma = isFirmaConferma ? 'FIRMA CLIENTE (accettazione ordine)' : 'FIRMA CLIENTE (per accettazione)';
    doc.text(labelFirma, col2X + 3, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(commessa.cliente.nome, col2X + 3, y + 11);

    // Se conferma d'ordine e firma digitale presente
    if (isFirmaConferma && firmaDataUrl) {
      try {
        doc.addImage(firmaDataUrl, 'PNG', col2X + 3, y + 16, colW2 - 6, 28);
        doc.setFontSize(6);
        doc.setTextColor(...GREEN);
        doc.setFont('helvetica', 'bold');
        doc.text('Firma digitale acquisita', col2X + 3, y + firmaBoxH - 3);
      } catch (e) {}
    } else {
      // Riga firma vuota
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.5);
      doc.line(col2X + 3, y + firmaBoxH - 8, col2X + colW2 - 3, y + firmaBoxH - 8);
      doc.setFontSize(6);
      doc.setTextColor(...GRAY);
      doc.text('Data e firma', col2X + 3, y + firmaBoxH - 3);
    }

    // Privacy / GDPR
    y += firmaBoxH + 4;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(180, 180, 180);
    doc.text(
      'Informativa privacy (D.Lgs. 196/2003 e GDPR 679/2016): i dati personali sono trattati ai soli fini contrattuali. Titolare: ' + commessa.azienda.nome,
      MARGIN, y
    );
    y += 4;

    // Clausole vessatorie (da approvare esplicitamente in conferma)
    if (isFirmaConferma) {
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...GRAY);
      doc.text('Approvazione clausole ex artt. 1341-1342 c.c.:', MARGIN, y + 4);
      doc.setFont('helvetica', 'normal');
      doc.text('Art. 5 (Termini di consegna), Art. 7 (Limitazione responsabilita), Art. 9 (Foro competente Cosenza)', MARGIN, y + 9);
      doc.setDrawColor(150, 150, 150);
      doc.line(W - MARGIN - 60, y + 14, W - MARGIN, y + 14);
      doc.text('Firma cliente', W - MARGIN - 58, y + 18);
      y += 22;
    }
  }

  // ── Footer pagine ─────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...DARK);
    doc.rect(0, 287, W, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${commessa.azienda.nome} — ${commessa.azienda.email} — ${commessa.azienda.tel}`, MARGIN, 293);
    doc.text(`Pag. ${i}/${pageCount} — ${commessa.numero}`, W - MARGIN, 293, { align: 'right' });
  }

  return doc;
}

// ─── CANVAS FIRMA ─────────────────────────────────────────────────────────────
function FirmaCanvas({ onSave, onClose }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1A1A1C';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  function getPos(e, canvas) {
    const r = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  function startDraw(e) {
    e.preventDefault();
    drawing.current = true;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const p = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function moveDraw(e) {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const p = getPos(e, canvas);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function endDraw() { drawing.current = false; }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function save() {
    const canvas = canvasRef.current;
    onSave(canvas.toDataURL('image/png'));
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 480, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, color: '#1A1A1C' }}>Firma cliente — Conferma ordine</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888' }}>✕</button>
        </div>
        <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
          Il cliente firma qui per accettare il preventivo e autorizzare la produzione.
        </p>
        <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
          <canvas
            ref={canvasRef}
            width={432}
            height={140}
            style={{ display: 'block', cursor: 'crosshair', touchAction: 'none' }}
            onMouseDown={startDraw}
            onMouseMove={moveDraw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={moveDraw}
            onTouchEnd={endDraw}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={clear} style={{ flex: 1, padding: '8px', border: '0.5px solid #ddd', borderRadius: 8, background: '#f5f5f5', cursor: 'pointer', fontSize: 13 }}>Cancella</button>
          <button onClick={save} style={{ flex: 2, padding: '8px', background: '#1A9E73', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>Salva firma e genera PDF</button>
        </div>
      </div>
    </div>
  );
}

// ─── CANVAS DISEGNO VANO ─────────────────────────────────────────────────────
function DisegnoCanvas({ vano, onSave }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ tool: 'pen', color: '#1A1A1C', lineWidth: 2, drawing: false, startX: 0, startY: 0, snapshot: null, history: [], arrowStart: null, showGrid: false, bgImage: null, quotes: [] });
  const [activeTool, setActiveTool] = useState('pen');
  const [activeColor, setActiveColor] = useState('#1A1A1C');
  const [activeSize, setActiveSize] = useState(2);
  const [showGrid, setShowGrid] = useState(false);
  const [quoteInput, setQuoteInput] = useState('');
  const [showQuotePopup, setShowQuotePopup] = useState(false);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const s = stateRef.current;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.parentElement.clientWidth - 2;
    canvas.height = Math.round(canvas.width * 0.58);
    initCanvas();
  }, []);

  function initCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid(ctx, canvas);
    // placeholder
    ctx.strokeStyle = 'rgba(26,158,115,0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    const m = 50;
    ctx.strokeRect(m, m, canvas.width - m * 2, canvas.height - m * 2);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(26,158,115,0.05)';
    ctx.fillRect(m, m, canvas.width - m * 2, canvas.height - m * 2);
    ctx.fillStyle = 'rgba(150,150,150,0.6)';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Disegno Vano: ${vano.larghezza}×${vano.altezza}mm — ${vano.tipo}`, canvas.width / 2, canvas.height / 2);
  }

  function drawGrid(ctx, canvas) {
    if (!s.showGrid) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(180,180,180,0.25)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
    for (let y = 0; y < canvas.height; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }
    ctx.restore();
  }

  function snap(v) { return s.showGrid ? Math.round(v / 20) * 20 : v; }

  function getPos(e) {
    const r = canvasRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - r.left, y: src.clientY - r.top };
  }

  function saveHistory() {
    s.history.push(canvasRef.current.toDataURL());
    if (s.history.length > 40) s.history.shift();
  }

  function handleMouseDown(e) {
    e.preventDefault();
    const p = getPos(e);
    const x = snap(p.x), y = snap(p.y);
    s.startX = x; s.startY = y;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (s.tool === 'arrow') {
      if (!s.arrowStart) {
        s.arrowStart = { x, y };
      } else {
        saveHistory();
        drawArrow(ctx, s.arrowStart.x, s.arrowStart.y, x, y, null);
        setPopupPos({ x: (s.arrowStart.x + x) / 2, y: (s.arrowStart.y + y) / 2 });
        setShowQuotePopup(true);
        s.pendingArrow = { a: s.arrowStart, b: { x, y } };
        s.arrowStart = null;
      }
      return;
    }
    if (s.tool === 'text') {
      const txt = prompt('Testo / quota:');
      if (txt) { saveHistory(); ctx.fillStyle = s.color; ctx.font = `${10 + s.lineWidth * 2}px sans-serif`; ctx.fillText(txt, x, y); }
      return;
    }
    s.drawing = true;
    saveHistory();
    s.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (s.tool === 'pen' || s.tool === 'eraser') { ctx.beginPath(); ctx.moveTo(x, y); }
  }

  function handleMouseMove(e) {
    e.preventDefault();
    if (!s.drawing) return;
    const p = getPos(e);
    const x = snap(p.x), y = snap(p.y);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (s.tool === 'pen') {
      ctx.strokeStyle = s.color; ctx.lineWidth = s.lineWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineTo(x, y); ctx.stroke();
    } else if (s.tool === 'eraser') {
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s.lineWidth * 6; ctx.lineCap = 'round';
      ctx.lineTo(x, y); ctx.stroke();
    } else {
      ctx.putImageData(s.snapshot, 0, 0);
      ctx.save(); ctx.strokeStyle = s.color; ctx.lineWidth = s.lineWidth;
      if (s.tool === 'line') { ctx.beginPath(); ctx.moveTo(s.startX, s.startY); ctx.lineTo(x, y); ctx.stroke(); }
      else if (s.tool === 'rect') { ctx.fillStyle = s.color + '18'; ctx.beginPath(); ctx.rect(s.startX, s.startY, x - s.startX, y - s.startY); ctx.stroke(); ctx.fill(); }
      ctx.restore();
    }
  }

  function handleMouseUp() { s.drawing = false; s.snapshot = null; }

  function drawArrow(ctx, x1, y1, x2, y2, label) {
    ctx.save();
    ctx.strokeStyle = '#3B7FE0'; ctx.fillStyle = '#3B7FE0'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const angle = Math.atan2(y2 - y1, x2 - x1);
    [{ px: x1, py: y1, offset: Math.PI }, { px: x2, py: y2, offset: 0 }].forEach(({ px, py, offset }) => {
      const a = angle + offset;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - 8 * Math.cos(a - 0.4), py - 8 * Math.sin(a - 0.4));
      ctx.lineTo(px - 8 * Math.cos(a + 0.4), py - 8 * Math.sin(a + 0.4));
      ctx.closePath(); ctx.fill();
    });
    if (label) {
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const tw = ctx.measureText(label).width + 10;
      ctx.fillStyle = '#fff'; ctx.strokeStyle = '#3B7FE0'; ctx.lineWidth = 1;
      ctx.fillRect(mx - tw / 2, my - 10, tw, 18); ctx.strokeRect(mx - tw / 2, my - 10, tw, 18);
      ctx.fillStyle = '#3B7FE0'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label, mx, my + 1);
    }
    ctx.restore();
  }

  function confirmQuota() {
    if (!quoteInput || !s.pendingArrow) return;
    const { a, b } = s.pendingArrow;
    const ctx = canvasRef.current.getContext('2d');
    saveHistory();
    drawArrow(ctx, a.x, a.y, b.x, b.y, quoteInput + 'mm');
    s.quotes.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, valore: quoteInput });
    setShowQuotePopup(false);
    setQuoteInput('');
  }

  function undo() {
    if (!s.history.length) return;
    const prev = s.history.pop();
    const img = new Image();
    img.onload = () => { canvasRef.current.getContext('2d').drawImage(img, 0, 0); };
    img.src = prev;
  }

  function clearAll() {
    if (!confirm('Cancellare il disegno?')) return;
    saveHistory();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    s.quotes = [];
    initCanvas();
  }

  function loadImage(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        saveHistory();
        s.bgImage = img;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save(); ctx.globalAlpha = 0.45;
        const ratio = Math.min(canvas.width / img.width, canvas.height / img.height);
        const w = img.width * ratio, h = img.height * ratio;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        ctx.restore();
        drawGrid(ctx, canvas);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function handleToggleGrid() {
    s.showGrid = !s.showGrid;
    setShowGrid(s.showGrid);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(img, 0, 0);
    drawGrid(ctx, canvas);
  }

  function handleSetTool(t) { s.tool = t; setActiveTool(t); s.arrowStart = null; }
  function handleSetColor(c) { s.color = c; setActiveColor(c); }
  function handleSetSize(sz) { s.lineWidth = sz; setActiveSize(sz); }

  function handleSave() {
    const dataUrl = canvasRef.current.toDataURL('image/png');
    onSave(dataUrl, s.quotes);
  }

  const COLORS = ['#1A1A1C', '#DC4444', '#3B7FE0', '#1A9E73', '#D08008'];
  const TOOLS = [
    { id: 'pen', label: '✏️', title: 'Matita libera' },
    { id: 'line', label: '╱', title: 'Linea retta' },
    { id: 'rect', label: '▭', title: 'Rettangolo' },
    { id: 'arrow', label: '↔', title: 'Freccia quota' },
    { id: 'text', label: 'T', title: 'Testo libero' },
    { id: 'eraser', label: '◻', title: 'Gomma' },
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', padding: 8, background: '#F2F1EC', borderRadius: 8, border: '0.5px solid #ddd', marginBottom: 8 }}>
        {TOOLS.map((t) => (
          <button
            key={t.id}
            title={t.title}
            onClick={() => handleSetTool(t.id)}
            style={{ width: 32, height: 32, border: '0.5px solid ' + (activeTool === t.id ? '#1A9E73' : '#ccc'), borderRadius: 6, background: activeTool === t.id ? '#1A9E73' : '#fff', color: activeTool === t.id ? '#fff' : '#333', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >{t.label}</button>
        ))}
        <div style={{ width: 1, height: 26, background: '#ddd', margin: '0 2px' }} />
        {COLORS.map((c) => (
          <div
            key={c}
            onClick={() => handleSetColor(c)}
            style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: activeColor === c ? '2.5px solid #1A1A1C' : '2px solid transparent' }}
          />
        ))}
        <div style={{ width: 1, height: 26, background: '#ddd', margin: '0 2px' }} />
        {[{ sz: 2, lbl: 'S' }, { sz: 4, lbl: 'M' }, { sz: 8, lbl: 'L' }].map(({ sz, lbl }) => (
          <button
            key={sz}
            onClick={() => handleSetSize(sz)}
            style={{ padding: '3px 10px', border: '0.5px solid ' + (activeSize === sz ? '#1A9E73' : '#ccc'), borderRadius: 6, fontSize: 11, cursor: 'pointer', background: activeSize === sz ? '#1A9E73' : '#fff', color: activeSize === sz ? '#fff' : '#666' }}
          >{lbl}</button>
        ))}
        <div style={{ width: 1, height: 26, background: '#ddd', margin: '0 2px' }} />
        <label title="Carica foto" style={{ width: 32, height: 32, border: '0.5px solid #ccc', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          📷<input type="file" accept="image/*" onChange={loadImage} style={{ display: 'none' }} />
        </label>
        <button
          title="Griglia snap"
          onClick={handleToggleGrid}
          style={{ width: 32, height: 32, border: '0.5px solid ' + (showGrid ? '#1A9E73' : '#ccc'), borderRadius: 6, background: showGrid ? '#1A9E73' : '#fff', color: showGrid ? '#fff' : '#333', cursor: 'pointer', fontSize: 14 }}
        >⊞</button>
        <div style={{ flex: 1 }} />
        <button onClick={undo} title="Annulla" style={{ width: 32, height: 32, border: '0.5px solid #ccc', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 14 }}>↩</button>
        <button onClick={clearAll} title="Cancella tutto" style={{ width: 32, height: 32, border: '0.5px solid #DC4444', borderRadius: 6, background: '#fff', color: '#DC4444', cursor: 'pointer', fontSize: 14 }}>✕</button>
      </div>

      {/* Canvas */}
      <div style={{ position: 'relative', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', background: '#fff', cursor: activeTool === 'eraser' ? 'cell' : activeTool === 'text' ? 'text' : 'crosshair' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', touchAction: 'none', width: '100%' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
        <div style={{ position: 'absolute', top: 8, left: 12, fontSize: 11, color: '#888', background: 'rgba(255,255,255,0.85)', padding: '2px 8px', borderRadius: 8, border: '0.5px solid #ddd', pointerEvents: 'none' }}>
          {vano.nome} — {vano.larghezza}×{vano.altezza}mm
        </div>
        {activeTool === 'arrow' && (
          <div style={{ position: 'absolute', top: 8, right: 12, fontSize: 11, color: '#3B7FE0', background: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: 8, border: '0.5px solid #3B7FE0' }}>
            {s.arrowStart ? 'Clicca secondo punto' : 'Clicca primo punto'}
          </div>
        )}
        {showQuotePopup && (
          <div style={{ position: 'absolute', left: Math.min(popupPos.x, 300), top: Math.max(popupPos.y - 60, 4), background: '#fff', border: '0.5px solid #ddd', borderRadius: 8, padding: '10px 14px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: 160 }}>
            <div style={{ fontSize: 11, color: '#666', fontWeight: 500, marginBottom: 6 }}>Inserisci quota (mm)</div>
            <input
              type="number"
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && confirmQuota()}
              style={{ width: '100%', padding: '5px 8px', border: '0.5px solid #ddd', borderRadius: 4, fontSize: 12, marginBottom: 6 }}
              autoFocus
            />
            <button onClick={confirmQuota} style={{ width: '100%', padding: '5px', background: '#1A9E73', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Aggiungi</button>
          </div>
        )}
      </div>
      <p style={{ fontSize: 11, color: '#aaa', textAlign: 'center', marginTop: 5 }}>
        Strumento ↔ = disegna freccia quota · 📷 = carica foto vano · ⊞ = snap griglia 20px
      </p>

      {/* Azioni disegno */}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={handleSave} style={{ flex: 2, padding: '9px', background: '#1A9E73', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', fontSize: 13 }}>
          Salva disegno nel preventivo
        </button>
        <button
          onClick={() => { const a = document.createElement('a'); a.href = canvasRef.current.toDataURL('image/png'); a.download = `disegno_${vano.nome}.png`; a.click(); }}
          style={{ flex: 1, padding: '9px', border: '0.5px solid #ddd', borderRadius: 8, background: '#F2F1EC', cursor: 'pointer', fontSize: 13 }}
        >Esporta PNG</button>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPALE ───────────────────────────────────────────────────
export default function Preventivo({ commessaInit = COMMESSA_MOCK, onSave }) {
  const [commessa, setCommessa] = useState(commessaInit);
  const [activeTab, setActiveTab] = useState('preventivo');
  const [vanoExpanded, setVanoExpanded] = useState({});
  const [disegnoOpen, setDisegnoOpen] = useState({});
  const [showFirma, setShowFirma] = useState(false);
  const [generando, setGenerando] = useState(null);
  const [savedMsg, setSavedMsg] = useState('');
  const [praticaOpen, setPraticaOpen] = useState(false);
  const [ivaOpen, setIvaOpen] = useState(false);
  const [docPratica, setDocPratica] = useState({ files: [], note: '', dataInizio: '', dataFine: '', importoDetraibile: '', tecnicoAsseveratore: '' });
  const [docIva, setDocIva] = useState({ files: [], note: '', motivazione: '', numeroFattura: '' });

  function addDocFile(tipo, file) {
    const entry = { id: Date.now(), nome: file.name, dimensione: (file.size / 1024).toFixed(0) + ' KB', dataCaricamento: new Date().toLocaleDateString('it-IT'), url: URL.createObjectURL(file) };
    if (tipo === 'pratica') setDocPratica((d) => ({ ...d, files: [...d.files, entry] }));
    else setDocIva((d) => ({ ...d, files: [...d.files, entry] }));
  }
  function removeDocFile(tipo, id) {
    if (tipo === 'pratica') setDocPratica((d) => ({ ...d, files: d.files.filter((f) => f.id !== id) }));
    else setDocIva((d) => ({ ...d, files: d.files.filter((f) => f.id !== id) }));
  }

  const totali = calcolaTotale(commessa);

  // ── Helper update immutabile ─────────────────────────────────────
  function updateCommessa(patch) { setCommessa((c) => ({ ...c, ...patch })); }

  function updateVano(vanoId, patch) {
    setCommessa((c) => ({
      ...c,
      vani: c.vani.map((v) => (v.id === vanoId ? { ...v, ...patch } : v)),
    }));
  }

  function toggleAccessorio(vanoId, accId) {
    setCommessa((c) => ({
      ...c,
      vani: c.vani.map((v) =>
        v.id === vanoId
          ? { ...v, accessori: v.accessori.map((a) => (a.id === accId ? { ...a, attiva: !a.attiva } : a)) }
          : v
      ),
    }));
  }

  function aggiungiVano() {
    const newId = Math.max(...commessa.vani.map((v) => v.id), 0) + 1;
    setCommessa((c) => ({
      ...c,
      vani: [
        ...c.vani,
        {
          id: newId, nome: `Vano ${newId}`, tipo: 'F2A', larghezza: 1000, altezza: 1200,
          spessoreMuro: 300, lucenetta: 940, quotaDavanzale: 900, nPezzi: 1,
          piano: 'P.T.', posizione: 'Soggiorno', apertura: 'Anta/Ribalta', versoapertura: 'Sinistro',
          coloreEsterno: 'Bianco', profilo: 'Aluplast 70mm', vetro: '4/16/4 Ar basso-e', uw: 1.4,
          fornitore: 'Aluplast', prezzoUnitario: 300, tapparella: { tipo: 'Non inclusa', inclusa: false },
          zanzariera: { tipo: 'Non inclusa', inclusa: false }, accessori: [], coloreManiglie: 'Bianco RAL 9016',
          coloreCremonesi: 'Bianco RAL 9016', coloreZanzariera: 'Bianco', posa: 'Inclusa',
          smontaggio: 'Non richiesto', smaltimento: 'Non incluso', prezzoPosa: 0, noteVano: '',
          disegno: null, quote: [],
        },
      ],
    }));
  }

  function aggiungiVoceExtra() {
    setCommessa((c) => ({ ...c, vociExtra: [...c.vociExtra, { id: Date.now(), descrizione: '', prezzo: 0 }] }));
  }

  function updateVoceExtra(id, patch) {
    setCommessa((c) => ({ ...c, vociExtra: c.vociExtra.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));
  }

  function rimuoviVoceExtra(id) {
    setCommessa((c) => ({ ...c, vociExtra: c.vociExtra.filter((v) => v.id !== id) }));
  }

    // ── PDF handlers ─────────────────────────────────────────────────
  async function scaricaPDF(commessa_id, tipo, filename) {
    const res = await fetch('/api/pdf/genera', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo, commessa_id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Errore sconosciuto' }));
      throw new Error(err.error || 'HTTP ' + res.status);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'MASTRO_' + tipo + '_' + commessa_id + '.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleGeneraPDF(tipo) {
    const TIPO_MAP = { preventivo: 'preventivo', conferma: 'conferma_b2b', fornitore: 'preventivo' };
    const tipoAPI = TIPO_MAP[tipo] || 'preventivo';
    const tipoFinale = (tipoAPI === 'conferma_b2b' && !commessa?.cliente?.partita_iva) ? 'conferma_b2c' : tipoAPI;
    setGenerando(tipo);
    try {
      const num = commessa.numero || commessa.id?.slice(0, 8).toUpperCase();
      await scaricaPDF(commessa.id, tipoFinale, 'MASTRO_' + tipoFinale + '_' + num + '.pdf');
      setSavedMsg('PDF ' + tipo + ' generato!');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (e) {
      console.error('[PDF]', e);
      alert('Errore generazione PDF: ' + e.message);
    }
    setGenerando(null);
  }

  async function handleFirmaConferma(firmaDataUrl) {
    setShowFirma(false);
    setGenerando('conferma');
    try {
      const tipoCliente = commessa?.cliente?.partita_iva ? 'conferma_b2b' : 'conferma_b2c';
      const num = commessa.numero || commessa.id?.slice(0, 8).toUpperCase();
      await scaricaPDF(commessa.id, tipoCliente, 'MASTRO_conferma_' + num + '.pdf');
      setSavedMsg("Conferma d'ordine generata!");
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (e) {
      console.error('[Conferma PDF]', e);
      alert('Errore: ' + e.message);
    }
    setGenerando(null);
  }

  // ── Salvataggio disegno nel vano ─────────────────────────────────
  function salvaDisegno(vanoId, dataUrl, quotes) {
    updateVano(vanoId, { disegno: dataUrl, quote: quotes });
    setSavedMsg('Disegno salvato nel preventivo');
    setTimeout(() => setSavedMsg(''), 3000);
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  const S = {
    page: { fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#1A1A1C', background: '#F2F1EC', minHeight: '100vh', padding: '0 0 3rem' },
    topbar: { background: '#1A1A1C', padding: '0 16px', display: 'flex', alignItems: 'stretch' },
    tab: (active) => ({ padding: '12px 18px', fontSize: 13, cursor: 'pointer', color: active ? '#1A9E73' : '#888', borderBottom: active ? '2px solid #1A9E73' : '2px solid transparent', fontWeight: active ? 500 : 400 }),
    card: { background: '#fff', border: '0.5px solid #E0DFD8', borderRadius: 12, padding: '14px 16px', marginBottom: 12 },
    cardTitle: { fontSize: 11, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
    pill: (active, variant = 'green') => {
      const col = variant === 'amber' ? '#D08008' : '#1A9E73';
      return { padding: '6px 14px', border: '0.5px solid ' + (active ? col : '#ccc'), borderRadius: 20, fontSize: 13, cursor: 'pointer', background: active ? col : 'transparent', color: active ? '#fff' : '#555' };
    },
    field: { display: 'flex', flexDirection: 'column', gap: 3 },
    label: { fontSize: 11, color: '#888', fontWeight: 500 },
    input: { padding: '7px 10px', border: '0.5px solid #ddd', borderRadius: 8, fontSize: 13, background: '#F9F8F4', color: '#1A1A1C', width: '100%' },
    select: { padding: '7px 10px', border: '0.5px solid #ddd', borderRadius: 8, fontSize: 13, background: '#F9F8F4', color: '#1A1A1C', width: '100%' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
    grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
    grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 },
    btnPrimary: { padding: '10px 18px', background: '#1A9E73', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', fontSize: 13 },
    btnSecondary: { padding: '10px 18px', background: '#F2F1EC', border: '0.5px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#555' },
    btnDanger: { padding: '10px 18px', background: 'transparent', border: '0.5px solid #DC4444', borderRadius: 8, cursor: 'pointer', fontSize: 13, color: '#DC4444' },
    btnAmber: { padding: '10px 18px', background: '#D08008', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 500, cursor: 'pointer', fontSize: 13 },
    toggle: (on) => ({
      width: 34, height: 18, borderRadius: 9, background: on ? '#1A9E73' : '#ddd',
      position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s', display: 'inline-block',
    }),
    toggleDot: (on) => ({
      position: 'absolute', top: 2, left: on ? 16 : 2, width: 14, height: 14,
      borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
    }),
    sep: { height: 1, background: '#F0EFE9', margin: '10px 0' },
    catLabel: { fontSize: 11, color: '#aaa', fontWeight: 500, paddingTop: 8, paddingBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' },
    voceRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid #F0EFE9' },
  };

  return (
    <div style={S.page}>
      {/* TOPBAR TABS */}
      <div style={S.topbar}>
        {['report', 'preventivo', 'riepilogo', 'importa'].map((t) => (
          <div key={t} style={S.tab(activeTab === t)} onClick={() => setActiveTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {savedMsg && (
        <div style={{ background: '#1A9E73', color: '#fff', textAlign: 'center', padding: '8px', fontSize: 13 }}>
          {savedMsg}
        </div>
      )}

      <div style={{ padding: '14px 14px 0' }}>

        {/* ── PRATICA FISCALE ── */}
        <div style={S.card}>
          {/* Header pratica */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={S.cardTitle}>Pratica fiscale</div>
              {commessa.praticaFiscale !== 'nessuna' && (
                <span style={{ background: docPratica.files.length > 0 ? '#E1F5EE' : '#FAEEDA', color: docPratica.files.length > 0 ? '#1A9E73' : '#D08008', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 500 }}>
                  {docPratica.files.length > 0 ? `✓ ${docPratica.files.length} doc` : '⚠ Documenti mancanti'}
                </span>
              )}
            </div>
            {commessa.praticaFiscale !== 'nessuna' && (
              <button onClick={() => setPraticaOpen((o) => !o)}
                style={{ padding: '4px 12px', border: '0.5px solid #ddd', borderRadius: 8, background: praticaOpen ? '#1A9E73' : '#F9F8F4', color: praticaOpen ? '#fff' : '#555', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                {praticaOpen ? '▲ Chiudi' : '📎 Documenti e dettagli'}
              </button>
            )}
          </div>

          {/* Selezione pratica */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: praticaOpen ? 14 : 0 }}>
            {PRATICHE.map((p) => (
              <button key={p} style={S.pill(commessa.praticaFiscale === p)} onClick={() => { updateCommessa({ praticaFiscale: p }); if (p !== 'nessuna') setPraticaOpen(true); }}>
                {PRATICHE_LABEL[p]}
              </button>
            ))}
          </div>

          {/* Pannello documenti pratica */}
          {praticaOpen && commessa.praticaFiscale !== 'nessuna' && (
            <div style={{ borderTop: '0.5px solid #F0EFE9', paddingTop: 14 }}>
              {/* Info detraibile */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div style={S.field}>
                  <label style={S.label}>Data inizio lavori</label>
                  <input type="date" style={S.input} value={docPratica.dataInizio} onChange={(e) => setDocPratica((d) => ({ ...d, dataInizio: e.target.value }))} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Data fine lavori</label>
                  <input type="date" style={S.input} value={docPratica.dataFine} onChange={(e) => setDocPratica((d) => ({ ...d, dataFine: e.target.value }))} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Importo detraibile (€)</label>
                  <input type="number" style={S.input} placeholder="es. 10000" value={docPratica.importoDetraibile} onChange={(e) => setDocPratica((d) => ({ ...d, importoDetraibile: e.target.value }))} />
                </div>
                <div style={S.field}>
                  <label style={S.label}>Tecnico asseveratore</label>
                  <input type="text" style={S.input} placeholder="Nome / P.IVA" value={docPratica.tecnicoAsseveratore} onChange={(e) => setDocPratica((d) => ({ ...d, tecnicoAsseveratore: e.target.value }))} />
                </div>
              </div>

              {/* Documenti richiesti per tipo pratica */}
              <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Documenti richiesti</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {(commessa.praticaFiscale === 'ecobonus65'
                  ? ['Asseverazione tecnica (Uw)', 'APE pre-intervento', 'APE post-intervento', 'Visto di conformità', 'Fattura lavori', 'Bonifico parlante']
                  : commessa.praticaFiscale === 'ristrutturazione50'
                  ? ['Comunicazione CILA/SCIA', 'Fattura lavori', 'Bonifico parlante', 'Titolo abitativo']
                  : ['Relazione tecnica barriere', 'Fattura lavori', 'Bonifico parlante', 'Dichiarazione conformità']
                ).map((doc) => {
                  const trovato = docPratica.files.some((f) => f.nome.toLowerCase().includes(doc.toLowerCase().split(' ')[0].toLowerCase()));
                  return (
                    <div key={doc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: trovato ? '#F0FBF7' : '#FEF9F0', borderRadius: 8, border: '0.5px solid ' + (trovato ? '#B6E8D6' : '#F5DFA0') }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14 }}>{trovato ? '✅' : '📋'}</span>
                        <span style={{ fontSize: 12, color: trovato ? '#0F6E56' : '#8a6200' }}>{doc}</span>
                      </div>
                      {trovato
                        ? <span style={{ fontSize: 11, color: '#1A9E73', fontWeight: 500 }}>Caricato</span>
                        : <label style={{ fontSize: 11, color: '#D08008', fontWeight: 500, cursor: 'pointer', padding: '3px 8px', border: '0.5px solid #D08008', borderRadius: 6 }}>
                            Carica
                            <input type="file" accept=".pdf,.jpg,.png,.doc,.docx" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && addDocFile('pratica', e.target.files[0])} />
                          </label>
                      }
                    </div>
                  );
                })}
              </div>

              {/* File caricati */}
              {docPratica.files.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>File caricati ({docPratica.files.length})</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {docPratica.files.map((f) => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 10px', background: '#F9F8F4', borderRadius: 8, border: '0.5px solid #E0DFD8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 14 }}>📄</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{f.nome}</div>
                            <div style={{ fontSize: 10, color: '#aaa' }}>{f.dimensione} · {f.dataCaricamento}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <a href={f.url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#3B7FE0', padding: '3px 8px', border: '0.5px solid #3B7FE0', borderRadius: 6, textDecoration: 'none' }}>Apri</a>
                          <button onClick={() => removeDocFile('pratica', f.id)} style={{ fontSize: 11, color: '#DC4444', padding: '3px 8px', border: '0.5px solid #DC4444', borderRadius: 6, background: 'none', cursor: 'pointer' }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Upload libero + note */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <label style={{ flex: 1, padding: '9px 14px', border: '1.5px dashed #ddd', borderRadius: 8, background: 'none', color: '#888', fontSize: 12, cursor: 'pointer', textAlign: 'center', display: 'block' }}>
                  + Carica altro documento pratica
                  <input type="file" accept=".pdf,.jpg,.png,.doc,.docx" multiple style={{ display: 'none' }} onChange={(e) => Array.from(e.target.files).forEach((f) => addDocFile('pratica', f))} />
                </label>
                <div style={{ flex: 2, ...S.field }}>
                  <label style={S.label}>Note pratica</label>
                  <textarea rows={2} style={{ ...S.input, resize: 'none', fontFamily: 'inherit', fontSize: 12 }} placeholder="Numero pratica, riferimenti catastali, note geometra..." value={docPratica.note} onChange={(e) => setDocPratica((d) => ({ ...d, note: e.target.value }))} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── IVA + SCONTO ── */}
        <div style={S.card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* IVA */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={S.cardTitle}>IVA infissi</div>
                  {commessa.ivaAliquota !== 22 && (
                    <span style={{ background: docIva.files.length > 0 ? '#E1F5EE' : '#FAEEDA', color: docIva.files.length > 0 ? '#1A9E73' : '#D08008', padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 500 }}>
                      {docIva.files.length > 0 ? `✓ ${docIva.files.length} doc` : '⚠ Doc IVA ridotta'}
                    </span>
                  )}
                </div>
                {commessa.ivaAliquota !== 22 && (
                  <button onClick={() => setIvaOpen((o) => !o)} style={{ padding: '3px 10px', border: '0.5px solid #ddd', borderRadius: 7, background: ivaOpen ? '#3B7FE0' : '#F9F8F4', color: ivaOpen ? '#fff' : '#555', fontSize: 11, cursor: 'pointer' }}>
                    {ivaOpen ? '▲' : '📎 Documenti'}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {IVA_OPTS.map((v) => (
                  <button key={v} style={S.pill(commessa.ivaAliquota === v)} onClick={() => { updateCommessa({ ivaAliquota: v }); if (v !== 22) setIvaOpen(true); }}>{v}%</button>
                ))}
              </div>

              {/* IVA ridotta info */}
              {commessa.ivaAliquota !== 22 && !ivaOpen && (
                <div style={{ marginTop: 8, padding: '6px 10px', background: '#FEF9F0', borderRadius: 6, fontSize: 11, color: '#8a6200', border: '0.5px solid #F5DFA0' }}>
                  {commessa.ivaAliquota === 4 ? 'IVA 4%: richiede requisiti prima casa o disabilità — allegare autocertificazione.' : 'IVA 10%: manutenzione straordinaria su immobile residenziale — verificare requisiti.'}
                </div>
              )}

              {/* Pannello doc IVA */}
              {ivaOpen && commessa.ivaAliquota !== 22 && (
                <div style={{ marginTop: 12, borderTop: '0.5px solid #F0EFE9', paddingTop: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {(commessa.ivaAliquota === 4
                      ? ['Autocertificazione prima casa / disabilità', 'Visura catastale', 'Contratto acquisto immobile']
                      : ['Autocertificazione manutenzione straordinaria', 'Visura catastale', 'Titolo abitativo']
                    ).map((doc) => {
                      const trovato = docIva.files.some((f) => f.nome.toLowerCase().includes(doc.split(' ')[0].toLowerCase()));
                      return (
                        <div key={doc} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: trovato ? '#F0FBF7' : '#FEF9F0', borderRadius: 7, border: '0.5px solid ' + (trovato ? '#B6E8D6' : '#F5DFA0') }}>
                          <span style={{ fontSize: 11, color: trovato ? '#0F6E56' : '#8a6200' }}>{trovato ? '✅' : '📋'} {doc}</span>
                          {trovato
                            ? <span style={{ fontSize: 10, color: '#1A9E73', fontWeight: 500 }}>Caricato</span>
                            : <label style={{ fontSize: 10, color: '#D08008', cursor: 'pointer', padding: '2px 6px', border: '0.5px solid #D08008', borderRadius: 5 }}>
                                Carica
                                <input type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && addDocFile('iva', e.target.files[0])} />
                              </label>
                          }
                        </div>
                      );
                    })}
                  </div>

                  {docIva.files.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
                      {docIva.files.map((f) => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: '#F9F8F4', borderRadius: 7, border: '0.5px solid #E0DFD8' }}>
                          <span style={{ fontSize: 11 }}>📄 {f.nome} <span style={{ color: '#aaa', fontSize: 10 }}>({f.dimensione})</span></span>
                          <div style={{ display: 'flex', gap: 5 }}>
                            <a href={f.url} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: '#3B7FE0', padding: '2px 7px', border: '0.5px solid #3B7FE0', borderRadius: 5, textDecoration: 'none' }}>Apri</a>
                            <button onClick={() => removeDocFile('iva', f.id)} style={{ fontSize: 10, color: '#DC4444', padding: '2px 6px', border: '0.5px solid #DC4444', borderRadius: 5, background: 'none', cursor: 'pointer' }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={S.field}>
                      <label style={S.label}>Motivazione IVA ridotta</label>
                      <select style={{ ...S.select, fontSize: 12 }} value={docIva.motivazione} onChange={(e) => setDocIva((d) => ({ ...d, motivazione: e.target.value }))}>
                        <option value="">Seleziona...</option>
                        {commessa.ivaAliquota === 4
                          ? ['Prima casa', 'Disabilità L.104', 'Cooperative edilizia'].map((o) => <option key={o}>{o}</option>)
                          : ['Manutenzione straordinaria', 'Recupero edilizio', 'Ristrutturazione'].map((o) => <option key={o}>{o}</option>)
                        }
                      </select>
                    </div>
                    <label style={{ flex: 1, padding: '8px', border: '1.5px dashed #ddd', borderRadius: 7, background: 'none', color: '#888', fontSize: 11, cursor: 'pointer', textAlign: 'center', alignSelf: 'flex-end', display: 'block' }}>
                      + Altro documento
                      <input type="file" accept=".pdf,.jpg,.png" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && addDocFile('iva', e.target.files[0])} />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* SCONTO */}
            <div>
              <div style={S.cardTitle}>Sconto globale</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SCONTO_OPTS.map((v) => (
                  <button key={v} style={S.pill(commessa.scontoGlobale === v)} onClick={() => updateCommessa({ scontoGlobale: v })}>
                    {v === 0 ? 'No' : v + '%'}
                  </button>
                ))}
              </div>
              {commessa.scontoGlobale > 0 && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: '#FEF9F0', borderRadius: 8, border: '0.5px solid #F5DFA0' }}>
                  <div style={{ fontSize: 11, color: '#8a6200' }}>Sconto applicato: <strong>-{fmt(calcolaTotale(commessa).sconto)}</strong></div>
                  <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>Sul totale imponibile {fmt(calcolaTotale(commessa).lordo)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* VANI */}
        {commessa.vani.map((vano) => (
          <div key={vano.id} style={S.card}>
            {/* Header vano */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', paddingBottom: 12, borderBottom: '0.5px solid #F0EFE9', marginBottom: 12 }}
              onClick={() => setVanoExpanded((e) => ({ ...e, [vano.id]: !e[vano.id] }))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1A9E73', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 500 }}>{vano.id}</div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>
                    {vano.nome} <span style={{ fontWeight: 400, fontSize: 12, color: '#888' }}>{vano.tipo} · {vano.nPezzi}pz</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>{vano.larghezza}×{vano.altezza} · {vano.coloreEsterno} · {vano.profilo}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: '#1A9E73' }}>{fmt(calcolaVano(vano))}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>{fmt(calcolaVano(vano) / vano.nPezzi)}/pz</div>
              </div>
            </div>

            {/* Corpo vano espandibile */}
            {vanoExpanded[vano.id] !== false && (
              <>
                {/* 1. TIPOLOGIA E APERTURA — prima di tutto */}
                <div style={S.catLabel}>Tipologia e apertura</div>
                <div style={{ ...S.grid4, marginBottom: 10 }}>
                  <div style={S.field}>
                    <label style={S.label}>Tipo</label>
                    <select style={S.select} value={vano.tipo} onChange={(e) => updateVano(vano.id, { tipo: e.target.value })}>
                      {TIPI_VANO.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Apertura</label>
                    <select style={S.select} value={vano.apertura} onChange={(e) => updateVano(vano.id, { apertura: e.target.value })}>
                      {APERTURE.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Verso</label>
                    <select style={S.select} value={vano.versoapertura} onChange={(e) => updateVano(vano.id, { versoapertura: e.target.value })}>
                      {['Sinistro', 'Destro', 'Entrambi'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Colore esterno</label>
                    <select style={S.select} value={vano.coloreEsterno} onChange={(e) => updateVano(vano.id, { coloreEsterno: e.target.value })}>
                      {['Bianco', 'RAL 7016', 'RAL 9005', 'Legno', 'Personalizzato'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* 2. MISURE VANO */}
                <div style={S.catLabel}>Misure vano</div>
                <div style={{ ...S.grid4, marginBottom: 10 }}>
                  {[
                    { k: 'larghezza', lbl: 'Larghezza (mm)' }, { k: 'altezza', lbl: 'Altezza (mm)' },
                    { k: 'spessoreMuro', lbl: 'Spessore muro (mm)' }, { k: 'lucenetta', lbl: 'Luce netta (mm)' },
                  ].map(({ k, lbl }) => (
                    <div key={k} style={S.field}>
                      <label style={S.label}>{lbl}</label>
                      <input type="number" style={S.input} value={vano[k]} onChange={(e) => updateVano(vano.id, { [k]: Number(e.target.value) })} />
                    </div>
                  ))}
                </div>
                <div style={{ ...S.grid4, marginBottom: 10 }}>
                  {[
                    { k: 'quotaDavanzale', lbl: 'Davanzale (mm)' }, { k: 'nPezzi', lbl: 'N. pezzi' },
                  ].map(({ k, lbl }) => (
                    <div key={k} style={S.field}>
                      <label style={S.label}>{lbl}</label>
                      <input type="number" style={S.input} value={vano[k]} onChange={(e) => updateVano(vano.id, { [k]: Number(e.target.value) })} />
                    </div>
                  ))}
                  <div style={S.field}>
                    <label style={S.label}>Piano</label>
                    <select style={S.select} value={vano.piano} onChange={(e) => updateVano(vano.id, { piano: e.target.value })}>
                      {['P.T.', '1°', '2°', '3°+'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Posizione</label>
                    <select style={S.select} value={vano.posizione} onChange={(e) => updateVano(vano.id, { posizione: e.target.value })}>
                      {['Soggiorno', 'Camera', 'Cucina', 'Bagno', 'Studio', 'Libera'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* SISTEMA */}
                <div style={S.catLabel}>Sistema e vetro</div>
                <div style={{ ...S.grid4, marginBottom: 12 }}>
                  <div style={S.field}>
                    <label style={S.label}>Profilo</label>
                    <select style={S.select} value={vano.profilo} onChange={(e) => updateVano(vano.id, { profilo: e.target.value })}>
                      {PROFILI.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Vetro</label>
                    <select style={S.select} value={vano.vetro} onChange={(e) => updateVano(vano.id, { vetro: e.target.value })}>
                      {VETRI.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Uw (W/m²K)</label>
                    <input type="number" step="0.1" style={S.input} value={vano.uw} onChange={(e) => updateVano(vano.id, { uw: Number(e.target.value) })} />
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Fornitore</label>
                    <select style={S.select} value={vano.fornitore} onChange={(e) => updateVano(vano.id, { fornitore: e.target.value })}>
                      {FORNITORI.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                <div style={S.sep} />

                {/* PREZZO INFISSO */}
                <div style={S.catLabel}>Prezzo infisso</div>
                <div style={{ ...S.grid3, marginBottom: 10 }}>
                  <div style={S.field}>
                    <label style={S.label}>Prezzo unitario (€)</label>
                    <input type="number" style={S.input} value={vano.prezzoUnitario} onChange={(e) => updateVano(vano.id, { prezzoUnitario: Number(e.target.value) })} />
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>N. pezzi</label>
                    <input type="number" style={S.input} value={vano.nPezzi} onChange={(e) => updateVano(vano.id, { nPezzi: Number(e.target.value) })} />
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Subtotale infisso</label>
                    <div style={{ ...S.input, background: '#F0EFE9', color: '#1A9E73', fontWeight: 500 }}>{fmt(vano.prezzoUnitario * vano.nPezzi)}</div>
                  </div>
                </div>

                {/* ACCESSORI */}
                <div style={S.catLabel}>Accessori inclusi</div>

                {/* Tapparella — tipo + colore + misure + prezzo + toggle */}
                <div style={{ ...S.voceRow, flexDirection: 'column', alignItems: 'stretch', gap: 8, paddingBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#bbb' }}>└</span>
                      <span style={{ fontSize: 13, fontWeight: 500, minWidth: 80 }}>Tapparella</span>
                      <select style={{ fontSize: 12, padding: '4px 8px', border: '0.5px solid #ddd', borderRadius: 6, background: '#F9F8F4' }}
                        value={vano.tapparella.tipo}
                        onChange={(e) => updateVano(vano.id, { tapparella: { ...vano.tapparella, tipo: e.target.value, inclusa: e.target.value !== 'Non inclusa' } })}>
                        {TIPI_TAPPARELLA.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {vano.tapparella.inclusa && <span style={{ background: '#E1F5EE', color: '#1A9E73', padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 500 }}>incluso</span>}
                      <div style={S.toggle(vano.tapparella.inclusa)} onClick={() => updateVano(vano.id, { tapparella: { ...vano.tapparella, inclusa: !vano.tapparella.inclusa } })}>
                        <div style={S.toggleDot(vano.tapparella.inclusa)} />
                      </div>
                    </div>
                  </div>
                  {vano.tapparella.inclusa && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 6, paddingLeft: 20 }}>
                      <div style={S.field}>
                        <label style={S.label}>Colore</label>
                        <select style={{ ...S.select, fontSize: 11, padding: '4px 6px' }}
                          value={vano.tapparella.colore || 'RAL 7016'}
                          onChange={(e) => updateVano(vano.id, { tapparella: { ...vano.tapparella, colore: e.target.value } })}>
                          {['Bianco', 'RAL 7016', 'RAL 9005', 'Beige', 'Marrone', 'Personalizzato'].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={S.field}>
                        <label style={S.label}>Largh. (mm)</label>
                        <input type="number" style={{ ...S.input, fontSize: 12, padding: '4px 6px' }}
                          value={vano.tapparella.larghezza || vano.larghezza}
                          onChange={(e) => updateVano(vano.id, { tapparella: { ...vano.tapparella, larghezza: Number(e.target.value) } })} />
                      </div>
                      <div style={S.field}>
                        <label style={S.label}>Alt. (mm)</label>
                        <input type="number" style={{ ...S.input, fontSize: 12, padding: '4px 6px' }}
                          value={vano.tapparella.altezza || Math.round(vano.altezza * 0.6)}
                          onChange={(e) => updateVano(vano.id, { tapparella: { ...vano.tapparella, altezza: Number(e.target.value) } })} />
                      </div>
                      <div style={S.field}>
                        <label style={S.label}>Spessore</label>
                        <select style={{ ...S.select, fontSize: 11, padding: '4px 6px' }}
                          value={vano.tapparella.spessore || '8mm'}
                          onChange={(e) => updateVano(vano.id, { tapparella: { ...vano.tapparella, spessore: e.target.value } })}>
                          {['8mm', '10mm', '14mm (rinforzata)'].map((s) => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div style={S.field}>
                        <label style={S.label}>Prezzo (€)</label>
                        <input type="number" style={{ ...S.input, fontSize: 12, padding: '4px 6px' }}
                          value={vano.tapparella.prezzo || 0}
                          onChange={(e) => updateVano(vano.id, { tapparella: { ...vano.tapparella, prezzo: Number(e.target.value) } })} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Zanzariera — tipo + colore + misure + sistema + prezzo + toggle */}
                <div style={{ ...S.voceRow, flexDirection: 'column', alignItems: 'stretch', gap: 8, paddingBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, color: '#bbb' }}>└</span>
                      <span style={{ fontSize: 13, fontWeight: 500, minWidth: 80 }}>Zanzariera</span>
                      <select style={{ fontSize: 12, padding: '4px 8px', border: '0.5px solid #ddd', borderRadius: 6, background: '#F9F8F4' }}
                        value={vano.zanzariera.tipo}
                        onChange={(e) => updateVano(vano.id, { zanzariera: { ...vano.zanzariera, tipo: e.target.value, inclusa: e.target.value !== 'Non inclusa' } })}>
                        {TIPI_ZANZARIERA.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {vano.zanzariera.inclusa && <span style={{ background: '#E1F5EE', color: '#1A9E73', padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 500 }}>incluso</span>}
                      <div style={S.toggle(vano.zanzariera.inclusa)} onClick={() => updateVano(vano.id, { zanzariera: { ...vano.zanzariera, inclusa: !vano.zanzariera.inclusa } })}>
                        <div style={S.toggleDot(vano.zanzariera.inclusa)} />
                      </div>
                    </div>
                  </div>
                  {vano.zanzariera.inclusa && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 6, paddingLeft: 20 }}>
                      <div style={S.field}>
                        <label style={S.label}>Colore</label>
                        <select style={{ ...S.select, fontSize: 11, padding: '4px 6px' }}
                          value={vano.zanzariera.colore || 'Bianco'}
                          onChange={(e) => updateVano(vano.id, { zanzariera: { ...vano.zanzariera, colore: e.target.value } })}>
                          {['Bianco', 'RAL 7016', 'Bronzo', 'Argento', 'Marrone', 'Personalizzato'].map((c) => <option key={c}>{c}</option>)}
                        </select>
                      </div>
                      <div style={S.field}>
                        <label style={S.label}>Largh. (mm)</label>
                        <input type="number" style={{ ...S.input, fontSize: 12, padding: '4px 6px' }}
                          value={vano.zanzariera.larghezza || vano.larghezza}
                          onChange={(e) => updateVano(vano.id, { zanzariera: { ...vano.zanzariera, larghezza: Number(e.target.value) } })} />
                      </div>
                      <div style={S.field}>
                        <label style={S.label}>Alt. (mm)</label>
                        <input type="number" style={{ ...S.input, fontSize: 12, padding: '4px 6px' }}
                          value={vano.zanzariera.altezza || vano.altezza}
                          onChange={(e) => updateVano(vano.id, { zanzariera: { ...vano.zanzariera, altezza: Number(e.target.value) } })} />
                      </div>
                      <div style={S.field}>
                        <label style={S.label}>Rete</label>
                        <select style={{ ...S.select, fontSize: 11, padding: '4px 6px' }}
                          value={vano.zanzariera.rete || 'Standard'}
                          onChange={(e) => updateVano(vano.id, { zanzariera: { ...vano.zanzariera, rete: e.target.value } })}>
                          {['Standard', 'Anti-polline', 'Anti-insetti piccoli', 'Rinforzata'].map((r) => <option key={r}>{r}</option>)}
                        </select>
                      </div>
                      <div style={S.field}>
                        <label style={S.label}>Prezzo (€)</label>
                        <input type="number" style={{ ...S.input, fontSize: 12, padding: '4px 6px' }}
                          value={vano.zanzariera.prezzo || 0}
                          onChange={(e) => updateVano(vano.id, { zanzariera: { ...vano.zanzariera, prezzo: Number(e.target.value) } })} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Accessori dinamici */}
                {vano.accessori.map((acc) => (
                  <div key={acc.id} style={S.voceRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <span style={{ fontSize: 11, color: '#bbb' }}>└</span>
                      <span style={{ fontSize: 13 }}>{acc.nome}</span>
                      <span style={{ fontSize: 11, color: '#ccc' }}>({acc.codice})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select
                        value={acc.colore}
                        onChange={(e) => setCommessa((c) => ({ ...c, vani: c.vani.map((v) => v.id === vano.id ? { ...v, accessori: v.accessori.map((a) => a.id === acc.id ? { ...a, colore: e.target.value } : a) } : v) }))}
                        style={{ fontSize: 11, padding: '2px 4px', border: '0.5px solid #ddd', borderRadius: 4, background: '#F9F8F4', maxWidth: 100 }}>
                        {COLORI_STD.map((c) => <option key={c}>{c}</option>)}
                      </select>
                      <input
                        type="number"
                        value={acc.prezzo}
                        onChange={(e) => setCommessa((c) => ({ ...c, vani: c.vani.map((v) => v.id === vano.id ? { ...v, accessori: v.accessori.map((a) => a.id === acc.id ? { ...a, prezzo: Number(e.target.value) } : a) } : v) }))}
                        style={{ width: 72, textAlign: 'right', padding: '3px 6px', border: '0.5px solid #ddd', borderRadius: 4, fontSize: 12, background: '#F9F8F4' }}
                      />
                      <span style={{ fontSize: 12, color: '#aaa' }}>× 1</span>
                      <div style={S.toggle(acc.attiva)} onClick={() => toggleAccessorio(vano.id, acc.id)}>
                        <div style={S.toggleDot(acc.attiva)} />
                      </div>
                    </div>
                  </div>
                ))}

                <button style={{ width: '100%', padding: 9, border: '1.5px dashed #ddd', borderRadius: 8, background: 'none', color: '#888', fontSize: 13, cursor: 'pointer', marginTop: 6, textAlign: 'center' }}>
                  + Aggiungi accessorio dal catalogo
                </button>

                {/* COLORI ACCESSORI */}
                <div style={S.catLabel}>Colore accessori</div>
                <div style={{ ...S.grid3, marginBottom: 10 }}>
                  {[
                    { k: 'coloreManiglie', lbl: 'Maniglie' },
                    { k: 'coloreCremonesi', lbl: 'Cremonesi' },
                    { k: 'coloreZanzariera', lbl: 'Zanzariera' },
                  ].map(({ k, lbl }) => (
                    <div key={k} style={S.field}>
                      <label style={S.label}>{lbl}</label>
                      <select style={S.select} value={vano[k]} onChange={(e) => updateVano(vano.id, { [k]: e.target.value })}>
                        {COLORI_STD.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* POSA */}
                <div style={S.catLabel}>Posa e lavorazioni</div>
                <div style={{ ...S.grid4, marginBottom: 10 }}>
                  <div style={S.field}>
                    <label style={S.label}>Posa</label>
                    <select style={S.select} value={vano.posa} onChange={(e) => updateVano(vano.id, { posa: e.target.value })}>
                      {['Inclusa', 'Esclusa', 'Voce separata'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Smontaggio</label>
                    <select style={S.select} value={vano.smontaggio} onChange={(e) => updateVano(vano.id, { smontaggio: e.target.value })}>
                      {['Non richiesto', 'Incluso', 'Voce separata'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Smaltimento</label>
                    <select style={S.select} value={vano.smaltimento} onChange={(e) => updateVano(vano.id, { smaltimento: e.target.value })}>
                      {['Non incluso', 'Incluso'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div style={S.field}>
                    <label style={S.label}>Prezzo posa (€)</label>
                    <input type="number" style={S.input} value={vano.prezzoPosa} onChange={(e) => updateVano(vano.id, { prezzoPosa: Number(e.target.value) })} />
                  </div>
                </div>

                {/* NOTE VANO */}
                <div style={S.catLabel}>Note vano</div>
                <textarea
                  rows={2}
                  placeholder="Note specifiche per questo vano..."
                  value={vano.noteVano}
                  onChange={(e) => updateVano(vano.id, { noteVano: e.target.value })}
                  style={{ ...S.input, resize: 'none', width: '100%', fontFamily: 'inherit', marginBottom: 12 }}
                />

                {/* DISEGNO TECNICO — bottone sempre visibile e prominente */}
                <div style={{ ...S.sep, marginBottom: 0 }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: disegnoOpen[vano.id] ? '#1A9E73' : '#F0EFE9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>✏️</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1C' }}>Disegno libero vano</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>
                        {vano.disegno
                          ? `Salvato · ${vano.quote.length} quote annotate`
                          : 'Disegna a mano, carica foto, annota quote'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {vano.disegno && (
                      <button
                        onClick={() => updateVano(vano.id, { disegno: null, quote: [] })}
                        style={{ padding: '6px 10px', border: '0.5px solid #DC4444', borderRadius: 8, background: 'none', color: '#DC4444', cursor: 'pointer', fontSize: 12 }}>
                        Elimina
                      </button>
                    )}
                    <button
                      onClick={() => setDisegnoOpen((d) => ({ ...d, [vano.id]: !d[vano.id] }))}
                      style={{ padding: '6px 14px', border: '0.5px solid ' + (disegnoOpen[vano.id] ? '#1A9E73' : '#1A9E73'), borderRadius: 8, background: disegnoOpen[vano.id] ? '#1A9E73' : '#E1F5EE', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: disegnoOpen[vano.id] ? '#fff' : '#1A9E73' }}>
                      {disegnoOpen[vano.id] ? '▲ Chiudi canvas' : '✏️ Apri disegno libero'}
                    </button>
                  </div>
                </div>

                {/* Anteprima disegno salvato */}
                {vano.disegno && !disegnoOpen[vano.id] && (
                  <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', marginBottom: 10 }}>
                    <img src={vano.disegno} alt="Disegno vano" style={{ width: '100%', display: 'block' }} />
                    {vano.quote.length > 0 && (
                      <div style={{ padding: '6px 10px', background: '#F9F8F4', fontSize: 11, color: '#888' }}>
                        Quote: {vano.quote.map((q) => q.valore + 'mm').join(' · ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Canvas disegno espanso */}
                {disegnoOpen[vano.id] && (
                  <div style={{ border: '1px solid #1A9E73', borderRadius: 10, padding: 12, background: '#F9FEF9', marginBottom: 10 }}>
                    <DisegnoCanvas
                      vano={vano}
                      onSave={(dataUrl, quotes) => {
                        salvaDisegno(vano.id, dataUrl, quotes);
                        setDisegnoOpen((d) => ({ ...d, [vano.id]: false }));
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {/* AGGIUNGI VANO */}
        <button onClick={aggiungiVano} style={{ width: '100%', padding: 12, border: '1.5px dashed #1A9E73', borderRadius: 12, background: 'none', color: '#1A9E73', fontSize: 14, fontWeight: 500, cursor: 'pointer', marginBottom: 12 }}>
          + Aggiungi vano
        </button>

        {/* VOCI EXTRA */}
        <div style={S.card}>
          <div style={S.cardTitle}>Voci extra commessa</div>
          {commessa.vociExtra.map((v) => (
            <div key={v.id} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Descrizione (es. Ponteggio, Trasferta...)"
                value={v.descrizione}
                onChange={(e) => updateVoceExtra(v.id, { descrizione: e.target.value })}
                style={{ ...S.input, flex: 3 }}
              />
              <input
                type="number"
                placeholder="€"
                value={v.prezzo}
                onChange={(e) => updateVoceExtra(v.id, { prezzo: Number(e.target.value) })}
                style={{ ...S.input, flex: 1, textAlign: 'right' }}
              />
              <button onClick={() => rimuoviVoceExtra(v.id)} style={{ padding: '7px 12px', border: '0.5px solid #DC4444', borderRadius: 8, background: 'none', color: '#DC4444', cursor: 'pointer', fontSize: 13 }}>✕</button>
            </div>
          ))}
          <button onClick={aggiungiVoceExtra} style={{ width: '100%', padding: 9, border: '1.5px dashed #ddd', borderRadius: 8, background: 'none', color: '#888', fontSize: 13, cursor: 'pointer', textAlign: 'center' }}>
            + Aggiungi voce extra
          </button>
        </div>

        {/* NOTE COMMESSA */}
        <div style={S.card}>
          <div style={S.cardTitle}>Note e condizioni commessa</div>
          <textarea
            rows={3}
            placeholder="Note aggiuntive, condizioni speciali, scadenza offerta, modalita di pagamento..."
            value={commessa.noteCommessa}
            onChange={(e) => updateCommessa({ noteCommessa: e.target.value })}
            style={{ ...S.input, resize: 'none', width: '100%', fontFamily: 'inherit' }}
          />
        </div>

        {/* TOTALI */}
        <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {commessa.vani.reduce((s, v) => s + v.nPezzi, 0)} pz totali — IVA {commessa.ivaAliquota}%
              {commessa.scontoGlobale > 0 && ` — Sconto ${commessa.scontoGlobale}%`}
            </div>
            <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>
              Imponibile {fmt(totali.imponibile)} + IVA {fmt(totali.iva)}
            </div>
            {commessa.scontoGlobale > 0 && (
              <div style={{ fontSize: 11, color: '#D08008' }}>Sconto applicato: -{fmt(totali.sconto)}</div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 500, color: '#1A1A1C' }}>{fmt(totali.totale)}</div>
            <div style={{ fontSize: 11, color: '#888' }}>totale IVA inclusa</div>
          </div>
        </div>

        {/* BOTTONI PDF */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
          <button
            style={S.btnSecondary}
            onClick={() => handleGeneraPDF('preventivo')}
            disabled={generando === 'preventivo'}
          >
            {generando === 'preventivo' ? 'Generando...' : 'PDF Preventivo cliente'}
          </button>
          <button
            style={S.btnAmber}
            onClick={() => setShowFirma(true)}
            disabled={!!generando}
          >
            Conferma ordine + firma
          </button>
          <button
            style={S.btnSecondary}
            onClick={() => handleGeneraPDF('fornitore')}
            disabled={generando === 'fornitore'}
          >
            {generando === 'fornitore' ? 'Generando...' : 'PDF Ordine fornitore'}
          </button>
        </div>

        {/* Firma modale */}
        {showFirma && (
          <FirmaCanvas
            onSave={handleFirmaConferma}
            onClose={() => setShowFirma(false)}
          />
        )}
      </div>
    </div>
  );
}
