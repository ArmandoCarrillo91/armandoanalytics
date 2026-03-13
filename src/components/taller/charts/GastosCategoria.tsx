'use client'

import ReactECharts from 'echarts-for-react'
import { PRIMARY, NEGATIVE, WARNING, NEUTRAL, BORDER, INK, FONT } from '../chartColors'
import { fmtMoney } from '../utils'
import { useChartResize } from '../useChartResize'

interface Props {
  data: { categoria: string; total: number }[]
}

const PALETTE = [NEGATIVE, WARNING, PRIMARY, NEUTRAL, '#c4b5a0']

export default function GastosCategoria({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const total = data.reduce((s, d) => s + d.total, 0)

  const option = {
    tooltip: {
      backgroundColor: '#fff',
      borderColor: BORDER,
      textStyle: { fontFamily: FONT, fontSize: 11, color: INK },
      formatter: (p: any) => {
        const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : '0.0'
        return `${p.name}<br/>${fmtMoney(p.value)} (${pct}%)`
      },
    },
    series: [
      {
        type: 'treemap',
        width: '100%',
        height: '100%',
        roam: false,
        nodeClick: false,
        breadcrumb: { show: false },
        label: {
          show: true,
          fontFamily: FONT,
          fontSize: 11,
          color: '#fff',
          formatter: (p: any) => {
            const pct = total > 0 ? ((p.value / total) * 100).toFixed(0) : '0'
            return `${p.name}\n${pct}%`
          },
        },
        upperLabel: { show: false },
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2,
          gapWidth: 2,
        },
        data: data.map((d, i) => ({
          value: d.total,
          name: d.categoria,
          itemStyle: { color: PALETTE[i % PALETTE.length] },
        })),
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts ref={chartRef} option={option} notMerge={true} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
