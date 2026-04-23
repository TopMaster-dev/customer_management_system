import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { FileText, Plus, Filter, Pencil, Trash2, Check, X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API } from '../config';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import type { Store } from '../types/customer';
import type { DailyReport } from '../types/dailyReport';
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

function canWriteDailyReport(role: string | undefined) {
  return role === 'Staff' || role === 'Manager' || role === 'Admin' || role === 'Owner';
}

export default function DailyReportList() {
  const { user } = useAuth();
  const canWrite = canWriteDailyReport(user?.role);

  const [stores, setStores] = useState<Store[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStore, setFilterStore] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState('');
  const [reportDate, setReportDate] = useState(todayISO());
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchReports = () => {
    axios.get<DailyReport[]>(`${API}/daily-reports/`).then((r) => setReports(r.data)).catch(() => setReports([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
      axios.get<DailyReport[]>(`${API}/daily-reports/`).then((r) => r.data).catch(() => []),
    ])
      .then(([s, r]) => {
        setStores(s);
        setReports(r);
        if (s.length > 0) {
          setStoreId(s[0].id);
          setFilterStore('');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const storeName = (id: string) => stores.find((x) => x.id === id)?.name ?? id.slice(0, 8);

  const filtered = useMemo(() => {
    let list = [...reports];
    if (filterStore) list = list.filter((x) => x.store === filterStore);
    if (filterFrom) list = list.filter((x) => x.report_date >= filterFrom);
    if (filterTo) list = list.filter((x) => x.report_date <= filterTo);
    return list.sort((a, b) => b.report_date.localeCompare(a.report_date) || a.store.localeCompare(b.store));
  }, [reports, filterStore, filterFrom, filterTo]);

  const openCreate = () => {
    setEditId(null);
    setReportDate(todayISO());
    setContent('');
    if (stores[0]) setStoreId(stores[0].id);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (r: DailyReport) => {
    setEditId(r.id);
    setStoreId(r.store);
    setReportDate(r.report_date);
    setContent(r.content ?? '');
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !reportDate) return;
    setSaving(true);
    setError(null);
    try {
      const payload = { store: storeId, report_date: reportDate, content: content.trim() };
      if (editId) {
        await axios.patch(`${API}/daily-reports/${editId}/`, payload);
      } else {
        await axios.post(`${API}/daily-reports/`, payload);
      }
      fetchReports();
      closeModal();
    } catch {
      setError(editId ? ERROR_MESSAGES.update : ERROR_MESSAGES.create);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API}/daily-reports/${id}/`);
      fetchReports();
      setDeleteId(null);
    } catch {
      setError(ERROR_MESSAGES.delete);
    }
  };

  function formatDate(iso: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <PageContainer>
      <PageHeader
        title="日報"
        description="店舗ごと・1日1件の日報です。作成・編集はスタッフ・マネージャー以上のみです。"
        icon={<FileText className="h-5 w-5" strokeWidth={2} />}
        actions={canWrite && <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>日報を作成</Button>}
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
          <select value={filterStore} onChange={(e) => setFilterStore(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200">
            <option value="">すべての店舗</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} title="から" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
          <span className="text-xs text-ink-faint">～</span>
          <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} title="まで" className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
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
                  <Th>店舗</Th>
                  <Th>日付</Th>
                  <Th>内容</Th>
                  <Th>更新</Th>
                  {canWrite && <Th className="text-right">操作</Th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={canWrite ? 5 : 4} className="px-4 py-12 text-center text-sm text-ink-soft">
                      日報がありません
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/30 transition-colors">
                      <Td><Badge tone="neutral">{storeName(r.store)}</Badge></Td>
                      <Td className="num-tabular text-ink-muted">{r.report_date}</Td>
                      <Td className="text-ink-muted max-w-md truncate" title={r.content || undefined}>
                        {r.content?.trim() ? r.content.slice(0, 120) + (r.content.length > 120 ? '…' : '') : '—'}
                      </Td>
                      <Td className="text-xs text-ink-soft num-tabular">{formatDate(r.updated_at)}</Td>
                      {canWrite && (
                        <Td className="text-right whitespace-nowrap">
                          <InlineAction onClick={() => openEdit(r)} icon={<Pencil className="h-3.5 w-3.5" />}>編集</InlineAction>
                          {deleteId === r.id ? (
                            <>
                              <InlineAction tone="danger" onClick={() => handleDelete(r.id)} icon={<Check className="h-3.5 w-3.5" />}>削除する</InlineAction>
                              <InlineAction onClick={() => setDeleteId(null)} icon={<X className="h-3.5 w-3.5" />}>キャンセル</InlineAction>
                            </>
                          ) : (
                            <InlineAction tone="danger-soft" onClick={() => setDeleteId(r.id)} icon={<Trash2 className="h-3.5 w-3.5" />}>削除</InlineAction>
                          )}
                        </Td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modalOpen && canWrite} onClose={closeModal} title={editId ? '日報を編集' : '日報を作成'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="店舗" value={storeId} onChange={(e) => setStoreId(e.target.value)} required disabled={!!editId}>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          {editId && <p className="-mt-2 text-xs text-ink-faint">店舗・日付は編集できません（別日は新規作成してください）</p>}
          <Input label="日付" type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required disabled={!!editId} />
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1.5">本文</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="本日の内容を入力"
              className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div className="flex gap-2 pt-2">
            <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>保存</Button>
            <Button type="button" variant="outline" onClick={closeModal}>キャンセル</Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap ${className || ''}`}>{children}</th>;
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
