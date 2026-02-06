import { supabase } from "@/supabase-client"
import { uploadImage } from "../image/uploadImage"
import { Item } from "@/components/ItemManager"
import { UpdatePayload } from "@/components/sorted-item-results/ItemCard"
import { camelize } from "../camelize"
import { deleteImageWithItemId } from "../image/deleteImageWithItemId"

interface UpdateItemParams<T extends Item> {
  item: T
  updates: UpdatePayload
}

export const updateItem = async <T extends Item>({
  item,
  updates
}: UpdateItemParams<T>): Promise<
  | { data: Item; error: null }
  | {
      data: null
      error: string
    }
> => {
  const mappedUpdates: Partial<{ item_name: string; extra_details: string | null; image_url: string | null }> = {
    ...(updates.itemName !== undefined && { item_name: updates.itemName }),
    ...(updates.extraDetails !== undefined && { extra_details: updates.extraDetails })
  }

  if (updates.itemImage !== undefined) {
    if (item.imageUrl) {
      const { error } = await deleteImageWithItemId({ itemId: item.id, imageUrl: item.imageUrl, shouldClearItemImageUrl: false })
      if (error) {
        console.error("Failed to delete existing image:", error)
        return { data: null, error }
      }
    }

    mappedUpdates.image_url = null

    if (updates.itemImage) {
      const { data, error } = await uploadImage({
        file: updates.itemImage,
        itemId: item.id,
        listId: item.listId
      })
      if (error) {
        console.error("Failed to upload new image:", error)
        return { data: null, error }
      }
      mappedUpdates.image_url = data
    }
  }

  const { data, error } = await supabase.from("items").update(mappedUpdates).eq("id", item.id).select("*").single()

  if (error) {
    console.error("Error updating item:", error)
    return { data: null, error: `Error updating item: ${error.message}` }
  }

  return {
    data: camelize(data),
    error: null
  }
}
