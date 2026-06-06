'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

const AUTH_REDIRECT = '/login'

const DAYS = [
  { dia: 1, label: 'Lunes' },
  { dia: 2, label: 'Martes' },
  { dia: 3, label: 'Miércoles' },
  { dia: 4, label: 'Jueves' },
  { dia: 5, label: 'Viernes' },
  { dia: 6, label: 'Sábado' },
  { dia: 0, label: 'Domingo' },
]

const DEFAULT_DISP = DAYS.map(d => ({
  dia: d.dia,
  activo: d.dia >= 1 && d.dia <= 5,
  hora_inicio: '09:00',
  hora_fin: '18:00',
}))

function Toggle({ checked, onChange }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      width: 38, height: 22, borderRadius: 11,
      background: checked ? 'rgba(160,255,121,0.18)' : 'var(--elevated)',
      border: `1px solid ${checked ? 'rgba(160,255,121,0.35)' : 'var(--border-2)'}`,
      cursor: 'pointer', position: 'relative', transition: 'all 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 16, height: 16, borderRadius: '50%',
        background: checked ? 'var(--green)' : 'var(--text-3)',
        position: 'absolute', top: 2,
        left: checked ? 19 : 2,
        transition: 'all 0.2s', boxShadow: checked ? '0 0 6px rgba(160,255,121,0.4)' : 'none',
      }} />
    </div>
  )
}

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t) }, [onDone])
  const isOk = type === 'success'
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 200, background: isOk ? 'rgba(160,255,121,0.12)' : 'rgba(255,80,80,0.10)', border: `1px solid ${isOk ? 'rgba(160,255,121,0.3)' : 'rgba(255,80,80,0.25)'}`, borderRadius: 12, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <span style={{ color: isOk ? 'var(--green)' : '#ff6b6b', fontSize: 16 }}>{isOk ? '✓' : '✕'}</span>
      <span style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 600 }}>{msg}</span>
    </div>
  )
}

