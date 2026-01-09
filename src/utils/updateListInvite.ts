import { ListInvite } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"

interface UpdateListInviteRoleParams {
  listId: ListInvite["list_id"]
  email: string
  session: Session
  newRole: "editor" | "viewer"
}

export const updateListInvite = async ({
  listId,
  email,
  session,
  newRole
}: UpdateListInviteRoleParams): Promise<{ data: ListInvite; error: null } | { data: null; error: string }> => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("list_invites")
    .update({ role: newRole })
    .match({ list_id: listId, email, status: "pending" })
    .select("*")
    .single()

  if (error) {
    return { data: null, error: `Error updating invite role: ${error.message}` }
  }

  return { data, error: null }
}
