import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = "https://cxmutmoxmbfbrnwctppm.supabase.co";
const DRY_RUN = process.argv.includes("--dry-run");

loadEnvFile(".env.local");

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) fail("SUPABASE_SERVICE_ROLE_KEY is required.");

const products = readJson("src/data/affiliate-products.json");
const rows = buildRows(products);

if (!rows.length) fail("No Amazon associate links to seed.");

if (DRY_RUN) {
  console.log(`Dry run: ${rows.length} amazon_associate_links rows ready.`);
  console.log(rows.map((row) => `${row.slot_key}: ${row.legacy_product_id}`).join("\n"));
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, serviceRoleKey, {
  auth: { persistSession: false },
});

const { error } = await supabase.from("amazon_associate_links").upsert(rows, {
  onConflict: "slot_key",
});

if (error) fail(`Failed to seed amazon associate links: ${error.message}`);

console.log(`Seeded ${rows.length} amazon_associate_links rows.`);

function buildRows(products) {
  const slotAssignments = new Map([
    ["wasai-mk780-half-rack", { category: "power-rack", rank: 1 }],
    ["barwing-hhr01-half-rack", { category: "power-rack", rank: 2 }],
    ["irotec-multi-power-rack", { category: "power-rack", rank: 3 }],
    ["lysin-helixmirror-40kg", { category: "adjustable-dumbbell", rank: 1 }],
    ["flexbell-20kg-2kg-pair", { category: "adjustable-dumbbell", rank: 2 }],
    ["barwing-adjustable-dumbbell-24kg-pair", { category: "adjustable-dumbbell", rank: 3 }],
    ["barwing-bw-ajb06-bench", { category: "bench", rank: 1 }],
    ["gogojump-folding-training-bench", { category: "bench", rank: 2 }],
    ["barwing-dc04-training-bench", { category: "bench", rank: 3 }],
    ["airhop-joint-mat", { category: "floor-mat", rank: 1 }],
    ["kawashima-structural-plywood-12mm", { category: "floor-mat", rank: 2 }],
    ["showa-eva-joint-mat-12mm", { category: "floor-mat", rank: 3 }],
  ]);

  if (!Array.isArray(products)) return [];

  return products
    .map((product) => {
      const slot = slotAssignments.get(product.id);
      if (!slot) return null;

      return {
        slot_key: `${slot.category}-${slot.rank}`,
        category: slot.category,
        rank: slot.rank,
        legacy_product_id: product.id,
        genre: product.genre,
        product_name: product.name,
        maker: product.maker,
        affiliate_url: product.affiliateUrl,
        image_url: product.imageUrl,
        keywords: product.keywords ?? [],
        is_active: true,
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean);
}

function readJson(relativePath) {
  const filePath = path.resolve(process.cwd(), relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadEnvFile(relativePath) {
  const filePath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
