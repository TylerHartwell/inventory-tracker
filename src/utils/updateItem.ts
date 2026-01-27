import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { uploadImage } from "./uploadImage"
import { Item, LocalItem } from "@/components/ItemManager"
import { deleteImage } from "./deleteImage"
import { UpdatePayload } from "@/components/ItemCard"

interface updateItemParams {
  item: LocalItem
  session: Session
  updates: UpdatePayload
}

export const updateItem = async ({
  item,
  session,
  updates
}: updateItemParams): Promise<
  | { data: Item; error: null }
  | {
      data: null
      error: string
    }
> => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  const mappedUpdates: Partial<{ item_name: string; extra_details: string; image_url: string | null }> = {
    ...(updates.itemName !== undefined && { item_name: updates.itemName }),
    ...(updates.extraDetails !== undefined && { extra_details: updates.extraDetails })
  }

  if (updates.itemImage !== undefined) {
    if (item.image_url) {
      const { error } = await deleteImage({ session, imageUrl: item.image_url })
      if (error) {
        return { data: null, error }
      }
    }

    if (updates.itemImage) {
      const { data, error } = await uploadImage({
        session,
        file: updates.itemImage,
        itemId: item.id,
        listId: item.list_id
      })
      if (error) {
        return { data: null, error }
      }
      mappedUpdates.image_url = data
    } else {
      mappedUpdates.image_url = null
    }
  }

  const { data, error } = await supabase.from("items").update(mappedUpdates).eq("id", item.id).select("*").single()

  if (error) {
    return { data: null, error: `Error updating item: ${error.message}` }
  }

  return {
    data: {
      ...data
    },
    error: null
  }
}
