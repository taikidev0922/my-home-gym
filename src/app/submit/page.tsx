import Link from "next/link";
import { ArrowLeft, ImagePlus, LinkIcon, LockKeyhole, Plus } from "lucide-react";

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ee] px-4 py-6 text-[#1f2522] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#516158]">
          <ArrowLeft size={17} />
          一覧に戻る
        </Link>
        <div className="mt-6 rounded-lg border border-black/10 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-[#e4572e]">
                <LockKeyhole size={16} />
                投稿には会員登録が必要
              </p>
              <h1 className="mt-2 text-3xl font-bold">ホームジムを投稿</h1>
            </div>
            <Link href="/login" className="inline-flex w-fit rounded-lg bg-[#18251f] px-4 py-3 text-sm font-bold text-white">
              ログインして投稿
            </Link>
          </div>

          <form className="mt-7 grid gap-5">
            <Field label="タイトル" placeholder="例: ガレージに作った本格パワーラック部屋" />
            <div className="grid gap-5 sm:grid-cols-3">
              <Field label="広さ" placeholder="12㎡" />
              <Field label="初期費用" placeholder="860000円" />
              <Field label="月額維持費" placeholder="2500円" />
            </div>
            <label className="block">
              <span className="text-sm font-bold">写真</span>
              <div className="mt-2 grid min-h-40 place-items-center rounded-lg border border-dashed border-black/20 bg-[#faf8f3] p-6 text-center">
                <ImagePlus className="mx-auto text-[#667168]" />
                <p className="mt-3 text-sm font-semibold text-[#667168]">複数写真アップロード用のエリア</p>
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-bold">こだわり・工夫</span>
              <textarea className="mt-2 min-h-32 w-full rounded-lg border border-black/10 bg-[#faf8f3] p-3 outline-none" placeholder="床補強、防音、収納、賃貸で気をつけたことなど" />
            </label>
            <div className="rounded-lg bg-[#edf3ea] p-4">
              <p className="flex items-center gap-2 font-bold">
                <LinkIcon size={18} />
                商品リンクとSNSリンク
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="商品名" placeholder="可変式ダンベル 24kg" />
                <Field label="購入URL" placeholder="https://..." />
                <Field label="Instagram" placeholder="https://instagram.com/..." />
                <Field label="YouTube / X" placeholder="https://..." />
              </div>
              <button type="button" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-black/15 px-3 py-2 text-sm font-bold">
                <Plus size={16} />
                商品を追加
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-sm font-bold">{label}</span>
      <input className="mt-2 w-full rounded-lg border border-black/10 bg-[#faf8f3] px-3 py-3 outline-none" placeholder={placeholder} />
    </label>
  );
}
