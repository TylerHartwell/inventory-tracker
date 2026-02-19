import { supabase } from "@/supabase-client"
import { List, ListUser } from "@/components/ItemManager"
import { camelize } from "../caseChanger"

interface DeleteListUserProps {
  listId: List["id"]
  userId: ListUser["userId"]
}

export const deleteListUser = async ({ listId, userId }: DeleteListUserProps) => {
  const { data: deletedListUserDb, error: listUserError } = await supabase
    .from("list_users")
    .delete()
    .eq("list_id", listId)
    .eq("user_id", userId)
    .select()

  if (listUserError) {
    return { data: null, error: listUserError.message }
  }

  return { data: camelize(deletedListUserDb), error: null }
}
