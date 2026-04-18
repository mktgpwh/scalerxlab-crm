SELECT
  date_trunc('day' :: text, p."createdAt") AS DAY,
  i.department,
  p."tenantId",
  sum(p.amount) AS "totalRevenue"
FROM
  (
    payments p
    JOIN invoices i ON ((p."invoiceId" = i.id))
  )
GROUP BY
  (date_trunc('day' :: text, p."createdAt")),
  i.department,
  p."tenantId";