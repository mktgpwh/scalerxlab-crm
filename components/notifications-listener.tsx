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
            toast.error(`🔥 High Intent Lead: ${payload.payload.name}`, {
              description: `New lead scored ${payload.payload.score}/100. Check the pipeline now!`,
              duration: 8000,
              icon: <Flame className="w-4 h-4 text-rose-500" />,
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
