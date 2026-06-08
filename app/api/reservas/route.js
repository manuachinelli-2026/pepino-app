import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://zdyaeyuertcvskvwpdfe.supabase.co',
  'sb_publishable_auL6ZSGewgvs1Mn94GmFSA_T-FfYXz6'
)

// GET /api/reservas?fecha=YYYY-MM-DD&user_id=xxx
// Returns all reservations for a given date (so n8n can verify slots)
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const fecha   = searchParams.get('fecha')
  const user_id = searchParams.get('user_id')

  let query = supabase.from('reservas').select('*').order('hora')
  if (fecha)   query = query.eq('fecha', fecha)
  if (user_id) query = query.eq('user_id', user_id)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

// POST /api/reservas
// Body: { cliente_nombre, cliente_telefono?, servicio, fecha, hora, estado?, user_id?, notas? }
export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const { cliente_nombre, servicio, fecha, hora } = body
  if (!cliente_nombre || !servicio || !fecha || !hora) {
    return Response.json(
      { error: 'Faltan campos requeridos: cliente_nombre, servicio, fecha, hora' },
      { status: 400 }
    )
  }

  // Validate fecha format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return Response.json({ error: 'fecha debe ser YYYY-MM-DD' }, { status: 400 })
  }

  // Validate hora format
  if (!/^\d{2}:\d{2}$/.test(hora)) {
    return Response.json({ error: 'hora debe ser HH:MM' }, { status: 400 })
  }

  const record = {
    cliente_nombre: String(cliente_nombre).trim(),
    cliente_telefono: body.cliente_telefono ? String(body.cliente_telefono).trim() : null,
    servicio: String(servicio).trim(),
    fecha,
    hora,
    estado: body.estado || 'pendiente',
  }
  if (body.user_id)  record.user_id = body.user_id
  if (body.notas)    record.notas   = String(body.notas).trim()

  const { data, error } = await supabase.from('reservas').insert([record]).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json(data, { status: 201 })
}
