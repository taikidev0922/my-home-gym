import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f3ee] px-4 text-[#1f2522]">
      <div className="w-full max-w-md rounded-lg border border-black/10 bg-white p-6 shadow-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#516158]">
          <ArrowLeft size={17} />
          一覧に戻る
        </Link>
        <h1 className="mt-6 text-3xl font-bold">ログイン</h1>
        <p className="mt-3 leading-7 text-[#5f6c64]">
          投稿、お気に入り、投稿者フォロー、買い物リスト保存にはアカウントが必要です。
        </p>
        <form className="mt-6 grid gap-4">
          <label className="block">
            <span className="text-sm font-bold">メールアドレス</span>
            <input type="email" className="mt-2 w-full rounded-lg border border-black/10 bg-[#faf8f3] px-3 py-3 outline-none" placeholder="you@example.com" />
          </label>
          <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#18251f] px-4 py-3 font-bold text-white">
            <Mail size={18} />
            Supabase Authで続ける
          </button>
        </form>
      </div>
    </main>
  );
}
