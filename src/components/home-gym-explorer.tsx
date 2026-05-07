"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Bookmark,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  ExternalLink,
  Filter,
  Heart,
  LayoutGrid,
  LayoutList,
  Menu,
  Ruler,
  Search,
  SlidersHorizontal,
  Trophy,
  WalletCards,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { formatTatami } from "@/lib/area";
import { scaleLabels } from "@/lib/gym-data";
import type { PostSearchFilters } from "@/lib/gym-repository";
import { productCategoryLabels } from "@/lib/product-rankings";
import type { GymScale, HomeGymPost, ProductCategory } from "@/lib/types";

type CurrentUser = {
  email: string;
  name: string;
  avatarUrl: string;
} | null;

const scaleOptions: Array<"all" | GymScale> = ["all", "compact", "standard", "serious"];
type ViewMode = "detail" | "photo";
const BUDGET_FILTER_MAX = 900000;
const AREA_FILTER_MAX = 12;
const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const categoryFilters = (Object.keys(productCategoryLabels) as ProductCategory[]).map((category) => ({
  id: category,
  label: productCategoryLabels[category],
}));

export function HomeGymExplorer({
  posts,
  totalPosts,
  page,
  perPage,
  currentUser,
  initialFilters,
}: {
  posts: HomeGymPost[];
  totalPosts: number;
  page: number;
  perPage: number;
  currentUser: CurrentUser;
  initialFilters: PostSearchFilters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialFilters.query ?? "");
  const [scale, setScale] = useState<"all" | GymScale>(initialFilters.scale ?? "all");
  const [maxBudget, setMaxBudget] = useState(initialFilters.maxBudget ?? BUDGET_FILTER_MAX);
  const [maxArea, setMaxArea] = useState(initialFilters.maxArea ?? AREA_FILTER_MAX);
  const [selectedGear, setSelectedGear] = useState<string[]>(initialFilters.categories ?? []);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(Boolean(initialFilters.categories?.length));
  const [viewMode, setViewMode] = useState<ViewMode>("detail");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [isSearchPending, startSearchTransition] = useTransition();
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const searchRequestedRef = useRef(false);
  const totalPages = Math.max(1, Math.ceil(totalPosts / perPage));
  const startIndex = totalPosts === 0 ? 0 : (page - 1) * perPage + 1;
  const endIndex = Math.min(totalPosts, page * perPage);
  const isSearching = isSearchPending || isSearchLoading;

  useEffect(() => {
    if (!isSearchPending && searchRequestedRef.current) {
      searchRequestedRef.current = false;
      setIsSearchLoading(false);
      setIsFilterOpen(false);
    }
  }, [isSearchPending, posts, searchParams, totalPosts]);

  function toggleGear(id: string) {
    setSelectedGear((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  function requireLogin(action: string) {
    if (currentUser) {
      setNotice(`${action}しました。`);
    } else {
      setNotice(`${action}には会員登録またはログインが必要です。`);
    }
    window.setTimeout(() => setNotice(""), 2600);
  }

  function handleSubmitNav(event: React.MouseEvent<HTMLAnchorElement>) {
    if (currentUser) return;

    event.preventDefault();
    setNotice("投稿には会員登録またはログインが必要です。先にアカウントを作成してください。");
    window.setTimeout(() => setNotice(""), 3200);
  }

  function handleSearch() {
    if (isSearching) return;

    const params = buildSearchParams();
    const search = params.toString();
    searchRequestedRef.current = true;
    setIsSearchLoading(true);
    setIsFilterOpen(false);
    startSearchTransition(() => {
      router.push(search ? `/?${search}#feed` : "/#feed");
    });
  }

  function handlePageChange(nextPage: number) {
    const params = buildSearchParams(nextPage);
    const search = params.toString();
    router.push(search ? `/?${search}#feed` : "/#feed");
  }

  function buildSearchParams(nextPage?: number) {
    const params = new URLSearchParams();
    const trimmedQuery = query.trim();

    if (trimmedQuery) params.set("q", trimmedQuery);
    if (scale !== "all") params.set("scale", scale);
    if (maxBudget < BUDGET_FILTER_MAX) params.set("budget", String(maxBudget));
    if (maxArea < AREA_FILTER_MAX) params.set("area", String(maxArea));
    if (selectedGear.length) params.set("categories", selectedGear.join(","));
    if (nextPage && nextPage > 1) params.set("page", String(nextPage));
    if (perPage !== 12) params.set("perPage", String(perPage));

    return params;
  }

  return (
    <main className="min-h-screen bg-[#f7f3ed] text-[#122018]">
      <header className="sticky top-0 z-30 border-b border-[#ded6ca] bg-[#f7f3ed]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e4572e] text-white">
                <Dumbbell size={19} />
              </span>
              <span className="truncate text-lg">マイホームジム</span>
            </Link>
          </div>
          <nav className="hidden items-center gap-5 text-sm font-medium text-[#3c4941] md:flex">
            <a href="#feed">みんなのホームジム</a>
            <Link href="/rankings">器具ランキング</Link>
            <Link href="/blog">ホームジムお助け記事</Link>
          </nav>
          <div className="flex items-center gap-2">
            {currentUser ? (
              <Link
                href="/me"
                aria-label="マイページ"
                title="マイページ"
                className="flex items-center rounded-full"
              >
                <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#e4572e] text-sm font-bold text-white ring-1 ring-[#d8d0c4]">
                  {currentUser.avatarUrl ? (
                    <Image
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    currentUser.name.slice(0, 1).toUpperCase()
                  )}
                </span>
              </Link>
            ) : (
              <Link href="/login" className="hidden rounded-lg border border-[#d8d0c4] px-3 py-2 text-sm font-semibold sm:inline-flex">
                ログイン
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsMenuOpen((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-[#ded6ca] bg-white text-[#122018] md:hidden"
              aria-label="メニュー"
              aria-expanded={isMenuOpen}
            >
              <Menu size={20} />
            </button>
            <Link href="/submit" onClick={handleSubmitNav} className="hidden items-center gap-2 rounded-lg bg-[#e4572e] px-3 py-2 text-sm font-semibold text-white shadow-sm sm:inline-flex">
              <Camera size={16} />
              投稿
            </Link>
          </div>
        </div>
        {isMenuOpen ? (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] md:hidden"
              aria-label="メニューを閉じる"
              onClick={() => setIsMenuOpen(false)}
            />
            <nav className="fixed right-4 top-16 z-50 grid w-[min(280px,calc(100vw-2rem))] gap-1 rounded-2xl border border-[#ded6ca] bg-white p-2 text-sm font-bold text-[#4e5b52] shadow-2xl shadow-black/25 md:hidden">
            <a href="#feed" onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-2 hover:bg-[#f3efe7]">
              みんなのホームジム
            </a>
            <Link href="/rankings" className="rounded-lg px-3 py-2 hover:bg-[#f3efe7]">
              器具ランキング
            </Link>
            <Link href="/blog" className="rounded-lg px-3 py-2 hover:bg-[#f3efe7]">
              ホームジムお助け記事
            </Link>
            </nav>
          </>
        ) : null}
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-1 pt-2 sm:px-6 sm:pb-3 sm:pt-6">
        <div className="pb-1 sm:border-b sm:border-[#ded6ca] sm:pb-5">
          <nav className="hidden">
            <a href="#feed" className="shrink-0 whitespace-nowrap rounded-lg bg-[#e4572e] px-2.5 py-2 text-center text-[11px] font-bold leading-none text-white">
              みんなのホームジム
            </a>
            <Link href="/rankings" className="shrink-0 whitespace-nowrap rounded-lg border border-[#ded6ca] bg-white px-2.5 py-2 text-center text-[11px] font-bold leading-none text-[#4e5b52]">
              器具ランキング
            </Link>
            <Link href="/blog" className="shrink-0 whitespace-nowrap rounded-lg border border-[#ded6ca] bg-white px-2.5 py-2 text-center text-[11px] font-bold leading-none text-[#4e5b52]">
              ホームジムお助け記事
            </Link>
          </nav>
          <h1 className="text-2xl font-bold leading-tight tracking-normal sm:text-4xl">
            みんなでホームジムを共有しよう
          </h1>
        </div>
      </section>

      <section id="feed" className="mx-auto grid max-w-7xl gap-3 px-4 py-3 sm:gap-5 sm:px-6 sm:py-5 lg:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-lg border border-[#ded6ca] bg-white px-3 py-2 shadow-sm sm:p-4 lg:sticky lg:top-20">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold">
              <Filter size={18} />
              検索条件
            </h2>
            <button
              type="button"
              onClick={() => setIsFilterOpen((value) => !value)}
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#ded6ca] text-[#3c4941] lg:hidden"
              aria-expanded={isFilterOpen}
              aria-label="検索条件を開閉"
            >
              <ChevronDown
                size={18}
                className={`transition ${isFilterOpen ? "rotate-180" : ""}`}
              />
            </button>
            <SlidersHorizontal size={18} className="hidden text-[#69756d] lg:block" />
          </div>

          <div className={`${isFilterOpen ? "block" : "hidden"} lg:block`}>
            <label className="mt-5 block text-sm font-semibold" htmlFor="keyword">
              キーワード
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#ded6ca] bg-[#f3efe7] px-3 py-2">
              <Search size={17} className="text-[#69756d]" />
              <input
                id="keyword"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSearch();
                  }
                }}
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
                      scale === option ? "border-[#e4572e] bg-[#e4572e] text-white" : "border-[#ded6ca] bg-white text-[#3c4941]"
                    }`}
                  >
                    {option === "all" ? "すべて" : scaleLabels[option]}
                  </button>
                ))}
              </div>
            </div>

            <RangeField
              label="上限予算"
              value={maxBudget}
              min={20000}
              max={BUDGET_FILTER_MAX}
              step={10000}
              display={maxBudget >= BUDGET_FILTER_MAX ? "上限なし" : yen.format(maxBudget)}
              onChange={setMaxBudget}
            />
            <RangeField
              label="上限の広さ"
              value={maxArea}
              min={1}
              max={AREA_FILTER_MAX}
              step={0.5}
              display={maxArea >= AREA_FILTER_MAX ? "上限なし" : `${maxArea}畳`}
              onChange={setMaxArea}
            />

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setIsCategoryOpen((value) => !value)}
                className="flex w-full items-center justify-between rounded-lg border border-[#ded6ca] bg-[#f3efe7] px-3 py-2 text-sm font-bold text-[#122018]"
                aria-expanded={isCategoryOpen}
              >
                <span>
                  器具カテゴリ
                  {selectedGear.length ? (
                    <span className="ml-2 text-xs font-bold text-[#e4572e]">{selectedGear.length}件選択中</span>
                  ) : null}
                </span>
                <ChevronDown
                  size={17}
                  className={`text-[#69756d] transition ${isCategoryOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isCategoryOpen ? (
                <div className="mt-2 grid gap-2">
                  {categoryFilters.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-start gap-2 rounded-lg border border-[#ded6ca] bg-[#f3efe7] px-3 py-2 text-sm font-semibold text-[#4e5b52]"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGear.includes(item.id)}
                        onChange={() => toggleGear(item.id)}
                        className="mt-0.5 h-4 w-4 accent-[#e4572e]"
                      />
                      <span>
                        <span className="block leading-5">{item.label}</span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#e4572e] px-4 py-3 text-sm font-bold text-transparent shadow-sm transition hover:bg-[#f05f35] disabled:cursor-wait disabled:opacity-80"
            >
              {isSearching ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-transparent" />
              ) : (
                <Search size={17} className="text-white" />
              )}
              <span className="absolute inset-0 inline-flex items-center justify-center gap-2 text-white">
                {isSearching ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  <Search size={17} />
                )}
                {isSearching ? "検索中..." : "この条件で検索"}
              </span>
              この条件で検索
            </button>

            <Link href="/rankings" className="mt-5 flex items-center justify-between rounded-lg bg-[#eef7ee] p-3 text-sm font-bold text-[#4e5b52]">
              <span className="flex items-center gap-2">
                <Trophy size={17} />
                器具ランキング
              </span>
              <ExternalLink size={15} />
            </Link>
          </div>
        </aside>

        <div>
          <div className="mb-3 flex flex-col justify-between gap-2 sm:mb-4 sm:flex-row sm:items-end sm:gap-3">
            <div className="hidden sm:block">
              <h2 className="text-2xl font-bold">{totalPosts}件のホームジム</h2>
              {totalPosts > 0 ? (
                <p className="mt-1 text-sm font-semibold text-[#69756d]">
                  {startIndex}-{endIndex}件を表示中
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <div className="inline-flex bg-transparent p-0 sm:rounded-lg sm:border sm:border-[#ded6ca] sm:bg-white sm:p-1">
                <ViewModeButton
                  active={viewMode === "detail"}
                  icon={<LayoutList size={17} />}
                  label="詳細"
                  onClick={() => setViewMode("detail")}
                />
                <ViewModeButton
                  active={viewMode === "photo"}
                  icon={<LayoutGrid size={17} />}
                  label="写真"
                  onClick={() => setViewMode("photo")}
                />
              </div>
              {notice ? <div className="rounded-lg bg-[#e4572e] px-4 py-2 text-sm font-semibold text-white">{notice}</div> : null}
            </div>
          </div>

          {isSearching ? (
            <div className="flex min-h-32 items-center justify-center py-8 text-sm font-bold text-[#69756d]">
              <span className="inline-flex items-center gap-3">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#e4572e]/30 border-t-[#e4572e]" />
                読み込み中
              </span>
            </div>
          ) : viewMode === "detail" ? (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {posts.length ? (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} onRequireLogin={requireLogin} />
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-[#d8d0c4] bg-white p-6 text-sm font-semibold text-[#69756d] md:col-span-2 xl:col-span-3">
                  まだ投稿がありません。
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2 md:grid-cols-4 xl:grid-cols-5">
              {posts.length ? (
                posts.map((post) => <PhotoGridItem key={post.id} post={post} />)
              ) : (
                <div className="col-span-3 rounded-lg border border-dashed border-[#d8d0c4] bg-white p-6 text-sm font-semibold text-[#69756d] md:col-span-4 xl:col-span-5">
                  まだ投稿がありません。
                </div>
              )}
            </div>
          )}

          <Pagination
            page={page}
            totalPages={totalPages}
            totalPosts={totalPosts}
            onPageChange={handlePageChange}
          />
        </div>
      </section>
      <Link
        href="/submit"
        onClick={handleSubmitNav}
        className="fixed bottom-5 right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#e4572e] text-white shadow-xl shadow-black/20 sm:hidden"
        aria-label="投稿"
      >
        <Camera size={22} />
      </Link>
    </main>
  );
}

function ViewModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center gap-2 rounded-md text-sm font-bold transition sm:w-auto sm:px-3 ${
        active ? "bg-[#e4572e] text-white" : "text-[#69756d] hover:bg-[#eee8df] hover:text-[#122018]"
      }`}
      aria-pressed={active}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function Pagination({
  page,
  totalPages,
  totalPosts,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalPosts: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPosts === 0 || totalPages <= 1) {
    return null;
  }

  const pages = getVisiblePages(page, totalPages);

  return (
    <nav className="mt-6 flex flex-col gap-3 rounded-lg border border-[#ded6ca] bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-semibold text-[#69756d]">
        {page} / {totalPages}ページ
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-10 items-center gap-1 rounded-lg border border-[#ded6ca] px-3 text-sm font-bold text-[#4e5b52] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          前へ
        </button>
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <span key={`${item}-${index}`} className="px-1 text-sm font-bold text-[#7a817b]">
              ...
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? "page" : undefined}
              className={`grid h-10 min-w-10 place-items-center rounded-lg border px-3 text-sm font-bold ${
                item === page
                  ? "border-[#e4572e] bg-[#e4572e] text-white"
                  : "border-[#ded6ca] text-[#4e5b52]"
              }`}
            >
              {item}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-10 items-center gap-1 rounded-lg border border-[#ded6ca] px-3 text-sm font-bold text-[#4e5b52] disabled:cursor-not-allowed disabled:opacity-40"
        >
          次へ
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}

function getVisiblePages(page: number, totalPages: number) {
  const visible = new Set([1, totalPages, page - 1, page, page + 1].filter((item) => item >= 1 && item <= totalPages));
  const sorted = Array.from(visible).sort((a, b) => a - b);
  const result: Array<number | "ellipsis"> = [];

  sorted.forEach((item, index) => {
    const previous = sorted[index - 1];
    if (previous && item - previous > 1) {
      result.push("ellipsis");
    }
    result.push(item);
  });

  return result;
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

function PhotoGridItem({ post }: { post: HomeGymPost }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group relative block aspect-square overflow-hidden bg-white"
      aria-label={`${post.title}の詳細を見る`}
    >
      <Image
        src={post.images[0]}
        alt={post.title}
        fill
        className="object-cover transition duration-300 group-hover:scale-105"
        sizes="(max-width: 768px) 33vw, (max-width: 1280px) 20vw, 180px"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
        <p className="line-clamp-2 text-xs font-bold leading-5 text-white">{post.title}</p>
      </div>
      {post.images.length > 1 ? (
        <div className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-1 text-[11px] font-bold text-white">
          {post.images.length}
        </div>
      ) : null}
    </Link>
  );
}

function PostCard({ post, onRequireLogin }: { post: HomeGymPost; onRequireLogin: (action: string) => void }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#ded6ca] bg-white shadow-sm">
      <Link href={`/posts/${post.slug}`} className="relative block aspect-square bg-[#f3efe7] sm:aspect-[4/3]">
        <Image src={post.images[0]} alt={post.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 33vw" />
        <div className="absolute left-2 top-2 rounded-lg bg-[#e4572e] px-2 py-1 text-xs font-black text-white shadow-lg shadow-black/30 sm:left-3 sm:top-3 sm:px-3 sm:py-1.5 sm:text-sm">
          {scaleLabels[post.scale]}
        </div>
        <div className="absolute bottom-2 right-2 z-10 rounded-lg bg-black/70 px-2 py-1 text-[11px] font-bold text-white sm:bottom-3 sm:right-3 sm:text-xs">写真 {post.images.length}枚</div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-2 pt-10 sm:hidden">
          <p className="line-clamp-1 pr-16 text-xs font-bold leading-5 text-white">{post.title}</p>
        </div>
      </Link>
      <div className="hidden p-4 sm:block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link href={`/posts/${post.slug}`} className="font-bold leading-6 hover:underline">
              {post.title}
            </Link>
            <p className="mt-1 text-sm text-[#69756d]">{post.owner}</p>
          </div>
          <button type="button" onClick={() => onRequireLogin("お気に入り登録")} className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#ded6ca]" aria-label="お気に入り">
            <Bookmark size={18} />
          </button>
        </div>
        <p className="mt-3 line-clamp-1 text-sm leading-6 text-[#4e5b52]">{post.summary}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <Info icon={<Ruler size={15} />} label="広さ" value={formatTatami(post.areaTatami)} />
          <Info icon={<WalletCards size={15} />} label="費用" value={yen.format(post.budget)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {post.gear.slice(0, 3).map((item) => (
            <span key={`${post.id}-${item.category}`} className="rounded-lg bg-[#eef7ee] px-2 py-1 text-xs font-bold text-[#4e5b52]">
              {item.name}
            </span>
          ))}
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-lg bg-[#ece7df] px-2 py-1 text-xs font-semibold text-[#3c4941]">
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[#ded6ca] pt-4">
          <button type="button" onClick={() => onRequireLogin("いいね")} className="inline-flex items-center gap-2 text-sm font-bold text-[#e4572e]">
            <Heart size={17} />
            {post.likes}
          </button>
          <SocialLinks sns={post.sns} />
        </div>
      </div>
    </article>
  );
}

function SocialLinks({ sns }: { sns: HomeGymPost["sns"] }) {
  const links: Array<{ key: string; label: string; href?: string; icon: React.ReactNode }> = [
    { key: "instagram", label: "Instagram", href: sns.instagram, icon: <InstagramIcon /> },
    { key: "x", label: "X", href: sns.x, icon: <XIcon /> },
    { key: "tiktok", label: "TikTok", href: sns.tiktok, icon: <TikTokIcon /> },
  ].filter((item) => Boolean(item.href));

  if (!links.length) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {links.map((item) => (
        <a
          key={item.key}
          href={item.href ?? "#"}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          className="grid h-9 w-9 place-items-center rounded-lg border border-[#ded6ca] bg-white hover:border-[#e4572e]"
        >
          {item.icon}
        </a>
      ))}
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="none">
      <defs>
        <linearGradient id="instagram-gradient" x1="4" x2="20" y1="20" y2="4" gradientUnits="userSpaceOnUse">
          <stop stopColor="#feda75" />
          <stop offset="0.35" stopColor="#fa7e1e" />
          <stop offset="0.62" stopColor="#d62976" />
          <stop offset="1" stopColor="#4f5bd5" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="16" height="16" rx="5" stroke="url(#instagram-gradient)" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="3.4" stroke="url(#instagram-gradient)" strokeWidth="2.2" />
      <circle cx="16.8" cy="7.2" r="1.15" fill="#d62976" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[22px] w-[22px] text-white" fill="currentColor">
      <path d="M13.7 10.7 20.4 3h-1.6l-5.9 6.7L8.3 3H3l7.1 10.3L3 21h1.6l6.2-6.9 4.9 6.9H21l-7.3-10.3Zm-2.2 2.5-.7-1L5.1 4.2h2.4l4.5 6.3.7 1 6 8.4h-2.4l-4.8-6.7Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[23px] w-[23px]" fill="none">
      <path d="M15.9 3.8c.3 2.3 1.7 3.6 4 3.9v2.8c-1.4.1-2.6-.3-3.9-1v5.4c0 6.8-7.5 8.9-10.5 4-1.9-3.1-.7-8.7 5.5-8.9v3.1c-.5.1-.9.2-1.4.4-1.4.6-2.1 1.9-1.7 3.2.7 2.6 5 2.1 4.7-1.6V3.8h3.3Z" fill="#25F4EE" />
      <path d="M14.8 3c.3 2.4 1.7 3.9 4.1 4.1v3.2c-1.4.1-2.7-.3-4-1.1V15c0 7.3-8 9.6-11.2 4.3-2.1-3.4-.8-9.4 5.9-9.6v3.4c-.5.1-1 .2-1.5.4-1.5.6-2.3 2-1.9 3.5.8 2.8 5.4 2.3 5-1.7V3h3.6Z" fill="#111111" />
      <path d="M17.6 7.4c.4.1.8.2 1.3.2v2.8c-1.4.1-2.7-.3-4-1.1v.7c.8.5 1.7.7 2.7.8V7.4ZM9.6 9.8v3.4c-.5.1-1 .2-1.5.4-.8.3-1.4.9-1.7 1.5-.2-2.8 1.2-5.1 3.2-5.3Z" fill="#FE2C55" />
    </svg>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f3efe7] p-2">
      <p className="flex items-center gap-1 text-xs text-[#69756d]">
        {icon}
        {label}
      </p>
      <p className="mt-1 whitespace-nowrap text-[13px] font-bold sm:text-sm">{value}</p>
    </div>
  );
}
