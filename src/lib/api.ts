/** Base URL for the CITEzen API (no trailing slash). */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_URL;
  if (typeof raw === 'string' && raw.trim() !== '') {
    return raw.replace(/\/$/, '');
  }
  // Dev: same-origin `/api` so Vite can proxy to the backend (one ngrok tunnel is enough).
  if (import.meta.env.DEV) {
    return '';
  }
  return 'http://localhost:3001'.replace(/\/$/, '');
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('citezen_token');
  } catch {
    return null;
  }
}

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getAuthToken();
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    ...init,
    headers: {
      ...baseHeaders,
      ...(init?.headers as Record<string, string> | undefined)
    }
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if ((data as { success?: boolean })?.success === false) {
    const errPayload = data as {
      error?: { message?: string };
    };
    throw new Error(errPayload.error?.message ?? `Request failed (${res.status})`);
  }

  const normalized =
    (data as { success?: boolean; data?: unknown })?.success === true
      ? (data as { data: unknown }).data
      : data;

  if (!res.ok) {
    const msg =
      (normalized as { error?: string })?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return normalized as T;
}
