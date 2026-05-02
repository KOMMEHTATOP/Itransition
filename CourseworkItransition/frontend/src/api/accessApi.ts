import api from './axios'
import type { AccessUser } from '../types/inventory'

export const accessApi = {
  getAll: (inventoryId: string) =>
    api.get<AccessUser[]>(`/inventories/${inventoryId}/access`),

  grant: (inventoryId: string, userId: string) =>
    api.post(`/inventories/${inventoryId}/access/${userId}`, null, {
      validateStatus: s => s < 500,
    }),

  revokeBatch: (inventoryId: string, userIds: string[]) =>
    api.delete(`/inventories/${inventoryId}/access`, { data: userIds }),
}
