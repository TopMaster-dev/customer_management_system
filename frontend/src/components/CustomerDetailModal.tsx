import React, { useState } from 'react';
import axios from 'axios';
import { AlertCircle, Save } from 'lucide-react';
import type {
  CustomerProfileFormData,
  CustomerDetailFormData,
  CustomerPreferenceFormData,
} from '../types/customer';
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

interface CustomerDetailModalProps {
  customerId: string;
  onClose: () => void;
  onSaved?: () => void;
}

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-slate-50/40 p-4">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">{title}</legend>
      <div className="mt-1 space-y-3">{children}</div>
    </fieldset>
  );
}

export default function CustomerDetailModal({ customerId, onClose, onSaved }: CustomerDetailModalProps) {
  const [profile, setProfile] = useState<CustomerProfileFormData>(initialProfile);
  const [detail, setDetail] = useState<CustomerDetailFormData>(initialDetail);
  const [preference, setPreference] = useState<CustomerPreferenceFormData>(initialPreference);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await axios.post(`${API}/customer-profiles/`, { customer: customerId, ...profile });
      await axios.post(`${API}/customer-details/`, {
        customer: customerId,
        ...detail,
        monthly_income: Math.round(Number(detail.monthly_income)) || 0,
        monthly_drinking_budget: Math.round(Number(detail.monthly_drinking_budget)) || 0,
      });
      await axios.post(`${API}/customer-preferences/`, { customer: customerId, ...preference });
      setSaving(false);
      onSaved?.();
      onClose();
    } catch {
      setError('登録に失敗しました。もう一度お試しください。');
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="詳細情報" size="lg">
      <form onSubmit={handleSaveAll} className="space-y-5">
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Fieldset title="プロフィール">
          <Input
            label="誕生日"
            type="date"
            value={profile.birthday}
            onChange={(e) => {
              const birthday = e.target.value;
              setProfile((p) => ({
                ...p,
                birthday,
                zodiac: getZodiacSignFromDate(birthday),
                animal_fortune: getEtoFromDate(birthday),
              }));
            }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="星座" value={profile.zodiac} onChange={(e) => setProfile((p) => ({ ...p, zodiac: e.target.value }))} placeholder="誕生日で自動" />
            <Input label="干支" value={profile.animal_fortune} onChange={(e) => setProfile((p) => ({ ...p, animal_fortune: e.target.value }))} placeholder="誕生日で自動" />
          </div>
        </Fieldset>

        <Fieldset title="詳細">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="血液型" value={detail.blood_type} onChange={(e) => setDetail((d) => ({ ...d, blood_type: e.target.value }))} />
            <Input label="出身地" value={detail.birthplace} onChange={(e) => setDetail((d) => ({ ...d, birthplace: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1.5">外見メモ</label>
            <textarea value={detail.appearance_memo} onChange={(e) => setDetail((d) => ({ ...d, appearance_memo: e.target.value }))} rows={2} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
          </div>
          <Input label="会社名" value={detail.company_name} onChange={(e) => setDetail((d) => ({ ...d, company_name: e.target.value }))} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="職種" value={detail.job_title} onChange={(e) => setDetail((d) => ({ ...d, job_title: e.target.value }))} />
            <Input label="勤務地" value={detail.work_location} onChange={(e) => setDetail((d) => ({ ...d, work_location: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1.5">仕事内容</label>
            <textarea value={detail.job_description} onChange={(e) => setDetail((d) => ({ ...d, job_description: e.target.value }))} rows={2} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="月収（円）" type="number" step="1" min="0" value={detail.monthly_income} onChange={(e) => setDetail((d) => ({ ...d, monthly_income: e.target.value }))} />
            <Input label="飲み代予算（円/月）" type="number" step="1" min="0" value={detail.monthly_drinking_budget} onChange={(e) => setDetail((d) => ({ ...d, monthly_drinking_budget: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="居住" value={detail.residence_type} onChange={(e) => setDetail((d) => ({ ...d, residence_type: e.target.value }))}>
              <option value="Own">持家</option>
              <option value="Rent">賃貸</option>
              <option value="Other">その他</option>
            </Select>
            <Input label="最寄り駅" value={detail.nearest_station} onChange={(e) => setDetail((d) => ({ ...d, nearest_station: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="婚姻状況" value={detail.marital_status} onChange={(e) => setDetail((d) => ({ ...d, marital_status: e.target.value }))}>
              <option value="Single">独身</option>
              <option value="Married">既婚</option>
              <option value="Divorced">離婚</option>
              <option value="Widowed">死別</option>
            </Select>
            <Input label="お子様" value={detail.children_info} onChange={(e) => setDetail((d) => ({ ...d, children_info: e.target.value }))} placeholder="なし など" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={detail.has_lover}
              onChange={(e) => setDetail((d) => ({ ...d, has_lover: e.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            恋人がいる
          </label>
        </Fieldset>

        <Fieldset title="嗜好">
          <Select label="お酒の強さ" value={preference.alcohol_strength} onChange={(e) => setPreference((p) => ({ ...p, alcohol_strength: e.target.value }))}>
            <option value="Weak">弱い</option>
            <option value="Medium">普通</option>
            <option value="Strong">強い</option>
          </Select>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1.5">好きな食べ物</label>
            <textarea value={preference.favorite_food} onChange={(e) => setPreference((p) => ({ ...p, favorite_food: e.target.value }))} rows={2} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1.5">苦手な食べ物</label>
            <textarea value={preference.dislike_food} onChange={(e) => setPreference((p) => ({ ...p, dislike_food: e.target.value }))} rows={2} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-muted mb-1.5">趣味</label>
            <textarea value={preference.hobby} onChange={(e) => setPreference((p) => ({ ...p, hobby: e.target.value }))} rows={2} className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200" />
          </div>
          <Input label="好きなブランド" value={preference.favorite_brand} onChange={(e) => setPreference((p) => ({ ...p, favorite_brand: e.target.value }))} />
        </Fieldset>

        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>キャンセル</Button>
          <Button type="submit" loading={saving} leftIcon={<Save className="h-4 w-4" />}>すべて保存</Button>
        </div>
      </form>
    </Modal>
  );
}
