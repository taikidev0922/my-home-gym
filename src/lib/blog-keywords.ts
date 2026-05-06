import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BlogArticle } from "@/lib/types";

const RAKKO_API_BASE_URL = "https://api.rakkokeyword.com";
const RAKKO_KEYWORD_FETCH_LIMIT = 20;

const seedKeywords = [
  "ホームジム",
  "ホームジム 予算",
  "ホームジム 広さ",
  "ホームジム パワーラック",
  "可変式ダンベル ホームジム",
  "ホームジム 防音",
  "ホームジム 床材",
  "賃貸 ホームジム",
  "省スペース ホームジム",
];

const fallbackKeywords = [
  "ホームジム 予算 広さ",
  "ホームジム パワーラック 必要スペース",
  "可変式ダンベル ホームジム 選び方",
  "賃貸 ホームジム 防音",
  "ホームジム 床材 おすすめ",
  "省スペース ホームジム 作り方",
  "ホームジム ベンチ 必要",
];

export type KeywordCandidate = {
  keyword: string;
  source: string;
  category: string;
  metrics: Record<string, unknown>;
  score?: number;
};

export async function selectHomeGymKeyword(existingArticles: BlogArticle[]): Promise<KeywordCandidate> {
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

async function fetchRakkoKeywordCandidates(existingArticles: BlogArticle[]) {
  const apiKey = process.env.RAKKO_KEYWORD_API_KEY;
  if (!apiKey) {
    return { source: "rakko-missing-key", candidates: [] as KeywordCandidate[] };
  }

  const seed = seedKeywords[existingArticles.length % seedKeywords.length];
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

  return { source: candidates.length ? "rakko" : "rakko-empty", candidates };
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
  if (hasAny(keyword, ["退会", "ログイン", "中古車", "求人", "株価", "プロテインだけ"])) return false;

  return hasAny(keyword, [
    "ホームジム",
    "家トレ",
    "宅トレ",
    "パワーラック",
    "ハーフラック",
    "可変式ダンベル",
    "ダンベル",
    "トレーニングベンチ",
    "ジムマット",
    "防音",
    "防振",
    "筋トレ 部屋",
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
    keywordIntentScore(keyword, ["おすすめ", "選び方", "費用", "予算", "広さ", "何畳", "6畳", "4畳", "賃貸", "防音", "床", "マット", "後悔", "注意", "比較"]) +
    keywordIntentScore(keyword, ["パワーラック", "可変式ダンベル", "ベンチ", "マルチホームジム", "床材", "防振"]);
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
  if (hasAny(keyword, ["パワーラック", "ハーフラック", "スミスマシン"])) return "rack";
  if (hasAny(keyword, ["可変式ダンベル", "ダンベル"])) return "dumbbell";
  if (hasAny(keyword, ["ベンチ", "インクライン"])) return "bench";
  if (hasAny(keyword, ["床", "マット", "防音", "防振"])) return "floor";
  if (hasAny(keyword, ["賃貸", "省スペース", "狭い"])) return "compact";
  return "guide";
}

function normalizeKeyword(keyword: string) {
  return keyword.replace(/\s+/g, " ").trim();
}

function hasAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}
