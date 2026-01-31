import { ListUser } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { camelize } from "../camelize"

interface UpdateListUserRoleParams {
  listId: ListUser["listId"]
  userId: ListUser["userId"]
  session: Session
  newRole: "editor" | "viewer"
}

export const updateListUser = async ({
  listId,
  userId,
  session,
  newRole
}: UpdateListUserRoleParams): Promise<{ data: ListUser; error: null } | { data: null; error: string }> => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error } = await supabase.from("list_users").update({ role: newRole }).match({ list_id: listId, user_id: userId }).select("*").single()

  if (error) {
    return { data: null, error: `Error updating user role: ${error.message}` }
  }

  return { data: camelize(data), error: null }
}
