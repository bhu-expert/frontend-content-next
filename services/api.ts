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
  location?: string;
}

export interface PostIdea {
  message: string;
}

export interface ReelScriptIdea {
  title: string;
  hook: string;
  scene_description: string;
  voiceover_dialogue: string;
  duration_seconds: number;
  cta: string;
  audio_suggestion: string;
  hashtags: string[];
  camera_angle?: string;
  pacing?: string;
  text_overlay?: string;
  transitions?: string;
}

export interface ReelScriptIdeationResponse {
  scripts: ReelScriptIdea[];
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

// Post Queue Interfaces
export interface QueuedIdeaItem {
  message: string;
  idea_type: "scene" | "commercial_ad" | "reel_script";
}

export interface QueuedPost {
  id: string;
  idea_type: string;
  message: string;
  status: "queued" | "processing" | "completed" | "failed";
  image_url?: string;
  prompt_used?: string;
  created_at: string;
}

export interface PostQueueResponse {
  posts: QueuedPost[];
  total: number;
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
    keywords: string[];
    slug: string;
    cover_image?: string;
  };
  cover_image?: string;
  status: "draft" | "scheduled" | "published";
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
}

export interface SaveBlogRequest {
  user_id: string;
  brand_id: string;
  title: string;
  full_markdown: string;
  metadata: any;
  status?: "draft" | "scheduled" | "published";
  scheduled_at?: string;
  published_at?: string;
  cover_image?: string;
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
  cover_image?: string;
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 600s

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/agent/ideate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: userId,
        brand_id: brandId,
        num_ideas: numIdeas,
        context: context,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("Failed to fetch ideas");
    return response.json();
  } catch (error: any) {
    if (error.name === "AbortError") throw new Error("Ideation timed out.");
    throw error;
  }
}

export async function fetchAdIdeate(
  userId: string,
  brandId: string,
  numIdeas: number = 5,
  context?: string,
): Promise<IdeationResponse> {
  const headers = await getAuthHeaders();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 600s

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/agent/ad-ideate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: userId,
        brand_id: brandId,
        num_ideas: numIdeas,
        context: context,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("Failed to fetch ad ideas");
    return response.json();
  } catch (error: any) {
    if (error.name === "AbortError") throw new Error("Ad ideation timed out.");
    throw error;
  }
}

export async function fetchReelScriptIdeate(
  userId: string,
  brandId: string,
  numIdeas: number = 3,
  context?: string,
): Promise<ReelScriptIdeationResponse> {
  const headers = await getAuthHeaders();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000); // 180s (reduced from 600s)

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/agent/reel-script/ideate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        user_id: userId,
        brand_id: brandId,
        num_ideas: numIdeas,
        context: context,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("Failed to fetch reel script ideas");
    return response.json();
  } catch (error: any) {
    if (error.name === "AbortError") throw new Error("Reel script ideation timed out.");
    throw error;
  }
}

export async function queuePosts(
  userId: string,
  brandId: string,
  ideas: QueuedIdeaItem[],
): Promise<{ status: string; count: number; queued: any[] }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/agent/queue-posts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      brand_id: brandId,
      ideas,
    }),
  });
  if (!response.ok) throw new Error("Failed to queue posts");
  return response.json();
}

export async function fetchPostQueue(
  brandId: string,
  status?: string,
): Promise<PostQueueResponse> {
  const headers = await getAuthHeaders();
  let url = `${API_BASE_URL}/api/v1/agent/queue?brand_id=${brandId}`;
  if (status) url += `&status=${status}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error("Failed to fetch queue");
  return response.json();
}

export async function deleteQueuedPost(postId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/v1/agent/queue/${postId}`, {
    method: "DELETE",
    headers,
  });
  if (!response.ok) throw new Error("Failed to remove from queue");
}

