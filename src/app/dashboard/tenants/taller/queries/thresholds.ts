/**
 * Business thresholds for the Pulso dashboard.
 * Centralised here so pulso/page.tsx and PulsoPublic.tsx stay in sync.
 */

/* ── ROI ── */
export const ROI_EXCELLENT = 2      // > this → green
export const ROI_WARNING   = 1.5    // >= this → amber, below → red
export const ROI_MO_SCALE  = 3      // progress-bar divisor (bar fills at 3×)

/* ── Cost targets (% of revenue) ── */
export const COST_TARGETS = {
  Operación:      40,
  Nómina:         30,
  Local:          25,
  Personal:        5,
  Administración: 15,
} as const

export const TOTAL_COST_TARGET = 65          // structural-health ceiling
export const COST_WARNING_FACTOR = 0.8       // amber when > target × this

/* ── Margin ── */
export const GROSS_MARGIN_TARGET = 35        // %

/* ── Operational alerts ── */
export const STALE_SERVICE_DAYS = 3          // services open longer than this
export const LOW_MECHANIC_ROI = 1.5          // flag mechanics below this

/* ── Helper functions ── */

export function roiBadgeColor(roi: number) {
  if (roi > ROI_EXCELLENT) return '#16a34a'
  if (roi >= ROI_WARNING)  return '#d97706'
  return '#dc2626'
}

export function costColor(pct: number, target: number) {
  if (pct > target) return '#dc2626'
  if (pct > target * COST_WARNING_FACTOR) return '#d97706'
  return '#0070f3'
}
