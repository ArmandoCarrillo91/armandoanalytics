'use client'

import dynamic from 'next/dynamic'

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false })

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

type Row = { periodo: string, clases_reservadas: number }

export default function ClasesAnio({ data = [] }: { data: Row[] }) {
  const option = {
    title: { text: 'Clases reservadas — 2026' },
    xAxis: {
      type: 'category',
      data: data.map(d => MESES[new Date(d.periodo).getMonth()])
    },
    yAxis: { type: 'value' },
    series: [{ type: 'bar', data: data.map(d => d.clases_reservadas) }]
  }
  return <ReactECharts option={option} style={{ height: 400 }} />
}
