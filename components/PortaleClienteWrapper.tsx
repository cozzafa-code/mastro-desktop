"use client";
// @ts-nocheck
// MASTRO — PortaleClienteWrapper.tsx
// Wrapper per PortaleCliente: fetcha dati da API pubblica, gestisce loading/error

import { useState, useEffect } from "react";
import { FF } from "./mastro-constants";

const TEAL="#1A9E73", DARK="#1A1A1C";

interface Props { token: string }

export default function PortaleClienteWrapper({ token }: Props) {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/portale/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div style={{ display:"flex", flexDirection:"column" as any, alignItems:"center", justifyContent:"center", height:"100vh", gap:12, fontFamily:FF }}>
      <div style={{ width:40, height:40, borderRadius:10, background:DARK, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:900, color:"#fff" }}>M</div>
      <div style={{ fontSize:14, color:"#6B7280" }}>Caricamento...</div>
    </div>
  );

  if (error) return (
    <div style={{ display:"flex", flexDirection:"column" as any, alignItems:"center", justifyContent:"center", height:"100vh", gap:12, fontFamily:FF, padding:20, textAlign:"center" as any }}>
      <div style={{ fontSize:32 }}>🔗</div>
      <div style={{ fontSize:18, fontWeight:600, color:DARK }}>Link non valido</div>
      <div style={{ fontSize:14, color:"#6B7280" }}>{error}</div>
      <div style={{ fontSize:12, color:"#9CA3AF" }}>Contatta direttamente la tua azienda di riferimento.</div>
    </div>
  );

  if (!data) return null;

  // Passa i dati reali a PortaleCliente
  const PortaleCliente = require("./PortaleCliente").default;
  return <PortaleCliente datiReali={data} />;
}
