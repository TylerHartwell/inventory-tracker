import { supabase } from "@/supabase-client"
import { deleteImageFileByUrl } from "./deleteImageFileByUrl"

interface DeleteImageWithItemIdParams {
  itemId: string
  imageUrl?: string | null
  shouldClearItemImageUrl?: boolean
}

export const deleteImageWithItemId = async ({ itemId, imageUrl, shouldClearItemImageUrl = true }: DeleteImageWithItemIdParams) => {
  let resolvedImageUrl = imageUrl

  // Fetch imageUrl only if we don't already have it
  if (!resolvedImageUrl) {
    const { data: item, error: fetchError } = await supabase.from("items").select("image_url").eq("id", itemId).single()

    if (fetchError) {
      return { data: null, error: `Failed to fetch item image_url: ${fetchError.message}` }
    }

    resolvedImageUrl = item?.image_url
  }

  // Nothing to delete
  if (!resolvedImageUrl) {
    console.log("No image URL to delete for item:", itemId)
    return { data: null, error: null }
  }

  // Delete image from storage
  const { error: deleteImageError } = await deleteImageFileByUrl({
    imageUrl: resolvedImageUrl
  })

  if (deleteImageError) {
    console.error("Image deletion failed for item", itemId, "with error:", deleteImageError)
    return { data: null, error: deleteImageError }
  }

  // Optionally clear imageUrl on item
  if (shouldClearItemImageUrl) {
    const { error: updateError } = await supabase
      .from("items")
      .update({ image_url: null }) // or image_url: null
      .eq("id", itemId)

    if (updateError) {
      const errorMsg = `Image deleted, but failed to clear item image_url: ${updateError.message}`
      console.error(errorMsg)
      return {
        data: null,
        error: errorMsg
      }
    }
  }

  console.log("Successfully deleted image from storage for item:", itemId)
  return { data: null, error: null }
}
