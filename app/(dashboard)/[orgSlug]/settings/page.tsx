import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
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
  Save
} from "lucide-react";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params;
  
  const organization = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!organization) notFound();

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
           Managing core sovereignty and workspace parameters for <span className="font-bold text-slate-900 dark:text-white underline decoration-emerald-500/30 underline-offset-4">{organization.name}</span>.
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
                        <Input defaultValue={organization.name} className="h-12 rounded-2xl bg-slate-50 border-none font-bold shadow-inner ring-1 ring-slate-200/50" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">System Slug (ReadOnly)</Label>
                        <Input defaultValue={organization.slug} disabled className="h-12 rounded-2xl bg-slate-100 border-none font-mono text-xs opacity-60" />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Primary Domain</Label>
                        <div className="relative">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input placeholder="hospital.scaler.x" className="h-12 rounded-2xl pl-12 bg-slate-50 border-none font-bold shadow-inner ring-1 ring-slate-200/50" />
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
        
        <TabsContent value="security" className="mt-8">
            <div className="py-20 text-center space-y-4">
                <Key className="h-12 w-12 mx-auto text-slate-300 animate-bounce" />
                <h3 className="text-xl font-black italic text-slate-400">Encryption Management Coming Soon</h3>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
