import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Store as StoreIcon, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input } from '../components/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const next = searchParams.get('next') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await login(email.trim(), password);
    setSubmitting(false);
    if (result.ok) {
      navigate(next, { replace: true });
    } else {
      setError(result.error ?? 'ログインに失敗しました。メールアドレスとパスワードをご確認ください。');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white shadow-elevated">
            <StoreIcon className="h-6 w-6" strokeWidth={2} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-ink">顧客管理システム</h1>
          <p className="mt-1 text-sm text-ink-soft">Customer Management & Sales</p>
        </div>

        <div className="rounded-xl bg-white p-6 sm:p-8 shadow-elevated border border-slate-200/70">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-ink">ログイン</h2>
            <p className="mt-1 text-sm text-ink-soft">メールアドレスとパスワードを入力してください</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 text-sm text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}
            <Input
              id="login-email"
              label="メールアドレス"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" strokeWidth={1.75} />}
              placeholder="you@example.com"
              required
            />
            <Input
              id="login-password"
              label="パスワード"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" strokeWidth={1.75} />}
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
            />
            <Button
              type="submit"
              loading={submitting}
              fullWidth
              size="lg"
              leftIcon={!submitting ? <LogIn className="h-4 w-4" strokeWidth={2} /> : undefined}
            >
              {submitting ? 'ログイン中…' : 'ログイン'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-ink-faint">または</span>
            </div>
          </div>

          <Link
            to="/register"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 h-11 text-sm font-medium text-ink-muted hover:bg-slate-50 hover:text-ink transition-colors"
          >
            新規アカウントを登録
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          顧客情報の取り扱いには十分ご注意ください。
        </p>
      </div>
    </div>
  );
}
