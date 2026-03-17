'use client'

import dynamic from 'next/dynamic'
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })
import { PRIMARY, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  data: { semana: string; costo: number; utilidad: number }[]
}

export default function MargenPartes({ data }: Props) {
  const { containerRef, onChartReady } = useChartResize()
  const { ink, border } = useChartColors()
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
      formatter: (params: any) => {
        const p = params[0]
        if (!p) return ''
        const d = data[p.dataIndex]
        const total = d.costo + d.utilidad
        const pct = total > 0 ? ((d.utilidad / total) * 100).toFixed(1) : '0.0'
        return `<b>${p.axisValue}</b><br/>${p.marker} Utilidad: ${fmtMoney(d.utilidad)}<br/>Margen: ${pct}%`
      },
    },
    grid: { left: 10, right: 10, top: 30, bottom: 30, containLabel: true },
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
        name: 'Utilidad',
        type: 'bar',
        data: data.map((d) => d.utilidad),
        itemStyle: { color: PRIMARY, borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 24,
        label: {
          show: true,
          position: 'top',
          fontFamily: FONT,
          fontSize: 9,
          color: ink,
          formatter: (p: any) => {
            const d = data[p.dataIndex]
            const total = d.costo + d.utilidad
            return total > 0 ? `${((d.utilidad / total) * 100).toFixed(0)}%` : ''
          },
        },
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts onChartReady={onChartReady} option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
