"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Settings2, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Puzzle,
  Link as LinkIcon,
  ShieldCheck,
  ChevronRight,
  Zap,
  PhoneCall,
  MessageSquare,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getConnectionsAction, toggleConnectionStatus } from "./actions";
import { ConfigModal } from "./config-modal";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "TELEPHONY" | "MESSAGING" | "GROWTH" | "PAYMENTS";
  iconSlug: string;
  isComingSoon?: boolean;
}

const INTEGRATION_MARKETPLACE: Integration[] = [
  {
    id: "wati",
    name: "WATI WhatsApp",
    description: "Multi-tenant WhatsApp Business API for clinical messaging and ad tracking.",
    category: "MESSAGING",
    iconSlug: "whatsapp"
  },
  {
    id: "tata-smartflo",
    name: "TATA SmartFlo",
    description: "Enterprise cloud telephony with virtual numbers and call recording.",
    category: "TELEPHONY",
    iconSlug: "tata"
  },
  {
    id: "meta-ads",
    name: "Meta Ads",
    description: "Track Facebook & Instagram lead signals with deep referral mirroring.",
    category: "GROWTH",
    iconSlug: "meta"
  },
  {
    id: "google-ads",
    name: "Google Ads",
    description: "Import GCLID signals and track keyword-level conversions.",
    category: "GROWTH",
    iconSlug: "google_ads"
  },
  {
    id: "knowlarity",
    name: "Knowlarity",
    description: "Alternative cloud telephony for branch-specific call routing.",
    category: "TELEPHONY",
    iconSlug: "knowlarity"
  },
  {
    id: "razorpay",
    name: "Razorpay",
    description: "Secure payment gateway for appointment booking and tele-consultation.",
    category: "PAYMENTS",
    iconSlug: "razorpay"
  },
  {
    id: "tiktok-ads",
    name: "TikTok Ads",
    description: "Capture high-intent clinical leads from TikTok lead forms.",
    category: "GROWTH",
    iconSlug: "tiktok",
    isComingSoon: true
  }
];

