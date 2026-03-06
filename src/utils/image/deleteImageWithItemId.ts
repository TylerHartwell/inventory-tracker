import { supabase } from "@/supabase-client"
import { deleteImageFileByUrl } from "./deleteImageFileByUrl"

interface DeleteImageWithItemIdParams {
  itemId: string
  imageIds?: string[]
  imageUrls?: string[]
}

export const deleteImageWithItemId = async ({ itemId, imageIds, imageUrls }: DeleteImageWithItemIdParams) => {
  let resolvedImageRows: { id: string; image_url: string }[] = []

  if (imageIds && imageIds.length > 0) {
    const { data, error } = await supabase.from("item_images").select("id, image_url").eq("item_id", itemId).in("id", imageIds)

    if (error) {
      return { data: null, error: `Failed to fetch item_images by ids: ${error.message}` }
    }

    resolvedImageRows = data ?? []
  } else if (imageUrls && imageUrls.length > 0) {
    const { data, error } = await supabase.from("item_images").select("id, image_url").eq("item_id", itemId).in("image_url", imageUrls)

    if (error) {
      return { data: null, error: `Failed to fetch item_images by urls: ${error.message}` }
    }

    resolvedImageRows = data ?? []
  } else {
    const { data, error } = await supabase.from("item_images").select("id, image_url").eq("item_id", itemId)

    if (error) {
      return { data: null, error: `Failed to fetch item_images: ${error.message}` }
    }

    resolvedImageRows = data ?? []
  }

  if (!resolvedImageRows.length) {
    return { data: null, error: null }
  }

  for (const imageRow of resolvedImageRows) {
    const { error: deleteImageError } = await deleteImageFileByUrl({ imageUrl: imageRow.image_url })

    if (deleteImageError) {
      console.error("Image deletion failed for item", itemId, "with error:", deleteImageError)
      return { data: null, error: deleteImageError }
    }
  }

  const idsToDelete = resolvedImageRows.map(imageRow => imageRow.id)
  const { error: deleteRowsError } = await supabase.from("item_images").delete().eq("item_id", itemId).in("id", idsToDelete)

  if (deleteRowsError) {
    return { data: null, error: `Failed to delete item image rows: ${deleteRowsError.message}` }
  }

  return { data: null, error: null }
}
