"use client"

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface WalkthroughState {
  hasSeenTour: boolean;
  isActive: boolean;
  currentStep: number;
  totalSteps: number;

  // Actions
  startTour: (totalSteps: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: () => void;
}

export const useWalkthroughStore = create<WalkthroughState>()(
  persist(
    (set, get) => ({
      hasSeenTour: false,
      isActive: false,
      currentStep: 0,
      totalSteps: 0,

      startTour: (totalSteps: number) => {
        set({ isActive: true, currentStep: 0, totalSteps });
      },

      nextStep: () => {
        const { currentStep, totalSteps } = get();
        if (currentStep < totalSteps - 1) {
          set({ currentStep: currentStep + 1 });
        } else {
          // Last step — complete
          set({ isActive: false, hasSeenTour: true, currentStep: 0 });
        }
      },

      prevStep: () => {
        const { currentStep } = get();
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 });
        }
      },

      goToStep: (step: number) => {
        set({ currentStep: step });
      },

      skipTour: () => {
        set({ isActive: false, hasSeenTour: true, currentStep: 0 });
      },

      completeTour: () => {
        set({ isActive: false, hasSeenTour: true, currentStep: 0 });
      },

      resetTour: () => {
        set({ hasSeenTour: false, isActive: false, currentStep: 0 });
      },
    }),
    {
      name: 'walkthrough-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        hasSeenTour: state.hasSeenTour,
      }),
    }
  )
);
