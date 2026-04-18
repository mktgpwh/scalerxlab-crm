import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * LEAD DISTRIBUTION ENGINE
 * Assigns leads to online agents using a Fair Share (Least Busy) algorithm.
 */
export async function distributeLead(leadId: string) {
  try {
    // 1. Fetch Super Admin for fallback distribution
    const superAdmin = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });

    // 2. Verify Distribution Policy
    const settings = await prisma.systemSettings.findUnique({
      where: { id: "singleton" }
    });

    const isRoundRobin = settings?.leadDistributionStrategy === "ROUND_ROBIN";

    if (!isRoundRobin) {
      console.log(`ℹ️ [DISTRIBUTOR] Policy is MANUAL. Falling back to Super Admin default assignment.`);
      if (superAdmin) {
          await prisma.lead.update({ where: { id: leadId }, data: { ownerId: superAdmin.id, assignedAt: new Date(), isAutoAssigned: true } });
          return superAdmin;
      }
      return null;
    }

    // 3. Identify Online Operational Pool (Agents & Counselors)
    const onlineUsers = await prisma.user.findMany({
      where: {
        isOnline: true,
        isActive: true,
        role: { in: ["AGENT", "COUNSELOR"] }
      },
      include: {
        _count: {
          select: {
            ownedLeads: {
              where: {
                assignedAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)) // Leads assigned today
                }
              }
            }
          }
        }
      }
    });

    if (onlineUsers.length === 0) {
      console.warn("⚠️ [DISTRIBUTOR] No online agents available. Falling back to SUPER_ADMIN.");
      if (superAdmin) {
          await prisma.lead.update({ where: { id: leadId }, data: { ownerId: superAdmin.id, assignedAt: new Date(), isAutoAssigned: true } });
          return superAdmin;
      }
      return null;
    }

    // 3. Fair-Share Algorithm: Pick user with fewest assignments today
    // If multiple have same count, pick randomly among them
    const minAssignmentCount = Math.min(...onlineUsers.map(u => u._count.ownedLeads));
    const candidates = onlineUsers.filter(u => u._count.ownedLeads === minAssignmentCount);
    
    // Pick random candidate from the least-busy pool
    const selectedUser = candidates[Math.floor(Math.random() * candidates.length)];

    // 4. Execute Assignment
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ownerId: selectedUser.id,
        assignedAt: new Date(),
        isAutoAssigned: true
      }
    });

    // 5. Audit Log
    await prisma.activityLog.create({
      data: {
        leadId,
        userId: selectedUser.id,
        action: "AUTO_ASSIGNED",
        description: `Lead auto-assigned to ${selectedUser.name || selectedUser.email} via Fair Share algorithm.`,
        metadata: { strategy: "ROUND_ROBIN", totalToday: minAssignmentCount }
      }
    });

    console.log(`✅ [DISTRIBUTOR] Lead ${leadId} assigned to ${selectedUser.email}`);
    return selectedUser;
  } catch (error) {
    console.error("💥 [DISTRIBUTOR_FATAL]", error);
    return null;
  }
}
