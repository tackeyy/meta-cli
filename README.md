# Meta Ads CLI (`meta-ads-cli`)

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
meta-ads-cli auth test        # トークンの有効性確認
meta-ads-cli auth info        # 広告アカウント情報
```

### キャンペーン

```bash
meta-ads-cli campaigns list                                              # 一覧
meta-ads-cli campaigns create --name "..." --objective OUTCOME_LEADS     # 作成
meta-ads-cli campaigns update <id> --status ACTIVE                       # 更新
```

### 広告セット

```bash
meta-ads-cli adsets list                          # 全一覧
meta-ads-cli adsets list --campaign-id <id>       # キャンペーン別
meta-ads-cli adsets create \
  --campaign-id <id> \
  --name "税理士事務所 - 35-60歳" \
  --optimization-goal OFFSITE_CONVERSIONS \
  --billing-event IMPRESSIONS \
  --daily-budget 166700 \
  --targeting '{"geo_locations":{"countries":["JP"]},"age_min":35,"age_max":60}' \
  --promoted-object '{"pixel_id":"123","custom_event_type":"LEAD"}' \
  --status PAUSED
```

### 広告

```bash
meta-ads-cli ads list                   # 全一覧
meta-ads-cli ads list --adset-id <id>   # 広告セット別
meta-ads-cli ads create \
  --adset-id <id> \
  --name "広告A - 業務効率化訴求" \
  --creative '{"creative_id":"123"}' \
  --status PAUSED
```

### 画像アップロード

```bash
meta-ads-cli images upload --file ./path/to/image.png   # image_hash を返す
```

### レポート

```bash
meta-ads-cli insights --level campaign --from 2026-03-01 --to 2026-03-22
meta-ads-cli insights --level adset --json
```

### 出力フォーマット

```bash
meta-ads-cli --json campaigns list    # JSON
meta-ads-cli --plain campaigns list   # TSV（パイプ向け）
```

## 技術スタック

- TypeScript + ESM
- Commander.js
- facebook-nodejs-business-sdk（Meta公式SDK）
- Vitest

## ライセンス

MIT
