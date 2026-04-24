export interface InventoryListItem {
  id: string
  title: string
  description: string
  imageUrl: string | null
  isPublic: boolean
  ownerId: string
  ownerDisplayName: string
  createdAt: string
  updatedAt: string
  version: number
  categoryId: number | null
  categoryName: string | null
}

export interface InventoryDetail extends InventoryListItem {
  canEdit: boolean
}

export interface Category {
  id: number
  name: string
}

export interface CreateInventoryRequest {
  title: string
  description: string
  isPublic: boolean
  categoryId: number | null
}

export interface UpdateInventoryRequest {
  title: string
  description: string
  isPublic: boolean
  categoryId: number | null
  version: number
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
