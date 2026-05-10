"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Tags, X } from "lucide-react";
import { useState } from "react";
import { productCategoryLabels } from "@/lib/product-rankings";
import type { ProductCategory } from "@/lib/types";

const gearCategories: ProductCategory[] = [
  "power-rack",
  "adjustable-dumbbell",
  "bench",
  "floor-mat",
  "mirror",
  "pull-up-stand",
  "multi-home-gym",
  "cardio",
  "compact-gym",
  "accessory",
];

export function SubmitForm() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSaving(true);
    setMessage("");

    const formData = new FormData(form);
    formData.set("tags", JSON.stringify([...tags, ...splitTags(tagInput)]));
    formData.set("categories", JSON.stringify(selectedCategories));
    formData.set("thumbnailIndex", String(thumbnailIndex));

    const response = await fetch("/api/posts", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setMessage(result?.error ?? "投稿の保存に失敗しました。");
      setIsSaving(false);
      return;
    }

    form.reset();
    setSelectedCategories([]);
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setImagePreviews([]);
    setThumbnailIndex(0);
    setTagInput("");
    setTags([]);
    setMessage("投稿を保存しました。一覧に公開されます。");
    setIsSaving(false);
    router.refresh();
    router.push("/");
  }

  return (
    <form className="mt-7 grid min-w-0 gap-5" onSubmit={handleSubmit}>
      <Field name="title" label="タイトル" placeholder="例: ガレージに作った本格パワーラック部屋" required />

      <div className="grid min-w-0 gap-5 md:grid-cols-3">
        <label className="block min-w-0">
          <span className="text-sm font-bold">広さ</span>
          <div className="mt-2 flex min-w-0 overflow-hidden rounded-lg border border-[#cfd8cf] bg-[#f7f8f5]">
            <input
              name="areaTatami"
              type="number"
              min="0"
              step="0.1"
              required
              className="min-w-0 flex-1 bg-transparent px-3 py-3 outline-none"
              placeholder="7.5"
            />
            <span className="grid w-16 shrink-0 place-items-center border-l border-[#cfd8cf] bg-white text-sm font-bold">畳</span>
          </div>
        </label>
        <Field name="budget" label="初期費用" placeholder="860000" type="number" required />
        <label className="block min-w-0">
          <span className="text-sm font-bold">規模感</span>
          <select name="scale" className="mt-2 w-full rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-3 py-3 outline-none">
            <option value="compact">コンパクト</option>
            <option value="standard">標準</option>
            <option value="serious">本格派</option>
          </select>
        </label>
      </div>

      <div className="block min-w-0">
        <span className="text-sm font-bold">写真</span>
        <div className="mt-2 rounded-lg border border-dashed border-[#c4cec4] bg-[#f7f8f5] p-4 sm:p-6">
          {imagePreviews.length ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {imagePreviews.map((preview, index) => (
                <label
                  key={preview}
                  className={`overflow-hidden rounded-lg border bg-white shadow-sm ${
                    thumbnailIndex === index ? "border-[#e4572e] ring-2 ring-[#e4572e]/25" : "border-[#cfd8cf]"
                  }`}
                >
                  <span className="relative block aspect-[4/3]">
                    <Image src={preview} alt={`選択した写真 ${index + 1}`} fill className="object-cover" sizes="(max-width: 640px) 100vw, 260px" />
                    {thumbnailIndex === index ? (
                      <span className="absolute left-2 top-2 rounded-lg bg-[#e4572e] px-2 py-1 text-xs font-bold text-white">
                        サムネイル
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-[#4e5b52]">
                    <input
                      type="radio"
                      name="thumbnailPreview"
                      checked={thumbnailIndex === index}
                      onChange={() => setThumbnailIndex(index)}
                      className="accent-[#e4572e]"
                    />
                    この画像をサムネイルにする
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm font-semibold text-[#69756d]">
              <ImagePlus className="shrink-0" />
              <span>写真を選択するとここにプレビューが表示されます。</span>
            </div>
          )}
          <input name="images" type="file" accept="image/*" multiple onChange={handleImageChange} className="mt-4 block w-full min-w-0 text-sm" />
        </div>
      </div>

      <TextArea
        name="description"
        label="説明"
        placeholder="どんな空間か、使っている器具、床材や防音の工夫、気に入っている点などをまとめて書いてください。"
        required
      />
      <TagInput tags={tags} value={tagInput} onChange={setTagInput} onTagsChange={setTags} />

      <div className="min-w-0 rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] p-3 sm:p-4">
        <p className="flex items-center gap-2 font-bold">
          <Tags size={18} />
          器具カテゴリ
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {gearCategories.map((category) => (
            <label
              key={category}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-3 py-3 text-sm font-semibold text-[#4e5b52]"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => toggleCategory(category)}
                className="h-4 w-4 accent-[#e4572e]"
              />
              {productCategoryLabels[category]}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" disabled={isSaving} className="rounded-lg bg-[#e4572e] px-4 py-3 font-bold text-white disabled:opacity-60">
        {isSaving ? "保存中..." : "投稿を保存"}
      </button>
      {message ? <p className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#4e5b52]">{message}</p> : null}
    </form>
  );
  function toggleCategory(category: ProductCategory) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    const previews = Array.from(event.target.files ?? []).map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
    setThumbnailIndex(0);
  }
}

function TagInput({
  tags,
  value,
  onChange,
  onTagsChange,
}: {
  tags: string[];
  value: string;
  onChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
}) {
  function commit(rawValue = value) {
    const nextTags = splitTags(rawValue);
    if (!nextTags.length) return;

    onTagsChange(Array.from(new Set([...tags, ...nextTags])));
    onChange("");
  }

  function removeTag(tag: string) {
    onTagsChange(tags.filter((item) => item !== tag));
  }

  return (
    <label className="block min-w-0">
      <span className="text-sm font-bold">タグ</span>
      <div className="mt-2 rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-3 py-2">
        {tags.length ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-sm font-bold text-[#4e5b52]">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label={`${tag}を削除`} className="rounded-full text-[#69756d] hover:text-[#122018]">
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <input
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            if (/[,、\s]$/.test(nextValue)) {
              commit(nextValue);
            } else {
              onChange(nextValue);
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
          onBlur={() => commit()}
          className="w-full min-w-0 bg-transparent py-1 outline-none"
          placeholder="賃貸OK, 防音, パワーラック"
        />
      </div>
    </label>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-bold">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full min-w-0 rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-3 py-3 outline-none"
        placeholder={placeholder}
      />
    </label>
  );
}

function TextArea({ name, label, placeholder, required = false }: { name: string; label: string; placeholder: string; required?: boolean }) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-bold">{label}</span>
      <textarea name={name} required={required} className="mt-2 min-h-40 w-full min-w-0 rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] p-3 outline-none" placeholder={placeholder} />
    </label>
  );
}

function splitTags(value: string) {
  return value
    .split(/[,\s、]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
