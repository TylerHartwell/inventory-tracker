import { useCallback, useEffect, useRef, useState } from "react"
import { supabase } from "../supabase-client"
import { Session } from "@supabase/supabase-js"

export interface Item {
  id: string
  itemName: string
  extraDetails: string
  created_at: string
  image_url: string | null
  signedUrl: string | null
}

export function useItemsRealtime(session: Session) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const itemsRef = useRef<Item[]>([]) // Keep ref for interval

  useEffect(() => {
    itemsRef.current = items
  }, [items])

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
    const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: true })

    if (error || !data) {
      console.error("Error fetching items:", error?.message)
      setLoading(false)
      return
    }

    const withSignedUrls = await Promise.all(
      data.map(async item => ({
        id: item.id,
        itemName: item.item_name,
        extraDetails: item.extra_details,
        created_at: item.created_at,
        image_url: item.image_url,
        signedUrl: item.image_url ? await generateSignedUrl(item.image_url) : null
      }))
    )

    setItems(withSignedUrls)
    setLoading(false)
  }, [generateSignedUrl])

  // Realtime subscription
  useEffect(() => {
    fetchItems()

    const channel = supabase.channel(`items-${session.user.id}`)

    channel
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "items" }, async payload => {
        const newItem = payload.new as Item
        const signedUrl = newItem.image_url ? await generateSignedUrl(newItem.image_url) : null
        setItems(prev => {
          if (prev.some(item => item.id === newItem.id)) return prev
          return [...prev, { ...newItem, signedUrl }]
        })
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "items" }, async payload => {
        const updatedItem = payload.new as Item
        const signedUrl = updatedItem.image_url ? await generateSignedUrl(updatedItem.image_url) : null
        setItems(prev => prev.map(item => (item.id === updatedItem.id ? { ...updatedItem, signedUrl } : item)))
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "items" }, payload => {
        const deletedId = payload.old.id
        setItems(prev => prev.filter(item => item.id !== deletedId))
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [fetchItems, generateSignedUrl, session.user.id])

  // Auto-refresh only items that have image_url
  useEffect(() => {
    const interval = setInterval(async () => {
      const refreshedItems = await Promise.all(
        itemsRef.current.map(async item => {
          if (!item.image_url) return item // skip items without images
          const signedUrl = await generateSignedUrl(item.image_url)
          return { ...item, signedUrl }
        })
      )
      setItems(refreshedItems)
    }, 1000 * 60 * 15) // 15 minutes

    return () => clearInterval(interval)
  }, [generateSignedUrl])

  return { items, loading, refresh: fetchItems }
}
