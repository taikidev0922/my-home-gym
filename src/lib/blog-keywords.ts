import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BlogArticle } from "@/lib/types";

const RAKKO_API_BASE_URL = "https://api.rakkokeyword.com";
const RAKKO_KEYWORD_FETCH_LIMIT = 20;

type ExistingBlogKeyword = Pick<BlogArticle, "keyword">;
type BlogKeywordCategory = "guide" | "rack" | "dumbbell" | "bench" | "floor" | "compact";

const keywordSeedGroups: Record<BlogKeywordCategory, string[]> = {
  guide: [
    "宅トレ 器具",
    "家トレ 器具",
    "筋トレ 部屋",
    "ホームジム 予算",
    "ホームジム 広さ",
    "ホームジム 作り方",
  ],
  rack: [
    "パワーラック",
    "ハーフラック",
    "スミスマシン 自宅",
    "パワーラック 必要スペース",
    "パワーラック 床 補強",
    "ベンチプレス ラック 自宅",
  ],
  dumbbell: [
    "可変式ダンベル",
    "可変式ダンベル 選び方",
    "可変式ダンベル 40kg",
    "ダンベル 家トレ",
    "ダンベルプレス ベンチ",
    "ダンベル 重量 目安",
  ],
  bench: [
    "トレーニングベンチ",
    "インクラインベンチ",
    "アジャスタブルベンチ",
    "ベンチプレス ベンチ 自宅",
    "トレーニングベンチ 折りたたみ",
    "ダンベル ベンチ 必要",
  ],
  floor: [
    "ジムマット 防音",
    "ジョイントマット 筋トレ",
    "ホームジム 床材",
    "ダンベル 床 防音",
    "トレーニングマット 厚手",
    "賃貸 筋トレ 防音",
  ],
  compact: [
    "省スペース 筋トレ器具",
    "狭い部屋 筋トレ",
    "懸垂マシン 省スペース",
    "折りたたみ ベンチ",
    "チューブ 筋トレ 自宅",
    "トレーニングミラー 自宅",
  ],
};

const fallbackKeywords = [
  "可変式ダンベル 選び方 重量 目安",
  "パワーラック 必要スペース 天井高",
  "ジムマット 防音 厚さ 選び方",
  "インクラインベンチ 折りたたみ 比較",
  "賃貸 筋トレ 防音 床対策",
  "懸垂マシン 省スペース 選び方",
  "ダンベル 家トレ メニュー 初心者",
  "ハーフラック 自宅 メリット 注意点",
  "トレーニングミラー 自宅 置き方",
  "筋トレ 部屋 レイアウト 2畳",
  "ホームジム 予算 広さ",
  "ホームジム 床材 おすすめ",
];

export type KeywordCandidate = {
  keyword: string;
  source: string;
  category: string;
  metrics: Record<string, unknown>;
  score?: number;
};

export async function selectHomeGymKeyword(existingArticles: ExistingBlogKeyword[]): Promise<KeywordCandidate> {
  const rakko = await fetchRakkoKeywordCandidates(existingArticles);
  const used = new Set(existingArticles.map((article) => normalizeKeyword(article.keyword)));
  const candidate = rakko.candidates.find((item) => !used.has(normalizeKeyword(item.keyword)));

  if (candidate) {
    await upsertKeywordCandidate(candidate);
    return candidate;
  }

  const fallback =
    fallbackKeywords.find((keyword) => !used.has(normalizeKeyword(keyword))) ??
    `${fallbackKeywords[existingArticles.length % fallbackKeywords.length]} ${existingArticles.length + 1}`;

  return {
    keyword: fallback,
    source: rakko.source === "rakko" ? "fallback-after-rakko-empty" : rakko.source,
    category: inferCategory(fallback),
    metrics: {},
  };
}

export async function markKeywordUsed(keyword: KeywordCandidate, article: { slug: string; title: string }) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  const { data } = await supabase
    .from("blog_keyword_candidates")
    .select("usage_count")
    .eq("keyword", keyword.keyword)
    .maybeSingle();

  await supabase.from("blog_keyword_candidates").upsert(
    {
      keyword: keyword.keyword,
      source: keyword.source,
      category: keyword.category,
      metrics: {
        ...keyword.metrics,
        lastArticleSlug: article.slug,
        lastArticleTitle: article.title,
      },
      usage_count: Number(data?.usage_count || 0) + 1,
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "keyword" },
  );
}

