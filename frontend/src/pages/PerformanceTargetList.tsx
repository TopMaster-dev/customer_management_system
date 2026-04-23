import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Target, Plus, Pencil, Trash2, Check, X, Save, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { PerformanceTarget, PerformanceTargetFormData, TargetType } from '../types/performanceTarget';
import { TARGET_TYPES } from '../types/performanceTarget';
import type { StaffMember } from '../types/staffMember';
import type { Store } from '../types/customer';
import type { User } from '../types/user';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import { formatPrice } from '../utils/formatPrice';
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

const emptyForm = (firstStaffId: string): PerformanceTargetFormData => ({
  staff: firstStaffId,
  target_amount: '0',
  target_type: 'Monthly',
  target_date: todayISO(),
});

function toFormData(t: PerformanceTarget): PerformanceTargetFormData {
  const n = Number(t.target_amount);
  const amount = Number.isNaN(n) ? '0' : String(Math.round(n));
  return {
    staff: t.staff,
    target_amount: amount,
    target_type: t.target_type,
    target_date: t.target_date,
  };
}

export default function PerformanceTargetList() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<PerformanceTarget[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PerformanceTargetFormData | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PerformanceTargetFormData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTargets = () => {
    axios.get<PerformanceTarget[]>(`${API}/performance-targets/`).then((r) => setTargets(r.data)).catch(() => setTargets([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<PerformanceTarget[]>(`${API}/performance-targets/`).then((r) => r.data).catch(() => []),
      axios.get<StaffMember[]>(`${API}/staff-members/`).then((r) => r.data).catch(() => []),
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
      axios.get<User[]>(`${API}/users/`).then((r) => r.data).catch(() => []),
    ]).then(([t, s, st, u]) => {
      setTargets(t);
      setStaff(s);
      setStores(st);
      setUsers(u);
    });
    setLoading(false);
  }, []);

  const myStaff = useMemo(() => {
    if (!user?.user_id) return [];
    return staff.filter((s) => s.user === user.user_id);
  }, [staff, user?.user_id]);

  const staffOptions = useMemo(() => (user?.role === 'Cast' ? myStaff : staff), [user?.role, myStaff, staff]);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);
  const staffLabel = (staffId: string) => {
    const sm = staff.find((s) => s.id === staffId);
    if (!sm) return staffId.slice(0, 8);
    return storeName(sm.store);
  };
  const castDisplayName = (staffId: string) => {
    const sm = staff.find((s) => s.id === staffId);
    if (!sm) return '—';
    const u = users.find((x) => x.id === sm.user);
    if (!u) return sm.id.slice(0, 8);
    return (u.username && u.username.trim()) ? u.username : u.email;
  };
  const isCast = user?.role === 'Cast';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.post(`${API}/performance-targets/`, {
        staff: createForm.staff,
        target_amount: Math.round(Number(createForm.target_amount)) || 0,
        target_type: createForm.target_type,
        target_date: createForm.target_date,
      });
      fetchTargets();
      setCreateOpen(false);
      setCreateForm(null);
    } catch {
      setError(ERROR_MESSAGES.create);
    }
    setSaving(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId || !editForm) return;
    setSaving(true);
    setError(null);
    try {
      await axios.patch(`${API}/performance-targets/${editId}/`, {
        staff: editForm.staff,
        target_amount: Math.round(Number(editForm.target_amount)) || 0,
        target_type: editForm.target_type,
        target_date: editForm.target_date,
      });
      fetchTargets();
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
      await axios.delete(`${API}/performance-targets/${id}/`);
      fetchTargets();
      setDeleteConfirmId(null);
    } catch {
      setError(ERROR_MESSAGES.delete);
    }
  };

  const openCreate = () => {
    const firstId = staffOptions[0]?.id ?? '';
    setCreateForm(emptyForm(firstId));
    setCreateOpen(true);
    setError(null);
  };

  const openEdit = (t: PerformanceTarget) => {
    setEditId(t.id);
    setEditForm(toFormData(t));
    setError(null);
  };

  if (!user) return null;

  return (
    <PageContainer>
      <PageHeader
        title="売上目標"
        description={isCast ? '自分の目標を登録・編集・削除' : '担当店舗内のキャストの目標を一覧・登録・編集・削除'}
        icon={<Target className="h-5 w-5" strokeWidth={2} />}
        actions={
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={openCreate}
            disabled={staffOptions.length === 0}
          >
            新規登録
          </Button>
        }
      />

      {staffOptions.length === 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            {isCast
              ? '目標を登録するには、スタッフ管理でご自身を店舗に登録する必要があります。'
              : '担当店舗にスタッフが登録されていません。スタッフ管理でキャストを登録してください。'}
          </span>
        </div>
      )}

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
                  <Th>店舗</Th>
                  {!isCast && <Th>担当</Th>}
                  <Th>種別</Th>
                  <Th>目標日</Th>
                  <Th className="text-right">目標額（円）</Th>
                  <Th className="text-right">操作</Th>
                </tr>
              </thead>
              <tbody>
                {targets.length === 0 ? (
                  <tr>
                    <td colSpan={isCast ? 5 : 6} className="px-4 py-12 text-center text-sm text-ink-soft">
                      目標がありません
                    </td>
                  </tr>
                ) : (
                  targets.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/30 transition-colors">
                      <Td><Badge tone="neutral">{staffLabel(t.staff)}</Badge></Td>
                      {!isCast && <Td className="font-medium text-ink">{castDisplayName(t.staff)}</Td>}
                      <Td>
                        <Badge tone={t.target_type === 'Daily' ? 'info' : 'brand'}>
                          {t.target_type === 'Daily' ? '日次' : '月次'}
                        </Badge>
                      </Td>
                      <Td className="num-tabular text-ink-muted">{t.target_date}</Td>
                      <Td className="num-tabular text-right text-ink">{formatPrice(t.target_amount)} 円</Td>
                      <Td className="text-right whitespace-nowrap">
                        <InlineAction onClick={() => openEdit(t)} icon={<Pencil className="h-3.5 w-3.5" />}>編集</InlineAction>
                        {deleteConfirmId === t.id ? (
                          <>
                            <InlineAction tone="danger" onClick={() => handleDelete(t.id)} icon={<Check className="h-3.5 w-3.5" />}>削除する</InlineAction>
                            <InlineAction onClick={() => setDeleteConfirmId(null)} icon={<X className="h-3.5 w-3.5" />}>キャンセル</InlineAction>
                          </>
                        ) : (
                          <InlineAction tone="danger-soft" onClick={() => setDeleteConfirmId(t.id)} icon={<Trash2 className="h-3.5 w-3.5" />}>削除</InlineAction>
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

      <Modal
        open={createOpen && !!createForm}
        onClose={() => { setCreateOpen(false); setCreateForm(null); }}
        title="目標を登録"
        size="sm"
      >
        {createForm && (
          <PerformanceTargetForm
            form={createForm}
            setForm={setCreateForm}
            staffOptions={staffOptions}
            staffLabel={staffLabel}
            isCast={isCast}
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
        title="目標を編集"
        size="sm"
      >
        {editForm && (
          <PerformanceTargetForm
            form={editForm}
            setForm={setEditForm}
            staffOptions={staffOptions}
            staffLabel={staffLabel}
            isCast={isCast}
            onSubmit={handleUpdate}
            saving={saving}
            submitLabel="保存"
            onCancel={() => { setEditId(null); setEditForm(null); }}
          />
        )}
      </Modal>
    </PageContainer>
  );
}

interface PerformanceTargetFormProps {
  form: PerformanceTargetFormData;
  setForm: React.Dispatch<React.SetStateAction<PerformanceTargetFormData | null>>;
  staffOptions: StaffMember[];
  staffLabel: (staffId: string) => string;
  isCast: boolean;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
}

function PerformanceTargetForm({ form, setForm, staffOptions, staffLabel, isCast, onSubmit, saving, submitLabel, onCancel }: PerformanceTargetFormProps) {
  const update = (patch: Partial<PerformanceTargetFormData>) => setForm((f) => (f ? { ...f, ...patch } : null));
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Select
        label={isCast ? '店舗（自分）' : '担当（キャスト）'}
        value={form.staff}
        onChange={(e) => update({ staff: e.target.value })}
        required
      >
        <option value="">選択してください</option>
        {staffOptions.map((s) => <option key={s.id} value={s.id}>{staffLabel(s.id)}</option>)}
      </Select>
      <Select label="種別" value={form.target_type} onChange={(e) => update({ target_type: e.target.value as TargetType })} required>
        {TARGET_TYPES.map((tt) => <option key={tt} value={tt}>{tt === 'Daily' ? '日次' : '月次'}</option>)}
      </Select>
      <Input label="目標日" type="date" value={form.target_date} onChange={(e) => update({ target_date: e.target.value })} required />
      <Input label="目標額（円）" type="number" step="1" min="0" value={form.target_amount} onChange={(e) => update({ target_amount: e.target.value })} required />
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
