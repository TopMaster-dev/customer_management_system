import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ClipboardList,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Check,
  X,
  Save,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import type {
  VisitRecord,
  VisitRecordFormData,
  StaffMember,
  PaymentMethod,
} from '../types/visitRecord';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import { formatPrice } from '../utils/formatPrice';
import type { Customer } from '../types/customer';
import type { User } from '../types/user';
import { PAYMENT_METHODS } from '../types/visitRecord';
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

function nowLocalISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const emptyForm = (): VisitRecordFormData => ({
  customer: '',
  cast: '',
  visit_date: '',
  spending: '0',
  payment_method: 'Cash',
  entry_time: nowLocalISO(),
  exit_time: nowLocalISO(),
  accompanied: false,
  companions: '',
  memo: '',
  unpaid_amount: '0',
  received_amount: '0',
  unpaid_date: '',
  receipt: false,
});

function roundPrice(value: string | number): string {
  const n = Number(value);
  return Number.isNaN(n) ? '0' : String(Math.round(n));
}

function toFormData(r: VisitRecord): VisitRecordFormData {
  return {
    customer: r.customer,
    cast: r.cast,
    visit_date: r.visit_date,
    spending: roundPrice(r.spending),
    payment_method: r.payment_method,
    entry_time: r.entry_time.slice(0, 16),
    exit_time: r.exit_time.slice(0, 16),
    accompanied: r.accompanied,
    companions: r.companions,
    memo: r.memo ?? '',
    unpaid_amount: roundPrice(r.unpaid_amount),
    received_amount: roundPrice(r.received_amount),
    unpaid_date: r.unpaid_date ?? '',
    receipt: r.receipt,
  };
}

function formatDateTime(s: string) {
  if (!s) return '—';
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' });
}

function formatDate(s: string) {
  return s || '—';
}

function paymentTone(pm: PaymentMethod): 'neutral' | 'brand' | 'info' {
  if (pm === 'Cash') return 'neutral';
  if (pm === 'Credit Card') return 'brand';
  return 'info';
}

