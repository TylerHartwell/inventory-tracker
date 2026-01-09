import { supabase } from "@/supabase-client"
import { useEffect, useState } from "react"

export type InviteWithListName = {
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

  const fetchInvites = async () => {
    setLoading(true)
    setError(null)

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError || !user?.email) {
      const errMsg = "Not authenticated"
      setError(errMsg)
      setLoading(false)
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
      setError(inviteError.message)
      setLoading(false)
      return { data: null, error: inviteError.message }
    }

    const formattedInvites: InviteWithListName[] = (data ?? []).map(invite => ({
      id: invite.id,
      role: invite.role,
      status: invite.status,
      created_at: invite.created_at,
      list: invite.lists
    }))
    setInvites(formattedInvites)
    setLoading(false)

    return { data: null, error: null }
  }

  useEffect(() => {
    fetchInvites()
  }, [])

  return { invites, loading, error, fetchInvites }
}