export default function AgendaPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [disponibilidad, setDisponibilidad] = useState(DEFAULT_DISP)
  const [servicios, setServicios] = useState([])
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push(AUTH_REDIRECT); return }
      setUser(session.user)
      setAuthChecked(true)
    })
  }, [router])

  const loadData = useCallback(async (uid) => {
    const [{ data: disp }, { data: serv }] = await Promise.all([
      supabase.from('disponibilidad').select('*').eq('user_id', uid),
      supabase.from('servicios').select('*').eq('user_id', uid).order('created_at'),
    ])
    if (disp && disp.length > 0) {
      setDisponibilidad(DEFAULT_DISP.map(def => {
        const found = disp.find(d => d.dia === def.dia)
        return found ? { dia: found.dia, activo: found.activo, hora_inicio: found.hora_inicio, hora_fin: found.hora_fin } : def
      }))
    }
    if (serv) setServicios(serv.map(s => ({ ...s, _key: s.id })))
  }, [])

  useEffect(() => {
    if (authChecked && user) loadData(user.id)
  }, [authChecked, user, loadData])

  const updateDia = (dia, field, value) => {
    setDisponibilidad(prev => prev.map(d => d.dia === dia ? { ...d, [field]: value } : d))
  }

  const addServicio = () => {
    setServicios(prev => [...prev, { _key: Date.now(), nombre: '', duracion_minutos: 60 }])
  }

  const removeServicio = (key) => {
    setServicios(prev => prev.filter(s => s._key !== key))
  }

  const updateServicio = (key, field, value) => {
    setServicios(prev => prev.map(s => s._key === key ? { ...s, [field]: value } : s))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error: dispError } = await supabase
        .from('disponibilidad')
        .upsert(
          disponibilidad.map(d => ({ ...d, user_id: user.id })),
          { onConflict: 'user_id,dia' }
        )
      if (dispError) throw dispError

      await supabase.from('servicios').delete().eq('user_id', user.id)
      const validServicios = servicios.filter(s => s.nombre.trim())
      if (validServicios.length > 0) {
        const { error: servError } = await supabase.from('servicios').insert(
          validServicios.map(({ nombre, duracion_minutos }) => ({ nombre, duracion_minutos: Number(duracion_minutos), user_id: user.id }))
        )
        if (servError) throw servError
      }

      await loadData(user.id)
      setToast({ msg: '¡Cambios guardados correctamente!', type: 'success' })
    } catch (err) {
      setToast({ msg: err.message || 'Error al guardar', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.15em' }}>Cargando...</div>
    </div>
  )

  const timeInputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border-2)', borderRadius: 7,
    padding: '6px 10px', color: 'var(--text-1)', fontFamily: 'var(--mono)', fontSize: 13,
    outline: 'none', cursor: 'pointer', width: 90,
  }

  const inputStyle = {
    background: 'var(--bg)', border: '1px solid var(--border-2)', borderRadius: 8,
    padding: '8px 12px', color: 'var(--text-1)', fontFamily: '"Funnel Sans",system-ui,sans-serif',
    fontSize: 14, outline: 'none', flex: 1,
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '32px 36px', maxWidth: 820 }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 4 }}>Configuración</div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-1)' }}>Agenda</h1>
              <p style={{ margin: '6px 0 0', color: 'var(--text-2)', fontSize: 14 }}>Definí cuándo podés atender y qué servicios ofrecés.</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ background: saving ? 'var(--green-dim)' : 'var(--green)', color: 'var(--bg)', border: 'none', borderRadius: 10, padding: '10px 24px', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.8 : 1, transition: 'opacity 0.15s' }}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>

          {/* Disponibilidad semanal */}
          <section style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-1)' }}>Disponibilidad semanal</h2>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>
                {disponibilidad.filter(d => d.activo).length} días activos
              </span>
            </div>

            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {DAYS.map((day, i) => {
                const config = disponibilidad.find(d => d.dia === day.dia) || DEFAULT_DISP.find(d => d.dia === day.dia)
                const isLast = i === DAYS.length - 1
                return (
                  <div key={day.dia} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px', borderBottom: isLast ? 'none' : '1px solid var(--border)', background: config.activo ? 'transparent' : 'rgba(0,0,0,0.04)', transition: 'background 0.15s' }}>
                    <Toggle checked={config.activo} onChange={v => updateDia(day.dia, 'activo', v)} />
                    <span style={{ width: 90, fontWeight: config.activo ? 600 : 400, fontSize: 14, color: config.activo ? 'var(--text-1)' : 'var(--text-3)', transition: 'color 0.15s' }}>{day.label}</span>
                    {config.activo ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>DESDE</span>
                        <input
                          type="time"
                          value={config.hora_inicio}
                          onChange={e => updateDia(day.dia, 'hora_inicio', e.target.value)}
                          style={timeInputStyle}
                        />
                        <span style={{ color: 'var(--text-3)', fontSize: 16, fontWeight: 300 }}>→</span>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)', letterSpacing: '0.08em' }}>HASTA</span>
                        <input
                          type="time"
                          value={config.hora_fin}
                          onChange={e => updateDia(day.dia, 'hora_fin', e.target.value)}
                          style={timeInputStyle}
                        />
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-3)' }}>
                          {(() => {
                            const [sh, sm] = config.hora_inicio.split(':').map(Number)
                            const [eh, em] = config.hora_fin.split(':').map(Number)
                            const mins = (eh * 60 + em) - (sh * 60 + sm)
                            if (mins <= 0) return ''
                            const h = Math.floor(mins / 60), m = mins % 60
                            return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`
                          })()}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>No disponible</span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Servicios */}
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-1)' }}>Servicios</h2>
              <button
                onClick={addServicio}
                style={{ background: 'var(--green-dim)', border: '1px solid var(--green-border)', color: 'var(--green)', borderRadius: 8, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Agregar servicio
              </button>
            </div>

            <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 40px', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--elevated)' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Nombre del servicio</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Duración (min)</span>
                <span />
              </div>

              {servicios.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>✂️</div>
                  <div>No hay servicios cargados.</div>
                  <button onClick={addServicio} style={{ marginTop: 12, background: 'var(--green)', color: 'var(--bg)', border: 'none', borderRadius: 8, padding: '7px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Agregar primer servicio
                  </button>
                </div>
              ) : servicios.map((s, i) => (
                <div key={s._key} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 40px', gap: 12, padding: '10px 16px', alignItems: 'center', borderBottom: i < servicios.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <input
                    value={s.nombre}
                    onChange={e => updateServicio(s._key, 'nombre', e.target.value)}
                    placeholder="Ej: Uñas acrílicas"
                    style={inputStyle}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      min="5"
                      max="480"
                      step="5"
                      value={s.duracion_minutos}
                      onChange={e => updateServicio(s._key, 'duracion_minutos', e.target.value)}
                      style={{ ...inputStyle, flex: 'none', width: 70, textAlign: 'center' }}
                    />
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)' }}>min</span>
                  </div>
                  <button
                    onClick={() => removeServicio(s._key)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, transition: 'color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* API Info */}
          <div style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>Endpoint para el agente</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--green)', marginBottom: 6 }}>GET /api/disponibilidad</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>
              Parámetros: <span style={{ color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>fecha</span> (YYYY-MM-DD) · <span style={{ color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>servicio_id</span> · <span style={{ color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>user_id</span>
              <br />Devuelve los horarios disponibles considerando tu agenda, los turnos ya ocupados y la duración del servicio.
            </div>
          </div>

        </div>
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  )
}
