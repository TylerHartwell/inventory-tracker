import { supabase } from "@/supabase-client"
import { uploadImages } from "@/shared/utils/image/uploadImage"
import { Item, LocalItem, nullListName } from "@/features/items/components/ItemManager"
import { camelize, snakeify } from "@/shared/utils/caseChanger"
import { deleteImageWithItemId } from "@/features/items/utils/image/deleteImageWithItemId"
import { generateSignedUrls } from "@/shared/utils/generateSignedUrl"

interface UpdateItemParams {
  itemId: LocalItem["id"]
  updatedFields: Partial<Item>
  updatedImageFiles?: File[]
  deletedImageIds?: string[]
}

export const updateItem = async ({
  itemId,
  updatedFields,
  updatedImageFiles,
  deletedImageIds
}: UpdateItemParams): Promise<
  | { data: LocalItem; error: null }
  | {
      data: null
      error: string
    }
> => {
  const rawUpdatePayload = snakeify(updatedFields) as Record<string, unknown>
  const updatePayload = Object.fromEntries(Object.entries(rawUpdatePayload).filter(([, value]) => value !== undefined)) as Record<string, unknown>

  delete updatePayload["image_url"]

  if (deletedImageIds?.length) {
    const { error: deleteExistingImageError } = await deleteImageWithItemId({ itemId, imageIds: deletedImageIds })

    if (deleteExistingImageError) {
      return { data: null, error: deleteExistingImageError }
    }
  }

  if (updatedImageFiles?.length) {
    const { data: uploadedImageUrls, error: uploadImageError } = await uploadImages({ files: updatedImageFiles, itemId })

    if (uploadImageError || !uploadedImageUrls) {
      return { data: null, error: uploadImageError || "Image upload did not return image urls" }
    }

    const { data: existingImages, error: existingImagesError } = await supabase.from("item_images").select("id").eq("item_id", itemId)

    if (existingImagesError) {
      return { data: null, error: existingImagesError.message }
    }

    const displayOrderStart = existingImages?.length ?? 0
    const itemImageRows = uploadedImageUrls.map((imageUrl, index) => ({
      item_id: itemId,
      image_url: imageUrl,
      display_order: displayOrderStart + index
    }))

    const { error: insertItemImagesError } = await supabase.from("item_images").insert(itemImageRows)

    if (insertItemImagesError) {
      return { data: null, error: insertItemImagesError.message }
    }
  }

  const hasItemFieldUpdates = Object.keys(updatePayload).length > 0

  const itemQuery = supabase.from("items").select("*, lists(name), item_images(id, image_url, display_order, created_at)").eq("id", itemId).single()

  const { data: updatedItemWListName, error: updateItemError } = hasItemFieldUpdates
    ? await supabase
        .from("items")
        .update(updatePayload)
        .eq("id", itemId)
        .select("*, lists(name), item_images(id, image_url, display_order, created_at)")
        .single()
    : await itemQuery

  if (updateItemError || !updatedItemWListName) {
    return { data: null, error: updateItemError?.message || "Failed to update item" }
  }

  const { lists, ...updatedItem } = camelize(updatedItemWListName)
  const imageRows = [...(updatedItem.itemImages ?? [])].sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder
    }

    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })

  const imageUrls = imageRows.map(imageRow => imageRow.imageUrl)
  const imageIds = imageRows.map(imageRow => imageRow.id)
  const signedUrls = await generateSignedUrls(imageUrls)

  const { itemImages, ...updatedItemWithoutImages } = updatedItem

  const localItem: LocalItem = {
    ...updatedItemWithoutImages,
    imageUrls,
    imageIds,
    signedUrls,
    listName: lists?.name ?? nullListName
  }

  return { data: localItem, error: null }
}
