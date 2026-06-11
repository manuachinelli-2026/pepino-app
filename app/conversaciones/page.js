'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

const AUTH_REDIRECT = '/login'

// ── Labels ────────────────────────────────────────────────────────────────────
const LABEL_OVERRIDES = {}
const LABEL_LIST = ['interesado', 'agendado', 'recurrente', 'nuevo']
const LABEL_COLORS = {
  interesado: { bg: 'rgba(167,139,250,0.14)', border: 'rgba(167,139,250,0.30)', text: '#A78BFA' },
  agendado:   { bg: 'rgba(160,255,121,0.12)', border: 'rgba(160,255,121,0.28)', text: 'var(--green)' },
  recurrente: { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.28)',  text: '#60A5FA' },
  nuevo:      { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.28)',  text: '#FB923C' },
}
function getLabel(jid) {
  if (LABEL_OVERRIDES[jid]) return LABEL_OVERRIDES[jid]
  const sum = (jid || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return LABEL_LIST[sum % LABEL_LIST.length]
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function getMsgText(msg) {
  const m = msg?.message
  if (!m) return ''
  return m.conversation
    ?? m.extendedTextMessage?.text
    ?? m.imageMessage?.caption
    ?? (m.imageMessage    ? '📷 Imagen'   : null)
    ?? (m.audioMessage    ? '🎤 Audio'    : null)
    ?? (m.videoMessage    ? '🎥 Video'    : null)
    ?? (m.documentMessage ? `📄 ${m.documentMessage.fileName || 'Documento'}` : null)
    ?? (m.stickerMessage  ? '🎭 Sticker'  : null)
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

function normalizeNumber(jid = '') {
  const raw = jid.replace(/@.*$/, '').replace(/\D/g, '')
  if (!raw) return jid
  return raw.slice(-10)
}

function isRealName(str) {
  return str && /[a-zA-ZÀ-ÿ\s]/.test(str) && str.length > 2
}

// For LID chats, Evolution stores the real phone JID in lastMessage.key.remoteJidAlt
// Use that as the group key so LID chat merges with its phone-JID twin
function getGroupKey(chat) {
  const jid = chat.remoteJid || ''
  if (jid.endsWith('@lid')) {
    const alt = chat.lastMessage?.key?.remoteJidAlt
    if (alt) return normalizeNumber(alt)
  }
  return normalizeNumber(jid)
}

function mergeChats(chats) {
  const groups = {}

  for (const chat of chats) {
    // Skip system/broadcast chats (0@s.whatsapp.net, @broadcast, status)
    const jid = chat.remoteJid || ''
    if (jid === '0@s.whatsapp.net' || jid.includes('@broadcast') || jid.includes('status')) continue

    const key = getGroupKey(chat)
    if (!key) continue
    if (!groups[key]) groups[key] = { chats: [], key }
    groups[key].chats.push(chat)
  }

  return Object.values(groups).map(({ chats, key }) => {
    // Prefer the chat that has a real human name
    const best = chats.find(c => isRealName(c.pushName) && c.pushName !== 'Você')
      ?? chats.find(c => isRealName(c.lastMessage?.pushName))
      ?? chats[0]

    const allMsgs = chats.map(c => c.lastMessage).filter(Boolean)
    const lastMessage = allMsgs.sort((a, b) =>
      (b.messageTimestamp || 0) - (a.messageTimestamp || 0)
    )[0] ?? best.lastMessage

    // Collect all JIDs (phone + LID) so messages are fetched from both
    const allJids = [...new Set(chats.map(c => c.remoteJid))]

    // For the phone number to display/pass to profile-pic: prefer the @s.whatsapp.net JID
    const phoneJid = chats.find(c => c.remoteJid?.endsWith('@s.whatsapp.net'))?.remoteJid
      ?? best.remoteJid
    const fullNumber = phoneJid.replace(/@.*$/, '').replace(/\D/g, '') || key

    const unreadCount = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

    return {
      ...best,
      lastMessage,
      unreadCount,
      allJids,
      number: fullNumber,
      _key: key,
    }
  }).sort((a, b) =>
    (b.lastMessage?.messageTimestamp || 0) - (a.lastMessage?.messageTimestamp || 0)
  )
}

// ── Components ────────────────────────────────────────────────────────────────
function LabelBadge({ jid }) {
  const label = getLabel(jid)
  const c = LABEL_COLORS[label]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 7px', borderRadius: 99,
      background: c.bg, border: `1px solid ${c.border}`,
      fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
      color: c.text, textTransform: 'lowercase', letterSpacing: '0.04em',
      flexShrink: 0, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  )
}

function Avatar({ name, photoUrl, size = 40 }) {
  const [imgError, setImgError] = useState(false)
  const letter = (name || '?')[0].toUpperCase()
  if (photoUrl && !imgError) {
    return (
      <img src={photoUrl} alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--elevated)', border: '1px solid var(--border-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, color: 'var(--green)',
      flexShrink: 0, fontFamily: 'var(--mono)',
    }}>{letter}</div>
  )
}

function AgentToggle({ enabled, onToggle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)' }}>AI Agent</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: enabled ? 'var(--green)' : 'var(--text-3)' }}>
          {enabled ? 'Activo' : 'Inactivo'}
        </div>
      </div>
      <div onClick={onToggle} style={{
        width: 44, height: 24, borderRadius: 99,
        background: enabled ? 'var(--green)' : 'var(--elevated)',
        border: `1px solid ${enabled ? 'transparent' : 'var(--border-2)'}`,
        cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
        boxShadow: enabled ? '0 0 10px rgba(160,255,121,0.3)' : 'none',
        flexShrink: 0,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: enabled ? 'var(--bg)' : 'var(--text-3)',
          position: 'absolute', top: 2, left: enabled ? 22 : 2,
          transition: 'left 0.2s',
        }} />
      </div>
    </div>
  )
}

