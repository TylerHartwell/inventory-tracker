import { LocalItem } from "@/components/ItemManager"
import { generateSignedUrl } from "./generateSignedUrl"

export async function refreshSignedUrls(items: Map<string, LocalItem>) {
  const refreshed = await Promise.all(
    [...items].map(async ([_id, item]) => {
      if (!item.imageUrl) return item
      const signedUrl = await generateSignedUrl(item.imageUrl)
      return { ...item, signedUrl }
    })
  )
  return new Map(refreshed.map(item => [item.id, item]))
}
