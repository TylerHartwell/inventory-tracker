import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../supabase-client"
import useDeepCompare from "./useDeepCompare"
import { Item, LocalItem } from "@/components/ItemManager"
import { getItemsForListIds } from "@/utils/getItemsForListIds"
import { diffListIds } from "@/utils/diffListIds"
import { refreshSignedUrls } from "@/utils/refreshSignedUrls"
import { camelize } from "@/utils/caseChanger"

export function useItemsRealtime(userId: string, filteredListIds: (string | null)[] = []) {
  const [itemsMap, setItemsMap] = useState<Map<string, LocalItem>>(new Map())
  const [loading, setLoading] = useState(true)
  const prevListsRef = useRef<(string | null)[]>([])
  const latestRequestIdRef = useRef(0)
  const pendingRequestsRef = useRef(0)
  const stableFilteredListIds = useDeepCompare(filteredListIds)

  const itemsRef = useRef<Map<string, LocalItem>>(itemsMap) // Keep ref for interval

  const startLoading = useCallback(() => {
    pendingRequestsRef.current += 1
    setLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    pendingRequestsRef.current = Math.max(0, pendingRequestsRef.current - 1)

    if (pendingRequestsRef.current === 0) {
      setLoading(false)
    }
  }, [])

  const handleUpsert = (item: LocalItem) => {
    setItemsMap(prev => {
      const newMap = new Map(prev)
      newMap.set(item.id, item) // inserts or replaces
      return newMap
    })
  }

  const handleDelete = (deletedId: string) => {
    setItemsMap(prev => {
      const newMap = new Map(prev)

      newMap.delete(deletedId)

      return newMap
    })
  }

  const refreshItems = useCallback(async () => {
    if (!userId) {
      setItemsMap(new Map())
      prevListsRef.current = [...stableFilteredListIds]
      setLoading(false)
      return
    }

    const requestId = ++latestRequestIdRef.current
    startLoading()

    try {
      const items = await getItemsForListIds(userId, stableFilteredListIds)

      if (requestId !== latestRequestIdRef.current) return

      const newMap = new Map(items.map(item => [item.id, item]))

      setItemsMap(newMap)
      prevListsRef.current = [...stableFilteredListIds]
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error refreshing items:", err.message, err)
      }
    } finally {
      stopLoading()
    }
  }, [stableFilteredListIds, startLoading, stopLoading, userId])

  useEffect(() => {
    const controller = new AbortController() // for optional fetch cancellation
    const signal = controller.signal

    async function updateItems() {
      if (!userId) {
        setItemsMap(new Map())
        prevListsRef.current = [...stableFilteredListIds]
        setLoading(false)
        return
      }

      const prev = prevListsRef.current
      const current = stableFilteredListIds
      const { added, removed } = diffListIds(prev, current)

      // Skip if nothing changed (except initial load)
      if (added.length === 0 && removed.length === 0 && prev.length > 0) return

      const requestId = ++latestRequestIdRef.current
      startLoading()

      const newItemsMap = new Map(itemsRef.current)

      // Efficient removal using Set
      if (removed.length > 0) {
        const removedSet = new Set(removed)
        for (const [id, item] of newItemsMap.entries()) {
          if (removedSet.has(item.listId ?? null)) {
            newItemsMap.delete(id)
          }
        }
      }

      try {
        // Fetch items for added lists or initial load
        if (added.length > 0 || prev.length === 0) {
          const listsToFetch = prev.length === 0 ? current : added

          const fetched = await getItemsForListIds(userId, listsToFetch, signal)

          if (signal.aborted || requestId !== latestRequestIdRef.current) return

          fetched.forEach(item => newItemsMap.set(item.id, item))
        }

        if (signal.aborted || requestId !== latestRequestIdRef.current) return

        setItemsMap(newItemsMap)
        prevListsRef.current = [...current]
      } catch (err) {
        if (err instanceof Error) {
          if (err.name !== "AbortError") {
            console.error("Error updating items:", err.message, err)
          }
        } else {
          console.error("Unknown error updating items:", err)
        }
      } finally {
        stopLoading()
      }
    }

    updateItems()

    return () => {
      controller.abort() // cancel ongoing fetch if lists change quickly
    }
  }, [stableFilteredListIds, startLoading, stopLoading, userId])

  // Realtime subscription
  useEffect(() => {
    const hasNullFilter = stableFilteredListIds.includes(null)
    let pendingRefreshTimeout: ReturnType<typeof setTimeout> | null = null

    const scheduleRefresh = () => {
      if (pendingRefreshTimeout !== null) return

      pendingRefreshTimeout = setTimeout(() => {
        pendingRefreshTimeout = null
        void refreshItems()
      }, 150)
    }

    const isTrackedSharedList = (listId: string | null | undefined) => {
      if (!listId) return false
      return stableFilteredListIds.includes(listId)
    }

    const isTrackedPersonalItem = (row: Partial<Item>) => {
      if (!hasNullFilter) return false
      return (row.listId ?? null) === null && row.userId === userId
    }

    const doesAffectTrackedScope = (oldRow: Partial<Item>, newRow: Partial<Item>) => {
      if (isTrackedSharedList(oldRow.listId) || isTrackedSharedList(newRow.listId)) return true
      if (isTrackedPersonalItem(oldRow) || isTrackedPersonalItem(newRow)) return true
      return false
    }

    const channel = supabase.channel(`items-${userId}`)

    channel.on("postgres_changes", { event: "*", schema: "public", table: "items" }, payload => {
      if (payload.eventType === "DELETE") {
        const deletedId = payload.old?.id as string | undefined

        if (deletedId && itemsRef.current.has(deletedId)) {
          handleDelete(deletedId)
          scheduleRefresh()
        }

        return
      }

      const oldRow = camelize(payload.old ?? {}) as Partial<Item>
      const newRow = camelize(payload.new ?? {}) as Partial<Item>

      if ((payload.eventType === "INSERT" || payload.eventType === "UPDATE") && newRow.lastUpdatedBy === userId) {
        return
      }

      if (doesAffectTrackedScope(oldRow, newRow)) {
        scheduleRefresh()
      }
    })

    channel.subscribe()

    return () => {
      if (pendingRefreshTimeout !== null) {
        clearTimeout(pendingRefreshTimeout)
      }
      channel.unsubscribe()
    }
  }, [refreshItems, stableFilteredListIds, userId])

  // Realtime subscription for list membership and role changes
  useEffect(() => {
    let pendingRefreshTimeout: ReturnType<typeof setTimeout> | null = null

    const scheduleRefresh = () => {
      if (pendingRefreshTimeout !== null) return

      pendingRefreshTimeout = setTimeout(() => {
        pendingRefreshTimeout = null
        void refreshItems()
      }, 150)
    }

    const isTrackedList = (listId: string | null | undefined) => {
      if (!listId) return false
      return stableFilteredListIds.includes(listId)
    }

    const doesAffectCurrentUserPermissions = (
      oldRow: Partial<{ listId: string | null; userId: string | null }>,
      newRow: Partial<{ listId: string | null; userId: string | null }>
    ) => {
      const affectsTrackedList = isTrackedList(oldRow.listId) || isTrackedList(newRow.listId)

      if (!affectsTrackedList) return false

      if (oldRow.userId === userId || newRow.userId === userId) return true

      return !oldRow.userId && !newRow.userId
    }

    const channel = supabase.channel(`list-users-${userId}`)

    channel.on("postgres_changes", { event: "*", schema: "public", table: "list_users" }, payload => {
      if (payload.eventType === "DELETE") {
        scheduleRefresh()
        return
      }

      const oldRow = camelize(payload.old ?? {}) as Partial<{ listId: string | null; userId: string | null }>
      const newRow = camelize(payload.new ?? {}) as Partial<{ listId: string | null; userId: string | null }>

      if (doesAffectCurrentUserPermissions(oldRow, newRow)) {
        scheduleRefresh()
      }
    })

    channel.subscribe()

    return () => {
      if (pendingRefreshTimeout !== null) {
        clearTimeout(pendingRefreshTimeout)
      }
      channel.unsubscribe()
    }
  }, [refreshItems, stableFilteredListIds, userId])

  // Periodically refresh signed URLs every 15 minutes to prevent expiration, without refetching all item data
  useEffect(() => {
    const interval = setInterval(
      async () => {
        const newMap = await refreshSignedUrls(itemsRef.current)

        setItemsMap(newMap)
      },
      1000 * 60 * 15
    ) // 15 minutes

    return () => clearInterval(interval)
  }, [])

  // Keep ref updated with latest itemsMap for interval refresh
  useEffect(() => {
    itemsRef.current = itemsMap
  }, [itemsMap])

  return { items: Array.from(itemsMap.values()), loading, refreshItems, onDelete: handleDelete, onUpsert: handleUpsert }
}
