export interface User {
    id: string;
    token: string;
    displayName: string;
}

export interface Board {
    id: string;
    name: string;
    createdAt: string;
    userCount: number;
    thumbnailBase64: string | null;
}

export interface BoardDetail {
    id: string;
    name: string;
    createdAt: string;
    createdById: string;
    pages: PageItem[];
    users: BoardUserItem[];
}

export interface PageItem {
    id: string;
    title: string;
    sortOrder: number;
}

export interface BoardUserItem {
    userId: string;
    displayName: string;
    role: string;
    joinedAt: string;
}

export interface CanvasElement {
    id: string;
    type: string;
    properties: string;
    zIndex: number;
    version: number;
    createdById: string;
}