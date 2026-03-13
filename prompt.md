En app/dashboard/taller/pulso/page.tsx, reconstruye la página 
completa desde cero con el siguiente diseño aprobado.

═══════════════════════════════════════
DISEÑO: 6 SECCIONES EN ORDEN
═══════════════════════════════════════

PALETA Y TIPOGRAFÍA
- Fondo página: bg-[#f4f2ed]
- Cards: bg-white, border border-gray-200, rounded-xl
- Positivo/destacado: #0070f3
- Negativo/alerta: #dc2626
- Atención: #d97706
- Verde éxito: #16a34a
- Labels: text-xs uppercase tracking-widest text-gray-400
- Valores grandes: font-semibold text-gray-900
- Narrativa/subtexto: text-xs text-gray-400 italic

───────────────────────────────────────
SECCIÓN 1 — ¿Ganamos o perdemos dinero?
───────────────────────────────────────
Grid 3 columnas:

Col 1 (más ancha): Card negra (#111)
  - Eyebrow: "FLUJO LIBRE DEL PERÍODO"
  - Número grande: utilidad neta en blanco, 38px
  - Subtexto verde: "Utilidad positiva en este período" 
    o rojo: "Pérdida en este período"
  - Fila: Ingresos | Egresos
  - Footer: "vs período anterior ↑ X%" en verde/rojo

Col 2: Card blanca
  - Label: "MARGEN BRUTO"
  - Valor: XX.X% en verde si >35%, rojo si <35%
  - Objetivo: "Objetivo >35%"
  - Barra de progreso delgada (h-1)
  - Narrativa: "Por cada $100 facturados, quedan $XX 
    después de pagar refacciones."

Col 3: Card blanca
  - Label: "ROI MANO DE OBRA"
  - Valor: X.Xx en verde si >2x, ámbar si 1.5-2x, rojo si <1.5x
  - Objetivo: "Objetivo >2x"
  - Barra de progreso delgada (h-1)
  - Narrativa: "Por cada peso pagado en nómina, el taller 
    generó $X.XX en mano de obra."

───────────────────────────────────────
SECCIÓN 2 — ¿Qué requiere atención hoy?
───────────────────────────────────────
Título de sección + narrativa italic pequeña debajo

Grid 3 columnas:

Card 1: "LISTO SIN COBRAR"
  - Valor: $XX,XXX (rojo si >0)
  - Subtexto: "X servicios terminados · pendientes de pago"
  - Detalle italic: "Trabajo entregado que no ha entrado 
    al banco. El cliente ya tiene el carro."
  - Color card: rojo suave si >0, verde suave si =0

Card 2: "SERVICIOS ACTIVOS +3 DÍAS"
  - Valor: número (ámbar si >0)
  - Subtexto: "Llevan más de 72hrs abiertos"
  - Detalle italic: "¿Falta una refacción? ¿O se puede 
    cerrar hoy?"
  - Color card: ámbar suave si >0, verde suave si =0

Card 3: "MECÁNICOS CON ROI <1.5x"
  - Valor: número (rojo si >0, verde si =0)
  - Subtexto: nombres de mecánicos afectados o 
    "Todo el equipo es rentable"
  - Color card: rojo suave si >0, verde suave si =0

───────────────────────────────────────
SECCIÓN 3 — ¿Cuánto del trabajo se cobró?
───────────────────────────────────────
Título de sección + narrativa

4 columnas sin gap, dentro de una sola card con 
divisores verticales entre columnas:

Col 1: COTIZACIONES — count total, monto estimado, 
  pill "punto de partida"
Col 2: APROBADOS — count, monto, pill "XX% aprobación" 
  + flecha → entre columnas
Col 3: COBRADOS — count, monto cobrado, pill "XX% cobrado"
  + flecha →
Col 4: NO APROBADOS — count en rojo, monto en rojo, 
  pill rojo "X% cancelación"

───────────────────────────────────────
SECCIÓN 4 — ¿La tendencia sube o baja?
───────────────────────────────────────
Título de sección + narrativa

Grid 2 columnas (1.5fr / 1fr):

Col 1: Card — "Tendencia del período"
  - Subtítulo: "Ingresos · Egresos · Flujo libre — por día"
  - ECharts líneas, 3 series:
    · Ingresos: línea negra sólida
    · Egresos: línea gris punteada
    · Flujo libre: línea verde con areaStyle opacity 0.1
  - Sin leyenda de ECharts, usar leyenda manual debajo
  - Narrativa: "Si las líneas se cruzan, el taller opera 
    en pérdida ese día."

Col 2: Card — "¿En qué se va el dinero?"
  - Subtítulo: "Gastos como % de ingresos"
  - Lista jerárquica HTML (sin ECharts):
    · Grupo: nombre + % + monto a la derecha
    · Barra roja h-[3px] debajo del grupo
    · Categorías indentadas con barra más delgada y 
      más clara
    · Grupos: Operación, Nómina, Local, Personal, 
      Administración

───────────────────────────────────────
SECCIÓN 5 — ¿Los costos son estructuralmente sanos?
───────────────────────────────────────
Título de sección + narrativa

Card ancho completo con tabla:
Columnas: Categoría | Monto | [barra progreso] | % ingreso | Objetivo

Filas: Operación (<40%), Nómina (<30%), Local (<25%), 
  Personal (<5%), Administración (<15%), 
  Total costos (<65%) — fila bold con borde superior más grueso

Color del % ingreso:
  - Azul #0070f3 si dentro del objetivo
  - Rojo #dc2626 si superado
  - Ámbar #d97706 si >80% del objetivo

Barra de progreso: azul si bien, rojo si mal

───────────────────────────────────────
SECCIÓN 6 — ¿Cada mecánico genera más de lo que cuesta?
───────────────────────────────────────
Título de sección + narrativa

Card ancho completo con tabla:
Columnas: Mecánico (avatar circular con initials+color) | 
  Servicios | MO Generada | Comisión | Sueldo | 
  Costo Total | Utilidad (azul) | ROI (badge)

ROI badge:
  - Verde: >2x
  - Ámbar: 1.5x–2x  
  - Rojo: <1.5x

Fila Total al final con border-top más grueso

Narrativa debajo de la tabla en italic pequeño

═══════════════════════════════════════
NOTAS DE LOS LIBROS
═══════════════════════════════════════
/* Buffett: el número más importante primero. 
   Todo lo demás es contexto. */

/* Storytelling with Data: cada sección tiene UNA 
   pregunta. La respuesta es el número grande. 
   La narrativa explica el "¿y qué?" */

/* Lean Analytics: el embudo revela dónde se pierde 
   valor antes de que sea dinero. */

/* Measure What Matters: solo 3 alertas accionables. 
   Si no puedes actuar en él hoy, no es una alerta. */

/* The Intelligent Investor: si costos >65% de ingresos, 
   el margen se comprime estructuralmente. */

/* Zero to One: el equipo es el negocio. 
   ROI por persona no es opcional. */

/* Psychology of Money: distingue trabajo terminado 
   (cobrable) de trabajo en proceso. No confundas 
   actividad con resultado. */

═══════════════════════════════════════
QUERIES — usar exactamente esta lógica
═══════════════════════════════════════

// Flujo libre
ingresos = SUM(price * qty) de service_parts 
         + SUM(labor_price) de service_jobs
         donde services.paid_at en rango 
         AND status != 'invalid'

egresos = costo_partes + nomina + gastos_op
  costo_partes = SUM(cost * qty) service_parts (mismo filtro)
  nomina = SUM(net_payment) payroll WHERE is_paid=true 
           AND week_start >= desde AND week_end <= hasta
  gastos_op = SUM(expenses.total) JOIN expense_categories 
              WHERE ec.type = 'expense' AND date en rango

// Cartera por cobrar (SOLO terminados sin cobrar)
WHERE work_completed = true 
AND paid_at IS NULL 
AND status != 'invalid'

// Mecánicos — MO via service_workers (NO service_jobs.employee_id)
Obtener service_ids del mecánico via service_workers,
luego sumar labor_price de service_jobs de esos service_ids.
Nómina: un solo registro por empleado via payrollMap 
(asignación directa, NO acumulación con +=)

// Embudo
Cotizaciones: created_at en rango (todos)
Aprobados: status != 'invalid' AND created_at en rango
Cobrados: paid_at en rango AND status != 'invalid'
No aprobados: status = 'invalid' AND created_at en rango