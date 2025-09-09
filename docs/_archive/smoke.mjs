import { existsSync } from "node:fs";
const need = ["package.json","app/layout.tsx","app/page.tsx","app/menu/page.tsx","app/api/menu/route.ts"];
const miss = need.filter(p=>!existsSync(p));
if (miss.length){ console.error("Missing:", miss.join(", ")); process.exit(1); }
console.log("Smoke OK");
