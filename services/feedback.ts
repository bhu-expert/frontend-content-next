import { request } from './api-client';

export interface FeedbackInput {
  user_id: string;
  brand_id: string;
  prompt_used: string;
  liked: boolean;
  comment?: string;
}

export async function submitFeedback(input: FeedbackInput): Promise<void> {
  await request('/api/v1/agent/feedback', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
