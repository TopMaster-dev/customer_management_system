import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Store as StoreIcon, Plus, Eye, Pencil, Trash2, Check, X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import type { Store, StoreFormData } from '../types/customer';
import { STORE_TYPES } from '../types/customer';
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

export default function StoreList() {
  const { user: currentUser } = useAuth();
  const isAdminOrOwner = currentUser?.role === 'Admin' || currentUser?.role === 'Owner';
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StoreFormData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<StoreFormData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = () => {
    axios.get<Store[]>(`${API}/stores/`).then((res) => setStores(res.data)).catch(() => setStores([]));
  };

  useEffect(() => {
    setLoading(true);
    fetchStores();
    setLoading(false);
  }, []);

  const openEdit = (s: Store) => {
    setEditId(s.id);
    setEditForm({
      name: s.name,
      store_type: s.store_type,
      address: s.address,
      is_active: s.is_active,
    });
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.post(`${API}/stores/`, createForm);
      fetchStores();
      setCreateOpen(false);
      setCreateForm(null);
    } catch {
      setError(ERROR_MESSAGES.create);
    }
    setSaving(false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.patch(`${API}/stores/${editId}/`, editForm);
      fetchStores();
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
      await axios.delete(`${API}/stores/${id}/`);
      fetchStores();
      setDeleteConfirmId(null);
      if (viewId === id) setViewId(null);
    } catch {
      setError(ERROR_MESSAGES.delete);
    }
  };

  const emptyCreateForm = (): StoreFormData => ({
    name: '',
    store_type: STORE_TYPES[0],
    address: '',
    is_active: true,
  });

  const viewStore = viewId ? stores.find((x) => x.id === viewId) : null;

  return (
    <PageContainer>
      <PageHeader
        title="店舗管理"
        description="店舗の登録・閲覧・編集・削除ができます。"
        icon={<StoreIcon className="h-5 w-5" strokeWidth={2} />}
        actions={
          isAdminOrOwner && (
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => { setCreateOpen(true); setError(null); setCreateForm(emptyCreateForm()); }}
            >
              新規登録
            </Button>
          )
        }
      />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card padded={false} className="overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-ink-soft">読み込み中…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <Th>店舗名</Th>
                  <Th>種別</Th>
                  <Th>住所</Th>
                  <Th>有効</Th>
                  <Th className="text-right">操作</Th>
                </tr>
              </thead>
              <tbody>
                {stores.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-soft">登録がありません</td></tr>
                ) : (
                  stores.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/30 transition-colors">
                      <Td className="font-medium text-ink">{s.name}</Td>
                      <Td><Badge tone="neutral">{s.store_type}</Badge></Td>
                      <Td className="text-ink-muted max-w-[240px] truncate" title={s.address}>{s.address || '—'}</Td>
                      <Td>
                        {s.is_active ? <Badge tone="success" dot>有効</Badge> : <Badge tone="neutral">無効</Badge>}
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <InlineAction onClick={() => setViewId(s.id)} icon={<Eye className="h-3.5 w-3.5" />}>表示</InlineAction>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!viewStore} onClose={() => setViewId(null)} title="店舗情報" size="sm">
        {viewStore && (
          <>
            <dl className="space-y-3 text-sm">
              <Row label="店舗名" value={<span className="font-medium text-ink">{viewStore.name}</span>} />
              <Row label="種別" value={<Badge tone="neutral">{viewStore.store_type}</Badge>} />
              <Row label="住所" value={<span className="whitespace-pre-wrap">{viewStore.address || '—'}</span>} />
              <Row label="有効" value={viewStore.is_active ? <Badge tone="success" dot>有効</Badge> : <Badge tone="neutral">無効</Badge>} />
            </dl>
            <div className="mt-5 flex gap-2">
              <Button size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { setViewId(null); openEdit(viewStore); }}>編集</Button>
              <Button size="sm" variant="outline" onClick={() => setViewId(null)}>閉じる</Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={createOpen && !!createForm}
        onClose={() => { setCreateOpen(false); setCreateForm(null); }}
        title="店舗を登録"
        size="sm"
      >
        {createForm && (
          <StoreForm
            form={createForm}
            setForm={setCreateForm}
            onSubmit={handleCreate}
            saving={saving}
            submitLabel="登録"
            onCancel={() => { setCreateOpen(false); setCreateForm(null); }}
          />
        )}
      </Modal>

      <Modal
        open={!!editId && !!editForm}
        onClose={() => { setEditId(null); setEditForm(null); }}
        title="店舗を編集"
        size="sm"
      >
        {editForm && (
          <StoreForm
            form={editForm}
            setForm={setEditForm}
            onSubmit={handleSaveEdit}
            saving={saving}
            submitLabel="保存"
            onCancel={() => { setEditId(null); setEditForm(null); }}
          />
        )}
      </Modal>
    </PageContainer>
  );
}

interface StoreFormProps {
  form: StoreFormData;
  setForm: React.Dispatch<React.SetStateAction<StoreFormData | null>>;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
}

function StoreForm({ form, setForm, onSubmit, saving, submitLabel, onCancel }: StoreFormProps) {
  const update = (patch: Partial<StoreFormData>) => setForm((f) => (f ? { ...f, ...patch } : null));
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="店舗名" type="text" value={form.name} onChange={(e) => update({ name: e.target.value })} required />
      <Select label="種別" value={form.store_type} onChange={(e) => update({ store_type: e.target.value })} required>
        {STORE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </Select>
      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1.5">住所</label>
        <textarea
          value={form.address}
          onChange={(e) => update({ address: e.target.value })}
          rows={3}
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => update({ is_active: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        有効
      </label>
      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>キャンセル</Button>
      </div>
    </form>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap ${className || ''}`}>{children}</th>;
}
function Td({ children, className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode }) {
  return <td className={`px-4 py-3 ${className || ''}`} {...rest}>{children}</td>;
}
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft shrink-0">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
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
