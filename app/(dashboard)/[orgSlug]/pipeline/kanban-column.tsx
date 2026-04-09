"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/lib/types";

export function KanbanColumn({ 
  id, 
  title, 
  leads
}: { 
  id: string, 
  title: string, 
  leads: Lead[]
}) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: "Column",
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-slate-100/50 flex flex-col w-[85vw] max-w-80 shrink-0 snap-center rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 bg-white/50 border-b border-slate-200">
        <h3 className="font-semibold text-sm tracking-tight text-slate-900">{title}</h3>
        <Badge variant="secondary" className="rounded-full px-2 py-0 h-5 text-[10px] font-bold">
          {leads.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1 p-3">
        <div className="flex flex-col gap-3 min-h-[150px]">
          <SortableContext
            id={id}
            items={leads.map((l) => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {leads.map((lead) => (
              <KanbanCard key={lead.id} lead={lead} />
            ))}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}
