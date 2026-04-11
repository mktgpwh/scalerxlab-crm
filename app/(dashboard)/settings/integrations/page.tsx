"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { 
    Phone, Smartphone, Globe, Target, Calculator, 
    MessageSquare, Camera, Facebook, Sparkles, Zap, ShieldCheck, Loader2 
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { saveIntegration, toggleIntegration } from "./actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── INTEGRATION METADATA ──────────────────────────────────────────────────

const PROVIDERS = [
    {
        id: "tata",
        category: "Cloud Telephony",
        title: "Tata SmartFlo",
        desc: "Enterprise cloud PBX & inbound routing.",
        icon: Phone,
        fields: [
            { id: "apiKey", label: "API Key", placeholder: "Enter TATA Access Token", type: "password" },
            { id: "virtualNumber", label: "Virtual Number", placeholder: "+91 xxxx-xxxxxx", type: "text" },
        ]
    },
    {
        id: "knowlarity",
        category: "Cloud Telephony",
        title: "Knowlarity",
        desc: "Advanced Indian cloud telephony node.",
        icon: Smartphone,
        fields: [
            { id: "apiKey", label: "API Key", placeholder: "Enter Knowlarity Key", type: "password" },
            { id: "virtualNumber", label: "Virtual Number", placeholder: "800-xxx-xxxx", type: "text" },
        ]
    },
    {
        id: "google_ads",
        category: "Growth & Ads",
        title: "Google Ads",
        desc: "Performance max & SEM lead capture.",
        icon: Target,
        fields: [
            { id: "customerId", label: "Customer ID", placeholder: "xxx-xxx-xxxx", type: "text" },
            { id: "developerToken", label: "Developer Token", placeholder: "Enter Google Dev Token", type: "password" },
        ]
    },
    {
        id: "meta_ads",
        category: "Growth & Ads",
        title: "Meta (FB/IG) Ads",
        desc: "Direct lead form & pixel tracking.",
        icon: Facebook,
        fields: [
            { id: "pixelId", label: "Pixel ID", placeholder: "15-digit ID", type: "text" },
            { id: "accessToken", label: "Access Token", placeholder: "Enter System User Token", type: "password" },
        ]
    },
    {
        id: "whatsapp",
        category: "Capture & Messaging",
        title: "WhatsApp Cloud",
        desc: "Official Meta API for high-volume chat.",
        icon: WhatsAppIcon,
        fields: [
            { id: "phoneNumberId", label: "Phone ID", placeholder: "Meta Phone ID", type: "text" },
            { id: "accessToken", label: "Permanent Token", placeholder: "Meta Access Token", type: "password" },
        ]
    },
    {
        id: "instagram",
        category: "Capture & Messaging",
        title: "Instagram DM",
        desc: "Automated AI triage for IG messages.",
        icon: Camera,
        fields: [
            { id: "pageId", label: "IG Page ID", placeholder: "Instagram Business ID", type: "text" },
            { id: "accessToken", label: "Access Token", placeholder: "Meta System Token", type: "password" },
        ]
    },
    {
        id: "website",
        category: "Capture & Messaging",
        title: "Website Widget",
        desc: "On-site lead capture & tracking pixel.",
        icon: Globe,
        fields: [
            { id: "domain", label: "Domain", placeholder: "hospital.com", type: "text" },
        ]
    },
    {
        id: "razorpay",
        category: "Payments & Invoicing",
        title: "Razorpay",
        desc: "Collect advance bookings & deposits.",
        icon: Calculator,
        fields: [
            { id: "keyId", label: "Key ID", placeholder: "rzp_live_xxx", type: "text" },
            { id: "keySecret", label: "Key Secret", placeholder: "Enter Secret Key", type: "password" },
        ]
    }
];

export default function IntegrationHubPage() {
    const [selectedProvider, setSelectedProvider] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        const result = await saveIntegration(selectedProvider.id, formData);
        setLoading(false);

        if (result.success) {
            toast.success(`${selectedProvider.title} Connected Successfully`);
            setSelectedProvider(null);
            setFormData({});
        } else {
            toast.error(result.error || "Save & Verify failed.");
        }
    };

    const categories = Array.from(new Set(PROVIDERS.map(p => p.category)));

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Mission Infrastructure</span>
                <h2 className="text-4xl font-black tracking-tighter italic lowercase text-slate-900 dark:text-white">
                    /integration.marketplace
                </h2>
                <p className="text-sm font-medium text-slate-500 mt-2 max-w-2xl">
                    Connect operational nodes to the ScalerX matrix. All credentials are encrypted and stored in your sovereign single-tenant vault.
                </p>
            </div>

            {/* Category Groups */}
            {categories.map((category) => (
                <div key={category} className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 pl-2 border-l-2 border-slate-200 dark:border-white/10 uppercase">
                        {category}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {PROVIDERS.filter(p => p.category === category).map((provider) => (
                            <Card 
                                key={provider.id}
                                className="group relative surface-layered border-none rounded-[2.5rem] p-8 transition-all hover:ring-2 hover:ring-primary/20 cursor-pointer overflow-hidden shadow-sm"
                                onClick={() => setSelectedProvider(provider)}
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <Badge className="bg-slate-100 dark:bg-white/5 text-slate-500 text-[9px] font-black border-none uppercase tracking-widest">
                                        Not Linked
                                    </Badge>
                                </div>

                                <div className="flex items-center gap-5 mb-6">
                                    <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <provider.icon className="h-7 w-7 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <h4 className="font-black text-lg tracking-tight text-slate-900 dark:text-white leading-none mb-1">{provider.title}</h4>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Provider Node</span>
                                    </div>
                                </div>

                                <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6 pr-4">
                                    {provider.desc}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Operational</span>
                                    <Zap className="h-4 w-4 text-slate-200 group-hover:text-primary transition-colors" />
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            {/* Config Modal */}
            <Dialog open={!!selectedProvider} onOpenChange={(open) => !open && setSelectedProvider(null)}>
                <DialogContent className="sm:max-w-[450px] rounded-[3rem] p-10 border-none bg-white/95 backdrop-blur-3xl shadow-2xl">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                {selectedProvider?.icon && <selectedProvider.icon className="h-6 w-6 text-primary" />}
                            </div>
                            <div className="flex flex-col text-left">
                                <DialogTitle className="text-2xl font-black tracking-tighter">Connect {selectedProvider?.title}</DialogTitle>
                                <DialogDescription className="text-xs font-medium text-slate-400">
                                    Enter bare-minimum credentials (ABC Model)
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {selectedProvider?.fields.map((field: any) => (
                            <div key={field.id} className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{field.label}</Label>
                                <Input 
                                    type={field.type}
                                    placeholder={field.placeholder}
                                    className="h-14 rounded-2xl bg-slate-50/50 border-slate-200/60 focus:ring-primary/20 transition-all font-bold placeholder:font-medium placeholder:text-slate-300"
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.id]: e.target.value }))}
                                />
                            </div>
                        ))}

                        <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100 mt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Enable Node</span>
                                <span className="text-[9px] font-medium text-slate-400 pr-4 italic">Active immediately upon verification</span>
                            </div>
                            <Switch checked={true} />
                        </div>
                    </div>

                    <DialogFooter className="mt-10">
                        <Button 
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest bg-slate-900 hover:bg-black text-white gap-3 shadow-xl shadow-slate-200"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck className="h-5 w-5" />
                                    Save & Verify Node
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
