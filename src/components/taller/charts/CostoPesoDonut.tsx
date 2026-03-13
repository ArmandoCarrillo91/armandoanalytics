'use client'

import ReactECharts from 'echarts-for-react'
import { NEGATIVE, WARNING, NEUTRAL, PRIMARY, BORDER, INK, FONT } from '../chartColors'
import { fmtMoney } from '../utils'
import { useChartResize } from '../useChartResize'

interface Props {
  data: { grupo: string; total: number }[]
}

const PALETTE = [NEGATIVE, WARNING, NEUTRAL, PRIMARY]

export default function CostoPesoDonut({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const filtered = data.filter((d) => d.total > 0)

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      borderColor: BORDER,
      textStyle: { fontFamily: FONT, fontSize: 11, color: INK },
      formatter: (p: any) => `${p.marker} ${p.name}: ${fmtMoney(p.value)} (${p.percent}%)`,
    },
    legend: {
      orient: 'horizontal' as const,
      bottom: 0,
      textStyle: { fontFamily: FONT, fontSize: 10, color: INK },
      itemWidth: 12,
      itemHeight: 8,
    },
    series: [
      {
        type: 'pie',
        radius: ['35%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: 'inside',
          formatter: '{d}%',
          fontSize: 11,
          color: '#fff',
          fontFamily: FONT,
        },
        data: filtered.map((d, i) => ({
          value: d.total,
          name: d.grupo,
          itemStyle: { color: PALETTE[i % PALETTE.length] },
        })),
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[4/3]">
      <ReactECharts ref={chartRef} option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
