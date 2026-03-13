/* ── Taller Dashboard Data Types ── */

export type Agg = 'dia' | 'semana' | 'mes' | 'anio'

export interface ServiciosIngresos {
  total_servicios: number
  pagados: number
  en_proceso: number
  terminados_sin_cobrar: number
  ingresos_mo: number
  ingresos_partes_cliente: number
}

export interface CostoPartes {
  total_partes: number
  costo_partes: number
  precio_cliente_partes: number
  utilidad_partes: number
}

export interface Nomina {
  nomina_neta: number
  salarios: number
  comisiones: number
}

export interface GastoCategoria {
  categoria: string
  expense_group: string
  total: number
}

export interface NominaMecanico {
  employee_id: string
  nombre: string
  role: string
  salario: number
  comision: number
  neto: number
  week_start: string
  week_end: string
  servicios: number
  mo: number
  refacciones: number
  partes_usadas: number
  costo_partes: number
  commission_on_parts: boolean
  commission_percentage: number
}

export interface MecanicoEquipo {
  id: string
  nombre: string
  iniciales: string
  color: string
  role: string
  comision_pct: number
  servicios: number
  mo_generada: number
  comision: number
  ticket_promedio: number
  participacion_mo: number
}

export interface ServicioPendiente {
  folio: number
  mecanico: string
  dias: number
  estado: 'en_proceso' | 'sin_cobrar'
}

export interface TallerData {
  servicios: ServiciosIngresos
  partes: CostoPartes
  nomina: Nomina
  gastos: GastoCategoria[]
  /* Series temporales — el campo "label" lleva el texto del eje X */
  ingresos_serie: { semana: string; mo: number; partes: number }[]
  servicios_serie: { dia: string; total: number; cobrados: number }[]
  margen_partes_serie: { semana: string; costo: number; utilidad: number }[]
  margen_serie: { semana: string; ingresos: number; utilidad: number }[]
  composicion_serie: { semana: string; mo: number; costo_partes: number; margen_partes: number }[]
  produccion_mecanicos: { nombre: string; mo: number; servicios: number; comision: number }[]
  nomina_mecanicos: NominaMecanico[]
  equipo: MecanicoEquipo[]
  pendientes_proceso: ServicioPendiente[]
  pendientes_cobro: ServicioPendiente[]
  ticket_mediana: number
}
