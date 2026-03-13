'use client'

import ReactECharts from 'echarts-for-react'
import { NEUTRAL, BORDER, INK, FONT } from '../chartColors'
import { fmtAxisCount } from '../utils'
import { useChartResize } from '../useChartResize'

interface Props {
  data: { nombre: string; servicios: number }[]
}

export default function ServiciosMecanico({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const sorted = [...data].sort((a, b) => a.servicios - b.servicios)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: BORDER,
      textStyle: { fontFamily: FONT, fontSize: 11, color: INK },
    },
    grid: { left: 10, right: 10, top: 30, bottom: 30, containLabel: true },
    xAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontFamily: FONT, fontSize: 10, color: INK, formatter: (v: number) => fmtAxisCount(v) },
      splitLine: { lineStyle: { color: BORDER, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((d) => d.nombre),
      axisLabel: { fontFamily: FONT, fontSize: 10, color: INK },
      axisLine: { lineStyle: { color: BORDER } },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((d) => d.servicios),
        itemStyle: { color: NEUTRAL, borderRadius: [0, 3, 3, 0] },
        barMaxWidth: 18,
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts ref={chartRef} option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
