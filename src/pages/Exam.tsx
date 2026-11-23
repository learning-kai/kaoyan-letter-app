import { useState, useEffect, useMemo } from 'react';
import { Clock, Shuffle, Check, AlertCircle, RotateCcw } from 'lucide-react';
import { PROMPTS, type ExamPrompt } from '../data/prompts';
import { TEMPLATES, TEMPLATE_MAP, SENTENCES } from '../data/templates';
import type { TemplateId } from '../data/types';
import { gradeSentence, type GradeResult } from '../core/grader';
import { useProgress } from '../store/useProgress';
import { useSettings } from '../store/useSettings';
import { StoryLine } from '../components/StoryLine';
import { DiffResult } from '../components/DiffResult';
import { RichSentence } from '../components/RichSentence';

type ExamPhase = 'select' | 'identify' | 'write' | 'result';

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function formatMMSS(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function ExamPage() {
  const recordRecognition = useProgress((s) => s.recordRecognition);
  const addExamRecord = useProgress((s) => s.addExamRecord);
  const strictPunctuation = useSettings((s) => s.strictPunctuation);

  const [filterType, setFilterType] = useState<TemplateId | 'all' | 'tricky'>('all');
  const [phase, setPhase] = useState<ExamPhase>('select');
  const [prompt, setPrompt] = useState<ExamPrompt | null>(null);

  const [idSecondsLeft, setIdSecondsLeft] = useState(20);
  const [pickedType, setPickedType] = useState<TemplateId | null>(null);
  const [recognizedCorrect, setRecognizedCorrect] = useState(false);

  const [writeElapsedSec, setWriteElapsedSec] = useState(0);
  const [essay, setEssay] = useState('');

  const [alignedResults, setAlignedResults] = useState<
    Array<{ sentenceId: string; zh: string; en: string; result: GradeResult }>
  >([]);

  useEffect(() => {
    document.title = phase === 'write' ? `实战 ${formatMMSS(writeElapsedSec)} · 小作文` : '实战 · 小作文';
  }, [phase, writeElapsedSec]);

  useEffect(() => {
    if (phase !== 'identify' || pickedType) return;
    const timer = window.setInterval(() => {
      setIdSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, pickedType]);

  useEffect(() => {
    if (phase !== 'write') return;
    const timer = window.setInterval(() => {
      setWriteElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  const candidatePrompts = useMemo(() => {
    if (filterType === 'all') return PROMPTS;
    if (filterType === 'tricky') return PROMPTS.filter((p) => p.tricky);
    return PROMPTS.filter((p) => p.templateId === filterType);
  }, [filterType]);

  const startRandomPrompt = (chosen?: ExamPrompt) => {
    const target =
      chosen ?? candidatePrompts[Math.floor(Math.random() * candidatePrompts.length)] ?? PROMPTS[0];
    setPrompt(target);
    setPickedType(null);
    setRecognizedCorrect(false);
    setIdSecondsLeft(20);
    setWriteElapsedSec(0);
    setEssay('');
    setAlignedResults([]);
    setPhase('identify');
  };

  const handlePickType = (tid: TemplateId) => {
    if (!prompt || pickedType) return;
    const ok = tid === prompt.templateId && idSecondsLeft > 0;
    setPickedType(tid);
    setRecognizedCorrect(ok);
    recordRecognition(ok);
  };

  const handleSubmitEssay = () => {
    if (!prompt) return;
    const tpl = TEMPLATE_MAP[prompt.templateId];
    const coreSentenceIds = tpl.sentenceIds.filter(
      (sid) => SENTENCES[sid].role !== 'heading' && SENTENCES[sid].role !== 'signoff',
    );

    const rawLines = essay
      .split('\n')
      .map((l) => l.trim())
      .filter(
        (l) =>
          l.length > 0 &&
          !/^dear\b/i.test(l) &&
          !/^notice$/i.test(l) &&
          !/^yours\s+sincerely/i.test(l) &&
          !/^li\s+ming$/i.test(l) &&
          !/^the\s+students/i.test(l),
      );

    const userSentences = rawLines
      .join(' ')
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    let uCursor = 0;
    const aligned = coreSentenceIds.map((sid) => {
      const target = SENTENCES[sid];
      const expectedSentenceCount = (target.en.match(/[.!?]/g) ?? []).length || 1;
      const slice = userSentences.slice(uCursor, uCursor + expectedSentenceCount).join(' ');
      uCursor += expectedSentenceCount;
      const result = gradeSentence(target.en, slice, {
        slotMode: 'frame',
        strictPunctuation,
      });
      return { sentenceId: sid, zh: target.zh, en: target.en, result };
    });

    const avgAccuracy =
      aligned.length > 0
        ? aligned.reduce((acc, r) => acc + r.result.accuracy, 0) / aligned.length
        : 0;

    setAlignedResults(aligned);
    addExamRecord({
      id: `exam-${Date.now()}`,
      date: new Date().toISOString(),
      promptId: prompt.id,
      templateId: prompt.templateId,
      recognizedCorrect,
      durationMin: Number((writeElapsedSec / 60).toFixed(2)),
      wordCount: countWords(essay),
      avgAccuracy: Number(avgAccuracy.toFixed(4)),
    });
    setPhase('result');
  };

  const activeTemplate = prompt ? TEMPLATE_MAP[prompt.templateId] : null;
  const remainingSec = Math.max(0, 900 - writeElapsedSec);
  const words = countWords(essay);

  return (
    <div className="main-content">
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
          考场实战模拟
        </h1>
        <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>
          21 道考研英语一小作文模拟题（含 6 道易混题）· 20 秒判型 → 10 分钟目标计时套写
        </div>
      </div>

      {phase === 'select' && (
        <div className="card" style={{ padding: 28 }}>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>选择抽题范围</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            <button
              type="button"
              className={`btn-secondary ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              全部 21 题
            </button>
            <button
              type="button"
              className={`btn-secondary ${filterType === 'tricky' ? 'active' : ''}`}
              onClick={() => setFilterType('tricky')}
            >
              仅易混题（6 题）
            </button>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`btn-secondary ${filterType === t.id ? 'active' : ''}`}
                onClick={() => setFilterType(t.id)}
              >
                {t.name}
              </button>
            ))}
          </div>

          <button type="button" className="btn-primary" onClick={() => startRandomPrompt()}>
            <Shuffle size={16} strokeWidth={1.5} />
            随机抽题开始实战
          </button>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 10 }}>
              或直接挑选一道题目（共 {candidatePrompts.length} 道）：
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {candidatePrompts.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => startRandomPrompt(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-s)',
                    border: '1px solid var(--line)',
                    background: 'var(--surface-sunk)',
                    textAlign: 'left',
                    fontSize: 13,
                  }}
                >
                  <span>{p.title}</span>
                  {p.tricky && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '1px 6px',
                        borderRadius: 4,
                        background: 'var(--warn-soft)',
                        color: 'var(--warn)',
                      }}
                    >
                      易混
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {phase === 'identify' && prompt && (
        <div className="card card-enter" style={{ padding: 28 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>
              第 1 步 · 读题判型（限时 20 秒）
            </span>
            <span
              className="tabular-nums"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                fontWeight: 600,
                color: idSecondsLeft <= 5 ? 'var(--err)' : 'var(--ink)',
              }}
            >
              <Clock size={15} strokeWidth={1.5} />
              {idSecondsLeft}s
            </span>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 17,
              lineHeight: 1.75,
              padding: 18,
              borderRadius: 'var(--radius-s)',
              background: 'var(--surface-sunk)',
              marginBottom: 20,
            }}
          >
            {prompt.directions}
          </div>

          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 10 }}>
            圈出动作关键词，选择对应的模板类型：
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {TEMPLATES.map((t) => {
              const isSelected = pickedType === t.id;
              const isCorrectChoice = pickedType && t.id === prompt.templateId;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`btn-secondary ${isSelected ? 'active' : ''}`}
                  disabled={Boolean(pickedType)}
                  onClick={() => handlePickType(t.id)}
                  style={
                    isCorrectChoice
                      ? { borderColor: 'var(--ok)', background: 'var(--ok-soft)', color: 'var(--ok)' }
                      : undefined
                  }
                >
                  {t.name}
                </button>
              );
            })}
          </div>

          {(pickedType || idSecondsLeft === 0) && activeTemplate && (
            <div>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-s)',
                  background: recognizedCorrect ? 'var(--ok-soft)' : 'var(--warn-soft)',
                  color: recognizedCorrect ? 'var(--ok)' : 'var(--warn)',
                  fontSize: 13,
                  marginBottom: 16,
                }}
              >
                {recognizedCorrect
                  ? `判断正确：${activeTemplate.name}。`
                  : `本题应套用「${activeTemplate.name}」模板。`}
                {prompt.trickyHint && <div style={{ marginTop: 4 }}>{prompt.trickyHint}</div>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-primary" onClick={() => setPhase('write')}>
                  进入计时写作
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'write' && prompt && activeTemplate && (
        <div className="card card-enter" style={{ padding: 28 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>
              第 2 步 · 计时写作（{activeTemplate.name}）
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }} className="tabular-nums">
              <span style={{ color: 'var(--ink-muted)' }}>词数：{words}</span>
              <span
                style={{
                  color: writeElapsedSec > 600 ? 'var(--warn)' : 'var(--ink)',
                  fontWeight: 600,
                }}
              >
                已用 {formatMMSS(writeElapsedSec)} / 剩余 {formatMMSS(remainingSec)}（目标 10:00）
              </span>
            </div>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 15,
              lineHeight: 1.65,
              padding: 14,
              borderRadius: 'var(--radius-s)',
              background: 'var(--surface-sunk)',
              marginBottom: 14,
            }}
          >
            {prompt.directions}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 'var(--radius-s)',
              border: '1px solid var(--line)',
              marginBottom: 16,
              fontSize: 13,
            }}
          >
            <div>
              <span style={{ color: 'var(--ink-muted)', marginRight: 8 }}>可抄写关键词：</span>
              {prompt.suggestedKeywords.map((kw) => (
                <span key={kw} className="slot-chip" style={{ marginRight: 6 }}>
                  {kw}
                </span>
              ))}
            </div>
            <StoryLine nodes={activeTemplate.storyLine} activeIndex={-1} />
          </div>

          <textarea
            className="exam-paper"
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            placeholder={
              activeTemplate.id === 'notice'
                ? "NOTICE\n\nWe greatly appreciate all students...\n\nThe Students' Union"
                : 'Dear ...,\n\nIt is a great pleasure for me to write this letter to you...\n\nYours sincerely,\nLi Ming'
            }
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <button type="button" className="btn-ghost" onClick={() => setPhase('select')}>
              放弃本题
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={words < 10}
              onClick={handleSubmitEssay}
            >
              <Check size={16} strokeWidth={1.5} />
              提交并逐句对齐
            </button>
          </div>
        </div>
      )}

      {phase === 'result' && prompt && activeTemplate && (
        <div className="card card-enter" style={{ padding: 28 }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20,
              paddingBottom: 16,
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>{activeTemplate.name} · 实战复盘</h2>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }} className="tabular-nums">
                用时 {formatMMSS(writeElapsedSec)} · 总词数 {words} 词 · 平均模板准确率{' '}
                {Math.round(
                  (alignedResults.reduce((a, b) => a + b.result.accuracy, 0) /
                    Math.max(1, alignedResults.length)) *
                    100,
                )}
                %
              </div>
            </div>
            <button type="button" className="btn-primary" onClick={() => setPhase('select')}>
              <RotateCcw size={15} strokeWidth={1.5} />
              再写一篇
            </button>
          </div>

          {writeElapsedSec > 600 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 'var(--radius-s)',
                background: 'var(--warn-soft)',
                color: 'var(--warn)',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={15} strokeWidth={1.5} />
              本次用时超过 10 分钟目标线，建议重点回练下方准确率较低的句子。
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {alignedResults.map((row, i) => (
              <div
                key={row.sentenceId}
                style={{
                  padding: 14,
                  borderRadius: 'var(--radius-s)',
                  border: '1px solid var(--line)',
                }}
              >
                <div className="zh-text" style={{ fontSize: 13, marginBottom: 8 }}>
                  第 {i + 1} 句：<RichSentence text={row.zh} />
                </div>
                <DiffResult result={row.result} />
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--ink-muted)', fontFamily: 'var(--font-serif)' }}>
                  标准：<RichSentence text={row.en} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
