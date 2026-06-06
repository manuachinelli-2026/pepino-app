export async function GET() {
  try {
    const res = await fetch(
      `${process.env.EVOLUTION_URL}/chat/findChats/${process.env.EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: { apikey: process.env.EVOLUTION_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store',
      }
    )
    const data = await res.json()
    // Return first 5 chats with ALL fields so we can see the full structure
    const sample = (Array.isArray(data) ? data : []).slice(0, 5)
    return Response.json(sample)
  } catch (e) {
    return Response.json({ error: e.message })
  }
}
