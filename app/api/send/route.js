import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const { jid, text, user_id } = await request.json()
  const number = jid.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '').replace(/@lid$/, '')

  try {
    const { data: inst } = await sb
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('user_id', user_id)
      .single()

    if (!inst?.instance_name) return Response.json({ error: 'no instance' }, { status: 400 })

    const res = await fetch(
      `${process.env.EVOLUTION_URL}/message/sendText/${inst.instance_name}`,
      {
        method: 'POST',
        headers: { apikey: process.env.EVOLUTION_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, text }),
      }
    )
    return Response.json(await res.json())
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
