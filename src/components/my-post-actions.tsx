"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

type MyPostActionsProps = {
  postId: string;
  slug: string;
  title: string;
};

export function MyPostActions({ postId, slug, title }: MyPostActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    if (isDeleting) return;

    const ok = window.confirm(`「${title}」を削除します。よろしいですか？`);
    if (!ok) return;

    setIsDeleting(true);
    setMessage("");

    const response = await fetch(`/api/posts/${postId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setMessage(result?.error ?? "削除に失敗しました。");
      setIsDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Link
        href={`/posts/${encodeURIComponent(slug)}/edit`}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#cfd8cf] bg-white px-3 text-xs font-bold text-[#4e5b52] hover:border-[#e4572e] hover:text-[#e4572e]"
      >
        <Pencil size={14} />
        編集
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#f0c7bd] bg-[#fff6f3] px-3 text-xs font-bold text-[#c64322] disabled:opacity-60"
      >
        <Trash2 size={14} />
        {isDeleting ? "削除中..." : "削除"}
      </button>
      {message ? <p className="basis-full text-xs font-bold text-[#c64322]">{message}</p> : null}
    </div>
  );
}
