import { Suspense } from 'react'
import { getTallerData } from '@/lib/taller/queries'
import type { Agg } from '@/types/taller'
import DateRangePicker from '@/components/taller/DateRangePicker'
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

const label: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 500,
  color: 'var(--taller-muted)',
  letterSpacing: '0.1em',
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
    borderBottom: '1px solid var(--taller-border)',
    color: 'var(--taller-ink)',
  },
  tdRight: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--taller-border)',
    color: 'var(--taller-ink)',
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums' as const,
  },
}

const kpiValue: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: 'var(--taller-ink)',
  fontFamily: 'var(--taller-font-d)',
  margin: 0,
}

const kpiSub: React.CSSProperties = {
  fontSize: 10,
  color: 'var(--taller-muted)',
  fontFamily: 'var(--taller-font-m)',
  marginTop: 2,
}

const groupTag = (group: string): React.CSSProperties => {
  const colors: Record<string, { bg: string; fg: string }> = {
    fijo: { bg: '#edf2ee', fg: '#2d6a4f' },
    variable: { bg: '#fef3e2', fg: '#c9942a' },
    operativo: { bg: '#f0ece4', fg: '#97928a' },
  }
  const c = colors[group.toLowerCase()] ?? colors.operativo
  return {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    fontFamily: 'var(--taller-font-m)',
    backgroundColor: c.bg,
    color: c.fg,
  }
}

