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


