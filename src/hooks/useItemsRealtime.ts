import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../supabase-client"
import { Session } from "@supabase/supabase-js"
import useDeepCompareRef from "./useDeepCompareRef"
import { Item, LocalItem, nullListName } from "@/components/ItemManager"
import { generateSignedUrl } from "@/utils/generateSignedUrl"
import { getItemsForListIds } from "@/utils/getItemsForListIds"

export function useItemsRealtime(session: Session, filteredListIds: (string | null)[] = []) {
  const [itemsMap, setItemsMap] = useState<Map<string, LocalItem>>(new Map())
  const [loading, setLoading] = useState(true)
  const prevListsRef = useRef<(string | null)[]>([])
  const stableFilteredListIds = useDeepCompareRef(filteredListIds)

  const itemsRef = useRef<Map<string, LocalItem>>(itemsMap) // Keep ref for interval

  const refreshItems = useCallback(async () => {
    setLoading(true)

    try {
      const fetched = await getItemsForListIds(session.user.id, stableFilteredListIds)

      const newMap = new Map(fetched.map(item => [item.id, item]))

      setItemsMap(newMap)
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error refreshing items:", err.message, err)
      }
    } finally {
      setLoading(false)
    }
  }, [session.user.id, stableFilteredListIds])

  useEffect(() => {
    const controller = new AbortController() // for optional fetch cancellation
    const signal = controller.signal

    async function updateItems() {
      const prev = prevListsRef.current
      const current = stableFilteredListIds
      const { added, removed } = diffLists(prev, current)

      // Skip if nothing changed (except initial load)
      if (added.length === 0 && removed.length === 0 && prev.length > 0) return

      setLoading(true)

      try {
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

        // Fetch items for added lists or initial load
        if (added.length > 0 || prev.length === 0) {
          const listsToFetch = prev.length === 0 ? current : added

          const fetched = await getItemsForListIds(session.user.id, listsToFetch, signal)

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
  }, [stableFilteredListIds, session.user.id])

  // Realtime subscription
  useEffect(() => {
    const handleUpsert = async (dbItem: Item) => {
      const listId = dbItem.listId ?? null

      if (!stableFilteredListIds.includes(listId)) return

      let signedUrl: string | null = null
      let listName = nullListName

      try {
        signedUrl = dbItem.imageUrl ? await generateSignedUrl(dbItem.imageUrl) : null
      } catch (e) {
        console.error("Failed to generate signed URL:", e)
      }

      if (listId) {
        try {
          const { data, error } = await supabase.from("lists").select("name").eq("id", listId).single()

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
        if (!prev.has(deletedId)) return prev

        const newMap = new Map(prev)

        newMap.delete(deletedId)

        return newMap
      })
    }

    const channel = supabase.channel(`items-${session.user.id}`)

    // For items owned by the user
    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "items", filter: `user_id=eq.${session.user.id}` }, payload =>
        handleUpsert(payload.new as Item)
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "items", filter: `user_id=eq.${session.user.id}` }, payload =>
        handleUpsert(payload.new as Item)
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "items", filter: `user_id=eq.${session.user.id}` }, payload =>
        handleDelete(payload.old.id)
      )

    channel.subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [stableFilteredListIds, session.user.id])

  // Auto-refresh only items that have image_url
  useEffect(() => {
    const interval = setInterval(
      async () => {
        const refreshed = await Promise.all(
          Array.from(itemsRef.current.values()).map(async item => {
            if (!item.imageUrl) return item
            const signedUrl = await generateSignedUrl(item.imageUrl)
            return { ...item, signedUrl }
          })
        )
        setItemsMap(new Map(refreshed.map(item => [item.id, item])))
      },
      1000 * 60 * 15
    ) // 15 minutes

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    itemsRef.current = itemsMap
  }, [itemsMap])

  return { items: Array.from(itemsMap.values()), loading, refreshItems }
}

const diffLists = (prev: (string | null)[], next: (string | null)[]) => {
  const added = next.filter(id => !prev.includes(id))
  const removed = prev.filter(id => !next.includes(id))

  return { added, removed }
}
