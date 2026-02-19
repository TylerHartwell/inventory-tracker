import { supabase } from "@/supabase-client"
import { List, ListInvite } from "@/components/ItemManager"
import { camelize } from "../caseChanger"

interface DeleteListInviteProps {
  listId: List["id"]
  email: ListInvite["email"]
}

export const deleteListInvite = async ({ listId, email }: DeleteListInviteProps) => {
  const { data: deletedListInviteDb, error } = await supabase.from("list_invites").delete().eq("list_id", listId).eq("email", email).select()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: camelize(deletedListInviteDb), error: null }
}
