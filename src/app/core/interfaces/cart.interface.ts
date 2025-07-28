export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
  promotion?: {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
  };
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    slug: string;
    brand?: string;
    price: {
      regular: number;
      sale?: number;
      currency: string;
    };
    images: Array<{
      url: string;
      alt: string;
      isPrimary: boolean;
    }>;
    inventory: {
      stock: number;
      quantity: number;
      trackQuantity: boolean;
    };
  };
  variant: {
    size: string;
    color: {
      name: string;
      code: string;
    };
  } | null;
  quantity: number;
  price: number;
  total: number;
}

export interface AddToCartRequest {
  productId: string;
  variant: {
    size: string;
    color: string;
  };
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
  variant?: {
    size: string;
    color: string;
  };
}

export interface ApplyPromotionRequest {
  code: string;
}

export interface CartSummary {
  itemCount: number;
  subtotal: number;
  total: number;
}

export interface ShippingEstimate {
  method: string;
  cost: number;
  estimatedDays: number;
}