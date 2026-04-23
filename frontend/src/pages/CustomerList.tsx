import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Plus,
  Filter,
  X,
  Eye,
  Pencil,
  FileText,
  Trash2,
  Check,
  Save,
  AlertCircle,
  Search,
} from 'lucide-react';
import CustomerDetailViewModal from '../components/CustomerDetailViewModal';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import { formatPrice } from '../utils/formatPrice';
import type { Customer, Store, CustomerFormData } from '../types/customer';
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

export default function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterFirstVisitFrom, setFilterFirstVisitFrom] = useState('');
  const [filterFirstVisitTo, setFilterFirstVisitTo] = useState('');
  const [detailModalId, setDetailModalId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CustomerFormData | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = () => {
    axios.get<Customer[]>(`${API}/customers/`).then((res) => setCustomers(res.data)).catch(() => setCustomers([]));
  };

  useEffect(() => {
    setLoading(true);
    axios.get<Store[]>(`${API}/stores/`).then((res) => setStores(res.data)).catch(() => setStores([]));
    fetchCustomers();
    setLoading(false);
  }, []);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchName = !filterName.trim() || c.name.toLowerCase().includes(filterName.trim().toLowerCase());
      const matchStore = !filterStore || c.store === filterStore;
      const matchFirstVisitFrom = !filterFirstVisitFrom || (c.first_visit && c.first_visit >= filterFirstVisitFrom);
      const matchFirstVisitTo = !filterFirstVisitTo || (c.first_visit && c.first_visit <= filterFirstVisitTo);
      return matchName && matchStore && matchFirstVisitFrom && matchFirstVisitTo;
    });
  }, [customers, filterName, filterStore, filterFirstVisitFrom, filterFirstVisitTo]);

  const clearFilters = () => {
    setFilterName('');
    setFilterStore('');
    setFilterFirstVisitFrom('');
    setFilterFirstVisitTo('');
  };

  const hasActiveFilters = Boolean(filterName.trim() || filterStore || filterFirstVisitFrom || filterFirstVisitTo);

  const openEdit = (c: Customer) => {
    setEditId(c.id);
    const n = Number(c.total_spend);
    const spend = Number.isNaN(n) ? '0' : String(Math.round(n));
    setEditForm({
      store: c.store,
      name: c.name,
      first_visit: c.first_visit,
      contact_info: (c.contact_info as Record<string, string>) || {},
      preferences: (c.preferences as Record<string, string>) || {},
      total_spend: spend,
    });
    setError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.patch(`${API}/customers/${editId}/`, {
        store: editForm.store,
        name: editForm.name,
        first_visit: editForm.first_visit,
        contact_info: editForm.contact_info,
        preferences: editForm.preferences,
        total_spend: Math.round(Number(editForm.total_spend)) || 0,
      });
      fetchCustomers();
      setEditId(null);
      setEditForm(null);
    } catch {
      setError(ERROR_MESSAGES.update);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`${API}/customers/${id}/`);
      fetchCustomers();
      setDeleteConfirmId(null);
      if (viewId === id) setViewId(null);
    } catch {
      setError(ERROR_MESSAGES.delete);
    }
  };

  const viewCustomer = viewId ? customers.find((x) => x.id === viewId) : null;
  const viewCi = (viewCustomer?.contact_info as Record<string, string>) || {};
  const viewPr = (viewCustomer?.preferences as Record<string, string>) || {};

  return (
    <PageContainer>
      <PageHeader
        title="お客様一覧"
        description="お客様の閲覧・編集・削除、および詳細情報の確認ができます。"
        icon={<Users className="h-5 w-5" strokeWidth={2} />}
        actions={
          <Link
            to="/customers/register"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-medium h-10 px-4 hover:bg-brand-700 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" strokeWidth={2} />
            新規登録
          </Link>
        }
      />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="mb-4 !p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted">
            <Filter className="h-4 w-4" strokeWidth={1.75} />
            絞り込み
          </span>
          <div className="relative flex-1 min-w-[160px] max-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="名前で検索"
              className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-ink-faint focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            <option value="">すべての店舗</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <span className="hidden sm:inline text-xs text-ink-soft">初回来店</span>
          <input
            type="date"
            value={filterFirstVisitFrom}
            onChange={(e) => setFilterFirstVisitFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            title="初回来店（から）"
          />
          <span className="text-xs text-ink-faint">～</span>
          <input
            type="date"
            value={filterFirstVisitTo}
            onChange={(e) => setFilterFirstVisitTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            title="初回来店（まで）"
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              aria-label="絞り込みをクリア"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-soft hover:bg-slate-100 hover:text-ink transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              クリア
            </button>
          )}
          <span className="ml-auto text-xs text-ink-soft num-tabular">
            {filteredCustomers.length}件
            {customers.length !== filteredCustomers.length && <span className="text-ink-faint"> / 全{customers.length}件</span>}
          </span>
        </div>
      </Card>

      <Card padded={false} className="overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-ink-soft">読み込み中…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap">名前</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap">店舗</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap">初回来店</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap text-right">累計利用額</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-soft">
                      {hasActiveFilters ? '条件に一致する登録がありません' : '登録がありません'}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">{c.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge tone="neutral">{storeName(c.store)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ink-muted whitespace-nowrap num-tabular">{c.first_visit}</td>
                      <td className="px-4 py-3 text-ink whitespace-nowrap num-tabular text-right">{formatPrice(c.total_spend)} 円</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex flex-wrap justify-end gap-1 items-center">
                          <IconButton label="表示" onClick={() => setViewId(c.id)} icon={<Eye className="h-3.5 w-3.5" />} />
                          <IconButton label="編集" onClick={() => openEdit(c)} icon={<Pencil className="h-3.5 w-3.5" />} />
                          <IconButton label="詳細" tone="brand" onClick={() => setDetailModalId(c.id)} icon={<FileText className="h-3.5 w-3.5" />} />
                          {deleteConfirmId === c.id ? (
                            <>
                              <IconButton label="削除する" tone="danger" onClick={() => handleDelete(c.id)} icon={<Check className="h-3.5 w-3.5" />} />
                              <IconButton label="キャンセル" onClick={() => setDeleteConfirmId(null)} icon={<X className="h-3.5 w-3.5" />} />
                            </>
                          ) : (
                            <IconButton label="削除" tone="danger-soft" onClick={() => setDeleteConfirmId(c.id)} icon={<Trash2 className="h-3.5 w-3.5" />} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!viewCustomer} onClose={() => setViewId(null)} title="お客様情報" size="sm">
        {viewCustomer && (
          <>
            <dl className="space-y-3 text-sm">
              <Row label="名前" value={<span className="font-medium text-ink">{viewCustomer.name}</span>} />
              <Row label="店舗" value={storeName(viewCustomer.store)} />
              <Row label="初回来店" value={viewCustomer.first_visit} />
              <Row label="累計利用額" value={<span className="num-tabular">{formatPrice(viewCustomer.total_spend)} 円</span>} />
              {(viewCi.line_id || viewCi.instagram || viewCi.phone) && (
                <Row label="連絡先" value={`LINE: ${viewCi.line_id || '—'} / IG: ${viewCi.instagram || '—'} / TEL: ${viewCi.phone || '—'}`} />
              )}
              {(viewPr.cigarette_brand || viewPr.visit_days) && (
                <Row label="嗜好" value={`タバコ: ${viewPr.cigarette_brand || '—'} / 来店希望: ${viewPr.visit_days || '—'}`} />
              )}
            </dl>
            <div className="mt-5 flex gap-2">
              <Button size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { setViewId(null); openEdit(viewCustomer); }}>
                編集
              </Button>
              <Button size="sm" variant="outline" onClick={() => setViewId(null)}>閉じる</Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={!!editId && !!editForm}
        onClose={() => { setEditId(null); setEditForm(null); }}
        title="お客様を編集"
        size="sm"
      >
        {editForm && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Select
              label="店舗"
              value={editForm.store}
              onChange={(e) => setEditForm((f) => (f ? { ...f, store: e.target.value } : null))}
              required
            >
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
            <Input
              label="名前"
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => (f ? { ...f, name: e.target.value } : null))}
              required
            />
            <Input
              label="初回来店日"
              type="date"
              value={editForm.first_visit}
              onChange={(e) => setEditForm((f) => (f ? { ...f, first_visit: e.target.value } : null))}
              required
            />
            <Input
              label="累計利用額（円）"
              type="number"
              step="1"
              min="0"
              value={editForm.total_spend}
              onChange={(e) => setEditForm((f) => (f ? { ...f, total_spend: e.target.value } : null))}
            />
            <div className="flex gap-2 pt-1">
              <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>保存</Button>
              <Button type="button" variant="outline" onClick={() => { setEditId(null); setEditForm(null); }}>
                キャンセル
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {detailModalId && (
        <CustomerDetailViewModal
          customerId={detailModalId}
          onClose={() => setDetailModalId(null)}
          onSaved={() => fetchCustomers()}
          onDeleted={() => setDetailModalId(null)}
        />
      )}
    </PageContainer>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft shrink-0">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

type IconTone = 'default' | 'brand' | 'danger' | 'danger-soft';
const toneClasses: Record<IconTone, string> = {
  default:     'text-ink-muted hover:text-ink hover:bg-slate-100',
  brand:       'text-brand-600 hover:text-brand-700 hover:bg-brand-50',
  danger:      'text-rose-600 hover:text-rose-700 hover:bg-rose-50',
  'danger-soft': 'text-ink-soft hover:text-rose-600 hover:bg-rose-50',
};

function IconButton({
  label,
  onClick,
  icon,
  tone = 'default',
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  tone?: IconTone;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${toneClasses[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}
