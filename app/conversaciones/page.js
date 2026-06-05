'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

const C = {
  bg: '#0B0E0C', panel: '#11150F', elevated: '#161B12',
  green: '#A0FF79', greenDim: 'rgba(160,255,121,0.10)', greenDim2: 'rgba(160,255,121,0.16)',
  text1: '#F4F7F2', text2: '#B6C4B2', text3: '#7E8C7C',
  border: '#243026', border2: '#324034',
  mono: '"JetBrains Mono", monospace',
}

const AUTH_REDIRECT = '/login'

function getMsgText(msg) {
  const m = msg?.message
  if (!m) return ''
  return m.conversation ?? m.extendedTextMessage?.text ?? m.imageMessage?.caption
    ?? (m.imageMessage ? '📷 Imagen' : null) ?? (m.audioMessage ? '🎤 Audio' : null)
    ?? (m.videoMessage ? '🎥 Video' : null)
    ?? (m.documentMessage ? `📄 ${m.documentMessage.fileName || 'Documento'}` : null)
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
          <li>Abrí WhatsApp en tu celular</li>
          <li>Dispositivos vinculados</li>
          <li>Vincular dispositivo</li>
          <li>Escaneá este QR</li>
        </ol>
        <button onClick={onClose} style={{ background: 'none', border: `1px solid ${C.border2}`, color: C.text2, borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cerrar</button>
      </div>
    </div>
  )
}

export default function ConversacionesPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [status, setStatus] = useState({ connected: false, state: 'loading' })
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [showQR, setShowQR] = useState(false)
  const msgsEndRef = useRef(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push(AUTH_REDIRECT); return }
      setAuthChecked(true)
    })
  }, [router])

  useEffect(() => {
    if (!authChecked) return
    const poll = async () => {
      try { const res = await fetch('/api/status'); setStatus(await res.json()) } catch {}
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [authChecked])

  useEffect(() => {
    if (!status.connected) { setChats([]); return }
    const load = async () => {
      try { const res = await fetch('/api/chats'); setChats(await res.json()) } catch {}
    }
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [status.connected])

  useEffect(() => {
    if (!selectedChat) return
    const load = async () => {
      try {
        const res = await fetch(`/api/messages?jid=${encodeURIComponent(selectedChat.remoteJid)}`)
        const data = await res.json()
        setMessages(data)
        setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      } catch {}
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

  const filteredChats = chats.filter(c =>
    getChatName(c).toLowerCase().includes(search.toLowerCase())
  )

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'DELETE' })
    setStatus({ connected: false, state: 'closed' })
    setChats([])
    setSelectedChat(null)
  }

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ fontFamily: C.mono, fontSize: 11, color: C.text3, letterSpacing: '0.15em' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg }}>
      <Sidebar />

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: `1px solid ${C.border}`, background: 'rgba(11,14,12,0.95)', backdropFilter: 'blur(12px)', gap: 12, flexShrink: 0, zIndex: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.text3 }}>WhatsApp</div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>Conversaciones</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
          </div>
        </header>

        {/* Chat area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Chat list */}
          <aside style={{ width: 300, flexShrink: 0, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', background: C.panel }}>
            <div style={{ padding: '12px', borderBottom: `1px solid ${C.border}` }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar conversación..."
                style={{ width: '100%', background: C.elevated, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '8px 12px', color: C.text1, fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {!status.connected ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <PepinoMark size={40} />
                  <p style={{ color: C.text3, fontSize: 13, marginTop: 14, lineHeight: 1.6 }}>
                    Conectá tu WhatsApp para ver las conversaciones.
                  </p>
                  <button onClick={() => setShowQR(true)} style={{ marginTop: 8, background: C.green, color: '#0B0E0C', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Conectar ahora
                  </button>
                </div>
              ) : filteredChats.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: C.text3, fontSize: 13 }}>
                  {search ? 'Sin resultados.' : 'No hay conversaciones.'}
                </div>
              ) : filteredChats.map(chat => {
                const isSelected = selectedChat?.remoteJid === chat.remoteJid
                const name = getChatName(chat)
                const lastMsg = getMsgText(chat.lastMessage)
                return (
                  <div key={chat.remoteJid} onClick={() => setSelectedChat(chat)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer', background: isSelected ? C.elevated : 'transparent', borderBottom: `1px solid ${C.border}`, transition: 'background 0.1s' }}>
                    <Avatar name={name} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: C.text1 }}>{name}</span>
                        <span style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, flexShrink: 0, marginLeft: 6 }}>{formatTime(chat.lastMessage?.messageTimestamp)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 12.5, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chat.lastMessage?.key?.fromMe ? '✓ ' : ''}{lastMsg}
                      </p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div style={{ background: C.green, color: '#0B0E0C', borderRadius: 99, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: C.mono, fontSize: 10, fontWeight: 700, padding: '0 5px', flexShrink: 0 }}>{chat.unreadCount}</div>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>

          {/* Messages panel */}
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!selectedChat ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: C.text3 }}>
                <PepinoMark size={48} />
                <p style={{ margin: 0, fontSize: 15 }}>Seleccioná una conversación</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: C.panel }}>
                  <Avatar name={getChatName(selectedChat)} size={36} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: C.text1 }}>{getChatName(selectedChat)}</div>
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
            )}
          </main>
        </div>
      </div>

      {showQR && <QRModal onClose={() => setShowQR(false)} />}
    </div>
  )
}
