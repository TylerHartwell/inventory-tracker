import { supabase } from "@/supabase-client"
import { deleteItem } from "../item/deleteItem"
import { List } from "@/components/ItemManager"
import { camelize } from "../camelize"

interface DeleteList {
  listId: List["id"]
}

export const deleteList = async ({ listId }: DeleteList) => {
  const { data: itemsDb, error: getItemsError } = await supabase.from("items").select("*").eq("list_id", listId)

  if (getItemsError) {
    return { data: null, error: getItemsError.message }
  }

  const items = camelize(itemsDb)

  for (const item of items || []) {
    const { error } = await deleteItem({ itemId: item.id, imageUrl: item.imageUrl })

    if (error) {
      return { data: null, error: error }
    }
  }

  const { error: deleteListError } = await supabase.from("lists").delete().eq("id", listId)

  if (deleteListError) {
    return { data: null, error: deleteListError.message }
  }

  return { data: null, error: null }
}
