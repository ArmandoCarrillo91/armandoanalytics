'use client'

import ReactECharts from 'echarts-for-react'
import { PRIMARY, BORDER, INK, FONT } from '../chartColors'
import { fmtAxisCount } from '../utils'
import { useChartResize } from '../useChartResize'

interface Props {
  data: { dia: string; total: number; cobrados: number }[]
}

export default function ServiciosDiarios({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: BORDER,
      textStyle: { fontFamily: FONT, fontSize: 11, color: INK },
      formatter: (params: any) => {
        const p = params[0]
        return p ? `<b>${p.axisValue}</b><br/>${p.marker} Cobrados: ${p.value}` : ''
      },
    },
    grid: { left: 10, right: 10, top: 10, bottom: 30, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.dia),
      axisLabel: { fontFamily: FONT, fontSize: 10, color: INK },
      axisLine: { lineStyle: { color: BORDER } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: { fontFamily: FONT, fontSize: 10, color: INK, formatter: (v: number) => fmtAxisCount(v) },
      splitLine: { lineStyle: { color: BORDER, type: 'dashed' } },
    },
    series: [
      {
        name: 'Cobrados',
        type: 'bar',
        data: data.map((d) => d.cobrados),
        itemStyle: { color: PRIMARY, borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 24,
        label: {
          show: true,
          position: 'top',
          fontFamily: FONT,
          fontSize: 9,
          color: INK,
          formatter: (p: any) => (p.value > 0 ? String(p.value) : ''),
        },
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts ref={chartRef} option={option} notMerge={true} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
