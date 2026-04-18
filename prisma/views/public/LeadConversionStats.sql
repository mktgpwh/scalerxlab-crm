SELECT
  source,
  "tenantId",
  (count(*)) :: integer AS "rawCount",
  (
    count(*) FILTER (
      WHERE
        (STATUS = 'WON' :: "LeadStatus")
    )
  ) :: integer AS "wonCount",
  (
    (
      (
        count(*) FILTER (
          WHERE
            (STATUS = 'WON' :: "LeadStatus")
        )
      ) :: double precision / (NULLIF(count(*), 0)) :: double precision
    ) * (100) :: double precision
  ) AS "conversionRate"
FROM
  leads
GROUP BY
  source,
  "tenantId";