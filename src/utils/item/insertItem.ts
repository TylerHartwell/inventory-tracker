import { uploadImage } from "../image/uploadImage"
import { supabase } from "@/supabase-client"
import { Item } from "@/components/ItemManager"
import { camelize } from "../camelize"

interface InsertItemParams {
  itemName: Item["itemName"]
  extraDetails?: Item["extraDetails"]
  itemImage?: File | null
  selectedListId: string | null
}

export const insertItem = async ({
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
  if (!itemName.trim()) {
    return { data: null, error: "Item name is required." }
  }

  const { data, error: insertError } = await supabase
    .from("items")
    .insert({
      item_name: itemName,
      extra_details: extraDetails,
      list_id: selectedListId
    })
    .select("*")
    .single()

  if (insertError || !data) {
    return { data: null, error: insertError?.message || "Failed to insert item" }
  }

  const insertedItem = camelize(data)

  let imageUrl: string | null = null

  if (itemImage) {
    const { data, error } = await uploadImage({
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

  return { data: { ...insertedItem, imageUrl: imageUrl }, error: null }
}
