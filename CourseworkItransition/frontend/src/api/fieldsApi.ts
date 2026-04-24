import api from './axios'
import type { InventoryField, CreateFieldRequest, UpdateFieldRequest } from '../types/inventory'

export const fieldsApi = {
  getAll: (inventoryId: string) =>
    api.get<InventoryField[]>(`/inventories/${inventoryId}/fields`),

  create: (inventoryId: string, data: CreateFieldRequest) =>
    api.post<InventoryField>(`/inventories/${inventoryId}/fields`, data, {
      validateStatus: s => s < 500,
    }),

  update: (inventoryId: string, fieldId: string, data: UpdateFieldRequest) =>
    api.put<InventoryField>(`/inventories/${inventoryId}/fields/${fieldId}`, data),

  delete: (inventoryId: string, fieldId: string) =>
    api.delete(`/inventories/${inventoryId}/fields/${fieldId}`),

  reorder: (inventoryId: string, orderedIds: string[]) =>
    api.put(`/inventories/${inventoryId}/fields/reorder`, orderedIds),
}
