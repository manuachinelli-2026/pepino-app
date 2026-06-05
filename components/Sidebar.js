'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#0B0E0C', panel: '#11150F', elevated: '#161B12',
  green: '#A0FF79', text1: '#F4F7F2', text2: '#B6C4B2', text3: '#7E8C7C',
  border: '#243026', border2: '#324034',
  mono: '"JetBrains Mono", monospace',
}

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  { label: 'Conversaciones', href: '/conversaciones', icon: 'chat' },
  { label: 'Turnos', href: '/turnos', icon: 'calendar' },
  { label: 'Agenda', href: '/agenda', icon: 'clock' },
  { label: 'Oportunidades', href: '/oportunidades', icon: 'target' },
  { label: 'Mi Agente', href: '/agente', icon: 'bot' },
  { label: 'Reseñas', href: '/resenas', icon: 'star' },
  { label: 'Integraciones', href: '/integraciones', icon: 'plug' },
  { label: 'Negocio', href: '/negocio', icon: 'building' },
  { label: 'Facturación', href: '/facturacion', icon: 'card' },
  { label: 'Configuración', href: '/configuracion', icon: 'gear' },
]

function NavIcon({ name, color }) {
  const p = { stroke: color, fill: 'none', strokeWidth: '1.3', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    grid: <><rect x="2" y="2" width="4" height="4" rx="0.5" {...p}/><rect x="8" y="2" width="4" height="4" rx="0.5" {...p}/><rect x="2" y="8" width="4" height="4" rx="0.5" {...p}/><rect x="8" y="8" width="4" height="4" rx="0.5" {...p}/></>,
    chat: <path d="M2 3a1 1 0 011-1h8a1 1 0 011 1v5a1 1 0 01-1 1H6L3 12V9H3a1 1 0 01-1-1V3z" {...p}/>,
    calendar: <><rect x="2" y="2" width="10" height="10" rx="1" {...p}/><path d="M2 6h10M5 1v2M9 1v2" {...p}/></>,
    clock: <><circle cx="7" cy="7" r="5" {...p}/><path d="M7 4v3l2 1.5" {...p}/></>,
    target: <><circle cx="7" cy="7" r="5" {...p}/><circle cx="7" cy="7" r="2" {...p}/></>,
    bot: <><rect x="3" y="4" width="8" height="6" rx="1" {...p}/><path d="M5 10v2M9 10v2M5 7h.01M9 7h.01M7 2v2M5 2h4" {...p}/></>,
    star: <path d="M7 1l1.5 4H13l-3.5 2.5L11 12 7 9.5 3 12l1.5-4.5L1 5h4.5z" {...p}/>,
    plug: <><path d="M5 1v3M9 1v3M4 4h6l-.7 4a2 2 0 01-4.6 0L4 4zM7 11v2" {...p}/></>,
    building: <><path d="M2 12V4a1 1 0 011-1h8a1 1 0 011 1v8M1 12h12M5 5h.01M9 5h.01M5 8h.01M9 8h.01" {...p}/><path d="M5 12V10h4v2" {...p}/></>,
    card: <><rect x="1" y="3" width="12" height="8" rx="1" {...p}/><path d="M1 7h12" {...p}/></>,
    gear: <><circle cx="7" cy="7" r="2.5" {...p}/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4" {...p}/></>,
  }
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      {icons[name]}
    </svg>
  )
}

function PepinoMark({ size = 28 }) {
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

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const userInitial = (user?.user_metadata?.name || user?.email || '?')[0].toUpperCase()
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuario'
  const userEmail = user?.email || ''

  return (
    <aside style={{ width: 240, flexShrink: 0, background: C.panel, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
      <div style={{ padding: '20px 16px 14px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
          <PepinoMark size={28} />
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: C.text1 }}>
            Pepino<span style={{ fontFamily: C.mono, fontSize: '0.52em', color: C.green, verticalAlign: 'super' }}>AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: C.elevated, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(160,255,121,0.15)', border: '1px solid rgba(160,255,121,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.green, flexShrink: 0 }}>G</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, lineHeight: 1.2 }}>Green Studio</div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.text3 }}>Mi negocio</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {NAV.map(item => {
          const active = pathname === item.href
          const color = active ? C.green : C.text2
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 7, background: active ? 'rgba(160,255,121,0.09)' : 'transparent', border: `1px solid ${active ? 'rgba(160,255,121,0.18)' : 'transparent'}`, color, fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', transition: 'all 0.12s' }}>
                <NavIcon name={item.icon} color={color} />
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '10px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', background: C.elevated, borderRadius: 8, border: `1px solid ${C.border}` }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(160,255,121,0.12)', border: '1px solid rgba(160,255,121,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: C.green, flexShrink: 0 }}>{userInitial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
          </div>
          <button onClick={handleSignOut} title="Salir" style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, padding: 3, display: 'flex', lineHeight: 1 }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
            onMouseLeave={e => e.currentTarget.style.color = C.text3}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
              <path d="M9 2h3a1 1 0 011 1v8a1 1 0 01-1 1H9M6 10l3-3-3-3M9 7H1"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
