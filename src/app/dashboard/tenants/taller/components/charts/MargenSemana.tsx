'use client'

import ReactECharts from 'echarts-for-react'
import { NEUTRAL, PRIMARY, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  data: { semana: string; ingresos: number; utilidad: number }[]
}

export default function MargenSemana({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const { ink, border } = useChartColors()
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
      formatter: (params: any) => {
        let r = params[0]?.axisValue || ''
        params.forEach((p: any) => { r += `<br/>${p.marker} ${p.seriesName}: ${fmtMoney(p.value)}` })
        return r
      },
    },
    legend: {
      bottom: 0,
      textStyle: { fontFamily: FONT, fontSize: 10, color: ink },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { left: 10, right: 10, top: 30, bottom: 50, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.semana),
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink },
      axisLine: { lineStyle: { color: border } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink, formatter: (v: number) => fmtAxis(v) },
      splitLine: { lineStyle: { color: border, type: 'dashed' } },
    },
    series: [
      {
        name: 'Costos',
        type: 'bar',
        stack: 'total',
        data: data.map((d) => d.ingresos - d.utilidad),
        itemStyle: { color: NEUTRAL },
      },
      {
        name: 'Utilidad',
        type: 'bar',
        stack: 'total',
        data: data.map((d, i) => ({
          value: d.utilidad,
          label: {
            show: true,
            position: 'top' as const,
            fontFamily: FONT,
            fontSize: 9,
            color: ink,
            formatter: () => {
              const ing = data[i].ingresos
              return ing > 0 ? `${((d.utilidad / ing) * 100).toFixed(0)}%` : ''
            },
          },
        })),
        itemStyle: { color: PRIMARY, borderRadius: [2, 2, 0, 0] },
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts ref={chartRef} option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
