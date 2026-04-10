"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Flame, Phone } from "lucide-react";

export function NotificationsListener({ organizationId }: { organizationId: string }) {
  const supabase = createClient();

  useEffect(() => {
    if (!supabase || !organizationId) return;

    try {
      const channel = supabase.channel('global_notifications');
      
      if (!channel) {
        console.error("Failed to create global notifications channel");
        return;
      }

      channel
        .on(
          'broadcast',
          { event: 'HOT_LEAD' },
          (payload) => {
            if (payload.payload.orgId === organizationId) {
              toast.error(`FLASH ALERT: HIGH INTENT PATIENT`, {
                description: `Patient ${payload.payload.name} scored ${payload.payload.score}/100. Requires immediate triage!`,
                duration: 10000,
                icon: <Flame className="w-5 h-5 text-white animate-pulse" />,
                style: { backgroundColor: '#ef4444', color: '#ffffff', border: 'none', boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)' },
                className: "font-black uppercase tracking-widest",
              });
            }
          }
        )
        .on(
          'broadcast',
          { event: 'CALL_INCOMING' },
          (payload) => {
            if (payload.payload.orgId === organizationId) {
              toast(`INCOMING CALL: ${payload.payload.leadName}`, {
                description: `Intent: ${payload.payload.intent} | Score: ${payload.payload.score}% | ID: ${payload.payload.callerId}`,
                duration: 15000,
                icon: <Phone className="w-5 h-5 text-emerald-500 animate-bounce" />,
                action: {
                  label: "Open Record",
                  onClick: () => window.location.href = `/${organizationId}/leads?leadId=${payload.payload.callId}`
                },
                style: { 
                  backgroundColor: '#ffffff', 
                  color: '#0f172a', 
                  border: '1px solid #e2e8f0', 
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  padding: '16px',
                  borderRadius: '1rem'
                },
                className: "font-black uppercase tracking-tight",
              });
            }
          }
        )
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            console.warn("Global notifications channel status:", status);
          }
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("Supabase subscription error:", err);
    }
  }, [supabase, organizationId]);

  return null; // This is a headless listener
}
