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

export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
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

  if (!res.ok) {
    const msg =
      (data as { error?: string })?.error ?? `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data as T;
}
