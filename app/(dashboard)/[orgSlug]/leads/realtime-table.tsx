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
import { LeadIntent } from "@prisma/client";
import { Lead } from "@/lib/types";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function RealtimeLeadsTable({ 
  initialLeads, 
  organizationId 
}: { 
  initialLeads: Lead[], 
  organizationId: string 
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const openLead = (leadId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("leadId", leadId);
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    // 1. Establish the Realtime Web-Socket
    const channel = supabase
      .channel('realtime_leads')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', // Could track UPDATE too for dynamic re-scoring
          schema: 'public',
          table: 'leads',
          filter: `organizationId=eq.${organizationId}`,
        },
        (payload) => {
          console.log('Realtime Lead Captured:', payload);
          // Push new lead dynamically to the top of the UI
          setLeads((currentLeads) => [payload.new as Lead, ...currentLeads]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', 
          schema: 'public',
          table: 'leads',
          filter: `organizationId=eq.${organizationId}`,
        },
        (payload) => {
          // Used when AI Score finishes calculating asynchronously and triggers an UPDATE
          setLeads((currentLeads) => 
            currentLeads.map((lead) => 
              lead.id === (payload.new as Lead).id ? (payload.new as Lead) : lead
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, organizationId]);

  const getIntentBadgeContext = (intent: LeadIntent) => {
    switch(intent) {
      case "HOT": return "bg-rose-500 hover:bg-rose-600 text-white";
      case "WARM": return "bg-amber-500 hover:bg-amber-600 text-white";
      case "COLD": return "bg-blue-500 hover:bg-blue-600 text-white";
      default: return "bg-gray-400 text-white";
    }
  };

  return (
    <Card className="rounded-md border p-0 overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-gray-50/50">
          <TableRow>
            <TableHead>Contact Lead</TableHead>
            <TableHead>Source</TableHead>
            <TableHead className="text-center">AI Intent Status</TableHead>
            <TableHead className="text-center">AI Score</TableHead>
            <TableHead className="text-center">DPDPA Compliance</TableHead>
            <TableHead className="text-right">Time Captured</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-gray-500">
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
                  {/* Extract UTM mapping if it dynamically captured from the URL Webhook */}
                  {(lead.metadata?.utm as Record<string, string> | undefined)?.source && (
                    <span className="block mt-1 text-[10px] text-gray-400">
                      UTM: {(lead.metadata?.utm as Record<string, string>).source}
                    </span>
                  )}
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
                  {lead.consentFlag ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      Missing Consent
                    </Badge>
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
  );
}
