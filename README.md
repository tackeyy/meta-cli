# Meta Ads CLI (`mac`)

Meta (Facebook/Instagram) 広告を管理するCLIツール。

## セットアップ

```bash
npm install
npm link
```

### 環境変数（~/.secrets に定義）

```bash
export META_ADS_ACCESS_TOKEN="your-system-user-token"
export META_ADS_ACCOUNT_ID="act_XXXXX"
```

## コマンド一覧

### 認証

```bash
mac auth test        # トークンの有効性確認
mac auth info        # 広告アカウント情報
```

### キャンペーン

```bash
mac campaigns list                                        # 一覧
mac campaigns create --name "..." --objective OUTCOME_LEADS  # 作成
mac campaigns update <id> --status ACTIVE                 # 更新
```

### 広告セット

```bash
mac adsets list                          # 全一覧
mac adsets list --campaign-id <id>       # キャンペーン別
```

### 広告

```bash
mac ads list                   # 全一覧
mac ads list --adset-id <id>   # 広告セット別
```

### レポート

```bash
mac insights --level campaign --from 2026-03-01 --to 2026-03-22
mac insights --level adset --json
```

### 出力フォーマット

```bash
mac --json campaigns list    # JSON
mac --plain campaigns list   # TSV（パイプ向け）
```

## 技術スタック

- TypeScript + ESM
- Commander.js
- facebook-nodejs-business-sdk（Meta公式SDK）
- Vitest

## ライセンス

MIT
