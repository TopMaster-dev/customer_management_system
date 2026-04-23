import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCircle,
  Target,
  Trophy,
  Users,
  UserPlus,
  ClipboardList,
  Wallet,
  Receipt,
  FileText,
  PiggyBank,
  Settings2,
  Store,
  ShieldCheck,
  UsersRound,
  LineChart,
  LogOut,
  Menu as MenuIcon,
  X as CloseIcon,
  type LucideIcon,
} from 'lucide-react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { USER_ROLE_LABELS } from './types/user';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerList from './pages/CustomerList';
import CustomerRegistration from './pages/CustomerRegistration';
import VisitRecordList from './pages/VisitRecordList';
import DailySalesEntry from './pages/DailySalesEntry';
import DailyExpenseEntry from './pages/DailyExpenseEntry';
import DailyReportList from './pages/DailyReportList';
import StoreList from './pages/StoreList';
import UserList from './pages/UserList';
import StaffMemberList from './pages/StaffMemberList';
import MyPage from './pages/MyPage';
import PerformanceTargetList from './pages/PerformanceTargetList';
import StoreTargetList from './pages/StoreTargetList';
import StoreCastOverview from './pages/StoreCastOverview';
import MonthlyStoreRankings from './pages/MonthlyStoreRankings';
import HostSalarySettings from './pages/HostSalarySettings';
import PersonalLedger from './pages/PersonalLedger';
import type { AuthUser } from './types/auth';

type NavItem = { to: string; label: string; icon: LucideIcon };
type NavGroup = { heading: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'メイン',
    items: [
      { to: '/',          label: 'ホーム',       icon: LayoutDashboard },
      { to: '/my-page',   label: 'マイページ',   icon: UserCircle },
    ],
  },
  {
    heading: '売上・目標',
    items: [
      { to: '/performance-targets', label: '売上目標',       icon: Target },
      { to: '/store-targets',       label: '店舗目標',       icon: Trophy },
      { to: '/store-cast-overview', label: 'キャスト状況',   icon: UsersRound },
      { to: '/monthly-rankings',    label: '当月ランキング', icon: LineChart },
    ],
  },
  {
    heading: '顧客・来店',
    items: [
      { to: '/customers',          label: 'お客様一覧', icon: Users },
      { to: '/customers/register', label: 'お客様登録', icon: UserPlus },
      { to: '/visit-records',      label: '来店記録',   icon: ClipboardList },
    ],
  },
  {
    heading: '会計',
    items: [
      { to: '/daily-sales',    label: '日次売上',  icon: Wallet },
      { to: '/daily-expenses', label: '日次経費',  icon: Receipt },
      { to: '/daily-reports',  label: '日報',      icon: FileText },
      { to: '/personal-ledger', label: '家計簿',   icon: PiggyBank },
    ],
  },
  {
    heading: '管理',
    items: [
      { to: '/host-salary-settings', label: '給与設定(ホスト)', icon: Settings2 },
      { to: '/stores',               label: '店舗管理',          icon: Store },
      { to: '/users',                label: 'ユーザー管理',      icon: ShieldCheck },
      { to: '/staff-members',        label: 'スタッフ管理',      icon: UsersRound },
    ],
  },
];

function SidebarLayout({ children, user }: { children: React.ReactNode; user: AuthUser }) {
  const { logout, isAllowed } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(({ to }) => isAllowed(to.replace(/\/$/, '') || '/')),
      })).filter((group) => group.items.length > 0),
    [isAllowed],
  );

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    [
      'group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
      isActive
        ? 'bg-brand-50 text-brand-700 font-medium'
        : 'text-ink-muted hover:bg-slate-100 hover:text-ink',
    ].join(' ');

  return (
    <div className="flex min-h-screen">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          aria-label="メニューを閉じる"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-xl transition-transform duration-200 ease-out md:static md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-200 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
            <Store className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink leading-tight">顧客管理</p>
            <p className="truncate text-2xs text-ink-faint leading-tight">Customer Mgmt.</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1.5 text-ink-soft hover:bg-slate-100 hover:text-ink md:hidden"
            aria-label="サイドバーを閉じる"
            onClick={() => setMobileOpen(false)}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-3 py-4" aria-label="メインメニュー">
          {visibleGroups.map((group, idx) => (
            <div key={group.heading} className={idx > 0 ? 'mt-5' : ''}>
              <p className="px-2.5 mb-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-faint">
                {group.heading}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>
                    <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-200 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
              {user.email.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-ink" title={user.email}>{user.email}</p>
              <p className="text-2xs text-ink-faint">{USER_ROLE_LABELS[user.role] ?? user.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-muted hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
            ログアウト
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/70 px-4 backdrop-blur-xl md:hidden">
          <button
            type="button"
            className="rounded-lg p-2 text-ink-muted hover:bg-slate-100 hover:text-ink"
            aria-expanded={mobileOpen}
            aria-label="メニューを開く"
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="truncate text-sm font-semibold text-ink">顧客管理</span>
        </header>
        <main className="min-h-0 flex-1">{children}</main>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-ink-soft">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <p className="text-sm">読み込み中…</p>
        </div>
      </div>
    );
  }

  const appRoutes = (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomerList /></ProtectedRoute>} />
      <Route path="/customers/register" element={<ProtectedRoute><CustomerRegistration /></ProtectedRoute>} />
      <Route path="/visit-records" element={<ProtectedRoute><VisitRecordList /></ProtectedRoute>} />
      <Route path="/daily-sales" element={<ProtectedRoute><DailySalesEntry /></ProtectedRoute>} />
      <Route path="/daily-expenses" element={<ProtectedRoute><DailyExpenseEntry /></ProtectedRoute>} />
      <Route path="/daily-reports" element={<ProtectedRoute><DailyReportList /></ProtectedRoute>} />
      <Route path="/store-targets" element={<ProtectedRoute><StoreTargetList /></ProtectedRoute>} />
      <Route path="/stores" element={<ProtectedRoute><StoreList /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UserList /></ProtectedRoute>} />
      <Route path="/staff-members" element={<ProtectedRoute><StaffMemberList /></ProtectedRoute>} />
      <Route path="/my-page" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      <Route path="/performance-targets" element={<ProtectedRoute><PerformanceTargetList /></ProtectedRoute>} />
      <Route path="/store-cast-overview" element={<ProtectedRoute><StoreCastOverview /></ProtectedRoute>} />
      <Route path="/monthly-rankings" element={<ProtectedRoute><MonthlyStoreRankings /></ProtectedRoute>} />
      <Route path="/host-salary-settings" element={<ProtectedRoute><HostSalarySettings /></ProtectedRoute>} />
      <Route path="/personal-ledger" element={<ProtectedRoute><PersonalLedger /></ProtectedRoute>} />
    </Routes>
  );

  if (!user) {
    return <div className="min-h-screen">{appRoutes}</div>;
  }

  return <SidebarLayout user={user}>{appRoutes}</SidebarLayout>;
}

export default App;
