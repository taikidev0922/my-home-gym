import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Tag } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getBlogArticleFacets, getBlogArticlesPage } from "@/lib/blog-repository";
import { absoluteUrl, baseSeoKeywords, siteName } from "@/lib/seo";
import type { BlogArticle } from "@/lib/types";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const blogCategories = [
  { id: "guide", label: "作り方" },
  { id: "rack", label: "パワーラック" },
  { id: "dumbbell", label: "可変式ダンベル" },
  { id: "bench", label: "ベンチ" },
  { id: "floor", label: "床材・防音" },
  { id: "compact", label: "省スペース" },
];

const pageSize = 9;

type BlogPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: "ホームジムお助け記事",
  description: "ホームジム作りの広さ、予算、器具選び、床材、防音、畳数の考え方をまとめた記事一覧。",
  keywords: [...baseSeoKeywords, "ホームジム お助け記事", "ホームジム 作り方", "ホームジム 初心者"],
  alternates: {
    canonical: absoluteUrl("/blog"),
  },
  openGraph: {
    title: `ホームジムお助け記事 | ${siteName}`,
    description: "ホームジム作りの広さ、予算、器具選び、床材、防音、畳数の考え方をまとめた記事一覧。",
    url: absoluteUrl("/blog"),
    siteName,
    locale: "ja_JP",
    type: "website",
  },
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = (await searchParams) ?? {};
  const selectedCategory = getParam(params.category);
  const selectedTag = getParam(params.tag);
  const page = Math.max(1, Number(getParam(params.page) ?? 1) || 1);

  const [articlePage, facets, latestPage] = await Promise.all([
    getBlogArticlesPage({ category: selectedCategory, tag: selectedTag, page, pageSize }),
    getBlogArticleFacets(),
    getBlogArticlesPage({ page: 1, pageSize: 1 }),
  ]);

  const categoryCounts = new Map(facets.categories.map((category) => [category.id, category.count]));
  const visibleCategories = blogCategories;
  const visibleTags = facets.tags.slice(0, 6);
  const latestSlug = latestPage.articles[0]?.slug;
  const pageNumbers = getPageNumbers(articlePage.page, articlePage.totalPages);

  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
      <SiteHeader showMobilePostButton={false} />
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <section className="py-2 sm:py-3">
          <h1 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">ホームジムお助け記事</h1>
        </section>

        <details className="mt-2 rounded-lg border border-[#cfd8cf] bg-white p-3 sm:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold text-[#122018]">
            <span className="inline-flex items-center gap-2">
              <Tag size={16} />
              記事を絞り込む
            </span>
            <span className="text-xs text-[#69756d]">開く</span>
          </summary>
          <div className="mt-3">
            <p className="text-xs font-bold text-[#69756d]">カテゴリ</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <FilterChip href={blogHref({ tag: selectedTag })} active={!selectedCategory}>
                すべて
              </FilterChip>
              {visibleCategories.map((category) => (
                <FilterChip
                  key={category.id}
                  href={blogHref({ category: category.id, tag: selectedTag })}
                  active={selectedCategory === category.id}
                >
                  {category.label}
                  <span className="ml-1 text-xs opacity-70">{categoryCounts.get(category.id) ?? 0}</span>
                </FilterChip>
              ))}
            </div>
          </div>
          {visibleTags.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-bold text-[#69756d]">タグ</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <FilterChip href={blogHref({ category: selectedCategory })} active={!selectedTag}>
                  すべて
                </FilterChip>
                {visibleTags.map((tag) => (
                  <FilterChip
                    key={tag.name}
                    href={blogHref({ category: selectedCategory, tag: tag.name })}
                    active={selectedTag === tag.name}
                  >
                    {tag.name}
                    <span className="ml-1 text-xs opacity-70">{tag.count}</span>
                  </FilterChip>
                ))}
              </div>
            </div>
          ) : null}
        </details>

        <section className="mt-4 hidden rounded-lg border border-[#cfd8cf] bg-white p-5 sm:block">
          <div className="flex items-center gap-2 text-sm font-bold text-[#69756d]">
            <Tag size={16} />
            記事を絞り込む
          </div>

          <div className="mt-4">
            <p className="text-sm font-bold text-[#122018]">カテゴリ</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <FilterChip href={blogHref({ tag: selectedTag })} active={!selectedCategory}>
                すべて
              </FilterChip>
              {visibleCategories.map((category) => (
                <FilterChip
                  key={category.id}
                  href={blogHref({ category: category.id, tag: selectedTag })}
                  active={selectedCategory === category.id}
                >
                  {category.label}
                  <span className="ml-1 text-xs opacity-70">{categoryCounts.get(category.id) ?? 0}</span>
                </FilterChip>
              ))}
            </div>
          </div>

          {visibleTags.length > 0 ? (
            <div className="mt-5">
              <p className="text-sm font-bold text-[#122018]">タグ</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <FilterChip href={blogHref({ category: selectedCategory })} active={!selectedTag}>
                  すべて
                </FilterChip>
                {visibleTags.map((tag) => (
                  <FilterChip
                    key={tag.name}
                    href={blogHref({ category: selectedCategory, tag: tag.name })}
                    active={selectedTag === tag.name}
                  >
                    {tag.name}
                    <span className="ml-1 text-xs opacity-70">{tag.count}</span>
                  </FilterChip>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-4 sm:mt-8">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3 sm:mb-4">
            <div className="hidden sm:block">
              <h2 className="text-2xl font-bold">記事一覧</h2>
              <p className="mt-1 text-sm font-semibold text-[#69756d]">
                {articlePage.total === 0
                  ? "0件"
                  : `${(articlePage.page - 1) * articlePage.pageSize + 1}-${Math.min(
                      articlePage.page * articlePage.pageSize,
                      articlePage.total,
                    )}件 / ${articlePage.total}件`}
              </p>
            </div>
            {(selectedCategory || selectedTag) ? (
              <Link href="/blog" className="rounded-lg border border-[#cfd8cf] px-3 py-2 text-sm font-bold text-[#4e5b52]">
                絞り込みを解除
              </Link>
            ) : null}
          </div>

          {articlePage.articles.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articlePage.articles.map((article) => (
                <ArticleCard
                  key={article.slug}
                  article={article}
                  isLatest={article.slug === latestSlug}
                  categoryLabel={getCategoryLabel(article.category)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-[#cfd8cf] bg-white p-6 text-sm font-semibold text-[#69756d]">
              条件に合う記事はまだありません。
            </div>
          )}

          {articlePage.totalPages > 1 ? (
            <nav className="mt-6 flex flex-wrap items-center justify-center gap-2" aria-label="記事一覧のページネーション">
              <PageLink
                href={blogHref({ category: selectedCategory, tag: selectedTag, page: articlePage.page - 1 })}
                disabled={articlePage.page <= 1}
              >
                <ChevronLeft size={16} />
                前へ
              </PageLink>
              {pageNumbers.map((pageNumber) => (
                <PageLink
                  key={pageNumber}
                  href={blogHref({ category: selectedCategory, tag: selectedTag, page: pageNumber })}
                  active={pageNumber === articlePage.page}
                >
                  {pageNumber}
                </PageLink>
              ))}
              <PageLink
                href={blogHref({ category: selectedCategory, tag: selectedTag, page: articlePage.page + 1 })}
                disabled={articlePage.page >= articlePage.totalPages}
              >
                次へ
                <ChevronRight size={16} />
              </PageLink>
            </nav>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function ArticleCard({
  article,
  isLatest,
  categoryLabel,
}: {
  article: BlogArticle;
  isLatest: boolean;
  categoryLabel: string;
}) {
  return (
    <Link
      href={`/blog/${article.slug}`}
      className="pressable-card flex h-full flex-col overflow-hidden rounded-lg border border-[#cfd8cf] bg-white shadow-sm transition hover:border-[#e4572e]/50"
    >
      <div className="relative block aspect-video border-b border-[#cfd8cf] bg-[#f7f8f5]">
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-contain"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex flex-wrap gap-2">
          {isLatest ? (
            <span className="rounded-full bg-[#e4572e] px-3 py-1 text-xs font-bold text-white">最新</span>
          ) : null}
          <span className="rounded-full bg-[#f7f8f5] px-3 py-1 text-xs font-bold text-[#4e5b52]">{categoryLabel}</span>
        </div>
        <h2 className="mt-3 text-xl font-bold leading-7">
          {article.title}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#4e5b52]">{article.excerpt}</p>
        <ArticleMeta article={article} />
        {article.tags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-2 pt-3">
            {article.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#143826] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#1f4a32]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function ArticleMeta({ article }: { article: BlogArticle }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#69756d]">
      <span className="inline-flex items-center gap-1 rounded-lg bg-[#f7f8f5] px-2 py-1">
        <CalendarDays size={14} />
        {dateFormatter.format(new Date(article.publishedAt))}
      </span>
      <span className="inline-flex items-center gap-1 rounded-lg bg-[#f7f8f5] px-2 py-1">
        <Clock size={14} />
        {article.readingMinutes}分
      </span>
    </div>
  );
}

function FilterChip({ href, active, children }: { href: string; active?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex items-center rounded-lg bg-[#e4572e] px-2 py-1.5 text-xs font-bold text-white sm:px-3 sm:py-2 sm:text-sm"
          : "inline-flex items-center rounded-lg border border-[#cfd8cf] bg-[#f7f8f5] px-2 py-1.5 text-xs font-bold text-[#4e5b52] hover:border-[#e4572e]/60 sm:px-3 sm:py-2 sm:text-sm"
      }
    >
      {children}
    </Link>
  );
}

function PageLink({
  href,
  active,
  disabled,
  children,
}: {
  href: string;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#cfd8cf] px-3 text-sm font-bold text-[#9b948a]">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex min-h-10 items-center gap-1 rounded-lg bg-[#e4572e] px-3 text-sm font-bold text-white"
          : "inline-flex min-h-10 items-center gap-1 rounded-lg border border-[#cfd8cf] bg-white px-3 text-sm font-bold text-[#4e5b52] hover:border-[#e4572e]/60"
      }
    >
      {children}
    </Link>
  );
}

function getParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function blogHref(params: { category?: string; tag?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.tag) search.set("tag", params.tag);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/blog?${query}` : "/blog";
}

function getCategoryLabel(category: string) {
  return blogCategories.find((item) => item.id === category)?.label ?? "ホームジム";
}

function getPageNumbers(current: number, total: number) {
  const maxVisible = 5;
  const start = Math.max(1, Math.min(current - 2, total - maxVisible + 1));
  const end = Math.min(total, start + maxVisible - 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

