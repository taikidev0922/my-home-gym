# マイホームジム

自宅にトレーニングスペースを作った人が、写真、広さ、費用、こだわり、器具リンク、SNSを共有できる Next.js プロトタイプです。閲覧はログインなし、投稿・お気に入り・フォロー・買い物リスト保存は会員登録後に使う想定です。

## Stack

- Next.js App Router
- Tailwind CSS
- Supabase Auth / Database / Storage
- Vercel deploy
- lucide-react icons

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Create a public storage bucket for post photos, for example `gym-post-images`.
4. Copy `.env.example` to `.env.local` and set the values.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

The current UI uses local sample data in `src/lib/gym-data.ts`. Replace that loader with Supabase queries when the project keys are ready.
