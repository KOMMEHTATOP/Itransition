const API_URL = 'http://localhost:5193/api';

function getToken(): string | null {
    return localStorage.getItem('user_token');
}

function headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) h['X-User-Token'] = token;
    return h;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${url}`, {
        ...options,
        headers: { ...headers(), ...options?.headers },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
    }
    if (res.status === 204) return undefined as T;
    return res.json();
}

// Users
export const createUser = (displayName: string) =>
    request<{ id: string; token: string; displayName: string }>('/users', {
        method: 'POST',
        body: JSON.stringify({ displayName }),
    });

export const getMe = () =>
    request<{ id: string; token: string; displayName: string }>('/users/me');

export const updateMe = (displayName: string) =>
    request<{ id: string; token: string; displayName: string }>('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ displayName }),
    });

// Boards
export const getBoards = () =>
    request<{ id: string; name: string; createdAt: string; userCount: number; thumbnailBase64: string | null }[]>('/boards');

export const getBoard = (id: string) =>
    request<{
        id: string; name: string; createdAt: string; createdById: string;
        pages: { id: string; title: string; sortOrder: number }[];
        users: { userId: string; displayName: string; role: string; joinedAt: string }[];
    }>(`/boards/${id}`);

export const createBoard = (name: string) =>
    request<{ id: string; name: string }>('/boards', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });

export const deleteBoard = (id: string) =>
    request<void>(`/boards/${id}`, { method: 'DELETE' });

// Pages
export const getPages = (boardId: string) =>
    request<{ id: string; title: string; sortOrder: number }[]>(`/boards/${boardId}/pages`);

export const createPage = (boardId: string, title?: string) =>
    request<{ id: string; title: string; sortOrder: number }>(`/boards/${boardId}/pages`, {
        method: 'POST',
        body: JSON.stringify({ title }),
    });

export const deletePage = (boardId: string, pageId: string) =>
    request<void>(`/boards/${boardId}/pages/${pageId}`, { method: 'DELETE' });

// Elements
export const getElements = (boardId: string, pageId: string) =>
    request<{ id: string; type: string; properties: string; zIndex: number; version: number; createdById: string }[]>(
        `/boards/${boardId}/pages/${pageId}/elements`
    );