import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  UsersRound,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Check,
  X,
  Save,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import { formatPrice } from '../utils/formatPrice';
import type { StaffMember, StaffMemberFormData } from '../types/staffMember';
import type { Store } from '../types/customer';
import type { User } from '../types/user';
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

function formatDateTime(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' });
}

function toFormData(m: StaffMember): StaffMemberFormData {
  const n = Number(m.hourly_wage);
  const wage = Number.isNaN(n) ? '0' : String(Math.round(n));
  return {
    user: m.user,
    store: m.store,
    hourly_wage: wage,
    commission_rate: String(m.commission_rate),
    is_on_duty: m.is_on_duty,
    check_in: m.check_in.slice(0, 16),
    check_out: m.check_out.slice(0, 16),
  };
}

function nowLocalISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = (): StaffMemberFormData => ({
  user: '',
  store: '',
  hourly_wage: '0',
  commission_rate: '0',
  is_on_duty: false,
  check_in: nowLocalISO(),
  check_out: nowLocalISO(),
});

export default function StaffMemberList() {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState<StaffMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  const allowedStores = useMemo(() => {
    if (currentUser?.role === 'Admin' || currentUser?.role === 'Owner') return stores;
    if (currentUser?.role === 'Supervisor') return stores;
    if (!currentUser?.store_id) return stores;
    return stores.filter((s) => s.id === currentUser.store_id);
  }, [stores, currentUser?.store_id, currentUser?.role]);

  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<StaffMemberFormData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<StaffMemberFormData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = () => {
    axios.get<StaffMember[]>(`${API}/staff-members/`).then((r) => setMembers(r.data)).catch(() => setMembers([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<StaffMember[]>(`${API}/staff-members/`).then((r) => r.data).catch(() => []),
      axios.get<User[]>(`${API}/users/`).then((r) => r.data).catch(() => []),
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
    ]).then(([m, u, s]) => {
      setMembers(m);
      setUsers(u);
      setStores(s);
    });
    setLoading(false);
  }, []);

  const userDisplayName = (id: string) => {
    const u = users.find((x) => x.id === id);
    if (!u) return id.slice(0, 8);
    return (u.username && u.username.trim()) ? u.username : u.email;
  };
  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);

  const openEdit = (m: StaffMember) => {
    setEditId(m.id);
    setEditForm(toFormData(m));
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.post(`${API}/staff-members/`, {
        ...createForm,
        hourly_wage: Math.round(Number(createForm.hourly_wage)) || 0,
        commission_rate: Number(createForm.commission_rate),
        check_in: new Date(createForm.check_in).toISOString(),
        check_out: new Date(createForm.check_out).toISOString(),
      });
      fetchMembers();
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
      await axios.patch(`${API}/staff-members/${editId}/`, {
        ...editForm,
        hourly_wage: Math.round(Number(editForm.hourly_wage)) || 0,
        commission_rate: Number(editForm.commission_rate),
        check_in: new Date(editForm.check_in).toISOString(),
        check_out: new Date(editForm.check_out).toISOString(),
      });
      fetchMembers();
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
      await axios.delete(`${API}/staff-members/${id}/`);
      fetchMembers();
      setDeleteConfirmId(null);
      if (viewId === id) setViewId(null);
    } catch {
      setError(ERROR_MESSAGES.delete);
    }
  };

  const viewMember = viewId ? members.find((x) => x.id === viewId) : null;

  return (
    <PageContainer>
      <PageHeader
        title="スタッフ・担当者管理"
        description="スタッフの登録・閲覧・編集・削除ができます。"
        icon={<UsersRound className="h-5 w-5" strokeWidth={2} />}
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
            onClick={() => { setCreateOpen(true); setError(null); setCreateForm(emptyForm()); }}
          >
            新規登録
          </Button>
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
                  <Th>ユーザー</Th>
                  <Th>店舗</Th>
                  <Th className="text-right">時給（円）</Th>
                  <Th className="text-right">歩合率</Th>
                  <Th>出勤中</Th>
                  <Th>出勤</Th>
                  <Th>退勤</Th>
                  <Th className="text-right">操作</Th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-ink-soft">登録がありません</td></tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/30 transition-colors">
                      <Td className="font-medium text-ink">{userDisplayName(m.user)}</Td>
                      <Td><Badge tone="neutral">{storeName(m.store)}</Badge></Td>
                      <Td className="num-tabular text-right text-ink">{formatPrice(m.hourly_wage)}</Td>
                      <Td className="num-tabular text-right text-ink-muted">{m.commission_rate}</Td>
                      <Td>
                        {m.is_on_duty
                          ? <Badge tone="success" dot>出勤中</Badge>
                          : <Badge tone="neutral">退勤</Badge>}
                      </Td>
                      <Td className="num-tabular text-ink-muted">{formatDateTime(m.check_in)}</Td>
                      <Td className="num-tabular text-ink-muted">{formatDateTime(m.check_out)}</Td>
                      <Td className="text-right whitespace-nowrap">
                        <InlineAction onClick={() => setViewId(m.id)} icon={<Eye className="h-3.5 w-3.5" />}>表示</InlineAction>
                        <InlineAction onClick={() => openEdit(m)} icon={<Pencil className="h-3.5 w-3.5" />}>編集</InlineAction>
                        {deleteConfirmId === m.id ? (
                          <>
                            <InlineAction tone="danger" onClick={() => handleDelete(m.id)} icon={<Check className="h-3.5 w-3.5" />}>削除する</InlineAction>
                            <InlineAction onClick={() => setDeleteConfirmId(null)} icon={<X className="h-3.5 w-3.5" />}>キャンセル</InlineAction>
                          </>
                        ) : (
                          <InlineAction tone="danger-soft" onClick={() => setDeleteConfirmId(m.id)} icon={<Trash2 className="h-3.5 w-3.5" />}>削除</InlineAction>
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

      <Modal open={!!viewMember} onClose={() => setViewId(null)} title="スタッフ情報" size="sm">
        {viewMember && (
          <>
            <dl className="space-y-3 text-sm">
              <Row label="ユーザー" value={<span className="font-medium text-ink">{userDisplayName(viewMember.user)}</span>} />
              <Row label="店舗" value={storeName(viewMember.store)} />
              <Row label="時給（円）" value={<span className="num-tabular">{formatPrice(viewMember.hourly_wage)}</span>} />
              <Row label="歩合率" value={<span className="num-tabular">{viewMember.commission_rate}</span>} />
              <Row
                label="出勤中"
                value={viewMember.is_on_duty ? <Badge tone="success" dot>出勤中</Badge> : <Badge tone="neutral">退勤</Badge>}
              />
              <Row label="出勤" value={formatDateTime(viewMember.check_in)} />
              <Row label="退勤" value={formatDateTime(viewMember.check_out)} />
            </dl>
            <div className="mt-5 flex gap-2">
              <Button size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { setViewId(null); openEdit(viewMember); }}>編集</Button>
              <Button size="sm" variant="outline" onClick={() => setViewId(null)}>閉じる</Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={createOpen && !!createForm}
        onClose={() => { setCreateOpen(false); setCreateForm(null); }}
        title="スタッフを登録"
        size="sm"
      >
        {createForm && (
          <StaffMemberForm
            form={createForm}
            setForm={setCreateForm}
            users={users}
            stores={allowedStores}
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
        title="スタッフを編集"
        size="sm"
      >
        {editForm && (
          <StaffMemberForm
            form={editForm}
            setForm={setEditForm}
            users={users}
            stores={allowedStores}
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

interface StaffMemberFormProps {
  form: StaffMemberFormData;
  setForm: React.Dispatch<React.SetStateAction<StaffMemberFormData | null>>;
  users: User[];
  stores: Store[];
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
}

function castsForStore(users: User[], storeId: string): User[] {
  if (!storeId) return [];
  return users.filter((u) => u.role === 'Cast' && u.store === storeId);
}

function StaffMemberForm({ form, setForm, users, stores, onSubmit, saving, submitLabel, onCancel }: StaffMemberFormProps) {
  const update = (patch: Partial<StaffMemberFormData>) => setForm((f) => (f ? { ...f, ...patch } : null));
  const handleStoreChange = (storeId: string) => {
    const casts = castsForStore(users, storeId);
    const keepUser = storeId && form.user && casts.some((u) => u.id === form.user);
    update({ store: storeId, user: keepUser ? form.user : '' });
  };
  const casts = form.store ? castsForStore(users, form.store) : [];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Select label="店舗" value={form.store} onChange={(e) => handleStoreChange(e.target.value)} required>
        <option value="">選択してください</option>
        {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </Select>
      <Select
        label="キャスト（ユーザー）"
        value={form.user}
        onChange={(e) => update({ user: e.target.value })}
        required
        disabled={!form.store}
      >
        <option value="">{form.store ? '選択してください' : '先に店舗を選択してください'}</option>
        {casts.map((u) => (
          <option key={u.id} value={u.id}>
            {(u.username && u.username.trim()) ? u.username : u.email}
          </option>
        ))}
      </Select>
      <Input
        label="時給（円）"
        type="number"
        step="1"
        min="0"
        value={form.hourly_wage}
        onChange={(e) => update({ hourly_wage: e.target.value })}
        required
      />
      <Input
        label="歩合率"
        type="number"
        step="0.01"
        min="0"
        max="100"
        value={form.commission_rate}
        onChange={(e) => update({ commission_rate: e.target.value })}
        required
      />
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={form.is_on_duty}
          onChange={(e) => update({ is_on_duty: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        出勤中
      </label>
      <Input label="出勤日時" type="datetime-local" value={form.check_in} onChange={(e) => update({ check_in: e.target.value })} />
      <Input label="退勤日時" type="datetime-local" value={form.check_out} onChange={(e) => update({ check_out: e.target.value })} />
      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>{submitLabel}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>キャンセル</Button>
      </div>
    </form>
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
