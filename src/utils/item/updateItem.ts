import { supabase } from "@/supabase-client"
import { uploadImage } from "../image/uploadImage"
import { Item, LocalItem, nullListName } from "@/components/ItemManager"
import { camelize, snakeify } from "../caseChanger"
import { deleteImageWithItemId } from "../image/deleteImageWithItemId"
import { generateSignedUrl } from "../generateSignedUrl"

interface UpdateItemParams {
  item: LocalItem
  updatedFields: Partial<Item>
  itemImage?: File | null
}

export const updateItem = async ({
  item,
  updatedFields,
  itemImage
}: UpdateItemParams): Promise<
  | { data: LocalItem; error: null }
  | {
      data: null
      error: string
    }
> => {
  const updatePayload = snakeify(updatedFields)

  if (itemImage !== undefined) {
    if (item.imageUrl) {
      const { error: deleteExistingImageError } = await deleteImageWithItemId({
        itemId: item.id,
        imageUrl: item.imageUrl,
        shouldClearItemImageUrl: false
      })
      if (deleteExistingImageError) {
        return { data: null, error: deleteExistingImageError }
      }
    }

    if (itemImage) {
      const { data: uploadedImageUrl, error: uploadImageError } = await uploadImage({
        file: itemImage,
        itemId: item.id
      })
      if (uploadImageError || !uploadedImageUrl) {
        return { data: null, error: uploadImageError || "Image upload did not return an image url" }
      }
      updatePayload.image_url = uploadedImageUrl
    } else {
      updatePayload.image_url = null
    }
  }

  const { data: updatedItemWListName, error: updateItemError } = await supabase
    .from("items")
    .update(updatePayload)
    .eq("id", item.id)
    .select("*, lists(name)")
    .single()

  if (updateItemError || !updatedItemWListName) {
    return { data: null, error: updateItemError?.message || "Failed to update item" }
  }

  const { lists, ...updatedItem } = camelize(updatedItemWListName)

  const localItem: LocalItem = {
    ...updatedItem,
    signedUrl: item.imageUrl === updatedItem.imageUrl ? item.signedUrl : updatedItem.imageUrl ? await generateSignedUrl(updatedItem.imageUrl) : null,
    listName: lists?.name ?? nullListName
  }

  return { data: localItem, error: null }
}
