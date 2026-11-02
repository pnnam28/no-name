import {
  getAuthState,
  getRefreshTokenInMemory,
  setSessionActivity,
  storeRefreshedTokens,
} from '../auth.store';

import type {
  RefreshTokenResponse,
} from '../auth.types';

import {
  TokenStorageError,
} from '../utils/token-storage';

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  authenticated?: boolean;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
  ) {
    super('API request failed');
    this.name = 'ApiError';
  }
}

interface PendingTokens {
  source_refresh_token: string;
  tokens: RefreshTokenResponse;
}

let base_url = '';

const max_refresh_attempts = 3;

let refresh_promise: Promise<void> | null = null;

// Keep received tokens if saving fails.
// The next attempt retries saving instead of reusing the old refresh token.
let pending_tokens: PendingTokens | null = null;

export function configureApi(url: string): void {
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(
      'Configure an absolute HTTP(S) backend URL.',
    );
  }

  base_url = url.replace(/\/+$/, '');
}

function checkConfiguration(): void {
  if (!base_url) {
    throw new ApiError(0, 'API_NOT_CONFIGURED');
  }
}

function checkCancellation(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new ApiError(0, 'REQUEST_CANCELLED');
  }
}

function isRefreshResponse(
  value: unknown,
): value is RefreshTokenResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'access_token' in value &&
    typeof value.access_token === 'string' &&
    !!value.access_token.trim() &&
    'refresh_token' in value &&
    typeof value.refresh_token === 'string' &&
    !!value.refresh_token.trim()
  );
}

async function sendRequest(
  path: string,
  options: RequestOptions,
  bearer_token?: string,
): Promise<Response> {
  checkConfiguration();
  checkCancellation(options.signal);

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (bearer_token) {
    headers.Authorization = `Bearer ${bearer_token}`;
  }

  try {
    return await fetch(`${base_url}${path}`, {
      method: options.method,
      headers,
      body:
        options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
      credentials: 'include',
      signal: options.signal,
      cache: 'no-store',
    });
  } catch {
    checkCancellation(options.signal);
    throw new ApiError(0, 'NETWORK_ERROR');
  }
}

async function readResponse<T>(
  response: Response,
): Promise<T> {
  let text: string;

  try {
    text = await response.text();
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR');
  }

  let data: unknown;

  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    if (response.ok) {
      throw new ApiError(
        response.status,
        'INVALID_RESPONSE',
      );
    }
  }

  if (!response.ok) {
    const code =
      typeof data === 'object' &&
      data !== null &&
      'code' in data &&
      typeof data.code === 'string'
        ? data.code
        : undefined;

    throw new ApiError(response.status, code);
  }

  return data as T;
}

export function refreshSession(
  failed_access_token?: string,
): Promise<void> {
  if (refresh_promise) {
    return refresh_promise;
  }

  // Another request may already have renewed the access token.
  if (
    !pending_tokens &&
    failed_access_token &&
    getAuthState().access_token !== failed_access_token
  ) {
    return Promise.resolve();
  }

  refresh_promise = (async () => {
    setSessionActivity(true);

    try {
      const current_refresh_token =
        getRefreshTokenInMemory();

      if (!current_refresh_token) {
        throw new ApiError(0, 'NO_REFRESH_TOKEN');
      }

      // Discard pending tokens belonging to an older session.
      if (
        pending_tokens &&
        pending_tokens.source_refresh_token !==
          current_refresh_token
      ) {
        pending_tokens = null;
      }

      if (!pending_tokens) {
        const response = await sendRequest(
          '/auth/refresh-token',
          { method: 'GET' },
          current_refresh_token,
        );

        if (response.status === 401) {
          throw new ApiError(
            401,
            'REFRESH_REJECTED',
          );
        }

        const tokens = await readResponse<unknown>(
          response,
        );

        if (!isRefreshResponse(tokens)) {
          throw new ApiError(
            502,
            'INVALID_REFRESH_RESPONSE',
          );
        }

        pending_tokens = {
          source_refresh_token: current_refresh_token,
          tokens,
        };
      }

      const received_tokens = pending_tokens;

      await storeRefreshedTokens(
        received_tokens.tokens,
        received_tokens.source_refresh_token,
      );

      pending_tokens = null;

      setSessionActivity(
        false,
        'Session renewed.',
      );
    } catch (error) {
      const message =
        error instanceof TokenStorageError
          ? 'New tokens could not be saved. Retry to save them.'
          : error instanceof ApiError &&
              error.code === 'REFRESH_REJECTED'
            ? 'Your refresh token was rejected. Please sign in again.'
            : error instanceof ApiError &&
                error.code === 'NO_REFRESH_TOKEN'
              ? 'No refresh token is available. Please sign in again.'
              : 'Unable to renew the session. Check your connection and retry.';

      setSessionActivity(false, message);

      throw error;
    }
  })().finally(() => {
    refresh_promise = null;
  });

  return refresh_promise;
}

export async function request<T>(
  path: string,
  options: RequestOptions,
): Promise<T> {
  checkConfiguration();

  if (
    !path.startsWith('/') ||
    path.startsWith('//')
  ) {
    throw new ApiError(0, 'INVALID_API_PATH');
  }

  // Snapshot JSON data so retries reuse the same payload.
  const request_options: RequestOptions = {
    ...options,
    body:
      options.body === undefined
        ? undefined
        : JSON.parse(JSON.stringify(options.body)),
  };

  for (
    let attempt = 0;
    attempt <= max_refresh_attempts;
    attempt += 1
  ) {
    checkCancellation(options.signal);

    let access_token: string | undefined;

    if (options.authenticated) {
      // Finish saving an already-received token pair first.
      if (pending_tokens) {
        await refreshSession();
      }

      checkCancellation(options.signal);

      access_token =
        getAuthState().access_token ?? undefined;

      if (!access_token) {
        throw new ApiError(401, 'AUTH_REQUIRED');
      }
    }

    const response = await sendRequest(
      path,
      request_options,
      access_token,
    );

    if (
      response.status !== 401 ||
      !options.authenticated
    ) {
      return readResponse<T>(response);
    }

    if (attempt === max_refresh_attempts) {
      throw new ApiError(
        401,
        'AUTH_RETRY_LIMIT',
      );
    }

    await refreshSession(access_token);
  }

  throw new ApiError(401, 'AUTH_RETRY_LIMIT');
}