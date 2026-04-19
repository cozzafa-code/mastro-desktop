'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

// â”€â”€ ICONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const IcoShield = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)
const IcoPhone = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)
const IcoKey = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
  </svg>
)
const IcoCheck = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)
const IcoX = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)
const IcoCopy = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
)

// â”€â”€ TYPES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type MfaFactor = { id: string; type: string; status: string; created_at: string }
type Step = 'idle' | 'setup_qr' | 'verify' | 'done'

// â”€â”€ CARD COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16,
      border: '1px solid #E8E7E1', padding: '24px',
      ...style
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 36, height: 36, background: '#F2F1EC',
        borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#1A1A1C',
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#1A1A1C' }}>{title}</span>
      {badge && (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px',
          background: '#ECFDF5', color: '#1A9E73', borderRadius: 20,
        }}>
          {badge}
        </span>
      )}
    </div>
  )
}

// â”€â”€ MAIN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function SecuritySettings() {
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const [factors, setFactors] = useState<MfaFactor[]>([])
  const [step, setStep] = useState<Step>('idle')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [factorId, setFactorId] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [sessions, setSessions] = useState<any[]>([])

  const enrolledFactor = factors.find(f => f.status === 'verified')

  useEffect(() => { loadFactors() }, [])

  const loadFactors = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    if (data) setFactors(data.totp || [])
  }

  // Avvia setup 2FA
  const startSetup = async () => {
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'MASTRO ERP' })
    if (error) { setError(error.message); setLoading(false); return }
    setQrCode(data.totp.qr_code)
    setSecret(data.totp.secret)
    setFactorId(data.id)
    setStep('setup_qr')
    setLoading(false)
  }

  // Verifica OTP
  const verifyOtp = async () => {
    if (otp.length !== 6) return
    setLoading(true)
    setError('')
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
    if (!challenge) { setError('Errore challenge'); setLoading(false); return }
    const { error } = await supabase.auth.mfa.verify({
      factorId, challengeId: challenge.id, code: otp
    })
    if (error) { setError('Codice non valido. Riprova.'); setLoading(false); return }
    await loadFactors()
    setStep('done')
    setLoading(false)
  }

  // Rimuovi 2FA
  const removeFactor = async () => {
    if (!enrolledFactor) return
    if (!confirm('Disabilitare il 2FA? Il tuo account sarÃ  meno sicuro.')) return
    setLoading(true)
    await supabase.auth.mfa.unenroll({ factorId: enrolledFactor.id })
    await loadFactors()
    setStep('idle')
    setLoading(false)
  }

  const copySecret = () => {
    navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cardStyle: React.CSSProperties = {
    fontFamily: "'Inter', system-ui, sans-serif",
    background: '#F2F1EC', minHeight: '100%', padding: 0,
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1A1A1C', margin: '0 0 24px' }}>
        Sicurezza account
      </h2>

      {/* 2FA */}
      <Card style={{ marginBottom: 16 }}>
        <SectionTitle
          icon={<IcoShield />}
          title="Autenticazione a due fattori (2FA)"
          badge={enrolledFactor ? 'Attiva' : undefined}
        />

        {!enrolledFactor && step === 'idle' && (
          <div>
            <p style={{ fontSize: 14, color: '#6B6B6B', margin: '0 0 20px', lineHeight: 1.6 }}>
              Aggiungi un secondo livello di sicurezza. Dopo il login ti verrÃ  chiesto
              un codice dall'app Google Authenticator o Authy.
            </p>
            <button
              onClick={startSetup}
              disabled={loading}
              style={{
                padding: '10px 20px', background: '#1A1A1C', color: '#fff',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {loading ? 'Caricamento...' : 'Attiva 2FA'}
            </button>
          </div>
        )}

        {step === 'setup_qr' && (
          <div>
            <p style={{ fontSize: 14, color: '#6B6B6B', margin: '0 0 16px' }}>
              Scansiona il QR code con <strong>Google Authenticator</strong> o <strong>Authy</strong>.
            </p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {/* QR Code */}
              <div style={{
                border: '2px solid #E8E7E1', borderRadius: 12, padding: 12,
                background: '#fff', flexShrink: 0,
              }}>
                <img src={qrCode} alt="QR Code 2FA" style={{ width: 160, height: 160, display: 'block' }} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontSize: 13, color: '#6B6B6B', margin: '0 0 10px' }}>
                  Non riesci a scansionare? Inserisci il codice manualmente:
                </p>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#F2F1EC', borderRadius: 8, padding: '10px 14px',
                }}>
                  <code style={{ fontSize: 12, color: '#1A1A1C', flex: 1, wordBreak: 'break-all' }}>
                    {secret}
                  </code>
                  <button onClick={copySecret} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: copied ? '#1A9E73' : '#6B6B6B', flexShrink: 0,
                  }}>
                    {copied ? <IcoCheck /> : <IcoCopy />}
                  </button>
                </div>
                <button
                  onClick={() => setStep('verify')}
                  style={{
                    marginTop: 16, padding: '10px 20px',
                    background: '#D08008', color: '#1A1A1C',
                    border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Ho scansionato â†’
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'verify' && (
          <div>
            <p style={{ fontSize: 14, color: '#6B6B6B', margin: '0 0 16px' }}>
              Inserisci il codice a 6 cifre dall'app per confermare l'attivazione.
            </p>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{
                  width: 140, padding: '12px 16px', fontSize: 20, letterSpacing: '0.3em',
                  textAlign: 'center', border: `2px solid ${error ? '#DC4444' : '#E8E7E1'}`,
                  borderRadius: 8, outline: 'none', fontFamily: 'inherit',
                }}
              />
              <button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                style={{
                  padding: '12px 20px', background: otp.length === 6 ? '#1A9E73' : '#E8E7E1',
                  color: otp.length === 6 ? '#fff' : '#9B9B9B',
                  border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                  cursor: otp.length === 6 ? 'pointer' : 'default', fontFamily: 'inherit',
                }}
              >
                {loading ? '...' : 'Verifica'}
              </button>
            </div>
            {error && <p style={{ color: '#DC4444', fontSize: 13, marginTop: 8 }}>{error}</p>}
          </div>
        )}

        {(step === 'done' || enrolledFactor) && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 16px', background: '#ECFDF5',
              borderRadius: 10, border: '1px solid #A7F3D0', marginBottom: 16,
            }}>
              <div style={{
                width: 24, height: 24, background: '#1A9E73', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
              }}>
                <IcoCheck />
              </div>
              <span style={{ fontSize: 14, color: '#065F46', fontWeight: 500 }}>
                2FA attivo â€” il tuo account Ã¨ protetto
              </span>
            </div>
            <button
              onClick={removeFactor}
              disabled={loading}
              style={{
                padding: '8px 16px', background: 'transparent',
                border: '1.5px solid #DC4444', color: '#DC4444',
                borderRadius: 8, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Disabilita 2FA
            </button>
          </div>
        )}
      </Card>

      {/* Password */}
      <Card>
        <SectionTitle icon={<IcoKey />} title="Password" />
        <p style={{ fontSize: 14, color: '#6B6B6B', margin: '0 0 16px' }}>
          Cambia la password del tuo account MASTRO.
        </p>
        <ChangePasswordForm supabase={supabase} />
      </Card>
    </div>
  )
}

