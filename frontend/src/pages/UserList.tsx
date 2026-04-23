import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldCheck, Plus, Eye, Pencil, Ban, Check, X, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import type { Store } from '../types/customer';
import type { User, UserCreateFormData, UserEditFormData } from '../types/user';
import { USER_ROLES, USER_ROLE_LABELS } from '../types/user';
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

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

function roleTone(role: string): 'neutral' | 'brand' | 'info' | 'warning' | 'success' {
  if (role === 'Admin' || role === 'Owner') return 'warning';
  if (role === 'Supervisor') return 'info';
  if (role === 'Manager') return 'brand';
  if (role === 'Staff') return 'success';
  return 'neutral';
}

export default function UserList() {
  const { user: currentUser } = useAuth();
  const isAdminOrOwner = currentUser?.role === 'Admin' || currentUser?.role === 'Owner';
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UserEditFormData | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<UserCreateFormData | null>(null);
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = () => {
    axios.get<User[]>(`${API}/users/`).then((res) => setUsers(res.data)).catch(() => setUsers([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<User[]>(`${API}/users/`).then((res) => setUsers(res.data)).catch(() => setUsers([])),
      axios.get<Store[]>(`${API}/stores/`).then((res) => setStores(res.data)).catch(() => setStores([])),
    ]).finally(() => setLoading(false));
  }, []);

  const storeName = (id: string | null | undefined) =>
    id ? (stores.find((s) => s.id === id)?.name ?? id.slice(0, 8)) : '全店舗';

  const openEdit = (u: User) => {
    setEditId(u.id);
    setEditForm({
      username: u.username ?? '',
      email: u.email,
      role: u.role,
      password: '',
      store: u.store ?? null,
      viewable_stores: u.viewable_stores ?? [],
    });
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
      };
      if (createForm.store) payload.store = createForm.store;
      if (createForm.role === 'Supervisor' && Array.isArray(createForm.viewable_stores) && createForm.viewable_stores.length > 0) {
        payload.viewable_stores = createForm.viewable_stores;
      }
      await axios.post(`${API}/users/`, payload);
      fetchUsers();
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
      const payload: { username: string; email: string; role?: string; password?: string; store?: string | null; viewable_stores?: string[] } = {
        username: editForm.username,
        email: editForm.email,
      };
      if (isAdminOrOwner) {
        payload.role = editForm.role;
        payload.store = editForm.store || null;
        payload.viewable_stores = editForm.role === 'Supervisor' ? (editForm.viewable_stores ?? []) : [];
      }
      if (editForm.password.trim()) payload.password = editForm.password;
      await axios.patch(`${API}/users/${editId}/`, payload);
      fetchUsers();
      setEditId(null);
      setEditForm(null);
    } catch {
      setError(ERROR_MESSAGES.update);
    }
    setSaving(false);
  };

  const handleDeactivate = async (id: string) => {
    setError(null);
    try {
      await axios.delete(`${API}/users/${id}/`);
      fetchUsers();
      setDeactivateConfirmId(null);
      if (viewId === id) setViewId(null);
    } catch {
      setError(ERROR_MESSAGES.deactivate);
    }
  };

  const emptyCreateForm = (): UserCreateFormData => ({
    username: '',
    email: '',
    password: '',
    role: USER_ROLES[0],
    store: null,
    viewable_stores: [],
  });

  const viewUser = viewId ? users.find((x) => x.id === viewId) : null;
  const deactivateUser = deactivateConfirmId ? users.find((x) => x.id === deactivateConfirmId) : null;

  return (
    <PageContainer>
      <PageHeader
        title="ユーザー管理"
        description="キャスト・スタッフ・マネージャー・管理者の登録・編集・無効化ができます。"
        icon={<ShieldCheck className="h-5 w-5" strokeWidth={2} />}
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => { setCreateOpen(true); setError(null); setCreateForm(emptyCreateForm()); }}
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
                  <Th>ユーザー名</Th>
                  <Th>メールアドレス</Th>
                  <Th>権限</Th>
                  <Th>店舗</Th>
                  <Th>登録日</Th>
                  <Th className="text-right">操作</Th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-soft">登録がありません</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/30 transition-colors">
                      <Td className="font-medium text-ink whitespace-nowrap">{u.username || '—'}</Td>
                      <Td className="text-ink-muted max-w-[200px] truncate" title={u.email}>{u.email}</Td>
                      <Td><Badge tone={roleTone(u.role)}>{USER_ROLE_LABELS[u.role] ?? u.role}</Badge></Td>
                      <Td className="text-ink-muted">{storeName(u.store)}</Td>
                      <Td className="text-xs text-ink-soft num-tabular">{formatDate(u.created_at)}</Td>
                      <Td className="text-right whitespace-nowrap">
                        <InlineAction onClick={() => setViewId(u.id)} icon={<Eye className="h-3.5 w-3.5" />}>表示</InlineAction>
                        {(isAdminOrOwner || currentUser?.user_id === u.id) && (
                          <InlineAction onClick={() => openEdit(u)} icon={<Pencil className="h-3.5 w-3.5" />}>編集</InlineAction>
                        )}
                        <InlineAction tone="danger-soft" onClick={() => setDeactivateConfirmId(u.id)} icon={<Ban className="h-3.5 w-3.5" />}>無効化</InlineAction>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!viewUser} onClose={() => setViewId(null)} title="ユーザー情報" size="sm">
        {viewUser && (
          <>
            <dl className="space-y-3 text-sm">
              <Row label="ユーザー名" value={<span className="font-medium text-ink">{viewUser.username || '—'}</span>} />
              <Row label="メールアドレス" value={viewUser.email} />
              <Row label="権限" value={<Badge tone={roleTone(viewUser.role)}>{USER_ROLE_LABELS[viewUser.role] ?? viewUser.role}</Badge>} />
              <Row label="店舗" value={storeName(viewUser.store)} />
              {viewUser.role === 'Supervisor' && (
                <Row label="閲覧店舗" value={(viewUser.viewable_stores ?? []).map((id) => storeName(id)).join('、') || '—'} />
              )}
              <Row label="登録日" value={formatDate(viewUser.created_at)} />
            </dl>
            <div className="mt-5 flex gap-2">
              <Button size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { setViewId(null); openEdit(viewUser); }}>編集</Button>
              <Button size="sm" variant="outline" onClick={() => setViewId(null)}>閉じる</Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={createOpen && !!createForm}
        onClose={() => { setCreateOpen(false); setCreateForm(null); }}
        title="ユーザーを登録"
        size="sm"
      >
        {createForm && (
          <UserCreateForm
            form={createForm}
            setForm={setCreateForm}
            onSubmit={handleCreate}
            saving={saving}
            onCancel={() => { setCreateOpen(false); setCreateForm(null); }}
            stores={stores}
            isAdmin={isAdminOrOwner}
          />
        )}
      </Modal>

      <Modal
        open={!!editId && !!editForm}
        onClose={() => { setEditId(null); setEditForm(null); }}
        title="ユーザーを編集"
        size="sm"
      >
        {editForm && (
          <UserEditForm
            form={editForm}
            setForm={setEditForm}
            onSubmit={handleSaveEdit}
            saving={saving}
            onCancel={() => { setEditId(null); setEditForm(null); }}
            canEditRole={isAdminOrOwner}
            canEditStore={isAdminOrOwner}
            stores={stores}
            storeName={storeName}
          />
        )}
      </Modal>

      <Modal open={!!deactivateUser} onClose={() => setDeactivateConfirmId(null)} title="アカウントを無効化" size="sm">
        {deactivateUser && (
          <>
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">{deactivateUser.username || deactivateUser.email}</strong> のアカウントを無効化します。
              この操作ではアカウントが削除され、ログインできなくなります。よろしいですか？
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="danger" size="sm" leftIcon={<Check className="h-3.5 w-3.5" />} onClick={() => handleDeactivate(deactivateUser.id)}>
                無効化する
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDeactivateConfirmId(null)}>キャンセル</Button>
            </div>
          </>
        )}
      </Modal>
    </PageContainer>
  );
}

