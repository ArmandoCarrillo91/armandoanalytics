SELECT
  DATE_TRUNC('month', class_date) AS periodo,
  COUNT(*) AS clases_reservadas
FROM class_reservations
WHERE EXTRACT(YEAR FROM class_date) = EXTRACT(YEAR FROM NOW())
  AND (is_refunded = false OR is_refunded IS NULL)
GROUP BY periodo
ORDER BY periodo;
