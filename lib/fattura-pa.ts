/**
 * MASTRO FatturaPA Generator
 * Genera XML FatturaPA v1.2 per SDI (Sistema di Interscambio)
 * Compatibile con fattura-elettronica-api.it (M50/M500/M5000)
 */

export interface DatiAzienda {
  piva: string;
  cf?: string;
  ragione_sociale: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia: string;
  paese?: string; // default IT
  regime_fiscale?: string; // default RF19 forfettario
  telefono?: string;
  email?: string;
}

export interface DatiCliente {
  piva?: string;
  cf?: string;
  ragione_sociale?: string;
  nome?: string;
  cognome?: string;
  indirizzo: string;
  cap: string;
  comune: string;
  provincia?: string;
  paese?: string;
}

export interface RigaFattura {
  numero: number;
  descrizione: string;
  quantita: number;
  prezzo_unitario: number;
  aliquota_iva: number; // es. 22
  natura_iva?: string; // es. N1 per escluse
  unita_misura?: string;
}

export interface DatiFattura {
  numero: string;
  data: string; // YYYY-MM-DD
  tipo_documento?: string; // default TD01
  valuta?: string; // default EUR
  righe: RigaFattura[];
  causale?: string;
  dati_pagamento?: {
    modalita: string; // es. MP05 bonifico
    data_scadenza?: string;
    importo: number;
    iban?: string;
  };
}

