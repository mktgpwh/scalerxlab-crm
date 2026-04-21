"use client";

import React, { useState } from "react";
import { 
    Receipt, 
    UserPlus, 
    Stethoscope, 
    Pill, 
    Activity, 
    FlaskConical, 
    Layers,
    ChevronRight,
    Search,
    IndianRupee,
    Info,
    ArrowUpRight,
    TrendingUp
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PatientLookup } from "@/components/billing/patient-lookup";
import { BillingForm } from "@/components/billing/billing-form";
import { PaymentModal } from "@/components/billing/payment-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const DEPARTMENTS = [
    { id: "OPD", label: "Consultation", icon: Stethoscope, color: "text-blue-500 bg-blue-500/10" },
    { id: "PHARMACY", label: "Pharmacy", icon: Pill, color: "text-emerald-500 bg-emerald-500/10" },
    { id: "ULTRASOUND", label: "Ultrasound", icon: Activity, color: "text-indigo-500 bg-indigo-500/10" },
    { id: "LAB", label: "Pathology Lab", icon: FlaskConical, color: "text-amber-500 bg-amber-500/10" },
    { id: "IPD", label: "In-Patient Service", icon: Layers, color: "text-rose-500 bg-rose-500/10" },
] as const;

export default function BillingTerminal() {
    const { data: session } = useSession();
    const router = useRouter();
    const userRole = (session?.user as any)?.role;

    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [activeInvoice, setActiveInvoice] = useState<any>(null);

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Receipt className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-semibold tracking-tight text-primary uppercase tracking-[0.2em]">Clinical Revenue Node</span>
                    </div>
                    <h2 className="text-5xl font-semibold tracking-tight tracking-tighter text-slate-900 lowercase ">
                        /billing.terminal
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                        Generate hyper-fast departmental invoices with dynamic UPI payment settlement.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-10 px-4 rounded-xl bg-emerald-500/5 text-emerald-600 border-emerald-500/20 font-semibold tracking-tight uppercase tracking-widest text-[9px]">
                        <Activity className="h-3 w-3 mr-2" /> WATI Bridge Active
                    </Badge>
                    <Badge variant="outline" className="h-10 px-4 rounded-xl bg-primary/5 text-primary border-primary/20 font-semibold tracking-tight uppercase tracking-widest text-[9px]">
                        <IndianRupee className="h-3 w-3 mr-2" /> UPI Dynamic QR Enabled
                    </Badge>
                    
                    {userRole === "SUPER_ADMIN" && (
                        <Button 
                            variant="ghost" 
                            onClick={() => router.push("/billing/reporting")}
                            className="h-10 px-4 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 font-semibold tracking-tight uppercase tracking-widest text-[9px] gap-2 cursor-pointer shadow-sm"
                        >
                            <TrendingUp className="h-3.5 w-3.5" />
                            Analytics Hub
                            <ArrowUpRight className="h-3 w-3 opacity-50" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Patient Discovery */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="surface-layered rounded-xl overflow-hidden border-none p-8">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-semibold tracking-tight tracking-tight  mb-2">Patient Lookup</h3>
                                <p className="text-xs font-medium text-slate-400">Search for registerd leads to start billing.</p>
                            </div>
                            
                            <PatientLookup 
                                onSelect={setSelectedPatient} 
                                selectedId={selectedPatient?.id} 
                            />

                            {selectedPatient ? (
                                <div className="p-6 rounded-xl bg-indigo-600 text-white space-y-4 shadow-xl shadow-indigo-200 animate-in zoom-in-95 duration-300">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-semibold tracking-tight uppercase tracking-widest opacity-60">Selected Patient</p>
                                            <p className="text-xl font-semibold tracking-tight tracking-tight  mt-1">{selectedPatient.name}</p>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
                                            <Search className="h-3 w-3 opacity-60" />
                                            {selectedPatient.phone || "No Number Linked"}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest">
                                            <Layers className="h-3 w-3 opacity-60" />
                                            Target: {selectedPatient.category} Office
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 rounded-xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center text-center">
                                    <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center mb-4">
                                        <UserPlus className="h-6 w-6 text-slate-200" />
                                    </div>
                                    <p className="text-[10px] font-semibold tracking-tight uppercase tracking-widest text-slate-300">No Patient Selected</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="p-6 rounded-xl bg-[#243467] text-white/90">
                        <div className="flex items-start gap-4">
                            <Info className="h-5 w-5 text-indigo-400 shrink-0" />
                            <div>
                                <h4 className="text-xs font-semibold tracking-tight uppercase tracking-widest mb-1 text-white">Tax Immunity Guard</h4>
                                <p className="text-[10px] font-medium leading-relaxed opacity-70">Healthcare services are GST exempt. 0% tax is applied by default. Manual override enabled for Pharmacy billing.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Billing Terminal Tabs */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="OPD" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 bg-white dark:bg-slate-900 h-16 rounded-xl p-1.5 border border-border/50 shadow-sm mb-6">
                            {DEPARTMENTS.map(dept => (
                                <TabsTrigger 
                                    key={dept.id} 
                                    value={dept.id} 
                                    className="rounded-xl text-xs font-semibold tracking-tight uppercase tracking-widest data-[state=active]:bg-[#243467] data-[state=active]:text-white transition-all overflow-hidden"
                                >
                                    {dept.id}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {DEPARTMENTS.map(dept => (
                            <TabsContent key={dept.id} value={dept.id}>
                                <Card className="surface-layered rounded-xl overflow-hidden border-none shadow-sm">
                                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-6">
                                        <div className={cn("h-20 w-20 rounded-xl flex items-center justify-center animate-in zoom-in-50 duration-500", dept.color)}>
                                            <dept.icon className="h-10 w-10" />
                                        </div>
                                        <div className="max-w-md space-y-2">
                                            <h3 className="text-2xl font-semibold tracking-tight leading-tight">{dept.label} Operations</h3>
                                            <p className="text-sm text-slate-500 font-medium">Ready to provision a new financial record for this department. All calculations will follow HQ compliance protocols.</p>
                                        </div>

                                        <Dialog>
                                            <DialogTrigger 
                                                render={
                                                    <Button 
                                                        disabled={!selectedPatient}
                                                        className="h-14 px-10 rounded-xl bg-[#243467] flex items-center gap-3 text-xs font-semibold tracking-tight uppercase tracking-widest shadow-xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
                                                    />
                                                }
                                            >
                                                <Receipt className="h-4 w-4" />
                                                Initialize Digital Invoice
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-xl">
                                                <div className="bg-slate-50 dark:bg-white/5 border-b border-border/10 p-8 flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-xl font-semibold tracking-tight leading-tight">/billing.provision_{dept.id}</h4>
                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1">Matrix Node: {selectedPatient?.name || "Initializing..."}</p>
                                                    </div>
                                                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", dept.color)}>
                                                        <dept.icon className="h-6 w-6" />
                                                    </div>
                                                </div>
                                                <div className="p-8">
                                                    <BillingForm 
                                                        leadId={selectedPatient?.id} 
                                                        department={dept.id} 
                                                        onSuccess={(inv) => {
                                                            setActiveInvoice(inv);
                                                        }}
                                                    />
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        {!selectedPatient && (
                                            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 px-4 py-2 rounded-full text-[9px] font-semibold tracking-tight uppercase">
                                                <Info className="h-3 w-3" /> Patient Lookup Required
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>

            {/* Success Payment Modal */}
            <PaymentModal 
                invoice={activeInvoice} 
                onClose={() => setActiveInvoice(null)} 
            />
        </div>
    );
}

// Minimal placeholder CheckCircle2
function CheckCircle2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}
