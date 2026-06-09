import { createClient } from '@supabase/supabase-js'

const EVOLUTION_URL = process.env.EVOLUTION_URL
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const { user_id } = await request.json()
  if (!user_id) return Response.json({ error: 'user_id requerido' }, { status: 400 })

  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('instance_name')
    .eq('user_id', user_id)
    .single()

  if (!instance) return Response.json({ error: 'No hay instancia' }, { status: 404 })

  // Delete from Evolution
  await fetch(`${EVOLUTION_URL}/instance/delete/${instance.instance_name}`, {
    method: 'DELETE',
    headers: { 'apikey': EVOLUTION_KEY }
  })

  // Remove from Supabase
  await supabase.from('whatsapp_instances').delete().eq('user_id', user_id)

  return Response.json({ ok: true })
}
