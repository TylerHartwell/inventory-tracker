import { supabase } from "@/supabase-client"

export type ListInvitePending = {
  id: string
  list_id: string
  email: string // visible only to this user
  role: "editor" | "viewer"
  status: "pending"
  created_at: string
}

export const getPendingInvites = async (): Promise<ListInvitePending[]> => {
  const { data, error } = await supabase.from("list_invites").select("id, list_id, email, role, status, created_at").eq("status", "pending")

  if (error) throw error
  return data as ListInvitePending[]
}
