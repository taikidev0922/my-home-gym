import { Suspense } from "react";
import { HomeGymExplorer } from "@/components/home-gym-explorer";
import { HomeLoadingSkeleton } from "@/components/page-skeletons";
import { getRankingCategories } from "@/lib/product-rankings";
import { getCurrentAuthUser } from "@/lib/auth-user";
import { getProfile, getPublishedPosts, type PostSearchFilters } from "@/lib/gym-repository";
import type { GymScale, ProductCategory } from "@/lib/types";

type PageSearchParams = Record<string, string | string[] | undefined>;

const scaleValues = new Set<GymScale>(["compact", "standard", "serious"]);
const categoryValues = new Set<ProductCategory>(getRankingCategories());
const budgetFilterMax = 900000;
const areaFilterMax = 12;
const defaultPerPage = 12;

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
  const [postResult, user] = await Promise.all([
    getPublishedPosts(filters),
    getCurrentAuthUser(),
  ]);
  const profile = user ? await getProfile(user.id, user.email, user.name, user.avatarUrl) : null;

  return (
    <HomeGymExplorer
      posts={postResult.posts}
      totalPosts={postResult.total}
      page={postResult.page}
      perPage={postResult.perPage}
      initialFilters={filters}
      currentUser={
        user && profile
          ? {
              email: user.email ?? "",
              name: profile.displayName,
              avatarUrl: profile.avatarUrl || user.avatarUrl,
            }
          : null
      }
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
