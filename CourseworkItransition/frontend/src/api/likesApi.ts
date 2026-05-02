import api from './axios'

interface LikeResponse {
  likeCount: number
  isLikedByMe: boolean
}

export const likesApi = {
  like: (itemId: string) =>
    api.post<LikeResponse>(`/items/${itemId}/like`, null, { validateStatus: s => s < 500 }),

  unlike: (itemId: string) =>
    api.delete<LikeResponse>(`/items/${itemId}/like`),
}
