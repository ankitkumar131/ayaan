export interface Review {
  id: string;
  product: {
    id: string;
    name: string;
    image: string;
  };
  user: {
    id: string;
    name: string;
    profileImage?: string;
  };
  rating: number;
  comment: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  isVerifiedPurchase?: boolean;
}