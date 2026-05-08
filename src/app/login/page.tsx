import { LoginForm } from "@/components/login-form";
import { SiteHeader } from "@/components/site-header";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ed] text-[#122018]">
      <SiteHeader showMobilePostButton={false} />
      <div className="grid min-h-[70vh] place-items-center px-4 py-6">
        <div className="w-full max-w-md rounded-lg border border-[#ded6ca] bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">ログイン</h1>
          <p className="mt-3 leading-7 text-[#4e5b52]">
            投稿、お気に入り、投稿者フォロー、買い物リスト保存にはアカウントが必要です。
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
