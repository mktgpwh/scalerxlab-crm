import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Lead } from "@/lib/types";

import { ExecutiveDashboard } from "./executive-dashboard";

export default async function LeadsDashboardPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params;
  
  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: { id: true, name: true }
  });

  if (!organization) {
    notFound(); 
  }

  const leads = await prisma.lead.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ExecutiveDashboard initialLeads={leads as unknown as Record<string, any>[]} orgSlug={orgSlug} />
  );
}
