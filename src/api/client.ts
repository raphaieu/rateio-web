const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export type ApiError = { message: string; status: number; details?: any; requestId?: string };

function genRequestId(): string {
    const cryptoObj = (globalThis as any).crypto as Crypto | undefined;
    const uuid = cryptoObj?.randomUUID?.();
    if (uuid) return uuid;
    return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function parseError(res: Response): Promise<ApiError> {
    let payload: any = null;
    try {
        payload = await res.json();
    } catch { }

    return {
        status: res.status,
        message: payload?.message || res.statusText || "Request failed",
        details: payload,
        requestId: res.headers.get("x-request-id") || undefined,
    };
}

export async function apiFetch<T>(
    path: string,
    init: RequestInit = {}
): Promise<T> {
    if (import.meta.env.VITE_USE_STUBS === "true") {
        console.log(`[STUB] ${init.method || "GET"} ${path}`, init.body);
        return {} as T;
    }

    const headers = new Headers(init.headers || {});
    if (!headers.has("x-request-id")) headers.set("x-request-id", genRequestId());
    // só seta content-type se tiver body (evita edge-cases)
    if (init.body) headers.set("Content-Type", "application/json");

    const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

    if (!res.ok) {
        throw await parseError(res);
    }

    if (res.status === 204) return undefined as T;

    return (await res.json()) as T;
}
