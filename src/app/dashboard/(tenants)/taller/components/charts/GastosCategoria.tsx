'use client'

import dynamic from 'next/dynamic'
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })
import { PRIMARY, NEGATIVE, WARNING, NEUTRAL, FONT } from '../chartColors'
import { fmtMoney } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  data: { categoria: string; total: number }[]
}

const PALETTE = [NEGATIVE, WARNING, PRIMARY, NEUTRAL, '#c4b5a0']

export default function GastosCategoria({ data }: Props) {
  const { containerRef, onChartReady } = useChartResize()
  const { ink, border } = useChartColors()
  const total = data.reduce((s, d) => s + d.total, 0)

  const option = {
    tooltip: {
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
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
      <ReactECharts onChartReady={onChartReady} option={option} notMerge={true} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
