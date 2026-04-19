"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    BrainCircuit, 
    Sparkles, 
    Send, 
    MessageSquare, 
    TrendingUp, 
    Zap, 
    Loader2, 
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Target,
    Activity,
    ShieldCheck
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { 
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function IntelligenceHubPage() {
    const [narrative, setNarrative] = useState<string | null>(null);
    const [status, setStatus] = useState<string>("MODERATE");
    const [loadingHealth, setLoadingHealth] = useState(true);
    const [isNarrativeOpen, setIsNarrativeOpen] = useState(true);
    const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai', content: string }>>([
        { role: 'ai', content: "AgentX localized. Ready for statistical matrix intersection. What business intelligence do you seek?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchHealth();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const fetchHealth = async () => {
        setLoadingHealth(true);
        try {
            const res = await fetch("/api/ai/health");
            const data = await res.json();
            setNarrative(data.narrative);
            setStatus(data.status || "MODERATE");
        } catch (err) {
            setNarrative("Matrix connection failed. Intelligence stream offline.");
        } finally {
            setLoadingHealth(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || sending) return;

        const userMsg = inputValue.trim();
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputValue("");
        setSending(true);

        try {
            const res = await fetch("/api/ai/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMsg })
            });
            const data = await res.json();
            setChatMessages(prev => [...prev, { role: 'ai', content: data.answer || "AgentX encountered a synaptic error." }]);
        } catch (err) {
            setChatMessages(prev => [...prev, { role: 'ai', content: "AgentX Matrix connection interrupted." }]);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* AI Business Pulse (Collapsible) */}
            <Collapsible
                 open={isNarrativeOpen}
                 onOpenChange={setIsNarrativeOpen}
                 className={cn(
                    "flex flex-col gap-4 transition-all duration-500",
                    isNarrativeOpen ? "flex-[6] min-h-0" : "flex-none"
                 )}
            >
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <BrainCircuit className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold tracking-tight tracking-tighter ">/intelligence.hub</h2>
                            <p className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 tracking-[0.3em] mt-0.5">Automated Clinical Intelligence Pulse</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/20 bg-emerald-500/5">
                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            <span className="text-[9px] font-semibold tracking-tight uppercase text-emerald-600 tracking-widest">Strict Zero-PII Policy Active</span>
                        </div>
                        
                        <CollapsibleTrigger>
                             <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 border border-border/50 dark:border-white/10 transition-all">
                                {isNarrativeOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                             </Button>
                        </CollapsibleTrigger>
                    </div>
                </div>

                <CollapsibleContent className="flex-1 min-h-0 overflow-hidden rounded-xl data-[state=closed]:animate-collapse-up data-[state=open]:animate-collapse-down">
                    <Card className="h-full relative overflow-hidden border-none bg-slate-900 shadow-2xl p-1 p-px bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent">
                        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                        <div className="relative h-full w-full bg-slate-950/90 rounded-[2.9rem] backdrop-blur-3xl p-10 overflow-y-auto custom-scrollbar">
                            <div className="flex items-center gap-4 mb-8">
                                <div className={cn(
                                    "h-2 w-2 rounded-full animate-pulse",
                                    status === "GOOD" && "bg-emerald-500 shadow-[0_0_10px_#10b981]",
                                    status === "MODERATE" && "bg-amber-500 shadow-[0_0_10px_#f59e0b]",
                                    status === "CRITICAL" && "bg-rose-500 shadow-[0_0_10px_#f43f5e]"
                                )} />
                                <h3 className="text-[10px] font-semibold tracking-tight uppercase tracking-[0.4em] text-indigo-400">AgentX Mission Narrative</h3>
                            </div>

                            {loadingHealth ? (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <Loader2 className="h-10 w-10 text-primary/40 animate-spin mb-4" />
                                    <p className="text-[11px] font-semibold tracking-tight uppercase tracking-[0.2em] text-slate-500 animate-pulse">Aggregating Clinical Matrix Data...</p>
                                </div>
                            ) : (
                                <div className="prose prose-invert max-w-none text-slate-200 prose-p:text-slate-200 prose-p:text-lg prose-p:leading-relaxed prose-headings:text-white prose-headings: prose-headings:tracking-tight prose-strong:text-primary prose-strong:font-semibold tracking-tight">
                                    <ReactMarkdown>
                                        {narrative || "System initialized. No metrics detected in current cycle."}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            {/* AgentX Chat Console */}
            <div className={cn(
                "min-h-0 flex flex-col gap-4 transition-all duration-500",
                isNarrativeOpen ? "flex-[4]" : "flex-1"
            )}>
                <div className="flex items-center gap-2 px-2">
                    <MessageSquare className="h-4 w-4 text-slate-400" />
                    <h3 className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 tracking-widest">AgentX Statistical Query Console</h3>
                </div>

                <Card className="flex-1 flex flex-col overflow-hidden border-none rounded-xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-white/5 shadow-sm">
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={cn(
                                "flex flex-col gap-2 max-w-[85%]",
                                msg.role === 'user' ? "ml-auto items-end" : "items-start"
                            )}>
                                <div className={cn(
                                    "px-4 py-3 rounded-xl text-sm leading-relaxed",
                                    msg.role === 'user' 
                                        ? "bg-primary text-white font-medium rounded-tr-none shadow-lg shadow-primary/10" 
                                        : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-200 rounded-tl-none ring-1 ring-slate-200 dark:ring-white/5"
                                )}>
                                    {msg.content}
                                </div>
                                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest px-1">
                                    {msg.role === 'ai' ? 'AGENTX' : 'EXECUTIVE'}
                                </span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-border/50 dark:border-white/5">
                        <div className="relative flex items-center">
                            <Input 
                                placeholder="Query global statistics, velocity, or center comparisons..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                className="h-12 pl-6 pr-14 rounded-xl border-none ring-1 ring-slate-200 dark:ring-white/10 bg-white dark:bg-slate-900 font-medium focus-visible:ring-primary/30"
                            />
                            <Button 
                                size="icon"
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || sending}
                                className="absolute right-1.5 h-9 w-9 rounded-xl shadow-lg shadow-primary/20"
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                        </div>
                        <div className="flex items-center gap-6 mt-3 px-2">
                            <div className="flex items-center gap-1.5 grayscale opacity-40">
                                <Activity className="h-3 w-3 text-primary" />
                                <span className="text-[9px] font-semibold tracking-tight uppercase tracking-widest">Real-time Data Access</span>
                            </div>
                            <div className="flex items-center gap-1.5 grayscale opacity-40">
                                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                                <span className="text-[9px] font-semibold tracking-tight uppercase tracking-widest">Aggregates Only</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
