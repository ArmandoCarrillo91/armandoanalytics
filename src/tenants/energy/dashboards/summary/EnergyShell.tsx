'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

/* ── Types ── */
type OcupacionRow = {
  class_date: string
  spots_ocupados: number
  spots_total: number
  pct_ocupacion: number
}
type IngresoRow = { dia: number; acumulado: number; diario?: number }
type HorasRow = { dia: number; horas: number }
type KPIs = { ingresos: number; clases: number; paquetes: number; ticket: number }
type HeatmapRow = { class_date: string; spots_ocupados: number; spots_total: number; pct: number }

type Props = {
  ocupacion: OcupacionRow[]
  kpis: KPIs
  totalBicis: number
  ingresosAcumulados: IngresoRow[]
  ingresosAnterior: IngresoRow[]
  horasMes: HorasRow[]
  churnRisk: number
  clasesBajas: number
  listosRenovar: number
  heatmap: HeatmapRow[]
}

/* ── Palette ── */
const GOLD = '#C8A415'
const GREEN = '#0F6E56'
const BLUE = '#185FA5'
const RED = '#E24B4A'
const BG = '#161616'
const BD = '#1E1E1E'
const INK = '#F0EEE8'
const MUT = '#666'
const MONO = "var(--font-jetbrains), 'JetBrains Mono', monospace"
const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const card: React.CSSProperties = {
  background: BG,
  border: `1px solid ${BD}`,
  borderRadius: 10,
  padding: '14px 18px',
}

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
  return '#A32D2D'
}

function heatColor(pct: number) {
  if (pct >= 90) return 'rgba(200,164,21,0.9)'
  if (pct >= 70) return 'rgba(200,164,21,0.6)'
  if (pct >= 50) return 'rgba(200,164,21,0.35)'
  if (pct > 0) return 'rgba(200,164,21,0.15)'
  return BD
}

const lbl: React.CSSProperties = {
  color: MUT, fontSize: 10, margin: 0,
  textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: MONO,
}

