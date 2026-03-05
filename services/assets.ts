import { request, getAuthHeaders } from './api-client';
import { createClient } from '@/lib/supabase/client';

export interface SavedImage {
  id: string;
  user_id: string;
  brand_id: string;
  image_url: string;
  variation_name?: string;
  prompt?: string;
  created_at: string;
}

export interface SaveImageInput {
  user_id: string;
  brand_id: string;
  image_url: string;
  variation_name?: string;
  prompt?: string;
}

export async function fetchSavedImages(
  userId: string,
  brandId?: string,
): Promise<SavedImage[]> {
  const url = brandId
    ? `/api/v1/data/assets/images?brand_id=${brandId}`
    : '/api/v1/data/assets/images';

  const response = await request<SavedImage[] | { data: SavedImage[] }>(url);
  
  // Handle both array response and wrapped response
  if (Array.isArray(response)) {
    return response;
  }
  return (response as { data: SavedImage[] }).data || [];
}

export async function saveImage(input: SaveImageInput): Promise<SavedImage> {
  const response = await request<{ data: SavedImage }>(
    '/api/v1/data/assets/images',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export async function deleteSavedImage(imageId: string): Promise<void> {
  await request(`/api/v1/data/assets/images/${imageId}`, {
    method: 'DELETE',
  });
}

export interface SavedBlog {
  id: string;
  user_id: string;
  brand_id: string;
  title: string;
  full_markdown: string;
  metadata: {
    meta_title: string;
    meta_description: string;
    keywords: string[];
    slug: string;
    cover_image?: string;
  };
  cover_image?: string;
  status: 'draft' | 'scheduled' | 'published';
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
}

export interface SaveBlogInput {
  user_id: string;
  brand_id: string;
  title: string;
  full_markdown: string;
  metadata: {
    meta_title: string;
    meta_description: string;
    keywords: string[];
    slug: string;
    cover_image?: string;
  };
  status?: 'draft' | 'scheduled' | 'published';
  scheduled_at?: string;
  published_at?: string;
  cover_image?: string;
}

export interface UpdateBlogInput {
  title?: string;
  full_markdown?: string;
  status?: 'draft' | 'scheduled' | 'published';
  scheduled_at?: string;
}

export async function fetchSavedBlogs(
  userId: string,
  brandId?: string,
): Promise<SavedBlog[]> {
  const url = brandId
    ? `/api/v1/data/assets/blogs?brand_id=${brandId}`
    : '/api/v1/data/assets/blogs';

  const response = await request<SavedBlog[] | { data: SavedBlog[] }>(url);
  
  // Handle both array response and wrapped response
  if (Array.isArray(response)) {
    return response;
  }
  return (response as { data: SavedBlog[] }).data || [];
}

export async function saveBlog(input: SaveBlogInput): Promise<SavedBlog> {
  const response = await request<{ data: SavedBlog }>(
    '/api/v1/data/assets/blogs',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export async function updateBlog(
  blogId: string,
  input: UpdateBlogInput,
): Promise<SavedBlog> {
  const response = await request<{ data: SavedBlog }>(
    `/api/v1/data/assets/blogs/${blogId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
  return response.data;
}

export async function deleteSavedBlog(blogId: string): Promise<void> {
  await request(`/api/v1/data/assets/blogs/${blogId}`, {
    method: 'DELETE',
  });
}

export async function fetchBlogBySlug(slug: string): Promise<SavedBlog | null> {
  try {
    const response = await request<{ data: SavedBlog[] }>(
      '/api/v1/data/assets/blogs',
    );
    return response.data?.find((b) => b.metadata?.slug === slug) ?? null;
  } catch {
    return null;
  }
}
