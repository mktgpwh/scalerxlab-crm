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
  Phone,
  Puzzle,
  LogOut,
  ShieldCheck,
  Radio,
  PowerOff,
  Receipt,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { toggleUserPresence } from "@/app/(dashboard)/settings/users/actions";
import { toast } from "sonner";
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
import { usePathname, useRouter } from "next/navigation";

const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab";

const items = [
  { title: "Command Center", url: "/", icon: Home, label: "Overview" },
  { title: "Sovereign Intelligence", url: "/intelligence", icon: Sparkles, label: "AgentX" },
  { title: "Lead Funnels", url: "/pipeline", icon: LayoutDashboard, label: "Pipelines" },
  { title: "Front Desk Console", url: "/front-desk/today", icon: UserCheck, label: "Reception" },
  { title: "Billing Terminal", url: "/billing", icon: Receipt, label: "Revenue Node" },
  { title: "Revenue Command", url: "/billing/reporting", icon: TrendingUp, label: "Financial BI" },
  { title: "Intelligence Matrix", url: "/matrix", icon: BarChart3, label: "MIS Insights" },
  { title: "Shared Inbox", url: "/inbox", icon: (props: any) => <IntegrationIcon slug="whatsapp" {...props} />, label: "WhatsApp" },
  { title: "Call Management", url: "/calls", icon: Phone, label: "Telephony" },
  { title: "Connections", url: "/integrations", icon: Puzzle, label: "Expansion Hub" },
  { title: "Activity Logs", url: "/activity", icon: History },
  { title: "Personnel Matrix", url: "/settings/users", icon: Users, label: "Command Roster" },
  { title: "Performance Matrix", url: "/performance", icon: BarChart3, label: "Departmental BI" },
  { title: "Security & Compliance", url: "/security", icon: ShieldCheck, label: "Privacy Vault" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as any;
  const role = user?.role;
  const userId = user?.id;

  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isPresenceLoading, setIsPresenceLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setIsOnline(user.isOnline || false);
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const handleTogglePresence = async () => {
    if (!userId) return;
    setIsPresenceLoading(true);
    const newStatus = !isOnline;
    const result = await toggleUserPresence(userId, newStatus);
    setIsPresenceLoading(false);
    
    if (result.success) {
      setIsOnline(newStatus);
      toast.success(newStatus ? "Back on Operations" : "Node Standby", {
        description: newStatus ? "You are now receiving live leads." : "Leads will pass to other online nodes.",
        icon: newStatus ? <Radio className="h-4 w-4 text-emerald-500 animate-pulse" /> : <PowerOff className="h-4 w-4 text-slate-400" />
      });
    }
  };

  // Filter items based on role
  // Filter items based on new strict strict roles
  const filteredItems = items.filter((item) => {
    // 0. Revenue Command is restricted to SUPER_ADMIN only
    if (item.title === "Revenue Command") {
      return role === "SUPER_ADMIN";
    }

    // 1. Super Admin / Admins see almost everything
    if (role === "SUPER_ADMIN" || role === "TELE_SALES_ADMIN" || role === "FIELD_SALES_ADMIN") return true;

    // 2. Front Desk restrictive view
    if (role === "FRONT_DESK") {
      return ["Command Center", "Lead Funnels", "Front Desk Console", "Billing Terminal"].includes(item.title);
    }

    // 3. Counsellor (restricted from high-level, telephony, and command center)
    if (role === "COUNSELLOR") {
      return ["Lead Funnels", "Billing Terminal", "Shared Inbox", "Activity Logs"].includes(item.title);
    }

    // 4. Sales Nodes (General operational view)
    if (role === "TELE_SALES" || role === "FIELD_SALES") {
      if (["Connections", "Sovereign Intelligence", "Security & Compliance", "Intelligence Matrix", "Personnel Matrix"].includes(item.title)) {
        return false;
      }
      return true;
    }

    // 5. Billing Node
    if (role === "BILLING") {
       return ["Billing Terminal", "Revenue Command"].includes(item.title);
    }

    return false; // Default: hide everything if role is unrecognized
  });

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-background/80 backdrop-blur-xl shadow-xl">
      <SidebarHeader className="h-16 flex items-center px-4 bg-transparent border-b border-border/40">
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push("/")}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden bg-background border border-border/60 shadow-sm transition-all group-hover:scale-105 group-hover:-rotate-2 shrink-0 p-1">
            <Image src="/scalerxlab-logo.png" alt="Pahlajani's" width={28} height={28} className="object-contain w-full h-full" priority />
          </div>
          <div className="flex flex-col gap-0.5 transition-opacity group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none min-w-0 pl-0.5">
             <span className="text-sm font-semibold tracking-tight text-foreground truncate">Pahlajani's</span>
             <span className="text-[10px] font-medium uppercase tracking-widest text-primary/80">Business OS</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 mt-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 px-2">Core Operations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filteredItems.map((item) => {
                const isActive = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      tooltip={item.title}
                      isActive={isActive}
                      className={cn(
                        "h-10 transition-all duration-200 rounded-xl group relative overflow-hidden cursor-pointer",
                        isActive 
                          ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary" 
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 w-full px-2">
                        <item.icon className={cn(
                          "h-4.5 w-4.5 transition-transform group-hover:scale-105",
                          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13px] font-medium tracking-tight truncate">{item.title}</span>
                          {item.label && <span className="text-[9px] font-medium opacity-50 group-data-[collapsible=icon]:hidden truncate">{item.label}</span>}
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
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2 px-2">System Health</SidebarGroupLabel>
          <div className="px-2 space-y-4 group-data-[collapsible=icon]:hidden">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-muted-foreground">AgentX Stream</span>
                <span className="flex items-center gap-2 text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                  Active
                </span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/30 border border-border/40 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground">AI Intelligence</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">Real-time lead scoring and autonomous triage active.</p>
              <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[75%] bg-primary shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
              </div>
            </div>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-border/40 gap-2">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleTogglePresence}
              disabled={isPresenceLoading}
              className={cn(
                "h-10 rounded-xl px-3 transition-all cursor-pointer",
                isOnline 
                  ? "bg-emerald-50/10 text-emerald-500 border border-emerald-500/20 font-semibold" 
                  : "bg-muted/50 text-muted-foreground border border-transparent"
              )}
            >
              <div className="flex items-center gap-3 w-full">
                {isOnline ? (
                  <>
                    <div className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight group-data-[collapsible=icon]:hidden">Node Online</span>
                  </>
                ) : (
                  <>
                    <PowerOff className="h-4 w-4 shrink-0" />
                    <span className="text-[11px] font-medium tracking-tight group-data-[collapsible=icon]:hidden">Node Standby</span>
                  </>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton 
              render={<Link href="/settings/users" />}
              isActive={pathname.startsWith("/settings/users")}
              className={cn(
                "h-10 rounded-xl px-3 transition-all cursor-pointer", 
                pathname.startsWith("/settings/users") 
                  ? "bg-primary/10 text-primary font-semibold shadow-sm" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              <span className="text-[11px] font-medium tracking-tight group-data-[collapsible=icon]:hidden">Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="h-10 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-xl px-3 transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[11px] font-semibold tracking-tight group-data-[collapsible=icon]:hidden">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
