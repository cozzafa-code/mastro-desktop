// ============================================================
// MASTRO ERP — Storage Helpers (foto, video, disegni, allegati)
// lib/storage.ts
// ============================================================

import { supabase, getMyProfile } from "./supabase";

type Bucket = "foto" | "video" | "disegni" | "allegati" | "loghi" | "firme";

// ── Path builder: {azienda_id}/{commessa_id}/{filename} ──

function buildPath(azId: string, cmId: string, filename: string) {
  const ts = Date.now();
  const ext = filename.split(".").pop() || "bin";
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 50);
  return `${azId}/${cmId}/${ts}_${safeName}`;
}

// ── Upload ────────────────────────────────────────────────

export async function uploadFile(
  bucket: Bucket,
  commessaId: string,
  file: File | Blob,
  filename?: string
): Promise<{ url: string; path: string; size: number }> {
  const profile = await getMyProfile();
  if (!profile) throw new Error("Not authenticated");

  const name = filename || (file instanceof File ? file.name : `file_${Date.now()}`);
  const path = buildPath(profile.azienda_id, commessaId, name);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  // For private buckets, use signed URL
  const { data: signedData } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days

  return {
    url: signedData?.signedUrl || urlData.publicUrl,
    path,
    size: file.size,
  };
}

// ── Upload from Blob (for recorded audio/video) ──────────

export async function uploadBlob(
  bucket: Bucket,
  commessaId: string,
  blob: Blob,
  filename: string,
  contentType?: string
): Promise<{ url: string; path: string; size: number }> {
  const profile = await getMyProfile();
  if (!profile) throw new Error("Not authenticated");

  const path = buildPath(profile.azienda_id, commessaId, filename);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      cacheControl: "3600",
      contentType: contentType || blob.type,
      upsert: false,
    });
  if (error) throw error;

  const { data: signedData } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 60 * 60 * 24 * 7);

  return {
    url: signedData?.signedUrl || "",
    path,
    size: blob.size,
  };
}

// ── Upload from dataURL (for canvas drawings, camera captures) ──

export async function uploadDataUrl(
  bucket: Bucket,
  commessaId: string,
  dataUrl: string,
  filename: string
): Promise<{ url: string; path: string; size: number }> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return uploadBlob(bucket, commessaId, blob, filename, blob.type);
}

// ── Get signed URL (refresh for expired URLs) ─────────────

export async function getSignedUrl(bucket: Bucket, path: string, expiresIn = 60 * 60 * 24) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

// ── Delete file ──────────────────────────────────────────

export async function deleteFile(bucket: Bucket, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

// ── Upload logo (public bucket) ─────────────────────────

export async function uploadLogo(file: File): Promise<string> {
  const profile = await getMyProfile();
  if (!profile) throw new Error("Not authenticated");

  const path = `${profile.azienda_id}/logo_${Date.now()}.${file.name.split(".").pop()}`;

  const { error } = await supabase.storage
    .from("loghi")
    .upload(path, file, { cacheControl: "3600", upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from("loghi").getPublicUrl(path);
  return data.publicUrl;
}

// ── Upload firma cliente ────────────────────────────────

export async function uploadFirma(commessaId: string, dataUrl: string): Promise<string> {
  const { url } = await uploadDataUrl("firme", commessaId, dataUrl, "firma.png");
  return url;
}

// ── Convenience: upload foto vano with category ─────────

export async function uploadFotoVano(
  commessaId: string,
  file: File | Blob,
  filename: string,
  categoria?: string
) {
  const result = await uploadFile("foto", commessaId, file, filename);
  // Caller should also call db.addAllegatoVano() with the returned URL
  return { ...result, categoria };
}

// ── Convenience: upload recorded video ──────────────────

export async function uploadVideoRecording(
  commessaId: string,
  blob: Blob,
  durata: string
) {
  const filename = `video_${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
  const result = await uploadBlob("video", commessaId, blob, filename, "video/webm");
  return { ...result, durata };
}

// ── Convenience: upload audio recording ─────────────────

export async function uploadAudioRecording(
  commessaId: string,
  blob: Blob,
  durata: string
) {
  const filename = `audio_${new Date().toISOString().replace(/[:.]/g, "-")}.webm`;
  const result = await uploadBlob("allegati", commessaId, blob, filename, "audio/webm");
  return { ...result, durata };
}

// ── Convenience: upload disegno canvas ──────────────────

export async function uploadDisegno(
  commessaId: string,
  dataUrl: string,
  pagina: number = 1
) {
  const filename = `disegno_p${pagina}_${Date.now()}.png`;
  return uploadDataUrl("disegni", commessaId, dataUrl, filename);
}