export default function IntegrationsPage() {
  const [activeIntegration, setActiveIntegration] = useState<string | null>(null);
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const res = await getConnectionsAction();
    if (res.success) {
      setConfig(res.integrations as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    const res = await toggleConnectionStatus(id, !currentStatus);
    if (res.success) {
      toast.success(`${id.toUpperCase()} ${!currentStatus ? 'Activated' : 'Paused'}`);
      // Refresh local state
      setConfig(prev => ({
        ...prev,
        [id]: { ...prev[id], isEnabled: !currentStatus }
      }));
    } else {
      toast.error("Failed to toggle status", { description: res.error });
    }
  };

  const CATEGORIES = [
    { id: "MESSAGING", label: "Messaging", icon: MessageSquare, color: "text-emerald-500" },
    { id: "TELEPHONY", label: "Telephony", icon: PhoneCall, color: "text-blue-500" },
    { id: "GROWTH", label: "Growth", icon: TrendingUp, color: "text-indigo-500" },
    { id: "PAYMENTS", label: "Payments", icon: CreditCard, color: "text-rose-500" }
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex h-12 w-12 rounded-[1.25rem] bg-indigo-500/10 items-center justify-center ring-1 ring-indigo-500/20">
            <LinkIcon className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-4xl font-black tracking-tighter italic lowercase text-slate-900 dark:text-white">/connections</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Sovereign Integration Nexus</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[10px] font-black uppercase tracking-widest px-3 py-1">
            <Zap className="h-3 w-3 mr-1.5 fill-current" /> All Nodes Active
          </Badge>
          <Button variant="outline" className="h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest gap-2 bg-white dark:bg-white/5 border-slate-200 dark:border-white/10">
            <Plus className="h-4 w-4" /> Add Custom API
          </Button>
        </div>
      </div>

      {/* CATEGORY NAV */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button 
            key={cat.id}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/10 hover:border-indigo-500/30 transition-all group"
          >
            <cat.icon className={cn("h-4 w-4", cat.color)} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 group-hover:text-indigo-500 transition-colors uppercase">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* MARKETPLACE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INTEGRATION_MARKETPLACE.map(item => {
          const isConfigured = !!config[item.id];
          const isEnabled = config[item.id]?.isEnabled;

          return (
            <Card 
              key={item.id}
              className={cn(
                "relative overflow-hidden border-none rounded-[2.5rem] p-8 shadow-sm transition-all duration-500 group",
                isConfigured ? "bg-white dark:bg-slate-900 ring-1 ring-slate-200/60 dark:ring-white/10" : "bg-slate-50/50 dark:bg-black/20 ring-1 ring-slate-100 dark:ring-white/5 opacity-80"
              )}
            >
              {/* STATUS INDICATION */}
              <div className="absolute top-6 right-8">
                {item.isComingSoon ? (
                    <Badge className="bg-slate-200 text-slate-500 text-[8px] font-black uppercase px-2 h-5 border-none">Coming Soon</Badge>
                ) : isConfigured ? (
                    <div className="flex items-center gap-2">
                         <div className={cn("h-1.5 w-1.5 rounded-full", isEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                         <span className={cn("text-[9px] font-black uppercase tracking-widest", isEnabled ? "text-emerald-500" : "text-slate-400")}>
                            {isEnabled ? 'Live' : 'Paused'}
                         </span>
                    </div>
                ) : (
                    <Badge variant="outline" className="text-[8px] font-black uppercase opacity-40">Not Configured</Badge>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-5">
                  <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm ring-1 ring-slate-100 dark:ring-white/10 group-hover:scale-110 transition-transform duration-500">
                    <IntegrationIcon slug={item.iconSlug} size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{item.name}</h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-500/60 mt-0.5">{item.category}</p>
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-400 leading-relaxed min-h-[3rem]">
                  {item.description}
                </p>

                <div className="pt-4 flex items-center gap-3">
                  <Button 
                    onClick={() => !item.isComingSoon && setActiveIntegration(item.id)}
                    disabled={item.isComingSoon}
                    className={cn(
                        "flex-1 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        isConfigured ? "bg-slate-900 dark:bg-primary text-white" : "bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10"
                    )}
                  >
                    {isConfigured ? 'Manage Connection' : 'Configure Account'}
                  </Button>
                  {isConfigured && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleToggle(item.id, isEnabled)}
                      className={cn(
                        "h-11 w-11 rounded-xl p-0 transition-all",
                        isEnabled ? "text-rose-500 border-rose-500/20 hover:bg-rose-50" : "text-emerald-500 border-emerald-500/20 hover:bg-emerald-50"
                      )}
                    >
                      <Zap className={cn("h-4 w-4", isEnabled ? "fill-current" : "")} />
                    </Button>
                  )}
                </div>
              </div>

              {/* GLASS DECORATION */}
              <div className="absolute -bottom-6 -right-6 h-24 w-24 bg-indigo-500/5 rounded-full blur-3xl" />
            </Card>
          );
        })}
      </div>

      <ConfigModal 
        isOpen={!!activeIntegration}
        onClose={() => setActiveIntegration(null)}
        integrationId={activeIntegration}
        existingData={activeIntegration ? config[activeIntegration] : {}}
        onSuccess={loadData}
      />

      {/* SECURITY FOOTER */}
      <div className="max-w-4xl mx-auto p-8 rounded-[2rem] bg-slate-900 dark:bg-black/40 text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                  <h4 className="text-sm font-black uppercase tracking-tight">Clinical Grade Security</h4>
                  <p className="text-[10px] text-slate-400 font-medium">All credentials are encrypted and stored in your private AWS instance.</p>
              </div>
          </div>
          <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 text-[9px] font-black uppercase tracking-widest h-10 px-6 rounded-xl">
              Download Compliance Report
          </Button>
      </div>
    </div>
  );
}
