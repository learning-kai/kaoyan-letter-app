import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type Grade,
} from 'ts-fsrs';
import { getSentenceTemplates } from '../data/templates';

export interface SentenceCardState {
  sentenceId: string;
  card: Card;
  learned: boolean; // 是否已通过 4 步学习流程
  reviewCount: number;
  againCount: number;
  lastReviewedAt?: string;
}

export interface SchedulerOptions {
  requestRetention?: number; // 0.85 - 0.95, 默认 0.9
  examDate?: string; // YYYY-MM-DD
  now?: Date;
}

export function createScheduler(options: SchedulerOptions = {}) {
  const retention = Math.min(0.95, Math.max(0.85, options.requestRetention ?? 0.9));
  const now = options.now ?? new Date();
  let maximum_interval = 36500;

  if (options.examDate) {
    const exam = new Date(options.examDate + 'T00:00:00');
    const diffDays = Math.ceil((exam.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && diffDays <= 30) {
      maximum_interval = Math.max(1, Math.min(Math.floor(diffDays / 2), 7));
    }
  }

  const params = generatorParameters({
    request_retention: retention,
    maximum_interval,
  });

  return { engine: fsrs(params), maximum_interval };
}

export function createInitialCardState(sentenceId: string, now = new Date()): SentenceCardState {
  return {
    sentenceId,
    card: createEmptyCard(now),
    learned: false,
    reviewCount: 0,
    againCount: 0,
  };
}

export function graduateSentenceCard(
  sentenceId: string,
  options: SchedulerOptions = {},
): SentenceCardState {
  const now = options.now ?? new Date();
  const { engine } = createScheduler(options);
  const empty = createEmptyCard(now);
  const result = engine.repeat(empty, now);
  const next = result[Rating.Good].card;

  return {
    sentenceId,
    card: next,
    learned: true,
    reviewCount: 1,
    againCount: 0,
    lastReviewedAt: now.toISOString(),
  };
}

export function reviewCard(
  state: SentenceCardState,
  rating: Grade,
  options: SchedulerOptions = {},
): SentenceCardState {
  const now = options.now ?? new Date();
  const { engine } = createScheduler(options);
  const normalizedCard: Card = {
    ...state.card,
    due: new Date(state.card.due),
    last_review: state.card.last_review ? new Date(state.card.last_review) : undefined,
  };
  const result = engine.repeat(normalizedCard, now);
  const nextCard = result[rating].card;

  return {
    ...state,
    card: nextCard,
    learned: true,
    reviewCount: state.reviewCount + 1,
    againCount: state.againCount + (rating === Rating.Again ? 1 : 0),
    lastReviewedAt: now.toISOString(),
  };
}

export interface IntervalPreview {
  rating: Grade;
  label: string;
  intervalText: string;
}

export function formatInterval(from: Date, to: Date): string {
  const diffMs = Math.max(0, to.getTime() - from.getTime());
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `${Math.max(1, diffMin)} 分钟`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours} 小时`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays} 天`;
  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths} 个月`;
}

export function getIntervalPreviews(
  state: SentenceCardState,
  options: SchedulerOptions = {},
): IntervalPreview[] {
  const now = options.now ?? new Date();
  const { engine } = createScheduler(options);
  const normalizedCard: Card = {
    ...state.card,
    due: new Date(state.card.due),
    last_review: state.card.last_review ? new Date(state.card.last_review) : undefined,
  };
  const res = engine.repeat(normalizedCard, now);
  const grades: Array<{ rating: Grade; label: string }> = [
    { rating: Rating.Again, label: 'Again' },
    { rating: Rating.Hard, label: 'Hard' },
    { rating: Rating.Good, label: 'Good' },
    { rating: Rating.Easy, label: 'Easy' },
  ];

  return grades.map(({ rating, label }) => ({
    rating,
    label,
    intervalText: formatInterval(now, res[rating].card.due),
  }));
}

export function isCardDue(state: SentenceCardState, now = new Date()): boolean {
  if (!state.learned) return false;
  return new Date(state.card.due).getTime() <= now.getTime();
}

export function getMasteryLevel(
  state?: SentenceCardState,
): 'unlearned' | 'learning' | 'familiar' | 'mastered' {
  if (!state || !state.learned) return 'unlearned';
  if (state.card.state === State.New || state.card.stability < 3) return 'learning';
  if (state.card.stability <= 14) return 'familiar';
  return 'mastered';
}

/**
 * 交错排布复习队列：保证连续两张非共用卡不属于同一模板
 */
export function interleaveQueue(sentenceIds: string[]): string[] {
  if (sentenceIds.length <= 2) return [...sentenceIds];

  const getGroup = (id: string): string => {
    if (id.startsWith('shared.')) return 'shared';
    const tpls = getSentenceTemplates(id);
    return tpls[0]?.id ?? 'other';
  };

  const remaining = [...sentenceIds];
  const result: string[] = [];

  while (remaining.length > 0) {
    const lastGroup = result.length > 0 ? getGroup(result[result.length - 1]) : null;
    let pickIndex = remaining.findIndex((id) => {
      const g = getGroup(id);
      return g === 'shared' || g !== lastGroup;
    });
    if (pickIndex === -1) pickIndex = 0;
    result.push(remaining.splice(pickIndex, 1)[0]);
  }
  return result;
}

/**
 * 本轮评 Again 的卡，在 3–5 张卡后重新插入队列（短期重考）
 */
export function requeueAgainCard(
  queue: string[],
  currentIndex: number,
  sentenceId: string,
  offset = 4,
): string[] {
  const next = [...queue];
  const clampedOffset = Math.min(5, Math.max(3, offset));
  const insertAt = Math.min(next.length, currentIndex + 1 + clampedOffset);
  next.splice(insertAt, 0, sentenceId);
  return next;
}
