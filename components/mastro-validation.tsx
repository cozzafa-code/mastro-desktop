"use client";
// ═══════════════════════════════════════════════════════════
// MASTRO ERP — Validazione Input
// Protezione dati: nessun dato corrotto entra nel sistema
// ═══════════════════════════════════════════════════════════

// ─── VALIDATORS BASE ─────────────────────────────────────

export const V = {
  // Stringa non vuota
  required: (val: any, label: string): string | null =>
    (!val || (typeof val === "string" && !val.trim())) ? `${label} è obbligatorio` : null,

  // Email valida (opzionale — se compilata deve essere valida)
  email: (val: string): string | null => {
    if (!val || !val.trim()) return null; // opzionale
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val.trim()) ? null : "Email non valida";
  },

  // Telefono italiano (opzionale — se compilato deve essere ragionevole)
  telefono: (val: string): string | null => {
    if (!val || !val.trim()) return null;
    const cleaned = val.replace(/[\s\-\(\)\.]/g, "");
    if (cleaned.length < 6) return "Telefono troppo corto";
    if (cleaned.length > 15) return "Telefono troppo lungo";
    if (!/^[\+]?[\d]+$/.test(cleaned)) return "Telefono: solo numeri";
    return null;
  },

  // Numero positivo
  positivo: (val: any, label: string): string | null => {
    const n = parseFloat(val);
    if (isNaN(n)) return `${label}: inserire un numero`;
    if (n < 0) return `${label}: non può essere negativo`;
    return null;
  },

  // Numero intero positivo
  interoPositivo: (val: any, label: string): string | null => {
    const n = parseInt(val);
    if (isNaN(n) || n < 0) return `${label}: inserire un numero positivo`;
    return null;
  },

  // Misura in mm (range ragionevole per serramenti)
  misuraMM: (val: any, label: string): string | null => {
    const n = parseInt(val);
    if (isNaN(n) || n === 0) return null; // vuoto = ok
    if (n < 50) return `${label}: ${n}mm sembra troppo piccolo (min 50mm)`;
    if (n > 6000) return `${label}: ${n}mm sembra troppo grande (max 6000mm)`;
    return null;
  },

  // P.IVA italiana (11 cifre)
  piva: (val: string): string | null => {
    if (!val || !val.trim()) return null;
    const cleaned = val.replace(/[\s\-\.]/g, "");
    if (!/^\d{11}$/.test(cleaned)) return "P.IVA: deve avere 11 cifre";
    return null;
  },

  // Codice fiscale
  cf: (val: string): string | null => {
    if (!val || !val.trim()) return null;
    const cleaned = val.replace(/\s/g, "").toUpperCase();
    if (!/^[A-Z0-9]{16}$/.test(cleaned)) return "Codice Fiscale: 16 caratteri alfanumerici";
    return null;
  },

  // IBAN
  iban: (val: string): string | null => {
    if (!val || !val.trim()) return null;
    const cleaned = val.replace(/\s/g, "").toUpperCase();
    if (cleaned.length < 15 || cleaned.length > 34) return "IBAN non valido";
    if (!/^[A-Z]{2}\d{2}/.test(cleaned)) return "IBAN: deve iniziare con codice paese (es. IT)";
    return null;
  },

  // Importo (prezzo)
  importo: (val: any, label: string): string | null => {
    if (val === "" || val === null || val === undefined) return `${label} è obbligatorio`;
    const n = parseFloat(String(val).replace(",", "."));
    if (isNaN(n)) return `${label}: inserire un importo valido`;
    if (n < 0) return `${label}: non può essere negativo`;
    if (n > 9999999) return `${label}: importo troppo grande`;
    return null;
  },

  // Data (formato YYYY-MM-DD)
  data: (val: string, label: string): string | null => {
    if (!val) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return `${label}: formato data non valido`;
    const d = new Date(val);
    if (isNaN(d.getTime())) return `${label}: data non valida`;
    return null;
  },

  // Lunghezza massima stringa
  maxLen: (val: string, max: number, label: string): string | null => {
    if (!val) return null;
    if (val.length > max) return `${label}: massimo ${max} caratteri`;
    return null;
  },
};


// ─── FORM VALIDATORS ─────────────────────────────────────
// Ogni form ha il suo validator che ritorna { valid, errors }

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
}

function validate(checks: [string, string | null][]): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};
  for (const [field, err] of checks) {
    if (err) {
      errors.push(err);
      fieldErrors[field] = err;
    }
  }
  return { valid: errors.length === 0, errors, fieldErrors };
}


// ── Commessa ──
export function validateCommessa(cm: any): ValidationResult {
  return validate([
    ["cliente", V.required(cm.cliente, "Nome cliente")],
    ["email", V.email(cm.email || "")],
    ["telefono", V.telefono(cm.telefono || "")],
    ["cliente", V.maxLen(cm.cliente || "", 100, "Nome cliente")],
    ["indirizzo", V.maxLen(cm.indirizzo || "", 200, "Indirizzo")],
    ["note", V.maxLen(cm.note || "", 2000, "Note")],
  ]);
}

