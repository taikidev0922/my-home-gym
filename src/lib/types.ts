export type GymScale = "compact" | "standard" | "serious";

export type PostCategoryItem = {
  name: string;
  category: ProductCategory;
};

export type HomeGymPost = {
  id: string;
  slug: string;
  title: string;
  owner: string;
  ownerAvatarUrl?: string;
  scale: GymScale;
  areaTatami: number;
  budget: number;
  tags: string[];
  summary: string;
  images: string[];
  gear: PostCategoryItem[];
  sns: {
    instagram?: string;
    tiktok?: string;
    x?: string;
  };
  likes: number;
};

export type ProductCategory =
  | "multi-home-gym"
  | "power-rack"
  | "pull-up-stand"
  | "adjustable-dumbbell"
  | "bench"
  | "floor-mat"
  | "mirror"
  | "cardio"
  | "compact-gym"
  | "accessory";

export type RankingProduct = {
  id: string;
  rank: number;
  category: ProductCategory;
  name: string;
  maker: string;
  price: number;
  image: string;
  rating: number;
  summary: string;
  bestFor: string;
  pros: string[];
  cons: string[];
  productUrl: string;
  affiliateUrl?: string;
  isAffiliate: boolean;
};

export type BlogArticleBlock = {
  heading: string;
  paragraphs: string[];
  visual?: {
    title: string;
    kind: "diagram" | "table" | "checklist" | "comparison";
    brief: string;
    imageUrl?: string;
    alt?: string;
    caption?: string;
  };
};

export type BlogArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  keyword: string;
  category: string;
  tags: string[];
  imageUrl: string;
  readingMinutes: number;
  publishedAt: string;
  updatedAt: string;
  articleSource: string;
  keywordSource: string;
  blocks: BlogArticleBlock[];
  metadata: Record<string, unknown>;
};
