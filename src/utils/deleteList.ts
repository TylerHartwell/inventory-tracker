import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { deleteItem } from "./deleteItem"

export const deleteList = async (listId: string, session: Session) => {
  if (!session.user) {
    throw new Error("Not authenticated")
  }

  const { data: items, error: fetchError } = await supabase.from("items").select("*").eq("list_id", listId)

  if (fetchError) {
    throw new Error(`Failed to fetch items: ${fetchError.message}`)
  }

  for (const item of items || []) {
    await deleteItem(item, session)
  }

  const { error: listError } = await supabase.from("lists").delete().eq("id", listId)

  if (listError) {
    throw new Error(`Failed to delete list: ${listError.message}`)
  }

  console.log(`✅ Successfully deleted list ${listId} and all associated items/images`)
}
