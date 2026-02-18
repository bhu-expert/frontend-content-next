export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };
}

export interface Brand {
  id: string;
  name: string;
  industry: string;
  target_audience: string;
  visual_style: string;
  tone_of_voice: string;
  manifest: string;
}

export interface PostIdea {
  message: string;
}

export interface IdeationResponse {
  ideas: PostIdea[];
}

export interface AgentResponse {
  results: {
    variation_name: string;
    prompt: string;
    image_url: string;
  }[];
}

// Asset Hub Interfaces
export interface SavedImage {
  id: string;
  user_id: string;
  brand_id: string;
  image_url: string;
  variation_name?: string;
  prompt?: string;
  created_at: string;
}

export interface SaveImageRequest {
  user_id: string;
  brand_id: string;
  image_url: string;
  variation_name?: string;
  prompt?: string;
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
    slug: string;
    keywords: string[];
  };
  created_at: string;
}

export interface SaveBlogRequest {
  user_id: string;
  brand_id: string;
  title: string;
  full_markdown: string;
  metadata: any;
}

// Blog Interfaces
export interface BlogTopic {
  title: string;
  angle: string;
  target_keywords: string[];
}

export interface BlogIdeationResponse {
  topics: BlogTopic[];
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
}

export interface BlogResponse {
  title: string;
  sections: BlogSection[];
  metadata: BlogMetadata;
  full_markdown: string;
}

export async function fetchIdeate(
  userId: string,
  brandId: string,
  numIdeas: number = 5,
  context?: string,
): Promise<IdeationResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/agent/ideate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      brand_id: brandId,
      num_ideas: numIdeas,
      context: context,
    }),
  });
  if (!response.ok) throw new Error("Failed to fetch ideas");
  return response.json();
}

export async function fetchVisualAsset(
  userId: string,
  brandId: string,
  message: string,
): Promise<AgentResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/agent/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id: userId, brand_id: brandId, message }),
  });
  if (!response.ok) throw new Error("Failed to generate visual asset");
  return response.json();
}

export async function submitFeedback(
  userId: string,
  prompt: string,
  liked: boolean,
  comment?: string,
) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/agent/feedback`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      prompt_used: prompt,
      liked,
      comment,
    }),
  });
  return response.json();
}

export async function fetchUserBrands(userId: string): Promise<Brand[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE_URL}/api/v1/data/users/me/brands`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch brands");
  const data = await response.json();
  return data.data; // Backend returns {status: "success", data: [...]}
}

export async function createBrand(
  userId: string,
  brandData: Omit<Brand, "id">,
): Promise<Brand> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/data/brands`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...brandData, user_id: userId }),
  });
  if (!response.ok) throw new Error("Failed to create brand");
  const data = await response.json();
  return data.data;
}

// Blog Agent Functions
export async function fetchBlogIdeate(
  userId: string,
  brandId: string,
  context?: string,
  numIdeas: number = 5,
): Promise<BlogIdeationResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/agent/blog/ideate`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      brand_id: brandId,
      context,
      num_ideas: numIdeas,
    }),
  });
  if (!response.ok) throw new Error("Failed to fetch blog ideas");
  return response.json();
}

export async function fetchBlogGenerate(
  userId: string,
  brandId: string,
  topic: string,
): Promise<BlogResponse> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/agent/blog/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id: userId, brand_id: brandId, topic }),
  });
  if (!response.ok) throw new Error("Failed to generate blog content");
  return response.json();
}

// Asset Hub Functions
export async function fetchSavedImages(
  userId: string,
  brandId?: string,
): Promise<SavedImage[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = brandId
    ? `${API_BASE_URL}/api/v1/data/assets/images?brand_id=${brandId}`
    : `${API_BASE_URL}/api/v1/data/assets/images`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch saved images");
  return response.json();
}

export async function saveImage(
  request: SaveImageRequest,
): Promise<SavedImage> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/data/assets/images`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error("Failed to save image");
  return response.json();
}

export async function fetchSavedBlogs(
  userId: string,
  brandId?: string,
): Promise<SavedBlog[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = brandId
    ? `${API_BASE_URL}/api/v1/data/assets/blogs?brand_id=${brandId}`
    : `${API_BASE_URL}/api/v1/data/assets/blogs`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch saved blogs");
  return response.json();
}

export async function saveBlog(request: SaveBlogRequest): Promise<SavedBlog> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/data/assets/blogs`, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error("Failed to save blog");
  return response.json();
}

// API Key Management
export interface ApiKey {
  id: string;
  brand_id: string;
  key: string;
  name: string;
  created_at: string;
}

export async function fetchApiKeys(brandId: string): Promise<ApiKey[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/data/brands/${brandId}/keys`,
    { headers },
  );
  if (!response.ok) throw new Error("Failed to fetch API keys");
  const data = await response.json();
  return data.data ?? data;
}

export async function generateApiKey(brandId: string): Promise<ApiKey> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/data/brands/${brandId}/keys`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Website Key" }),
    },
  );
  if (!response.ok) throw new Error("Failed to generate API key");
  const data = await response.json();
  return data.data ?? data;
}
