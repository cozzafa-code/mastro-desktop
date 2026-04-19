"use client";
// @ts-nocheck
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — SettingsPanel
// Estratto S1: ~2.060 righe (Impostazioni complete)
// ═══════════════════════════════════════════════════════════
import React from "react";
import { useMastro } from "./MastroContext";
import {
  FF, FM, THEMES, PLANS, PIPELINE_DEFAULT,
  TIPOLOGIE_RAPIDE, SETTORI, ICO, Ico, tipoToMinCat,
} from "./mastro-constants";


// ─── ListinoSettore — componente riutilizzabile per ogni tab ─────────────────
function ListinoSettore({ titolo, emoji, storageKey, T, PRI, FF, fornitori, setFornitori }: any) {
  const ctx = (window as any).__mastroCtx;
  const [listino, setListino] = React.useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("mastro_listino_" + storageKey) || "[]"); } catch { return []; }
  });
  const [expanded, setExpanded] = React.useState<string|null>(null);
  const [nlState, setNlState] = React.useState<Record<string,string>>({});
  const [nhState, setNhState] = React.useState<Record<string,string>>({});
  const [npState, setNpState] = React.useState<Record<string,string>>({});

  const save = (next: any[]) => {
    setListino(next);
    try { localStorage.setItem("mastro_listino_" + storageKey, JSON.stringify(next)); } catch {}
  };

  const addProdotto = () => save([...listino, {
    id: Date.now().toString(),
    nome: "Nuovo prodotto",
    fornitore: "",
    materiale: "",
    pesoStecca: "",
    euroMq: 0,
    minimoMq: 0,
    griglia: []
  }]);

  const updateProdotto = (id: string, upd: any) =>
    save(listino.map((p: any) => p.id === id ? { ...p, ...upd } : p));

  const deleteProdotto = (id: string) =>
    save(listino.filter((p: any) => p.id !== id));

  // Export CSV
  const exportCSV = () => {
    let csv = "Nome;Fornitore;Materiale;Peso Stecca (kg/mq);Euro/mq;Minimo mq;Griglia L;Griglia H;Griglia Prezzo\n";
    listino.forEach((p: any) => {
      if (p.griglia && p.griglia.length > 0) {
        p.griglia.forEach((g: any) => {
          csv += `${p.nome};${p.fornitore||""};${p.materiale||""};${p.pesoStecca||""};${p.euroMq||0};${p.minimoMq||0};${g.l};${g.h};${g.prezzo}\n`;
        });
      } else {
        csv += `${p.nome};${p.fornitore||""};${p.materiale||""};${p.pesoStecca||""};${p.euroMq||0};${p.minimoMq||0};;;`+"\n";
      }
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `listino_${storageKey}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Export template vuoto
  const exportTemplate = () => {
    const csv = "Nome;Fornitore;Materiale;Peso Stecca (kg/mq);Euro/mq;Minimo mq;Griglia L;Griglia H;Griglia Prezzo\n" +
      "Tapparella PVC Standard;Fornitore SRL;PVC;1.2;28;0.5;800;1200;22.50\n" +
      "Tapparella PVC Standard;Fornitore SRL;PVC;1.2;28;0.5;1000;1500;35.00\n" +
      "Tapparella Alluminio;Fornitore SRL;Alluminio;1.8;45;0.5;800;1200;36.00\n" +
      "Tapparella Alluminio;Fornitore SRL;Alluminio;1.8;45;0.5;1000;1500;55.00\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `template_listino_${storageKey}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // Import CSV/Excel (universal parser)
  const importFile = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();

    const processRows = (rows: string[][]) => {
      // Salta header
      const dataRows = rows.filter((r, i) => i > 0 && r.length >= 2 && r[0]?.trim());
      const prodMap: Record<string, any> = {};
      dataRows.forEach(r => {
        const nome = r[0]?.trim() || "Prodotto";
        const key = nome + "|" + (r[1]?.trim()||"");
        if (!prodMap[key]) {
          prodMap[key] = {
            id: Date.now().toString() + Math.random(),
            nome,
            fornitore: r[1]?.trim() || "",
            materiale: r[2]?.trim() || "",
            pesoStecca: r[3]?.trim() || "",
            euroMq: parseFloat(r[4]?.replace(",",".") || "0") || 0,
            minimoMq: parseFloat(r[5]?.replace(",",".") || "0") || 0,
            griglia: []
          };
        }
        // Se ha griglia L, H, Prezzo
        if (r[6] && r[7] && r[8]) {
          const l = parseInt(r[6]); const h = parseInt(r[7]); const prezzo = parseFloat(r[8].replace(",","."));
          if (!isNaN(l) && !isNaN(h) && !isNaN(prezzo)) {
            prodMap[key].griglia.push({ l, h, prezzo });
          }
        }
      });
      const prods = Object.values(prodMap);
      prods.forEach((p: any) => p.griglia.sort((a: any, b: any) => a.l - b.l || a.h - b.h));
      save([...listino, ...prods]);
      alert("Importati " + prods.length + " prodotti");
    };

    if (ext === "csv" || ext === "txt") {
      const reader = new FileReader();
      reader.onload = ev => {
        const text = ev.target?.result as string;
        const rows = text.split(/\r?\n/).map(r => r.split(/[;,\t]/));
        processRows(rows);
      };
      reader.readAsText(file, "utf-8");
    } else if (ext === "xlsx" || ext === "xls") {
      // Usa SheetJS se disponibile
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = ev.target?.result;
          // Fallback: tratta come CSV con tab
          const text = new TextDecoder("utf-8").decode(data as ArrayBuffer);
          const rows = text.split(/\r?\n/).map(r => r.split(/[\t;,]/));
          processRows(rows);
        } catch {
          alert("Formato non supportato. Usa CSV (salva il file Excel come CSV con separatore ;)");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Formato supportato: CSV (.csv), Excel (.xlsx), testo (.txt)\nSeparatore colonne: punto e virgola (;)");
    }
    e.target.value = "";
  };

  return (
    <div style={{ marginTop: 20 }}>
      {/* Header sezione */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>{emoji} {titolo}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <div onClick={exportTemplate}
            style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${PRI}`, color: PRI, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Template
          </div>
          {listino.length > 0 && (
            <div onClick={exportCSV}
              style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${PRI}`, color: PRI, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Esporta
            </div>
          )}
          <div onClick={addProdotto}
            style={{ padding: "5px 10px", borderRadius: 7, background: PRI, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
            + Prodotto
          </div>
        </div>
      </div>

      {/* Import file */}
      <div style={{ position: "relative", marginBottom: 12 }}>
        <input type="file" accept=".csv,.xlsx,.xls,.txt"
          style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2 }}
          onChange={importFile} />
        <div style={{ padding: "10px 14px", borderRadius: 8, border: `1px dashed ${PRI}`, background: PRI + "08",
          textAlign: "center", fontSize: 11, color: PRI, cursor: "pointer" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> Importa listino fornitore (CSV, Excel, TXT) — trascina qui o clicca
        </div>
      </div>

      {/* Info formato */}
      <div style={{ fontSize: 9, color: T.sub, marginBottom: 12, lineHeight: 1.6 }}>
        Formato CSV: Nome ; Fornitore ; Materiale ; Peso(kg/m) ; €/mq ; Minimo mq ; L(mm) ; H(mm) ; Prezzo€
        <br />Scarica il Template per vedere il formato corretto. Puoi anche inserire i prodotti manualmente.
      </div>

      {/* Lista prodotti */}
      {listino.length === 0 ? (
        <div style={{ textAlign: "center", color: T.sub, fontSize: 12, padding: "20px 0" }}>
          Nessun prodotto — importa un listino o clicca + Prodotto
        </div>
      ) : (
        listino.map((prod: any) => (
          <div key={prod.id} style={{ border: `1px solid ${T.bdr}`, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
            {/* Header prodotto */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.card, cursor: "pointer" }}
              onClick={() => setExpanded(expanded === prod.id ? null : prod.id)}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{prod.nome}</div>
                {prod.fornitore && <div style={{ fontSize: 9, color: T.sub }}>{prod.fornitore}{prod.materiale ? " · " + prod.materiale : ""}</div>}
              </div>
              <div style={{ fontSize: 10, fontWeight: 800, color: PRI }}>
                {prod.griglia?.length > 0
                  ? `Griglia ${prod.griglia.length} prezzi`
                  : prod.euroMq > 0 ? `€${prod.euroMq}/mq` : "Nessun prezzo"}
              </div>
              <div onClick={e => { e.stopPropagation(); deleteProdotto(prod.id); }}
                style={{ color: "#DC4444", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>×</div>
              <div style={{ fontSize: 10, color: T.sub }}>{expanded === prod.id ? "▲" : "▼"}</div>
            </div>

            {expanded === prod.id && (
              <div style={{ padding: "12px 14px", background: T.bg, borderTop: `1px solid ${T.bdr}` }}>
                {/* Campi prodotto */}
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  {/* Nome prodotto */}
                <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Nome prodotto</div>
                  <input value={prod.nome || ""} placeholder="es. Tapparella PVC Standard"
                    onChange={e => updateProdotto(prod.id, { nome: e.target.value })}
                    style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                      fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                </div>
                {/* Fornitore input */}
                <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Fornitore</div>
                  <input value={prod.fornitore || ""} placeholder="es. Rollplast SRL"
                    onChange={e => updateProdotto(prod.id, { fornitore: e.target.value })}
                    style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                      fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                </div>
                {/* Materiale */}
                <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Materiale</div>
                  <input value={prod.materiale || ""} placeholder="es. PVC / Alluminio"
                    onChange={e => updateProdotto(prod.id, { materiale: e.target.value })}
                    style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                      fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                </div>
                {/* Peso stecca */}
                <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Peso stecca (kg/mq)</div>
                  <input value={prod.pesoStecca || ""} placeholder="es. 1.2"
                    onChange={e => updateProdotto(prod.id, { pesoStecca: e.target.value })}
                    style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                      fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                </div>
                </div>

                {/* Euro/mq e minimo */}
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>€/mq (se no griglia)</div>
                    <input type="number" value={prod.euroMq || ""} placeholder="0"
                      onChange={e => updateProdotto(prod.id, { euroMq: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                        fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right", background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Minimo fatturazione (mq)</div>
                    <input type="number" step="0.1" value={prod.minimoMq || ""} placeholder="0"
                      onChange={e => updateProdotto(prod.id, { minimoMq: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: `1px solid ${T.bdr}`,
                        fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right", background: T.card, color: T.text }} />
                  </div>
                </div>
                {prod.minimoMq > 0 && (
                  <div style={{ fontSize: 9, color: PRI, marginBottom: 8 }}>
                    Minimo {prod.minimoMq} mq — sotto soglia si fattura comunque {prod.minimoMq} mq
                  </div>
                )}

                {/* Griglia L x H */}
                <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 6 }}>
                  Griglia L×H ({prod.griglia?.length || 0} righe)
                  <span style={{ fontSize: 9, color: T.sub, fontWeight: 400, marginLeft: 6 }}>Ha priorita su €/mq</span>
                </div>

                {prod.griglia?.length > 0 && (
                  <div style={{ overflowX: "auto", marginBottom: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
                      <thead>
                        <tr style={{ background: T.card }}>
                          <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 700 }}>L (mm)</th>
                          <th style={{ padding: "4px 8px", textAlign: "left", fontWeight: 700 }}>H (mm)</th>
                          <th style={{ padding: "4px 8px", textAlign: "right", fontWeight: 700 }}>Prezzo €</th>
                          <th style={{ width: 24 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {prod.griglia.map((g: any, gi: number) => (
                          <tr key={gi} style={{ borderBottom: `1px solid ${T.bdr}20` }}>
                            <td style={{ padding: "3px 8px" }}>{g.l}</td>
                            <td style={{ padding: "3px 8px" }}>{g.h}</td>
                            <td style={{ padding: "3px 8px", textAlign: "right", fontWeight: 700, color: PRI }}>€{g.prezzo}</td>
                            <td>
                              <div onClick={() => updateProdotto(prod.id, { griglia: prod.griglia.filter((_: any, i: number) => i !== gi) })}
                                style={{ color: "#DC4444", cursor: "pointer", fontSize: 12, textAlign: "center" }}>×</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Aggiungi riga griglia */}
                <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 8 }}>
                  <input type="number" value={nlState[prod.id]||""} onChange={e => setNlState(s=>({...s,[prod.id]:e.target.value}))}
                    placeholder="L mm" style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: FF, background: T.card, color: T.text }} />
                  <input type="number" value={nhState[prod.id]||""} onChange={e => setNhState(s=>({...s,[prod.id]:e.target.value}))}
                    placeholder="H mm" style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: FF, background: T.card, color: T.text }} />
                  <input type="number" value={npState[prod.id]||""} onChange={e => setNpState(s=>({...s,[prod.id]:e.target.value}))}
                    placeholder="€" style={{ flex: 1, padding: "6px", borderRadius: 6, border: `1px solid ${T.bdr}`, fontSize: 11, fontFamily: FF, background: T.card, color: T.text }} />
                  <div onClick={() => {
                    const nl = nlState[prod.id]; const nh = nhState[prod.id]; const np = npState[prod.id];
                    if (!nl || !nh || !np) return;
                    const ng = [...(prod.griglia||[]), { l: parseInt(nl), h: parseInt(nh), prezzo: parseFloat(np.replace(",",".")) }]
                      .sort((a: any, b: any) => a.l - b.l || a.h - b.h);
                    updateProdotto(prod.id, { griglia: ng });
                    setNlState(s=>({...s,[prod.id]:""})); setNhState(s=>({...s,[prod.id]:""})); setNpState(s=>({...s,[prod.id]:""}));
                  }} style={{ padding: "6px 10px", borderRadius: 6, background: PRI, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>+ Riga</div>
                </div>

                {/* Import CSV griglia singola */}
                <div style={{ position: "relative" }}>
                  <input type="file" accept=".csv,.txt"
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2 }}
                    onChange={e2 => {
                      const file2 = e2.target.files?.[0]; if (!file2) return;
                      const reader2 = new FileReader();
                      reader2.onload = ev2 => {
                        const text2 = ev2.target?.result as string;
                        const rows2 = text2.split(/\r?\n/).map(r => r.split(/[;,\t]/));
                        const ng2 = rows2
                          .filter(r => r.length >= 3 && !isNaN(parseFloat(r[0])))
                          .map(r => ({ l: parseInt(r[0]), h: parseInt(r[1]), prezzo: parseFloat(r[2].replace(",",".")) }))
                          .sort((a, b) => a.l - b.l || a.h - b.h);
                        if (ng2.length > 0) { updateProdotto(prod.id, { griglia: ng2 }); alert("Importate " + ng2.length + " righe griglia"); }
                      };
                      reader2.readAsText(file2);
                      e2.target.value = "";
                    }} />
                  <div style={{ padding: "6px 10px", borderRadius: 6, border: `1px dashed ${PRI}`, background: PRI + "08",
                    textAlign: "center", fontSize: 10, color: PRI, cursor: "pointer" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> Importa CSV griglia (L ; H ; Prezzo)
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────


// --- ListinoSettoreLamiere ---
function ListinoSettoreLamiere({ T, PRI, FF }: any) {
  const [lamiere, setLamiere] = React.useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("mastro_listino_lamiereListino") || "[]"); } catch { return []; }
  });
  const [expanded, setExpanded] = React.useState<string|null>(null);

  const save = (next: any[]) => {
    setLamiere(next);
    try { localStorage.setItem("mastro_listino_lamiereListino", JSON.stringify(next)); } catch {}
  };

  const addLamiera = (tipo: string) => save([...lamiere, {
    id: Date.now().toString(), nome: "Nuova lamiera", tipo,
    fornitore: "", spessore: "", prezzoKg: 0, prezzoMl: 0, pieghe: []
  }]);
  const update = (id: string, upd: any) => save(lamiere.map((lm: any) => lm.id === id ? { ...lm, ...upd } : lm));
  const remove = (id: string) => save(lamiere.filter((lm: any) => lm.id !== id));

  const exportCSV = () => {
    const rows: string[] = ["Tipo;Nome;Fornitore;Spessore;Euro/kg;Euro/ml;Piega;Euro/ml piega"];
    lamiere.forEach((lm: any) => {
      if (lm.pieghe && lm.pieghe.length > 0) {
        lm.pieghe.forEach((pg: any) => {
          rows.push([lm.tipo, lm.nome, lm.fornitore||"", lm.spessore||"", lm.prezzoKg||0, lm.prezzoMl||0, pg.nome, pg.prezzoMl].join(";"));
        });
      } else {
        rows.push([lm.tipo, lm.nome, lm.fornitore||"", lm.spessore||"", lm.prezzoKg||0, lm.prezzoMl||0, "", ""].join(";"));
      }
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "listino_lamiere.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: T.text }}>Listino Lamiere</div>
        <div style={{ display: "flex", gap: 6 }}>
          {lamiere.length > 0 && (
            <div onClick={exportCSV} style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid " + PRI, color: PRI, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Esporta</div>
          )}
          {["Ferro preverniciato", "Alluminio"].map((tipo: string) => (
            <div key={tipo} onClick={() => addLamiera(tipo)} style={{ padding: "5px 10px", borderRadius: 7, background: PRI, color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
              + {tipo === "Ferro preverniciato" ? "Ferro" : "Alluminio"}
            </div>
          ))}
        </div>
      </div>
      {lamiere.length === 0 ? (
        <div style={{ textAlign: "center", color: T.sub, fontSize: 12, padding: "20px 0" }}>Nessuna lamiera aggiunta</div>
      ) : (
        lamiere.map((lam: any) => (
          <div key={lam.id} style={{ border: "1px solid " + T.bdr, borderRadius: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.card, cursor: "pointer" }}
              onClick={() => setExpanded(expanded === lam.id ? null : lam.id)}>
              <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: T.text }}>{lam.tipo} - {lam.nome}</div>
              <div style={{ fontSize: 10, color: PRI, fontWeight: 800 }}>
                {lam.prezzoKg > 0 ? (lam.prezzoKg + " e/kg") : ""}{lam.prezzoMl > 0 ? (" / " + lam.prezzoMl + " e/ml") : ""}
              </div>
              <div onClick={(ev: any) => { ev.stopPropagation(); remove(lam.id); }} style={{ color: "#DC4444", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>x</div>
            </div>
            {expanded === lam.id && (
              <div style={{ padding: "12px 14px", borderTop: "1px solid " + T.bdr }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" as any }}>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Nome</div>
                    <input value={lam.nome} onChange={(ev: any) => update(lam.id, { nome: ev.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Fornitore</div>
                    <input value={lam.fornitore || ""} placeholder="es. Marcegaglia"
                      onChange={(ev: any) => update(lam.id, { fornitore: ev.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Spessore (mm)</div>
                    <input value={lam.spessore || ""} placeholder="es. 0.6"
                      onChange={(ev: any) => update(lam.id, { spessore: ev.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: "1 1 45%", minWidth: 120 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Tipo</div>
                    <select value={lam.tipo} onChange={(ev: any) => update(lam.id, { tipo: ev.target.value })}
                      style={{ width: "100%", padding: "7px 9px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 12, fontFamily: FF, background: T.card, color: T.text }}>
                      <option>Ferro preverniciato</option>
                      <option>Alluminio</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Prezzo euro/kg</div>
                    <input type="number" step="0.01" value={lam.prezzoKg || ""}
                      onChange={(ev: any) => update(lam.id, { prezzoKg: parseFloat(ev.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right" as any, background: T.card, color: T.text }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, color: T.sub, marginBottom: 3 }}>Prezzo euro/ml base</div>
                    <input type="number" step="0.01" value={lam.prezzoMl || ""}
                      onChange={(ev: any) => update(lam.id, { prezzoMl: parseFloat(ev.target.value) || 0 })}
                      style={{ width: "100%", padding: "8px", borderRadius: 7, border: "1px solid " + T.bdr, fontSize: 13, fontWeight: 700, fontFamily: FF, textAlign: "right" as any, background: T.card, color: T.text }} />
                  </div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.text, marginBottom: 8 }}>Pieghe - prezzo aggiuntivo euro/ml</div>
                {(lam.pieghe || []).map((pg: any, pi: number) => (
                  <div key={pi} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                    <input value={pg.nome} placeholder="es. Piega semplice"
                      onChange={(ev: any) => { const pp = [...lam.pieghe]; pp[pi] = { ...pp[pi], nome: ev.target.value }; update(lam.id, { pieghe: pp }); }}
                      style={{ flex: 2, padding: "6px 8px", borderRadius: 6, border: "1px solid " + T.bdr, fontSize: 11, fontFamily: FF, background: T.card, color: T.text }} />
                    <input type="number" step="0.01" value={pg.prezzoMl || ""}
                      onChange={(ev: any) => { const pp = [...lam.pieghe]; pp[pi] = { ...pp[pi], prezzoMl: parseFloat(ev.target.value) || 0 }; update(lam.id, { pieghe: pp }); }}
                      style={{ flex: 1, padding: "6px 8px", borderRadius: 6, border: "1px solid " + T.bdr, fontSize: 11, fontWeight: 700, fontFamily: FF, textAlign: "right" as any, background: T.card, color: T.text }} />
                    <div onClick={() => update(lam.id, { pieghe: lam.pieghe.filter((_: any, ii: number) => ii !== pi) })}
                      style={{ color: "#DC4444", cursor: "pointer", fontSize: 14 }}>x</div>
                  </div>
                ))}
                <div onClick={() => update(lam.id, { pieghe: [...(lam.pieghe || []), { nome: "", prezzoMl: 0 }] })}
                  style={{ padding: "6px 12px", borderRadius: 7, border: "1px dashed " + PRI, textAlign: "center" as any, fontSize: 10, color: PRI, cursor: "pointer", fontWeight: 700 }}>
                  + Aggiungi piega
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
// --- fine ListinoSettoreLamiere ---

export default function SettingsPanel() {
  const ctx = useMastro();
  const {
    // Theme & layout
    T, S, theme, setTheme, isDesktop, fs, PIPELINE,
    // Navigation
    tab, settingsTab, setSettingsTab,
    // Settings modal
    settingsForm, setSettingsForm, settingsModal, setSettingsModal,
    // Azienda
    aziendaInfo, setAziendaInfo,
    // Settori
    settoriAttivi, setSettoriAttivi, tipologieFiltrate,
    // Catalogo
    sistemiDB, setSistemiDB, coloriDB, vetriDB, coprifiliDB, lamiereDB,
    // Pipeline
    pipelineDB, setPipelineDB, pipelinePhaseTab, setPipelinePhaseTab,
    expandedPipelinePhase, setExpandedPipelinePhase,
    // Team & squadre
    team, squadreDB, setSquadreDB,
    // Fornitori
    fornitori, setFornitori, fornitoreEdit, setFornitoreEdit,
    showFornitoreForm, setShowFornitoreForm, showFornitoreDetail, setShowFornitoreDetail,
    // Libreria & kit
    libreriaDB, setLibreriaDB, kitAccessori, setKitAccessori,
    // Controtelai
    ctOffset, setCtOffset, ctProfDB, setCtProfDB,
    ctSezioniDB, setCtSezioniDB, ctCieliniDB, setCtCieliniDB,
    // Tapparelle, persiane, zanzariere, cassonetti
    tipoMisuraDB, setTipoMisuraDB, tipoMisuraTappDB, setTipoMisuraTappDB,
    tipoMisuraZanzDB, setTipoMisuraZanzDB, tipoCassonettoDB, setTipoCassonettoDB,
    posPersianaDB, setPosPersianaDB, telaiPersianaDB, setTelaiPersianaDB,
    // Salita & favoriti & soglia
    mezziSalita, setMezziSalita, favTipologie, setFavTipologie, sogliaDays, setSogliaDays,
    // Fatture
    fattureDB, setFattureDB, fatturePassive,
    // Data
    cantieri, setCantieri, contatti, setContatti, events, setEvents,
    tasks, setTasks, msgs, setMsgs, problemi, setProblemi,
    montaggiDB, setMontaggiDB, ordiniFornDB, setOrdiniFornDB,
    // Import
    importStatus, importLog, importExcelCatalog,
    // Helpers
    addSettingsItem, deleteSettingsItem, countVani,
    // Piano & onboarding
    setSubPlan, setTutoStep, setAiInbox,
    // Business logic
    generaFatturaPDF,
    // Strutture configuratore
    showStrutture, setShowStrutture,
  } = ctx;

  // Ref per upload logo azienda
  const logoInputRef = React.useRef<HTMLInputElement>(null);

  // DS v2.0 — primary from theme (teal for chiaro)
  const PRI = T.acc || "#0D7C6B";
  const PRI08 = T.accLt || "rgba(13,124,107,0.08)";
  const PRI15 = T.accLt || "rgba(13,124,107,0.15)";
  const FF = "Inter, system-ui, sans-serif";

  // Aggiungi settore Strutture se non presente in constants
  const SETTORI_FULL = [
    ...SETTORI,
    ...(!SETTORI.find((s: any) => s.id === "strutture") ? [{ id: "strutture", label: "Strutture", icon: "", desc: "Pergole, verande, pensiline, box, cancelli, ferro" }] : []),
  ];

  // ─── Sidebar nav groups ────────────────────────────────────────────────────
  const AMBER = "#D08008";
  const AMBER_BG = "#FEF3C7";

  const sidebarGroups = [
    {
      label: "Azienda",
      items: [
        { id: "settore",   l: "Settori attivi" },
        { id: "azienda",   l: "Dati azienda" },
        { id: "generali",  l: "Generali" },
        { id: "piano",     l: "Piano & fatturazione" },
        { id: "team",      l: "Team & operatori" },
        { id: "squadre",   l: "Squadre" },
        { id: "fatture",   l: "Fatture" },
      ],
    },
    {
      label: "Catalogo prodotti",
      items: [
        { id: "sistemi",       l: "Sistemi profilo",   show: settoriAttivi.includes("serramenti") },
        { id: "profili_arch",  l: "Archivio profili",  show: settoriAttivi.includes("serramenti") },
        { id: "vetri",         l: "Vetri & pacchetti", show: settoriAttivi.includes("serramenti") },
        { id: "colori",        l: "Colori & RAL",      show: settoriAttivi.includes("serramenti") },
        { id: "coprifili",     l: "Coprifili",         show: settoriAttivi.includes("serramenti") },
        { id: "lamiere",       l: "Lamiere",           show: settoriAttivi.includes("serramenti") },
        { id: "libreria",      l: "Libreria accessori" },
        { id: "kit",           l: "Kit accessori" },
        { id: "marketplace",   l: "Fornitori" },
      ].filter(i => i.show !== false),
    },
    {
      label: "Configurazione",
      items: [
        { id: "controtelaio",  l: "Controtelaio",      show: settoriAttivi.includes("serramenti") },
        { id: "persiana",      l: "Persiane",          show: settoriAttivi.includes("persiane") },
        { id: "tapparella",    l: "Tapparelle",        show: settoriAttivi.includes("tapparelle") },
        { id: "cassonetto",    l: "Cassonetti",        show: settoriAttivi.includes("tapparelle") },
        { id: "zanzariera",    l: "Zanzariere",        show: settoriAttivi.includes("zanzariere") },
        { id: "porte_mat",     l: "Porte",             show: settoriAttivi.includes("porte") },
        { id: "canc_mat",      l: "Cancelli",          show: settoriAttivi.includes("cancelli") },
        { id: "strutture",     l: "Strutture",         show: settoriAttivi.includes("strutture") },
        { id: "tipologie",     l: "Tipologie vano" },
        { id: "salita",        l: "Salita & mezzi" },
        { id: "manodopera",    l: "Manodopera" },
        { id: "pipeline",      l: "Pipeline fasi" },
      ].filter(i => i.show !== false),
    },
    {
      label: "Avanzate",
      items: [
        { id: "importa",   l: "Importa dati" },
        { id: "guida",     l: "Guida & tutorial" },
        { id: "temi",      l: "Tema & aspetto" },
      ],
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", height: isDesktop ? "100vh" : "auto", minHeight: "100vh", overflow: isDesktop ? "hidden" : "auto", background: "#F2F1EC", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <div style={{
        width: isDesktop ? 220 : "100%", flexShrink: 0,
        background: "#fff", borderRight: isDesktop ? "1px solid #E5E3DC" : "none",
        borderBottom: isDesktop ? "none" : "1px solid #E5E3DC",
        overflowY: isDesktop ? "auto" : "hidden",
        display: "flex", flexDirection: "column",
      }}>
        {/* Sidebar header */}
        <div style={{ padding: "16px 16px 8px", borderBottom: "1px solid #E5E3DC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1C" }}>Impostazioni</div>
          <div
            onClick={async () => { try { localStorage.clear(); const { createClient } = await import("@/lib/supabase"); await createClient().auth.signOut(); } catch(e) {} window.location.href = "/login"; }}
            style={{ fontSize: 11, color: "#9CA3AF", cursor: "pointer", padding: "3px 8px", borderRadius: 5, border: "1px solid #E5E3DC" }}
          >Esci</div>
        </div>

        {/* Nav groups */}
        {!isDesktop && (
          <div style={{ padding: "8px 12px" }}>
            <select
              value={settingsTab}
              onChange={e => setSettingsTab(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E3DC", background: "#fff", fontSize: 14, fontWeight: 600, color: "#1A1A1C", fontFamily: "inherit" }}
            >
              {sidebarGroups.flatMap(g => g.items).map(item => (
                <option key={item.id} value={item.id}>{item.l}</option>
              ))}
            </select>
          </div>
        )}
        <div style={{ padding: "8px 0", flex: 1, display: isDesktop ? "block" : "none" }}>
          {sidebarGroups.map(group => (
            <div key={group.label}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 16px 4px" }}>
                {group.label}
              </div>
              {group.items.map(item => {
                const isActive = settingsTab === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSettingsTab(item.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "7px 16px", cursor: "pointer", fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? AMBER : "#4B5563",
                      background: isActive ? AMBER_BG : "transparent",
                      borderRight: isActive ? `3px solid ${AMBER}` : "3px solid transparent",
                      transition: "all 0.12s",
                    }}
                  >
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: isActive ? AMBER : "#D1D5DB", flexShrink: 0 }} />
                    {item.l}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Azienda info bottom */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #E5E3DC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: AMBER, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {(aziendaInfo?.ragione || "W").charAt(0)}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#1A1A1C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {aziendaInfo?.ragione || "La tua azienda"}
              </div>
              <div style={{ fontSize: 10, color: "#9CA3AF" }}>
                {settoriAttivi.length} {settoriAttivi.length === 1 ? "settore" : "settori"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT AREA ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Content header */}
        <div style={{ padding: isDesktop ? "20px 28px 0" : "16px 16px 0", marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1C" }}>
            {sidebarGroups.flatMap(g => g.items).find(i => i.id === settingsTab)?.l || "Impostazioni"}
          </div>
        </div>

      <div style={{ padding: isDesktop ? "0 28px 40px" : "0 16px 40px" }}>

        {/* === AZIENDA === */}
        {/* === SETTORE === */}
        {settingsTab === "settore" && (
          <>
            <div style={{ fontSize: 12, color: T.sub, padding: "0 4px 10px", lineHeight: 1.5 }}>Seleziona i settori in cui operi. MASTRO mostrerà solo le tipologie e funzioni rilevanti per il tuo lavoro.</div>
            {SETTORI_FULL.map(s => {
              const isOn = settoriAttivi.includes(s.id);
              const count = TIPOLOGIE_RAPIDE.filter(t => t.settore === s.id).length;
              return (
                <div key={s.id} style={{ marginBottom: 8 }}>
                  <div onClick={() => {
                    setSettoriAttivi(prev => isOn ? prev.filter(x => x !== s.id) : [...prev, s.id]);
                  }} style={{
                    padding: "14px 16px", borderRadius: isOn && s.id === "strutture" ? "14px 14px 0 0" : 14, cursor: "pointer",
                    border: `2px solid ${isOn ? (T.pri || "#0D7C6B") : T.bdr}`,
                    borderBottom: isOn && s.id === "strutture" ? "none" : undefined,
                    background: isOn ? (T.pri || "#0D7C6B") + "08" : T.card,
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ fontSize: 28, width: 36, textAlign: "center" }}>{s.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isOn ? (T.pri || "#0D7C6B") : T.text }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{s.desc}</div>
                      <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>{count} tipologie disponibili</div>
                    </div>
                    <div style={{
                      width: 48, height: 28, borderRadius: 14, padding: 2,
                      background: isOn ? (T.pri || "#0D7C6B") : T.bdr,
                      display: "flex", alignItems: "center", transition: "all .2s",
                    }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 12, background: "#fff",
                        transform: isOn ? "translateX(20px)" : "translateX(0px)",
                        transition: "all .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }} />
                    </div>
                  </div>
                  {/* Strutture: expanded configuratore card */}
                  {isOn && s.id === "strutture" && (
                    <div onClick={(e) => { e.stopPropagation(); setShowStrutture(true); }} style={{
                      padding: 16, cursor: "pointer",
                      border: `2px solid ${T.pri || "#0D7C6B"}`, borderTop: "none",
                      borderRadius: "0 0 14px 14px",
                      background: T.card, textAlign: "center",
                    }}>
                      <div style={{ fontSize: 28, marginBottom: 6 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4"/></svg>️</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>Configuratore Strutture</div>
                      <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}>Pianta → Lati → 3D per Pergole, Verande, Box Doccia, Ferro</div>
                      <div style={{
                        marginTop: 10, padding: "8px 20px", borderRadius: 8,
                        background: T.pri || "#0D7C6B", color: "#fff",
                        fontSize: 12, fontWeight: 700, display: "inline-block",
                      }}>
                        Apri Configuratore →
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div style={{ marginTop: 12, padding: 12, background: T.bg, borderRadius: 10, border: `1px solid ${T.bdr}`, fontSize: 11, color: T.sub, lineHeight: 1.5 }}>
              <b>Settori attivi:</b> {settoriAttivi.length} · <b>Tipologie disponibili:</b> {tipologieFiltrate.length}<br />
              Le commesse esistenti con tipologie di settori disattivati resteranno visibili.
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* ARCHIVIO PROFILI DXF                                   */}
        {/* ═══════════════════════════════════════════════════════ */}
        {settingsTab === "profili_arch" && (
          <div>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { n: sistemiDB?.length || 0, l: "Sistemi totali", c: "#D08008" },
                { n: 3, l: "Fornitori", c: "#D08008" },
                { n: sistemiDB?.filter((s: any) => s.attivo !== false).length || 0, l: "Attivi", c: "#1A9E73" },
                { n: sistemiDB?.filter((s: any) => !s.grMl).length || 0, l: "Senza gr/ml", c: "#DC4444" },
              ].map((s, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #E5E3DC", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: s.c }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Upload DXF */}
            <div style={{ background: "#fff", border: "1px solid #E5E3DC", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E3DC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1C" }}>Importa profilo da DXF</div>
                <div style={{ fontSize: 11, color: "#9CA3AF" }}>Parser automatico layer 15 · Kömmerling / aluplast</div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ position: "relative" }}>
                  <input type="file" accept=".dxf"
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 2 }}
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = ev => {
                        const text = ev.target?.result as string;
                        // Parser DXF — estrae da layer 15 MTEXT e testi numerici
                        const lines = text.split(/\r?\n/);
                        let codice = ""; let bautiefe = 0; let camere = 0;
                        const ferramenta: string[] = [];
                        const quote: number[] = [];
                        // Cerca codice profilo (pattern 040x / 140x / 120x / ecc.)
                        const codiceMatch = text.match(/\b(0[14][04]x\d{2}|1[0-9]{2}x\d{2})\b/i);
                        if (codiceMatch) codice = codiceMatch[1];
                        // Cerca MTEXT nel layer 15 — \A1;NN = quota costruttiva
                        const mtextPattern = /\\A1;(\d+)/g;
                        let m;
                        while ((m = mtextPattern.exec(text)) !== null) {
                          const v = parseInt(m[1]);
                          if (v >= 40 && v <= 200) quote.push(v);
                        }
                        // Bautiefe = quota principale (55,65,70,80,85,95,100,120mm)
                        const bautiefen = [55,65,70,80,85,95,100,120];
                        bautiefe = quote.find(q => bautiefen.includes(q)) || quote[0] || 0;
                        // Cerca codici ferramenta (6 cifre nel testo)
                        const fermPattern = /\b([2-9]\d{5})\b/g;
                        let fm;
                        const fermSet = new Set<string>();
                        while ((fm = fermPattern.exec(text)) !== null) fermSet.add(fm[1]);
                        fermSet.forEach(f => ferramenta.push(f));
                        // Determina tipo da codice
                        const tipo = codice.startsWith("14") || codice.startsWith("04") ?
                          (codice.match(/x[2-3]/) ? "Flügel" :
                           codice.match(/x[4-5]/) ? "Pfosten" :
                           codice.match(/x[6-9]/) ? "Stulp" : "Rahmen") : "Rahmen";
                        // Salva in sistemiDB
                        const newProfilo = {
                          id: Date.now().toString(),
                          codice: codice || file.name.replace(".dxf",""),
                          nome: `${tipo} ${bautiefe}mm`,
                          fornitore: text.includes("OHNE_DICHTUNGEN") || text.includes("aluplast") ? "Kömmerling / aluplast" : "Generico",
                          tipo, bautiefe, camere,
                          quote, ferramenta,
                          attivo: true, grMl: "",
                        };
                        setSistemiDB((prev: any[]) => [...(prev||[]), newProfilo]);
                        alert(`Profilo importato: ${newProfilo.codice} — ${newProfilo.tipo} ${newProfilo.bautiefe}mm\nFerramenta trovata: ${ferramenta.slice(0,5).join(", ")}${ferramenta.length > 5 ? "..." : ""}`);
                      };
                      reader.readAsText(file);
                      e.target.value = "";
                    }}
                  />
                  <div style={{ border: "1.5px dashed #D08008", borderRadius: 8, padding: "18px", textAlign: "center", background: "#FFFBF5", cursor: "pointer" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#92400E", marginBottom: 4 }}>Trascina un file .dxf o clicca per selezionare</div>
                    <div style={{ fontSize: 10, color: "#9CA3AF" }}>Il parser estrae automaticamente: codice, bautiefe, tipo, quote layer 15, codici ferramenta</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabella profili */}
            <div style={{ background: "#fff", border: "1px solid #E5E3DC", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #E5E3DC", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1C" }}>Profili nel sistema</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <select style={{ padding: "5px 10px", border: "1px solid #E5E3DC", borderRadius: 6, fontSize: 12, background: "#F9F8F5", color: "#1A1A1C" }}>
                    <option>Tutti i tipi</option>
                    <option>Rahmen</option>
                    <option>Flügel</option>
                    <option>Pfosten</option>
                    <option>Stulp</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: "0 16px" }}>
                {/* Header tabella */}
                <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 80px 80px 70px 110px", gap: 8, padding: "8px 0", borderBottom: "1px solid #E5E3DC", fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <span>Codice</span><span>Nome / Fornitore</span><span>Tipo</span><span>Bautiefe</span><span>Gr/ml</span><span>Azioni</span>
                </div>
                {/* Profili da sistemiDB */}
                {(sistemiDB || []).length === 0 ? (
                  <div style={{ padding: "20px 0", textAlign: "center", fontSize: 12, color: "#9CA3AF" }}>
                    Nessun profilo — importa un DXF o aggiungilo manualmente
                  </div>
                ) : (
                  (sistemiDB || []).map((p: any) => {
                    const tipoColors: Record<string,string[]> = {
                      "Rahmen": ["#DBEAFE","#1E40AF"],
                      "Flügel": ["#D1FAE5","#065F46"],
                      "Pfosten": ["#FEF3C7","#92400E"],
                      "Stulp":  ["#FCE7F3","#9D174D"],
                    };
                    const [bg, fg] = tipoColors[p.tipo] || ["#F2F1EC","#6B7280"];
                    return (
                      <div key={p.id} style={{ display: "grid", gridTemplateColumns: "90px 1fr 80px 80px 70px 110px", gap: 8, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F2F1EC", fontSize: 13 }}>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, fontWeight: 700, color: "#1A1A1C" }}>{p.codice || p.id}</span>
                        <div>
                          <div style={{ fontSize: 13, color: "#1A1A1C" }}>{p.nome || `${p.tipo} ${p.bautiefe}mm`}</div>
                          <div style={{ fontSize: 11, color: "#9CA3AF" }}>{p.fornitore || "—"}</div>
                        </div>
                        <span>
                          <span style={{ display: "inline-flex", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: bg, color: fg }}>
                            {p.tipo || "—"}
                          </span>
                        </span>
                        <span style={{ fontSize: 13, color: "#1A1A1C" }}>{p.bautiefe ? `${p.bautiefe} mm` : "—"}</span>
                        <span>
                          <input
                            value={p.grMl || ""}
                            placeholder="kg/ml"
                            onChange={e => setSistemiDB((prev: any[]) => prev.map((x: any) => x.id === p.id ? {...x, grMl: e.target.value} : x))}
                            style={{ width: "100%", padding: "4px 8px", border: "1px solid #E5E3DC", borderRadius: 5, fontSize: 12, background: "#F9F8F5", color: "#1A1A1C" }}
                          />
                        </span>
                        <div style={{ display: "flex", gap: 4 }}>
                          <div
                            onClick={() => setSistemiDB((prev: any[]) => prev.filter((x: any) => x.id !== p.id))}
                            style={{ padding: "4px 10px", border: "1px solid #FCA5A5", background: "#FEF2F2", borderRadius: 5, fontSize: 11, cursor: "pointer", color: "#DC4444" }}
                          >Rimuovi</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {settingsTab === "azienda" && (
          <div style={{background:"#fff",borderRadius:12,overflow:"hidden",border:`1px solid ${T.bdr}`}}>
            <div style={{padding:"12px 14px",background:PRI,color:"#fff"}}>
              <div style={{fontSize:13,fontWeight:800}}>Dati Azienda</div>
              <div style={{fontSize:10,opacity:0.8,marginTop:2}}>Questi dati appaiono sul PDF del preventivo</div>
            </div>
            {/* LOGO */}
            <div style={{padding:"14px",borderBottom:`1px solid ${T.bdr}`}}>
              <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.04em"}}>Logo Azienda</div>
              <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{display:"none"}} onChange={e=>{
                const f=e.target.files?.[0]; if(!f) return;
                const r=new FileReader(); r.onload=ev=>setAziendaInfo(a=>({...a,logo:ev.target.result}));
                r.readAsDataURL(f); e.target.value="";
              }}/>
              {aziendaInfo.logo ? (
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:80,height:60,border:`1px solid ${T.bdr}`,borderRadius:8,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",background:"#f9f9f9"}}>
                    <img src={aziendaInfo.logo} style={{maxWidth:"100%",maxHeight:"100%",objectFit:"contain"}} alt="logo"/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.text,marginBottom:4}}>Logo caricato <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polyline points="20 6 9 17 4 12"/></svg></div>
                    <div style={{display:"flex",gap:6}}>
                      <div onClick={()=>logoInputRef.current?.click()} style={{fontSize:11,color:PRI,fontWeight:700,cursor:"pointer"}}>Cambia</div>
                      <span style={{color:T.bdr}}>·</span>
                      <div onClick={()=>setAziendaInfo(a=>({...a,logo:null}))} style={{fontSize:11,color:"#DC4444",fontWeight:700,cursor:"pointer"}}>Rimuovi</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div onClick={()=>logoInputRef.current?.click()} style={{border:`2px dashed ${T.bdr}`,borderRadius:10,padding:"16px",textAlign:"center",cursor:"pointer",background:"#fafafa"}}>
                  <div style={{fontSize:24,marginBottom:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                  <div style={{fontSize:12,fontWeight:700,color:T.text}}>Carica logo</div>
                  <div style={{fontSize:10,color:T.sub,marginTop:2}}>PNG, JPG, SVG · max 2MB</div>
                </div>
              )}
            </div>
            {[
              {label:"Ragione Sociale",field:"ragione",placeholder:"Es. Walter Cozza Serramenti SRL"},
              {label:"Partita IVA",field:"piva",placeholder:"Es. 01234567890"},
              {label:"Indirizzo",field:"indirizzo",placeholder:"Es. Via Roma 1, 87100 Cosenza (CS)"},
              {label:"Telefono",field:"telefono",placeholder:"Es. +39 0984 000000"},
              {label:"Email",field:"email",placeholder:"Es. info@azienda.it"},
              {label:"Sito web",field:"website",placeholder:"Es. www.azienda.it"},
              {label:"IBAN",field:"iban",placeholder:"Es. IT60 X054 2811 1010 0000 0123 456"},
              {label:"CCIAA / REA",field:"cciaa",placeholder:"Es. CS-123456"},
              {label:"PEC",field:"pec",placeholder:"Es. azienda@pec.it"},
            ].map(({label,field,placeholder})=>(
              <div key={field} style={{padding:"10px 14px",borderBottom:`1px solid ${T.bdr}`}}>
                <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</div>
                <input
                  value={aziendaInfo[field]||""}
                  onChange={e=>setAziendaInfo(a=>({...a,[field]:e.target.value}))}
                  placeholder={placeholder}
                  style={{width:"100%",border:"none",fontSize:13,fontWeight:600,color:T.text,background:"transparent",fontFamily:FF,outline:"none",padding:0,boxSizing:"border-box"}}
                />
              </div>
            ))}

            {/* CONDIZIONI PREVENTIVO */}
            <div style={{padding:"14px",borderTop:`2px solid ${PRI}`,marginTop:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:16}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></span>
                <div>
                  <div style={{fontSize:13,fontWeight:800,color:T.text}}>Condizioni Preventivo</div>
                  <div style={{fontSize:10,color:T.sub}}>Testi personalizzati stampati nel PDF. Lascia vuoto per usare i testi predefiniti.</div>
                </div>
              </div>
              {[
                {label:"Condizioni di fornitura",field:"condFornitura",placeholder:"Es. L'azienda, nell'esecuzione della produzione è garante dell'osservanza scrupolosa della regola d'arte e delle norme vigenti.",rows:3},
                {label:"Condizioni di pagamento",field:"condPagamento",placeholder:"Es. 50% acconto alla firma del contratto...\n50% a saldo, a comunicazione merce pronta...",rows:4},
                {label:"Tempi di consegna",field:"condConsegna",placeholder:"Es. PVC Battente Standard 30 gg.\nPVC Porte 35 gg.\nAlluminio 45/50 gg lavorativi.",rows:5},
                {label:"Condizioni di contratto",field:"condContratto",placeholder:"Es. Clausole contrattuali personalizzate, garanzia, trattamento dati...",rows:5},
                {label:"Dettagli tecnici / Chiusura",field:"condDettagli",placeholder:"Es. Documenti alla consegna: Dichiarazione di Prestazione, Dichiarazione energetica, Etichetta CE, Manuale d'uso e manutenzione.",rows:3},
              ].map(({label,field,placeholder,rows})=>(
                <div key={field} style={{marginBottom:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</div>
                  <textarea
                    value={aziendaInfo[field]||""}
                    onChange={e=>setAziendaInfo(a=>({...a,[field]:e.target.value}))}
                    placeholder={placeholder}
                    rows={rows}
                    style={{width:"100%",border:`1px solid ${T.bdr}`,borderRadius:8,fontSize:11,color:T.text,background:T.card,fontFamily:FF,padding:"8px 10px",boxSizing:"border-box",resize:"vertical",lineHeight:1.5}}
                  />
                </div>
              ))}
            </div>
            <div style={{padding:"12px 14px",background:"#f0fdf4",display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:14}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>
              <span style={{fontSize:11,color:"#1a9e40",fontWeight:600}}>Salvato automaticamente in ogni preventivo PDF</span>
            </div>
          </div>
        )}

        {/* === GENERALI === */}
        {settingsTab === "generali" && (
          <>
            <div style={{...S.card,marginBottom:8}}><div style={S.cardInner}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Soglia commesse ferme</div>
                  <div style={{fontSize:11,color:T.sub}}>Alert se una commessa non avanza da N giorni</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <input type="number" min="1" max="30" value={sogliaDays} onChange={e=>setSogliaDays(parseInt(e.target.value)||5)}
                    style={{width:50,padding:"5px 8px",borderRadius:8,border:`1px solid ${T.bdr}`,fontSize:14,fontWeight:700,textAlign:"center",fontFamily:FF}}/>
                  <span style={{fontSize:11,color:T.sub}}>giorni</span>
                </div>
              </div>
            </div></div>
            <div style={S.card}><div style={S.cardInner}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {aziendaInfo.logo
                  ? <img src={aziendaInfo.logo} style={{width:48,height:48,borderRadius:"50%",objectFit:"cover",border:`1px solid ${T.bdr}`}} alt="logo"/>
                  : <div style={{ width: 48, height: 48, borderRadius: "50%", background: PRI, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 700 }}>FC</div>
                }
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>Fabio Cozza</div>
                  <div style={{ fontSize: 12, color: T.sub }}>{aziendaInfo.ragione}</div>
                </div>
              </div>
            </div></div>
            <div style={{ ...S.card, marginTop: 8 }}><div style={S.cardInner}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>TEMA</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[["chiaro", ""], ["scuro", ""], ["oceano", ""]].map(([id, ico]) => (
                  <div key={id} onClick={() => setTheme(id)} style={{ flex: 1, padding: "10px 4px", borderRadius: 8, border: `1.5px solid ${theme === id ? PRI : T.bdr}`, textAlign: "center", cursor: "pointer" }}>
                    <div style={{ fontSize: 18 }}>{ico}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: "capitalize", marginTop: 2 }}>{id}</div>
                  </div>
                ))}
              </div>
            </div></div>
            <div style={{ ...S.card, marginTop: 8 }}><div style={S.cardInner}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}>STATISTICHE</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontSize: 12 }}>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: PRI }}>{cantieri.length}</div>Commesse</div>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: T.blue }}>{countVani()}</div>Vani</div>
                <div><div style={{ fontSize: 20, fontWeight: 700, color: T.grn }}>{tasks.filter(t => t.done).length}/{tasks.length}</div>Task</div>
              </div>
            </div></div>
          </>
        )}

        {/* === PIANO === */}
        {settingsTab === "piano" && (
          <>
            {/* Current plan banner */}
            <div style={{ ...S.card, marginBottom: 12 }}>
              <div style={{ padding: 16, background: `linear-gradient(135deg, ${PRI}15, ${PRI}05)`, borderRadius: T.r }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: PRI, textTransform: "uppercase" as const, letterSpacing: 1 }}>Piano attuale</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: T.text, marginTop: 2 }}>
                      {plan.nome} {activePlan === "trial" && <span suppressHydrationWarning style={{ fontSize: 12, fontWeight: 600, color: trialDaysLeft <= 3 ? T.red : PRI }}>({trialDaysLeft}gg rimasti)</span>}
                    </div>
                  </div>
                  {plan.prezzo > 0 && <div style={{ textAlign: "right" as const }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: PRI, fontFamily: FM }}>€{plan.prezzo}</div>
                    <div style={{ fontSize: 10, color: T.sub }}>/mese</div>
                  </div>}
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: 10, color: T.sub }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> {cantieri.length}/{plan.maxCommesse === 9999 ? "∞" : plan.maxCommesse} commesse</span>
                  <span style={{ fontSize: 10, color: T.sub }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> {plan.maxUtenti} utent{plan.maxUtenti > 1 ? "i" : "e"}</span>
                  <span style={{ fontSize: 10, color: T.sub }}>{plan.sync ? "" : ""} Sync</span>
                  <span style={{ fontSize: 10, color: T.sub }}>{plan.pdf ? "" : ""} PDF</span>
                </div>
              </div>
            </div>

            {/* Plan comparison */}
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, padding: "0 16px", marginBottom: 8 }}>Confronta piani</div>
            {(Object.entries(PLANS) as [string, any][]).filter(([k]) => k !== "trial" && k !== "free").map(([key, pl]) => (
              <div key={key} onClick={() => { if (key !== activePlan) setSubPlan(key); }}
                style={{ ...S.card, marginBottom: 8, border: key === activePlan ? `2px solid ${PRI}` : `1px solid ${T.bdr}`, cursor: "pointer", position: "relative" as const, overflow: "hidden" }}>
                {key === "pro" && <div style={{ position: "absolute" as const, top: 0, right: 0, background: PRI, color: "#fff", fontSize: 8, fontWeight: 800, padding: "3px 10px", borderBottomLeftRadius: 8, textTransform: "uppercase" as const, letterSpacing: 1 }}>Consigliato</div>}
                <div style={{ padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: key === "pro" ? PRI : T.text }}>{pl.nome}</div>
                    </div>
                    <div style={{ textAlign: "right" as const }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: key === "pro" ? PRI : T.text, fontFamily: FM }}>€{pl.prezzo}</span>
                      <span style={{ fontSize: 11, color: T.sub }}>/mese</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px" }}>
                    <div style={{ fontSize: 11, color: T.text }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> {pl.maxCommesse === 9999 ? "Illimitate" : pl.maxCommesse} commesse</div>
                    <div style={{ fontSize: 11, color: T.text }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> {pl.maxUtenti} utent{pl.maxUtenti > 1 ? "i" : "e"}</div>
                    <div style={{ fontSize: 11, color: pl.sync ? T.grn : T.sub }}>{pl.sync ? "" : ""} Sync real-time</div>
                    <div style={{ fontSize: 11, color: pl.pdf ? T.grn : T.sub }}>{pl.pdf ? "" : ""} PDF rilievo</div>
                    <div style={{ fontSize: 11, color: pl.admin ? T.grn : T.sub }}>{pl.admin ? "" : ""} Pannello admin</div>
                    <div style={{ fontSize: 11, color: pl.api ? T.grn : T.sub }}>{pl.api ? "" : ""} API</div>
                    <div style={{ fontSize: 11, color: T.text }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> {pl.maxCataloghi === 99 ? "Illimitati" : pl.maxCataloghi} catalog{pl.maxCataloghi > 1 ? "hi" : "o"}</div>
                  </div>
                  {key === activePlan ? (
                    <div style={{ marginTop: 10, padding: "8px 0", textAlign: "center" as const, borderRadius: 8, background: PRI + "15", fontSize: 12, fontWeight: 700, color: PRI }}>Piano attivo</div>
                  ) : (
                    <div style={{ marginTop: 10, padding: "8px 0", textAlign: "center" as const, borderRadius: 8, background: PRI, fontSize: 12, fontWeight: 700, color: "#fff" }}>
                      {pl.prezzo > (plan.prezzo || 0) ? `Passa a ${pl.nome} — €${pl.prezzo}/mese` : `Passa a ${pl.nome}`}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Free plan note */}
            <div style={{ padding: "8px 16px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: T.sub, textAlign: "center" as const }}>
                Il piano Free include 5 commesse e funzionalità base. I pagamenti saranno attivati al lancio ufficiale.
              </div>
            </div>
          </>
        )}

        {/* === TEAM === */}
        {settingsTab === "team" && (
          <>
            {team.map(m => (
              <div key={m.id} style={{ ...S.card, marginBottom: 8 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: m.colore, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{m.nome.split(" ").map(n => n[0]).join("")}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{m.nome}</div>
                  <div style={{ fontSize: 11, color: T.sub }}>{m.ruolo} — {m.compiti}</div>
                </div>
                <Ico d={ICO.pen} s={14} c={T.sub} />
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("membro"); setSettingsForm({ nome: "", ruolo: "Posatore", compiti: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${T.bdr}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600 }}>+ Aggiungi membro</div>
          </>
        )}

        {/* === SISTEMI E SOTTOSISTEMI === */}
        {settingsTab === "sistemi" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Configura marche, sistemi e sottosistemi con colori collegati</div>
            {sistemiDB.map(s => (
              <div key={s.id} style={{ ...S.card, marginBottom: 8 }}><div style={S.cardInner}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: PRI }}>{s.marca}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{s.sistema}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end", marginBottom: 3 }}>
                      <span style={{ fontSize: 9, color: T.sub }}>€/mq</span>
                      <input type="number" defaultValue={s.euroMq || ""} onBlur={e => setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, euroMq: parseFloat(e.target.value)||0, prezzoMq: parseFloat(e.target.value)||0 } : x))} style={{ width: 60, padding: "3px 6px", borderRadius: 4, border: `1px solid ${T.bdr}`, fontSize: 13, fontWeight: 700, color: T.grn, textAlign: "right", fontFamily: FM }} />
                    </div>
                    <div style={{ fontSize: 9, color: T.sub }}>+{s.sovRAL}% RAL · +{s.sovLegno}% Legno</div>
                    {s.griglia?.length > 0 && <div style={{ fontSize: 9, color: PRI, fontWeight: 600, marginTop: 2 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg> Griglia {s.griglia.length} prezzi</div>}
                  </div>
                </div>
                {/* Profile image upload */}
                <div style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: T.bg, border: `1px dashed ${T.bdr}` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 4 }}>Sezione profilo (per preventivo PDF)</div>
                  {s.immagineProfilo ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <img src={s.immagineProfilo} style={{ height: 48, maxWidth: 120, objectFit: "contain", borderRadius: 4, background: "#fff", border: `1px solid ${T.bdr}` }} alt="profilo" />
                      <div onClick={() => setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, immagineProfilo: undefined } : x))} style={{ fontSize: 10, color: T.red, cursor: "pointer", fontWeight: 600 }}>Rimuovi</div>
                    </div>
                  ) : (
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, background: PRI + "15", color: PRI, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg> Carica PNG
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => { setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, immagineProfilo: ev.target?.result as string } : x)); };
                        reader.readAsDataURL(file);
                      }} />
                    </label>
                  )}
                </div>
                {/* Griglia prezzi */}
                <div style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: T.bg, border: `1px dashed ${T.bdr}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>Griglia prezzi L×H {s.griglia?.length > 0 ? `(${s.griglia.length} prezzi)` : ""}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      <label style={{ padding: "3px 8px", borderRadius: 4, background: PRI + "15", color: PRI, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> CSV / TXT
                        <input type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={e => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => {
                            const text = ev.target?.result as string;
                            const lines = text.split(/\r?\n/).filter(l => l.trim());
                            const newGrid: any[] = [];
                            // Skip header line if it contains letters
                            const start = /[a-zA-Z]/.test(lines[0] || "") ? 1 : 0;
                            for (let i = start; i < lines.length; i++) {
                              const line = lines[i];
                              // Split by ; , or tab
                              const parts = line.split(/[;\t,]/).map(p => p.trim());
                              if (parts.length >= 3) {
                                // Handle Italian format: "1.200" or "1200" for mm, "350,50" or "350.50" for price
                                const parseMM = (v: string) => parseInt(v.replace(/\./g, "").replace(",", "."));
                                const parsePrice = (v: string) => {
                                  // If has both . and , : "1.350,50" → remove dots, comma→dot
                                  if (v.includes(".") && v.includes(",")) return parseFloat(v.replace(/\./g, "").replace(",", "."));
                                  // If only comma: "350,50" → comma→dot
                                  if (v.includes(",")) return parseFloat(v.replace(",", "."));
                                  return parseFloat(v);
                                };
                                const l = parseMM(parts[0]); const h = parseMM(parts[1]); const p = parsePrice(parts[2]);
                                if (l > 0 && h > 0 && p > 0) newGrid.push({ l, h, prezzo: Math.round(p * 100) / 100 });
                              }
                            }
                            if (newGrid.length > 0) {
                              newGrid.sort((a,b) => a.l - b.l || a.h - b.h);
                              setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, griglia: newGrid } : x));
                              alert(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ${newGrid.length} prezzi importati!`);
                            } else {
                              alert(" Nessun prezzo trovato.\n\nFormato accettato:\nLarghezza;Altezza;Prezzo\n1000;1200;350\n1200;1400;420,50");
                            }
                          };
                          reader.readAsText(file);
                        }} />
                      </label>
                      <div onClick={() => {
                        const txt = prompt("Incolla da Excel (L;H;Prezzo, una riga per combinazione):\n\nEsempio:\n1000;1200;350\n1200;1400;420");
                        if (!txt) return;
                        const lines = txt.split(/\r?\n/).filter(l => l.trim());
                        const newGrid: any[] = [...(s.griglia || [])];
                        let added = 0;
                        lines.forEach(line => {
                          const parts = line.split(/[;\t,]/).map(p => p.trim());
                          if (parts.length >= 3) {
                            const l = parseInt(parts[0].replace(/\./g,"")); 
                            const h = parseInt(parts[1].replace(/\./g,""));
                            let pv = parts[2]; if (pv.includes(".") && pv.includes(",")) pv = pv.replace(/\./g,""); pv = pv.replace(",",".");
                            const p = parseFloat(pv);
                            if (l > 0 && h > 0 && p > 0) { newGrid.push({ l, h, prezzo: Math.round(p*100)/100 }); added++; }
                          }
                        });
                        if (added > 0) {
                          newGrid.sort((a,b) => a.l - b.l || a.h - b.h);
                          setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, griglia: newGrid } : x));
                          alert(`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ${added} prezzi aggiunti!`);
                        }
                      }} style={{ padding: "3px 8px", borderRadius: 4, background: "#8B5CF615", color: "#8B5CF6", fontSize: 9, fontWeight: 600, cursor: "pointer" }}>Incolla</div>
                      <div onClick={() => {
                        const l = prompt("Larghezza (mm):", "1000");
                        const h = prompt("Altezza (mm):", "1200");
                        const p = prompt("Prezzo €:", "300");
                        if (l && h && p && parseInt(l) > 0 && parseInt(h) > 0 && parseFloat(p.replace(",",".")) > 0) {
                          setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, griglia: [...(x.griglia||[]), { l: parseInt(l), h: parseInt(h), prezzo: parseFloat(p.replace(",",".")) }].sort((a,b) => a.l - b.l || a.h - b.h) } : x));
                        }
                      }} style={{ padding: "3px 8px", borderRadius: 4, background: T.grn + "15", color: T.grn, fontSize: 9, fontWeight: 600, cursor: "pointer" }}>+ Aggiungi</div>
                      {s.griglia?.length > 0 && <div onClick={() => {
                        const csv = "Larghezza;Altezza;Prezzo\n" + s.griglia.map(g => `${g.l};${g.h};${g.prezzo}`).join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a"); a.href = url; a.download = `listino_${s.nome.replace(/\s/g,"_")}.csv`; a.click();
                      }} style={{ padding: "3px 8px", borderRadius: 4, background: "#E8A02015", color: "#E8A020", fontSize: 9, fontWeight: 600, cursor: "pointer" }}>Esporta</div>}
                    </div>
                  </div>
                  {s.griglia?.length > 0 ? (() => {
                    // Build matrix view: unique L values as columns, H as rows
                    const uniqueL = [...new Set(s.griglia.map(g => g.l))].sort((a,b) => a - b);
                    const uniqueH = [...new Set(s.griglia.map(g => g.h))].sort((a,b) => a - b);
                    const showMatrix = uniqueL.length > 1 && uniqueH.length > 1 && uniqueL.length <= 12;
                    return (
                    <div>
                      <div style={{ fontSize: 9, color: T.sub, marginBottom: 3, fontStyle: "italic" }}>
                        Il prezzo viene preso dalla combinazione L×H più vicina (per eccesso). {s.griglia.length} combinazioni · {uniqueL.length}L × {uniqueH.length}H
                      </div>
                      {showMatrix ? (
                        <div style={{ overflowX: "auto", borderRadius: 4, border: `1px solid ${T.bdr}` }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                            <thead><tr style={{ background: T.bg }}>
                              <th style={{ padding: "3px 4px", fontWeight: 700, color: T.sub, position: "sticky", left: 0, background: T.bg, borderRight: `1px solid ${T.bdr}`, fontSize: 8 }}>L→<br/>H↓</th>
                              {uniqueL.map(l => <th key={l} style={{ padding: "3px 4px", fontWeight: 700, color: PRI, textAlign: "center", fontSize: 8, minWidth: 40 }}>{l}</th>)}
                            </tr></thead>
                            <tbody>{uniqueH.map(h => (
                              <tr key={h} style={{ borderTop: `1px solid ${T.bdr}15` }}>
                                <td style={{ padding: "2px 4px", fontWeight: 700, color: PRI, position: "sticky", left: 0, background: T.card, borderRight: `1px solid ${T.bdr}`, fontSize: 8 }}>{h}</td>
                                {uniqueL.map(l => {
                                  const g = s.griglia.find(x => x.l === l && x.h === h);
                                  return <td key={l} style={{ padding: "2px 4px", textAlign: "center", fontWeight: g ? 700 : 400, color: g ? T.grn : T.bdr, fontSize: 8 }}>
                                    {g ? `€${g.prezzo}` : "—"}
                                  </td>;
                                })}
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ maxHeight: 150, overflowY: "auto", borderRadius: 4, border: `1px solid ${T.bdr}` }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
                            <thead><tr style={{ background: T.bg, position: "sticky", top: 0 }}>
                              <th style={{ padding: "3px 6px", textAlign: "left", fontWeight: 700, color: T.sub }}>L (mm)</th>
                              <th style={{ padding: "3px 6px", textAlign: "left", fontWeight: 700, color: T.sub }}>H (mm)</th>
                              <th style={{ padding: "3px 6px", textAlign: "right", fontWeight: 700, color: T.sub }}>Prezzo €</th>
                              <th style={{ width: 20 }}></th>
                            </tr></thead>
                            <tbody>{s.griglia.map((g, gi) => (
                              <tr key={gi} style={{ borderTop: `1px solid ${T.bdr}20` }}>
                                <td style={{ padding: "2px 6px" }}>{g.l}</td>
                                <td style={{ padding: "2px 6px" }}>{g.h}</td>
                                <td style={{ padding: "2px 6px", textAlign: "right", fontWeight: 700, color: T.grn }}>€{g.prezzo}</td>
                                <td style={{ padding: "2px 4px", cursor: "pointer", color: T.red, textAlign: "center" }} onClick={() => {
                                  setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, griglia: x.griglia.filter((_, i) => i !== gi) } : x));
                                }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></td>
                              </tr>
                            ))}</tbody>
                          </table>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <div style={{ fontSize: 8, color: T.sub }}>Min: €{Math.min(...s.griglia.map(g=>g.prezzo))} · Max: €{Math.max(...s.griglia.map(g=>g.prezzo))}</div>
                        <div onClick={() => { if(confirm("Cancellare tutta la griglia?")) setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, griglia: [] } : x)); }} style={{ fontSize: 9, color: T.red, cursor: "pointer" }}>Svuota</div>
                      </div>
                    </div>);
                  })() : (
                    <div style={{ fontSize: 10, color: T.sub, fontStyle: "italic" }}>Nessuna griglia inserita — il prezzo viene calcolato a €/mq.<br/>Puoi caricare il listino del fornitore (CSV: Larghezza;Altezza;Prezzo per riga) oppure aggiungere i prezzi a mano.</div>
                  )}
                </div>
                {/* Minimi mq per tipologia */}
                <div style={{ marginBottom: 8, padding: 8, borderRadius: 8, background: T.bg, border: `1px dashed ${T.bdr}` }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 6 }}>Minimo mq fatturazione per tipologia</div>
                  <div style={{ fontSize: 9, color: T.sub, marginBottom: 6, fontStyle: "italic" }}>Attiva solo le categorie che vuoi — se la finestra è più piccola, il prezzo viene calcolato sulla metratura minima</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {[
                      { key: "1anta", label: "1 Anta" },
                      { key: "2ante", label: "2 Ante" },
                      { key: "3ante", label: "3+ Ante" },
                      { key: "scorrevole", label: "Scorrevole" },
                      { key: "fisso", label: "Fisso" },
                    ].map(cat => {
                      const isActive = (s.minimiMq?.[cat.key] || 0) > 0;
                      return (
                        <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, background: isActive ? PRI + "10" : T.card, border: `1px solid ${isActive ? PRI + "40" : T.bdr}`, opacity: isActive ? 1 : 0.6 }}>
                          <div onClick={() => {
                            if (isActive) {
                              setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, minimiMq: { ...(x.minimiMq || {}), [cat.key]: 0 } } : x));
                            } else {
                              const def = { "1anta": 1.5, "2ante": 2.0, "3ante": 2.8, "scorrevole": 3.5, "fisso": 1.0 }[cat.key] || 1.5;
                              setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, minimiMq: { ...(x.minimiMq || {}), [cat.key]: def } } : x));
                            }
                          }} style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isActive ? PRI : T.bdr}`, background: isActive ? PRI : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 900, flexShrink: 0 }}>
                            {isActive && ""}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 600, color: T.text, minWidth: 52 }}>{cat.label}</span>
                          {isActive && (
                            <>
                              <input type="number" step="0.1" defaultValue={s.minimiMq?.[cat.key] || ""} onBlur={e => {
                                const val = parseFloat(e.target.value) || 0;
                                setSistemiDB(prev => prev.map(x => x.id === s.id ? { ...x, minimiMq: { ...(x.minimiMq || {}), [cat.key]: val } } : x));
                              }} style={{ width: 45, padding: "2px 4px", borderRadius: 4, border: `1px solid ${PRI}40`, fontSize: 11, fontWeight: 700, color: PRI, textAlign: "center", fontFamily: FM }} />
                              <span style={{ fontSize: 9, color: T.sub }}>mq</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {s.sottosistemi && (
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>Sottosistemi</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {s.sottosistemi.map(ss => <span key={ss} style={S.badge(T.blueLt, T.blue)}>{ss}</span>)}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 3 }}>Colori disponibili</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {s.colori.map(c => {
                    const col = coloriDB.find(x => x.code === c);
                    return <span key={c} style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: col?.hex + "20", color: T.text, border: `1px solid ${col?.hex || T.bdr}40` }}>{col?.hex && <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: col.hex, marginRight: 4, verticalAlign: "middle" }} />}{c}</span>;
                  })}
                </div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("sistema"); setSettingsForm({ marca: "", sistema: "", euroMq: "", sovRAL: "", sovLegno: "", sottosistemi: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600 }}>+ Aggiungi sistema</div>
          </>
        )}

        {/* === COLORI === */}
        {settingsTab === "colori" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Colori disponibili — collegati ai sistemi</div>
            {coloriDB.map(c => (
              <div key={c.id} style={{ ...S.card, marginBottom: 6 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: c.hex, border: `1px solid ${T.bdr}`, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.nome}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>{c.code} · {c.tipo}</div>
                </div>
                <div style={{ fontSize: 10, color: T.sub }}>{sistemiDB.filter(s => s.colori.includes(c.code)).map(s => s.marca).join(", ") || "—"}</div>
                <div onClick={() => deleteSettingsItem("colore", c.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("colore"); setSettingsForm({ nome: "", code: "", hex: "#888888", tipo: "RAL" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600 }}>+ Aggiungi colore</div>
          </>
        )}

        {/* === VETRI === */}
        {settingsTab === "vetri" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Tipologie vetro disponibili per i vani</div>
            {vetriDB.map(g => (
              <div key={g.id} style={{ ...S.card, marginBottom: 6 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{g.nome}</div>
                  <div style={{ fontSize: 11, color: T.sub, fontFamily: FM }}>{g.code}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ padding: "3px 8px", borderRadius: 6, background: g.ug <= 0.7 ? T.grnLt : g.ug <= 1.0 ? T.orangeLt : T.redLt, fontSize: 12, fontWeight: 700, fontFamily: FM, color: g.ug <= 0.7 ? T.grn : g.ug <= 1.0 ? T.orange : T.red }}>Ug={g.ug}</span>
                  <div onClick={() => deleteSettingsItem("vetro", g.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
                </div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("vetro"); setSettingsForm({ nome: "", code: "", ug: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600 }}>+ Aggiungi vetro</div>
            <ListinoSettore titolo="Listino Vetri" emoji="vetri" storageKey="vetriListino" T={T} PRI={PRI} FF={FF} />
          </>
        )}

        {/* === TIPOLOGIE === */}
        {settingsTab === "tipologie" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Tipologie serramento — trascina ⭐ per i preferiti</div>
            {TIPOLOGIE_RAPIDE.map(t => {
              const isFav = favTipologie.includes(t.code);
              return (
                <div key={t.code} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px" }}>
                  <div onClick={() => setFavTipologie(fav => isFav ? fav.filter(f => f !== t.code) : [...fav, t.code])} style={{ cursor: "pointer" }}>
                    <span style={{ fontSize: 16, color: isFav ? "#E8A020" : T.bdr }}>{isFav ? "⭐" : ""}</span>
                  </div>
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FM }}>{t.code}</span>
                    <span style={{ fontSize: 11, color: T.sub, marginLeft: 6 }}>{t.label}</span>
                    {t.forma && t.forma !== "rettangolare" && <span style={{ fontSize: 9, color: PRI, marginLeft: 6, background: PRILt, padding: "1px 5px", borderRadius: 4 }}>{t.forma}</span>}
                  </div>
                  <Ico d={ICO.pen} s={14} c={T.sub} />
                </div></div>
              );
            })}
            <div onClick={() => { setSettingsModal("tipologia"); setSettingsForm({ code: "", label: "", icon: "", cat: "Altro", forma: "rettangolare" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipologia</div>
          </>
        )}

        {/* === COPRIFILI === */}
        {settingsTab === "coprifili" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Lista coprifili disponibili nella creazione vano</div>
            {coprifiliDB.map(c => (
              <div key={c.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FM, color: PRI }}>{c.cod}</span>
                  <span style={{ fontSize: 12, marginLeft: 8 }}>{c.nome}</span>
                </div>
                <div onClick={() => deleteSettingsItem("coprifilo", c.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("coprifilo"); setSettingsForm({ nome: "", cod: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi coprifilo</div>
            <ListinoSettore titolo="Listino Coprifili" emoji="coprifili" storageKey="coprifiliListino" T={T} PRI={PRI} FF={FF} />
          </>
        )}

        {/* === LAMIERE === */}
        {settingsTab === "lamiere" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Lista lamiere e scossaline</div>
            {lamiereDB.map(l => (
              <div key={l.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, fontFamily: FM, color: T.orange }}>{l.cod}</span>
                  <span style={{ fontSize: 12, marginLeft: 8 }}>{l.nome}</span>
                </div>
                <div onClick={() => deleteSettingsItem("lamiera", l.id)} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { setSettingsModal("lamiera"); setSettingsForm({ nome: "", cod: "" }); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi lamiera</div>
            <ListinoSettoreLamiere T={T} PRI={PRI} FF={FF} />
          </>
        )}

        {/* === SALITA === */}
        {settingsTab === "tapparella" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura le opzioni per le tapparelle</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21.73 18l-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004 21h16a2 2 0 001.73-3z"/><path d="M12 17V9"/><path d="M8 17V13"/><path d="M16 17V13"/></svg> Tipo Misura Tapparella</div>
            {tipoMisuraTappDB.map(tm => (
              <div key={tm.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tm.code}</span>
                <div onClick={() => setTipoMisuraTappDB(prev => prev.filter(x => x.id !== tm.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo tipo misura tapparella:");}catch(e){} if (n?.trim()) setTipoMisuraTappDB(prev => [...prev, { id: "tmt" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipo misura</div>
            <ListinoSettore titolo="Listino Tapparelle" emoji="⬇️" storageKey="tapparelleListino" T={T} PRI={PRI} FF={FF} fornitori={fornitori} setFornitori={setFornitori} />
          </>
        )}

        {settingsTab === "zanzariera" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura le opzioni per le zanzariere</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21.73 18l-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004 21h16a2 2 0 001.73-3z"/><path d="M12 17V9"/><path d="M8 17V13"/><path d="M16 17V13"/></svg> Tipo Misura Zanzariera</div>
            {tipoMisuraZanzDB.map(tm => (
              <div key={tm.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tm.code}</span>
                <div onClick={() => setTipoMisuraZanzDB(prev => prev.filter(x => x.id !== tm.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo tipo misura zanzariera:");}catch(e){} if (n?.trim()) setTipoMisuraZanzDB(prev => [...prev, { id: "tmz" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipo misura</div>
            <ListinoSettore titolo="Listino Zanzariere" emoji="" storageKey="zanzariereListino" T={T} PRI={PRI} FF={FF} fornitori={fornitori} setFornitori={setFornitori} />
          </>
        )}

        {settingsTab === "persiana" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura le opzioni per le persiane</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> Tipologia Telaio</div>
            {telaiPersianaDB.map(tp => (
              <div key={tp.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tp.code}</span>
                <div onClick={() => setTelaiPersianaDB(prev => prev.filter(x => x.id !== tp.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuova tipologia telaio (es. Z 35):");}catch(e){} if (n?.trim()) setTelaiPersianaDB(prev => [...prev, { id: "tp" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600, marginTop: 4, marginBottom: 16 }}>+ Aggiungi telaio</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21.73 18l-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004 21h16a2 2 0 001.73-3z"/><path d="M12 17V9"/><path d="M8 17V13"/><path d="M16 17V13"/></svg> 4° Lato / Posizionamento</div>
            {posPersianaDB.map(pp => (
              <div key={pp.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{pp.code}</span>
                <div onClick={() => setPosPersianaDB(prev => prev.filter(x => x.id !== pp.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo posizionamento (es. A muro):");}catch(e){} if (n?.trim()) setPosPersianaDB(prev => [...prev, { id: "pp" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi posizionamento</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginTop: 16, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21.73 18l-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004 21h16a2 2 0 001.73-3z"/><path d="M12 17V9"/><path d="M8 17V13"/><path d="M16 17V13"/></svg> Tipo Misura</div>
            {tipoMisuraDB.map(tm => (
              <div key={tm.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tm.code}</span>
                <div onClick={() => setTipoMisuraDB(prev => prev.filter(x => x.id !== tm.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo tipo misura (es. Luce netta):");}catch(e){} if (n?.trim()) setTipoMisuraDB(prev => [...prev, { id: "tm" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipo misura</div>
            <ListinoSettore titolo="Listino Persiane" emoji="" storageKey="persianeListino" T={T} PRI={PRI} FF={FF} fornitori={fornitori} setFornitori={setFornitori} />
          </>
        )}

        {/* === SALITA === */}
        {settingsTab === "controtelaio" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura profondità, sezioni e modelli cielino per i controtelai</div>
            
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21.73 18l-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004 21h16a2 2 0 001.73-3z"/><path d="M12 17V9"/><path d="M8 17V13"/><path d="M16 17V13"/></svg> Profondità disponibili (mm)</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
              {ctProfDB.map(p => (
                <div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"6px 10px",borderRadius:8,border:`1px solid ${T.bdr}`,background:T.card}}>
                  <span style={{fontSize:12,fontWeight:600}}>{p.code}</span>
                  <div onClick={() => setCtProfDB(prev => prev.filter(x => x.id !== p.id))} style={{ cursor: "pointer", fontSize: 10, color: T.sub }}></div>
                </div>
              ))}
            </div>
            <div onClick={() => { let n; try{n=window.prompt("Nuova profondità (mm):");}catch(e){} if (n?.trim()) setCtProfDB(prev => [...prev, { id: "cp" + Date.now(), code: n.trim() }]); }} style={{ padding: "10px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 11, fontWeight: 600, marginBottom: 16 }}>+ Aggiungi profondità</div>

            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21.73 18l-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004 21h16a2 2 0 001.73-3z"/><path d="M12 17V9"/><path d="M8 17V13"/><path d="M16 17V13"/></svg> Sezioni controtelaio</div>
            {ctSezioniDB.map(s => (
              <div key={s.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{s.code}</span>
                <div onClick={() => setCtSezioniDB(prev => prev.filter(x => x.id !== s.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuova sezione (es. 56×40):");}catch(e){} if (n?.trim()) setCtSezioniDB(prev => [...prev, { id: "cs" + Date.now(), code: n.trim() }]); }} style={{ padding: "10px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 11, fontWeight: 600, marginBottom: 16 }}>+ Aggiungi sezione</div>

            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><rect x="3" y="3" width="18" height="18" rx="2"/></svg> Modelli cielino</div>
            {ctCieliniDB.map(c => (
              <div key={c.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.code}</span>
                <div onClick={() => setCtCieliniDB(prev => prev.filter(x => x.id !== c.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo modello cielino:");}catch(e){} if (n?.trim()) setCtCieliniDB(prev => [...prev, { id: "cc" + Date.now(), code: n.trim() }]); }} style={{ padding: "10px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 11, fontWeight: 600, marginBottom: 16 }}>+ Aggiungi cielino</div>

            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Offset calcolo infisso</div>
            <div style={{ fontSize: 10, color: T.sub, marginBottom: 6 }}>Millimetri da sottrarre per lato (L e H) quando si calcola l'infisso dal controtelaio</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input style={{...S.input,width:80,textAlign:"center",fontSize:16,fontWeight:700}} type="number" inputMode="numeric" value={ctOffset} onChange={e=>setCtOffset(parseInt(e.target.value)||0)} />
              <span style={{fontSize:12,color:T.sub}}>mm/lato → totale −{ctOffset*2}mm</span>
            </div>
          </>
        )}

        {settingsTab === "cassonetto" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura i tipi di cassonetto disponibili</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> Tipo Cassonetto</div>
            {tipoCassonettoDB.map(tc => (
              <div key={tc.id} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{tc.code}</span>
                <div onClick={() => setTipoCassonettoDB(prev => prev.filter(x => x.id !== tc.id))} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nuovo tipo cassonetto:");}catch(e){} if (n?.trim()) setTipoCassonettoDB(prev => [...prev, { id: "tc" + Date.now(), code: n.trim() }]); }} style={{ padding: "12px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi tipo cassonetto</div>
            <ListinoSettore titolo="Listino Cassonetti" emoji="cassonetti" storageKey="cassonettoListino" T={T} PRI={PRI} FF={FF} />
          </>
        )}

        {settingsTab === "salita" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Configura i mezzi di salita disponibili</div>
            {mezziSalita.map((m, i) => (
              <div key={i} style={{ ...S.card, marginBottom: 4 }}><div style={{ ...S.cardInner, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{m}</span>
                </div>
                <div onClick={() => { if ((()=>{try{return window.confirm(`Eliminare "${m}"?`);}catch(e){return false;}})()) setMezziSalita(ms => ms.filter((_, j) => j !== i)); }} style={{ cursor: "pointer" }}><Ico d={ICO.trash} s={14} c={T.sub} /></div>
              </div></div>
            ))}
            <div onClick={() => { let n; try{n=window.prompt("Nome mezzo di salita:");}catch(e){} if (n?.trim()) setMezziSalita(ms => [...ms, n.trim()]); }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600, marginTop: 4 }}>+ Aggiungi mezzo salita</div>
          </>
        )}

        {/* === PIPELINE === */}
        {/* === LIBRERIA PRODOTTI === */}
        {settingsTab === "libreria" && (
          <>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 8 }}>Crea una libreria di prodotti/servizi da usare nelle Voci libere dei vani. Clicca sui campi per modificarli.</div>
            {libreriaDB.map(item => (
              <div key={item.id} style={{ ...S.card, marginBottom: 8 }}><div style={{ ...S.cardInner }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  {/* Foto */}
                  <div style={{ flexShrink: 0 }}>
                    {item.foto ? (
                      <div style={{ position: "relative" }}>
                        <img src={item.foto} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8, border: `1px solid ${T.bdr}` }} alt="" />
                        <div onClick={() => setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, foto: undefined } : x))} style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: T.red, color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 900 }}></div>
                      </div>
                    ) : (
                      <label style={{ width: 56, height: 56, borderRadius: 8, background: T.bg, border: `1px dashed ${T.bdr}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: 2 }}>
                        <span style={{ fontSize: 18 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></span>
                        <span style={{ fontSize: 7, color: T.sub }}>Foto</span>
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, foto: ev.target?.result as string } : x));
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                    )}
                  </div>
                  {/* Campi editabili */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <input style={{ width: "100%", padding: "4px 6px", fontSize: 13, fontWeight: 700, border: `1px solid transparent`, borderRadius: 4, background: "transparent", marginBottom: 3 }} defaultValue={item.nome || ""} placeholder="Nome prodotto..." onFocus={e => e.target.style.borderColor = PRI} onBlur={e => { e.target.style.borderColor = "transparent"; setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, nome: e.target.value } : x)); }} />
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 9, color: T.sub }}>Cat:</span>
                        <input style={{ width: 80, padding: "2px 4px", fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, background: T.bg }} defaultValue={item.categoria || ""} placeholder="Categoria" onBlur={e => setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, categoria: e.target.value } : x))} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 9, color: T.sub }}>€</span>
                        <input type="number" step="0.01" style={{ width: 60, padding: "2px 4px", fontSize: 12, fontWeight: 700, fontFamily: FM, color: T.grn, border: `1px solid ${T.bdr}`, borderRadius: 4, textAlign: "right" }} defaultValue={item.prezzo || 0} onBlur={e => setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, prezzo: parseFloat(e.target.value) || 0 } : x))} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 9, color: T.sub }}>/</span>
                        <select style={{ padding: "2px 4px", fontSize: 10, border: `1px solid ${T.bdr}`, borderRadius: 4, background: T.bg }} value={item.unita || "pz"} onChange={e => setLibreriaDB(prev => prev.map(x => x.id === item.id ? { ...x, unita: e.target.value } : x))}>
                          <option value="pz">Pezzo</option>
                          <option value="mq">mq</option>
                          <option value="ml">ml</option>
                          <option value="kg">kg</option>
                          <option value="forfait">Forfait</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {/* Delete */}
                  <div onClick={() => setLibreriaDB(prev => prev.filter(x => x.id !== item.id))} style={{ padding: "6px", cursor: "pointer", color: T.sub, fontSize: 12, flexShrink: 0 }}></div>
                </div>
              </div></div>
            ))}
            <div onClick={() => {
              setLibreriaDB(prev => [...prev, { id: Date.now(), nome: "", categoria: "", prezzo: 0, unita: "pz" }]);
            }} style={{ padding: "14px", borderRadius: T.r, border: `1px dashed ${PRI}`, textAlign: "center", cursor: "pointer", color: PRI, fontSize: 12, fontWeight: 600 }}>+ Aggiungi prodotto alla libreria</div>
          </>
        )}

        {/* === SQUADRE MONTAGGIO === */}
        {settingsTab === "squadre" && (
          <>
            <div style={{ fontSize: 12, color: T.sub, padding: "0 4px 10px", lineHeight: 1.5 }}>Configura le squadre di montaggio. Ogni squadra ha un nome, membri e colore.</div>
            {squadreDB.map((sq, i) => (
              <div key={sq.id} style={{ background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: 12, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input type="color" value={sq.colore} onChange={e => setSquadreDB(prev => prev.map((s, j) => j === i ? { ...s, colore: e.target.value } : s))} style={{ width: 32, height: 32, border: "none", borderRadius: 6, cursor: "pointer" }} />
                  <input style={{ ...S.input, flex: 1, fontSize: 14, fontWeight: 700 }} value={sq.nome} onChange={e => setSquadreDB(prev => prev.map((s, j) => j === i ? { ...s, nome: e.target.value } : s))} />
                  <div onClick={() => setSquadreDB(prev => prev.filter((_, j) => j !== i))} style={{ fontSize: 16, cursor: "pointer", color: T.red }}></div>
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 3 }}>MEMBRI (uno per riga)</div>
                <textarea style={{ ...S.input, width: "100%", minHeight: 50, fontSize: 11, boxSizing: "border-box" }} value={sq.membri.join("\n")} onChange={e => setSquadreDB(prev => prev.map((s, j) => j === i ? { ...s, membri: e.target.value.split("\n").filter(x => x.trim()) } : s))} />
                <div style={{ fontSize: 9, color: T.sub, marginTop: 4 }}>Montaggi assegnati: {montaggiDB.filter(m => m.squadraId === sq.id).length}</div>
              </div>
            ))}
            <button onClick={() => setSquadreDB(prev => [...prev, { id: "sq" + Date.now(), nome: "Nuova Squadra", membri: [], colore: "#E8A020" }])} style={{ width: "100%", padding: 12, borderRadius: 10, border: `1.5px dashed ${T.bdr}`, background: "transparent", color: PRI, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Aggiungi squadra</button>
          </>
        )}

        {/* === FATTURE EMESSE === */}
        {settingsTab === "fatture" && (
          <>
            <div style={{ fontSize: 12, color: T.sub, padding: "0 4px 10px", lineHeight: 1.5 }}>Elenco fatture emesse. Puoi segnare le fatture come pagate o ristampare il PDF.</div>
            {fattureDB.length === 0 ? (
              <div style={{ textAlign: "center", padding: 24, color: T.sub }}>Nessuna fattura emessa. Crea fatture dalla scheda preventivo di una commessa.</div>
            ) : (
              <>
                {/* Riepilogo */}
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{ flex: 1, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Totale emesso</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: T.text }}>€{fattureDB.reduce((s, f) => s + f.importo, 0).toLocaleString("it-IT")}</div>
                  </div>
                  <div style={{ flex: 1, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Incassato</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#1A9E73" }}>€{fattureDB.filter(f => f.pagata).reduce((s, f) => s + f.importo, 0).toLocaleString("it-IT")}</div>
                  </div>
                  <div style={{ flex: 1, background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, padding: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: T.sub, textTransform: "uppercase" }}>Da incassare</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#DC4444" }}>€{fattureDB.filter(f => !f.pagata).reduce((s, f) => s + f.importo, 0).toLocaleString("it-IT")}</div>
                  </div>
                </div>
                {fattureDB.sort((a, b) => b.numero - a.numero).map(f => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: T.card, borderRadius: T.r, border: `1px solid ${T.bdr}`, marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>N. {f.numero}/{f.anno} — {f.tipo.toUpperCase()}</div>
                      <div style={{ fontSize: 10, color: T.sub }}>{f.cliente} · {f.cmCode} · {f.data ? new Date(f.data+'T12:00:00').toLocaleDateString('it-IT') : f.data}</div>
                      <div style={{ fontSize: 9, color: f.pagata ? "#1A9E73" : (f.scadenza < new Date().toISOString().split("T")[0] ? "#DC4444" : T.sub) }}>
                        {f.pagata ? `Pagata il ${f.dataPagamento}` : `Scadenza: ${f.scadenza}`}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: T.text }}>€{f.importo.toLocaleString("it-IT")}</div>
                      <div onClick={() => setFattureDB(prev => prev.map(x => x.id === f.id ? { ...x, pagata: !x.pagata, dataPagamento: !x.pagata ? new Date().toLocaleDateString("it-IT") : null } : x))} style={{ padding: "4px 8px", borderRadius: 6, background: f.pagata ? "#1A9E7320" : "#DC444420", color: f.pagata ? "#1A9E73" : "#DC4444", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                        {f.pagata ? "" : ""}
                      </div>
                      <div onClick={() => generaFatturaPDF(f)} style={{ fontSize: 16, cursor: "pointer" }}></div>
                      <div onClick={() => setFattureDB(prev => prev.filter(x => x.id !== f.id))} style={{ fontSize: 14, cursor: "pointer", color: T.red }}></div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {settingsTab === "pipeline" && (
          <>
            <div style={{fontSize:12,color:T.sub,padding:"0 4px 10px",lineHeight:1.5}}>Personalizza il flusso di lavoro. Ogni fase controlla <b style={{color:PRI}}>ERP + Messaggi + Montaggi</b> automaticamente.</div>
            
            {/* LEGENDA ECOSISTEMA */}
            <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
              {[{e:"",l:"ERP",c:PRI},{e:"",l:"Messaggi",c:"#1A9E73"},{e:"",l:"Montaggi",c:"#E8A020"},{e:"",l:"Automazioni",c:"#af52de"}].map(b=>(
                <div key={b.l} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:20,background:b.c+"15",border:`1px solid ${b.c}30`}}>
                  <span style={{fontSize:10}}>{b.e}</span><span style={{fontSize:10,fontWeight:700,color:b.c}}>{b.l}</span>
                </div>
              ))}
            </div>
        
            {pipelineDB.map((p, i) => {
              const isExp = expandedPipelinePhase === p.id;
              const pTab = pipelinePhaseTab || "email";
              return (
              <div key={p.id} style={{marginBottom:8, opacity: p.attiva===false ? 0.45 : 1}}>
                <div style={{...S.card, marginBottom:0, borderRadius: isExp ? "10px 10px 0 0" : undefined}}>
                  <div onClick={()=>{setExpandedPipelinePhase(isExp?null:p.id);setPipelinePhaseTab("email");}} style={{display:"flex", alignItems:"center", gap:8, padding:"10px 12px", cursor:"pointer"}}>
                    <div style={{display:"flex",flexDirection:"column",gap:1}}>
                      <div onClick={(e)=>{e.stopPropagation(); if(i===0) return; const a=[...pipelineDB]; [a[i-1],a[i]]=[a[i],a[i-1]]; setPipelineDB(a); }} style={{fontSize:10,cursor:i===0?"default":"pointer",color:i===0?T.bdr:T.sub,lineHeight:1}}>▲</div>
                      <div onClick={(e)=>{e.stopPropagation(); if(i===pipelineDB.length-1) return; const a=[...pipelineDB]; [a[i],a[i+1]]=[a[i+1],a[i]]; setPipelineDB(a); }} style={{fontSize:10,cursor:i===pipelineDB.length-1?"default":"pointer",color:i===pipelineDB.length-1?T.bdr:T.sub,lineHeight:1}}>▼</div>
                    </div>
                    <span style={{fontSize:20,flexShrink:0}}>{p.ico}</span>
                    <input value={p.nome} onChange={e=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,nome:e.target.value}:x))}
                      onClick={(e)=>e.stopPropagation()} style={{flex:1,border:"none",background:"transparent",fontSize:13,fontWeight:700,color:T.text,fontFamily:FF,outline:"none",padding:0}}/>
                    <div onClick={(e)=>{e.stopPropagation();setExpandedPipelinePhase(isExp?null:p.id);setPipelinePhaseTab("email");}} style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:isExp?PRI+"18":"#f0f0f0",cursor:"pointer",flexShrink:0,marginLeft:4}}><span style={{fontSize:12,color:isExp?PRI:"#999",transform:isExp?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s"}}>▾</span></div><div style={{width:12,height:12,borderRadius:"50%",background:p.color,flexShrink:0}}/>
                    <div onClick={(e)=>{e.stopPropagation(); if(p.id==="chiusura") return; setPipelineDB(db=>db.map((x,j)=>j===i?{...x,attiva:x.attiva===false?true:false}:x)); }}
                      style={{width:36,height:20,borderRadius:10,background:p.attiva===false?T.bdr:T.grn,cursor:p.id==="chiusura"?"default":"pointer",transition:"background 0.2s",position:"relative",flexShrink:0}}>
                      <div style={{position:"absolute",top:2,left:p.attiva===false?2:18,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                    </div>
                    {p.custom && <div onClick={(e)=>{e.stopPropagation();setPipelineDB(db=>db.filter((_,j)=>j!==i));}} style={{fontSize:12,cursor:"pointer",color:T.red}}></div>}
                    
                  </div>
                  {!isExp && (p.emailTemplate || (p.checklistMontaggio||[]).length>0 || (p.automazioni||[]).length>0) && (
                    <div style={{display:"flex",gap:4,padding:"0 12px 8px",flexWrap:"wrap"}}>
                      {p.emailTemplate && <span style={{fontSize:8,padding:"2px 6px",borderRadius:10,background:"#1A9E7315",color:"#1A9E73",fontWeight:700}}>Email</span>}
                      {(p.checklistMontaggio||[]).length>0 && <span style={{fontSize:8,padding:"2px 6px",borderRadius:10,background:"#E8A02015",color:"#E8A020",fontWeight:700}}>{p.checklistMontaggio.length} check</span>}
                      {(p.automazioni||[]).length>0 && <span style={{fontSize:8,padding:"2px 6px",borderRadius:10,background:"#af52de15",color:"#af52de",fontWeight:700}}>{p.automazioni.length} auto</span>}
                    </div>
                  )}
                </div>
        
                {isExp && (
                  <div style={{background:T.card,border:`1px solid ${T.bdr}`,borderTop:"none",borderRadius:"0 0 10px 10px",overflow:"hidden"}}>
                    <div style={{display:"flex",borderBottom:`1px solid ${T.bdr}`}}>
                      {[{id:"email",l:"Email",c:"#1A9E73"},{id:"checklist",l:"Checklist",c:"#E8A020"},{id:"auto",l:"Auto",c:"#af52de"},{id:"gate",l:"Gate",c:PRI}].map(tab=>(
                        <div key={tab.id} onClick={()=>setPipelinePhaseTab(tab.id)}
                          style={{flex:1,padding:"8px 4px",textAlign:"center",fontSize:10,fontWeight:700,cursor:"pointer",
                            color:pTab===tab.id?tab.c:T.sub,borderBottom:pTab===tab.id?`2px solid ${tab.c}`:"2px solid transparent",
                            background:pTab===tab.id?tab.c+"08":"transparent"}}>{tab.l}</div>
                      ))}
                    </div>
                    <div style={{padding:12}}>
        
                      {/* EMAIL TAB */}
                      {pTab==="email" && (<div>
                        <div style={{fontSize:11,color:T.sub,marginBottom:8}}>Template email automatica quando la commessa entra in questa fase.</div>
                        <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:4}}>OGGETTO</div>
                        <input value={p.emailTemplate?.oggetto||""} placeholder={`es: Conferma ${p.nome} - ${"{{"}cliente${"}}"}  `}
                          onChange={e=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,emailTemplate:{...(x.emailTemplate||{}),oggetto:e.target.value}}:x))}
                          style={{...S.input,width:"100%",fontSize:12,marginBottom:8,boxSizing:"border-box"}} />
                        <div style={{fontSize:9,fontWeight:700,color:T.sub,marginBottom:4}}>CORPO</div>
                        <textarea value={p.emailTemplate?.corpo||""} placeholder="Gentile cliente,..."
                          onChange={e=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,emailTemplate:{...(x.emailTemplate||{}),corpo:e.target.value}}:x))}
                          style={{...S.input,width:"100%",minHeight:80,fontSize:11,lineHeight:1.5,boxSizing:"border-box",resize:"vertical"}} />
                        <div style={{display:"flex",gap:8,marginTop:8,alignItems:"center",flexWrap:"wrap"}}>
                          <div style={{display:"flex",alignItems:"center",gap:4}}>
                            <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,emailTemplate:{...(x.emailTemplate||{}),attiva:!(x.emailTemplate?.attiva)}}:x))}
                              style={{width:32,height:18,borderRadius:9,background:p.emailTemplate?.attiva?T.grn:T.bdr,cursor:"pointer",position:"relative"}}>
                              <div style={{position:"absolute",top:2,left:p.emailTemplate?.attiva?16:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                            </div>
                            <span style={{fontSize:10,color:p.emailTemplate?.attiva?"#1A9E73":T.sub,fontWeight:600}}>Invio auto</span>
                          </div>
                          <select value={p.emailTemplate?.destinatario||"cliente"}
                            onChange={e=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,emailTemplate:{...(x.emailTemplate||{}),destinatario:e.target.value}}:x))}
                            style={{...S.input,fontSize:10,padding:"3px 6px"}}>
                            <option value="cliente">Al cliente</option>
                            <option value="team">Al team</option>
                            <option value="entrambi">Entrambi</option>
                          </select>
                        </div>
                      </div>)}
        
                      {/* CHECKLIST TAB */}
                      {pTab==="checklist" && (<div>
                        <div style={{fontSize:11,color:T.sub,marginBottom:8}}>Checklist per montatori. Visibile in MASTRO MONTAGGI.</div>
                        {(p.checklistMontaggio||[]).map((item,ci)=>(
                          <div key={ci} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                            <span style={{fontSize:11,color:T.sub,width:18,textAlign:"center"}}>{ci+1}.</span>
                            <input value={item} onChange={e=>{const nl=[...(p.checklistMontaggio||[])];nl[ci]=e.target.value;setPipelineDB(db=>db.map((x,j)=>j===i?{...x,checklistMontaggio:nl}:x));}}
                              style={{...S.input,flex:1,fontSize:11,boxSizing:"border-box"}} placeholder="es: Verificare dimensioni vano..." />
                            <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,checklistMontaggio:(x.checklistMontaggio||[]).filter((_,k)=>k!==ci)}:x))} style={{fontSize:12,cursor:"pointer",color:T.red}}></div>
                          </div>
                        ))}
                        <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,checklistMontaggio:[...(x.checklistMontaggio||[]),""]}:x))}
                          style={{padding:"8px",borderRadius:8,border:`1px dashed ${PRI}`,textAlign:"center",cursor:"pointer",color:PRI,fontSize:11,fontWeight:600}}>+ Aggiungi voce</div>
                        {(p.checklistMontaggio||[]).length>0 && (
                          <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8}}>
                            <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,checklistObbligatoria:!x.checklistObbligatoria}:x))}
                              style={{width:32,height:18,borderRadius:9,background:p.checklistObbligatoria?T.grn:T.bdr,cursor:"pointer",position:"relative"}}>
                              <div style={{position:"absolute",top:2,left:p.checklistObbligatoria?16:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                            </div>
                            <span style={{fontSize:10,color:p.checklistObbligatoria?"#1A9E73":T.sub,fontWeight:600}}>Obbligatoria (blocca avanzamento)</span>
                          </div>
                        )}
                      </div>)}
        
                      {/* AUTOMAZIONI TAB */}
                      {pTab==="auto" && (<div>
                        <div style={{fontSize:11,color:T.sub,marginBottom:8}}>Azioni automatiche all'ingresso in questa fase.</div>
                        {(p.automazioni||[]).map((auto,ai)=>(
                          <div key={ai} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,background:T.bg,borderRadius:8,padding:"6px 8px"}}>
                            <select value={auto.tipo} onChange={e=>{const na=[...(p.automazioni||[])];na[ai]={...na[ai],tipo:e.target.value};setPipelineDB(db=>db.map((x,j)=>j===i?{...x,automazioni:na}:x));}}
                              style={{...S.input,fontSize:10,padding:"3px 6px",flex:1}}>
                              <option value="notifica_team">Notifica team</option>
                              <option value="notifica_cliente">Notifica cliente</option>
                              <option value="assegna_squadra">Assegna squadra</option>
                              <option value="crea_task">Crea task</option>
                              <option value="genera_pdf">Genera PDF</option>
                              <option value="verifica_magazzino">Verifica magazzino</option>
                              <option value="prenota_consegna">Prenota consegna</option>
                              <option value="richiedi_acconto">Richiedi acconto</option>
                              <option value="invia_enea">Pratica ENEA</option>
                              <option value="follow_up">Follow-up</option>
                            </select>
                            <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,automazioni:(x.automazioni||[]).filter((_,k)=>k!==ai)}:x))} style={{fontSize:12,cursor:"pointer",color:T.red}}></div>
                          </div>
                        ))}
                        <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,automazioni:[...(x.automazioni||[]),{tipo:"notifica_team",attiva:true}]}:x))}
                          style={{padding:"8px",borderRadius:8,border:`1px dashed ${PRI}`,textAlign:"center",cursor:"pointer",color:PRI,fontSize:11,fontWeight:600}}>+ Aggiungi automazione</div>
                      </div>)}
        
                      {/* GATE TAB */}
                      {pTab==="gate" && (<div>
                        <div style={{fontSize:11,color:T.sub,marginBottom:8}}>Requisiti per avanzare a questa fase.</div>
                        {(p.gateRequisiti||[]).map((req,ri)=>(
                          <div key={ri} style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
                            <select value={req.tipo} onChange={e=>{const nr=[...(p.gateRequisiti||[])];nr[ri]={...nr[ri],tipo:e.target.value};setPipelineDB(db=>db.map((x,j)=>j===i?{...x,gateRequisiti:nr}:x));}}
                              style={{...S.input,fontSize:10,padding:"3px 6px",flex:1}}>
                              <option value="preventivo_approvato">Preventivo approvato</option>
                              <option value="acconto_ricevuto">Acconto ricevuto</option>
                              <option value="misure_confermate">Misure confermate</option>
                              <option value="materiali_ordinati">Materiali ordinati</option>
                              <option value="materiali_arrivati">Materiali arrivati</option>
                              <option value="squadra_assegnata">Squadra assegnata</option>
                              <option value="data_montaggio">Data montaggio fissata</option>
                              <option value="documenti_ok">Documenti completi</option>
                              <option value="checklist_completa">Checklist completata</option>
                              <option value="firma_cliente">Firma cliente</option>
                            </select>
                            <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,gateRequisiti:(x.gateRequisiti||[]).filter((_,k)=>k!==ri)}:x))} style={{fontSize:12,cursor:"pointer",color:T.red}}></div>
                          </div>
                        ))}
                        <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,gateRequisiti:[...(x.gateRequisiti||[]),{tipo:"preventivo_approvato"}]}:x))}
                          style={{padding:"8px",borderRadius:8,border:`1px dashed ${PRI}`,textAlign:"center",cursor:"pointer",color:PRI,fontSize:11,fontWeight:600}}>+ Aggiungi requisito</div>
                        <div style={{display:"flex",alignItems:"center",gap:4,marginTop:8}}>
                          <div onClick={()=>setPipelineDB(db=>db.map((x,j)=>j===i?{...x,gateBloccante:!x.gateBloccante}:x))}
                            style={{width:32,height:18,borderRadius:9,background:p.gateBloccante?"#DC4444":T.bdr,cursor:"pointer",position:"relative"}}>
                            <div style={{position:"absolute",top:2,left:p.gateBloccante?16:2,width:14,height:14,borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
                          </div>
                          <span style={{fontSize:10,color:p.gateBloccante?"#DC4444":T.sub,fontWeight:600}}>Gate bloccante</span>
                        </div>
                      </div>)}
        
                    </div>
                  </div>
                )}
              </div>
              );
            })}
        
            <div onClick={()=>{ let nome; try{nome=window.prompt("Nome nuova fase:");}catch(e){} if(nome?.trim()) setPipelineDB(db=>[...db.slice(0,-1),{id:"custom_"+Date.now(),nome:nome.trim(),ico:"⭐",color:"#8e8e93",attiva:true,custom:true},...db.slice(-1)]); }}
              style={{...S.card,marginTop:4,textAlign:"center",padding:"10px",cursor:"pointer",color:PRI,fontSize:13,fontWeight:700}}>+ Aggiungi fase personalizzata</div>
            <div onClick={()=>{ if(!confirm("ATTENZIONE: Sei sicuro di voler ripristinare tutti i dati?")) return; if(!confirm("ULTIMA CONFERMA: Tutti i dati torneranno ai dati demo. Confermi?")) return; localStorage.removeItem("mastro_erp_data"); if((()=>{try{return window.confirm("Ripristinare le fasi predefinite?");}catch(e){return false;}})())setPipelineDB(PIPELINE_DEFAULT);}}
              style={{textAlign:"center",padding:"10px 0 4px",fontSize:11,color:T.sub,cursor:"pointer"}}>Ripristina predefinita</div>
          </>
        )}

        {/* === MANODOPERA === */}
        {settingsTab === "manodopera" && (() => {
          const config = ctx.aziendaInfo?.manodopera || { costoOraDefault: 35, oreDefaultPerTipo: [], mostraInPreventivo: false };
          const updateConfig = (upd) => {
            const next = { ...config, ...upd };
            ctx.setAziendaInfo(prev => ({ ...prev, manodopera: next }));
          };
          const orePerTipo = config.oreDefaultPerTipo || [];
          const addTipo = () => { updateConfig({ oreDefaultPerTipo: [...orePerTipo, { tipo: "", oreStimate: 1, nota: "" }] }); };
          const updTipo = (i, upd) => { const a = [...orePerTipo]; a[i] = { ...a[i], ...upd }; updateConfig({ oreDefaultPerTipo: a }); };
          const delTipo = (i) => { updateConfig({ oreDefaultPerTipo: orePerTipo.filter((_, j) => j !== i) }); };
          const costiSquadre = config.costoPerSquadra || [];
          const addSqCosto = () => { updateConfig({ costoPerSquadra: [...costiSquadre, { squadraId: "", costoOra: config.costoOraDefault }] }); };
          const updSqCosto = (i, upd) => { const a = [...costiSquadre]; a[i] = { ...a[i], ...upd }; updateConfig({ costoPerSquadra: a }); };
          const delSqCosto = (i) => { updateConfig({ costoPerSquadra: costiSquadre.filter((_, j) => j !== i) }); };
          const squadre = ctx.squadreDB || [];
          return (
          <div>
            {/* Header */}
            <div style={{background:PRI,borderRadius:12,padding:"14px 16px",color:"#fff",marginBottom:12}}>
              <div style={{fontSize:14,fontWeight:900}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M2 18a1 1 0 001 1h18a1 1 0 001-1v-2a1 1 0 00-1-1H3a1 1 0 00-1 1v2z"/><path d="M10 15V6a1 1 0 011-1h2a1 1 0 011 1v9"/><path d="M4 15v-3a8 8 0 0116 0v3"/></svg> Manodopera</div>
              <div style={{fontSize:10,opacity:0.8,marginTop:2}}>Configura costi orari e ore stimate per tipo vano</div>
            </div>

            {/* Costo orario default */}
            <div style={{...S.card, padding:"14px 16px", marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:800,color:T.text,marginBottom:8}}>Costo orario aziendale</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,fontWeight:700,color:T.sub}}>€/ora default:</span>
                <input type="number" value={config.costoOraDefault} onChange={e=>updateConfig({costoOraDefault:Number(e.target.value)})}
                  style={{width:80,padding:"8px 10px",borderRadius:8,border:`1px solid ${T.bdr}`,fontSize:14,fontWeight:800,fontFamily:FF,textAlign:"center"}} />
              </div>
              <div style={{fontSize:9,color:T.sub,marginTop:4}}>Usato quando nessun costo specifico per squadra è impostato</div>
            </div>

            {/* Costi per squadra */}
            <div style={{...S.card, padding:"14px 16px", marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:11,fontWeight:800,color:T.text}}>Costi per squadra</span>
                <div onClick={addSqCosto} style={{padding:"4px 10px",borderRadius:6,background:PRI+"12",border:`1px solid ${PRI}30`,fontSize:10,fontWeight:700,color:PRI,cursor:"pointer"}}>+ Squadra</div>
              </div>
              {costiSquadre.length === 0 && <div style={{fontSize:10,color:T.sub,textAlign:"center",padding:8}}>Tutte le squadre usano il costo default (€{config.costoOraDefault}/ora)</div>}
              {costiSquadre.map((sq,i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:`1px solid ${T.bdr}20`}}>
                  <select value={sq.squadraId} onChange={e=>updSqCosto(i,{squadraId:e.target.value})} style={{flex:1,padding:"6px 8px",borderRadius:6,border:`1px solid ${T.bdr}`,fontSize:11,fontFamily:"Inter"}}>
                    <option value="">Seleziona squadra</option>
                    {squadre.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <span style={{fontSize:10,color:T.sub}}>€</span>
                    <input type="number" value={sq.costoOra} onChange={e=>updSqCosto(i,{costoOra:Number(e.target.value)})}
                      style={{width:60,padding:"6px",borderRadius:6,border:`1px solid ${T.bdr}`,fontSize:12,fontWeight:700,fontFamily:FF,textAlign:"center"}} />
                    <span style={{fontSize:10,color:T.sub}}>/ora</span>
                  </div>
                  <div onClick={()=>delSqCosto(i)} style={{padding:"4px 8px",cursor:"pointer",fontSize:14,color:"#DC4444"}}>×</div>
                </div>
              ))}
            </div>

            {/* Ore stimate per tipo vano */}
            <div style={{...S.card, padding:"14px 16px", marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontSize:11,fontWeight:800,color:T.text}}>Ore stimate per tipo vano</span>
                <div onClick={addTipo} style={{padding:"4px 10px",borderRadius:6,background:PRI+"12",border:`1px solid ${PRI}30`,fontSize:10,fontWeight:700,color:PRI,cursor:"pointer"}}>+ Tipo</div>
              </div>
              <div style={{fontSize:9,color:T.sub,marginBottom:8}}>Quando aggiungi un vano, le ore si compilano automaticamente in base al tipo</div>
              {orePerTipo.length === 0 && <div style={{fontSize:10,color:T.sub,textAlign:"center",padding:8}}>Nessuna regola. Aggiungi i tipi di vano comuni (es: Finestra 1A = 2h, Portafinestra 2A = 4h)</div>}
              {orePerTipo.map((t,i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 0",borderBottom:`1px solid ${T.bdr}20`}}>
                  <input value={t.tipo} onChange={e=>updTipo(i,{tipo:e.target.value})} placeholder="Tipo (es: Finestra 1A)"
                    style={{flex:1,padding:"6px 8px",borderRadius:6,border:`1px solid ${T.bdr}`,fontSize:11,fontFamily:"Inter"}} />
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    <input type="number" step="0.5" value={t.oreStimate} onChange={e=>updTipo(i,{oreStimate:Number(e.target.value)})}
                      style={{width:50,padding:"6px",borderRadius:6,border:`1px solid ${T.bdr}`,fontSize:12,fontWeight:700,fontFamily:FF,textAlign:"center"}} />
                    <span style={{fontSize:10,color:T.sub}}>ore</span>
                  </div>
                  <div onClick={()=>delTipo(i)} style={{padding:"4px 8px",cursor:"pointer",fontSize:14,color:"#DC4444"}}>×</div>
                </div>
              ))}
            </div>

            {/* Opzione preventivo */}
            <div style={{...S.card, padding:"14px 16px", marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:11,fontWeight:800,color:T.text}}>Mostra manodopera nel preventivo</div>
                  <div style={{fontSize:9,color:T.sub,marginTop:2}}>Se attivo, aggiunge una riga "Manodopera" separata nel PDF</div>
                </div>
                <div onClick={()=>updateConfig({mostraInPreventivo:!config.mostraInPreventivo})} style={{
                  width:44,height:24,borderRadius:12,padding:2,cursor:"pointer",transition:"background 0.2s",
                  background:config.mostraInPreventivo?"#1A9E73":T.bdr,display:"flex",alignItems:config.mostraInPreventivo?"center":"center",
                  justifyContent:config.mostraInPreventivo?"flex-end":"flex-start"
                }}>
                  <div style={{width:20,height:20,borderRadius:10,background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,0.2)",transition:"all 0.2s"}} />
                </div>
              </div>
            </div>

            {/* Tabella riepilogativa esempio */}
            <div style={{...S.card, padding:"14px 16px"}}>
              <div style={{fontSize:11,fontWeight:800,color:T.text,marginBottom:8}}>Come funziona</div>
              <div style={{fontSize:10,color:T.sub,lineHeight:1.6}}>
                1. Configura i tipi vano comuni con le ore stimate<br/>
                2. Quando crei un vano, le ore si compilano automaticamente<br/>
                3. Puoi aggiungere ore extra per demolizione, muratura, etc.<br/>
                4. Il costo si calcola: (ore stimate + ore extra) × costo orario<br/>
                5. Nel riepilogo commessa vedi il totale manodopera<br/>
                6. Se attivo, appare come riga separata nel preventivo PDF
              </div>
            </div>
          </div>
          );
        })()}

        {/* === GUIDA === */}
        {/* === IMPORTA CATALOGO === */}
        {settingsTab === "importa" && (
          <>
            <div style={{background:T.card,borderRadius:12,overflow:"hidden",border:`1px solid ${T.bdr}`,marginBottom:12}}>
              <div style={{padding:"16px",borderBottom:`1px solid ${T.bdr}`,background:PRILt}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <span style={{fontSize:24}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg></span>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:T.text}}>Importa Catalogo da Excel</div>
                    <div style={{fontSize:11,color:T.sub}}>Carica il template MASTRO compilato con i tuoi dati</div>
                  </div>
                </div>
              </div>
              <div style={{padding:"16px"}}>
                <div style={{fontSize:11,color:T.sub,lineHeight:1.5,marginBottom:14}}>
                  Scarica il template Excel, compilalo con i tuoi sistemi, colori, vetri, prezzi e tutto il catalogo. Poi caricalo qui per importare tutto automaticamente.
                </div>
                <div style={{display:"flex",gap:8,marginBottom:16}}>
                  <a href="/MASTRO_Catalogo_Template.xlsx" download style={{flex:1,padding:"12px",borderRadius:10,border:`1.5px solid ${PRI}`,background:PRILt,color:PRI,fontSize:12,fontWeight:700,textAlign:"center",textDecoration:"none",cursor:"pointer"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Scarica Template Excel
                  </a>
                </div>
                <div style={{position:"relative",marginBottom:12}}>
                  <input type="file" accept=".xlsx,.xls" onChange={e=>{const f=e.target.files?.[0]; if(f) importExcelCatalog(f);}} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",zIndex:2}} />
                  <div style={{padding:"20px",borderRadius:12,border:`2px dashed ${PRI}`,background:PRILt,textAlign:"center",cursor:"pointer"}}>
                    <div style={{fontSize:28,marginBottom:6}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg></div>
                    <div style={{fontSize:13,fontWeight:700,color:PRI}}>Carica file Excel compilato</div>
                    <div style={{fontSize:10,color:T.sub,marginTop:4}}>Trascina qui o tocca per selezionare (.xlsx)</div>
                  </div>
                </div>
                {importStatus && (
                  <div style={{background:importStatus.ok?"#f0fdf4":"#fefce8",borderRadius:10,padding:"12px 14px",border:`1.5px solid ${importStatus.ok?"#1A9E73":"#E8A020"}`,marginBottom:10}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                      <span style={{fontSize:16}}>{importStatus.ok?"":importStatus.step==="error"?"":""}</span>
                      <span style={{fontSize:12,fontWeight:700,color:importStatus.ok?"#1a9e40":importStatus.step==="error"?"#dc2626":"#7a4500"}}>{importStatus.msg}</span>
                    </div>
                    {importStatus.detail && <div style={{fontSize:10,color:"#666"}}>{importStatus.detail}</div>}
                  </div>
                )}
                {importLog.length > 0 && (
                  <div style={{background:T.card2,borderRadius:10,padding:"12px",border:`1px solid ${T.bdr}`,maxHeight:300,overflow:"auto"}}>
                    <div style={{fontSize:10,fontWeight:700,color:T.sub,marginBottom:6,textTransform:"uppercase"}}>Log importazione</div>
                    {importLog.map((l,i) => (
                      <div key={i} style={{fontSize:11,color:l.startsWith("")?"#1a9e40":l.startsWith("")?"#dc2626":l.startsWith("")?"#d97706":l.startsWith("")?"#7c3aed":T.text,fontFamily:FM,lineHeight:1.6,fontWeight:l.startsWith("")?800:400}}>
                        {l}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{background:T.card,borderRadius:12,overflow:"hidden",border:`1px solid ${T.bdr}`,padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                <span style={{fontSize:16}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>Servizio compilazione catalogo</div>
              </div>
              <div style={{fontSize:11,color:T.sub,lineHeight:1.6,marginBottom:10}}>
                Non hai tempo di compilare il template? Mandaci il tuo listino attuale (PDF, Excel, qualsiasi formato) e lo compiliamo noi per te.
              </div>
              <div style={{padding:"10px 14px",borderRadius:8,background:"#fff8ec",border:"1px solid #ffb800",fontSize:11,color:"#7a4500"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M4 10h12M4 14h12M6 6a8 8 0 100 12"/></svg> Servizio a pagamento — Contattaci: <strong>info@mastro.app</strong>
              </div>
            </div>
          </>
        )}

        
        {settingsTab === "kit" && <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}><div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>Kit Accessori</div>
            <div onClick={() => setKitAccessori(p => [...p, { id: Date.now(), nome: "Nuovo Kit", items: [], prezzo: 0 }])} style={{ padding: "6px 12px", borderRadius: 8, background: PRI, color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Kit</div></div>
          {kitAccessori.map((kit, ki) => <div key={kit.id} style={{ background: T.card, borderRadius: T.r, border: "1px solid " + T.bdr, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <input value={kit.nome} onChange={e => setKitAccessori(p => p.map((k,i) => i===ki ? {...k, nome: e.target.value} : k))} style={{ fontSize: 13, fontWeight: 700, color: T.text, background: "transparent", border: "none", outline: "none", flex: 1 }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: T.grn }}>€{kit.prezzo}</span>
            </div>
            {kit.items.map((item, ii) => <div key={ii} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
              <input value={item} onChange={e => { const ni=[...kit.items]; ni[ii]=e.target.value; setKitAccessori(p => p.map((k,i) => i===ki ? {...k, items: ni} : k)); }} style={{ flex: 1, fontSize: 11, color: T.text, background: T.bg, border: "1px solid " + T.bdr, borderRadius: 6, padding: "3px 6px" }} />
              <span onClick={() => setKitAccessori(p => p.map((k,i) => i===ki ? {...k, items: kit.items.filter((_,j)=>j!==ii)} : k))} style={{ color: T.red, cursor: "pointer", fontSize: 10 }}></span>
            </div>)}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <span onClick={() => setKitAccessori(p => p.map((k,i) => i===ki ? {...k, items: [...kit.items, "Nuovo"]} : k))} style={{ fontSize: 10, color: PRI, cursor: "pointer" }}>+ comp.</span>
              <input type="number" value={kit.prezzo} onChange={e => setKitAccessori(p => p.map((k,i) => i===ki ? {...k, prezzo: parseFloat(e.target.value)||0} : k))} style={{ width: 60, fontSize: 10, color: T.text, background: T.bg, border: "1px solid " + T.bdr, borderRadius: 6, padding: "2px 6px" }} />
            </div>
          </div>)}
        </div>}

        {settingsTab === "marketplace" && <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4"/></svg> Anagrafica Fornitori</div>
            <div onClick={() => { setFornitoreEdit({ id: "f_" + Date.now(), nome: "", ragioneSociale: "", piva: "", cf: "", tipo: "", categoria: "profili", indirizzo: "", cap: "", citta: "", provincia: "", telefono: "", cellulare: "", email: "", pec: "", sito: "", referente: "", telReferente: "", emailReferente: "", banca: "", iban: "", pagamento: "30gg_fm", scontoBase: 0, tempoConsegna: 14, sistemiTrattati: "", note: "", rating: 0, preferito: false, attivo: true }); setShowFornitoreForm(true); }}
              style={{ padding: "8px 16px", borderRadius: 8, background: PRI, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>+ Nuovo</div>
          </div>
          {/* Filtri categoria */}
          <div style={{ display: "flex", gap: 4, marginBottom: 10, overflowX: "auto", paddingBottom: 4 }}>
            {[{id:"tutti",l:"Tutti"},{id:"profili",l:"Profili"},{id:"vetri",l:"Vetri"},{id:"ferramenta",l:"Ferramenta"},{id:"accessori",l:" Accessori"},{id:"altro",l:"Altro"}].map(c => (
              <span key={c.id} onClick={() => setSettingsForm(f => ({...f, _filtroForn: c.id}))} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 9, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", background: (settingsForm._filtroForn || "tutti") === c.id ? PRILt : T.bg, color: (settingsForm._filtroForn || "tutti") === c.id ? PRI : T.sub, border: "1px solid " + ((settingsForm._filtroForn || "tutti") === c.id ? PRI + "40" : T.bdr) }}>{c.l}</span>
            ))}
          </div>
          {fornitori.filter(f => !settingsForm._filtroForn || settingsForm._filtroForn === "tutti" || f.categoria === settingsForm._filtroForn).map(f => (
            <div key={f.id} onClick={() => setShowFornitoreDetail(f)} style={{ background: T.card, borderRadius: T.r, border: "1px solid " + T.bdr, padding: 12, marginBottom: 8, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{f.preferito ? "⭐ " : ""}{f.nome}</div>
                  <div style={{ fontSize: 10, color: T.sub }}>{f.ragioneSociale || f.tipo}</div>
                  <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" as any }}>
                    <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: PRILt, color: PRI, fontWeight: 700 }}>{f.categoria || f.tipo}</span>
                    <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: T.orangeLt, color: T.orange, fontWeight: 700 }}>{f.tempoConsegna || "?"} gg</span>
                    <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: T.purpleLt, color: T.purple, fontWeight: 700 }}>{f.pagamento?.replace("_"," ") || "?"}</span>
                    {f.scontoBase > 0 && <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, background: T.grnLt, color: T.grn, fontWeight: 700 }}>-{f.scontoBase}%</span>}
                  </div>
                </div>
                {f.citta && <div style={{ fontSize: 10, color: T.sub, textAlign: "right" }}>{f.citta} ({f.provincia})</div>}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <div onClick={(e) => { e.stopPropagation(); window.open("tel:" + (f.telefono || f.cellulare)); }} style={{ flex: 1, padding: 6, borderRadius: 6, background: T.grnLt, color: T.grn, fontSize: 10, fontWeight: 700, textAlign: "center", cursor: "pointer" }}>Chiama</div>
                <div onClick={(e) => { e.stopPropagation(); window.open("mailto:" + f.email); }} style={{ flex: 1, padding: 6, borderRadius: 6, background: PRILt, color: PRI, fontSize: 10, fontWeight: 700, textAlign: "center", cursor: "pointer" }}> Email</div>
                {f.pec && <div onClick={(e) => { e.stopPropagation(); window.open("mailto:" + f.pec); }} style={{ flex: 1, padding: 6, borderRadius: 6, background: T.purpleLt, color: T.purple, fontSize: 10, fontWeight: 700, textAlign: "center", cursor: "pointer" }}>PEC</div>}
              </div>
            </div>
          ))}
          
          {/* FORNITORE DETAIL OVERLAY */}
          {showFornitoreDetail && (() => {
            const f = showFornitoreDetail;
            const ordiniF = (ordiniFornDB || []).filter(o => (o.fornitore?.nome || "").toLowerCase().includes(f.nome.toLowerCase()));
            const PAGAMENTI: Record<string,string> = { "anticipato": "Anticipato", "30gg_fm": "30 gg FM", "60gg_fm": "60 gg FM", "90gg_fm": "90 gg FM", "riba_30": "RiBa 30 gg", "riba_60": "RiBa 60 gg", "ricevuta_merce": "Alla consegna" };
            return <div style={{ position: "fixed", inset: 0, zIndex: 10003, background: T.bg, overflow: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: T.card, borderBottom: "1px solid " + T.bdr, position: "sticky", top: 0, zIndex: 5 }}>
                <div onClick={() => setShowFornitoreDetail(null)} style={{ cursor: "pointer", color: PRI, fontWeight: 700, fontSize: 14 }}>← Indietro</div>
                <div style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 800, color: T.text }}>{f.nome}</div>
                <div onClick={() => { setFornitoreEdit({...f}); setShowFornitoreForm(true); setShowFornitoreDetail(null); }} style={{ cursor: "pointer", color: PRI, fontWeight: 700, fontSize: 12 }}> Modifica</div>
              </div>
              <div style={{ padding: 16 }}>
                {/* DATI AZIENDA */}
                <div style={{ background: T.card, borderRadius: 12, border: "1px solid " + T.bdr, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4"/></svg> DATI AZIENDA</div>
                  {f.ragioneSociale && <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{f.ragioneSociale}</div>}
                  {f.piva && <div style={{ fontSize: 11, color: T.sub }}>P.IVA: <b>{f.piva}</b></div>}
                  {f.cf && <div style={{ fontSize: 11, color: T.sub }}>CF: {f.cf}</div>}
                  {f.indirizzo && <div style={{ fontSize: 11, color: T.sub, marginTop: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg> {f.indirizzo}, {f.cap} {f.citta} ({f.provincia})</div>}
                  {f.sito && <div onClick={() => window.open("https://" + f.sito.replace("https://","").replace("http://",""))} style={{ fontSize: 11, color: PRI, cursor: "pointer", marginTop: 2 }}>{f.sito}</div>}
                </div>
                {/* CONTATTI */}
                <div style={{ background: T.card, borderRadius: 12, border: "1px solid " + T.bdr, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> CONTATTI</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {f.telefono && <div onClick={() => window.open("tel:" + f.telefono)} style={{ padding: 10, borderRadius: 8, background: T.grnLt, textAlign: "center", cursor: "pointer" }}><div style={{ fontSize: 16 }}></div><div style={{ fontSize: 10, fontWeight: 700, color: T.grn }}>{f.telefono}</div><div style={{ fontSize: 8, color: T.sub }}>Ufficio</div></div>}
                    {f.cellulare && <div onClick={() => window.open("tel:" + f.cellulare)} style={{ padding: 10, borderRadius: 8, background: T.grnLt, textAlign: "center", cursor: "pointer" }}><div style={{ fontSize: 16 }}></div><div style={{ fontSize: 10, fontWeight: 700, color: T.grn }}>{f.cellulare}</div><div style={{ fontSize: 8, color: T.sub }}>Cellulare</div></div>}
                    {f.email && <div onClick={() => window.open("mailto:" + f.email)} style={{ padding: 10, borderRadius: 8, background: PRILt, textAlign: "center", cursor: "pointer" }}><div style={{ fontSize: 16 }}></div><div style={{ fontSize: 10, fontWeight: 700, color: PRI, wordBreak: "break-all" }}>{f.email}</div></div>}
                    {f.pec && <div onClick={() => window.open("mailto:" + f.pec)} style={{ padding: 10, borderRadius: 8, background: T.purpleLt, textAlign: "center", cursor: "pointer" }}><div style={{ fontSize: 16 }}></div><div style={{ fontSize: 10, fontWeight: 700, color: T.purple, wordBreak: "break-all" }}>{f.pec}</div><div style={{ fontSize: 8, color: T.sub }}>PEC</div></div>}
                  </div>
                  {f.referente && <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: T.bg }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Referente: {f.referente}</div>
                    {f.telReferente && <div style={{ fontSize: 10, color: T.sub }}>{f.telReferente}</div>}
                    {f.emailReferente && <div style={{ fontSize: 10, color: PRI }}>{f.emailReferente}</div>}
                  </div>}
                </div>
                {/* CONDIZIONI COMMERCIALI */}
                <div style={{ background: T.card, borderRadius: 12, border: "1px solid " + T.bdr, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M4 10h12M4 14h12M6 6a8 8 0 100 12"/></svg> CONDIZIONI COMMERCIALI</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div style={{ padding: 10, borderRadius: 8, background: T.orangeLt, textAlign: "center" }}><div style={{ fontSize: 8, fontWeight: 700, color: T.sub }}>PAGAMENTO</div><div style={{ fontSize: 12, fontWeight: 900, color: T.orange }}>{PAGAMENTI[f.pagamento] || f.pagamento}</div></div>
                    <div style={{ padding: 10, borderRadius: 8, background: T.grnLt, textAlign: "center" }}><div style={{ fontSize: 8, fontWeight: 700, color: T.sub }}>SCONTO BASE</div><div style={{ fontSize: 12, fontWeight: 900, color: T.grn }}>{f.scontoBase}%</div></div>
                    <div style={{ padding: 10, borderRadius: 8, background: PRILt, textAlign: "center" }}><div style={{ fontSize: 8, fontWeight: 700, color: T.sub }}>TEMPI CONSEGNA</div><div style={{ fontSize: 12, fontWeight: 900, color: PRI }}>{f.tempoConsegna} gg</div></div>
                    {f.rating > 0 && <div style={{ padding: 10, borderRadius: 8, background: T.bg, textAlign: "center" }}><div style={{ fontSize: 8, fontWeight: 700, color: T.sub }}>RATING</div><div style={{ fontSize: 12, fontWeight: 900, color: T.text }}>⭐ {f.rating}</div></div>}
                  </div>
                  {f.banca && <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: T.bg }}><div style={{ fontSize: 10, color: T.sub }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4"/></svg> {f.banca}</div>{f.iban && <div style={{ fontSize: 10, color: T.text, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5 }}>{f.iban}</div>}</div>}
                </div>
                {/* ── LISTINO SCONTI PER CATEGORIA ── */}
                <div style={{ background: T.card, borderRadius: 12, border: "1px solid " + T.bdr, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.sub }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{display:"inline-block",verticalAlign:"middle",marginRight:4}}><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>
                      LISTINO SCONTI
                    </div>
                    <div onClick={() => {
                      const newCat = { id: "c_"+Date.now(), nome: "", sconto: 0, note: "" };
                      setFornitori(p => p.map(ff => ff.id === f.id
                        ? {...ff, listinoCategorie: [...(ff.listinoCategorie||[]), newCat]}
                        : ff));
                      setShowFornitoreDetail(prev => ({...prev, listinoCategorie: [...(prev.listinoCategorie||[]), newCat]}));
                    }} style={{ padding: "4px 10px", borderRadius: 6, background: "#1A9E7318", color: "#1A9E73", fontSize: 10, fontWeight: 700, cursor: "pointer", border: "1px solid #1A9E7340" }}>
                      + Categoria
                    </div>
                  </div>
                  {(!f.listinoCategorie || f.listinoCategorie.length === 0) ? (
                    <div style={{ textAlign: "center", padding: "12px 0", fontSize: 11, color: T.sub }}>
                      Nessuna categoria — aggiungi le categorie con i relativi sconti
                    </div>
                  ) : (
                    <div>
                      {/* Header tabella */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 28px", gap: 6, marginBottom: 4, padding: "0 2px" }}>
                        <div style={{ fontSize: 8, fontWeight: 700, color: T.sub, textTransform: "uppercase" }}>Categoria prodotto</div>
                        <div style={{ fontSize: 8, fontWeight: 700, color: T.sub, textTransform: "uppercase", textAlign: "center" }}>Sconto %</div>
                        <div/>
                      </div>
                      {(f.listinoCategorie || []).map((cat: any, ci: number) => (
                        <div key={cat.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 28px", gap: 6, marginBottom: 6, alignItems: "center" }}>
                          <input
                            value={cat.nome}
                            placeholder="es. Controtelai termici"
                            onChange={e => {
                              const updated = (f.listinoCategorie||[]).map((c:any,i:number) => i===ci ? {...c, nome: e.target.value} : c);
                              setFornitori(p => p.map(ff => ff.id === f.id ? {...ff, listinoCategorie: updated} : ff));
                              setShowFornitoreDetail(prev => ({...prev, listinoCategorie: updated}));
                            }}
                            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid "+T.bdr, fontSize: 11, background: T.bg, color: T.text, outline: "none" }}/>
                          <div style={{ position: "relative" }}>
                            <input
                              type="number" min="0" max="100" step="0.5"
                              value={cat.sconto || ""}
                              placeholder="0"
                              onChange={e => {
                                const updated = (f.listinoCategorie||[]).map((c:any,i:number) => i===ci ? {...c, sconto: parseFloat(e.target.value)||0} : c);
                                setFornitori(p => p.map(ff => ff.id === f.id ? {...ff, listinoCategorie: updated} : ff));
                                setShowFornitoreDetail(prev => ({...prev, listinoCategorie: updated}));
                              }}
                              style={{ width: "100%", padding: "8px 20px 8px 10px", borderRadius: 8,
                                border: cat.sconto > 0 ? "1.5px solid #1A9E7360" : "1px solid "+T.bdr,
                                fontSize: 13, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace",
                                background: cat.sconto > 0 ? "#1A9E7308" : T.bg,
                                color: cat.sconto > 0 ? "#1A9E73" : T.text,
                                textAlign: "center", outline: "none", boxSizing: "border-box" }}/>
                            <span style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: T.sub, pointerEvents: "none" }}>%</span>
                          </div>
                          <div onClick={() => {
                            const updated = (f.listinoCategorie||[]).filter((_:any,i:number) => i!==ci);
                            setFornitori(p => p.map(ff => ff.id === f.id ? {...ff, listinoCategorie: updated} : ff));
                            setShowFornitoreDetail(prev => ({...prev, listinoCategorie: updated}));
                          }} style={{ width: 28, height: 28, borderRadius: 6, background: "#DC444415", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC4444" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          </div>
                        </div>
                      ))}
                      {/* Note listino */}
                      <input
                        value={f.listinoNote || ""}
                        placeholder="Note listino (es. AR32 = alluminio rinforzato, SOMFY 50% = motori)"
                        onChange={e => {
                          setFornitori(p => p.map(ff => ff.id === f.id ? {...ff, listinoNote: e.target.value} : ff));
                          setShowFornitoreDetail(prev => ({...prev, listinoNote: e.target.value}));
                        }}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid "+T.bdr,
                          fontSize: 10, background: T.bg, color: T.sub, marginTop: 4, outline: "none", boxSizing: "border-box" }}/>
                    </div>
                  )}
                </div>

                {/* PRODOTTI */}
                {f.sistemiTrattati && <div style={{ background: T.card, borderRadius: 12, border: "1px solid " + T.bdr, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 6 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> SISTEMI/PRODOTTI</div>
                  <div style={{ fontSize: 12, color: T.text, lineHeight: 1.6 }}>{f.sistemiTrattati}</div>
                </div>}
                {/* STORICO ORDINI */}
                <div style={{ background: T.card, borderRadius: 12, border: "1px solid " + T.bdr, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg> STORICO ORDINI ({ordiniF.length})</div>
                  {ordiniF.length === 0 ? <div style={{ fontSize: 11, color: T.sub, textAlign: "center", padding: 12 }}>Nessun ordine</div> :
                    ordiniF.slice(0, 5).map(o => <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid " + T.bdr + "30" }}>
                      <div style={{ fontSize: 11, color: T.text }}>{o.cmCode || "—"}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>€{(o.totale || 0).toLocaleString("it-IT")}</div>
                    </div>)
                  }
                </div>
                {f.note && <div style={{ background: T.card, borderRadius: 12, border: "1px solid " + T.bdr, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.sub, marginBottom: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> NOTE</div>
                  <div style={{ fontSize: 12, color: T.text }}>{f.note}</div>
                </div>}
                <div style={{ display: "flex", gap: 8 }}>
                  <div onClick={() => setFornitori(p => p.map(ff => ff.id === f.id ? {...ff, preferito: !ff.preferito} : ff))} style={{ flex: 1, padding: 12, borderRadius: 10, background: f.preferito ? T.orangeLt : T.bg, border: "1px solid " + (f.preferito ? T.orange : T.bdr), color: f.preferito ? T.orange : T.sub, fontSize: 12, fontWeight: 700, textAlign: "center", cursor: "pointer" }}>{f.preferito ? "Preferito" : "Preferito"}</div>
                  <div onClick={() => { if(confirm("Eliminare " + f.nome + "?")) { setFornitori(p => p.filter(ff => ff.id !== f.id)); setShowFornitoreDetail(null); }}} style={{ padding: "12px 16px", borderRadius: 10, background: T.redLt, color: T.red, fontSize: 12, fontWeight: 700, cursor: "pointer" }}></div>
                </div>
              </div>
            </div>;
          })()}
          
          {/* FORNITORE FORM OVERLAY */}
          {showFornitoreForm && fornitoreEdit && (() => {
            const PAGAMENTI_OPT = [
              { id: "anticipato", l: "Anticipato" }, { id: "30gg_fm", l: "30 gg FM" }, { id: "60gg_fm", l: "60 gg FM" },
              { id: "90gg_fm", l: "90 gg FM" }, { id: "riba_30", l: "RiBa 30 gg" }, { id: "riba_60", l: "RiBa 60 gg" }, { id: "ricevuta_merce", l: "Alla consegna" }
            ];
            const CATEGORIE = [
              { id: "profili", l: "Profili" }, { id: "vetri", l: "Vetri" }, { id: "ferramenta", l: "Ferramenta" },
              { id: "accessori", l: " Accessori" }, { id: "guarnizioni", l: "Guarnizioni" }, { id: "altro", l: "Altro" }
            ];
            const upd = (k: string, v: any) => setFornitoreEdit((p: any) => ({...p, [k]: v}));
            const fldStyle = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid " + T.bdr, background: T.bg, color: T.text, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" as const };
            const lblStyle = { fontSize: 9, fontWeight: 700, color: T.sub, marginBottom: 2, textTransform: "uppercase" as const };
            return <div style={{ position: "fixed", inset: 0, zIndex: 10004, background: T.bg, overflow: "auto" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: T.card, borderBottom: "1px solid " + T.bdr, position: "sticky", top: 0, zIndex: 5 }}>
                <div onClick={() => { setShowFornitoreForm(false); setFornitoreEdit(null); }} style={{ cursor: "pointer", color: T.red, fontWeight: 700, fontSize: 13 }}>Annulla</div>
                <div style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 800, color: T.text }}>{fornitori.find(f => f.id === fornitoreEdit.id) ? "Modifica" : "Nuovo"} Fornitore</div>
                <div onClick={() => {
                  const existing = fornitori.find(f => f.id === fornitoreEdit.id);
                  if (existing) setFornitori(p => p.map(f => f.id === fornitoreEdit.id ? fornitoreEdit : f));
                  else setFornitori(p => [...p, fornitoreEdit]);
                  setShowFornitoreForm(false); setFornitoreEdit(null);
                }} style={{ cursor: "pointer", color: PRI, fontWeight: 800, fontSize: 13 }}>Salva</div>
              </div>
              <div style={{ padding: 16 }}>
                {/* SEZIONE AZIENDA */}
                <div style={{ fontSize: 11, fontWeight: 800, color: PRI, marginBottom: 8, marginTop: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4"/></svg> DATI AZIENDA</div>
                <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                  <div><div style={lblStyle}>Nome (breve)</div><input style={fldStyle} value={fornitoreEdit.nome} onChange={e => upd("nome", e.target.value)} placeholder="es. Aluplast" /></div>
                  <div><div style={lblStyle}>Ragione Sociale</div><input style={fldStyle} value={fornitoreEdit.ragioneSociale} onChange={e => upd("ragioneSociale", e.target.value)} placeholder="es. Aluplast Italia SRL" /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div style={lblStyle}>P.IVA</div><input style={fldStyle} value={fornitoreEdit.piva} onChange={e => upd("piva", e.target.value)} placeholder="01234567890" /></div>
                    <div><div style={lblStyle}>Codice Fiscale</div><input style={fldStyle} value={fornitoreEdit.cf} onChange={e => upd("cf", e.target.value)} /></div>
                  </div>
                  <div><div style={lblStyle}>Indirizzo</div><input style={fldStyle} value={fornitoreEdit.indirizzo} onChange={e => upd("indirizzo", e.target.value)} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 60px", gap: 8 }}>
                    <div><div style={lblStyle}>CAP</div><input style={fldStyle} value={fornitoreEdit.cap} onChange={e => upd("cap", e.target.value)} /></div>
                    <div><div style={lblStyle}>Città</div><input style={fldStyle} value={fornitoreEdit.citta} onChange={e => upd("citta", e.target.value)} /></div>
                    <div><div style={lblStyle}>Prov.</div><input style={fldStyle} value={fornitoreEdit.provincia} onChange={e => upd("provincia", e.target.value)} maxLength={2} /></div>
                  </div>
                  <div><div style={lblStyle}>Sito Web</div><input style={fldStyle} value={fornitoreEdit.sito} onChange={e => upd("sito", e.target.value)} placeholder="www.fornitore.it" /></div>
                  <div><div style={lblStyle}>Categoria</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as any }}>
                      {CATEGORIE.map(c => <span key={c.id} onClick={() => upd("categoria", c.id)} style={{ padding: "6px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", background: fornitoreEdit.categoria === c.id ? PRILt : T.bg, color: fornitoreEdit.categoria === c.id ? PRI : T.sub, border: "1px solid " + (fornitoreEdit.categoria === c.id ? PRI + "40" : T.bdr) }}>{c.l}</span>)}
                    </div>
                  </div>
                </div>
                {/* SEZIONE CONTATTI */}
                <div style={{ fontSize: 11, fontWeight: 800, color: PRI, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> CONTATTI</div>
                <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div style={lblStyle}>Telefono</div><input style={fldStyle} value={fornitoreEdit.telefono} onChange={e => upd("telefono", e.target.value)} type="tel" /></div>
                    <div><div style={lblStyle}>Cellulare</div><input style={fldStyle} value={fornitoreEdit.cellulare} onChange={e => upd("cellulare", e.target.value)} type="tel" /></div>
                  </div>
                  <div><div style={lblStyle}>Email</div><input style={fldStyle} value={fornitoreEdit.email} onChange={e => upd("email", e.target.value)} type="email" /></div>
                  <div><div style={lblStyle}>PEC</div><input style={fldStyle} value={fornitoreEdit.pec} onChange={e => upd("pec", e.target.value)} type="email" placeholder="fornitore@pec.it" /></div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: T.sub, marginTop: 4 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> REFERENTE COMMERCIALE</div>
                  <div><div style={lblStyle}>Nome Referente</div><input style={fldStyle} value={fornitoreEdit.referente} onChange={e => upd("referente", e.target.value)} /></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div style={lblStyle}>Tel. Referente</div><input style={fldStyle} value={fornitoreEdit.telReferente} onChange={e => upd("telReferente", e.target.value)} type="tel" /></div>
                    <div><div style={lblStyle}>Email Referente</div><input style={fldStyle} value={fornitoreEdit.emailReferente} onChange={e => upd("emailReferente", e.target.value)} type="email" /></div>
                  </div>
                </div>
                {/* SEZIONE COMMERCIALE */}
                <div style={{ fontSize: 11, fontWeight: 800, color: PRI, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M4 10h12M4 14h12M6 6a8 8 0 100 12"/></svg> CONDIZIONI COMMERCIALI</div>
                <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                  <div><div style={lblStyle}>Modalità Pagamento</div>
                    <select value={fornitoreEdit.pagamento} onChange={e => upd("pagamento", e.target.value)} style={{...fldStyle}}>
                      {PAGAMENTI_OPT.map(p => <option key={p.id} value={p.id}>{p.l}</option>)}
                    </select>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div><div style={lblStyle}>Sconto Base %</div><input style={fldStyle} type="number" value={fornitoreEdit.scontoBase} onChange={e => upd("scontoBase", parseFloat(e.target.value) || 0)} /></div>
                    <div><div style={lblStyle}>Tempi Consegna (gg)</div><input style={fldStyle} type="number" value={fornitoreEdit.tempoConsegna} onChange={e => upd("tempoConsegna", parseInt(e.target.value) || 0)} /></div>
                  </div>
                  <div><div style={lblStyle}>Banca</div><input style={fldStyle} value={fornitoreEdit.banca} onChange={e => upd("banca", e.target.value)} /></div>
                  <div><div style={lblStyle}>IBAN</div><input style={fldStyle} value={fornitoreEdit.iban} onChange={e => upd("iban", e.target.value)} placeholder="IT..." /></div>
                </div>
                {/* SEZIONE PRODOTTI */}
                <div style={{ fontSize: 11, fontWeight: 800, color: PRI, marginBottom: 8 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg> PRODOTTI E NOTE</div>
                <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
                  <div><div style={lblStyle}>Sistemi/Prodotti Trattati</div><textarea style={{...fldStyle, minHeight: 60, resize: "vertical" as any}} value={fornitoreEdit.sistemiTrattati} onChange={e => upd("sistemiTrattati", e.target.value)} placeholder="es. Ideal 4000, Ideal 7000..." /></div>
                  <div><div style={lblStyle}>Note</div><textarea style={{...fldStyle, minHeight: 60, resize: "vertical" as any}} value={fornitoreEdit.note} onChange={e => upd("note", e.target.value)} /></div>
                </div>
              </div>
            </div>;
          })()}
        </div>}

        {settingsTab === "temi" && <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Temi</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {Object.entries(THEMES).map(([k, v]: [string, any]) => (
              <div key={k} onClick={() => setTheme(k)} style={{ background: v.card, borderRadius: T.r, border: "2px solid " + (theme === k ? v.acc : v.bdr), padding: 12, cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{v.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: v.text }}>{v.name}</div>
                {theme === k && <div style={{ fontSize: 9, color: v.acc, fontWeight: 700, marginTop: 2 }}>ATTIVO</div>}
              </div>
            ))}
          </div>
        </div>}


        {settingsTab === "guida" && (
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {/* Header */}
            <div style={{background:PRI,borderRadius:12,padding:"16px 18px",color:"#fff"}}>
              <div style={{fontSize:15,fontWeight:800}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> Guida rapida MASTRO</div>
              <div style={{fontSize:11,opacity:0.8,marginTop:4}}>Tutto quello che ti serve sapere, in pillole da 30 secondi.</div>
            </div>

            {/* CARD 1: CREARE COMMESSA */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:PRI15,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come creare una commessa</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Commesse</b> dal menu in basso</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca il pulsante <b>+ Nuova Commessa</b> in alto</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Compila <b>nome cliente, indirizzo</b> e tipo di lavoro</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#1A9E73",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}></div>
                  <div style={{fontSize:12,color:"#1A9E73",fontWeight:700,lineHeight:1.5}}>La commessa parte in fase "Sopralluogo"</div>
                </div>
              </div>
            </div>

            {/* CARD 2: AGGIUNGERE VANI */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#E8A02015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come aggiungere i vani</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa e vai nella sezione <b>Rilievi</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>+ Aggiungi vano</b> — scegli tipo (F1A, PF2A, SC2A...)</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Dai un nome al vano (es. "Cucina", "Salone") e scegli la stanza</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:4,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>Tipologie rapide:</b> F1A = 1 anta, F2A = 2 ante, PF = portafinestra, SC = scorrevole, VAS = vasistas, TDBR = tenda bracci, TDPERG = pergola</div>
              </div>
            </div>

            {/* CARD 3: INSERIRE MISURE */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#8B5CF615",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come inserire le misure</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca un vano per aprirlo — vai nel tab <b>Misure</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Inserisci <b>3 larghezze</b> (alto, centro, basso) e <b>3 altezze</b> (sx, centro, dx)</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Completa <b>spallette</b>, <b>davanzale</b>, telaio e accessori</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:4,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>Regola d'oro:</b> misura sempre dal CENTRO del vano — è il punto più affidabile per il taglio</div>
              </div>
            </div>

            {/* CARD 4: GENERARE PREVENTIVO */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#1A9E7315",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come generare un preventivo PDF</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa con almeno un vano misurato</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca il pulsante <b>€ Preventivo</b> nella barra azioni</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Controlla il riepilogo — fai <b>firmare il cliente</b> sul telefono</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>4</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>Genera & Scarica PDF</b> — pronto per inviare via WhatsApp!</div>
                </div>
              </div>
            </div>

            {/* CARD 5: FASI COMMESSA */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#af52de15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Le 8 fasi di una commessa</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                {[
                  {f:"Sopralluogo",i:"",d:"Vai dal cliente, valuta il lavoro",c:PRI},
                  {f:"Preventivo",i:"",d:"Prepara e invia l'offerta",c:"#E8A020"},
                  {f:"Conferma",i:"",d:"Il cliente accetta e firma",c:"#af52de"},
                  {f:"Misure",i:"",d:"Rilievo preciso di ogni vano",c:"#8B5CF6"},
                  {f:"Ordini",i:"",d:"Ordina profili, vetri e accessori",c:"#EF4444"},
                  {f:"Produzione",i:"",d:"Attendi che il materiale sia pronto",c:"#E8A020"},
                  {f:"Posa",i:"",d:"Installa tutto dal cliente",c:"#1A9E73"},
                  {f:"Chiusura",i:"",d:"Saldo finale e garanzia",c:"#30b0c7"},
                ].map((p,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:i<7?6:0}}>
                    <div style={{fontSize:14,width:22,textAlign:"center"}}>{p.i}</div>
                    <div style={{fontSize:12,fontWeight:700,color:p.c,width:85}}>{p.f}</div>
                    <div style={{fontSize:11,color:T.sub}}>{p.d}</div>
                    {i<7 && <div style={{marginLeft:"auto",fontSize:10,color:T.sub}}>→</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 6: SCORCIATOIE */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#EF444415",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Trucchi da Pro</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                {[
                  {t:"Barra di ricerca",d:"Cerca qualsiasi cosa: clienti, commesse, indirizzi — tutto da Home"},
                  {t:"Allerte rosse",d:"Le commesse ferme da troppo tempo appaiono in Home — toccale per aprirle"},
                  {t:"Drag & drop fasi",d:"In Commesse, tieni premuto su una card per spostarla tra le fasi"},
                  {t:"Foto e firma",d:"Puoi fotografare il vano e far firmare il cliente direttamente sul telefono"},
                  {t:"SVG in tempo reale",d:"Mentre inserisci le misure, il disegno del vano si aggiorna live"},
                ].map((tip,i) => (
                  <div key={i} style={{display:"flex",gap:8,marginBottom:i<4?8:0,alignItems:"flex-start"}}>
                    <div style={{fontSize:10,color:PRI,fontWeight:900,marginTop:2}}>▸</div>
                    <div><span style={{fontSize:12,fontWeight:700,color:T.text}}>{tip.t}: </span><span style={{fontSize:11,color:T.sub}}>{tip.d}</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* CARD 7: CONTROTELAIO PSU */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#2563eb15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come configurare il controtelaio</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri un vano — scorri fino alla sezione <b><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><rect x="3" y="3" width="18" height="18" rx="2"/></svg> Controtelaio</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scegli il tipo: <b>Singolo</b>, <b>Doppio</b> o <b>Con Cassonetto</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Inserisci <b>larghezza e altezza vano</b> — il calcolo infisso parte in automatico</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#1A9E73",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}></div>
                  <div style={{fontSize:12,color:"#1A9E73",fontWeight:700,lineHeight:1.5}}>L'infisso viene calcolato togliendo l'offset (default 10mm/lato)</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>Cassonetto:</b> compila anche H e P cassonetto + modello cielino (A tampone, A tappo, Frontale)</div>
              </div>
            </div>

            {/* CARD 8: FOTO VIDEO AUDIO */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#EF444415",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Foto, video e note vocali</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Dentro un rilievo, tocca il pulsante <b><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg> Allegati</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scegli: <b>Foto</b> (scatta dalla fotocamera), <b>Video</b> o <b>Nota vocale</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Gli allegati vengono salvati e associati al vano — rivedili quando vuoi</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>AI Photo:</b> tocca il bottone AI nel vano per analizzare la foto con intelligenza artificiale</div>
              </div>
            </div>

            {/* CARD 9: FUORISQUADRO */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#E8A02015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Fuorisquadro e diagonali</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Nelle misure del vano, inserisci <b>H1</b> (sinistra) e <b>H2</b> (destra) se diverse</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Inserisci le <b>diagonali D1 e D2</b> — il sistema calcola la differenza</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#DC4444",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>!</div>
                  <div style={{fontSize:12,color:"#DC4444",fontWeight:700,lineHeight:1.5}}>Se fuorisquadro: warning rosso + disegno SVG con forma reale</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>Nel riepilogo WhatsApp</b> il fuorisquadro viene segnalato con  per avvisare la produzione</div>
              </div>
            </div>

            {/* CARD 10: IMPORT EXCEL */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#1A9E7315",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Importare il catalogo da Excel</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 1 minuto</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Impostazioni → Importa</b> e scarica il <b>Template Excel</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri il file Excel — ogni <b>foglio</b> corrisponde a una categoria del catalogo</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Compila le colonne come indicato sotto — <b>una riga per ogni prodotto</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:10}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>4</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Torna in <b>Importa</b>, carica il file — il catalogo viene sostituito automaticamente</div>
                </div>

                {/* Tabella fogli */}
                <div style={{fontSize:11,fontWeight:800,color:PRI,marginBottom:6,marginTop:4}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg> COLONNE PER OGNI FOGLIO:</div>
                {[
                  {foglio:"SISTEMI", colonne:"Marca | Nome Sistema | Uf (W/m²K)", es:"Aluplast | Ideal 4000 | 1.1"},
                  {foglio:"COLORI", colonne:"Nome | RAL/Codice | Tipo", es:"Grigio Antracite | 7016 | RAL"},
                  {foglio:"VETRI", colonne:"Descrizione | Composizione | Ug (W/m²K) | Prezzo €/mq", es:"Basso emissivo | 4/20/4 | 1.0 | 35"},
                  {foglio:"COPRIFILI", colonne:"Descrizione | Codice | Prezzo €/ml", es:"Coprifilo 70mm | CF70 | 4.50"},
                  {foglio:"LAMIERE", colonne:"Descrizione | Codice | Prezzo €/ml", es:"Lamiera 25/10 | LM25 | 8.20"},
                ].map((f,i) => (
                  <div key={i} style={{marginBottom:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8,border:"1px solid "+(T.bdr||"#E5E3DE")}}>
                    <div style={{fontSize:11,fontWeight:800,color:T.blue||"#2563eb",marginBottom:3}}>{""+f.foglio}</div>
                    <div style={{fontSize:10,color:T.text,fontFamily:FM,marginBottom:2}}>{f.colonne}</div>
                    <div style={{fontSize:9,color:T.sub,fontStyle:"italic"}}>{"Es: "+f.es}</div>
                  </div>
                ))}
                <div style={{fontSize:10,color:T.sub,marginTop:4,padding:"8px 10px",background:"#fff8ec",borderRadius:8,border:"1px solid #ffcc0040"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>️ <b>Attenzione:</b> l'importazione <b>sostituisce</b> il catalogo esistente — fai un backup prima se hai gia inserito dati a mano.
                </div>
                <div style={{fontSize:10,color:T.sub,marginTop:6,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> <b>Fogli extra supportati:</b> ACCESSORI, TIPOLOGIE, CONTROTELAI, TAPPARELLE, ZANZARIERE, PERSIANE, SERVIZI, SAGOME_TELAIO, PROFILI — saranno attivati nei prossimi aggiornamenti.
                </div>
                <div style={{fontSize:10,color:T.sub,marginTop:6,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> <b>Non hai tempo?</b> Mandaci il tuo listino in qualsiasi formato (PDF, foto, Excel vecchio) a <b>info@mastro.app</b> e lo compiliamo noi per te.
                </div>
              </div>
            </div>

            {/* CARD 11: CONDIZIONI PREVENTIVO */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#af52de15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Personalizzare le condizioni del preventivo</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Impostazioni → Azienda</b> e scorri in basso</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Trovi 5 sezioni: <b>Fornitura, Pagamento, Consegna, Contratto, Dettagli tecnici</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scrivi il tuo testo — appare nel PDF. Se lasci vuoto, usa il testo standard</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>PEC:</b> compila anche il campo PEC — apparira nell'intestazione del preventivo</div>
              </div>
            </div>

            {/* CARD 12: AGENDA */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:PRI15,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come usare l'agenda</div><div style={{fontSize:10,color:T.sub}}>20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Agenda</b> dal menu — scegli vista <b>Mese, Settimana o Giorno</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>+ Nuovo evento</b> — scegli tipo (Sopralluogo, Misure, Posa, Consegna...)</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Collega l'evento a una <b>commessa</b> — appare anche nella Home del giorno</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>10 tipi evento</b> con icone e colori diversi — i pallini colorati nel mese ti danno il colpo d'occhio</div>
              </div>
            </div>

            {/* CARD 13: AI INBOX */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#8B5CF615",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>AI Inbox — email intelligenti</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Messaggi → AI Inbox</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>L'AI classifica ogni email: <b>priorita, sentimento, commessa suggerita</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Azioni rapide: <b>Archivia</b>, <b>Collega a commessa</b> o <b>Rispondi</b> con un tap</div>
                </div>
              </div>
            </div>

            {/* CARD 14: RIEPILOGO WHATSAPP */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#25d36618",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Riepilogo per WhatsApp</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa con vani — tocca <b><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg> Riepilogo</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vedi il riepilogo formattato con tutti i vani, misure, colori, accessori</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>Copia</b> — incolla direttamente in WhatsApp per la produzione</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>Fuorisquadro incluso:</b> se un vano e fuorisquadro, il riepilogo lo segnala con  e le misure reali</div>
              </div>
            </div>

            {/* CARD 15: PIPELINE PERSONALIZZABILE */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#E8A02015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Personalizzare la pipeline</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Impostazioni → Pipeline</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Attiva/disattiva le fasi che ti servono con gli <b>switch</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#1A9E73",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}></div>
                  <div style={{fontSize:12,color:"#1A9E73",fontWeight:700,lineHeight:1.5}}>La fase Chiusura e sempre attiva — non si puo disabilitare</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>Esempio:</b> non fai produzione interna? Disattiva "Produzione" e le commesse saltano direttamente a "Posa"</div>
              </div>
            </div>

            {/* CARD 16: FIRMA CLIENTE */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#8B5CF615",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Far firmare il cliente sul telefono</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri il <b>Preventivo</b> di una commessa</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>️ Firma cliente</b> — appare un'area bianca per firmare col dito</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Il cliente firma col dito sullo schermo — tocca <b>Conferma</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#1A9E73",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}></div>
                  <div style={{fontSize:12,color:"#1A9E73",fontWeight:700,lineHeight:1.5}}>La firma viene salvata e inserita nel PDF del preventivo</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>Puoi cancellare</b> e far rifirmare — tocca "Cancella" per resettare l'area firma</div>
              </div>
            </div>

            {/* CARD 17: SISTEMA RILIEVI */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#E8A02015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Come funzionano i rilievi</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa — tocca <b>+ Nuovo rilievo</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Compila <b>data, rilevatore</b> (dal team), note e condizioni</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Dentro ogni rilievo aggiungi i <b>vani</b> con misure e foto</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:4,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>Piu rilievi per commessa:</b> puoi fare un primo sopralluogo esplorativo e poi un secondo con le misure definitive. Il tab <b>Report</b> confronta le differenze tra rilievi</div>
              </div>
            </div>

            {/* CARD 18: CHAT AI */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#af52de15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Chiedi a MASTRO AI</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Messaggi</b> — trovi la chat AI in basso</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scrivi domande naturali: <b>"cosa ho in programma oggi?"</b>, <b>"quante commesse ho?"</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>MASTRO AI risponde con dati reali dalle tue commesse, task e misure</div>
                </div>
              </div>
            </div>

            {/* CARD 19: INVIO EMAIL */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:PRI15,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Inviare email dalla commessa</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Dentro una commessa, tocca <b><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 7L2 7"/></svg> Invia email</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scegli il <b>destinatario</b> (cliente o fornitore), scrivi <b>oggetto e messaggio</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>L'email viene inviata e collegata alla commessa nel <b>log attivita</b></div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>Template pronti:</b> conferma appuntamento, promemoria, preventivo pronto — personalizzabili</div>
              </div>
            </div>

            {/* CARD 20: RUBRICA */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#1A9E7315",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Rubrica contatti</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Messaggi → Rubrica</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Filtra per tipo: <b>Tutti, Preferiti, Team, Clienti, Fornitori</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Ogni contatto mostra: nome, ruolo, canali disponibili (WhatsApp, email, SMS)</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>I membri del team</b> appaiono automaticamente nella rubrica con il loro ruolo e colore</div>
              </div>
            </div>

            {/* CARD 21: TEAM */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#EF444415",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Gestione Team</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Impostazioni → Team</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b>+ Aggiungi membro</b> — inserisci nome, ruolo e colore</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>I membri appaiono nei rilievi, negli eventi e nella rubrica automaticamente</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>Assegnazione automatica:</b> quando una commessa avanza di fase, il responsabile viene assegnato in base al ruolo configurato</div>
              </div>
            </div>

            {/* CARD 22: WIDGET DRAG & DROP */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:PRI15,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Personalizzare la Home</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 15 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Nella Home, tocca <b><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>️ Layout</b> in alto a destra</div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}><b>Trascina</b> i widget per riordinarli — metti in alto quelli che usi di piu</div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Tocca <b><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polyline points="20 6 9 17 4 12"/></svg> Fine</b> per salvare — l'ordine viene ricordato</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>7 widget disponibili:</b> Contatori, IO (briefing), Attenzione, Programma oggi, Settimana, Commesse, Azioni rapide</div>
              </div>
            </div>

            {/* CARD 23: DATI AZIENDALI */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#E8A02015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Compilare i dati aziendali</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 30 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Vai in <b>Impostazioni → Azienda</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Compila: <b>Ragione sociale, P.IVA, CF, Indirizzo, Telefono, Email, PEC, CCIAA</b></div>
                </div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:22,height:22,borderRadius:6,background:"#1A9E73",color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}></div>
                  <div style={{fontSize:12,color:"#1A9E73",fontWeight:700,lineHeight:1.5}}>Questi dati appaiono nell'intestazione di ogni preventivo PDF</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:8,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>Compila tutto subito:</b> cosi ogni preventivo che generi ha gia tutti i dati corretti senza doverli inserire ogni volta</div>
              </div>
            </div>

            {/* CARD 24: MODULO PROBLEMI */}
            <div style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),overflow:"hidden"}}>
              <div style={{padding:"12px 16px",borderBottom:"1px solid "+(T.bdr||"#E5E3DE"),display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:28,height:28,borderRadius:8,background:"#FF3B3015",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}></div>
                <div><div style={{fontSize:13,fontWeight:800,color:T.text}}>Segnalare un problema</div><div style={{fontSize:10,color:T.sub}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> 20 secondi</div></div>
              </div>
              <div style={{padding:"12px 16px"}}>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>1</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Apri una commessa — tocca <b><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Segnala problema</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>2</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Scegli <b>tipo</b> (Materiale, Misure, Installazione...) e <b>priorità</b></div>
                </div>
                <div style={{display:"flex",gap:12,marginBottom:8}}>
                  <div style={{width:22,height:22,borderRadius:6,background:PRI,color:"#fff",fontSize:11,fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>3</div>
                  <div style={{fontSize:12,color:T.text,lineHeight:1.5}}>Descrivi il problema e <b>assegna</b> a un membro del team</div>
                </div>
                <div style={{fontSize:11,color:T.sub,marginTop:4,padding:"8px 10px",background:T.bg||"#f8f8f5",borderRadius:8}}><b>3 stati:</b> Aperto → In corso → Risolto. I problemi aperti appaiono nel widget <b>Attenzione</b> in Home</div>
              </div>
            </div>

            {/* RIVEDI TUTORIAL */}
            <div onClick={() => { try{localStorage.removeItem("mastro:onboarded")}catch(e){} setTutoStep(1); }} style={{background:"#fff",borderRadius:12,border:"1px solid "+(T.bdr||"#E5E3DE"),padding:"14px 16px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}}>
              <div style={{fontSize:18}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>Rivedi il tutorial iniziale</div>
                <div style={{fontSize:11,color:T.sub}}>Riavvia la guida di benvenuto</div>
              </div>
              <div style={{marginLeft:"auto",fontSize:14,color:T.sub}}>→</div>
            </div>

            <div style={{height:20}}/>
          </div>
        )}

        {/* === <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg> RESET DEMO === */}
        <div style={{ margin: "20px 0", padding: 16, background: "#DC444408", borderRadius: 12, border: "1px solid #DC444425" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#DC4444", textTransform: "uppercase", marginBottom: 6 }}>Zona Reset</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 10 }}>Ricarica i 4 clienti demo con tutti i dati precompilati per testare il flusso completo.</div>
          <button onClick={() => {
            if (!confirm("Vuoi ricaricare i dati demo? I dati attuali verranno sostituiti.")) return;
            ["cantieri","tasks","events","fatture","ordiniForn","montaggi","contatti","pipeline","azienda","team","settori","piano","colori","sistemi","vetri","coprifili","lamiere","libreria","squadre"].forEach(k => {
              try { localStorage.removeItem("mastro:" + k); } catch(e) {}
            });
            localStorage.removeItem("mastro:demoVer");
            localStorage.removeItem("mastro:cleanSlate");
            window.location.reload();
          }} style={{
            width: "100%", padding: 12, borderRadius: 10, border: "2px solid #DC4444",
            background: "#fff", color: "#DC4444", fontSize: 13, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit",
          }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg> RICARICA DATI DEMO (4 clienti)</button>

          <button onClick={() => {
            if (!confirm(" ATTENZIONE: Cancellare TUTTI i dati demo e partire da zero?\n\nCommesse, contatti, fatture, eventi, task — tutto verrà cancellato.\n\nI dati reali che hai inserito saranno persi.")) return;
            // Clear all data
            setCantieri([]);
            setFattureDB([]);
            setOrdiniFornDB([]);
            setMontaggiDB([]);
            setMsgs([]);
            setContatti([]);
            setEvents([]);
            setTasks([]);
            setAiInbox([]);
            setPipelineDB([]);
            setProblemi([]);
            // Save empty to localStorage + set cleanSlate flag
            ["cantieri","tasks","events","fatture","ordiniForn","montaggi","contatti","pipeline","msgs","problemi","fatturePassive","fornitori"].forEach(k => {
              try { localStorage.setItem("mastro:" + k, "[]"); } catch(e) {}
            });
            localStorage.setItem("mastro:cleanSlate", "true");
            localStorage.setItem("mastro:demoVer", "v50-gmail-email");
            alert("Dati puliti! MASTRO è pronto per i tuoi dati reali.");
            window.location.reload();
          }} style={{
            width: "100%", padding: 12, borderRadius: 10, border: "2px solid #1A9E73",
            background: "#fff", color: "#1A9E73", fontSize: 13, fontWeight: 800,
            cursor: "pointer", fontFamily: "inherit", marginTop: 8,
          }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> PULISCI TUTTO — Parti da zero</button>
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PORTE — Materiali */}
        {/* ═══════════════════════════════════════════════════════ */}
        {settingsTab === "porte_mat" && <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Materiali Porte</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura i materiali disponibili per le porte interne e blindate.</div>
          {(ctx.porteMatDB || ["Legno massello","Laccato opaco","Laccato lucido","Laminato CPL","Laminato HPL","Vetro temperato","Blindata","Metallica REI","Light","EI tagliafuoco"]).map((m: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: T.card, borderRadius: 10, border: `1px solid ${T.bdr}`, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M18 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg></span>
              <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: T.text }}>{m}</span>
              <span style={{ fontSize: 9, color: T.grn || PRI, fontWeight: 700, background: (T.grn||PRI) + "15", padding: "2px 8px", borderRadius: 6 }}>Attivo</span>
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Finiture porta</div>
            {["Liscio","Pantografato","Inciso","Con vetro","Bugnato","Dogato H","Dogato V"].map((f: string, i: number) => (
              <div key={i} style={{ display: "inline-block", padding: "5px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{f}</div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Colori/Essenze</div>
            {["Bianco laccato","Bianco matrix","Grigio 7035","Grigio 7016","Noce nazionale","Noce canaletto","Rovere sbiancato","Rovere naturale","Rovere grigio","Wengé","Olmo","Frassino","RAL custom"].map((c: string, i: number) => (
              <div key={i} style={{ display: "inline-block", padding: "5px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{c}</div>
            ))}
          </div>
        </div>}

        {/* PORTE — Cerniere */}
        {settingsTab === "porte_cern" && <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Cerniere e Ferramenta</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Gestisci tipi di cerniere, quantità e finiture disponibili.</div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Tipi cerniera</div>
          {["A scomparsa regolabile","A vista 3D","A molla (chiusura auto)","A bilico (pivot)","Per porta blindata","Per porta REI","Anuba (legno)","A libro"].map((c: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}`, marginBottom: 3 }}>
              <span style={{ fontSize: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg></span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text }}>{c}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Finiture cerniere</div>
          {["Cromo satinato","Cromo lucido","Nero opaco","Bronzo","Ottone","Bianco","Inox","Coordinata porta"].map((f: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{f}</div>
          ))}
        </div>}

        {/* PORTE — Serrature */}
        {settingsTab === "porte_serr" && <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Serrature</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura tipi serratura, cilindri e chiudiporta.</div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Tipi serratura (CISA)</div>
          {["Da infilare standard","Da infilare 4 mandate","Da applicare","Multipunto","Elettrica","Smart","Antipanico"].map((s: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}`, marginBottom: 3 }}>
              <span style={{ fontSize: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text }}>{s}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Cilindri</div>
          {["Europeo","Alta sicurezza","Per pomolo","Doppia mappa","Elettronico"].map((c: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{c}</div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Chiudiporta</div>
          {["Nessuno","A braccio","A slitta","A pavimento","Elettromagnetico"].map((c: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{c}</div>
          ))}
        </div>}

        {/* PORTE — Maniglie */}
        {settingsTab === "porte_man" && <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Maniglieria (HOPPE)</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Gestisci tipi, serie e finiture maniglie.</div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Tipo maniglia</div>
          {["Su rosetta","Su placca","Maniglione","Scorrevole incasso","Tagliafuoco"].map((m: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}`, marginBottom: 3 }}>
              <span style={{ fontSize: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text }}>{m}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Serie HOPPE</div>
          {["Paris","Tokyo","Amsterdam","Atlanta","Milano","Dallas","Singapore","London","Amsterdam-E","Sertos","Liège","Vitoria","Trondheim","Toulon","Dallas SecuSan","Singapore inox"].map((s: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{s}</div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Finiture maniglie</div>
          {["Cromo satinato F69","Cromo lucido F1","Nero opaco F9714M","Bronzo F4","Ottone F3","Inox F69SS","Bianco RAL 9016","Rame F49","Titanio F9"].map((f: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{f}</div>
          ))}
        </div>}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TENDE DA SOLE — Tessuti */}
        {/* ═══════════════════════════════════════════════════════ */}
        {settingsTab === "tende_tess" && <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Tessuti Tende da Sole</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura i tipi di tessuto e i colori/pattern disponibili.</div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Tipi tessuto</div>
          {["Acrilico tinto massa","Poliestere spalmato","PVC microforato","Soltis 92 (screen)","Soltis 86 (blackout)","Dickson Orchestra","Tempotest Parà"].map((t: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}`, marginBottom: 3 }}>
              <span style={{ fontSize: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg></span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text }}>{t}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Colori/Pattern</div>
          {["Bianco","Avorio","Beige","Grigio chiaro","Grigio scuro","Tortora","Sabbia","Bordeaux","Blu navy","Verde bosco","Arancione","Rosso","Rigato classico","Rigato moderno","Fantasia","Da campionario"].map((c: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{c}</div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Cassonetti tenda</div>
          {["Nessuno (aperto)","Semicassonetto","Cassonetto integrale","Cassonetto a scomparsa"].map((c: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{c}</div>
          ))}
        </div>}

        {/* TENDE DA SOLE — Motori */}
        {settingsTab === "tende_mot" && <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Motorizzazioni Tende</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura tipi di comando, sensori e accessori.</div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Tipo comando</div>
          {["Arganello manuale","Manovella (asta)","Motore tubolare Ø45","Motore tubolare Ø60","Motore radio Somfy","Motore radio Nice","Motore WiFi/App","Motore solare"].map((m: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}`, marginBottom: 3 }}>
              <span style={{ fontSize: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text }}>{m}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Sensori</div>
          {["Nessuno","Sensore vento","Sensore sole","Sensore vento+sole","Sensore vento+sole+pioggia","Stazione meteo completa"].map((s: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{s}</div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Accessori</div>
          {["Telecomando mono","Telecomando multi","Timer programmabile","Centralina domotica","Led integrato barra","Led integrato cassonetto","Volant frontale","Volant con guide"].map((a: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{a}</div>
          ))}
        </div>}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* BOX DOCCIA — Vetri */}
        {/* ═══════════════════════════════════════════════════════ */}
        {settingsTab === "bd_vetri" && <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Vetri Box Doccia</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura tipi vetro, finiture e trattamenti anticalcare.</div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Tipo vetro</div>
          {["Temperato 6mm","Temperato 8mm","Stratificato 6+6","Temperato extra-chiaro 6mm","Temperato extra-chiaro 8mm"].map((v: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}`, marginBottom: 3 }}>
              <span style={{ fontSize: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M12 3v18"/><rect x="2" y="3" width="20" height="18" rx="2"/></svg></span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text }}>{v}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Finiture vetro</div>
          {["Trasparente","Satinato integrale","Satinato fascia centrale","Serigrafato","Fumé","Specchiato","Decorato"].map((f: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{f}</div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Trattamenti</div>
          {["Nessuno","Anticalcare standard","Anticalcare permanente (ClearShield)","Easy-clean nanotecnologico"].map((t: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{t}</div>
          ))}
        </div>}

        {/* BOX DOCCIA — Profili */}
        {settingsTab === "bd_profili" && <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Profili Box Doccia</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura materiali profilo e finiture.</div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Materiale profili</div>
          {["Alluminio","Acciaio inox","Ottone","Frameless (senza profili)"].map((m: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}`, marginBottom: 3 }}>
              <span style={{ fontSize: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg></span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text }}>{m}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Finiture profilo</div>
          {["Cromo lucido","Cromo satinato","Nero opaco","Nero satinato","Oro spazzolato","Bronzo","Rame","Bianco","Gunmetal"].map((f: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{f}</div>
          ))}
        </div>}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* CANCELLI — Materiali */}
        {/* ═══════════════════════════════════════════════════════ */}
        {settingsTab === "canc_mat" && <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Materiali Cancelli e Recinzioni</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura materiali, tamponamenti e finiture.</div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Materiali</div>
          {["Ferro zincato verniciato","Alluminio","Acciaio inox 304","Acciaio inox 316","COR-TEN","Ferro battuto","WPC composito","Legno trattato"].map((m: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}`, marginBottom: 3 }}>
              <span style={{ fontSize: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4"/></svg>️</span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text }}>{m}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Tamponamenti</div>
          {["Doghe orizzontali","Doghe verticali","Lamelle orientabili","Pannello cieco","Grigliato","Rete elettrosaldata","Tubolare verticale","Tubolare orizzontale","Misto","Vetro"].map((t: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{t}</div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Colori RAL</div>
          {["Nero RAL 9005","Antracite RAL 7016","Grigio RAL 7035","Bianco RAL 9010","Marrone RAL 8017","Verde RAL 6005","Corten effect","Effetto legno","RAL custom"].map((c: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{c}</div>
          ))}
        </div>}

        {/* CANCELLI — Automazioni */}
        {settingsTab === "canc_auto" && <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 12 }}>Automazioni Cancelli</div>
          <div style={{ fontSize: 11, color: T.sub, marginBottom: 12 }}>Configura tipi motore, accessori automazione e sensori.</div>
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, fontWeight: 700, textTransform: "uppercase" }}>Tipo automazione</div>
          {["Manuale","Predisposizione cavidotto","Motore interrato 230V","Motore interrato 24V","Motore a cremagliera","Motore a catena","Motore solare","Motore a batteria"].map((a: string, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: T.card, borderRadius: 8, border: `1px solid ${T.bdr}`, marginBottom: 3 }}>
              <span style={{ fontSize: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: T.text }}>{a}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Accessori automazione</div>
          {["Telecomando 2ch","Telecomando 4ch","Tastierino numerico","Lettore badge","Fotocellule coppia","Lampeggiante","Antenna esterna","Costa sensibile","Selettore chiave","Modulo WiFi/App","Batteria tampone"].map((a: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{a}</div>
          ))}
          <div style={{ fontSize: 10, color: T.sub, marginBottom: 6, marginTop: 12, fontWeight: 700, textTransform: "uppercase" }}>Pilastri</div>
          {["Esistenti","Nuovi muratura","Nuovi acciaio","Nuovi prefabbricati","Rivestimento su esistenti"].map((p: string, i: number) => (
            <div key={i} style={{ display: "inline-block", padding: "4px 10px", margin: "0 4px 4px 0", borderRadius: 8, border: `1px solid ${T.bdr}`, background: T.card, fontSize: 10, fontWeight: 600, color: T.text }}>{p}</div>
          ))}
        </div>}

        {/* ═══ STRUTTURE — Configuratore ═══ */}
        {settingsTab === "strutture" && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>Configuratore Strutture</div>
            <div style={{ fontSize: 11, color: T.sub, marginBottom: 16, lineHeight: 1.5 }}>Progetta pergole, verande, pensiline, box e cancelli con pianta, profili, 3D e disegno tecnico.</div>

            {/* Card principale — apri configuratore */}
            <div onClick={() => setShowStrutture(true)} style={{
              padding: 24, borderRadius: 14, cursor: "pointer",
              background: T.card, border: `2px solid ${T.pri || "#0D7C6B"}`,
              textAlign: "center", marginBottom: 16,
              boxShadow: "0 2px 12px rgba(13,124,107,0.12)",
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle"}}><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M2 22h20"/><path d="M10 6h4M10 10h4M10 14h4"/></svg>️</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.text }}>Apri Configuratore</div>
              <div style={{ fontSize: 12, color: T.sub, marginTop: 6, lineHeight: 1.5 }}>
                Pianta → Profili → Lati → 3D → Disegno Tecnico
              </div>
              <div style={{
                marginTop: 16, padding: "10px 24px", borderRadius: 8,
                background: T.pri || "#0D7C6B", color: "#fff",
                fontSize: 13, fontWeight: 700, display: "inline-block",
              }}>
                Avvia →
              </div>
            </div>

            {/* Tipologie disponibili */}
            <div style={{ fontSize: 10, fontWeight: 700, color: T.sub, textTransform: "uppercase", marginBottom: 8, letterSpacing: "0.04em" }}>7 tipologie configurabili</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { n: "Pergola Bioclimatica", d: "Lamelle orientabili" },
                { n: "Veranda", d: "Chiusura vetrata" },
                { n: "Pensilina", d: "A sbalzo, fissata a muro" },
                { n: "Struttura Ferro", d: "Carpenteria su misura" },
                { n: "Box Alluminio", d: "Ripostiglio esterno" },
                { n: "Box Doccia", d: "Cabina su misura" },
                { n: "Cancello", d: "Ingresso carraio/pedonale" },
              ].map((t, i) => (
                <div key={i} style={{
                  padding: "10px 12px", borderRadius: 8,
                  background: T.card, border: `1px solid ${T.bdr}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text }}>{t.n}</div>
                  <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>{t.d}</div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div style={{ marginTop: 16, padding: 14, borderRadius: 10, background: T.bg, border: `1px solid ${T.bdr}`, fontSize: 10, color: T.sub, lineHeight: 1.7 }}>
              <b style={{ color: T.text }}>Funzionalità:</b><br />
              • 26 profili strutturali (tubolari, IPE, UPN, angolari, piatti)<br />
              • Pensilina a muro con 4 tipi braccio/staffa<br />
              • Elementi inseribili su ogni lato (vetrate, porte, finestre)<br />
              • Pendenza tetto 0-30% con direzione configurabile<br />
              • Gronde, pluviali, toggle montanti/travi<br />
              • Vista 3D interattiva + Disegno tecnico stampabile<br />
              • Etichette testuali su ogni fase
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
