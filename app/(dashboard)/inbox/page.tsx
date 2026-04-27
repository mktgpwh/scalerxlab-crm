"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Bot,
  User,
  ShieldAlert,
  Sparkles,
  Send,
  Smile,
} from "lucide-react";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { updateAiStatus, sendMessage, generateDraftAction, fetchInboxThreads } from "./actions";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";

export default function SharedInboxPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [activeAiFilter, setActiveAiFilter] = useState<string>("all");
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const supabase = createClient();
  const normalAudio = useRef<HTMLAudioElement | null>(null);
  const emergencyAudio = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 🎵 [PHASE 4]: Clinical Audio Sentinel
  useEffect(() => {
    normalAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
    // ScalerX Medical Chime
    emergencyAudio.current = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3');
  }, []);

  const loadThreads = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    const result = await fetchInboxThreads();
    if (result.success && result.threads) {
      setThreads(result.threads);
      if (result.threads.length > 0 && !activeThreadId) {
        setActiveThreadId(result.threads[0].id);
      }
    }
    setLoading(false);
    setIsInitialLoad(false);
  }, [activeThreadId]);

  // Initial Load
  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // [PHASE 2]: UX - Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [threads, activeThreadId]);

  // [PHASE 3]: Zero-Latency Real-time
  const loadThreadsRef = useRef(loadThreads);
  useEffect(() => {
    loadThreadsRef.current = loadThreads;
  }, [loadThreads]);

  useEffect(() => {
    const channel = supabase
      .channel('inbox_realtime_sentinel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload: any) => {
          console.log("📥 REALTIME_SYNC_TRIGGERED", payload);
          loadThreadsRef.current(true); // Optimized silent refresh

          // 🚨 [PHASE 4]: Keyword Sentinel
          const text = (payload.new.description || "").toLowerCase();
          const isEmergency = /pain|bleeding|emergency|urgency|severe|help/i.test(text);

          if (isEmergency) {
              emergencyAudio.current?.play().catch(() => {});
              toast.error("CLINICAL EMERGENCY DETECTED!", { 
                  description: payload.new.description,
                  duration: 8000
              });
          } else if (payload.new.action.includes('RECEIVED')) {
              normalAudio.current?.play().catch(() => {});
          }
        }
      )
      .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'leads' },
          () => loadThreadsRef.current(true)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]); // ONLY depend on the stable supabase client

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleGenerateDraft = async () => {
      if (!activeThreadId) return;
      setIsDrafting(true);
      const result = await generateDraftAction(activeThreadId);
      setIsDrafting(false);

      if (result.success && result.draft) {
          setMessageInput(result.draft);
          if (result.isEmergency) {
              toast.error("Emergency Detected!", { description: "AgentX flagged this chat for high-priority clinical attention." });
          } else {
              toast.success("AI Draft Synthesized");
          }
      } else {
          toast.error("Draft Generation Failed", { description: result.error || "AgentX could not synthesize a reply." });
      }
  };

  const handleUpdateStatus = async (status: 'AGENTX_ACTIVE' | 'HUMAN_OVERRIDE') => {
      if (!activeThreadId) return;
      setLoading(true);
      const result = await updateAiStatus(activeThreadId, status);
      setLoading(false);
      if (result.success) {
          toast.success(`Switched to ${status === 'AGENTX_ACTIVE' ? 'AgentX Auto' : 'Manual Override'}`);
          loadThreads(true);
      }
  };

  const handleSendMessage = async () => {
      if (!messageInput.trim() || !activeThreadId) return;
      
      const originalInput = messageInput;
      setMessageInput("");

      // 🚀 [PHASE 3]: OPTIMISTIC UI - Instant Message Injection
      const tempId = `optimistic-${Math.random()}`;
      setThreads(prev => prev.map(t => {
          if (t.id === activeThreadId) {
              return {
                  ...t,
                  history: [{
                      id: tempId,
                      description: originalInput,
                      action: 'CLINIC_MESSAGE_SENT',
                      createdAt: new Date().toISOString()
                  }, ...t.history]
              };
          }
          return t;
      }));

      const result = await sendMessage(activeThreadId, originalInput);
      
      if (!result.success) {
          toast.error("Delivery Failed", { description: result.error });
          loadThreads(true); // Rollback via refresh
      } else {
          toast.success("Message Delivered", { description: "Clinically dispatched to WhatsApp." });
          loadThreads(true);
      }
  };

  const filteredThreads = threads.filter(t => {
      if (activeAiFilter === 'all') return true;
      if (activeAiFilter === 'ai') return t.aiStatus === 'AGENTX_ACTIVE';
      if (activeAiFilter === 'manual') return t.aiStatus === 'HUMAN_OVERRIDE';
      if (activeAiFilter === 'escalated') return t.isEscalated;
      return true;
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col min-w-0 pb-4">
      <style jsx global>{`
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .animate-red-pulse {
          animation: pulse-red 2s infinite;
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.3) !important;
        }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 shrink-0 px-2">
        <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight tracking-tighter text-slate-900 dark:text-white lowercase ">
            /shared.inbox
            </h2>
            <Badge variant="outline" className="ml-2 text-[9px] font-semibold tracking-tight uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-none ring-1 ring-emerald-500/20">
            Omnichannel Real-time
            </Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900/40 rounded-xl border border-border/50 dark:border-white/5 shadow-2xl flex overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
        
        {/* LEFT PANE - THREADS */}
        <div className="w-full md:w-96 border-r border-border/50 dark:border-white/5 flex flex-col shrink-0 bg-slate-50/50 dark:bg-black/20 min-h-0">
            <div className="p-6 space-y-4 shrink-0 border-b border-border/50 dark:border-white/5">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-xl overflow-x-auto no-scrollbar">
                    {[
                        { id: 'all', label: 'All' },
                        { id: 'ai', label: 'AgentX', icon: Bot },
                        { id: 'manual', label: 'Manual', icon: User },
                        { id: 'escalated', label: 'Escalated', icon: ShieldAlert, color: 'text-rose-500' }
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveAiFilter(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-semibold tracking-tight uppercase tracking-widest transition-all whitespace-nowrap",
                                activeAiFilter === tab.id 
                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-white/10" 
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                            )}
                        >
                            {tab.icon && <tab.icon className={cn("h-3 w-3", tab.color)} />}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 h-full">
                <div className="flex flex-col p-3 gap-1">
                    {filteredThreads.map(thread => (
                        <div 
                            key={thread.id}
                            onClick={() => setActiveThreadId(thread.id)}
                            className={cn(
                                "group p-4 rounded-xl cursor-pointer transition-all border relative",
                                activeThreadId === thread.id 
                                ? "bg-white dark:bg-slate-900 border-border/50 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none z-10" 
                                : "border-transparent hover:bg-white/40 dark:hover:bg-white/5",
                                // 🚨 [PHASE 4]: Visual Sentinel Effect
                                thread.isEscalated && "animate-red-pulse ring-2 ring-rose-500"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold tracking-tight text-slate-400">
                                            {thread.name.slice(0, 2).toUpperCase()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">{thread.name}</h4>
                                            {thread.isAd && (
                                                <Badge className="bg-emerald-500 text-[8px] h-4 font-semibold tracking-tight px-1.5 border-none animate-pulse">
                                                    AD
                                                </Badge>
                                            )}
                                            {thread.isEscalated && (
                                                <Badge className="bg-rose-500 text-[8px] h-4 font-semibold tracking-tight px-1.5 border-none">
                                                    Escalated
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <IntegrationIcon slug={thread.platform} size={12} className="opacity-60" />
                                            {thread.aiStatus === 'AGENTX_ACTIVE' ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                    </span>
                                                    <span className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-primary/60">AgentX</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <User className="h-2.5 w-2.5 text-slate-400" />
                                                    <span className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-slate-400">Manual</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[9px] font-semibold text-slate-400 uppercase">
                                    {formatDistanceToNow(new Date(thread.lastTime), { addSuffix: false })}
                                </span>
                            </div>
                            <p className="text-xs font-medium text-slate-500 line-clamp-1 pl-1 ">
                                "{thread.lastMessage}"
                            </p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        {/* RIGHT PANE - [PHASE 2]: FIXED CHAT WINDOW SECTION */}
        <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {activeThread ? (
                <div className="flex flex-col h-full overflow-hidden">
                    {/* CHAT HEADER */}
                    <div className="h-24 border-b border-border/50 dark:border-white/5 bg-background/80 backdrop-blur-md flex items-center justify-between px-10 shrink-0 z-10 transition-all">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold tracking-tight text-slate-400">
                                {activeThread.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white leading-none mb-1.5">{activeThread.name}</h3>
                                <div className="flex items-center gap-2">
                                    <IntegrationIcon slug={activeThread.platform} size={14} />
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.2em]">{activeThread.platform.toUpperCase()} Node Live</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-xl ring-1 ring-slate-200 dark:ring-white/10">
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleUpdateStatus('AGENTX_ACTIVE')}
                                    disabled={loading}
                                    className={cn(
                                        "h-10 rounded-xl px-4 text-[10px] font-semibold tracking-tight uppercase tracking-widest flex items-center gap-2 transition-all",
                                        activeThread.aiStatus === 'AGENTX_ACTIVE' 
                                        ? "bg-white dark:bg-slate-800 text-primary shadow-sm" 
                                        : "text-slate-500 hover:text-slate-900"
                                    )}
                                >
                                    <Bot className="h-3.5 w-3.5" />
                                    AgentX Auto
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleUpdateStatus('HUMAN_OVERRIDE')}
                                    disabled={loading}
                                    className={cn(
                                        "h-10 rounded-xl px-4 text-[10px] font-semibold tracking-tight uppercase tracking-widest flex items-center gap-2 transition-all",
                                        activeThread.aiStatus === 'HUMAN_OVERRIDE' 
                                        ? "bg-white dark:bg-slate-800 text-rose-500 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-900"
                                    )}
                                >
                                    <User className="h-3.5 w-3.5" />
                                    Manual Override
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* [PHASE 2]: MESSAGE HISTORY - SCROLLABLE & STRETCHABLE */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth bg-transparent">
                        <div className="max-w-4xl mx-auto space-y-6 flex flex-col pt-4">
                            {activeThread.history?.slice().reverse().map((log: any) => (
                                <div key={log.id} className={cn("flex", (log.action.includes('SENT') || log.action.includes('REPLY')) ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "max-w-[80%] p-5 rounded-xl shadow-sm",
                                        (log.action.includes('SENT') || log.action.includes('REPLY')) 
                                        ? "bg-primary text-white md:rounded-tr-none" 
                                        : "bg-muted/50 text-foreground md:rounded-tl-none border border-border/50"
                                    )}>
                                        <p className="text-sm font-medium leading-relaxed">{log.description}</p>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-[8px] font-semibold uppercase tracking-widest opacity-60">
                                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                                            </span>
                                            {log.action.includes('REPLY') && <Bot className="h-3 w-3 opacity-60 ml-2" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* [PHASE 2]: REPLY COMPOSER - STICKY AT BOTTOM */}
                    <div className="p-8 pb-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-border/50 dark:border-white/5 shrink-0 z-20">
                        <div className="max-w-4xl mx-auto space-y-4">
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleGenerateDraft}
                                    disabled={isDrafting || loading}
                                    className={cn(
                                        "bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 h-9 rounded-xl text-[9px] font-semibold tracking-tight uppercase tracking-widest gap-2 transition-all",
                                        isDrafting && "animate-pulse"
                                    )}
                                >
                                    <Sparkles className={cn("h-3 w-3", isDrafting && "animate-spin")} />
                                    {isDrafting ? "Synthesizing..." : "Suggest AI Draft"}
                                </Button>
                                {activeThread.isEscalated && (
                                    <Badge className="bg-rose-500/10 text-rose-500 border-none text-[9px] font-semibold tracking-tight uppercase tracking-widest animate-pulse">
                                        Clinical Alert High
                                    </Badge>
                                )}
                            </div>

                            <div className="flex items-end gap-3 bg-white dark:bg-black/40 p-3 rounded-xl border border-border/50 dark:border-white/10 ring-1 ring-slate-100 dark:ring-white/5 shadow-xl transition-all">
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 shrink-0 hover:bg-slate-200/50">
                                    <Smile className="h-5 w-5" />
                                </Button>
                                <Input 
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a clinical response (AgentX paused on send)..." 
                                    className="border-none bg-transparent shadow-none focus-visible:ring-0 px-2 h-auto py-3 text-sm font-medium"
                                />
                                <Button 
                                    onClick={handleSendMessage}
                                    disabled={loading || !messageInput.trim()}
                                    className="h-12 px-6 rounded-xl bg-slate-900 hover:bg-black dark:bg-primary text-white font-semibold tracking-tight uppercase tracking-widest text-[10px] gap-2 shadow-lg shrink-0 transition-transform active:scale-95"
                                >
                                    <Send className="h-4 w-4" />
                                    Send Reply
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                    <Bot className="h-16 w-16 mb-6 animate-pulse" />
                    <h3 className="text-xl font-semibold tracking-tight  tracking-tighter">/awaiting_selection</h3>
                    <p className="text-xs font-medium uppercase tracking-[0.4em] mt-2 text-slate-400">Select a clinical thread to begin sync</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
