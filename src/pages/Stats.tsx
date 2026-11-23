import { useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { TEMPLATES, SENTENCES } from '../data/templates';
import { getMasteryLevel } from '../core/scheduler';
import { useProgress } from '../store/useProgress';

export function StatsPage() {
  const cards = useProgress((s) => s.cards);
  const examRecords = useProgress((s) => s.examRecords);
  const recognitionStats = useProgress((s) => s.recognitionStats);

  useEffect(() => {
    document.title = '统计 · 小作文';
  }, []);

  const templateMastery = useMemo(() => {
    return TEMPLATES.map((tpl) => {
      const trainable = tpl.sentenceIds.filter(
        (sid) => SENTENCES[sid].role !== 'heading' && SENTENCES[sid].role !== 'signoff',
      );
      const counts = { unlearned: 0, learning: 0, familiar: 0, mastered: 0 };
      for (const sid of trainable) {
        counts[getMasteryLevel(cards[sid])]++;
      }
      return {
        id: tpl.id,
        name: tpl.name,
        total: trainable.length,
        ...counts,
      };
    });
  }, [cards]);

  const forecastData = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 14 }, (_, idx) => {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() + idx);
      return {
        label: idx === 0 ? '今天' : `${d.getMonth() + 1}/${d.getDate()}`,
        count: 0,
      };
    });

    for (const c of Object.values(cards)) {
      if (!c.learned) continue;
      const due = new Date(c.card.due);
      due.setHours(0, 0, 0, 0);
      const diff = Math.floor((due.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
      if (diff <= 0) {
        days[0].count++;
      } else if (diff < 14) {
        days[diff].count++;
      }
    }
    return days;
  }, [cards]);

  const examChartData = useMemo(() => {
    return examRecords.slice(-15).map((r, idx) => ({
      index: `第 ${idx + 1} 篇`,
      durationMin: r.durationMin,
      wordCount: r.wordCount,
    }));
  }, [examRecords]);

  const recognitionRate =
    recognitionStats.total > 0
      ? Math.round((recognitionStats.correct / recognitionStats.total) * 100)
      : null;

  return (
    <div className="main-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
          学习统计
        </h1>
        <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>
          各模板掌握分布、未来 14 天复习预测与实战速度趋势
        </div>
      </div>

      <section className="card" style={{ marginBottom: 20, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>题型识别正确率</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
              来自「实战判型」与「T 识别卡」累计统计
            </div>
          </div>
          <div className="tabular-nums" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--gold)' }}>
              {recognitionRate === null ? '—' : `${recognitionRate}%`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              {recognitionStats.correct} / {recognitionStats.total} 题
            </div>
          </div>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>各模板掌握度</h2>
          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--ink-muted)' }}>
            <span>
              <span className="mastery-dot mastery-unlearned" style={{ marginRight: 4 }} />
              未学
            </span>
            <span>
              <span className="mastery-dot mastery-learning" style={{ marginRight: 4 }} />
              学习中 (&lt;3天)
            </span>
            <span>
              <span className="mastery-dot mastery-familiar" style={{ marginRight: 4 }} />
              熟悉 (3–14天)
            </span>
            <span>
              <span className="mastery-dot mastery-mastered" style={{ marginRight: 4 }} />
              牢固 (&gt;14天)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {templateMastery.map((row) => (
            <div key={row.id}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  marginBottom: 6,
                }}
              >
                <span style={{ fontWeight: 500 }}>{row.name}</span>
                <span className="tabular-nums" style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
                  已学 {row.total - row.unlearned} / {row.total} 句
                </span>
              </div>
              <div className="segmented-bar">
                {row.mastered > 0 && (
                  <div
                    style={{
                      width: `${(row.mastered / row.total) * 100}%`,
                      background: 'var(--ok)',
                    }}
                  />
                )}
                {row.familiar > 0 && (
                  <div
                    style={{
                      width: `${(row.familiar / row.total) * 100}%`,
                      background: 'var(--gold)',
                    }}
                  />
                )}
                {row.learning > 0 && (
                  <div
                    style={{
                      width: `${(row.learning / row.total) * 100}%`,
                      background: 'var(--warn)',
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>未来 14 天复习量预测</h2>
        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecastData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" name="到期卡片" fill="var(--gold)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>整篇实战用时趋势（分钟）</h2>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>虚线为 10 分钟考场目标线</span>
        </div>

        {examChartData.length === 0 ? (
          <div style={{ padding: '28px 0', textAlign: 'center', fontSize: 13, color: 'var(--ink-muted)' }}>
            完成第一篇实战写作后，这里会记录你的整篇用时变化趋势。
          </div>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={examChartData} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="index" tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--ink-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <ReferenceLine
                  y={10}
                  stroke="var(--ok)"
                  strokeDasharray="4 4"
                  label={{ value: '10分钟目标', position: 'insideTopRight', fill: 'var(--ok)', fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="durationMin"
                  name="用时（分钟）"
                  stroke="var(--gold)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--gold)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
