-- SQL Setup for Sovereign Intelligence Matrix Views
-- Execute this in Supabase SQL Editor if automated migration fails

-- 1. Daily Revenue Summary
DROP VIEW IF EXISTS "DailyRevenueSummary";
CREATE VIEW "DailyRevenueSummary" AS
SELECT 
  date_trunc('day', p."createdAt") as "day",
  i."department",
  p."tenantId",
  SUM(p."amount")::float as "totalRevenue"
FROM "payments" p
JOIN "invoices" i ON p."invoiceId" = i."id"
GROUP BY 1, 2, 3;

-- 2. Lead Conversion Stats
DROP VIEW IF EXISTS "LeadConversionStats";
CREATE VIEW "LeadConversionStats" AS
SELECT 
  "source",
  "tenantId",
  COUNT(*)::int as "rawCount",
  COUNT(*) FILTER (WHERE "status" = 'WON')::int as "wonCount",
  (COUNT(*) FILTER (WHERE "status" = 'WON')::float / NULLIF(COUNT(*), 0) * 100)::float as "conversionRate"
FROM "leads"
GROUP BY 1, 2;

-- 3. Lead Source Performance
DROP VIEW IF EXISTS "SourcePerformance";
CREATE VIEW "SourcePerformance" AS
SELECT 
  l."source",
  l."tenantId",
  SUM(COALESCE(i."totalAmount", 0))::float as "totalBilled"
FROM "leads" l
LEFT JOIN "invoices" i ON l."id" = i."leadId"
GROUP BY 1, 2;
