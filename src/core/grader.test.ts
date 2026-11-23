import { describe, it, expect } from 'vitest';
import { Rating } from 'ts-fsrs';
import { gradeSentence } from './grader';

describe('判分算法 grader', () => {
  it('完全正确时准确率为 100%', () => {
    const target = 'It is a great pleasure for me to write this letter to you.';
    const res = gradeSentence(target, target);
    expect(res.accuracy).toBe(1);
    expect(res.missingCount).toBe(0);
    expect(res.extraCount).toBe(0);
    expect(res.misspelledCount).toBe(0);
    expect(res.wrongFormCount).toBe(0);
    expect(res.suggestedRating).toBe(Rating.Good);
  });

  it('速度很快且 100% 正确无提示时评为 Easy', () => {
    const target = 'It is a great pleasure for me to write this letter to you.';
    const res = gradeSentence(target, target, { usedHint: false, durationSec: 8 });
    expect(res.accuracy).toBe(1);
    expect(res.suggestedRating).toBe(Rating.Easy);
  });

  it('漏写一个词时标记为 missing', () => {
    const target = 'It is a great pleasure for me to write this letter to you.';
    const input = 'It is a pleasure for me to write this letter to you.';
    const res = gradeSentence(target, input);
    expect(res.missingCount).toBe(1);
    expect(res.items.some((i) => i.status === 'missing' && i.expected === 'great')).toBe(true);
    expect(res.accuracy).toBeLessThan(1);
  });

  it('拼写错误（Levenshtein <= 2 且词长 >= 4）标记为 misspelled 且算半对', () => {
    const target = 'Last but not least, it is advisable for you to {{action}}.';
    const input = 'Last but not least, it is advisible for you to [X].';
    const res = gradeSentence(target, input, { slotMode: 'frame' });
    expect(res.misspelledCount).toBe(1);
    expect(
      res.items.some(
        (i) => i.status === 'misspelled' && i.expected === 'advisable' && i.actual === 'advisible',
      ),
    ).toBe(true);
  });

  it('输入 as a result of break my promise 时，判为词形错误并提示 breaking', () => {
    const target = 'Furthermore, as a result of breaking my promise, you had to face inconvenience.';
    const input = 'Furthermore, as a result of break my promise, you had to face inconvenience.';
    const res = gradeSentence(target, input);
    expect(res.wrongFormCount).toBe(1);
    expect(
      res.items.some(
        (i) => i.status === 'wrongForm' && i.expected === 'breaking' && i.actual === 'break',
      ),
    ).toBe(true);
  });

  it('实填模式下在 doing 槽位填 break my promise 会给出词性提醒', () => {
    const target =
      'Furthermore, as a result of {{wrongActionDoing}}, you had to face {{impact}}, which should not have happened.';
    const input =
      'Furthermore, as a result of break my promise, you had to face a lot of inconvenience, which should not have happened.';
    const res = gradeSentence(target, input, { slotMode: 'fill' });
    expect(res.slotWarnings.length).toBeGreaterThan(0);
    expect(res.slotWarnings[0].slotId).toBe('wrongActionDoing');
    expect(res.slotWarnings[0].message).toContain('breaking my promise');
  });

  it('框架模式下槽位写 [X]、[]、[能力] 或任意短语均不扣分', () => {
    const target =
      'Furthermore, you are advised to {{suggestedAction}} around {{topicWord}} so that you can gradually improve {{ability}}.';
    const input1 =
      'Furthermore, you are advised to [X] around [] so that you can gradually improve [能力].';
    const input2 =
      'Furthermore, you are advised to read more books around Chinese culture so that you can gradually improve your overall competence.';

    const res1 = gradeSentence(target, input1, { slotMode: 'frame' });
    const res2 = gradeSentence(target, input2, { slotMode: 'frame' });

    expect(res1.accuracy).toBe(1);
    expect(res2.accuracy).toBe(1);
  });

  it('中文标点输入会被正确规范化', () => {
    const target = 'To justify my opinion, several points need to be mentioned as follows.';
    const input = 'To justify my opinion， several points need to be mentioned as follows。';
    const res = gradeSentence(target, input);
    expect(res.accuracy).toBe(1);
    expect(res.punctuationWarnings).toHaveLength(0);
  });

  it('多空格输入会被合并，不影响正确率', () => {
    const target = 'To be more specific, several points need to be mentioned as follows.';
    const input = 'To   be    more  specific,   several   points need to be mentioned as follows.';
    const res = gradeSentence(target, input);
    expect(res.accuracy).toBe(1);
  });

  it('全大写输入不扣分，但单独提示大小写差异', () => {
    const target = 'It is with deep regret that I write this letter to you.';
    const input = 'IT IS WITH DEEP REGRET THAT I WRITE THIS LETTER TO YOU.';
    const res = gradeSentence(target, input);
    expect(res.accuracy).toBe(1);
    expect(res.caseMismatches.length).toBeGreaterThan(0);
  });

  it('默认忽略逗号有无，但缺少句号会提示并轻微扣分；严格标点模式检查逗号', () => {
    const target = 'To justify my opinion, several points need to be mentioned as follows.';
    const noComma = 'To justify my opinion several points need to be mentioned as follows.';
    const noPeriod = 'To justify my opinion, several points need to be mentioned as follows';

    const resDefault = gradeSentence(target, noComma, { strictPunctuation: false });
    expect(resDefault.accuracy).toBe(1);

    const resStrict = gradeSentence(target, noComma, { strictPunctuation: true });
    expect(resStrict.punctuationWarnings.length).toBeGreaterThan(0);

    const resNoPeriod = gradeSentence(target, noPeriod);
    expect(resNoPeriod.punctuationWarnings).toContain('缺少句末句号（.）');
    expect(resNoPeriod.accuracy).toBeLessThan(1);
  });
});
