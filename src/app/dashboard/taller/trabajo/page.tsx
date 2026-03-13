import { Suspense } from 'react'
import { getTallerData } from '@/lib/taller/queries'
import type { Agg } from '@/types/taller'
import DateRangePicker from '@/components/taller/DateRangePicker'
import ServiciosMecanico from '@/components/taller/charts/ServiciosMecanico'
import MOGenerada from '@/components/taller/charts/MOGenerada'
import EstadoServicios from '@/components/taller/charts/EstadoServicios'
import ServiciosDiarios from '@/components/taller/charts/ServiciosDiarios'
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

const BLUE = '#4a6fa5'

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

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--taller-muted)',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  fontFamily: 'var(--taller-font-m)',
  marginBottom: 8,
}

const sectionHeading: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: 'var(--taller-ink)',
  fontFamily: 'var(--taller-font-d)',
  marginBottom: 14,
  marginTop: 28,
}

const kpiCard = (accent: string): React.CSSProperties => ({
  ...card,
  borderLeft: `3px solid ${accent}`,
})

const kpiValue: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--taller-ink)',
  fontFamily: 'var(--taller-font-d)',
  margin: 0,
}

const kpiSub: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--taller-muted)',
  fontFamily: 'var(--taller-font-m)',
  marginTop: 2,
}

const tableStyles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontFamily: 'var(--taller-font-m)',
    fontSize: 12,
  },
  th: {
    textAlign: 'left' as const,
    padding: '8px 12px',
    borderBottom: '1px solid var(--taller-border)',
    color: 'var(--taller-muted)',
    fontWeight: 500,
    fontSize: 10,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  td: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--taller-progress-bg)',
    color: 'var(--taller-ink)',
  },
  tdRight: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--taller-progress-bg)',
    color: 'var(--taller-ink)',
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums' as const,
  },
}

const pill = (color: string, bg: string): React.CSSProperties => ({
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 12,
  fontSize: 10,
  fontWeight: 600,
  fontFamily: 'var(--taller-font-m)',
  backgroundColor: bg,
  color,
  letterSpacing: '0.3px',
})

/* ── Page ── */

