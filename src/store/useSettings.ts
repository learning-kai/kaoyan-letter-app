import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import type { SlotMode } from '../core/grader';

export type ThemeMode = 'light' | 'dark' | 'system';
export type InputMode = 'typing' | 'paper';

const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get<string>(name);
      return value ?? null;
    } catch {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch {
      try {
        localStorage.setItem(name, value);
      } catch {
        // ignore storage quota errors
      }
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await del(name);
    } catch {
      try {
        localStorage.removeItem(name);
      } catch {
        // ignore
      }
    }
  },
};

export interface SettingsSnapshot {
  schemaVersion: number;
  dailyNewLimit: number;
  requestRetention: number;
  strictPunctuation: boolean;
  slotMode: SlotMode;
  inputMode: InputMode;
  theme: ThemeMode;
  fontSize: number;
  examDate: string;
  unlockAllLessons: boolean;
}

export interface SettingsState extends SettingsSnapshot {
  setDailyNewLimit: (n: number) => void;
  setRequestRetention: (r: number) => void;
  setStrictPunctuation: (v: boolean) => void;
  setSlotMode: (m: SlotMode) => void;
  setInputMode: (m: InputMode) => void;
  setTheme: (t: ThemeMode) => void;
  setFontSize: (px: number) => void;
  setExamDate: (d: string) => void;
  setUnlockAllLessons: (v: boolean) => void;
  applySettingsSnapshot: (snap: Partial<SettingsSnapshot>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (setState) => ({
      schemaVersion: 2,
      dailyNewLimit: 8,
      requestRetention: 0.9,
      strictPunctuation: false,
      slotMode: 'frame',
      inputMode: 'typing',
      theme: 'light',
      fontSize: 19,
      examDate: '',
      unlockAllLessons: false,

      setDailyNewLimit: (n) => setState({ dailyNewLimit: Math.min(15, Math.max(4, n)) }),
      setRequestRetention: (r) => setState({ requestRetention: Math.min(0.95, Math.max(0.85, r)) }),
      setStrictPunctuation: (v) => setState({ strictPunctuation: v }),
      setSlotMode: (m) => setState({ slotMode: m }),
      setInputMode: (m) => setState({ inputMode: m }),
      setTheme: (t) => setState({ theme: t }),
      setFontSize: (px) => setState({ fontSize: Math.min(22, Math.max(16, px)) }),
      setExamDate: (d) => setState({ examDate: d }),
      setUnlockAllLessons: (v) => setState({ unlockAllLessons: v }),
      applySettingsSnapshot: (snap) =>
        setState((s) => ({
          ...s,
          dailyNewLimit: snap.dailyNewLimit ?? s.dailyNewLimit,
          requestRetention: snap.requestRetention ?? s.requestRetention,
          strictPunctuation: snap.strictPunctuation ?? s.strictPunctuation,
          slotMode: snap.slotMode ?? s.slotMode,
          inputMode: snap.inputMode ?? s.inputMode,
          theme: snap.theme ?? s.theme,
          fontSize: snap.fontSize ?? s.fontSize,
          examDate: snap.examDate ?? s.examDate,
          unlockAllLessons: snap.unlockAllLessons ?? s.unlockAllLessons,
        })),
    }),
    {
      name: 'kaoyan-letter-settings',
      version: 2,
      storage: createJSONStorage(() => idbStorage),
      migrate: (persistedState: unknown, version: number) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState as SettingsState;
        }
        const s = persistedState as Record<string, unknown>;
        if (version < 2) {
          return {
            ...s,
            schemaVersion: 2,
            inputMode: s.inputMode ?? 'typing',
            theme: s.theme ?? 'light',
            unlockAllLessons: s.unlockAllLessons ?? false,
          };
        }
        return persistedState as SettingsState;
      },
    },
  ),
);
