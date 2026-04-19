"use client";
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const MastroERP = dynamic(() => import('@/components/MastroERP'), { ssr: false });

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'cozzafa@gmail.com',
          password: 'Waltercozzasrl12@'
        });
        if (data?.user) { setUser(data.user); }
        else { setErr(error?.message || "Login fallito"); }
      } catch (e: any) {
        setErr(e.message || "Errore connessione");
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1F1F', color: '#28A0A0', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>MASTRO DESKTOP</div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>Connessione...</div>
      </div>
    </div>
  );

  if (!user) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0D1F1F', color: '#DC4444', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Errore login</div>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>{err}</div>
      </div>
    </div>
  );

  return <MastroERP user={user} azienda={null} forceDesktop />;
}
