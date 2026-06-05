export async function GET(request) {
  const jid = new URL(request.url).searchParams.get('jid')
  try {
    const res = await fetch(
      `${process.env.EVOLUTION_URL}/chat/findMessages/${process.env.EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: { apikey: process.env.EVOLUTION_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ where: { key: { remoteJid: jid } }, limit: 50 }),
        cache: 'no-store',
      }
    )
    const data = await res.json()
    const records = Array.isArray(data) ? data : (data?.messages?.records ?? [])
    return Response.json(records)
  } catch {
    return Response.json([])
  }
}
