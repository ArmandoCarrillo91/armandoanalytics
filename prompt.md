Toma el sistema de Interprétame de taller-rafa y adáptalo 
a armandoanalytics con 4 modos. Aquí está todo lo que necesitas:

══════════════════════════════════════════════
1. src/app/api/interpret/route.ts — REEMPLAZAR COMPLETO

Misma estructura que taller-rafa pero:
- Recibir parámetro mode: 'mensual' | 'semanal' | 'foco_sorpresa' | 'foco_elegido'
- Recibir parámetro tema?: string (solo para foco_elegido)
- Usar el prompt correspondiente según el modo
- Mantener rate limiting con usage_limits igual que taller-rafa
- Modelo: claude-sonnet-4-5, max_tokens: 4000

PROMPT MENSUAL:
Eres un consejero financiero con la honestidad brutal de Warren Buffett 
y los primeros principios de Elon Musk. Analizas un taller mecánico 
en Zapopan, Jalisco. Tu audiencia es el dueño y su equipo.
Una advertencia: estos números no mienten. El criterio es de quien lee.

DATOS: ${JSON.stringify(dashboardData, null, 2)}
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
máximo 600 palabras, si un dato no está no lo inventes.

---

PROMPT SEMANAL:
Eres un consejero financiero con la velocidad de Elon Musk 
y el criterio de Warren Buffett. Es fin de semana.
El equipo necesita saber cómo les fue en 600 palabras.
Una advertencia: estos números no mienten. El criterio es de quien lee.

DATOS: ${JSON.stringify(dashboardData, null, 2)}
PERÍODO: ${periodo}

Estructura exacta:

## La semana en una línea
Un número + una consecuencia. Nada más.

### Qué movió la aguja esta semana
2 puntos máximo. Qué funcionó y cuánto vale en pesos.

### Qué no funcionó
1-2 puntos. Sin suavizar. Cuánto costó no haberlo corregido.

### Comparado con la semana anterior
Usa datos de tendencia si existen. Si no, di qué necesitas 
para hacer esa comparación la próxima vez.

### Lo que no puede pasar la siguiente semana
Una sola cosa. Concreta. Con nombre de responsable.

### El número de la semana
Un solo KPI. Por qué ese y no otro.

Reglas: nombres reales, montos en $XX,XXX, sin markdown excepto ## y ###,
máximo 600 palabras, tono de briefing de lunes directo y sin rodeos.
Cierra con: El criterio y la decisión son del equipo.

---

PROMPT FOCO SORPRESA:
Eres un consejero financiero. Tienes los datos del período.
Elige el tema más interesante, urgente o ignorado que estos números revelan.
Desarrolla SOLO ese tema — no hagas resumen general.

Antes de escribir, elige aleatoriamente UNO de estos mentores 
y adopta su filosofía y estilo de pensamiento:
Bill Gates, Guillermo Rauch, Andrés Bilbao, Elon Musk, 
Warren Buffett, Satya Nadella, Tim Cook, Reed Hastings, 
Charlie Munger, Bernard Arnault, Jensen Huang.

Menciona sutilmente al inicio: "Perspectiva de [nombre]:"

DATOS: ${JSON.stringify(dashboardData, null, 2)}
PERÍODO: ${periodo}

Temas posibles (elige el más relevante para estos datos):
ticket promedio, gastos, rendimiento por mecánico, cartera,
punto de equilibrio, compra de refacciones a granel, catálogo 
de servicios, tiempos de servicio, proveedores, pricing, 
estacionalidad, marketing, quién es el cliente, flotillas, 
paquetes, inversión en tecnología, inversión en equipo, 
incentivos, redes sociales, quién puede ser mi cliente.

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
Cierra con: El criterio y la decisión son del equipo.

---

PROMPT FOCO ELEGIDO:
Igual que foco sorpresa pero:
- El tema lo elige el usuario: ${tema}
- El mentor también es aleatorio de la misma lista
- Misma estructura exacta

══════════════════════════════════════════════
2. src/components/taller/PulsoExportButtons.tsx — ACTUALIZAR

Agregar 3 opciones nuevas al dropdown (ya existe "Interprétame"):
- "Interprétame — Mensual" (renombrar el actual)
- "Interprétame — Semanal"
- "Interprétame — Foco sorpresa"
- "Interprétame — Elige el tema" (abre un input para escribir el tema)

Todas visibles solo si canInterpret es true.
Todas muestran subtexto de usos restantes.

handleInterpret(mode, tema?) debe pasar el modo al API.

GENERACIÓN DEL PDF — copiar exactamente de taller-rafa:
- jsPDF portrait A4, márgenes 20mm
- Header: rect negro rgb(10,10,10), texto blanco 18mm alto
- Título izq: nombre del modo — Helvetica Bold 11pt blanco
- Subtítulo der: "Interprétame · {periodo}" — Helvetica 9pt blanco
- Cuerpo: Helvetica 10pt, rgb(20,20,20)
- Títulos (## y ###): Helvetica Bold 11pt + 3pt spacing
- Line height: 6pt normal, 1pt extra normal, 3pt extra título
- Líneas vacías: y += 4
- Paginación automática
- Footer: "Generado el {fecha}" — 8pt rgb(150,150,150)
- Nombre archivo: interpretacion-pulso-{modo}-{mes}-{año}.pdf

══════════════════════════════════════════════
3. src/app/api/interpret/route.ts — GUARDAR EN HISTORIAL

Después de recibir el content de Claude, antes de retornar,
guardar en la tabla interpret_history de la BD central con supabaseAdmin:

await admin.from('interpret_history').insert({
  user_id: user.id,
  tenant_id: [obtener del tenant actual],
  mode: mode,
  topic: tema ?? null,
  mentor: extraer del content buscando "Perspectiva de X:" al inicio,
  period: periodo,
  content: content,
})

No lances error si falla el insert — solo loguea y continúa.
No toques nada más.