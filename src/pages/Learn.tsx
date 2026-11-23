import { useState, useEffect, useMemo, useRef } from 'react';
import { Volume2, Check, ArrowRight, RotateCcw, BookOpen } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  LESSONS,
  SENTENCES,
  TEMPLATE_MAP,
  getSentenceLocationLabel,
} from '../data/templates';
import { SLOTS } from '../data/fillers';
import { gradeSentence, type GradeResult } from '../core/grader';
import { tokenizeTarget } from '../core/normalize';
import { isLessonUnlocked } from '../core/cards';
import { useProgress } from '../store/useProgress';
import { useSettings } from '../store/useSettings';
import { RichSentence } from '../components/RichSentence';
import { StoryLine } from '../components/StoryLine';
import { DiffResult } from '../components/DiffResult';

type LearnStep = 1 | 2 | 3 | 4;

const STEP_LABELS = ['1. 理解', '2. 首词提示', '3. 挖空默写', '4. 只看中文'];

const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'as', 'is', 'are',
  'be', 'it', 'you', 'your', 'i', 'my', 'me', 'we', 'this', 'that', 'and', 'or', 'by',
  'from', 'into', 'will', 'can', 'has', 'had', 'was', 'not', 'but',
]);

interface ClozeData {
  promptSegments: Array<{ type: 'text' | 'blank' | 'slot'; text: string; slotId?: string }>;
  hiddenWords: string[];
}

function buildCloze(en: string, seed: number): ClozeData {
  const tokens = tokenizeTarget(en);
  const contentIndices: number[] = [];
  tokens.forEach((tok, idx) => {
    if (tok.type === 'word' && !FUNCTION_WORDS.has(tok.normalized) && tok.raw.length >= 3) {
      contentIndices.push(idx);
    }
  });

  const targetHideCount = Math.max(1, Math.round(contentIndices.length * 0.6));
  const scored = contentIndices.map((idx, k) => ({
    idx,
    score: (idx * 37 + seed * 17 + k * 13) % 100,
  }));
  scored.sort((a, b) => a.score - b.score);
  const hiddenSet = new Set(scored.slice(0, targetHideCount).map((s) => s.idx));

  const promptSegments: ClozeData['promptSegments'] = [];
  const hiddenWords: string[] = [];

  tokens.forEach((tok, idx) => {
    if (tok.type === 'slot') {
      promptSegments.push({ type: 'slot', text: tok.raw, slotId: tok.slotId });
      if (tok.trailingPunct) {
        promptSegments.push({ type: 'text', text: tok.trailingPunct });
      }
    } else if (hiddenSet.has(idx)) {
      hiddenWords.push(tok.raw);
      promptSegments.push({ type: 'blank', text: tok.raw });
      if (tok.trailingPunct) {
        promptSegments.push({ type: 'text', text: tok.trailingPunct });
      }
    } else {
      promptSegments.push({ type: 'text', text: tok.raw + tok.trailingPunct });
    }
  });

  return { promptSegments, hiddenWords };
}

