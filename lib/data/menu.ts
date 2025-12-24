import { promises as fs } from "fs";
import path from "path";
import type { MenuResponse, MenuCategory, MenuItem } from "@/types/api";
import type { PrismaClient } from "@prisma/client";

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

type RawMenuItem = Partial<MenuItem> & {
  diet?: string[];
  allergens?: string[];
  badges?: string[];
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

  const item: MenuItem & {
    diet?: string[];
    allergens?: string[];
    badges?: string[];
  } = {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: raw.description ?? "",
    price: Number.isFinite(priceValue) ? priceValue : 0,
    tags: Array.from(tagSet).filter(Boolean),
    calories: typeof raw.calories === "number" ? raw.calories : undefined,
    imageUrl: raw.imageUrl || undefined,
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
  const isPreview = process.env.VERCEL_ENV === 'preview'
  // Safety: in production, do NOT fall back from <slug> â†’ <slug>-draft
  const fallbackTenant = (!tenant.endsWith('-draft') && isPreview) ? `${tenant}-draft` : null


  const maybeEnrich = (slug: string, menu: MenuResponse): MenuResponse => {
    // If menu already has structured diet/allergen tags, enrichment no-ops per item.
    // Otherwise we enrich tags conservatively from name/description.
    return enrichMenuTagsFromText(menu)
  }
  // If DATABASE_URL exists, prefer DB
  if (process.env.DATABASE_URL) {
    try {
      const { prisma } = await import("@/lib/prisma").catch(() => ({ prisma: undefined as PrismaClient | undefined }))
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
      let menu = tenantRow?.menus?.[0]
      // If no live menu, try draft tenant as fallback
      if (!menu && fallbackTenant) {
        const fbRow = await prisma.tenant.findUnique({
          where: { slug: fallbackTenant },
          include: {
            menus: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { categories: { include: { items: { include: { tags: true } } } } }
            }
          }
        })
        menu = fbRow?.menus?.[0]
      }
      if (menu) {
        const dbMenu: RawMenu = {
          categories: menu.categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            items: c.items.map((i: any) => ({
              id: i.id,
              name: i.name,
              description: i.description || '',
              price: Number(i.price),
              tags: i.tags.map((t: any) => t.tag),
              imageUrl: i.imageUrl || undefined,
              calories: i.calories || undefined,
            })),
          })),
        };
        return maybeEnrich(tenant, normalizeMenu(dbMenu));
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
        if (!json || !Array.isArray(json.categories)) return null
        return maybeEnrich(slug, normalizeMenu(json))
      } catch {
        return null
      }
    }
    const live = await tryRead(tenant)
    if (live) return live
    if (fallbackTenant) {
      const draft = await tryRead(fallbackTenant)
      if (draft) return draft
    }
    // no FS data
    return tenant === 'demo' ? STUB : { categories: [] };
  } catch {
    // Fallback to in-memory override if present; otherwise avoid stub for non-demo tenants
    if (memoryStore.has(tenant)) return maybeEnrich(tenant, memoryStore.get(tenant)!);
    if (fallbackTenant && memoryStore.has(fallbackTenant)) return maybeEnrich(fallbackTenant, memoryStore.get(fallbackTenant)!);
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
      await prisma.$transaction(async (tx: any) => {
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

function normalizeText(s: unknown): string {
  return String(s ?? '').toLowerCase()
}

type DietFilterFlags = {
  vegetarian?: boolean
  vegan?: boolean
  noGlutenListed?: boolean
  noDairyListed?: boolean
  noNutsListed?: boolean
  glutenFree?: boolean
  dairyFree?: boolean
  nutFree?: boolean
}

type InferredFacts = {
  containsMeat: boolean
  containsSeafood: boolean
  containsDairy: boolean
  containsEggs: boolean
  containsGluten: boolean
  containsNuts: boolean
  containsHoney: boolean
  explicitVegetarian: boolean
  explicitVegan: boolean
  explicitGlutenFree: boolean
  explicitDairyFree: boolean
  explicitNutFree: boolean
}

function inferFactsFromText(name: string, description: string): InferredFacts {
  const text = `${name} ${description}`.toLowerCase()
  const hasAny = (words: string[]) => words.some(w => text.includes(w))

  const meat = [
    'beef','steak','flank','filet mignon','mignon',
    'pork','bacon','ham','sausage','chicken','turkey','lamb','duck',
    'prosciutto','pepperoni','salami','meatball','meatballs',
  ]
  const seafood = [
    'fish','salmon','tuna','ahi','sea bass','chilean sea bass','bass',
    'shrimp','prawn','prawns','scallop','scallops','mussel','mussels','clam','clams','crab','lobster','oyster','octopus','squid',
  ]
  const dairy = [
    'butter','cream','cheese','cheddar','parmesan','mozzarella','ricotta','milk','yogurt','blue cheese',
  ]
  const eggs = ['egg','eggs','yolk','aioli','mayo','mayonnaise']
  const gluten = [
    'bread','bun','croissant','naan','crostini','crouton','croutons','wonton','panko','flour',
    'pasta','ramen','noodle','noodles','tortilla','tempura','beer battered','cornbread',
    'soy sauce','teriyaki',
  ]
  const nuts = [
    'nut','nuts','peanut','peanuts','almond','almonds','walnut','walnuts','pecan','pecans','cashew','cashews','pistachio','pistachios',
    'macadamia','macadamias','pine nut','pine nuts','hazelnut','hazelnuts',
  ]

  const explicitVegetarian = /\bvegetarian\b/i.test(text)
  const explicitVegan = /\bvegan\b/i.test(text)
  const explicitGlutenFree = /\bgluten[-\s]?free\b/i.test(text)
  const explicitDairyFree = /\bdairy[-\s]?free\b/i.test(text)
  const explicitNutFree = /\bnut[-\s]?free\b/i.test(text)

  return {
    containsMeat: hasAny(meat),
    containsSeafood: hasAny(seafood),
    containsDairy: hasAny(dairy),
    containsEggs: hasAny(eggs),
    containsGluten: hasAny(gluten),
    containsNuts: hasAny(nuts),
    containsHoney: text.includes('honey'),
    explicitVegetarian,
    explicitVegan,
    explicitGlutenFree,
    explicitDairyFree,
    explicitNutFree,
  }
}

function shouldEnrichItemTags(existingTags: string[]): boolean {
  const normalized = existingTags.map(t => t.toLowerCase())
  const anyKnown = normalized.some(t =>
    t === 'vegetarian' ||
    t === 'vegan' ||
    t === 'gluten-free' ||
    t === 'dairy-free' ||
    t === 'nut-free' ||
    t.startsWith('contains-')
  )
  return !anyKnown
}

function enrichMenuTagsFromText(menu: MenuResponse): MenuResponse {
  const categories: MenuCategory[] = menu.categories.map((c: any) => ({
    ...c,
    items: c.items.map(it => {
      const existing = (it.tags || []).map(String).map(t => t.trim()).filter(Boolean)
      if (!shouldEnrichItemTags(existing)) return it

      const facts = inferFactsFromText(it.name, it.description || '')
      const tags = new Set<string>(existing.map(t => t.toLowerCase()))

      if (facts.containsMeat) tags.add('contains-meat')
      if (facts.containsSeafood) tags.add('contains-seafood')
      if (facts.containsDairy) tags.add('contains-dairy')
      if (facts.containsEggs) tags.add('contains-eggs')
      if (facts.containsGluten) tags.add('contains-gluten')
      if (facts.containsNuts) tags.add('contains-nuts')
      if (facts.containsHoney) tags.add('contains-honey')

      const vegetarian = facts.explicitVegetarian || (!facts.containsMeat && !facts.containsSeafood)
      const vegan = facts.explicitVegan || (vegetarian && !facts.containsDairy && !facts.containsEggs && !facts.containsHoney)
      if (vegetarian) tags.add('vegetarian')
      if (vegan) tags.add('vegan')

      // Free-from tags: only when explicitly stated.
      if (facts.explicitGlutenFree) tags.add('gluten-free')
      if (facts.explicitDairyFree) tags.add('dairy-free')
      if (facts.explicitNutFree) tags.add('nut-free')

      return { ...it, tags: Array.from(tags) }
    })
  }))
  return { categories }
}

export function filterMenuByDiet(menu: MenuResponse, filters: DietFilterFlags = {}): MenuResponse {
  const wants = {
    vegetarian: !!filters.vegetarian,
    vegan: !!filters.vegan,
    glutenFree: !!filters.glutenFree,
    dairyFree: !!filters.dairyFree,
    nutFree: !!filters.nutFree,
  }
  const hasAll = (item: MenuItem) => {
    const tags = (item.tags || []).map(t => normalizeText(t))
    if (wants.vegetarian && !tags.includes('vegetarian')) return false
    if (wants.vegan && !tags.includes('vegan')) return false
    if (wants.glutenFree && !tags.includes('gluten-free')) return false
    if (wants.dairyFree && !tags.includes('dairy-free')) return false
    if (wants.nutFree && !tags.includes('nut-free')) return false
    return true
  }
  const categories: MenuCategory[] = menu.categories
    .map((c: any) => ({ ...c, items: c.items.filter(hasAll) }))
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


