export interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    images: string[];
    sizes?: string[];
    colors?: Array<{
        name: string;
        code: string;
    }>;
    gender?: 'men' | 'women' | 'unisex';
    createdAt: string;
    updatedAt: string;
}

export interface ProductFilter {
    page?: number;
    limit?: number;
    category?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
    search?: string;
}

export interface ProductResponse {
    products: Product[];
    currentPage: number;
    totalPages: number;
    totalProducts: number;
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