'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

const AUTH_REDIRECT = '/login'

const C = {
  bg: '#0B0E0C',
  panel: '#11150F',
  elevated: '#161B12',
  green: '#A0FF79',
  text1: '#F4F7F2',
  text2: '#B6C4B2',
  text3: '#7E8C7C',
  border: '#243026',
  border2: '#324034',
  mono: '"JetBrains Mono Variable", "JetBrains Mono", monospace',
  sans: '"Funnel Sans Variable", "Funnel Sans", Inter, system-ui, sans-serif',
}

const METRICS = [
  {
    label: 'Conversaciones',
    value: '42',
    change: '+18%',
    icon: 'chat',
    iconBg: 'rgba(160,255,121,0.1)',
    iconBorder: 'rgba(160,255,121,0.15)',
    iconColor: '#A0FF79',
  },
  {
    label: 'Turnos agendados',
    value: '18',
    change: '+12%',
    icon: 'calendar',
    iconBg: 'rgba(167,139,250,0.1)',
    iconBorder: 'rgba(167,139,250,0.15)',
    iconColor: '#A78BFA',
  },
  {
    label: 'Clientes nuevos',
    value: '8',
    change: '+33%',
    icon: 'person',
    iconBg: 'rgba(96,165,250,0.1)',
    iconBorder: 'rgba(96,165,250,0.15)',
    iconColor: '#60A5FA',
  },
  {
    label: 'Tasa de conversión',
    value: '42%',
    change: '+6%',
    icon: 'arrowup',
    iconBg: 'rgba(251,146,60,0.1)',
    iconBorder: 'rgba(251,146,60,0.15)',
    iconColor: '#FB923C',
  },
]

const DONUT = [
  { name: 'Turnos', value: 42, color: '#A0FF79' },
  { name: 'Precios', value: 27, color: '#5ec47a' },
  { name: 'Horarios', value: 18, color: '#318c50' },
  { name: 'Servicios', value: 10, color: '#1a5032' },
  { name: 'Otros', value: 3, color: '#2d3d2e' },
]

const OPPS = [
  {
    icon: 'clock',
    iconBg: 'rgba(160,255,121,0.1)',
    iconBorder: 'rgba(160,255,121,0.15)',
    iconColor: '#A0FF79',
    title: 'Definí tu horario de atención',
    desc: '3 consultas no pudieron agendarse por falta de horario configurado',
  },
  {
    icon: 'star',
    iconBg: 'rgba(167,139,250,0.1)',
    iconBorder: 'rgba(167,139,250,0.15)',
    iconColor: '#A78BFA',
    title: 'Responde las reseñas pendientes',
    desc: '5 reseñas sin respuesta en Google My Business',
  },
  {
    icon: 'users',
    iconBg: 'rgba(96,165,250,0.1)',
    iconBorder: 'rgba(96,165,250,0.15)',
    iconColor: '#60A5FA',
    title: 'Activá campañas de reenganche',
    desc: '12 clientes sin visitar hace más de 30 días',
  },
  {
    icon: 'settings',
    iconBg: 'rgba(251,146,60,0.1)',
    iconBorder: 'rgba(251,146,60,0.15)',
    iconColor: '#FB923C',
    title: 'Completá tu perfil de servicios',
    desc: 'Tu agente no puede cotizar sin precios cargados',
  },
]

function Icon({ name, color, size = 18 }) {
  const s = { stroke: color, fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    chat:     <path d="M2 3a1 1 0 011-1h12a1 1 0 011 1v7a1 1 0 01-1 1h-5l-4 3V11H3a1 1 0 01-1-1V3z" {...s}/>,
    calendar: <><rect x="2" y="3" width="14" height="13" rx="2" {...s}/><path d="M2 8h14M6 1v4M12 1v4" {...s}/></>,
    person:   <><circle cx="9" cy="6" r="3.5" {...s}/><path d="M2 17a7 7 0 0114 0" {...s}/></>,
    arrowup:  <><path d="M9 16V3" {...s}/><path d="M4 8l5-5 5 5" {...s}/></>,
    clock:    <><circle cx="9" cy="9" r="7" {...s}/><path d="M9 5v4l3 2" {...s}/></>,
    star:     <path d="M9 2l2.2 6h6.3l-5.1 3.7 2 6.1L9 14.1l-5.4 3.7 2-6.1L.5 8h6.3z" {...s}/>,
    users:    <><circle cx="7" cy="6" r="3" {...s}/><path d="M1 16a6.5 4.5 0 0112 0" {...s}/><circle cx="13.5" cy="5.5" r="2.5" {...s}/><path d="M11.5 15.5a6 4 0 016 0" {...s}/></>,
    settings: <><circle cx="9" cy="9" r="3" {...s}/><path d="M9 2v2M9 14v2M2 9h2M14 9h2M4 4l1.5 1.5M12.5 12.5l1.5 1.5M4 14l1.5-1.5M12.5 5.5l1.5-1.5" {...s}/></>,
    chevron:  <path d="M7 5l4 4-4 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      {icons[name] || null}
    </svg>
  )
}

