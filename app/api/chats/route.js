export async function GET() {
  try {
    const res = await fetch(
      `${process.env.EVOLUTION_URL}/chat/findChats/${process.env.EVOLUTION_INSTANCE}`,
      { headers: { apikey: process.env.EVOLUTION_KEY }, cache: 'no-store' }
    )
    const data = await res.json()
    return Response.json(Array.isArray(data) ? data : [])
  } catch {
    return Response.json([])
  }
}
