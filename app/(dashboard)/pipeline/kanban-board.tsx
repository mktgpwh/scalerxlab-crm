"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core";
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { createClient } from "@/lib/supabase/client";
import { updateLeadStatusAction } from "./actions";
import { Lead } from "@/lib/types";
import type { LeadStatus } from "@prisma/client";

const COLUMNS = [
  { id: "RAW", title: "Raw Intake" },
  { id: "QUALIFIED", title: "Qualified / Triage" },
  { id: "CONTACTED", title: "Contacted" },
  { id: "APPOINTMENT_FIXED", title: "Appointment Set" },
  { id: "VISITED", title: "Visited Clinic" },
  { id: "WON", title: "Enrolled" },
  { id: "LOST", title: "Lost" },
];

export function KanbanBoard({ 
  initialLeads 
}: { 
  initialLeads: Lead[]
}) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [activeFunnel, setActiveFunnel] = useState<"OVERALL" | "INFERTILITY" | "MATERNITY">("OVERALL");
  const [dateRange, setDateRange] = useState<string>("ALL");
  const supabase = createClient();

  const visibleLeads = React.useMemo(() => {
      let filtered = activeFunnel === "OVERALL" ? leads : leads.filter(l => l.category === activeFunnel);
      
      if (dateRange !== "ALL") {
          const now = new Date();
          let cutoff = new Date();
          if (dateRange === "TODAY") {
              cutoff.setHours(0,0,0,0);
          } else if (dateRange === "7D") {
              cutoff.setDate(now.getDate() - 7);
          } else if (dateRange === "30D") {
              cutoff.setDate(now.getDate() - 30);
          }
          filtered = filtered.filter(l => new Date(l.createdAt || new Date()) >= cutoff);
      }

      return filtered;
  }, [leads, activeFunnel, dateRange]);

  // Listen for Realtime Sync
  useEffect(() => {
    const channel = supabase
      .channel('pipeline_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leads'
        },
        (payload: any) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;

          if (eventType === 'INSERT') {
            setLeads((prev) => [newRecord as Lead, ...prev]);
          } else if (eventType === 'UPDATE') {
            setLeads((prev) => 
              prev.map((l) => (l.id === (newRecord as Lead).id ? (newRecord as Lead) : l))
            );
          } else if (eventType === 'DELETE') {
            setLeads((prev) => prev.filter((l) => l.id !== (oldRecord as Lead).id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
          distance: 10,
        },
      }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leads.find((l) => l.id === active.id);
    setActiveLead(lead ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveACard = active.data.current?.type === "Card";
    const isOverACard = over.data.current?.type === "Card";

    if (!isActiveACard) return;

    // Moving card over another card in different/same column
    if (isActiveACard && isOverACard) {
      setLeads((prev) => {
        const activeIndex = prev.findIndex((l) => l.id === activeId);
        const overIndex = prev.findIndex((l) => l.id === overId);

        if (prev[activeIndex].status !== prev[overIndex].status) {
          prev[activeIndex].status = prev[overIndex].status;
          return arrayMove(prev, activeIndex, overIndex - 1);
        }

        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Moving card over a column (empty or not)
    const isOverAColumn = over.data.current?.type === "Column";
    if (isActiveACard && isOverAColumn) {
      setLeads((prev) => {
        const activeIndex = prev.findIndex((l) => l.id === activeId);
        prev[activeIndex].status = overId as LeadStatus;
        return arrayMove(prev, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const lead = leads.find((l) => l.id === activeId);
    if (!lead) return;

    const newStatus = over.data.current?.type === "Column" ? overId : leads.find(l => l.id === overId)?.status;

    if (newStatus && newStatus !== lead.status) {
        await updateLeadStatusAction(activeId, newStatus as LeadStatus);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Filters Header */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
          {/* Funnel Navigation Tabs */}
          <div className="flex items-center gap-2 p-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur border border-slate-200/50 dark:border-white/5 rounded-2xl w-fit">
             <button 
                onClick={() => setActiveFunnel("OVERALL")} 
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeFunnel === "OVERALL" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}
             >
                Overall Pipeline
             </button>
             <button 
                onClick={() => setActiveFunnel("INFERTILITY")} 
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeFunnel === "INFERTILITY" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}
             >
                IVF Funnel
             </button>
             <button 
                onClick={() => setActiveFunnel("MATERNITY")} 
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeFunnel === "MATERNITY" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}
             >
                Maternity Funnel
             </button>
          </div>

          {/* Date Range Selector */}
          <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200/60 dark:border-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl px-4 py-2 h-9 outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
          >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today Only</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
          </select>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.title}
              leads={visibleLeads.filter((l) => l.status === col.id)}
            />
          ))}
        </div>

      <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: "0.5",
              },
            },
          }),
        }}>
        {activeLead ? (
          <KanbanCard lead={activeLead} isOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
    </div>
  );
}
