'use client';
import { useState, useEffect } from 'react';

const PIANI = [
  { nome: 'BASE', prezzo: 9, desc: '1 utente · 20 commesse', colore: '#6B7280', features: ['ERP base', 'PDF preventivi', '20 commesse', '1 operatore'] },
  { nome: 'START', prezzo: 29, desc: '3 utenti · illimitate', colore: '#3B7FE0', best: true, features: ['ERP completo', 'Commesse illimitate', '3 operatori', 'MESSAGGI', 'MONTAGGI'] },
  { nome: 'PRO', prezzo: 59, desc: '10 utenti · AI incluso', colore: '#D08008', features: ['Tutto START', '10 operatori', 'RETE agenti', 'Assistente AI', 'Add-on settore'] },
  { nome: 'TITAN', prezzo: 89, desc: 'Illimitati · CNC', colore: '#1A1A1C', features: ['Tutto PRO', 'Operatori illimitati', 'CNC', 'ADMIN', 'API access'] },
];

const MODULI = [
  { icon: '📋', nome: 'ERP', desc: 'Commesse, preventivi, ordini e fatture in un unico flusso operativo.' },
  { icon: '📐', nome: 'MISURE', desc: 'App tablet per il sopralluogo. Disegno tecnico, foto vano, PDF automatico.' },
  { icon: '🔧', nome: 'MONTAGGI', desc: 'Calendario posa, checklist cantiere, firma digitale del cliente.' },
  { icon: '💬', nome: 'MESSAGGI', desc: 'Rispondi ai clienti in 10 secondi. Assistente che conosce ogni commessa.' },
  { icon: '🌐', nome: 'RETE', desc: 'App per agenti di vendita. Preventivi in trasferta, firma sul posto.' },
  { icon: '⚙️', nome: 'CNC', desc: 'Lista taglio automatica per centri di lavoro Emmegi, Pertici, Urban.' },
];

