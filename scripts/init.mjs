import { existsSync, copyFileSync } from "node:fs";
import { execSync } from "node:child_process";
try {
  if (!existsSync(".env.local") && existsSync(".env.example")) {
    copyFileSync(".env.example", ".env.local"); console.log("Created .env.local from .env.example");
  }
  try { execSync("npm ci", { stdio: "inherit" }); }
  catch { execSync("npm install", { stdio: "inherit" }); }
  console.log("Init complete.");
} catch (e) { console.error(e); process.exit(1); }