export default async function TrabajoPage({
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

  const {
    servicios, produccion_mecanicos, servicios_serie,
    equipo, pendientes_proceso, pendientes_cobro, ticket_mediana,
  } = data

  const ingresosBrutos = servicios.ingresos_mo + servicios.ingresos_partes_cliente
  const ticketPromedio = servicios.pagados > 0 ? ingresosBrutos / servicios.pagados : 0
  const tasaCobro = servicios.total_servicios > 0
    ? (servicios.pagados / servicios.total_servicios * 100).toFixed(1)
    : '0.0'

  return (
    <div>
      {/* Header */}
      <div className="taller-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--taller-ink)', fontFamily: 'var(--taller-font-d)', margin: 0 }}>
            Trabajo
          </h1>
          <p style={{ fontSize: 12, color: 'var(--taller-muted)', fontFamily: 'var(--taller-font-m)', marginTop: 4 }}>
            Operacion, mecanicos y servicios
          </p>
        </div>
        <Suspense fallback={null}>
          <DateRangePicker desde={desde} hasta={hasta} agg={agg} basePath="/dashboard/taller/trabajo" />
        </Suspense>
      </div>

      {/* ── KPIs ── */}
      <div className="taller-kpis">
        <div style={kpiCard(BLUE)}>
          <div style={label}>Total servicios</div>
          <p style={kpiValue}>{servicios.total_servicios}</p>
        </div>
        <div style={kpiCard('var(--taller-blue)')}>
          <div style={label}>Cobrados</div>
          <p style={kpiValue}>{servicios.pagados}</p>
          <p style={kpiSub}>Tasa de cobro: {tasaCobro}%</p>
        </div>
        <div style={kpiCard('var(--taller-amber)')}>
          <div style={label}>En proceso</div>
          <p style={kpiValue}>{servicios.en_proceso}</p>
        </div>
        <div style={kpiCard('var(--taller-red)')}>
          <div style={label}>Sin cobrar</div>
          <p style={kpiValue}>{servicios.terminados_sin_cobrar}</p>
        </div>
        <div style={kpiCard(BLUE)}>
          <div style={label}>Ticket promedio</div>
          <p style={kpiValue}>{fmtMoney(ticketPromedio)}</p>
          <p style={kpiSub}>Mediana: {fmtMoney(ticket_mediana)}</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SECCION 1 — Equipo
         ══════════════════════════════════════════════ */}
      <h2 style={sectionHeading}>Equipo</h2>

      {equipo.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {equipo.map((mec) => (
            <div key={mec.id} style={{ ...card, padding: 16 }}>
              {/* Row 1: Avatar + Name + Role + Commission */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  backgroundColor: mec.color || '#2d6a4f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'var(--taller-font-m)',
                  flexShrink: 0,
                }}>
                  {mec.iniciales || mec.nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--taller-ink)', fontFamily: 'var(--taller-font-d)' }}>
                    {mec.nombre}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--taller-muted)', fontFamily: 'var(--taller-font-m)' }}>
                    Mecanico &middot; Comision {(mec.comision_pct * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Row 2: Stats */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
                <div>
                  <div style={{ ...label, marginBottom: 2 }}>Servicios</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--taller-ink)', fontFamily: 'var(--taller-font-m)' }}>
                    {mec.servicios}
                  </div>
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 2 }}>MO generada</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--taller-blue)', fontFamily: 'var(--taller-font-m)' }}>
                    {fmtMoney(mec.mo_generada)}
                  </div>
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 2 }}>Comision</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--taller-amber)', fontFamily: 'var(--taller-font-m)' }}>
                    {fmtMoney(mec.comision)}
                  </div>
                </div>
                <div>
                  <div style={{ ...label, marginBottom: 2 }}>Ticket prom.</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--taller-ink)', fontFamily: 'var(--taller-font-m)' }}>
                    {fmtMoney(mec.ticket_promedio)}
                  </div>
                </div>
              </div>

              {/* Row 3: Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--taller-muted)', fontFamily: 'var(--taller-font-m)' }}>
                    Participacion en MO total
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--taller-ink)', fontFamily: 'var(--taller-font-m)' }}>
                    {mec.participacion_mo.toFixed(1)}%
                  </span>
                </div>
                <div style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: 'var(--taller-progress-bg)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(mec.participacion_mo, 100)}%`,
                    backgroundColor: mec.color || '#2d6a4f',
                    borderRadius: 3,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...card, marginBottom: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--taller-muted)', fontFamily: 'var(--taller-font-m)' }}>
            Sin mecanicos registrados
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          SECCION 2 — Operacion (3 columnas)
         ══════════════════════════════════════════════ */}
      <h2 style={sectionHeading}>Operacion</h2>

      <div className="taller-row-3">
        <div style={card}>
          <div style={sectionTitle}>Servicios por mecanico</div>
          <div style={chartWrap}><ServiciosMecanico
            data={produccion_mecanicos.map((m) => ({ nombre: m.nombre, servicios: m.servicios }))}
          /></div>
        </div>
        <div style={card}>
          <div style={sectionTitle}>MO generada por mecanico</div>
          <div style={chartWrap}><MOGenerada
            data={produccion_mecanicos.map((m) => ({ nombre: m.nombre, mo: m.mo }))}
          /></div>
        </div>
        <div style={card}>
          <div style={sectionTitle}>Estado de servicios</div>
          <div style={chartWrap}><EstadoServicios
            pagados={servicios.pagados}
            enProceso={servicios.en_proceso}
            sinCobrar={servicios.terminados_sin_cobrar}
          /></div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SECCION 3 — Servicios por dia (ancho completo)
         ══════════════════════════════════════════════ */}
      <h2 style={sectionHeading}>Volumen de trabajo</h2>

      <div style={{ ...card, marginBottom: 20 }}>
        <div style={sectionTitle}>Servicios por dia</div>
        <div style={chartWrap}><ServiciosDiarios data={servicios_serie} /></div>
      </div>

      {/* ══════════════════════════════════════════════
          SECCION 4 — Pendientes de atencion (2 columnas)
         ══════════════════════════════════════════════ */}
      <h2 style={sectionHeading}>Pendientes de atencion</h2>

      <div className="taller-row">
        {/* En proceso */}
        <div style={card}>
          <div style={sectionTitle}>Servicios en proceso</div>
          {pendientes_proceso.length > 0 ? (
            <div className="taller-table-wrap">
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={tableStyles.th}>Folio</th>
                    <th style={tableStyles.th}>Mecanico</th>
                    <th style={{ ...tableStyles.th, textAlign: 'right' }}>Dias abierto</th>
                    <th style={tableStyles.th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes_proceso.map((s) => (
                    <tr key={s.folio}>
                      <td style={{ ...tableStyles.td, fontWeight: 600 }}>#{s.folio}</td>
                      <td style={tableStyles.td}>{s.mecanico}</td>
                      <td style={tableStyles.tdRight}>{s.dias}d</td>
                      <td style={tableStyles.td}>
                        <span style={pill('#c9942a', '#fef3e2')}>En proceso</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--taller-muted)', fontFamily: 'var(--taller-font-m)' }}>
              Sin servicios en proceso
            </p>
          )}
        </div>

        {/* Terminados sin cobrar */}
        <div style={card}>
          <div style={sectionTitle}>Terminados sin cobrar</div>
          {pendientes_cobro.length > 0 ? (
            <div className="taller-table-wrap">
              <table style={tableStyles.table}>
                <thead>
                  <tr>
                    <th style={tableStyles.th}>Folio</th>
                    <th style={tableStyles.th}>Mecanico</th>
                    <th style={{ ...tableStyles.th, textAlign: 'right' }}>Dias esperando</th>
                    <th style={tableStyles.th}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pendientes_cobro.map((s) => (
                    <tr key={s.folio}>
                      <td style={{ ...tableStyles.td, fontWeight: 600 }}>#{s.folio}</td>
                      <td style={tableStyles.td}>{s.mecanico}</td>
                      <td style={tableStyles.tdRight}>{s.dias}d</td>
                      <td style={tableStyles.td}>
                        <span style={pill('#c94a4a', '#fde8e8')}>Sin cobrar</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--taller-muted)', fontFamily: 'var(--taller-font-m)' }}>
              Sin servicios pendientes de cobro
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
