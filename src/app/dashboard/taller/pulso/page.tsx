import { Suspense } from 'react'
import { getTallerData, getTenantClient } from '@/lib/taller/queries'
import type { Agg, TallerData } from '@/types/taller'
import DateRangePicker from '@/components/taller/DateRangePicker'
import PulsoTendencia from '@/components/taller/charts/PulsoTendencia'

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

function getPreviousPeriod(desde: string, hasta: string) {
  const d = new Date(desde + 'T12:00:00')
  const h = new Date(hasta + 'T12:00:00')
  d.setMonth(d.getMonth() - 1)
  h.setMonth(h.getMonth() - 1)
  return {
    desde: d.toISOString().slice(0, 10),
    hasta: h.toISOString().slice(0, 10),
  }
}

/* ── Styles ── */

const card: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e1d8',
  borderRadius: 10,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
}

const chartWrap: React.CSSProperties = { flex: 1 }

const label: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 500,
  color: '#97928a',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  fontFamily: "'IBM Plex Mono', monospace",
  marginBottom: 6,
}

const kpiValue: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 600,
  color: '#1a1814',
  fontFamily: "'IBM Plex Mono', monospace",
}

const kpiSub: React.CSSProperties = {
  fontSize: 10,
  color: '#97928a',
  fontFamily: "'IBM Plex Mono', monospace",
  marginTop: 2,
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: '#97928a',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  fontFamily: "'IBM Plex Mono', monospace",
  marginBottom: 8,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left' as const,
  padding: '8px 12px',
  fontSize: 10,
  fontWeight: 500,
  color: '#97928a',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  fontFamily: "'IBM Plex Mono', monospace",
  borderBottom: '2px solid #e5e1d8',
}

const tdStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid #e5e1d8',
  color: '#1a1814',
  fontSize: 12,
  fontFamily: "'IBM Plex Mono', monospace",
}

/* ── Helpers ── */

function semaforo(v: number, greenFn: (n: number) => boolean, amberFn: (n: number) => boolean): string {
  if (greenFn(v)) return '#0070f3'
  if (amberFn(v)) return '#f5a623'
  return '#c94a4a'
}

function computeMetrics(data: TallerData) {
  const ingresos = data.servicios.ingresos_mo + data.servicios.ingresos_partes_cliente
  const costoPartes = Number(data.partes.costo_partes)
  const nominaNeta = Number(data.nomina.nomina_neta)
  const totalGastos = data.gastos.reduce((s, g) => s + Number(g.total), 0)
  const egresos = costoPartes + nominaNeta + totalGastos
  const flujoLibre = ingresos - egresos
  return { ingresos, costoPartes, nominaNeta, totalGastos, egresos, flujoLibre }
}

/* ── Page ── */