async function fetchRakkoKeywordCandidates(existingArticles: ExistingBlogKeyword[]) {
  const apiKey = process.env.RAKKO_KEYWORD_API_KEY;
  if (!apiKey) {
    return { source: "rakko-missing-key", candidates: [] as KeywordCandidate[] };
  }

  const seed = selectSeedKeyword(existingArticles);
  const payload = await callRakko("/v1/related-keywords", apiKey, {
    keyword: seed,
    matchType: "partialMatch",
    sortBy: "searchVolume",
    orderBy: "desc",
    filter: {
      searchVolume: { min: 10 },
    },
    limit: RAKKO_KEYWORD_FETCH_LIMIT,
  });

  if (!payload.ok) {
    return { source: payload.source, candidates: [] as KeywordCandidate[] };
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  const candidates = items
    .filter((item) => item?.keyword)
    .map((item) => ({
      keyword: String(item.keyword),
      source: "rakko",
      category: inferCategory(String(item.keyword)),
      metrics: item.metrics ?? {},
    }))
    .filter(isHomeGymKeyword)
    .map((item) => ({
      ...item,
      score: scoreKeywordCandidate(item),
    }))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .filter(
      (item, index, array) =>
        array.findIndex((entry) => normalizeKeyword(entry.keyword) === normalizeKeyword(item.keyword)) === index,
    );

  return { source: candidates.length ? `rakko:${seed}` : `rakko-empty:${seed}`, candidates };
}

async function callRakko(endpoint: string, apiKey: string, body: Record<string, unknown>) {
  try {
    const response = await fetch(`${RAKKO_API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.result) {
      return { ok: false, source: `rakko-error-${response.status}`, items: [] };
    }

    return { ok: true, source: "rakko", items: payload.data?.items ?? [] };
  } catch {
    return { ok: false, source: "rakko-fetch-error", items: [] };
  }
}

async function upsertKeywordCandidate(candidate: KeywordCandidate) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("blog_keyword_candidates").upsert(
    {
      keyword: candidate.keyword,
      source: candidate.source,
      category: candidate.category,
      metrics: candidate.metrics,
    },
    { onConflict: "keyword", ignoreDuplicates: true },
  );
}

function isHomeGymKeyword(candidate: KeywordCandidate) {
  const keyword = normalizeKeyword(candidate.keyword);
  if (keyword.length < 4 || keyword.length > 80) return false;
  if (
    hasAny(keyword, [
      "退会",
      "ログイン",
      "中古車",
      "求人",
      "株価",
      "プロテインだけ",
      "プロテイン 女性",
      "サプリ",
      "ジム 退会",
      "エニタイム",
      "チョコザップ",
      "ライザップ",
    ])
  ) {
    return false;
  }

  return hasAny(keyword, [
    "ホームジム",
    "家トレ",
    "宅トレ",
    "筋トレ器具",
    "筋トレ 部屋",
    "自宅 筋トレ",
    "パワーラック",
    "ハーフラック",
    "スミスマシン",
    "懸垂マシン",
    "チンニング",
    "可変式ダンベル",
    "ダンベル",
    "バーベル",
    "プレート",
    "トレーニングベンチ",
    "インクラインベンチ",
    "アジャスタブルベンチ",
    "ジムマット",
    "ジョイントマット",
    "トレーニングマット",
    "防音",
    "防振",
    "床材",
    "トレーニングミラー",
  ]);
}

function scoreKeywordCandidate(candidate: KeywordCandidate) {
  const keyword = normalizeKeyword(candidate.keyword);
  const metrics = candidate.metrics as {
    searchVolume?: unknown;
    monthlySearches?: unknown;
    competition?: unknown;
  };
  const volume = Number(metrics.searchVolume ?? metrics.monthlySearches ?? 0);
  const competition = Number(metrics.competition ?? 0);
  const intentScore =
    keywordIntentScore(keyword, [
      "おすすめ",
      "選び方",
      "費用",
      "予算",
      "広さ",
      "何畳",
      "6畳",
      "4畳",
      "賃貸",
      "防音",
      "床",
      "マット",
      "後悔",
      "注意",
      "比較",
      "初心者",
      "自宅",
      "必要",
      "目安",
      "レイアウト",
    ]) +
    keywordIntentScore(keyword, [
      "パワーラック",
      "ハーフラック",
      "スミスマシン",
      "懸垂マシン",
      "可変式ダンベル",
      "ダンベル",
      "ベンチ",
      "マルチホームジム",
      "床材",
      "防振",
      "トレーニングミラー",
    ]);
  const longTailScore = keyword.length >= 8 ? 12 : 0;
  const categoryScore = candidate.category === "guide" ? 2 : 8;
  const volumeScore = Math.min(35, Math.log10(Math.max(volume, 1)) * 12);
  const competitionPenalty = Number.isFinite(competition) ? Math.min(10, competition * 2) : 0;

  return Math.round(volumeScore + intentScore + longTailScore + categoryScore - competitionPenalty);
}

function keywordIntentScore(keyword: string, terms: string[]) {
  return terms.reduce((score, term) => score + (keyword.includes(term) ? 8 : 0), 0);
}

function inferCategory(keyword: string) {
  if (hasAny(keyword, ["パワーラック", "ハーフラック", "スミスマシン", "バーベルラック"])) return "rack";
  if (hasAny(keyword, ["可変式ダンベル", "ダンベル"])) return "dumbbell";
  if (hasAny(keyword, ["ベンチ", "インクライン", "アジャスタブル"])) return "bench";
  if (hasAny(keyword, ["床", "マット", "防音", "防振", "ジョイントマット"])) return "floor";
  if (hasAny(keyword, ["賃貸", "省スペース", "狭い", "懸垂マシン", "チンニング", "ミラー", "チューブ"])) return "compact";
  return "guide";
}

function selectSeedKeyword(existingArticles: ExistingBlogKeyword[]) {
  const categoryCounts = new Map<BlogKeywordCategory, number>();
  const orderedCategories = Object.keys(keywordSeedGroups) as BlogKeywordCategory[];

  for (const category of orderedCategories) {
    categoryCounts.set(category, 0);
  }

  for (const article of existingArticles) {
    const category = inferCategory(article.keyword) as BlogKeywordCategory;
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  }

  const lastCategory = existingArticles[0]?.keyword
    ? (inferCategory(existingArticles[0].keyword) as BlogKeywordCategory)
    : null;
  const category =
    [...orderedCategories].sort((a, b) => {
      const countDiff = (categoryCounts.get(a) ?? 0) - (categoryCounts.get(b) ?? 0);
      if (countDiff !== 0) return countDiff;
      if (a === lastCategory) return 1;
      if (b === lastCategory) return -1;
      return orderedCategories.indexOf(a) - orderedCategories.indexOf(b);
    })[0] ?? "guide";

  const seeds = keywordSeedGroups[category];
  const categoryCount = categoryCounts.get(category) ?? 0;
  return seeds[categoryCount % seeds.length];
}

function normalizeKeyword(keyword: string) {
  return keyword.replace(/\s+/g, " ").trim();
}

function hasAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}
