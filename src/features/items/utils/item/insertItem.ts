import { uploadImages } from "@/shared/utils/image/uploadImage"
import { supabase } from "@/supabase-client"
import { InsertableItem, LocalItem, nullListName } from "@/features/items/components/ItemManager"
import { camelize, snakeify } from "@/shared/utils/caseChanger"
import { generateSignedUrls } from "@/shared/utils/generateSignedUrl"

interface InsertItemParams {
  newItem: InsertableItem
  itemImages: File[]
}

export const insertItem = async ({
  newItem,
  itemImages
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
    imageUrls: [],
    imageIds: [],
    signedUrls: [],
    listName: lists?.name ?? nullListName,
    canEdit: true
  }

  if (itemImages.length) {
    const { data: uploadedImageUrls, error: uploadError } = await uploadImages({
      files: itemImages,
      itemId: localItem.id
    })

    if (uploadError || !uploadedImageUrls) {
      return { data: null, error: uploadError || "Image upload did not return an image url" }
    }

    const itemImageRows = uploadedImageUrls.map((imageUrl, index) => ({
      item_id: localItem.id,
      image_url: imageUrl,
      display_order: index
    }))

    const { data: insertedItemImages, error: itemImagesInsertError } = await supabase
      .from("item_images")
      .insert(itemImageRows)
      .select("id, image_url")

    if (itemImagesInsertError) {
      return { data: null, error: itemImagesInsertError.message }
    }

    const imageUrls = insertedItemImages?.map(itemImageRow => itemImageRow.image_url) ?? []
    localItem.imageUrls = imageUrls
    localItem.imageIds = insertedItemImages?.map(itemImageRow => itemImageRow.id) ?? []
    localItem.signedUrls = await generateSignedUrls(imageUrls)
  }

  return { data: localItem, error: null }
}
