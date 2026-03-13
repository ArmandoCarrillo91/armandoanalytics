'use client'

import ReactECharts from 'echarts-for-react'
import { PRIMARY, BORDER, INK, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'

interface Props {
  data: { nombre: string; mo: number }[]
}

export default function MOGenerada({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const sorted = [...data].sort((a, b) => a.mo - b.mo)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: BORDER,
      textStyle: { fontFamily: FONT, fontSize: 11, color: INK },
      formatter: (params: any) => {
        let r = params[0]?.axisValue || ''
        params.forEach((p: any) => { r += `<br/>${p.marker} ${fmtMoney(p.value)}` })
        return r
      },
    },
    grid: { left: 10, right: 10, top: 30, bottom: 30, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { fontFamily: FONT, fontSize: 10, color: INK, formatter: (v: number) => fmtAxis(v) },
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
        data: sorted.map((d) => d.mo),
        itemStyle: { color: PRIMARY, borderRadius: [0, 3, 3, 0] },
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
