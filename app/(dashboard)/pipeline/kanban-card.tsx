"use client";

import React from "react";
import { Suspense } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

import { Lead } from "@/lib/types";

import { motion } from "framer-motion";
import { Sparkles, Phone, Mail, MoreHorizontal } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/icons";
import { toast } from "sonner";

const CATEGORY_COLORS: Record<string, string> = {
  INFERTILITY: "bg-purple-500/10 text-purple-600",
  MATERNITY:   "bg-pink-500/10 text-pink-600",
  GYNECOLOGY:  "bg-rose-500/10 text-rose-600",
  OTHER:       "bg-slate-100 text-slate-500",
};

// Inner card — no useSearchParams, safe from SSR/Suspense issues
function KanbanCardInner({ 
  lead, 
  isOverlay = false
}: { 
  lead: Lead, 
  isOverlay?: boolean
}) {
  const router = useRouter();

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: "Card",
      lead,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  // Safe navigation: append leadId to current URL without useSearchParams
  const openLead = (tab?: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("leadId", lead.id);
    if (tab) url.searchParams.set("tab", tab);
    router.push(url.pathname + url.search);
  };

  const handleCall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.consentFlag) {
        toast.error("COMMUNICATION BLOCKED", {
            description: "DPDPA consent not verified for this patient node.",
        });
        return;
    }

    try {
        const res = await fetch(`/api/telephony/tata/make-call`, {
            method: "POST",
            body: JSON.stringify({ leadId: lead.id })
        });
        const data = await res.json();
        if (res.ok) {
            toast.success("Calling via Tata Smartflo...");
        } else {
            toast.error(data.error || "Call setup failed");
        }
    } catch (err) {
        toast.error("Telephony engine offline");
    }
  };

  const logEngagement = async (type: string) => {
    try {
      await fetch(`/api/leads/${lead.id}/log`, {
        method: "POST",
        body: JSON.stringify({
          action: `QUICK_ENGAGEMENT_${type}`,
          description: `User triggered ${type} from Kanban Card`,
          metadata: { timestamp: new Date().toISOString() }
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const getIntentBadgeContext = (intent: string) => {
    switch(intent) {
      case "HOT": return "bg-rose-500/10 text-rose-600 ring-rose-500/20";
      case "WARM": return "bg-amber-500/10 text-amber-600 ring-amber-500/20";
      case "COLD": return "bg-blue-500/10 text-blue-600 ring-blue-500/20";
      default: return "bg-gray-400/10 text-gray-600 ring-gray-500/20";
    }
  };

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-30 h-[140px] rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50"
      />
    );
  }

  return (
    <motion.div
      layoutId={lead.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) return;
            openLead();
        }}
        className={cn(
          "cursor-pointer active:scale-[0.98] transition-all duration-300 border-border/50 dark:border-white/5 rounded-xl shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/40 bg-white dark:bg-slate-950 group",
          isOverlay && "ring-4 ring-primary shadow-2xl rotate-2",
          lead.intent === 'HOT' && "shadow-[0_0_20px_rgba(244,63,94,0.1)] border-rose-500/30"
        )}
      >
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
                <span className="text-base font-semibold tracking-tight text-slate-900 dark:text-white leading-tight tracking-tight">
                    {lead.name}
                </span>
                <span className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-slate-400">
                    ID-{lead.id.slice(-6).toUpperCase()}
                </span>
            </div>
            <div className="flex items-center gap-1.5 translate-y-[-2px]">
                {lead.intent === 'HOT' && <Sparkles className="h-4 w-4 text-rose-500 animate-pulse" />}
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-300 hover:text-slate-600">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge className={cn("text-[8px] font-semibold tracking-tight uppercase tracking-[0.2em] px-2 h-5 ring-1", getIntentBadgeContext(lead.intent))}>
              {lead.intent}
            </Badge>
            <Badge variant="outline" className="text-[9px] font-semibold py-0 h-5 border-border/50 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 text-slate-500">
               {lead.source?.replace('_', ' ')}
            </Badge>
            {lead.category && lead.category !== 'OTHER' && (
              <Badge className={cn("text-[8px] font-semibold tracking-tight uppercase px-2 h-5 border-none", CATEGORY_COLORS[lead.category])}>
                {lead.category.slice(0, 3)}
              </Badge>
            )}
          </div>

          <TooltipProvider>
          <div className="flex items-center justify-between gap-2 pt-1">
             <div className="flex items-center gap-1.5">
                <Tooltip>
                    <TooltipTrigger>
                        <button
                            className="h-8 w-8 rounded-xl transition-all duration-200 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:scale-110 cursor-pointer ring-1 ring-blue-200/50 flex items-center justify-center"
                            onClick={handleCall}
                        >
                            <Phone className="h-3.5 w-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[10px] font-semibold tracking-tight uppercase">
                        Call via Tata Smartflo
                    </TooltipContent>
                </Tooltip>
                
                <Tooltip>
                    <TooltipTrigger>
                        <button
                            className="h-8 w-8 rounded-xl transition-all duration-200 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white hover:scale-110 cursor-pointer ring-1 ring-[#25D366]/20 flex items-center justify-center"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (!lead.consentFlag) { toast.error("DPDPA Consent Missing", { description: "Consent required before WhatsApp engagement." }); return; }
                                logEngagement("WHATSAPP");
                                openLead("engagement");
                            }}
                        >
                            <WhatsAppIcon className="h-3.5 w-3.5" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[10px] font-semibold tracking-tight uppercase">
                        WhatsApp / AI Smart Drafts
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger>
                        <Button 
                            size="icon" 
                            className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white transition-all text-slate-500 border-none shadow-none ring-1 ring-slate-200/50 dark:ring-white/10"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                logEngagement("EMAIL");
                                window.open(`mailto:${lead.email}`);
                            }}
                        >
                            <Mail className="h-3.5 w-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-[10px] font-semibold tracking-tight uppercase">Email Node</TooltipContent>
                </Tooltip>
             </div>

             <div className="flex flex-col items-end">
                <span className="text-[9px] font-semibold text-slate-400 uppercase">AI Score</span>
                <span className={`text-[11px] font-semibold tracking-tight ${lead.aiScore && lead.aiScore > 70 ? "text-emerald-500" : "text-slate-900 dark:text-white"}`}>
                    {lead.aiScore || "0"}%
                </span>
             </div>
          </div>
          </TooltipProvider>

          <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-white/5">
            {lead.consentFlag ? (
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-tight">DPDPA Verified</span>
                </div>
            ) : (
                <div className="flex items-center gap-1.5 opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Pending Consent</span>
                </div>
            )}
            
            <span className="text-[9px] font-semibold text-slate-300">
                {mounted ? new Date(lead.createdAt).toLocaleDateString() : "---"}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Public export: wrapped in Suspense + React.memo to prevent unnecessary re-renders
export const KanbanCard = React.memo(function KanbanCard(props: { lead: Lead; isOverlay?: boolean }) {
  return (
    <Suspense fallback={<div className="h-[140px] rounded-xl bg-slate-100/50 animate-pulse" />}>
      <KanbanCardInner {...props} />
    </Suspense>
  );
});
