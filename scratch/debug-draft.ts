import { prisma } from "@/lib/prisma";
import { generateDraftAction } from "@/app/(dashboard)/inbox/actions";

async function debugDraft() {
    try {
        const lead = await prisma.lead.findFirst({
            where: { name: { contains: "Roshan" } },
            select: { id: true, name: true }
        });

        if (!lead) {
            console.log("Lead 'Roshan' not found.");
            return;
        }

        console.log(`Found Lead: ${lead.name} (${lead.id})`);

        const result = await generateDraftAction(lead.id);
        console.log("Draft Action Result:", JSON.stringify(result, null, 2));

    } catch (err) {
        console.error("Debug Error:", err);
    }
}

debugDraft();
