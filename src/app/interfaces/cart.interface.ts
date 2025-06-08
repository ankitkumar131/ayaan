import { Product } from './product.interface';

export interface CartItem {
    _id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    maxQuantity: number;
    image?: string;
    size?: string;
    color?: {
        name: string;
        code: string;
    };
}

export interface Cart {
    _id: string;
    userId: string;
    items: CartItem[];
    appliedPromotion?: {
        code: string;
        discount: number;
    };
    createdAt: string;
    updatedAt: string;
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