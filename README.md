# Caption Copilot

Instagram フィード投稿向けのキャプション生成ツール。

## 機能

- 投稿テーマ・伝えたい内容を入力
- 投稿目的（保存狙い / 共感狙い / コメント狙い / 新規向け）を選択
- 世界観設定（よく使う言葉 / 避けたい言葉 / 口調 / 絵文字）を設定
- 冒頭フック 5案 / 本文 3案 / CTA 3案 を生成
- ハッシュタグ方針とNGポイントを提示
- ワンクリックコピー機能

## 技術スタック

- [Next.js 15](https://nextjs.org/) (App Router)
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript

## ローカル起動

```bash
# 依存パッケージのインストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く。

## Vercel デプロイ

```bash
# Vercel CLI でデプロイ
npx vercel
```

または GitHub リポジトリを Vercel に連携してプッシュ時に自動デプロイ。

## 今後の拡張

- Claude API を使ったAI生成への切り替え（`lib/generate.ts` を差し替えるだけ）
- ハッシュタグ自動生成
- 生成履歴の保存
