import { promises as fs } from "fs";
import path from "path";
import type { MenuResponse } from "@/types/api";

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
  try {
    // Prefer in-memory override if present
    if (memoryStore.has(tenant)) {
      return memoryStore.get(tenant)!;
    }
    const filePath = path.join(process.cwd(), "data", "tenants", tenant, "menu.json");
    const buf = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(buf);
    // Basic shape validation
    if (!json || !Array.isArray(json.categories)) return STUB;
    return json as MenuResponse;
  } catch {
    return STUB;
  }
}