function getInitials(name: string) {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

/* ── Page ── */

export default async function DineroPage({
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
    servicios, partes, nomina, gastos,
    nomina_mecanicos,
  } = data

  const ingresosBrutos = servicios.ingresos_mo + servicios.ingresos_partes_cliente
  const totalGastos = gastos.reduce((s, g) => s + Number(g.total), 0)
  const utilidadNeta = ingresosBrutos - partes.costo_partes - nomina.nomina_neta - totalGastos

  const pct = (v: number) => ingresosBrutos > 0 ? ((v / ingresosBrutos) * 100).toFixed(1) : '0.0'

  // Format date range for subtitle
  const fmtDate = (d: string) => {
    const [y, m, day] = d.split('-')
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${String(Number(day)).padStart(2, '0')} ${months[Number(m) - 1]} ${y}`
  }

  return (
    <div>
      {/* Header */}
      <div className="taller-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--taller-ink)', fontFamily: 'var(--taller-font-d)', margin: 0 }}>
            Dinero
          </h1>
          <p style={{ fontSize: 12, color: 'var(--taller-muted)', fontFamily: 'var(--taller-font-m)', marginTop: 4 }}>
            ¿Donde esta cada peso?
          </p>
        </div>
        <Suspense fallback={null}>
          <DateRangePicker desde={desde} hasta={hasta} agg={agg} basePath="/dashboard/taller/dinero" />
        </Suspense>
      </div>

      {/* ── KPIs (5 cards) ── */}
      <div className="taller-kpis">
        <div style={card}>
          <div style={label}>Ingresos brutos</div>
          <p style={kpiValue}>{fmtMoney(ingresosBrutos)}</p>
          <p style={kpiSub}>{servicios.pagados} servicios cobrados</p>
        </div>
        <div style={card}>
          <div style={label}>Costo de partes</div>
          <p style={kpiValue}>{fmtMoney(partes.costo_partes)}</p>
          <p style={kpiSub}>{pct(partes.costo_partes)}% del ingreso</p>
        </div>
        <div style={card}>
          <div style={label}>Nomina</div>
          <p style={kpiValue}>{fmtMoney(nomina.nomina_neta)}</p>
          <p style={kpiSub}>{pct(nomina.nomina_neta)}% del ingreso</p>
        </div>
        <div style={card}>
          <div style={label}>Gastos operativos</div>
          <p style={kpiValue}>{fmtMoney(totalGastos)}</p>
          <p style={kpiSub}>{pct(totalGastos)}% del ingreso</p>
        </div>
        <div style={card}>
          <div style={label}>Utilidad neta</div>
          <p style={{ ...kpiValue, color: utilidadNeta >= 0 ? 'var(--taller-blue)' : 'var(--taller-red)' }}>{fmtMoney(utilidadNeta)}</p>
          <p style={kpiSub}>{pct(utilidadNeta)}% del ingreso</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SECCION 1 — Gastos operativos
         ══════════════════════════════════════════════ */}
      <h2 style={sectionHeading}>Gastos operativos</h2>

      <div style={card}>
        <div style={sectionTitle}>Detalle de gastos</div>
        {gastos.length > 0 ? (
          <div className="taller-table-wrap">
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>Categoria</th>
                  <th style={tableStyles.th}>Grupo</th>
                  <th style={{ ...tableStyles.th, textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g, i) => (
                  <tr key={i}>
                    <td style={tableStyles.td}>{g.categoria}</td>
                    <td style={tableStyles.td}>
                      <span style={groupTag(g.expense_group)}>{g.expense_group}</span>
                    </td>
                    <td style={tableStyles.tdRight}>{fmtMoney(Number(g.total))}</td>
                  </tr>
                ))}
                <tr>
                  <td style={{ ...tableStyles.td, fontWeight: 600 }} colSpan={2}>Total gastos</td>
                  <td style={{ ...tableStyles.tdRight, fontWeight: 600 }}>{fmtMoney(totalGastos)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--taller-muted)', fontFamily: 'var(--taller-font-m)' }}>Sin gastos registrados</p>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          SECCION 2 — Nomina
         ══════════════════════════════════════════════ */}
      <h2 style={sectionHeading}>Nomina</h2>

      {/* ── Tabla 1: Rendimiento del equipo ── */}
      <div style={card}>
        <div style={sectionTitle}>Rendimiento del equipo</div>
        <p style={{ fontSize: 10, color: 'var(--taller-muted)', fontFamily: 'var(--taller-font-m)', marginBottom: 12 }}>
          {fmtDate(desde)} — {fmtDate(hasta)}
        </p>
        <div className="taller-table-wrap">
          <table style={tableStyles.table}>
            <thead>
              <tr>
                <th style={tableStyles.th}>Período</th>
                <th style={tableStyles.th}>Mecánico</th>
                <th style={{ ...tableStyles.th, textAlign: 'right' }}>Servicios</th>
                <th style={{ ...tableStyles.th, textAlign: 'right' }}>MO Generada</th>
                <th style={{ ...tableStyles.th, textAlign: 'right' }}>Participación</th>
                <th style={{ ...tableStyles.th, textAlign: 'right' }}>Comisión</th>
                <th style={{ ...tableStyles.th, textAlign: 'right' }}>Salario Base</th>
                <th style={{ ...tableStyles.th, textAlign: 'right' }}>Total Neto</th>
                <th style={{ ...tableStyles.th, textAlign: 'right' }}>Margen Neto</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const totalMoEquipo = nomina_mecanicos.reduce((s, m) => s + m.mo, 0)
                return nomina_mecanicos.map((m, i) => {
                  const isMec = m.role === 'mechanic'
                  const margen = m.mo - m.neto
                  const participacion = totalMoEquipo > 0 ? (m.mo / totalMoEquipo) * 100 : 0
                  const mutedStyle = !isMec ? { color: 'var(--taller-muted)' } : {}

                  return (
                    <tr key={i}>
                      <td style={{ ...tableStyles.td, ...mutedStyle, whiteSpace: 'nowrap' as const }}>
                        {fmtDate(desde)} — {fmtDate(hasta)}
                      </td>
                      <td style={{ ...tableStyles.td, ...mutedStyle }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 28,
                            height: 28,
                            borderRadius: '50%',
                            backgroundColor: isMec ? 'var(--taller-blue-l)' : '#f0ece4',
                            color: isMec ? 'var(--taller-blue)' : 'var(--taller-muted)',
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: 'var(--taller-font-m)',
                            marginRight: 8,
                            flexShrink: 0,
                          }}>{getInitials(m.nombre)}</span>
                          {m.nombre}
                          {!isMec && (
                            <span style={{
                              marginLeft: 6,
                              fontSize: 9,
                              fontWeight: 600,
                              color: 'var(--taller-muted)',
                              fontFamily: 'var(--taller-font-m)',
                              letterSpacing: '0.5px',
                              textTransform: 'uppercase' as const,
                            }}>· fijo</span>
                          )}
                        </div>
                      </td>
                      <td style={{ ...tableStyles.tdRight, ...mutedStyle }}>
                        {m.servicios > 0 ? m.servicios : '—'}
                      </td>
                      <td style={{ ...tableStyles.tdRight, ...mutedStyle, fontWeight: 600 }}>
                        {isMec ? fmtMoney(m.mo) : '—'}
                      </td>
                      <td style={{ ...tableStyles.tdRight, ...mutedStyle }}>
                        {isMec ? `${participacion.toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ ...tableStyles.tdRight, ...mutedStyle, color: isMec ? 'var(--taller-amber)' : mutedStyle.color }}>
                        {fmtMoney(m.comision)}
                      </td>
                      <td style={{ ...tableStyles.tdRight, ...mutedStyle }}>
                        {fmtMoney(m.salario)}
                      </td>
                      <td style={{ ...tableStyles.tdRight, ...mutedStyle, fontWeight: 600 }}>
                        {fmtMoney(m.neto)}
                      </td>
                      <td style={{ ...tableStyles.tdRight, fontWeight: 600, color: isMec ? (margen >= 0 ? 'var(--taller-blue)' : 'var(--taller-red)') : undefined }}>
                        {isMec ? fmtMoney(margen) : '—'}
                      </td>
                    </tr>
                  )
                })
              })()}
              {/* Total row */}
              {(() => {
                const tMo = nomina_mecanicos.reduce((s, m) => s + m.mo, 0)
                const tPagar = nomina_mecanicos.reduce((s, m) => s + m.neto, 0)
                const tMargen = tMo - tPagar
                return (
                  <tr>
                    <td style={{ ...tableStyles.td, fontWeight: 600 }} colSpan={2}>Total</td>
                    <td style={{ ...tableStyles.tdRight, fontWeight: 600 }}>
                      {nomina_mecanicos.reduce((s, m) => s + m.servicios, 0)}
                    </td>
                    <td style={{ ...tableStyles.tdRight, fontWeight: 600 }}>{fmtMoney(tMo)}</td>
                    <td style={{ ...tableStyles.tdRight, fontWeight: 600 }}>100%</td>
                    <td style={{ ...tableStyles.tdRight, fontWeight: 600 }}>
                      {fmtMoney(nomina_mecanicos.reduce((s, m) => s + m.comision, 0))}
                    </td>
                    <td style={{ ...tableStyles.tdRight, fontWeight: 600 }}>
                      {fmtMoney(nomina_mecanicos.reduce((s, m) => s + m.salario, 0))}
                    </td>
                    <td style={{ ...tableStyles.tdRight, fontWeight: 600 }}>{fmtMoney(tPagar)}</td>
                    <td style={{ ...tableStyles.tdRight, fontWeight: 600, color: tMargen >= 0 ? 'var(--taller-blue)' : 'var(--taller-red)' }}>
                      {fmtMoney(tMargen)}
                    </td>
                  </tr>
                )
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tabla 2: Refacciones del equipo ── */}
      {nomina_mecanicos.some(m => m.role === 'mechanic') && (
        <div style={{ ...card, marginTop: 16 }}>
          <div style={sectionTitle}>Refacciones del equipo</div>
          <div className="taller-table-wrap">
            <table style={tableStyles.table}>
              <thead>
                <tr>
                  <th style={tableStyles.th}>Mecánico</th>
                  <th style={{ ...tableStyles.th, textAlign: 'right' }}>Partes usadas</th>
                  <th style={{ ...tableStyles.th, textAlign: 'right' }}>Costo partes</th>
                  <th style={{ ...tableStyles.th, textAlign: 'right' }}>Comisión partes</th>
                </tr>
              </thead>
              <tbody>
                {nomina_mecanicos
                  .filter(m => m.role === 'mechanic')
                  .map((m, i) => {
                    const comPartes = m.commission_on_parts
                      ? m.costo_partes * (m.commission_percentage / 100)
                      : null
                    return (
                      <tr key={i}>
                        <td style={tableStyles.td}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              backgroundColor: 'var(--taller-blue-l)',
                              color: 'var(--taller-blue)',
                              fontSize: 11,
                              fontWeight: 600,
                              fontFamily: 'var(--taller-font-m)',
                              marginRight: 8,
                              flexShrink: 0,
                            }}>{getInitials(m.nombre)}</span>
                            {m.nombre}
                          </div>
                        </td>
                        <td style={tableStyles.tdRight}>
                          {m.partes_usadas > 0 ? m.partes_usadas : '0'}
                        </td>
                        <td style={tableStyles.tdRight}>
                          {fmtMoney(m.costo_partes)}
                        </td>
                        <td style={{ ...tableStyles.tdRight, color: comPartes !== null ? 'var(--taller-amber)' : 'var(--taller-muted)' }}>
                          {comPartes !== null ? fmtMoney(comPartes) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                {/* Total row */}
                {(() => {
                  const mechs = nomina_mecanicos.filter(m => m.role === 'mechanic')
                  const tPartes = mechs.reduce((s, m) => s + m.partes_usadas, 0)
                  const tCosto = mechs.reduce((s, m) => s + m.costo_partes, 0)
                  const tComPartes = mechs.reduce((s, m) => {
                    if (!m.commission_on_parts) return s
                    return s + m.costo_partes * (m.commission_percentage / 100)
                  }, 0)
                  return (
                    <tr>
                      <td style={{ ...tableStyles.td, fontWeight: 600 }}>Total</td>
                      <td style={{ ...tableStyles.tdRight, fontWeight: 600 }}>{tPartes}</td>
                      <td style={{ ...tableStyles.tdRight, fontWeight: 600 }}>{fmtMoney(tCosto)}</td>
                      <td style={{ ...tableStyles.tdRight, fontWeight: 600, color: 'var(--taller-amber)' }}>
                        {tComPartes > 0 ? fmtMoney(tComPartes) : '—'}
                      </td>
                    </tr>
                  )
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
