'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

export default function ConfiguracionPage() {
  const [user, setUser]       = useState(null)
  const [status, setStatus]   = useState(null) // no_instance | connecting | open | disconnected
  const [qr, setQr]           = useState(null)
  const [info, setInfo]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        fetchStatus(session.user.id)
      }
    })
  }, [])

  const fetchStatus = useCallback(async (uid) => {
    const res = await fetch(`/api/whatsapp/status?user_id=${uid}`)
    const data = await res.json()
    setStatus(data.status)
    setQr(data.qr || null)
    setInfo(data)
    return data.status
  }, [])

  // Poll while connecting
  useEffect(() => {
    if (status !== 'connecting' && status !== 'close') return
    setPolling(true)
    const interval = setInterval(async () => {
      const s = await fetchStatus(user.id)
      if (s === 'open') {
        setPolling(false)
        clearInterval(interval)
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [status, user, fetchStatus])

  const handleConnect = async () => {
    setLoading(true)
    const res = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id })
    })
    const data = await res.json()
    setStatus(data.status)
    setQr(data.qr)
    setLoading(false)
  }

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar WhatsApp? Dejarás de recibir mensajes.')) return
    setLoading(true)
    await fetch('/api/whatsapp/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id })
    })
    setStatus('no_instance')
    setQr(null)
    setInfo(null)
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '40px', maxWidth: 600 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
          Configuración
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40 }}>
          Conectá tu línea de WhatsApp
        </p>

        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 28 }}>📱</span>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text)' }}>
                WhatsApp
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)' }}>
                Conectá tu número para recibir y responder mensajes
              </p>
            </div>
          </div>

          {/* Status badge */}
          <StatusBadge status={status} />

          {/* Connected info */}
          {status === 'open' && info?.profile_name && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '16px', background: 'var(--bg)', borderRadius: 12, margin: '20px 0'
            }}>
              <span style={{ fontSize: 32 }}>✅</span>
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>{info.profile_name}</p>
                {info.phone_number && (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                    +{info.phone_number}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* QR Code */}
          {qr && status !== 'open' && (
            <div style={{ textAlign: 'center', margin: '24px 0' }}>
              <p style={{ marginBottom: 12, color: 'var(--text-secondary)', fontSize: 14 }}>
                Escaneá este QR desde WhatsApp → Dispositivos vinculados
              </p>
              <img
                src={qr}
                alt="QR WhatsApp"
                style={{ width: 220, height: 220, borderRadius: 12, border: '1px solid var(--border)' }}
              />
              {polling && (
                <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                  Esperando escaneo...
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            {(status === 'no_instance' || status === 'disconnected' || !status) && (
              <button
                onClick={handleConnect}
                disabled={loading}
                style={{
                  padding: '10px 24px', background: '#22c55e', color: '#fff',
                  border: 'none', borderRadius: 8, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Conectando...' : 'Conectar WhatsApp'}
              </button>
            )}
            {status === 'open' && (
              <button
                onClick={handleDisconnect}
                disabled={loading}
                style={{
                  padding: '10px 24px', background: 'transparent', color: '#ef4444',
                  border: '1px solid #ef4444', borderRadius: 8, fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Desconectando...' : 'Desconectar'}
              </button>
            )}
            {(status === 'connecting' || status === 'close') && !qr && (
              <button
                onClick={() => fetchStatus(user?.id)}
                style={{
                  padding: '10px 24px', background: 'transparent', color: 'var(--text)',
                  border: '1px solid var(--border)', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Obtener QR
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    open:         { label: 'Conectado',      color: '#22c55e', bg: '#dcfce7' },
    connecting:   { label: 'Conectando...',  color: '#f59e0b', bg: '#fef9c3' },
    close:        { label: 'Conectando...',  color: '#f59e0b', bg: '#fef9c3' },
    disconnected: { label: 'Desconectado',   color: '#ef4444', bg: '#fee2e2' },
    no_instance:  { label: 'Sin configurar', color: '#6b7280', bg: '#f3f4f6' },
  }
  const s = map[status] || map.no_instance
  return (
    <span style={{
      display: 'inline-block', padding: '4px 12px',
      background: s.bg, color: s.color,
      borderRadius: 20, fontSize: 13, fontWeight: 600
    }}>
      {s.label}
    </span>
  )
}
