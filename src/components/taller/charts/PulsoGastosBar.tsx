'use client'

import ReactECharts from 'echarts-for-react'
import { BORDER, INK, FONT } from '../chartColors'
import { fmtMoney } from '../utils'
import { useChartResize } from '../useChartResize'

interface Props {
  data: { grupo: string; monto: number; pct: number }[]
}

export default function PulsoGastosBar({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: BORDER,
      textStyle: { fontFamily: FONT, fontSize: 11, color: INK },
      formatter: (params: any) => {
        const p = params[0]
        if (!p) return ''
        const d = data[p.dataIndex]
        return `<b>${d.grupo}</b><br/>${d.pct.toFixed(1)}% de ingresos — ${fmtMoney(d.monto)}`
      },
    },
    grid: { left: 100, right: 110, top: 10, bottom: 10, containLabel: true },
    xAxis: { type: 'value', show: false },
    yAxis: {
      type: 'category',
      data: data.map(d => d.grupo),
      inverse: true,
      axisLabel: { fontFamily: FONT, fontSize: 11, color: INK },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: data.map(d => d.pct),
        itemStyle: { color: '#c94a4a', borderRadius: [0, 3, 3, 0] },
        barMaxWidth: 12,
        label: {
          show: true,
          position: 'right',
          fontFamily: FONT,
          fontSize: 10,
          color: INK,
          formatter: (p: any) => {
            const d = data[p.dataIndex]
            return `${d.pct.toFixed(1)}%  ${fmtMoney(d.monto)}`
          },
        },
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full" style={{ height: 153 }}>
      <ReactECharts ref={chartRef} option={option} notMerge style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
