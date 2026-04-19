'use client';
import { useState } from 'react';

const STEPS = [
  {
    id: 'prodotti',
    titolo: '1. Crea i 4 prodotti su Stripe',
    completato: false,
    istruzioni: [
      'Vai su dashboard.stripe.com → Products → + Add product',
      'Crea BASE: Nome "MASTRO BASE", Prezzo €9.00, Recurring Monthly, EUR',
      'Crea START: Nome "MASTRO START", Prezzo €29.00, Recurring Monthly, EUR',
      'Crea PRO: Nome "MASTRO PRO", Prezzo €59.00, Recurring Monthly, EUR',
      'Crea TITAN: Nome "MASTRO TITAN", Prezzo €89.00, Recurring Monthly, EUR',
      'Copia i 4 Price ID (price_xxx) — servono nel passo 2',
    ],
  },
  {
    id: 'env',
    titolo: '2. Env vars su Vercel',
    completato: false,
    istruzioni: [
      'Vai su vercel.com → mastro-erp → Settings → Environment Variables',
      'Aggiungi: STRIPE_SECRET_KEY = sk_live_...',
      'Aggiungi: STRIPE_PRICE_BASE = price_... (dal passo 1)',
      'Aggiungi: STRIPE_PRICE_START = price_...',
      'Aggiungi: STRIPE_PRICE_PRO = price_...',
      'Aggiungi: STRIPE_PRICE_TITAN = price_...',
      'Aggiungi: NEXT_PUBLIC_APP_URL = https://mastro-erp.vercel.app',
      'Aggiungi: RESEND_API_KEY = re_... (da resend.com)',
      'Aggiungi: CRON_SECRET = [genera con: openssl rand -hex 16]',
    ],
  },
  {
    id: 'webhook',
    titolo: '3. Configura il Webhook',
    completato: false,
    istruzioni: [
      'Stripe Dashboard → Developers → Webhooks → + Add endpoint',
      'URL: https://mastro-erp.vercel.app/api/stripe/webhook',
      'Seleziona eventi: checkout.session.completed',
      'Aggiungi anche: customer.subscription.updated',
      'Aggiungi anche: customer.subscription.deleted',
      'Aggiungi anche: invoice.payment_failed',
      'Clicca "Add endpoint" → copia il Signing secret (whsec_...)',
      'Aggiungi su Vercel: STRIPE_WEBHOOK_SECRET = whsec_...',
    ],
  },
  {
    id: 'portal',
    titolo: '4. Abilita Customer Portal',
    completato: false,
    istruzioni: [
      'Stripe Dashboard → Billing → Customer Portal',
      'Abilita "Allow customers to update subscriptions"',
      'Abilita "Allow customers to cancel subscriptions"',
      'Salva le impostazioni',
    ],
  },
  {
    id: 'storage',
    titolo: '5. Supabase Storage bucket foto-vani',
    completato: false,
    istruzioni: [
      'Supabase Dashboard → Storage → New bucket',
      'Nome: foto-vani',
      'Public: ON',
      'File size limit: 10 MB',
      'Allowed types: image/jpeg, image/png, image/webp',
      'Salva e vai su Policies → aggiungi policy INSERT per utenti autenticati',
    ],
  },
  {
    id: 'domini',
    titolo: '6. Registra i domini',
    completato: false,
    istruzioni: [
      'Vai su namecheap.com o aruba.it',
      'Cerca e acquista: mastrosuite.it',
      'Cerca e acquista: mastrosuite.com',
      'Vercel → mastro-erp → Settings → Domains → Add domain',
      'Segui le istruzioni DNS di Vercel (CNAME record)',
      'Attesa propagazione: 5-30 minuti',
    ],
  },
];

export default function StripeSetupGuide() {
  const [completati, setCompletati] = useState<Set<string>>(new Set());
  const [aperto, setAperto] = useState<string>('prodotti');

  const toggle = (id: string) => {
    setCompletati(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const pct = Math.round((completati.size / STEPS.length) * 100);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 680, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1A1A1C', marginBottom: 8 }}>
          Setup Lancio — {pct}% completato
        </h1>
        <div style={{ height: 8, background: '#E5E3DC', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#1A9E73' : '#D08008', transition: 'width 0.3s', borderRadius: 4 }} />
        </div>
        {pct === 100 && (
          <div style={{ marginTop: 12, background: '#D1FAE5', border: '1px solid #1A9E73', borderRadius: 8, padding: '10px 16px', color: '#1A9E73', fontWeight: 700, fontSize: 15 }}>
            🚀 Setup completato — MASTRO è pronto per il lancio!
          </div>
        )}
      </div>

      {STEPS.map(step => {
        const fatto = completati.has(step.id);
        const isAperto = aperto === step.id;
        return (
          <div key={step.id} style={{
            background: '#fff', borderRadius: 12, border: `2px solid ${fatto ? '#1A9E73' : isAperto ? '#D08008' : '#E5E3DC'}`,
            marginBottom: 10, overflow: 'hidden', transition: 'border-color 0.2s',
          }}>
            <div
              style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
              onClick={() => setAperto(isAperto ? '' : step.id)}
            >
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: fatto ? '#1A9E73' : '#F2F1EC',
                border: `2px solid ${fatto ? '#1A9E73' : '#E5E3DC'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: fatto ? '#fff' : '#9CA3AF',
                cursor: 'pointer',
              }}
                onClick={e => { e.stopPropagation(); toggle(step.id); }}
              >
                {fatto ? '✓' : '○'}
              </div>
              <span style={{ fontWeight: 600, fontSize: 15, color: fatto ? '#1A9E73' : '#1A1A1C', flex: 1 }}>
                {step.titolo}
              </span>
              <span style={{ color: '#9CA3AF', fontSize: 18 }}>{isAperto ? '▲' : '▼'}</span>
            </div>

            {isAperto && (
              <div style={{ padding: '0 18px 18px', borderTop: '1px solid #F2F1EC' }}>
                <ol style={{ margin: '12px 0 16px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {step.istruzioni.map((ins, i) => (
                    <li key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{ins}</li>
                  ))}
                </ol>
                <button
                  onClick={() => toggle(step.id)}
                  style={{
                    background: fatto ? '#F2F1EC' : '#1A9E73',
                    color: fatto ? '#6B7280' : '#fff',
                    border: 'none', borderRadius: 8, padding: '10px 20px',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {fatto ? '↩ Segna come da fare' : '✓ Segna come completato'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
