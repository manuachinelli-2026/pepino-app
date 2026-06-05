'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

const C = {
  bg: '#0B0E0C', panel: '#11150F', elevated: '#161B12',
  green: '#A0FF79',
  text1: '#F4F7F2', text2: '#B6C4B2', text3: '#7E8C7C',
  border: '#243026', border2: '#324034',
  mono: '"JetBrains Mono", monospace',
}

const STATUS_COLORS = {
  pendiente:  { bg: 'rgba(255,180,50,0.12)',  border: 'rgba(255,180,50,0.25)',  text: '#ffb432' },
  confirmado: { bg: 'rgba(160,255,121,0.10)', border: 'rgba(160,255,121,0.22)', text: '#A0FF79' },
  cancelado:  { bg: 'rgba(255,80,80,0.10)',   border: 'rgba(255,80,80,0.22)',   text: '#ff5050' },
  completado: { bg: 'rgba(100,160,255,0.10)', border: 'rgba(100,160,255,0.22)', text: '#64a0ff' },
}

const SERVICIOS = ['Corte de cabello', 'Coloración', 'Manicura', 'Pedicura', 'Tratamiento facial', 'Masaje', 'Otro']

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pendiente
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 99, fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: s.text, textTransform: 'capitalize' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.text, display: 'inline-block' }} />
      {status}
    </span>
  )
}

function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 200, background: 'rgba(160,255,121,0.12)', border: '1px solid rgba(160,255,121,0.3)', borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <span style={{ color: '#A0FF79', fontSize: 16 }}>✓</span>
      <span style={{ color: '#F4F7F2', fontSize: 13, fontWeight: 600 }}>{msg}</span>
    </div>
  )
}

function Modal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ cliente_nombre: '', cliente_telefono: '', servicio: '', fecha: '', hora: '', estado: 'pendiente' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.from('turnos').insert([form])
    setLoading(false)
    if (err) { setError(err.message); return }
    onSuccess()
    onClose()
  }

  const inputStyle = { background: '#0B0E0C', border: `1px solid ${C.border2}`, borderRadius: 9, padding: '10px 13px', color: C.text1, fontFamily: '"Funnel Sans",system-ui,sans-serif', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }
  const labelStyle = { fontFamily: C.mono, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.text3, marginBottom: 5, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(11,14,12,0.88)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div style={{ background: C.panel, border: `1px solid ${C.border2}`, borderRadius: 20, padding: '32px', width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>Nuevo turno</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.text3, cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nombre cliente</label>
              <input value={form.cliente_nombre} onChange={e => set('cliente_nombre', e.target.value)} required placeholder="Ej: María García" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Teléfono</label>
              <input value={form.cliente_telefono} onChange={e => set('cliente_telefono', e.target.value)} placeholder="+54911..." style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Servicio</label>
            <select value={form.servicio} onChange={e => set('servicio', e.target.value)} required style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Seleccionar servicio...</option>
              {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Hora</label>
              <input type="time" value={form.hora} onChange={e => set('hora', e.target.value)} required style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Estado</label>
            <select value={form.estado} onChange={e => set('estado', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmado">Confirmado</option>
              <option value="cancelado">Cancelado</option>
              <option value="completado">Completado</option>
            </select>
          </div>
          {error && <div style={{ color: '#ff6b6b', fontFamily: C.mono, fontSize: 11, padding: '8px 12px', background: 'rgba(255,80,80,0.08)', borderRadius: 7, border: '1px solid rgba(255,80,80,0.2)' }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, background: 'none', border: `1px solid ${C.border2}`, color: C.text2, borderRadius: 10, padding: '11px', fontFamily: 'inherit', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ flex: 1, background: '#A0FF79', color: '#0B0E0C', border: 'none', borderRadius: 10, padding: '11px', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Guardando...' : 'Guardar turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function TurnosPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [turnos, setTurnos] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState('')
  const [loading, setLoading] = useState(true)

  const loadTurnos = useCallback(async () => {
    const { data } = await supabase.from('turnos').select('*').order('fecha', { ascending: true }).order('hora', { ascending: true })
    setTurnos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setAuthChecked(true)
    })
  }, [router])

  useEffect(() => {
    if (!authChecked) return
    loadTurnos()
    const channel = supabase
      .channel('turnos-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'turnos' }, loadTurnos)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [authChecked, loadTurnos])

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este turno?')) return
    await supabase.from('turnos').delete().eq('id', id)
  }

  const formatFecha = (f) => {
    if (!f) return '-'
    const [y, m, d] = f.split('-')
    return `${d}/${m}/${y}`
  }

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ fontFamily: C.mono, fontSize: 11, color: C.text3, letterSpacing: '0.15em' }}>Cargando...</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '32px 36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: C.mono, fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.text3, marginBottom: 4 }}>Agenda</div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>Turnos</h1>
            </div>
            <button onClick={() => setShowModal(true)} style={{ background: '#A0FF79', color: '#0B0E0C', border: 'none', borderRadius: 10, padding: '10px 20px', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Nuevo turno
            </button>
          </div>

          <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Cliente', 'Servicio', 'Fecha', 'Hora', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: C.mono, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.text3, fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: C.text3, fontFamily: C.mono, fontSize: 12 }}>Cargando turnos...</td></tr>
                ) : turnos.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '56px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>📅</div>
                    <div style={{ color: C.text3, fontSize: 14 }}>No hay turnos cargados aún.</div>
                    <button onClick={() => setShowModal(true)} style={{ marginTop: 14, background: '#A0FF79', color: '#0B0E0C', border: 'none', borderRadius: 8, padding: '8px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Crear primer turno</button>
                  </td></tr>
                ) : turnos.map((t, i) => (
                  <tr key={t.id} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: C.text1 }}>{t.cliente_nombre}</div>
                      {t.cliente_telefono && <div style={{ fontFamily: C.mono, fontSize: 10, color: C.text3, marginTop: 2 }}>{t.cliente_telefono}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: C.text2 }}>{t.servicio}</td>
                    <td style={{ padding: '12px 16px', fontFamily: C.mono, fontSize: 12, color: C.text2 }}>{formatFecha(t.fecha)}</td>
                    <td style={{ padding: '12px 16px', fontFamily: C.mono, fontSize: 12, color: C.text2 }}>{t.hora?.slice(0, 5) || '-'}</td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={t.estado} /></td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => handleDelete(t.id)}
                        style={{ background: 'none', border: `1px solid ${C.border2}`, color: C.text3, borderRadius: 6, padding: '4px 10px', fontFamily: 'inherit', fontSize: 11, cursor: 'pointer', transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#4a2020'; e.currentTarget.style.color = '#ff6b6b' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.text3 }}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showModal && <Modal onClose={() => setShowModal(false)} onSuccess={() => setToast('¡Turno guardado correctamente!')} />}
      {toast && <Toast msg={toast} onDone={() => setToast('')} />}
    </div>
  )
}