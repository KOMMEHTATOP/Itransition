import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import type { Comment } from '../types/inventory'

const HUB_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export function useInventoryHub(
  inventoryId: string,
  onComment: (comment: Comment) => void,
  enabled: boolean,
  onLikeUpdated?: (itemId: string, likeCount: number) => void,
) {
  const onCommentRef     = useRef(onComment)
  const onLikeUpdatedRef = useRef(onLikeUpdated)
  onCommentRef.current     = onComment
  onLikeUpdatedRef.current = onLikeUpdated

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const conn = new signalR.HubConnectionBuilder()
        .withUrl(`${HUB_BASE}/hubs/inventory`, {
          accessTokenFactory: () => localStorage.getItem('token') ?? '',
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.None)
        .build()

    conn.on('NewComment', (comment: Comment) => onCommentRef.current(comment))
    conn.on('LikeUpdated', (itemId: string, likeCount: number) => {
      onLikeUpdatedRef.current?.(itemId, likeCount)
    })

    conn.start()
      .then(() => {
        if (!cancelled && conn.state === signalR.HubConnectionState.Connected) {
          conn.invoke('JoinInventory', inventoryId).catch(() => {})
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
      conn.stop().catch(() => {})
    }
  }, [inventoryId, enabled])
}
