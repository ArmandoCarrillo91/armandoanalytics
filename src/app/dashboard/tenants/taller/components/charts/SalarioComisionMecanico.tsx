'use client'

import ReactECharts from 'echarts-for-react'
import { NEUTRAL, WARNING, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  data: { nombre: string; salario: number; comision: number }[]
}

export default function SalarioComisionMecanico({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const { ink, border } = useChartColors()
  const sorted = [...data].sort((a, b) => (a.salario + a.comision) - (b.salario + b.comision))

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
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
      type: 'value',
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink, formatter: (v: number) => fmtAxis(v) },
      splitLine: { lineStyle: { color: border, type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((d) => d.nombre),
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink },
      axisLine: { lineStyle: { color: border } },
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
