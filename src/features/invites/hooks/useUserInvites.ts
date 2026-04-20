import { supabase } from "@/supabase-client"
import { useCallback, useEffect, useState } from "react"

export type InviteWithListName = {
  id: string
  role: string
  status: string
  created_at: string
  listId: string
  listName: string
}

type RefreshInvitesResult = {
  data: null
  error: string | null
}

export function useUserInvites() {
  const [invites, setInvites] = useState<InviteWithListName[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshInvites = useCallback(async (): Promise<RefreshInvitesResult> => {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (userError || !user?.email) {
        const errMsg = "Not authenticated"
        setInvites([])
        setError(errMsg)
        return { data: null, error: errMsg }
      }

      const { data, error: inviteError } = await supabase
        .from("list_invites")
        .select(
          `
        id,
        role,
        status,
        created_at,
        lists (
          id,
          name
        )
      `
        )
        .eq("email", user.email.toLowerCase())
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (inviteError) {
        setInvites([])
        setError(inviteError.message)
        return { data: null, error: inviteError.message }
      }

      const formattedInvites: InviteWithListName[] = (data ?? []).flatMap(invite => {
        if (!invite.lists?.id || !invite.lists?.name) {
          return []
        }

        return [
          {
            id: invite.id,
            role: invite.role,
            status: invite.status,
            created_at: invite.created_at,
            listName: invite.lists.name,
            listId: invite.lists.id
          }
        ]
      })

      setInvites(formattedInvites)

      return { data: null, error: null }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to load invites"
      setInvites([])
      setError(errMsg)
      return { data: null, error: errMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const fetchInvites = async () => {
      await refreshInvites()
    }

    fetchInvites()
  }, [refreshInvites])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let pendingRefreshTimeout: ReturnType<typeof setTimeout> | null = null
    let subscribedEmail: string | null = null
    let isMounted = true

    const scheduleRefresh = () => {
      if (pendingRefreshTimeout !== null) return

      pendingRefreshTimeout = setTimeout(() => {
        pendingRefreshTimeout = null
        void refreshInvites()
      }, 150)
    }

    const setupRealtime = async () => {
      try {
        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser()

        if (userError || !user?.email) {
          return
        }

        subscribedEmail = user.email.toLowerCase()
        channel = supabase.channel(`user-invites-${subscribedEmail}`)

        channel.on("postgres_changes", { event: "*", schema: "public", table: "list_invites" }, payload => {
          if (!subscribedEmail) return

          const oldRow = (payload.old as { email?: string; status?: string } | null) ?? null
          const newRow = (payload.new as { email?: string; status?: string } | null) ?? null

          const oldEmail = oldRow?.email?.toLowerCase()
          const newEmail = newRow?.email?.toLowerCase()
          const oldStatus = oldRow?.status
          const newStatus = newRow?.status

          const affectsCurrentUser = oldEmail === subscribedEmail || newEmail === subscribedEmail
          if (!affectsCurrentUser) return

          const affectsPendingInvites = oldStatus === "pending" || newStatus === "pending"
          if (!affectsPendingInvites) return

          scheduleRefresh()
        })

        channel.subscribe((status, subscribeError) => {
          if (!isMounted) return

          if (status === "CHANNEL_ERROR") {
            setError(subscribeError?.message ?? "Realtime invite subscription failed")
          }
        })
      } catch (err) {
        if (!isMounted) return
        const errMsg = err instanceof Error ? err.message : "Failed to set up invite realtime updates"
        setError(errMsg)
      }
    }

    void setupRealtime()

    return () => {
      isMounted = false

      if (pendingRefreshTimeout !== null) {
        clearTimeout(pendingRefreshTimeout)
      }

      if (channel) {
        void channel.unsubscribe()
      }
    }
  }, [refreshInvites])

  return { invites, loading, error, refreshInvites }
}
