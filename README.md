[English](#meta-cli) | [日本語](#meta-cli-日本語)

# meta-cli

> A CLI tool for managing Meta (Facebook/Instagram) ads and Facebook Pages from the terminal.

Built on the official [facebook-nodejs-business-sdk](https://github.com/facebook/facebook-nodejs-business-sdk), `meta-cli` provides a unified interface for ad campaign management, performance reporting, and Facebook Pages operations.

## Features

- **Ad Management** — Create, update, delete, and list campaigns, ad sets, and ads
- **Performance Reports** — Get insights (CPC, CTR, spend, impressions) at campaign/adset/ad level
- **Image Upload** — Upload ad images and get image hashes for creative specs
- **Targeting Search** — Find interest, region, and locale targeting IDs
- **Facebook Pages** — Publish posts, list recent posts, and get page insights
- **Multiple Output Formats** — Human-readable tables, JSON, or TSV for piping

## Quick Start

### Prerequisites

- Node.js 22+
- A Meta Business account with an ad account and/or Facebook Page

### Installation

```bash
# From npm
npm install -g meta-cli

# From source
git clone https://github.com/tackeyy/meta-ads-cli.git
cd meta-ads-cli
npm install
npm run build
npm link
```

### Configuration

Set the following environment variables:

```bash
# Required for ad management
export META_ADS_ACCESS_TOKEN="your-access-token"
export META_ADS_ACCOUNT_ID="act_XXXXX"

# Required for Facebook Pages (optional)
export ZEIMU_FB_PAGE_ID="your-page-id"
export ZEIMU_FB_PAGE_TOKEN="your-page-access-token"
```

You can add these to `~/.bashrc`, `~/.zshrc`, or a secrets file.

**How to get your access token:**

1. Go to [Meta Business Suite](https://business.facebook.com/settings/system-users) > System Users
2. Create or select a system user
3. Generate a token with `ads_management` and `ads_read` permissions

## Usage

### Authentication

```bash
meta-cli auth test          # Test token validity
meta-cli auth info          # Show ad account details
```

### Campaigns

```bash
meta-cli campaigns list                                              # List all
meta-cli campaigns create --name "My Campaign" --objective OUTCOME_LEADS
meta-cli campaigns update <id> --status ACTIVE --daily-budget 500000
meta-cli campaigns delete <id>
```

### Ad Sets

```bash
meta-cli adsets list                              # List all
meta-cli adsets list --campaign-id <id>            # Filter by campaign
meta-cli adsets create \
  --campaign-id <id> \
  --name "Targeting Group A" \
  --optimization-goal LINK_CLICKS \
  --billing-event IMPRESSIONS \
  --daily-budget 100000 \
  --targeting '{"geo_locations":{"countries":["JP"]},"age_min":25,"age_max":55}'
meta-cli adsets delete <id>
```

### Ads

```bash
meta-cli ads list                         # List all
meta-cli ads list --adset-id <id>          # Filter by ad set
meta-cli ads create \
  --adset-id <id> \
  --name "Ad Variant A" \
  --creative '{"creative_id":"123"}'
```

### Image Upload

```bash
meta-cli images upload --file ./banner.png   # Returns image hash
```

### Insights / Performance Report

```bash
meta-cli insights --level campaign --from 2026-03-01 --to 2026-03-31
meta-cli insights --level adset --json
meta-cli insights --level ad --from 2026-03-01 --to 2026-03-31
```

### Targeting Search

```bash
meta-cli targeting interests "accounting"     # Search interest IDs
meta-cli targeting regions "Tokyo"            # Search region keys
meta-cli targeting locales "Japanese"         # Search locale IDs
```

### Facebook Pages

```bash
meta-cli pages auth                            # Test page token
meta-cli pages post "Hello world!"             # Create a text post
meta-cli pages post "Check this" --link URL    # Post with link
meta-cli pages post "Photo" --image ./pic.png  # Post with image
meta-cli pages list --limit 5                  # List recent posts
meta-cli pages insights --from 2026-03-01 --to 2026-03-31
```

### Output Formats

```bash
meta-cli --json campaigns list    # JSON output
meta-cli --plain campaigns list   # TSV output (for scripting/piping)
meta-cli campaigns list           # Human-readable table (default)
```

## Tech Stack

- TypeScript + ESM
- [Commander.js](https://github.com/tj/commander.js) — CLI framework
- [facebook-nodejs-business-sdk](https://github.com/facebook/facebook-nodejs-business-sdk) — Official Meta SDK
- [Vitest](https://vitest.dev/) — Testing framework

## Development

```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a pull request.

## License

[MIT](LICENSE)

---

# meta-cli (日本語)

> Meta（Facebook/Instagram）広告とFacebookページをターミナルから管理するCLIツール。

Meta公式SDK [facebook-nodejs-business-sdk](https://github.com/facebook/facebook-nodejs-business-sdk) をベースに、広告キャンペーン管理・パフォーマンスレポート・Facebookページ運用を統一的に操作できます。

## 特徴

- **広告管理** — キャンペーン・広告セット・広告の作成・更新・削除・一覧
- **パフォーマンスレポート** — CPC・CTR・費用・インプレッション等をキャンペーン/広告セット/広告単位で取得
- **画像アップロード** — 広告用画像をアップロードしてimage hashを取得
- **ターゲティング検索** — インタレスト・地域・ロケールのターゲティングIDを検索
- **Facebookページ** — 投稿・一覧・インサイト取得
- **複数出力形式** — テーブル表示・JSON・TSV（パイプ用）

## クイックスタート

```bash
npm install -g meta-cli
```

### 環境変数の設定

```bash
# 広告管理用（必須）
export META_ADS_ACCESS_TOKEN="your-access-token"
export META_ADS_ACCOUNT_ID="act_XXXXX"

# Facebookページ用（任意）
export ZEIMU_FB_PAGE_ID="your-page-id"
export ZEIMU_FB_PAGE_TOKEN="your-page-access-token"
```

詳細な使い方は[英語版README](#usage)を参照してください。

## ライセンス

[MIT](LICENSE)
