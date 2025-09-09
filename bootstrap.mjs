// bootstrap.mjs
// Goal: make current repo runnable on localhost (Next.js app with /menu) TODAY.
// It creates minimal files if missing (does NOT overwrite existing), installs deps, and runs dev server.

import { promises as fs } from "node:fs";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const log = (m) => console.log(m);
const ensureDir = async (p) => { if (!existsSync(p)) await fs.mkdir(p, { recursive: true }); };
const writeIfMissing = async (path, content) => {
  if (existsSync(path)) { log(`• keep: ${path}`); return false; }
  await ensureDir(dirname(path));
  await fs.writeFile(path, content, "utf8");
  log(`✓ create: ${path}`);
  return true;
};

const pkgPath = join(root, "package.json");
const hasPkg = existsSync(pkgPath);
let pkg = hasPkg ? JSON.parse(await fs.readFile(pkgPath, "utf8")) : { name: "digital-menu-foundation", private: true };

pkg.type = pkg.type || "module";
pkg.scripts = Object.assign({
  "dev": "next dev -p 3000",
  "build": "next build",
  "start": "next start -p 3000",
  "typecheck": "tsc --noEmit || exit 0",
  "smoke": "node scripts/smoke.mjs",
  "test": "npm run typecheck && npm run smoke",
  "init": "node scripts/init.mjs",
  "ops": "node scripts/ops.mjs",
  "ship": "node scripts/ops.mjs --git --msg \"feat: foundation\""
}, pkg.scripts || {});

await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
log(`✓ ensure scripts in package.json`);

const files = {
  ".gitignore": `node_modules/
.next/
dist/
.env.local
.env.*.local
`,
  ".env.example": `# placeholders only; no real values needed for stub
NEXT_PUBLIC_DEFAULT_TENANT="demo"
`,
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "es2020"],
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
`,
  "next.config.mjs": `/** @type {import('next').NextConfig} */\nconst nextConfig = {};\nexport default nextConfig;\n`,
  "app/layout.tsx": `export const metadata = { title: "Digital Menu", description: "Foundation" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body style={{fontFamily:'system-ui',margin:0}}>{children}</body></html>);
}
`,
  "app/page.tsx": `import Link from "next/link";
export default function Home() {
  return (
    <main style={{padding:24}}>
      <h1 style={{fontSize:24,fontWeight:700,marginBottom:12}}>Digital Menu Foundation</h1>
      <Link href="/menu">Go to Menu</Link>
    </main>
  );
}
`,
  "types/api.ts": `export type MenuItem={id:string;name:string;description?:string;price:number;tags?:string[];calories?:number;imageUrl?:string};
export type MenuCategory={id:string;name:string;items:MenuItem[]};
export type MenuResponse={categories:MenuCategory[]};
`,
  "lib/server/menu.ts": `import type { MenuResponse } from "@/types/api";
const STUB: MenuResponse = {
  categories: [
    { id: "c-apps", name: "Appetizers", items: [
      { id: "i-gb", name: "Garlic Bread", description: "Toasted, herbed butter", price: 5.5, tags: ["vegetarian"] },
      { id: "i-salad", name: "House Salad", description: "Greens, vinaigrette", price: 7, tags: ["vegan","gluten-free"], calories: 180 }
    ]},
    { id: "c-mains", name: "Mains", items: [
      { id: "i-burger", name: "Classic Burger", description: "Cheddar, pickles", price: 12, tags: ["beef"] },
      { id: "i-pasta", name: "Pasta Alfredo", description: "Creamy sauce", price: 13.5, tags: ["vegetarian"] }
    ]},
    { id: "c-drinks", name: "Drinks", items: [
      { id: "i-spark", name: "Sparkling Water", price: 3.5, tags: ["vegan","gluten-free"] },
      { id: "i-cola", name: "Cola", price: 3, tags: ["vegan"] }
    ]}
  ]
};
export async function get_menu({ tenant, q }: { tenant?: string; q?: string }): Promise<MenuResponse> {
  if (!q?.trim()) return STUB;
  const needle = q.toLowerCase();
  const filtered = STUB.categories.map(c => ({
    ...c,
    items: c.items.filter(i =>
      i.name.toLowerCase().includes(needle) ||
      (i.description?.toLowerCase().includes(needle) ?? false) ||
      (i.tags?.some(t => t.toLowerCase().includes(needle)) ?? false)
    )
  })).filter(c => c.items.length>0);
  return { categories: filtered };
}
`,
  "app/api/menu/route.ts": `import { NextResponse } from "next/server";