export default async function PulsoPage({
  searchParams,
}: {
  searchParams: { desde?: string; hasta?: string; agg?: string }
}) {
  const defaults = defaultDates()
  const desde = searchParams.desde || defaults.desde
  const hasta = searchParams.hasta || defaults.hasta
  const agg: Agg = VALID_AGG.has(searchParams.agg as Agg) ? (searchParams.agg as Agg) : 'dia'

  const prev = getPreviousPeriod(desde, hasta)

  let data: TallerData | null = null
  let prevData: TallerData | null = null
  let error: string | null = null

  const [currentResult, prevResult] = await Promise.allSettled([
    getTallerData(desde, hasta, agg),
    getTallerData(prev.desde, prev.hasta, agg),
  ])

  if (currentResult.status === 'rejected') {
    error = currentResult.reason?.message || 'Error al cargar datos'
  } else {
    data = currentResult.value
  }
  if (prevResult.status === 'fulfilled') {
    prevData = prevResult.value
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ ...label, fontSize: 13, color: '#c94a4a' }}>
          {error || 'No se pudieron cargar los datos'}
        </p>
      </div>
    )
  }

  const { servicios, gastos, ingresos_serie, margen_partes_serie } = data
  const m = computeMetrics(data)

  /* Previous period comparison */
  let pctChange: number | null = null
  if (prevData) {
    const pm = computeMetrics(prevData)
    if (pm.flujoLibre !== 0) {
      pctChange = ((m.flujoLibre - pm.flujoLibre) / Math.abs(pm.flujoLibre)) * 100
    } else if (m.flujoLibre > 0) {
      pctChange = 100
    } else if (m.flujoLibre < 0) {
      pctChange = -100
    }
  }

  /* ── Section 2: Ratios ── */
  const margenBruto = m.ingresos > 0 ? ((m.ingresos - m.costoPartes) / m.ingresos) * 100 : 0
  const nominaPct = m.ingresos > 0 ? (m.nominaNeta / m.ingresos) * 100 : 0
  const gastosPct = m.ingresos > 0 ? (m.totalGastos / m.ingresos) * 100 : 0
  const roiMO = m.nominaNeta > 0 ? servicios.ingresos_mo / m.nominaNeta : 0

  /* ── Section 3 left: Tendencia ── */
  const costPerLabel = new Map<string, number>()
  for (const d of margen_partes_serie) costPerLabel.set(d.semana, d.costo)
  const numBuckets = ingresos_serie.length
  const nomPerBucket = numBuckets > 0 ? m.nominaNeta / numBuckets : 0
  const gastosPerBucket = numBuckets > 0 ? m.totalGastos / numBuckets : 0

  const tendencia = ingresos_serie.map(d => {
    const ing = d.mo + d.partes
    const egr = (costPerLabel.get(d.semana) ?? 0) + nomPerBucket + gastosPerBucket
    return { label: d.semana, ingresos: ing, egresos: egr, flujo: ing - egr }
  })

  /* ── Section 3 right: Gastos jerárquicos por expense_group → categoría ── */
  const gastosGrouped = new Map<string, number>()
  const gastosPorGrupo = new Map<string, { categoria: string; total: number }[]>()
  for (const g of gastos) {
    gastosGrouped.set(g.expense_group, (gastosGrouped.get(g.expense_group) ?? 0) + g.total)
    const cats = gastosPorGrupo.get(g.expense_group) ?? []
    cats.push({ categoria: g.categoria, total: g.total })
    gastosPorGrupo.set(g.expense_group, cats)
  }
  const gastosHierarchy = Array.from(gastosGrouped.entries())
    .map(([grupo, monto]) => ({
      grupo,
      monto,
      pct: m.ingresos > 0 ? (monto / m.ingresos) * 100 : 0,
      categorias: (gastosPorGrupo.get(grupo) ?? []).sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.monto - a.monto)

  /* ── Section 4: Estructura de costos ── */
  const costRows = [
    { name: 'Operación', value: gastosGrouped.get('Operación') ?? 0, target: 40 },
    { name: 'Nómina', value: m.nominaNeta, target: 30 },
    { name: 'Local', value: gastosGrouped.get('Local') ?? 0, target: 25 },
    { name: 'Personal', value: gastosGrouped.get('Personal') ?? 0, target: 5 },
    { name: 'Administración', value: gastosGrouped.get('Administración') ?? 0, target: 15 },
  ]
  const totalCostValue = costRows.reduce((s, r) => s + r.value, 0)
  const totalCostPct = m.ingresos > 0 ? (totalCostValue / m.ingresos) * 100 : 0

  /* ── Section 5: ROI por mecánico (subconsultas separadas) ── */
  const db = await getTenantClient()
  const [moQuery, swQuery, spQuery, payrollQuery, empleadosQuery] = await Promise.all([
    // MO: service_jobs de servicios pagados válidos
    db
      .from('service_jobs')
      .select('employee_id, service_id, labor_price, services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),
    // Servicios: service_workers de servicios pagados válidos
    db
      .from('service_workers')
      .select('employee_id, service_id, services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),
    // Refacciones: service_parts de servicios pagados válidos
    db
      .from('service_parts')
      .select('service_id, price, qty, services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),
    // Nómina
    db
      .from('payroll')
      .select('employee_id, base_salary, total_commission')
      .eq('is_paid', true)
      .gte('week_start', desde)
      .lte('week_end', hasta),
    // Empleados activos (filtrar admin en cliente)
    db
      .from('employees')
      .select('id, name, last_name, color, initials, role')
      .eq('is_active', true),
  ])

  // MO por service_id (de service_jobs — employee_id puede ser null)
  const moPerService = new Map<string, number>()
  for (const row of (moQuery.data ?? []) as any[]) {
    const sid = String(row.service_id)
    moPerService.set(sid, (moPerService.get(sid) ?? 0) + (Number(row.labor_price) || 0))
  }

  // Servicios por employee_id (de service_workers, COUNT DISTINCT service_id)
  const svcMap = new Map<string, Set<string>>()
  for (const row of (swQuery.data ?? []) as any[]) {
    const eid = String(row.employee_id)
    const s = svcMap.get(eid) ?? new Set<string>()
    s.add(String(row.service_id))
    svcMap.set(eid, s)
  }

  // MO por employee_id (cruzar service_workers → service_jobs por service_id)
  const moMap = new Map<string, number>()
  svcMap.forEach((serviceIds, eid) => {
    let total = 0
    serviceIds.forEach(sid => { total += moPerService.get(sid) ?? 0 })
    moMap.set(eid, total)
  })

  // Refacciones por service_id (de service_parts)
  const partsPerService = new Map<string, number>()
  for (const row of (spQuery.data ?? []) as any[]) {
    const sid = String(row.service_id)
    partsPerService.set(sid, (partsPerService.get(sid) ?? 0) + ((Number(row.price) * Number(row.qty)) || 0))
  }

  // Refacciones por employee_id (cruzar service_workers → service_parts)
  const refMap = new Map<string, number>()
  svcMap.forEach((serviceIds, eid) => {
    let total = 0
    serviceIds.forEach(sid => { total += partsPerService.get(sid) ?? 0 })
    refMap.set(eid, total)
  })

  // Nómina por employee_id
  const payMap = new Map<string, { sueldo: number; comisiones: number }>()
  for (const row of (payrollQuery.data ?? []) as any[]) {
    const eid = String(row.employee_id)
    const e = payMap.get(eid) ?? { sueldo: 0, comisiones: 0 }
    e.sueldo += Number(row.base_salary) || 0
    e.comisiones += Number(row.total_commission) || 0
    payMap.set(eid, e)
  }

  // IDs con payroll en el período
  const idsWithPayroll = new Set(payMap.keys())

  // Cruzar por id de empleado: incluir si tiene payroll O service_workers, excluir admin
  const mecanicos = ((empleadosQuery.data ?? []) as any[])
    .filter(emp => emp.role !== 'admin')
    .filter(emp => idsWithPayroll.has(String(emp.id)) || svcMap.has(String(emp.id)))
    .map(emp => {
      const eid = String(emp.id)
      const mo = moMap.get(eid) ?? 0
      const svcCount = svcMap.get(eid)?.size ?? 0
      const refacciones = refMap.get(eid) ?? 0
      const totalGenerado = mo + refacciones
      const pay = payMap.get(eid) ?? { sueldo: 0, comisiones: 0 }
      const costoTotal = pay.comisiones + pay.sueldo
      const utilidad = mo - costoTotal
      const roi = costoTotal > 0 ? mo / costoTotal : 0
      const nombre = `${emp.name ?? ''} ${emp.last_name ?? ''}`.trim()
      const iniciales = emp.initials ?? nombre.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
      const color = emp.color ?? '#1a1814'
      return { nombre, iniciales, color, servicios: svcCount, totalGenerado, mo, refacciones, comisiones: pay.comisiones, sueldo: pay.sueldo, costoTotal, utilidad, roi }
    })
    .sort((a, b) => b.mo - a.mo)

  // Totales
  const totMec = mecanicos.reduce((t, r) => ({
    servicios: t.servicios + r.servicios,
    totalGenerado: t.totalGenerado + r.totalGenerado,
    mo: t.mo + r.mo,
    comisiones: t.comisiones + r.comisiones,
    sueldo: t.sueldo + r.sueldo,
    costoTotal: t.costoTotal + r.costoTotal,
    utilidad: t.utilidad + r.utilidad,
  }), { servicios: 0, totalGenerado: 0, mo: 0, comisiones: 0, sueldo: 0, costoTotal: 0, utilidad: 0 })
  const totRoi = totMec.costoTotal > 0 ? totMec.mo / totMec.costoTotal : 0

  return (
    <div>
      {/* Header */}
      <div className="taller-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a1814', fontFamily: "'Lora', serif", margin: 0 }}>
            Pulso
          </h1>
          <p style={{ fontSize: 12, color: '#97928a', fontFamily: "'IBM Plex Mono', monospace", marginTop: 4 }}>
            Vista ejecutiva del negocio
          </p>
        </div>
        <Suspense fallback={null}>
          <DateRangePicker desde={desde} hasta={hasta} agg={agg} basePath="/dashboard/taller/pulso" />
        </Suspense>
      </div>

      {/* ═══ SECCIÓN 1 — HERO ═══ */}
      <div style={{
        background: '#1a1a1a',
        borderRadius: 10,
        padding: '16px 24px',
        color: '#ffffff',
        marginBottom: 20,
        maxWidth: '40%',
      }}>
        {/* Top row: label + vs anterior */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            fontSize: 10, fontWeight: 500, color: '#97928a',
            letterSpacing: '1px', textTransform: 'uppercase' as const,
            fontFamily: "'IBM Plex Mono', monospace",
          }}>
            FLUJO LIBRE
          </div>
          {pctChange !== null && (
            <div style={{ textAlign: 'right' as const }}>
              <div style={{ fontSize: 10, color: '#97928a', fontFamily: "'IBM Plex Mono', monospace" }}>
                vs período anterior
              </div>
              <div style={{
                fontSize: 22, fontWeight: 700,
                fontFamily: "'IBM Plex Mono', monospace",
                color: pctChange >= 0 ? '#0070f3' : '#c94a4a',
              }}>
                {pctChange >= 0 ? '↑' : '↓'} {Math.abs(pctChange).toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        <div style={{
          fontSize: 36, fontWeight: 700,
          fontFamily: "'IBM Plex Mono', monospace",
          marginTop: 4,
        }}>
          {fmtMoney(m.flujoLibre)}
        </div>
        <p style={{
          fontSize: 12, fontFamily: "'IBM Plex Mono', monospace",
          margin: '4px 0 0',
          color: m.flujoLibre >= 0 ? '#0070f3' : '#c94a4a',
        }}>
          {m.flujoLibre >= 0 ? 'Utilidad positiva en este período' : 'Pérdida en este período'}
        </p>
        <div style={{ display: 'flex', gap: 28, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: '#97928a', fontFamily: "'IBM Plex Mono', monospace" }}>Ingresos</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#0070f3', fontFamily: "'IBM Plex Mono', monospace" }}>
              {fmtMoney(m.ingresos)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#97928a', fontFamily: "'IBM Plex Mono', monospace" }}>Egresos</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#d4d0c8', fontFamily: "'IBM Plex Mono', monospace" }}>
              {fmtMoney(m.egresos)}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECCIÓN 2 — RATIOS DE SALUD ═══ */}
      <div className="taller-kpis">
        <div style={card}>
          <div style={label}>Margen bruto</div>
          <div style={{ ...kpiValue, color: semaforo(margenBruto, v => v > 35, v => v >= 25) }}>
            {margenBruto.toFixed(1)}%
          </div>
          <p style={kpiSub}>Objetivo: &gt;35%</p>
        </div>

        <div style={card}>
          <div style={label}>Nómina / ingresos</div>
          <div style={{ ...kpiValue, color: semaforo(nominaPct, v => v < 30, v => v <= 40) }}>
            {nominaPct.toFixed(1)}%
          </div>
          <p style={kpiSub}>Objetivo: &lt;30%</p>
        </div>

        <div style={card}>
          <div style={label}>Gastos fijos / ingresos</div>
          <div style={{ ...kpiValue, color: semaforo(gastosPct, v => v < 35, v => v <= 45) }}>
            {gastosPct.toFixed(1)}%
          </div>
          <p style={kpiSub}>Objetivo: &lt;35%</p>
        </div>

        <div style={card}>
          <div style={label}>ROI mano de obra</div>
          <div style={{ ...kpiValue, color: semaforo(roiMO, v => v > 2, v => v >= 1.5) }}>
            {roiMO.toFixed(1)}x
          </div>
          <p style={kpiSub}>Objetivo: &gt;2x</p>
        </div>
      </div>

      {/* ═══ SECCIÓN 3 — DOS COLUMNAS ═══ */}
      <div className="taller-row" style={{ marginBottom: 20 }}>
        <div style={{ ...card, flex: '3 1 0', padding: 14 }}>
          <div style={{ ...sectionTitle, margin: '0 0 4px' }}>Tendencia en revisión</div>
          <p style={{ fontSize: 11, color: '#97928a', fontFamily: "'IBM Plex Mono', monospace", margin: '0 0 6px' }}>
            Ingresos, egresos y flujo libre — por {agg === 'dia' ? 'día' : agg}
          </p>
          <div style={chartWrap}>
            <PulsoTendencia data={tendencia} />
          </div>
        </div>

        <div style={{ ...card, flex: '2 1 0', padding: 14, overflow: 'auto' }}>
          <div style={{ ...sectionTitle, margin: '0 0 4px' }}>¿En qué se va el dinero?</div>
          <p style={{ fontSize: 11, color: '#97928a', fontFamily: "'IBM Plex Mono', monospace", margin: '0 0 10px' }}>
            Gastos como % de ingresos
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {gastosHierarchy.map(g => (
              <div key={g.grupo}>
                {/* Group row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{
                    flex: 1, fontSize: 11, fontWeight: 600,
                    fontFamily: "'IBM Plex Mono', monospace",
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.5px', color: '#1a1814',
                  }}>
                    {g.grupo}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#1a1814', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' as const }}>
                    {g.pct.toFixed(1)}%
                  </div>
                  <div style={{ fontSize: 11, color: '#97928a', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' as const, minWidth: 70, textAlign: 'right' as const }}>
                    {fmtMoney(g.monto)}
                  </div>
                </div>
                <div style={{ background: '#f4f2ed', borderRadius: 2, height: 6, marginBottom: 6 }}>
                  <div style={{ background: '#c94a4a', borderRadius: 2, height: 6, width: `${Math.min(g.pct, 100)}%` }} />
                </div>
                {/* Category rows */}
                {g.categorias.map(c => {
                  const catPct = m.ingresos > 0 ? (c.total / m.ingresos) * 100 : 0
                  return (
                    <div key={c.categoria} style={{ paddingLeft: 20, marginBottom: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, fontSize: 12, color: '#97928a', fontFamily: "'IBM Plex Sans', sans-serif" }}>
                          {c.categoria}
                        </div>
                        <div style={{ fontSize: 11, color: '#97928a', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' as const, minWidth: 70, textAlign: 'right' as const }}>
                          {fmtMoney(c.total)}
                        </div>
                      </div>
                      <div style={{ background: '#f4f2ed', borderRadius: 1, height: 3, marginTop: 2 }}>
                        <div style={{ background: 'rgba(201,74,74,0.6)', borderRadius: 1, height: 3, width: `${Math.min(catPct, 100)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ SECCIÓN 4 — ESTRUCTURA DE COSTOS ═══ */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={sectionTitle}>Estructura de costos</div>
        <p style={{ fontSize: 11, color: '#97928a', fontFamily: "'IBM Plex Mono', monospace", margin: '0 0 16px' }}>
          ¿Los costos crecen más rápido que los ingresos? Objetivo: total costos &lt;65% de ingresos
        </p>
        <div className="taller-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Categoría</th>
                <th style={{ ...thStyle, width: '35%' }}>&nbsp;</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>% ingreso</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Monto</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Objetivo</th>
              </tr>
            </thead>
            <tbody>
              {costRows.map(row => {
                const pct = m.ingresos > 0 ? (row.value / m.ingresos) * 100 : 0
                const color = semaforo(pct, v => v < row.target, v => v < row.target * 1.3)
                return (
                  <tr key={row.name}>
                    <td style={tdStyle}>{row.name}</td>
                    <td style={tdStyle}>
                      <div style={{ background: '#f4f2ed', borderRadius: 4, height: 8 }}>
                        <div style={{
                          background: '#1a1a1a',
                          borderRadius: 4,
                          height: 8,
                          width: `${Math.min(pct, 100)}%`,
                          transition: 'width 0.3s',
                        }} />
                      </div>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' as const, color, fontWeight: 600 }}>
                      {pct.toFixed(1)}%
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' as const }}>
                      {fmtMoney(row.value)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right' as const, color: '#97928a', fontSize: 10 }}>
                      &lt;{row.target}%
                    </td>
                  </tr>
                )
              })}
              {/* Total row */}
              <tr>
                <td style={{ ...tdStyle, fontWeight: 700, borderBottom: 'none' }}>Total costos</td>
                <td style={{ ...tdStyle, borderBottom: 'none' }}>
                  <div style={{ background: '#f4f2ed', borderRadius: 4, height: 8 }}>
                    <div style={{
                      background: '#1a1a1a',
                      borderRadius: 4,
                      height: 8,
                      width: `${Math.min(totalCostPct, 100)}%`,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                </td>
                <td style={{
                  ...tdStyle, textAlign: 'right' as const, fontWeight: 700,
                  borderBottom: 'none',
                  color: semaforo(totalCostPct, v => v < 65, v => v < 75),
                }}>
                  {totalCostPct.toFixed(1)}%
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 700, borderBottom: 'none' }}>
                  {fmtMoney(totalCostValue)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' as const, color: '#97928a', fontSize: 10, borderBottom: 'none' }}>
                  &lt;65%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ SECCIÓN 5 — ROI POR MECÁNICO ═══ */}
      <div style={card}>
        <div style={sectionTitle}>Rendimiento por mecánico</div>
        <div className="taller-table-wrap">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Mecánico</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Servicios</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Total generado</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>MO generada</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Comisión</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Sueldo</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Costo total</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>Utilidad</th>
                <th style={{ ...thStyle, textAlign: 'right' as const }}>ROI</th>
              </tr>
            </thead>
            <tbody>
              {mecanicos.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ ...tdStyle, textAlign: 'center' as const, color: '#97928a' }}>
                    Sin datos de mecánicos en este período
                  </td>
                </tr>
              )}
              {mecanicos.map(mec => (
                <tr key={mec.nombre}>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: mec.color, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace",
                        flexShrink: 0,
                      }}>
                        {mec.iniciales}
                      </div>
                      {mec.nombre}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const }}>{mec.servicios}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const }}>{fmtMoney(mec.totalGenerado)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const }}>{fmtMoney(mec.mo)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const }}>{fmtMoney(mec.comisiones)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const }}>{fmtMoney(mec.sueldo)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const }}>{fmtMoney(mec.costoTotal)}</td>
                  <td style={{
                    ...tdStyle, textAlign: 'right' as const,
                    color: mec.utilidad >= 0 ? '#0070f3' : '#c94a4a',
                    fontWeight: 600,
                  }}>
                    {fmtMoney(mec.utilidad)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#fff',
                      background: semaforo(mec.roi, v => v > 2, v => v >= 1.5),
                    }}>
                      {mec.roi.toFixed(1)}x
                    </span>
                  </td>
                </tr>
              ))}
              {/* Fila de totales */}
              {mecanicos.length > 0 && (
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 700, borderBottom: 'none' }}>Total</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 700, borderBottom: 'none' }}>{totMec.servicios}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 700, borderBottom: 'none' }}>{fmtMoney(totMec.totalGenerado)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 700, borderBottom: 'none' }}>{fmtMoney(totMec.mo)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 700, borderBottom: 'none' }}>{fmtMoney(totMec.comisiones)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 700, borderBottom: 'none' }}>{fmtMoney(totMec.sueldo)}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 700, borderBottom: 'none' }}>{fmtMoney(totMec.costoTotal)}</td>
                  <td style={{
                    ...tdStyle, textAlign: 'right' as const, fontWeight: 700, borderBottom: 'none',
                    color: totMec.utilidad >= 0 ? '#0070f3' : '#c94a4a',
                  }}>
                    {fmtMoney(totMec.utilidad)}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'right' as const, fontWeight: 700, borderBottom: 'none' }}>
                    {totRoi.toFixed(1)}x
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
