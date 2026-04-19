"use client";
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — ErrorBoundary
// Cattura QUALSIASI errore JS e mostra recovery UI
// L'app non mostrerà MAI uno schermo bianco
// ═══════════════════════════════════════════════════════════
import React from "react";

interface Props {
  children: React.ReactNode;
  fallbackTab?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
  recovered: boolean;
}

export class MastroErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: "", recovered: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log per debug (in futuro → Sentry)
    console.error("[MASTRO ERROR]", error, errorInfo);
    
    this.setState({
      errorInfo: errorInfo.componentStack || "",
    });

    // Salva errore in localStorage per diagnostica
    try {
      const errors = JSON.parse(localStorage.getItem("mastro:errors") || "[]");
      errors.push({
        message: error.message,
        stack: error.stack?.slice(0, 500),
        component: errorInfo.componentStack?.slice(0, 300),
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
      // Keep last 20 errors
      if (errors.length > 20) errors.splice(0, errors.length - 20);
      localStorage.setItem("mastro:errors", JSON.stringify(errors));
    } catch {}
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    // Reset state e torna alla home
    this.setState({ hasError: false, error: null, errorInfo: "", recovered: true });
  };

  handleExportData = () => {
    // Esporta tutti i dati da localStorage come safety net
    try {
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("mastro:")) {
          try { data[key] = JSON.parse(localStorage.getItem(key) || ""); } 
          catch { data[key] = localStorage.getItem(key); }
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mastro-backup-emergenza-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Impossibile esportare. I tuoi dati sono al sicuro in localStorage.");
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F2F1EC",
          padding: 24,
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: 32,
            maxWidth: 440,
            width: "100%",
            boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}>
            {/* Icon */}
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
            
            {/* Title */}
            <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1A1A1C", marginBottom: 8 }}>
              Qualcosa è andato storto
            </h2>
            
            {/* Subtitle */}
            <p style={{ fontSize: 14, color: "#86868b", marginBottom: 24, lineHeight: 1.5 }}>
              Non preoccuparti — i tuoi dati sono al sicuro.
              <br />Prova a ricaricare la pagina.
            </p>

            {/* Primary action */}
            <button
              onClick={this.handleReload}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                border: "none",
                background: "#007aff",
                color: "#fff",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
                marginBottom: 10,
              }}
            >
              🔄 Ricarica pagina
            </button>

            {/* Secondary action */}
            <button
              onClick={this.handleGoHome}
              style={{
                width: "100%",
                padding: 14,
                borderRadius: 12,
                border: "1px solid #e5e5ea",
                background: "#fff",
                color: "#1A1A1C",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                marginBottom: 10,
              }}
            >
              🏠 Torna alla Home
            </button>

            {/* Emergency export */}
            <button
              onClick={this.handleExportData}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 12,
                border: "none",
                background: "transparent",
                color: "#34c759",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              💾 Scarica backup emergenza
            </button>

            {/* Error details (collapsible) */}
            <details style={{ marginTop: 20, textAlign: "left" }}>
              <summary style={{ fontSize: 11, color: "#86868b", cursor: "pointer" }}>
                Dettagli tecnici
              </summary>
              <pre style={{
                fontSize: 10,
                color: "#ff3b30",
                background: "#f5f5f5",
                borderRadius: 8,
                padding: 12,
                marginTop: 8,
                overflow: "auto",
                maxHeight: 150,
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}>
                {this.state.error?.message}
                {"\n\n"}
                {this.state.error?.stack?.slice(0, 500)}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─── COMPONENT-LEVEL ERROR BOUNDARY ──────────────────────
// Per wrappare singoli pannelli senza crashare tutta l'app

export function PanelErrorBoundary({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <PanelErrorBoundaryInner name={name}>
      {children}
    </PanelErrorBoundaryInner>
  );
}

class PanelErrorBoundaryInner extends React.Component<
  { children: React.ReactNode; name: string },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[MASTRO] Errore in ${this.props.name}:`, error);
    try {
      const errors = JSON.parse(localStorage.getItem("mastro:errors") || "[]");
      errors.push({
        panel: this.props.name,
        message: error.message,
        timestamp: new Date().toISOString(),
      });
      if (errors.length > 20) errors.splice(0, errors.length - 20);
      localStorage.setItem("mastro:errors", JSON.stringify(errors));
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 40,
          textAlign: "center",
          color: "#86868b",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A1C", marginBottom: 8 }}>
            Errore nel pannello {this.props.name}
          </div>
          <div style={{ fontSize: 13, marginBottom: 16 }}>
            Gli altri pannelli funzionano normalmente
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "10px 24px",
              borderRadius: 10,
              border: "none",
              background: "#007aff",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            🔄 Riprova
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
