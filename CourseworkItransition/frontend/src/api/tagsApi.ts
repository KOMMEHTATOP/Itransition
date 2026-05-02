import api from './axios'

export const tagsApi = {
  search: (q: string, limit = 10) =>
    api.get<string[]>('/tags', { params: { q, limit } }),
}
