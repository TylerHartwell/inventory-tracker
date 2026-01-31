import { ListInvite } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { camelize } from "../camelize"

interface UpdateListInviteRoleParams {
  listId: ListInvite["listId"]
  email: string
  newRole: "editor" | "viewer"
}

export const updateListInvite = async ({
  listId,
  email,
  newRole
}: UpdateListInviteRoleParams): Promise<{ data: ListInvite; error: null } | { data: null; error: string }> => {
  const { data, error } = await supabase
    .from("list_invites")
    .update({ role: newRole })
    .match({ list_id: listId, email, status: "pending" })
    .select("*")
    .single()

  if (error) {
    return { data: null, error: `Error updating invite role: ${error.message}` }
  }

  return { data: camelize(data), error: null }
}
