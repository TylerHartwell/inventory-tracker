import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { deleteItem } from "./deleteItem"
import { List } from "@/components/ItemManager"

interface DeleteList {
  listId: List["id"]
  session: Session
}

export const deleteList = async ({ listId, session }: DeleteList) => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  const { data: items, error: fetchError } = await supabase.from("items").select("*").eq("list_id", listId)

  if (fetchError) {
    return { data: null, error: fetchError.message }
  }

  for (const item of items || []) {
    const { error } = await deleteItem({ item, session })

    if (error) {
      return { data: null, error: error }
    }
  }

  const { data, error: listError } = await supabase.from("lists").delete().eq("id", listId)

  if (listError) {
    return { data: null, error: listError.message }
  }

  console.log(`✅ Successfully deleted list ${listId} and all associated items/images`)

  return { data: data, error: null }
}
