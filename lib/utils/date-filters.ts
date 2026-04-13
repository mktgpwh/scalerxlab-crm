import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, parseISO } from "date-fns";

export type DatePreset = "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "custom";

export function getPrismaDateFilter(from?: string, to?: string) {
  if (!from) return {};

  const start = startOfDay(parseISO(from));
  const end = to ? endOfDay(parseISO(to)) : endOfDay(start);

  return {
    createdAt: {
      gte: start,
      lte: end,
    },
  };
}

export function getDateRangeFromPreset(preset: DatePreset) {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "yesterday":
      const yesterday = subDays(now, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    case "last7":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "last30":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "thisMonth":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    default:
      return { from: startOfMonth(now), to: endOfMonth(now) };
  }
}
