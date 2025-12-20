import html as _html
import json
import os
import re
from dataclasses import dataclass
from typing import Dict, List, Tuple


def _collapse_ws(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip())


def _slugify(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"[’'`]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-{2,}", "-", s).strip("-")
    return s or "x"


@dataclass
class MenuItem:
    id: str
    name: str
    description: str
    price: float
    tags: List[str]


@dataclass
class MenuCategory:
    id: str
    name: str
    items: List[MenuItem]


_TAB_LINK_RE = re.compile(r'data-href="#(?P<key>\d+)_(?P<spl>\d+)">(?P<name>[^<]+)</a>', re.I)
_SPL_ID_RE = re.compile(r'id="spl_(\d+)"')
_TAB_BLOCK_START_RE = re.compile(r'<div class="tab[^"]*" id="(?P<key>\d+)_(?P<spl>\d+)"', re.I)
_ITEM_SPLIT_RE = re.compile(r'<div[^>]*spl-item-root[^>]*>', re.I)
_ITEM_NAME_RE = re.compile(r'class="name a-tag"[^>]*>\s*<span>(?P<name>.*?)</span>', re.I | re.S)
_ITEM_PRICE_RE = re.compile(r'data-price="(?P<price>[^"]+)"', re.I)
_ITEM_DESC_RE = re.compile(r'class="desc a-tag"[^>]*>\s*<span>(?P<desc>.*?)</span>', re.I | re.S)


def _parse_price(raw: str) -> float:
    raw = _collapse_ws(raw)
    raw = raw.replace("$", "")
    try:
        return float(raw)
    except Exception:
        return 0.0


def parse_stylish_price_list_html(path: str, menu_label: str) -> List[MenuCategory]:
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        src = f.read()

    src = _html.unescape(src)

    spl_match = _SPL_ID_RE.search(src)
    if not spl_match:
        raise RuntimeError(f"Could not find spl_ widget id in {path}")
    spl_id = spl_match.group(1)

    # category keys -> names
    cats_by_key: Dict[str, str] = {}
    for m in _TAB_LINK_RE.finditer(src):
        if m.group("spl") != spl_id:
            continue
        key = m.group("key")
        name = _collapse_ws(m.group("name"))
        if key and name:
            cats_by_key[key] = name

    # locate each tab content block by start positions
    tab_starts: List[Tuple[str, int]] = []
    for m in _TAB_BLOCK_START_RE.finditer(src):
        if m.group("spl") != spl_id:
            continue
        tab_starts.append((m.group("key"), m.start()))

    if not tab_starts:
        raise RuntimeError(f"No tab blocks found for spl_{spl_id} in {path}")

    tab_starts.sort(key=lambda x: x[1])

    categories: List[MenuCategory] = []
    seen_cat_ids: set[str] = set()

    for idx, (key, start) in enumerate(tab_starts):
        end = tab_starts[idx + 1][1] if idx + 1 < len(tab_starts) else len(src)
        block = src[start:end]

        cat_name = cats_by_key.get(key, f"Category {key}")
        full_name = f"{menu_label} — {cat_name}"
        cat_id = f"c-sfg-{_slugify(menu_label)}-{_slugify(cat_name)}"
        # ensure uniqueness if same category name appears across multiple widgets/pages
        if cat_id in seen_cat_ids:
            cat_id = f"{cat_id}-{key}"
        seen_cat_ids.add(cat_id)

        # split into item chunks
        chunks = _ITEM_SPLIT_RE.split(block)
        if len(chunks) <= 1:
            # no items in this tab
            continue
        chunks = chunks[1:]

        items: List[MenuItem] = []
        used_item_ids: set[str] = set()
        for cidx, chunk in enumerate(chunks):
            name_m = _ITEM_NAME_RE.search(chunk)
            price_m = _ITEM_PRICE_RE.search(chunk)
            desc_m = _ITEM_DESC_RE.search(chunk)

            if not name_m:
                continue
            name = _collapse_ws(_html.unescape(name_m.group("name")))
            if not name:
                continue
            has_price = bool(price_m and _collapse_ws(price_m.group("price")))
            price = _parse_price(price_m.group("price") if price_m else "")
            desc = _collapse_ws(_html.unescape(desc_m.group("desc") if desc_m else ""))
            tags: List[str] = ["mp"] if (not has_price or price <= 0) else []

            base_item_id = f"i-sfg-{_slugify(menu_label)}-{_slugify(name)}"
            item_id = base_item_id
            if item_id in used_item_ids:
                item_id = f"{base_item_id}-{cidx+1}"
            used_item_ids.add(item_id)

            items.append(MenuItem(id=item_id, name=name, description=desc, price=price, tags=tags))

        if items:
            categories.append(MenuCategory(id=cat_id, name=full_name, items=items))

    return categories


def main() -> None:
    # Designed to run from repo root
    base = os.path.join("tmp", "southfork")
    inputs = [
        ("Dinner", os.path.join(base, "dinner.html")),
        ("Lunch", os.path.join(base, "lunch.html")),
        ("Brunch", os.path.join(base, "brunch.html")),
        ("Happy Hour", os.path.join(base, "happy-hour.html")),
        ("Cocktails", os.path.join(base, "cocktails.html")),
        ("Desserts", os.path.join(base, "dessert.html")),
        ("Kids", os.path.join(base, "kids.html")),
    ]

    all_categories: List[MenuCategory] = []
    for label, path in inputs:
        if not os.path.exists(path):
            continue
        cats = parse_stylish_price_list_html(path, label)
        all_categories.extend(cats)

    out = {
        "categories": [
            {
                "id": c.id,
                "name": c.name,
                "items": [
                    {
                        "id": i.id,
                        "name": i.name,
                        "description": i.description,
                        "price": i.price,
                        "tags": i.tags,
                        "imageUrl": "",
                    }
                    for i in c.items
                ],
            }
            for c in all_categories
        ]
    }

    os.makedirs(base, exist_ok=True)
    with open(os.path.join(base, "menu.normalized.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(out['categories'])} categories to {os.path.join(base, 'menu.normalized.json')}")


if __name__ == "__main__":
    main()


