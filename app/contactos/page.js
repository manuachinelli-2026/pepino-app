'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

// ── Labels (same as conversaciones) ──────────────────────────────────────────
const LABEL_LIST = ['interesado', 'agendado', 'recurrente', 'nuevo']
const LABEL_COLORS = {
  interesado: { bg: 'rgba(167,139,250,0.14)', border: 'rgba(167,139,250,0.30)', text: '#A78BFA' },
  agendado:   { bg: 'rgba(160,255,121,0.12)', border: 'rgba(160,255,121,0.28)', text: 'var(--green)' },
  recurrente: { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.28)',  text: '#60A5FA' },
  nuevo:      { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.28)',  text: '#FB923C' },
}
function getLabel(jid) {
  const sum = (jid || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return LABEL_LIST[sum % LABEL_LIST.length]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function normalizePhone(raw = '') {
  return raw.replace(/@.*$/, '').replace(/\D/g, '').slice(-10)
}
function isRealName(str) {
  return str && /[a-zA-ZÀ-ÿ\s]/.test(str) && str.length > 2
}
function formatTs(ts) {
  if (!ts) return null
  const d = new Date(ts * 1000)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7)  return `Hace ${diffDays} días`
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: diffDays > 300 ? 'numeric' : undefined })
}
function formatReserva(r) {
  if (!r) return null
  const fecha = new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  return `${fecha}${r.servicio ? ' · ' + r.servicio : ''}`
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const letter = (name || '?')[0].toUpperCase()
  const hue = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},30%,18%)`,
      border: `1px solid hsl(${hue},30%,28%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38,
      color: `hsl(${hue},70%,72%)`,
      fontFamily: 'var(--mono)',
    }}>{letter}</div>
  )
}

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
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      {label}
    </span>
  )
}

function SortIcon({ dir }) {
  if (!dir) return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.3 }}>
      <path d="M3 4l2-2 2 2M3 6l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--green)' }}>
      <path d={dir === 'asc' ? 'M2 7l3-4 3 4' : 'M2 3l3 4 3-4'} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Contact Drawer ────────────────────────────────────────────────────────────
