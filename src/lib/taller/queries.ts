import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type {
  Agg,
  TallerData,
  ServiciosIngresos,
  CostoPartes,
  Nomina,
  NominaMecanico,
  MecanicoEquipo,
  ServicioPendiente,
  GastoCategoria,
} from '@/types/taller'

/* ── Tenant DB connection ── */

export async function getTenantClient() {
  const cookieStore = await cookies()
  const appDb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: tenant } = await appDb
    .from('tenants')
    .select('db_url, db_anon_key')
    .eq('slug', 'taller')
    .single()

  if (!tenant?.db_url || !tenant?.db_anon_key) {
    throw new Error('Tenant "taller" not found')
  }

  return createClient(tenant.db_url, tenant.db_anon_key)
}

/** Tenant client using admin (service-role) — no cookies needed (for public pages). */
export async function getTenantClientAdmin() {
  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { data: tenant } = await adminDb
    .from('tenants')
    .select('db_url, db_anon_key')
    .eq('slug', 'taller')
    .single()

  if (!tenant?.db_url || !tenant?.db_anon_key) {
    throw new Error('Tenant "taller" not found')
  }

  return createClient(tenant.db_url, tenant.db_anon_key)
}

/* ── Helpers ── */

function sanitizeDate(d: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error(`Invalid date format: ${d}`)
  }
  return d
}

