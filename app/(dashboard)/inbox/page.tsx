"use client";

import React, { useState } from "react";
import { 
  Search,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  CheckCheck
} from "lucide-react";
import { WhatsAppIcon, InstagramIcon, FacebookIcon } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Dummy Data mapped to Omnichannel Platforms
const CONTACTS = [
  { id: 1, name: "Karan Johar", platform: "whatsapp", message: "Can you share the pricing sheet?", time: "12m ago", unread: 2, isOnline: true },
  { id: 2, name: "Vikram Singh", platform: "instagram", message: "Loved the recent post. How do I signup?", time: "1h ago", unread: 1, isOnline: false },
  { id: 3, name: "Anjali Desai", platform: "facebook", message: "Is the Delhi branch open today?", time: "3h ago", unread: 0, isOnline: true },
  { id: 4, name: "Rohit Sharma", platform: "whatsapp", message: "Thanks, I will review it.", time: "1d ago", unread: 0, isOnline: false },
  { id: 5, name: "Priya Patel", platform: "instagram", message: "Sent an attachment.", time: "1d ago", unread: 0, isOnline: false },
];

export default function SharedInboxPage() {
  const [activeChat, setActiveChat] = useState<number>(1);
  const [activePlatformFilter, setActivePlatformFilter] = useState<string>("all");

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "whatsapp": return <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />;
      case "instagram": return <InstagramIcon className="h-3.5 w-3.5 text-[#E1306C]" />;
      case "facebook": return <FacebookIcon className="h-3.5 w-3.5 text-[#1877F2]" />;
      default: return <WhatsAppIcon className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  const filteredContacts = CONTACTS.filter(c => activePlatformFilter === 'all' || c.platform === activePlatformFilter);
  const activeChatData = CONTACTS.find(c => c.id === activeChat);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col min-w-0">
      <div className="flex items-center gap-2 mb-6 shrink-0">
        <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
        <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white lowercase italic">
          /shared.inbox
        </h2>
        <Badge variant="outline" className="ml-2 text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border-none ring-1 ring-emerald-500/20">
          Omnichannel Active
        </Badge>
      </div>

      <div className="flex-1 min-h-0 bg-white dark:bg-slate-900/40 rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-2xl shadow-slate-200/20 flex overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
        
        {/* Left Pane - Contact List */}
        <div className="w-full md:w-80 border-r border-slate-200/60 dark:border-white/5 flex flex-col shrink-0 bg-slate-50/50 dark:bg-black/20">
           <div className="p-4 space-y-4 shrink-0">
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <Input 
                   placeholder="Search conversations..." 
                   className="pl-9 h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200/60 dark:border-white/10 text-xs font-bold shadow-sm"
                 />
              </div>
              
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar pb-1">
                 {['all', 'whatsapp', 'instagram', 'facebook'].map(filters => (
                    <button 
                       key={filters}
                       onClick={() => setActivePlatformFilter(filters)}
                       className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                         activePlatformFilter === filters 
                         ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20 dark:bg-white dark:text-slate-900' 
                         : 'bg-white dark:bg-slate-900 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200/60 dark:border-white/10'
                       }`}
                    >
                       {filters}
                    </button>
                 ))}
              </div>
           </div>

           <ScrollArea className="flex-1">
              <div className="flex flex-col gap-1 p-2">
                 {filteredContacts.map(contact => (
                    <div 
                      key={contact.id}
                      onClick={() => setActiveChat(contact.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        activeChat === contact.id 
                        ? 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-white/10 shadow-sm ring-1 ring-slate-100 dark:ring-white/5' 
                        : 'border-transparent hover:bg-slate-100/50 dark:hover:bg-white/5'
                      }`}
                    >
                       <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                             <div className="relative">
                                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-300">
                                   {contact.name.slice(0, 2).toUpperCase()}
                                </div>
                                {contact.isOnline && (
                                   <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                                )}
                             </div>
                             <div>
                                <h4 className="text-xs font-black text-slate-900 dark:text-white capitalize">{contact.name}</h4>
                                <div className="flex items-center gap-1 mt-0.5">
                                   {getPlatformIcon(contact.platform)}
                                   <span className="text-[9px] font-bold text-slate-400 capitalize">{contact.platform}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                             <span className="text-[9px] font-bold text-slate-400">{contact.time}</span>
                             {contact.unread > 0 && (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white">
                                   {contact.unread}
                                </span>
                             )}
                          </div>
                       </div>
                       <p className="text-[11px] font-medium text-slate-500 truncate pl-10">
                          {contact.message}
                       </p>
                    </div>
                 ))}
              </div>
           </ScrollArea>
        </div>

        {/* Right Pane - Chat Window */}
        <div className="flex-1 flex flex-col min-w-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
           {/* Chat Header */}
           <div className="h-16 border-b border-slate-200/60 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-black text-slate-600 dark:text-slate-300">
                    {activeChatData?.name.slice(0, 2).toUpperCase()}
                 </div>
                 <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">{activeChatData?.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                       {getPlatformIcon(activeChatData?.platform || '')}
                       <span className="text-[10px] font-bold text-slate-500 capitalize tracking-widest">{activeChatData?.platform} Node</span>
                    </div>
                 </div>
              </div>
              
              <div className="flex items-center gap-2">
                 <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border-none">
                    High Intent
                 </Badge>
                 <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-900">
                    <MoreVertical className="h-4 w-4" />
                 </Button>
              </div>
           </div>

           {/* Chat Messages */}
           <ScrollArea className="flex-1 p-6">
              <div className="space-y-6">
                 {/* Received */}
                 <div className="flex justify-start">
                    <div className="max-w-[75%] bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-sm shadow-sm ring-1 ring-slate-200/50 dark:ring-white/5">
                       <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                          {activeChatData?.message}
                       </p>
                       <span className="text-[9px] font-bold text-slate-400 mt-2 block">{activeChatData?.time}</span>
                    </div>
                 </div>

                 {/* System Alert / Agent Action */}
                 <div className="flex justify-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full border border-slate-200/50 dark:border-white/5">
                       AI generated smart-draft available
                    </span>
                 </div>

                 {/* Sent (If unread=0, just generating a dummy sent message) */}
                 {activeChatData?.unread === 0 && (
                   <div className="flex justify-end">
                      <div className="max-w-[75%] bg-emerald-500 text-white p-4 rounded-2xl rounded-tr-sm shadow-md shadow-emerald-500/20">
                         <p className="text-xs font-medium leading-relaxed">
                            Absolutely! Our team in {activeChatData.id === 3 ? "Delhi" : "Mumbai"} will assist you shortly.
                         </p>
                         <div className="flex items-center justify-end gap-1 mt-2">
                            <span className="text-[9px] font-bold text-emerald-100">Just now</span>
                            <CheckCheck className="h-3 w-3 text-emerald-100" />
                         </div>
                      </div>
                   </div>
                 )}
              </div>
           </ScrollArea>

           {/* Chat Input */}
           <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/60 dark:border-white/5 shrink-0">
              <div className="flex items-end gap-2 bg-slate-50 dark:bg-black/20 p-2 rounded-2xl border border-slate-200/60 dark:border-white/10 ring-1 ring-slate-100 dark:ring-white/5 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 shrink-0">
                    <Smile className="h-4 w-4" />
                 </Button>
                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400 shrink-0">
                    <Paperclip className="h-4 w-4" />
                 </Button>
                 
                 <Input 
                    placeholder="Type your message or use AI drafted responses..." 
                    className="border-none bg-transparent shadow-none focus-visible:ring-0 px-2 h-auto py-2 text-xs font-medium"
                 />
                 
                 <Button size="icon" className="h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 shrink-0">
                    <Send className="h-4 w-4 -ml-0.5" />
                 </Button>
              </div>
           </div>

        </div>

      </div>
    </div>
  );
}
