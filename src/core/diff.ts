import type { TargetToken, UserToken } from './normalize';

export type DiffStatus =
  | 'correct'
  | 'missing'
  | 'extra'
  | 'misspelled'
  | 'wrongForm'
  | 'slot';

export interface DiffItem {
  status: DiffStatus;
  expected?: string;
  actual?: string;
  slotId?: string;
  caseMismatch?: boolean;
  punctIssue?: string;
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + cost);
      prev = temp;
    }
  }
  return dp[n];
}

const IRREGULAR_LEMMAS: Record<string, string> = {
  was: 'be',
  were: 'be',
  is: 'be',
  are: 'be',
  am: 'be',
  been: 'be',
  being: 'be',
  had: 'have',
  has: 'have',
  having: 'have',
  taken: 'take',
  took: 'take',
  taking: 'take',
  broken: 'break',
  broke: 'break',
  breaking: 'break',
  written: 'write',
  wrote: 'write',
  writing: 'write',
  held: 'hold',
  holding: 'hold',
  made: 'make',
  making: 'make',
  came: 'come',
  coming: 'come',
  given: 'give',
  gave: 'give',
  giving: 'give',
  sparing: 'spare',
  spared: 'spare',
  attaching: 'attach',
  attached: 'attach',
  ensuring: 'ensure',
  ensured: 'ensure',
  enabling: 'enable',
  enabled: 'enable',
  enables: 'enable',
  encouraged: 'encourage',
  encouraging: 'encourage',
  advised: 'advise',
  advising: 'advise',
  recommended: 'recommend',
  recommending: 'recommend',
  recommends: 'recommend',
  mentioned: 'mention',
  explained: 'explain',
  arranged: 'arrange',
  required: 'require',
  requested: 'request',
  implemented: 'implement',
  impressed: 'impress',
  characterized: 'characterize',
  accepting: 'accept',
  accepted: 'accept',
  dealing: 'deal',
  dealt: 'deal',
  helping: 'help',
  helped: 'help',
  proves: 'prove',
  proved: 'prove',
  covers: 'cover',
  covered: 'cover',
  refers: 'refer',
  referred: 'refer',
  comes: 'come',
  suggestions: 'suggestion',
  points: 'point',
  details: 'detail',
  reasons: 'reason',
  contents: 'content',
  participants: 'participant',
  steps: 'step',
  problems: 'problem',
  features: 'feature',
  students: 'student',
  arrangements: 'arrangement',
};

export function simpleStem(word: string): string {
  const w = word.toLowerCase();
  if (IRREGULAR_LEMMAS[w]) return IRREGULAR_LEMMAS[w];
  if (w.length <= 3) return w;
  if (w.endsWith('ing') && w.length > 5) {
    const base = w.slice(0, -3);
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      return base.slice(0, -1);
    }
    return base;
  }
  if (w.endsWith('ies') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ied') && w.length > 4) return w.slice(0, -3) + 'y';
  if (w.endsWith('ed') && w.length > 4) {
    const base = w.slice(0, -2);
    if (base.length >= 2 && base[base.length - 1] === base[base.length - 2]) {
      return base.slice(0, -1);
    }
    return base;
  }
  if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
  return w;
}

export function isWrongForm(expectedNorm: string, actualNorm: string): boolean {
  if (expectedNorm === actualNorm) return false;
  const stemA = simpleStem(expectedNorm);
  const stemB = simpleStem(actualNorm);
  if (stemA === stemB && stemA.length >= 3) return true;
  // 处理去 e 加 ing/ed 情况，如 make/making, advise/advised
  if (stemA + 'e' === stemB || stemB + 'e' === stemA) return true;
  return false;
}

export function isMisspelled(expectedNorm: string, actualNorm: string): boolean {
  if (expectedNorm === actualNorm) return false;
  if (expectedNorm.length < 4) return false;
  const dist = levenshtein(expectedNorm, actualNorm);
  return dist > 0 && dist <= 2;
}

/**
 * 针对普通词序列（无槽位）做 LCS 对齐，并把相邻的 missing+extra 归类为 wrongForm 或 misspelled
 */
