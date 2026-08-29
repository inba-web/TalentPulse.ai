/**
 * Centralised API fetch helper.
 * Automatically attaches the JWT Bearer token from the auth store on every request.
 * All stores and pages should use `apiFetch` instead of bare `fetch`.
 */

import { useAuthStore } from '../store/authStore';

type FetchOptions = RequestInit & {
  skipAuth?: boolean;
};

export async function apiFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const { accessToken } = useAuthStore.getState();
  const { skipAuth, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  // Attach Bearer token unless caller explicitly skips auth
  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Don't override Content-Type for FormData — let browser set boundary automatically
  if (fetchOptions.body && !(fetchOptions.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const response = await fetch(path, {
    ...fetchOptions,
    headers,
  });

  // If we get a 401, attempt a token refresh and retry once
  if (response.status === 401 && !skipAuth) {
    const refreshed = await useAuthStore.getState().refresh();
    if (refreshed) {
      const newToken = useAuthStore.getState().accessToken;
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      }
      return fetch(path, { ...fetchOptions, headers });
    }
    // Refresh failed — force logout
    useAuthStore.getState().logout();
  }

  return response;
}