function sum(arr: any[], key: string): number {
  return arr.reduce((s, r) => s + (Number(r[key]) || 0), 0)
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function getTimeBucket(dateStr: string, agg: Agg): { key: string; label: string } {
  const d = new Date(dateStr)

  switch (agg) {
    case 'dia': {
      const dd = String(d.getUTCDate()).padStart(2, '0')
      return {
        key: dateStr.slice(0, 10),
        label: `${dd} ${MONTHS[d.getUTCMonth()]}`,
      }
    }
    case 'semana': {
      const day = d.getUTCDay()
      const monday = new Date(d)
      monday.setUTCDate(d.getUTCDate() - ((day + 6) % 7))
      const y = monday.getUTCFullYear()
      const mm = String(monday.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(monday.getUTCDate()).padStart(2, '0')
      return {
        key: `${y}-${mm}-${dd}`,
        label: `Sem ${dd}/${mm}`,
      }
    }
    case 'mes': {
      const y = d.getUTCFullYear()
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      return { key: `${y}-${mm}`, label: MONTHS[d.getUTCMonth()] }
    }
    case 'anio': {
      return { key: String(d.getUTCFullYear()), label: String(d.getUTCFullYear()) }
    }
  }
}

/* ── Main data fetcher ── */

export async function getTallerData(
  fechaInicio: string,
  fechaFin: string,
  agg: Agg = 'dia',
  dbOverride?: SupabaseClient,
): Promise<TallerData> {
  const desde = sanitizeDate(fechaInicio)
  const hasta = sanitizeDate(fechaFin)
  const db = dbOverride ?? await getTenantClient()

  const [qServices, qPaidParts, qPayroll, qExpenses, qMecanicos, qPayrollMec, qEmployees, qPending, qServiceWorkers, qServiceParts] = await Promise.all([
    // Q1: Services created in period (counts only, no nested joins)
    db
      .from('services')
      .select('id, created_at, paid_at, status, work_completed')
      .gte('created_at', desde)
      .lte('created_at', hasta),

    // Q2: Services paid in period (cobrados count + series)
    db
      .from('services')
      .select('id, paid_at')
      .not('paid_at', 'is', null)
      .gte('paid_at', desde)
      .lte('paid_at', hasta)
      .neq('status', 'invalid'),

    // Q3: Payroll in period (only paid/closed)
    db
      .from('payroll')
      .select('net_payment, base_salary, total_commission')
      .eq('is_paid', true)
      .gte('week_start', desde)
      .lte('week_end', hasta),

    // Q4: Expenses with categories
    db
      .from('expenses')
      .select('total, expense_categories!inner(name, expense_group)')
      .gte('date', desde)
      .lte('date', hasta)
      .eq('expense_categories.type', 'expense'),

    // Q5: All service_jobs from paid, valid services (labor per service)
    db
      .from('service_jobs')
      .select('service_id, labor_price, services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),

    // Q6: Payroll per mechanic (only paid/closed)
    db
      .from('payroll')
      .select('net_payment, base_salary, total_commission, week_start, week_end, employee_id, employee:employees(name, last_name, role, commission_on_parts, commission_percentage)')
      .eq('is_paid', true)
      .not('employee_id', 'is', null)
      .gte('week_start', desde)
      .lte('week_end', hasta),

    // Q7: Employees (mechanics) — metadata for equipo cards
    db
      .from('employees')
      .select('id, name, last_name, role, commission_rate, color, initials')
      .eq('role', 'mechanic'),

    // Q8: Pending services (unpaid) with mechanic names
    db
      .from('services')
      .select('id, created_at, status, work_completed, service_jobs(employee_id, employee:employees(name, last_name))')
      .is('paid_at', null)
      .gte('created_at', desde)
      .lte('created_at', hasta),

    // Q9: Servicios per mechanic — flat service_workers from paid, valid services
    db
      .from('service_workers')
      .select('employee_id, service_id, employee:employees(name, last_name), services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),

    // Q10: Refacciones — flat service_parts from paid, valid services (no nested joins)
    db
      .from('service_parts')
      .select('service_id, cost, price, qty, services!inner(paid_at, status)')
      .not('services.paid_at', 'is', null)
      .neq('services.status', 'invalid')
      .gte('services.paid_at', desde)
      .lte('services.paid_at', hasta),
  ])

  // ══════════════════════════════════════════════════════════════════
  // Per-service subquery maps from Q5 (MO) and Q10 (parts)
  // Each table aggregated independently — no row multiplication
  // ══════════════════════════════════════════════════════════════════

  // MO per service (from Q5 — flat service_jobs of paid valid services)
  const moPerService = new Map<string, { total: number; paid_at: string }>()
  for (const j of (qMecanicos.data ?? []) as any[]) {
    const sid = String(j.service_id)
    const e = moPerService.get(sid) ?? { total: 0, paid_at: j.services.paid_at }
    e.total += Number(j.labor_price) || 0
    moPerService.set(sid, e)
  }

  // Parts per service (from Q10 — flat service_parts of paid valid services)
  const partsPerService = new Map<string, { count: number; revenue: number; cost: number; paid_at: string }>()
  for (const p of (qServiceParts.data ?? []) as any[]) {
    const sid = String(p.service_id)
    const e = partsPerService.get(sid) ?? { count: 0, revenue: 0, cost: 0, paid_at: p.services.paid_at }
    e.count++
    e.revenue += (Number(p.price) * Number(p.qty)) || 0
    e.cost += (Number(p.cost) * Number(p.qty)) || 0
    partsPerService.set(sid, e)
  }

  // ── Revenue totals (from subquery maps) ──
  const ingresosMo = Array.from(moPerService.values()).reduce((s, v) => s + v.total, 0)
  const ingresosPartes = Array.from(partsPerService.values()).reduce((s, v) => s + v.revenue, 0)

  // ── KPI counts (Q1: created_at in range, Q2: paid_at in range) ──
  const services = qServices.data ?? []
  const validServices = services.filter((s: any) => s.status !== 'invalid')
  const paidServices = qPaidParts.data ?? []
  const cobradosCount = paidServices.length

  const servicios: ServiciosIngresos = {
    total_servicios: validServices.length,
    pagados: cobradosCount,
    en_proceso: validServices.length - cobradosCount,
    terminados_sin_cobrar: validServices.filter((s: any) => s.paid_at === null && s.work_completed === true).length,
    ingresos_mo: ingresosMo,
    ingresos_partes_cliente: ingresosPartes,
  }

  // ── Serie: ingresos por período (from per-service maps, grouped by paid_at) ──
  const ingSerieMap = new Map<string, { label: string; mo: number; partes: number }>()
  moPerService.forEach(({ total, paid_at }) => {
    const { key, label } = getTimeBucket(paid_at, agg)
    const e = ingSerieMap.get(key) ?? { label, mo: 0, partes: 0 }
    e.mo += total
    ingSerieMap.set(key, e)
  })
  partsPerService.forEach(({ revenue, paid_at }) => {
    const { key, label } = getTimeBucket(paid_at, agg)
    const e = ingSerieMap.get(key) ?? { label, mo: 0, partes: 0 }
    e.partes += revenue
    ingSerieMap.set(key, e)
  })
  const ingresos_serie = Array.from(ingSerieMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ semana: v.label, mo: v.mo, partes: v.partes }))

  // ── Serie: servicios por período — total (Q1 created_at) + cobrados (Q2 paid_at) ──
  const svcStatusMap = new Map<string, { label: string; total: number; cobrados: number }>()
  for (const svc of validServices as any[]) {
    const { key, label } = getTimeBucket(svc.created_at, agg)
    const e = svcStatusMap.get(key) ?? { label, total: 0, cobrados: 0 }
    e.total++
    svcStatusMap.set(key, e)
  }
  for (const svc of paidServices as any[]) {
    const { key, label } = getTimeBucket(svc.paid_at, agg)
    const e = svcStatusMap.get(key) ?? { label, total: 0, cobrados: 0 }
    e.cobrados++
    svcStatusMap.set(key, e)
  }
  const servicios_serie = Array.from(svcStatusMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ dia: v.label, total: v.total, cobrados: v.cobrados }))

  // ── Employee names from Q7 ──
  const empNameMap = new Map<string, string>()
  for (const emp of (qEmployees.data ?? []) as any[]) {
    empNameMap.set(String(emp.id), `${emp.name ?? ''} ${emp.last_name ?? ''}`.trim() || 'Sin asignar')
  }

  // ── Q9: Map employees → unique services + names ──
  const empServiceSets = new Map<string, Set<string>>()
  for (const sw of (qServiceWorkers.data ?? []) as any[]) {
    const key = String(sw.employee_id)
    const sid = String(sw.service_id)
    const sids = empServiceSets.get(key) ?? new Set()
    sids.add(sid)
    empServiceSets.set(key, sids)
    if (!empNameMap.has(key) && sw.employee) {
      empNameMap.set(key, `${sw.employee.name ?? ''} ${sw.employee.last_name ?? ''}`.trim() || 'Sin asignar')
    }
  }

  // ── Q6: Comisión por mecánico (build early for produccion) ──
  const comisionMap = new Map<string, number>()
  for (const p of (qPayrollMec.data ?? []) as any[]) {
    const key = String(p.employee_id)
    comisionMap.set(key, (comisionMap.get(key) ?? 0) + (Number(p.total_commission) || 0))
  }

  // ── Producción por mecánico: service_workers × moPerService (solo mechanics) ──
  const mechanicIds = new Set<string>()
  for (const emp of (qEmployees.data ?? []) as any[]) {
    mechanicIds.add(String(emp.id))
  }
  const mecMap = new Map<string, { nombre: string; mo: number; servicios: number; comision: number }>()
  empServiceSets.forEach((serviceIds, empId) => {
    if (!mechanicIds.has(empId)) return
    let totalMo = 0
    serviceIds.forEach(sid => {
      totalMo += moPerService.get(sid)?.total ?? 0
    })
    const nombre = empNameMap.get(empId) || 'Sin asignar'
    mecMap.set(empId, { nombre, mo: totalMo, servicios: serviceIds.size, comision: comisionMap.get(empId) ?? 0 })
  })
  const produccion_mecanicos = Array.from(mecMap.values()).sort((a, b) => b.mo - a.mo)

  // ── Q6: Nómina por mecánico (solo registros pagados) ──
  const nomMecMap = new Map<string, NominaMecanico>()
  for (const p of (qPayrollMec.data ?? []) as any[]) {
    const emp = p.employee
    const key = String(p.employee_id)
    const nombre = `${emp?.name ?? ''} ${emp?.last_name ?? ''}`.trim() || 'Sin asignar'
    const role = emp?.role ?? ''
    const e = nomMecMap.get(key) ?? { employee_id: key, nombre, role, salario: 0, comision: 0, neto: 0, week_start: p.week_start, week_end: p.week_end, servicios: 0, mo: 0, refacciones: 0, partes_usadas: 0, costo_partes: 0, commission_on_parts: emp?.commission_on_parts ?? false, commission_percentage: Number(emp?.commission_percentage) || 0 }
    e.salario += Number(p.base_salary) || 0
    e.comision += Number(p.total_commission) || 0
    e.neto += Number(p.net_payment) || 0
    if (p.week_start < e.week_start) e.week_start = p.week_start
    if (p.week_end > e.week_end) e.week_end = p.week_end
    nomMecMap.set(key, e)
  }

  // ── Merge production + parts into nomMecMap ──
  nomMecMap.forEach((nm, key) => {
    const prod = mecMap.get(key)
    nm.mo = prod?.mo ?? 0
    const serviceIds = empServiceSets.get(key)
    if (serviceIds) {
      nm.servicios = serviceIds.size
      let partsCount = 0
      let partsPrice = 0
      let partsCost = 0
      serviceIds.forEach(sid => {
        const parts = partsPerService.get(sid)
        if (parts) {
          partsCount += parts.count
          partsPrice += parts.revenue
          partsCost += parts.cost
        }
      })
      nm.refacciones = partsPrice
      nm.partes_usadas = partsCount
      nm.costo_partes = partsCost
    }
  })

  const nomina_mecanicos = Array.from(nomMecMap.values())
    .sort((a, b) => (b.mo + b.refacciones) - (a.mo + a.refacciones))

  // ── Q7: Equipo (merge employees + production + payroll) ──
  const totalMO = produccion_mecanicos.reduce((s, m) => s + m.mo, 0)
  const equipo: MecanicoEquipo[] = ((qEmployees.data ?? []) as any[]).map((emp) => {
    const key = String(emp.id)
    const prod = mecMap.get(key)
    const nom = nomMecMap.get(key)
    const svc = prod?.servicios ?? 0
    const mo = prod?.mo ?? 0
    return {
      id: key,
      nombre: `${emp.name ?? ''} ${emp.last_name ?? ''}`.trim(),
      iniciales: emp.initials ?? '',
      color: emp.color ?? '#2d6a4f',
      role: emp.role ?? 'mechanic',
      comision_pct: Number(emp.commission_rate) || 0,
      servicios: svc,
      mo_generada: mo,
      comision: nom?.comision ?? 0,
      ticket_promedio: svc > 0 ? mo / svc : 0,
      participacion_mo: totalMO > 0 ? (mo / totalMO) * 100 : 0,
    }
  }).sort((a, b) => b.mo_generada - a.mo_generada)

  // ── Q8: Pendientes (servicios no cobrados) ──
  const now = new Date()
  const pendientes_proceso: ServicioPendiente[] = []
  const pendientes_cobro: ServicioPendiente[] = []
  for (const svc of ((qPending.data ?? []) as any[])) {
    const jobs = svc.service_jobs ?? []
    const firstMech = jobs[0]?.employee
    const mechName = firstMech
      ? `${firstMech.name ?? ''} ${firstMech.last_name ?? ''}`.trim()
      : 'Sin asignar'
    const dias = Math.max(0, Math.floor((now.getTime() - new Date(svc.created_at).getTime()) / 86_400_000))
    if (svc.work_completed) {
      pendientes_cobro.push({ folio: svc.id, mecanico: mechName, dias, estado: 'sin_cobrar' })
    } else {
      pendientes_proceso.push({ folio: svc.id, mecanico: mechName, dias, estado: 'en_proceso' })
    }
  }
  pendientes_proceso.sort((a, b) => b.dias - a.dias)
  pendientes_cobro.sort((a, b) => b.dias - a.dias)

  // ── Ticket mediana (from per-service subquery maps) ──
  const allPaidServiceIds = new Set<string>([...Array.from(moPerService.keys()), ...Array.from(partsPerService.keys())])
  const ticketAmounts = Array.from(allPaidServiceIds).map(sid => {
    const mo = moPerService.get(sid)?.total ?? 0
    const pt = partsPerService.get(sid)?.revenue ?? 0
    return mo + pt
  }).sort((a, b) => a - b)
  const ticket_mediana = ticketAmounts.length > 0
    ? ticketAmounts.length % 2 === 0
      ? (ticketAmounts[ticketAmounts.length / 2 - 1] + ticketAmounts[ticketAmounts.length / 2]) / 2
      : ticketAmounts[Math.floor(ticketAmounts.length / 2)]
    : 0

  // ── Costo de partes (from Q10 per-service map) ──
  let totalPartesCount = 0
  let costoPartes = 0
  let precioPartes = 0
  partsPerService.forEach((v) => {
    totalPartesCount += v.count
    costoPartes += v.cost
    precioPartes += v.revenue
  })
  const partes: CostoPartes = {
    total_partes: totalPartesCount,
    costo_partes: costoPartes,
    precio_cliente_partes: precioPartes,
    utilidad_partes: precioPartes - costoPartes,
  }

  // ── Serie: margen partes por período (from Q10 flat rows) ──
  const mpSerieMap = new Map<string, { label: string; costo: number; utilidad: number }>()
  for (const p of (qServiceParts.data ?? []) as any[]) {
    const paid_at = p.services?.paid_at
    if (!paid_at) continue
    const { key, label } = getTimeBucket(paid_at, agg)
    const e = mpSerieMap.get(key) ?? { label, costo: 0, utilidad: 0 }
    const c = (Number(p.cost) * Number(p.qty)) || 0
    const pr = (Number(p.price) * Number(p.qty)) || 0
    e.costo += c
    e.utilidad += pr - c
    mpSerieMap.set(key, e)
  }
  const margen_partes_serie = Array.from(mpSerieMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ semana: v.label, costo: v.costo, utilidad: v.utilidad }))

  // ── Serie: margen bruto por período (from per-service maps) ──
  const mSerieMap = new Map<string, { label: string; ingresos: number; utilidad: number }>()
  moPerService.forEach(({ total, paid_at }) => {
    const { key, label } = getTimeBucket(paid_at, agg)
    const e = mSerieMap.get(key) ?? { label, ingresos: 0, utilidad: 0 }
    e.ingresos += total
    e.utilidad += total
    mSerieMap.set(key, e)
  })
  partsPerService.forEach(({ revenue, cost, paid_at }) => {
    const { key, label } = getTimeBucket(paid_at, agg)
    const e = mSerieMap.get(key) ?? { label, ingresos: 0, utilidad: 0 }
    e.ingresos += revenue
    e.utilidad += revenue - cost
    mSerieMap.set(key, e)
  })
  const margen_serie = Array.from(mSerieMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ semana: v.label, ingresos: v.ingresos, utilidad: v.utilidad }))

  // ── Serie: composición del ingreso por período (MO + costo partes + margen partes) ──
  const compKeys = new Set([...Array.from(ingSerieMap.keys()), ...Array.from(mpSerieMap.keys())])
  const composicion_serie = Array.from(compKeys)
    .sort((a, b) => a.localeCompare(b))
    .map(key => {
      const ing = ingSerieMap.get(key)
      const mp = mpSerieMap.get(key)
      return {
        semana: ing?.label ?? mp?.label ?? key,
        mo: ing?.mo ?? 0,
        costo_partes: mp?.costo ?? 0,
        margen_partes: mp?.utilidad ?? 0,
      }
    })

  // ── Q3: Nómina ──
  const payrollRows = qPayroll.data ?? []
  const nomina: Nomina = {
    nomina_neta: sum(payrollRows, 'net_payment'),
    salarios: sum(payrollRows, 'base_salary'),
    comisiones: sum(payrollRows, 'total_commission'),
  }

  // ── Q4: Gastos agrupados por categoría ──
  const gastoMap = new Map<string, GastoCategoria>()
  for (const e of (qExpenses.data ?? []) as any[]) {
    const cat = e.expense_categories
    const key = cat.name
    const existing = gastoMap.get(key)
    if (existing) {
      existing.total += Number(e.total) || 0
    } else {
      gastoMap.set(key, {
        categoria: cat.name,
        expense_group: cat.expense_group,
        total: Number(e.total) || 0,
      })
    }
  }
  const gastos = Array.from(gastoMap.values()).sort((a, b) => b.total - a.total)

  return {
    servicios,
    partes,
    nomina,
    gastos,
    ingresos_serie,
    servicios_serie,
    margen_partes_serie,
    margen_serie,
    composicion_serie,
    produccion_mecanicos,
    nomina_mecanicos,
    equipo,
    pendientes_proceso,
    pendientes_cobro,
    ticket_mediana,
  }
}
