import { useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface ShortcutModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SHORTCUTS = [
  { key: 'Enter', desc: '提交答案；查看结果后按 Enter 接受建议评分并进入下一张' },
  { key: 'Shift + Enter', desc: '输入框内换行' },
  { key: 'Tab', desc: '显示首词提示（cue）' },
  { key: 'Space', desc: '纸笔模式下显示标准答案' },
  { key: '1 / 2 / 3 / 4', desc: '评分：Again / Hard / Good / Easy' },
  { key: 'R', desc: '朗读当前英文句子（焦点不在输入框时）' },
  { key: 'Esc', desc: '退出专注模式或关闭当前弹窗' },
];

export function ShortcutModal({ open, onOpenChange }: ShortcutModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
      if (e.key === '?' && !open) {
        const tag = (e.target as HTMLElement | null)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          onOpenChange(true);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  return (
    <>
      <button
        type="button"
        className="shortcut-fab"
        onClick={() => onOpenChange(true)}
        aria-label="查看键盘快捷键"
        title="键盘快捷键 (?)"
      >
        <HelpCircle size={18} strokeWidth={1.5} />
      </button>

      {open && (
        <div
          className="modal-backdrop"
          onClick={() => onOpenChange(false)}
          role="dialog"
          aria-modal="true"
          aria-label="键盘快捷键列表"
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>键盘快捷键</h2>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => onOpenChange(false)}
                aria-label="关闭"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SHORTCUTS.map((item) => (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    fontSize: 13,
                    paddingBottom: 8,
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <span style={{ color: 'var(--ink-muted)' }}>{item.desc}</span>
                  <kbd className="kbd" style={{ flexShrink: 0 }}>
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