// ── Vano ──
export function validateVano(vano: any): ValidationResult {
  return validate([
    ["nome", V.maxLen(vano.nome || "", 100, "Nome vano")],
    ["pezzi", V.interoPositivo(vano.pezzi || 1, "Pezzi")],
  ]);
}

// ── Misura (singola) ──
export function validateMisura(key: string, value: any): ValidationResult {
  return validate([
    [key, V.misuraMM(value, key)],
  ]);
}

// ── Fattura Passiva ──
export function validateFatturaPassiva(fp: any): ValidationResult {
  return validate([
    ["fornitore", V.required(fp.fornitore, "Fornitore")],
    ["importo", V.importo(fp.importo, "Importo")],
    ["data", V.data(fp.data, "Data")],
    ["numero", V.maxLen(fp.numero || "", 50, "Numero fattura")],
    ["scadenza", V.data(fp.scadenza || "", "Scadenza")],
  ]);
}

// ── Task ──
export function validateTask(task: any): ValidationResult {
  return validate([
    ["text", V.required(task.text, "Testo task")],
    ["text", V.maxLen(task.text || "", 500, "Testo task")],
  ]);
}

// ── Evento ──
export function validateEvento(ev: any): ValidationResult {
  const titolo = ev.text?.trim() || (ev.persona ? "Appuntamento " + ev.persona : "");
  return validate([
    ["text", !titolo ? "Titolo o persona è obbligatorio" : null],
    ["text", V.maxLen(ev.text || "", 200, "Titolo evento")],
    ["date", V.data(ev.date || "", "Data")],
  ]);
}

// ── Azienda Info ──
export function validateAzienda(az: any): ValidationResult {
  return validate([
    ["nome", V.required(az.nome, "Nome azienda")],
    ["email", V.email(az.email || "")],
    ["telefono", V.telefono(az.telefono || "")],
    ["piva", V.piva(az.piva || "")],
    ["cf", V.cf(az.cf || "")],
    ["iban", V.iban(az.iban || "")],
    ["pec", V.email(az.pec || "")],
  ]);
}

// ── Fornitore ──
export function validateFornitore(f: any): ValidationResult {
  return validate([
    ["nome", V.required(f.nome, "Nome fornitore")],
    ["email", V.email(f.email || "")],
    ["telefono", V.telefono(f.telefono || "")],
    ["piva", V.piva(f.piva || "")],
    ["iban", V.iban(f.iban || "")],
  ]);
}

// ── Contatto ──
export function validateContatto(c: any): ValidationResult {
  return validate([
    ["nome", V.required(c.nome, "Nome contatto")],
    ["email", V.email(c.email || "")],
    ["telefono", V.telefono(c.telefono || "")],
  ]);
}


// ─── SANITIZERS ──────────────────────────────────────────
// Pulisci input PRIMA di salvare

export const sanitize = {
  // Trim + collassa spazi multipli
  text: (val: string): string =>
    (val || "").trim().replace(/\s+/g, " "),

  // Solo numeri e +
  telefono: (val: string): string =>
    (val || "").replace(/[^\d\+\s\-\(\)\.]/g, ""),

  // Lowercase email
  email: (val: string): string =>
    (val || "").trim().toLowerCase(),

  // Numero: rimuovi tutto tranne cifre, punto, virgola, segno
  numero: (val: string): number => {
    const cleaned = String(val || "0").replace(",", ".").replace(/[^\d.\-]/g, "");
    return parseFloat(cleaned) || 0;
  },

  // Misura in mm: solo intero positivo
  misura: (val: any): number => {
    const n = parseInt(String(val || "0"));
    return isNaN(n) || n < 0 ? 0 : n;
  },

  // P.IVA: solo cifre
  piva: (val: string): string =>
    (val || "").replace(/[^\d]/g, "").slice(0, 11),

  // CF: uppercase, solo alfanumerici
  cf: (val: string): string =>
    (val || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16),

  // IBAN: uppercase, rimuovi spazi
  iban: (val: string): string =>
    (val || "").toUpperCase().replace(/\s/g, ""),

  // XSS protection: rimuovi tag HTML
  html: (val: string): string =>
    (val || "").replace(/<[^>]*>/g, ""),
};


// ─── INLINE ERROR COMPONENT ─────────────────────────────
// Mostra errore sotto il campo input

export function FieldError({ error }: { error?: string | null }) {
  if (!error) return null;
  return (
    <div style={{
      fontSize: 11,
      color: "#ff3b30",
      fontWeight: 600,
      marginTop: 3,
      display: "flex",
      alignItems: "center",
      gap: 4,
    }}>
      <span>⚠️</span> {error}
    </div>
  );
}

// ─── FORM ERROR SUMMARY ─────────────────────────────────
// Banner con lista errori in cima al form

export function FormErrors({ errors }: { errors: string[] }) {
  if (!errors || errors.length === 0) return null;
  return (
    <div style={{
      background: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: 10,
      padding: "10px 14px",
      marginBottom: 12,
      fontSize: 12,
      color: "#991b1b",
      fontWeight: 600,
      lineHeight: 1.6,
    }}>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>⚠️ Correggi prima di salvare:</div>
      {errors.map((e, i) => (
        <div key={i}>• {e}</div>
      ))}
    </div>
  );
}
