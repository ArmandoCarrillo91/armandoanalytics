import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_USES = 10
const MIN_DAYS_BETWEEN = 21

export async function POST(request: NextRequest) {
  // 1. Verificar autenticación
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // 2. Verificar rate limit en usage_limits
  const admin = createAdminClient()
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { data: usage } = await admin
    .from('usage_limits')
    .select('count, updated_at')
    .eq('user_id', user.id)
    .eq('feature', 'interpretame')
    .single()

  const currentCount = usage?.count ?? 0
  const lastUsed = usage?.updated_at ? new Date(usage.updated_at) : null
  const daysSinceLast = lastUsed
    ? (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity

  if (currentCount >= MAX_USES) {
    return NextResponse.json({ error: 'limite_alcanzado' }, { status: 429 })
  }

  if (lastUsed && daysSinceLast < MIN_DAYS_BETWEEN) {
    const disponible = new Date(lastUsed.getTime() + MIN_DAYS_BETWEEN * 24 * 60 * 60 * 1000)
    const disponibleStr = disponible.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
    return NextResponse.json({ error: 'demasiado_pronto', disponible_en: disponibleStr }, { status: 429 })
  }

  // 3. Obtener datos del body
  const { dashboardData, periodo } = await request.json()

  // 4. Llamar a Claude
  const prompt = `Eres un consultor financiero experto en talleres automotrices.
Analiza estos datos del período ${periodo} y da un análisis ejecutivo en español,
estilo Warren Buffett meets Elon Musk: directo, sin rodeos, con criterio.

Datos:
${JSON.stringify(dashboardData, null, 2)}

Estructura tu respuesta en 3 partes:
1. DIAGNÓSTICO (2-3 oraciones sobre la salud financiera general)
2. LO QUE PREOCUPA (máximo 2 puntos críticos con números específicos)
3. ACCIÓN INMEDIATA (1 cosa concreta que hacer esta semana)

Máximo 200 palabras. Sin markdown, sin asteriscos, texto plano.`

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!anthropicRes.ok) {
    return NextResponse.json({ error: 'Error al contactar Claude' }, { status: 500 })
  }

  const anthropicData = await anthropicRes.json()
  const content = anthropicData.content?.[0]?.text ?? ''

  // 5. Actualizar usage_limits
  const newCount = currentCount + 1
  await admin
    .from('usage_limits')
    .upsert(
      { user_id: user.id, feature: 'interpretame', month: monthKey, count: newCount, updated_at: now.toISOString() },
      { onConflict: 'user_id,feature,month' }
    )

  return NextResponse.json({ content, remaining: MAX_USES - newCount })
}
