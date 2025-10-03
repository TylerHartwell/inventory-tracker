import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../supabase-client"
import { Session } from "@supabase/supabase-js"
import useDeepCompareRef from "./useDeepCompareRef"

export interface Item {
  id: string
  itemName: string
  extraDetails: string
  created_at: string
  image_url: string | null
  signedUrl: string | null
}

interface DbItemPayload {
  id: string
  item_name: string
  extra_details: string | null
  created_at: string
  image_url: string | null
}

export function useItemsRealtime(session: Session, selectedLists: (string | null)[] = []) {
  const [itemsMap, setItemsMap] = useState<Map<string, Item>>(new Map())
  const [loading, setLoading] = useState(true)
  const itemsRef = useRef<Map<string, Item>>(itemsMap) // Keep ref for interval

  useEffect(() => {
    itemsRef.current = itemsMap
  }, [itemsMap])

  const stableSelectedLists = useDeepCompareRef(selectedLists)

  useEffect(() => {
    console.log("Selected lists changed:", stableSelectedLists)
  }, [stableSelectedLists])

  // Generate signed URL for a file
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

  // Fetch items from Supabase
  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const lists = stableSelectedLists.length === 0 ? [null] : stableSelectedLists

      let query = supabase.from("items").select("*")

      const orConditions: string[] = []

      if (lists.includes(null)) {
        orConditions.push(`and(list_id.is.null,user_id.eq.${session.user.id})`)
      }

      const listIds = stableSelectedLists.filter((id): id is string => id !== null)
      if (listIds.length > 0) {
        orConditions.push(`list_id.in.(${listIds.join(",")})`)
      }

      if (orConditions.length > 0) {
        query = query.or(orConditions.join(","))
      }

      const { data, error } = await query.order("created_at", { ascending: true })

      if (error) throw error

      const itemsWithSignedUrls = await Promise.all(
        data.map(async item => ({
          id: item.id,
          itemName: item.item_name,
          extraDetails: item.extra_details,
          created_at: item.created_at,
          image_url: item.image_url,
          signedUrl: item.image_url ? await generateSignedUrl(item.image_url) : null
        }))
      )

      const newMap = new Map<string, Item>()
      itemsWithSignedUrls.forEach(item => newMap.set(item.id, item))
      setItemsMap(newMap)
    } catch (error) {
      console.error("Error fetching items:", error)
    } finally {
      setLoading(false)
    }
  }, [generateSignedUrl, session.user.id, stableSelectedLists])

  // Realtime subscription
  useEffect(() => {
    fetchItems()

    const handleUpsert = async (dbItem: DbItemPayload) => {
      let signedUrl: string | null = null
      try {
        signedUrl = dbItem.image_url ? await generateSignedUrl(dbItem.image_url) : null
      } catch (e) {
        console.error("Failed to generate signed URL:", e)
      }

      const item: Item = {
        id: dbItem.id,
        itemName: dbItem.item_name,
        extraDetails: dbItem.extra_details ?? "",
        created_at: dbItem.created_at,
        image_url: dbItem.image_url,
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
        handleUpsert(payload.new as DbItemPayload)
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "items", filter: `user_id=eq.${session.user.id}` }, payload =>
        handleUpsert(payload.new as DbItemPayload)
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "items", filter: `user_id=eq.${session.user.id}` }, payload =>
        handleDelete(payload.old.id)
      )

    channel.subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [fetchItems, generateSignedUrl, session.user.id])

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

  return { items: Array.from(itemsMap.values()), loading, refresh: fetchItems }
}
