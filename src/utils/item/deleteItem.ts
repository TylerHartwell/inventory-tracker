import { supabase } from "@/supabase-client"

import { deleteImage } from "../image/deleteImage"
import { Item } from "@/components/ItemManager"

interface DeleteItemProps {
  item: Item
}

export const deleteItem = async ({ item }: DeleteItemProps) => {
  if (item.imageUrl) {
    const imageUrl = item.imageUrl
    const { error } = await deleteImage({ imageUrl })
    if (error) {
      return { data: null, error: error }
    }
  }

  const { data, error } = await supabase.from("items").delete().eq("id", item.id)
  if (error) {
    return { data: null, error: `Failed to delete item: ${error.message}` }
  }

  return { data: data, error: null }
}
