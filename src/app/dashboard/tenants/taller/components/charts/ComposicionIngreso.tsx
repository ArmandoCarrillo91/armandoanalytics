'use client'

import ReactECharts from 'echarts-for-react'
import { PRIMARY, NEUTRAL, FONT } from '../chartColors'
import { fmtMoney } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  mo: number
  partes: number
}

export default function ComposicionIngreso({ mo, partes }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const { ink, border } = useChartColors()
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
      formatter: (p: any) => `${p.marker} ${p.name}: ${fmtMoney(p.value)}`,
    },
    legend: {
      bottom: 0,
      textStyle: { fontFamily: FONT, fontSize: 10, color: ink },
      itemWidth: 12,
      itemHeight: 8,
    },
    series: [
      {
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: { show: false },
        data: [
          { value: mo, name: 'Mano de obra', itemStyle: { color: PRIMARY } },
          { value: partes, name: 'Partes', itemStyle: { color: NEUTRAL } },
        ],
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[4/3]">
      <ReactECharts ref={chartRef} option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
