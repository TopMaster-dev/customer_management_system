import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
  UserCircle,
  Target,
  Wallet,
  HandCoins,
  Settings2,
  Mail,
  KeyRound,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  TrendingUp,
  Paperclip,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import { formatPrice } from '../utils/formatPrice';
import { API } from '../config';
import type { PerformanceTarget, PerformanceTargetFormData, TargetType } from '../types/performanceTarget';
import { TARGET_TYPES } from '../types/performanceTarget';
import type { StaffMember } from '../types/staffMember';
import type { Store } from '../types/customer';
import type { AdvanceRequest } from '../types/advanceRequest';
import { ADVANCE_STATUS_LABELS } from '../types/advanceRequest';
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

const PLACEHOLDER_GOAL = { label: '今月の売上目標', value: '500,000', unit: '円', rate: 75 };
const PLACEHOLDER_SALES = [
  { label: '1月', value: 320 },
  { label: '2月', value: 380 },
  { label: '3月', value: 410 },
  { label: '4月', value: 350 },
  { label: '5月', value: 480 },
  { label: '6月', value: 420 },
];

const emptyTargetForm = (firstStaffId: string): PerformanceTargetFormData => ({
  staff: firstStaffId,
  target_amount: '0',
  target_type: 'Monthly',
  target_date: todayISO(),
});

interface MyPageSalary {
  hourly_wage: number | null;
  current_month_commission: number;
  last_month_commission: number;
}

function SectionCard({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/40">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="text-brand-600">{icon}</span>
          {title}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </Card>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink num-tabular">{value}</p>
    </div>
  );
}

function advanceStatusTone(status: string): 'success' | 'danger' | 'warning' {
  if (status === 'Approved') return 'success';
  if (status === 'Rejected') return 'danger';
  return 'warning';
}

