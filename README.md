# Customer Management System

顧客・店舗・スタッフ・来店記録・日次売上・経費・給与・前借を管理する Web アプリケーションです。ロールに応じたアクセス制御と店舗単位のデータスコープに対応しています。

## 技術スタック

| 領域 | 技術 |
|------|------|
| バックエンド | Django 6.0, Django REST Framework 3.16, Simple JWT 5.3 |
| フロントエンド | React 18, TypeScript 4.9, React Router 6, Axios 1.7, Tailwind CSS 3.4 |
| データベース | PostgreSQL 14+（環境変数で接続設定） |
| 認証 | JWT（access / refresh トークン） |

## 主な機能

### 認証・ユーザー管理
- メール・パスワードでのログイン、JWT トークン発行・更新
- 新規登録（初回は Admin、以降は店舗を選択してキャストとして登録）
- 6 段階のロール: **Cast / Staff / Manager / Supervisor / Admin / Owner**
- ロールと店舗に基づくデータスコープ（Admin・Owner は全店舗、他は自店舗のみ）

### 顧客管理
- 顧客一覧・登録・編集・削除
- プロフィール・詳細・嗜好のモーダル登録・編集

### 来店・売上管理
- 来店記録の CRUD
- 日次売上（来店記録の利用額を店舗・日付で集計、参照専用）
- 日次経費（売上・経費・人件費・備考の登録・編集・削除）
- 日次日報（店舗日報の登録・参照）
- 月次店舗ランキング

### スタッフ・給与管理
- スタッフ一覧・登録・編集・削除（店舗スコープあり）
- ホスト給与設定・プレビュー
- 個人台帳（入出金サマリー）
- 前借申請・伝票管理
- パフォーマンス目標・店舗目標の設定

### その他
- 店舗 CRUD（新規作成は Admin / Owner のみ）
- ユーザー管理（ロール・店舗割り当て）
- キャスト稼働状況一覧（StoreCastOverview）
- マイページ（ログイン情報・目標・給与サマリー・メール／パスワード変更）
- 768px 未満でハンバーガーメニュー、テーブルは横スクロール対応

## 前提環境

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd customer_management_system
```

### 2. バックエンド

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**環境変数の設定 (`backend/.env`):**

```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DB_NAME=customer_management_db
DB_USER=cms_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

**PostgreSQL のデータベース・ユーザー作成:**

```bash
sudo -u postgres psql
```

```sql
CREATE USER cms_user WITH PASSWORD 'your_password';
CREATE DATABASE customer_management_db OWNER cms_user;
\c customer_management_db
GRANT USAGE, CREATE ON SCHEMA public TO cms_user;
\q
```

**マイグレーション・サーバー起動:**

```bash
python manage.py migrate
python manage.py runserver
# API: http://localhost:8000
```

### 3. フロントエンド

別ターミナルで:

```bash
cd frontend
npm install
npm start
# ブラウザ: http://localhost:3000
```

`package.json` のプロキシ設定により、フロントエンドからの `/api` リクエストは `http://localhost:8000` に転送されます。バックエンドを先に起動してください。

## データベースの再構築

既存 DB を削除してマイグレーションからやり直す場合:

```bash
./backend/scripts/rebuild_db.sh   # PostgreSQL の superuser で実行
```

詳細: [backend/scripts/README_REBUILD_DB.md](backend/scripts/README_REBUILD_DB.md)

## API 概要

- **ベース URL:** `http://localhost:8000/api/`
- **認証:** `POST /api/auth/login/` → access / refresh トークン
- **登録:** `POST /api/auth/register/`
- **トークン更新:** `POST /api/auth/refresh/`

**REST リソース（ViewSet）:**

| リソース | パス |
|----------|------|
| 店舗 | `/api/stores/` |
| ユーザー | `/api/users/` |
| 顧客 | `/api/customers/` |
| スタッフ | `/api/staff-members/` |
| 来店記録 | `/api/visit-records/` |
| 顧客プロフィール | `/api/customer-profiles/` |
| 顧客詳細 | `/api/customer-details/` |
| 顧客嗜好 | `/api/customer-preferences/` |
| パフォーマンス目標 | `/api/performance-targets/` |
| 日次サマリー | `/api/daily-summaries/` |
| 日次日報 | `/api/daily-reports/` |
| 前借申請 | `/api/advance-requests/` |
| 店舗目標 | `/api/store-targets/` |
| 個人台帳 | `/api/personal-ledger/` |

**カスタムエンドポイント:**

| エンドポイント | 説明 |
|----------------|------|
| `GET /api/my-page/salary/` | マイページ給与サマリー |
| `GET /api/store-cast-overview/` | キャスト稼働状況 |
| `GET /api/monthly-store-rankings/` | 月次店舗ランキング |
| `GET/POST /api/host-salary-settings/` | ホスト給与設定 |
| `POST /api/host-salary-settings/preview/` | 給与プレビュー |
| `GET /api/personal-ledger/summary/` | 個人台帳サマリー |

認証済みリクエストにはヘッダーへ `Authorization: Bearer <access_token>` を付与してください。

## ロールとアクセス

| ロール | 主なアクセス先 |
|--------|----------------|
| Cast | ホーム, 顧客一覧・登録, 来店記録, マイページ, 個人台帳 |
| Staff | Cast + 日次売上, 日次経費, 日次日報, スタッフ管理 |
| Manager | Staff + 店舗管理（自店舗の表示・編集）, 目標設定 |
| Supervisor | Manager + 複数店舗の統括・ランキング閲覧 |
| Admin | 全ページ・全店舗, 店舗新規作成, ユーザー管理, 給与設定 |
| Owner | Admin と同等 + 全権限 |

## プロジェクト構成

```
customer_management_system/
├── backend/                    # Django API
│   ├── api/                    # models, views, serializers, urls, auth
│   ├── backend/                # settings.py, urls.py
│   ├── scripts/                # DB 再構築スクリプト
│   ├── media/                  # アップロードファイル
│   ├── manage.py
│   └── requirements.txt
├── frontend/                   # React SPA
│   ├── public/
│   ├── src/
│   │   ├── components/         # 共通コンポーネント・モーダル
│   │   ├── contexts/           # AuthContext
│   │   ├── pages/              # 各画面（19 ページ）
│   │   ├── types/              # TypeScript 型定義
│   │   └── utils/              # エラーメッセージ等
│   └── package.json
└── README.md
```

## ライセンス

このプロジェクトのライセンスはリポジトリの記載に従います。
