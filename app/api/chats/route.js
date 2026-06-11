import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const user_id = new URL(request.url).searchParams.get('user_id')
    if (!user_id) return Response.json([])

    const { data: inst } = await sb
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('user_id', user_id)
      .single()

    if (!inst?.instance_name) return Response.json([])

    const res = await fetch(
      `${process.env.EVOLUTION_URL}/chat/findChats/${inst.instance_name}`,
      {
        method: 'POST',
        headers: { apikey: process.env.EVOLUTION_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store',
      }
    )
    const data = await res.json()
    return Response.json(Array.isArray(data) ? data : [])
  } catch {
    return Response.json([])
  }
}
