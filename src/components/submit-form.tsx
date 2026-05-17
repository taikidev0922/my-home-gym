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

const maxWebpImageBytes = 1_800_000;
const maxPostImageCount = 5;

type UploadedPostImage = {
  publicUrl: string;
};

export function SubmitForm() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [thumbnailIndex, setThumbnailIndex] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isConvertingImages, setIsConvertingImages] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSaving(true);
    setMessage("");

    const formData = new FormData(form);
    formData.delete("images");
    formData.set("tags", JSON.stringify([...tags, ...splitTags(tagInput)]));
    formData.set("categories", JSON.stringify(selectedCategories));
    formData.set("thumbnailIndex", String(thumbnailIndex));

    if (!selectedImages.length) {
      setMessage("写真を選択してください。");
      setIsSaving(false);
      return;
    }

    let convertedImages: File[];
    try {
      setIsConvertingImages(true);
      setMessage("画像を高画質WebPに変換しています...");
      const targetBytes = getTargetWebpSize();
      convertedImages = await Promise.all(selectedImages.map((file) => convertImageToWebp(file, targetBytes)));
    } catch (error) {
      console.error("Failed to convert images to WebP", error);
      setMessage("画像をWebPに変換できませんでした。別の写真を選択してください。");
      setIsConvertingImages(false);
      setIsSaving(false);
      return;
    }

    let uploadedImages: UploadedPostImage[];
    try {
      setIsConvertingImages(false);
      setMessage("画像をアップロードしています...");
      uploadedImages = await uploadPostImages(convertedImages);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "画像のアップロードに失敗しました。");
      setIsConvertingImages(false);
      setIsSaving(false);
      return;
    }

    formData.set("uploadedImages", JSON.stringify(uploadedImages));

    const response = await fetch("/api/posts", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setMessage(createSubmitErrorMessage(response.status, result?.error));
      setIsConvertingImages(false);
      setIsSaving(false);
      return;
    }

    form.reset();
    setSelectedCategories([]);
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setSelectedImages([]);
    setImagePreviews([]);
    setThumbnailIndex(0);
    setTagInput("");
    setTags([]);
    setMessage("投稿を保存しました。一覧に公開されます。");
    setIsConvertingImages(false);
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
            <label
              htmlFor="gym-post-images"
              className="flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#aebaae] bg-white px-4 py-8 text-center transition hover:border-[#e4572e] hover:bg-[#fff8f4]"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e4572e] text-white">
                <ImagePlus size={24} />
              </span>
              <span className="text-base font-bold text-[#122018]">写真を選ぶ</span>
              <span className="text-sm font-semibold leading-6 text-[#69756d]">最大5枚まで選べます。</span>
            </label>
          )}
          <input id="gym-post-images" name="images" type="file" accept="image/*" multiple onChange={handleImageChange} disabled={isSaving} className="sr-only" />
          {imagePreviews.length ? (
            <label
              htmlFor="gym-post-images"
              className="mt-4 inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#cfd8cf] bg-white px-4 py-2 text-sm font-bold text-[#122018] transition hover:border-[#e4572e] hover:text-[#e4572e]"
            >
              <ImagePlus size={17} />
              写真を変更
            </label>
          ) : null}
          {selectedImages.length ? (
            <p className="mt-3 text-sm font-semibold text-[#4e5b52]">選択中: {selectedImages.length}枚 / {formatFileSize(sumFileSizes(selectedImages))}</p>
          ) : null}
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
        {isConvertingImages ? "画像変換中..." : isSaving ? "保存中..." : "投稿を保存"}
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

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    imagePreviews.forEach((preview) => URL.revokeObjectURL(preview));
    setSelectedImages([]);
    setImagePreviews([]);
    setThumbnailIndex(0);
    setMessage("");

    const allFiles = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    const files = allFiles.slice(0, maxPostImageCount);
    if (!files.length) return;

    if (allFiles.length > maxPostImageCount) {
      setMessage(`写真は最大${maxPostImageCount}枚まで投稿できます。先頭${maxPostImageCount}枚を使います。`);
    }

    setSelectedImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
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
  onTagsChange: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  function commit(rawValue = value) {
    const nextTags = splitTags(rawValue);
    if (!nextTags.length) return;

    onTagsChange((current) => Array.from(new Set([...current, ...nextTags])));
    onChange("");
  }

  function removeTag(tag: string) {
    onTagsChange((current) => current.filter((item) => item !== tag));
  }

  return (
    <div className="block min-w-0">
      <span className="text-sm font-bold">タグ</span>
      <div className="mt-2 rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-3 py-2">
        {tags.length ? (
          <div className="mb-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-sm font-bold text-[#4e5b52]">
                {tag}
                <button
                  type="button"
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => removeTag(tag)}
                  aria-label={`${tag}を削除`}
                  className="rounded-full text-[#69756d] hover:text-[#122018]"
                >
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
    </div>
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

async function convertImageToWebp(file: File, targetBytes: number) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");

  try {
    let bestFallback: Blob | null = null;
    let bestCandidate: { blob: Blob; score: number } | null = null;

    for (const maxSize of [2200, 2000, 1800, 1600, 1400, 1200]) {
      resizeCanvas(canvas, bitmap, maxSize);

      for (const quality of [0.9, 0.86, 0.82, 0.78, 0.74, 0.7, 0.64]) {
        const blob = await canvasToWebpBlob(canvas, quality);
        if (!bestFallback || blob.size < bestFallback.size) {
          bestFallback = blob;
        }

        if (blob.size <= targetBytes) {
          const score = canvas.width * canvas.height * quality;
          if (!bestCandidate || score > bestCandidate.score) {
            bestCandidate = { blob, score };
          }
        }
      }
    }

    if (bestCandidate) {
      return createWebpFile(file.name, bestCandidate.blob);
    }

    if (bestFallback) {
      return createWebpFile(file.name, bestFallback);
    }

    throw new Error("WebP conversion failed.");
  } finally {
    bitmap.close();
  }
}

function resizeCanvas(canvas: HTMLCanvasElement, bitmap: ImageBitmap, maxSize: number) {
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
}

async function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/webp", quality);
  });

  if (!blob) {
    throw new Error("WebP conversion failed.");
  }

  return blob;
}

