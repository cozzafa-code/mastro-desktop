"use client";
// @ts-nocheck
// MASTRO ERP - PreventivoConfiguratoreTab v3 Mobile Wizard
// Tab preventivo: wizard step-by-step per vano, inputMode numerico, encoding pulito
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useMastro } from "./MastroContext";
import { FM } from "./mastro-constants";
import VanoConfiguratoreFullscreen from "./VanoConfiguratoreFullscreen";

const GRN = "#1A9E73";
const AMB = "#D08008";
const RED = "#DC4444";
const ACC_COLOR = "#8B5CF6";
const BLU = "#3B7FE0";

const fmt = (n: number) => (n ?? 0).toFixed(2).replace(".", ",");

function SectionLabel({ children }: any) {
  return (
    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#8e8e93", marginBottom: 6, marginTop: 2 }}>
      {children}
    </div>
  );
}

// Input numerico mobile-friendly: inputMode numeric = numpad nativo
function NInput({ value, onChange, placeholder = "0", style = {}, label = "" }: any) {
  const [local, setLocal] = useState(value > 0 ? String(value) : "");
  useEffect(() => { setLocal(value > 0 ? String(value) : ""); }, [value]);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {label ? <label style={{ fontSize: 9, fontWeight: 700, color: "#8e8e93", letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</label> : null}
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        value={local}
        placeholder={placeholder}
        onChange={e => { setLocal(e.target.value); onChange(e.target.value === "" ? 0 : Number(e.target.value)); }}
        style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 16, fontFamily: FM, textAlign: "right", background: "#fff", color: "#1A1A1C", width: "100%", boxSizing: "border-box", ...style }}
      />
    </div>
  );
}

// Input testo mobile
function TInput({ value, onChange, placeholder = "", style = {}, label = "" }: any) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {label ? <label style={{ fontSize: 9, fontWeight: 700, color: "#8e8e93", letterSpacing: 0.8, textTransform: "uppercase" }}>{label}</label> : null}
      <input
        inputMode="text"
        value={value || ""}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 15, fontFamily: "Inter", background: "#fff", color: "#1A1A1C", width: "100%", boxSizing: "border-box", ...style }}
      />
    </div>
  );
}

// Toggle switch
function Toggle({ value, onChange }: any) {
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? GRN : "#ccc", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </div>
  );
}


