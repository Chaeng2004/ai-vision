import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { DietaryRestriction, ScanHistoryItem } from '../types';

type AppState = {
  hasCompletedOnboarding: boolean;
  restrictions: DietaryRestriction[];
  history: ScanHistoryItem[];

  completeOnboarding: () => void;
  setRestrictions: (restrictions: DietaryRestriction[]) => void;
  toggleRestriction: (r: DietaryRestriction) => void;

  addScan: (item: ScanHistoryItem) => void;
  removeScan: (id: string) => void;
  clearHistory: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      restrictions: [],
      history: [],

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      setRestrictions: (restrictions) => set({ restrictions }),

      toggleRestriction: (r) =>
        set((s) => ({
          restrictions: s.restrictions.includes(r)
            ? s.restrictions.filter((x) => x !== r)
            : [...s.restrictions, r],
        })),

      addScan: (item) =>
        set((s) => ({
          history: [item, ...s.history].slice(0, 50),
        })),

      removeScan: (id) =>
        set((s) => ({
          history: s.history.filter((h) => h.id !== id),
        })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'ingredientiq-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        hasCompletedOnboarding: s.hasCompletedOnboarding,
        restrictions: s.restrictions,
        history: s.history,
      }),
    }
  )
);

