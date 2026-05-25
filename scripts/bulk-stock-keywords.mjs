/**
 * bulk-stock-keywords.mjs
 * ホームジム関連キーワードを Rakko API から大量取得し
 * src/data/keyword-stock.json に保存する
 *
 * Usage:
 *   node scripts/bulk-stock-keywords.mjs           # 本番実行
 *   node scripts/bulk-stock-keywords.mjs --dry-run  # DBに保存しない
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from './lib/env.mjs';

loadEnv('.env.local');

const ROOT = process.cwd();
const STOCK_PATH = path.join(ROOT, 'src', 'data', 'keyword-stock.json');
const ENDPOINT = 'https://api.rakkokeyword.com/v1/suggest-keywords';
const DELAY_MS = 1000;
const DRY_RUN = process.argv.includes('--dry-run');

// ── ネガティブキーワード ──────────────────────────────────────────────────
const NEGATIVE = [
  '退会', 'ログイン', '中古車', '求人', '株価',
  'プロテイン 女性', 'サプリ', 'ジム 退会',
  'エニタイム', 'チョコザップ', 'ライザップ',
  'ゴールドジム 月額', 'スポーツジム 費用',
];

// ── 関連キーワードに含まれるべき語 ───────────────────────────────────────
const REQUIRED_TERMS = [
  'ホームジム', '家トレ', '宅トレ', '筋トレ器具',
  '筋トレ 部屋', '自宅 筋トレ', '自宅 トレーニング',
  'パワーラック', 'ハーフラック', 'スミスマシン',
  '懸垂マシン', 'チンニング', 'チンニングスタンド',
  '可変式ダンベル', 'ダンベル', 'バーベル', 'プレート',
  'トレーニングベンチ', 'インクラインベンチ', 'アジャスタブルベンチ',
  'フラットベンチ', 'マルチベンチ',
  'ジムマット', 'ジョイントマット', 'トレーニングマット',
  '防音', '防振', '床材', '床補強',
  'トレーニングミラー',
  'ケーブルマシン', 'マルチホームジム', 'チューブ 筋トレ',
  'バーベルラック', 'スクワットラック',
  '筋トレ 器具', '筋トレ 道具', 'トレーニング器具',
  '自宅 ジム', '家庭用 ジム',
];

// ── シード定義 ────────────────────────────────────────────────────────────
const SEEDS = [
  // ── guide: ホームジム全般 ──────────────────────────────────────────────
  { cat: 'guide', seed: 'ホームジム 作り方' },
  { cat: 'guide', seed: 'ホームジム 予算' },
  { cat: 'guide', seed: 'ホームジム 広さ' },
  { cat: 'guide', seed: 'ホームジム おすすめ' },
  { cat: 'guide', seed: 'ホームジム 費用' },
  { cat: 'guide', seed: 'ホームジム 賃貸' },
  { cat: 'guide', seed: 'ホームジム 一人暮らし' },
  { cat: 'guide', seed: 'ホームジム メリット' },
  { cat: 'guide', seed: 'ホームジム 後悔' },
  { cat: 'guide', seed: 'ホームジム レイアウト' },
  { cat: 'guide', seed: 'ホームジム 二畳' },
  { cat: 'guide', seed: 'ホームジム 4畳' },
  { cat: 'guide', seed: 'ホームジム 6畳' },
  { cat: 'guide', seed: 'ホームジム 8畳' },
  { cat: 'guide', seed: 'ホームジム 防音' },
  { cat: 'guide', seed: 'ホームジム 床補強' },
  { cat: 'guide', seed: 'ホームジム 必要' },
  { cat: 'guide', seed: '家トレ 器具' },
  { cat: 'guide', seed: '宅トレ 器具' },
  { cat: 'guide', seed: '自宅 筋トレ' },
  { cat: 'guide', seed: '筋トレ 部屋' },
  { cat: 'guide', seed: '自宅 ジム 作り方' },
  { cat: 'guide', seed: 'トレーニング 器具 おすすめ' },
  { cat: 'guide', seed: '筋トレ 器具 初心者' },
  { cat: 'guide', seed: 'ホームジム 何畳' },

  // ── rack: ラック・バーベル系 ───────────────────────────────────────────
  { cat: 'rack', seed: 'パワーラック おすすめ' },
  { cat: 'rack', seed: 'パワーラック 選び方' },
  { cat: 'rack', seed: 'パワーラック 自宅' },
  { cat: 'rack', seed: 'パワーラック 天井高' },
  { cat: 'rack', seed: 'パワーラック 床補強' },
  { cat: 'rack', seed: 'パワーラック 必要スペース' },
  { cat: 'rack', seed: 'ハーフラック おすすめ' },
  { cat: 'rack', seed: 'ハーフラック 自宅' },
  { cat: 'rack', seed: 'スミスマシン おすすめ' },
  { cat: 'rack', seed: 'スミスマシン 自宅' },
  { cat: 'rack', seed: 'バーベル おすすめ' },
  { cat: 'rack', seed: 'バーベル セット' },
  { cat: 'rack', seed: 'バーベルラック おすすめ' },
  { cat: 'rack', seed: 'ベンチプレス 自宅' },
  { cat: 'rack', seed: 'スクワットラック おすすめ' },

  // ── dumbbell: ダンベル系 ───────────────────────────────────────────────
  { cat: 'dumbbell', seed: 'ダンベル おすすめ' },
  { cat: 'dumbbell', seed: 'ダンベル 選び方' },
  { cat: 'dumbbell', seed: '可変式ダンベル おすすめ' },
  { cat: 'dumbbell', seed: '可変式ダンベル 選び方' },
  { cat: 'dumbbell', seed: '可変式ダンベル 比較' },
  { cat: 'dumbbell', seed: '可変式ダンベル 20kg' },
  { cat: 'dumbbell', seed: '可変式ダンベル 32kg' },
  { cat: 'dumbbell', seed: '可変式ダンベル 40kg' },
  { cat: 'dumbbell', seed: '可変式ダンベル 安い' },
  { cat: 'dumbbell', seed: 'ダンベル 重量 目安' },
  { cat: 'dumbbell', seed: 'ダンベル セット おすすめ' },
  { cat: 'dumbbell', seed: 'ダンベル 家トレ' },
  { cat: 'dumbbell', seed: 'ダンベル 初心者' },
  { cat: 'dumbbell', seed: 'ダンベル メニュー 自宅' },

  // ── bench: ベンチ系 ────────────────────────────────────────────────────
  { cat: 'bench', seed: 'トレーニングベンチ おすすめ' },
  { cat: 'bench', seed: 'トレーニングベンチ 選び方' },
  { cat: 'bench', seed: 'インクラインベンチ おすすめ' },
  { cat: 'bench', seed: 'アジャスタブルベンチ おすすめ' },
  { cat: 'bench', seed: 'フラットベンチ おすすめ' },
  { cat: 'bench', seed: '折りたたみ ベンチ おすすめ' },
  { cat: 'bench', seed: 'トレーニングベンチ 折りたたみ' },
  { cat: 'bench', seed: 'インクラインベンチ 折りたたみ' },
  { cat: 'bench', seed: 'ベンチプレス ベンチ おすすめ' },

  // ── floor: 床材・マット・防音 ──────────────────────────────────────────
  { cat: 'floor', seed: 'ジムマット おすすめ' },
  { cat: 'floor', seed: 'ジョイントマット 筋トレ' },
  { cat: 'floor', seed: 'トレーニングマット おすすめ' },
  { cat: 'floor', seed: 'ホームジム 床材 おすすめ' },
  { cat: 'floor', seed: 'ホームジム 防音 対策' },
  { cat: 'floor', seed: '賃貸 筋トレ 防音' },
  { cat: 'floor', seed: 'ダンベル 床 防音' },
  { cat: 'floor', seed: 'ゴムマット 筋トレ' },
  { cat: 'floor', seed: '防振マット ダンベル' },
  { cat: 'floor', seed: 'ジムマット 厚さ' },
  { cat: 'floor', seed: '筋トレ マット 防音' },

  // ── compact: 省スペース・コンパクト器具 ───────────────────────────────
  { cat: 'compact', seed: '懸垂マシン おすすめ' },
  { cat: 'compact', seed: '懸垂マシン 省スペース' },
  { cat: 'compact', seed: 'チンニングスタンド おすすめ' },
  { cat: 'compact', seed: '省スペース 筋トレ器具' },
  { cat: 'compact', seed: '狭い部屋 筋トレ' },
  { cat: 'compact', seed: 'チューブ 筋トレ 自宅' },
  { cat: 'compact', seed: 'トレーニングミラー おすすめ' },
  { cat: 'compact', seed: 'ケーブルマシン 自宅' },
  { cat: 'compact', seed: 'マルチホームジム おすすめ' },
  { cat: 'compact', seed: '折りたたみ 筋トレ器具' },
  { cat: 'compact', seed: '懸垂バー おすすめ' },
];

// ── スコアリング ──────────────────────────────────────────────────────────
function scoreKeyword(item) {
  const metrics = item.metrics || {};
  const volume = Number(metrics.searchVolume || 0);
  const difficulty = Number(metrics.seoDifficulty ?? 50);
  const competition = Number(metrics.competition ?? 50);
  const text = item.keyword || '';
  if (NEGATIVE.some((n) => text.includes(n))) return -999;
  if (difficulty >= 55) return -100;  // ホームジム系は難易度高め閾値を緩和
  if (volume < 30) return -20;
  const longTailBonus = text.length >= 8 ? 12 : 0;
  const intentBonus = /おすすめ|選び方|比較|初心者|作り方|費用|予算|設置|防音|後悔|必要/.test(text) ? 10 : 0;
  return Math.round(volume / 100 + (55 - difficulty) * 1.5 + (50 - competition) * 0.8 + longTailBonus + intentBonus);
}

function inferCategory(keyword) {
  if (/パワーラック|ハーフラック|スミスマシン|バーベルラック|スクワットラック|バーベル|ベンチプレス/.test(keyword)) return 'rack';
  if (/可変式ダンベル|ダンベル/.test(keyword)) return 'dumbbell';
  if (/トレーニングベンチ|インクラインベンチ|アジャスタブルベンチ|フラットベンチ|マルチベンチ/.test(keyword)) return 'bench';
  if (/ジムマット|ジョイントマット|トレーニングマット|床材|防音|防振|ゴムマット|防振マット/.test(keyword)) return 'floor';
  if (/懸垂マシン|チンニング|省スペース|狭い部屋|チューブ 筋トレ|トレーニングミラー|ケーブルマシン|マルチホームジム|折りたたみ/.test(keyword)) return 'compact';
  return 'guide';
}

function isHomeGymKeyword(keyword) {
  if (keyword.length < 4 || keyword.length > 80) return false;
  if (NEGATIVE.some((n) => keyword.includes(n))) return false;
  return REQUIRED_TERMS.some((term) => keyword.includes(term));
}

// ── メイン処理 ────────────────────────────────────────────────────────────
const apiKey = process.env.RAKKO_KEYWORD_API_KEY;
if (!apiKey) {
  console.error('❌ RAKKO_KEYWORD_API_KEY が設定されていません');
  process.exit(1);
}

// 既存ストックを読み込む（重複チェック用）
let existingStock = [];
try {
  const raw = await fs.readFile(STOCK_PATH, 'utf8');
  existingStock = JSON.parse(raw);
} catch { /* 空ファイル or 初回 */ }
const existingKeywords = new Set(existingStock.map((item) => normalize(item.keyword)));