function speakSentence(en: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const spoken = en.replace(/\{\{(\w+)\}\}/g, (_, id: string) => SLOTS[id]?.filler ?? 'something');
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(spoken);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

export function LearnPage() {
  const [searchParams] = useSearchParams();
  const requestedLessonId = searchParams.get('lesson');

  const cards = useProgress((s) => s.cards);
  const graduateSentence = useProgress((s) => s.graduateSentence);
  const learnedToday = useProgress((s) => s.getTodayLearnedCount());
  const dailyNewLimit = useSettings((s) => s.dailyNewLimit);
  const requestRetention = useSettings((s) => s.requestRetention);
  const strictPunctuation = useSettings((s) => s.strictPunctuation);
  const slotMode = useSettings((s) => s.slotMode);
  const examDate = useSettings((s) => s.examDate);
  const unlockAllLessons = useSettings((s) => s.unlockAllLessons);

  const orderedUnlearned = useMemo(() => {
    const list: Array<{ sentenceId: string; lessonTitle: string; templateId?: string }> = [];
    const seen = new Set<string>();
    const lessonsToScan = requestedLessonId
      ? LESSONS.filter((l) => l.id === requestedLessonId)
      : LESSONS;

    for (const lesson of lessonsToScan) {
      if (!isLessonUnlocked(lesson.order, cards, unlockAllLessons) && !lesson.optional) continue;
      for (const sid of lesson.sentenceIds) {
        if (!seen.has(sid) && !cards[sid]?.learned) {
          seen.add(sid);
          list.push({
            sentenceId: sid,
            lessonTitle: lesson.title,
            templateId: lesson.templateId,
          });
        }
      }
    }
    return list;
  }, [cards, unlockAllLessons, requestedLessonId]);

  const remainingQuota = Math.max(0, dailyNewLimit - learnedToday);
  const currentItem = remainingQuota > 0 ? orderedUnlearned[0] : undefined;
  const currentSentence = currentItem ? SENTENCES[currentItem.sentenceId] : undefined;

  const [step, setStep] = useState<LearnStep>(1);
  const [countdown, setCountdown] = useState(5);
  const [input, setInput] = useState('');
  const [clozeInputs, setClozeInputs] = useState<string[]>([]);
  const [clozeSeed, setClozeSeed] = useState(1);
  const [feedback, setFeedback] = useState<{
    passed: boolean;
    message: string;
    gradeResult?: GradeResult;
  } | null>(null);
  const [shake, setShake] = useState(false);
  const [flashOk, setFlashOk] = useState(false);
  const [sessionGraduated, setSessionGraduated] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.title = currentSentence
      ? `学习 ${STEP_LABELS[step - 1]} · 小作文`
      : '学习 · 小作文';
  }, [currentSentence, step]);

  // R 快捷键朗读（焦点不在输入框时）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!currentSentence) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        speakSentence(currentSentence.en);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentSentence]);

  useEffect(() => {
    if (step !== 1 || !currentSentence) return;
    setCountdown(5);
    const timer = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step, currentSentence?.id]);

  const clozeData = useMemo(() => {
    if (!currentSentence) return null;
    return buildCloze(currentSentence.en, clozeSeed);
  }, [currentSentence, clozeSeed]);

  useEffect(() => {
    if (step === 3 && clozeData) {
      setClozeInputs(Array(clozeData.hiddenWords.length).fill(''));
    }
    if (step === 2 || step === 4) {
      setInput('');
      setTimeout(() => inputRef.current?.focus(), 60);
    }
    setFeedback(null);
  }, [step, currentSentence?.id, clozeData?.hiddenWords.length]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 260);
  };

  const triggerOk = () => {
    setFlashOk(true);
    setTimeout(() => setFlashOk(false), 450);
  };

  const handleStepSubmit = () => {
    if (!currentSentence) return;

    if (step === 2 || step === 4) {
      const res = gradeSentence(currentSentence.en, input, {
        slotMode,
        strictPunctuation,
      });

      if (res.accuracy >= 0.9) {
        triggerOk();
        if (step === 2) {
          setFeedback({ passed: true, message: '通过第 2 步，即将进入挖空默写。', gradeResult: res });
        } else {
          graduateSentence(currentSentence.id, { requestRetention, examDate });
          setSessionGraduated((n) => n + 1);
          setFeedback({
            passed: true,
            message: '全部 4 步通过！该句已加入 FSRS 复习队列。',
            gradeResult: res,
          });
        }
      } else {
        triggerShake();
        setFeedback({
          passed: false,
          message: `准确率 ${Math.round(res.accuracy * 100)}%（需 ≥ 90%），请退回上一步巩固后再试。`,
          gradeResult: res,
        });
      }
      return;
    }

    if (step === 3 && clozeData) {
      let correctBlanks = 0;
      clozeData.hiddenWords.forEach((expected, i) => {
        const actual = (clozeInputs[i] ?? '').trim().toLowerCase();
        if (actual === expected.toLowerCase()) {
          correctBlanks++;
        }
      });
      const acc = clozeData.hiddenWords.length > 0 ? correctBlanks / clozeData.hiddenWords.length : 1;
      if (acc >= 0.9) {
        triggerOk();
        setFeedback({
          passed: true,
          message: `挖空准确率 ${Math.round(acc * 100)}%，进入最后一步：只看中文整句默写。`,
        });
      } else {
        triggerShake();
        setFeedback({
          passed: false,
          message: `挖空答对 ${correctBlanks}/${clozeData.hiddenWords.length}（需 ≥ 90%），退回第 2 步重新巩固。`,
        });
      }
    }
  };

  const handleAdvanceOrFallback = () => {
    if (!feedback) return;
    if (feedback.passed) {
      if (step === 2) {
        setClozeSeed((s) => s + 1);
        setStep(3);
      } else if (step === 3) {
        setStep(4);
      } else if (step === 4) {
        setStep(1);
        setInput('');
        setFeedback(null);
      }
    } else {
      const prevStep = Math.max(1, step - 1) as LearnStep;
      setStep(prevStep);
      setFeedback(null);
    }
  };

  const activeTemplate = currentItem?.templateId
    ? TEMPLATE_MAP[currentItem.templateId as keyof typeof TEMPLATE_MAP]
    : undefined;

  if (!currentSentence || !currentItem) {
    return (
      <div className="main-content">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <BookOpen size={28} strokeWidth={1.5} style={{ color: 'var(--gold)', marginBottom: 12 }} />
          <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>
            {orderedUnlearned.length === 0 ? '当前课程句子已学完' : '今天的新句子学完了'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 24px' }}>
            {orderedUnlearned.length === 0
              ? '已解锁课程的句子均已进入 FSRS 复习队列，现在可以去复习或实战。'
              : `今日已学 ${learnedToday} / ${dailyNewLimit} 句新句（可在设置中调整上限）。`}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Link to="/review" className="btn-primary" style={{ textDecoration: 'none' }}>
              去复习队列
            </Link>
            <Link to="/today" className="btn-secondary" style={{ textDecoration: 'none' }}>
              返回今日首页
            </Link>
          </div>
        </div>
      </div>
    );
  }

  let blankCursor = 0;

  return (
    <div style={{ display: 'flex', gap: 32, width: '100%', justifyContent: 'center' }}>
      <div className="main-content">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--ink-muted)',
          }}
        >
          <span>{currentItem.lessonTitle}</span>
          <span className="tabular-nums">
            今日新句 {learnedToday} / {dailyNewLimit}
            {sessionGraduated > 0 ? `（本次已毕业 ${sessionGraduated} 句）` : ''}
          </span>
        </div>

        <div className="step-bar">
          {STEP_LABELS.map((label, idx) => {
            const sNum = idx + 1;
            const cls = sNum < step ? 'done' : sNum === step ? 'active' : '';
            return (
              <div key={label} className={`step-seg ${cls}`}>
                <div className="step-seg-line" />
                <span className="step-seg-label">{label}</span>
              </div>
            );
          })}
        </div>

        <div
          key={`${currentSentence.id}-${step}`}
          className={`card card-enter ${flashOk ? 'card-flash-ok' : ''}`}
          style={{ padding: 28 }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>
              {getSentenceLocationLabel(currentSentence.id)}
            </span>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => speakSentence(currentSentence.en)}
              title="朗读本句 (R)"
            >
              <Volume2 size={15} strokeWidth={1.5} />
              朗读
            </button>
          </div>

          {step === 1 && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'var(--body-size)',
                  lineHeight: 1.75,
                  marginBottom: 16,
                }}
              >
                <RichSentence
                  text={currentSentence.en}
                  resultWord={currentSentence.resultWord}
                  highlightResultWord
                />
              </div>

              <div className="zh-text" style={{ fontSize: 16, marginBottom: 20 }}>
                <RichSentence text={currentSentence.zh} />
              </div>

              {currentSentence.resultWord && (
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--ink-muted)',
                    padding: '10px 14px',
                    background: 'var(--surface-sunk)',
                    borderRadius: 'var(--radius-s)',
                    marginBottom: 20,
                  }}
                >
                  后半句结果词：
                  <span
                    className="result-word-highlight"
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--ink)' }}
                  >
                    {currentSentence.resultWord}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={countdown > 0}
                  onClick={() => setStep(2)}
                >
                  {countdown > 0 ? `先仔细读一遍（${countdown}s）` : '我记住了，下一步'}
                  {countdown === 0 && <ArrowRight size={16} strokeWidth={1.5} />}
                </button>
              </div>
            </div>
          )}

          {(step === 2 || step === 4) && (
            <div>
              <div className="zh-text" style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 14 }}>
                <RichSentence text={currentSentence.zh} />
              </div>

              {step === 2 && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-s)',
                    background: 'var(--gold-soft)',
                    color: 'var(--ink)',
                    fontSize: 14,
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginRight: 8 }}>
                    首词提示
                  </span>
                  <span style={{ fontFamily: 'var(--font-serif)' }}>{currentSentence.cue} …</span>
                </div>
              )}

              <textarea
                ref={inputRef}
                className={`drill-textarea ${shake ? 'input-shake' : ''}`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (feedback) handleAdvanceOrFallback();
                    else if (input.trim()) handleStepSubmit();
                  }
                }}
                placeholder="在此输入完整英文句子（槽位可写 [X] 或任意短语）..."
                disabled={Boolean(feedback)}
              />

              {!feedback ? (
                <div className="mobile-sticky-action" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={!input.trim()}
                    onClick={handleStepSubmit}
                  >
                    检查答案
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 16 }}>
                  {feedback.gradeResult && <DiffResult result={feedback.gradeResult} />}

                  <div
                    style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-s)',
                      background: feedback.passed ? 'var(--ok-soft)' : 'var(--err-soft)',
                      color: feedback.passed ? 'var(--ok)' : 'var(--err)',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {feedback.message}
                  </div>

                  {!feedback.passed && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-s)',
                        background: 'var(--surface-sunk)',
                        fontFamily: 'var(--font-serif)',
                        fontSize: 16,
                      }}
                    >
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-sans)', color: 'var(--ink-muted)', marginBottom: 4 }}>
                        参考原句
                      </div>
                      <RichSentence text={currentSentence.en} />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                    <button type="button" className="btn-primary" onClick={handleAdvanceOrFallback}>
                      {feedback.passed ? (
                        <>
                          <Check size={16} strokeWidth={1.5} />
                          {step === 4 ? '下一句' : '进入下一步'}
                        </>
                      ) : (
                        <>
                          <RotateCcw size={15} strokeWidth={1.5} />
                          退回上一步重做
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && clozeData && (
            <div>
              <div className="zh-text" style={{ fontSize: 16, marginBottom: 16 }}>
                <RichSentence text={currentSentence.zh} />
              </div>

              <div
                className={shake ? 'input-shake' : ''}
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'var(--body-size)',
                  lineHeight: 2.1,
                  padding: 18,
                  borderRadius: 'var(--radius-s)',
                  background: 'var(--surface-sunk)',
                }}
              >
                {clozeData.promptSegments.map((seg, idx) => {
                  if (seg.type === 'slot') {
                    return (
                      <span key={idx} style={{ marginRight: 5 }}>
                        <span className="slot-chip">{SLOTS[seg.slotId ?? '']?.label ?? seg.slotId}</span>
                      </span>
                    );
                  }
                  if (seg.type === 'text') {
                    return (
                      <span key={idx} style={{ marginRight: 5 }}>
                        {seg.text}
                      </span>
                    );
                  }
                  const bIdx = blankCursor++;
                  const expected = clozeData.hiddenWords[bIdx];
                  const val = clozeInputs[bIdx] ?? '';
                  const isCorrect = feedback
                    ? val.trim().toLowerCase() === expected.toLowerCase()
                    : null;

                  return (
                    <span key={idx} style={{ display: 'inline-block', marginRight: 6 }}>
                      <input
                        type="text"
                        value={val}
                        disabled={Boolean(feedback)}
                        onChange={(e) => {
                          const next = [...clozeInputs];
                          next[bIdx] = e.target.value;
                          setClozeInputs(next);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (feedback) handleAdvanceOrFallback();
                            else handleStepSubmit();
                          }
                        }}
                        style={{
                          width: `${Math.max(5, expected.length + 2)}ch`,
                          padding: '2px 6px',
                          fontFamily: 'var(--font-serif)',
                          fontSize: 'inherit',
                          border: 'none',
                          borderBottom: `2px solid ${
                            isCorrect === null
                              ? 'var(--gold)'
                              : isCorrect
                                ? 'var(--ok)'
                                : 'var(--err)'
                          }`,
                          background: isCorrect === false ? 'var(--err-soft)' : 'var(--surface)',
                          color: isCorrect === false ? 'var(--err)' : 'var(--ink)',
                          borderRadius: '3px 3px 0 0',
                        }}
                        aria-label={`第 ${bIdx + 1} 个空`}
                      />
                      {isCorrect === false && (
                        <span
                          style={{
                            fontSize: 12,
                            fontFamily: 'var(--font-serif)',
                            color: 'var(--ok)',
                            marginLeft: 4,
                          }}
                        >
                          ({expected})
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>

              {!feedback ? (
                <div className="mobile-sticky-action" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button type="button" className="btn-primary" onClick={handleStepSubmit}>
                    检查挖空
                  </button>
                </div>
              ) : (
                <div style={{ marginTop: 16 }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-s)',
                      background: feedback.passed ? 'var(--ok-soft)' : 'var(--err-soft)',
                      color: feedback.passed ? 'var(--ok)' : 'var(--err)',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {feedback.message}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                    <button type="button" className="btn-primary" onClick={handleAdvanceOrFallback}>
                      {feedback.passed ? '进入第 4 步：只看中文' : '退回第 2 步重做'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <aside className="aux-panel">
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', marginBottom: 10 }}>
            当前位置与故事线
          </div>
          {activeTemplate ? (
            <StoryLine
              nodes={activeTemplate.storyLine}
              activeIndex={currentSentence.storyNodeIndex ?? -1}
              detail={activeTemplate.storyLineDetail}
            />
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
              当前为通用骨架或换用零件，学完一次后所有引用它的模板都会同步生效。
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