// ============================================================
// GUIDA DETRAZIONI E IVA AGEVOLATA 2026
// ============================================================
function GuidaDetrazioni({ T }: any) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<string|null>(null);

  const VOCI = [
    {
      id: "iva4",
      titolo: "IVA 4%",
      tag: "Prima casa / Disabilità",
      tagColor: "#3B7FE0",
      requisiti: [
        "Abitazione principale del cliente (prima casa)",
        "Soggetti con disabilità riconosciuta (L. 104/92)",
        "Acquisto diretto dal costruttore/installatore",
      ],
      documenti: [
        "Dichiarazione sostitutiva prima casa",
        "Certificazione invalidità (se disabilità)",
        "Atto di proprietà immobile",
      ],
      note: "Non si cumula con detrazioni IRPEF. Applicabile su infissi, tapparelle, zanzariere nella stessa fornitura.",
      fattura: "In fattura: 'Fornitura e posa infissi abitazione principale - IVA 4% art. 127-undecies DPR 633/72'",
      limite: null,
    },
    {
      id: "iva10",
      titolo: "IVA 10%",
      tag: "Manutenzione straordinaria",
      tagColor: "#1A9E73",
      requisiti: [
        "Immobile residenziale (non prima casa obbligatorio)",
        "Intervento di manutenzione straordinaria (sostituzione infissi)",
        "NON nuova costruzione",
        "Il cliente deve dichiarare uso residenziale",
      ],
      documenti: [
        "Dichiarazione del cliente uso abitativo",
        "Visura catastale (consigliata)",
      ],
      note: "La sostituzione di infissi è sempre manutenzione straordinaria. Applicabile anche a tapparelle e zanzariere se nella stessa fornitura.",
      fattura: "In fattura: 'Fornitura e posa infissi - manutenzione straordinaria residenziale - IVA 10% n. 127-quaterdecies DPR 633/72'",
      limite: null,
    },
    {
      id: "det50",
      titolo: "Detrazione 50%",
      tag: "Ristrutturazione IRPEF",
      tagColor: "#D08008",
      requisiti: [
        "Immobile residenziale",
        "Pagamento con bonifico parlante bancario/postale",
        "Fattura intestata al beneficiario della detrazione",
        "Il beneficiario deve essere proprietario o familiare convivente",
      ],
      documenti: [
        "Bonifico parlante con causale specifica",
        "Fattura intestata al proprietario",
        "Comunicazione ENEA entro 90 gg fine lavori",
        "Codice fiscale proprietario",
      ],
      note: "Detrazione IRPEF in 10 rate annuali. Tetto spesa €96.000 per unità immobiliare. Cumula con IVA 10%.",
      fattura: "Bonifico causale: 'Bonifico per detrazioni fiscali art.16-bis DPR 917/86 - [P.IVA ditta] - [CF cliente]'",
      limite: "Max €96.000 per unità → detrazione max €48.000 in 10 anni (€4.800/anno)",
    },
    {
      id: "eco65",
      titolo: "Ecobonus 65%",
      tag: "Risparmio energetico",
      tagColor: "#059669",
      requisiti: [
        "Infissi con trasmittanza Uw ≤ 1,4 W/m²K (zona C-F)",
        "Pagamento con bonifico parlante",
        "Asseverazione tecnica (tecnico abilitato)",
        "Scheda tecnica produttore con Uw certificato",
      ],
      documenti: [
        "Bonifico parlante",
        "Fattura intestata beneficiario",
        "Scheda tecnica infisso con Uw",
        "Asseverazione tecnico (geometra/ingegnere/arch)",
        "Trasmissione ENEA entro 90 gg",
      ],
      note: "Tetto spesa €60.000 per intervento. Solo su edifici esistenti. Richiede verifica Uw per zona climatica. Cumula con IVA 10%.",
      fattura: "Bonifico causale: 'Bonifico per detrazioni fiscali art.1 c.344 L.296/2006 - [P.IVA] - [CF]'",
      limite: "Max €60.000 → detrazione max €39.000 in 10 anni",
    },
    {
      id: "bar75",
      titolo: "Barriere 75%",
      tag: "Accessibilità L.13/89",
      tagColor: "#8B5CF6",
      requisiti: [
        "Interventi per abbattimento barriere architettoniche",
        "Infissi con apertura facilitata, maniglioni, porte allargate",
        "Tutti i tipi di immobile (anche non residenziale)",
        "Pagamento con bonifico parlante",
      ],
      documenti: [
        "Bonifico parlante",
        "Fattura con descrizione specifica intervento",
        "Eventuale CILA/SCIA al Comune",
      ],
      note: "Nessuna asseverazione energetica richiesta. Valido anche per condomini. Detrazione in 5 rate (non 10). Tetto €50.000 unifamiliare, €40.000 condominio (per unità).",
      fattura: "In fattura: 'Fornitura e posa infissi per eliminazione barriere architettoniche - art.119-ter DL 34/2020'",
      limite: "Max €50.000 → detrazione max €37.500 in 5 anni",
    },
  ];

  const sel = VOCI.find(v => v.id === selected);

  if (!open) {
    return (
      <div onClick={() => setOpen(true)}
        style={{ margin: "0 0 10px", padding: "10px 14px", borderRadius: 12, background: "#3B7FE010", border: "1px solid #3B7FE030", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#3B7FE0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#3B7FE0" }}>Guida IVA e Detrazioni 2026</div>
            <div style={{ fontSize: 10, color: "#888" }}>IVA 4%, 10%, Detraz. 50%, Eco 65%, Barriere 75%</div>
          </div>
        </div>
        <div style={{ fontSize: 16, color: "#3B7FE0" }}>›</div>
      </div>
    );
  }

  return (
    <div style={{ margin: "0 0 10px", background: "#fff", borderRadius: 14, border: "1px solid #ddd", overflow: "hidden" }}>
      {/* Header */}
      <div onClick={() => { setOpen(false); setSelected(null); }} style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #eee", cursor: "pointer", background: "#3B7FE008" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#3B7FE0" }}>Guida IVA e Detrazioni 2026</div>
        <div style={{ fontSize: 18, color: "#888" }}>×</div>
      </div>

      {!selected ? (
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {VOCI.map(v => (
            <div key={v.id} onClick={() => setSelected(v.id)}
              style={{ padding: "12px 14px", borderRadius: 12, border: `1.5px solid ${v.tagColor}30`, background: v.tagColor + "08", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: `0 3px 0 ${v.tagColor}20`, transition: "all 0.1s" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: v.tagColor }}>{v.titolo}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{v.tag}</div>
              </div>
              <div style={{ fontSize: 16, color: v.tagColor }}>›</div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: "#aaa", textAlign: "center", padding: "4px 0" }}>Aggiornato Marzo 2026 · Solo orientativo, verifica con commercialista</div>
        </div>
      ) : sel ? (
        <div style={{ padding: "14px" }}>
          <div onClick={() => setSelected(null)} style={{ color: "#3B7FE0", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 12 }}>← Torna alla lista</div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ padding: "6px 14px", borderRadius: 20, background: sel.tagColor, color: "#fff", fontSize: 13, fontWeight: 700 }}>{sel.titolo}</div>
            <div style={{ fontSize: 12, color: sel.tagColor, fontWeight: 600 }}>{sel.tag}</div>
          </div>

          {sel.limite && (
            <div style={{ padding: "8px 12px", background: sel.tagColor + "12", borderRadius: 10, border: `1px solid ${sel.tagColor}30`, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: sel.tagColor }}>{sel.limite}</div>
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Requisiti</div>
            {sel.requisiti.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: sel.tagColor + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: sel.tagColor }} />
                </div>
                <div style={{ fontSize: 12, color: "#333" }}>{r}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Documenti necessari</div>
            {sel.documenti.map((d, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid #f5f5f5" }}>
                <div style={{ fontSize: 12, color: "#1A9E73", flexShrink: 0 }}>✓</div>
                <div style={{ fontSize: 12, color: "#333" }}>{d}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 12px", background: "#FFF8EC", borderRadius: 10, border: "1px solid #D0800830", marginBottom: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#D08008", marginBottom: 4 }}>TESTO FATTURA / BONIFICO</div>
            <div style={{ fontSize: 11, color: "#555", fontStyle: "italic", lineHeight: 1.5 }}>{sel.fattura}</div>
          </div>

          <div style={{ padding: "10px 12px", background: "#f9f9f9", borderRadius: 10, border: "1px solid #eee" }}>
            <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{sel.note}</div>
          </div>

          <div style={{ fontSize: 10, color: "#bbb", textAlign: "center", marginTop: 12 }}>Solo orientativo · Verifica con il commercialista</div>
        </div>
      ) : null}
    </div>
  );
}

// ============================================================
// CATALOGO ACCESSORI
// ============================================================
const CATEGORIE_LABEL = [
  { id: "maniglie", nome: "Maniglie" },
  { id: "cremonesi", nome: "Cremonesi" },
  { id: "cerniere", nome: "Cerniere" },
  { id: "serrature", nome: "Serrature" },
  { id: "cilindri", nome: "Cilindri" },
  { id: "motorizzazioni", nome: "Motoriz." },
  { id: "controtelai", nome: "Controtel." },
  { id: "soglie", nome: "Soglie" },
  { id: "varie", nome: "Varie" },
];

const CATALOGO_QUICK = [
  { id: "MI-001", categoria: "maniglie", codice: "3060", nome: "Martellina Karma DK", fornitore: "Master Italy", prezzo: 18, unitaMisura: "pz" },
  { id: "MI-002", categoria: "maniglie", codice: "3060K", nome: "Martellina Karma DK con chiave", fornitore: "Master Italy", prezzo: 25, unitaMisura: "pz" },
  { id: "MI-003", categoria: "maniglie", codice: "3060R", nome: "Martellina Karma Ribassata", fornitore: "Master Italy", prezzo: 20, unitaMisura: "pz" },
  { id: "MI-004", categoria: "maniglie", codice: "3067", nome: "Doppia Maniglia Karma", fornitore: "Master Italy", prezzo: 32, unitaMisura: "pz" },
  { id: "CR-001", categoria: "cremonesi", codice: "6065", nome: "Cremonese Karma Apertura Esterna", fornitore: "Master Italy", prezzo: 28, unitaMisura: "pz" },
  { id: "CR-002", categoria: "cremonesi", codice: "6060", nome: "Cremonese Karma Standard", fornitore: "Master Italy", prezzo: 22, unitaMisura: "pz" },
  { id: "SE-001", categoria: "serrature", codice: "CISA-1", nome: "Serratura CISA Standard", fornitore: "CISA", prezzo: 45, unitaMisura: "pz" },
  { id: "SE-002", categoria: "serrature", codice: "CISA-2", nome: "Serratura CISA Blindata", fornitore: "CISA", prezzo: 89, unitaMisura: "pz" },
  { id: "CI-001", categoria: "cilindri", codice: "CIL-1", nome: "Cilindro europeo standard", fornitore: "Yale", prezzo: 28, unitaMisura: "pz" },
  { id: "CI-002", categoria: "cilindri", codice: "CIL-2", nome: "Cilindro europeo alta sicurezza", fornitore: "Yale", prezzo: 65, unitaMisura: "pz" },
  { id: "CE-001", categoria: "cerniere", codice: "CER-1", nome: "Cerniera MACO standard", fornitore: "MACO", prezzo: 12, unitaMisura: "pz" },
  { id: "CE-002", categoria: "cerniere", codice: "CER-2", nome: "Cerniera MACO con molla", fornitore: "MACO", prezzo: 18, unitaMisura: "pz" },
  { id: "MO-001", categoria: "motorizzazioni", codice: "MOT-1", nome: "Motorizzazione tapparella 230V", fornitore: "Generico", prezzo: 120, unitaMisura: "pz" },
  { id: "MO-002", categoria: "motorizzazioni", codice: "MOT-2", nome: "Motorizzazione radio 433MHz", fornitore: "Generico", prezzo: 155, unitaMisura: "pz" },
  { id: "CT-001", categoria: "controtelai", codice: "CT-STD", nome: "Controtelaio standard", fornitore: "Generico", prezzo: 35, unitaMisura: "pz" },
  { id: "SG-001", categoria: "soglie", codice: "SOG-1", nome: "Soglia alluminio standard", fornitore: "Generico", prezzo: 22, unitaMisura: "ml" },
  { id: "VA-001", categoria: "varie", codice: "MIN-1", nome: "Kit minuteria", fornitore: "Generico", prezzo: 8, unitaMisura: "kit" },
  { id: "VA-002", categoria: "varie", codice: "SIG-1", nome: "Silicone neutro", fornitore: "Generico", prezzo: 5, unitaMisura: "pz" },
];

function AccessoriCatalogoSection({ vano, updV, T }: any) {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const items: any[] = vano.accessoriCatalogo || [];
  const totale = items.reduce((s, a) => s + (a.prezzoUnitario || 0) * (a.quantita || 1), 0);

  const filtered = CATALOGO_QUICK.filter(p => {
    const qOk = !query || p.nome.toLowerCase().includes(query.toLowerCase()) || p.codice.toLowerCase().includes(query.toLowerCase());
    const cOk = !catFilter || p.categoria === catFilter;
    return qOk && cOk;
  });

  const addItem = (p: any) => {
    const existing = items.find(a => a.catalogoId === p.id);
    if (existing) {
      updV({ accessoriCatalogo: items.map(a => a.catalogoId === p.id ? { ...a, quantita: a.quantita + 1 } : a) });
    } else {
      updV({ accessoriCatalogo: [...items, { catalogoId: p.id, codice: p.codice, nome: p.nome, fornitore: p.fornitore, quantita: 1, prezzoUnitario: p.prezzo, unitaMisura: p.unitaMisura, nota: "" }] });
    }
  };

  const updateQta = (catalogoId: string, delta: number) => {
    const updated = items.map(a => a.catalogoId !== catalogoId ? a : { ...a, quantita: Math.max(0, (a.quantita || 1) + delta) }).filter(a => a.quantita > 0);
    updV({ accessoriCatalogo: updated });
  };

  const updatePrezzo = (catalogoId: string, val: number) => {
    updV({ accessoriCatalogo: items.map(a => a.catalogoId !== catalogoId ? a : { ...a, prezzoUnitario: val }) });
  };

  const removeItem = (catalogoId: string) => updV({ accessoriCatalogo: items.filter(a => a.catalogoId !== catalogoId) });

  const inputBase = { padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 15, fontFamily: "Inter", background: T.bg, color: T.text, boxSizing: "border-box" as const };

  return (
    <div>
      <SectionLabel>Accessori catalogo</SectionLabel>
      {items.map(a => (
        <div key={a.catalogoId} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.bg, borderRadius: 10, border: `1px solid ${T.bdr}`, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
            <div style={{ fontSize: 10, color: T.sub }}>{a.codice} · {a.fornitore}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}` }}>
            <div onClick={() => updateQta(a.catalogoId, -1)} style={{ padding: "6px 12px", cursor: "pointer", fontSize: 16, fontWeight: 800, color: T.sub }}>-</div>
            <div style={{ padding: "6px 8px", fontSize: 14, fontWeight: 800, fontFamily: FM, color: T.text, minWidth: 22, textAlign: "center" }}>{a.quantita}</div>
            <div onClick={() => updateQta(a.catalogoId, 1)} style={{ padding: "6px 12px", cursor: "pointer", fontSize: 16, fontWeight: 800, color: ACC_COLOR }}>+</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 10, color: T.sub }}>€</span>
            <input
              inputMode="numeric"
              value={a.prezzoUnitario || 0}
              onChange={e => updatePrezzo(a.catalogoId, Number(e.target.value))}
              style={{ width: 58, padding: "6px 6px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 13, fontFamily: FM, textAlign: "right", background: T.bg, color: T.text }}
            />
          </div>
          <div style={{ fontSize: 12, fontWeight: 800, color: ACC_COLOR, fontFamily: FM, minWidth: 52, textAlign: "right" }}>
            €{fmt((a.prezzoUnitario || 0) * (a.quantita || 1))}
          </div>
          <div onClick={() => removeItem(a.catalogoId)} style={{ padding: "6px 8px", cursor: "pointer", fontSize: 18, color: RED, fontWeight: 800 }}>×</div>
        </div>
      ))}
      {items.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "2px 4px 8px", fontSize: 12 }}>
          <span style={{ fontWeight: 800, color: ACC_COLOR, fontFamily: FM }}>Totale accessori: €{fmt(totale)}</span>
        </div>
      )}
      <div onClick={() => { setShowSearch(true); setQuery(""); setCatFilter(""); }}
        style={{ padding: "12px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: ACC_COLOR + "10", border: `1.5px dashed ${ACC_COLOR}40`, fontSize: 13, fontWeight: 700, color: ACC_COLOR }}>
        + Aggiungi accessorio da catalogo
      </div>
      {showSearch && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "flex-end" }} onClick={() => setShowSearch(false)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 500, margin: "0 auto", background: T.card, borderRadius: "16px 16px 0 0", maxHeight: "82vh", display: "flex", flexDirection: "column" }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.bdr, margin: "8px auto 4px" }} />
            <div style={{ padding: "8px 16px 10px" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: ACC_COLOR, marginBottom: 8 }}>Catalogo accessori</div>
              <input value={query} onChange={e => setQuery(e.target.value)} autoFocus placeholder="Cerca nome o codice..."
                style={{ ...inputBase, width: "100%", fontSize: 15 }} />
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginTop: 8 }}>
                <div onClick={() => setCatFilter("")} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", background: !catFilter ? ACC_COLOR : T.bg, color: !catFilter ? "#fff" : T.sub, border: `1px solid ${!catFilter ? ACC_COLOR : T.bdr}` }}>Tutti</div>
                {CATEGORIE_LABEL.map(c => (
                  <div key={c.id} onClick={() => setCatFilter(catFilter === c.id ? "" : c.id)} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", background: catFilter === c.id ? ACC_COLOR + "15" : T.bg, color: catFilter === c.id ? ACC_COLOR : T.sub, border: `1px solid ${catFilter === c.id ? ACC_COLOR + "40" : T.bdr}` }}>
                    {c.nome}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 80px" }}>
              {filtered.length === 0 && <div style={{ textAlign: "center", padding: "24px 0", color: T.sub, fontSize: 13 }}>Nessun risultato</div>}
              {filtered.map(p => {
                const already = items.some(a => a.catalogoId === p.id);
                return (
                  <div key={p.id} onClick={() => addItem(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", background: already ? ACC_COLOR + "06" : T.card, borderRadius: 10, border: `1px solid ${already ? ACC_COLOR + "30" : T.bdr}`, marginBottom: 6, cursor: "pointer" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.nome}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{p.codice} · {p.fornitore}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: ACC_COLOR, fontFamily: FM }}>€{p.prezzo}</div>
                      <div style={{ fontSize: 9, color: T.sub }}>/{p.unitaMisura}</div>
                    </div>
                    {already && <div style={{ fontSize: 11, fontWeight: 800, color: GRN, background: GRN + "15", padding: "4px 8px", borderRadius: 6 }}>OK</div>}
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "12px 16px 28px", background: T.card, borderTop: `1px solid ${T.bdr}` }}>
              <div onClick={() => setShowSearch(false)} style={{ padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: ACC_COLOR, color: "#fff", fontSize: 14, fontWeight: 900 }}>
                Fatto ({items.length} selezionati · €{fmt(totale)})
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// WIZARD VANO - fullscreen 3 step
// ============================================================
const STEPS = ["Misure", "Accessori", "Prezzi"] as const;

function VanoWizard({ vano, idx, updVano, calcolaVanoPrezzo, selectedCM, T, onClose }: any) {
  const [step, setStep] = useState(0);
  const [showConfig, setShowConfig] = useState(false);

  const m = vano.misure || {};
  const pezzi = vano.pezzi || 1;
  const prezzoBase = calcolaVanoPrezzo ? calcolaVanoPrezzo(vano, selectedCM) : 0;
  const prezzoOverride = vano.prevPrezzoOverride;
  const prezzoUnitario = prezzoOverride !== undefined && prezzoOverride !== null ? prezzoOverride : prezzoBase;
  const accCat = (vano.accessoriCatalogo || []).reduce((s: number, a: any) => s + (a.prezzoUnitario || 0) * (a.quantita || 1), 0);
  const posaPrezzo = vano.prevPosaPrezzo || 0;
  const smontaggio = vano.prevSmontaggio || 0;
  const subtotale = (prezzoUnitario * pezzi) + accCat + posaPrezzo + smontaggio;

  const updV = (patch: any) => updVano(vano.id, patch);
  const updM = (key: string, val: number) => updV({ misure: { ...m, [key]: val } });
  const updTapp = (patch: any) => updV({ accessori: { ...vano.accessori, tapparella: { ...(vano.accessori?.tapparella || {}), ...patch } } });
  const updZanz = (patch: any) => updV({ accessori: { ...vano.accessori, zanzariera: { ...(vano.accessori?.zanzariera || {}), ...patch } } });

  const tapp = vano.accessori?.tapparella || {};
  const zanz = vano.accessori?.zanzariera || {};

  const inputBase = {
    padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.bdr}`,
    fontSize: 15, fontFamily: "Inter", background: T.bg, color: T.text,
    width: "100%", boxSizing: "border-box" as const,
  };

  if (showConfig) return (
    <VanoConfiguratoreFullscreen
      vano={vano}
      onSalva={(patch: any) => { updVano(vano.id, patch); setShowConfig(false); }}
      onChiudi={() => setShowConfig(false)}
      T={T}
    />
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, background: T.bg, display: "flex", flexDirection: "column" }}>

      {/* Topbar wizard */}
      <div style={{ background: "#1A1A1C", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div onClick={onClose} style={{ color: "#aaa", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>←</div>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>{vano.nome || `Vano ${idx + 1}`}{vano.tipo ? ` · ${vano.tipo}` : ""}</div>
          <div style={{ color: "#888", fontSize: 11 }}>{m.lCentro && m.hCentro ? `${m.lCentro}×${m.hCentro} mm` : "Misure da inserire"}</div>
        </div>
        <div style={{ background: AMB, color: "#fff", fontSize: 15, fontWeight: 700, padding: "6px 14px", borderRadius: 20, fontFamily: FM }}>€{fmt(subtotale)}</div>
      </div>

      {/* Stepper */}
      <div style={{ background: T.card, borderBottom: `1px solid ${T.bdr}`, padding: "10px 16px", display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div onClick={() => setStep(i)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", flex: 1 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: i < step ? GRN : i === step ? AMB : "#eee", color: i <= step ? "#fff" : "#bbb" }}>
                {i < step ? "✓" : i + 1}
              </div>
              <div style={{ fontSize: 10, fontWeight: i === step ? 700 : 500, color: i === step ? AMB : i < step ? GRN : "#bbb" }}>{s}</div>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? GRN : "#eee", marginBottom: 13 }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Contenuto step */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 100px" }}>

        {/* ===== STEP 0: MISURE ===== */}
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <SectionLabel>Misure vano (mm)</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <NInput label="L. Centro" value={m.lCentro || 0} onChange={v => updM("lCentro", v)} />
                <NInput label="H. Centro" value={m.hCentro || 0} onChange={v => updM("hCentro", v)} />
                <NInput label="L. Foro" value={m.lForo || 0} onChange={v => updM("lForo", v)} />
                <NInput label="H. Foro" value={m.hForo || 0} onChange={v => updM("hForo", v)} />
                <NInput label="L. Muro" value={m.lMuro || 0} onChange={v => updM("lMuro", v)} />
                <NInput label="H. Muro" value={m.hMuro || 0} onChange={v => updM("hMuro", v)} />
              </div>
            </div>
            <div>
              <SectionLabel>Rilievo vano (mm)</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <NInput label="Dav. Prof" value={m.davProf || 0} onChange={v => updM("davProf", v)} />
                <NInput label="Dav. Sporg" value={m.davSporg || 0} onChange={v => updM("davSporg", v)} />
                <NInput label="Soglia" value={m.soglia || 0} onChange={v => updM("soglia", v)} />
                <NInput label="Imbotte" value={m.imbotte || 0} onChange={v => updM("imbotte", v)} />
              </div>
            </div>
            <div>
              <SectionLabel>Info vano</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <TInput label="Tipo" value={vano.tipo || ""} onChange={v => updV({ tipo: v })} placeholder="F1A, F2B..." />
                <NInput label="N. Pezzi" value={vano.pezzi || 1} onChange={v => updV({ pezzi: Math.max(1, v) })} />
              </div>
              <div style={{ marginTop: 10 }}>
                <TInput label="Nome vano" value={vano.nome || ""} onChange={v => updV({ nome: v })} placeholder="Es. Finestra soggiorno" />
              </div>
              <div style={{ marginTop: 10 }}>
                <TInput label="Colore interno" value={vano.coloreInt || ""} onChange={v => updV({ coloreInt: v })} placeholder="RAL 7016, Bianco..." />
              </div>
              <div style={{ marginTop: 10 }}>
                <TInput label="Colore esterno" value={vano.coloreEst || ""} onChange={v => updV({ coloreEst: v })} placeholder="RAL 7016, Bianco..." />
              </div>
            </div>

            {/* Tapparella */}
            <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: tapp.attivo ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Tapparella</div>
                  {tapp.attivo && tapp.tipo && <div style={{ fontSize: 11, color: T.sub }}>{tapp.tipo}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <select value={tapp.tipo || "Non inclusa"}
                    onChange={e => updTapp({ tipo: e.target.value, attivo: e.target.value !== "Non inclusa" })}
                    style={{ ...inputBase, width: "auto", fontSize: 13, padding: "6px 10px" }}>
                    <option>Non inclusa</option>
                    <option>Avvolgente PVC</option>
                    <option>Avvolgente Alluminio</option>
                    <option>Frangisole</option>
                    <option>Veneziana</option>
                  </select>
                  <Toggle value={tapp.inclusa || false} onChange={v => updTapp({ inclusa: v })} />
                </div>
              </div>
              {tapp.attivo && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <NInput label="Larghezza (mm)" value={tapp.larghezza || 0} onChange={v => updTapp({ larghezza: v })} />
                    <NInput label="Altezza (mm)" value={tapp.altezza || 0} onChange={v => updTapp({ altezza: v })} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <TInput label="Colore" value={tapp.colore || ""} onChange={v => updTapp({ colore: v })} placeholder="RAL..." />
                    <TInput label="Spessore lama" value={tapp.spessore || ""} onChange={v => updTapp({ spessore: v })} placeholder="Es. 37mm" />
                  </div>
                  <NInput label="Prezzo (€)" value={tapp.prezzoTapp || 0} onChange={v => updTapp({ prezzoTapp: v })} />
                </div>
              )}
            </div>

            {/* Zanzariera */}
            <div style={{ background: T.card, borderRadius: 12, border: `1px solid ${T.bdr}`, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: zanz.attivo ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Zanzariera</div>
                  {zanz.attivo && zanz.tipo && <div style={{ fontSize: 11, color: T.sub }}>{zanz.tipo}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <select value={zanz.tipo || "Non inclusa"}
                    onChange={e => updZanz({ tipo: e.target.value, attivo: e.target.value !== "Non inclusa" })}
                    style={{ ...inputBase, width: "auto", fontSize: 13, padding: "6px 10px" }}>
                    <option>Non inclusa</option>
                    <option>Avvolgente</option>
                    <option>Plisse</option>
                    <option>Laterale</option>
                    <option>Battente</option>
                    <option>ZIP</option>
                  </select>
                  <Toggle value={zanz.inclusa || false} onChange={v => updZanz({ inclusa: v })} />
                </div>
              </div>
              {zanz.attivo && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <NInput label="Larghezza (mm)" value={zanz.larghezza || 0} onChange={v => updZanz({ larghezza: v })} />
                    <NInput label="Altezza (mm)" value={zanz.altezza || 0} onChange={v => updZanz({ altezza: v })} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <TInput label="Colore" value={zanz.colore || ""} onChange={v => updZanz({ colore: v })} placeholder="RAL..." />
                    <TInput label="Tipo rete" value={zanz.rete || ""} onChange={v => updZanz({ rete: v })} placeholder="Standard, Anti-polline..." />
                  </div>
                  <NInput label="Prezzo (€)" value={zanz.prezzoZanz || 0} onChange={v => updZanz({ prezzoZanz: v })} />
                </div>
              )}
            </div>

            {/* Note vano */}
            <div>
              <SectionLabel>Note vano</SectionLabel>
              <textarea value={vano.prevNote || ""} onChange={e => updV({ prevNote: e.target.value })}
                placeholder="Note specifiche per questo vano..."
                style={{ ...inputBase, minHeight: 80, resize: "vertical", lineHeight: 1.5, fontSize: 15 }} />
            </div>
          </div>
        )}

        {/* ===== STEP 1: ACCESSORI ===== */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AccessoriCatalogoSection vano={vano} updV={updV} T={T} />

            <div>
              <SectionLabel>Voci libere vano</SectionLabel>
              {(vano.vociLibere || []).map((vl: any, vi: number) => (
                <div key={vi} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                  <input value={vl.desc || ""} placeholder="Descrizione..."
                    onChange={e => { const nl = [...(vano.vociLibere || [])]; nl[vi] = { ...nl[vi], desc: e.target.value }; updV({ vociLibere: nl }); }}
                    style={{ ...inputBase, flex: 2 }} />
                  <input inputMode="numeric" value={vl.qta || ""} placeholder="Qta"
                    onChange={e => { const nl = [...(vano.vociLibere || [])]; nl[vi] = { ...nl[vi], qta: Number(e.target.value) }; updV({ vociLibere: nl }); }}
                    style={{ ...inputBase, width: 60 }} />
                  <input inputMode="numeric" value={vl.prezzo || ""} placeholder="€"
                    onChange={e => { const nl = [...(vano.vociLibere || [])]; nl[vi] = { ...nl[vi], prezzo: Number(e.target.value) }; updV({ vociLibere: nl }); }}
                    style={{ ...inputBase, width: 80 }} />
                  <div onClick={() => { const nl = (vano.vociLibere || []).filter((_: any, i: number) => i !== vi); updV({ vociLibere: nl }); }}
                    style={{ padding: "6px 8px", cursor: "pointer", color: RED, fontSize: 18, fontWeight: 800 }}>×</div>
                </div>
              ))}
              <div onClick={() => updV({ vociLibere: [...(vano.vociLibere || []), { desc: "", qta: 1, prezzo: 0 }] })}
                style={{ padding: "10px", borderRadius: 8, textAlign: "center", cursor: "pointer", border: `1.5px dashed ${T.bdr}`, fontSize: 13, color: T.sub }}>
                + Aggiungi voce
              </div>
            </div>

            {/* Config infisso */}
            <div>
              <SectionLabel>Configurazione infisso</SectionLabel>
              {vano.infissoConfig?.tipo ? (
                <div style={{ padding: 12, background: AMB + "10", borderRadius: 12, border: `1px solid ${AMB}30` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: AMB }}>{vano.infissoConfig.tipId || "Configurato"}</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 2 }}>{vano.misure?.lCentro || "—"}×{vano.misure?.hCentro || "—"} mm</div>
                  <div onClick={() => setShowConfig(true)} style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: AMB, color: "#fff", fontSize: 13, fontWeight: 700, textAlign: "center", cursor: "pointer" }}>
                    Modifica configurazione
                  </div>
                </div>
              ) : (
                <div onClick={() => setShowConfig(true)}
                  style={{ padding: "32px 20px", borderRadius: 14, border: `2px dashed ${AMB}50`, textAlign: "center", cursor: "pointer", background: AMB + "05" }}>
                  <div style={{ fontSize: 30, marginBottom: 6 }}>📐</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: AMB }}>Apri configuratore infisso</div>
                  <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Tipologia, campiture, ferramenta</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== STEP 2: PREZZI ===== */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <SectionLabel>Prezzo infisso</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 700, color: "#8e8e93", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 3 }}>Prezzo unitario (€)</label>
                  <input
                    inputMode="numeric"
                    value={prezzoOverride !== undefined && prezzoOverride !== null ? prezzoOverride : (prezzoBase || "")}
                    placeholder={prezzoBase > 0 ? `Auto: €${fmt(prezzoBase)}` : "0"}
                    onChange={e => updV({ prevPrezzoOverride: e.target.value === "" ? null : Number(e.target.value) })}
                    style={{ padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${prezzoOverride !== undefined && prezzoOverride !== null ? AMB : T.bdr}`, fontSize: 15, fontFamily: FM, textAlign: "right", background: T.bg, color: T.text, width: "100%", boxSizing: "border-box" }}
                  />
                  {prezzoOverride !== null && prezzoOverride !== undefined && (
                    <div onClick={() => updV({ prevPrezzoOverride: null })} style={{ fontSize: 10, color: T.sub, cursor: "pointer", marginTop: 3 }}>× Ripristina auto (€{fmt(prezzoBase)})</div>
                  )}
                </div>
                <div>
                  <div style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.bdr}`, background: GRN + "08", fontSize: 15, fontWeight: 800, fontFamily: FM, color: GRN, textAlign: "right" }}>
                    <div style={{ fontSize: 9, color: T.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 }}>Subtotale infisso</div>
                    €{fmt(prezzoUnitario * pezzi)}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionLabel>Posa e smontaggio</SectionLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 700, color: "#8e8e93", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 3 }}>Posa</label>
                  <select value={vano.prevPosa || "Inclusa"} onChange={e => updV({ prevPosa: e.target.value })}
                    style={{ padding: "10px 8px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 14, background: T.bg, color: T.text, width: "100%" }}>
                    <option>Inclusa</option>
                    <option>Esclusa</option>
                    <option>Personalizzata</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 9, fontWeight: 700, color: "#8e8e93", letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 3 }}>Smontaggio</label>
                  <select value={vano.prevSmontaggio || "Non richiesto"} onChange={e => updV({ prevSmontaggio: e.target.value })}
                    style={{ padding: "10px 8px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 14, background: T.bg, color: T.text, width: "100%" }}>
                    <option>Non richiesto</option>
                    <option>Incluso</option>
                    <option>A pagamento</option>
                  </select>
                </div>
                <NInput label="Prezzo posa (€)" value={vano.prevPosaPrezzo || 0} onChange={v => updV({ prevPosaPrezzo: v })} />
              </div>
            </div>

            {/* Riepilogo vano */}
            <div style={{ background: GRN + "08", borderRadius: 14, border: `1px solid ${GRN}25`, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.sub, marginBottom: 10 }}>RIEPILOGO VANO</div>
              {[
                { label: `Infisso x${pezzi}`, val: prezzoUnitario * pezzi },
                { label: "Accessori catalogo", val: accCat },
                { label: "Posa", val: posaPrezzo },
              ].filter(r => r.val > 0).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                  <span style={{ color: T.sub }}>{r.label}</span>
                  <span style={{ fontWeight: 700, fontFamily: FM, color: T.text }}>€{fmt(r.val)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: `1.5px solid ${GRN}30`, marginTop: 8, paddingTop: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: GRN }}>Totale vano</span>
                <span style={{ fontSize: 20, fontWeight: 900, fontFamily: FM, color: GRN }}>€{fmt(subtotale)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer navigazione */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.card, borderTop: `1px solid ${T.bdr}`, padding: "12px 16px 28px", display: "flex", gap: 10, zIndex: 10 }}>
        {step > 0 ? (
          <div onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: T.bg, border: `1px solid ${T.bdr}`, fontSize: 15, fontWeight: 700, color: T.sub }}>
            Indietro
          </div>
        ) : (
          <div onClick={onClose} style={{ flex: 1, padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: T.bg, border: `1px solid ${T.bdr}`, fontSize: 15, fontWeight: 700, color: T.sub }}>
            Chiudi
          </div>
        )}
        {step < STEPS.length - 1 ? (
          <div onClick={() => setStep(s => s + 1)} style={{ flex: 2, padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: GRN, color: "#fff", fontSize: 15, fontWeight: 800 }}>
            Avanti — {STEPS[step + 1]}
          </div>
        ) : (
          <div onClick={onClose} style={{ flex: 2, padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: GRN, color: "#fff", fontSize: 15, fontWeight: 800 }}>
            Fatto · €{fmt(subtotale)}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPALE
// ============================================================
export default function PreventivoConfiguratoreTab() {
  const {
    T, selectedCM, setSelectedCM, setCantieri,
    calcolaVanoPrezzo, getVaniAttivi,
    generaPreventivoPDF, generaPreventivoCondivisibile,
    aziendaInfo,
  } = useMastro();

  if (!selectedCM) return null;
  const c = selectedCM;

  const [vanoWizard, setVanoWizard] = useState<any>(null);

  const updCM = useCallback((field: string, val: any) => {
    setCantieri((cs: any[]) => cs.map(x => x.id === c.id ? { ...x, [field]: val } : x));
    setSelectedCM((p: any) => ({ ...p, [field]: val }));
  }, [c.id, setCantieri, setSelectedCM]);

  const updVano = useCallback((vanoId: any, patch: any) => {
    const rilievi = c.rilievi || [];
    if (rilievi.length > 0) {
      const lastIdx = rilievi.length - 1;
      const updRilievi = rilievi.map((r: any, i: number) =>
        i === lastIdx
          ? { ...r, vani: (r.vani || []).map((v: any) => v.id === vanoId ? { ...v, ...patch } : v) }
          : r
      );
      setCantieri((cs: any[]) => cs.map(x => x.id === c.id ? { ...x, rilievi: updRilievi } : x));
      setSelectedCM((p: any) => ({ ...p, rilievi: updRilievi }));
    } else {
      const newVani = (c.vani || []).map((v: any) => v.id === vanoId ? { ...v, ...patch } : v);
      updCM("vani", newVani);
    }
  }, [c.rilievi, c.vani, c.id, updCM, setCantieri, setSelectedCM]);

  const vani = getVaniAttivi ? getVaniAttivi(c) : (c.vani || []).filter((v: any) => !v.eliminato);

  const totVani = vani.reduce((s: number, v: any) => {
    const base = calcolaVanoPrezzo ? calcolaVanoPrezzo(v, c) : (v.prevPrezzoOverride ?? 0);
    const prezzoU = v.prevPrezzoOverride !== undefined && v.prevPrezzoOverride !== null ? v.prevPrezzoOverride : base;
    const accCat = (v.accessoriCatalogo || []).reduce((sa: number, a: any) => sa + (a.prezzoUnitario || 0) * (a.quantita || 1), 0);
    const posa = v.prevPosaPrezzo || 0;
    return s + (prezzoU * (v.pezzi || 1)) + accCat + posa;
  }, 0);

  const vociLib = (c.vociLibere || []).reduce((s: number, vl: any) => s + (vl.importo || 0) * (vl.qta || 1), 0);
  const scontoPerc = parseFloat(c.sconto || c.scontoPerc || 0);
  const totBase = totVani + vociLib;
  const scontoVal = totBase * scontoPerc / 100;
  const imponibile = totBase - scontoVal;
  const ivaPerc = parseFloat(c.iva || c.aliquotaIva || c.ivaPerc || 10);
  const ivaVal = imponibile * ivaPerc / 100;
  const totIva = imponibile + ivaVal;
  const acconto = parseFloat(c.accontoRicevuto || 0);
  const saldo = totIva - acconto;

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1px solid ${T.bdr}`, fontSize: 15, fontFamily: "Inter",
    background: T.bg, color: T.text, boxSizing: "border-box" as const,
  };

  // Se wizard vano aperto, mostralo fullscreen
  if (vanoWizard) {
    const vanoLive = vani.find((v: any) => v.id === vanoWizard.id) || vanoWizard;
    const vanoIdx = vani.findIndex((v: any) => v.id === vanoWizard.id);
    return (
      <VanoWizard
        vano={vanoLive}
        idx={vanoIdx >= 0 ? vanoIdx : vani.length}
        updVano={updVano}
        calcolaVanoPrezzo={calcolaVanoPrezzo}
        selectedCM={c}
        T={T}
        onClose={() => setVanoWizard(null)}
      />
    );
  }

  return (
    <div style={{ paddingBottom: 40 }}>

      <GuidaDetrazioni T={T} />

      {/* PRATICA FISCALE */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "12px 14px", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 10 }}>Pratica fiscale</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[
            { id: "nessuna", label: "Nessuna" },
            { id: "50", label: "Ristrutturazione 50%" },
            { id: "65", label: "Ecobonus 65%" },
            { id: "75", label: "Barriere 75%" },
          ].map(opt => (
            <div key={opt.id} onClick={() => updCM("detrazione", opt.id)}
              style={{ padding: "8px 14px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 700, border: `1.5px solid ${c.detrazione === opt.id || (!c.detrazione && opt.id === "nessuna") ? T.acc : T.bdr}`, background: c.detrazione === opt.id || (!c.detrazione && opt.id === "nessuna") ? T.acc + "15" : T.bg, color: c.detrazione === opt.id || (!c.detrazione && opt.id === "nessuna") ? T.acc : T.sub }}>
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      {/* IVA + SCONTO */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "12px 14px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>IVA Infissi</span>
          <div style={{ display: "flex", gap: 6 }}>
            {["4", "10", "22"].map(p => (
              <div key={p} onClick={() => updCM("iva", p)}
                style={{ padding: "7px 16px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 700, background: String(ivaPerc) === p ? GRN : T.bg, color: String(ivaPerc) === p ? "#fff" : T.sub, border: `1.5px solid ${String(ivaPerc) === p ? GRN : T.bdr}` }}>
                {p}%
              </div>
            ))}
          </div>
        </div>
        {ivaPerc === 10 && <div style={{ fontSize: 12, color: AMB, background: AMB + "12", padding: "7px 10px", borderRadius: 8, marginBottom: 10 }}>IVA 10%: manutenzione straordinaria residenziale.</div>}
        {ivaPerc === 4 && <div style={{ fontSize: 12, color: AMB, background: AMB + "12", padding: "7px 10px", borderRadius: 8, marginBottom: 10 }}>IVA 4%: prima casa o disabilita — allegare documentazione.</div>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>Sconto globale</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[{ v: 0, l: "No" }, { v: 5, l: "5%" }, { v: 10, l: "10%" }, { v: 15, l: "15%" }, { v: 20, l: "20%" }].map(opt => (
              <div key={opt.v} onClick={() => updCM("sconto", opt.v)}
                style={{ padding: "7px 12px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 700, background: scontoPerc === opt.v ? (opt.v === 0 ? GRN : AMB) : T.bg, color: scontoPerc === opt.v ? "#fff" : T.sub, border: `1.5px solid ${scontoPerc === opt.v ? (opt.v === 0 ? GRN : AMB) : T.bdr}` }}>
                {opt.l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LISTA VANI — card compatte, click apre wizard */}
      {vani.map((v: any, i: number) => {
        const base = calcolaVanoPrezzo ? calcolaVanoPrezzo(v, c) : (v.prevPrezzoOverride ?? 0);
        const prezzoU = v.prevPrezzoOverride !== undefined && v.prevPrezzoOverride !== null ? v.prevPrezzoOverride : base;
        const accCatV = (v.accessoriCatalogo || []).reduce((s: number, a: any) => s + (a.prezzoUnitario || 0) * (a.quantita || 1), 0);
        const posaV = v.prevPosaPrezzo || 0;
        const totV = (prezzoU * (v.pezzi || 1)) + accCatV + posaV;
        const m = v.misure || {};
        const hasMisure = m.lCentro && m.hCentro;
        return (
          <div key={v.id} onClick={() => setVanoWizard(v)}
            style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, marginBottom: 8, padding: "14px 14px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", activeOpacity: 0.8 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: GRN, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 900, color: "#fff", flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{v.nome || `Vano ${i + 1}`}
                {v.tipo && <span style={{ fontSize: 11, fontWeight: 600, color: T.sub, marginLeft: 6 }}>{v.tipo}</span>}
                {(v.pezzi || 1) > 1 && <span style={{ fontSize: 11, fontWeight: 700, color: GRN, marginLeft: 4 }}>×{v.pezzi}</span>}
              </div>
              <div style={{ fontSize: 12, color: hasMisure ? T.sub : AMB, marginTop: 2 }}>
                {hasMisure ? `${m.lCentro}×${m.hCentro} mm${v.coloreInt ? ` · ${v.coloreInt}` : ""}` : "Tocca per inserire misure"}
              </div>
              {((v.accessoriCatalogo?.length || 0) > 0 || v.accessori?.tapparella?.attivo || v.accessori?.zanzariera?.attivo) && (
                <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                  {v.accessori?.tapparella?.attivo && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: AMB + "15", color: AMB, fontWeight: 600 }}>Tapp.</span>}
                  {v.accessori?.zanzariera?.attivo && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: BLU + "15", color: BLU, fontWeight: 600 }}>Zanz.</span>}
                  {(v.accessoriCatalogo?.length || 0) > 0 && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 6, background: ACC_COLOR + "15", color: ACC_COLOR, fontWeight: 600 }}>{v.accessoriCatalogo.length} acc.</span>}
                </div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: GRN, fontFamily: FM }}>€{fmt(totV)}</div>
              <div style={{ fontSize: 10, color: T.sub, fontFamily: FM }}>€{fmt(prezzoU)}/pz</div>
            </div>
            <div style={{ color: T.sub, fontSize: 18 }}>›</div>
          </div>
        );
      })}

      {/* Aggiungi vano */}
      <div onClick={() => {
        const newV = { id: Date.now(), nome: `Vano ${vani.length + 1}`, tipo: "F2A", pezzi: 1, misure: {}, accessori: { tapparella: { attivo: false }, zanzariera: { attivo: false } }, accessoriCatalogo: [], vociLibere: [] };
        const rilievi = c.rilievi || [];
        if (rilievi.length > 0) {
          const lastIdx = rilievi.length - 1;
          const updRilievi = rilievi.map((r: any, i: number) =>
            i === lastIdx ? { ...r, vani: [...(r.vani || []), newV] } : r
          );
          setCantieri((cs: any[]) => cs.map(x => x.id === c.id ? { ...x, rilievi: updRilievi } : x));
          setSelectedCM((p: any) => ({ ...p, rilievi: updRilievi }));
        } else {
          updCM("vani", [...(c.vani || []), newV]);
        }
        setVanoWizard(newV);
      }} style={{ padding: "16px", borderRadius: 14, textAlign: "center", cursor: "pointer", border: `1.5px dashed ${GRN}60`, fontSize: 14, fontWeight: 700, color: GRN, marginBottom: 10, background: GRN + "05" }}>
        + Aggiungi vano
      </div>

      {/* VOCI EXTRA COMMESSA */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "12px 14px", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 8 }}>Voci extra commessa</div>
        {(c.vociLibere || []).map((vl: any, vi: number) => (
          <div key={vi} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <input value={vl.desc || ""} placeholder="Descrizione..."
              onChange={e => { const nl = [...(c.vociLibere || [])]; nl[vi] = { ...nl[vi], desc: e.target.value }; updCM("vociLibere", nl); }}
              style={{ ...inputStyle, flex: 2 }} />
            <input inputMode="numeric" value={vl.qta || ""} placeholder="Qta"
              onChange={e => { const nl = [...(c.vociLibere || [])]; nl[vi] = { ...nl[vi], qta: Number(e.target.value) }; updCM("vociLibere", nl); }}
              style={{ ...inputStyle, width: 60 }} />
            <input inputMode="numeric" value={vl.importo || ""} placeholder="€"
              onChange={e => { const nl = [...(c.vociLibere || [])]; nl[vi] = { ...nl[vi], importo: Number(e.target.value) }; updCM("vociLibere", nl); }}
              style={{ ...inputStyle, width: 80 }} />
            <div style={{ fontSize: 12, fontWeight: 800, color: GRN, fontFamily: FM, minWidth: 58, textAlign: "right" }}>€{fmt((vl.importo || 0) * (vl.qta || 1))}</div>
            <div onClick={() => { const nl = (c.vociLibere || []).filter((_: any, i: number) => i !== vi); updCM("vociLibere", nl); }}
              style={{ padding: "6px 8px", cursor: "pointer", color: RED, fontSize: 18, fontWeight: 800 }}>×</div>
          </div>
        ))}
        <div onClick={() => updCM("vociLibere", [...(c.vociLibere || []), { desc: "", qta: 1, importo: 0 }])}
          style={{ padding: "10px", borderRadius: 8, textAlign: "center", cursor: "pointer", border: `1.5px dashed ${T.bdr}`, fontSize: 13, color: T.sub }}>
          + Aggiungi voce
        </div>
      </div>

      {/* NOTE PREVENTIVO */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "12px 14px", marginBottom: 10 }}>
        <textarea value={c.notePreventivo || ""} onChange={e => updCM("notePreventivo", e.target.value)}
          placeholder="Note aggiuntive, condizioni speciali per questa commessa..."
          style={{ ...inputStyle, minHeight: 72, resize: "vertical", lineHeight: 1.5 }} />
      </div>

      {/* TOTALI */}
      <div style={{ background: T.card, borderRadius: 14, border: `1px solid ${T.bdr}`, padding: "14px", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.text, marginBottom: 10 }}>Riepilogo economico</div>
        {[
          { label: "Totale vani", val: totVani, color: T.text },
          { label: "Voci extra", val: vociLib, color: T.text },
          scontoPerc > 0 ? { label: `Sconto ${scontoPerc}%`, val: -scontoVal, color: AMB } : null,
          { label: "Imponibile", val: imponibile, color: T.text, bold: true },
          { label: `IVA ${ivaPerc}%`, val: ivaVal, color: T.sub },
          { label: "TOTALE", val: totIva, color: GRN, big: true },
        ].filter(Boolean).map((row: any, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: row.big ? "8px 0" : "5px 0", borderTop: row.big ? `1.5px solid ${T.bdr}` : "none" }}>
            <span style={{ fontSize: row.big ? 15 : 13, fontWeight: row.bold || row.big ? 800 : 600, color: row.color }}>{row.label}</span>
            <span style={{ fontSize: row.big ? 20 : 14, fontWeight: 900, color: row.color, fontFamily: FM }}>€{fmt(Math.abs(row.val))}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: T.bg, border: `1px solid ${T.bdr}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: T.sub }}>Acconto ricevuto</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 12, color: T.sub }}>€</span>
              <input inputMode="numeric" value={acconto || ""} placeholder="0"
                onChange={e => updCM("accontoRicevuto", Number(e.target.value))}
                style={{ width: 100, padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.bdr}`, fontSize: 15, fontFamily: FM, textAlign: "right", background: T.card, color: T.text }} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Saldo</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: saldo > 0 ? RED : GRN, fontFamily: FM }}>€{fmt(saldo)}</span>
          </div>
        </div>
      </div>

      {/* PDF */}
      <div style={{ display: "flex", gap: 10 }}>
        <div onClick={() => generaPreventivoPDF && generaPreventivoPDF(c, aziendaInfo)}
          style={{ flex: 1, padding: "15px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: GRN, color: "#fff", fontSize: 15, fontWeight: 900 }}>
          Genera PDF
        </div>
        {generaPreventivoCondivisibile && (
          <div onClick={() => generaPreventivoCondivisibile(c, aziendaInfo)}
            style={{ flex: 1, padding: "15px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: BLU, color: "#fff", fontSize: 15, fontWeight: 900 }}>
            Link condivisibile
          </div>
        )}
      </div>
    </div>
  );
}
