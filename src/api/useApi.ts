import { useAuth } from "@clerk/vue";
import { apiFetch } from "./client";
import { useUiStore } from "@/stores/uiStore";

export type UseApiOptions = { silent?: boolean };

/**
 * API client com token Clerk.
 * silent: true — não dispara o loader global (use para polling, refresh em background, etc.)
 */
export function useApi(options: UseApiOptions = {}) {
    const { silent = false } = options;
    const { getToken, isSignedIn } = useAuth();
    const ui = useUiStore();

    async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
        if (!isSignedIn.value) {
            throw { status: 401, message: "Not signed in" };
        }

        if (!silent) ui.startRequest();
        try {
            const token = await getToken.value();
            const headers = new Headers(init.headers || {});
            headers.set("Authorization", `Bearer ${token}`);
            if (init.body) headers.set("Content-Type", "application/json");

            return await apiFetch<T>(path, { ...init, headers });
        } finally {
            if (!silent) ui.endRequest();
        }
    }

    return {
        get: <T>(path: string) => authFetch<T>(path),
        post: <T>(path: string, body?: any) =>
            authFetch<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
        put: <T>(path: string, body?: any) =>
            authFetch<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
        patch: <T>(path: string, body?: any) =>
            authFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
        delete: <T>(path: string) =>
            authFetch<T>(path, { method: "DELETE" }),
    };
}
