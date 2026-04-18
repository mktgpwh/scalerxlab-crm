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
    Info
} from "lucide-react";
import { PatientLookup } from "@/components/billing/patient-lookup";
import { BillingForm } from "@/components/billing/billing-form";
import { PaymentModal } from "@/components/billing/payment-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [activeInvoice, setActiveInvoice] = useState<any>(null);

    return (
        <div className="space-y-10 max-w-6xl mx-auto pb-20">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                        <Receipt className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Clinical Revenue Node</span>
                    </div>
                    <h2 className="text-5xl font-black tracking-tighter text-slate-900 lowercase italic">
                        /billing.terminal
                    </h2>
                    <p className="text-sm font-medium text-slate-500">
                        Generate hyper-fast departmental invoices with dynamic UPI payment settlement.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="h-10 px-4 rounded-xl bg-emerald-500/5 text-emerald-600 border-emerald-500/20 font-black uppercase tracking-widest text-[9px]">
                        <Activity className="h-3 w-3 mr-2" /> WATI Bridge Active
                    </Badge>
                    <Badge variant="outline" className="h-10 px-4 rounded-xl bg-primary/5 text-primary border-primary/20 font-black uppercase tracking-widest text-[9px]">
                        <IndianRupee className="h-3 w-3 mr-2" /> UPI Dynamic QR Enabled
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Patient Discovery */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="surface-layered rounded-[3rem] overflow-hidden border-none p-8">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xl font-black tracking-tight italic mb-2">Patient Lookup</h3>
                                <p className="text-xs font-medium text-slate-400">Search for registerd leads to start billing.</p>
                            </div>
                            
                            <PatientLookup 
                                onSelect={setSelectedPatient} 
                                selectedId={selectedPatient?.id} 
                            />

                            {selectedPatient ? (
                                <div className="p-6 rounded-[2.5rem] bg-indigo-600 text-white space-y-4 shadow-xl shadow-indigo-200 animate-in zoom-in-95 duration-300">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Selected Patient</p>
                                            <p className="text-xl font-black tracking-tight italic mt-1">{selectedPatient.name}</p>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                            <Search className="h-3 w-3 opacity-60" />
                                            {selectedPatient.phone || "No Number Linked"}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                                            <Layers className="h-3 w-3 opacity-60" />
                                            Target: {selectedPatient.category} Office
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                                    <div className="h-12 w-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
                                        <UserPlus className="h-6 w-6 text-slate-200" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No Patient Selected</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="p-6 rounded-[2.5rem] bg-[#243467] text-white/90">
                        <div className="flex items-start gap-4">
                            <Info className="h-5 w-5 text-indigo-400 shrink-0" />
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-widest mb-1 text-white">Tax Immunity Guard</h4>
                                <p className="text-[10px] font-medium leading-relaxed opacity-70">Healthcare services are GST exempt. 0% tax is applied by default. Manual override enabled for Pharmacy billing.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Billing Terminal Tabs */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="OPD" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 bg-white dark:bg-slate-900 h-16 rounded-[2rem] p-1.5 border border-slate-200/60 dark:border-white/5 shadow-sm mb-6">
                            {DEPARTMENTS.map(dept => (
                                <TabsTrigger 
                                    key={dept.id} 
                                    value={dept.id} 
                                    className="rounded-2xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-[#243467] data-[state=active]:text-white transition-all overflow-hidden whitespace-nowrap px-1"
                                >
                                    {dept.id}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {DEPARTMENTS.map(dept => (
                            <TabsContent key={dept.id} value={dept.id}>
                                <Card className="surface-layered rounded-[3rem] overflow-hidden border-none shadow-sm">
                                    <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", dept.color)}>
                                                    <dept.icon className="h-4 w-4" />
                                                </div>
                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">{dept.id}</Badge>
                                            </div>
                                            <CardTitle className="text-2xl font-black tracking-tight italic">{dept.label} Billing</CardTitle>
                                            <CardDescription className="text-xs font-medium">Configure items and services for this session.</CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#243467]">Branch Origin</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Main Hospital Center</p>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 pt-2">
                                        <BillingForm 
                                            leadId={selectedPatient?.id} 
                                            department={dept.id} 
                                            onSuccess={setActiveInvoice}
                                        />
                                    </CardContent>
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
