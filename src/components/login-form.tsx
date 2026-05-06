"use client";

import { LockKeyhole, Mail, UserPlus } from "lucide-react";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("sign-in");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Supabaseの環境変数が未設定です。");
      setIsLoading(false);
      return;
    }

    const result =
      mode === "sign-in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

    setIsLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setMessage("確認メールを送信しました。メール内のリンクを開くと登録が完了します。");
      return;
    }

    window.location.href = "/";
  }

  async function handleMagicLink() {
    setIsLoading(true);
    setMessage("");

    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      setMessage("Supabaseの環境変数が未設定です。");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsLoading(false);
    setMessage(error ? error.message : "ログイン用リンクをメールに送信しました。");
  }

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#f3efe7] p-1">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "sign-in" ? "bg-[#e4572e] text-white" : "text-[#3c4941]"}`}
        >
          ログイン
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={`rounded-lg px-3 py-2 text-sm font-bold ${mode === "sign-up" ? "bg-[#e4572e] text-white" : "text-[#3c4941]"}`}
        >
          新規登録
        </button>
      </div>

      <label className="block">
        <span className="text-sm font-bold">メールアドレス</span>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#ded6ca] bg-[#f3efe7] px-3 py-3 outline-none"
          placeholder="you@example.com"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-bold">パスワード</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#ded6ca] bg-[#f3efe7] px-3 py-3 outline-none"
          placeholder="8文字以上"
          minLength={8}
          required
        />
      </label>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#e4572e] px-4 py-3 font-bold text-white disabled:opacity-60"
      >
        {mode === "sign-in" ? <LockKeyhole size={18} /> : <UserPlus size={18} />}
        {isLoading ? "処理中..." : mode === "sign-in" ? "ログインする" : "アカウントを作成"}
      </button>

      <button
        type="button"
        onClick={handleMagicLink}
        disabled={isLoading || !email}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#ded6ca] px-4 py-3 text-sm font-bold text-[#4e5b52] disabled:opacity-50"
      >
        <Mail size={18} />
        メールリンクでログイン
      </button>

      {message ? (
        <p className="rounded-lg bg-[#eef7ee] px-3 py-2 text-sm font-semibold text-[#4e5b52]">
          {message}
        </p>
      ) : null}
    </form>
  );
}
