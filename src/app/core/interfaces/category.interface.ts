export interface Category {
  id: string;
  name: string;
  description: string;
  parent?: string;
  order?: number;
  image?: string;
  children?: Category[];
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  parent?: string;
  order?: number;
  image?: File;
} 