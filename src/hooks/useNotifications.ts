import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import type { LobbyNotification } from '../types/lobby'
import { callEdgeFunction } from '../utils/edgeFunctions'

type MarkNotificationResponse = {
  success: boolean
  updatedCount: number
}

interface UseNotificationsOptions {
  onInsert?: (notification: LobbyNotification) => void
}

interface UseNotificationsResult {
  loading: boolean
  error: string | null
  notifications: LobbyNotification[]
  unreadCount: number
  markRead: (ids: string[]) => Promise<void>
  markAllRead: () => Promise<void>
  clearError: () => void
  refresh: (options?: { silent?: boolean }) => Promise<void>
}

export function useNotifications(options?: UseNotificationsOptions): UseNotificationsResult {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<LobbyNotification[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)

  const isMountedRef = useRef(false)

  const fetchNotifications = useCallback(async (options?: { silent?: boolean }) => {
    if (!userId) {
      setNotifications([])
      setLoading(false)
      return
    }
    const silent = options?.silent ?? false
    if (!silent) {
      setLoading(true)
    }
    try {
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select('id, recipient_id, type, payload, read_at, created_at')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
      if (fetchError) {
        throw fetchError
      }
      setNotifications((data ?? []) as LobbyNotification[])
    } catch (err) {
      console.error('Failed to load notifications', err)
      setError(err instanceof Error ? err.message : 'Failed to load notifications')
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [userId, options?.onInsert])

  const attachRealtime = useCallback(() => {
    if (!userId) return

    if (channelRef.current) {
      const existing = channelRef.current
      channelRef.current = null
      void supabase.removeChannel(existing)
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (payload) => {
          const newNotification = payload.new as LobbyNotification
          setNotifications((prev) => {
            const exists = prev.some((n) => n.id === newNotification.id)
            if (exists) {
              return prev.map((n) => (n.id === newNotification.id ? newNotification : n))
            }
            return [newNotification, ...prev]
          })
          options?.onInsert?.(newNotification)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (payload) => {
          const updated = payload.new as LobbyNotification
          setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (payload) => {
          const removed = payload.old as LobbyNotification
          setNotifications((prev) => prev.filter((n) => n.id !== removed.id))
        },
      )

    channel.subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        console.error('Notifications realtime channel error')
      }
      if (status === 'CLOSED') {
        if (channelRef.current === channel) {
          console.warn('Notifications realtime channel closed unexpectedly, attempting to resubscribe')
          channelRef.current = null
          window.setTimeout(() => {
            if (isMountedRef.current) {
              attachRealtime()
            }
          }, 50)
        }
      }
    })

    channelRef.current = channel
  }, [userId, options?.onInsert])

  useEffect(() => {
    void fetchNotifications()
  }, [fetchNotifications])

  useEffect(() => {
    isMountedRef.current = true
    attachRealtime()
    return () => {
      isMountedRef.current = false
      if (channelRef.current) {
        const channel = channelRef.current
        channelRef.current = null
        void supabase.removeChannel(channel)
      }
    }
  }, [attachRealtime])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  )

  const markRead = useCallback(
    async (ids: string[]) => {
      if (!ids.length) return
      try {
        await callEdgeFunction<MarkNotificationResponse>('mark-notification-read', {
          notificationIds: ids,
        })
        setNotifications((prev) =>
          prev.map((notification) =>
            ids.includes(notification.id)
              ? { ...notification, read_at: new Date().toISOString() }
              : notification,
          ),
        )
      } catch (err) {
        console.error('Failed to mark notifications read', err)
        setError(err instanceof Error ? err.message : 'Failed to mark notifications read')
        throw err
      }
    },
    [],
  )

  const markAllRead = useCallback(async () => {
    if (!notifications.length) return
    try {
      await callEdgeFunction<MarkNotificationResponse>('mark-notification-read', {
        markAll: true,
      })
      const now = new Date().toISOString()
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read_at: now })))
    } catch (err) {
      console.error('Failed to mark all notifications read', err)
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications read')
      throw err
    }
  }, [notifications.length])

  const clearError = useCallback(() => setError(null), [])

  const refresh = useCallback(
    (options?: { silent?: boolean }) => fetchNotifications({ silent: options?.silent ?? true }),
    [fetchNotifications],
  )

  return {
    loading,
    error,
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    clearError,
    refresh,
  }
}
