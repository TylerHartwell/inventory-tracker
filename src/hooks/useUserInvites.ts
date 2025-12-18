import { supabase } from "@/supabase-client"
import { useEffect, useState } from "react"

type InviteWithListName = {
  id: string
  role: string
  status: string
  created_at: string
  list: {
    id: string
    name: string
  }
}

export function useUserInvites() {
  const [invites, setInvites] = useState<InviteWithListName[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInvites = async () => {
      setLoading(true)

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      if (userError || !user?.email) {
        setError("Not authenticated")
        setLoading(false)
        return
      }

      const { data, error } = await supabase
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

      if (error) {
        setError(error.message)
      } else {
        setInvites(
          (data ?? []).map(invite => ({
            ...invite,
            list: invite.lists
          }))
        )
      }

      setLoading(false)
    }

    fetchInvites()
  }, [])

  return { invites, loading, error }
}
