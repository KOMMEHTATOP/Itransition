import api from './axios'
import type { SearchResult } from '../types/inventory'

export const searchApi = {
  search: (q: string) =>
    api.get<SearchResult>('/search', { params: { q } }),
}
