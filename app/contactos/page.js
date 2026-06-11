'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../../components/Sidebar'

// ── Constants ─────────────────────────────────────────────────────────────────
const LABEL_LIST = ['interesado', 'agendado', 'recurrente', 'nuevo']
const LABEL_COLORS = {
  interesado: { bg: 'rgba(167,139,250,0.14)', border: 'rgba(167,139,250,0.30)', text: '#A78BFA' },
  agendado:   { bg: 'rgba(160,255,121,0.12)', border: 'rgba(160,255,121,0.28)', text: 'var(--green)' },
  recurrente: { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.28)',  text: '#60A5FA' },
  nuevo:      { bg: 'rgba(251,146,60,0.12)',  border: 'rgba(251,146,60,0.28)',  text: '#FB923C' },
}
const STATUS_COLORS = {
  confirmado: { text: 'var(--green)', bg: 'var(--green-dim)',          border: 'var(--green-border)' },
  pendiente:  { text: '#ffb432',      bg: 'rgba(255,180,50,0.10)',    border: 'rgba(255,180,50,0.3)' },
  cancelado:  { text: '#ff6b6b',      bg: 'rgba(255,80,80,0.10)',     border: 'rgba(255,80,80,0.25)' },
  completado: { text: '#60A5FA',      bg: 'rgba(96,165,250,0.10)',    border: 'rgba(96,165,250,0.25)' },
}
const COL_TYPE_LABELS = { text: 'Texto', number: 'Número', date: 'Fecha', select: 'Selección' }

// ── Helpers ───────────────────────────────────────────────────────────────────
function getLabel(jid) {
  const sum = (jid || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return LABEL_LIST[sum % LABEL_LIST.length]
}
function normalizePhone(raw = '') {
  return raw.replace(/@.*$/, '').replace(/\D/g, '').slice(-10)
}
function isRealName(str) {
  return str && /[a-zA-ZÀ-ÿ\s]/.test(str) && str.length > 2
}
function formatTs(ts) {
  if (!ts) return null
  const d = new Date(ts * 1000)
  const diffDays = Math.floor((Date.now() - d) / 86400000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7)  return `Hace ${diffDays} días`
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: diffDays > 300 ? 'numeric' : undefined })
}
function formatFecha(s) {
  if (!s) return '—'
  return new Date(s + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatReservaShort(r) {
  if (!r) return null
  const fecha = new Date(r.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
  return `${fecha}${r.servicio_nombre ? ' · ' + r.servicio_nombre : ''}`
}
function downloadTemplate() {
  const rows = [
    ['nombre', 'telefono', 'email', 'notas'],
    ['María García', '5491112345678', 'maria@ejemplo.com', 'Cliente frecuente'],
    ['Juan Pérez',   '5491198765432', '', ''],
  ]
  const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = 'template-contactos.csv'; a.click()
  URL.revokeObjectURL(url)
}
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  return lines.slice(1).map(line => {
    const vals = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || line.split(',')
    const clean = vals.map(v => (v || '').trim().replace(/^"|"$/g, ''))
    const obj = {}
    headers.forEach((h, i) => { obj[h] = clean[i] || '' })
    return obj
  }).filter(r => r.nombre || r.telefono)
}

// ── Shared input style ────────────────────────────────────────────────────────
const baseInp = {
  background: 'var(--bg)', border: '1.5px solid var(--border-2)', borderRadius: 8,
  padding: '8px 11px', color: 'var(--text-1)', fontFamily: 'var(--sans)',
  fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }) {
  const hue = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue},30%,18%)`, border: `1px solid hsl(${hue},30%,28%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, color: `hsl(${hue},70%,72%)`,
      fontFamily: 'var(--mono)',
    }}>{(name || '?')[0].toUpperCase()}</div>
  )
}

function LabelBadge({ jid }) {
  const label = getLabel(jid)
  const c = LABEL_COLORS[label]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 99, background: c.bg, border: `1px solid ${c.border}`, fontFamily: 'var(--mono)', fontSize: 9, fontWeight: 700, color: c.text, textTransform: 'lowercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0 }}>
      {label}
    </span>
  )
}

