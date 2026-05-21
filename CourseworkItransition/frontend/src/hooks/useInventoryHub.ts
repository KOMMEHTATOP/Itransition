import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import type { Comment } from '../types/inventory'

const HUB_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export interface InventoryHubHandlers {
  onComment?: (comment: Comment) => void
  onLikeUpdated?: (itemId: string, likeCount: number) => void
}

export function useInventoryHub(
  inventoryId: string,
  handlers: InventoryHubHandlers,
  enabled: boolean,
) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

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

    conn.on('NewComment', (comment: Comment) => handlersRef.current.onComment?.(comment))
    conn.on('LikeUpdated', (itemId: string, likeCount: number) => {
      handlersRef.current.onLikeUpdated?.(itemId, likeCount)
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
