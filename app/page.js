'use client'
import { useState, useEffect, useRef } from 'react'

const C = {
  bg: '#0B0E0C', panel: '#11150F', elevated: '#161B12',
  green: '#A0FF79', greenDim: 'rgba(160,255,121,0.10)',
  text1: '#F4F7F2', text2: '#B6C4B2', text3: '#7E8C7C',
  border: '#243026', border2: '#324034',
  mono: '"JetBrains Mono", monospace',
}

function getMsgText(msg) {
  const m = msg?.message
  if (!m) return ''
  return m.conversation
    ?? m.extendedTextMessage?.text
    ?? m.imageMessage?.caption
    ?? (m.imageMessage ? '📷 Imagen' : null)
    ?? (m.audioMessage ? '🎤 Audio' : null)
    ?? (m.videoMessage ? '🎥 Video' : null)
    ?? (m.documentMessage ? '📄 Documento' : null)
    ?? (m.stickerMessage ? '🎭 Sticker' : null)
    ?? '💬 Mensaje'
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
  const colors = ['#16301A', '#1a2e1a', '#0f2010', '#243026']
  const color = colors[letter.charCodeAt(0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color, border: `1px solid ${C.border2}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, color: C.green,
      flexShrink: 0, fontFamily: C.mono,
    }}>
      {letter}
    </div>
  )
}

function QRModal({ onClose }) {
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch('/api/qr')
      const data = await res.json()
      setQrData(data)
      setLoading(false)
    }
    load()
    const t = setInterval(load, 25000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(11,14,12,0.92)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: C.panel, border: `1px solid ${C.border2}`,
        borderRadius: 20, padding: '36px 40px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
        maxWidth: 340,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PepinoMark size={24} />
          <span style={{ fontWeight: 700, fontSize: 17 }}>
            Pepino<span style={{ fontFamily: C.mono, fontSize: '0.58em', color: C.green, verticalAlign: 'super' }}>AI</span>
          </span>
        </div>
        <p style={{ margin: 0, fontFamily: C.mono, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.text3 }}>
          Conectar WhatsApp
        </p>
        {loading ? (
          <div style={{ width: 256, height: 256, background: C.elevated, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3 }}>
            Generando QR...
          </div>
        ) : qrData?.base64 ? (
          <img src={qrData.base64} alt="QR" style={{ width: 256, height: 256, borderRadius: 12 }} />
        ) : (
          <div style={{ width: 256, height: 256, background: C.elevated, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.text3, textAlign: 'center', padding: 20 }}>
            {qrData?.error ?? 'Ya está conectado o el QR no está disponible.'}
          </div>
        )}
        <ol style={{ margin: 0, padding: '0 0 0 18px', color: C.text2, fontSize: 13.5, lineHeight: 1.8, textAlign: 'left', width: '100%' }}>
          <li>Abrí WhatsApp en tu celular</li>
          <li>Dispositivos vinculados</li>
          <li>Vincular dispositivo</li>
          <li>Escaneá este QR</li>
        </ol>
        <p style={{ margin: 0, fontFamily: C.mono, fontSize: 10, color: C.text3 }}>El QR se regenera automáticamente cada 25s</p>
        <button onClick={onClose} style={{
          background: 'none', border: `1px solid ${C.border2}`, color: C.text2,
          borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
        }}>Cerrar</button>
      </div>
    </div>
  )
}

export default function Home() {
  const [status, setStatus] = useState({ connected: false, state: 'loading' })
  const [chats, setChats] = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [showQR, setShowQR] = useState(false)
  const [search, setSearch] = useState('')
  const msgsEndRef = useRef(null)

  useEffect(() => {
    const poll = async () => {
      const res = await fetch('/api/status')
      const data = await res.json()
      setStatus(data)
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!status.connected) return
    const load = async () => {
      const res = await fetch('/api/chats')
      const data = await res.json()
      setChats(data)
    }
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [status.connected])

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

  const getChatName = (c) =>
    c.pushName || c.lastMessage?.pushName ||
    c.remoteJid?.replace('@s.whatsapp.net','').replace('@g.us',' (grupo)') || 'Desconocido'

  const filteredChats = chats.filter(c => {
    const name = getChatName(c)
    return name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Nav */}
      <header style={{
        height: 56, display: 'flex', alignItems: 'center', padding: '0 20px',
        borderBottom: `1px solid ${C.border}`, background: 'rgba(11,14,12,0.95)',
        backdropFilter: 'blur(12px)', gap: 12, flexShrink: 0, zIndex: 10,
      }}>
        <PepinoMark size={26} />
        <span style={{ fontWeight: 700, fontSize: 16 }}>
          Pepino<span style={{ fontFamily: C.mono, fontSize: '0.58em', color: C.green, verticalAlign: 'super' }}>AI</span>
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: C.mono, fontSize: 11, color: status.connected ? C.green : C.text3 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: status.connected ? C.green : '#7E8C7C' }} />
            {status.connected ? 'Conectado' : status.state === 'loading' ? 'Cargando...' : 'Desconectado'}
          </div>
          <button onClick={() => setShowQR(true)} style={{
            background: status.connected ? C.greenDim : C.green,
            border: `1px solid ${status.connected ? C.border2 : 'transparent'}`,
            color: status.connected ? C.green : '#0B0E0C',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600,
          }}>
            {status.connected ? 'Ver QR' : 'Conectar WhatsApp'}
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{
          width: 300, flexShrink: 0, borderRight: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', background: C.panel,
        }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar conversación..."
              style={{
                width: '100%', background: C.elevated, border: `1px solid ${C.border2}`,
                borderRadius: 8, padding: '8px 12px', color: C.text1,
                fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!status.connected ? (
              <div style={{ padding: 24, textAlign: 'center', color: C.text3, fontSize: 13 }}>
                <div style={{ marginBottom: 12 }}>📵</div>
                WhatsApp no conectado.<br />
                <button onClick={() => setShowQR(true)} style={{
                  marginTop: 12, background: C.green, color: '#0B0E0C',
                  border: 'none', borderRadius: 8, padding: '8px 16px',
                  cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: 12,
                }}>Conectar ahora</button>
              </div>
            ) : filteredChats.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: C.text3, fontSize: 13 }}>
                No hay conversaciones todavía.
              </div>
            ) : filteredChats.map(chat => {
              const isSelected = selectedChat?.remoteJid === chat.remoteJid
              const lastMsg = getMsgText(chat.lastMessage)
              const name = getChatName(chat)
              return (
                <div key={chat.id} onClick={() => setSelectedChat(chat)} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 16px', cursor: 'pointer',
                  background: isSelected ? C.elevated : 'transparent',
                  borderBottom: `1px solid ${C.border}`,
                  transition: 'background 0.1s',
                }}>
                  <Avatar name={name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: C.text1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                      <span style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, flexShrink: 0, marginLeft: 6 }}>
                        {formatTime(chat.lastMessage?.messageTimestamp)}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: C.text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {chat.lastMessage?.key?.fromMe ? '✓ ' : ''}{lastMsg}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <div style={{
                      background: C.green, color: '#0B0E0C', borderRadius: '99px',
                      minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: C.mono, fontSize: 10, fontWeight: 700, padding: '0 5px', flexShrink: 0,
                    }}>{chat.unreadCount}</div>
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
              {/* Chat header */}
              <div style={{
                padding: '12px 20px', borderBottom: `1px solid ${C.border}`,
                display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: C.panel,
              }}>
                <Avatar name={getChatName(selectedChat)} size={36} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>
                    {getChatName(selectedChat)}
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3 }}>
                    {selectedChat.remoteJid?.replace('@s.whatsapp.net','').replace('@g.us','')}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: 'center', color: C.text3, fontSize: 13, marginTop: 40 }}>No hay mensajes.</div>
                ) : messages.map((msg, i) => {
                  const fromMe = msg.key?.fromMe
                  const text = getMsgText(msg)
                  const time = formatTime(msg.messageTimestamp)
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: fromMe ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '68%', padding: '8px 12px', borderRadius: fromMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                        background: fromMe ? C.greenDim : C.elevated,
                        border: `1px solid ${fromMe ? C.border2 : C.border}`,
                        fontSize: 13.5, lineHeight: 1.5,
                      }}>
                        {!fromMe && msg.pushName && (
                          <div style={{ fontFamily: C.mono, fontSize: 10, color: C.green, marginBottom: 3 }}>{msg.pushName}</div>
                        )}
                        <span style={{ color: C.text1 }}>{text}</span>
                        <span style={{ marginLeft: 8, fontFamily: C.mono, fontSize: 10, color: C.text3 }}>{time}</span>
                      </div>
                    </div>
                  )
                })}
                <div ref={msgsEndRef} />
              </div>
            </>
          )}
        </main>
      </div>

      {showQR && <QRModal onClose={() => setShowQR(false)} />}
    </div>
  )
}
