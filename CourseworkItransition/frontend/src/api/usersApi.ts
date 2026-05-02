import api from './axios'
import type { UserSearchResult } from '../types/inventory'

export const usersApi = {
  search: (q: string, limit = 10) =>
    api.get<UserSearchResult[]>('/users/search', { params: { q, limit } }),
}
