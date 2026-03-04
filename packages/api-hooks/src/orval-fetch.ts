/**
 * Custom fetch instance for Orval-generated hooks.
 *
 * Orval generates calls like:
 *   orvalFetch(url, { method: 'POST', headers: {...}, body: JSON.stringify(data), signal })
 *
 * This function adds Privy JWT authentication, 401 auto-retry, and
 * JSON response parsing on top of the native fetch API.
 */

async function getPrivyAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as Record<string, unknown>;
  if (typeof win.__privyGetAccessToken === 'function') {
    return (win.__privyGetAccessToken as () => Promise<string | null>)();
  }
  return null;
}

export const orvalFetch = async <T>(
  url: string,
  options: RequestInit
): Promise<T> => {
  const requestHeaders = new Headers(options.headers);

  if (!requestHeaders.has('Authorization')) {
    const token = await getPrivyAccessToken();
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
  }

  let response = await fetch(url, {
    ...options,
    headers: requestHeaders,
    credentials: 'include',
  });

  if (response.status === 401) {
    const freshToken = await getPrivyAccessToken();
    if (freshToken) {
      requestHeaders.set('Authorization', `Bearer ${freshToken}`);
      response = await fetch(url, {
        ...options,
        headers: requestHeaders,
        credentials: 'include',
      });
    }
  }

  if (!response.ok) {
    const errorBody: Record<string, unknown> = await response
      .json()
      .catch(() => ({}));

    let message = response.statusText;
    const err = errorBody.error;
    if (typeof err === 'object' && err !== null && 'message' in err) {
      message = String((err as Record<string, unknown>).message);
    } else if (typeof errorBody.message === 'string') {
      message = errorBody.message;
    }

    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  if ([204, 205, 304].includes(response.status) || !response.body) {
    return {} as T;
  }

  return response.json() as Promise<T>;
};

export default orvalFetch;

export type ErrorType<_Error = unknown> = Error & { status: number };
export type BodyType<BodyData> = BodyData;
