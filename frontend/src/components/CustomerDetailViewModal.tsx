import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertCircle, Pencil, Save, Trash2 } from 'lucide-react';
import type {
  CustomerProfileFormData,
  CustomerDetailFormData,
  CustomerPreferenceFormData,
} from '../types/customer';
import { formatPrice } from '../utils/formatPrice';
import { API } from '../config';
import { Button, Input, Modal, Select } from './ui';

const initialProfile: CustomerProfileFormData = {
  birthday: '',
  zodiac: '',
  animal_fortune: '',
};

const initialDetail: CustomerDetailFormData = {
  blood_type: '',
  birthplace: '',
  appearance_memo: '',
  company_name: '',
  job_title: '',
  job_description: '',
  work_location: '',
  monthly_income: '',
  monthly_drinking_budget: '',
  residence_type: 'Own',
  nearest_station: '',
  has_lover: false,
  marital_status: 'Single',
  children_info: '',
};

const initialPreference: CustomerPreferenceFormData = {
  alcohol_strength: 'Medium',
  favorite_food: '',
  dislike_food: '',
  hobby: '',
  favorite_brand: '',
};

function getZodiacSignFromDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 10) return '';
  const [, m, d] = dateStr.split('-').map(Number);
  const month = m;
  const day = d;
  if (month === 1 && day >= 20) return '水瓶座';
  if (month === 2 && day <= 18) return '水瓶座';
  if (month === 2 && day >= 19) return '魚座';
  if (month === 3 && day <= 20) return '魚座';
  if (month === 3 && day >= 21) return '牡羊座';
  if (month === 4 && day <= 19) return '牡羊座';
  if (month === 4 && day >= 20) return '牡牛座';
  if (month === 5 && day <= 20) return '牡牛座';
  if (month === 5 && day >= 21) return '双子座';
  if (month === 6 && day <= 20) return '双子座';
  if (month === 6 && day >= 21) return '蟹座';
  if (month === 7 && day <= 22) return '蟹座';
  if (month === 7 && day >= 23) return '獅子座';
  if (month === 8 && day <= 22) return '獅子座';
  if (month === 8 && day >= 23) return '乙女座';
  if (month === 9 && day <= 22) return '乙女座';
  if (month === 9 && day >= 23) return '天秤座';
  if (month === 10 && day <= 22) return '天秤座';
  if (month === 10 && day >= 23) return '蠍座';
  if (month === 11 && day <= 21) return '蠍座';
  if (month === 11 && day >= 22) return '射手座';
  if (month === 12 && day <= 21) return '射手座';
  return '摩羯座';
}

function getEtoFromDate(dateStr: string): string {
  if (!dateStr || dateStr.length < 4) return '';
  const year = parseInt(dateStr.slice(0, 4), 10);
  if (Number.isNaN(year)) return '';
  const eto = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  return eto[(year - 4) % 12] ?? '';
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-soft border-b border-slate-200 pb-2">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-ink-soft shrink-0">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}

interface CustomerDetailViewModalProps {
  customerId: string;
  onClose: () => void;
  onSaved?: () => void;
  onDeleted?: () => void;
}

