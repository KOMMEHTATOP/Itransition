import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import type { Comment } from '../types/inventory'

const HUB_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5054'

export function useInventoryHub(
  inventoryId: string,
  onComment: (comment: Comment) => void,
  enabled: boolean,
) {
  const onCommentRef = useRef(onComment)
  onCommentRef.current = onComment

  useEffect(() => {
    if (!enabled) return

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_BASE}/hubs/inventory`, {
        accessTokenFactory: () => localStorage.getItem('token') ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()

    conn.on('NewComment', (comment: Comment) => onCommentRef.current(comment))

    conn
      .start()
      .then(() => conn.invoke('JoinInventory', inventoryId))
      .catch(err => console.warn('SignalR connect error:', err))

    return () => {
      conn.invoke('LeaveInventory', inventoryId)
        .catch(() => {})
        .finally(() => conn.stop())
    }
  }, [inventoryId, enabled])
}
