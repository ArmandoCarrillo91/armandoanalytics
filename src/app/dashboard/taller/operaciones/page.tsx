import { Suspense } from 'react'
import { getTallerData } from '@/lib/taller/queries'
import type { Agg } from '@/types/taller'
import DateRangePicker from '@/components/taller/DateRangePicker'
import IngresosTotales from '@/components/taller/charts/IngresosTotales'
import IngresosSemanales from '@/components/taller/charts/IngresosSemanales'
import ComposicionIngreso from '@/components/taller/charts/ComposicionIngreso'
import ProduccionMecanicos from '@/components/taller/charts/ProduccionMecanicos'
import GastosCategoria from '@/components/taller/charts/GastosCategoria'
import MargenPartes from '@/components/taller/charts/MargenPartes'
import MargenSemana from '@/components/taller/charts/MargenSemana'
import CostoPrecioPartes from '@/components/taller/charts/CostoPrecioPartes'
import WaterfallUtilidad from '@/components/taller/charts/WaterfallUtilidad'
import { fmtMoney } from '@/components/taller/utils'

const VALID_AGG = new Set<Agg>(['dia', 'semana', 'mes', 'anio'])

function defaultDates() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const lastDay = new Date(y, m + 1, 0).getDate()
  const mm = String(m + 1).padStart(2, '0')
  return {
    desde: `${y}-${mm}-01`,
    hasta: `${y}-${mm}-${String(lastDay).padStart(2, '0')}`,
  }
}

/* ── Styles ── */

const card: React.CSSProperties = {
  background: 'var(--taller-surface)',
  border: '1px solid var(--taller-border)',
  borderRadius: 10,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
}

const chartWrap: React.CSSProperties = { flex: 1 }

const label: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: 'var(--taller-muted)',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  fontFamily: 'var(--taller-font-m)',
  marginBottom: 6,
}

const kpiValue: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: 'var(--taller-ink)',
  fontFamily: 'var(--taller-font-m)',
}

const kpiSub: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--taller-muted)',
  fontFamily: 'var(--taller-font-m)',
  marginTop: 2,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--taller-muted)',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  fontFamily: 'var(--taller-font-m)',
  marginBottom: 8,
}

/* ── Page ── */

