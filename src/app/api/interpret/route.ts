import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const MAX_USES = 10
const MIN_DAYS_BETWEEN = 21

type Mode = 'mensual' | 'semanal' | 'foco_sorpresa' | 'foco_elegido'

function buildPrompt(mode: Mode, dashboardData: unknown, periodo: string, tema?: string): string {
  const dataStr = JSON.stringify(dashboardData, null, 2)

  if (mode === 'mensual') {
    return `Eres un consejero financiero con la honestidad brutal de Warren Buffett y los primeros principios de Elon Musk. Analizas un taller mecánico en Zapopan, Jalisco. Tu audiencia es el dueño y su equipo.
Una advertencia: estos números no mienten. El criterio es de quien lee.

DATOS: ${dataStr}
PERÍODO: ${periodo}

Estructura exacta:

## [Mes Año] — [titular con el número más importante]

### Lo que está funcionando — no lo toques
2-3 puntos con nombres reales y números exactos.
Por qué funciona y cómo amplificarlo.

### Lo que hay que corregir — sin anestesia
Máximo 2 problemas. Causa raíz, no síntomas.
Cuánto cuesta no corregirlo en pesos. Qué decidir antes del viernes.

### Cuánto puedes gastar hoy
Gasto diario disponible basado en flujo libre.
Categoría con más riesgo. Un número: máximo $X hoy.

### Tres palancas para el siguiente mes
Exactamente 3. Verbo de acción + impacto en pesos + responsable.

### La pregunta que nadie está haciendo
La más incómoda. La que incomoda porque es real.

### Estado general
Una sola oración. Sin anestesia.
Cierra con: El criterio y la decisión son del equipo.

Reglas: nombres reales, montos en $XX,XXX, sin markdown excepto ## y ###,
máximo 600 palabras, si un dato no está no lo inventes.`
  }

  if (mode === 'semanal') {
    return `Eres un consejero financiero con la velocidad de Elon Musk y el criterio de Warren Buffett. Es fin de semana.
El equipo necesita saber cómo les fue en 600 palabras.
Una advertencia: estos números no mienten. El criterio es de quien lee.

DATOS: ${dataStr}
PERÍODO: ${periodo}

Estructura exacta:

## La semana en una línea
Un número + una consecuencia. Nada más.

### Qué movió la aguja esta semana
2 puntos máximo. Qué funcionó y cuánto vale en pesos.

### Qué no funcionó
1-2 puntos. Sin suavizar. Cuánto costó no haberlo corregido.

### Comparado con la semana anterior
Usa datos de tendencia si existen. Si no, di qué necesitas para hacer esa comparación la próxima vez.

### Lo que no puede pasar la siguiente semana
Una sola cosa. Concreta. Con nombre de responsable.

### El número de la semana
Un solo KPI. Por qué ese y no otro.

Reglas: nombres reales, montos en $XX,XXX, sin markdown excepto ## y ###,
máximo 600 palabras, tono de briefing de lunes directo y sin rodeos.
Cierra con: El criterio y la decisión son del equipo.`
  }

  // foco_sorpresa y foco_elegido comparten estructura
  const temaLine = mode === 'foco_elegido'
    ? `El usuario quiere que analices este tema: ${tema}`
    : `Elige el tema más interesante, urgente o ignorado que estos números revelan.`

  return `Eres un consejero financiero. Tienes los datos del período.
${temaLine}
Desarrolla SOLO ese tema — no hagas resumen general.

Antes de escribir, elige aleatoriamente UNO de estos mentores y adopta su filosofía y estilo de pensamiento:
Bill Gates, Guillermo Rauch, Andrés Bilbao, Elon Musk, Warren Buffett, Satya Nadella, Tim Cook, Reed Hastings, Charlie Munger, Bernard Arnault, Jensen Huang.

Menciona sutilmente al inicio: "Perspectiva de [nombre]:"

DATOS: ${dataStr}
PERÍODO: ${periodo}

Temas posibles (elige el más relevante para estos datos):
ticket promedio, gastos, rendimiento por mecánico, cartera,
punto de equilibrio, compra de refacciones a granel, catálogo de servicios, tiempos de servicio, proveedores, pricing, estacionalidad, marketing, quién es el cliente, flotillas, paquetes, inversión en tecnología, inversión en equipo, incentivos, redes sociales, quién puede ser mi cliente.

Estructura exacta:

## [Tema elegido] — [titular con dato más importante]

### Lo que dicen los números
Análisis profundo con datos exactos.

### Lo que hacen los mejores en esto
Aplicable a un taller pequeño. Sin teoría universitaria.

### Qué puedes hacer esta semana
3 acciones con responsable e impacto en pesos.

### La pregunta que este tema revela
La más incómoda.

Reglas: nombres reales, montos en $XX,XXX, sin markdown excepto ## y ###,
máximo 600 palabras.
Cierra con: El criterio y la decisión son del equipo.`
}

function extractMentor(content: string): string | null {
  const match = content.match(/Perspectiva de ([^:]+):/i)
  return match ? match[1].trim() : null
}

