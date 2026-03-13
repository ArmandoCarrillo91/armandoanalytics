'use client'

import ReactECharts from 'echarts-for-react'
import { PRIMARY, NEUTRAL, BORDER, INK, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'

interface Props {
  ingresos: { semana: string; mo: number; partes: number }[]
  servicios: { dia: string; cobrados: number }[]
}

export default function IngresosTotales({ ingresos, servicios }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const labels = ingresos.map((d) => d.semana)
  const svcMap = new Map<string, number>()
  for (const d of servicios) svcMap.set(d.dia, d.cobrados)

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: BORDER,
      textStyle: { fontFamily: FONT, fontSize: 11, color: INK },
      formatter: (params: any) => {
        let r = `<b>${params[0]?.axisValue || ''}</b>`
        params.forEach((p: any) => {
          if (p.seriesName === 'Ingresos') {
            r += `<br/>${p.marker} ${p.seriesName}: ${fmtMoney(p.value)}`
          } else {
            r += `<br/>${p.marker} ${p.seriesName}: ${p.value}`
          }
        })
        return r
      },
    },
    legend: {
      bottom: 0,
      textStyle: { fontFamily: FONT, fontSize: 10, color: INK },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { left: 50, right: 40, top: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { fontFamily: FONT, fontSize: 10, color: INK },
      axisLine: { lineStyle: { color: BORDER } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        position: 'left',
        axisLabel: { fontFamily: FONT, fontSize: 10, color: INK, formatter: (v: number) => fmtAxis(v) },
        splitLine: { lineStyle: { color: BORDER, type: 'dashed' } },
      },
      {
        type: 'value',
        position: 'right',
        minInterval: 1,
        axisLabel: { fontFamily: FONT, fontSize: 10, color: NEUTRAL },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'Ingresos',
        type: 'bar',
        yAxisIndex: 0,
        data: ingresos.map((d) => d.mo + d.partes),
        itemStyle: { color: PRIMARY, borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 28,
      },
      {
        name: 'Servicios pagados',
        type: 'line',
        yAxisIndex: 1,
        data: labels.map((l) => svcMap.get(l) ?? 0),
        itemStyle: { color: NEUTRAL },
        lineStyle: { width: 2, color: NEUTRAL },
        symbol: 'circle',
        symbolSize: 5,
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts ref={chartRef} option={option} notMerge={true} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
