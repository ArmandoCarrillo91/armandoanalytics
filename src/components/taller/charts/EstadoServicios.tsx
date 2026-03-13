'use client'

import ReactECharts from 'echarts-for-react'
import { PRIMARY, WARNING, NEGATIVE, FONT } from '../chartColors'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  pagados: number
  enProceso: number
  sinCobrar: number
}

export default function EstadoServicios({ pagados, enProceso, sinCobrar }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const { ink, border } = useChartColors()
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
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
          { value: pagados, name: 'Cobrados', itemStyle: { color: PRIMARY } },
          { value: enProceso, name: 'En proceso', itemStyle: { color: WARNING } },
          { value: sinCobrar, name: 'Sin cobrar', itemStyle: { color: NEGATIVE } },
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
