import { prisma } from "@/lib/prisma";
import { ExecutiveDashboard } from "./leads/executive-dashboard";
import { AgentHub } from "./leads/agent-hub";
import { auth } from "@/auth";
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
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user profile/role
  const profile = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true }
  });

  if (!profile) {
    redirect("/login");
  }

  const isAdmin = profile.role === "TELE_SALES_ADMIN" || profile.role === "FIELD_SALES_ADMIN" || profile.role === "SUPER_ADMIN";

  // Build Prisma Filters
  const dateFilter = getPrismaDateFilter(params.from, params.to);
  const categoryFilter = params.category ? { category: params.category as any } : {};
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

  // Enforce Visibility Architecture — strict RLS for Sales Nodes and Admins
  let visibilityFilter: any = {};
  
  if (profile.role === "SUPER_ADMIN") {
    visibilityFilter = {};
  } else if (profile.role === "TELE_SALES_ADMIN") {
    // Sees all Tele-Sales leads
    visibilityFilter = {
      owner: { role: "TELE_SALES" }
    };
  } else if (profile.role === "FIELD_SALES_ADMIN") {
    // Sees leads from their subordinates OR marked with FIELD_SALES roles
    visibilityFilter = {
      OR: [
        { ownerId: profile.id },
        { owner: { managerId: profile.id } },
        { owner: { role: "FIELD_SALES" } }
      ]
    };
  } else {
    // Standard User Silo (TELE_SALES, FIELD_SALES, etc.)
    visibilityFilter = { ownerId: profile.id };
  }

  const leads = await prisma.lead.findMany({
    where: {
      ...visibilityFilter,
      ...dateFilter,
      ...categoryFilter,
      ...branchFilter
    },
    select: {
      id: true,
      name: true,
      phone: true,
      whatsappNumber: true,
      email: true,
      source: true,
      status: true,
      intent: true,
      category: true,
      branchId: true,
      ownerId: true,
      aiScore: true,
      isEscalated: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, name: true, image: true } },
      branch: { select: { id: true, name: true } }
    },
    orderBy: { createdAt: "desc" },
  });

  // Telephony Today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const initialCallLogs = await prisma.callLog.findMany({
      where: {
          createdAt: { gte: todayStart },
      },
      select: {
          direction: true,
          status: true,
      }
  });

  // Daily Leads Time-Series (Last 30 Days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0,0,0,0);

  const rawHistory = await prisma.lead.findMany({
      where: {
          createdAt: { gte: thirtyDaysAgo },
          ...visibilityFilter
      },
      select: { createdAt: true }
  });

  const dailyCounts: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      dailyCounts[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0;
  }

  rawHistory.forEach(l => {
      const dayStr = l.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyCounts[dayStr] !== undefined) {
          dailyCounts[dayStr]++;
      }
  });

  const dailyLeadsSeries = Object.entries(dailyCounts).map(([day, count]) => ({ day, count }));

  const isOperationalRole = ["TELE_SALES", "FIELD_SALES", "COUNSELLOR", "FRONT_DESK"].includes(profile.role);

  if (isOperationalRole) {
    return (
      <AgentHub 
        initialLeads={leads as unknown as any[]} 
        currentUserId={profile.id}
        branches={branches as any[]}
        userRole={profile.role}
      />
    );
  }

  return (
    <ExecutiveDashboard 
      initialLeads={leads as unknown as Record<string, any>[]} 
      userRole={profile.role} 
      currentUserId={profile.id}
      team={team as any[]}
      branches={branches as any[]}
      initialCallLogs={initialCallLogs}
      dailyLeadsSeries={dailyLeadsSeries}
    />
  );
}
