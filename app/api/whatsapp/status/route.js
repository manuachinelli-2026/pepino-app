import { createClient } from '@supabase/supabase-js'

const EVOLUTION_URL = process.env.EVOLUTION_URL
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')
  if (!user_id) return Response.json({ error: 'user_id requerido' }, { status: 400 })

  const { data: instance } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .eq('user_id', user_id)
    .single()

  if (!instance) return Response.json({ status: 'no_instance' })

  // Sync status from Evolution
  const evoRes = await fetch(`${EVOLUTION_URL}/instance/connectionState/${instance.instance_name}`, {
    headers: { 'apikey': EVOLUTION_KEY }
  })
  const evoData = await evoRes.json()
  const liveStatus = evoData?.instance?.state || 'disconnected'

  // Get QR if still connecting
  let qr = null
  if (liveStatus === 'connecting' || liveStatus === 'close') {
    const qrRes = await fetch(`${EVOLUTION_URL}/instance/connect/${instance.instance_name}`, {
      headers: { 'apikey': EVOLUTION_KEY }
    })
    const qrData = await qrRes.json()
    qr = qrData?.base64 || null
  }

  // Update status in Supabase
  await supabase.from('whatsapp_instances')
    .update({ status: liveStatus, updated_at: new Date().toISOString() })
    .eq('user_id', user_id)

  return Response.json({
    status: liveStatus,
    instance_name: instance.instance_name,
    phone_number: instance.phone_number,
    profile_name: instance.profile_name,
    qr,
  })
}
