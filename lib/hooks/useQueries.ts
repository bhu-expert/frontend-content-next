'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import * as api from '@/services';

// ==================== BRANDS ====================

export function useUserBrands(
  userId: string,
  options?: Omit<
    UseQueryOptions<api.Brand[], Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: ['brands', 'user', userId],
    queryFn: () => api.fetchUserBrands(userId),
    enabled: !!userId,
    ...options,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createBrand,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['brands', 'user', data.user_id] });
    },
  });
}

export function useUpdateBrand(brandId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: api.UpdateBrandInput) =>
      api.updateBrand(brandId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['brands', 'user', data.user_id] });
      queryClient.invalidateQueries({ queryKey: ['brands', brandId] });
    },
  });
}

// ==================== IDEATION ====================

export function useIdeation(userId: string, brandId: string) {
  return useQuery({
    queryKey: ['ideation', userId, brandId],
    queryFn: () =>
      api.fetchIdeas({
        user_id: userId,
        brand_id: brandId,
        num_ideas: 5,
      }),
    enabled: !!userId && !!brandId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useRefreshIdeation() {
  const queryClient = useQueryClient();

  return async (userId: string, brandId: string) => {
    const result = await api.fetchIdeas({
      user_id: userId,
      brand_id: brandId,
      num_ideas: 5,
    });
    queryClient.setQueryData(['ideation', userId, brandId], result);
    return result;
  };
}

// ==================== VISUAL ASSETS ====================

export function useGenerateVisualAsset() {
  return useMutation({
    mutationFn: api.generateVisualAsset,
  });
}

// ==================== FEEDBACK ====================

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: api.submitFeedback,
  });
}

// ==================== BLOG ====================

export function useBlogIdeation(
  userId: string,
  brandId: string,
  categoryName?: string,
) {
  return useQuery({
    queryKey: ['blog', 'ideation', userId, brandId, categoryName],
    queryFn: () =>
      api.fetchBlogIdeas({
        user_id: userId,
        brand_id: brandId,
        num_ideas: 5,
        category_name: categoryName,
      }),
    enabled: !!userId && !!brandId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGenerateBlog() {
  return useMutation({
    mutationFn: api.generateBlog,
  });
}

export function useCategories(brandId: string) {
  return useQuery({
    queryKey: ['categories', brandId],
    queryFn: () => api.fetchCategories(brandId),
    enabled: !!brandId,
  });
}

export function useCreateCategory(brandId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: api.CreateCategoryInput) =>
      api.createCategory(brandId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', brandId] });
    },
  });
}

export function useDeleteCategory(brandId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (categoryId: string) =>
      api.deleteCategory(brandId, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', brandId] });
    },
  });
}

// ==================== ASSETS (Images & Blogs) ====================

export function useSavedImages(
  userId: string,
  brandId?: string,
  options?: Omit<
    UseQueryOptions<api.SavedImage[], Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: ['assets', 'images', userId, brandId || 'all'].filter(
      Boolean,
    ) as string[],
    queryFn: () => api.fetchSavedImages(userId, brandId),
    enabled: !!userId,
    ...options,
  });
}

export function useSaveImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.saveImage,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['assets', 'images', data.user_id],
      });
    },
  });
}

export function useDeleteImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteSavedImage,
    onSuccess: (_, imageId) => {
      // Optimistic update handled in component, this is for consistency
      queryClient.invalidateQueries({ queryKey: ['assets', 'images'] });
    },
  });
}

export function useSavedBlogs(
  userId: string,
  brandId?: string,
  options?: Omit<
    UseQueryOptions<api.SavedBlog[], Error>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery({
    queryKey: ['assets', 'blogs', userId, brandId || 'all'].filter(
      Boolean,
    ) as string[],
    queryFn: () => api.fetchSavedBlogs(userId, brandId),
    enabled: !!userId,
    ...options,
  });
}

export function useSaveBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.saveBlog,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['assets', 'blogs', data.user_id],
      });
    },
  });
}

export function useUpdateBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blogId, input }: { blogId: string; input: api.UpdateBlogInput }) =>
      api.updateBlog(blogId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['assets', 'blogs', data.user_id],
      });
      queryClient.invalidateQueries({ queryKey: ['assets', 'blogs', data.id] });
    },
  });
}

export function useDeleteBlog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteSavedBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets', 'blogs'] });
    },
  });
}
