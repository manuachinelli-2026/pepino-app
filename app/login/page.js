'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const C = {
  bg: '#0B0E0C',
  panel: '#11150F',
  green: '#A0FF79',
  greenDim: 'rgba(160,255,121,0.10)',
  text1: '#F4F7F2',
  text2: '#B6C4B2',
  text3: '#7E8C7C',
  border: '#243026',
  border2: '#324034',
  mono: '"JetBrains Mono", monospace',
}

function PepinoMark({ size = 40 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 * 0.96
  const seeds = Array.from({ length: 11 }, (_, i) => {
    const a = (i * (360 / 11) - 90) * (Math.PI / 180)
    return { x: cx + r * 0.44 * Math.cos(a), y: cy + r * 0.44 * Math.sin(a) }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle cx={cx} cy={cy} r={r} fill="#A0FF79"/>
      <circle cx={cx} cy={cy} r={r * 0.83} fill="#0B0E0C"/>
      <circle cx={cx} cy={cy} r={r * 0.74} fill="#A0FF79"/>
      <circle cx={cx} cy={cy} r={r * 0.59} fill="#0B0E0C"/>
      {seeds.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={r * 0.09} fill="#A0FF79"/>)}
      <circle cx={cx} cy={cy} r={r * 0.11} fill="#A0FF79"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError('Credenciales incorrectas. Revisá tu email y contraseña.')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 24,
        padding: '48px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <PepinoMark size={56} />
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: C.text1 }}>
            Pepino
            <span style={{ fontFamily: C.mono, fontSize: '0.55em', color: C.green, verticalAlign: 'super', letterSpacing: 0 }}>AI</span>
          </div>
          <div style={{ fontFamily: C.mono, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.text3 }}>
            Panel de agentes
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.text3 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@email.com"
              style={{
                background: '#0B0E0C',
                border: `1px solid ${error ? '#4a2020' : C.border2}`,
                borderRadius: 10,
                padding: '12px 16px',
                color: C.text1,
                fontFamily: '"Funnel Sans", system-ui, sans-serif',
                fontSize: 15,
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e => e.target.style.borderColor = error ? '#4a2020' : C.border2}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.text3 }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                background: '#0B0E0C',
                border: `1px solid ${error ? '#4a2020' : C.border2}`,
                borderRadius: 10,
                padding: '12px 16px',
                color: C.text1,
                fontFamily: '"Funnel Sans", system-ui, sans-serif',
                fontSize: 15,
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = C.green}
              onBlur={e => e.target.style.borderColor = error ? '#4a2020' : C.border2}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(74,32,32,0.4)',
              border: '1px solid #4a2020',
              borderRadius: 8,
              padding: '10px 14px',
              color: '#ff6b6b',
              fontFamily: C.mono,
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              background: loading ? C.greenDim : C.green,
              color: '#0B0E0C',
              border: 'none',
              borderRadius: 10,
              padding: '14px',
              fontFamily: '"Funnel Sans", system-ui, sans-serif',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}