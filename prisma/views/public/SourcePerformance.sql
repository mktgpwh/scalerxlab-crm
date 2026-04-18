SELECT
  l.source,
  l."tenantId",
  sum(COALESCE(i."totalAmount", (0) :: double precision)) AS "totalBilled"
FROM
  (
    leads l
    LEFT JOIN invoices i ON ((l.id = i."leadId"))
  )
GROUP BY
  l.source,
  l."tenantId";