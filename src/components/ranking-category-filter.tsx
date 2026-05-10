"use client";

import Link from "next/link";
import { ChevronDown, SearchCheck } from "lucide-react";
import { useRef } from "react";
import { productCategoryLabels } from "@/lib/product-rankings";
import type { ProductCategory } from "@/lib/types";

export function RankingCategoryFilter({
  categories,
  activeCategory,
}: {
  categories: ProductCategory[];
  activeCategory: ProductCategory | null;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  function closePanel() {
    if (detailsRef.current) detailsRef.current.open = false;
  }

  return (
    <details ref={detailsRef} className="group rounded-lg border border-[#cfd8cf] bg-white px-3 py-3 shadow-sm sm:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-[#122018]">
        <span className="flex items-center gap-2">
          <SearchCheck size={16} />
          表示カテゴリ
          <span className="rounded-full bg-[#f7f8f5] px-2 py-0.5 text-xs text-[#69756d]">
            {activeCategory ? productCategoryLabels[activeCategory] : "すべて"}
          </span>
        </span>
        <ChevronDown size={18} className="shrink-0 text-[#69756d] transition group-open:rotate-180" />
      </summary>
      <div className="mt-3 grid grid-cols-1 gap-2">
        <Link
          href="/rankings"
          onClick={closePanel}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
            !activeCategory
              ? "border-[#e4572e] bg-[#e4572e] text-white"
              : "border-[#cfd8cf] bg-[#f7f8f5] text-[#4e5b52] hover:border-[#e4572e]"
          }`}
        >
          <span
            className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
              !activeCategory ? "border-white bg-white" : "border-[#c4cec4] bg-white"
            }`}
          >
            {!activeCategory ? <span className="h-2 w-2 rounded-sm bg-[#e4572e]" /> : null}
          </span>
          <span className="block min-w-0 font-bold">すべて</span>
        </Link>

        {categories.map((item) => (
          <Link
            key={item}
            href={`/rankings?category=${item}`}
            onClick={closePanel}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
              activeCategory === item
                ? "border-[#e4572e] bg-[#e4572e] text-white"
                : "border-[#cfd8cf] bg-[#f7f8f5] text-[#4e5b52] hover:border-[#e4572e]"
            }`}
          >
            <span
              className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
                activeCategory === item ? "border-white bg-white" : "border-[#c4cec4] bg-white"
              }`}
            >
              {activeCategory === item ? <span className="h-2 w-2 rounded-sm bg-[#e4572e]" /> : null}
            </span>
            <span className="block min-w-0 font-bold">{productCategoryLabels[item]}</span>
          </Link>
        ))}
      </div>
    </details>
  );
}
