'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

// ── Calendar constants ────────────────────────────────────────────────────────
const START_HOUR = 7
const END_HOUR   = 21
const HOUR_H     = 60   // px per hour
const TOTAL_H    = END_HOUR - START_HOUR
const GRID_H     = TOTAL_H * HOUR_H

const DAYS_ES   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const STATUS_CFG = {
  pendiente:  { bg: 'rgba(255,180,50,0.18)',  border: '#ffb432', text: '#ffb432'  },
  confirmado: { bg: 'rgba(160,255,121,0.15)', border: 'var(--green)', text: 'var(--green)' },
  cancelado:  { bg: 'rgba(255,80,80,0.12)',   border: '#ff5050', text: '#ff5050'  },
  completado: { bg: 'rgba(100,160,255,0.12)', border: '#64a0ff', text: '#64a0ff' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getWeekDays(ref) {
  const d   = new Date(ref)
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon)
    dd.setDate(mon.getDate() + i)
    return dd
  })
}

function toDateStr(d) { return d.toISOString().split('T')[0] }

function timeToTop(timeStr) {
  const [h, m] = (timeStr || '00:00').split(':').map(Number)
  const mins = h * 60 + m - START_HOUR * 60
  return Math.max(0, (mins / 60) * HOUR_H)
}

function nowTop() {
  const now  = new Date()
  const mins = now.getHours() * 60 + now.getMinutes() - START_HOUR * 60
  return (mins / 60) * HOUR_H
}

function fmtHour(h) {
  if (h === 0 || h === 24) return ''
  const ampm = h < 12 ? 'am' : 'pm'
  const disp = h > 12 ? h - 12 : h
  return `${disp} ${ampm}`
}

