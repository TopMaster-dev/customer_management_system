import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { PiggyBank, Plus, Trash2, AlertCircle, TrendingUp, TrendingDown, Scale, ListChecks } from 'lucide-react';
import { API } from '../config';
import { formatPrice } from '../utils/formatPrice';
import type { PersonalLedgerEntry, PersonalLedgerFormData, PersonalLedgerSummary } from '../types/personalLedger';
import {
  Badge,
  Button,
  Card,
  Input,
  PageContainer,
  PageHeader,
  Select,
} from '../components/ui';

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthValue() {
  return todayISO().slice(0, 7);
}

function parseYM(v: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}

const emptyForm: PersonalLedgerFormData = {
  entry_date: todayISO(),
  entry_type: 'Expense',
  amount: '',
  category: '',
  memo: '',
};

export default function PersonalLedger() {
  const [entries, setEntries] = useState<PersonalLedgerEntry[]>([]);
  const [summary, setSummary] = useState<PersonalLedgerSummary | null>(null);
  const [month, setMonth] = useState(monthValue);
  const [form, setForm] = useState<PersonalLedgerFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ym = useMemo(() => parseYM(month), [month]);

  const refresh = () => {
    if (!ym) return;
    setLoading(true);
    setError(null);
    Promise.all([
      axios
        .get<PersonalLedgerEntry[]>(`${API}/personal-ledger/`, { params: { entry_date__year: ym.year, entry_date__month: ym.month } })
        .then((r) => r.data)
        .catch(() => [] as PersonalLedgerEntry[]),
      axios
        .get<PersonalLedgerSummary>(`${API}/personal-ledger/summary/`, { params: { year: ym.year, month: ym.month } })
        .then((r) => r.data)
        .catch(() => null),
    ])
      .then(([e, s]) => {
        setEntries(e);
        setSummary(s);
      })
      .catch(() => setError('データの取得に失敗しました。'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Math.round(Number(form.amount || 0));
    if (!form.entry_date || !Number.isFinite(amountNum) || amountNum <= 0) {
      setError('日付と金額（1以上）を入力してください。');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await axios.post(`${API}/personal-ledger/`, {
        entry_date: form.entry_date,
        entry_type: form.entry_type,
        amount: String(amountNum),
        category: form.category,
        memo: form.memo,
      });
      setForm((f) => ({ ...f, amount: '', category: '', memo: '' }));
      refresh();
    } catch {
      setError('登録に失敗しました。');
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!window.confirm('この収支を削除しますか？')) return;
    try {
      await axios.delete(`${API}/personal-ledger/${id}/`);
      refresh();
    } catch {
      setError('削除に失敗しました。');
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="家計簿（個人収支）"
        description="キャスト本人の収入・支出を記録し、月次の合計を確認できます。"
        icon={<PiggyBank className="h-5 w-5" strokeWidth={2} />}
      />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card padded={false} className="overflow-hidden lg:col-span-1">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/40">
            <h2 className="text-sm font-semibold text-ink inline-flex items-center gap-2">
              <Plus className="h-4 w-4 text-brand-600" /> 収支を追加
            </h2>
          </div>
          <form onSubmit={submit} className="p-5 space-y-3">
            <Input label="日付" type="date" value={form.entry_date} onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))} required />
            <Select label="区分" value={form.entry_type} onChange={(e) => setForm((f) => ({ ...f, entry_type: e.target.value as 'Income' | 'Expense' }))}>
              <option value="Income">収入</option>
              <option value="Expense">支出</option>
            </Select>
            <Input label="金額" type="number" min={1} step={1} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
            <Input label="カテゴリ" type="text" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="例: 交通費 / 食費 / 給与" />
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1.5">メモ</label>
              <textarea
                value={form.memo}
                onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                rows={3}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <Button type="submit" loading={saving} fullWidth leftIcon={<Plus className="h-4 w-4" />}>追加</Button>
          </form>
        </Card>

        <Card padded={false} className="overflow-hidden lg:col-span-2">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/40 flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">月次集計</h2>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div className="p-5">
            {loading ? (
              <p className="text-sm text-ink-soft text-center">読み込み中…</p>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <SummaryTile
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="収入"
                    value={`${formatPrice(summary?.income_total ?? 0)} 円`}
                    tone="success"
                  />
                  <SummaryTile
                    icon={<TrendingDown className="h-4 w-4" />}
                    label="支出"
                    value={`${formatPrice(summary?.expense_total ?? 0)} 円`}
                    tone="danger"
                  />
                  <SummaryTile
                    icon={<Scale className="h-4 w-4" />}
                    label="差額"
                    value={`${formatPrice(summary?.balance ?? 0)} 円`}
                    tone="brand"
                  />
                  <SummaryTile
                    icon={<ListChecks className="h-4 w-4" />}
                    label="件数"
                    value={`${(summary?.entry_count ?? 0).toLocaleString()} 件`}
                    tone="neutral"
                  />
                </div>

                <div className="mt-5 overflow-x-auto -mx-5">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="bg-slate-50/40 border-y border-slate-200">
                        <Th>日付</Th>
                        <Th>区分</Th>
                        <Th>カテゴリ</Th>
                        <Th className="text-right">金額</Th>
                        <Th>メモ</Th>
                        <Th className="text-right">操作</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-sm text-ink-soft">この月の記録はありません。</td>
                        </tr>
                      ) : (
                        entries.map((e) => (
                          <tr key={e.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/20 transition-colors">
                            <Td className="num-tabular text-ink-muted">{e.entry_date}</Td>
                            <Td>
                              <Badge tone={e.entry_type === 'Income' ? 'success' : 'danger'}>
                                {e.entry_type === 'Income' ? '収入' : '支出'}
                              </Badge>
                            </Td>
                            <Td className="text-ink-muted">{e.category || '—'}</Td>
                            <Td className="num-tabular text-right font-medium text-ink">{formatPrice(Number(e.amount || 0))} 円</Td>
                            <Td className="text-ink-soft max-w-[240px] truncate" title={e.memo || undefined}>{e.memo || '—'}</Td>
                            <Td className="text-right">
                              <button
                                type="button"
                                onClick={() => remove(e.id)}
                                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-soft hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                削除
                              </button>
                            </Td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

const toneStyles: Record<'success' | 'danger' | 'brand' | 'neutral', string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  danger: 'bg-rose-50 text-rose-700 border-rose-100',
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  neutral: 'bg-slate-50 text-ink border-slate-200',
};

function SummaryTile({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: 'success' | 'danger' | 'brand' | 'neutral' }) {
  return (
    <div className={`rounded-xl border p-3 ${toneStyles[tone]}`}>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-1.5 text-base sm:text-lg font-semibold num-tabular">{value}</p>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap text-left ${className || ''}`}>{children}</th>;
}
function Td({ children, className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }) {
  return <td className={`px-5 py-3 ${className || ''}`} {...rest}>{children}</td>;
}
