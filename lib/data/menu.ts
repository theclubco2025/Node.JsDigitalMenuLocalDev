import { promises as fs } from "fs";
import path from "path";
import type { MenuResponse, MenuCategory, MenuItem } from "@/types/api";
import type { Prisma, PrismaClient } from "@prisma/client";

// Simple in-memory override store (used when filesystem is unavailable)
const memoryStore = new Map<string, MenuResponse>();

export function setMemoryMenu(tenant: string, menu: MenuResponse) {
  memoryStore.set(tenant, menu);
}

export function hasMemoryMenu(tenant: string): boolean {
  return memoryStore.has(tenant);
}

const STUB: MenuResponse = {
  categories: [
    {
      id: "c-apps",
      name: "Appetizers",
      items: [
        {
          id: "i-gb",
          name: "Garlic Bread",
          description: "Toasted, herbed butter",
          price: 5.5,
          tags: ["vegetarian"],
          imageUrl: "https://via.placeholder.com/300x200?text=Garlic+Bread",
        },
        {
          id: "i-salad",
          name: "House Salad",
          description: "Greens, vinaigrette",
          price: 7,
          tags: ["vegan", "gluten-free"],
          calories: 180,
        },
      ],
    },
    {
      id: "c-mains",
      name: "Mains",
      items: [
        {
          id: "i-burger",
          name: "Classic Burger",
          description: "Cheddar, pickles",
          price: 12,
          tags: ["beef"],
          imageUrl: "https://via.placeholder.com/300x200?text=Classic+Burger",
        },
        {
          id: "i-pasta",
          name: "Pasta Alfredo",
          description: "Creamy sauce",
          price: 13.5,
          tags: ["vegetarian"],
        },
      ],
    },
    {
      id: "c-drinks",
      name: "Drinks",
      items: [
        {
          id: "i-spark",
          name: "Sparkling Water",
          price: 3.5,
          tags: ["vegan", "gluten-free"],
          imageUrl: "https://via.placeholder.com/300x200?text=Sparkling+Water",
        },
        { id: "i-cola", name: "Cola", price: 3, tags: ["vegan"] },
      ],
    },
  ],
};

type RawMenu = {
  categories?: Array<{
    id?: string;
    name?: string;
    items?: RawMenuItem[];
  }>;
};

type RawModifier = {
  id?: string;
  name: string;
  type?: string;
  options?: unknown;
};

type RawMenuItem = Partial<MenuItem> & {
  diet?: string[];
  allergens?: string[];
  badges?: string[];
  priceCents?: number;
  available?: boolean;
  kcal?: number;
  modifiers?: RawModifier[];
};

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim().length > 0) return [value];
  return [];
}

function normalizeItem(raw: RawMenuItem): MenuItem & {
  diet?: string[];
  allergens?: string[];
  badges?: string[];
} {
  const diet = toArray(raw.diet);
  const allergens = toArray(raw.allergens);
  const badges = toArray(raw.badges);
  const existingTags = toArray(raw.tags);

  const tagSet = new Set<string>();
  for (const tag of [...existingTags, ...diet, ...allergens]) {
    tagSet.add(String(tag).trim());
  }

  const priceValue = typeof raw.price === "number" ? raw.price : Number(raw.price ?? 0);
  const priceCentsValue = typeof raw.priceCents === "number" ? raw.priceCents : Math.round((Number.isFinite(priceValue) ? priceValue : 0) * 100);
  const available = raw.available !== undefined ? Boolean(raw.available) : true;
  const kcal = typeof raw.kcal === "number" ? raw.kcal : (typeof raw.calories === "number" ? raw.calories : undefined);
  const modifiers = Array.isArray(raw.modifiers) ? raw.modifiers : [];

  const item: MenuItem & {
    diet?: string[];
    allergens?: string[];
    badges?: string[];
  } = {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: raw.description ?? "",
    price: Number.isFinite(priceValue) ? priceValue : Number.isFinite(priceCentsValue) ? priceCentsValue / 100 : 0,
    priceCents: Number.isFinite(priceCentsValue) ? priceCentsValue : undefined,
    tags: Array.from(tagSet).filter(Boolean),
    calories: typeof raw.calories === "number" ? raw.calories : undefined,
    kcal,
    available,
    imageUrl: raw.imageUrl || undefined,
    allergens,
    modifiers: modifiers.map(mod => ({
      id: mod.id ?? '',
      name: mod.name,
      type: mod.type ?? 'choice',
      options: mod.options,
    })),
  };

  if (diet.length) item.diet = diet;
  if (allergens.length) item.allergens = allergens;
  if (badges.length) item.badges = badges;

  return item;
}

