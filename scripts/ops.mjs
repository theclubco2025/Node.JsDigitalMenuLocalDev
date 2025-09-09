import { execSync } from "node:child_process";
const args = process.argv.slice(2);
const has = f => args.includes(f);
const get = (f,d="") => { const i=args.indexOf(f); return i>=0 && args[i+1]?args[i+1]:d; };
const run = cmd => (console.log("\n=== "+cmd+" ===\n"), execSync(cmd,{stdio:"inherit",env:process.env}));
try {
  if (has("--init")) run("npm run init");
  if (has("--dev")) run("npm run dev");
  if (has("--test")) run("npm test");
  if (has("--build")) run("npm run build");
  if (has("--git")) { const msg = get("--msg","chore: update").replace(/"/g,'\"');
    run("git add -A"); run(`git commit -m "${msg}" || echo Skipped commit`); run("git push");
  }
  if (!args.length) console.log(`Usage:
  npm run ops -- --init
  npm run ops -- --dev
  npm run ops -- --test
  npm run ops -- --build
  npm run ops -- --git --msg "feat: x"
`);
} catch (e) { console.error(e.message || e); process.exit(1); }
