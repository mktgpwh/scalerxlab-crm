"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, CheckCircle, AlertCircle, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReclassifyResult {
  totalLeads: number;
  processedLeads: number;
  updatedLeads: number;
  skippedLeads: number;
  errorCount: number;
}

interface Change {
  id: string;
  name: string;
  oldCategory: string;
  newCategory: string;
  oldIntent: string;
  newIntent: string;
}

export function ReclassifyLeadsCard() {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<ReclassifyResult | null>(null);
  const [changes, setChanges] = useState<Change[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleReclassify = async () => {
    setStatus("running");
    setResult(null);
    setChanges([]);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/reclassify-leads", { method: "POST" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "Re-classification failed.");
        setStatus("error");
        return;
      }

      setResult(data.summary);
      setChanges(data.changes || []);
      setStatus("done");
    } catch (e: any) {
      setErrorMsg(e.message || "Network error.");
      setStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 p-6 rounded-xl bg-[#243467]/5 border border-[#243467]/10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[#243467]/10 flex items-center justify-center shrink-0">
            <BrainCircuit className="h-6 w-6 text-[#243467]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold tracking-tight uppercase tracking-tight text-slate-900">
              Sentinel Re-Classification Engine
            </h4>
            <p className="text-xs font-medium text-slate-500 leading-relaxed mt-0.5">
              Re-score all existing leads using <strong>only their inbound messages</strong>. 
              Corrects any misclassification caused by outgoing clinic messages.
            </p>
          </div>
        </div>

        <Button
          onClick={handleReclassify}
          disabled={status === "running"}
          className={cn(
            "shrink-0 rounded-xl px-6 h-11 font-semibold tracking-tight uppercase tracking-widest text-[10px] shadow-lg transition-all",
            status === "running"
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-[#243467] hover:bg-[#1a2850] text-white shadow-[#243467]/30"
          )}
        >
          {status === "running" ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running...</>
          ) : status === "done" ? (
            <><RefreshCw className="h-4 w-4 mr-2" /> Run Again</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-2" /> Run Re-Classification</>
          )}
        </Button>
      </div>

      {/* Running state */}
      {status === "running" && (
        <div className="flex items-center gap-3 p-5 rounded-xl bg-amber-50 border border-amber-200/60">
          <Loader2 className="h-5 w-5 text-amber-500 animate-spin shrink-0" />
          <div>
            <p className="text-xs font-semibold tracking-tight text-amber-700 uppercase tracking-widest">AI Sentinel Processing...</p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
              Analyzing inbound messages for each lead. This may take 30–120 seconds depending on total lead count.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="flex items-center gap-3 p-5 rounded-xl bg-rose-50 border border-rose-200/60">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <div>
            <p className="text-xs font-semibold tracking-tight text-rose-700 uppercase">Error</p>
            <p className="text-[11px] text-rose-600 font-medium">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Success summary */}
      {status === "done" && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-5 rounded-xl bg-emerald-50 border border-emerald-200/60">
            <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
            <p className="text-xs font-semibold tracking-tight text-emerald-700 uppercase tracking-wide">Re-Classification Complete</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Total Leads", value: result.totalLeads, color: "text-slate-900" },
              { label: "Processed", value: result.processedLeads, color: "text-[#243467]" },
              { label: "Updated", value: result.updatedLeads, color: "text-emerald-600" },
              { label: "Skipped (No Messages)", value: result.skippedLeads, color: "text-amber-600" },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl bg-white border border-border/50 text-center">
                <p className={cn("text-2xl font-semibold tracking-tight tracking-tight", stat.color)}>{stat.value}</p>
                <p className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Changed leads list */}
          {changes.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold tracking-tight uppercase tracking-widest text-slate-400 px-1">
                Classification Changes ({changes.length})
              </p>
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {changes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-border/50">
                    <div>
                      <p className="text-sm font-semibold tracking-tight text-slate-900">{c.name}</p>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase">ID-{c.id.slice(-6)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge className="bg-slate-100 text-slate-600 border-none text-[8px] font-semibold tracking-tight uppercase">{c.oldCategory}</Badge>
                        <p className="text-[8px] text-slate-400 mt-0.5">{c.oldIntent}</p>
                      </div>
                      <span className="text-slate-300 text-xs">→</span>
                      <div className="text-right">
                        <Badge className="bg-[#243467]/10 text-[#243467] border-none text-[8px] font-semibold tracking-tight uppercase">{c.newCategory}</Badge>
                        <p className={cn("text-[8px] mt-0.5 font-semibold tracking-tight",
                          c.newIntent === "HOT" ? "text-rose-500" :
                          c.newIntent === "WARM" ? "text-amber-500" : "text-blue-500"
                        )}>{c.newIntent}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
