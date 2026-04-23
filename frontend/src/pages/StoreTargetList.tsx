import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Trophy, Save, AlertCircle, AlertTriangle, Plus } from 'lucide-react';
import { API } from '../config';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import { formatPrice } from '../utils/formatPrice';
import type { Store, Customer } from '../types/customer';
import type { VisitRecord } from '../types/visitRecord';
import type { StoreTarget, StoreTargetFormData, StoreTargetType } from '../types/storeTarget';
import { STORE_TARGET_TYPES } from '../types/storeTarget';
import {
  Button,
  Card,
  Input,
  PageContainer,
  PageHeader,
} from '../components/ui';

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function monthISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

function startOfMonth(iso: string) {
  if (!iso) return monthISO();
  const [y, m] = iso.split('-');
  if (!y || !m) return monthISO();
  return `${y}-${m}-01`;
}

function sameMonth(a: string, b: string) {
  return a.slice(0, 7) === b.slice(0, 7);
}

type Actuals = {
  sales: number;
  groups: number;
  newSales: number;
  newGroups: number;
};

export default function StoreTargetList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [targets, setTargets] = useState<StoreTarget[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visitRecords, setVisitRecords] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [storeId, setStoreId] = useState('');
  const [targetType, setTargetType] = useState<StoreTargetType>('Monthly');
  const [targetDate, setTargetDate] = useState(startOfMonth(todayISO()));

  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<StoreTargetFormData>({
    store: '',
    target_type: 'Monthly',
    target_date: startOfMonth(todayISO()),
    sales_target: '0',
    group_target: '0',
    new_sales_target: '0',
    new_group_target: '0',
  });

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
      axios.get<StoreTarget[]>(`${API}/store-targets/`).then((r) => r.data).catch(() => []),
      axios.get<Customer[]>(`${API}/customers/`).then((r) => r.data).catch(() => []),
      axios.get<VisitRecord[]>(`${API}/visit-records/`).then((r) => r.data).catch(() => []),
    ])
      .then(([s, t, c, v]) => {
        setStores(s);
        setTargets(t);
        setCustomers(c);
        setVisitRecords(v);
        if (s.length > 0) {
          setStoreId(s[0].id);
          setForm((f) => ({ ...f, store: s[0].id }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const customerToStore = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => map.set(c.id, c.store));
    return map;
  }, [customers]);

  const customerFirstVisit = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach((c) => map.set(c.id, c.first_visit));
    return map;
  }, [customers]);

  const computeActuals = useMemo(() => {
    const byKey = new Map<string, Actuals>();
    visitRecords.forEach((r) => {
      const sId = customerToStore.get(r.customer);
      if (!sId) return;
      const monthKey = `${sId}\tMonthly\t${startOfMonth(r.visit_date)}`;
      const dayKey = `${sId}\tDaily\t${r.visit_date}`;
      const amount = Number(r.spending || 0);
      const firstVisit = customerFirstVisit.get(r.customer) ?? '';
      const isNewForMonth = Boolean(firstVisit) && sameMonth(firstVisit, r.visit_date);
      const isNewForDay = Boolean(firstVisit) && firstVisit === r.visit_date;

      const add = (key: string, isNew: boolean) => {
        const cur = byKey.get(key) ?? { sales: 0, groups: 0, newSales: 0, newGroups: 0 };
        cur.sales += amount;
        cur.groups += 1;
        if (isNew) {
          cur.newSales += amount;
          cur.newGroups += 1;
        }
        byKey.set(key, cur);
      };

      add(monthKey, isNewForMonth);
      add(dayKey, isNewForDay);
    });
    return byKey;
  }, [visitRecords, customerToStore, customerFirstVisit]);

  const key = `${storeId}\t${targetType}\t${targetType === 'Monthly' ? startOfMonth(targetDate) : targetDate}`;
  const actuals = computeActuals.get(key) ?? { sales: 0, groups: 0, newSales: 0, newGroups: 0 };

  const existing = useMemo(() => {
    const normalizedDate = targetType === 'Monthly' ? startOfMonth(targetDate) : targetDate;
    return targets.find((t) => t.store === storeId && t.target_type === targetType && t.target_date === normalizedDate) ?? null;
  }, [targets, storeId, targetType, targetDate]);

  const openCreateOrEdit = () => {
    const normalizedDate = targetType === 'Monthly' ? startOfMonth(targetDate) : targetDate;
    const base: StoreTargetFormData = {
      store: storeId,
      target_type: targetType,
      target_date: normalizedDate,
      sales_target: '0',
      group_target: '0',
      new_sales_target: '0',
      new_group_target: '0',
    };
    if (existing) {
      setEditId(existing.id);
      setForm({
        store: existing.store,
        target_type: existing.target_type,
        target_date: existing.target_date,
        sales_target: String(Math.round(Number(existing.sales_target || 0))),
        group_target: String(Math.round(Number(existing.group_target || 0))),
        new_sales_target: String(Math.round(Number(existing.new_sales_target || 0))),
        new_group_target: String(Math.round(Number(existing.new_group_target || 0))),
      });
    } else {
      setEditId(null);
      setForm(base);
    }
    setError(null);
  };

  const refreshTargets = () => {
    axios.get<StoreTarget[]>(`${API}/store-targets/`).then((r) => setTargets(r.data)).catch(() => setTargets([]));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        store: form.store,
        target_type: form.target_type,
        target_date: form.target_type === 'Monthly' ? startOfMonth(form.target_date) : form.target_date,
        sales_target: String(Math.round(Number(form.sales_target || 0))),
        group_target: String(Math.round(Number(form.group_target || 0))),
        new_sales_target: String(Math.round(Number(form.new_sales_target || 0))),
        new_group_target: String(Math.round(Number(form.new_group_target || 0))),
      };
      if (editId) {
        await axios.patch(`${API}/store-targets/${editId}/`, payload);
      } else {
        await axios.post(`${API}/store-targets/`, payload);
      }
      refreshTargets();
    } catch {
      setError(editId ? ERROR_MESSAGES.update : ERROR_MESSAGES.create);
    }
    setSaving(false);
  };

  const mismatch = (target: number, actual: number) => target !== actual;

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="店舗目標"
        description="店舗ごとの目標（売上・組数・新規）を登録します。新規=お客様の初回来店日が対象期間内。"
        icon={<Trophy className="h-5 w-5" strokeWidth={2} />}
      />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <Card><p className="text-sm text-ink-soft text-center">読み込み中…</p></Card>
      ) : (
        <div className="space-y-5">
          <Card padded={false} className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/40">
              <span className="text-sm font-semibold text-ink">対象</span>
              <select
                value={storeId}
                onChange={(e) => { setStoreId(e.target.value); setForm((f) => ({ ...f, store: e.target.value })); }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              >
                {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as StoreTargetType)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              >
                {STORE_TARGET_TYPES.map((t) => <option key={t} value={t}>{t === 'Daily' ? '日次' : '月次'}</option>)}
              </select>
              <input
                type={targetType === 'Daily' ? 'date' : 'month'}
                value={targetType === 'Daily' ? targetDate : targetDate.slice(0, 7)}
                onChange={(e) => setTargetDate(targetType === 'Daily' ? e.target.value : `${e.target.value}-01`)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
              <Button size="sm" className="ml-auto" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={openCreateOrEdit}>
                {existing ? '目標を編集' : '目標を登録'}
              </Button>
            </div>

            <div className="p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-3">実績（キャスト入力の来店記録集計）</h2>
              <div className="grid gap-3 sm:grid-cols-4">
                <ActualTile label="売上"     value={`${formatPrice(actuals.sales)} 円`} />
                <ActualTile label="組数"     value={formatPrice(actuals.groups)} />
                <ActualTile label="新規売上" value={`${formatPrice(actuals.newSales)} 円`} />
                <ActualTile label="新規組数" value={formatPrice(actuals.newGroups)} />
              </div>
            </div>
          </Card>

          <Card padded={false} className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-gradient-to-br from-brand-50 to-indigo-50/40">
              <h2 className="text-sm font-semibold text-ink">{existing ? '目標を編集' : '目標を登録'}</h2>
              <p className="mt-0.5 text-xs text-ink-soft">
                店舗「<span className="text-ink font-medium">{storeName(storeId)}</span>」 / {targetType === 'Daily' ? targetDate : targetDate.slice(0, 7)}
              </p>
            </div>
            <div className="p-5">
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <TargetField
                  label="売上目標（円）"
                  value={form.sales_target}
                  onChange={(v) => setForm((f) => ({ ...f, sales_target: v }))}
                  mismatch={mismatch(Number(form.sales_target || 0), actuals.sales)}
                  actualText={`実績 ${formatPrice(actuals.sales)}`}
                />
                <TargetField
                  label="組数目標"
                  value={form.group_target}
                  onChange={(v) => setForm((f) => ({ ...f, group_target: v }))}
                  mismatch={mismatch(Number(form.group_target || 0), actuals.groups)}
                  actualText={`実績 ${formatPrice(actuals.groups)}`}
                />
                <TargetField
                  label="新規売上目標（円）"
                  value={form.new_sales_target}
                  onChange={(v) => setForm((f) => ({ ...f, new_sales_target: v }))}
                  mismatch={mismatch(Number(form.new_sales_target || 0), actuals.newSales)}
                  actualText={`実績 ${formatPrice(actuals.newSales)}`}
                />
                <TargetField
                  label="新規組数目標"
                  value={form.new_group_target}
                  onChange={(v) => setForm((f) => ({ ...f, new_group_target: v }))}
                  mismatch={mismatch(Number(form.new_group_target || 0), actuals.newGroups)}
                  actualText={`実績 ${formatPrice(actuals.newGroups)}`}
                />
                <div className="sm:col-span-2 pt-1">
                  <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>
                    {existing ? '保存' : '登録'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

function ActualTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p className="mt-1.5 text-lg font-semibold text-ink num-tabular">{value}</p>
    </div>
  );
}

function TargetField({
  label,
  value,
  onChange,
  mismatch,
  actualText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mismatch: boolean;
  actualText: string;
}) {
  return (
    <div>
      <Input label={label} type="number" step="1" min="0" value={value} onChange={(e) => onChange(e.target.value)} />
      {mismatch && (
        <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-amber-700">
          <AlertTriangle className="h-3 w-3" />
          {actualText} と相違
        </p>
      )}
    </div>
  );
}
