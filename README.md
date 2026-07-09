# SPM メディカルカルテ

青山学院大学陸上部向けメディカルトレーナーカルテシステム。

## セットアップ

```bash
npm install
cp .env.local.example .env.local
# .env.local に必要な値を設定して npm run dev
```

## 環境変数

| 変数名 | 用途 |
| --- | --- |
| `NOTION_TOKEN` | Notion インテグレーションのシークレットトークン |
| `NOTION_MEMBERS_DATABASE_ID` | 部員DB（選手一覧の取得元） |
| `NOTION_MEDICAL_KARTE_DATABASE_ID` | メディカルカルテDB（本アプリのカルテ保存先） |
| `NOTION_RACE_RESULTS_DATABASE_ID` | 競技結果DB（選手ページのカレンダー・ログに大会結果を統合表示） |
| `NOTION_PERSONAL_KARTE_DATABASE_ID` | SPM カルテ記録（既存のフィジカルカルテ。選手ページのカレンダー・ログにパーソナルカルテを統合表示） |

いずれのDBも「部員」（競技結果DBは「選手名」）リレーションで部員DBと紐づいており、そのリレーションを使って選手ごとのレコードを横断的に取得しています。
