// components/AiTecnicoChat.tsx
// MASTRO AI — Chat tecnica verticale serramenti
// Si aggancia a /api/ai-tecnico che legge dal DB Supabase

"use client";
import React, { useState, useRef, useEffect } from "react";

interface Messaggio {
  id: number;
  ruolo: "utente" | "ai";
  testo: string;
  fonti?: string | null;
  loading?: boolean;
}

const DOMANDE_RAPIDE = [
  "Qual è l'Uf dell'IDEAL 4000?",
  "Che differenza c'è tra IDEAL 8000 e ENERGETO 8000?",
  "A che temperatura si saldano i profili PVC?",
  "Quanti fori di scarico servono su 1800mm?",
  "Il Blackout Nero è detraibile al 50%?",
  "Qual è il peso massimo di un'anta?",
];

export default function AiTecnicoChat({ contestoCommessa }: { contestoCommessa?: string }) {
  const [messaggi, setMessaggi] = useState<Messaggio[]>([
    {
      id: 0,
      ruolo: "ai",
      testo: "Ciao! Sono MASTRO AI, il tuo assistente tecnico per serramenti. Posso risponderti su profili Aluplast, normative UNI, lavorazioni CNC, parametri saldatura e molto altro — con dati reali dai certificati. Cosa ti serve?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messaggi]);

  const invia = async (domanda: string) => {
    if (!domanda.trim() || loading) return;
    const testo = domanda.trim();
    setInput("");
    setLoading(true);

    // Aggiunge messaggio utente
    const idUtente = Date.now();
    const idAi = idUtente + 1;
    setMessaggi(prev => [
      ...prev,
      { id: idUtente, ruolo: "utente", testo },
      { id: idAi, ruolo: "ai", testo: "", loading: true },
    ]);

    try {
      const res = await fetch("/api/ai-tecnico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domanda: testo, contestoCommessa }),
      });
      const data = await res.json();

      setMessaggi(prev => prev.map(m =>
        m.id === idAi
          ? { ...m, testo: data.risposta || data.error || "Errore nella risposta", fonti: data.fonti, loading: false }
          : m
      ));
    } catch {
      setMessaggi(prev => prev.map(m =>
        m.id === idAi
          ? { ...m, testo: "Errore di connessione. Riprova.", loading: false }
          : m
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", minHeight: 400 }}>

      {/* Header */}
      <div style={{ padding: "10px 16px", background: "linear-gradient(135deg, #1A1A1C, #2A2008)", borderRadius: 12, margin: "0 16px 10px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "#D0800820", border: "1px solid #D0800840", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔧</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>MASTRO AI Tecnico</div>
          <div style={{ fontSize: 10, color: "#888" }}>Database certificati reali · Aluplast · UNI · CAM</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 9, padding: "3px 8px", borderRadius: 6, background: "#1A9E7320", color: "#1A9E73", fontWeight: 700, border: "1px solid #1A9E7340" }}>
          ● LIVE
        </div>
      </div>

      {/* Lista messaggi */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>

        {/* Domande rapide — solo all'inizio */}
        {messaggi.length === 1 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Domande frequenti</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {DOMANDE_RAPIDE.map((d, i) => (
                <div key={i} onClick={() => invia(d)} style={{ padding: "6px 10px", borderRadius: 8, background: "#F2F1EC", border: "1px solid #E5E3DC", fontSize: 11, fontWeight: 600, color: "#1A1A1C", cursor: "pointer" }}>
                  {d}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messaggi */}
        {messaggi.map(m => (
          <div key={m.id} style={{ marginBottom: 12, display: "flex", flexDirection: "column", alignItems: m.ruolo === "utente" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%",
              padding: "10px 13px",
              borderRadius: m.ruolo === "utente" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              background: m.ruolo === "utente" ? "#D08008" : "#fff",
              color: m.ruolo === "utente" ? "#fff" : "#1A1A1C",
              fontSize: 13,
              lineHeight: 1.5,
              border: m.ruolo === "ai" ? "1px solid #E5E3DC" : "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            }}>
              {m.loading ? (
                <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "2px 0" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#D08008", animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              ) : (
                <div style={{ whiteSpace: "pre-wrap" }}>{m.testo}</div>
              )}
            </div>
            {m.fonti && m.ruolo === "ai" && (
              <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 3, paddingLeft: 4 }}>
                📊 {m.fonti}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #E5E3DC" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); invia(input); } }}
            placeholder="Chiedi qualcosa... (es. Uf IDEAL 5000, temperatura saldatura, normativa vetro)"
            rows={1}
            style={{
              flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #E5E3DC",
              background: "#F2F1EC", fontSize: 13, color: "#1A1A1C", fontFamily: "inherit",
              resize: "none", outline: "none", lineHeight: 1.4,
            }}
          />
          <button
            onClick={() => invia(input)}
            disabled={!input.trim() || loading}
            style={{
              width: 40, height: 40, borderRadius: 10, border: "none",
              background: input.trim() && !loading ? "#D08008" : "#E5E3DC",
              color: "#fff", fontSize: 18, cursor: input.trim() && !loading ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            ↑
          </button>
        </div>
        <div style={{ fontSize: 9, color: "#9CA3AF", marginTop: 4, textAlign: "center" }}>
          Dati da certificati reali · Database aggiornato manualmente
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