export async function POST(request: NextRequest) {
  console.log('[interpret] ── POST recibido ──')

  try {
    // 1. Verificar autenticación
    console.log('[interpret] Paso 1: Verificando autenticación...')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.log('[interpret] ERROR: No autenticado')
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    console.log('[interpret] Usuario:', user.id)

    // 2. Verificar rate limit en usage_limits
    console.log('[interpret] Paso 2: Verificando rate limit...')
    const admin = createAdminClient()
    const now = new Date()
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { data: usage, error: usageError } = await admin
      .from('usage_limits')
      .select('count, updated_at')
      .eq('user_id', user.id)
      .eq('feature', 'interpretame')
      .single()

    if (usageError) {
      console.log('[interpret] usage_limits query error (puede ser normal si no existe row):', usageError.message)
    }

    const currentCount = usage?.count ?? 0
    const lastUsed = usage?.updated_at ? new Date(usage.updated_at) : null
    const daysSinceLast = lastUsed
      ? (now.getTime() - lastUsed.getTime()) / (1000 * 60 * 60 * 24)
      : Infinity

    console.log('[interpret] Rate limit — count:', currentCount, 'daysSinceLast:', daysSinceLast.toFixed(1))

    if (currentCount >= MAX_USES) {
      console.log('[interpret] BLOQUEADO: límite alcanzado')
      return NextResponse.json({ error: 'limite_alcanzado' }, { status: 429 })
    }

    if (lastUsed && daysSinceLast < MIN_DAYS_BETWEEN) {
      const disponible = new Date(lastUsed.getTime() + MIN_DAYS_BETWEEN * 24 * 60 * 60 * 1000)
      const disponibleStr = disponible.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
      console.log('[interpret] BLOQUEADO: demasiado pronto, disponible:', disponibleStr)
      return NextResponse.json({ error: 'demasiado_pronto', disponible_en: disponibleStr }, { status: 429 })
    }

    // 3. Obtener datos del body
    console.log('[interpret] Paso 3: Parseando body...')
    const body = await request.json()
    const { dashboardData, periodo, mode = 'mensual', tema } = body as {
      dashboardData: unknown
      periodo: string
      mode?: Mode
      tema?: string
    }
    console.log('[interpret] mode:', mode, '| tema:', tema ?? '(ninguno)', '| periodo:', periodo)
    console.log('[interpret] dashboardData keys:', dashboardData ? Object.keys(dashboardData as Record<string, unknown>) : 'NULL')

    // 4. Llamar a Claude
    console.log('[interpret] Paso 4: Construyendo prompt para mode:', mode)
    const prompt = buildPrompt(mode, dashboardData, periodo, tema)
    console.log('[interpret] Prompt length:', prompt.length, 'chars')

    console.log('[interpret] Llamando a Anthropic API...')
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    console.log('[interpret] Anthropic response status:', anthropicRes.status)

    if (!anthropicRes.ok) {
      const errorBody = await anthropicRes.text()
      console.error('[interpret] ERROR Anthropic API:', anthropicRes.status, errorBody)
      return NextResponse.json({ error: 'Error al contactar Claude' }, { status: 500 })
    }

    const anthropicData = await anthropicRes.json()
    const content = anthropicData.content?.[0]?.text ?? ''
    console.log('[interpret] Claude respondió, content length:', content.length)

    // 5. Guardar en interpret_history
    console.log('[interpret] Paso 5: Guardando en interpret_history...')
    try {
      const { data: tenantRow, error: tenantError } = await admin
        .from('tenant_users')
        .select('tenant_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (tenantError) {
        console.error('[interpret] Error buscando tenant_id:', tenantError.message)
      }

      const mentor = extractMentor(content)
      console.log('[interpret] Mentor extraído:', mentor ?? '(ninguno)')

      const { error: insertError } = await admin.from('interpret_history').insert({
        user_id: user.id,
        tenant_id: tenantRow?.tenant_id ?? null,
        mode,
        topic: tema ?? null,
        mentor,
        period: periodo,
        content,
      })

      if (insertError) {
        console.error('[interpret] Error INSERT interpret_history:', insertError.message, insertError.details, insertError.hint)
      } else {
        console.log('[interpret] interpret_history guardado OK')
      }
    } catch (e) {
      console.error('[interpret] EXCEPCIÓN guardando interpret_history:', e)
    }

    // 6. Actualizar usage_limits
    console.log('[interpret] Paso 6: Actualizando usage_limits...')
    const newCount = currentCount + 1
    const { error: upsertError } = await admin
      .from('usage_limits')
      .upsert(
        { user_id: user.id, feature: 'interpretame', month: monthKey, count: newCount, updated_at: now.toISOString() },
        { onConflict: 'user_id,feature,month' }
      )

    if (upsertError) {
      console.error('[interpret] Error UPSERT usage_limits:', upsertError.message)
    }

    console.log('[interpret] ── ÉXITO ── remaining:', MAX_USES - newCount)
    return NextResponse.json({ content, remaining: MAX_USES - newCount })

  } catch (error) {
    console.error('[interpret] ══ EXCEPCIÓN NO CAPTURADA ══')
    console.error('[interpret] Error:', error)
    if (error instanceof Error) {
      console.error('[interpret] Message:', error.message)
      console.error('[interpret] Stack:', error.stack)
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
