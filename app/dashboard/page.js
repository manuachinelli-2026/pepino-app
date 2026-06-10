'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

const AUTH_REDIRECT = '/login'

function PepinoWatermark({ size = 160 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 * 0.96
  const seeds = Array.from({ length: 11 }, (_, i) => {
    const a = (i * (360 / 11) - 90) * (Math.PI / 180)
    return { x: cx + r * 0.44 * Math.cos(a), y: cy + r * 0.44 * Math.sin(a) }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <circle cx={cx} cy={cy} r={r}        fill="var(--green)"/>
      <circle cx={cx} cy={cy} r={r * 0.83} fill="var(--panel)"/>
      <circle cx={cx} cy={cy} r={r * 0.74} fill="var(--green)"/>
      <circle cx={cx} cy={cy} r={r * 0.59} fill="var(--panel)"/>
      {seeds.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={r * 0.09} fill="var(--green)"/>)}
      <circle cx={cx} cy={cy} r={r * 0.11} fill="var(--green)"/>
    </svg>
  )
}

function Icon({ name, color = 'currentColor', size = 18 }) {
  const s = { stroke: color, fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    calendar: <><rect x="2" y="3" width="14" height="13" rx="2" {...s}/><path d="M2 8h14M6 1v4M12 1v4" {...s}/></>,
    clock:    <><circle cx="9" cy="9" r="7" {...s}/><path d="M9 5v4l3 2" {...s}/></>,
    person:   <><circle cx="9" cy="6" r="3.5" {...s}/><path d="M2 17a7 7 0 0114 0" {...s}/></>,
    settings: <><circle cx="9" cy="9" r="3" {...s}/><path d="M9 2v2M9 16v2M2 9h2M16 9h2M4.1 4.1l1.4 1.4M13.5 13.5l1.4 1.4M4.1 13.9l1.4-1.4M13.5 4.5l1.4-1.4" {...s}/></>,
    alert:    <><path d="M9 2L16.5 15H1.5z" {...s}/><path d="M9 8v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" fill="none"/><circle cx="9" cy="13" r="0.5" fill={color} stroke="none"/></>,
    check:    <path d="M2 9l5 5 9-9" {...s}/>,
    chevron:  <path d="M6 4l5 5-5 5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>,
  }
  return <svg width={size} height={size} viewBox="0 0 18 18" fill="none">{icons[name] || null}</svg>
}

function StatusBadge({ estado }) {
  const map = {
    confirmado: { dot: '#16A34A', bg: 'rgba(22,163,74,0.09)',  border: 'rgba(22,163,74,0.2)',  label: 'Confirmado' },
    pendiente:  { dot: '#D97706', bg: 'rgba(217,119,6,0.09)',  border: 'rgba(217,119,6,0.2)',  label: 'Pendiente'  },
    cancelado:  { dot: '#DC2626', bg: 'rgba(220,38,38,0.09)',  border: 'rgba(220,38,38,0.2)',  label: 'Cancelado'  },
  }
  const c = map[estado] ?? map.pendiente
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
      color: c.dot, background: c.bg, border: `1px solid ${c.border}`,
      padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.dot, display: 'inline-block', flexShrink: 0 }} />
      {c.label}
    </span>
  )
}

function formatDate(fechaStr) {
  const todayStr  = new Date().toISOString().split('T')[0]
  const tmrwStr   = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (fechaStr === todayStr) return 'Hoy'
  if (fechaStr === tmrwStr)  return 'Mañana'
  const [y, m, d] = fechaStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function StatCard({ label, value, loading, icon, iconColor, iconBg, iconBorder, sublabel }) {
  return (
    <div style={{
      background: 'var(--panel)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '22px 24px 20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    }}>
      <div style={{
        width: 40, height: 40, background: iconBg, border: `1px solid ${iconBorder}`,
        borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18,
      }}>
        <Icon name={icon} color={iconColor} size={18} />
      </div>
      <div style={{
        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8,
      }}>{label}</div>
      <div style={{
        fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6,
        color: loading ? 'var(--border-2)' : 'var(--text-1)',
      }}>
        {loading ? '—' : value}
      </div>
      {sublabel && (
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{sublabel}</div>
      )}
    </div>
  )
}

function AppointmentRow({ turno, isLast }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{ width: 52, flexShrink: 0, textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700,
          color: 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1.1,
        }}>
          {turno.hora ? turno.hora.slice(0, 5) : '—'}
        </div>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2,
        }}>
          {formatDate(turno.fecha)}
        </div>
      </div>
      <div style={{ width: 1, height: 32, background: 'var(--border)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {turno.cliente_nombre || 'Cliente sin nombre'}
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-3)', marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {turno.servicio_nombre || 'Servicio no especificado'}
        </div>
      </div>
      <StatusBadge estado={turno.estado} />
    </div>
  )
}

