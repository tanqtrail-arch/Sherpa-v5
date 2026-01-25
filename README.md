# Sherupa v5 - 探究学習プラットフォーム

## 📁 ファイル構造

```
Sherpa-v5/
├── index.html          # メインHTMLファイル（軽量シェル）
├── css/
│   └── styles.css      # すべてのスタイル
├── js/
│   └── app.js          # メインアプリケーションロジック
├── data/
│   ├── config.json     # サイト全体設定
│   ├── categories.json # カテゴリ情報
│   ├── bookshelf.json  # 本棚/カリキュラムデータ
│   ├── slides.json     # スライドコンテンツ
│   ├── mountains.json  # 登頂チャレンジデータ
│   ├── badges.json     # バッジシステム
│   └── missions.json   # ミッションデータ
├── index.old.html      # 旧バージョン（バックアップ）
└── README.md           # このファイル
```

---

## 🔄 更新ガイド

### カテゴリを追加する場合

**ファイル:** `data/categories.json`

```json
{
  "id": "new_category",       // ユニークID（英数字）
  "name": "新カテゴリ",        // 表示名
  "emoji": "🆕",              // 絵文字
  "color": "#3b82f6",         // メインカラー
  "colorGradient": ["#3b82f6", "#1d4ed8"],  // グラデーション
  "description": "カテゴリの説明",
  "order": 12                 // 表示順
}
```

### スライドを追加する場合

**ファイル:** `data/slides.json`

```json
{
  "id": "new_slide",          // ユニークID
  "title": "新しいスライド",   // タイトル
  "emoji": "📝",              // 絵文字
  "category": "science",      // カテゴリID（categories.jsonと一致）
  "themeId": null,            // テーマID（オプション）
  "difficulty": 1,            // 難易度 1-3
  "reward": 10,               // ALT報酬
  "videoUrl": null,           // 動画URL（オプション）
  "qa": [                     // クイズ用Q&A
    { "q": "質問", "a": "答え" }
  ]
}
```

### 本棚（カリキュラム）を追加する場合

**ファイル:** `data/bookshelf.json`

```json
{
  "id": "shelf_id",
  "categoryId": "category_id",  // categories.jsonと一致
  "name": "本棚名",
  "emoji": "📚",
  "subcategories": [
    {
      "id": "sub_id",
      "name": "サブカテゴリ名",
      "emoji": "📖",
      "notebookUrl": null,     // NotebookLM URL（オプション）
      "themes": [
        { "id": "theme_id", "name": "テーマ名", "emoji": "📝" }
      ]
    }
  ]
}
```

### 山を追加する場合

**ファイル:** `data/mountains.json`

```json
{
  "id": "mountain_id",
  "name": "山名",
  "alt": 3000,                // 必要ALT
  "emoji": "🏔️",
  "badge": "🏔️",
  "certificate": "達成メッセージ"
}
```

### バッジを追加する場合

**ファイル:** `data/badges.json`

```json
{
  "id": "badge_id",
  "name": "バッジ名",
  "emoji": "🏅",
  "condition": {
    "type": "slideCount",     // 条件タイプ
    "count": 10               // 条件値
  }
}
```

### ミッションを追加する場合

**ファイル:** `data/missions.json`

**ファミリーミッション:**
```json
{
  "id": "fm_id",
  "name": "ミッション名",
  "emoji": "🎯",
  "reward": 20,
  "color": ["#ec4899", "#f472b6"]  // グラデーション色
}
```

**スポンサーミッション:**
```json
{
  "id": "sm_id",
  "name": "ミッション名",
  "emoji": "🎗️",
  "categoryEmoji": "🌱",
  "reward": 50,
  "sponsor": "スポンサー名",
  "slides": ["slide_id_1", "slide_id_2"]  // 関連スライドID
}
```

---

## 🎨 スタイル変更

**ファイル:** `css/styles.css`

### カラー変数
CSS変数は `:root` セクションで定義されています：

```css
:root {
  --summit: #1a2f4e;    /* メインカラー（濃紺） */
  --meadow: #2d8659;    /* 子ども用（緑） */
  --sunrise: #f0a050;   /* アクセント（オレンジ） */
  --sunset: #e85d45;    /* アクセント（赤） */
  --cloud: #e8eef4;     /* 背景色（薄青） */
  --rock: #64748b;      /* テキスト（グレー） */
  --premium: #9333ea;   /* プレミアム（紫） */
  --parent: #3b82f6;    /* 保護者用（青） */
  --teacher: #10b981;   /* 先生用（緑） */
  --admin: #dc2626;     /* 管理者用（赤） */
  --family: #ec4899;    /* ファミリー（ピンク） */
}
```

---

## ⚙️ 設定変更

**ファイル:** `data/config.json`

### 主な設定項目

| 項目 | 説明 |
|------|------|
| `site.name` | サイト名 |
| `theme.colors` | カラーテーマ |
| `grades` | 学年設定 |
| `regions` | 地域リスト |
| `gamification.dailyMission` | デイリーミッション設定 |
| `gamification.reactions` | リアクション絵文字 |
| `referral` | 紹介報酬設定 |
| `roles` | ユーザーロール設定 |

---

## 🚀 開発・デプロイ

### ローカルでテスト

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .
```

ブラウザで `http://localhost:8000` を開く

### 注意事項

1. **JSONファイルの編集後:** ブラウザをリロードするとデータが更新されます
2. **CORS:** ローカルファイルを直接開くとCORSエラーが発生します。必ずローカルサーバーを使用してください
3. **LocalStorage:** ユーザーデータはブラウザのLocalStorageに保存されます

---

## 📝 旧バージョンからの移行

旧バージョン（`index.old.html`）からデータを移行する場合：

1. LocalStorageのデータは自動的に引き継がれます
2. カスタムデータがある場合は、対応するJSONファイルに追加してください

---

## 🐛 トラブルシューティング

### データが読み込まれない

1. ローカルサーバーを使用しているか確認
2. ブラウザのコンソールでエラーを確認
3. JSONファイルの構文エラーをチェック

### スタイルが適用されない

1. `css/styles.css` のパスを確認
2. CSSの構文エラーをチェック

### 画面が真っ白

1. `js/app.js` のパスを確認
2. ブラウザのコンソールでJavaScriptエラーを確認
