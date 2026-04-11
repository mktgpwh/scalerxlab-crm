"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Loader2, Power, PowerOff, Building2 } from "lucide-react";
import { createBranchAction, toggleBranchStatusAction } from "./actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Branch {
    id: string;
    name: string;
    city: string;
    isHQ: boolean;
    isActive: boolean;
}

interface ManageCentersProps {
    initialBranches: Branch[];
}

export function ManageCenters({ initialBranches }: ManageCentersProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [city, setCity] = useState("");

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !city) return;
        setLoading(true);
        try {
            const result = await createBranchAction({ name, city, isHQ: false });
            if (result.error) {
                toast.error("Deployment Error", { description: result.error });
            } else {
                toast.success("Center Node Provisioned", { description: `${name} has been synchronized with the Matrix.` });
                setName("");
                setCity("");
            }
        } catch (err) {
            toast.error("System Override", { description: "Failed to establish matrix connectivity." });
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: string, currentStatus: boolean, centerName: string) => {
        try {
            const result = await toggleBranchStatusAction(id, !currentStatus);
            if (result.error) {
                toast.error("Protocol Error", { description: result.error });
            } else {
                toast.success(currentStatus ? "Center Deactivated" : "Center Online", { 
                    description: `${centerName} state has been updated across the network.` 
                });
            }
        } catch (err) {
            toast.error("System Override", { description: "Failed to broadcast state change." });
        }
    };

    return (
        <div className="space-y-8 mt-8">
            <Card className="surface-layered rounded-[3rem] overflow-hidden border-none bg-slate-50/50">
                <CardHeader className="p-10 pb-6">
                    <CardTitle className="text-xl font-black italic">Provision New Center</CardTitle>
                    <CardDescription className="text-xs uppercase font-bold tracking-widest text-slate-400">Expand the clinical location matrix</CardDescription>
                </CardHeader>
                <CardContent className="p-10 pt-0">
                    <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Center Name</Label>
                            <Input 
                                placeholder="e.g. Bilaspur Clinic" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)}
                                className="h-12 rounded-2xl bg-white border-none shadow-sm font-bold ring-1 ring-slate-100" 
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">City Node</Label>
                            <Input 
                                placeholder="e.g. Bilaspur" 
                                value={city} 
                                onChange={(e) => setCity(e.target.value)}
                                className="h-12 rounded-2xl bg-white border-none shadow-sm font-bold ring-1 ring-slate-100" 
                            />
                        </div>
                        <Button 
                            disabled={loading || !name || !city}
                            className="h-12 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-200 transition-all"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-2" /> Provision</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {initialBranches.map((branch) => (
                    <div 
                        key={branch.id} 
                        className={cn(
                            "group relative overflow-hidden p-6 rounded-[2rem] border transition-all duration-500",
                            branch.isActive 
                                ? "bg-white border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1" 
                                : "bg-slate-50 border-slate-200/50 opacity-60 grayscale"
                        )}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500",
                                    branch.isHQ ? "bg-amber-100 text-amber-600" : "bg-indigo-50 text-indigo-500"
                                )}>
                                    {branch.isHQ ? <Building2 className="h-6 w-6" /> : <MapPin className="h-6 w-6" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-slate-900 italic tracking-tight">{branch.name}</h3>
                                        {branch.isHQ && <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-widest">HQ / Main Node</Badge>}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{branch.city} Network</p>
                                </div>
                            </div>

                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleToggle(branch.id, branch.isActive, branch.name)}
                                className={cn(
                                    "h-9 w-9 rounded-xl transition-colors",
                                    branch.isActive ? "text-emerald-500 hover:bg-rose-50 hover:text-rose-500" : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"
                                )}
                            >
                                {branch.isActive ? <Power className="h-4 w-4" /> : <PowerOff className="h-4 w-4" />}
                            </Button>
                        </div>

                        {/* Status bar */}
                        <div className="mt-6 flex items-center gap-3">
                             <div className={cn(
                                 "h-1.5 flex-1 rounded-full",
                                 branch.isActive ? "bg-emerald-500/20" : "bg-slate-200"
                             )}>
                                 <div className={cn(
                                     "h-full rounded-full transition-all duration-1000",
                                     branch.isActive ? "w-[100%] bg-emerald-500" : "w-0"
                                 )} />
                             </div>
                             <span className={cn(
                                 "text-[9px] font-black uppercase tracking-[0.2em]",
                                 branch.isActive ? "text-emerald-500" : "text-slate-400"
                             )}>
                                 {branch.isActive ? "Live" : "Offline / Disabled"}
                             </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
