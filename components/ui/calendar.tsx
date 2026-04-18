"use client"

import * as React from "react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-6 bg-white dark:bg-slate-950 font-sans shadow-2xl ring-1 ring-slate-200/60 rounded-[2.5rem]", className)}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col gap-8 sm:flex-row",
        month: "space-y-4",
        nav: "flex items-center justify-between absolute w-full z-10 px-1 pt-2",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-9 bg-white p-0 hover:bg-slate-100 hover:text-slate-900 rounded-2xl transition-all shadow-sm ring-1 ring-slate-200"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-9 bg-white p-0 hover:bg-slate-100 hover:text-slate-900 rounded-2xl transition-all shadow-sm ring-1 ring-slate-200"
        ),
        month_caption: "flex justify-center pt-3 pb-1 font-black uppercase tracking-[0.2em] text-[#243467] text-[12px]",
        table: "w-full border-collapse mt-2",
        weekdays: "flex font-black uppercase text-[10px] tracking-widest text-slate-400 mb-3",
        weekday: "flex-1 w-10 text-center",
        week: "flex w-full mt-1.5",
        day: "p-0",
        day_button: cn(
          "w-10 h-10 p-0 font-bold text-sm rounded-full flex items-center justify-center transition-all hover:bg-slate-100 focus:outline-none cursor-pointer text-slate-900 ring-offset-background disabled:opacity-50 disabled:pointer-events-none"
        ),
        selected: "bg-[#243467] text-white hover:bg-[#243467] hover:text-white shadow-lg shadow-[#243467]/40 ring-2 ring-[#243467] ring-offset-2",
        range_start: "bg-[#243467] text-white rounded-l-full",
        range_end: "bg-[#243467] text-white rounded-r-full",
        range_middle: "bg-[#243467]/10 text-[#243467] shadow-none hover:bg-[#243467]/20 ring-0",
        today: "text-[#243467] font-black bg-[#243467]/5",
        outside: "text-slate-300 hover:bg-transparent hover:text-slate-400 opacity-50",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") return <ChevronLeftIcon className="h-4 w-4" {...props} />
          if (orientation === "right") return <ChevronRightIcon className="h-4 w-4" {...props} />
          return <ChevronDownIcon className="h-4 w-4" {...props} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
