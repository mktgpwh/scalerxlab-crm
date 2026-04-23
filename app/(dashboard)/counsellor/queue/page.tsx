import { prisma } from "@/lib/prisma";
import { CounsellorQueueClient } from "./CounsellorQueueClient";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CounsellorQueuePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Lead RLS and Status Filter for Clinical Queue
  // We strictly pull VISITED leads (Patients who have checked-in at the front desk)
  const leads = await prisma.lead.findMany({
    where: {
      status: "VISITED"
    },
    include: {
      owner: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      updatedAt: "asc" // First In, First Out logic
    }
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <CounsellorQueueClient leads={leads as any} />
    </div>
  );
}
