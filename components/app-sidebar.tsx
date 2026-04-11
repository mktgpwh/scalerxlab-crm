"use client";

import Image from "next/image";

import {
  Users,
  LayoutDashboard,
  History,
  Settings,
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
  SidebarFooter,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";

const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab";

const items = [
  { title: "Command Center", url: "/", icon: Home, label: "Overview" },
  { title: "Intelligence Hub", url: "/leads", icon: Users, label: "Leads" },
  { title: "Capture Pipeline", url: "/pipeline", icon: LayoutDashboard, label: "Sales" },
  { title: "Shared Inbox", url: "/inbox", icon: WhatsAppIcon, label: "WhatsApp" },
  { title: "Call Management", url: "/calls", icon: Phone, label: "Telephony" },
  { title: "Integrations", url: "/integrations", icon: Command, label: "Ads & WA" },
  { title: "Analytics Hub", url: "/analytics", icon: BarChart3, label: "Insights" },
  { title: "Activity Logs", url: "/activity", icon: History },
  { title: "System Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-white/10 bg-slate-950/90 backdrop-blur-xl shadow-2xl max-md:bg-slate-950/98 max-md:backdrop-blur-none">
      <SidebarHeader className="h-20 flex items-center px-4 bg-transparent border-b border-white/5">
        <div className="flex items-center gap-3 group">
          {/* Logo mark (collapsed state) */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-slate-900 ring-1 ring-slate-800 shadow-xl transition-transform group-hover:scale-105 shrink-0">
            <Image src="/scalerxlab-logo.png" alt={clinicName} width={32} height={32} className="object-contain" />
          </div>
          {/* Full logo (expanded state) */}
          <div className="flex flex-col gap-0 transition-opacity group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none min-w-0">
            <div className="h-7 w-auto relative">
              <Image src="/scalerxlab-logo.png" alt={clinicName} width={110} height={28} className="object-contain object-left" />
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
              {items.map((item) => {
                const isActive = item.url === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
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
              <div className="flex items-center justify-between opacity-60">
                <span className="text-[11px] font-bold text-slate-500">Integrations</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">3 Linked</span>
              </div>
            </div>

            <div className="p-4 rounded-3xl bg-white/5 border border-white/5 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-wider text-white leading-none">AI Priority</span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium leading-[1.4] mb-3">
                AI is actively scoring incoming leads.
              </p>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-[75%] bg-primary shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
              </div>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-white/5">
        <div className="flex items-center justify-center gap-2 group-data-[collapsible=icon]:hidden">
          <div className="h-5 w-5 relative opacity-50">
            <Image src="/scalerxlab-logo.png" alt="ScalerX" fill className="object-contain grayscale brightness-200" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
            Powered by <span className="text-slate-400">ScalerX Lab</span>
          </span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
