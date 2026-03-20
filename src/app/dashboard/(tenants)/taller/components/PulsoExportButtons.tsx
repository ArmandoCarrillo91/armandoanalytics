'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  canInterpret?: boolean
}

export default function PulsoExportButtons({ data, canInterpret = false }: Props) {
  const [open, setOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [interpreting, setInterpreting] = useState(false)
  const [remaining, setRemaining] = useState<number | null>(null)
  const [canUse, setCanUse] = useState(false)
  const [nextDate, setNextDate] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Fetch interpretame usage
  useEffect(() => {
    if (!canInterpret) return
    let cancelled = false
    async function fetchUsage() {
      const supabase = await createClient()
      const { data: usageData } = await supabase
        .from('usage_limits')
        .select('count, updated_at')
        .eq('feature', 'interpretame')
        .maybeSingle()
      if (cancelled) return
      const totalUsed = usageData?.count ?? 0
      const lastUsed = usageData?.updated_at ? new Date(usageData.updated_at) : null
      const rem = Math.max(0, 10 - totalUsed)
      const diasDesdeUltimoUso = lastUsed
        ? Math.floor((Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24))
        : 999
      setRemaining(rem)
      setCanUse(rem > 0 && diasDesdeUltimoUso >= 21)
      if (rem > 0 && diasDesdeUltimoUso < 21 && lastUsed) {
        setNextDate(
          new Date(lastUsed.getTime() + 21 * 24 * 60 * 60 * 1000)
            .toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
        )
      } else {
        setNextDate(null)
      }
    }
    fetchUsage()
    return () => { cancelled = true }
  }, [canInterpret])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 4000)
  }

  /* ── PDF ── */
  async function handlePdf() {
    setOpen(false)
    setPdfLoading(true)
    try {
      const content = document.getElementById('pulso-content')
      if (!content) return
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(content, { scale: 2, useCORS: true, backgroundColor: null })
      const imgWidth = 210
      const pageHeight = 297
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

  /* ── JSON ── */
  function handleJson() {
    setOpen(false)
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pulso-${data.periodo.desde}-${data.periodo.hasta}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Interprétame helpers ── */
  function buildPeriodoLabel(): string {
    const d = new Date(data.periodo.desde + 'T12:00:00')
    const monthName = d.toLocaleDateString('es-MX', { month: 'long' })
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${d.getFullYear()}`
  }

  function buildDashboardData() {
    const { kpis, alertas, cotizaciones, tendencia, gastos_breakdown } = data
    const ticketPromedio = cotizaciones.cobrados > 0
      ? Math.round(kpis.ingresos / cotizaciones.cobrados)
      : 0
    return {
      periodo: buildPeriodoLabel(),
      financiero: {
        ingresos: Math.round(kpis.ingresos),
        egresos_gastos: Math.round(kpis.egresos),
        nomina_pagada: 0,
        flujo_libre: Math.round(kpis.flujo_libre),
        margen_pct: Math.round(kpis.margen_bruto * 10) / 10,
      },
      operacional: {
        servicios_completados: cotizaciones.cobrados,
        ticket_promedio: ticketPromedio,
        por_cobrar: Math.round(alertas.cartera_por_cobrar),
        en_proceso: alertas.servicios_activos_mas_3_dias,
        costo_fijo_dia: 0,
        breakeven_diario: 0,
      },
      nomina: {
        total_pagado: 0,
        pct_ingresos: 0,
        roi_mo: Math.round(kpis.roi_mano_de_obra * 10) / 10,
        por_mecanico: alertas.mecanicos_roi_bajo.map(m => ({
          nombre: m.nombre, servicios: 0, mo_generada: 0, pagado: 0, roi: m.roi,
        })),
      },
      refaccionaria: { venta: 0, costo: 0, ganancia: 0, margen_pct: 0 },
      gastos_por_categoria: gastos_breakdown.map(g => ({
        categoria: g.grupo, total: Math.round(g.monto),
      })),
      tendencia_6_periodos: tendencia.map(t => ({
        periodo: t.label,
        ingresos: Math.round(t.ingresos),
        gastos: Math.round(t.egresos),
        utilidad: Math.round(t.flujo),
      })),
    }
  }

  /* ── Interprétame action ── */
  async function handleInterpret() {
    setOpen(false)
    setInterpreting(true)
    try {
      const periodoLabel = buildPeriodoLabel()
      const dashboardData = buildDashboardData()

      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardData, periodo: periodoLabel }),
      })

      if (res.status === 429) {
        const errData = await res.json()
        if (errData.error === 'demasiado_pronto') {
          setNextDate(errData.disponible_en)
          setCanUse(false)
          showToast(`Disponible el ${errData.disponible_en}`)
        } else {
          setRemaining(0)
          setCanUse(false)
          showToast('Usaste tu última interpretación')
        }
        return
      }

      if (!res.ok) throw new Error('Error al generar interpretación')

      const { content, remaining: rem } = await res.json()
      setRemaining(rem)
      setCanUse(false)
      setNextDate(
        new Date(Date.now() + 21 * 24 * 60 * 60 * 1000)
          .toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })
      )

      if (rem > 1) showToast(`Interpretación lista · Te quedan ${rem} de 10`)
      else if (rem === 1) showToast('Interpretación lista · Te queda 1 de 10')
      else showToast('Usaste tu última interpretación')

      // Generate PDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const pdfMargin = 20
      const maxWidth = pageWidth - pdfMargin * 2
      let y = pdfMargin

      doc.setFillColor(10, 10, 10)
      doc.rect(0, 0, pageWidth, 18, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Taller Mecánico Rafa', pdfMargin, 12)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Interpretación · ${periodoLabel}`, pageWidth - pdfMargin, 12, { align: 'right' })
      y = 30

      doc.setTextColor(20, 20, 20)
      for (const linea of content.split('\n')) {
        if (y > pageHeight - pdfMargin) { doc.addPage(); y = pdfMargin }
        const esTitulo = linea.startsWith('##') || linea.startsWith('**') || /^\d\./.test(linea)
        if (esTitulo) { doc.setFont('helvetica', 'bold'); doc.setFontSize(11) }
        else { doc.setFont('helvetica', 'normal'); doc.setFontSize(10) }
        const textoLimpio = linea.replace(/\*\*/g, '').replace(/^##\s?/, '').trim()
        if (!textoLimpio) { y += 4; continue }
        const wrapped = doc.splitTextToSize(textoLimpio, maxWidth)
        doc.text(wrapped, pdfMargin, y)
        y += wrapped.length * 6 + (esTitulo ? 3 : 1)
      }

      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        pdfMargin, pageHeight - 10,
      )

      const d = new Date(data.periodo.desde + 'T12:00:00')
      doc.save(`interpretacion-pulso-${d.toLocaleDateString('es-MX', { month: 'long' }).toLowerCase()}-${d.getFullYear()}.pdf`)
    } catch {
      showToast('Error al generar interpretación')
    } finally {
      setInterpreting(false)
    }
  }

  /* ── Interpret status text ── */
  const interpretDisabled = !canUse || interpreting || remaining === 0
  let interpretSubtext = ''
  if (remaining === null) interpretSubtext = 'Cargando...'
  else if (remaining === 0) interpretSubtext = 'Límite alcanzado'
  else if (!canUse && nextDate) interpretSubtext = `Disponible el ${nextDate}`
  else interpretSubtext = `${remaining} de 10 análisis disponibles`

  /* ── Trigger label ── */
  const triggerLabel = pdfLoading ? 'Generando PDF...' : interpreting ? 'Generando...' : 'Exportar'
  const busy = pdfLoading || interpreting

  /* ── Styles ── */
  const font = "'IBM Plex Mono', monospace"

  const itemStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '8px 12px',
    fontSize: 11,
    fontFamily: font,
    fontWeight: 500,
    background: 'none',
    border: 'none',
    color: 'var(--taller-ink)',
    cursor: 'pointer',
    textAlign: 'left',
  }

  const disabledItemStyle: React.CSSProperties = {
    ...itemStyle,
    color: 'var(--taller-muted)',
    cursor: 'not-allowed',
    opacity: 0.5,
  }

  /* ── Download icon (shared by PDF/JSON) ── */
  const downloadIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )

  /* ── Stack icon (Interprétame) ── */
  const stackIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  )

  return (
    <>
      <div ref={wrapRef} style={{ position: 'relative' }}>
        {/* Trigger button */}
        <button
          onClick={() => { if (!busy) setOpen(o => !o) }}
          disabled={busy}
          style={{
            fontFamily: font,
            fontSize: 11,
            fontWeight: 500,
            padding: '6px 14px',
            border: '1px solid var(--taller-border)',
            borderRadius: 6,
            background: 'var(--taller-surface)',
            color: 'var(--taller-ink)',
            cursor: busy ? 'wait' : 'pointer',
            transition: 'opacity 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
          onMouseEnter={(e) => { if (!busy) e.currentTarget.style.opacity = '0.7' }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
        >
          {downloadIcon}
          {triggerLabel}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {open && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 4px)',
              zIndex: 50,
              background: 'var(--taller-surface)',
              border: '1px solid var(--taller-border)',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              minWidth: 200,
              padding: '4px 0',
            }}
          >
            {/* PDF */}
            <button
              onClick={handlePdf}
              disabled={pdfLoading}
              style={pdfLoading ? disabledItemStyle : itemStyle}
              onMouseEnter={(e) => { if (!pdfLoading) (e.currentTarget.style.background = 'var(--taller-hover, rgba(0,0,0,0.04))') }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
            >
              {downloadIcon}
              <span>{pdfLoading ? 'Generando...' : 'Descargar PDF'}</span>
            </button>

            {/* JSON */}
            <button
              onClick={handleJson}
              style={itemStyle}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--taller-hover, rgba(0,0,0,0.04))' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
            >
              {downloadIcon}
              <span>Descargar JSON</span>
            </button>

            {/* Interprétame — only if canInterpret */}
            {canInterpret && (
              <>
                <div style={{ height: 1, background: 'var(--taller-border)', margin: '4px 0' }} />
                <button
                  onClick={handleInterpret}
                  disabled={interpretDisabled}
                  style={interpretDisabled ? disabledItemStyle : itemStyle}
                  onMouseEnter={(e) => { if (!interpretDisabled) (e.currentTarget.style.background = 'var(--taller-hover, rgba(0,0,0,0.04))') }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                >
                  {stackIcon}
                  <div>
                    <span>{interpreting ? 'Generando...' : 'Interprétame'}</span>
                    <span style={{ display: 'block', fontSize: 10, color: 'var(--taller-muted)', marginTop: 2, fontWeight: 400 }}>
                      {interpretSubtext}
                    </span>
                  </div>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: '#0f0f0f',
            color: '#ffffff',
            fontSize: 12,
            borderRadius: 6,
            padding: '10px 14px',
            zIndex: 9999,
            maxWidth: 340,
            lineHeight: 1.5,
            fontFamily: font,
            animation: 'fadeInToast .2s ease',
          }}
        >
          {toast}
          <style>{`@keyframes fadeInToast { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
        </div>
      )}
    </>
  )
}
