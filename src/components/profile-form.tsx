"use client";

import Image from "next/image";
import { ImagePlus, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileData } from "@/lib/gym-repository";

export function ProfileForm({
  userId,
  profile,
}: {
  userId: string;
  profile: ProfileData;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [avatarPreview, setAvatarPreview] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSaving(true);
    setMessage("");

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabaseの環境変数が未設定です。");
      setIsSaving(false);
      return;
    }

    const formData = new FormData(form);
    const avatarFile = formData.get("avatarFile");
    let nextAvatarUrl = avatarUrl;

    if (avatarFile instanceof File && avatarFile.size > 0) {
      const ext = avatarFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-avatars")
        .upload(path, avatarFile, { upsert: false });

      if (uploadError) {
        setMessage(uploadError.message);
        setIsSaving(false);
        return;
      }

      const { data } = supabase.storage.from("profile-avatars").getPublicUrl(path);
      nextAvatarUrl = data.publicUrl;
      setAvatarUrl(nextAvatarUrl);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview("");
      }
    }

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: String(formData.get("displayName") ?? ""),
      avatar_url: nextAvatarUrl,
      instagram_url: String(formData.get("instagramUrl") ?? ""),
      tiktok_url: String(formData.get("tiktokUrl") ?? ""),
      x_url: String(formData.get("xUrl") ?? ""),
    });

    setIsSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("プロフィールを保存しました。");
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Field name="displayName" label="表示名" defaultValue={profile.displayName} placeholder="Ken / Strength Log" />
      <label className="block">
        <span className="text-sm font-bold">アイコン画像</span>
        <div className="mt-2 flex flex-col gap-3 rounded-lg border border-[#ded6ca] bg-[#f3efe7] p-3 sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e4572e] text-xl font-bold text-white">
            {avatarPreview || avatarUrl ? (
              <Image src={avatarPreview || avatarUrl} alt={profile.displayName} width={64} height={64} className="h-full w-full object-cover" />
            ) : (
              profile.displayName.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#4e5b52]">
              <ImagePlus size={17} />
              画像をアップロード
            </div>
            <input name="avatarFile" type="file" accept="image/*" onChange={handleAvatarChange} className="mt-2 block w-full min-w-0 text-sm" />
          </div>
        </div>
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <Field name="instagramUrl" label="Instagram" defaultValue={profile.instagramUrl} placeholder="https://instagram.com/..." />
        <Field name="tiktokUrl" label="TikTok" defaultValue={profile.tiktokUrl} placeholder="https://www.tiktok.com/@..." />
        <Field name="xUrl" label="X" defaultValue={profile.xUrl} placeholder="https://x.com/..." />
      </div>
      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex w-fit items-center gap-2 rounded-lg bg-[#e4572e] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        <Save size={17} />
        {isSaving ? "保存中..." : "保存する"}
      </button>
      {message ? <p className="rounded-lg bg-[#eef7ee] px-3 py-2 text-sm font-semibold text-[#4e5b52]">{message}</p> : null}
    </form>
  );

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    const file = event.target.files?.[0];
    setAvatarPreview(file ? URL.createObjectURL(file) : "");
  }
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-lg border border-[#ded6ca] bg-[#f3efe7] px-3 py-3 outline-none"
        placeholder={placeholder}
      />
    </label>
  );
}
