'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const NAV = [
  { label: 'Dashboard',      href: '/dashboard',     icon: 'grid'     },
  { label: 'Conversaciones', href: '/conversaciones', icon: 'chat'     },
  { label: 'Turnos',         href: '/turnos',         icon: 'calendar' },
  { label: 'Agenda',         href: '/agenda',         icon: 'clock'    },
]

const NAV_SOON = [
  { label: 'Mi Agente',     icon: 'bot'      },
  { label: 'Reseñas',       icon: 'star'     },
  { label: 'Integraciones', icon: 'plug'     },
  { label: 'Configuración', icon: 'gear'     },
]

function NavIcon({ name, size = 14 }) {
  const p = { stroke: 'currentColor', fill: 'none', strokeWidth: '1.4', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    grid:     <><rect x="2" y="2" width="4" height="4" rx="0.5" {...p}/><rect x="8" y="2" width="4" height="4" rx="0.5" {...p}/><rect x="2" y="8" width="4" height="4" rx="0.5" {...p}/><rect x="8" y="8" width="4" height="4" rx="0.5" {...p}/></>,
    chat:     <path d="M2 3a1 1 0 011-1h8a1 1 0 011 1v5a1 1 0 01-1 1H6L3 12V9H3a1 1 0 01-1-1V3z" {...p}/>,
    calendar: <><rect x="2" y="2" width="10" height="10" rx="1" {...p}/><path d="M2 6h10M5 1v2M9 1v2" {...p}/></>,
    clock:    <><circle cx="7" cy="7" r="5" {...p}/><path d="M7 4v3l2 1.5" {...p}/></>,
    bot:      <><rect x="3" y="4" width="8" height="6" rx="1" {...p}/><path d="M5 10v2M9 10v2M5 7h.01M9 7h.01M7 2v2M5 2h4" {...p}/></>,
    star:     <path d="M7 1l1.5 4H13l-3.5 2.5L11 12 7 9.5 3 12l1.5-4.5L1 5h4.5z" {...p}/>,
    plug:     <><path d="M5 1v3M9 1v3M4 4h6l-.7 4a2 2 0 01-4.6 0L4 4zM7 11v2" {...p}/></>,
    gear:     <><circle cx="7" cy="7" r="2.5" {...p}/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4" {...p}/></>,
    logout:   <><path d="M9 2h3a1 1 0 011 1v8a1 1 0 01-1 1H9M6 10l3-3-3-3M9 7H1" {...p}/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      {icons[name]}
    </svg>
  )
}

function PepinoMark({ size = 26 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 * 0.96
  const seeds = Array.from({ length: 11 }, (_, i) => {
    const a = (i * (360 / 11) - 90) * (Math.PI / 180)
    return { x: cx + r * 0.44 * Math.cos(a), y: cy + r * 0.44 * Math.sin(a) }
  })
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r}          fill="#A0FF79"/>
      <circle cx={cx} cy={cy} r={r * 0.83}   fill="#0B0E0C"/>
      <circle cx={cx} cy={cy} r={r * 0.74}   fill="#A0FF79"/>
      <circle cx={cx} cy={cy} r={r * 0.59}   fill="#0B0E0C"/>
      {seeds.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={r * 0.09} fill="#A0FF79"/>)}
      <circle cx={cx} cy={cy} r={r * 0.11}   fill="#A0FF79"/>
    </svg>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: '"JetBrains Mono Variable", "JetBrains Mono", monospace',
      fontSize: 9,
      fontWeight: 500,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#7E8C7C',
      padding: '0 10px',
      marginBottom: 4,
      marginTop: 18,
    }}>
      {children}
    </div>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()
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

  const userName  = user?.user_metadata?.name || user?.email?.split('@')[0] || 'usuario'
  const userEmail = user?.email || ''
  const initial   = userName[0].toUpperCase()

  return (
    <aside style={{
      width: 228,
      flexShrink: 0,
      background: '#11150F',
      borderRight: '1px solid #243026',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      userSelect: 'none',
    }}>

      {/* Logo */}
      <div style={{ padding: '18px 14px 16px', borderBottom: '1px solid #243026' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PepinoMark size={26} />
          <span style={{
            fontWeight: 800,
            fontSize: 15,
            letterSpacing: '-0.025em',
            color: '#F4F7F2',
            lineHeight: 1,
          }}>
            Pepino
            <span style={{
              fontFamily: '"JetBrains Mono Variable","JetBrains Mono",monospace',
              fontSize: '0.52em',
              color: '#A0FF79',
              verticalAlign: 'super',
              marginLeft: 1,
            }}>AI</span>
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 0' }}>

        <SectionLabel>Panel</SectionLabel>

        {NAV.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} style={{ display: 'block', marginBottom: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 7,
                borderLeft: `2px solid ${active ? '#A0FF79' : 'transparent'}`,
                background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                color: active ? '#F4F7F2' : '#B6C4B2',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                transition: 'background 0.12s, color 0.12s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </div>
            </Link>
          )
        })}

        <div style={{ margin: '16px 2px 0', borderTop: '1px solid #243026' }} />

        <SectionLabel>Próximamente</SectionLabel>

        {NAV_SOON.map(item => (
          <div key={item.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 10px',
            borderRadius: 7,
            borderLeft: '2px solid transparent',
            color: '#7E8C7C',
            fontSize: 13,
            fontWeight: 400,
            opacity: 0.6,
            cursor: 'default',
            marginBottom: 1,
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <NavIcon name={item.icon} />
              {item.label}
            </div>
            <span style={{
              fontFamily: '"JetBrains Mono Variable","JetBrains Mono",monospace',
              fontSize: 8,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#324034',
              background: '#161B12',
              border: '1px solid #243026',
              padding: '2px 5px',
              borderRadius: 4,
            }}>Pronto</span>
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid #243026' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '8px 10px',
          borderRadius: 9,
          background: '#161B12',
          border: '1px solid #243026',
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(160,255,121,0.1)',
            border: '1px solid rgba(160,255,121,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#A0FF79',
            flexShrink: 0,
            fontFamily: '"JetBrains Mono Variable","JetBrains Mono",monospace',
          }}>{initial}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#F4F7F2',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
            }}>{userName}</div>
            <div style={{
              fontFamily: '"JetBrains Mono Variable","JetBrains Mono",monospace',
              fontSize: 9,
              color: '#7E8C7C',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>{userEmail}</div>
          </div>

          <button
            onClick={handleSignOut}
            title="Cerrar sesión"
            style={{
              background: 'none',
              border: 'none',
              color: '#7E8C7C',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              transition: 'color 0.12s',
              borderRadius: 5,
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
            onMouseLeave={e => e.currentTarget.style.color = '#7E8C7C'}
          >
            <NavIcon name="logout" size={13} />
          </button>
        </div>
      </div>
    </aside>
  )
}
