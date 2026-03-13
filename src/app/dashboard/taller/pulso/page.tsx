import { Suspense } from 'react'
import { getTallerData, getTenantClient } from '@/lib/taller/queries'
import type { Agg, TallerData } from '@/types/taller'
import DateRangePicker from '@/components/taller/DateRangePicker'
import PulsoTendencia from '@/components/taller/charts/PulsoTendencia'
import PulsoShareButton from '@/components/taller/PulsoShareButton'
import PulsoExportButtons from '@/components/taller/PulsoExportButtons'
import { fmtMoney } from '@/components/taller/utils'
import { getUserTenantRole } from '@/app/actions/dashboards'
import InfoTooltip from '@/components/taller/InfoTooltip'

const VALID_AGG = new Set<Agg>(['dia', 'semana', 'mes', 'anio'])

/* ── Helpers ── */

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
  return { desde: d.toISOString().slice(0, 10), hasta: h.toISOString().slice(0, 10) }
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

function roiBadgeColor(roi: number) {
  if (roi > 2) return '#16a34a'
  if (roi >= 1.5) return '#d97706'
  return '#dc2626'
}

function costColor(pct: number, target: number) {
  if (pct > target) return '#dc2626'
  if (pct > target * 0.8) return '#d97706'
  return '#0070f3'
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
      <div className="flex items-center justify-center p-10">
        <p className="text-sm text-red-600">{error || 'No se pudieron cargar los datos'}</p>
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

  /* Section 1 ratios */
  const margenBruto = m.ingresos > 0 ? ((m.ingresos - m.costoPartes) / m.ingresos) * 100 : 0
  const roiMO = m.nominaNeta > 0 ? servicios.ingresos_mo / m.nominaNeta : 0

  /* Tendencia chart data */
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

  /* Gastos jerárquicos por expense_group → categoría */
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

  /* Estructura de costos */
  const costRows = [
    { name: 'Operación', value: gastosGrouped.get('Operación') ?? 0, target: 40 },
    { name: 'Nómina', value: m.nominaNeta, target: 30 },
    { name: 'Local', value: gastosGrouped.get('Local') ?? 0, target: 25 },
    { name: 'Personal', value: gastosGrouped.get('Personal') ?? 0, target: 5 },
    { name: 'Administración', value: gastosGrouped.get('Administración') ?? 0, target: 15 },
  ]
  const totalCostValue = costRows.reduce((s, r) => s + r.value, 0)
  const totalCostPct = m.ingresos > 0 ? (totalCostValue / m.ingresos) * 100 : 0

  /* ── ROI por mecánico (subconsultas separadas) ── */
  const db = await getTenantClient()
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  const [moQuery, swQuery, spQuery, payrollQuery, empleadosQuery, unpaidSvcsQuery, unpaidMoQuery, unpaidPartsQuery, staleSvcsQuery, funnelSvcsQuery, funnelMoQuery, funnelPartsQuery] = await Promise.all([
    // MO: service_jobs de servicios pagados válidos
    db.from('service_jobs')
      .select('employee_id, service_id, labor_price, services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),
    // Servicios: service_workers de servicios pagados válidos
    db.from('service_workers')
      .select('employee_id, service_id, services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),
    // Refacciones: service_parts de servicios pagados válidos
    db.from('service_parts')
      .select('service_id, price, qty, services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),
    // Nómina
    db.from('payroll')
      .select('employee_id, base_salary, total_commission')
      .eq('is_paid', true)
      .gte('week_start', desde)
      .lte('week_end', hasta),
    // Empleados activos
    db.from('employees')
      .select('id, name, last_name, color, initials, role'),
    // Cartera: servicios terminados sin cobrar
    db.from('services').select('id')
      .is('paid_at', null).neq('status', 'invalid').eq('work_completed', true),
    // Cartera: MO sin cobrar (terminados)
    db.from('service_jobs').select('labor_price, services!inner(status)')
      .is('services.paid_at', null).neq('services.status', 'invalid')
      .eq('services.work_completed', true),
    // Cartera: Refacciones sin cobrar (terminados)
    db.from('service_parts').select('price, qty, services!inner(status)')
      .is('services.paid_at', null).neq('services.status', 'invalid')
      .eq('services.work_completed', true),
    // Servicios activos +3 días
    db.from('services').select('id')
      .eq('status', 'active').is('paid_at', null).lt('created_at', threeDaysAgo),
    // Funnel: todos los servicios creados en el período
    db.from('services').select('id, status, paid_at')
      .gte('created_at', desde).lte('created_at', hasta + 'T23:59:59'),
    // Funnel: MO de servicios creados en el período
    db.from('service_jobs').select('service_id, labor_price, services!inner(created_at)')
      .gte('services.created_at', desde).lte('services.created_at', hasta + 'T23:59:59'),
    // Funnel: Refacciones de servicios creados en el período
    db.from('service_parts').select('service_id, price, qty, services!inner(created_at)')
      .gte('services.created_at', desde).lte('services.created_at', hasta + 'T23:59:59'),
  ])

  // MO por service_id
  const moPerService = new Map<string, number>()
  for (const row of (moQuery.data ?? []) as any[]) {
    const sid = String(row.service_id)
    moPerService.set(sid, (moPerService.get(sid) ?? 0) + (Number(row.labor_price) || 0))
  }

  // Servicios por employee_id (COUNT DISTINCT service_id via service_workers)
  const svcMap = new Map<string, Set<string>>()
  for (const row of (swQuery.data ?? []) as any[]) {
    const eid = String(row.employee_id)
    const s = svcMap.get(eid) ?? new Set<string>()
    s.add(String(row.service_id))
    svcMap.set(eid, s)
  }

  // MO por employee_id (cruzar service_workers → service_jobs)
  const moMap = new Map<string, number>()
  svcMap.forEach((serviceIds, eid) => {
    let total = 0
    serviceIds.forEach(sid => { total += moPerService.get(sid) ?? 0 })
    moMap.set(eid, total)
  })

  // Refacciones por service_id
  const partsPerService = new Map<string, number>()
  for (const row of (spQuery.data ?? []) as any[]) {
    const sid = String(row.service_id)
    partsPerService.set(sid, (partsPerService.get(sid) ?? 0) + ((Number(row.price) * Number(row.qty)) || 0))
  }

  // Refacciones por employee_id
  const refMap = new Map<string, number>()
  svcMap.forEach((serviceIds, eid) => {
    let total = 0
    serviceIds.forEach(sid => { total += partsPerService.get(sid) ?? 0 })
    refMap.set(eid, total)
  })

  // Nómina por employee_id — UN registro por empleado (asignación directa)
  const payMap = new Map<string, { sueldo: number; comisiones: number }>()
  for (const row of (payrollQuery.data ?? []) as any[]) {
    const eid = String(row.employee_id)
    payMap.set(eid, {
      sueldo: Number(row.base_salary) || 0,
      comisiones: Number(row.total_commission) || 0,
    })
  }

  const idsWithPayroll = new Set(payMap.keys())

  const mecanicos = ((empleadosQuery.data ?? []) as any[])
    .filter(emp => !['admin'].includes(emp.role))
    .filter(emp => idsWithPayroll.has(String(emp.id)) || svcMap.has(String(emp.id)))
    .map(emp => {
      const eid = String(emp.id)
      const mo = moMap.get(eid) ?? 0
      const svcCount = svcMap.get(eid)?.size ?? 0
      const refacciones = refMap.get(eid) ?? 0
      const pay = payMap.get(eid) ?? { sueldo: 0, comisiones: 0 }
      const costoTotal = pay.comisiones + pay.sueldo
      const utilidad = mo - costoTotal
      const roi = costoTotal > 0 ? mo / costoTotal : 0
      const nombre = `${emp.name ?? ''} ${emp.last_name ?? ''}`.trim()
      const iniciales = emp.initials ?? nombre.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
      const color = emp.color ?? '#1a1814'
      return { nombre, iniciales, color, servicios: svcCount, mo, refacciones, comisiones: pay.comisiones, sueldo: pay.sueldo, costoTotal, utilidad, roi }
    })
    .sort((a, b) => b.mo - a.mo)

  const totMec = mecanicos.reduce((t, r) => ({
    servicios: t.servicios + r.servicios,
    mo: t.mo + r.mo,
    comisiones: t.comisiones + r.comisiones,
    sueldo: t.sueldo + r.sueldo,
    costoTotal: t.costoTotal + r.costoTotal,
    utilidad: t.utilidad + r.utilidad,
  }), { servicios: 0, mo: 0, comisiones: 0, sueldo: 0, costoTotal: 0, utilidad: 0 })
  const totRoi = totMec.costoTotal > 0 ? totMec.mo / totMec.costoTotal : 0

  /* Alertas operativas */
  const unpaidCount = (unpaidSvcsQuery.data ?? []).length
  const unpaidMO = (unpaidMoQuery.data ?? []).reduce((s: number, r: any) => s + (Number(r.labor_price) || 0), 0)
  const unpaidParts = (unpaidPartsQuery.data ?? []).reduce((s: number, r: any) => s + ((Number(r.price) * Number(r.qty)) || 0), 0)
  const carteraPorCobrar = unpaidMO + unpaidParts
  const staleCount = (staleSvcsQuery.data ?? []).length
  const lowRoiMecs = mecanicos.filter(mc => mc.costoTotal > 0 && mc.roi < 1.5)

  /* Embudo de conversión */
  const funnelSvcs = (funnelSvcsQuery.data ?? []) as any[]
  const funnelMoData = (funnelMoQuery.data ?? []) as any[]
  const funnelPartsData = (funnelPartsQuery.data ?? []) as any[]

  const funnelValueMap = new Map<string, number>()
  for (const r of funnelMoData) {
    const sid = String(r.service_id)
    funnelValueMap.set(sid, (funnelValueMap.get(sid) ?? 0) + (Number(r.labor_price) || 0))
  }
  for (const r of funnelPartsData) {
    const sid = String(r.service_id)
    funnelValueMap.set(sid, (funnelValueMap.get(sid) ?? 0) + ((Number(r.price) * Number(r.qty)) || 0))
  }

  const sumFunnelValue = (svcs: any[]) => svcs.reduce((s: number, sv: any) => s + (funnelValueMap.get(String(sv.id)) ?? 0), 0)

  const cotizaciones = funnelSvcs
  const aprobados = funnelSvcs.filter((s: any) => s.status !== 'invalid')
  const cobrados = funnelSvcs.filter((s: any) => {
    if (!s.paid_at || s.status === 'invalid') return false
    const pd = s.paid_at.slice(0, 10)
    return pd >= desde && pd <= hasta
  })
  const noAprobados = funnelSvcs.filter((s: any) => s.status === 'invalid')

  const totalCotiz = cotizaciones.length
  const pctAprobacion = totalCotiz > 0 ? (aprobados.length / totalCotiz) * 100 : 0
  const pctCobrado = totalCotiz > 0 ? (cobrados.length / totalCotiz) * 100 : 0
  const pctCancelacion = totalCotiz > 0 ? (noAprobados.length / totalCotiz) * 100 : 0

  /* Ticket promedio + Servicios en proceso */
  const ticketPromedio = cobrados.length > 0 ? m.ingresos / cobrados.length : 0
  const ticketMediana = data.ticket_mediana ?? 0
  const enProceso = (funnelSvcsQuery.data ?? []).filter((s: any) => s.status === 'active' && !s.paid_at).length

  /* ── Share state + role ── */
  const PULSO_DASHBOARD_ID = 'e3af77ce-ac39-475d-b040-8626b17f3598'
  const [dashboardRow, userRole] = await Promise.all([
    db.from('dashboards')
      .select('is_public, public_token, public_token_expires_at')
      .eq('id', PULSO_DASHBOARD_ID)
      .single(),
    getUserTenantRole('taller'),
  ])
  const canShare = userRole === 'admin' || userRole === 'editor'
  const shareState = dashboardRow.data
  console.log('userRole:', userRole, 'canShare:', canShare)

  /* ── Export data ── */
  const exportData = {
    periodo: { desde, hasta },
    kpis: {
      flujo_libre: m.flujoLibre,
      ingresos: m.ingresos,
      egresos: m.egresos,
      margen_bruto: margenBruto,
      roi_mano_de_obra: roiMO,
    },
    alertas: {
      cartera_por_cobrar: carteraPorCobrar,
      servicios_sin_cobrar: unpaidCount,
      servicios_activos_mas_3_dias: staleCount,
      mecanicos_roi_bajo: lowRoiMecs.map(mc => ({ nombre: mc.nombre, roi: mc.roi })),
    },
    cotizaciones: {
      total: totalCotiz,
      aprobados: aprobados.length,
      cobrados: cobrados.length,
      no_aprobados: noAprobados.length,
      pct_aprobacion: pctAprobacion,
      pct_cobrado: pctCobrado,
      pct_cancelacion: pctCancelacion,
    },
    tendencia,
    gastos_breakdown: gastosHierarchy.map(g => ({ grupo: g.grupo, monto: g.monto, pct: g.pct })),
  }

  /* ════════════════════════════════════ RENDER ════════════════════════════════════ */

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* Header */}
      <div className="taller-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--taller-ink)', fontFamily: 'var(--taller-font-d)', margin: 0 }}>
            Pulso
          </h1>
          <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] mt-1">Vista ejecutiva del negocio</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Suspense fallback={null}>
            <DateRangePicker desde={desde} hasta={hasta} agg={agg} basePath="/dashboard/taller/pulso" />
          </Suspense>
          {canShare && shareState && (
            <PulsoShareButton
              initialIsPublic={shareState.is_public ?? false}
              initialToken={shareState.public_token ?? null}
            />
          )}
          <PulsoExportButtons data={exportData} canInterpret={canShare} />
        </div>
      </div>

      <div id="pulso-content">
      {/* ═══════ SECCIÓN 1 — ¿Ganamos o perdemos dinero? ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 mb-6">
        {/* Col 1: Card negra — Flujo Libre */}
        <div className="relative rounded-xl p-6 flex flex-col justify-between" style={{ background: 'var(--taller-hero-bg)', color: 'var(--taller-hero-text)', border: '1px solid var(--taller-border)' }}>
          <InfoTooltip corner text={`El taller generó ${fmtMoney(m.ingresos)} en ingresos y gastó ${fmtMoney(m.egresos)} en total. La diferencia de ${fmtMoney(m.flujoLibre)} es el dinero que realmente quedó en caja este período.`} />
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-1">Flujo libre del período</p>
            <div className="leading-none" style={{ fontSize: 38, fontWeight: 600 }}>
              {fmtMoney(m.flujoLibre)}
            </div>
            <p className="text-sm mt-1" style={{ color: m.flujoLibre >= 0 ? '#16a34a' : '#dc2626' }}>
              {m.flujoLibre >= 0 ? 'Utilidad positiva en este período' : 'Pérdida en este período'}
            </p>
          </div>

          <div className="flex gap-8 mt-4">
            <div>
              <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)]">Ingresos</p>
              <p className="text-base font-semibold" style={{ color: '#0070f3' }}>{fmtMoney(m.ingresos)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)]">Egresos</p>
              <p className="text-base font-semibold text-gray-300 dark:text-[var(--taller-muted)]">{fmtMoney(m.egresos)}</p>
            </div>
          </div>

          {pctChange !== null && (
            <p className="text-xs mt-4" style={{ color: pctChange >= 0 ? '#16a34a' : '#dc2626' }}>
              vs período anterior {pctChange >= 0 ? '↑' : '↓'} {Math.abs(pctChange).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Col 2: Margen Bruto */}
        <div className="relative bg-white dark:bg-[var(--taller-surface)] border border-gray-200 dark:border-[var(--taller-border)] rounded-xl p-5 flex flex-col">
          <InfoTooltip corner text={`El taller cobró ${fmtMoney(m.ingresos)}. De ese total, ${fmtMoney(m.costoPartes)} se fueron en refacciones. Lo que sobra — ${fmtMoney(m.ingresos - m.costoPartes)} — representa el ${margenBruto.toFixed(1)}% del ingreso total.`} />
          <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-2">Margen bruto</p>
          <p className="text-3xl font-semibold" style={{ color: margenBruto > 35 ? '#16a34a' : '#dc2626' }}>
            {margenBruto.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] mt-1">Objetivo &gt;35%</p>
          <div className="mt-3 w-full bg-gray-100 dark:bg-[var(--taller-progress-bg)] rounded-full h-1">
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${Math.min(margenBruto, 100)}%`,
                background: margenBruto > 35 ? '#0070f3' : '#dc2626',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mt-3">
            Por cada $100 facturados, quedan ${(margenBruto).toFixed(0)} después de pagar refacciones.
          </p>
        </div>

        {/* Col 3: ROI Mano de Obra */}
        <div className="relative bg-white dark:bg-[var(--taller-surface)] border border-gray-200 dark:border-[var(--taller-border)] rounded-xl p-5 flex flex-col">
          <InfoTooltip corner text={`Se pagaron ${fmtMoney(m.nominaNeta)} en nómina. Esos mecánicos generaron ${fmtMoney(servicios.ingresos_mo)} cobrando mano de obra. Por cada peso pagado, regresaron ${roiMO.toFixed(2)} al taller.`} />
          <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-2">ROI mano de obra</p>
          <p className="text-3xl font-semibold" style={{ color: roiBadgeColor(roiMO) }}>
            {roiMO.toFixed(1)}x
          </p>
          <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] mt-1">Objetivo &gt;2x</p>
          <div className="mt-3 w-full bg-gray-100 dark:bg-[var(--taller-progress-bg)] rounded-full h-1">
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${Math.min((roiMO / 3) * 100, 100)}%`,
                background: roiBadgeColor(roiMO),
              }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mt-3">
            Por cada peso pagado en nómina, el taller generó ${roiMO.toFixed(2)} en mano de obra.
          </p>
        </div>

        {/* Col 4: Ticket promedio */}
        <div className="relative bg-white dark:bg-[var(--taller-surface)] border border-gray-200 dark:border-[var(--taller-border)] rounded-xl p-5 flex flex-col">
          <InfoTooltip corner text={`Se cerraron ${cobrados.length} servicios. Promedio: ${fmtMoney(ticketPromedio)} por servicio. Mediana: ${fmtMoney(ticketMediana)} — el valor del servicio típico sin que los tickets grandes lo inflen.`} />
          <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-2">Ticket promedio</p>
          <p className="text-3xl font-semibold text-gray-900 dark:text-[var(--taller-ink)]">
            {fmtMoney(ticketPromedio)}
          </p>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-xs text-gray-400 dark:text-[var(--taller-muted)]">
              Mediana <span className="text-sm font-semibold" style={{ color: 'var(--taller-ink)' }}>{fmtMoney(ticketMediana)}</span>
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] mt-1">por servicio cobrado</p>
          <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mt-3">
            Promedio de ingreso generado por cada servicio cerrado en el período.
          </p>
        </div>

        {/* Col 5: Servicios en proceso */}
        <div className="relative bg-white dark:bg-[var(--taller-surface)] border border-gray-200 dark:border-[var(--taller-border)] rounded-xl p-5 flex flex-col">
          <InfoTooltip corner text="Estos son servicios con status activo que aún no han sido cobrados. Representan trabajo vivo en el taller en este momento." />
          <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-2">En proceso ahora</p>
          <p className="text-3xl font-semibold" style={{ color: enProceso > 0 ? '#16a34a' : '#9ca3af' }}>
            {enProceso}
          </p>
          <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] mt-1">servicios activos sin cobrar</p>
          <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mt-3">
            Trabajo vivo en el taller en este momento.
          </p>
        </div>
      </div>

      {/* Desglose financiero */}
      <div className="bg-white dark:bg-[var(--taller-surface)] border border-gray-200 dark:border-[var(--taller-border)] rounded-xl p-5 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna INGRESOS */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-3">
              Ingresos <span className="font-semibold" style={{ color: '#0070f3' }}>{fmtMoney(m.ingresos)}</span>
            </p>
            {[
              { label: 'Mano de obra', value: servicios.ingresos_mo },
              { label: 'Refacciones venta', value: servicios.ingresos_partes_cliente },
            ].sort((a, b) => b.value - a.value).map(row => {
              const pct = m.ingresos > 0 ? (row.value / m.ingresos) * 100 : 0
              return (
                <div key={row.label} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-[var(--taller-ink)]">{row.label}</span>
                    <span className="text-xs text-gray-600 dark:text-[var(--taller-ink)]">
                      {fmtMoney(row.value)} <span className="text-gray-400 dark:text-[var(--taller-muted)]">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-[var(--taller-progress-bg)] rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: '#0070f3' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Columna EGRESOS */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-3">
              Egresos <span className="font-semibold" style={{ color: '#dc2626' }}>{fmtMoney(m.egresos)}</span>
            </p>
            {[
              { label: 'Gastos operativos', value: m.totalGastos },
              { label: 'Nómina', value: m.nominaNeta },
              { label: 'Refacciones compra', value: m.costoPartes },
            ].sort((a, b) => b.value - a.value).map(row => {
              const pct = m.ingresos > 0 ? (row.value / m.ingresos) * 100 : 0
              return (
                <div key={row.label} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-[var(--taller-ink)]">{row.label}</span>
                    <span className="text-xs text-gray-600 dark:text-[var(--taller-ink)]">
                      {fmtMoney(row.value)} <span className="text-gray-400 dark:text-[var(--taller-muted)]">({pct.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-[var(--taller-progress-bg)] rounded-full h-2">
                    <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: '#dc2626' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <p className="text-[10px] mt-3" style={{ color: 'var(--taller-muted)' }}>
          <span className="font-semibold">Refacciones venta</span> — refacciones cobradas al cliente por servicio.{' '}
          <span className="font-semibold">Gastos</span> — compras generales del taller (aceite, filtros, consumibles).{' '}
          <span className="font-semibold">Nómina</span> — pagos registrados a mecánicos en el período.
        </p>
      </div>

      {/* ═══════ SECCIÓN 2 — ¿Qué requiere atención hoy? ═══════ */}
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] font-medium mb-1">
          ¿Qué requiere atención hoy?
        </h2>
        <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mb-4">
          Estas son las 3 cosas que puedes resolver hoy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Listo sin cobrar */}
          <div
            className="rounded-xl p-5 border"
            style={{
              background: carteraPorCobrar > 0 ? 'var(--error-bg)' : 'var(--success-bg)',
              borderColor: carteraPorCobrar > 0 ? 'var(--error-border)' : 'var(--success-border)',
            }}
          >
            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-2">Listo sin cobrar</p>
            <p className="text-2xl font-semibold" style={{ color: carteraPorCobrar > 0 ? '#dc2626' : '#16a34a' }}>
              {fmtMoney(carteraPorCobrar)}
            </p>
            <p className="text-xs text-gray-500 dark:text-[var(--taller-muted)] mt-1">
              {unpaidCount} servicio{unpaidCount !== 1 ? 's' : ''} terminado{unpaidCount !== 1 ? 's' : ''} · pendientes de pago
            </p>
            <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mt-2">
              {`${fmtMoney(carteraPorCobrar)} — ${unpaidCount} servicio${unpaidCount !== 1 ? 's' : ''} entregado${unpaidCount !== 1 ? 's' : ''} al cliente, pero aún sin pago. El dinero ya está ganado, solo falta cobrarlo.`}
            </p>
          </div>

          {/* Card 2: Servicios activos +3 días */}
          <div
            className="rounded-xl p-5 border"
            style={{
              background: staleCount > 0 ? 'var(--warning-bg)' : 'var(--success-bg)',
              borderColor: staleCount > 0 ? 'var(--warning-border)' : 'var(--success-border)',
            }}
          >
            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-2">Servicios activos +3 días</p>
            <p className="text-2xl font-semibold" style={{ color: staleCount > 0 ? '#d97706' : '#16a34a' }}>
              {staleCount}
            </p>
            <p className="text-xs text-gray-500 dark:text-[var(--taller-muted)] mt-1">Llevan más de 72hrs abiertos</p>
            <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mt-2">
              ¿Falta una refacción? ¿O se puede cerrar hoy?
            </p>
          </div>

          {/* Card 3: Mecánicos con ROI <1.5x */}
          <div
            className="rounded-xl p-5 border"
            style={{
              background: lowRoiMecs.length > 0 ? 'var(--error-bg)' : 'var(--success-bg)',
              borderColor: lowRoiMecs.length > 0 ? 'var(--error-border)' : 'var(--success-border)',
            }}
          >
            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-2">Mecánicos con ROI &lt;1.5x</p>
            <p className="text-2xl font-semibold" style={{ color: lowRoiMecs.length > 0 ? '#dc2626' : '#16a34a' }}>
              {lowRoiMecs.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-[var(--taller-muted)] mt-1">
              {lowRoiMecs.length > 0
                ? lowRoiMecs.map(mc => mc.nombre.split(' ')[0]).join(', ')
                : 'Todo el equipo es rentable'}
            </p>
            {lowRoiMecs.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mt-2">Todos generan más de lo que cuestan.</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ SECCIÓN 3 — ¿Cuánto del trabajo se cobró? ═══════ */}
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] font-medium mb-1">
          ¿Cuánto del trabajo se cobró?
        </h2>
        <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mb-4">
          El embudo revela dónde se pierde valor antes de que sea dinero.
        </p>

        <div className="bg-white dark:bg-[var(--taller-surface)] border border-gray-200 dark:border-[var(--taller-border)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4">
            {/* Cotizaciones */}
            <div className="p-5">
              <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-3">Cotizaciones</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-[var(--taller-ink)]">{cotizaciones.length}</p>
              <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] mt-1">{fmtMoney(sumFunnelValue(cotizaciones))}</p>
              <span className="inline-block mt-3 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[var(--taller-progress-bg)] text-xs text-gray-500 dark:text-[var(--taller-muted)]">
                punto de partida
              </span>
            </div>

            {/* Aprobados */}
            <div className="p-5 border-l border-gray-200 dark:border-[var(--taller-border)] relative">
              <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 bg-white dark:bg-[var(--taller-surface)] px-1 text-gray-300 dark:text-[var(--taller-muted)] text-sm hidden md:block">→</span>
              <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-3">Aprobados</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-[var(--taller-ink)]">{aprobados.length}</p>
              <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] mt-1">{fmtMoney(sumFunnelValue(aprobados))}</p>
              <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--taller-blue-l)', color: '#0070f3' }}>
                {pctAprobacion.toFixed(0)}% aprobación
              </span>
            </div>

            {/* Cobrados */}
            <div className="p-5 border-l border-gray-200 dark:border-[var(--taller-border)] relative">
              <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 bg-white dark:bg-[var(--taller-surface)] px-1 text-gray-300 dark:text-[var(--taller-muted)] text-sm hidden md:block">→</span>
              <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-3">Cobrados</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-[var(--taller-ink)]">{cobrados.length}</p>
              <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] mt-1">{fmtMoney(sumFunnelValue(cobrados))}</p>
              <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--success-bg)', color: '#16a34a' }}>
                {pctCobrado.toFixed(0)}% cobrado
              </span>
            </div>

            {/* No aprobados */}
            <div className="p-5 border-l border-gray-200 dark:border-[var(--taller-border)]">
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: '#dc2626' }}>No aprobados</p>
              <p className="text-2xl font-semibold" style={{ color: '#dc2626' }}>{noAprobados.length}</p>
              <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{fmtMoney(sumFunnelValue(noAprobados))}</p>
              <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--error-bg)', color: '#dc2626' }}>
                {pctCancelacion.toFixed(0)}% cancelación
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ SECCIÓN 4 — ¿La tendencia sube o baja? ═══════ */}
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] font-medium mb-1">
          ¿La tendencia sube o baja?
        </h2>
        <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mb-4">
          Visualiza la salud financiera del taller a lo largo del tiempo.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
          {/* Col 1: Tendencia */}
          <div className="bg-white dark:bg-[var(--taller-surface)] border border-gray-200 dark:border-[var(--taller-border)] rounded-xl p-5">
            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-1">Tendencia del período</p>
            <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] mb-3">
              Ingresos · Egresos · Flujo libre — por {agg === 'dia' ? 'día' : agg}
            </p>
            <PulsoTendencia data={tendencia} hideLegend />
            {/* Leyenda manual */}
            <div className="flex gap-5 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded-full" style={{ background: 'var(--taller-ink)' }} />
                <span className="text-xs text-gray-400 dark:text-[var(--taller-muted)]">Ingresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded-full border-t border-dashed" style={{ borderColor: 'var(--taller-muted)' }} />
                <span className="text-xs text-gray-400 dark:text-[var(--taller-muted)]">Egresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded-full" style={{ background: '#2d6a4f' }} />
                <span className="text-xs text-gray-400 dark:text-[var(--taller-muted)]">Flujo libre</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mt-3">
              Si las líneas se cruzan, el taller opera en pérdida ese día.
            </p>
          </div>

          {/* Col 2: ¿En qué se va el dinero? */}
          <div className="bg-white dark:bg-[var(--taller-surface)] border border-gray-200 dark:border-[var(--taller-border)] rounded-xl p-5 overflow-auto">
            <p className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] mb-1">¿En qué se va el dinero?</p>
            <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] mb-4">Gastos como % de ingresos</p>

            <div className="flex flex-col gap-4">
              {gastosHierarchy.map(g => (
                <div key={g.grupo}>
                  {/* Group header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex-1 text-xs font-semibold uppercase tracking-wide text-gray-900 dark:text-[var(--taller-ink)]">
                      {g.grupo}
                    </span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-[var(--taller-ink)] whitespace-nowrap">
                      {g.pct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-400 dark:text-[var(--taller-muted)] whitespace-nowrap min-w-[70px] text-right">
                      {fmtMoney(g.monto)}
                    </span>
                  </div>
                  <div className="bg-gray-100 dark:bg-[var(--taller-progress-bg)] rounded h-[3px] mb-2">
                    <div
                      className="rounded h-[3px]"
                      style={{ background: '#dc2626', width: `${Math.min(g.pct, 100)}%` }}
                    />
                  </div>
                  {/* Category rows */}
                  {g.categorias.map(c => {
                    const catPct = m.ingresos > 0 ? (c.total / m.ingresos) * 100 : 0
                    return (
                      <div key={c.categoria} className="pl-4 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="flex-1 text-xs text-gray-400 dark:text-[var(--taller-muted)]">{c.categoria}</span>
                          <span className="text-xs text-gray-400 dark:text-[var(--taller-muted)] whitespace-nowrap min-w-[70px] text-right">
                            {fmtMoney(c.total)}
                          </span>
                        </div>
                        <div className="bg-gray-100 dark:bg-[var(--taller-progress-bg)] rounded h-[2px] mt-0.5">
                          <div
                            className="rounded h-[2px]"
                            style={{ background: 'rgba(220,38,38,0.4)', width: `${Math.min(catPct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ SECCIÓN 5 — ¿Los costos son estructuralmente sanos? ═══════ */}
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] font-medium mb-1">
          ¿Los costos son estructuralmente sanos?
        </h2>
        <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mb-4">
          Si los costos superan el 65% de los ingresos, el margen se comprime estructuralmente.
        </p>

        <div className="bg-white dark:bg-[var(--taller-surface)] border border-gray-200 dark:border-[var(--taller-border)] rounded-xl overflow-hidden">
          <div className="taller-table-wrap">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    Categoría
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)] w-[30%]">
                    &nbsp;
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    % ingreso
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    Objetivo
                  </th>
                </tr>
              </thead>
              <tbody>
                {costRows.map(row => {
                  const pct = m.ingresos > 0 ? (row.value / m.ingresos) * 100 : 0
                  const color = costColor(pct, row.target)
                  return (
                    <tr key={row.name}>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-[var(--taller-ink)] border-b border-gray-100 dark:border-[var(--taller-border)]/50">{row.name}</td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-[var(--taller-ink)] text-right border-b border-gray-100 dark:border-[var(--taller-border)]/50">
                        {fmtMoney(row.value)}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 dark:border-[var(--taller-border)]/50">
                        <div className="bg-gray-100 dark:bg-[var(--taller-progress-bg)] rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%`, background: color }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-semibold border-b border-gray-100 dark:border-[var(--taller-border)]/50" style={{ color }}>
                        {pct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-[var(--taller-muted)] text-right border-b border-gray-100 dark:border-[var(--taller-border)]/50">
                        &lt;{row.target}%
                      </td>
                    </tr>
                  )
                })}
                {/* Total row */}
                <tr>
                  <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-[var(--taller-ink)] border-t-2 border-gray-300 dark:border-[var(--taller-border)]">Total costos</td>
                  <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-[var(--taller-ink)] text-right border-t-2 border-gray-300 dark:border-[var(--taller-border)]">
                    {fmtMoney(totalCostValue)}
                  </td>
                  <td className="px-4 py-3 border-t-2 border-gray-300 dark:border-[var(--taller-border)]">
                    <div className="bg-gray-100 dark:bg-[var(--taller-progress-bg)] rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(totalCostPct, 100)}%`,
                          background: costColor(totalCostPct, 65),
                        }}
                      />
                    </div>
                  </td>
                  <td
                    className="px-4 py-3 text-xs text-right font-bold border-t-2 border-gray-300 dark:border-[var(--taller-border)]"
                    style={{ color: costColor(totalCostPct, 65) }}
                  >
                    {totalCostPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 dark:text-[var(--taller-muted)] text-right border-t-2 border-gray-300 dark:border-[var(--taller-border)]">
                    &lt;65%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════ SECCIÓN 6 — ¿Cada mecánico genera más de lo que cuesta? ═══════ */}
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest text-gray-400 dark:text-[var(--taller-muted)] font-medium mb-1">
          ¿Cada mecánico genera más de lo que cuesta?
        </h2>
        <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mb-4">
          El equipo es el negocio. Si un mecánico no es rentable, hay que actuar.
        </p>

        <div className="bg-white dark:bg-[var(--taller-surface)] border border-gray-200 dark:border-[var(--taller-border)] rounded-xl overflow-hidden">
          <div className="taller-table-wrap">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    Mecánico
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    Servicios
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    MO generada
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    Comisión
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    Sueldo
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    Costo total
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    Utilidad
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-[var(--taller-muted)] border-b-2 border-gray-200 dark:border-[var(--taller-border)]">
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody>
                {mecanicos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-xs text-gray-400 dark:text-[var(--taller-muted)]">
                      Sin datos de mecánicos en este período
                    </td>
                  </tr>
                )}
                {mecanicos.map(mec => (
                  <tr key={mec.nombre}>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-[var(--taller-ink)] border-b border-gray-100 dark:border-[var(--taller-border)]/50">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0"
                          style={{ background: mec.color }}
                        >
                          {mec.iniciales}
                        </div>
                        {mec.nombre}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-[var(--taller-ink)] text-right border-b border-gray-100 dark:border-[var(--taller-border)]/50">
                      {mec.servicios}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-[var(--taller-ink)] text-right border-b border-gray-100 dark:border-[var(--taller-border)]/50">
                      {fmtMoney(mec.mo)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-[var(--taller-ink)] text-right border-b border-gray-100 dark:border-[var(--taller-border)]/50">
                      {fmtMoney(mec.comisiones)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-[var(--taller-ink)] text-right border-b border-gray-100 dark:border-[var(--taller-border)]/50">
                      {fmtMoney(mec.sueldo)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-900 dark:text-[var(--taller-ink)] text-right border-b border-gray-100 dark:border-[var(--taller-border)]/50">
                      {fmtMoney(mec.costoTotal)}
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-semibold border-b border-gray-100 dark:border-[var(--taller-border)]/50" style={{ color: '#0070f3' }}>
                      {fmtMoney(mec.utilidad)}
                    </td>
                    <td className="px-4 py-3 text-right border-b border-gray-100 dark:border-[var(--taller-border)]/50">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white"
                        style={{ background: roiBadgeColor(mec.roi) }}
                      >
                        {mec.roi.toFixed(1)}x
                      </span>
                    </td>
                  </tr>
                ))}
                {mecanicos.length > 0 && (
                  <tr>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-[var(--taller-ink)] border-t-2 border-gray-300 dark:border-[var(--taller-border)]">Total</td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-[var(--taller-ink)] text-right border-t-2 border-gray-300 dark:border-[var(--taller-border)]">
                      {totMec.servicios}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-[var(--taller-ink)] text-right border-t-2 border-gray-300 dark:border-[var(--taller-border)]">
                      {fmtMoney(totMec.mo)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-[var(--taller-ink)] text-right border-t-2 border-gray-300 dark:border-[var(--taller-border)]">
                      {fmtMoney(totMec.comisiones)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-[var(--taller-ink)] text-right border-t-2 border-gray-300 dark:border-[var(--taller-border)]">
                      {fmtMoney(totMec.sueldo)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-[var(--taller-ink)] text-right border-t-2 border-gray-300 dark:border-[var(--taller-border)]">
                      {fmtMoney(totMec.costoTotal)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-right border-t-2 border-gray-300 dark:border-[var(--taller-border)]" style={{ color: '#0070f3' }}>
                      {fmtMoney(totMec.utilidad)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-gray-900 dark:text-[var(--taller-ink)] text-right border-t-2 border-gray-300 dark:border-[var(--taller-border)]">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white"
                        style={{ background: roiBadgeColor(totRoi) }}
                      >
                        {totRoi.toFixed(1)}x
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-[var(--taller-muted)] italic mt-3">
          ROI = MO generada ÷ costo total. Un mecánico con ROI &lt;1.5x necesita más servicios o menor costo.
        </p>
      </div>
      </div>{/* /pulso-content */}
    </div>
  )
}
