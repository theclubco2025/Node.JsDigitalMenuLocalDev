export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  tags?: string[];
  calories?: number;
  imageUrl?: string;
};
export type MenuCategory={id:string;name:string;items:MenuItem[]};
export type MenuResponse={categories:MenuCategory[]};

// Shared tenant settings types for APIs/UI
export type TenantBrand = {
  name?: string;
  logoUrl?: string;
  header?: { logoUrl?: string };
  tagline?: string;
};

export type TenantTheme = {
  primary?: string;
  accent?: string;
  bg?: string;
  text?: string;
  ink?: string;
  card?: string;
  muted?: string;
  radius?: number | string;
};

export type TenantStyleFlags = {
  flags?: Record<string, boolean>;
  navVariant?: string;
  heroVariant?: string;
  accentSecondary?: string;
  badges?: Record<string, string>;
};

export type TenantSettings = {
  brand?: TenantBrand;
  theme?: TenantTheme;
  images?: Record<string, string>;
  style?: TenantStyleFlags;
  copy?: Record<string, unknown>;
};
