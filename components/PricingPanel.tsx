'use client';
import { useState } from 'react';
import { STRIPE_PLANS, PlanKey } from '@/lib/stripe';

interface PricingPanelProps {
  currentPlan?: PlanKey;
  onSelect?: (plan: PlanKey) => void;
  mode?: 'onboarding' | 'settings';
  loading?: boolean;
}

const CHECK = '✓';

export default function PricingPanel({
  currentPlan,
  onSelect,
  mode = 'onboarding',
  loading = false,
}: PricingPanelProps) {
  const [selecting, setSelecting] = useState<PlanKey | null>(null);

  const handleSelect = async (plan: PlanKey) => {
    if (loading || selecting) return;
    setSelecting(plan);
    try {
      if (onSelect) {
        onSelect(plan);
        return;
      }
      // Default: chiama checkout API
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }}>
      {mode === 'onboarding' && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-block',
            background: '#D1FAE5',
            color: '#1A9E73',
            borderRadius: 20,
            padding: '6px 16px',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 8,
          }}>
            30 giorni gratis · Nessuna carta richiesta adesso
          </div>
          <p style={{ color: '#6B7280', fontSize: 14, margin: 0 }}>
            Scegli il piano. Puoi cambiare in qualsiasi momento.
          </p>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}>
        {(Object.entries(STRIPE_PLANS) as [PlanKey, typeof STRIPE_PLANS[PlanKey]][]).map(([key, plan]) => {
          const isCurrentPlan = currentPlan === key;
          const isBest = 'bestSeller' in plan && plan.bestSeller;
          const isSelecting = selecting === key;

          return (
            <div
              key={key}
              style={{
                background: '#fff',
                border: `2px solid ${isBest ? '#3B7FE0' : isCurrentPlan ? '#1A9E73' : '#E5E3DC'}`,
                borderRadius: 12,
                padding: 20,
                position: 'relative',
                cursor: isCurrentPlan ? 'default' : 'pointer',
                transition: 'box-shadow 0.15s',
                boxShadow: isBest ? '0 4px 16px rgba(59,127,224,0.15)' : 'none',
              }}
              onClick={() => !isCurrentPlan && handleSelect(key)}
            >
              {isBest && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#3B7FE0',
                  color: '#fff',
                  borderRadius: 20,
                  padding: '3px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  PIÙ SCELTO
                </div>
              )}

              {isCurrentPlan && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  right: 16,
                  background: '#1A9E73',
                  color: '#fff',
                  borderRadius: 20,
                  padding: '3px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                }}>
                  ATTIVO
                </div>
              )}

              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: plan.color,
                marginBottom: 10,
              }} />

              <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1A1C', marginBottom: 4 }}>
                {plan.name}
              </div>

              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#1A1A1C' }}>
                  €{plan.price}
                </span>
                <span style={{ fontSize: 13, color: '#6B7280' }}>/mese</span>
              </div>

              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16, lineHeight: 1.4 }}>
                {plan.description}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {plan.features.map((f: string) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151' }}>
                    <span style={{ color: '#1A9E73', fontWeight: 700, fontSize: 12 }}>{CHECK}</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                disabled={isCurrentPlan || !!selecting}
                style={{
                  width: '100%',
                  padding: '10px 0',
                  borderRadius: 8,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: isCurrentPlan ? 'default' : 'pointer',
                  background: isCurrentPlan
                    ? '#E5E3DC'
                    : isBest
                    ? '#3B7FE0'
                    : '#1A1A1C',
                  color: isCurrentPlan ? '#6B7280' : '#fff',
                  transition: 'opacity 0.15s',
                  opacity: isSelecting ? 0.7 : 1,
                }}
              >
                {isCurrentPlan
                  ? 'Piano attuale'
                  : isSelecting
                  ? 'Attendere...'
                  : mode === 'onboarding'
                  ? 'Inizia gratis 30 giorni'
                  : 'Passa a questo piano'}
              </button>
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 20 }}>
        Fatturazione mensile · Disdici quando vuoi · Carta richiesta solo dopo il trial
      </p>
    </div>
  );
}
