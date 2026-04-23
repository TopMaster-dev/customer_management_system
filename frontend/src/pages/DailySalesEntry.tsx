import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Wallet, Filter, X } from 'lucide-react';
import type { Store, Customer } from '../types/customer';
import type { VisitRecord } from '../types/visitRecord';
import { formatPrice } from '../utils/formatPrice';
import { API } from '../config';
import { Badge, Card, PageContainer, PageHeader } from '../components/ui';

function aggregateSalesByStoreAndDate(
  visitRecords: VisitRecord[],
  customers: Customer[],
): { store: string; report_date: string; total_sales: number }[] {
  const customerToStore = new Map<string, string>();
  customers.forEach((c) => customerToStore.set(c.id, c.store));
  const map = new Map<string, number>();
  visitRecords.forEach((r) => {
    const storeId = customerToStore.get(r.customer);
    if (storeId == null) return;
    const key = `${storeId}\t${r.visit_date}`;
    map.set(key, (map.get(key) ?? 0) + Number(r.spending || 0));
  });
  return Array.from(map.entries()).map(([key, total_sales]) => {
    const [store, report_date] = key.split('\t');
    return { store, report_date, total_sales };
  });
}

export default function DailySalesEntry() {
  const [stores, setStores] = useState<Store[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStore, setFilterStore] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
      axios.get<Customer[]>(`${API}/customers/`).then((r) => r.data).catch(() => []),
      axios.get<VisitRecord[]>(`${API}/visit-records/`).then((r) => r.data).catch(() => []),
    ]).then(([s, custs, recs]) => {
      setStores(s);
      setCustomers(custs);
      setVisitRecords(recs);
    });
    setLoading(false);
  }, []);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  const aggregated = useMemo(
    () => aggregateSalesByStoreAndDate(visitRecords, customers),
    [visitRecords, customers],
  );

  const filtered = useMemo(() => {
    let list = [...aggregated];
    if (filterStore) list = list.filter((r) => r.store === filterStore);
    if (filterDateFrom) list = list.filter((r) => r.report_date >= filterDateFrom);
    if (filterDateTo) list = list.filter((r) => r.report_date <= filterDateTo);
    return list.sort((a, b) => b.report_date.localeCompare(a.report_date) || a.store.localeCompare(b.store));
  }, [aggregated, filterStore, filterDateFrom, filterDateTo]);

  const hasActiveFilters = Boolean(filterStore || filterDateFrom || filterDateTo);
  const totalSum = filtered.reduce((s, r) => s + r.total_sales, 0);

  const clearFilters = () => {
    setFilterStore('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  return (
    <PageContainer className="max-w-4xl">
      <PageHeader
        title="日次売上"
        description="来店記録の利用額を店舗・日付別に集計して表示します。"
        icon={<Wallet className="h-5 w-5" strokeWidth={2} />}
      />

      <Card className="mb-4 !p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted">
            <Filter className="h-4 w-4" strokeWidth={1.75} />
            絞り込み
          </span>
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="">すべての店舗</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            title="対象日（から）"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
          <span className="text-xs text-ink-faint">～</span>
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            title="対象日（まで）"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-soft hover:bg-slate-100 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
              クリア
            </button>
          )}
          <span className="ml-auto text-xs text-ink-soft num-tabular">
            {filtered.length}件
            {(filterStore || filterDateFrom || filterDateTo) && aggregated.length !== filtered.length && <span className="text-ink-faint"> / 全{aggregated.length}件</span>}
          </span>
        </div>
      </Card>

      {!loading && filtered.length > 0 && (
        <Card className="mb-4 !p-4 bg-gradient-to-br from-brand-50 to-indigo-50/50 border-brand-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink">合計売上</span>
            <span className="text-2xl font-semibold text-ink num-tabular">{formatPrice(totalSum)} 円</span>
          </div>
        </Card>
      )}

      <Card padded={false} className="overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-ink-soft">読み込み中…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <Th>店舗</Th>
                  <Th>対象日</Th>
                  <Th className="text-right">売上（円）</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-sm text-ink-soft">
                      {hasActiveFilters ? '条件に一致するデータがありません' : '来店記録がありません'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr key={`${row.store}-${row.report_date}-${i}`} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/30 transition-colors">
                      <Td><Badge tone="neutral">{storeName(row.store)}</Badge></Td>
                      <Td className="num-tabular text-ink-muted">{row.report_date}</Td>
                      <Td className="num-tabular text-right font-medium text-ink">{formatPrice(row.total_sales)}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
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
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className || ''}`}>{children}</td>;
}
