export const chartColors = {
  primary: '#0070f3',    // azul — dato principal/positivo
  neutral: '#97928a',    // gris — contexto/secundario
  negative: '#c94a4a',   // rojo — negativo/alerta
  warning: '#f5a623',    // ámbar — atención
  surface: '#ffffff',
  muted: '#e5e1d8',
}

// Shorthand aliases — these are accent/semantic colors that stay the same in both themes
export const PRIMARY = '#0070f3'
export const NEUTRAL = '#97928a'
export const NEGATIVE = '#c94a4a'
export const WARNING = '#f5a623'
export const FONT = "'IBM Plex Mono', monospace"

// These should use CSS variables in components instead of these constants
// Prefer var(--taller-border) and var(--taller-ink) in inline styles
export const BORDER = '#e5e1d8'
export const INK = '#1a1814'
