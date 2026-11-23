import { Rating } from 'ts-fsrs';
import { SLOTS, POS_LABEL } from '../data/fillers';
import { diffTokens, type DiffItem } from './diff';
import { normalizePunctuationAndSpaces, tokenizeTarget, tokenizeUser } from './normalize';

export type SlotMode = 'frame' | 'fill';

export interface GradeOptions {
  slotMode?: SlotMode;
  strictPunctuation?: boolean;
  usedHint?: boolean;
  durationSec?: number;
}

export interface SlotWarning {
  slotId: string;
  label: string;
  actual: string;
  message: string;
}

export interface GradeResult {
  accuracy: number; // 0..1
  items: DiffItem[];
  suggestedRating: Rating;
  caseMismatches: Array<{ expected: string; actual: string }>;
  punctuationWarnings: string[];
  slotWarnings: SlotWarning[];
  targetWordCount: number;
  correctCount: number;
  missingCount: number;
  extraCount: number;
  misspelledCount: number;
  wrongFormCount: number;
}

function checkSlotPos(slotId: string, actualText: string): SlotWarning | null {
  const slot = SLOTS[slotId];
  if (!slot) return null;
  const trimmed = actualText.trim();
  if (!trimmed || /^\[[^\]]*\]$/.test(trimmed)) {
    return {
      slotId,
      label: slot.label,
      actual: trimmed,
      message: `实填模式下「${slot.label}」需要填写具体英文（${POS_LABEL[slot.pos]}），不能留空或写占位符`,
    };
  }
  const firstWord = trimmed.split(/\s+/)[0].toLowerCase().replace(/[^a-z'-]/g, '');
  if (slot.pos === 'verb') {
    if (firstWord === 'to' || (firstWord.endsWith('ing') && firstWord.length > 4)) {
      return {
        slotId,
        label: slot.label,
        actual: trimmed,
        message: `「${slot.label}」这里要填动词原形（不能以 to 或 -ing 开头），参考：${slot.filler}`,
      };
    }
  } else if (slot.pos === 'doing') {
    // 必须以 -ing 词开头，或是名词短语（简单启发：若以常见动词原形开头则提醒）
    const commonBaseVerbs = new Set([
      'break',
      'miss',
      'cancel',
      'delay',
      'forget',
      'fail',
      'change',
      'leave',
      'lose',
      'make',
      'do',
      'go',
      'come',
      'take',
      'give',
      'send',
      'write',
      'attend',
    ]);
    if (firstWord === 'to' || commonBaseVerbs.has(firstWord)) {
      return {
        slotId,
        label: slot.label,
        actual: trimmed,
        message: `「${slot.label}」这里要填 doing 形式或名词短语，参考：${slot.filler}`,
      };
    }
  } else if (slot.pos === 'noun') {
    if (firstWord === 'to') {
      return {
        slotId,
        label: slot.label,
        actual: trimmed,
        message: `「${slot.label}」这里要填名词（不能以 to 开头），参考：${slot.filler}`,
      };
    }
  }
  return null;
}

export function gradeSentence(
  targetEn: string,
  userInput: string,
  options: GradeOptions = {},
): GradeResult {
  const {
    slotMode = 'frame',
    strictPunctuation = false,
    usedHint = false,
    durationSec = 999,
  } = options;

  const targetTokens = tokenizeTarget(targetEn);
  const userTokens = tokenizeUser(userInput);
  const { items, slotCaptures, matchedPairs } = diffTokens(targetTokens, userTokens);

  const wordTargetCount = targetTokens.filter((t) => t.type === 'word').length;
  let correctCount = 0;
  let missingCount = 0;
  let extraCount = 0;
  let misspelledCount = 0;
  let wrongFormCount = 0;
  const caseMismatches: Array<{ expected: string; actual: string }> = [];

  for (const item of items) {
    if (item.status === 'correct') {
      correctCount++;
      if (item.caseMismatch && item.expected && item.actual) {
        caseMismatches.push({ expected: item.expected, actual: item.actual });
      }
    } else if (item.status === 'missing') {
      missingCount++;
    } else if (item.status === 'extra') {
      extraCount++;
    } else if (item.status === 'misspelled') {
      misspelledCount++;
    } else if (item.status === 'wrongForm') {
      wrongFormCount++;
    }
  }

  // 标点检查
  const punctuationWarnings: string[] = [];
  const normTarget = normalizePunctuationAndSpaces(targetEn);
  const normUser = normalizePunctuationAndSpaces(userInput);
  let punctPenalty = 0;

  // 检查句末句号
  if (normTarget.endsWith('.') && !normUser.endsWith('.')) {
    punctuationWarnings.push('缺少句末句号（.）');
    punctPenalty += 0.02;
  }

  // 严格标点模式下检查逗号一致性
  if (strictPunctuation) {
    for (const { t, u } of matchedPairs) {
      const tHasComma = t.trailingPunct.includes(',');
      const uHasComma = u.trailingPunct.includes(',');
      if (tHasComma !== uHasComma) {
        punctuationWarnings.push(
          tHasComma
            ? `「${t.raw}」后缺少逗号`
            : `「${t.raw}」后多写了逗号`,
        );
        punctPenalty += 0.02;
      }
    }
  }

  // 实填模式下检查槽位词性
  const slotWarnings: SlotWarning[] = [];
  if (slotMode === 'fill') {
    for (const cap of slotCaptures) {
      const text = cap.words.map((w) => w.raw).join(' ');
      const warn = checkSlotPos(cap.slotId, text);
      if (warn) slotWarnings.push(warn);
    }
  }

  // 计算准确率：正确词数 / 目标词数，拼写错误算半对，词形错误算半对，多写的词每个扣 0.5
  let rawScore = 0;
  if (wordTargetCount > 0) {
    const effectiveCorrect =
      correctCount + 0.5 * misspelledCount + 0.5 * wrongFormCount - 0.5 * extraCount;
    rawScore = effectiveCorrect / wordTargetCount - punctPenalty;
  } else {
    rawScore = 1;
  }
  const accuracy = Math.max(0, Math.min(1, Number(rawScore.toFixed(4))));

  // 自动评分规则
  let suggestedRating: Rating;
  if (accuracy < 0.85) {
    suggestedRating = Rating.Again;
  } else if (accuracy < 0.98 || usedHint) {
    suggestedRating = Rating.Hard;
  } else if (accuracy === 1 && !usedHint && durationSec < wordTargetCount * 1.2) {
    suggestedRating = Rating.Easy;
  } else {
    suggestedRating = Rating.Good;
  }

  return {
    accuracy,
    items,
    suggestedRating,
    caseMismatches,
    punctuationWarnings,
    slotWarnings,
    targetWordCount: wordTargetCount,
    correctCount,
    missingCount,
    extraCount,
    misspelledCount,
    wrongFormCount,
  };
}
