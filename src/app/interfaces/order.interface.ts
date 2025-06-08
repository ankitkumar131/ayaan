import { CartItem } from './cart.interface';

export interface Order {
    _id?: string;
    userId: string;
    items: CartItem[];
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentInfo: {
        method: string;
        status: 'pending' | 'completed' | 'failed';
        transactionId?: string;
    };
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    subtotal: number;
    discount?: number;
    total: number;
    appliedPromotion?: {
        code: string;
        discount: number;
    };
    trackingNumber?: string;
    estimatedDeliveryDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateOrderRequest {
    shippingAddress: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    paymentInfo: {
        method: string;
    };
}

export interface RefundRequest {
    orderId: string;
    reason: string;
} 