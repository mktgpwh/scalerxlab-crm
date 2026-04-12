"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import type { LeadIntent } from "@prisma/client";
import { Lead } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Phone, ShieldAlert, Zap } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function RealtimeLeadsTable({ 
  initialLeads 
}: { 
  initialLeads: Lead[]
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const openLead = (leadId: string, tab?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("leadId", leadId);
    if (tab) params.set("tab", tab);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCall = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    if (!lead.consentFlag) {
      toast.error("COMMUNICATION BLOCKED", {
        description: "DPDPA consent not verified for this patient node.",
        icon: <ShieldAlert className="w-5 h-5 text-rose-500" />
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
        toast.success("Call Initiated", { description: "Connecting your extension via Tata Smartflo..." });
      } else {
        toast.error(data.error || "Telephony failure");
      }
    } catch (err) {
      toast.error("Connection failed");
    }
  };

  useEffect(() => {
    if (!supabase) return;

    try {
      const channel = supabase.channel('realtime_leads');
      
      if (!channel) {
        console.error("Failed to create realtime leads channel");
        return;
      }

      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'leads'
          },
          (payload) => {
            setLeads((currentLeads) => [payload.new as Lead, ...currentLeads]);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE', 
            schema: 'public',
            table: 'leads'
          },
          (payload) => {
            setLeads((currentLeads) => 
              currentLeads.map((lead) => 
                lead.id === (payload.new as Lead).id ? (payload.new as Lead) : lead
              )
            );
          }
        )
        .subscribe((status) => {
           if (status !== 'SUBSCRIBED') {
             console.warn("Realtime leads channel status:", status);
           }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("Supabase realtime leads error:", err);
    }
  }, [supabase]);

  const getIntentBadgeContext = (intent: LeadIntent) => {
    switch(intent) {
      case "HOT": return "bg-rose-500 hover:bg-rose-600 text-white";
      case "WARM": return "bg-amber-500 hover:bg-amber-600 text-white";
      case "COLD": return "bg-blue-500 hover:bg-blue-600 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  return (
    <TooltipProvider>
    <Card className="rounded-md border p-0 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead>Contact Lead</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-center">AI Intent Status</TableHead>
            <TableHead className="text-center">AI Score</TableHead>
            <TableHead className="text-center">Engagement</TableHead>
            <TableHead className="text-center">Compliance</TableHead>
            <TableHead className="text-right">Time Captured</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-gray-500">
                No leads present for this organization yet. Awaiting webhooks...
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow 
                key={lead.id} 
                className="cursor-pointer group hover:bg-gray-50"
                onClick={() => openLead(lead.id)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{lead.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">
                      {lead.email || lead.phone || lead.whatsappNumber || "No Contact info"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] tracking-wider uppercase bg-gray-100">
                    {lead.source?.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={`${getIntentBadgeContext(lead.intent)} shadow-sm border-0 font-semibold px-3 py-1`}>
                    {lead.intent}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {lead.aiScore ? (
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs ring-2 ring-slate-100">
                      {lead.aiScore}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 animate-pulse">Scoring...</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!lead.consentFlag}
                          className={cn(
                            "h-8 w-8 rounded-lg transition-all",
                            lead.consentFlag ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900" : "text-gray-300 pointer-events-none"
                          )}
                          onClick={(e) => handleCall(e, lead)}
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px] uppercase font-black">
                        {lead.consentFlag ? "One-Click Call" : "Blocked"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={!lead.consentFlag}
                          className={cn(
                            "h-8 w-8 rounded-lg transition-all",
                            lead.consentFlag ? "hover:bg-green-50" : "text-gray-300 pointer-events-none"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            openLead(lead.id, "engagement");
                          }}
                        >
                          <SiWhatsapp className="h-4 w-4 text-[#25D366] cursor-pointer hover:opacity-80 transition-opacity" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px] uppercase font-black">
                        {lead.consentFlag ? "AI Smart Drafts" : "Blocked"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {lead.consentFlag ? (
                    <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                      <Zap className="h-3 w-3 fill-emerald-600" />
                      <span className="text-[10px] font-bold uppercase">Safe</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-rose-500 animate-pulse">
                      <ShieldAlert className="h-3 w-3" />
                      <span className="text-[10px] font-black uppercase">Blocked</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-gray-500 whitespace-nowrap">
                  {formatDistanceToNow(new Date(lead.createdAt || new Date()), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
    </TooltipProvider>
  );
}
