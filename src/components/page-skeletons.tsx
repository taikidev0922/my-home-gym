import { ChevronDown, Filter, Search, SlidersHorizontal, Tag, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

function StaticHomeFilters() {
  return (
    <aside className="mx-3 h-fit rounded-lg border border-[#cfd8cf] bg-white px-3 py-2 shadow-sm sm:mx-0 sm:p-4 lg:sticky lg:top-20">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Filter size={18} />
          検索条件
        </h2>
        <ChevronDown size={18} className="text-[#69756d] lg:hidden" />
        <SlidersHorizontal size={18} className="hidden text-[#69756d] lg:block" />
      </div>

      <div className="hidden lg:block">
        <label className="mt-5 block text-sm font-semibold" htmlFor="loading-keyword">
          キーワード
        </label>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-3 py-2">
          <Search size={17} className="text-[#69756d]" />
          <input
            id="loading-keyword"
            disabled
            placeholder="例: 賃貸OK / 防音"
            className="w-full bg-transparent text-sm outline-none disabled:opacity-100"
          />
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold">規模感</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {["すべて", "省スペース", "標準", "本格派"].map((label, index) => (
              <span
                key={label}
                className={`rounded-lg border px-3 py-2 text-center text-sm font-semibold ${
                  index === 0 ? "border-[#e4572e] bg-[#e4572e] text-white" : "border-[#cfd8cf] bg-white text-[#3c4941]"
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <StaticRange label="上限予算" value="上限なし" />
        <StaticRange label="上限の広さ" value="上限なし" />

        <div className="mt-5 rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-3 py-2 text-sm font-bold text-[#122018]">
          器具カテゴリ
        </div>

        <div className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e4572e] px-4 py-3 text-sm font-bold text-white shadow-sm">
          <Search size={17} />
          この条件で検索
        </div>

        <div className="mt-5 flex items-center justify-between rounded-lg bg-[#eef7ee] p-3 text-sm font-bold text-[#4e5b52]">
          <span className="flex items-center gap-2">
            <Trophy size={17} />
            器具ランキング
          </span>
        </div>
      </div>
    </aside>
  );
}

function StaticRange({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-5 block text-sm font-semibold">
      <span className="flex items-center justify-between">
        {label}
        <span className="font-bold text-[#e4572e]">{value}</span>
      </span>
      <div className="mt-3 h-1.5 rounded-full bg-[#e4572e]" />
    </div>
  );
}

export function HomeLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-4 pb-1 pt-2 sm:px-6 sm:pb-3 sm:pt-6">
        <div className="pb-1 sm:border-b sm:border-[#cfd8cf] sm:pb-5">
          <h1 className="text-2xl font-bold leading-tight tracking-normal sm:text-4xl">
            みんなでホームジムを共有しよう
          </h1>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-2 px-0 py-2 sm:gap-5 sm:px-6 sm:py-5 lg:grid-cols-[300px_1fr]">
        <StaticHomeFilters />
        <div className="min-w-0">
          <div className="mb-2 flex justify-between px-3 sm:mb-4 sm:px-0">
            <div>
              <h2 className="text-2xl font-bold">ホームジムを読み込み中</h2>
              <p className="mt-1 text-sm font-semibold text-[#69756d]">投稿一覧を取得しています</p>
            </div>
          </div>
          <PostGridSkeleton />
        </div>
      </section>
    </main>
  );
}

export function PostDetailLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SiteHeader showMobilePostButton={false} />
      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        <section className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.2fr)_420px]">
          <SkeletonLine className="aspect-square w-full sm:aspect-[4/3]" />
          <aside className="grid h-fit gap-3 sm:gap-4">
            <div className="rounded-lg border border-[#cfd8cf] bg-white p-4 sm:p-5">
              <div className="flex justify-between">
                <SkeletonLine className="h-8 w-24 bg-[#e4572e]/25" />
                <SkeletonLine className="h-5 w-20" />
              </div>
              <SkeletonLine className="mt-4 h-9 w-4/5" />
              <SkeletonLine className="mt-4 h-5 w-full" />
              <SkeletonLine className="mt-2 h-5 w-2/3" />
            </div>
            <SkeletonCard />
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

export function BlogListLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SiteHeader showMobilePostButton={false} />
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <section className="py-2 sm:py-3">
          <h1 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">ホームジムお助け記事</h1>
        </section>
        <section className="mt-4 hidden rounded-lg border border-[#cfd8cf] bg-white p-5 sm:block">
          <div className="flex items-center gap-2 text-sm font-bold text-[#69756d]">
            <Tag size={16} />
            記事を絞り込む
          </div>
          <div className="mt-4">
            <p className="text-sm font-bold text-[#122018]">カテゴリ</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["すべて", "作り方", "パワーラック", "可変式ダンベル", "ベンチ", "床材・防音", "省スペース"].map((label, index) => (
                <span
                  key={label}
                  className={
                    index === 0
                      ? "inline-flex items-center rounded-lg bg-[#e4572e] px-3 py-2 text-sm font-bold text-white"
                      : "inline-flex items-center rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-3 py-2 text-sm font-bold text-[#4e5b52]"
                  }
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>
        <div className="mt-4 grid gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <ArticleCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}

export function RankingsLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SiteHeader showMobilePostButton={false} />
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <section className="grid gap-2">
          <h1 className="text-3xl font-black leading-tight tracking-normal sm:text-5xl">
            カテゴリ別おすすめ商品
          </h1>
          <div className="rounded-lg border border-[#cfd8cf] bg-white p-3 shadow-sm sm:hidden">
            <div className="flex items-center justify-between text-sm font-bold text-[#122018]">
              <span className="flex items-center gap-2">
                <Trophy size={16} />
                カテゴリ別1位
              </span>
              <ChevronDown size={17} className="text-[#69756d]" />
            </div>
          </div>
          <div className="hidden rounded-lg border border-[#cfd8cf] bg-white p-4 shadow-sm sm:block sm:p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-[#69756d]">
              <Search size={16} />
              表示カテゴリ
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {["すべて", "パワーラック・スミス", "可変式ダンベル", "トレーニングベンチ"].map((label, index) => (
                <span
                  key={label}
                  className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                    index === 0
                      ? "border-[#e4572e] bg-[#e4572e] text-white"
                      : "border-[#cfd8cf] bg-[#f7f8f5] text-[#4e5b52]"
                  }`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 sm:mt-8">
          <div className="mb-3 flex flex-col justify-between gap-1 sm:mb-4 sm:flex-row sm:items-end sm:gap-2">
            <div>
              <p className="text-sm font-bold text-[#e4572e]">カテゴリ別1位</p>
              <h2 className="text-2xl font-bold">各カテゴリの1位</h2>
            </div>
            <p className="text-sm font-semibold text-[#69756d]">商品リンクを取得しています</p>
          </div>
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="grid overflow-hidden rounded-lg border border-[#cfd8cf] bg-white shadow-sm lg:grid-cols-[260px_1fr]"
              >
                <SkeletonLine className="min-h-64 rounded-none" />
                <div className="p-5">
                  <SkeletonLine className="h-5 w-28" />
                  <SkeletonLine className="mt-3 h-8 w-4/5" />
                  <SkeletonLine className="mt-4 h-5 w-full" />
                  <SkeletonLine className="mt-2 h-5 w-3/4" />
                  <SkeletonLine className="mt-5 h-20 w-full" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export function BlogArticleLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SiteHeader showMobilePostButton={false} />
      <div className="mx-auto max-w-4xl px-0 py-5 sm:px-6 sm:py-6">
        <article className="px-4 pb-8 pt-2 sm:rounded-lg sm:border sm:border-[#cfd8cf] sm:bg-white sm:p-8">
          <div className="flex gap-2">
            <SkeletonLine className="h-7 w-24" />
            <SkeletonLine className="h-7 w-32" />
          </div>
          <SkeletonLine className="mt-5 h-10 w-full sm:h-14" />
          <SkeletonLine className="mt-3 h-10 w-4/5 sm:h-14" />
          <SkeletonLine className="-mx-4 mt-6 aspect-video sm:mx-0 sm:rounded-lg" />
          <div className="mt-8 grid gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index}>
                <SkeletonLine className="h-8 w-2/3" />
                <SkeletonLine className="mt-4 h-5 w-full" />
                <SkeletonLine className="mt-2 h-5 w-full" />
                <SkeletonLine className="mt-2 h-5 w-5/6" />
              </div>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}

export function SubmitLoadingSkeleton() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]" aria-busy="true">
      <SiteHeader showMobilePostButton={false} />
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="rounded-lg border border-[#cfd8cf] bg-white p-5 shadow-sm sm:p-7">
          <SkeletonLine className="h-9 w-64" />
          <SkeletonLine className="mt-7 h-12 w-full" />
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <SkeletonLine className="h-20 w-full" />
            <SkeletonLine className="h-20 w-full" />
            <SkeletonLine className="h-20 w-full" />
          </div>
          <SkeletonLine className="mt-5 h-56 w-full" />
          <SkeletonLine className="mt-5 h-40 w-full" />
        </div>
      </div>
    </main>
  );
}

export function PostGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px bg-transparent sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden bg-white sm:rounded-lg sm:border sm:border-[#cfd8cf]">
          <SkeletonLine className="aspect-square rounded-none sm:aspect-[4/3]" />
          <div className="hidden p-4 sm:block">
            <SkeletonLine className="h-5 w-4/5" />
            <SkeletonLine className="mt-2 h-4 w-28" />
            <SkeletonLine className="mt-4 h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#cfd8cf] bg-white">
      <SkeletonLine className="aspect-video rounded-none" />
      <div className="p-4">
        <SkeletonLine className="h-6 w-20" />
        <SkeletonLine className="mt-3 h-7 w-full" />
        <SkeletonLine className="mt-2 h-7 w-4/5" />
        <SkeletonLine className="mt-4 h-4 w-full" />
      </div>
    </div>
  );
}

function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`rounded-lg border border-[#cfd8cf] bg-white p-4 shadow-sm ${className}`} />;
}

function SkeletonLine({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#dfe6dd] ${className}`} />;
}
