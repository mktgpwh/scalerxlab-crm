"use client";

import { 
  ShieldCheck, Lock, KeyRound, FileCheck2, UserCheck, 
  AlertTriangle, Database, Eye, Fingerprint, Zap, 
  BadgeCheck, Server, Globe, PhoneCall
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const protocols = [
  {
    category: "Encryption & Vault",
    color: "indigo",
    icon: KeyRound,
    items: [
      {
        title: "AES-256-GCM Encryption",
        description: "All integration tokens (WATI, Tata Smartflo, Meta) are encrypted using AES-256-GCM before being stored in the database. Plain-text credentials are never persisted.",
        badge: "ACTIVE",
        badgeColor: "emerald",
        spec: "256-bit key · GCM mode · Random IV per token"
      },
      {
        title: "Secure Credential Vault",
        description: "System credentials are stored in a singleton SystemSettings vault — not in environment variables or code. Decryption happens in-flight, only at dispatch time.",
        badge: "ACTIVE",
        badgeColor: "emerald",
        spec: "Singleton pattern · DB-level isolation"
      },
    ]
  },
  {
    category: "Data Privacy (DPDPA)",
    color: "rose",
    icon: FileCheck2,
    items: [
      {
        title: "DPDPA Consent Management",
        description: "Every patient lead has a consentFlag, consentTimestamp, and consentMethod field. No outbound communication (Call, WhatsApp) is permitted without verified consent.",
        badge: "ENFORCED",
        badgeColor: "rose",
        spec: "India DPDPA · Consent-first architecture"
      },
      {
        title: "Mobile Number Exclusion in Exports",
        description: "CSV exports of lead data deliberately exclude phone and whatsappNumber fields. Only clinical and engagement metadata is exported to prevent unauthorized data extraction.",
        badge: "ENFORCED",
        badgeColor: "rose",
        spec: "Export policy · PII-free downloads"
      },
      {
        title: "Data Retention Policy",
        description: "Each lead record supports a dataRetentionExpiry field for automatic data lifecycle management, aligned with DPDPA's purpose limitation principle.",
        badge: "CONFIGURED",
        badgeColor: "amber",
        spec: "Field-level TTL · Purpose limitation"
      },
    ]
  },
  {
    category: "Access Control (RBAC)",
    color: "blue",
    icon: UserCheck,
    items: [
      {
        title: "Role-Based Access Control",
        description: "7-tier role hierarchy enforced at the API and UI level: SUPER_ADMIN, ORG_ADMIN, MANAGER, AGENT, VIEWER, DOCTOR, COUNSELOR. Each role has scoped data access.",
        badge: "ACTIVE",
        badgeColor: "blue",
        spec: "7-level RBAC · UI + API enforcement"
      },
      {
        title: "Lead Ownership & Visibility",
        description: "Agents can only view leads assigned to them. Admins see all. Unassigned leads are visible only to admin-level roles, preventing data leakage between sales agents.",
        badge: "ACTIVE",
        badgeColor: "blue",
        spec: "Row-level isolation · Owner-scoped queries"
      },
    ]
  },
  {
    category: "Clinical Safety Protocol",
    color: "amber",
    icon: AlertTriangle,
    items: [
      {
        title: "AI Emergency Detection",
        description: "AgentX monitors every inbound message for clinical emergency keywords (pain, bleeding, emergency, severe, help). Detected emergencies trigger instant HUMAN_OVERRIDE and audio alerts.",
        badge: "ACTIVE",
        badgeColor: "emerald",
        spec: "Regex sentinel · Real-time escalation"
      },
      {
        title: "Automatic Escalation & Override",
        description: "When an emergency is detected, the lead is flagged as isEscalated, the AI is paused, and a visual red-pulse alert is shown to the clinical team for immediate human intervention.",
        badge: "ACTIVE",
        badgeColor: "emerald",
        spec: "Auto HUMAN_OVERRIDE · Visual + audio alert"
      },
      {
        title: "Anonymous Patient Identity Fallback",
        description: "If a WATI sender has no name, the system generates a clinical identity 'Pahlajani Patient - [XXXX]' using the last 4 digits of their number — never storing incomplete records.",
        badge: "ACTIVE",
        badgeColor: "emerald",
        spec: "Identity integrity · No orphan records"
      },
    ]
  },
  {
    category: "Infrastructure Security",
    color: "slate",
    icon: Server,
    items: [
      {
        title: "Supabase Row-Level Security",
        description: "Database access is governed by Supabase's PostgreSQL RLS policies. All queries are executed through an authenticated session — no anonymous DB access is permitted.",
        badge: "ACTIVE",
        badgeColor: "emerald",
        spec: "PostgreSQL RLS · Session-scoped access"
      },
      {
        title: "Edge-Secured API Routes",
        description: "All API routes are protected with server-side authentication checks. Webhook endpoints validate source signatures before processing any inbound data.",
        badge: "ACTIVE",
        badgeColor: "emerald",
        spec: "Server-side auth · Webhook verification"
      },
    ]
  }
];

const colorMap: Record<string, string> = {
  indigo: "from-indigo-500/10 to-indigo-500/5 ring-indigo-500/20 border-indigo-500/10",
  rose:   "from-rose-500/10 to-rose-500/5 ring-rose-500/20 border-rose-500/10",
  blue:   "from-blue-500/10 to-blue-500/5 ring-blue-500/20 border-blue-500/10",
  amber:  "from-amber-500/10 to-amber-500/5 ring-amber-500/20 border-amber-500/10",
  slate:  "from-slate-500/10 to-slate-500/5 ring-slate-500/20 border-slate-500/10",
};

const iconColorMap: Record<string, string> = {
  indigo: "text-indigo-500 bg-indigo-500/10",
  rose:   "text-rose-500 bg-rose-500/10",
  blue:   "text-blue-500 bg-blue-500/10",
  amber:  "text-amber-500 bg-amber-500/10",
  slate:  "text-slate-500 bg-slate-500/10",
};

const badgeColorMap: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 border-none",
  rose:    "bg-rose-500/10 text-rose-600 ring-rose-500/20 border-none",
  blue:    "bg-blue-500/10 text-blue-600 ring-blue-500/20 border-none",
  amber:   "bg-amber-500/10 text-amber-600 ring-amber-500/20 border-none",
};

