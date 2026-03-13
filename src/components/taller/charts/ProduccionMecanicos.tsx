'use client'

import ReactECharts from 'echarts-for-react'
import { PRIMARY, NEUTRAL, BORDER, INK, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'

interface Props {
  data: { nombre: string; mo: number; comision: number }[]
}

export default function ProduccionMecanicos({ data }: Props) {
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
        const name = params[0]?.axisValue || ''
        let margen = 0
        let comision = 0
        params.forEach((p: any) => {
          if (p.seriesName === 'Margen taller') margen = p.value
          if (p.seriesName === 'Comisión') comision = p.value
        })
        const mo = margen + comision
        let r = `<b>${name}</b>`
        r += `<br/>MO generada: <b>${fmtMoney(mo)}</b>`
        r += `<br/><span style="color:${NEUTRAL}">\u25CF</span> Comisión: ${fmtMoney(comision)}`
        r += `<br/><span style="color:${PRIMARY}">\u25CF</span> Quedó en taller: ${fmtMoney(margen)}`
        return r
      },
    },
    legend: {
      bottom: 0,
      textStyle: { fontFamily: FONT, fontSize: 10, color: INK },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { left: 10, right: 10, top: 10, bottom: 40, containLabel: true },
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
        name: 'Comisión',
        type: 'bar',
        stack: 'total',
        data: sorted.map((d) => d.comision),
        itemStyle: { color: NEUTRAL },
        barMaxWidth: 18,
      },
      {
        name: 'Margen taller',
        type: 'bar',
        stack: 'total',
        data: sorted.map((d) => d.mo - d.comision),
        itemStyle: { color: PRIMARY, borderRadius: [0, 3, 3, 0] },
        barMaxWidth: 18,
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts ref={chartRef} option={option} notMerge={true} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
