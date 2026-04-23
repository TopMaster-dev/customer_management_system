import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Mail,
  Lock,
  UserRound,
  Store as StoreIcon,
  AlertCircle,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Store } from '../types/customer';
import { ERROR_MESSAGES } from '../utils/errorMessages';
import type { LoginResponse } from '../types/auth';
import { API } from '../config';
import { Button, Input, Select } from '../components/ui';

interface RegistrationMode {
  has_admin: boolean;
  registration_role: 'Admin' | 'Cast';
  stores?: Store[];
}

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeId, setStoreId] = useState('');
  const [stores, setStores] = useState<Store[]>([]);
  const [registrationMode, setRegistrationMode] = useState<RegistrationMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { loginWithResponse } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get<RegistrationMode>(`${API}/auth/registration-mode/`)
      .then((r) => {
        const data = r.data ?? { has_admin: false, registration_role: 'Admin' as const, stores: [] };
        setRegistrationMode(data);
        setStores(data.stores ?? []);
      })
      .catch(() => {
        setRegistrationMode({ has_admin: false, registration_role: 'Admin', stores: [] });
        setStores([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasAdmin = registrationMode?.has_admin ?? false;
  const registerAsCast = hasAdmin;
  const storeRequired = registerAsCast;
  const showStoreField = registerAsCast && stores.length > 0;
  const cannotRegisterCast = registerAsCast && stores.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (storeRequired && !storeId.trim()) {
      setError(ERROR_MESSAGES.invalidInput);
      return;
    }
    setSubmitting(true);
    try {
      const payload: { username: string; email: string; password: string; store?: string } = {
        username: username.trim(),
        email: email.trim(),
        password,
      };
      if (storeId.trim()) payload.store = storeId;
      const res = await axios.post<LoginResponse>(`${API}/auth/register/`, payload);
      loginWithResponse(res.data);
      navigate('/', { replace: true });
    } catch {
      setError(ERROR_MESSAGES.create);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-elevated">
            <StoreIcon className="h-6 w-6" strokeWidth={2} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink">新規登録</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {registerAsCast ? 'キャストとして登録します' : '管理者として登録します'}
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 sm:p-8 shadow-elevated border border-slate-200/70">
          {loading ? (
            <p className="py-8 text-sm text-ink-soft text-center">読み込み中…</p>
          ) : cannotRegisterCast ? (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>既に管理者が登録されています。キャストとして登録するには、先に管理者が店舗を作成する必要があります。</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!registerAsCast && (
                <div className="flex items-start gap-2 rounded-lg bg-sky-50 border border-sky-200 px-3 py-2.5 text-sm text-sky-800">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>管理者として登録します。店舗はログイン後に登録できます。</span>
                </div>
              )}
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <Input
                id="reg-username"
                label="ユーザー名（任意）"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                leftIcon={<UserRound className="h-4 w-4" />}
                placeholder="表示名"
              />
              <Input
                id="reg-email"
                label="メールアドレス"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-4 w-4" />}
                placeholder="you@example.com"
                required
              />
              <Input
                id="reg-password"
                label="パスワード"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-ink-faint hover:text-ink-muted focus:outline-none"
                    aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
                minLength={1}
              />
              {showStoreField && (
                <Select
                  id="reg-store"
                  label="店舗"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  required
                >
                  <option value="">選択してください</option>
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </Select>
              )}
              <Button
                type="submit"
                loading={submitting}
                fullWidth
                size="lg"
                leftIcon={!submitting ? <UserPlus className="h-4 w-4" /> : undefined}
              >
                登録
              </Button>
            </form>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-ink-faint">すでにアカウントをお持ちですか？</span>
            </div>
          </div>

          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 h-11 text-sm font-medium text-ink-muted hover:bg-slate-50 hover:text-ink transition-colors"
          >
            ログインへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
