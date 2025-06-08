export interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  image: string;
}

export interface OrderItem {
  product: {
    name: string;
    images?: string[];
  };
  quantity: number;
  price: number;
  size?: string;
  color?: {
    name: string;
    code: string;
  };
}

export interface Order {
  _id: string;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentDetails: {
    cardNumber: string;
    expiryDate: string;
  };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlaceOrderRequest {
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentDetails: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
  };
}

export interface RefundRequest {
  orderId: string;
  reason: string;
} 