import { describe, it, expect } from 'vitest';
import { Rating } from 'ts-fsrs';
import {
  createScheduler,
  graduateSentenceCard,
  reviewCard,
  getIntervalPreviews,
  interleaveQueue,
  requeueAgainCard,
} from './scheduler';

describe('FSRS 调度与队列逻辑', () => {
  it('毕业卡片以 Rating.Good 写入 FSRS 并标记为 learned', () => {
    const now = new Date('2026-11-23T08:00:00Z');
    const cardState = graduateSentenceCard('suggest.body1', { now });
    expect(cardState.learned).toBe(true);
    expect(cardState.reviewCount).toBe(1);
    expect(new Date(cardState.card.due).getTime()).toBeGreaterThan(now.getTime());
  });

  it('评分后能更新卡片状态并返回 4 档间隔预览', () => {
    const now = new Date('2026-11-23T08:00:00Z');
    const initial = graduateSentenceCard('invite.body1', { now });
    const later = new Date('2026-11-25T08:00:00Z');
    const previews = getIntervalPreviews(initial, { now: later });
    expect(previews).toHaveLength(4);
    expect(previews.map((p) => p.label)).toEqual(['Again', 'Hard', 'Good', 'Easy']);

    const afterAgain = reviewCard(initial, Rating.Again, { now: later });
    expect(afterAgain.againCount).toBe(1);
    expect(afterAgain.reviewCount).toBe(2);
  });

  it('距考试 <= 30 天时正确限制 maximum_interval', () => {
    const now = new Date('2026-12-01T00:00:00Z');
    const { maximum_interval: max10 } = createScheduler({
      examDate: '2026-12-11',
      now,
    });
    expect(max10).toBe(5);

    const { maximum_interval: max26 } = createScheduler({
      examDate: '2026-12-27',
      now,
    });
    expect(max26).toBe(7);
  });

  it('交错队列保证连续两张非共用卡不属于同一模板', () => {
    const input = [
      'suggest.body1',
      'suggest.body2',
      'suggest.body3',
      'invite.body1',
      'invite.body2',
      'apology.body1',
    ];
    const interleaved = interleaveQueue(input);
    expect(interleaved).toHaveLength(input.length);
    for (let i = 1; i < interleaved.length; i++) {
      const prevTpl = interleaved[i - 1].split('.')[0];
      const currTpl = interleaved[i].split('.')[0];
      if (prevTpl !== 'shared' && currTpl !== 'shared') {
        expect(currTpl).not.toBe(prevTpl);
      }
    }
  });

  it('评 Again 的卡会在本轮 3–5 张卡后重新插入', () => {
    const queue = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const next = requeueAgainCard(queue, 0, 'a', 4);
    expect(next).toHaveLength(8);
    expect(next[5]).toBe('a');
  });
});
