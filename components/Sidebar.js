'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const NAV = [
  { label: 'Dashboard',      href: '/dashboard',     icon: 'grid'     },
  { label: 'Conversaciones', href: '/conversaciones', icon: 'chat'     },
  { label: 'Contactos',      href: '/contactos',      icon: 'person'   },
  { label: 'Reservas',       href: '/reservas',       icon: 'calendar' },
  { label: 'Agenda',         href: '/agenda',         icon: 'clock'    },
  { label: 'Mis Agentes',    href: '/agentes',        icon: 'bot'      },
]

function NavIcon({ name, size = 14 }) {
  const p = { stroke: 'currentColor', fill: 'none', strokeWidth: '1.4', strokeLinecap: 'round', strokeLinejoin: 'round' }
  const icons = {
    grid:     <><rect x="2" y="2" width="4" height="4" rx="0.5" {...p}/><rect x="8" y="2" width="4" height="4" rx="0.5" {...p}/><rect x="2" y="8" width="4" height="4" rx="0.5" {...p}/><rect x="8" y="8" width="4" height="4" rx="0.5" {...p}/></>,
    chat:     <path d="M2 3a1 1 0 011-1h8a1 1 0 011 1v5a1 1 0 01-1 1H6L3 12V9H3a1 1 0 01-1-1V3z" {...p}/>,
    calendar: <><rect x="2" y="2" width="10" height="10" rx="1" {...p}/><path d="M2 6h10M5 1v2M9 1v2" {...p}/></>,
    clock:    <><circle cx="7" cy="7" r="5" {...p}/><path d="M7 4v3l2 1.5" {...p}/></>,
    bot:      <><rect x="3" y="4" width="8" height="6" rx="1" {...p}/><path d="M5 10v2M9 10v2M5 7h.01M9 7h.01M7 2v2M5 2h4" {...p}/></>,
    logout:   <path d="M9 2h3a1 1 0 011 1v8a1 1 0 01-1 1H9M6 10l3-3-3-3M9 7H1" {...p}/>,
    card:     <><rect x="1" y="3" width="12" height="8" rx="1" {...p}/><path d="M1 7h12" {...p}/></>,
    person:   <><circle cx="7" cy="5" r="3" {...p}/><path d="M1 13a6 6 0 0112 0" {...p}/></>,
    sun:      <><circle cx="7" cy="7" r="3" {...p}/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.9 2.9l1.4 1.4M9.7 9.7l1.4 1.4M2.9 11.1l1.4-1.4M9.7 4.3l1.4-1.4" {...p}/></>,
    moon:     <path d="M11 7A5 5 0 116 2a4 4 0 005 5z" {...p}/>,
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
      <circle cx={cx} cy={cy} r={r}        fill="var(--green)"/>
      <circle cx={cx} cy={cy} r={r * 0.83} fill="var(--bg)"/>
      <circle cx={cx} cy={cy} r={r * 0.74} fill="var(--green)"/>
      <circle cx={cx} cy={cy} r={r * 0.59} fill="var(--bg)"/>
      {seeds.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={r * 0.09} fill="var(--green)"/>)}
      <circle cx={cx} cy={cy} r={r * 0.11} fill="var(--green)"/>
    </svg>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--mono)',
      fontSize: 9, fontWeight: 500,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: 'var(--text-3)',
      padding: '0 10px',
      marginBottom: 4, marginTop: 18,
    }}>
      {children}
    </div>
  )
}

function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === 'light'
  return (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
        color: 'var(--text-2)', fontSize: 13,
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--elevated)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <NavIcon name={isLight ? 'sun' : 'moon'} size={13} />
        <span>{isLight ? 'Modo claro' : 'Modo oscuro'}</span>
      </div>
      {/* Toggle pill */}
      <div style={{
        width: 32, height: 18, borderRadius: 99,
        background: isLight ? 'var(--green)' : 'var(--elevated)',
        border: '1px solid var(--border-2)',
        position: 'relative', transition: 'background 0.2s',
        flexShrink: 0,
      }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: isLight ? 'var(--bg)' : 'var(--text-3)',
          position: 'absolute', top: 2,
          left: isLight ? 16 : 2,
          transition: 'left 0.2s, background 0.2s',
        }} />
      </div>
    </div>
  )
}

export default function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [user, setUser]         = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [theme, setTheme]       = useState('light')
  const menuRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    localStorage.removeItem('pepino-theme')
  }, [])

  // Cerrar al click afuera
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const userName  = user?.user_metadata?.name || user?.email?.split('@')[0] || 'usuario'
  const userEmail = user?.email || ''
  const initial   = userName[0].toUpperCase()

  return (
    <aside style={{
      width: 228, flexShrink: 0,
      background: 'var(--panel)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      height: '100vh', position: 'sticky', top: 0,
      userSelect: 'none',
    }}>

      {/* Logo */}
      <div style={{ padding: '18px 14px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PepinoMark size={26} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.025em', color: 'var(--text-1)', lineHeight: 1 }}>
            Pepino
            <span style={{ fontFamily: 'var(--mono)', fontSize: '0.52em', color: 'var(--green)', verticalAlign: 'super', marginLeft: 1 }}>AI</span>
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
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 10px', borderRadius: 7,
                  borderLeft: `2px solid ${active ? 'var(--green)' : 'transparent'}`,
                  background: active ? 'var(--green-dim)' : 'transparent',
                  color: active ? 'var(--text-1)' : 'var(--text-2)',
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--elevated)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* User + popup */}
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--border)', position: 'relative' }} ref={menuRef}>

        {/* Popup menu */}
        {menuOpen && (
          <div style={{
            position: 'absolute', bottom: 'calc(100% + 4px)',
            left: 8, right: 8,
            background: 'var(--elevated)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 6,
            boxShadow: '0 -8px 32px rgba(0,0,0,0.35)',
            zIndex: 50,
          }}>
            {[
              { label: 'Facturación',       icon: 'card'   },
              { label: 'Datos de la cuenta', icon: 'person' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 12px', borderRadius: 8,
                color: 'var(--text-2)', fontSize: 13, cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--panel)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <NavIcon name={item.icon} size={13} />
                {item.label}
              </div>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

            <ThemeToggle theme={theme} onToggle={toggleTheme} />

            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

            <div
              onClick={handleSignOut}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '8px 12px', borderRadius: 8,
                color: '#ff6b6b', fontSize: 13, cursor: 'pointer',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,107,107,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <NavIcon name="logout" size={13} />
              Cerrar sesión
            </div>
          </div>
        )}

        {/* User card */}
        <div
          onClick={() => setMenuOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', borderRadius: 9,
            background: menuOpen ? 'var(--elevated)' : 'var(--elevated)',
            border: `1px solid ${menuOpen ? 'var(--border-2)' : 'var(--border)'}`,
            cursor: 'pointer',
            transition: 'border-color 0.12s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
          onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--green-dim)',
            border: '1px solid var(--green-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: 'var(--green)',
            flexShrink: 0, fontFamily: 'var(--mono)',
          }}>{initial}</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>{userName}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
          </div>

          {/* Chevron indicator */}
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, color: 'var(--text-3)', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </aside>
  )
}
