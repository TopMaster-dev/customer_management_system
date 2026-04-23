import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserPlus, CheckCircle2, AlertCircle, ArrowRight, FileText } from 'lucide-react';
import CustomerDetailModal from '../components/CustomerDetailModal';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import type { Store, CustomerFormData } from '../types/customer';
import { API } from '../config';
import { Button, Card, Input, PageContainer, PageHeader, Select } from '../components/ui';

const initialForm: CustomerFormData = {
  store: '',
  name: '',
  first_visit: '',
  contact_info: {},
  preferences: {},
  total_spend: '0',
};

function Fieldset({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
      <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">{title}</legend>
      <div className="space-y-4 mt-1">{children}</div>
    </fieldset>
  );
}

export default function CustomerRegistration() {
  const [stores, setStores] = useState<Store[]>([]);
  const [form, setForm] = useState<CustomerFormData>(initialForm);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    axios
      .get<Store[]>(`${API}/stores/`)
      .then((res) => setStores(res.data))
      .catch(() => setStores([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const payload = {
        store: form.store,
        name: form.name,
        first_visit: form.first_visit,
        contact_info: form.contact_info,
        preferences: form.preferences,
        total_spend: Math.round(Number(form.total_spend)) || 0,
      };
      const res = await axios.post(`${API}/customers/`, payload);
      setCreatedCustomerId(res.data.id);
      setSuccess(true);
    } catch {
      setError(ERROR_MESSAGES.create);
    }
    setSubmitting(false);
  };

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="お客様登録"
        description="基本情報を入力後、必要に応じて詳細を登録できます。"
        icon={<UserPlus className="h-5 w-5" strokeWidth={2} />}
      />

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>登録が完了しました。</span>
          </div>
        )}

        <Card className="space-y-5">
          <Select
            label="店舗"
            value={form.store}
            onChange={(e) => setForm((f) => ({ ...f, store: e.target.value }))}
            required
          >
            <option value="">選択してください</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>

          <Input
            label="お名前"
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            placeholder="山田 花子"
          />

          <Input
            label="初回来店日"
            type="date"
            value={form.first_visit}
            onChange={(e) => setForm((f) => ({ ...f, first_visit: e.target.value }))}
            required
          />

          <Fieldset title="連絡先">
            <Input
              label="LINE ID"
              type="text"
              value={form.contact_info?.line_id || ''}
              onChange={(e) => setForm((f) => ({ ...f, contact_info: { ...f.contact_info, line_id: e.target.value } }))}
            />
            <Input
              label="Instagram"
              type="text"
              value={form.contact_info?.instagram || ''}
              onChange={(e) => setForm((f) => ({ ...f, contact_info: { ...f.contact_info, instagram: e.target.value } }))}
            />
            <Input
              label="電話番号"
              type="text"
              value={form.contact_info?.phone || ''}
              onChange={(e) => setForm((f) => ({ ...f, contact_info: { ...f.contact_info, phone: e.target.value } }))}
            />
          </Fieldset>

          <Fieldset title="嗜好(任意)">
            <Input
              label="タバコの銘柄"
              type="text"
              value={form.preferences?.cigarette_brand || ''}
              onChange={(e) => setForm((f) => ({ ...f, preferences: { ...f.preferences, cigarette_brand: e.target.value } }))}
            />
            <Input
              label="喫煙タイプ"
              type="text"
              value={form.preferences?.smoking_type || ''}
              onChange={(e) => setForm((f) => ({ ...f, preferences: { ...f.preferences, smoking_type: e.target.value } }))}
            />
            <Input
              label="来店希望曜日"
              type="text"
              value={form.preferences?.visit_days || ''}
              onChange={(e) => setForm((f) => ({ ...f, preferences: { ...f.preferences, visit_days: e.target.value } }))}
              placeholder="土日など"
            />
          </Fieldset>

          <Input
            label="累計利用額（円）"
            type="number"
            step="1"
            min="0"
            value={form.total_spend}
            onChange={(e) => setForm((f) => ({ ...f, total_spend: e.target.value }))}
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="submit" loading={submitting} size="lg" leftIcon={<UserPlus className="h-4 w-4" />}>
              登録する
            </Button>
            {success && createdCustomerId && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => setShowDetailModal(true)}
                rightIcon={<ArrowRight className="h-4 w-4" />}
                leftIcon={<FileText className="h-4 w-4" />}
              >
                詳細情報を入力する
              </Button>
            )}
          </div>
        </Card>
      </form>

      {showDetailModal && createdCustomerId && (
        <CustomerDetailModal
          customerId={createdCustomerId}
          onClose={() => setShowDetailModal(false)}
          onSaved={() => setSuccess(true)}
        />
      )}
    </PageContainer>
  );
}
