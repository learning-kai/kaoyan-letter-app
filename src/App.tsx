import { useEffect, useState } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useLocation,
} from 'react-router-dom';
import {
  CalendarCheck,
  GraduationCap,
  RotateCw,
  FilePenLine,
  AlertCircle,
  BarChart3,
  BookOpen,
  Settings,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { useProgress } from './store/useProgress';
import { useSettings } from './store/useSettings';
import { isCardDue } from './core/scheduler';
import { TodayPage } from './pages/Today';
import { LearnPage } from './pages/Learn';
import { ReviewPage } from './pages/Review';
import { ExamPage } from './pages/Exam';
import { MistakesPage } from './pages/Mistakes';
import { StatsPage } from './pages/Stats';
import { LibraryPage } from './pages/Library';
import { SettingsPage } from './pages/Settings';
import { ShortcutModal } from './components/ShortcutModal';

function AppLayout() {
  const location = useLocation();
  const cards = useProgress((s) => s.cards);
  const fontSize = useSettings((s) => s.fontSize);
  const theme = useSettings((s) => s.theme);

  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  // 字号同步
  useEffect(() => {
    document.documentElement.style.setProperty('--body-size', `${fontSize}px`);
  }, [fontSize]);

  // 浅色 / 深色 / 跟随系统主题同步
  useEffect(() => {
    const applyTheme = () => {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else if (theme === 'light') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        const prefersDark =
          typeof window !== 'undefined' &&
          window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) document.documentElement.setAttribute('data-theme', 'dark');
        else document.documentElement.removeAttribute('data-theme');
      }
    };
    applyTheme();
    if (theme === 'system' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', applyTheme);
      return () => mq.removeEventListener('change', applyTheme);
    }
  }, [theme]);

  // 路由切换时关闭移动端更多抽屉
  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  const now = new Date();
  const dueCount = Object.values(cards).filter((c) => isCardDue(c, now)).length;
  const learnedCount = Object.values(cards).filter((c) => c.learned).length;

  const isFocusMode = location.pathname === '/review';

  if (isFocusMode) {
    return (
      <>
        <Routes>
          <Route path="/review" element={<ReviewPage />} />
        </Routes>
        <ShortcutModal open={shortcutOpen} onOpenChange={setShortcutOpen} />
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <div className="brand">
          <span className="brand-mark">L</span>
          <div className="brand-text">
            <div className="brand-title">考研小作文</div>
            <div className="brand-sub">FSRS 模板背诵</div>
          </div>
        </div>

        <nav className="nav-list">
          <NavLink to="/today" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CalendarCheck size={17} strokeWidth={1.5} />
            <span className="nav-text">今日</span>
          </NavLink>

          <NavLink to="/learn" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <GraduationCap size={17} strokeWidth={1.5} />
            <span className="nav-text">学习</span>
          </NavLink>

          <NavLink to="/review" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <RotateCw size={17} strokeWidth={1.5} />
            <span className="nav-text">复习</span>
            {dueCount > 0 && <span className="nav-badge tabular-nums">{dueCount}</span>}
          </NavLink>

          <NavLink to="/exam" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FilePenLine size={17} strokeWidth={1.5} />
            <span className="nav-text">实战</span>
          </NavLink>

          <NavLink to="/mistakes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <AlertCircle size={17} strokeWidth={1.5} />
            <span className="nav-text">错题本</span>
          </NavLink>

          <NavLink to="/stats" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <BarChart3 size={17} strokeWidth={1.5} />
            <span className="nav-text">统计</span>
          </NavLink>

          <NavLink to="/library" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <BookOpen size={17} strokeWidth={1.5} />
            <span className="nav-text">模板库</span>
          </NavLink>

          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Settings size={17} strokeWidth={1.5} />
            <span className="nav-text">设置</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="tabular-nums">已学句子：{learnedCount} 句</div>
          <div className="tabular-nums" style={{ marginTop: 4 }}>
            待复习：{dueCount} 句
          </div>
        </div>
      </aside>

      <main className="main-area">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<TodayPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/exam" element={<ExamPage />} />
          <Route path="/mistakes" element={<MistakesPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>

      {/* 手机端底部 5 项标签栏 */}
      <nav className="mobile-nav" aria-label="移动端导航">
        <NavLink to="/today" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <CalendarCheck size={18} strokeWidth={1.5} />
          <span>今日</span>
        </NavLink>
        <NavLink to="/learn" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <GraduationCap size={18} strokeWidth={1.5} />
          <span>学习</span>
        </NavLink>
        <NavLink to="/review" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <RotateCw size={18} strokeWidth={1.5} />
          <span>复习{dueCount > 0 ? `(${dueCount})` : ''}</span>
        </NavLink>
        <NavLink to="/exam" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <FilePenLine size={18} strokeWidth={1.5} />
          <span>实战</span>
        </NavLink>
        <button
          type="button"
          className={`mobile-nav-item ${moreOpen ? 'active' : ''}`}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <MoreHorizontal size={18} strokeWidth={1.5} />
          <span>更多</span>
        </button>
      </nav>

      {/* 移动端“更多”弹窗 */}
      {moreOpen && (
        <div className="modal-backdrop" onClick={() => setMoreOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <strong>更多页面</strong>
              <button type="button" className="btn-ghost" onClick={() => setMoreOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <NavLink to="/mistakes" className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
                <AlertCircle size={15} strokeWidth={1.5} /> 错题本
              </NavLink>
              <NavLink to="/stats" className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
                <BarChart3 size={15} strokeWidth={1.5} /> 学习统计
              </NavLink>
              <NavLink to="/library" className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
                <BookOpen size={15} strokeWidth={1.5} /> 模板库
              </NavLink>
              <NavLink to="/settings" className="btn-secondary" style={{ textDecoration: 'none', justifyContent: 'flex-start' }}>
                <Settings size={15} strokeWidth={1.5} /> 设置
              </NavLink>
            </div>
          </div>
        </div>
      )}

      <ShortcutModal open={shortcutOpen} onOpenChange={setShortcutOpen} />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
}
