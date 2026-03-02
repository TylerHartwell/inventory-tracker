import { supabase } from "@/supabase-client"
import { uploadImage } from "../image/uploadImage"
import { Item, LocalItem, nullListName } from "@/components/ItemManager"
import { camelize, snakeify } from "../caseChanger"
import { deleteImageWithItemId } from "../image/deleteImageWithItemId"
import { generateSignedUrl } from "../generateSignedUrl"

interface UpdateItemParams {
  itemId: LocalItem["id"]
  itemImageUrl: LocalItem["imageUrl"]
  itemSignedUrl: LocalItem["signedUrl"]
  updatedFields: Partial<Item>
  updatedImageFile?: File | null
}

export const updateItem = async ({
  itemId,
  itemImageUrl,
  itemSignedUrl,
  updatedFields,
  updatedImageFile
}: UpdateItemParams): Promise<
  | { data: LocalItem; error: null }
  | {
      data: null
      error: string
    }
> => {
  const updatePayload = snakeify(updatedFields)

  if (updatedImageFile !== undefined) {
    if (itemImageUrl) {
      const { error: deleteExistingImageError } = await deleteImageWithItemId({
        itemId: itemId,
        imageUrl: itemImageUrl,
        shouldClearItemImageUrl: false
      })
      if (deleteExistingImageError) {
        return { data: null, error: deleteExistingImageError }
      }
    }

    if (updatedImageFile) {
      const { data: uploadedImageUrl, error: uploadImageError } = await uploadImage({
        file: updatedImageFile,
        itemId: itemId
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
    .eq("id", itemId)
    .select("*, lists(name)")
    .single()

  if (updateItemError || !updatedItemWListName) {
    return { data: null, error: updateItemError?.message || "Failed to update item" }
  }

  const { lists, ...updatedItem } = camelize(updatedItemWListName)

  const localItem: LocalItem = {
    ...updatedItem,
    signedUrl: itemImageUrl === updatedItem.imageUrl ? itemSignedUrl : updatedItem.imageUrl ? await generateSignedUrl(updatedItem.imageUrl) : null,
    listName: lists?.name ?? nullListName
  }

  return { data: localItem, error: null }
}
