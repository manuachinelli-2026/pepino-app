'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

const WA = '5491123290927'
const waLink = name => `https://wa.me/${WA}?text=${encodeURIComponent(`Hola 👋 me interesa contratar a ${name}. ¿Me pueden dar más información?`)}`

const AGENTS = [
  {
    id: 'paco',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    name: 'Paco',
    role: 'Gestor de Turnos',
    tagline: 'Nunca más un turno sin confirmar.',
    desc: 'Paco atiende los mensajes de tus clientes, consulta tu agenda en tiempo real y reserva el primer hueco disponible sin que tengas que intervenir. Antes de cada turno manda un recordatorio automático para que nadie falte.',
    features: [
      'Responde y reserva turnos en segundos',
      'Consulta tu disponibilidad en tiempo real',
      'Recordatorios automáticos antes de cada turno',
      'Gestiona cambios y cancelaciones sin vos',
    ],
    price: '95 €',
    priceNote: 'al mes',
    active: false,
    color: '#A0FF79',
  },
  {
    id: 'mateo',
    photo: 'https://randomuser.me/api/portraits/men/57.jpg',
    name: 'Mateo',
    role: 'Especialista en Ocupación',
    tagline: 'Tu agenda siempre llena.',
    desc: 'Mateo detecta los huecos libres antes de que se pierdan. Localiza clientes anteriores que llevan tiempo sin venir y los contacta con el mensaje justo en el momento oportuno, convirtiendo tiempo muerto en ingresos.',
    features: [
      'Detecta huecos libres automáticamente',
      'Reactiva clientes que no han vuelto',
      'Manda promociones personalizadas por WhatsApp',
      'Aumenta tu facturación sin esfuerzo extra',
    ],
    price: '79 €',
    priceNote: 'al mes',
    active: false,
    color: '#64a0ff',
  },
  {
    id: 'lucciano',
    photo: 'https://randomuser.me/api/portraits/men/22.jpg',
    name: 'Lucciano',
    role: 'Especialista en Reputación',
    tagline: 'Tu reputación online en piloto automático.',
    desc: 'Lucciano cuida la relación con tus clientes después de cada visita. Les pregunta por su experiencia, recoge el feedback y los guía a dejar una reseña en Google, construyendo tu reputación mientras vos trabajás.',
    features: [
      'Seguimiento automático tras cada turno',
      'Pide reseñas en Google de forma natural',
      'Gestiona el feedback de cada cliente',
      'Mejora tu puntuación online mes a mes',
    ],
    price: '69 €',
    priceNote: 'al mes',
    active: false,
    color: '#ffb432',
  },
  {
    id: 'erica',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    name: 'Erica',
    role: 'Agente de Delivery',
    tagline: 'Tu delivery, tomado y pagado solo.',
    desc: 'Erica atiende los pedidos de tus clientes por WhatsApp, les presenta el menú, informa precios y medios de pago, y genera la comanda automáticamente. Sin llamadas, sin errores, sin demoras.',
    features: [
      'Toma pedidos y consultas las 24 horas',
      'Informa precios y opciones al instante',
      'Comparte link de pago o medios de pago',
      'Genera la comanda lista para cocina',
    ],
    price: '89 €',
    priceNote: 'al mes',
    active: false,
    color: '#ff7eb3',
  },
  {
    id: 'elton',
    photo: 'https://randomuser.me/api/portraits/men/10.jpg',
    name: 'Elton',
    role: 'Creador de Sitios Web',
    tagline: 'Tu web lista en menos de 24 horas.',
    desc: 'Elton habla con vos por WhatsApp, te hace las preguntas clave y construye tu sitio web desde cero. Sin reuniones, sin formularios largos, sin esperas. En menos de un día tenés una web profesional, limpia y lista para publicar.',
    features: [
      'Chat directo para entender tu negocio',
      'Diseño personalizado a tu imagen',
      'Entrega garantizada en menos de 24 horas',
      'Lista para publicar con tu dominio',
    ],
    price: 'Desde 75 €',
    priceNote: 'pago único',
    active: false,
    color: '#c084fc',
  },
]

