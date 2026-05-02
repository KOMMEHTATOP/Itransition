import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'
import type { Comment } from '../types/inventory'

const HUB_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export function useInventoryHub(
  inventoryId: string,
  onComment: (comment: Comment) => void,
  enabled: boolean,
) {
  const onCommentRef = useRef(onComment)
  onCommentRef.current = onComment

  useEffect(() => {
    if (!enabled) return

    let cancelled = false

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${HUB_BASE}/hubs/inventory`, {
        accessTokenFactory: () => localStorage.getItem('token'),
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build()

    conn.on('NewComment', (comment: Comment) => onCommentRef.current(comment))

    conn.start()
      .then(() => { if (!cancelled) conn.invoke('JoinInventory', inventoryId) })
      .catch(err => { if (!cancelled) console.warn('SignalR connect error:', err) })

    return () => {
      cancelled = true
      conn.stop().catch(() => {})
    }
  }, [inventoryId, enabled])
}
