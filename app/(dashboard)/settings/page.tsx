import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  ShieldCheck, 
  Users, 
  Key,
  Globe,
  Save,
  MapPin
} from "lucide-react";
import { ManageCenters } from "./manage-centers";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { AddUserForm } from "./team/add-user-form";

export default async function SettingsPage() {
  const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab";
  const branches = await prisma.branch.findMany({
    orderBy: { createdAt: "desc" }
  });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Security & Configuration</span>
        </div>
        <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white lowercase italic">
          /system.config
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
           Managing core sovereignty and workspace parameters for <span className="font-bold text-slate-900 dark:text-white underline decoration-emerald-500/30 underline-offset-4">{clinicName}</span>.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-slate-900 h-14 rounded-3xl p-1.5 border border-slate-200/60 dark:border-white/5 shadow-sm">
          <TabsTrigger value="general" className="rounded-2xl text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Building className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-2xl text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Key className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-2xl text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="team" className="rounded-2xl text-xs font-bold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Users className="w-4 h-4 mr-2" />
            Team
          </TabsTrigger>
          <TabsTrigger value="locations" className="rounded-2xl text-xs font-bold uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
            <MapPin className="w-4 h-4 mr-2" />
            Locations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-8">
           <Card className="surface-layered rounded-[3rem] overflow-hidden border-none">
              <CardHeader className="p-12 pb-6">
                <CardTitle className="text-2xl font-black tracking-tight italic">Workspace Metadata</CardTitle>
                <CardDescription className="text-sm font-medium">Basic organizational identifiers.</CardDescription>
              </CardHeader>
              <CardContent className="p-12 pt-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Legal Entity Name</Label>
                        <Input defaultValue={clinicName} className="h-12 rounded-2xl bg-slate-50 border-none font-bold shadow-inner ring-1 ring-slate-200/50" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">System Slug (ReadOnly)</Label>
                        <Input defaultValue="scalerx-core" disabled className="h-12 rounded-2xl bg-slate-100 border-none font-mono text-xs opacity-60" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Primary Domain</Label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="clinic.scalerxlab.com" className="h-12 rounded-2xl pl-12 bg-slate-50 border-none font-bold shadow-inner ring-1 ring-slate-200/50" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end pt-8">
                    <Button className="h-12 px-8 rounded-full bg-primary font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                        <Save className="w-4 h-4 mr-2" />
                        Persist Changes
                    </Button>
                </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-8">
            <Card className="surface-layered rounded-[3rem] overflow-hidden border-none bg-emerald-500/5">
                <CardHeader className="p-12 pb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-emerald-500 text-white font-black uppercase text-[10px]">Verified</Badge>
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight italic">DPDPA Sovereignty</CardTitle>
                    <CardDescription className="text-sm font-medium">European & Indian Data Privacy Compliance Status.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 pt-0 space-y-8">
                    <div className="p-6 rounded-3xl bg-white border border-emerald-500/20 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <ShieldCheck className="h-7 w-7" />
                            </div>
                            <div>
                                <h4 className="font-black text-sm uppercase tracking-tight">Active Audit Log</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">System is currently recording all PII access and WhatsApp engagement events for regulatory auditing.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-8 space-y-6">
            <Card className="surface-layered rounded-[3rem] overflow-hidden border-none">
                <CardHeader className="p-12 pb-6">
                    <CardTitle className="text-2xl font-black tracking-tight italic">API Access Keys</CardTitle>
                    <CardDescription className="text-sm font-medium">Manage internal webhook tokens and API credentials.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 pt-0 space-y-6">
                    {[
                       { name: "Webhook Secret", value: "sk_live_••••••••••••••••", status: "ACTIVE", color: "text-emerald-500 bg-emerald-500/10" },
                       { name: "Groq AI Token", value: "gsk_••••••••••••••••", status: "ACTIVE", color: "text-emerald-500 bg-emerald-500/10" },
                       { name: "Meta CAPI Token", value: "Not Connected", status: "PENDING", color: "text-amber-500 bg-amber-500/10" },
                    ].map((key, i) => (
                       <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-white/5 ring-1 ring-slate-200/50 dark:ring-white/5">
                          <div className="space-y-1">
                             <p className="text-xs font-black uppercase tracking-widest">{key.name}</p>
                             <p className="text-sm font-mono text-slate-500">{key.value}</p>
                          </div>
                          <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${key.color}`}>{key.status}</span>
                       </div>
                    ))}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-8 space-y-6">
            <Card className="surface-layered rounded-[3rem] overflow-hidden border-none">
                <CardHeader className="p-12 pb-6">
                    <CardTitle className="text-2xl font-black tracking-tight italic">Team Roster</CardTitle>
                    <CardDescription className="text-sm font-medium">Active members assigned to this Command Node.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 pt-0 space-y-4">
                    {users.map((member, i) => (
                       <div key={member.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-white/5 ring-1 ring-slate-200/50 dark:ring-white/5">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                                {member.name?.[0] || member.email[0]}
                             </div>
                             <div>
                                <p className="text-sm font-black">{member.name || "System Node"}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{member.role.replace('_', ' ')}</p>
                             </div>
                          </div>
                          <Badge className="text-[9px] font-black bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 border-none uppercase">
                             {member.isActive ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                       </div>
                    ))}
                    <div className="flex items-center justify-center pt-4">
                       <Dialog>
                          <DialogTrigger 
                              render={
                                 <Button variant="outline" className="rounded-full border-dashed border-slate-300 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-primary hover:border-primary">
                                    <Users className="h-4 w-4 mr-2" />
                                    Invite Team Member
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
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="locations" className="mt-8">
            <ManageCenters initialBranches={branches as any[]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
