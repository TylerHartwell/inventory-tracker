import { useEffect, useState } from "react"
import { supabase } from "@/supabase-client"

interface List {
  id: string
  name: string
}

export function useUserLists(userId: string) {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setLists([])
      setLoading(false)
      return
    }

    let mounted = true

    const fetchLists = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: userLists, error: userListsError } = await supabase.from("list_users").select("list_id").eq("user_id", userId)

        if (userListsError) throw userListsError
        if (!mounted) return

        const listIds = userLists?.map(l => l.list_id) ?? []
        const { data, error } = await supabase.from("lists").select("id, name").in("id", listIds)

        if (!mounted) return
        if (error) {
          setError(error.message)
          setLists([])
        } else {
          setLists(data)
        }
      } catch (err: unknown) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Unknown error")
        setLists([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchLists()

    return () => {
      mounted = false
    }
  }, [userId])

  return { lists, loading, error }
}
