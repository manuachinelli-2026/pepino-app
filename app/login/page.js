'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const C = {
  bg:       '#0B0E0C',
  panel:    '#11150F',
  elevated: '#161B12',
  green:    '#A0FF79',
  greenDim: 'rgba(160,255,121,0.10)',
  greenBorder: 'rgba(160,255,121,0.22)',
  text1:    '#F4F7F2',
  text2:    '#B6C4B2',
  text3:    '#7E8C7C',
  border:   '#243026',
  border2:  '#324034',
  mono:     'var(--mono)',
  sans:     'var(--sans)',
}

function PepinoMark({ size = 52 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 * 0.96
  const seeds = Array.from({ length: 11 }, (_, i) => {
    const a = (i * (360 / 11) - 90) * (Math.PI / 180)
    return { x: cx + r * 0.44 * Math.cos(a), y: cy + r * 0.44 * Math.sin(a) }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle cx={cx} cy={cy} r={r}        fill="#A0FF79"/>
      <circle cx={cx} cy={cy} r={r * 0.83} fill="#0B0E0C"/>
      <circle cx={cx} cy={cy} r={r * 0.74} fill="#A0FF79"/>
      <circle cx={cx} cy={cy} r={r * 0.59} fill="#0B0E0C"/>
      {seeds.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={r * 0.09} fill="#A0FF79"/>)}
      <circle cx={cx} cy={cy} r={r * 0.11} fill="#A0FF79"/>
    </svg>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, hasError }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={{
        fontFamily: C.mono, fontSize: 10,
        letterSpacing: '0.15em', textTransform: 'uppercase', color: C.text3,
      }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        style={{
          background: C.elevated,
          border: `1px solid ${hasError ? '#5a1f1f' : focused ? C.green : C.border2}`,
          borderRadius: 11,
          padding: '12px 16px',
          color: C.text1,
          fontFamily: C.sans,
          fontSize: 15,
          outline: 'none',
          transition: 'border-color 0.15s',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

function Wrapper({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
      fontFamily: C.sans,
    }}>
      {/* Halo central */}
      <div style={{
        position: 'absolute', width: 640, height: 640, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(160,255,121,0.10) 0%, transparent 65%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }} />
      {children}
    </div>
  )
}

/* ── Panel container ── */
function Panel({ children }) {
  return (
    <div style={{
      width: '100%', maxWidth: 420,
      background: C.panel, border: `1px solid ${C.border}`,
      borderRadius: 24, padding: '48px 40px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Línea verde top */}
      <div style={{
        position: 'absolute', top: 0, left: '18%', right: '18%', height: 1,
        background: 'linear-gradient(90deg, transparent, #A0FF79, transparent)',
      }} />
      {children}
    </div>
  )
}

/* ── Logo block ── */
function Logo({ subtitle }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 36 }}>
      <PepinoMark size={52} />
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: C.text1, textAlign: 'center', lineHeight: 1 }}>
          Pepino
          <span style={{ fontFamily: C.mono, fontSize: '0.52em', color: C.green, verticalAlign: 'super', letterSpacing: 0, marginLeft: 1 }}>AI</span>
        </div>
        <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.text3, marginTop: 8, textAlign: 'center' }}>
          {subtitle}
        </div>
      </div>
    </div>
  )
}

/* ── Error box ── */
function ErrorBox({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(90,31,31,0.35)', border: '1px solid #5a1f1f',
      borderRadius: 9, padding: '10px 14px',
      color: '#ff8080', fontFamily: C.mono, fontSize: 11, lineHeight: 1.55,
    }}>
      {msg}
    </div>
  )
}

/* ── Mode toggle link ── */
function ModeToggle({ onSwitch, isLogin }) {
  const [hover, setHover] = useState(false)
  return (
    <p style={{ margin: '28px 0 0', fontSize: 13, color: C.text3, textAlign: 'center' }}>
      {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
      <button
        type="button"
        onClick={onSwitch}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: 'none', border: 'none', padding: 0,
          color: hover ? C.text1 : C.green,
          fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
          cursor: 'pointer', transition: 'color 0.15s',
          textDecoration: 'none',
        }}
      >
        {isLogin ? 'Crear cuenta →' : 'Ingresar →'}
      </button>
    </p>
  )
}

