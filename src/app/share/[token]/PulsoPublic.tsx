import { getTallerData, getTenantClientAdmin } from '@/app/dashboard/(tenants)/taller/queries/queries'
import type { Agg, TallerData } from '@/app/dashboard/(tenants)/taller/types'
import PulsoTendencia from '@/app/dashboard/(tenants)/taller/components/charts/PulsoTendencia'
import { fmtMoney } from '@/app/dashboard/(tenants)/taller/components/utils'
import {
  ROI_EXCELLENT,
  ROI_MO_SCALE,
  COST_TARGETS,
  TOTAL_COST_TARGET,
  GROSS_MARGIN_TARGET,
  STALE_SERVICE_DAYS,
  LOW_MECHANIC_ROI,
  roiBadgeColor,
  costColor,
} from '@/app/dashboard/(tenants)/taller/queries/thresholds'

/* ── Helpers (same as pulso/page.tsx) ── */

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

/* ── Taller CSS variables (inlined since .taller-shell is not present) ── */
const tallerVars: React.CSSProperties & Record<string, string> = {
  '--taller-bg': '#f4f2ed',
  '--taller-surface': '#ffffff',
  '--taller-border': '#e5e1d8',
  '--taller-ink': '#1a1814',
  '--taller-green': '#2d6a4f',
  '--taller-red': '#c94a4a',
  '--taller-amber': '#c9942a',
  '--taller-blue': '#0070f3',
  '--taller-blue-l': '#eff6ff',
  '--taller-blue-m': '#3b82f6',
  '--taller-muted': '#97928a',
  '--taller-progress-bg': '#f0ece4',
  '--taller-hero-bg': '#111111',
  '--taller-hero-text': '#ffffff',
} as any

/* ── Component ── */

