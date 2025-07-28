export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  timestamp?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
    total: number;
    pages: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error: string;
  errors?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
  timestamp: string;
}