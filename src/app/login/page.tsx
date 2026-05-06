import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f3ed] px-4 text-[#122018]">
      <div className="w-full max-w-md rounded-lg border border-[#ded6ca] bg-white p-6 shadow-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#3c4941]">
          <ArrowLeft size={17} />
          一覧に戻る
        </Link>
        <h1 className="mt-6 text-3xl font-bold">ログイン</h1>
        <p className="mt-3 leading-7 text-[#4e5b52]">
          投稿、お気に入り、投稿者フォロー、買い物リスト保存にはアカウントが必要です。
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
