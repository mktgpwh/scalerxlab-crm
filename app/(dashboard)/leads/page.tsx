import { prisma } from "@/lib/prisma";
import { ExecutiveDashboard } from "./executive-dashboard";

export default async function LeadsDashboardPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <ExecutiveDashboard initialLeads={leads as unknown as Record<string, any>[]} />
  );
}
