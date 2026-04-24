import api from './axios'
import type { ItemDetail, ItemsPageResult, CreateItemRequest, UpdateItemRequest } from '../types/inventory'

export const itemsApi = {
  getAll: (inventoryId: string, page = 1, pageSize = 20, sort = 'newest') =>
    api.get<ItemsPageResult>(`/inventories/${inventoryId}/items`, {
      params: { page, pageSize, sort },
    }),

  getById: (id: string) =>
    api.get<ItemDetail>(`/items/${id}`),

  create: (inventoryId: string, data: CreateItemRequest) =>
    api.post<ItemDetail>(`/inventories/${inventoryId}/items`, data),

  update: (id: string, data: UpdateItemRequest) =>
    api.put<ItemDetail>(`/items/${id}`, data),

  delete: (id: string) =>
    api.delete(`/items/${id}`),

  deleteBatch: (inventoryId: string, ids: string[]) =>
    api.delete(`/inventories/${inventoryId}/items`, { data: ids }),
}
