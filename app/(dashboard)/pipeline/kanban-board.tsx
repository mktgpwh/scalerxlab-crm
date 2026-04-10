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
import { LeadStatus } from "@prisma/client";

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
  const supabase = createClient();

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
        (payload) => {
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            leads={leads.filter((l) => l.status === col.id)}
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
  );
}
