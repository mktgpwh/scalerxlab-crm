"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Search, Filter, ChevronDown, X, ArrowUpDown, ExternalLink, Download, ShieldAlert, Flame
} from "lucide-react";
import { FacebookIcon, WhatsAppIcon } from "@/components/icons";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useDashboardStore } from "@/lib/store/use-dashboard-store";
import { toast } from "sonner";

const INTENT_STYLES: Record<string, string> = {
  HOT:    "bg-rose-50 text-rose-600 border border-rose-200/50",
  WARM:   "bg-amber-50 text-amber-600 border border-amber-200/50",
  COLD:   "bg-slate-50 text-slate-500 border border-slate-200/50",
  UNSCORED: "bg-slate-50 text-slate-400 border border-slate-200/50",
};

const STATUS_STYLES: Record<string, string> = {
  RAW:               "bg-slate-50 text-slate-500 border border-slate-200/50",
  QUALIFIED:         "bg-indigo-50 text-indigo-600 border border-indigo-200/50",
  CONTACTED:         "bg-blue-50 text-blue-600 border border-blue-200/50",
  APPOINTMENT_FIXED: "bg-amber-50 text-amber-600 border border-amber-200/50",
  VISITED:           "bg-violet-50 text-violet-600 border border-violet-200/50",
  WON:               "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
  LOST:              "bg-rose-50 text-rose-600 border border-rose-200/50"
};

const CATEGORY_STYLES: Record<string, string> = {
  INFERTILITY: "bg-emerald-50 text-emerald-600 border border-emerald-200/50",
  MATERNITY:   "bg-indigo-50 text-indigo-600 border border-indigo-200/50",
  GYNECOLOGY:  "bg-rose-50 text-rose-600 border border-rose-200/50",
  OTHER:       "bg-slate-50 text-slate-500 border border-slate-200/50"
};

const maskPhone = (num?: string | null) => {
  if (!num) return "No phone";
  if (num.length <= 4) return num;
  return '*'.repeat(num.length - 4) + num.slice(-4);
};

