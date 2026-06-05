'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const C = {
  bg: '#0B0E0C', panel: '#11150F', elevated: '#161B12',
  green: '#A0FF79', greenDim: 'rgba(160,255,121,0.10)', greenDim2: 'rgba(160,255,121,0.16)',
  text1: '#F4F7F2', text2: '#B6C4B2', text3: '#7E8C7C',
  border: '#243026', border2: '#324034',
  mono: '"JetBrains Mono", monospace',
}

function getMsgText(msg) {
  const m = msg?.message
  if (!m) return ''
  return m.conversation ?? m.extendedTextMessage?.text ?? m.imageMessage?.caption
    ?? (m.imageMessage ? '📷 Imagen' : null) ?? (m.audioMessage ? '🎤 Audio' : null)
    ?? (m.videoMessage ? '🎥 Video' : null) ?? (m.documentMessage ? `📄 ${m.documentMessage.fileName || 'Documento'}` : null)
    ?? (m.stickerMessage ? '🎭 Sticker' : null) ?? '💬 Mensaje'
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
}

function normalizeJid(jid = '') {
  return jid.replace('@s.whatsapp.net', '').replace('@lid', '').replace('@g.us', '')
}

function isRealName(str) {
  return str && /[a-zA-ZÀ-ÿ\s]/.test(str) && str.length > 2
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

function Avatar({ name, size = 40 }) {
  const letter = (name || '?')[0].toUpperCase()
  const colors = ['#163018', '#1a2e1a', '#0f2010', '#243026']
  const color = colors[letter.charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, border: `1px solid ${C.border2}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, color: C.green,
      flexShrink: 0, fontFamily: C.mono,
    }}>{letter}</div>
  )
}

function QRModal({ onClose }) {
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch('/api/qr')
      setQrData(await res.json())
      setLoading(false)
    }
    load()
    const t = setInterval(load, 25000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(11,14,12,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: C.panel, border: `1px solid ${C.border2}`, borderRadius: 20, padding: '36px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PepinoMark size={24} />
          <span style={{ fontWeight: 700, fontSize: 17 }}>Pepino<span style={{ fontFamily: C.mono, fontSize: '0.58em', color: C.green, verticalAlign: 'super' }}>AI</span></span>
        </div>
        <p style={{ margin: 0, fontFamily: C.mono, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.text3 }}>Conectar WhatsApp</p>
        {loading
          ? <div style={{ width: 256, height: 256, background: C.elevated, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3 }}>Generando QR...</div>
          : qrData?.base64
            ? <img src={qrData.base64} alt="QR" style={{ width: 256, height: 256, borderRadius: 12 }} />
            : <div style={{ width: 256, height: 256, background: C.elevated, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3, textAlign: 'center', padding: 20 }}>{qrData?.error ?? 'Ya conectado.'}</div>
        }
        <ol style={{ margin: 0, padding: '0 0 0 18px', color: C.text2, fontSize: 13.5, lineHeight: 1.8, width: '100%' }}>
          <li>Abrí WhatsApp en tu celular</li><li>Dispositivos vinculados</li><li>Vincular dispositivo</li><li>Escaneá este QR</li>
        </ol>
        <button onClick={onClose} style={{ background: 'none', border: `1px solid ${C.border2}`, color: C.text2, borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cerrar</button>
      </div>
    </div>
  )
}

const AGENTS_CONFIG = [
  { id: 'paco', name: 'Paco', role: 'Gestor de Turnos', instance: 'pepino-principal', color: C.green },
]

function Dashboard({ status, chats, onSelectAgent }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: C.mono, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.green, marginBottom: 10 }}>Tus agentes</div>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>Dashboard</h1>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {AGENTS_CONFIG.map(agent => (
          <div key={agent.id} onClick={() => onSelectAgent(agent)}
            style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.greenDim, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PepinoMark size={28} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>{agent.name}</div>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{agent.role}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 24, color: C.green }}>{chats.length}</div>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3 }}>chats activos</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 24, color: status.connected ? C.green : C.text3 }}>
                  {status.connected ? '●' : '○'}
                </div>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3 }}>{status.connected ? 'conectado' : 'desconectado'}</div>
              </div>
            </div>
            <div style={{ background: C.green, color: '#0B0E0C', borderRadius: 8, padding: '10px 0', textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
              Ver conversaciones →
            </div>
          </div>
        ))}
        <div style={{ background: C.panel, border: `1px dashed ${C.border2}`, borderRadius: 18, padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, minHeight: 200, cursor: 'default' }}>
          <div style={{ fontSize: 28, opacity: 0.4 }}>+</div>
          <div style={{ fontFamily: C.mono, fontSize: 11, color: C.text3, textAlign: 'center' }}>Próximo agente</div>
        </div>
      </div>
    </div>
  )
}

function ChatsView({ status, chats, onBack }) {
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const msgsEndRef = useRef(null)

  useEffect(() => {
    if (!selectedChat) return
    const load = async () => {
      const res = await fetch(`/api/messages?jid=${encodeURIComponent(selectedChat.remoteJid)}`)
      const data = await res.json()
      setMessages(data)
      setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [selectedChat])

  const getChatName = (c) => {
    const name = c.pushName || c.lastMessage?.pushName
    if (isRealName(name)) return name
    return normalizeJid(c.remoteJid) || 'Desconocido'
  }

  const filteredChats = chats.filter(c => getChatName(c).toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      <aside style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', background: C.panel }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1 }}>←</button>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            style={{ flex: 1, background: C.elevated, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '7px 12px', color: C.text1, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredChats.length === 0
            ? <div style={{ padding: 24, textAlign: 'center', color: C.text3, fontSize: 13 }}>No hay conversaciones.</div>
            : filteredChats.map(chat => {
              const isSelected = selectedChat?.remoteJid === chat.remoteJid
              const name = getChatName(chat)
              const lastMsg = getMsgText(chat.lastMessage)
              return (
                <div key={chat.remoteJid} onClick={() => setSelectedChat(chat)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', background: isSelected ? C.elevated : 'transparent', borderBottom: `1px solid ${C.border}` }}>
                  <Avatar name={name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                      <span style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, flexShrink: 0, marginLeft: 6 }}>{formatTime(chat.lastMessage?.messageTimestamp)}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.lastMessage?.key?.fromMe ? '✓ ' : ''}{lastMsg}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <div style={{ background: C.green, color: '#0B0E0C', borderRadius: 99, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontSize: 10, fontWeight: 700, padding: '0 5px' }}>{chat.unreadCount}</div>
                  )}
                </div>
              )
            })
          }
        </div>
      </aside>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selectedChat
          ? <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: C.text3 }}>
              <PepinoMark size={48} />
              <p style={{ margin: 0, fontSize: 15 }}>Seleccioná una conversación</p>
            </div>
          : <>
            <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: C.panel }}>
              <Avatar name={getChatName(selectedChat)} size={36} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{getChatName(selectedChat)}</div>
                <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3 }}>{normalizeJid(selectedChat.remoteJid)}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {messages.length === 0
                ? <div style={{ textAlign: 'center', color: C.text3, fontSize: 13, marginTop: 40 }}>No hay mensajes.</div>
                : messages.map((msg, i) => {
                  const fromMe = msg.key?.fromMe
                  const text = getMsgText(msg)
                  const time = formatTime(msg.messageTimestamp)
                  const showName = !fromMe && isRealName(msg.pushName)
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: fromMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                      <div style={{ maxWidth: '68%', padding: '8px 12px', borderRadius: fromMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: fromMe ? C.greenDim2 : C.elevated, border: `1px solid ${fromMe ? C.border2 : C.border}`, fontSize: 13.5, lineHeight: 1.5 }}>
                        {showName && <div style={{ fontFamily: C.mono, fontSize: 10, color: C.green, marginBottom: 3 }}>{msg.pushName}</div>}
                        <span style={{ color: C.text1 }}>{text}</span>
                        <span style={{ marginLeft: 8, fontFamily: C.mono, fontSize: 10, color: C.text3 }}>{time}</span>
                      </div>
                    </div>
                  )
                })
              }
              <div ref={msgsEndRef} />
            </div>
          </>
        }
      </main>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [view, setView] = useState('dashboard')
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [status, setStatus] = useState({ connected: false, state: 'loading' })
  const [chats, setChats] = useState([])
  const [showQR, setShowQR] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login')
      } else {
        setAuthChecked(true)
      }
    })
  }, [router])

  useEffect(() => {
    if (!authChecked) return
    const poll = async () => {
      const res = await fetch('/api/status')
      setStatus(await res.json())
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [authChecked])

  useEffect(() => {
    if (!status.connected) return
    const load = async () => {
      const res = await fetch('/api/chats')
      setChats(await res.json())
    }
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [status.connected])

  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent)
    setView('chats')
  }

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'DELETE' })
    setStatus({ connected: false, state: 'closed' })
    setChats([])
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!authChecked) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ fontFamily: C.mono, fontSize: 12, color: C.text3, letterSpacing: '0.15em' }}>Cargando...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${C.border}`, background: 'rgba(11,14,12,0.95)', backdropFilter: 'blur(12px)', gap: 12, flexShrink: 0, zIndex: 10 }}>
        <PepinoMark size={26} />
        <span style={{ fontWeight: 700, fontSize: 16 }}>Pepino<span style={{ fontFamily: C.mono, fontSize: '0.58em', color: C.green, verticalAlign: 'super' }}>AI</span></span>

        <div style={{ display: 'flex', gap: 4, marginLeft: 24 }}>
          {['dashboard', 'chats'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ background: view === v ? C.greenDim : 'none', border: `1px solid ${view === v ? C.border2 : 'transparent'}`, color: view === v ? C.green : C.text3, borderRadius: 6, padding: '5px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.15s' }}>
              {v === 'dashboard' ? 'Dashboard' : selectedAgent ? `${selectedAgent.name} — Chats` : 'Chats'}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: C.mono, fontSize: 11, color: status.connected ? C.green : C.text3 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: status.connected ? C.green : '#7E8C7C' }} />
            {status.connected ? 'Conectado' : status.state === 'loading' ? 'Cargando...' : 'Desconectado'}
          </div>
          <button onClick={() => setShowQR(true)} style={{ background: status.connected ? C.greenDim : C.green, border: `1px solid ${status.connected ? C.border2 : 'transparent'}`, color: status.connected ? C.green : '#0B0E0C', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
            {status.connected ? 'Ver QR' : 'Conectar'}
          </button>
          {status.connected && (
            <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #4a2020', color: '#ff6b6b', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
              Cerrar sesión WA
            </button>
          )}
          <button onClick={handleSignOut} style={{ background: 'none', border: `1px solid ${C.border2}`, color: C.text3, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
            Salir
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {view === 'dashboard'
          ? <Dashboard status={status} chats={chats} onSelectAgent={handleSelectAgent} />
          : <ChatsView status={status} chats={chats} onBack={() => setView('dashboard')} />
        }
      </div>

      {showQR && <QRModal onClose={() => setShowQR(false)} />}
    </div>
  )
}