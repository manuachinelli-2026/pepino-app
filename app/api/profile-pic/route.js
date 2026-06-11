import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const url     = new URL(request.url)
  const number  = url.searchParams.get('number')
  const user_id = url.searchParams.get('user_id')

  try {
    const { data: inst } = await sb
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('user_id', user_id)
      .single()

    if (!inst?.instance_name) return Response.json({ url: null })

    const res = await fetch(
      `${process.env.EVOLUTION_URL}/chat/fetchProfilePicture/${inst.instance_name}`,
      {
        method: 'POST',
        headers: { apikey: process.env.EVOLUTION_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number }),
        cache: 'no-store',
      }
    )
    const data = await res.json()
    return Response.json({ url: data?.profilePictureUrl ?? null })
  } catch {
    return Response.json({ url: null })
  }
}