function normalizeMenu(raw: RawMenu | null | undefined): MenuResponse {
  if (!raw?.categories || !Array.isArray(raw.categories)) {
    return { categories: [] };
  }

  const categories: MenuCategory[] = raw.categories.map(cat => ({
    id: String(cat?.id ?? cat?.name ?? ""),
    name: String(cat?.name ?? ""),
    items: Array.isArray(cat?.items) ? cat!.items!.map(normalizeItem) : [],
  }));

  return { categories };
}

export async function readMenu(tenant: string): Promise<MenuResponse> {
  const fallbackTenant = tenant.endsWith('-draft') ? tenant : `${tenant}-draft`
  // If DATABASE_URL exists, prefer DB
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma").catch(() => ({ prisma: undefined as PrismaClient | undefined }))
      if (!prisma) throw new Error('prisma-not-ready')
      const itemInclude = {
        tags: true,
        modifiers: { include: { modifier: true } },
        allergens: { include: { allergen: true } },
      }

      type MenuItemRow = {
        id: string
        name: string
        description: string | null
        price: Prisma.Decimal | number
        priceCents?: number | null
        available?: boolean | null
        tagLabels?: string[] | null
        tags: { tag: string }[]
        imageUrl?: string | null
        calories?: number | null
        kcal?: number | null
        modifiers?: Array<{ modifier: { id: string; name: string; type: string; options: unknown } }> | null
        allergens?: Array<{ allergen: { label: string | null; code: string } }> | null
      }

      const tenantRow = await prisma.tenant.findUnique({
        where: { slug: tenant },
        include: {
          menus: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              categories: {
                include: {
                  items: {
                    include: itemInclude as unknown as Prisma.MenuItemInclude,
                  },
                }
              }
            }
          }
        }
      })
      let menu = tenantRow?.menus?.[0]
      // If no live menu, try draft tenant as fallback
      if (!menu && fallbackTenant !== tenant) {
        const fbRow = await prisma.tenant.findUnique({
          where: { slug: fallbackTenant },
          include: {
            menus: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                categories: {
                  include: {
                    items: {
                      include: itemInclude as unknown as Prisma.MenuItemInclude,
                    },
                  }
                }
              }
            }
          }
        })
        menu = fbRow?.menus?.[0]
      }
      if (menu) {
        const dbMenu: RawMenu = {
          categories: menu.categories.map(c => ({
            id: c.id,
            name: c.name,
            items: c.items.map(rawItem => {
              const item = rawItem as unknown as MenuItemRow

              const modifiers = Array.isArray(item.modifiers)
                ? item.modifiers.map(m => ({
                    id: m.modifier.id,
                    name: m.modifier.name,
                    type: m.modifier.type,
                    options: m.modifier.options,
                  }))
                : []

              const allergens = Array.isArray(item.allergens)
                ? item.allergens.map(a => a.allergen.label || a.allergen.code)
                : []

              const priceNumber = typeof item.price === 'number' ? item.price : Number(item.price)

              return {
                id: item.id,
                name: item.name,
                description: item.description || '',
                price: priceNumber,
                priceCents: typeof item.priceCents === 'number' ? item.priceCents : undefined,
                available: item.available ?? true,
                tags: Array.from(new Set([...(item.tagLabels || []), ...item.tags.map(t => t.tag)])),
                imageUrl: item.imageUrl || undefined,
                calories: item.calories || undefined,
                kcal: item.kcal || item.calories || undefined,
                modifiers,
                allergens,
              }
            }),
          })),
        };
        return normalizeMenu(dbMenu);
      }
    } catch {
      // fall back to FS below
    }
  }
  try {
    // Prefer filesystem so edits reflect immediately
    const base = path.join(process.cwd(), "data", "tenants")
    const tryRead = async (slug: string): Promise<MenuResponse | null> => {
      try {
        const buf = await fs.readFile(path.join(base, slug, "menu.json"), "utf8")
        const json = JSON.parse(buf)
        const payload = json && typeof json === "object" && "menu" in json && json.menu
          ? json.menu
          : json
        if (!payload || !Array.isArray((payload as RawMenu).categories)) return null
        return normalizeMenu(payload as RawMenu)
      } catch {
        return null
      }
    }
    const live = await tryRead(tenant)
    if (live) return live
    if (fallbackTenant !== tenant) {
      const draft = await tryRead(fallbackTenant)
      if (draft) return draft
    }
    // no FS data
    return tenant === 'demo' ? STUB : { categories: [] };
  } catch {
    // Fallback to in-memory override if present; otherwise avoid stub for non-demo tenants
    if (memoryStore.has(tenant)) return memoryStore.get(tenant)!;
    if (fallbackTenant !== tenant && memoryStore.has(fallbackTenant)) return memoryStore.get(fallbackTenant)!;
    return tenant === 'demo' ? STUB : { categories: [] };
  }
}