function ActionRow({ icon, iconColor, iconBg, iconBorder, title, desc, href, isLast }) {
  const router = useRouter()
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={() => router.push(href)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
        cursor: 'pointer', opacity: hover ? 0.8 : 1, transition: 'opacity 0.12s',
      }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        background: iconBg, border: `1px solid ${iconBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} color={iconColor} size={17} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)', marginBottom: 2, letterSpacing: '-0.01em' }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <Icon name="chevron" color="var(--text-3)" size={14} />
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser]             = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [waStatus, setWaStatus]     = useState('checking')

  const [turnosMes, setTurnosMes]           = useState(null)
  const [proximosTurnos, setProximosTurnos] = useState(null)
  const [contactosTotal, setContactosTotal] = useState(null)
  const [turnosList, setTurnosList]         = useState(null)
  const [acciones, setAcciones]             = useState(null)

  useEffect(() => {
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

  useEffect(() => {
    if (!user) return
    loadData(user.id)
  }, [user])

  async function loadData(uid) {
    const today  = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const y = today.getFullYear(), mo = today.getMonth()
    const startMonth = new Date(y, mo, 1).toISOString().split('T')[0]
    const endMonth   = new Date(y, mo + 1, 0).toISOString().split('T')[0]

    try {
      const [
        { count: mesCount },
        { count: contactCount },
        { count: proxCount },
        { data: list },
        { count: pendCount },
        { count: dispCount },
        { count: servCount },
      ] = await Promise.all([
        supabase.from('turnos').select('*', { count: 'exact', head: true })
          .eq('user_id', uid).gte('fecha', startMonth).lte('fecha', endMonth).neq('estado', 'cancelado'),
        supabase.from('contactos').select('*', { count: 'exact', head: true })
          .eq('user_id', uid),
        supabase.from('turnos').select('*', { count: 'exact', head: true })
          .eq('user_id', uid).gte('fecha', todayStr).neq('estado', 'cancelado'),
        supabase.from('turnos').select('id, fecha, hora, cliente_nombre, servicio_nombre, estado')
          .eq('user_id', uid).gte('fecha', todayStr).neq('estado', 'cancelado')
          .order('fecha', { ascending: true }).order('hora', { ascending: true }).limit(6),
        supabase.from('turnos').select('*', { count: 'exact', head: true })
          .eq('user_id', uid).eq('estado', 'pendiente').gte('fecha', todayStr),
        supabase.from('disponibilidad').select('*', { count: 'exact', head: true })
          .eq('user_id', uid).eq('activo', true),
        supabase.from('servicios').select('*', { count: 'exact', head: true })
          .eq('user_id', uid),
      ])

      setTurnosMes(mesCount ?? 0)
      setContactosTotal(contactCount ?? 0)
      setProximosTurnos(proxCount ?? 0)
      setTurnosList(list ?? [])

      const acts = []
      if (!dispCount) acts.push({
        icon: 'clock',
        iconColor: 'var(--green)',
        iconBg: 'var(--green-dim)',
        iconBorder: 'var(--green-border)',
        title: 'Configurá tu disponibilidad',
        desc: 'Sin horarios activos tu agente no puede gestionar turnos',
        href: '/agenda',
      })
      if (!servCount) acts.push({
        icon: 'settings',
        iconColor: '#EA580C',
        iconBg: 'rgba(234,88,12,0.08)',
        iconBorder: 'rgba(234,88,12,0.2)',
        title: 'Cargá tus servicios',
        desc: 'Tu agente necesita tus servicios para cotizar y agendar',
        href: '/agenda',
      })
      if (pendCount > 0) acts.push({
        icon: 'alert',
        iconColor: '#D97706',
        iconBg: 'rgba(217,119,6,0.08)',
        iconBorder: 'rgba(217,119,6,0.2)',
        title: `${pendCount} turno${pendCount > 1 ? 's' : ''} sin confirmar`,
        desc: 'Revisá los turnos pendientes de atención en Reservas',
        href: '/reservas',
      })
      setAcciones(acts)
    } catch (e) {
      console.error('Dashboard data error:', e)
      setTurnosMes(0)
      setContactosTotal(0)
      setProximosTurnos(0)
      setTurnosList([])
      setAcciones([])
    }
  }

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.15em' }}>Cargando...</div>
    </div>
  )

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const todayCap  = today.charAt(0).toUpperCase() + today.slice(1)
  const firstName = user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'equipo'
  const mesLabel  = new Date().toLocaleDateString('es-AR', { month: 'long' })
  const isConnected = waStatus === 'connected'
  const dataLoading = turnosMes === null

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '36px 40px 56px', maxWidth: 1200 }}>

          {/* ── HERO HEADER ─────────────────────────────────── */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            padding: '40px 48px',
            marginBottom: 20,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          }}>
            {/* Línea degradada superior — firma Pepino */}
            <div style={{
              position: 'absolute', top: 0, left: '6%', right: '6%', height: 1,
              background: 'linear-gradient(90deg, transparent, var(--green-border), transparent)',
            }} />

            {/* Halo verde — como en la landing */}
            <div style={{
              position: 'absolute', right: -80, top: -80,
              width: 340, height: 340,
              background: 'radial-gradient(circle, rgba(43,138,62,0.07) 0%, transparent 65%)',
              pointerEvents: 'none',
            }} />

            {/* Marca Pepino decorativa — watermark */}
            <div style={{
              position: 'absolute', right: 48, top: '50%',
              transform: 'translateY(-50%)',
              opacity: 0.065, pointerEvents: 'none',
              userSelect: 'none',
            }}>
              <PepinoWatermark size={156} />
            </div>

            {/* Contenido */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Eyebrow row con status inline */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18,
                fontFamily: 'var(--mono)', fontSize: 10,
                letterSpacing: '0.18em', textTransform: 'uppercase',
              }}>
                <span style={{ color: 'var(--green)' }}>Panel principal</span>

                {waStatus !== 'checking' && (
                  <>
                    <span style={{ color: 'var(--border-2)', fontWeight: 300 }}>·</span>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      color: isConnected ? '#16A34A' : 'var(--text-3)',
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
                        background: isConnected ? '#16A34A' : 'var(--border-2)',
                        boxShadow: isConnected ? '0 0 6px rgba(22,163,74,0.55)' : 'none',
                      }} />
                      {isConnected ? 'Agente activo' : 'WhatsApp desconectado'}
                    </span>
                  </>
                )}
              </div>

              {/* Saludo principal */}
              <h1 style={{
                margin: '0 0 10px',
                fontSize: 'clamp(30px, 3vw, 46px)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1.05,
                color: 'var(--text-1)',
              }}>
                ¡Hola,{' '}
                <em style={{ fontStyle: 'normal', color: 'var(--green)' }}>{firstName}</em>
                {' '}👋
              </h1>

              {/* Fecha */}
              <p style={{
                margin: 0, fontSize: 13, color: 'var(--text-3)',
                fontFamily: 'var(--mono)', letterSpacing: '0.04em',
              }}>
                {todayCap}
              </p>
            </div>
          </div>

          {/* ── METRIC CARDS ────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <StatCard
              label={`Turnos en ${mesLabel}`}
              value={turnosMes}
              loading={dataLoading}
              icon="calendar"
              iconColor="var(--green)"
              iconBg="var(--green-dim)"
              iconBorder="var(--green-border)"
              sublabel="Confirmados y pendientes del mes"
            />
            <StatCard
              label="Próximos turnos"
              value={proximosTurnos}
              loading={dataLoading}
              icon="clock"
              iconColor="#2563EB"
              iconBg="rgba(37,99,235,0.08)"
              iconBorder="rgba(37,99,235,0.18)"
              sublabel="Desde hoy en adelante"
            />
            <StatCard
              label="Contactos"
              value={contactosTotal}
              loading={dataLoading}
              icon="person"
              iconColor="#7C3AED"
              iconBg="rgba(124,58,237,0.08)"
              iconBorder="rgba(124,58,237,0.18)"
              sublabel="En tu base de datos"
            />
          </div>

          {/* ── CONTENT ROW ─────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 344px', gap: 16 }}>

            {/* Próximas citas */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '24px 24px 14px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
                    Próximas citas
                  </div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
                    Turnos agendados
                  </h2>
                </div>
                <button
                  onClick={() => router.push('/reservas')}
                  style={{
                    background: 'none', border: '1px solid var(--border-2)',
                    borderRadius: 8, padding: '6px 12px',
                    color: 'var(--text-2)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                  }}>
                  Ver todos →
                </button>
              </div>

              {turnosList === null ? (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.12em' }}>
                    Cargando...
                  </div>
                </div>
              ) : turnosList.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div style={{
                    width: 44, height: 44, background: 'var(--elevated)', borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                  }}>
                    <Icon name="calendar" color="var(--text-3)" size={18} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
                    Sin turnos próximos
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    Los turnos que gestione tu agente aparecerán acá
                  </div>
                </div>
              ) : (
                turnosList.map((t, i) => (
                  <AppointmentRow key={t.id} turno={t} isLast={i === turnosList.length - 1} />
                ))
              )}
            </div>

            {/* Acciones pendientes */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '24px 24px 14px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>
                  Pendiente
                </div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
                  Acciones requeridas
                </h2>
              </div>

              {acciones === null ? (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.12em' }}>
                    Cargando...
                  </div>
                </div>
              ) : acciones.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div style={{
                    width: 44, height: 44,
                    background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)',
                    borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}>
                    <Icon name="check" color="#16A34A" size={18} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
                    Todo está al día
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    No hay acciones pendientes por ahora
                  </div>
                </div>
              ) : (
                acciones.map((a, i) => (
                  <ActionRow key={i} {...a} isLast={i === acciones.length - 1} />
                ))
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
