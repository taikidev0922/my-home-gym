import type { ProductCategory } from "@/lib/types";

export const siteName = "マイホームジム";

export const siteUrl = "https://my-home-gym.vercel.app";

export const defaultSeoDescription =
  "ホームジムの写真投稿を、畳数・予算・器具カテゴリで比較できる共有サイト。パワーラック、可変式ダンベル、トレーニングベンチ、防音マット、床補強など自宅ジム作りの実例と用品ランキングを確認できます。";

export const baseSeoKeywords = [
  "ホームジム",
  "マイホームジム",
  "自宅ジム",
  "宅トレ",
  "ホームジム 予算",
  "ホームジム 費用",
  "ホームジム 広さ",
  "ホームジム 畳",
  "ホームジム 6畳",
  "ホームジム レイアウト",
  "ホームジム 床補強",
  "ホームジム 後悔",
  "ホームジム おしゃれ",
  "ホームジム 写真",
  "ホームジム 実例",
  "ホームジム 共有",
  "筋トレ 自宅",
  "防音 ホームジム",
];

export const rankingSeoKeywords = [
  "ホームジム ランキング",
  "ホームジム おすすめ",
  "ホームジム マシン",
  "ホームジム 器具 おすすめ",
  "パワーラック おすすめ",
  "可変式ダンベル おすすめ",
  "トレーニングベンチ おすすめ",
  "ホームジム マット",
  "防振マット 筋トレ",
  "懸垂マシン 自宅",
  "省スペース ホームジム",
];

export const categorySeoKeywords: Record<ProductCategory, string[]> = {
  "multi-home-gym": ["マルチホームジム", "ホームジム マシン", "ラットプル 自宅"],
  "power-rack": ["パワーラック", "ハーフラック", "スミスマシン", "ベンチプレス 自宅"],
  "pull-up-stand": ["懸垂マシン", "チンニングスタンド", "ぶら下がり健康器"],
  "adjustable-dumbbell": ["可変式ダンベル", "アジャスタブルダンベル", "ダンベル 40kg"],
  bench: ["トレーニングベンチ", "インクラインベンチ", "アジャスタブルベンチ"],
  "floor-mat": ["ホームジム マット", "防音マット", "防振マット", "ジムマット"],
  mirror: ["ホームジム 鏡", "トレーニング ミラー", "フォーム確認 鏡"],
  cardio: ["家庭用 有酸素マシン", "ルームランナー", "フィットネスバイク"],
  "compact-gym": ["省スペース ホームジム", "トレーニングチューブ", "ポケットジム"],
  accessory: ["筋トレ 小物", "ホームジム 収納", "腹筋ローラー"],
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}
