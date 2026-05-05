import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = ["src"];
const targetExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".json"]);
const mojibakePattern = /縺|繧|譁|螟|蜀|謚|荳|隕|譛|雋|蠎|蝎|髱|鬆|逕|晄|繝|莨|菫|蜈/;
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

      if (!targetExtensions.has(path.extname(entry.name))) {
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
