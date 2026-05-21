import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["src", "scripts"];
const targetExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".json"]);
const ignoredFiles = new Set([
  path.normalize("src/data/blog-articles.ts"),
  path.normalize("src/lib/blog-repository.ts"),
  path.normalize("scripts/check-mojibake.mjs"),
]);
const mojibakePattern = /[\u7e1d\u7e67\u7e3a\u8708\u8b41\u87b3\u83a0\u874e\u8b6b\u8b28\u9ae6\u9035]|[\uff61-\uff9f]{3,}/;
const hits = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        return;
      }

      if (!targetExtensions.has(path.extname(entry.name)) || ignoredFiles.has(path.normalize(fullPath))) {
        return;
      }

      const content = await readFile(fullPath, "utf8");
      content.split(/\r?\n/).forEach((line, index) => {
        if (mojibakePattern.test(line)) {
          hits.push(`${fullPath}:${index + 1}: ${line.trim()}`);
        }
      });
    }),
  );
}

for (const root of roots) {
  await walk(root);
}

if (hits.length) {
  console.error("Mojibake-like text was found. Fix these lines before building:");
  for (const hit of hits) {
    console.error(`- ${hit}`);
  }
  process.exit(1);
}
