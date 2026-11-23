import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { RotateCw, CheckCircle2 } from 'lucide-react';
import { SENTENCES, getSentenceLocationLabel } from '../data/templates';
import { useProgress } from '../store/useProgress';
import { RichSentence } from '../components/RichSentence';

export function MistakesPage() {
  const cards = useProgress((s) => s.cards);
  const mistakes = useProgress((s) => s.mistakes);

  useEffect(() => {
    document.title = '错题本 · 小作文';
  }, []);

  const mistakeItems = useMemo(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const list: Array<{
      sentenceId: string;
      againCount: number;
      errorRate: number;
      topWrongWord?: { expected: string; actual: string; count: number };
    }> = [];

    for (const card of Object.values(cards)) {
      if (!card.learned) continue;
      const meta = mistakes[card.sentenceId];
      const recentAgain =
        meta?.lastAgainAt && new Date(meta.lastAgainAt).getTime() >= thirtyDaysAgo;
      const errorRate = card.reviewCount > 0 ? card.againCount / card.reviewCount : 0;

      if (recentAgain || errorRate > 0.3) {
        let topWrongWord: { expected: string; actual: string; count: number } | undefined;
        if (meta?.wrongWords) {
          for (const [expected, actualMap] of Object.entries(meta.wrongWords)) {
            for (const [actual, count] of Object.entries(actualMap)) {
              if (!topWrongWord || count > topWrongWord.count) {
                topWrongWord = { expected, actual, count };
              }
            }
          }
        }
        list.push({
          sentenceId: card.sentenceId,
          againCount: card.againCount,
          errorRate,
          topWrongWord,
        });
      }
    }

    list.sort((a, b) => b.errorRate - a.errorRate || b.againCount - a.againCount);
    return list;
  }, [cards, mistakes]);

  return (
    <div className="main-content">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
            错题本
          </h1>
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>
            自动收录近 30 天评过 Again 或错误率高于 30% 的句子
          </div>
        </div>

        {mistakeItems.length > 0 && (
          <Link to="/review?mode=mistakes" className="btn-primary" style={{ textDecoration: 'none' }}>
            <RotateCw size={15} strokeWidth={1.5} />
            只练错题（{mistakeItems.length} 句）
          </Link>
        )}
      </div>

      {mistakeItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <CheckCircle2 size={28} strokeWidth={1.5} style={{ color: 'var(--ok)', marginBottom: 12 }} />
          <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>目前没有错题</h2>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', margin: 0 }}>
            复习中评为 Again 或错误率偏高的句子会自动出现在这里，并统计高频错词。
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mistakeItems.map((item) => {
            const s = SENTENCES[item.sentenceId];
            if (!s) return null;
            return (
              <div key={item.sentenceId} className="card" style={{ padding: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)' }}>
                    {getSentenceLocationLabel(s.id)}
                  </span>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }} className="tabular-nums">
                    <span style={{ color: 'var(--err)' }}>Again {item.againCount} 次</span>
                    <span style={{ color: 'var(--ink-muted)' }}>
                      错误率 {Math.round(item.errorRate * 100)}%
                    </span>
                  </div>
                </div>

                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.7 }}>
                  <RichSentence text={s.en} resultWord={s.resultWord} highlightResultWord />
                </div>
                <div className="zh-text" style={{ fontSize: 13, marginTop: 4 }}>
                  <RichSentence text={s.zh} />
                </div>

                {item.topWrongWord && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-s)',
                      background: 'var(--warn-soft)',
                      color: 'var(--warn)',
                      fontSize: 12,
                    }}
                  >
                    最常错的词：常把 <strong>{item.topWrongWord.expected}</strong> 写成{' '}
                    <strong>{item.topWrongWord.actual}</strong>（{item.topWrongWord.count} 次）
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
