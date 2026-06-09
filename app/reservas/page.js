'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

// ── Calendar constants ─────────────────────────────────────────────────────
const START_HOUR = 0
const END_HOUR   = 24
const HOUR_H     = 56
const TOTAL_H    = END_HOUR - START_HOUR
const GRID_H     = TOTAL_H * HOUR_H

const DAYS_ES   = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const STATUS_CFG = {
  pendiente:  { bg: 'rgba(255,180,50,0.18)',  border: '#ffb432', text: '#b37a00'  },
  confirmado: { bg: 'rgba(30,140,70,0.15)',   border: 'var(--green)', text: 'var(--green)' },
  cancelado:  { bg: 'rgba(255,80,80,0.12)',   border: '#ff5050', text: '#cc2222'  },
  completado: { bg: 'rgba(100,160,255,0.12)', border: '#64a0ff', text: '#2255cc' },
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getWeekDays(ref) {
  const d = new Date(ref), day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(mon); dd.setDate(mon.getDate() + i); return dd
  })
}
const toDateStr = d => d.toISOString().split('T')[0]
const snapMin   = (min, s = 15) => Math.round(min / s) * s
const yToMin    = y => Math.max(0, Math.min(END_HOUR * 60 - 30, snapMin(Math.floor((y / HOUR_H) * 60))))
const minToY    = min => (min / 60) * HOUR_H
function fmtMin(min) {
  const h = Math.floor(min / 60), m = min % 60
  const ampm = h < 12 ? 'am' : 'pm'
  const disp = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${disp}:${String(m).padStart(2,'0')} ${ampm}`
}
function fmtHour(h) {
  if (h === 24) return ''
  if (h === 0)  return '12 am'
  if (h === 12) return '12 pm'
  return h < 12 ? `${h} am` : `${h - 12} pm`
}
const nowTop = () => {
  const n = new Date()
  return ((n.getHours() * 60 + n.getMinutes()) / 60) * HOUR_H
}

// ── Modal: nueva reserva ───────────────────────────────────────────────────
function Modal({ initial, onClose, onSuccess }) {
  const [form, setForm] = useState({
    cliente_nombre: '', cliente_telefono: '', servicio_nombre: '', estado: 'pendiente',
    fecha: initial.fecha || '', hora: initial.hora || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const SERVICIOS = ['Corte de cabello', 'Coloración', 'Manicura', 'Pedicura', 'Tratamiento facial', 'Masaje', 'Otro']

  const inp = {
    background: 'var(--bg)', border: '1.5px solid var(--border-2)', borderRadius: 10,
    padding: '10px 14px', color: 'var(--text-1)', fontFamily: 'var(--sans)',
    fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  }
  const lbl = {
    fontFamily: 'var(--sans)', fontSize: 11, fontWeight: 600,
    color: 'var(--text-3)', marginBottom: 5, display: 'block',
  }

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true)
    const { error: err } = await supabase.from('turnos').insert([form])
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess(); onClose()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--panel)', border: '1px solid var(--border-2)', borderRadius: 22, padding: '28px 28px 24px', width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Nueva reserva</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{form.fecha && `${form.fecha} · `}{form.hora || 'Horario libre'}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--elevated)', border: '1px solid var(--border-2)', borderRadius: 9, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Nombre del cliente</label>
              <input value={form.cliente_nombre} onChange={e => set('cliente_nombre', e.target.value)} required placeholder="María García" style={inp}
                onFocus={e => e.target.style.borderColor = 'var(--green)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
              />
            </div>
            <div>
              <label style={lbl}>Teléfono</label>
              <input value={form.cliente_telefono} onChange={e => set('cliente_telefono', e.target.value)} placeholder="+54911..." style={inp}
                onFocus={e => e.target.style.borderColor = 'var(--green)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
              />
            </div>
          </div>

          <div>
            <label style={lbl}>Servicio</label>
            <select value={form.servicio_nombre} onChange={e => set('servicio_nombre', e.target.value)} required style={{ ...inp, cursor: 'pointer' }}>
              <option value="">Seleccionar servicio...</option>
              {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required style={inp} />
            </div>
            <div>
              <label style={lbl}>Hora</label>
              <input type="time" value={form.hora} onChange={e => set('hora', e.target.value)} required style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>Estado</label>
            <select value={form.estado} onChange={e => set('estado', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
              <option value="completado">Completado</option>
            </select>
          </div>

          {error && <div style={{ color: '#cc2222', fontSize: 12, padding: '8px 12px', background: 'rgba(255,80,80,0.08)', borderRadius: 8, border: '1px solid rgba(255,80,80,0.2)' }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'none', border: '1.5px solid var(--border-2)', color: 'var(--text-2)', borderRadius: 11, padding: 11, fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, background: 'var(--green)', color: '#0B0E0C', border: 'none', borderRadius: 11, padding: 11, fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Guardando...' : 'Guardar reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Mateo floating widget + drawer ─────────────────────────────────────────
function MateoWidget({ fillPct }) {
  const [open, setOpen] = useState(false)
  const couldFill = Math.min(99, Math.round((100 - fillPct) * 0.78))

  return (
    <>
      {/* Backdrop when open */}
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }} />}

      {/* Floating preview pill — always visible */}
      {!open && (
        <button onClick={() => setOpen(true)} style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 95,
          background: 'linear-gradient(135deg,#1a3828,#0d1f11)',
          border: '1px solid rgba(160,255,121,0.35)',
          borderRadius: 16, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(160,255,121,0.08)',
          cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.4), 0 0 24px rgba(160,255,121,0.15)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(160,255,121,0.08)' }}
        >
          {/* Avatar */}
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#2d5a3d,#1a3828)', border: '2px solid rgba(160,255,121,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🤖</div>
          {/* Info */}
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#F4F7F2', letterSpacing: '-0.01em', lineHeight: 1.2 }}>Mateo</div>
            <div style={{ fontSize: 11, color: '#A0FF79', fontWeight: 600, marginTop: 1 }}>+{couldFill}% agenda disponible</div>
          </div>
          {/* Chevron */}
          <div style={{ color: 'rgba(160,255,121,0.5)', fontSize: 16, marginLeft: 2 }}>›</div>
        </button>
      )}

      {/* Full drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 96,
        width: 320,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.22,0.61,0.36,1)',
        pointerEvents: open ? 'auto' : 'none',
      }}>
        <div style={{
          margin: 16, height: 'calc(100% - 32px)', borderRadius: 22,
          background: 'linear-gradient(160deg,#0d1f11 0%,#061209 100%)',
          border: '1px solid rgba(160,255,121,0.18)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(160,255,121,0.1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '14px 14px 0' }}>
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7E8C7C', cursor: 'pointer', fontSize: 15 }}>×</button>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Avatar + name */}
            <div style={{ textAlign: 'center', paddingBottom: 4 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(160,255,121,0.1)', border: '1px solid rgba(160,255,121,0.2)', borderRadius: 99, padding: '3px 10px', marginBottom: 12 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#A0FF79' }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#A0FF79', letterSpacing: '0.04em' }}>Agente IA · Más popular</span>
              </div>
              <div style={{ width: 66, height: 66, borderRadius: '50%', background: 'linear-gradient(135deg,#2d5a3d,#1a3828)', border: '2.5px solid rgba(160,255,121,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 10px', boxShadow: '0 0 24px rgba(160,255,121,0.18)' }}>🤖</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#F4F7F2', letterSpacing: '-0.03em', lineHeight: 1 }}>Mateo</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#A0FF79', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 4 }}>Especialista en ocupación</div>
            </div>

            {/* Quote */}
            <div style={{ background: 'rgba(160,255,121,0.06)', border: '1px solid rgba(160,255,121,0.1)', borderRadius: 11, padding: '10px 14px', textAlign: 'center' }}>
              <span style={{ fontStyle: 'italic', color: '#B6C4B2', fontSize: 13, lineHeight: 1.5 }}>"Tu agenda siempre llena."</span>
            </div>

            {/* Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Detecta huecos libres automáticamente',
                'Reactiva clientes que no volvieron',
                'WhatsApp personalizado en el momento justo',
                'Más facturación sin esfuerzo extra',
              ].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(160,255,121,0.1)', border: '1px solid rgba(160,255,121,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#A0FF79' }} />
                  </div>
                  <span style={{ fontSize: 12.5, color: '#B6C4B2', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Big stat */}
            <div style={{ background: 'linear-gradient(135deg,rgba(160,255,121,0.12),rgba(160,255,121,0.04))', border: '1px solid rgba(160,255,121,0.2)', borderRadius: 14, padding: '18px', textAlign: 'center', boxShadow: '0 0 40px rgba(160,255,121,0.06) inset' }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#A0FF79', lineHeight: 1, letterSpacing: '-0.04em', textShadow: '0 0 32px rgba(160,255,121,0.5)' }}>+{couldFill}%</div>
              <div style={{ fontSize: 11, color: '#7E8C7C', marginTop: 5, fontWeight: 500 }}>de tu agenda podría llenar</div>
            </div>

            {/* Price + CTA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#F4F7F2', lineHeight: 1, letterSpacing: '-0.02em' }}>79€</div>
                <div style={{ fontSize: 10, color: '#5A7060', marginTop: 1 }}>al mes</div>
              </div>
              <button style={{ flex: 1, background: 'var(--green)', color: '#0B0E0C', border: 'none', borderRadius: 11, padding: '13px', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 24px rgba(160,255,121,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(160,255,121,0.4)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(160,255,121,0.3)' }}
              >
                Contratar a Mateo
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ReservasPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [reservas, setReservas]       = useState([])
  const [weekRef, setWeekRef]         = useState(new Date())
  const [modal, setModal]             = useState(null)
  const [nowY, setNowY]               = useState(nowTop())
  const [toast, setToast]             = useState('')
  const [drag, setDrag]               = useState(null)
  const gridRef = useRef(null)

  const weekDays  = getWeekDays(weekRef)
  const weekStart = toDateStr(weekDays[0])
  const weekEnd   = toDateStr(weekDays[6])
  const today     = toDateStr(new Date())

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setAuthChecked(true)
    })
  }, [router])

  const loadReservas = useCallback(async () => {
    if (!authChecked) return
    const { data } = await supabase.from('turnos').select('*').gte('fecha', weekStart).lte('fecha', weekEnd)
    setReservas(data || [])
  }, [authChecked, weekStart, weekEnd])

  useEffect(() => { loadReservas() }, [loadReservas])

  useEffect(() => {
    if (!authChecked) return
    const ch = supabase.channel('turnos-cal')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, loadReservas)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [authChecked, loadReservas])

  useEffect(() => {
    setNowY(nowTop())
    const t = setInterval(() => setNowY(nowTop()), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // ── Drag-to-create ────────────────────────────────────────────────────
  const handleColMouseDown = useCallback((e, day) => {
    if (e.button !== 0) return
    e.preventDefault()
    const dateStr = toDateStr(day)
    const colRect = e.currentTarget.getBoundingClientRect()
    const getMin  = clientY => yToMin(clientY - colRect.top)
    const startMin = getMin(e.clientY)
    setDrag({ dateStr, startMin, endMin: startMin + 60 })

    const onMove = ev => {
      const endMin = Math.max(getMin(ev.clientY), startMin + 30)
      setDrag(prev => prev ? { ...prev, endMin } : null)
    }
    const onUp = () => {
      setDrag(prev => {
        if (prev) {
          const h = String(Math.floor(prev.startMin / 60)).padStart(2, '0')
          const m = String(prev.startMin % 60).padStart(2, '0')
          setModal({ fecha: prev.dateStr, hora: `${h}:${m}` })
        }
        return null
      })
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const bookedSlots = reservas.filter(r => r.estado !== 'cancelado').length
  const fillPct     = Math.min(100, Math.round((bookedSlots / Math.max(1, 14)) * 100))

  const prevWeek = () => { const d = new Date(weekRef); d.setDate(d.getDate() - 7); setWeekRef(d) }
  const nextWeek = () => { const d = new Date(weekRef); d.setDate(d.getDate() + 7); setWeekRef(d) }
  const isThisWeek = weekDays.some(d => toDateStr(d) === today)

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Cargando...</div>
    </div>
  )

  const TIME_COL_W = 52

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <Sidebar />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── Header ── */}
        <header style={{ flexShrink: 0, padding: '13px 20px 11px', borderBottom: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>Agenda</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>Reservas</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button onClick={prevWeek} style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer', fontSize: 14 }}>‹</button>
                <button onClick={() => setWeekRef(new Date())} style={{ background: isThisWeek ? 'var(--green-dim)' : 'none', border: `1px solid ${isThisWeek ? 'var(--green-border)' : 'var(--border-2)'}`, borderRadius: 7, padding: '4px 10px', color: isThisWeek ? 'var(--green)' : 'var(--text-2)', cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>HOY</button>
                <button onClick={nextWeek} style={{ background: 'none', border: '1px solid var(--border-2)', borderRadius: 7, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer', fontSize: 14 }}>›</button>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>
                {weekDays[0].getDate()} {MONTHS_ES[weekDays[0].getMonth()]} – {weekDays[6].getDate()} {MONTHS_ES[weekDays[6].getMonth()]} {weekDays[6].getFullYear()}
              </span>
            </div>
          </div>

          {/* Fill stat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--elevated)', border: '1px solid var(--border-2)', borderRadius: 12, padding: '8px 13px' }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Semana</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 90, height: 5, background: 'var(--border-2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${fillPct}%`, background: fillPct > 75 ? 'var(--green)' : fillPct > 40 ? '#ffb432' : '#64a0ff', borderRadius: 99, transition: 'width 0.4s' }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)' }}>{fillPct}%</span>
              </div>
            </div>
            <div style={{ width: 1, height: 22, background: 'var(--border-2)' }} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 2 }}>Reservas</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-1)' }}>{bookedSlots}</div>
            </div>
          </div>

          {/* New reservation */}
          <button onClick={() => setModal({ fecha: today, hora: '09:00' })}
            style={{ background: 'var(--green)', color: '#0B0E0C', border: 'none', borderRadius: 10, padding: '9px 16px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            + Nueva reserva
          </button>
        </header>

        {/* ── Calendar ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Day headers */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--panel)', flexShrink: 0 }}>
            <div style={{ width: TIME_COL_W, flexShrink: 0 }} />
            {weekDays.map(day => {
              const isToday = toDateStr(day) === today
              return (
                <div key={toDateStr(day)} style={{ flex: 1, padding: '10px 8px 8px', textAlign: 'center', borderLeft: '1px solid var(--border)', background: isToday ? 'rgba(43,138,62,0.04)' : 'transparent' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isToday ? 'var(--green)' : 'var(--text-3)', marginBottom: 4 }}>{DAYS_ES[day.getDay()]}</div>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: isToday ? 'var(--green)' : 'transparent', color: isToday ? '#0B0E0C' : 'var(--text-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontWeight: isToday ? 800 : 500, fontSize: 14 }}>{day.getDate()}</div>
                </div>
              )
            })}
          </div>

          {/* Scrollable grid */}
          <div ref={gridRef} style={{ flex: 1, overflowY: 'auto', position: 'relative', userSelect: 'none' }}>
            <div style={{ display: 'flex', minHeight: GRID_H }}>

              {/* Hour labels */}
              <div style={{ width: TIME_COL_W, flexShrink: 0, position: 'relative' }}>
                {Array.from({ length: TOTAL_H + 1 }, (_, i) => (
                  <div key={i} style={{ position: 'absolute', top: i * HOUR_H - 8, right: 10, fontSize: 10, fontWeight: 500, color: 'var(--text-3)', textAlign: 'right', userSelect: 'none' }}>
                    {fmtHour(START_HOUR + i)}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {weekDays.map(day => {
                const dateStr     = toDateStr(day)
                const isToday     = dateStr === today
                const dayReservas = reservas.filter(r => r.fecha === dateStr)
                const isDragging  = drag?.dateStr === dateStr

                return (
                  <div key={dateStr}
                    onMouseDown={e => handleColMouseDown(e, day)}
                    style={{ flex: 1, borderLeft: '1px solid var(--border)', position: 'relative', cursor: 'crosshair', background: isToday ? 'rgba(43,138,62,0.015)' : 'transparent' }}
                  >
                    {/* Hour lines */}
                    {Array.from({ length: TOTAL_H + 1 }, (_, i) => (
                      <div key={i} style={{ position: 'absolute', top: i * HOUR_H, left: 0, right: 0, borderTop: '1px solid var(--border)', pointerEvents: 'none' }} />
                    ))}
                    {/* Half-hour dashes */}
                    {Array.from({ length: TOTAL_H }, (_, i) => (
                      <div key={`h${i}`} style={{ position: 'absolute', top: i * HOUR_H + HOUR_H / 2, left: 0, right: 0, borderTop: '1px dashed rgba(128,128,128,0.07)', pointerEvents: 'none' }} />
                    ))}

                    {/* Current time line */}
                    {isToday && nowY >= 0 && nowY <= GRID_H && (
                      <div style={{ position: 'absolute', top: nowY, left: -5, right: 0, zIndex: 10, pointerEvents: 'none' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e53935', position: 'absolute', top: -4 }} />
                        <div style={{ height: 2, background: '#e53935', marginLeft: 6, boxShadow: '0 0 6px rgba(229,57,53,0.5)' }} />
                      </div>
                    )}

                    {/* Drag preview */}
                    {isDragging && drag && (
                      <div style={{
                        position: 'absolute', zIndex: 8, pointerEvents: 'none',
                        top: minToY(drag.startMin) + 1, left: 3, right: 3,
                        height: Math.max(20, minToY(drag.endMin) - minToY(drag.startMin) - 2),
                        borderRadius: 8,
                        background: 'rgba(43,138,62,0.15)',
                        border: '2px solid var(--green)',
                      }}>
                        <div style={{ padding: '4px 8px', fontSize: 9, fontWeight: 700, color: 'var(--green)' }}>
                          {fmtMin(drag.startMin)} – {fmtMin(drag.endMin)}
                        </div>
                      </div>
                    )}

                    {/* Events */}
                    {dayReservas.map(r => {
                      const horaStr = (r.hora || '00:00').slice(0, 5)
                      const [hh, mm] = horaStr.split(':').map(Number)
                      const startMin = hh * 60 + (mm || 0)
                      const durMin = r.duracion_minutos || 60
                      const top = minToY(startMin)
                      const height = Math.max(HOUR_H - 4, minToY(durMin) - 2)
                      const cfg = STATUS_CFG[r.estado] || STATUS_CFG.pendiente
                      const tel = r.cliente_telefono ? r.cliente_telefono.replace('@s.whatsapp.net', '').replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 $2 $3-$4') : null
                      return (
                        <div key={r.id}
                          onMouseDown={e => e.stopPropagation()}
                          style={{ position: 'absolute', top: top + 1, left: 3, right: 3, height, borderRadius: 8, background: cfg.bg, border: `1.5px solid ${cfg.border}`, padding: '6px 8px', overflow: 'hidden', cursor: 'default', zIndex: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                            <div style={{ fontWeight: 700, fontSize: 11.5, color: cfg.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.cliente_nombre}</div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: cfg.text, opacity: 0.7, flexShrink: 0 }}>{horaStr}</div>
                          </div>
                          {r.servicio_nombre && <div style={{ fontSize: 10.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.servicio_nombre}</div>}
                          {tel && height > HOUR_H && <div style={{ fontSize: 10, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tel}</div>}
                          {r.duracion_minutos && height > HOUR_H && <div style={{ fontSize: 9.5, color: 'var(--text-3)' }}>{r.duracion_minutos} min</div>}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Mateo floating widget */}
      <MateoWidget fillPct={fillPct} />

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
        <div style={{ position: 'fixed', bottom: 100, right: 28, zIndex: 300, background: 'rgba(43,138,62,0.12)', border: '1px solid rgba(43,138,62,0.3)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <span style={{ color: 'var(--green)', fontSize: 16 }}>✓</span>
          <span style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 600 }}>{toast}</span>
        </div>
      )}
    </div>
  )
}
