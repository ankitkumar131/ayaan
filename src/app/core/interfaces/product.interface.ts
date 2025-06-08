export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sizes?: string[];
  colors?: Array<{
    name: string;
    code: string;
  }>;
  images: string[];
  gender?: 'men' | 'women' | 'unisex';
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  products: Product[];
  currentPage: number;
  totalPages: number;
  totalProducts: number;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
  gender?: string;
  search?: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sizes?: string[];
  colors?: Array<{
    name: string;
    code: string;
  }>;
  images?: File[];
  gender?: 'men' | 'women' | 'unisex';
}