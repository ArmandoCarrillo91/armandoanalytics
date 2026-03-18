'use client'

import { useMemo } from 'react'

/* ── Types ── */
type HeatmapRow = {
  day_label: string
  time_slot: string
  avg_occupancy: number
}

type Props = {
  data: HeatmapRow[]
  p75Threshold?: number
}

/* ── Palette (energycyclestudio.com) ── */
const BG = '#F5F3EE'
const INK = '#1a1a1a'
const YELLOW = '#FFD000'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/* ── Color scale ── */
function getCellStyle(pct: number | null): {
  bg: string; color: string; bold: boolean; text: string
} {
  if (pct === null)
    return { bg: '#e8e4dc', color: '#bbb', bold: false, text: '—' }
  if (pct < 20)
    return { bg: '#f5e9a0', color: '#9e8800', bold: false, text: `${Math.round(pct)}%` }
  if (pct < 40)
    return { bg: '#FFF0A0', color: '#7a6600', bold: false, text: `${Math.round(pct)}%` }
  if (pct < 55)
    return { bg: '#FFE04D', color: INK, bold: false, text: `${Math.round(pct)}%` }
  if (pct < 70)
    return { bg: YELLOW, color: INK, bold: false, text: `${Math.round(pct)}%` }
  if (pct < 85)
    return { bg: '#E6A800', color: INK, bold: false, text: `${Math.round(pct)}%` }
  return { bg: INK, color: '#FFE000', bold: true, text: `${Math.round(pct)}%` }
}

const LEGEND = [
  { label: 'Sin clase', bg: '#e8e4dc', color: '#bbb' },
  { label: 'Vacío <20%', bg: '#f5e9a0', color: '#9e8800' },
  { label: 'Bajo 20–39%', bg: '#FFF0A0', color: '#7a6600' },
  { label: 'Medio 40–54%', bg: '#FFE04D', color: INK },
  { label: 'Bueno 55–69%', bg: YELLOW, color: INK },
  { label: 'Muy bueno 70–84%', bg: '#E6A800', color: INK },
  { label: 'Lleno ≥85%', bg: INK, color: '#FFE000' },
]

/* ── Component ── */
export default function OcupacionHeatmap({ data, p75Threshold = 85 }: Props) {
  const { timeSlots, grid } = useMemo(() => {
    const slots = new Set<string>()
    const map: Record<string, Record<string, number>> = {}

    data.forEach(row => {
      slots.add(row.time_slot)
      if (!map[row.day_label]) map[row.day_label] = {}
      map[row.day_label][row.time_slot] = Number(row.avg_occupancy)
    })

    const sortedSlots = Array.from(slots).sort()

    const gridData = DAYS.map(day => ({
      day,
      cells: sortedSlots.map(slot => {
        const val = map[day]?.[slot] ?? null
        return { slot, value: val, ...getCellStyle(val) }
      }),
    }))

    return { timeSlots: sortedSlots, grid: gridData }
  }, [data])

  return (
    <div style={{
      background: BG,
      borderRadius: 14,
      padding: '28px 32px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h2 style={{
            margin: 0, fontSize: 22, fontWeight: 700, color: INK, letterSpacing: -0.5,
          }}>
            Ocupaci&oacute;n por horario
          </h2>
          <span style={{
            background: YELLOW,
            color: INK,
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 20,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
          }}>
            HEATMAP
          </span>
        </div>
        <p style={{
          margin: 0, fontSize: 14, color: '#888', fontStyle: 'italic',
        }}>
          Promedio hist&oacute;rico de las &uacute;ltimas 8 semanas &middot; umbral lleno &ge;{p75Threshold}% (p75)
        </p>
      </div>

      {/* ── Legend ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20,
      }}>
        {LEGEND.map(item => (
          <div key={item.label} style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: 5,
              background: item.bg,
              border: item.bg === '#e8e4dc' ? '1px solid #d5d0c8' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {item.bg === INK && (
                <span style={{ color: item.color, fontSize: 7, fontWeight: 700 }}>%</span>
              )}
            </div>
            <span style={{ color: '#666' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* ── Grid ── */}
      {timeSlots.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 5,
          }}>
            {/* Column headers: time slots */}
            <thead>
              <tr>
                <th style={{
                  width: 52, padding: '0 4px 8px 0', textAlign: 'left',
                  fontSize: 11, fontWeight: 600, color: '#aaa',
                }} />
                {timeSlots.map(slot => (
                  <th key={slot} style={{
                    padding: '0 0 8px', textAlign: 'center',
                    fontSize: 11, fontWeight: 600, color: '#999',
                    whiteSpace: 'nowrap',
                  }}>
                    {slot}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Rows: days */}
            <tbody>
              {grid.map(row => (
                <tr key={row.day}>
                  <td style={{
                    paddingRight: 8, fontSize: 13, fontWeight: 600, color: INK,
                    whiteSpace: 'nowrap', verticalAlign: 'middle',
                  }}>
                    {row.day}
                  </td>
                  {row.cells.map(cell => (
                    <td
                      key={`${row.day}-${cell.slot}`}
                      title={cell.value !== null
                        ? `${row.day} ${cell.slot}: ${Math.round(cell.value)}% ocupación`
                        : `${row.day} ${cell.slot}: sin clase`
                      }
                      style={{
                        background: cell.bg,
                        color: cell.color,
                        fontWeight: cell.bold ? 700 : 500,
                        fontSize: 13,
                        textAlign: 'center',
                        borderRadius: 8,
                        padding: 15,
                        cursor: 'default',
                        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                        minWidth: 52,
                      }}
                      onMouseEnter={e => {
                        ;(e.currentTarget as HTMLElement).style.boxShadow =
                          '0 2px 8px rgba(0,0,0,0.15)'
                        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'
                      }}
                      onMouseLeave={e => {
                        ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
                        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                      }}
                    >
                      {cell.text}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: '#999', fontSize: 14, textAlign: 'center', padding: '40px 0' }}>
          Sin datos de ocupaci&oacute;n disponibles
        </p>
      )}
    </div>
  )
}
