export interface CartItem {
  productId: string;
  quantity: number;
  size?: string;
  color?: {
    name: string;
    code: string;
  };
  product?: {
    name: string;
    price: number;
    images?: string[];
  };
}

export interface Cart {
  items: CartItem[];
  appliedPromotion?: {
    code: string;
    discount: number;
  };
  subtotal: number;
  total: number;
}

export interface AddToCartRequest {
  productId: string;
  quantity: number;
  size?: string;
  color?: {
    name: string;
    code: string;
  };
}

export interface ApplyPromotionRequest {
  code: string;
} 