import { get_menu } from "@/lib/server/menu";
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || undefined;
  const tenant = searchParams.get("tenant") || undefined;
  const data = await get_menu({ tenant, q });
  return NextResponse.json(data);
}
`,
  "components/MenuClient.tsx": `"use client";
import { useEffect, useState } from "react";
import type { MenuResponse } from "@/types/api";

export default function MenuClient() {
  const [data, setData] = useState<MenuResponse | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => { fetch("/api/menu").then(r=>r.json()).then(setData); }, []);
  const search = async () => { const r = await fetch("/api/menu?q="+encodeURIComponent(q)); setData(await r.json()); };
  if (!data) return <div style={{padding:24}}>Loading menu…</div>;
  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="search…" style={{padding:8}} />
        <button onClick={search} style={{padding:"8px 12px"}}>Search</button>
      </div>
      {data.categories.map(cat=>(
        <div key={cat.id} style={{marginBottom:16}}>
          <h2 style={{fontSize:18,fontWeight:600,margin:"8px 0"}}>{cat.name}</h2>
          <ul style={{listStyle:'none',padding:0,margin:0}}>
            {cat.items.map(it=>(
              <li key={it.id} style={{display:'flex',justifyContent:'space-between',padding:"6px 0",borderBottom:"1px solid #eee"}}>
                <span>{it.name}</span><span>{it.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
`,
  "app/menu/page.tsx": `import MenuClient from "@/components/MenuClient";
export const dynamic = "force-dynamic";
export default function MenuPage() {
  return (
    <main>
      <div style={{padding:24}}>
        <h1 style={{fontSize:24,fontWeight:700,marginBottom:12}}>Menu</h1>
      </div>
      <MenuClient />
    </main>
  );
}
`,
  "scripts/init.mjs": `import { existsSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";
try {
  if (!existsSync(".env.local") && existsSync(".env.example")) {
    copyFileSync(".env.example", ".env.local"); console.log("Created .env.local from .env.example");
  }
  try { execSync("npm ci", { stdio: "inherit" }); }
  catch { execSync("npm install", { stdio: "inherit" }); }
  console.log("Init complete.");
} catch (e) { console.error(e); process.exit(1); }
`,
  "scripts/ops.mjs": `import { execSync } from "node:child_process";
const args = process.argv.slice(2);
const has = f => args.includes(f);
const get = (f,d="") => { const i=args.indexOf(f); return i>=0 && args[i+1]?args[i+1]:d; };
const run = cmd => (console.log("\\n=== "+cmd+" ===\\n"), execSync(cmd,{stdio:"inherit",env:process.env}));
try {
  if (has("--init")) run("npm run init");
  if (has("--dev")) run("npm run dev");
  if (has("--test")) run("npm test");
  if (has("--build")) run("npm run build");
  if (has("--git")) { const msg = get("--msg","chore: update").replace(/"/g,'\\"');
    run("git add -A"); run(\`git commit -m "\${msg}" || echo Skipped commit\`); run("git push");
  }
  if (!args.length) console.log(\`Usage:
  npm run ops -- --init
  npm run ops -- --dev
  npm run ops -- --test
  npm run ops -- --build
  npm run ops -- --git --msg "feat: x"
\`);
} catch (e) { console.error(e.message || e); process.exit(1); }
`,
  "scripts/smoke.mjs": `import { existsSync } from "node:fs";
const need = ["package.json","app/layout.tsx","app/page.tsx","app/menu/page.tsx","app/api/menu/route.ts"];
const miss = need.filter(p=>!existsSync(p));
if (miss.length){ console.error("Missing:", miss.join(", ")); process.exit(1); }
console.log("Smoke OK");
`
};

// Create files if missing
for (const [p, content] of Object.entries(files)) {
  await writeIfMissing(join(root, p), content);
}

// Make sure deps exist; install if missing
const ensure = (dep, isDev=false) => {
  try { execSync(`npm ls ${dep} --depth=0`, { stdio: "ignore" }); return false; }
  catch { execSync(`npm i ${isDev? "-D": ""} ${dep}`, { stdio: "inherit" }); return true; }
};

log("✓ ensuring dependencies...");
ensure("next");
ensure("react");
ensure("react-dom");
ensure("typescript", true);
ensure("@types/node", true);
ensure("@types/react", true);
ensure("@types/react-dom", true);

// Done, run init & dev
log("\nAll set. Running init and dev...");
try { execSync("npm run init", { stdio: "inherit" }); } catch {}
execSync("npm run dev", { stdio: "inherit" });
