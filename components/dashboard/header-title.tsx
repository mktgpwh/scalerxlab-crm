"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const titleMap: Record<string, string> = {
  "/": "Command Center",
  "/intelligence": "Intelligence Hub",
  "/pipeline": "Capture Pipeline",
  "/inbox": "Shared Inbox",
  "/calls": "Call Management",
  "/integrations": "Integrations Hub",
  "/analytics": "Analytics Hub",
  "/activity": "Activity Logs",
  "/settings": "System Settings",
  "/leads": "Lead Matrix",
};

export function HeaderTitle({ clinicName }: { clinicName: string }) {
  const pathname = usePathname();
  const currentTitle = titleMap[pathname] || "Sovereign Hub";

  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">
        Active Node / {currentTitle}
      </span>
      <h1 className="text-sm font-black text-slate-900 dark:text-white lowercase tracking-tighter italic">
        {clinicName.toLowerCase()} hub
      </h1>
    </div>
  );
}