export default function MyPage() {
  const { user, updateStoredUser } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [targets, setTargets] = useState<PerformanceTarget[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(false);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [targetForm, setTargetForm] = useState<PerformanceTargetFormData | null>(null);
  const [targetEditId, setTargetEditId] = useState<string | null>(null);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetError, setTargetError] = useState<string | null>(null);

  const [salary, setSalary] = useState<MyPageSalary | null>(null);
  const [salaryLoading, setSalaryLoading] = useState(false);

  const [advanceRequests, setAdvanceRequests] = useState<AdvanceRequest[]>([]);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [advanceSaving, setAdvanceSaving] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceMemo, setAdvanceMemo] = useState('');
  const [advanceFile, setAdvanceFile] = useState<File | null>(null);
  const [advanceStatusUpdating, setAdvanceStatusUpdating] = useState<string | null>(null);

  const isCast = user?.role === 'Cast';
  const canApproveAdvance =
    user?.role === 'Manager' || user?.role === 'Supervisor' || user?.role === 'Admin' || user?.role === 'Owner';

  const fetchTargets = () => {
    if (!isCast) return;
    axios.get<PerformanceTarget[]>(`${API}/performance-targets/`).then((r) => setTargets(r.data)).catch(() => setTargets([]));
  };

  useEffect(() => {
    if (!isCast) return;
    setTargetsLoading(true);
    Promise.all([
      axios.get<PerformanceTarget[]>(`${API}/performance-targets/`).then((r) => r.data).catch(() => []),
      axios.get<StaffMember[]>(`${API}/staff-members/`).then((r) => r.data).catch(() => []),
      axios.get<Store[]>(`${API}/stores/`).then((r) => r.data).catch(() => []),
    ]).then(([t, s, st]) => {
      setTargets(t);
      setStaff(s);
      setStores(st);
    }).finally(() => setTargetsLoading(false));
  }, [isCast]);

  useEffect(() => {
    if (!isCast) return;
    setSalaryLoading(true);
    axios.get<MyPageSalary>(`${API}/my-page/salary/`).then((r) => setSalary(r.data)).catch(() => setSalary(null)).finally(() => setSalaryLoading(false));
  }, [isCast]);

  const fetchAdvanceRequests = () => {
    setAdvanceLoading(true);
    axios.get<AdvanceRequest[]>(`${API}/advance-requests/`).then((r) => setAdvanceRequests(r.data)).catch(() => setAdvanceRequests([])).finally(() => setAdvanceLoading(false));
  };
  useEffect(() => {
    fetchAdvanceRequests();
  }, []);

  const myAdvanceRequests = useMemo(() => advanceRequests.filter((a) => a.user === user?.user_id), [advanceRequests, user?.user_id]);
  const pendingAdvanceRequests = useMemo(() => advanceRequests.filter((a) => a.status === 'Pending' && a.user !== user?.user_id), [advanceRequests, user?.user_id]);

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Math.round(Number(advanceAmount));
    if (!Number.isFinite(amount) || amount < 1) {
      setAdvanceError('有効な金額を入力してください。');
      return;
    }
    setAdvanceSaving(true);
    setAdvanceError(null);
    try {
      const formData = new FormData();
      formData.append('amount', String(amount));
      formData.append('memo', advanceMemo.trim());
      if (advanceFile) formData.append('attachment', advanceFile);
      await axios.post(`${API}/advance-requests/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      fetchAdvanceRequests();
      setAdvanceAmount('');
      setAdvanceMemo('');
      setAdvanceFile(null);
    } catch {
      setAdvanceError(ERROR_MESSAGES.create);
    }
    setAdvanceSaving(false);
  };

  const handleAdvanceStatus = async (id: string, newStatus: 'Approved' | 'Rejected') => {
    setAdvanceStatusUpdating(id);
    try {
      await axios.patch(`${API}/advance-requests/${id}/`, { status: newStatus });
      fetchAdvanceRequests();
    } catch {
      setAdvanceError(ERROR_MESSAGES.update);
    }
    setAdvanceStatusUpdating(null);
  };

  function formatDate(iso: string) {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  const myStaff = useMemo(() => {
    if (!user?.user_id) return [];
    return staff.filter((s) => s.user === user.user_id);
  }, [staff, user?.user_id]);

  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? id.slice(0, 8);
  const staffLabel = (staffId: string) => {
    const sm = staff.find((s) => s.id === staffId);
    if (!sm) return staffId.slice(0, 8);
    return storeName(sm.store);
  };

  const openAddTarget = () => {
    setTargetForm(emptyTargetForm(myStaff[0]?.id ?? ''));
    setTargetEditId(null);
    setTargetModalOpen(true);
    setTargetError(null);
  };

  const openEditTarget = (t: PerformanceTarget) => {
    const n = Number(t.target_amount);
    const amount = Number.isNaN(n) ? '0' : String(Math.round(n));
    setTargetForm({
      staff: t.staff,
      target_amount: amount,
      target_type: t.target_type,
      target_date: t.target_date,
    });
    setTargetEditId(t.id);
    setTargetModalOpen(true);
    setTargetError(null);
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetForm) return;
    setTargetSaving(true);
    setTargetError(null);
    const payload = {
      ...targetForm,
      target_amount: Math.round(Number(targetForm.target_amount)) || 0,
    };
    try {
      if (targetEditId) {
        await axios.patch(`${API}/performance-targets/${targetEditId}/`, payload);
      } else {
        await axios.post(`${API}/performance-targets/`, payload);
      }
      fetchTargets();
      setTargetModalOpen(false);
      setTargetForm(null);
      setTargetEditId(null);
    } catch {
      setTargetError(ERROR_MESSAGES.update);
    }
    setTargetSaving(false);
  };

  const handleDeleteTarget = async (id: string) => {
    setTargetError(null);
    try {
      await axios.delete(`${API}/performance-targets/${id}/`);
      fetchTargets();
      setTargetDeleteId(null);
    } catch {
      setTargetError(ERROR_MESSAGES.delete);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!newEmail.trim() || !user) return;
    setSaving(true);
    try {
      await axios.patch(`${API}/users/${user.user_id}/`, { email: newEmail.trim() });
      updateStoredUser({ email: newEmail.trim() });
      setSuccess('メールアドレスを変更しました。');
      setNewEmail('');
      setEmailModalOpen(false);
    } catch {
      setError(ERROR_MESSAGES.change);
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setError('パスワードが一致しません。もう一度ご確認ください。');
      return;
    }
    if (newPassword.length < 1) {
      setError(ERROR_MESSAGES.invalidInput);
      return;
    }
    setSaving(true);
    try {
      await axios.patch(`${API}/users/${user.user_id}/`, { password: newPassword });
      setSuccess('パスワードを変更しました。');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordModalOpen(false);
    } catch {
      setError(ERROR_MESSAGES.change);
    }
    setSaving(false);
  };

  if (!user) return null;

  const maxBar = Math.max(...PLACEHOLDER_SALES.map((s) => s.value));

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="マイページ"
        description={`${user.email} · ${user.role}`}
        icon={<UserCircle className="h-5 w-5" strokeWidth={2} />}
      />

      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-5">
        <SectionCard title="ダッシュボード" icon={<TrendingUp className="h-4 w-4" strokeWidth={2} />}>
          <div className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50 to-indigo-50/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-ink">{PLACEHOLDER_GOAL.label}</span>
              <span className="text-xl font-semibold text-ink num-tabular">
                {PLACEHOLDER_GOAL.value} <span className="text-sm text-ink-soft font-normal">{PLACEHOLDER_GOAL.unit}</span>
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-white/80 overflow-hidden">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${PLACEHOLDER_GOAL.rate}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-ink-soft">達成率 <span className="font-semibold text-brand-700 num-tabular">{PLACEHOLDER_GOAL.rate}%</span></p>
          </div>

          <div className="mt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-3">売上推移（サンプル）</h3>
            <div className="flex items-end gap-2 h-44">
              {PLACEHOLDER_SALES.map((s) => (
                <div key={s.label} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-2xs font-semibold text-ink-muted num-tabular">{s.value}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-brand-500 to-brand-300 min-h-[0.5rem] transition-all"
                    style={{ height: `${(s.value / maxBar) * 100}%` }}
                  />
                  <span className="text-2xs text-ink-faint">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {isCast && (
          <SectionCard title="給与情報" icon={<Wallet className="h-4 w-4" strokeWidth={2} />}>
            {salaryLoading ? (
              <p className="text-sm text-ink-soft">読み込み中…</p>
            ) : salary ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <StatTile label="現在の時給" value={`${formatPrice(salary.hourly_wage)} 円`} />
                <StatTile label="現在給与（今月の歩合見込み）" value={`${formatPrice(salary.current_month_commission)} 円`} />
                <StatTile label="先月給与（先月の歩合）" value={`${formatPrice(salary.last_month_commission)} 円`} />
              </div>
            ) : (
              <p className="text-sm text-ink-soft">スタッフに登録されると給与情報が表示されます。</p>
            )}
          </SectionCard>
        )}

        {isCast && (
          <SectionCard
            title="売上目標"
            icon={<Target className="h-4 w-4" strokeWidth={2} />}
            action={
              <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={openAddTarget} disabled={myStaff.length === 0}>
                目標を追加
              </Button>
            }
          >
            {targetError && (
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{targetError}</span>
              </div>
            )}
            {myStaff.length === 0 ? (
              <p className="text-sm text-ink-soft">目標を登録するには、スタッフ管理でご自身を店舗に登録する必要があります。</p>
            ) : targetsLoading ? (
              <p className="text-sm text-ink-soft">読み込み中…</p>
            ) : targets.length === 0 ? (
              <p className="text-sm text-ink-soft">目標がありません。「目標を追加」から登録してください。</p>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full min-w-max text-left text-sm">
                  <thead>
                    <tr className="border-y border-slate-200 bg-slate-50/40">
                      <Th>店舗</Th>
                      <Th>種別</Th>
                      <Th>目標日</Th>
                      <Th className="text-right">目標額</Th>
                      <Th className="text-right">操作</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 last:border-0">
                        <Td className="font-medium text-ink">{staffLabel(t.staff)}</Td>
                        <Td>
                          <Badge tone={t.target_type === 'Daily' ? 'info' : 'brand'}>
                            {t.target_type === 'Daily' ? '日次' : '月次'}
                          </Badge>
                        </Td>
                        <Td className="num-tabular text-ink-muted">{t.target_date}</Td>
                        <Td className="num-tabular text-right text-ink">{formatPrice(t.target_amount)} 円</Td>
                        <Td className="text-right whitespace-nowrap">
                          <InlineAction onClick={() => openEditTarget(t)} icon={<Pencil className="h-3.5 w-3.5" />}>編集</InlineAction>
                          {targetDeleteId === t.id ? (
                            <>
                              <InlineAction tone="danger" onClick={() => handleDeleteTarget(t.id)} icon={<Check className="h-3.5 w-3.5" />}>削除する</InlineAction>
                              <InlineAction onClick={() => setTargetDeleteId(null)} icon={<X className="h-3.5 w-3.5" />}>キャンセル</InlineAction>
                            </>
                          ) : (
                            <InlineAction tone="danger-soft" onClick={() => setTargetDeleteId(t.id)} icon={<Trash2 className="h-3.5 w-3.5" />}>削除</InlineAction>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}

        <SectionCard title="前借申請" icon={<HandCoins className="h-4 w-4" strokeWidth={2} />}>
          <form onSubmit={handleAdvanceSubmit} className="space-y-4 max-w-md">
            <p className="text-sm text-ink-soft">前借希望金額と、任意で前借伝票を添付して申請できます。</p>
            {advanceError && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{advanceError}</span>
              </div>
            )}
            <Input
              label="前借希望金額（円）"
              type="number"
              step="1"
              min="1"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(e.target.value)}
              required
            />
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1.5">メモ（任意）</label>
              <textarea
                value={advanceMemo}
                onChange={(e) => setAdvanceMemo(e.target.value)}
                rows={2}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-1.5">
                <span className="inline-flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" />前借伝票の添付（任意）</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif"
                onChange={(e) => setAdvanceFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-ink-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:text-sm file:font-medium file:cursor-pointer hover:file:bg-brand-100"
              />
            </div>
            <Button type="submit" loading={advanceSaving}>申請する</Button>
          </form>

          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2">自分の申請一覧</h3>
            {advanceLoading ? (
              <p className="text-sm text-ink-soft">読み込み中…</p>
            ) : myAdvanceRequests.length === 0 ? (
              <p className="text-sm text-ink-soft">申請がありません。</p>
            ) : (
              <div className="overflow-x-auto -mx-5">
                <table className="w-full min-w-max text-left text-sm">
                  <thead>
                    <tr className="border-y border-slate-200 bg-slate-50/40">
                      <Th>申請日</Th>
                      <Th className="text-right">金額</Th>
                      <Th>状態</Th>
                      <Th>伝票</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {myAdvanceRequests.map((a) => (
                      <tr key={a.id} className="border-b border-slate-100 last:border-0">
                        <Td className="text-ink-muted">{formatDate(a.created_at)}</Td>
                        <Td className="num-tabular text-right text-ink">{formatPrice(a.amount)} 円</Td>
                        <Td>
                          <Badge tone={advanceStatusTone(a.status)} dot>
                            {ADVANCE_STATUS_LABELS[a.status as keyof typeof ADVANCE_STATUS_LABELS] ?? a.status}
                          </Badge>
                        </Td>
                        <Td>
                          {a.attachment_url ? (
                            <a href={a.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 text-xs font-medium">
                              表示 <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {canApproveAdvance && pendingAdvanceRequests.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft mb-2">承認待ち一覧</h3>
              <div className="overflow-x-auto -mx-5">
                <table className="w-full min-w-max text-left text-sm">
                  <thead>
                    <tr className="border-y border-slate-200 bg-slate-50/40">
                      <Th>申請日</Th>
                      <Th className="text-right">金額</Th>
                      <Th>伝票</Th>
                      <Th className="text-right">操作</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingAdvanceRequests.map((a) => (
                      <tr key={a.id} className="border-b border-slate-100 last:border-0">
                        <Td className="text-ink-muted">{formatDate(a.created_at)}</Td>
                        <Td className="num-tabular text-right text-ink">{formatPrice(a.amount)} 円</Td>
                        <Td>
                          {a.attachment_url ? (
                            <a href={a.attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 text-xs font-medium">
                              表示 <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-ink-faint">—</span>
                          )}
                        </Td>
                        <Td className="text-right whitespace-nowrap">
                          <InlineAction
                            tone="success"
                            disabled={advanceStatusUpdating === a.id}
                            onClick={() => handleAdvanceStatus(a.id, 'Approved')}
                            icon={<Check className="h-3.5 w-3.5" />}
                          >
                            承認
                          </InlineAction>
                          <InlineAction
                            tone="danger"
                            disabled={advanceStatusUpdating === a.id}
                            onClick={() => handleAdvanceStatus(a.id, 'Rejected')}
                            icon={<X className="h-3.5 w-3.5" />}
                          >
                            却下
                          </InlineAction>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="アカウント設定" icon={<Settings2 className="h-4 w-4" strokeWidth={2} />}>
          <div className="divide-y divide-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink-muted">
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">メールアドレス</p>
                  <p className="text-sm text-ink-soft truncate">{user.email}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEmailModalOpen(true); setError(null); setNewEmail(user.email); }}
              >
                変更
              </Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-ink-muted">
                  <KeyRound className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">パスワード</p>
                  <p className="text-sm text-ink-soft">••••••••</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setPasswordModalOpen(true); setError(null); setNewPassword(''); setConfirmPassword(''); }}
              >
                変更
              </Button>
            </div>
            <div className="pt-3">
              <p className="text-xs text-ink-faint">権限（ロール）の変更は管理者のみ行えます。</p>
            </div>
          </div>
        </SectionCard>
      </div>

      <Modal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} title="メールアドレスを変更" size="sm">
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleChangeEmail} className="space-y-4">
          <Input
            label="新しいメールアドレス"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            autoComplete="email"
            leftIcon={<Mail className="h-4 w-4" />}
          />
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>変更する</Button>
            <Button type="button" variant="outline" onClick={() => setEmailModalOpen(false)}>キャンセル</Button>
          </div>
        </form>
      </Modal>

      <Modal open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)} title="パスワードを変更" size="sm">
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="新しいパスワード"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={1}
            autoComplete="new-password"
            leftIcon={<KeyRound className="h-4 w-4" />}
          />
          <Input
            label="新しいパスワード（確認）"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={1}
            autoComplete="new-password"
            leftIcon={<KeyRound className="h-4 w-4" />}
          />
          <div className="flex gap-2">
            <Button type="submit" loading={saving}>変更する</Button>
            <Button type="button" variant="outline" onClick={() => setPasswordModalOpen(false)}>キャンセル</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isCast && targetModalOpen && !!targetForm}
        onClose={() => { setTargetModalOpen(false); setTargetForm(null); setTargetEditId(null); }}
        title={targetEditId ? '目標を編集' : '目標を追加'}
        size="sm"
      >
        {targetError && (
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{targetError}</span>
          </div>
        )}
        {targetForm && (
          <form onSubmit={handleSaveTarget} className="space-y-4">
            <Select
              label="店舗"
              value={targetForm.staff}
              onChange={(e) => setTargetForm((f) => f ? { ...f, staff: e.target.value } : null)}
              required
            >
              <option value="">選択してください</option>
              {myStaff.map((s) => <option key={s.id} value={s.id}>{staffLabel(s.id)}</option>)}
            </Select>
            <Select
              label="種別"
              value={targetForm.target_type}
              onChange={(e) => setTargetForm((f) => f ? { ...f, target_type: e.target.value as TargetType } : null)}
              required
            >
              {TARGET_TYPES.map((tt) => <option key={tt} value={tt}>{tt === 'Daily' ? '日次' : '月次'}</option>)}
            </Select>
            <Input
              label="目標日"
              type="date"
              value={targetForm.target_date}
              onChange={(e) => setTargetForm((f) => f ? { ...f, target_date: e.target.value } : null)}
              required
            />
            <Input
              label="目標額（円）"
              type="number"
              step="1"
              min="0"
              value={targetForm.target_amount}
              onChange={(e) => setTargetForm((f) => f ? { ...f, target_amount: e.target.value } : null)}
              required
            />
            <div className="flex gap-2 pt-1">
              <Button type="submit" loading={targetSaving}>{targetEditId ? '保存' : '追加'}</Button>
              <Button type="button" variant="outline" onClick={() => { setTargetModalOpen(false); setTargetForm(null); setTargetEditId(null); }}>キャンセル</Button>
            </div>
          </form>
        )}
      </Modal>
    </PageContainer>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink-soft whitespace-nowrap ${className || ''}`}>
      {children}
    </th>
  );
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3 ${className || ''}`}>{children}</td>;
}

type InlineTone = 'default' | 'danger' | 'danger-soft' | 'success';
const inlineTone: Record<InlineTone, string> = {
  default: 'text-ink-muted hover:text-ink hover:bg-slate-100',
  danger: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50',
  'danger-soft': 'text-ink-soft hover:text-rose-600 hover:bg-rose-50',
  success: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
};

function InlineAction({
  children,
  onClick,
  icon,
  tone = 'default',
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  icon?: React.ReactNode;
  tone?: InlineTone;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${inlineTone[tone]}`}
    >
      {icon}
      {children}
    </button>
  );
}
