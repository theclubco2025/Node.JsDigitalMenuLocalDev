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