function alignWordSegment(
  targetWords: TargetToken[],
  userWords: UserToken[],
): { items: DiffItem[]; matchedPairs: Array<{ t: TargetToken; u: UserToken }> } {
  const m = targetWords.length;
  const n = userWords.length;

  // 带权重 DP：完全匹配 +3，词形接近/拼写接近 +1.5
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  const choice: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  // 1 = diag, 2 = up (missing), 3 = left (extra)

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const tw = targetWords[i - 1].normalized;
      const uw = userWords[j - 1].normalized;
      let diagScore = -1;
      if (tw === uw) {
        diagScore = dp[i - 1][j - 1] + 3;
      } else if (isWrongForm(tw, uw) || isMisspelled(tw, uw)) {
        diagScore = dp[i - 1][j - 1] + 1.5;
      }
      const upScore = dp[i - 1][j];
      const leftScore = dp[i][j - 1];

      if (diagScore >= upScore && diagScore >= leftScore && diagScore > dp[i - 1][j - 1]) {
        dp[i][j] = diagScore;
        choice[i][j] = 1;
      } else if (upScore >= leftScore) {
        dp[i][j] = upScore;
        choice[i][j] = 2;
      } else {
        dp[i][j] = leftScore;
        choice[i][j] = 3;
      }
    }
  }

  const items: DiffItem[] = [];
  const matchedPairs: Array<{ t: TargetToken; u: UserToken }> = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && choice[i][j] === 1) {
      const t = targetWords[i - 1];
      const u = userWords[j - 1];
      matchedPairs.push({ t, u });
      if (t.normalized === u.normalized) {
        items.push({
          status: 'correct',
          expected: t.raw,
          actual: u.raw,
          caseMismatch: t.raw !== u.raw,
        });
      } else if (isWrongForm(t.normalized, u.normalized)) {
        items.push({
          status: 'wrongForm',
          expected: t.raw,
          actual: u.raw,
        });
      } else {
        items.push({
          status: 'misspelled',
          expected: t.raw,
          actual: u.raw,
        });
      }
      i--;
      j--;
    } else if (i > 0 && (j === 0 || choice[i][j] === 2)) {
      items.push({
        status: 'missing',
        expected: targetWords[i - 1].raw,
      });
      i--;
    } else {
      items.push({
        status: 'extra',
        actual: userWords[j - 1].raw,
      });
      j--;
    }
  }

  items.reverse();
  matchedPairs.reverse();
  return { items, matchedPairs };
}

/**
 * 支持槽位通配（0–6 个词）的逐词对齐
 */
