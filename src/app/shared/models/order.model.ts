export interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
  price: number;
  total: number;
}

export interface OrderAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface OrderRequest {
  items?: { productId: string; quantity: number }[];
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  paymentMethod: string;
  shippingMethod: string;
  promoCode?: string;
}

export interface Order {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  shippingAddress: OrderAddress;
  billingAddress: OrderAddress;
  paymentMethod: string;
  shippingMethod: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  promoCode?: string;
}

export interface RefundRequest {
  id: string;
  order: string;
  items: {
    product: {
      id: string;
      name: string;
      image: string;
    };
    quantity: number;
  }[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  note?: string;
}

export interface ReplacementRequest {
  id: string;
  order: string;
  items: {
    product: {
      id: string;
      name: string;
      image: string;
    };
    quantity: number;
  }[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  note?: string;
}