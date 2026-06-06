export async function GET(request) {
  const number = new URL(request.url).searchParams.get('number')
  try {
    const res = await fetch(
      `${process.env.EVOLUTION_URL}/chat/fetchProfilePicture/${process.env.EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: { apikey: process.env.EVOLUTION_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number }),
        cache: 'no-store',
      }
    )
    const data = await res.json()
    return Response.json({ url: data?.profilePictureUrl ?? null })
  } catch {
    return Response.json({ url: null })
  }
}
