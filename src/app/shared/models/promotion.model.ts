export interface Promotion {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageLimit?: number;
  currentUsage?: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  createdAt?: string;
  updatedAt?: string;
}