function AgentCard({ agent, expanded, onToggle }) {
  const accentAlpha = (hex, a) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
    return `rgba(${r},${g},${b},${a})`
  }

  return (
    <div style={{
      background: 'var(--panel)',
      border: agent.active
        ? `1.5px solid ${accentAlpha(agent.color, 0.5)}`
        : '1px solid var(--border-2)',
      borderRadius: 20,
      overflow: 'hidden',
      transition: 'box-shadow 0.2s',
      boxShadow: agent.active
        ? `0 4px 24px ${accentAlpha(agent.color, 0.12)}`
        : '0 2px 8px rgba(0,0,0,0.04)',
    }}>

      {/* Active banner */}
      {agent.active && (
        <div style={{ background: accentAlpha(agent.color, 0.1), borderBottom: `1px solid ${accentAlpha(agent.color, 0.2)}`, padding: '7px 20px', display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: agent.color, boxShadow: `0 0 6px ${agent.color}` }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: agent.color, letterSpacing: '0.05em' }}>Activo · Contratado</span>
        </div>
      )}

      {/* Card main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', cursor: 'pointer' }} onClick={onToggle}>
        {/* Photo */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <img src={agent.photo} alt={agent.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `2.5px solid ${agent.active ? accentAlpha(agent.color, 0.6) : 'var(--border-2)'}` }} />
          {agent.active && (
            <div style={{ position: 'absolute', bottom: 1, right: 1, width: 14, height: 14, borderRadius: '50%', background: agent.color, border: '2px solid var(--panel)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M1 4l2.2 2.2L7 1.5" stroke="#0B0E0C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{agent.name}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: agent.active ? agent.color : 'var(--text-3)', background: agent.active ? accentAlpha(agent.color, 0.1) : 'var(--elevated)', border: `1px solid ${agent.active ? accentAlpha(agent.color, 0.25) : 'var(--border-2)'}`, borderRadius: 6, padding: '2px 7px', letterSpacing: '0.04em' }}>
              {agent.role}
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-3)', fontStyle: 'italic' }}>"{agent.tagline}"</div>
        </div>

        {/* Price */}
        <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: agent.active ? agent.color : 'var(--text-1)', letterSpacing: '-0.02em', lineHeight: 1 }}>{agent.price}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{agent.priceNote}</div>
        </div>

        {/* Chevron */}
        <div style={{ color: 'var(--text-3)', fontSize: 18, transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>›</div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '18px 20px 20px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Description + features */}
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ margin: '0 0 14px', fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.65 }}>{agent.desc}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {agent.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: accentAlpha(agent.color, 0.12), border: `1px solid ${accentAlpha(agent.color, 0.3)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: agent.color }} />
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 10, minWidth: 180 }}>
            {agent.active ? (
              <>
                <div style={{ background: accentAlpha(agent.color, 0.08), border: `1px solid ${accentAlpha(agent.color, 0.2)}`, borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: agent.color, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>Activo desde</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>jun 2026</div>
                </div>
                <a href="https://wa.me/5491123290927" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', background: 'var(--elevated)', border: '1px solid var(--border-2)', borderRadius: 11, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none' }}>
                  Hablar con soporte
                </a>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>Suma este agente a tu equipo</div>
                <a href={waLink(agent.name)} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'block', textAlign: 'center', background: agent.color, color: '#0B0E0C', border: 'none', borderRadius: 11, padding: '12px 16px', fontSize: 14, fontWeight: 800, textDecoration: 'none', boxShadow: `0 4px 16px ${accentAlpha(agent.color, 0.3)}` }}>
                  Contratar a {agent.name}
                </a>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AgentesPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [expanded, setExpanded]       = useState('paco')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setAuthChecked(true)
    })
  }, [router])

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Cargando...</div>
    </div>
  )

  const active  = AGENTS.filter(a => a.active)
  const upsell  = AGENTS.filter(a => !a.active)

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <Sidebar />

      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px 48px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 6 }}>Panel</div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>Mis Agentes</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-3)' }}>Tus agentes IA trabajando en WhatsApp.</p>
        </div>

        {/* Active agents */}
        <section style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#A0FF79', boxShadow: '0 0 6px #A0FF79' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Activos · {active.length} agente{active.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {active.map(a => (
              <AgentCard key={a.id} agent={a} expanded={expanded === a.id} onToggle={() => setExpanded(expanded === a.id ? null : a.id)} />
            ))}
          </div>
        </section>

        {/* Upsell */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Disponibles para contratar · {upsell.length} agentes</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upsell.map(a => (
              <AgentCard key={a.id} agent={a} expanded={expanded === a.id} onToggle={() => setExpanded(expanded === a.id ? null : a.id)} />
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