console.log('\n═══════════════════════════════════════════════════');
console.log(' 🏋️  ホームジム キーワードストック');
console.log('═══════════════════════════════════════════════════');
console.log(`シード数: ${SEEDS.length}件`);
console.log(`既存ストック: ${existingStock.length}件`);
console.log(`最大取得数: 約 ${SEEDS.length * 40} キーワード`);
if (DRY_RUN) console.log('⚠ DRY RUN モード: ファイルに保存しません');
console.log('───────────────────────────────────────────────────\n');

let totalFetched = 0;
let totalNew = 0;
let errors = 0;
const newKeywords = [];

for (let i = 0; i < SEEDS.length; i++) {
  const { cat, seed } = SEEDS[i];
  const progress = `[${String(i + 1).padStart(2, '0')}/${SEEDS.length}]`;
  process.stdout.write(`${progress} ${cat.padEnd(8)} | "${seed}" ... `);

  try {
    const payload = {
      keyword: seed,
      modes: ['google'],
      increaseKeyword: true,
      filter: {
        seoDifficulty: { min: 0, max: 54 },
        searchVolume: { min: 30, max: 50000 },
      },
      sortBy: 'searchVolume',
      orderBy: 'desc',
      limit: 40,
    };

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.result) throw new Error(JSON.stringify(json.errors || json));

    const items = (json.data?.items || [])
      .filter((item) => item?.keyword && isHomeGymKeyword(item.keyword))
      .map((item) => {
        const sc = scoreKeyword(item);
        return {
          keyword: item.keyword,
          category: inferCategory(item.keyword),
          source: `rakko:${seed}:inc`,
          searchVolume: item.metrics?.searchVolume ?? 0,
          score: sc,
        };
      })
      .filter((item) => item.score > 0 && !existingKeywords.has(normalize(item.keyword)));

    totalFetched += json.data?.items?.length || 0;
    totalNew += items.length;
    newKeywords.push(...items);
    items.forEach((item) => existingKeywords.add(normalize(item.keyword)));

    console.log(`取得 ${String(json.data?.items?.length || 0).padStart(2)}件 → 新規 ${String(items.length).padStart(2)}件 ✅`);
  } catch (err) {
    console.log(`❌ エラー: ${err.message}`);
    errors++;
  }

  if (i < SEEDS.length - 1) await sleep(DELAY_MS);
}

// 既存ストックに追加・スコア降順ソートして保存
const merged = [...existingStock, ...newKeywords].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

if (!DRY_RUN) {
  await fs.writeFile(STOCK_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf8');
}

console.log('\n═══════════════════════════════════════════════════');
console.log(' 完了サマリー');
console.log('═══════════════════════════════════════════════════');
console.log(`総取得        : ${totalFetched} 件`);
console.log(`新規追加      : ${totalNew} 件 (score > 0, 重複除外済み)`);
console.log(`エラー        : ${errors} 件`);
console.log(`ストック合計  : ${merged.length} 件`);
if (DRY_RUN) {
  console.log('⚠ DRY RUN のため保存はスキップしました');
} else {
  console.log(`保存先        : ${STOCK_PATH}`);
}
console.log('═══════════════════════════════════════════════════\n');

function normalize(keyword) {
  return keyword.replace(/\s+/g, ' ').trim().toLowerCase();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