function MetricCard({ label, value, change, icon, iconBg, iconBorder, iconColor }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 24px 20px' }}>
      <div style={{ width: 40, height: 40, background: iconBg, border: `1px solid ${iconBorder}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        <Icon name={icon} color={iconColor} size={18} />
      </div>
      <div style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text2, marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', color: C.text1, lineHeight: 1, marginBottom: 12 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: iconColor }}>{change}</span>
        <span style={{ fontSize: 12, color: C.text3 }}>vs. mes anterior</span>
      </div>
    </div>
  )
}

function OppRow({ icon, iconBg, iconBorder, iconColor, title, desc, isLast }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: isLast ? 'none' : `1px solid ${C.border}`, transition: 'opacity 0.12s', opacity: hover ? 0.85 : 1 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} color={iconColor} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.text1, marginBottom: 3, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontSize: 12, color: C.text3, lineHeight: 1.45 }}>{desc}</div>
      </div>
      <button style={{ background: 'none', border: `1px solid ${C.border2}`, borderRadius: 8, padding: '5px 13px', color: C.text2, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
        Resolver
      </button>
      <Icon name="chevron" color={C.text3} size={14} />
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [waStatus, setWaStatus] = useState('checking')

  useEffect(() => {
    setMounted(true)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push(AUTH_REDIRECT); return }
      setUser(session.user)
      setAuthChecked(true)
    })
  }, [router])

  useEffect(() => {
    if (!authChecked) return
    const check = () => {
      fetch('/api/status')
        .then(r => r.json())
        .then(d => setWaStatus(d.state === 'open' ? 'connected' : 'disconnected'))
        .catch(() => setWaStatus('disconnected'))
    }
    check()
    const t = setInterval(check, 12000)
    return () => clearInterval(t)
  }, [authChecked])

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ fontFamily: C.mono, fontSize: 11, color: C.text3, letterSpacing: '0.15em' }}>Cargando...</div>
    </div>
  )

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1)
  const firstName = user?.user_metadata?.name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'equipo'

  const isConnected = waStatus === 'connected'

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, fontFamily: C.sans }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '36px 40px 48px', maxWidth: 1240 }}>

          {/* TOP ROW */}
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 32 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.text3, marginBottom: 10 }}>
                Panel principal
              </div>
              <h1 style={{ margin: '0 0 8px', fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', color: C.text1, lineHeight: 1.1 }}>
                ¡Hola, {firstName}! 👋
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: C.text3 }}>{todayCap}</p>
            </div>

            <div style={{ width: 272, flexShrink: 0, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: '20px 20px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: C.text1 }}>
                  {isConnected ? 'WhatsApp activo' : 'Conecta tu WhatsApp'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: waStatus === 'checking' ? C.text3 : isConnected ? '#22c55e' : '#ef4444',
                    boxShadow: isConnected ? '0 0 7px rgba(34,197,94,0.6)' : 'none',
                    transition: 'background 0.3s',
                  }} />
                  <span style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.text3 }}>
                    {waStatus === 'checking' ? 'verificando' : isConnected ? 'conectado' : 'no conectado'}
                  </span>
                </div>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: 12, color: C.text3, lineHeight: 1.5 }}>
                {isConnected
                  ? 'Tu agente está activo y respondiendo mensajes automáticamente.'
                  : 'Escaneá el QR con tu teléfono para activar el agente.'}
              </p>
              {!isConnected && (
                <div style={{ background: C.elevated, border: `1px dashed ${C.border2}`, borderRadius: 10, height: 88, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 14 }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect x="2" y="2" width="10" height="10" rx="1" stroke={C.text3} strokeWidth="1.5"/>
                    <rect x="4" y="4" width="6" height="6" fill={C.text3} rx="0.5"/>
                    <rect x="16" y="2" width="10" height="10" rx="1" stroke={C.text3} strokeWidth="1.5"/>
                    <rect x="18" y="4" width="6" height="6" fill={C.text3} rx="0.5"/>
                    <rect x="2" y="16" width="10" height="10" rx="1" stroke={C.text3} strokeWidth="1.5"/>
                    <rect x="4" y="18" width="6" height="6" fill={C.text3} rx="0.5"/>
                    <rect x="16" y="16" width="4" height="4" fill={C.text3} rx="0.5"/>
                    <rect x="22" y="16" width="4" height="4" fill={C.text3} rx="0.5"/>
                    <rect x="16" y="22" width="4" height="4" fill={C.text3} rx="0.5"/>
                    <rect x="22" y="22" width="4" height="4" fill={C.text3} rx="0.5"/>
                  </svg>
                  <span style={{ fontFamily: C.mono, fontSize: 9, color: C.text3, letterSpacing: '0.1em', textTransform: 'uppercase' }}>QR en conversaciones</span>
                </div>
              )}
              {isConnected && (
                <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
                  <span style={{ fontFamily: C.mono, fontSize: 10, color: '#22c55e', letterSpacing: '0.08em' }}>AGENTE ACTIVO</span>
                </div>
              )}
              <button
                onClick={() => router.push('/conversaciones')}
                style={{ width: '100%', background: 'rgba(160,255,121,0.07)', border: '1px solid rgba(160,255,121,0.18)', borderRadius: 9, padding: '8px 0', color: C.green, fontSize: 12, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}>
                {isConnected ? 'Ver conversaciones →' : 'Conectar ahora →'}
              </button>
            </div>
          </div>

          {/* METRICS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {METRICS.map(m => <MetricCard key={m.label} {...m} />)}
          </div>

          {/* CONTENT ROW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginBottom: 24 }}>

            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 24px 10px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text3, marginBottom: 6 }}>Accionables</div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: C.text1 }}>
                  Oportunidades para tu negocio
                </h2>
              </div>
              {OPPS.map((o, i) => (
                <OppRow key={i} {...o} isLast={i === OPPS.length - 1} />
              ))}
            </div>

            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: C.mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.text3, marginBottom: 6 }}>Distribución</div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: C.text1 }}>
                  Consultas por tipo
                </h2>
              </div>

              {mounted ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <PieChart width={176} height={176}>
                      <Pie
                        data={DONUT}
                        cx={88}
                        cy={88}
                        innerRadius={56}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                        strokeWidth={0}
                      >
                        {DONUT.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
                      </Pie>
                    </PieChart>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.05em', color: C.text1, lineHeight: 1 }}>42</div>
                      <div style={{ fontFamily: C.mono, fontSize: 9, color: C.text3, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>Total</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {DONUT.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: C.text2, flex: 1 }}>{d.name}</span>
                        <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 600, color: C.text3 }}>{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, letterSpacing: '0.12em' }}>Cargando...</span>
                </div>
              )}
            </div>
          </div>

          {/* BOTTOM BANNER */}
          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderLeft: '4px solid #A0FF79', borderRadius: 16, padding: '20px 28px 20px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(160,255,121,0.08)', border: '1px solid rgba(160,255,121,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 17V3" stroke="#A0FF79" strokeWidth="2" strokeLinecap="round"/>
                <path d="M4 9l6-6 6 6" stroke="#A0FF79" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', color: C.text1, marginBottom: 4 }}>
                ¡Buen trabajo esta semana!
              </div>
              <div style={{ fontSize: 13, color: C.text2, lineHeight: 1.5 }}>
                Tu agente IA resolvió el{' '}
                <strong style={{ color: C.green, fontWeight: 700 }}>91%</strong>
                {' '}de las consultas sin intervención. Seguís mejorando cada semana.
              </div>
            </div>
            <button
              style={{ background: 'none', border: '1px solid rgba(160,255,121,0.4)', borderRadius: 10, padding: '9px 20px', color: C.green, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(160,255,121,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              Ver más insights
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}
