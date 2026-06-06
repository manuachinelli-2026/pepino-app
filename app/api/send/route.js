export async function POST(request) {
  const { jid, text } = await request.json()
  const number = jid.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '').replace(/@lid$/, '')
  try {
    const res = await fetch(
      `${process.env.EVOLUTION_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: { apikey: process.env.EVOLUTION_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, text }),
      }
    )
    const data = await res.json()
    return Response.json(data)
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
