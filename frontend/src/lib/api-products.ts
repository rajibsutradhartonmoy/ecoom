import { apiClient } from './api';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  isFeatured: boolean;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  _count?: {
    products: number;
    children: number;
  };
}

export const productsApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoryId?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    return apiClient.get(`/api/products?${searchParams.toString()}`);
  },

  get: (id: string) => apiClient.get(`/api/products/${id}`),

  create: (data: Partial<Product>) => apiClient.post('/api/products', data),

  update: (id: string, data: Partial<Product>) => apiClient.patch(`/api/products/${id}`, data),

  delete: (id: string) => apiClient.delete(`/api/products/${id}`),
};

export const categoriesApi = {
  list: () => apiClient.get('/api/categories'),

  tree: () => apiClient.get('/api/categories/tree'),

  get: (id: string) => apiClient.get(`/api/categories/${id}`),

  create: (data: Partial<Category>) => apiClient.post('/api/categories', data),

  update: (id: string, data: Partial<Category>) => apiClient.patch(`/api/categories/${id}`, data),

  delete: (id: string) => apiClient.delete(`/api/categories/${id}`),
};
