import { promises as fs } from "fs";
import path from "path";
import type { MenuResponse, MenuCategory, MenuItem } from "@/types/api";
// Lazy DB client import to avoid crashing when Prisma isn't generated

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

export async function readMenu(tenant: string): Promise<MenuResponse> {
  // If DATABASE_URL exists, prefer DB
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma").catch(() => ({ prisma: undefined as any }))
      if (!prisma) throw new Error('prisma-not-ready')
      // Our Prisma schema is richer; map to MenuResponse using the latest Menu for tenant slug
      const tenantRow = await prisma.tenant.findUnique({
        where: { slug: tenant },
        include: {
          menus: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              categories: { include: { items: { include: { tags: true } } } }
            }
          }
        }
      })
      const menu = tenantRow?.menus?.[0]
      if (menu) {
        const categories: MenuCategory[] = menu.categories.map(c => ({
          id: c.id,
          name: c.name,
          items: c.items.map(i => ({
            id: i.id,
            name: i.name,
            description: i.description || '',
            price: Number(i.price),
            tags: i.tags.map(t => t.tag),
            imageUrl: i.imageUrl || undefined,
            calories: i.calories || undefined,
          }))
        }))
        return { categories }
      }
    } catch (e) {
      // fall back to FS below
    }
  }
  try {
    // Prefer filesystem so edits reflect immediately
    const filePath = path.join(process.cwd(), "data", "tenants", tenant, "menu.json");
    const buf = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(buf);
    // Basic shape validation
    if (!json || !Array.isArray(json.categories)) return STUB;
    return json as MenuResponse;
  } catch {
    // Fallback to in-memory override if present; otherwise stub
    if (memoryStore.has(tenant)) return memoryStore.get(tenant)!;
    return STUB;
  }
}

export async function writeMenu(tenant: string, menu: MenuResponse): Promise<void> {
  // If DB present, write there; else write file (fallback to memory)
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma").catch(() => ({ prisma: undefined as any }))
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
        for (const cat of menu.categories) {
          const createdCat = await tx.menuCategory.create({ data: { menuId: newMenu.id, name: cat.name } })
          for (const item of cat.items) {
            const createdItem = await tx.menuItem.create({
              data: {
                categoryId: createdCat.id,
                name: item.name,
                description: item.description || '',
                price: item.price as unknown as any,
                imageUrl: item.imageUrl || null,
                calories: item.calories || null,
              }
            })
            for (const tag of item.tags || []) {
              await tx.menuItemTag.create({ data: { itemId: createdItem.id, tag } })
            }
          }
        }
      })
      return
    } catch (e) {
      // fall through to FS
    }
  }
  const dir = path.join(process.cwd(), "data", "tenants", tenant)
  const file = path.join(dir, "menu.json")
  try {
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(file, JSON.stringify(menu, null, 2), "utf8")
  } catch {
    setMemoryMenu(tenant, menu)
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
      const price = typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : ''
      const tags = (item.tags || []).join(', ')
      lines.push(`${item.name} — ${tags}${price ? ` — ${price}` : ''}`.trim())
      if (lines.length >= limit) return lines.join('\n')
    }
  }
  return lines.join('\n')
}


