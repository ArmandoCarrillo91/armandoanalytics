En src/app/dashboard/taller/pulso/page.tsx necesito agregar dos cosas:

══════════════════════════════════════════════
1. DESGLOSE FINANCIERO — insertar después del cierre de SECCIÓN 1 (después del div que cierra el grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr]) y antes de SECCIÓN 2:

Una nueva sección sin título de sección, solo una card con border que muestre la composición de ingresos y egresos en dos columnas:

Columna izquierda — INGRESOS (total: m.ingresos):
- Mano de obra: servicios.ingresos_mo con su % sobre ingresos
- Partes cliente: servicios.ingresos_partes_cliente con su %

Columna derecha — EGRESOS (total: m.egresos):
- Gastos operativos: m.totalGastos con su % sobre ingresos
- Nómina: m.nominaNeta con su %
- Costo de partes: m.costoPartes con su %

Cada fila tiene: label a la izquierda, barra de progreso proporcional al centro (width = pct), monto y % a la derecha.
Colores: ingresos en azul (#0070f3), egresos en rojo (#dc2626).
Mismo estilo visual que las demás cards: bg-white dark:bg-[var(--taller-surface)] border rounded-xl p-5.

══════════════════════════════════════════════
2. TICKET PROMEDIO + SERVICIOS EN PROCESO — agregar dos cards nuevas al grid de SECCIÓN 1.

Cambiar el grid de:
  grid-cols-1 lg:grid-cols-[2fr_1fr_1fr]
a:
  grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]

Card 4 — Ticket promedio:
- Calcular: const ticketPromedio = cobrados.length > 0 ? m.ingresos / cobrados.length : 0
- Título: "Ticket promedio"
- Valor: fmtMoney(ticketPromedio) en text-3xl
- Subtítulo: "por servicio cobrado"
- Nota italic: "Promedio de ingreso generado por cada servicio cerrado en el período."
- Mismo estilo que Col 2 y Col 3

Card 5 — Servicios en proceso:
- Usar: const enProceso = (funnelSvcsQuery.data ?? []).filter((s: any) => s.status === 'active' && !s.paid_at).length
- Título: "En proceso ahora"
- Valor: enProceso en text-3xl, color verde si > 0 (#16a34a), gris si 0
- Subtítulo: "servicios activos sin cobrar"
- Nota italic: "Trabajo vivo en el taller en este momento."
- Mismo estilo que Col 2 y Col 3

══════════════════════════════════════════════
No toques nada más. No cambies lógica de queries ni otros cálculos existentes.