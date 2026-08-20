// One-off: generate diagram images (gpt-image) and optimize official product
// photos for the KENSUI kaku article (home-gym-compact-20260820-kensui-kaku).
// Usage: node scripts/generate-kensui-images.mjs <dir-with-downloaded-photos>
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const SLUG = "home-gym-compact-20260820-kensui-kaku";
const OUT_DIR = path.join(ROOT, "public", "blog", SLUG);
const AFFILIATE_OUT = path.join(ROOT, "public", "affiliate-products", "kensui-kaku.webp");
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
const BLOG_IMAGE_MAX_WIDTH = 1200;
const BLOG_IMAGE_WEBP_QUALITY = 74;

const photoDir = process.argv[2];
if (!photoDir) fail("Pass the directory containing the downloaded official photos.");

await loadEnvFile(".env.local");
if (!process.env.OPENAI_API_KEY) fail("OPENAI_API_KEY is required.");

const diagrams = [
  {
    file: "image-01.webp",
    title: "自宅で懸垂を諦める3つの壁",
    kind: "comparison",
    brief:
      "3-card layout showing the three obstacles to home pull-ups: card 1 「場所がない」 with a chinning stand occupying about 1 tatami of floor, card 2 「ドア枠が心配」 with a door-frame bar and a crack warning icon, card 3 「家族の理解」 with a family silhouette. Short Japanese labels only.",
  },
  {
    file: "image-02.webp",
    title: "懸垂バー3方式の比較",
    kind: "comparison",
    brief:
      "3-column comparison of home pull-up bar types. Column 1 「ドア枠式」: price ◎, strength depends on door frame △. Column 2 「チンニングスタンド」: stable ○, floor space about 1 tatami △. Column 3 「突っ張り式」: footprint 18cm×18cm ◎, no construction 工事不要 ◎. Use simple icons of each type and short Japanese labels only.",
  },
];

await fs.mkdir(OUT_DIR, { recursive: true });

for (const diagram of diagrams) {
  const bytes = await generateImage(diagram);
  await fs.writeFile(path.join(OUT_DIR, diagram.file), await optimizeBlogImage(bytes));
  console.log(`[gpt-image] ${diagram.file} done`);
}

const photos = [
  { src: "1_2.webp", out: "product-01.webp" },
  { src: "064c.webp", out: "product-02.webp" },
  { src: "model1_1.webp", out: "product-03.webp" },
];

for (const photo of photos) {
  const bytes = await fs.readFile(path.join(photoDir, photo.src));
  await fs.writeFile(path.join(OUT_DIR, photo.out), await optimizeBlogImage(bytes));
  console.log(`[photo] ${photo.out} done`);
}

await fs.writeFile(
  AFFILIATE_OUT,
  await sharp(await fs.readFile(path.join(photoDir, "1_2.webp")))
    .rotate()
    .resize({ width: 640, withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toBuffer(),
);
console.log("[photo] affiliate-products/kensui-kaku.webp done");

async function generateImage(visual) {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_IMAGE_MODEL,
      prompt: buildImagePrompt(visual),
      quality: "high",
      output_format: "webp",
      n: 1,
    }),
    signal: AbortSignal.timeout(260_000),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    fail(`OpenAI image request failed: ${response.status} ${message.slice(0, 300)}`);
  }

  const payload = await response.json();
  const base64 = payload?.data?.[0]?.b64_json;
  if (typeof base64 !== "string") fail("OpenAI image response did not contain b64_json.");
  return Buffer.from(base64, "base64");
}

async function optimizeBlogImage(bytes) {
  return sharp(bytes)
    .rotate()
    .resize({ width: BLOG_IMAGE_MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: BLOG_IMAGE_WEBP_QUALITY, effort: 6 })
    .toBuffer();
}

function buildImagePrompt(visual) {
  return `Create a high-quality editorial infographic image for a Japanese home gym article.
Article keyword: 懸垂バー 自宅
Article title: 自宅に懸垂バーを置くなら突っ張り式。KENSUI kakuを徹底解説
Visual title: ${visual.title}
Visual kind: ${visual.kind}
Required content:
${visual.brief}

Design requirements:
- The image must directly explain the required content above.
- Use a clean, bright editorial fitness style that fits a light home gym website.
- Prefer white or warm off-white backgrounds, high contrast dark text, and orange accents.
- Design mobile-first. It should be instantly understandable on a smartphone screen.
- Reduce information density. Use one clear message per image and at most three main sections, cards, steps, or comparison columns.
- Keep Japanese text very short: headline plus short labels only. Avoid paragraphs, dense tables, tiny annotations, footnotes, and long lists.
- Use large readable typography, generous spacing, and big simple icons or shapes.
- Prefer simple layouts: 3-step flow, 3-card comparison, one room layout diagram, or a short checklist with 3 items.
- No brand logos, no fictional prices presented as official product prices, no watermarks.
- 16:9 horizontal infographic, polished, practical, not decorative.`;
}

async function loadEnvFile(relativePath) {
  try {
    const contents = await fs.readFile(path.resolve(ROOT, relativePath), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // env vars may already be provided.
  }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
