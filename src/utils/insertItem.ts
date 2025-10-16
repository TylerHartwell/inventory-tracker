import { Session } from "@supabase/supabase-js"
import { uploadImage } from "./uploadImage"
import { supabase } from "@/supabase-client"
import { LocalItem } from "@/components/ItemManager"

interface InsertItemParams {
  session: Session
  itemName: LocalItem["item_name"]
  extraDetails?: LocalItem["extra_details"]
  itemImage?: File | null
  selectedList: string | null
}

export const insertItem = async ({
  session,
  itemName,
  extraDetails = "",
  itemImage,
  selectedList
}: InsertItemParams): Promise<
  | { data: LocalItem; error: null }
  | {
      data: null
      error: string
    }
> => {
  if (!session.user) {
    return { data: null, error: "Not authenticated" }
  }

  if (!itemName.trim()) {
    return { data: null, error: "Item name is required." }
  }

  let imageUrl: string | null = null

  if (itemImage) {
    const { data, error } = await uploadImage({ session, file: itemImage })

    if (error) {
      return { data: null, error: error }
    }

    imageUrl = data
  }

  const { data: insertedItem, error } = await supabase
    .from("items")
    .insert({ item_name: itemName, extra_details: extraDetails, image_url: imageUrl ?? "", list_id: selectedList })
    .select("*")
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // Generate signed URL if image exists
  let signedUrl: string | null = null
  if (insertedItem.image_url) {
    const { data, error } = await supabase.storage.from("images").createSignedUrl(insertedItem.image_url, 60 * 20)

    if (error) {
      return { data: null, error: error.message }
    }

    signedUrl = data.signedUrl
  }

  return { data: { ...insertedItem, signedUrl }, error: null }
}
