import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { LineChart, RefreshCw, AlertCircle, Medal, TrendingUp, Users, Sparkles } from 'lucide-react';
import { API } from '../config';
import { formatPrice } from '../utils/formatPrice';
import type { MonthlyStoreRankingRow, MonthlyStoreRankingsResponse } from '../types/monthlyRankings';
import { Button, Card, PageContainer, PageHeader } from '../components/ui';

function ymFromInput(v: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function currentMonthValue() {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${mo}`;
}

function sortedByRank(rows: MonthlyStoreRankingRow[], rankKey: keyof MonthlyStoreRankingRow) {
  return [...rows].sort((a, b) => {
    const ra = a[rankKey] as number;
    const rb = b[rankKey] as number;
    if (ra !== rb) return ra - rb;
    return a.store_name.localeCompare(b.store_name, 'ja');
  });
}

export default function MonthlyStoreRankings() {
  const [ym, setYm] = useState(currentMonthValue);
  const [data, setData] = useState<MonthlyStoreRankingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    const parsed = ymFromInput(ym);
    if (!parsed) {
      setError('年月を正しく選択してください。');
      return;
    }
    setLoading(true);
    setError(null);
    axios
      .get<MonthlyStoreRankingsResponse>(`${API}/monthly-store-rankings/`, {
        params: { year: parsed.year, month: parsed.month },
      })
      .then((r) => setData(r.data))
      .catch((err) => {
        setData(null);
        setError(
          err?.response?.status === 403
            ? 'このレポートはオーナー・管理者のみ利用できます。'
            : 'データの取得に失敗しました。',
        );
      })
      .finally(() => setLoading(false));
  }, [ym]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bySales = useMemo(() => (data ? sortedByRank(data.by_store, 'rank_sales') : []), [data]);
  const byGroups = useMemo(() => (data ? sortedByRank(data.by_store, 'rank_groups') : []), [data]);
  const byNew = useMemo(() => (data ? sortedByRank(data.by_store, 'rank_new_groups') : []), [data]);

  return (
    <PageContainer>
      <PageHeader
        title="当月店舗ランキング"
        description="店舗ごとの売上・組数・新規組数の順位。新規組数は「初回来店日が対象月内」のお客様です。"
        icon={<LineChart className="h-5 w-5" strokeWidth={2} />}
        actions={
          <Button size="sm" variant="outline" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={fetchData}>
            再読み込み
          </Button>
        }
      />

      <Card className="mb-4 !p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted">
            対象年月
            <input
              type="month"
              value={ym}
              onChange={(e) => setYm(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>
        </div>
      </Card>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && <Card><p className="text-sm text-ink-soft text-center">読み込み中…</p></Card>}

      {data && !loading && !error && (
        <>
          <Card className="mb-5 bg-gradient-to-br from-brand-50 to-indigo-50/50 border-brand-100">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-3">全体（全店合計）</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryTile icon={<TrendingUp className="h-4 w-4" />} label="当月売上" value={`${formatPrice(data.overall.sales_total)} 円`} />
              <SummaryTile icon={<Users className="h-4 w-4" />} label="組数（来店件数）" value={`${data.overall.groups_total.toLocaleString()} 組`} />
              <SummaryTile icon={<Sparkles className="h-4 w-4" />} label="新規組数" value={`${data.overall.new_groups_total.toLocaleString()} 組`} />
            </div>
          </Card>

          <div className="space-y-5">
            <RankingTable
              title={`売上ランキング（${data.year}年${data.month}月）`}
              rows={bySales}
              rankKey="rank_sales"
              valueKey="sales"
              valueLabel="売上"
              formatValue={(n) => `${formatPrice(n)} 円`}
            />
            <RankingTable
              title="組数ランキング"
              rows={byGroups}
              rankKey="rank_groups"
              valueKey="groups"
              valueLabel="組数"
              formatValue={(n) => `${n.toLocaleString()} 組`}
            />
            <RankingTable
              title="新規組数ランキング"
              rows={byNew}
              rankKey="rank_new_groups"
              valueKey="new_groups"
              valueLabel="新規組数"
              formatValue={(n) => `${n.toLocaleString()} 組`}
            />
          </div>
        </>
      )}
    </PageContainer>
  );
}

function SummaryTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80 text-brand-600">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-ink-soft">{label}</p>
        <p className="text-lg font-semibold text-ink num-tabular">{value}</p>
      </div>
    </div>
  );
}

function rankBadge(rank: number) {
  if (rank === 1) return 'bg-amber-100 text-amber-800 ring-amber-200';
  if (rank === 2) return 'bg-slate-100 text-slate-700 ring-slate-200';
  if (rank === 3) return 'bg-orange-100 text-orange-800 ring-orange-200';
  return 'bg-slate-50 text-ink-muted ring-slate-200';
}

function RankingTable({
  title,
  rows,
  rankKey,
  valueKey,
  valueLabel,
  formatValue,
}: {
  title: string;
  rows: MonthlyStoreRankingRow[];
  rankKey: keyof MonthlyStoreRankingRow;
  valueKey: keyof MonthlyStoreRankingRow;
  valueLabel: string;
  formatValue: (n: number) => string;
}) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/40 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-ink inline-flex items-center gap-2">
          <Medal className="h-4 w-4 text-brand-600" />
          {title}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-sm">
          <thead>
            <tr className="bg-slate-50/40 border-b border-slate-200">
              <Th className="w-20">順位</Th>
              <Th>店舗</Th>
              <Th className="text-right">{valueLabel}</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rank = r[rankKey] as number;
              return (
                <tr key={r.store_id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/30 transition-colors">
                  <Td>
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset num-tabular ${rankBadge(rank)}`}>
                      {rank}
                    </span>
                  </Td>
                  <Td className="font-medium text-ink">{r.store_name}</Td>
                  <Td className="num-tabular text-right text-ink">{formatValue(r[valueKey] as number)}</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap text-left ${className || ''}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3 ${className || ''}`}>{children}</td>;
}
