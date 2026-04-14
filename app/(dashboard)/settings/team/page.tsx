import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Mail,
  UserPlus,
  GitBranch,
  Settings2,
  CircleDot
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddUserForm } from "./add-user-form";
import { deleteUserAction, updateDistributionStrategy, forceOfflineAction } from "./actions";
import { Switch } from "@/components/ui/switch";

export default async function TeamSettingsPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const settings = await prisma.systemSettings.findUnique({
      where: { id: "singleton" }
  });

  const currentStrategy = settings?.leadDistributionStrategy || "MANUAL";

  const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab";

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Personnel Management</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white lowercase italic">
                /team.roster
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Manage clinical staff and administrative access for <span className="font-bold text-slate-900 dark:text-white">{clinicName}</span>.
            </p>
        </div>

        <Dialog>
            <DialogTrigger 
              render={
                <Button className="h-14 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl group transition-all">
                    <UserPlus className="h-4 w-4 mr-3 group-hover:scale-110 transition-transform" />
                    Provision New Member
                </Button>
              }
            />
            <DialogContent className="sm:max-w-[480px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl">
                <div className="p-8 pt-10 text-center bg-slate-50/50 border-b border-slate-100">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black tracking-tighter italic lowercase text-slate-900">
                            Create System Node
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-2">
                            Securely provision a new clinical or administrative identity
                        </DialogDescription>
                    </DialogHeader>
                </div>
                <div className="p-8 pb-10">
                    <AddUserForm />
                </div>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-10">
           {/* Distribution Strategy Section */}
           <Card className="surface-layered rounded-[3rem] border-none shadow-sm ring-1 ring-slate-200/50 p-10 bg-gradient-to-br from-white to-slate-50/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <GitBranch className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Matrix Routing</span>
                        </div>
                        <h3 className="text-2xl font-black italic tracking-tight">Lead Distribution Engine</h3>
                        <p className="text-sm font-medium text-slate-500 mt-2">
                            Select how incoming signals are mapped to clinical personnel nodes.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 min-w-[200px]">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                            <span className="text-xs font-black uppercase tracking-tight">Sequential (Round Robin)</span>
                            <form action={async () => {
                                "use server";
                                await updateDistributionStrategy("ROUND_ROBIN");
                            }}>
                                <Button 
                                    variant={currentStrategy === "ROUND_ROBIN" ? "default" : "outline"} 
                                    className={cn("h-8 rounded-xl text-[9px] font-black uppercase tracking-widest px-4 transition-all", 
                                        currentStrategy === "ROUND_ROBIN" ? "bg-primary text-white" : "text-slate-400 hover:text-primary")}
                                    type="submit"
                                >
                                    {currentStrategy === "ROUND_ROBIN" ? "Active" : "Enable"}
                                </Button>
                            </form>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                            <span className="text-xs font-black uppercase tracking-tight">Manual (Admin Assign)</span>
                            <form action={async () => {
                                "use server";
                                await updateDistributionStrategy("MANUAL");
                            }}>
                                <Button 
                                    variant={currentStrategy === "MANUAL" ? "default" : "outline"} 
                                    className={cn("h-8 rounded-xl text-[9px] font-black uppercase tracking-widest px-4 transition-all", 
                                        currentStrategy === "MANUAL" ? "bg-primary text-white" : "text-slate-400 hover:text-primary")}
                                    type="submit"
                                >
                                    {currentStrategy === "MANUAL" ? "Active" : "Enable"}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>
            </Card>

           <Card className="surface-layered rounded-[3rem] overflow-hidden border-none shadow-sm ring-1 ring-slate-200/50">
        <CardHeader className="p-12 pb-6 border-b border-slate-100 bg-slate-50/30">
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-black tracking-tight italic">Active Personnel</CardTitle>
                    <CardDescription className="text-sm font-medium">Currently active nodes in the engagement matrix.</CardDescription>
                </div>
                <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-3 py-1">
                    {users.length} TOTAL MEMBERS
                </Badge>
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 italic">
                            <th className="px-12 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</th>
                            <th className="px-12 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Designation</th>
                            <th className="px-12 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                            <th className="px-12 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.map((user) => (
                            <tr key={user.id} className="group hover:bg-slate-50/30 transition-colors">
                                <td className="px-12 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-[11px] font-black text-indigo-500 ring-1 ring-indigo-500/20">
                                            {user.name?.[0] || user.email[0].toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-slate-900">{user.name || "Anonymous User"}</span>
                                            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                                                <Mail className="h-3 w-3" />
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-12 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "h-2 w-2 rounded-full",
                                            user.role === 'ORG_ADMIN' ? "bg-rose-500" :
                                            user.role === 'DOCTOR' ? "bg-emerald-500" :
                                            "bg-indigo-500"
                                        )} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </div>
                                </td>
                                 <td className="px-12 py-6">
                                    {user.isOnline ? (
                                        <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] uppercase tracking-tighter shadow-lg shadow-emerald-500/20">
                                            <CircleDot className="h-2.5 w-2.5 mr-1" /> ONLINE
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[9px] uppercase tracking-tighter">
                                            OFFLINE
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-12 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {user.isOnline && (
                                            <form action={async () => {
                                                "use server";
                                                await forceOfflineAction(user.id);
                                            }}>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="h-8 rounded-xl text-[9px] font-black uppercase tracking-widest px-3 border border-slate-200 hover:bg-slate-900 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                                    type="submit"
                                                >
                                                    Force Offline
                                                </Button>
                                            </form>
                                        )}
                                        <form action={async () => {
                                            "use server";
                                            await deleteUserAction(user.id);
                                        }}>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </CardContent>
      </Card>
        </div>
        <div className="lg:col-span-1">
             <Card className="rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-200/50 p-8 space-y-6 sticky top-24">
                <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Access Control</span>
                </div>
                <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 mb-1">Administrative Role</p>
                        <p className="text-[10px] text-slate-500 font-medium">Full visibility, reassignment rights, and system settings.</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-tight text-slate-900 mb-1">Clinical Role</p>
                        <p className="text-[10px] text-slate-500 font-medium">Restricted view to owned leads only. No access to unassigned pool.</p>
                    </div>
                </div>
             </Card>
        </div>
      </div>
    </div>
  );
}

// Utility for status color
function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
