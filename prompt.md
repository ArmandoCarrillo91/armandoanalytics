Crea src/app/dashboard/taller/pulso/page.tsx desde cero.
Es un dashboard ejecutivo estilo Warren Buffett — pocos 
números, grandes y claros. Sin charts innecesarios.

Usa el mismo layout, sidebar, estilos y variables CSS 
que operaciones/page.tsx. Mismo date range picker y 
agregación. Mismas queries correctas ya establecidas.

═══════════════════════════════════════
SECCIÓN 1 — HERO (ancho completo)
═══════════════════════════════════════
Card oscura (background #1a1a1a, texto blanco) ancho completo.

Izquierda:
- Label pequeño: "FLUJO LIBRE"
- Número grande: utilidad neta con fmtMoney
- Subtexto verde si positivo: "Utilidad positiva en este período"
- Subtexto rojo si negativo: "Pérdida en este período"
- Abajo: dos columnas
  · Ingresos: $XX,XXX (verde)
  · Egresos: $XX,XXX (blanco muted)

Derecha:
- "vs período anterior" — comparar con mismo rango de fechas 
  del mes anterior. Mostrar ↑ o ↓ y el % de cambio.

Cálculo flujo libre:
- Ingresos = MO + refacciones precio cliente de servicios pagados
- Egresos = costo partes + nómina (is_paid=true) + 
  gastos op (ec.type='expense')
- Flujo libre = Ingresos - Egresos

═══════════════════════════════════════
SECCIÓN 2 — RATIOS DE SALUD (4 columnas)
═══════════════════════════════════════
Cuatro métricas en una fila, cada una con:
- Label
- Valor grande
- Semáforo: verde/ámbar/rojo según objetivo
- Objetivo visible en muted pequeño

1. MARGEN BRUTO
   = (Ingresos - costo partes) / Ingresos * 100
   Verde si > 35% | Ámbar si 25-35% | Rojo si < 25%
   Objetivo: ">35%"

2. NÓMINA / INGRESOS
   = nómina / ingresos * 100
   Verde si < 30% | Ámbar si 30-40% | Rojo si > 40%
   Objetivo: "<30%"

3. GASTOS FIJOS / INGRESOS
   = gastos_op / ingresos * 100
   Verde si < 35% | Ámbar si 35-45% | Rojo si > 45%
   Objetivo: "<35%"

4. ROI MANO DE OBRA
   = MO generada / nómina
   Mostrar como "2.3x"
   Verde si > 2x | Ámbar si 1.5-2x | Rojo si < 1.5x
   Objetivo: ">2x"

═══════════════════════════════════════
SECCIÓN 3 — DOS COLUMNAS
═══════════════════════════════════════

COLUMNA IZQUIERDA (60%) — "Tendencia en revisión"
Subtítulo: "Ingresos, egresos y flujo libre — por día"
Chart de líneas ECharts con 3 series:
- Línea negra sólida: Ingresos por día
- Línea gris punteada: Egresos por día  
- Línea verde (#2d6a4f) con área: Flujo libre por día
  (área rellena verde claro opacity 0.1 cuando positivo,
   área rellena roja opacity 0.1 cuando negativo)

COLUMNA DERECHA (40%) — "¿En qué se va el dinero?"
Subtítulo: "Gastos como % de ingresos"
Barras horizontales por expense_group:
- Operación
- Local  
- Personal
- Administración
Cada barra muestra % del ingreso y monto absoluto al final.
Color: rojo (#c94a4a) para todas.

═══════════════════════════════════════
SECCIÓN 4 — ESTRUCTURA DE COSTOS (ancho completo)
═══════════════════════════════════════
Título: "Estructura de costos"
Subtítulo: "¿Los costos crecen más rápido que los ingresos? 
Objetivo: total costos < 65% de ingresos"

Tabla con barras de progreso por categoría:
- Operación (gastos op de tipo expense agrupados)
- Nómina
- Local (expense_group = 'Local')
- Personal (expense_group = 'Personal')
- Administración (expense_group = 'Administración')
- Total costos (fila final en bold)

Cada fila:
- Nombre categoría
- Barra de progreso (ancho = % del ingreso)
- % a la derecha en color semáforo
- Objetivo a la derecha en muted (ej: "<5%")

Objetivos por categoría:
- Operación: <40%
- Nómina: <30%
- Local: <25%
- Personal: <5%
- Administración: <15%
- Total: <65%

═══════════════════════════════════════
SECCIÓN 5 — ROI POR MECÁNICO (ancho completo)
═══════════════════════════════════════
Título: "Rendimiento por mecánico"
Solo empleados con role = 'mechanic' y is_active = true.

Columnas:
Mecánico | Servicios | MO generada | Ticket prom. | 
Sueldo | Comisiones | Costo total | Utilidad | ROI

- MO generada: SUM(labor_price) de sus service_jobs
  en servicios pagados del período
- Ticket prom: MO generada / servicios
- Sueldo: base_salary de payroll (is_paid=true)
- Comisiones: total_commission de payroll
- Costo total: sueldo + comisiones
- Utilidad: MO generada - costo total (verde si positivo)
- ROI: MO generada / costo total, mostrar como "2.3x"
  Badge: verde si > 2x, ámbar si 1.5-2x, rojo si < 1.5x

Ordenar por ROI descendente.

Usar subconsultas separadas para evitar multiplicación 
de filas en JOINs — patrón ya establecido en operaciones/page.tsx.

Mismo estilo visual que tablas existentes.