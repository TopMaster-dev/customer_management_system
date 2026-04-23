import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  UserPlus,
  Users,
  ClipboardList,
  Wallet,
  Receipt,
  Store as StoreIcon,
  ShieldCheck,
  UsersRound,
  ArrowRight,
  Activity,
  TrendingUp,
  Calendar,
  CircleDollarSign,
  type LucideIcon,
} from 'lucide-react';
import { API } from '../config';
import { Badge, Card, PageContainer, PageHeader } from '../components/ui';

type BackendStatus = 'checking' | 'ok' | 'error';

type QuickAction = {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
};

const QUICK_ACTIONS: QuickAction[] = [
  { to: '/customers/register', label: 'お客様登録', description: '新規お客様の基本情報・詳細を登録', icon: UserPlus },
  { to: '/customers',          label: 'お客様一覧', description: '登録済みお客様の検索・一覧',       icon: Users },
  { to: '/visit-records',      label: '来店記録',   description: '来店・売上記録の入力・照会',       icon: ClipboardList },
  { to: '/daily-sales',        label: '日次売上',   description: '日別売上の入力・送信',             icon: Wallet },
  { to: '/daily-expenses',     label: '日次経費',   description: '日別経費・人件費の入力・送信',     icon: Receipt },
  { to: '/stores',             label: '店舗管理',   description: '店舗の登録・一覧・編集',           icon: StoreIcon },
  { to: '/users',              label: 'ユーザー管理', description: 'ユーザー登録・権限・無効化',    icon: ShieldCheck },
  { to: '/staff-members',      label: 'スタッフ管理', description: 'スタッフ・担当者の登録・一覧・編集', icon: UsersRound },
];

type Stat = { label: string; value: string; sub: string; icon: LucideIcon };
const STATS: Stat[] = [
  { label: '登録顧客数',   value: '—', sub: '件', icon: Users },
  { label: '今月の新規',   value: '—', sub: '件', icon: TrendingUp },
  { label: '今月売上',     value: '—', sub: '円', icon: CircleDollarSign },
  { label: '本日の来店',   value: '—', sub: '件', icon: Calendar },
];

function StatusBadge({ status }: { status: BackendStatus }) {
  if (status === 'ok') return <Badge tone="success" dot>API接続済み</Badge>;
  if (status === 'error') return <Badge tone="danger" dot>API未接続</Badge>;
  return <Badge tone="neutral" dot>接続確認中</Badge>;
}

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');

  useEffect(() => {
    axios
      .get(`${API}/`)
      .then(() => setBackendStatus('ok'))
      .catch(() => setBackendStatus('error'));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="ダッシュボード"
        description="顧客管理・売上システムの概要"
        icon={<Activity className="h-5 w-5" strokeWidth={2} />}
        actions={<StatusBadge status={backendStatus} />}
      />

      <section className="mb-8">
        <h2 className="mb-3 text-2xs font-semibold uppercase tracking-wider text-ink-faint">概要</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATS.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.label} padded={false} className="p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-ink-soft">{item.label}</p>
                  <Icon className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
                </div>
                <p className="mt-3 text-2xl font-semibold text-ink num-tabular">
                  {item.value}
                  <span className="ml-0.5 text-sm font-normal text-ink-soft">{item.sub}</span>
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xs font-semibold uppercase tracking-wider text-ink-faint">クイックアクション</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.to}
                className="group rounded-xl border border-slate-200/70 bg-white p-5 shadow-card transition-all hover:border-brand-200 hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-ink">{action.label}</h3>
                <p className="mt-1 text-xs text-ink-soft leading-relaxed">{action.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-transform group-hover:gap-1.5">
                  開く
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-ink-faint">
        顧客情報の取り扱いには十分ご注意ください。
      </p>
    </PageContainer>
  );
}