export async function submitFeedback(
  userId: string,
  brandId: string,
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
      brand_id: brandId,
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

export async function updateBrand(
  brandId: string,
  brandData: Partial<Omit<Brand, "id">>,
): Promise<Brand> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/data/brands/${brandId}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(brandData),
    },
  );
  if (!response.ok) throw new Error("Failed to update brand");
  const data = await response.json();
  return data.data;
}

// Blog Agent Functions
export async function fetchBlogIdeate(
  userId: string,
  brandId: string,
  context?: string,
  numIdeas: number = 5,
  categoryName?: string,
): Promise<BlogIdeationResponse> {
  const headers = await getAuthHeaders();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 600s

  try {
    const body: any = {
      user_id: userId,
      brand_id: brandId,
      context,
      num_ideas: numIdeas,
    };
    if (categoryName) body.category_name = categoryName;

    const response = await fetch(`${API_BASE_URL}/api/v1/agent/blog/ideate`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error("Failed to fetch blog ideas");
    return response.json();
  } catch (error: any) {
    if (error.name === "AbortError")
      throw new Error("Blog ideation timed out.");
    throw error;
  }
}

export async function fetchBlogGenerate(
  userId: string,
  brandId: string,
  topic: string,
  categorySlug?: string,
  imageSource?: "ai" | "stock",
): Promise<BlogResponse> {
  const headers = await getAuthHeaders();

  // Create a controller for custom timeout (5 minutes)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000); // 600 seconds

  try {
    const body: any = { user_id: userId, brand_id: brandId, topic };
    if (categorySlug) body.category_slug = categorySlug;
    if (imageSource) body.image_source = imageSource;

    const response = await fetch(`${API_BASE_URL}/api/v1/agent/blog/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error("Failed to generate blog content");
    return response.json();
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(
        "Generation timed out. The agent is taking longer than expected.",
      );
    }
    throw error;
  }
}

// --- BLOG CATEGORIES ---

export interface BlogCategory {
  id: string;
  brand_id: string;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export async function fetchCategories(
  brandId: string,
): Promise<BlogCategory[]> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/data/brands/${brandId}/categories`,
    { headers },
  );
  if (!response.ok) throw new Error("Failed to fetch categories");
  const data = await response.json();
  return data.data || [];
}

export async function createCategory(
  brandId: string,
  name: string,
  slug: string,
  description: string = "",
): Promise<BlogCategory> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/data/brands/${brandId}/categories`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ name, slug, description }),
    },
  );
  if (!response.ok) throw new Error("Failed to create category");
  const data = await response.json();
  return data.data;
}

export async function deleteCategory(
  brandId: string,
  categoryId: string,
): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/data/brands/${brandId}/categories/${categoryId}`,
    {
      method: "DELETE",
      headers,
    },
  );
  if (!response.ok) throw new Error("Failed to delete category");
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
  last_used_at: string | null;
  is_active: boolean;
}

export async function deleteSavedImage(imageId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/data/assets/images/${imageId}`,
    {
      method: "DELETE",
      headers,
    },
  );
  if (!response.ok) throw new Error("Failed to delete image");
}

export async function deleteSavedBlog(blogId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/data/assets/blogs/${blogId}`,
    {
      method: "DELETE",
      headers,
    },
  );
  if (!response.ok) throw new Error("Failed to delete blog");
}

export async function fetchBlogBySlug(slug: string): Promise<SavedBlog | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const response = await fetch(`${API_BASE_URL}/api/v1/data/assets/blogs`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });
  if (!response.ok) return null;
  const blogs: SavedBlog[] = await response.json();
  return blogs.find((b) => b.metadata?.slug === slug) ?? null;
}

export async function updateBlog(
  blogId: string,
  data: {
    title?: string;
    full_markdown?: string;
    status?: "draft" | "scheduled" | "published";
    scheduled_at?: string;
  },
): Promise<SavedBlog> {
  const headers = await getAuthHeaders();
  const response = await fetch(
    `${API_BASE_URL}/api/v1/data/assets/blogs/${blogId}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    },
  );
  if (!response.ok) throw new Error("Failed to update blog");
  return response.json();
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
