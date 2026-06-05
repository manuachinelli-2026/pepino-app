export async function GET() {
  try {
    const res = await fetch(`${process.env.EVOLUTION_URL}/instance/fetchInstances`, {
      headers: { apikey: process.env.EVOLUTION_KEY },
      cache: 'no-store',
    })
    const data = await res.json()
    const inst = Array.isArray(data)
      ? data.find(i => i.name === process.env.EVOLUTION_INSTANCE)
      : null
    return Response.json({
      connected: inst?.connectionStatus === 'open',
      state: inst?.connectionStatus || 'unknown',
    })
  } catch {
    return Response.json({ connected: false, state: 'error' })
  }
}
