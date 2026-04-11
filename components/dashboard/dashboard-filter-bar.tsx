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

  const presets = [
    { label: "Today", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
    { label: "Yesterday", getValue: () => ({ from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }) },
    { label: "Last 7 Days", getValue: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
    { label: "This Month", getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-[2rem] border border-slate-200/60 dark:border-white/5 shadow-sm relative z-30">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <Popover>
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
          <PopoverContent className="w-auto p-0 rounded-3xl border-slate-200/60 shadow-2xl z-[100]" align="start">
            <div className="flex flex-col md:flex-row">
              <div className="p-4 border-r border-slate-100 dark:border-white/5 flex flex-col gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Presets</span>
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    className="justify-start font-bold text-xs rounded-xl h-9 hover:bg-white dark:hover:bg-white/5"
                    onClick={() => setDateRange(preset.getValue())}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="p-2">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  className="rounded-2xl"
                />
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
          onChange={(e) => setCategory(e.target.value || null)}
          className="h-11 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/10 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">All Categories</option>
          <option value="MATERNITY">Maternity</option>
          <option value="INFERTILITY">Infertility (IVF)</option>
          <option value="GYNECOLOGY">Gynecology</option>
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
