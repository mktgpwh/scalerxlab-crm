import { prisma } from "@/lib/prisma";
import { ExecutiveDashboard } from "./executive-dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LeadsDashboardPage() {
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

  // Get Team for Reassignment (Admin Only)
  const team = isAdmin ? await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, role: true }
  }) : [];

  // Enforce Visibility Architecture
  const leads = await prisma.lead.findMany({
    where: isAdmin ? {} : {
      ownerId: profile.id
    },
    include: {
        owner: {
            select: {
                id: true,
                name: true,
                avatarUrl: true
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
    />
  );
}
