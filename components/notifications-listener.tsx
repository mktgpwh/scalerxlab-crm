"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Flame } from "lucide-react";

export function NotificationsListener({ organizationId }: { organizationId: string }) {
  const supabase = createClient();

  useEffect(() => {
    // Listen for HOT_LEAD broadcast events on the global notifications channel
    const channel = supabase
      .channel('global_notifications')
      .on(
        'broadcast',
        { event: 'HOT_LEAD' },
        (payload) => {
          console.log('HOT LEAD NOTIFICATION:', payload);
          
          // Only show notification if it belongs to this organization
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, organizationId]);

  return null; // This is a headless listener
}
