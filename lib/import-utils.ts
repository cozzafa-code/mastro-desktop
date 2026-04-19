// ═══════════════════════════════════════════════════════════
// MASTRO ERP — lib/import-utils.ts
// Excel catalog import
// ═══════════════════════════════════════════════════════════

interface ImportDeps {
  setSistemiDB: (v: any) => void;
  setVetriDB: (v: any) => void;
  setCoprifiliDB: (v: any) => void;
  setLamiereDB: (v: any) => void;
  setColoriDB: (v: any) => void;
  setImportStatus: (v: any) => void;
  setImportLog: (v: any) => void;
}

export async function importExcelCatalog(file: any, deps: ImportDeps) {
  const { setSistemiDB, setVetriDB, setCoprifiliDB, setLamiereDB, setColoriDB, setImportStatus, setImportLog } = deps;
    setImportStatus({ step: "loading", msg: "Caricamento file...", ok: false });
    setImportLog([]);
    const log = [];
    try {
      const XLSX = require("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      log.push("✅ File letto: " + wb.SheetNames.length + " fogli trovati");
      setImportLog([...log]);

      const parseSheet = (name, requiredCols) => {
        const ws = wb.Sheets[name];
        if (!ws) { log.push("⚠️ Foglio '" + name + "' non trovato — saltato"); return []; }
        const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
        // Skip hint/example rows (first rows might be hints or green examples)
        const rows = raw.filter(r => {
          const vals = Object.values(r).map(v => String(v).trim()).filter(Boolean);
          return vals.length >= 2; // at least 2 non-empty values
        });
        log.push("📋 " + name + ": " + rows.length + " righe");
        return rows;
      };

      // SISTEMI
      setImportStatus({ step: "sistemi", msg: "Importazione sistemi...", ok: false });
      const sistRows = parseSheet("SISTEMI");
      if (sistRows.length > 0) {
        const newSist = sistRows.map((r, i) => ({
          id: 10000 + i,
          marca: r["Nome Sistema"] ? String(r["Marca"] || "").trim() : String(r["Marca"] || r["marca"] || "").trim(),
          sistema: String(r["Nome Sistema"] || r["sistema"] || "").trim(),
          euroMq: parseFloat(r["Uf (W/m²K)"] || 0) || 0, // Will be set from TIPOLOGIE prices
          prezzoMq: 0,
          sovRAL: 15,
          sovLegno: 25,
          colori: [],
          sottosistemi: []
        })).filter(s => s.marca && s.sistema);
        if (newSist.length > 0) { setSistemiDB(newSist); log.push("✅ " + newSist.length + " sistemi importati (catalogo sostituito)"); }
      }
      setImportLog([...log]);

      // COLORI
      setImportStatus({ step: "colori", msg: "Importazione colori...", ok: false });
      const colRows = parseSheet("COLORI");
      if (colRows.length > 0) {
        const newCol = colRows.map((r, i) => ({
          id: 20000 + i,
          nome: String(r["Nome"] || r["nome"] || "").trim(),
          code: String(r["RAL/Codice"] || r["Codice"] || r["code"] || "").trim() || String(r["Nome"] || "").trim(),
          hex: "#888888",
          tipo: String(r["Tipo"] || r["tipo"] || "RAL").trim()
        })).filter(c => c.nome);
        if (newCol.length > 0) { setColoriDB(newCol); log.push("✅ " + newCol.length + " colori importati (catalogo sostituito)"); }
      }
      setImportLog([...log]);

      // VETRI
      setImportStatus({ step: "vetri", msg: "Importazione vetri...", ok: false });
      const vetRows = parseSheet("VETRI");
      if (vetRows.length > 0) {
        const newVet = vetRows.map((r, i) => ({
          id: 30000 + i,
          nome: String(r["Descrizione"] || r["nome"] || "").trim(),
          code: String(r["Composizione"] || r["Codice"] || r["code"] || "").trim(),
          ug: parseFloat(r["Ug (W/m²K)"] || r["ug"] || 0) || 0,
          prezzoMq: parseFloat(r["Prezzo €/mq"] || r["prezzoMq"] || 0) || 0,
        })).filter(v => v.nome || v.code);
        if (newVet.length > 0) { setVetriDB(newVet); log.push("✅ " + newVet.length + " vetri importati (catalogo sostituito)"); }
      }
      setImportLog([...log]);

      // COPRIFILI
      setImportStatus({ step: "coprifili", msg: "Importazione coprifili...", ok: false });
      const copRows = parseSheet("COPRIFILI");
      if (copRows.length > 0) {
        const newCop = copRows.map((r, i) => ({
          id: 40000 + i,
          nome: String(r["Descrizione"] || r["nome"] || "").trim(),
          cod: String(r["Codice"] || r["cod"] || "").trim(),
          prezzoMl: parseFloat(r["Prezzo €/ml"] || r["prezzoMl"] || 0) || 0,
        })).filter(c => c.nome || c.cod);
        if (newCop.length > 0) { setCoprifiliDB(newCop); log.push("✅ " + newCop.length + " coprifili importati (catalogo sostituito)"); }
      }
      setImportLog([...log]);

      // LAMIERE
      setImportStatus({ step: "lamiere", msg: "Importazione lamiere...", ok: false });
      const lamRows = parseSheet("LAMIERE");
      if (lamRows.length > 0) {
        const newLam = lamRows.map((r, i) => ({
          id: 50000 + i,
          nome: String(r["Descrizione"] || r["nome"] || "").trim(),
          cod: String(r["Codice"] || r["cod"] || "").trim(),
          prezzoMl: parseFloat(r["Prezzo €/ml"] || r["prezzoMl"] || 0) || 0,
        })).filter(l => l.nome || l.cod);
        if (newLam.length > 0) { setLamiereDB(newLam); log.push("✅ " + newLam.length + " lamiere importate (catalogo sostituito)"); }
      }
      setImportLog([...log]);

      // ACCESSORI, TIPOLOGIE, CONTROTELAI, TAPPARELLE, ZANZARIERE, PERSIANE, SERVIZI, SAGOME
      const otherSheets = ["ACCESSORI", "TIPOLOGIE", "CONTROTELAI", "TAPPARELLE", "ZANZARIERE", "PERSIANE", "SERVIZI", "SAGOME_TELAIO", "PROFILI"];
      for (const sn of otherSheets) {
        const rows = parseSheet(sn);
        if (rows.length > 0) log.push("📦 " + sn + ": " + rows.length + " righe pronte (saranno usate nei prossimi aggiornamenti)");
      }
      setImportLog([...log]);

      log.push("");
      log.push("✨ IMPORTAZIONE COMPLETATA!");
      log.push("I dati sono stati aggiunti al tuo catalogo.");
      log.push("Vai nelle singole sezioni per verificare.");
      setImportLog([...log]);
      setImportStatus({ step: "done", msg: "Importazione completata!", ok: true });
    } catch (err) {
      log.push("❌ ERRORE: " + err.message);
      setImportLog([...log]);
      setImportStatus({ step: "error", msg: "Errore durante l'importazione", ok: false, detail: err.message });
    }
}
