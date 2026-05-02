import api from './axios'
import type { CustomIdElement, CreateCustomIdElementRequest, UpdateCustomIdElementRequest } from '../types/inventory'

export const customIdApi = {
  getAll: (inventoryId: string) =>
    api.get<CustomIdElement[]>(`/inventories/${inventoryId}/customid`),

  add: (inventoryId: string, data: CreateCustomIdElementRequest) =>
    api.post<CustomIdElement>(`/inventories/${inventoryId}/customid`, data, {
      validateStatus: s => s < 500,
    }),

  update: (inventoryId: string, elementId: string, data: UpdateCustomIdElementRequest) =>
    api.put<CustomIdElement>(`/inventories/${inventoryId}/customid/${elementId}`, data),

  delete: (inventoryId: string, elementId: string) =>
    api.delete(`/inventories/${inventoryId}/customid/${elementId}`),

  reorder: (inventoryId: string, orderedIds: string[]) =>
    api.put(`/inventories/${inventoryId}/customid/reorder`, orderedIds),
}
