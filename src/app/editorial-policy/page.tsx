import type { Metadata } from "next";
import Link from "next/link";
import { absoluteUrl, siteName } from "@/lib/seo";

export const metadata: Metadata = {
  title: "編集方針",
  description:
    "マイホームジムの記事作成、商品選定、情報更新、誤記修正に関する編集方針をまとめています。",
  alternates: {
    canonical: absoluteUrl("/editorial-policy"),
  },
  openGraph: {
    title: `編集方針 | ${siteName}`,
    description:
      "マイホームジムの記事作成、商品選定、情報更新、誤記修正に関する編集方針をまとめています。",
    url: absoluteUrl("/editorial-policy"),
    siteName,
    locale: "ja_JP",
    type: "website",
  },
};

const policies = [
  {
    title: "読者の判断材料を優先する",
    body: "記事では、価格やメリットだけでなく、設置スペース、床への負荷、防音、搬入、収納、向いていないケースも併記します。",
  },
  {
    title: "商品情報は確認できる事実をもとにする",
    body: "ランキングや商品紹介では、公開されている商品名、価格、レビュー、サイズ、重量、特徴を確認し、カテゴリごとの用途に合わせて整理します。",
  },
  {
    title: "医療・安全に関わる断定を避ける",
    body: "身体の痛み、怪我、建物の耐荷重など専門判断が必要な内容では、医療機関、管理会社、建築士、施工会社への確認を促します。",
  },
  {
    title: "更新と修正を行う",
    body: "価格、在庫、仕様、リンク先は変わることがあります。誤記や古い情報に気づいた場合は、確認でき次第修正します。",
  },
];

export default function EditorialPolicyPage() {
  return (
    <main className="min-h-screen bg-[#eef2ed] text-[#122018]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <nav className="text-xs font-bold text-[#69756d]" aria-label="パンくずリスト">
          <Link href="/" className="hover:text-[#e4572e]">
            ホーム
          </Link>
          <span className="mx-1">/</span>
          <span aria-current="page" className="text-[#122018]">
            編集方針
          </span>
        </nav>

        <h1 className="mt-4 text-3xl font-black leading-tight tracking-normal sm:text-5xl">編集方針</h1>
        <p className="mt-5 text-base leading-8 text-[#4e5b52]">
          マイホームジムは、ホームジム作りで迷いやすい「何を買うか」だけでなく、「置けるか」「続けられるか」「近隣や床に負担をかけないか」まで含めて判断できる情報を目指します。
        </p>

        <div className="mt-8 divide-y divide-[#cfd8cf] border-y border-[#cfd8cf]">
          {policies.map((policy) => (
            <section key={policy.title} className="py-5">
              <h2 className="text-xl font-bold">{policy.title}</h2>
              <p className="mt-2 leading-8 text-[#4e5b52]">{policy.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-8 border-t border-[#cfd8cf] pt-6">
          <h2 className="text-xl font-bold">情報源の扱い</h2>
          <p className="mt-3 leading-8 text-[#4e5b52]">
            商品ランキングでは、商品ページに掲載されている仕様、レビュー数、価格、画像、特徴を参照します。記事内で商品を紹介する場合も、読者の検討に必要なスペックや注意点が本文の文脈に合う場合だけ掲載します。
          </p>
        </section>
      </div>
    </main>
  );
}
