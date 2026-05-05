"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bookmark,
  Camera,
  Dumbbell,
  ExternalLink,
  Filter,
  Heart,
  Ruler,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useMemo, useState } from "react";
import { gymPosts, scaleLabels } from "@/lib/gym-data";
import type { GymScale, HomeGymPost } from "@/lib/types";

const scaleOptions: Array<"all" | GymScale> = ["all", "compact", "standard", "serious"];
const yen = new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function HomeGymExplorer() {
  const [query, setQuery] = useState("");
  const [scale, setScale] = useState<"all" | GymScale>("all");
  const [maxBudget, setMaxBudget] = useState(900000);
  const [maxArea, setMaxArea] = useState(15);
  const [notice, setNotice] = useState("");

  const filteredPosts = useMemo(() => {
    return gymPosts.filter((post) => {
      const haystack = [post.title, post.owner, post.location, post.summary, ...post.tags].join(" ");
      return (
        haystack.toLowerCase().includes(query.toLowerCase()) &&
        (scale === "all" || post.scale === scale) &&
        post.budget <= maxBudget &&
        post.areaSqm <= maxArea
      );
    });
  }, [maxArea, maxBudget, query, scale]);

  function requireLogin(action: string) {
    setNotice(`${action}には会員登録またはログインが必要です。`);
    window.setTimeout(() => setNotice(""), 2600);
  }

  return (
    <main className="min-h-screen bg-[#f6f3ee] text-[#1f2522]">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f6f3ee]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#18251f] text-white">
              <Dumbbell size={19} />
            </span>
            <span className="text-lg">マイホームジム</span>
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-[#4f5b54] md:flex">
            <a href="#feed">投稿を見る</a>
            <a href="#compare">比較</a>
            <a href="#submit">投稿する</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden rounded-lg border border-black/15 px-3 py-2 text-sm font-semibold sm:inline-flex">
              ログイン
            </Link>
            <Link href="/submit" className="inline-flex items-center gap-2 rounded-lg bg-[#e4572e] px-3 py-2 text-sm font-semibold text-white shadow-sm">
              <Camera size={16} />
              投稿
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pt-12">
        <div className="flex flex-col justify-center">
          <div className="mb-5 flex w-fit items-center gap-2 rounded-lg border border-[#d7cfc0] bg-white/70 px-3 py-2 text-sm font-semibold text-[#526057]">
            <Sparkles size={16} />
            予算・広さ・器具から探せるホームジム共有プラットフォーム
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
            家の広さに合う、現実的なトレーニング空間を見つける。
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#58645d] sm:text-lg">
            パワーラックの本格派から、ヨガマットだけのミニマル派まで。写真、費用、面積、こだわり、購入リンク、SNSをまとめて比較できます。
          </p>
          <div className="mt-7 grid grid-cols-3 gap-3">
            <Metric label="投稿例" value="4件" />
            <Metric label="予算帯" value="2.6万-86万円" />
            <Metric label="広さ" value="2.5-12㎡" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {gymPosts.slice(0, 3).map((post, index) => (
            <div key={post.id} className={index === 0 ? "sm:col-span-2" : ""}>
              <PhotoPreview post={post} tall={index === 0} />
            </div>
          ))}
        </div>
      </section>

      <section id="feed" className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-lg border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Filter size={18} />
              検索条件
            </h2>
            <SlidersHorizontal size={18} className="text-[#778178]" />
          </div>
          <label className="mt-5 block text-sm font-semibold" htmlFor="keyword">
            キーワード
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-black/10 bg-[#faf8f3] px-3 py-2">
            <Search size={17} className="text-[#717b73]" />
            <input
              id="keyword"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例: 賃貸OK / 防音"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>

          <div className="mt-5">
            <p className="text-sm font-semibold">規模感</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {scaleOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setScale(option)}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    scale === option ? "border-[#18251f] bg-[#18251f] text-white" : "border-black/10 bg-white text-[#526057]"
                  }`}
                >
                  {option === "all" ? "すべて" : scaleLabels[option]}
                </button>
              ))}
            </div>
          </div>

          <RangeField label="上限予算" value={maxBudget} min={20000} max={900000} step={10000} display={yen.format(maxBudget)} onChange={setMaxBudget} />
          <RangeField label="上限面積" value={maxArea} min={2} max={15} step={0.5} display={`${maxArea}㎡`} onChange={setMaxArea} />

          <div className="mt-5 rounded-lg bg-[#edf3ea] p-3 text-sm leading-6 text-[#405248]">
            お気に入り、投稿、商品リスト保存、投稿者フォローはログイン後に使える想定です。
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold text-[#6c766e]">検索結果</p>
              <h2 className="text-2xl font-bold">{filteredPosts.length}件のホームジム</h2>
            </div>
            {notice ? <div className="rounded-lg bg-[#18251f] px-4 py-2 text-sm font-semibold text-white">{notice}</div> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} onRequireLogin={requireLogin} />
            ))}
          </div>
        </div>
      </section>

      <section id="compare" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="rounded-lg border border-black/10 bg-[#18251f] p-5 text-white sm:p-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold text-[#b6c8bc]">追加すると便利な機能</p>
              <h2 className="mt-1 text-2xl font-bold">作りたい空間から逆算するAI比較</h2>
            </div>
            <Link href="/submit" className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-bold text-[#18251f]">
              自分のジムを投稿
              <ExternalLink size={16} />
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {["予算と広さで似た投稿を推薦", "商品リンクから買い物リスト化", "賃貸・戸建て・防音条件で比較", "SNSと実績を投稿者プロフィールに集約"].map((item) => (
              <div key={item} className="rounded-lg border border-white/15 bg-white/8 p-4 text-sm leading-6 text-[#e7eee9]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <p className="text-xs font-bold uppercase text-[#7a837b]">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function PhotoPreview({ post, tall }: { post: HomeGymPost; tall?: boolean }) {
  return (
    <Link href={`/posts/${post.slug}`} className={`group relative block overflow-hidden rounded-lg bg-black ${tall ? "h-72" : "h-48"}`}>
      <Image src={post.images[0]} alt={post.title} fill priority={tall} className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 50vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
      <div className="absolute bottom-0 p-4 text-white">
        <p className="text-xs font-bold">{scaleLabels[post.scale]} / {post.areaSqm}㎡</p>
        <h3 className="mt-1 text-lg font-bold">{post.title}</h3>
      </div>
    </Link>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="mt-5 block text-sm font-semibold">
      <span className="flex items-center justify-between">
        {label}
        <span className="font-bold text-[#e4572e]">{display}</span>
      </span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-[#e4572e]" />
    </label>
  );
}

function PostCard({ post, onRequireLogin }: { post: HomeGymPost; onRequireLogin: (action: string) => void }) {
  return (
    <article className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
      <Link href={`/posts/${post.slug}`} className="relative block aspect-[4/3] bg-[#d8d0c2]">
        <Image src={post.images[0]} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        <div className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-xs font-bold">{scaleLabels[post.scale]}</div>
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 text-xs font-bold text-white">写真 {post.images.length}枚</div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/posts/${post.slug}`} className="font-bold leading-6 hover:underline">
              {post.title}
            </Link>
            <p className="mt-1 text-sm text-[#657068]">{post.owner} / {post.location}</p>
          </div>
          <button type="button" onClick={() => onRequireLogin("お気に入り登録")} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-black/10" aria-label="お気に入り">
            <Bookmark size={18} />
          </button>
        </div>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#56625a]">{post.summary}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <Info icon={<Ruler size={15} />} label="広さ" value={`${post.areaSqm}㎡`} />
          <Info icon={<WalletCards size={15} />} label="費用" value={yen.format(post.budget)} />
          <Info icon={<Heart size={15} />} label="保存" value={`${post.saved}`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-lg bg-[#f0eee8] px-2 py-1 text-xs font-semibold text-[#536057]">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4">
          <button type="button" onClick={() => onRequireLogin("いいね")} className="inline-flex items-center gap-2 text-sm font-bold text-[#e4572e]">
            <Heart size={17} />
            {post.likes}
          </button>
          <a href={post.sns.instagram ?? post.sns.youtube ?? "#"} className="inline-flex items-center gap-2 text-sm font-bold text-[#37433c]">
            <Share2 size={17} />
            SNS
          </a>
        </div>
      </div>
    </article>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#faf8f3] p-2">
      <p className="flex items-center gap-1 text-xs text-[#7a837b]">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate font-bold">{value}</p>
    </div>
  );
}