interface UserCreateFormProps {
  form: UserCreateFormData;
  setForm: React.Dispatch<React.SetStateAction<UserCreateFormData | null>>;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  onCancel: () => void;
  stores: Store[];
  isAdmin: boolean;
}

function UserCreateForm({ form, setForm, onSubmit, saving, onCancel, stores, isAdmin }: UserCreateFormProps) {
  const update = (patch: Partial<UserCreateFormData>) => setForm((f) => (f ? { ...f, ...patch } : null));
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="ユーザー名" type="text" value={form.username} onChange={(e) => update({ username: e.target.value })} placeholder="表示名（任意）" autoComplete="username" />
      <Input label="メールアドレス" type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} required autoComplete="email" />
      <Input label="パスワード" type="password" value={form.password} onChange={(e) => update({ password: e.target.value })} required minLength={1} autoComplete="new-password" />
      <Select label="権限" value={form.role} onChange={(e) => update({ role: e.target.value })} required>
        {USER_ROLES.map((r) => <option key={r} value={r}>{USER_ROLE_LABELS[r] ?? r}</option>)}
      </Select>
      {isAdmin && (
        <Select label="店舗" value={form.store ?? ''} onChange={(e) => update({ store: e.target.value || null })}>
          <option value="">全店舗（管理者）</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      )}
      {isAdmin && form.role === 'Supervisor' && (
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1.5">閲覧店舗（統括）</label>
          <p className="-mt-1 mb-1.5 text-xs text-ink-faint">この統括が閲覧できる店舗を選択（複数可）</p>
          <select
            multiple
            value={form.viewable_stores}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (o) => o.value);
              update({ viewable_stores: selected });
            }}
            className="block w-full min-h-[90px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>登録</Button>
        <Button type="button" variant="outline" onClick={onCancel}>キャンセル</Button>
      </div>
    </form>
  );
}

