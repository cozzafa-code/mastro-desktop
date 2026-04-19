"use client";
// @ts-nocheck
import React, { useState } from "react";
import ConfiguratoreCad from "./ConfiguratoreCad";
import { useMastro } from "./MastroContext";

export default function ConfiguratoreCommessa({ commessa, onClose }) {
  const { setCantieri } = useMastro();
  const [vani, setVani] = useState(
    commessa.vani || [{ id: Date.now(), nome: "Vano 1", misure: { lCentro: 1500, hCentro: 2100 }, disegno: {} }]
  );
  const [selIdx, setSelIdx] = useState(0);
  const vano = vani[selIdx];

  const onCadUpdate = (d) => {
    setVani(prev => prev.map((v, i) => i === selIdx ? { ...v, disegno: d } : v));
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", flexDirection: "column" }}>
      {/* TOPBAR */}
      <div style={{ height: 48, background: "#000", display: "flex", alignItems: "center", padding: "0 16px", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ color: "#D08008", fontWeight: 900, fontSize: 13, letterSpacing: 1 }}>MASTRO CAD v2.0</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {vani.map((v, i) => (
            <button key={v.id} onClick={() => setSelIdx(i)} style={{
              padding: "4px 12px", border: "none", borderRadius: 6, cursor: "pointer",
              fontSize: 12, fontWeight: 700,
              background: i === selIdx ? "#D08008" : "#333", color: "#fff"
            }}>{v.nome || `Vano ${i+1}`}</button>
          ))}
          <button onClick={() => {
            const n = { id: Date.now(), nome: `Vano ${vani.length + 1}`, misure: { lCentro: 1200, hCentro: 2100 }, disegno: {} };
            setVani(p => [...p, n]); setSelIdx(vani.length);
          }} style={{ padding: "4px 10px", border: "1px solid #555", borderRadius: 6, cursor: "pointer", fontSize: 12, background: "none", color: "#aaa" }}>+ Vano</button>
          <button onClick={() => {
            setCantieri(p => p.map(c => c.id === commessa.id ? { ...c, vani } : c));
          }} style={{ padding: "4px 14px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700, background: "#1A9E73", color: "#fff" }}>Salva</button>
          <button onClick={onClose} style={{ color: "#fff", background: "none", border: "none", fontSize: 20, cursor: "pointer", marginLeft: 4 }}>✕</button>
        </div>
      </div>

      {/* CAD */}
      <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        <ConfiguratoreCad
          key={vano.id}
          realW={vano.misure?.lCentro || 1500}
          realH={vano.misure?.hCentro || 2100}
          vanoNome={vano.nome}
          onUpdate={onCadUpdate}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
