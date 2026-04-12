"use client";

import React, { useState } from "react";
import { 
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  CheckCheck,
  Bot,
  User,
  Zap,
  ShieldAlert,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { IntegrationIcon } from "@/components/ui/integration-icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { updateAiStatus, sendMessage, generateDraftAction } from "./actions";
import { toast } from "sonner";

// Enhanced Dummy Data for HITL Logic
const CONTACTS = [
  { id: 1, name: "Karan Johar", platform: "whatsapp", message: "Can you share the pricing sheet?", time: "2m ago", unread: 2, isOnline: true, aiStatus: 'AGENTX_ACTIVE', isEscalated: false },
  { id: 2, name: "Vikram Singh", platform: "instagram", message: "URGENT: I'm having severe pain after the procedure.", time: "5m ago", unread: 1, isOnline: false, aiStatus: 'HUMAN_OVERRIDE', isEscalated: true },
  { id: 3, name: "Anjali Desai", platform: "facebook", message: "Is the Delhi branch open today?", time: "3h ago", unread: 0, isOnline: true, aiStatus: 'AGENTX_ACTIVE', isEscalated: false },
  { id: 4, name: "Rohit Sharma", platform: "whatsapp", message: "Thanks, I will review it.", time: "1d ago", unread: 0, isOnline: false, aiStatus: 'HUMAN_OVERRIDE', isEscalated: false },
  { id: 5, name: "Priya Patel", platform: "instagram", message: "Sent an attachment.", time: "1d ago", unread: 0, isOnline: false, aiStatus: 'AGENTX_ACTIVE', isEscalated: false },
];

export default function SharedInboxPage() {
  const [activeChatId, setActiveChatId] = useState<number>(1);
  const [activePlatformFilter, setActivePlatformFilter] = useState<string>("all");
  const [activeAiFilter, setActiveAiFilter] = useState<string>("all");
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);

  const activeChat = CONTACTS.find(c => c.id === activeChatId);

  const handleGenerateDraft = async () => {
      setIsDrafting(true);
      const result = await generateDraftAction(activeChatId.toString());
      setIsDrafting(false);

      if (result.success && result.draft) {
          setMessageInput(result.draft);
          if (result.isEmergency) {
              toast.error("Emergency Detected!", {
                  description: "AgentX flagged this chat for immediate clinical attention."
              });
          } else {
              toast.success("AI Draft Ready", { description: "You can now edit and send the response." });
          }
      } else {
          toast.error("AI Draft Failed", { description: result.error || "Could not reach AgentX." });
      }
  };

  const handleUpdateStatus = async (status: 'AGENTX_ACTIVE' | 'HUMAN_OVERRIDE') => {
      setLoading(true);
      // In a real app, this would use activeChat.id (string)
      const result = await updateAiStatus(activeChatId.toString(), status);
      setLoading(false);
      if (result.success) {
          toast.success(`Handoff Successful: Switched to ${status === 'AGENTX_ACTIVE' ? 'AgentX' : 'Manual'}`);
      }
  };

  const handleSendMessage = async () => {
      if (!messageInput.trim()) return;
      setLoading(true);
      const result = await sendMessage(activeChatId.toString(), messageInput);
      setLoading(false);
      if (result.success) {
          setMessageInput("");
          toast.success("Message Sent & AI Paused");
      }
  };

  const filteredContacts = CONTACTS.filter(c => {
      const matchPlatform = activePlatformFilter === 'all' || c.platform === activePlatformFilter;
      const matchAi = activeAiFilter === 'all' || 
                       (activeAiFilter === 'ai' && c.aiStatus === 'AGENTX_ACTIVE') || 
                       (activeAiFilter === 'manual' && c.aiStatus === 'HUMAN_OVERRIDE') || 
                       (activeAiFilter === 'escalated' && c.isEscalated);
      return matchPlatform && matchAi;
  });

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col min-w-0">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-2">
            <IntegrationIcon slug="whatsapp" size={24} />
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white lowercase italic">
            /shared.inbox
            </h2>
            <Badge variant="outline" className="ml-2 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-none ring-1 ring-emerald-500/20">
            Omnichannel HITL Active
            </Badge>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900/40 rounded-[3rem] border border-slate-200/60 dark:border-white/5 shadow-2xl flex overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
        
        {/* LEFT PANE - THREADS */}
        <div className="w-full md:w-96 border-r border-slate-200/60 dark:border-white/5 flex flex-col shrink-0 bg-slate-50/50 dark:bg-black/20">
            {/* Thread Filters */}
            <div className="p-6 space-y-4 shrink-0 border-b border-slate-200/60 dark:border-white/5">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl overflow-x-auto">
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
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
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

            <ScrollArea className="flex-1">
                <div className="flex flex-col p-3 gap-1">
                    {filteredContacts.map(contact => (
                        <div 
                            key={contact.id}
                            onClick={() => setActiveChatId(contact.id)}
                            className={cn(
                                "group p-4 rounded-[2rem] cursor-pointer transition-all border relative",
                                activeChatId === contact.id 
                                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none z-10" 
                                : "border-transparent hover:bg-white/40 dark:hover:bg-white/5"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400">
                                            {contact.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        {contact.isOnline && (
                                            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white">{contact.name}</h4>
                                            {contact.isEscalated && (
                                                <Badge className="bg-rose-500 hover:bg-rose-600 text-[8px] h-4 font-black px-1.5 border-none animate-pulse">
                                                    Escalated
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <IntegrationIcon slug={contact.platform} size={12} className="opacity-60" />
                                            {contact.aiStatus === 'AGENTX_ACTIVE' ? (
                                                <div className="flex items-center gap-1">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                    </span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">AgentX Flow</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <User className="h-2.5 w-2.5 text-slate-400" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Manual Override</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400">{contact.time}</span>
                            </div>
                            <p className="text-xs font-medium text-slate-500 line-clamp-1 pl-1">
                                {contact.message}
                            </p>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>

        {/* RIGHT PANE - CHAT WINDOW */}
        <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {/* Chat Header with Handoff Controls */}
            <div className="h-24 border-b border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400">
                        {activeChat?.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white leading-none mb-1.5">{activeChat?.name}</h3>
                        <div className="flex items-center gap-2">
                            <IntegrationIcon slug={activeChat?.platform || ''} size={14} />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{activeChat?.platform} Node Connected</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl ring-1 ring-slate-200 dark:ring-white/10">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdateStatus('AGENTX_ACTIVE')}
                            disabled={loading}
                            className={cn(
                                "h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                                activeChat?.aiStatus === 'AGENTX_ACTIVE' 
                                ? "bg-white dark:bg-slate-800 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-white/10" 
                                : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <Bot className={cn("h-3.5 w-3.5", activeChat?.aiStatus === 'AGENTX_ACTIVE' && "animate-bounce")} />
                            AgentX Auto
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUpdateStatus('HUMAN_OVERRIDE')}
                            disabled={loading}
                            className={cn(
                                "h-10 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all",
                                activeChat?.aiStatus === 'HUMAN_OVERRIDE' || activeChat?.isEscalated
                                ? "bg-white dark:bg-slate-800 text-rose-500 shadow-sm ring-1 ring-slate-200 dark:ring-white/10" 
                                : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <User className="h-3.5 w-3.5" />
                            Manual Override
                        </Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl text-slate-400 hover:bg-slate-100">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Escalation Alert */}
                    {activeChat?.isEscalated && (
                        <div className="flex justify-center">
                            <div className="bg-rose-50/80 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 px-6 py-4 rounded-[1.5rem] flex items-center gap-4 max-w-lg shadow-xl shadow-rose-500/5">
                                <div className="h-10 w-10 rounded-xl bg-rose-500 flex items-center justify-center shrink-0">
                                    <ShieldAlert className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Emergency Escalation Active</h4>
                                    <p className="text-xs font-medium text-rose-500/80 leading-tight">Patient detected severe clinical symptoms. AI has autonomously entered Manual Override mode.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Received */}
                    <div className="flex justify-start">
                        <div className="max-w-[70%] bg-white dark:bg-slate-900 p-6 rounded-[2rem] rounded-tl-sm shadow-sm ring-1 ring-slate-200/50 dark:ring-white/5">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                                {activeChat?.message}
                            </p>
                            <span className="text-[9px] font-bold text-slate-400 mt-3 block">{activeChat?.time}</span>
                        </div>
                    </div>

                    {/* AI Info Bar */}
                    <div className="flex justify-center opacity-40">
                        <div className="h-px w-20 bg-slate-200" />
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-400 px-4">AgentX Synchronized</span>
                        <div className="h-px w-20 bg-slate-200" />
                    </div>
                </div>
            </ScrollArea>

            {/* Chat Input / Composer */}
            <div className="p-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/5 shrink-0">
                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Suggestion Bar */}
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleGenerateDraft}
                            disabled={isDrafting || loading}
                            className={cn(
                                "bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 h-9 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 transition-all",
                                isDrafting && "animate-pulse"
                            )}
                        >
                            {isDrafting ? (
                                <>
                                    <Sparkles className="h-3 w-3 animate-spin" />
                                    AgentX Thinking...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3 w-3" />
                                    AI Draft Suggestion
                                </>
                            )}
                        </Button>
                        <span className="text-[9px] font-medium text-slate-400 italic">Let AgentX prepare a structured clinical response</span>
                    </div>

                    <div className="flex items-end gap-3 bg-slate-50 dark:bg-black/20 p-3 rounded-[2rem] border border-slate-200/60 dark:border-white/10 ring-1 ring-slate-100 dark:ring-white/5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 shrink-0">
                            <Smile className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400 shrink-0">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        
                        <Input 
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type a clinical response (Pauses AgentX automatically)..." 
                            className="border-none bg-transparent shadow-none focus-visible:ring-0 px-2 h-auto py-3 text-sm font-medium placeholder:text-slate-400"
                        />
                        
                        <Button 
                            onClick={handleSendMessage}
                            disabled={loading || !messageInput.trim()}
                            className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-black dark:bg-primary text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-slate-200 dark:shadow-primary/10 shrink-0"
                        >
                            <Send className="h-4 w-4" />
                            Send
                        </Button>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
}