export default function VisitRecordList() {
  const [records, setRecords] = useState<VisitRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<VisitRecordFormData | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<VisitRecordFormData | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = () => {
    axios.get<VisitRecord[]>(`${API}/visit-records/`).then((res) => setRecords(res.data)).catch(() => setRecords([]));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get<VisitRecord[]>(`${API}/visit-records/`).then((r) => r.data).catch(() => []),
      axios.get<Customer[]>(`${API}/customers/`).then((r) => r.data).catch(() => []),
      axios.get<StaffMember[]>(`${API}/staff-members/`).then((r) => r.data).catch(() => []),
      axios.get<User[]>(`${API}/users/`).then((r) => r.data).catch(() => []),
    ]).then(([recs, custs, st, u]) => {
      setRecords(recs);
      setCustomers(custs);
      setStaff(st);
      setUsers(u);
    });
    setLoading(false);
  }, []);

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? id.slice(0, 8);
  const castLabel = (staffMemberId: string) => {
    const sm = staff.find((s) => s.id === staffMemberId);
    if (!sm) return staffMemberId.slice(0, 8);
    const u = users.find((x) => x.id === sm.user);
    if (!u) return staffMemberId.slice(0, 8);
    return (u.username && u.username.trim()) ? u.username : u.email;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...createForm,
        spending: Math.round(Number(createForm.spending)) || 0,
        unpaid_amount: Math.round(Number(createForm.unpaid_amount)) || 0,
        received_amount: Math.round(Number(createForm.received_amount)) || 0,
        entry_time: createForm.entry_time ? new Date(createForm.entry_time).toISOString() : null,
        exit_time: createForm.exit_time ? new Date(createForm.exit_time).toISOString() : null,
        memo: createForm.memo || '',
        unpaid_date: createForm.unpaid_date || null,
      };
      await axios.post(`${API}/visit-records/`, payload);
      fetchRecords();
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
      const payload = {
        ...editForm,
        spending: Math.round(Number(editForm.spending)) ?? 0,
        unpaid_amount: Math.round(Number(editForm.unpaid_amount)) ?? 0,
        received_amount: Math.round(Number(editForm.received_amount)) ?? 0,
        entry_time: editForm.entry_time ? new Date(editForm.entry_time).toISOString() : null,
        exit_time: editForm.exit_time ? new Date(editForm.exit_time).toISOString() : null,
        memo: editForm.memo || '',
        unpaid_date: editForm.unpaid_date || null,
      };
      await axios.patch(`${API}/visit-records/${editId}/`, payload);
      fetchRecords();
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
      await axios.delete(`${API}/visit-records/${id}/`);
      fetchRecords();
      setDeleteConfirmId(null);
      if (viewId === id) setViewId(null);
    } catch {
      setError(ERROR_MESSAGES.delete);
    }
  };

  const openEdit = (r: VisitRecord) => {
    setEditId(r.id);
    setEditForm(toFormData(r));
    setError(null);
  };

  const viewRecord = viewId ? records.find((x) => x.id === viewId) : null;

  return (
    <PageContainer>
      <PageHeader
        title="来店記録"
        description="来店・売上記録の登録・閲覧・編集・削除"
        icon={<ClipboardList className="h-5 w-5" strokeWidth={2} />}
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
                  <Th>お客様</Th>
                  <Th>来店日</Th>
                  <Th className="text-right">利用額</Th>
                  <Th>支払方法</Th>
                  <Th>入店</Th>
                  <Th>退店</Th>
                  <Th className="text-right">操作</Th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-ink-soft">記録がありません</td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-brand-50/30 transition-colors">
                      <Td className="font-medium text-ink">{customerName(r.customer)}</Td>
                      <Td className="num-tabular text-ink-muted">{formatDate(r.visit_date)}</Td>
                      <Td className="num-tabular text-right text-ink">{formatPrice(r.spending)} 円</Td>
                      <Td><Badge tone={paymentTone(r.payment_method)}>{r.payment_method}</Badge></Td>
                      <Td className="num-tabular text-ink-muted">{formatDateTime(r.entry_time)}</Td>
                      <Td className="num-tabular text-ink-muted">{formatDateTime(r.exit_time)}</Td>
                      <Td className="text-right whitespace-nowrap">
                        <InlineAction onClick={() => setViewId(r.id)} icon={<Eye className="h-3.5 w-3.5" />}>表示</InlineAction>
                        <InlineAction onClick={() => openEdit(r)} icon={<Pencil className="h-3.5 w-3.5" />}>編集</InlineAction>
                        {deleteConfirmId === r.id ? (
                          <>
                            <InlineAction tone="danger" onClick={() => handleDelete(r.id)} icon={<Check className="h-3.5 w-3.5" />}>削除する</InlineAction>
                            <InlineAction onClick={() => setDeleteConfirmId(null)} icon={<X className="h-3.5 w-3.5" />}>キャンセル</InlineAction>
                          </>
                        ) : (
                          <InlineAction tone="danger-soft" onClick={() => setDeleteConfirmId(r.id)} icon={<Trash2 className="h-3.5 w-3.5" />}>削除</InlineAction>
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

      <Modal open={!!viewRecord} onClose={() => setViewId(null)} title="来店記録" size="md">
        {viewRecord && (
          <>
            <dl className="space-y-3 text-sm">
              <Row label="お客様" value={<span className="font-medium text-ink">{customerName(viewRecord.customer)}</span>} />
              <Row label="担当" value={castLabel(viewRecord.cast)} />
              <Row label="来店日" value={formatDate(viewRecord.visit_date)} />
              <Row label="利用額" value={<span className="num-tabular">{formatPrice(viewRecord.spending)} 円</span>} />
              <Row
                label="支払方法"
                value={<Badge tone={paymentTone(viewRecord.payment_method)}><CreditCard className="h-3 w-3 mr-1" />{viewRecord.payment_method}</Badge>}
              />
              <Row label="入店" value={formatDateTime(viewRecord.entry_time)} />
              <Row label="退店" value={formatDateTime(viewRecord.exit_time)} />
              <Row label="同伴" value={viewRecord.accompanied ? 'はい' : 'いいえ'} />
              {viewRecord.companions && <Row label="同伴者" value={viewRecord.companions} />}
              {viewRecord.memo && <Row label="メモ" value={<span className="whitespace-pre-wrap">{viewRecord.memo}</span>} />}
              <Row label="未払額" value={<span className="num-tabular">{formatPrice(viewRecord.unpaid_amount)} 円</span>} />
              <Row label="受取額" value={<span className="num-tabular">{formatPrice(viewRecord.received_amount)} 円</span>} />
              <Row label="未払日" value={formatDate(viewRecord.unpaid_date ?? '')} />
              <Row label="領収書" value={viewRecord.receipt ? 'あり' : 'なし'} />
            </dl>
            <div className="mt-5 flex gap-2">
              <Button size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { setViewId(null); openEdit(viewRecord); }}>編集</Button>
              <Button size="sm" variant="outline" onClick={() => setViewId(null)}>閉じる</Button>
            </div>
          </>
        )}
      </Modal>

      <Modal
        open={createOpen && !!createForm}
        onClose={() => { setCreateOpen(false); setCreateForm(null); }}
        title="来店記録を登録"
        size="md"
      >
        {createForm && (
          <VisitRecordForm
            form={createForm}
            setForm={setCreateForm}
            customers={customers}
            staff={staff}
            users={users}
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
        title="来店記録を編集"
        size="md"
      >
        {editForm && (
          <VisitRecordForm
            form={editForm}
            setForm={setEditForm}
            customers={customers}
            staff={staff}
            users={users}
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

interface VisitRecordFormProps {
  form: VisitRecordFormData;
  setForm: React.Dispatch<React.SetStateAction<VisitRecordFormData | null>>;
  customers: Customer[];
  staff: StaffMember[];
  users: User[];
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  submitLabel: string;
  onCancel: () => void;
}

function staffDisplayName(s: StaffMember, users: User[]): string {
  const u = users.find((x) => x.id === s.user);
  if (!u) return s.id.slice(0, 8);
  return (u.username && u.username.trim()) ? u.username : u.email;
}

function VisitRecordForm({ form, setForm, customers, staff, users, onSubmit, saving, submitLabel, onCancel }: VisitRecordFormProps) {
  const update = (patch: Partial<VisitRecordFormData>) => setForm((f) => (f ? { ...f, ...patch } : null));
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Select label="お客様" value={form.customer} onChange={(e) => update({ customer: e.target.value })} required>
        <option value="">選択してください</option>
        {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select label="担当（キャスト）" value={form.cast} onChange={(e) => update({ cast: e.target.value })} required>
        <option value="">選択してください</option>
        {staff.map((s) => <option key={s.id} value={s.id}>{staffDisplayName(s, users)}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="来店日" type="date" value={form.visit_date} onChange={(e) => update({ visit_date: e.target.value })} required />
        <Input label="利用額（円）" type="number" step="1" min="0" value={form.spending} onChange={(e) => update({ spending: e.target.value })} required />
      </div>
      <Select label="支払方法" value={form.payment_method} onChange={(e) => update({ payment_method: e.target.value as PaymentMethod })} required>
        {PAYMENT_METHODS.map((pm) => <option key={pm} value={pm}>{pm}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="入店日時" type="datetime-local" value={form.entry_time} onChange={(e) => update({ entry_time: e.target.value })} />
        <Input label="退店日時" type="datetime-local" value={form.exit_time} onChange={(e) => update({ exit_time: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-muted">
        <input
          type="checkbox"
          checked={form.accompanied}
          onChange={(e) => update({ accompanied: e.target.checked })}
          className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
        同伴あり
      </label>
      <Input label="同伴者" type="text" value={form.companions} onChange={(e) => update({ companions: e.target.value })} />
      <div>
        <label className="block text-sm font-medium text-ink-muted mb-1.5">メモ（任意）</label>
        <textarea
          value={form.memo}
          onChange={(e) => update({ memo: e.target.value })}
          rows={3}
          className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="未払額（円）" type="number" step="1" min="0" value={form.unpaid_amount} onChange={(e) => update({ unpaid_amount: e.target.value })} />
        <Input label="受取額（円）" type="number" step="1" min="0" value={form.received_amount} onChange={(e) => update({ received_amount: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3 items-end">
        <Input label="未払日（任意）" type="date" value={form.unpaid_date} onChange={(e) => update({ unpaid_date: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-ink-muted pb-3">
          <input
            type="checkbox"
            checked={form.receipt}
            onChange={(e) => update({ receipt: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          領収書
        </label>
      </div>
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
