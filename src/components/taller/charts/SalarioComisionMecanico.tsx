'use client'

import ReactECharts from 'echarts-for-react'
import { NEUTRAL, WARNING, BORDER, INK, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'

interface Props {
  data: { nombre: string; salario: number; comision: number }[]
}

export default function SalarioComisionMecanico({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const sorted = [...data].sort((a, b) => (a.salario + a.comision) - (b.salario + b.comision))

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
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
        name: 'Salario',
        type: 'bar',
        stack: 'nomina',
        data: sorted.map((d) => d.salario),
        itemStyle: { color: NEUTRAL, borderRadius: [0, 0, 0, 0] },
        barMaxWidth: 18,
      },
      {
        name: 'Comisión',
        type: 'bar',
        stack: 'nomina',
        data: sorted.map((d) => d.comision),
        itemStyle: { color: WARNING, borderRadius: [0, 3, 3, 0] },
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
