'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

const AUTH_REDIRECT = '/login'

const METRICS = [
  {
    label: 'Conversaciones',
    value: '42',
    change: '+18%',
    iconFile: '/icons/conversaciones.svg',
    iconColor: '#A0FF79',
  },
  {
    label: 'Turnos agendados',
    value: '18',
    change: '+12%',
    iconFile: '/icons/turnos-agendados.svg',
    iconColor: '#A78BFA',
  },
  {
    label: 'Clientes nuevos',
    value: '8',
    change: '+33%',
    iconFile: '/icons/clientes-nuevos.svg',
    iconColor: '#60A5FA',
  },
  {
    label: 'Tasa de conversión',
    value: '42%',
    change: '+6%',
    iconFile: '/icons/tasa-conversion.svg',
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
  const half = size / 2
  const icons = {
    chat: (
      <path
        d={`M2.5 3.5a1 1 0 011-1h${size - 6}a1 1 0 011 1v${half - 1}a1 1 0 01-1 1H${half + 1}l-${half - 1} ${half - 3}V${half + 1.5}h-1a1 1 0 01-1-1V3.5z`}
        {...s}
      />
    ),
    calendar: (
      <>
        <rect x="2" y="3" width={size - 4} height={size - 4} rx="2" {...s} />
        <path d={`M2 8h${size - 4}M6 1v3M${size - 6} 1v3`} {...s} />
      </>
    ),
    person: (
      <>
        <circle cx={half} cy="5.5" r="3" {...s} />
        <path d={`M2.5 ${size - 1}a${half - 2.5} 5.5 0 01${size - 5} 0`} {...s} />
      </>
    ),
    arrowup: (
      <>
        <path d={`M${half} ${size - 2}V2`} {...s} />
        <path d={`M4 7l${half - 4}-5 ${half - 4} 5`} {...s} />
      </>
    ),
    clock: (
      <>
        <circle cx={half} cy={half} r={half - 1} {...s} />
        <path d={`M${half} ${half - 3}v3l2.5 1.5`} {...s} />
      </>
    ),
    star: (
      <path
        d={`M${half} 1.5l${1.8} 5.5h5.7l-4.6 3.3 1.7 5.3-4.8-3.1-4.8 3.1 1.7-5.3L1.5 7h5.7z`}
        {...s}
      />
    ),
    users: (
      <>
        <circle cx="7" cy="5" r="3" {...s} />
        <path d="M1 17a6 6 0 0112 0" {...s} />
        <path d="M14 4a3 3 0 010 6" {...s} />
        <path d="M18 17a6 6 0 00-4-5.6" {...s} />
      </>
    ),
    settings: (
      <>
        <circle cx={half} cy={half} r="3" {...s} />
        <path
          d={`M${half} 1v2M${half} ${size - 3}v2M1 ${half}h2M${size - 3} ${half}h2M3.5 3.5l1.4 1.4M${size - 4.9} ${size - 4.9}l1.4 1.4M3.5 ${size - 4.5}l1.4-1.4M${size - 4.9} 4.9l1.4-1.4`}
          {...s}
        />
      </>
    ),
    chevron: (
      <path d={`M6 3l6 6-6 6`} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    arrowgreen: (
      <>
        <path d={`M${half} ${size - 2}V2`} {...s} />
        <path d={`M4 ${half - 1}l${half - 4}-${half - 1} ${half - 4} ${half - 1}`} {...s} />
      </>
    ),
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      {icons[name] || null}
    </svg>
  )
}

function MetricCard({ label, value, change, iconFile, icon, iconBg, iconBorder, iconColor }) {
  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 24px 20px' }}>
      {iconFile ? (
        <img src={iconFile} width={44} height={44} alt="" style={{ borderRadius: 12, marginBottom: 20, display: 'block' }} />
      ) : (
        <div style={{ width: 40, height: 40, background: iconBg, border: `1px solid ${iconBorder}`, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Icon name={icon} color={iconColor} size={18} />
        </div>
      )}
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-2)', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--text-1)', lineHeight: 1, marginBottom: 12 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: iconColor }}>{change}</span>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>vs. mes anterior</span>
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
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: isLast ? 'none' : '1px solid var(--border)', transition: 'opacity 0.12s', opacity: hover ? 0.85 : 1 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: iconBg, border: `1px solid ${iconBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} color={iconColor} size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-1)', marginBottom: 3, letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.45 }}>{desc}</div>
      </div>
      <button style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 8, padding: '5px 13px', color: 'var(--text-2)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
        Resolver
      </button>
      <Icon name="chevron" color="var(--text-3)" size={14} />
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push(AUTH_REDIRECT); return }
      setUser(session.user)
      setAuthChecked(true)
    })
  }, [router])

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.15em' }}>Cargando...</div>
    </div>
  )

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCap = today.charAt(0).toUpperCase() + today.slice(1)
  const firstName = user?.user_metadata?.name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || 'equipo'

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '36px 40px 48px', maxWidth: 1240 }}>

          {/* ──── GREETING ──── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 10 }}>
              Panel principal
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: 34, fontWeight: 800, letterSpacing: '-0.035em', color: 'var(--text-1)', lineHeight: 1.1 }}>
              ¡Hola, {firstName}! 👋
            </h1>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-3)' }}>{todayCap}</p>
          </div>

          {/* ──── METRICS ──── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {METRICS.map(m => <MetricCard key={m.label} {...m} />)}
          </div>

          {/* ──── CONTENT ROW ──── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginBottom: 24 }}>

            {/* Opportunities */}
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, padding: '24px 24px 10px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Accionables</div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
                  Oportunidades para tu negocio
                </h2>
              </div>
              {OPPS.map((o, i) => (
                <OppRow key={i} {...o} isLast={i === OPPS.length - 1} />
              ))}
            </div>

            {/* Donut chart */}
            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Distribución</div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
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
                      <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--text-1)', lineHeight: 1 }}>42</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 4 }}>Total</div>
                    </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
                    {DONUT.map(d => (
                      <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: 'var(--text-2)', flex: 1 }}>{d.name}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.12em' }}>Cargando...</span>
                </div>
              )}
            </div>
          </div>

          {/* ──── BOTTOM BANNER ──── */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderLeft: '4px solid var(--green)', borderRadius: 16, padding: '20px 28px 20px 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: 'var(--green-dim)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 17V3" stroke="var(--green)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M4 9l6-6 6 6" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', color: 'var(--text-1)', marginBottom: 4 }}>
                ¡Buen trabajo esta semana!
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
                Tu agente IA resolvió el{' '}
                <strong style={{ color: 'var(--green)', fontWeight: 700 }}>91%</strong>
                {' '}de las consultas sin intervención. Seguís mejorando cada semana.
              </div>
            </div>
            <button
              style={{ background: 'none', border: '1px solid var(--green-border)', borderRadius: 10, padding: '9px 20px', color: 'var(--green)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--green-dim)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}>
              Ver más insights
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}
