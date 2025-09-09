import { promises as fs } from "fs";
import path from "path";

function sanitizeTenantId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!/^[a-z0-9\-]+$/.test(trimmed)) return null;
  return trimmed;
}

export function resolveTenant(url: string): string {
  try {
    const parsed = new URL(url);
    const fromQuery = sanitizeTenantId(parsed.searchParams.get("tenant"));
    if (fromQuery) return fromQuery;
  } catch {
    // ignore URL parse errors; fall back to env/default
  }
  const fromEnv = sanitizeTenantId(process.env.NEXT_PUBLIC_DEFAULT_TENANT);
  return fromEnv || "demo";
}

export async function listTenants(): Promise<string[]> {
  try {
    const tenantsDir = path.join(process.cwd(), "data", "tenants");
    const entries = await fs.readdir(tenantsDir, { withFileTypes: true });
    const tenants = entries.filter(e => e.isDirectory()).map(e => e.name);
    return tenants.length > 0 ? tenants : ["demo"];
  } catch {
    return ["demo"];
  }
}


