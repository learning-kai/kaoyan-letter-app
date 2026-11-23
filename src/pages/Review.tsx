import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Rating, type Grade } from 'ts-fsrs';
import {
  Eye,
  Volume2,
  ArrowLeft,
  CheckCircle2,
  PenTool,
  Keyboard,
  Lock,
  Layers,
  Shuffle,
} from 'lucide-react';
import { SENTENCES, TEMPLATE_MAP, getSentenceLocationLabel } from '../data/templates';
import { SLOTS } from '../data/fillers';
import { gradeSentence, type GradeResult } from '../core/grader';
import {
  isCardDue,
  getIntervalPreviews,
  interleaveQueue,
  requeueAgainCard,
} from '../core/scheduler';
import {
  PHRASE_CARDS,
  getUnlockedExtendedCards,
  buildExamSprintQueue,
} from '../core/cards';
import { useProgress } from '../store/useProgress';
import { useSettings, type InputMode } from '../store/useSettings';
import { RichSentence } from '../components/RichSentence';
import { DiffResult } from '../components/DiffResult';
import { GradeBar } from '../components/GradeBar';

type ExtendedTab = 'sentence' | 'P' | 'F' | 'O' | 'T' | 'E';

function speakSentence(en: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const spoken = en.replace(/\{\{(\w+)\}\}/g, (_, id: string) => SLOTS[id]?.filler ?? 'something');
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(spoken);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

export function ReviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');

  const cards = useProgress((s) => s.cards);
  const mistakes = useProgress((s) => s.mistakes);
  const submitReview = useProgress((s) => s.submitReview);
  const recordRecognition = useProgress((s) => s.recordRecognition);

  const requestRetention = useSettings((s) => s.requestRetention);
  const strictPunctuation = useSettings((s) => s.strictPunctuation);
  const slotMode = useSettings((s) => s.slotMode);
  const setSlotMode = useSettings((s) => s.setSlotMode);
  const defaultInputMode = useSettings((s) => s.inputMode);
  const examDate = useSettings((s) => s.examDate);
  const unlockAllLessons = useSettings((s) => s.unlockAllLessons);

  const [activeTab, setActiveTab] = useState<ExtendedTab>('sentence');
  const [inputMode, setInputMode] = useState<InputMode>(defaultInputMode);

  const initialQueue = useMemo(() => {
    const now = new Date();
    if (modeParam === 'mistakes') {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const ids = Object.values(cards)
        .filter((c) => {
          if (!c.learned) return false;
          const meta = mistakes[c.sentenceId];
          const recentAgain = meta?.lastAgainAt && new Date(meta.lastAgainAt).getTime() >= thirtyDaysAgo;
          const rate = c.reviewCount > 0 ? c.againCount / c.reviewCount : 0;
          return recentAgain || rate > 0.3;
        })
        .map((c) => c.sentenceId);
      return interleaveQueue(ids);
    }
    if (modeParam === 'sprint') {
      return interleaveQueue(buildExamSprintQueue(cards).topErrorSentenceIds);
    }
    const ids = Object.values(cards)
      .filter((c) => isCardDue(c, now))
      .map((c) => c.sentenceId);
    return interleaveQueue(ids);
  }, [cards, mistakes, modeParam]);

  const allLearnedIds = useMemo(() => {
    return interleaveQueue(
      Object.values(cards)
        .filter((c) => c.learned)
        .map((c) => c.sentenceId),
    );
  }, [cards]);

  const [queue, setQueue] = useState<string[]>(() => initialQueue);
  const [practiceAllMode, setPracticeAllMode] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [recordedFsrsSet, setRecordedFsrsSet] = useState<Set<string>>(() => new Set());
  const [input, setInput] = useState('');
  const [showCue, setShowCue] = useState(false);
  const [paperRevealed, setPaperRevealed] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [shake, setShake] = useState(false);
  const [flashOk, setFlashOk] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (queue.length === 0 && !practiceAllMode && initialQueue.length > 0 && cursor === 0) {
      setQueue(initialQueue);
    }
  }, [initialQueue, queue.length, practiceAllMode, cursor]);

  const currentId = queue[cursor];
  const currentSentence = currentId ? SENTENCES[currentId] : undefined;
  const currentCardState = currentId ? cards[currentId] : undefined;

  useEffect(() => {
    if (activeTab === 'sentence' && currentSentence) {
      document.title = `复习 ${cursor + 1}/${queue.length} · 小作文`;
    } else {
      document.title = '复习 · 小作文';
    }
  }, [activeTab, currentSentence, cursor, queue.length]);

  useEffect(() => {
    setInput('');
    setShowCue(false);
    setPaperRevealed(false);
    setGradeResult(null);
    setStartedAt(Date.now());
    if (inputMode === 'typing') {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [cursor, currentId, inputMode]);

  const previews = useMemo(() => {
    if (!currentCardState) return [];
    return getIntervalPreviews(currentCardState, { requestRetention, examDate });
  }, [currentCardState, requestRetention, examDate]);

  const extended = useMemo(
    () => getUnlockedExtendedCards(cards, unlockAllLessons),
    [cards, unlockAllLessons],
  );

  const [extIdx, setExtIdx] = useState(0);
  const [extInput, setExtInput] = useState('');
  const [extFeedback, setExtFeedback] = useState<string | null>(null);
  const [orderPicked, setOrderPicked] = useState<string[]>([]);
  const [essayText, setEssayText] = useState('');
  const [essayResults, setEssayResults] = useState<Array<{ zh: string; result: GradeResult }> | null>(null);

  const resetExtCard = (nextIndex = 0) => {
    setExtIdx(nextIndex);
    setExtInput('');
    setExtFeedback(null);
    setOrderPicked([]);
    setEssayText('');
    setEssayResults(null);
  };

  const handleSubmitAnswer = () => {
    if (!currentSentence || !input.trim()) return;
    const durationSec = (Date.now() - startedAt) / 1000;
    const res = gradeSentence(currentSentence.en, input, {
      slotMode,
      strictPunctuation,
      usedHint: showCue,
      durationSec,
    });
    setGradeResult(res);
    if (res.accuracy >= 0.9) {
      setFlashOk(true);
      setTimeout(() => setFlashOk(false), 450);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 260);
    }
  };

  const handleRate = (rating: Grade) => {
    if (!currentId) return;
    if (!recordedFsrsSet.has(currentId)) {
      submitReview(currentId, rating, { requestRetention, examDate }, gradeResult?.items);
      setRecordedFsrsSet((prev) => new Set(prev).add(currentId));
    }
    if (rating === Rating.Again) {
      setQueue((prev) => requeueAgainCard(prev, cursor, currentId, 4));
    }
    setCursor((c) => c + 1);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/today');
        return;
      }
      if (activeTab !== 'sentence' || !currentSentence) return;

      const tag = (e.target as HTMLElement | null)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';

      if ((e.key === 'r' || e.key === 'R') && !inInput) {
        e.preventDefault();
        speakSentence(currentSentence.en);
        return;
      }

      const isRevealed = inputMode === 'paper' ? paperRevealed : Boolean(gradeResult);

      if (e.key === 'Tab' && !isRevealed) {
        e.preventDefault();
        setShowCue(true);
        return;
      }

      if (e.key === ' ' && inputMode === 'paper' && !paperRevealed && !inInput) {
        e.preventDefault();
        setPaperRevealed(true);
        return;
      }

      if (isRevealed) {
        if (e.key === 'Enter' && gradeResult) {
          e.preventDefault();
          handleRate(gradeResult.suggestedRating as Grade);
        } else if (e.key === '1') {
          e.preventDefault();
          handleRate(Rating.Again);
        } else if (e.key === '2') {
          e.preventDefault();
          handleRate(Rating.Hard);
        } else if (e.key === '3') {
          e.preventDefault();
          handleRate(Rating.Good);
        } else if (e.key === '4') {
          e.preventDefault();
          handleRate(Rating.Easy);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const progressPct = queue.length > 0 ? Math.round(((cursor + 1) / queue.length) * 100) : 0;

  return (
    <div className="focus-shell">
      <div className="focus-topbar">
        <Link to="/today" className="btn-ghost" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} strokeWidth={1.5} />
          退出专注 (Esc)
        </Link>

        {activeTab === 'sentence' && currentSentence && (
          <div style={{ flex: 1, maxWidth: 260 }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {activeTab === 'sentence' && (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setInputMode(inputMode === 'typing' ? 'paper' : 'typing')}
                title="切换打字模式或纸笔模式"
              >
                {inputMode === 'typing' ? (
                  <>
                    <Keyboard size={14} strokeWidth={1.5} />
                    打字
                  </>
                ) : (
                  <>
                    <PenTool size={14} strokeWidth={1.5} />
                    纸笔
                  </>
                )}
              </button>
              {inputMode === 'typing' && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSlotMode(slotMode === 'frame' ? 'fill' : 'frame')}
                >
                  {slotMode === 'frame' ? '框架' : '实填'}
                </button>
              )}
              {currentSentence && (
                <span className="tabular-nums" style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                  {cursor + 1} / {queue.length}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* 卡片类型切换条 */}
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 18,
        }}
      >
        {(
          [
            {
              id: 'sentence',
              label:
                modeParam === 'mistakes'
                  ? '错题队列'
                  : modeParam === 'sprint'
                    ? '冲刺队列'
                    : 'S 句子复习',
            },
            { id: 'P', label: 'P 短语卡', locked: !extended.phraseUnlocked },
            { id: 'F', label: 'F 词性卡', locked: extended.formCards.length === 0 },
            { id: 'O', label: 'O 排序卡', locked: extended.orderCards.length === 0 },
            { id: 'T', label: 'T 识别卡', locked: !extended.recognitionUnlocked },
            { id: 'E', label: 'E 整篇卡', locked: extended.essayTemplateIds.length === 0 },
          ] as Array<{ id: ExtendedTab; label: string; locked?: boolean }>
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn-secondary ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(t.id);
              resetExtCard(0);
            }}
            style={{ height: 32, fontSize: 12, opacity: t.locked ? 0.65 : 1 }}
          >
            {t.locked && <Lock size={12} strokeWidth={1.5} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* S 句子卡复习 */}
      {activeTab === 'sentence' &&
        (!currentSentence || !currentCardState ? (
          <div className="card" style={{ width: '100%', maxWidth: 560, textAlign: 'center', padding: '48px 28px' }}>
            <CheckCircle2 size={28} strokeWidth={1.5} style={{ color: 'var(--ok)', marginBottom: 12 }} />
            <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>今天的复习做完了</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: '0 0 24px' }}>
              {allLearnedIds.length === 0
                ? '还没有已学习的句子。先去学习页完成 4 步学习，就会自动进入复习队列。'
                : '可以去实战写一篇，或者明天再来。'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10 }}>
              <Link to="/exam" className="btn-primary" style={{ textDecoration: 'none' }}>
                去实战写一篇
              </Link>
              <Link to="/learn" className="btn-secondary" style={{ textDecoration: 'none' }}>
                去学新句子
              </Link>
              {allLearnedIds.length > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setPracticeAllMode(true);
                    setQueue(allLearnedIds);
                    setCursor(0);
                    setRecordedFsrsSet(new Set());
                  }}
                >
                  提前加练已学句子（{allLearnedIds.length} 张）
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            key={`${currentId}-${cursor}`}
            className={`card card-enter ${flashOk ? 'card-flash-ok' : ''}`}
            style={{ width: '100%', maxWidth: 720, padding: 32 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>
                {getSentenceLocationLabel(currentSentence.id)}
              </span>
              {recordedFsrsSet.has(currentId) && (
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'var(--warn-soft)',
                    color: 'var(--warn)',
                  }}
                >
                  本轮重考
                </span>
              )}
            </div>

            <div className="zh-text" style={{ fontSize: 20, lineHeight: 1.65, marginBottom: 16 }}>
              <RichSentence text={currentSentence.zh} />
            </div>

            <div style={{ marginBottom: 16 }}>
              {showCue ? (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-s)',
                    background: 'var(--gold-soft)',
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginRight: 8 }}>
                    首词提示
                  </span>
                  <span style={{ fontFamily: 'var(--font-serif)' }}>{currentSentence.cue} …</span>
                </div>
              ) : (
                !(inputMode === 'paper' ? paperRevealed : gradeResult) && (
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setShowCue(true)}
                    style={{ paddingLeft: 0 }}
                  >
                    <Eye size={14} strokeWidth={1.5} />
                    显示首词提示（Tab，使用后评分降一档）
                  </button>
                )
              )}
            </div>

            {inputMode === 'paper' ? (
              <div>
                {!paperRevealed ? (
                  <div
                    style={{
                      padding: '28px 20px',
                      borderRadius: 'var(--radius-s)',
                      background: 'var(--surface-sunk)',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--ink-muted)' }}>
                      在纸上手写完本句英文后，按空格键或点击下方按钮对照答案。
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setPaperRevealed(true)}
                    >
                      显示标准答案（Space）
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        padding: '16px 18px',
                        borderRadius: 'var(--radius-s)',
                        background: 'var(--surface-sunk)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>标准原句（对照纸面自评）</span>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => speakSentence(currentSentence.en)}
                        >
                          <Volume2 size={14} strokeWidth={1.5} />
                          朗读 (R)
                        </button>
                      </div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--body-size)', lineHeight: 1.75 }}>
                        <RichSentence
                          text={currentSentence.en}
                          resultWord={currentSentence.resultWord}
                          highlightResultWord
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>
                        对照后按 1–4 键或点击下方按钮自评
                      </div>
                      <GradeBar
                        previews={previews}
                        suggestedRating={showCue ? Rating.Hard : Rating.Good}
                        onSelect={handleRate}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  ref={inputRef}
                  className={`drill-textarea ${shake ? 'input-shake' : ''}`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !gradeResult) {
                      e.preventDefault();
                      handleSubmitAnswer();
                    }
                  }}
                  placeholder={
                    slotMode === 'frame'
                      ? '输入整句英文（槽位可写 [X]、[] 或任意短语）...'
                      : '实填模式：输入整句英文并在槽位填入符合词性的内容...'
                  }
                  disabled={Boolean(gradeResult)}
                />

                {!gradeResult ? (
                  <div className="mobile-sticky-action" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={!input.trim()}
                      onClick={handleSubmitAnswer}
                    >
                      提交检查（Enter）
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: 20 }}>
                    <DiffResult result={gradeResult} />

                    <div
                      style={{
                        marginTop: 14,
                        padding: '14px 16px',
                        borderRadius: 'var(--radius-s)',
                        background: 'var(--surface)',
                        border: '1px solid var(--line)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>标准原句</span>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => speakSentence(currentSentence.en)}
                          style={{ padding: '2px 6px' }}
                        >
                          <Volume2 size={14} strokeWidth={1.5} />
                          朗读 (R)
                        </button>
                      </div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.7 }}>
                        <RichSentence
                          text={currentSentence.en}
                          resultWord={currentSentence.resultWord}
                          highlightResultWord
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>
                        金框为系统建议评分（按 Enter 直接接受，或按 1–4 改评）
                      </div>
                      <GradeBar
                        previews={previews}
                        suggestedRating={gradeResult.suggestedRating}
                        onSelect={handleRate}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

      {/* P 短语卡 */}
      {activeTab === 'P' && (
        <div className="card" style={{ width: '100%', maxWidth: 720, padding: 28 }}>
          {!extended.phraseUnlocked ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)', fontSize: 14 }}>
              完成「第 1 课 · L1 通用骨架」后自动解锁目的动词短语卡（或在设置中开启「解锁全部」）。
            </div>
          ) : (
            (() => {
              const card = PHRASE_CARDS[extIdx % PHRASE_CARDS.length];
              return (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginBottom: 12 }}>
                    P 短语卡 · {(extIdx % PHRASE_CARDS.length) + 1} / {PHRASE_CARDS.length}
                  </div>
                  <div className="zh-text" style={{ fontSize: 19, marginBottom: 8 }}>
                    {card.prompt}
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--ink-muted)', marginBottom: 16 }}>
                    With this letter, I would like to ______ [题目关键词].
                  </div>
                  <input
                    type="text"
                    className="field-input"
                    style={{ width: '100%', fontFamily: 'var(--font-serif)', fontSize: 18, padding: 12 }}
                    value={extInput}
                    onChange={(e) => setExtInput(e.target.value)}
                    placeholder="写出对应的目的动词短语..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !extFeedback && extInput.trim()) {
                        const ok =
                          extInput.trim().toLowerCase().replace(/\s+/g, ' ') ===
                          card.answer.toLowerCase();
                        setExtFeedback(ok ? '正确！' : `参考答案：${card.answer}`);
                      }
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    {extFeedback ? (
                      <span style={{ fontSize: 14, color: extFeedback === '正确！' ? 'var(--ok)' : 'var(--warn)' }}>
                        {extFeedback}
                      </span>
                    ) : (
                      <span />
                    )}
                    {!extFeedback ? (
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={!extInput.trim()}
                        onClick={() => {
                          const ok =
                            extInput.trim().toLowerCase().replace(/\s+/g, ' ') ===
                            card.answer.toLowerCase();
                          setExtFeedback(ok ? '正确！' : `参考答案：${card.answer}`);
                        }}
                      >
                        检查
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => resetExtCard((extIdx + 1) % PHRASE_CARDS.length)}
                      >
                        下一张
                      </button>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* F 词性卡 */}
      {activeTab === 'F' && (
        <div className="card" style={{ width: '100%', maxWidth: 720, padding: 28 }}>
          {extended.formCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)', fontSize: 14 }}>
              对应模板句子毕业后自动解锁词性卡（或在设置中开启「解锁全部」）。
            </div>
          ) : (
            (() => {
              const card = extended.formCards[extIdx % extended.formCards.length];
              return (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginBottom: 12 }}>
                    F 词性卡 · {(extIdx % extended.formCards.length) + 1} / {extended.formCards.length}
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.75, marginBottom: 12 }}>
                    {card.contextBefore}
                    <span className="slot-chip">______ ({card.baseHint})</span>
                    {card.contextAfter}
                  </div>
                  <input
                    type="text"
                    className="field-input"
                    style={{ width: '100%', fontFamily: 'var(--font-serif)', fontSize: 18, padding: 12 }}
                    value={extInput}
                    onChange={(e) => setExtInput(e.target.value)}
                    placeholder="填入正确词形..."
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                    {extFeedback ? (
                      <div style={{ fontSize: 13, color: extFeedback.startsWith('正确') ? 'var(--ok)' : 'var(--warn)' }}>
                        <div>{extFeedback}</div>
                        <div style={{ color: 'var(--ink-muted)', marginTop: 2 }}>{card.posNote}</div>
                      </div>
                    ) : (
                      <span />
                    )}
                    {!extFeedback ? (
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={!extInput.trim()}
                        onClick={() => {
                          const ok = extInput.trim().toLowerCase() === card.answer.toLowerCase();
                          setExtFeedback(ok ? '正确！词形准确。' : `应填：${card.answer}`);
                        }}
                      >
                        检查
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => resetExtCard((extIdx + 1) % extended.formCards.length)}
                      >
                        下一张
                      </button>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* O 排序卡 */}
      {activeTab === 'O' && (
        <div className="card" style={{ width: '100%', maxWidth: 720, padding: 28 }}>
          {extended.orderCards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)', fontSize: 14 }}>
              学完某类模板的所有主体句后自动解锁故事线排序卡（或在设置中开启「解锁全部」）。
            </div>
          ) : (
            (() => {
              const card = extended.orderCards[extIdx % extended.orderCards.length];
              const shuffled = [...card.nodes].sort(
                (a, b) => ((a.charCodeAt(0) + extIdx) % 7) - ((b.charCodeAt(0) + extIdx) % 7),
              );
              const remaining = shuffled.filter((n) => !orderPicked.includes(n));

              return (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginBottom: 10 }}>
                    O 故事线排序卡 · {card.templateName}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 16 }}>
                    依次点击下列节点，按正确逻辑还原「{card.templateName}」的主体故事线：
                  </div>

                  <div
                    style={{
                      minHeight: 52,
                      padding: 12,
                      borderRadius: 'var(--radius-s)',
                      background: 'var(--surface-sunk)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 14,
                    }}
                  >
                    {orderPicked.length === 0 ? (
                      <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>点击下方节点按顺序填入...</span>
                    ) : (
                      orderPicked.map((node, i) => (
                        <button
                          key={node}
                          type="button"
                          className="btn-secondary active"
                          onClick={() => {
                            if (extFeedback) return;
                            setOrderPicked(orderPicked.filter((x) => x !== node));
                          }}
                        >
                          {i + 1}. {node}
                        </button>
                      ))
                    )}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                    {remaining.map((node) => (
                      <button
                        key={node}
                        type="button"
                        className="btn-secondary"
                        onClick={() => setOrderPicked([...orderPicked, node])}
                      >
                        <Shuffle size={12} strokeWidth={1.5} />
                        {node}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {extFeedback ? (
                      <span style={{ fontSize: 13, color: extFeedback.startsWith('完全正确') ? 'var(--ok)' : 'var(--err)' }}>
                        {extFeedback}
                      </span>
                    ) : (
                      <span />
                    )}
                    {!extFeedback ? (
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={orderPicked.length !== card.nodes.length}
                        onClick={() => {
                          const ok = orderPicked.every((n, i) => n === card.nodes[i]);
                          setExtFeedback(
                            ok ? '完全正确！故事线清晰。' : `正确顺序：${card.nodes.join(' → ')}`,
                          );
                        }}
                      >
                        检查顺序
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => resetExtCard((extIdx + 1) % extended.orderCards.length)}
                      >
                        下一张
                      </button>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* T 识别卡 */}
      {activeTab === 'T' && (
        <div className="card" style={{ width: '100%', maxWidth: 720, padding: 28 }}>
          {!extended.recognitionUnlocked ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)', fontSize: 14 }}>
              学完 3 个模板类型后自动解锁题型识别卡（或在设置中开启「解锁全部」）。
            </div>
          ) : (
            (() => {
              const prompt = extended.recognitionPrompts[extIdx % extended.recognitionPrompts.length];
              return (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600, marginBottom: 12 }}>
                    T 题型识别卡 · {(extIdx % extended.recognitionPrompts.length) + 1} /{' '}
                    {extended.recognitionPrompts.length}
                    {prompt.tricky && ' · 易混题'}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontSize: 16,
                      lineHeight: 1.7,
                      padding: 16,
                      borderRadius: 'var(--radius-s)',
                      background: 'var(--surface-sunk)',
                      marginBottom: 18,
                    }}
                  >
                    {prompt.directions}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {Object.values(TEMPLATE_MAP).map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        className="btn-secondary"
                        disabled={Boolean(extFeedback)}
                        onClick={() => {
                          const ok = tpl.id === prompt.templateId;
                          recordRecognition(ok);
                          const correctName = TEMPLATE_MAP[prompt.templateId].name;
                          setExtFeedback(
                            ok
                              ? `判断正确：${correctName}。${prompt.trickyHint ? ` ${prompt.trickyHint}` : ''}`
                              : `应为「${correctName}」。${prompt.trickyHint ?? ''}`,
                          );
                        }}
                      >
                        {tpl.name}
                      </button>
                    ))}
                  </div>
                  {extFeedback && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          fontSize: 13,
                          color: extFeedback.startsWith('判断正确') ? 'var(--ok)' : 'var(--err)',
                        }}
                      >
                        {extFeedback}
                      </span>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => resetExtCard((extIdx + 1) % extended.recognitionPrompts.length)}
                      >
                        下一题
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* E 整篇卡 */}
      {activeTab === 'E' && (
        <div className="card" style={{ width: '100%', maxWidth: 720, padding: 28 }}>
          {extended.essayTemplateIds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--ink-muted)', fontSize: 14 }}>
              某类模板所有句子稳定度 ≥ 3 天后解锁整篇默写卡（或在设置中开启「解锁全部」）。
            </div>
          ) : (
            (() => {
              const tplId = extended.essayTemplateIds[extIdx % extended.essayTemplateIds.length];
              const tpl = TEMPLATE_MAP[tplId];
              const targetSentences = tpl.sentenceIds
                .map((sid) => SENTENCES[sid])
                .filter((s) => s.role !== 'heading' && s.role !== 'signoff');

              return (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>
                      <Layers size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
                      E 整篇默写 · {tpl.name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                      故事线：{tpl.storyLine.join(' → ')}
                    </span>
                  </div>

                  <textarea
                    className="exam-paper"
                    value={essayText}
                    onChange={(e) => setEssayText(e.target.value)}
                    placeholder={`只看类型名和故事线，默写「${tpl.name}」全文（槽位可用 [X] 代替）...`}
                    disabled={Boolean(essayResults)}
                  />

                  {!essayResults ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={!essayText.trim()}
                        onClick={() => {
                          const userLines = essayText
                            .split(/(?<=[.!?])\s+|\n+/)
                            .map((s) => s.trim())
                            .filter(Boolean);
                          const aligned = targetSentences.map((s, i) => ({
                            zh: s.zh,
                            result: gradeSentence(s.en, userLines[i] ?? '', {
                              slotMode: 'frame',
                              strictPunctuation,
                            }),
                          }));
                          setEssayResults(aligned);
                        }}
                      >
                        提交逐句比对
                      </button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {essayResults.map((row, idx) => (
                        <div key={idx} style={{ padding: 12, borderRadius: 'var(--radius-s)', border: '1px solid var(--line)' }}>
                          <div className="zh-text" style={{ fontSize: 13, marginBottom: 6 }}>
                            {idx + 1}. <RichSentence text={row.zh} />
                          </div>
                          <DiffResult result={row.result} />
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => resetExtCard((extIdx + 1) % extended.essayTemplateIds.length)}
                        >
                          下一篇
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}
    </div>
  );
}
