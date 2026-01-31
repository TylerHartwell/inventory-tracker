import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/supabase-client"
import { List } from "@/components/ItemManager"
import { camelize } from "@/utils/camelize"

export interface UserLists {
  lists: List[]
  loading: boolean
  error: string | null
  fetchLists: () => Promise<void>
}

export function useUserLists(userId: string) {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLists = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: userLists, error: userListsError } = await supabase.from("list_users").select("list_id").eq("user_id", userId)

      if (userListsError) throw userListsError

      const listIds = userLists?.map(l => l.list_id) ?? []
      const { data, error } = await supabase.from("lists").select("*").in("id", listIds)

      if (error) {
        setError(error.message)
        setLists([])
      } else {
        setLists((camelize(data) ?? []) as List[])
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setLists([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setLists([])
      setLoading(false)
      return
    }

    fetchLists()
  }, [fetchLists, userId])

  return { lists, loading, error, fetchLists }
}
