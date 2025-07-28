import { Address } from './user.interface';
import { CartItem } from './cart.interface';

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  pricing: {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
  };
  addresses: {
    shipping: Address;
    billing: Address;
  };
  payment: {
    method: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    gateway?: string;
  };
  shipping: {
    method: string;
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
  };
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  statusHistory: OrderStatusHistory[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem extends Omit<CartItem, '_id'> {
  // OrderItem inherits from CartItem but without _id
}

export interface OrderStatusHistory {
  status: string;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface CreateOrderRequest {
  items?: Array<{
    product: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: Address | any;
  billingAddress?: Address | any;
  paymentMethod: string;
  shippingMethod: string;
  totals?: {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
  };
  notes?: string;
}

export interface OrderFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OrderTracking {
  orderNumber: string;
  status: string;
  statusHistory: OrderStatusHistory[];
  shipping: {
    carrier?: string;
    trackingNumber?: string;
    estimatedDelivery?: string;
    actualDelivery?: string;
  };
  items: OrderItem[];
}

export interface ReviewRequest {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: File[];
}

export interface ReturnRequest {
  reason: string;
  items: Array<{
    productId: string;
    quantity: number;
    reason: string;
  }>;
  images?: File[];
  description?: string;
}

export interface RefundRequest {
  reason: string;
  items: Array<{
    productId: string;
    quantity: number;
    reason: string;
  }>;
  images?: File[];
  description?: string;
  bankDetails?: {
    accountNumber: string;
    routingNumber: string;
    accountHolderName: string;
  };
}