// ── New-reservation modal ─────────────────────────────────────────────────────
function Modal({ initial, onClose, onSuccess }) {
  const [form, setForm]   = useState({
    cliente_nombre: '', cliente_telefono: '', servicio: '',
    fecha: initial.fecha || '', hora: initial.hora || '', estado: 'pendiente',
    ...initial,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const SERVICIOS = ['Corte de cabello', 'Coloración', 'Manicura', 'Pedicura', 'Tratamiento facial', 'Masaje', 'Otro']

  const inp = {
    background: 'var(--bg)', border: '1px solid var(--border-2)', borderRadius: 8,
    padding: '9px 13px', color: 'var(--text-1)', fontFamily: 'var(--sans)',
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
  }
  const lbl = {
    fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 5, display: 'block',
  }

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    const { error: err } = await supabase.from('reservas').insert([form])
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess(); onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border-2)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-1)' }}>Nueva reserva</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 22, padding: 4 }}>×</button>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            <div><label style={lbl}>Nombre</label><input value={form.cliente_nombre} onChange={e => set('cliente_nombre', e.target.value)} required placeholder="María García" style={inp} /></div>
            <div><label style={lbl}>Teléfono</label><input value={form.cliente_telefono} onChange={e => set('cliente_telefono', e.target.value)} placeholder="+54911..." style={inp} /></div>
          </div>
          <div><label style={lbl}>Servicio</label>
            <select value={form.servicio} onChange={e => set('servicio', e.target.value)} required style={{ ...inp, cursor: 'pointer' }}>
              <option value="">Seleccionar...</option>
              {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
            <div><label style={lbl}>Fecha</label><input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required style={inp} /></div>
            <div><label style={lbl}>Hora</label><input type="time" value={form.hora} onChange={e => set('hora', e.target.value)} required style={inp} /></div>
          </div>
          <div><label style={lbl}>Estado</label>
            <select value={form.estado} onChange={e => set('estado', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
              <option value="completado">Completado</option>
            </select>
          </div>
          {error && <div style={{ color: '#ff6b6b', fontFamily: 'var(--mono)', fontSize: 11, padding: '8px 12px', background: 'rgba(255,80,80,0.08)', borderRadius: 7, border: '1px solid rgba(255,80,80,0.2)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'none', border: '1px solid var(--border-2)', color: 'var(--text-2)', borderRadius: 10, padding: 11, fontFamily: 'var(--sans)', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ flex: 1, background: 'var(--green)', color: 'var(--bg)', border: 'none', borderRadius: 10, padding: 11, fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Agent CTA card ────────────────────────────────────────────────────────────
function AgentCard({ fillPct }) {
  const couldFill = Math.min(100, Math.round((100 - fillPct) * 0.72))
  return (
    <div style={{ width: 268, flexShrink: 0, background: '#0F1A10', border: '1px solid #1E3020', borderRadius: 20, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 0, height: 'fit-content', position: 'sticky', top: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#2d5a3d,#1a3828)', border: '2px solid #A0FF79', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🤖</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7E8C7C' }}>Agente IA</span>
            <span style={{ background: '#A0FF79', color: '#0B0E0C', borderRadius: 99, padding: '1px 7px', fontFamily: 'var(--mono)', fontSize: 8, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Popular</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#F4F7F2', letterSpacing: '-0.02em', lineHeight: 1 }}>Mateo</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#A0FF79', marginTop: 2 }}>Especialista en ocupación</div>
        </div>
      </div>

      {/* Quote */}
      <div style={{ fontStyle: 'italic', color: '#B6C4B2', fontSize: 12.5, lineHeight: 1.5, marginBottom: 10, borderLeft: '2px solid #A0FF7940', paddingLeft: 10 }}>
        "Tu agenda siempre llena."
      </div>

      {/* Description */}
      <p style={{ margin: '0 0 12px', fontSize: 12, color: '#7E8C7C', lineHeight: 1.6 }}>
        Mateo detecta los huecos libres antes de que se pierdan. Localiza clientes anteriores y los contacta con el mensaje justo en el momento oportuno.
      </p>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
        {[
          'Detecta huecos libres automáticamente',
          'Reactiva clientes que no han vuelto',
          'Manda promociones por WhatsApp',
          'Aumenta tu facturación sin esfuerzo',
        ].map(f => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#A0FF79', marginTop: 5, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: '#B6C4B2', lineHeight: 1.4 }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Fill stat */}
      <div style={{ background: 'rgba(160,255,121,0.07)', border: '1px solid rgba(160,255,121,0.15)', borderRadius: 10, padding: '10px 12px', marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800, color: '#A0FF79', lineHeight: 1 }}>+{couldFill}%</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7E8C7C', marginTop: 3 }}>de agenda podría llenar</div>
      </div>

      {/* Price + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#F4F7F2', lineHeight: 1 }}>79 €</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: '#7E8C7C', marginTop: 2 }}>al mes</div>
        </div>
        <button style={{ background: '#A0FF79', color: '#0B0E0C', border: 'none', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: 1 }}>
          Contratar a Mateo
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReservasPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [reservas, setReservas]       = useState([])
  const [weekRef, setWeekRef]         = useState(new Date())
  const [modal, setModal]             = useState(null)   // null | { fecha, hora }
  const [nowY, setNowY]               = useState(nowTop())
  const [toast, setToast]             = useState('')
  const gridRef = useRef(null)

  const weekDays = getWeekDays(weekRef)
  const weekStart = toDateStr(weekDays[0])
  const weekEnd   = toDateStr(weekDays[6])

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setAuthChecked(true)
    })
  }, [router])

  // Fetch reservas for current week
  const loadReservas = useCallback(async () => {
    if (!authChecked) return
    const { data } = await supabase.from('reservas').select('*')
      .gte('fecha', weekStart).lte('fecha', weekEnd)
    setReservas(data || [])
  }, [authChecked, weekStart, weekEnd])

  useEffect(() => { loadReservas() }, [loadReservas])

  // Realtime updates
  useEffect(() => {
    if (!authChecked) return
    const ch = supabase.channel('reservas-cal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservas' }, loadReservas)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [authChecked, loadReservas])

  // Current time line — update every minute
  useEffect(() => {
    setNowY(nowTop())
    const t = setInterval(() => setNowY(nowTop()), 60000)
    return () => clearInterval(t)
  }, [])

  // Toast auto-hide
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Click on grid to create slot
  const handleGridClick = (e, dayDate) => {
    if (e.target !== e.currentTarget && !e.target.classList.contains('grid-cell')) return
    const rect = gridRef.current.getBoundingClientRect()
    const y    = e.clientY - rect.top + gridRef.current.scrollTop
    const mins = Math.round(((y / HOUR_H) * 60 + START_HOUR * 60) / 30) * 30
    const h    = String(Math.floor(mins / 60)).padStart(2, '0')
    const m    = String(mins % 60).padStart(2, '0')
    setModal({ fecha: toDateStr(dayDate), hora: `${h}:${m}` })
  }

  // Stats
  const today = toDateStr(new Date())
  const isThisWeek = weekDays.some(d => toDateStr(d) === today)
  const totalSlots  = TOTAL_H * 2  // 30-min slots per day * 7 days? use per week
  const bookedSlots = reservas.filter(r => r.estado !== 'cancelado').length
  const fillPct     = Math.min(100, Math.round((bookedSlots / Math.max(1, TOTAL_H * 7)) * 100 * 5)) // rough

  const prevWeek = () => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d) }
  const nextWeek = () => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d) }
  const goToday  = () => setWeekRef(new Date())

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.15em' }}>Cargando...</div>
    </div>
  )

  const TIME_COL_W = 52

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <Sidebar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── Top bar ── */}
        <header style={{ flexShrink: 0, padding: '16px 24px 12px', borderBottom: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

          {/* Title + nav */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Agenda</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>Reservas</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={prevWeek} style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer', fontSize: 14 }}>‹</button>
                <button onClick={goToday} style={{ background: isThisWeek ? 'var(--green-dim)' : 'none', border: `1px solid ${isThisWeek ? 'var(--green-border)' : 'var(--border-2)'}`, borderRadius: 7, padding: '4px 10px', color: isThisWeek ? 'var(--green)' : 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.06em' }}>HOY</button>
                <button onClick={nextWeek} style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer', fontSize: 14 }}>›</button>
              </div>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>
                {weekDays[0].getDate()} {MONTHS_ES[weekDays[0].getMonth()]} – {weekDays[6].getDate()} {MONTHS_ES[weekDays[6].getMonth()]} {weekDays[6].getFullYear()}
              </span>
            </div>
          </div>

          {/* Fill % */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--elevated)', border: '1px solid var(--border-2)', borderRadius: 12, padding: '10px 16px' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>Agenda esta semana</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 120, height: 6, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${fillPct}%`, background: fillPct > 75 ? 'var(--green)' : fillPct > 40 ? '#ffb432' : '#ff5050', borderRadius: 99, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{fillPct}%</span>
              </div>
            </div>
            <div style={{ width: 1, height: 28, background: 'var(--border-2)' }} />
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>Reservas</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{bookedSlots}</div>
            </div>
          </div>

          {/* New reservation button */}
          <button onClick={() => setModal({ fecha: today, hora: '09:00' })}
            style={{ background: 'var(--green)', color: 'var(--bg)', border: 'none', borderRadius: 10, padding: '10px 18px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: 17, lineHeight: 1 }}>+</span> Nueva reserva
          </button>
        </header>

        {/* ── Body: calendar + agent card ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0 }}>

          {/* Calendar area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Day headers */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--panel)', flexShrink: 0 }}>
              <div style={{ width: TIME_COL_W, flexShrink: 0 }} />
              {weekDays.map(day => {
                const isToday = toDateStr(day) === today
                return (
                  <div key={toDateStr(day)} style={{ flex: 1, padding: '10px 8px 8px', textAlign: 'center', borderLeft: '1px solid var(--border)', background: isToday ? 'rgba(160,255,121,0.04)' : 'transparent' }}>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: isToday ? 'var(--green)' : 'var(--text-3)', marginBottom: 4 }}>
                      {DAYS_ES[day.getDay()]}
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: isToday ? 'var(--green)' : 'transparent', color: isToday ? 'var(--bg)' : 'var(--text-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontWeight: isToday ? 800 : 600, fontSize: 14 }}>
                      {day.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Scrollable grid */}
            <div ref={gridRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
              <div style={{ display: 'flex', minHeight: GRID_H, position: 'relative' }}>

                {/* Time column */}
                <div style={{ width: TIME_COL_W, flexShrink: 0, position: 'relative' }}>
                  {Array.from({ length: TOTAL_H + 1 }, (_, i) => (
                    <div key={i} style={{ position: 'absolute', top: i * HOUR_H - 8, right: 8, fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--text-3)', textAlign: 'right', userSelect: 'none', letterSpacing: '0.04em' }}>
                      {fmtHour(START_HOUR + i)}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {weekDays.map(day => {
                  const dateStr    = toDateStr(day)
                  const isToday    = dateStr === today
                  const dayReservas = reservas.filter(r => r.fecha === dateStr)

                  return (
                    <div key={dateStr}
                      onClick={e => handleGridClick(e, day)}
                      style={{ flex: 1, borderLeft: '1px solid var(--border)', position: 'relative', cursor: 'crosshair', background: isToday ? 'rgba(160,255,121,0.02)' : 'transparent' }}
                    >
                      {/* Hour lines */}
                      {Array.from({ length: TOTAL_H + 1 }, (_, i) => (
                        <div key={i} style={{ position: 'absolute', top: i * HOUR_H, left: 0, right: 0, borderTop: `1px solid var(--border)`, pointerEvents: 'none' }} />
                      ))}
                      {/* Half-hour lines */}
                      {Array.from({ length: TOTAL_H }, (_, i) => (
                        <div key={`h${i}`} style={{ position: 'absolute', top: i * HOUR_H + HOUR_H / 2, left: 0, right: 0, borderTop: '1px dashed rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                      ))}

                      {/* Current time line */}
                      {isToday && nowY >= 0 && nowY <= GRID_H && (
                        <div style={{ position: 'absolute', top: nowY, left: -6, right: 0, zIndex: 10, pointerEvents: 'none' }}>
                          <div style={{ position: 'relative' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff4444', position: 'absolute', left: 0, top: -4 }} />
                            <div style={{ height: 2, background: '#ff4444', marginLeft: 6, boxShadow: '0 0 6px rgba(255,68,68,0.5)' }} />
                          </div>
                        </div>
                      )}

                      {/* Reservas */}
                      {dayReservas.map(r => {
                        const top   = timeToTop(r.hora)
                        const cfg   = STATUS_CFG[r.estado] || STATUS_CFG.pendiente
                        return (
                          <div key={r.id}
                            onClick={e => e.stopPropagation()}
                            style={{
                              position: 'absolute', top: top + 1, left: 3, right: 3,
                              height: HOUR_H - 4, borderRadius: 8,
                              background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                              padding: '4px 7px', overflow: 'hidden', cursor: 'default', zIndex: 2,
                            }}>
                            <div style={{ fontWeight: 700, fontSize: 11, color: cfg.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.cliente_nombre}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.servicio}</div>
                            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', marginTop: 1 }}>{r.hora?.slice(0, 5)}</div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Agent CTA sidebar */}
          <div style={{ padding: '24px 20px', borderLeft: '1px solid var(--border)', background: 'var(--panel)', overflowY: 'auto', flexShrink: 0 }}>
            <AgentCard fillPct={fillPct} />
          </div>
        </div>
      </main>

      {/* Modal */}
      {modal && (
        <Modal
          initial={modal}
          onClose={() => setModal(null)}
          onSuccess={() => { loadReservas(); setToast('¡Reserva guardada!') }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 200, background: 'rgba(160,255,121,0.12)', border: '1px solid rgba(160,255,121,0.3)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <span style={{ color: 'var(--green)', fontSize: 16 }}>✓</span>
          <span style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 600 }}>{toast}</span>
        </div>
      )}
    </div>
  )
}
