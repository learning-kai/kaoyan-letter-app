import { useState, useEffect, useRef } from 'react';
import { Download, Upload, Trash2, Check } from 'lucide-react';
import { useSettings, type ThemeMode, type InputMode } from '../store/useSettings';
import { useProgress } from '../store/useProgress';
import type { SlotMode } from '../core/grader';

export function SettingsPage() {
  const settings = useSettings();
  const progress = useProgress();

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = '设置 · 小作文';
  }, []);

  const showToast = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  const handleExport = () => {
    const payload = {
      app: 'kaoyan-letter-app',
      exportedAt: new Date().toISOString(),
      schemaVersion: 2,
      settings: {
        schemaVersion: settings.schemaVersion,
        dailyNewLimit: settings.dailyNewLimit,
        requestRetention: settings.requestRetention,
        strictPunctuation: settings.strictPunctuation,
        slotMode: settings.slotMode,
        inputMode: settings.inputMode,
        theme: settings.theme,
        fontSize: settings.fontSize,
        examDate: settings.examDate,
        unlockAllLessons: settings.unlockAllLessons,
      },
      progress: {
        schemaVersion: progress.schemaVersion,
        cards: progress.cards,
        dailyStats: progress.dailyStats,
        mistakes: progress.mistakes,
        examRecords: progress.examRecords,
        recognitionStats: progress.recognitionStats,
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaoyan-letter-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('已导出 JSON 备份文件。');
  };

  const handleImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !parsed.progress || !parsed.settings) {
        showToast('导入失败：JSON 文件格式不符合备份规范。');
        return;
      }
      settings.applySettingsSnapshot(parsed.settings);
      progress.applyProgressSnapshot(parsed.progress);
      showToast('备份已成功导入，所有进度与设置已恢复。');
    } catch {
      showToast('导入失败：无法解析所选 JSON 文件。');
    }
  };

  const handleConfirmReset = () => {
    if (resetConfirmText.trim() !== '重置') return;
    progress.resetAll();
    setResetModalOpen(false);
    setResetConfirmText('');
    showToast('学习进度已重置。');
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, letterSpacing: '-0.01em' }}>
          设置
        </h1>
        <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>
          所有学习进度与偏好仅保存在当前浏览器本地（IndexedDB）
        </div>
      </div>

      {statusMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 'var(--radius-s)',
            background: 'var(--ok-soft)',
            color: 'var(--ok)',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={15} strokeWidth={1.5} />
          {statusMsg}
        </div>
      )}

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600 }}>学习与 FSRS 调度</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>考试日期</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                距考试 ≤ 30 天自动限制最大复习间隔，考前 3 天开启冲刺队列
              </div>
            </div>
            <input
              type="date"
              className="field-input"
              value={settings.examDate}
              onChange={(e) => settings.setExamDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>每日新句子上限（4–15）</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>当前：{settings.dailyNewLimit} 句 / 天</div>
            </div>
            <input
              type="range"
              min={4}
              max={15}
              step={1}
              value={settings.dailyNewLimit}
              onChange={(e) => settings.setDailyNewLimit(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>FSRS 目标保持率（0.85–0.95）</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                当前：{Math.round(settings.requestRetention * 100)}%（越高复习越密）
              </div>
            </div>
            <input
              type="range"
              min={0.85}
              max={0.95}
              step={0.01}
              value={settings.requestRetention}
              onChange={(e) => settings.setRequestRetention(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>默认输入方式</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>复习时也可单次切换</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(
                [
                  { id: 'typing', label: '打字模式' },
                  { id: 'paper', label: '纸笔模式' },
                ] as Array<{ id: InputMode; label: string }>
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`btn-secondary ${settings.inputMode === m.id ? 'active' : ''}`}
                  onClick={() => settings.setInputMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>默认槽位练法</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>框架模式只考固定句型，实填模式检查词性</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(
                [
                  { id: 'frame', label: '框架模式' },
                  { id: 'fill', label: '实填模式' },
                ] as Array<{ id: SlotMode; label: string }>
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={`btn-secondary ${settings.slotMode === m.id ? 'active' : ''}`}
                  onClick={() => settings.setSlotMode(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>严格标点判分</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>开启后逗号缺失或多余也会扣分提示</div>
            </div>
            <input
              type="checkbox"
              checked={settings.strictPunctuation}
              onChange={(e) => settings.setStrictPunctuation(e.target.checked)}
            />
          </label>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>解锁全部课程与扩展卡</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>适合已经背过模板、直接刷题巩固的用户</div>
            </div>
            <input
              type="checkbox"
              checked={settings.unlockAllLessons}
              onChange={(e) => settings.setUnlockAllLessons(e.target.checked)}
            />
          </label>
        </div>
      </section>

      <section className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600 }}>外观与排版</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>主题</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(
                [
                  { id: 'light', label: '浅色纸面' },
                  { id: 'dark', label: '深色夜读' },
                  { id: 'system', label: '跟随系统' },
                ] as Array<{ id: ThemeMode; label: string }>
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`btn-secondary ${settings.theme === t.id ? 'active' : ''}`}
                  onClick={() => settings.setTheme(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>英文正文字号（16–22px）</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>当前：{settings.fontSize}px</div>
            </div>
            <input
              type="range"
              min={16}
              max={22}
              step={1}
              value={settings.fontSize}
              onChange={(e) => settings.setFontSize(Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <section className="card">
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>数据管理</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" className="btn-secondary" onClick={handleExport}>
            <Download size={14} strokeWidth={1.5} />
            导出 JSON 备份
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} strokeWidth={1.5} />
            导入 JSON 备份
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              setResetConfirmText('');
              setResetModalOpen(true);
            }}
          >
            <Trash2 size={14} strokeWidth={1.5} />
            重置所有进度
          </button>
        </div>
      </section>

      {resetModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setResetModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="确认重置进度"
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>确认重置所有学习进度？</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--ink-muted)' }}>
              此操作将清空全部 FSRS 卡片记录、错题统计与实战历史。请输入「<strong>重置</strong>」两个字以确认：
            </p>
            <input
              type="text"
              className="field-input"
              style={{ width: '100%', marginBottom: 16 }}
              value={resetConfirmText}
              onChange={(e) => setResetConfirmText(e.target.value)}
              placeholder="请输入：重置"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn-secondary" onClick={() => setResetModalOpen(false)}>
                取消
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={resetConfirmText.trim() !== '重置'}
                onClick={handleConfirmReset}
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
