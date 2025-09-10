import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { uploadImage } from "./uploadImage"
import { Item } from "@/components/ItemManager"
import { deleteImage } from "./deleteImage"

export const updateItem = async (
  item: Item,
  session: Session,
  updates: Partial<{ itemName: string; extraDetails: string; itemImage: File | null }>
) => {
  if (!session.user) {
    console.error("Not authenticated")
    return
  }

  try {
    let imageUrl: string | null = null
    let isRemovingImage = false

    if (updates.itemImage) {
      if (item.image_url) {
        await deleteImage(session, item.image_url)
      }
      imageUrl = await uploadImage(session, updates.itemImage)
    } else if (updates.itemImage === null && item.image_url) {
      await deleteImage(session, item.image_url)
      isRemovingImage = true
    }

    const mappedUpdates: Partial<{ item_name: string; extra_details: string; image_url: string | null }> = {
      ...(updates.itemName !== undefined && { item_name: updates.itemName }),
      ...(updates.extraDetails !== undefined && { extra_details: updates.extraDetails })
    }

    if (imageUrl !== null || isRemovingImage) {
      mappedUpdates.image_url = isRemovingImage ? null : imageUrl
    }

    const { error } = await supabase.from("items").update(mappedUpdates).eq("id", item.id)

    if (error) {
      console.error("Error updating item: ", error.message)
      return
    }
  } catch (err) {
    console.error("Unexpected error:", err)
  }
}
