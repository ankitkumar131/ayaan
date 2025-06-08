export interface CartItem {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    discountPrice?: number;
  };
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  discountTotal?: number;
  finalTotal?: number;
  appliedPromoCode?: string;
}