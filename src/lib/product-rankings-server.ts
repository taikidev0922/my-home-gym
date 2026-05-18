import { createAffiliateSlotKey } from "@/lib/affiliate-products";
import { getAffiliateProducts } from "@/lib/affiliate-products-server";
import { getRankingCategories, productCategoryLabels } from "@/lib/product-rankings";
import type { ProductCategory, RankingProduct } from "@/lib/types";

type AffiliateProductForRanking = Awaited<ReturnType<typeof getAffiliateProducts>>[number];

type RankingCopy = {
  summary: string;
  bestFor: string;
  pros: string[];
  cons: string[];
};

type ProductCopyPreset = Omit<RankingCopy, "summary"> & {
  matches: string[];
  summary: string;
};

export async function getRankingProductsWithAffiliateLinks(category?: ProductCategory) {
  const affiliateProducts = await getAffiliateProducts();
  const productsBySlot = new Map<string, RankingProduct>();

  for (const affiliateProduct of affiliateProducts) {
    if (affiliateProduct.rank > 5) continue;
    if (category && affiliateProduct.category !== category) continue;

    productsBySlot.set(affiliateProduct.slotKey, affiliateProductToRankingProduct(affiliateProduct));
  }

  if (category) {
    return Array.from(productsBySlot.values()).sort((a, b) => a.rank - b.rank);
  }

  return getRankingCategories()
    .map((item) => productsBySlot.get(createAffiliateSlotKey(item, 1)))
    .filter((product): product is RankingProduct => Boolean(product));
}

function affiliateProductToRankingProduct(affiliateProduct: AffiliateProductForRanking): RankingProduct {
  const copy = createRankingCopy(affiliateProduct);

  return {
    id: affiliateProduct.slotKey,
    rank: affiliateProduct.rank,
    category: affiliateProduct.category,
    name: affiliateProduct.name,
    maker: cleanMaker(affiliateProduct.maker || affiliateProduct.brand || "Amazon"),
    price: parsePrice(affiliateProduct.priceText) ?? 0,
    image: affiliateProduct.imageUrl,
    rating: parseRating(affiliateProduct.ratingText) ?? 4,
    summary: copy.summary,
    bestFor: copy.bestFor,
    pros: copy.pros,
    cons: copy.cons,
    productUrl: affiliateProduct.affiliateUrl,
    affiliateUrl: affiliateProduct.affiliateUrl,
    isAffiliate: true,
  };
}

function cleanMaker(value: string) {
  return value.replace(/のストアを表示/g, "").trim() || "Amazon";
}

function parsePrice(value: string) {
  const price = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(price) && price > 0 ? price : null;
}

function parseRating(value: string) {
  const ratingText =
    value.match(/うち\s*([0-5](?:\.\d+)?)/)?.[1] ??
    value.match(/([0-5](?:\.\d+)?)(?!.*[0-5](?:\.\d+)?)/)?.[1];
  const rating = Number(ratingText);
  return Number.isFinite(rating) && rating > 0 ? rating : null;
}

function createRankingCopy(product: AffiliateProductForRanking): RankingCopy {
  const productText = buildProductText(product);
  const preset = productCopyPresets.find((item) => item.matches.some((match) => productText.includes(match)));

  if (preset) {
    return {
      summary: withRank(product, preset.summary),
      bestFor: preset.bestFor,
      pros: preset.pros,
      cons: preset.cons,
    };
  }

  const fallback = categoryFallbackCopy[product.category];

  return {
    summary: withRank(product, fallback.summary),
    bestFor: fallback.bestFor,
    pros: fallback.pros,
    cons: fallback.cons,
  };
}

function withRank(product: AffiliateProductForRanking, summary: string) {
  const label = productCategoryLabels[product.category];
  return `${label}の第${product.rank}位。${summary}`;
}

function buildProductText(product: AffiliateProductForRanking) {
  return [
    product.name,
    product.maker,
    product.brand,
    product.productDescription,
    product.dimensionsText,
    product.weightText,
    ...product.featureBullets,
  ]
    .join(" ")
    .toLowerCase();
}

