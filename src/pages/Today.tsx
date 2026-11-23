import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Lock,
  Check,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { LESSONS, SENTENCES } from '../data/templates';
import { isCardDue, getMasteryLevel } from '../core/scheduler';
import { isLessonCompleted, isLessonUnlocked } from '../core/cards';
import { useProgress, formatDateKey } from '../store/useProgress';
import { useSettings } from '../store/useSettings';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 12) return '早上好';
  if (h < 18) return '下午好';
  return '晚上好';
}

export function TodayPage() {
  const cards = useProgress((s) => s.cards);
  const dailyStats = useProgress((s) => s.dailyStats);
  const learnedToday = useProgress((s) => s.getTodayLearnedCount());
  const dailyNewLimit = useSettings((s) => s.dailyNewLimit);
  const examDate = useSettings((s) => s.examDate);
  const unlockAllLessons = useSettings((s) => s.unlockAllLessons);

  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [showOptionalLesson, setShowOptionalLesson] = useState(false);

  useEffect(() => {
    document.title = '今日 · 小作文';
  }, []);

  const now = new Date();
  const dueCount = Object.values(cards).filter((c) => isCardDue(c, now)).length;

  // 计算当前已解锁课程中剩余未学句数
  const unlockedUnlearnedCount = useMemo(() => {
    const seen = new Set<string>();
    let count = 0;
    for (const lesson of LESSONS) {
      if (lesson.optional && !showOptionalLesson) continue;
      if (!isLessonUnlocked(lesson.order, cards, unlockAllLessons)) continue;
      for (const sid of lesson.sentenceIds) {
        if (!seen.has(sid) && !cards[sid]?.learned) {
          seen.add(sid);
          count++;
        }
      }
    }
    return count;
  }, [cards, unlockAllLessons, showOptionalLesson]);

  const remainingNewQuota = Math.max(0, dailyNewLimit - learnedToday);
  const todayNewCount = Math.min(remainingNewQuota, unlockedUnlearnedCount);
  const totalTaskCards = dueCount + todayNewCount;
  const estMinutes = Math.max(0, Math.ceil((totalTaskCards * 40) / 60));

  // 考试倒计时
  const daysLeft = useMemo(() => {
    if (!examDate) return null;
    const exam = new Date(examDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [examDate]);

  // 近 7 天练习热力图
  const weekDays = useMemo(() => {
    const labels = ['日', '一', '二', '三', '四', '五', '六'];
    const arr: Array<{ key: string; label: string; count: number; isToday: boolean }> = [];
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const key = formatDateKey(d);
      const st = dailyStats[key];
      const count = (st?.learned ?? 0) + (st?.reviewed ?? 0);
      arr.push({
        key,
        label: offset === 0 ? '今天' : `周${labels[d.getDay()]}`,
        count,
        isToday: offset === 0,
      });
    }
    return arr;
  }, [dailyStats]);

  const primaryActionPath = dueCount > 0 ? '/review' : todayNewCount > 0 ? '/learn' : '/exam';
  const primaryActionText =
    dueCount > 0
      ? '开始今天的练习（先复习）'
      : todayNewCount > 0
        ? '开始学习今日新句'
        : '去实战模拟写一篇';

  const coreLessons = LESSONS.filter((l) => !l.optional);
  const optionalLesson = LESSONS.find((l) => l.optional);

  return (
    <div className="main-content">
      {/* 顶部一行：问候 + 考试倒计时 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
          {getGreeting()}
        </h1>
        <div style={{ fontSize: 14, color: 'var(--ink-muted)' }} className="tabular-nums">
          {daysLeft === null ? (
            <Link to="/settings" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
              设置考试日期以开启倒计时
            </Link>
          ) : daysLeft > 0 ? (
            <span>
              距考试 <strong style={{ color: 'var(--ink)' }}>{daysLeft}</strong> 天
              {daysLeft <= 30 && '（冲刺间隔已开启）'}
            </span>
          ) : (
            <span>考试日已到</span>
          )}
        </div>
      </div>

      {/* 考前 3 天冲刺提醒 */}
      {daysLeft !== null && daysLeft > 0 && daysLeft <= 3 && (
        <div
          className="card"
          style={{
            marginBottom: 20,
            padding: '16px 20px',
            background: 'var(--gold-soft)',
            borderColor: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <AlertTriangle size={18} strokeWidth={1.5} style={{ color: 'var(--gold)', flexShrink: 0 }} />
            <span>考前 3 天冲刺队列：全部整篇默写 + 历史错误率最高的 10 张卡</span>
          </div>
          <Link to="/review?mode=sprint" className="btn-primary" style={{ textDecoration: 'none', height: 36 }}>
            进入冲刺队列
          </Link>
        </div>
      )}

      {/* 核心卡片：今日任务 */}
      <section className="card" style={{ marginBottom: 24, padding: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>今日任务</h2>
          <span
            className="tabular-nums"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: 'var(--ink-muted)',
            }}
          >
            <Clock size={14} strokeWidth={1.5} />
            预计 {estMinutes} 分钟
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-s)',
              background: 'var(--surface-sunk)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 4 }}>待复习</div>
            <div className="tabular-nums" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.1 }}>
              {dueCount}
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-muted)', marginLeft: 4 }}>
                张
              </span>
            </div>
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-s)',
              background: 'var(--surface-sunk)',
            }}
          >
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 4 }}>今日新句子</div>
            <div className="tabular-nums" style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.1 }}>
              {todayNewCount}
              <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-muted)', marginLeft: 4 }}>
                句
              </span>
            </div>
          </div>
        </div>

        <Link to={primaryActionPath} className="btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
          {primaryActionText}
          <ArrowRight size={16} strokeWidth={1.5} />
        </Link>
      </section>

      {/* 课程进度：9 课 */}
      <section className="card" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>课程进度</h2>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            按层级解锁，点击展开每课句子
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {coreLessons.map((lesson) => {
            const doneCount = lesson.sentenceIds.filter((id) => cards[id]?.learned).length;
            const total = lesson.sentenceIds.length;
            const completed = isLessonCompleted(lesson.id, cards);
            const unlocked = isLessonUnlocked(lesson.order, cards, unlockAllLessons);
            const isExpanded = expandedLessonId === lesson.id;
            const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

            return (
              <div
                key={lesson.id}
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-s)',
                  background: unlocked ? 'var(--surface)' : 'var(--surface-sunk)',
                  opacity: unlocked ? 1 : 0.72,
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    textAlign: 'left',
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown size={16} strokeWidth={1.5} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
                  ) : (
                    <ChevronRight size={16} strokeWidth={1.5} style={{ color: 'var(--ink-muted)', flexShrink: 0 }} />
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{lesson.title}</span>
                      {completed && <Check size={14} strokeWidth={2} style={{ color: 'var(--ok)' }} />}
                      {!unlocked && <Lock size={13} strokeWidth={1.5} style={{ color: 'var(--ink-faint)' }} />}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                      {lesson.subtitle}
                    </div>
                    <div className="progress-track" style={{ marginTop: 8 }}>
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <span className="tabular-nums" style={{ fontSize: 12, color: 'var(--ink-muted)', flexShrink: 0 }}>
                    {doneCount} / {total}
                  </span>
                </button>

                {isExpanded && (
                  <div
                    style={{
                      padding: '10px 14px 14px 42px',
                      borderTop: '1px solid var(--line)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    {lesson.sentenceIds.map((sid) => {
                      const s = SENTENCES[sid];
                      const level = getMasteryLevel(cards[sid]);
                      return (
                        <div
                          key={sid}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 13,
                          }}
                        >
                          <span className={`mastery-dot mastery-${level}`} />
                          <span style={{ color: 'var(--ink)', flex: 1, minWidth: 0 }}>
                            {s.cue} …
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
                            {level === 'unlearned'
                              ? '未学'
                              : level === 'learning'
                                ? '学习中'
                                : level === 'familiar'
                                  ? '熟悉'
                                  : '牢固'}
                          </span>
                        </div>
                      );
                    })}
                    {unlocked && !completed && (
                      <div style={{ marginTop: 6 }}>
                        <Link
                          to={`/learn?lesson=${lesson.id}`}
                          className="btn-secondary"
                          style={{ textDecoration: 'none', height: 32, fontSize: 12 }}
                        >
                          学习本课未学句子
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* 第 9 课（备用祝贺信）默认折叠 */}
          {optionalLesson && (
            <div style={{ marginTop: 4 }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowOptionalLesson((v) => !v)}
                style={{ paddingLeft: 4 }}
              >
                {showOptionalLesson ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                备用课程：{optionalLesson.title}（前六类背熟后再背）
              </button>

              {showOptionalLesson && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '12px 14px',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-s)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{optionalLesson.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{optionalLesson.subtitle}</div>
                  </div>
                  <Link
                    to={`/learn?lesson=${optionalLesson.id}`}
                    className="btn-secondary"
                    style={{ textDecoration: 'none' }}
                  >
                    进入学习
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 本周热力图：7 个小方格 */}
      <section className="card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>近 7 天练习量</h2>
          <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>学习 + 复习次数</span>
        </div>

        <div className="heatmap-grid">
          {weekDays.map((day) => {
            const bg =
              day.count === 0
                ? 'var(--surface-sunk)'
                : day.count < 5
                  ? 'var(--gold-soft)'
                  : day.count < 12
                    ? 'var(--ok-soft)'
                    : 'var(--gold)';
            const color = day.count >= 12 ? '#FFFDF9' : 'var(--ink)';
            return (
              <div key={day.key} className="heatmap-cell">
                <div
                  className="heatmap-box tabular-nums"
                  style={{
                    background: bg,
                    color,
                    borderColor: day.isToday ? 'var(--gold)' : 'var(--line)',
                  }}
                  title={`${day.key}：${day.count} 次练习`}
                >
                  {day.count > 0 ? day.count : ''}
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: day.isToday ? 'var(--ink)' : 'var(--ink-muted)',
                    fontWeight: day.isToday ? 600 : 400,
                  }}
                >
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