/* ── Component ── */
export default function EnergyShell({
  ocupacion, kpis, totalBicis,
  ingresosAcumulados, ingresosAnterior, horasMes,
  churnRisk, clasesBajas, listosRenovar, heatmap,
}: Props) {
  const numClases = ocupacion.length
  const totalSpots = ocupacion.reduce((s, r) => s + Number(r.spots_ocupados), 0)
  const avgSpots = numClases > 0 ? totalSpots / numClases : 0
  const avgOcupacion = numClases > 0
    ? Math.round(ocupacion.reduce((s, r) => s + Number(r.pct_ocupacion), 0) / numClases)
    : 0

  const precioClase = kpis.clases > 0 ? kpis.ingresos / kpis.clases : 0
  const revenuePerdido = Math.round((totalBicis - avgSpots) * precioClase * numClases)
  const horasConsumidas = Math.round(kpis.clases * 0.75)

  /* ── Chart data ── */
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const currentDay = new Date().getDate()
  const xLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`)

  const chartIngresos = useMemo(() => {
    const a: (number | null)[] = new Array(daysInMonth).fill(null)
    ingresosAcumulados.forEach(r => { a[Number(r.dia) - 1] = Number(r.acumulado) })
    return a
  }, [ingresosAcumulados, daysInMonth])

  const chartAnterior = useMemo(() => {
    const a: (number | null)[] = new Array(daysInMonth).fill(null)
    ingresosAnterior.forEach(r => { a[Number(r.dia) - 1] = Number(r.acumulado) })
    return a
  }, [ingresosAnterior, daysInMonth])

  const chartHoras = useMemo(() => {
    const a: (number | null)[] = new Array(daysInMonth).fill(null)
    horasMes.forEach(r => { a[Number(r.dia) - 1] = Number(r.horas) })
    return a
  }, [horasMes, daysInMonth])

  const chartHorasProy = useMemo(() => {
    const last = horasMes.length > 0 ? Number(horasMes[horasMes.length - 1].horas) : 0
    const avg = currentDay > 0 ? last / currentDay : 0
    return Array.from({ length: daysInMonth }, (_, i) => {
      if (i + 1 < currentDay) return null
      if (i + 1 === currentDay) return Math.round(last)
      return Math.round(last + avg * (i + 1 - currentDay))
    })
  }, [horasMes, currentDay, daysInMonth])

  /* ── Heatmap grid ── */
  const heat = useMemo(() => {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const dow = today.getDay()
    const off = dow === 0 ? -6 : 1 - dow
    const mon = new Date(today)
    mon.setDate(today.getDate() + off)
    mon.setHours(0, 0, 0, 0)

    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon)
      d.setDate(mon.getDate() + i)
      return d.toISOString().split('T')[0]
    })

    const map: Record<string, Record<string, number>> = {}
    const times = new Set<string>()

    heatmap.forEach(row => {
      const d = new Date(row.class_date)
      const dk = d.toISOString().split('T')[0]
      const tk = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      times.add(tk)
      if (!map[dk]) map[dk] = {}
      map[dk][tk] = Number(row.pct)
    })

    ocupacion.forEach(row => {
      const d = new Date(row.class_date)
      times.add(`${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`)
    })

    return { map, dates, times: Array.from(times).sort(), todayStr }
  }, [heatmap, ocupacion])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── HERO — 3 columns ── */}
      <div style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
        {/* Col 1: Revenue perdido */}
        <div>
          <p style={lbl}>Revenue perdido hoy</p>
          <p style={{ color: RED, fontSize: 28, fontWeight: 700, fontFamily: MONO, margin: '6px 0 10px', lineHeight: 1 }}>
            {fmt(revenuePerdido, '$')}
          </p>
          <div style={{ background: BD, height: 4, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(100 - avgOcupacion, 100)}%`, height: '100%', background: RED, borderRadius: 2 }} />
          </div>
          <p style={{ color: MUT, fontSize: 10, fontFamily: MONO, margin: '6px 0 0' }}>
            {numClases} clases · {totalBicis} bicis · {Math.round(totalBicis - avgSpots)} vacías/clase
          </p>
        </div>

        {/* Col 2: Ocupación */}
        <div>
          <p style={lbl}>Ocupación promedio</p>
          <p style={{ color: GOLD, fontSize: 28, fontWeight: 700, fontFamily: MONO, margin: '6px 0 10px', lineHeight: 1 }}>
            {avgOcupacion}%
          </p>
          <div style={{ background: BD, height: 4, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${avgOcupacion}%`, height: '100%', background: GOLD, borderRadius: 2 }} />
          </div>
          <p style={{ color: MUT, fontSize: 10, fontFamily: MONO, margin: '6px 0 0' }}>
            {totalSpots} spots de {totalBicis * numClases} posibles
          </p>
        </div>

        {/* Col 3: Ingresado */}
        <div>
          <p style={lbl}>Ingresado este mes</p>
          <p style={{ color: INK, fontSize: 28, fontWeight: 700, fontFamily: MONO, margin: '6px 0 10px', lineHeight: 1 }}>
            {fmt(kpis.ingresos, '$')}
          </p>
          <div style={{ background: BD, height: 4, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ width: `${Math.min((currentDay / daysInMonth) * 100, 100)}%`, height: '100%', background: GREEN, borderRadius: 2 }} />
          </div>
          <p style={{ color: MUT, fontSize: 10, fontFamily: MONO, margin: '6px 0 0' }}>
            {kpis.paquetes} paquetes · ${kpis.ticket} ticket prom.
          </p>
        </div>
      </div>

      {/* ── ROW 2 — Clases hoy + Heatmap ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 12 }}>
        {/* Clases de hoy */}
        <div style={card}>
          <p style={{ ...lbl, marginBottom: 12 }}>Clases de hoy</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ocupacion.map((row, i) => {
              const pct = Number(row.pct_ocupacion)
              const spots = Number(row.spots_ocupados)
              const hour = new Date(row.class_date).toLocaleTimeString('es-MX', {
                hour: '2-digit', minute: '2-digit',
              })
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 42, fontSize: 11, color: MUT, fontFamily: MONO }}>{hour}</span>
                  <div style={{ flex: 1, background: BD, height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: barColor(pct), borderRadius: 3,
                      transition: 'width 0.3s',
                    }} />
                  </div>
                  <span style={{ width: 38, fontSize: 11, color: MUT, fontFamily: MONO, textAlign: 'right' }}>
                    {spots}/{totalBicis}
                  </span>
                </div>
              )
            })}
            {numClases === 0 && (
              <p style={{ color: MUT, fontSize: 12, fontFamily: MONO }}>Sin clases programadas</p>
            )}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, marginTop: 14 }}>
            {[
              { c: GREEN, l: '≥90%' },
              { c: GOLD, l: '70–89%' },
              { c: BLUE, l: '50–69%' },
              { c: '#A32D2D', l: '<50%' },
            ].map(x => (
              <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: MUT, fontFamily: MONO }}>
                <div style={{ width: 10, height: 4, borderRadius: 2, background: x.c }} />
                {x.l}
              </div>
            ))}
          </div>
        </div>

        {/* Heatmap semanal */}
        <div style={card}>
          <p style={{ ...lbl, marginBottom: 12 }}>Heatmap semanal</p>
          {heat.times.length > 0 ? (
            <div>
              {/* Header */}
              <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                <div style={{ width: 36 }} />
                {heat.dates.map((date, i) => (
                  <div key={date} style={{
                    flex: 1, textAlign: 'center', fontSize: 9, fontFamily: MONO,
                    color: date === heat.todayStr ? GOLD : MUT,
                    fontWeight: date === heat.todayStr ? 700 : 400,
                  }}>
                    {DIAS[i]}
                  </div>
                ))}
              </div>
              {/* Rows */}
              {heat.times.map(time => (
                <div key={time} style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                  <div style={{ width: 36, fontSize: 9, color: MUT, fontFamily: MONO, display: 'flex', alignItems: 'center' }}>
                    {time}
                  </div>
                  {heat.dates.map(date => {
                    const pct = heat.map[date]?.[time]
                    const isFuture = date > heat.todayStr
                    const isToday = date === heat.todayStr
                    return (
                      <div key={`${date}-${time}`} style={{
                        flex: 1, height: 24, borderRadius: 3,
                        background: pct !== undefined ? heatColor(pct) : '#1A1A1A',
                        border: isToday
                          ? `1.5px solid ${GOLD}`
                          : isFuture
                            ? '1px dashed #333'
                            : '1px solid transparent',
                      }} />
                    )
                  })}
                </div>
              ))}
              {/* Heat legend */}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'center' }}>
                {['0%', '25%', '50%', '75%', '100%'].map((l, i) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8, color: MUT, fontFamily: MONO }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: heatColor(i * 25 || 1) }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ color: MUT, fontSize: 11, fontFamily: MONO }}>Sin datos esta semana</p>
          )}
        </div>
      </div>

      {/* ── ROW 3 — Attention ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div style={{ ...card, borderLeft: `3px solid ${RED}` }}>
          <p style={{ ...lbl, color: RED, marginBottom: 4 }}>Churn risk</p>
          <p style={{ color: MUT, fontSize: 11, fontFamily: MONO, margin: '0 0 8px' }}>
            Paquetes vencen en 7d con clases sin usar
          </p>
          <p style={{ color: RED, fontSize: 28, fontWeight: 700, fontFamily: MONO, margin: 0, lineHeight: 1 }}>
            {churnRisk}
          </p>
        </div>
        <div style={{ ...card, borderLeft: `3px solid ${GOLD}` }}>
          <p style={{ ...lbl, color: GOLD, marginBottom: 4 }}>Baja ocupación</p>
          <p style={{ color: MUT, fontSize: 11, fontFamily: MONO, margin: '0 0 8px' }}>
            Clases mañana con &lt;50%
          </p>
          <p style={{ color: GOLD, fontSize: 28, fontWeight: 700, fontFamily: MONO, margin: 0, lineHeight: 1 }}>
            {clasesBajas}
          </p>
        </div>
        <div style={{ ...card, borderLeft: `3px solid ${GREEN}` }}>
          <p style={{ ...lbl, color: GREEN, marginBottom: 4 }}>Listos para renovar</p>
          <p style={{ color: MUT, fontSize: 11, fontFamily: MONO, margin: '0 0 8px' }}>
            Paquetes comprados hace 25–35d
          </p>
          <p style={{ color: GREEN, fontSize: 28, fontWeight: 700, fontFamily: MONO, margin: 0, lineHeight: 1 }}>
            {listosRenovar}
          </p>
        </div>
      </div>

      {/* ── ROW 4 — Chart + Lectura ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 12 }}>
        {/* Chart ingresos */}
        <div style={card}>
          <p style={{ ...lbl, marginBottom: 12 }}>Ingresos acumulados del mes</p>
          <ReactECharts
            option={{
              backgroundColor: 'transparent',
              grid: { left: 50, right: 50, top: 30, bottom: 25 },
              tooltip: { trigger: 'axis' },
              legend: {
                data: ['2026', '2025', 'Horas', 'Proyección'],
                textStyle: { color: MUT, fontSize: 9 },
                top: 0, right: 0,
                itemWidth: 14, itemHeight: 2,
              },
              xAxis: {
                type: 'category',
                data: xLabels,
                axisLabel: { color: MUT, fontSize: 9, interval: 4 },
                axisLine: { lineStyle: { color: BD } },
              },
              yAxis: [
                {
                  type: 'value', position: 'left',
                  axisLabel: { color: MUT, fontSize: 9, formatter: (v: number) => fmt(v, '$') },
                  splitLine: { lineStyle: { color: BD } },
                },
                {
                  type: 'value', position: 'right',
                  axisLabel: { color: MUT, fontSize: 9 },
                  splitLine: { show: false },
                },
              ],
              series: [
                {
                  name: '2026', type: 'line', data: chartIngresos,
                  smooth: true, connectNulls: true,
                  lineStyle: { color: GOLD, width: 2 },
                  itemStyle: { color: GOLD },
                  areaStyle: {
                    color: {
                      type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                      colorStops: [
                        { offset: 0, color: 'rgba(200,164,21,0.15)' },
                        { offset: 1, color: 'rgba(200,164,21,0)' },
                      ],
                    },
                  },
                },
                {
                  name: '2025', type: 'line', data: chartAnterior,
                  smooth: true, connectNulls: true,
                  lineStyle: { color: '#555', width: 1.5, type: 'dashed' },
                  itemStyle: { color: '#555' },
                },
                {
                  name: 'Horas', type: 'line', yAxisIndex: 1, data: chartHoras,
                  smooth: true, connectNulls: true,
                  lineStyle: { color: BLUE, width: 2 },
                  itemStyle: { color: BLUE },
                },
                {
                  name: 'Proyección', type: 'line', yAxisIndex: 1, data: chartHorasProy,
                  smooth: true, connectNulls: true,
                  lineStyle: { color: BLUE, width: 1.5, type: 'dashed' },
                  itemStyle: { color: BLUE },
                  symbol: 'none',
                },
              ],
            }}
            style={{ height: 260 }}
          />
          {/* 4 stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 14,
            borderTop: `1px solid ${BD}`, paddingTop: 12 }}>
            {[
              { l: 'Ingresado', v: fmt(kpis.ingresos, '$'), c: GOLD },
              { l: 'Paquetes', v: fmt(kpis.paquetes), c: GREEN },
              { l: 'Ticket prom.', v: fmt(kpis.ticket, '$'), c: GOLD },
              { l: 'Horas', v: fmt(horasConsumidas), c: BLUE },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' }}>
                <p style={{ ...lbl, fontSize: 9, letterSpacing: 1 }}>{s.l}</p>
                <p style={{ color: s.c, fontSize: 16, fontWeight: 700, fontFamily: MONO, margin: '4px 0 0' }}>
                  {s.v}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Lectura del negocio */}
        <div style={card}>
          <p style={{ ...lbl, marginBottom: 14 }}>Lectura del negocio</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, rowGap: 16 }}>
            {[
              { c: GOLD, f: `${fmt(kpis.ingresos, '$')} ingresados`, x: `${kpis.paquetes} paq · $${kpis.ticket} ticket` },
              { c: BLUE, f: `${kpis.clases} clases este mes`, x: `${horasConsumidas}h consumidas` },
              { c: avgOcupacion >= 70 ? GREEN : GOLD, f: `${avgOcupacion}% ocupación hoy`, x: `${totalSpots}/${totalBicis * numClases} spots` },
              { c: INK, f: `$${kpis.ticket} ticket prom.`, x: `$${horasConsumidas > 0 ? Math.round(kpis.ingresos / horasConsumidas) : 0}/hora` },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: b.c, marginTop: 4, flexShrink: 0,
                }} />
                <div>
                  <p style={{ color: INK, fontSize: 12, fontWeight: 500, margin: 0, fontFamily: MONO }}>
                    {b.f}
                  </p>
                  <p style={{ color: MUT, fontSize: 10, margin: '2px 0 0', fontFamily: MONO }}>
                    {b.x}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
