'use client'

import ReactECharts from 'echarts-for-react'
import { PRIMARY, BORDER, INK, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'

interface Props {
  data: { semana: string; costo: number; utilidad: number }[]
}

export default function MargenPartes({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: BORDER,
      textStyle: { fontFamily: FONT, fontSize: 11, color: INK },
      formatter: (params: any) => {
        const p = params[0]
        if (!p) return ''
        const d = data[p.dataIndex]
        const total = d.costo + d.utilidad
        const pct = total > 0 ? ((d.utilidad / total) * 100).toFixed(1) : '0.0'
        return `<b>${p.axisValue}</b><br/>${p.marker} Utilidad: ${fmtMoney(d.utilidad)}<br/>Margen: ${pct}%`
      },
    },
    grid: { left: 10, right: 10, top: 30, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.semana),
      axisLabel: { fontFamily: FONT, fontSize: 10, color: INK },
      axisLine: { lineStyle: { color: BORDER } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontFamily: FONT, fontSize: 10, color: INK, formatter: (v: number) => fmtAxis(v) },
      splitLine: { lineStyle: { color: BORDER, type: 'dashed' } },
    },
    series: [
      {
        name: 'Utilidad',
        type: 'bar',
        data: data.map((d) => d.utilidad),
        itemStyle: { color: PRIMARY, borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 24,
        label: {
          show: true,
          position: 'top',
          fontFamily: FONT,
          fontSize: 9,
          color: INK,
          formatter: (p: any) => {
            const d = data[p.dataIndex]
            const total = d.costo + d.utilidad
            return total > 0 ? `${((d.utilidad / total) * 100).toFixed(0)}%` : ''
          },
        },
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts ref={chartRef} option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
