import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { List, ListInvite } from "@/components/ItemManager"

interface DeleteListInviteProps {
  listId: List["id"]
  session: Session
  email: ListInvite["email"]
}

export const deleteListInvite = async ({ listId, session, email }: DeleteListInviteProps) => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase.from("list_invites").delete().eq("list_id", listId).eq("email", email).select()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data, error: null }
}
