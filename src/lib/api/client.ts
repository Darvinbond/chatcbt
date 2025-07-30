import { ApiResponse } from '@/types/api';
import { toast } from 'sonner';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string, params?: Record<string, any>, options?: RequestInit): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }
    return this.request<T>('GET', url.toString(), undefined, options);
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('POST', `${this.baseUrl}${endpoint}`, body, options);
  }

  async patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', `${this.baseUrl}${endpoint}`, body, options);
  }

  async delete<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', `${this.baseUrl}${endpoint}`, body, options);
  }

  private async request<T>(
    method: string,
    url: string,
    body?: any,
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    const response = await fetch(url, {
      ...options,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();

    if (!response.ok) {
      toast.error(data.error.message || 'An error occurred');
    }

    return data;
  }
}
