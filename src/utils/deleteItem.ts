import { supabase } from "@/supabase-client"
import { Session } from "@supabase/supabase-js"
import { deleteImage } from "./deleteImage"
import { Item } from "@/components/ItemManager"

interface DeleteItemProps {
  item: Item
  session: Session
}

export const deleteItem = async ({ item, session }: DeleteItemProps) => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  if (item.image_url) {
    const imageUrl = item.image_url
    const { error } = await deleteImage({ session, imageUrl })
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