export default async function OperacionesPage({
  searchParams,
}: {
  searchParams: { desde?: string; hasta?: string; agg?: string }
}) {
  const defaults = defaultDates()
  const desde = searchParams.desde || defaults.desde
  const hasta = searchParams.hasta || defaults.hasta
  const agg: Agg = VALID_AGG.has(searchParams.agg as Agg) ? (searchParams.agg as Agg) : 'dia'

  let data
  let error: string | null = null

  try {
    data = await getTallerData(desde, hasta, agg)
  } catch (e: any) {
    error = e.message || 'Error al cargar datos'
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ ...label, fontSize: 13, color: 'var(--taller-red)' }}>
          {error || 'No se pudieron cargar los datos'}
        </p>
      </div>
    )
  }

  const { servicios, partes, nomina, gastos, ingresos_serie, servicios_serie, composicion_serie, margen_partes_serie, margen_serie, produccion_mecanicos, ticket_mediana } = data

  const ingresosBrutos = servicios.ingresos_mo + servicios.ingresos_partes_cliente
  const totalGastos = gastos.reduce((s, g) => s + Number(g.total), 0)
  const costosTotales = Number(partes.costo_partes) + Number(nomina.nomina_neta) + totalGastos
  const utilidadNeta = ingresosBrutos - costosTotales
  const ticketPromedio = servicios.pagados > 0 ? ingresosBrutos / servicios.pagados : 0

  // Derived data for charts
  const costoPrecioData = margen_partes_serie.map((d) => ({
    semana: d.semana,
    costo: d.costo,
    precio: d.costo + d.utilidad,
  }))

  return (
    <div>
      {/* Header */}
      <div className="taller-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--taller-ink)', fontFamily: 'var(--taller-font-d)', margin: 0 }}>
            Operaciones
          </h1>
          <p style={{ fontSize: 12, color: 'var(--taller-muted)', fontFamily: 'var(--taller-font-m)', marginTop: 4 }}>
            Vista operativa del taller
          </p>
        </div>
        <Suspense fallback={null}>
          <DateRangePicker desde={desde} hasta={hasta} agg={agg} basePath="/dashboard/taller/operaciones" />
        </Suspense>
      </div>

      {/* KPIs */}
      <div className="taller-kpis">
        <div style={card}>
          <div style={label}>Servicios</div>
          <div style={kpiValue}>{servicios.total_servicios}</div>
          <p style={kpiSub}>{servicios.pagados} cobrados &middot; {servicios.en_proceso} pendientes</p>
        </div>
        <div style={card}>
          <div style={label}>Ingresos brutos</div>
          <div style={kpiValue}>{fmtMoney(ingresosBrutos)}</div>
          <p style={kpiSub}>{servicios.pagados} servicios pagados</p>
        </div>
        <div style={card}>
          <div style={label}>Costos totales</div>
          <div style={kpiValue}>{fmtMoney(costosTotales)}</div>
          <p style={kpiSub}>partes + nómina + operación</p>
        </div>
        <div style={card}>
          <div style={label}>Utilidad neta</div>
          <div style={{ ...kpiValue, color: utilidadNeta >= 0 ? 'var(--taller-blue)' : 'var(--taller-red)' }}>
            {fmtMoney(utilidadNeta)}
          </div>
          <p style={kpiSub}>{ingresosBrutos > 0 ? ((utilidadNeta / ingresosBrutos) * 100).toFixed(1) : '0.0'}% del ingreso</p>
        </div>
        <div style={card}>
          <div style={label}>Ticket promedio</div>
          <div style={kpiValue}>{fmtMoney(ticketPromedio)}</div>
          <p style={kpiSub}>mediana {fmtMoney(ticket_mediana)}</p>
        </div>
      </div>

      {/* Row 0: Ingresos + Servicios pagados */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={sectionTitle}>Ingresos y servicios pagados</div>
        <div style={chartWrap}><IngresosTotales ingresos={ingresos_serie} servicios={servicios_serie} /></div>
      </div>

      {/* Row 1: Margen por semana + Costo vs precio partes */}
      <div className="taller-row">
        <div style={card}>
          <div style={sectionTitle}>Margen por semana</div>
          <div style={chartWrap}><MargenSemana data={margen_serie} /></div>
        </div>
        <div style={card}>
          <div style={sectionTitle}>Costo de ventas vs ingresos</div>
          <p style={{ fontSize: 11, color: 'var(--taller-muted)', fontFamily: 'var(--taller-font-m)', margin: '0 0 8px' }}>
            Por cada peso en refacciones, ¿cuánto nos quedó?
          </p>
          <div style={chartWrap}><CostoPrecioPartes data={costoPrecioData} /></div>
        </div>
      </div>

      {/* Row 2: Desglose del ingreso + Composición dona */}
      <div className="taller-row taller-row-2-1">
        <div style={card}>
          <div style={sectionTitle}>¿De qué está hecho el ingreso?</div>
          <div style={chartWrap}><IngresosSemanales data={ingresos_serie} /></div>
        </div>
        <div style={card}>
          <div style={sectionTitle}>Composición del ingreso</div>
          <div style={chartWrap}><ComposicionIngreso
            mo={servicios.ingresos_mo}
            partes={servicios.ingresos_partes_cliente}
          /></div>
        </div>
      </div>

      {/* Row 2: Producción + Gastos + Margen */}
      <div className="taller-row">
        <div style={card}>
          <div style={sectionTitle}>Producción mecánicos</div>
          <div style={chartWrap}><ProduccionMecanicos
            data={produccion_mecanicos}
          /></div>
        </div>
        <div style={card}>
          <div style={sectionTitle}>Gastos por categoría</div>
          <div style={chartWrap}><GastosCategoria
            data={gastos.map((g) => ({ categoria: g.categoria, total: Number(g.total) }))}
          /></div>
        </div>
        <div style={card}>
          <div style={sectionTitle}>Margen en partes</div>
          <div style={chartWrap}><MargenPartes data={margen_partes_serie} /></div>
        </div>
      </div>

      {/* Row 5: Waterfall */}
      <div style={card}>
        <div style={sectionTitle}>Cascada de utilidad</div>
        <div style={chartWrap}><WaterfallUtilidad
          ingresos={ingresosBrutos}
          costoPartes={Number(partes.costo_partes)}
          nomina={Number(nomina.nomina_neta)}
          gastosOp={totalGastos}
          utilidad={utilidadNeta}
        /></div>
      </div>
    </div>
  )
}