export default function SecurityPage() {
  const totalProtocols = protocols.reduce((acc, cat) => acc + cat.items.length, 0);
  const activeCount = protocols.reduce(
    (acc, cat) => acc + cat.items.filter(i => i.badge === "ACTIVE" || i.badge === "ENFORCED").length, 0
  );

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 ring-1 ring-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.1),transparent_60%)]" />
        <div className="relative z-10">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight tracking-tighter text-white  lowercase">/security.vault</h1>
                  <p className="text-[10px] font-semibold tracking-tight text-white/40 uppercase tracking-[0.3em] mt-0.5">Compliance & Privacy Architecture</p>
                </div>
              </div>
              <p className="text-sm text-white/60 font-medium max-w-xl leading-relaxed">
                The ScalerX Business Suite is engineered to enterprise-grade security standards. 
                Every patient interaction is governed by consent-first protocols, AES-256 encryption, 
                and India's DPDPA compliance framework.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="text-center px-6 py-4 rounded-xl bg-white/5 ring-1 ring-white/10">
                <p className="text-3xl font-semibold tracking-tight text-white">{activeCount}</p>
                <p className="text-[9px] font-semibold tracking-tight text-white/40 uppercase tracking-widest mt-0.5">Active</p>
              </div>
              <div className="text-center px-6 py-4 rounded-xl bg-white/5 ring-1 ring-white/10">
                <p className="text-3xl font-semibold tracking-tight text-emerald-400">{totalProtocols}</p>
                <p className="text-[9px] font-semibold tracking-tight text-white/40 uppercase tracking-widest mt-0.5">Protocols</p>
              </div>
              <div className="text-center px-6 py-4 rounded-xl bg-white/5 ring-1 ring-white/10">
                <p className="text-3xl font-semibold tracking-tight text-indigo-400">256</p>
                <p className="text-[9px] font-semibold tracking-tight text-white/40 uppercase tracking-widest mt-0.5">Bit AES</p>
              </div>
            </div>
          </div>

          {/* Compliance Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-white/10">
            <span className="text-[9px] font-semibold tracking-tight text-white/30 uppercase tracking-widest mr-2">Compliance:</span>
            {["DPDPA 2023", "AES-256-GCM", "RBAC Enforced", "Consent-First", "PII Protected", "Audit Trail"].map(badge => (
              <span key={badge} className="px-3 py-1 rounded-full bg-white/10 text-white/70 text-[9px] font-semibold tracking-tight uppercase tracking-widest ring-1 ring-white/10">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Protocol Cards */}
      <div className="space-y-8">
        {protocols.map((category) => {
          const CatIcon = category.icon;
          return (
            <div key={category.category}>
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-4 px-1">
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", iconColorMap[category.color])}>
                  <CatIcon className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold tracking-tight uppercase tracking-widest text-slate-700 dark:text-slate-300">
                  {category.category}
                </h2>
                <div className="flex-1 h-px bg-slate-100 dark:bg-white/5" />
                <Badge className="text-[8px] font-semibold tracking-tight uppercase px-2 border-none bg-slate-100 dark:bg-white/5 text-slate-400">
                  {category.items.length} protocols
                </Badge>
              </div>

              {/* Protocol Items  */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {category.items.map((item) => (
                  <Card
                    key={item.title}
                    className={cn(
                      "p-6 rounded-xl border bg-gradient-to-br ring-1 shadow-sm transition-all hover:shadow-lg hover:scale-[1.01] group",
                      colorMap[category.color]
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0", iconColorMap[category.color])}>
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <Badge className={cn("text-[8px] font-semibold tracking-tight uppercase tracking-widest ring-1 px-2 py-0.5", badgeColorMap[item.badgeColor])}>
                        {item.badge}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white mb-2 leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
                      {item.description}
                    </p>

                    <div className="pt-4 border-t border-current/10">
                      <p className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-slate-400 font-mono">
                        ⚙ {item.spec}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer disclaimer */}
      <div className="rounded-xl bg-slate-50 dark:bg-white/5 ring-1 ring-slate-200/60 dark:ring-white/5 p-6 flex items-start gap-4">
        <div className="h-8 w-8 rounded-xl bg-slate-200/50 dark:bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
          <BadgeCheck className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-tight text-slate-700 dark:text-slate-300 mb-1">Security Architecture Audit Statement</p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            This Business Suite is built and maintained by <strong>ScalerX Lab</strong> with a security-first architecture. 
            All protocols listed above are actively enforced at the application, API, and database layer. 
            No patient PII is transmitted in plain text. All integrations are vault-secured with AES-256-GCM encryption.
            For security audits or compliance queries, contact your ScalerX administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
