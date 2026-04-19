import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";
import { 
  Activity, 
  User, 
  PhoneCall, 
  Zap, 
  ShieldCheck,
  FileText
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";

const clinicName = process.env.NEXT_PUBLIC_CLINIC_NAME || "ScalerX Lab";

export default async function ActivityLogPage() {
  const logs = await prisma.activityLog.findMany({
    include: {
        lead: { select: { name: true, phone: true } },
        user: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 100 // limit for performance
  });

  const getActionIcon = (action: string) => {
    if (action.includes("WHATSAPP")) return <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />;
    if (action.includes("MESSAGE")) return <WhatsAppIcon className="h-4 w-4 text-emerald-500" />;
    if (action.includes("CALL")) return <PhoneCall className="h-4 w-4 text-blue-500" />;
    if (action.includes("AI") || action.includes("SCORE")) return <Zap className="h-4 w-4 text-amber-500" />;
    if (action.includes("DPDPA") || action.includes("CONSENT")) return <ShieldCheck className="h-4 w-4 text-purple-500" />;
    if (action.includes("STATUS")) return <Activity className="h-4 w-4 text-indigo-500" />;
    return <FileText className="h-4 w-4 text-slate-400" />;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-semibold text-primary uppercase tracking-[0.2em]">DPDPA Sovereign Ledger</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight tracking-tight text-slate-900 dark:text-white lowercase ">
          /activity.logs
        </h2>
        <p className="text-sm font-medium text-slate-500">
          Immutable audit trail for all operational and compliance events in <span className="text-slate-900 dark:text-white underline decoration-primary/30 underline-offset-4">{clinicName}</span>.
        </p>
      </div>

      <div className="relative pl-6 sm:pl-8 border-l-2 border-border/50 dark:border-white/10 space-y-8 mt-10">
        {logs.length === 0 ? (
           <div className="text-sm font-semibold text-slate-400">No activity recorded yet in this node.</div>
        ) : (
           logs.map((log) => (
             <div key={log.id} className="relative group">
               {/* Timeline Dot */}
               <div className="absolute -left-[35px] sm:-left-[43px] p-1.5 bg-white dark:bg-slate-950 rounded-full border-2 border-border/50 dark:border-white/10 group-hover:border-primary transition-colors">
                 {getActionIcon(log.action)}
               </div>

               <div className="bg-white dark:bg-white/5 rounded-xl p-5 sm:p-6 shadow-sm border border-border/50 dark:border-white/10 group-hover:shadow-md group-hover:ring-1 group-hover:ring-primary/20 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                     <div className="flex items-center gap-2">
                         <span className="text-xs font-semibold tracking-tight uppercase tracking-widest text-slate-900 dark:text-white">{log.action.replace(/_/g, ' ')}</span>
                         {log.lead && (
                             <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
                               Target: {log.lead.name}
                             </span>
                         )}
                     </div>
                     <span className="text-[10px] font-semibold text-slate-400 tracking-tighter uppercase">
                         {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                     </span>
                  </div>

                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                     {log.description || "System action processed seamlessly."}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                     <User className="h-3 w-3" />
                     {log.user ? log.user.name || log.user.email : "Automated System Node"}
                  </div>
               </div>
             </div>
           ))
        )}
      </div>
    </div>
  );
}
