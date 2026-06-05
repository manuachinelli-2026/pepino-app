'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const C = {
  bg: '#0B0E0C', panel: '#11150F', elevated: '#161B12',
  green: '#A0FF79', greenDim: 'rgba(160,255,121,0.10)',
  text1: '#F4F7F2', text2: '#B6C4B2', text3: '#7E8C7C',
  border: '#243026', border2: '#324034',
  mono: '"JetBrains Mono", monospace',
}

const METRICS = [
  { label: 'Conversaciones', value: '42', delta: '+18%' },
  { label: 'Turnos agendados', value: '18', delta: '+12%' },
  { label: 'Clientes nuevos', value: '8', delta: '+33%' },
  { label: 'Tasa de conversión', value: '42%', delta: '+6%' },
]

const PIE_DATA = [
  { name: 'Turnos', value: 42 },
  { name: 'Precios', value: 27 },
  { name: 'Horarios', value: 18 },
  { name: 'Servicios', value: 10 },
  { name: 'Otros', value: 3 },
]
const PIE_COLORS = ['#A0FF79', '#5ec47a', '#318c50', '#1a5032', '#243026']

const OPPS = [
  { icon: '↩', title: '3 clientes no respondidos hoy', desc: 'Retomá el contacto antes de que pierdan interés.', action: 'Enviar seguimiento' },
  { icon: '📈', title: 'Pico de consultas los martes 10-12hs', desc: 'Podés aprovechar ese horario para campañas.', action: 'Crear campaña' },
  { icon: '⭐', title: '2 reseñas pendientes de respuesta', desc: 'Responder rápido mejora tu reputación online.', action: 'Ver detalles' },
  { icon: '📅', title: 'Horario del martes está vacío', desc: 'Promocioná ese horario para atraer más turnos.', action: 'Ver horarios' },
]

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{ background: '#161B12', border: '1px solid #324034', borderRadius: 8, padding: '8px 12px', fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#F4F7F2' }}>
      <div>{payload[0].name}</div>
      <div style={{ color: '#A0FF79', fontWeight: 700 }}>{payload[0].value}%</div>
    </div>
  )
}

const AUTH_REDIRECT = '/login'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [waStatus, setWaStatus] = useState({ connected: false, state: 'loading' })
  const [mounted, setMounted] = useState(false)
  const today = new Date().toISOString().split('T')[0]

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
    const poll = async () => {
      try { const res = await fetch('/api/status'); setWaStatus(await res.json()) } catch {}
    }
    poll()
    const t = setInterval(poll, 8000)
    return () => clearInterval(t)
  }, [authChecked])

  const firstName = user?.user_metadata?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'usuario'

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ fontFamily: C.mono, fontSize: 11, color: C.text3, letterSpacing: '0.15em' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '32px 36px', maxWidth: 1100 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>¡Hola, {firstName}! 👋</h1>
              <p style={{ margin: '6px 0 0', color: C.text2, fontSize: 14 }}>Así está funcionando tu recepcionista IA hoy.</p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" defaultValue={today} style={{ background: C.panel, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '7px 12px', color: C.text1, fontFamily: C.mono, fontSize: 12, outline: 'none', cursor: 'pointer' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: waStatus.connected ? C.green : '#7E8C7C', flexShrink: 0 }} />
                <span style={{ fontFamily: C.mono, fontSize: 11, color: waStatus.connected ? C.green : C.text3 }}>
                  {waStatus.connected ? 'WhatsApp conectado' : 'No conectado'}
                </span>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
            {METRICS.map(m => (
              <div key={m.label} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 20px 16px' }}>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{m.label}</div>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', color: C.text1, marginBottom: 8 }}>{m.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: C.mono, fontSize: 11, color: C.green, fontWeight: 700 }}>{m.delta}</span>
                  <span style={{ fontFamily: C.mono, fontSize: 10, color: C.text3 }}>vs ayer</span>
                </div>
              </div>
            ))}
          </div>

          {/* Two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* Opportunities */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px' }}>
              <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.text3, marginBottom: 4 }}>Oportunidades</div>
              <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: C.text1 }}>Para tu negocio</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {OPPS.map((op, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px', background: C.elevated, borderRadius: 10, border: `1px solid ${C.border}`, alignItems: 'flex-start' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(160,255,121,0.08)', border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{op.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text1, marginBottom: 3 }}>{op.title}</div>
                      <div style={{ fontSize: 12, color: C.text3, marginBottom: 8, lineHeight: 1.4 }}>{op.desc}</div>
                      <button style={{ background: 'rgba(160,255,121,0.10)', border: '1px solid rgba(160,255,121,0.2)', color: C.green, borderRadius: 6, padding: '4px 10px', fontFamily: 'inherit', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{op.action}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Donut chart */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div>
                  <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.text3, marginBottom: 4 }}>Distribución</div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: C.text1 }}>Conversaciones por tema</h2>
                </div>
                <select style={{ background: C.elevated, border: `1px solid ${C.border2}`, borderRadius: 7, padding: '5px 10px', color: C.text2, fontFamily: C.mono, fontSize: 10, outline: 'none', cursor: 'pointer' }}>
                  <option>Últimos 7 días</option>
                  <option>Últimos 30 días</option>
                  <option>Este mes</option>
                </select>
              </div>
              <div style={{ height: 200, marginTop: 16 }}>
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={82} dataKey="value" paddingAngle={2}>
                        {PIE_DATA.map((entry, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="none" />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 12 }}>
                {PIE_DATA.map((item, i) => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i], flexShrink: 0 }} />
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: C.text2 }}>{item.name}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 10, color: C.text3 }}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Banner */}
          <div style={{ background: 'rgba(160,255,121,0.06)', border: '1px solid rgba(160,255,121,0.15)', borderRadius: 14, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 24 }}>🎉</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text1, marginBottom: 3 }}>¡Buen trabajo!</div>
                <div style={{ fontSize: 13, color: C.text2 }}>Tu agente IA resolvió el <span style={{ color: C.green, fontWeight: 700 }}>91%</span> de las conversaciones sin intervención humana.</div>
              </div>
            </div>
            <button style={{ background: 'rgba(160,255,121,0.12)', border: '1px solid rgba(160,255,121,0.25)', color: C.green, borderRadius: 8, padding: '8px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
              Ver más insights
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}
