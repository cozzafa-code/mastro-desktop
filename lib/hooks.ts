// ============================================================
// MASTRO ERP — React Hooks for Supabase
// lib/hooks.ts
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase, getMyProfile, onAuthChange } from "./supabase";
import * as db from "./db";

// ── useAuth ──────────────────────────────────────────────

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        try {
          const p = await getMyProfile();
          setProfile(p);
          setIsOnboarded(!!p);
        } catch { setIsOnboarded(false); }
      }
      setLoading(false);
    };
    init();

    const { data: { subscription } } = onAuthChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        try {
          const p = await getMyProfile();
          setProfile(p);
          setIsOnboarded(!!p);
        } catch { setIsOnboarded(false); }
      } else {
        setProfile(null);
        setIsOnboarded(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, loading, isOnboarded };
}

// ── useCommesse ──────────────────────────────────────────

export function useCommesse() {
  const [commesse, setCommesse] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getCommesse();
      setCommesse(data || []);
    } catch (err) {
      console.error("Error loading commesse:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    // Realtime subscription
    const channel = db.subscribeToCommesse(() => refresh());
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return { commesse, loading, refresh };
}

// ── useEventi ────────────────────────────────────────────

export function useEventi(from?: string, to?: string) {
  const [eventi, setEventi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getEventi(from, to);
      setEventi(data || []);
    } catch (err) {
      console.error("Error loading eventi:", err);
    }
    setLoading(false);
  }, [from, to]);

  useEffect(() => {
    refresh();
    const channel = db.subscribeToEventi(() => refresh());
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return { eventi, loading, refresh };
}

// ── useTasks ─────────────────────────────────────────────

export function useTasks(includeCompleted = false) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getTasks(includeCompleted);
      setTasks(data || []);
    } catch (err) {
      console.error("Error loading tasks:", err);
    }
    setLoading(false);
  }, [includeCompleted]);

  useEffect(() => {
    refresh();
    const channel = db.subscribeToTasks(() => refresh());
    return () => { supabase.removeChannel(channel); };
  }, [refresh]);

  return { tasks, loading, refresh };
}

// ── useCatalog ───────────────────────────────────────────

export function useCatalog(table: "sistemi" | "colori" | "vetri" | "coprifili" | "lamiere") {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const catalog = {
    sistemi: db.sistemi,
    colori: db.colori,
    vetri: db.vetri,
    coprifili: db.coprifili,
    lamiere: db.lamiereDb,
  }[table];

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await catalog.get();
      setItems(data || []);
    } catch (err) {
      console.error(`Error loading ${table}:`, err);
    }
    setLoading(false);
  }, [table]);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    items,
    loading,
    refresh,
    add: async (item: any) => { await catalog.add(item); refresh(); },
    update: async (id: string, u: any) => { await catalog.update(id, u); refresh(); },
    remove: async (id: string) => { await catalog.delete(id); refresh(); },
  };
}

// ── useContatti ──────────────────────────────────────────

export function useContatti() {
  const [contatti, setContatti] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await db.getContatti();
      setContatti(data || []);
    } catch (err) {
      console.error("Error loading contatti:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { contatti, loading, refresh };
}

// ── usePipeline ──────────────────────────────────────────

export function usePipeline() {
  const [fasi, setFasi] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await db.getPipelineFasi();
        setFasi(data || []);
      } catch (err) {
        console.error("Error loading pipeline:", err);
      }
      setLoading(false);
    })();
  }, []);

  return { fasi, loading };
}
