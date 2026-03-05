import { request } from './api-client';

export interface PostIdea {
  message: string;
}

export interface IdeationResponse {
  ideas: PostIdea[];
}

export interface IdeationInput {
  user_id: string;
  brand_id: string;
  num_ideas?: number;
  context?: string;
}

export async function fetchIdeas(input: IdeationInput): Promise<IdeationResponse> {
  const response = await request<IdeationResponse>('/api/v1/agent/ideate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return response;
}