// â”€â”€ CHANGE PASSWORD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ChangePasswordForm({ supabase }: { supabase: any }) {
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  const submit = async () => {
    if (newPwd.length < 8) { setMsg('Minimo 8 caratteri'); setStatus('error'); return }
    if (newPwd !== confirm) { setMsg('Le password non coincidono'); setStatus('error'); return }
    setStatus('loading')
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    if (error) { setMsg(error.message); setStatus('error'); return }
    setMsg('Password aggiornata')
    setStatus('ok')
    setNewPwd('')
    setConfirm('')
  }

  return (
    <div style={{ maxWidth: 360 }}>
      <div style={{ marginBottom: 12 }}>
        <input
          type="password"
          value={newPwd}
          onChange={e => setNewPwd(e.target.value)}
          placeholder="Nuova password (min. 8 caratteri)"
          style={{
            width: '100%', padding: '11px 14px', border: '1.5px solid #E8E7E1',
            borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          placeholder="Conferma nuova password"
          style={{
            width: '100%', padding: '11px 14px', border: '1.5px solid #E8E7E1',
            borderRadius: 8, fontSize: 14, fontFamily: 'inherit',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
      {msg && (
        <p style={{ fontSize: 13, color: status === 'ok' ? '#1A9E73' : '#DC4444', margin: '0 0 12px' }}>
          {msg}
        </p>
      )}
      <button
        onClick={submit}
        disabled={status === 'loading'}
        style={{
          padding: '10px 20px', background: '#1A1A1C', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {status === 'loading' ? 'Salvataggio...' : 'Aggiorna password'}
      </button>
    </div>
  )
}

