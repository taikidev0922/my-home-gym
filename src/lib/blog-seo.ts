import { absoluteUrl, siteAuthorName, siteName } from "@/lib/seo";
import type { BlogArticle } from "@/lib/types";

export function createBlogBreadcrumbJsonLd(article?: Pick<BlogArticle, "slug" | "title">) {
  const items = [
    { name: "ホーム", item: absoluteUrl("/") },
    { name: "ブログ", item: absoluteUrl("/blog") },
    ...(article ? [{ name: article.title, item: absoluteUrl(`/blog/${article.slug}`) }] : []),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.item,
    })),
  };
}

export function createBlogArticleJsonLd(article: BlogArticle) {
  const articleUrl = absoluteUrl(`/blog/${article.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": ["Article", "BlogPosting"],
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
    headline: article.title,
    description: article.excerpt,
    url: articleUrl,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    image: article.imageUrl ? [absoluteUrl(article.imageUrl)] : undefined,
    keywords: [article.keyword, ...article.tags].filter(Boolean).join(", "),
    articleSection: article.category,
    wordCount: estimateArticleWordCount(article),
    inLanguage: "ja-JP",
    author: {
      "@type": "Organization",
      name: siteAuthorName,
      url: absoluteUrl("/blog"),
    },
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/favicon-512.webp"),
      },
    },
  };
}

export function createBlogFaqs(article: Pick<BlogArticle, "keyword" | "category">) {
  const categoryAnswers: Record<string, Array<{ question: string; answer: string }>> = {
    guide: [
      {
        question: "ホームジムは最初に何から揃えるべきですか？",
        answer: "床保護、防音、可変式ダンベル、トレーニングベンチの順で考えると失敗しにくくなります。部屋の広さと週に行う種目を先に決めてから器具を選ぶのが基本です。",
      },
      {
        question: "ホームジム作りで一番見落としやすい点は何ですか？",
        answer: "器具本体のサイズだけでなく、プレート交換やダンベルを置く余白、体を動かす可動域、床の防音対策まで含めて設置スペースを見ることです。",
      },
    ],
    rack: [
      {
        question: "パワーラックやハーフラックは何畳あれば置けますか？",
        answer: "本体だけなら2畳前後でも置ける場合がありますが、安全に使うには前後左右の余白と天井高が必要です。ベンチやバーベルの出し入れも含めて確認してください。",
      },
      {
        question: "賃貸でもラックは設置できますか？",
        answer: "設置自体は可能な場合がありますが、床の耐荷重、防振、防音、搬入経路を事前に確認してください。厚手のマットや合板で荷重を分散する対策も重要です。",
      },
    ],
    dumbbell: [
      {
        question: "可変式ダンベルは何kgを選べばよいですか？",
        answer: "初心者は片手20kg前後、中級者以上やダンベルプレスを伸ばしたい人は片手32kg以上を目安にすると長く使いやすくなります。",
      },
      {
        question: "ダイヤル式とプレート式はどちらが便利ですか？",
        answer: "重量変更の速さを重視するならダイヤル式、価格や耐久性を重視するならプレート式が候補になります。種目間の切り替えが多い人はダイヤル式が快適です。",
      },
    ],
    bench: [
      {
        question: "トレーニングベンチはフラットだけで足りますか？",
        answer: "胸や肩の種目を増やしたいならインクライン対応のアジャスタブルベンチが便利です。折りたたみ可否、耐荷重、角度調整段階を確認してください。",
      },
      {
        question: "ベンチ選びで重要なスペックは何ですか？",
        answer: "耐荷重、シート幅、角度調整、折りたたみ時サイズ、床との接地安定性です。体重と扱うダンベル重量を足して余裕のある耐荷重を選びます。",
      },
    ],
    floor: [
      {
        question: "ホームジムの床対策は必須ですか？",
        answer: "ダンベルやラックを使うなら必須です。床の傷、凹み、振動音を防ぐため、ジョイントマットだけで不安な場合はゴムマットや合板も組み合わせます。",
      },
      {
        question: "マンションで防音するには何を敷けばよいですか？",
        answer: "EVAマット、ゴムマット、合板を用途に応じて重ねると振動を抑えやすくなります。高重量器具は一点荷重を避ける配置も大切です。",
      },
    ],
    compact: [
      {
        question: "狭い部屋でもホームジムは作れますか？",
        answer: "1畳からでも可変式ダンベル、折りたたみベンチ、チューブ、マットを組み合わせれば始められます。収納しやすい器具を選ぶのがポイントです。",
      },
      {
        question: "省スペースで優先すべき器具は何ですか？",
        answer: "可変式ダンベル、折りたたみベンチ、トレーニングマットが優先候補です。懸垂をしたい場合は天井高と設置幅を確認してから選びます。",
      },
    ],
  };

  const fallback = categoryAnswers.guide;
  return [
    {
      question: `${article.keyword}で失敗しないために最初に確認することは？`,
      answer: "設置スペース、予算、床や防音の条件、実際に行う種目を先に決めてください。器具の価格だけで判断せず、搬入や収納まで含めて考えると失敗しにくくなります。",
    },
    ...(categoryAnswers[article.category] ?? fallback),
  ].slice(0, 3);
}

export function createBlogFaqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function createBlogCollectionJsonLd(articles: BlogArticle[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteName} ブログ`,
    description: "ホームジム作りの広さ、予算、器具選び、床材、防音、畳数の考え方をまとめた記事一覧。",
    url: absoluteUrl("/blog"),
    inLanguage: "ja-JP",
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/brand/favicon-512.webp"),
      },
    },
    blogPost: articles.map((article) => ({
      "@type": "BlogPosting",
      headline: article.title,
      description: article.excerpt,
      url: absoluteUrl(`/blog/${article.slug}`),
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      image: article.imageUrl ? absoluteUrl(article.imageUrl) : undefined,
    })),
  };
}

export function createBlogItemListJsonLd(articles: BlogArticle[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/blog/${article.slug}`),
      name: article.title,
    })),
  };
}

function estimateArticleWordCount(article: BlogArticle) {
  const text = [article.title, article.excerpt, ...article.blocks.flatMap((block) => [block.heading, ...block.paragraphs])].join("");
  return text.length;
}
