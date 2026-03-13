'use client'

import { useState } from 'react'

interface PulsoExportData {
  periodo: { desde: string; hasta: string }
  kpis: {
    flujo_libre: number
    ingresos: number
    egresos: number
    margen_bruto: number
    roi_mano_de_obra: number
  }
  alertas: {
    cartera_por_cobrar: number
    servicios_sin_cobrar: number
    servicios_activos_mas_3_dias: number
    mecanicos_roi_bajo: { nombre: string; roi: number }[]
  }
  cotizaciones: {
    total: number
    aprobados: number
    cobrados: number
    no_aprobados: number
    pct_aprobacion: number
    pct_cobrado: number
    pct_cancelacion: number
  }
  tendencia: { label: string; ingresos: number; egresos: number; flujo: number }[]
  gastos_breakdown: { grupo: string; monto: number; pct: number }[]
}

interface Props {
  data: PulsoExportData
}

export default function PulsoExportButtons({ data }: Props) {
  const [pdfLoading, setPdfLoading] = useState(false)

  async function handlePdf() {
    setPdfLoading(true)
    try {
      const content = document.getElementById('pulso-content')
      if (!content) return

      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF('p', 'mm', 'a4')
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`pulso-${data.periodo.desde}-${data.periodo.hasta}.pdf`)
    } catch (e) {
      console.error('Error generating PDF:', e)
    } finally {
      setPdfLoading(false)
    }
  }

  function handleJson() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pulso-${data.periodo.desde}-${data.periodo.hasta}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const btnStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    fontWeight: 500,
    padding: '6px 14px',
    border: '1px solid var(--taller-border)',
    borderRadius: 6,
    background: 'var(--taller-surface)',
    color: 'var(--taller-ink)',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  }

  return (
    <>
      <button
        onClick={handlePdf}
        disabled={pdfLoading}
        style={{
          ...btnStyle,
          opacity: pdfLoading ? 0.6 : 1,
          cursor: pdfLoading ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => { if (!pdfLoading) e.currentTarget.style.opacity = '0.7' }}
        onMouseLeave={(e) => { if (!pdfLoading) e.currentTarget.style.opacity = '1' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        {pdfLoading ? 'Generando...' : 'PDF'}
      </button>

      <button
        onClick={handleJson}
        style={btnStyle}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.7' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        JSON
      </button>
    </>
  )
}
