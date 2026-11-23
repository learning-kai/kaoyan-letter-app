import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { Rating, type Grade } from 'ts-fsrs';
import {
  graduateSentenceCard,
  reviewCard,
  type SentenceCardState,
  type SchedulerOptions,
} from '../core/scheduler';
import type { DiffItem } from '../core/diff';
import type { TemplateId } from '../data/types';

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
        // ignore
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

export function formatDateKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface MistakeMeta {
  lastAgainAt?: string;
  /** expectedWord -> { actualWrongWord: count } */
  wrongWords: Record<string, Record<string, number>>;
}

export interface ExamRecord {
  id: string;
  date: string; // ISO
  promptId: string;
  templateId: TemplateId;
  recognizedCorrect: boolean;
  durationMin: number;
  wordCount: number;
  avgAccuracy: number;
}

export interface ProgressSnapshot {
  schemaVersion: number;
  cards: Record<string, SentenceCardState>;
  dailyStats: Record<string, { learned: number; reviewed: number }>;
  mistakes: Record<string, MistakeMeta>;
  examRecords: ExamRecord[];
  recognitionStats: { total: number; correct: number };
}

export interface ProgressState extends ProgressSnapshot {
  graduateSentence: (sentenceId: string, options?: SchedulerOptions) => void;
  submitReview: (
    sentenceId: string,
    rating: Grade,
    options?: SchedulerOptions,
    diffItems?: DiffItem[],
  ) => void;
  recordRecognition: (correct: boolean) => void;
  addExamRecord: (rec: ExamRecord) => void;
  getTodayLearnedCount: () => number;
  getTodayReviewedCount: () => number;
  applyProgressSnapshot: (snap: Partial<ProgressSnapshot>) => void;
  resetAll: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (setState, getState) => ({
      schemaVersion: 2,
      cards: {},
      dailyStats: {},
      mistakes: {},
      examRecords: [],
      recognitionStats: { total: 0, correct: 0 },

      graduateSentence: (sentenceId, options) => {
        const graduated = graduateSentenceCard(sentenceId, options);
        const key = formatDateKey();
        const prevDay = getState().dailyStats[key] ?? { learned: 0, reviewed: 0 };
        setState((s) => ({
          cards: { ...s.cards, [sentenceId]: graduated },
          dailyStats: {
            ...s.dailyStats,
            [key]: { ...prevDay, learned: prevDay.learned + 1 },
          },
        }));
      },

      submitReview: (sentenceId, rating, options, diffItems) => {
        const existing = getState().cards[sentenceId];
        if (!existing) return;
        const updated = reviewCard(existing, rating, options);
        const key = formatDateKey();
        const prevDay = getState().dailyStats[key] ?? { learned: 0, reviewed: 0 };

        // 记录错误历史与最常错词
        const prevMistake: MistakeMeta = getState().mistakes[sentenceId] ?? {
          wrongWords: {},
        };
        const nextWrongWords: Record<string, Record<string, number>> = {
          ...prevMistake.wrongWords,
        };

        if (diffItems) {
          for (const item of diffItems) {
            if (
              (item.status === 'misspelled' || item.status === 'wrongForm') &&
              item.expected &&
              item.actual
            ) {
              const exp = item.expected.toLowerCase();
              const act = item.actual.toLowerCase();
              const map = { ...(nextWrongWords[exp] ?? {}) };
              map[act] = (map[act] ?? 0) + 1;
              nextWrongWords[exp] = map;
            }
          }
        }

        const nextMistake: MistakeMeta = {
          lastAgainAt: rating === Rating.Again ? new Date().toISOString() : prevMistake.lastAgainAt,
          wrongWords: nextWrongWords,
        };

        setState((s) => ({
          cards: { ...s.cards, [sentenceId]: updated },
          dailyStats: {
            ...s.dailyStats,
            [key]: { ...prevDay, reviewed: prevDay.reviewed + 1 },
          },
          mistakes: {
            ...s.mistakes,
            [sentenceId]: nextMistake,
          },
        }));
      },

      recordRecognition: (correct) => {
        setState((s) => ({
          recognitionStats: {
            total: s.recognitionStats.total + 1,
            correct: s.recognitionStats.correct + (correct ? 1 : 0),
          },
        }));
      },

      addExamRecord: (rec) => {
        setState((s) => ({
          examRecords: [...s.examRecords, rec],
        }));
      },

      getTodayLearnedCount: () => {
        return getState().dailyStats[formatDateKey()]?.learned ?? 0;
      },

      getTodayReviewedCount: () => {
        return getState().dailyStats[formatDateKey()]?.reviewed ?? 0;
      },

      applyProgressSnapshot: (snap) => {
        setState((s) => ({
          ...s,
          cards: snap.cards ?? s.cards,
          dailyStats: snap.dailyStats ?? s.dailyStats,
          mistakes: snap.mistakes ?? s.mistakes,
          examRecords: snap.examRecords ?? s.examRecords,
          recognitionStats: snap.recognitionStats ?? s.recognitionStats,
        }));
      },

      resetAll: () =>
        setState({
          cards: {},
          dailyStats: {},
          mistakes: {},
          examRecords: [],
          recognitionStats: { total: 0, correct: 0 },
        }),
    }),
    {
      name: 'kaoyan-letter-progress',
      version: 2,
      storage: createJSONStorage(() => idbStorage),
      migrate: (persistedState: unknown, version: number) => {
        if (!persistedState || typeof persistedState !== 'object') {
          return persistedState as ProgressState;
        }
        const s = persistedState as Record<string, unknown>;
        if (version < 2) {
          return {
            ...s,
            schemaVersion: 2,
            mistakes: s.mistakes ?? {},
            examRecords: s.examRecords ?? [],
            recognitionStats: s.recognitionStats ?? { total: 0, correct: 0 },
          };
        }
        return persistedState as ProgressState;
      },
    },
  ),
);
