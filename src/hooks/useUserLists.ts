import { useCallback, useEffect, useState } from "react"
import { supabase } from "@/supabase-client"
import { List } from "@/components/ItemManager"
import { camelize } from "@/utils/caseChanger"

export type UserList = List & {
  role: string
}

export interface UserLists {
  lists: UserList[]
  loading: boolean
  error: string | null
  refreshLists: () => Promise<void>
}

export function useUserLists(userId: string): UserLists {
  const [lists, setLists] = useState<UserList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshLists = useCallback(async () => {
    setError(null)
    try {
      const { data: userLists, error: userListsError } = await supabase.from("list_users").select("list_id, role").eq("user_id", userId)

      if (userListsError) throw userListsError

      const listIds = userLists?.map(l => l.list_id) ?? []

      if (listIds.length === 0) {
        setLists([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase.from("lists").select("*").in("id", listIds)

      if (error) {
        setError(error.message)
        setLists([])
      } else {
        const userListRolesById = new Map<string, string>()
        userLists?.forEach(userList => {
          userListRolesById.set(userList.list_id, userList.role)
        })

        const listsWithRoles = ((camelize(data) ?? []) as List[]).map(list => ({
          ...list,
          role: userListRolesById.get(list.id) ?? "viewer"
        }))
        setLists(listsWithRoles)
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

    setLoading(true)
    refreshLists()
  }, [refreshLists, userId])

  useEffect(() => {
    if (!userId) return

    let pendingRefreshTimeout: ReturnType<typeof setTimeout> | null = null

    const scheduleRefresh = () => {
      if (pendingRefreshTimeout !== null) return

      pendingRefreshTimeout = setTimeout(() => {
        pendingRefreshTimeout = null
        void refreshLists()
      }, 150)
    }

    const channel = supabase.channel(`user-lists-${userId}`)

    channel.on("postgres_changes", { event: "*", schema: "public", table: "list_users" }, payload => {
      if (payload.eventType === "DELETE") {
        scheduleRefresh()
        return
      }

      const oldUserId = (payload.old as { user_id?: string } | null)?.user_id
      const newUserId = (payload.new as { user_id?: string } | null)?.user_id

      if (oldUserId === userId || newUserId === userId) {
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
  }, [userId, refreshLists])

  return { lists, loading, error, refreshLists }
}
