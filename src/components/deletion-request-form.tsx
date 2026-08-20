"use client";

import { Flag } from "lucide-react";
import { useState } from "react";

type DeletionRequestFormProps = {
  postId: string;
  title: string;
};

export function DeletionRequestForm({ postId, title }: DeletionRequestFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setMessage("申請理由を入力してください。");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const response = await fetch("/api/deletion-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, reason: trimmedReason, contact: contact.trim() }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error ?? "削除申請の送信に失敗しました。時間をおいて再度お試しください。");
      setIsSubmitting(false);
      return;
    }

    setIsDone(true);
    setIsSubmitting(false);
  }

  if (isDone) {
    return (
      <div className="rounded-lg border border-[#cfd8cf] bg-white p-4 text-sm font-semibold leading-6 text-[#4e5b52]">
        削除申請を受け付けました。運営が内容を確認し、対応します。
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7a817b] hover:text-[#c64322]"
      >
        <Flag size={14} />
        この投稿の削除を申請する
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-[#cfd8cf] bg-white p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-[#122018]">
        <Flag size={15} />
        「{title}」の削除申請
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-[#69756d]">
        自分が投稿したものを消したい場合や、不適切な内容を見つけた場合は理由を添えて申請してください。運営が確認のうえ削除します。
      </p>
      <label className="mt-3 block">
        <span className="text-sm font-bold">申請理由</span>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
          maxLength={1000}
          placeholder="例: 自分で投稿したものですが、削除したいです。"
          className="mt-2 min-h-24 w-full rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] p-3 text-sm outline-none"
        />
      </label>
      <label className="mt-3 block">
        <span className="text-sm font-bold">連絡先（任意）</span>
        <input
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          maxLength={200}
          placeholder="メールアドレスやSNSアカウントなど"
          className="mt-2 w-full rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-3 py-2.5 text-sm outline-none"
        />
      </label>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-[#c64322] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        >
          {isSubmitting ? "送信中..." : "削除を申請する"}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="rounded-lg border border-[#cfd8cf] bg-white px-4 py-2.5 text-sm font-bold text-[#4e5b52]"
        >
          キャンセル
        </button>
      </div>
      {message ? <p className="mt-3 text-sm font-bold text-[#c64322]">{message}</p> : null}
    </form>
  );
}
