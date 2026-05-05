import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#090909] px-4 text-[#f4f4f5]">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-[#151515] p-6 shadow-sm">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#c8c8cc]">
          <ArrowLeft size={17} />
          一覧に戻る
        </Link>
        <h1 className="mt-6 text-3xl font-bold">ログイン</h1>
        <p className="mt-3 leading-7 text-[#d4d4d8]">
          投稿、お気に入り、投稿者フォロー、買い物リスト保存にはアカウントが必要です。
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
