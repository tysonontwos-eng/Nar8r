import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings } from '../types/screenplay';

interface SettingsState extends AppSettings {
  // Actions
  setTheme: (theme: 'midcentury' | 'classic') => void;
  toggleTheme: () => void;
  setFontSize: (size: number) => void;
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Default settings
      theme: 'midcentury',
      fontSize: 1, // multiplier (1 = 12pt)
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds

      setTheme: (theme) => set({ theme }),

      toggleTheme: () => {
        const current = get().theme;
        set({ theme: current === 'midcentury' ? 'classic' : 'midcentury' });
      },

      setFontSize: (fontSize) => set({ fontSize }),

      setAutoSave: (autoSave) => set({ autoSave }),

      setAutoSaveInterval: (autoSaveInterval) => set({ autoSaveInterval }),
    }),
    {
      name: 'slugline-settings',
    }
  )
);
