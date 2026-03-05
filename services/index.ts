// API Client
export {
  API_BASE_URL,
  ApiError,
  TimeoutError,
  AuthError,
  request,
  getAuthHeaders,
  fetchWithTimeout,
} from './api-client';

// Brands
export type {
  Brand,
  CreateBrandInput,
  UpdateBrandInput,
} from './brands';
export {
  fetchUserBrands,
  createBrand,
  updateBrand,
} from './brands';

// Ideation
export type { PostIdea, IdeationResponse, IdeationInput } from './ideation';
export { fetchIdeas } from './ideation';

// Visual Assets
export type {
  VisualAssetResult,
  VisualAssetResponse,
  VisualAssetInput,
} from './visual-assets';
export { generateVisualAsset } from './visual-assets';

// Feedback
export type { FeedbackInput } from './feedback';
export { submitFeedback } from './feedback';

// Blog
export type {
  BlogTopic,
  BlogIdeationResponse,
  BlogIdeationInput,
  BlogSection,
  BlogMetadata,
  BlogResponse,
  BlogGenerateInput,
  BlogCategory,
  CreateCategoryInput,
} from './blog';
export {
  fetchBlogIdeas,
  generateBlog,
  fetchCategories,
  createCategory,
  deleteCategory,
} from './blog';

// Assets
export type {
  SavedImage,
  SaveImageInput,
  SavedBlog,
  SaveBlogInput,
  UpdateBlogInput,
} from './assets';
export {
  fetchSavedImages,
  saveImage,
  deleteSavedImage,
  fetchSavedBlogs,
  saveBlog,
  updateBlog,
  deleteSavedBlog,
  fetchBlogBySlug,
} from './assets';
