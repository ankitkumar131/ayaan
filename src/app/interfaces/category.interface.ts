export interface Category {
    _id?: string;
    name: string;
    description?: string;
    image?: string;
    parentId?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateCategoryRequest {
    name: string;
    description: string;
    parent?: string;
    order?: number;
    image?: File;
    gender: 'men' | 'women';
} 