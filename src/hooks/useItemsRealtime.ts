import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../supabase-client"
import useDeepCompareRef from "./useDeepCompareRef"
import { Item, LocalItem, nullListName } from "@/components/ItemManager"
import { generateSignedUrl } from "@/utils/generateSignedUrl"
import { getItemsForListIds } from "@/utils/getItemsForListIds"
import { diffListIds } from "@/utils/diffListIds"
import { refreshSignedUrls } from "@/utils/refreshSignedUrls"

export function useItemsRealtime(userId: string, filteredListIds: (string | null)[] = []) {
  const [itemsMap, setItemsMap] = useState<Map<string, LocalItem>>(new Map())
  const [loading, setLoading] = useState(true)
  const prevListsRef = useRef<(string | null)[]>([])
  const stableFilteredListIds = useDeepCompareRef(filteredListIds)

  const itemsRef = useRef<Map<string, LocalItem>>(itemsMap) // Keep ref for interval

  const refreshItems = useCallback(async () => {
    setLoading(true)

    try {
      const items = await getItemsForListIds(userId, stableFilteredListIds)

      const newMap = new Map(items.map(item => [item.id, item]))

      setItemsMap(newMap)
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error refreshing items:", err.message, err)
      }
    } finally {
      setLoading(false)
    }
  }, [stableFilteredListIds, userId])

  useEffect(() => {
    const controller = new AbortController() // for optional fetch cancellation
    const signal = controller.signal

    async function updateItems() {
      const prev = prevListsRef.current
      const current = stableFilteredListIds
      const { added, removed } = diffListIds(prev, current)

      // Skip if nothing changed (except initial load)
      if (added.length === 0 && removed.length === 0 && prev.length > 0) return

      setLoading(true)

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

          if (signal.aborted) return

          fetched.forEach(item => newItemsMap.set(item.id, item))
        }

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
        setLoading(false)
      }
    }

    updateItems()

    return () => {
      controller.abort() // cancel ongoing fetch if lists change quickly
    }
  }, [stableFilteredListIds, userId])

  // Realtime subscription
  useEffect(() => {
    const handleUpsert = async (dbItem: Item) => {
      let signedUrl: string | null = null
      let listName = nullListName

      try {
        signedUrl = dbItem.imageUrl ? await generateSignedUrl(dbItem.imageUrl) : null
      } catch (e) {
        console.error("Failed to generate signed URL:", e)
      }

      if (dbItem.listId) {
        try {
          const { data, error } = await supabase.from("lists").select("name").eq("id", dbItem.listId).single()

          if (error) {
            console.error("Error fetching list name:", error)
          } else if (data?.name) {
            listName = data.name
          }
        } catch (e) {
          console.error("Unexpected error fetching list name:", e)
        }
      }

      const item: LocalItem = {
        ...dbItem,
        signedUrl,
        listName
      }

      setItemsMap(prev => {
        const newMap = new Map(prev)

        // Merge incoming item with any existing entry to avoid clobbering fields
        const existing = newMap.get(item.id)
        const merged = existing ? { ...existing, ...item } : item

        newMap.set(item.id, merged)

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

    const nonNullIds = stableFilteredListIds.filter(id => id !== null)
    const hasNull = stableFilteredListIds.includes(null)

    const inFilter = nonNullIds.length > 0 ? `list_id=in.(${nonNullIds.map(id => `"${id}"`).join(",")})` : null

    const channel = supabase.channel(`items-${userId}`)

    // listener for specific list IDs
    if (inFilter) {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "items", filter: inFilter }, payload => {
        if (payload.eventType === "DELETE") handleDelete(payload.old.id)
        else handleUpsert(payload.new as Item)
      })
    }

    // listener for NULL list_id
    if (hasNull) {
      channel.on("postgres_changes", { event: "*", schema: "public", table: "items", filter: `list_id=is.null,user_id=eq.${userId}` }, payload => {
        if (payload.eventType === "DELETE") handleDelete(payload.old.id)
        else handleUpsert(payload.new as Item)
      })
    }

    channel.subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [stableFilteredListIds, userId])

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

  return { items: Array.from(itemsMap.values()), loading, refreshItems }
}
