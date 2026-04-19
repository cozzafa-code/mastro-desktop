// ═══════════════════════════════════════════════════════════
// lib/vano-foto-uploader.ts — MASTRO ERP
// Utility: comprimi foto + upload su Supabase Storage
//
// SUPABASE SETUP (eseguire una volta in SQL Editor):
//
//   INSERT INTO storage.buckets (id, name, public)
//   VALUES ('vano-foto', 'vano-foto', true);
//
//   CREATE POLICY "Allow public read vano-foto"
//   ON storage.objects FOR SELECT
//   USING (bucket_id = 'vano-foto');
//
//   CREATE POLICY "Allow authenticated upload vano-foto"
//   ON storage.objects FOR INSERT
//   WITH CHECK (bucket_id = 'vano-foto');
//
//   CREATE POLICY "Allow authenticated delete vano-foto"
//   ON storage.objects FOR DELETE
//   USING (bucket_id = 'vano-foto');
//
// ═══════════════════════════════════════════════════════════

import { supabase } from "@/lib/supabase";

const BUCKET = "vano-foto";
const MAX_W = 1200;
const QUALITY = 0.72;

// ── Compress base64 image ──
export function compressImage(
  dataUrl: string,
  maxW = MAX_W,
  quality = QUALITY
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

// ── Convert base64 to Blob ──
function base64ToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

// ── Upload to Supabase Storage ──
export async function uploadFoto(
  aziendaId: string,
  cmId: string,
  vanoId: string,
  categoria: string,
  dataUrl: string
): Promise<string | null> {
  try {
    const compressed = await compressImage(dataUrl);
    const blob = base64ToBlob(compressed);
    const ts = Date.now();
    const path = `${aziendaId}/${cmId}/${vanoId}/${categoria}_${ts}.jpg`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, blob, { contentType: "image/jpeg", upsert: true });

    if (error) {
      console.warn("[VanoFoto] Upload failed:", error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.warn("[VanoFoto] Upload error:", err);
    return null;
  }
}

// ── Delete foto from Supabase Storage ──
export async function deleteFoto(publicUrl: string): Promise<boolean> {
  try {
    const idx = publicUrl.indexOf(`/${BUCKET}/`);
    if (idx === -1) return false;
    const path = publicUrl.substring(idx + BUCKET.length + 2);
    const { error } = await supabase.storage.from(BUCKET).remove([path]);
    if (error) {
      console.warn("[VanoFoto] Delete failed:", error.message);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ── Main capture interface ──
export interface CaptureOptions {
  aziendaId: string;
  cmId: string;
  vanoId: string;
  categoria: string;
}

// ── captureFotoVano: camera → comprimi → upload Supabase → URL ──
export function captureFotoVano(
  opts: CaptureOptions,
  onResult: (url: string) => void,
  onError?: (err: string) => void
): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.capture = "environment";

  input.onchange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      if (!raw) { onError?.("Errore lettura file"); return; }

      const compressed = await compressImage(raw);
      const publicUrl = await uploadFoto(
        opts.aziendaId, opts.cmId, opts.vanoId, opts.categoria, compressed
      );

      if (publicUrl) {
        onResult(publicUrl);
      } else {
        console.warn("[VanoFoto] Supabase fallback → base64");
        onResult(compressed);
      }
    };
    reader.onerror = () => onError?.("Errore lettura file");
    reader.readAsDataURL(file);
  };

  input.click();
}

// ── captureFotoSimple: solo locale, comprimi + base64 ──
export function captureFotoSimple(
  onResult: (dataUrl: string) => void,
  onError?: (err: string) => void
): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.capture = "environment";

  input.onchange = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const raw = ev.target?.result as string;
      if (!raw) { onError?.("Errore lettura file"); return; }
      const compressed = await compressImage(raw);
      onResult(compressed);
    };
    reader.onerror = () => onError?.("Errore lettura file");
    reader.readAsDataURL(file);
  };

  input.click();
}