const NUMERI = [
  { val: '< 10 min', label: 'per il primo preventivo' },
  { val: '€0', label: 'per 30 giorni di prova' },
  { val: '8', label: 'moduli integrati' },
  { val: '100%', label: 'dati tuoi, sempre' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', background: '#F2F1EC', color: '#1A1A1C', overflowX: 'hidden' }}>

      {/* NAVBAR */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(26,26,28,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        transition: 'all 0.3s',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
          MASTRO <span style={{ color: '#D08008' }}>SUITE</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="#moduli" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14 }}>Moduli</a>
          <a href="#prezzi" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 14 }}>Prezzi</a>
          <a href="/onboarding" style={{
            background: '#D08008', color: '#fff', padding: '8px 20px',
            borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}>Prova gratis</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '120px 24px 80px',
        background: 'linear-gradient(160deg, #1A1A1C 0%, #2D2D2F 50%, #1A1A1C 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Pattern decorativo */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(0deg, #D08008 0, #D08008 1px, transparent 0, transparent 50%), repeating-linear-gradient(90deg, #D08008 0, #D08008 1px, transparent 0, transparent 50%)',
          backgroundSize: '40px 40px',
        }} />

        <div style={{
          display: 'inline-block', background: 'rgba(208,128,8,0.15)',
          border: '1px solid rgba(208,128,8,0.4)', color: '#D08008',
          borderRadius: 20, padding: '6px 18px', fontSize: 13, fontWeight: 600,
          marginBottom: 24, letterSpacing: '0.5px',
        }}>
          🇮🇹 Fatto per i serramentisti italiani
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800,
          color: '#fff', lineHeight: 1.1, marginBottom: 24,
          letterSpacing: '-2px', maxWidth: 900,
        }}>
          Il software che lavora<br />
          <span style={{ color: '#D08008' }}>mentre tu monti.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.65)',
          maxWidth: 600, lineHeight: 1.6, marginBottom: 40,
        }}>
          Preventivi, commesse, cantieri, fatture e team — tutto integrato.
          Niente fogli Excel, niente app separate, niente caos.
        </p>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href="/onboarding" style={{
            background: '#D08008', color: '#fff', padding: '16px 36px',
            borderRadius: 10, textDecoration: 'none', fontSize: 16, fontWeight: 700,
            boxShadow: '0 8px 32px rgba(208,128,8,0.35)',
          }}>
            Inizia gratis — 30 giorni →
          </a>
          <a href="#moduli" style={{
            background: 'rgba(255,255,255,0.08)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '16px 36px', borderRadius: 10, textDecoration: 'none', fontSize: 16,
          }}>
            Scopri i moduli
          </a>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 20 }}>
          Nessuna carta di credito · Disdici quando vuoi · Dati sempre tuoi
        </p>
      </section>

      {/* NUMERI */}
      <section style={{ background: '#D08008', padding: '32px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {NUMERI.map((n, i) => (
            <div key={i} style={{
              textAlign: 'center', padding: '16px',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.2)' : 'none',
            }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{n.val}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{n.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MODULI */}
      <section id="moduli" style={{ padding: '96px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 12 }}>
            8 moduli. Un unico abbonamento.
          </h2>
          <p style={{ color: '#6B7280', fontSize: 17 }}>
            Ogni modulo risolve un problema reale del tuo lavoro quotidiano.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {MODULI.map(m => (
            <div key={m.nome} style={{
              background: '#fff', borderRadius: 14, padding: '28px 24px',
              border: '1px solid #E5E3DC',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>{m.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                MASTRO <span style={{ color: '#D08008' }}>{m.nome}</span>
              </div>
              <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PREZZI */}
      <section id="prezzi" style={{ padding: '96px 24px', background: '#1A1A1C' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: '#fff', letterSpacing: '-1px', marginBottom: 12 }}>
              Prezzi chiari. Zero sorprese.
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 17 }}>
              30 giorni gratis su qualsiasi piano. Nessuna carta adesso.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {PIANI.map(p => (
              <div key={p.nome} style={{
                background: p.best ? '#D08008' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${p.best ? '#D08008' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: '28px 22px', position: 'relative',
              }}>
                {p.best && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: '#fff', color: '#D08008', borderRadius: 20,
                    padding: '3px 14px', fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap',
                  }}>PIÙ SCELTO</div>
                )}
                <div style={{ fontSize: 15, fontWeight: 700, color: p.best ? '#fff' : '#9CA3AF', marginBottom: 8 }}>{p.nome}</div>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>€{p.prezzo}</span>
                  <span style={{ fontSize: 13, color: p.best ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)' }}>/mese</span>
                </div>
                <div style={{ fontSize: 12, color: p.best ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)', marginBottom: 20 }}>{p.desc}</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {p.features.map(f => (
                    <li key={f} style={{ fontSize: 13, color: p.best ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)', display: 'flex', gap: 8 }}>
                      <span style={{ color: p.best ? '#fff' : '#D08008' }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <a href="/onboarding" style={{
                  display: 'block', textAlign: 'center',
                  background: p.best ? '#fff' : 'rgba(255,255,255,0.1)',
                  color: p.best ? '#D08008' : '#fff',
                  padding: '11px 0', borderRadius: 8, textDecoration: 'none',
                  fontSize: 14, fontWeight: 700,
                }}>
                  Inizia gratis
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section style={{ padding: '96px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 16 }}>
          Smetti di rincorrere.<br />
          <span style={{ color: '#D08008' }}>Inizia a costruire.</span>
        </h2>
        <p style={{ color: '#6B7280', fontSize: 17, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
          30 giorni gratis, nessuna carta richiesta. Pronto in meno di 10 minuti.
        </p>
        <a href="/onboarding" style={{
          display: 'inline-block',
          background: '#1A1A1C', color: '#fff', padding: '18px 48px',
          borderRadius: 12, textDecoration: 'none', fontSize: 17, fontWeight: 700,
          boxShadow: '0 8px 32px rgba(26,26,28,0.2)',
        }}>
          Crea il tuo account gratis →
        </a>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#1A1A1C', padding: '40px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>
          MASTRO <span style={{ color: '#D08008' }}>SUITE</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="/tos" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>Termini di Servizio</a>
          <a href="/privacy" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>Privacy & GDPR</a>
          <a href="mailto:info@mastrosuite.com" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>Contatti</a>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
          © {new Date().getFullYear()} GALASSIA MASTRO · P.IVA IT —
        </div>
      </footer>
    </div>
  );
}