export function diffTokens(
  targetTokens: TargetToken[],
  userTokens: UserToken[],
): {
  items: DiffItem[];
  slotCaptures: Array<{ slotId: string; words: UserToken[] }>;
  matchedPairs: Array<{ t: TargetToken; u: UserToken }>;
} {
  // 把 targetTokens 按槽位切分成 [segment0, slot0, segment1, slot1, ..., segmentK]
  const segments: TargetToken[][] = [];
  const slotTokens: TargetToken[] = [];
  let currentSeg: TargetToken[] = [];
  for (const tok of targetTokens) {
    if (tok.type === 'slot') {
      segments.push(currentSeg);
      slotTokens.push(tok);
      currentSeg = [];
    } else {
      currentSeg.push(tok);
    }
  }
  segments.push(currentSeg);

  if (slotTokens.length === 0) {
    const res = alignWordSegment(targetTokens, userTokens);
    return { items: res.items, slotCaptures: [], matchedPairs: res.matchedPairs };
  }

  // 为每个非空固定段在 userTokens 中寻找最佳锚点位置
  const items: DiffItem[] = [];
  const slotCaptures: Array<{ slotId: string; words: UserToken[] }> = [];
  const matchedPairs: Array<{ t: TargetToken; u: UserToken }> = [];

  let userCursor = 0;

  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const seg = segments[sIdx];
    const nextSlot = slotTokens[sIdx]; // undefined for the last segment

    if (sIdx === segments.length - 1) {
      // 最后一段：直接与剩余 userTokens 对齐
      const segUser = userTokens.slice(userCursor);
      const res = alignWordSegment(seg, segUser);
      items.push(...res.items);
      matchedPairs.push(...res.matchedPairs);
      break;
    }

    // 如果当前段非空，先消费当前段，再消费接下来的槽位
    if (seg.length > 0) {
      // 找到当前段末尾的边界：如果后方还有非空段，先定位后方锚点
      const nextSeg = segments[sIdx + 1];
      let segEndUser = Math.min(userTokens.length, userCursor + seg.length);

      // 优先检查用户输入里是否有方括号占位符（如 [X]、[能力]），它明确标出槽位起点
      let bracketPos = -1;
      for (let k = userCursor; k < Math.min(userTokens.length, userCursor + seg.length + 3); k++) {
        if (userTokens[k].isBracketPlaceholder) {
          bracketPos = k;
          break;
        }
      }

      if (bracketPos !== -1) {
        segEndUser = bracketPos;
      } else {
        // 向前对齐当前段：寻找使当前段对齐得分最高且为槽位留出空间的长度
        let bestEnd = segEndUser;
        let bestScore = -1e9;
        const maxTry = Math.min(userTokens.length, userCursor + seg.length + 2);
        const minTry = Math.max(userCursor, userCursor + seg.length - 2);
        for (let tryEnd = minTry; tryEnd <= maxTry; tryEnd++) {
          const candidate = userTokens.slice(userCursor, tryEnd);
          const { items: segItems } = alignWordSegment(seg, candidate);
          const score = segItems.reduce(
            (acc, it) =>
              acc +
              (it.status === 'correct'
                ? 3
                : it.status === 'misspelled' || it.status === 'wrongForm'
                  ? 1.5
                  : -1.5),
            0,
          );
          if (score > bestScore) {
            bestScore = score;
            bestEnd = tryEnd;
          }
        }
        segEndUser = bestEnd;
      }

      const segRes = alignWordSegment(seg, userTokens.slice(userCursor, segEndUser));
      items.push(...segRes.items);
      matchedPairs.push(...segRes.matchedPairs);
      userCursor = segEndUser;

      // 现在匹配 nextSlot（0–6 个词，直到 nextSeg 的第一个锚点词或句末）
      const slotWords = consumeSlot(userTokens, userCursor, nextSeg, sIdx === slotTokens.length - 1);
      slotCaptures.push({ slotId: nextSlot.slotId!, words: slotWords });
      items.push({
        status: 'slot',
        slotId: nextSlot.slotId,
        expected: nextSlot.raw,
        actual: slotWords.map((w) => w.raw).join(' '),
      });
      userCursor += slotWords.length;
    } else {
      // 当前段为空（例如句子开头就是槽位，或两个槽位紧邻）
      const nextSeg = segments[sIdx + 1];
      const slotWords = consumeSlot(userTokens, userCursor, nextSeg, sIdx === slotTokens.length - 1);
      slotCaptures.push({ slotId: nextSlot.slotId!, words: slotWords });
      items.push({
        status: 'slot',
        slotId: nextSlot.slotId,
        expected: nextSlot.raw,
        actual: slotWords.map((w) => w.raw).join(' '),
      });
      userCursor += slotWords.length;
    }
  }

  return { items, slotCaptures, matchedPairs };
}

function consumeSlot(
  userTokens: UserToken[],
  start: number,
  nextSeg: TargetToken[],
  isLastSlot: boolean,
): UserToken[] {
  if (start >= userTokens.length) return [];

  // 如果直接是一个方括号占位符（如 [X] / [] / [能力]），只消费这 1 个 token
  if (userTokens[start].isBracketPlaceholder) {
    return [userTokens[start]];
  }

  // 如果后面没有固定词段（槽位在句末），消费最多 6 个剩余词
  if (nextSeg.length === 0) {
    if (isLastSlot) {
      return userTokens.slice(start, Math.min(userTokens.length, start + 6));
    }
    return userTokens.slice(start, Math.min(userTokens.length, start + 2));
  }

  // 在接下来的 0..6 个词中寻找 nextSeg 的第一个词（或其近似词）
  const anchor = nextSeg[0].normalized;
  const maxConsume = Math.min(6, userTokens.length - start);

  for (let len = 0; len <= maxConsume; len++) {
    const idx = start + len;
    if (idx < userTokens.length) {
      const candidate = userTokens[idx].normalized;
      if (candidate === anchor) {
        return userTokens.slice(start, idx);
      }
    }
  }

  // 次优：允许锚点词有拼写或词形误差
  for (let len = 0; len <= maxConsume; len++) {
    const idx = start + len;
    if (idx < userTokens.length) {
      const candidate = userTokens[idx].normalized;
      if (isWrongForm(anchor, candidate) || isMisspelled(anchor, candidate)) {
        return userTokens.slice(start, idx);
      }
    }
  }

  // 如果找不到锚点（可能用户漏写了后面的词），若在句末最多消费 2 词避免吞掉整句
  return userTokens.slice(start, Math.min(userTokens.length, start + 1));
}
