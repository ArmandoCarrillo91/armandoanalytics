SELECT
  DATE_TRUNC('month', created_at) AS periodo,
  COUNT(*)                         AS clientes_nuevos
FROM energy.clients
WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
  AND published_at IS NOT NULL
GROUP BY periodo
ORDER BY periodo;