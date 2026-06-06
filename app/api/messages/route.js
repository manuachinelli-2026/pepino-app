export async function GET(request) {
  const jid = new URL(request.url).searchParams.get('jid')
  const url = `${process.env.EVOLUTION_URL}/chat/findMessages/${process.env.EVOLUTION_INSTANCE}`
  const headers = { apikey: process.env.EVOLUTION_KEY, 'Content-Type': 'application/json' }

  try {
    // Fetch received AND sent separately — Evolution filters by fromMe in the key
    const [resIn, resOut] = await Promise.all([
      fetch(url, {
        method: 'POST', headers, cache: 'no-store',
        body: JSON.stringify({ where: { key: { remoteJid: jid, fromMe: false } }, limit: 60 }),
      }),
      fetch(url, {
        method: 'POST', headers, cache: 'no-store',
        body: JSON.stringify({ where: { key: { remoteJid: jid, fromMe: true } }, limit: 60 }),
      }),
    ])

    const [dIn, dOut] = await Promise.all([resIn.json(), resOut.json()])
    const incoming = Array.isArray(dIn)  ? dIn  : (dIn?.messages?.records  ?? [])
    const outgoing = Array.isArray(dOut) ? dOut : (dOut?.messages?.records ?? [])

    // Merge, deduplicate by key.id, sort ascending by timestamp
    const seen = new Set()
    const all = [...incoming, ...outgoing]
      .filter(m => {
        const id = m.key?.id
        if (!id || seen.has(id)) return false
        seen.add(id)
        return true
      })
      .sort((a, b) => (a.messageTimestamp || 0) - (b.messageTimestamp || 0))

    return Response.json(all)
  } catch {
    return Response.json([])
  }
}