const productCopyPresets: ProductCopyPreset[] = [
  {
    matches: ["ディプスベルト", "ディッピングベルト"],
    summary: "懸垂やディップスに追加荷重をかけるためのベルトです。",
    bestFor: "自重トレーニングに物足りなさを感じ、加重懸垂や加重ディップスを始めたい人",
    pros: ["懸垂・ディップスに負荷を足せる", "ベルト式なのでラックやマシンを増やさず使える", "チェーン長を調整しやすく体格に合わせやすい"],
    cons: ["ダンベルやプレートなど別の重りが必要", "腰まわりに荷重がかかるためフォームが崩れる人には不向き"],
  },
  {
    matches: ["ダンベルフック"],
    summary: "加重ベルトとダンベルをつなぎやすくする補助フックです。",
    bestFor: "加重懸垂・加重ディップスの準備を短くして、セット間の集中を切らしたくない人",
    pros: ["ダンベルを引っ掛けるだけで加重準備が早い", "ベルト・ダンベル・シャフトに使える汎用性がある", "日本製で小物としての安心感がある"],
    cons: ["単体では使えず加重ベルトやダンベルが必要", "2個運用やバーベル利用では追加購入を見込む必要がある"],
  },
  {
    matches: ["パワーグリップ"],
    summary: "プル系種目で握力の消耗を抑えるグリップ補助具です。",
    bestFor: "背中のトレーニングで握力が先に限界になり、広背筋へ効かせきれない人",
    pros: ["ラットプルやローイングで握力を温存しやすい", "バーへ巻き付けやすく高重量でも使いやすい", "手のひらの痛みやマメ対策にもなる"],
    cons: ["押す種目や脚種目にはほぼ使わない", "手首サイズとフィット感が合わないと違和感が出やすい"],
  },
  {
    matches: ["リストラップ"],
    summary: "ベンチプレスやショルダープレスで手首を固めるサポーターです。",
    bestFor: "プレス系種目で手首が反りやすく、高重量時の不安を減らしたい人",
    pros: ["手首を固定して押す種目の安定感を出しやすい", "硬すぎない素材で巻き加減を調整しやすい", "ベンチプレスやダンベルプレスと相性が良い"],
    cons: ["背中や脚の種目では出番が少ない", "巻き方が緩いと効果が出にくく、強すぎると圧迫感がある"],
  },
  {
    matches: ["wバー", "フィットネスバー"],
    summary: "腕トレで手首の角度を自然に保ちやすいレギュラー径のWバーです。",
    bestFor: "アームカールやトライセプス種目を、自宅で手首に配慮しながら行いたい人",
    pros: ["カール時に手首が自然な角度になりやすい", "上腕二頭筋・前腕・三頭筋の種目を増やせる", "ダンベルだけでは作りにくい腕トレの刺激を作れる"],
    cons: ["穴径29mmのレギュラープレート専用", "シャフトとプレートの置き場所を別途確保したい"],
  },
  {
    matches: ["可変式 ダンベル", "可変式ダンベル", "アジャスタブル"],
    summary: "複数重量を1台にまとめられる可変式ダンベルです。",
    bestFor: "限られたスペースでダンベル種目を広くこなしたい人",
    pros: ["重量変更が早く種目間の移動がスムーズ", "固定式ダンベルを何本も置くより省スペース", "胸・背中・肩・腕・脚まで種目を広げやすい"],
    cons: ["落下や乱暴な扱いには注意が必要", "最大重量が目的の種目に足りるか事前確認したい"],
  },
  {
    matches: ["トレーニングベンチ", "インクラインベンチ", "マルチポジションベンチ"],
    summary: "角度調整でダンベル種目の幅を広げるトレーニングベンチです。",
    bestFor: "ダンベルプレス、インクライン種目、腹筋種目まで自宅でまとめたい人",
    pros: ["角度調整で胸・肩・腹筋の種目を増やせる", "折りたたみ対応なら収納しやすい", "ダンベルやラックと組み合わせやすい"],
    cons: ["高重量で使うなら耐荷重と横揺れを確認したい", "収納時サイズと設置時の長さを先に測っておきたい"],
  },
  {
    matches: ["ハーフラック", "パワーラック", "パワーケージ", "スクワットラック"],
    summary: "ベンチプレスやスクワットを自宅で行うためのラックです。",
    bestFor: "バーベル種目を中心に、ホームジムを本格化したい人",
    pros: ["ベンチプレス・スクワット・懸垂を組みやすい", "セーフティーバーがあるモデルは一人練習しやすい", "高さ調整幅が広いと体格や種目に合わせやすい"],
    cons: ["設置スペースと天井高の確認が必須", "バーベル・プレート・床保護マットの費用も見込む必要がある"],
  },
  {
    matches: ["スミスマシン"],
    summary: "軌道が固定されたバーで高重量種目を練習しやすいスミスマシンです。",
    bestFor: "一人でもベンチプレスやスクワットを安定した軌道で行いたい人",
    pros: ["バー軌道が固定されフォームを安定させやすい", "セーフティーを使えば一人でも追い込みやすい", "低め設計なら一般家庭でも検討しやすい"],
    cons: ["フリーウエイトとは動作感が違う", "対応プレート穴径と設置寸法を必ず確認したい"],
  },
  {
    matches: ["懸垂マシン", "チンニングスタンド", "ぶら下がり健康器"],
    summary: "自宅で懸垂・ディップス・腹筋系を行いやすくするスタンドです。",
    bestFor: "背中を鍛える入口として、まず懸垂環境を作りたい人",
    pros: ["懸垂やぶら下がりを自宅で習慣化しやすい", "高さ調整できるモデルは家族でも使いやすい", "ラックより導入費用と場所を抑えやすい"],
    cons: ["体重や反動の大きい動作では揺れを確認したい", "身長に対して高さが足りるか事前に見たい"],
  },
  {
    matches: ["マルチホームジム", "ホームジムdx", "マルチジム", "マルチトレーニング"],
    summary: "ケーブル系を含む全身トレーニングを1台にまとめるホームジムマシンです。",
    bestFor: "フリーウエイトよりも、決まった軌道で全身を安全に鍛えたい人",
    pros: ["胸・背中・脚・腕を1台で回しやすい", "ケーブル種目が使えるため初心者でも扱いやすい", "ジムに近い種目構成を自宅に作れる"],
    cons: ["搬入経路と組み立てスペースの確認が必要", "本格ラックほど自由な拡張性は期待しにくい"],
  },
  {
    matches: ["ジョイントマット", "ジムマット", "トレーニングマット"],
    summary: "器具の下に敷いて床保護・防音・衝撃吸収を担うマットです。",
    bestFor: "ダンベルやラックを置く前に、床の傷と振動対策を整えたい人",
    pros: ["床の傷やへこみを抑えやすい", "ジョイント式なら部屋の広さに合わせて敷ける", "器具まわりの見た目も整えやすい"],
    cons: ["高重量ラック下では厚みだけでなく硬さも見たい", "広い範囲に敷く場合は必要枚数の計算が必要"],
  },
  {
    matches: ["フィルムミラー", "割れない", "全身鏡", "ホームジムミラー"],
    summary: "フォーム確認に使いやすい大型ミラーです。",
    bestFor: "スクワットやプレスの姿勢を見ながら、安全にフォーム改善したい人",
    pros: ["全身のフォームを確認しやすい", "割れにくいタイプは家庭のトレーニング部屋でも安心感がある", "部屋を広く見せる効果もある"],
    cons: ["フィルム式は強い接触や鋭利な物に注意したい", "壁掛け・立て掛けなど設置方法を先に決めたい"],
  },
  {
    matches: ["ランニングマシン", "ルームランナー", "ウォーキングマシン", "walkingpad"],
    summary: "室内でウォーキングやランニングを続けるための有酸素マシンです。",
    bestFor: "天気や時間に左右されず、室内で有酸素運動を習慣化したい人",
    pros: ["歩行からランニングまで日常的に使いやすい", "折りたたみ対応なら収納しやすい", "速度や傾斜調整で運動強度を変えられる"],
    cons: ["走行音と床振動への対策を考えたい", "最高速度・ベルト幅・表示単位を確認して選びたい"],
  },
  {
    matches: ["壁 固定", "プルアップバー"],
    summary: "壁面を使って懸垂環境を作る固定式プルアップバーです。",
    bestFor: "床置き器具を増やさず、壁面を使って背中トレーニング環境を作りたい人",
    pros: ["床スペースをほぼ使わず懸垂できる", "パラレルグリップなど握りを変えやすい", "固定できればスタンド式より揺れを抑えやすい"],
    cons: ["壁の強度と取り付け条件の確認が必須", "賃貸や下地が弱い壁では導入しにくい"],
  },
];

