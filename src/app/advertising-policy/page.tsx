import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "広告ポリシー",
  description:
    "マイホームジムの広告リンク、アフィリエイト、商品紹介の独立性に関するポリシーをまとめています。",
  alternates: {
    canonical: absoluteUrl("/advertising-policy"),
  },
  openGraph: {
    title: `広告ポリシー | ${siteName}`,
    description:
      "マイホームジムの広告リンク、アフィリエイト、商品紹介の独立性に関するポリシーをまとめています。",
    url: absoluteUrl("/advertising-policy"),
    siteName,
    locale: "ja_JP",
    type: "website",
  },
};

export default function AdvertisingPolicyPage() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <nav className="text-xs font-bold text-[#69756d]" aria-label="パンくずリスト">
          <Link href="/" className="hover:text-[#e4572e]">
            ホーム
          </Link>
          <span className="mx-1">/</span>
          <span aria-current="page" className="text-[#122018]">
            広告ポリシー
          </span>
        </nav>

        <h1 className="mt-4 text-3xl font-black leading-tight tracking-normal sm:text-5xl">広告ポリシー</h1>
        <p className="mt-5 text-base leading-8 text-[#4e5b52]">
          マイホームジムには、Amazonアソシエイトおよびアフィリエイトサービスプロバイダ（A8.netなど）を通じた広告リンクが掲載される場合があります。リンク経由で商品が購入された場合や、見積もり・相談などの申し込みが行われた場合に、運営者が紹介料を受け取ることがあります。
        </p>

        <div className="mt-8 divide-y divide-[#cfd8cf] border-y border-[#cfd8cf]">
          <section className="py-5">
            <h2 className="text-xl font-bold">広告と編集の関係</h2>
            <p className="mt-2 leading-8 text-[#4e5b52]">
              広告収益の有無にかかわらず、商品紹介では用途、設置条件、注意点を併記します。高額商品や大型器具については、購入前にスペース、床、搬入、騒音リスクを確認できるようにします。
            </p>
          </section>
          <section className="py-5">
            <h2 className="text-xl font-bold">商品以外のサービス紹介について</h2>
            <p className="mt-2 leading-8 text-[#4e5b52]">
              床の補強工事やトレーニング指導など、器具の購入では解決しない内容については、関連するサービスを紹介する場合があります。紹介にあたっては、そのサービスが必要になる条件と、必要にならない条件の両方を本文に明記します。該当しない読者に申し込みを促すことはしません。
            </p>
          </section>
          <section className="py-5">
            <h2 className="text-xl font-bold">価格と在庫</h2>
            <p className="mt-2 leading-8 text-[#4e5b52]">
              価格、在庫、レビュー数、仕様は掲載後に変わることがあります。最終的な購入条件は、リンク先の商品ページで確認してください。
            </p>
          </section>
          <section className="py-5">
            <h2 className="text-xl font-bold">ランキングの考え方</h2>
            <p className="mt-2 leading-8 text-[#4e5b52]">
              ランキングはカテゴリごとの使い道、価格帯、レビュー、商品特徴、ホームジムでの設置しやすさをもとに整理しています。すべての人に同じ商品をすすめるのではなく、条件に合う候補を比較しやすくすることを目的にしています。
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
