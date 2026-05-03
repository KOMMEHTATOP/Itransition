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
  tags: string[]
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
  imageUrl: string | null
  tags: string[]
}

// --- Access ---

export interface AccessUser {
  id: string
  displayName: string
  email: string
}

export interface UserSearchResult {
  id: string
  displayName: string
  email: string
}

export interface UserPublicProfile {
  id: string
  displayName: string
  inventories: InventoryListItem[]
}

export interface PagedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// --- Fields ---

export type FieldType = 'Text' | 'MultilineText' | 'Number' | 'Link' | 'Boolean'

export interface InventoryField {
  id: string
  title: string
  description: string
  type: FieldType
  order: number
  showInTable: boolean
}

export interface CreateFieldRequest {
  title: string
  description?: string
  type: string
  showInTable: boolean
}

export interface UpdateFieldRequest {
  title: string
  description?: string
  showInTable: boolean
  order: number
}

// --- Items ---

export interface ItemFieldValue {
  fieldId: string
  fieldTitle: string
  fieldType: string
  value: string
}

export interface ItemListItem {
  id: string
  customId: string
  authorId: string
  authorDisplayName: string
  createdAt: string
  fieldValues: ItemFieldValue[]
}

export interface ItemDetail {
  id: string
  customId: string
  authorId: string
  authorDisplayName: string
  createdAt: string
  updatedAt: string
  version: number
  inventoryId: string
  canEdit: boolean
  fieldValues: ItemFieldValue[]
  likeCount: number
  isLikedByMe: boolean
}

// --- Comments ---

export interface Comment {
  id: string
  authorId: string
  authorDisplayName: string
  text: string
  createdAt: string
}

// --- Tag cloud ---

export interface TagCloudItem {
  tag: string
  count: number
}

export interface ItemsPageResult {
  fields: InventoryField[]
  items: PagedResult<ItemListItem>
  canEdit: boolean
  hasCustomIdFormat: boolean
}

// --- Custom ID ---

export type CustomIdElementType =
  | 'Fixed'
  | 'Random20bit'
  | 'Random32bit'
  | 'Random6digit'
  | 'Random9digit'
  | 'GUID'
  | 'DateTime'
  | 'Sequence'

export interface CustomIdElement {
  id: string
  type: CustomIdElementType
  formatString: string
  order: number
}

export interface CreateCustomIdElementRequest {
  type: CustomIdElementType
  formatString: string
}

export interface UpdateCustomIdElementRequest {
  type: CustomIdElementType
  formatString: string
  order: number
}

// --- Search ---

export interface SearchResult {
  inventories: InventorySearchResult[]
  items: ItemSearchResult[]
}

export interface InventorySearchResult {
  id: string
  title: string
  description: string
  ownerDisplayName: string
  createdAt: string
  categoryName: string | null
}

export interface ItemSearchResult {
  id: string
  customId: string
  inventoryId: string
  inventoryTitle: string
  authorDisplayName: string
  createdAt: string
}

// --- Home page ---

export interface TopInventory {
  id: string
  title: string
  ownerDisplayName: string
  itemCount: number
}

export interface ItemFieldValueRequest {
  fieldId: string
  value: string
}

export interface CreateItemRequest {
  customId: string
  fieldValues: ItemFieldValueRequest[]
}

export interface UpdateItemRequest {
  customId: string
  fieldValues: ItemFieldValueRequest[]
  version: number
}

// --- Stats ---

export interface InventoryStats {
  totalItems: number
  numericFields: NumericFieldStat[]
  textFields: TextFieldStat[]
}

export interface NumericFieldStat {
  fieldId: string
  fieldTitle: string
  count: number
  min: number
  max: number
  avg: number
}

export interface TextFieldStat {
  fieldId: string
  fieldTitle: string
  topValues: TopValue[]
}

export interface TopValue {
  value: string
  count: number
}

// --- Admin ---

export interface AdminUser {
  id: string
  displayName: string
  email: string
  isBlocked: boolean
  isAdmin: boolean
  createdAt: string
  inventoryCount: number
}

