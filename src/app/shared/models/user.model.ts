export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  address?: Address;
  createdAt?: string;
  updatedAt?: string;
  phone?: string;
  profileImage?: string;
}