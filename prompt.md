Necesito replicar el botón "Interprétame" que ya existe en TableroView.tsx, 
pero ahora en la página Pulso (src/app/dashboard/taller/pulso/page.tsx).

NO modifiques TableroView.tsx ni /api/interpret/route.ts — solo léelos como referencia.

PARTE 1 — Botón en Pulso:
Agrega un botón "Interprétame" en el header de Pulso, junto a los botones PDF y JSON existentes.
- Estado: default, loading ("Generando..."), deshabilitado si no hay remaining uses
- Solo visible para admin y editor (ya tienes canShare como referencia del rol)

PARTE 2 — Construir dashboardData desde los props de Pulso:
Usando los datos que ya tiene la página Pulso, construye el mismo objeto dashboardData 
que usa TableroView.tsx (líneas 1537-1568). Mapea así:

{
  periodo: string del rango de fechas seleccionado,
  financiero: {
    ingresos: kpis.ingresos,
    egresos_gastos: kpis.egresos,
    nomina_pagada: 0, // Pulso no tiene nómina desglosada aún
    flujo_libre: kpis.flujo_libre,
    margen_pct: kpis.margen_bruto,
  },
  operacional: {
    servicios_completados: cotizaciones.cobrados,
    ticket_promedio: kpis.ingresos / cotizaciones.cobrados,
    por_cobrar: alertas.cartera_por_cobrar,
    en_proceso: alertas.servicios_activos_mas_3_dias,
    costo_fijo_dia: 0,
    breakeven_diario: 0,
  },
  nomina: {
    total_pagado: 0,
    pct_ingresos: 0,
    roi_mo: kpis.roi_mano_de_obra,
    por_mecanico: alertas.mecanicos_roi_bajo.map(m => ({
      nombre: m.nombre,
      servicios: 0,
      mo_generada: 0,
      pagado: 0,
      roi: m.roi
    })),
  },
  refaccionaria: { venta: 0, costo: 0, ganancia: 0, margen_pct: 0 },
  gastos_por_categoria: gastos_breakdown.map(g => ({ 
    categoria: g.grupo, total: g.monto 
  })),
  tendencia_6_periodos: tendencia.map(t => ({
    periodo: t.label,
    ingresos: t.ingresos,
    gastos: t.egresos,
    utilidad: t.flujo
  })),
}

PARTE 3 — Llamar a la API y generar PDF:
Reutiliza exactamente el mismo flujo que TableroView.tsx:
1. POST a /api/interpret con { dashboardData }
2. Recibe { content, remaining }
3. Genera el PDF con jsPDF usando el mismo parser de markdown que ya existe 
   (cópialo de TableroView.tsx líneas 1609-1667, no lo reimplementes)
4. Nombre del archivo: interpretacion-pulso-{mes}-{año}.pdf

PARTE 4 — Mostrar remaining uses:
Debajo del botón, en texto pequeño gris: "X de 10 análisis disponibles"
Si remaining === 0, deshabilita el botón y muestra "Límite alcanzado"

No toques /api/interpret/route.ts ni TableroView.tsx.


Esto es el codigo de TableroView.tsx para que lo tengas de referencia
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import dynamic from "next/dynamic";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { createClient } from "@/lib/supabase/client";
import { type PeriodRange, type Granularity } from "./PeriodFilter";
import { fmt } from "@/lib/helpers";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });
const supabase = createClient();

type Tab = "resumen" | "operacion";

/* ─── Date Range & Agrupación ─── */

type DateRangeKey = "este-mes" | "mes-anterior" | "ultimos-3-meses" | "este-trimestre" | "este-año";
type AgrupacionKey = "dia" | "semana" | "mes";

const DATE_RANGE_OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: "este-mes", label: "Este mes" },
  { key: "mes-anterior", label: "Mes anterior" },
  { key: "ultimos-3-meses", label: "Últimos 3 meses" },
  { key: "este-trimestre", label: "Este trimestre" },
  { key: "este-año", label: "Este año" },
];

const AGRUPACION_OPTIONS: { key: AgrupacionKey; label: string }[] = [
  { key: "dia", label: "Día" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
];

const AUTO_AGRUPACION: Record<DateRangeKey, AgrupacionKey> = {
  "este-mes": "dia",
  "mes-anterior": "dia",
  "ultimos-3-meses": "semana",
  "este-trimestre": "semana",
  "este-año": "mes",
};

function computeFromDateRange(range: DateRangeKey): PeriodRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const ml = (d: Date) => cap(d.toLocaleDateString("es-MX", { month: "long", year: "numeric" }));
  const ms = (d: Date) => cap(d.toLocaleDateString("es-MX", { month: "short" }));

  switch (range) {
    case "este-mes": {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const prevStart = new Date(year, month - 1, 1);
      const prevEnd = new Date(year, month, 0, 23, 59, 59, 999);
      return { start, end, prevStart, prevEnd, label: ml(start), compLabel: `vs ${ml(prevStart)}`, granularity: "mes" };
    }
    case "mes-anterior": {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      const prevStart = new Date(year, month - 2, 1);
      const prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);
      return { start, end, prevStart, prevEnd, label: ml(start), compLabel: `vs ${ml(prevStart)}`, granularity: "mes" };
    }
    case "ultimos-3-meses": {
      const start = new Date(year, month - 2, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      const prevStart = new Date(year, month - 5, 1);
      const prevEnd = new Date(year, month - 2, 0, 23, 59, 59, 999);
      const label = `${ms(start)} — ${ms(new Date(year, month, 1))} ${end.getFullYear()}`;
      return { start, end, prevStart, prevEnd, label, compLabel: "vs 3 meses anteriores", granularity: "trimestre" };
    }
    case "este-trimestre": {
      const q = Math.floor(month / 3);
      const start = new Date(year, q * 3, 1);
      const end = new Date(year, q * 3 + 3, 0, 23, 59, 59, 999);
      const pq = q > 0 ? q - 1 : 3;
      const py = q > 0 ? year : year - 1;
      const prevStart = new Date(py, pq * 3, 1);
      const prevEnd = new Date(py, pq * 3 + 3, 0, 23, 59, 59, 999);
      return { start, end, prevStart, prevEnd, label: `Q${q + 1} ${year}`, compLabel: `vs Q${pq + 1} ${py}`, granularity: "trimestre" };
    }
    case "este-año": {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      const prevStart = new Date(year - 1, 0, 1);
      const prevEnd = new Date(year - 1, 11, 31, 23, 59, 59, 999);
      return { start, end, prevStart, prevEnd, label: `${year}`, compLabel: `vs ${year - 1}`, granularity: "anio" };
    }
  }
}

function generateTrendRanges(start: Date, end: Date, group: AgrupacionKey): { start: Date; end: Date; label: string }[] {
  const ranges: { start: Date; end: Date; label: string }[] = [];

  if (group === "dia") {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    while (d <= end) {
      ranges.push({
        start: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999),
        label: `${d.getDate()} ${d.toLocaleDateString("es-MX", { month: "short" })}`,
      });
      d.setDate(d.getDate() + 1);
    }
  } else if (group === "semana") {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const dow = d.getDay() || 7;
    d.setDate(d.getDate() - dow + 1);
    while (d <= end) {
      const wStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const wEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 6, 23, 59, 59, 999);
      const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
      const ys = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const wn = Math.ceil(((tmp.getTime() - ys.getTime()) / 86400000 + 1) / 7);
      ranges.push({ start: wStart, end: wEnd, label: `Sem ${wn}` });
      d.setDate(d.getDate() + 7);
    }
  } else {
    const d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d <= end) {
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const name = d.toLocaleDateString("es-MX", { month: "short" });
      ranges.push({
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: mEnd,
        label: name.charAt(0).toUpperCase() + name.slice(1),
      });
      d.setMonth(d.getMonth() + 1);
    }
  }

  return ranges;
}

/* ─── ChartTooltip ─── */
function ChartTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; align: "center" | "left" | "right" }>({ top: 0, left: 0, align: "center" });

  const handleEnter = () => {
    setShow(true);
    if (!iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();
    const tooltipW = 200;
    const centerX = rect.left + rect.width / 2 - tooltipW / 2;
    let align: "center" | "left" | "right" = "center";
    let left = centerX;
    if (centerX < 8) { align = "left"; left = rect.left; }
    else if (centerX + tooltipW > window.innerWidth - 8) { align = "right"; left = rect.right - tooltipW; }
    setPos({ top: rect.top - 6, left, align });
  };

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", zIndex: 9999 }}
      onMouseEnter={handleEnter}
      onMouseLeave={() => setShow(false)}
    >
      <span ref={iconRef} style={{ fontSize: "12px", color: "#9a9a9a", cursor: "default", lineHeight: 1 }}>&#9432;</span>
      {show && typeof document !== "undefined" && ReactDOM.createPortal(
        <span
          style={{
            position: "fixed" as const,
            top: pos.top,
            left: pos.left,
            transform: "translateY(-100%)",
            background: "#1a1a1a",
            color: "#e8e8e8",
            fontSize: "11px",
            lineHeight: "1.5",
            fontWeight: 400,
            padding: "7px 10px",
            borderRadius: "6px",
            whiteSpace: "normal" as const,
            width: "200px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            zIndex: 9999,
            pointerEvents: "none" as const,
          }}
        >
          {text}
        </span>,
        document.body
      )}
    </span>
  );
}

/* ─── helpers ─── */

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

/** Short currency for tooltip strings */
const fc = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

