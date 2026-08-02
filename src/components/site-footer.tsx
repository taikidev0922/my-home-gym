import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "運営者情報" },
  { href: "/editorial-policy", label: "編集方針" },
  { href: "/advertising-policy", label: "広告ポリシー" },
  { href: "/rankings", label: "器具ランキング" },
  { href: "/blog", label: "ホームジムお助け記事" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[#cfd8cf] bg-white text-[#3c4941]">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm sm:px-6">
        <nav className="flex flex-wrap gap-x-4 gap-y-2 font-bold" aria-label="フッターナビゲーション">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#e4572e]">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs leading-6 text-[#69756d]">
          My Home Gym は、自宅トレーニング環境づくりの実例、器具選び、床・防音対策を整理する情報サイトです。
        </p>
      </div>
    </footer>
  );
}
