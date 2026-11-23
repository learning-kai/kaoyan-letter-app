import { describe, it, expect } from 'vitest';
import { PROMPTS } from './prompts';
import { TEMPLATES } from './templates';
import { PHRASE_CARDS, FORM_CARDS, ORDER_CARDS, isLessonUnlocked } from '../core/cards';

describe('模拟题库与扩展卡片完整性校验', () => {
  it('共有 21 道原创模拟题，每类恰好 3 道，且至少包含 6 道易混题', () => {
    expect(PROMPTS).toHaveLength(21);
    for (const tpl of TEMPLATES) {
      const count = PROMPTS.filter((p) => p.templateId === tpl.id).length;
      expect(count, `${tpl.name} 模拟题数量`).toBe(3);
    }
    const trickyCount = PROMPTS.filter((p) => p.tricky).length;
    expect(trickyCount).toBeGreaterThanOrEqual(6);
  });

  it('每道模拟题均含标准 Directions 格式与可抄写关键词', () => {
    for (const p of PROMPTS) {
      expect(p.directions).toContain('Directions:');
      expect(p.directions).toContain('100 words');
      expect(p.suggestedKeywords.length).toBeGreaterThan(0);
    }
  });

  it('扩展卡片（P/F/O）完整且课程解锁逻辑正确', () => {
    expect(PHRASE_CARDS).toHaveLength(6);
    expect(FORM_CARDS.length).toBeGreaterThanOrEqual(5);
    expect(ORDER_CARDS).toHaveLength(7);

    // 初始状态仅第 1 课解锁，开启 unlockAll 后全部解锁
    expect(isLessonUnlocked(1, {}, false)).toBe(true);
    expect(isLessonUnlocked(2, {}, false)).toBe(false);
    expect(isLessonUnlocked(5, {}, true)).toBe(true);
  });
});
