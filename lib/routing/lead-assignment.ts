import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * STRATEGIC LEAD ASSIGNMENT ENGINE
 * Routes incoming leads to the most appropriate online operational node.
 */
export async function assignIncomingLead(leadId: string) {
  try {
    console.log(`📡 [ROUTING_ENGINE] Optimizing assignment for Lead: ${leadId}`);

    // 1. Fetch Lead Details for Quality Gating
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    const score = lead?.aiLeadScore || "UNSCORED";

    // 2. QUALITY GATE: Protect human nodes from COLD leads
    if (score === "COLD" || score === "UNQUALIFIED") {
        console.warn(`❄️ [ROUTING_ENGINE] Shunting COLD lead ${leadId} to AI Triage pool.`);
        await prisma.lead.update({
            where: { id: leadId },
            data: { isUnderAITriage: true, isAutoAssigned: true }
        });
        return null;
    }

    // 3. Identify Target Pool: Online SALES_USER nodes
    const operationalPool = await prisma.user.findMany({
      where: {
        role: "SALES_USER",
        isOnline: true,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            ownedLeads: {
              where: {
                assignedAt: {
                  gte: new Date(new Date().setHours(0, 0, 0, 0)), // Load factor for today
                },
              },
            },
          },
        },
      },
    });

    let assignedUser = null;

    if (operationalPool.length > 0) {
      // 2. Fair Share Selection: Pick the node with the lowest current load
      const minLoad = Math.min(...operationalPool.map((u) => u._count.ownedLeads));
      const candidates = operationalPool.filter((u) => u._count.ownedLeads === minLoad);
      
      // Random hash for distribution balance among equal candidates
      assignedUser = candidates[Math.floor(Math.random() * candidates.length)];
      console.log(`✅ [ROUTING_ENGINE] Routed to SALES_USER: ${assignedUser.email} (Load: ${minLoad})`);
    } else {
      // 3. Autonomous AI Fallback Layer
      console.warn(`🤖 [ROUTING_ENGINE] ALL HUMAN NODES OFFLINE. Initializing Autonomous AI Triage.`);
      
      // Execute Triage Handshake
      await prisma.$transaction([
        prisma.lead.update({
          where: { id: leadId },
          data: {
            ownerId: null,
            assignedAt: null,
            isUnderAITriage: true,
            isAutoAssigned: true,
          },
        }),
        prisma.activityLog.create({
          data: {
            leadId,
            action: "AI_TRIAGE_STARTED",
            description: "No sales agents online. AgentX has taken command of the lead qualifier pipeline.",
            metadata: {
              strategy: "AUTONOMOUS_AI_FALLBACK",
              status: "TRIAGE_ACTIVE"
            },
          },
        }),
      ]);

      return null; // Return null to indicate no human assigned (triage active)
    }

    if (!assignedUser) {
      console.error(`❌ [ROUTING_ENGINE] FATAL: No valid nodes found for routing.`);
      return null;
    }

    // 5. Execute Assignment & Log Transition
    await prisma.$transaction([
      prisma.lead.update({
        where: { id: leadId },
        data: {
          ownerId: assignedUser.id,
          assignedAt: new Date(),
          isAutoAssigned: true,
        },
      }),
      prisma.activityLog.create({
        data: {
          leadId,
          userId: assignedUser.id,
          action: "AUTO_ROUTED",
          description: `Lead strategically routed to ${assignedUser.name || assignedUser.email} (Role: ${assignedUser.role}).`,
          metadata: {
            routingStrategy: "FAIR_SHARE_PRESENCE",
            targetRole: assignedUser.role,
          },
        },
      }),
    ]);

    return assignedUser;
  } catch (error) {
    console.error(`💥 [ROUTING_ENGINE_ERROR]`, error);
    return null;
  }
}

/**
 * AUTO-HANDOFF PROTOCOL
 * Redistributes all leads under AI Triage as soon as a SALES_USER goes online.
 */
export async function processTriageQueue() {
  try {
    const triageLeads = await prisma.lead.findMany({
      where: { isUnderAITriage: true, ownerId: null },
    });

    if (triageLeads.length === 0) return;

    console.log(`🔄 [HANDOFF_PROTOCOL] Re-routing ${triageLeads.length} leads from Triage to Operational nodes.`);

    for (const lead of triageLeads) {
      // Re-run assignment logic (will now find online users)
      const assignedUser = await assignIncomingLead(lead.id);
      
      if (assignedUser) {
        // Mark triage as finished
        await prisma.lead.update({
          where: { id: lead.id },
          data: { isUnderAITriage: false }
        });

        await prisma.activityLog.create({
          data: {
            leadId: lead.id,
            userId: assignedUser.id,
            action: "AI_HANDOFF_COMPLETE",
            description: `Lead handed off from AI Triage to ${assignedUser.name || assignedUser.email}.`,
          }
        });
      }
    }
  } catch (error) {
    console.error(`💥 [HANDOFF_PROTOCOL_ERROR]`, error);
  }
}
