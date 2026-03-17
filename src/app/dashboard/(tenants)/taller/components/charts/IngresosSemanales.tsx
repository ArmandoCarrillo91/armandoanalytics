'use client'

import dynamic from 'next/dynamic'
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })
import { PRIMARY, NEUTRAL, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  data: { semana: string; mo: number; partes: number }[]
}

export default function IngresosSemanales({ data }: Props) {
  const { containerRef, onChartReady } = useChartResize()
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
      <ReactECharts onChartReady={onChartReady} option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