function ContactDrawer({ contact, onClose, onSave }) {
  const [email, setEmail] = useState(contact.email || '')
  const [notas, setNotas] = useState(contact.notas || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await onSave(contact.phone, { email: email.trim(), notas: notas.trim() })
    setSaving(false)
    onClose()
  }

  const inp = {
    background: 'var(--bg)', border: '1.5px solid var(--border-2)', borderRadius: 10,
    padding: '10px 14px', color: 'var(--text-1)', fontFamily: 'var(--sans)',
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }
  const lbl = { fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, display: 'block', letterSpacing: '0.06em', textTransform: 'uppercase' }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 91, width: 380,
        background: 'var(--panel)', borderLeft: '1px solid var(--border-2)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-24px 0 64px rgba(0,0,0,0.35)',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={contact.name} size={50} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{contact.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>+{contact.phone}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--elevated)', border: '1px solid var(--border-2)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Etiqueta', value: <LabelBadge jid={contact.jid} /> },
              { label: 'Total reservas', value: <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800, color: 'var(--text-1)' }}>{contact.totalReservas}</span> },
              { label: 'Última conv.', value: <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{formatTs(contact.lastConv) || '—'}</span> },
              { label: 'Última reserva', value: <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{formatReserva(contact.lastReservaObj) || '—'}</span> },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
                <div>{value}</div>
              </div>
            ))}
          </div>

          {/* Email */}
          <div>
            <label style={lbl}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="mail@ejemplo.com" type="email" style={inp}
              onFocus={e => e.target.style.borderColor = 'var(--green)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
            />
          </div>

          {/* Notas */}
          <div>
            <label style={lbl}>Notas</label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas sobre este contacto..." rows={4}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => e.target.style.borderColor = 'var(--green)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
            />
          </div>

          {/* Historial de reservas */}
          {contact.reservas?.length > 0 && (
            <div>
              <label style={lbl}>Historial de reservas</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {contact.reservas.slice(0, 6).map(r => {
                  const statusColors = {
                    confirmado: 'var(--green)', pendiente: '#ffb432', cancelado: '#ff6b6b', completado: '#60A5FA',
                  }
                  return (
                    <div key={r.id} style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 9, padding: '9px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.servicio || 'Servicio'}</div>
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                          {r.fecha}{r.hora ? ' · ' + r.hora.slice(0,5) : ''}
                        </div>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, border: `1px solid ${statusColors[r.estado] || 'var(--border-2)'}`, color: statusColors[r.estado] || 'var(--text-3)', flexShrink: 0, fontFamily: 'var(--mono)', textTransform: 'lowercase' }}>{r.estado}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: 'none', border: '1.5px solid var(--border-2)', color: 'var(--text-2)', borderRadius: 10, padding: 10, fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
          <button onClick={save} disabled={saving} style={{ flex: 1, background: 'var(--green)', color: '#0B0E0C', border: 'none', borderRadius: 10, padding: 10, fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ContactosPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [evContacts, setEvContacts]   = useState([])
  const [chats, setChats]             = useState([])
  const [reservas, setReservas]       = useState([])
  const [extras, setExtras]           = useState({})   // phone → { email, notas }
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [sortKey, setSortKey]         = useState('lastConv')
  const [sortDir, setSortDir]         = useState('desc')
  const [filterLabel, setFilterLabel] = useState('todos')
  const [selected, setSelected]       = useState(null)

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setAuthChecked(true)
    })
  }, [router])

  // Fetch data
  const loadAll = useCallback(async () => {
    setLoading(true)
    const [evRes, chatsRes, resRes, extrasRes] = await Promise.allSettled([
      fetch('/api/contacts').then(r => r.json()),
      fetch('/api/chats').then(r => r.json()),
      supabase.from('reservas').select('*').order('fecha', { ascending: false }),
      supabase.from('contactos').select('*'),
    ])

    if (evRes.status === 'fulfilled')     setEvContacts(Array.isArray(evRes.value) ? evRes.value : [])
    if (chatsRes.status === 'fulfilled')  setChats(Array.isArray(chatsRes.value) ? chatsRes.value : [])
    if (resRes.status === 'fulfilled')    setReservas(resRes.value.data || [])

    // Build extras map from Supabase contactos table (may not exist)
    if (extrasRes.status === 'fulfilled' && extrasRes.value.data) {
      const map = {}
      for (const row of extrasRes.value.data) map[row.phone] = row
      setExtras(map)
    }

    setLoading(false)
  }, [])

  useEffect(() => { if (authChecked) loadAll() }, [authChecked, loadAll])

  // Build unified contact list
  const contacts = useMemo(() => {
    // Build phone → lastConv map from chats
    const chatMap = {}
    for (const chat of chats) {
      const jid = chat.remoteJid || ''
      if (jid.includes('@broadcast') || jid.includes('status') || jid === '0@s.whatsapp.net') continue
      const phone = normalizePhone(jid)
      if (!phone) continue
      const ts = chat.lastMessage?.messageTimestamp || 0
      if (!chatMap[phone] || ts > chatMap[phone].ts) {
        chatMap[phone] = { ts, jid }
      }
    }

    // Build phone → reservas map
    const resMap = {}
    for (const r of reservas) {
      const phone = normalizePhone(r.cliente_telefono || '')
      if (!phone) continue
      if (!resMap[phone]) resMap[phone] = []
      resMap[phone].push(r)
    }

    // Build set of all phones (from both Evolution contacts and chats)
    const phoneSet = new Set()
    const nameMap = {}

    for (const c of evContacts) {
      const phone = normalizePhone(c.remoteJid || c.id || '')
      if (!phone) continue
      phoneSet.add(phone)
      const name = c.pushName || c.verifiedName || c.name || ''
      if (isRealName(name)) nameMap[phone] = name
    }

    for (const chat of chats) {
      const jid = chat.remoteJid || ''
      if (jid.includes('@broadcast') || jid.includes('status') || jid === '0@s.whatsapp.net') continue
      const phone = normalizePhone(jid)
      if (!phone) continue
      phoneSet.add(phone)
      if (!nameMap[phone]) {
        const name = chat.pushName || chat.lastMessage?.pushName || ''
        if (isRealName(name) && name !== 'Você') nameMap[phone] = name
      }
    }

    return Array.from(phoneSet).map(phone => {
      const resArr = resMap[phone] || []
      const lastReservaObj = resArr[0] || null
      const chatInfo = chatMap[phone] || null
      const ext = extras[phone] || {}
      return {
        phone,
        name: nameMap[phone] || phone,
        jid: chatInfo?.jid || phone + '@s.whatsapp.net',
        email: ext.email || '',
        notas: ext.notas || '',
        lastConv: chatInfo?.ts || null,
        reservas: resArr,
        lastReservaObj,
        totalReservas: resArr.length,
      }
    })
  }, [evContacts, chats, reservas, extras])

  // Search + filter + sort
  const filtered = useMemo(() => {
    let list = contacts
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
      )
    }
    if (filterLabel !== 'todos') {
      list = list.filter(c => getLabel(c.jid) === filterLabel)
    }
    list = [...list].sort((a, b) => {
      let va, vb
      if (sortKey === 'name')          { va = a.name.toLowerCase(); vb = b.name.toLowerCase() }
      else if (sortKey === 'lastConv') { va = a.lastConv || 0; vb = b.lastConv || 0 }
      else if (sortKey === 'reservas') { va = a.totalReservas; vb = b.totalReservas }
      else if (sortKey === 'phone')    { va = a.phone; vb = b.phone }
      else                             { va = a[sortKey] || ''; vb = b[sortKey] || '' }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [contacts, search, filterLabel, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const saveContact = async (phone, data) => {
    await supabase.from('contactos').upsert({ phone, ...data }, { onConflict: 'phone' })
    setExtras(prev => ({ ...prev, [phone]: { ...(prev[phone] || {}), ...data } }))
  }

  // Stats
  const total         = contacts.length
  const withEmail     = contacts.filter(c => c.email).length
  const withReservas  = contacts.filter(c => c.totalReservas > 0).length
  const withConv      = contacts.filter(c => c.lastConv).length

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.15em' }}>Cargando...</div>
    </div>
  )

  const COLS = [
    { key: 'name',     label: 'Contacto',     grow: 2.2, sortable: true },
    { key: 'phone',    label: 'Teléfono',      grow: 1.2, sortable: true },
    { key: 'email',    label: 'Email',         grow: 1.6, sortable: false },
    { key: 'label',    label: 'Etiqueta',      grow: 0.9, sortable: false },
    { key: 'lastConv', label: 'Última conv.',  grow: 1.1, sortable: true },
    { key: 'reservas', label: 'Reservas',      grow: 0.8, sortable: true },
    { key: 'lastRes',  label: 'Última reserva',grow: 1.4, sortable: false },
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <header style={{ flexShrink: 0, padding: '13px 24px 12px', borderBottom: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>Base de datos</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-1)', lineHeight: 1 }}>Contactos</div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M10 10l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, teléfono o email..."
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 20, padding: '7px 14px 7px 32px', color: 'var(--text-1)', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: 260 }}
            />
          </div>

          {/* Label filter */}
          <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)}
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: filterLabel === 'todos' ? 'var(--text-3)' : 'var(--text-1)', fontFamily: 'inherit', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="todos">Todas las etiquetas</option>
            {LABEL_LIST.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {/* Count chip */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 11px', flexShrink: 0 }}>
            {filtered.length} <span style={{ opacity: 0.6 }}>/ {total}</span>
          </div>
        </header>

        {/* Stats bar */}
        <div style={{ flexShrink: 0, padding: '12px 24px', borderBottom: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', gap: 12 }}>
          {[
            { label: 'Contactos totales', value: total,       color: 'var(--text-1)' },
            { label: 'Con conversación',  value: withConv,    color: 'var(--green)' },
            { label: 'Con reservas',      value: withReservas,color: '#60A5FA' },
            { label: 'Con email',         value: withEmail,   color: '#A78BFA' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.3, maxWidth: 80 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Sticky column headers */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '0 24px', height: 36,
            borderBottom: '1px solid var(--border)',
            background: 'var(--panel)',
            position: 'sticky', top: 0, zIndex: 10,
          }}>
            {COLS.map(col => (
              <div key={col.key}
                onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                style={{
                  flex: col.grow, minWidth: 0, display: 'flex', alignItems: 'center', gap: 5,
                  fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: sortKey === col.key ? 'var(--green)' : 'var(--text-3)',
                  cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none',
                  transition: 'color 0.12s',
                }}
              >
                {col.label}
                {col.sortable && <SortIcon dir={sortKey === col.key ? sortDir : null} />}
              </div>
            ))}
          </div>

          {/* Rows */}
          {loading ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em' }}>
              Cargando contactos...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
              {search ? 'Sin resultados para esa búsqueda.' : 'No hay contactos todavía.'}
            </div>
          ) : filtered.map((contact, i) => (
            <div
              key={contact.phone}
              onClick={() => setSelected(contact)}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '0 24px', height: 54,
                borderBottom: '1px solid var(--border)',
                cursor: 'pointer',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.008)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--elevated)'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.008)'}
            >
              {/* Contacto */}
              <div style={{ flex: COLS[0].grow, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={contact.name} size={32} />
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {contact.name}
                </span>
              </div>

              {/* Teléfono */}
              <div style={{ flex: COLS[1].grow, minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>+{contact.phone}</span>
              </div>

              {/* Email */}
              <div style={{ flex: COLS[2].grow, minWidth: 0 }}>
                {contact.email
                  ? <span style={{ fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{contact.email}</span>
                  : <span style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic' }}>Sin email</span>
                }
              </div>

              {/* Etiqueta */}
              <div style={{ flex: COLS[3].grow, minWidth: 0 }}>
                <LabelBadge jid={contact.jid} />
              </div>

              {/* Última conversación */}
              <div style={{ flex: COLS[4].grow, minWidth: 0 }}>
                {contact.lastConv
                  ? <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{formatTs(contact.lastConv)}</span>
                  : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                }
              </div>

              {/* Reservas count */}
              <div style={{ flex: COLS[5].grow, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                {contact.totalReservas > 0
                  ? (
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
                      color: 'var(--green)',
                      background: 'var(--green-dim)', border: '1px solid var(--green-border)',
                      borderRadius: 6, padding: '2px 8px',
                    }}>{contact.totalReservas}</span>
                  )
                  : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>0</span>
                }
              </div>

              {/* Última reserva */}
              <div style={{ flex: COLS[6].grow, minWidth: 0 }}>
                {contact.lastReservaObj
                  ? <span style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{formatReserva(contact.lastReservaObj)}</span>
                  : <span style={{ fontSize: 11, color: 'var(--text-3)' }}>—</span>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <ContactDrawer
          contact={{ ...selected, ...( extras[selected.phone] || {} ) }}
          onClose={() => setSelected(null)}
          onSave={saveContact}
        />
      )}
    </div>
  )
}
