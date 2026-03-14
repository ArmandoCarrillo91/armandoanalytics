'use client'

import ReactECharts from 'echarts-for-react'
import { PRIMARY, WARNING, NEGATIVE, FONT } from '../chartColors'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  data: { semana: string; costo: number; utilidad: number }[]
}

function margenColor(pct: number) {
  if (pct >= 30) return PRIMARY
  if (pct >= 15) return WARNING
  return NEGATIVE
}

export default function MargenRefacciones({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const { ink, border } = useChartColors()
  const sorted = [...data]
  const margins = sorted.map((d) => {
    const precio = d.costo + d.utilidad
    return precio > 0 ? (d.utilidad / precio) * 100 : 0
  })

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
      formatter: (params: any) => {
        const p = params[0]
        if (!p) return ''
        return `${p.axisValue}: ${Number(p.value).toFixed(1)}% margen`
      },
    },
    grid: { left: 10, right: 10, top: 30, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: sorted.map((d) => d.semana),
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink },
      axisLine: { lineStyle: { color: border } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: {
        fontFamily: FONT,
        fontSize: 10,
        color: ink,
        formatter: (v: number) => `${v}%`,
      },
      splitLine: { lineStyle: { color: border, type: 'dashed' } },
    },
    series: [
      {
        type: 'bar',
        data: margins.map((pct) => ({
          value: Number(pct.toFixed(1)),
          itemStyle: { color: margenColor(pct), borderRadius: [2, 2, 0, 0] },
        })),
        barMaxWidth: 24,
        label: {
          show: true,
          position: 'top',
          fontFamily: FONT,
          fontSize: 10,
          color: ink,
          formatter: (p: any) => `${Number(p.value).toFixed(1)}%`,
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
