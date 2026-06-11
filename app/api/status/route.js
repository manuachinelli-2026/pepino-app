import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const user_id = new URL(request.url).searchParams.get('user_id')
    if (!user_id) return Response.json({ connected: false, state: 'no_instance' })

    const { data: inst } = await sb
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('user_id', user_id)
      .single()

    if (!inst?.instance_name) return Response.json({ connected: false, state: 'no_instance' })

    const res = await fetch(
      `${process.env.EVOLUTION_URL}/instance/connectionState/${inst.instance_name}`,
      { headers: { apikey: process.env.EVOLUTION_KEY }, cache: 'no-store' }
    )
    const data  = await res.json()
    const state = data?.instance?.state || 'unknown'
    return Response.json({ connected: state === 'open', state })
  } catch {
    return Response.json({ connected: false, state: 'error' })
  }
}
