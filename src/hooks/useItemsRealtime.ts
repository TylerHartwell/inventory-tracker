import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../supabase-client"
import { Session } from "@supabase/supabase-js"
import useDeepCompareRef from "./useDeepCompareRef"
import { Item, LocalItem } from "@/components/ItemManager"

export function useItemsRealtime(session: Session, filteredLists: (string | null)[] = []) {
  const [itemsMap, setItemsMap] = useState<Map<string, LocalItem>>(new Map())
  const [loading, setLoading] = useState(true)
  const itemsRef = useRef<Map<string, LocalItem>>(itemsMap) // Keep ref for interval
  const prevListsRef = useRef<(string | null)[]>([])

  const stableFilteredLists = useDeepCompareRef(filteredLists)

  const generateSignedUrl = useCallback(async (filePath: string): Promise<string | null> => {
    if (!filePath) return null

    const expirySeconds = 60 * 20 // 20 minutes

    const { data, error } = await supabase.storage.from("images").createSignedUrl(filePath, expirySeconds)

    if (error || !data) {
      console.error("Signed URL error:", error?.message)

      return null
    }

    return data.signedUrl
  }, [])

  const fetchItemsForLists = useCallback(
    async (lists: (string | null)[], signal?: AbortSignal) => {
      if (signal?.aborted) return [] // early exit if already cancelled
      if (lists.length === 0) return []

      const orConditions: string[] = []
      const listIds = lists.filter((id): id is string => id !== null)
      let query = supabase.from("items").select("*")

      if (lists.includes(null)) {
        orConditions.push(`and(list_id.is.null,user_id.eq.${session.user.id})`)
      }
      if (listIds.length > 0) {
        orConditions.push(`list_id.in.(${listIds.join(",")})`)
      }

      if (orConditions.length > 0) query = query.or(orConditions.join(","))

      if (signal?.aborted) return []

      const { data, error } = await query.order("created_at", { ascending: true })

      if (signal?.aborted) return []
      if (error) throw error

      //Simulate delay
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, 1000)
        signal?.addEventListener("abort", () => {
          clearTimeout(timeout)
          reject(new DOMException("Aborted", "AbortError"))
        })
      })

      if (signal?.aborted) return []

      return Promise.all(
        data.map(async item => {
          if (signal?.aborted) return null
          const signedUrl = item.image_url ? await generateSignedUrl(item.image_url) : null
          return { ...item, signedUrl }
        })
      ).then(items => items.filter((i): i is NonNullable<typeof i> => i !== null))
    },
    [generateSignedUrl, session.user.id]
  )

  const refresh = useCallback(async () => {
    setLoading(true)

    try {
      const fetched = await fetchItemsForLists(stableFilteredLists)

      const newMap = new Map(fetched.map(item => [item.id, item]))

      setItemsMap(newMap)
    } finally {
      setLoading(false)
    }
  }, [fetchItemsForLists, stableFilteredLists])

  const diffLists = useCallback((prev: (string | null)[], next: (string | null)[]) => {
    const added = next.filter(id => !prev.includes(id))
    const removed = prev.filter(id => !next.includes(id))

    return { added, removed }
  }, [])

  useEffect(() => {
    const controller = new AbortController() // for optional fetch cancellation
    const signal = controller.signal

    async function updateItems() {
      const prev = prevListsRef.current
      const current = stableFilteredLists
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
            if (removedSet.has(item.list_id ?? null)) {
              newItemsMap.delete(id)
            }
          }
        }

        // Fetch items for added lists or initial load
        if (added.length > 0 || prev.length === 0) {
          const listsToFetch = prev.length === 0 ? current : added

          const fetched = await fetchItemsForLists(listsToFetch, signal)

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
  }, [stableFilteredLists, diffLists, fetchItemsForLists])

  // Realtime subscription
  useEffect(() => {
    const handleUpsert = async (dbItem: Item) => {
      const listId = dbItem.list_id ?? null

      if (!stableFilteredLists.includes(listId)) return

      let signedUrl: string | null = null

      try {
        signedUrl = dbItem.image_url ? await generateSignedUrl(dbItem.image_url) : null
      } catch (e) {
        console.error("Failed to generate signed URL:", e)
      }

      const item: LocalItem = {
        ...dbItem,
        signedUrl
      }

      setItemsMap(prev => {
        const newMap = new Map(prev)

        newMap.set(item.id, item)

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
  }, [stableFilteredLists, generateSignedUrl, session.user.id])

  // Auto-refresh only items that have image_url
  useEffect(() => {
    const interval = setInterval(async () => {
      const refreshed = await Promise.all(
        Array.from(itemsRef.current.values()).map(async item => {
          if (!item.image_url) return item
          const signedUrl = await generateSignedUrl(item.image_url)
          return { ...item, signedUrl }
        })
      )
      setItemsMap(new Map(refreshed.map(item => [item.id, item])))
    }, 1000 * 60 * 15) // 15 minutes

    return () => clearInterval(interval)
  }, [generateSignedUrl])

  useEffect(() => {
    itemsRef.current = itemsMap
  }, [itemsMap])

  return { items: Array.from(itemsMap.values()), loading, refresh }
}
