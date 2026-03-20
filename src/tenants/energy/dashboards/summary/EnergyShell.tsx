'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

/* ── Types ── */
type OcupacionRow = {
  schedule_date: string
  start_time: string
  end_time: string
  spots_ocupados: number
  spots_total: number
}
type IngresoRow = { dia: number; acumulado: number; diario: number }
type KPIs = { ingresos: number; clases: number; paquetes: number; ticket: number }
type TendenciaRow = { periodo: string; clases: number }
type TicketRow = { periodo: string; ticket: number }

type Props = {
  ocupacion: OcupacionRow[]
  ingresosAcumulados: IngresoRow[]
  kpis: KPIs
  tendencia: TendenciaRow[]
  ticketPromedio: TicketRow[]
}

/* ── Constants ── */
const GOLD = '#C8A415'
const DARK = '#1A1A1A'
const GREEN = '#0F6E56'
const BLUE = '#185FA5'
const RED = '#A32D2D'
const BG_CARD = '#161616'
const BORDER = '#222'
const TEXT = '#F0EEE8'
const MUTED = '#555'
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const card = {
  background: BG_CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: 20,
} as const

const mono = { fontFamily: 'var(--font-jetbrains), monospace' } as const

/* ── Helpers ── */
function fmt(n: number, prefix = '') {
  if (n >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`
  return `${prefix}${n.toLocaleString('es-MX')}`
}

function barColor(pct: number) {
  if (pct >= 90) return GREEN
  if (pct >= 70) return GOLD
  if (pct >= 50) return BLUE
  return RED
}

/* ── Main Component ── */
export default function EnergyShell({ ocupacion, ingresosAcumulados, kpis, tendencia, ticketPromedio }: Props) {
  const [periodo] = useState<'dia' | 'semana' | 'mes' | 'anio'>('dia')

  const totalSpots = useMemo(() => {
    return ocupacion.reduce((sum, r) => sum + Number(r.spots_ocupados), 0)
  }, [ocupacion])
  const totalCapacity = useMemo(() => {
    return ocupacion.reduce((sum, r) => sum + Number(r.spots_total), 0)
  }, [ocupacion])
  const spotsVacios = totalCapacity - totalSpots

  const periodoLabel = periodo === 'dia' ? 'hoy' : periodo === 'semana' ? 'esta semana' : periodo === 'mes' ? 'este mes' : 'este año'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── SECTION 1: Hero ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Ocupación */}
        <div style={card}>
          <p style={{ color: MUTED, fontSize: 12, margin: 0, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            Spots ocupados · {periodoLabel}
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ ...mono, color: GOLD, fontSize: 48, fontWeight: 700, lineHeight: 1 }}>
              {totalSpots}
            </span>
            <span style={{ ...mono, color: MUTED, fontSize: 24 }}>/ {totalCapacity}</span>
          </div>
          <p style={{ color: RED, fontSize: 13, margin: '4px 0 16px', ...mono }}>
            {spotsVacios} spots vacíos
          </p>

          {/* Bars per class */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ocupacion.map((row, i) => {
              const pct = Number(row.spots_total) > 0
                ? Math.round((Number(row.spots_ocupados) / Number(row.spots_total)) * 100)
                : 0
              const hour = row.start_time?.slice(0, 5) ?? ''
              const endHour = row.end_time?.slice(0, 5) ?? ''
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: TEXT, marginBottom: 2 }}>
                    <span style={mono}>{hour} – {endHour}</span>
                    <span style={{ ...mono, color: MUTED }}>{Number(row.spots_ocupados)}/{Number(row.spots_total)}</span>
                  </div>
                  <div style={{ background: '#222', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: barColor(pct), borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )
            })}
            {ocupacion.length === 0 && (
              <p style={{ color: MUTED, fontSize: 13 }}>Sin clases programadas hoy</p>
            )}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { color: GREEN, label: '90–100%' },
              { color: GOLD, label: '70–89%' },
              { color: BLUE, label: '50–69%' },
              { color: RED, label: '<50%' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: MUTED }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: KPIs grid 2x3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'Ingresado', value: fmt(kpis.ingresos, '$'), color: GOLD },
            { label: 'Clases', value: fmt(kpis.clases), color: BLUE },
            { label: 'Horas procesadas', value: fmt(Math.round(kpis.clases * 0.75)), color: BLUE },
            { label: 'Paquetes', value: fmt(kpis.paquetes), color: GREEN },
            { label: 'Ticket promedio', value: fmt(kpis.ticket, '$'), color: GOLD },
            { label: 'Precio/hora', value: kpis.clases > 0 ? fmt(Math.round(kpis.ingresos / (kpis.clases * 0.75)), '$') : '$0', color: TEXT },
          ].map(k => (
            <div key={k.label} style={card}>
              <p style={{ color: MUTED, fontSize: 11, margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k.label}</p>
              <p style={{ ...mono, color: k.color, fontSize: 28, fontWeight: 700, margin: '6px 0 8px' }}>{k.value}</p>
              <div style={{ background: '#222', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: '60%', height: '100%', background: k.color, borderRadius: 2, opacity: 0.7 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: Ingresos acumulados ── */}
      <div style={card}>
        <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Ingresos acumulados del mes</p>
        <ReactECharts
          option={{
            backgroundColor: 'transparent',
            grid: { left: 60, right: 60, top: 20, bottom: 30 },
            tooltip: { trigger: 'axis' },
            xAxis: {
              type: 'category',
              data: ingresosAcumulados.map(r => `Día ${Number(r.dia)}`),
              axisLabel: { color: MUTED, fontSize: 11 },
              axisLine: { lineStyle: { color: BORDER } },
            },
            yAxis: [
              {
                type: 'value',
                position: 'left',
                axisLabel: { color: MUTED, fontSize: 11, formatter: (v: number) => fmt(v, '$') },
                splitLine: { lineStyle: { color: BORDER } },
              },
              {
                type: 'value',
                position: 'right',
                axisLabel: { color: MUTED, fontSize: 11 },
                splitLine: { show: false },
              },
            ],
            series: [
              {
                name: '$ acumulado',
                type: 'line',
                data: ingresosAcumulados.map(r => Number(r.acumulado)),
                smooth: true,
                lineStyle: { color: GOLD, width: 2 },
                itemStyle: { color: GOLD },
                areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(200,164,21,0.2)' }, { offset: 1, color: 'rgba(200,164,21,0)' }] } },
              },
              {
                name: 'Diario',
                type: 'bar',
                yAxisIndex: 1,
                data: ingresosAcumulados.map(r => Number(r.diario)),
                itemStyle: { color: BLUE, borderRadius: [2, 2, 0, 0] },
                barMaxWidth: 16,
              },
            ],
          }}
          style={{ height: 300 }}
        />
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
          {[
            { label: 'Ingresado', value: fmt(kpis.ingresos, '$'), color: GOLD },
            { label: 'Paquetes', value: fmt(kpis.paquetes), color: GREEN },
            { label: 'Ticket promedio', value: fmt(kpis.ticket, '$'), color: GOLD },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ color: MUTED, fontSize: 11, margin: 0, textTransform: 'uppercase' }}>{s.label}</p>
              <p style={{ ...mono, color: s.color, fontSize: 20, fontWeight: 600, margin: '4px 0 0' }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: Atención ahora ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div style={{ ...card, borderLeft: `3px solid ${RED}` }}>
          <p style={{ color: RED, fontSize: 12, fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase' }}>Churn risk</p>
          <p style={{ color: TEXT, fontSize: 13, margin: 0 }}>Paquetes por vencer con clases sin usar</p>
          <p style={{ ...mono, color: RED, fontSize: 32, fontWeight: 700, margin: '8px 0 0' }}>—</p>
        </div>
        <div style={{ ...card, borderLeft: `3px solid ${GOLD}` }}>
          <p style={{ color: GOLD, fontSize: 12, fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase' }}>Baja ocupación</p>
          <p style={{ color: TEXT, fontSize: 13, margin: 0 }}>Clases mañana con &lt;50% ocupación</p>
          <p style={{ ...mono, color: GOLD, fontSize: 32, fontWeight: 700, margin: '8px 0 0' }}>—</p>
        </div>
        <div style={{ ...card, borderLeft: `3px solid ${GREEN}` }}>
          <p style={{ color: GREEN, fontSize: 12, fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase' }}>Listos para renovar</p>
          <p style={{ color: TEXT, fontSize: 13, margin: 0 }}>Clientes con paquetes a punto de terminar</p>
          <p style={{ ...mono, color: GREEN, fontSize: 32, fontWeight: 700, margin: '8px 0 0' }}>—</p>
        </div>
      </div>

      {/* ── SECTION 4: Tendencia ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Clases tendencia */}
        <div style={card}>
          <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Clases 2026</p>
          <ReactECharts
            option={{
              backgroundColor: 'transparent',
              grid: { left: 40, right: 16, top: 10, bottom: 30 },
              tooltip: { trigger: 'axis' },
              xAxis: {
                type: 'category',
                data: tendencia.map(r => MESES[new Date(r.periodo).getMonth()]),
                axisLabel: { color: MUTED, fontSize: 11 },
                axisLine: { lineStyle: { color: BORDER } },
              },
              yAxis: {
                type: 'value',
                axisLabel: { color: MUTED, fontSize: 11 },
                splitLine: { lineStyle: { color: BORDER } },
              },
              series: [{
                type: 'bar',
                data: tendencia.map(r => Number(r.clases)),
                itemStyle: { color: GOLD, borderRadius: [3, 3, 0, 0] },
                barMaxWidth: 24,
              }],
            }}
            style={{ height: 260 }}
          />
        </div>

        {/* Ticket promedio tendencia */}
        <div style={card}>
          <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Ticket promedio mensual</p>
          <ReactECharts
            option={{
              backgroundColor: 'transparent',
              grid: { left: 50, right: 16, top: 10, bottom: 30 },
              tooltip: { trigger: 'axis', formatter: (p: { name: string; value: number }[]) => `${p[0]?.name}: $${p[0]?.value?.toLocaleString('es-MX')}` },
              xAxis: {
                type: 'category',
                data: ticketPromedio.map(r => MESES[new Date(r.periodo).getMonth()]),
                axisLabel: { color: MUTED, fontSize: 11 },
                axisLine: { lineStyle: { color: BORDER } },
              },
              yAxis: {
                type: 'value',
                axisLabel: { color: MUTED, fontSize: 11, formatter: (v: number) => `$${v}` },
                splitLine: { lineStyle: { color: BORDER } },
              },
              series: [{
                type: 'line',
                data: ticketPromedio.map(r => Number(r.ticket)),
                smooth: true,
                lineStyle: { color: GOLD, width: 2 },
                itemStyle: { color: GOLD },
                areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(200,164,21,0.15)' }, { offset: 1, color: 'rgba(200,164,21,0)' }] } },
              }],
            }}
            style={{ height: 260 }}
          />
        </div>
      </div>

      {/* ── SECTION 5: Lectura del negocio ── */}
      <div style={card}>
        <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Lectura del negocio</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { color: GOLD, text: `Ingreso del mes: ${fmt(kpis.ingresos, '$')}`, context: `${kpis.paquetes} paquetes vendidos con ticket promedio de ${fmt(kpis.ticket, '$')}` },
            { color: BLUE, text: `${kpis.clases} clases tomadas este mes`, context: 'Actividad general del estudio' },
            { color: GREEN, text: `Ocupación ${totalCapacity > 0 ? Math.round((totalSpots / totalCapacity) * 100) : 0}% hoy`, context: `${spotsVacios} spots disponibles de ${totalCapacity}` },
            { color: TEXT, text: `Ticket promedio: ${fmt(kpis.ticket, '$')}`, context: 'Promedio de precio por paquete vendido' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, marginTop: 5, flexShrink: 0 }} />
              <div>
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 500, margin: 0 }}>{b.text}</p>
                <p style={{ color: MUTED, fontSize: 12, margin: '2px 0 0' }}>{b.context}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
