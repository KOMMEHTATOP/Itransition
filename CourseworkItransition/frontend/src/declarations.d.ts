declare module '@yaireo/tagify/dist/react.tagify' {
  import type { MutableRefObject, SyntheticEvent } from 'react'

  interface TagifyRef {
    getCleanValue: () => Array<{ value: string }>
  }

  interface TagifySettings {
    whitelist?: string[]
    dropdown?: {
      enabled?: number
      maxItems?: number
      closeOnSelect?: boolean
    }
    [key: string]: unknown
  }

  interface TagifyProps {
    tagifyRef?: MutableRefObject<TagifyRef | null>
    whitelist?: string[]
    settings?: TagifySettings
    defaultValue?: string
    onAdd?: (e: SyntheticEvent) => void
    onChange?: (e: SyntheticEvent) => void
    onRemove?: (e: SyntheticEvent) => void
    [key: string]: unknown
  }

  export default function Tags(props: TagifyProps): JSX.Element
}

declare module 'react-tagcloud' {
  interface Tag {
    value: string
    count: number
    [key: string]: unknown
  }

  interface TagCloudProps {
    tags: Tag[]
    minSize: number
    maxSize: number
    onClick?: (tag: Tag) => void
    className?: string
    [key: string]: unknown
  }

  export function TagCloud(props: TagCloudProps): JSX.Element
}
