import { prisma } from "@/lib/prisma";
import { ExecutiveDashboard } from "./leads/executive-dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPrismaDateFilter } from "@/lib/utils/date-filters";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ 
    from?: string; 
    to?: string; 
    category?: string;
    branchId?: string;
  }>;
}

export default async function CommandCenterPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile/role
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true }
  });

  if (!profile) {
    redirect("/login");
  }

  const isAdmin = profile.role === "ORG_ADMIN" || profile.role === "SUPER_ADMIN";

  // Build Prisma Filters
  const dateFilter = getPrismaDateFilter(params.from, params.to);
  const categoryFilter = params.category ? { category: params.category } : {};
  const branchFilter = params.branchId ? { branchId: params.branchId } : {};

  // Get Active Branches for Attribution
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true }
  });

  // Get Team for Reassignment (Admin Only)
  const team = isAdmin ? await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true }
  }) : [];

  // Enforce Visibility Architecture
  const leads = await prisma.lead.findMany({
    where: {
      ...(isAdmin ? {} : { ownerId: profile.id }),
      ...dateFilter,
      ...categoryFilter,
      ...branchFilter
    },
    include: {
        owner: {
            select: {
                id: true,
                name: true,
                avatarUrl: true
            }
        },
        branch: {
            select: {
                id: true,
                name: true
            }
        }
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <ExecutiveDashboard 
      initialLeads={leads as unknown as Record<string, any>[]} 
      userRole={profile.role} 
      currentUserId={profile.id}
      team={team as any[]}
      branches={branches as any[]}
    />
  );
}
