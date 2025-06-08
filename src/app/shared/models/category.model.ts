export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  parentCategory?: string | Category;
  subCategories?: Category[];
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}