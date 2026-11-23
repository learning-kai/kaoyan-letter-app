import type { GradeResult } from '../core/grader';
import { SLOTS } from '../data/fillers';

interface DiffResultProps {
  result: GradeResult;
}

export function DiffResult({ result }: DiffResultProps) {
  return (
    <div>
      <div className="diff-box" aria-label="逐词比对结果">
        {result.items.map((item, idx) => {
          const delay = Math.min(idx * 15, 380);
          if (item.status === 'slot') {
            const label = item.slotId ? SLOTS[item.slotId]?.label ?? item.slotId : '槽位';
            return (
              <span
                key={idx}
                className="diff-word"
                style={{ animationDelay: `${delay}ms` }}
                title={`槽位：${label}`}
              >
                <span className="slot-chip">{item.actual || label}</span>
              </span>
            );
          }

          if (item.status === 'correct') {
            return (
              <span
                key={idx}
                className="diff-word diff-correct"
                style={{ animationDelay: `${delay}ms` }}
              >
                {item.expected}
              </span>
            );
          }

          if (item.status === 'missing') {
            return (
              <span
                key={idx}
                className="diff-word diff-missing"
                style={{ animationDelay: `${delay}ms` }}
                title="漏写"
              >
                {item.expected}
              </span>
            );
          }

          if (item.status === 'extra') {
            return (
              <span
                key={idx}
                className="diff-word diff-extra"
                style={{ animationDelay: `${delay}ms` }}
                title="多写"
              >
                {item.actual}
              </span>
            );
          }

          if (item.status === 'misspelled') {
            return (
              <span
                key={idx}
                className="diff-word diff-misspelled"
                style={{ animationDelay: `${delay}ms` }}
                title={`拼写错误，应为：${item.expected}`}
              >
                {item.actual}
              </span>
            );
          }

          return (
            <span
              key={idx}
              className="diff-word diff-wrongForm"
              style={{ animationDelay: `${delay}ms` }}
              title={`词形错误，应为：${item.expected}`}
            >
              {item.actual}
            </span>
          );
        })}
      </div>

      {/* 图例与细项提醒 */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px 16px',
          marginTop: 10,
          fontSize: 12,
          color: 'var(--ink-muted)',
        }}
      >
        <span>
          准确率：<strong className="tabular-nums" style={{ color: 'var(--ink)' }}>{Math.round(result.accuracy * 100)}%</strong>
        </span>
        {result.missingCount > 0 && (
          <span style={{ color: 'var(--err)' }}>漏写 {result.missingCount} 词（红底虚线）</span>
        )}
        {result.misspelledCount > 0 && (
          <span style={{ color: 'var(--warn)' }}>拼写错误 {result.misspelledCount} 词（波浪线，悬停看正拼）</span>
        )}
        {result.wrongFormCount > 0 && (
          <span style={{ color: 'var(--warn)' }}>词形错误 {result.wrongFormCount} 词（实线，悬停看正确形式）</span>
        )}
        {result.extraCount > 0 && <span>多写 {result.extraCount} 词（删除线）</span>}
      </div>

      {result.caseMismatches.length > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 'var(--radius-s)',
            background: 'var(--surface-sunk)',
            fontSize: 12,
            color: 'var(--ink-muted)',
          }}
        >
          大小写提示（不扣分）：
          {result.caseMismatches
            .slice(0, 4)
            .map((m) => `${m.actual} → ${m.expected}`)
            .join('，')}
          {result.caseMismatches.length > 4 ? ' 等' : ''}
        </div>
      )}

      {result.punctuationWarnings.length > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 'var(--radius-s)',
            background: 'var(--warn-soft)',
            fontSize: 12,
            color: 'var(--warn)',
          }}
        >
          标点提示：{result.punctuationWarnings.join('；')}
        </div>
      )}

      {result.slotWarnings.length > 0 && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            borderRadius: 'var(--radius-s)',
            background: 'var(--warn-soft)',
            fontSize: 12,
            color: 'var(--warn)',
          }}
        >
          {result.slotWarnings.map((w, i) => (
            <div key={i}>{w.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}