function calcDelta(current: number, previous: number): { pct: number; direction: "up" | "down" | "flat" } {
  if (previous === 0) return { pct: 0, direction: "flat" };
  const pct = Math.round(((current - previous) / previous) * 100);
  return { pct: Math.abs(pct), direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

function timeSince(dateStr: string): string {
  const h = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3_600_000);
  if (h < 1) return "< 1h";
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  const r = h % 24;
  return `${d}d ${r}h`;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ─── Plotly layout/config ─── */

const plotLayout: any = {
  margin: { t: 8, r: 16, b: 36, l: 56 },
  font: { family: "Inter, -apple-system, sans-serif", color: "#999", size: 11 },
  plot_bgcolor: "white",
  paper_bgcolor: "white",
  hovermode: "x unified" as const,
};

const plotConfig: any = { displayModeBar: false, responsive: true };

/* ─── Data interfaces ─── */

interface ServiceRow {
  id: string;
  folio: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  total_client: number;
  total_profit: number;
  labor: number;
  parts_client: number;
  parts_cost: number;
  client_name: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  stage_name: string | null;
  stage_color: string | null;
  stage_id: string | null;
}

interface ExpenseRow {
  id: string;
  date: string;
  total: number;
  detail: string;
  installment_total: number | null;
  parent_expense_id: string | null;
  installment_status: string | null;
  expense_categories: { name: string; expense_group: string | null } | null;
}

interface MechanicRow {
  id: string;
  name: string;
  alias: string | null;
  role: string;
  base_salary: number | null;
  commission_percentage: number | null;
  salary_type: string | null;
  pay_frequency: string | null;
}

interface PayrollRow {
  employee_id: string;
  total_commission: number;
  base_salary: number;
  net_payment: number;
  week_start: string;
}

/* ─── Component ─── */

export default function TableroView() {
  const [tab, setTab] = useState<Tab>("resumen");
  const [dateRange, setDateRange] = useState<DateRangeKey>("este-mes");
  const [agrupacion, setAgrupacion] = useState<AgrupacionKey>("dia");
  const period = useMemo(() => computeFromDateRange(dateRange), [dateRange]);
  const [exportOpen, setExportOpen] = useState(false);

  function handleDateRange(key: DateRangeKey) {
    setDateRange(key);
    setAgrupacion(AUTO_AGRUPACION[key]);
  }

  // Data state
  const [paidServices, setPaidServices] = useState<ServiceRow[]>([]);
  const [prevPaidServices, setPrevPaidServices] = useState<ServiceRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [prevExpenses, setPrevExpenses] = useState<ExpenseRow[]>([]);
  const [activeServices, setActiveServices] = useState<ServiceRow[]>([]);
  const [allPeriodServices, setAllPeriodServices] = useState<ServiceRow[]>([]);
  const [prevAllServices, setPrevAllServices] = useState<ServiceRow[]>([]);
  const [pendingParts, setPendingParts] = useState(0);
  const [lowInventory, setLowInventory] = useState(0);
  const [mechanics, setMechanics] = useState<MechanicRow[]>([]);
  const [adminStaff, setAdminStaff] = useState<MechanicRow[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollRow[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<ExpenseRow[]>([]);
  const [incomeExpensesTotal, setIncomeExpensesTotal] = useState(0);
  const [prevIncomeExpensesTotal, setPrevIncomeExpensesTotal] = useState(0);
  const [serviceWorkers, setServiceWorkers] = useState<{ service_id: string; employee_id: string }[]>([]);
  const [paidServiceWorkers, setPaidServiceWorkers] = useState<{ service_id: string; employee_id: string }[]>([]);
  const [printing, setPrinting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [interpreting, setInterpreting] = useState(false);
  const [interpretameRemaining, setInterpretameRemaining] = useState<number | null>(null);
  const [interpretameNextDate, setInterpretameNextDate] = useState<string | null>(null);
  const [interpretamePuedeUsar, setInterpretamePuedeUsar] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Trend data (last 6 periods)
  const [trendData, setTrendData] = useState<{ label: string; ingresos: number; gastos: number; utilidad: number }[]>([]);

  const [loading, setLoading] = useState(true);

  /* ─── Fetch data ─── */

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      const startISO = period.start.toISOString();
      const endISO = period.end.toISOString();
      const startDate = startISO.slice(0, 10);
      const endDate = endISO.slice(0, 10);
      const prevStartISO = period.prevStart.toISOString();
      const prevEndISO = period.prevEnd.toISOString();
      const prevStartDate = prevStartISO.slice(0, 10);
      const prevEndDate = prevEndISO.slice(0, 10);

      const [
        paidRes,
        prevPaidRes,
        expRes,
        prevExpRes,
        activeRes,
        pendingPartsRes,
        lowInvRes,
        mechanicsRes,
        payrollRes,
        recentExpRes,
        allServicesRes,
        prevAllServicesRes,
        expChildRes,
        prevExpChildRes,
        incomeExpRes,
        prevIncomeExpRes,
      ] = await Promise.all([
        // Paid services in period
        supabase.from("services_with_totals").select("*").not("paid_at", "is", null)
          .gte("paid_at", startISO).lt("paid_at", endISO),
        // Paid services in previous period
        supabase.from("services_with_totals").select("*").not("paid_at", "is", null)
          .gte("paid_at", prevStartISO).lt("paid_at", prevEndISO),
        // Expenses in period (normal + recurring children, excludes recurring parents)
        supabase.from("expenses").select("*, expense_categories(name, expense_group)")
          .eq("type", "expense").is("parent_expense_id", null)
          .gte("date", startDate).lte("date", endDate)
          .or("is_recurring.eq.false,recurring_parent_id.not.is.null"),
        // Expenses in previous period (normal + recurring children, excludes recurring parents)
        supabase.from("expenses").select("*, expense_categories(name, expense_group)")
          .eq("type", "expense").is("parent_expense_id", null)
          .gte("date", prevStartDate).lte("date", prevEndDate)
          .or("is_recurring.eq.false,recurring_parent_id.not.is.null"),
        // Active services
        supabase.from("services_with_totals").select("*").eq("status", "active")
          .is("paid_at", null).order("total_client", { ascending: false }),
        // Pending parts count
        supabase.from("service_parts").select("id", { count: "exact", head: true }).eq("pending_purchase", true),
        // Low inventory
        supabase.from("inventory_products").select("id, stock_current, stock_minimum").eq("is_active", true),
        // Employees (mechanics + admin)
        supabase.from("employees").select("id, name, alias, role, base_salary, commission_percentage, salary_type, pay_frequency")
          .in("role", ["mechanic", "owner", "admin"]).eq("is_active", true),
        // Payroll in period (only paid, exclude socios)
        supabase.from("payroll").select("employee_id, total_commission, base_salary, net_payment, week_start")
          .gte("week_start", startDate).lte("week_start", endDate).eq("is_paid", true)
          .not("employee_id", "in", "(8c180599-280f-4d0b-9d20-414c514d6b0a,cec70688-a224-443e-9802-0fa0833bad66)"),
        // Recent expenses (parents only, no installment children)
        supabase.from("expenses").select("*, expense_categories(name, expense_group)")
          .eq("type", "expense").is("parent_expense_id", null)
          .order("date", { ascending: false }).limit(10),
        // All services created in period
        supabase.from("services_with_totals").select("*")
          .gte("created_at", startISO).lt("created_at", endISO),
        // All services created in previous period
        supabase.from("services_with_totals").select("*")
          .gte("created_at", prevStartISO).lt("created_at", prevEndISO),
        // Paid installment children in current period
        supabase.from("expenses").select("*, expense_categories(name, expense_group)")
          .eq("type", "expense").not("parent_expense_id", "is", null).eq("installment_status", "paid")
          .gte("date", startDate).lte("date", endDate),
        // Paid installment children in previous period
        supabase.from("expenses").select("*, expense_categories(name, expense_group)")
          .eq("type", "expense").not("parent_expense_id", "is", null).eq("installment_status", "paid")
          .gte("date", prevStartDate).lte("date", prevEndDate),
        // Income expenses in period (Bug 3)
        supabase.from("expenses").select("total")
          .eq("type", "income").gte("date", startDate).lte("date", endDate),
        // Income expenses in previous period (Bug 3)
        supabase.from("expenses").select("total")
          .eq("type", "income").gte("date", prevStartDate).lte("date", prevEndDate),
      ]);

      if (cancelled) return;

      setPaidServices((paidRes.data as ServiceRow[]) || []);
      setPrevPaidServices((prevPaidRes.data as ServiceRow[]) || []);

      // Merge regular expenses (exclude installment parents) + paid installment children
      const parentExps = ((expRes.data as ExpenseRow[]) || []).filter(e => !e.installment_total);
      const paidChildExps = (expChildRes.data as ExpenseRow[]) || [];
      setExpenses([...parentExps, ...paidChildExps]);

      const prevParentExps = ((prevExpRes.data as ExpenseRow[]) || []).filter(e => !e.installment_total);
      const prevPaidChildExps = (prevExpChildRes.data as ExpenseRow[]) || [];
      setPrevExpenses([...prevParentExps, ...prevPaidChildExps]);
      setActiveServices((activeRes.data as ServiceRow[]) || []);
      setPendingParts(pendingPartsRes.count || 0);
      setAllPeriodServices((allServicesRes.data as ServiceRow[]) || []);
      setPrevAllServices((prevAllServicesRes.data as ServiceRow[]) || []);

      // Low inventory: filter client-side
      const invProducts = (lowInvRes.data || []) as { id: string; stock_current: number; stock_minimum: number }[];
      setLowInventory(invProducts.filter(p => p.stock_current < p.stock_minimum).length);

      const allEmployees = (mechanicsRes.data as MechanicRow[]) || [];
      const EXCLUDED_SOCIOS = ["8c180599-280f-4d0b-9d20-414c514d6b0a", "cec70688-a224-443e-9802-0fa0833bad66"];
      setMechanics(allEmployees.filter(e => (e.role === "mechanic" || e.role === "owner") && !EXCLUDED_SOCIOS.includes(e.id)));
      setAdminStaff(allEmployees.filter(e => e.role === "admin"));
      setPayrollData((payrollRes.data as PayrollRow[]) || []);
      setRecentExpenses((recentExpRes.data as ExpenseRow[]) || []);
      setIncomeExpensesTotal(((incomeExpRes.data || []) as { total: number }[]).reduce((s, e) => s + (e.total || 0), 0));
      setPrevIncomeExpensesTotal(((prevIncomeExpRes.data || []) as { total: number }[]).reduce((s, e) => s + (e.total || 0), 0));

      // Fetch service_workers for active services
      const activeIds = ((activeRes.data as ServiceRow[]) || []).map(s => s.id);
      if (activeIds.length > 0) {
        const { data: sw } = await supabase.from("service_workers").select("service_id, employee_id").in("service_id", activeIds);
        if (!cancelled) setServiceWorkers(sw || []);
      } else {
        setServiceWorkers([]);
      }

      // Fetch service_workers for paid services (for mechanic ROI)
      const paidIds = ((paidRes.data as ServiceRow[]) || []).map(s => s.id);
      if (paidIds.length > 0) {
        const { data: psw } = await supabase.from("service_workers").select("service_id, employee_id").in("service_id", paidIds);
        if (!cancelled) setPaidServiceWorkers(psw || []);
      } else {
        setPaidServiceWorkers([]);
      }

      setLoading(false);

      // Fetch interpretame usage
      const { data: usageData } = await supabase
        .from("usage_limits")
        .select("count, updated_at")
        .eq("feature", "interpretame")
        .maybeSingle();
      if (!cancelled) {
        const totalUsed = usageData?.count ?? 0;
        const lastUsed = usageData?.updated_at ? new Date(usageData.updated_at) : null;
        const remaining = Math.max(0, 10 - totalUsed);
        const diasDesdeUltimoUso = lastUsed
          ? Math.floor((Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        setInterpretameRemaining(remaining);
        setInterpretamePuedeUsar(remaining > 0 && diasDesdeUltimoUso >= 21);
        if (remaining > 0 && diasDesdeUltimoUso < 21 && lastUsed) {
          setInterpretameNextDate(
            new Date(lastUsed.getTime() + 21 * 24 * 60 * 60 * 1000)
              .toLocaleDateString("es-MX", { day: "numeric", month: "long" })
          );
        } else {
          setInterpretameNextDate(null);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [period.start.getTime(), period.end.getTime()]);

  /* ─── Fetch trend data (grouped by agrupacion within date range) ─── */

  useEffect(() => {
    let cancelled = false;
    async function fetchTrend() {
      const ranges = generateTrendRanges(period.start, period.end, agrupacion);
      if (ranges.length === 0) { setTrendData([]); return; }

      const fullStart = ranges[0].start.toISOString();
      const lastEnd = ranges[ranges.length - 1].end;
      const dayAfterEnd = new Date(lastEnd.getFullYear(), lastEnd.getMonth(), lastEnd.getDate() + 1);
      const fullEnd = dayAfterEnd.toISOString();
      const fullStartDate = ranges[0].start.toISOString().slice(0, 10);
      const fullEndDate = ranges[ranges.length - 1].end.toISOString().slice(0, 10);

      const [paidRes, expRes, expChildRes, trendIncomeRes] = await Promise.all([
        supabase.from("services_with_totals").select("paid_at, total_client").not("paid_at", "is", null)
          .gte("paid_at", fullStart).lte("paid_at", fullEnd),
        supabase.from("expenses").select("date, total, installment_total")
          .eq("type", "expense").is("parent_expense_id", null)
          .gte("date", fullStartDate).lte("date", fullEndDate)
          .or("is_recurring.eq.false,recurring_parent_id.not.is.null"),
        supabase.from("expenses").select("date, total")
          .eq("type", "expense").not("parent_expense_id", "is", null).eq("installment_status", "paid")
          .gte("date", fullStartDate).lte("date", fullEndDate),
        supabase.from("expenses").select("date, total")
          .eq("type", "income").gte("date", fullStartDate).lte("date", fullEndDate),
      ]);

      if (cancelled) return;

      const allPaid = (paidRes.data || []) as { paid_at: string; total_client: number }[];
      const allIncomeExp = (trendIncomeRes.data || []) as { date: string; total: number }[];
      const trendParents = ((expRes.data || []) as { date: string; total: number; installment_total: number | null }[])
        .filter(e => !e.installment_total);
      const trendChildren = (expChildRes.data || []) as { date: string; total: number }[];
      const allExp = [...trendParents, ...trendChildren] as { date: string; total: number }[];

      const points: { label: string; ingresos: number; gastos: number; utilidad: number }[] = [];
      for (const r of ranges) {
        const rStartT = r.start.getTime();
        const rEndT = r.end.getTime();
        const svcIngresos = allPaid
          .filter(s => { const t = new Date(s.paid_at).getTime(); return t >= rStartT && t <= rEndT; })
          .reduce((acc, s) => acc + (s.total_client || 0), 0);
        const incIngresos = allIncomeExp
          .filter(e => { const t = new Date(e.date + "T12:00:00").getTime(); return t >= rStartT && t <= rEndT; })
          .reduce((acc, e) => acc + (e.total || 0), 0);
        const ing = svcIngresos + incIngresos;
        const gas = allExp
          .filter(e => { const t = new Date(e.date + "T12:00:00").getTime(); return t >= rStartT && t <= rEndT; })
          .reduce((acc, e) => acc + (e.total || 0), 0);
        points.push({ label: r.label, ingresos: ing, gastos: gas, utilidad: ing - gas });
      }

      if (!cancelled) setTrendData(points);
    }

    fetchTrend();
    return () => { cancelled = true; };
  }, [period.start.getTime(), period.end.getTime(), agrupacion]);

  /* ─── Computed metrics ─── */

  const paidServicesTotal = useMemo(() => paidServices.reduce((s, t) => s + (t.total_client || 0), 0), [paidServices]);
  const ingresos = paidServicesTotal + incomeExpensesTotal;
  const prevPaidServicesTotal = useMemo(() => prevPaidServices.reduce((s, t) => s + (t.total_client || 0), 0), [prevPaidServices]);
  const prevIngresos = prevPaidServicesTotal + prevIncomeExpensesTotal;
  const gastos = useMemo(() => expenses.reduce((s, e) => s + (e.total || 0), 0), [expenses]);
  const prevGastos = useMemo(() => prevExpenses.reduce((s, e) => s + (e.total || 0), 0), [prevExpenses]);
  const utilidad = ingresos - gastos;
  const prevUtilidad = prevIngresos - prevGastos;
  const serviciosCompletados = paidServices.length;
  const prevServiciosCompletados = prevPaidServices.length;
  const costoTotalMecanicos = useMemo(() =>
    payrollData.reduce((s, p) => s + (p.net_payment || 0), 0),
  [payrollData]);
  const diasHabiles = Math.max(1, Math.ceil((period.end.getTime() - period.start.getTime()) / 86400000));
  const totalEgresosGlobal = gastos + costoTotalMecanicos;
  const costoFijoDia = totalEgresosGlobal / diasHabiles;
  const margenBrutoPct = ingresos > 0 ? (ingresos - totalEgresosGlobal) / ingresos : 0;
  const breakevenDiario = margenBrutoPct > 0 ? costoFijoDia / margenBrutoPct : 0;
  const prevTotalEgresosGlobal = prevGastos; // prev payroll not available
  const prevCostoFijoDia = prevTotalEgresosGlobal / diasHabiles;

  const ingDelta = calcDelta(ingresos, prevIngresos);
  const gasDelta = calcDelta(gastos, prevGastos);
  const svcDelta = calcDelta(serviciosCompletados, prevServiciosCompletados);
  const costDelta = calcDelta(costoFijoDia, prevCostoFijoDia);
  const utilDelta = calcDelta(utilidad, prevUtilidad);

  // Expense by group
  const expenseByGroup = useMemo(() => {
    const groups = new Map<string, number>();
    for (const e of expenses) {
      const group = e.expense_categories?.expense_group || "Sin grupo";
      groups.set(group, (groups.get(group) || 0) + (e.total || 0));
    }
    return Array.from(groups.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // Expense by category for desglose table
  const expenseByCategory = useMemo(() => {
    const cats = new Map<string, number>();
    for (const e of expenses) {
      const cat = e.expense_categories?.name || "Sin categoría";
      cats.set(cat, (cats.get(cat) || 0) + (e.total || 0));
    }
    return Array.from(cats.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  // Operación tab metrics
  const cobrado = ingresos;
  const gastado = gastos;
  const porCobrar = useMemo(() =>
    activeServices.filter(s => (s.total_client || 0) > 0).reduce((acc, s) => acc + (s.total_client || 0), 0),
  [activeServices]);
  const enProceso = useMemo(() => activeServices.length, [activeServices]);

  // Embudo
  const cotizaciones = useMemo(() => ({
    count: allPeriodServices.length,
    total: allPeriodServices.reduce((s, t) => s + (t.total_client || 0), 0),
  }), [allPeriodServices]);

  const completados = useMemo(() => ({
    count: paidServices.length,
    total: paidServices.reduce((s, t) => s + (t.total_client || 0), 0),
  }), [paidServices]);

  const aprobados = useMemo(() => {
    const approved = allPeriodServices.filter(s => s.status !== "invalid" && s.stage_id !== "s1");
    return { count: approved.length, total: approved.reduce((s, t) => s + (t.total_client || 0), 0) };
  }, [allPeriodServices]);

  const noAprobados = useMemo(() => {
    const na = allPeriodServices.filter(s => (s.status === "archived" || s.status === "invalid") && !s.paid_at);
    return { count: na.length, total: na.reduce((s, t) => s + (t.total_client || 0), 0) };
  }, [allPeriodServices]);

  // Refaccionaria
  const ventaRefacciones = useMemo(() => paidServices.reduce((s, t) => s + (t.parts_client || 0), 0), [paidServices]);
  const prevVentaRefacciones = useMemo(() => prevPaidServices.reduce((s, t) => s + (t.parts_client || 0), 0), [prevPaidServices]);
  const costoRefacciones = useMemo(() => paidServices.reduce((s, t) => s + (t.parts_cost || 0), 0), [paidServices]);
  const prevCostoRefacciones = useMemo(() => prevPaidServices.reduce((s, t) => s + (t.parts_cost || 0), 0), [prevPaidServices]);
  const gananciaRefacciones = ventaRefacciones - costoRefacciones;
  const prevGananciaRefacciones = prevVentaRefacciones - prevCostoRefacciones;
  const margenRefacciones = ventaRefacciones > 0 ? Math.round((gananciaRefacciones / ventaRefacciones) * 100) : 0;
  const prevMargenRefacciones = prevVentaRefacciones > 0 ? Math.round((prevGananciaRefacciones / prevVentaRefacciones) * 100) : 0;

  // Mano de obra
  const moTotal = useMemo(() => paidServices.reduce((s, t) => s + (t.labor || 0), 0), [paidServices]);
  const prevMoTotal = useMemo(() => prevPaidServices.reduce((s, t) => s + (t.labor || 0), 0), [prevPaidServices]);
  const ticketPromedio = serviciosCompletados > 0 ? ingresos / serviciosCompletados : 0;
  const prevTicketPromedio = prevServiciosCompletados > 0 ? prevIngresos / prevServiciosCompletados : 0;
  const roiMO = costoTotalMecanicos > 0 ? moTotal / costoTotalMecanicos : 0;

  // Trend chart insight
  const trendInsight = useMemo(() => {
    if (trendData.length < 2) return "";
    let consecutiveUp = 0;
    for (let i = trendData.length - 1; i > 0; i--) {
      if (trendData[i].utilidad > trendData[i - 1].utilidad) consecutiveUp++;
      else break;
    }
    if (consecutiveUp >= 2) return `La utilidad lleva ${consecutiveUp} periodos al alza`;
    const lastTwo = trendData.slice(-2);
    if (lastTwo[1].utilidad < lastTwo[0].utilidad) return "La utilidad bajó en el último periodo";
    return "Tendencia de ingresos, gastos y utilidad";
  }, [trendData]);

  // Expense chart insight
  const expenseInsight = useMemo(() => {
    if (expenseByGroup.length === 0) return "Sin gastos en este periodo";
    const total = expenseByGroup.reduce((s, [, v]) => s + v, 0);
    if (total === 0) return "Sin gastos en este periodo";
    const top2 = expenseByGroup.slice(0, 2);
    const top2Total = top2.reduce((s, [, v]) => s + v, 0);
    const pct = Math.round((top2Total / total) * 100);
    const names = top2.map(([name]) => name).join(" y ");
    return `${names} concentran el ${pct}% del gasto`;
  }, [expenseByGroup]);

  // Acumulado anual
  const showAcumulado = dateRange === "este-año";
  const acumuladoAnual = useMemo(() => {
    if (!showAcumulado) return { revenue: 0, monthsElapsed: 0, projection: 0 };
    const monthsElapsed = new Date().getMonth() + 1;
    const revenue = ingresos;
    const projection = monthsElapsed > 0 ? Math.round((revenue / monthsElapsed) * 12) : 0;
    return { revenue, monthsElapsed, projection };
  }, [showAcumulado, ingresos]);

  // Period days for expense desglose
  const periodDays = useMemo(() => {
    return Math.max(1, Math.ceil((period.end.getTime() - period.start.getTime()) / 86400000));
  }, [period]);

  /* ─── Utility insight ─── */
  const utilInsight = useMemo(() => {
    if (utilidad > prevUtilidad && prevUtilidad > 0) return "Mejor periodo comparado con el anterior";
    if (utilidad < prevUtilidad && prevUtilidad > 0) return "La utilidad bajó respecto al periodo anterior";
    if (utilidad > 0) return "Utilidad positiva en este periodo";
    if (utilidad < 0) return "El taller operó con pérdida en este periodo";
    return "";
  }, [utilidad, prevUtilidad]);

  /* ─── Loading ─── */
  if (loading) {
    return (
      <main className="flex-1 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-5 h-5 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
        </div>
      </main>
    );
  }

  /* ─── Render helpers ─── */

  function DeltaBadge({ delta, invertColor = false }: { delta: ReturnType<typeof calcDelta>; invertColor?: boolean }) {
    if (delta.direction === "flat") return <span className="text-[11px] text-[#999999]">--</span>;
    const isUp = delta.direction === "up";
    const isGood = invertColor ? !isUp : isUp;
    const color = isGood ? "#0c8c5e" : "#ee0000";
    return (
      <span className="text-[11px] font-medium" style={{ color }}>
        {isUp ? "+" : "-"}{delta.pct}%
      </span>
    );
  }

  function KPICard({ label, value, delta, invertColor = false }: { label: string; value: string; delta?: ReturnType<typeof calcDelta>; invertColor?: boolean }) {
    return (
      <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
        <div className="text-[11px] text-[#999999] mb-1">{label}</div>
        <div className="text-[18px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{value}</div>
        {delta && <DeltaBadge delta={delta} invertColor={invertColor} />}
      </div>
    );
  }

  /* ─── Tab: General (resumen) ─── */
  function renderResumen() {
    // Flujo libre = ingresos - gastos totales (expenses + nómina)
    const totalEgresos = gastos + costoTotalMecanicos;
    const flujoLibre = ingresos - totalEgresos;
    const prevFlujoLibre = prevIngresos - prevGastos; // prev payroll not available
    const flujoLibreDelta = calcDelta(flujoLibre, prevFlujoLibre);

    // OMTM metrics
    const margenBruto = ingresos > 0 ? Math.round((flujoLibre / ingresos) * 100) : 0;
    const nominaPct = ingresos > 0 ? Math.round((costoTotalMecanicos / ingresos) * 100) : 0;
    const gastosFijosPct = ingresos > 0 ? Math.round((gastos / ingresos) * 100) : 0;

    // Trend title
    let consecutiveUp = 0;
    for (let i = trendData.length - 1; i > 0; i--) {
      if (trendData[i].utilidad > trendData[i - 1].utilidad) consecutiveUp++;
      else break;
    }
    const isUpTrend = trendData.length >= 2 && trendData[trendData.length - 1].utilidad > trendData[trendData.length - 2].utilidad;
    const trendTitle = isUpTrend
      ? `Flujo libre al alza — ${consecutiveUp} periodos consecutivos`
      : "Tendencia en revisión";

    // Buffett bar data
    const buffettMetas: Record<string, number> = {
      "Nómina": 30, "Local": 25, "Administración": 15,
      "Personal": 5, "Operación": 5,
    };
    const barColors = ["#0f172a", "#334155", "#64748b", "#94a3b8", "#cbd5e1"];

    const buffettItems: { label: string; amount: number; pct: number; meta: number }[] = [];

    if (costoTotalMecanicos > 0) {
      const pct = ingresos > 0 ? Math.round((costoTotalMecanicos / ingresos) * 100) : 0;
      buffettItems.push({ label: "Nómina", amount: costoTotalMecanicos, pct, meta: 30 });
    }

    for (const [group, amount] of expenseByGroup) {
      const pct = ingresos > 0 ? Math.round((amount / ingresos) * 100) : 0;
      buffettItems.push({ label: group, amount, pct, meta: buffettMetas[group] ?? 10 });
    }

    buffettItems.sort((a, b) => b.amount - a.amount);
    const totalCostos = buffettItems.reduce((s, i) => s + i.amount, 0);
    const totalCostosPct = ingresos > 0 ? Math.round((totalCostos / ingresos) * 100) : 0;

    return (
      <>
        {/* 1. HERO GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Card 1: Flujo libre (hero primary) */}
          <div className="rounded-lg p-6" style={{ backgroundColor: "#1e293b" }}>
            <div className="text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: "#64748b" }}>
              Flujo libre
              <ChartTooltip text={`Lo que quedó en la caja después de pagar todo. Fórmula: Ingresos − Gastos − Nómina. Este mes: ${fc(ingresos)} − ${fc(gastos)} − ${fc(costoTotalMecanicos)} = ${fc(flujoLibre)}`} />
            </div>
            <div
              className="text-[32px] font-bold"
              style={{ color: "#f1f5f9", fontVariantNumeric: "tabular-nums" }}
            >
              {fmtCurrency(flujoLibre)}
            </div>
            <div className="mt-1">
              <DeltaBadge delta={flujoLibreDelta} />
              <span className="text-[10px] ml-1.5" style={{ color: "#64748b" }}>
                vs periodo anterior
              </span>
            </div>
            <div className="my-3" style={{ borderTop: "1px solid rgba(255,255,255,.08)" }} />
            <div
              className="grid grid-cols-2 gap-3 rounded-md p-3"
              style={{ backgroundColor: "rgba(255,255,255,.05)" }}
            >
              <div>
                <div className="text-[10px]" style={{ color: "#64748b" }}>Ingresos</div>
                <div className="text-[15px] font-semibold" style={{ color: "#cbd5e1", fontVariantNumeric: "tabular-nums" }}>
                  {fmtCurrency(ingresos)}
                </div>
              </div>
              <div>
                <div className="text-[10px]" style={{ color: "#64748b" }}>Egresos</div>
                <div className="text-[15px] font-semibold" style={{ color: "#cbd5e1", fontVariantNumeric: "tabular-nums" }}>
                  {fmtCurrency(totalEgresos)}
                </div>
              </div>
            </div>
            {utilInsight && (
              <div className="text-[11px] italic mt-3" style={{ color: "#475569" }}>
                {utilInsight}
              </div>
            )}
          </div>

          {/* Card 2: Ticket promedio + Servicios completados */}
          <div className="bg-white border border-[#eaeaea] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Ticket promedio <ChartTooltip text={`Cuánto pagó en promedio cada cliente este mes. Fórmula: Ingresos ÷ Servicios completados. Este mes: ${fc(ingresos)} ÷ ${serviciosCompletados} = ${fc(ticketPromedio)}`} /></div>
              <div className="text-[22px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                {fmtCurrency(ticketPromedio)}
              </div>
              <DeltaBadge delta={calcDelta(ticketPromedio, prevTicketPromedio)} />
            </div>
            <div className="my-3 border-t border-[#eaeaea]" />
            <div>
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Servicios completados <ChartTooltip text={`Servicios que ya fueron cobrados y pagados este mes. Este mes: ${serviciosCompletados} servicios por ${fc(ingresos)} total.`} /></div>
              <div className="text-[22px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                {serviciosCompletados}
              </div>
              <DeltaBadge delta={svcDelta} />
            </div>
          </div>

          {/* Card 3: Costo fijo / día + Break-even diario */}
          <div className="bg-white border border-[#eaeaea] rounded-lg p-5 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Costo fijo / día <ChartTooltip text={`Cuánto cuesta operar el taller por día sin importar si entra trabajo.\nFórmula: (Gastos + Nómina) ÷ días hábiles\nEste mes: (${fc(gastos)} + ${fc(costoTotalMecanicos)}) ÷ ${diasHabiles} días = ${fc(costoFijoDia)}/día`} /></div>
              <div className="text-[22px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                {fmtCurrency(costoFijoDia)}
              </div>
              <DeltaBadge delta={costDelta} invertColor />
            </div>
            <div className="my-3 border-t border-[#eaeaea]" />
            <div>
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Break-even diario <ChartTooltip text={`Cuánto necesitas cobrar al día mínimo para no perder dinero.\nFórmula: Costo fijo/día ÷ Margen bruto\nEste mes: ${fc(costoFijoDia)} ÷ ${margenBruto}% = ${fc(breakevenDiario)}/día\nSi un día cobras menos que esto, ese día el taller perdió.`} /></div>
              <div className="text-[22px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
                {fmtCurrency(breakevenDiario)}
              </div>
              <span className="text-[11px] text-[#999999]">&nbsp;</span>
            </div>
          </div>
        </div>

        {/* 2. OMTM STRIP */}
        <div className="print-section-title print-only">INDICADORES CLAVE</div>
        <div className="bg-white border border-[#eaeaea] rounded-lg px-5 py-3 mb-6 flex items-center flex-wrap gap-y-2">
          <div className="flex items-center gap-0 flex-1 min-w-0">
            <div className="flex-1 min-w-[100px]">
              <div className="text-[10px] text-[#999999] mb-0.5 flex items-center gap-1">Margen bruto <ChartTooltip text={`De cada $100 que entran, cuántos quedan después de pagar todo. Fórmula: Flujo libre ÷ Ingresos × 100. Este mes: ${fc(flujoLibre)} ÷ ${fc(ingresos)} × 100 = ${margenBruto}%. Meta: arriba de 35%.`} /></div>
              <div
                className="text-[15px] font-semibold"
                style={{ color: margenBruto >= 35 ? "#0c8c5e" : "#d97706", fontVariantNumeric: "tabular-nums" }}
              >
                {margenBruto}%
              </div>
            </div>
            <div className="w-px h-8 bg-[#eaeaea] mx-3" />
            <div className="flex-1 min-w-[100px]">
              <div className="text-[10px] text-[#999999] mb-0.5 flex items-center gap-1">Nómina / ingresos <ChartTooltip text={`Qué porcentaje de lo que cobras se va en nómina. Fórmula: Nómina ÷ Ingresos × 100. Este mes: ${fc(costoTotalMecanicos)} ÷ ${fc(ingresos)} × 100 = ${nominaPct}%. Meta: menos del 30%.`} /></div>
              <div
                className="text-[15px] font-semibold"
                style={{ color: nominaPct <= 30 ? "#0c8c5e" : "#d97706", fontVariantNumeric: "tabular-nums" }}
              >
                {nominaPct}%
              </div>
            </div>
            <div className="w-px h-8 bg-[#eaeaea] mx-3" />
            <div className="flex-1 min-w-[100px]">
              <div className="text-[10px] text-[#999999] mb-0.5 flex items-center gap-1">Gastos fijos / ingresos <ChartTooltip text={`Qué porcentaje de lo que cobras se va en gastos fijos. Fórmula: Gastos ÷ Ingresos × 100. Este mes: ${fc(gastos)} ÷ ${fc(ingresos)} × 100 = ${gastosFijosPct}%. Meta: menos del 35%.`} /></div>
              <div
                className="text-[15px] font-semibold"
                style={{ color: gastosFijosPct <= 35 ? "#0c8c5e" : "#d97706", fontVariantNumeric: "tabular-nums" }}
              >
                {gastosFijosPct}%
              </div>
            </div>
            <div className="w-px h-8 bg-[#eaeaea] mx-3" />
            <div className="flex-1 min-w-[100px]">
              <div className="text-[10px] text-[#999999] mb-0.5 flex items-center gap-1">ROI mano de obra <ChartTooltip text={`Por cada $1 en nómina, cuánto generaron en MO cobrada. Fórmula: MO total ÷ Nómina. Este mes: ${fc(moTotal)} ÷ ${fc(costoTotalMecanicos)} = ${roiMO.toFixed(1)}x. Meta: 1.5x mínimo, 2x ideal.`} /></div>
              <div
                className="text-[15px] font-semibold"
                style={{ color: roiMO >= 1.5 ? "#0c8c5e" : "#d97706", fontVariantNumeric: "tabular-nums" }}
              >
                {roiMO.toFixed(1)}x
              </div>
            </div>
          </div>
          <div className="text-[10px] ml-4" style={{ color: "#94a3b8" }}>
            Objetivos: margen &gt;35% · nómina &lt;30% · gastos &lt;35%
          </div>
        </div>

        {/* 3. CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 mb-6">
          {/* Trend chart */}
          <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-foreground">{trendTitle}</span>
              <ChartTooltip text={`Compara los últimos 6 períodos. Línea negra = ingresos, gris = egresos, verde = flujo libre. Último período: Ingresos ${fc(ingresos)}, Egresos ${fc(totalEgresos)}, Flujo ${fc(flujoLibre)}.`} />
            </div>
            <div className="text-[11px] text-[#999999] mb-2">
              Ingresos, egresos y flujo libre — por {agrupacion === "dia" ? "día" : agrupacion}
            </div>
            {trendData.length > 0 ? (
              <Plot
                data={[
                  { x: trendData.map(d => d.label), y: trendData.map(d => d.utilidad), type: "scatter", mode: "lines+markers", name: "Flujo libre", line: { color: "#0a7c52", width: 2.5 }, marker: { size: 6, color: "#0a7c52" }, fill: "tozeroy", fillcolor: "rgba(10,124,82,0.06)", hovertemplate: "$%{y:,.2f}<extra></extra>" },
                  { x: trendData.map(d => d.label), y: trendData.map(d => d.ingresos), type: "scatter", mode: "lines+markers", name: "Ingresos", line: { color: "#0a0a0a", width: 2.5 }, marker: { size: 6, color: "#0a0a0a" }, hovertemplate: "$%{y:,.2f}<extra></extra>" },
                  { x: trendData.map(d => d.label), y: trendData.map(d => d.gastos), type: "scatter", mode: "lines+markers", name: "Egresos", line: { color: "#94a3b8", width: 1.5, dash: "dot" }, marker: { size: 4, color: "#94a3b8" }, hovertemplate: "$%{y:,.2f}<extra></extra>" },
                ]}
                layout={{ ...plotLayout, height: 260, legend: { orientation: "h", y: -0.2, x: 0.5, xanchor: "center" } }}
                config={plotConfig}
                style={{ width: "100%", height: 260 }}
              />
            ) : (
              <div className="flex items-center justify-center h-[260px] text-[13px] text-[#999999]">
                Sin datos en este periodo
              </div>
            )}
          </div>

          {/* Expense by group chart */}
          <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-foreground">¿En qué se va el dinero?</span>
              <ChartTooltip text={`En qué se fue el dinero este mes. Total gastos: ${fc(gastos)} en ${expenseByGroup.length} categorías. Cada barra muestra una categoría y su peso sobre el total.`} />
            </div>
            <div className="text-[11px] text-[#999999] mb-2">
              Gastos como % de ingresos
            </div>
            {expenseByGroup.length > 0 ? (
              <Plot
                data={[{
                  y: expenseByGroup.map(([name]) => name),
                  x: expenseByGroup.map(([, val]) => val),
                  type: "bar",
                  orientation: "h",
                  marker: {
                    color: expenseByGroup.map(([, val]) => {
                      const total = expenseByGroup.reduce((s, [, v]) => s + v, 0);
                      const pct = total > 0 ? val / total : 0;
                      const alpha = Math.max(0.3, pct);
                      return `rgba(239, 68, 68, ${alpha})`;
                    }),
                  },
                  text: expenseByGroup.map(([, val]) => fmtCurrency(val)),
                  textposition: "outside",
                  hoverinfo: "y+text",
                }]}
                layout={{ ...plotLayout, height: 260, yaxis: { automargin: true }, xaxis: { showticklabels: false } }}
                config={plotConfig}
                style={{ width: "100%", height: 260 }}
              />
            ) : (
              <div className="flex items-center justify-center h-[260px] text-[13px] text-[#999999]">
                Sin datos en este periodo
              </div>
            )}
          </div>
        </div>

        {/* 4. BUFFETT BAR */}
        <div className="print-section-title print-only">ESTRUCTURA DE COSTOS</div>
        <div className="bg-white border border-[#eaeaea] rounded-lg p-5 mb-6">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-foreground">Estructura de costos</span>
            <ChartTooltip text={`Cada costo como % de ingresos. Total costos: ${fc(totalCostos)} = ${totalCostosPct}% de ${fc(ingresos)}. Verde = dentro de la meta. Naranja = vigilar. Rojo = fuera de control. Objetivo: total < 65%.`} />
          </div>
          <div className="text-[11px] text-[#999999] mb-4">
            ¿Los costos crecen más rápido que los ingresos? Objetivo: total costos &lt; 65% de ingresos.
          </div>

          <div className="space-y-3">
            {buffettItems.map((item, i) => {
              const barWidth = Math.min(100, item.pct * (100 / 65));
              const overMeta = item.pct > item.meta;
              return (
                <div key={item.label} className="grid grid-cols-[90px_1fr_50px_60px] items-center gap-3">
                  <div className="text-[12px] text-foreground truncate">{item.label}</div>
                  <div className="h-5 rounded bg-[#f5f5f5] overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: barColors[Math.min(i, barColors.length - 1)],
                      }}
                    />
                  </div>
                  <div
                    className="text-[12px] font-semibold text-right"
                    style={{ color: overMeta ? "#d97706" : "#0c8c5e", fontVariantNumeric: "tabular-nums" }}
                  >
                    {item.pct}%
                  </div>
                  <div className="text-[10px] text-right" style={{ color: "#94a3b8" }}>
                    &lt;{item.meta}%
                  </div>
                </div>
              );
            })}

            {buffettItems.length > 0 && (
              <div className="border-t border-[#eaeaea] pt-3">
                <div className="grid grid-cols-[90px_1fr_50px_60px] items-center gap-3">
                  <div className="text-[12px] font-semibold text-foreground">Total costos</div>
                  <div className="h-5 rounded bg-[#f5f5f5] overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${Math.min(100, totalCostosPct * (100 / 65))}%`,
                        backgroundColor: totalCostosPct < 65 ? "#0c8c5e" : totalCostosPct <= 75 ? "#d97706" : "#ee0000",
                      }}
                    />
                  </div>
                  <div
                    className="text-[12px] font-semibold text-right"
                    style={{
                      color: totalCostosPct < 65 ? "#0c8c5e" : totalCostosPct <= 75 ? "#d97706" : "#ee0000",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {totalCostosPct}%
                  </div>
                  <div className="text-[10px] text-right" style={{ color: "#94a3b8" }}>&lt;65%</div>
                </div>
              </div>
            )}

            {buffettItems.length === 0 && (
              <div className="text-center text-[13px] text-[#999999] py-4">
                Sin datos de costos en este periodo
              </div>
            )}
          </div>
        </div>

        {/* 5. ANNUAL BAR */}
        {showAcumulado && (
          <div className="bg-white border border-[#eaeaea] rounded-lg p-5 mb-6">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[13px] font-semibold text-foreground">Acumulado anual</span>
              <ChartTooltip text={`Ingresos acumulados en el año. YTD: ${fc(acumuladoAnual.revenue)} en ${acumuladoAnual.monthsElapsed} meses. Proyección anual: ${fc(acumuladoAnual.projection)} (ritmo actual × 12).`} />
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div>
                <div className="text-[11px] text-[#999999]">Ingresos YTD</div>
                <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmtCurrency(acumuladoAnual.revenue)}
                </div>
              </div>
              <div className="flex-1 min-w-[120px]">
                <div className="text-[11px] text-[#999999] mb-1">
                  Progreso ({acumuladoAnual.monthsElapsed}/12 meses)
                </div>
                <div className="h-2 bg-[#f5f5f5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${(acumuladoAnual.monthsElapsed / 12) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#999999]">Proyección anual</div>
                <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {fmtCurrency(acumuladoAnual.projection)}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-[#999999]">Meta</div>
                <div className="text-[13px] text-[#999999] italic">Aún sin definir</div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  /* ─── Tab: Detalle (operación) ─── */
  function renderOperacion() {
    return (
      <>
        {/* Resumen del periodo */}
        <div className="stitle">Resumen del período</div>
        <div className="ssubtitle">Flujo de caja y servicios activos</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
            <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Cobrado <ChartTooltip text={`Total cobrado a clientes por servicios completados + ingresos extra en el período.\nEste mes: ${fc(cobrado)}`} /></div>
            <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: "#0c8c5e" }}>{fmtCurrency(cobrado)}</div>
          </div>
          <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
            <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Gastado <ChartTooltip text={`Total de gastos operativos registrados en el período (excluye nómina).\nEste mes: ${fc(gastado)} en ${expenses.length} registros.`} /></div>
            <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(gastado)}</div>
          </div>
          <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
            <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Por cobrar <ChartTooltip text={`Servicios terminados que el cliente todavía no ha pagado. Este mes: ${activeServices.filter(s => (s.total_client || 0) > 0).length} servicios por ${fc(porCobrar)}.`} /></div>
            <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: "#ee0000" }}>{fmtCurrency(porCobrar)}</div>
          </div>
          <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
            <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">En proceso <ChartTooltip text={`Servicios actualmente en el taller, aún sin terminar. Este mes: ${enProceso} servicios activos.`} /></div>
            <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{enProceso}</div>
          </div>
        </div>

        {/* Alertas */}
        <div className="stitle">Alertas operativas</div>
        <div className="ssubtitle">Elementos que requieren atención</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className={`border rounded-lg p-4 ${pendingParts > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
            <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Refacciones pendientes <ChartTooltip text={`Refacciones marcadas como "pendiente de compra" en servicios activos.\n\nEstas piezas ya fueron prometidas al cliente pero aún no se han comprado.\nEntre más alto este número, más servicios están bloqueados esperando refacciones.`} /></div>
            <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: pendingParts > 0 ? "#d97706" : "#0c8c5e" }}>{pendingParts}</div>
            <div className="text-[11px] text-[#999999] mt-1">{pendingParts > 0 ? "Requieren compra" : "Todo al día"}</div>
          </div>
          <div className={`border rounded-lg p-4 ${lowInventory > 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
            <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Inventario bajo <ChartTooltip text={`Productos en la Refaccionaria con stock igual o menor al mínimo configurado.\nReponer estos productos evita retrasos en servicios futuros.`} /></div>
            <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: lowInventory > 0 ? "#d97706" : "#0c8c5e" }}>{lowInventory}</div>
            <div className="text-[11px] text-[#999999] mt-1">{lowInventory > 0 ? `${lowInventory} productos bajo mínimo` : "Stock suficiente"}</div>
          </div>
          <div className={`border rounded-lg p-4 ${payrollData.length === 0 ? "bg-amber-50 border-amber-200" : "bg-green-50 border-green-200"}`}>
            <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Nómina <ChartTooltip text={`Total pagado a mecánicos y administrativos en el período.\nSolo incluye pagos ya ejecutados, sin contar a los socios.\nEste mes: ${fc(costoTotalMecanicos)} en ${payrollData.length} registros.`} /></div>
            <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: payrollData.length > 0 ? "#0c8c5e" : "#d97706" }}>
              {fmtCurrency(costoTotalMecanicos)}
            </div>
            <div className="text-[11px] text-[#999999] mt-1">
              {payrollData.length > 0 ? `${payrollData.length} registros en periodo` : "Sin registros en periodo"}
            </div>
          </div>
        </div>

        <div className="h-px bg-[#eaeaea] my-6" />

        {/* Embudo de servicios */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[13px] font-semibold text-foreground">Embudo de servicios</span>
            <ChartTooltip text={`De todos los servicios que entraron este mes, cuántos avanzaron hasta cobrarse. Este mes: ${cotizaciones.count} cotizaciones → ${aprobados.count} aprobados → ${completados.count} cobrados (${fc(completados.total)}). No aprobados: ${noAprobados.count}.`} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Cotizaciones <ChartTooltip text={`Todos los servicios creados en el período, estén en el estado que estén.\nRepresenta el volumen total de trabajo que entró al taller.`} /></div>
              <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{cotizaciones.count}</div>
              <div className="text-[11px] text-[#999999]" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(cotizaciones.total)}</div>
            </div>
            <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Aprobados <ChartTooltip text={`Servicios que el cliente aprobó y están en proceso o completados.\nSon los que avanzaron más allá de la cotización inicial.`} /></div>
              <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{aprobados.count}</div>
              <div className="text-[11px] text-[#999999]" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(aprobados.total)}</div>
            </div>
            <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Completados <ChartTooltip text={`Servicios terminados y cobrados en el período.`} /></div>
              <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: "#0c8c5e" }}>{completados.count}</div>
              <div className="text-[11px] text-[#999999]" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(completados.total)}</div>
            </div>
            <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">No aprobados <ChartTooltip text={`Servicios que no avanzaron — cancelados o sin respuesta del cliente.\nRepresenta oportunidad de ingreso no convertida.`} /></div>
              <div className="text-[18px] font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: "#ee0000" }}>{noAprobados.count}</div>
              <div className="text-[11px] text-[#999999]" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(noAprobados.total)}</div>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#eaeaea] my-6" />

        {/* Servicios activos table */}
        <div className="print-section-title print-only">DETALLE OPERATIVO</div>
        <div className="bg-white border border-[#eaeaea] rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-[#eaeaea]">
            <span className="text-[13px] font-semibold text-foreground">Servicios activos</span>
            <span className="text-[11px] text-[#999999] ml-1">({activeServices.filter(s => (s.total_client || 0) > 0).length})</span>
            <span className="ml-1"><ChartTooltip text={`Servicios en el taller con valor estimado. Este mes: ${activeServices.filter(s => (s.total_client || 0) > 0).length} servicios por ${fc(porCobrar)}. Margen verde (≥ 30%) = rentabilidad saludable.`} /></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#eaeaea] text-[#999999]">
                  <th className="text-left py-2 px-4 font-medium">Folio</th>
                  <th className="text-left py-2 px-4 font-medium">Cliente</th>
                  <th className="text-left py-2 px-4 font-medium">Vehículo</th>
                  <th className="text-right py-2 px-4 font-medium">Total</th>
                  <th className="text-right py-2 px-4 font-medium">Utilidad</th>
                  <th className="text-right py-2 px-4 font-medium">Margen</th>
                  <th className="text-left py-2 px-4 font-medium">Mecánico</th>
                  <th className="text-left py-2 px-4 font-medium">Tiempo</th>
                  <th className="text-left py-2 px-4 font-medium">Etiqueta</th>
                </tr>
              </thead>
              <tbody>
                {activeServices.filter(s => (s.total_client || 0) > 0).map(s => {
                  const worker = serviceWorkers.find(sw => sw.service_id === s.id);
                  const mech = worker ? mechanics.find(m => m.id === worker.employee_id) : null;
                  const marginPct = s.total_client > 0 ? Math.round(((s.total_profit || 0) / s.total_client) * 100) : 0;
                  return (
                    <tr key={s.id} className="border-b border-[#f5f5f5] hover:bg-[#fafafa]">
                      <td className="py-2 px-4 text-foreground font-medium">{s.folio}</td>
                      <td className="py-2 px-4 text-foreground">{s.client_name || "—"}</td>
                      <td className="py-2 px-4 text-[#666]">{[s.vehicle_brand, s.vehicle_model].filter(Boolean).join(" ") || "—"}</td>
                      <td className="py-2 px-4 text-right font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(s.total_client)}</td>
                      <td className="py-2 px-4 text-right" style={{ fontVariantNumeric: "tabular-nums", color: (s.total_profit || 0) >= 0 ? "#0c8c5e" : "#ee0000" }}>{fmt(s.total_profit)}</td>
                      <td className="py-2 px-4 text-right" style={{ fontVariantNumeric: "tabular-nums", color: marginPct >= 30 ? "#0c8c5e" : "#d97706" }}>
                        {marginPct}%
                      </td>
                      <td className="py-2 px-4 text-foreground">{mech?.alias || mech?.name || "—"}</td>
                      <td className="py-2 px-4 text-[#999999]">{timeSince(s.created_at)}</td>
                      <td className="py-2 px-4">
                        {s.stage_name ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-white" style={{ backgroundColor: s.stage_color || "#6b7280" }}>
                            {s.stage_name}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
                {activeServices.filter(s => (s.total_client || 0) > 0).length === 0 && (
                  <tr><td colSpan={9} className="py-6 text-center text-[#999999]">Sin servicios activos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="h-px bg-[#eaeaea] my-6" />

        {/* Refaccionaria */}
        <div className="print-section-title print-only">REFACCIONARIA</div>
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[13px] font-semibold text-foreground">Refaccionaria</span>
            <ChartTooltip text={`Refacciones cobradas este mes. Venta: ${fc(ventaRefacciones)}, Costo: ${fc(costoRefacciones)}, Ganancia: ${fc(gananciaRefacciones)}. Fórmula margen: (venta − costo) ÷ venta = ${margenRefacciones}%.`} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Venta refacciones <ChartTooltip text={`Total cobrado al cliente por refacciones usadas en servicios completados.\nEste mes: ${fc(ventaRefacciones)}`} /></div>
              <div className="text-[18px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(ventaRefacciones)}</div>
              <DeltaBadge delta={calcDelta(ventaRefacciones, prevVentaRefacciones)} />
            </div>
            <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Costo refacciones <ChartTooltip text={`Lo que pagaste a proveedores por esas mismas piezas.\nEste mes: ${fc(costoRefacciones)}`} /></div>
              <div className="text-[18px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(costoRefacciones)}</div>
              <DeltaBadge delta={calcDelta(costoRefacciones, prevCostoRefacciones)} invertColor />
            </div>
            <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Ganancia <ChartTooltip text={`Utilidad bruta sobre refacciones.\nFórmula: Venta − Costo\nEste mes: ${fc(ventaRefacciones)} − ${fc(costoRefacciones)} = ${fc(gananciaRefacciones)}`} /></div>
              <div className="text-[18px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(gananciaRefacciones)}</div>
              <DeltaBadge delta={calcDelta(gananciaRefacciones, prevGananciaRefacciones)} />
            </div>
            <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Margen <ChartTooltip text={`Qué tan rentables son las refacciones que vendes.\nFórmula: (Venta − Costo) ÷ Venta × 100\nEste mes: ${fc(ventaRefacciones)} − ${fc(costoRefacciones)} ÷ ${fc(ventaRefacciones)} × 100 = ${margenRefacciones}%\nMeta: arriba de 25%`} /></div>
              <div className="text-[18px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{`${margenRefacciones}%`}</div>
              <DeltaBadge delta={calcDelta(margenRefacciones, prevMargenRefacciones)} />
            </div>
          </div>
        </div>

        <div className="h-px bg-[#eaeaea] my-6" />

        {/* Mano de obra */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[13px] font-semibold text-foreground">Mano de obra</span>
            <ChartTooltip text={`MO cobrada en servicios completados. Este mes: ${fc(moTotal)} en ${serviciosCompletados} servicios. Ticket promedio: ${fc(ticketPromedio)}. ROI: ${fc(moTotal)} ÷ ${fc(costoTotalMecanicos)} = ${roiMO.toFixed(1)}x.`} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">MO total generada <ChartTooltip text={`Suma de lo cobrado por mano de obra en servicios completados.\nEste mes: ${fc(moTotal)} en ${serviciosCompletados} servicios.`} /></div>
              <div className="text-[18px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(moTotal)}</div>
              <DeltaBadge delta={calcDelta(moTotal, prevMoTotal)} />
            </div>
            <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">Ticket promedio MO <ChartTooltip text={`Cuánto genera en promedio cada servicio en mano de obra.\nFórmula: MO total ÷ servicios completados\nEste mes: ${fc(moTotal)} ÷ ${serviciosCompletados} = ${fc(ticketPromedio)}`} /></div>
              <div className="text-[18px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(ticketPromedio)}</div>
              <DeltaBadge delta={calcDelta(ticketPromedio, prevTicketPromedio)} />
            </div>
            <div className="bg-white border border-[#eaeaea] rounded-lg p-4">
              <div className="text-[11px] text-[#999999] mb-1 flex items-center gap-1">ROI nómina general <ChartTooltip text={`Por cada $1 pagado en nómina, cuánto generaron los mecánicos en trabajo cobrado.\nFórmula: MO total ÷ Nómina pagada\nEste mes: ${fc(moTotal)} ÷ ${fc(costoTotalMecanicos)} = ${roiMO.toFixed(1)}x\nMeta: mínimo 1.5x, ideal 2x`} /></div>
              <div className="text-[18px] font-semibold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>{`${roiMO.toFixed(1)}x`}</div>
            </div>
          </div>

          {/* Rendimiento por mecánico */}
          <div className="print-section-title print-only">RENDIMIENTO POR MECÁNICO</div>
          <div className="bg-white border border-[#eaeaea] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#eaeaea]">
              <span className="text-[13px] font-semibold text-foreground">Rendimiento por mecánico</span>
              <span className="ml-1.5"><ChartTooltip text={`Fórmula ROI: MO generada ÷ Nómina pagada. Nómina total: ${fc(costoTotalMecanicos)}, MO total: ${fc(moTotal)}. Meta: 1.5x mínimo, 2x ideal.`} /></span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#eaeaea] text-[#999999]">
                    <th className="text-left py-2 px-4 font-medium">Mecánico</th>
                    <th className="text-right py-2 px-4 font-medium">Servicios</th>
                    <th className="text-right py-2 px-4 font-medium">MO generada</th>
                    <th className="text-right py-2 px-4 font-medium">Ticket prom.</th>
                    <th className="text-right py-2 px-4 font-medium">Sueldo</th>
                    <th className="text-right py-2 px-4 font-medium">Comisiones</th>
                    <th className="text-right py-2 px-4 font-medium">Costo total</th>
                    <th className="text-right py-2 px-4 font-medium">Utilidad</th>
                    <th className="text-right py-2 px-4 font-medium">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {mechanics.map(mech => {
                    // Find paid services this mechanic worked on
                    const mechServiceIds = paidServiceWorkers.filter(sw => sw.employee_id === mech.id).map(sw => sw.service_id);
                    const mechPaidServices = paidServices.filter(s => mechServiceIds.includes(s.id));
                    const svcCount = mechPaidServices.length;
                    const moGenerada = mechPaidServices.reduce((s, t) => s + (t.labor || 0), 0);
                    const ticketProm = svcCount > 0 ? (moGenerada / svcCount) : 0;

                    // Payroll costs for this mechanic
                    const mechPayroll = payrollData.filter(p => p.employee_id === mech.id);
                    const sueldo = mechPayroll.reduce((s, p) => s + (p.base_salary || 0), 0);
                    const comisiones = mechPayroll.reduce((s, p) => s + (p.total_commission || 0), 0);
                    const costoTotal = mechPayroll.reduce((s, p) => s + (p.net_payment || 0), 0);
                    const utilidadMech = moGenerada - costoTotal;
                    const roi = costoTotal > 0 ? moGenerada / costoTotal : 0;

                    const roiColor = roi >= 2 ? "#0c8c5e" : roi >= 1.5 ? "#d97706" : "#ee0000";

                    return (
                      <tr key={mech.id} className="border-b border-[#f5f5f5]">
                        <td className="py-2 px-4 text-foreground font-medium">{mech.alias && mech.alias !== mech.name && mech.alias !== "" ? `${mech.name} (${mech.alias})` : mech.name}</td>
                        <td className="py-2 px-4 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{svcCount}</td>
                        <td className="py-2 px-4 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(moGenerada)}</td>
                        <td className="py-2 px-4 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(ticketProm)}</td>
                        <td className="py-2 px-4 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(sueldo)}</td>
                        <td className="py-2 px-4 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(comisiones)}</td>
                        <td className="py-2 px-4 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(costoTotal)}</td>
                        <td className="py-2 px-4 text-right" style={{ fontVariantNumeric: "tabular-nums", color: utilidadMech >= 0 ? "#0c8c5e" : "#ee0000" }}>{fmtCurrency(utilidadMech)}</td>
                        <td className="py-2 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold text-white" style={{ backgroundColor: roiColor }}>
                            {roi.toFixed(1)}x
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {mechanics.length === 0 && (
                    <tr><td colSpan={9} className="py-6 text-center text-[#999999]">Sin mecánicos activos</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Personal administrativo */}
          {adminStaff.length > 0 && (
            <div className="bg-white border border-[#eaeaea] rounded-lg overflow-hidden mt-4">
              <div className="px-4 py-3 border-b border-[#eaeaea]">
                <span className="text-[13px] font-semibold text-foreground">Personal administrativo</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-[#eaeaea] text-[#999999]">
                      <th className="text-left py-2 px-4 font-medium">Nombre</th>
                      <th className="text-right py-2 px-4 font-medium"><span className="flex items-center justify-end gap-1">Sueldo pagado <ChartTooltip text={`Pago neto ejecutado en el período, ya descontada la caja de ahorro.`} /></span></th>
                      <th className="text-left py-2 px-4 font-medium">Frecuencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminStaff.map(emp => {
                      const empPayroll = payrollData.filter(p => p.employee_id === emp.id);
                      const sueldoPagado = empPayroll.reduce((s, p) => s + (p.net_payment || 0), 0);
                      const freq = emp.pay_frequency === "weekly" ? "Semanal" : emp.pay_frequency === "biweekly" ? "Quincenal" : "—";
                      const displayName = emp.alias && emp.alias !== emp.name && emp.alias !== "" ? `${emp.name} (${emp.alias})` : emp.name;
                      return (
                        <tr key={emp.id} className="border-b border-[#f5f5f5]">
                          <td className="py-2 px-4 text-foreground font-medium">{displayName}</td>
                          <td className="py-2 px-4 text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{fmtCurrency(sueldoPagado)}</td>
                          <td className="py-2 px-4 text-[#666]">{freq}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-[#eaeaea] my-6" />

        {/* Gastos recientes */}
        <div className="bg-white border border-[#eaeaea] rounded-lg overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-[#eaeaea]">
            <span className="text-[13px] font-semibold text-foreground">Gastos recientes</span>
            <span className="ml-1.5"><ChartTooltip text={`Últimos 10 gastos registrados. Total gastos del período: ${fc(gastos)} en ${expenses.length} registros.`} /></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#eaeaea] text-[#999999]">
                  <th className="text-left py-2 px-4 font-medium">Fecha</th>
                  <th className="text-left py-2 px-4 font-medium">Detalle</th>
                  <th className="text-left py-2 px-4 font-medium">Categoría</th>
                  <th className="text-right py-2 px-4 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map(e => (
                  <tr key={e.id} className="border-b border-[#f5f5f5]">
                    <td className="py-2 px-4 text-[#999999]">{new Date(e.date + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" })}</td>
                    <td className="py-2 px-4 text-foreground">{e.detail || "—"}</td>
                    <td className="py-2 px-4 text-[#666]">{e.expense_categories?.name || "—"}</td>
                    <td className="py-2 px-4 text-right font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(e.total)}</td>
                  </tr>
                ))}
                {recentExpenses.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-[#999999]">Sin gastos recientes</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  /* ─── Export functions ─── */

  function handleExportJSON() {
    setExportOpen(false);
    const year = period.start.getFullYear();
    const monthName = period.start.toLocaleDateString("es-MX", { month: "long" });
    const periodoLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
    const totalEgresos = gastos + costoTotalMecanicos;
    const margenBruto = ingresos > 0 ? Math.round((((ingresos - totalEgresos) / ingresos) * 100) * 10) / 10 : 0;
    const nominaPct = ingresos > 0 ? Math.round((costoTotalMecanicos / ingresos) * 100 * 10) / 10 : 0;

    const porMecanico = mechanics.map(mech => {
      const mechServiceIds = paidServiceWorkers.filter(sw => sw.employee_id === mech.id).map(sw => sw.service_id);
      const mechPaid = paidServices.filter(s => mechServiceIds.includes(s.id));
      const moGenerada = mechPaid.reduce((s, t) => s + (t.labor || 0), 0);
      const mechPayroll = payrollData.filter(p => p.employee_id === mech.id);
      const pagado = mechPayroll.reduce((s, p) => s + (p.net_payment || 0), 0);
      const roi = pagado > 0 ? Math.round((moGenerada / pagado) * 10) / 10 : 0;
      const displayName = mech.alias && mech.alias !== mech.name && mech.alias !== "" ? `${mech.name} (${mech.alias})` : mech.name;
      return { nombre: displayName, servicios: mechPaid.length, mo_generada: moGenerada, pagado, roi };
    });

    const payload = {
      periodo: periodoLabel,
      generado: new Date().toISOString(),
      financiero: {
        ingresos: Math.round(ingresos),
        egresos_gastos: Math.round(gastos),
        nomina_pagada: Math.round(costoTotalMecanicos),
        flujo_libre: Math.round(ingresos - totalEgresos),
        margen_pct: margenBruto,
      },
      operacional: {
        servicios_completados: serviciosCompletados,
        ticket_promedio: Math.round(ticketPromedio),
        por_cobrar: Math.round(porCobrar),
        en_proceso: enProceso,
        costo_fijo_dia: Math.round(costoFijoDia),
        breakeven_diario: Math.round(breakevenDiario),
      },
      nomina: {
        total_pagado: Math.round(costoTotalMecanicos),
        pct_ingresos: nominaPct,
        roi_mo: Math.round(roiMO * 10) / 10,
        por_mecanico: porMecanico,
      },
      refaccionaria: {
        venta: Math.round(ventaRefacciones),
        costo: Math.round(costoRefacciones),
        ganancia: Math.round(gananciaRefacciones),
        margen_pct: margenRefacciones,
      },
      gastos_por_categoria: expenseByCategory.map(([cat, amount]) => ({ categoria: cat, total: Math.round(amount) })),
      tendencia_6_periodos: trendData.map(d => ({ periodo: d.label, ingresos: Math.round(d.ingresos), gastos: Math.round(d.gastos), utilidad: Math.round(d.utilidad) })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const monthSlug = period.start.toLocaleDateString("es-MX", { month: "long" }).toLowerCase();
    a.href = url;
    a.download = `tablero-${monthSlug}-${year}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleInterpret() {
    setInterpreting(true);
    try {
      const year = period.start.getFullYear();
      const monthName = period.start.toLocaleDateString("es-MX", { month: "long" });
      const periodoLabel = `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`;
      const totalEgresosLocal = gastos + costoTotalMecanicos;
      const margenBruto = ingresos > 0 ? Math.round((((ingresos - totalEgresosLocal) / ingresos) * 100) * 10) / 10 : 0;
      const nominaPct = ingresos > 0 ? Math.round((costoTotalMecanicos / ingresos) * 100 * 10) / 10 : 0;

      const porMecanico = mechanics.map(mech => {
        const mechServiceIds = paidServiceWorkers.filter(sw => sw.employee_id === mech.id).map(sw => sw.service_id);
        const mechPaid = paidServices.filter(s => mechServiceIds.includes(s.id));
        const moGenerada = mechPaid.reduce((s, t) => s + (t.labor || 0), 0);
        const mechPayroll = payrollData.filter(p => p.employee_id === mech.id);
        const pagado = mechPayroll.reduce((s, p) => s + (p.net_payment || 0), 0);
        const roi = pagado > 0 ? Math.round((moGenerada / pagado) * 10) / 10 : 0;
        const displayName = mech.alias && mech.alias !== mech.name && mech.alias !== "" ? `${mech.name} (${mech.alias})` : mech.name;
        return { nombre: displayName, servicios: mechPaid.length, mo_generada: moGenerada, pagado, roi };
      });

      const dashboardData = {
        periodo: periodoLabel,
        financiero: {
          ingresos: Math.round(ingresos),
          egresos_gastos: Math.round(gastos),
          nomina_pagada: Math.round(costoTotalMecanicos),
          flujo_libre: Math.round(ingresos - totalEgresosLocal),
          margen_pct: margenBruto,
        },
        operacional: {
          servicios_completados: serviciosCompletados,
          ticket_promedio: Math.round(ticketPromedio),
          por_cobrar: Math.round(porCobrar),
          en_proceso: enProceso,
          costo_fijo_dia: Math.round(costoFijoDia),
          breakeven_diario: Math.round(breakevenDiario),
        },
        nomina: {
          total_pagado: Math.round(costoTotalMecanicos),
          pct_ingresos: nominaPct,
          roi_mo: Math.round(roiMO * 10) / 10,
          por_mecanico: porMecanico,
        },
        refaccionaria: {
          venta: Math.round(ventaRefacciones),
          costo: Math.round(costoRefacciones),
          ganancia: Math.round(gananciaRefacciones),
          margen_pct: margenRefacciones,
        },
        gastos_por_categoria: expenseByCategory.map(([cat, amount]) => ({ categoria: cat, total: Math.round(amount) })),
        tendencia_6_periodos: trendData.map(d => ({ periodo: d.label, ingresos: Math.round(d.ingresos), gastos: Math.round(d.gastos), utilidad: Math.round(d.utilidad) })),
      };

      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dashboardData, periodo: periodoLabel }),
      });

      if (res.status === 429) {
        const errData = await res.json();
        if (errData.error === "demasiado_pronto") {
          setInterpretameNextDate(errData.disponible_en);
          setInterpretamePuedeUsar(false);
          showToast(`Próxima interpretación disponible el ${errData.disponible_en}`);
        } else {
          setInterpretameRemaining(0);
          setInterpretamePuedeUsar(false);
          showToast("Usaste tu última interpretación");
        }
        return;
      }

      if (!res.ok) throw new Error("Error al generar interpretación");

      const { content, remaining } = await res.json();
      setInterpretameRemaining(remaining);
      setInterpretamePuedeUsar(false);
      setInterpretameNextDate(
        new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
          .toLocaleDateString("es-MX", { day: "numeric", month: "long" })
      );

      // Toast de confirmación
      if (remaining > 1) {
        showToast(`Interpretación lista · Te quedan ${remaining} de 10`);
      } else if (remaining === 1) {
        showToast("Interpretación lista · Te queda 1 de 10 — úsala bien");
      } else {
        showToast("Usaste tu última interpretación");
      }

      // Generar PDF con jsPDF
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pdfMargin = 20;
      const maxWidth = pageWidth - pdfMargin * 2;
      let y = pdfMargin;

      // Header
      doc.setFillColor(10, 10, 10);
      doc.rect(0, 0, pageWidth, 18, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Taller Mecánico Rafa", pdfMargin, 12);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Interpretación · ${periodoLabel}`, pageWidth - pdfMargin, 12, { align: "right" });
      y = 30;

      // Contenido
      doc.setTextColor(20, 20, 20);
      const lineas = content.split("\n");

      for (const linea of lineas) {
        if (y > pageHeight - pdfMargin) {
          doc.addPage();
          y = pdfMargin;
        }

        const esTitulo = linea.startsWith("##") || linea.startsWith("**") || /^\d\./.test(linea);

        if (esTitulo) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
        }

        const textoLimpio = linea.replace(/\*\*/g, "").replace(/^##\s?/, "").trim();
        if (!textoLimpio) {
          y += 4;
          continue;
        }

        const wrapped = doc.splitTextToSize(textoLimpio, maxWidth);
        doc.text(wrapped, pdfMargin, y);
        y += wrapped.length * 6 + (esTitulo ? 3 : 1);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const fechaPdf = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
      doc.text(`Generado el ${fechaPdf}`, pdfMargin, pageHeight - 10);

      const nombreArchivo = `interpretacion-taller-${periodoLabel.toLowerCase().replace(/\s/g, "-")}.pdf`;
      doc.save(nombreArchivo);
    } catch {
      showToast("Error al generar interpretación");
    } finally {
      setInterpreting(false);
    }
  }

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  async function handleExportPDF() {
    setExportOpen(false);
    setGeneratingPdf(true);
    setPrinting(true);

    // Wait for React to render both tabs
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(undefined))));

    try {
      const el = exportRef.current;
      if (!el) return;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const contentW = pageW - margin * 2;
      const imgH = (canvas.height * contentW) / canvas.width;

      let offsetY = 0;
      let page = 0;

      while (offsetY < imgH) {
        if (page > 0) pdf.addPage();

        // Compute source slice from the canvas
        const sliceH = Math.min(pageH - margin * 2, imgH - offsetY);
        const srcY = (offsetY / imgH) * canvas.height;
        const srcH = (sliceH / imgH) * canvas.height;

        // Create a slice canvas
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = srcH;
        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
          const sliceData = sliceCanvas.toDataURL("image/png");
          pdf.addImage(sliceData, "PNG", margin, margin, contentW, sliceH);
        }

        offsetY += sliceH;
        page++;
      }

      const monthSlug = period.start.toLocaleDateString("es-MX", { month: "long" }).toLowerCase();
      const year = period.start.getFullYear();
      pdf.save(`tablero-${monthSlug}-${year}.pdf`);
    } finally {
      setPrinting(false);
      setGeneratingPdf(false);
    }
  }

  /* ─── Main render ─── */
  return (
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3 tablero-header">
          <h1 className="text-[18px] font-semibold text-foreground">Tablero</h1>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 bg-white border border-[#eaeaea] rounded-lg p-[3px] tablero-tabs">
              {(["resumen", "operacion"] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 text-[12px] font-medium rounded-md transition-all cursor-pointer ${
                    tab === t
                      ? "bg-foreground text-white"
                      : "text-[#666666] hover:text-foreground"
                  }`}
                >
                  {t === "resumen" ? "General" : "Detalle"}
                </button>
              ))}
            </div>
            {false && interpretameRemaining !== 0 && (
              <div className="relative group">
                <button
                  onClick={handleInterpret}
                  disabled={interpreting || !interpretamePuedeUsar}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md border border-[#eaeaea] bg-white transition-colors cursor-pointer ${
                    !interpretamePuedeUsar && !interpreting
                      ? "text-[#999999] opacity-50 cursor-not-allowed"
                      : interpreting
                        ? "text-[#999999] cursor-wait"
                        : "text-[#666666] hover:text-foreground hover:border-[#ccc]"
                  }`}
                >
                  {interpreting ? "Analizando..." : "Interprétame"}
                </button>
                {!interpretamePuedeUsar && !interpreting && interpretameNextDate && (
                  <div className="absolute bottom-full right-0 mb-1.5 hidden group-hover:block whitespace-nowrap text-[11px] bg-[#1a1a1a] text-[#e8e8e8] px-2.5 py-1.5 rounded-md shadow-lg pointer-events-none z-50">
                    Próxima interpretación disponible el {interpretameNextDate}
                  </div>
                )}
              </div>
            )}
            <div className="relative export-btn">
              <button
                onClick={() => setExportOpen(o => !o)}
                className="px-3 py-1.5 text-[12px] font-medium rounded-md border border-[#eaeaea] bg-white text-[#666666] hover:text-foreground hover:border-[#ccc] transition-colors cursor-pointer"
              >
                Exportar ↓
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#eaeaea] rounded-lg shadow-lg py-1 min-w-[160px]">
                    <button
                      onClick={handleExportJSON}
                      className="w-full text-left px-3 py-2 text-[12px] text-[#666666] hover:bg-[#f5f5f5] hover:text-foreground transition-colors cursor-pointer"
                    >
                      Descargar JSON
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={generatingPdf}
                      className="w-full text-left px-3 py-2 text-[12px] text-[#666666] hover:bg-[#f5f5f5] hover:text-foreground transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
                    >
                      {generatingPdf ? "Generando PDF..." : "Descargar PDF"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Date Range & Agrupación controls */}
        <div className="flex items-center gap-4 mb-6 flex-wrap period-filter">
          <div className="flex gap-0.5 bg-white border border-[#eaeaea] rounded-lg p-[3px]">
            {DATE_RANGE_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleDateRange(key)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  dateRange === key
                    ? "bg-foreground text-white"
                    : "text-[#666666] hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="w-px h-6 bg-[#eaeaea]" />
          <div className="flex gap-0.5 bg-white border border-[#eaeaea] rounded-lg p-[3px]">
            {AGRUPACION_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setAgrupacion(key)}
                className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all cursor-pointer ${
                  agrupacion === key
                    ? "bg-foreground text-white"
                    : "text-[#666666] hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="text-[13px] font-semibold text-foreground">{period.label}</span>
          <span className="text-[11px] text-[#999999] px-2.5 py-1 bg-white border border-[#eaeaea] rounded-full">
            {period.compLabel}
          </span>
        </div>

        {/* Print header (hidden on screen) */}
        <div className="print-header">
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Taller Mecánico Rafa &nbsp;·&nbsp; {period.label} &nbsp;·&nbsp; Generado: {new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div style={{ borderBottom: "2px solid #000", marginTop: 8, marginBottom: 16 }} />
        </div>

        {/* Content */}
        {printing ? (
          <div ref={exportRef} id="tablero-export" style={{ background: "#ffffff", padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Taller Mecánico Rafa &nbsp;·&nbsp; {period.label} &nbsp;·&nbsp; Generado: {new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div style={{ borderBottom: "2px solid #000", marginBottom: 20 }} />
            <div className="print-section-title">RESUMEN FINANCIERO</div>
            {renderResumen()}
            <div className="print-section-title" style={{ marginTop: 32 }}>DETALLE OPERATIVO</div>
            {renderOperacion()}
          </div>
        ) : (
          tab === "resumen" ? renderResumen() : renderOperacion()
        )}
      </div>

      {/* Toast */}
      {toastMessage && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "#0f0f0f",
            color: "#ffffff",
            fontSize: 12,
            borderRadius: 6,
            padding: "10px 14px",
            zIndex: 9999,
            maxWidth: 340,
            lineHeight: 1.5,
            animation: "fadeIn .2s ease",
          }}
        >
          {toastMessage}
        </div>
      )}

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </main>
  );
}


Y este otro es el route.ts, para que tambien lo tengas de referencia - 
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    console.log("1. Parseando request...");
    const { dashboardData, periodo } = await request.json();
    console.log("2. Body recibido:", Object.keys({ dashboardData, periodo }));

    console.log("3. Creando supabase client...");
    const supabase = await createClient();

    console.log("4. Verificando usuario...");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });
    console.log("4b. Usuario:", user.id);

    console.log("5. Verificando límite...");
    const { data: usage } = await supabase
      .from("usage_limits")
      .select("count, updated_at")
      .eq("user_id", user.id)
      .eq("feature", "interpretame")
      .maybeSingle();

    const totalUsed = usage?.count ?? 0;
    const lastUsed = usage?.updated_at ? new Date(usage.updated_at) : null;
    console.log("5b. Uso total:", totalUsed, "Último uso:", lastUsed);

    // Verificar límite de por vida
    if (totalUsed >= 10) {
      return Response.json(
        {
          error: "limite_alcanzado",
          count: totalUsed,
          limit: 10,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // Verificar espacio de 3 semanas
    if (lastUsed) {
      const diasDesdeUltimoUso = Math.floor(
        (Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diasDesdeUltimoUso < 21) {
        const diasRestantes = 21 - diasDesdeUltimoUso;
        return Response.json(
          {
            error: "demasiado_pronto",
            dias_restantes: diasRestantes,
            disponible_en: new Date(
              lastUsed.getTime() + 21 * 24 * 60 * 60 * 1000
            ).toLocaleDateString("es-MX", { day: "numeric", month: "long" }),
          },
          { status: 429 }
        );
      }
    }

    // Incrementar contador
    await supabase.from("usage_limits").upsert(
      {
        user_id: user.id,
        feature: "interpretame",
        month: "",
        count: totalUsed + 1,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,feature,month" }
    );

    console.log("6. Llamando a Anthropic...");
    console.log("6b. API KEY existe:", !!process.env.ANTHROPIC_API_KEY);
    console.log("6c. API KEY prefijo:", process.env.ANTHROPIC_API_KEY?.slice(0, 12));
    const client = new Anthropic();

    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [
        {
          role: "user",
          content: `Eres el consejero financiero y estratégico de un taller mecánico
en México. Tu estilo combina dos filosofías:

- Warren Buffett: honestidad brutal, largo plazo, celebra lo simple
  que genera dinero consistente, nunca suaviza los problemas
- Elon Musk: primeros principios, elimina lo que no genera valor,
  acelera lo que sí funciona, cuantifica el impacto de cada decisión,
  pregunta "¿por qué hacemos esto así?"

DATOS DEL PERÍODO:
${JSON.stringify(dashboardData, null, 2)}

CONTEXTO DEL NEGOCIO:
- Taller mecánico independiente en Zapopan, Jalisco
- Sistema de gestión con 1 semana de vida — primer mes con datos reales
- Dueño operativo: Rafael (Ponce) — también trabaja como mecánico
- Socios inversionistas: Armando y Gerzain (no operan ni cobran sueldo)
- Administradora: Amairani
- Metas: margen >35% · nómina <30% ingresos · ROI mecánicos >1.5x
- Ingresos = servicios cobrados + ventas directas de refaccionaria
- Egresos = gastos operativos + nómina pagada (excluye socios)

ESTRUCTURA EXACTA:

## [Mes Año] — [titular con el número más importante y lo que significa]

### Lo que está funcionando — no lo toques
Celebra 2-3 cosas con datos. Por cada cosa buena, explica
POR QUÉ está funcionando y cómo se puede amplificar.
Menciona personas por nombre con su ROI.

### Lo que hay que corregir — sin anestesia
Por cada problema: el número, por qué importa,
y qué pasaría si no se corrige en 90 días.
Piensa en primeros principios: no describas el síntoma,
encuentra la causa raíz.

### Tres palancas para el siguiente mes
Exactamente 3. Cada una debe:
- Empezar con un verbo de acción
- Incluir el impacto estimado en pesos o porcentaje
- Ser ejecutable esta semana por Amairani o Rafael

### La pregunta que nadie está haciendo
Una sola pregunta de primeros principios con impacto estimado.

### Estado general
Una sola oración. Sin suavizar.

REGLAS:
- Máximo 600 palabras
- Números en formato $XX,XXX
- Menciona personas por nombre
- Cada observación respaldada con un número
- Nunca uses: "es importante destacar", "cabe mencionar",
  "es fundamental", "en conclusión"
- Tono de socio que conoce el negocio, no consultor externo

PERÍODO: ${periodo}`,
        },
      ],
    });

    const textBlock = message.content[0];
    const content = textBlock.type === "text" ? textBlock.text : "";

    console.log("7. Éxito");
    return Response.json({
      content,
      count: totalUsed + 1,
      limit: 10,
      remaining: 10 - (totalUsed + 1),
    });
  } catch (error) {
    console.error("=== ERROR INTERPRETAME ===");
    console.error(error);
    console.error("=========================");
    return Response.json(
      {
        error: "internal_error",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
