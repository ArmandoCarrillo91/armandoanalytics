'use client'

import ReactECharts from 'echarts-for-react'
import { PRIMARY, NEUTRAL, BORDER, INK, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'

interface Props {
  data: { semana: string; mo: number; partes: number }[]
}

export default function IngresosSemanales({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: BORDER,
      textStyle: { fontFamily: FONT, fontSize: 11, color: INK },
      formatter: (params: any) => {
        let r = params[0]?.axisValue || ''
        params.forEach((p: any) => { r += `<br/>${p.marker} ${p.seriesName}: ${fmtMoney(p.value)}` })
        return r
      },
    },
    legend: {
      bottom: 0,
      textStyle: { fontFamily: FONT, fontSize: 10, color: INK },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { left: 10, right: 10, top: 30, bottom: 50, containLabel: true },
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
        name: 'Mano de obra',
        type: 'bar',
        stack: 'ingresos',
        data: data.map((d) => d.mo),
        itemStyle: { color: PRIMARY, borderRadius: [0, 0, 0, 0] },
      },
      {
        name: 'Partes',
        type: 'bar',
        stack: 'ingresos',
        data: data.map((d) => d.partes),
        itemStyle: { color: NEUTRAL, borderRadius: [2, 2, 0, 0] },
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts ref={chartRef} option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
