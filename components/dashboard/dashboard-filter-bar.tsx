"use client";

import * as React from "react";
import { addDays, format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown, Filter, X, Calendar as CalendarIcon2 } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDashboardStore } from "@/lib/store/use-dashboard-store";
import { useRouter, useSearchParams } from "next/navigation";

export function DashboardFilterBar() {
  const { 
    dateRange, 
    setDateRange, 
    branchId, 
    setBranchId, 
    category, 
    setCategory,
    ownerId,
    setOwnerId,
    resetFilters 
  } = useDashboardStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync state to URL
  const updateUrl = React.useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    router.push(`?${newParams.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const [open, setOpen] = React.useState(false);
  const [localRange, setLocalRange] = React.useState<{ from: Date | undefined; to?: Date | undefined }>(dateRange);

  React.useEffect(() => {
    setLocalRange(dateRange);
  }, [dateRange]);

  // Wrap store actions to also update URL
  const applyDateRange = () => {
    setOpen(false);
    setDateRange(localRange);
    updateUrl({
        from: localRange?.from ? localRange.from.toISOString() : null,
        to: localRange?.to ? localRange.to.toISOString() : null
    });
  };

  const handleSetCategory = (cat: string | null) => {
      setCategory(cat);
      updateUrl({ category: cat });
  };

  const presets = [
    { label: "Today", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
    { label: "Yesterday", getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
    { label: "Last 7 Days", getValue: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
    { label: "This Month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
    { label: "Custom Range", getValue: () => ({ from: undefined, to: undefined }) },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-sm relative z-30">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger>
            <Button
              variant={"outline"}
              className={cn(
                "h-11 justify-start text-left font-bold rounded-2xl border-slate-200/60 dark:border-white/10 bg-white dark:bg-slate-900 px-4 min-w-[260px]",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-3xl border-slate-200/60 dark:border-white/10 shadow-2xl z-[100] bg-white dark:bg-slate-950" align="start">
            <div className="flex flex-col md:flex-row">
              <div className="p-4 border-r border-slate-100 dark:border-white/5 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Presets</span>
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    className="justify-start font-bold text-xs rounded-xl h-9 hover:bg-white dark:hover:bg-white/5 cursor-pointer"
                    onClick={() => setLocalRange(preset.getValue())}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="p-3 flex flex-col items-center">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={localRange?.from}
                  selected={localRange}
                  onSelect={(range) => setLocalRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  className="rounded-2xl cursor-pointer"
                />
                <div className="w-full flex items-center justify-end border-t border-slate-100 pt-3 mt-3 px-2 gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="rounded-xl font-bold text-xs">Cancel</Button>
                    <Button onClick={applyDateRange} size="sm" className="rounded-xl px-6 font-black uppercase tracking-widest text-[10px]">
                        Go &rarr;
                    </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />

      <div className="flex items-center gap-3 flex-wrap">
        {/* Category Select (Mocked options for now) */}
        <select 
          value={category || ""} 
          onChange={(e) => handleSetCategory(e.target.value || null)}
          className="h-11 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <option value="">All Categories</option>
          <option value="MATERNITY">Maternity</option>
          <option value="INFERTILITY">Infertility (IVF)</option>
          <option value="GYNECOLOGY">Gynecology</option>
          <option value="PEDIATRICS">Pediatrics</option>
        </select>

        {/* Action Button to clear */}
        {(dateRange.from || category || branchId) && (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="h-8 rounded-full text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 px-4"
            >
                <X className="h-3 w-3 mr-1" /> Reset
            </Button>
        )}
      </div>
    </div>
  );
}
