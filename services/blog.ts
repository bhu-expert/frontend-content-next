import { request } from './api-client';

export interface BlogTopic {
  title: string;
  angle: string;
  target_keywords: string[];
}

export interface BlogIdeationResponse {
  topics: BlogTopic[];
}

export interface BlogIdeationInput {
  user_id: string;
  brand_id: string;
  context?: string;
  num_ideas?: number;
  category_name?: string;
}

export async function fetchBlogIdeas(
  input: BlogIdeationInput,
): Promise<BlogIdeationResponse> {
  const response = await request<BlogIdeationResponse>(
    '/api/v1/agent/blog/ideate',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return response;
}

export interface BlogSection {
  heading: string;
  content: string;
}

export interface BlogMetadata {
  meta_title: string;
  meta_description: string;
  slug: string;
  keywords: string[];
  cover_image?: string;
}

export interface BlogResponse {
  title: string;
  sections: BlogSection[];
  metadata: BlogMetadata;
  full_markdown: string;
}

export interface BlogGenerateInput {
  user_id: string;
  brand_id: string;
  topic: string;
  category_slug?: string;
  image_source?: 'ai' | 'stock';
}

export async function generateBlog(
  input: BlogGenerateInput,
): Promise<BlogResponse> {
  const response = await request<BlogResponse>(
    '/api/v1/agent/blog/generate',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return response;
}

export interface BlogCategory {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export async function fetchCategories(brandId: string): Promise<BlogCategory[]> {
  const response = await request<{ data: BlogCategory[] }>(
    `/api/v1/data/brands/${brandId}/categories`,
  );
  return response.data || [];
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
}

export async function createCategory(
  brandId: string,
  input: CreateCategoryInput,
): Promise<BlogCategory> {
  const response = await request<{ data: BlogCategory }>(
    `/api/v1/data/brands/${brandId}/categories`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export async function deleteCategory(
  brandId: string,
  categoryId: string,
): Promise<void> {
  await request(`/api/v1/data/brands/${brandId}/categories/${categoryId}`, {
    method: 'DELETE',
  });
}
