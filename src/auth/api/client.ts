import { getAuthState } from '../auth/auth.store';

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  authenticated?: boolean;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code?: string) {
    super('API request failed');
    this.name = 'ApiError';
  }
}

let baseUrl = '';

/** Call during app startup with the absolute backend URL before making requests. */
export function configureApi(url: string): void {
  if (!/^https?:\/\//i.test(url)) throw new Error('Configure an absolute HTTP(S) backend URL.');
  baseUrl = url.replace(/\/+$/, '');
}

/** Basic HTTP client. Refresh and retry remain pending the backend token contract. */
export async function request<T>(path: string, options: RequestOptions): Promise<T> {
  if (!baseUrl) throw new ApiError(0, 'API_NOT_CONFIGURED');
  if (!path.startsWith('/') || path.startsWith('//')) throw new ApiError(0, 'INVALID_API_PATH');
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.authenticated) {
    const token = getAuthState().accessToken;
    if (!token) throw new ApiError(401, 'AUTH_REQUIRED');
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'include', // Cookie support depends on the platform and backend; native session persistence is not implemented.
    signal: options.signal,
  });

  const text = await response.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : undefined; }
  catch {
    if (response.ok) throw new ApiError(response.status, 'INVALID_RESPONSE');
  }
  if (!response.ok) {
    const code = typeof data === 'object' && data !== null && 'code' in data
      && typeof data.code === 'string' ? data.code : undefined;
    throw new ApiError(response.status, code);
  }
  return data as T;
}
