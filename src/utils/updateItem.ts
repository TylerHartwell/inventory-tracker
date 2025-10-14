import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { uploadImage } from "./uploadImage"
import { Item } from "@/components/ItemManager"
import { deleteImage } from "./deleteImage"
import { tryCatch } from "./tryCatch"

export const updateItem = async (
  item: Item,
  session: Session,
  updates: Partial<{ itemName: string; extraDetails: string; itemImage: File | null }>
): Promise<
  | { data: Item; error: null }
  | {
      data: null
      error: string
    }
> => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  let imageUrl: string | null = null

  if (updates.itemImage instanceof File || (updates.itemImage === null && item.image_url !== null)) {
    if (item.image_url) {
      const { data, error } = await tryCatch(deleteImage(session, item.image_url))
      if (error) {
        return { data: null, error: `Unexpected error: ${error.message}` }
      }
      if (data.error) {
        return { data: null, error: data.error }
      }
    }
    if (updates.itemImage instanceof File) {
      const { data, error } = await tryCatch(uploadImage(session, updates.itemImage))
      if (error) {
        return { data: null, error: `Unexpected error: ${error.message}` }
      }
      imageUrl = data.data
    }
  }

  const mappedUpdates: Partial<{ item_name: string; extra_details: string; image_url: string | null }> = {
    ...(updates.itemName !== undefined && { item_name: updates.itemName }),
    ...(updates.extraDetails !== undefined && { extra_details: updates.extraDetails })
  }

  if (imageUrl !== null || (updates.itemImage === null && item.image_url !== null)) {
    mappedUpdates.image_url = updates.itemImage === null && item.image_url !== null ? null : imageUrl
  }

  const { data, error } = await supabase.from("items").update(mappedUpdates).eq("id", item.id).select("*").single()

  if (error) {
    return { data: null, error: `Error updating item: ${error.message}` }
  }

  return {
    data: {
      id: data.id,
      itemName: data.item_name,
      extraDetails: data.extra_details,
      created_at: data.created_at,
      image_url: data.image_url,
      signedUrl: item.signedUrl
    },
    error: null
  }
}
