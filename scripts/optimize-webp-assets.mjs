import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const publicRoot = path.join(root, "public");

const profiles = [
  { prefix: path.join(publicRoot, "blog") + path.sep, maxWidth: 1200, quality: 74 },
  { prefix: path.join(publicRoot, "affiliate-products") + path.sep, maxWidth: 900, quality: 76 },
  { prefix: publicRoot + path.sep, maxWidth: 512, quality: 80 },
];

const files = [];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(absolutePath);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".webp")) {
      files.push(absolutePath);
    }
  }
}

function profileFor(file) {
  return profiles.find((profile) => file.startsWith(profile.prefix)) ?? profiles.at(-1);
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

await walk(publicRoot);

let beforeTotal = 0;
let afterTotal = 0;

for (const file of files) {
  const profile = profileFor(file);
  const before = (await fs.stat(file)).size;
  const input = await fs.readFile(file);
  const metadata = await sharp(input).metadata();
  const width = metadata.width && metadata.width > profile.maxWidth ? profile.maxWidth : metadata.width;
  const output = await sharp(input)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: profile.quality, effort: 6 })
    .toBuffer();

  if (output.length < before) {
    const temporaryFile = `${file}.tmp`;
    await fs.writeFile(temporaryFile, output);
    await fs.rm(file);
    await fs.rename(temporaryFile, file);
  }

  const after = (await fs.stat(file)).size;
  beforeTotal += before;
  afterTotal += after;

  if (after !== before) {
    console.log(`${toPosix(path.relative(root, file))}: ${before} -> ${after}`);
  }
}

console.log(`Optimized ${files.length} WebP files: ${beforeTotal} -> ${afterTotal} bytes`);
