export async function GET() {
  try {
    const res = await fetch(
      `${process.env.EVOLUTION_URL}/chat/findContacts/${process.env.EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: { apikey: process.env.EVOLUTION_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        cache: 'no-store',
      }
    )
    const data = await res.json()
    return Response.json(Array.isArray(data) ? data : [])
  } catch (e) {
    return Response.json([])
  }
}
