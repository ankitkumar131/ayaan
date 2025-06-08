export interface User {
    _id?: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
    addresses?: Array<{
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
        isDefault?: boolean;
    }>;
    wishlist?: string[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserLogin {
    email: string;
    password: string;
}

export interface UserRegister extends UserLogin {
    username: string;
}

export interface AuthResponse {
    token: string;
    user: User;
} 