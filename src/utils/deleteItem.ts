import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { deleteImage } from "./deleteImage"
import { Item } from "@/components/ItemManager"
import { tryCatch } from "./tryCatch"

export const deleteItem = async (item: Item, session: Session) => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  if (item.image_url) {
    const imageUrl = item.image_url
    const { data, error } = await tryCatch(deleteImage(session, imageUrl))
    if (error) {
      return { data: null, error: `Unexpected error: ${error.message}` }
    }
    if (data.error) {
      return { data: null, error: data.error }
    }
  }

  const { data, error } = await tryCatch(supabase.from("items").delete().eq("id", item.id))
  if (error) {
    return { data: null, error: `Unexpected error: ${error.message}` }
  }

  if (data.error) {
    return { error: `Failed to delete item ${item.id}: ${data.error.message}` }
  }
}
