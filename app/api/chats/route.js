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
    return Response.json(Array.isArray(data) ? data : [])
  } catch {
    return Response.json([])
  }
}
