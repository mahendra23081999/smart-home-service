// Downloads every photo listed in src/lib/photos.json into public/images/<key>.jpg (1600px wide).
// Usage: npm run images          (skips files that already exist)
//        npm run images -- --force
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { photos } = JSON.parse(await readFile(path.join(root, "src/lib/photos.json"), "utf8"));
const outDir = path.join(root, "public/images");
await mkdir(outDir, { recursive: true });
const force = process.argv.includes("--force");

const sized = (u) => u.includes("images.pexels.com")
  ? `${u}?auto=compress&cs=tinysrgb&w=1600`
  : `${u}?auto=format&fit=crop&w=1600&q=80&fm=jpg`;

let ok = 0, failed = 0;
for (const [key, p] of Object.entries(photos)) {
  const file = path.join(outDir, `${key}.jpg`);
  if (!force) { try { await stat(file); console.log(`skip  ${key} (exists)`); ok++; continue; } catch { /* download */ } }
  try {
    const res = await fetch(sized(p.remote), { headers: { "User-Agent": "Mozilla/5.0 (site image setup)" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get("content-type") || "";
    if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(file, buf);
    console.log(`ok    ${key}  ${(buf.length / 1024).toFixed(0)} KB  ${type}`); ok++;
  } catch (e) { console.log(`FAIL  ${key}  ${e.message}  (${p.remote})`); failed++; }
}
console.log(`\n${ok} ready, ${failed} failed. Failed photos fall back to the illustration on the site.`);
process.exit(failed ? 1 : 0);
