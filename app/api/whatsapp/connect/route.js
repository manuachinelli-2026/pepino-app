import { createClient } from '@supabase/supabase-js'

const EVOLUTION_URL = process.env.EVOLUTION_URL
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const { user_id } = await request.json()
  if (!user_id) return Response.json({ error: 'user_id requerido' }, { status: 400 })

  const instanceName = `pepino_${user_id.replace(/-/g, '').slice(0, 16)}`

  // Create instance in Evolution
  const evoRes = await fetch(`${EVOLUTION_URL}/instance/create`, {
    method: 'POST',
    headers: { 'apikey': EVOLUTION_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    })
  })
  const evoData = await evoRes.json()
  if (!evoRes.ok) return Response.json({ error: evoData }, { status: 500 })

  // Save to Supabase
  const { error } = await supabase.from('whatsapp_instances').upsert({
    user_id,
    instance_name: instanceName,
    instance_token: evoData.hash?.apikey || evoData.instance?.token,
    status: 'connecting',
  }, { onConflict: 'user_id' })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({
    instance_name: instanceName,
    qr: evoData.qrcode?.base64 || null,
    status: 'connecting'
  })
}