/* ═══════════════════════════════════════════════ */

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'success'

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [signupEmail, setSignupEmail] = useState('') // guardado para el success screen

  const reset = (newMode) => {
    setMode(newMode)
    setError('')
    setName('')
    setEmail('')
    setPassword('')
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) {
      setError('Email o contraseña incorrectos.')
    } else {
      router.push('/dashboard')
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    setLoading(false)
    if (err) {
      if (err.message?.toLowerCase().includes('already registered')) {
        setError('Ya existe una cuenta con ese email.')
      } else {
        setError(err.message)
      }
    } else {
      setSignupEmail(email)
      setMode('success')
    }
  }

  /* ── Success ── */
  if (mode === 'success') {
    return (
      <Wrapper>
        <Panel>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0 }}>
            {/* Ícono check con halo */}
            <div style={{ position: 'relative', marginBottom: 28 }}>
              <div style={{
                position: 'absolute', inset: -16, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(160,255,121,0.14) 0%, transparent 70%)',
              }} />
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: C.greenDim, border: `1px solid ${C.greenBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M5 14l6 6L23 8" stroke={C.green} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            <div style={{
              fontFamily: C.mono, fontSize: 10, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: C.green, marginBottom: 12,
            }}>
              Cuenta creada
            </div>

            <h2 style={{
              margin: '0 0 12px', fontSize: 26, fontWeight: 800,
              letterSpacing: '-0.03em', color: C.text1, lineHeight: 1.1,
            }}>
              ¡Revisá tu email!
            </h2>

            <p style={{ margin: '0 0 8px', fontSize: 14, color: C.text2, lineHeight: 1.6, maxWidth: 300 }}>
              Te enviamos un link de confirmación a:
            </p>
            <div style={{
              fontFamily: C.mono, fontSize: 12, color: C.green,
              background: C.greenDim, border: `1px solid ${C.greenBorder}`,
              borderRadius: 8, padding: '6px 14px', marginBottom: 28,
            }}>
              {signupEmail}
            </div>

            <p style={{ margin: '0 0 32px', fontSize: 13, color: C.text3, lineHeight: 1.6, maxWidth: 280 }}>
              Una vez confirmada tu cuenta, podés ingresar desde acá.
            </p>

            <button
              onClick={() => reset('login')}
              style={{
                width: '100%', background: C.greenDim, border: `1px solid ${C.greenBorder}`,
                borderRadius: 11, padding: '13px', color: C.green,
                fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(160,255,121,0.16)'}
              onMouseLeave={e => e.currentTarget.style.background = C.greenDim}
            >
              Ir al login
            </button>
          </div>
        </Panel>
      </Wrapper>
    )
  }

  const isLogin = mode === 'login'

  /* ── Login / Signup ── */
  return (
    <Wrapper>
      <Panel>
        <Logo subtitle={isLogin ? 'Panel de agentes' : 'Crear una cuenta'} />

        <form
          onSubmit={isLogin ? handleLogin : handleSignup}
          style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          {/* Name — solo en signup */}
          {!isLogin && (
            <Field
              label="Nombre"
              type="text"
              value={name}
              onChange={setName}
              placeholder="Tu nombre"
              autoComplete="name"
              hasError={!!error}
            />
          )}

          <Field
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="tu@email.com"
            autoComplete="email"
            hasError={!!error}
          />

          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            hasError={!!error}
          />

          <ErrorBox msg={error} />

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              background: loading ? C.greenDim : C.green,
              color: '#0B0E0C',
              border: 'none', borderRadius: 11,
              padding: '14px',
              fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s, background 0.15s',
              opacity: loading ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.opacity = '1' }}
          >
            {loading
              ? (isLogin ? 'Ingresando...' : 'Creando cuenta...')
              : (isLogin ? 'Ingresar' : 'Crear cuenta')}
          </button>
        </form>

        <ModeToggle isLogin={isLogin} onSwitch={() => reset(isLogin ? 'signup' : 'login')} />
      </Panel>
    </Wrapper>
  )
}