function createWebpFile(originalName: string, blob: Blob) {
  return new File([blob], `${stripFileExtension(originalName)}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

function getTargetWebpSize() {
  return maxWebpImageBytes;
}

function stripFileExtension(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") || "image";
}

function sumFileSizes(files: File[]) {
  return files.reduce((total, file) => total + file.size, 0);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString("ja-JP")}KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function createSubmitErrorMessage(status: number, serverMessage?: string) {
  if (serverMessage) return serverMessage;
  if (status === 413) return "写真の容量が大きすぎます。別の写真を選ぶか、少し時間をおいて再度お試しください。";
  if (status === 401) return "投稿にはログインが必要です。もう一度ログインしてください。";

  return `投稿の保存に失敗しました。時間をおいて再度お試しください。(${status})`;
}

async function uploadPostImages(files: File[]) {
  const uploadedImages: UploadedPostImage[] = [];

  for (const file of files) {
    const formData = new FormData();
    formData.set("image", file);

    const response = await fetch("/api/post-images", {
      method: "POST",
      body: formData,
    });
    const result = (await response.json().catch(() => null)) as { publicUrl?: string; error?: string } | null;

    if (!response.ok || !result?.publicUrl) {
      throw new Error(result?.error ?? createImageUploadErrorMessage(response.status));
    }

    uploadedImages.push({ publicUrl: result.publicUrl });
  }

  return uploadedImages;
}

function createImageUploadErrorMessage(status: number) {
  if (status === 413) return "画像の容量が大きすぎます。別の写真を選ぶか、少し時間をおいて再度お試しください。";
  if (status === 401) return "画像のアップロードにはログインが必要です。もう一度ログインしてください。";

  return `画像のアップロードに失敗しました。(${status})`;
}
