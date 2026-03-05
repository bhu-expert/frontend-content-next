import { request } from './api-client';

export interface Brand {
  id: string;
  user_id: string;
  name: string;
  industry: string;
  target_audience: string;
  visual_style: string;
  tone_of_voice: string;
  manifest: string;
  location?: string;
}

export interface CreateBrandInput extends Omit<Brand, 'id' | 'user_id'> {}
export interface UpdateBrandInput extends Partial<Omit<Brand, 'id' | 'user_id'>> {}

interface ApiResponse<T> {
  status: 'success';
  data: T;
}

export async function fetchUserBrands(userId: string): Promise<Brand[]> {
  const response = await request<ApiResponse<Brand[]>>(
    `/api/v1/data/users/me/brands`,
  );
  return response.data;
}

export async function createBrand(input: CreateBrandInput): Promise<Brand> {
  const response = await request<ApiResponse<Brand>>('/api/v1/data/brands', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response.data;
}

export async function updateBrand(
  brandId: string,
  input: UpdateBrandInput,
): Promise<Brand> {
  const response = await request<ApiResponse<Brand>>(
    `/api/v1/data/brands/${brandId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
  return response.data;
}
