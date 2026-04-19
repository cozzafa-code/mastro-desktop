"use client";
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — UI Safety Kit
// Conferme distruttive + Loading states + Toast notifications
// ═══════════════════════════════════════════════════════════
import React, { useState, useCallback, useRef } from "react";

// ─── CONFIRM DIALOG ──────────────────────────────────────
// Modal "Sei sicuro?" per azioni distruttive

interface ConfirmConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;       // rosso per cancellazioni
  onConfirm: () => void;
}

export function useConfirmDialog() {
  const [config, setConfig] = useState<ConfirmConfig | null>(null);

  const confirm = useCallback((cfg: ConfirmConfig) => {
    setConfig(cfg);
  }, []);

  const handleConfirm = useCallback(() => {
    config?.onConfirm();
    setConfig(null);
  }, [config]);

  const handleCancel = useCallback(() => {
    setConfig(null);
  }, []);

  const ConfirmDialog = config ? (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={handleCancel}
    >
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
      }} />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 18,
          padding: 28,
          width: "90%",
          maxWidth: 360,
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          fontFamily: "'Inter', -apple-system, sans-serif",
          animation: "confirmSlideUp 0.2s ease",
        }}
      >
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>
          {config.danger ? "⚠️" : "🤔"}
        </div>
        <div style={{
          fontSize: 18,
          fontWeight: 900,
          color: "#1A1A1C",
          textAlign: "center",
          marginBottom: 8,
        }}>
          {config.title}
        </div>
        <div style={{
          fontSize: 14,
          color: "#86868b",
          textAlign: "center",
          marginBottom: 24,
          lineHeight: 1.5,
        }}>
          {config.message}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={handleCancel}
            style={{
              flex: 1,
              padding: 13,
              borderRadius: 12,
              border: "1px solid #e5e5ea",
              background: "#fff",
              color: "#1A1A1C",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {config.cancelText || "Annulla"}
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1,
              padding: 13,
              borderRadius: 12,
              border: "none",
              background: config.danger ? "#ff3b30" : "#007aff",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {config.confirmText || "Conferma"}
          </button>
        </div>
        <style>{`
          @keyframes confirmSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  ) : null;

  return { confirm, ConfirmDialog };
}


// ─── TOAST NOTIFICATIONS ─────────────────────────────────
// Feedback visivo non intrusivo per azioni completate

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  onTap?: () => void;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: "success" | "error" | "warning" | "info" | "green" | "orange" = "success", onTap?: () => void) => {
    const mapped = type === "green" ? "success" : type === "orange" ? "warning" : type;
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type: mapped as any, onTap }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, onTap ? 5000 : 3500);
  }, []);

  const ToastContainer = toasts.length > 0 ? (
    <div style={{
      position: "fixed",
      top: 16,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 99998,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      width: "90%",
      maxWidth: 380,
      pointerEvents: "none",
    }}>
      {toasts.map(t => {
        const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
          success: { bg: "#f0fdf4", border: "#34c759", text: "#166534", icon: "✅" },
          error:   { bg: "#fef2f2", border: "#ff3b30", text: "#991b1b", icon: "❌" },
          warning: { bg: "#fffbeb", border: "#ff9500", text: "#92400e", icon: "⚠️" },
          info:    { bg: "#eff6ff", border: "#007aff", text: "#1e40af", icon: "ℹ️" },
        };
        const c = colors[t.type];
        const clickable = !!t.onTap;
        return (
          <div
            key={t.id}
            onClick={clickable ? () => { t.onTap!(); setToasts(prev => prev.filter(x => x.id !== t.id)); } : undefined}
            style={{
              background: c?.bg || "#f0fdf4",
              border: `1px solid ${c?.border || "#86efac"}30`,
              borderRadius: 12,
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: (c?.text || "#166534"),
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              animation: "toastSlideDown 0.3s ease",
              fontFamily: "'Inter', -apple-system, sans-serif",
              pointerEvents: clickable ? "auto" : "none",
              cursor: clickable ? "pointer" : "default",
            }}
          >
            <span style={{ fontSize: 16 }}>{(c?.icon || "#22c55e")}</span>
            <span style={{ flex: 1 }}>{t.message}</span>
            {clickable && <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.6 }}>Apri →</span>}
          </div>
        );
      })}
      <style>{`
        @keyframes toastSlideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  ) : null;

  return { toast, ToastContainer };
}


// ─── LOADING BUTTON ──────────────────────────────────────
// Pulsante che mostra spinner e si disabilita durante azione async

export function LoadingButton({
  onClick,
  loading,
  children,
  style,
  disabled,
  ...props
}: {
  onClick: () => void | Promise<void>;
  loading?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
  disabled?: boolean;
  [key: string]: any;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const actualLoading = loading !== undefined ? loading : isLoading;

  const handleClick = async () => {
    if (actualLoading || disabled) return;
    try {
      setIsLoading(true);
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={actualLoading || disabled}
      style={{
        ...style,
        opacity: actualLoading ? 0.7 : 1,
        cursor: actualLoading ? "wait" : "pointer",
        position: "relative",
      }}
      {...props}
    >
      {actualLoading ? (
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span style={{
            width: 14,
            height: 14,
            border: "2px solid rgba(255,255,255,0.3)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "btnSpin 0.6s linear infinite",
            display: "inline-block",
          }} />
          Attendere...
          <style>{`@keyframes btnSpin { to { transform: rotate(360deg); } }`}</style>
        </span>
      ) : children}
    </button>
  );
}


// ─── DATA EXPORT UTILITY ─────────────────────────────────
// Esporta tutti i dati MASTRO in formato leggibile

export function exportAllData() {
  const data: Record<string, any> = {};
  const meta = {
    exportDate: new Date().toISOString(),
    version: "MASTRO ERP v1.0",
    browser: navigator.userAgent,
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("mastro:")) {
      try {
        data[key.replace("mastro:", "")] = JSON.parse(localStorage.getItem(key) || "");
      } catch {
        data[key.replace("mastro:", "")] = localStorage.getItem(key);
      }
    }
  }

  const exportObj = { meta, data };
  const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mastro-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export function importData(jsonString: string): boolean {
  try {
    const { data } = JSON.parse(jsonString);
    if (!data) throw new Error("Formato non valido");
    
    for (const [key, value] of Object.entries(data)) {
      localStorage.setItem(`mastro:${key}`, JSON.stringify(value));
    }
    return true;
  } catch (e) {
    console.error("[MASTRO] Errore import:", e);
    return false;
  }
}