export async function writeMenu(tenant: string, menu: MenuResponse): Promise<void> {
  const normalized = normalizeMenu(menu as unknown as RawMenu)
  // If DB present, write there; else write file (fallback to memory)
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma").catch(() => ({ prisma: undefined as PrismaClient | undefined }))
      if (!prisma) throw new Error('prisma-not-ready')
      await prisma.$transaction(async (tx) => {
        // Ensure tenant exists
        const tenantRow = await tx.tenant.upsert({
          where: { slug: tenant },
          update: {},
          create: { slug: tenant, name: tenant },
        })
        // Create a new Menu and replace categories/items
        const newMenu = await tx.menu.create({ data: { tenantId: tenantRow.id, name: `${tenant} menu` } })
        for (const cat of normalized.categories) {
          const createdCat = await tx.menuCategory.create({ data: { menuId: newMenu.id, name: cat.name } })
          for (const item of cat.items) {
            const createdItem = await tx.menuItem.create({
              data: {
                categoryId: createdCat.id,
                name: item.name,
                description: item.description || '',
                price: item.price,
                imageUrl: item.imageUrl || null,
                calories: item.calories || null,
                kcal: item.kcal || item.calories || null,
                available: item.available ?? true,
              }
            })
            for (const tag of item.tags || []) {
              await tx.menuItemTag.create({ data: { itemId: createdItem.id, tag } })
            }
          }
        }
      })
      return
    } catch {
      // fall through to FS
    }
  }
  const dir = path.join(process.cwd(), "data", "tenants", tenant)
  const file = path.join(dir, "menu.json")
  try {
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(file, JSON.stringify(normalized, null, 2), "utf8")
  } catch {
    setMemoryMenu(tenant, normalized)
  }
}

// Alias requested by the new assistant API
export async function getMenuForTenant(tenantId: string): Promise<MenuResponse> {
  // TODO: if process.env.DATABASE_URL and prisma available, fetch from DB instead (same return shape)
  return readMenu(tenantId)
}

export function filterMenuByDiet(menu: MenuResponse, filters: { vegan?: boolean; glutenFree?: boolean; dairyFree?: boolean } = {}): MenuResponse {
  const wants = {
    vegan: !!filters.vegan,
    glutenFree: !!filters.glutenFree,
    dairyFree: !!filters.dairyFree,
  }
  const hasAll = (item: MenuItem) => {
    const tags = (item.tags || []).map(t => t.toLowerCase())
    if (wants.vegan && !tags.includes('vegan')) return false
    if (wants.glutenFree && !tags.includes('gluten-free')) return false
    if (wants.dairyFree && !tags.includes('dairy-free')) return false
    return true
  }
  const categories: MenuCategory[] = menu.categories
    .map(c => ({ ...c, items: c.items.filter(hasAll) }))
    .filter(c => c.items.length > 0)
  return { categories }
}

export function snippet(menu: MenuResponse, limit = 12): string {
  const lines: string[] = []
  for (const cat of menu.categories) {
    for (const item of cat.items) {
      const parts: string[] = []
      parts.push(item.name)
      if (item.description && item.description.trim().length > 0) {
        parts.push(item.description.trim())
      }
      const tags = (item.tags || []).filter(Boolean)
      if (tags.length > 0) {
        parts.push(`Tags: ${tags.join(', ')}`)
      }
      const price = typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : ''
      if (price) {
        parts.push(price)
      }
      lines.push(parts.join(' • '))
      if (lines.length >= limit) return lines.join('\n')
    }
  }
  return lines.join('\n')
}


