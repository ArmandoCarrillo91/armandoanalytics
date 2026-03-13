'use client'

import ReactECharts from 'echarts-for-react'
import { NEUTRAL, PRIMARY, FONT } from '../chartColors'
import { fmtMoney, fmtAxis } from '../utils'
import { useChartResize } from '../useChartResize'
import { useChartColors } from '../useChartColors'

interface Props {
  data: { semana: string; costo: number; precio: number }[]
}

export default function CostoPrecioPartes({ data }: Props) {
  const { containerRef, chartRef } = useChartResize()
  const { ink, border } = useChartColors()
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'transparent',
      borderColor: border,
      textStyle: { fontFamily: FONT, fontSize: 11, color: ink },
      formatter: (params: any) => {
        let r = `<b>${params[0]?.axisValue || ''}</b>`
        let costo = 0
        let precio = 0
        params.forEach((p: any) => {
          r += `<br/>${p.marker} ${p.seriesName}: ${fmtMoney(p.value)}`
          if (p.seriesName === 'Lo que pagamos por las partes') costo = p.value
          if (p.seriesName === 'Lo que cobró el cliente') precio = p.value
        })
        const ganancia = precio - costo
        const pct = precio > 0 ? ((ganancia / precio) * 100).toFixed(1) : '0.0'
        if (precio > 0) {
          r += `<br/><b style="color:${PRIMARY}">Ganancia: ${fmtMoney(ganancia)} (${pct}%)</b>`
          r += `<br/><span style="font-size:10px;color:${NEUTRAL}">Procesamos ${fmtMoney(precio)} en partes, ganamos ${fmtMoney(ganancia)}</span>`
        }
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
        name: 'Lo que pagamos por las partes',
        type: 'bar',
        data: data.map((d) => d.costo),
        itemStyle: { color: NEUTRAL, borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 20,
      },
      {
        name: 'Lo que cobró el cliente',
        type: 'line',
        data: data.map((d) => d.precio),
        itemStyle: { color: PRIMARY },
        lineStyle: { width: 2, color: PRIMARY },
        areaStyle: { color: PRIMARY, opacity: 0.12 },
        symbol: 'circle',
        symbolSize: 5,
      },
    ],
  }

  return (
    <div ref={containerRef} className="w-full aspect-[5/2]">
      <ReactECharts ref={chartRef} option={option} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
