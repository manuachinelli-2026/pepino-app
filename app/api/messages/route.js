import { createClient } from '@supabase/supabase-js'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const url = new URL(request.url)
  const jids    = url.searchParams.getAll('jid')
  const user_id = url.searchParams.get('user_id')
  if (!jids.length) return Response.json([])

  try {
    const { data: inst } = await sb
      .from('whatsapp_instances')
      .select('instance_name')
      .eq('user_id', user_id)
      .single()

    if (!inst?.instance_name) return Response.json([])

    const base    = `${process.env.EVOLUTION_URL}/chat/findMessages/${inst.instance_name}`
    const headers = { apikey: process.env.EVOLUTION_KEY, 'Content-Type': 'application/json' }

    const fetches = jids.flatMap(jid => [
      fetch(base, {
        method: 'POST', headers, cache: 'no-store',
        body: JSON.stringify({ where: { key: { remoteJid: jid, fromMe: false } }, limit: 60 }),
      }),
      fetch(base, {
        method: 'POST', headers, cache: 'no-store',
        body: JSON.stringify({ where: { key: { remoteJid: jid, fromMe: true } }, limit: 60 }),
      }),
    ])

    const responses = await Promise.all(fetches)
    const bodies    = await Promise.all(responses.map(r => r.json()))
    const all       = bodies.flatMap(d => Array.isArray(d) ? d : (d?.messages?.records ?? []))

    const seen = new Set()
    const deduped = all
      .filter(m => {
        const id = m.key?.id
        if (!id || seen.has(id)) return false
        seen.add(id)
        return true
      })
      .sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0))

    return Response.json(deduped)
  } catch {
    return Response.json([])
  }
}
