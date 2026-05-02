import api from './axios'
import type { TagCloudItem } from '../types/inventory'

export const tagsApi = {
  search: (q: string, limit = 10) =>
    api.get<string[]>('/tags', { params: { q, limit } }),

  cloud: (limit = 50) =>
    api.get<TagCloudItem[]>('/tags/cloud', { params: { limit } }),
}