export function generaFatturaPA(
  cedente: DatiAzienda,
  cessionario: DatiCliente,
  fattura: DatiFattura
): string {
  const imponibile = fattura.righe.reduce((sum, r) => sum + r.quantita * r.prezzo_unitario, 0);
  const iva = fattura.righe.reduce((sum, r) => sum + r.quantita * r.prezzo_unitario * r.aliquota_iva / 100, 0);
  const totale = imponibile + iva;

  const righeXml = fattura.righe.map(r => `
    <DettaglioLinee>
      <NumeroLinea>${r.numero}</NumeroLinea>
      <Descrizione>${escXml(r.descrizione)}</Descrizione>
      ${r.unita_misura ? `<UnitaMisura>${r.unita_misura}</UnitaMisura>` : ''}
      <Quantita>${r.quantita.toFixed(2)}</Quantita>
      <PrezzoUnitario>${r.prezzo_unitario.toFixed(2)}</PrezzoUnitario>
      <PrezzoTotale>${(r.quantita * r.prezzo_unitario).toFixed(2)}</PrezzoTotale>
      <AliquotaIVA>${r.aliquota_iva.toFixed(2)}</AliquotaIVA>
      ${r.natura_iva ? `<Natura>${r.natura_iva}</Natura>` : ''}
    </DettaglioLinee>`).join('');

  const riepilogoIva = `
    <DatiRiepilogo>
      <AliquotaIVA>${fattura.righe[0]?.aliquota_iva?.toFixed(2) ?? '22.00'}</AliquotaIVA>
      <ImponibileImporto>${imponibile.toFixed(2)}</ImponibileImporto>
      <Imposta>${iva.toFixed(2)}</Imposta>
      <EsigibilitaIVA>I</EsigibilitaIVA>
    </DatiRiepilogo>`;

  const pagamentoXml = fattura.dati_pagamento ? `
  <DatiPagamento>
    <CondizioniPagamento>TP02</CondizioniPagamento>
    <DettaglioPagamento>
      <ModalitaPagamento>${fattura.dati_pagamento.modalita}</ModalitaPagamento>
      ${fattura.dati_pagamento.data_scadenza ? `<DataScadenzaPagamento>${fattura.dati_pagamento.data_scadenza}</DataScadenzaPagamento>` : ''}
      <ImportoPagamento>${fattura.dati_pagamento.importo.toFixed(2)}</ImportoPagamento>
      ${fattura.dati_pagamento.iban ? `<IBAN>${fattura.dati_pagamento.iban}</IBAN>` : ''}
    </DettaglioPagamento>
  </DatiPagamento>` : '';

  const clienteB2B = cessionario.piva || cessionario.cf;

  return `<?xml version="1.0" encoding="UTF-8"?>
<p:FatturaElettronica versione="FPA12"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#"
  xmlns:p="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://ivaservizi.agenziaentrate.gov.it/docs/xsd/fatture/v1.2 http://www.fatturapa.gov.it/export/fatturazione/sdi/fatturapa/v1.2/Schema_del_file_xml_FatturaPA_versione_1.2.xsd">
  <FatturaElettronicaHeader>
    <DatiTrasmissione>
      <IdTrasmittente>
        <IdPaese>${cedente.paese ?? 'IT'}</IdPaese>
        <IdCodice>${cedente.piva}</IdCodice>
      </IdTrasmittente>
      <ProgressivoInvio>${fattura.numero}</ProgressivoInvio>
      <FormatoTrasmissione>${clienteB2B ? 'FPA12' : 'FPR12'}</FormatoTrasmissione>
      <CodiceDestinatario>0000000</CodiceDestinatario>
    </DatiTrasmissione>
    <CedentePrestatore>
      <DatiAnagrafici>
        <IdFiscaleIVA>
          <IdPaese>${cedente.paese ?? 'IT'}</IdPaese>
          <IdCodice>${cedente.piva}</IdCodice>
        </IdFiscaleIVA>
        ${cedente.cf ? `<CodiceFiscale>${cedente.cf}</CodiceFiscale>` : ''}
        <Anagrafica>
          <Denominazione>${escXml(cedente.ragione_sociale)}</Denominazione>
        </Anagrafica>
        <RegimeFiscale>${cedente.regime_fiscale ?? 'RF19'}</RegimeFiscale>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escXml(cedente.indirizzo)}</Indirizzo>
        <CAP>${cedente.cap}</CAP>
        <Comune>${escXml(cedente.comune)}</Comune>
        <Provincia>${cedente.provincia}</Provincia>
        <Nazione>${cedente.paese ?? 'IT'}</Nazione>
      </Sede>
    </CedentePrestatore>
    <CessionarioCommittente>
      <DatiAnagrafici>
        ${cessionario.piva ? `<IdFiscaleIVA><IdPaese>IT</IdPaese><IdCodice>${cessionario.piva}</IdCodice></IdFiscaleIVA>` : ''}
        ${cessionario.cf ? `<CodiceFiscale>${cessionario.cf}</CodiceFiscale>` : ''}
        <Anagrafica>
          ${cessionario.ragione_sociale ? `<Denominazione>${escXml(cessionario.ragione_sociale)}</Denominazione>` : `<Nome>${escXml(cessionario.nome ?? '')}</Nome><Cognome>${escXml(cessionario.cognome ?? '')}</Cognome>`}
        </Anagrafica>
      </DatiAnagrafici>
      <Sede>
        <Indirizzo>${escXml(cessionario.indirizzo)}</Indirizzo>
        <CAP>${cessionario.cap}</CAP>
        <Comune>${escXml(cessionario.comune)}</Comune>
        ${cessionario.provincia ? `<Provincia>${cessionario.provincia}</Provincia>` : ''}
        <Nazione>${cessionario.paese ?? 'IT'}</Nazione>
      </Sede>
    </CessionarioCommittente>
  </FatturaElettronicaHeader>
  <FatturaElettronicaBody>
    <DatiGenerali>
      <DatiGeneraliDocumento>
        <TipoDocumento>${fattura.tipo_documento ?? 'TD01'}</TipoDocumento>
        <Divisa>${fattura.valuta ?? 'EUR'}</Divisa>
        <Data>${fattura.data}</Data>
        <Numero>${fattura.numero}</Numero>
        ${fattura.causale ? `<Causale>${escXml(fattura.causale)}</Causale>` : ''}
        <ImportoTotaleDocumento>${totale.toFixed(2)}</ImportoTotaleDocumento>
      </DatiGeneraliDocumento>
    </DatiGenerali>
    <DatiBeniServizi>
      ${righeXml}
      ${riepilogoIva}
    </DatiBeniServizi>
    ${pagamentoXml}
  </FatturaElettronicaBody>
</p:FatturaElettronica>`;
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
