import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserTable } from "@/components/users/user-table";
import { AddUserModal } from "@/components/users/add-user-modal";
import { Users, ShieldCheck, Activity } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersSettingsPage() {
  const session = await auth();

  // 1. Strict Security Guard: Only Super Admin can access this command layer
  if (!session?.user || session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  // 2. Fetch High-Fidelity Data
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
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      {/* Tactical Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100 dark:border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Personnel Command</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900 lowercase italic">
            /identity.matrix
          </h2>
          <p className="text-sm font-medium text-slate-500">
            Securely provision and manage clinical nodes for <span className="font-bold text-slate-900">{clinicName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 mr-2">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Sovereign Encryption Active</span>
          </div>
          <AddUserModal branches={branches} />
        </div>
      </div>

      {/* Main Data Layer */}
      <div className="grid grid-cols-1 gap-10">
        <div className="surface-layered rounded-[3rem] overflow-hidden border-none shadow-sm ring-1 ring-slate-200/50 bg-white/50 backdrop-blur-xl">
           <UserTable users={users as any[]} />
        </div>
      </div>

      {/* System Intel Footer */}
      <div className="flex items-center justify-center pt-10">
          <div className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm opacity-60">
              <Activity className="h-3 w-3 text-slate-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Registry Snapshot: {users.length} Active Personnels</span>
          </div>
      </div>
    </div>
  );
}
