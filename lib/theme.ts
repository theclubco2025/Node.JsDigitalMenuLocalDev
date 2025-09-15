import { promises as fs } from "fs";
import path from "path";

export type Theme = {
  primary: string;
  accent: string;
  radius: string;
};

const DEFAULT_THEME: Theme = {
  primary: "#111827",
  accent: "#2563eb",
  radius: "12px",
};

export async function getTheme(tenant: string): Promise<Theme> {
  // Prefer DB if available
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma").catch(() => ({ prisma: undefined as any }))
      if (prisma) {
        const row = await prisma.tenant.findUnique({ where: { slug: tenant }, select: { settings: true } })
        const settings = (row?.settings as any) || {}
        const t = settings.theme || {}
        if (t && (t.primary || t.accent || t.radius)) {
          return {
            primary: t.primary || DEFAULT_THEME.primary,
            accent: t.accent || DEFAULT_THEME.accent,
            radius: t.radius || DEFAULT_THEME.radius,
          }
        }
      }
    } catch {}
  }
  // Fallback to filesystem for dev
  try {
    const filePath = path.join(process.cwd(), "data", "tenants", tenant, "theme.json");
    const buf = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(buf);
    if (!json) return DEFAULT_THEME;
    return {
      primary: json.primary || DEFAULT_THEME.primary,
      accent: json.accent || DEFAULT_THEME.accent,
      radius: json.radius || DEFAULT_THEME.radius,
    } satisfies Theme;
  } catch {
    return DEFAULT_THEME;
  }
}


