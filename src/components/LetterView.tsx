import { Volume2, AlertCircle } from 'lucide-react';
import type { Template } from '../data/types';
import { SENTENCES } from '../data/templates';
import { SLOTS } from '../data/fillers';
import { getMasteryLevel, type SentenceCardState } from '../core/scheduler';
import { RichSentence } from './RichSentence';

export type LetterFilter = 'all' | 'skeleton' | 'body';

interface LetterViewProps {
  template: Template;
  showZh: boolean;
  filter: LetterFilter;
  cards: Record<string, SentenceCardState>;
}

const MASTERY_TITLE: Record<string, string> = {
  unlearned: '未学',
  learning: '学习中（稳定度 < 3 天）',
  familiar: '熟悉（3–14 天）',
  mastered: '牢固（> 14 天）',
};

function speakSentence(en: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const spoken = en.replace(/\{\{(\w+)\}\}/g, (_, id: string) => SLOTS[id]?.filler ?? 'something');
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(spoken);
  utter.lang = 'en-US';
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

export function LetterView({ template, showZh, filter, cards }: LetterViewProps) {
  const isVisible = (layer: string) => {
    if (filter === 'skeleton') return layer !== 'L3';
    if (filter === 'body') return layer !== 'L1';
    return true;
  };

  return (
    <div className="letter-paper">
      {template.paragraphs.map((paraIds, pIdx) => {
        const visibleIds = paraIds.filter((id) => isVisible(SENTENCES[id].layer));
        if (visibleIds.length === 0) return null;

        return (
          <div key={pIdx} className="letter-para">
            {visibleIds.map((sid) => {
              const s = SENTENCES[sid];
              const mastery = getMasteryLevel(cards[sid]);
              const isNoticeTitle = sid === 'notice.heading';

              return (
                <div
                  key={sid}
                  className="letter-sentence-row"
                  style={
                    isNoticeTitle
                      ? { textAlign: 'center', fontWeight: 600, letterSpacing: '0.08em' }
                      : undefined
                  }
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                    <span
                      className={`mastery-dot mastery-${mastery}`}
                      title={MASTERY_TITLE[mastery]}
                      style={{ marginTop: 10 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {s.connector && <span className="letter-margin-note">{s.connector}</span>}
                      <RichSentence text={s.en} resultWord={s.resultWord} highlightResultWord />
                      {showZh && (
                        <div className="zh-text" style={{ fontSize: 14, marginTop: 4 }}>
                          <RichSentence text={s.zh} />
                        </div>
                      )}
                    </div>
                    {s.role !== 'heading' && s.role !== 'signoff' && (
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => speakSentence(s.en)}
                        title="朗读本句"
                        aria-label="朗读本句"
                        style={{ padding: 6, flexShrink: 0 }}
                      >
                        <Volume2 size={15} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {template.warnings.length > 0 && (
        <div
          style={{
            marginTop: 24,
            padding: '12px 16px',
            borderRadius: 'var(--radius-s)',
            background: 'var(--warn-soft)',
            color: 'var(--warn)',
            fontSize: 13,
            lineHeight: 1.6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 4 }}>
            <AlertCircle size={15} strokeWidth={1.5} />
            易错提醒
          </div>
          {template.warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}
    </div>
  );
}
