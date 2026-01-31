import { DBItem, List, LocalItem, nullListName } from "@/components/ItemManager"
import { supabase } from "@/supabase-client"
import { camelize } from "@/utils/camelize"
import { generateSignedUrl } from "@/utils/generateSignedUrl"
import { PostgrestResponse } from "@supabase/supabase-js"

type DBItemWithList = DBItem & {
  lists: Pick<List, "name"> | null
}

export const getItemsForListIds = async (userId: string, listIds: (string | null)[], signal?: AbortSignal): Promise<LocalItem[]> => {
  if (signal?.aborted || listIds.length === 0) return []

  const nonNullListIds = listIds.filter((id): id is string => id !== null)

  const queryPromises: Promise<PostgrestResponse<DBItemWithList>>[] = []

  if (listIds.includes(null)) {
    queryPromises.push(
      (async () =>
        supabase.from("items").select("*, lists(name)").is("list_id", null).eq("user_id", userId).order("created_at", { ascending: true }))()
    )
  }

  if (nonNullListIds.length > 0) {
    queryPromises.push(
      (async () => supabase.from("items").select("*, lists(name)").in("list_id", nonNullListIds).order("created_at", { ascending: true }))()
    )
  }

  const results = await Promise.all(queryPromises)

  for (const result of results) {
    if (result.error) throw result.error
  }

  const allDataDb = results.flatMap(result => result.data || [])
  const allData = camelize(allDataDb)

  const itemsWithListName = await Promise.all(
    allData.map(async item => {
      if (signal?.aborted) return null
      const signedUrl = item.imageUrl ? await generateSignedUrl(item.imageUrl) : null
      const { lists, ...rest } = item
      return {
        ...rest,
        signedUrl,
        listName: lists?.name ?? nullListName
      }
    })
  )

  return itemsWithListName.filter((i): i is NonNullable<typeof i> => i !== null)
}
