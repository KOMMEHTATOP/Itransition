import api from './axios'
import type { AdminUser } from '../types/inventory'

export const adminApi = {
  getUsers: () =>
    api.get<AdminUser[]>('/admin/users'),

  block: (ids: string[]) =>
    api.post('/admin/users/block', { ids }),

  unblock: (ids: string[]) =>
    api.post('/admin/users/unblock', { ids }),

  delete: (ids: string[]) =>
    api.delete('/admin/users', { data: { ids } }),

  promote: (ids: string[]) =>
    api.post('/admin/users/promote', { ids }),

  demote: (ids: string[]) =>
    api.post('/admin/users/demote', { ids }),
}
