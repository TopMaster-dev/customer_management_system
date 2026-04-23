import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Settings2, Save, RefreshCw, AlertCircle, CheckCircle2, Calculator } from 'lucide-react';
import { API } from '../config';
import { formatPrice } from '../utils/formatPrice';
import type { HostSalaryPreview, HostSalarySetting, HostRoundingMode } from '../types/hostSalarySettings';
import {
  Button,
  Card,
  Input,
  PageContainer,
  PageHeader,
  Select,
} from '../components/ui';

function monthValueNow() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function parseYM(v: string): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
}

export default function HostSalarySettings() {
  const [setting, setSetting] = useState<HostSalarySetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [taxRate, setTaxRate] = useState('0.1000');
  const [serviceRate, setServiceRate] = useState('0.2000');
  const [roundingMode, setRoundingMode] = useState<HostRoundingMode>('Round');
  const [ym, setYm] = useState(monthValueNow);

  const [preview, setPreview] = useState<HostSalaryPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchSetting = useCallback(() => {
    setLoading(true);
    setError(null);
    axios
      .get<HostSalarySetting>(`${API}/host-salary-settings/`)
      .then((r) => {
        setSetting(r.data);
        setTaxRate(r.data.tax_rate ?? '0.1000');
        setServiceRate(r.data.service_rate ?? '0.2000');
        setRoundingMode(r.data.rounding_mode ?? 'Round');
      })
      .catch((err) => {
        setSetting(null);
        setError(
          err?.response?.status === 403
            ? 'この画面はマネージャー（ホストクラブ店舗）のみ利用できます。'
            : '設定の取得に失敗しました。',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const fetchPreview = useCallback(() => {
    const parsed = parseYM(ym);
    if (!parsed) {
      setError('対象年月が不正です。');
      return;
    }
    setPreviewLoading(true);
    axios
      .get<HostSalaryPreview>(`${API}/host-salary-settings/preview/`, { params: parsed })
      .then((r) => setPreview(r.data))
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [ym]);

  useEffect(() => {
    fetchSetting();
  }, [fetchSetting]);

  useEffect(() => {
    if (setting) fetchPreview();
  }, [setting, fetchPreview]);

  const multiplier = useMemo(() => {
    const t = Number(taxRate);
    const s = Number(serviceRate);
    return 1 + (Number.isFinite(t) ? t : 0) + (Number.isFinite(s) ? s : 0);
  }, [taxRate, serviceRate]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        tax_rate: taxRate,
        service_rate: serviceRate,
        rounding_mode: roundingMode,
      };
      const res = await axios.patch<HostSalarySetting>(`${API}/host-salary-settings/`, payload);
      setSetting(res.data);
      setSuccess('保存しました。');
      fetchPreview();
    } catch (err: unknown) {
      setSuccess(null);
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(status === 403 ? '権限がありません。' : '保存に失敗しました。');
    }
    setSaving(false);
  };

  return (
    <PageContainer>
      <PageHeader
        title="給与設定（ホストクラブ）"
        description="小計・総売上の計算に使う税率/サービス料率などを設定します。"
        icon={<Settings2 className="h-5 w-5" strokeWidth={2} />}
      />

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading && <Card><p className="text-sm text-ink-soft text-center">読み込み中…</p></Card>}

      {!loading && setting && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card padded={false} className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/40">
              <h2 className="text-sm font-semibold text-ink inline-flex items-center gap-2">
                <Calculator className="h-4 w-4 text-brand-600" /> 計算設定
              </h2>
            </div>
            <form onSubmit={save} className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="税率（例: 0.10）" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} inputMode="decimal" />
                <Input label="サービス料率（例: 0.20）" value={serviceRate} onChange={(e) => setServiceRate(e.target.value)} inputMode="decimal" />
              </div>
              <Select label="端数処理（円）" value={roundingMode} onChange={(e) => setRoundingMode(e.target.value as HostRoundingMode)}>
                <option value="Round">四捨五入</option>
                <option value="Floor">切り捨て</option>
                <option value="Ceil">切り上げ</option>
              </Select>
              <div className="rounded-lg border border-brand-100 bg-gradient-to-br from-brand-50 to-indigo-50/40 px-4 py-3 text-sm">
                <p className="text-xs font-medium text-ink-soft">計算係数（1 + 税率 + サービス料率）</p>
                <p className="mt-1 text-xl font-semibold text-ink num-tabular">{Number.isFinite(multiplier) ? multiplier.toFixed(4) : '—'}</p>
              </div>
              <Button type="submit" loading={saving} fullWidth leftIcon={<Save className="h-4 w-4" />}>保存</Button>
            </form>
          </Card>

          <Card padded={false} className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/40 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-ink">当月プレビュー</h2>
                <p className="mt-0.5 text-xs text-ink-soft">来店記録の利用額合計から、小計/総売上の見込みを計算します。</p>
              </div>
              <input
                type="month"
                value={ym}
                onChange={(e) => setYm(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
            </div>
            <div className="p-5 space-y-4">
              <Button size="sm" variant="outline" leftIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={fetchPreview} loading={previewLoading}>
                再計算
              </Button>
              {!previewLoading && preview && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <PreviewTile label="店舗" value={preview.store_name} />
                  <PreviewTile label="組数（来店件数）" value={`${preview.groups.toLocaleString()} 組`} />
                  <PreviewTile label="総売上（来店利用額合計）" value={`${formatPrice(preview.total_sales)} 円`} highlight />
                  <PreviewTile label="小計（推定）" value={`${formatPrice(preview.subtotal_estimated)} 円`} highlight />
                  <div className="sm:col-span-2">
                    <PreviewTile label="小計→総売上（推定）" value={`${formatPrice(preview.total_from_subtotal_estimated)} 円`} highlight />
                  </div>
                </div>
              )}
              {!previewLoading && !preview && (
                <p className="text-sm text-ink-faint">プレビューを表示できませんでした（来店記録が無い場合は0になります）。</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

function PreviewTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? 'border-brand-100 bg-gradient-to-br from-brand-50/50 to-indigo-50/30' : 'border-slate-200 bg-slate-50/50'}`}>
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p className={`mt-1 font-semibold num-tabular ${highlight ? 'text-lg text-ink' : 'text-sm text-ink'}`}>{value}</p>
    </div>
  );
}