function FilterChip({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const isActive = value !== "ALL";
  return (
    <Popover>
      <PopoverTrigger>
        <Button className={cn(
          "flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold tracking-tight uppercase border transition-all cursor-pointer hover:border-primary/50",
          isActive
            ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
            : "bg-white dark:bg-white/5 text-slate-500 border-border/50 dark:border-white/10 hover:border-primary/30 hover:text-primary"
        )}>
          <Filter className="h-3 w-3" />
          {isActive ? value : label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 rounded-xl p-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-border/50 shadow-xl" align="start">
        <div className="space-y-0.5">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-xl text-[10px] font-semibold tracking-tight uppercase tracking-widest transition-colors",
                value === opt ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-50 dark:hover:bg-white/5"
              )}
            >
              {opt === "ALL" ? `All ${label}s` : opt.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function LeadsDataView({ 
  leads, 
  userRole, 
  team,
  branches
}: { 
  leads: Record<string, any>[], 
  userRole: string,
  team: any[],
  branches: any[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterIntent, setFilterIntent] = useState<string>("ALL");
  const [sortField, setSortField] = useState<string>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sources   = useMemo(() => ["ALL", ...Array.from(new Set(leads.map(l => l.source).filter(Boolean)))], [leads]);
  const statuses  = useMemo(() => ["ALL", "RAW","QUALIFIED","CONTACTED","APPOINTMENT_FIXED","VISITED","WON","LOST"], []);
  const categories = ["ALL","INFERTILITY","MATERNITY","GYNECOLOGY","OTHER"];
  const intents   = ["ALL","HOT","WARM","COLD","UNSCORED"];

  const openLead = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("leadId", id);
    router.push(`${pathname}?${params.toString()}`);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Source", "Status", "Treatment", "Center", "Heat Score", "AI Score", "Compliance", "Captured"];
    const rows = filtered.map(l => [
      l.name || "—",
      l.email || "—",
      (l.source || "UNKNOWN").replace(/_/g, " "),
      (l.status || "RAW").replace(/_/g, " "),
      l.category || "OTHER",
      l.branch?.name || "Global Node",
      l.metadata?.intentLevel || "UNSCORED",
      l.aiScore ?? "—",
      l.consentFlag ? "Opt-In" : "Silent",
      new Date(l.createdAt).toLocaleDateString("en-IN")
    ]);
    const csvContent = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `pahlajani-leads-${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Export Successful", { description: `${filtered.length} leads exported. Mobile numbers excluded for DPDPA compliance.` });
  };

  const handleCall = async (e: React.MouseEvent, lead: any) => {
    e.stopPropagation();
    if (!lead.consentFlag) {
      toast.error("BLOCKED", { description: "DPDPA consent not verified.", icon: <ShieldAlert className="h-4 w-4 text-rose-500" /> });
      return;
    }
    try {
      const res = await fetch(`/api/telephony/tata/make-call`, { method: "POST", body: JSON.stringify({ leadId: lead.id }) });
      const data = await res.json();
      res.ok ? toast.success("Call Initiated", { description: "Connecting via Tata Smartflo..." }) : toast.error(data.error || "Telephony failure");
    } catch { toast.error("Connection failed"); }
  };

  const { ownerId, setOwnerId } = useDashboardStore();

  const handleReassign = async (leadId: string, newOwnerId: string | null) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify({ ownerId: newOwnerId === "unassigned" ? null : newOwnerId })
      });
      if (res.ok) {
        toast.success("Ownership Transferred", { description: "Lead visibility has been updated successfully." });
        router.refresh();
      }
    } catch (err) {
      toast.error("Transfer Failed", { description: "Matrix connectivity error." });
    }
  };

  const filtered = useMemo(() => {
    let result = leads.filter(l => {
      if (userRole === "SALES_ADMIN" || userRole === "SUPER_ADMIN") {
        if (ownerId === "unassigned" && l.ownerId !== null) return false;
        if (ownerId !== "unassigned" && ownerId !== null && l.ownerId !== ownerId) return false;
      }
      const q = search.toLowerCase();
      const matchSearch = !q || 
        (l.name || "").toLowerCase().includes(q) || 
        (l.phone || "").includes(q) || 
        (l.email || "").toLowerCase().includes(q) ||
        (l.aiNotes || "").toLowerCase().includes(q);
      const matchSource   = filterSource === "ALL"   || l.source === filterSource;
      const matchStatus   = filterStatus === "ALL"   || l.status === filterStatus;
      const matchCategory = filterCategory === "ALL" || (l.category || "OTHER") === filterCategory;
      const matchIntent   = filterIntent === "ALL"   || (l.intent || "UNSCORED") === filterIntent;
      return matchSearch && matchSource && matchStatus && matchCategory && matchIntent;
    });

    result.sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (sortField === "createdAt") { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
      if (sortField === "aiScore") { av = av ?? -1; bv = bv ?? -1; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [leads, search, filterSource, filterStatus, filterCategory, filterIntent, sortField, sortDir, ownerId, userRole]);

  const activeFilters = [filterSource, filterStatus, filterCategory, filterIntent].filter(f => f !== "ALL").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            className="pl-11 h-11 rounded-xl bg-white dark:bg-white/5 border-border/50 dark:border-white/5 ring-1 ring-slate-200/50 dark:ring-white/5 font-medium focus-visible:ring-primary/30"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <FilterChip label="Source" value={filterSource} options={sources} onChange={setFilterSource} />
          <FilterChip label="Status" value={filterStatus} options={statuses} onChange={setFilterStatus} />
          <FilterChip label="Treatment" value={filterCategory} options={categories} onChange={setFilterCategory} />
          <FilterChip label="Heat" value={filterIntent} options={intents} onChange={setFilterIntent} />
          {(userRole === "SALES_ADMIN" || userRole === "SUPER_ADMIN") && (
            <FilterChip 
               label="Access" 
               value={ownerId === "unassigned" ? "UNASSIGNED" : (team.find(t => t.id === ownerId)?.name || "ALL OWNERS")} 
               options={["ALL", "UNASSIGNED", ...team.map(t => t.name)]} 
               onChange={(val) => {
                   if (val === "ALL") setOwnerId(null);
                   else if (val === "UNASSIGNED") setOwnerId("unassigned");
                   else {
                       const t = team.find(tm => tm.name === val);
                       if (t) setOwnerId(t.id);
                   }
               }} 
            />
          )}
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" className="text-[10px] font-semibold tracking-tight uppercase text-rose-500 rounded-full h-8 px-3"
              onClick={() => { setFilterSource("ALL"); setFilterStatus("ALL"); setFilterCategory("ALL"); setFilterIntent("ALL"); }}>
              <X className="h-3 w-3 mr-1" /> Clear ({activeFilters})
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-tight text-slate-400 uppercase tracking-widest">
          Showing <span className="text-slate-900 dark:text-white">{filtered.length}</span> Matrix Nodes
        </p>
        <div className="flex items-center gap-3">
          {["SUPER_ADMIN", "SALES_ADMIN", "MANAGER"].includes(userRole) && (
            <Button onClick={handleExportCSV} size="sm" variant="outline" className="h-8 px-3 rounded-xl text-[10px] font-semibold tracking-tight uppercase tracking-widest gap-1.5 border-emerald-500/30 text-emerald-600">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-black/20 rounded-xl ring-1 ring-slate-200/60 dark:ring-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 dark:border-white/5">
                {["Patient", "Origin", "Status", "Speciality", "Center", "Owner", "Heat", "AI Score", "Captured"].map(label => (
                  <th key={label} className="px-5 py-4 text-left text-[9px] font-semibold tracking-tight uppercase tracking-widest text-slate-400">{label}</th>
                ))}
                <th className="px-5 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
              {filtered.map(lead => (
                <tr key={lead.id} onClick={() => openLead(lead.id)} className="hover:bg-slate-50/70 cursor-pointer transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-[10px] font-semibold tracking-tight text-primary">{(lead.name || "?")[0].toUpperCase()}</div>
                      <div>
                        <p className="text-sm font-semibold tracking-tight text-slate-900 leading-tight">{lead.name || "Anonymous"}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{maskPhone(lead.phone || lead.whatsappNumber)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {lead.source === 'WHATSAPP' && <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />}
                      <span className="text-[10px] font-semibold tracking-tight uppercase">{lead.source?.replace(/_/g, " ")}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge className={cn("text-[8px] font-semibold tracking-tight uppercase", STATUS_STYLES[lead.status])}>{lead.status?.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge className={cn("text-[8px] font-semibold tracking-tight uppercase", CATEGORY_STYLES[lead.category] || CATEGORY_STYLES.OTHER)}>{lead.category || "OTHER"}</Badge>
                  </td>
                  <td className="px-5 py-4 text-[10px] font-semibold tracking-tight uppercase opacity-60">{lead.branch?.name || "Global"}</td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-semibold tracking-tight uppercase text-slate-400">{lead.owner?.name || "Unassigned"}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge className={cn("text-[8px] font-semibold tracking-tight uppercase", INTENT_STYLES[lead.metadata?.intentLevel] || INTENT_STYLES.UNSCORED)}>{lead.metadata?.intentLevel || "UNSCORED"}</Badge>
                  </td>
                  <td className="px-5 py-4 text-[10px] font-semibold tracking-tight">{lead.metadata?.intentScore ?? "—"}</td>
                  <td className="px-5 py-4 text-[10px] text-slate-400 whitespace-nowrap">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-4"><ExternalLink className="h-4 w-4 text-slate-300 group-hover:text-primary" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
