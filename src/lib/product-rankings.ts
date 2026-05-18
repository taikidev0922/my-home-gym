import type { ProductCategory } from "@/lib/types";

export const productCategoryLabels: Record<ProductCategory, string> = {
  "multi-home-gym": "マルチホームジム",
  "power-rack": "パワーラック・スミスマシン",
  "pull-up-stand": "懸垂マシン",
  "adjustable-dumbbell": "可変式ダンベル",
  bench: "トレーニングベンチ",
  "floor-mat": "床材・防振マット",
  mirror: "鏡",
  cardio: "有酸素マシン",
  "compact-gym": "省スペース器具",
  accessory: "小物・収納",
};

export const productCategoryDescriptions: Record<ProductCategory, string> = {
  "multi-home-gym": "ラットプル、チェストプレス、アーム系まで1台でまとめたい人向け。",
  "power-rack": "ベンチプレス、スクワット、懸垂を本格的に伸ばしたい人向け。",
  "pull-up-stand": "低予算で背中・腕・体幹を鍛えたい人の定番アイテム。",
  "adjustable-dumbbell": "省スペースで全身を鍛えたい人の最初の主役アイテム。",
  bench: "ダンベル種目や多関節種目の幅を広げるホームジムの土台。",
  "floor-mat": "床傷、防音、防振を抑えるための必須インフラ。",
  mirror: "フォーム確認や空間を広く見せるための壁面アイテム。",
  cardio: "ウォーキング、バイク、ローイングなど健康維持や減量向け。",
  "compact-gym": "ポケットジム、チューブ、吊り下げ器具など狭い部屋向け。",
  accessory: "腹筋ローラー、プッシュアップバー、収納ラックなど満足度を上げる周辺アイテム。",
};

export function getRankingCategories() {
  return Object.keys(productCategoryLabels) as ProductCategory[];
}

export function getRankingProductCategories() {
  return getRankingCategories();
}