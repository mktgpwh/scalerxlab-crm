import { create } from 'zustand'
import { startOfMonth, endOfMonth } from 'date-fns'

export type DateRange = {
  from: Date | undefined
  to?: Date | undefined
}

interface DashboardState {
  // Filter Values
  dateRange: DateRange
  branchId: string | null
  category: string | null
  ownerId: string | null // All, specific UUID, or 'unassigned'
  
  // Actions
  setDateRange: (range: DateRange) => void
  setBranchId: (id: string | null) => void
  setCategory: (category: string | null) => void
  setOwnerId: (id: string | null) => void
  resetFilters: () => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  dateRange: {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  },
  branchId: null,
  category: null,
  ownerId: null,

  setDateRange: (dateRange) => set({ dateRange }),
  setBranchId: (branchId) => set({ branchId }),
  setCategory: (category) => set({ category }),
  setOwnerId: (ownerId) => set({ ownerId }),
  
  resetFilters: () => set({
    dateRange: {
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    },
    branchId: null,
    category: null,
    ownerId: null,
  }),
}))