export default async function PulsoPublic() {
  const agg: Agg = 'dia'
  const { desde, hasta } = defaultDates()
  const prev = getPreviousPeriod(desde, hasta)

  const db = await getTenantClientAdmin()

  const [currentResult, prevResult] = await Promise.allSettled([
    getTallerData(desde, hasta, agg, db),
    getTallerData(prev.desde, prev.hasta, agg, db),
  ])

  if (currentResult.status === 'rejected') {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
        No se pudieron cargar los datos
      </div>
    )
  }

  const data = currentResult.value
  const prevData = prevResult.status === 'fulfilled' ? prevResult.value : null

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

  /* Gastos jerárquicos */
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
    { name: 'Operación', value: gastosGrouped.get('Operación') ?? 0, target: COST_TARGETS.Operación },
    { name: 'Nómina', value: m.nominaNeta, target: COST_TARGETS.Nómina },
    { name: 'Local', value: gastosGrouped.get('Local') ?? 0, target: COST_TARGETS.Local },
    { name: 'Personal', value: gastosGrouped.get('Personal') ?? 0, target: COST_TARGETS.Personal },
    { name: 'Administración', value: gastosGrouped.get('Administración') ?? 0, target: COST_TARGETS.Administración },
  ]
  const totalCostValue = costRows.reduce((s, r) => s + r.value, 0)
  const totalCostPct = m.ingresos > 0 ? (totalCostValue / m.ingresos) * 100 : 0

  /* ── ROI por mecánico ── */
  const threeDaysAgo = new Date(Date.now() - STALE_SERVICE_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const [moQuery, swQuery, spQuery, payrollQuery, empleadosQuery, unpaidSvcsQuery, unpaidMoQuery, unpaidPartsQuery, staleSvcsQuery, funnelSvcsQuery, funnelMoQuery, funnelPartsQuery] = await Promise.all([
    db.from('service_jobs')
      .select('employee_id, service_id, labor_price, services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),
    db.from('service_workers')
      .select('employee_id, service_id, services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),
    db.from('service_parts')
      .select('service_id, price, qty, services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),
    db.from('payroll')
      .select('employee_id, base_salary, total_commission')
      .eq('is_paid', true)
      .gte('week_start', desde)
      .lte('week_end', hasta),
    db.from('employees')
      .select('id, name, last_name, color, initials, role')
      .eq('is_active', true),
    db.from('services').select('id')
      .is('paid_at', null).neq('status', 'invalid').eq('work_completed', true),
    db.from('service_jobs').select('labor_price, services!inner(status)')
      .is('services.paid_at', null).neq('services.status', 'invalid')
      .eq('services.work_completed', true),
    db.from('service_parts').select('price, qty, services!inner(status)')
      .is('services.paid_at', null).neq('services.status', 'invalid')
      .eq('services.work_completed', true),
    db.from('services').select('id')
      .eq('status', 'active').is('paid_at', null).lt('created_at', threeDaysAgo),
    db.from('services').select('id, status, paid_at')
      .gte('created_at', desde).lte('created_at', hasta + 'T23:59:59'),
    db.from('service_jobs').select('service_id, labor_price, services!inner(created_at)')
      .gte('services.created_at', desde).lte('services.created_at', hasta + 'T23:59:59'),
    db.from('service_parts').select('service_id, price, qty, services!inner(created_at)')
      .gte('services.created_at', desde).lte('services.created_at', hasta + 'T23:59:59'),
  ])

  // MO por service_id
  const moPerService = new Map<string, number>()
  for (const row of (moQuery.data ?? []) as any[]) {
    const sid = String(row.service_id)
    moPerService.set(sid, (moPerService.get(sid) ?? 0) + (Number(row.labor_price) || 0))
  }

  // Servicios por employee_id
  const svcMap = new Map<string, Set<string>>()
  for (const row of (swQuery.data ?? []) as any[]) {
    const eid = String(row.employee_id)
    const s = svcMap.get(eid) ?? new Set<string>()
    s.add(String(row.service_id))
    svcMap.set(eid, s)
  }

  // MO por employee_id
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

  // Nómina por employee_id
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
    .filter(emp => emp.role !== 'admin')
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
  const lowRoiMecs = mecanicos.filter(mc => mc.costoTotal > 0 && mc.roi < LOW_MECHANIC_ROI)

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

  /* Date range label */
  const desdeLabel = new Date(desde + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
  const hastaLabel = new Date(hasta + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

  /* ════════════════════════════════════ RENDER ════════════════════════════════════ */

  return (
    <div style={{ fontFamily: "'IBM Plex Mono', monospace", maxWidth: 1200, margin: '0 auto', padding: '48px 24px', ...tallerVars }}>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* Header — read-only, no interactive controls */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--taller-ink)', fontFamily: "'Lora', serif", margin: 0 }}>
          Pulso
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--taller-muted)' }}>
          Vista ejecutiva del negocio &middot; {desdeLabel} — {hastaLabel}
        </p>
      </div>

      {/* ═══════ SECCIÓN 1 — ¿Ganamos o perdemos dinero? ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr_1fr] gap-4 mb-6">
        {/* Col 1: Card negra — Flujo Libre */}
        <div className="rounded-xl p-6 flex flex-col justify-between" style={{ background: 'var(--taller-hero-bg)', color: 'var(--taller-hero-text)', border: '1px solid var(--taller-border)' }}>
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--taller-muted)' }}>Flujo libre del período</p>
            <div className="leading-none" style={{ fontSize: 38, fontWeight: 600 }}>
              {fmtMoney(m.flujoLibre)}
            </div>
            <p className="text-sm mt-1" style={{ color: m.flujoLibre >= 0 ? '#16a34a' : '#dc2626' }}>
              {m.flujoLibre >= 0 ? 'Utilidad positiva en este período' : 'Pérdida en este período'}
            </p>
          </div>

          <div className="flex gap-8 mt-4">
            <div>
              <p className="text-xs" style={{ color: 'var(--taller-muted)' }}>Ingresos</p>
              <p className="text-base font-semibold" style={{ color: '#0070f3' }}>{fmtMoney(m.ingresos)}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--taller-muted)' }}>Egresos</p>
              <p className="text-base font-semibold" style={{ color: 'var(--taller-muted)' }}>{fmtMoney(m.egresos)}</p>
            </div>
          </div>

          {pctChange !== null && (
            <p className="text-xs mt-4" style={{ color: pctChange >= 0 ? '#16a34a' : '#dc2626' }}>
              vs período anterior {pctChange >= 0 ? '↑' : '↓'} {Math.abs(pctChange).toFixed(1)}%
            </p>
          )}
        </div>

        {/* Col 2: Margen Bruto */}
        <div className="rounded-xl p-5 flex flex-col" style={{ background: 'var(--taller-surface)', border: '1px solid var(--taller-border)' }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--taller-muted)' }}>Margen bruto</p>
          <p className="text-3xl font-semibold" style={{ color: margenBruto > GROSS_MARGIN_TARGET ? '#16a34a' : '#dc2626' }}>
            {margenBruto.toFixed(1)}%
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--taller-muted)' }}>Objetivo &gt;{GROSS_MARGIN_TARGET}%</p>
          <div className="mt-3 w-full rounded-full h-1" style={{ background: 'var(--taller-progress-bg)' }}>
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${Math.min(margenBruto, 100)}%`,
                background: margenBruto > GROSS_MARGIN_TARGET ? '#0070f3' : '#dc2626',
              }}
            />
          </div>
          <p className="text-xs italic mt-3" style={{ color: 'var(--taller-muted)' }}>
            Por cada $100 facturados, quedan ${(margenBruto).toFixed(0)} después de pagar refacciones.
          </p>
        </div>

        {/* Col 3: ROI Mano de Obra */}
        <div className="rounded-xl p-5 flex flex-col" style={{ background: 'var(--taller-surface)', border: '1px solid var(--taller-border)' }}>
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--taller-muted)' }}>ROI mano de obra</p>
          <p className="text-3xl font-semibold" style={{ color: roiBadgeColor(roiMO) }}>
            {roiMO.toFixed(1)}x
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--taller-muted)' }}>Objetivo &gt;{ROI_EXCELLENT}x</p>
          <div className="mt-3 w-full rounded-full h-1" style={{ background: 'var(--taller-progress-bg)' }}>
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${Math.min((roiMO / ROI_MO_SCALE) * 100, 100)}%`,
                background: roiBadgeColor(roiMO),
              }}
            />
          </div>
          <p className="text-xs italic mt-3" style={{ color: 'var(--taller-muted)' }}>
            Por cada peso pagado en nómina, el taller generó ${roiMO.toFixed(2)} en mano de obra.
          </p>
        </div>
      </div>

      {/* ═══════ SECCIÓN 2 — ¿Qué requiere atención hoy? ═══════ */}
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: 'var(--taller-muted)' }}>
          ¿Qué requiere atención hoy?
        </h2>
        <p className="text-xs italic mb-4" style={{ color: 'var(--taller-muted)' }}>
          Estas son las 3 cosas que puedes resolver hoy.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className="rounded-xl p-5 border"
            style={{
              background: carteraPorCobrar > 0 ? 'var(--error-bg)' : 'var(--success-bg)',
              borderColor: carteraPorCobrar > 0 ? 'var(--error-border)' : 'var(--success-border)',
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--taller-muted)' }}>Listo sin cobrar</p>
            <p className="text-2xl font-semibold" style={{ color: carteraPorCobrar > 0 ? '#dc2626' : '#16a34a' }}>
              {fmtMoney(carteraPorCobrar)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--taller-muted)' }}>
              {unpaidCount} servicio{unpaidCount !== 1 ? 's' : ''} terminado{unpaidCount !== 1 ? 's' : ''} · pendientes de pago
            </p>
            <p className="text-xs italic mt-2" style={{ color: 'var(--taller-muted)' }}>
              Trabajo entregado que no ha entrado al banco. El cliente ya tiene el carro.
            </p>
          </div>

          <div
            className="rounded-xl p-5 border"
            style={{
              background: staleCount > 0 ? 'var(--warning-bg)' : 'var(--success-bg)',
              borderColor: staleCount > 0 ? 'var(--warning-border)' : 'var(--success-border)',
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--taller-muted)' }}>Servicios activos +{STALE_SERVICE_DAYS} días</p>
            <p className="text-2xl font-semibold" style={{ color: staleCount > 0 ? '#d97706' : '#16a34a' }}>
              {staleCount}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--taller-muted)' }}>Llevan más de {STALE_SERVICE_DAYS * 24}hrs abiertos</p>
            <p className="text-xs italic mt-2" style={{ color: 'var(--taller-muted)' }}>
              ¿Falta una refacción? ¿O se puede cerrar hoy?
            </p>
          </div>

          <div
            className="rounded-xl p-5 border"
            style={{
              background: lowRoiMecs.length > 0 ? 'var(--error-bg)' : 'var(--success-bg)',
              borderColor: lowRoiMecs.length > 0 ? 'var(--error-border)' : 'var(--success-border)',
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--taller-muted)' }}>Mecánicos con ROI &lt;{LOW_MECHANIC_ROI}x</p>
            <p className="text-2xl font-semibold" style={{ color: lowRoiMecs.length > 0 ? '#dc2626' : '#16a34a' }}>
              {lowRoiMecs.length}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--taller-muted)' }}>
              {lowRoiMecs.length > 0
                ? lowRoiMecs.map(mc => mc.nombre.split(' ')[0]).join(', ')
                : 'Todo el equipo es rentable'}
            </p>
            {lowRoiMecs.length === 0 && (
              <p className="text-xs italic mt-2" style={{ color: 'var(--taller-muted)' }}>Todos generan más de lo que cuestan.</p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════ SECCIÓN 3 — ¿Cuánto del trabajo se cobró? ═══════ */}
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: 'var(--taller-muted)' }}>
          ¿Cuánto del trabajo se cobró?
        </h2>
        <p className="text-xs italic mb-4" style={{ color: 'var(--taller-muted)' }}>
          El embudo revela dónde se pierde valor antes de que sea dinero.
        </p>

        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--taller-surface)', border: '1px solid var(--taller-border)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4">
            <div className="p-5">
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--taller-muted)' }}>Cotizaciones</p>
              <p className="text-2xl font-semibold" style={{ color: 'var(--taller-ink)' }}>{cotizaciones.length}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--taller-muted)' }}>{fmtMoney(sumFunnelValue(cotizaciones))}</p>
              <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--taller-progress-bg)', color: 'var(--taller-muted)' }}>
                punto de partida
              </span>
            </div>

            <div className="p-5 relative" style={{ borderLeft: '1px solid var(--taller-border)' }}>
              <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 px-1 text-sm hidden md:block" style={{ background: 'var(--taller-surface)', color: 'var(--taller-muted)' }}>→</span>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--taller-muted)' }}>Aprobados</p>
              <p className="text-2xl font-semibold" style={{ color: 'var(--taller-ink)' }}>{aprobados.length}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--taller-muted)' }}>{fmtMoney(sumFunnelValue(aprobados))}</p>
              <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--taller-blue-l)', color: '#0070f3' }}>
                {pctAprobacion.toFixed(0)}% aprobación
              </span>
            </div>

            <div className="p-5 relative" style={{ borderLeft: '1px solid var(--taller-border)' }}>
              <span className="absolute -left-2.5 top-1/2 -translate-y-1/2 px-1 text-sm hidden md:block" style={{ background: 'var(--taller-surface)', color: 'var(--taller-muted)' }}>→</span>
              <p className="text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--taller-muted)' }}>Cobrados</p>
              <p className="text-2xl font-semibold" style={{ color: 'var(--taller-ink)' }}>{cobrados.length}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--taller-muted)' }}>{fmtMoney(sumFunnelValue(cobrados))}</p>
              <span className="inline-block mt-3 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--success-bg)', color: '#16a34a' }}>
                {pctCobrado.toFixed(0)}% cobrado
              </span>
            </div>

            <div className="p-5" style={{ borderLeft: '1px solid var(--taller-border)' }}>
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
        <h2 className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: 'var(--taller-muted)' }}>
          ¿La tendencia sube o baja?
        </h2>
        <p className="text-xs italic mb-4" style={{ color: 'var(--taller-muted)' }}>
          Visualiza la salud financiera del taller a lo largo del tiempo.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
          {/* Col 1: Tendencia */}
          <div className="rounded-xl p-5" style={{ background: 'var(--taller-surface)', border: '1px solid var(--taller-border)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--taller-muted)' }}>Tendencia del período</p>
            <p className="text-xs mb-3" style={{ color: 'var(--taller-muted)' }}>
              Ingresos · Egresos · Flujo libre — por día
            </p>
            <PulsoTendencia data={tendencia} hideLegend />
            <div className="flex gap-5 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded-full" style={{ background: 'var(--taller-ink)' }} />
                <span className="text-xs" style={{ color: 'var(--taller-muted)' }}>Ingresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded-full border-t border-dashed" style={{ borderColor: 'var(--taller-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--taller-muted)' }}>Egresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-0.5 rounded-full" style={{ background: '#2d6a4f' }} />
                <span className="text-xs" style={{ color: 'var(--taller-muted)' }}>Flujo libre</span>
              </div>
            </div>
            <p className="text-xs italic mt-3" style={{ color: 'var(--taller-muted)' }}>
              Si las líneas se cruzan, el taller opera en pérdida ese día.
            </p>
          </div>

          {/* Col 2: ¿En qué se va el dinero? */}
          <div className="rounded-xl p-5 overflow-auto" style={{ background: 'var(--taller-surface)', border: '1px solid var(--taller-border)' }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--taller-muted)' }}>¿En qué se va el dinero?</p>
            <p className="text-xs mb-4" style={{ color: 'var(--taller-muted)' }}>Gastos como % de ingresos</p>

            <div className="flex flex-col gap-4">
              {gastosHierarchy.map(g => (
                <div key={g.grupo}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--taller-ink)' }}>
                      {g.grupo}
                    </span>
                    <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--taller-ink)' }}>
                      {g.pct.toFixed(1)}%
                    </span>
                    <span className="text-xs whitespace-nowrap min-w-[70px] text-right" style={{ color: 'var(--taller-muted)' }}>
                      {fmtMoney(g.monto)}
                    </span>
                  </div>
                  <div className="rounded h-[3px] mb-2" style={{ background: 'var(--taller-progress-bg)' }}>
                    <div
                      className="rounded h-[3px]"
                      style={{ background: '#dc2626', width: `${Math.min(g.pct, 100)}%` }}
                    />
                  </div>
                  {g.categorias.map(c => {
                    const catPct = m.ingresos > 0 ? (c.total / m.ingresos) * 100 : 0
                    return (
                      <div key={c.categoria} className="pl-4 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="flex-1 text-xs" style={{ color: 'var(--taller-muted)' }}>{c.categoria}</span>
                          <span className="text-xs whitespace-nowrap min-w-[70px] text-right" style={{ color: 'var(--taller-muted)' }}>
                            {fmtMoney(c.total)}
                          </span>
                        </div>
                        <div className="rounded h-[2px] mt-0.5" style={{ background: 'var(--taller-progress-bg)' }}>
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
        <h2 className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: 'var(--taller-muted)' }}>
          ¿Los costos son estructuralmente sanos?
        </h2>
        <p className="text-xs italic mb-4" style={{ color: 'var(--taller-muted)' }}>
          Si los costos superan el {TOTAL_COST_TARGET}% de los ingresos, el margen se comprime estructuralmente.
        </p>

        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--taller-surface)', border: '1px solid var(--taller-border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    Categoría
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    Monto
                  </th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide w-[30%]" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    &nbsp;
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    % ingreso
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
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
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--taller-ink)', borderBottom: '1px solid var(--taller-border)' }}>{row.name}</td>
                      <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--taller-ink)', borderBottom: '1px solid var(--taller-border)' }}>
                        {fmtMoney(row.value)}
                      </td>
                      <td className="px-4 py-3" style={{ borderBottom: '1px solid var(--taller-border)' }}>
                        <div className="rounded-full h-2" style={{ background: 'var(--taller-progress-bg)' }}>
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(pct, 100)}%`, background: color }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-right font-semibold" style={{ color, borderBottom: '1px solid var(--taller-border)' }}>
                        {pct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--taller-muted)', borderBottom: '1px solid var(--taller-border)' }}>
                        &lt;{row.target}%
                      </td>
                    </tr>
                  )
                })}
                <tr>
                  <td className="px-4 py-3 text-xs font-bold" style={{ color: 'var(--taller-ink)', borderTop: '2px solid var(--taller-border)' }}>Total costos</td>
                  <td className="px-4 py-3 text-xs font-bold text-right" style={{ color: 'var(--taller-ink)', borderTop: '2px solid var(--taller-border)' }}>
                    {fmtMoney(totalCostValue)}
                  </td>
                  <td className="px-4 py-3" style={{ borderTop: '2px solid var(--taller-border)' }}>
                    <div className="rounded-full h-2" style={{ background: 'var(--taller-progress-bg)' }}>
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min(totalCostPct, 100)}%`,
                          background: costColor(totalCostPct, TOTAL_COST_TARGET),
                        }}
                      />
                    </div>
                  </td>
                  <td
                    className="px-4 py-3 text-xs text-right font-bold"
                    style={{ color: costColor(totalCostPct, TOTAL_COST_TARGET), borderTop: '2px solid var(--taller-border)' }}
                  >
                    {totalCostPct.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--taller-muted)', borderTop: '2px solid var(--taller-border)' }}>
                    &lt;{TOTAL_COST_TARGET}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════ SECCIÓN 6 — ¿Cada mecánico genera más de lo que cuesta? ═══════ */}
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest font-medium mb-1" style={{ color: 'var(--taller-muted)' }}>
          ¿Cada mecánico genera más de lo que cuesta?
        </h2>
        <p className="text-xs italic mb-4" style={{ color: 'var(--taller-muted)' }}>
          El equipo es el negocio. Si un mecánico no es rentable, hay que actuar.
        </p>

        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--taller-surface)', border: '1px solid var(--taller-border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    Mecánico
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    Servicios
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    MO generada
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    Comisión
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    Sueldo
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    Costo total
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    Utilidad
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--taller-muted)', borderBottom: '2px solid var(--taller-border)' }}>
                    ROI
                  </th>
                </tr>
              </thead>
              <tbody>
                {mecanicos.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-xs" style={{ color: 'var(--taller-muted)' }}>
                      Sin datos de mecánicos en este período
                    </td>
                  </tr>
                )}
                {mecanicos.map(mec => (
                  <tr key={mec.nombre}>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--taller-ink)', borderBottom: '1px solid var(--taller-border)' }}>
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
                    <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--taller-ink)', borderBottom: '1px solid var(--taller-border)' }}>
                      {mec.servicios}
                    </td>
                    <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--taller-ink)', borderBottom: '1px solid var(--taller-border)' }}>
                      {fmtMoney(mec.mo)}
                    </td>
                    <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--taller-ink)', borderBottom: '1px solid var(--taller-border)' }}>
                      {fmtMoney(mec.comisiones)}
                    </td>
                    <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--taller-ink)', borderBottom: '1px solid var(--taller-border)' }}>
                      {fmtMoney(mec.sueldo)}
                    </td>
                    <td className="px-4 py-3 text-xs text-right" style={{ color: 'var(--taller-ink)', borderBottom: '1px solid var(--taller-border)' }}>
                      {fmtMoney(mec.costoTotal)}
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-semibold" style={{ color: '#0070f3', borderBottom: '1px solid var(--taller-border)' }}>
                      {fmtMoney(mec.utilidad)}
                    </td>
                    <td className="px-4 py-3 text-right" style={{ borderBottom: '1px solid var(--taller-border)' }}>
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
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: 'var(--taller-ink)', borderTop: '2px solid var(--taller-border)' }}>Total</td>
                    <td className="px-4 py-3 text-xs font-bold text-right" style={{ color: 'var(--taller-ink)', borderTop: '2px solid var(--taller-border)' }}>
                      {totMec.servicios}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-right" style={{ color: 'var(--taller-ink)', borderTop: '2px solid var(--taller-border)' }}>
                      {fmtMoney(totMec.mo)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-right" style={{ color: 'var(--taller-ink)', borderTop: '2px solid var(--taller-border)' }}>
                      {fmtMoney(totMec.comisiones)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-right" style={{ color: 'var(--taller-ink)', borderTop: '2px solid var(--taller-border)' }}>
                      {fmtMoney(totMec.sueldo)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-right" style={{ color: 'var(--taller-ink)', borderTop: '2px solid var(--taller-border)' }}>
                      {fmtMoney(totMec.costoTotal)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-right" style={{ color: '#0070f3', borderTop: '2px solid var(--taller-border)' }}>
                      {fmtMoney(totMec.utilidad)}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-right" style={{ borderTop: '2px solid var(--taller-border)' }}>
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

        <p className="text-xs italic mt-3" style={{ color: 'var(--taller-muted)' }}>
          ROI = MO generada ÷ costo total. Un mecánico con ROI &lt;{LOW_MECHANIC_ROI}x necesita más servicios o menor costo.
        </p>
      </div>
    </div>
  )
}
