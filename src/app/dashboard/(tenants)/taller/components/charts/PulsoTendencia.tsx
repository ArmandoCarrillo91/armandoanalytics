'use client'

import dynamic from 'next/dynamic'
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })
import { FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  data: { label: string; ingresos: number; egresos: number; flujo: number }[]
  hideLegend?: boolean
}

export default function PulsoTendencia({ data, hideLegend }: Props) {
  const { containerRef, onChartReady } = useChartResize()
  const { ink, muted, border } = useChartColors()
  const allNegative = data.length > 0 && data.every(d => d.flujo < 0)

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
      formatter: (params: any) => {
        let r = `<b>${params[0]?.axisValue || ''}</b>`
        params.forEach((p: any) => {
          r += `<br/>${p.marker} ${p.seriesName}: ${fmtMoney(p.value)}`
        })
        return r
      },
    },
    legend: {
      show: !hideLegend,
      bottom: 0,
      textStyle: { fontFamily: FONT, fontSize: 10, color: ink },
      itemWidth: 12,
      itemHeight: 8,
    },
    grid: { left: 55, right: 20, top: 20, bottom: hideLegend ? 10 : 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(d => d.label),
      axisLabel: { fontFamily: FONT, fontSize: 10, color: ink },
      axisLine: { lineStyle: { color: border } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        fontFamily: FONT,
        fontSize: 10,
        color: ink,
        formatter: (v: number) => fmtAxis(v),
      },
      splitLine: { lineStyle: { color: border, type: 'dashed' } },
    },
    series: [
      {
        name: 'Ingresos',
        type: 'line',
        data: data.map(d => d.ingresos),
        lineStyle: { color: ink, width: 2 },
        itemStyle: { color: ink },
        symbol: 'circle',
        symbolSize: 4,
        smooth: true,
      },
      {
        name: 'Egresos',
        type: 'line',
        data: data.map(d => d.egresos),
        lineStyle: { color: muted, width: 2, type: 'dashed' },
        itemStyle: { color: muted },
        symbol: 'circle',
        symbolSize: 4,
        smooth: true,
      },
      {
        name: 'Flujo libre',
        type: 'line',
        data: data.map(d => d.flujo),
        lineStyle: { color: '#2d6a4f', width: 2 },
        itemStyle: { color: '#2d6a4f' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: allNegative
              ? [
                  { offset: 0, color: 'rgba(201,74,74,0.15)' },
                  { offset: 1, color: 'rgba(201,74,74,0.02)' },
                ]
              : [
                  { offset: 0, color: 'rgba(45,106,79,0.15)' },
                  { offset: 1, color: 'rgba(45,106,79,0.02)' },
                ],
          },
        },
        symbol: 'circle',
        symbolSize: 4,
        smooth: true,
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[16/7]">
      <ReactECharts onChartReady={onChartReady} option={option} notMerge style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
