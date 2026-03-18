import pool from '@/lib/energy-db'

export async function getClasesAnio() {
  const { rows } = await pool.query(`
    SELECT
      DATE_TRUNC('month', class_date) AS periodo,
      COUNT(*) AS clases_reservadas
    FROM class_reservations
    WHERE EXTRACT(YEAR FROM class_date) = EXTRACT(YEAR FROM NOW())
      AND (is_refunded = false OR is_refunded IS NULL)
    GROUP BY periodo
    ORDER BY periodo
  `)
  return rows
}

export async function getOcupacionHoy() {
  const { rows } = await pool.query(`
    SELECT
      cr.class_date,
      COUNT(cr.id) as spots_ocupados,
      (SELECT COUNT(*) FROM bikes WHERE enabled = true) as spots_total,
      ROUND(COUNT(cr.id) * 100.0 /
        (SELECT COUNT(*) FROM bikes WHERE enabled = true), 0) as pct_ocupacion
    FROM class_reservations cr
    WHERE cr.class_date::date = CURRENT_DATE
      AND cr.reservation_status = 'reserved'
      AND (cr.is_refunded = false OR cr.is_refunded IS NULL)
    GROUP BY cr.class_date
    ORDER BY cr.class_date
  `)
  return rows
}

export async function getIngresosAcumulados() {
  const { rows } = await pool.query(`
    SELECT
      DATE_PART('day', created_at)::int as dia,
      SUM(SUM(price)) OVER (ORDER BY DATE_PART('day', created_at)) as acumulado,
      SUM(price) as diario
    FROM client_packages
    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
      AND published_at IS NOT NULL
    GROUP BY DATE_PART('day', created_at)
    ORDER BY dia
  `)
  return rows
}

export async function getKPIsMes() {
  const [ingresos, clases, paquetes, ticket] = await Promise.all([
    pool.query(`
      SELECT COALESCE(SUM(price), 0) as ingresos FROM client_packages
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
      AND published_at IS NOT NULL
    `),
    pool.query(`
      SELECT COUNT(*) as clases FROM class_reservations
      WHERE DATE_TRUNC('month', class_date) = DATE_TRUNC('month', NOW())
      AND (is_refunded = false OR is_refunded IS NULL)
    `),
    pool.query(`
      SELECT COUNT(*) as paquetes FROM client_packages
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
      AND published_at IS NOT NULL
    `),
    pool.query(`
      SELECT COALESCE(ROUND(AVG(price)::numeric, 0), 0) as ticket FROM client_packages
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
      AND published_at IS NOT NULL
    `),
  ])
  return {
    ingresos: Number(ingresos.rows[0]?.ingresos ?? 0),
    clases: Number(clases.rows[0]?.clases ?? 0),
    paquetes: Number(paquetes.rows[0]?.paquetes ?? 0),
    ticket: Number(ticket.rows[0]?.ticket ?? 0),
  }
}

export async function getTendencia() {
  const { rows } = await pool.query(`
    SELECT
      DATE_TRUNC('month', class_date) as periodo,
      COUNT(*) as clases
    FROM class_reservations
    WHERE EXTRACT(YEAR FROM class_date) = EXTRACT(YEAR FROM NOW())
      AND (is_refunded = false OR is_refunded IS NULL)
    GROUP BY periodo
    ORDER BY periodo
  `)
  return rows
}

export async function getTotalBicis() {
  const { rows } = await pool.query(`
    SELECT COUNT(*) as total FROM bikes WHERE enabled = true
  `)
  return parseInt(rows[0].total)
}

export async function getTicketPromedio() {
  const { rows } = await pool.query(`
    SELECT
      DATE_TRUNC('month', created_at) as periodo,
      ROUND(AVG(price)::numeric, 0) as ticket
    FROM client_packages
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
      AND published_at IS NOT NULL
    GROUP BY periodo
    ORDER BY periodo
  `)
  return rows
}
