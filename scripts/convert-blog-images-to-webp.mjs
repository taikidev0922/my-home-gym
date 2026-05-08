import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

await loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://cxmutmoxmbfbrnwctppm.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "blog-images";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const { data: articles, error } = await supabase
  .from("blog_articles")
  .select("id,slug,image_url,blocks")
  .order("published_at", { ascending: false });

if (error) throw error;

let convertedCount = 0;
const pathsToRemove = new Set();

for (const article of articles ?? []) {
  const blocks = Array.isArray(article.blocks) ? article.blocks : [];
  const replacements = new Map();

  collectBlogImageUrl(article.image_url, replacements);
  for (const block of blocks) collectBlogImageUrl(block?.visual?.imageUrl, replacements);

  if (replacements.size === 0) continue;

  for (const [oldUrl, info] of replacements) {
    if (info.newUrl) continue;

    const response = await fetch(oldUrl);
    if (!response.ok) {
      console.warn(`skip: failed to fetch ${oldUrl} (${response.status})`);
      continue;
    }

    const sourceBytes = Buffer.from(await response.arrayBuffer());
    const webpBytes = await sharp(sourceBytes).webp({ lossless: true }).toBuffer();
    const { error: uploadError } = await supabase.storage.from(bucket).upload(info.newPath, webpBytes, {
      contentType: "image/webp",
      upsert: true,
    });

    if (uploadError) {
      console.warn(`skip: failed to upload ${info.newPath}`, uploadError.message);
      continue;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(info.newPath);
    info.newUrl = data.publicUrl;
    pathsToRemove.add(info.oldPath);
    convertedCount += 1;
  }

  const nextImageUrl = replacements.get(article.image_url)?.newUrl ?? article.image_url;
  const nextBlocks = blocks.map((block) => {
    const imageUrl = block?.visual?.imageUrl;
    const newUrl = replacements.get(imageUrl)?.newUrl;
    if (!newUrl || !block?.visual) return block;
    return {
      ...block,
      visual: {
        ...block.visual,
        imageUrl: newUrl,
      },
    };
  });

  const hasBlockChange = JSON.stringify(nextBlocks) !== JSON.stringify(blocks);
  if (nextImageUrl !== article.image_url || hasBlockChange) {
    const { error: updateError } = await supabase
      .from("blog_articles")
      .update({
        image_url: nextImageUrl,
        blocks: nextBlocks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", article.id);

    if (updateError) throw updateError;
    console.log(`updated ${article.slug}`);
  }
}

if (pathsToRemove.size > 0) {
  const { error: removeError } = await supabase.storage.from(bucket).remove(Array.from(pathsToRemove));
  if (removeError) console.warn("failed to remove old PNG files", removeError.message);
}

console.log(`Converted ${convertedCount} blog images to WebP.`);

function collectBlogImageUrl(url, replacements) {
  if (typeof url !== "string") return;
  const oldPath = getBlogImageStoragePath(url);
  if (!oldPath || !oldPath.endsWith(".png")) return;

  const newPath = oldPath.replace(/\.png$/i, ".webp");
  replacements.set(url, {
    oldPath,
    newPath,
    newUrl: "",
  });
}

function getBlogImageStoragePath(url) {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex === -1) return "";
    return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
  } catch {
    return "";
  }
}

async function loadEnvFile(fileName) {
  const envPath = path.join(process.cwd(), fileName);
  let content = "";

  try {
    content = await readFile(envPath, "utf8");
  } catch {
    return;
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const equalsIndex = trimmed.indexOf("=");
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    value = value.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}
