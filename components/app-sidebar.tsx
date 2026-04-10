"use client";

import Image from "next/image";

import { 
  Users, 
  LayoutDashboard, 
  History, 
  Settings, 
  ChevronRight,
  Sparkles,
  Command,
  BarChart3,
  Home,
  Phone
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  {
    title: "Command Center",
    url: "",
    icon: Home,
    label: "Overview",
    moduleId: "core"
  },
  {
    title: "Intelligence Hub",
    url: "/leads",
    icon: Users,
    label: "Leads",
    moduleId: "core" // Always on
  },
  {
    title: "Capture Pipeline",
    url: "/pipeline",
    icon: LayoutDashboard,
    label: "Sales",
    moduleId: "operations"
  },
  {
    title: "Shared Inbox",
    url: "/inbox",
    icon: WhatsAppIcon,
    label: "WhatsApp",
    moduleId: "engagement"
  },
  {
    title: "Call Management",
    url: "/calls",
    icon: Phone,
    label: "Telephony",
    moduleId: "engagement"
  },
  {
    title: "Integrations",
    url: "/integrations",
    icon: Command,
    label: "Ads & WA",
    moduleId: "core"
  },
  {
    title: "Analytics Hub",
    url: "/analytics",
    icon: BarChart3,
    label: "Insights",
    moduleId: "intelligence"
  },
  {
    title: "Activity Logs",
    url: "/activity",
    icon: History,
    moduleId: "core"
  },
  {
    title: "System Settings",
    url: "/settings",
    icon: Settings,
    moduleId: "core"
  },
];

export function AppSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const orgSlug = params.orgSlug as string;
  const [modules, setModules] = useState<Record<string, boolean>>({
    core: true,
    ai: true,
    engagement: true,
    operations: true,
    intelligence: true
  });

  useEffect(() => {
    if (orgSlug) {
      fetch(`/api/organizations/${orgSlug}/modules`)
        .then(res => res.json())
        .then(data => {
            if (data && !data.error) setModules({ ...data, core: true });
        })
        .catch(err => console.error("Failed to load modules", err));
    }
  }, [orgSlug]);

  const filteredItems = items.filter(item => modules[item.moduleId]);

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl">
      <SidebarHeader className="h-20 flex items-center px-4 bg-transparent border-b border-white/5">
        <div className="flex items-center gap-3 group">
            {/* Logo mark (collapsed state) */}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-slate-900 ring-1 ring-slate-800 shadow-xl transition-transform group-hover:scale-105 shrink-0">
              <Image src="/scalerxlab-logo.png" alt="ScalerX Lab" width={32} height={32} className="object-contain" />
            </div>
            {/* Full logo (expanded state) */}
            <div className="flex flex-col gap-0 transition-opacity group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none min-w-0">
              <div className="h-7 w-auto relative">
                <Image src="/scalerxlab-logo.png" alt="ScalerX Lab" width={110} height={28} className="object-contain object-left" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-primary/70 mt-0.5">Clinical CRM</span>
            </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 mt-6">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 mb-4 px-2">Core Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {filteredItems.map((item) => {
                const fullUrl = `/${orgSlug}${item.url}`;
                const isActive = pathname === fullUrl;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                        render={<Link href={fullUrl} />}
                        tooltip={item.title}
                        isActive={isActive}
                        className={`h-12 transition-all duration-300 rounded-none group relative overflow-hidden ${
                            isActive 
                            ? "bg-primary/10 text-white font-medium border-l-4 border-primary shadow-[0_0_15px_rgba(var(--primary-glow),0.4)]" 
                            : "text-slate-200 hover:bg-white/5 hover:text-white"
                        }`}
                    >
                      <div className="flex items-center gap-3 w-full px-2">
                        <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? "text-white" : ""}`} />
                        <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight">{item.title}</span>
                            {item.label && <span className="text-[9px] font-medium opacity-60 group-data-[collapsible=icon]:hidden">{item.label}</span>}
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-300 mb-4 px-2">System Health</SidebarGroupLabel>
          <div className="px-2 space-y-4 group-data-[collapsible=icon]:hidden">
             <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">AgentX Stream</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-tighter">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        Active
                    </span>
                </div>
                {modules.core && (
                  <div className="flex items-center justify-between opacity-60">
                      <span className="text-[11px] font-bold text-slate-500">Integrations</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">3 Linked</span>
                  </div>
                )}
             </div>
             
             {modules.ai && (
               <div className="p-4 rounded-3xl bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 group-hover:glow-primary transition-all">
                  <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white leading-none">AI Priority</span>
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium leading-[1.4] mb-3">
                      Your AI is currently scoring high-intent leads from Facebook.
                  </p>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-[75%] bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  </div>
               </div>
             )}
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

