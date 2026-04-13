"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Flame, Phone, AlertCircle } from "lucide-react";

export function NotificationsListener() {
  const supabase = createClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 🔔 INITIALIZE EMERGENCY CHIME
    audioRef.current = new Audio("https://actions.google.com/sounds/v1/foley/emergency_chime.ogg");
    audioRef.current.volume = 0.8;
  }, []);

  useEffect(() => {
    if (!supabase) return;

    try {
      const channel = supabase.channel('global_notifications');

      if (!channel) {
        console.error("Failed to create global notifications channel");
        return;
      }

      channel
        .on('broadcast', { event: 'CLINICAL_EMERGENCY' }, (payload: any) => {
          // 🔊 Play High-Visibility Audio Alert
          audioRef.current?.play().catch(e => console.warn("Audio play blocked by browser:", e));

          toast.error(`EMERGENCY: CLINICAL URGENCY DETECTED`, {
            description: `Patient ${payload.payload.name} reports distress: "${payload.payload.concern.substring(0, 40)}..."`,
            duration: Infinity, // Persistent until dismissed
            icon: <AlertCircle className="w-6 h-6 text-white animate-bounce" />,
            action: {
              label: "RESPOND NOW",
              onClick: () => window.location.href = `/inbox?leadId=${payload.payload.leadId}`
            },
            style: { 
                backgroundColor: '#991b1b', 
                color: '#ffffff', 
                border: '4px solid #fecaca', 
                boxShadow: '0 0 100px rgba(220, 38, 38, 0.8)',
                padding: '24px',
                borderRadius: '1rem'
            },
            className: "font-black uppercase tracking-tighter",
          });
        })
        .on('broadcast', { event: 'HOT_LEAD' }, (payload: any) => {
          toast.error(`FLASH ALERT: HIGH INTENT PATIENT`, {
            description: `Patient ${payload.payload.name} scored ${payload.payload.score}/100. Requires immediate triage!`,
            duration: 10000,
            icon: <Flame className="w-5 h-5 text-white animate-pulse" />,
            style: { backgroundColor: '#ef4444', color: '#ffffff', border: 'none', boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)' },
            className: "font-black uppercase tracking-widest",
          });
        })
        .on('broadcast', { event: 'CALL_INCOMING' }, (payload: any) => {
          toast(`INCOMING CALL: ${payload.payload.leadName}`, {
            description: `Intent: ${payload.payload.intent} | Score: ${payload.payload.score}% | ID: ${payload.payload.callerId}`,
            duration: 15000,
            icon: <Phone className="w-5 h-5 text-emerald-500 animate-bounce" />,
            action: {
              label: "Open Record",
              onClick: () => window.location.href = `/leads?leadId=${payload.payload.callId}`
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
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("Supabase subscription error:", err);
    }
  }, [supabase]);

  return null;
}