export default function CustomerDetailViewModal({
  customerId,
  onClose,
  onSaved,
  onDeleted,
}: CustomerDetailViewModalProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfileFormData | null>(null);
  const [detail, setDetail] = useState<CustomerDetailFormData | null>(null);
  const [preference, setPreference] = useState<CustomerPreferenceFormData | null>(null);
  const [editProfile, setEditProfile] = useState<CustomerProfileFormData>(initialProfile);
  const [editDetail, setEditDetail] = useState<CustomerDetailFormData>(initialDetail);
  const [editPreference, setEditPreference] = useState<CustomerPreferenceFormData>(initialPreference);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseUrl = (path: string) => `${API}/${path}/${customerId}/`;
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, detailRes, prefRes] = await Promise.allSettled([
          axios.get(baseUrl('customer-profiles')),
          axios.get(baseUrl('customer-details')),
          axios.get(baseUrl('customer-preferences')),
        ]);
        const p = profileRes.status === 'fulfilled' ? profileRes.value.data : null;
        const d = detailRes.status === 'fulfilled' ? detailRes.value.data : null;
        const pr = prefRes.status === 'fulfilled' ? prefRes.value.data : null;
        setProfile(p);
        setDetail(d);
        setPreference(pr);
        setEditProfile(p ? { birthday: p.birthday, zodiac: p.zodiac, animal_fortune: p.animal_fortune } : initialProfile);
        setEditDetail(
          d
            ? {
                blood_type: d.blood_type || '',
                birthplace: d.birthplace || '',
                appearance_memo: d.appearance_memo || '',
                company_name: d.company_name || '',
                job_title: d.job_title || '',
                job_description: d.job_description || '',
                work_location: d.work_location || '',
                monthly_income: Number.isNaN(Number(d.monthly_income)) ? '' : String(Math.round(Number(d.monthly_income))),
                monthly_drinking_budget: Number.isNaN(Number(d.monthly_drinking_budget)) ? '' : String(Math.round(Number(d.monthly_drinking_budget))),
                residence_type: d.residence_type || 'Own',
                nearest_station: d.nearest_station || '',
                has_lover: d.has_lover ?? false,
                marital_status: d.marital_status || 'Single',
                children_info: d.children_info || '',
              }
            : initialDetail,
        );
        setEditPreference(
          pr
            ? {
                alcohol_strength: pr.alcohol_strength || 'Medium',
                favorite_food: pr.favorite_food || '',
                dislike_food: pr.dislike_food || '',
                hobby: pr.hobby || '',
                favorite_brand: pr.favorite_brand || '',
              }
            : initialPreference,
        );
      } catch {
        setError('詳細情報の読み込みに失敗しました。もう一度お試しください。');
      }
      setLoading(false);
    };
    fetchAll();
  }, [customerId]);

  const baseUrl = (path: string) => `${API}/${path}/${customerId}/`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (profile) {
        await axios.patch(baseUrl('customer-profiles'), editProfile);
      } else {
        await axios.post(`${API}/customer-profiles/`, { customer: customerId, ...editProfile });
      }
      if (detail) {
        await axios.patch(baseUrl('customer-details'), {
          ...editDetail,
          monthly_income: Math.round(Number(editDetail.monthly_income)) || 0,
          monthly_drinking_budget: Math.round(Number(editDetail.monthly_drinking_budget)) || 0,
        });
      } else {
        await axios.post(`${API}/customer-details/`, {
          customer: customerId,
          ...editDetail,
          monthly_income: Math.round(Number(editDetail.monthly_income)) || 0,
          monthly_drinking_budget: Math.round(Number(editDetail.monthly_drinking_budget)) || 0,
        });
      }
      if (preference) {
        await axios.patch(baseUrl('customer-preferences'), editPreference);
      } else {
        await axios.post(`${API}/customer-preferences/`, { customer: customerId, ...editPreference });
      }
      setProfile(editProfile);
      setDetail(editDetail);
      setPreference(editPreference);
      setMode('view');
      onSaved?.();
    } catch {
      setError('保存に失敗しました。もう一度お試しください。');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setError(null);
    setDeleting(true);
    try {
      await axios.delete(baseUrl('customer-profiles')).catch(() => {});
      await axios.delete(baseUrl('customer-details')).catch(() => {});
      await axios.delete(baseUrl('customer-preferences')).catch(() => {});
      onDeleted?.();
      onClose();
    } catch {
      setError('削除に失敗しました。もう一度お試しください。');
    }
    setDeleting(false);
    setConfirmDelete(false);
  };

  const hasAny = profile || detail || preference;
  const isEmpty = !loading && !hasAny;

  return (
    <Modal open onClose={onClose} title="詳細情報" size="lg">
      {loading ? (
        <p className="text-center text-sm text-ink-soft">読み込み中…</p>
      ) : (
        <div className="space-y-5">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {confirmDelete ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-rose-800">詳細情報をすべて削除しますか？</p>
              <div className="mt-3 flex gap-2">
                <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>削除する</Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>キャンセル</Button>
              </div>
            </div>
          ) : mode === 'view' ? (
            <>
              {isEmpty && <p className="text-sm text-ink-soft">詳細情報はまだ登録されていません。</p>}
              {profile && (
                <Section title="プロフィール">
                  <dl className="space-y-2">
                    <Row label="誕生日" value={profile.birthday} />
                    <Row label="星座" value={profile.zodiac} />
                    <Row label="干支" value={profile.animal_fortune} />
                  </dl>
                </Section>
              )}
              {detail && (
                <Section title="詳細">
                  <dl className="space-y-2">
                    <Row label="血液型" value={detail.blood_type || '—'} />
                    <Row label="出身地" value={detail.birthplace || '—'} />
                    {detail.appearance_memo && <Row label="外見メモ" value={<span className="whitespace-pre-wrap">{detail.appearance_memo}</span>} />}
                    <Row label="会社名" value={detail.company_name || '—'} />
                    <Row label="職種" value={detail.job_title || '—'} />
                    <Row label="勤務地" value={detail.work_location || '—'} />
                    {detail.job_description && <Row label="仕事内容" value={<span className="whitespace-pre-wrap">{detail.job_description}</span>} />}
                    <Row label="月収（円）" value={<span className="num-tabular">{formatPrice(detail.monthly_income)}</span>} />
                    <Row label="飲み代予算（円/月）" value={<span className="num-tabular">{formatPrice(detail.monthly_drinking_budget)}</span>} />
                    <Row label="居住" value={detail.residence_type === 'Own' ? '持家' : detail.residence_type === 'Rent' ? '賃貸' : detail.residence_type || '—'} />
                    <Row label="最寄り駅" value={detail.nearest_station || '—'} />
                    <Row label="婚姻状況" value={detail.marital_status === 'Single' ? '独身' : detail.marital_status === 'Married' ? '既婚' : detail.marital_status === 'Divorced' ? '離婚' : detail.marital_status === 'Widowed' ? '死別' : detail.marital_status || '—'} />
                    <Row label="お子様" value={detail.children_info || '—'} />
                    <Row label="恋人がいる" value={detail.has_lover ? 'はい' : 'いいえ'} />
                  </dl>
                </Section>
              )}
              {preference && (
                <Section title="嗜好">
                  <dl className="space-y-2">
                    <Row label="お酒の強さ" value={preference.alcohol_strength === 'Weak' ? '弱い' : preference.alcohol_strength === 'Strong' ? '強い' : preference.alcohol_strength === 'Medium' ? '普通' : preference.alcohol_strength || '—'} />
                    {preference.favorite_food && <Row label="好きな食べ物" value={<span className="whitespace-pre-wrap">{preference.favorite_food}</span>} />}
                    {preference.dislike_food && <Row label="苦手な食べ物" value={<span className="whitespace-pre-wrap">{preference.dislike_food}</span>} />}
                    {preference.hobby && <Row label="趣味" value={<span className="whitespace-pre-wrap">{preference.hobby}</span>} />}
                    {preference.favorite_brand && <Row label="好きなブランド" value={preference.favorite_brand} />}
                  </dl>
                </Section>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" leftIcon={<Pencil className="h-3.5 w-3.5" />} onClick={() => setMode('edit')}>編集</Button>
                {hasAny && (
                  <Button size="sm" variant="outline" className="!border-rose-200 !text-rose-600 hover:!bg-rose-50" leftIcon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setConfirmDelete(true)}>
                    削除
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={onClose}>閉じる</Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              <Section title="プロフィール">
                <div className="space-y-3">
                  <Input
                    label="誕生日"
                    type="date"
                    value={editProfile.birthday}
                    onChange={(e) => {
                      const birthday = e.target.value;
                      setEditProfile((p) => ({
                        ...p,
                        birthday,
                        zodiac: getZodiacSignFromDate(birthday),
                        animal_fortune: getEtoFromDate(birthday),
                      }));
                    }}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="星座" value={editProfile.zodiac} onChange={(e) => setEditProfile((p) => ({ ...p, zodiac: e.target.value }))} placeholder="誕生日で自動" />
                    <Input label="干支" value={editProfile.animal_fortune} onChange={(e) => setEditProfile((p) => ({ ...p, animal_fortune: e.target.value }))} placeholder="誕生日で自動" />
                  </div>
                </div>
              </Section>
              <Section title="詳細">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="血液型" value={editDetail.blood_type} onChange={(e) => setEditDetail((d) => ({ ...d, blood_type: e.target.value }))} />
                    <Input label="出身地" value={editDetail.birthplace} onChange={(e) => setEditDetail((d) => ({ ...d, birthplace: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-muted mb-1.5">外見メモ</label>
                    <textarea value={editDetail.appearance_memo} onChange={(e) => setEditDetail((d) => ({ ...d, appearance_memo: e.target.value }))} rows={2} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
                  </div>
                  <Input label="会社名" value={editDetail.company_name} onChange={(e) => setEditDetail((d) => ({ ...d, company_name: e.target.value }))} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="職種" value={editDetail.job_title} onChange={(e) => setEditDetail((d) => ({ ...d, job_title: e.target.value }))} />
                    <Input label="勤務地" value={editDetail.work_location} onChange={(e) => setEditDetail((d) => ({ ...d, work_location: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-muted mb-1.5">仕事内容</label>
                    <textarea value={editDetail.job_description} onChange={(e) => setEditDetail((d) => ({ ...d, job_description: e.target.value }))} rows={2} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="月収（円）" type="number" step="1" min="0" value={editDetail.monthly_income} onChange={(e) => setEditDetail((d) => ({ ...d, monthly_income: e.target.value }))} />
                    <Input label="飲み代予算（円/月）" type="number" step="1" min="0" value={editDetail.monthly_drinking_budget} onChange={(e) => setEditDetail((d) => ({ ...d, monthly_drinking_budget: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select label="居住" value={editDetail.residence_type} onChange={(e) => setEditDetail((d) => ({ ...d, residence_type: e.target.value }))}>
                      <option value="Own">持家</option>
                      <option value="Rent">賃貸</option>
                      <option value="Other">その他</option>
                    </Select>
                    <Input label="最寄り駅" value={editDetail.nearest_station} onChange={(e) => setEditDetail((d) => ({ ...d, nearest_station: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select label="婚姻状況" value={editDetail.marital_status} onChange={(e) => setEditDetail((d) => ({ ...d, marital_status: e.target.value }))}>
                      <option value="Single">独身</option>
                      <option value="Married">既婚</option>
                      <option value="Divorced">離婚</option>
                      <option value="Widowed">死別</option>
                    </Select>
                    <Input label="お子様" value={editDetail.children_info} onChange={(e) => setEditDetail((d) => ({ ...d, children_info: e.target.value }))} placeholder="なし など" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-ink-muted">
                    <input
                      type="checkbox"
                      checked={editDetail.has_lover}
                      onChange={(e) => setEditDetail((d) => ({ ...d, has_lover: e.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    恋人がいる
                  </label>
                </div>
              </Section>
              <Section title="嗜好">
                <div className="space-y-3">
                  <Select label="お酒の強さ" value={editPreference.alcohol_strength} onChange={(e) => setEditPreference((p) => ({ ...p, alcohol_strength: e.target.value }))}>
                    <option value="Weak">弱い</option>
                    <option value="Medium">普通</option>
                    <option value="Strong">強い</option>
                  </Select>
                  <div>
                    <label className="block text-sm font-medium text-ink-muted mb-1.5">好きな食べ物</label>
                    <textarea value={editPreference.favorite_food} onChange={(e) => setEditPreference((p) => ({ ...p, favorite_food: e.target.value }))} rows={2} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-muted mb-1.5">苦手な食べ物</label>
                    <textarea value={editPreference.dislike_food} onChange={(e) => setEditPreference((p) => ({ ...p, dislike_food: e.target.value }))} rows={2} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-muted mb-1.5">趣味</label>
                    <textarea value={editPreference.hobby} onChange={(e) => setEditPreference((p) => ({ ...p, hobby: e.target.value }))} rows={2} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
                  </div>
                  <Input label="好きなブランド" value={editPreference.favorite_brand} onChange={(e) => setEditPreference((p) => ({ ...p, favorite_brand: e.target.value }))} />
                </div>
              </Section>
              <div className="flex gap-2">
                <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>保存</Button>
                <Button type="button" variant="outline" onClick={() => setMode('view')}>キャンセル</Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
