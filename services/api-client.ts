import { env } from '@/lib/env';

export const API_BASE_URL = env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class AuthError extends Error {
  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'AuthError';
  }
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {},
): Promise<Response> {
  const { timeout = 600000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new AuthError('Not authenticated');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  };
}

async function request<T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> {
  const headers = await getAuthHeaders();
  
  const response = await fetchWithTimeout(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Response might not be JSON
    }
    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
}

export { request, getAuthHeaders, fetchWithTimeout };
