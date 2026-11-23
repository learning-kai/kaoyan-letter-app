import { useState, useEffect } from 'react';
import { Search, BookOpen, ListOrdered, Layers } from 'lucide-react';
import { TEMPLATES } from '../data/templates';
import { SLOT_LIST, POS_LABEL } from '../data/fillers';
import type { TemplateId, POS } from '../data/types';
import { useProgress } from '../store/useProgress';
import { LetterView, type LetterFilter } from '../components/LetterView';
import { StoryLine } from '../components/StoryLine';

type LibraryTab = 'templates' | 'fillers' | 'chains';

export function LibraryPage() {
  const [tab, setTab] = useState<LibraryTab>('templates');
  const [selectedId, setSelectedId] = useState<TemplateId>('suggest');
  const [showZh, setShowZh] = useState(true);
  const [filter, setFilter] = useState<LetterFilter>('all');
  const [search, setSearch] = useState('');
  const cards = useProgress((s) => s.cards);

  useEffect(() => {
    document.title = '模板库 · 小作文';
  }, []);

  const activeTemplate = TEMPLATES.find((t) => t.id === selectedId) ?? TEMPLATES[0];

  const groupedFillers: Array<{ pos: POS; title: string }> = [
    { pos: 'noun', title: '名词槽（noun）' },
    { pos: 'verb', title: '动词原形槽（verb，前接 to / can / could）' },
    { pos: 'doing', title: 'doing 槽（as a result of 后）' },
  ];

  const normalizedSearch = search.trim().toLowerCase();

  return (
    <div style={{ display: 'flex', gap: 32, width: '100%', justifyContent: 'center' }}>
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
              模板库
            </h1>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 4 }}>
              悬停或点击红色槽位查看词性、万能填充词与易错提醒
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={`btn-secondary ${tab === 'templates' ? 'active' : ''}`}
              onClick={() => setTab('templates')}
            >
              <BookOpen size={14} strokeWidth={1.5} />
              7 套模板
            </button>
            <button
              type="button"
              className={`btn-secondary ${tab === 'fillers' ? 'active' : ''}`}
              onClick={() => setTab('fillers')}
            >
              <Layers size={14} strokeWidth={1.5} />
              万能填充词
            </button>
            <button
              type="button"
              className={`btn-secondary ${tab === 'chains' ? 'active' : ''}`}
              onClick={() => setTab('chains')}
            >
              <ListOrdered size={14} strokeWidth={1.5} />
              首词链
            </button>
          </div>
        </div>

        {tab === 'templates' && (
          <>
            {/* 模板切换条 */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  className={`btn-secondary ${selectedId === tpl.id ? 'active' : ''}`}
                  onClick={() => setSelectedId(tpl.id)}
                >
                  {tpl.name}
                </button>
              ))}
            </div>

            {/* 显示控制条 */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 16,
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius-s)',
              }}
            >
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className={`btn-secondary ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  完整信件
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${filter === 'skeleton' ? 'active' : ''}`}
                  onClick={() => setFilter('skeleton')}
                >
                  仅看骨架
                </button>
                <button
                  type="button"
                  className={`btn-secondary ${filter === 'body' ? 'active' : ''}`}
                  onClick={() => setFilter('body')}
                >
                  仅看主体
                </button>
              </div>

              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  color: 'var(--ink-muted)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={showZh}
                  onChange={(e) => setShowZh(e.target.checked)}
                />
                显示逐句中文
              </label>
            </div>

            <LetterView
              template={activeTemplate}
              showZh={showZh}
              filter={filter}
              cards={cards}
            />
          </>
        )}

        {tab === 'fillers' && (
          <div className="card">
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <Search
                size={16}
                strokeWidth={1.5}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-faint)',
                }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索槽位名、英文填充词或中文..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 'var(--radius-s)',
                  border: '1px solid var(--line)',
                  background: 'var(--surface-sunk)',
                  fontSize: 14,
                }}
              />
            </div>

            {groupedFillers.map((group) => {
              const rows = SLOT_LIST.filter((s) => {
                if (s.pos !== group.pos) return false;
                if (!normalizedSearch) return true;
                return (
                  s.label.toLowerCase().includes(normalizedSearch) ||
                  s.filler.toLowerCase().includes(normalizedSearch) ||
                  s.fillerZh.toLowerCase().includes(normalizedSearch)
                );
              });

              if (rows.length === 0) return null;

              return (
                <div key={group.pos} style={{ marginBottom: 24 }}>
                  <h2
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--gold)',
                      margin: '0 0 10px',
                    }}
                  >
                    {group.title}
                  </h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead>
                        <tr
                          style={{
                            borderBottom: '1px solid var(--line)',
                            textAlign: 'left',
                            color: 'var(--ink-muted)',
                            fontSize: 12,
                          }}
                        >
                          <th style={{ padding: '8px 10px' }}>槽位</th>
                          <th style={{ padding: '8px 10px' }}>万能填充词</th>
                          <th style={{ padding: '8px 10px' }}>中文</th>
                          <th style={{ padding: '8px 10px' }}>词性</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((slot) => (
                          <tr key={slot.id} style={{ borderBottom: '1px solid var(--line)' }}>
                            <td style={{ padding: '10px' }}>
                              <span className="slot-chip">{slot.label}</span>
                            </td>
                            <td style={{ padding: '10px', fontFamily: 'var(--font-serif)', fontSize: 15 }}>
                              {slot.filler}
                            </td>
                            <td style={{ padding: '10px', color: 'var(--ink-muted)' }}>{slot.fillerZh}</td>
                            <td style={{ padding: '10px', fontSize: 12, color: 'var(--ink-muted)' }}>
                              {POS_LABEL[slot.pos]}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'chains' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {TEMPLATES.map((tpl) => (
              <div key={tpl.id} className="card" style={{ padding: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}
                >
                  <strong style={{ fontSize: 15, color: 'var(--gold)' }}>{tpl.name}</strong>
                  <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    {tpl.storyLine.join(' → ')}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 16,
                    lineHeight: 1.75,
                    color: 'var(--ink)',
                  }}
                >
                  {tpl.firstWordChain}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 右侧辅助栏 */}
      {tab === 'templates' && (
        <aside className="aux-panel">
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', marginBottom: 10 }}>
              故事线 · {activeTemplate.name}
            </div>
            <StoryLine
              nodes={activeTemplate.storyLine}
              activeIndex={-1}
              detail={activeTemplate.storyLineDetail}
            />

            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid var(--line)',
                fontSize: 12,
                color: 'var(--ink-muted)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--ink)' }}>图例</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="slot-chip">槽位</span>
                <span>考场替换词，悬停看词性</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="result-word-highlight" style={{ fontFamily: 'var(--font-serif)' }}>
                  as it enables
                </span>
                <span>后半句结果词</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mastery-dot mastery-unlearned" />
                <span>未学</span>
                <span className="mastery-dot mastery-learning" />
                <span>学习中</span>
                <span className="mastery-dot mastery-familiar" />
                <span>熟悉</span>
                <span className="mastery-dot mastery-mastered" />
                <span>牢固</span>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
