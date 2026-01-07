import { supabase } from "@/supabase-client"

export type ListMember = {
  list_id: string | null
  user_id: string | null
  username: string | null
  email: string | null
  role: "owner" | "editor" | "viewer"
  pending: boolean
}

export const getListMembers = async (
  listId: string
): Promise<
  | { data: ListMember[]; error: null }
  | {
      data: null
      error: string
    }
> => {
  const { data, error } = await supabase.from("list_members").select("*").eq("list_id", listId).order("pending", { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as ListMember[], error: null }
}
