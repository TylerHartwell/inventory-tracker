import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { List, ListUser } from "@/components/ItemManager"

interface DeleteListUserProps {
  listId: List["id"]
  session: Session
  userId: ListUser["user_id"]
}

export const deleteListUser = async ({ listId, session, userId }: DeleteListUserProps) => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data, error: listUserError } = await supabase.from("list_users").delete().eq("list_id", listId).eq("user_id", userId).select()

  if (listUserError) {
    return { data: null, error: listUserError.message }
  }

  return { data: data, error: null }
}
