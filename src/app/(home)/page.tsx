import { Suspense } from "react";
import type { Metadata } from "next";
import { HomeGymExplorer } from "@/components/home-gym-explorer";
import { HomeLoadingSkeleton } from "@/components/page-skeletons";
import { getRankingCategories } from "@/lib/product-rankings";
import { getHeaderUser } from "@/lib/header-user";
import { getPublishedPosts, type PostSearchFilters } from "@/lib/gym-repository";
import { absoluteUrl, baseSeoKeywords, defaultSeoDescription, rankingSeoKeywords, siteName } from "@/lib/seo";
import type { GymScale, ProductCategory } from "@/lib/types";

type PageSearchParams = Record<string, string | string[] | undefined>;

const scaleValues = new Set<GymScale>(["compact", "standard", "serious"]);
const categoryValues = new Set<ProductCategory>(getRankingCategories());
const budgetFilterMax = 900000;
const areaFilterMax = 12;
const defaultPerPage = 12;

export const metadata: Metadata = {
  title: "ホームジム実例と器具ランキング",
  description: defaultSeoDescription,
  keywords: [...baseSeoKeywords, ...rankingSeoKeywords],
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: `ホームジム実例と器具ランキング | ${siteName}`,
    description: defaultSeoDescription,
    url: absoluteUrl("/"),
    siteName,
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `ホームジム実例と器具ランキング | ${siteName}`,
    description: defaultSeoDescription,
  },
};

export default function Home(props: {
  searchParams: Promise<PageSearchParams>;
}) {
  return (
    <Suspense fallback={<HomeLoadingSkeleton />}>
      <HomeContent {...props} />
    </Suspense>
  );
}

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>;
}) {
  const filters = parsePostSearchFilters(await searchParams);
  const [postResult, currentUser] = await Promise.all([
    getPublishedPosts(filters),
    getHeaderUser(),
  ]);

  return (
    <HomeGymExplorer
      posts={postResult.posts}
      totalPosts={postResult.total}
      page={postResult.page}
      perPage={postResult.perPage}
      initialFilters={filters}
      currentUser={currentUser}
    />
  );
}

function parsePostSearchFilters(searchParams: PageSearchParams): PostSearchFilters {
  const query = firstValue(searchParams.q)?.trim();
  const scale = firstValue(searchParams.scale);
  const budget = Number(firstValue(searchParams.budget));
  const area = Number(firstValue(searchParams.area));
  const page = Number(firstValue(searchParams.page));
  const perPage = Number(firstValue(searchParams.perPage));
  const categories = firstValue(searchParams.categories)
    ?.split(",")
    .filter((category): category is ProductCategory => categoryValues.has(category as ProductCategory));

  return {
    ...(query ? { query } : {}),
    ...(scale && scaleValues.has(scale as GymScale) ? { scale: scale as GymScale } : {}),
    ...(Number.isFinite(budget) && budget < budgetFilterMax ? { maxBudget: budget } : {}),
    ...(Number.isFinite(area) && area < areaFilterMax ? { maxArea: area } : {}),
    ...(categories?.length ? { categories } : {}),
    page: Number.isFinite(page) && page > 1 ? Math.floor(page) : 1,
    perPage: Number.isFinite(perPage) && perPage > 0 ? Math.min(48, Math.floor(perPage)) : defaultPerPage,
  };
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
