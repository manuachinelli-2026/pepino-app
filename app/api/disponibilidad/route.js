import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const fecha = searchParams.get('fecha')         // "2024-01-15"
  const servicio_id = searchParams.get('servicio_id')
  const user_id = searchParams.get('user_id')

  if (!fecha || !servicio_id || !user_id) {
    return Response.json(
      { error: 'Faltan parámetros requeridos: fecha, servicio_id, user_id' },
      { status: 400 }
    )
  }

  // Get day of week (0=domingo … 6=sábado)
  const date = new Date(`${fecha}T12:00:00`)
  const diaSemana = date.getDay()

  const [{ data: disp }, { data: servicio }, { data: reservas }] = await Promise.all([
    supabase
      .from('disponibilidad')
      .select('activo, hora_inicio, hora_fin')
      .eq('user_id', user_id)
      .eq('dia', diaSemana)
      .single(),

    supabase
      .from('servicios')
      .select('nombre, duracion_minutos')
      .eq('id', servicio_id)
      .single(),

    supabase
      .from('reservas')
      .select('hora')
      .eq('fecha', fecha)
      .neq('estado', 'cancelado'),
  ])

  if (!disp || !disp.activo) {
    return Response.json({ disponibles: [], motivo: 'Día no disponible' })
  }

  if (!servicio) {
    return Response.json({ error: 'Servicio no encontrado' }, { status: 404 })
  }

  const duration = servicio.duracion_minutos
  const [startH, startM] = disp.hora_inicio.split(':').map(Number)
  const [endH, endM] = disp.hora_fin.split(':').map(Number)
  const startMin = startH * 60 + startM
  const endMin = endH * 60 + endM

  // Occupied slots in minutes from midnight
  const occupied = (reservas || []).map(t => {
    const [h, m] = t.hora.split(':').map(Number)
    return h * 60 + m
  })

  const disponibles = []
  for (let slot = startMin; slot + duration <= endMin; slot += duration) {
    const conflict = occupied.some(occ => slot < occ + duration && slot + duration > occ)
    if (!conflict) {
      const h = String(Math.floor(slot / 60)).padStart(2, '0')
      const m = String(slot % 60).padStart(2, '0')
      disponibles.push(`${h}:${m}`)
    }
  }

  return Response.json({
    disponibles,
    dia: { hora_inicio: disp.hora_inicio, hora_fin: disp.hora_fin },
    servicio: { nombre: servicio.nombre, duracion_minutos: duration },
    fecha,
  })
}
