import { LESSONS, SENTENCES, TEMPLATES } from '../data/templates';
import { PROMPTS, type ExamPrompt } from '../data/prompts';
import type { TemplateId } from '../data/types';
import type { SentenceCardState } from './scheduler';

export interface PhraseCard {
  id: string;
  templateName: string;
  prompt: string;
  answer: string;
}

export interface FormCard {
  id: string;
  sentenceId: string;
  contextBefore: string;
  contextAfter: string;
  baseHint: string;
  answer: string;
  posNote: string;
}

export interface OrderCard {
  id: string;
  templateId: TemplateId;
  templateName: string;
  nodes: string[];
}

export const PHRASE_CARDS: PhraseCard[] = [
  { id: 'P.suggest', templateName: '建议信', prompt: '目的句 · 建议信（提建议）', answer: 'offer some suggestions on' },
  { id: 'P.invite', templateName: '邀请信', prompt: '目的句 · 邀请信（邀请你）', answer: 'invite you to' },
  { id: 'P.apology', templateName: '道歉信', prompt: '目的句 · 道歉信（道歉）', answer: 'apologize for' },
  { id: 'P.thanks', templateName: '感谢信', prompt: '目的句 · 感谢信（表达感激）', answer: 'express my gratitude for' },
  { id: 'P.intro', templateName: '介绍类', prompt: '目的句 · 介绍类（介绍给你）', answer: 'introduce ... to you' },
  { id: 'P.congrats', templateName: '祝贺信', prompt: '目的句 · 祝贺信（致以祝贺）', answer: 'extend my warmest congratulations on' },
];

export const FORM_CARDS: FormCard[] = [
  {
    id: 'F.apology.doing',
    sentenceId: 'apology.body2',
    contextBefore: 'Furthermore, as a result of ',
    contextAfter: ', you had to face a lot of inconvenience.',
    baseHint: 'break my promise',
    answer: 'breaking my promise',
    posNote: 'as a result of 后接 doing 或名词',
  },
  {
    id: 'F.apology.verb',
    sentenceId: 'apology.body1',
    contextBefore: 'First and foremost, my decision to ',
    contextAfter: ' in relation to our appointment turned out to be inconsiderate.',
    baseHint: 'breaking my promise',
    answer: 'break my promise',
    posNote: 'my decision to 后接动词原形',
  },
  {
    id: 'F.invite.date',
    sentenceId: 'invite.body1',
    contextBefore: 'First and foremost, the event will be held at the hall on ',
    contextAfter: ', which will offer you valuable experience.',
    baseHint: '填周六（不要加 next）',
    answer: 'Saturday',
    posNote: 'on 后填 Saturday / May 10，不能填 next Saturday',
  },
  {
    id: 'F.invite.verb',
    sentenceId: 'invite.body2',
    contextBefore: 'your participation would be greatly appreciated, as it will enable you to ',
    contextAfter: '.',
    baseHint: 'broadening your horizons',
    answer: 'broaden your horizons',
    posNote: 'enable you to 后接动词原形',
  },
  {
    id: 'F.suggest.verb',
    sentenceId: 'suggest.body3',
    contextBefore: 'Only in this way can you truly ',
    contextAfter: '.',
    baseHint: 'making remarkable progress',
    answer: 'make remarkable progress',
    posNote: 'can you truly 后接动词原形',
  },
];

export const ORDER_CARDS: OrderCard[] = TEMPLATES.map((t) => ({
  id: `O.${t.id}`,
  templateId: t.id,
  templateName: t.name,
  nodes: t.storyLine,
}));

export function isLessonCompleted(lessonId: string, cards: Record<string, SentenceCardState>): boolean {
  const lesson = LESSONS.find((l) => l.id === lessonId);
  if (!lesson) return false;
  return lesson.sentenceIds.every((sid) => Boolean(cards[sid]?.learned));
}

export function isLessonUnlocked(
  lessonOrder: number,
  cards: Record<string, SentenceCardState>,
  unlockAll: boolean,
): boolean {
  if (unlockAll || lessonOrder === 1) return true;
  const prev = LESSONS.find((l) => l.order === lessonOrder - 1);
  if (!prev) return true;
  return isLessonCompleted(prev.id, cards);
}

export function getUnlockedExtendedCards(
  cards: Record<string, SentenceCardState>,
  unlockAll: boolean,
): {
  phraseUnlocked: boolean;
  formCards: FormCard[];
  orderCards: OrderCard[];
  essayTemplateIds: TemplateId[];
  recognitionUnlocked: boolean;
  recognitionPrompts: ExamPrompt[];
} {
  const l1Done = unlockAll || isLessonCompleted('lesson-1', cards);
  const formCards = unlockAll
    ? FORM_CARDS
    : FORM_CARDS.filter((fc) => Boolean(cards[fc.sentenceId]?.learned));

  const orderCards = ORDER_CARDS.filter((oc) => {
    if (unlockAll) return true;
    const tpl = TEMPLATES.find((t) => t.id === oc.templateId);
    if (!tpl) return false;
    const bodyIds = tpl.sentenceIds.filter((sid) => SENTENCES[sid]?.role === 'body');
    return bodyIds.every((sid) => Boolean(cards[sid]?.learned));
  });

  const essayTemplateIds = TEMPLATES.filter((tpl) => {
    if (unlockAll) return true;
    const trainableIds = tpl.sentenceIds.filter(
      (sid) => SENTENCES[sid]?.role !== 'heading' && SENTENCES[sid]?.role !== 'signoff',
    );
    return trainableIds.every((sid) => (cards[sid]?.card.stability ?? 0) >= 3);
  }).map((t) => t.id);

  // 学完 3 个类型（对应第 3、4、5 课及以上完成至少 3 课）解锁 T 识别卡
  const completedTemplateLessons = LESSONS.filter(
    (l) => l.templateId && isLessonCompleted(l.id, cards),
  ).length;
  const recognitionUnlocked = unlockAll || completedTemplateLessons >= 3;

  return {
    phraseUnlocked: l1Done,
    formCards,
    orderCards,
    essayTemplateIds,
    recognitionUnlocked,
    recognitionPrompts: PROMPTS,
  };
}

/**
 * 考前 3 天冲刺队列：所有 E 整篇卡对应的模板 + 历史错误率最高的 10 张句子卡
 */
export function buildExamSprintQueue(cards: Record<string, SentenceCardState>): {
  topErrorSentenceIds: string[];
  allTemplateIds: TemplateId[];
} {
  const learnedList = Object.values(cards).filter((c) => c.learned);
  learnedList.sort((a, b) => {
    const rateA = a.reviewCount > 0 ? a.againCount / a.reviewCount : 0;
    const rateB = b.reviewCount > 0 ? b.againCount / b.reviewCount : 0;
    if (rateB !== rateA) return rateB - rateA;
    return b.againCount - a.againCount;
  });

  return {
    topErrorSentenceIds: learnedList.slice(0, 10).map((c) => c.sentenceId),
    allTemplateIds: TEMPLATES.filter((t) => !t.optional).map((t) => t.id),
  };
}
