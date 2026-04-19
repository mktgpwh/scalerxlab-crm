import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserManagementClient } from "@/components/users/user-management-client";
import { Users, ShieldCheck, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersSettingsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const [users, branches] = await Promise.all([
    prisma.user.findMany({
      include: {
        branch: { select: { name: true, city: true } }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, city: true }
    })
  ]);

  const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab";

  return (
    <UserManagementClient 
      initialUsers={users as any[]} 
      branches={branches} 
      clinicName={clinicName}
    />
  );
}

