'use client';
import { useState } from 'react';
import { OnboardingData, defaultOnboardingData } from './onboarding/types';
import Step1Azienda from './onboarding/Step1Azienda';
import Step2Brand from './onboarding/Step2Brand';
import Step3Team from './onboarding/Step3Team';
import Step4Import from './onboarding/Step4Import';
import Step5Piano from './onboarding/Step5Piano';
import { useRouter } from 'next/navigation';

const T = "#28A0A0";
const DARK = "#0D1F1F";
const DARK2 = "#156060";

const FliwoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" width="36" height="36">
    <g><rect x="95" y="15" width="8" height="8" rx="2" fill="#2FA7A2"/>
    <rect x="128" y="24" width="8" height="8" rx="2" fill="#7ED957"/>
    <rect x="152" y="48" width="8" height="8" rx="2" fill="#28A0A0"/>
    <rect x="162" y="93" width="8" height="8" rx="2" fill="#7ED957"/>
    <rect x="152" y="138" width="8" height="8" rx="2" fill="#28A0A0"/>
    <rect x="128" y="162" width="8" height="8" rx="2" fill="#7ED957"/>
    <rect x="95" y="172" width="8" height="8" rx="2" fill="#2FA7A2"/>
    <rect x="62" y="162" width="8" height="8" rx="2" fill="#28A0A0"/>
    <rect x="38" y="138" width="8" height="8" rx="2" fill="#7ED957"/>
    <rect x="28" y="93" width="8" height="8" rx="2" fill="#28A0A0"/>
    <rect x="38" y="48" width="8" height="8" rx="2" fill="#7ED957"/>
    <rect x="62" y="24" width="8" height="8" rx="2" fill="#28A0A0"/></g>
    <g transform="rotate(8 100 100)">
      <rect x="55" y="55" width="90" height="90" rx="22" fill="#2FA7A2"/>
      <path d="M70 70 L130 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
      <path d="M130 70 L70 130" stroke="#F2F1EC" strokeWidth="18" strokeLinecap="round"/>
    </g>
  </svg>
);

const STEP_ICONS = [
  // 1 Azienda
  <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  // 2 Brand
  <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>,
  // 3 Team
  <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  // 4 Clienti
  <svg key="4" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  // 5 Piano
  <svg key="5" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
];

const STEPS = [
  { n: 1, label: 'Azienda' },
  { n: 2, label: 'Brand' },
  { n: 3, label: 'Team' },
  { n: 4, label: 'Clienti' },
  { n: 5, label: 'Piano' },
];

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const router = useRouter();
  const update = (partial: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...partial }));
  const next = () => setStep(s => Math.min(s + 1, 5));
  const skip = () => next();
  const complete = () => router.push('/dashboard');

  return (
    <div style={{
      minHeight: '100vh',
      background: '#E8F4F4',
      backgroundImage: 'linear-gradient(rgba(40,160,160,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(40,160,160,.12) 1px,transparent 1px)',
      backgroundSize: '24px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
      paddingBottom: 40,
      fontFamily: 'system-ui,-apple-system,sans-serif',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <FliwoxIcon />
        <span style={{ fontSize: 24, fontWeight: 900, color: DARK, letterSpacing: -0.5 }}>
          fliwo<span style={{ color: T }}>X</span>
        </span>
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 28, padding: '0 16px' }}>
        {STEPS.map((s, i) => {
          const done = step > s.n;
          const active = step === s.n;
          return (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: done ? T : active ? DARK : 'rgba(13,31,31,0.08)',
                  border: `2px solid ${done || active ? T : 'rgba(13,31,31,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: done || active ? '#fff' : '#4A7070',
                  boxShadow: active ? `0 4px 12px ${T}50` : 'none',
                  transition: 'all 0.2s',
                }}>
                  {done
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <div style={{ color: done || active ? '#fff' : '#4A7070' }}>{STEP_ICONS[i]}</div>
                  }
                </div>
                <span style={{ fontSize: 10, fontWeight: active ? 800 : 500, color: active ? DARK : '#4A7070', whiteSpace: 'nowrap' }}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: 20, height: 2, background: done ? T : 'rgba(13,31,31,0.15)', borderRadius: 1, marginBottom: 14, transition: 'background 0.3s' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: step === 5 ? 800 : 440,
        padding: '0 16px',
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: `1px solid rgba(40,160,160,0.2)`,
          boxShadow: '0 8px 32px rgba(13,31,31,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
          padding: '28px 24px',
        }}>
          {step === 1 && <Step1Azienda data={data} onChange={update} onNext={next} />}
          {step === 2 && <Step2Brand data={data} onChange={update} onNext={next} onSkip={skip} />}
          {step === 3 && <Step3Team data={data} onChange={update} onNext={next} />}
          {step === 4 && <Step4Import data={data} onChange={update} onNext={next} onSkip={skip} />}
          {step === 5 && <Step5Piano data={data} onChange={update} onComplete={complete} />}
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: '#4A7070', fontWeight: 500 }}>
          Passo {step} di 5 &nbsp;&middot;&nbsp; I tuoi dati sono al sicuro
        </p>
      </div>

    </div>
  );
}
