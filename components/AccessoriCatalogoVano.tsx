"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — AccessoriCatalogoVano v1
// Sezione accessori da catalogo nel dettaglio vano
// Cerca, filtra, aggiungi da catalogo fornitori
// ═══════════════════════════════════════════════════════════
import React, { useState, useMemo } from "react";
import { FF, FM, ICO, I } from "./mastro-constants";
import { CATALOGO_DEFAULT, CATEGORIE_ACCESSORI, FORNITORI, searchCatalogo } from "./catalogo-accessori-default";

const ACC_COLOR = "#8B5CF6";
const CATEGORIE = CATEGORIE_ACCESSORI.map(c => c.id);
const FORN_IDS = FORNITORI.map(f => f.id);

export default function AccessoriCatalogoVano({ vano, updateVanoField, T }) {
  const [open, setOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [fornFilter, setFornFilter] = useState("");

  const items = vano.accessoriCatalogo || [];
  const totale = items.reduce((s, a) => s + (a.prezzoUnitario || 0) * (a.quantita || 1), 0);

  // Ricerca nel catalogo
  const results = useMemo(() => {
    if (!showSearch) return [];
    return searchCatalogo(CATALOGO_DEFAULT, query, catFilter, fornFilter).slice(0, 30);
  }, [showSearch, query, catFilter, fornFilter]);

  const addItem = (prodotto) => {
    const existing = items.find(a => a.catalogoId === prodotto.id);
    if (existing) {
      const updated = items.map(a => a.catalogoId === prodotto.id ? { ...a, quantita: a.quantita + 1 } : a);
      updateVanoField(vano.id, "accessoriCatalogo", updated);
    } else {
      const newItem = {
        catalogoId: prodotto.id,
        codice: prodotto.codice,
        nome: prodotto.nome,
        fornitore: prodotto.fornitore,
        quantita: 1,
        prezzoUnitario: prodotto.prezzo,
        unitaMisura: prodotto.unitaMisura,
        nota: "",
      };
      updateVanoField(vano.id, "accessoriCatalogo", [...items, newItem]);
    }
  };

  const updateQta = (catalogoId, delta) => {
    const updated = items.map(a => {
      if (a.catalogoId !== catalogoId) return a;
      const nq = Math.max(0, (a.quantita || 1) + delta);
      return { ...a, quantita: nq };
    }).filter(a => a.quantita > 0);
    updateVanoField(vano.id, "accessoriCatalogo", updated);
  };

  const removeItem = (catalogoId) => {
    updateVanoField(vano.id, "accessoriCatalogo", items.filter(a => a.catalogoId !== catalogoId));
  };

  return (
    <>
      {/* Header collapsible */}
      <div onClick={() => setOpen(!open)} style={{
        padding: "12px 16px", borderRadius: 12, marginBottom: 8, cursor: "pointer",
        border: `1px solid ${open ? ACC_COLOR : T.bdr}`,
        background: open ? ACC_COLOR + "08" : T.card,
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🏷</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: open ? ACC_COLOR : T.text }}>Accessori da catalogo</span>
          {items.length > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, background: ACC_COLOR + "15", color: ACC_COLOR, padding: "2px 8px", borderRadius: 6 }}>
              {items.length} · €{totale.toFixed(0)}
            </span>
          )}
        </div>
        <span style={{ fontSize: 13, color: T.sub, transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
      </div>

      {open && (
        <div style={{ marginBottom: 12, padding: "0 4px" }}>
          {/* Items aggiunti */}
          {items.map(a => (
            <div key={a.catalogoId} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
              background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}`, marginBottom: 4
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.nome}</div>
                <div style={{ fontSize: 9, color: T.sub }}>{a.codice} · {a.fornitore} · €{a.prezzoUnitario}/{a.unitaMisura || "pz"}</div>
              </div>
              {/* Quantità */}
              <div style={{ display: "flex", alignItems: "center", gap: 0, background: T.bg, borderRadius: 8, border: `1px solid ${T.bdr}` }}>
                <div onClick={() => updateQta(a.catalogoId, -1)} style={{ padding: "6px 10px", cursor: "pointer", fontSize: 14, fontWeight: 800, color: T.sub }}>−</div>
                <div style={{ padding: "6px 8px", fontSize: 13, fontWeight: 800, fontFamily: FM, color: T.text, minWidth: 20, textAlign: "center" }}>{a.quantita}</div>
                <div onClick={() => updateQta(a.catalogoId, 1)} style={{ padding: "6px 10px", cursor: "pointer", fontSize: 14, fontWeight: 800, color: ACC_COLOR }}>+</div>
              </div>
              {/* Subtotale */}
              <div style={{ fontSize: 11, fontWeight: 800, color: ACC_COLOR, fontFamily: FM, minWidth: 50, textAlign: "right" }}>
                €{((a.prezzoUnitario || 0) * (a.quantita || 1)).toFixed(0)}
              </div>
              {/* Rimuovi */}
              <div onClick={() => removeItem(a.catalogoId)} style={{ padding: "4px", cursor: "pointer", fontSize: 12, color: "#DC4444" }}>×</div>
            </div>
          ))}

          {/* Totale */}
          {items.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", fontSize: 11 }}>
              <span style={{ color: T.sub, fontWeight: 600 }}>{items.length} accessori</span>
              <span style={{ fontWeight: 800, color: ACC_COLOR }}>Totale: €{totale.toFixed(2)}</span>
            </div>
          )}

          {/* Bottone aggiungi */}
          <div onClick={() => { setShowSearch(true); setQuery(""); setCatFilter(""); setFornFilter(""); }}
            style={{ marginTop: 6, padding: "12px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: ACC_COLOR + "10", border: `1.5px dashed ${ACC_COLOR}40`, fontSize: 12, fontWeight: 700, color: ACC_COLOR }}>
            + Aggiungi da catalogo
          </div>
        </div>
      )}

      {/* ═══ BOTTOM SHEET RICERCA ═══ */}
      {showSearch && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end" }}
          onClick={() => setShowSearch(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: 500, margin: "0 auto", background: T.card,
            borderRadius: "16px 16px 0 0", maxHeight: "85vh", display: "flex", flexDirection: "column"
          }}>
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: T.bdr, margin: "8px auto 4px" }} />
            
            {/* Header */}
            <div style={{ padding: "8px 16px 10px" }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: ACC_COLOR, marginBottom: 8 }}>🏷 Catalogo accessori</div>
              
              {/* Search input */}
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                <input value={query} onChange={e => setQuery(e.target.value)} autoFocus
                  placeholder="Cerca per nome o codice..." 
                  style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${ACC_COLOR}40`, fontSize: 13, fontFamily: "Inter", background: T.bg }} />
              </div>

              {/* Filtri categoria */}
              <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4, marginBottom: 4 }}>
                <div onClick={() => setCatFilter("")} style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                  background: !catFilter ? ACC_COLOR : T.bg, color: !catFilter ? "#fff" : T.sub, border: `1px solid ${!catFilter ? ACC_COLOR : T.bdr}`
                }}>Tutti</div>
                {CATEGORIE_ACCESSORI.map(c => (
                  <div key={c.id} onClick={() => setCatFilter(catFilter === c.id ? "" : c.id)} style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                    background: catFilter === c.id ? ACC_COLOR + "15" : T.bg, color: catFilter === c.id ? ACC_COLOR : T.sub,
                    border: `1px solid ${catFilter === c.id ? ACC_COLOR + "40" : T.bdr}`
                  }}>{c.icon} {c.nome}</div>
                ))}
              </div>

              {/* Filtri fornitore */}
              <div style={{ display: "flex", gap: 3, overflowX: "auto", paddingBottom: 4 }}>
                {FORNITORI.map(f => (
                  <div key={f.id} onClick={() => setFornFilter(fornFilter === f.id ? "" : f.id)} style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 9, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                    background: fornFilter === f.id ? f.colore + "15" : T.bg, color: fornFilter === f.id ? f.colore : T.sub,
                    border: `1px solid ${fornFilter === f.id ? f.colore + "40" : T.bdr}`
                  }}>{f.nome}</div>
                ))}
              </div>
            </div>

            {/* Results */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 80px" }}>
              {results.length === 0 && (
                <div style={{ textAlign: "center", padding: "24px 0", color: T.sub, fontSize: 11 }}>
                  {query || catFilter || fornFilter ? "Nessun risultato" : "Cerca un accessorio o seleziona una categoria"}
                </div>
              )}
              {results.map(p => {
                const alreadyAdded = items.some(a => a.catalogoId === p.id);
                return (
                  <div key={p.id} onClick={() => addItem(p)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    background: alreadyAdded ? ACC_COLOR + "06" : T.card, borderRadius: 10,
                    border: `1px solid ${alreadyAdded ? ACC_COLOR + "30" : T.bdr}`, marginBottom: 4, cursor: "pointer"
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{p.nome}</div>
                      <div style={{ fontSize: 9, color: T.sub, marginTop: 1 }}>
                        {p.codice} · {p.fornitore} · {p.categoria}
                        {p.sottoCategoria ? " · " + p.sottoCategoria : ""}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: ACC_COLOR, fontFamily: FM }}>€{p.prezzo}</div>
                      <div style={{ fontSize: 8, color: T.sub }}>/{p.unitaMisura}</div>
                    </div>
                    {alreadyAdded && (
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#1A9E73", background: "#1A9E7315", padding: "3px 8px", borderRadius: 6 }}>✓</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Close button */}
            <div style={{ position: "sticky", bottom: 0, padding: "12px 16px 28px", background: T.card, borderTop: `1px solid ${T.bdr}` }}>
              <div onClick={() => setShowSearch(false)} style={{
                padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer",
                background: ACC_COLOR, color: "#fff", fontSize: 14, fontWeight: 900
              }}>
                Fatto ({items.length} selezionati · €{totale.toFixed(0)})
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
