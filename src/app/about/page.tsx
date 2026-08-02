import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "運営者情報",
  description:
    "マイホームジムの運営目的、掲載している情報、ホームジム実例と器具選びに対する考え方をまとめています。",
  alternates: {
    canonical: absoluteUrl("/about"),
  },
  openGraph: {
    title: `運営者情報 | ${siteName}`,
    description:
      "マイホームジムの運営目的、掲載している情報、ホームジム実例と器具選びに対する考え方をまとめています。",
    url: absoluteUrl("/about"),
    siteName,
    locale: "ja_JP",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <nav className="text-xs font-bold text-[#69756d]" aria-label="パンくずリスト">
          <Link href="/" className="hover:text-[#e4572e]">
            ホーム
          </Link>
          <span className="mx-1">/</span>
          <span aria-current="page" className="text-[#122018]">
            運営者情報
          </span>
        </nav>

        <h1 className="mt-4 text-3xl font-black leading-tight tracking-normal sm:text-5xl">運営者情報</h1>
        <p className="mt-5 text-base leading-8 text-[#4e5b52]">
          マイホームジムは、自宅でトレーニング環境を作りたい人に向けて、ホームジムの実例、器具ランキング、床・防音・広さに関する記事を整理する情報サイトです。
        </p>

        <section className="mt-8 border-t border-[#cfd8cf] pt-6">
          <h2 className="text-xl font-bold">運営方針</h2>
          <p className="mt-3 leading-8 text-[#4e5b52]">
            読者が「自分の部屋・予算・目的なら何から揃えるべきか」を判断しやすいように、実例投稿、商品スペック、価格帯、設置条件、注意点を分けて掲載します。高額器具の購入を急がせる表現よりも、床保護、防音、搬入、収納まで含めた現実的な検討を重視します。
          </p>
        </section>

        <section className="mt-8 border-t border-[#cfd8cf] pt-6">
          <h2 className="text-xl font-bold">掲載情報</h2>
          <dl className="mt-3 grid gap-4 text-sm leading-7">
            <div>
              <dt className="font-bold">サイト名</dt>
              <dd className="text-[#4e5b52]">マイホームジム</dd>
            </div>
            <div>
              <dt className="font-bold">運営</dt>
              <dd className="text-[#4e5b52]">マイホームジム編集部</dd>
            </div>
            <div>
              <dt className="font-bold">主なテーマ</dt>
              <dd className="text-[#4e5b52]">ホームジム実例、器具選び、床材、防音、省スペース化、予算設計</dd>
            </div>
          </dl>
        </section>

        <section className="mt-8 border-t border-[#cfd8cf] pt-6">
          <h2 className="text-xl font-bold">関連ページ</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/editorial-policy" className="rounded-lg border border-[#cfd8cf] bg-white px-3 py-2 text-sm font-bold hover:border-[#e4572e]">
              編集方針
            </Link>
            <Link href="/advertising-policy" className="rounded-lg border border-[#cfd8cf] bg-white px-3 py-2 text-sm font-bold hover:border-[#e4572e]">
              広告ポリシー
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