interface UserEditFormProps {
  form: UserEditFormData;
  setForm: React.Dispatch<React.SetStateAction<UserEditFormData | null>>;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  onCancel: () => void;
  canEditRole?: boolean;
  canEditStore?: boolean;
  stores: Store[];
  storeName: (id: string | null | undefined) => string;
}

function UserEditForm({ form, setForm, onSubmit, saving, onCancel, canEditRole = false, canEditStore = false, stores, storeName }: UserEditFormProps) {
  const update = (patch: Partial<UserEditFormData>) => setForm((f) => (f ? { ...f, ...patch } : null));
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="ユーザー名" type="text" value={form.username} onChange={(e) => update({ username: e.target.value })} placeholder="表示名（任意）" autoComplete="username" />
      <Input label="メールアドレス" type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} required autoComplete="email" />
      {canEditRole ? (
        <Select label="権限" value={form.role} onChange={(e) => update({ role: e.target.value })} required>
          {USER_ROLES.map((r) => <option key={r} value={r}>{USER_ROLE_LABELS[r] ?? r}</option>)}
        </Select>
      ) : (
        <Input label="権限" type="text" value={USER_ROLE_LABELS[form.role] ?? form.role} readOnly disabled />
      )}
      {canEditStore ? (
        <Select label="店舗" value={form.store ?? ''} onChange={(e) => update({ store: e.target.value || null })}>
          <option value="">全店舗（管理者）</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      ) : (
        <Input label="店舗" type="text" value={storeName(form.store)} readOnly disabled />
      )}
      {canEditStore && form.role === 'Supervisor' && (
        <div>
          <label className="block text-sm font-medium text-ink-muted mb-1.5">閲覧店舗（統括）</label>
          <p className="-mt-1 mb-1.5 text-xs text-ink-faint">この統括が閲覧できる店舗を選択（複数可）</p>
          <select
            multiple
            value={form.viewable_stores}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (o) => o.value);
              update({ viewable_stores: selected });
            }}
            className="block w-full min-h-[90px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          >
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
      <Input label="新しいパスワード" type="password" value={form.password} onChange={(e) => update({ password: e.target.value })} placeholder="変更する場合のみ入力" autoComplete="new-password" />
      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>保存</Button>
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

type InlineTone = 'default' | 'danger-soft';
const inlineTone: Record<InlineTone, string> = {
  default: 'text-ink-muted hover:text-ink hover:bg-slate-100',
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
