import { LocalItem } from "@/features/items/components/ItemManager"
import { generateSignedUrls } from "@/shared/utils/generateSignedUrl"

export async function refreshSignedUrls(items: Map<string, LocalItem>) {
  const refreshed = await Promise.all(
    [...items].map(async ([_id, item]) => {
      if (!item.imageUrls.length) return item
      const signedUrls = await generateSignedUrls(item.imageUrls)
      return { ...item, signedUrls }
    })
  )
  return new Map(refreshed.map(item => [item.id, item]))
}
