export async function DELETE() {
  try {
    const res = await fetch(
      `${process.env.EVOLUTION_URL}/instance/logout/${process.env.EVOLUTION_INSTANCE}`,
      { method: 'DELETE', headers: { apikey: process.env.EVOLUTION_KEY } }
    )
    const data = await res.json()
    return Response.json(data)
  } catch {
    return Response.json({ error: 'No se pudo cerrar la sesion' }, { status: 500 })
  }
}