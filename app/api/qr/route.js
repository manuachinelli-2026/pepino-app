export async function GET() {
  try {
    const res = await fetch(
      `${process.env.EVOLUTION_URL}/instance/connect/${process.env.EVOLUTION_INSTANCE}`,
      { headers: { apikey: process.env.EVOLUTION_KEY }, cache: 'no-store' }
    )
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({ error: 'No se pudo obtener el QR' }, { status: 500 })
  }
}
