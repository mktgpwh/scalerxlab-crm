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
import { ReclassifyLeadsCard } from "@/components/settings/reclassify-leads-card";

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
          <span className="text-[10px] font-semibold tracking-tight text-emerald-500 uppercase tracking-[0.2em]">Security & Configuration</span>
        </div>
        <h2 className="text-4xl font-semibold tracking-tight tracking-tighter text-slate-900 dark:text-white lowercase ">
          /system.config
        </h2>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
           Managing core sovereignty and workspace parameters for <span className="font-semibold text-slate-900 dark:text-white underline decoration-emerald-500/30 underline-offset-4">{clinicName}</span>.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white dark:bg-slate-900 h-14 rounded-xl p-1.5 border border-border/50 dark:border-white/5 shadow-sm">
          <TabsTrigger value="general" className="rounded-xl text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Building className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <Key className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-xl text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
            <ShieldCheck className="w-4 h-4 mr-2" />
            Compliance
          </TabsTrigger>
          <TabsTrigger value="locations" className="rounded-xl text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all">
            <MapPin className="w-4 h-4 mr-2" />
            Locations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-8">
           <Card className="surface-layered rounded-xl overflow-hidden border-none">
              <CardHeader className="p-12 pb-6">
                <CardTitle className="text-2xl font-semibold tracking-tight tracking-tight ">Workspace Metadata</CardTitle>
                <CardDescription className="text-sm font-medium">Basic organizational identifiers.</CardDescription>
              </CardHeader>
              <CardContent className="p-12 pt-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold tracking-tight uppercase tracking-widest text-slate-400">Legal Entity Name</Label>
                        <Input defaultValue={clinicName} className="h-12 rounded-xl bg-slate-50 border-none font-semibold shadow-inner ring-1 ring-slate-200/50" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold tracking-tight uppercase tracking-widest text-slate-400">System Slug (ReadOnly)</Label>
                        <Input defaultValue="scalerx-core" disabled className="h-12 rounded-xl bg-slate-100 border-none font-mono text-xs opacity-60" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold tracking-tight uppercase tracking-widest text-slate-400">Primary Domain</Label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="clinic.scalerxlab.com" className="h-12 rounded-xl pl-12 bg-slate-50 border-none font-semibold shadow-inner ring-1 ring-slate-200/50" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end pt-8">
                    <Button className="h-12 px-8 rounded-full bg-primary font-semibold tracking-tight uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20">
                        <Save className="w-4 h-4 mr-2" />
                        Persist Changes
                    </Button>
                </div>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="compliance" className="mt-8 space-y-6">
            <Card className="surface-layered rounded-xl overflow-hidden border-none bg-emerald-500/5">
                <CardHeader className="p-12 pb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-emerald-500 text-white font-semibold tracking-tight uppercase text-[10px]">Verified</Badge>
                    </div>
                    <CardTitle className="text-2xl font-semibold tracking-tight tracking-tight ">DPDPA Sovereignty</CardTitle>
                    <CardDescription className="text-sm font-medium">European & Indian Data Privacy Compliance Status.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 pt-0 space-y-8">
                    <div className="p-6 rounded-xl bg-white border border-emerald-500/20 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <ShieldCheck className="h-7 w-7" />
                            </div>
                            <div>
                                <h4 className="font-semibold tracking-tight text-sm uppercase tracking-tight">Active Audit Log</h4>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">System is currently recording all PII access and WhatsApp engagement events for regulatory auditing.</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* AI Sentinel Re-Classification */}
            <Card className="surface-layered rounded-xl overflow-hidden border-none">
                <CardHeader className="p-12 pb-6">
                    <CardTitle className="text-2xl font-semibold tracking-tight tracking-tight ">AI Lead Intelligence</CardTitle>
                    <CardDescription className="text-sm font-medium">
                        Retroactively re-classify all captured leads using inbound-only message analysis.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-12 pt-0">
                    <ReclassifyLeadsCard />
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-8 space-y-6">
            <Card className="surface-layered rounded-xl overflow-hidden border-none">
                <CardHeader className="p-12 pb-6">
                    <CardTitle className="text-2xl font-semibold tracking-tight tracking-tight ">API Access Keys</CardTitle>
                    <CardDescription className="text-sm font-medium">Manage internal webhook tokens and API credentials.</CardDescription>
                </CardHeader>
                <CardContent className="p-12 pt-0 space-y-6">
                    {[
                       { name: "Webhook Secret", value: "sk_live_••••••••••••••••", status: "ACTIVE", color: "text-emerald-500 bg-emerald-500/10" },
                       { name: "Groq AI Token", value: "gsk_••••••••••••••••", status: "ACTIVE", color: "text-emerald-500 bg-emerald-500/10" },
                       { name: "Meta CAPI Token", value: "Not Connected", status: "PENDING", color: "text-amber-500 bg-amber-500/10" },
                    ].map((key, i) => (
                       <div key={i} className="flex items-center justify-between p-5 rounded-xl bg-slate-50 dark:bg-white/5 ring-1 ring-slate-200/50 dark:ring-white/5">
                          <div className="space-y-1">
                             <p className="text-xs font-semibold tracking-tight uppercase tracking-widest">{key.name}</p>
                             <p className="text-sm font-mono text-slate-500">{key.value}</p>
                          </div>
                          <span className={`text-[9px] font-semibold tracking-tight px-2.5 py-1 rounded-full uppercase tracking-widest ${key.color}`}>{key.status}</span>
                       </div>
                    ))}
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
