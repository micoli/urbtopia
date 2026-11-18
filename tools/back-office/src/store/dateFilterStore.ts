import { create } from 'zustand'
import { DEFAULT_FILTER, type DateFilter } from '../domain/dateFilter'

interface DateFilterStore {
  filter: DateFilter
  setFilter: (filter: DateFilter) => void
}

// Shared by the Stats and the Dashboard, so the choice follows the Admin from one tab to the other.
export const useDateFilter = create<DateFilterStore>()(set => ({ filter: DEFAULT_FILTER, setFilter: filter => set({ filter }) }))
