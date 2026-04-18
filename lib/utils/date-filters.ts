import { startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, parseISO } from "date-fns";

export type DatePreset = "today" | "yesterday" | "last7" | "last30" | "thisMonth" | "custom";

export function getPrismaDateFilter(from?: string, to?: string) {
  // Guard against strings like "undefined" or "null" which can come from URLSearchParams
  if (!from || from === "undefined" || from === "null" || from === "") return {};

  try {
    const start = startOfDay(parseISO(from));
    
    // Check if derived date is valid
    if (isNaN(start.getTime())) return {};

    let end: Date;
    if (to && to !== "undefined" && to !== "null" && to !== "") {
      end = endOfDay(parseISO(to));
      if (isNaN(end.getTime())) end = endOfDay(start);
    } else {
      end = endOfDay(start);
    }

    return {
      createdAt: {
        gte: start,
        lte: end,
      },
    };
  } catch (err) {
    return {};
  }
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
