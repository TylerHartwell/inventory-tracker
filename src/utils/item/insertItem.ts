import { uploadImage } from "../image/uploadImage"
import { supabase } from "@/supabase-client"
import { InsertableItem, LocalItem, nullListName } from "@/components/ItemManager"
import { camelize, snakeify } from "../caseChanger"
import { generateSignedUrl } from "../generateSignedUrl"

interface InsertItemParams {
  newItem: InsertableItem
  itemImage: File | null
}

export const insertItem = async ({
  newItem,
  itemImage
}: InsertItemParams): Promise<
  | { data: LocalItem; error: null }
  | {
      data: null
      error: string
    }
> => {
  if (!newItem.itemName.trim()) {
    return { data: null, error: "Item name is required." }
  }

  const insertPayload = snakeify(newItem)

  const { data: insertedItemWListName, error: insertError } = await supabase.from("items").insert(insertPayload).select("*, lists(name)").single()

  if (insertError || !insertedItemWListName) {
    return { data: null, error: insertError?.message || "Failed to insert item" }
  }

  const { lists, ...insertedItem } = camelize(insertedItemWListName)

  const localItem: LocalItem = {
    ...insertedItem,
    signedUrl: null,
    listName: lists?.name ?? nullListName
  }

  if (itemImage) {
    const { data: uploadedImageUrl, error: uploadError } = await uploadImage({
      file: itemImage,
      itemId: localItem.id
    })

    if (uploadError || !uploadedImageUrl) {
      return { data: null, error: uploadError || "Image upload did not return an image url" }
    }

    const { error: updateError } = await supabase.from("items").update({ image_url: uploadedImageUrl }).eq("id", localItem.id)

    if (updateError) {
      return { data: null, error: updateError.message }
    }

    localItem.imageUrl = uploadedImageUrl
    localItem.signedUrl = await generateSignedUrl(uploadedImageUrl)
  }

  return { data: localItem, error: null }
}
