import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createClient } from "@supabase/supabase-js";

await loadEnvFile(".env.local");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://cxmutmoxmbfbrnwctppm.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "blog-images";

if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is required.");

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const storageFiles = [];
await listStorageFiles("generated");

const nonWebpFiles = storageFiles.filter((file) => !file.toLowerCase().endsWith(".webp"));

if (nonWebpFiles.length > 0) {
  const { error } = await supabase.storage.from(bucket).remove(nonWebpFiles);
  if (error) throw error;
}

console.log(`Removed ${nonWebpFiles.length} non-WebP blog image files.`);

async function listStorageFiles(prefix) {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) throw error;

  for (const item of data ?? []) {
    const itemPath = `${prefix}/${item.name}`;
    if (item.id === null) {
      await listStorageFiles(itemPath);
    } else {
      storageFiles.push(itemPath);
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
