import { request } from './api-client';

export interface VisualAssetResult {
  variation_name: string;
  prompt: string;
  image_url: string;
}

export interface VisualAssetResponse {
  results: VisualAssetResult[];
}

export interface VisualAssetInput {
  user_id: string;
  brand_id: string;
  message: string;
}

export async function generateVisualAsset(
  input: VisualAssetInput,
): Promise<VisualAssetResponse> {
  const response = await request<VisualAssetResponse>('/api/v1/agent/chat', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response;
}