const categoryFallbackCopy: Record<ProductCategory, RankingCopy> = {
  "multi-home-gym": {
    summary: "全身トレーニングを1台にまとめやすい大型器具です。",
    bestFor: "自宅でジムに近い種目数を確保したい人",
    pros: ["複数部位を1台で鍛えやすい", "軌道が決まっていて初心者でも扱いやすい", "器具を増やしすぎず全身メニューを作れる"],
    cons: ["搬入・組み立て・設置面積の確認が必要", "将来の拡張性はラック構成より限られやすい"],
  },
  "power-rack": {
    summary: "バーベル種目を中心に据えるためのラックです。",
    bestFor: "ベンチプレスやスクワットを本格的に伸ばしたい人",
    pros: ["高重量の基本種目を組みやすい", "セーフティーを使えば一人でも練習しやすい", "ベンチやプレートを足して拡張できる"],
    cons: ["天井高と床補強を先に確認したい", "周辺器具込みの予算で考える必要がある"],
  },
  "pull-up-stand": {
    summary: "自宅で懸垂を行うための省スペース器具です。",
    bestFor: "背中トレーニングを自宅で始めたい人",
    pros: ["懸垂を習慣化しやすい", "比較的低予算で導入できる", "腕立てや腹筋系に使えるモデルもある"],
    cons: ["反動を使うと揺れやすい", "高さと耐荷重を体格に合わせて確認したい"],
  },
  "adjustable-dumbbell": {
    summary: "重量変更できるダンベルで、省スペースに種目を増やせます。",
    bestFor: "自宅でダンベル中心の全身メニューを作りたい人",
    pros: ["複数重量を1台に集約できる", "種目ごとに重量を変えやすい", "ベンチと組み合わせると幅が広がる"],
    cons: ["落下や衝撃には注意が必要", "最大重量と刻み幅が目的に合うか確認したい"],
  },
  bench: {
    summary: "ダンベルやラック種目の幅を広げるベンチです。",
    bestFor: "胸・肩・腹筋の種目を増やしたい人",
    pros: ["角度調整で種目が増える", "ダンベルとの相性が良い", "折りたたみ式なら収納しやすい"],
    cons: ["高重量では耐荷重と安定感を確認したい", "設置時と収納時のサイズを見たい"],
  },
  "floor-mat": {
    summary: "床保護と防音対策の土台になるマットです。",
    bestFor: "器具を置く前に床と振動対策を整えたい人",
    pros: ["床の傷を抑えやすい", "必要範囲に合わせて敷ける", "器具の設置感を整えやすい"],
    cons: ["高重量器具では硬さも重要", "広い部屋では枚数が増えやすい"],
  },
  mirror: {
    summary: "フォーム確認に役立つ全身ミラーです。",
    bestFor: "姿勢を見ながらトレーニングしたい人",
    pros: ["フォームの崩れを確認しやすい", "部屋を広く見せやすい", "ダンスやヨガにも使いやすい"],
    cons: ["設置方法の確認が必要", "フィルム式は傷つきに注意したい"],
  },
  cardio: {
    summary: "室内で有酸素運動を続けやすくする器具です。",
    bestFor: "天気に左右されず歩行・ランニングを続けたい人",
    pros: ["運動を習慣化しやすい", "速度調整で強度を変えられる", "折りたたみ式なら置きやすい"],
    cons: ["走行音と振動対策が必要", "ベルト幅と最高速度を確認したい"],
  },
  "compact-gym": {
    summary: "限られた部屋でトレーニング環境を作りやすい器具です。",
    bestFor: "省スペースでもホームジムを形にしたい人",
    pros: ["部屋の一角に置きやすい", "必要な種目から始めやすい", "器具を増やしすぎず運用しやすい"],
    cons: ["本格ジムほどの拡張性は限られる", "設置寸法と動作スペースを確認したい"],
  },
  accessory: {
    summary: "既存メニューを補強するためのトレーニング小物です。",
    bestFor: "メイン器具に足して、効かせ方や安全性を高めたい人",
    pros: ["低予算でメニューを強化しやすい", "収納場所を取りにくい", "苦手種目の補助に使いやすい"],
    cons: ["単体では主役になりにくい", "目的に合わない小物を買うと出番が少なくなる"],
  },
};
