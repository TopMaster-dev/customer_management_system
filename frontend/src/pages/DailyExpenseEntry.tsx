import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Receipt,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Save,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { DailySummary } from '../types/dailySummary';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import { formatPrice } from '../utils/formatPrice';
import type { Store, Customer } from '../types/customer';
import type { VisitRecord } from '../types/visitRecord';
import { API } from '../config';
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  PageContainer,
  PageHeader,
  Select,
} from '../components/ui';

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function computeTotalSalesFromVisits(
  visitRecords: VisitRecord[],
  customers: Customer[],
  storeId: string,
  reportDate: string,
): number {
  const customerIdsForStore = new Set(customers.filter((c) => c.store === storeId).map((c) => c.id));
  return visitRecords
    .filter((r) => r.visit_date === reportDate && customerIdsForStore.has(r.customer))
    .reduce((sum, r) => sum + Number(r.spending || 0), 0);
}

export default function DailyExpenseEntry() {
  const [stores, setStores] = useState<Store[]>([]);
  const [summaries, setSummaries] = useState<DailySummary[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [storeId, setStoreId] = useState('');
  const [reportDate, setReportDate] = useState(todayISO());
  const [storeEnteredSales, setStoreEnteredSales] = useState('');
  const [totalExpenses, setTotalExpenses] = useState('');
  const [laborCosts, setLaborCosts] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchSummaries = () => {
    axios.get<DailySummary[]>(`${API}/daily-summaries/`).then((r) => setSummaries(r.data)).catch(() => setSummaries([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
      axios.get<DailySummary[]>(`${API}/daily-summaries/`).then((r) => r.data).catch(() => []),
      axios.get<Customer[]>(`${API}/customers/`).then((r) => r.data).catch(() => []),
      axios.get<VisitRecord[]>(`${API}/visit-records/`).then((r) => r.data).catch(() => []),
    ]).then(([s, sum, custs, recs]) => {
      setStores(s);
      setSummaries(sum);
      setCustomers(custs);
      setVisitRecords(recs);
      if (s.length > 0 && !storeId) setStoreId(s[0].id);
    });
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  const computedTotalSales = useMemo(
    () => (storeId && reportDate ? computeTotalSalesFromVisits(visitRecords, customers, storeId, reportDate) : 0),
    [visitRecords, customers, storeId, reportDate],
  );

  const openModal = () => {
    setError(null);
    setEditId(null);
    setReportDate(todayISO());
    setStoreEnteredSales('');
    setTotalExpenses('');
    setLaborCosts('');
    setNotes('');
    setModalOpen(true);
  };

  const openEdit = (s: DailySummary) => {
    setError(null);
    setEditId(s.id);
    setStoreId(s.store);
    setReportDate(s.report_date);
    const sales = Number(s.total_sales);
    setStoreEnteredSales(Number.isNaN(sales) ? '' : String(Math.round(sales)));
    const exp = Number(s.total_expenses);
    const labor = Number(s.labor_costs);
    setTotalExpenses(Number.isNaN(exp) ? '' : String(Math.round(exp)));
    setLaborCosts(Number.isNaN(labor) ? '' : String(Math.round(labor)));
    setNotes(s.notes ?? '');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !reportDate.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    const expenses = Math.round(Number(totalExpenses.trim() || 0));
    const labor = Math.round(Number(laborCosts.trim() || 0));
    const totalSales = storeEnteredSales.trim() !== '' ? Math.round(Number(storeEnteredSales)) : Math.round(computedTotalSales);
    try {
      if (editId) {
        await axios.patch(`${API}/daily-summaries/${editId}/`, {
          store: storeId,
          report_date: reportDate,
          total_sales: String(totalSales),
          total_expenses: String(expenses),
          labor_costs: String(labor),
          notes: notes.trim(),
        });
      } else {
        const existing = summaries.find((s) => s.store === storeId && s.report_date === reportDate);
        if (existing) {
          await axios.patch(`${API}/daily-summaries/${existing.id}/`, {
            store: existing.store,
            report_date: existing.report_date,
            total_sales: String(totalSales),
            total_expenses: String(expenses),
            labor_costs: String(labor),
            notes: notes.trim(),
          });
        } else {
          await axios.post(`${API}/daily-summaries/`, {
            store: storeId,
            report_date: reportDate,
            total_sales: String(totalSales),
            total_expenses: String(expenses),
            labor_costs: String(labor),
            notes: notes.trim(),
          });
        }
      }
      fetchSummaries();
      setSuccess(true);
      closeModal();
    } catch {
      setError(ERROR_MESSAGES.create);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`${API}/daily-summaries/${id}/`);
      fetchSummaries();
      setDeleteConfirmId(null);
    } catch {
      setError(ERROR_MESSAGES.delete);
    }
  };

  const recentSummaries = [...summaries].sort((a, b) => b.report_date.localeCompare(a.report_date)).slice(0, 20);

  const castSalesByStoreAndDate = useMemo(() => {
    const map = new Map<string, number>();
    const customerToStore = new Map<string, string>();
    customers.forEach((c) => customerToStore.set(c.id, c.store));
    visitRecords.forEach((r) => {
      const storeIdForCust = customerToStore.get(r.customer);
      if (storeIdForCust == null) return;
      const key = `${storeIdForCust}\t${r.visit_date}`;
      map.set(key, (map.get(key) ?? 0) + Number(r.spending || 0));
    });
    return map;
  }, [customers, visitRecords]);

  const getCastSales = (storeIdArg: string, reportDateArg: string) => castSalesByStoreAndDate.get(`${storeIdArg}\t${reportDateArg}`) ?? 0;
  const isSalesMismatch = (s: DailySummary) => {
    const storeEntered = Number(s.total_sales);
    const castSum = getCastSales(s.store, s.report_date);
    if (Number.isNaN(storeEntered)) return castSum !== 0;
    return storeEntered !== castSum;
  };

  return (
    <PageContainer>
      <PageHeader
        title="日次経費入力"
        description="日別の経費・人件費を入力・送信します。"
        icon={<Receipt className="h-5 w-5" strokeWidth={2} />}
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openModal}>
            経費を登録
          </Button>
        }
      />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>送信しました。</span>
        </div>
      )}

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-slate-200 bg-slate-50/40">
          <h2 className="text-sm font-semibold text-ink">直近の日次サマリー（経費・人件費）</h2>
        </div>
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-ink-soft">読み込み中…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="bg-slate-50/40 border-b border-slate-200">
                  <Th>店舗</Th>
                  <Th>対象日</Th>
                  <Th className="text-right">売上（店舗入力）</Th>
                  <Th className="text-right">売上（キャスト集計）</Th>
                  <Th className="text-right">経費（円）</Th>
                  <Th className="text-right">人件費（円）</Th>
                  <Th>備考</Th>
                  <Th className="text-right">操作</Th>
                </tr>
              </thead>
              <tbody>
                {recentSummaries.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-ink-soft">データがありません</td></tr>
                ) : (
                  recentSummaries.map((s) => {
                    const mismatch = isSalesMismatch(s);
                    const castSum = getCastSales(s.store, s.report_date);
                    return (
                      <tr key={s.id} className={`border-b border-slate-100 last:border-0 transition-colors ${mismatch ? 'bg-amber-50/50' : 'hover:bg-brand-50/30'}`}>
                        <Td><Badge tone="neutral">{storeName(s.store)}</Badge></Td>
                        <Td className="num-tabular text-ink-muted">{s.report_date}</Td>
                        <Td className="num-tabular text-right text-ink">{formatPrice(s.total_sales)}</Td>
                        <Td className="num-tabular text-right">
                          <span className={mismatch ? 'text-amber-700 font-medium' : 'text-ink-muted'}>
                            {formatPrice(castSum)}
                          </span>
                          {mismatch && (
                            <Badge tone="warning" className="ml-2 !text-2xs">
                              <AlertTriangle className="h-3 w-3" /> 相違
                            </Badge>
                          )}
                        </Td>
                        <Td className="num-tabular text-right text-ink">{formatPrice(s.total_expenses)}</Td>
                        <Td className="num-tabular text-right text-ink">{formatPrice(s.labor_costs)}</Td>
                        <Td className="text-ink-soft max-w-[240px] truncate" title={s.notes || undefined}>{s.notes || '—'}</Td>
                        <Td className="text-right whitespace-nowrap">
                          <InlineAction onClick={() => openEdit(s)} icon={<Pencil className="h-3.5 w-3.5" />}>編集</InlineAction>
                          {deleteConfirmId === s.id ? (
                            <>
                              <InlineAction tone="danger" onClick={() => handleDelete(s.id)} icon={<Check className="h-3.5 w-3.5" />}>削除する</InlineAction>
                              <InlineAction onClick={() => setDeleteConfirmId(null)} icon={<X className="h-3.5 w-3.5" />}>キャンセル</InlineAction>
                            </>
                          ) : (
                            <InlineAction tone="danger-soft" onClick={() => setDeleteConfirmId(s.id)} icon={<Trash2 className="h-3.5 w-3.5" />}>削除</InlineAction>
                          )}
                        </Td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editId ? '経費を編集' : '経費を登録'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="店舗" value={storeId} onChange={(e) => setStoreId(e.target.value)} required>
            <option value="">選択してください</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <Input label="対象日" type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required />
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1.5">キャスト集計（来店記録の利用額合計）</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-ink num-tabular">
              {formatPrice(computedTotalSales)} 円
            </div>
          </div>
          <Input
            label="売上合計（店舗入力・円）"
            type="number"
            step="1"
            min="0"
            value={storeEnteredSales}
            onChange={(e) => setStoreEnteredSales(e.target.value)}
            placeholder={String(Math.round(computedTotalSales))}
            hint="未入力の場合はキャスト集計で保存されます"
          />
          <Input label="経費合計（円）" type="number" step="1" min="0" value={totalExpenses} onChange={(e) => setTotalExpenses(e.target.value)} placeholder="0" required />
          <Input label="人件費（円）" type="number" step="1" min="0" value={laborCosts} onChange={(e) => setLaborCosts(e.target.value)} placeholder="0" required />
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1.5">備考</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="メモ（任意）"
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>送信</Button>
            <Button type="button" variant="outline" onClick={closeModal}>キャンセル</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap ${className || ''}`}>
      {children}
    </th>
  );
}
function Td({ children, className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }) {
  return <td className={`px-4 py-3 ${className || ''}`} {...rest}>{children}</td>;
}

type InlineTone = 'default' | 'danger' | 'danger-soft';
const inlineTone: Record<InlineTone, string> = {
  default: 'text-ink-muted hover:text-ink hover:bg-slate-100',
  danger: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50',
  'danger-soft': 'text-ink-soft hover:text-rose-600 hover:bg-rose-50',
};
function InlineAction({
  children,
  onClick,
  icon,
  tone = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  tone?: InlineTone;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${inlineTone[tone]}`}
    >
      {icon}
      {children}
    </button>
  );
}
