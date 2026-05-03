import api from './axios'
import type { UserSearchResult, UserPublicProfile } from '../types/inventory'

export const usersApi = {
  search: (q: string, limit = 10) =>
    api.get<UserSearchResult[]>('/users/search', { params: { q, limit } }),
  getProfile: (id: string) =>
    api.get<UserPublicProfile>(`/users/${id}/profile`),
}
