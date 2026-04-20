import { supabase } from "@/supabase-client"
import { Item } from "@/features/items/components/ItemManager"
import { deleteImageWithItemId } from "@/features/items/utils/image/deleteImageWithItemId"

interface DeleteItemParams {
  itemId: Item["id"]
}

export const deleteItem = async ({ itemId }: DeleteItemParams) => {
  const { error: deleteImageError } = await deleteImageWithItemId({ itemId })
  if (deleteImageError) {
    return { data: null, error: deleteImageError }
  }

  //Delete the item from the database
  const { data, error } = await supabase.from("items").delete().eq("id", itemId)
  if (error) {
    return { data: null, error: `Failed to delete item: ${error.message}` }
  }

  return { data: data, error: null }
}