function SortIcon({ dir }) {
  if (!dir) return <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.25, flexShrink: 0 }}><path d="M3 4l2-2 2 2M3 6l2 2 2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
  return <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ color: 'var(--green)', flexShrink: 0 }}><path d={dir === 'asc' ? 'M2 7l3-4 3 4' : 'M2 3l3 4 3-4'} stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

// ── Custom column inline cell ─────────────────────────────────────────────────
function CustomCell({ value, col, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value || '')

  const commit = useCallback((v) => {
    const final = v !== undefined ? v : val
    onSave(final)
    setEditing(false)
  }, [val, onSave])

  if (editing) {
    const cellInp = {
      background: 'var(--elevated)', border: '1px solid var(--green)', borderRadius: 6,
      padding: '3px 8px', color: 'var(--text-1)', fontFamily: 'var(--sans)',
      fontSize: 12.5, outline: 'none', width: '100%', boxSizing: 'border-box',
    }
    if (col.type === 'select') return (
      <select value={val} autoFocus
        onChange={e => { commit(e.target.value); setVal(e.target.value) }}
        onBlur={() => setEditing(false)}
        onClick={e => e.stopPropagation()}
        style={{ ...cellInp, cursor: 'pointer' }}
      >
        <option value="">—</option>
        {(col.options || []).map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
    return (
      <input value={val} autoFocus
        type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
        onChange={e => setVal(e.target.value)}
        onBlur={() => commit()}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
        onClick={e => e.stopPropagation()}
        style={cellInp}
      />
    )
  }

  return (
    <div onClick={e => { e.stopPropagation(); setEditing(true) }}
      title="Clic para editar"
      style={{ cursor: 'text', minHeight: 22, display: 'flex', alignItems: 'center', width: '100%' }}
    >
      {value
        ? <span style={{ fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.type === 'date' ? formatFecha(value) : value}</span>
        : <span style={{ fontSize: 12, color: 'var(--border-2)' }}>—</span>
      }
    </div>
  )
}

// ── Columns panel ─────────────────────────────────────────────────────────────
function ColumnsPanel({ cols, onAdd, onDelete, onClose, anchorRef }) {
  const [label, setLabel]       = useState('')
  const [type, setType]         = useState('text')
  const [optionsStr, setOptions] = useState('')
  const panelRef = useRef(null)
  const [pos, setPos] = useState({ top: 52, right: 16 })

  useEffect(() => {
    if (anchorRef.current) {
      const r = anchorRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
  }, [anchorRef])

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return
      onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose, anchorRef])

  const submit = (e) => {
    e.preventDefault()
    if (!label.trim()) return
    const opts = type === 'select' ? optionsStr.split(',').map(s => s.trim()).filter(Boolean) : []
    onAdd(label.trim(), type, opts)
    setLabel(''); setOptions(''); setType('text')
  }

  return (
    <div ref={panelRef} style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 200, background: 'var(--panel)', border: '1px solid var(--border-2)', borderRadius: 14, padding: 16, width: 272, boxShadow: '0 16px 48px rgba(0,0,0,0.35)' }}>

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', marginBottom: 12, letterSpacing: '-0.01em' }}>Columnas personalizadas</div>

      {/* Existing columns */}
      {cols.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {cols.map(col => (
            <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'var(--elevated)', border: '1px solid var(--border)' }}>
              <span style={{ flex: 1, fontSize: 13, color: 'var(--text-1)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.label}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--text-3)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>{COL_TYPE_LABELS[col.type] || col.type}</span>
              <button onClick={() => onDelete(col.id)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 16, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
                onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
              >×</button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '12px 0', marginBottom: 8 }}>Sin columnas personalizadas.</div>
      )}

      <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />

      {/* Add form */}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Nombre de la columna"
          style={baseInp}
          onFocus={e => e.target.style.borderColor = 'var(--green)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
        />
        <select value={type} onChange={e => setType(e.target.value)}
          style={{ ...baseInp, cursor: 'pointer' }}>
          <option value="text">Texto</option>
          <option value="number">Número</option>
          <option value="date">Fecha</option>
          <option value="select">Selección (opciones)</option>
        </select>
        {type === 'select' && (
          <input value={optionsStr} onChange={e => setOptions(e.target.value)} placeholder="opción1, opción2, opción3"
            style={baseInp}
            onFocus={e => e.target.style.borderColor = 'var(--green)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
          />
        )}
        <button type="submit" disabled={!label.trim()} style={{ background: label.trim() ? 'var(--green)' : 'var(--elevated)', color: label.trim() ? '#0B0E0C' : 'var(--text-3)', border: 'none', borderRadius: 8, padding: '9px 14px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 700, cursor: label.trim() ? 'pointer' : 'default', transition: 'background 0.15s' }}>
          + Agregar columna
        </button>
      </form>
    </div>
  )
}

// ── Import modal ──────────────────────────────────────────────────────────────
function ImportModal({ onClose, onImport }) {
  const [step, setStep]         = useState('upload')
  const [rows, setRows]         = useState([])
  const [error, setError]       = useState('')
  const [progress, setProgress] = useState(0)
  const fileRef = useRef(null)

  const handleFile = (file) => {
    if (!file) return; setError('')
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv'].includes(ext)) { setError('Solo se aceptan archivos .csv por ahora.'); return }
    const reader = new FileReader()
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result)
      if (!parsed.length) { setError('No se encontraron filas válidas.'); return }
      setRows(parsed); setStep('preview')
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleImport = async () => {
    setStep('importing'); let done = 0
    for (const row of rows) {
      const phone = normalizePhone(row.telefono || '')
      if (phone) await supabase.from('contactos').upsert({ phone, nombre: row.nombre || '', email: row.email || '', notas: row.notas || '' }, { onConflict: 'phone' })
      done++; setProgress(Math.round(done / rows.length * 100))
    }
    setStep('done'); onImport()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--panel)', border: '1px solid var(--border-2)', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
        <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Importar contactos</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Subí un archivo CSV con tu lista</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--elevated)', border: '1px solid var(--border-2)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 'upload' && (<>
            <button onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--elevated)', border: '1px solid var(--border-2)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', width: '100%' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
            >
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--green-dim)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }}>Descargar template CSV</div><div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>nombre, telefono, email, notas</div></div>
            </button>
            <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }} onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed var(--border-2)', borderRadius: 14, padding: '32px 20px', textAlign: 'center', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.background = 'var(--green-dim)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.background = 'transparent' }}
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.35 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="var(--text-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>Arrastrá tu archivo aquí</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>o hacé click para elegir un .csv</div>
              <input ref={fileRef} type="file" accept=".csv" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
            </div>
            {error && <div style={{ color: '#ff6b6b', fontSize: 12, padding: '10px 14px', background: 'rgba(255,80,80,0.08)', borderRadius: 8, border: '1px solid rgba(255,80,80,0.2)' }}>{error}</div>}
          </>)}
          {step === 'preview' && (<>
            <div style={{ fontSize: 13, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800, color: 'var(--green)' }}>{rows.length}</span> contacto{rows.length !== 1 ? 's' : ''} encontrado{rows.length !== 1 ? 's' : ''}
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1.5fr', background: 'var(--elevated)', padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
                {['Nombre', 'Teléfono', 'Email'].map(h => <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>{h}</span>)}
              </div>
              {rows.slice(0, 20).map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr 1.5fr', padding: '8px 14px', borderBottom: '1px solid var(--border)', background: i % 2 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nombre || '—'}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-2)' }}>{r.telefono || '—'}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email || '—'}</span>
                </div>
              ))}
              {rows.length > 20 && <div style={{ padding: '8px 14px', fontSize: 11, color: 'var(--text-3)', textAlign: 'center' }}>+{rows.length - 20} más...</div>}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('upload')} style={{ flex: 1, background: 'none', border: '1.5px solid var(--border-2)', color: 'var(--text-2)', borderRadius: 10, padding: 11, fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Volver</button>
              <button onClick={handleImport} style={{ flex: 2, background: 'var(--green)', color: '#0B0E0C', border: 'none', borderRadius: 10, padding: 11, fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Importar {rows.length} contactos</button>
            </div>
          </>)}
          {step === 'importing' && (
            <div style={{ padding: '20px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 32, fontWeight: 800, color: 'var(--green)' }}>{progress}%</div>
              <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'var(--green)', borderRadius: 99, transition: 'width 0.2s' }} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Importando contactos...</div>
            </div>
          )}
          {step === 'done' && (
            <div style={{ padding: '20px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--green-dim)', border: '1px solid var(--green-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>¡Importación completada!</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>{rows.length} contactos guardados.</div>
              <button onClick={onClose} style={{ background: 'var(--green)', color: '#0B0E0C', border: 'none', borderRadius: 10, padding: '10px 28px', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 800, cursor: 'pointer', marginTop: 4 }}>Listo</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Contact drawer ────────────────────────────────────────────────────────────
function ContactDrawer({ contact, customCols, customVals, onSaveCustomVal, onClose, onSave }) {
  const [tab, setTab]     = useState('info')
  const [email, setEmail] = useState(contact.email || '')
  const [notas, setNotas] = useState(contact.notas || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await onSave(contact.phone, { email: email.trim(), notas: notas.trim() })
    setSaving(false); onClose()
  }

  const reservasSorted = [...(contact.reservas || [])].sort((a, b) =>
    new Date(b.fecha + 'T' + (b.hora || '00:00')) - new Date(a.fecha + 'T' + (a.hora || '00:00'))
  )

  const drawerInp = { ...baseInp, borderRadius: 10, padding: '10px 14px', fontSize: 14 }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 91, width: 400, background: 'var(--panel)', borderLeft: '1px solid var(--border-2)', display: 'flex', flexDirection: 'column', boxShadow: '-24px 0 64px rgba(0,0,0,0.35)' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={contact.name} size={48} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{contact.name}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>+{contact.phone}</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--elevated)', border: '1px solid var(--border-2)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-2)', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
          {[{ id: 'info', label: 'Información' }, { id: 'historial', label: `Historial (${reservasSorted.length})` }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ background: 'none', border: 'none', padding: '11px 4px', marginRight: 20, cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? 'var(--text-1)' : 'var(--text-3)', borderBottom: `2px solid ${tab === t.id ? 'var(--green)' : 'transparent'}`, marginBottom: -1, transition: 'color 0.12s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {tab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Etiqueta',       value: <LabelBadge jid={contact.jid} /> },
                  { label: 'Total reservas', value: <span style={{ fontFamily: 'var(--mono)', fontSize: 22, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{contact.totalReservas}</span> },
                  { label: 'Última conv.',   value: <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{formatTs(contact.lastConv) || '—'}</span> },
                  { label: 'Última reserva', value: <span style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{formatReservaShort(contact.lastReservaObj) || '—'}</span> },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, letterSpacing: '0.05em' }}>{label}</div>
                    {value}
                  </div>
                ))}
              </div>

              {/* Standard fields */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, display: 'block' }}>Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="mail@ejemplo.com" type="email" style={drawerInp}
                  onFocus={e => e.target.style.borderColor = 'var(--green)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, display: 'block' }}>Notas</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas sobre este contacto..." rows={3}
                  style={{ ...drawerInp, resize: 'vertical', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = 'var(--green)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
                />
              </div>

              {/* Custom fields */}
              {customCols.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Campos personalizados
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {customCols.map(col => {
                      const val = customVals[col.id] || ''
                      const saveVal = (v) => onSaveCustomVal(contact.phone, col.id, v)
                      return (
                        <div key={col.id}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 5, display: 'block' }}>{col.label}</label>
                          {col.type === 'select' ? (
                            <select value={val} onChange={e => saveVal(e.target.value)}
                              style={{ ...drawerInp, cursor: 'pointer' }}>
                              <option value="">— Sin valor —</option>
                              {(col.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input value={val} type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                              onChange={e => saveVal(e.target.value)}
                              placeholder={`Ingresar ${col.label.toLowerCase()}...`}
                              style={drawerInp}
                              onFocus={e => e.target.style.borderColor = 'var(--green)'}
                              onBlur={e => e.target.style.borderColor = 'var(--border-2)'}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'historial' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {reservasSorted.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-3)', fontSize: 13 }}>Sin reservas registradas.</div>
              ) : (<>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {Object.entries(reservasSorted.reduce((acc, r) => { acc[r.estado] = (acc[r.estado] || 0) + 1; return acc }, {})).map(([estado, count]) => {
                    const sc = STATUS_COLORS[estado] || STATUS_COLORS.pendiente
                    return <span key={estado} style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, fontFamily: 'var(--mono)' }}>{count} {estado}</span>
                  })}
                </div>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 13, top: 14, bottom: 14, width: 1, background: 'var(--border)' }} />
                  {reservasSorted.map(r => {
                    const sc = STATUS_COLORS[r.estado] || STATUS_COLORS.pendiente
                    return (
                      <div key={r.id} style={{ display: 'flex', gap: 14, marginBottom: 10, position: 'relative', zIndex: 1 }}>
                        <div style={{ width: 27, height: 27, borderRadius: '50%', background: sc.bg, border: `2px solid ${sc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: sc.text }} />
                        </div>
                        <div style={{ flex: 1, background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 13px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>{r.servicio_nombre || 'Servicio'}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, fontFamily: 'var(--mono)', flexShrink: 0 }}>{r.estado}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 12 }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)' }}>{formatFecha(r.fecha)}</span>
                            {r.hora && <span style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--text-3)' }}>{r.hora.slice(0,5)}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>)}
            </div>
          )}
        </div>

        {tab === 'info' && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, background: 'none', border: '1.5px solid var(--border-2)', color: 'var(--text-2)', borderRadius: 10, padding: 10, fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={save} disabled={saving} style={{ flex: 1, background: 'var(--green)', color: '#0B0E0C', border: 'none', borderRadius: 10, padding: 10, fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ContactosPage() {
  const router = useRouter()
  const [authChecked, setAuthChecked] = useState(false)
  const [userId, setUserId]           = useState(null)
  const [evContacts, setEvContacts]   = useState([])
  const [chats, setChats]             = useState([])
  const [reservas, setReservas]       = useState([])
  const [extras, setExtras]           = useState({})
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [sortKey, setSortKey]         = useState('lastConv')
  const [sortDir, setSortDir]         = useState('desc')
  const [filterLabel, setFilterLabel] = useState('todos')
  const [selected, setSelected]       = useState(null)
  const [showImport, setShowImport]   = useState(false)
  const [showColPanel, setShowColPanel] = useState(false)
  const colBtnRef = useRef(null)

  // Custom columns — stored in Supabase
  const [customCols, setCustomCols] = useState([])
  const [customVals, setCustomVals] = useState({}) // { phone: { colId: value } }

  const loadCustomCols = useCallback(async () => {
    const { data } = await supabase.from('contact_columns').select('*').order('position')
    if (data) setCustomCols(data)
  }, [])

  const loadCustomVals = useCallback(async () => {
    const { data } = await supabase.from('contact_field_values').select('*')
    if (data) {
      const map = {}
      for (const row of data) {
        if (!map[row.phone]) map[row.phone] = {}
        map[row.phone][row.column_id] = row.value
      }
      setCustomVals(map)
    }
  }, [])

  useEffect(() => { loadCustomCols(); loadCustomVals() }, [loadCustomCols, loadCustomVals])

  const addCustomCol = useCallback(async (label, type, options) => {
    const id   = 'col_' + Math.random().toString(36).slice(2, 9)
    const pos  = customCols.length
    const { data, error } = await supabase
      .from('contact_columns')
      .insert({ id, label, type, options, position: pos })
      .select()
      .single()
    if (!error && data) setCustomCols(prev => [...prev, data])
  }, [customCols.length])

  const deleteCustomCol = useCallback(async (id) => {
    await supabase.from('contact_columns').delete().eq('id', id)
    setCustomCols(prev => prev.filter(c => c.id !== id))
    setCustomVals(prev => {
      const next = { ...prev }
      for (const phone of Object.keys(next)) {
        if (next[phone]?.[id]) {
          next[phone] = { ...next[phone] }
          delete next[phone][id]
        }
      }
      return next
    })
  }, [])

  const saveCustomVal = useCallback(async (phone, colId, value) => {
    // Optimistic update
    setCustomVals(prev => ({ ...prev, [phone]: { ...(prev[phone] || {}), [colId]: value } }))
    await supabase.from('contact_field_values').upsert(
      { phone, column_id: colId, value, updated_at: new Date().toISOString() },
      { onConflict: 'phone,column_id' }
    )
  }, [])

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      setAuthChecked(true)
    })
  }, [router])

  const loadAll = useCallback(async (uid) => {
    if (!uid) return
    setLoading(true)
    const [evRes, chatsRes, resRes, extrasRes] = await Promise.allSettled([
      fetch(`/api/contacts?user_id=${uid}`).then(r => r.json()),
      fetch(`/api/chats?user_id=${uid}`).then(r => r.json()),
      supabase.from('turnos').select('*').eq('user_id', uid).order('fecha', { ascending: false }),
      supabase.from('contactos').select('*'),
    ])
    if (evRes.status === 'fulfilled')    setEvContacts(Array.isArray(evRes.value) ? evRes.value : [])
    if (chatsRes.status === 'fulfilled') setChats(Array.isArray(chatsRes.value) ? chatsRes.value : [])
    if (resRes.status === 'fulfilled')   setReservas(resRes.value.data || [])
    if (extrasRes.status === 'fulfilled' && extrasRes.value.data) {
      const map = {}
      for (const row of extrasRes.value.data) map[row.phone] = row
      setExtras(map)
    }
    setLoading(false)
  }, [])

  useEffect(() => { if (authChecked && userId) loadAll(userId) }, [authChecked, userId, loadAll])

  const contacts = useMemo(() => {
    const chatMap = {}
    for (const chat of chats) {
      const jid = chat.remoteJid || ''
      if (jid.includes('@broadcast') || jid.includes('status') || jid === '0@s.whatsapp.net') continue
      const phone = normalizePhone(jid)
      if (!phone) continue
      const ts = chat.lastMessage?.messageTimestamp || 0
      if (!chatMap[phone] || ts > chatMap[phone].ts) chatMap[phone] = { ts, jid }
    }
    const resMap = {}
    for (const r of reservas) {
      const phone = normalizePhone(r.cliente_telefono || '')
      if (!phone) continue
      if (!resMap[phone]) resMap[phone] = []
      resMap[phone].push(r)
    }
    const phoneSet = new Set()
    const nameMap  = {}
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
    for (const phone of Object.keys(extras)) {
      phoneSet.add(phone)
      if (!nameMap[phone] && extras[phone].nombre) nameMap[phone] = extras[phone].nombre
    }
    return Array.from(phoneSet).map(phone => {
      const resArr = resMap[phone] || []
      const ext    = extras[phone] || {}
      const chatInfo = chatMap[phone] || null
      return {
        phone, name: nameMap[phone] || ext.nombre || phone,
        jid: chatInfo?.jid || phone + '@s.whatsapp.net',
        email: ext.email || '', notas: ext.notas || '',
        lastConv: chatInfo?.ts || null,
        reservas: resArr, lastReservaObj: resArr[0] || null, totalReservas: resArr.length,
      }
    })
  }, [evContacts, chats, reservas, extras])

  const filtered = useMemo(() => {
    let list = contacts
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q))
    }
    if (filterLabel !== 'todos') list = list.filter(c => getLabel(c.jid) === filterLabel)
    return [...list].sort((a, b) => {
      let va, vb
      if      (sortKey === 'name')     { va = a.name.toLowerCase(); vb = b.name.toLowerCase() }
      else if (sortKey === 'lastConv') { va = a.lastConv || 0;      vb = b.lastConv || 0 }
      else if (sortKey === 'reservas') { va = a.totalReservas;       vb = b.totalReservas }
      else                             { va = a[sortKey] || '';       vb = b[sortKey] || '' }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1  : -1
      return 0
    })
  }, [contacts, search, filterLabel, sortKey, sortDir])

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }
  const saveContact = async (phone, data) => {
    await supabase.from('contactos').upsert({ phone, ...data }, { onConflict: 'phone' })
    setExtras(prev => ({ ...prev, [phone]: { ...(prev[phone] || {}), ...data } }))
  }

  const total        = contacts.length
  const withEmail    = contacts.filter(c => c.email).length
  const withReservas = contacts.filter(c => c.totalReservas > 0).length
  const withConv     = contacts.filter(c => c.lastConv).length

  if (!authChecked) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.15em' }}>Cargando...</div>
    </div>
  )

  // Fixed columns
  const FIXED_COLS = [
    { key: 'name',     label: 'Contacto',      width: 220, sortable: true  },
    { key: 'phone',    label: 'Teléfono',       width: 140, sortable: false },
    { key: 'email',    label: 'Email',          width: 180, sortable: false },
    { key: 'label',    label: 'Etiqueta',       width: 100, sortable: false },
    { key: 'lastConv', label: 'Última conv.',   width: 130, sortable: true  },
    { key: 'reservas', label: 'Reservas',       width: 90,  sortable: true  },
    { key: 'lastRes',  label: 'Última reserva', width: 160, sortable: false },
  ]
  const CUSTOM_COL_WIDTH = 150

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', fontFamily: 'var(--sans)' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <header style={{ flexShrink: 0, padding: '13px 24px 12px', borderBottom: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 3 }}>Base de datos</div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-1)', lineHeight: 1 }}>Contactos</div>
          </div>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4"/><path d="M10 10l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nombre, teléfono, email..."
              style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 20, padding: '7px 14px 7px 32px', color: 'var(--text-1)', fontFamily: 'inherit', fontSize: 13, outline: 'none', width: 240 }}
            />
          </div>
          {/* Label filter */}
          <select value={filterLabel} onChange={e => setFilterLabel(e.target.value)}
            style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: filterLabel === 'todos' ? 'var(--text-3)' : 'var(--text-1)', fontFamily: 'inherit', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="todos">Todas las etiquetas</option>
            {LABEL_LIST.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {/* Columns button */}
          <button ref={colBtnRef} onClick={() => setShowColPanel(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: showColPanel ? 'var(--green-dim)' : 'var(--elevated)', border: `1px solid ${showColPanel ? 'var(--green-border)' : 'var(--border-2)'}`, color: showColPanel ? 'var(--green)' : 'var(--text-2)', borderRadius: 9, padding: '7px 13px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M8 10.5h5M10.5 8v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Columnas {customCols.length > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 10, background: 'var(--green)', color: '#0B0E0C', borderRadius: 99, padding: '1px 5px', fontWeight: 800 }}>{customCols.length}</span>}
          </button>
          {/* Import */}
          <button onClick={() => setShowImport(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--elevated)', border: '1px solid var(--border-2)', color: 'var(--text-2)', borderRadius: 9, padding: '7px 13px', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'color 0.12s, border-color 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-1)'; e.currentTarget.style.borderColor = 'var(--green)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M7 2v7M4.5 6.5L7 9l2.5-2.5M2 10v1a1 1 0 001 1h8a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Importar
          </button>
          {/* Count */}
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-3)', background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 11px', flexShrink: 0 }}>
            {filtered.length}<span style={{ opacity: 0.5 }}> / {total}</span>
          </div>
        </header>

        {/* Stats */}
        <div style={{ flexShrink: 0, padding: '10px 24px', borderBottom: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', gap: 10 }}>
          {[
            { label: 'Total contactos',  value: total,        color: 'var(--text-1)' },
            { label: 'Con conversación', value: withConv,     color: 'var(--green)'  },
            { label: 'Con reservas',     value: withReservas, color: '#60A5FA'        },
            { label: 'Con email',        value: withEmail,    color: '#A78BFA'        },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.3 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Table (horizontally scrollable) */}
        <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
          <div style={{ minWidth: FIXED_COLS.reduce((s, c) => s + c.width, 0) + customCols.length * CUSTOM_COL_WIDTH + 48 }}>

            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', height: 36, paddingLeft: 24, paddingRight: 12, borderBottom: '1px solid var(--border)', background: 'var(--panel)', position: 'sticky', top: 0, zIndex: 10 }}>
              {FIXED_COLS.map(col => (
                <div key={col.key} onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  style={{ width: col.width, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: sortKey === col.key ? 'var(--green)' : 'var(--text-3)', cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none', transition: 'color 0.12s' }}>
                  {col.label}
                  {col.sortable && <SortIcon dir={sortKey === col.key ? sortDir : null} />}
                </div>
              ))}
              {/* Custom columns */}
              {customCols.map(col => (
                <div key={col.id} style={{ width: CUSTOM_COL_WIDTH, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, color: 'var(--text-3)', userSelect: 'none' }}>
                  {col.label}
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--text-3)', background: 'var(--elevated)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 4px', flexShrink: 0 }}>{COL_TYPE_LABELS[col.type]?.slice(0,3)}</span>
                </div>
              ))}
            </div>

            {/* Rows */}
            {loading ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: '0.1em' }}>Cargando contactos...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                {search ? 'Sin resultados.' : 'No hay contactos todavía.'}
              </div>
            ) : filtered.map((contact, i) => (
              <div key={contact.phone}
                style={{ display: 'flex', alignItems: 'center', height: 50, paddingLeft: 24, paddingRight: 12, borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.007)', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--elevated)'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.007)'}
              >
                {/* Contacto */}
                <div onClick={() => setSelected(contact)} style={{ width: FIXED_COLS[0].width, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <Avatar name={contact.name} size={30} />
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.name}</span>
                </div>
                {/* Teléfono */}
                <div onClick={() => setSelected(contact)} style={{ width: FIXED_COLS[1].width, flexShrink: 0, cursor: 'pointer' }}>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>+{contact.phone}</span>
                </div>
                {/* Email */}
                <div onClick={() => setSelected(contact)} style={{ width: FIXED_COLS[2].width, flexShrink: 0, cursor: 'pointer', overflow: 'hidden' }}>
                  {contact.email ? <span style={{ fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{contact.email}</span>
                                 : <span style={{ fontSize: 12, color: 'var(--border-2)' }}>—</span>}
                </div>
                {/* Etiqueta */}
                <div onClick={() => setSelected(contact)} style={{ width: FIXED_COLS[3].width, flexShrink: 0, cursor: 'pointer' }}>
                  <LabelBadge jid={contact.jid} />
                </div>
                {/* Última conv */}
                <div onClick={() => setSelected(contact)} style={{ width: FIXED_COLS[4].width, flexShrink: 0, cursor: 'pointer' }}>
                  {contact.lastConv ? <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{formatTs(contact.lastConv)}</span>
                                    : <span style={{ fontSize: 12, color: 'var(--border-2)' }}>—</span>}
                </div>
                {/* Reservas */}
                <div onClick={() => setSelected(contact)} style={{ width: FIXED_COLS[5].width, flexShrink: 0, cursor: 'pointer' }}>
                  {contact.totalReservas > 0
                    ? <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, color: 'var(--green)', background: 'var(--green-dim)', border: '1px solid var(--green-border)', borderRadius: 6, padding: '2px 8px' }}>{contact.totalReservas}</span>
                    : <span style={{ fontSize: 12, color: 'var(--border-2)' }}>0</span>}
                </div>
                {/* Última reserva */}
                <div onClick={() => setSelected(contact)} style={{ width: FIXED_COLS[6].width, flexShrink: 0, cursor: 'pointer', overflow: 'hidden' }}>
                  {contact.lastReservaObj ? <span style={{ fontSize: 12.5, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{formatReservaShort(contact.lastReservaObj)}</span>
                                          : <span style={{ fontSize: 12, color: 'var(--border-2)' }}>—</span>}
                </div>
                {/* Custom columns — inline editable */}
                {customCols.map(col => (
                  <div key={col.id} style={{ width: CUSTOM_COL_WIDTH, flexShrink: 0, paddingRight: 12 }}>
                    <CustomCell
                      value={customVals[contact.phone]?.[col.id] || ''}
                      col={col}
                      onSave={(val) => saveCustomVal(contact.phone, col.id, val)}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Columns panel */}
      {showColPanel && (
        <ColumnsPanel
          cols={customCols}
          onAdd={addCustomCol}
          onDelete={deleteCustomCol}
          onClose={() => setShowColPanel(false)}
          anchorRef={colBtnRef}
        />
      )}

      {/* Contact drawer */}
      {selected && (
        <ContactDrawer
          contact={{ ...selected, ...(extras[selected.phone] || {}) }}
          customCols={customCols}
          customVals={customVals[selected.phone] || {}}
          onSaveCustomVal={saveCustomVal}
          onClose={() => setSelected(null)}
          onSave={saveContact}
        />
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImport={() => { loadAll(userId); setShowImport(false) }} />
      )}
    </div>
  )
}
