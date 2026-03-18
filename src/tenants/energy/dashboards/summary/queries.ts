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

export async function getIngresosAcumuladosAnio() {
  const { rows } = await pool.query(`
    SELECT
      EXTRACT(MONTH FROM created_at)::int as mes,
      SUM(SUM(price)) OVER (ORDER BY EXTRACT(MONTH FROM created_at)) as acumulado
    FROM client_packages
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
      AND published_at IS NOT NULL
    GROUP BY EXTRACT(MONTH FROM created_at)
    ORDER BY mes
  `)
  return rows
}

export async function getIngresosAcumuladosAnioAnterior() {
  const { rows } = await pool.query(`
    SELECT
      EXTRACT(MONTH FROM created_at)::int as mes,
      SUM(SUM(price)) OVER (ORDER BY EXTRACT(MONTH FROM created_at)) as acumulado
    FROM client_packages
    WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()) - 1
      AND published_at IS NOT NULL
    GROUP BY EXTRACT(MONTH FROM created_at)
    ORDER BY mes
  `)
  return rows
}

export async function getHorasAcumuladasAnio() {
  const { rows } = await pool.query(`
    SELECT
      EXTRACT(MONTH FROM class_date)::int as mes,
      ROUND((SUM(COUNT(*)) OVER (ORDER BY EXTRACT(MONTH FROM class_date)) * 0.75)::numeric) as horas_acumuladas
    FROM class_reservations
    WHERE EXTRACT(YEAR FROM class_date) = EXTRACT(YEAR FROM NOW())
      AND (is_refunded = false OR is_refunded IS NULL)
    GROUP BY EXTRACT(MONTH FROM class_date)
    ORDER BY mes
  `)
  return rows
}

/* ── Queries for new Energy dashboard ── */

export async function getIngresosAcumuladosMesAnterior() {
  const { rows } = await pool.query(`
    SELECT
      DATE_PART('day', created_at)::int as dia,
      SUM(SUM(price)) OVER (ORDER BY DATE_PART('day', created_at)) as acumulado
    FROM client_packages
    WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM NOW())
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW()) - 1
      AND published_at IS NOT NULL
    GROUP BY DATE_PART('day', created_at)
    ORDER BY dia
  `)
  return rows
}

export async function getHorasAcumuladasMes() {
  const { rows } = await pool.query(`
    SELECT
      DATE_PART('day', class_date)::int as dia,
      ROUND((SUM(COUNT(*)) OVER (ORDER BY DATE_PART('day', class_date)) * 0.75)::numeric) as horas
    FROM class_reservations
    WHERE DATE_TRUNC('month', class_date) = DATE_TRUNC('month', NOW())
      AND (is_refunded = false OR is_refunded IS NULL)
    GROUP BY DATE_PART('day', class_date)
    ORDER BY dia
  `)
  return rows
}

export async function getOcupacionSemanal() {
  const { rows } = await pool.query(`
    SELECT
      cr.class_date,
      COUNT(cr.id)::int as spots_ocupados,
      (SELECT COUNT(*)::int FROM bikes WHERE enabled = true) as spots_total,
      ROUND(COUNT(cr.id) * 100.0 /
        NULLIF((SELECT COUNT(*) FROM bikes WHERE enabled = true), 0), 0)::int as pct
    FROM class_reservations cr
    WHERE cr.class_date >= DATE_TRUNC('week', CURRENT_DATE)
      AND cr.class_date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
      AND cr.reservation_status = 'reserved'
      AND (cr.is_refunded = false OR cr.is_refunded IS NULL)
    GROUP BY cr.class_date
    ORDER BY cr.class_date
  `)
  return rows
}

export async function getChurnRisk() {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*)::int as count FROM client_packages
      WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        AND remaining_classes > 0
        AND published_at IS NOT NULL
    `)
    return rows[0]?.count ?? 0
  } catch {
    return 0
  }
}

export async function getClasesBajaOcupacionManana() {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*)::int as count FROM (
        SELECT cr.class_date
        FROM class_reservations cr
        WHERE cr.class_date::date = CURRENT_DATE + 1
          AND cr.reservation_status = 'reserved'
          AND (cr.is_refunded = false OR cr.is_refunded IS NULL)
        GROUP BY cr.class_date
        HAVING COUNT(cr.id) < (SELECT COUNT(*) FROM bikes WHERE enabled = true) * 0.5
      ) sub
    `)
    return rows[0]?.count ?? 0
  } catch {
    return 0
  }
}

export async function getOcupacionHeatmap() {
  const { rows } = await pool.query(`
    WITH clases AS (
      SELECT
        cr.class_date,
        EXTRACT(DOW FROM cr.class_date) AS dow,
        TO_CHAR(cr.class_date, 'HH24:MI') AS time_slot,
        COUNT(cr.id) AS spots_ocupados,
        (SELECT COUNT(*) FROM bikes WHERE enabled = true) AS spots_total
      FROM class_reservations cr
      WHERE cr.reservation_status = 'reserved'
        AND (cr.is_refunded = false OR cr.is_refunded IS NULL)
        AND cr.class_date >= NOW() - INTERVAL '8 weeks'
      GROUP BY cr.class_date
    )
    SELECT
      CASE dow
        WHEN 1 THEN 'Lun'
        WHEN 2 THEN 'Mar'
        WHEN 3 THEN 'Mié'
        WHEN 4 THEN 'Jue'
        WHEN 5 THEN 'Vie'
        WHEN 6 THEN 'Sáb'
        WHEN 0 THEN 'Dom'
      END AS day_label,
      time_slot,
      ROUND(AVG(spots_ocupados * 100.0 / NULLIF(spots_total, 0))::numeric, 0)::int AS avg_occupancy
    FROM clases
    GROUP BY dow, time_slot
    ORDER BY
      CASE dow WHEN 1 THEN 1 WHEN 2 THEN 2 WHEN 3 THEN 3 WHEN 4 THEN 4
               WHEN 5 THEN 5 WHEN 6 THEN 6 WHEN 0 THEN 7 END,
      time_slot
  `)
  return rows as { day_label: string; time_slot: string; avg_occupancy: number }[]
}

export async function getListosRenovar() {
  try {
    const { rows } = await pool.query(`
      SELECT COUNT(*)::int as count FROM client_packages
      WHERE created_at BETWEEN NOW() - INTERVAL '35 days' AND NOW() - INTERVAL '25 days'
        AND published_at IS NOT NULL
    `)
    return rows[0]?.count ?? 0
  } catch {
    return 0
  }
}
