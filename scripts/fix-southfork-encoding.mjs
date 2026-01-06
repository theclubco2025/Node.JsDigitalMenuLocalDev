import { promises as fs } from "fs";
import path from "path";

const ROOT = process.cwd();
const TENANT_DIR = path.join(ROOT, "data", "tenants", "southforkgrille");

const REPLACEMENTS = [
  // Dashes / bullets
  [/\s*ΓÇö\s*/g, " — "], // em dash
  [/\s*ΓÇó\s*/g, " • "], // bullet
  // Quotes / apostrophes
  [/ΓÇÖ/g, "’"],
  [/ΓÇÿ/g, "‘"],
  // Accents
  [/├▒/g, "ñ"],
  [/├⌐/g, "é"],
];

function fixString(s) {
  if (typeof s !== "string") return s;
  let out = s.replace(/^\uFEFF/, ""); // strip BOM if present
  for (const [re, rep] of REPLACEMENTS) out = out.replace(re, rep);
  out = out
    .replace(/\s+—\s+/g, " — ")
    .replace(/\s+•\s+/g, " • ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return out;
}

function walk(v) {
  if (Array.isArray(v)) return v.map(walk);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) {
      out[fixString(k)] = walk(val);
    }
    return out;
  }
  return fixString(v);
}

async function main() {
  const files = ["brand.json", "copy.json", "menu.json", "style.json", "theme.json", "images.json"];
  for (const f of files) {
    const fp = path.join(TENANT_DIR, f);
    let raw = await fs.readFile(fp, "utf8");
    raw = raw.replace(/^\uFEFF/, "");
    const json = JSON.parse(raw);
    const fixed = walk(json);
    await fs.writeFile(fp, JSON.stringify(fixed, null, 2) + "\n", "utf8");
    console.log("fixed", f);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


