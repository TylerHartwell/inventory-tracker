import { Session } from "@supabase/supabase-js"
import { uploadImage } from "./uploadImage"
import { supabase } from "@/supabase-client"
import { Item } from "@/components/ItemManager"

interface InsertItemParams {
  session: Session
  itemName: Item["item_name"]
  extraDetails?: Item["extra_details"]
  itemImage?: File | null
  selectedListId: string | null
}

export const insertItem = async ({
  session,
  itemName,
  extraDetails = "",
  itemImage,
  selectedListId
}: InsertItemParams): Promise<
  | { data: Item; error: null }
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

  const { data: insertedItem, error: insertError } = await supabase
    .from("items")
    .insert({
      item_name: itemName,
      extra_details: extraDetails,
      list_id: selectedListId ?? null
    })
    .select("*")
    .single()

  if (insertError || !insertedItem) {
    return { data: null, error: insertError?.message || "Failed to insert item" }
  }

  let imageUrl: string | null = null

  if (itemImage) {
    const { data, error } = await uploadImage({
      session,
      file: itemImage,
      itemId: insertedItem.id,
      listId: selectedListId ?? null
    })

    if (error) {
      return { data: null, error }
    }

    imageUrl = data

    const { error: updateError } = await supabase.from("items").update({ image_url: imageUrl }).eq("id", insertedItem.id)

    if (updateError) {
      return { data: null, error: updateError.message }
    }
  }

  return { data: { ...insertedItem, image_url: imageUrl }, error: null }
}
