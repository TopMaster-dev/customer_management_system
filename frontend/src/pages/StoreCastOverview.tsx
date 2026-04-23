import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UsersRound, AlertCircle, Wallet } from 'lucide-react';
import { API } from '../config';
import { formatPrice } from '../utils/formatPrice';
import type { CastOverviewRow, StoreCastOverviewResponse } from '../types/storeCastOverview';
import { Badge, Card, PageContainer, PageHeader } from '../components/ui';

function targetTypeLabel(t: string) {
  return t === 'Daily' ? '日次' : t === 'Monthly' ? '月次' : t;
}

function pctTone(pct: number | null | undefined): 'neutral' | 'success' | 'warning' | 'danger' {
  if (pct == null) return 'neutral';
  if (pct >= 100) return 'success';
  if (pct >= 70) return 'warning';
  return 'danger';
}

export default function StoreCastOverview() {
  const [casts, setCasts] = useState<CastOverviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get<StoreCastOverviewResponse>(`${API}/store-cast-overview/`)
      .then((r) => setCasts(r.data.casts ?? []))
      .catch((err) => {
        const msg =
          err?.response?.status === 403
            ? 'この一覧はスタッフ・マネージャーのみ利用できます。'
            : '一覧の取得に失敗しました。';
        setError(msg);
        setCasts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="キャスト状況一覧"
        description="担当店舗のキャストについて、売上目標の達成状況と給与（時給・歩合）を一覧します。"
        icon={<UsersRound className="h-5 w-5" strokeWidth={2} />}
      />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <Card><p className="text-sm text-ink-soft text-center">読み込み中…</p></Card>
      )}

      {!loading && !error && casts.length === 0 && (
        <Card><p className="text-sm text-ink-soft text-center">表示するキャストがありません。</p></Card>
      )}

      {!loading && !error && casts.length > 0 && (
        <div className="space-y-4">
          {casts.map((c) => (
            <Card key={c.staff_id} padded={false} className="overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-200 bg-gradient-to-br from-brand-50/40 to-indigo-50/30 flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold">
                  {c.email.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-ink truncate">
                    {c.email}
                    {c.username && <span className="ml-2 text-xs font-normal text-ink-soft">({c.username})</span>}
                  </h2>
                  <p className="text-xs text-ink-soft">{c.store_name}</p>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <h3 className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-soft inline-flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5" />
                    給与
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <StatTile label="時給" value={`${formatPrice(c.hourly_wage)} 円`} />
                    <StatTile label="今月歩合" value={`${formatPrice(c.current_month_commission)} 円`} />
                    <StatTile label="先月歩合" value={`${formatPrice(c.last_month_commission)} 円`} />
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 text-2xs font-semibold uppercase tracking-wider text-ink-soft">
                    目標達成（来店記録の利用額合計）
                  </h3>
                  {c.targets.length === 0 ? (
                    <p className="text-sm text-ink-soft">登録された目標がありません。</p>
                  ) : (
                    <div className="overflow-x-auto -mx-5">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="bg-slate-50/60 border-y border-slate-200">
                            <Th>種別</Th>
                            <Th>対象日</Th>
                            <Th className="text-right">目標</Th>
                            <Th className="text-right">達成額</Th>
                            <Th className="text-right">達成率</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.targets.map((t) => (
                            <tr key={t.id} className="border-b border-slate-100 last:border-0">
                              <Td>
                                <Badge tone={t.target_type === 'Daily' ? 'info' : 'brand'}>{targetTypeLabel(t.target_type)}</Badge>
                              </Td>
                              <Td className="num-tabular text-ink-muted">{t.target_date}</Td>
                              <Td className="num-tabular text-right text-ink">{formatPrice(t.target_amount)} 円</Td>
                              <Td className="num-tabular text-right text-ink">{formatPrice(t.achieved_amount)} 円</Td>
                              <Td className="text-right">
                                {t.achievement_percent == null ? (
                                  <span className="text-ink-faint">—</span>
                                ) : (
                                  <Badge tone={pctTone(t.achievement_percent)}>{t.achievement_percent}%</Badge>
                                )}
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p className="mt-1.5 text-lg font-semibold text-ink num-tabular">{value}</p>
    </div>
  );
}
function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap text-left ${className || ''}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3 align-top ${className || ''}`}>{children}</td>;
}
