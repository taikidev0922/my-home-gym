import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

await loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://cxmutmoxmbfbrnwctppm.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "blog-images";

if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const { data: articles, error } = await supabase
  .from("blog_articles")
  .select("slug,image_url,blocks")
  .order("published_at", { ascending: false });

if (error) throw error;

const referenced = [];
const nonWebpReferences = [];

for (const article of articles ?? []) {
  inspectUrl(article.slug, "image_url", article.image_url);
  const blocks = Array.isArray(article.blocks) ? article.blocks : [];
  for (const [index, block] of blocks.entries()) {
    inspectUrl(article.slug, `blocks[${index}].visual.imageUrl`, block?.visual?.imageUrl);
  }
}

const storageFiles = [];
await listStorageFiles("generated");
const nonWebpStorageFiles = storageFiles.filter((file) => !file.name.toLowerCase().endsWith(".webp"));

console.log(JSON.stringify(
  {
    articleCount: articles?.length ?? 0,
    referencedImageCount: referenced.length,
    nonWebpReferenceCount: nonWebpReferences.length,
    nonWebpReferences,
    storageFileCount: storageFiles.length,
    nonWebpStorageFileCount: nonWebpStorageFiles.length,
    nonWebpStorageFiles,
  },
  null,
  2,
));

function inspectUrl(slug, field, url) {
  if (typeof url !== "string" || !url) return;
  if (!url.includes(`/storage/v1/object/public/${bucket}/`)) return;
  referenced.push({ slug, field, url });
  if (!url.toLowerCase().split("?")[0].endsWith(".webp")) {
    nonWebpReferences.push({ slug, field, url });
  }
}

async function listStorageFiles(prefix) {
  const { data, error: listError } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (listError) throw listError;

  for (const item of data ?? []) {
    const itemPath = `${prefix}/${item.name}`;
    if (item.id === null) {
      await listStorageFiles(itemPath);
    } else {
      storageFiles.push({ name: itemPath, metadata: item.metadata ?? null });
    }
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
