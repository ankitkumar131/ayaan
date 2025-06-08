export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: {
    id: string;
    name: string;
  };
  images: string[];
  stock: number;
  rating?: number;
  reviewCount?: number;
  features?: string[];
  specifications?: {
    [key: string]: string;
  };
  createdAt: string;
  updatedAt: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
}