function Bubble({ msg, prevMsg }) {
  const fromMe = !!msg.key?.fromMe
  const text = getMsgText(msg)
  const time = formatTime(msg.messageTimestamp)
  const grouped = prevMsg && !!prevMsg.key?.fromMe === fromMe
  return (
    <div style={{
      display: 'flex', justifyContent: fromMe ? 'flex-end' : 'flex-start',
      marginBottom: grouped ? 2 : 8,
      paddingLeft: fromMe ? '15%' : 0,
      paddingRight: fromMe ? 0 : '15%',
    }}>
      <div style={{
        maxWidth: '100%', padding: '7px 12px 5px',
        borderRadius: fromMe ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
        background: fromMe ? 'var(--green)' : 'var(--panel)',
        border: fromMe ? 'none' : '1px solid var(--border)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
      }}>
        <div style={{ fontSize: 14, lineHeight: 1.5, color: fromMe ? 'var(--bg)' : 'var(--text-1)', wordBreak: 'break-word' }}>
          {text}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 2 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: fromMe ? 'rgba(0,0,0,0.45)' : 'var(--text-3)' }}>{time}</span>
          {fromMe && (
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M1 5l3 3 5-7M7 5l3-3" stroke="rgba(0,0,0,0.45)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
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
      setQrData(await res.json())
      setLoading(false)
    }
    load()
    const t = setInterval(load, 25000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border-2)', borderRadius: 20, padding: '36px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, maxWidth: 340 }} onClick={e => e.stopPropagation()}>
        <span style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-1)' }}>Conectar WhatsApp</span>
        {loading
          ? <div style={{ width: 256, height: 256, background: 'var(--elevated)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>Generando QR...</div>
          : qrData?.base64
            ? <img src={qrData.base64} alt="QR" style={{ width: 256, height: 256, borderRadius: 12 }} />
            : <div style={{ width: 256, height: 256, background: 'var(--elevated)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', textAlign: 'center', padding: 20 }}>{qrData?.error ?? 'Ya conectado.'}</div>
        }
        <ol style={{ margin: 0, padding: '0 0 0 18px', color: 'var(--text-2)', fontSize: 13.5, lineHeight: 1.8, width: '100%' }}>
          <li>Abrí WhatsApp en tu celular</li>
          <li>Dispositivos vinculados</li>
          <li>Vincular dispositivo</li>
          <li>Escaneá este QR</li>
        </ol>
        <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border-2)', color: 'var(--text-2)', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Cerrar</button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ConversacionesPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked]   = useState(false)
  const [userId, setUserId]             = useState(null)
  const [status, setStatus]             = useState({ connected: false, state: 'loading' })
  const [rawChats, setRawChats]         = useState([])
  const [selectedChat, setSelectedChat] = useState(null)
  const [messages, setMessages]         = useState([])
  const [search, setSearch]             = useState('')
  const [showQR, setShowQR]             = useState(false)
  const [input, setInput]               = useState('')
  const [sending, setSending]           = useState(false)
  const [agentEnabled, setAgentEnabled] = useState(false)
  const [profilePic, setProfilePic]     = useState(null)
  const msgsEndRef = useRef(null)
  const inputRef   = useRef(null)

  // Merged + deduplicated chat list
  const chats = mergeChats(rawChats)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push(AUTH_REDIRECT); return }
      setUserId(session.user.id)
      setAuthChecked(true)
    })
    const saved = localStorage.getItem('pepino-ai-agent')
    if (saved !== null) setAgentEnabled(saved === 'true')
  }, [router])

  useEffect(() => {
    if (!authChecked || !userId) return
    const poll = async () => {
      try { const r = await fetch(`/api/status?user_id=${userId}`); setStatus(await r.json()) } catch {}
    }
    poll()
    const t = setInterval(poll, 6000)
    return () => clearInterval(t)
  }, [authChecked, userId])

  useEffect(() => {
    if (!status.connected || !userId) { setRawChats([]); return }
    const load = async () => {
      try { const r = await fetch(`/api/chats?user_id=${userId}`); setRawChats(await r.json()) } catch {}
    }
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [status.connected, userId])

  // Fetch messages for all JIDs of selected chat
  const loadMessages = useCallback(async (allJids) => {
    if (!allJids?.length || !userId) return
    try {
      const params = allJids.map(j => `jid=${encodeURIComponent(j)}`).join('&')
      const r = await fetch(`/api/messages?${params}&user_id=${userId}`)
      setMessages(await r.json())
    } catch {}
  }, [userId])

  useEffect(() => {
    if (!selectedChat) return
    loadMessages(selectedChat.allJids)
    const t = setInterval(() => loadMessages(selectedChat.allJids), 3000)
    return () => clearInterval(t)
  }, [selectedChat, loadMessages])

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    setProfilePic(null)
    if (!selectedChat) return
    if (!userId) return
    fetch(`/api/profile-pic?number=${encodeURIComponent(selectedChat.number)}&user_id=${userId}`)
      .then(r => r.json())
      .then(d => { if (d.url) setProfilePic(d.url) })
      .catch(() => {})
  }, [selectedChat?.number])

  const getChatName = (chat) => {
    const name = chat.pushName || chat.lastMessage?.pushName
    if (isRealName(name) && name !== 'Você') return name
    return chat.number || 'Desconocido'
  }

  const toggleAgent = () => {
    const next = !agentEnabled
    setAgentEnabled(next)
    localStorage.setItem('pepino-ai-agent', String(next))
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !selectedChat || sending) return
    setInput('')
    setSending(true)
    try {
      await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid: selectedChat.remoteJid, text, user_id: userId }),
      })
      setTimeout(() => loadMessages(selectedChat.allJids), 800)
    } catch {}
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'DELETE' })
    setStatus({ connected: false, state: 'closed' })
    setRawChats([]); setSelectedChat(null)
  }

  const filteredChats = chats.filter(c =>
    getChatName(c).toLowerCase().includes(search.toLowerCase()) ||
    (c.number || '').includes(search)
  )

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.15em' }}>Cargando...</div>
    </div>
  )

  const selectedName = selectedChat ? getChatName(selectedChat) : ''

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Top bar */}
        <header style={{ height: 52, flexShrink: 0, zIndex: 10, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 14, borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-3)' }}>WhatsApp</div>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-1)' }}>Conversaciones</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 11, color: status.connected ? 'var(--green)' : 'var(--text-3)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: status.connected ? 'var(--green)' : 'var(--text-3)' }} />
              {status.connected ? 'Conectado' : status.state === 'loading' ? 'Cargando...' : 'Desconectado'}
            </div>
            <button onClick={() => setShowQR(true)} style={{ background: status.connected ? 'var(--green-dim)' : 'var(--green)', border: `1px solid ${status.connected ? 'var(--border-2)' : 'transparent'}`, color: status.connected ? 'var(--green)' : 'var(--bg)', borderRadius: 8, padding: '5px 13px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
              {status.connected ? 'Ver QR' : 'Conectar'}
            </button>
            {status.connected && (
              <button onClick={handleLogout} style={{ background: 'none', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', borderRadius: 8, padding: '5px 13px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600 }}>
                Cerrar sesión WA
              </button>
            )}
          </div>
        </header>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Chat list */}
          <aside style={{ width: 310, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--panel)' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar conversación..."
                style={{ width: '100%', background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 20, padding: '7px 14px', color: 'var(--text-1)', fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {!status.connected ? (
                <div style={{ padding: '48px 20px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-3)', fontSize: 13, lineHeight: 1.6 }}>Conectá tu WhatsApp para ver las conversaciones.</p>
                  <button onClick={() => setShowQR(true)} style={{ marginTop: 8, background: 'var(--green)', color: 'var(--bg)', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Conectar ahora</button>
                </div>
              ) : filteredChats.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                  {search ? 'Sin resultados.' : 'No hay conversaciones.'}
                </div>
              ) : filteredChats.map(chat => {
                const isSelected = selectedChat?._key === chat._key
                const name = getChatName(chat)
                const lastMsg = getMsgText(chat.lastMessage)
                const fromMe = !!chat.lastMessage?.key?.fromMe
                return (
                  <div key={chat._key || chat.number} onClick={() => setSelectedChat(chat)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', background: isSelected ? 'var(--elevated)' : 'transparent', borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--elevated)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <Avatar name={name} size={44} />
                      {chat.unreadCount > 0 && (
                        <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--green)', color: 'var(--bg)', borderRadius: 99, minWidth: 17, height: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, padding: '0 4px', border: '2px solid var(--panel)' }}>{chat.unreadCount}</div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3, gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-1)', flex: 1 }}>{name}</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', flexShrink: 0 }}>{formatTime(chat.lastMessage?.messageTimestamp)}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {fromMe ? '✓ ' : ''}{lastMsg}
                        </p>
                        <LabelBadge jid={chat.remoteJid} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>

          {/* Messages panel */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
            {!selectedChat ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-3)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" opacity="0.3">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p style={{ margin: 0, fontSize: 15 }}>Seleccioná una conversación</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div style={{ padding: '10px 20px', flexShrink: 0, borderBottom: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar name={selectedName} photoUrl={profilePic} size={42} />
                    <div style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: 'var(--green)', border: '2px solid var(--panel)', display: status.connected ? 'block' : 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-1)' }}>{selectedName}</span>
                      <LabelBadge jid={selectedChat.remoteJid} />
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>{selectedChat.number}</div>
                  </div>
                  <AgentToggle enabled={agentEnabled} onToggle={toggleAgent} />
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 8px' }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, marginTop: 40 }}>No hay mensajes.</div>
                  ) : messages.map((msg, i) => (
                    <Bubble key={msg.key?.id || i} msg={msg} prevMsg={messages[i - 1]} />
                  ))}
                  {agentEnabled && (
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 4 }}>
                      <div style={{ padding: '7px 14px', borderRadius: '4px 16px 16px 16px', background: 'var(--panel)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)', letterSpacing: '0.08em' }}>AI</span>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--text-3)', animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={msgsEndRef} />
                </div>

                {/* Input */}
                <div style={{ padding: '10px 16px 14px', borderTop: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                  <textarea
                    ref={inputRef} value={input}
                    onChange={e => {
                      setInput(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribí un mensaje..." rows={1}
                    style={{ flex: 1, resize: 'none', overflowY: 'auto', background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 20, padding: '9px 16px', color: 'var(--text-1)', fontFamily: 'var(--sans)', fontSize: 14, lineHeight: 1.5, outline: 'none' }}
                  />
                  <button onClick={handleSend} disabled={!input.trim() || sending}
                    style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: input.trim() ? 'var(--green)' : 'var(--elevated)', border: 'none', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke={input.trim() ? 'var(--bg)' : 'var(--text-3)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showQR && <QRModal onClose={() => setShowQR(false)} />}
      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-4px)} }`}</style>
    </div>
  )
}
