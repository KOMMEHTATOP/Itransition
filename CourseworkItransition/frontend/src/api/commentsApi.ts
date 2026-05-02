import api from './axios'
import type { Comment } from '../types/inventory'

export const commentsApi = {
  getAll: (inventoryId: string) =>
    api.get<Comment[]>(`/inventories/${inventoryId}/comments`),

  create: (inventoryId: string, req: { text: string }) =>
    api.post<Comment>(`/inventories/${inventoryId}/comments`, req),
}
