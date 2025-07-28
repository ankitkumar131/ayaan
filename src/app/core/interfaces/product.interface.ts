export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: {
    regular: number;
    sale?: number;
    currency: string;
  };
  category: Category;
  subcategory?: Category;
  brand?: string;
  sku: string;
  inventory: {
    quantity: number;
    stock: number;
    lowStockThreshold: number;
    trackQuantity: boolean;
    sku?: string;
  };
  variants: ProductVariant[];
  images: ProductImage[];
  specifications: {
    material?: string;
    care?: string[];
    origin?: string;
    weight?: string;
  };
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  ratings: {
    average: number;
    count: number;
  };
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  _id?: string;
  size: string;
  color: {
    name: string;
    code: string;
  };
  stock: number;
  sku: string;
  price?: number;
}

export interface ProductImage {
  _id?: string;
  url: string;
  alt: string;
  isPrimary: boolean;
  order: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: string;
  image?: string;
  isActive: boolean;
  isFeatured: boolean;
  gender?: 'men' | 'women' | 'unisex';
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  subcategory?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  size?: string;
  color?: string;
  tags?: string[];
  gender?: 'men' | 'women' | 'unisex';
  inStock?: boolean;
  featured?: boolean;
  onSale?: boolean;
  search?: string;
  sort?: 'name' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity';
  page?: number;
  limit?: number;
}

export interface ProductCreateRequest {
  name: string;
  description: string;
  shortDescription?: string;
  price: {
    regular: number;
    sale?: number;
    currency?: string;
  };
  category: string;
  subcategory?: string;
  brand?: string;
  sku?: string;
  inventory: {
    quantity: number;
    stock?: number;
    lowStockThreshold?: number;
    trackQuantity?: boolean;
  };
  variants?: Omit<ProductVariant, '_id'>[];
  specifications?: {
    material?: string;
    care?: string[];
    origin?: string;
    weight?: string;
  };
  tags?: string[];
  images?: { url: string }[];
  isActive: boolean;
  isFeatured: boolean;
}