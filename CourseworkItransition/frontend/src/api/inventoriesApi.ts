import api from './axios'
import type {
  Category,
  CreateInventoryRequest,
  InventoryDetail,
  InventoryListItem,
  PagedResult,
  UpdateInventoryRequest,
} from '../types/inventory'

export const inventoriesApi = {
  getAll: (page = 1, pageSize = 20, sort = 'newest') =>
    api.get<PagedResult<InventoryListItem>>('/inventories', {
      params: { page, pageSize, sort },
    }),

  getMy: (page = 1, pageSize = 20, sort = 'newest') =>
    api.get<PagedResult<InventoryListItem>>('/inventories/my', {
      params: { page, pageSize, sort },
    }),

  getAccessible: (page = 1, pageSize = 20, sort = 'newest') =>
    api.get<PagedResult<InventoryListItem>>('/inventories/accessible', {
      params: { page, pageSize, sort },
    }),

  getById: (id: string) =>
    api.get<InventoryDetail>(`/inventories/${id}`),

  getCategories: () =>
    api.get<Category[]>('/inventories/categories'),

  create: (req: CreateInventoryRequest) =>
    api.post<InventoryDetail>('/inventories', req),

  update: (id: string, req: UpdateInventoryRequest) =>
    api.put<InventoryDetail>(`/inventories/${id}`, req),

  delete: (id: string) =>
    api.delete(`/inventories/${id}`),

  deleteBatch: (ids: string[]) =>
    api.delete('/inventories', { data: ids }),
}
