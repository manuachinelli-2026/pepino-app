export async function GET(request) {
  const url = new URL(request.url)
  // Accept either a single jid or multiple (jid can appear multiple times)
  const jids = url.searchParams.getAll('jid')
  if (!jids.length) return Response.json([])

  const base = `${process.env.EVOLUTION_URL}/chat/findMessages/${process.env.EVOLUTION_INSTANCE}`
  const headers = { apikey: process.env.EVOLUTION_KEY, 'Content-Type': 'application/json' }

  try {
    // For each JID, fetch both directions
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

    const all = bodies.flatMap(d => Array.isArray(d) ? d : (d?.messages?.records ?? []))

    // Deduplicate by key.id, sort ascending
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
