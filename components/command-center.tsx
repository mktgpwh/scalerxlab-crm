"use client";

import * as React from "react";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Search,
  Zap,
  LayoutDashboard,
  Users,
  Command as CommandIcon,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";

export function CommandCenter() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-400 hover:text-slate-600 transition-all text-xs font-bold uppercase tracking-widest group"
      >
        <Search className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
        <span className="hidden md:inline">Command</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-2">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Global Node</span>
                <span className="text-xs font-bold text-slate-500">Autonomous Execution Portal</span>
            </div>
        </div>
        <CommandInput placeholder="Type a command or search leads..." className="h-14 font-medium" />
        <CommandList className="p-2">
          <CommandEmpty className="py-12 text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-white/5 mx-auto flex items-center justify-center">
                <Search className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No intelligence found.</p>
          </CommandEmpty>
          
          <CommandGroup heading="Navigation Nodes">
            <CommandItem onSelect={() => runCommand(() => router.push(`/leads`))} className="rounded-xl h-12 gap-3 cursor-pointer">
              <Users className="mr-2 h-4 w-4" />
              <span className="font-bold tracking-tight">Intelligence Hub (Leads)</span>
              <CommandShortcut className="text-[10px] font-black opacity-40">G L</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push(`/pipeline`))} className="rounded-xl h-12 gap-3 cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span className="font-bold tracking-tight">Capture Pipeline (Sales)</span>
              <CommandShortcut className="text-[10px] font-black opacity-40">G P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push(`/integrations`))} className="rounded-xl h-12 gap-3 cursor-pointer">
              <CommandIcon className="mr-2 h-4 w-4" />
              <span className="font-bold tracking-tight">Integrations Hub</span>
              <CommandShortcut className="text-[10px] font-black opacity-40">G I</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator className="my-2 bg-slate-100 dark:bg-white/5" />
          
          <CommandGroup heading="System Controls">
            <CommandItem onSelect={() => runCommand(() => router.push(`/settings`))} className="rounded-xl h-12 gap-3 cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span className="font-bold tracking-tight">Configuration (Settings)</span>
              <CommandShortcut className="text-[10px] font-black opacity-40">G S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
